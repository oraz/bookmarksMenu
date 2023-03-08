import { TabsApiImpl } from './apis/tabs-api';
import { BookmarksApiImpl } from './apis/bookmarks-api';
import { I18NApiImpl } from './apis/i18n-api';
import { WindowsApiImpl } from './apis/windows-api';
import { RuntimeApiImpl } from './apis/runtime-api';

export class Chrome {
    readonly i18n = new I18NApiImpl();
    tabs: TabsApiImpl;
    bookmarks: BookmarksApiImpl;
    windows: WindowsApiImpl;
    runtime: RuntimeApiImpl;

    constructor() {
        this.reset();
    }

    reset() {
        this.tabs = new TabsApiImpl();
        this.bookmarks = new BookmarksApiImpl();
        this.windows = new WindowsApiImpl();
        this.runtime = new RuntimeApiImpl();
    }
}
