/* ===== 层级大纲编辑器 ===== */

// 渲染大纲树
function renderOutline(nodes, level, prefix) {
  let html = '';
  function walk(nodes, level, prefix) {
    nodes.forEach((node, idx) => {
      let bullet = '';
      if (level === 0) bullet = (idx + 1) + '';
      else bullet = prefix + '.' + (idx + 1);
      html += `
        <div class="outline-node outline-level-${Math.min(level, 3)}" data-id="${node.id}">
          <span class="bullet">${bullet}</span>
          <input type="text" class="node-input" value="${escapeHtml(node.text)}"
                 onchange="updateNodeText('${node.id}', this.value)"
                 placeholder="输入内容..." />
          <div class="node-actions">
            <button class="btn btn-sm btn-icon" onclick="addChildNode('${node.id}')" title="添加子项">⊕</button>
            <button class="btn btn-sm btn-icon" onclick="deleteNode('${node.id}')" title="删除">✕</button>
          </div>
        </div>
      `;
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
    persist();
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
    persist();
  }
}

function deleteNode(id) {
  function removeFrom(nodes) {
    const idx = nodes.findIndex(n => n.id === id);
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
    persist();
  }
}

function addTopLevelNode() {
  if (!currentStudent) { alert('请先添加学生'); return; }
  editingOutline.push({
    id: 'n' + (nextNodeId++),
    text: '',
    level: 0,
    children: []
  });
  renderOutlineEditor();
  persist();
}

// 将大纲序列化为纯文本（用于导出）
function serializeOutline(nodes, level, prefix) {
  let text = '';
  nodes.forEach((node, idx) => {
    let bullet = '';
    if (level === 0) bullet = (idx + 1) + '.';
    else bullet = prefix + '.' + (idx + 1);
    const indent = '  '.repeat(level);
    text += `${indent}${bullet} ${node.text}
`;
    if (node.children && node.children.length > 0) {
      text += serializeOutline(node.children, level + 1, bullet);
    }
  });
  return text;
}
