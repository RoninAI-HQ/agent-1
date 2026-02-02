import fs from "fs/promises";
import path from "path";

/**
 * Delete File Tool - Delete a file or empty directory
 */
export default {
  name: "delete_file",
  schema: {
    name: "delete_file",
    description: "Delete a file or empty directory. For safety, will not delete non-empty directories.",
    input_schema: {
      type: "object",
      properties: {
        filepath: {
          type: "string",
          description: "The path to the file or empty directory to delete"
        }
      },
      required: ["filepath"]
    }
  },
  execute: async ({ filepath }) => {
    const resolvedPath = path.resolve(filepath);

    try {
      const stats = await fs.stat(resolvedPath);

      if (stats.isDirectory()) {
        // Only delete empty directories for safety
        const contents = await fs.readdir(resolvedPath);
        if (contents.length > 0) {
          return {
            success: false,
            error: `Directory is not empty: ${resolvedPath}. Contains ${contents.length} items.`
          };
        }
        await fs.rmdir(resolvedPath);
      } else {
        await fs.unlink(resolvedPath);
      }

      return {
        success: true,
        filepath: resolvedPath,
        type: stats.isDirectory() ? "directory" : "file",
        deletedAt: new Date().toISOString()
      };
    } catch (error) {
      if (error.code === "ENOENT") {
        return {
          success: false,
          error: `File not found: ${resolvedPath}`
        };
      }
      throw error;
    }
  }
};
