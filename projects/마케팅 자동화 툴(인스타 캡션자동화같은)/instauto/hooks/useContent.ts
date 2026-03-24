// hooks/useContent.ts
// 콘텐츠 관련 커스텀 훅

import { useState, useCallback } from 'react';
import { useContentStore, GenerationStatus } from '@/stores/contentStore';
import { SSEEvent } from '@/types';

interface ContentData {
  id: string;
  caption: string;
  editedCaption?: string | null;
  imageUrl: string;
  thumbnailUrl?: string | null;
  status: 'GENERATING' | 'READY' | 'PUBLISHED' | 'FAILED';
  regenerateCount?: number;
  targetDate?: string;
  publishedAt?: string | null;
  createdAt?: string;
}

interface RegenerateInfo {
  canRegenerate: boolean;
  remaining: number;
  limit: number;
}

export function useContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    currentContent,
    generationStatus,
    generationMessage,
    progress,
    streamedCaption,
    regenerateInfo,
    error: storeError,
    errorCode: storeErrorCode,
    setCurrentContent,
    setGenerationStatus,
    setProgress,
    setStreamedCaption,
    appendStreamedCaption,
    setError,
    setRegenerateInfo,
    reset,
  } = useContentStore();

  // 오늘의 콘텐츠 조회 (직접 API 호출)
  const fetchTodayContent = useCallback(async () => {
    setIsLoading(true);
    setLocalError(null);

    try {
      // me API에서 오늘 콘텐츠 정보 가져오기
      const response = await fetch('/api/me');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || '정보를 불러오는데 실패했습니다');
      }

      if (data.data?.todayContent?.hasContent) {
        // 콘텐츠 상세 정보 조회
        const contentId = data.data.todayContent.id;
        const contentResponse = await fetch(`/api/content/${contentId}`);
        const contentData = await contentResponse.json();

        if (contentResponse.ok && contentData.data?.content) {
          setCurrentContent(contentData.data.content);
          if (contentData.data.regenerate) {
            setRegenerateInfo(contentData.data.regenerate);
          }
          return contentData.data.content;
        }
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setLocalError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentContent, setRegenerateInfo]);

  // SSE로 콘텐츠 생성
  const startGeneration = useCallback(() => {
    reset();
    setGenerationStatus('start', '콘텐츠 생성을 시작합니다');

    const eventSource = new EventSource('/api/content/generate');

    eventSource.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);

        switch (data.step) {
          case 'start':
            setGenerationStatus('start', data.message);
            break;

          case 'caption_generating':
            setGenerationStatus('caption_generating', data.message);
            if (data.data?.caption) {
              appendStreamedCaption(data.data.caption);
            }
            break;

          case 'caption_done':
            setGenerationStatus('caption_done', data.message);
            if (data.data?.caption) {
              setStreamedCaption(data.data.caption);
            }
            break;

          case 'image_generating':
            setGenerationStatus('image_generating', data.message);
            break;

          case 'image_done':
            setGenerationStatus('image_done', data.message);
            break;

          case 'saving':
            setGenerationStatus('saving', data.message);
            break;

          case 'complete':
            setGenerationStatus('complete', data.message);
            if (data.data) {
              setCurrentContent({
                id: data.data.contentId!,
                caption: data.data.caption!,
                imageUrl: data.data.imageUrl!,
                thumbnailUrl: data.data.thumbnailUrl,
                status: 'READY',
              });
            }
            eventSource.close();
            break;

          case 'error':
            setError(
              data.error?.message || '콘텐츠 생성 중 오류가 발생했습니다',
              data.error?.code || null
            );
            eventSource.close();
            break;
        }
      } catch {
        console.error('Failed to parse SSE message');
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setError('서버와의 연결이 끊어졌습니다');
    };

    return eventSource;
  }, [
    reset,
    setGenerationStatus,
    appendStreamedCaption,
    setStreamedCaption,
    setCurrentContent,
    setError,
  ]);

  // 콘텐츠 재생성
  const regenerateContent = useCallback(
    async (contentId: string, type: 'image' | 'caption') => {
      setIsLoading(true);
      setLocalError(null);

      try {
        const response = await fetch('/api/content/regenerate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentId, type }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || '재생성에 실패했습니다');
        }

        if (data.data?.content) {
          setCurrentContent(data.data.content);
        }
        if (data.data?.regenerate) {
          setRegenerateInfo(data.data.regenerate);
        }

        return data.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
        setLocalError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [setCurrentContent, setRegenerateInfo]
  );

  // 캡션 수정
  const updateCaption = useCallback(
    async (contentId: string, editedCaption: string) => {
      setIsLoading(true);
      setLocalError(null);

      try {
        const response = await fetch(`/api/content/${contentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ editedCaption }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || '캡션 수정에 실패했습니다');
        }

        if (data.data?.content) {
          setCurrentContent({
            ...currentContent!,
            ...data.data.content,
          });
        }

        return data.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
        setLocalError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [setCurrentContent, currentContent]
  );

  // 다운로드 (PUBLISHED 상태로 전환)
  const downloadContent = useCallback(
    async (contentId: string) => {
      try {
        const response = await fetch(`/api/content/${contentId}/download`, {
          method: 'POST',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || '다운로드 URL 생성에 실패했습니다');
        }

        // 다운로드 URL로 이미지 다운로드
        if (data.data?.downloadUrl) {
          const link = document.createElement('a');
          link.href = data.data.downloadUrl;
          link.download = `instauto-${contentId}.png`;
          link.click();

          // 상태 업데이트
          if (currentContent) {
            setCurrentContent({
              ...currentContent,
              status: 'PUBLISHED',
              publishedAt: data.data.content?.publishedAt,
            });
          }
        }

        return data.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
        setLocalError(message);
        throw err;
      }
    },
    [setCurrentContent, currentContent]
  );

  // 클립보드에 캡션 복사
  const copyCaption = useCallback(async () => {
    if (!currentContent) return;

    const caption = currentContent.editedCaption || currentContent.caption;

    try {
      await navigator.clipboard.writeText(caption);
      return true;
    } catch {
      console.error('Failed to copy caption');
      return false;
    }
  }, [currentContent]);

  return {
    // 상태
    currentContent,
    generationStatus,
    generationMessage,
    progress,
    streamedCaption,
    regenerateInfo,
    isLoading,
    error: localError || storeError,
    errorCode: storeErrorCode,

    // 액션
    fetchTodayContent,
    startGeneration,
    regenerateContent,
    updateCaption,
    downloadContent,
    copyCaption,
    reset,
  };
}
