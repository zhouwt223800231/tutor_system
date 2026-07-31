/* ===== 数据持久化层 ===== */

const STORAGE_KEY = 'tutor_system_data';
const STORAGE_META = 'tutor_system_meta';

// 默认数据（首次使用）
function getDefaultData() {
  return {
    students: [
      { id: 's1', name: '示例学生', grade: '高二', subject: '数学' }
    ],
    studentData: {
      s1: {
        plans: [
          { num: 1, date: '', content: '' }
        ],
        records: []
      }
    },
    nextStudentId: 2,
    nextNodeId: 1
  };
}

// 加载全部数据
function loadAllData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // 确保结构完整
      if (!parsed.students) parsed.students = getDefaultData().students;
      if (!parsed.studentData) parsed.studentData = getDefaultData().studentData;
      if (!parsed.nextStudentId) parsed.nextStudentId = getDefaultData().nextStudentId;
      if (!parsed.nextNodeId) parsed.nextNodeId = getDefaultData().nextNodeId;
      return parsed;
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

// 导出 JSON 备份
function exportBackup() {
  const data = loadAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `家教系统备份_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// 导入 JSON 恢复
function importBackup(file, callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.students && data.studentData) {
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
