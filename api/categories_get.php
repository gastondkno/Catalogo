<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once 'db_connect.php';

try {
    // CORRECCIÓN AQUÍ: Asegurarnos de usar los nombres de columna correctos de la tabla 'categories'
    $query = "SELECT category_id, name, description FROM categories ORDER BY name ASC";
    
    $stmt = $conexion->prepare($query);
    $stmt->execute();
    
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // El frontend espera `category_id`, lo cual ya es correcto. No se necesitan más cambios.
    echo json_encode($categories);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error al obtener categorías: " . $e->getMessage()]);
}
?>