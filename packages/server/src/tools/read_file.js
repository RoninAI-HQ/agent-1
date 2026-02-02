import fs from "fs/promises";
import path from "path";

/**
 * Read File Tool - Read content from a file
 */
export default {
  name: "read_file",
  schema: {
    name: "read_file",
    description: "Read the contents of a file. Returns the file content as text.",
    input_schema: {
      type: "object",
      properties: {
        filepath: {
          type: "string",
          description: "The path to the file to read (relative or absolute)"
        }
      },
      required: ["filepath"]
    }
  },
  execute: async ({ filepath }) => {
    const resolvedPath = path.resolve(filepath);

    try {
      const content = await fs.readFile(resolvedPath, "utf-8");
      const stats = await fs.stat(resolvedPath);

      return {
        success: true,
        filepath: resolvedPath,
        content,
        size: stats.size,
        modifiedAt: stats.mtime.toISOString()
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
