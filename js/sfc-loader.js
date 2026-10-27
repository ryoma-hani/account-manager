import * as ledger from './utils/ledger.js';
import * as optionsConfig from './config/options.js';

const base = new URL('../', import.meta.url);
const moduleCache = Object.assign(Object.create(null), {
  vue: window.Vue,
  [new URL('./utils/ledger.js', import.meta.url).href]: ledger,
  [new URL('./config/options.js', import.meta.url).href]: optionsConfig,
});

const options = {
  moduleCache,
  pathResolve({ refPath, relPath }) {
    if (relPath.toString() === 'vue') return 'vue';
    return new URL(relPath.toString(), refPath ? refPath.toString() : base)
      .href;
  },
  async getFile(url) {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(
        `コンポーネントを取得できませんでした: ${response.status} ${url}`,
      );
    return {
      getContentData: (asBinary) =>
        asBinary ? response.arrayBuffer() : response.text(),
    };
  },
  addStyle(textContent) {
    const style = document.createElement('style');
    style.textContent = textContent;
    document.head.append(style);
  },
  log(type, ...args) {
    if (type === 'error' || type === 'warn') console[type](...args);
  },
};

export function loadSfc(path) {
  return window['vue3-sfc-loader'].loadModule(
    new URL(path, base).href,
    options,
  );
}
