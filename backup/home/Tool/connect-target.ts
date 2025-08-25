/** @param {NS} ns **/
export async function main(ns: NS) {
  const flags = ns.flags([
    ["path-only", false],
    ["p", false],
  ]);
  const targets = ns.args as string[];
  const pathOnly = Boolean(flags["path-only"] || flags["p"]);

  if (!targets) {
    ns.tprint("WARN Cách dùng: run connect.js <server> [--path-only]");
    return;
  }

  for (const target of targets) {
    if (!target) return;

    const path = findPath(ns, "home", target);
    if (!path) {
      ns.tprint(`INFO Không tìm thấy đường đến server ${target}`);
      return;
    }

    if (pathOnly) {
      ns.tprint(buildTerminalChain(path));
      continue;
    }

    // Thử dùng Singularity (cần BN4/SF4)
    try {
      // về home trước rồi connect theo path
      ns.singularity.connect("home");
      for (const host of path.slice(1)) {
        const ok = ns.singularity.connect(host);
        if (!ok) throw new Error(`ERROR connect-failed:${host}`);
      }
      ns.tprint(`SUCCESS ✅ Đã connect đến ${target}`);
    } catch {
      ns.tprint("WARN ⚠️ Không có quyền Singularity. Dán chuỗi này vào Terminal:");
      ns.tprint(buildTerminalChain(path));
    }
  }
}

/**
 * Tìm đường từ start -> target
 */
function findPath(ns: NS, start: string, target: string): string[] | null {
  const visited = new Set<string>();
  const queue: string[][] = [[start]];

  while (queue.length > 0) {
    const path = queue.shift()!;
    const node = path[path.length - 1];

    if (node === target) return path;

    for (const neighbor of ns.scan(node)) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  return null;
}

function buildTerminalChain(path: string[]): string {
  // Terminal cho phép chain lệnh bằng ';'
  return (
    "home; " +
    path
      .slice(1)
      .map((h) => `connect ${h}`)
      .join("; ")
  );
}
