import * as vscode from 'vscode';
import { ConsoleLogItem } from '../types/consoleLogItem';
import { ConsoleLogTracker } from '../utils/consoleLogTracker';

/**
 * 注册删除单个 log 的命令
 */
export function registerRemoveLogCommand(
  context: vscode.ExtensionContext,
  tracker: ConsoleLogTracker
): vscode.Disposable {
  return vscode.commands.registerCommand(
    'console-extension.removeLog',
    async (treeItem: any) => {
      // 从树节点中获取 ConsoleLogItem
      const item: ConsoleLogItem = treeItem.consoleLogItem;

      if (!item) {
        vscode.window.showErrorMessage(
          'Unable to identify the console log item'
        );
        return;
      }

      const uri = vscode.Uri.file(item.filePath);
      const doc = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(doc);

      await editor.edit((editBuilder) => {
        const range = new vscode.Range(
          new vscode.Position(item.line, 0),
          new vscode.Position(item.line + 1, 0)
        );
        editBuilder.delete(range);
      });

      tracker.removeConsoleLog(item);
    }
  );
}
