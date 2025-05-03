// بدء التطبيق عند تحميل الصفحة
// document.addEventListener('DOMContentLoaded', init); // سنستخدم window.onload بدلاً منه

// المتغيرات العامة
var students = [];
// var nextId = 1; // لم نعد بحاجة إليه، قاعدة البيانات ستدير الـ IDs
var selectedStudents = new Set();
var currentStudentId = null;
const API_BASE_URL = ''; // المسار إلى مجلد ملفات PHP، اتركه فارغًا إذا كانت في نفس المجلد

// دالة التهيئة الأولية
async function init() {
    // loadFromLocalStorage(); // إزالة الاعتماد على التخزين المحلي
    setupEventListeners();
    await loadStudents(); // جلب البيانات من الخادم عند البدء
    updateDate();
    document.getElementById('bulkClass').value = '1/1';
}

// استبدال DOMContentLoaded بـ window.onload لضمان تحميل كل شيء
window.addEventListener('load', async () => {
    await init(); // استدعاء دالة التهيئة الرئيسية
});

// دالة تحميل البيانات من التخزين المحلي
function loadFromLocalStorage() {
    // لم تعد مستخدمة، سيتم الجلب من الخادم
    console.warn("loadFromLocalStorage is deprecated. Data is now fetched from the server.");
}

// دالة حفظ البيانات في التخزين المحلي
function saveToLocalStorage() {
    var dataToSave = {
        students: students,
        nextId: nextId
    };
    // لم تعد مستخدمة، سيتم الحفظ عبر استدعاءات API
    console.warn("saveToLocalStorage is deprecated. Data is now saved via API calls.");
}

// دالة جديدة لجلب الطلاب من الخادم
async function loadStudents() {
    try {
        const response = await fetch(`${API_BASE_URL}load_students.php`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.status === 'success') {
            students = result.students || [];
            displayStudents(); // عرض الطلاب بعد الجلب بنجاح
            updateSelectAllState(); // تحديث حالة تحديد الكل
        } else {
            showAlert(`خطأ في جلب الطلاب: ${result.message}`, 'danger');
        }
    } catch (error) {
        console.error('Error loading students:', error);
        showAlert('حدث خطأ أثناء تحميل بيانات الطلاب. حاول تحديث الصفحة.', 'danger');
    }
}

// دالة عرض الطلاب في الجدول
function displayStudents() { // لم تعد بحاجة لتمرير الطلاب كوسيط
    const tbody = document.getElementById('studentsList');
    // استخدام event delegation بدلاً من إعادة ربط الأحداث في كل مرة
    // إزالة المستمعين القدامى إذا كانوا موجودين (أكثر أمانًا)
    tbody.removeEventListener('click', handleTableClick);
    tbody.removeEventListener('change', handleTableChange);

    tbody.innerHTML = '';

    // فلترة الطلاب بناءً على البحث والفصل المحدد
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const classFilter = document.getElementById('classFilter').value;

    const filteredStudents = students.filter(student => {
        const nameMatch = student.name.toLowerCase().includes(searchTerm);
        const classMatch = classFilter === '' || student.class === classFilter;
        return nameMatch && classMatch;
    });

    filteredStudents.forEach((student, index) => {
        // استخدام دالة createStudentRow لإنشاء الصفوف
        const rank = index + 1; // أو يمكنك حساب الترتيب بناءً على النقاط إذا أردت
        const row = createStudentRow(student, rank);
        tbody.appendChild(row); // استخدام appendChild بدلاً من innerHTML +=
    });

    // إضافة المستمعين الجدد باستخدام event delegation
    tbody.addEventListener('click', handleTableClick);
    tbody.addEventListener('change', handleTableChange);

    updateSelectAllState(); // تأكد من تحديث حالة تحديد الكل بعد العرض
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
            <!-- يمكنك إضافة أزرار التعديل والحذف هنا إذا أردت بدلاً من القائمة المنبثقة -->
        </td>
    `;
    
    return row;
}

// إضافة هذه الدوال الجديدة:
// لم نعد بحاجة لهذه الدالة مع استخدام event delegation
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

    // // إضافة الأحداث الجديدة (تم نقل هذا المنطق إلى handleTableClick)
    // document.querySelectorAll('.add-points-btn').forEach(function(btn) {
    //     btn.addEventListener('click', function() {
    //         var studentId = parseInt(this.getAttribute('data-id'));
    //         var input = document.getElementById('points-input-' + studentId);
    //         var pointsChange = parseInt(input.value) || 1;
    //         // تمرير التاريخ الحالي والسبب
    //         const currentDate = new Date().toISOString().split('T')[0];
    //         updateStudentPoints(studentId, pointsChange, 'إضافة نقاط يدوية', currentDate);
    //     });
    // });

    // document.querySelectorAll('.subtract-points-btn').forEach(function(btn) {
    //     btn.addEventListener('click', function() {
    //         var studentId = parseInt(this.getAttribute('data-id'));
    //         var input = document.getElementById('points-input-' + studentId);
    //         var pointsChange = -(parseInt(input.value) || 1);
    //          // تمرير التاريخ الحالي والسبب
    //         const currentDate = new Date().toISOString().split('T')[0];
    //         updateStudentPoints(studentId, pointsChange, 'خصم نقاط يدوي', currentDate);
    //     });
    // });
}

// تعديل الدالة لاستقبال التغيير في النقاط والسبب والتاريخ
async function updateStudentPoints(id, pointsChange, reason = 'تحديث نقاط', date = null) {
    try {
        // استخدام API_BASE_URL وتصحيح بناء الجسم
        const response = await fetch(`${API_BASE_URL}update_points.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: id,
                pointsChange: pointsChange, // إرسال التغيير
                reason: reason,
                date: date // إرسال التاريخ إذا كان متوفرًا
            })
        });
        const result = await response.json();
        if (response.ok && result.status === 'success') {
            // تحديث الواجهة مباشرة أو إعادة تحميل الكل
            // الطريقة الأفضل: تحديث الواجهة مباشرة بناءً على الرد
            const pointsDisplay = document.getElementById(`points-display-${id}`);
            if (pointsDisplay) {
                pointsDisplay.textContent = result.newPoints; // استخدام النقاط الجديدة من الرد
            }
            // تحديث الكائن في مصفوفة students المحلية أيضًا (اختياري ولكن يحافظ على التناسق)
            const studentIndex = students.findIndex(s => s.id === id);
            if (studentIndex !== -1) {
                students[studentIndex].points = result.newPoints;
            }
            // أو إعادة تحميل الكل إذا كان التحديث المباشر معقدًا
            // await loadStudents();
            // showAlert('تم تحديث النقاط بنجاح', 'success'); // يمكن إضافة تنبيه هنا
        } else {
             showAlert(`فشل تحديث النقاط: ${result.message || response.statusText}`, 'danger');
        }

    } catch (error) {
        console.error('خطأ في التحديث:', error);
        showAlert('حدث خطأ أثناء تحديث النقاط.', 'danger');
    }
}



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
    document.getElementById('searchInput').addEventListener('input', displayStudents); // إعادة العرض عند البحث
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
// لم نعد بحاجة لهذه الدالة مع استخدام event delegation
function attachRowEvents() {
    // var list = document.getElementById('studentsList');
    
    // // إضافة حدث change لصناديق التحديد الفردية
    // list.addEventListener('change', function(e) {
    //     if (e.target.classList.contains('select-checkbox')) {
    //         var studentId = parseInt(e.target.dataset.id);
    //         if (e.target.checked) {
    //             selectedStudents.add(studentId);
    //         } else {
    //             selectedStudents.delete(studentId);
    //         }
    //         updateSelectAllState();
    //     }
    // });

    // // بقية الأحداث (النقر على القائمة المتنقلة)
    // list.removeEventListener('click', handleRowClick);
    // list.addEventListener('click', handleRowClick);
}

// دالة معالجة أحداث الصفوف
// دالة معالجة النقرات داخل الجدول (Event Delegation)
function handleTableClick(e) {
    var target = e.target;
    var row = target.closest('tr');
    if (!row) return;

    const studentId = parseInt(row.dataset.id);
    currentStudentId = studentId; // تخزين الـ ID الحالي للإجراءات

    if (target.classList.contains('mobile-menu-btn')) {
        e.stopPropagation();
        openActionModal();
    } else if (target.classList.contains('add-points-btn')) {
        const input = document.getElementById('points-input-' + studentId);
        const pointsChange = parseInt(input.value) || 1;
        const currentDate = new Date().toISOString().split('T')[0];
        updateStudentPoints(studentId, pointsChange, 'إضافة نقاط يدوية', currentDate);
    } else if (target.classList.contains('subtract-points-btn')) {
        const input = document.getElementById('points-input-' + studentId);
        const pointsChange = -(parseInt(input.value) || 1);
        const currentDate = new Date().toISOString().split('T')[0];
        updateStudentPoints(studentId, pointsChange, 'خصم نقاط يدوي', currentDate);
    } else if (target.tagName === 'BUTTON' && target.textContent === 'تعديل') { // مثال إذا أضفت أزرار مباشرة
        editStudent(studentId);
    } else if (target.tagName === 'BUTTON' && target.textContent === 'حذف') { // مثال إذا أضفت أزرار مباشرة
        deleteSingleStudent(studentId);
    }
}

// دالة تحديث حالة تحديد الكل
function updateSelectAllState() {
    const selectAll = document.getElementById('selectAllCheckbox');
    const checkboxes = document.querySelectorAll('.select-checkbox');
    const visibleCheckboxCount = checkboxes.length; // عدد الـ checkboxes الظاهرة حالياً

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
        // تعديل: يجب أن يكون عدد المحددين مساوياً لعدد الطلاب الكلي (وليس فقط الظاهرين) ليكون checked
        // أو يمكن تعديل المنطق ليعكس فقط الطلاب الظاهرين
        const visibleCheckedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
        selectAll.checked = visibleCheckboxCount > 0 && visibleCheckedCount === visibleCheckboxCount;
        selectAll.indeterminate = visibleCheckedCount > 0 && visibleCheckedCount < visibleCheckboxCount;
    }

    // إظهار/إخفاء زر الحذف الجماعي
    document.getElementById('deleteSelectedBtn').style.display = selectedStudents.size > 0 ? 'inline-block' : 'none';
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
async function handleStudentSubmit(e) { // تحويلها إلى async
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
    
    const studentData = {
        name: name,
        class: studentClass,
        points: points,
        // يمكنك إضافة حقول أخرى إذا لزم الأمر، مثل التاريخ
        // date: selectedDate
    };

    if (id) {
        studentData.id = parseInt(id); // إضافة الـ ID للتعديل
    }

    // استدعاء الدالة الجديدة للحفظ في الخادم
    await saveStudent(studentData);

    // لا تقم بتحديث الواجهة مباشرة هنا، دع saveStudent تتولى إعادة التحميل
    // saveToLocalStorage(); // إزالة
    // displayStudents(); // إزالة
    // closeModal('studentModal'); // أغلق النافذة بعد التأكد من النجاح في saveStudent
    // showAlert('تم حفظ التغييرات بنجاح', 'success'); // انقل التنبيه إلى saveStudent
}

// دالة حفظ/تعديل طالب في الخادم
async function saveStudent(studentData) {
    try {
        const response = await fetch(`${API_BASE_URL}save_student.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });
        const result = await response.json();
        if (response.ok && result.status === 'success') {
            closeModal('studentModal');
            showAlert(result.message || 'تم حفظ الطالب بنجاح', 'success');
            await loadStudents(); // إعادة تحميل قائمة الطلاب
        } else {
            showAlert(`فشل حفظ الطالب: ${result.message || response.statusText}`, 'danger');
        }
    } catch (error) {
        console.error('Error saving student:', error);
        showAlert('حدث خطأ أثناء حفظ بيانات الطالب.', 'danger');
    }
}

// دالة تأكيد الحذف
async function confirmDelete() { // جعل الدالة async
    // إزالة الفلترة المحلية غير الضرورية
    // --- تعديل: إرسال طلبات الحذف إلى الخادم ---
    const idsToDelete = Array.from(selectedStudents);
    if (idsToDelete.length === 0) {
        closeModal('deleteConfirmation');
        return;
    }

    // يمكنك إرسال طلب واحد لـ bulk delete أو عدة طلبات
    // مثال: إرسال طلبات متعددة (أبسط للتنفيذ الآن)
    let deletePromises = idsToDelete.map(id => deleteStudentFromServer(id));

    try {
        const results = await Promise.all(deletePromises);
        // التحقق من نجاح جميع عمليات الحذف (اختياري)
        const successfulDeletes = results.filter(r => r.success).length;
        showAlert(`تم حذف ${successfulDeletes} طالب بنجاح.`, 'success');

        if (successfulDeletes < idsToDelete.length) {
             showAlert(`فشل حذف ${idsToDelete.length - successfulDeletes} طالب.`, 'warning');
        }

    } catch (error) {
         showAlert('حدث خطأ أثناء عملية الحذف.', 'danger');
    } finally {
        selectedStudents.clear();
        closeModal('deleteConfirmation');
        await loadStudents(); // إعادة تحميل القائمة بعد الحذف
        updateSelectAllState();
    }
    // --- نهاية التعديل ---
    // showAlert('تم الحذف بنجاح', 'success'); // تم نقله وتعديله
    // updateSelectAllState(); // تم نقله لـ finally
}

// دالة معالجة النقاط الجماعية (تحتاج لتعديل للتفاعل مع الباك اند)
async function handleBulkPoints(e) { // تحويلها إلى async
    e.preventDefault();
    const selectedDate = document.getElementById('bulkDate').value;
    const points = parseInt(document.getElementById('bulkPointsAmount').value);
    const operation = document.getElementById('bulkOperationType').value;
    const applyTo = document.getElementById('bulkApplyTo').value;
    const selectedClass = document.getElementById('bulkClass').value;

    // تحديد الطلاب المستهدفين (هذا الجزء يبقى كما هو)
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

    const targetIds = targets.map(s => s.id);
    const pointsChange = operation === 'add' ? points : -points;
    const reason = 'تعديل جماعي للنقاط';
    const date = selectedDate || new Date().toISOString().split('T')[0];

    // --- تعديل: إرسال طلب التحديث الجماعي إلى الخادم ---
    try {
        const response = await fetch(`${API_BASE_URL}bulk_update_points.php`, { // اسم افتراضي لنقطة النهاية
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ids: targetIds,
                pointsChange: pointsChange,
                reason: reason,
                date: date
            })
        });
        const result = await response.json();

        if (response.ok && result.status === 'success') {
            showAlert(result.message || `تم تحديث نقاط ${result.updatedCount || targets.length} طالب بنجاح.`, 'success');
            closeModal('bulkPointsModal');
            selectedStudents.clear(); // مسح التحديد بعد النجاح
            await loadStudents(); // إعادة تحميل القائمة
            updateSelectAllState();
        } else {
             showAlert(`فشل التحديث الجماعي: ${result.message || response.statusText}`, 'danger');
        }
    } catch (error) {
        console.error('Error during bulk points update:', error);
        showAlert('حدث خطأ أثناء التحديث الجماعي للنقاط.', 'danger');
    }
    // --- نهاية التعديل ---

    // saveToLocalStorage(); // إزالة
    // closeModal('bulkPointsModal'); // تم نقله
    // selectedStudents.clear(); // تم نقله
    // displayStudents(); // استبدل بـ loadStudents()
    // showAlert(`تم ${operation === 'add' ? 'إضافة' : 'خصم'} ${points} نقطة لـ ${targets.length} طالب`, 'success'); // تم نقله وتعديله
    // updateSelectAllState(); // تم نقله
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
async function handleImport(e) { // تحويلها إلى async
    e.preventDefault();
    const file = document.getElementById('excelFile').files[0];
    if (!file) {
        showAlert('الرجاء اختيار ملف إكسل', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) { // تحويلها إلى async
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        const importedStudents = jsonData.map(function(row) {
            return {
                // id: nextId++, // لا نرسل ID، الخادم سيقوم بتعيينه
                name: row['اسم الطالب'] || 'طالب جديد',
                class: document.getElementById('importClass').value,
                points: row['النقاط'] || 0,
                // history: [] // السجل سيدار في الخادم
            };
        });

        const importMethod = document.getElementById('importMethod').value; // 'append' or 'replace'

        // --- تعديل: إرسال البيانات إلى الخادم ---
        try {
            const response = await fetch(`${API_BASE_URL}import_students.php`, { // اسم افتراضي لنقطة النهاية
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    students: importedStudents,
                    method: importMethod
                })
            });
            const result = await response.json();

            if (response.ok && result.status === 'success') {
                showAlert(result.message || `تم استيراد ${result.importedCount || importedStudents.length} طالب بنجاح.`, 'success');
                closeModal('importModal');
                await loadStudents(); // إعادة تحميل القائمة
            } else {
                showAlert(`فشل الاستيراد: ${result.message || response.statusText}`, 'danger');
            }
        } catch (error) {
            console.error('Error during import:', error);
            showAlert('حدث خطأ أثناء استيراد الطلاب.', 'danger');
        }
        // --- نهاية التعديل ---

        // saveToLocalStorage(); // إزالة
        // closeModal('importModal'); // تم نقله
        // displayStudents(); // استبدل بـ loadStudents()
        // showAlert(`تم استيراد ${importedStudents.length} طالب`, 'success'); // تم نقله وتعديله
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
function closeModal(id) { // إزالة التعريف المكرر
    document.getElementById(id).style.display = 'none';
}

// دالة عرض سجل التعديلات
async function showHistory(studentId) { // تحويلها إلى async
    const student = students.find(function(s) {
        return s.id === studentId;
    });
    
    if (!student) return;

    document.getElementById('historyStudentName').textContent = student.name;
    const tbody = document.getElementById('historyList');
    tbody.innerHTML = '';

    // --- تعديل: جلب السجل من الخادم ---
    try {
        const response = await fetch(`${API_BASE_URL}get_student_history.php?id=${studentId}`); // اسم افتراضي لنقطة النهاية
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();

        if (result.status === 'success' && result.history) {
            if (result.history.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">لا يوجد سجل تعديلات لهذا الطالب</td></tr>`;
            } else {
                result.history.forEach(record => {
                    const changeClass = record.points_change >= 0 ? 'positive-change' : 'negative-change';
                    const changeSign = record.points_change >= 0 ? '+' : '';
                    // تأكد من أن التاريخ القادم من PHP بالتنسيق الصحيح أو قم بتحويله
                    const formattedDate = record.change_date ? new Date(record.change_date).toLocaleDateString('ar-EG') : '--';

                    tbody.innerHTML += `
                        <tr>
                            <td>${formattedDate}</td>
                            <td>${record.old_points !== null ? record.old_points : '--'}</td>
                            <td class="${changeClass}">${changeSign}${record.points_change}</td>
                            <td>${record.new_points}</td>
                            <td>${record.reason || record.operation_type || '--'}</td>
                        </tr>
                    `;
                });
            }
            openModal('historyModal'); // افتح النافذة بعد تحميل السجل بنجاح
        } else {
            showAlert(`فشل جلب السجل: ${result.message || 'خطأ غير معروف'}`, 'danger');
        }
    } catch (error) {
        console.error('Error fetching history:', error);
        showAlert('حدث خطأ أثناء جلب سجل الطالب.', 'danger');
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">حدث خطأ أثناء تحميل السجل</td></tr>`;
        openModal('historyModal'); // افتح النافذة لعرض رسالة الخطأ
    }
    // --- نهاية التعديل ---
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
// إزالة التعريف المكرر لـ handleExport
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

// فتح النافذة
function openExportModal() {
    document.getElementById('exportOptionsModal').style.display = 'block';
}

// إغلاق النافذة
// إزالة التعريف المكرر لـ closeModal
// function closeModal(modalId) {
//     document.getElementById(modalId).style.display = 'none';
// }

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

    // الحصول على الفصول الفريدة من قائمة الطلاب الحالية
    const uniqueClasses = [...new Set(students.map(s => s.class))];
    // إضافة خيار افتراضي
    classSelect.innerHTML = '<option value="">اختر فصل...</option>';

    uniqueClasses.forEach(function(className) {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        classSelect.appendChild(option);
    });
}

// دالة جديدة لمعالجة التغييرات في الجدول (Event Delegation)
function handleTableChange(e) {
    if (e.target.classList.contains('select-checkbox')) {
        const studentId = parseInt(e.target.dataset.id);
        if (e.target.checked) {
            selectedStudents.add(studentId);
        } else {
            selectedStudents.delete(studentId);
        }
        updateSelectAllState();
    }
}


// هذه الدالة تم دمجها وتعديلها في الأعلى
// async function saveStudent(student) { ... }

// دالة حذف طالب من الخادم (تستخدم داخلياً بواسطة confirmDelete و deleteSingleStudent)
async function deleteStudentFromServer(id) {
    try {
        const response = await fetch(`${API_BASE_URL}delete_student.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        const result = await response.json();
        // لا نعيد تحميل البيانات هنا، بل في الدالة التي استدعتها (confirmDelete)
        // نرجع فقط حالة النجاح أو الفشل
        return { success: response.ok && result.status === 'success', message: result.message };
    } catch (error) {
        console.error(`Error deleting student ${id}:`, error);
        return { success: false, message: error.message };
    }
}

// هذه الدالة تستدعي deleteStudentFromServer الآن
async function deleteStudent(id) {
    // هذه الدالة أصبحت مجرد غلاف لـ deleteStudentFromServer إذا أردت الاحتفاظ بها
    // أو يمكن استدعاء deleteStudentFromServer مباشرة من onclick
    // مثال: onclick="deleteStudentFromServer(${student.id}).then(() => loadStudents())" - لكن هذا أقل تنظيماً
    // الأفضل هو استخدام deleteSingleStudent التي تفتح نافذة التأكيد
    console.warn("deleteStudent(id) called directly. Consider using deleteSingleStudent(id) for confirmation.");
    // يمكنك إما فتح نافذة التأكيد هنا أو الحذف مباشرة (غير مستحسن)
    deleteSingleStudent(id); // فتح نافذة التأكيد
}