/** Quét toàn bộ server trong mạng */
export function scanAllServers(ns: NS): string[] {
  const seen = new Set<string>();
  const stack = ["home"];

  while (stack.length > 0) {
    const host = stack.pop()!;
    if (seen.has(host)) continue;
    seen.add(host);
    for (const next of ns.scan(host)) {
      if (!seen.has(next)) stack.push(next);
    }
  }
  return [...seen];
}

/** Trả về danh sách server có thể hack */
export function getHackableServers(ns: NS): string[] {
  const allServers: string[] = scanAllServers(ns);
  const activeServers: string[] = allServers.filter((s) => {
    if (s === "home") return false;
    if (!ns.hasRootAccess(s)) return false;
    if (ns.getServerMaxMoney(s) <= 0) return false;
    if (ns.getHackingLevel() < ns.getServerRequiredHackingLevel(s)) return false;
    return true;
  });

  return activeServers;
}
