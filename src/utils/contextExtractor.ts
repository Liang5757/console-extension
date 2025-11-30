import * as vscode from "vscode";
import * as ts from "typescript";

/**
 * 递归遍历 TypeScript AST，查找包含目标位置的最内层函数或类
 */
function findEnclosingContext(node: ts.Node, targetOffset: number, sourceFile: ts.SourceFile): string | undefined {
  // 如果当前节点不包含目标位置，直接返回
  if (node.pos > targetOffset || node.end < targetOffset) {
    return undefined;
  }

  let contextName: string | undefined;

  // 检查当前节点是否是我们关心的函数或类声明
  if (ts.isFunctionDeclaration(node) && node.name) {
    contextName = node.name.text;
  } else if (ts.isClassDeclaration(node) && node.name) {
    contextName = node.name.text;
  } else if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
    contextName = node.name.text;
  } else if (ts.isGetAccessor(node) && ts.isIdentifier(node.name)) {
    contextName = node.name.text;
  } else if (ts.isSetAccessor(node) && ts.isIdentifier(node.name)) {
    contextName = node.name.text;
  } else if (ts.isConstructorDeclaration(node)) {
    contextName = "constructor";
  } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
    // 检查是否是箭头函数或函数表达式
    if (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer)) {
      contextName = node.name.text;
    }
  } else if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name)) {
    // 对象方法：{ methodName: function() {} } 或 { methodName: () => {} }
    if (ts.isFunctionExpression(node.initializer) || ts.isArrowFunction(node.initializer)) {
      contextName = node.name.text;
    }
  } else if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
    // 对象方法简写：{ methodName() {} }
    contextName = node.name.text;
  }

  // 递归检查子节点，寻找更内层的上下文
  ts.forEachChild(node, (child) => {
    const innerContext = findEnclosingContext(child, targetOffset, sourceFile);
    if (innerContext) {
      // 更深层的上下文优先，覆盖当前上下文
      contextName = innerContext;
    }
  });

  return contextName;
}

/**
 * 提取指定行所在的函数名或类名
 * @param editorOrDocument VS Code 编辑器实例或文档实例
 * @param lineNumber 目标行号
 * @returns 函数名或类名，如果找不到则返回 undefined
 */
export function extractContextName(
  editorOrDocument: vscode.TextEditor | vscode.TextDocument,
  lineNumber: number
): string | undefined {
  const document = 'document' in editorOrDocument ? editorOrDocument.document : editorOrDocument;

  try {
    // 获取完整文档的代码
    const fullCode = document.getText();

    // 计算目标行在文档中的字符偏移量
    let targetOffset = 0;
    for (let i = 0; i < lineNumber; i++) {
      targetOffset += document.lineAt(i).text.length + 1; // +1 for newline
    }
    // 加上目标行的长度，指向行尾
    targetOffset += document.lineAt(lineNumber).text.length;

    // 使用 TypeScript 编译器创建源文件
    // ScriptKind.Unknown 让 TypeScript 自动检测文件类型（支持 .ts, .tsx, .js, .jsx）
    const sourceFile = ts.createSourceFile(
      'temp.ts',
      fullCode,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.Unknown
    );

    // 遍历 AST 查找包含目标位置的函数或类
    return findEnclosingContext(sourceFile, targetOffset, sourceFile);
  } catch {
    return undefined;
  }
}
