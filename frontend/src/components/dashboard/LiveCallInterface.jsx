import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, ShieldAlert, ShieldCheck, Upload, File, Loader2, Activity, X, User } from 'lucide-react';
import { convertBlobToWav } from '../../utils/audioConverter';
import { useAuth } from '../../context/AuthContext';

// Timeline chart with gridlines, Y-axis labels, and data point values
function TimelineChart({ data, color, label, maxVal = 100, thresholdVal = null }) {
  if (!data || data.length === 0) return null;
  const pad = 40; // left padding for Y-axis labels
  const padR = 10;
  const h = 100, w = 460;
  const chartW = w - pad - padR;
  const step = chartW / Math.max(data.length - 1, 1);
  const gridLines = [0, 25, 50, 75, 100];
  const points = data.map((v, i) => `${pad + i * step},${h - (v / maxVal) * h}`).join(' ');
  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  const peak = Math.max(...data);
  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-1">
        <p className="text-xs text-secondary font-medium">{label}</p>
        <div className="flex space-x-3 text-[10px] font-mono">
          <span className="text-gray-400">AVG: <span style={{color}}>{avg.toFixed(1)}%</span></span>
          <span className="text-gray-400">PEAK: <span style={{color}}>{peak.toFixed(1)}%</span></span>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h + 16}`} className="w-full bg-black/50 rounded border border-gray-800" style={{height: '120px'}}>
        {/* Gridlines + Y-axis labels */}
        {gridLines.map(val => {
          const y = h - (val / maxVal) * h;
          return (
            <g key={val}>
              <line x1={pad} y1={y} x2={w - padR} y2={y} stroke="#333" strokeWidth="0.5" strokeDasharray="4,3" />
              <text x={pad - 4} y={y + 3} textAnchor="end" fill="#666" fontSize="8" fontFamily="monospace">{val}%</text>
            </g>
          );
        })}
        {/* Threshold line */}
        {thresholdVal != null && (
          <g>
            <line x1={pad} y1={h - (thresholdVal / maxVal) * h} x2={w - padR} y2={h - (thresholdVal / maxVal) * h} stroke="#ef4444" strokeWidth="1" strokeDasharray="6,3" opacity="0.6" />
            <text x={w - padR + 2} y={h - (thresholdVal / maxVal) * h + 3} fill="#ef4444" fontSize="7" fontFamily="monospace" opacity="0.7">THR</text>
          </g>
        )}
        {/* Data line */}
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} strokeLinejoin="round" />
        {/* Data points with value labels */}
        {data.map((v, i) => {
          const cx = pad + i * step;
          const cy = h - (v / maxVal) * h;
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r="3" fill={color} />
              <text x={cx} y={cy - 6} textAnchor="middle" fill={color} fontSize="7" fontFamily="monospace" fontWeight="bold">
                {v.toFixed(0)}
              </text>
            </g>
          );
        })}
        {/* X-axis time labels */}
        {data.map((_, i) => (
          <text key={i} x={pad + i * step} y={h + 12} textAnchor="middle" fill="#555" fontSize="7" fontFamily="monospace">
            {i * 4}s
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function LiveCallInterface() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('live');
  
  // Live Call State
  const [callActive, setCallActive] = useState(false);
  const [timer, setTimer] = useState(0);
  
  // Upload State
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  // Unified Metrics State
  const defaultMetrics = { spoof: 0, prosody: 0, voiceMatch: 0, risk: 'SAFE', action: 'ALLOW', transcript: '', contextRisk: 'SAFE', matchedSpeaker: null };
  const [metrics, setMetrics] = useState(defaultMetrics);

  // ML Workflow States
  const [tempAudioId, setTempAudioId] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollName, setEnrollName] = useState('');
  const [enrollStatus, setEnrollStatus] = useState(null);
  const [enrollMessage, setEnrollMessage] = useState('');
  
  // Summary State
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const metricsHistory = useRef([]);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');

  // Session-level contextual fraud memory: once fraud is detected in ANY chunk, it persists
  const sessionFraudDetected = useRef(false);
  const finalSpeakerName = useRef(null);
  const fullCallAudioChunks = useRef([]);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current._chunkInterval) {
        clearInterval(mediaRecorderRef.current._chunkInterval);
      }
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  const applyApiResponse = (data) => {
    // Session-level fraud memory: once risk is high, flag it
    if (data.context_risk >= 70.0) {
      sessionFraudDetected.current = true;
    }

    const effectiveContextRisk = data.context_risk || 0;
    
    // Escalate overall risk if session fraud detected
    let effectiveRisk = data.risk_assessment?.category || 'SAFE';
    let effectiveAction = data.risk_assessment?.action || 'ALLOW';
    if (sessionFraudDetected.current && effectiveRisk === 'SAFE') {
      effectiveRisk = 'RISKY';
      effectiveAction = 'CHALLENGE';
    }

    const newMetrics = {
      spoof: data.spoof_probability * 100 || 0,
      prosody: data.prosodic_anomaly * 100 || 0,
      voiceMatch: data.speaker_similarity * 100 || 0,
      risk: effectiveRisk,
      action: effectiveAction,
      transcript: data.prediction || 'Analysis in progress...',
      contextRisk: effectiveContextRisk,
      matchedSpeaker: data.matched_speaker || null
    };
    
    if (data.matched_speaker) {
      finalSpeakerName.current = data.matched_speaker;
    }
    
    setMetrics(newMetrics);
    metricsHistory.current.push(newMetrics);
    return newMetrics;
  };

  useEffect(() => {
    if (activeTab !== 'live') return;

    const startRecording = async () => {
      try {
        let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        const headset = audioInputs.find(d => 
          d.label.toLowerCase().includes('headset') || 
          d.label.toLowerCase().includes('usb') || 
          d.label.toLowerCase().includes('bluetooth')
        );
        
        stream.getTracks().forEach(track => track.stop());

        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            deviceId: headset ? { exact: headset.deviceId } : undefined,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000
          }
        });
        
        if (headset) console.log(`Using headset: ${headset.label}`);
        
        streamRef.current = stream;
        
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        mediaRecorderRef.current = mediaRecorder;

        let chunkBuffer = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunkBuffer.push(e.data);
            fullCallAudioChunks.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          if (chunkBuffer.length === 0) return;
          const completeBlob = new Blob(chunkBuffer, { type: 'audio/webm' });
          chunkBuffer = [];
          
          if (completeBlob.size < 1000) return;
          
          try {
            const wavBlob = await convertBlobToWav(completeBlob);
            const formData = new FormData();
            formData.append('file', wavBlob, 'chunk.wav');

            const response = await fetch('http://localhost:9000/predict', {
              method: 'POST',
              body: formData
            });

            if (response.ok) {
              const data = await response.json();

              if (data.unrecognized_speaker && data.temp_audio_id) {
                setTempAudioId(data.temp_audio_id);
              }
              
              applyApiResponse(data);
            }
          } catch (err) {
            console.error("ML Backend Error:", err);
          }
        };

        mediaRecorder.start(500);

        const chunkInterval = setInterval(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            // Start instantly to avoid dropping audio
            mediaRecorderRef.current.start(500);
          }
        }, 4000);

        timerIntervalRef.current = setInterval(() => {
          setTimer(t => t + 1);
        }, 1000);

        mediaRecorderRef.current._chunkInterval = chunkInterval;

      } catch (err) {
        console.error("Microphone access denied:", err);
        setCallActive(false);
      }
    };

    if (callActive) {
      metricsHistory.current = [];
      fullCallAudioChunks.current = [];
      sessionFraudDetected.current = false;
      finalSpeakerName.current = null;
      setTimer(0);
      setMetrics(defaultMetrics);
      startRecording();
    } else {
      stopRecording();
    }

    return () => {
      stopRecording();
    };
  }, [callActive, activeTab]);

  // Modals Logic
  const handleSaveVoiceprint = async () => {
    if (!enrollName.trim()) return;
    
    setEnrollStatus('checking');
    try {
      const checkRes = await fetch(`http://localhost:9000/check-speaker-name?name=${encodeURIComponent(enrollName)}`);
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists) {
          setEnrollStatus('exists');
          return;
        }
      }
    } catch (e) {
      console.error('Name check failed:', e);
    }
    
    await submitEnrollment();
  };

  const submitEnrollment = async () => {
    setEnrollStatus('enrolling');
    try {
      const fd = new FormData();
      fd.append('name', enrollName);
      
      if (activeTab === 'live' && fullCallAudioChunks.current.length > 0) {
        const completeBlob = new Blob(fullCallAudioChunks.current, { type: 'audio/webm' });
        const wavBlob = await convertBlobToWav(completeBlob);
        fd.append('file', wavBlob, 'full_call.wav');
      } else if (activeTab === 'upload' && file) {
        fd.append('file', file, 'upload.wav');
      } else if (tempAudioId) {
        fd.append('temp_audio_id', tempAudioId);
      }

      const res = await fetch('http://localhost:9000/enroll-speaker', { method: 'POST', body: fd });
      if (res.ok) {
        const resData = await res.json();
        finalSpeakerName.current = resData.speaker;
        setEnrollMessage(resData.message || 'Voiceprint saved.');
        setEnrollStatus('success');
        
        // Trigger top-left toast notification
        setToastMessage(`Success: AI Model instantly retrained on ${resData.speaker}'s voice.`);
        setTimeout(() => setToastMessage(''), 4000);

        setTimeout(() => {
          finishSessionAndSaveHistory();
          setEnrollStatus(null);
          setEnrollName('');
          setEnrollMessage('');
        }, 3000);
      } else {
         setEnrollStatus(null);
      }
    } catch (e) {
      console.error(e);
      setEnrollStatus(null);
    }
  };

  const handleFileUpload = (e) => {
    const selected = e.target.files[0];
    if (selected && (selected.type === 'audio/mpeg' || selected.type === 'audio/wav' || selected.name.endsWith('.mp3') || selected.name.endsWith('.wav'))) {
      setFile(selected);
      setUploadComplete(false);
      setMetrics(defaultMetrics);
    } else {
      alert("Please upload a valid .mp3 or .wav audio file.");
    }
  };

  const processUploadedAudio = async () => {
    if (!file) return;
    setIsProcessing(true);
    setUploadComplete(false);
    sessionFraudDetected.current = false;
    finalSpeakerName.current = null;
    metricsHistory.current = [];
    
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('http://localhost:9000/predict', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();

            if (data.unrecognized_speaker && data.temp_audio_id) {
                setTempAudioId(data.temp_audio_id);
            }
            
            applyApiResponse(data);
        }
    } catch(e) {
        console.error(e);
        alert("Backend Analysis Failed. Ensure main.py is running. Error: " + e.message);
    } finally {
        setIsProcessing(false);
        setUploadComplete(true);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const saveHistoryLog = async (avgSpoof, avgProsody, avgMatch, threatScore, verdict) => {
    if (!user) {
      console.log("User not logged in, skipping history save.");
      return;
    }
    try {
      const payload = {
        speakerName: finalSpeakerName.current || 'Unknown Caller',
        spoofScore: avgSpoof,
        prosodyScore: avgProsody,
        speakerScore: avgMatch,
        contextScore: sessionFraudDetected.current ? 'CRITICAL' : 'SAFE',
        verdict: verdict
      };
      await fetch('http://localhost:5000/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error("Failed to save history log:", e);
    }
  };

  const finishSessionAndSaveHistory = async () => {
    const hist = metricsHistory.current;
    if (hist.length > 0) {
      const avgSpoof = hist.reduce((a, m) => a + m.spoof, 0) / hist.length;
      const avgProsody = hist.reduce((a, m) => a + m.prosody, 0) / hist.length;
      const avgMatch = hist.reduce((a, m) => a + m.voiceMatch, 0) / hist.length;
      const peakSpoof = Math.max(...hist.map(m => m.spoof));
      const hadFraud = sessionFraudDetected.current;
      const speakerVerified = avgMatch >= 55;
      const threatScore = Math.min(100, (avgSpoof * 0.35) + (avgProsody * 0.25) + ((100 - avgMatch) * 0.2) + (hadFraud ? 20 : 0));
      
      let verdict;
      if (threatScore >= 60 || hadFraud || peakSpoof >= 75) verdict = 'HIGH RISK';
      else if (threatScore >= 35 || !speakerVerified) verdict = 'MODERATE RISK';
      else verdict = 'SAFE';

      await saveHistoryLog(avgSpoof, avgProsody, avgMatch, threatScore, verdict);
    }
    
    setShowSummaryModal(false);
    setShowEnrollModal(false);
    setTimer(0);
    setMetrics(defaultMetrics);
    sessionFraudDetected.current = false;
    finalSpeakerName.current = null;
    fullCallAudioChunks.current = [];
  };

  // Determine display name for caller
  const callerName = metrics.matchedSpeaker 
    ? metrics.matchedSpeaker.charAt(0).toUpperCase() + metrics.matchedSpeaker.slice(1)
    : 'Unknown Caller';

  return (
    <div className="relative h-full flex flex-col p-8 pb-4 overflow-y-auto">
      
      {/* Top-Left Toast Notification for Retraining */}
      {toastMessage && (
        <div className="absolute top-4 left-4 z-50 bg-green-600/95 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center space-x-2 border border-green-400/50 transition-all duration-300 transform translate-y-0 opacity-100">
          <ShieldCheck size={18} />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Call Simulation</h1>
          <p className="text-secondary mt-1">Test the VIVID engine via WebRTC or Audio File Upload</p>
        </div>
        
        {/* Unified Verdict Badge */}
        <div className={`px-6 py-3 rounded-full flex flex-col items-center justify-center font-bold text-white shadow-sm transition-colors duration-500 ${
          (activeTab === 'live' && !callActive) || (activeTab === 'upload' && !uploadComplete) ? 'bg-gray-300 text-gray-800' :
          metrics.risk === 'SAFE' ? 'bg-green-500' :
          metrics.risk === 'RISKY' ? 'bg-yellow-500' : 'bg-red-600 animate-pulse'
        }`}>
          <div className="flex items-center space-x-2">
            {metrics.risk === 'CRITICAL' ? <ShieldAlert /> : <ShieldCheck />}
            <span>{
              activeTab === 'live' ? (callActive ? metrics.risk : 'INACTIVE') : 
              (uploadComplete ? metrics.risk : 'AWAITING AUDIO')
            }</span>
          </div>
          {(callActive || uploadComplete) && (
            <span className="text-xs opacity-90 mt-1">ACTION: {metrics.action}</span>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex space-x-2 mb-8 bg-black/40 p-1.5 rounded-lg w-max border border-border">
        <button 
          onClick={() => { setActiveTab('live'); setCallActive(false); setUploadComplete(false); setMetrics(defaultMetrics); sessionFraudDetected.current = false; finalSpeakerName.current = null; }}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === 'live' ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-secondary hover:text-white'}`}
        >
          Live WebRTC Stream
        </button>
        <button 
          onClick={() => { setActiveTab('upload'); if (callActive && timer > 0) setShowSummaryModal(true); setCallActive(false); setUploadComplete(false); setMetrics(defaultMetrics); sessionFraudDetected.current = false; finalSpeakerName.current = null; }}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === 'upload' ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-secondary hover:text-white'}`}
        >
          Upload Recording
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Input Control */}
        <div className="col-span-1 flex flex-col space-y-6">
          
          {activeTab === 'live' ? (
            <div className="bg-[#111111] p-6 rounded-xl shadow-sm border border-border flex flex-col items-center justify-center py-12 relative overflow-hidden">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${callActive ? 'bg-accent/20 ring-4 ring-accent/30' : 'bg-gray-800'}`}>
                {metrics.matchedSpeaker ? (
                  <User size={48} className="text-green-400" />
                ) : (
                  <Mic size={48} className={callActive ? 'text-accent animate-pulse' : 'text-gray-500'} />
                )}
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{callerName}</h2>
              {metrics.matchedSpeaker && callActive && (
                <p className="text-xs text-green-400 mb-2">✓ Identity Verified</p>
              )}
              <p className="text-3xl font-mono text-secondary mb-8">{formatTime(timer)}</p>
              
              <button 
                onClick={() => {
                  if (callActive && timer > 0) {
                    setShowSummaryModal(true);
                  }
                  setCallActive(!callActive);
                }}
                className={`w-full py-4 rounded-full font-bold text-white flex items-center justify-center space-x-2 transition-transform active:scale-95 ${callActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
              >
                {callActive ? (
                  <><PhoneOff size={24} /><span>End Call</span></>
                ) : (
                  <><Phone size={24} /><span>Simulate Call</span></>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-[#111111] p-6 rounded-xl shadow-sm border border-border flex flex-col">
               <h3 className="text-lg font-bold text-white mb-4">Upload Audio Evidence</h3>
               
               <label 
                 htmlFor="audio-upload"
                 className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors mb-6 cursor-pointer ${file ? 'border-accent bg-accent/5' : 'border-gray-700 hover:border-gray-500 hover:bg-white/5'}`}
               >
                 <input id="audio-upload" type="file" className="hidden" onChange={handleFileUpload} accept=".mp3,.wav,audio/*" />
                 {file ? (
                   <>
                     <File className="w-12 h-12 text-accent mb-3" />
                     <p className="text-white font-medium truncate max-w-full">{file.name}</p>
                     <p className="text-xs text-secondary mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                   </>
                 ) : (
                   <>
                     <Upload className="w-12 h-12 text-gray-500 mb-3" />
                     <p className="text-white font-medium">Click to Upload or Drag & Drop</p>
                     <p className="text-xs text-secondary mt-1">Supports .mp3, .wav (Max 10MB)</p>
                   </>
                 )}
               </label>

               <button 
                  onClick={processUploadedAudio}
                  disabled={!file || isProcessing}
                  className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center space-x-2 transition-all ${!file ? 'bg-gray-800 cursor-not-allowed text-gray-500' : isProcessing ? 'bg-accent/80 cursor-wait' : 'bg-accent hover:bg-accent-hover'}`}
               >
                 {isProcessing ? (
                   <><Loader2 className="w-5 h-5 animate-spin" /><span>Processing AI Models...</span></>
                 ) : uploadComplete ? (
                   <><ShieldCheck className="w-5 h-5" /><span>Re-Analyze File</span></>
                 ) : (
                   <><Activity className="w-5 h-5" /><span>Start ML Analysis</span></>
                 )}
               </button>
            </div>
          )}
        </div>

        {/* Right Column: Telemetry Panes */}
        <div className="col-span-2 flex flex-col space-y-6 relative">
          
          {/* Layer 1: Spoof & Prosody */}
          <div className="bg-[#111111] p-6 rounded-xl shadow-sm border border-border">
            <h3 className="text-lg font-bold text-white mb-4">Layer 1: Acoustic Anomalies</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-secondary">Wav2Vec2 Spoof Probability</span>
                  <span className="font-mono text-white">{metrics.spoof.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-2.5 rounded-full transition-all duration-500 ${metrics.spoof > 60 ? 'bg-red-500' : metrics.spoof > 40 ? 'bg-yellow-500' : 'bg-accent'}`} style={{ width: `${metrics.spoof}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-secondary">Prosodic Anomaly Score</span>
                  <span className="font-mono text-white">{metrics.prosody.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-2.5 rounded-full transition-all duration-500 ${metrics.prosody > 60 ? 'bg-red-500' : 'bg-accent'}`} style={{ width: `${metrics.prosody}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Layer 2: Biometrics */}
          <div className="bg-[#111111] p-6 rounded-xl shadow-sm border border-border">
             <h3 className="text-lg font-bold text-white mb-4">Layer 2: Speaker Verification (ECAPA-TDNN)</h3>
             <div className="flex items-center space-x-6">
               <div className="relative w-24 h-24">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle className="text-gray-800" strokeWidth="3" stroke="currentColor" fill="transparent" r="15.9155" cx="18" cy="18" />
                    <circle className={`transition-all duration-500 ${metrics.voiceMatch < 55 ? 'text-red-500' : 'text-green-500'}`} strokeDasharray={`${metrics.voiceMatch}, 100`} strokeWidth="3" stroke="currentColor" fill="transparent" r="15.9155" cx="18" cy="18" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xl text-white">
                    {metrics.voiceMatch.toFixed(0)}%
                  </div>
               </div>
               <div className="flex-1">
                 <p className="text-sm text-secondary font-medium uppercase tracking-wider">Identity Match Confidence</p>
                 {/* Prominent Verification Result Badge */}
                 {(callActive || uploadComplete) && (
                   <div className={`inline-flex items-center space-x-2 mt-2 px-4 py-2 rounded-lg font-bold text-sm border ${
                     metrics.voiceMatch >= 55
                       ? 'bg-green-500/15 border-green-500/50 text-green-400'
                       : 'bg-red-500/15 border-red-500/50 text-red-400'
                   }`}>
                     {metrics.voiceMatch >= 55 ? (
                       <><ShieldCheck size={18} /><span>VERIFICATION SUCCESSFUL</span></>
                     ) : (
                       <><ShieldAlert size={18} /><span>VERIFICATION FAILED</span></>
                     )}
                   </div>
                 )}
                 {metrics.matchedSpeaker ? (
                   <p className="text-sm mt-2 text-green-400 font-semibold flex items-center space-x-1">
                     <User size={14} />
                     <span>Matched: {metrics.matchedSpeaker.charAt(0).toUpperCase() + metrics.matchedSpeaker.slice(1)}</span>
                   </p>
                 ) : (
                   <p className="text-sm mt-2 text-white">{metrics.voiceMatch >= 55 ? "Speaker verified against enrolled profile." : "Warning: Biometric mismatch or unknown speaker."}</p>
                 )}
               </div>
             </div>
          </div>

          {/* Layer 3: Contextual */}
          <div className="bg-[#111111] p-6 rounded-xl shadow-sm border border-border flex-1 flex flex-col">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-white">Layer 3: Contextual NLP Analysis</h3>
                {(callActive || uploadComplete) && (
                  <span className={`px-3 py-1 rounded text-xs font-bold ${metrics.contextRisk === 'CRITICAL' ? 'bg-red-500/20 text-red-500 border border-red-500/50' : metrics.contextRisk === 'RISKY' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 'bg-green-500/20 text-green-500 border border-green-500/50'}`}>
                    VERDICT: {metrics.contextRisk}
                    {sessionFraudDetected.current && <span className="ml-1">(LOCKED)</span>}
                  </span>
                )}
             </div>
             <div className="flex-1 bg-black rounded-md p-4 border border-border flex items-center justify-center min-h-[100px]">
                {activeTab === 'live' && callActive ? (
                  <div className="text-center">
                    {sessionFraudDetected.current ? (
                      <>
                        <p className="text-red-500 text-2xl font-bold mb-1">⚠ FRAUDULENT PATTERN DETECTED</p>
                        <p className="text-gray-400 text-xs">Phishing/fraud detected earlier in this session</p>
                      </>
                    ) : (
                      <p className="animate-pulse text-lg font-semibold text-white">Analyzing dialogue context...</p>
                    )}
                  </div>
                ) : (activeTab === 'upload' && uploadComplete) || (activeTab === 'live' && !callActive && timer > 0) ? (
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-2">NLP Threat Assessment</p>
                    <p className={`text-2xl font-bold ${metrics.contextRisk === 'CRITICAL' ? 'text-red-500' : metrics.contextRisk === 'RISKY' ? 'text-yellow-500' : 'text-green-500'}`}>
                      {metrics.contextRisk === 'CRITICAL' ? 'FRAUDULENT PATTERN DETECTED' : metrics.contextRisk === 'RISKY' ? 'SUSPICIOUS CONTEXT' : 'CONVERSATION SAFE'}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-600 italic">{activeTab === 'live' ? "Call not active. Awaiting audio stream..." : "Upload a file and run analysis to view contextual risk."}</p>
                )}
             </div>
          </div>

        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Enroll Speaker Modal */}
      {showEnrollModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-border p-8 rounded-xl max-w-md w-full shadow-2xl relative">
            <button onClick={() => { setShowEnrollModal(false); setEnrollStatus(null); setEnrollName(''); }} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-white mb-2">Unrecognized Speaker Detected</h2>
            <p className="text-secondary mb-6 text-sm">Caller voice not recognized (&lt; 60% match). Do you want to enroll this voice?</p>
            
            {!enrollStatus ? (
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={() => {
                    finishSessionAndSaveHistory();
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                  disabled={enrollStatus === 'enrolling' || enrollStatus === 'success'}
                >
                  Cancel
                </button>
                <button onClick={() => setEnrollStatus('input')} className="px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover transition">Save Voiceprint</button>
              </div>
            ) : enrollStatus === 'input' ? (
              <div className="space-y-4">
                <input 
                  type="text" 
                  value={enrollName}
                  onChange={(e) => setEnrollName(e.target.value)}
                  placeholder="Enter Speaker Name..." 
                  className="w-full bg-black border border-border rounded p-2 text-white"
                  autoFocus
                />
                <button onClick={handleSaveVoiceprint} disabled={!enrollName.trim()} className="w-full py-2 bg-accent text-white rounded hover:bg-accent-hover transition flex justify-center items-center disabled:opacity-50">
                  Save Voiceprint
                </button>
              </div>
            ) : enrollStatus === 'checking' ? (
              <div className="flex flex-col items-center justify-center py-4">
                <Loader2 className="w-8 h-8 animate-spin text-accent mb-2" />
                <p className="text-secondary text-sm">Checking speaker database...</p>
              </div>
            ) : enrollStatus === 'exists' ? (
              <div className="space-y-4">
                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                  <p className="text-yellow-400 font-semibold mb-1">⚠ Speaker "{enrollName}" already exists!</p>
                  <p className="text-secondary text-sm">Adding this recording as an additional sample will improve recognition accuracy for this speaker.</p>
                </div>
                <div className="flex space-x-3">
                  <button onClick={() => setEnrollStatus('input')} className="flex-1 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition">Go Back</button>
                  <button onClick={submitEnrollment} className="flex-1 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition">Add Sample Anyway</button>
                </div>
              </div>
            ) : enrollStatus === 'enrolling' ? (
              <div className="flex flex-col items-center justify-center py-4">
                <Loader2 className="w-8 h-8 animate-spin text-accent mb-2" />
                <p className="text-secondary text-sm">Saving audio sample...</p>
              </div>
            ) : enrollStatus === 'success' ? (
              <div className="flex flex-col items-center justify-center py-4">
                <ShieldCheck className="w-12 h-12 text-green-500 mb-2" />
                <p className="text-green-400 font-bold text-center">{enrollMessage || 'Audio sample saved!'}</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* 2. End Call / Upload Summary Modal with Timeline Charts */}
      {showSummaryModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111111] border border-border p-8 rounded-xl max-w-3xl w-full shadow-2xl relative my-8">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-800 pb-4">Call Session Summary</h2>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-black p-4 rounded-lg border border-gray-800">
                <p className="text-secondary text-xs mb-1">Duration</p>
                <p className="text-xl font-mono text-white">{formatTime(timer)}</p>
              </div>
              <div className="bg-black p-4 rounded-lg border border-gray-800">
                <p className="text-secondary text-xs mb-1">Final Verdict</p>
                <span className={`px-3 py-1 rounded font-bold text-sm ${metrics.risk === 'SAFE' ? 'bg-green-500 text-white' : metrics.risk === 'RISKY' ? 'bg-yellow-500 text-white' : 'bg-red-600 text-white'}`}>
                  {metrics.risk}
                </span>
              </div>
              <div className="bg-black p-4 rounded-lg border border-gray-800">
                <p className="text-secondary text-xs mb-1">Speaker</p>
                <p className="text-sm font-semibold text-white">{callerName}</p>
              </div>
              <div className="bg-black p-4 rounded-lg border border-gray-800">
                <p className="text-secondary text-xs mb-1">Context</p>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${sessionFraudDetected.current ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                  {sessionFraudDetected.current ? 'FRAUD DETECTED' : 'SAFE'}
                </span>
              </div>
            </div>

            {/* Peak Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-black p-3 rounded-lg border border-gray-800 text-center">
                <p className="text-secondary text-xs mb-1">Peak Spoof</p>
                <p className="text-lg font-mono text-white">
                  {metricsHistory.current.length > 0 ? Math.max(...metricsHistory.current.map(m => m.spoof)).toFixed(1) : 0}%
                </p>
              </div>
              <div className="bg-black p-3 rounded-lg border border-gray-800 text-center">
                <p className="text-secondary text-xs mb-1">Peak Prosody</p>
                <p className="text-lg font-mono text-white">
                  {metricsHistory.current.length > 0 ? Math.max(...metricsHistory.current.map(m => m.prosody)).toFixed(1) : 0}%
                </p>
              </div>
              <div className="bg-black p-3 rounded-lg border border-gray-800 text-center">
                <p className="text-secondary text-xs mb-1">Avg Speaker Match</p>
                <p className="text-lg font-mono text-white">
                  {metricsHistory.current.length > 0 ? (metricsHistory.current.reduce((acc, m) => acc + m.voiceMatch, 0) / metricsHistory.current.length).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            {/* Timeline Charts */}
            {metricsHistory.current.length > 1 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Session Timeline</h3>
                <div className="bg-black/50 p-4 rounded-xl border border-gray-800">
                  <TimelineChart 
                    data={metricsHistory.current.map(m => m.spoof)} 
                    color="#ef4444" 
                    label="Spoof Probability (%)" 
                    thresholdVal={75}
                  />
                  <TimelineChart 
                    data={metricsHistory.current.map(m => m.prosody)} 
                    color="#f59e0b" 
                    label="Prosodic Anomaly (%)" 
                    thresholdVal={80}
                  />
                  <TimelineChart 
                    data={metricsHistory.current.map(m => m.voiceMatch)} 
                    color="#22c55e" 
                    label="Speaker Match (%)" 
                    thresholdVal={60}
                  />
                  <TimelineChart 
                    data={metricsHistory.current.map(m => m.contextRisk)} 
                    color="#a855f7" 
                    label="Contextual Fraud Risk (%)"
                    thresholdVal={70} 
                  />
                </div>
              </div>
            )}

            {/* Final Verdict Panel */}
            {(() => {
              const hist = metricsHistory.current;
              if (hist.length === 0) return null;
              const avgSpoof = hist.reduce((a, m) => a + m.spoof, 0) / hist.length;
              const avgProsody = hist.reduce((a, m) => a + m.prosody, 0) / hist.length;
              const avgMatch = hist.reduce((a, m) => a + m.voiceMatch, 0) / hist.length;
              const peakSpoof = Math.max(...hist.map(m => m.spoof));
              const hadFraud = sessionFraudDetected.current;
              const speakerVerified = avgMatch >= 55;  // Matches backend SPEAKER_THRESHOLD

              // Composite score: lower is safer
              const threatScore = Math.min(100, (avgSpoof * 0.35) + (avgProsody * 0.25) + ((100 - avgMatch) * 0.2) + (hadFraud ? 20 : 0));
              
              let verdict, verdictColor, verdictBg, verdictDesc;
              if (threatScore >= 60 || hadFraud || peakSpoof >= 75) {
                verdict = 'HIGH RISK — CALL UNSAFE';
                verdictColor = 'text-red-400';
                verdictBg = 'bg-red-500/10 border-red-500/40';
                verdictDesc = 'This call exhibited significant indicators of synthetic audio, voice spoofing, or fraudulent content. Immediate investigation recommended.';
              } else if (threatScore >= 35 || !speakerVerified) {
                verdict = 'MODERATE RISK — CAUTION';
                verdictColor = 'text-yellow-400';
                verdictBg = 'bg-yellow-500/10 border-yellow-500/40';
                verdictDesc = 'This call showed some anomalies. Speaker identity could not be fully verified or mild spoofing indicators were present. Manual review suggested.';
              } else {
                verdict = 'LOW RISK — CALL SAFE';
                verdictColor = 'text-green-400';
                verdictBg = 'bg-green-500/10 border-green-500/40';
                verdictDesc = 'All analysis layers indicate the call is genuine. Speaker identity verified, no spoofing detected, and conversation content is clean.';
              }

              return (
                <div className={`mb-6 p-5 rounded-xl border ${verdictBg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Final Verdict</h3>
                    <span className="text-xs font-mono text-gray-500">Threat Score: {threatScore.toFixed(0)}/100</span>
                  </div>
                  <p className={`text-xl font-bold ${verdictColor} mb-2`}>{verdict}</p>
                  <p className="text-sm text-gray-400 mb-4">{verdictDesc}</p>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-black/40 rounded-lg p-2">
                      <p className="text-gray-500 mb-0.5">Spoof</p>
                      <p className={`font-mono font-bold ${avgSpoof > 60 ? 'text-red-400' : avgSpoof > 35 ? 'text-yellow-400' : 'text-green-400'}`}>{avgSpoof.toFixed(1)}%</p>
                    </div>
                    <div className="bg-black/40 rounded-lg p-2">
                      <p className="text-gray-500 mb-0.5">Prosody</p>
                      <p className={`font-mono font-bold ${avgProsody > 60 ? 'text-red-400' : avgProsody > 35 ? 'text-yellow-400' : 'text-green-400'}`}>{avgProsody.toFixed(1)}%</p>
                    </div>
                    <div className="bg-black/40 rounded-lg p-2">
                      <p className="text-gray-500 mb-0.5">Speaker</p>
                      <p className={`font-mono font-bold ${speakerVerified ? 'text-green-400' : 'text-red-400'}`}>{speakerVerified ? '✓ MATCH' : '✗ FAIL'}</p>
                    </div>
                    <div className="bg-black/40 rounded-lg p-2">
                      <p className="text-gray-500 mb-0.5">Context</p>
                      <p className={`font-mono font-bold ${hadFraud ? 'text-red-400' : 'text-green-400'}`}>{hadFraud ? '✗ FRAUD' : '✓ CLEAN'}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end">
              <button 
                onClick={async () => { 
                  const hist = metricsHistory.current;
                  if (hist.length > 0) {
                    const avgMatch = hist.reduce((a, m) => a + m.voiceMatch, 0) / hist.length;
                    if (avgMatch < 55) {  // Matches backend SPEAKER_THRESHOLD (55%)
                      // Speaker unrecognized: Show Enroll Modal first
                      setShowSummaryModal(false);
                      setShowEnrollModal(true);
                      return;
                    }
                  }
                  // If recognized (or empty), save and close immediately
                  await finishSessionAndSaveHistory();
                }}
                className="px-6 py-2 bg-accent text-white rounded hover:bg-accent-hover transition font-medium"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
