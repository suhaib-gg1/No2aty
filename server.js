const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
const bodyParser = require("body-parser");
const { studentsDB, codesDB } = require('./database');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "/")));

// Redirect admin.html and student.html to index.html
app.get(['/admin.html', '/student.html'], (req, res) => {
    res.redirect('/index.html');
});

// Route: Check credentials
app.post("/check-credentials", async (req, res) => {
    const { code } = req.body;
    try {
        const codeType = await codesDB.verifyCode(code);
        if (codeType) {
            res.json({ 
                success: true, 
                page: `${codeType}.html`,
                role: codeType 
            });
        } else {
            res.json({ 
                success: false, 
                message: 'رمز غير صالح' 
            });
        }
    } catch (err) {
        console.error('خطأ في التحقق من الرمز:', err);
        res.status(500).json({ 
            success: false, 
            message: 'حدث خطأ في الخادم' 
        });
    }
});

// Route: Add new access code
app.post("/add-code", async (req, res) => {
    const { code, type } = req.body;
    try {
        await codesDB.addCode(code, type);
        res.json({ success: true });
    } catch (err) {
        console.error('خطأ في إضافة الرمز:', err);
        res.status(500).json({ 
            success: false, 
            message: err.message.includes('UNIQUE constraint failed') ? 
                'الرمز موجود مسبقاً' : 'حدث خطأ في الخادم' 
        });
    }
});

// Socket.io
io.on("connection", async (socket) => {
    console.log("📡 Connected:", socket.id);

    try {
        // إرسال البيانات الحالية عند الاتصال
        const students = await studentsDB.getAllStudents();
        socket.emit("initialData", { students, lastUpdate: new Date() });

        // تحديث البيانات من المشرف
        socket.on("updateFromAdmin", async (newData) => {
            try {
                // تحديث بيانات الطلاب في قاعدة البيانات
                for (const student of newData.students) {
                    if (student.id) {
                        await studentsDB.updateStudent(student.id, student);
                    } else {
                        await studentsDB.addStudent(student);
                    }
                }

                // إرسال البيانات المحدثة لجميع العملاء
                const updatedStudents = await studentsDB.getAllStudents();
                io.emit("dataUpdated", {
                    students: updatedStudents,
                    lastUpdate: new Date()
                });
            } catch (err) {
                console.error('خطأ في تحديث البيانات:', err);
                socket.emit('error', { message: 'حدث خطأ في تحديث البيانات' });
            }
        });

        // حذف طالب
        socket.on("deleteStudent", async (studentId) => {
            try {
                await studentsDB.deleteStudent(studentId);
                const updatedStudents = await studentsDB.getAllStudents();
                io.emit("dataUpdated", {
                    students: updatedStudents,
                    lastUpdate: new Date()
                });
            } catch (err) {
                console.error('خطأ في حذف الطالب:', err);
                socket.emit('error', { message: 'حدث خطأ في حذف الطالب' });
            }
        });

        // تحديث نقاط طالب
        socket.on("updatePoints", async (data) => {
            try {
                const { studentId, change, reason } = data;
                await studentsDB.updatePoints(studentId, change, reason);
                const updatedStudents = await studentsDB.getAllStudents();
                io.emit("dataUpdated", {
                    students: updatedStudents,
                    lastUpdate: new Date()
                });
            } catch (err) {
                console.error('خطأ في تحديث النقاط:', err);
                socket.emit('error', { message: 'حدث خطأ في تحديث النقاط' });
            }
        });

        // الحصول على سجل نقاط طالب
        socket.on("getPointsHistory", async (studentId) => {
            try {
                const history = await studentsDB.getPointsHistory(studentId);
                socket.emit("pointsHistory", { studentId, history });
            } catch (err) {
                console.error('خطأ في جلب سجل النقاط:', err);
                socket.emit('error', { message: 'حدث خطأ في جلب سجل النقاط' });
            }
        });

    } catch (err) {
        console.error('خطأ في الاتصال بقاعدة البيانات:', err);
        socket.emit('error', { message: 'حدث خطأ في الاتصال بقاعدة البيانات' });
    }

    socket.on("disconnect", () => {
        console.log("🔌 Disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
