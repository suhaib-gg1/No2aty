// بدء التطبيق عند تحميل الصفحة
// حذف السطر التالي لأنه مكرر
// document.addEventListener('DOMContentLoaded', init);

// المتغيرات العامة
let students = [];
let activeTab = 'نقاطي';
let selectedStudents = new Set();
let currentStudentId = null;
let nextId = 1; // إضافة تعريف nextId

// تعريف الفصول لكل مرحلة بشكل مبسط
const stageClasses = {
    primary: {
        name: 'المرحلة الابتدائية',
        classes: ['1/1', '1/2', '2/1', '2/2', '3/1', '3/2', '4/1', '4/2', '5/1', '5/2', '6/1', '6/2']
    },
    middle: {
        name: 'المرحلة المتوسطة',
        classes: ['1/1', '1/2', '2/1', '2/2', '3/1', '3/2']
    },
    secondary: {
        name: 'المرحلة الثانوية',
        classes: ['1/1', '1/2', '1/3', '2/عام', '2/صحة', '2/هندسة', 'ثالث عام/1', 'ثالث عام/2', 'ثالث عام/3', 'ثالث صحة/1', 'ثالث صحة/2', 'ثالث هندسة/1', 'ثالث هندسة/2']
    }
};

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
    console.log('فتح النافذة المنبثقة:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        
        // تحديث القوائم المنسدلة إذا كانت نافذة الاستيراد أو التصدير
        if (modalId === 'importModal') {
            updateImportClassFilter();
        } else if (modalId === 'exportOptionsModal') {
            toggleExportOptions();
        }
    }
}

// دالة إغلاق النوافذ المنبثقة
function closeModal(modalId) {
    console.log('إغلاق النافذة المنبثقة:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        
        // إعادة تعيين النموذج إذا كان موجوداً
        const form = modal.querySelector('form');
        if (form && modalId !== 'exportOptionsModal' && modalId !== 'bulkPointsModal') {
            form.reset();
        }
        
        // إعادة تعيين معرف الطالب الحالي إذا كانت نافذة الإجراءات
        if (modalId === 'actionModal') {
            currentStudentId = null;
        }
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

// دالة إضافة طالب
function openAddModal() {
    console.log('فتح نافذة إضافة/تعديل طالب للتبويب:', activeTab);
    document.getElementById('studentId').value = '';
    document.getElementById('modalTitle').textContent = 'إضافة طالب جديد';
    document.getElementById('modalDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('modalPoints').value = '0';
    
    // تعيين المرحلة الافتراضية وتحديث قائمة الفصول بناءً على التبويب النشط أو الافتراضي
    const defaultStage = 'primary';
    document.getElementById('modalStage').value = defaultStage;
    updateModalClassFilter(); // تحديث قائمة الفصول
    
    openModal('studentModal');
}

// دالة التهيئة الأولية
function init() {
    console.log('بدء تهيئة التطبيق...');
    
    // تعيين التبويب الافتراضي عند التهيئة
    activeTab = 'نقاطي'; // تعيين التبويب الافتراضي هو نقاطي
    // تحديث حالة التبويبات في الواجهة
    updateTabUI();

    // تعيين المرحلة الافتراضية في فلتر المرحلة لتبويب نقاطي
    const nqatiStageFilter = document.getElementById('stageFilter');
    if (nqatiStageFilter) {
        nqatiStageFilter.value = 'primary';
        // لا نستدعي updateClassFilter هنا، سيتم استدعاؤها من displayStudents لاحقاً
    }
    
    // استعادة آخر خيارات التصدير إذا وجدت (تبقى خاصة بنقاطي حالياً)
    const lastExportOption = localStorage.getItem('lastExportOption');
    const lastExportClass = localStorage.getItem('lastExportClass');
    const lastExportStage = localStorage.getItem('lastExportStage');
    
    if (lastExportOption && document.getElementById('exportOption')) {
        document.getElementById('exportOption').value = lastExportOption;
    }
    if (lastExportStage && document.getElementById('exportStageSelect')) {
        document.getElementById('exportStageSelect').value = lastExportStage;
    }
    if (lastExportClass && document.getElementById('exportClassSelect')) {
        document.getElementById('exportClassSelect').value = lastExportClass;
    }

    // إعداد مستمعي الأحداث لكلا التبويبين
    setupEventListeners();
    
    // عرض الطلاب للتبويب النشط حالياً (الافتراضي هو نقاطي)
    displayStudents();
    
    // تحديث التاريخ
    updateDate();
    
    // تعيين القيمة الافتراضية للفصل في النقاط الجماعية (نقاطي)
    const nqatiBulkClass = document.getElementById('bulkClass');
    if (nqatiBulkClass) {
        nqatiBulkClass.value = '1/1';
    }
    
    console.log('اكتملت تهيئة التطبيق');
}

// دالة تحديث حالة التبويبات في الواجهة
function updateTabUI() {
     document.querySelectorAll('.tabs-container .tab').forEach(tab => {
        tab.classList.remove('active');
    });

    if (activeTab === 'نقاطي') {
        document.querySelector('.tab:nth-child(1)').classList.add('active');
        document.getElementById('nqati-content').style.display = 'block';
        document.getElementById('mutamayez-content').style.display = 'none';
         const nqatiLogo = document.querySelector('.school-logo');
         if (nqatiLogo) nqatiLogo.style.display = 'block';

    } else if (activeTab === 'انا متميز') {
        document.querySelector('.tab:nth-child(2)').classList.add('active');
        document.getElementById('nqati-content').style.display = 'none';
        document.getElementById('mutamayez-content').style.display = 'block';
        const nqatiLogo = document.querySelector('.school-logo');
        if (nqatiLogo) nqatiLogo.style.display = 'block'; // تعديل: إظهار شعار المدرسة في تبويب انا متميز
    }
}

// دالة تحديد عناصر الواجهة للتبويب النشط
function getElementsForActiveTab() {
    if (activeTab === 'نقاطي') {
        return {
            searchInput: document.getElementById('searchInput'),
            stageFilter: document.getElementById('stageFilter'),
            classFilter: document.getElementById('classFilter'),
            studentsTable: document.getElementById('studentsTable'),
            studentsList: document.getElementById('studentsList'),
            selectAllCheckbox: document.getElementById('selectAllCheckbox'),
            addStudentBtn: document.getElementById('addStudentBtn'),
            importStudentsBtn: document.getElementById('importStudentsBtn'),
            exportStudentsBtn: document.getElementById('exportStudentsBtn'),
            bulkPointsBtn: document.getElementById('bulkPointsBtn'),
            deleteSelectedBtn: document.getElementById('deleteSelectedBtn')
        };
    } else if (activeTab === 'انا متميز') {
        return {
            searchInput: document.getElementById('mutamayez-searchInput'),
            stageFilter: document.getElementById('mutamayez-stageFilter'),
            classFilter: document.getElementById('mutamayez-classFilter'),
            studentsTable: document.getElementById('mutamayez-studentsTable'),
            studentsList: document.getElementById('mutamayez-studentsList'),
            selectAllCheckbox: document.getElementById('mutamayez-selectAllCheckbox'),
            addStudentBtn: document.getElementById('mutamayez-addStudentBtn'),
            importStudentsBtn: document.getElementById('mutamayez-importStudentsBtn'),
            exportStudentsBtn: document.getElementById('mutamayez-exportStudentsBtn'),
            bulkPointsBtn: document.getElementById('mutamayez-bulkPointsBtn'),
            deleteSelectedBtn: document.getElementById('mutamayez-deleteSelectedBtn')
        };
    }
    return null; // Should not happen
}

// دالة إعداد مستمعي الأحداث الخاصة بالعناصر داخل التبويبات
function setupTabSpecificEventListeners() {
    console.log('إعداد مستمعي الأحداث للعناصر في التبويب:', activeTab);
    const elements = getElementsForActiveTab();
    if (!elements) return;

    // أزرار النوافذ المنبثقة
    if (elements.addStudentBtn) {
        elements.addStudentBtn.removeEventListener('click', openAddModal);
        elements.addStudentBtn.addEventListener('click', openAddModal);
    }
    if (elements.importStudentsBtn) {
        elements.importStudentsBtn.removeEventListener('click', handleImportClick);
        elements.importStudentsBtn.addEventListener('click', handleImportClick);
    }
    if (elements.exportStudentsBtn) {
        elements.exportStudentsBtn.removeEventListener('click', handleExportClick);
        elements.exportStudentsBtn.addEventListener('click', handleExportClick);
    }
    if (elements.bulkPointsBtn) {
        elements.bulkPointsBtn.removeEventListener('click', handleBulkPointsClick);
        elements.bulkPointsBtn.addEventListener('click', handleBulkPointsClick);
    }
    if (elements.deleteSelectedBtn) {
        elements.deleteSelectedBtn.removeEventListener('click', handleDeleteSelectedClick);
        elements.deleteSelectedBtn.addEventListener('click', handleDeleteSelectedClick);
    }

    // ربط نماذج النوافذ المنبثقة
    const forms = {
        studentForm: document.getElementById('studentForm'),
        importForm: document.getElementById('importForm'),
        bulkPointsForm: document.getElementById('bulkPointsForm'),
        exportForm: document.getElementById('exportForm')
    };

    console.log('حالة نماذج النوافذ المنبثقة:', {
        studentForm: !!forms.studentForm,
        importForm: !!forms.importForm,
        bulkPointsForm: !!forms.bulkPointsForm,
        exportForm: !!forms.exportForm
    });

    if (forms.studentForm) {
        forms.studentForm.removeEventListener('submit', handleStudentSubmit);
        forms.studentForm.addEventListener('submit', handleStudentSubmit);
    }
    if (forms.importForm) {
        console.log('ربط نموذج الاستيراد مع handleImport');
        forms.importForm.removeEventListener('submit', handleImport);
        forms.importForm.addEventListener('submit', handleImport);
    }
    if (forms.bulkPointsForm) {
        forms.bulkPointsForm.removeEventListener('submit', handleBulkPoints);
        forms.bulkPointsForm.addEventListener('submit', handleBulkPoints);
    }
    if (forms.exportForm) {
        forms.exportForm.removeEventListener('submit', handleExport);
        forms.exportForm.addEventListener('submit', handleExport);
    }

    // نماذج (يجب إرفاقها بالنماذج داخل كل تبويب إذا كانت منفصلة)
    // في هذه الحالة، النماذج (studentModal, importModal, etc) عامة لذا نربط الأحداث مرة واحدة
    const studentForm = document.getElementById('studentForm');
    const importForm = document.getElementById('importForm');
    const bulkPointsForm = document.getElementById('bulkPointsForm');
    const exportForm = document.getElementById('exportForm'); // نموذج خيارات التصدير

    if (studentForm) { studentForm.removeEventListener('submit', handleStudentSubmit); studentForm.addEventListener('submit', handleStudentSubmit); }
    // ملاحظة: نماذج الاستيراد والنقاط الجماعية والتصدير تحتاج لمعالجة خاصة لسياق التبويب
    // سأستخدم دوال وسيطة للنقر على الأزرار التي تفتح هذه النوافذ
    // وسيتم استدعاء handleImport/handleBulkPoints/handleExport من داخل الدوال الوسيطة أو من داخل الدوال العامة

    // البحث والتصفية وتحديد الكل
     if (elements.searchInput) { elements.searchInput.removeEventListener('input', displayStudents); elements.searchInput.addEventListener('input', displayStudents); }
     if (elements.stageFilter) { elements.stageFilter.removeEventListener('change', handleStageFilterChange); elements.stageFilter.addEventListener('change', handleStageFilterChange); }
    // فلتر الفصل يحتاج لاستدعاء updateClassFilter أولاً ثم displayStudents
     if (elements.classFilter) { elements.classFilter.removeEventListener('change', displayStudents); elements.classFilter.addEventListener('change', displayStudents); }
     if (elements.selectAllCheckbox) { elements.selectAllCheckbox.removeEventListener('change', handleSelectAllChange); elements.selectAllCheckbox.addEventListener('change', handleSelectAllChange); }

    // إعداد عناصر التحكم في النقاط (يتم داخل displayStudents)
    // setupPointsControls();
    
    // إرفاق أحداث الصفوف (يتم داخل displayStudents)
    // attachRowEvents();

    console.log('اكتمل إعداد مستمعي الأحداث للعناصر في التبويب:', activeTab);
}

// الدوال الوسيطة للنقر على الأزرار التي تفتح النوافذ المنبثقة المعقدة
function handleImportClick() {
    console.log('فتح نافذة الاستيراد');
    openModal('importModal');
    updateImportClassFilter(); // تحديث فلتر الفصل في نافذة الاستيراد
}

// دالة لحفظ آخر اختيار تصدير
function saveLastExportOption(option) {
    localStorage.setItem('lastExportOption', option);
}

// دالة لاسترجاع آخر اختيار تصدير
function getLastExportOption() {
    return localStorage.getItem('lastExportOption') || 'stage'; // استخدام 'stage' كقيمة افتراضية إذا لم يكن هناك اختيار سابق
}

function handleExportClick() {
    const lastOption = getLastExportOption();
    const exportOption = document.getElementById('exportOption');
    
    // تعيين آخر اختيار كقيمة افتراضية
    exportOption.value = lastOption;
    toggleExportOptions(); // تحديث عرض الخيارات
    
    openModal('exportOptionsModal');
}

function handleBulkPointsClick() {
    document.getElementById('bulkDate').value = new Date().toISOString().split('T')[0];
    openModal('bulkPointsModal');
    // تحديث فلتر المرحلة والفصل في نافذة النقاط الجماعية
    updateBulkClassFilter();
    toggleBulkClassSelection(); // للتأكد من ظهور/إخفاء فلتر الفصل بشكل صحيح
}

function handleDeleteSelectedClick() {
    // تأكيد وحذف الطلاب المحددين في التبويب النشط
    deleteSelectedStudents();
}

// دالة مساعدة لتحديث فلتر المرحلة واستدعاء displayStudents
function handleStageFilterChange() {
    updateClassFilter(); // تحديث قائمة الفصول أولاً
    displayStudents(); // ثم عرض الطلاب بالفلاتر الجديدة
}

// دالة مساعدة لتحديث حالة تحديد الكل بناءً على التبويب النشط
function handleSelectAllChange(event) {
    const elements = getElementsForActiveTab();
    if (!elements || !elements.selectAllCheckbox || !elements.studentsList) return;

    const isChecked = event.target.checked;
    const checkboxes = elements.studentsList.querySelectorAll('.select-checkbox');
    
    selectedStudents.clear(); // مسح التحديدات السابقة قبل التحديد الجديد

    checkboxes.forEach(checkbox => {
        const studentId = parseInt(checkbox.dataset.id);
        checkbox.checked = isChecked;
        if (isChecked) {
            selectedStudents.add(studentId);
        } else {
            selectedStudents.delete(studentId);
        }
    });
    // updateSelectAllState(); // لا نحتاج لاستدعائها هنا، التغيير يحدث بالفعل
}

// دالة عرض الطلاب في الجدول
function displayStudents() {
    console.log('عرض الطلاب للتبويب:', activeTab);
    const elements = getElementsForActiveTab();
    if (!elements || !elements.studentsList) {
        console.error('لا يمكن العثور على عناصر الواجهة للتبويب النشط.', activeTab);
        return;
    }

    var searchTerm = elements.searchInput ? elements.searchInput.value.toLowerCase() : '';
    var stageFilter = elements.stageFilter ? elements.stageFilter.value : '';
    var classFilter = elements.classFilter ? elements.classFilter.value : '';

    // 1. تصفية الطلاب حسب التبويب النشط
    const studentsForActiveTab = students.filter(student => student.category === activeTab);

    // 2. فرز الطلاب المفلترين حسب النقاط داخل هذا التبويب
    var sortedStudents = studentsForActiveTab.slice().sort(function(a, b) {
        if (b.points !== a.points) {
            return b.points - a.points;
        } else {
            return a.id - b.id;
        }
    });

    // 3. تصفية الطلاب المفروزين حسب البحث والمرحلة والفصل
    var filteredStudents = sortedStudents.filter(function(student) {
        var nameMatch = student.name.toLowerCase().includes(searchTerm);
        var stageMatch = !stageFilter || student.stage === stageFilter; // إذا لم يتم اختيار مرحلة، الكل يطابق
        var classMatch = !classFilter || student.class === classFilter; // إذا لم يتم اختيار فصل، الكل يطابق
        return nameMatch && stageMatch && classMatch;
    });

    // 4. حساب الترتيب للطلاب المفلترين الذين سيتم عرضهم
    // نمرر القائمة المفلترة النهائية لحساب الترتيب بناءً عليها
    calculateRanks(filteredStudents, stageFilter, classFilter);

    // 5. عرض الطلاب في الجدول الخاص بالتبويب النشط
    const tbody = elements.studentsList;
    tbody.innerHTML = '';
    
    filteredStudents.forEach(function(student) {
        // تحديد الترتيب المناسب للعرض (ترتيب داخل المجموعة المفلترة حالياً)
        // الترتيب المحسوب في calculateRanks هو الترتيب داخل filteredStudents
        let rank = student.displayRank; // نستخدم خاصية جديدة لحفظ الترتيب المعروض

        // التأكد من أن الترتيب موجود
        if (typeof rank === 'undefined' || rank === null) {
            console.warn('ترتيب غير محدد للطالب (بعد الفلترة):', student);
            rank = 'N/A';
        }

        var row = createStudentRow(student, rank, activeTab); // نمرر activeTab أيضاً إذا أردنا تخصيص الصفوف
        tbody.appendChild(row);
    });

    // 6. إعداد عناصر التحكم في النقاط للصفوف المعروضة
    setupPointsControls(elements.studentsList); // نمرر tbody الصحيح
    
    // 7. إرفاق أحداث الصفوف (تحديد، قائمة الإجراءات) للصفوف المعروضة
    attachRowEvents(elements.studentsList); // نمرر tbody الصحيح
    
    // 8. تحديث حالة تحديد الكل للتبويب النشط
    updateSelectAllState();

    // 9. تحديث فلتر الفصل للتبويب النشط بناءً على فلتر المرحلة
    // يجب استدعاء updateClassFilter بعد تحديث فلتر المرحلة
    // هذا يتم بالفعل في handleStageFilterChange
}

// دالة إنشاء صف للطالب (معدلة قليلاً لتمرير activeTab)
function createStudentRow(student, rank, tabCategory) {
    var row = document.createElement('tr');
    row.setAttribute('data-id', student.id);
    row.setAttribute('data-category', student.category); // إضافة فئة الطالب للتحقق السريع
    
    // إضافة فئات التنسيق بناءً على الترتيب (الترتيب المعروض)
     if (rank !== 'N/A' && rank >= 1 && rank <= 10) {
        row.classList.add('top-10-row');
        if (rank === 1) { row.classList.add('rank-1'); }
        else if (rank === 2) { row.classList.add('rank-2'); }
        else if (rank === 3) { row.classList.add('rank-3'); }
    }
    
    // إضافة أيقونات الميداليات بناءً على الترتيب المعروض
    var medal = '';
    if (rank === 1) { medal = '<span class="top-rank-icon">🥇</span>'; }
    else if (rank === 2) { medal = '<span class="top-rank-icon">🥈</span>'; }
    else if (rank === 3) { medal = '<span class="top-rank-icon">🥉</span>'; }
    
    // التحقق مما إذا كان الطالب محدداً في المجموعة العامة selectedStudents
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

// دالة إعداد عناصر التحكم في النقاط (تأخذ tbody كمعامل)
function setupPointsControls(tbodyElement) {
    if (!tbodyElement) return;
    // إزالة جميع الأحداث السابقة أولاً من tbody المحدد
    tbodyElement.querySelectorAll('.add-points-btn, .subtract-points-btn').forEach(btn => {
        btn.removeEventListener('click', handlePointsButtonClick);
    });

    // إضافة الأحداث الجديدة
    tbodyElement.querySelectorAll('.add-points-btn, .subtract-points-btn').forEach(btn => {
        btn.addEventListener('click', handlePointsButtonClick);
    });
}

// دالة مساعدة لمعالجة النقر على أزرار إضافة/خصم النقاط
function handlePointsButtonClick() {
            var studentId = parseInt(this.getAttribute('data-id'));
            var input = document.getElementById('points-input-' + studentId);
    var pointsChange = parseInt(input.value) || 1;
    var reason = this.classList.contains('add-points-btn') ? 'نقاط يدوية (إضافة)' : 'نقاط يدوية (خصم)';
    var change = this.classList.contains('add-points-btn') ? pointsChange : -pointsChange;
    
    updateStudentPoints(studentId, change, reason);
}

// دالة تحديث نقاط الطالب (عامة، تعمل على أي طالب)
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
    
    // البحث عن سجل التعديل لليوم الحالي لنفس السبب والنوع
    const today = new Date().toISOString().split('T')[0];
    const existingRecordIndex = student.history.findIndex(record => 
        record.date === today && record.reason === reason
    );

    if (existingRecordIndex > -1) {
        // تحديث السجل الموجود
        student.history[existingRecordIndex].oldPoints = oldPoints; // قد تحتاج لتتبع النقطة قبل هذا التغيير تحديداً
        student.history[existingRecordIndex].change += change; // دمج التغيير
        student.history[existingRecordIndex].newPoints = newPoints;
    } else {
        // إضافة سجل جديد
    student.history.push({
            date: today,
        oldPoints: oldPoints,
        change: change,
        newPoints: newPoints,
            reason: reason,
            type: change > 0 ? 'إضافة نقاط' : 'خصم نقاط'
    });
    }
    
    student.points = newPoints;
    
    // إرسال التحديث للخادم
    saveChangesToServer(students);
    
    // تحديث العرض فقط للتبويب النشط الذي يحتوي على هذا الطالب
    // يمكن تحسين هذا لتحديث صف واحد فقط إذا أمكن
    displayStudents(); // إعادة عرض الطلاب المفلترين والمحدثين
    showAlert(`تم تطبيق ${change > 0 ? 'إضافة' : 'خصم'} ${Math.abs(change)} نقطة على الطالب ${student.name}`, 'success');
}

// دالة إرفاق أحداث الصفوف (تأخذ tbody كمعامل)
function attachRowEvents(tbodyElement) {
     if (!tbodyElement) return;
     // إزالة أي مستمعين سابقين للنقر على الصفوف داخل tbody المحدد
    tbodyElement.removeEventListener('click', handleRowClick);
    // إضافة مستمع جديد للنقر على الصفوف
    tbodyElement.addEventListener('click', handleRowClick);
}

// دالة معالجة أحداث الصفوف (عامة)
function handleRowClick(e) {
    var target = e.target;
    var row = target.closest('tr');
    if (!row) return;

    currentStudentId = parseInt(row.dataset.id);

     // إذا تم النقر على Checkbox داخل الصف، دع مستمع حدث الـ checkbox يتعامل معه
    if (target.classList.contains('select-checkbox')) {
        return;
    }

     // إذا تم النقر داخل عناصر التحكم في النقاط، دع مستمع حدث الأزرار يتعامل معه
     if (target.closest('.points-control')) {
         return;
     }

    // إذا تم النقر على زر القائمة المتنقلة
    if (target.classList.contains('mobile-menu-btn')) {
        e.stopPropagation(); // منع انتشار الحدث إلى الصف
        openActionModal(); // فتح نافذة الإجراءات
    } else {
        // إذا تم النقر على الصف نفسه (وليس على Checkbox أو عناصر النقاط أو زر القائمة)
        // يمكن إضافة منطق هنا إذا أردنا شيئاً آخر عند النقر على الصف
        // console.log('تم النقر على الصف للطالب:', currentStudentId);
    }
}

// دالة تحديث حالة تحديد الكل (عامة، تعمل على التبويب النشط)
function updateSelectAllState() {
    const elements = getElementsForActiveTab();
    if (!elements || !elements.selectAllCheckbox || !elements.studentsList) return;

    const selectAll = elements.selectAllCheckbox;
    const checkboxes = elements.studentsList.querySelectorAll('.select-checkbox');
    
    if (checkboxes.length === 0) {
        selectAll.checked = false;
        selectAll.indeterminate = false;
        // selectedStudents.clear(); // لا مسح هنا لتجنب فقدان التحديد في التبويبات الأخرى
        return;
    }

    // حساب عدد الطلاب المحددين في القائمة *المعروضة حالياً* والذين هم أيضاً في selectedStudents
    let checkedCount = 0;
     checkboxes.forEach(checkbox => {
        const studentId = parseInt(checkbox.dataset.id);
        if (selectedStudents.has(studentId)) {
             checkedCount++;
             checkbox.checked = true; // تأكيد أن checkbox محدد إذا كان في selectedStudents
        } else {
             checkbox.checked = false; // تأكيد أن checkbox غير محدد إذا لم يكن في selectedStudents
        }
    });

    // تحديث حالة selectAll بناءً على الـ checkboxes *المعروضة*
    if (checkedCount === 0) {
        selectAll.checked = false;
        selectAll.indeterminate = false;
    } else if (checkedCount === checkboxes.length) {
        selectAll.checked = true;
        selectAll.indeterminate = false;
    } else {
        selectAll.checked = false;
        selectAll.indeterminate = true;
    }
}

// دالة تبديل تحديد الكل (عامة، تعمل على التبويب النشط)
function toggleSelectAll(event) {
     const elements = getElementsForActiveTab();
     if (!elements || !elements.selectAllCheckbox || !elements.studentsList) return;

    const selectAll = elements.selectAllCheckbox;
    const isChecked = event.target.checked;
    const checkboxes = elements.studentsList.querySelectorAll('.select-checkbox');
    
    // قم بتحديث selectedStudents بناءً على حالة تحديد الكل للطلاب *المعروضين حالياً*
        checkboxes.forEach(checkbox => {
            const studentId = parseInt(checkbox.dataset.id);
        checkbox.checked = isChecked;
        if (isChecked) {
            selectedStudents.add(studentId);
    } else {
            selectedStudents.delete(studentId);
        }
        });
    // updateSelectAllState(); // لا نحتاج لاستدعائها هنا
}

// دالة معالجة إضافة/تعديل طالب (معدلة لإضافة الفئة)
function handleStudentSubmit(e) {
    e.preventDefault();
    console.log('بدء معالجة نموذج الطالب للتبويب:', activeTab);

    const selectedDate = document.getElementById('modalDate').value;
    const id = document.getElementById('studentId').value;
    const name = document.getElementById('modalName').value.trim();
    const stage = document.getElementById('modalStage').value;
    const studentClass = document.getElementById('modalClass').value;
    const points = parseInt(document.getElementById('modalPoints').value);
    
    console.log('بيانات النموذج:', {
        id,
        name,
        stage,
        studentClass,
        points,
        date: selectedDate,
        category: activeTab // إضافة الفئة
    });
    
    if (!name || isNaN(points)) {
        showAlert('الرجاء إدخال بيانات صحيحة', 'warning');
        return;
    }

    if (!stage || !studentClass) {
        showAlert('الرجاء اختيار المرحلة والفصل', 'warning');
        return;
    }
    
    // التحقق من أن الفصل المختار ينتمي للمرحلة المحددة
    if (!stageClasses[stage] || !stageClasses[stage].classes.includes(studentClass)) {
        showAlert('الفصل المختار للاستيراد لا ينتمي للمرحلة المحددة', 'warning');
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
            const studentCategory = students[index].category; // الحفاظ على الفئة الأصلية
            
            if (!students[index].history) { students[index].history = []; }
            
            // إضافة سجل التعديل
             const today = new Date().toISOString().split('T')[0];
             student.history.push({
                date: selectedDate || today,
                oldPoints: oldPoints,
                change: change,
                newPoints: points,
                reason: 'تعديل البيانات يدوياً',
                type: change > 0 ? 'إضافة نقاط' : (change < 0 ? 'خصم نقاط' : 'لا تغيير')
            });
            
            // تحديث بيانات الطالب
            students[index] = {
                ...students[index],
                name: name,
                class: studentClass,
                stage: stage,
                points: points,
                category: studentCategory // التأكد من عدم تغيير الفئة عند التعديل
            };

            console.log('تم تحديث بيانات الطالب:', students[index]);
        } else {
            console.error('لم يتم العثور على الطالب المراد تعديله');
            showAlert('حدث خطأ أثناء تعديل الطالب', 'danger');
            return;
        }
    } else {
        // إضافة طالب جديد
        const newStudent = {
            id: nextId++, // توليد معرف جديد لكل طالب مستورد
            name: name,
            class: studentClass, // استخدام الفصل المحدد من النافذة
            stage: stage, // استخدام المرحلة المحددة من النافذة
            points: points,
            category: activeTab, // تعيين الفئة بناءً على التبويب النشط
            history: [{
                date: new Date().toISOString().split('T')[0],
                oldPoints: 0,
                change: points,
                newPoints: points,
                reason: 'استيراد من إكسل',
                type: 'إضافة نقاط'
            }]
        };
        students.push(newStudent);
        console.log('تم إضافة طالب جديد:', newStudent);
    }

    // إرسال التحديث للخادم
    saveChangesToServer(students);

    closeModal('studentModal');
    displayStudents(); // إعادة عرض الطلاب في التبويب النشط
    showAlert(id ? 'تم تعديل بيانات الطالب بنجاح' : 'تم إضافة الطالب بنجاح', 'success');
}

// دالة حذف الطلاب المحددين (معدلة للعمل على المجموعة المحددة بغض النظر عن التبويب)
function deleteSelectedStudents() {
    if (selectedStudents.size === 0) {
        showAlert('الرجاء تحديد طالب واحد على الأقل', 'warning');
        return;
    }
    // نفتح نافذة التأكيد أولاً
    openModal('deleteConfirmation');
}

// دالة تأكيد الحذف (تنفذ الحذف بعد تأكيد المستخدم)
function confirmDelete() {
    // نحذف الطلاب من القائمة الرئيسية students
    students = students.filter(function(student) {
        return !selectedStudents.has(student.id);
    });
    
    // إرسال التحديث للخادم
    saveChangesToServer(students);
    
    selectedStudents.clear(); // مسح التحديدات بعد الحذف
    closeModal('deleteConfirmation');
    displayStudents(); // إعادة عرض الطلاب في التبويب النشط
    showAlert('تم حذف الطلاب المحددين بنجاح', 'success');
}

// دالة معالجة النقاط الجماعية (تحتاج لتعديل لتأخذ في الاعتبار التبويب النشط)
function handleBulkPoints(e) {
    e.preventDefault();
    console.log('بدء معالجة النقاط الجماعية للتبويب:', activeTab);

    const points = parseInt(document.getElementById('bulkPointsAmount').value);
    const operation = document.getElementById('bulkOperationType').value;
    const applyTo = document.getElementById('bulkApplyTo').value;
    const selectedClass = document.getElementById('bulkClass').value;
    const date = document.getElementById('bulkDate').value;
    const reason = document.getElementById('bulkReason')?.value || 'نقاط جماعية';

    if (isNaN(points) || points <= 0) {
        showAlert('الرجاء إدخال عدد نقاط صحيح وموجب', 'warning');
        return;
    }

    let targets = [];

    // تحديد مجموعة الطلاب المستهدفين بناءً على الخيار والفئة النشطة
    const studentsInActiveTab = students.filter(student => student.category === activeTab);

    if (applyTo === 'selected') {
        // استهداف الطلاب المحددين حالياً والذين ينتمون أيضاً للتبويب النشط (للتأكيد)
        targets = studentsInActiveTab.filter(function(student) {
            return selectedStudents.has(student.id);
        });
         if (targets.length !== selectedStudents.size) {
             console.warn('بعض الطلاب المحددين لا ينتمون للتبويب النشط!');
             // يمكن عرض رسالة تحذير هنا للمستخدم
         }
    } else if (applyTo === 'class') {
        // استهداف طلاب فصل معين داخل التبويب النشط
        targets = studentsInActiveTab.filter(function(student) {
            return student.class === selectedClass;
        });
    } else { // applyTo === 'all'
        // استهداف جميع الطلاب في التبويب النشط
        targets = studentsInActiveTab;
    }

    if (targets.length === 0) {
        showAlert('لا يوجد طلاب مستهدفون لتطبيق النقاط عليهم في هذا التبويب والفلاتر المختارة.', 'warning');
        return;
    }

    const change = operation === 'add' ? points : -points;

    targets.forEach(function(student) {
        if (!student.history) { student.history = []; }
        
        const oldPoints = student.points;
        const newPoints = Math.max(0, oldPoints + change);

        // البحث عن سجل التعديل لليوم الحالي لنفس السبب والنوع
        const today = new Date().toISOString().split('T')[0];
        const existingRecordIndex = student.history.findIndex(record => 
            record.date === today && record.reason === reason
        );

        if (existingRecordIndex > -1) {
            // تحديث السجل الموجود
            student.history[existingRecordIndex].oldPoints = oldPoints; // قد تحتاج لتتبع النقطة قبل هذا التغيير تحديداً
            student.history[existingRecordIndex].change += change; // دمج التغيير
            student.history[existingRecordIndex].newPoints = newPoints;
        } else {
            // إضافة سجل جديد
        student.history.push({
            date: date,
            oldPoints: oldPoints,
            change: change,
            newPoints: newPoints,
            reason: reason,
            type: operation === 'add' ? 'إضافة نقاط' : 'خصم نقاط'
        });
        }
        
        student.points = newPoints;
    });

    // إرسال التحديث للخادم
    saveChangesToServer(students);

    closeModal('bulkPointsModal');
    // لا نمسح selectedStudents هنا، بل نتركها كما هي لتعكس التحديدات في التبويب الحالي
    displayStudents(); // إعادة عرض الطلاب في التبويب النشط
    showAlert(`تم تطبيق ${operation === 'add' ? 'إضافة' : 'خصم'} ${points} نقطة على ${targets.length} طالب في تبويب ${activeTab}`, 'success');
    updateSelectAllState(); // تحديث حالة تحديد الكل بعد التغيير
}

// دالة حذف طالب واحد (تستخدم deleteSelectedStudents)
function deleteSingleStudent(id) {
     console.log('حذف طالب واحد:', id, 'من التبويب:', activeTab);
     // نحتاج للتأكد أن الطالب ينتمي للتبويب النشط قبل حذفه إذا كنا نريد تقييد الحذف للتبويب النشط فقط
     // أو نعتمد على أن selectedStudents ستكون قد تم تحديثها بالفعل لتعكس الطلاب المحددين في التبويب النشط

    // مسح التحديدات الحالية وإضافة الطالب المراد حذفه فقط
    selectedStudents.clear();
    selectedStudents.add(id);
    
    // استدعاء دالة حذف الطلاب المحددين العامة
    deleteSelectedStudents(); // هذه الدالة ستفتح نافذة التأكيد وتنفذ الحذف
}

// دالة تحديث قائمة الفصول حسب المرحلة المختارة (عامة للفلتر في صفحة المشرف)
function updateClassFilter() {
    const elements = getElementsForActiveTab();
     if (!elements || !elements.stageFilter || !elements.classFilter) {
        console.error('عناصر فلتر المرحلة أو الفصل غير موجودة.');
        return;
    }

    const stageFilter = elements.stageFilter;
    const classFilter = elements.classFilter;
    const selectedStage = stageFilter.value;
    
    // مسح القائمة الحالية
    classFilter.innerHTML = '<option value="">جميع الفصول</option>';
    
    if (selectedStage && stageClasses[selectedStage]) {
        stageClasses[selectedStage].classes.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            classFilter.appendChild(option);
        });
    }
    // لا نستدعي displayStudents هنا، يتم استدعاؤها من handleStageFilterChange
}

// دالة تحديث قائمة الفصول في نافذة إضافة/تعديل الطالب (عامة)
function updateModalClassFilter() {
    const stageSelect = document.getElementById('modalStage');
    const classSelect = document.getElementById('modalClass');
    const selectedStage = stageSelect.value;
    
    // مسح القائمة الحالية
    classSelect.innerHTML = '';
    
    if (selectedStage && stageClasses[selectedStage]) {
        stageClasses[selectedStage].classes.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            classSelect.appendChild(option);
        });
    }
}

// دالة تحديث قائمة الفصول في نافذة الاستيراد (عامة)
function updateImportClassFilter() {
    const stageSelect = document.getElementById('importStage');
    const classSelect = document.getElementById('importClass');
    const selectedStage = stageSelect.value;
    
    // مسح القائمة الحالية
    classSelect.innerHTML = '';
    
    if (selectedStage && stageClasses[selectedStage]) {
        stageClasses[selectedStage].classes.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            classSelect.appendChild(option);
        });
    }
}

// دالة تحديث قائمة الفصول في نافذة التصدير (عامة)
function updateExportClassFilter() {
    const stageSelect = document.getElementById('exportStageSelect');
    const classSelect = document.getElementById('exportClassSelect');
    const selectedStage = stageSelect.value;

    // مسح قائمة الفصول وإضافة الخيار الافتراضي
    classSelect.innerHTML = '<option value="">اختر الفصل</option>';

    // إذا لم يتم اختيار مرحلة، لا نضيف أي فصول
    if (!selectedStage) {
        return;
    }

    // إضافة الفصول الخاصة بالمرحلة المختارة
    if (stageClasses[selectedStage]) {
        stageClasses[selectedStage].classes.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            classSelect.appendChild(option);
        });
    }
}

// دالة تبديل خيارات التصدير (عامة)
function toggleExportOptions() {
    const exportOption = document.getElementById('exportOption').value;
    const stageSelection = document.getElementById('exportStageSelection');
    const classSelection = document.getElementById('exportClassSelection');

    // إخفاء جميع خيارات التصفية أولاً
    stageSelection.style.display = 'none';
    classSelection.style.display = 'none';

    // إظهار الخيارات المناسبة حسب نوع التصدير
    switch (exportOption) {
        case 'stage':
        case 'top10SingleStage':
            stageSelection.style.display = 'block';
            break;
        case 'class':
            stageSelection.style.display = 'block';
            classSelection.style.display = 'block';
            updateExportClassFilter(); // تحديث قائمة الفصول عند اختيار المرحلة
            break;
        case 'fullBackup':
            // لا تظهر أي فلاتر للنسخ الاحتياطي الكامل
            break;
    }
}

// دالة تحديد مرحلة الطالب (نستخدم الخاصية المخزنة مباشرة)
function getStudentStage(student) {
    return student.stage || null;
}

// دالة حساب الترتيب (معدلة للعمل على القائمة المفلترة المعروضة)
function calculateRanks(filteredStudents, stageFilter, classFilter) {
    // حساب الترتيب داخل القائمة المفلترة (التي سيتم عرضها)
    filteredStudents.forEach((student, index) => {
         // نستخدم خاصية جديدة لحفظ الترتيب المعروض بناءً على الفلاتر الحالية
        student.displayRank = index + 1;
        // يمكن أيضاً حساب الترتيب داخل المرحلة والفصل ضمن هذه المجموعة إذا لزم الأمر
        // لكن displayRank يكفي للعرض حسب الطلب الحالي
    });
}

// دالة تحديث التاريخ
function updateDate() {
    console.log('بدء تحديث التاريخ...');
    const dateElement = document.getElementById('currentDate');
    
    if (!dateElement) {
        console.error('عنصر التاريخ غير موجود في الصفحة (currentDate)');
        return;
    }
    
    try {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const date = new Date().toLocaleDateString('ar-EG', options);
        console.log('التاريخ المنسق:', date);
        
        // تحديث النص مباشرة
        dateElement.textContent = date;
        
        // التأكد من أن النص تم تحديثه
        if (dateElement.textContent === date) {
            console.log('تم تحديث عنصر التاريخ بنجاح');
            // إضافة تأثير بصرية للتأكيد
            dateElement.style.opacity = '0';
            setTimeout(() => {
                dateElement.style.transition = 'opacity 0.3s ease';
                dateElement.style.opacity = '1';
            }, 50);
        } else {
            console.error('فشل تحديث النص في عنصر التاريخ');
            // محاولة تحديث النص مرة أخرى
            setTimeout(() => {
                dateElement.textContent = date;
                console.log('محاولة تحديث النص مرة أخرى');
            }, 100);
        }
    } catch (error) {
        console.error('حدث خطأ أثناء تحديث التاريخ:', error);
        // محاولة تحديث التاريخ مرة أخرى بعد ثانية
        setTimeout(updateDate, 1000);
    }
}

// دالة عرض سجل الطالب
function showHistory(studentId) {
    const student = students.find(function(s) {
        return s.id === studentId;
    });
    
    if (!student || !student.history || student.history.length === 0) {
        showAlert('لا يوجد سجل لهذا الطالب', 'info');
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

// دالة تعديل طالب (عامة)
function editStudent(id) {
    const student = students.find(function(s) {
        return s.id === id;
    });
    
    if (!student) return;

    document.getElementById('studentId').value = student.id;
    document.getElementById('modalName').value = student.name;
    document.getElementById('modalPoints').value = student.points;
    document.getElementById('modalTitle').textContent = 'تعديل بيانات الطالب';
    document.getElementById('modalDate').value = new Date().toISOString().split('T')[0];
    
    // تحديد المرحلة والفصل
    const stage = student.stage;
    const studentClass = student.class;

    if (stage) {
        document.getElementById('modalStage').value = stage;
        updateModalClassFilter(); // تحديث قائمة الفصول
        // التأكد من أن الفصل موجود في القائمة المحدثة قبل تعيينه
        if (Array.from(document.getElementById('modalClass').options).some(opt => opt.value === studentClass)) {
             document.getElementById('modalClass').value = studentClass;
        }
    } else {
         // في حالة عدم وجود مرحلة مخزنة، تعيين الافتراضي وتحديث الفلاتر
        document.getElementById('modalStage').value = 'primary';
        updateModalClassFilter();
    }
    
    openModal('studentModal');
}

// دالة إرسال التحديثات للخادم (عامة)
function saveChangesToServer(updatedStudents) {
    if (typeof socket !== 'undefined') {
        socket.emit('updateFromAdmin', { students: updatedStudents });
    } else {
        console.error('Socket.io غير معرف. لا يمكن إرسال التحديثات.');
    }
}

// إضافة مستمع حدث DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('تم تحميل الصفحة بالكامل');
    console.log('استدعاء init...');
    init();
});

// دالة التحكم في عرض محتوى التبويبات (لصفحة المشرف)
function activateTab(tabName) {
     console.log('تفعيل التبويب:', tabName);
    if (tabName === 'نقاطي' || tabName === 'انا متميز') {
        activeTab = tabName;
        updateTabUI(); // تحديث عرض التبويبات والأقسام
        displayStudents(); // عرض الطلاب للتبويب الجديد
        setupTabSpecificEventListeners(); // إعادة إعداد مستمعي الأحداث الخاصة بالعناصر في التبويب النشط
    }
}

// عند تحميل الصفحة، تأكد من تفعيل التبويب الافتراضي (نقاطي) وإعداد المستمعين الأولي
window.addEventListener('load', () => {
    activateTab('نقاطي');
});

// تأكد من وجود showAlert أو قم بتعريفها هنا إذا لم تكن موجودة
if (typeof showAlert === 'undefined') {
    function showAlert(message, type = 'info') {
        console.log('ALERT:', type, message);
        // هنا يمكنك إضافة منطق عرض التنبيهات المرئي إذا لم يكن موجوداً
        // مثال بسيط:
        // alert(type.toUpperCase() + ': ' + message);
    }
}

// دالة معالجة تصدير البيانات
function handleExport() {
    const exportOption = document.getElementById('exportOption').value;
    
    // حفظ الاختيار الحالي
    saveLastExportOption(exportOption);
    
    const stageSelect = document.getElementById('exportStageSelect');
    const classSelect = document.getElementById('exportClassSelect');
    const selectedStage = stageSelect.value;
    const selectedClass = classSelect.value;

    // التحقق من صحة الاختيارات حسب نوع التصدير (تختلف للنسخ الاحتياطي الكامل)
    if (exportOption === 'class' && (!selectedStage || !selectedClass)) {
        showAlert('الرجاء اختيار المرحلة والفصل', 'warning');
        return;
    } else if ((exportOption === 'stage' || exportOption === 'top10SingleStage') && !selectedStage) {
        showAlert('الرجاء اختيار المرحلة', 'warning');
        return;
    }

    console.log('بدء معالجة التصدير للتبويب:', activeTab);

    let studentsToExport = [];
    let fileName = `students_${activeTab}`;
    let data = []; // بيانات التصدير

    if (exportOption === 'fullBackup') {
        // نسخ احتياطي كامل: تصدير جميع الطلاب بكامل بياناتهم وتاريخهم
        studentsToExport = students; // جميع الطلاب بغض النظر عن التبويب
        fileName = 'full_students_backup';

        // إعداد البيانات للنسخ الاحتياطي الكامل (بما في ذلك التاريخ)
        data = studentsToExport.map(student => {
            // تنسيق سجل التاريخ إلى سلسلة نصية
            const historyString = student.history && student.history.length > 0
                ? student.history.map(h => `${h.date}: ${h.reason} (${h.change > 0 ? '+' : ''}${h.change})`).join('\n')
                : '';

            return {
                'معرف الطالب': student.id,
                'اسم الطالب': student.name,
                'المرحلة': stageClasses[student.stage]?.name || student.stage,
                'الفصل': student.class,
                'النقاط': student.points,
                'الفئة': student.category,
                'سجل التعديلات': historyString
            };
        });

    } else {
        // باقي خيارات التصدير (تصفية حسب التبويب والخيارات المختارة)
        const studentsInActiveTab = students.filter(student => student.category === activeTab);

        if (exportOption === 'stage') {
            studentsToExport = studentsInActiveTab.filter(student => student.stage === selectedStage);
            fileName += `_${selectedStage}`;
        } else if (exportOption === 'class') {
            studentsToExport = studentsInActiveTab.filter(student => student.class === selectedClass);
            fileName += `_${selectedClass.replace('/','-')}`;
        } else if (exportOption === 'top10SingleStage') {
            // تصدير العشرة الأوائل لمرحلة معينة
            studentsToExport = studentsInActiveTab
                .filter(student => student.stage === selectedStage)
                .sort((a, b) => b.points - a.points)
                .slice(0, 10);
            fileName += `_top10_${selectedStage}`;
        }

         if (studentsToExport.length === 0) {
            showAlert('لا يوجد طلاب لتصديرهم بالمعايير المختارة.', 'warning');
            return;
        }

        // إعداد البيانات لملف الإكسل للخيارات العادية
        data = studentsToExport.map(student => ({
            'الترتيب (تقريبي)': student.displayRank || '', // يمكن تحسين هذا
            'اسم الطالب': student.name,
            'المرحلة': stageClasses[student.stage]?.name || student.stage,
            'الفصل': student.class,
            'النقاط': student.points
        }));
    }

    if (data.length === 0) {
        showAlert('لا يوجد بيانات لتصديرها بالمعايير المختارة.', 'warning');
        return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, fileName);

    // حفظ الملف
    XLSX.writeFile(wb, `${fileName}.xlsx`);
    
    closeModal('exportOptionsModal');
    showAlert(`تم تصدير ${data.length} سجل طالب`, 'success');
}

// دالة معالجة استيراد البيانات (تحتاج لتعديل لتأخذ في الاعتبار التبويب النشط)
function handleImport(e) {
    console.log('بدء معالجة نموذج الاستيراد');
    e.preventDefault();
    
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
    
    console.log('حالة الملف:', {
        fileExists: !!file,
        fileName: file ? file.name : 'لا يوجد ملف',
        fileType: file ? file.type : 'لا يوجد نوع'
    });

    if (!file) {
        showAlert('الرجاء اختيار ملف إكسل', 'warning');
        return;
    }

    const importStage = document.getElementById('importStage').value;
    const importClass = document.getElementById('importClass').value;
    const importMethod = document.getElementById('importMethod').value;

    console.log('خيارات الاستيراد:', {
        stage: importStage,
        class: importClass,
        method: importMethod
    });

    if (!importStage || !importClass) {
        showAlert('الرجاء اختيار المرحلة والفصل للاستيراد', 'warning');
        return;
    }

    if (!stageClasses[importStage] || !stageClasses[importStage].classes.includes(importClass)) {
        showAlert('الفصل المختار للاستيراد لا ينتمي للمرحلة المحددة', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            console.log('بدء قراءة الملف');
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            console.log('بيانات الملف المستورد:', {
                sheetName,
                rowCount: jsonData.length,
                firstRow: jsonData[0]
            });

            const importedStudents = jsonData.map(function(row) {
                const studentName = row['اسم الطالب'] || row['name'] || 'طالب مستورد';
                const studentPoints = parseInt(row['النقاط'] || row['points'] || 0);

                if (!studentName || isNaN(studentPoints)) {
                    throw new Error(`بيانات غير صالحة في السطر: ${JSON.stringify(row)}`);
                }

                return {
                    id: nextId++,
                    name: studentName,
                    class: importClass,
                    stage: importStage,
                    points: studentPoints,
                    category: activeTab,
                    history: [{
                        date: new Date().toISOString().split('T')[0],
                        oldPoints: 0,
                        change: studentPoints,
                        newPoints: studentPoints,
                        reason: 'استيراد من إكسل',
                        type: 'إضافة نقاط'
                    }]
                };
            });

            console.log('الطلاب المستوردون:', {
                count: importedStudents.length,
                firstStudent: importedStudents[0]
            });

            if (importedStudents.length === 0) {
                showAlert('لم يتم العثور على بيانات طلاب صالحة للاستيراد في الملف.', 'warning');
                return;
            }

            // معالجة البيانات المستوردة بناءً على طريقة الاستيراد
            if (importMethod === 'fullBackupReplace') {
                console.log('استبدال كامل للبيانات الحالية (نسخ احتياطي)');
                students = importedStudents;
                // عند الاستبدال الكامل، المرحلة والفصل المختاران في النافذة لا تؤثر على البيانات المستوردة نفسها
                // ولكن يجب التأكد من أن البيانات في ملف الإكسل تحتوي على جميع الحقول المطلوبة (id, name, stage, class, points, category, history)
                // يفترض أن ملف النسخ الاحتياطي الكامل يحتوي على هذه البيانات.

            } else if (importMethod === 'replace') {
                console.log('استبدال الطلاب الحاليين في التبويب النشط');
                // استبدال الطلاب في التبويب النشط فقط مع الطلاب المستوردين الذين ينتمون لنفس التبويب والمرحلة والفصل المختارين
                // يجب تصفية importedStudents هنا إذا كنا نريد الالتزام بالتبويب والمرحلة والفصل المختارين
                // حالياً، الكود يضيف جميع importedStudents بعد حذف طلاب التبويب النشط، وهذا قد لا يكون السلوك المطلوب للاستبدال الجزئي
                // السلوك الحالي للاستبدال هو حذف جميع طلاب التبويب النشط ثم إضافة جميع الطلاب المستوردين إليهم، بغض النظر عن مرحلتهم وفصلهم في الملف المستورد.
                // لتعديل هذا السلوك ليصبح استبدالاً دقيقاً ضمن المرحلة والفصل المختارين في النافذة: سنحتاج لتعديل هنا.
                // للتبسيط حالياً مع التركيز على النسخ الاحتياطي الكامل: سنبقي السلوك الحالي للاستبدال الجزئي كما هو.
                
                // السلوك الحالي (حذف طلاب التبويب النشط وإضافة كل المستوردين):
                students = students.filter(student => student.category !== activeTab);
                // تصفية importedStudents حسب المرحلة والفصل المختارين قبل الإضافة
                const filteredImportedStudents = importedStudents.filter(student => 
                    student.stage === importStage && student.class === importClass
                );
                students = students.concat(filteredImportedStudents);
                 showAlert(`تم استبدال طلاب تبويب ${activeTab} بالفصل ${importClass} بنجاح`, 'success');

            } else { // importMethod === 'append'
                console.log('إضافة الطلاب الجدد إلى البيانات الحالية في التبويب النشط والمرحلة والفصل المختارين');
                // إضافة الطلاب المستوردين إلى البيانات الحالية مع تعيين المرحلة والفصل والفئة بناءً على المحدد في النافذة
                importedStudents.forEach(student => {
                    // نعدل بيانات الطالب المستورد ليتناسب مع الفلاتر المختارة في نافذة الاستيراد
                    student.stage = importStage;
                    student.class = importClass;
                    student.category = activeTab; // يتم إضافة الطالب للتبويب النشط
                    // إذا كان ملف الاستيراد يحتوي على تاريخ، نحافظ عليه، وإلا ننشئ سجل جديد
                     if (!student.history || student.history.length === 0) {
                         student.history = [{
                             date: new Date().toISOString().split('T')[0],
                             oldPoints: 0,
                             change: student.points,
                             newPoints: student.points,
                             reason: 'استيراد من إكسل',
                             type: 'إضافة نقاط'
                         }];
                     }
                     students.push(student);
                });
                 showAlert(`تم إضافة ${importedStudents.length} طالب إلى تبويب ${activeTab}، المرحلة ${stageClasses[importStage]?.name || importStage}، الفصل ${importClass}`, 'success');
            }

            // تحديث nextId ليكون أكبر من أكبر معرف موجود بعد أي عملية استيراد
            nextId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
            console.log('nextId الجديد:', nextId);

            // إرسال التحديث للخادم
            console.log('إرسال التحديث للخادم');
            saveChangesToServer(students);

            // مسح ملف الإكسل وإغلاق النافذة
            clearFileSelection();
            closeModal('importModal');
            displayStudents();
            // رسالة النجاح يتم عرضها داخل كل فرع من فروع importMethod
            // showAlert(`تم استيراد ${importedStudents.length} طالب إلى تبويب ${activeTab}`, 'success');
        } catch (error) {
            console.error('خطأ في استيراد الملف:', error);
            showAlert(`حدث خطأ أثناء استيراد الملف: ${error.message}`, 'error');
        }
    };

    reader.onerror = function(error) {
        console.error('خطأ في قراءة الملف:', error);
        showAlert('حدث خطأ أثناء قراءة الملف', 'error');
    };

    console.log('بدء قراءة الملف كـ ArrayBuffer');
    reader.readAsArrayBuffer(file);
}

// دالة مساعدة لمسح اختيار الملف بـ window لجعلها عامة إذا لزم الأمر (أو يمكن استدعاؤها مباشرة الآن)
// window.clearFileSelection = clearFileSelection;

// إرفاق دالة مسح الملف بـ window لجعلها عامة إذا لزم الأمر (أو يمكن استدعاؤها مباشرة الآن)
// window.clearFileSelection = clearFileSelection;

// إضافة مستمع حدث DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('تم تحميل الصفحة بالكامل');
    console.log('استدعاء init...');
    init();
});

// دالة تحديث قائمة الفصول في نافذة النقاط الجماعية
function updateBulkClassFilter() {
    const stageSelect = document.getElementById('bulkStage');
    const classSelect = document.getElementById('bulkClass');
    const selectedStage = stageSelect.value;

    // مسح القائمة الحالية
    classSelect.innerHTML = '';

    if (selectedStage && stageClasses[selectedStage]) {
        stageClasses[selectedStage].classes.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            classSelect.appendChild(option);
        });
    }
}

// دالة لحفظ آخر اختيار تصدير
// ... existing code ...
function handleBulkPointsClick() {
    document.getElementById('bulkDate').value = new Date().toISOString().split('T')[0];
    openModal('bulkPointsModal');
    // تحديث فلتر المرحلة والفصل في نافذة النقاط الجماعية
    updateBulkClassFilter();
    toggleBulkClassSelection(); // للتأكد من ظهور/إخفاء فلتر الفصل بشكل صحيح
}

function handleDeleteSelectedClick() {
// ... existing code ...
} 