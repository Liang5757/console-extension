import * as vscode from 'vscode';
import { ConsoleLogItem } from '../types/consoleLogItem';
import { getConfig } from './templateManager';
import { extractContextName } from './contextExtractor';

/**
 * Console.log 扫描器 - 仅识别本插件插入的 console.log
 * 通过模板特征识别插件插入的 log
 */
export class ConsoleLogScanner {
  /**
   * 扫描文件中本插件插入的 console.log 语句
   * 通过匹配配置的前缀来识别
   */
  static scanDocument(document: vscode.TextDocument): ConsoleLogItem[] {
    const items: ConsoleLogItem[] = [];
    const filePath = document.uri.fsPath;

    // 获取配置的前缀作为特征
    const config = getConfig();
    const signature = config.prefix;

    if (!signature) {
      // 如果前缀为空，无法识别插件插入的 log
      return items;
    }

    for (let lineNum = 0; lineNum < document.lineCount; lineNum++) {
      const line = document.lineAt(lineNum);
      const text = line.text;

      // 检查该行是否包含 console.log 和模板特征
      if (text.includes('console.log') && text.includes(signature)) {
        // 提取变量名：从 console.log(..., variableName) 的最后一个参数
        // 匹配：console.log(任意内容, 最后一个参数)
        const match = text.match(/console\.log\((.+),\s*(\w+)\s*\)$/);
        let variableName = 'console.log';

        if (match && match[2]) {
          variableName = match[2];
        } else {
          // 如果以上模式不匹配，尝试更宽松的模式
          const fallbackMatch = text.match(/console\.log\([^,]*,\s*(\w+)\s*\)/);
          if (fallbackMatch && fallbackMatch[1]) {
            variableName = fallbackMatch[1];
          }
        }

        // 提取函数名或类名
        const contextName = extractContextName(document, lineNum);

        items.push({
          filePath,
          line: lineNum,
          variableName,
          logStatement: text.trim(),
          contextName
        });
      }
    }

    return items;
  }
}
