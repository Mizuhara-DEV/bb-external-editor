import CodingContract from "./contract-manager";

// ========== MAPPING ==========
const SOLVERS: {[type: string]: (data: any) => any} = {
  "Find Largest Prime Factor": CodingContract.largestPrimeFactor,
  "Subarray with Maximum Sum": CodingContract.maxSubarraySum,
  "Spiralize Matrix": CodingContract.spiralizeMatrix,
  "Array Jumping Game": CodingContract.arrayJumpingGameI,
  "Array Jumping Game II": CodingContract.arrayJumpingGameII,
  "Minimum Path Sum in a Triangle": CodingContract.minPathTriangle,
  "Unique Paths in a Grid I": CodingContract.uniquePathsI,
  "Unique Paths in a Grid II": CodingContract.uniquePathsII,
  "Generate IP Addresses": CodingContract.generateIP,
  "Merge Overlapping Intervals": CodingContract.mergeIntervals,
  "Proper 2-Coloring of a Graph": CodingContract.twoColoring,
  "Sanitize Parentheses in Expression": CodingContract.sanitizeParens,
  "Total Ways to Sum": CodingContract.totalWaysToSum,
  "Total Ways to Sum II": CodingContract.totalWaysToSumII,
  "Algorithmic Stock Trader I": CodingContract.stockTraderI,
  "Algorithmic Stock Trader II": CodingContract.stockTraderII,
  "Algorithmic Stock Trader III": CodingContract.stockTraderIII,
  "Algorithmic Stock Trader IV": CodingContract.stockTraderIV,
  "Shortest Path in a Grid": CodingContract.shortestPathGrid,
  "Encryption I: Caesar Cipher": CodingContract.caesarDecrypt,
  "Encryption II: Vigenère Cipher": CodingContract.vigenereDecrypt,
  "HammingCodes: Encoded Binary to Integer": CodingContract.hammingToInt,
  "Compression I: RLE Compression": CodingContract.rleCompress,
};
export default SOLVERS;
