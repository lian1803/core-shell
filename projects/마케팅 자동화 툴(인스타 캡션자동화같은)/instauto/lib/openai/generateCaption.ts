// lib/openai/generateCaption.ts
// GPT-4o를 사용한 인스타그램 캡션 생성

import OpenAI from 'openai';
import type { Shop } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CaptionGenerationResult {
  caption: string;
  promptUsed: string;
}

export interface CaptionGenerationOptions {
  shop: Pick<Shop, 'name' | 'industry' | 'vibeKeywords' | 'representMenus'>;
  streaming?: boolean;
}

/**
 * 인스타그램 캡션 생성
 * - 200자 이내 한국어 캡션
 * - 해시태그 10개 포함
 * - 가게 정보 기반 맞춤 프롬프트
 */
export async function generateCaption(
  options: CaptionGenerationOptions
): Promise<CaptionGenerationResult> {
  const { shop } = options;

  const today = new Date();
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][today.getDay()];
  const month = today.getMonth() + 1;
  const date = today.getDate();

  const systemPrompt = `당신은 소상공인 카페의 인스타그램 마케팅 전문가입니다.
따뜻하고 감성적인 한국어로 인스타그램 캡션을 작성합니다.

## 작성 규칙
1. 본문은 200자 이내로 작성
2. 자연스럽고 진정성 있는 톤 유지
3. 이모지는 2-3개만 적절히 사용
4. 마지막에 해시태그 10개 추가 (줄바꿈 후)
5. 해시태그는 관련성 높은 것으로 구성 (#카페 #커피 #감성카페 등)
6. 광고성 문구 (할인, 이벤트 등) 지양
7. 계절감과 날짜 정보 자연스럽게 반영`;

  const userPrompt = `## 가게 정보
- 가게명: ${shop.name}
- 업종: ${shop.industry === 'cafe' ? '카페' : shop.industry}
- 분위기: ${shop.vibeKeywords.join(', ')}
- 대표 메뉴: ${shop.representMenus.join(', ')}

## 오늘 날짜
${month}월 ${date}일 ${dayOfWeek}요일

위 정보를 바탕으로 오늘 올릴 인스타그램 캡션을 작성해주세요.
자연스럽게 오늘의 분위기나 메뉴를 소개하는 내용으로 작성합니다.`;

  const promptUsed = `[System]: ${systemPrompt}\n\n[User]: ${userPrompt}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const caption = response.choices[0]?.message?.content?.trim();

    if (!caption) {
      throw new Error('OpenAI returned empty response');
    }

    return {
      caption,
      promptUsed,
    };
  } catch (error) {
    console.error('Caption generation error:', error);
    throw error;
  }
}

/**
 * 스트리밍 캡션 생성 (SSE용)
 */
export async function* generateCaptionStream(
  options: CaptionGenerationOptions
): AsyncGenerator<string, CaptionGenerationResult, unknown> {
  const { shop } = options;

  const today = new Date();
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][today.getDay()];
  const month = today.getMonth() + 1;
  const date = today.getDate();

  const systemPrompt = `당신은 소상공인 카페의 인스타그램 마케팅 전문가입니다.
따뜻하고 감성적인 한국어로 인스타그램 캡션을 작성합니다.

## 작성 규칙
1. 본문은 200자 이내로 작성
2. 자연스럽고 진정성 있는 톤 유지
3. 이모지는 2-3개만 적절히 사용
4. 마지막에 해시태그 10개 추가 (줄바꿈 후)
5. 해시태그는 관련성 높은 것으로 구성 (#카페 #커피 #감성카페 등)
6. 광고성 문구 (할인, 이벤트 등) 지양
7. 계절감과 날짜 정보 자연스럽게 반영`;

  const userPrompt = `## 가게 정보
- 가게명: ${shop.name}
- 업종: ${shop.industry === 'cafe' ? '카페' : shop.industry}
- 분위기: ${shop.vibeKeywords.join(', ')}
- 대표 메뉴: ${shop.representMenus.join(', ')}

## 오늘 날짜
${month}월 ${date}일 ${dayOfWeek}요일

위 정보를 바탕으로 오늘 올릴 인스타그램 캡션을 작성해주세요.
자연스럽게 오늘의 분위기나 메뉴를 소개하는 내용으로 작성합니다.`;

  const promptUsed = `[System]: ${systemPrompt}\n\n[User]: ${userPrompt}`;

  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 500,
      stream: true,
    });

    let fullCaption = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullCaption += content;
        yield content;
      }
    }

    return {
      caption: fullCaption.trim(),
      promptUsed,
    };
  } catch (error) {
    console.error('Caption streaming error:', error);
    throw error;
  }
}

/**
 * 캡션만 재생성 (기존 콘텐츠의 캡션 교체용)
 */
export async function regenerateCaption(
  options: CaptionGenerationOptions & { previousCaption: string }
): Promise<CaptionGenerationResult> {
  const { shop, previousCaption } = options;

  const today = new Date();
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][today.getDay()];
  const month = today.getMonth() + 1;
  const date = today.getDate();

  const systemPrompt = `당신은 소상공인 카페의 인스타그램 마케팅 전문가입니다.
따뜻하고 감성적인 한국어로 인스타그램 캡션을 작성합니다.

## 작성 규칙
1. 본문은 200자 이내로 작성
2. 자연스럽고 진정성 있는 톤 유지
3. 이모지는 2-3개만 적절히 사용
4. 마지막에 해시태그 10개 추가 (줄바꿈 후)
5. 해시태그는 관련성 높은 것으로 구성 (#카페 #커피 #감성카페 등)
6. 광고성 문구 (할인, 이벤트 등) 지양
7. 계절감과 날짜 정보 자연스럽게 반영
8. 이전 캡션과는 다른 새로운 관점으로 작성`;

  const userPrompt = `## 가게 정보
- 가게명: ${shop.name}
- 업종: ${shop.industry === 'cafe' ? '카페' : shop.industry}
- 분위기: ${shop.vibeKeywords.join(', ')}
- 대표 메뉴: ${shop.representMenus.join(', ')}

## 오늘 날짜
${month}월 ${date}일 ${dayOfWeek}요일

## 이전 캡션 (다르게 작성해주세요)
${previousCaption}

위 정보를 바탕으로 이전 캡션과는 다른 새로운 느낌의 인스타그램 캡션을 작성해주세요.`;

  const promptUsed = `[System]: ${systemPrompt}\n\n[User]: ${userPrompt}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.9, // 약간 더 높은 temperature로 다양성 확보
      max_tokens: 500,
    });

    const caption = response.choices[0]?.message?.content?.trim();

    if (!caption) {
      throw new Error('OpenAI returned empty response');
    }

    return {
      caption,
      promptUsed,
    };
  } catch (error) {
    console.error('Caption regeneration error:', error);
    throw error;
  }
}
