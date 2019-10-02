/**
 * @see https://developer.chrome.com/extensions/tabs#toc
 * @see https://developer.chrome.com/extensions/tabs#method-executeScript
 */

interface ExecuteScriptData {
  // not all props are here
  code?: string;
}

interface UpdateData {
  // not all props are here
  url?: string;
}

export class TabsApi {
  update(
    tabsIdOrUpdateProperties: number | UpdateData,
    updateProperties?: UpdateData
  ): void {
    throw Error('Not implemented!');
  }

  create(createProperties: {
    windowId?: number;
    index?: number;
    url?: string;
    active?: boolean;
    pinned?: boolean;
    openerTabId?: number;
  }): void {
    throw Error('Not implemented!');
  }

  executeScript(
    tabIdOrExecuteProps: number | ExecuteScriptData,
    details?: ExecuteScriptData
  ): void {
    throw Error('Not implemented!');
  }
}
