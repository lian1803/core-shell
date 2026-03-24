// Business Overview Component
/**
 * Display basic business information
 */

"use client";

import { MapPin, Phone, ExternalLink } from "lucide-react";
import type { PlaceBasicInfo, AnalysisResponse } from "@/types/analysis";

interface BusinessOverviewProps {
  analysis: AnalysisResponse;
}

export function BusinessOverview({ analysis }: BusinessOverviewProps) {
  const placeInfo = analysis.place_info;

  if (!placeInfo) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          업체 정보를 불러오는 중입니다...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
        업체 개요
      </h3>

      <div className="space-y-4">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            상호명
          </label>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {placeInfo.business_name}
          </p>
        </div>

        {/* Place URL */}
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            플레이스 URL
          </label>
          <a
            href={placeInfo.place_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            {placeInfo.place_url}
          </a>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            주소
          </label>
          <div className="flex items-start text-slate-900 dark:text-slate-50">
            <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-primary" />
            <span className="break-all">{placeInfo.address}</span>
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            전화번호
          </label>
          <div className="flex items-center text-slate-900 dark:text-slate-50">
            <Phone className="h-4 w-4 mr-2 text-primary" />
            <a
              href={`tel:${placeInfo.phone}`}
              className="hover:underline"
            >
              {placeInfo.phone}
            </a>
          </div>
        </div>

        {/* Analysis Date */}
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            분석 일시
          </label>
          <p className="text-slate-600 dark:text-slate-400">
            {new Date(analysis.created_at).toLocaleString("ko-KR")}
          </p>
        </div>
      </div>
    </div>
  );
}
