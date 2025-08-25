/** @public */
type ScriptArg = string | number | boolean;

/** @public */
export interface StockInfo {
  price: number;
  forecast: number;
  volatility: number;
}

/** @public */
export interface ReactElement {
  type: string | ((props: any) => ReactElement | null) | (new (props: any) => object);
  props: any;
  key: string | number | null;
}

/** @public */
export interface TailProperties {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

/** @public */
export interface RunningScript {
  args: ScriptArg[];
  dynamicRamUsage: number | undefined;
  filename: string;
  logs: string[];
  offlineExpGained: number;
  offlineMoneyMade: number;
  offlineRunningTime: number;
  onlineExpGained: number;
  onlineMoneyMade: number;
  onlineRunningTime: number;
  pid: number;
  parent: number;
  ramUsage: number;
  server: string;
  tailProperties: TailProperties | null;
  title: string | ReactElement;
  threads: number;
  temporary: boolean;
}

export class Stock_Utils {
  /**
   * Lấy thông tin cổ phiếu
   * @param ns NS
   * @param sym Mã cổ phiếu
   */
  static getStockInfo(ns: NS, sym: string): StockInfo {
    const price = ns.stock.getPrice(sym);
    const forecast = ns.stock.has4SDataTIXAPI() ? ns.stock.getForecast(sym) : 0.5;
    const volatility = ns.stock.getVolatility(sym);
    return {price, forecast, volatility};
  }

  /**
   * Tính số lượng cổ phiếu tối đa có thể mua
   * @param ns NS
   * @param sym Mã cổ phiếu
   * @param reserve Tiền dự trữ (không dùng để mua)
   * @param maxPerStock Số tiền tối đa cho 1 cổ phiếu
   */
  static calcMaxShares(ns: NS, sym: string, reserve: number, maxPerStock: number): number {
    const money = ns.getServerMoneyAvailable("home") - reserve;
    if (money <= 0) return 0;

    const price = ns.stock.getPrice(sym);
    const budget = Math.min(money, maxPerStock);
    const maxShares = ns.stock.getMaxShares(sym);

    return Math.min(Math.floor(budget / price), maxShares);
  }

  /**
   * Chạy script portfolio riêng (Tail window) để update tổng tài sản
   * @param ns NS
   * @param script Tên file portfolio (ví dụ: "Stock-Market/Portfolio.ts")
   * @returns PID của script chạy
   */
  static async runPortfolio(ns: NS, script: string): Promise<number> {
    // chạy trên home server, log in tail riêng, không ảnh hưởng main trade
    await this.helPerKill(ns, script);
    const pid = ns.exec(script, ns.getHostname());
    if (pid === 0) ns.tprint(`ERROR Không thể chạy portfolio script: ${script}`);
    return pid;
  }

  static async helPerKill(ns: NS, script: string): Promise<boolean> {
    if (script && ns.fileExists(script, ns.getHostname())) {
      const data = ns.getRunningScript(script, ns.getHostname());
      if (data) {
        ns.ui.closeTail(data.pid);
        return ns.kill(data.pid);
      }
      return false;
    } else {
      return false;
    }
  }

  // Hàm check xem có đang chạy trên máy hiên tại không
  static isRunningOnCurrentMachine(ns: NS, scriptName: string, hostname?: string, args?: ScriptArg[]): RunningScript | null {
    if (!hostname) hostname = ns.getHostname();
    if (!scriptName) return null;

    args = this.getScripAgrs(ns, scriptName, hostname);
    if (!args) return ns.getRunningScript(scriptName, hostname);

    return ns.getRunningScript(scriptName, hostname, ...args);
  }

  /** Gọi nhanh: tự tính width/height từ nội dung log hiện có */
  static autoResizeTailFromLogs(ns: NS, logs: string[], bufferLines: number = 2) {
    const styles = ns.ui.getStyles();
    const fontSize = Number(styles.tailFontSize); // px
    const lineHeightPx = fontSize * Number(styles.lineHeight);
    const fontFamily = styles.fontFamily;

    const charWidth = this.measureCharWidthSafe(fontSize, fontFamily);

    // Bỏ mã màu ANSI để lấy độ dài hiển thị thực
    const visibleLines = logs.map(this.stripAnsi);
    const maxCols = visibleLines.reduce((m, l) => Math.max(m, l.length), 0);
    const lines = visibleLines.length;

    // Thêm buffer dòng để bù header/scrollbar (mất ~1–2 dòng nếu không bù)
    const height = this.clamp(Math.round((lines + bufferLines) * lineHeightPx) + 8 /*khung*/, 200, 1400);

    // Cộng thêm 1 chút để tránh wrap do scrollbar/padding
    const width = this.clamp(Math.round(maxCols * charWidth) + 24 /*scrollbar + padding*/, 420, 2000);

    ns.ui.resizeTail(width, height);
  }

  /** Giữ API cũ: tính theo số cột & số dòng (đã bù buffer) */
  static autoResizeTail(ns: NS, maxCols: number, lines: number, bufferLines: number = 2) {
    const styles = ns.ui.getStyles();
    const fontSize = Number(styles.tailFontSize);
    const lineHeightPx = fontSize * Number(styles.lineHeight);
    const charWidth = this.measureCharWidthSafe(fontSize, styles.fontFamily);

    const width = this.clamp(Math.round(maxCols * charWidth) + 24, 420, 2000);
    const height = this.clamp(Math.round((lines + bufferLines) * lineHeightPx) + 8, 200, 1400);

    ns.ui.resizeTail(width, height);
  }

  /** Lợi nhuận kỳ vọng dựa trên forecast & volatility */
  static expectedReturn(ns: NS, sym: string): number {
    const f = ns.stock.has4SDataTIXAPI() ? ns.stock.getForecast(sym) : 0.5;
    const v = ns.stock.getVolatility(sym);
    return (f - 0.5) * 2 * v;
  }

  // ===== helpers =====
  private static stripAnsi(str: string): string {
    return str.replace(/\x1b\[[0-9;]*m/g, "");
  }

  private static measureCharWidthSafe(fontSize: number, fontFamily: string): number {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      ctx.font = `${fontSize}px ${fontFamily}`;
      const test = "W".repeat(200); // giảm sai số
      return ctx.measureText(test).width / test.length;
    } catch {
      // Fallback an toàn cho môi trường không đo được canvas
      return fontSize * 0.6;
    }
  }

  private static clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
  }

  private static getScripAgrs(ns: NS, scripname: string, host?: string): ScriptArg[] {
    const dataScripts = ns.ps(host || ns.getHostname());
    const targetScript = dataScripts?.find((p) => p.filename === scripname);
    if (!targetScript) return null;
    return targetScript.args;
  }
}
