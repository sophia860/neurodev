import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onStart: () => void;
}

// Tool data for Section 4
const tools = [
  {
    name: 'FlowLock',
    desc: 'Detects your cognitive state in real-time and shields your context window from interruption.',
    tag: 'FLOW',
    stat: 'Avg. 2.4h saved per session',
    tagColor: '#6e56cf',
  },
  {
    name: 'ContextStack',
    desc: 'Snapshots your working memory so switching tasks costs you seconds, not minutes.',
    tag: 'CONTEXT',
    stat: '23 min context-switch cost eliminated',
    tagColor: '#9b7ef8',
  },
  {
    name: 'DeepDial',
    desc: 'Calibrates ambient conditions — sound, light schedule, break cadence — to your dopamine rhythm.',
    tag: 'FOCUS',
    stat: '3.1× longer focus sessions',
    tagColor: '#22c55e',
  },
  {
    name: 'TraceMap',
    desc: 'Externalises your working memory as a navigable graph. Nothing gets lost between sessions.',
    tag: 'MEMORY',
    stat: '0 dropped threads in 30-day trial',
    tagColor: '#f59e0b',
  },
];

// Science panel data for Section 3
const sciencePanels = [
  {
    stat: '~11s',
    headline: "Dopamine isn't motivation. It's prediction.",
    body: "Dopamine fires on the anticipation of reward, not the reward itself. Standard productivity apps target completion — Neurodev tools target the anticipation loop, keeping the brain's prediction engine engaged.",
  },
  {
    stat: 'Hz 40',
    headline: 'Flow state has a neurological signature. We track it.',
    body: 'Gamma wave synchrony at 40Hz correlates with deep focus states. Our tools monitor the environmental and behavioural preconditions that reliably precede that state — and protect them once active.',
  },
  {
    stat: '23min',
    headline: 'Context switching costs 23 minutes. Our tools account for it.',
    body: 'Research consistently shows a 23-minute recovery window after each interruption. ContextStack was built around this single number — serialising interruptions so the cost is paid once, not repeatedly.',
  },
  {
    stat: '↑ 4×',
    headline: "The ND brain doesn't lack focus. It allocates it differently.",
    body: 'Hyperfocus is the same neurological mechanism as inattention — selective allocation at high intensity. Neurodev tools are designed to direct that allocation, not fight it.',
  },
];

// Marquee testimonials for Section 5
const marqueeItems = [
  '"finally."',
  '"this is the first tool that didn\'t make me feel broken"',
  '"shipped more in week 1 than the previous month"',
  '"the science is real"',
  '"bought it twice, gave the second to my lead"',
  '"stopped dreading mondays"',
  '"this is what I\'ve been waiting for"',
];

function splitWords(text: string, className: string) {
  return text.split(' ').map((word, i) => (
    <span key={i} className="nd-word" aria-hidden="true">
      <span className={`nd-word__inner ${className}`}>{word}</span>
    </span>
  ));
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  useEffect(() => {
    // Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const rafId = requestAnimationFrame(raf);
    lenis.on('scroll', ScrollTrigger.update);

    // Custom cursor
    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion || !cursorRef.current) return;
      gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 0.08 });
    };
    window.addEventListener('mousemove', handleMouseMove);
    const handleEnter = () => cursorRef.current?.classList.add('big');
    const handleLeave = () => cursorRef.current?.classList.remove('big');
    const els = document.querySelectorAll('a, button');
    els.forEach((el) => {
      el.addEventListener('mouseenter', handleEnter);
      el.addEventListener('mouseleave', handleLeave);
    });

    if (!prefersReducedMotion) {
      const ctx = gsap.context(() => {
        // SCENE 1 — Hero word-clip reveal
        gsap.from('.hero-word', {
          yPercent: 110,
          duration: 0.7,
          stagger: 0.04,
          ease: 'power3.out',
          delay: 0.2,
        });
        gsap.to('.hero-sub', {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          delay: 1.2,
        });
        gsap.to('.hero-cta', {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'elastic.out(1.2, 0.8)',
          delay: 1.45,
        });

        // SCENE 2 — Problem lines revealed on scroll
        gsap.utils.toArray<HTMLElement>('.problem-line').forEach((line, i) => {
          gsap.from(line.querySelectorAll('.nd-word__inner'), {
            yPercent: 110,
            duration: 0.65,
            stagger: 0.03,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: line,
              start: 'top 82%',
            },
          });
        });

        // SCENE 3 — Horizontal science panels (pinned)
        if (trackRef.current) {
          const totalWidth = trackRef.current.scrollWidth - window.innerWidth;
          gsap.to(trackRef.current, {
            x: -totalWidth,
            ease: 'none',
            scrollTrigger: {
              trigger: '.science-pin-wrap',
              start: 'top top',
              end: () => '+=' + (totalWidth + window.innerWidth * 0.5),
              pin: true,
              scrub: 0.8,
              snap: { snapTo: 1 / (sciencePanels.length - 1), duration: 0.4 },
              invalidateOnRefresh: true,
            },
          });
        }

        // SCENE 4 — Tool cards staggered in
        gsap.utils.toArray<HTMLElement>('.tool-card').forEach((card) => {
          gsap.from(card, {
            y: 40,
            opacity: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 88%',
            },
          });
        });

        // Section headlines word reveal (generic)
        gsap.utils.toArray<HTMLElement>('.section-headline').forEach((el) => {
          gsap.from(el.querySelectorAll('.nd-word__inner'), {
            yPercent: 110,
            duration: 0.7,
            stagger: 0.04,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 82%',
            },
          });
        });

        // SCENE 5 — Testimonial fade-in
        gsap.from('.featured-testimonial', {
          opacity: 0,
          y: 20,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.featured-testimonial',
            start: 'top 80%',
          },
        });

        // SCENE 6 — About lines stagger
        gsap.utils.toArray<HTMLElement>('.about-line').forEach((line, i) => {
          gsap.from(line, {
            opacity: 0,
            y: 16,
            duration: 1.1,
            ease: 'power3.out',
            delay: i * 0.08,
            scrollTrigger: {
              trigger: line,
              start: 'top 85%',
            },
          });
        });

        // SCENE 7 — CTA letter reveal
        gsap.from('.cta-letter', {
          yPercent: 110,
          duration: 0.9,
          stagger: 0.02,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: '.cta-headline',
            start: 'top 80%',
          },
        });
      }, containerRef);

      return () => {
        cancelAnimationFrame(rafId);
        lenis.destroy();
        window.removeEventListener('mousemove', handleMouseMove);
        els.forEach((el) => {
          el.removeEventListener('mouseenter', handleEnter);
          el.removeEventListener('mouseleave', handleLeave);
        });
        ctx.revert();
      };
    }

    // Reduced-motion fallback — make all animated elements visible immediately
    document.querySelectorAll<HTMLElement>('.nd-word__inner').forEach((el) => {
      el.style.transform = 'translateY(0)';
    });
    document.querySelectorAll<HTMLElement>('.hero-sub, .hero-cta').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.removeEventListener('mousemove', handleMouseMove);
      els.forEach((el) => {
        el.removeEventListener('mouseenter', handleEnter);
        el.removeEventListener('mouseleave', handleLeave);
      });
    };
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-screen" style={{ background: '#080810', color: '#e8e6f0' }}>
      <div ref={cursorRef} className="custom-cursor" />
      <div className="grain" />

      {/* ─── NAV ─── */}
      <nav
        aria-label="Main navigation"
        className="fixed top-0 left-0 right-0 z-[500] flex items-center justify-between px-10 py-5"
        style={{ background: 'rgba(8,8,16,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(30,30,46,0.5)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#6e56cf' }}>
            <div className="w-3 h-3 rounded-sm" style={{ background: '#e8e6f0', opacity: 0.9 }} />
          </div>
          <span className="font-display font-700 text-base tracking-tight" style={{ color: '#e8e6f0' }}>neurodev</span>
        </div>
        <div className="flex items-center gap-1 rounded-full px-2 py-1.5" style={{ background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(30,30,46,0.8)' }}>
          <a href="#science" className="px-4 py-1.5 text-[12px] rounded-full transition-colors" style={{ color: '#7a7a9a' }}>the science</a>
          <a href="#tools" className="px-4 py-1.5 text-[12px] rounded-full transition-colors" style={{ color: '#7a7a9a' }}>tools</a>
          <button
            onClick={onStart}
            className="ml-1 px-5 py-2 rounded-full text-[12px] font-600 nd-button"
          >
            get early access
          </button>
        </div>
      </nav>

      {/* ─── SCENE 1: HERO ─── */}
      <section
        aria-label="Hero"
        className="min-h-screen flex flex-col justify-end px-10 pb-24 pt-32 relative overflow-hidden"
      >
        {/* Ambient violet glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: '600px',
            height: '600px',
            background: 'radial-gradient(ellipse, rgba(110,86,207,0.15) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <h1
          className="font-display font-800 leading-none tracking-tighter max-w-[14ch]"
          aria-label="Your brain codes differently. That's not a problem."
          style={{ fontSize: 'clamp(3.5rem,9vw,8rem)' }}
        >
          <span className="block">
            {splitWords('Your brain codes differently.', 'hero-word')}
          </span>
          <span className="block mt-2" style={{ color: '#9b7ef8' }}>
            {splitWords("That's not a problem.", 'hero-word')}
          </span>
        </h1>

        <p
          className="hero-sub mt-10 text-base leading-relaxed max-w-[480px]"
          style={{ color: '#7a7a9a', opacity: 0, transform: 'translateY(16px)' }}
        >
          Neurodev builds tools shaped around how developer brains actually work —
          not how productivity culture says they should.
        </p>

        <div
          className="hero-cta mt-10 flex items-center gap-3"
          style={{ opacity: 0, transform: 'translateY(16px)' }}
        >
          <button onClick={onStart} className="nd-button px-8 py-3.5 text-sm nd-cta-pulse">
            Get early access on Whop →
          </button>
        </div>
      </section>

      {/* ─── SCENE 2: THE PROBLEM ─── */}
      <section
        id="problem"
        aria-label="The problem"
        className="py-40 px-10"
        style={{ background: '#080810' }}
      >
        <div className="max-w-[900px]">
          <p className="nd-label mb-10" style={{ color: '#3a3a55' }}>// the_problem</p>

          <h2
            className="section-headline font-display font-800 leading-tight mb-16"
            aria-label="The tools were built for a brain that isn't yours."
            style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: '#e8e6f0' }}
          >
            {splitWords('The tools were built for a brain that isn\'t yours.', 'section-headline-word')}
          </h2>

          <div className="space-y-6 max-w-[680px]">
            {[
              'Calendars that assume linear time.',
              'To-do lists that punish non-linear thinking.',
              'Focus timers built for people who don\'t hyper-focus.',
              '',
              'The average dev tool was designed by and for the neurotypical majority.',
              'You\'ve been using workarounds your whole career.',
            ].map((line, i) =>
              line === '' ? (
                <div key={i} className="h-6" />
              ) : (
                <p
                  key={i}
                  className="problem-line font-display leading-snug overflow-hidden"
                  aria-label={line}
                  style={{
                    fontSize: i < 3 ? 'clamp(1.125rem,2.5vw,1.5rem)' : 'clamp(1rem,2vw,1.25rem)',
                    color: i < 3 ? '#e8e6f0' : '#7a7a9a',
                  }}
                >
                  {splitWords(line, 'problem-word')}
                </p>
              )
            )}
          </div>
        </div>
      </section>

      {/* ─── SCENE 3: THE SCIENCE (pinned horizontal scroll) ─── */}
      <section
        id="science"
        aria-label="The science"
        className="science-pin-wrap relative"
        style={{ background: '#0f0f1a' }}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 z-10" style={{ height: '2px', background: 'rgba(30,30,46,0.8)' }}>
          <div className="nd-progress-bar h-full" style={{ width: '100%', background: '#6e56cf', opacity: 0.6 }} />
        </div>

        <div ref={trackRef} className="flex" style={{ width: 'max-content' }}>
          {sciencePanels.map((panel, i) => (
            <div
              key={i}
              className="flex flex-col justify-between px-20 py-24 relative"
              style={{
                width: '100vw',
                minHeight: '100vh',
                borderRight: i < sciencePanels.length - 1 ? '1px solid rgba(30,30,46,0.6)' : 'none',
              }}
            >
              <p className="nd-label mb-6" style={{ color: '#3a3a55' }}>
                // neuroscience_layer_0{i + 1}
              </p>

              <div className="flex-1 flex flex-col justify-center gap-8 max-w-[600px]">
                <p
                  className="font-mono font-400 leading-none"
                  style={{ fontSize: 'clamp(4rem,12vw,9rem)', color: '#6e56cf', fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {panel.stat}
                </p>
                <h3
                  className="font-display font-800 leading-tight"
                  style={{ fontSize: 'clamp(1.5rem,3vw,2.5rem)', color: '#e8e6f0' }}
                >
                  {panel.headline}
                </h3>
                <p className="text-base leading-relaxed max-w-[44ch]" style={{ color: '#7a7a9a', lineHeight: 1.65 }}>
                  {panel.body}
                </p>
              </div>

              <div className="nd-label" style={{ color: '#3a3a55' }}>
                {i + 1} / {sciencePanels.length}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SCENE 4: TOOLS ─── */}
      <section
        id="tools"
        aria-label="Tools"
        className="py-32 px-10"
        style={{ background: '#080810' }}
      >
        <div className="max-w-[1100px] mx-auto">
          <p className="nd-label mb-6" style={{ color: '#3a3a55' }}>// tools_layer_01</p>

          <h2
            className="section-headline font-display font-800 leading-tight mb-4"
            aria-label="Tools that understand your architecture."
            style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: '#e8e6f0' }}
          >
            {splitWords('Tools that understand your architecture.', 'section-headline-word')}
          </h2>
          <p className="mb-16 max-w-[48ch] text-base" style={{ color: '#7a7a9a', lineHeight: 1.65 }}>
            Each one built around a specific cognitive pattern. Pick what fits how you work today.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map((tool, i) => (
              <div
                key={i}
                className="tool-card nd-card nd-card-hover p-8 flex flex-col gap-6 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display font-700 text-xl" style={{ color: '#e8e6f0' }}>
                    {tool.name}
                  </h3>
                  <span
                    className="nd-label shrink-0 mt-1"
                    style={{ color: tool.tagColor, border: `1px solid ${tool.tagColor}30`, padding: '3px 8px', borderRadius: '100px', background: `${tool.tagColor}10` }}
                  >
                    {tool.tag}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#7a7a9a', lineHeight: 1.65 }}>
                  {tool.desc}
                </p>
                <p className="font-mono text-xs" style={{ color: '#6e56cf', fontFamily: 'JetBrains Mono, monospace' }}>
                  {tool.stat}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SCENE 5: PROOF ─── */}
      <section
        aria-label="Social proof"
        className="py-24 overflow-hidden"
        style={{ background: '#0f0f1a', borderTop: '1px solid rgba(30,30,46,0.6)' }}
      >
        {/* Marquee */}
        <div className="overflow-hidden mb-16" aria-hidden="true">
          <div className="flex whitespace-nowrap animate-marquee">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span
                key={i}
                className="font-display text-sm px-10 shrink-0"
                style={{ color: '#7a7a9a' }}
              >
                {item}
                <span className="mx-6" style={{ color: '#3a3a55' }}>·</span>
              </span>
            ))}
          </div>
        </div>

        {/* Featured testimonial */}
        <div
          className="featured-testimonial max-w-[800px] mx-auto px-10"
        >
          <div
            className="p-10 rounded-2xl"
            style={{ background: 'rgba(110,86,207,0.06)', border: '1px solid rgba(110,86,207,0.15)' }}
          >
            <p
              className="font-display font-400 leading-relaxed mb-8"
              style={{ fontSize: 'clamp(1.125rem,2.5vw,1.5rem)', color: '#e8e6f0', fontStyle: 'italic', lineHeight: 1.5 }}
            >
              "I've been a developer for 11 years. I've tried everything.
              Neurodev is the first thing that worked with how I actually think."
            </p>
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm font-500"
                style={{ background: 'rgba(110,86,207,0.2)', color: '#9b7ef8', fontFamily: 'JetBrains Mono, monospace' }}
              >
                SR
              </div>
              <div>
                <p className="text-sm font-600" style={{ color: '#e8e6f0' }}>Senior Engineer</p>
                <p className="nd-label mt-0.5" style={{ color: '#3a3a55' }}>neurodev early access</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SCENE 6: ABOUT ─── */}
      <section
        id="about"
        aria-label="About"
        className="py-48 px-10"
        style={{ background: '#080810' }}
      >
        <div className="max-w-[600px] mx-auto text-center space-y-6">
          <p className="nd-label mb-8" style={{ color: '#3a3a55' }}>// origin_story</p>

          <h2
            className="about-line font-display font-800 leading-tight mb-12"
            style={{ fontSize: 'clamp(2rem,4vw,3rem)', color: '#e8e6f0' }}
          >
            Built by someone who needed it.
          </h2>

          {[
            'I spent years assuming the problem was discipline.',
            'It wasn\'t. It was architecture.',
            '',
            'Neurodev exists because I got tired of building workarounds for tools that were never designed for how my brain codes.',
            '',
            'The neuroscience is real. The tools are tested on the person who built them first.',
          ].map((line, i) =>
            line === '' ? (
              <div key={i} className="h-4" />
            ) : (
              <p
                key={i}
                className="about-line text-base leading-relaxed"
                style={{ color: i === 0 || i === 3 || i === 5 ? '#7a7a9a' : '#e8e6f0', lineHeight: 1.65 }}
              >
                {line}
              </p>
            )
          )}
        </div>
      </section>

      {/* ─── SCENE 7: THE CLOSE ─── */}
      <section
        aria-label="Call to action"
        className="min-h-screen flex flex-col items-center justify-center px-10 py-32 text-center relative overflow-hidden"
        style={{ background: '#080810' }}
      >
        {/* Intense violet glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(110,86,207,0.18) 0%, transparent 70%)',
          }}
        />

        <p className="nd-label mb-10 relative z-10" style={{ color: '#3a3a55' }}>// the_close</p>

        <h2
          className="cta-headline font-display font-800 leading-none tracking-tighter mb-12 relative z-10"
          aria-label="Code like your brain was always right."
          style={{ fontSize: 'clamp(3rem,9vw,7rem)', color: '#e8e6f0' }}
        >
          {'Code like your brain was always right.'.split('').map((char, i) => (
            <span key={i} className="nd-word cta-letter" style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}>
              <span className="nd-word__inner cta-letter-inner" style={{ display: 'inline-block' }}>
                {char === ' ' ? '\u00a0' : char}
              </span>
            </span>
          ))}
        </h2>

        <div className="relative z-10 flex flex-col items-center gap-4">
          <button
            onClick={onStart}
            className="nd-button px-10 py-4 text-base font-700 nd-cta-pulse"
          >
            Join Neurodev on Whop →
          </button>
          <p className="nd-label mt-2" style={{ color: '#3a3a55' }}>
            Early access. Built for developers who think differently.
          </p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer
        className="px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ borderTop: '1px solid rgba(30,30,46,0.6)', background: '#080810' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: '#6e56cf' }}>
            <div className="w-2 h-2 rounded-sm" style={{ background: '#e8e6f0', opacity: 0.9 }} />
          </div>
          <span className="font-display font-700 text-sm" style={{ color: '#e8e6f0' }}>neurodev</span>
        </div>
        <p className="nd-label" style={{ color: '#3a3a55' }}>built for brains like yours · whop.com/neurodev</p>
        <a href="#" className="text-xs transition-colors" style={{ color: '#3a3a55' }}>↑ back to top</a>
      </footer>
    </div>
  );
}
