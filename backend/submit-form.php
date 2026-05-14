<?php
/**
 * ============================================
 * BEFREC Y ASOCIADOS - Endpoint formulario
 * POST /backend/submit-form.php
 * ============================================
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/mailer.php';

// Cabeceras
setCorsHeaders();
header('Content-Type: application/json; charset=utf-8');

// ── Solo POST ─────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido.']);
    exit;
}

// ── Leer JSON del body ────────────────────────
$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Datos inválidos.']);
    exit;
}

// ── Validar token CSRF ────────────────────────
$csrfToken = $body['csrf_token'] ?? '';
if (!validateCsrfToken($csrfToken)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Token de seguridad inválido o expirado.']);
    exit;
}

// ── Honeypot (campo trampa para bots) ─────────
if (!empty($body['website'])) {
    // Bot detectado: responder OK para no revelar la protección
    echo json_encode(['ok' => true]);
    exit;
}

// ── Sanitizar campos ──────────────────────────
$nombre   = sanitize($body['nombre']   ?? '');
$email    = sanitizeEmail($body['email'] ?? '');
$telefono = sanitize($body['telefono'] ?? '');
$servicio = sanitize($body['servicio'] ?? '');
$mensaje  = sanitize($body['mensaje']  ?? '');
$ip       = getClientIp();

// ── Validar campos ────────────────────────────
$errors = [];
if (!validateNombre($nombre))     $errors[] = 'Nombre inválido.';
if (!validateEmail($email))       $errors[] = 'Correo electrónico inválido.';
if (!validateTelefono($telefono)) $errors[] = 'Teléfono inválido.';
if (!validateServicio($servicio)) $errors[] = 'Servicio no válido.';
if (!validateMensaje($mensaje))   $errors[] = 'Mensaje muy corto o muy largo.';

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'errors' => $errors]);
    exit;
}

// ── Conexión BD ───────────────────────────────
$pdo = getDB();

// ── Rate limiting ─────────────────────────────
if (!checkRateLimit($pdo, $ip)) {
    http_response_code(429);
    echo json_encode([
        'ok'    => false,
        'error' => 'Demasiados intentos. Por favor espera un momento.'
    ]);
    exit;
}

// ── Guardar en BD ─────────────────────────────
try {
    $stmt = $pdo->prepare("
        INSERT INTO contactos (nombre, email, telefono, servicio, mensaje, ip_address)
        VALUES (:nombre, :email, :telefono, :servicio, :mensaje, :ip)
    ");
    $stmt->execute([
        ':nombre'   => $nombre,
        ':email'    => $email,
        ':telefono' => $telefono,
        ':servicio' => $servicio,
        ':mensaje'  => $mensaje,
        ':ip'       => $ip,
    ]);
    $contactoId = $pdo->lastInsertId();
} catch (PDOException $e) {
    error_log('[BEFREC Insert Error] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Error al guardar el mensaje.']);
    exit;
}

// ── Enviar email de notificación ──────────────
enviarNotificacion($nombre, $email, $telefono, $servicio, $mensaje, $contactoId);

// ── Respuesta exitosa ─────────────────────────
echo json_encode([
    'ok'      => true,
    'message' => '¡Mensaje enviado! Nos pondremos en contacto contigo pronto.'
]);

// ── Función de email ──────────────────────────
function enviarNotificacion(
    string $nombre, string $email, string $telefono,
    string $servicio, string $mensaje, string $id
): void {
    $servicioLabel = [
        'contabilidad' => 'Contabilidad Integral',
        'declaracion'  => 'Declaración de Renta',
        'nomina'       => 'Gestión de Nómina',
        'estados'      => 'Estados Financieros',
        'asesoria'     => 'Asesoría Empresarial',
        'certificados' => 'Certificados Contables',
        'otro'         => 'Otro',
        ''             => 'No especificado',
    ][$servicio] ?? 'No especificado';

    $fecha   = date('d/m/Y H:i');
    $asunto  = "Nuevo contacto #$id — $nombre | Befrec y Asociados";

    $cuerpo = "
    <!DOCTYPE html>
    <html lang='es'>
    <head><meta charset='UTF-8'></head>
    <body style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;'>
      <div style='background:#1c1c1c;padding:20px;border-radius:8px 8px 0 0;'>
        <h2 style='color:#fee402;margin:0;'>Befrec y Asociados</h2>
        <p style='color:#fff;margin:4px 0 0;font-size:14px;'>Nuevo mensaje de contacto</p>
      </div>
      <div style='border:1px solid #e0e0e0;border-top:none;padding:24px;border-radius:0 0 8px 8px;'>
        <table style='width:100%;border-collapse:collapse;'>
          <tr><td style='padding:8px 0;color:#888;width:140px;'>ID</td>
              <td style='padding:8px 0;font-weight:bold;'>#$id</td></tr>
          <tr><td style='padding:8px 0;color:#888;'>Fecha</td>
              <td style='padding:8px 0;'>$fecha</td></tr>
          <tr><td style='padding:8px 0;color:#888;'>Nombre</td>
              <td style='padding:8px 0;'>$nombre</td></tr>
          <tr><td style='padding:8px 0;color:#888;'>Email</td>
              <td style='padding:8px 0;'><a href='mailto:$email'>$email</a></td></tr>
          <tr><td style='padding:8px 0;color:#888;'>Teléfono</td>
              <td style='padding:8px 0;'>" . ($telefono ?: '—') . "</td></tr>
          <tr><td style='padding:8px 0;color:#888;'>Servicio</td>
              <td style='padding:8px 0;'>$servicioLabel</td></tr>
        </table>
        <hr style='border:none;border-top:1px solid #e0e0e0;margin:16px 0;'>
        <p style='color:#888;margin:0 0 8px;'>Mensaje:</p>
        <p style='background:#f5f5f5;padding:16px;border-radius:6px;margin:0;line-height:1.6;'>
          " . nl2br(htmlspecialchars($mensaje)) . "
        </p>
        <div style='margin-top:24px;'>
          <a href='mailto:$email?subject=Re: Consulta contable — Befrec y Asociados'
             style='background:#fee402;color:#1c1c1c;padding:12px 24px;border-radius:6px;
                    text-decoration:none;font-weight:bold;display:inline-block;'>
            Responder a $nombre
          </a>
        </div>
      </div>
      <p style='color:#bbb;font-size:12px;text-align:center;margin-top:16px;'>
        Befrec y Asociados · Cra 88d 6d 27, Bogotá · contacto@befrec.com
      </p>
    </body>
    </html>
    ";

    $enviado = enviarEmailSMTP(MAIL_TO, $asunto, $cuerpo, $email);

    if (!$enviado) {
        // Si SMTP falla, intentar mail() como respaldo
        $headers  = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: " . MAIL_NAME . " <" . SMTP_USER . ">\r\n";
        $headers .= "Reply-To: $email\r\n";
        @mail(MAIL_TO, $asunto, $cuerpo, $headers, '-f' . SMTP_USER);
    }
}
