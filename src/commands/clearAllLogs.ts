import * as vscode from 'vscode';
import { ConsoleLogTracker } from '../utils/consoleLogTracker';

/**
 * 注册清除所有 logs 的命令
 * 不仅从侧边栏移除，也删除代码中的 console.log 语句
 */
export function registerClearAllLogsCommand(
  context: vscode.ExtensionContext,
  tracker: ConsoleLogTracker
): vscode.Disposable {
  return vscode.commands.registerCommand(
    'console-extension.clearAllLogs',
    async () => {
      // 获取所有待删除的 log
      const allLogs = tracker.getAllLogs();

      if (allLogs.length === 0) {
        vscode.window.showInformationMessage('No console logs to clear.');
        return;
      }

      // 按文件分组
      const logsByFile = new Map<string, typeof allLogs>();
      for (const log of allLogs) {
        if (!logsByFile.has(log.filePath)) {
          logsByFile.set(log.filePath, []);
        }
        logsByFile.get(log.filePath)!.push(log);
      }

      // 逐文件删除 console.log
      let deletedCount = 0;
      for (const [filePath, logs] of logsByFile.entries()) {
        try {
          const uri = vscode.Uri.file(filePath);
          const doc = await vscode.workspace.openTextDocument(uri);
          const editor = await vscode.window.showTextDocument(doc);

          // 按行号倒序排序，从后往前删除（避免行号变化影响）
          const sortedLogs = [...logs].sort((a, b) => b.line - a.line);

          await editor.edit((editBuilder) => {
            for (const log of sortedLogs) {
              if (log.line < doc.lineCount) {
                const range = new vscode.Range(
                  new vscode.Position(log.line, 0),
                  new vscode.Position(log.line + 1, 0)
                );
                editBuilder.delete(range);
                deletedCount++;
              }
            }
          });
        } catch (error) {
          console.error(`Failed to delete logs in ${filePath}:`, error);
        }
      }

      // 清除追踪数据
      tracker.clearAllLogs();

      vscode.window.showInformationMessage(
        `Cleared ${deletedCount} console logs from code and tree view.`
      );
    }
  );
}
