<?php
header('Content-Type: application/json');
require 'db_connect.php';

// استقبال البيانات المرسلة كـ JSON
$input = json_decode(file_get_contents('php://input'), true);

$id = isset($input['id']) ? (int)$input['id'] : null;
$name = isset($input['name']) ? trim($input['name']) : null;
$studentClass = isset($input['class']) ? trim($input['class']) : null;
$points = isset($input['points']) ? (int)$input['points'] : 0;
// قد تحتاج لتمرير بيانات السجل أيضًا إذا كنت تريد إدارتها هنا
// $history = isset($input['history']) ? $input['history'] : [];

// التحقق من المدخلات الأساسية
if (empty($name) || empty($studentClass)) {
    http_response_code(400); // Bad Request
    echo json_encode(['status' => 'error', 'message' => 'Name and class are required.']);
    $conn->close();
    exit();
}

if ($id) {
    // --- تعديل طالب موجود ---
    // (اختياري) جلب النقاط القديمة لتسجيل السجل
    $oldDataStmt = $conn->prepare("SELECT points FROM students WHERE id = ?");
    $oldDataStmt->bind_param("i", $id);
    $oldDataStmt->execute();
    $oldResult = $oldDataStmt->get_result();
    $oldPoints = 0;
    if ($oldRow = $oldResult->fetch_assoc()) {
        $oldPoints = (int)$oldRow['points'];
    }
    $oldDataStmt->close();

    // تحديث بيانات الطالب
    $stmt = $conn->prepare("UPDATE students SET name = ?, class = ?, points = ? WHERE id = ?");
    if (!$stmt) {
         http_response_code(500);
         echo json_encode(['status' => 'error', 'message' => 'Prepare failed: ' . $conn->error]);
         $conn->close(); exit();
    }
    $stmt->bind_param("ssii", $name, $studentClass, $points, $id);

    if ($stmt->execute()) {
        // (اختياري) إضافة سجل للتعديل
        // $change = $points - $oldPoints;
        // $reason = "تعديل بيانات الطالب";
        // $type = $change >= 0 ? 'إضافة نقاط' : 'خصم نقاط';
        // $date = date('Y-m-d');
        // $historyStmt = $conn->prepare("INSERT INTO points_history (student_id, change_date, old_points, points_change, new_points, reason, operation_type) VALUES (?, ?, ?, ?, ?, ?, ?)");
        // $historyStmt->bind_param("isiiiss", $id, $date, $oldPoints, $change, $points, $reason, $type);
        // $historyStmt->execute();
        // $historyStmt->close();

        echo json_encode(['status' => 'success', 'message' => 'Student updated successfully.', 'id' => $id]);
    } else {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to update student: ' . $stmt->error]);
    }
    $stmt->close();

} else {
    // --- إضافة طالب جديد ---
    $stmt = $conn->prepare("INSERT INTO students (name, class, points) VALUES (?, ?, ?)");
     if (!$stmt) {
         http_response_code(500);
         echo json_encode(['status' => 'error', 'message' => 'Prepare failed: ' . $conn->error]);
         $conn->close(); exit();
    }
    $stmt->bind_param("ssi", $name, $studentClass, $points);

    if ($stmt->execute()) {
        $newId = $conn->insert_id; // الحصول على ID الطالب الجديد

        // (اختياري) إضافة سجل للإضافة
        // $reason = "إضافة طالب جديد";
        // $type = 'إضافة';
        // $date = date('Y-m-d');
        // $historyStmt = $conn->prepare("INSERT INTO points_history (student_id, change_date, old_points, points_change, new_points, reason, operation_type) VALUES (?, ?, ?, ?, ?, ?, ?)");
        // $historyStmt->bind_param("isiiiss", $newId, $date, 0, $points, $points, $reason, $type);
        // $historyStmt->execute();
        // $historyStmt->close();

        echo json_encode(['status' => 'success', 'message' => 'Student added successfully.', 'id' => $newId]);
    } else {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to add student: ' . $stmt->error]);
    }
    $stmt->close();
}

$conn->close();
?>
