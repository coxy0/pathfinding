import React from "react";
import { GridNode } from "../types/pathfinding";

interface GridProps {
  grid: GridNode[][];
  onNodeClick: (row: number, col: number) => void;
  onMouseDown: (row: number, col: number) => void;
  onMouseEnter: (row: number, col: number) => void;
  onMouseUp: () => void;
}

const Grid: React.FC<GridProps> = ({
  grid,
  onNodeClick,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
}) => {
  const getNodeClassName = (node: GridNode) => {
    let className =
      "w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 border border-slate-600 cursor-pointer ";

    if (node.isStart) {
      className += "bg-green-500 ";
    } else if (node.isEnd) {
      className += "bg-red-500 ";
    } else if (node.isWall) {
      className += "bg-slate-400 ";
    } else if (node.isPath) {
      className += "bg-yellow-400 ";
    } else if (node.isVisited) {
      className += "bg-blue-400 ";
    } else {
      className += "bg-slate-200 hover:bg-slate-300 ";
    }

    return className;
  };

  return (
    <div className="flex justify-center w-full">
      <div
        className="inline-block border-2 border-slate-600 rounded-lg overflow-hidden bg-slate-800"
        onMouseLeave={onMouseUp}
      >
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((node, nodeIndex) => (
              <div
                key={`${rowIndex}-${nodeIndex}`}
                className={getNodeClassName(node)}
                onClick={() => onNodeClick(node.row, node.col)}
                onMouseDown={() => onMouseDown(node.row, node.col)}
                onMouseEnter={() => onMouseEnter(node.row, node.col)}
                onMouseUp={onMouseUp}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Grid;
