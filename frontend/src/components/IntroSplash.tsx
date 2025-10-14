// src/components/IntroSplash.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';

type Props = {
  src?: string; // 2–3s short clip
  poster?: string;
  logoSrc?: string;
  maxShowMs?: number; // total visible time cap
  minShowMs?: number; // minimum visible time
  showOncePerSession?: boolean;
  storageKey?: string;
};

export default function IntroSplash({
  src = '/intro.mp4',
  poster = '/hero-poster.jpg',
  logoSrc = '/logo.png',
  maxShowMs = 2000, // <- show ~2 seconds
  minShowMs = 0, // <- allow finish exactly at 2s
  showOncePerSession = false,
  storageKey = 'intro:splash:shown'
}: Props) {
  const [show, setShow] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(0); // 0..100 (time-based)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const startRef = useRef<number>(Date.now());
  const hideTimerRef = useRef<number | null>(null);
  const hardCapRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const didHideRef = useRef(false);

  const reduced = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    );
  }, []);

  // Preload hints
  useEffect(() => {
    const linkV = document.createElement('link');
    linkV.rel = 'preload';
    linkV.as = 'video';
    linkV.href = src;
    linkV.type = 'video/mp4';
    document.head.appendChild(linkV);
    const linkP = document.createElement('link');
    linkP.rel = 'preload';
    linkP.as = 'image';
    linkP.href = poster;
    document.head.appendChild(linkP);
    return () => {
      try {
        document.head.removeChild(linkV);
      } catch {}
      try {
        document.head.removeChild(linkP);
      } catch {}
    };
  }, [src, poster]);

  // Show once per session
  useEffect(() => {
    if (!showOncePerSession) return;
    try {
      if (sessionStorage.getItem(storageKey)) setShow(false);
    } catch {}
  }, [showOncePerSession, storageKey]);

  // Mount fade-in
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const commitHide = useCallback(() => {
    if (didHideRef.current) return;
    didHideRef.current = true;
    setShow(false);
    if (showOncePerSession) {
      try {
        sessionStorage.setItem(storageKey, '1');
      } catch {}
    }
  }, [showOncePerSession, storageKey]);

  // Centralized hide (fast outro)
  const requestHide = useCallback(() => {
    if (didHideRef.current) return;
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    setExiting(true);
    hideTimerRef.current = window.setTimeout(() => commitHide(), 140);
  }, [commitHide]);

  // Hard cap at 2s
  useEffect(() => {
    if (!show) return;
    hardCapRef.current = window.setTimeout(() => requestHide(), maxShowMs);
    return () => {
      if (hardCapRef.current) window.clearTimeout(hardCapRef.current);
    };
  }, [show, maxShowMs, requestHide]);

  // Reduced-motion: quick brand flash (still ~2s total)
  useEffect(() => {
    if (!show || !reduced) return;
    const t = window.setTimeout(
      () => requestHide(),
      Math.min(2000, Math.max(700, minShowMs))
    );
    return () => window.clearTimeout(t);
  }, [show, reduced, minShowMs, requestHide]);

  // Early readiness only affects tiny blur on video, not duration
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const markReady = () => setReady(true);
    const onLoadedData = () => markReady();
    const onCanPlay = () => markReady();
    const onPlaying = () => markReady();
    const onTimeUpdate = () => {
      if (v.currentTime > 0.04) markReady();
    };
    const onError = () => markReady();

    v.addEventListener('loadeddata', onLoadedData);
    v.addEventListener('canplay', onCanPlay);
    v.addEventListener('playing', onPlaying);
    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('error', onError);
    if (v.currentTime > 0 || (v.readyState ?? 0) >= 2) markReady();

    return () => {
      v.removeEventListener('loadeddata', onLoadedData);
      v.removeEventListener('canplay', onCanPlay);
      v.removeEventListener('playing', onPlaying);
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('error', onError);
    };
  }, []);

  // Time-based progress to 100% in ~2s
  const animate = useCallback(() => {
    const elapsed = Date.now() - startRef.current;
    const t = Math.min(elapsed / maxShowMs, 1); // 0..1 over 2s
    const eased = 1 - Math.pow(1 - t, 2.2); // easeOut-ish
    const target = eased * 100;

    setProgress(prev => {
      // smooth approach to the target so it feels fluid
      const next = prev + (target - prev) * 0.22;
      return Math.min(100, Math.max(0, next));
    });

    if (t >= 1) return; // let hardCap timer fire the hide (ensures min time)
    rafRef.current = requestAnimationFrame(animate);
  }, [maxShowMs]);

  useEffect(() => {
    if (!show || reduced) return;
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [show, reduced, animate]);

  if (!show) return null;

  return (
    <div
      className={[
        'fixed inset-0 z-[9999] flex items-center justify-center',
        // Stronger blur + tint for glass feel
        'bg-black/30 supports-[backdrop-filter]:backdrop-blur-2xl supports-[backdrop-filter]:saturate-150',
        'text-white transition-opacity duration-300',
        mounted && !exiting ? 'opacity-100' : 'opacity-0'
      ].join(' ')}
      role='dialog'
      aria-modal='true'
      aria-label='Intro'
    >
      {/* Soft background (transparent) */}
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute inset-0 opacity-70 [mask-image:radial-gradient(60%_60%_at_50%_50%,#000,transparent_75%)]'>
          <div className='absolute inset-0 animate-noise' />
        </div>
        <div className='absolute -inset-40 blur-3xl opacity-[.22] mix-blend-screen'>
          <div className='aurora aurora-a' />
          <div className='aurora aurora-b' />
        </div>
      </div>

      {/* Skip */}
      <button
        type='button'
        onClick={requestHide}
        className={[
          'absolute right-4 top-4 rounded-full px-3 py-1 text-xs',
          'bg-white/10 hover:bg-white/15 active:bg-white/20',
          'backdrop-blur border border-white/15',
          'transition-[background-color,transform] duration-150',
          'hover:-translate-y-0.5 active:translate-y-0'
        ].join(' ')}
        aria-label='Skip intro'
      >
        Skip
      </button>

      {/* CONTENT (frameless) */}
      {!reduced ? (
        <div
          className={[
            'relative w-[min(92vw,1120px)] overflow-hidden rounded-3xl',
            'transition-transform duration-300',
            mounted && !exiting ? 'scale-100' : 'scale-[0.985]'
          ].join(' ')}
        >
          <div className='relative aspect-video bg-black/60'>
            {/* brand tint */}
            <div
              className='pointer-events-none absolute inset-0'
              style={{
                background:
                  'radial-gradient(120% 120% at 50% 50%, rgba(158,85,247,0.16), rgba(68,122,238,0.1) 40%, rgba(19,185,163,0.08) 65%, transparent 78%)',
                mixBlendMode: 'screen'
              }}
            />

            <video
              ref={videoRef}
              className={[
                'h-full w-full object-cover transition-[filter,transform] duration-400',
                ready ? 'blur-0 scale-100' : 'blur-[1.5px] scale-[1.01]'
              ].join(' ')}
              autoPlay
              muted
              playsInline
              poster={poster}
              preload='auto'
            >
              <source src={src} type='video/mp4' />
            </video>

            {/* Brand mark (no % label) */}
            <div className='pointer-events-none absolute inset-0 grid place-items-center'>
              <div className='relative flex flex-col items-center'>
                <div className='relative'>
                  <div
                    className='absolute -inset-6 rounded-full opacity-50 blur-xl'
                    style={{
                      background:
                        'radial-gradient(circle at 50% 50%, rgba(255,255,255,.28), rgba(255,255,255,0) 60%)'
                    }}
                  />
                  <Image
                    src={logoSrc}
                    alt='Streakling'
                    width={184}
                    height={184}
                    className={[
                      'h-44 w-auto sm:h-48',
                      'drop-shadow-[0_12px_38px_rgba(255,255,255,0.28)]',
                      'transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
                      mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
                      'mask-sweep'
                    ].join(' ')}
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Bottom progress beam (time-based) */}
            <div className='absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden rounded-b-3xl'>
              <div
                className='h-full will-change-transform'
                style={{
                  width: `${Math.max(0, Math.min(100, progress))}%`,
                  transition: 'width 120ms linear',
                  background:
                    'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 35%, rgba(255,255,255,0.9) 60%, rgba(255,255,255,0) 100%)'
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        // Reduced-motion fallback
        <div className='flex flex-col items-center'>
          <div className='relative'>
            <div
              className='absolute -inset-6 rounded-full opacity-60'
              style={{
                background:
                  'radial-gradient(circle, rgba(255,255,255,.28), rgba(255,255,255,0) 60%)',
                filter: 'blur(8px)'
              }}
            />
            <Image
              src={logoSrc}
              alt='Streakling'
              width={192}
              height={192}
              className='relative h-48 w-auto'
              priority
            />
          </div>
          <span className='mt-3 text-base tracking-wide text-white/90'>
            Streakling
          </span>
        </div>
      )}

      {/* Scoped keyframes */}
      <style jsx>{`
        @keyframes noiseMove {
          0% {
            transform: translate3d(0, 0, 0) scale(1.2);
            opacity: 0.04;
          }
          50% {
            transform: translate3d(10px, -6px, 0) scale(1.25);
            opacity: 0.07;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1.2);
            opacity: 0.04;
          }
        }
        .animate-noise {
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.9'/></svg>");
          background-size: 300px 300px;
          animation: noiseMove 6s ease-in-out infinite;
        }

        @keyframes auroraA {
          0% {
            transform: translateY(0) rotate(0deg) scale(1.05);
            opacity: 0.45;
          }
          50% {
            transform: translateY(-8%) rotate(8deg) scale(1.08);
            opacity: 0.7;
          }
          100% {
            transform: translateY(0) rotate(0deg) scale(1.05);
            opacity: 0.45;
          }
        }
        @keyframes auroraB {
          0% {
            transform: translateY(0) rotate(0deg) scale(1.05);
            opacity: 0.35;
          }
          50% {
            transform: translateY(6%) rotate(-10deg) scale(1.07);
            opacity: 0.6;
          }
          100% {
            transform: translateY(0) rotate(0deg) scale(1.05);
            opacity: 0.35;
          }
        }
        .aurora {
          position: absolute;
          inset: -20%;
          filter: blur(90px);
          background: radial-gradient(
            55% 60% at 50% 50%,
            rgba(158, 85, 247, 0.55) 0%,
            rgba(68, 122, 238, 0.48) 40%,
            rgba(19, 185, 163, 0.42) 70%,
            transparent 85%
          );
          mix-blend-mode: screen;
        }
        .aurora-a {
          animation: auroraA 10s ease-in-out infinite;
        }
        .aurora-b {
          animation: auroraB 12s ease-in-out infinite;
        }

        @keyframes sweep {
          0% {
            -webkit-mask-position: -200% 0;
            mask-position: -200% 0;
          }
          100% {
            -webkit-mask-position: 200% 0;
            mask-position: 200% 0;
          }
        }
        .mask-sweep {
          -webkit-mask-image: linear-gradient(
            120deg,
            transparent 30%,
            #000 50%,
            transparent 70%
          );
          mask-image: linear-gradient(
            120deg,
            transparent 30%,
            #000 50%,
            transparent 70%
          );
          -webkit-mask-size: 200% 100%;
          mask-size: 200% 100%;
          animation: sweep 0.9s ease-out 0.08s both;
        }
      `}</style>
    </div>
  );
}
