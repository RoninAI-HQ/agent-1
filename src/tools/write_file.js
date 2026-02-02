import fs from "fs/promises";
import path from "path";

/**
 * Write File Tool - Write content to a file (creates if doesn't exist)
 */
export default {
  name: "write_file",
  schema: {
    name: "write_file",
    description: "Write content to a file. Creates the file if it doesn't exist, or overwrites if it does. Also creates parent directories if needed.",
    input_schema: {
      type: "object",
      properties: {
        filepath: {
          type: "string",
          description: "The path to the file to write (relative or absolute)"
        },
        content: {
          type: "string",
          description: "The content to write to the file"
        }
      },
      required: ["filepath", "content"]
    }
  },
  execute: async ({ filepath, content }) => {
    const resolvedPath = path.resolve(filepath);
    const dir = path.dirname(resolvedPath);

    // Ensure parent directory exists
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(resolvedPath, content, "utf-8");
    const stats = await fs.stat(resolvedPath);

    return {
      success: true,
      filepath: resolvedPath,
      bytesWritten: stats.size,
      createdAt: stats.birthtime.toISOString()
    };
  }
};
