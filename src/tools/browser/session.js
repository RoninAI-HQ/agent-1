import { lightpanda } from "@lightpanda/browser";
import puppeteer from "puppeteer-core";

class BrowserSession {
  constructor() {
    this.proc = null;
    this.browser = null;
    this.page = null;
    this._initializing = null;
  }

  async init() {
    if (this._initializing) return this._initializing;
    if (this.page) return;
    this._initializing = this._doInit();
    try {
      await this._initializing;
    } finally {
      this._initializing = null;
    }
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

  isActive() {
    return this.page !== null;
  }

  async getPage() {
    if (!this.page) await this.init();
    return this.page;
  }
}

const browserSession = new BrowserSession();
export default browserSession;
