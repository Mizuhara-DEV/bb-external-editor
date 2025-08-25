import {Stock_Utils, StockInfo} from "./stock-utils";

export type StrategyName = "safe" | "wave" | "diverse";

export interface TradePlan {
  sym: string;
  targetShares: number; // số lượng cổ phiếu long mong muốn giữ sau khi áp dụng chiến thuật
  reason: string;
}

export interface IStrategy {
  readonly name: StrategyName;
  plan(ns: NS, symbols: string[], reserve: number, maxPerStock: number): TradePlan[];
}

/** Chiến thuật an toàn dài hạn */
export class SafeStrategy implements IStrategy {
  readonly name: StrategyName = "safe";
  plan(ns: NS, symbols: string[], reserve: number, maxPerStock: number): TradePlan[] {
    const candidates = symbols
      .map((sym) => ({sym, ...Stock_Utils.getStockInfo(ns, sym)}))
      .filter((s) => s.forecast >= 0.6 && s.volatility < 0.03)
      .sort((a, b) => b.forecast - a.forecast)
      .slice(0, 4);

    if (candidates.length === 0) return [];

    const budgetEach = maxPerStock; // mỗi mã tối đa theo --max
    const plans: TradePlan[] = [];
    for (const c of candidates) {
      const buyable = Stock_Utils.calcMaxShares(ns, c.sym, reserve, budgetEach);
      plans.push({sym: c.sym, targetShares: buyable, reason: "safe: f >= 0.6 & vol < 0.03"});
    }
    return plans;
  }
}

/** Chiến thuật lướt sóng nhanh */
export class WaveStrategy implements IStrategy {
  readonly name: StrategyName = "wave";
  plan(ns: NS, symbols: string[], reserve: number, maxPerStock: number): TradePlan[] {
    // Ưu tiên biến động mạnh & forecast cao
    const candidates = symbols
      .map((sym) => ({sym, ...Stock_Utils.getStockInfo(ns, sym)}))
      .filter((s) => s.forecast >= 0.65 && s.volatility >= 0.04)
      .sort((a, b) => b.forecast - a.forecast || b.volatility - a.volatility)
      .slice(0, 3);

    const plans: TradePlan[] = [];
    for (const c of candidates) {
      const buyable = Stock_Utils.calcMaxShares(ns, c.sym, reserve, maxPerStock);
      plans.push({sym: c.sym, targetShares: buyable, reason: "wave: f >= 0.65 & vol >= 0.04"});
    }
    return plans;
  }
}

/** Chiến thuật đa dạng hóa thông minh */
export class DiverseStrategy implements IStrategy {
  readonly name: StrategyName = "diverse";
  plan(ns: NS, symbols: string[], reserve: number, maxPerStock: number): TradePlan[] {
    const scored = symbols
      .map((sym) => {
        const info = Stock_Utils.getStockInfo(ns, sym);
        const score = info.forecast * (1 - info.volatility); // điểm càng cao càng tốt
        return {sym, score, info};
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const totalScore = scored.reduce((s, x) => s + x.score, 0) || 1;
    const plans: TradePlan[] = [];
    for (const s of scored) {
      const budgetForThis = maxPerStock * (s.score / totalScore); // phân bổ theo tỷ lệ điểm
      const maxSharesByBudget = Math.floor(budgetForThis / s.info.price);
      const capByMax = Stock_Utils.calcMaxShares(ns, s.sym, reserve, maxPerStock);
      const target = Math.min(maxSharesByBudget, capByMax);
      if (target > 0) {
        plans.push({sym: s.sym, targetShares: target, reason: `diverse: score ${s.score.toFixed(3)}`});
      }
    }
    return plans;
  }
}

export function getStrategy(name: StrategyName): IStrategy {
  switch (name) {
    case "safe":
      return new SafeStrategy();
    case "wave":
      return new WaveStrategy();
    case "diverse":
      return new DiverseStrategy();
  }
}
