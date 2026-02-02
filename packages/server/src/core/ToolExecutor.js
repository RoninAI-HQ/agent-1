import { EventTypes } from "@blog-agent/shared";

/**
 * Error thrown when a user denies a tool execution.
 * This aborts the agent run rather than letting the LLM work around it.
 */
export class ToolDeniedError extends Error {
  constructor(toolName) {
    super(`User denied tool '${toolName}'`);
    this.name = "ToolDeniedError";
    this.toolName = toolName;
  }
}

/**
 * ToolExecutor - Registry-based tool execution
 *
 * Executes tools by looking them up in the registry and
 * passing the appropriate context (memory, emit) to them.
 */
class ToolExecutor {
  /**
   * Create a new ToolExecutor
   * @param {ToolRegistry} registry - Tool registry instance
   * @param {WorkingMemory} memory - Working memory instance
   * @param {Function} eventEmitter - Event emitter function (type, data) => void
   * @param {PermissionManager} permissionManager - Permission manager instance (optional)
   */
  constructor(registry, memory, eventEmitter = null, permissionManager = null) {
    this.registry = registry;
    this.memory = memory;
    this.emitter = eventEmitter;
    this.permissionManager = permissionManager;
  }

  /**
   * Emit an event
   * @param {string} type - Event type
   * @param {*} data - Event data
   */
  emit(type, data) {
    if (this.emitter) {
      this.emitter(type, data);
    }
  }

  /**
   * Execute a tool by name
   * @param {string} toolName - Name of the tool to execute
   * @param {Object} input - Input parameters for the tool
   * @returns {Promise<Object>} Tool result
   */
  async execute(toolName, input) {
    this.emit(EventTypes.TOOL_START, { tool: toolName, input });

    let result;
    try {
      // Check permissions if permission manager is configured
      if (this.permissionManager) {
        const approval = await this.permissionManager.requestApproval(toolName, input);
        if (!approval.approved) {
          throw new ToolDeniedError(toolName);
        }
      }

      const executor = this.registry.getExecutor(toolName);

      if (!executor) {
        result = { error: `Unknown tool: ${toolName}` };
      } else {
        // Execute with context
        result = await executor(input, {
          memory: this.memory,
          emit: (type, data) => this.emit(type, data)
        });
      }
    } catch (error) {
      if (error instanceof ToolDeniedError) {
        throw error;
      }
      result = { error: error.message };
    }

    this.emit(EventTypes.TOOL_RESULT, { tool: toolName, result });
    return result;
  }
}

export default ToolExecutor;
