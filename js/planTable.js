/* ===== 课前计划表格（支持拖拽排序 & 插入） ===== */

let dragSrcIndex = -1;

function renderPlanTable() {
  const tbody = document.getElementById('planBody');
  if (!currentStudent) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">请先添加学生</td></tr>';
    return;
  }
  const plans = studentData[currentStudent].plans;
  if (plans.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">暂无课程计划，点击上方按钮添加</td></tr>';
    return;
  }

  tbody.innerHTML = plans.map((p, i) => `
    <tr draggable="true" data-index="${i}" ondragstart="handleDragStart(event, ${i})"
        ondragover="handleDragOver(event, ${i})" ondragleave="handleDragLeave(event, ${i})"
        ondrop="handleDrop(event, ${i})" ondragend="handleDragEnd(event)">
      <td class="drag-col">
        <span class="drag-handle" title="拖拽调整顺序">⋮⋮</span>
      </td>
      <td class="num-col">
        <input type="text" value="${p.num}" onchange="updatePlan(${i}, 'num', this.value)" style="text-align:center;" />
      </td>
      <td class="date-col">
        <input type="date" value="${p.date}" onchange="updatePlan(${i}, 'date', this.value)" />
      </td>
      <td style="position:relative;">
        <input type="text" value="${escapeHtml(p.content)}" onchange="updatePlan(${i}, 'content', this.value)" placeholder="课程内容" />
        <div class="insert-actions">
          <button class="insert-btn" onclick="insertPlanBefore(${i})" title="在此行前插入">↑ 前插</button>
          <button class="insert-btn" onclick="insertPlanAfter(${i})" title="在此行后插入">↓ 后插</button>
        </div>
      </td>
      <td class="action-col">
        <span class="row-actions">
          <button class="btn btn-sm btn-danger" onclick="deletePlan(${i})">删除</button>
        </span>
      </td>
    </tr>
  `).join('');
}

// ========== 拖拽排序 ==========

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

  // 判断是拖到上方还是下方
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

  const plans = studentData[currentStudent].plans;
  const srcItem = plans[dragSrcIndex];

  // 判断插入位置
  const rect = row.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  const insertBefore = e.clientY < midY;

  // 从原位置移除
  plans.splice(dragSrcIndex, 1);

  // 计算新索引
  let newIndex = index;
  if (dragSrcIndex < index && insertBefore) {
    newIndex = index - 1;
  } else if (dragSrcIndex > index && !insertBefore) {
    newIndex = index + 1;
  } else if (!insertBefore) {
    newIndex = index + 1;
  }

  // 插入到新位置
  plans.splice(newIndex, 0, srcItem);

  // 重新编号（保持连续性）
  renumberPlans();

  renderPlanTable();
  updatePlanExportPreview();
  persist();
  dragSrcIndex = -1;
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.plan-table tbody tr').forEach(tr => {
    tr.classList.remove('drag-over', 'drag-over-bottom');
  });
  dragSrcIndex = -1;
}

// ========== 插入行 ==========

function insertPlanBefore(index) {
  if (!currentStudent) return;
  const plans = studentData[currentStudent].plans;
  plans.splice(index, 0, createEmptyPlan());
  renumberPlans();
  renderPlanTable();
  updatePlanExportPreview();
  persist();
}

function insertPlanAfter(index) {
  if (!currentStudent) return;
  const plans = studentData[currentStudent].plans;
  plans.splice(index + 1, 0, createEmptyPlan());
  renumberPlans();
  renderPlanTable();
  updatePlanExportPreview();
  persist();
}

function createEmptyPlan() {
  return { num: 0, date: '', content: '' };
}

// ========== 原有功能 ==========

function addPlanRow() {
  if (!currentStudent) { alert('请先添加学生'); return; }
  const plans = studentData[currentStudent].plans;
  plans.push(createEmptyPlan());
  renumberPlans();
  renderPlanTable();
  persist();
}

function updatePlan(index, field, value) {
  if (!currentStudent) return;
  studentData[currentStudent].plans[index][field] = value;
  persist();
}

function deletePlan(index) {
  if (!currentStudent) return;
  studentData[currentStudent].plans.splice(index, 1);
  renumberPlans();
  renderPlanTable();
  updatePlanExportPreview();
  persist();
}

// 重新编号（按顺序 1, 2, 3...）
function renumberPlans() {
  if (!currentStudent) return;
  const plans = studentData[currentStudent].plans;
  plans.forEach((p, i) => {
    p.num = i + 1;
  });
}
