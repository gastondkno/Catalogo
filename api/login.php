<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

include_once 'db_connect.php';

// --- Función para generar un JWT (JSON Web Token) simple ---
function generate_jwt($payload, $secret) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

// --- Lógica del Login ---
$data = json_decode(file_get_contents("php://input"));

// ¡CAMBIO IMPORTANTE! Añadimos una verificación para $data
if (!$data || empty($data->username) || empty($data->password)) {
    http_response_code(400); // Bad Request
    echo json_encode(["success" => false, "message" => "Usuario y contraseña son requeridos."]);
    exit();
}

try {
    $query = "SELECT id, usuario, contrasenia FROM administradores WHERE usuario = :usuario LIMIT 1";
    $stmt = $conexion->prepare($query);
    $stmt->bindParam(':usuario', $data->username);
    $stmt->execute();

    if ($stmt->rowCount() == 1) {
        $user = $stmt->fetch(); // fetch() es suficiente por el ATTR_DEFAULT_FETCH_MODE
        $hashed_password = $user['contrasenia'];

        if (password_verify($data->password, $hashed_password)) {
            
            $secret_key = "TuClaveSecretaSuperDificilDeAdivinar123!"; // Recuerda usar una clave segura y consistente
            $issuer_claim = "paleturquoise-guanaco-183994.hostingersite.com";
            $audience_claim = "paleturquoise-guanaco-183994.hostingersite.com";
            $issuedat_claim = time();
            $notbefore_claim = $issuedat_claim;
            $expire_claim = $issuedat_claim + (60 * 60 * 8); // Expira en 8 horas

            $payload = [
                "iss" => $issuer_claim,
                "aud" => $audience_claim,
                "iat" => $issuedat_claim,
                "nbf" => $notbefore_claim,
                "exp" => $expire_claim,
                "data" => ["id" => $user['id'], "username" => $user['usuario']]
            ];

            $jwt = generate_jwt($payload, $secret_key);

            http_response_code(200);
            echo json_encode([
                "success" => true,
                "message" => "Login exitoso.",
                "token" => $jwt
            ]);

        } else {
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Credenciales incorrectas."]);
        }
    } else {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Credenciales incorrectas."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    // Para depuración, podrías loguear el error: error_log($e->getMessage());
    echo json_encode(["success" => false, "message" => "Error del servidor."]);
}
?>