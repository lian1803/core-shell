const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'ko-KR',
  });
  const page = await ctx.newPage();

  // 테스트 1: 당근마켓 포천 지역 비즈니스 검색
  console.log('=== 당근마켓 테스트 ===');
  await page.goto('https://www.daangn.com/search/%ED%8F%AC%EC%B2%9C/more', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  const daangnText = await page.evaluate(() => document.body.innerText.slice(0, 1000));
  const daangnLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(h => h.includes('/business/') || h.includes('/profile/')).slice(0,5)
  );
  const daangn010 = (daangnText.match(/010[-\s]?\d{3,4}[-\s]?\d{4}/g) || []);
  console.log('당근 링크:', daangnLinks);
  console.log('당근 010:', daangn010);
  console.log('당근 텍스트:', daangnText.slice(0,400));

  // 테스트 2: 네이버 블로그 실제 페이지 방문
  console.log('\n=== 네이버 블로그 실제 페이지 ===');
  await page.goto('https://search.naver.com/search.naver?query=%ED%8F%AC%EC%B2%9C+%EB%AF%B8%EC%9A%A9%EC%8B%A4+010&where=blog', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  const blogLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a.title_link, a.api_txt_lines')).map(a => a.href).filter(h => h.includes('blog.naver') || h.includes('post.naver')).slice(0,3)
  );
  console.log('블로그 링크:', blogLinks);

  if (blogLinks.length > 0) {
    await page.goto(blogLinks[0], { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));
    const blogText = await page.evaluate(() => document.body.innerText.slice(0, 3000));
    const blog010 = (blogText.match(/010[-\s]?\d{3,4}[-\s]?\d{4}/g) || []);
    console.log('블로그 010:', blog010);
  }

  await browser.close();
})();
