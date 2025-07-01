<?php
require 'db_connect.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->name) || empty($data->name)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El nombre de la categoría es requerido.']);
    exit();
}

$name = htmlspecialchars(strip_tags($data->name));
$description = isset($data->description) ? htmlspecialchars(strip_tags($data->description)) : '';

try {
    $stmt = $pdo->prepare("INSERT INTO categories (name, description) VALUES (?, ?)");
    $stmt->execute([$name, $description]);

    http_response_code(201); // 201 Created
    echo json_encode(['success' => true, 'message' => 'Categoría creada exitosamente.', 'id' => $pdo->lastInsertId()]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al crear la categoría.', 'error' => $e->getMessage()]);
}
?>