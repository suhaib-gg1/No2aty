const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "/")));

// اتصال MongoDB
const uri = 'mongodb+srv://suhaibwebdev:suhaibwebdev@cluster0.27qaqkx.mongodb.net/yourDBName?retryWrites=true&w=majority';
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✔️ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// نموذج (Schema) الطالب
const studentSchema = new mongoose.Schema({
  name: String,
  grade: String,
  class: String,
  points: { type: Number, default: 0 },
  history: [{ 
    date: String,
    oldPoints: Number,
    change: Number,
    newPoints: Number,
    reason: String,
    type: String
  }]
  // ... أضف الحقول الأخرى حسب الحاجة
});
const Student = mongoose.model("Student", studentSchema);

// Redirect admin.html and student.html to index.html
app.get(['/admin.html', '/student.html'], (req, res) => {
  res.redirect('/index.html');
});

// Access codes
const ACCESS_CODES = {
  admin: "RtAdmin2025!",
  student: "Tamayoz2025"
};

// Route: Check access code
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

// Socket.io
io.on("connection", (socket) => {
  console.log("📡 Connected:", socket.id);

  // إرسال بيانات الطلاب من MongoDB عند الاتصال
  Student.find({})
    .then(students => {
      socket.emit("initialData", { students, lastUpdate: new Date() });
    })
    .catch(err => console.error("Error fetching students:", err));

  // تحديث بيانات من الأدمن (تعديل، حذف)
  socket.on("updateFromAdmin", async (newData) => {
    try {
      // هنا مثال لحذف الكل ثم إعادة الإضافة (حسب طريقة تخزينك)
      await Student.deleteMany({});
      await Student.insertMany(newData.students);

      // إعادة جلب البيانات وإرسالها للجميع
      const updatedStudents = await Student.find({});
      io.emit("dataUpdated", { students: updatedStudents, lastUpdate: new Date() });
    } catch (error) {
      console.error("Error updating students:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔌 Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
