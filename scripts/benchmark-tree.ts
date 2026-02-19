import { flattenTree } from "../src/lib/treeUtils";
import type { FileNode } from "../src/types";

function makeSyntheticTree(depth: number, breadth: number, prefix = "node"): FileNode[] {
  const nodes: FileNode[] = [];

  for (let index = 0; index < breadth; index += 1) {
    const folderPath = `${prefix}-${depth}-${index}`;
    const folderChildren = depth > 1 ? makeSyntheticTree(depth - 1, breadth, folderPath) : [];

    nodes.push({
      path: folderPath,
      name: folderPath,
      is_file: false,
      size: null,
      modified: null,
      children: folderChildren,
    });

    nodes.push({
      path: `${folderPath}/file-${index}.md`,
      name: `file-${index}.md`,
      is_file: true,
      size: 1024,
      modified: null,
      children: null,
    });
  }

  return nodes;
}

function collectExpandedFolders(nodes: FileNode[], expanded: Set<string>): void {
  for (const node of nodes) {
    if (!node.is_file) {
      expanded.add(node.path);
      if (node.children) {
        collectExpandedFolders(node.children, expanded);
      }
    }
  }
}

const roots = makeSyntheticTree(4, 6);
const expanded = new Set<string>();
collectExpandedFolders(roots, expanded);

const iterations = 50;
const warmupRuns = 5;

for (let run = 0; run < warmupRuns; run += 1) {
  flattenTree(roots, expanded);
}

const startedAt = performance.now();
let visibleNodes = 0;

for (let run = 0; run < iterations; run += 1) {
  const flat = flattenTree(roots, expanded);
  visibleNodes = flat.length;
}

const endedAt = performance.now();
const totalMs = endedAt - startedAt;
const averageMs = totalMs / iterations;

console.log("Tree flatten benchmark");
console.log(`Visible nodes: ${visibleNodes}`);
console.log(`Iterations: ${iterations}`);
console.log(`Total: ${totalMs.toFixed(2)}ms`);
console.log(`Average: ${averageMs.toFixed(2)}ms`);
