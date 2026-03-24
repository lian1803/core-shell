import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  locale: 'ko-KR',
  viewport: { width: 1280, height: 800 }
});
const page = await context.newPage();

let searchData = null;

page.on('response', async (response) => {
  if (response.url().includes('allSearch')) {
    try { searchData = JSON.parse(await response.text()); } catch (e) {}
  }
});

try {
  await page.goto('https://map.naver.com/p/search/' + encodeURIComponent('포천 맛집'), { waitUntil: 'networkidle', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));

  if (searchData?.result?.place) {
    const place = searchData.result.place;
    console.log('place 키:', Object.keys(place));
    console.log('list 수:', place.list?.length);

    if (place.list?.length > 0) {
      const first = place.list[0];
      console.log('\n첫 업체 키:', Object.keys(first));
      console.log('업체명:', first.name);
      console.log('전화:', first.tel || first.phone || first.phoneNumbers || '없음');
      console.log('카테고리:', first.category || first.categoryName || '없음');
      console.log('주소:', first.address || first.roadAddress || '없음');
      console.log('\n전체 첫 항목:', JSON.stringify(first).slice(0, 500));
    }
  }

} finally {
  await browser.close();
}
