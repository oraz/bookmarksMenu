export class WindowsApi {
  create(createData?: {
    url?: string | string[];
    tabId?: number;
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    focused?: boolean;
    incognito?: boolean;
    setSelfAsOpener?: boolean;
  }) {
    throw Error('Not implemented!');
  }
}
