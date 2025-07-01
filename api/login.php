<?php
// api/login.php

// Incluir el archivo de conexión a la base de datos y los headers
require 'db_connect.php'; // Esto es importante para los headers de CORS, aunque no usemos $pdo aquí

// --- Credenciales del Administrador (Hardcodeadas) ---
// Estas son las credenciales que el administrador usará para iniciar sesión
$admin_username = "admin";
$admin_password = "123"; // Puedes cambiar esta contraseña si lo deseas

// --- Lógica del Login ---

// Obtener los datos del cuerpo de la petición (enviados como JSON desde el frontend)
$data = json_decode(file_get_contents("php://input"));

// Validar que se recibieron el usuario y la contraseña
if (!isset($data->username) || !isset($data->password)) {
    http_response_code(400); // Bad Request
    echo json_encode(["success" => false, "message" => "Por favor, ingrese nombre de usuario y contraseña."]);
    exit();
}

// Limpiar los datos (básica seguridad)
$username = htmlspecialchars(strip_tags($data->username));
$password = htmlspecialchars(strip_tags($data->password));

// Comparar con las credenciales hardcodeadas
if ($username === $admin_username && $password === $admin_password) {
    // Si las credenciales son correctas, generamos un token falso (para esta demo)
    // En una aplicación real, usarías una librería para generar un JWT (JSON Web Token)
    $fake_token = base64_encode(random_bytes(32)); // Un token aleatorio simple

    http_response_code(200); // OK
    echo json_encode([
        "success" => true,
        "message" => "Login exitoso.",
        "token"   => $fake_token, // Enviamos el token al frontend
        "user"    => [ // Enviamos información simulada del usuario
            "username" => $admin_username,
            "role"     => "admin"
        ]
    ]);
} else {
    // Si las credenciales son incorrectas
    http_response_code(401); // Unauthorized
    echo json_encode(["success" => false, "message" => "Credenciales inválidas."]);
}
?>