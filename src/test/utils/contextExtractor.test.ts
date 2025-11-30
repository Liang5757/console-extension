import * as assert from "assert";
import * as vscode from "vscode";
import { extractContextName } from "../../utils/contextExtractor";

/**
 * 创建模拟的 VS Code 文档用于测试
 */
function createMockDocument(code: string): vscode.TextDocument {
  const lines = code.split('\n');

  return {
    getText: (range?: vscode.Range) => {
      if (!range) {
        return code;
      }
      const startLine = range.start.line;
      const endLine = range.end.line;
      const startChar = range.start.character;
      const endChar = range.end.character;

      if (startLine === endLine) {
        return lines[startLine].substring(startChar, endChar);
      }

      const result: string[] = [];
      for (let i = startLine; i <= endLine; i++) {
        if (i === startLine) {
          result.push(lines[i].substring(startChar));
        } else if (i === endLine) {
          result.push(lines[i].substring(0, endChar));
        } else {
          result.push(lines[i]);
        }
      }
      return result.join('\n');
    },
    lineAt: (lineOrPos: number | vscode.Position) => {
      const lineNumber = typeof lineOrPos === 'number' ? lineOrPos : lineOrPos.line;
      const lineText = lines[lineNumber] || '';

      return {
        text: lineText,
        lineNumber,
        range: new vscode.Range(lineNumber, 0, lineNumber, lineText.length),
        rangeIncludingLineBreak: new vscode.Range(lineNumber, 0, lineNumber + 1, 0),
        firstNonWhitespaceCharacterIndex: lineText.search(/\S/),
        isEmptyOrWhitespace: lineText.trim().length === 0,
      } as vscode.TextLine;
    },
    lineCount: lines.length,
  } as any as vscode.TextDocument;
}

suite("Context Extractor Test Suite", () => {
  suite("extractContextName", () => {
    test("应该提取普通函数声明", () => {
      const code = `function testFunction() {
  const x = 1;
  console.log(x);
}`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 2);
      assert.strictEqual(result, "testFunction");
    });

    test("应该提取类声明", () => {
      const code = `class TestClass {
  someMethod() {
    console.log('test');
  }
}`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 2);
      assert.strictEqual(result, "someMethod"); // 在方法内部，应该返回方法名
    });

    test("应该提取类方法", () => {
      const code = `class TestClass {
  myMethod() {
    const x = 1;
    console.log(x);
  }
}`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 3);
      assert.strictEqual(result, "myMethod");
    });

    test("应该提取箭头函数赋值", () => {
      const code = `const myFunction = () => {
  const x = 1;
  console.log(x);
};`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 2);
      assert.strictEqual(result, "myFunction");
    });

    test("应该提取带参数的箭头函数", () => {
      const code = `const myFunction = (param1, param2) => {
  const x = 1;
  console.log(x);
};`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 2);
      assert.strictEqual(result, "myFunction");
    });

    test("应该提取多行 TypeScript 类型注解的箭头函数", () => {
      const code = `export const applySplitChunksRule: (
  api: RsbuildPluginAPI,
) => void = (api): void => {
  api.modifyBundlerChain((chain, { environment }) => {
    const config = environment.config;
    if (config.performance.chunkSplit.strategy !== 'split-by-experience') {
      return;
    }
  });
};`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 6);
      assert.strictEqual(result, "applySplitChunksRule");
    });

    test("应该提取对象方法（简写形式）", () => {
      const code = `const obj = {
  myMethod() {
    const x = 1;
    console.log(x);
  }
};`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 3);
      assert.strictEqual(result, "myMethod");
    });

    test("应该提取对象方法（箭头函数形式）", () => {
      const code = `const obj = {
  myMethod: () => {
    const x = 1;
    console.log(x);
  }
};`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 3);
      assert.strictEqual(result, "myMethod");
    });

    test("应该提取对象方法（完整形式）", () => {
      const code = `const obj = {
  myMethod: function() {
    const x = 1;
    console.log(x);
  }
};`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 3);
      assert.strictEqual(result, "myMethod");
    });

    test("应该提取嵌套函数中最内层的函数名", () => {
      const code = `function outerFunction() {
  const innerFunction = () => {
    const x = 1;
    console.log(x);
  };
}`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 3);
      assert.strictEqual(result, "innerFunction");
    });

    test("不应该将 if 语句识别为函数", () => {
      const code = `function testFunction() {
  if (condition) {
    console.log('test');
  }
}`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 2);
      assert.strictEqual(result, "testFunction");
    });

    test("不应该将 for 循环识别为函数", () => {
      const code = `function testFunction() {
  for (let i = 0; i < 10; i++) {
    console.log(i);
  }
}`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 2);
      assert.strictEqual(result, "testFunction");
    });

    test("不应该将 while 循环识别为函数", () => {
      const code = `function testFunction() {
  while (condition) {
    console.log('test');
  }
}`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 2);
      assert.strictEqual(result, "testFunction");
    });

    test("应该提取 async 函数", () => {
      const code = `async function asyncFunction() {
  const x = await fetch();
  console.log(x);
}`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 2);
      assert.strictEqual(result, "asyncFunction");
    });

    test("应该提取 async 箭头函数", () => {
      const code = `const asyncFunc = async () => {
  const x = await fetch();
  console.log(x);
};`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 2);
      assert.strictEqual(result, "asyncFunc");
    });

    test("应该提取 async 类方法", () => {
      const code = `class TestClass {
  async myMethod() {
    const x = await fetch();
    console.log(x);
  }
}`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 3);
      assert.strictEqual(result, "myMethod");
    });

    test("应该处理复杂的嵌套回调", () => {
      const code = `const mainFunction = () => {
  api.modifyBundlerChain((chain, { environment }) => {
    const config = environment.config;
    console.log(config);
  });
};`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 3);
      assert.strictEqual(result, "mainFunction");
    });

    test("当没有包含的函数时应该返回 undefined", () => {
      const code = `const x = 1;
console.log(x);
const y = 2;`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 1);
      assert.strictEqual(result, undefined);
    });

    test("应该处理箭头函数作为参数", () => {
      const code = `function setupHandlers() {
  button.addEventListener('click', () => {
    console.log('clicked');
  });
}`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 2);
      assert.strictEqual(result, "setupHandlers");
    });

    test("应该提取带泛型的函数", () => {
      const code = `function genericFunction<T>(param: T) {
  console.log(param);
}`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 1);
      assert.strictEqual(result, "genericFunction");
    });

    test("应该提取带复杂类型注解的箭头函数", () => {
      const code = `const complexFunc: <T extends string>(param: T) => void = (param) => {
  console.log(param);
};`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 1);
      assert.strictEqual(result, "complexFunc");
    });

    test("应该提取 export 的函数", () => {
      const code = `export function exportedFunction() {
  console.log('test');
}`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 1);
      assert.strictEqual(result, "exportedFunction");
    });

    test("应该提取 export const 箭头函数", () => {
      const code = `export const exportedArrow = () => {
  console.log('test');
};`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 1);
      assert.strictEqual(result, "exportedArrow");
    });

    test("应该处理深度嵌套的函数，返回最内层的", () => {
      const code = `function outer() {
  function middle() {
    const inner = () => {
      console.log('test');
    };
  }
}`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 3);
      assert.strictEqual(result, "inner");
    });

    test("应该提取构造函数", () => {
      const code = `class TestClass {
  constructor() {
    console.log('constructed');
  }
}`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 2);
      assert.strictEqual(result, "constructor");
    });

    test("应该提取 getter 方法", () => {
      const code = `class TestClass {
  get value() {
    console.log('getting value');
    return this._value;
  }
}`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 2);
      assert.strictEqual(result, "value");
    });

    test("应该提取 setter 方法", () => {
      const code = `class TestClass {
  set value(val) {
    console.log('setting value');
    this._value = val;
  }
}`;
      const doc = createMockDocument(code);
      const result = extractContextName(doc, 2);
      assert.strictEqual(result, "value");
    });
  });
});
