const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'ko-KR',
  });
  const page = await ctx.newPage();

  // 네이버 블로그 검색
  await page.goto('https://search.naver.com/search.naver?query=%ED%8F%AC%EC%B2%9C+%EB%AF%B8%EC%9A%A9%EC%8B%A4&where=blog&sm=tab_jum', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // 현재 실제 DOM에서 링크 구조 파악
  const allAnchors = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="blog.naver"], a[href*="m.blog.naver"]'))
      .map(a => a.href).filter((v,i,arr) => arr.indexOf(v)===i).slice(0,5)
  );
  console.log('블로그 링크들:', allAnchors);

  if (allAnchors.length > 0) {
    // 실제 블로그 포스트 방문
    await page.goto(allAnchors[0], { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, 3000));
    // 블로그 iframe 처리
    const frames = page.frames();
    let blogText = '';
    for (const frame of frames) {
      const t = await frame.evaluate(() => document.body?.innerText || '').catch(() => '');
      if (t.length > blogText.length) blogText = t;
    }
    if (!blogText) blogText = await page.evaluate(() => document.body.innerText);
    const phones = (blogText.match(/010[-\s]?\d{3,4}[-\s]?\d{4}/g) || []);
    console.log('\n블로그 URL:', allAnchors[0]);
    console.log('010 번호:', phones);
    console.log('텍스트 샘플:', blogText.slice(0,500));
  }
  await browser.close();
})();
