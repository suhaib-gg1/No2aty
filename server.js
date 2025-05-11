require("dotenv").config();  // تحميل المتغيرات البيئية
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Middleware لتحليل بيانات JSON
app.use(express.json()); // المعالجة المدمجة للبيانات
app.use(express.static(path.join(__dirname, "/")));

// استخدام متغيرات البيئة لتخزين الرموز
const ACCESS_CODES = {
  admin: process.env.ADMIN_CODE,
  student: process.env.STUDENT_CODE
};

// بيانات الطلاب
let studentsData = {
  students: [],
  lastUpdate: new Date()
};

// التحقق من رمز الدخول
app.post("/check-code", (req, res) => {
  try {
    const { code } = req.body;
    let isValid = false;
    let redirectPage = "";

    if (code === ACCESS_CODES.admin) {
      isValid = true;
      redirectPage = "admin.html";
    } else if (code === ACCESS_CODES.student) {
      isValid = true;
      redirectPage = "student.html";
    }

    res.json({ success: isValid, page: redirectPage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "حدث خطأ غير متوقع!" });
  }
});

// Socket.io للتواصل في الوقت الحقيقي
io.on("connection", (socket) => {
  console.log("📡 جهاز متصل:", socket.id);

  socket.emit("initialData", studentsData);

  socket.on("updateFromAdmin", (newData) => {
    studentsData = {
      students: newData.students,
      lastUpdate: new Date()
    };
    io.emit("dataUpdated", studentsData);
  });

  socket.on("disconnect", () => {
    console.log("🔌 جهاز انقطع:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
});
