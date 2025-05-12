// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', init);

// المتغيرات العامة
var students = [];
var nextId = 1;
var selectedStudents = new Set();
var currentStudentId = null;

// دالة التهيئة الأولية
function init() {
    
    setupEventListeners();
    displayStudents();
    updateDate();
    document.getElementById('bulkClass').value = '1/1';
}



// دالة حفظ البيانات في التخزين المحلي

// دالة عرض الطلاب في الجدول
// دالة عرض الطلاب في الجدول
function displayStudents() {
    var searchTerm = document.getElementById('searchInput').value.toLowerCase();
    var classFilter = document.getElementById('classFilter').value;

    // فرز الطلاب حسب النقاط
    var allStudentsSorted = students.slice().sort(function(a, b) {
        if (b.points !== a.points) {
            return b.points - a.points;
        } else {
            return a.id - b.id;
        }
    });

    // تعيين الترتيب العام
    for (var i = 0; i < allStudentsSorted.length; i++) {
        allStudentsSorted[i].globalRank = i + 1;
    }

    // حساب الترتيب حسب الفصل إذا تم التصفية
    var studentsWithRank = allStudentsSorted;
    if (classFilter) {
        var classStudents = allStudentsSorted.filter(function(student) {
            return student.class === classFilter;
        });
        
        for (var j = 0; j < classStudents.length; j++) {
            classStudents[j].classRank = j + 1;
        }
        
        studentsWithRank = allStudentsSorted.map(function(student) {
            var classStudent = classStudents.find(function(s) {
                return s.id === student.id;
            });
            return classStudent || student;
        });
    }

    // تصفية الطلاب حسب البحث والفصل
    var filteredStudents = studentsWithRank.filter(function(student) {
        var nameMatch = student.name.toLowerCase().includes(searchTerm);
        var classMatch = classFilter ? student.class === classFilter : true;
        return nameMatch && classMatch;
    });

    // عرض الطلاب في الجدول
    var tbody = document.getElementById('studentsList');
    tbody.innerHTML = '';
    
    for (var k = 0; k < filteredStudents.length; k++) {
        var student = filteredStudents[k];
        var rank = classFilter ? student.classRank : student.globalRank;
        var row = createStudentRow(student, rank);
        tbody.appendChild(row);
    }

    // إعداد عناصر التحكم في النقاط
    setupPointsControls();
    
    // إرفاق أحداث الصفوف
    attachRowEvents();
    
    // تحديث حالة تحديد الكل
    updateSelectAllState();
}

// دالة إنشاء صف للطالب
// في دالة createStudentRow:
function createStudentRow(student, rank) {
    var row = document.createElement('tr');
    row.setAttribute('data-id', student.id);
    
    var medal = '';
    if (rank === 1) {
        medal = '<span class="medal gold"></span>';
    } else if (rank === 2) {
        medal = '<span class="medal silver"></span>';
    } else if (rank === 3) {
        medal = '<span class="medal bronze"></span>';
    }
    
    var isSelected = selectedStudents.has(student.id);
    
    row.innerHTML = `
        <td><input type="checkbox" class="select-checkbox" data-id="${student.id}" ${isSelected ? 'checked' : ''}></td>
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
        <td>
            <button class="mobile-menu-btn">⋮</button>
        </td>
    `;
    
    return row;
}

// إضافة هذه الدوال الجديدة:
function setupPointsControls() {
    // إزالة جميع الأحداث السابقة أولاً
    var addButtons = document.querySelectorAll('.add-points-btn');
    var subtractButtons = document.querySelectorAll('.subtract-points-btn');
    
    for (var i = 0; i < addButtons.length; i++) {
        addButtons[i].replaceWith(addButtons[i].cloneNode(true));
    }
    
    for (var j = 0; j < subtractButtons.length; j++) {
        subtractButtons[j].replaceWith(subtractButtons[j].cloneNode(true));
    }

    // إضافة الأحداث الجديدة
    document.querySelectorAll('.add-points-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var studentId = parseInt(this.getAttribute('data-id'));
            var input = document.getElementById('points-input-' + studentId);
            var pointsToAdd = parseInt(input.value) || 1;
            updateStudentPoints(studentId, pointsToAdd, 'إضافة نقاط');
        });
    });

    document.querySelectorAll('.subtract-points-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var studentId = parseInt(this.getAttribute('data-id'));
            var input = document.getElementById('points-input-' + studentId);
            var pointsToSubtract = parseInt(input.value) || 1;
            updateStudentPoints(studentId, -pointsToSubtract, 'خصم نقاط');
        });
    });
}

function updateStudentPoints(studentId, change, reason) {
    var student = students.find(function(s) {
        return s.id === studentId;
    });
    
    if (!student) return;

    var oldPoints = student.points;
    var newPoints = Math.max(0, oldPoints + change);
    
    if (!student.history) {
        student.history = [];
    }
    
    student.history.unshift({
        date: new Date().toISOString().split('T')[0],
        oldPoints: oldPoints,
        change: change,
        newPoints: newPoints,
        reason: reason || 'تعديل النقاط'
    });
    
    student.points = newPoints;
    
    // تحديث العرض مباشرة دون إعادة تحميل الجدول
    document.getElementById('points-display-' + studentId).textContent = newPoints;
    
    showAlert(`تم ${change > 0 ? 'إضافة' : 'خصم'} ${Math.abs(change)} نقطة`, 'success');
}


    
    // في نهاية الدالة بعد إضافة الصفوف
    setupPointsControls();

// دالة إعداد مستمعي الأحداث
function setupEventListeners() {
    document.getElementById('addStudentBtn').addEventListener('click', openAddModal);
    document.getElementById('importStudentsBtn').addEventListener('click', function() {
        openModal('importModal');
    });
document.getElementById('exportStudentsBtn').addEventListener('click', function() {
    openModal('exportOptionsModal');
});
    document.getElementById('bulkPointsBtn').addEventListener('click', function() {
        document.getElementById('bulkDate').value = new Date().toISOString().split('T')[0];
        openModal('bulkPointsModal');
    });
    document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelectedStudents);
    document.getElementById('studentForm').addEventListener('submit', handleStudentSubmit);
    document.getElementById('importForm').addEventListener('submit', handleImport);
    document.getElementById('bulkPointsForm').addEventListener('submit', handleBulkPoints);
    document.getElementById('searchInput').addEventListener('input', displayStudents);
    document.getElementById('classFilter').addEventListener('change', displayStudents);
    document.getElementById('selectAllCheckbox').addEventListener('change', toggleSelectAll);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    document.getElementById('cancelDeleteBtn').addEventListener('click', function() {
        selectedStudents.clear();
        closeModal('deleteConfirmation');
        updateSelectAllState();
    });
    document.getElementById('bulkApplyTo').addEventListener('change', function() {
        document.getElementById('bulkClassSelection').style.display = this.value === 'class' ? 'block' : 'none';
    });

    // أحداث النوافذ المنبثقة
    document.querySelectorAll('.close-btn, .cancel-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            closeModal(this.closest('.modal').id);
        });
    });

    // أحداث نافذة الإجراءات
    document.querySelector('.modal-action-btn.edit-btn').addEventListener('click', function() {
        if (currentStudentId) {
            editStudent(currentStudentId);
            closeActionModal();
        }
    });

    document.querySelector('.modal-action-btn.history-btn').addEventListener('click', function() {
        if (currentStudentId) {
            showHistory(currentStudentId);
            closeActionModal();
        }
    });

    document.querySelector('.modal-action-btn.delete-btn').addEventListener('click', function() {
        if (currentStudentId) {
            deleteSingleStudent(currentStudentId);
            closeActionModal();
        }
    });

    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
    window.addEventListener('scroll', toggleScrollToTopButton);
document.getElementById('scrollToTopBtn').addEventListener('click', scrollToTop);
// (اختياري) إخفاء الزر عند التحميل إذا كانت الصفحة في الأعلى
window.addEventListener('DOMContentLoaded', () => {
    if (window.scrollY === 0) {
        document.getElementById('scrollToTopBtn').classList.remove('show');
    }
});

}

// دالة فتح نافذة الإجراءات
function openActionModal() {
    document.getElementById('actionModal').style.display = 'block';
}

// دالة إغلاق نافذة الإجراءات
function closeActionModal() {
    document.getElementById('actionModal').style.display = 'none';
    currentStudentId = null;
}

// دالة إرفاق أحداث الصفوف
function attachRowEvents() {
    var list = document.getElementById('studentsList');
    
    // إضافة حدث change لصناديق التحديد الفردية
    list.addEventListener('change', function(e) {
        if (e.target.classList.contains('select-checkbox')) {
            var studentId = parseInt(e.target.dataset.id);
            if (e.target.checked) {
                selectedStudents.add(studentId);
            } else {
                selectedStudents.delete(studentId);
            }
            updateSelectAllState();
        }
    });

    // بقية الأحداث (النقر على القائمة المتنقلة)
    list.removeEventListener('click', handleRowClick);
    list.addEventListener('click', handleRowClick);
}

// دالة معالجة أحداث الصفوف
function handleRowClick(e) {
    var target = e.target;
    var row = target.closest('tr');
    if (!row) return;

    currentStudentId = parseInt(row.dataset.id);

    if (target.classList.contains('mobile-menu-btn')) {
        e.stopPropagation();
        openActionModal();
    }
}

// دالة تحديث حالة تحديد الكل
function updateSelectAllState() {
    const selectAll = document.getElementById('selectAllCheckbox');
    const checkboxes = document.querySelectorAll('.select-checkbox');
    
    // تحديث جميع الـ checkboxes
    checkboxes.forEach(checkbox => {
        const studentId = parseInt(checkbox.dataset.id);
        checkbox.checked = selectedStudents.has(studentId);
    });
    
    // تحديث حالة selectAll
    if (checkboxes.length === 0) {
        selectAll.checked = false;
        selectAll.indeterminate = false;
    } else {
        const checkedCount = selectedStudents.size;
        selectAll.checked = checkedCount === checkboxes.length;
        selectAll.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
    }
}

// دالة فتح نافذة إضافة طالب
function openAddModal() {
    document.getElementById('studentId').value = '';
    document.getElementById('modalTitle').textContent = 'إضافة طالب جديد';
    document.getElementById('studentForm').reset();
    document.getElementById('modalDate').value = new Date().toISOString().split('T')[0];
    openModal('studentModal');
}

// دالة تعديل طالب
function editStudent(id) {
    const student = students.find(function(s) {
        return s.id === id;
    });
    
    if (!student) return;

    document.getElementById('studentId').value = student.id;
    document.getElementById('modalName').value = student.name;
    document.getElementById('modalClass').value = student.class;
    document.getElementById('modalPoints').value = student.points;
    document.getElementById('modalTitle').textContent = 'تعديل بيانات الطالب';
    document.getElementById('modalDate').value = new Date().toISOString().split('T')[0];
    openModal('studentModal');
}

// دالة معالجة إرسال نموذج الطالب
function handleStudentSubmit(e) {
    e.preventDefault();

    const selectedDate = document.getElementById('modalDate').value;
    const id = document.getElementById('studentId').value;
    const name = document.getElementById('modalName').value.trim();
    const studentClass = document.getElementById('modalClass').value;
    const points = parseInt(document.getElementById('modalPoints').value);
    
    if (!name || isNaN(points)) {
        showAlert('الرجاء إدخال بيانات صحيحة', 'warning');
        return;
    }
    
    if (id) {
        const index = students.findIndex(function(s) {
            return s.id === parseInt(id);
        });
        
        if (index !== -1) {
            const oldPoints = students[index].points;
            const change = points - oldPoints;
            
            if (!students[index].history) {
                students[index].history = [];
            }
            
            students[index].history.push({
                date: selectedDate || new Date().toISOString().split('T')[0],
                oldPoints: oldPoints,
                change: change,
                newPoints: points,
                reason: 'تعديل النقاط',
                type: change > 0 ? 'إضافة نقاط' : 'خصم نقاط'
            });
            
            students[index] = {
                ...students[index],
                name: name,
                class: studentClass,
                points: points
            };
        }
    } else {
        students.push({ 
            id: nextId++, 
            name: name, 
            class: studentClass, 
            points: points,
            history: [{
                date: new Date().toISOString().split('T')[0],
                oldPoints: 0,
                change: points,
                newPoints: points,
                reason: 'إضافة طالب جديد',
                type: 'إضافة'
            }]
        });
    }
    
    closeModal('studentModal');
    displayStudents();
    showAlert('تم حفظ التغييرات بنجاح', 'success');
}

// دالة تأكيد الحذف
function confirmDelete() {
    students = students.filter(function(s) {
        return !selectedStudents.has(s.id);
    });
    
    selectedStudents.clear();
    closeModal('deleteConfirmation');
    displayStudents();
    showAlert('تم الحذف بنجاح', 'success');
    updateSelectAllState();
}

// دالة معالجة النقاط الجماعية
function handleBulkPoints(e) {
    e.preventDefault();
    const selectedDate = document.getElementById('bulkDate').value;
    const points = parseInt(document.getElementById('bulkPointsAmount').value);
    const operation = document.getElementById('bulkOperationType').value;
    const applyTo = document.getElementById('bulkApplyTo').value;
    const selectedClass = document.getElementById('bulkClass').value;

    let targets = [];
    if (applyTo === 'selected') {
        targets = students.filter(function(s) {
            return selectedStudents.has(s.id);
        });
    } else if (applyTo === 'class') {
        targets = students.filter(function(s) {
            return s.class === selectedClass;
        });
    } else if (applyTo === 'all') {
        targets = [...students];
    }

    if (targets.length === 0) {
        showAlert('لا يوجد طلاب مطابقين للمعايير المحددة', 'warning');
        return;
    }

    const currentDate = selectedDate || new Date().toISOString().split('T')[0];

    for (let i = 0; i < targets.length; i++) {
        const student = targets[i];
        const oldPoints = student.points;
        let newPoints, change;
        
        if (operation === 'add') {
            newPoints = oldPoints + points;
            change = points;
        } else {
            newPoints = Math.max(0, oldPoints - points);
            change = -points;
        }
        
        if (!student.history) {
            student.history = [];
        }
        
        student.history.unshift({
            date: currentDate,
            oldPoints: oldPoints,
            change: change,
            newPoints: newPoints,
            reason: 'تعديل جماعي للنقاط'
        });
        
        student.points = newPoints;
    }

    closeModal('bulkPointsModal');
    selectedStudents.clear();
    displayStudents();
    showAlert(`تم ${operation === 'add' ? 'إضافة' : 'خصم'} ${points} نقطة لـ ${targets.length} طالب`, 'success');
    updateSelectAllState();
}

// دالة حذف الطلاب المحددين
function deleteSelectedStudents() {
    if (selectedStudents.size === 0) {
        showAlert('الرجاء تحديد طلاب للحذف', 'warning');
        return;
    }
    
    document.getElementById('confirmationMessage').textContent = 
        `هل أنت متأكد من حذف ${selectedStudents.size} طالب؟`;
    openModal('deleteConfirmation');
}

// دالة حذف طالب واحد
function deleteSingleStudent(id) {
    selectedStudents.clear();
    selectedStudents.add(id);
    deleteSelectedStudents();
}

// دالة استيراد الطلاب من إكسل
function handleImport(e) {
    e.preventDefault();
    const file = document.getElementById('excelFile').files[0];
    if (!file) {
        showAlert('الرجاء اختيار ملف إكسل', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        const importedStudents = jsonData.map(function(row) {
            return {
                id: nextId++,
                name: row['اسم الطالب'] || 'طالب جديد',
                class: document.getElementById('importClass').value,
                points: row['النقاط'] || 0,
                history: []
            };
        });

        if (document.getElementById('importMethod').value === 'replace') {
            students = importedStudents;
        } else {
            students = students.concat(importedStudents);
        }

        closeModal('importModal');
        displayStudents();
        showAlert(`تم استيراد ${importedStudents.length} طالب`, 'success');
    };
    reader.readAsArrayBuffer(file);
}

// دالة تصدير الطلاب إلى إكسل
function exportStudents() {
    const data = students.map(function(s) {
        return {
            'اسم الطالب': s.name,
            'الفصل': s.class,
            'النقاط': s.points
        };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الطلاب");
    XLSX.writeFile(wb, "students.xlsx");
    showAlert('تم التصدير بنجاح', 'success');
}

// دالة تحديث التاريخ
function updateDate() {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('ar-EG', options);
}

// دالة عرض التنبيهات
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    document.body.appendChild(alert);
    
    setTimeout(function() {
        alert.remove();
    }, 3000);
}

// دالة تبديل تحديد الكل
function toggleSelectAll(event) {
    const checkboxes = document.querySelectorAll('.select-checkbox');
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = event.target.checked;
        const studentId = parseInt(checkboxes[i].dataset.id);
        if (event.target.checked) {
            selectedStudents.add(studentId);
        } else {
            selectedStudents.delete(studentId);
        }
    }
    updateSelectAllState();
}

// دالة تحسين تجربة السحب والإفلات
function setupFileUpload() {
    const uploadArea = document.querySelector('.file-upload-area');
    const fileInput = document.getElementById('excelFile');
    const filePreview = document.getElementById('filePreview');

    // عند اختيار ملف
    fileInput.addEventListener('change', function(e) {
        if (this.files.length) {
            showFilePreview(this.files[0]);
        }
    });

    // أحداث السحب والإفلات
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            showFilePreview(e.dataTransfer.files[0]);
        }
    });
}

function showFilePreview(file) {
    const preview = document.getElementById('filePreview');
    preview.innerHTML = `
        <p><strong>الملف المحدد:</strong> ${file.name}</p>
        <p><strong>الحجم:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
    `;
    preview.style.display = 'block';
}

// استدعاء الدالة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('excelFile');
    const fileNameSpan = document.getElementById('fileName');
    const clearFileBtn = document.getElementById('clearFile');
    const fileInfoDiv = document.getElementById('fileInfo');

    // عند اختيار ملف
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            fileNameSpan.textContent = this.files[0].name;
            fileInfoDiv.style.display = 'flex';
        } else {
            fileNameSpan.textContent = 'لم يتم اختيار ملف';
            fileInfoDiv.style.display = 'none';
        }
    });

    // زر إزالة الملف
    clearFileBtn.addEventListener('click', function() {
        fileInput.value = '';
        fileNameSpan.textContent = 'لم يتم اختيار ملف';
        fileInfoDiv.style.display = 'none';
    });

    // أحداث السحب والإفلات
    const uploadArea = document.querySelector('.file-upload-area');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            fileNameSpan.textContent = e.dataTransfer.files[0].name;
            fileInfoDiv.style.display = 'flex';
        }
    });
   
});

document.querySelectorAll('select').forEach(select => {
    // إضافة تأثير عند تغيير القيمة
    select.addEventListener('change', function() {
        if (this.value) {
            this.style.borderColor = '#4CAF50';
            setTimeout(() => {
                this.style.borderColor = '#ddd';
            }, 1000);
        }
    });
});

// دالة فتح نافذة منبثقة
function openModal(id) {
    document.getElementById(id).style.display = 'block';
}

// دالة إغلاق نافذة منبثقة
function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// دالة عرض سجل التعديلات
function showHistory(studentId) {
    const student = students.find(function(s) {
        return s.id === studentId;
    });
    
    if (!student) return;

    document.getElementById('historyStudentName').textContent = student.name;
    const tbody = document.getElementById('historyList');
    tbody.innerHTML = '';

    if (!student.history || student.history.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">لا يوجد سجل تعديلات لهذا الطالب</td>
            </tr>
        `;
        return;
    }

    for (let i = 0; i < student.history.length; i++) {
        const record = student.history[i];
        const changeClass = record.change >= 0 ? 'positive-change' : 'negative-change';
        const changeSign = record.change >= 0 ? '+' : '';
        const formattedDate = record.date ? new Date(record.date).toLocaleDateString('ar-EG') : '--';
        
        tbody.innerHTML += `
            <tr>
                <td>${formattedDate}</td>
                <td>${record.oldPoints || '--'}</td>
                <td class="${changeClass}">${changeSign}${record.change || '--'}</td>
                <td>${record.newPoints || '--'}</td>
                <td>${record.reason || '--'}</td>
            </tr>
        `;
    }

    openModal('historyModal');
}
// دالة إظهار/إخفاء الزر حسب موضع التمرير
function toggleScrollToTopButton() {
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (window.scrollY > 300) { // يظهر الزر بعد التمرير 300px
        scrollToTopBtn.classList.add('show');
    } else {
        scrollToTopBtn.classList.remove('show');
    }
}

// دالة العودة إلى الأعلى
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth' // تمرير سلس
    });
}
function handleExport() {
    const option = document.getElementById('exportOption').value;
    let exportData = [];

    if (option === 'all') {
        exportData = students;
    } else if (option === 'class') {
        const selectedClass = document.getElementById('exportClass').value.trim();
        if (!selectedClass) {
            showAlert('الرجاء كتابة اسم الفصل', 'warning');
            return;
        }
        exportData = students.filter(s => s.class === selectedClass);
    } else if (option === 'top10') {
        exportData = students
            .slice()
            .sort((a, b) => b.points - a.points)
            .slice(0, 10);
    }

    if (exportData.length === 0) {
        showAlert('لا يوجد طلاب للتصدير حسب الخيار المختار', 'warning');
        return;
    }

    const data = exportData.map(function(s) {
        return {
            'اسم الطالب': s.name,
            'الفصل': s.class,
            'النقاط': s.points
        };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الطلاب");
    XLSX.writeFile(wb, "students_export.xlsx");

    showAlert('تم التصدير بنجاح', 'success');
    closeModal('exportOptionsModal');
}

function handleExport() {
    const option = document.getElementById('exportOption').value;
    let exportData = [];

    if (option === 'all') {
        exportData = students;
    } else if (option === 'class') {
        const selectedClass = document.getElementById('exportClassSelect').value;
        if (!selectedClass) {
            showAlert('الرجاء اختيار فصل', 'warning');
            return;
        }
        exportData = students.filter(s => s.class === selectedClass);
    } else if (option === 'top10') {
        exportData = students
            .slice()
            .sort((a, b) => b.points - a.points)
            .slice(0, 10);
    }

    if (exportData.length === 0) {
        showAlert('لا يوجد طلاب للتصدير حسب الخيار المختار', 'warning');
        return;
    }

    const data = exportData.map(function(s) {
        return {
            'اسم الطالب': s.name,
            'الفصل': s.class,
            'النقاط': s.points
        };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الطلاب");
    XLSX.writeFile(wb, "students_export.xlsx");

    showAlert('تم التصدير بنجاح', 'success');
    closeModal('exportOptionsModal');
}

// فتح النافذة
function openExportModal() {
    document.getElementById('exportOptionsModal').style.display = 'block';
}

// إغلاق النافذة
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// التحكم في ظهور حقل الفصل
document.getElementById('exportOption').addEventListener('change', function() {
    const selected = this.value;
    const classSection = document.getElementById('exportClassSelection');
    if (selected === 'class') {
        fillExportClassSelect();
        classSection.style.display = 'block';
    } else {
        classSection.style.display = 'none';
    }
});
function fillExportClassSelect() {
    const classSelect = document.getElementById('exportClassSelect');
    classSelect.innerHTML = '';

    const uniqueClasses = [...new Set(students.map(s => s.class))];

    uniqueClasses.forEach(function(className) {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        classSelect.appendChild(option);
    });
}
