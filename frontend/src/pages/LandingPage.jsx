import React, { useEffect, useRef, useState } from 'react';
import HeroSection from '../components/landing/HeroSection';
import ArchitectureScroll from '../components/landing/ArchitectureScroll';
import ContactFooter from '../components/landing/ContactFooter';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const containerRef = useRef(null);
  const globeRef = useRef(null);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate global particles (triangles) for the background
    const p = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      animationDuration: 15 + Math.random() * 20 + 's',
      animationDelay: -Math.random() * 20 + 's',
      colorClass: ['border-b-accent', 'border-b-accent-alt', 'border-b-accent-alt2', 'border-b-white/20'][Math.floor(Math.random() * 4)],
      size: 5 + Math.random() * 15 + 'px'
    }));
    setParticles(p);

    let ctx = gsap.context(() => {
      // 1. Continuous rotation (like a globe)
      gsap.to(globeRef.current, {
        rotation: 360,
        duration: 40,
        repeat: -1,
        ease: "none"
      });

      // 2. Travel across screen on scroll (top-right to bottom-left)
      gsap.to(globeRef.current, {
        x: () => -window.innerWidth * 0.8, // move left across 80% of screen
        y: () => window.innerHeight * 0.8, // move down across 80% of screen
        scale: 0.6,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.5
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="bg-background text-primary relative">
      
      {/* Global Particles */}
      <div 
        className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-40"
        style={{
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 70%, transparent 100%)',
          maskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 70%, transparent 100%)'
        }}
      >
        {particles.map(p => (
          <div 
            key={p.id} 
            className={`particle ${p.colorClass}`}
            style={{ 
              left: p.left, 
              animationDuration: p.animationDuration,
              animationDelay: p.animationDelay,
              borderLeftWidth: p.size,
              borderRightWidth: p.size,
              borderBottomWidth: `calc(${p.size} * 1.7)` 
            }}
          />
        ))}
      </div>

      {/* Global Dynamic Traveling Globe */}
      <div 
        ref={globeRef}
        className="fixed top-0 right-0 w-[600px] h-[600px] md:w-[900px] md:h-[900px] opacity-40 mix-blend-screen pointer-events-none z-0 translate-x-1/4 -translate-y-1/4 origin-center"
      >
        <img src="/abstract_3d_sphere.jpg" alt="3D Geometric Core" className="w-full h-full object-cover rounded-full" />
      </div>

      <div className="relative z-10">
        <HeroSection />
        <ArchitectureScroll />
        <ContactFooter />
      </div>
    </div>
  );
}
