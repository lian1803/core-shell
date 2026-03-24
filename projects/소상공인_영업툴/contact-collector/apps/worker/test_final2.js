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

  // 1. 당근 중고거래 글에서 010 (소상공인이 직접 적음)
  console.log('=== 당근 중고거래 글 테스트 ===');
  await page.goto('https://www.daangn.com/kr/buy-sell/s/?search=%EB%AF%B8%EC%9A%A9%EC%8B%A4+%ED%8F%AC%EC%B2%9C', { waitUntil: 'networkidle', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  const sellText = await page.evaluate(() => document.body.innerText.slice(0,2000));
  const sell010 = (sellText.match(/010[-\s]?\d{3,4}[-\s]?\d{4}/g) || []);
  const sellLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/buy-sell/"]'))
      .map(a => a.href).filter(h => h.includes('/kr/buy-sell/') && !h.includes('/s/')).slice(0,3)
  );
  console.log('중고거래 010:', sell010);
  console.log('중고거래 링크:', sellLinks);

  if (sellLinks.length > 0) {
    await page.goto(sellLinks[0], { waitUntil: 'networkidle', timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));
    const postText = await page.evaluate(() => document.body.innerText);
    const post010 = (postText.match(/010[-\s]?\d{3,4}[-\s]?\d{4}/g) || []);
    console.log('개별 글 010:', post010);
    console.log('글 내용:', postText.slice(0,500));
  }

  // 2. 인스타 username → picuki 또는 inflact로 bio 접근
  console.log('\n=== 인스타 써드파티 뷰어 ===');
  const username = 'ahns_style_pocheon';
  await page.goto(`https://www.picuki.com/profile/${username}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 3000));
  const picukiText = await page.evaluate(() => document.body.innerText.slice(0,1000));
  const picuki010 = (picukiText.match(/010[-\s]?\d{3,4}[-\s]?\d{4}/g) || []);
  console.log('picuki 010:', picuki010);
  console.log('picuki 텍스트:', picukiText.slice(0,300));

  // 3. 인스타 oEmbed API
  console.log('\n=== 인스타 oEmbed API ===');
  try {
    await page.goto(`https://graph.instagram.com/oembed?url=https://www.instagram.com/${username}/&access_token=public`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    const apiText = await page.evaluate(() => document.body.innerText);
    console.log('oEmbed 응답:', apiText.slice(0,300));
  } catch (e) {
    console.log('oEmbed 실패:', e.message?.slice(0,50));
  }

  await browser.close();
})();
