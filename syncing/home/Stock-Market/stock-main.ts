import {applyStrategy} from "./stock-manager";
import {StrategyName} from "./stock-strategies";
import {Stock_Utils} from "./stock-utils";

const scriptPortfolio = "Stock-Market/Portfolio.ts";

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");
  ns.ui.setTailTitle("Stock Market Manager (Multi-Strategy)");
  ns.ui.openTail();
  const flags = ns.flags([
    ["strategy", "safe"], // safe | wave | diverse
    ["max", 1e9], // tối đa tiền cho mỗi mã
    ["reserve", 100e6], // tiền giữ lại
    ["demo", false], // chỉ in log, không mua thật
    ["help", false],
  ]) as {demo: boolean; help: boolean};
  const strategy = (flags["strategy"] as string).toLowerCase() as StrategyName;
  const maxPerStock = Number(flags["max"]);
  const reserve = Number(flags["reserve"]);
  const demo: boolean = flags["demo"];
  const help: boolean = flags["help"];

  if (help) {
    return helpStockMarket(ns);
  }

  const info = Stock_Utils.isRunningOnCurrentMachine(ns, ns.getScriptName(), ns.getHostname());
  if (info && info.onlineRunningTime > 5) {
    ns.kill(info.pid);
    ns.ui.closeTail(info.pid);
  }

  // mở UI danh mục
  const pid = await Stock_Utils.runPortfolio(ns, scriptPortfolio);
  if (pid !== 0) ns.ui.openTail(pid);

  const symbols: string[] = ns.stock.getSymbols();

  while (true) {
    applyStrategy(ns, symbols, strategy, reserve, maxPerStock, demo);
    await ns.sleep(500); // nhịp vừa phải
  }
}

function helpStockMarket(ns: NS): void {
  ns.tprint(`INFO Cách dùng lệnh`);
  ns.tprint(`run stock-main.ts --strategy safe|wave|diverse --max 1e9 --reserve 0 --demo`);
  ns.tprint(`--strategy: chọn chiến thuật`);
  ns.tprint(`--max: hạn mức tối đa cho mỗi mã`);
  ns.tprint(`--reserve: số tiền còn giữ lại không dùng`);
  ns.tprint(`--demo: nếu đặt true thì chỉ log, không giao dịch thật`);
}
