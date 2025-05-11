const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
const bodyParser = require("body-parser"); // لمعالجة بيانات POST

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Middleware لتحليل بيانات JSON
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "/")));

// رمز الدخول الثابت (يمكنك تخزينه في متغير بيئة أو قاعدة بيانات)
const ACCESS_CODES = {
  admin: "Admin123", // رمز الأدمن
  student: "StuD456" // رمز الطلاب
};

// بيانات الطلاب (مثال)
let studentsData = {
  students: [],
  lastUpdate: new Date()
};

// التحقق من رمز الدخول
app.post("/check-code", (req, res) => {
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
  console.log(`🚀 الخادم يعمل على البورت ${PORT}`);
});
