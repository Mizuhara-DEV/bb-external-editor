import portsUtils from "../../Utils/port-utils";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.ui.openTail();
  const myPorts = new portsUtils();
  const owner = ns.args[0] as string; // script cha
  const port = ns.args[1] as number; // port được cấp phát
  const key = ns.args[2] as string; // key của port
  const args = ns.args[3] as string; // optional: khac

  if (!owner || !port || !key) {
    ns.tprint("ERROR: ❌ ping.ts thiếu args. Cần: owner, port, task(optional)");
    return;
  }

  ns.print(`INFO: 📡 Ping agent started for ${owner} on port ${port}`);

  while (true) {
    // Nếu script cha không còn chạy -> tự sát
    if (!ns.isRunning(owner, "home", ...args)) {
      ns.tprint(`WARNING ⚠️ Owner ${owner} stopped. Releasing port ${port}.`);
      myPorts.releasePort(ns, port, key, owner);
      return; // thoát script ping
    }

    // gửi heartbeat
    myPorts.ping(ns, port, key, owner, {task: "idle"});

    await ns.sleep(5000);
  }
}
