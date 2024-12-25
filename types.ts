export interface DashboardData {
    riskMetrics: {
      currentRisk: number;
      optimalBid: number;
      timeToEviction: string;
      budgetUtilization: number;
    };
    historicalData: Array<{
      timestamp: string;
      risk: number;
      bid: number;
      threshold: number;
    }>;
    modelMetrics: {
      accuracy: number;
      precision: number;
      recall: number;
      f1Score: number;
    };
    aiMetrics: {
      bidDifference: number;
      timePressure: number;
      stakeToBidRatio: number;
      predictionAccuracy: number;
      lastOptimization: string;
    };
  }