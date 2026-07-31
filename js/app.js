/* ===== 应用初始化 & 全局状态 ===== */

// 全局状态
let students = [];
let studentData = {};
let currentStudent = null;
let editingOutline = [];
let nextStudentId = 1;
let nextNodeId = 1;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  initData();
  initTabs();
  renderStudentChips();
  if (students.length > 0) {
    selectStudent(students[0].id);
  } else {
    renderEmptyState();
  }
});

// 加载数据
function initData() {
  const data = loadAllData();
  students = data.students || [];
  studentData = data.studentData || {};
  nextStudentId = data.nextStudentId || 1;
  nextNodeId = data.nextNodeId || 1;
}

// 持久化
function persist() {
  saveAllData({
    students,
    studentData,
    nextStudentId,
    nextNodeId
  });
}

// Tab 切换
function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const target = this.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      document.getElementById('panel-' + target).classList.add('active');
      if (target === 'export') updateExportPreview();
    });
  });
}

// 空状态
function renderEmptyState() {
  document.getElementById('planBody').innerHTML = '<tr><td colspan="4" class="empty-state">请先点击右上角「+ 添加学生」</td></tr>';
  document.getElementById('historyList').innerHTML = '<div class="empty-state">请先添加学生</div>';
  document.getElementById('exportPreview').textContent = '请先添加学生';
  document.getElementById('outlineEditor').innerHTML = '<div class="empty-state">请先添加学生</div>';
}

// 导出/导入按钮（可在页面底部添加）
function createBackupButtons() {
  const app = document.getElementById('app');
  const div = document.createElement('div');
  div.style.cssText = 'margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e5ea; display: flex; gap: 8px; justify-content: center;';
  div.innerHTML = `
    <button class="btn" onclick="exportBackup()">💾 导出备份</button>
    <label class="btn" style="cursor:pointer;">
      📁 导入备份
      <input type="file" accept=".json" style="display:none;" onchange="handleImport(this)">
    </label>
  `;
  app.appendChild(div);
}

function handleImport(input) {
  const file = input.files[0];
  if (!file) return;
  importBackup(file, function(success, msg) {
    if (success) {
      alert('导入成功！页面将刷新。');
      location.reload();
    } else {
      alert('导入失败：' + (msg || '未知错误'));
    }
    input.value = '';
  });
}

// 页面加载完成后添加备份按钮
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(createBackupButtons, 100);
});
