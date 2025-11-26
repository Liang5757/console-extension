import * as assert from "assert";
import * as vscode from "vscode";
import { ConsoleLogScanner } from "../../utils/consoleLogScanner";

suite("Console Log Scanner Test Suite", () => {
  suite("Variable Name Extraction", () => {
    test("应该正确提取简单变量名", () => {
      // 模拟一个文本文档
      const mockDocument = {
        lineCount: 1,
        lineAt: (line: number) => ({
          text: "    console.log('[debug] test:', testVar);"
        }),
        uri: { fsPath: "/test/file.js" }
      } as any;

      const items = ConsoleLogScanner.scanDocument(mockDocument);
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].variableName, "testVar");
    });

    test("应该正确提取带有下划线的变量名", () => {
      const mockDocument = {
        lineCount: 1,
        lineAt: (line: number) => ({
          text: "    console.log('[debug] test:', test_var);"
        }),
        uri: { fsPath: "/test/file.js" }
      } as any;

      const items = ConsoleLogScanner.scanDocument(mockDocument);
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].variableName, "test_var");
    });

    test("应该正确提取带有数字的变量名", () => {
      const mockDocument = {
        lineCount: 1,
        lineAt: (line: number) => ({
          text: "    console.log('[debug] test:', var123);"
        }),
        uri: { fsPath: "/test/file.js" }
      } as any;

      const items = ConsoleLogScanner.scanDocument(mockDocument);
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].variableName, "var123");
    });

    test("应该正确提取带有缩进的 console.log", () => {
      const mockDocument = {
        lineCount: 1,
        lineAt: (line: number) => ({
          text: "      console.log('[debug] myVar L1:', myVar);"
        }),
        uri: { fsPath: "/test/file.js" }
      } as any;

      const items = ConsoleLogScanner.scanDocument(mockDocument);
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].variableName, "myVar");
    });

    test("应该正确提取带有文件名和行号的 console.log", () => {
      const mockDocument = {
        lineCount: 1,
        lineAt: (line: number) => ({
          text: "console.log('[debug] file.js L10 myFunction():', myVar);"
        }),
        uri: { fsPath: "/test/file.js" }
      } as any;

      const items = ConsoleLogScanner.scanDocument(mockDocument);
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].variableName, "myVar");
    });

    test("应该正确提取带有类名和函数名的 console.log", () => {
      const mockDocument = {
        lineCount: 1,
        lineAt: (line: number) => ({
          text: "console.log('[debug] MyClass.myMethod():', myVar);"
        }),
        uri: { fsPath: "/test/file.js" }
      } as any;

      const items = ConsoleLogScanner.scanDocument(mockDocument);
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].variableName, "myVar");
    });

    test("应该正确提取末尾有分号的 console.log", () => {
      const mockDocument = {
        lineCount: 1,
        lineAt: (line: number) => ({
          text: "console.log('[debug] test:', testVar);"
        }),
        uri: { fsPath: "/test/file.js" }
      } as any;

      const items = ConsoleLogScanner.scanDocument(mockDocument);
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].variableName, "testVar");
    });

    test("应该正确提取末尾没有分号的 console.log", () => {
      const mockDocument = {
        lineCount: 1,
        lineAt: (line: number) => ({
          text: "console.log('[debug] test:', testVar)"
        }),
        uri: { fsPath: "/test/file.js" }
      } as any;

      const items = ConsoleLogScanner.scanDocument(mockDocument);
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].variableName, "testVar");
    });

    test("应该忽略不包含前缀的 console.log", () => {
      const mockDocument = {
        lineCount: 1,
        lineAt: (line: number) => ({
          text: "console.log('没有前缀:', testVar);"
        }),
        uri: { fsPath: "/test/file.js" }
      } as any;

      const items = ConsoleLogScanner.scanDocument(mockDocument);
      assert.strictEqual(items.length, 0);
    });

    test("应该处理多行文档", () => {
      const lines = [
        "let a = 1;",
        "console.log('[debug] first:', a);",
        "let b = 2;",
        "console.log('[debug] second:', b);"
      ];

      const mockDocument = {
        lineCount: 4,
        lineAt: (line: number) => ({
          text: lines[line]
        }),
        uri: { fsPath: "/test/file.js" }
      } as any;

      const items = ConsoleLogScanner.scanDocument(mockDocument);
      assert.strictEqual(items.length, 2);
      assert.strictEqual(items[0].variableName, "a");
      assert.strictEqual(items[1].variableName, "b");
    });

    test("应该处理带有空格的变量名提取", () => {
      const mockDocument = {
        lineCount: 1,
        lineAt: (line: number) => ({
          text: "console.log('[debug] test:', myVar );"
        }),
        uri: { fsPath: "/test/file.js" }
      } as any;

      const items = ConsoleLogScanner.scanDocument(mockDocument);
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].variableName, "myVar");
    });

    test("应该保留正确的行号信息", () => {
      const lines = [
        "let x = 10;",
        "console.log('[debug] x:', x);"
      ];

      const mockDocument = {
        lineCount: 2,
        lineAt: (line: number) => ({
          text: lines[line]
        }),
        uri: { fsPath: "/test/file.js" }
      } as any;

      const items = ConsoleLogScanner.scanDocument(mockDocument);
      assert.strictEqual(items[0].line, 1);
    });
  });
});
