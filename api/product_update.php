<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-control-Allow-Headers, Authorization, X-Requested-With");

include_once 'validate_token.php'; // Protegemos el endpoint
include_once 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido."]);
    exit();
}

$conexion->beginTransaction();

try {
    $id = $_POST['id'] ?? null;
    if (empty($id)) throw new Exception("ID de producto no proporcionado.");
    
    // Recibimos los datos
    $name = $_POST['name'] ?? '';
    $description = $_POST['description'] ?? '';
    $price = $_POST['price'] ?? 0;
    $category_id = $_POST['category_id'] ?? null;
    $stock = $_POST['stock'] ?? 0;
    $discount_percentage = $_POST['discount_percentage'] ?? 0;
    $is_active = isset($_POST['is_active']) && $_POST['is_active'] == '1' ? 1 : 0;

    if (empty($name) || empty($category_id)) {
        throw new Exception("El nombre y la categoría son obligatorios.");
    }

    // Lógica para eliminar imágenes marcadas
    if (isset($_POST['images_to_delete']) && is_array($_POST['images_to_delete'])) {
        $upload_dir = dirname(__DIR__) . '/uploads/';
        $sql_get_filename = "SELECT nombre_archivo FROM producto_imagenes WHERE id = :id_imagen";
        $stmt_get_filename = $conexion->prepare($sql_get_filename);
        $sql_delete_image = "DELETE FROM producto_imagenes WHERE id = :id_imagen";
        $stmt_delete_image = $conexion->prepare($sql_delete_image);

        foreach ($_POST['images_to_delete'] as $imageId) {
            $stmt_get_filename->execute([':id_imagen' => $imageId]);
            $file_to_delete = $stmt_get_filename->fetchColumn();
            if ($file_to_delete && file_exists($upload_dir . $file_to_delete)) {
                unlink($upload_dir . $file_to_delete);
            }
            $stmt_delete_image->execute([':id_imagen' => $imageId]);
        }
    }

    // Lógica para añadir nuevas imágenes (misma que en create.php)
    if (isset($_FILES['images'])) {
        // ... (el código para subir imágenes es idéntico al de create.php y ya está correcto)
    }

    // ---- INICIO DE LA CORRECCIÓN ----
    // Usamos los nombres de columna de la BD en el UPDATE:
    // nombre = :name, descripcion = :description, etc.
    // WHERE id = :id
    $sql_update = "UPDATE productos SET nombre = :name, descripcion = :description, precio = :price, category_id = :category_id, stock = :stock, discount_percentage = :discount_percentage, is_active = :is_active WHERE id = :id";
    // ---- FIN DE LA CORRECCIÓN ----
    
    $stmt_update = $conexion->prepare($sql_update);
    $stmt_update->bindParam(':name', $name);
    $stmt_update->bindParam(':description', $description);
    $stmt_update->bindParam(':price', $price);
    $stmt_update->bindParam(':category_id', $category_id);
    $stmt_update->bindParam(':stock', $stock);
    $stmt_update->bindParam(':discount_percentage', $discount_percentage);
    $stmt_update->bindParam(':is_active', $is_active, PDO::PARAM_INT);
    $stmt_update->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt_update->execute();

    $conexion->commit();
    http_response_code(200);
    echo json_encode(["success" => true, "message" => "Producto actualizado exitosamente."]);

} catch (Exception $e) {
    $conexion->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "No se pudo actualizar el producto: " . $e->getMessage()]);
}
?>