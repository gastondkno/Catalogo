<?php
// api/product_create.php
require 'db_connect.php';

// Para ver errores detallados durante el desarrollo
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Validación de campos requeridos
if (empty($_POST['name']) || !isset($_POST['price']) || empty($_POST['category_id'])) {
    http_response_code(400); 
    echo json_encode(['success' => false, 'message' => 'Nombre, precio y categoría son requeridos.']); 
    exit();
}
if (!isset($_FILES['image']) || $_FILES['image']['error'] != 0) {
    http_response_code(400); 
    echo json_encode(['success' => false, 'message' => 'La imagen del producto es requerida.']); 
    exit();
}

// --- Proceso de Subida de Imagen ---
$target_dir = "../uploads/"; 
if (!file_exists($target_dir)) { mkdir($target_dir, 0755, true); }

$file_extension = strtolower(pathinfo($_FILES["image"]["name"], PATHINFO_EXTENSION));
$new_filename = "product-" . time() . "-" . bin2hex(random_bytes(8)) . "." . $file_extension;
$target_file = $target_dir . $new_filename;

if (move_uploaded_file($_FILES["image"]["tmp_name"], $target_file)) {
    $image_url = "/uploads/" . $new_filename;
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al subir la imagen al servidor.']);
    exit();
}

// --- Recopilar datos del formulario ---
$name = htmlspecialchars(strip_tags($_POST['name']));
$description = isset($_POST['description']) ? htmlspecialchars(strip_tags($_POST['description'])) : '';
$price = floatval($_POST['price']);
$category_id = intval($_POST['category_id']);
$stock = isset($_POST['stock']) ? intval($_POST['stock']) : 0;
$discount_percentage = isset($_POST['discount_percentage']) ? floatval($_POST['discount_percentage']) : 0.00;
$is_active = isset($_POST['is_active']) && ($_POST['is_active'] === 'true' || $_POST['is_active'] === '1') ? 1 : 0;

try {
    $query = "INSERT INTO products 
                (name, description, price, category_id, image_url, stock, discount_percentage, is_active) 
              VALUES 
                (?, ?, ?, ?, ?, ?, ?, ?)";
              
    $stmt = $pdo->prepare($query);
    $stmt->execute([$name, $description, $price, $category_id, $image_url, $stock, $discount_percentage, $is_active]);

    http_response_code(201);
    echo json_encode(['success' => true, 'message' => 'Producto creado exitosamente.', 'id' => $pdo->lastInsertId()]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error al ejecutar la consulta SQL para crear el producto.', 
        'error_details' => $e->getMessage()
    ]);
}
?>