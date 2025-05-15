const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config(); // لدعم env من ملف .env إن أردت

const app = express();
const PORT = process.env.PORT || 3000;

// إعداد الميدل وير
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // ملفات HTML

// الاتصال بـ MongoDB
const uri = process.env.MONGO_URI || 'mongodb+srv://suhaibwebdev:Suhaib**webdev1@cluster0.27qaqkx.mongodb.net/no2aty?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);
let studentsCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db('no2aty');
    studentsCollection = db.collection('students');
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
  }
}
connectDB();

// جلب جميع الطلاب
app.get('/students', async (req, res) => {
  try {
    const students = await studentsCollection.find().toArray();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// إضافة طالب
app.post('/students', async (req, res) => {
  try {
    const newStudent = req.body;
    await studentsCollection.insertOne(newStudent);
    res.json({ message: '✅ Student added successfully' });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to add student' });
  }
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
