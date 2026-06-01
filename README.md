# ChatHub Desktop 🚀

[![Electron](https://img.shields.io/badge/Electron-v42.2.0-blue.svg?style=flat-family&logo=electron)](https://www.electronjs.org/)
[![Vite](https://img.shields.io/badge/Vite-v4.5.1-646CFF.svg?style=flat-family&logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-v18.2.0-61DAFB.svg?style=flat-family&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v3.4.0-38B2AC.svg?style=flat-family&logo=tailwindcss)](https://tailwindcss.com/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

**ChatHub Desktop** 是一款专为桌面端设计的、高颜值且极速的 **多 AI 机器人聚合客户端**。通过创新的分栏布局和统一的同步输入终端，它可以让你在同一界面下同时对比、协同和调用全球最主流的 AI 聊天服务。

> [!NOTE]
> 本项目是在开源项目 [ChatHub](https://github.com/chathub-dev/chathub) 的基础上进行二次开发与深度定制而成的。感谢原作者及社区的杰出工作！

---

## ✨ 核心特性

- 🖥️ **All-in-One 多栏并进**
  - 支持 **双栏、三栏、四栏、六宫格** 以及 **图文输入** 等多种灵活布局。
  - 自动适应窗口尺寸，助你在多模型之间进行精确的对比测试和协同办公。

- ⌨️ **同步发送输入框 (Sync Input Bar)**
  - 采用原生的聊天输入框设计，位于页面底部，支持快捷键 `` Ctrl + ` `` 一键唤起或隐藏。
  - **同步广播**：在输入框内输入 prompt 按下 Enter 或点击 Send，消息及附属文件将同步发送至当前所有活动的 AI 机器人。
  - **多文件与图片上传**：支持添加图片与各种类型文档（.txt, .md 等）。图片通过剪贴板自动粘贴注入各个机器人，文档内容会自动格式化并作为 Prompt 拼接发送。

- 🤖 **全面自定义机器人**
  - 支持在设置页面中自由 **添加、编辑、删除** 机器人。
  - 只需要定义名称和 URL 即可轻松接入任何基于网页端的 AI 服务或本地部署服务。
  - **动态 Favicon 获取**：客户端会自动请求并加载各个域名的原厂高画质图标。

- 🔌 **全局网络代理支持**
  - 支持“系统默认代理”与“自定义代理服务器”。
  - 主进程底层拦截，彻底解决部分 AI 平台在网络层面限制的问题。

- 🖱️ **深度原生系统集成**
  - 无缝的 **右键上下文菜单**：支持撤销、重做、剪切、复制、粘贴、全选、复制链接、重新加载页面、以及检查元素（DevTools）。
  - 完美剔除窗口顶部的原生系统菜单栏，提供纯净沉浸的客户端边框体验。
  - 内置已解锁的本地 Premium 特权，尽享所有多栏布局。

---

## 🛠️ 技术栈

- **前端框架**：Vite + React 18 + TS
- **桌面容器**：Electron 42
- **状态管理**：Jotai (原子化状态管理)
- **动效处理**：Framer Motion
- **样式方案**：Tailwind CSS + SCSS
- **打包工具**：Electron Builder

---

## 🚀 快速启动

在本地克隆代码后，请确保你的系统已安装 `Node.js` 和 `Yarn`。

### 1. 安装依赖

```bash
cd chathub-desktop
yarn install
```

### 2. 本地开发调试

启动 Vite 开发服务器和 Electron 主进程：

```bash
yarn dev
```

### 3. 构建打包生产客户端

打包出适配当前操作系统的免安装/安装包程序：

```bash
yarn package
```
打包输出的文件将保存在 `chathub-desktop/release/` 目录下。

---

## 📂 项目结构

```text
myChathub/
├── chathub-desktop/
│   ├── main.cjs             # Electron 主进程 (窗口创建、代理拦截、原生菜单移除等)
│   ├── preload.cjs          # Electron 预加载脚本
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/  # 公用 UI 组件 (SyncInputBox, Sidebar, settings...)
│   │   │   ├── hooks/       # React 自定义 Hook (useChatbots, usePremium...)
│   │   │   ├── pages/       # 主页面组件 (MultiBotChatPanel, SettingPage...)
│   │   │   └── router.tsx   # 路由管理
│   │   ├── services/        # 系统底层服务 (storage, sentry, user-config...)
│   │   └── shim/            # 兼容性 Mock 文件
│   ├── package.json         # 项目配置文件与依赖管理
│   └── vite.config.ts       # Vite 配置文件
└── README.md                # 项目自述文档
```

---

## 🤝 参与贡献

如果您想改进该项目，欢迎参与贡献！请通过以下步骤 Fork 本仓库并提交 Pull Request：

1. **Fork** 本仓库到您的个人 GitHub 账号。
2. 克隆您 Fork 后的仓库到本地，并创建您的特性分支 (`git checkout -b feature/amazing-feature`)。
3. 在本地编写并验证代码，然后提交您的修改 (`git commit -m 'feat: add some amazing feature'`)。
4. 将修改推送到您 Fork 仓库的分支 (`git push origin feature/amazing-feature`)。
5. 在本仓库的 Pull Requests 页面发起一个 **Pull Request**，我们会及时进行 Review 和合并！

---

## 📝 TODO List

以下是本项目目前计划解决和改进的待办事项：

- [ ] **修复 Gemini 笔记本加载错误**：修复打开 Gemini 网页时可能弹出“无法加载您的笔记本”的问题（在分支上fix-gemini-notebook-error(未解决)处理）。
- [ ] **重构 Prompt 提示词库**：重新设计和连接提示词快捷面板（支持 `/` 快捷指令和输入框左侧书本图标的交互）。
- [ ] **支持应用自动更新 (Auto-updater)**：配置发布管道并集成 Electron 自动升级功能。

---

## 📄 开源协议

本项目基于 **GPL v3** 协议开源。详情见 [LICENSE](LICENSE) 文件。
