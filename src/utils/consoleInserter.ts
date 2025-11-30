import * as vscode from "vscode";
import * as path from "path";
import { SelectedVariable } from "../types";
import {
  buildLogStatement,
  getConfig,
  findEnclosingClass,
} from "./templateManager";
import { ConsoleLogItem } from "../types/consoleLogItem";
import { ConsoleLogTracker } from "./consoleLogTracker";
import { extractContextName } from "./contextExtractor";

let tracker: ConsoleLogTracker | undefined;

export function setTracker(logTracker: ConsoleLogTracker): void {
  tracker = logTracker;
}

/**
 * 构建上下文信息部分（文件名、类名、函数名、行号）
 * @param editor VS Code 编辑器实例
 * @param line 行号
 * @returns 上下文信息的字符串数组
 */
function buildContextMessageParts(
  editor: vscode.TextEditor,
  line: number
): string[] {
  const config = getConfig();
  const messageParts: string[] = [];

  // 添加前缀
  messageParts.push(config.prefix);

  // 添加文件名或相对路径
  if (config.insertFileName) {
    const fileName = path.basename(
      editor.document.fileName,
      path.extname(editor.document.fileName)
    );
    if (fileName.toLowerCase() === "index") {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(
        editor.document.uri
      );
      if (workspaceFolder) {
        const relativePath = path.relative(
          workspaceFolder.uri.fsPath,
          editor.document.fileName
        );
        messageParts.push(relativePath.replace(/\\/g, "/"));
      } else {
        messageParts.push(path.basename(editor.document.fileName));
      }
    } else {
      messageParts.push(path.basename(editor.document.fileName));
    }
  }

  // 添加类名.函数名（如果都存在）或单独添加
  const className = config.insertEnclosingClass
    ? findEnclosingClass(editor, line)
    : null;
  const functionName = config.insertEnclosingFunction
    ? extractContextName(editor, line) || null
    : null;

  if (className && functionName) {
    messageParts.push(`${className}.${functionName}()`);
  } else if (className) {
    messageParts.push(className);
  } else if (functionName) {
    messageParts.push(`${functionName}()`);
  }

  // 添加行号（在函数名后面）
  if (config.insertLineNumber) {
    messageParts.push(`line ${line + 1}`);
  }

  return messageParts;
}

/**
 * 插入 console.log 语句（有选中变量的情况）
 * @param editor VS Code 编辑器实例
 * @param selectedVariables 选中的变量信息数组
 */
export function insertConsoleLogForVariables(
  editor: vscode.TextEditor,
  selectedVariables: SelectedVariable[]
): void {
  // 按行号排序，确保输出顺序正确
  const sortedVariables = [...selectedVariables].sort(
    (a, b) => a.line - b.line
  );

  // 找到最后一个选中变量所在的行
  const lastSelection = sortedVariables[sortedVariables.length - 1];
  const insertLine = lastSelection.line;
  const indent = lastSelection.indent;

  // 生成所有 console.log 语句（按行号顺序）
  const logStatements = sortedVariables.map((item) => {
    const statement = buildLogStatement(item.text, editor, item.line);
    return `${indent}${statement}`;
  });

  const consoleStatements = logStatements.join("\n");

  editor
    .edit((editBuilder) => {
      const position = new vscode.Position(insertLine + 1, 0);
      editBuilder.insert(position, consoleStatements + "\n");
    })
    .then((success) => {
      if (success && tracker) {
        const filePath = editor.document.uri.fsPath;
        const actualInsertLine = insertLine + 1;

        // 将该文件添加到追踪列表
        tracker!.trackFile(filePath);

        sortedVariables.forEach((item, index) => {
          // 提取函数名或类名
          const contextName = extractContextName(editor, actualInsertLine + index);

          const logItem: ConsoleLogItem = {
            filePath,
            line: actualInsertLine + index,
            variableName: item.text,
            logStatement: logStatements[index],
            contextName,
          };
          // tracker!.addConsoleLog(logItem);
        });
      }
    });
}

/**
 * 插入 console.log snippet 模板（无选中变量或变量提取失败的情况）
 * @param editor VS Code 编辑器实例
 * @param selectedVariables 可选的选中变量数组（当有 placeholder 时使用）
 */
export function insertConsoleLogSnippet(
  editor: vscode.TextEditor,
  selectedVariables?: SelectedVariable[]
): void {
  const config = getConfig();

  // 检查是否有 placeholder（变量提取失败）
  const hasPlaceholder = selectedVariables && selectedVariables.some((v) => v.isPlaceholder);

  if (hasPlaceholder) {
    // 如果变量提取失败，使用 snippet 让用户可以输入变量
    const quote = config.quote;

    // 按行号排序
    const sortedVariables = [...selectedVariables].sort((a, b) => a.line - b.line);
    const lastSelection = sortedVariables[sortedVariables.length - 1];
    const insertLine = lastSelection.line;

    // 生成 snippet，每个 placeholder 使用相同的变量引用
    let snippetText = "";
    sortedVariables.forEach((item) => {
      // 使用 ${1} 作为占位符，出现在消息和变量两个位置
      // 这样用户输入一次后，两个位置会同步
      const messageParts = buildContextMessageParts(editor, item.line);
      messageParts.push("${1}:");
      const message = messageParts.join(" ");

      let logStatement = `${item.indent}console.log(${quote}${message}${quote}, \${1})`;
      if (config.semicolon) {
        logStatement += ";";
      }
      snippetText += logStatement + "\n";
    });

    const snippetString = new vscode.SnippetString(snippetText);
    const position = new vscode.Position(insertLine + 1, 0);

    editor.insertSnippet(snippetString, position).then((success) => {
      if (success && tracker) {
        const filePath = editor.document.uri.fsPath;
        tracker.trackFile(filePath);
      }
    });
  } else {
    // 正常情况，使用 snippet 占位符
    let insertLine: number;
    let indent: string;

    if (selectedVariables && selectedVariables.length > 0) {
      const lastSelection = selectedVariables[selectedVariables.length - 1];
      insertLine = lastSelection.line;
      indent = lastSelection.indent;
    } else {
      insertLine = editor.selection.active.line;
      const lineText = editor.document.lineAt(insertLine).text;
      indent = lineText.match(/^(\s*)/)?.[1] || "";
    }

    const messageParts = buildContextMessageParts(editor, insertLine);
    messageParts.push("${1:variable}:");

    const message = messageParts.join(" ");
    const quote = config.quote;
    let logStatement = `${indent}console.log(${quote}${message}${quote}, \${1:variable})`;

    if (config.semicolon) {
      logStatement += ";";
    }

    const snippetString = new vscode.SnippetString(logStatement + "\n");
    const position = new vscode.Position(insertLine + 1, 0);
    editor.insertSnippet(snippetString, position);
  }
}
