/* ===== 学生管理 ===== */

function renderStudentChips() {
  const container = document.getElementById('studentChips');
  if (students.length === 0) {
    container.innerHTML = '<span style="color:#86868b;font-size:14px;">暂无学生，请添加</span>';
    return;
  }
  container.innerHTML = students.map(s => `
    <div class="student-chip ${s.id === currentStudent ? 'active' : ''}"
         onclick="selectStudent('${s.id}')">
      ${escapeHtml(s.name)} · ${escapeHtml(s.grade)}${escapeHtml(s.subject)}
      <span class="del-btn" onclick="event.stopPropagation(); deleteStudent('${s.id}')">✕</span>
    </div>
  `).join('');
}

function selectStudent(id) {
  currentStudent = id;
  renderStudentChips();
  renderPlanTable();
  updatePlanExportPreview();
  clearRecordForm();
  editingOutline = [];
  renderOutlineEditor();
  renderHistory();
  updateRecordExportOptions();
  updateRecordExportPreview();
  persist();
}

function deleteStudent(id) {
  if (!confirm('确定删除该学生「' + getStudentName(id) + '」及其所有数据吗？此操作不可恢复。')) return;
  students = students.filter(s => s.id !== id);
  delete studentData[id];
  if (students.length === 0) {
    currentStudent = null;
    renderStudentChips();
    renderEmptyState();
    persist();
    return;
  }
  if (currentStudent === id) {
    currentStudent = students[0].id;
  }
  renderStudentChips();
  selectStudent(currentStudent);
}

function getStudentName(id) {
  const s = students.find(x => x.id === id);
  return s ? s.name : id;
}

function getCurrentStudent() {
  return students.find(s => s.id === currentStudent);
}

// ========== 添加学生弹窗 ==========

function openAddStudent() {
  document.getElementById('addStudentModal').classList.add('show');
  document.getElementById('newStudentName').value = '';
  setTimeout(() => document.getElementById('newStudentName').focus(), 50);
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
  students.push({ id, name, grade, subject });
  studentData[id] = { plans: [], records: [] };
  persist();
  closeAddStudent();
  renderStudentChips();
  selectStudent(id);
}

// 点击遮罩关闭弹窗
document.addEventListener('click', function(e) {
  const modal = document.getElementById('addStudentModal');
  if (e.target === modal) closeAddStudent();
});

// 回车确认
document.getElementById('newStudentName').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') confirmAddStudent();
});

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
