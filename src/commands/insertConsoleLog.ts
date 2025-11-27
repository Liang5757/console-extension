import * as vscode from 'vscode';
import { collectSelectedVariables } from '../utils/variableExtractor';
import {
  insertConsoleLogForVariables,
  insertConsoleLogSnippet,
} from '../utils/consoleInserter';

/**
 * 注册插入 console.log 命令
 */
export function registerInsertConsoleLogCommand(
  context: vscode.ExtensionContext
): vscode.Disposable {
  return vscode.commands.registerCommand(
    'console-extension.insertConsoleLog',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const selectedVariables = collectSelectedVariables(editor);

      if (selectedVariables.length > 0) {
        // 检查是否有占位符（变量提取失败）
        const hasPlaceholder = selectedVariables.some((v) => v.isPlaceholder);

        if (hasPlaceholder) {
          // 有占位符的情况，使用 snippet 方式让用户手动输入
          insertConsoleLogSnippet(editor, selectedVariables);
        } else {
          // 有选中变量的情况
          insertConsoleLogForVariables(editor, selectedVariables);
        }
      } else {
        // 无选中变量的情况，插入 snippet 模板
        insertConsoleLogSnippet(editor);
      }
    }
  );
}
