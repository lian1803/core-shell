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

  // 1. Bing 테스트
  console.log('=== Bing 테스트 ===');
  await page.goto('https://www.bing.com/search?q=%ED%8F%AC%EC%B2%9C+%EB%AF%B8%EC%9A%A9%EC%8B%A4+010&setlang=ko-KR', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  const bingTitle = await page.title();
  const bingText = await page.evaluate(() => document.body.innerText.slice(0, 2000));
  const bing010 = (bingText.match(/010[-\s]?\d{3,4}[-\s]?\d{4}/g) || []);
  const bingDaangn = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(h => h.includes('daangn') || h.includes('instagram')).slice(0,5)
  );
  console.log('Bing 타이틀:', bingTitle);
  console.log('010 발견:', bing010.slice(0,10));
  console.log('당근/인스타 링크:', bingDaangn);

  // 2. 당근마켓 stealth 테스트
  console.log('\n=== 당근 stealth 테스트 ===');
  await page.goto('https://www.daangn.com/kr/local-profile/s/?search=%EB%AF%B8%EC%9A%A9%EC%8B%A4', { waitUntil: 'networkidle', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  const daangnText = await page.evaluate(() => document.body.innerText.slice(0, 500));
  const daangnLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]')).map(a => a.href)
      .filter(h => h.includes('/local-profile/') && h.length > 40).slice(0,5)
  );
  console.log('당근 텍스트:', daangnText.slice(0,200));
  console.log('당근 업체 링크:', daangnLinks);

  await browser.close();
})();
