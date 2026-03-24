const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'ko-KR',
  });
  const page = await ctx.newPage();
  await page.goto('https://search.naver.com/search.naver?query=%ED%8F%AC%EC%B2%9C+%EB%AF%B8%EC%9A%A9%EC%8B%A4+010&where=web', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  const allLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(h => h.includes('daangn') || h.includes('instagram'))
  );
  const text = await page.evaluate(() => document.body.innerText);
  const phones = (text.match(/010[-\s]?\d{3,4}[-\s]?\d{4}/g) || []).slice(0,10);
  console.log('당근/인스타 링크:', JSON.stringify(allLinks.slice(0,5)));
  console.log('010 번호:', phones);
  console.log('텍스트샘플:', text.slice(0,800));
  await browser.close();
})();
