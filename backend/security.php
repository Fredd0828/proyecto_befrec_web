<?php
/**
 * ============================================
 * BEFREC Y ASOCIADOS - Funciones de seguridad
 * ============================================
 */

require_once __DIR__ . '/config.php';

// ── CORS ─────────────────────────────────────
function setCorsHeaders(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, ALLOWED_ORIGINS, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    }
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
    header('Access-Control-Max-Age: 86400');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// ── Validar token CSRF ────────────────────────
function validateCsrfToken(string $signed): bool {
    $decoded = base64_decode($signed, true);
    if ($decoded === false) return false;

    $parts = explode('|', $decoded);
    if (count($parts) !== 3) return false;

    [$token, $expires, $hmac] = $parts;

    // Verificar expiración
    if (time() > (int)$expires) return false;

    // Verificar firma HMAC
    $expected = hash_hmac('sha256', $token . '|' . $expires, CSRF_SECRET);
    return hash_equals($expected, $hmac);
}

// ── Rate limiting por IP (tabla MySQL) ────────
function checkRateLimit(PDO $pdo, string $ip): bool {
    // Limpiar registros viejos
    $pdo->prepare("DELETE FROM rate_limits WHERE created_at < DATE_SUB(NOW(), INTERVAL ? SECOND)")
        ->execute([RATE_LIMIT_WIN]);

    // Contar intentos recientes
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM rate_limits WHERE ip_address = ?");
    $stmt->execute([$ip]);
    $count = (int)$stmt->fetchColumn();

    if ($count >= RATE_LIMIT_MAX) return false;

    // Registrar intento
    $pdo->prepare("INSERT INTO rate_limits (ip_address) VALUES (?)")
        ->execute([$ip]);

    return true;
}

// ── Sanitización ──────────────────────────────
function sanitize(string $value): string {
    return trim(strip_tags($value));
}

function sanitizeEmail(string $email): string {
    return filter_var(trim($email), FILTER_SANITIZE_EMAIL);
}

// ── Obtener IP real del visitante ─────────────
function getClientIp(): string {
    $keys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
    foreach ($keys as $key) {
        if (!empty($_SERVER[$key])) {
            $ip = trim(explode(',', $_SERVER[$key])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE)) {
                return $ip;
            }
        }
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

// ── Validaciones ──────────────────────────────
function validateNombre(string $v): bool {
    return strlen($v) >= 2 && strlen($v) <= 100 &&
           preg_match('/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\.]+$/u', $v);
}

function validateEmail(string $v): bool {
    return (bool)filter_var($v, FILTER_VALIDATE_EMAIL) && strlen($v) <= 150;
}

function validateTelefono(string $v): bool {
    return empty($v) || preg_match('/^\+?[\d\s\-\(\)]{7,20}$/', $v);
}

function validateServicio(string $v): bool {
    $allowed = ['', 'contabilidad', 'declaracion', 'nomina', 'estados',
                'asesoria', 'certificados', 'otro'];
    return in_array($v, $allowed, true);
}

function validateMensaje(string $v): bool {
    return strlen($v) >= 10 && strlen($v) <= 2000;
}
