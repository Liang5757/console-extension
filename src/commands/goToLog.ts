import * as vscode from 'vscode';
import { ConsoleLogItem } from '../types/consoleLogItem';

/**
 * 注册跳转到 log 所在位置的命令
 */
export function registerGoToLogCommand(
  context: vscode.ExtensionContext
): vscode.Disposable {
  return vscode.commands.registerCommand(
    'console-extension.goToLog',
    (item: ConsoleLogItem) => {
      const uri = vscode.Uri.file(item.filePath);
      vscode.workspace.openTextDocument(uri).then((doc) => {
        vscode.window.showTextDocument(doc).then((editor) => {
          const line = doc.lineAt(item.line);
          const endPosition = new vscode.Position(item.line, line.text.length);
          editor.selection = new vscode.Selection(endPosition, endPosition);
          editor.revealRange(new vscode.Range(endPosition, endPosition));
        });
      });
    }
  );
}
