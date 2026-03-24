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

  const testUrls = [
    'https://www.daangn.com/kr/local-profile/%EB%94%9C%EB%9D%BC%EC%9D%BC%EB%9D%BC-%ED%97%A4%EC%96%B4-ftwpxfrt2rq3/',
    'https://www.daangn.com/kr/local-profile/%EB%9D%BC%EB%9D%BC%ED%97%A4%EC%96%B4-o5y75z36jqsf/',
    'https://www.daangn.com/kr/local-profile/%EB%AF%B8%EC%95%A4%ED%9E%90%ED%97%A4%EC%96%B4-ujjk2rmguoig/',
  ];

  for (const url of testUrls) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));

    const text = await page.evaluate(() => document.body.innerText);
    const telLinks = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href^="tel:"]')).map(a => a.href.replace('tel:',''))
    );
    const phones010 = (text.match(/010[-\s]?\d{3,4}[-\s]?\d{4}/g) || []);
    const bizName = await page.evaluate(() => {
      const h1 = document.querySelector('h1, h2');
      return h1?.innerText?.trim() || '';
    });

    console.log(`\n업체: ${bizName}`);
    console.log('URL:', url.slice(-30));
    console.log('tel 링크:', telLinks);
    console.log('010 패턴:', phones010);
    console.log('텍스트 일부:', text.slice(0, 300));
  }

  await browser.close();
})();
