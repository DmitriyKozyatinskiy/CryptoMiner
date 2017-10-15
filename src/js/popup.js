import './../css/popup.css';
import {
  IS_MINING,
  ENABLE_MINING,
  DISABLE_MINING,
  GET_SETTINGS,
  SAVE_SETTINGS,
  GET_HASHES_PER_SECOND,
  HASH_UPDATE_INTERVAL,
  ERROR_EVENT,
  AUTHED_EVENT,
} from './constants';

const { runtime } = chrome;
const miningButton = document.getElementById('miningButton');
const saveButton = document.getElementById('saveButton');
const siteKeyInput = document.getElementById('siteKeyInput');
const threadsInput = document.getElementById('threadsInput');
const throttleInput = document.getElementById('throttleInput');
const hashesPerSecondsAmount = document.getElementById('hashesPerSecondsAmount');

const setMiningStatus = () => {
  runtime.sendMessage({ type: IS_MINING }, (isMining) => {
    if (isMining) {
      runtime.sendMessage({ type: DISABLE_MINING }, () => {
        disableMining();
      });
    } else {
      runtime.sendMessage({ type: ENABLE_MINING }, () => {
        enableMining();
      });
    }
  });
};

const enableMining = () => {
  miningButton.innerText = 'STOP MINING';
  miningButton.classList.remove('button-run');
  miningButton.classList.add('button-stop');
};

const disableMining = () => {
  miningButton.innerText = 'START MINING';
  miningButton.classList.remove('button-stop');
  miningButton.classList.add('button-run');
};

const saveSettings = () => {
  const siteKey = siteKeyInput.value;
  const threads = threadsInput.value;
  const throttle = throttleInput.value;
  const data = {
    settings: { siteKey, threads, throttle },
  };
  runtime.sendMessage({ type: SAVE_SETTINGS, data });
};

const showError = () => {

};

runtime.sendMessage({ type: IS_MINING }, (isMining) => {
  if (isMining) {
    enableMining();
  } else {
    disableMining();
  }
});

runtime.sendMessage({ type: GET_SETTINGS }, ({ siteKey, threads, throttle }) => {
  siteKeyInput.value = siteKey;
  threadsInput.value = threads;
  throttleInput.value = throttle;
});

setInterval(function() {
  runtime.sendMessage({ type: GET_HASHES_PER_SECOND }, (hashes) => {
    hashesPerSecondsAmount.innerText = hashes === 0 ? hashes : hashes.toFixed(1);
  });
}, HASH_UPDATE_INTERVAL);

runtime.onMessage.addListener((request, sender, sendResponse) => {
  const {type, data} = request;
  switch (type) {
    case ERROR_EVENT: {
      disableMining();
      break;
    }
    default: {
      break;
    }
  }
});

miningButton.addEventListener('click', () => setMiningStatus());
saveButton.addEventListener('click', () => saveSettings());
