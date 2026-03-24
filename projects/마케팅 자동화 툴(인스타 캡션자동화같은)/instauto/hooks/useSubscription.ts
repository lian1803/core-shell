// hooks/useSubscription.ts
// 구독 관련 커스텀 훅

import { useState, useEffect, useCallback } from 'react';
import { PLAN_CONFIG, PlanType } from '@/types';

interface Subscription {
  id: string;
  plan: PlanType;
  planName: string;
  planPrice: number;
  regenerateLimit: number;
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  isActive: boolean;
  daysRemaining?: number;
  trialStartAt?: string;
  trialEndAt?: string;
  trialExtended?: boolean;
  canExtendTrial?: boolean;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  canceledAt?: string | null;
  cancelReason?: string | null;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 구독 정보 조회
  const fetchSubscription = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscription');
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setSubscription(null);
          return null;
        }
        throw new Error(result.error?.message || '구독 정보를 불러오는데 실패했습니다');
      }

      setSubscription(result.data?.subscription || null);
      return result.data?.subscription;
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 리뷰로 체험 연장
  const extendTrial = useCallback(async (reviewUrl: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/trial/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewUrl }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || '체험 연장에 실패했습니다');
      }

      // 최신 구독 정보 다시 가져오기
      await fetchSubscription();
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchSubscription]);

  // 구독 취소
  const cancelSubscription = useCallback(async (reason?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || '구독 취소에 실패했습니다');
      }

      await fetchSubscription();
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchSubscription]);

  // 컴포넌트 마운트 시 구독 정보 로드
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // 파생 상태
  const isExpired = subscription?.status === 'EXPIRED' || subscription?.status === 'CANCELED';
  const isExpiringSoon = (subscription?.daysRemaining ?? 0) <= 7 && !isExpired;
  const isTrial = subscription?.status === 'TRIAL';
  const isActive = subscription?.isActive ?? false;
  const canExtendTrial = isTrial && !subscription?.trialExtended;

  return {
    // 상태
    subscription,
    isLoading,
    error,

    // 파생 상태
    isActive,
    isTrial,
    isExpired,
    isExpiringSoon,
    canExtendTrial,
    daysRemaining: subscription?.daysRemaining ?? 0,
    plan: subscription?.plan ?? 'BASIC',
    planName: subscription?.planName ?? PLAN_CONFIG.BASIC.name,
    planPrice: subscription?.planPrice ?? PLAN_CONFIG.BASIC.price,
    regenerateLimit: subscription?.regenerateLimit ?? PLAN_CONFIG.BASIC.regenerateLimit,

    // 액션
    refetch: fetchSubscription,
    extendTrial,
    cancelSubscription,
  };
}
