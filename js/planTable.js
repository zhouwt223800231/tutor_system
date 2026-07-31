/* ===== 课前计划表格 ===== */

function renderPlanTable() {
  const tbody = document.getElementById('planBody');
  if (!currentStudent) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">请先添加学生</td></tr>';
    return;
  }
  const plans = studentData[currentStudent].plans;
  if (plans.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">暂无课程计划，点击上方按钮添加</td></tr>';
    return;
  }
  tbody.innerHTML = plans.map((p, i) => `
    <tr>
      <td class="num-col">
        <input type="text" value="${p.num}" onchange="updatePlan(${i}, 'num', this.value)" style="text-align:center;" />
      </td>
      <td class="date-col">
        <input type="date" value="${p.date}" onchange="updatePlan(${i}, 'date', this.value)" />
      </td>
      <td>
        <input type="text" value="${escapeHtml(p.content)}" onchange="updatePlan(${i}, 'content', this.value)" placeholder="课程内容" />
      </td>
      <td class="action-col">
        <span class="row-actions">
          <button class="btn btn-sm btn-danger" onclick="deletePlan(${i})">删除</button>
        </span>
      </td>
    </tr>
  `).join('');
}

function addPlanRow() {
  if (!currentStudent) { alert('请先添加学生'); return; }
  const plans = studentData[currentStudent].plans;
  const nums = plans.map(p => parseInt(p.num) || 0);
  const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  plans.push({ num: nextNum, date: '', content: '' });
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
  renderPlanTable();
  persist();
}
