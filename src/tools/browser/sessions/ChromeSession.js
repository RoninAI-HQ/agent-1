import puppeteer from "puppeteer-core";
import BrowserSession from "./BrowserSession.js";

const CHROME_PATHS = {
  darwin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  linux: "/usr/bin/google-chrome",
  win32: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
};

export default class ChromeSession extends BrowserSession {
  constructor({ headless = false } = {}) {
    super();
    this.headless = headless;
  }

  async _doInit() {
    const executablePath = CHROME_PATHS[process.platform];
    if (!executablePath) {
      throw new Error(`Unsupported platform for Chrome: ${process.platform}`);
    }

    this.browser = await puppeteer.launch({
      executablePath,
      headless: this.headless
    });
    this.page = await this.browser.newPage();
  }

  async close() {
    if (this.page) {
      try { await this.page.close(); } catch {}
      this.page = null;
    }
    if (this.browser) {
      try { await this.browser.close(); } catch {}
      this.browser = null;
    }
  }
}
