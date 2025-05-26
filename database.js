const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// إنشاء اتصال قاعدة البيانات
const db = new sqlite3.Database(path.join(__dirname, 'students.db'), (err) => {
    if (err) {
        console.error('خطأ في الاتصال بقاعدة البيانات:', err.message);
    } else {
        console.log('تم الاتصال بقاعدة البيانات SQLite بنجاح');
        initializeDatabase();
    }
});

// تهيئة قاعدة البيانات
function initializeDatabase() {
    db.serialize(() => {
        // جدول الطلاب
        db.run(`CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            stage TEXT NOT NULL,
            class TEXT NOT NULL,
            points INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // جدول سجل النقاط
        db.run(`CREATE TABLE IF NOT EXISTS points_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER,
            previous_points INTEGER,
            points_change INTEGER,
            new_points INTEGER,
            reason TEXT,
            date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id)
        )`);

        // جدول الرموز
        db.run(`CREATE TABLE IF NOT EXISTS access_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            type TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    });
}

// دوال التعامل مع الطلاب
const studentsDB = {
    // إضافة طالب جديد
    addStudent: (student) => {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO students (name, stage, class, points) VALUES (?, ?, ?, ?)`;
            db.run(sql, [student.name, student.stage, student.class, student.points], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    },

    // تحديث بيانات طالب
    updateStudent: (id, student) => {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE students SET name = ?, stage = ?, class = ?, points = ? WHERE id = ?`;
            db.run(sql, [student.name, student.stage, student.class, student.points, id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    },

    // حذف طالب
    deleteStudent: (id) => {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM students WHERE id = ?`;
            db.run(sql, [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    },

    // الحصول على جميع الطلاب
    getAllStudents: () => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM students ORDER BY points DESC`;
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    // الحصول على طالب بواسطة المعرف
    getStudentById: (id) => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM students WHERE id = ?`;
            db.get(sql, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    // تحديث نقاط طالب
    updatePoints: (id, change, reason) => {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.get('SELECT points FROM students WHERE id = ?', [id], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    const previousPoints = row.points;
                    const newPoints = previousPoints + change;
                    
                    db.run('BEGIN TRANSACTION');
                    
                    db.run('UPDATE students SET points = ? WHERE id = ?', [newPoints, id], function(err) {
                        if (err) {
                            db.run('ROLLBACK');
                            reject(err);
                            return;
                        }
                        
                        db.run(
                            'INSERT INTO points_history (student_id, previous_points, points_change, new_points, reason) VALUES (?, ?, ?, ?, ?)',
                            [id, previousPoints, change, newPoints, reason],
                            function(err) {
                                if (err) {
                                    db.run('ROLLBACK');
                                    reject(err);
                                    return;
                                }
                                
                                db.run('COMMIT');
                                resolve({ previousPoints, newPoints });
                            }
                        );
                    });
                });
            });
        });
    },

    // الحصول على سجل نقاط طالب
    getPointsHistory: (studentId) => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM points_history WHERE student_id = ? ORDER BY date DESC`;
            db.all(sql, [studentId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};

// دوال التعامل مع الرموز
const codesDB = {
    // إضافة رمز جديد
    addCode: (code, type) => {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO access_codes (code, type) VALUES (?, ?)`;
            db.run(sql, [code, type], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    },

    // التحقق من صحة الرمز
    verifyCode: (code) => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT type FROM access_codes WHERE code = ?`;
            db.get(sql, [code], (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.type : null);
            });
        });
    }
};

module.exports = {
    db,
    studentsDB,
    codesDB
}; 