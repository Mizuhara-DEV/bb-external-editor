/** @param {NS} ns */
export async function main(ns: NS) {
  ns.disableLog("ALL");
  const target = ns.args[0] as string;
  const delay = (ns.args[1] as number) ?? 0;
  const currentSecurity = ns.formatNumber(ns.getServerSecurityLevel(target));
  await ns.sleep(delay);
  ns.print(`INFO ${target} Security: ${currentSecurity} -> ${ns.getWeakenTime(target) / 1000}s`);
  const weaken_value = ns.formatNumber(await ns.weaken(target));
  const security = ns.formatNumber(Number(currentSecurity) - Number(weaken_value));
  ns.print(`SUCCESS ${target} Security: ${currentSecurity} -> ${security} (-${weaken_value})`);
}
