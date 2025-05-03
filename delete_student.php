<?php
header('Content-Type: application/json');
require 'db_connect.php';

$input = json_decode(file_get_contents('php://input'), true);
$id = isset($input['id']) ? (int)$input['id'] : null;

if (!$id) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Student ID is required.']);
    $conn->close();
    exit();
}

// الحذف سيقوم تلقائياً بحذف السجل المرتبط إذا تم إعداد FOREIGN KEY مع ON DELETE CASCADE
$stmt = $conn->prepare("DELETE FROM students WHERE id = ?");
 if (!$stmt) {
     http_response_code(500);
     echo json_encode(['status' => 'error', 'message' => 'Prepare failed: ' . $conn->error]);
     $conn->close(); exit();
}
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(['status' => 'success', 'message' => 'Student deleted successfully.']);
    } else {
        http_response_code(404); // Not Found
        echo json_encode(['status' => 'error', 'message' => 'Student not found.']);
    }
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to delete student: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
