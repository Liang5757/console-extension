# Console Extension

[![Version](https://img.shields.io/visual-studio-marketplace/v/Liang5757.console-extension?color=blue&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=Liang5757.console-extension)
[![License](https://img.shields.io/github/license/Liang5757/console-extension?color=green)](https://github.com/Liang5757/console-extension/blob/master/LICENSE)

## 简介

Console Extension 是一款智能 `console.log` 插入工具，能够**自动提取变量名**（支持解构、条件语句等复杂场景），**一键插入调试日志**，内置侧边栏视图统一管理所有日志，调试完成后一键清除。

**核心优势**：告别手动输入变量名，自动提取、保留操作符（`!flag`、`!!value`）、支持成员访问（`user?.name`）、配置灵活（文件名/行号/函数名可选）。

---

## 安装指南

从 VSCode 扩展市场搜索 `console extension` 安装

## 快速开始

### 1. 使用快捷键（推荐）

| 操作系统 | 快捷键 |
|---------|--------|
| Windows/Linux | `Ctrl + Shift + L` |
| macOS | `Cmd + Shift + L` |

**使用方式**：
- **选中变量**后按快捷键 → 自动插入 `console.log`
- **不选中任何内容**按快捷键 → 提取当前行的变量插入 `console.log`

### 2. 通过命令面板调用

按 `Ctrl+Shift+P` / `Cmd+Shift+P` 打开命令面板，输入：

```
Insert Console Log
```

### 3. 自定义快捷键

在 `keybindings.json` 中修改（文件 → 首选项 → 键盘快捷方式）：

```json
{
  "key": "ctrl+alt+l",  // 自定义快捷键
  "command": "console-extension.insertConsoleLog",
  "when": "editorTextFocus"
}
```

### 4. 核心配置项

在 `settings.json` 中修改（文件 → 首选项 → 设置 → 搜索 `consoleExtension`）：

```json
{
  "consoleExtension.prefix": "[debug]",             // 日志前缀
  "consoleExtension.quote": "'",                    // 引号样式：' | " | `
  "consoleExtension.semicolon": true,               // 是否添加分号
  "consoleExtension.insertFileName": false,         // 是否插入文件名
  "consoleExtension.insertLineNumber": false,       // 是否插入行号
  "consoleExtension.insertEnclosingFunction": true, // 是否插入函数名
  "consoleExtension.enableTreeView": true           // 是否启用侧边栏视图
}
```

---

## 核心功能

### 1. 智能变量提取

- **普通变量声明**：自动提取 `const/let/var` 声明的变量
- **对象解构**：支持 `const { name, age } = user` 自动提取多个变量
- **数组解构**：支持 `const [first, second] = array`
- **条件语句**：从 `if (a && b || c)` 中提取所有变量
- **保留操作符**：自动保留 `!flag`、`!!value`、`Boolean(x)` 等
- **成员访问**：支持 `user.name`、`obj?.prop`、`arr[0]` 等
- **自动去重**：多次选中同一变量时自动去重

> 使用场景：在复杂条件或多变量解构时，无需手动输入，选中后一键生成所有 `console.log`

### 2. 多选批量插入

- 按住 `Ctrl/Cmd` 多选多行代码，按快捷键批量插入日志

> 使用场景：同时调试多个变量时，快速生成所有调试代码

### 3. 丰富的上下文信息

| 配置项 | 默认值 | 说明 | 输出示例 |
|--------|--------|------|----------|
| `prefix` | `[debug]` | 日志前缀，便于过滤和清理 | `[debug] userName:` |
| `insertFileName` | `false` | 插入文件名（index 文件显示相对路径） | `app.ts userName:` |
| `insertLineNumber` | `false` | 插入当前行号 | `L42 userName:` |
| `insertEnclosingClass` | `false` | 插入所在类名 | `UserService userName:` |
| `insertEnclosingFunction` | `true` | 插入所在函数名 | `getUserData() userName:` |

> 使用场景：在大型项目中快速定位日志来源，无需手动添加上下文信息

### 4. 侧边栏统一管理

启用 `enableTreeView` 后（默认启用），在 Explorer 侧边栏显示 **Console Logs** 视图：

- **自动追踪**：识别所有由插件插入的 `console.log` 语句
- **按文件组织**：清晰的层级结构展示
- **快速跳转**：点击日志项跳转到代码位置
- **一键清除**：调试完成后批量删除所有日志
- **撤销支持**：删除后可通过 `Ctrl+Z` / `Cmd+Z` 撤销

> 使用场景：项目中有大量调试日志时，统一管理和清理，避免遗留在代码中

### 5. 灵活的样式配置

| 配置项 | 可选值 | 默认值 | 说明 |
|--------|--------|--------|------|
| `quote` | `'` / `"` / `` ` `` | `'` | 字符串引号样式 |
| `semicolon` | `true` / `false` | `true` | 是否添加分号 |

> 使用场景：适配不同团队的代码规范（如 StandardJS 不使用分号）

---

## 截图与演示

### 功能演示

<!-- 预留：插件核心界面截图 -->
<!-- 建议添加 GIF 演示：选中变量 → 按快捷键 → 自动插入日志 -->

![插件核心界面截图](https://via.placeholder.com/800x450?text=Console+Extension+Demo)

### 侧边栏视图

<!-- 预留：侧边栏显示日志列表的截图 -->

![侧边栏视图](https://via.placeholder.com/300x500?text=Sidebar+Tree+View)

---

## 使用示例

### 示例 1：调试对象解构

```javascript
const { name, age, role } = user;
// 选中上面一行，按 Ctrl+Shift+L / Cmd+Shift+L
// 自动插入：
console.log('[debug] name:', name);
console.log('[debug] age:', age);
console.log('[debug] role:', role);
```

### 示例 2：调试复杂条件

```javascript
if (!isValid && hasPermission || isAdmin) {
  // ...
}
// 选中 if 语句那一行，按快捷键
// 自动插入：
console.log('[debug] !isValid:', !isValid);
console.log('[debug] hasPermission:', hasPermission);
console.log('[debug] isAdmin:', isAdmin);
```

### 示例 3：包含文件名和行号

配置：

```json
{
  "consoleExtension.insertFileName": true,
  "consoleExtension.insertLineNumber": true,
  "consoleExtension.insertEnclosingFunction": true
}
```

输出：

```javascript
console.log('[debug] app.ts L42 getUserData() userName:', userName);
```

### 示例 4：自定义前缀

配置：

```json
{
  "consoleExtension.prefix": "🔍"
}
```

输出：

```javascript
console.log('🔍 userName:', userName);
```

---

## 兼容性

| 项目 | 要求 |
|------|------|
| **VSCode 版本** | ≥ 1.22.0 |
| **操作系统** | Windows / macOS / Linux |
| **支持语言** | JavaScript / TypeScript（扩展已针对这两种语言优化） |

> **注意**：虽然插件主要为 JavaScript/TypeScript 设计，但也可以在其他支持 `console.log` 的语言中使用基础功能。

---

## 常见问题（FAQ）

### 1. 为什么按快捷键后没有反应？

**可能原因**：
- 快捷键冲突：检查 VSCode 键盘快捷方式设置（文件 → 首选项 → 键盘快捷方式），搜索 `console-extension.insertConsoleLog`
- 编辑器未获得焦点：确保光标在代码编辑区域内

**解决方案**：重新配置快捷键或通过命令面板调用（`Ctrl+Shift+P` → `Insert Console Log`）

### 2. 如何一键清除所有调试日志？

**方法 1**：在侧边栏 **Console Logs** 视图中，点击顶部的 **清除全部日志** 按钮（垃圾桶图标）
**方法 2**：通过命令面板（`Ctrl+Shift+P`），输入 `Clear All Console Logs`

> 提示：删除后可通过 `Ctrl+Z` / `Cmd+Z` 撤销

### 3. 如何禁用侧边栏视图？

在 `settings.json` 中设置：

```json
{
  "consoleExtension.enableTreeView": false
}
```

保存后重新加载窗口（`Ctrl+Shift+P` → `Reload Window`）

### 4. 变量提取不准确怎么办？

如果自动提取的变量不符合预期，可以：
- 手动选中具体的变量名再按快捷键
- 不选中任何内容按快捷键，使用 snippet 模板手动输入
- 在 [GitHub Issues](https://github.com/Liang5757/console-extension/issues) 中反馈问题（附上代码示例）

---

## 贡献指南

欢迎提交 Issue 和 Pull Request！以下是参与贡献的步骤：

### 本地调试插件

1. **克隆仓库**：

```bash
git clone https://github.com/Liang5757/console-extension.git
cd console-extension
```

2. **安装依赖**：

```bash
npm install
```

3. **编译代码**：

```bash
npm run compile
```

或启用监听模式（自动编译）：

```bash
npm run watch
```

4. **调试运行**：

按 `F5` 启动扩展开发宿主（Extension Development Host），在新窗口中测试插件功能

5. **运行测试**：

```bash
npm test
```

> 项目包含 49 个单元测试，覆盖所有核心功能

### 提交 Pull Request

1. Fork 本仓库并创建新分支：`git checkout -b feature/your-feature`
2. 提交代码：`git commit -m "feat: add your feature"`
3. 推送到远程分支：`git push origin feature/your-feature`
4. 在 GitHub 上创建 Pull Request

**代码规范**：
- 遵循 TypeScript + ESLint 规范
- 新增功能需补充单元测试
- 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)

---

## 项目结构

```
src/
├── extension.ts              # 扩展入口、生命周期管理
├── commands/                 # 命令处理
│   ├── insertConsoleLog.ts   # 插入日志命令
│   ├── goToLog.ts            # 跳转到日志命令
│   ├── removeLog.ts          # 删除日志命令
│   ├── clearAllLogs.ts       # 清除全部日志命令
│   └── refreshLogs.ts        # 刷新日志命令
├── types/                    # 类型定义
│   └── consoleLogItem.ts     # 日志项目接口
├── views/                    # UI 组件
│   ├── consoleLogTreeProvider.ts  # 树视图数据提供者
│   └── consoleLogTreeItem.ts      # 树项目渲染
└── utils/
    ├── variableExtractor.ts       # 变量提取逻辑（基于 acorn AST）
    ├── templateManager.ts         # 配置和日志构建
    ├── consoleInserter.ts         # 日志插入逻辑
    ├── consoleLogScanner.ts       # 日志扫描和识别
    └── consoleLogTracker.ts       # 日志追踪和状态管理
```

---

## 许可证

[MIT License](LICENSE)

Copyright (c) 2024 Liang5757

---

## 反馈与支持

- **问题反馈**：[GitHub Issues](https://github.com/Liang5757/console-extension/issues)
- **功能建议**：欢迎在 Issues 中讨论
- **Star 支持**：如果这个插件帮到了你，请在 [GitHub](https://github.com/Liang5757/console-extension) 给个 ⭐

---

**Made with ❤️ by developers, for developers**
