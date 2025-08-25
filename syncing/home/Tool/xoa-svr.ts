/** @param {NS} ns */
export async function main(ns: NS) {
  const flags = ns.flags([
    ["all", false],
    ["one", ""],
  ]);

  const all: boolean = flags["all"] as boolean;
  const one: string = flags["one"] as string;

  if (all) {
    const svrs = ns.getPurchasedServers();
    for (const svr of svrs) {
      tryDelete(svr);
    }
    return;
  }

  if (one) {
    tryDelete(one);
    return;
  }

  ns.tprint(`Cách dùng:`);
  ns.tprint(`  run ${ns.getScriptName()} --all       (xoá tất cả server mua)`);
  ns.tprint(`  run ${ns.getScriptName()} --one <svr> (xoá một server)`);

  function tryDelete(svr: string) {
    ns.killall(svr);
    if (ns.deleteServer(svr)) {
      ns.tprint(`SUCCESS ✅ Đã xoá server ${svr}`);
    } else {
      ns.tprint(`ERROR ❌ Không thể xoá server ${svr} (có thể còn process chạy)`);
    }
  }
}
