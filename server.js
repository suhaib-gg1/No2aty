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

// Redirect admin.html and student.html to index.html
app.get(['/admin.html', '/student.html'], (req, res) => {
  res.redirect('/index.html');
});

// Access codes
const VALID_ACCOUNTS = {
    admin: {
        username: "admin",
        password: "Admin@2025#Secure",
        role: "admin"
    },
    student: {
        username: "student",
        password: "Tamayoz@2025#Secure",
        role: "student"
    }
};

// In-memory data
let studentsData = {
  students: [],
  lastUpdate: new Date()
};

// Route: Check credentials
app.post("/check-credentials", (req, res) => {
    const { username, password } = req.body;
    let isValid = false;
    let redirectPage = "";
    let role = "";

    // التحقق من صحة بيانات الدخول
    for (const account of Object.values(VALID_ACCOUNTS)) {
        if (account.username === username && account.password === password) {
            isValid = true;
            role = account.role;
            redirectPage = `${account.role}.html`;
            break;
        }
    }

    res.json({ 
        success: isValid, 
        page: redirectPage,
        role: role 
    });
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
