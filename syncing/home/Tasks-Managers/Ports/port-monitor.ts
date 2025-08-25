import portUtils from "../../Utils/port-utils";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.ui.openTail();
  ns.ui.setTailTitle("📊 Port Registry Monitor");

  const myPorts = new portUtils();

  while (true) {
    const handle = ns.getPortHandle(myPorts.MONITOR_PORT);
    if (handle.empty()) {
      ns.clearLog();
      ns.print("📭 Không có script nào đăng ký port.");
      await ns.sleep(1000);
      continue;
    }

    let registry;
    try {
      registry = JSON.parse(handle.peek() as string);
    } catch (e) {
      ns.print("❌ Lỗi parse registry: " + e);
      await ns.sleep(1000);
      continue;
    }

    ns.clearLog();
    ns.print("📊 Port Registry Monitor");
    ns.print("Owner             | Port | Last Ping | Task / Meta");
    ns.print("------------------------------------------------");

    for (const entry of registry) {
      const age = Date.now() - entry.lastPing;
      const task = entry.meta?.task ?? "-";
      const target = entry.meta?.target ?? "-";
      ns.print(`${entry.owner.padEnd(17)} | ${String(entry.port).padStart(4)} | ${age}ms | ${task} @ ${target}`);
    }

    await ns.sleep(1000);
  }
}
