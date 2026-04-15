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
  const tickerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion || !cursorRef.current) return;
      gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 0.1 });
    };
    window.addEventListener('mousemove', handleMouseMove);
    const handleMouseEnter = () => cursorRef.current?.classList.add('big');
    const handleMouseLeave = () => cursorRef.current?.classList.remove('big');
    const interactiveElements = document.querySelectorAll('a, button, .btn');
    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    if (!prefersReducedMotion) {
      const ctx = gsap.context(() => {
        gsap.fromTo('.word-reveal',
          { yPercent: 110 },
          { yPercent: 0, duration: 1, ease: 'power4.out', stagger: 0.06, delay: 0.3 }
        );
        gsap.to('.hero-content', {
          opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 0.9, stagger: 0.2
        });
        ScrollTrigger.create({
          trigger: '.what-section',
          start: 'top 80%',
          onEnter: () => tickerRef.current?.classList.add('visible'),
          onLeaveBack: () => tickerRef.current?.classList.remove('visible'),
        });
        const whatWords = document.querySelectorAll('.what-word');
        gsap.fromTo(whatWords,
          { opacity: 0.15 },
          { opacity: 1, stagger: 0.04, ease: 'none', scrollTrigger: { trigger: '.what-statement', start: 'top 70%', end: 'bottom 60%', scrub: 0.5 } }
        );
        if (trackRef.current) {
          const totalWidth = trackRef.current.scrollWidth - window.innerWidth;
          gsap.to(trackRef.current, {
            x: -totalWidth, ease: 'none',
            scrollTrigger: {
              trigger: '.steps-pin-wrap', start: 'top top',
              end: () => '+=' + (totalWidth + window.innerWidth * 0.5),
              pin: true, scrub: 0.8, invalidateOnRefresh: true,
            }
          });
        }
        gsap.utils.toArray<HTMLElement>('.proof-card').forEach((card, i) => {
          gsap.fromTo(card, { y: 80, opacity: 0 }, {
            y: 0, opacity: 1, ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 90%', end: 'top 70%', scrub: i * 0.2 }
          });
        });
        document.querySelectorAll('.nd-row').forEach(row => {
          gsap.to(row, {
            opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
            scrollTrigger: { trigger: row, start: 'top 80%' }
          });
        });
        gsap.fromTo('.cta-word', { yPercent: 110 }, {
          yPercent: 0, duration: 0.85, ease: 'power4.out', stagger: 0.09,
          scrollTrigger: { trigger: '.cta-headline', start: 'top 80%' }
        });
      }, containerRef);
      return () => {
        lenis.destroy();
        window.removeEventListener('mousemove', handleMouseMove);
        interactiveElements.forEach((el) => {
          el.removeEventListener('mouseenter', handleMouseEnter);
          el.removeEventListener('mouseleave', handleMouseLeave);
        });
        ctx.revert();
      };
    } else {
      document.querySelectorAll<HTMLElement>('.word-reveal').forEach(el => { el.style.transform = 'translateY(0)'; });
      document.querySelectorAll<HTMLElement>('.hero-content').forEach(el => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
      return () => {
        lenis.destroy();
        window.removeEventListener('mousemove', handleMouseMove);
        interactiveElements.forEach((el) => {
          el.removeEventListener('mouseenter', handleMouseEnter);
          el.removeEventListener('mouseleave', handleMouseLeave);
        });
      };
    }
  }, []);

  const tickerItems = [
    "your brain has been right this whole time",
    "built for the minds they called too much",
    "find your whop niche. build it your way",
    "no hustle energy. no shame. just building",
    "made by nd people, backed by lived experience"
  ];

  return (
    <div ref={containerRef} className="relative bg-warm-cream min-h-screen">
      <div ref={cursorRef} className="custom-cursor" />
      <div className="grain" />

      {/* Ticker — pauses automatically via CSS prefers-reduced-motion */}
      <div
        ref={tickerRef}
        className="fixed top-0 left-0 right-0 z-[400] overflow-hidden bg-dusty-blush border-b border-black/10 py-2 -translate-y-full transition-transform duration-500"
        aria-hidden="true"
      >
        <div className="flex whitespace-nowrap animate-marquee">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="font-display text-[11px] italic text-deep-slate px-8 tracking-wider">
              {item} <span className="text-ocean-teal not-italic ml-2">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-[500] flex items-center justify-between px-10 py-5 mix-blend-multiply">
        <a href="#" className="font-display text-lg tracking-widest text-deep-slate">
          neurodev<span className="text-ocean-teal">✹</span>
        </a>
        <div className="flex items-center gap-6">
          <a href="#how" className="text-[12px] text-soft-grey hover:text-dark-text transition-colors">how it works</a>
          <a href="#nd" className="text-[12px] text-soft-grey hover:text-dark-text transition-colors">for your brain</a>
          <a href="#community" className="text-[12px] text-soft-grey hover:text-dark-text transition-colors">join the community</a>
          <button
            onClick={onStart}
            className="px-5 py-2 bg-deep-slate text-warm-cream rounded-full text-[12px] font-medium hover:opacity-85 transition-opacity"
          >
            get started →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex flex-col justify-end px-10 pb-16 relative overflow-hidden">
        <div className="absolute top-[-100px] right-[-100px] w-[600px] h-[600px] bg-dusty-blush rounded-full blur-[80px] opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-[-80px] w-[400px] h-[400px] bg-sage-mist rounded-full blur-[80px] opacity-40 pointer-events-none" />

        <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-soft-grey mb-6 flex items-center gap-3">
          <span className="w-8 h-[0.5px] bg-ocean-teal" />
          for minds that build differently
        </div>

        <h1 className="font-display text-[clamp(52px,9vw,120px)] leading-[1.02] tracking-tighter text-dark-text max-w-[14ch]">
          <span className="line-reveal">
            <span className="word-reveal">build&nbsp;</span>
            <span className="word-reveal">your&nbsp;</span>
            <span className="word-reveal">whop</span>
          </span>
          <span className="line-reveal">
            <em className="word-reveal italic text-ocean-teal">business&nbsp;</em>
            <span className="word-reveal">—</span>
          </span>
          <span className="line-reveal">
            <span className="word-reveal">on&nbsp;</span>
            <span className="word-reveal">your</span>
          </span>
          <span className="line-reveal">
            <span className="word-reveal">own&nbsp;</span>
            <span className="word-reveal">terms.</span>
          </span>
        </h1>

        <div className="flex flex-col md:flex-row items-end justify-between mt-12 gap-8">
          <p className="hero-content opacity-0 translate-y-5 text-[clamp(14px,1.5vw,17px)] leading-relaxed text-soft-grey max-w-[400px] font-light">
            neurodev helps neurodivergent builders find their whop niche, get unstuck, and earn — without burning out. <strong className="text-dark-text font-medium">no hustle energy. no shame. just building.</strong>
          </p>
          <div className="hero-content opacity-0 translate-y-5 flex items-center gap-4">
            <button
              onClick={onStart}
              className="px-7 py-3 bg-deep-slate text-warm-cream rounded-full text-[13px] font-medium hover:-translate-y-0.5 transition-all"
            >
              join neurodev
            </button>
            <a
              href="#how"
              className="px-7 py-3 border border-black/20 text-soft-grey rounded-full text-[13px] font-medium hover:text-dark-text hover:border-dark-text transition-all"
            >
              how it works
            </a>
          </div>
        </div>
      </section>

      {/* What is neurodev */}
      <section className="what-section bg-deep-slate py-32 px-10">
        <div className="max-w-[900px] mx-auto">
          <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/30 mb-10 flex items-center gap-3">
            <span className="w-6 h-[0.5px] bg-ocean-teal/60" />
            what is neurodev
          </div>
          <p className="what-statement font-display text-[clamp(28px,4.5vw,56px)] leading-tight tracking-tight text-warm-cream">
            {"neurodev is a whop community and toolkit built for neurodivergent builders — it helps you find your niche, stay unstuck, and earn on your own terms.".split(' ').map((word, i) => (
              <span key={i} className="what-word inline-block mr-[0.25em]">
                {word === 'you' ? <em className="italic text-ocean-teal/80">{word}</em> : word}
              </span>
            ))}
          </p>
          <div className="h-[0.5px] bg-white/10 my-16" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'find your niche', body: 'tell neurodev what you know, what you love, how you work. the ai generates 3 specific whop business ideas — tailored to your brain, not a generic template.' },
              { num: '02', title: 'get unstuck', body: 'task paralysis is real. neurodev breaks every step into one tiny action. when you freeze, it doesn\'t judge — it just gives you the next thing to do.' },
              { num: '03', title: 'build at your pace', body: 'energy-aware tools adapt to how you\'re feeling. low energy? the app simplifies. high energy? go deep. no hustle pressure, ever.' }
            ].map((feat, i) => (
              <div key={i} className="feat opacity-0 translate-y-8">
                <div className="font-mono text-[10px] tracking-widest text-ocean-teal/60 mb-4">{feat.num}</div>
                <h3 className="font-display text-xl italic text-warm-cream mb-3">{feat.title}</h3>
                <p className="text-[13px] leading-relaxed text-warm-cream/60 font-light">{feat.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how" className="py-32 overflow-hidden">
        <div className="px-10 mb-16">
          <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-soft-grey mb-10 flex items-center gap-3">
            <span className="w-6 h-[0.5px] bg-ocean-teal" />
            how it works
          </div>
          <h2 className="font-display text-[clamp(36px,5vw,64px)] leading-tight text-dark-text max-w-[16ch]">
            from idea to <em className="italic text-ocean-teal">income.</em>
          </h2>
        </div>

        <div className="steps-pin-wrap relative">
          <div ref={trackRef} className="flex w-max">
            {[
              { num: '01', title: 'tell neurodev what you\'ve got', body: 'not a form. a conversation. tell us your interests, your skills, and how you like to work. there\'s no wrong answer here. the more honest you are, the better the ideas.', tag: 'the chat' },
              { num: '02', title: 'get your 3 whop ideas', body: 'neurodev generates 3 specific, low-competition whop business ideas tailored to you. each one comes with a concept, why it\'s underserved, what to charge, and exactly how to start.', tag: 'the ideas' },
              { num: '03', title: 'take one tiny step', body: 'when you\'re ready (no pressure on when), pick one idea and hit "i froze" if you need to. neurodev breaks it down to one doable thing. that\'s it. that counts as progress.', tag: 'the step' },
              { num: '✹', title: 'build with your community', body: 'you\'re not building alone. neurodev members share what\'s working, hold each other accountable without pressure, and celebrate the small wins. because small wins are real wins.', tag: 'the community' }
            ].map((step, i) => (
              <div key={i} className="step w-[60vw] min-w-[340px] max-w-[500px] px-10 py-12 border-r border-black/10 opacity-0 translate-x-10">
                <div className="font-display text-[80px] italic text-black/5 leading-none mb-6">{step.num}</div>
                <h3 className="font-display text-2xl text-dark-text mb-4 leading-tight">
                  <em>{step.title}</em>
                </h3>
                <p className="text-[13.5px] leading-relaxed text-soft-grey font-light max-w-[36ch]">{step.body}</p>
                <div className="inline-flex items-center gap-2 mt-6 px-3 py-1 bg-dusty-blush rounded-full text-[11px] text-deep-slate/60 font-medium">
                  <span>✹</span> {step.tag}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof */}
      <section className="py-32 px-10 bg-slate-mist/20">
        <div className="max-w-[1000px] mx-auto">
          <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-soft-grey mb-10 flex items-center gap-3">
            <span className="w-6 h-[0.5px] bg-ocean-teal" />
            from the community
          </div>
          <h2 className="proof-headline font-display text-[clamp(32px,4vw,52px)] text-center mb-16">
            real words from <em className="italic text-ocean-teal">real</em> builders.
          </h2>
          <div className="proof-grid grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { q: 'i had 12 business ideas and couldn\'t pick one. neurodev gave me 3 that actually fit how my brain works. i started the week after.', who: 'alex — adhd, indie creator' },
              { q: 'i froze every time i tried to launch. the "i froze" button isn\'t embarrassing — it\'s the feature that actually helped me ship.', who: 'sam — autistic, whop builder' },
              { q: 'low energy mode is the most thoughtful thing i\'ve seen in a productivity tool. the app adapts instead of making me feel bad for being human.', who: 'morgan — dyslexic, freelance designer' }
            ].map((p, i) => (
              <div key={i} className="proof-card bg-white border border-black/8 rounded-2xl p-6 opacity-0 translate-y-10">
                <p className="font-display text-[15px] italic leading-relaxed text-dark-text mb-5">
                  "{p.q}"
                </p>
                <div className="font-mono text-[9px] tracking-widest text-soft-grey pt-4 border-t border-black/10">
                  <span className="text-ocean-teal mr-1">✦</span> {p.who}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ND Breakdown */}
      <section id="nd" className="py-32 px-10 bg-white">
        <div className="max-w-[1000px] mx-auto">
          <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-soft-grey mb-10 flex items-center gap-3">
            <span className="w-6 h-[0.5px] bg-ocean-teal" />
            built for your brain
          </div>
          <h2 className="nd-headline font-display text-[clamp(36px,5vw,64px)] leading-none mb-20 max-w-[20ch]">
            what nobody else <em className="italic text-ocean-teal">understands.</em>
          </h2>
          <div className="flex flex-col">
            {[
              { label: 'task paralysis is real, not laziness', body: 'when you open an app and freeze, that\'s not a character flaw — it\'s a neurological reality. <strong class="text-dark-text font-medium">neurodev gives you one thing to do. not a list. one.</strong> the "i froze" button breaks it into the tiniest possible next step.' },
              { label: 'generic ideas don\'t fit nd brains', body: 'most business advice is written for people who can just pick something and ship. <strong class="text-dark-text font-medium">neurodev generates ideas around your specific interests, energy, and working style.</strong> no generic dropshipping. no trading signals.' },
              { label: 'focus mode when the noise is too much', body: 'one click switches the whole interface from rich and layered to clean, readable, left-aligned paragraphs. <strong class="text-dark-text font-medium">the app gets quieter when you need quiet.</strong> no cognitive overload.' },
              { label: 'rest days are features, not failures', body: 'neurodev is the first work tool that treats a rest day as intentional, not empty. <strong class="text-dark-text font-medium">your energy state reshapes the whole app.</strong> low-energy days look different. high days look different. the system adapts to you.' }
            ].map((row, i) => (
              <div key={i} className="nd-row grid grid-cols-1 md:grid-cols-[1fr,2fr] gap-16 py-12 border-t border-black/10 opacity-0 translate-y-6">
                <div className="font-display text-[22px] italic text-deep-slate leading-tight">{row.label}</div>
                <div className="text-sm leading-relaxed text-soft-grey font-light" dangerouslySetInnerHTML={{ __html: row.body }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community CTA */}
      <section id="community" className="py-40 px-10 text-center overflow-hidden">
        <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-soft-grey mb-8">
          your brain has been right this whole time ✹
        </div>
        <h2 className="cta-headline font-display text-[clamp(42px,7vw,88px)] leading-none tracking-tighter mb-10">
          {"ready to build?".split(' ').map((word, i) => (
            <span key={i} className="cta-word inline-block mr-[0.25em]">
              {word === 'build?' ? <em className="italic text-ocean-teal">{word}</em> : word}
            </span>
          ))}
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <button
            onClick={onStart}
            className="px-8 py-4 bg-deep-slate text-warm-cream rounded-full text-sm font-medium hover:opacity-85 transition-opacity"
          >
            join neurodev →
          </button>
          <a
            href="#how"
            className="px-8 py-4 border border-black/20 text-soft-grey rounded-full text-[13px] font-medium hover:text-dark-text hover:border-dark-text transition-all"
          >
            learn more
          </a>
        </div>
        <p className="mt-6 font-mono text-[10px] tracking-widest text-soft-grey uppercase">
          free to start · built by nd people · no hustle energy
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-display text-[15px] tracking-widest text-soft-grey">
          neurodev<span className="text-ocean-teal">✹</span>
        </div>
        <div className="font-mono text-[9px] tracking-widest text-soft-grey uppercase">
          @neurodev · built for brains like yours
        </div>
        <a href="#" className="text-[12px] text-soft-grey hover:text-dark-text transition-colors">back to top ↑</a>
      </footer>
    </div>
  );
}
