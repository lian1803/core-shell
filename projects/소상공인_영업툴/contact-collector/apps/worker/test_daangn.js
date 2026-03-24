const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'ko-KR',
  });
  const page = await ctx.newPage();

  // 당근마켓 동네업체 (로컬 비즈니스) 검색
  await page.goto('https://www.daangn.com/kr/hot-articles/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  const title1 = await page.title();
  const text1 = await page.evaluate(() => document.body.innerText.slice(0, 300));
  console.log('hot-articles:', title1, text1);

  await page.goto('https://www.daangn.com/search/%EB%AF%B8%EC%9A%A9%EC%8B%A4', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  const title2 = await page.title();
  const links2 = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a')).map(a => ({ href: a.href, text: a.innerText?.slice(0,30) }))
      .filter(a => a.href.includes('daangn') && !a.href.includes('javascript') && a.href.length > 30)
      .slice(0,10)
  );
  console.log('search미용실 title:', title2);
  console.log('링크:', JSON.stringify(links2, null, 2));

  await browser.close();
})();
