import Deployer from "./hack-deployer";
import HackUtils from "./Utils/Hack-Utils";

function hasFormulas(ns: NS): boolean {
  ns.fileExists("Formulas.exe", "home");
  return false;
}

// Times
function getTimes(ns: NS, target: string) {
  const server = ns.getServer(target);
  const player = ns.getPlayer();

  if (hasFormulas(ns)) {
    return {
      hack: ns.formulas.hacking.hackTime(server, player),
      grow: ns.formulas.hacking.growTime(server, player),
      weaken: ns.formulas.hacking.weakenTime(server, player),
    };
  } else {
    return {
      hack: ns.getHackTime(target),
      grow: ns.getGrowTime(target),
      weaken: ns.getWeakenTime(target),
    };
  }
}

// Threads
function getThreads(ns: NS, target: string, rateMoney: number, growMult: number = 1.05) {
  const server = ns.getServer(target);
  const player = ns.getPlayer();

  if (hasFormulas(ns)) {
    const hackPercent = ns.formulas.hacking.hackPercent(server, player);
    // ép hackThreads >= 1 nếu rateMoney > 0
    let hackThreads = Math.floor((server.moneyAvailable * rateMoney) / (server.moneyMax * hackPercent));
    if (hackThreads < 1 && rateMoney > 0) hackThreads = 1;

    // tránh growMult quá nhỏ
    const safeMult = Math.max(1.0001, growMult);
    let growThreads = Math.ceil(ns.formulas.hacking.growThreads(server, player, safeMult));
    if (growThreads < 1 && safeMult > 1) growThreads = 1;

    return {hackThreads, growThreads};
  } else {
    const money = ns.getServerMoneyAvailable(target);
    let hackThreads = Math.floor(ns.hackAnalyzeThreads(target, money * rateMoney));
    if (hackThreads < 1 && rateMoney > 0) hackThreads = 1;

    const growThreads = Math.max(1, Math.ceil(ns.growthAnalyze(target, growMult)));
    return {hackThreads, growThreads};
  }
}

// Weaken threads
function getWeakenThreads(ns: NS, hackThreads: number, growThreads: number) {
  // mỗi hack thread tăng 0.002 sec, mỗi grow thread tăng 0.004 sec
  return Math.ceil((hackThreads * 0.002 + growThreads * 0.004) / ns.weakenAnalyze(1));
}

// NormalizeTarget
export async function normalizeTarget(ns: NS, target: string, scripts: any, ram: any, hosts: string[], portData: number): Promise<boolean> {
  const server = ns.getServer(target);

  const secThreshold = server.minDifficulty + 2;
  const moneyThreshold = server.moneyMax * 0.9;
  const sec = server.hackDifficulty;
  const money = server.moneyAvailable;

  // Weaken nếu sec quá cao
  if (sec > secThreshold) {
    const weakenNeeded = Math.ceil((sec - secThreshold) / ns.weakenAnalyze(1));
    if (weakenNeeded > 0) {
      Deployer.runOnHosts(ns, scripts.weaken, weakenNeeded, ram.weaken, [target, 0], hosts);
      HackUtils.updateLog(ns, portData, target, {weakenThreads: weakenNeeded}, true);
      return true;
    }
  }

  // Grow nếu money chưa đủ
  if (money < moneyThreshold) {
    const multiplier = Math.max(1.0001, moneyThreshold / Math.max(money, 1));
    let growNeeded = hasFormulas(ns) ? Math.ceil(ns.formulas.hacking.growThreads(server, ns.getPlayer(), multiplier)) : Math.ceil(ns.growthAnalyze(target, multiplier));

    if (growNeeded < 1) growNeeded = 1;

    Deployer.runOnHosts(ns, scripts.grow, growNeeded, ram.grow, [target, 0], hosts);
    HackUtils.updateLog(ns, portData, target, {growThreads: growNeeded}, true);
    return true;
  }

  return false;
}

// Batch
export function planBatch(ns: NS, target: string, baseDelay: number, rateMoney: number) {
  const times = getTimes(ns, target);
  const {hackThreads, growThreads} = getThreads(ns, target, rateMoney, 1.05);
  const weakenThreads = getWeakenThreads(ns, hackThreads, growThreads);

  const hackDelay = times.weaken - times.hack - baseDelay * 2;
  const growDelay = times.weaken - times.grow - baseDelay;
  const weaken1Delay = 0;
  const weaken2Delay = baseDelay * 3;

  return {
    hackThreads,
    growThreads,
    weakenThreads,
    hackDelay,
    growDelay,
    weaken1Delay,
    weaken2Delay,
    weakenTime: times.weaken,
  };
}
