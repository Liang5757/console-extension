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
        // 有选中变量的情况
        insertConsoleLogForVariables(editor, selectedVariables);
      } else {
        // 无选中变量的情况，插入 snippet 模板
        insertConsoleLogSnippet(editor);
      }
    }
  );
}
