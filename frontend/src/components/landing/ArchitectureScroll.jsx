import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Activity, Fingerprint, BrainCircuit, ShieldCheck } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function ArchitectureScroll() {
  const containerRef = useRef(null);
  
  const sections = [
    {
      title: "Layer 1: Acoustic Anomalies",
      subtitle: "Millisecond Deepfake Detection",
      icon: <Activity className="text-accent w-8 h-8" />,
      description: "Standard acoustic models fail against modern AI voice cloning. VIVID utilizes a Wav2Vec2 transformer fine-tuned on IndicSynth and rigorously tested against ASVspoof benchmarks. By combining this with real-time prosody analysis, VIVID achieves unmatched accuracy in identifying synthetic audio anomalies.",
      side: "left"
    },
    {
      title: "Layer 2: Biometric Identity",
      subtitle: "192-D Voiceprint Extraction",
      icon: <Fingerprint className="text-accent-alt w-8 h-8" />,
      description: "Traditional verification systems fall into the 'Softmax Trap.' VIVID bypasses this by extracting dense 192-D voiceprints using Metric Learning (ECAPA-TDNN). With dynamic profile enrollment, it seamlessly verifies a speaker's true identity across any telecom network.",
      side: "right"
    },
    {
      title: "Layer 3: Intent & Context",
      subtitle: "Zero-Shot Multilingual Processing",
      icon: <BrainCircuit className="text-accent-alt2 w-8 h-8" />,
      description: "We don't just verify the voice; we analyze the intent. VIVID employs a Zero-Shot Multilingual Translation layer to process regional languages instantly. The transcripts are fed into a lightning-fast SVC engine, flagging Social Engineering and Smishing attempts in milliseconds.",
      side: "left"
    },
    {
      title: "The Unified Verdict",
      subtitle: "Zero Latency. Zero Compromises.",
      icon: <ShieldCheck className="text-white w-8 h-8" />,
      description: "VIVID fuses spoof probability, speaker similarity, and contextual risk into a single, actionable dashboard. It doesn't just score risk; it provides explainable AI insights directly to your agents during the live call.",
      side: "right"
    }
  ];

  useEffect(() => {
    let ctx = gsap.context(() => {
      // 1. Animate panels appearing
      const panels = gsap.utils.toArray('.scroll-panel');
      panels.forEach((panel) => {
        gsap.fromTo(panel, 
          { opacity: 0, y: 150 },
          {
            opacity: 1, 
            y: 0,
            ease: "power2.out",
            scrollTrigger: {
              trigger: panel,
              start: "top 90%",
              end: "top 50%",
              scrub: 1
            }
          }
        );
      });

      // 2. Animate horizontal connection lines
      const horizLines = gsap.utils.toArray('.horizontal-progress');
      horizLines.forEach((line) => {
        gsap.fromTo(line,
          { width: "0%" },
          {
            width: "100%",
            ease: "none",
            scrollTrigger: {
              trigger: line.closest('.timeline-row'),
              start: "top 75%",
              end: "center center",
              scrub: 1
            }
          }
        );
      });

      // 3. Animate the central connecting line (vertical)
      gsap.fromTo('.scroll-line-progress',
        { height: "0%" },
        {
          height: "100%",
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 50%",
            end: "bottom 80%",
            scrub: 1
          }
        }
      );

      // 4. Animate connection dots lighting up
      const dots = gsap.utils.toArray('.connector-dot');
      dots.forEach((dot) => {
        gsap.fromTo(dot,
          { scale: 0, opacity: 0, backgroundColor: "#111" },
          {
            scale: 1,
            opacity: 1,
            backgroundColor: "#8B5CF6", // accent color
            boxShadow: "0 0 20px 5px rgba(139,92,246,0.5)",
            scrollTrigger: {
              trigger: dot,
              start: "top 70%",
              end: "top 50%",
              scrub: 1
            }
          }
        );
      });

    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="py-24 relative overflow-hidden min-h-[400vh]">
      
      {/* Intro text */}
      <div className="text-center max-w-3xl mx-auto mb-[20vh] mt-12 relative z-10 px-4">
        <div className="inline-flex items-center space-x-3 bg-white/5 border border-white/10 rounded-full px-5 py-2 mb-6 backdrop-blur-sm">
          {/* Custom geometric glowing triangle icon matching the WebGL background */}
          <svg width="18" height="18" viewBox="0 0 24 24" className="text-accent animate-pulse drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" fill="currentColor">
            <path d="M12 2L22 20H2L12 2Z" />
          </svg>
          <span className="text-sm font-medium text-white tracking-widest uppercase">Sequential ML Pipeline</span>
        </div>
        <h2 className="text-5xl md:text-6xl font-medium text-white tracking-tight leading-tight">
          A Multi-Layered Approach to <span className="italic text-secondary">Absolute Verification.</span>
        </h2>
      </div>

      {/* Timeline Container */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 mt-[20vh] pb-[20vh] z-10">
        
        {/* Central Vertical Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-white/10 -translate-x-1/2 z-0 hidden md:block">
           <div className="scroll-line-progress w-full bg-gradient-to-b from-accent via-accent-alt to-accent-alt2 h-0 shadow-[0_0_15px_rgba(139,92,246,0.5)]"></div>
        </div>

        {sections.map((section, idx) => (
          <div key={idx} className={`timeline-row flex w-full ${section.side === 'left' ? 'md:justify-start' : 'md:justify-end'} justify-center mb-24 md:mb-[40vh] relative`}>
            
            {/* 50% width column containing the panel and connections (100% on mobile) */}
            <div className={`w-full md:w-[50%] flex ${section.side === 'left' ? 'md:justify-end md:pr-12' : 'md:justify-start md:pl-12'} relative`}>
               
               {/* Horizontal animated connection line (Hidden on mobile) */}
               <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 h-[2px] bg-white/10 z-0
                  ${section.side === 'left' ? 'right-0 w-12' : 'left-0 w-12'}
               `}>
                 <div className={`horizontal-progress h-full w-0 ${section.side === 'left' ? 'ml-auto bg-gradient-to-l' : 'bg-gradient-to-r'} from-accent to-transparent shadow-[0_0_10px_rgba(139,92,246,0.5)]`}></div>
               </div>

               {/* Central Node Dot (Hidden on mobile) */}
               <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-[3px] border-[#050505] bg-gray-800 z-20 connector-dot
                  ${section.side === 'left' ? '-right-[10px]' : '-left-[10px]'}
               `}></div>

               {/* Actual Content Panel */}
               <div className="scroll-panel relative z-10 w-full max-w-lg bg-black/60 backdrop-blur-2xl p-8 md:p-10 rounded-3xl border border-white/10 shadow-2xl">
                 <div className="flex items-center space-x-4 mb-6">
                   <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                     {section.icon}
                   </div>
                   <div>
                     <p className="text-xs font-bold text-accent tracking-widest uppercase mb-1">{section.subtitle}</p>
                     <h3 className="text-xl md:text-2xl font-medium text-white tracking-tight">{section.title}</h3>
                   </div>
                 </div>
                 <p className="text-sm md:text-base text-secondary leading-relaxed font-light">{section.description}</p>
               </div>

            </div>
          </div>
        ))}
        
      </div>
    </div>
  );
}
