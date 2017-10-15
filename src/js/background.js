import './lib/coinhive';
import {
  DEFAULT_SETTINGS,

  IS_MINING,
  ENABLE_MINING,
  DISABLE_MINING,
  GET_SETTINGS,
  SAVE_SETTINGS,
  GET_HASHES_PER_SECOND,
} from './constants';

const { storage, runtime } = chrome;
const { local } = storage;

let miner = new CoinHive.Anonymous(DEFAULT_SETTINGS.siteKey, {
  threads: DEFAULT_SETTINGS.threads,
  throttle: DEFAULT_SETTINGS.throttle,
});

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
    miner = new CoinHive.Anonymous(siteKey, { threads, throttle });
    isMining().then((isMining) => {
      if (isMining) {
        miner.start();
      }
      resolve();
    });
  }));
};

const getSettings = () => {
  return new Promise((resolve) => local.get('settings', ({ settings }) => resolve(settings || DEFAULT_SETTINGS)));
};

const setEvents = () => {
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

setEvents();
isMining().then((isMining) => {
  if (isMining) {
    miner.start();
  }
});
