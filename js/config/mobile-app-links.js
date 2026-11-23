import { safeUrl } from '../utils/ledger.js?v=4';

// 実機で起動を確認した公式HTTPSリンクだけを、OS別に登録します。
// 形式: { '正規のサービス名': { ios: 'https://…', android: 'https://…' } }
const verifiedLinks = Object.freeze({});

export function verifiedMobileAppUrl(account, device) {
  if (account.has_mobile_app !== true) return '';
  const { userAgent, platform, maxTouchPoints } = device;
  const os = /Android/i.test(userAgent) ? 'android'
    : /iPhone|iPad|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
      ? 'ios' : '';
  const name = account.service_name?.trim();
  if (!os || !Object.hasOwn(verifiedLinks, name)) return '';
  const url = safeUrl(verifiedLinks[name][os]);
  return url.startsWith('https://') ? url : '';
}
