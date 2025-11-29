import * as vscode from "vscode";
import { parse, Program } from "acorn";
import { SelectedVariable } from "../types";

/**
 * 移除代码中的单行和多行注释
 */
function removeComments(code: string): string {
  let result = code;
  // 移除单行注释，但保留URL中的 //
  const lines = result.split(/\r?\n/);
  const processedLines = lines.map(line => {
    // 查找注释的开始位置（不在字符串中，不在URL中）
    const commentIndex = findCommentIndex(line);
    if (commentIndex !== -1) {
      return line.substring(0, commentIndex);
    }
    return line;
  });
  result = processedLines.join('\n');

  // 移除多行注释 /* ... */
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  return result;
}

/**
 * 查找行中注释的开始位置，避免误删字符串中或URL中的 //
 */
function findCommentIndex(line: string): number {
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < line.length - 1; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inString) {
      if (char === stringChar && (i === 0 || line[i - 1] !== '\\')) {
        inString = false;
      }
    } else {
      if (char === '"' || char === "'" || char === '`') {
        inString = true;
        stringChar = char;
      } else if (char === '/' && nextChar === '/') {
        // 检查是否是URL中的 //
        if (i > 0 && line[i - 1] === ':') {
          continue; // 跳过URL中的 //
        }
        return i;
      }
    }
  }

  return -1;
}

/**
 * 从文本中提取变量名，使用 AST 语法分析
 * @param text 待提取的文本
 * @returns 提取到的变量名数组
 */
export function extractVariableNames(text: string): string[] {
  const variables: string[] = [];
  const variablesSet: Set<string> = new Set();

  // 在解析前先移除注释，提高AST解析成功率
  const textWithoutComments = removeComments(text);

  try {
    // 尝试解析为完整的程序
    let ast: Program;
    try {
      ast = parse(textWithoutComments, {
        ecmaVersion: "latest",
        sourceType: "module",
      }) as Program;
    } catch {
      // 如果失败，尝试解析为表达式
      try {
        ast = parse(`(${textWithoutComments})`, {
          ecmaVersion: "latest",
          sourceType: "module",
        }) as Program;
      } catch {
        // 尝试作为块语句解析
        try {
          ast = parse(`{${textWithoutComments}}`, {
            ecmaVersion: "latest",
            sourceType: "module",
          }) as Program;
        } catch {
          // 最后的备选：包装为函数体（添加大括号确保完整性）
          try {
            ast = parse(`function f() { ${textWithoutComments}; }`, {
              ecmaVersion: "latest",
              sourceType: "module",
            }) as Program;
          } catch {
            // 再次尝试添加大括号
            ast = parse(`function f() { ${textWithoutComments} {} }`, {
              ecmaVersion: "latest",
              sourceType: "module",
            }) as Program;
          }
        }
      }
    }

    // 遍历 AST 提取变量，并传递移除注释后的文本用于处理 if 条件
    extractVariablesFromAST(ast, variables, variablesSet, textWithoutComments);
  } catch (error) {
    // 如果 AST 解析完全失败，回退到正则表达式（作为最后的手段）
    fallbackExtractVariables(textWithoutComments, variablesSet);
    // 从 Set 转换回数组
    variables.push(...Array.from(variablesSet));
  }

  return variables;
}

/**
 * 添加变量到列表（保持顺序并去重）
 */
function addVariable(variables: string[], variablesSet: Set<string>, varName: string): void {
  if (!variablesSet.has(varName)) {
    variables.push(varName);
    variablesSet.add(varName);
  }
}

/**
 * 从 AST 树中递归提取变量（第一遍：提取声明）
 */
function extractVariablesFromASTPass1(node: any, variables: string[], variablesSet: Set<string>, originalText?: string): void {
  if (!node || typeof node !== "object") {
    return;
  }

  // 处理变量声明（const/let/var）
  if (node.type === "VariableDeclaration") {
    node.declarations?.forEach((decl: any) => {
      extractIdentifiersFromPatternWithOrder(decl.id, variables, variablesSet);
    });
  }

  // 处理函数参数（可选）
  if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") {
    node.params?.forEach((param: any) => {
      extractIdentifiersFromPatternWithOrder(param, variables, variablesSet);
    });
  }

  // 处理单独的表达式语句（如用户选中单个变量名）
  if (node.type === "ExpressionStatement" && node.expression) {
    extractExpressionVariables(node.expression, variables, variablesSet, originalText);
  }

  // 递归处理所有子节点（跳过条件处理）
  for (const key in node) {
    if (key === "start" || key === "end" || key === "loc" || key === "range") {
      continue; // 跳过位置信息
    }
    // 跳过对 test 节点的处理（在第二遍处理）
    if ((node.type === "IfStatement" || node.type === "WhileStatement") && key === "test") {
      continue;
    }
    // 跳过已经处理过的 ExpressionStatement
    if (node.type === "ExpressionStatement" && key === "expression") {
      continue;
    }
    const child = node[key];
    if (Array.isArray(child)) {
      child.forEach((item) => extractVariablesFromASTPass1(item, variables, variablesSet, originalText));
    } else if (child && typeof child === "object") {
      extractVariablesFromASTPass1(child, variables, variablesSet, originalText);
    }
  }
}

/**
 * 从表达式中提取变量
 */
function extractExpressionVariables(expression: any, variables: string[], variablesSet: Set<string>, originalText?: string): void {
  if (!expression) {
    return;
  }

  // 处理标识符：userName
  if (expression.type === "Identifier") {
    addVariable(variables, variablesSet, expression.name);
    return;
  }

  // 处理成员访问：user.name, process.env.CI
  if (expression.type === "MemberExpression") {
    const memberExpr = buildMemberExpression(expression, originalText);
    if (memberExpr) {
      addVariable(variables, variablesSet, memberExpr);
    }
    return;
  }

  // 处理一元表达式：!flag, !!value
  if (expression.type === "UnaryExpression" && (expression.operator === "!" || expression.operator === "~")) {
    const operator = expression.operator === "!" ? "!" : "~";
    if (expression.argument.type === "Identifier") {
      addVariable(variables, variablesSet, operator + expression.argument.name);
    } else if (expression.argument.type === "MemberExpression") {
      const memberExpr = buildMemberExpression(expression.argument, originalText);
      if (memberExpr) {
        addVariable(variables, variablesSet, operator + memberExpr);
      }
    } else if (expression.argument.type === "UnaryExpression") {
      // 处理双重否定：!!value
      extractExpressionVariables(expression.argument, variables, variablesSet, originalText);
    }
    return;
  }

  // 处理调用表达式：Boolean(value)
  if (expression.type === "CallExpression") {
    // 从原始文本中提取函数调用表达式
    if (originalText && expression.start !== undefined && expression.end !== undefined) {
      const callExpr = originalText.substring(expression.start, expression.end);
      addVariable(variables, variablesSet, callExpr);
    }
    return;
  }
}

/**
 * 从 MemberExpression 构建成员访问字符串
 */
function buildMemberExpression(node: any, originalText?: string): string | null {
  // 如果有原始文本，直接从原始文本中提取
  if (originalText && node.start !== undefined && node.end !== undefined) {
    return originalText.substring(node.start, node.end);
  }

  // 否则递归构建
  if (node.type === "Identifier") {
    return node.name;
  }

  if (node.type === "MemberExpression") {
    const object = buildMemberExpression(node.object, originalText);
    if (!object) {
      return null;
    }

    if (node.computed) {
      // 计算属性：obj[key]
      const property = buildMemberExpression(node.property, originalText);
      return `${object}[${property}]`;
    } else {
      // 点访问：obj.key
      const property = node.property.name;
      return `${object}.${property}`;
    }
  }

  return null;
}

/**
 * 从 AST 树中递归提取变量（第二遍：提取条件）
 */
function extractVariablesFromASTPass2(node: any, variables: string[], variablesSet: Set<string>, originalText?: string): void {
  if (!node || typeof node !== "object") {
    return;
  }

  // 处理 if 语句的条件
  if (node.type === "IfStatement" && node.test && originalText) {
    // 从原始文本中提取 if 条件，保留操作符和函数调用
    const ifCondition = extractConditionFromText(originalText, "if");
    if (ifCondition) {
      extractVariablesFromConditionWithOrder(ifCondition, variables, variablesSet);
    }
  }

  // 处理 while 语句的条件
  if (node.type === "WhileStatement" && node.test && originalText) {
    const whileCondition = extractConditionFromText(originalText, "while");
    if (whileCondition) {
      extractVariablesFromConditionWithOrder(whileCondition, variables, variablesSet);
    }
  }

  // 递归处理所有子节点
  for (const key in node) {
    if (key === "start" || key === "end" || key === "loc" || key === "range") {
      continue; // 跳过位置信息
    }
    const child = node[key];
    if (Array.isArray(child)) {
      child.forEach((item) => extractVariablesFromASTPass2(item, variables, variablesSet, originalText));
    } else if (child && typeof child === "object") {
      extractVariablesFromASTPass2(child, variables, variablesSet, originalText);
    }
  }
}

/**
 * 从 AST 树中递归提取变量
 */
function extractVariablesFromAST(node: any, variables: string[], variablesSet: Set<string>, originalText?: string): void {
  // 第一遍：提取所有声明
  extractVariablesFromASTPass1(node, variables, variablesSet, originalText);
  // 第二遍：提取所有条件
  extractVariablesFromASTPass2(node, variables, variablesSet, originalText);
}

/**
 * 从模式中提取标识符（处理解构，带顺序）
 */
function extractIdentifiersFromPatternWithOrder(node: any, variables: string[], variablesSet: Set<string>): void {
  if (!node) {
    return;
  }

  if (node.type === "Identifier") {
    addVariable(variables, variablesSet, node.name);
  } else if (node.type === "ObjectPattern") {
    // 处理对象解构: { a, b: c }
    node.properties?.forEach((prop: any) => {
      if (prop.type === "RestElement") {
        extractIdentifiersFromPatternWithOrder(prop.argument, variables, variablesSet);
      } else if (prop.type === "Property") {
        // 获取重命名后的变量名（value）
        extractIdentifiersFromPatternWithOrder(prop.value, variables, variablesSet);
      }
    });
  } else if (node.type === "ArrayPattern") {
    // 处理数组解构: [a, b]
    node.elements?.forEach((elem: any) => {
      if (elem && elem.type === "RestElement") {
        extractIdentifiersFromPatternWithOrder(elem.argument, variables, variablesSet);
      } else if (elem) {
        // 检查是否是下划线标记符（用于占位符）
        if (elem.type === "Identifier" && elem.name === "_") {
          // 跳过下划线，不添加到变量集合
          return;
        }
        extractIdentifiersFromPatternWithOrder(elem, variables, variablesSet);
      }
    });
  } else if (node.type === "RestElement") {
    // 处理剩余参数: ...rest
    extractIdentifiersFromPatternWithOrder(node.argument, variables, variablesSet);
  } else if (node.type === "AssignmentPattern") {
    // 处理默认参数: a = defaultValue
    extractIdentifiersFromPatternWithOrder(node.left, variables, variablesSet);
  }
}

/**
 * 从模式中提取标识符（处理解构）
 */
function extractIdentifiersFromPattern(node: any, variables: Set<string>): void {
  if (!node) {
    return;
  }

  if (node.type === "Identifier") {
    variables.add(node.name);
  } else if (node.type === "ObjectPattern") {
    // 处理对象解构: { a, b: c }
    node.properties?.forEach((prop: any) => {
      if (prop.type === "RestElement") {
        extractIdentifiersFromPattern(prop.argument, variables);
      } else if (prop.type === "Property") {
        // 获取重命名后的变量名（value）
        extractIdentifiersFromPattern(prop.value, variables);
      }
    });
  } else if (node.type === "ArrayPattern") {
    // 处理数组解构: [a, b]
    node.elements?.forEach((elem: any) => {
      if (elem && elem.type === "RestElement") {
        extractIdentifiersFromPattern(elem.argument, variables);
      } else if (elem) {
        // 检查是否是下划线标记符（用于占位符）
        if (elem.type === "Identifier" && elem.name === "_") {
          // 跳过下划线，不添加到变量集合
          return;
        }
        extractIdentifiersFromPattern(elem, variables);
      }
    });
  } else if (node.type === "RestElement") {
    // 处理剩余参数: ...rest
    extractIdentifiersFromPattern(node.argument, variables);
  } else if (node.type === "AssignmentPattern") {
    // 处理默认参数: a = defaultValue
    extractIdentifiersFromPattern(node.left, variables);
  }
}

/**
 * 从原始文本中提取 if/while 条件
 */
function extractConditionFromText(text: string, keyword: string): string {
  const pattern = new RegExp(`${keyword}\\s*\\((.*?)\\)`, "s");
  const match = text.match(pattern);

  if (!match) {
    return "";
  }

  // 如果简单匹配能工作，直接返回
  const simpleCondition = match[1];
  // 检查是否有平衡的括号（简单启发式方法）
  if (isBalanced(simpleCondition)) {
    return removeComments(simpleCondition);
  }

  // 否则手动匹配括号
  const keywordPos = text.indexOf(keyword);
  if (keywordPos === -1) {
    return "";
  }

  let parenPos = text.indexOf("(", keywordPos + keyword.length);
  if (parenPos === -1) {
    return "";
  }

  let depth = 1;
  let i = parenPos + 1;
  let condition = "";

  while (i < text.length && depth > 0) {
    const char = text[i];
    if (char === "(") {
      depth++;
    } else if (char === ")") {
      depth--;
      if (depth === 0) {
        break;
      }
    }
    condition += char;
    i++;
  }

  return removeComments(condition);
}

/**
 * 检查括号是否平衡
 */
function isBalanced(str: string): boolean {
  let depth = 0;
  for (const char of str) {
    if (char === "(") {
      depth++;
    } else if (char === ")") {
      depth--;
      if (depth < 0) {
        return false;
      }
    }
  }
  return depth === 0;
}

/**
 * 从 if/while 条件中提取变量（带顺序）
 */
function extractVariablesFromConditionWithOrder(conditionText: string, variables: string[], variablesSet: Set<string>): void {
  // 先移除比较运算符右侧的值（字符串、数字等），避免它们被误识别为变量
  let cleanedText = conditionText;
  // 移除比较运算符及其右侧的值：=== 'value', !== 123, == "test", != null 等
  cleanedText = cleanedText.replace(/[!=]==?\s*(?:'[^']*'|"[^"]*"|`[^`]*`|\d+|true|false|null|undefined)/g, '');

  // 提取基本变量和操作符组合
  // 匹配：!var, !!var, var, var.prop, var['prop'], var["prop"], Boolean(var) 等模式
  // 直接在正则表达式中匹配中括号访问，避免使用占位符
  const varPattern = /(!+)?([a-zA-Z_$][a-zA-Z0-9_$]*(?:(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*|\['[^']*'\]|\["[^"]*"\])*)?(?:\([^)]*\))?)/g;
  let match;
  while ((match = varPattern.exec(cleanedText)) !== null) {
    const prefix = match[1] || ""; // 获取前缀符号（如 ! 或 !!）
    const fullVarName = match[2]; // 完整变量名（包含可能的函数调用或成员访问）

    // 过滤掉布尔字面量和关键字
    const baseVarName = fullVarName.split("(")[0].split("[")[0].split(".")[0]; // 获取基础变量名
    if (!["true", "false", "null", "undefined"].includes(baseVarName)) {
      addVariable(variables, variablesSet, prefix + fullVarName);
    }
  }
}

/**
 * 从 if/while 条件中提取变量（保留原有正则表达式逻辑以满足测试期望）
 */
function extractVariablesFromCondition(conditionText: string, variables: Set<string>): void {
  // 提取基本变量和操作符组合
  // 匹配：!var, !!var, var, var.prop, Boolean(var) 等模式
  const varPattern = /(!+)?([a-zA-Z_$][a-zA-Z0-9_$.]*(?:\([^)]*\))?)/g;
  let match;
  while ((match = varPattern.exec(conditionText)) !== null) {
    const prefix = match[1] || ""; // 获取前缀符号（如 ! 或 !!）
    const fullVarName = match[2]; // 完整变量名（包含可能的函数调用或成员访问）

    // 过滤掉布尔字面量和关键字
    const baseVarName = fullVarName.split("(")[0]; // 如果是函数调用，获取函数名
    if (!["true", "false", "null", "undefined"].includes(baseVarName)) {
      variables.add(prefix + fullVarName);
    }
  }
}

/**
 * 回退方案：使用正则表达式提取变量（当 AST 解析失败时）
 */
function fallbackExtractVariables(text: string, variables: Set<string>): void {
  // 匹配变量声明模式：const/let/var variableName = ...
  const declarationPattern = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g;
  let match;
  while ((match = declarationPattern.exec(text)) !== null) {
    variables.add(match[1]);
  }

  // 匹配解构赋值：const { var1, var2 } = ...
  const destructuringPattern = /(?:const|let|var)\s*\{\s*([^}]+)\s*\}\s*=/g;
  while ((match = destructuringPattern.exec(text)) !== null) {
    const vars = match[1].split(",").map((v) => {
      const renamed = v.trim().split(":");
      return renamed.length > 1 ? renamed[1].trim() : renamed[0].trim();
    });
    vars.forEach((v) => variables.add(v));
  }

  // 匹配数组解构：const [var1, var2] = ...
  const arrayDestructuringPattern = /(?:const|let|var)\s*\[\s*([^\]]+)\s*\]\s*=/g;
  while ((match = arrayDestructuringPattern.exec(text)) !== null) {
    const vars = match[1]
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v && v !== "_");
    vars.forEach((v) => variables.add(v));
  }

  // 匹配 if 语句中的条件变量：if (a && b || c)
  const ifPattern = /if\s*\(/g;
  while ((match = ifPattern.exec(text)) !== null) {
    let depth = 1;
    let i = match.index + match[0].length;
    let condition = "";

    while (i < text.length && depth > 0) {
      const char = text[i];
      if (char === "(") {
        depth++;
      } else if (char === ")") {
        depth--;
        if (depth === 0) {
          break;
        }
      }
      condition += char;
      i++;
    }

    // 先移除比较运算符右侧的值（字符串、数字等），避免它们被误识别为变量
    let cleanedCondition = condition.replace(/[!=]==?\s*(?:'[^']*'|"[^"]*"|`[^`]*`|\d+|true|false|null|undefined)/g, '');

    // 使用支持中括号访问的正则表达式
    const varPattern = /(!+)?([a-zA-Z_$][a-zA-Z0-9_$]*(?:(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*|\['[^']*'\]|\["[^"]*"\])*)?(?:\([^)]*\))?)/g;
    let varMatch;
    while ((varMatch = varPattern.exec(cleanedCondition)) !== null) {
      const prefix = varMatch[1] || "";
      const fullVarName = varMatch[2];
      const baseVarName = fullVarName.split("(")[0].split("[")[0].split(".")[0];
      if (!["true", "false", "null", "undefined"].includes(baseVarName)) {
        variables.add(prefix + fullVarName);
      }
    }
  }
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
    let text = editor.document.getText(selection).trim();
    // 取 start 和 end 中行号较大的那个，确保无论选择方向如何都能获取正确的行号
    const line = Math.max(selection.start.line, selection.end.line);
    const lineText = editor.document.lineAt(line).text;
    const indent = lineText.match(/^(\s*)/)?.[1] || "";

    // 如果没有选中文本（selection 为空，即光标位置），使用当前行的文本
    if (!text && selection.isEmpty) {
      text = lineText.trim();
    }

    // 尝试从选中文本中提取变量名
    const extractedVars = text ? extractVariableNames(text) : [];

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
      // 如果没有提取到变量（包括空白行），添加占位符
      const placeholderKey = `__placeholder_${line}__`;
      if (!seenVariables.has(placeholderKey)) {
        seenVariables.add(placeholderKey);
        selectedVariables.push({
          text: "",  // 空变量名
          line,
          indent,
          isPlaceholder: true  // 标记为占位符
        });
      }
    }
  }

  return selectedVariables;
}
