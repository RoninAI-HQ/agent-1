import fs from "fs/promises";
import path from "path";
import { EventTypes } from "@blog-agent/shared";

/**
 * PermissionManager - Human-in-the-loop tool approval system
 *
 * Manages tool permissions, prompting users for approval before
 * executing potentially dangerous tools. Permissions can be persisted
 * to allow tools "always" without future prompts.
 */
class PermissionManager {
  // Tools that never require approval
  static SAFE_TOOLS = ["think", "save_note", "store_result", "complete_task"];

  static PERMISSIONS_FILE = ".agent-permissions.json";

  /**
   * Create a new PermissionManager
   * @param {string} workingDirectory - Directory to store permissions file
   * @param {Object} options - Configuration options
   * @param {Function} options.emit - Event emitter function
   */
  constructor(workingDirectory, options = {}) {
    this.workingDirectory = workingDirectory;
    this.permissionsPath = path.join(workingDirectory, PermissionManager.PERMISSIONS_FILE);
    this.emit = options.emit || (() => {});

    this.permissions = {
      version: 1,
      always_allow: [],
      updated_at: null
    };

    this.approvalHandler = null;
    this.loaded = false;
  }

  /**
   * Load permissions from .agent-permissions.json
   * @returns {Promise<Object>} Loaded permissions
   */
  async loadPermissions() {
    try {
      const data = await fs.readFile(this.permissionsPath, "utf-8");
      this.permissions = JSON.parse(data);
      this.loaded = true;
    } catch (error) {
      // File doesn't exist or is invalid - use defaults
      this.permissions = {
        version: 1,
        always_allow: [],
        updated_at: null
      };
      this.loaded = true;
    }
    return this.permissions;
  }

  /**
   * Save permissions to .agent-permissions.json
   * @returns {Promise<void>}
   */
  async savePermissions() {
    this.permissions.updated_at = new Date().toISOString();
    await fs.writeFile(
      this.permissionsPath,
      JSON.stringify(this.permissions, null, 2),
      "utf-8"
    );
  }

  /**
   * Check if a tool is inherently safe (never requires approval)
   * @param {string} toolName - Name of the tool
   * @returns {boolean}
   */
  isSafeTool(toolName) {
    return PermissionManager.SAFE_TOOLS.includes(toolName);
  }

  /**
   * Check if a tool is in the always_allow list
   * @param {string} toolName - Name of the tool
   * @returns {boolean}
   */
  isAlwaysAllowed(toolName) {
    return this.permissions.always_allow.includes(toolName);
  }

  /**
   * Add a tool to the always_allow list and persist
   * @param {string} toolName - Name of the tool
   * @returns {Promise<void>}
   */
  async addAlwaysAllow(toolName) {
    if (!this.permissions.always_allow.includes(toolName)) {
      this.permissions.always_allow.push(toolName);
      await this.savePermissions();
    }
  }

  /**
   * Set the approval handler function
   * @param {Function} handler - Async function that returns { approved: boolean, persist: boolean }
   */
  setApprovalHandler(handler) {
    this.approvalHandler = handler;
  }

  /**
   * Check if a tool requires approval
   * @param {string} toolName - Name of the tool
   * @returns {boolean} True if approval is needed
   */
  requiresApproval(toolName) {
    // Safe tools never require approval
    if (this.isSafeTool(toolName)) {
      return false;
    }

    // Already allowed tools don't require approval
    if (this.isAlwaysAllowed(toolName)) {
      return false;
    }

    return true;
  }

  /**
   * Request approval for a tool execution
   * @param {string} toolName - Name of the tool
   * @param {Object} input - Tool input parameters
   * @returns {Promise<{approved: boolean, persist: boolean}>}
   */
  async requestApproval(toolName, input) {
    // Ensure permissions are loaded
    if (!this.loaded) {
      await this.loadPermissions();
    }

    // Check if tool is already allowed
    if (!this.requiresApproval(toolName)) {
      return { approved: true, persist: false };
    }

    // Emit approval required event
    this.emit(EventTypes.APPROVAL_REQUIRED, { tool: toolName, input });

    // If no handler is set, deny by default
    if (!this.approvalHandler) {
      this.emit(EventTypes.APPROVAL_DENIED, { tool: toolName, reason: "No approval handler" });
      return { approved: false, persist: false };
    }

    // Call the approval handler
    const result = await this.approvalHandler(toolName, input);

    if (result.approved && result.persist) {
      await this.addAlwaysAllow(toolName);
    }

    if (!result.approved) {
      this.emit(EventTypes.APPROVAL_DENIED, { tool: toolName, reason: "User denied" });
    }

    return result;
  }
}

export default PermissionManager;
