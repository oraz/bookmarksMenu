import { Settings } from './settings.js';

const isWindows = navigator.platform && navigator.platform.startsWith('Win');

export const $ = document.getElementById.bind(document),
    one = document.querySelector.bind(document),
    all = document.querySelectorAll.bind(document);

declare global {
    interface NodeList {
        // eslint-disable-next-line no-unused-vars
        on<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): NodeList;
        // eslint-disable-next-line no-unused-vars
        on(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): NodeList;
    }

    interface HTMLElement {
        on: typeof addEventListener
    }
}

NodeList.prototype.on = function (evt: any, callback: any) {
    this.forEach(el => (el as HTMLElement).on(evt, callback));
    return this;
};

HTMLElement.prototype.on = HTMLElement.prototype.addEventListener;

export class E {
    static show(el: HTMLElement): void {
        el.style.display = 'block';
    }

    static hide(el: HTMLElement): void {
        el.style.display = 'none';
    }
}

export const i18nUtils = {
    init(el: HTMLElement): void {
        el.appendChild(
            document.createTextNode(chrome.i18n.getMessage(el.dataset.i18n as string))
        );
        el.removeAttribute('data-i18n');
    },

    initAll(el: HTMLElement | Document = document): void {
        el.querySelectorAll('[data-i18n]').forEach(each => i18nUtils.init(each as HTMLElement));
    }
};

export function isBookmarklet(url: string): boolean {
    return url.startsWith('javascript:');
}

const faviconSize = Settings.getFavIconWidth();

function createFaviconUrl(url: string): string {
    // @see https://developer.chrome.com/docs/extensions/mv3/favicon/
    const faviconUrl = new URL(chrome.runtime.getURL('/_favicon/'));
    faviconUrl.searchParams.set('pageUrl', url);
    faviconUrl.searchParams.set('size', faviconSize);
    return faviconUrl.toString();
}

export function getFavicon(url: string): string {
    return url == undefined
        ? '../../icons/' + (isWindows ? 'folder-win.png' : 'folder.png')
        : isBookmarklet(url)
            ? '../../icons/js.png'
            : createFaviconUrl(url);
}
