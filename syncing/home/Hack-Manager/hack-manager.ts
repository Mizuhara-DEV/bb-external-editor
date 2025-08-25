import HackUtils from "./utils/Hack-Utils";
import Deployer from "./hack-deployer";
import {getHackableServers} from "./hack-scanner";
import {planBatch, normalizeTarget} from "./hack-batcher";
import portsUtils from "../Utils/port-utils";

const myPorts = new portsUtils();
const baseDelay = 200;
const scripts = {
  hack: "Hack-Manager/scripts/hack-single.ts",
  grow: "Hack-Manager/scripts/grow-single.ts",
  weaken: "Hack-Manager/scripts/weaken-single.ts",
};

const cooldownMap: Record<string, number> = {};

export async function main(ns: NS) {
  ns.disableLog("ALL");
  const scriptName = ns.getScriptName();

  const flags = ns.flags([
    ["help", false],
    ["Rate", 0.05],
    ["only", ""],
  ]);
  if (flags.help) {
    ns.tprint("Usage: run manager.ts [--Rate 0.05] [--only target]");
    ns.tprint("--rate: Tỉ lệ tiền tối đa được hack trên mỗi server (mặc định 0.05 = 5%)");
    ns.tprint("--only: Chỉ hack server được chỉ định, bỏ qua các server khác");
    return;
  }

  // 1) Xin port
  const {port, key} = await myPorts.requestPort(ns, scriptName);
  ns.tprint(`INFFO: 📦 Script ${scriptName} được cấp port ${port} KEY=[${key}]`);
  if (port !== -1 && key !== "") {
    // 2) Gọi ping auto (chạy script riêng ping.ts để gửi ping liên tục)
    ns.exec(myPorts.PINGNAME, "home", 1, scriptName, port, key, ...ns.args);
    myPorts.ping(ns, port, key, scriptName, Date.now());
  } else return ns.tprint("ERROR: ❌ Không còn port trống!");

  const maxHackMoney: number = (flags.Rate as number) ?? 0.05;

  ns.ui.setTailTitle(` 🖥️ Hack-Manager - Rate: ${ns.formatPercent(maxHackMoney)} `);
  ns.ui.openTail();
  HackUtils.runMonitor(ns, scriptName, port, ns.args);

  try {
    // 3) Code chính
    while (true) {
      const targets = getHackableServers(ns);
      if (targets.length === 0) {
        ns.tprint("ERROR: ❌ Không có server hackable.");
        await ns.sleep(5000);
        continue;
      }

      if (!flags.only) await processTargets(ns, targets, maxHackMoney, baseDelay, port);

      if (flags.only) {
        const onlyTarget = flags.only as string;
        if (!targets.includes(onlyTarget)) {
          ns.tprint(`ERROR: ❌ Target --only ${onlyTarget} không hackable.`);
          await ns.sleep(5000);
          continue;
        }
        await processSingleTarget(ns, onlyTarget, maxHackMoney, baseDelay, port);
      }

      await ns.sleep(500);
    }
  } finally {
    // 4) Thu hồi Port khi thoát
    myPorts.releasePort(ns, port, key, scriptName);
  }
}

// Xử lý nhiều server
async function processTargets(ns: NS, targets: string[], maxHackMoney: number, baseDelay: number, port: number) {
  for (const target of targets) {
    if (cooldownMap[target] && Date.now() < cooldownMap[target]) continue;

    const ram = {
      hack: ns.getScriptRam(scripts.hack),
      grow: ns.getScriptRam(scripts.grow),
      weaken: ns.getScriptRam(scripts.weaken),
    };

    let hosts = ns.getPurchasedServers();
    if (hosts.length === 0) hosts = ["home"];

    // 1. CHUẨN HÓA
    const normalized = await normalizeTarget(ns, target, scripts, ram, hosts, port);
    if (normalized) {
      cooldownMap[target] = Date.now() + Math.max(ns.getWeakenTime(target), ns.getGrowTime(target)) + 200;
      continue;
    }

    // 2. BATCH LOGIC
    const batch = planBatch(ns, target, baseDelay, maxHackMoney);

    Deployer.runOnHosts(ns, scripts.hack, batch.hackThreads, ram.hack, [target, batch.hackDelay], hosts);
    Deployer.runOnHosts(ns, scripts.grow, batch.growThreads, ram.grow, [target, batch.growDelay], hosts);
    Deployer.runOnHosts(ns, scripts.weaken, batch.weakenThreads, ram.weaken, [target, batch.weaken1Delay], hosts);
    Deployer.runOnHosts(ns, scripts.weaken, batch.weakenThreads, ram.weaken, [target, batch.weaken2Delay], hosts);

    HackUtils.updateLog(ns, port, target, batch);
    ns.print(`INFO: 🚀 Batch ${target} (H:${batch.hackThreads}, G:${batch.growThreads}, W:${batch.weakenThreads * 2})`);
    cooldownMap[target] = Date.now() + batch.weakenTime + baseDelay * 5;
  }
}

// Xử lý 1 target
async function processSingleTarget(ns: NS, target: string, maxHackMoney: number, baseDelay: number, port: number) {
  if (cooldownMap[target] && Date.now() < cooldownMap[target]) return;

  const ram = {
    hack: ns.getScriptRam(scripts.hack),
    grow: ns.getScriptRam(scripts.grow),
    weaken: ns.getScriptRam(scripts.weaken),
  };

  let hosts = ns.getPurchasedServers();
  if (hosts.length === 0) hosts = ["home"];

  // 1. CHUẨN HÓA
  const normalized = await normalizeTarget(ns, target, scripts, ram, hosts, port);
  if (normalized) {
    cooldownMap[target] = Date.now() + Math.max(ns.getWeakenTime(target), ns.getGrowTime(target)) + 200;
    return;
  }

  // 2. BATCH LOGIC
  const batch = planBatch(ns, target, baseDelay, maxHackMoney);

  Deployer.runOnHosts(ns, scripts.hack, batch.hackThreads, ram.hack, [target, batch.hackDelay], hosts);
  Deployer.runOnHosts(ns, scripts.grow, batch.growThreads, ram.grow, [target, batch.growDelay], hosts);
  Deployer.runOnHosts(ns, scripts.weaken, batch.weakenThreads, ram.weaken, [target, batch.weaken1Delay], hosts);
  Deployer.runOnHosts(ns, scripts.weaken, batch.weakenThreads, ram.weaken, [target, batch.weaken2Delay], hosts);

  HackUtils.updateLog(ns, port, target, batch);
  ns.print(`INFO: 🚀 Batch ${target} (H:${batch.hackThreads}, G:${batch.growThreads}, W:${batch.weakenThreads * 2}) INFO`);
  cooldownMap[target] = Date.now() + batch.weakenTime + baseDelay * 5;
}
