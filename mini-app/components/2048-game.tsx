"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const GRID_SIZE = 4;

function emptyBoard(): number[][] {
  const board: number[][] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    board.push(Array(GRID_SIZE).fill(0));
  }
  return board;
}

function addRandomTile(board: number[][]): number[][] {
  const empty: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  board[r][c] = value;
  return board;
}

function transpose(board: number[][]): number[][] {
  return board[0].map((_, i) => board.map(row => row[i]));
}

function reverseRows(board: number[][]): number[][] {
  return board.map(row => [...row].reverse());
}

function slideAndCombine(row: number[]): { newRow: number[]; scoreDelta: number } {
  const nonZero = row.filter(v => v !== 0);
  const newRow: number[] = [];
  let scoreDelta = 0;
  let i = 0;
  while (i < nonZero.length) {
    if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
      const merged = nonZero[i] * 2;
      newRow.push(merged);
      scoreDelta += merged;
      i += 2;
    } else {
      newRow.push(nonZero[i]);
      i += 1;
    }
  }
  while (newRow.length < GRID_SIZE) newRow.push(0);
  return { newRow, scoreDelta };
}

function move(board: number[][], dir: "up" | "down" | "left" | "right"): { board: number[][]; scoreDelta: number } {
  let rotated = board;
  if (dir === "up") rotated = transpose(board);
  if (dir === "down") rotated = reverseRows(transpose(board));
  if (dir === "right") rotated = reverseRows(board);

  let scoreDelta = 0;
  let newBoard: number[][] = [];
  for (const row of rotated) {
    const { newRow, scoreDelta: delta } = slideAndCombine(row);
    newBoard.push(newRow);
    scoreDelta += delta;
  }

  if (dir === "up") newBoard = transpose(newBoard);
  if (dir === "down") newBoard = transpose(reverseRows(newBoard));
  if (dir === "right") newBoard = reverseRows(newBoard);

  return { board: newBoard, scoreDelta };
}

export default function Game2048() {
  const [board, setBoard] = useState<number[][]>(emptyBoard());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    let b = addRandomTile(emptyBoard());
    b = addRandomTile(b);
    setBoard(b);
  }, []);

  const handleMove = (dir: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    const { board: newBoard, scoreDelta } = move(board, dir);
    if (JSON.stringify(newBoard) === JSON.stringify(board)) return; // no change
    setBoard(newBoard);
    setScore(prev => prev + scoreDelta);
    const after = addRandomTile(newBoard);
    setBoard(after);
    if (!hasMoves(after)) setGameOver(true);
  };

  const hasMoves = (b: number[][]): boolean => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (b[r][c] === 0) return true;
        if (c + 1 < GRID_SIZE && b[r][c] === b[r][c + 1]) return true;
        if (r + 1 < GRID_SIZE && b[r][c] === b[r + 1][c]) return true;
      }
    }
    return false;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {board.flat().map((val, idx) => (
          <div
            key={idx}
            className={`w-16 h-16 flex items-center justify-center rounded-md text-2xl font-bold ${
              val === 0
                ? "bg-muted"
                : val <= 4
                ? "bg-yellow-200"
                : val <= 8
                ? "bg-yellow-300"
                : val <= 16
                ? "bg-yellow-400"
                : val <= 32
                ? "bg-yellow-500"
                : val <= 64
                ? "bg-yellow-600"
                : "bg-yellow-700"
            }`}
          >
            {val !== 0 ? val : null}
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleMove("up")}>↑</Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleMove("left")}>←</Button>
          <Button variant="outline" onClick={() => handleMove("down")}>↓</Button>
          <Button variant="outline" onClick={() => handleMove("right")}>→</Button>
        </div>
      </div>
      <div className="text-xl">Score: {score}</div>
      {gameOver && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-2xl font-bold">Game Over!</div>
          <Share text={`I scored ${score} in 2048! ${url}`} />
        </div>
      )}
    </div>
  );
}
