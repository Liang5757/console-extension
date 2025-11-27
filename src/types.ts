/**
 * 选中的变量信息
 */
export interface SelectedVariable {
  text: string;
  line: number;
  indent: string;
  /**
   * 是否为占位符（变量提取失败，需要用户手动输入）
   * 为 true 时，应使用 snippet 方式而不是直接插入
   */
  isPlaceholder?: boolean;
}
