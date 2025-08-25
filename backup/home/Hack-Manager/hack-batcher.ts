import Deployer from "./hack-deployer";
import HackUtils from "./utils/Hack-Utils";

function hasFormulas(ns: NS): boolean {
  return ns.fileExists("Formulas.exe", "home");
}

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

function getThreads(ns: NS, target: string, rateMoney: number, growMult: number = 1.05) {
  const server = ns.getServer(target);
  const player = ns.getPlayer();

  if (hasFormulas(ns)) {
    const hackPercent = ns.formulas.hacking.hackPercent(server, player);
    const hackThreads = Math.max(1, Math.floor((server.moneyAvailable * rateMoney) / (server.moneyMax * hackPercent)));
    const growThreads = Math.ceil(ns.formulas.hacking.growThreads(server, player, growMult));
    return {hackThreads, growThreads};
  } else {
    const money = ns.getServerMoneyAvailable(target);
    const hackThreads = Math.max(1, Math.floor(ns.hackAnalyzeThreads(target, money * rateMoney)));
    const growThreads = Math.ceil(ns.growthAnalyze(target, growMult));
    return {hackThreads, growThreads};
  }
}

function getWeakenThreads(ns: NS, hackThreads: number, growThreads: number) {
  // mỗi hack thread tăng 0.002 sec, mỗi grow thread tăng 0.004 sec
  return Math.ceil((hackThreads * 0.002 + growThreads * 0.004) / ns.weakenAnalyze(1));
}

export async function normalizeTarget(ns: NS, target: string, scripts: any, ram: any, hosts: string[], portData: any): Promise<boolean> {
  const server = ns.getServer(target);

  const secThreshold = server.minDifficulty + 2;
  const moneyThreshold = server.moneyMax * 0.9;
  const sec = server.hackDifficulty;
  const money = server.moneyAvailable;

  if (sec > secThreshold) {
    const weakenNeeded = Math.ceil((sec - secThreshold) / ns.weakenAnalyze(1));
    Deployer.runOnHosts(ns, scripts.weaken, weakenNeeded, ram.weaken, [target, 0], hosts);
    HackUtils.updateLog(ns, portData, target, {weakenThreads: weakenNeeded}, true);
    return true;
  }

  if (money < moneyThreshold) {
    const multiplier = moneyThreshold / Math.max(money, 1);
    const growNeeded = hasFormulas(ns) ? Math.ceil(ns.formulas.hacking.growThreads(server, ns.getPlayer(), multiplier)) : Math.ceil(ns.growthAnalyze(target, multiplier));

    Deployer.runOnHosts(ns, scripts.grow, growNeeded, ram.grow, [target, 0], hosts);
    HackUtils.updateLog(ns, portData, target, {growThreads: growNeeded}, true);
    return true;
  }

  return false;
}

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
