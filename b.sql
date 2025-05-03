CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    class VARCHAR(50) NOT NULL,
    points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- (اختياري) جدول لتتبع سجل النقاط
CREATE TABLE points_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    change_date DATE NOT NULL,
    old_points INT,
    points_change INT NOT NULL,
    new_points INT NOT NULL,
    reason VARCHAR(255),
    operation_type VARCHAR(50), -- مثل 'إضافة', 'خصم', 'تعديل', 'إضافة طالب'
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
