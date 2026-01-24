import tavilyClient from "./tavilyClient.js";

class ToolExecutor {
  constructor(workingMemory) {
    this.memory = workingMemory;
  }

  async execute(toolName, input) {
    console.log(`\n   Executing: ${toolName}`);

    switch (toolName) {
      case "web_search":
        return this.webSearch(input);
      case "save_research_note":
        return this.saveResearchNote(input);
      case "create_outline":
        return this.createOutline(input);
      case "write_section":
        return this.writeSection(input);
      case "compile_draft":
        return this.compileDraft(input);
      case "edit_draft":
        return this.editDraft(input);
      case "finalize_article":
        return this.finalizeArticle(input);
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }

  async webSearch({ query }) {
    console.log(`      Searching: "${query}"`);

    const response = await tavilyClient.search(query);

    const results = response.results.map((result) => ({
      title: result.title,
      snippet: result.content,
      source: new URL(result.url).hostname,
      url: result.url,
      score: result.score
    }));

    return {
      query,
      results,
      resultCount: results.length
    };
  }

  saveResearchNote({ topic, content, source }) {
    const note = { topic, content, source: source || "research", timestamp: Date.now() };
    this.memory.addResearch(note);
    console.log(`      Saved note on: ${topic}`);
    return { success: true, noteCount: this.memory.research.length };
  }

  createOutline({ title, sections, target_length }) {
    this.memory.outline = { title, sections, target_length };
    console.log(`      Created outline: "${title}" with ${sections.length} sections`);
    return {
      success: true,
      title,
      sectionCount: sections.length,
      sections: sections.map(s => s.heading)
    };
  }

  writeSection({ section_heading, content }) {
    if (!this.memory.sections) {
      this.memory.sections = {};
    }
    this.memory.sections[section_heading] = content;
    const wordCount = content.split(/\s+/).length;
    console.log(`      Wrote section: "${section_heading}" (${wordCount} words)`);
    return { success: true, section: section_heading, wordCount };
  }

  compileDraft({ full_draft }) {
    this.memory.draft = full_draft;
    const wordCount = full_draft.split(/\s+/).length;
    console.log(`      Compiled draft: ${wordCount} words`);
    return { success: true, wordCount, preview: full_draft.substring(0, 200) + "..." };
  }

  editDraft({ edit_type, edited_content, changes_made }) {
    this.memory.draft = edited_content;
    const wordCount = edited_content.split(/\s+/).length;
    console.log(`      Applied ${edit_type} edits: ${changes_made.substring(0, 100)}`);
    return { success: true, editType: edit_type, wordCount, changes: changes_made };
  }

  finalizeArticle({ final_article, word_count }) {
    this.memory.finalArticle = final_article;
    console.log(`      Article finalized: ${word_count} words`);
    return { success: true, wordCount: word_count, complete: true };
  }
}

export default ToolExecutor;
