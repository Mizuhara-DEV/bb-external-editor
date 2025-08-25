// servers/home/Managers/hack.js
async function main(ns) {
  ns.clearLog();
  let target = ns.args[0];
  if (!target) {
    target = ns.getHostname();
    ns.print(`getHostname: ${target}`);
  }
  ns.print(target);
  ns.disableLog("ALL");
  while (true) {
    const minSecurity = ns.getServerMinSecurityLevel(target);
    const currentSecurity = ns.getServerSecurityLevel(target);
    const maxMoney = ns.getServerMaxMoney(target);
    const currentMoney = ns.getServerMoneyAvailable(target);
    if (currentSecurity > minSecurity + 5) {
      await weaken(target, currentSecurity, minSecurity);
    } else if (currentMoney < maxMoney * 0.75) {
      await grow(target, currentMoney, maxMoney);
    } else {
      await hack(target, currentMoney, currentSecurity);
    }
  }
  async function weaken(target2, currentSecurity, minSecurity) {
    ns.print(`weaken ${target2} \x1B[31mB\u1EA3o m\u1EADt: ${ns.formatNumber(currentSecurity)} > ${ns.formatNumber(minSecurity + 5)}`);
    const weaken_value = await ns.weaken(target2);
    const _weaken = currentSecurity -= weaken_value;
    ns.print(`\x1B[31mSecurity: ${ns.formatNumber(_weaken)}`, ` -${ns.formatNumber(weaken_value)}`);
    return _weaken;
  }
  async function grow(target2, currentMoney, maxMoney) {
    ns.print(`grow ${target2} \x1B[33mMoney: $${ns.formatNumber(currentMoney, 2)} < $${ns.formatNumber(maxMoney * 0.75, 2)}\x1B[0m`);
    const grow_value = await ns.grow(target2);
    const _grow = currentMoney *= grow_value;
    ns.print(`\x1B[33mMoney: ${ns.formatNumber(_grow)}`, ` +${ns.formatNumber(grow_value)}%`);
    return _grow;
  }
  async function hack(target2, currentMoney, currentSecurity) {
    ns.print(`hack ${target2} \x1B[31mMoney: $${ns.formatNumber(currentMoney, 2)}, \x1B[31mB\u1EA3o m\u1EADt: ${ns.formatNumber(currentSecurity, 2)}\x1B[0m`);
    const _hack = await ns.hack(target2);
    ns.print(`\x1B[33mKi\u1EBFm \u0111\u01B0\u1EE3c: `, ns.formatNumber(_hack));
    return _hack;
  }
}
export {
  main
};
