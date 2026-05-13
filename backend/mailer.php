<?php
/**
 * ============================================
 * BEFREC Y ASOCIADOS - Envío SMTP sin librerías
 * Compatible con Namecheap cPanel / LiteSpeed
 * ============================================
 */

require_once __DIR__ . '/config.php';

/**
 * Envía un email HTML via SMTP con autenticación.
 *
 * @param string $toEmail    Destinatario (contacto@befrec.com)
 * @param string $subject    Asunto del correo
 * @param string $htmlBody   Cuerpo HTML
 * @param string $replyTo    Email del visitante (para que puedas responder)
 * @return bool              true si se envió, false si falló
 */
function enviarEmailSMTP(
    string $toEmail,
    string $subject,
    string $htmlBody,
    string $replyTo = ''
): bool {

    $host    = SMTP_HOST;
    $port    = SMTP_PORT;
    $user    = SMTP_USER;
    $pass    = SMTP_PASS;
    $from    = SMTP_USER;          // El From DEBE ser la cuenta SMTP
    $fromName = MAIL_NAME;

    // ── Conexión SSL al servidor SMTP ─────────
    $context = stream_context_create([
        'ssl' => [
            'verify_peer'       => false,
            'verify_peer_name'  => false,
            'allow_self_signed' => true,
        ]
    ]);

    $errno = 0; $errstr = '';
    $protocol = ($port === 465) ? 'ssl' : 'tcp';
    $socket = @stream_socket_client(
        "{$protocol}://{$host}:{$port}",
        $errno, $errstr, 15,
        STREAM_CLIENT_CONNECT, $context
    );

    if (!$socket) {
        error_log("[BEFREC SMTP] Conexión fallida a {$host}:{$port} — $errstr ($errno)");
        return false;
    }

    stream_set_timeout($socket, 10);

    // Helper: leer respuesta del servidor
    $read = function() use ($socket): string {
        $resp = '';
        while ($line = fgets($socket, 512)) {
            $resp .= $line;
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        return $resp;
    };

    // Helper: enviar comando y verificar código esperado
    $cmd = function(string $command, int $expected) use ($socket, $read): bool {
        fputs($socket, $command . "\r\n");
        $resp = $read();
        $code = (int) substr($resp, 0, 3);
        if ($code !== $expected) {
            error_log("[BEFREC SMTP] Comando '$command' esperaba $expected, obtuvo $code: $resp");
            return false;
        }
        return true;
    };

    // ── Handshake SMTP ────────────────────────
    $read(); // 220 greeting

    // STARTTLS solo en puerto 587
    if ($port === 587) {
        fputs($socket, "EHLO befrec.com\r\n");
        $read();
        if (!$cmd('STARTTLS', 220)) { fclose($socket); return false; }
        stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
    }

    if (!$cmd('EHLO befrec.com', 250)) {
        // Algunos servidores devuelven 250 multi-linea, leerlo bien ya lo hace $read()
        // Si falla intentar HELO
        if (!$cmd('HELO befrec.com', 250)) { fclose($socket); return false; }
    }

    // ── Autenticación LOGIN ───────────────────
    if (!$cmd('AUTH LOGIN', 334))          { fclose($socket); return false; }
    if (!$cmd(base64_encode($user), 334))  { fclose($socket); return false; }
    if (!$cmd(base64_encode($pass), 235))  { fclose($socket); return false; }

    // ── Sobre del correo ──────────────────────
    if (!$cmd("MAIL FROM: <{$from}>", 250))    { fclose($socket); return false; }
    if (!$cmd("RCPT TO: <{$toEmail}>", 250))   { fclose($socket); return false; }
    if (!$cmd('DATA', 354))                     { fclose($socket); return false; }

    // ── Cabeceras ─────────────────────────────
    $subjectEncoded = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $replyHeader    = $replyTo ? "Reply-To: {$replyTo}\r\n" : '';

    $mail  = "MIME-Version: 1.0\r\n";
    $mail .= "Content-Type: text/html; charset=UTF-8\r\n";
    $mail .= "From: {$fromName} <{$from}>\r\n";
    $mail .= "To: {$toEmail}\r\n";
    $mail .= "Subject: {$subjectEncoded}\r\n";
    $mail .= $replyHeader;
    $mail .= "X-Mailer: Befrec-PHP\r\n";
    $mail .= "\r\n";
    $mail .= $htmlBody;
    $mail .= "\r\n.\r\n";   // Fin del mensaje DATA

    fputs($socket, $mail);
    $dataResp = $read();
    $dataCode = (int) substr($dataResp, 0, 3);

    fputs($socket, "QUIT\r\n");
    fclose($socket);

    if ($dataCode !== 250) {
        error_log("[BEFREC SMTP] DATA falló ($dataCode): $dataResp");
        return false;
    }

    return true;
}
