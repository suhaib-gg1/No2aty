<?php
// إعدادات رأس الطلب
header("Content-Type: application/json");

// مسار حفظ البيانات
$file = 'students.json';

// إذا كانت هناك بيانات POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = file_get_contents("php://input");
    if ($data) {
        file_put_contents($file, $data);
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "لا توجد بيانات مرسلة"]);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($file)) {
        echo file_get_contents($file);
    } else {
        echo json_encode(["students" => []]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "طلب غير مدعوم"]);
}
?>
