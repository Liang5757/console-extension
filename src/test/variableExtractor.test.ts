import * as assert from "assert";
import { extractVariableNames } from "../utils/variableExtractor";

suite("Variable Extractor Test Suite", () => {
  suite("Optional Chaining Support", () => {
    test("should extract optional chaining as a whole - single level", () => {
      const code = "if (user?.name)";
      const result = extractVariableNames(code);
      assert.deepStrictEqual(result, ["user?.name"]);
    });

    test("should extract optional chaining as a whole - multiple levels", () => {
      const code = "if (userConfig?.performance?.chunkSplit?.strategy)";
      const result = extractVariableNames(code);
      assert.deepStrictEqual(result, ["userConfig?.performance?.chunkSplit?.strategy"]);
    });

    test("should extract negated optional chaining", () => {
      const code = "if (!userConfig?.performance?.chunkSplit?.strategy)";
      const result = extractVariableNames(code);
      assert.deepStrictEqual(result, ["!userConfig?.performance?.chunkSplit?.strategy"]);
    });

    test("should extract double negated optional chaining", () => {
      const code = "if (!!user?.profile?.settings)";
      const result = extractVariableNames(code);
      assert.deepStrictEqual(result, ["!!user?.profile?.settings"]);
    });

    test("should extract mixed optional and regular chaining", () => {
      const code = "if (user?.profile.name)";
      const result = extractVariableNames(code);
      assert.deepStrictEqual(result, ["user?.profile.name"]);
    });

    test("should extract multiple optional chaining expressions", () => {
      const code = "if (user?.name && config?.settings)";
      const result = extractVariableNames(code);
      assert.deepStrictEqual(result, ["user?.name", "config?.settings"]);
    });

    test("should extract optional chaining with bracket access", () => {
      const code = "if (user?.['profile']?.name)";
      const result = extractVariableNames(code);
      assert.deepStrictEqual(result, ["user?.['profile']?.name"]);
    });

    test("should extract optional chaining in complex conditions", () => {
      const code = "if (!userConfig?.performance?.chunkSplit?.strategy && options?.enabled)";
      const result = extractVariableNames(code);
      assert.deepStrictEqual(result, ["!userConfig?.performance?.chunkSplit?.strategy", "options?.enabled"]);
    });
  });

  suite("Regular Property Access", () => {
    test("should extract simple variable", () => {
      const code = "if (user)";
      const result = extractVariableNames(code);
      assert.deepStrictEqual(result, ["user"]);
    });

    test("should extract nested property access", () => {
      const code = "if (user.name)";
      const result = extractVariableNames(code);
      assert.deepStrictEqual(result, ["user.name"]);
    });

    test("should extract deep nested property access", () => {
      const code = "if (user.profile.settings.theme)";
      const result = extractVariableNames(code);
      assert.deepStrictEqual(result, ["user.profile.settings.theme"]);
    });

    test("should extract bracket notation", () => {
      const code = "if (user['name'])";
      const result = extractVariableNames(code);
      assert.deepStrictEqual(result, ["user['name']"]);
    });
  });

  suite("Negation Operators", () => {
    test("should extract negated variable", () => {
      const code = "if (!flag)";
      const result = extractVariableNames(code);
      assert.deepStrictEqual(result, ["!flag"]);
    });

    test("should extract double negated variable", () => {
      const code = "if (!!value)";
      const result = extractVariableNames(code);
      assert.deepStrictEqual(result, ["!!value"]);
    });
  });

  suite("Variable Declarations", () => {
    test("should extract from const declaration", () => {
      const code = "const userName = 'test';";
      const result = extractVariableNames(code);
      assert.deepStrictEqual(result, ["userName"]);
    });

    test("should extract from object destructuring", () => {
      const code = "const { name, age } = user;";
      const result = extractVariableNames(code);
      assert.deepStrictEqual(result, ["name", "age"]);
    });

    test("should extract from array destructuring", () => {
      const code = "const [first, second] = items;";
      const result = extractVariableNames(code);
      assert.deepStrictEqual(result, ["first", "second"]);
    });
  });

  suite("Complex Scenarios", () => {
    test("should handle multiple variables in condition", () => {
      const code = "if (a && b || c)";
      const result = extractVariableNames(code);
      assert.deepStrictEqual(result, ["a", "b", "c"]);
    });

    test("should exclude literals and keywords", () => {
      const code = "if (flag === true && value !== null)";
      const result = extractVariableNames(code);
      assert.deepStrictEqual(result, ["flag", "value"]);
    });
  });
});
