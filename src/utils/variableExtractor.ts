import * as vscode from "vscode";
import { SelectedVariable } from "../types";

/**
 * 从文本中提取变量名
 * @param text 待提取的文本
 * @returns 提取到的变量名数组
 */
export function extractVariableNames(text: string): string[] {
  const variables: string[] = [];

  // 匹配变量声明模式：const/let/var variableName = ...
  const declarationPattern = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g;
  let match;
  while ((match = declarationPattern.exec(text)) !== null) {
    variables.push(match[1]);
  }

  // 匹配解构赋值：const { var1, var2 } = ...
  const destructuringPattern = /(?:const|let|var)\s*\{\s*([^}]+)\s*\}\s*=/g;
  while ((match = destructuringPattern.exec(text)) !== null) {
    const vars = match[1].split(",").map((v) => {
      // 处理重命名情况：{ oldName: newName } 提取 newName
      const renamed = v.trim().split(":");
      return renamed.length > 1 ? renamed[1].trim() : renamed[0].trim();
    });
    variables.push(...vars);
  }

  // 匹配数组解构：const [var1, var2] = ...
  const arrayDestructuringPattern = /(?:const|let|var)\s*\[\s*([^\]]+)\s*\]\s*=/g;
  while ((match = arrayDestructuringPattern.exec(text)) !== null) {
    const vars = match[1]
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v && v !== "_");
    variables.push(...vars);
  }

  // 匹配 if 语句中的条件变量：if (a && b || c)
  const ifPattern = /if\s*\(/g;
  while ((match = ifPattern.exec(text)) !== null) {
    // 手动匹配括号平衡，找到完整的 if 条件
    let depth = 1;
    let i = match.index + match[0].length;
    let condition = "";

    while (i < text.length && depth > 0) {
      const char = text[i];
      if (char === '(') {
        depth++;
      } else if (char === ')') {
        depth--;
        if (depth === 0) {
          break;
        }
      }
      condition += char;
      i++;
    }

    // 从条件表达式中提取变量和操作符组合
    // 匹配：!var, Boolean(var), var.prop 等模式
    // 使用非捕获组来匹配括号部分
    const varPattern = /(!+)?([a-zA-Z_$][a-zA-Z0-9_$.]*(?:\([^)]*\))?)/g;
    let varMatch;
    while ((varMatch = varPattern.exec(condition)) !== null) {
      const prefix = varMatch[1] || ""; // 获取前缀符号（如 !）
      const fullVarName = varMatch[2]; // 完整变量名（包含可能的函数调用）

      // 过滤掉布尔字面量和关键字（但不过滤函数调用形式的）
      const baseVarName = fullVarName.split('(')[0];
      if (!["true", "false", "null", "undefined"].includes(baseVarName)) {
        variables.push(prefix + fullVarName);
      }
    }
  }

  // 去重
  return [...new Set(variables)];
}

/**
 * 收集编辑器中选中的变量
 * @param editor VS Code 编辑器实例
 * @returns 选中的变量信息数组（已去重）
 */
export function collectSelectedVariables(
  editor: vscode.TextEditor
): SelectedVariable[] {
  const selectedVariables: SelectedVariable[] = [];
  const seenVariables = new Set<string>(); // 用于去重

  for (const selection of editor.selections) {
    const text = editor.document.getText(selection).trim();
    // 取 start 和 end 中行号较大的那个，确保无论选择方向如何都能获取正确的行号
    const line = Math.max(selection.start.line, selection.end.line);
    const lineText = editor.document.lineAt(line).text;
    const indent = lineText.match(/^(\s*)/)?.[1] || "";

    if (text) {
      // 尝试从选中文本中提取变量名
      const extractedVars = extractVariableNames(text);

      if (extractedVars.length > 0) {
        // 如果提取到变量，为每个变量创建一个条目
        extractedVars.forEach((varName) => {
          // 只添加未见过的变量
          if (!seenVariables.has(varName)) {
            seenVariables.add(varName);
            selectedVariables.push({ text: varName, line, indent });
          }
        });
      } else {
        // 如果没有提取到变量，将选中文本本身作为变量名（保持原有逻辑）
        if (!seenVariables.has(text)) {
          seenVariables.add(text);
          selectedVariables.push({ text, line, indent });
        }
      }
    }
  }

  return selectedVariables;
}
