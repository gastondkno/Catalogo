<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// ¡AÑADIR ESTA LÍNEA AL PRINCIPIO!
include_once 'validate_token.php';

include_once 'db_connect.php';
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID de categoría inválido."]);
    exit();
}

try {
    // Opcional: Verificar si hay productos usando esta categoría antes de borrar
    $check_query = "SELECT COUNT(*) FROM productos WHERE category_id = :id";
    $check_stmt = $conexion->prepare($check_query);
    $check_stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $check_stmt->execute();
    if ($check_stmt->fetchColumn() > 0) {
        http_response_code(409); // Conflict
        echo json_encode(["success" => false, "message" => "No se puede eliminar la categoría porque tiene productos asociados."]);
        exit();
    }

    // Si no hay productos, proceder a eliminar
    $query = "DELETE FROM categories WHERE category_id = :id";
    $stmt = $conexion->prepare($query);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Categoría eliminada exitosamente."]);
    } else {
         throw new Exception("Error al ejecutar la eliminación.");
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "No se pudo eliminar la categoría."]);
}
?>