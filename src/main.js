import 'regenerator-runtime/runtime'

import loadClock from './loadClock';
import autoReloadPage from './autoReloadPage';

window.onload = async () => {
  console.log("load-progress", "onload done - execution begin");
  await loadClock();
  console.log("load-progress", "clock execution done");

  document.documentElement.classList.remove('hideApp');

  /*
  // To avoid memory leak
  autoReloadPage();
  */
};
