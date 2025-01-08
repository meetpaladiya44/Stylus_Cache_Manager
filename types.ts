// types.ts
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

export interface FullDashboardData extends DashboardData {
  recentPredictions: Array<{
    timestamp: string;
    prediction: string;
    confidence: number;
    action: string;
  }>;
  decayData: Array<{
    time: string;
    decayRate: number;
    predictedDecay: number;
  }>;
  contractParams: {
    minBid: number;
    timeLeft: string;
    currentBid: number;
    evictionThreshold: number;
    userStake: number;
  };
  evictionRiskFactors: Array<{
    factor: string;
    score: number;
  }>;
}