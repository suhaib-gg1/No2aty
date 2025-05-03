<?php
header('Content-Type: application/json');
require 'db_connect.php';

$input = json_decode(file_get_contents('php://input'), true);

$id = isset($input['id']) ? (int)$input['id'] : null;
// استقبل التغيير في النقاط بدلاً من النقاط الجديدة
$pointsChange = isset($input['pointsChange']) ? (int)$input['pointsChange'] : null;
$reason = isset($input['reason']) ? trim($input['reason']) : 'تحديث نقاط'; // سبب افتراضي
$date = isset($input['date']) ? $input['date'] : date('Y-m-d'); // تاريخ اليوم افتراضيًا

if ($id === null || $pointsChange === null) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Student ID and points change are required.']);
    $conn->close();
    exit();
}

// ابدأ معاملة لضمان تحديث النقاط والسجل معًا
$conn->begin_transaction();

try {
    // 1. جلب النقاط الحالية
    $stmt = $conn->prepare("SELECT points FROM students WHERE id = ? FOR UPDATE"); // FOR UPDATE لمنع التضارب
    if (!$stmt) throw new Exception('Prepare failed (select): ' . $conn->error);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception('Student not found.', 404);
    }
    $row = $result->fetch_assoc();
    $oldPoints = (int)$row['points'];
    $stmt->close();

    // 2. حساب النقاط الجديدة (تأكد أنها لا تقل عن صفر)
    $newPoints = max(0, $oldPoints + $pointsChange);
    $actualChange = $newPoints - $oldPoints; // التغيير الفعلي بعد تطبيق الحد الأدنى

    // 3. تحديث نقاط الطالب
    $updateStmt = $conn->prepare("UPDATE students SET points = ? WHERE id = ?");
     if (!$updateStmt) throw new Exception('Prepare failed (update): ' . $conn->error);
    $updateStmt->bind_param("ii", $newPoints, $id);
    if (!$updateStmt->execute()) {
        throw new Exception('Failed to update points: ' . $updateStmt->error);
    }
    $updateStmt->close();

    // 4. (اختياري) إضافة سجل للتغيير
    // $type = $pointsChange >= 0 ? 'إضافة نقاط' : 'خصم نقاط';
    // $historyStmt = $conn->prepare("INSERT INTO points_history (student_id, change_date, old_points, points_change, new_points, reason, operation_type) VALUES (?, ?, ?, ?, ?, ?, ?)");
    // if (!$historyStmt) throw new Exception('Prepare failed (history): ' . $conn->error);
    // $historyStmt->bind_param("isiiiss", $id, $date, $oldPoints, $actualChange, $newPoints, $reason, $type);
    // if (!$historyStmt->execute()) {
    //     throw new Exception('Failed to add history record: ' . $historyStmt->error);
    // }
    // $historyStmt->close();

    // إذا نجح كل شيء، قم بتأكيد المعاملة
    $conn->commit();
    echo json_encode(['status' => 'success', 'message' => 'Points updated successfully.', 'newPoints' => $newPoints]);

} catch (Exception $e) {
    // في حالة حدوث أي خطأ، تراجع عن المعاملة
    $conn->rollback();
    $errorCode = $e->getCode() ?: 500; // استخدم 500 كافتراضي
    http_response_code($errorCode);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>
