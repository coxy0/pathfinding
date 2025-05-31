export interface GridNode {
  row: number;
  col: number;
  isStart: boolean;
  isEnd: boolean;
  isWall: boolean;
  isVisited: boolean;
  isPath: boolean;
  distance: number;
  previousNode: GridNode | null;
  fCost: number;
  gCost: number;
  hCost: number;
}

export type Algorithm = "dijkstra" | "astar" | "bfs" | "dfs";

export interface PathfindingResult {
  visitedNodesInOrder: GridNode[];
  nodesInShortestPathOrder: GridNode[];
  finalGrid: GridNode[][];
}
