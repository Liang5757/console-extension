# Console Extension

智能 console.log 插入工具，支持智能变量提取和丰富的配置选项。

## 功能特性

### 智能变量提取
- 自动提取普通变量声明：`const/let/var`
- 支持对象解构：`const { name, age } = user`
- 支持数组解构：`const [first, second] = array`
- 提取 if 语句中的变量：`if (a && b || c)`
- 保留操作符：`!flag`, `!!value`, `Boolean(x)`
- 自动去重

### 快捷键
- Windows/Linux: `Ctrl + Shift + L`
- macOS: `Cmd + Shift + L`

### 使用方式
1. **选中变量**后按快捷键，自动插入 console.log
2. **多选变量**（按住 Ctrl/Cmd），批量插入
3. **不选中**按快捷键，插入可编辑的 snippet 模板

## 配置选项

打开 VS Code 设置，搜索 `consoleExtension` 可配置以下选项：

### 基础配置

#### `consoleExtension.prefix`
- 类型: `string`
- 默认值: `[debug]`
- 说明: 日志前缀，用于标识由插件插入的日志，以便于扫描和管理

#### `consoleExtension.quote`
- 类型: `string`
- 可选值: `'` | `"` | `` ` ``
- 默认值: `'`
- 说明: 字符串引号样式

#### `consoleExtension.semicolon`
- 类型: `boolean`
- 默认值: `true`
- 说明: 是否在语句末尾添加分号

#### `consoleExtension.enableTreeView`
- 类型: `boolean`
- 默认值: `true`
- 说明: 是否启用侧边栏树视图，显示所有插入的 console.log 语句

### 上下文信息

#### `consoleExtension.insertFileName`
- 类型: `boolean`
- 默认值: `false`
- 说明: 是否插入文件名（如果文件名为 index，则显示相对路径）
- 示例: `console.log('[debug] app.ts userName:', userName);`
- 示例（index 文件）: `console.log('[debug] src/utils/index.ts userName:', userName);`

#### `consoleExtension.insertLineNumber`
- 类型: `boolean`
- 默认值: `false`
- 说明: 是否插入当前行号
- 示例: `console.log('[debug] L42 userName:', userName);`

#### `consoleExtension.insertEnclosingClass`
- 类型: `boolean`
- 默认值: `false`
- 说明: 是否包含所在类名
- 示例: `console.log('[debug] UserService userName:', userName);`

#### `consoleExtension.insertEnclosingFunction`
- 类型: `boolean`
- 默认值: `false`
- 说明: 是否包含所在函数名
- 示例: `console.log('[debug] getUserData() userName:', userName);`

## 配置示例

### 示例 1：基础配置
```json
{
  "consoleExtension.quote": "'",
  "consoleExtension.semicolon": true,
  "consoleExtension.prefix": "[debug]"
}
```
输出：
```javascript
console.log('[debug] userName:', userName);
```

### 示例 2：包含文件名、行号和函数信息
```json
{
  "consoleExtension.insertFileName": true,
  "consoleExtension.insertLineNumber": true,
  "consoleExtension.insertEnclosingFunction": true,
  "consoleExtension.prefix": "[debug]"
}
```
输出：
```javascript
console.log('[debug] app.ts L42 getUserData() userName:', userName);
```

### 示例 3：包含类名和函数名
```json
{
  "consoleExtension.insertEnclosingClass": true,
  "consoleExtension.insertEnclosingFunction": true,
  "consoleExtension.prefix": "[debug]"
}
```
输出（在类的方法中）：
```javascript
console.log('[debug] UserService.getUserData() userName:', userName);
```

### 示例 4：自定义前缀
```json
{
  "consoleExtension.prefix": "🔍"
}
```
输出：
```javascript
console.log('🔍 userName:', userName);
```

### 示例 5：完整配置
```json
{
  "consoleExtension.quote": "\"",
  "consoleExtension.semicolon": false,
  "consoleExtension.insertFileName": true,
  "consoleExtension.insertLineNumber": true,
  "consoleExtension.insertEnclosingFunction": true,
  "consoleExtension.prefix": "[LOG]",
  "consoleExtension.enableTreeView": true
}
```
输出：
```javascript
console.log("[LOG] app.ts L42 getUserData() userName:", userName)
```

## 侧边栏功能

启用 `consoleExtension.enableTreeView` 后（默认启用），扩展会在 Explorer 侧边栏中显示"Console Logs"视图：

### 功能
- **自动追踪**：自动识别和显示所有由该插件插入的 console.log 语句
- **文件组织**：按文件组织日志，展示清晰的层级结构
- **快速导航**：点击日志项目可跳转到对应代码位置
- **删除日志**：右键删除单个日志或批量删除所有日志
- **刷新列表**：手动刷新日志列表以同步最新状态
- **撤销支持**：删除后按 Ctrl+Z/Cmd+Z 撤销，日志自动恢复

### 使用场景
在调试过程中，侧边栏提供了一个统一的界面来管理所有的调试日志，让你可以：
- 快速找到和定位所有调试代码
- 调试完成后一键清除所有调试日志
- 追踪代码中的日志分布

## 使用场景

### 场景 1：调试对象解构
```javascript
const { name, age } = user;
// 选中上面一行，按快捷键（Ctrl+Shift+L 或 Cmd+Shift+L）
// 自动插入：
console.log('[debug] name:', name);
console.log('[debug] age:', age);
```

### 场景 2：调试条件语句
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

### 场景 3：多行多个变量
```javascript
const userName = 'Alice';
const userAge = 25;
const userRole = 'admin';
// 按住 Ctrl/Cmd 多选这三行，按快捷键
// 自动插入：
console.log('[debug] userName:', userName);
console.log('[debug] userAge:', userAge);
console.log('[debug] userRole:', userRole);
```

### 场景 4：快速插入模板
```javascript
// 不选中任何内容，直接按快捷键
// 插入 snippet 模板，可直接输入变量名
console.log('[debug] variable:', variable);
//           ^^^^^^^^ ^^^^^^^^
//           光标会在这里，可以直接编辑
```

### 场景 5：使用侧边栏管理日志
```javascript
// 启用 enableTreeView 后，所有插入的 console.log 会显示在侧边栏
// 可以：
// - 点击跳转到对应的日志位置
// - 右键删除单个日志
// - 点击刷新按钮更新日志列表
// - 使用"清除全部日志"删除所有日志

class UserService {
  getUserData() {
    const userName = 'Bob';
    // 侧边栏会自动显示下面这行的日志
    console.log('[debug] UserService.getUserData() userName:', userName);
  }
}
```

## 项目结构

```
src/
├── extension.ts              # 扩展入口、生命周期管理
├── commands/                 # 命令处理
│   ├── insertConsoleLog.ts   # 插入日志命令
│   ├── goToLog.ts            # 跳转到日志命令
│   ├── removeLog.ts          # 删除日志命令
│   ├── clearAllLogs.ts       # 清除全部日志命令
│   ├── refreshLogs.ts        # 刷新日志命令
│   └── index.ts              # 导出所有命令
├── types/                    # 类型定义
│   ├── index.ts
│   └── consoleLogItem.ts     # 日志项目接口
├── views/                    # UI 组件
│   ├── consoleLogTreeProvider.ts  # 树视图数据提供者
│   ├── consoleLogTreeItem.ts      # 树项目渲染
│   └── index.ts
└── utils/
    ├── variableExtractor.ts       # 变量提取逻辑
    ├── templateManager.ts         # 配置和日志构建
    ├── consoleInserter.ts         # 日志插入逻辑
    ├── consoleLogScanner.ts       # 日志扫描和识别
    └── consoleLogTracker.ts       # 日志追踪和状态管理
```

## 测试

项目包含 49 个单元测试，覆盖所有核心功能：

```bash
npm test
```

## 开发

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 监听模式
npm run watch

# 运行测试
npm test

# 调试
按 F5 启动扩展开发宿主
```

## License

MIT
