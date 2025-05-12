// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', init);

// المتغيرات العامة
var students = [];
var nextId = 1;
var selectedStudents = new Set();
var currentStudentId = null;

// دالة عرض التنبيهات
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// دالة فتح النوافذ المنبثقة
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

// دالة إغلاق النوافذ المنبثقة
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    // إعادة تعيين النموذج إذا كان موجوداً
    const form = document.getElementById(modalId).querySelector('form');
    if (form) {
        form.reset();
    }
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

// دالة فتح نافذة إضافة طالب
function openAddModal() {
    document.getElementById('studentId').value = '';
    document.getElementById('modalTitle').textContent = 'إضافة طالب جديد';
    document.getElementById('modalDate').value = new Date().toISOString().split('T')[0];
    openModal('studentModal');
}

// دالة التهيئة الأولية
function init() {
    setupEventListeners();
    displayStudents();
    updateDate();
    document.getElementById('bulkClass').value = '1/1';
}

// دالة إعداد مستمعي الأحداث
function setupEventListeners() {
    // أزرار النوافذ المنبثقة
    document.getElementById('addStudentBtn').addEventListener('click', openAddModal);
    document.getElementById('importStudentsBtn').addEventListener('click', () => openModal('importModal'));
    document.getElementById('exportStudentsBtn').addEventListener('click', () => openModal('exportOptionsModal'));
    document.getElementById('bulkPointsBtn').addEventListener('click', () => {
        document.getElementById('bulkDate').value = new Date().toISOString().split('T')[0];
        openModal('bulkPointsModal');
    });
    document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelectedStudents);

    // نماذج
    document.getElementById('studentForm').addEventListener('submit', handleStudentSubmit);
    document.getElementById('importForm').addEventListener('submit', handleImport);
    document.getElementById('bulkPointsForm').addEventListener('submit', handleBulkPoints);

    // البحث والتصفية
    document.getElementById('searchInput').addEventListener('input', displayStudents);
    document.getElementById('classFilter').addEventListener('change', displayStudents);
    document.getElementById('selectAllCheckbox').addEventListener('change', toggleSelectAll);

    // أزرار الحذف
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        selectedStudents.clear();
        closeModal('deleteConfirmation');
        updateSelectAllState();
    });

    // خيارات النقاط الجماعية
    document.getElementById('bulkApplyTo').addEventListener('change', function() {
        document.getElementById('bulkClassSelection').style.display = this.value === 'class' ? 'block' : 'none';
    });

    // أزرار إغلاق النوافذ المنبثقة
    document.querySelectorAll('.close-btn, .cancel-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });

    // أزرار نافذة الإجراءات
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

    // إغلاق النوافذ المنبثقة عند النقر خارجها
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });

    // زر العودة للأعلى
    window.addEventListener('scroll', toggleScrollToTopButton);
    document.getElementById('scrollToTopBtn').addEventListener('click', scrollToTop);
}

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

// دالة إعداد عناصر التحكم في النقاط
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

// دالة تحديث نقاط الطالب
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
    
    student.history.push({
        date: new Date().toISOString().split('T')[0],
        oldPoints: oldPoints,
        change: change,
        newPoints: newPoints,
        reason: reason
    });
    
    student.points = newPoints;
    
    // إرسال التحديث للخادم
    saveChangesToServer(students);
    
    displayStudents();
    showAlert(`تم ${change > 0 ? 'إضافة' : 'خصم'} ${Math.abs(change)} نقطة`, 'success');
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

// دالة معالجة إضافة/تعديل طالب
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
        // تعديل طالب موجود
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
        // إضافة طالب جديد
        const newStudent = {
            id: nextId++,
            name: name,
            class: studentClass,
            points: points,
            history: [{
                date: selectedDate || new Date().toISOString().split('T')[0],
                oldPoints: 0,
                change: points,
                newPoints: points,
                reason: 'إضافة طالب جديد',
                type: 'إضافة نقاط'
            }]
        };
        students.push(newStudent);
    }

    // إرسال التحديث للخادم
    saveChangesToServer(students);

    closeModal('studentModal');
    displayStudents();
    showAlert(id ? 'تم تعديل بيانات الطالب بنجاح' : 'تم إضافة الطالب بنجاح', 'success');
}

// دالة حذف الطلاب المحددين
function deleteSelectedStudents() {
    if (selectedStudents.size === 0) {
        showAlert('الرجاء تحديد طالب واحد على الأقل', 'warning');
        return;
    }
    openModal('deleteConfirmation');
}

// دالة تأكيد الحذف
function confirmDelete() {
    students = students.filter(function(student) {
        return !selectedStudents.has(student.id);
    });
    
    // إرسال التحديث للخادم
    saveChangesToServer(students);
    
    selectedStudents.clear();
    closeModal('deleteConfirmation');
    displayStudents();
    showAlert('تم حذف الطلاب المحددين بنجاح', 'success');
}

// دالة معالجة النقاط الجماعية
function handleBulkPoints(e) {
    e.preventDefault();

    const points = parseInt(document.getElementById('bulkPointsAmount').value);
    const operation = document.getElementById('bulkOperationType').value;
    const applyTo = document.getElementById('bulkApplyTo').value;
    const selectedClass = document.getElementById('bulkClass').value;
    const date = document.getElementById('bulkDate').value;
    const reason = document.getElementById('bulkReason')?.value || 'نقاط جماعية';

    if (isNaN(points) || points <= 0) {
        showAlert('الرجاء إدخال عدد نقاط صحيح', 'warning');
        return;
    }

    let targets = [];
    if (applyTo === 'selected') {
        targets = students.filter(function(student) {
            return selectedStudents.has(student.id);
        });
    } else if (applyTo === 'class') {
        targets = students.filter(function(student) {
            return student.class === selectedClass;
        });
    } else {
        targets = [...students];
    }

    if (targets.length === 0) {
        showAlert('لا يوجد طلاب مستهدفون', 'warning');
        return;
    }

    const change = operation === 'add' ? points : -points;

    targets.forEach(function(student) {
        if (!student.history) {
            student.history = [];
        }
        
        const oldPoints = student.points;
        const newPoints = Math.max(0, oldPoints + change);

        student.history.push({
            date: date,
            oldPoints: oldPoints,
            change: change,
            newPoints: newPoints,
            reason: reason,
            type: operation === 'add' ? 'إضافة نقاط' : 'خصم نقاط'
        });
        
        student.points = newPoints;
    });

    // إرسال التحديث للخادم
    saveChangesToServer(students);

    closeModal('bulkPointsModal');
    selectedStudents.clear();
    displayStudents();
    showAlert(`تم ${operation === 'add' ? 'إضافة' : 'خصم'} ${points} نقطة لـ ${targets.length} طالب`, 'success');
    updateSelectAllState();
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

        // إرسال التحديث للخادم
        saveChangesToServer(students);

        closeModal('importModal');
        displayStudents();
        showAlert(`تم استيراد ${importedStudents.length} طالب`, 'success');
    };
    reader.readAsArrayBuffer(file);
}

// دالة تبديل ظهور اختيار الفصل في نافذة التصدير
function toggleExportClassSelection() {
    const exportOption = document.getElementById('exportOption').value;
    const classSelection = document.getElementById('exportClassSelection');
    classSelection.style.display = exportOption === 'class' ? 'block' : 'none';
}

// دالة تصدير الطلاب إلى إكسل
function handleExport() {
    const exportOption = document.getElementById('exportOption').value;
    const exportClass = document.getElementById('exportClassSelect').value;
    
    let dataToExport = [...students];
    
    // تصفية حسب الفصل إذا تم اختيار فصل معين
    if (exportOption === 'class') {
        dataToExport = dataToExport.filter(function(student) {
            return student.class === exportClass;
        });
    } else if (exportOption === 'top10') {
        // ترتيب جميع الطلاب حسب النقاط
        dataToExport.sort((a, b) => {
            if (b.points !== a.points) {
                return b.points - a.points;
            }
            return a.id - b.id;
        });
        // أخذ العشرة الأوائل فقط
        dataToExport = dataToExport.slice(0, 10);
    }
    
    // ترتيب الطلاب حسب النقاط (من الأعلى إلى الأقل)
    dataToExport.sort((a, b) => {
        if (b.points !== a.points) {
            return b.points - a.points;
        }
        return a.id - b.id;
    });
    
    // إضافة الترتيب للبيانات
    const dataWithRank = dataToExport.map((student, index) => ({
        'الترتيب على الفصل': index + 1,
        'الترتيب العام': student.globalRank || index + 1,
        'اسم الطالب': student.name,
        'الفصل': student.class,
        'النقاط': student.points
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataWithRank);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلاب');
    
    let fileName;
    if (exportOption === 'class') {
        fileName = `طلاب_${exportClass}_${new Date().toISOString().split('T')[0]}.xlsx`;
    } else if (exportOption === 'top10') {
        fileName = `العشرة_الأوائل_${new Date().toISOString().split('T')[0]}.xlsx`;
    } else {
        fileName = `جميع_الطلاب_${new Date().toISOString().split('T')[0]}.xlsx`;
    }
    
    XLSX.writeFile(workbook, fileName);
    closeModal('exportOptionsModal');
    showAlert('تم تصدير البيانات بنجاح', 'success');
}

// دالة تحديث التاريخ
function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('ar-EG', options);
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

// دالة عرض سجل الطالب
function showHistory(studentId) {
    const student = students.find(function(s) {
        return s.id === studentId;
    });
    
    if (!student || !student.history || student.history.length === 0) {
        showAlert('لا يوجد سجل للطالب', 'info');
        return;
    }
    
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    student.history.forEach(function(record) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.date}</td>
            <td>${record.reason}</td>
            <td>${record.oldPoints}</td>
            <td>${record.change > 0 ? '+' : ''}${record.change}</td>
            <td>${record.newPoints}</td>
        `;
        historyList.appendChild(row);
    });
    
    document.getElementById('historyStudentName').textContent = student.name;
    openModal('historyModal');
}

// دالة تبديل ظهور زر العودة للأعلى
function toggleScrollToTopButton() {
    const button = document.getElementById('scrollToTopBtn');
    if (window.scrollY > 300) {
        button.classList.add('show');
    } else {
        button.classList.remove('show');
    }
}

// دالة العودة للأعلى
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
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

// دالة إرسال التحديثات للخادم
function saveChangesToServer(updatedStudents) {
    if (typeof socket !== 'undefined') {
        socket.emit('updateFromAdmin', { students: updatedStudents });
    }
} 