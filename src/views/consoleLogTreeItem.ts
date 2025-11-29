import * as vscode from "vscode";
import { ConsoleLogItem } from "../types/consoleLogItem";

/**
 * 树视图节点
 */
export class ConsoleLogTreeItem extends vscode.TreeItem {
  constructor(
    labelText: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly consoleLogItem?: ConsoleLogItem,
    resourceUri?: vscode.Uri
  ) {
    super(labelText, collapsibleState);

    if (consoleLogItem) {
      // 单个 console.log 条目
      this.tooltip = `${consoleLogItem.filePath}:${consoleLogItem.line + 1}`;
      this.description = `L${consoleLogItem.line + 1}`;
      // 点击时跳转到 log
      this.command = {
        command: "console-extension.goToLog",
        title: "Go to Log",
        arguments: [consoleLogItem],
      };
      this.contextValue = "consoleLogItem";
      this.iconPath = new vscode.ThemeIcon("debug-console");
      // 存储 consoleLogItem 供右键菜单使用
      this.consoleLogItem = consoleLogItem;
    } else {
      // 文件节点 - 需要同时设置 iconPath 和 resourceUri
      // iconPath 设置为 ThemeIcon.File 告诉 VS Code 这是文件而不是文件夹
      // resourceUri 让 VS Code 根据文件扩展名选择对应的文件图标
      this.contextValue = "consoleLogFile";
      if (resourceUri) {
        this.resourceUri = resourceUri;
        this.iconPath = vscode.ThemeIcon.File;
      }
    }
  }
}
