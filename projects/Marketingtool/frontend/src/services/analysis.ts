// Analysis Service
/**
 * Analysis business logic service
 * Following TypeScript naming conventions (camelCase)
 */

import type {
  AnalysisRequest,
  AnalysisResponse,
} from "@/types/analysis";
import { apiClient } from "@/lib/api/client";

export const analysisService = {
  /**
   * Create new analysis request
   */
  async analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
    return apiClient.post<AnalysisResponse>("/analyze", request);
  },

  /**
   * Get analysis result by ID
   */
  async getResult(id: string): Promise<AnalysisResponse> {
    return apiClient.get<AnalysisResponse>(`/analyze/${id}`);
  },

  /**
   * List all analyses
   */
  async list(): Promise<AnalysisResponse[]> {
    return apiClient.get<AnalysisResponse[]>("/analyze");
  },

  /**
   * Download proposal file
   */
  async downloadProposal(id: string): Promise<Blob> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/analyze/${id}/download`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download proposal: ${response.status}`);
    }

    return response.blob();
  },
};
