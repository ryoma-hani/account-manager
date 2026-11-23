import { safeUrl } from '../utils/ledger.js?v=4';

// 実機で起動を確認した公式HTTPSリンクだけを、OS別に登録します。
// 形式: { '正規のサービス名': { ios: 'https://…', android: 'https://…' } }
const verifiedLinks = Object.freeze({});
// 利用者がiPhoneで作成し、起動を確認したショートカットの名前。
const verifiedIphoneShortcuts = Object.freeze({ はま寿司: 'OpenHamaSushi' });

export function verifiedMobileAppLink(account, device) {
  if (account.has_mobile_app !== true) return null;
  const { userAgent, platform, maxTouchPoints } = device;
  const os = /Android/i.test(userAgent) ? 'android'
    : /iPhone|iPad|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
      ? 'ios' : '';
  const name = account.service_name?.trim();
  if (!os) return null;
  if (Object.hasOwn(verifiedLinks, name)) {
    const url = safeUrl(verifiedLinks[name][os]);
    if (url.startsWith('https://')) return { url, label: 'アプリで開く' };
  }
  if (os === 'ios' && /iPhone/i.test(userAgent) && Object.hasOwn(verifiedIphoneShortcuts, name)) {
    const shortcut = encodeURIComponent(verifiedIphoneShortcuts[name]);
    return {
      url: `shortcuts://run-shortcut?name=${shortcut}`,
      label: 'ショートカットで開く',
    };
  }
  return null;
}
