/* ===== 导出功能（嵌入课前计划 & 课后记录面板） ===== */

// ========== 课前计划导出 ==========

function updatePlanExportPreview() {
  const preview = document.getElementById('planExportPreview');
  const s = getCurrentStudent();
  if (!s) {
    preview.innerHTML = '<div class="export-empty">请先添加学生</div>';
    return;
  }
  const plans = studentData[currentStudent].plans;
  if (!plans || plans.length === 0) {
    preview.innerHTML = '<div class="export-empty">暂无课程计划</div>';
    return;
  }

  // 纯文本版（用于复制）
  const textLines = plans.map(p => {
    const dateStr = p.date ? formatDateCN(p.date) : '待定';
    return `第${p.num}次课  ·  ${dateStr}
${p.content || '（未填写）'}`;
  });
  const plainText = `📋 ${s.name} 课程计划

${textLines.join('

')}`;

  // HTML版（用于截图）
  const htmlItems = plans.map(p => {
    const dateStr = p.date ? formatDateCN(p.date) : '待定';
    return `
      <div class="export-item">
        <div class="export-item-header">
          <span class="export-badge">第${p.num}次课</span>
          <span class="export-date">${dateStr}</span>
        </div>
        <div class="export-item-body">${escapeHtml(p.content) || '（未填写）'}</div>
      </div>
    `;
  }).join('');

  preview.innerHTML = `
    <div class="export-card-inner">
      <div class="export-header">
        <div class="export-title">📋 ${escapeHtml(s.name)} 课程计划</div>
        <div class="export-subtitle">${escapeHtml(s.grade)} · ${escapeHtml(s.subject)}</div>
      </div>
      <div class="export-body">${htmlItems}</div>
    </div>
  `;
  preview.dataset.plainText = plainText;
}

function copyPlanExport() {
  const preview = document.getElementById('planExportPreview');
  const text = preview.dataset.plainText || preview.textContent;
  copyToClipboard(text);
}

function downloadPlanImage() {
  downloadElementImage('planExportPreview', `课程计划_${getCurrentStudent()?.name || '学生'}`);
}

// ========== 课后记录导出 ==========

function updateRecordExportOptions() {
  const select = document.getElementById('exRecord');
  if (!currentStudent) {
    select.innerHTML = '<option>无记录</option>';
    return;
  }
  const records = studentData[currentStudent].records;
  if (records.length === 0) {
    select.innerHTML = '<option>暂无课后记录</option>';
    return;
  }
  select.innerHTML = records.map((r, i) => {
    const title = r.outline && r.outline[0] ? r.outline[0].text : '无主题';
    return `<option value="${i}">${r.date || '未设置'} - ${escapeHtml(title)}</option>`;
  }).join('');
}

function updateRecordExportPreview() {
  const select = document.getElementById('exRecord');
  const preview = document.getElementById('recordExportPreview');
  const s = getCurrentStudent();

  if (!s) {
    preview.innerHTML = '<div class="export-empty">请先添加学生</div>';
    return;
  }

  const records = studentData[currentStudent].records;
  if (!records || records.length === 0) {
    preview.innerHTML = '<div class="export-empty">暂无课后记录</div>';
    return;
  }

  const idx = parseInt(select.value) || 0;
  const r = records[idx] || records[0];
  const outlineText = r.outline && r.outline.length > 0
    ? serializeOutline(r.outline, 0, '')
    : '（暂无内容）';

  // 纯文本版
  const dateStr = r.date ? formatDateCN(r.date) : '—';
  const plainText = `📋 ${s.name} 课后反馈

📅 ${dateStr}  ·  ${r.status || '—'}

📖 本课内容
${outlineText}

💡 表现评价
${r.performance || '—'}

📝 作业布置
${r.homework || '—'}

💬 家长反馈
${r.feedback || '—'}`;

  // HTML版
  const statusColor = getStatusColorHex(r.status);
  const outlineHtml = r.outline && r.outline.length > 0
    ? `<div class="export-outline">${renderOutlineHtml(r.outline, 0, '')}</div>`
    : '<div class="export-empty-line">（暂无内容）</div>';

  preview.innerHTML = `
    <div class="export-card-inner">
      <div class="export-header">
        <div class="export-title">📋 ${escapeHtml(s.name)} 课后反馈</div>
        <div class="export-meta">
          <span class="export-meta-date">📅 ${dateStr}</span>
          <span class="export-meta-status" style="color:${statusColor}">${r.status || '—'}</span>
        </div>
      </div>
      <div class="export-section">
        <div class="export-section-title">📖 本课内容</div>
        ${outlineHtml}
      </div>
      <div class="export-section">
        <div class="export-section-title">💡 表现评价</div>
        <div class="export-section-body">${escapeHtml(r.performance) || '—'}</div>
      </div>
      <div class="export-section">
        <div class="export-section-title">📝 作业布置</div>
        <div class="export-section-body pre-line">${escapeHtml(r.homework) || '—'}</div>
      </div>
      <div class="export-section">
        <div class="export-section-title">💬 家长反馈</div>
        <div class="export-section-body pre-line">${escapeHtml(r.feedback) || '—'}</div>
      </div>
    </div>
  `;
  preview.dataset.plainText = plainText;
}

function copyRecordExport() {
  const preview = document.getElementById('recordExportPreview');
  const text = preview.dataset.plainText || preview.textContent;
  copyToClipboard(text);
}

function downloadRecordImage() {
  downloadElementImage('recordExportPreview', `课后反馈_${getCurrentStudent()?.name || '学生'}`);
}

// ========== 通用工具 ==========

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制到剪贴板！');
    }).catch(() => {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    alert('已复制到剪贴板！');
  } catch (err) {
    alert('复制失败，请手动复制');
  }
  document.body.removeChild(textarea);
}

function formatDateCN(dateStr) {
  if (!dateStr) return '待定';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const week = ['日','一','二','三','四','五','六'][d.getDay()];
  return `${m}月${day}日 周${week}`;
}

function getStatusColorHex(status) {
  if (status === '专注投入') return '#34c759';
  if (status === '较为认真') return '#007aff';
  if (status === '偶有分心') return '#ff9500';
  if (status === '需要督促') return '#ff3b30';
  return '#86868b';
}

function renderOutlineHtml(nodes, level, prefix) {
  let html = '';
  nodes.forEach((node, idx) => {
    let bullet = '';
    if (level === 0) bullet = (idx + 1) + '.';
    else bullet = prefix + '.' + (idx + 1);
    html += `<div class="export-outline-line" style="padding-left:${level * 16}px"><span class="export-outline-num">${bullet}</span> ${escapeHtml(node.text)}</div>`;
    if (node.children && node.children.length > 0) {
      html += renderOutlineHtml(node.children, level + 1, bullet);
    }
  });
  return html;
}

function downloadElementImage(elementId, filenamePrefix) {
  if (typeof html2canvas !== 'undefined') {
    const element = document.getElementById(elementId);
    const date = new Date().toISOString().slice(0,10);
    html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = `${filenamePrefix}_${date}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  } else {
    alert('图片导出需要 html2canvas 库。\n\n请按以下步骤操作：\n1. 下载 html2canvas.min.js 放到 lib/ 目录\n2. 在 index.html 中引入 html2canvas 的 script 标签\n\n访问 https://html2canvas.hertzen.com/ 获取');
  }
}
