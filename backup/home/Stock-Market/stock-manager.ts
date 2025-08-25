import {Stock_Utils} from "./stock-utils";
import {IStrategy, StrategyName, TradePlan, getStrategy} from "./stock-strategies";

/**
 * Áp dụng chiến thuật cho toàn bộ symbol:
 * - Sinh kế hoạch (targetShares) từ chiến thuật
 * - So sánh với vị thế hiện tại
 * - Buy/Sell phần chênh lệch
 * - Áp dụng stop-loss/take-profit tùy chiến thuật (đặc biệt cho wave)
 */
export function applyStrategy(
  ns: NS,
  symbols: string[],
  strategyName: StrategyName,
  reserve: number,
  maxPerStock: number,
  demo: boolean
): void {
  const strat = getStrategy(strategyName);
  const plans = strat.plan(ns, symbols, reserve, maxPerStock);
  const planMap = new Map<string, TradePlan>(plans.map((p) => [p.sym, p]));

  for (const sym of symbols) {
    const [shares, avgPrice] = ns.stock.getPosition(sym);
    const price = ns.stock.getPrice(sym);
    const forecast = ns.stock.has4SDataTIXAPI() ? ns.stock.getForecast(sym) : 0.5;

    const plan = planMap.get(sym);
    const target = plan ? plan.targetShares : 0;

    // Extra rules cho wave: SL/TP nhanh
    if (strat.name === "wave" && shares > 0) {
      const pnl = (price - avgPrice) / Math.max(1, avgPrice);
      if (pnl <= -0.05 || (pnl >= 0.03 && forecast < 0.55) || forecast < 0.45) {
        log(
          ns,
          demo,
          "SELL",
          sym,
          shares,
          price,
          `wave-exit PnL: ${(pnl * 100).toFixed(2)}% f: ${forecast.toFixed(2)}`
        );
        if (!demo) ns.stock.sellStock(sym, shares);
        continue;
      }
    }

    if (target > shares) {
      const toBuy = target - shares;
      const cost = toBuy * price;
      if (toBuy > 0) {
        log(ns, demo, "BUY", sym, toBuy, price, plan?.reason || strat.name);
        if (!demo) ns.stock.buyStock(sym, toBuy);
      }
    } else if (target < shares) {
      const toSell = shares - target;
      if (toSell > 0) {
        const pnl = (price - avgPrice) * toSell;
        const prefix: string = pnl > 0 ? "+" : "";
        log(ns, demo, "SELL", sym, toSell, price, `${strat.name}-rebalance PnL: ${prefix + ns.formatNumber(pnl)}$`);
        if (!demo) ns.stock.sellStock(sym, toSell);
      }
    }
  }
}

function log(ns: NS, demo: boolean, action: "BUY" | "SELL", sym: string, shares: number, price: number, msg: string) {
  const tag = demo ? `[DEMO-${action}]` : `[${action}]`;
  const color = action === "BUY" ? "\x1b[32m" : "\x1b[33m";
  ns.print(
    `${color}${tag} ${sym} | Price: ${ns.formatNumber(price)} | Shares: ${ns.formatNumber(shares)} | ${msg}\x1b[0m`
  );
}
