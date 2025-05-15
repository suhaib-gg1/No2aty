const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "/")));

// Access codes
const ACCESS_CODES = {
  admin: "Admin123",
  student: "StuD456"
};

// In-memory data
let studentsData = {
  students: [],
  lastUpdate: new Date()
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

  // Send current data on new connection
  socket.emit("initialData", studentsData);

  // Admin updates data
  socket.on("updateFromAdmin", (newData) => {
    studentsData = {
      students: newData.students,
      lastUpdate: new Date()
    };
    io.emit("dataUpdated", studentsData);
  });

  socket.on("disconnect", () => {
    console.log("🔌 Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
