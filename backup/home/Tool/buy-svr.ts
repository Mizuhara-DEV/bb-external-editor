/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  const flags = ns.flags([
    ["help", false],
    ["all", null],
    ["one", null],
    ["uprgade", null],
    ["name", ""],
    ["y", false],
  ]);

  const namesvr: string = (flags["name"] as string) || "pserv";
  const hostname_svr = `${namesvr}-`;

  const ok: boolean = flags.y as boolean;
  const all: number = flags.all as number;
  const one: number = flags.one as number;
  const uprgade: number = flags["uprgade"] as number;

  const svrs = ns.getPurchasedServers();
  const maxSVR = ns.getPurchasedServerLimit();
  const minSVR = maxSVR - svrs.length;

  if (all) {
    const listName = autoName(hostname_svr, ns.formatRam(all), maxSVR, svrs);
    const count = Math.min(minSVR, listName.length);

    if (count === 0 && svrs.length === 25) {
      const listName = autoName(hostname_svr, ns.formatRam(all), maxSVR, svrs);

      if (!ok) {
        ns.tprint(`INFO: Sẽ mua ${svrs.length} server, RAM: ${ns.formatRam(all)}GB, giá: $${ns.formatNumber(ns.getPurchasedServerCost(all) * svrs.length)}`);
        ns.tprint(`INFO: thêm tham số -y để xác nhận mua.`);
        return;
      }

      uprgadeServer(ns, svrs, all, listName);
      return;
    }

    if (count === 0) return ns.tprint(`WARN: Không còn slot để mua server mới.`);
    if (!ok && count > 0) {
      ns.tprint(`INFO: Sẽ mua ${count} server, RAM: ${ns.formatRam(all)}GB, giá: $${ns.formatNumber(ns.getPurchasedServerCost(all) * count)}`);
      ns.tprint(`INFO: thêm tham số -y để xác nhận mua.`);
      return;
    }

    for (let i = 0; i < count; i++) {
      const hostname = listName[i];
      buyPserv(ns, hostname, all);
    }

    return;
  }

  if (one && ok) {
    const listName = autoName(hostname_svr, ns.formatRam(one), maxSVR, svrs);
    if (listName.length > 0) {
      const hostname = listName[0];
      buyPserv(ns, hostname, one);
    } else {
      ns.tprint(`WARN: Không còn slot để mua server mới.`);
    }
    return;
  }

  if (uprgade) {
    const listName = autoName(hostname_svr, ns.formatRam(uprgade), maxSVR, svrs);

    if (svrs.length === 0) return ns.tprint(`WARN: Không có servers để uprgade.`);
    if (!ok) {
      ns.tprint(`INFO: Sẽ mua ${svrs.length} server, RAM: ${ns.formatRam(uprgade)}GB, giá: $${ns.formatNumber(ns.getPurchasedServerCost(uprgade) * svrs.length)}`);
      ns.tprint(`INFO: thêm tham số -y để xác nhận mua.`);
      return;
    }
    uprgadeServer(ns, svrs, uprgade, listName);
    return;
  }

  const price = ns.getPurchasedServerCost(all || one || uprgade || 2);
  ns.tprint(`INFO: Giá cho 1 pserv với ${ns.formatRam(all || one || uprgade || 2)}GB RAM = $${ns.formatNumber(price)}`);
  ns.tprint(`INFO: Buy all: run ${ns.getScriptName()} --all <RAM> --name <prefix> -y`);
  ns.tprint(`INFO: Buy one: run ${ns.getScriptName()} --one <RAM> --name <prefix> -y`);
  ns.tprint(`INFO: Pserv maximum Ram: ${ns.getPurchasedServerMaxRam()}`);
}

/** Nân cấp server */
function uprgadeServer(ns: NS, svrs: string[], uprgade: number, listName: string[]): boolean {
  let i = 0;
  for (const hostname of svrs) {
    if (ns.getServerMaxRam(hostname) >= uprgade) {
      ns.tprint(`WARN: Server ${hostname} đã có RAM >= ${uprgade}GB`);
      continue;
    }
    if (ns.getPurchasedServerCost(uprgade) > ns.getServerMoneyAvailable("home")) {
      ns.tprint(`WARN: Không đủ tiền để nâng cấp server ${hostname} lên ${uprgade}GB`);
      continue;
    }
    const newName = listName[i];
    ns.killall(hostname);
    if (ns.deleteServer(hostname)) {
      ns.tprint(`INFO: Đã xóa server cũ: ${hostname}`);
      buyPserv(ns, newName, uprgade);
      i++;
    } else {
      ns.tprint(`ERROR: Không thể xóa server ${hostname} để nâng cấp.`);
      return false;
    }
  }
  return true;
}

/** Mua server */
function buyPserv(ns: NS, hostname: string, ram: number) {
  const price = ns.getPurchasedServerCost(ram);
  const name = ns.purchaseServer(hostname, ram);
  if (name) {
    ns.tprint(`INFO: Đã mua server: ${name}, RAM: ${ram}GB, giá: $${ns.formatNumber(price)}`);
  } else {
    ns.tprint(`ERROR: Không thể mua server ${hostname} với RAM ${ram}GB`);
  }
}

/** Sinh tên tự động */
function autoName(hostname_svr: string, ram: string, limit: number, pserv: string[]): string[] {
  const listName: string[] = [];
  for (let i = 1; i <= limit; i++) {
    const hostname = `${hostname_svr}${ram}-${i}`;
    if (!pserv.includes(hostname)) {
      listName.push(hostname);
    }
  }
  return listName;
}
