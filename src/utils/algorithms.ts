
import { GridNode, Algorithm, PathfindingResult } from '../types/pathfinding';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const runPathfindingAlgorithm = async (
  grid: GridNode[][],
  algorithm: Algorithm,
  speed: number,
  onUpdate?: (grid: GridNode[][], stats: { visited: number; pathLength: number; time: number }) => void
): Promise<PathfindingResult | null> => {
  const startTime = performance.now();
  const startNode = getStartNode(grid);
  const endNode = getEndNode(grid);
  
  if (!startNode || !endNode) return null;

  let visitedNodesInOrder: GridNode[] = [];
  
  const updateCallback = onUpdate ? (visitedCount: number) => {
    const currentTime = Math.round(performance.now() - startTime);
    onUpdate(grid, { visited: visitedCount, pathLength: 0, time: currentTime });
  } : undefined;
  
  switch (algorithm) {
    case 'dijkstra':
      visitedNodesInOrder = await dijkstra(grid, startNode, endNode, speed, updateCallback);
      break;
    case 'astar':
      visitedNodesInOrder = await astar(grid, startNode, endNode, speed, updateCallback);
      break;
    case 'bfs':
      visitedNodesInOrder = await bfs(grid, startNode, endNode, speed, updateCallback);
      break;
    case 'dfs':
      visitedNodesInOrder = await dfs(grid, startNode, endNode, speed, updateCallback);
      break;
    default:
      return null;
  }

  const nodesInShortestPathOrder = getNodesInShortestPathOrder(endNode);
  const finalGrid = await animatePath(grid, nodesInShortestPathOrder, speed, onUpdate, startTime);

  return {
    visitedNodesInOrder,
    nodesInShortestPathOrder,
    finalGrid,
  };
};

const getStartNode = (grid: GridNode[][]): GridNode | null => {
  for (const row of grid) {
    for (const node of row) {
      if (node.isStart) return node;
    }
  }
  return null;
};

const getEndNode = (grid: GridNode[][]): GridNode | null => {
  for (const row of grid) {
    for (const node of row) {
      if (node.isEnd) return node;
    }
  }
  return null;
};

const getNeighbors = (node: GridNode, grid: GridNode[][]): GridNode[] => {
  const neighbors: GridNode[] = [];
  const { row, col } = node;
  
  if (row > 0) neighbors.push(grid[row - 1][col]);
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
  if (col > 0) neighbors.push(grid[row][col - 1]);
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
  
  return neighbors.filter(neighbor => !neighbor.isWall);
};

const dijkstra = async (
  grid: GridNode[][],
  startNode: GridNode,
  endNode: GridNode,
  speed: number,
  onUpdate?: (visitedCount: number) => void
): Promise<GridNode[]> => {
  const visitedNodesInOrder: GridNode[] = [];
  startNode.distance = 0;
  const unvisitedNodes = getAllNodes(grid);

  while (unvisitedNodes.length) {
    sortNodesByDistance(unvisitedNodes);
    const closestNode = unvisitedNodes.shift()!;

    if (closestNode.isWall) continue;
    if (closestNode.distance === Infinity) return visitedNodesInOrder;

    closestNode.isVisited = true;
    visitedNodesInOrder.push(closestNode);

    if (onUpdate) {
      onUpdate(visitedNodesInOrder.length);
    }

    if (speed > 0) await sleep(speed);

    if (closestNode === endNode) return visitedNodesInOrder;

    updateUnvisitedNeighbors(closestNode, grid);
  }

  return visitedNodesInOrder;
};

const astar = async (
  grid: GridNode[][],
  startNode: GridNode,
  endNode: GridNode,
  speed: number,
  onUpdate?: (visitedCount: number) => void
): Promise<GridNode[]> => {
  const visitedNodesInOrder: GridNode[] = [];
  const openSet: GridNode[] = [startNode];
  
  startNode.gCost = 0;
  startNode.hCost = getDistance(startNode, endNode);
  startNode.fCost = startNode.gCost + startNode.hCost;

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.fCost - b.fCost);
    const currentNode = openSet.shift()!;

    if (currentNode.isWall) continue;

    currentNode.isVisited = true;
    visitedNodesInOrder.push(currentNode);

    if (onUpdate) {
      onUpdate(visitedNodesInOrder.length);
    }

    if (speed > 0) await sleep(speed);

    if (currentNode === endNode) return visitedNodesInOrder;

    const neighbors = getNeighbors(currentNode, grid);
    
    for (const neighbor of neighbors) {
      if (neighbor.isVisited) continue;

      const tentativeGCost = currentNode.gCost + 1;
      
      if (!openSet.includes(neighbor)) {
        openSet.push(neighbor);
      } else if (tentativeGCost >= neighbor.gCost) {
        continue;
      }

      neighbor.previousNode = currentNode;
      neighbor.gCost = tentativeGCost;
      neighbor.hCost = getDistance(neighbor, endNode);
      neighbor.fCost = neighbor.gCost + neighbor.hCost;
    }
  }

  return visitedNodesInOrder;
};

const bfs = async (
  grid: GridNode[][],
  startNode: GridNode,
  endNode: GridNode,
  speed: number,
  onUpdate?: (visitedCount: number) => void
): Promise<GridNode[]> => {
  const visitedNodesInOrder: GridNode[] = [];
  const queue: GridNode[] = [startNode];
  startNode.isVisited = true;

  while (queue.length > 0) {
    const currentNode = queue.shift()!;
    visitedNodesInOrder.push(currentNode);

    if (onUpdate) {
      onUpdate(visitedNodesInOrder.length);
    }

    if (speed > 0) await sleep(speed);

    if (currentNode === endNode) return visitedNodesInOrder;

    const neighbors = getNeighbors(currentNode, grid);
    
    for (const neighbor of neighbors) {
      if (!neighbor.isVisited) {
        neighbor.isVisited = true;
        neighbor.previousNode = currentNode;
        queue.push(neighbor);
      }
    }
  }

  return visitedNodesInOrder;
};

const dfs = async (
  grid: GridNode[][],
  startNode: GridNode,
  endNode: GridNode,
  speed: number,
  onUpdate?: (visitedCount: number) => void
): Promise<GridNode[]> => {
  const visitedNodesInOrder: GridNode[] = [];
  const stack: GridNode[] = [startNode];

  while (stack.length > 0) {
    const currentNode = stack.pop()!;
    
    if (currentNode.isVisited || currentNode.isWall) continue;
    
    currentNode.isVisited = true;
    visitedNodesInOrder.push(currentNode);

    if (onUpdate) {
      onUpdate(visitedNodesInOrder.length);
    }

    if (speed > 0) await sleep(speed);

    if (currentNode === endNode) return visitedNodesInOrder;

    const neighbors = getNeighbors(currentNode, grid);
    
    for (const neighbor of neighbors) {
      if (!neighbor.isVisited) {
        neighbor.previousNode = currentNode;
        stack.push(neighbor);
      }
    }
  }

  return visitedNodesInOrder;
};

const getAllNodes = (grid: GridNode[][]): GridNode[] => {
  const nodes: GridNode[] = [];
  for (const row of grid) {
    for (const node of row) {
      nodes.push(node);
    }
  }
  return nodes;
};

const sortNodesByDistance = (unvisitedNodes: GridNode[]): void => {
  unvisitedNodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
};

const updateUnvisitedNeighbors = (node: GridNode, grid: GridNode[][]): void => {
  const unvisitedNeighbors = getNeighbors(node, grid).filter(
    neighbor => !neighbor.isVisited
  );
  
  for (const neighbor of unvisitedNeighbors) {
    neighbor.distance = node.distance + 1;
    neighbor.previousNode = node;
  }
};

const getDistance = (nodeA: GridNode, nodeB: GridNode): number => {
  const dx = Math.abs(nodeA.row - nodeB.row);
  const dy = Math.abs(nodeA.col - nodeB.col);
  return dx + dy; // Manhattan distance
};

const getNodesInShortestPathOrder = (endNode: GridNode): GridNode[] => {
  const nodesInShortestPathOrder: GridNode[] = [];
  let currentNode: GridNode | null = endNode;
  
  while (currentNode !== null) {
    nodesInShortestPathOrder.unshift(currentNode);
    currentNode = currentNode.previousNode;
  }
  
  return nodesInShortestPathOrder;
};

const animatePath = async (
  grid: GridNode[][],
  nodesInShortestPathOrder: GridNode[],
  speed: number,
  onUpdate?: (grid: GridNode[][], stats: { visited: number; pathLength: number; time: number }) => void,
  startTime?: number
): Promise<GridNode[][]> => {
  for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
    const node = nodesInShortestPathOrder[i];
    if (!node.isStart && !node.isEnd) {
      node.isPath = true;
    }
    
    if (onUpdate && startTime) {
      const currentTime = Math.round(performance.now() - startTime);
      onUpdate(grid, { visited: 0, pathLength: i + 1, time: currentTime });
    }
    
    if (speed > 0) await sleep(speed * 2);
  }
  return grid;
};
