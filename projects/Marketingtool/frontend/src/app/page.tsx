// Main Page
/**
 * Home page with analysis search form
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAnalyze } from "@/features/analysis/hooks/useAnalysis";
import type { AnalysisRequest } from "@/types/analysis";
import { Search, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function HomePage() {
  const router = useRouter();
  const analyzeMutation = useAnalyze();

  const [formData, setFormData] = useState<AnalysisRequest>({
    business_name: "",
    region: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.business_name.trim()) {
      toast.error("업체명을 입력해주세요.");
      return;
    }

    try {
      const response = await analyzeMutation.mutateAsync(formData);
      // Navigate to result page
      router.push(`/analyze/${response.id}`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Marketing Tool
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            네이버 플레이스 마케팅 분석 툴
          </p>
        </header>

        {/* Search Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
            <div className="mb-6 flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <Search className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">
                업체명 분석
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="business_name"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  업체명 *
                </label>
                <Input
                  id="business_name"
                  type="text"
                  placeholder="예: 강남 양주 축구교실"
                  value={formData.business_name}
                  onChange={(e) =>
                    setFormData({ ...formData, business_name: e.target.value })
                  }
                  disabled={analyzeMutation.isPending}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="region"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  지역명 (선택사항)
                </label>
                <Input
                  id="region"
                  type="text"
                  placeholder="예: 서울 강남구"
                  value={formData.region}
                  onChange={(e) =>
                    setFormData({ ...formData, region: e.target.value })
                  }
                  disabled={analyzeMutation.isPending}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={analyzeMutation.isPending}
              >
                {analyzeMutation.isPending ? (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    분석 시작
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-sm text-slate-600 dark:text-slate-400">
              <p className="font-medium mb-2">
                분석 항목:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>대표 사진 (개수, 영상/GIF)</li>
                <li>리뷰 건수 및 사장님 답글</li>
                <li>블로그 노출 수</li>
                <li>키워드 검색량 (PC/모바일)</li>
                <li>타겟 분석 (성비, 연령, 요일)</li>
                <li>현재 순위</li>
                <li>확장 키워드</li>
                <li>자동 생성 제안서 (PPT)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-slate-600 dark:text-slate-400">
          <p>
            © 2024 Marketing Tool. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
