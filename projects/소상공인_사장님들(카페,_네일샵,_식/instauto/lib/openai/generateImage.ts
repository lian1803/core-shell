// lib/openai/generateImage.ts
// DALL-E 3를 사용한 인스타그램 이미지 생성

import OpenAI from 'openai';
import type { Shop } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ImageGenerationResult {
  imageUrl: string;
  promptUsed: string;
  revisedPrompt?: string;
}

export interface ImageGenerationOptions {
  shop: Pick<Shop, 'name' | 'industry' | 'vibeKeywords' | 'representMenus'>;
  style?: 'photography' | 'illustration';
}

/**
 * DALL-E 3로 인스타그램용 이미지 생성
 * - 1024x1024 정사각형 (인스타그램 최적화)
 * - 가게 분위기 키워드 기반 감성 이미지
 */
export async function generateImage(
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  const { shop, style = 'photography' } = options;

  // 계절 정보 추출
  const month = new Date().getMonth() + 1;
  let season = '봄';
  if (month >= 3 && month <= 5) season = '봄';
  else if (month >= 6 && month <= 8) season = '여름';
  else if (month >= 9 && month <= 11) season = '가을';
  else season = '겨울';

  // 시간대 정보
  const hour = new Date().getHours();
  let timeOfDay = '낮';
  if (hour >= 6 && hour < 12) timeOfDay = '아침';
  else if (hour >= 12 && hour < 17) timeOfDay = '오후';
  else if (hour >= 17 && hour < 21) timeOfDay = '저녁';
  else timeOfDay = '밤';

  // 분위기 키워드를 영어로 매핑
  const vibeKeywordMap: Record<string, string> = {
    '아늑한': 'cozy and warm',
    '감성적': 'aesthetic and emotional',
    '모던한': 'modern and sleek',
    '따뜻한': 'warm and inviting',
    '깔끔한': 'clean and minimalist',
    '빈티지': 'vintage and retro',
    '미니멀': 'minimal and simple',
    '화사한': 'bright and cheerful',
    '포근한': 'comfortable and homey',
    '세련된': 'sophisticated and elegant',
    '자연친화적': 'natural and organic',
    '힙한': 'trendy and hip',
  };

  const englishVibes = shop.vibeKeywords
    .map((k) => vibeKeywordMap[k] || k)
    .join(', ');

  // 대표 메뉴를 영어로
  const menuPrompt = shop.representMenus.length > 0
    ? `featuring ${shop.representMenus[0]} as the main subject`
    : 'featuring a beautifully crafted coffee';

  const seasonMap: Record<string, string> = {
    '봄': 'spring atmosphere with cherry blossoms and fresh greenery',
    '여름': 'summer vibes with bright natural light',
    '가을': 'autumn feeling with warm orange and brown tones',
    '겨울': 'winter atmosphere with warm indoor lighting',
  };

  const basePrompt = style === 'photography'
    ? `Professional Instagram-worthy food photography for a Korean cafe.
${englishVibes} atmosphere, ${menuPrompt}.
${seasonMap[season]}.
Shot during ${timeOfDay} time with beautiful natural lighting.
High-end cafe interior in the background, bokeh effect.
Canon EOS R5, 50mm f/1.4 lens, shallow depth of field.
Warm color grading, Instagram aesthetic, 4K quality.
No text, no logos, no watermarks.`
    : `Beautiful illustration of a cozy Korean cafe scene.
${englishVibes} style, ${menuPrompt}.
${seasonMap[season]}.
Soft pastel colors, hand-drawn aesthetic.
Warm and inviting atmosphere.
No text, no logos.`;

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: basePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      response_format: 'url',
    });

    const imageData = response.data[0];

    if (!imageData?.url) {
      throw new Error('DALL-E 3 returned no image URL');
    }

    return {
      imageUrl: imageData.url,
      promptUsed: basePrompt,
      revisedPrompt: imageData.revised_prompt,
    };
  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
}

/**
 * 이미지 재생성 (다른 스타일/구도로)
 */
export async function regenerateImage(
  options: ImageGenerationOptions & { previousPrompt: string }
): Promise<ImageGenerationResult> {
  const { shop, previousPrompt, style = 'photography' } = options;

  // 계절/시간 정보
  const month = new Date().getMonth() + 1;
  let season = '봄';
  if (month >= 3 && month <= 5) season = '봄';
  else if (month >= 6 && month <= 8) season = '여름';
  else if (month >= 9 && month <= 11) season = '가을';
  else season = '겨울';

  const vibeKeywordMap: Record<string, string> = {
    '아늑한': 'cozy and warm',
    '감성적': 'aesthetic and emotional',
    '모던한': 'modern and sleek',
    '따뜻한': 'warm and inviting',
    '깔끔한': 'clean and minimalist',
    '빈티지': 'vintage and retro',
    '미니멀': 'minimal and simple',
    '화사한': 'bright and cheerful',
    '포근한': 'comfortable and homey',
    '세련된': 'sophisticated and elegant',
    '자연친화적': 'natural and organic',
    '힙한': 'trendy and hip',
  };

  const englishVibes = shop.vibeKeywords
    .map((k) => vibeKeywordMap[k] || k)
    .join(', ');

  // 랜덤 구도 선택
  const compositions = [
    'overhead flat lay shot',
    'close-up macro shot',
    '45-degree angle shot',
    'side profile shot',
    'environmental wide shot showing cafe interior',
  ];
  const randomComposition = compositions[Math.floor(Math.random() * compositions.length)];

  // 랜덤 메뉴 선택 (있으면)
  const menuItem = shop.representMenus.length > 0
    ? shop.representMenus[Math.floor(Math.random() * shop.representMenus.length)]
    : 'artisan coffee';

  const seasonMap: Record<string, string> = {
    '봄': 'spring atmosphere with soft pastel tones',
    '여름': 'summer vibes with cool refreshing aesthetic',
    '가을': 'autumn feeling with golden hour lighting',
    '겨울': 'cozy winter atmosphere with warm ambient lighting',
  };

  const newPrompt = style === 'photography'
    ? `Professional Instagram food photography for a Korean cafe.
${englishVibes} atmosphere, ${randomComposition}, featuring ${menuItem}.
${seasonMap[season]}.
Different composition from before - creative and unique angle.
High-end cafe setting, beautiful bokeh background.
Sony A7R IV, artistic lens choice, cinematic color grading.
Instagram aesthetic, magazine quality, no text or watermarks.`
    : `Artistic illustration of a Korean cafe scene.
${englishVibes} style, ${randomComposition}, featuring ${menuItem}.
${seasonMap[season]}.
Different artistic approach - fresh and unique style.
Watercolor or digital art aesthetic.
No text, no logos.`;

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: newPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      response_format: 'url',
    });

    const imageData = response.data[0];

    if (!imageData?.url) {
      throw new Error('DALL-E 3 returned no image URL');
    }

    return {
      imageUrl: imageData.url,
      promptUsed: newPrompt,
      revisedPrompt: imageData.revised_prompt,
    };
  } catch (error) {
    console.error('Image regeneration error:', error);
    throw error;
  }
}
