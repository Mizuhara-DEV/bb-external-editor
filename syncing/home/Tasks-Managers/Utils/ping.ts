import portsUtils from "../../Utils/port-utils";

export async function main(ns: NS) {
  ns.disableLog("ALL");

  const myPorts = new portsUtils();
  const owner = ns.args[0] as string; // script cha
  const port = ns.args[1] as number; // port được cấp phát
  const key = ns.args[2] as string; // key của port
  const pid = ns.args[3] as number;

  const ownerName =
    {
      [owner["Hack-Manager/hack-manager.ts"]]: "Automatic-Hack",
    }[owner] || owner;

  ns.ui.setTailTitle(`📦Pig: P:${port} K:${key}`);

  if (!owner || !port || !key) {
    ns.tprint("ERROR: ❌ ping.ts thiếu args. Cần: owner, port, task(optional)");
    return;
  }

  ns.tprint(`INFO: 📡 Ping agent started for ${ownerName} on port ${port}`);

  while (true) {
    // Nếu script cha không còn chạy -> tự sát
    if (!ns.isRunning(pid, "home")) {
      ns.tprint(`WARNING ⚠️ Owner ${ownerName} stopped. Releasing port ${port}.`);
      myPorts.releasePort(ns, port, key, owner);
      return; // thoát script ping
    }

    // gửi heartbeat
    myPorts.ping(ns, port, key, ownerName, {task: "idle"});

    await ns.sleep(5000);
  }
}
