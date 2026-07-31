/* ===== 课后记录管理 ===== */

function clearRecordForm() {
  document.getElementById('recordDate').value = '';
  document.getElementById('recordStatus').value = '较为认真';
  document.getElementById('recordPerformance').value = '';
  document.getElementById('recordHomework').value = '';
  document.getElementById('recordFeedback').value = '';
}

function saveRecord() {
  if (!currentStudent) { alert('请先添加学生'); return; }
  const record = {
    date: document.getElementById('recordDate').value,
    status: document.getElementById('recordStatus').value,
    performance: document.getElementById('recordPerformance').value,
    homework: document.getElementById('recordHomework').value,
    feedback: document.getElementById('recordFeedback').value,
    outline: JSON.parse(JSON.stringify(editingOutline)),
  };
  studentData[currentStudent].records.unshift(record);
  renderHistory();
  updateRecordExportOptions();
  updateRecordExportPreview();
  persist();
  alert('课后记录已保存！');
}

function renderHistory() {
  const list = document.getElementById('historyList');
  if (!currentStudent) {
    list.innerHTML = '';
    return;
  }
  const records = studentData[currentStudent].records;
  if (records.length === 0) {
    list.innerHTML = '<div class="empty-state">暂无记录</div>';
    return;
  }
  list.innerHTML = records.map((r, i) => {
    const title = r.outline && r.outline[0] ? r.outline[0].text : '无内容';
    return `
      <div class="history-item" onclick="loadRecord(${i})">
        <div class="date">${r.date || '未设置日期'}</div>
        <div class="summary">${escapeHtml(title)} · ${r.status}</div>
      </div>
    `;
  }).join('');
}

function loadRecord(index) {
  if (!currentStudent) return;
  const r = studentData[currentStudent].records[index];
  document.getElementById('recordDate').value = r.date || '';
  document.getElementById('recordStatus').value = r.status || '较为认真';
  document.getElementById('recordPerformance').value = r.performance || '';
  document.getElementById('recordHomework').value = r.homework || '';
  document.getElementById('recordFeedback').value = r.feedback || '';
  editingOutline = JSON.parse(JSON.stringify(r.outline || []));
  renderOutlineEditor();
}
