<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, PUT");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// ¡AÑADIR ESTA LÍNEA AL PRINCIPIO!
include_once 'validate_token.php';

include_once 'db_connect.php';

// Obtener el ID de la URL y los datos del cuerpo de la petición
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$data = json_decode(file_get_contents("php://input"));

if ($id <= 0 || empty($data->name)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID de categoría inválido o nombre vacío."]);
    exit();
}

try {
    $query = "UPDATE categories SET name = :name, description = :description WHERE category_id = :id";
    $stmt = $conexion->prepare($query);

    $name = htmlspecialchars(strip_tags($data->name));
    $description = isset($data->description) ? htmlspecialchars(strip_tags($data->description)) : '';

    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':description', $description);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);

    if ($stmt->execute()) {
        // Verificar si alguna fila fue realmente afectada
        if ($stmt->rowCount() > 0) {
            echo json_encode(["success" => true, "message" => "Categoría actualizada exitosamente."]);
        } else {
            echo json_encode(["success" => true, "message" => "No se realizaron cambios en la categoría (los datos eran los mismos)."]);
        }
    } else {
        throw new Exception("Error al ejecutar la actualización.");
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "No se pudo actualizar la categoría."]);
}
?>