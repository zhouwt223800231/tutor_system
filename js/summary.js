/* ===== 结课总结面板（v4.0：当前学生 + 当前阶段） ===== */

function renderSummary() {
  const setEmpty = function (id, text) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<div class="empty-state">' + text + '</div>';
  };
  if (!currentStudent) {
    setEmpty('summaryTimeline', '请先添加学生');
    setEmpty('summaryRecords', '请先添加学生');
    setEmpty('summaryExportPreview', '请先添加学生');
    const m = document.getElementById('summaryMessage');
    if (m) m.value = '';
    return;
  }
  const stage = getCurrentStageObj();
  if (!stage) {
    setEmpty('summaryTimeline', '请先为该学生添加阶段');
    setEmpty('summaryRecords', '请先为该学生添加阶段');
    setEmpty('summaryExportPreview', '请先为该学生添加阶段');
    const m = document.getElementById('summaryMessage');
    if (m) m.value = '';
    return;
  }
  const msgEl = document.getElementById('summaryMessage');
  if (msgEl && msgEl.value !== (stage.message || '')) {
    msgEl.value = stage.message || '';
  }
  renderSummaryTimeline();
  renderSummaryRecords();
  updateSummaryExportPreview();
}

// 保存当前阶段寄语（切换阶段/学生前先调用）
function saveSummaryMessage() {
  const msgEl = document.getElementById('summaryMessage');
  if (!msgEl || !currentStudent) return;
  const stage = getCurrentStageObj();
  if (!stage) return;
  const v = msgEl.value;
  if (stage.message !== v) {
    stage.message = v;
    persist();
  }
}

// 渲染课程时间线
function renderSummaryTimeline() {
  const container = document.getElementById('summaryTimeline');
  const stage = getCurrentStageObj();
  const plans = stage ? stage.plans : [];
  if (!plans || plans.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无课程计划</div>';
    return;
  }
  let html = '<div class="timeline-list">';
  plans.forEach(function (p, i) {
    const isLast = i === plans.length - 1;
    html += '<div class="timeline-item ' + (isLast ? 'last' : '') + '">' +
      '<div class="timeline-dot"></div>' +
      '<div class="timeline-content">' +
      '<div class="timeline-header">' +
      '<span class="timeline-num">第' + p.num + '次课</span>' +
      '<span class="timeline-date">' + escapeHtml(p.date || '待定') + '</span>' +
      '</div>' +
      '<div class="timeline-body">' + escapeHtml(p.content || '（未填写内容）') + '</div>' +
      '</div></div>';
  });
  html += '</div>';
  container.innerHTML = html;
}

// 渲染课后记录概要
function renderSummaryRecords() {
  const container = document.getElementById('summaryRecords');
  const stage = getCurrentStageObj();
  const records = stage ? stage.records : [];
  if (!records || records.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无课后记录</div>';
    return;
  }
  let html = '<div class="record-summary-list">';
  records.forEach(function (r) {
    const title = r.outline && r.outline[0] && r.outline[0].text ? r.outline[0].text : '无主题';
    const statusColor = getStatusColorHex(r.status);
    html += '<div class="record-summary-item">' +
      '<div class="record-summary-header">' +
      '<span class="record-summary-date">' + escapeHtml(r.date || '未设置日期') + '</span>' +
      '<span class="record-summary-status" style="color:' + statusColor + '">' + escapeHtml(r.status || '—') + '</span>' +
      '</div>' +
      '<div class="record-summary-title">' + escapeHtml(title) + '</div>' +
      '<div class="record-summary-brief">' + escapeHtml(r.performance || '暂无评价').substring(0, 60) + ((r.performance || '').length > 60 ? '...' : '') + '</div>' +
      '</div>';
  });
  html += '</div>';
  container.innerHTML = html;
}

// 更新结课总结导出预览
function updateSummaryExportPreview() {
  const preview = document.getElementById('summaryExportPreview');
  const s = getCurrentStudent();
  const stage = getCurrentStageObj();
  if (!s || !stage) {
    preview.innerHTML = '<div class="export-empty">请先选择学生与阶段</div>';
    return;
  }
  const plans = stage.plans || [];
  const records = stage.records || [];
  const msgEl = document.getElementById('summaryMessage');
  const message = (msgEl ? msgEl.value : stage.message) || '';

  // 纯文本版
  let timelineText = '';
  if (plans.length > 0) {
    timelineText = plans.map(function (p) {
      return '第' + p.num + '次课  ' + (p.date || '待定') + '  ' + (p.content || '—');
    }).join('\n');
  } else {
    timelineText = '（暂无课程计划）';
  }
  let recordsText = '';
  if (records.length > 0) {
    recordsText = records.map(function (r) {
      const title = r.outline && r.outline[0] && r.outline[0].text ? r.outline[0].text : '无主题';
      return (r.date || '未设置') + '  ' + title + '  [' + (r.status || '—') + ']';
    }).join('\n');
  } else {
    recordsText = '（暂无课后记录）';
  }

  const plainText = '📋 ' + s.name + ' · ' + stage.name + ' 结课总结\n\n' +
    '👤 ' + s.grade + ' · ' + s.subject + '\n' +
    '📊 共上课 ' + records.length + ' 次\n\n' +
    '📅 课程安排\n' + timelineText + '\n\n' +
    '📖 上课记录\n' + recordsText + '\n\n' +
    '✨ 总结寄语\n' + (message || '（暂无寄语）');

  // HTML版（用于截图）
  const timelineHtml = plans.length > 0
    ? plans.map(function (p) {
        return '<div class="export-summary-row">' +
          '<span class="export-summary-label">第' + p.num + '次课</span>' +
          '<span class="export-summary-date">' + escapeHtml(p.date || '待定') + '</span>' +
          '<span class="export-summary-content">' + escapeHtml(p.content || '—') + '</span>' +
          '</div>';
      }).join('')
    : '<div class="export-empty-line">（暂无课程计划）</div>';

  const recordsHtml = records.length > 0
    ? records.map(function (r) {
        const title = r.outline && r.outline[0] && r.outline[0].text ? r.outline[0].text : '无主题';
        const statusColor = getStatusColorHex(r.status);
        return '<div class="export-summary-row">' +
          '<span class="export-summary-date">' + escapeHtml(r.date || '未设置') + '</span>' +
          '<span class="export-summary-content">' + escapeHtml(title) + '</span>' +
          '<span class="export-summary-status" style="color:' + statusColor + '">' + escapeHtml(r.status || '—') + '</span>' +
          '</div>';
      }).join('')
    : '<div class="export-empty-line">（暂无课后记录）</div>';

  const messageHtml = message
    ? '<div class="export-message">' + escapeHtml(message).replace(/\n/g, '<br>') + '</div>'
    : '<div class="export-empty-line">（暂无寄语）</div>';

  preview.innerHTML = '<div class="export-card-inner">' +
    '<div class="export-header">' +
    '<div class="export-title">📋 ' + escapeHtml(s.name) + ' 结课总结</div>' +
    '<div class="export-subtitle">' + escapeHtml(stage.name) + ' · ' + escapeHtml(s.grade) + ' · ' + escapeHtml(s.subject) + ' · 共上课 ' + records.length + ' 次</div>' +
    '</div>' +
    '<div class="export-section">' +
    '<div class="export-section-title">📅 课程安排</div>' +
    '<div class="export-summary-list">' + timelineHtml + '</div>' +
    '</div>' +
    '<div class="export-section">' +
    '<div class="export-section-title">📖 上课记录</div>' +
    '<div class="export-summary-list">' + recordsHtml + '</div>' +
    '</div>' +
    '<div class="export-section">' +
    '<div class="export-section-title">✨ 总结寄语</div>' +
    messageHtml +
    '</div>' +
    '</div>';
  preview.dataset.plainText = plainText;
}

function copySummaryExport() {
  const preview = document.getElementById('summaryExportPreview');
  const text = preview.dataset.plainText || preview.textContent;
  copyToClipboard(text);
}

function downloadSummaryImage() {
  const s = getCurrentStudent();
  const stage = getCurrentStageObj();
  let prefix = '结课总结_' + (s ? s.name : '学生');
  if (stage) prefix += '_' + stage.name;
  downloadElementImage('summaryExportPreview', prefix);
}

// 监听总结寄语输入：实时更新预览 + 防抖保存到当前阶段
document.addEventListener('DOMContentLoaded', function () {
  const msgInput = document.getElementById('summaryMessage');
  if (!msgInput) return;
  let timer = null;
  msgInput.addEventListener('input', function () {
    if (!document.getElementById('panel-summary').classList.contains('active')) return;
    if (timer) clearTimeout(timer);
    updateSummaryExportPreview();
    timer = setTimeout(function () { saveSummaryMessage(); }, 600);
  });
  msgInput.addEventListener('blur', function () {
    if (timer) { clearTimeout(timer); timer = null; }
    saveSummaryMessage();
  });
});