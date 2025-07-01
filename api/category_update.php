<?php
require 'db_connect.php';

$data = json_decode(file_get_contents("php://input"));
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id <= 0 || !isset($data->name) || empty($data->name)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de categoría y nombre son requeridos.']);
    exit();
}

$name = htmlspecialchars(strip_tags($data->name));
$description = isset($data->description) ? htmlspecialchars(strip_tags($data->description)) : '';

try {
    $stmt = $pdo->prepare("UPDATE categories SET name = ?, description = ? WHERE category_id = ?");
    $stmt->execute([$name, $description, $id]);

    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Categoría actualizada exitosamente.']);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al actualizar la categoría.', 'error' => $e->getMessage()]);
}
?>