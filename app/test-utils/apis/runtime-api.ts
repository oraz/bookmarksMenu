/**
 * @see https://developer.chrome.com/docs/extensions/reference/runtime/
 */

export class RuntimeApiImpl {
    getURL(url: string): string {
        return 'file://../../icons/folder-win.png';
    }
}
