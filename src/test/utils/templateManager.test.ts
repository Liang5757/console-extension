import * as assert from "assert";
import { applyTemplate, templateToSnippet, buildLogStatement } from "../../utils/templateManager";

suite("Template Manager Test Suite", () => {
  suite("applyTemplate", () => {
    test("应该替换单个变量占位符", () => {
      const template = "console.log('{variable}:', {variable});";
      const result = applyTemplate(template, "userName");
      assert.strictEqual(result, "console.log('userName:', userName);");
    });

    test("应该替换多个变量占位符", () => {
      const template = "console.log('[{variable}]:', {variable});";
      const result = applyTemplate(template, "count");
      assert.strictEqual(result, "console.log('[count]:', count);");
    });

    test("应该替换包含前缀的变量", () => {
      const template = "console.log('{variable}:', {variable});";
      const result = applyTemplate(template, "!flag");
      assert.strictEqual(result, "console.log('!flag:', !flag);");
    });

    test("应该替换包含对象属性的变量", () => {
      const template = "console.log('{variable}:', {variable});";
      const result = applyTemplate(template, "user.name");
      assert.strictEqual(result, "console.log('user.name:', user.name);");
    });

    test("应该替换包含函数调用的变量", () => {
      const template = "console.log('{variable}:', {variable});";
      const result = applyTemplate(template, "Boolean(value)");
      assert.strictEqual(
        result,
        "console.log('Boolean(value):', Boolean(value));"
      );
    });

    test("应该处理默认模板", () => {
      const template = "console.log('[debug log]{variable}:', {variable});";
      const result = applyTemplate(template, "data");
      assert.strictEqual(result, "console.log('[debug log]data:', data);");
    });

    test("模板中没有占位符时返回原模板", () => {
      const template = "console.log('test');";
      const result = applyTemplate(template, "anyVar");
      assert.strictEqual(result, "console.log('test');");
    });

    test("空变量名应该正常替换", () => {
      const template = "console.log('{variable}:', {variable});";
      const result = applyTemplate(template, "");
      assert.strictEqual(result, "console.log(':', );");
    });
  });

  suite("buildLogStatement - 引号冲突处理", () => {
    test("变量名包含单引号时应该使用双引号", () => {
      const variableName = "process.env['ECOSYSTEM_CI']";
      const result = buildLogStatement(variableName);
      // 应该使用双引号避免冲突
      assert.strictEqual(
        result,
        `console.log("[debug] process.env['ECOSYSTEM_CI']:", process.env['ECOSYSTEM_CI']);`
      );
    });

    test("变量名包含双引号时应该使用单引号", () => {
      const variableName = 'obj["key"]';
      const result = buildLogStatement(variableName);
      // 应该使用单引号避免冲突
      assert.strictEqual(
        result,
        `console.log('[debug] obj["key"]:', obj["key"]);`
      );
    });

    test("变量名同时包含单引号和双引号时应该使用反引号", () => {
      const variableName = `obj["key"]['value']`;
      const result = buildLogStatement(variableName);
      // 应该使用反引号避免冲突
      assert.strictEqual(
        result,
        `console.log(\`[debug] obj["key"]['value']:\`, obj["key"]['value']);`
      );
    });

    test("普通变量名应该使用配置的引号", () => {
      const variableName = "userName";
      const result = buildLogStatement(variableName);
      // 默认配置使用单引号
      assert.strictEqual(result, "console.log('[debug] userName:', userName);");
    });
  });

  suite("templateToSnippet", () => {
    test("应该转换为 snippet 格式", () => {
      const template = "console.log('{variable}:', {variable});";
      const result = templateToSnippet(template);
      assert.strictEqual(
        result,
        "console.log('${1:variable}:', ${1:variable});"
      );
    });

    test("应该转换默认模板为 snippet 格式", () => {
      const template = "console.log('[debug log]{variable}:', {variable});";
      const result = templateToSnippet(template);
      assert.strictEqual(
        result,
        "console.log('[debug log]${1:variable}:', ${1:variable});"
      );
    });

    test("应该转换多个占位符", () => {
      const template = "{variable} = {variable}";
      const result = templateToSnippet(template);
      assert.strictEqual(result, "${1:variable} = ${1:variable}");
    });

    test("模板中没有占位符时返回原模板", () => {
      const template = "console.log('test');";
      const result = templateToSnippet(template);
      assert.strictEqual(result, "console.log('test');");
    });

    test("空模板应该返回空字符串", () => {
      const template = "";
      const result = templateToSnippet(template);
      assert.strictEqual(result, "");
    });
  });
});
