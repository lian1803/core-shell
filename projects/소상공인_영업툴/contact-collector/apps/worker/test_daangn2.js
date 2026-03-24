const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'ko-KR',
  });
  const page = await ctx.newPage();

  // 동네업체 검색
  await page.goto('https://www.daangn.com/kr/local-profile/s/?search=%EB%AF%B8%EC%9A%A9%EC%8B%A4', { waitUntil: 'networkidle', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  const text = await page.evaluate(() => document.body.innerText.slice(0, 2000));
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a')).map(a => a.href)
      .filter(h => h.includes('/local-profile/') && h.length > 50).slice(0,10)
  );
  console.log('텍스트:', text.slice(0,600));
  console.log('업체 링크:', links);

  if (links.length > 0) {
    await page.goto(links[0], { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));
    const biz = await page.evaluate(() => document.body.innerText.slice(0, 2000));
    const phones = (biz.match(/010[-\s]?\d{3,4}[-\s]?\d{4}/g) || []);
    const telLinks = Array.from(document.querySelectorAll('a[href^="tel:"]')).map(a => a.href);
    console.log('\n업체 페이지 텍스트:', biz.slice(0,500));
    console.log('010 번호:', phones);
    console.log('tel 링크:', telLinks);
  }

  await browser.close();
})();
