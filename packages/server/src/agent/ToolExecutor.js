import getTavilyClient from "./tavilyClient.js";
import { EventTypes } from "@blog-agent/shared";

class ToolExecutor {
  constructor(workingMemory, eventEmitter = null) {
    this.memory = workingMemory;
    this.emitter = eventEmitter;
  }

  emit(type, data) {
    if (this.emitter) {
      this.emitter(type, data);
    }
  }

  async execute(toolName, input) {
    this.emit(EventTypes.TOOL_START, { tool: toolName, input });

    let result;
    try {
      switch (toolName) {
        case "web_search":
          result = await this.webSearch(input);
          break;
        case "save_research_note":
          result = this.saveResearchNote(input);
          break;
        case "create_outline":
          result = this.createOutline(input);
          break;
        case "write_section":
          result = this.writeSection(input);
          break;
        case "compile_draft":
          result = this.compileDraft(input);
          break;
        case "edit_draft":
          result = this.editDraft(input);
          break;
        case "finalize_article":
          result = this.finalizeArticle(input);
          break;
        default:
          result = { error: `Unknown tool: ${toolName}` };
      }
    } catch (error) {
      result = { error: error.message };
    }

    this.emit(EventTypes.TOOL_RESULT, { tool: toolName, result });
    return result;
  }

  async webSearch({ query }) {
    const tavilyClient = getTavilyClient();
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
    const note = {
      topic,
      content,
      source: source || "research",
      timestamp: Date.now()
    };
    this.memory.addResearch(note);

    this.emit(EventTypes.RESEARCH_ADDED, { note, totalNotes: this.memory.research.length });

    return { success: true, noteCount: this.memory.research.length };
  }

  createOutline({ title, sections, target_length }) {
    this.memory.outline = { title, sections, target_length };

    this.emit(EventTypes.OUTLINE_CREATED, { outline: this.memory.outline });

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

    return { success: true, section: section_heading, wordCount };
  }

  compileDraft({ full_draft }) {
    this.memory.draft = full_draft;
    const wordCount = full_draft.split(/\s+/).length;

    this.emit(EventTypes.DRAFT_UPDATED, {
      draft: full_draft,
      wordCount,
      preview: full_draft.substring(0, 500)
    });

    return { success: true, wordCount, preview: full_draft.substring(0, 200) + "..." };
  }

  editDraft({ edit_type, edited_content, changes_made }) {
    this.memory.draft = edited_content;
    const wordCount = edited_content.split(/\s+/).length;

    this.emit(EventTypes.DRAFT_UPDATED, {
      draft: edited_content,
      wordCount,
      editType: edit_type,
      changes: changes_made
    });

    return { success: true, editType: edit_type, wordCount, changes: changes_made };
  }

  finalizeArticle({ final_article, word_count }) {
    this.memory.finalArticle = final_article;

    this.emit(EventTypes.ARTICLE_FINALIZED, {
      article: final_article,
      wordCount: word_count
    });

    return { success: true, wordCount: word_count, complete: true };
  }
}

export default ToolExecutor;
