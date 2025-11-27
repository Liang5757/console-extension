# Placeholder Feature（占位符功能）

## 功能概述

当用户选中文本但变量提取失败时，扩展现在会生成一个包含用户配置模板的 `console.log`，并使用 VS Code 的 Snippet 占位符让用户手动输入变量名。

## 工作流程

### 场景1：成功提取变量
```javascript
// 用户选中：const a = 1, b = 2
// 快捷键：Ctrl+Shift+L（或 Cmd+Shift+L）
// 结果：直接插入 console.log
console.log('[debug] a:', a);
console.log('[debug] b:', b);
```

### 场景2：提取失败（新功能）
```javascript
// 用户选中：一些无法解析的代码或表达式
// 快捷键：Ctrl+Shift+L
// 结果：插入 snippet 占位符，光标在变量位置供用户输入
console.log('[debug] variable:',  <光标在这里>)
                                 ╰─ 用户可以直接输入变量名
```

## 实现细节

### 1. 标记占位符变量
在 `SelectedVariable` 接口中添加了 `isPlaceholder` 字段：
```typescript
export interface SelectedVariable {
  text: string;           // 变量名
  line: number;           // 行号
  indent: string;         // 缩进
  isPlaceholder?: boolean; // 是否为占位符（变量提取失败）
}
```

### 2. 修改变量收集逻辑
在 `collectSelectedVariables` 函数中，当提取失败时返回占位符：
```typescript
if (extractedVars.length > 0) {
  // 成功提取：添加变量
} else {
  // 提取失败：添加占位符
  selectedVariables.push({
    text: "",
    line,
    indent,
    isPlaceholder: true
  });
}
```

### 3. 命令处理逻辑
在 `insertConsoleLog` 命令中检测占位符：
```typescript
const hasPlaceholder = selectedVariables.some((v) => v.isPlaceholder);

if (hasPlaceholder) {
  // 使用 snippet 方式（让用户手动输入）
  insertConsoleLogSnippet(editor, selectedVariables);
} else {
  // 直接插入（变量已提取）
  insertConsoleLogForVariables(editor, selectedVariables);
}
```

### 4. Snippet 生成
`insertConsoleLogSnippet` 函数生成包含占位符的 snippet：
```typescript
let snippetTemplate = `console.log(${quote}${message}${quote}, ${1:variable})`;
const snippetString = new vscode.SnippetString(`${indent}${snippetTemplate}\n`);
editor.insertSnippet(snippetString, position);
```

## 用户体验

### 完全自动化（变量提取成功）
1. 选中代码
2. 按 `Ctrl+Shift+L`
3. Console.log 自动插入，无需任何操作

### 半自动化（变量提取失败）
1. 选中代码
2. 按 `Ctrl+Shift+L`
3. Console.log 插入，光标自动在变量位置，用户可以直接输入
4. 支持 VS Code snippet 功能（Tab 跳转到下一个占位符等）

## 占位符默认文本

占位符显示为 `variable`，用户可以：
- 直接开始输入替换它
- 按 `Tab` 键跳转到下一个占位符
- 按 `Esc` 键退出 snippet 模式

## 配置支持

占位符 snippet 遵循用户配置：
- ✓ 前缀（Prefix）
- ✓ 引号风格（Quote Style）
- ✓ 分号（Semicolon）
- ✓ 缩进（自动检测）
- ✓ 文件名、行号、类名、函数名（可选）

## 测试覆盖

新增测试验证：
- ✓ 在提取失败时使用 snippet（带 placeholder）
- ✓ 在多个 placeholder 中保持正确的缩进
- ✓ 所有现有功能保持兼容（49个现有测试全部通过）

## 示例场景

### 场景1：无法识别的表达式
```javascript
// 选中并按 Ctrl+Shift+L：console.log('[debug] variable:', variable);
// 然后用户输入变量名：console.log('[debug] variable:', myResult);
const myResult = someComplexExpression();
```

### 场景2：选中但无变量的代码块
```javascript
// 选中多行代码，虽然提取不到变量，但用户想添加日志
function example() {
  someFunction();
}
// 插入 snippet，用户可以输入：console.log('[debug] variable:', result);
```

## 向后兼容性

- ✓ 完全向后兼容
- ✓ 现有的变量提取逻辑不变
- ✓ 所有现有配置选项继续有效
- ✓ 现有用户不会看到任何破坏性改变
