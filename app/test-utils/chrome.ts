import { TabsApi } from './apis/tabs-api';
import { BookmarksApi } from './apis/bookmarks-api';
import { I18NApi } from './apis/i18n-api';
import { WindowsApi } from './apis/windows-api';

export class Chrome {
  readonly i18n = new I18NApi();
  tabs: TabsApi;
  bookmarks: BookmarksApi;
  windows: WindowsApi;

  constructor() {
    this.reset();
  }

  reset() {
    this.tabs = new TabsApi();
    this.bookmarks = new BookmarksApi();
    this.windows = new WindowsApi();
  }
}
