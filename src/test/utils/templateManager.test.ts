import * as assert from "assert";
import { applyTemplate, templateToSnippet } from "../../utils/templateManager";

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
