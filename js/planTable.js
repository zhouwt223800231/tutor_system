/* ===== 课前计划表格（v4.0：按阶段管理，支持拖拽排序 & 跨阶段移动） ===== */

let dragSrcIndex = -1;

// 供属性内使用的转义
function attrEsc(text) {
  return escapeHtml(text).replace(/"/g, '&quot;');
}

function renderPlanTable() {
  const tbody = document.getElementById('planBody');
  if (!currentStudent) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">请先添加学生</td></tr>';
    return;
  }
  const stage = getCurrentStageObj();
  if (!stage) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">请先为该学生添加阶段（上方「＋ 添加阶段」）</td></tr>';
    return;
  }
  const plans = stage.plans;
  if (plans.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">暂无课程计划，点击上方按钮添加</td></tr>';
    return;
  }

  const otherStages = sortedStages(currentStudent).filter(function (s) { return s.id !== stage.id; });
  const moveOptions = otherStages.length > 0
    ? otherStages.map(function (s) {
        return '<option value="' + s.id + '">' + escapeHtml(s.name) + '</option>';
      }).join('')
    : '<option value="">无其他阶段</option>';

  tbody.innerHTML = plans.map(function (p, i) {
    return '<tr draggable="true" data-index="' + i + '" ondragstart="handleDragStart(event, ' + i + ')"' +
      ' ondragover="handleDragOver(event, ' + i + ')" ondragleave="handleDragLeave(event, ' + i + ')"' +
      ' ondrop="handleDrop(event, ' + i + ')" ondragend="handleDragEnd(event)">' +
      '<td class="drag-col"><span class="drag-handle" title="拖拽调整顺序">⋮⋮</span></td>' +
      '<td class="num-col"><input type="text" value="' + attrEsc(p.num) + '" onchange="updatePlan(' + i + ', \'num\', this.value)" style="text-align:center;" /></td>' +
      '<td class="date-col"><input type="date" value="' + attrEsc(p.date) + '" onchange="updatePlan(' + i + ', \'date\', this.value)" /></td>' +
      '<td style="position:relative;">' +
      '<input type="text" value="' + attrEsc(p.content) + '" onchange="updatePlan(' + i + ', \'content\', this.value)" placeholder="课程内容" />' +
      '<div class="insert-actions">' +
      '<button class="insert-btn" onclick="insertPlanBefore(' + i + ')" title="在此行前插入">↑ 前插</button>' +
      '<button class="insert-btn" onclick="insertPlanAfter(' + i + ')" title="在此行后插入">↓ 后插</button>' +
      '</div>' +
      '</td>' +
      '<td class="action-col">' +
      '<span class="row-actions">' +
      '<select class="move-select" onchange="movePlanToStage(\'' + p.id + '\', this.value)" title="移动到其他阶段">' +
      '<option value="">移到…</option>' + moveOptions +
      '</select>' +
      '<button class="btn btn-sm btn-danger" onclick="deletePlan(\'' + p.id + '\')">删除</button>' +
      '</span>' +
      '</td>' +
      '</tr>';
  }).join('');
}

/* ========== 拖拽排序 ========== */

function handleDragStart(e, index) {
  dragSrcIndex = index;
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', index);
}

function handleDragOver(e, index) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const row = e.currentTarget;
  if (index === dragSrcIndex) return;
  const rect = row.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  row.classList.remove('drag-over', 'drag-over-bottom');
  if (e.clientY < midY) {
    row.classList.add('drag-over');
  } else {
    row.classList.add('drag-over-bottom');
  }
}

function handleDragLeave(e, index) {
  e.currentTarget.classList.remove('drag-over', 'drag-over-bottom');
}

function handleDrop(e, index) {
  e.preventDefault();
  e.stopPropagation();
  const row = e.currentTarget;
  row.classList.remove('drag-over', 'drag-over-bottom');
  if (dragSrcIndex === -1 || dragSrcIndex === index) return;
  const plans = getCurrentStagePlans();
  if (!plans || plans.length === 0) return;
  const srcItem = plans[dragSrcIndex];
  const rect = row.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  const insertBefore = e.clientY < midY;
  plans.splice(dragSrcIndex, 1);
  let newIndex = index;
  if (dragSrcIndex < index && insertBefore) {
    newIndex = index - 1;
  } else if (dragSrcIndex > index && !insertBefore) {
    newIndex = index + 1;
  } else if (!insertBefore) {
    newIndex = index + 1;
  }
  plans.splice(newIndex, 0, srcItem);
  renumberPlans();
  renderPlanTable();
  updatePlanExportPreview();
  persist();
  dragSrcIndex = -1;
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.plan-table tbody tr').forEach(function (tr) {
    tr.classList.remove('drag-over', 'drag-over-bottom');
  });
  dragSrcIndex = -1;
}

/* ========== 插入行 ========== */

function insertPlanBefore(index) {
  const stage = getCurrentStageObj();
  if (!stage) return;
  stage.plans.splice(index, 0, createEmptyPlan());
  renumberPlans();
  renderPlanTable();
  updatePlanExportPreview();
  persist();
}

function insertPlanAfter(index) {
  const stage = getCurrentStageObj();
  if (!stage) return;
  stage.plans.splice(index + 1, 0, createEmptyPlan());
  renumberPlans();
  renderPlanTable();
  updatePlanExportPreview();
  persist();
}

function createEmptyPlan() {
  return { id: uid('p'), num: 0, date: '', content: '' };
}

/* ========== 原有功能 ========== */

function addPlanRow() {
  if (!currentStudent) { alert('请先添加学生'); return; }
  const stage = getCurrentStageObj();
  if (!stage) { alert('请先为该学生添加阶段'); return; }
  stage.plans.push(createEmptyPlan());
  renumberPlans();
  renderPlanTable();
  updatePlanExportPreview();
  persist();
}

function updatePlan(index, field, value) {
  const stage = getCurrentStageObj();
  if (!stage) return;
  if (stage.plans[index]) stage.plans[index][field] = value;
  persist();
}

function deletePlan(planId) {
  if (!confirm('确定删除该次课程安排吗？')) return;
  const stage = getCurrentStageObj();
  if (!stage) return;
  stage.plans = stage.plans.filter(function (p) { return p.id !== planId; });
  renumberPlans();
  renderPlanTable();
  updatePlanExportPreview();
  persist();
}

// 重新编号当前阶段（按顺序 1, 2, 3...）
function renumberPlans() {
  const stage = getCurrentStageObj();
  if (!stage) return;
  renumberPlansIn(stage);
}