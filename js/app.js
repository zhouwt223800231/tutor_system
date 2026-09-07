/* ===== 应用初始化 & 全局状态（v4.0） ===== */

let students = [];
let studentData = {};
let currentStudent = null;    // 当前学生 id
let currentStageId = null;    // 当前学生下的阶段 id
let editingOutline = [];
let nextStudentId = 1;
let nextNodeId = 1;

document.addEventListener('DOMContentLoaded', function () {
  initData();
  initTabs();
  renderStudentChips();
  if (students.length > 0) {
    selectStudent(students[0].id);
  } else {
    renderEmptyState();
  }
});

function initData() {
  const data = loadAllData();
  students = data.students || [];
  studentData = data.studentData || {};
  nextStudentId = data.nextStudentId || 1;
  nextNodeId = data.nextNodeId || 1;
}

// 组装当前完整数据快照
function buildDataSnapshot() {
  return {
    students: students,
    studentData: studentData,
    nextStudentId: nextStudentId,
    nextNodeId: nextNodeId
  };
}

function persist() {
  saveAllData(buildDataSnapshot());
}

function initTabs() {
  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      const target = this.dataset.tab;
      document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('active'); });
      this.classList.add('active');
      document.getElementById('panel-' + target).classList.add('active');
      if (target === 'summary') {
        renderSummary();
      }
    });
  });
}

function renderEmptyState() {
  const el = function (id) { return document.getElementById(id); };
  el('planBody').innerHTML = '<tr><td colspan="5" class="empty-state">请先点击右上角「+ 添加学生」</td></tr>';
  el('stageChips').innerHTML = '<span class="stage-empty">请先添加学生</span>';
  el('historyList').innerHTML = '<div class="empty-state">请先添加学生</div>';
  el('planExportPreview').textContent = '请先添加学生';
  el('recordExportPreview').textContent = '请先添加学生';
  el('summaryExportPreview').textContent = '请先添加学生';
  el('outlineEditor').innerHTML = '<div class="empty-state">请先添加学生</div>';
  el('summaryTimeline').innerHTML = '<div class="empty-state">请先添加学生</div>';
  el('summaryRecords').innerHTML = '<div class="empty-state">请先添加学生</div>';
  el('summaryMessage').value = '';
  hideEditBanner();
}

function createBackupButtons() {
  const app = document.getElementById('app');
  const div = document.createElement('div');
  div.style.cssText = 'margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e5ea; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;';
  div.innerHTML =
    '<button class="btn" onclick="exportBackup()">💾 导出备份</button>' +
    '<label class="btn" style="cursor:pointer;">📁 导入备份' +
    '<input type="file" accept=".json" style="display:none;" onchange="handleImport(this)">' +
    '</label>';
  app.appendChild(div);
}

function handleImport(input) {
  const file = input.files[0];
  if (!file) return;
  importBackup(file, function (success, msg) {
    if (success) {
      alert('导入成功！页面将刷新。');
      location.reload();
    } else {
      alert('导入失败：' + (msg || '未知错误'));
    }
    input.value = '';
  });
}

document.addEventListener('DOMContentLoaded', function () {
  setTimeout(createBackupButtons, 100);
});