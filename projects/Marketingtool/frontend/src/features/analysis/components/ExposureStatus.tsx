// Exposure Status Component
/**
 * Display current exposure status with captured screenshot placeholder
 */

"use client";

import { Camera, CheckCircle2, XCircle } from "lucide-react";
import type { AnalysisResponse } from "@/types/analysis";

interface ExposureStatusProps {
  analysis: AnalysisResponse;
}

export function ExposureStatus({ analysis }: ExposureStatusProps) {
  const placeInfo = analysis.place_info;
  const photoInfo = analysis.photo_info;
  const reviewInfo = analysis.review_info;
  const channelInfo = analysis.channel_info;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
        현재 노출 상태
      </h3>

      {/* Screenshot placeholder */}
      <div className="mb-6 bg-slate-100 dark:bg-slate-900 rounded-lg p-8 flex items-center justify-center min-h-64">
        <div className="text-center">
          <Camera className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            모바일 노출 스크린샷
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
            (실제 구현 시 스크린샷 캡처 기능 추가)
          </p>
        </div>
      </div>

      {/* Status items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Photo status */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">대표 사진</span>
            <CheckCircle2 className={photoInfo?.has_5_photos ? "text-green-500" : "text-yellow-500"} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {photoInfo?.photo_count || 0}장 등록
            {photoInfo?.has_video && <span className="ml-2 text-blue-600">+ 영상</span>}
            {photoInfo?.has_gif && <span className="ml-2 text-purple-600">+ GIF</span>}
          </p>
        </div>

        {/* Review status */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">사장님 답글</span>
            {reviewInfo?.has_owner_reply ? (
              <CheckCircle2 className="text-green-500" />
            ) : (
              <XCircle className="text-red-500" />
            )}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            총 {reviewInfo?.review_count || 0}개 리뷰
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            {reviewInfo?.recent_replies || 0}개 최근 답글
          </p>
        </div>

        {/* Blog status */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">블로그 노출</span>
            {channelInfo?.blog_count && channelInfo.blog_count > 0 ? (
              <CheckCircle2 className="text-green-500" />
            ) : (
              <XCircle className="text-red-500" />
            )}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {channelInfo?.blog_count || 0}건 노출
          </p>
        </div>

        {/* External channels */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="font-medium text-slate-700 dark:text-slate-300 w-24">인스타그램</span>
              {channelInfo?.has_instagram ? (
                <CheckCircle2 className="ml-auto text-green-500" />
              ) : (
                <XCircle className="ml-auto text-slate-400" />
              )}
            </div>
            <div className="flex items-center">
              <span className="font-medium text-slate-700 dark:text-slate-300 w-24">카카오톡 채널</span>
              {channelInfo?.has_kakao_channel ? (
                <CheckCircle2 className="ml-auto text-green-500" />
              ) : (
                <XCircle className="ml-auto text-slate-400" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
