export interface ConsoleLogItem {
  filePath: string;
  line: number;
  variableName: string;
  logStatement: string;
  contextName?: string; // 函数名或类名
}
