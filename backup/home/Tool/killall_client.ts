export async function main(ns: NS) {
  ns.disableLog("ALL");

  const flags = ns.flags([
    ["help", false], // Hiển thị thông tin trợ giúp
    ["all-svrs", false], // Kill trên tất cả server
    ["scripts-only", []], // Mảng các tên script
  ]);
  if (flags.help) {
    showHelp(ns);
    return;
  }
  const allSvrs: boolean = (flags["all-svrs"] as boolean) ?? false;
  const onlyScripts: string[] = (flags["scripts-only"] as string[]) ?? [];

  const svrsPlayer = ns.getPurchasedServers();
  const queue: string[] = ["home"];
  const visited = new Set();

  while (queue.length > 0) {
    // Lấy máy chủ tiếp theo từ hàng đợi
    const hostname = queue.shift();
    if (hostname == undefined) return;
    if (visited.has(hostname)) {
      // Nếu đã thăm máy chủ này, bỏ qua
      continue;
    }
    visited.add(hostname);

    // Thực hiện hành động trên máy chủ hiện tại
    if ((!allSvrs ? hostname !== "home" : allSvrs) && (!allSvrs ? !svrsPlayer.includes(hostname) : allSvrs)) {
      if (onlyScripts.length > 0) {
        killScriptsOnServer(ns, hostname, onlyScripts);
      } else {
        ns.killall(hostname);
      }
    }

    // Thêm các máy lân cận vào hàng đợi
    let neighbors = ns.scan(hostname);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }
}

// Hàm tắc các script được chỉ định trên máy chủ
function killScriptsOnServer(ns: NS, hostname: string, scripts: string[]) {
  for (const script of scripts) {
    const isOk = ns.scriptKill(script, hostname);
    if (isOk) {
      ns.print(`Đã tắt script ${script} trên máy chủ ${hostname}`);
    }
  }
}

// Hàm hiển thị thông tin trợ giúp
function showHelp(ns: NS) {
  ns.tprint("Usage: run killall_client.ts [options]");
  ns.tprint("Options:");
  ns.tprint("  --help              Hiển thị thông tin trợ giúp");
  ns.tprint("  --all-svrs          Kill trên tất cả server");
  ns.tprint("  --only-scripts      Mảng các tên script");
}
