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

  // 카카오맵 API 응답 캡처
  const captured = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('dapi.kakao.com') || url.includes('map.kakao.com/actions') || url.includes('search.kakao.com') || url.includes('place.map.kakao.com')) {
      try {
        const json = await res.json();
        captured.push({ url, json: JSON.stringify(json).slice(0, 500) });
      } catch {}
    }
  });

  await page.goto('https://map.kakao.com/?q=%ED%8F%AC%EC%B2%9C%20%EB%AF%B8%EC%9A%A9%EC%8B%A4', { waitUntil: 'networkidle', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));

  console.log('캡처된 API 응답 수:', captured.length);
  for (const c of captured.slice(0,5)) {
    console.log('\nURL:', c.url);
    console.log('데이터:', c.json.slice(0,300));
  }

  const text = await page.evaluate(() => document.body.innerText.slice(0,1000));
  const phones = (text.match(/010[-\s]?\d{3,4}[-\s]?\d{4}/g) || []);
  const all031 = (text.match(/031[-\s]?\d{3,4}[-\s]?\d{4}/g) || []);
  console.log('\n010 번호:', phones);
  console.log('031 번호:', all031.slice(0,5));
  console.log('텍스트:', text.slice(0,400));

  await browser.close();
})();
