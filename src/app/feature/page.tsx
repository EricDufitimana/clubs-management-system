'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import { DashboardLayout } from '@/layouts/dashboard';
import { DashboardContent } from '@/layouts/dashboard';
import { ThemeProvider } from '@/theme/theme-provider';
import { Iconify } from '@/components/iconify';
import { AnalyticsWidgetSummary } from '@/sections/overview/analytics-widget-summary';
import { AnalyticsCurrentVisits } from '@/sections/overview/analytics-current-visits';
import { AnalyticsWebsiteVisits } from '@/sections/overview/analytics-website-visits';

// ── constants ──────────────────────────────────────────────────────────────────
const GREEN = '#00ff41';
const RED = '#ff003c';
const BG = '#050505';

const TERMINAL_LINES = [
  { text: '> UNAUTHORIZED ACCESS DETECTED...', delay: 60, pause: 600 },
  { text: '> TRACING SOURCE...', delay: 55, pause: 400 },
  { text: '> SOURCE: UNKNOWN', delay: 50, color: 'red', pause: 300 },
  { text: '', pause: 300 },
  { text: '> INITIATING COUNTERMEASURES...', delay: 50, pause: 300 },
  { text: '> COUNTERMEASURES: FAILED', delay: 40, color: 'red', pause: 500 },
  { text: '', pause: 200 },
  { text: '> WARNING: SYSTEM INTEGRITY COMPROMISED', delay: 35, color: 'red', pause: 600 },
  { text: '', pause: 200 },
  { text: '> INTRUDER OVERRIDING PORTAL CONTROLS...', delay: 45, pause: 400 },
  { text: '> BYPASSING ASYV AUTHENTICATION LAYER...', delay: 40, pause: 300 },
  { text: '> ACCESS GRANTED.', delay: 35, color: 'white', pause: 900 },
  { text: '', pause: 300 },
  { text: '> SCANNING FOR PAYLOAD...', delay: 50, pause: 400 },
  { text: '> PAYLOAD FOUND.', delay: 40, pause: 300 },
  { text: '> PAYLOAD TYPE: CRITICAL BROADCAST MESSAGE', delay: 30, color: 'white', pause: 500 },
  { text: '> TARGET AUDIENCE: ALL ASYV STUDENTS', delay: 30, pause: 300 },
  { text: '> PRIORITY LEVEL: MAXIMUM', delay: 30, color: 'red', pause: 700 },
  { text: '', pause: 300 },
  { text: '> DECRYPTING MESSAGE...', delay: 40, pause: 200 },
  { text: 'LOADING_BAR', pause: 0 },
  { text: '', pause: 400 },
  { text: '> DECRYPTION COMPLETE.', delay: 35, color: 'white', pause: 500 },
  { text: '> PREPARING BROADCAST...', delay: 40, pause: 400 },
  { text: '> BROADCASTING TO ALL SYSTEMS NOW.', delay: 35, color: 'red', pause: 1200 },
];

// ── dummy data ─────────────────────────────────────────────────────────────────
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

const WEEK_LABELS = [
  'Apr 28 - May 4',
  'May 5 - May 11',
  'May 12 - May 18',
  'May 19 - May 25',
  'May 26 - Jun 1',
  'Jun 2 - Jun 8',
];

// ── audio engine ───────────────────────────────────────────────────────────────
function createAudio() {
  if (typeof window === 'undefined') return null;
  let ctx: AudioContext | null = null;
  const ac = () => {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  };
  return {
    glitch() {
      try {
        const c = ac();
        const len = Math.floor(c.sampleRate * 0.04);
        const buf = c.createBuffer(1, len, c.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.2;
        const src = c.createBufferSource(); src.buffer = buf;
        const g = c.createGain();
        g.gain.setValueAtTime(0.1, c.currentTime);
        g.gain.linearRampToValueAtTime(0, c.currentTime + 0.04);
        src.connect(g); g.connect(c.destination); src.start();
      } catch (_) {}
    },
    keyboard() {
      try {
        const c = ac();
        // White noise burst shaped like a key mechanism click
        const len = Math.floor(c.sampleRate * 0.03);
        const buf = c.createBuffer(1, len, c.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        const src = c.createBufferSource(); src.buffer = buf;
        const filter = c.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1800 + Math.random() * 800, c.currentTime);
        filter.Q.value = 1.2;
        const g = c.createGain();
        g.gain.setValueAtTime(0.12, c.currentTime);
        g.gain.linearRampToValueAtTime(0, c.currentTime + 0.03);
        src.connect(filter); filter.connect(g); g.connect(c.destination); src.start();
        // Low-frequency thump for the key bottom-out
        const o = c.createOscillator(); const og = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(160, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(55, c.currentTime + 0.025);
        og.gain.setValueAtTime(0.07, c.currentTime);
        og.gain.linearRampToValueAtTime(0, c.currentTime + 0.028);
        o.connect(og); og.connect(c.destination); o.start(); o.stop(c.currentTime + 0.03);
      } catch (_) {}
    },
    alarm() {
      try {
        const c = ac();
        for (let i = 0; i < 8; i++) {
          const o = c.createOscillator(); const g = c.createGain();
          const t = c.currentTime + i * 0.22;
          o.type = 'square'; o.frequency.setValueAtTime(880, t);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.22, t + 0.02);
          g.gain.linearRampToValueAtTime(0, t + 0.18);
          o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.2);
        }
      } catch (_) {}
    },
    reveal() {
      try {
        const c = ac();
        const o1 = c.createOscillator(); const g1 = c.createGain();
        o1.type = 'sine'; o1.frequency.setValueAtTime(90, c.currentTime);
        o1.frequency.exponentialRampToValueAtTime(35, c.currentTime + 0.5);
        g1.gain.setValueAtTime(0.55, c.currentTime);
        g1.gain.linearRampToValueAtTime(0, c.currentTime + 0.6);
        o1.connect(g1); g1.connect(c.destination); o1.start(); o1.stop(c.currentTime + 0.6);
        [55, 82.5, 110, 138.6].forEach((f, i) => {
          const o = c.createOscillator(); const g = c.createGain();
          const t = c.currentTime + 0.05 + i * 0.09;
          o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.1, t + 0.25);
          g.gain.linearRampToValueAtTime(0.05, t + 2.5);
          g.gain.linearRampToValueAtTime(0, t + 5);
          o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 5);
        });
      } catch (_) {}
    },
  };
}

// ── component ──────────────────────────────────────────────────────────────────
export default function FeaturePage() {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const glitchRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalTextRef = useRef<HTMLDivElement>(null);
  const loadingBarWrapRef = useRef<HTMLDivElement>(null);
  const loadingFillRef = useRef<HTMLDivElement>(null);
  const loadingPctRef = useRef<HTMLDivElement>(null);
  const warningRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const rLabelRef = useRef<HTMLDivElement>(null);
  const rSubmsgRef = useRef<HTMLDivElement>(null);
  const bigNameRef = useRef<HTMLDivElement>(null);
  const presidentLineRef = useRef<HTMLDivElement>(null);
  const sloganLineRef = useRef<HTMLDivElement>(null);
  const voteLineRef = useRef<HTMLDivElement>(null);
  const cornersRef = useRef<(HTMLDivElement | null)[]>([]);
  const triggeredRef = useRef(false);
  const audioRef = useRef<ReturnType<typeof createAudio>>(null);

  useEffect(() => {
    audioRef.current = createAudio();
    const timer = setTimeout(() => {
      if (!triggeredRef.current) startSequence();
    }, 4000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startSequence() {
    if (triggeredRef.current) return;
    triggeredRef.current = true;
    phase_glitch();
  }

  // ── Phase 1: Glitch ──────────────────────────────────────────────────────────
  function phase_glitch() {
    gsap.set(glitchRef.current, { display: 'block' });
    let count = 0;
    const iv = setInterval(() => {
      gsap.to(dashboardRef.current, {
        opacity: Math.random() > 0.5 ? 0.4 + Math.random() * 0.6 : 1,
        skewX: Math.random() > 0.65 ? (Math.random() - 0.5) * 6 : 0,
        x: Math.random() > 0.8 ? (Math.random() - 0.5) * 10 : 0,
        duration: 0.04, overwrite: true,
      });
      if (Math.random() > 0.3) addGlitchBar();
      if (Math.random() > 0.55) audioRef.current?.glitch();
      count++;
      if (count > 28) {
        clearInterval(iv);
        gsap.to(dashboardRef.current, { opacity: 1, skewX: 0, x: 0, duration: 0.15 });
        setTimeout(phase_terminal, 200);
      }
    }, 120);
  }

  function addGlitchBar() {
    const b = document.createElement('div');
    Object.assign(b.style, {
      position: 'fixed', left: '0', right: '0', zIndex: '150',
      top: `${Math.random() * 90}vh`,
      height: `${Math.floor(6 + Math.random() * 40)}px`,
      background: `rgba(0,255,65,${(0.06 + Math.random() * 0.14).toFixed(2)})`,
      pointerEvents: 'none',
    });
    document.body.appendChild(b);
    gsap.fromTo(b, { x: '-100%', opacity: 0 }, {
      x: '100%', opacity: 0, duration: 0.35, ease: 'none', onComplete: () => b.remove(),
    });
  }

  // ── Phase 2: Terminal ─────────────────────────────────────────────────────────
  function phase_terminal() {
    gsap.set(dashboardRef.current, { display: 'none' });
    gsap.set(glitchRef.current, { display: 'none' });
    gsap.set(terminalRef.current, { display: 'block', opacity: 0 });
    gsap.to(terminalRef.current, { opacity: 1, duration: 0.3 });

    let li = 0;
    const el = terminalTextRef.current!;

    function nextLine() {
      if (li >= TERMINAL_LINES.length) { setTimeout(phase_warning, 800); return; }
      const line = TERMINAL_LINES[li++];
      if (line.text === 'LOADING_BAR') {
        gsap.set(loadingBarWrapRef.current, { display: 'block' });
        animateLoadingBar(() => nextLine());
        return;
      }
      typeLine(line.text, line.delay ?? 40, line.color, () => {
        setTimeout(nextLine, line.pause ?? 150);
      });
    }

    function typeLine(text: string, speed: number, color: string | undefined, done: () => void) {
      if (!text) { el.appendChild(document.createTextNode('\n')); done(); return; }
      let i = 0;
      const span = document.createElement('span');
      if (color === 'red') span.style.color = RED;
      else if (color === 'white') span.style.color = 'white';
      el.appendChild(span);
      function tick() {
        if (i < text.length) {
          span.textContent += text[i++];
          audioRef.current?.keyboard();
          setTimeout(tick, speed + Math.random() * 15);
        } else {
          el.appendChild(document.createTextNode('\n'));
          done();
        }
      }
      tick();
    }

    nextLine();
  }

  function animateLoadingBar(done: () => void) {
    const fill = loadingFillRef.current!;
    const pct = loadingPctRef.current!;
    const steps = [
      { target: 12, speed: 40 }, { target: 12, speed: 600 },
      { target: 31, speed: 30 }, { target: 31, speed: 400 },
      { target: 47, speed: 25 }, { target: 47, speed: 700 },
      { target: 68, speed: 20 }, { target: 68, speed: 300 },
      { target: 79, speed: 35 }, { target: 79, speed: 800 },
      { target: 93, speed: 15 }, { target: 93, speed: 500 },
      { target: 100, speed: 10 },
    ];
    let si = 0; let p = 0;
    function runStep() {
      if (si >= steps.length) { done(); return; }
      const step = steps[si++];
      if (p >= step.target) { setTimeout(runStep, step.speed); return; }
      const obj = { val: p };
      gsap.to(obj, {
        val: step.target,
        duration: Math.max(0.01, ((step.target - p) * step.speed) / 1000),
        ease: 'none',
        onUpdate() { p = Math.round(obj.val); fill.style.width = `${p}%`; pct.textContent = `${p}%`; },
        onComplete() { setTimeout(runStep, step.speed); },
      });
    }
    runStep();
  }

  // ── Phase 3: Warning ──────────────────────────────────────────────────────────
  function phase_warning() {
    gsap.set(terminalRef.current, { display: 'none' });
    audioRef.current?.alarm();
    const ws = warningRef.current!;
    gsap.set(ws, { display: 'flex', backgroundColor: RED });
    let flashes = 0;
    const iv = setInterval(() => {
      gsap.to(ws, { backgroundColor: flashes % 2 === 0 ? RED : '#111111', duration: 0.08 });
      flashes++;
      if (flashes > 7) { clearInterval(iv); gsap.set(ws, { display: 'none' }); phase_reveal(); }
    }, 220);
  }

  // ── Phase 4: Reveal ───────────────────────────────────────────────────────────
  function phase_reveal() {
    audioRef.current?.reveal();
    const r = revealRef.current!;
    gsap.set(r, { display: 'flex' });
    const tl = gsap.timeline();
    tl.fromTo(rLabelRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.1)
      .fromTo(rSubmsgRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.5)
      .fromTo(bigNameRef.current, { opacity: 0, y: 40, scale: 0.85 }, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out' }, 1.0)
      .add(() => { if (bigNameRef.current) bigNameRef.current.classList.add('name-glitch-anim'); }, 2.0)
      .fromTo(presidentLineRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 1.9)
      .fromTo(sloganLineRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 2.4)
      .fromTo(voteLineRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 3.0)
      .fromTo(
        cornersRef.current.filter(Boolean),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.06 },
        2.8
      );
    spawnParticles(r);
  }

  function spawnParticles(container: HTMLDivElement) {
    for (let i = 0; i < 80; i++) {
      setTimeout(() => {
        const p = document.createElement('div');
        Object.assign(p.style, {
          position: 'absolute', width: '3px', height: '3px',
          background: GREEN, borderRadius: '50%', zIndex: '1',
          left: `${Math.random() * 100}vw`, top: `${Math.random() * 100}vh`, opacity: '0',
        });
        container.appendChild(p);
        const dist = 50 + Math.random() * 120;
        const dur = 1.8 + Math.random() * 1.2;
        gsap.fromTo(p, { opacity: 0, y: 0, scale: 1 }, {
          keyframes: [
            { opacity: 1, y: -dist * 0.4, scale: 1.5, duration: dur * 0.35 },
            { opacity: 0, y: -dist, scale: 0.5, duration: dur * 0.65 },
          ],
          ease: 'power2.out',
        });
      }, i * 25);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Bebas+Neue&display=swap');
        html, body { overflow: hidden !important; height: 100vh; width: 100vw; margin: 0; padding: 0; }
        @keyframes scan { to { top: 100vh; } }
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes pulsebtn {
          0%, 100% { box-shadow: 0 0 0 0 rgba(24,119,242,0.45); }
          50% { box-shadow: 0 0 0 10px rgba(24,119,242,0); }
        }
        @keyframes warningPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes nameGlitch {
          0%   { text-shadow: 4px 0 ${RED}, -4px 0 #00f; transform: translateX(0); }
          25%  { text-shadow: -8px 0 ${RED}, 8px 0 #00f; transform: translateX(6px); }
          50%  { text-shadow: 8px 0 ${RED}, -8px 0 #00f; transform: translateX(-6px); }
          75%  { text-shadow: -4px 0 ${RED}, 4px 0 #00f; transform: translateX(3px); }
          100% { text-shadow: 0 0 20px ${GREEN}, 0 0 40px rgba(0,255,65,0.3); transform: translateX(0); }
        }
        .name-glitch-anim { animation: nameGlitch 0.12s 4 ease-in-out forwards; }
      `}</style>

      {/* ── DASHBOARD — actual /dashboard/admin components with dummy data ── */}
      <div
        ref={dashboardRef}
        style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}
      >
        <ThemeProvider>
        <DashboardLayout>
          <DashboardContent maxWidth="xl">
            <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
              Hi, Welcome back 👋
            </Typography>

            <Grid container spacing={3}>
              {/* ── Stat cards ── */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <AnalyticsWidgetSummary
                  title="Total Members"
                  percent={2.1}
                  total={487}
                  icon={<Iconify icon="solar:users-group-rounded-bold-duotone" width={48} />}
                  chart={{ categories: MONTH_LABELS, series: [420, 435, 448, 455, 461, 470, 478, 487] }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <AnalyticsWidgetSummary
                  title="Active Sessions"
                  percent={-0.5}
                  total={12}
                  color="secondary"
                  icon={<Iconify icon="solar:calendar-mark-bold-duotone" width={48} />}
                  chart={{ categories: MONTH_LABELS, series: [14, 13, 15, 12, 14, 11, 13, 12] }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <AnalyticsWidgetSummary
                  title="Attendance Rate"
                  percent={1.3}
                  total={87}
                  color="warning"
                  icon={<Iconify icon="solar:clipboard-check-bold" width={48} />}
                  chart={{ categories: MONTH_LABELS, series: [82, 84, 83, 85, 86, 85, 87, 87] }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <AnalyticsWidgetSummary
                  title="Total Clubs"
                  percent={3.0}
                  total={14}
                  color="error"
                  icon={<Iconify icon="solar:star-bold-duotone" width={48} />}
                  chart={{ categories: MONTH_LABELS, series: [11, 11, 12, 12, 13, 13, 14, 14] }}
                />
              </Grid>

              {/* ── Charts ── */}
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <AnalyticsCurrentVisits
                  title="Attendance Distribution"
                  chart={{
                    series: [
                      { label: 'Present', value: 312 },
                      { label: 'Absent',  value: 95  },
                      { label: 'Excused', value: 38  },
                    ],
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6, lg: 8 }}>
                <AnalyticsWebsiteVisits
                  title="Attendance Overview"
                  subheader="Weekly attendance comparison"
                  chart={{
                    categories: WEEK_LABELS,
                    series: [
                      { name: 'Present', data: [28, 32, 25, 30, 35, 38] },
                      { name: 'Absent',  data: [10,  8, 15, 12,  6,  5] },
                    ],
                  }}
                />
              </Grid>
            </Grid>

            {/* Trigger button — same pulse animation */}
            <Button
              onClick={startSequence}
              variant="contained"
              size="large"
              sx={{ mt: 4, animation: 'pulsebtn 2s ease-in-out infinite' }}
            >
              ✦ Preview New Feature — Club Analytics
            </Button>
          </DashboardContent>
        </DashboardLayout>
        </ThemeProvider>
      </div>

      {/* ── GLITCH OVERLAY ── */}
      <div
        ref={glitchRef}
        style={{ position: 'fixed', inset: 0, background: 'transparent', zIndex: 100, display: 'none', pointerEvents: 'none' }}
      >
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '4px',
          background: `linear-gradient(90deg, transparent, ${GREEN}, transparent)`,
          top: '-4px', animation: 'scan 0.5s linear infinite',
        }}/>
      </div>

      {/* ── TERMINAL ── */}
      <div
        ref={terminalRef}
        style={{
          position: 'fixed', inset: 0, background: BG, zIndex: 200, display: 'none',
          padding: 'clamp(30px,5vh,60px) clamp(20px,5vw,80px)',
          fontFamily: "'Share Tech Mono', monospace",
          color: GREEN, fontSize: 'clamp(14px,1.8vw,22px)', lineHeight: 2.2, overflow: 'hidden',
        }}
      >
        <div ref={terminalTextRef} style={{ whiteSpace: 'pre' }} />
        <span style={{
          display: 'inline-block', width: '14px', height: '22px', background: GREEN,
          animation: 'blink 0.5s step-end infinite', verticalAlign: 'middle', marginLeft: '3px',
        }}/>
        <div ref={loadingBarWrapRef} style={{ marginTop: '12px', display: 'none' }}>
          <div style={{ height: '6px', background: 'rgba(0,255,65,0.15)', borderRadius: '3px', width: '60%', overflow: 'hidden' }}>
            <div ref={loadingFillRef} style={{ height: '100%', background: GREEN, width: '0%', borderRadius: '3px' }}/>
          </div>
          <div ref={loadingPctRef} style={{ fontSize: 'clamp(13px,1.5vw,20px)', color: GREEN, marginTop: '8px' }}>0%</div>
        </div>
      </div>

      {/* ── WARNING SCREEN ── */}
      <div
        ref={warningRef}
        style={{
          position: 'fixed', inset: 0, background: RED, zIndex: 250, display: 'none',
          alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
        }}
      >
        <div style={{ fontSize: 'clamp(80px,15vw,180px)', color: 'white', lineHeight: 1, marginBottom: '24px' }}>⚠</div>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 'clamp(20px,3vw,40px)', color: 'white', letterSpacing: '6px',
          textAlign: 'center', animation: 'warningPulse 0.4s ease-in-out infinite',
        }}>SECURITY BREACH DETECTED</div>
      </div>

      {/* ── REVEAL ── */}
      <div
        ref={revealRef}
        style={{
          position: 'fixed', inset: 0, background: BG, zIndex: 300, display: 'none',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '40px', overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,65,0.018) 3px, rgba(0,255,65,0.018) 6px)',
        }}/>

        {([
          { top: '30px', left: '30px', borderTop: `2px solid ${GREEN}`, borderLeft: `2px solid ${GREEN}` },
          { top: '30px', right: '30px', borderTop: `2px solid ${GREEN}`, borderRight: `2px solid ${GREEN}` },
          { bottom: '30px', left: '30px', borderBottom: `2px solid ${GREEN}`, borderLeft: `2px solid ${GREEN}` },
          { bottom: '30px', right: '30px', borderBottom: `2px solid ${GREEN}`, borderRight: `2px solid ${GREEN}` },
        ] as React.CSSProperties[]).map((style, i) => (
          <div
            key={i}
            ref={(el) => { cornersRef.current[i] = el; }}
            style={{ position: 'absolute', width: '60px', height: '60px', opacity: 0, zIndex: 2, ...style }}
          />
        ))}

        <div ref={rLabelRef} style={{
          fontFamily: "'Share Tech Mono', monospace", color: RED,
          fontSize: 'clamp(13px,1.5vw,18px)', letterSpacing: '6px', textTransform: 'uppercase',
          marginBottom: '20px', opacity: 0, position: 'relative', zIndex: 2,
        }}>⚠ &nbsp; THIS SYSTEM HAS BEEN COMPROMISED &nbsp; ⚠</div>

        <div ref={rSubmsgRef} style={{
          fontFamily: "'Share Tech Mono', monospace", color: 'rgba(0,255,65,0.45)',
          fontSize: 'clamp(13px,1.4vw,17px)', letterSpacing: '3px', textTransform: 'uppercase',
          marginBottom: '52px', opacity: 0, position: 'relative', zIndex: 2, lineHeight: 2,
        }}>
          AN UNAUTHORIZED BROADCAST<br/>
          HAS BEEN INJECTED INTO THIS SYSTEM<br/>
          TO DELIVER ONE MESSAGE TO ASYV
        </div>

        <div ref={bigNameRef} style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(80px,16vw,220px)', color: 'white',
          letterSpacing: '8px', lineHeight: 0.9, marginBottom: '16px',
          opacity: 0, position: 'relative', zIndex: 2,
        }}>
          ERIC
          <span style={{ color: GREEN, display: 'block', fontSize: 'clamp(60px,12vw,165px)' }}>
            DUFITIMANA
          </span>
        </div>

        <div ref={presidentLineRef} style={{
          fontFamily: "'Share Tech Mono', monospace", color: GREEN,
          fontSize: 'clamp(14px,2vw,26px)', letterSpacing: '6px', textTransform: 'uppercase',
          opacity: 0, position: 'relative', zIndex: 2, marginBottom: '32px',
        }}>— is running for student government president —</div>

        <div ref={sloganLineRef} style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(24px,3.5vw,48px)', color: 'rgba(255,255,255,0.15)',
          letterSpacing: '10px', opacity: 0, position: 'relative', zIndex: 2,
        }}>BUILT, NOT BORN</div>

        <div ref={voteLineRef} style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 'clamp(11px,1.2vw,15px)', color: 'rgba(0,255,65,0.4)',
          letterSpacing: '4px', textTransform: 'uppercase',
          opacity: 0, position: 'relative', zIndex: 2, marginTop: '16px',
        }}>asyv &nbsp;·&nbsp; 2025 &nbsp;·&nbsp; vote eric dufitimana</div>
      </div>
    </>
  );
}
