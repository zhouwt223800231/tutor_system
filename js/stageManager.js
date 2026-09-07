/* ===== 阶段（学期）管理 ===== */

// 获取某学生的阶段列表（保证结构存在）
function getStudentStages(studentId) {
  if (!studentData[studentId]) studentData[studentId] = { stages: [] };
  if (!Array.isArray(studentData[studentId].stages)) studentData[studentId].stages = [];
  return studentData[studentId].stages;
}

function getStageById(studentId, stageId) {
  return getStudentStages(studentId).find(function (st) { return st.id === stageId; }) || null;
}

function getCurrentStageObj() {
  if (!currentStudent || !currentStageId) return null;
  return getStageById(currentStudent, currentStageId);
}

function getCurrentStagePlans() {
  const st = getCurrentStageObj();
  return st ? st.plans : [];
}

function getCurrentStageRecords() {
  const st = getCurrentStageObj();
  return st ? st.records : [];
}

function getStageName(studentId, stageId) {
  const st = getStageById(studentId, stageId);
  return st ? st.name : '';
}

// 按 sort 排序后的阶段列表
function sortedStages(studentId) {
  return getStudentStages(studentId).slice().sort(function (a, b) { return a.sort - b.sort; });
}

function renderStageBar() {
  const chipsEl = document.getElementById('stageChips');
  const manageBtn = document.getElementById('manageStagesBtn');
  if (!chipsEl) return;
  if (!currentStudent) {
    chipsEl.innerHTML = '<span class="stage-empty">请先添加学生</span>';
    if (manageBtn) manageBtn.style.display = 'none';
    return;
  }
  const stages = sortedStages(currentStudent);
  if (stages.length === 0) {
    chipsEl.innerHTML = '<span class="stage-empty">暂无阶段，请先「＋ 添加阶段」</span>';
    if (manageBtn) manageBtn.style.display = 'none';
    return;
  }
  chipsEl.innerHTML = stages.map(function (st) {
    return '<span class="stage-chip ' + (st.id === currentStageId ? 'active' : '') + '" onclick="selectStage(\'' + st.id + '\')">' +
      escapeHtml(st.name) +
      '</span>';
  }).join('');
  if (manageBtn) manageBtn.style.display = '';
}

function selectStage(stageId) {
  if (!currentStudent) return;
  if (stageId === currentStageId) return;
  saveSummaryMessage();          // 切换前保存正在编辑的寄语
  const stages = getStudentStages(currentStudent);
  if (!stages.some(function (st) { return st.id === stageId; })) return;
  currentStageId = stageId;
  renderStageBar();
  refreshStagePanels();
}

// 刷新当前阶段下三个页签的内容
function refreshStagePanels() {
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

/* ========== 添加阶段 ========== */

function openAddStage() {
  if (!currentStudent) { alert('请先添加学生'); return; }
  document.getElementById('newStageName').value = '';
  document.getElementById('addStageModal').classList.add('show');
  setTimeout(function () { document.getElementById('newStageName').focus(); }, 50);
}

function closeAddStage() {
  document.getElementById('addStageModal').classList.remove('show');
}

function fillStageTemplate(label) {
  document.getElementById('newStageName').value = label;
  document.getElementById('newStageName').focus();
}

function confirmAddStage() {
  if (!currentStudent) { alert('请先添加学生'); return; }
  const name = document.getElementById('newStageName').value.trim();
  if (!name) { alert('请输入阶段名称，例如：2026 暑假课程'); return; }
  const stages = getStudentStages(currentStudent);
  const stage = {
    id: uid('st'),
    name: name,
    sort: stages.length,
    message: '',
    plans: [],
    records: []
  };
  stages.push(stage);
  persist();
  closeAddStage();
  currentStageId = stage.id;
  renderStageBar();
  refreshStagePanels();
}

/* ========== 管理阶段 ========== */

function openManageStages() {
  if (!currentStudent) return;
  document.getElementById('manageStagesModal').classList.add('show');
  renderManageStages();
}

function closeManageStages() {
  document.getElementById('manageStagesModal').classList.remove('show');
}

function renderManageStages() {
  const list = document.getElementById('manageStagesList');
  if (!list) return;
  const stages = sortedStages(currentStudent);
  if (stages.length === 0) {
    list.innerHTML = '<div class="empty-state">暂无阶段</div>';
    return;
  }
  list.innerHTML = stages.map(function (st, i) {
    return '<div class="manage-stage-row">' +
      '<div class="manage-stage-main">' +
      '<input class="manage-stage-name" value="' + escapeHtml(st.name) + '" onchange="manageStageRename(\'' + st.id + '\', this.value)" placeholder="阶段名称" />' +
      '<div class="manage-stage-meta">课程计划 ' + (st.plans ? st.plans.length : 0) + ' 条 · 课后反馈 ' + (st.records ? st.records.length : 0) + ' 条</div>' +
      '</div>' +
      '<div class="manage-stage-ops">' +
      '<button class="btn btn-sm" onclick="manageStageMove(\'' + st.id + '\', -1)" ' + (i === 0 ? 'disabled' : '') + ' title="上移">↑</button>' +
      '<button class="btn btn-sm" onclick="manageStageMove(\'' + st.id + '\', 1)" ' + (i === stages.length - 1 ? 'disabled' : '') + ' title="下移">↓</button>' +
      '<button class="btn btn-sm btn-danger" onclick="manageStageDelete(\'' + st.id + '\')">删除</button>' +
      '</div>' +
      '</div>';
  }).join('');
}

function manageStageRename(stageId, value) {
  const st = getStageById(currentStudent, stageId);
  if (!st) return;
  st.name = value.trim() || st.name;
  persist();
  renderStageBar();
}

function manageStageMove(stageId, dir) {
  const stages = sortedStages(currentStudent);
  const idx = stages.findIndex(function (st) { return st.id === stageId; });
  if (idx < 0) return;
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= stages.length) return;
  const tmp = stages[idx];
  stages[idx] = stages[newIdx];
  stages[newIdx] = tmp;
  stages.forEach(function (st, i) { st.sort = i; });
  persist();
  renderStageBar();
  renderManageStages();
}

function manageStageDelete(stageId) {
  const st = getStageById(currentStudent, stageId);
  if (!st) return;
  const planCount = st.plans ? st.plans.length : 0;
  const recCount = st.records ? st.records.length : 0;
  if (!confirm('确定删除阶段「' + st.name + '」吗？\n将一并删除该阶段下的课程计划 ' + planCount + ' 条、课后反馈 ' + recCount + ' 条，此操作不可恢复。')) return;
  const stages = getStudentStages(currentStudent);
  const idx = stages.findIndex(function (x) { return x.id === stageId; });
  if (idx >= 0) stages.splice(idx, 1);
  stages.forEach(function (x, i) { x.sort = i; });
  if (currentStageId === stageId) {
    currentStageId = stages.length > 0 ? stages[0].id : null;
  }
  persist();
  renderStageBar();
  renderManageStages();
  refreshStagePanels();
}

/* ========== 跨阶段移动 ========== */

function movePlanToStage(planId, targetStageId) {
  if (!currentStudent || !targetStageId) return;
  const src = getCurrentStageObj();
  if (!src) return;
  if (src.id === targetStageId) return;
  const idx = src.plans.findIndex(function (p) { return p.id === planId; });
  if (idx < 0) return;
  const plan = src.plans.splice(idx, 1)[0];
  const target = getStageById(currentStudent, targetStageId);
  if (!target) {
    src.plans.splice(idx, 0, plan);
    return;
  }
  target.plans.push(plan);
  renumberPlansIn(src);
  renumberPlansIn(target);
  persist();
  renderPlanTable();
  updatePlanExportPreview();
}

function moveRecordToStage(recordId, targetStageId) {
  if (!currentStudent || !targetStageId) return;
  const src = getCurrentStageObj();
  if (!src) return;
  if (src.id === targetStageId) return;
  const rec = src.records.find(function (r) { return r.id === recordId; });
  if (!rec) return;
  src.records = src.records.filter(function (r) { return r.id !== recordId; });
  const target = getStageById(currentStudent, targetStageId);
  if (!target) {
    src.records.push(rec);
    return;
  }
  rec.updatedAt = nowISO();
  target.records.unshift(rec);
  if (editingRecordId === recordId) resetRecordFormState();
  persist();
  renderHistory();
  updateRecordExportOptions();
  updateRecordExportPreview();
}

function renumberPlansIn(stage) {
  if (!stage || !Array.isArray(stage.plans)) return;
  stage.plans.forEach(function (p, i) { p.num = i + 1; });
}

/* ========== 弹窗关闭（点击遮罩） ========== */

document.addEventListener('click', function (e) {
  const add = document.getElementById('addStageModal');
  const mg = document.getElementById('manageStagesModal');
  if (add && e.target === add) closeAddStage();
  if (mg && e.target === mg) closeManageStages();
});