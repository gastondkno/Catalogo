<?php

// --- INICIO: BLOQUE DE CONFIGURACIÓN DE ERRORES (AÑADIR ESTO) ---
// En un entorno de desarrollo, podrías mostrar errores.
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);

// En un entorno de producción (como Hostinger), es mejor ocultarlos y loguearlos.
ini_set('display_errors', 0);
ini_set('log_errors', 1);
// Opcional: define un archivo de log personalizado si quieres
// ini_set('error_log', dirname(__DIR__) . '/php-errors.log');
error_reporting(E_ALL);
// --- FIN: BLOQUE DE CONFIGURACIÓN DE ERRORES ---


// Nombre de host, generalmente 'localhost' en Hostinger
$host = "localhost"; 

// El nombre COMPLETO de tu base de datos
$bd = "u329120676_catalogo_digit"; 

// El usuario que creaste para esa base de datos
$usuario = "u329120676_joaco"; // O el nombre completo con prefijo si lo tiene

// La contraseña que definiste para ese usuario al crearlo
$contrasenia = "37311650.Gaston"; 

try {
    // No cambies esta línea
    $conexion = new PDO("mysql:host=$host;dbname=$bd", $usuario, $contrasenia, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // Buena práctica
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'utf8mb4'" // Asegurar UTF-8
    ]);

} catch (PDOException $ex) {
    // Si la conexión a la BD falla, debemos enviar una respuesta JSON también
    http_response_code(503); // Service Unavailable
    echo json_encode([
        "success" => false,
        "message" => "Error de conexión a la base de datos. Por favor, intente más tarde."
    ]);
    exit();
}
?>