/** @param {NS} ns **/
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

// ========== MAPPING ==========
const SOLVERS = {
  "Find Largest Prime Factor": largestPrimeFactor,
  "Subarray with Maximum Sum": maxSubarraySum,
  "Spiralize Matrix": spiralizeMatrix,
  "Array Jumping Game": arrayJumpingGameI,
  "Array Jumping Game II": arrayJumpingGameII,
  "Minimum Path Sum in a Triangle": minPathTriangle,
  "Unique Paths in a Grid I": uniquePathsI,
  "Unique Paths in a Grid II": uniquePathsII,
  "Generate IP Addresses": generateIP,
  "Merge Overlapping Intervals": mergeIntervals,
  "Proper 2-Coloring of a Graph": twoColoring,
  "Sanitize Parentheses in Expression": sanitizeParens,
  "Total Ways to Sum": totalWaysToSum,
  "Total Ways to Sum II": totalWaysToSumII,
  "Algorithmic Stock Trader I": stockTraderI,
  "Algorithmic Stock Trader II": stockTraderII,
  "Algorithmic Stock Trader III": stockTraderIII,
  "Algorithmic Stock Trader IV": stockTraderIV,
  "Shortest Path in a Grid": shortestPathGrid,
  "Encryption I: Caesar Cipher": caesarDecrypt,
  "Encryption II: Vigenère Cipher": vigenereDecrypt,
  "HammingCodes: Encoded Binary to Integer": hammingToInt,
  "Compression I: RLE Compression": rleCompress,
};

// ========== SOLVERS ==========

// 1) Largest Prime Factor
function largestPrimeFactor(n) {
  let num = BigInt(n);
  let ans = 1n;
  while (num % 2n === 0n) {
    ans = 2n;
    num /= 2n;
  }
  let f = 3n;
  while (f * f <= num) {
    while (num % f === 0n) {
      ans = f;
      num /= f;
    }
    f += 2n;
  }
  if (num > 1n) ans = num;
  return Number(ans);
}

// 2) Subarray with Maximum Sum (Kadane)
function maxSubarraySum(arr) {
  let best = -Infinity,
    cur = 0;
  for (const x of arr) {
    cur = Math.max(x, cur + x);
    best = Math.max(best, cur);
  }
  return best;
}

// 3) Spiralize Matrix
function spiralizeMatrix(mat) {
  const res = [];
  if (!mat?.length) return res;
  let top = 0,
    left = 0,
    bottom = mat.length - 1,
    right = mat[0].length - 1;
  while (top <= bottom && left <= right) {
    for (let j = left; j <= right; j++) res.push(mat[top][j]);
    top++;
    for (let i = top; i <= bottom; i++) res.push(mat[i][right]);
    right--;
    if (top <= bottom) {
      for (let j = right; j >= left; j--) res.push(mat[bottom][j]);
      bottom--;
    }
    if (left <= right) {
      for (let i = bottom; i >= top; i--) res.push(mat[i][left]);
      left++;
    }
  }
  return res;
}

// 4) Array Jumping Game I (tới được cuối?)
function arrayJumpingGameI(arr) {
  let maxReach = 0;
  for (let i = 0; i <= maxReach && i < arr.length; i++) {
    maxReach = Math.max(maxReach, i + arr[i]);
  }
  return maxReach >= arr.length - 1 ? 1 : 0;
}

// 5) Array Jumping Game II (số bước ít nhất)
function arrayJumpingGameII(arr) {
  let steps = 0,
    end = 0,
    far = 0;
  for (let i = 0; i < arr.length - 1; i++) {
    far = Math.max(far, i + arr[i]);
    if (i === end) {
      steps++;
      end = far;
    }
  }
  return steps;
}

// 6) Minimum Path Sum in a Triangle
function minPathTriangle(tri) {
  const dp = tri[tri.length - 1].slice();
  for (let i = tri.length - 2; i >= 0; i--) {
    for (let j = 0; j < tri[i].length; j++) {
      dp[j] = tri[i][j] + Math.min(dp[j], dp[j + 1]);
    }
  }
  return dp[0];
}

// 7) Unique Paths I (m x n)
function uniquePathsI([m, n]) {
  const dp = Array(n).fill(1);
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) dp[j] += dp[j - 1];
  }
  return dp[n - 1];
}

// 8) Unique Paths II (grid có obstacle = 1)
function uniquePathsII(grid) {
  const m = grid.length,
    n = grid[0].length;
  const dp = Array(n).fill(0);
  dp[0] = grid[0][0] === 0 ? 1 : 0;
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === 1) dp[j] = 0;
      else if (j > 0) dp[j] += dp[j - 1];
    }
  }
  return dp[n - 1];
}

// 9) Generate IP Addresses
function generateIP(s) {
  const res = [];
  function ok(seg) {
    return seg.length === 1 || (seg[0] !== "0" && Number(seg) <= 255);
  }
  const n = s.length;
  for (let i = 1; i < 4 && i < n; i++)
    for (let j = i + 1; j < i + 4 && j < n; j++)
      for (let k = j + 1; k < j + 4 && k < n; k++) {
        const a = s.slice(0, i),
          b = s.slice(i, j),
          c = s.slice(j, k),
          d = s.slice(k);
        if ([a, b, c, d].every(ok)) res.push(`${a}.${b}.${c}.${d}`);
      }
  return res;
}

// 10) Merge Overlapping Intervals
function mergeIntervals(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  const res = [];
  for (const it of intervals) {
    if (!res.length || res[res.length - 1][1] < it[0]) res.push(it.slice());
    else res[res.length - 1][1] = Math.max(res[res.length - 1][1], it[1]);
  }
  return res;
}

// 11) Proper 2-Coloring of a Graph
function twoColoring({nodes, edges}) {
  const g = Array.from({length: nodes}, () => []);
  for (const [u, v] of edges) {
    g[u].push(v);
    g[v].push(u);
  }
  const color = Array(nodes).fill(-1);
  for (let s = 0; s < nodes; s++)
    if (color[s] === -1) {
      color[s] = 0;
      const q = [s];
      for (let qi = 0; qi < q.length; qi++) {
        const u = q[qi];
        for (const v of g[u]) {
          if (color[v] === -1) {
            color[v] = color[u] ^ 1;
            q.push(v);
          } else if (color[v] === color[u]) return [];
        }
      }
    }
  return color;
}

// 12) Sanitize Parentheses in Expression
function sanitizeParens(s) {
  const valid = (t) => {
    let bal = 0;
    for (const c of t) {
      if (c === "(") bal++;
      else if (c === ")") {
        bal--;
        if (bal < 0) return false;
      }
    }
    return bal === 0;
  };
  let cur = new Set([s]),
    seen = new Set([s]);
  while (true) {
    const ans = [...cur].filter(valid);
    if (ans.length) return ans;
    const next = new Set();
    for (const t of cur) {
      for (let i = 0; i < t.length; i++) {
        if (t[i] !== "(" && t[i] !== ")") continue;
        const u = t.slice(0, i) + t.slice(i + 1);
        if (!seen.has(u)) {
          seen.add(u);
          next.add(u);
        }
      }
    }
    cur = next;
  }
}

// 13) Total Ways to Sum (unlimited parts)
function totalWaysToSum(n) {
  const dp = Array(n + 1).fill(0);
  dp[0] = 1;
  for (let coin = 1; coin <= n - 1; coin++) {
    for (let x = coin; x <= n; x++) dp[x] += dp[x - coin];
  }
  return dp[n];
}

// 14) Total Ways to Sum II (limited parts)
function totalWaysToSumII({target, numbers}) {
  const dp = Array(target + 1).fill(0);
  dp[0] = 1;
  for (const {number, count} of numbers) {
    for (let t = target; t >= 0; t--) {
      for (let k = 1; k <= count && t + k * number <= target; k++) {
        dp[t + k * number] += dp[t];
      }
    }
  }
  return dp[target];
}

// 15) Stock Trader I (tối đa 1 giao dịch)
function stockTraderI(prices) {
  let minp = Infinity,
    best = 0;
  for (const p of prices) {
    minp = Math.min(minp, p);
    best = Math.max(best, p - minp);
  }
  return best;
}

// 16) Stock Trader II (nhiều giao dịch, không chồng)
function stockTraderII(prices) {
  let profit = 0;
  for (let i = 1; i < prices.length; i++) if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1];
  return profit;
}

// 17) Stock Trader III (tối đa 2 giao dịch)
function stockTraderIII(prices) {
  let buy1 = -Infinity,
    sell1 = 0,
    buy2 = -Infinity,
    sell2 = 0;
  for (const p of prices) {
    buy1 = Math.max(buy1, -p);
    sell1 = Math.max(sell1, buy1 + p);
    buy2 = Math.max(buy2, sell1 - p);
    sell2 = Math.max(sell2, buy2 + p);
  }
  return sell2;
}

// 18) Stock Trader IV (tối đa k giao dịch)
function stockTraderIV([k, prices]) {
  const n = prices.length;
  if (k >= Math.floor(n / 2)) return stockTraderII(prices);
  const buy = Array(k + 1).fill(-Infinity),
    sell = Array(k + 1).fill(0);
  for (const p of prices) {
    for (let i = 1; i <= k; i++) {
      buy[i] = Math.max(buy[i], sell[i - 1] - p);
      sell[i] = Math.max(sell[i], buy[i] + p);
    }
  }
  return sell[k];
}

// 19) Shortest Path in a Grid (BFS: '0' trống, '1' tường), trả về path như "URDL..."
function shortestPathGrid(grid, start = null, end = null) {
  type Dirs = [number, number, string];
  // Bitburner thường đưa {grid, start, end} hoặc chỉ grid với S/E; nhưng bản phổ biến là 0/1 + start=(0,0), end=(m-1,n-1)
  // Ở đây mặc định (0,0) -> (m-1,n-1). Nếu contract trả object, ta xử lý linh hoạt.
  if (Array.isArray(grid) && typeof grid[0][0] === "number") {
    const m = grid.length,
      n = grid[0].length;
    const dirs: Dirs[] = [
      [-1, 0, "U"],
      [0, 1, "R"],
      [1, 0, "D"],
      [0, -1, "L"],
    ];
    const q = [[0, 0]],
      prev = new Map();
    const key = (i, j) => i + "," + j;
    const seen = Array.from({length: m}, () => Array(n).fill(false));
    seen[0][0] = true;
    while (q.length) {
      const [i, j] = q.shift();
      if (i === m - 1 && j === n - 1) break;
      for (const [di, dj, dc] of dirs) {
        const ni = i + di,
          nj = j + dj;
        if (ni >= 0 && nj >= 0 && ni < m && nj < n && grid[ni][nj] === 0 && !seen[ni][nj]) {
          seen[ni][nj] = true;
          q.push([ni, nj]);
          prev.set(key(ni, nj), [i, j, dc]);
        }
      }
    }
    if (!prev.has(key(m - 1, n - 1))) return ""; // no path
    const path = [];
    let cur = [m - 1, n - 1];
    while (!(cur[0] === 0 && cur[1] === 0)) {
      const [pi, pj, dc] = prev.get(key(cur[0], cur[1]));
      path.push(dc);
      cur = [pi, pj];
    }
    return path.reverse().join("");
  } else if (grid?.grid) {
    // dạng object { grid, start, end }
    return shortestPathGrid(grid.grid, grid.start, grid.end);
  }
  return "";
}

// 20) Caesar Cipher (decrypt): data = [shift, text]
function caesarDecrypt([shift, s]) {
  shift = ((shift % 26) + 26) % 26;
  const a = "a".charCodeAt(0),
    A = "A".charCodeAt(0);
  let out = "";
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    if (c >= A && c <= A + 25) out += String.fromCharCode(A + ((c - A - shift + 26) % 26));
    else if (c >= a && c <= a + 25) out += String.fromCharCode(a + ((c - a - shift + 26) % 26));
    else out += ch;
  }
  return out;
}

// 21) Vigenère Cipher (decrypt): data = [key, text]
function vigenereDecrypt([key, s]) {
  const A = "A".charCodeAt(0),
    a = "a".charCodeAt(0);
  const ks = key.replace(/[^A-Za-z]/g, "");
  let out = "",
    ki = 0;
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    const k = ks[ki % ks.length];
    if (!k) {
      out += ch;
      continue;
    }
    const kshift = (k.toUpperCase().charCodeAt(0) - A + 26) % 26;
    if (code >= A && code <= A + 25) {
      out += String.fromCharCode(A + ((code - A - kshift + 26) % 26));
      ki++;
    } else if (code >= a && code <= a + 25) {
      out += String.fromCharCode(a + ((code - a - kshift + 26) % 26));
      ki++;
    } else out += ch;
  }
  return out;
}

// 22) HammingCodes: Encoded Binary to Integer
function hammingToInt(bits) {
  // bits là string "0101..."
  const b = ["", ...bits]; // 1-index
  const n = b.length - 1;
  // xác định parity positions: 1,2,4,8,...
  const isPow2 = (x) => (x & (x - 1)) === 0;
  let syndrome = 0;
  for (let p = 1; p <= n; p <<= 1) {
    let sum = 0;
    for (let i = 1; i <= n; i++) if (i & p) sum ^= Number(b[i]);
    if (sum % 2 !== 0) syndrome += p;
  }
  if (syndrome >= 1 && syndrome <= n) {
    // flip bit lỗi
    b[syndrome] = b[syndrome] === "0" ? "1" : "0";
  }
  // remove parity bits
  const data = [];
  for (let i = 1; i <= n; i++) if (!isPow2(i)) data.push(b[i]);
  const val = parseInt(data.join(""), 2);
  return val;
}

// 23) Compression I: RLE Compression (trả về string)
function rleCompress(s) {
  if (!s) return "";
  let res = "",
    cnt = 1;
  for (let i = 1; i <= s.length; i++) {
    if (i < s.length && s[i] === s[i - 1] && cnt < 9) cnt++;
    else {
      res += cnt.toString() + s[i - 1];
      cnt = 1;
    }
  }
  return res;
}
