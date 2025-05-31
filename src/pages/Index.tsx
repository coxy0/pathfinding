import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Square,
  RotateCcw,
  Zap,
  Clock,
  Github,
  Linkedin,
} from "lucide-react";
import Grid from "../components/Grid";
import { GridNode, Algorithm } from "../types/pathfinding";
import { runPathfindingAlgorithm } from "../utils/algorithms";

const GRID_ROWS = 25;
const GRID_COLS = 50;

const Index = () => {
  const [grid, setGrid] = useState<GridNode[][]>(() => {
    const initialGrid: GridNode[][] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      const currentRow: GridNode[] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        currentRow.push({
          row,
          col,
          isStart: row === 12 && col === 10,
          isEnd: row === 12 && col === 40,
          isWall: false,
          isVisited: false,
          isPath: false,
          distance: Infinity,
          previousNode: null,
          fCost: 0,
          gCost: 0,
          hCost: 0,
        });
      }
      initialGrid.push(currentRow);
    }

    return initialGrid;
  });

  const [algorithm, setAlgorithm] = useState<Algorithm>("dijkstra");
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState([50]);
  const [drawMode, setDrawMode] = useState<"wall" | "start" | "end" | "erase">(
    "wall"
  );
  const [stats, setStats] = useState({ visited: 0, pathLength: 0, time: 0 });
  const [isSolved, setIsSolved] = useState(false);

  const mouseIsPressed = useRef(false);

  const resetGrid = useCallback(() => {
    setGrid((prevGrid) =>
      prevGrid.map((row) =>
        row.map((node) => ({
          ...node,
          isVisited: false,
          isPath: false,
          distance: Infinity,
          previousNode: null,
          fCost: 0,
          gCost: 0,
          hCost: 0,
        }))
      )
    );

    setStats({ visited: 0, pathLength: 0, time: 0 });
    setIsSolved(false);
  }, []);

  const clearWalls = useCallback(() => {
    setGrid((prevGrid) =>
      prevGrid.map((row) =>
        row.map((node) => ({
          ...node,
          isWall: false,
          isVisited: false,
          isPath: false,
          distance: Infinity,
          previousNode: null,
          fCost: 0,
          gCost: 0,
          hCost: 0,
        }))
      )
    );

    setStats({ visited: 0, pathLength: 0, time: 0 });
    setIsSolved(false);
  }, []);

  const generateMaze = useCallback(() => {
    setGrid((prevGrid) => {
      return prevGrid.map((row) =>
        row.map((node) => ({
          ...node,
          isWall: Math.random() < 0.3 && !node.isStart && !node.isEnd,
          isVisited: false,
          isPath: false,
          distance: Infinity,
          previousNode: null,
          fCost: 0,
          gCost: 0,
          hCost: 0,
        }))
      );
    });

    setStats({ visited: 0, pathLength: 0, time: 0 });
    setIsSolved(false);
  }, []);

  const recalculatePath = useCallback(
    async (newGrid: GridNode[][]) => {
      const cleanGrid = newGrid.map((row) =>
        row.map((node) => ({
          ...node,
          isVisited: false,
          isPath: false,
          distance: Infinity,
          previousNode: null,
          fCost: 0,
          gCost: 0,
          hCost: 0,
        }))
      );

      const result = await runPathfindingAlgorithm(
        cleanGrid,
        algorithm,
        0,
        (updatedGrid, newStats) => {
          setGrid([...updatedGrid]);
          setStats(newStats);
        }
      );

      if (result) setGrid(result.finalGrid);
    },
    [algorithm]
  );

  const handleNodeClick = useCallback(
    (row: number, col: number) => {
      if (isRunning) return;

      setGrid((prevGrid) => {
        const newGrid = [...prevGrid];
        const node = newGrid[row][col];

        const notStartOrEnd = !node.isStart && !node.isEnd;

        if (drawMode === "start") {
          if (node.isEnd) return newGrid;
          newGrid.forEach((r) => r.forEach((n) => (n.isStart = false)));
          node.isStart = true;
          node.isWall = false;
        } else if (drawMode === "end") {
          if (node.isStart) return newGrid;
          newGrid.forEach((r) => r.forEach((n) => (n.isEnd = false)));
          node.isEnd = true;
          node.isWall = false;
        } else if (drawMode === "wall" && notStartOrEnd) {
          node.isWall = !node.isWall;
        } else if (drawMode === "erase" && notStartOrEnd && node.isWall) {
          node.isWall = false;
        }

        if (isSolved) recalculatePath(newGrid);

        return newGrid;
      });
    },
    [isRunning, drawMode, isSolved, recalculatePath]
  );

  const handleMouseDown = useCallback(
    (row: number, col: number) => {
      if (isRunning) return;
      mouseIsPressed.current = true;
      handleNodeClick(row, col);
    },
    [handleNodeClick, isRunning]
  );

  const handleMouseEnter = useCallback(
    (row: number, col: number) => {
      if (!mouseIsPressed.current || isRunning) return;

      if (drawMode === "wall") {
        setGrid((prevGrid) => {
          const newGrid = prevGrid.map((rowArr, rIdx) =>
            rowArr.map((node, cIdx) =>
              rIdx === row && cIdx === col && !node.isStart && !node.isEnd
                ? { ...node, isWall: true }
                : node
            )
          );

          if (isSolved) recalculatePath(newGrid);
          return newGrid;
        });
      }
    },
    [isRunning, drawMode, isSolved, recalculatePath]
  );

  const handleMouseUp = useCallback(() => {
    mouseIsPressed.current = false;
  }, []);

  const visualizeAlgorithm = useCallback(async () => {
    if (isRunning) return;

    resetGrid();
    setIsRunning(true);
    setIsSolved(false);
    setStats({ visited: 0, pathLength: 0, time: 0 });

    const result = await runPathfindingAlgorithm(
      grid,
      algorithm,
      speed[0],
      (updatedGrid, newStats) => {
        setGrid([...updatedGrid]);
        setStats(newStats);
      }
    );

    if (result) {
      setGrid(result.finalGrid);
      setIsSolved(true);
    }

    setIsRunning(false);
  }, [grid, algorithm, speed, isRunning, resetGrid]);

  return (
    <div className="min-h-screen bg-slate-950 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">
            Pathfinding Algorithm Visualiser
          </h1>
          <p className="text-slate-300 text-sm sm:text-lg">
            Watch algorithms find the shortest path in real-time
          </p>
        </div>

        <Card className="mb-4 sm:mb-6 bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-center text-lg sm:text-xl">
              Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-slate-300 block text-center">
                  Algorithm
                </label>
                <Select
                  value={algorithm}
                  onValueChange={(value: Algorithm) => setAlgorithm(value)}
                  disabled={isRunning}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 text-white [&_*]:text-white">
                    <SelectItem
                      value="dijkstra"
                      className="text-white focus:text-white hover:bg-slate-700 focus:bg-slate-700"
                    >
                      Dijkstra's Algorithm
                    </SelectItem>
                    <SelectItem
                      value="astar"
                      className="text-white focus:text-white hover:bg-slate-700 focus:bg-slate-700"
                    >
                      A* Search
                    </SelectItem>
                    <SelectItem
                      value="bfs"
                      className="text-white focus:text-white hover:bg-slate-700 focus:bg-slate-700"
                    >
                      Breadth-First Search
                    </SelectItem>
                    <SelectItem
                      value="dfs"
                      className="text-white focus:text-white hover:bg-slate-700 focus:bg-slate-700"
                    >
                      Depth-First Search
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-slate-300 block text-center">
                  Draw Mode
                </label>
                <Select
                  value={drawMode}
                  onValueChange={(value: "wall" | "start" | "end") =>
                    setDrawMode(value)
                  }
                  disabled={isRunning}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 text-white [&_*]:text-white">
                    <SelectItem
                      value="wall"
                      className="text-white focus:text-white hover:bg-slate-700 focus:bg-slate-700"
                    >
                      Draw Walls
                    </SelectItem>
                    <SelectItem
                      value="start"
                      className="text-white focus:text-white hover:bg-slate-700 focus:bg-slate-700"
                    >
                      Place Start
                    </SelectItem>
                    <SelectItem
                      value="end"
                      className="text-white focus:text-white hover:bg-slate-700 focus:bg-slate-700"
                    >
                      Place End
                    </SelectItem>
                    <SelectItem
                      value="erase"
                      className="text-white focus:text-white hover:bg-slate-700 focus:bg-slate-700"
                    >
                      Erase Walls
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-slate-300 block text-center">
                  Animation Speed
                </label>
                <div className="px-3">
                  <Slider
                    value={speed}
                    onValueChange={setSpeed}
                    max={200}
                    min={1}
                    step={1}
                    className="w-full [&_.relative]:bg-slate-700 [&_.absolute]:bg-green-500 [&_.block]:bg-green-500 [&_.block]:border-green-400"
                    disabled={isRunning}
                  />
                </div>
                <p className="text-xs text-slate-400 text-center">
                  {speed[0]}ms delay (lower = faster)
                </p>
              </div>

              <div className="flex items-end justify-center">
                <Button
                  onClick={visualizeAlgorithm}
                  disabled={isRunning || isSolved}
                  className="bg-green-600 hover:bg-green-700 text-white hover:text-white px-4 sm:px-6 text-xs sm:text-sm"
                >
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  {isRunning ? "Running..." : isSolved ? "Solved" : "Visualise"}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              <Button
                onClick={resetGrid}
                disabled={isRunning}
                variant="outline"
                className="border-slate-600 text-white bg-slate-800 hover:bg-slate-700 hover:text-white text-xs sm:text-sm"
              >
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={clearWalls}
                disabled={isRunning}
                variant="outline"
                className="border-slate-600 text-white bg-slate-800 hover:bg-slate-700 hover:text-white text-xs sm:text-sm"
              >
                <Square className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Clear Walls
              </Button>
              <Button
                onClick={generateMaze}
                disabled={isRunning}
                variant="outline"
                className="border-slate-600 text-white bg-slate-800 hover:bg-slate-700 hover:text-white text-xs sm:text-sm"
              >
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Generate Maze
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4 sm:mb-6 bg-slate-900 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
              <Badge
                variant="secondary"
                className="bg-green-600 text-white select-none pointer-events-none text-xs sm:text-sm"
              >
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Nodes Visited: {stats.visited}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-green-600 text-white select-none pointer-events-none text-xs sm:text-sm"
              >
                Path Length: {stats.pathLength}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-green-600 text-white select-none pointer-events-none text-xs sm:text-sm"
              >
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Time: {stats.time}ms
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4 sm:mb-6 bg-slate-900 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-sm"></div>
                <span className="text-slate-300">Start Node</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-sm"></div>
                <span className="text-slate-300">End Node</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-slate-400 rounded-sm"></div>
                <span className="text-slate-300">Wall</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-400 rounded-sm"></div>
                <span className="text-slate-300">Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-400 rounded-sm"></div>
                <span className="text-slate-300">Shortest Path</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700 mb-4 sm:mb-6">
          <CardContent className="p-2 sm:p-4 flex justify-center overflow-x-auto">
            <Grid
              grid={grid}
              onNodeClick={handleNodeClick}
              onMouseDown={handleMouseDown}
              onMouseEnter={handleMouseEnter}
              onMouseUp={handleMouseUp}
            />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700 mb-4 sm:mb-6">
          <CardHeader>
            <CardTitle className="text-white text-xl sm:text-2xl text-center">
              How to Use
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
                      <span className="text-green-400 font-bold">•</span>
                      <p className="text-sm sm:text-base">
                        Choose an algorithm from the dropdown menu to see how
                        different pathfinding methods work
                      </p>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
                      <span className="text-green-400 font-bold">•</span>
                      <p className="text-sm sm:text-base">
                        Click and drag to draw walls, or change draw mode to
                        place start/end points
                      </p>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
                      <span className="text-green-400 font-bold">•</span>
                      <p className="text-sm sm:text-base">
                        Adjust the animation speed with the slider for better
                        visualisation
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
                      <span className="text-green-400 font-bold">•</span>
                      <p className="text-sm sm:text-base">
                        Click "Visualise" to watch the algorithm find the
                        shortest path in real-time
                      </p>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
                      <span className="text-green-400 font-bold">•</span>
                      <p className="text-sm sm:text-base">
                        Use "Generate Maze" for a random obstacle layout to test
                        algorithms
                      </p>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
                      <span className="text-green-400 font-bold">•</span>
                      <p className="text-sm sm:text-base">
                        After solving, move start/end points or add walls to see
                        instant recalculation
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex justify-center gap-6">
                <a
                  href="https://github.com/coxy0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-300 hover:text-green-400 transition-colors"
                >
                  <Github className="w-5 h-5" />
                  <span>GitHub</span>
                </a>
                <a
                  href="https://linkedin.com/in/oli-cox"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-300 hover:text-green-400 transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
