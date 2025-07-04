<?php
// ¡USA UNA CONTRASEÑA FUERTE Y ÚNICA AQUÍ!
$password_plano = "123";

// Generar el hash de la contraseña
$hash_contrasenia = password_hash($password_plano, PASSWORD_DEFAULT);

echo "<h3>Usuario Administrador Seguro</h3>";
echo "<p>Tu nombre de usuario será: <strong>admin</strong></p>";
echo "<p>La contraseña que elegiste es: <strong>" . htmlspecialchars($password_plano) . "</strong></p>";
echo "<p>Copia y ejecuta la siguiente consulta SQL en tu phpMyAdmin para insertar el usuario:</p>";
echo "<pre style='background-color:#f0f0f0; border:1px solid #ccc; padding:10px; border-radius:5px;'>";
echo "INSERT INTO administradores (usuario, contrasenia) VALUES ('admin', '" . $hash_contrasenia . "');";
echo "</pre>";
echo "<p style='color:red;'><strong>¡IMPORTANTE! Una vez que hayas ejecutado la consulta, BORRA este archivo (_create_secure_admin.php) del servidor.</strong></p>";
?>