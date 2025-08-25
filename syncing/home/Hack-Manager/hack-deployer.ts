const scripts = {
  hack: "Hack-Manager/scripts/hack-single.ts",
  grow: "Hack-Manager/scripts/grow-single.ts",
  weaken: "Hack-Manager/scripts/weaken-single.ts",
};

export default class Deployer {
  static runOnHosts(ns: NS, script: string, threads: number, ramPerThread: number, args: (string | number)[], hosts: string[]): Object {
    const scriptName =
      {
        [scripts.hack]: "Hack",
        [scripts.grow]: "Grow",
        [scripts.weaken]: "Weaken",
      }[script] || script;

    let runOk: number = 0,
      runFail: number = 0,
      scpFail: number = 0;
    const hostRun: Record<string, {host: string; scriptName: string; useThreads: number}> = {};

    for (const host of hosts) {
      const freeRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
      const maxThreads = Math.floor(freeRam / ramPerThread);
      if (maxThreads < 1) continue;

      const useThreads = Math.min(threads, maxThreads);

      if (!ns.scp(script, host, "home")) {
        scpFail++;
        continue;
      }

      if (ns.exec(script, host, useThreads, ...args)) {
        runOk++;
      } else {
        runFail++;
        continue;
      }

      threads -= useThreads;
      hostRun[host] = {host, scriptName, useThreads};
      if (threads <= 0) break;
    }
    return {runOk, runFail, scpFail, hostRun};
  }
}
