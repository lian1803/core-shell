// useAnalysis Hook
/**
 * React hook for analysis functionality
 * Following TypeScript naming conventions (camelCase, PascalCase)
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { analysisService } from "@/services/analysis";
import type {
  AnalysisRequest,
  AnalysisResponse,
} from "@/types/analysis";
import { toast } from "sonner";

// Query keys
export const ANALYSIS_KEYS = {
  all: ["analysis"] as const,
  detail: (id: string) => ["analysis", id] as const,
};

/**
 * Hook to get analysis result by ID
 */
export function useAnalysis(id: string) {
  return useQuery<AnalysisResponse>({
    queryKey: ["analysis", id],
    queryFn: () => analysisService.getResult(id),
    enabled: !!id,
  });
}

/**
 * Hook to list all analyses
 */
export function useAnalyses() {
  return useQuery({
    queryKey: ANALYSIS_KEYS.all,
    queryFn: analysisService.list,
  });
}

/**
 * Hook to create new analysis
 */
export function useAnalyze() {
  return useMutation({
    mutationFn: (request: AnalysisRequest) =>
      analysisService.analyze(request),
    onSuccess: (data: AnalysisResponse) => {
      toast.success("분석이 시작되었습니다.");
    },
    onError: (error: Error) => {
      toast.error(`분석 시작 실패: ${error.message}`);
    },
  });
}
