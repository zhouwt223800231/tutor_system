/* ===== 学生管理（v4.0：支持编辑学生信息） ===== */

function renderStudentChips() {
  const container = document.getElementById('studentChips');
  if (!container) return;
  if (students.length === 0) {
    container.innerHTML = '<span style="color:#86868b;font-size:14px;">暂无学生，请添加</span>';
    return;
  }
  container.innerHTML = students.map(function (s) {
    return '<div class="student-chip ' + (s.id === currentStudent ? 'active' : '') + '" onclick="selectStudent(\'' + s.id + '\')">' +
      '<span>' + escapeHtml(s.name) + ' · ' + escapeHtml(s.grade) + escapeHtml(s.subject) + '</span>' +
      '<span class="edit-btn" onclick="event.stopPropagation(); openEditStudent(\'' + s.id + '\')" title="编辑学生信息">✎</span>' +
      '<span class="del-btn" onclick="event.stopPropagation(); deleteStudent(\'' + s.id + '\')">✕</span>' +
      '</div>';
  }).join('');
}

function selectStudent(id) {
  currentStudent = id;
  const stages = getStudentStages(id);
  if (!stages.some(function (st) { return st.id === currentStageId; })) {
    currentStageId = stages.length > 0 ? stages[0].id : null;
  }
  renderStudentChips();
  renderStageBar();
  renderPlanTable();
  updatePlanExportPreview();
  resetRecordFormState();
  editingOutline = [];
  renderOutlineEditor();
  renderHistory();
  updateRecordExportOptions();
  updateRecordExportPreview();
  if (document.getElementById('panel-summary').classList.contains('active')) {
    renderSummary();
  }
}

function deleteStudent(id) {
  if (!confirm('确定删除该学生「' + getStudentName(id) + '」及其所有数据吗？此操作不可恢复。')) return;
  students = students.filter(function (s) { return s.id !== id; });
  delete studentData[id];
  if (students.length === 0) {
    currentStudent = null;
    currentStageId = null;
    renderStudentChips();
    renderStageBar();
    renderEmptyState();
    persist();
    return;
  }
  if (currentStudent === id) {
    currentStudent = students[0].id;
  }
  selectStudent(currentStudent);
  persist();
}

function getStudentName(id) {
  const s = students.find(function (x) { return x.id === id; });
  return s ? s.name : id;
}

function getCurrentStudent() {
  return students.find(function (s) { return s.id === currentStudent; });
}

/* ========== 添加学生弹窗 ========== */

function openAddStudent() {
  document.getElementById('addStudentModal').classList.add('show');
  document.getElementById('newStudentName').value = '';
  setTimeout(function () { document.getElementById('newStudentName').focus(); }, 50);
}

function closeAddStudent() {
  document.getElementById('addStudentModal').classList.remove('show');
}

function confirmAddStudent() {
  const name = document.getElementById('newStudentName').value.trim();
  const grade = document.getElementById('newStudentGrade').value;
  const subject = document.getElementById('newStudentSubject').value;
  if (!name) {
    alert('请输入学生姓名');
    return;
  }
  const id = 's' + (nextStudentId++);
  students.push({ id: id, name: name, grade: grade, subject: subject });
  studentData[id] = { stages: [] };
  persist();
  closeAddStudent();
  selectStudent(id);
}

/* ========== 编辑学生信息弹窗 ========== */

let editStudentId = null;

function openEditStudent(id) {
  const s = students.find(function (x) { return x.id === id; });
  if (!s) return;
  editStudentId = id;
  document.getElementById('editStudentName').value = s.name;
  document.getElementById('editStudentGrade').value = s.grade;
  document.getElementById('editStudentSubject').value = s.subject;
  document.getElementById('editStudentModal').classList.add('show');
  setTimeout(function () { document.getElementById('editStudentName').focus(); }, 50);
}

function closeEditStudent() {
  document.getElementById('editStudentModal').classList.remove('show');
  editStudentId = null;
}

function confirmEditStudent() {
  if (!editStudentId) return;
  const name = document.getElementById('editStudentName').value.trim();
  const grade = document.getElementById('editStudentGrade').value;
  const subject = document.getElementById('editStudentSubject').value;
  if (!name) {
    alert('请输入学生姓名');
    return;
  }
  const s = students.find(function (x) { return x.id === editStudentId; });
  if (!s) return;
  s.name = name;
  s.grade = grade;
  s.subject = subject;
  const sid = editStudentId;
  persist();
  closeEditStudent();
  selectStudent(sid);
}

/* ========== 弹窗通用行为 ========== */

function bindModalClose(overlayId, closeFn) {
  const overlay = document.getElementById(overlayId);
  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeFn();
    });
  }
}
bindModalClose('addStudentModal', closeAddStudent);
bindModalClose('editStudentModal', closeEditStudent);

document.getElementById('newStudentName').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') confirmAddStudent();
});
document.getElementById('editStudentName').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') confirmEditStudent();
});

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : text;
  return div.innerHTML;
}