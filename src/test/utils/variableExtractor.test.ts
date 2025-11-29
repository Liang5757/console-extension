import * as assert from "assert";
import { extractVariableNames } from "../../utils/variableExtractor";

suite("Variable Extractor Test Suite", () => {
  suite("extractVariableNames", () => {
    test("应该提取普通变量声明", () => {
      const text = "const userName = 'test';";
      const result = extractVariableNames(text);
      assert.deepStrictEqual(result, ["userName"]);
    });

    test("应该提取多个变量声明", () => {
      const text = `
        const firstName = 'John';
        let lastName = 'Doe';
        var age = 30;
      `;
      const result = extractVariableNames(text);
      assert.deepStrictEqual(result, ["firstName", "lastName", "age"]);
    });

    test("应该提取对象解构赋值", () => {
      const text = "const { name, age } = user;";
      const result = extractVariableNames(text);
      assert.deepStrictEqual(result, ["name", "age"]);
    });

    test("应该提取对象解构重命名", () => {
      const text = "const { oldName: newName, age } = user;";
      const result = extractVariableNames(text);
      assert.deepStrictEqual(result, ["newName", "age"]);
    });

    test("应该提取数组解构", () => {
      const text = "const [first, second] = array;";
      const result = extractVariableNames(text);
      assert.deepStrictEqual(result, ["first", "second"]);
    });

    test("应该过滤数组解构中的下划线", () => {
      const text = "const [first, _, third] = array;";
      const result = extractVariableNames(text);
      assert.deepStrictEqual(result, ["first", "third"]);
    });

    test("应该提取 if 语句中的简单变量", () => {
      const text = "if (a && b || c)";
      const result = extractVariableNames(text);
      assert.deepStrictEqual(result, ["a", "b", "c"]);
    });

    test("应该保留 if 语句中的否定运算符", () => {
      const text = "if (!flag)";
      const result = extractVariableNames(text);
      assert.deepStrictEqual(result, ["!flag"]);
    });

    test("应该保留 if 语句中的双重否定", () => {
      const text = "if (!!value)";
      const result = extractVariableNames(text);
      assert.deepStrictEqual(result, ["!!value"]);
    });

    test("应该提取 Boolean() 包装的变量", () => {
      const text = "if (Boolean(value))";
      const result = extractVariableNames(text);
      assert.deepStrictEqual(result, ["Boolean(value)"]);
    });

    test("应该提取复杂 if 条件", () => {
      const text = "if (!a && b || Boolean(c))";
      const result = extractVariableNames(text);
      assert.deepStrictEqual(result, ["!a", "b", "Boolean(c)"]);
    });

    test("应该提取多行 if 条件（带注释）", () => {
      const text = `if (
  !process.env.CI
  // rspack-ecosystem-ci would set this
  // https://github.com/rspack-contrib/rspack-ecosystem-ci/blob/113d2338da254ca341313a4a54afe789b45b1508/utils.ts#L108
  || process.env['ECOSYSTEM_CI']
) {`;
      const result = extractVariableNames(text);
      assert.deepStrictEqual(result, ["!process.env.CI", "process.env['ECOSYSTEM_CI']"]);
    });

    test("应该提取多行 if 条件（不带注释）", () => {
      const text = `if (
  !isProduction &&
  enableDebug ||
  process.env.FORCE_DEBUG
) {`;
      const result = extractVariableNames(text);
      assert.deepStrictEqual(result, ["!isProduction", "enableDebug", "process.env.FORCE_DEBUG"]);
    });

    test("应该提取多行复杂逻辑条件", () => {
      const text = `if (
  user.isAdmin &&
  !user.isBanned ||
  Boolean(user.hasPermission) &&
  user.role === 'moderator'
) {`;
      const result = extractVariableNames(text);
      assert.deepStrictEqual(result, ["user.isAdmin", "!user.isBanned", "Boolean(user.hasPermission)", "user.role"]);
    });

    test("应该过滤 if 语句中的布尔字面量", () => {
      const text = "if (flag && true || false)";
      const result = extractVariableNames(text);
      assert.deepStrictEqual(result, ["flag"]);
    });

    test("应该过滤 null 和 undefined", () => {
      const text = "if (value && null || undefined)";
      const result = extractVariableNames(text);
      assert.deepStrictEqual(result, ["value"]);
    });

    test("应该对提取的变量去重", () => {
      const text = `
        const a = 1;
        const a = 2;
        if (a && a)
      `;
      const result = extractVariableNames(text);
      assert.deepStrictEqual(result, ["a"]);
    });

    test("应该提取对象属性访问", () => {
      const text = "if (user.name && user.isActive)";
      const result = extractVariableNames(text);
      assert.deepStrictEqual(result, ["user.name", "user.isActive"]);
    });

    test("应该处理混合场景", () => {
      const text = `
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
          return;
        }
        const fileUri = activeEditor.document.uri;
      `;
      const result = extractVariableNames(text);
      // 顺序：按代码顺序提取，先第一个声明，再第二个声明，再 if 条件
      // 但由于 Set 去重，最终顺序为：activeEditor, fileUri, !activeEditor
      assert.deepStrictEqual(result, [
        "activeEditor",
        "fileUri",
        "!activeEditor",
      ]);
    });

    test("没有变量时返回空数组", () => {
      const text = "const = 123;"; // 无效语法
      const result = extractVariableNames(text);
      assert.deepStrictEqual(result, []);
    });

    test("空字符串返回空数组", () => {
      const text = "";
      const result = extractVariableNames(text);
      assert.deepStrictEqual(result, []);
    });
  });
});
