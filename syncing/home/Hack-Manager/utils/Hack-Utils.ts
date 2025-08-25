export default class HackUtils {
  static updateLog(ns: NS, portData: number, target: string, batch: {hackThreads?: number; growThreads?: number; weakenThreads?: number}, action?: boolean): void {
    const portHandle = ns;

    const data = {
      target,
      hack: batch.hackThreads || 0,
      grow: batch.growThreads || 0,
      weaken: action ? batch.weakenThreads || 0 : (batch.weakenThreads || 0) * 2,
      updated: Date.now(),
    };

    if (!action) {
      // Ghi log batch
      data[target] = {
        hack: batch.hackThreads || 0,
        grow: batch.growThreads || 0,
        weaken: batch.weakenThreads * 2 || 0,
        updated: Date.now(),
      };
    }

    if (action) {
      // Ghi log normalize
      data[target] = {
        hack: batch.hackThreads || 0,
        grow: batch.growThreads || 0,
        weaken: batch.weakenThreads || 0,
        updated: Date.now(),
      };
    }

    portHandle.write(JSON.stringify(data));
  }

  static runMonitor(ns: NS, mainName: string, port: number, meta: any): void {
    const scriptName: string = "./monitor.ts";
    ns.run(scriptName, 1, mainName, port, ...meta);
  }

  static getScripAgrs(ns: NS, scripname: string, host?: string) {
    const dataScripts = ns.ps(host || ns.getHostname());
    const targetScript = dataScripts?.find((p) => p.filename === scripname);
    if (!targetScript) return null;
    return targetScript.args;
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
}
