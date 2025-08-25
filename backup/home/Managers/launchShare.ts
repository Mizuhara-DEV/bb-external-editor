/** @param {NS} ns */
export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.ui.openTail();
  const args = ns.flags([["max", 5]]);
  const maxPserv = args.max as number;
  const script = "Managers/share.ts"; // file share sau khi biên dịch từ share.ts
  const ramPerThread = ns.getScriptRam(script);

  if (ramPerThread === 0) {
    ns.tprint(`ERROR: Script ${script} not found or has 0 RAM cost`);
    return;
  }

  const allServers = scanAllServers(ns).filter((s) => ns.hasRootAccess(s) && ns.getServerMaxRam(s) > 0);
  const pservs = allServers.filter((s) => s.startsWith("pserv"));
  const clients = allServers.filter((s) => !s.startsWith("pserv") && s !== "home");

  // --- Xử lý các share đang chạy ---
  for (const server of [...pservs, ...clients]) {
    const pid = ns.getRunningScript(script, server);
    if (pid) {
      ns.kill(pid.pid);
    }
  }

  // --- Xử lý pserv ---
  const idlePservs = pservs.filter((s) => ns.getServerUsedRam(s) === 0);
  idlePservs.sort((a, b) => ns.getServerMaxRam(b) - ns.getServerMaxRam(a));
  const targetPservs = idlePservs.slice(0, maxPserv);

  for (const server of targetPservs) {
    const freeRam = ns.getServerMaxRam(server);
    const threads = Math.floor(freeRam / ramPerThread);
    const pid = ns.getRunningScript(script, server);
    if (threads > 0) {
      ns.print(`INFO: Launching ${threads} threads on pserv ${server}`);
      if (ns.scp(script, server, "home")) {
        if (pid) ns.kill(pid.pid);
        ns.exec(script, server, threads);
      } else {
        ns.print(`WARN: scp Đến Pserv: ${server} Fail. Thử Pserv khác`);
        continue;
      }
    }
  }

  // --- Xử lý client ---
  for (const server of clients) {
    const freeRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
    const threads = Math.floor(freeRam / ramPerThread);
    const pid = ns.getRunningScript(script, server);
    if (threads > 0) {
      ns.print(`INFO: Launching ${threads} threads on client ${server}`);
      if (await ns.scp(script, server, "home")) {
        if (pid) ns.kill(pid.pid);
        ns.exec(script, server, threads);
      } else {
        ns.print(`WARN: scp Đến client: ${server} Fail. Thử client khác`);
        continue;
      }
    }
  }
}

/** Quét toàn bộ server */
function scanAllServers(ns: NS): string[] {
  const visited = new Set<string>();
  const queue: string[] = ["home"];
  while (queue.length > 0) {
    const host = queue.pop()!;
    if (visited.has(host)) continue;
    visited.add(host);
    for (const next of ns.scan(host)) {
      if (!visited.has(next)) queue.push(next);
    }
  }
  return Array.from(visited);
}
