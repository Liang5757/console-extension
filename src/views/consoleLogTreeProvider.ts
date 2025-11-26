import * as vscode from 'vscode';
import * as path from 'path';
import { ConsoleLogItem } from '../types/consoleLogItem';
import { ConsoleLogTreeItem } from './consoleLogTreeItem';
import { ConsoleLogTracker } from '../utils/consoleLogTracker';

/**
 * Console.log 树视图提供者
 */
export class ConsoleLogTreeProvider implements vscode.TreeDataProvider<ConsoleLogTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ConsoleLogTreeItem | undefined | null | void> =
    new vscode.EventEmitter<ConsoleLogTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ConsoleLogTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor(private tracker: ConsoleLogTracker) {
    // 设置追踪器的变化回调
    this.tracker.setOnChangeCallback(() => this.refresh());
  }

  /**
   * 刷新树视图
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * 获取树节点
   */
  getTreeItem(element: ConsoleLogTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * 获取子节点
   */
  getChildren(element?: ConsoleLogTreeItem): Thenable<ConsoleLogTreeItem[]> {
    if (!element) {
      // 根级别 - 显示文件
      return Promise.resolve(this.getFileNodes());
    } else {
      // 文件级别 - 显示该文件的 console.log
      return Promise.resolve(this.getLogNodes(element));
    }
  }

  /**
   * 获取文件节点
   */
  private getFileNodes(): ConsoleLogTreeItem[] {
    const fileItems: ConsoleLogTreeItem[] = [];
    const filePaths = this.tracker.getAllFilePaths();

    for (const filePath of filePaths) {
      const fileName = path.basename(filePath);
      const relativePath = vscode.workspace.asRelativePath(filePath);

      const treeItem = new ConsoleLogTreeItem(
        fileName,
        vscode.TreeItemCollapsibleState.Expanded,
        undefined
      );
      treeItem.tooltip = relativePath;
      treeItem.resourceUri = vscode.Uri.file(filePath);

      fileItems.push(treeItem);
    }

    return fileItems;
  }

  /**
   * 获取 log 节点
   */
  private getLogNodes(element: ConsoleLogTreeItem): ConsoleLogTreeItem[] {
    const filePath = element.resourceUri?.fsPath;
    if (!filePath) {
      return [];
    }

    const items = this.tracker.getLogsByFile(filePath);
    return items.map(item =>
      new ConsoleLogTreeItem(
        item.variableName || 'console.log',
        vscode.TreeItemCollapsibleState.None,
        item
      )
    );
  }
}
