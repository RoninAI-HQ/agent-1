/**
 * ToolRegistry - Dynamic tool registration and management
 *
 * Allows presets to register tools dynamically and provides
 * methods for looking up tool schemas and executors.
 */
class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  /**
   * Register a single tool
   * @param {Object} tool - Tool definition
   * @param {string} tool.name - Unique tool identifier
   * @param {Object} tool.schema - Claude API tool schema
   * @param {Function} tool.execute - Async function (input, context) => result
   */
  register(tool) {
    if (!tool.name) {
      throw new Error("Tool must have a name");
    }
    if (!tool.schema) {
      throw new Error(`Tool "${tool.name}" must have a schema`);
    }
    if (typeof tool.execute !== "function") {
      throw new Error(`Tool "${tool.name}" must have an execute function`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Register multiple tools at once
   * @param {Array<Object>} tools - Array of tool definitions
   */
  registerMany(tools) {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  /**
   * Get a tool by name
   * @param {string} name - Tool name
   * @returns {Object|undefined} Tool definition or undefined
   */
  get(name) {
    return this.tools.get(name);
  }

  /**
   * Check if a tool exists
   * @param {string} name - Tool name
   * @returns {boolean}
   */
  has(name) {
    return this.tools.has(name);
  }

  /**
   * Get tool schemas for Claude API
   * @param {Array<string>} [names] - Tool names (all if not specified)
   * @returns {Array<Object>} Array of tool schemas
   */
  getSchemas(names) {
    const toolNames = names || Array.from(this.tools.keys());
    return toolNames
      .filter(name => this.tools.has(name))
      .map(name => this.tools.get(name).schema);
  }

  /**
   * Get a tool's execute function
   * @param {string} name - Tool name
   * @returns {Function|undefined} Execute function or undefined
   */
  getExecutor(name) {
    const tool = this.tools.get(name);
    return tool ? tool.execute : undefined;
  }

  /**
   * List all registered tool names
   * @returns {Array<string>} Tool names
   */
  list() {
    return Array.from(this.tools.keys());
  }

  /**
   * Clear all registered tools
   */
  clear() {
    this.tools.clear();
  }
}

export default ToolRegistry;
