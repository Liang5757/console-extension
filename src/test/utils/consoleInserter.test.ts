import * as assert from "assert";
import * as vscode from "vscode";
import {
  insertConsoleLogForVariables,
  insertConsoleLogSnippet,
} from "../../utils/consoleInserter";
import { SelectedVariable } from "../../types";

suite("Console Inserter Test Suite", () => {
  suite("insertConsoleLogForVariables", () => {
    test("应该按行号排序变量", async () => {
      // 创建一个测试文档
      const document = await vscode.workspace.openTextDocument({
        content: "line 0\nline 1\nline 2\nline 3\nline 4\n",
        language: "javascript",
      });

      const editor = await vscode.window.showTextDocument(document);

      const selectedVariables: SelectedVariable[] = [
        { text: "c", line: 3, indent: "" },
        { text: "a", line: 1, indent: "" },
        { text: "b", line: 2, indent: "" },
      ];

      insertConsoleLogForVariables(editor, selectedVariables);

      // 等待编辑完成
      await new Promise((resolve) => setTimeout(resolve, 200));

      const content = editor.document.getText();
      const lines = content.split("\n");

      // 验证插入位置（应该在第 3 行之后，即第 4 行）
      // 验证 console.log 按顺序插入（排序后应该是 a, b, c）
      const insertedLines = lines.slice(4, 7).join("\n");
      assert.ok(insertedLines.includes("console.log('[debug] a:', a);"));
      assert.ok(insertedLines.includes("console.log('[debug] b:', b);"));
      assert.ok(insertedLines.includes("console.log('[debug] c:', c);"));

      // 清理
      await vscode.commands.executeCommand(
        "workbench.action.closeActiveEditor"
      );
    });

    test("应该保持正确的缩进", async () => {
      const document = await vscode.workspace.openTextDocument({
        content: "function test() {\n  const a = 1;\n}\n",
        language: "javascript",
      });

      const editor = await vscode.window.showTextDocument(document);

      const selectedVariables: SelectedVariable[] = [
        { text: "a", line: 1, indent: "  " },
      ];

      insertConsoleLogForVariables(editor, selectedVariables);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const content = editor.document.getText();
      const lines = content.split("\n");

      // 验证缩进是否保持
      assert.ok(lines[2].startsWith("  console.log"));

      await vscode.commands.executeCommand(
        "workbench.action.closeActiveEditor"
      );
    });

    test("应该在最后一行之后插入", async () => {
      const document = await vscode.workspace.openTextDocument({
        content: "const a = 1;\nconst b = 2;\nconst c = 3;\n",
        language: "javascript",
      });

      const editor = await vscode.window.showTextDocument(document);

      const selectedVariables: SelectedVariable[] = [
        { text: "a", line: 0, indent: "" },
        { text: "b", line: 1, indent: "" },
        { text: "c", line: 2, indent: "" },
      ];

      insertConsoleLogForVariables(editor, selectedVariables);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const content = editor.document.getText();
      const lines = content.split("\n");

      // 应该在第 2 行（最后一个变量）之后插入，即从第 3 行开始
      assert.ok(lines[3].includes("console.log('[debug] a:', a);"));
      assert.ok(lines[4].includes("console.log('[debug] b:', b);"));
      assert.ok(lines[5].includes("console.log('[debug] c:', c);"));

      await vscode.commands.executeCommand(
        "workbench.action.closeActiveEditor"
      );
    });
  });

  suite("insertConsoleLogSnippet", () => {
    test("应该在光标行之后插入 snippet", async () => {
      const document = await vscode.workspace.openTextDocument({
        content: "const a = 1;\nconst b = 2;\n",
        language: "javascript",
      });

      const editor = await vscode.window.showTextDocument(document);

      // 将光标移动到第 0 行
      editor.selection = new vscode.Selection(0, 0, 0, 0);

      insertConsoleLogSnippet(editor);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const content = editor.document.getText();
      const lines = content.split("\n");

      // 应该在第 0 行之后插入
      assert.ok(lines[1].includes("console.log"));

      await vscode.commands.executeCommand(
        "workbench.action.closeActiveEditor"
      );
    });

    test("应该保持缩进", async () => {
      const document = await vscode.workspace.openTextDocument({
        content: "function test() {\n  const a = 1;\n}\n",
        language: "javascript",
      });

      const editor = await vscode.window.showTextDocument(document);

      // 将光标移动到第 1 行（有缩进的行）
      editor.selection = new vscode.Selection(1, 0, 1, 0);

      insertConsoleLogSnippet(editor);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const content = editor.document.getText();
      const lines = content.split("\n");

      // 验证插入的行有正确的缩进
      assert.ok(lines[2].startsWith("  console.log"));

      await vscode.commands.executeCommand(
        "workbench.action.closeActiveEditor"
      );
    });

    test("应该在提取失败时插入带占位符的 console.log snippet", async () => {
      const document = await vscode.workspace.openTextDocument({
        content: "const x = 1;\nconst y = 2;\n",
        language: "javascript",
      });

      const editor = await vscode.window.showTextDocument(document);

      // 创建一个 placeholder 变量（提取失败的情况）
      const selectedVariables: SelectedVariable[] = [
        { text: "", line: 0, indent: "", isPlaceholder: true },
      ];

      insertConsoleLogSnippet(editor, selectedVariables);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const content = editor.document.getText();
      const lines = content.split("\n");

      // 应该在第 0 行之后插入 console.log
      assert.ok(lines[1].includes("console.log"));
      assert.ok(lines[1].includes("[debug]"));
      // snippet 的占位符会被处理，检查基本结构
      assert.ok(lines[1].includes(","));

      await vscode.commands.executeCommand(
        "workbench.action.closeActiveEditor"
      );
    });

    test("应该在多个 placeholder 中保持正确的缩进", async () => {
      const document = await vscode.workspace.openTextDocument({
        content: "function test() {\n  const a = 1;\n  const b = 2;\n}\n",
        language: "javascript",
      });

      const editor = await vscode.window.showTextDocument(document);

      // 创建多个 placeholder 变量
      const selectedVariables: SelectedVariable[] = [
        { text: "", line: 1, indent: "  ", isPlaceholder: true },
        { text: "", line: 2, indent: "  ", isPlaceholder: true },
      ];

      insertConsoleLogSnippet(editor, selectedVariables);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const content = editor.document.getText();
      const lines = content.split("\n");

      // 应该在最后一个选中变量之后插入两个 console.log snippet，并保持缩进
      assert.ok(lines[3].startsWith("  console.log"));
      assert.ok(lines[4].startsWith("  console.log"));
      // snippet 占位符会被处理，检查基本结构
      assert.ok(lines[3].includes("[debug]"));
      assert.ok(lines[4].includes("[debug]"));
      assert.ok(lines[3].includes(","));
      assert.ok(lines[4].includes(","));

      await vscode.commands.executeCommand(
        "workbench.action.closeActiveEditor"
      );
    });
  });
});
