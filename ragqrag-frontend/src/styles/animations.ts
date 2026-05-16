import { createContext, useContext } from 'react';

// Minimal, runtime-safe types for animation parameters.
// We intentionally avoid importing Anime.js types directly to prevent ESM/CJS interop issues.
export type AnimeParams = Record<string, unknown>;

type AnimationsContextValue = {
  reduceMotion: boolean;
};

const AnimationsContext = createContext<AnimationsContextValue>({ reduceMotion: false });

export const AnimationsProvider = AnimationsContext.Provider;

export const useAnimations = () => useContext(AnimationsContext);

const runAnime = async (params: AnimeParams) => {
  try {
    // Dynamic import avoids static export analysis problems
    const mod = await import('animejs');
    const animeFn = (mod as any).default ?? (mod as any);
    if (typeof animeFn === 'function') {
      animeFn(params);
    }
  } catch {
    // Fail silently if Anime.js is unavailable
  }
};

export const playAnimation = (params: AnimeParams, reduceMotion: boolean): void => {
  if (reduceMotion) return;
  void runAnime(params);
};

export const fadeInUp = (targets: AnimeParams['targets'], delayStagger = 0) => {
  return (reduceMotion: boolean) => {
    playAnimation(
      {
        targets,
        opacity: [0, 1],
        translateY: [12, 0],
        easing: 'easeOutQuad',
        duration: 350,
        delay: delayStagger,
      },
      reduceMotion,
    );
  };
};

export const pulseGlow = (targets: AnimeParams['targets']) => {
  return (reduceMotion: boolean) => {
    playAnimation(
      {
        targets,
        scale: [1, 1.04],
        boxShadow: ['0 0 0 rgba(37,99,235,0)', '0 0 24px rgba(37,99,235,0.35)'],
        direction: 'alternate',
        easing: 'easeInOutSine',
        duration: 260,
        loop: 1,
      },
      reduceMotion,
    );
  };
};

