<?php
require 'db_connect.php';

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de categoría inválido.']);
    exit();
}

// Opcional pero recomendado: Reasignar productos de esta categoría a una categoría "Sin categoría"
// o impedir la eliminación si hay productos asociados.
// Por simplicidad, aquí solo la eliminamos.

try {
    $stmt = $pdo->prepare("DELETE FROM categories WHERE category_id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount()) {
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Categoría eliminada exitosamente.']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Categoría no encontrada.']);
    }

} catch (\PDOException $e) {
    http_response_code(500);
    // Podría fallar por restricciones de clave foránea si hay productos usándola
    echo json_encode(['success' => false, 'message' => 'Error al eliminar la categoría. Asegúrese de que no esté en uso.', 'error' => $e->getMessage()]);
}
?>