import SOLVERS from "./contract-solver";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  const host = (ns.args[0] as string) ?? "home";
  const file = ns.args[1] as string;

  if (!file) {
    ns.tprint("Usage: run contract-solver.js <host> <contract.cct>");
    return;
  }

  const type = ns.codingcontract.getContractType(file, host);
  const data = ns.codingcontract.getData(file, host);
  const solver = SOLVERS[type];
  if (!solver) {
    ns.tprint(`❌ Chưa có solver cho: ${type}`);
    ns.tprint(`→ Data sample: ${JSON.stringify(data).slice(0, 400)}`);
    return;
  }
  try {
    const ans = solver(data);
    const res = ns.codingcontract.attempt(ans, file, host);
    if (res) ns.tprint(`✅ ${type} | Reward: ${res}`);
    else ns.tprint(`⚠️ Sai đáp án cho ${type}.`);
  } catch (e) {
    ns.tprint(`💥 Lỗi solver ${type}: ${e}`);
  }
}
