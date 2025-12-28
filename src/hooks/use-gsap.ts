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
    scroller?: HTMLElement | (() => HTMLElement | null);
  }
): void {
  useEffect(() => {
    ensureScrollTrigger();
    if (!containerRef.current) return undefined;

    // Get the scroller element
    let scrollerElement: HTMLElement | null = null;
    if (opts?.scroller) {
      if (typeof opts.scroller === 'function') {
        scrollerElement = opts.scroller();
      } else {
        scrollerElement = opts.scroller;
      }
    }

    const ctx = gsap.context(() => {
      const el = containerRef.current!;
      const children = Array.from(el.children);

      const animation = gsap.from(children, {
        opacity: opts?.fromOpacity ?? 0,
        y: opts?.fromY ?? 24,
        duration: 0.7,
        stagger: opts?.stagger ?? 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: opts?.start ?? 'top 80%',
          scroller: scrollerElement || undefined,
        },
      });

      // Check if element is already in view and trigger animation immediately
      ScrollTrigger.refresh();
      const viewportHeight = scrollerElement ? scrollerElement.clientHeight : window.innerHeight;
      const rect = el.getBoundingClientRect();
      const scrollerRect = scrollerElement ? scrollerElement.getBoundingClientRect() : null;
      
      // Calculate position relative to scroller or window
      const elementTop = scrollerRect ? rect.top - scrollerRect.top : rect.top;
      const elementBottom = elementTop + rect.height;
      
      // If element is already in viewport, play animation immediately
      if (elementTop < viewportHeight && elementBottom > 0) {
        setTimeout(() => {
          animation.play();
        }, 100);
      }
    }, containerRef);

    return () => ctx.revert();
  }, [containerRef, opts?.fromOpacity, opts?.fromY, opts?.stagger, opts?.start, opts?.scroller]);
}


