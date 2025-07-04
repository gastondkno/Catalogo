<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
// ¡AÑADIR ESTA LÍNEA AL PRINCIPIO!
include_once 'validate_token.php';

include_once 'db_connect.php';
// Cuando implementemos el login seguro, aquí irá: include_once 'validate_token.php';

// Leer los datos JSON enviados desde el frontend
$data = json_decode(file_get_contents("php://input"));

// Validar que los datos necesarios están presentes
if (empty($data->name)) {
    http_response_code(400); // Bad Request
    echo json_encode(["success" => false, "message" => "El nombre de la categoría es obligatorio."]);
    exit();
}

try {
    $query = "INSERT INTO categories (name, description) VALUES (:name, :description)";
    $stmt = $conexion->prepare($query);

    // Limpiar los datos para prevenir XSS (aunque PDO ya previene inyección SQL)
    $name = htmlspecialchars(strip_tags($data->name));
    $description = isset($data->description) ? htmlspecialchars(strip_tags($data->description)) : '';

    // Vincular los parámetros
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':description', $description);

    if ($stmt->execute()) {
        http_response_code(201); // Created
        echo json_encode(["success" => true, "message" => "Categoría creada exitosamente."]);
    } else {
        throw new Exception("Error al ejecutar la consulta.");
    }

} catch (Exception $e) {
    http_response_code(500); // Internal Server Error
    // Podrías registrar el error real en un log: error_log($e->getMessage());
    echo json_encode(["success" => false, "message" => "No se pudo crear la categoría."]);
}
?>