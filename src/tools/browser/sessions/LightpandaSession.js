import { lightpanda } from "@lightpanda/browser";
import puppeteer from "puppeteer-core";
import BrowserSession from "./BrowserSession.js";

export default class LightpandaSession extends BrowserSession {
  constructor() {
    super();
    this.proc = null;
  }

  async _doInit() {
    this.proc = await lightpanda.serve({ host: "127.0.0.1", port: 9222 });
    this.browser = await puppeteer.connect({
      browserWSEndpoint: "ws://127.0.0.1:9222"
    });
    const context = await this.browser.createBrowserContext();
    this.page = await context.newPage();
  }

  async close() {
    if (this.page) {
      try { await this.page.close(); } catch {}
      this.page = null;
    }
    if (this.browser) {
      try { await this.browser.disconnect(); } catch {}
      this.browser = null;
    }
    if (this.proc) {
      try {
        this.proc.stdout.destroy();
        this.proc.stderr.destroy();
        this.proc.kill();
      } catch {}
      this.proc = null;
    }
  }
}
