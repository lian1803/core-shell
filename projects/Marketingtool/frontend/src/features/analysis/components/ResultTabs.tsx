// Result Tabs Component
/**
 * Tab navigation for analysis results
 */

"use client";

import * as React from "react";
import { BarChart3, FileText, TrendingUp, CheckCircle } from "lucide-react";

export interface ResultTab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface ResultTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS: ResultTab[] = [
  { id: "overview", label: "업체 개요", icon: <FileText className="h-4 w-4" /> },
  { id: "exposure", label: "노출 상태", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "keyword", label: "키워드 전략", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "diagnosis", label: "진단 결과", icon: <CheckCircle className="h-4 w-4" /> },
];

export function ResultTabs({ activeTab, onTabChange }: ResultTabsProps) {
  return (
    <div className="border-b border-border mb-6">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium
              transition-colors
              focus:outline-none
              ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }
            `}
            aria-current={activeTab === tab.id ? "page" : undefined}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
