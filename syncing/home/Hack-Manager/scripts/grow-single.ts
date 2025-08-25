export async function main(ns: NS) {
  ns.disableLog("ALL");
  const target = ns.args[0] as string;
  const delay = (ns.args[1] as number) ?? 0;

  if (!target) return ns.tprint("❌ Thiếu tham số target (server name).");
  const currentMoney = ns.getServerMoneyAvailable(target);

  await ns.sleep(delay);
  const grow_value = await ns.grow(target);
  const money = ns.formatNumber(currentMoney * grow_value);
  ns.print(`SUCCESS ${target} Money: ${money} (+${grow_value}%)`);
}
