'use strict';

(function () {
  const version = chrome.runtime.getManifest().version;
  chrome.storage.local.get('optionsPageIsShownFor').then(result => {
    if (result.optionsPageIsShownFor != version) {
      chrome.storage.local.set({ optionsPageIsShownFor: version }).then(() => {
        chrome.runtime.openOptionsPage();
      });
    }
  });
})();
