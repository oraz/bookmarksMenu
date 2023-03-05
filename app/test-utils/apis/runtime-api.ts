/**
 * @see https://developer.chrome.com/docs/extensions/reference/runtime/
 */

/// <reference path="../../common/chrome-api.d.ts"/>

export class RuntimeApiImpl implements RuntimeApi {
    getURL(url: string): string {
        return 'file://../../icons/folder-win.png';
    }
}