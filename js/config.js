/* ============================================================
 * 云端同步配置（LeanCloud）
 * ------------------------------------------------------------
 * 1. 到 LeanCloud 控制台（国内版 https://console.leancloud.cn 或
 *    国际版 https://console.leancloud.app）注册并新建一个应用；
 * 2. 在「设置 → 应用 Keys」里复制 AppID / AppKey；
 * 3. 填到下面三个变量中。
 *
 * serverURL：
 *   - 国内版（leancloud.cn 华北/华东节点）通常不需要填；
 *   - 国际版（leancloud.app）形如 https://xxxx.api.lncldglobal.com
 *     （在控制台「设置 → 应用信息 → API 服务域名」可查到）。
 *
 * 留空（默认）时系统自动进入“本地模式”：数据只保存在当前浏览器，
 * 全部功能（阶段/编辑/覆盖等）均可正常使用，仅不做跨设备同步。
 * ============================================================ */
const CLOUD_CONFIG = {
  appId: '',
  appKey: '',
  serverURL: ''
};