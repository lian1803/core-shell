// Keyword Strategy Component
/**
 * Display keyword statistics and expanded keywords
 */

"use client";

import { TrendingUp, Search } from "lucide-react";
import type { AnalysisResponse } from "@/types/analysis";

interface KeywordStrategyProps {
  analysis: AnalysisResponse;
}

export function KeywordStrategy({ analysis }: KeywordStrategyProps) {
  const keywordStats = analysis.keyword_stats;
  const expandedKeywords = analysis.expanded_keywords || [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
        키워드 전략
      </h3>

      {/* Main keyword stats */}
      {keywordStats && (
        <div className="mb-6 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <h4 className="text-base font-medium text-slate-900 dark:text-slate-50 mb-3 flex items-center">
            <Search className="mr-2 h-5 w-5 text-primary" />
            메인 키워드: {keywordStats.keyword}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search volume */}
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                월간 검색량
              </p>
              <div className="flex items-end space-x-2">
                <div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                    {(keywordStats.monthly_search_pc + keywordStats.monthly_search_mobile).toLocaleString()}
                  </span>
                  <span className="text-sm text-slate-500">건</span>
                </div>
              </div>
              <div className="flex gap-1 mt-1">
                <div className="text-xs bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                  PC: {keywordStats.monthly_search_pc.toLocaleString()}
                </div>
                <div className="text-xs bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                  Mobile: {keywordStats.monthly_search_mobile.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Gender ratio */}
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                성비
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="h-2 bg-blue-500 rounded-full">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${keywordStats.gender_ratio.male}%` }}
                    ></div>
                  </div>
                  <span className="text-xs ml-1">남성 {keywordStats.gender_ratio.male}%</span>
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-pink-500 rounded-full">
                    <div
                      className="h-2 bg-pink-500 rounded-full"
                      style={{ width: `${keywordStats.gender_ratio.female}%` }}
                    ></div>
                  </div>
                  <span className="text-xs ml-1">여성 {keywordStats.gender_ratio.female}%</span>
                </div>
              </div>
            </div>

            {/* Age group */}
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                연령별
              </p>
              <div className="space-y-1">
                {Object.entries(keywordStats.age_group).map(([age, percent]) => (
                  <div key={age} className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400 w-16">
                      {age === "range_20s" && "20대"}
                      {age === "range_30s" && "30대"}
                      {age === "range_40s" && "40대"}
                      {age === "range_50s" && "50대"}
                    </span>
                    <div className="flex items-center">
                      <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full">
                        <div
                          className="h-2 bg-primary rounded-full"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <span className="text-xs ml-2 text-slate-900 dark:text-slate-50">{percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded keywords */}
      <div>
        <h4 className="text-base font-medium text-slate-900 dark:text-slate-50 mb-3 flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-primary" />
          확장 키워드 (연관 검색어)
        </h4>

        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y divide-slate-200 dark:divide-slate-700">
            {expandedKeywords.map((kw, index) => (
              <div
                key={index}
                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-900 dark:text-slate-50 text-sm">
                    {kw.keyword}
                  </span>
                  <span className="text-xs text-slate-500">
                    {kw.search_volume > 0 ? `${kw.search_volume.toLocaleString()}건/월` : "-"}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-slate-400">
                    연관성: {(kw.relevance_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}

            {expandedKeywords.length === 0 && (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <Search className="mx-auto h-12 w-12 mb-3 opacity-50" />
                <p>확장 키워드가 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          💡 이 키워드들로 확장된 광고 전략을 통해 노출을 최적화할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
