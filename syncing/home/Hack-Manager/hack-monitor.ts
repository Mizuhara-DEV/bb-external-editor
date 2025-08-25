import HackUtils from "./utils/Hack-Utils";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.ui.openTail();

  const MAINSCRIPTNAME: string = ns.args[0] as string;
  const port: number = ns.args[1] as number;
  let agrs: any = ns.args[2];
  if (!agrs) agrs = HackUtils.getScripAgrs(ns, MAINSCRIPTNAME, ns.getHostname());

  const EXPIRE = 120_000;
  const handle = ns.getPortHandle(port);

  // cache status theo target
  const status: Record<string, any> = {};

  while (true) {
    const logs: string[] = [];
    const mainScripInfo = ns.getRunningScript(MAINSCRIPTNAME, ns.getHostname(), ...agrs);

    // đọc hết log mới từ port
    while (!handle.empty()) {
      try {
        const data = JSON.parse(handle.read() as string);
        status[data.target] = data; // lưu lại theo server
      } catch (e) {
        ns.print("❌ Lỗi parse port data: " + e);
      }
    }

    const servers: string[] = [];
    let totalHack = 0,
      totalGrow = 0,
      totalWeaken = 0;

    for (const [server, info] of Object.entries(status)) {
      const {hack, grow, weaken, updated} = info as any;
      const age = Date.now() - updated;

      if (age > EXPIRE) continue;

      servers.push(server);
      totalHack += hack;
      totalGrow += grow;
      totalWeaken += weaken;

      logs.push(`\x1b[36m🖥️[${server}] \x1b[37mH:${hack} G:${grow} W:${weaken} | ⌚ ${ns.tFormat(age)}`);
    }

    logs.push(`\x1b[36m📊Tổng cộng: ${servers.length} Servers | H:${totalHack} G:${totalGrow} W:${totalWeaken}`);
    logs.push(`\x1b[33m💰Made: ${ns.formatNumber(mainScripInfo?.onlineMoneyMade ?? 0)} \x1b[36m⏳ ${ns.tFormat((mainScripInfo?.onlineRunningTime ?? 0) * 1000)}`);

    ns.clearLog();
    for (const line of logs) ns.print(line);
    HackUtils.autoResizeTailFromLogs(ns, logs);

    await ns.sleep(1000);
  }
}
