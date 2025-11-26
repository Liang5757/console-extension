import * as vscode from 'vscode';
import { ConsoleLogItem } from '../types/consoleLogItem';
import { ConsoleLogScanner } from './consoleLogScanner';

/**
 * Console.log 追踪器，负责管理和追踪所有插入的 console.log
 * 只追踪用户手动插入的 console.log
 */
export class ConsoleLogTracker {
  private consoleLogItems: Map<string, ConsoleLogItem[]> = new Map();
  private trackedFiles: Set<string> = new Set(); // 仅追踪这些文件中的变化
  private disposables: vscode.Disposable[] = [];
  private onChangeCallback?: () => void;
  private debounceTimer: NodeJS.Timeout | undefined;

  constructor() {
    // 监听文档变化 - 扫描该文件中的所有 console.log（仅监听已追踪的文件）
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(e => {
        const filePath = e.document.uri.fsPath;
        if (this.trackedFiles.has(filePath)) {
          this.rescanDocument(e.document);
        }
      })
    );

    // 监听编辑器活跃文档变化 - 扫描激活文件中的所有 console.log
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
          const filePath = editor.document.uri.fsPath;
          if (this.trackedFiles.has(filePath)) {
            this.rescanDocument(editor.document);
          }
        }
      })
    );
  }

  /**
   * 添加文件到追踪列表（当用户插入 console.log 时调用）
   */
  trackFile(filePath: string): void {
    this.trackedFiles.add(filePath);
  }

  /**
   * 设置变化回调
   */
  setOnChangeCallback(callback: () => void): void {
    this.onChangeCallback = callback;
  }

  /**
   * 添加 console.log 记录
   */
  addConsoleLog(item: ConsoleLogItem): void {
    const items = this.consoleLogItems.get(item.filePath) || [];
    items.push(item);
    this.consoleLogItems.set(item.filePath, items);
    this.notifyChange();
  }

  /**
   * 移除 console.log 记录
   */
  removeConsoleLog(item: ConsoleLogItem): void {
    const items = this.consoleLogItems.get(item.filePath);
    if (items) {
      const index = items.findIndex(i =>
        i.line === item.line && i.variableName === item.variableName
      );
      if (index !== -1) {
        items.splice(index, 1);
        if (items.length === 0) {
          this.consoleLogItems.delete(item.filePath);
        }
        this.notifyChange();
      }
    }
  }

  /**
   * 清除所有记录
   */
  clearAllLogs(): void {
    this.consoleLogItems.clear();
    this.notifyChange();
  }

  /**
   * 获取所有记录
   */
  getAllLogs(): ConsoleLogItem[] {
    const allLogs: ConsoleLogItem[] = [];
    for (const items of this.consoleLogItems.values()) {
      allLogs.push(...items);
    }
    return allLogs;
  }

  /**
   * 获取所有文件路径
   */
  getAllFilePaths(): string[] {
    return Array.from(this.consoleLogItems.keys()).filter(
      filePath => this.consoleLogItems.get(filePath)!.length > 0
    );
  }

  /**
   * 获取指定文件的所有 log
   */
  getLogsByFile(filePath: string): ConsoleLogItem[] {
    return this.consoleLogItems.get(filePath) || [];
  }


  /**
   * 重新扫描文档，检测已存在的 console.log
   */
  private rescanDocument(document: vscode.TextDocument): void {
    const filePath = document.uri.fsPath;

    // 添加防抖，避免频繁扫描
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      // 扫描文档中的所有 console.log
      const scannedLogs = ConsoleLogScanner.scanDocument(document);

      // 直接用扫描结果更新数据（始终保持最新的文件内容）
      if (scannedLogs.length === 0) {
        this.consoleLogItems.delete(filePath);
      } else {
        this.consoleLogItems.set(filePath, scannedLogs);
      }

      this.notifyChange();
    }, 200); // 200ms 防抖延迟
  }

  /**
   * 通知变化
   */
  private notifyChange(): void {
    if (this.onChangeCallback) {
      this.onChangeCallback();
    }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.disposables.forEach(d => d.dispose());
  }
}
