import confetti from 'canvas-confetti';

export function fireHeartConfetti() {
  const count = 40;
  const defaults = {
    origin: { y: 0.7 },
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ['#f43f5e', '#fb7185', '#fda4af'],
  });
  fire(0.2, {
    spread: 60,
    colors: ['#fda4af', '#f43f5e', '#ec4899', '#fbcfe8'],
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ['#f43f5e', '#e11d48', '#be123c', '#fb7185'],
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors: ['#ffe4e6', '#fecdd3', '#fda4af'],
  });
}
