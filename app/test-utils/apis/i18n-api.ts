/**
 * @see https://developer.chrome.com/extensions/i18n
 */
/// <reference path="../../common/chrome-api.d.ts"/>

export class I18NApiImpl implements I18NApi {
  getMessage(messageName: string, substitutions?: any): string {
    return messageName;
  }
}
