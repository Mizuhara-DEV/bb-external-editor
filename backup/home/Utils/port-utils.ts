// Utils/Port-Utils.ts
export default class PortsUtils {
  CONTROL_PORT: number;
  MONITOR_PORT: number;
  PINGNAME: string;

  constructor() {
    this.CONTROL_PORT = 1;
    this.MONITOR_PORT = 2;
    this.PINGNAME = "tasks/utils/ping.ts";
  }

  // Xin 1 port mới
  async requestPort(ns: NS, owner: string) {
    const control = ns.getPortHandle(this.CONTROL_PORT);
    control.write(JSON.stringify({type: "request", owner}));
    await ns.sleep(50); // đợi registry xử lý
    const res = control.read();
    if (!res) return {port: -1, key: ""};
    return JSON.parse(res as string);
  }

  // Trả lại port khi script chết
  releasePort(ns: NS, port: number, key: string, owner: string) {
    const control = ns.getPortHandle(this.CONTROL_PORT);
    control.write(JSON.stringify({type: "release", port, key, owner}));
  }

  // Gửi ping + meta (metadata: task, target, info,...)
  ping(ns: NS, port: number, key: string, owner: string, meta: any = {}) {
    const control = ns.getPortHandle(this.CONTROL_PORT);
    control.write(JSON.stringify({type: "ping", port, key, owner, meta}));
  }
}

export const portsUtils = new PortsUtils();
