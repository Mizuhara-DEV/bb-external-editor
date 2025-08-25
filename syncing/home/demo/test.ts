/* export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.ui.openTail();
  const syms = ns.stock.getSymbols();

  while (true) {
    await ns.sleep(500); // Tránh spam API
    ns.clearLog();

    const stockData: Record<string, {share: number; avgPrices: number}> = {};
    for (const sym of syms) {
      const [shares, avgPrice] = ns.stock.getPosition(sym);
      const curPrice = ns.formatNumber(ns.stock.getPrice(sym));
      const volatility = ns.formatPercent(ns.stock.getVolatility(sym));
      if (shares > 0) {
        const avgPriceF = ns.formatNumber(avgPrice);
        ns.print(
          `Cổ phiếu ${sym} | Giá hiện tại: ${curPrice} | Giá trung bình: ${avgPriceF} | Biến động: ${volatility}`
        );
      }
    }
  }
} */

/* tprint Output:
  Running script with 1 thread, pid 6142 and args: [].
  demo/test.ts: Font Size:14
  demo/test.ts: Line Height:1.2
  demo/test.ts: Font Family:JetBrainsMono, "Courier New", monospace
*/
/* export async function main(ns: NS) {
  let styles = ns.ui.getStyles();
  ns.tprint("Font Size:", styles.tailFontSize);
  ns.tprint("Line Height:", styles.lineHeight);
  ns.tprint("Font Family:", styles.fontFamily);
}
 */
