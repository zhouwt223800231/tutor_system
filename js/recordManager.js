/* ===== 课后记录管理（v4.0：修改即覆盖原记录） ===== */

let editingRecordId = null;

function clearRecordForm() {
  const d = function (id) { return document.getElementById(id); };
  if (d('recordDate')) d('recordDate').value = '';
  if (d('recordStatus')) d('recordStatus').value = '较为认真';
  if (d('recordPerformance')) d('recordPerformance').value = '';
  if (d('recordHomework')) d('recordHomework').value = '';
  if (d('recordFeedback')) d('recordFeedback').value = '';
}

function hideEditBanner() {
  const b = document.getElementById('editBanner');
  if (b) b.style.display = 'none';
}

function showEditBanner(record) {
  const b = document.getElementById('editBanner');
  if (!b) return;
  const dateStr = record.date || '未设置日期';
  document.getElementById('editBannerText').textContent = '正在编辑 ' + dateStr + ' 的记录：保存将覆盖原记录';
  b.style.display = 'flex';
}

// 清空表单并退出“编辑态”（切换学生/阶段、点“新建反馈”时调用）
function resetRecordFormState() {
  editingRecordId = null;
  clearRecordForm();
  editingOutline = [];
  renderOutlineEditor();
  hideEditBanner();
}

// 公开的“＋ 新建反馈”入口
function resetToNewRecord() {
  resetRecordFormState();
}

// 取消编辑（等价于回到新建状态）
function cancelEditing() {
  resetRecordFormState();
}

function saveRecord() {
  if (!currentStudent) { alert('请先添加学生'); return; }
  const stage = getCurrentStageObj();
  if (!stage) { alert('请先为该学生添加阶段'); return; }
  const date = document.getElementById('recordDate').value;
  const status = document.getElementById('recordStatus').value;
  const performance = document.getElementById('recordPerformance').value;
  const homework = document.getElementById('recordHomework').value;
  const feedback = document.getElementById('recordFeedback').value;
  const outline = JSON.parse(JSON.stringify(editingOutline || []));

  // 编辑态：在原记录上覆盖，绝不新增重复
  if (editingRecordId) {
    const rec = stage.records.find(function (r) { return r.id === editingRecordId; });
    if (rec) {
      rec.date = date;
      rec.status = status;
      rec.performance = performance;
      rec.homework = homework;
      rec.feedback = feedback;
      rec.outline = outline;
      rec.updatedAt = nowISO();
      persist();
      renderHistory();
      updateRecordExportOptions();
      updateRecordExportPreview();
      alert('已更新并覆盖原记录');
      return;
    }
    editingRecordId = null; // 记录已不存在，退化为新建
  }

  const newRecord = {
    id: uid('r'),
    date: date,
    status: status,
    performance: performance,
    homework: homework,
    feedback: feedback,
    outline: outline,
    createdAt: nowISO(),
    updatedAt: nowISO()
  };
  stage.records.unshift(newRecord);
  persist();
  renderHistory();
  updateRecordExportOptions();
  updateRecordExportPreview();
  alert('课后记录已保存');
  resetToNewRecord();   // 保存成功后清空，方便录入下一条
}

function renderHistory() {
  const list = document.getElementById('historyList');
  if (!list) return;
  if (!currentStudent) {
    list.innerHTML = '<div class="empty-state">请先添加学生</div>';
    return;
  }
  const stage = getCurrentStageObj();
  if (!stage) {
    list.innerHTML = '<div class="empty-state">请先为该学生添加阶段</div>';
    return;
  }
  const records = stage.records;
  if (records.length === 0) {
    list.innerHTML = '<div class="empty-state">暂无记录</div>';
    return;
  }
  const otherStages = sortedStages(currentStudent).filter(function (s) { return s.id !== stage.id; });
  const moveOptions = otherStages.length > 0
    ? otherStages.map(function (s) {
        return '<option value="' + s.id + '">' + escapeHtml(s.name) + '</option>';
      }).join('')
    : '<option value="">无其他阶段</option>';

  list.innerHTML = records.map(function (r) {
    const title = r.outline && r.outline[0] && r.outline[0].text ? r.outline[0].text : '无内容';
    const statusColor = getStatusColorHex(r.status);
    const editingBadge = (editingRecordId === r.id) ? '<span class="history-editing-badge">编辑中</span>' : '';
    return '<div class="history-item">' +
      '<div class="history-body" onclick="loadRecord(\'' + r.id + '\')">' +
      '<div class="history-top">' +
      '<span class="date">' + escapeHtml(r.date || '未设置日期') + '</span>' +
      editingBadge +
      '<span class="history-status" style="color:' + statusColor + '">' + escapeHtml(r.status || '—') + '</span>' +
      '</div>' +
      '<div class="summary">' + escapeHtml(title) + '</div>' +
      '</div>' +
      '<div class="history-actions">' +
      '<select class="move-select" onchange="moveRecordToStage(\'' + r.id + '\', this.value)" title="移动到其他阶段">' +
      '<option value="">移到…</option>' + moveOptions +
      '</select>' +
      '<button class="btn btn-sm btn-danger" onclick="deleteRecord(\'' + r.id + '\')">删除</button>' +
      '</div>' +
      '</div>';
  }).join('');
}

function loadRecord(recordId) {
  const stage = getCurrentStageObj();
  if (!stage) return;
  const r = stage.records.find(function (x) { return x.id === recordId; });
  if (!r) return;
  editingRecordId = recordId;
  document.getElementById('recordDate').value = r.date || '';
  document.getElementById('recordStatus').value = r.status || '较为认真';
  document.getElementById('recordPerformance').value = r.performance || '';
  document.getElementById('recordHomework').value = r.homework || '';
  document.getElementById('recordFeedback').value = r.feedback || '';
  editingOutline = JSON.parse(JSON.stringify(r.outline || []));
  renderOutlineEditor();
  showEditBanner(r);
  renderHistory();
}

function deleteRecord(recordId) {
  if (!confirm('确定删除这条课后反馈吗？此操作不可恢复。')) return;
  const stage = getCurrentStageObj();
  if (!stage) return;
  stage.records = stage.records.filter(function (r) { return r.id !== recordId; });
  if (editingRecordId === recordId) resetRecordFormState();
  persist();
  renderHistory();
  updateRecordExportOptions();
  updateRecordExportPreview();
}