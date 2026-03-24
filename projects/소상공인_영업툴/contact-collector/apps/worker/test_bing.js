const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'ko-KR',
    viewport: { width: 1280, height: 800 },
  });
  const page = await ctx.newPage();

  const queries = [
    '포천시 미용실 010',
    '포천 카페 010 연락',
    '포천 학원 010번호',
  ];

  for (const q of queries) {
    const url = `https://www.bing.com/search?q=${encodeURIComponent(q)}&setlang=ko-KR&cc=KR`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const text = await page.evaluate(() => document.body.innerText);
    const phones = (text.match(/010[-\s]?\d{3,4}[-\s]?\d{4}/g) || []);
    const resultLinks = await page.evaluate(() =>
      Array.from(document.querySelectorAll('#b_results .b_algo h2 a, li.b_algo h2 a'))
        .map(a => ({ href: a.href, title: a.innerText })).slice(0, 5)
    );
    console.log(`\n쿼리: "${q}"`);
    console.log('010 발견:', phones.slice(0,5));
    console.log('결과 링크:', resultLinks.slice(0,3).map(r => r.href));
  }

  // Bing에서 나온 페이지 방문해서 010 뽑기 테스트
  const testUrl = 'https://www.bing.com/search?q=%ED%8F%AC%EC%B2%9C%EC%8B%9C+%EB%AF%B8%EC%9A%A9%EC%8B%A4+010&setlang=ko-KR&cc=KR';
  await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('li.b_algo h2 a')).map(a => a.href).filter(h => !h.includes('bing.com')).slice(0,3)
  );
  console.log('\n방문할 페이지들:', links);
  for (const link of links) {
    try {
      await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await new Promise(r => setTimeout(r, 1500));
      const t = await page.evaluate(() => document.body.innerText.slice(0,3000));
      const p = (t.match(/010[-\s]?\d{3,4}[-\s]?\d{4}/g) || []);
      if (p.length > 0) console.log(`✅ ${link} → ${p}`);
    } catch {}
  }

  await browser.close();
})();
