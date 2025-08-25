import portUtils from "../../Utils/port-utils";

const myPorts = new portUtils();

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.ui.setTailTitle(`Ports control`);
  ns.ui.openTail();

  const myPorts = new portUtils();

  const control = ns.getPortHandle(myPorts.CONTROL_PORT);
  const monitor = ns.getPortHandle(myPorts.MONITOR_PORT);

  const registry: Record<
    number,
    {
      owner: string;
      key: string;
      lastPing: number;
      meta?: any;
    }
  > = {};

  ns.tprint(`🚦 Port Registry started at port ${myPorts.CONTROL_PORT}`);

  while (true) {
    if (!control.empty()) {
      const msg = JSON.parse(control.read() as string);

      if (msg.type === "request") {
        const {port, key} = allocatePort(ns, registry, msg.owner);
        control.write(JSON.stringify({port, key}));
      }

      if (msg.type === "release") {
        if (registry[msg.port]?.key === msg.key) {
          delete registry[msg.port];
          ns.print(`🔓 Released port ${msg.port} from ${msg.owner}`);
        }
      }

      if (msg.type === "ping") {
        if (registry[msg.port] && registry[msg.port].key === msg.key) {
          registry[msg.port].lastPing = Date.now();
          registry[msg.port].meta = msg.meta || {};
        }
      }
    }

    // Auto clear nếu không ping > 60s
    for (const [port, info] of Object.entries(registry)) {
      if (Date.now() - info.lastPing > 60_000) {
        ns.print(`⏰ Auto release port ${port} (owner ${info.owner})`);
        delete registry[+port];
      }
    }

    // 🔄 Forward registry ra MONITOR_PORT cho port-monitor đọc
    monitor.clear();
    monitor.write(
      JSON.stringify(
        Object.entries(registry).map(([port, data]) => ({
          port: +port,
          ...data,
        }))
      )
    );

    await ns.sleep(500);
  }
}

function allocatePort(ns: NS, registry: Record<number, any>, owner: string) {
  const key = _randomKey();
  for (let i = 3; i <= 20; i++) {
    // range cổng dành cho scripts
    if (!registry[i]) {
      registry[i] = {owner, key, lastPing: Date.now()};
      ns.print(`✅ Allocated port ${i} to ${owner} (key=${key})`);
      return {port: i, key};
    }
  }
  return {port: -1, key: ""}; // hết port
}

function _randomKey(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
