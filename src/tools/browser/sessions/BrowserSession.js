/**
 * Base class for browser sessions.
 * Subclasses must implement `_doInit()` and `close()`.
 */
export default class BrowserSession {
  constructor() {
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
    throw new Error("Subclass must implement _doInit()");
  }

  async close() {
    throw new Error("Subclass must implement close()");
  }

  isActive() {
    return this.page !== null;
  }

  async getPage() {
    if (!this.page) await this.init();
    return this.page;
  }
}
