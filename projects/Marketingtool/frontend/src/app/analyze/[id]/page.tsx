// Analysis Result Page
/**
 * Page displaying analysis results with tabs
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAnalysis } from "@/features/analysis/hooks/useAnalysis";
import { ResultTabs } from "@/features/analysis/components/ResultTabs";
import { BusinessOverview } from "@/features/analysis/components/BusinessOverview";
import { DiagnosisResult } from "@/features/analysis/components/DiagnosisResult";
import { ExposureStatus } from "@/features/analysis/components/ExposureStatus";
import { KeywordStrategy } from "@/features/analysis/components/KeywordStrategy";
import { ProposalDownload } from "@/features/analysis/components/ProposalDownload";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { AnalysisResponse } from "@/types/analysis";

export default function AnalysisResultPage() {
  const router = useRouter();
  const params = useParams();
  const { data: analysis, isLoading, error, refetch } = useAnalysis((params.id as string) || "");

  const [activeTab, setActiveTab] = useState("overview");

  // Poll for updates when processing
  useEffect(() => {
    if (analysis?.status === "processing") {
      const interval = setInterval(() => {
        refetch();
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [analysis?.status, refetch]);

  if (isLoading && !analysis) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">
            분석 중...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-8 max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-4">
            오류가 발생했습니다
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            분석 결과를 불러오는 데 실패했습니다.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => router.push("/")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              홈으로
            </Button>
            <Button onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis || analysis.status === "failed") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">
            {analysis?.status === "failed" ? "분석 실패" : "결과를 찾을 수 없습니다"}
          </h2>
          <Button onClick={() => router.push("/")} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  // Processing state
  if (analysis.status === "pending" || analysis.status === "processing") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-8 max-w-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
            분석 진행 중
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {analysis.business_name}에 대한 분석을 진행하고 있습니다.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
            잠시만 기다려주세요...
          </p>
        </div>
      </div>
    );
  }

  // Results display
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push("/")}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                뒤로
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {analysis.business_name}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  분석 ID: {analysis.id}
                </p>
              </div>
            </div>
            {analysis.status === "completed" && (
              <Button onClick={() => refetch()} size="sm" variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                새로고침
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="mb-6">
          <ResultTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && <BusinessOverview analysis={analysis} />}
        {activeTab === "diagnosis" && <DiagnosisResult analysis={analysis} />}
        {activeTab === "exposure" && <ExposureStatus analysis={analysis} />}
        {activeTab === "keyword" && <KeywordStrategy analysis={analysis} />}

        {/* Proposal Download (always shown when completed) */}
        {analysis.status === "completed" && (
          <div className="mt-6">
            <ProposalDownload analysis={analysis} />
          </div>
        )}
      </main>
    </div>
  );
}
