import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion || !cursorRef.current) return;
      gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 0.08 });
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleEnter = () => cursorRef.current?.classList.add('big');
    const handleLeave = () => cursorRef.current?.classList.remove('big');
    const els = document.querySelectorAll('a, button');
    els.forEach(el => { el.addEventListener('mouseenter', handleEnter); el.addEventListener('mouseleave', handleLeave); });

    if (!prefersReducedMotion) {
      const ctx = gsap.context(() => {
        gsap.fromTo('.word-reveal', { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.065, delay: 0.2 });
        gsap.to('.hero-sub', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 1.1 });
        gsap.to('.hero-ctas', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 1.25 });
        gsap.to('.hero-meta', { opacity: 1, duration: 0.7, ease: 'none', delay: 1.5 });

        gsap.utils.toArray<HTMLElement>('.what-word').forEach((word, i) => {
          gsap.fromTo(word, { opacity: 0.1 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: '.what-statement', start: 'top 70%', end: 'bottom 40%', scrub: 0.5 } });
        });

        if (trackRef.current) {
          const totalWidth = trackRef.current.scrollWidth - window.innerWidth;
          gsap.to(trackRef.current, {
            x: -totalWidth, ease: 'none',
            scrollTrigger: { trigger: '.steps-pin-wrap', start: 'top top', end: () => '+=' + (totalWidth + window.innerWidth * 0.5), pin: true, scrub: 0.8, invalidateOnRefresh: true }
          });
        }

        gsap.utils.toArray<HTMLElement>('.proof-card').forEach((card, i) => {
          gsap.fromTo(card, { y: 60, opacity: 0 }, { y: 0, opacity: 1, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 88%', end: 'top 65%', scrub: 0 } });
        });

        document.querySelectorAll('.nd-row').forEach(row => {
          gsap.to(row, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: row, start: 'top 82%' } });
        });

        gsap.fromTo('.cta-word', { yPercent: 110 }, { yPercent: 0, duration: 0.85, ease: 'power4.out', stagger: 0.09, scrollTrigger: { trigger: '.cta-headline', start: 'top 80%' } });
      }, containerRef);

      return () => {
        lenis.destroy();
        window.removeEventListener('mousemove', handleMouseMove);
        els.forEach(el => { el.removeEventListener('mouseenter', handleEnter); el.removeEventListener('mouseleave', handleLeave); });
        ctx.revert();
      };
    }

    document.querySelectorAll<HTMLElement>('.word-reveal').forEach(el => { el.style.transform = 'translateY(0)'; });
    return () => {
      lenis.destroy();
      window.removeEventListener('mousemove', handleMouseMove);
      els.forEach(el => { el.removeEventListener('mouseenter', handleEnter); el.removeEventListener('mouseleave', handleLeave); });
    };
  }, []);

  const tickerItems = [
    "your brain has been right this whole time",
    "built for the minds they called too much",
    "find your whop niche. build it your way",
    "no hustle energy. no shame. just building",
    "made by nd people, backed by lived experience"
  ];

  return (
    <div ref={containerRef} className="relative bg-canvas min-h-screen">
      <div ref={cursorRef} className="custom-cursor" />
      <div className="grain" />

      {/* Ticker */}
      <div className="fixed top-0 left-0 right-0 z-[400] overflow-hidden bg-blush/60 backdrop-blur-sm border-b border-blush-deep/30 py-2" aria-hidden="true">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="font-display text-[11px] italic text-ink/70 px-8 tracking-wide">
              {item} <span className="text-teal not-italic ml-2 opacity-60">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav className="fixed top-8 left-0 right-0 z-[500] flex items-center justify-between px-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-ink rounded-lg flex items-center justify-center">
            <div className="w-3 h-3 bg-canvas rounded-sm opacity-80" />
          </div>
          <span className="font-display text-base text-ink tracking-tight">neurodev</span>
        </div>
        <div className="flex items-center gap-1 bg-surface/80 backdrop-blur-xl border border-border/60 rounded-full px-2 py-1.5 shadow-sm">
          <a href="#how" className="px-4 py-1.5 text-[12px] text-soft-grey hover:text-ink transition-colors rounded-full hover:bg-black/5">how it works</a>
          <a href="#nd" className="px-4 py-1.5 text-[12px] text-soft-grey hover:text-ink transition-colors rounded-full hover:bg-black/5">for your brain</a>
          <button onClick={onStart} className="ml-1 px-5 py-2 bg-ink text-canvas rounded-full text-[12px] font-medium hover:bg-ink-2 transition-colors">
            get started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex flex-col justify-end px-10 pb-20 pt-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-blush/40 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sage/30 rounded-full blur-[100px] pointer-events-none" />

        <div className="nd-label mb-8 flex items-center gap-3 text-soft-grey">
          <span className="w-10 h-px bg-teal/40 inline-block" />
          for minds that build differently
        </div>

        <h1 className="font-display font-light text-[clamp(52px,9vw,118px)] leading-[1.0] tracking-tighter text-ink max-w-[13ch]">
          <span className="line-reveal"><span className="word-reveal">build&nbsp;</span><span className="word-reveal">your&nbsp;</span><span className="word-reveal">whop</span></span>
          <br />
          <span className="line-reveal"><em className="word-reveal italic" style={{color:'var(--color-teal)'}}>business</em><span className="word-reveal">&nbsp;—</span></span>
          <br />
          <span className="line-reveal"><span className="word-reveal">on&nbsp;</span><span className="word-reveal">your&nbsp;</span><span className="word-reveal">own&nbsp;</span><span className="word-reveal">terms.</span></span>
        </h1>

        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mt-14 gap-8">
          <p className="hero-sub opacity-0 translate-y-4 text-[clamp(14px,1.4vw,16px)] leading-relaxed text-soft-grey max-w-[380px] font-light">
            neurodev helps neurodivergent builders find their whop niche, get unstuck, and earn —&nbsp;
            <strong className="text-ink font-medium">without burning out.</strong>
          </p>
          <div className="hero-ctas opacity-0 translate-y-4 flex items-center gap-3">
            <button onClick={onStart} className="nd-button px-8 py-3 text-sm">
              join neurodev
            </button>
            <a href="#how" className="nd-button-ghost px-7 py-3 text-sm">
              how it works
            </a>
          </div>
        </div>

        <div className="hero-meta opacity-0 mt-12 flex items-center gap-6">
          {['free to start', 'no hustle pressure', 'built by nd people'].map((t, i) => (
            <span key={i} className="nd-label text-muted">{t}</span>
          ))}
        </div>
      </section>

      {/* What is neurodev */}
      <section className="what-section bg-ink py-32 px-10">
        <div className="max-w-[860px] mx-auto">
          <div className="nd-label mb-10 flex items-center gap-3 text-white/30">
            <span className="w-6 h-px bg-teal/50 inline-block" />
            what is neurodev
          </div>
          <p className="what-statement font-display font-light text-[clamp(26px,4vw,52px)] leading-tight tracking-tight text-canvas/90">
            {"neurodev is a whop community and toolkit built for neurodivergent builders — it helps you find your niche, stay unstuck, and earn on your own terms.".split(' ').map((word, i) => (
              <span key={i} className="what-word inline-block mr-[0.25em]">
                {word === 'you' ? <em className="italic" style={{color:'var(--color-teal-mid)'}}>{word}</em> : word}
              </span>
            ))}
          </p>

          <div className="h-px bg-white/8 my-16" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { num: '01', title: 'find your niche', body: 'tell neurodev what you know, love, and how you work. the ai generates 3 tailored whop business ideas — no generic templates.' },
              { num: '02', title: 'get unstuck', body: 'task paralysis is real. neurodev breaks every step into one tiny action. when you freeze, it doesn\'t judge — it just gives you the next thing.' },
              { num: '03', title: 'build at your pace', body: 'energy-aware tools adapt to how you\'re feeling. low energy? the app simplifies. high energy? go deep. no hustle pressure, ever.' }
            ].map((feat, i) => (
              <div key={i}>
                <div className="nd-label mb-4 text-teal-mid/60">{feat.num}</div>
                <h3 className="font-display text-lg italic text-canvas mb-3">{feat.title}</h3>
                <p className="text-[13px] leading-relaxed text-canvas/50 font-light">{feat.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works — horizontal scroll */}
      <section id="how" className="py-32 overflow-hidden">
        <div className="px-10 mb-16">
          <div className="nd-label mb-8 flex items-center gap-3">
            <span className="w-6 h-px bg-teal/40 inline-block" />
            how it works
          </div>
          <h2 className="font-display font-light text-[clamp(36px,5vw,62px)] leading-tight text-ink max-w-[16ch]">
            from idea to <em className="italic" style={{color:'var(--color-teal)'}}>income.</em>
          </h2>
        </div>

        <div className="steps-pin-wrap relative">
          <div ref={trackRef} className="flex w-max">
            {[
              { num: '01', title: "tell neurodev what you've got", body: "not a form. a conversation. tell us your interests, your skills, and how you like to work. there's no wrong answer here.", tag: 'the chat' },
              { num: '02', title: 'get your 3 whop ideas', body: 'neurodev generates 3 specific, low-competition whop business ideas tailored to you — concept, pricing, and how to start.', tag: 'the ideas' },
              { num: '03', title: 'take one tiny step', body: "when you're ready, pick one idea. hit \"i froze\" if needed. neurodev breaks it into one doable thing. that counts as progress.", tag: 'the step' },
              { num: '✹', title: 'build with your community', body: "you're not building alone. neurodev members share wins, hold each other accountable without pressure, and celebrate the small stuff.", tag: 'the community' }
            ].map((step, i) => (
              <div key={i} className="w-[55vw] min-w-[320px] max-w-[480px] px-10 py-14 border-r border-border/60">
                <div className="font-display text-[72px] font-light italic text-ink/6 leading-none mb-8">{step.num}</div>
                <h3 className="font-display text-xl text-ink mb-4 leading-snug font-light italic">{step.title}</h3>
                <p className="text-[13px] leading-relaxed text-soft-grey font-light max-w-[34ch]">{step.body}</p>
                <div className="inline-flex items-center gap-2 mt-8 px-3 py-1.5 bg-blush/50 rounded-full text-[10px] font-mono text-ink/50 uppercase tracking-wider">
                  <span className="text-teal">✹</span> {step.tag}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof */}
      <section className="py-32 px-10 bg-surface/60">
        <div className="max-w-[1000px] mx-auto">
          <div className="nd-label mb-10 flex items-center gap-3">
            <span className="w-6 h-px bg-teal/40 inline-block" />
            from the community
          </div>
          <h2 className="font-display font-light text-[clamp(32px,4vw,52px)] text-center mb-16">
            real words from <em className="italic" style={{color:'var(--color-teal)'}}>real</em> builders.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { q: "i had 12 business ideas and couldn't pick one. neurodev gave me 3 that actually fit how my brain works. i started the week after.", who: 'alex — adhd, indie creator' },
              { q: 'i froze every time i tried to launch. the "i froze" button isn\'t embarrassing — it\'s the feature that actually helped me ship.', who: 'sam — autistic, whop builder' },
              { q: "low energy mode is the most thoughtful thing i've seen in a productivity tool. the app adapts instead of making me feel bad for being human.", who: 'morgan — dyslexic, freelance designer' }
            ].map((p, i) => (
              <div key={i} className="proof-card nd-card p-7 flex flex-col justify-between gap-6">
                <p className="font-display text-[15px] italic leading-relaxed text-ink font-light">
                  "{p.q}"
                </p>
                <div className="nd-label pt-4 border-t border-border/60" style={{color:'var(--color-muted)'}}>
                  <span style={{color:'var(--color-teal)'}} className="mr-1.5">✦</span>{p.who}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ND Breakdown */}
      <section id="nd" className="py-32 px-10 bg-white">
        <div className="max-w-[1000px] mx-auto">
          <div className="nd-label mb-10 flex items-center gap-3">
            <span className="w-6 h-px bg-teal/40 inline-block" />
            built for your brain
          </div>
          <h2 className="font-display font-light text-[clamp(36px,5vw,62px)] leading-none mb-20 max-w-[20ch]">
            what nobody else <em className="italic" style={{color:'var(--color-teal)'}}>understands.</em>
          </h2>
          <div className="flex flex-col">
            {[
              { label: 'task paralysis is real, not laziness', body: "when you open an app and freeze, that's not a character flaw — it's a neurological reality. <strong style='color:#16202A;font-weight:500'>neurodev gives you one thing to do. not a list. one.</strong> the \"i froze\" button breaks it into the tiniest possible next step." },
              { label: "generic ideas don't fit nd brains", body: "most business advice is written for people who can just pick something and ship. <strong style='color:#16202A;font-weight:500'>neurodev generates ideas around your specific interests, energy, and working style.</strong> no generic dropshipping. no trading signals." },
              { label: 'focus mode when the noise is too much', body: "one click switches the whole interface from rich and layered to clean, readable, left-aligned. <strong style='color:#16202A;font-weight:500'>the app gets quieter when you need quiet.</strong> no cognitive overload." },
              { label: 'rest days are features, not failures', body: "neurodev treats a rest day as intentional, not empty. <strong style='color:#16202A;font-weight:500'>your energy state reshapes the whole app.</strong> low-energy days look different. high days look different. the system adapts to you." }
            ].map((row, i) => (
              <div key={i} className="nd-row grid grid-cols-1 md:grid-cols-[1fr,2fr] gap-16 py-12 border-t border-border/60">
                <div className="font-display text-[20px] italic text-ink font-light leading-snug">{row.label}</div>
                <div className="text-sm leading-relaxed text-soft-grey font-light" dangerouslySetInnerHTML={{ __html: row.body }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="community" className="py-40 px-10 text-center overflow-hidden bg-canvas">
        <div className="nd-label mb-8 text-muted">your brain has been right this whole time ✹</div>
        <h2 className="cta-headline font-display font-light text-[clamp(42px,7vw,86px)] leading-none tracking-tighter mb-12">
          {"ready to build?".split(' ').map((word, i) => (
            <span key={i} className="cta-word inline-block mr-[0.2em]">
              {word === 'build?' ? <em className="italic" style={{color:'var(--color-teal)'}}>{word}</em> : word}
            </span>
          ))}
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 mb-8">
          <button onClick={onStart} className="nd-button px-10 py-3.5 text-sm">
            join neurodev →
          </button>
          <a href="#how" className="nd-button-ghost px-9 py-3.5 text-sm">
            learn more
          </a>
        </div>
        <div className="nd-label text-muted/60">free to start · built by nd people · no hustle energy</div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-surface/30">
        <div className="font-display text-sm text-soft-grey">
          neurodev<span style={{color:'var(--color-teal)'}}>✹</span>
        </div>
        <div className="nd-label text-muted">@neurodev · built for brains like yours</div>
        <a href="#" className="text-[12px] text-muted hover:text-ink transition-colors">back to top ↑</a>
      </footer>
    </div>
  );
}
