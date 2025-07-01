<?php
// api/product_update.php
require 'db_connect.php';

ini_set('display_errors', 1);
error_reporting(E_ALL);

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de producto inválido.']);
    exit();
}

try {
    $stmt_old = $pdo->prepare("SELECT image_url FROM products WHERE product_id = ?");
    $stmt_old->execute([$id]);
    $old_product = $stmt_old->fetch();
    if (!$old_product) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Producto no encontrado.']);
        exit();
    }
    $old_image_url = $old_product['image_url'];
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al buscar el producto existente.']);
    exit();
}

$image_url = $old_image_url;

if (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
    $target_dir = "../uploads/";
    if (!file_exists($target_dir)) { mkdir($target_dir, 0755, true); }
    $file_extension = strtolower(pathinfo($_FILES["image"]["name"], PATHINFO_EXTENSION));
    $new_filename = "product-" . time() . "-" . bin2hex(random_bytes(8)) . "." . $file_extension;
    $target_file = $target_dir . $new_filename;
    
    if (move_uploaded_file($_FILES["image"]["tmp_name"], $target_file)) {
        $image_url = "/uploads/" . $new_filename;
        if ($old_image_url && file_exists("..".$old_image_url)) {
            unlink("..".$old_image_url);
        }
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al subir la nueva imagen.']);
        exit();
    }
}

$name = htmlspecialchars(strip_tags($_POST['name']));
$description = isset($_POST['description']) ? htmlspecialchars(strip_tags($_POST['description'])) : '';
$price = floatval($_POST['price']);
$category_id = intval($_POST['category_id']);
$stock = isset($_POST['stock']) ? intval($_POST['stock']) : 0;
$discount_percentage = isset($_POST['discount_percentage']) ? floatval($_POST['discount_percentage']) : 0.00;
$is_active = isset($_POST['is_active']) && ($_POST['is_active'] === 'true' || $_POST['is_active'] === '1') ? 1 : 0;

try {
    $query = "UPDATE products SET 
                name = ?, 
                description = ?, 
                price = ?, 
                category_id = ?, 
                image_url = ?, 
                stock = ?, 
                discount_percentage = ?, 
                is_active = ? 
              WHERE 
                product_id = ?";
                
    $stmt = $pdo->prepare($query);
    $stmt->execute([$name, $description, $price, $category_id, $image_url, $stock, $discount_percentage, $is_active, $id]);

    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Producto actualizado exitosamente.']);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error al actualizar el producto.', 
        'error_details' => $e->getMessage()
    ]);
}
?>