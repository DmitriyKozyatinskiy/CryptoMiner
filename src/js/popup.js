import '../css/popup.css';
import {
  IS_MINING,
  ENABLE_MINING,
  DISABLE_MINING,
  GET_SETTINGS,
  SAVE_SETTINGS,
  GET_HASHES_PER_SECOND,
} from './constants';

const miningButton = document.getElementById('miningButton');

const setMiningStatus = () => {
  chrome.runtime.sendMessage({ type: IS_MINING }, (isMining) => {
    if (isMining) {
      chrome.runtime.sendMessage({ type: DISABLE_MINING }, () => {
        disableMining();
      });
    } else {
      chrome.runtime.sendMessage({ type: ENABLE_MINING }, () => {
        enableMining();
      });
    }
  });
};

const enableMining = () => {
  miningButton.innerText = 'STOP MINING';
};

const disableMining = () => {
  miningButton.innerText = 'START MINING';
};

chrome.runtime.sendMessage({ type: IS_MINING }, (isMining) => {
  if (isMining) {
    enableMining();
  } else {
    disableMining();
  }
});

miningButton.addEventListener('click', () => setMiningStatus());