import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { cn } from '../lib/utils';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Custom Cursor
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        gsap.to(cursorRef.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.1,
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleMouseEnter = () => cursorRef.current?.classList.add('big');
    const handleMouseLeave = () => cursorRef.current?.classList.remove('big');

    const interactiveElements = document.querySelectorAll('a, button, .btn');
    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    // GSAP Animations
    const ctx = gsap.context(() => {
      // Hero Headline Reveal
      gsap.fromTo('.word-reveal', 
        { yPercent: 110 },
        { 
          yPercent: 0, 
          duration: 1, 
          ease: 'power4.out', 
          stagger: 0.06,
          delay: 0.3
        }
      );

      // Hero Sub & Actions
      gsap.to('.hero-content', {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        delay: 0.9,
        stagger: 0.2
      });

      // Ticker Reveal on Scroll
      ScrollTrigger.create({
        trigger: '.what-section',
        start: 'top 80%',
        onEnter: () => tickerRef.current?.classList.add('visible'),
        onLeaveBack: () => tickerRef.current?.classList.remove('visible'),
      });

      // What Statement Word Highlight (The "Whoa" Moment)
      const whatWords = document.querySelectorAll('.what-word');
      gsap.fromTo(whatWords,
        { opacity: 0.15 },
        {
          opacity: 1,
          stagger: 0.04,
          ease: 'none',
          scrollTrigger: {
            trigger: '.what-statement',
            start: 'top 70%',
            end: 'bottom 60%',
            scrub: 0.5
          }
        }
      );

      // Horizontal Scroll for Steps
      if (trackRef.current) {
        const totalWidth = trackRef.current.scrollWidth - window.innerWidth;
        gsap.to(trackRef.current, {
          x: -totalWidth,
          ease: 'none',
          scrollTrigger: {
            trigger: '.steps-pin-wrap',
            start: 'top top',
            end: () => '+=' + (totalWidth + window.innerWidth * 0.5),
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          }
        });
      }

      // Proof Cards Staggered Parallax
      gsap.utils.toArray<HTMLElement>('.proof-card').forEach((card, i) => {
        gsap.fromTo(card,
          { y: 100, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 90%',
              end: 'top 70%',
              scrub: i * 0.2, // Parallax effect
            }
          }
        );
      });

      // ND Rows Reveal
      document.querySelectorAll('.nd-row').forEach(row => {
        gsap.to(row, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: row,
            start: 'top 80%'
          }
        });
      });

      // CTA Headline
      gsap.fromTo('.cta-word',
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 0.85,
          ease: 'power4.out',
          stagger: 0.09,
          scrollTrigger: {
            trigger: '.cta-headline',
            start: 'top 80%'
          }
        }
      );
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
  }, []);

  const tickerItems = [
    "your brain has been right this whole time",
    "built for the brain they called lazy",
    "find remote gigs that actually fit",
    "no overwhelm. no shame. just paid",
    "made by nd people, backed by an ed psych"
  ];

  return (
    <div ref={containerRef} className="relative bg-warm-cream min-h-screen">
      <div ref={cursorRef} className="custom-cursor" />
      <div className="grain" />

      {/* Ticker */}
      <div ref={tickerRef} className="fixed top-0 left-0 right-0 z-[400] overflow-hidden bg-dusty-blush border-b border-black/10 py-2 -translate-y-full transition-transform duration-500">
        <div className="flex whitespace-nowrap animate-[marquee_30s_linear_infinite]">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="font-display text-[11px] italic text-deep-plum px-8 tracking-wider">
              {item} <span className="text-terracotta not-italic ml-2">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-[500] flex items-center justify-between px-10 py-5 mix-blend-multiply">
        <a href="#" className="font-display text-lg tracking-widest">florr<span className="text-terracotta">✹</span></a>
        <div className="flex items-center gap-6">
          <a href="#how" className="text-[12px] text-soft-grey hover:text-dark-text transition-colors">how it works</a>
          <a href="#nd" className="text-[12px] text-soft-grey hover:text-dark-text transition-colors">for your brain</a>
          <button onClick={onStart} className="px-5 py-2 bg-deep-plum text-warm-cream rounded-full text-[12px] font-medium hover:opacity-85 transition-opacity">
            find me a gig →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex flex-col justify-end px-10 pb-16 relative overflow-hidden">
        <div className="absolute top-[-100px] right-[-100px] w-[600px] h-[600px] bg-dusty-blush rounded-full blur-[80px] opacity-60 pointer-events-none" />
        <div className="absolute bottom-0 left-[-80px] w-[400px] h-[400px] bg-sage-mist rounded-full blur-[80px] opacity-50 pointer-events-none" />

        <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-soft-grey mb-6 flex items-center gap-3">
          <span className="w-8 h-[0.5px] bg-terracotta" />
          for the girls who work differently
        </div>

        <h1 className="font-display text-[clamp(52px,9vw,120px)] leading-[1.02] tracking-tighter text-dark-text max-w-[14ch]">
          <span className="line-reveal">
            <span className="word-reveal">let's&nbsp;</span>
            <span className="word-reveal">get&nbsp;</span>
            <span className="word-reveal">you</span>
          </span>
          <span className="line-reveal">
            <em className="word-reveal italic text-terracotta">earning&nbsp;</em>
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
          <p className="hero-content opacity-0 translate-y-5 text-[clamp(14px,1.5vw,17px)] leading-relaxed text-soft-grey max-w-[380px] font-light">
            florr finds remote gigs that fit how your brain works. translates every listing into plain english. <strong className="text-dark-text font-medium">no hustle culture. no shame. just money in your account.</strong>
          </p>
          <div className="hero-content opacity-0 translate-y-5 flex items-center gap-4">
            <button onClick={onStart} className="px-7 py-3 bg-deep-plum text-warm-cream rounded-full text-[13px] font-medium hover:-translate-y-0.5 transition-all">
              find me a gig
            </button>
            <a href="#how" className="px-7 py-3 border border-black/20 text-soft-grey rounded-full text-[13px] font-medium hover:text-dark-text hover:border-dark-text transition-all">
              how it works
            </a>
          </div>
        </div>
      </section>

      {/* What is Florr */}
      <section className="what-section bg-deep-plum py-32 px-10">
        <div className="max-w-[900px] mx-auto">
          <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/30 mb-10 flex items-center gap-3">
            <span className="w-6 h-[0.5px] bg-rose-300" />
            what is florr
          </div>
          <p className="what-statement font-display text-[clamp(28px,4.5vw,56px)] leading-tight tracking-tight text-warm-cream">
            {"florr is the first work app that adapts to you — not the other way round. it finds gigs, translates them, and helps you earn without burning out.".split(' ').map((word, i) => (
              <span key={i} className="what-word inline-block mr-[0.25em]">
                {word === 'you' ? <em className="italic text-rose-300">{word}</em> : word}
              </span>
            ))}
          </p>
          <div className="h-[0.5px] bg-white/10 my-16" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'finds the gig', body: 'scans real job boards. filters for remote, async, flexible. shows you 3 matches — translated, not dumped on you.' },
              { num: '02', title: 'translates everything', body: 'job listings are written by HR in corporate gibberish. florr rewrites them in plain english — what you\'d actually do, what energy it takes, whether it fits your brain.' },
              { num: '03', title: 'gets you paid', body: 'writes your follow-up emails. tracks your pipeline. helps you ask for money without the spiral. because you earned it.' }
            ].map((feat, i) => (
              <div key={i} className="feat opacity-0 translate-y-8">
                <div className="font-mono text-[10px] tracking-widest text-rose-300 mb-4">{feat.num}</div>
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
            <span className="w-6 h-[0.5px] bg-terracotta" />
            how it works
          </div>
          <h2 className="font-display text-[clamp(36px,5vw,64px)] leading-tight text-dark-text max-w-[16ch]">
            three steps to your first <em className="italic text-terracotta">gig.</em>
          </h2>
        </div>

        <div className="steps-pin-wrap relative">
          <div ref={trackRef} className="flex w-max">
            {[
              { num: '01', title: 'tell florr what you\'ve got', body: 'not a form. a conversation. tell florr what you\'re good at — even the informal stuff. mention your energy patterns, your conditions, how you work best. she listens without making it a big deal.', tag: 'the chat' },
              { num: '02', title: 'florr scouts for you', body: 'florr\'s ai scans remote.co, flexa, linkedin, and more — filtered for remote, low-meetings, flexible hours. it shows you 3 matches. not 50. three. each one translated into what it actually means to do that job.', tag: 'the scout' },
              { num: '03', title: 'track it, get paid', body: 'save gigs to your board. move them through spotted → applied → offer. florr writes your follow-up emails when you freeze. you tap send. money arrives. no shame. no avoidance spiral.', tag: 'the board' },
              { num: '✹', title: 'it remembers you', body: 'come back after a week. florr says: "you were thinking about that copywriting gig — did you decide?" no other app does this. this is the app that actually knows you.', tag: 'the memory' }
            ].map((step, i) => (
              <div key={i} className="step w-[60vw] min-w-[340px] max-w-[500px] px-10 py-12 border-r border-black/10 opacity-0 translate-x-10">
                <div className="font-display text-[80px] italic text-black/5 leading-none mb-6">{step.num}</div>
                <h3 className="font-display text-2xl text-dark-text mb-4 leading-tight" dangerouslySetInnerHTML={{ __html: step.title.replace('you\'ve got', '<em>you\'ve got</em>').replace('scouts for you', '<em>scouts for you</em>').replace('get paid', '<em>get paid</em>').replace('remembers you', '<em>remembers you</em>') }} />
                <p className="text-[13.5px] leading-relaxed text-soft-grey font-light max-w-[36ch]">{step.body}</p>
                <div className="inline-flex items-center gap-2 mt-6 px-3 py-1 bg-dusty-blush rounded-full text-[11px] text-rose-400 font-medium">
                  <span>✹</span> {step.tag}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof */}
      <section className="bg-taupe py-32 px-10">
        <div className="max-w-[1000px] mx-auto">
          <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-soft-grey mb-10 flex items-center gap-3">
            <span className="w-6 h-[0.5px] bg-terracotta" />
            what people say
          </div>
          <h2 className="proof-headline font-display text-[clamp(32px,4vw,52px)] text-center mb-16">
            real words from <em className="italic text-terracotta">real</em> people.
          </h2>
          <div className="proof-grid grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { q: 'i found my first proper paid gig in three days. it actually explained what the job would be like day to day which??? no other app does that', who: 'mia, 22 — social media pa' },
              { q: 'it didn\'t make me feel broken for needing things a certain way. it just found work that fits. i cried a little ngl', who: 'ellie, 21 — gap year, self-diagnosed adhd' },
              { q: 'the ai remembers what i told it. came back after a week and it said \'hey, did you decide about that copywriting thing?\' i was actually obsessed', who: 'jade, 23 — just graduated' }
            ].map((p, i) => (
              <div key={i} className="proof-card bg-white border border-black/10 rounded-2xl p-6 opacity-0 translate-y-10">
                <p className="font-display text-[15px] italic leading-relaxed text-dark-text mb-5">
                  “{p.q}”
                </p>
                <div className="font-mono text-[9px] tracking-widest text-soft-grey pt-4 border-t border-black/10">
                  <span className="text-terracotta mr-1">✦</span> {p.who}
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
            <span className="w-6 h-[0.5px] bg-terracotta" />
            built for your brain
          </div>
          <h2 className="nd-headline font-display text-[clamp(36px,5vw,64px)] leading-none mb-20 max-w-[20ch]">
            what nobody else <em className="italic text-terracotta">understands.</em>
          </h2>
          <div className="flex flex-col">
            {[
              { label: 'task paralysis is real, not laziness', body: 'when you open an app and freeze, that\'s not a character flaw — it\'s a neurological reality. <strong class="text-dark-text font-medium">florr gives you one thing to do. not a list. one.</strong> the ai picks it based on what actually matters right now.' },
              { label: 'job listings are written in the wrong language', body: 'every other platform dumps the raw listing on you. florr\'s ai translates every gig into plain english — <strong class="text-dark-text font-medium">what you\'d actually do day to day, what the energy is like, what to watch out for.</strong> no corporate gibberish.' },
              { label: 'asking for money is hard when you have RSD', body: 'rejection sensitive dysphoria makes invoicing feel like asking to be rejected. <strong class="text-dark-text font-medium">florr writes the follow-up email, you tap send.</strong> no composition, no tone-policing yourself, no four-month avoidance spiral.' },
              { label: 'rest days are features, not failures', body: 'florr is the first work tool that treats a rest day as intentional, not empty. <strong class="text-dark-text font-medium">your energy state reshapes the whole app.</strong> low-energy days look different. high days look different. the system adapts to you.' }
            ].map((row, i) => (
              <div key={i} className="nd-row grid grid-cols-1 md:grid-cols-[1fr,2fr] gap-16 py-12 border-t border-black/10 opacity-0 translate-y-6 last:border-bottom">
                <div className="font-display text-[22px] italic text-deep-plum leading-tight">{row.label}</div>
                <div className="text-sm leading-relaxed text-soft-grey font-light" dangerouslySetInnerHTML={{ __html: row.body }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-40 px-10 text-center overflow-hidden">
        <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-soft-grey mb-8">your brain has been right this whole time ✹</div>
        <h2 className="cta-headline font-display text-[clamp(42px,7vw,88px)] leading-none tracking-tighter mb-10">
          {"ready to get paid?".split(' ').map((word, i) => (
            <span key={i} className="cta-word inline-block mr-[0.25em]">
              {word === 'get' ? <em className="italic text-terracotta">{word}</em> : word}
            </span>
          ))}
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <button onClick={onStart} className="px-8 py-4 bg-deep-plum text-warm-cream rounded-full text-sm font-medium hover:opacity-85 transition-opacity">
            find me a gig →
          </button>
          <a href="#how" className="px-8 py-4 border border-black/20 text-soft-grey rounded-full text-[13px] font-medium hover:text-dark-text hover:border-dark-text transition-all">
            learn more
          </a>
        </div>
        <p className="mt-6 font-mono text-[10px] tracking-widest text-soft-grey uppercase">free to start · made by nd people · backed by an ed psych</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-display text-[15px] tracking-widest text-soft-grey">florr<span className="text-terracotta">✹</span></div>
        <div className="font-mono text-[9px] tracking-widest text-soft-grey uppercase">@florrworld · made for brains like yours</div>
        <a href="#" className="text-[12px] text-soft-grey hover:text-dark-text transition-colors">back to top ↑</a>
      </footer>
    </div>
  );
}
