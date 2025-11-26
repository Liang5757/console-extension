import * as vscode from "vscode";
import * as path from "path";

/**
 * 配置接口
 */
export interface LogConfig {
  prefix: string;
  insertLineNumber: boolean;
  insertFileName: boolean;
  quote: "'" | '"' | "`";
  semicolon: boolean;
  insertEnclosingClass: boolean;
  insertEnclosingFunction: boolean;
}

/**
 * 获取所有配置
 * @returns 配置对象
 */
export function getConfig(): LogConfig {
  const config = vscode.workspace.getConfiguration("consoleExtension");

  return {
    prefix: config.get<string>("prefix", "[debug]"),
    insertLineNumber: config.get<boolean>("insertLineNumber", false),
    insertFileName: config.get<boolean>("insertFileName", false),
    quote: config.get<"'" | '"' | "`">("quote", "'"),
    semicolon: config.get<boolean>("semicolon", true),
    insertEnclosingClass: config.get<boolean>("insertEnclosingClass", false),
    insertEnclosingFunction: config.get<boolean>(
      "insertEnclosingFunction",
      false
    ),
  };
}

/**
 * 构建日志语句
 * @param variableName 变量名
 * @param editor 编辑器实例
 * @param line 行号
 * @returns 构建好的日志语句
 */
export function buildLogStatement(
  variableName: string,
  editor?: vscode.TextEditor,
  line?: number
): string {
  const config = getConfig();

  // 根据配置动态构建
  let logStatement = "console.log(";

  // 构建消息部分
  const messageParts: string[] = [];

  // 添加前缀
  messageParts.push(config.prefix);

  // 1. 添加文件名或相对路径
  if (config.insertFileName && editor) {
    const fileName = path.basename(editor.document.fileName, path.extname(editor.document.fileName));

    // 如果文件名是 index，使用相对路径
    if (fileName.toLowerCase() === 'index') {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
      if (workspaceFolder) {
        const relativePath = path.relative(workspaceFolder.uri.fsPath, editor.document.fileName);
        messageParts.push(relativePath.replace(/\\/g, '/'));
      } else {
        messageParts.push(path.basename(editor.document.fileName));
      }
    } else {
      messageParts.push(path.basename(editor.document.fileName));
    }
  }

  // 2. 添加行号
  if (config.insertLineNumber && line !== undefined) {
    messageParts.push(`L${line + 1}`);
  }

  // 3. 添加类名.函数名（如果都存在）或单独添加
  const className = config.insertEnclosingClass && editor && line !== undefined
    ? findEnclosingClass(editor, line)
    : null;
  const functionName = config.insertEnclosingFunction && editor && line !== undefined
    ? findEnclosingFunction(editor, line)
    : null;

  if (className && functionName) {
    messageParts.push(`${className}.${functionName}()`);
  } else if (className) {
    messageParts.push(className);
  } else if (functionName) {
    messageParts.push(`${functionName}()`);
  }

  // 4. 添加变量名
  messageParts.push(`${variableName}:`);

  // 组合消息
  const message = messageParts.join(" ");
  const quote = config.quote;

  logStatement += `${quote}${message}${quote}, ${variableName}`;
  logStatement += ")";

  // 添加分号
  if (config.semicolon) {
    logStatement += ";";
  }

  return logStatement;
}

/**
 * 将模板应用到变量名
 * @param template 模板字符串
 * @param variableName 变量名
 * @returns 应用后的字符串
 */
export function applyTemplate(template: string, variableName: string): string {
  return template.replace(/\{variable\}/g, variableName);
}

/**
 * 将模板转换为 VS Code snippet 格式
 * @param template 模板字符串
 * @returns snippet 格式的模板
 */
export function templateToSnippet(template: string): string {
  // 将 {variable} 替换为 snippet 占位符 ${1:variable}
  return template.replace(/\{variable\}/g, "${1:variable}");
}

/**
 * 查找包围的类名
 * @param editor 编辑器实例
 * @param line 行号
 * @returns 类名或 null
 */
function findEnclosingClass(
  editor: vscode.TextEditor,
  line: number
): string | null {
  const document = editor.document;
  const classPattern = /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/;

  // 向上查找类定义
  for (let i = line; i >= 0; i--) {
    const lineText = document.lineAt(i).text;
    const match = classPattern.exec(lineText);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * 查找包围的函数名
 * @param editor 编辑器实例
 * @param line 行号
 * @returns 函数名或 null
 */
function findEnclosingFunction(
  editor: vscode.TextEditor,
  line: number
): string | null {
  const document = editor.document;
  const functionPattern =
    /(?:function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)|([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[=:]\s*(?:function|\([^)]*\)\s*=>))/;

  // 向上查找函数定义
  for (let i = line; i >= 0; i--) {
    const lineText = document.lineAt(i).text;
    const match = functionPattern.exec(lineText);
    if (match) {
      return match[1] || match[2];
    }
  }

  return null;
}
