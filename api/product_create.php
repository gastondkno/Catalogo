<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once 'validate_token.php'; // Protegemos el endpoint
include_once 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido."]);
    exit();
}

$conexion->beginTransaction();

try {
    // Recibimos los datos con los nombres que envía el JS ('name', 'description', 'price')
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
    
    // ---- INICIO DE LA CORRECCIÓN ----
    // Usamos los nombres de columna de la BD en el INSERT:
    // nombre, descripcion, precio, etc.
    $sql_producto = "INSERT INTO productos (nombre, descripcion, precio, category_id, stock, discount_percentage, is_active) VALUES (:name, :description, :price, :category_id, :stock, :discount_percentage, :is_active)";
    // ---- FIN DE LA CORRECCIÓN ----

    $stmt_producto = $conexion->prepare($sql_producto);
    
    // Vinculamos los datos recibidos a los placeholders de la consulta
    $stmt_producto->bindParam(':name', $name);
    $stmt_producto->bindParam(':description', $description);
    $stmt_producto->bindParam(':price', $price);
    $stmt_producto->bindParam(':category_id', $category_id);
    $stmt_producto->bindParam(':stock', $stock);
    $stmt_producto->bindParam(':discount_percentage', $discount_percentage);
    $stmt_producto->bindParam(':is_active', $is_active, PDO::PARAM_INT);
    $stmt_producto->execute();
    
    $idProducto = $conexion->lastInsertId();

    if (isset($_FILES['images'])) {
        $upload_dir = dirname(__DIR__) . '/uploads/';
        if (!is_dir($upload_dir)) mkdir($upload_dir, 0755, true);

        foreach ($_FILES['images']['tmp_name'] as $key => $tmp_name) {
            if ($_FILES['images']['error'][$key] === UPLOAD_ERR_OK) {
                $file_name = $_FILES['images']['name'][$key];
                $file_tmp = $_FILES['images']['tmp_name'][$key];
                $extension = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
                $allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

                if (in_array($extension, $allowed_extensions)) {
                    $unique_name = 'prod_' . $idProducto . '_' . uniqid() . '.' . $extension;
                    $destination = $upload_dir . $unique_name;

                    if (move_uploaded_file($file_tmp, $destination)) {
                        $sql_imagen = "INSERT INTO producto_imagenes (id_producto, nombre_archivo, orden) VALUES (:id_producto, :nombre_archivo, :orden)";
                        $stmt_imagen = $conexion->prepare($sql_imagen);
                        $stmt_imagen->bindParam(':id_producto', $idProducto);
                        $stmt_imagen->bindParam(':nombre_archivo', $unique_name);
                        $stmt_imagen->bindParam(':orden', $key);
                        $stmt_imagen->execute();
                    }
                }
            }
        }
    }

    $conexion->commit();
    http_response_code(201);
    echo json_encode(["success" => true, "message" => "Producto agregado exitosamente."]);

} catch (Exception $e) {
    $conexion->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "No se pudo crear el producto: " . $e->getMessage()]);
}
?>