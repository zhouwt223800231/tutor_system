/* ===== 结课总结面板 ===== */

function renderSummary() {
  if (!currentStudent) {
    document.getElementById('summaryTimeline').innerHTML = '<div class="empty-state">请先添加学生</div>';
    document.getElementById('summaryRecords').innerHTML = '<div class="empty-state">请先添加学生</div>';
    document.getElementById('summaryExportPreview').innerHTML = '<div class="export-empty">请先添加学生</div>';
    return;
  }

  renderSummaryTimeline();
  renderSummaryRecords();
  updateSummaryExportPreview();
}

// 渲染课程时间线
function renderSummaryTimeline() {
  const container = document.getElementById('summaryTimeline');
  const plans = studentData[currentStudent].plans;

  if (!plans || plans.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无课程计划</div>';
    return;
  }

  let html = '<div class="timeline-list">';
  plans.forEach((p, i) => {
    const isLast = i === plans.length - 1;
    html += '<div class="timeline-item ' + (isLast ? 'last' : '') + '">'
      + '<div class="timeline-dot"></div>'
      + '<div class="timeline-content">'
      + '<div class="timeline-header">'
      + '<span class="timeline-num">第' + p.num + '次课</span>'
      + '<span class="timeline-date">' + (p.date || '待定') + '</span>'
      + '</div>'
      + '<div class="timeline-body">' + escapeHtml(p.content || '（未填写内容）') + '</div>'
      + '</div></div>';
  });
  html += '</div>';
  container.innerHTML = html;
}

// 渲染课后记录概要
function renderSummaryRecords() {
  const container = document.getElementById('summaryRecords');
  const records = studentData[currentStudent].records;

  if (!records || records.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无课后记录</div>';
    return;
  }

  let html = '<div class="record-summary-list">';
  records.forEach((r, i) => {
    const title = r.outline && r.outline[0] ? r.outline[0].text : '无主题';
    const statusColor = getStatusColorHex(r.status);
    html += '<div class="record-summary-item">'
      + '<div class="record-summary-header">'
      + '<span class="record-summary-date">' + (r.date || '未设置日期') + '</span>'
      + '<span class="record-summary-status" style="color:' + statusColor + '">' + (r.status || '—') + '</span>'
      + '</div>'
      + '<div class="record-summary-title">' + escapeHtml(title) + '</div>'
      + '<div class="record-summary-brief">' + escapeHtml(r.performance || '暂无评价').substring(0, 60) + ((r.performance || '').length > 60 ? '...' : '') + '</div>'
      + '</div>';
  });
  html += '</div>';
  container.innerHTML = html;
}

// 更新结课总结导出预览
function updateSummaryExportPreview() {
  const preview = document.getElementById('summaryExportPreview');
  const s = getCurrentStudent();

  if (!s) {
    preview.innerHTML = '<div class="export-empty">请先添加学生</div>';
    return;
  }

  const plans = studentData[currentStudent].plans;
  const records = studentData[currentStudent].records;
  const message = document.getElementById('summaryMessage').value.trim();

  // 纯文本版
  let timelineText = '';
  if (plans && plans.length > 0) {
    timelineText = plans.map(p =>
      '第' + p.num + '次课  ' + (p.date || '待定') + '  ' + (p.content || '—')
    ).join('\n');
  } else {
    timelineText = '（暂无课程计划）';
  }

  let recordsText = '';
  if (records && records.length > 0) {
    recordsText = records.map(r => {
      const title = r.outline && r.outline[0] ? r.outline[0].text : '无主题';
      return (r.date || '未设置') + '  ' + title + '  [' + (r.status || '—') + ']';
    }).join('\n');
  } else {
    recordsText = '（暂无课后记录）';
  }

  const plainText = '📋 ' + s.name + ' 结课总结\n\n'
    + '👤 ' + s.grade + ' · ' + s.subject + '\n'
    + '📊 共上课 ' + records.length + ' 次\n\n'
    + '📅 课程安排\n' + timelineText + '\n\n'
    + '📖 上课记录\n' + recordsText + '\n\n'
    + '✨ 总结寄语\n' + (message || '（暂无寄语）');

  // HTML版（用于截图）
  const timelineHtml = plans && plans.length > 0
    ? plans.map(p =>
        '<div class="export-summary-row">'
        + '<span class="export-summary-label">第' + p.num + '次课</span>'
        + '<span class="export-summary-date">' + (p.date || '待定') + '</span>'
        + '<span class="export-summary-content">' + escapeHtml(p.content || '—') + '</span>'
        + '</div>'
      ).join('')
    : '<div class="export-empty-line">（暂无课程计划）</div>';

  const recordsHtml = records && records.length > 0
    ? records.map(r => {
        const title = r.outline && r.outline[0] ? r.outline[0].text : '无主题';
        const statusColor = getStatusColorHex(r.status);
        return '<div class="export-summary-row">'
          + '<span class="export-summary-date">' + (r.date || '未设置') + '</span>'
          + '<span class="export-summary-content">' + escapeHtml(title) + '</span>'
          + '<span class="export-summary-status" style="color:' + statusColor + '">' + (r.status || '—') + '</span>'
          + '</div>';
      }).join('')
    : '<div class="export-empty-line">（暂无课后记录）</div>';

  const messageHtml = message
    ? '<div class="export-message">' + escapeHtml(message).replace(/\n/g, '<br>') + '</div>'
    : '<div class="export-empty-line">（暂无寄语）</div>';

  preview.innerHTML = '<div class="export-card-inner">'
    + '<div class="export-header">'
    + '<div class="export-title">📋 ' + escapeHtml(s.name) + ' 结课总结</div>'
    + '<div class="export-subtitle">' + escapeHtml(s.grade) + ' · ' + escapeHtml(s.subject) + ' · 共上课 ' + records.length + ' 次</div>'
    + '</div>'
    + '<div class="export-section">'
    + '<div class="export-section-title">📅 课程安排</div>'
    + '<div class="export-summary-list">' + timelineHtml + '</div>'
    + '</div>'
    + '<div class="export-section">'
    + '<div class="export-section-title">📖 上课记录</div>'
    + '<div class="export-summary-list">' + recordsHtml + '</div>'
    + '</div>'
    + '<div class="export-section">'
    + '<div class="export-section-title">✨ 总结寄语</div>'
    + messageHtml
    + '</div>'
    + '</div>';
  preview.dataset.plainText = plainText;
}

function copySummaryExport() {
  const preview = document.getElementById('summaryExportPreview');
  const text = preview.dataset.plainText || preview.textContent;
  copyToClipboard(text);
}

function downloadSummaryImage() {
  downloadElementImage('summaryExportPreview', '结课总结_' + (getCurrentStudent() ? getCurrentStudent().name : '学生'));
}

// 监听总结寄语输入，实时更新预览
document.addEventListener('DOMContentLoaded', function() {
  const msgInput = document.getElementById('summaryMessage');
  if (msgInput) {
    msgInput.addEventListener('input', function() {
      if (document.getElementById('panel-summary').classList.contains('active')) {
        updateSummaryExportPreview();
      }
    });
  }
});
