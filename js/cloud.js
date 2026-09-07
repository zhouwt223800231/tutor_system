/* ===== 云端同步（LeanCloud，单账号多设备） =====
 * 未配置（CLOUD_CONFIG 为空）时自动进入“本地模式”：本文件所有逻辑不生效。
 * 数据以“整份数据集”形式存为一个文档，ACL 仅当前账号可读写。
 */

const CLOUD_SESSION_KEY = 'tutor_cloud_session';
const CLOUD_CLASS = 'TutorDataset';

let cloudConfigured = false;
let cloudLoggedIn = false;
let cloudBusy = false;
let cloudPushTimer = null;
let cloudRetryTimer = null;
let cloudPending = false;
let cloudLastSyncAt = null;
let cloudStatusMsg = '';
let cloudStatusIsError = false;
let cloudAuthMode = 'login';

function isCloudConfigured() {
  return !!(CLOUD_CONFIG && CLOUD_CONFIG.appId && CLOUD_CONFIG.appKey);
}

function cloudSDKLoaded() {
  return typeof AV !== 'undefined';
}

// 初始化：读取配置、尝试恢复上次登录会话
function initCloud() {
  cloudConfigured = isCloudConfigured();
  if (!cloudConfigured || !cloudSDKLoaded()) {
    renderCloudHeader();
    return;
  }
  const initOpts = { appId: CLOUD_CONFIG.appId, appKey: CLOUD_CONFIG.appKey };
  if (CLOUD_CONFIG.serverURL) initOpts.serverURL = CLOUD_CONFIG.serverURL;
  AV.init(initOpts);
  try {
    const sess = JSON.parse(localStorage.getItem(CLOUD_SESSION_KEY) || 'null');
    if (sess && sess.token && sess.username) {
      AV.User.become(sess.token).then(function () {
        cloudLoggedIn = true;
        cloudUsername = sess.username;
        renderCloudHeader();
        reconcileWithCloud(false);
      }).catch(function () {
        localStorage.removeItem(CLOUD_SESSION_KEY);
        cloudLoggedIn = false;
        renderCloudHeader();
      });
    } else {
      renderCloudHeader();
    }
  } catch (e) {
    renderCloudHeader();
  }
}

let cloudUsername = '';

/* ========== 顶栏 UI ========== */

function renderCloudHeader() {
  const area = document.getElementById('cloudArea');
  if (!area) return;
  if (!cloudConfigured) {
    area.innerHTML =
      '<span class="cloud-badge" title="在 js/config.js 中填入 LeanCloud AppID/AppKey 后即可开启多设备同步。当前数据只保存在本机浏览器。">☁ 本地模式</span>';
    return;
  }
  if (!cloudSDKLoaded()) {
    area.innerHTML = '<span class="cloud-badge cloud-err">☁ 云端SDK未加载</span>';
    return;
  }
  if (!cloudLoggedIn) {
    area.innerHTML =
      '<span class="cloud-badge">☁ 未登录</span>' +
      '<button class="btn btn-sm cloud-btn" onclick="openCloudAuth()">登录 / 注册</button>';
    return;
  }
  let status = '';
  if (cloudStatusMsg) {
    status = '<span class="cloud-status ' + (cloudStatusIsError ? 'cloud-err' : '') + '">' + cloudStatusMsg + '</span>';
  } else if (cloudLastSyncAt) {
    status = '<span class="cloud-status">同步于 ' + formatClock(cloudLastSyncAt) + '</span>';
  } else {
    status = '<span class="cloud-status">已就绪</span>';
  }
  area.innerHTML =
    '<span class="cloud-user">☁ ' + escapeHtml(cloudUsername) + '</span>' + status +
    '<button class="btn btn-sm cloud-btn" onclick="cloudManualUpload()" title="把本机数据上传并覆盖云端">上传</button>' +
    '<button class="btn btn-sm cloud-btn" onclick="cloudManualDownload()" title="拉取云端数据覆盖本机">下载</button>' +
    '<button class="btn btn-sm cloud-btn" onclick="cloudLogout()">退出</button>';
}

function formatClock(d) {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  const hh = ('0' + dt.getHours()).slice(-2);
  const mm = ('0' + dt.getMinutes()).slice(-2);
  return hh + ':' + mm;
}

function showCloudMsg(msg, isError) {
  cloudStatusMsg = msg;
  cloudStatusIsError = !!isError;
  renderCloudHeader();
}

function clearCloudMsg() {
  cloudStatusMsg = '';
  cloudStatusIsError = false;
}

/* ========== 登录 / 注册 弹窗 ========== */

function openCloudAuth() {
  cloudAuthMode = 'login';
  setCloudAuthMode('login');
  document.getElementById('cloudUsername').value = '';
  document.getElementById('cloudPassword').value = '';
  document.getElementById('cloudPassword2').value = '';
  document.getElementById('cloudError').textContent = '';
  document.getElementById('cloudAuthModal').classList.add('show');
  setTimeout(function () { document.getElementById('cloudUsername').focus(); }, 50);
}

function closeCloudAuth() {
  document.getElementById('cloudAuthModal').classList.remove('show');
}

function setCloudAuthMode(mode) {
  cloudAuthMode = mode;
  const isReg = mode === 'register';
  document.getElementById('cloudTabLogin').classList.toggle('active', !isReg);
  document.getElementById('cloudTabReg').classList.toggle('active', isReg);
  document.getElementById('cloudPwd2Wrap').style.display = isReg ? '' : 'none';
  document.getElementById('cloudAuthSubmit').textContent = isReg ? '注册并登录' : '登录';
  document.getElementById('cloudError').textContent = '';
}

function submitCloudAuth() {
  const username = document.getElementById('cloudUsername').value.trim();
  const password = document.getElementById('cloudPassword').value;
  const pwd2 = document.getElementById('cloudPassword2').value;
  const errEl = document.getElementById('cloudError');
  errEl.textContent = '';
  if (!username || !password) {
    errEl.textContent = '请输入用户名和密码';
    return;
  }
  if (cloudAuthMode === 'register') {
    if (password.length < 6) {
      errEl.textContent = '密码至少 6 位';
      return;
    }
    if (password !== pwd2) {
      errEl.textContent = '两次输入的密码不一致';
      return;
    }
  }
  const btn = document.getElementById('cloudAuthSubmit');
  btn.disabled = true;
  btn.textContent = '请稍候…';
  const action = cloudAuthMode === 'register'
    ? AV.User.signUp(username, password)
    : AV.User.logIn(username, password);
  action.then(function (user) {
    cloudLoggedIn = true;
    cloudUsername = user.getUsername();
    localStorage.setItem(CLOUD_SESSION_KEY, JSON.stringify({ username: cloudUsername, token: user.getSessionToken() }));
    closeCloudAuth();
    clearCloudMsg();
    renderCloudHeader();
    reconcileWithCloud(true);
  }).catch(function (err) {
    errEl.textContent = (err && err.message) ? err.message : '操作失败，请重试';
  }).then(function () {
    btn.disabled = false;
    btn.textContent = cloudAuthMode === 'register' ? '注册并登录' : '登录';
  });
}

function cloudLogout() {
  cloudLoggedIn = false;
  cloudUsername = '';
  cloudPending = false;
  if (cloudPushTimer) { clearTimeout(cloudPushTimer); cloudPushTimer = null; }
  if (cloudRetryTimer) { clearTimeout(cloudRetryTimer); cloudRetryTimer = null; }
  try { localStorage.removeItem(CLOUD_SESSION_KEY); } catch (e) {}
  try { AV.User.logOut(); } catch (e) {}
  clearCloudMsg();
  renderCloudHeader();
}

// 点击遮罩关闭
document.addEventListener('click', function (e) {
  const modal = document.getElementById('cloudAuthModal');
  if (e.target === modal) closeCloudAuth();
});

/* ========== 云端读写 ========== */

function datasetQuery() {
  const q = new AV.Query(CLOUD_CLASS);
  q.limit(1);
  q.descending('updatedAt');
  return q;
}

// 拉取云端整份数据；返回 { data, updatedAt } 或 null
function pullDataset() {
  return datasetQuery().first().then(function (obj) {
    if (!obj) return null;
    let data = null;
    try { data = JSON.parse(obj.get('data') || 'null'); } catch (e) { data = null; }
    return { data: data, updatedAt: obj.updatedAt };
  });
}

// 把整份数据上传云端（覆盖该文档）
function pushDataset() {
  if (!cloudLoggedIn || !cloudConfigured) return Promise.resolve(false);
  const user = AV.User.current();
  const payload = JSON.stringify(buildDataSnapshot());
  return datasetQuery().first().then(function (obj) {
    if (obj) {
      obj.set('data', payload);
      return obj.save();
    }
    const doc = new AV.Object(CLOUD_CLASS);
    doc.set('data', payload);
    const acl = new AV.ACL();
    acl.setReadAccess(user, true);
    acl.setWriteAccess(user, true);
    doc.setACL(acl);
    return doc.save();
  }).then(function () {
    cloudLastSyncAt = new Date();
    return true;
  });
}

/* ========== 本机数据判断 & 应用远端数据 ========== */

function hasRealLocalData() {
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const entry = studentData[s.id] || { stages: [] };
    const sts = entry.stages || [];
    for (let j = 0; j < sts.length; j++) {
      const st = sts[j];
      if (st.records && st.records.length > 0) return true;
      const plans = st.plans || [];
      for (let k = 0; k < plans.length; k++) {
        if (plans[k].content && String(plans[k].content).trim()) return true;
      }
    }
    if (s.name !== '示例学生' || s.grade !== '高二' || s.subject !== '数学') return true;
  }
  return false;
}

function applyRemoteData(remote) {
  const data = normalizeData(remote);
  students = data.students || [];
  studentData = data.studentData || {};
  nextStudentId = data.nextStudentId || 1;
  nextNodeId = data.nextNodeId || 1;
  saveAllData(buildDataSnapshot());
  markLocalChange();
  currentStudent = students.length > 0 ? students[0].id : null;
  currentStageId = null;
  renderStudentChips();
  if (currentStudent) {
    selectStudent(currentStudent);
  } else {
    renderEmptyState();
  }
}

/* ========== 同步调度 ========== */

function queueCloudSync() {
  if (!cloudConfigured || !cloudLoggedIn) return;
  cloudPending = true;
  if (cloudPushTimer) clearTimeout(cloudPushTimer);
  cloudPushTimer = setTimeout(doCloudPush, 1200);
}

function doCloudPush() {
  cloudPushTimer = null;
  if (!cloudConfigured || !cloudLoggedIn) return;
  if (cloudBusy) { cloudPending = true; return; }
  cloudBusy = true;
  cloudPending = false;
  pushDataset().then(function (ok) {
    cloudBusy = false;
    if (ok) clearCloudMsg();
    if (cloudPending) queueCloudSync();
  }).catch(function (err) {
    cloudBusy = false;
    console.error('云端同步失败:', err);
    showCloudMsg('同步失败，已存本机，将自动重试', true);
    if (cloudRetryTimer) clearTimeout(cloudRetryTimer);
    cloudRetryTimer = setTimeout(function () {
      cloudRetryTimer = null;
      if (cloudPending || !cloudLastSyncAt) queueCloudSync();
    }, 20000);
  });
}

// reconcile：登录/启动时与云端对齐
// allowPrompt=true 时（首次登录）遇到冲突会询问；false 时按“较新一方获胜”自动处理
function reconcileWithCloud(allowPrompt) {
  if (!cloudConfigured || !cloudLoggedIn) return Promise.resolve(false);
  cloudBusy = true;
  return pullDataset().then(function (res) {
    const remote = res ? res.data : null;
    const remoteTime = res && res.updatedAt ? new Date(res.updatedAt).getTime() : 0;
    const localReal = hasRealLocalData();
    const localTime = getLocalChangeTime();

    if (!remote) {
      // 云端为空：有真实本机数据则询问是否上传（首次），否则直接上传
      if (localReal && allowPrompt) {
        if (confirm('云端还没有数据。\n是否把本机数据上传到云端？\n（点“取消”则暂不上传，之后可在右上角点“上传”）')) {
          return pushDataset();
        }
        return false;
      }
      return pushDataset();
    }

    // 云端有数据
    if (!localReal) {
      applyRemoteData(remote);
      return true;
    }
    if (allowPrompt && localTime > remoteTime) {
      // 首次登录且本机更新：询问方向
      const useCloud = confirm(
        '本机有比云端更新的修改。\n\n“确定”＝以云端为准（本机修改会被覆盖）\n“取消”＝保留本机数据（稍后可用“上传”按钮覆盖云端）'
      );
      if (useCloud) {
        applyRemoteData(remote);
        return true;
      }
      return false;
    }
    if (localTime > remoteTime) {
      // 本机更新（如离线修改）：保留本机并上传
      queueCloudSync();
      return true;
    }
    applyRemoteData(remote);
    return true;
  }).catch(function (err) {
    console.error('云端拉取失败:', err);
    showCloudMsg('云端连接失败', true);
    return false;
  }).then(function (r) {
    cloudBusy = false;
    return r;
  });
}

/* ========== 手动 上传 / 下载 ========== */

function cloudManualUpload() {
  if (!cloudLoggedIn) return;
  if (!confirm('确定把本机数据上传到云端并覆盖云端数据吗？')) return;
  cloudBusy = true;
  pushDataset().then(function (ok) {
    cloudBusy = false;
    if (ok) showCloudMsg('已上传到云端');
  }).catch(function () {
    cloudBusy = false;
    showCloudMsg('上传失败', true);
  });
}

function cloudManualDownload() {
  if (!cloudLoggedIn) return;
  if (!confirm('确定用云端数据覆盖本机数据吗？本机未上传的修改会丢失。')) return;
  cloudBusy = true;
  pullDataset().then(function (res) {
    cloudBusy = false;
    if (res && res.data) {
      applyRemoteData(res.data);
      showCloudMsg('已从云端拉取最新数据');
    } else {
      showCloudMsg('云端暂无数据');
    }
  }).catch(function () {
    cloudBusy = false;
    showCloudMsg('下载失败', true);
  });
}