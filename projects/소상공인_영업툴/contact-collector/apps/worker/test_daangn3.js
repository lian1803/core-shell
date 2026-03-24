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

  // 당근 동네업체 검색
  await page.goto('https://www.daangn.com/kr/local-profile/s/?search=%EB%AF%B8%EC%9A%A9%EC%8B%A4', { waitUntil: 'networkidle', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // 모든 링크 패턴 분석
  const allLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]'))
      .map(a => ({ href: a.href, text: a.innerText?.trim().slice(0,30) }))
      .filter(a => a.href.includes('daangn.com') && !a.href.includes('javascript') && a.href !== 'https://www.daangn.com/')
      .filter((v,i,arr) => arr.findIndex(x=>x.href===v.href)===i)
  );
  console.log('모든 링크:', JSON.stringify(allLinks.slice(0,20), null, 2));

  const fullText = await page.evaluate(() => document.body.innerText.slice(0,1000));
  console.log('\n페이지 텍스트:', fullText);

  await browser.close();
})();
