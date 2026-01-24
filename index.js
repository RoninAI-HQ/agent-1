import BlogWritingAgent from "./src/BlogWritingAgent.js";

async function main() {
  const agent = new BlogWritingAgent({ verbose: true });

  const blogIdea = "Write a short blog article about the top 3 coding agents available on the market in 2025.";

  const result = await agent.run(blogIdea);

  console.log("\n" + "=".repeat(60));
  console.log("FINAL ARTICLE:");
  console.log("=".repeat(60));
  console.log(result.article);

  console.log("\n" + "=".repeat(60));
  console.log("STATS:");
  console.log(JSON.stringify(result.stats, null, 2));
  console.log("=".repeat(60));
}

main().catch(console.error);
