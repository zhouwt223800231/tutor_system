# 📚 家教课程管理系统

一个专为家教老师设计的轻量级课程管理工具，纯前端实现，数据存储在浏览器本地，无需服务器。

## ✨ 功能特点

- **学生管理**：在线添加/删除学生，每个学生独立档案
- **课前计划**：表格形式记录课次、日期、课程内容
- **课后记录**：层级大纲编辑器（支持 1 / 1.1 / 1.1.1 多级结构），清晰记录每节课内容
- **历史回溯**：随时查看、编辑过往记录
- **导出功能**：
  - 一键复制文本（可直接粘贴到微信/钉钉）
  - 保存为图片（需引入 html2canvas）
- **数据备份**：支持导出/导入 JSON 备份，换设备不丢数据

## 🚀 快速开始

### 方式一：直接打开（最简单）
1. 下载本项目所有文件
2. 用浏览器直接打开 `index.html`
3. 开始使用！

### 方式二：部署到 GitHub Pages
1. Fork 或上传本项目到你的 GitHub 仓库
2. 进入仓库 Settings → Pages
3. Source 选择 `Deploy from a branch`，Branch 选 `main`，文件夹选 `/ (root)`
4. 等待 1-2 分钟，访问生成的链接即可

## 📁 项目结构

```
tutor-system/
├── index.html              # 主页面
├── css/
│   └── style.css           # 样式文件
├── js/
│   ├── app.js              # 应用初始化 & 全局状态
│   ├── data.js             # LocalStorage 数据持久化
│   ├── studentManager.js   # 学生管理（添加/删除/切换）
│   ├── planTable.js        # 课前计划表格
│   ├── outlineEditor.js    # 层级大纲编辑器
│   ├── recordManager.js    # 课后记录 & 历史列表
│   └── export.js           # 导出预览 & 图片生成
├── lib/
│   └── html2canvas.min.js  # 图片导出库（可选）
└── README.md
```

## 🖼️ 导出图片（可选）

如需将导出内容保存为图片：

1. 下载 [html2canvas](https://html2canvas.hertzen.com/) 放到 `lib/` 目录
2. 在 `index.html` 中取消注释 html2canvas 的 script 标签：
   ```html
   <script src="lib/html2canvas.min.js"></script>
   ```

## 💾 数据说明

- 所有数据保存在浏览器 **LocalStorage** 中
- 清除浏览器数据会导致记录丢失
- 建议定期点击页面底部的「导出备份」按钮保存 JSON 文件
- 换设备时可通过「导入备份」恢复数据

## 📝 使用流程

1. **添加学生** → 点击右上角「+ 添加学生」，填写姓名、年级、科目
2. **课前计划** → 在「课前计划」Tab 中添加课程安排表
3. **课后记录** → 在「课后记录」Tab 中：
   - 填写上课日期
   - 用大纲编辑器记录课程内容（点击 ⊕ 添加子项）
   - 填写表现评价、作业、家长反馈
   - 点击「保存课后记录」
4. **导出分享** → 在「导出预览」Tab 中选择记录，复制文本或保存图片发给学生/家长

## 🛠️ 技术栈

- HTML5 + CSS3 + Vanilla JavaScript
- LocalStorage 数据持久化
- 零依赖（除可选的 html2canvas）

## 📄 License

MIT
