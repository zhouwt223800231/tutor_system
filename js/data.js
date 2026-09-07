/* ===== 数据持久化层（v4.0：按“阶段/学期”组织） ===== */

const STORAGE_KEY = 'tutor_system_data';
const STORAGE_META = 'tutor_system_meta';   // 记录本机最后一次修改时间（云端冲突判断用）

// 生成稳定、唯一的 ID
function uid(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function nowISO() {
  return new Date().toISOString();
}

// 默认数据（首次使用）
function getDefaultData() {
  return {
    students: [
      { id: 's1', name: '示例学生', grade: '高二', subject: '数学' }
    ],
    studentData: {
      s1: {
        stages: [{
          id: uid('st'),
          name: '未分类',
          sort: 0,
          message: '',
          plans: [
            { id: uid('p'), num: 1, date: '', content: '' }
          ],
          records: []
        }]
      }
    },
    nextStudentId: 2,
    nextNodeId: 1
  };
}

// 把单个学生的数据整理成“stages”结构；兼容旧版平铺 plans/records
function ensureStagesShape(entry) {
  entry = entry || {};
  if (Array.isArray(entry.stages)) {
    entry.stages.forEach(function (st) {
      if (!st.id) st.id = uid('st');
      if (typeof st.sort !== 'number') st.sort = 0;
      if (typeof st.message !== 'string') st.message = '';
      if (!Array.isArray(st.plans)) st.plans = [];
      if (!Array.isArray(st.records)) st.records = [];
      st.plans.forEach(function (p) { if (!p.id) p.id = uid('p'); });
      st.records.forEach(function (r) {
        if (!r.id) r.id = uid('r');
        if (!r.createdAt) r.createdAt = nowISO();
        if (!r.updatedAt) r.updatedAt = nowISO();
        if (!Array.isArray(r.outline)) r.outline = [];
      });
    });
    return entry;
  }
  // 旧格式：plans / records 平铺 → 全部放入“未分类”阶段
  const plans = Array.isArray(entry.plans) ? entry.plans : [];
  const records = Array.isArray(entry.records) ? entry.records : [];
  return {
    stages: [{
      id: uid('st'),
      name: '未分类',
      sort: 0,
      message: '',
      plans: plans.map(function (p) {
        return { id: p.id || uid('p'), num: p.num, date: p.date || '', content: p.content || '' };
      }),
      records: records.map(function (r) {
        return {
          id: r.id || uid('r'),
          date: r.date || '',
          status: r.status || '较为认真',
          performance: r.performance || '',
          homework: r.homework || '',
          feedback: r.feedback || '',
          outline: Array.isArray(r.outline) ? JSON.parse(JSON.stringify(r.outline)) : [],
          createdAt: r.createdAt || nowISO(),
          updatedAt: r.updatedAt || nowISO()
        };
      })
    }]
  };
}

// 计算下一个可用的学生编号，避免冲突
function calcNextStudentId(data) {
  let maxN = 0;
  (data.students || []).forEach(function (s) {
    const n = parseInt(String(s.id).replace(/^s/, ''), 10);
    if (!isNaN(n) && n > maxN) maxN = n;
  });
  return Math.max(maxN, (data.students || []).length) + 1;
}

// 扫描所有记录的大纲节点，计算下一个可用的节点编号
function calcNextNodeId(data) {
  let maxN = 0;
  function scan(nodes) {
    (nodes || []).forEach(function (n) {
      const m = parseInt(String(n.id).replace(/^n/, ''), 10);
      if (!isNaN(m) && m > maxN) maxN = m;
      if (n.children && n.children.length) scan(n.children);
    });
  }
  const sd = data.studentData || {};
  Object.keys(sd).forEach(function (sid) {
    const sts = sd[sid].stages || [];
    sts.forEach(function (st) {
      (st.records || []).forEach(function (r) { scan(r.outline); });
    });
  });
  return maxN + 1;
}

// 归一化整体数据（补全字段 / 旧格式迁移），只处理一次，之后保持新格式
function normalizeData(data) {
  data = data || {};
  if (!Array.isArray(data.students)) data.students = [];
  if (!data.studentData || typeof data.studentData !== 'object') data.studentData = {};
  data.students.forEach(function (s) {
    if (!data.studentData[s.id]) data.studentData[s.id] = { stages: [] };
    data.studentData[s.id] = ensureStagesShape(data.studentData[s.id]);
  });
  if (typeof data.nextStudentId !== 'number' || !data.nextStudentId) {
    data.nextStudentId = calcNextStudentId(data);
  }
  if (typeof data.nextNodeId !== 'number' || !data.nextNodeId) {
    data.nextNodeId = calcNextNodeId(data);
  }
  return data;
}

// 加载全部数据
function loadAllData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return normalizeData(parsed);
    }
  } catch (e) {
    console.error('加载数据失败:', e);
  }
  return getDefaultData();
}

// 保存全部数据
function saveAllData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('保存数据失败:', e);
    alert('保存失败，可能是存储空间不足');
  }
}

// 记录本机修改时间（云端冲突判断用）
function markLocalChange() {
  try { localStorage.setItem(STORAGE_META, String(Date.now())); } catch (e) {}
}

function getLocalChangeTime() {
  try { return Number(localStorage.getItem(STORAGE_META)) || 0; } catch (e) { return 0; }
}

// 导出 JSON 备份
function exportBackup() {
  const data = {
    students: students,
    studentData: studentData,
    nextStudentId: nextStudentId,
    nextNodeId: nextNodeId
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '家教系统备份_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

// 导入 JSON 恢复（兼容旧版备份：自动迁移为阶段结构）
function importBackup(file, callback) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed.students && parsed.studentData) {
        const data = normalizeData(parsed);
        saveAllData(data);
        callback(true);
      } else {
        callback(false, '数据格式不正确');
      }
    } catch (err) {
      callback(false, '文件解析失败');
    }
  };
  reader.readAsText(file);
}