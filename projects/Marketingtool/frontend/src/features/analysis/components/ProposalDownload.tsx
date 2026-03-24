// Proposal Download Component
/**
 * Button to download the generated proposal PPT
 */

"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalysisResponse } from "@/types/analysis";
import { analysisService } from "@/services/analysis";

interface ProposalDownloadProps {
  analysis: AnalysisResponse;
}

export function ProposalDownload({ analysis }: ProposalDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await analysisService.downloadProposal(analysis.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marketing-proposal-${analysis.id}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert("제안서 다운로드에 실패했습니다.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">
            제안서 다운로드
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            분석 결과가 담긴 PPT 파일을 다운로드하세요.
          </p>
        </div>

        <Button
          onClick={handleDownload}
          disabled={isDownloading || analysis.status !== "completed"}
          size="lg"
          className="w-full sm:w-auto"
        >
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              다운로드 중...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              제안서 다운로드
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
