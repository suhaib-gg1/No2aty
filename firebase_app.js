// تأكد من إضافة روابط Firebase SDK في ملف HTML قبل هذا السكربت
// مثال في ملف HTML:
// <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.16.9/xlsx.full.min.js"></script>

// ======== تهيئة Firebase ========
var firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', init);

// المتغيرات العامة
var students = [];
var nextId = 1;
var selectedStudents = new Set();
var currentStudentId = null;

// دالة التهيئة الأولية
async function init() {
    await loadFromFirebase();
    setupEventListeners();
    displayStudents();
    updateDate();
    document.getElementById('bulkClass').value = '1/1';
    setupFileUpload();
}

// دالة تحميل البيانات من Firebase
async function loadFromFirebase() {
    students = [];
    const snapshot = await db.collection('students').get();
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        students.push({
            id: parseInt(docSnap.id, 10),
            name: data.name,
            class: data.class,
            points: data.points,
            history: data.history || []
        });
    });
    nextId = students.length ? Math.max(...students.map(s => s.id)) + 1 : 1;
}

// دالة حفظ البيانات إلى Firebase
function saveToFirebase() {
    students.forEach(student => {
        db.collection('students').doc(student.id.toString()).set({
            name: student.name,
            class: student.class,
            points: student.points,
            history: student.history || []
        });
    });
}

// دالة عرض الطلاب في الجدول
function displayStudents() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const classFilter = document.getElementById('classFilter').value;

    // فرز الطلاب حسب النقاط
    const sorted = students.slice().sort((a, b) => b.points - a.points || a.id - b.id);
    sorted.forEach((s, i) => s.globalRank = i + 1);

    let withRank = sorted;
    if (classFilter) {
        const clsGroup = sorted.filter(s => s.class === classFilter);
        clsGroup.forEach((s, i) => s.classRank = i + 1);
        withRank = sorted.map(s => clsGroup.find(c => c.id === s.id) || s);
    }

    const filtered = withRank.filter(s => s.name.toLowerCase().includes(searchTerm) && (!classFilter || s.class === classFilter));

    const tbody = document.getElementById('studentsList');
    tbody.innerHTML = '';
    filtered.forEach(s => {
        const rank = classFilter ? s.classRank : s.globalRank;
        tbody.appendChild(createStudentRow(s, rank));
    });

    setupPointsControls();
    attachRowEvents();
    updateSelectAllState();
}

// دالة إنشاء صف للطالب
function createStudentRow(student, rank) {
    const row = document.createElement('tr');
    row.dataset.id = student.id;
    let medal = '';
    if (rank === 1) medal = '<span class="medal gold"></span>';
    else if (rank === 2) medal = '<span class="medal silver"></span>';
    else if (rank === 3) medal = '<span class="medal bronze"></span>';
    const sel = selectedStudents.has(student.id) ? 'checked' : '';
    row.innerHTML = `
        <td><input type="checkbox" class="select-checkbox" data-id="${student.id}" ${sel}></td>
        <td>${rank}${medal}</td>
        <td>${student.name}</td>
        <td>
            <div class="points-control">
                <button class="points-btn add-points-btn" data-id="${student.id}">+</button>
                <input type="number" class="points-input" id="points-input-${student.id}" value="5" min="1">
                <button class="points-btn subtract-points-btn" data-id="${student.id}">-</button>
            </div>
        </td>
        <td>${student.class}</td>
        <td class="points-display" id="points-display-${student.id}">${student.points}</td>
        <td><button class="mobile-menu-btn">⋮</button></td>
    `;
    return row;
}

// دوال التحكم في النقاط
function setupPointsControls() {
    document.querySelectorAll('.add-points-btn, .subtract-points-btn').forEach(btn => btn.replaceWith(btn.cloneNode(true)));
    document.querySelectorAll('.add-points-btn').forEach(btn => btn.addEventListener('click', () => {
        const id = +btn.dataset.id;
        const amt = +document.getElementById(`points-input-${id}`).value || 1;
        updateStudentPoints(id, amt, 'إضافة نقاط');
    }));
    document.querySelectorAll('.subtract-points-btn').forEach(btn => btn.addEventListener('click', () => {
        const id = +btn.dataset.id;
        const amt = +document.getElementById(`points-input-${id}`).value || 1;
        updateStudentPoints(id, -amt, 'خصم نقاط');
    }));
}

function updateStudentPoints(id, change, reason) {
    const s = students.find(x => x.id === id);
    if (!s) return;
    const old = s.points;
    const neu = Math.max(0, old + change);
    s.history = s.history||[];
    s.history.unshift({ date: new Date().toISOString().split('T')[0], oldPoints: old, change, newPoints: neu, reason });
    s.points = neu;
    document.getElementById(`points-display-${id}`).textContent = neu;
    saveToFirebase();
    showAlert(`تم ${change>0?'إضافة':'خصم'} ${Math.abs(change)} نقطة`, 'success');
}

// ... (بقية الدوال كما في الكود السابق)

