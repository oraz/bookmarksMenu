/**
 * @see https://developer.chrome.com/extensions/tabs#toc
 * @see https://developer.chrome.com/extensions/tabs#method-executeScript
 */
/// <reference path="../../common/chrome-api.d.ts"/>

export class TabsApiImpl implements TabsApi {
  update(
    tabsIdOrUpdateProperties: number | TabsUpdateData,
    updateProperties?: TabsUpdateData
  ): void {
    throw Error('Not implemented!');
  }

  create(createProperties: TabsCreateProperties): void {
    throw Error('Not implemented!');
  }

  executeScript(tabIdOrExecuteProps: number | TabsExecuteScriptData, details?: TabsExecuteScriptData): void {
    throw Error('Not implemented!');
  }
}
