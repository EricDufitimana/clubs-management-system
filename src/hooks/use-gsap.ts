'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// ----------------------------------------------------------------------

let scrollTriggerRegistered = false;

function ensureScrollTrigger() {
  if (typeof window === 'undefined') return;
  if (!scrollTriggerRegistered) {
    gsap.registerPlugin(ScrollTrigger);
    scrollTriggerRegistered = true;
  }
}

// Simple fade-up on mount
export function useGsapFadeUp(ref: React.RefObject<HTMLElement | null>, options?: { delay?: number }): void {
  useEffect(() => {
    if (!ref.current) return undefined;
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        opacity: 0,
        y: 30,
        delay: options?.delay ?? 0,
        duration: 0.8,
        ease: 'power3.out',
      });
    }, ref);

    return () => ctx.revert();
  }, [ref, options?.delay]);
}

// Float animation (e.g., for hero image)
export function useGsapFloatY(
  ref: React.RefObject<HTMLElement | null>,
  options?: { amplitude?: number; duration?: number }
): void {
  useEffect(() => {
    if (!ref.current) return undefined;

    const ctx = gsap.context(() => {
      gsap.to(ref.current, {
        y: -(options?.amplitude ?? 10),
        duration: options?.duration ?? 3,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    }, ref);

    return () => ctx.revert();
  }, [ref, options?.amplitude, options?.duration]);
}

// Stagger children on scroll
export function useGsapStaggerChildrenOnScroll(
  containerRef: React.RefObject<HTMLElement | null>,
  opts?: {
    fromY?: number;
    fromOpacity?: number;
    stagger?: number;
    start?: string;
  }
): void {
  useEffect(() => {
    ensureScrollTrigger();
    if (!containerRef.current) return undefined;

    const ctx = gsap.context(() => {
      const el = containerRef.current!;
      const children = Array.from(el.children);

      gsap.from(children, {
        opacity: opts?.fromOpacity ?? 0,
        y: opts?.fromY ?? 24,
        duration: 0.7,
        stagger: opts?.stagger ?? 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: opts?.start ?? 'top 80%',
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [containerRef, opts?.fromOpacity, opts?.fromY, opts?.stagger, opts?.start]);
}


