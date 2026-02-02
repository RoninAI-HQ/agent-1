import fs from "fs/promises";
import path from "path";

/**
 * List Files Tool - List files and directories in a path
 */
export default {
  name: "list_files",
  schema: {
    name: "list_files",
    description: "List files and directories in a given path. Returns names, types (file/directory), and sizes.",
    input_schema: {
      type: "object",
      properties: {
        dirpath: {
          type: "string",
          description: "The directory path to list (relative or absolute). Defaults to current directory if not provided."
        }
      },
      required: []
    }
  },
  execute: async ({ dirpath = "." }) => {
    const resolvedPath = path.resolve(dirpath);

    try {
      const entries = await fs.readdir(resolvedPath, { withFileTypes: true });

      const files = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(resolvedPath, entry.name);
          const stats = await fs.stat(fullPath);

          return {
            name: entry.name,
            type: entry.isDirectory() ? "directory" : "file",
            size: entry.isFile() ? stats.size : null,
            modifiedAt: stats.mtime.toISOString()
          };
        })
      );

      return {
        success: true,
        path: resolvedPath,
        entries: files,
        count: files.length
      };
    } catch (error) {
      if (error.code === "ENOENT") {
        return {
          success: false,
          error: `Directory not found: ${resolvedPath}`
        };
      }
      if (error.code === "ENOTDIR") {
        return {
          success: false,
          error: `Not a directory: ${resolvedPath}`
        };
      }
      throw error;
    }
  }
};
