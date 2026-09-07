/* ===== 层级大纲编辑器（v4.0） ===== */

// 大纲草稿策略：
// - 新建记录时，大纲只保留在内存 editingOutline，点“保存”后才写入记录；
// - 编辑已有记录时，每次修改大纲即时写回该记录（并触发持久化/同步）。
function persistOutlineDraft() {
  if (!currentStudent) return;
  const stage = getCurrentStageObj();
  if (!stage) return;
  if (editingRecordId) {
    const rec = stage.records.find(function (r) { return r.id === editingRecordId; });
    if (rec) {
      rec.outline = JSON.parse(JSON.stringify(editingOutline));
      rec.updatedAt = nowISO();
      persist();
    }
  }
}

// 渲染大纲树
function renderOutline(nodes, level, prefix) {
  let html = '';
  function walk(nodes, level, prefix) {
    nodes.forEach(function (node, idx) {
      let bullet = '';
      if (level === 0) bullet = (idx + 1) + '';
      else bullet = prefix + '.' + (idx + 1);
      html +=
        '<div class="outline-node outline-level-' + Math.min(level, 3) + '" data-id="' + node.id + '">' +
        '<span class="bullet">' + bullet + '</span>' +
        '<input type="text" class="node-input" value="' + escapeHtml(node.text).replace(/"/g, '&quot;') + '"' +
        ' onchange="updateNodeText(\'' + node.id + '\', this.value)"' +
        ' placeholder="输入内容..." />' +
        '<div class="node-actions">' +
        '<button class="btn btn-sm btn-icon" onclick="addChildNode(\'' + node.id + '\')" title="添加子项">⊕</button>' +
        '<button class="btn btn-sm btn-icon" onclick="deleteNode(\'' + node.id + '\')" title="删除">✕</button>' +
        '</div>' +
        '</div>';
      if (node.children && node.children.length > 0) {
        walk(node.children, level + 1, bullet);
      }
    });
  }
  walk(nodes, 0, '');
  return html;
}

function renderOutlineEditor() {
  const container = document.getElementById('outlineEditor');
  if (!container) return;
  if (editingOutline.length === 0) {
    container.innerHTML = '<div class="empty-state">点击上方按钮添加一级主题</div>';
    return;
  }
  container.innerHTML = renderOutline(editingOutline);
}

// 递归查找节点的父级引用
function findNodeParent(nodes, targetId) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === targetId) return { parent: nodes, index: i, node: nodes[i] };
    if (nodes[i].children && nodes[i].children.length > 0) {
      const found = findNodeParent(nodes[i].children, targetId);
      if (found) return found;
    }
  }
  return null;
}

function updateNodeText(id, text) {
  const found = findNodeParent(editingOutline, id);
  if (found) {
    found.node.text = text;
    persistOutlineDraft();
  }
}

function addChildNode(parentId) {
  const found = findNodeParent(editingOutline, parentId);
  if (found) {
    found.node.children = found.node.children || [];
    const parentLevel = found.node.level || 0;
    found.node.children.push({
      id: 'n' + (nextNodeId++),
      text: '',
      level: parentLevel + 1,
      children: []
    });
    renderOutlineEditor();
    persistOutlineDraft();
  }
}

function deleteNode(id) {
  function removeFrom(nodes) {
    const idx = nodes.findIndex(function (n) { return n.id === id; });
    if (idx >= 0) {
      nodes.splice(idx, 1);
      return true;
    }
    for (let n of nodes) {
      if (n.children && n.children.length > 0) {
        if (removeFrom(n.children)) return true;
      }
    }
    return false;
  }
  if (removeFrom(editingOutline)) {
    renderOutlineEditor();
    persistOutlineDraft();
  }
}

function addTopLevelNode() {
  if (!currentStudent) { alert('请先添加学生'); return; }
  if (!getCurrentStageObj()) { alert('请先为该学生添加阶段'); return; }
  editingOutline.push({
    id: 'n' + (nextNodeId++),
    text: '',
    level: 0,
    children: []
  });
  renderOutlineEditor();
  persistOutlineDraft();
}

// 将大纲序列化为纯文本（用于导出）
function serializeOutline(nodes, level, prefix) {
  let text = '';
  nodes.forEach(function (node, idx) {
    let bullet = '';
    if (level === 0) bullet = (idx + 1) + '.';
    else bullet = prefix + '.' + (idx + 1);
    const indent = '  '.repeat(level);
    text += indent + bullet + ' ' + node.text + '\n';
    if (node.children && node.children.length > 0) {
      text += serializeOutline(node.children, level + 1, bullet);
    }
  });
  return text;
}