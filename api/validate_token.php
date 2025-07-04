<?php
// --- Función para validar un JWT simple ---
function validate_jwt($jwt, $secret) {
    list($header64, $payload64, $signature64) = explode('.', $jwt);

    // Verificar la firma
    $signature = base64_decode(str_replace(['-', '_'], ['+', '/'], $signature64));
    $expectedSignature = hash_hmac('sha256', $header64 . "." . $payload64, $secret, true);

    if (!hash_equals($expectedSignature, $signature)) {
        return null; // Firma inválida
    }
    
    $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload64)), true);

    // Verificar expiración
    if ($payload['exp'] < time()) {
        return null; // Token expirado
    }

    return $payload; // Token válido
}

// --- Lógica del Guardián ---
$all_headers = getallheaders();
$auth_header = $all_headers['Authorization'] ?? null;

if (!$auth_header) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Acceso denegado. Token no proporcionado."]);
    exit();
}

list($type, $token) = explode(' ', $auth_header, 2);

if (strcasecmp($type, "Bearer") != 0) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Formato de token inválido."]);
    exit();
}

$secret_key = "TuClaveSecretaSuperDificilDeAdivinar123!"; // Debe ser la MISMA clave secreta que en login.php

$payload = validate_jwt($token, $secret_key);

if (!$payload) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Acceso denegado. Token inválido o expirado."]);
    exit();
}

// Si llegamos aquí, el token es válido. La variable $payload está disponible
// para el script que incluyó a este guardián, con los datos del usuario.
// Ejemplo: $user_id = $payload['data']['id'];
?>