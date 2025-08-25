const PROGRAMS = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];
var rootOnly: boolean;
/** Entry */
export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");
  const flags = ns.flags([
    ["help", false],
    ["root-only", false],
  ]);
  if (flags.help) return ns.tprint(`Usage: run ${ns.getScriptName()} [--root-only]`);
  rootOnly = flags["root-only"] as boolean;

  const crackedPrograms = countAvailablePrograms(ns);
  const minHackSkill = ns.getHackingLevel();

  const skipSet = new Set<string>(["home", ...ns.getPurchasedServers()]);
  const visited = new Set<string>();
  const queue: string[] = ["home"];
  const servers: string[] = [];

  while (queue.length > 0) {
    const hostname = queue.shift()!;
    if (visited.has(hostname)) continue;
    visited.add(hostname);

    const req = ns.getServerRequiredHackingLevel(hostname);
    if (req > minHackSkill) {
      skipSet.add(hostname);
    }

    if (!skipSet.has(hostname)) {
      await handleServer(ns, hostname, crackedPrograms);
    }

    for (const nb of ns.scan(hostname)) {
      if (!visited.has(nb)) {
        queue.push(nb);
        servers.push(nb);
      }
    }
  }

  ns.tprint(`SUCCESS Đã scan ${servers.length} server, skip ${skipSet.size} server.`);
}

/** Đếm số chương trình phá cổng đang có */
function countAvailablePrograms(ns: NS): number {
  let cracked = 0;
  for (const p of PROGRAMS) if (ns.fileExists(p, "home")) cracked++;
  return cracked;
}

/** Thử root server */
function tryRoot(ns: NS, hostname: string, crackedPrograms: number): void {
  if (ns.hasRootAccess(hostname) && ns.getServer(hostname).openPortCount >= crackedPrograms) return;

  try {
    if (ns.fileExists("BruteSSH.exe", "home")) ns.brutessh(hostname);
    if (ns.fileExists("FTPCrack.exe", "home")) ns.ftpcrack(hostname);
    if (ns.fileExists("relaySMTP.exe", "home")) ns.relaysmtp(hostname);
    if (ns.fileExists("HTTPWorm.exe", "home")) ns.httpworm(hostname);
    if (ns.fileExists("SQLInject.exe", "home")) ns.sqlinject(hostname);

    if (ns.getServerNumPortsRequired(hostname) <= crackedPrograms) {
      const rootok: boolean = ns.nuke(hostname);

      if (rootok) ns.tprint(`SUCCESS Đã chiếm quyền root: ${hostname}`);
      if (!rootok) ns.tprint(`WARN Chiếm quyền root thất bại: ${hostname}`);
    } else {
      ns.tprint(`WARN Thiếu chương trình phá cổng để nuke: ${hostname}`);
    }
  } catch (e) {
    ns.tprint(`ERROR Lỗi root ${hostname}: ${e}`);
  }
}

/** Xử lý logic chính của 1 server */
async function handleServer(ns: NS, hostname: string, crackedPrograms: number): Promise<void> {
  tryRoot(ns, hostname, crackedPrograms);
  if (ns.hasRootAccess(hostname)) {
    ns.ui.openTail();

    if (ns.getServer(hostname).backdoorInstalled) ns.print(`SUCCESS Door: ${hostname}`);
    else ns.print(`WARN Door: ${hostname}`);
  }

  ns.formulas.gang;

  if (!ns.hasRootAccess(hostname)) return;
}
