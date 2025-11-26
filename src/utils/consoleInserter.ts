import * as vscode from "vscode";
import { SelectedVariable } from "../types";
import {
  buildLogStatement,
  getConfig,
} from "./templateManager";
import { ConsoleLogItem } from "../types/consoleLogItem";
import { ConsoleLogTracker } from "./consoleLogTracker";

let tracker: ConsoleLogTracker | undefined;

export function setTracker(logTracker: ConsoleLogTracker): void {
  tracker = logTracker;
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
          const logItem: ConsoleLogItem = {
            filePath,
            line: actualInsertLine + index,
            variableName: item.text,
            logStatement: logStatements[index],
          };
          // tracker!.addConsoleLog(logItem);
        });
      }
    });
}

/**
 * 插入 console.log snippet 模板（无选中变量的情况）
 * @param editor VS Code 编辑器实例
 */
export function insertConsoleLogSnippet(editor: vscode.TextEditor): void {
  const config = getConfig();
  const line = editor.selection.active.line;
  const lineText = editor.document.lineAt(line).text;
  const indent = lineText.match(/^(\s*)/)?.[1] || "";

  // 构建 snippet 模板，根据配置动态构建
  const messageParts: string[] = [];
  messageParts.push(config.prefix);
  messageParts.push("${1:variable}:");

  const message = messageParts.join(" ");
  const quote = config.quote;

  let snippetTemplate = `console.log(${quote}${message}${quote}, \${1:variable})`;

  if (config.semicolon) {
    snippetTemplate += ";";
  }

  const snippetString = new vscode.SnippetString(
    `${indent}${snippetTemplate}\n`
  );

  const position = new vscode.Position(line + 1, 0);
  editor.insertSnippet(snippetString, position);
}
