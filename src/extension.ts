import * as vscode from "vscode";
import { setTracker } from "./utils/consoleInserter";
import { ConsoleLogTreeProvider } from "./views/consoleLogTreeProvider";
import { ConsoleLogTracker } from "./utils/consoleLogTracker";
import {
  registerInsertConsoleLogCommand,
  registerGoToLogCommand,
  registerRemoveLogCommand,
  registerClearAllLogsCommand,
  registerRefreshLogsCommand,
} from "./commands";

let treeViewDisposables: vscode.Disposable[] = [];

export function activate(context: vscode.ExtensionContext) {
  console.log("Console Extension is now active!");

  // 注册插入 console.log 命令（总是注册）
  const insertCommand = registerInsertConsoleLogCommand(context);
  context.subscriptions.push(insertCommand);

  // 初始化树视图
  initializeTreeView(context);

  // 监听配置变化
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("consoleExtension.enableTreeView")) {
        // 清理旧的树视图
        treeViewDisposables.forEach((d) => d.dispose());
        treeViewDisposables = [];

        // 重新初始化
        initializeTreeView(context);
      }
    })
  );
}

/**
 * 初始化树视图（根据配置）
 */
function initializeTreeView(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration("consoleExtension");
  const enableTreeView = config.get<boolean>("enableTreeView", true);

  if (enableTreeView) {
    activateTreeView(context, treeViewDisposables);
  }
}

/**
 * 激活树视图相关功能
 */
function activateTreeView(
  context: vscode.ExtensionContext,
  disposables: vscode.Disposable[]
) {
  // 创建追踪器
  const tracker = new ConsoleLogTracker();
  setTracker(tracker);

  // 创建树视图提供者
  const treeProvider = new ConsoleLogTreeProvider(tracker);

  // 注册树视图
  const treeView = vscode.window.createTreeView("consoleLogExplorer", {
    treeDataProvider: treeProvider,
  });

  // 注册与树视图相关的命令
  const goToLogCommand = registerGoToLogCommand(context);
  const removeLogCommand = registerRemoveLogCommand(context, tracker);
  const clearAllLogsCommand = registerClearAllLogsCommand(context, tracker);
  const refreshLogsCommand = registerRefreshLogsCommand(context, treeProvider);

  // 将所有树视图相关的资源添加到临时数组
  disposables.push(
    treeView,
    tracker,
    goToLogCommand,
    removeLogCommand,
    clearAllLogsCommand,
    refreshLogsCommand
  );

  // 同时添加到 context.subscriptions，用于完整的生命周期管理
  context.subscriptions.push(...disposables);
}

export function deactivate() {}
