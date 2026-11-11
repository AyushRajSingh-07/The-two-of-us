import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Droplets, Sun, Heart, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { DataStore } from '../../../lib/store';
import { fireHeartConfetti } from '../../common/Confetti';
import { SessionInviteBar } from '../../common/SessionInviteBar';

interface PlantPlot {
  id: number;
  plantType: 'Rose' | 'Sunflower' | 'Lavender' | 'Strawberry' | 'Tulip' | 'Bonsai' | null;
  stage: number; // 0: empty, 1: seed, 2: sprout, 3: blooming!
  waterLevel: number;
  plantedBy?: string;
}

interface GardenState {
  plots: PlantPlot[];
  totalBlooms: number;
}

const DEFAULT_GARDEN: GardenState = {
  plots: [
    { id: 0, plantType: 'Rose', stage: 3, waterLevel: 80, plantedBy: 'Alex' },
    { id: 1, plantType: 'Strawberry', stage: 2, waterLevel: 60, plantedBy: 'Jordan' },
    { id: 2, plantType: 'Lavender', stage: 3, waterLevel: 90, plantedBy: 'Alex' },
    { id: 3, plantType: 'Sunflower', stage: 1, waterLevel: 40, plantedBy: 'Jordan' },
    { id: 4, plantType: null, stage: 0, waterLevel: 0 },
    { id: 5, plantType: null, stage: 0, waterLevel: 0 },
  ],
  totalBlooms: 2,
};

const SEED_TYPES: { type: PlantPlot['plantType']; name: string; icon: string }[] = [
  { type: 'Rose', name: 'Velvet Rose', icon: '🌹' },
  { type: 'Sunflower', name: 'Sunny Bloom', icon: '🌻' },
  { type: 'Lavender', name: 'Sweet Lavender', icon: '🪻' },
  { type: 'Strawberry', name: 'Juicy Strawberry', icon: '🍓' },
  { type: 'Tulip', name: 'Blush Tulip', icon: '🌷' },
  { type: 'Bonsai', name: 'Peaceful Bonsai', icon: '🪴' },
];

export const GardenGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { currentUser, couple } = useAuth();
  const sessionId = `${couple?.id || 'default'}_shared_garden`;

  const [garden, setGarden] = useState<GardenState>(DEFAULT_GARDEN);
  const [selectedPlotId, setSelectedPlotId] = useState<number | null>(null);

  useEffect(() => {
    DataStore.getGameSession<GardenState>(sessionId).then((s) => {
      if (s?.data) setGarden(s.data);
    });

    const unsub = DataStore.onSync((e) => {
      if (e.type === 'GAME_UPDATED' && e.payload?.gameId === 'shared_garden') {
        setGarden(e.payload.data);
      }
    });
    return unsub;
  }, [sessionId]);

  const updateGarden = (newGarden: GardenState) => {
    setGarden(newGarden);
    DataStore.updateGameSession({
      sessionId,
      gameId: 'shared_garden',
      status: 'in_progress',
      data: newGarden,
      lastUpdatedBy: currentUser.id,
      updatedAt: new Date().toISOString(),
    });
  };

  const handlePlant = (plotId: number, seedType: PlantPlot['plantType']) => {
    const updated = { ...garden };
    updated.plots = updated.plots.map((p) =>
      p.id === plotId
        ? { id: plotId, plantType: seedType, stage: 1, waterLevel: 50, plantedBy: currentUser.name }
        : p
    );
    updateGarden(updated);
    setSelectedPlotId(null);
    fireHeartConfetti();
  };

  const handleWater = (plotId: number) => {
    const updated = { ...garden };
    updated.plots = updated.plots.map((p) => {
      if (p.id !== plotId || !p.plantType) return p;
      const nextStage = p.stage < 3 ? p.stage + 1 : 3;
      if (nextStage === 3 && p.stage < 3) {
        fireHeartConfetti();
        updated.totalBlooms += 1;
      }
      return {
        ...p,
        stage: nextStage,
        waterLevel: 100,
      };
    });
    updateGarden(updated);
  };

  const renderPlantVisual = (plot: PlantPlot) => {
    if (!plot.plantType || plot.stage === 0) {
      return (
        <div className="flex flex-col items-center text-warmgray-400">
          <span className="text-2xl mb-1 opacity-50">🌱</span>
          <span className="text-[10px] font-semibold">Empty Soil</span>
        </div>
      );
    }

    if (plot.stage === 1) {
      return (
        <div className="flex flex-col items-center">
          <span className="text-2xl mb-1">🌰</span>
          <span className="text-[10px] font-medium text-emerald-800">Seed Sprouting</span>
        </div>
      );
    }

    if (plot.stage === 2) {
      return (
        <div className="flex flex-col items-center">
          <span className="text-3xl mb-1 animate-pulse">🌿</span>
          <span className="text-[10px] font-medium text-emerald-800">Growing Sprout</span>
        </div>
      );
    }

    // Blooming!
    const seedInfo = SEED_TYPES.find((s) => s.type === plot.plantType);
    return (
      <div className="flex flex-col items-center transform hover:scale-115 transition">
        <span className="text-4xl mb-1 drop-shadow-md">{seedInfo?.icon || '🌸'}</span>
        <span className="text-[10px] font-bold text-rose-800">{seedInfo?.name}</span>
      </div>
    );
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

        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Our Blooming Flowers: {garden.plots.filter((p) => p.stage === 3).length}</span>
        </span>
      </div>

      {/* Cross-Device Session Sync & Invite Bar */}
      <SessionInviteBar sessionId={sessionId} gameTitle="Little Shared Garden" />

      <div className="text-center mb-6">
        <h2 className="text-2xl font-serif font-bold text-warmgray-900">Little Shared Garden</h2>
        <p className="text-xs text-warmgray-500 mt-1 max-w-md mx-auto">
          Plant seeds, water them together, and watch our private garden bloom and grow in real time!
        </p>
      </div>

      {/* Garden Plots Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {garden.plots.map((plot) => (
          <div
            key={plot.id}
            onClick={() => {
              if (!plot.plantType) {
                setSelectedPlotId(plot.id);
              } else {
                handleWater(plot.id);
              }
            }}
            className="group relative p-6 rounded-3xl bg-gradient-to-b from-champagne-50 to-[#f4eedf] border-2 border-champagne-300 hover:border-emerald-400 cursor-pointer shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-between min-h-[160px]"
          >
            {/* Top plot label */}
            <div className="w-full flex justify-between items-center text-[10px] text-warmgray-500">
              <span className="font-semibold">Plot #{plot.id + 1}</span>
              {plot.plantedBy && <span>by {plot.plantedBy}</span>}
            </div>

            {/* Visual plant */}
            <div className="py-2">{renderPlantVisual(plot)}</div>

            {/* Bottom action pill */}
            <div className="w-full flex justify-center mt-2">
              {!plot.plantType ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-white/80 px-2.5 py-1 rounded-full border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white transition">
                  + Plant Seed
                </span>
              ) : plot.stage < 3 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWater(plot.id);
                  }}
                  className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white px-2.5 py-1 rounded-full border border-blue-200 transition"
                >
                  <Droplets className="w-3 h-3" /> Water Me!
                </button>
              ) : (
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  Fully Bloomed! 💖
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Seed Picker Modal if plot selected */}
      {selectedPlotId !== null && (
        <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-3xl animate-scale-up text-center">
          <h4 className="font-serif font-bold text-sm text-emerald-950 mb-3">
            Choose What to Plant in Plot #{selectedPlotId + 1}:
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {SEED_TYPES.map((s) => (
              <button
                key={s.type}
                onClick={() => handlePlant(selectedPlotId, s.type)}
                className="p-3 bg-white hover:bg-emerald-100 border border-emerald-200 rounded-2xl flex flex-col items-center gap-1 transition transform hover:scale-105 shadow-2xs"
              >
                <span className="text-3xl">{s.icon}</span>
                <span className="text-[11px] font-semibold text-warmgray-800">{s.name}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setSelectedPlotId(null)}
            className="mt-3 text-xs text-warmgray-500 hover:text-warmgray-700 underline"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
