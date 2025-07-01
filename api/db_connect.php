<?php
// api/db_connect.php

// ... (tu configuración de conexión a la base de datos se queda igual) ...
$host = "localhost";
$db_name = "u329120676_Anteojos";
$username = "u329120676_gaston";
$password = "37311650.Gaston";
$charset = "utf8mb4";

// --- Headers para la Respuesta de la API ---
// AHORA el origen es el mismo, pero es buena práctica mantener los headers
// por si en el futuro quieres llamar a tu API desde otro sitio.
header("Access-Control-Allow-Origin: *"); // Permitir desde cualquier origen es lo más simple para debug
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
// ... (tu código de conexión con try/catch se queda igual) ...
try {
    $options = [ /* ... tus opciones de PDO ... */ ];
    $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=$charset", $username, $password, $options);
} catch (\PDOException $e) { /* ... tu manejo de error de conexión ... */ }
?>