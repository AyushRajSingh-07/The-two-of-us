import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw, Palette, Eraser, Check, Sparkles, Send, Trophy, Heart } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { DataStore } from '../../../lib/store';
import { fireHeartConfetti } from '../../common/Confetti';
import { SessionInviteBar } from '../../common/SessionInviteBar';

interface DrawLine {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  size: number;
}

interface DrawGameState {
  drawerUserId: string;
  secretWord: string;
  lines: DrawLine[];
  isGuessed: boolean;
  winnerName?: string;
}

const WORDS = [
  'Sunset',
  'Coffee',
  'Holding Hands',
  'Ferris Wheel',
  'Picnic',
  'Puppy',
  'Star Gazing',
  'Campfire',
  'Heart Balloon',
  'Bicycle',
];

const COLORS = ['#e11d48', '#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#1c1917'];

export const DrawAndGuessGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { currentUser, partner, couple, isPartner1Active } = useAuth();
  const sessionId = `${couple?.id || 'default'}_draw_guess`;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(4);
  const [guessInput, setGuessInput] = useState('');
  const [guessHistory, setGuessHistory] = useState<string[]>([]);

  const [gameState, setGameState] = useState<DrawGameState>({
    drawerUserId: 'partner-1',
    secretWord: 'Sunset',
    lines: [],
    isGuessed: false,
  });

  const isDrawer = gameState.drawerUserId === currentUser.id;

  // Load and subscribe
  useEffect(() => {
    DataStore.getGameSession<DrawGameState>(sessionId).then((s) => {
      if (s?.data) {
        setGameState(s.data);
        redrawAllLines(s.data.lines);
      }
    });

    const unsub = DataStore.onSync((e) => {
      if (e.type === 'GAME_UPDATED' && e.payload?.gameId === 'draw_guess') {
        const newData = e.payload.data as DrawGameState;
        setGameState(newData);
        redrawAllLines(newData.lines);
      }
    });
    return unsub;
  }, [sessionId]);

  const redrawAllLines = (lines: DrawLine[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.forEach((line) => {
      ctx.beginPath();
      ctx.moveTo(line.startX, line.startY);
      ctx.lineTo(line.endX, line.endY);
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.size;
      ctx.lineCap = 'round';
      ctx.stroke();
    });
  };

  const updateState = (newState: DrawGameState) => {
    setGameState(newState);
    redrawAllLines(newState.lines);
    DataStore.updateGameSession({
      sessionId,
      gameId: 'draw_guess',
      status: newState.isGuessed ? 'completed' : 'in_progress',
      data: newState,
      lastUpdatedBy: currentUser.id,
      updatedAt: new Date().toISOString(),
    });
  };

  // Drawing handlers (Mouse & Touch)
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const getTouchCoordinates = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !e.touches[0]) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawer || gameState.isGuessed) return;
    isDrawingRef.current = true;
    lastPosRef.current = getCoordinates(e);
  };

  const startTouchDrawing = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawer || gameState.isGuessed) return;
    isDrawingRef.current = true;
    lastPosRef.current = getTouchCoordinates(e);
  };

  const drawWithPoint = (curPos: { x: number; y: number }) => {
    if (!isDrawingRef.current || !lastPosRef.current || !isDrawer || gameState.isGuessed) return;

    const newLine: DrawLine = {
      startX: lastPosRef.current.x,
      startY: lastPosRef.current.y,
      endX: curPos.x,
      endY: curPos.y,
      color,
      size: brushSize,
    };

    lastPosRef.current = curPos;

    // Draw locally immediately
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(newLine.startX, newLine.startY);
        ctx.lineTo(newLine.endX, newLine.endY);
        ctx.strokeStyle = newLine.color;
        ctx.lineWidth = newLine.size;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }

    // Append to state
    updateState({
      ...gameState,
      lines: [...gameState.lines, newLine],
    });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    drawWithPoint(getCoordinates(e));
  };

  const touchDraw = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Prevent scrolling page while drawing on mobile
    if (e.cancelable) e.preventDefault();
    drawWithPoint(getTouchCoordinates(e));
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  };

  const handleClear = () => {
    if (!isDrawer) return;
    updateState({ ...gameState, lines: [] });
  };

  const handleSwitchRoles = () => {
    const nextDrawerId = isDrawer ? partner.id : currentUser.id;
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    updateState({
      drawerUserId: nextDrawerId,
      secretWord: randomWord,
      lines: [],
      isGuessed: false,
    });
    setGuessHistory([]);
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim() || gameState.isGuessed) return;

    const g = guessInput.trim().toLowerCase();
    const correct = g === gameState.secretWord.toLowerCase();

    setGuessHistory((prev) => [`${currentUser.name}: ${guessInput.trim()}`, ...prev]);
    setGuessInput('');

    if (correct) {
      fireHeartConfetti();
      updateState({
        ...gameState,
        isGuessed: true,
        winnerName: currentUser.name,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 md:p-8 border border-rose-100 shadow-xl animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-rose-100 mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-warmgray-500 hover:text-rose-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Games
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
            {isDrawer ? '🎨 You: Drawing' : `👀 ${partner.name}: Drawing`}
          </span>
          <button
            onClick={handleSwitchRoles}
            className="flex items-center gap-1 text-xs text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Switch Roles
          </button>
        </div>
      </div>

      {/* Cross-Device Session Sync & Invite Bar */}
      <SessionInviteBar sessionId={sessionId} gameTitle="Draw and Guess" />

      <div className="text-center mb-4">
        <h2 className="text-2xl font-serif font-bold text-warmgray-900">Draw and Guess</h2>
        {isDrawer ? (
          <p className="text-xs text-rose-600 font-semibold mt-1">
            Your Secret Word to Draw: <strong className="text-sm underline">{gameState.secretWord}</strong> (Don't tell {partner.name}!)
          </p>
        ) : (
          <p className="text-xs text-warmgray-500 mt-1">
            Watch the drawing appear in real time and guess the word below!
          </p>
        )}
      </div>

      {gameState.isGuessed && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-center animate-bounce">
          <h3 className="font-serif font-bold text-base text-emerald-900 flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-600" />
            Correct Guess! Word was "{gameState.secretWord}" 💕
          </h3>
          <p className="text-xs text-emerald-700 mt-0.5">
            Guessed by {gameState.winnerName}! Click "Switch Roles" to play another round.
          </p>
        </div>
      )}

      {/* Main Game Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas Area */}
        <div className="lg:col-span-2 space-y-3">
          <div className="border-2 border-rose-200 rounded-3xl overflow-hidden shadow-inner bg-white">
            <canvas
              ref={canvasRef}
              width={500}
              height={350}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startTouchDrawing}
              onTouchMove={touchDraw}
              onTouchEnd={stopDrawing}
              className={`w-full aspect-5/3.5 touch-none select-none ${isDrawer ? 'cursor-crosshair' : 'cursor-default'}`}
            />
          </div>

          {/* Palette Controls (for Drawer) */}
          {isDrawer && (
            <div className="flex items-center justify-between gap-2 p-2 bg-champagne-50/70 border border-champagne-200 rounded-2xl">
              <div className="flex items-center gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      color === c ? 'scale-125 ring-2 ring-rose-400' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={2}
                  max={12}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-16 accent-rose-500"
                />
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg shadow-2xs"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Guesses Panel */}
        <div className="flex flex-col h-[350px] bg-champagne-50/40 rounded-3xl border border-rose-100 p-4">
          <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-warmgray-700 mb-2">
            Guess Feed
          </h3>

          <div className="flex-1 overflow-y-auto space-y-1.5 text-xs pr-1">
            {guessHistory.length === 0 ? (
              <p className="text-warmgray-400 text-center py-12">No guesses yet! Type what you think it is below.</p>
            ) : (
              guessHistory.map((g, i) => (
                <div key={i} className="p-2 bg-white rounded-xl border border-warmgray-100 shadow-2xs">
                  {g}
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleGuessSubmit} className="mt-3 flex gap-2">
            <input
              type="text"
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              disabled={isDrawer || gameState.isGuessed}
              placeholder={isDrawer ? 'You are drawing!' : 'Type your guess...'}
              className="flex-1 px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            <button
              type="submit"
              disabled={isDrawer || !guessInput.trim() || gameState.isGuessed}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Guess
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
