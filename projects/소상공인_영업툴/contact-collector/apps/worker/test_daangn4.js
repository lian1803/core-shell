const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'ko-KR',
  });
  const page = await ctx.newPage();

  // 포천시 미용실 검색
  await page.goto('https://www.daangn.com/kr/local-profile/s/?search=%EB%AF%B8%EC%9A%A9%EC%8B%A4&in=%ED%8F%AC%EC%B2%9C%EC%8B%9C', { waitUntil: 'networkidle', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // 업체 카드 링크 패턴 찾기
  const profileLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href]'));
    return links
      .map(a => ({ href: a.href, text: (a.closest('article,li,div')?.innerText || a.innerText || '').trim().slice(0,50) }))
      .filter(a => /local-profile\/[^s]/.test(a.href))
      .filter((v,i,arr) => arr.findIndex(x=>x.href===v.href)===i)
      .slice(0,5);
  });
  console.log('업체 프로필 링크:', JSON.stringify(profileLinks, null, 2));

  // 클릭 가능한 업체 카드 찾기
  const cards = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('article, [data-profile-id], [class*="profile"]'))
      .slice(0,3)
      .map(el => ({
        text: el.innerText?.slice(0,100),
        links: Array.from(el.querySelectorAll('a')).map(a => a.href)
      }));
  });
  console.log('\n카드들:', JSON.stringify(cards, null, 2));

  await browser.close();
})();
