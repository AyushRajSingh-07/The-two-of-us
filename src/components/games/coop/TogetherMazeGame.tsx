import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowUp, ArrowDown, ArrowLeft as LeftIcon, ArrowRight, RotateCcw, Heart, Users, Sparkles, Trophy } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { DataStore } from '../../../lib/store';
import { fireHeartConfetti } from '../../common/Confetti';
import { SessionInviteBar } from '../../common/SessionInviteBar';

// 8x8 Maze Grid
// 0: empty path, 1: wall, 2: plate A (lowers door A), 3: door A (open when plate A pressed), 4: plate B, 5: door B, 6: shared goal
const MAZE_GRID = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 1, 0, 0, 0, 1],
  [1, 2, 1, 1, 0, 1, 4, 1],
  [1, 0, 3, 0, 0, 5, 0, 1],
  [1, 1, 1, 0, 6, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
];

interface MazeState {
  p1Pos: [number, number]; // [row, col]
  p2Pos: [number, number];
  doorAOpen: boolean;
  doorBOpen: boolean;
  isWon: boolean;
}

const INITIAL_STATE: MazeState = {
  p1Pos: [1, 1],
  p2Pos: [1, 6],
  doorAOpen: false,
  doorBOpen: false,
  isWon: false,
};

export const TogetherMazeGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { currentUser, partner, couple, isPartner1Active } = useAuth();
  const sessionId = `${couple?.id || 'default'}_together_maze`;

  const [gameState, setGameState] = useState<MazeState>(INITIAL_STATE);

  // Load session state
  useEffect(() => {
    DataStore.getGameSession<MazeState>(sessionId).then((sess) => {
      if (sess?.data) setGameState(sess.data);
    });

    const unsub = DataStore.onSync((e) => {
      if (e.type === 'GAME_UPDATED' && e.payload?.gameId === 'together_maze') {
        setGameState(e.payload.data);
      }
    });
    return unsub;
  }, [sessionId]);

  const updateState = (newState: MazeState) => {
    setGameState(newState);
    DataStore.updateGameSession({
      sessionId,
      gameId: 'together_maze',
      status: newState.isWon ? 'completed' : 'in_progress',
      data: newState,
      lastUpdatedBy: currentUser.id,
      updatedAt: new Date().toISOString(),
    });
  };

  const movePlayer = (dRow: number, dCol: number) => {
    if (gameState.isWon) return;

    const isP1 = isPartner1Active;
    const curPos = isP1 ? gameState.p1Pos : gameState.p2Pos;
    const nRow = curPos[0] + dRow;
    const nCol = curPos[1] + dCol;

    // Check bounds & wall
    if (nRow < 0 || nRow >= 8 || nCol < 0 || nCol >= 8) return;
    const cell = MAZE_GRID[nRow][nCol];
    if (cell === 1) return; // Wall

    // Check Doors
    if (cell === 3 && !gameState.doorAOpen) return; // Door A locked
    if (cell === 5 && !gameState.doorBOpen) return; // Door B locked

    const newP1 = isP1 ? [nRow, nCol] as [number, number] : gameState.p1Pos;
    const newP2 = !isP1 ? [nRow, nCol] as [number, number] : gameState.p2Pos;

    // Check pressure plates
    const p1OnPlateA = MAZE_GRID[newP1[0]][newP1[1]] === 2 || MAZE_GRID[newP2[0]][newP2[1]] === 2;
    const p2OnPlateB = MAZE_GRID[newP1[0]][newP1[1]] === 4 || MAZE_GRID[newP2[0]][newP2[1]] === 4;

    // Check win condition: both reach [4, 4] goal or adjacent
    const win =
      (newP1[0] === 4 && newP1[1] === 4) ||
      (newP2[0] === 4 && newP2[1] === 4) ||
      (Math.abs(newP1[0] - newP2[0]) <= 1 && Math.abs(newP1[1] - newP2[1]) <= 1 && (newP1[0] === 4 || newP2[0] === 4));

    if (win && !gameState.isWon) {
      fireHeartConfetti();
    }

    // Trigger soft haptic feedback on phones
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }

    updateState({
      p1Pos: newP1,
      p2Pos: newP2,
      doorAOpen: p1OnPlateA,
      doorBOpen: p2OnPlateB,
      isWon: win,
    });
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) movePlayer(-1, 0);
      if (['ArrowDown', 'KeyS'].includes(e.code)) movePlayer(1, 0);
      if (['ArrowLeft', 'KeyA'].includes(e.code)) movePlayer(0, -1);
      if (['ArrowRight', 'KeyD'].includes(e.code)) movePlayer(0, 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleRestart = () => {
    updateState(INITIAL_STATE);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 md:p-8 border border-rose-100 shadow-xl animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-rose-100 mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-warmgray-500 hover:text-rose-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Games
        </button>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
            <Users className="w-3.5 h-3.5" />
            <span>Role: {isPartner1Active ? `${couple?.partner1Name} 💖` : `${couple?.partner2Name} ⭐`}</span>
          </span>
          <button
            onClick={handleRestart}
            className="p-1.5 text-warmgray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
            title="Reset Maze"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cross-Device Session Sync & Invite Bar */}
      <SessionInviteBar sessionId={sessionId} gameTitle="Together Maze" />

      <div className="text-center mb-5">
        <h2 className="text-2xl font-serif font-bold text-warmgray-900">Together Maze</h2>
        <p className="text-xs text-warmgray-500 mt-1 max-w-md mx-auto">
          Coordinate with your partner! Stand on the pressure plates (🔘 A & B) to unlock each other's doors (🚪) and meet at the center heart!
        </p>
      </div>

      {gameState.isWon ? (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-warmgray-900">Reunited at the Center! 💕</h2>
          <p className="text-sm text-warmgray-600 max-w-md mx-auto">
            You two cracked the cooperative maze together by helping each other through every obstacle.
          </p>
          <div className="pt-2">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
            >
              Play Maze Again
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          {/* Maze Grid */}
          <div className="grid grid-cols-8 gap-1.5 p-3 bg-champagne-100/60 rounded-3xl border-2 border-champagne-300 shadow-inner select-none">
            {MAZE_GRID.map((row, rIdx) =>
              row.map((cell, cIdx) => {
                const isP1Here = gameState.p1Pos[0] === rIdx && gameState.p1Pos[1] === cIdx;
                const isP2Here = gameState.p2Pos[0] === rIdx && gameState.p2Pos[1] === cIdx;

                let cellBg = 'bg-white';
                let cellContent = null;

                if (cell === 1) {
                  cellBg = 'bg-rose-950/20 rounded-lg'; // Wall
                } else if (cell === 2) {
                  cellBg = 'bg-amber-100 border border-amber-300 rounded-lg';
                  cellContent = <span className="text-[10px] font-bold text-amber-800">🔘A</span>;
                } else if (cell === 3) {
                  cellBg = gameState.doorAOpen ? 'bg-emerald-100 border border-emerald-300 rounded-lg' : 'bg-rose-200 border border-rose-400 rounded-lg';
                  cellContent = <span className="text-xs">{gameState.doorAOpen ? '🔓' : '🚪A'}</span>;
                } else if (cell === 4) {
                  cellBg = 'bg-purple-100 border border-purple-300 rounded-lg';
                  cellContent = <span className="text-[10px] font-bold text-purple-800">🔘B</span>;
                } else if (cell === 5) {
                  cellBg = gameState.doorBOpen ? 'bg-emerald-100 border border-emerald-300 rounded-lg' : 'bg-rose-200 border border-rose-400 rounded-lg';
                  cellContent = <span className="text-xs">{gameState.doorBOpen ? '🔓' : '🚪B'}</span>;
                } else if (cell === 6) {
                  cellBg = 'bg-rose-100 border-2 border-dashed border-rose-400 rounded-xl animate-pulse';
                  cellContent = <Heart className="w-5 h-5 text-rose-600 fill-rose-500" />;
                }

                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center relative font-medium transition-colors ${cellBg}`}
                  >
                    {cellContent}
                    {isP1Here && (
                      <span className="absolute z-20 text-lg sm:text-xl transform hover:scale-125 transition drop-shadow" title={couple?.partner1Name}>
                        💖
                      </span>
                    )}
                    {isP2Here && (
                      <span className="absolute z-20 text-lg sm:text-xl transform hover:scale-125 transition drop-shadow" title={couple?.partner2Name}>
                        ⭐
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Directional Pad Controls */}
          <div className="flex flex-col items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => movePlayer(-1, 0)}
              className="w-14 h-14 bg-white active:bg-rose-100 border-2 border-rose-200 rounded-2xl shadow-sm text-warmgray-800 active:scale-90 transition flex items-center justify-center touch-manipulation"
              title="Up (W / ArrowUp)"
            >
              <ArrowUp className="w-6 h-6 text-rose-600" />
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => movePlayer(0, -1)}
                className="w-14 h-14 bg-white active:bg-rose-100 border-2 border-rose-200 rounded-2xl shadow-sm text-warmgray-800 active:scale-90 transition flex items-center justify-center touch-manipulation"
                title="Left (A / ArrowLeft)"
              >
                <LeftIcon className="w-6 h-6 text-rose-600" />
              </button>
              <button
                type="button"
                onClick={() => movePlayer(1, 0)}
                className="w-14 h-14 bg-white active:bg-rose-100 border-2 border-rose-200 rounded-2xl shadow-sm text-warmgray-800 active:scale-90 transition flex items-center justify-center touch-manipulation"
                title="Down (S / ArrowDown)"
              >
                <ArrowDown className="w-6 h-6 text-rose-600" />
              </button>
              <button
                type="button"
                onClick={() => movePlayer(0, 1)}
                className="w-14 h-14 bg-white active:bg-rose-100 border-2 border-rose-200 rounded-2xl shadow-sm text-warmgray-800 active:scale-90 transition flex items-center justify-center touch-manipulation"
                title="Right (D / ArrowRight)"
              >
                <ArrowRight className="w-6 h-6 text-rose-600" />
              </button>
            </div>
            <span className="text-[11px] text-warmgray-500 font-medium mt-1">Tap buttons on phone or use WASD / Arrows on PC</span>
          </div>
        </div>
      )}
    </div>
  );
};
