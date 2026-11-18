// サービス候補とおすすめのカテゴリ。ログインURL以外のドメインは domains に追加する。
export const popularSites = [
  { name: 'Adobe', url: 'https://auth.services.adobe.com/en_US/index.html', category: '仕事', domains: ['adobe.com'] },
  { name: 'Amazon', url: 'https://www.amazon.co.jp/ap/signin', category: '買い物', domains: ['amazon.com'] },
  { name: 'Apple', url: 'https://account.apple.com/', logo: 'apple', category: '生活', domains: ['apple.com'] },
  { name: 'Avast', url: 'https://id.avast.com/', logo: 'avast', category: '生活', domains: ['avast.com'] },
  { name: 'Discord', url: 'https://discord.com/login', logo: 'discord', category: 'SNS' },
  { name: 'Dropbox', url: 'https://www.dropbox.com/login', logo: 'dropbox', category: '仕事' },
  { name: 'Facebook', url: 'https://www.facebook.com/login/', logo: 'facebook', category: 'SNS' },
  { name: 'GitHub', url: 'https://github.com/login', logo: 'github', category: '開発' },
  { name: 'Google', url: 'https://accounts.google.com/', logo: 'google', category: '生活', domains: ['google.com', 'google.co.jp'] },
  { name: 'Instagram', url: 'https://www.instagram.com/accounts/login/', logo: 'instagram', category: 'SNS' },
  { name: 'LINE', url: 'https://access.line.me/', logo: 'line', category: 'SNS', domains: ['line.me'] },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/login', logo: 'linkedin', category: 'SNS' },
  { name: 'Microsoft', url: 'https://login.live.com/', logo: 'microsoft', category: '仕事', domains: ['live.com', 'microsoft.com', 'outlook.com'] },
  { name: 'Netflix', url: 'https://www.netflix.com/login', logo: 'netflix', category: '娯楽' },
  { name: 'Notion', url: 'https://www.notion.so/login', logo: 'notion', category: '仕事', domains: ['notion.com'] },
  { name: 'PayPal', url: 'https://www.paypal.com/signin', logo: 'paypal', category: '金融・決済' },
  { name: 'Rakuten', url: 'https://grp01.id.rakuten.co.jp/rms/nid/login', logo: 'rakuten', category: '買い物', domains: ['rakuten.co.jp'] },
  { name: 'Slack', url: 'https://slack.com/signin', logo: 'slack', category: '仕事' },
  { name: 'Spotify', url: 'https://accounts.spotify.com/', logo: 'spotify', category: '娯楽', domains: ['spotify.com'] },
  { name: 'X', url: 'https://x.com/i/flow/login', logo: 'x', category: 'SNS', domains: ['twitter.com'] },
  { name: 'Yahoo! JAPAN', url: 'https://login.yahoo.co.jp/', category: '生活', domains: ['yahoo.co.jp'] },
];

function normalizeName(name) {
  return (name ?? '').normalize('NFKC').trim().toLowerCase();
}

function hostname(url) {
  try {
    const parsed = new URL(url);
    if (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      !parsed.username &&
      !parsed.password
    )
      return parsed.hostname.replace(/^www\.|\.$/g, '');
  } catch {
    // 入力途中や空欄のURLは判定対象にしない。
  }
  return '';
}

export function suggestSiteCategory(name, url) {
  const normalizedName = normalizeName(name);
  const byName = popularSites.find(
    (site) => normalizeName(site.name) === normalizedName,
  );
  const host = hostname(url);
  const byDomain = host && popularSites.find((site) =>
    [hostname(site.url), ...(site.domains ?? [])].some(
      (domain) => host === domain || host.endsWith('.' + domain),
    ),
  );
  if (byName && byDomain && byName.category !== byDomain.category) return '';
  return (byName || byDomain)?.category ?? '';
}
