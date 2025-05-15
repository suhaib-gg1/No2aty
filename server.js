const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// MongoDB URI (يفضل حفظه في .env)
const uri = process.env.MONGO_URI || "mongodb+srv://suhaibwebdev:Suhaib**webdev1@cluster0.27qaqkx.mongodb.net/no2aty?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);
let studentsCollection;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "/")));

// Access codes
const ACCESS_CODES = {
  admin: "Admin123",
  student: "StuD456"
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

// الاتصال بـ MongoDB
async function connectDB() {
  try {
    await client.connect();
    const db = client.db("no2aty");
    studentsCollection = db.collection("students");
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
  }
}

// Socket.io
io.on("connection", async (socket) => {
  console.log("📡 Connected:", socket.id);

  try {
    // إرسال البيانات من MongoDB
    const students = await studentsCollection.find().toArray();
    socket.emit("initialData", {
      students,
      lastUpdate: new Date()
    });
  } catch (error) {
    console.error("❌ Error fetching students:", error);
  }

  // Admin updates data
  socket.on("updateFromAdmin", async (newData) => {
    try {
      // حذف الكل ثم إعادة إدخال البيانات الجديدة
      await studentsCollection.deleteMany({});
      await studentsCollection.insertMany(newData.students);

      const updated = await studentsCollection.find().toArray();
      io.emit("dataUpdated", {
        students: updated,
        lastUpdate: new Date()
      });
    } catch (err) {
      console.error("❌ Failed to update MongoDB:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔌 Disconnected:", socket.id);
  });
});

// تشغيل الخادم بعد الاتصال بقاعدة البيانات
const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
