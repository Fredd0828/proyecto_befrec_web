<?php
/**
 * ============================================
 * BEFREC Y ASOCIADOS - Generador de token CSRF
 * GET /backend/token.php  → devuelve { token: "..." }
 * ============================================
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/security.php';

setCorsHeaders();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false]);
    exit;
}

$token    = bin2hex(random_bytes(32));
$expires  = time() + 1800; // 30 minutos
$payload  = $token . '|' . $expires;
$hmac     = hash_hmac('sha256', $payload, CSRF_SECRET);
$signed   = base64_encode($payload . '|' . $hmac);

echo json_encode(['ok' => true, 'token' => $signed]);
