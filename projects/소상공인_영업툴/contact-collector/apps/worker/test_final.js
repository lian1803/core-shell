const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
    locale: 'ko-KR',
    viewport: { width: 390, height: 844 },
  });
  const page = await ctx.newPage();

  // 1. Daangn 여러 업체 소개글에서 010 확인
  console.log('=== 당근 업체들 010 체크 ===');
  const DAANGN_PROFILES = [
    'https://www.daangn.com/kr/local-profile/%EB%94%9C%EB%9D%BC%EC%9D%BC%EB%9D%BC-%ED%97%A4%EC%96%B4-ftwpxfrt2rq3/',
    'https://www.daangn.com/kr/local-profile/%EB%9D%BC%EB%9D%BC%ED%97%A4%EC%96%B4-o5y75z36jqsf/',
    'https://www.daangn.com/kr/local-profile/%EB%AF%B8%EC%95%A4%ED%9E%90%ED%97%A4%EC%96%B4-ujjk2rmguoig/',
  ];
  for (const url of DAANGN_PROFILES) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));
    const text = await page.evaluate(() => document.body.innerText);
    const phones = (text.match(/010[-\s]?\d{3,4}[-\s]?\d{4}/g) || []);
    const name = await page.evaluate(() => document.querySelector('h1,h2')?.innerText?.trim() || '');
    console.log(`${name}: 010=${phones}`);
  }

  // 2. 인스타그램 모바일 직접 접근
  console.log('\n=== 인스타 stealth 테스트 ===');
  // Naver에서 인스타 계정 찾기
  await page.goto('https://search.naver.com/search.naver?query=%ED%8F%AC%EC%B2%9C+%EB%AF%B8%EC%9A%A9%EC%8B%A4+%EC%9D%B8%EC%8A%A4%ED%83%80%EA%B7%B8%EB%9E%A8&where=web', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  const instaLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="instagram.com/"]'))
      .map(a => a.href)
      .filter(h => !h.includes('/p/') && !h.includes('/reel/'))
      .filter((v,i,arr) => arr.indexOf(v)===i)
      .slice(0,5)
  );
  console.log('네이버에서 찾은 인스타 링크:', instaLinks);

  if (instaLinks.length > 0) {
    await page.goto(instaLinks[0], { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, 3000));
    const instaText = await page.evaluate(() => document.body.innerText.slice(0,1000));
    const instaMeta = await page.evaluate(() => {
      const desc = document.querySelector('meta[property="og:description"]');
      const title = document.querySelector('meta[property="og:title"]');
      return { desc: desc?.content, title: title?.content };
    });
    const phones = (instaText.match(/010[-\s]?\d{3,4}[-\s]?\d{4}/g) || []);
    console.log('인스타 meta:', instaMeta);
    console.log('010 번호:', phones);
    console.log('텍스트:', instaText.slice(0,300));
  }

  await browser.close();
})();
