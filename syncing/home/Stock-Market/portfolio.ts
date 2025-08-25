import {Stock_Utils} from "./stock-utils";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.ui.setTailTitle("Portfolio Summary");
  // const data = isRunningOnCurrentMachine(ns, ns.getScriptName());
  // if (data.onlineRunningTime > 5) {
  //   ns.kill(data.pid);
  //   ns.ui.closeTail(data.pid);
  // }

  const symbols: string[] = ns.stock.getSymbols();

  while (true) {
    const cash = ns.getServerMoneyAvailable("home");
    let stockValue = 0;
    let stockProfit = 0;
    const symStock: Record<
      string,
      {
        shares: number;
        avgPrice: number;
        curPrice: number;
      }
    > = {};

    // Lấy thông tin cổ phiếu đang nắm giữ
    for (const sym of symbols) {
      const [shares, avgPrice] = ns.stock.getPosition(sym);
      if (shares > 0) {
        const curPrice = ns.stock.getPrice(sym); // Chỉ gọi 1 lần
        stockValue += shares * avgPrice;
        stockProfit += (curPrice - avgPrice) * shares;
        symStock[sym] = {
          shares,
          avgPrice,
          curPrice,
        };
      }
    }

    const total = cash + stockValue;
    const logs: string[] = [];
    logs.push(
      `\x1b[36m[PORTFOLIO] 💵 ` +
        `Cash: ${ns.formatNumber(cash)} 📊 ` +
        `Stocks: ${ns.formatNumber(stockValue)}` +
        `\x1b[0m`
    );
    logs.push(
      `\x1b[36m[PORTFOLIO] 💰 ` +
        `Total Asset: ${ns.formatNumber(total)} | ` +
        `Total Profit: ${ns.formatNumber(stockProfit)}` +
        `\x1b[0m`
    );

    // Hiển thị thông tin từng cổ phiếu
    for (const sym in symStock) {
      const {shares, avgPrice, curPrice} = symStock[sym];
      const profit = (curPrice - avgPrice) / avgPrice;
      const color = getColorByProfit(profit);

      logs.push(
        `\x1b[36m${sym}: \x1b[32m▶️ ` +
          `Avg: ${ns.formatNumber(avgPrice)} - Cur: ${ns.formatNumber(curPrice)} | ` +
          `Cost: ${ns.formatNumber(shares * avgPrice)}`
      );

      logs.push(
        `${color}▶️ ` +
          `Lợi nhuận: ${ns.formatPercent(profit)} - ` +
          `Profit: ${ns.formatNumber(shares * (curPrice - avgPrice))} \x1b[32m| ` +
          `Shares: ${ns.formatNumber(shares)}`
      );
    }

    // In log đã gom
    ns.clearLog();
    for (const line of logs) ns.print(line);

    Stock_Utils.autoResizeTailFromLogs(ns, logs);
    await ns.sleep(1000);
  }
}

// Hàm xác định màu dựa trên lợi nhuận
function getColorByProfit(profit: number): string {
  if (profit >= 0) return "\x1b[32m"; // Lãi: xanh
  if (profit <= -0.1) return "\x1b[31m"; // Lỗ nặng: đỏ
  return "\x1b[33m"; // Lỗ nhẹ: vàng
}
