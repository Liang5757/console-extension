import * as vscode from 'vscode';
import { ConsoleLogItem } from '../types/consoleLogItem';

/**
 * 树视图节点
 */
export class ConsoleLogTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly consoleLogItem?: ConsoleLogItem
  ) {
    super(label, collapsibleState);

    if (consoleLogItem) {
      // 单个 console.log 条目
      this.tooltip = `${consoleLogItem.filePath}:${consoleLogItem.line + 1}`;
      this.description = `L${consoleLogItem.line + 1}`;
      // 点击时跳转到 log
      this.command = {
        command: 'console-extension.goToLog',
        title: 'Go to Log',
        arguments: [consoleLogItem]
      };
      this.contextValue = 'consoleLogItem';
      this.iconPath = new vscode.ThemeIcon('debug-console');
      // 存储 consoleLogItem 供右键菜单使用
      this.consoleLogItem = consoleLogItem;
    } else {
      // 文件节点
      this.contextValue = 'consoleLogFile';
      this.iconPath = new vscode.ThemeIcon('file-code');
    }
  }
}
