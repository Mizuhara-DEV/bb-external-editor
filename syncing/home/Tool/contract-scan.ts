// Scan các contracts trên server hiện tại
// và in ra tên file, loại contract, độ khó
import {SOLVERS} from "./module-solver";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.ui.openTail();
  const flags = ns.flags([
    ["help", false],
    ["host", null],
    ["y", false],
  ]);
  const hostName: string = (flags.host as string) ?? null;
  const y = flags.y as boolean;
  if (!hostName || flags.help) return helpRun(ns);

  const hosts = hostName === "all" ? scanContracts(ns) : [hostName];
  if (hosts.length === 0) {
    ns.tprint("Không tìm thấy server nào có contract");
    return;
  }

  for (const hostName of hosts) {
    const files = ns.ls(hostName, ".cct");
    if (files.length === 0) {
      ns.tprint(`Không tìm thấy contract nào trên server ${hostName}`);
    }
    ns.tprint(`Tìm thấy ${files.length} contract trên server ${hostName}:`);

    for (const file of files) {
      const type = ns.codingcontract.getContractType(file, hostName);
      const desc = ns.codingcontract.getDescription(file, hostName);
      const data = ns.codingcontract.getData(file, hostName);
      const attempts = ns.codingcontract.getNumTriesRemaining(file, hostName);

      if (SOLVERS.includes(type) && !y) {
        ns.print(`INFO: ${file}: [${type}] | attempts: (${attempts})`);
        ns.print(`INFO: Dữ liệu: [${data}] Loại: [${typeof data}]`);
        //ns.print(`INFO Mô tả: ${desc}`);
        ns.print(`INFO: ${hostName} ${file} | attempts: ${attempts} | type: ${type}`);
        ns.print("\n");
      }
      if (y && SOLVERS.includes(type)) {
        // auto giải nếu có solver
        try {
          ns.exec("Contracts-Auto/contract-main.ts", "home", 1, hostName, file);
        } catch (e) {
          ns.tprint(`💥 Lỗi khi giải ${type}: ${e}`);
        }
      }
    }
  }
}

// hàm scan các server có contract
// và tra về danh sách tên server
function scanContracts(ns: NS, start = "home"): string[] {
  const visited = new Set<string>();
  const queue = [start];
  const result: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    visited.add(node);
    const files = ns.ls(node, ".cct");
    if (files.length > 0) result.push(node);
    for (const neighbor of ns.scan(node)) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return result;
}

// cach dung: run contract-scan.js --host <tên-server>
function helpRun(ns: NS): void {
  ns.tprint("INFO Cách dùng: run contract-scan.js --host <tên-server>");
  ns.tprint("INFO -y auto Giải luôn (nếu có solver)");
  ns.tprint("INFO Ví dụ: run contract-scan.js --host n00dles -y");
}

// Xem thêm code giải contract ở ./Contracts-Auto/contract-manager.ts
