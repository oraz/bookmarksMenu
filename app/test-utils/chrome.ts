import { TabsApiImpl } from './apis/tabs-api';
import { BookmarksApiImpl } from './apis/bookmarks-api';
import { I18NApiImpl } from './apis/i18n-api';
import { WindowsApiImpl } from './apis/windows-api';
import { BrowserActionApiImpl } from './apis/browser-action-api';

/// <reference path="../common/chrome-api.d.ts"/>

export class Chrome implements ChromeInterface {
  readonly i18n = new I18NApiImpl();
  tabs: TabsApiImpl;
  bookmarks: BookmarksApiImpl;
  windows: WindowsApiImpl;
  browserAction: BrowserActionApiImpl;

  constructor() {
    this.reset();
  }

  reset() {
    this.tabs = new TabsApiImpl();
    this.bookmarks = new BookmarksApiImpl();
    this.windows = new WindowsApiImpl();
    this.browserAction = new BrowserActionApiImpl();
  }
}
