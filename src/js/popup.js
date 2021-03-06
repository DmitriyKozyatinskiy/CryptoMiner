import './../css/popup.css';
import './../css/speedometer.scss';
import {
  IS_MINING,
  ENABLE_MINING,
  DISABLE_MINING,
  GET_SETTINGS,
  SAVE_SETTINGS,
  RESET_SETTINGS,
  GET_HASHES_PER_SECOND,
  HASH_UPDATE_INTERVAL,
  ERROR_EVENT,
  AUTHED_EVENT,
  MIN_THREADS,
  MAX_THREADS,
  MIN_THROTTLE,
  MAX_THROTTLE
} from './constants';

const { runtime } = chrome;
const miningButton = document.getElementById('miningButton');
const saveButton = document.getElementById('saveButton');
const resetButton = document.getElementById('buttonReset');
const siteKeyInput = document.getElementById('siteKeyInput');
const threadsInput = document.getElementById('threadsInput');
const throttleInput = document.getElementById('throttleInput');
const hashesPerSecondsAmount = document.getElementById('hashesPerSecondsAmount');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const speedometer = document.getElementById('speedometer');

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
  speedometer.classList.add('play');
};

const disableMining = () => {
  miningButton.innerText = 'START MINING';
  miningButton.classList.remove('button-stop');
  miningButton.classList.add('button-run');
  speedometer.classList.remove('play');
};

const saveSettings = () => {
  _gaq.push(['_trackEvent', 'SaveSettings', 'clicked']);
  const siteKey = siteKeyInput.value;
  const threads = threadsInput.value;
  const throttle = throttleInput.value;
  const data = {
    settings: { siteKey, threads, throttle },
  };
  errorMessage.classList.add('hidden');
  siteKeyInput.classList.remove('input-error');
  runtime.sendMessage({ type: SAVE_SETTINGS, data }, () => {
    successMessage.classList.remove('hidden');
    window.setTimeout(() => {
      successMessage.classList.add('hidden');
    }, 3000)
  });
};

const resetSettings = () => {
  _gaq.push(['_trackEvent', 'ResetSettings', 'clicked']);
  runtime.sendMessage({ type: RESET_SETTINGS }, (settings) => {
    setSettingInputs(settings);
    siteKeyInput.classList.remove('input-error');
    errorMessage.classList.add('hidden');
    successMessage.classList.remove('hidden');
    window.setTimeout(() => {
      successMessage.classList.add('hidden');
    }, 3000)
  });
};

const setSettingInputs = ({ siteKey, threads, throttle }) => {
  siteKeyInput.value = siteKey;
  threadsInput.value = threads;
  throttleInput.value = throttle;
};

runtime.sendMessage({ type: IS_MINING }, (isMining) => {
  if (isMining) {
    enableMining();
  } else {
    disableMining();
  }
});

runtime.sendMessage({ type: GET_SETTINGS }, (settings) => setSettingInputs(settings));

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
      successMessage.classList.add('hidden');
      errorMessage.classList.remove('hidden');
      siteKeyInput.classList.add('input-error');
      break;
    }
    case AUTHED_EVENT: {
      enableMining();
      errorMessage.classList.add('hidden');
      siteKeyInput.classList.remove('input-error');
      break;
    }
    default: {
      break;
    }
  }
});

miningButton.addEventListener('click', () => {
  if (miningButton.classList.contains('button-stop')) {
    _gaq.push(['_trackEvent', 'StopMining', 'clicked']);
  } else {
    _gaq.push(['_trackEvent', 'StartMining', 'clicked']);
  }
  setMiningStatus();
});
saveButton.addEventListener('click', () => saveSettings());
resetButton.addEventListener('click', () => resetSettings());
siteKeyInput.addEventListener('change', () => _gaq.push(['_trackEvent', 'SiteKey', 'changed']));
threadsInput.addEventListener('change', () => {
  const value = threadsInput.value;
  if (value > MAX_THREADS) {
    threadsInput.value = MAX_THREADS;
  } else if (value < MIN_THREADS || !value) {
    threadsInput.value = MIN_THREADS;
  }
});
throttleInput.addEventListener('change', () => {
  const value = throttleInput.value;
  if (value > MAX_THROTTLE) {
    throttleInput.value = MAX_THROTTLE;
  } else if (value < MIN_THROTTLE || !value) {
    throttleInput.value = MIN_THROTTLE;
  }
});
