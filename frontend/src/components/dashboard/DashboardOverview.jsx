import React from 'react';
import { Activity, ShieldCheck, Cpu, Database, BrainCircuit, Globe, Zap, CheckCircle2 } from 'lucide-react';

export default function DashboardOverview() {
  const architectures = [
    {
      title: "Acoustic & Synthetics Engine",
      icon: <Activity className="text-accent w-6 h-6" />,
      delay: "delay-100",
      points: [
        "Wav2Vec2 Foundation: Utilizes a heavily fine-tuned Wav2Vec2 transformer trained on the extensive IndicSynth dataset.",
        "Artefact Detection: Identifies micro-artefacts and unnatural frequency distributions typical in vocoder-generated speech.",
        "Prosody Analysis: Monitors emotional variance and speech rhythm to detect mechanical pacing common in cloned audio.",
        "Latency: Sub-200ms processing threshold ensuring real-time interception."
      ]
    },
    {
      title: "Biometric Identity Verification",
      icon: <Database className="text-accent-alt w-6 h-6" />,
      delay: "delay-200",
      points: [
        "ECAPA-TDNN Architecture: Extracts a dense 192-dimensional voiceprint vector from the caller's audio stream.",
        "Metric Learning: Employs Angular Prototypical loss to maximize the distance between imposters and true speakers.",
        "Dynamic Enrollment: Profiles are continuously updated, adapting to channel variations (e.g., VoIP vs Cellular).",
        "Anti-Spoofing: Cross-references the biometric match with the acoustic engine to prevent replay attacks."
      ]
    },
    {
      title: "Contextual NLP & Intent Engine",
      icon: <BrainCircuit className="text-accent-alt2 w-6 h-6" />,
      delay: "delay-300",
      points: [
        "Zero-Shot Translation: Instantly translates incoming regional dialects to English via a specialized transformer.",
        "Semantic Risk Scoring: NLP models scan the transcript for high-risk phrases, urgency vectors, and social engineering patterns.",
        "Contextual Awareness: Correlates the conversational context with known Smishing/Vishing campaign playbooks.",
        "Continuous Learning: The model feedback loop trains on newly flagged fraud patterns daily."
      ]
    }
  ];

  return (
    <div className="p-8 h-full flex flex-col relative overflow-y-auto">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-alt/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl">
        <div className="mb-12">
          <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-4">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold text-white tracking-widest uppercase">System Architecture</span>
          </div>
          <h1 className="text-4xl font-medium text-white tracking-tight mb-2">VIVID Detection Pipeline</h1>
          <p className="text-lg text-secondary">A comprehensive overview of how VIVID analyzes, intercepts, and flags sophisticated voice clones and fraud attempts in real-time.</p>
        </div>

        <div className="space-y-8">
          {architectures.map((layer, idx) => (
            <div 
              key={idx} 
              className={`bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-500 transform hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(139,92,246,0.1)] animate-fade-in-up ${layer.delay}`}
            >
              <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-white/5">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 relative group">
                  <div className="absolute inset-0 bg-accent/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">{layer.icon}</div>
                </div>
                <h2 className="text-2xl font-medium text-white tracking-tight">{layer.title}</h2>
              </div>
              
              <ul className="space-y-4">
                {layer.points.map((point, i) => {
                  const [boldPart, restPart] = point.split(': ');
                  return (
                    <li key={i} className="flex items-start space-x-3 group">
                      <div className="mt-1 flex-shrink-0 relative">
                        <CheckCircle2 className="w-5 h-5 text-secondary group-hover:text-accent transition-colors duration-300" />
                        <div className="absolute inset-0 bg-accent/50 rounded-full blur-sm scale-0 group-hover:scale-150 transition-transform duration-300 opacity-0 group-hover:opacity-100"></div>
                      </div>
                      <p className="text-secondary leading-relaxed">
                        <strong className="text-white font-medium">{boldPart}:</strong> {restPart || boldPart}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Unified Dashboard Explanation */}
        <div className="mt-12 bg-gradient-to-r from-accent/10 to-accent-alt/10 border border-accent/20 rounded-2xl p-8 relative overflow-hidden animate-fade-in-up delay-500">
          <div className="absolute top-1/2 left-0 w-1 h-1/2 -translate-y-1/2 bg-accent shadow-[0_0_15px_#8B5CF6] rounded-r-md"></div>
          <h3 className="text-xl font-bold text-white mb-3">The Unified Verdict</h3>
          <p className="text-secondary leading-relaxed">
            VIVID does not rely on a single point of failure. The independent outputs of the Acoustic, Biometric, and Contextual engines are fed into an ensemble ML decision layer. This layer computes a final, unified <strong className="text-white">Fraud Risk Score</strong> (Safe, Risky, or Critical) with zero latency. The results are instantly streamed via WebSockets to the agent's live dashboard, ensuring they have explainable AI insights before the fraudster can execute their payload.
          </p>
        </div>

      </div>
    </div>
  );
}
