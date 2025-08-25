export async function main(ns: NS) {
  ns.disableLog("ALL");
  const target = ns.args[0] as string;
  const delay = (ns.args[1] as number) ?? 0;
  await ns.sleep(delay);
  const hack_Money = ns.formatNumber(await ns.hack(target));
  ns.print(`SUCCESS ${target} Nhận: $${hack_Money}`);
}
