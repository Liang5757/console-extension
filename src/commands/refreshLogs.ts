import * as vscode from 'vscode';
import { ConsoleLogTreeProvider } from '../views/consoleLogTreeProvider';

/**
 * 注册刷新树视图的命令
 */
export function registerRefreshLogsCommand(
  context: vscode.ExtensionContext,
  treeProvider: ConsoleLogTreeProvider
): vscode.Disposable {
  return vscode.commands.registerCommand(
    'console-extension.refreshLogs',
    () => {
      treeProvider.refresh();
    }
  );
}
