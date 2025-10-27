/**
 * Liquid Sorting Puzzle Solver (A*) + Console Output + Browser Export
 */

function heuristic(tubes) {
  return tubes.reduce(
    (acc, t) => acc + (t.length > 0 && new Set(t).size > 1 ? 1 : 0),
    0
  );
}

function canPour(from, to, tubes, capacity) {
  if (from === to) return false;
  if (tubes[from].length === 0) return false;
  if (tubes[to].length === capacity) return false;
  const fromTop = tubes[from][tubes[from].length - 1];
  const toTop = tubes[to][tubes[to].length - 1];
  return !toTop || toTop === fromTop;
}

function pour(from, to, tubes, capacity) {
  const newTubes = tubes.map(t => [...t]);
  const fromTop = newTubes[from][newTubes[from].length - 1];
  while (
    newTubes[from].length > 0 &&
    newTubes[from][newTubes[from].length - 1] === fromTop &&
    newTubes[to].length < capacity
  ) {
    newTubes[to].push(newTubes[from].pop());
  }
  return newTubes;
}

function isSolved(tubes, capacity) {
  return tubes.every(
    t => t.length === 0 || (t.length === capacity && t.every(c => c === t[0]))
  );
}

function serialize(tubes) {
  return JSON.stringify(tubes);
}

function solveAStar(initial, capacity) {
  const seen = new Set();
  const queue = [
    { tubes: initial, path: [], g: 0, h: heuristic(initial) }
  ];

  while (queue.length > 0) {
    queue.sort((a, b) => a.g + a.h - (b.g + b.h));
    const { tubes, path, g } = queue.shift();
    const key = serialize(tubes);
    if (seen.has(key)) continue;
    seen.add(key);

    if (isSolved(tubes, capacity)) return path;

    for (let i = 0; i < tubes.length; i++) {
      for (let j = 0; j < tubes.length; j++) {
        if (canPour(i, j, tubes, capacity)) {
          const newState = pour(i, j, tubes, capacity);
          const newPath = [...path, [i, j]];
          queue.push({
            tubes: newState,
            path: newPath,
            g: g + 1,
            h: heuristic(newState)
          });
        }
      }
    }
  }
  return null;
}

// Example usage
const tubes = [
  ['R','G','B','G'],
  ['B','G','R','R'],
  ['G','B','R','B'],
  [],
  []
];
const capacity = 4;

// Solve and print result in terminal
const result = solveAStar(tubes, capacity);
console.log("🧪 Optimized minimal-move solution:");
console.log(result);
console.log(`Total moves: ${result ? result.length : 0}`);

// Export for browser visualizer
if (typeof window !== "undefined") {
  window.solveAStar = solveAStar;
}
if (typeof module !== "undefined") {
  module.exports = { solveAStar };
}

