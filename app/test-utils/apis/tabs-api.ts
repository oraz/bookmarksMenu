/**
 * @see https://developer.chrome.com/extensions/tabs#toc
 * @see https://developer.chrome.com/extensions/tabs#method-executeScript
 */

export class TabsApiImpl {
  update(tabsIdOrUpdateProperties: number | chrome.tabs.UpdateProperties, updateProperties?: chrome.tabs.UpdateProperties): void {
    throw Error('Not implemented!');
  }

  create(createProperties: chrome.tabs.CreateProperties): void {
    throw Error('Not implemented!');
  }
}
