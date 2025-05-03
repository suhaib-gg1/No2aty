<?php
header('Content-Type: application/json');
require 'db_connect.php'; // تضمين ملف الاتصال

$students = [];
$sql = "SELECT id, name, class, points FROM students ORDER BY points DESC, name ASC"; // ترتيب حسب النقاط ثم الاسم
$result = $conn->query($sql);

if ($result) {
    while($row = $result->fetch_assoc()) {
        // تحويل النقاط إلى رقم إذا كانت مخزنة كنص (الأفضل تخزينها كرقم)
        $row['id'] = (int)$row['id'];
        $row['points'] = (int)$row['points'];
        $students[] = $row;
    }
    echo json_encode(['status' => 'success', 'students' => $students]);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to load students: ' . $conn->error]);
}

$conn->close();
?>
