<?php
require 'db_connect.php';

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de producto inválido.']);
    exit();
}

try {
    // Primero, obtener la URL de la imagen para poder borrar el archivo
    $stmt_img = $pdo->prepare("SELECT image_url FROM products WHERE product_id = ?");
    $stmt_img->execute([$id]);
    $product = $stmt_img->fetch();

    if ($product) {
        // Ahora, eliminar el producto de la base de datos
        $stmt_del = $pdo->prepare("DELETE FROM products WHERE product_id = ?");
        $stmt_del->execute([$id]);

        // Si se eliminó de la DB, intentar eliminar el archivo de imagen
        $image_url_to_delete = $product['image_url'];
        if ($image_url_to_delete && file_exists("..".$image_url_to_delete)) {
            unlink("..".$image_url_to_delete);
        }

        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Producto eliminado exitosamente.']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Producto no encontrado.']);
    }

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al eliminar el producto.', 'error' => $e->getMessage()]);
}
?>