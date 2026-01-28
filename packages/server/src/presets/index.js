import blogPreset from "./blog/index.js";
import generalPreset from "./general/index.js";

/**
 * Preset Registry
 *
 * Manages loading and registration of agent presets.
 * Presets define the configuration for specific agent workflows.
 */

// Built-in presets
const presets = new Map();

// Register built-in presets
presets.set("blog", blogPreset);
presets.set("general", generalPreset);

/**
 * Get a preset by name
 * @param {string} name - Preset name
 * @returns {Object|undefined} Preset configuration or undefined
 */
export function getPreset(name) {
  return presets.get(name);
}

/**
 * List all available presets
 * @returns {Array<Object>} Array of preset info objects
 */
export function listPresets() {
  return Array.from(presets.values()).map(preset => ({
    name: preset.name,
    displayName: preset.displayName,
    description: preset.description
  }));
}

/**
 * Register a custom preset
 * @param {Object} preset - Preset configuration
 */
export function registerPreset(preset) {
  if (!preset.name) {
    throw new Error("Preset must have a name");
  }
  presets.set(preset.name, preset);
}

/**
 * Check if a preset exists
 * @param {string} name - Preset name
 * @returns {boolean}
 */
export function hasPreset(name) {
  return presets.has(name);
}

export default {
  getPreset,
  listPresets,
  registerPreset,
  hasPreset
};
