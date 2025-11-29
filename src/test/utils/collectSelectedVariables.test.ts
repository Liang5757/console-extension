import * as assert from "assert";
import * as vscode from "vscode";
import { collectSelectedVariables } from "../../utils/variableExtractor";

suite("Collect Selected Variables Test Suite", () => {
  test("未选中文本时应该提取当前行的变量", async () => {
    // 创建一个测试文档
    const document = await vscode.workspace.openTextDocument({
      content: "const userName = 'test';\nconst age = 30;\n",
      language: "javascript",
    });

    const editor = await vscode.window.showTextDocument(document);

    // 将光标放在第一行（不选中任何文本）
    editor.selection = new vscode.Selection(
      new vscode.Position(0, 0),
      new vscode.Position(0, 0)
    );

    const selectedVariables = collectSelectedVariables(editor);

    // 应该提取到 userName 变量
    assert.strictEqual(selectedVariables.length, 1);
    assert.strictEqual(selectedVariables[0].text, "userName");
    assert.strictEqual(selectedVariables[0].line, 0);

    // 清理
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  });

  test("未选中文本且当前行是 if 语句时应该提取条件变量", async () => {
    const document = await vscode.workspace.openTextDocument({
      content: "if (!process.env.CI || process.env['ECOSYSTEM_CI']) {\n  console.log('test');\n}\n",
      language: "javascript",
    });

    const editor = await vscode.window.showTextDocument(document);

    // 将光标放在第一行（if 语句）
    editor.selection = new vscode.Selection(
      new vscode.Position(0, 0),
      new vscode.Position(0, 0)
    );

    const selectedVariables = collectSelectedVariables(editor);

    // 应该提取到两个变量
    assert.strictEqual(selectedVariables.length, 2);
    assert.strictEqual(selectedVariables[0].text, "!process.env.CI");
    assert.strictEqual(selectedVariables[1].text, "process.env['ECOSYSTEM_CI']");

    // 清理
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  });

  test("未选中文本且当前行无法提取变量时应该创建占位符", async () => {
    const document = await vscode.workspace.openTextDocument({
      content: "// This is a comment\nconst a = 1;\n",
      language: "javascript",
    });

    const editor = await vscode.window.showTextDocument(document);

    // 将光标放在第一行（注释行）
    editor.selection = new vscode.Selection(
      new vscode.Position(0, 0),
      new vscode.Position(0, 0)
    );

    const selectedVariables = collectSelectedVariables(editor);

    // 应该创建一个占位符
    assert.strictEqual(selectedVariables.length, 1);
    assert.strictEqual(selectedVariables[0].text, "");
    assert.strictEqual(selectedVariables[0].isPlaceholder, true);

    // 清理
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  });

  test("选中文本时应该优先提取选中的文本", async () => {
    const document = await vscode.workspace.openTextDocument({
      content: "const userName = 'test';\nconst age = 30;\n",
      language: "javascript",
    });

    const editor = await vscode.window.showTextDocument(document);

    // 选中 "userName"
    editor.selection = new vscode.Selection(
      new vscode.Position(0, 6),
      new vscode.Position(0, 14)
    );

    const selectedVariables = collectSelectedVariables(editor);

    // 应该只提取选中的 userName
    assert.strictEqual(selectedVariables.length, 1);
    assert.strictEqual(selectedVariables[0].text, "userName");

    // 清理
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  });

  test("未选中文本且当前行有多个变量时应该提取所有变量", async () => {
    const document = await vscode.workspace.openTextDocument({
      content: "const { name, age, email } = user;\n",
      language: "javascript",
    });

    const editor = await vscode.window.showTextDocument(document);

    // 将光标放在行中
    editor.selection = new vscode.Selection(
      new vscode.Position(0, 10),
      new vscode.Position(0, 10)
    );

    const selectedVariables = collectSelectedVariables(editor);

    // 应该提取到三个变量
    assert.strictEqual(selectedVariables.length, 3);
    assert.strictEqual(selectedVariables[0].text, "name");
    assert.strictEqual(selectedVariables[1].text, "age");
    assert.strictEqual(selectedVariables[2].text, "email");

    // 清理
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  });

  test("多光标情况下应该提取每行的变量", async () => {
    const document = await vscode.workspace.openTextDocument({
      content: "const a = 1;\nconst b = 2;\nconst c = 3;\n",
      language: "javascript",
    });

    const editor = await vscode.window.showTextDocument(document);

    // 设置多个光标（三行）
    editor.selections = [
      new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(0, 0)),
      new vscode.Selection(new vscode.Position(1, 0), new vscode.Position(1, 0)),
      new vscode.Selection(new vscode.Position(2, 0), new vscode.Position(2, 0)),
    ];

    const selectedVariables = collectSelectedVariables(editor);

    // 应该提取到三个变量（每行一个）
    assert.strictEqual(selectedVariables.length, 3);
    assert.strictEqual(selectedVariables[0].text, "a");
    assert.strictEqual(selectedVariables[1].text, "b");
    assert.strictEqual(selectedVariables[2].text, "c");

    // 清理
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  });

  test("光标在空白行时应该创建占位符", async () => {
    const document = await vscode.workspace.openTextDocument({
      content: "const a = 1;\n\nconst b = 2;\n",
      language: "javascript",
    });

    const editor = await vscode.window.showTextDocument(document);

    // 将光标放在空白行（第1行，索引为1）
    editor.selection = new vscode.Selection(
      new vscode.Position(1, 0),
      new vscode.Position(1, 0)
    );

    const selectedVariables = collectSelectedVariables(editor);

    // 应该创建一个占位符
    assert.strictEqual(selectedVariables.length, 1);
    assert.strictEqual(selectedVariables[0].text, "");
    assert.strictEqual(selectedVariables[0].isPlaceholder, true);
    assert.strictEqual(selectedVariables[0].line, 1);

    // 清理
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  });
});
