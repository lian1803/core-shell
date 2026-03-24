// Diagnosis Result Component
/**
 * Display auto-generated diagnosis comments
 */

"use client";

import { CheckCircle, AlertCircle, Info } from "lucide-react";
import type { DiagnosisComment, AnalysisResponse } from "@/types/analysis";

interface DiagnosisResultProps {
  analysis: AnalysisResponse;
}

export function DiagnosisResult({ analysis }: DiagnosisResultProps) {
  const comments = analysis.diagnosis_comments || [];

  if (comments.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
        <div className="text-center text-slate-600 dark:text-slate-400">
          <Info className="mx-auto h-12 w-12 mb-4 text-slate-400" />
          <p>진단 결과가 없습니다.</p>
        </div>
      </div>
    );
  }

  const getIconForCategory = (category: string) => {
    if (category === "review") return <CheckCircle className="text-red-500" />;
    if (category === "photo") return <AlertCircle className="text-yellow-500" />;
    return <Info className="text-blue-500" />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "review":
        return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20";
      case "photo":
        return "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20";
      case "channel":
        return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20";
      default:
        return "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
        종합 진단 결과
      </h3>

      <div className="space-y-3">
        {comments.map((comment, index) => (
          <div
            key={index}
            className={`flex items-start p-4 rounded-lg border ${getCategoryColor(comment.category)}`}
          >
            <div className="flex-shrink-0 mr-3 mt-0.5">
              {getIconForCategory(comment.category)}
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-800 dark:text-slate-200">
                {comment.message}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          💡 위 항목을 개선하면 노출 상태가 향상될 수 있습니다.
        </p>
      </div>
    </div>
  );
}
