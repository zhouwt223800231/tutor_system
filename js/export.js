/* ===== 导出功能 ===== */

function updateExportOptions() {
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

function updateExportPreview() {
  const type = document.getElementById('exType').value;
  const recordIdx = document.getElementById('exRecord').value;
  const s = getCurrentStudent();
  const preview = document.getElementById('exportPreview');

  if (!s) {
    preview.textContent = '请先添加学生';
    return;
  }

  let text = '';
  if (type === 'record') {
    const records = studentData[currentStudent].records;
    if (!records || records.length === 0) {
      preview.textContent = '暂无课后记录可导出';
      return;
    }
    const idx = parseInt(recordIdx) || 0;
    const r = records[idx] || records[0];
    const outlineText = r.outline && r.outline.length > 0
      ? serializeOutline(r.outline, 0, '')
      : '（暂无内容）';

    text = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${s.name} 同学 · 课后学习反馈
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 上课日期：${r.date || '—'}
📊 课堂状态：${r.status || '—'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 本课内容
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${outlineText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 表现评价
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${r.performance || '—'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 作业布置
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${r.homework || '—'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 家长反馈
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${r.feedback || '—'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  } else {
    const plans = studentData[currentStudent].plans;
    if (!plans || plans.length === 0) {
      preview.textContent = '暂无课程计划可导出';
      return;
    }
    text = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${s.name} · 课程计划总表
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

课次    日期          课程内容
────────────────────────────────
${plans.map(p => `${String(p.num).padStart(2, ' ')}      ${(p.date || '—').padEnd(10)}  ${p.content || '—'}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }
  preview.textContent = text;
}

function copyText() {
  const text = document.getElementById('exportPreview').textContent;
  navigator.clipboard.writeText(text).then(() => {
    alert('已复制到剪贴板！');
  }).catch(() => {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('已复制到剪贴板！');
  });
}

function downloadImage() {
  // 如果引入了 html2canvas，则使用它生成图片
  if (typeof html2canvas !== 'undefined') {
    const element = document.getElementById('exportPreview');
    const s = getCurrentStudent();
    const date = document.getElementById('recordDate').value || new Date().toISOString().slice(0,10);
    html2canvas(element, { scale: 2, backgroundColor: '#f5f5f7' }).then(canvas => {
      const link = document.createElement('a');
      link.download = `课后反馈_${s ? s.name : '学生'}_${date}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  } else {
    alert('图片导出需要 html2canvas 库。\n\n请按以下步骤操作：\n1. 下载 html2canvas.min.js 放到 lib/ 目录\n2. 在 index.html 中取消注释 html2canvas 的 script 标签\n\n或者访问 https://html2canvas.hertzen.com/ 获取');
  }
}
