import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, ShieldAlert, AlertTriangle, User } from 'lucide-react';

export default function DashboardHistory() {
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/history')
      .then(res => res.json())
      .then(data => {
        setHistories(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch histories", err);
        setLoading(false);
      });
  }, []);

  const getVerdictStyle = (verdict) => {
    if (verdict.includes('SAFE')) return 'bg-green-500/10 text-green-400 border-green-500/30';
    if (verdict.includes('RISK') && verdict.includes('HIGH')) return 'bg-red-500/10 text-red-400 border-red-500/30';
    return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
  };

  const getVerdictIcon = (verdict) => {
    if (verdict.includes('SAFE')) return <ShieldCheck className="w-4 h-4" />;
    if (verdict.includes('HIGH')) return <ShieldAlert className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Call History</h1>
          <p className="text-secondary mt-1">Review analysis logs of past voice calls and uploads</p>
        </div>
      </div>

      <div className="flex-1 bg-[#111111] rounded-xl border border-border overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-secondary">Loading history...</p>
          </div>
        ) : histories.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Clock className="w-16 h-16 text-gray-700 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No History Logs Found</h2>
            <p className="text-secondary">Start a call simulation or upload an audio file to generate logs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500">
                  <th className="p-4 font-medium">Timestamp</th>
                  <th className="p-4 font-medium">Speaker / Caller</th>
                  <th className="p-4 font-medium text-center">Spoof (%)</th>
                  <th className="p-4 font-medium text-center">Prosody (%)</th>
                  <th className="p-4 font-medium text-center">Biometrics</th>
                  <th className="p-4 font-medium text-center">Context</th>
                  <th className="p-4 font-medium">Final Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {histories.map((log) => (
                  <tr key={log._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-sm text-gray-400 whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${log.speakerName !== 'Unknown Caller' ? 'bg-accent/20' : 'bg-gray-800'}`}>
                          <User size={14} className={log.speakerName !== 'Unknown Caller' ? 'text-accent' : 'text-gray-500'} />
                        </div>
                        <span className={`font-medium ${log.speakerName !== 'Unknown Caller' ? 'text-white' : 'text-gray-500'}`}>
                          {log.speakerName.charAt(0).toUpperCase() + log.speakerName.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-mono text-sm ${log.spoofScore > 60 ? 'text-red-400' : log.spoofScore > 35 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {log.spoofScore.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-mono text-sm ${log.prosodyScore > 60 ? 'text-red-400' : log.prosodyScore > 35 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {log.prosodyScore.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${log.speakerScore >= 60 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {log.speakerScore >= 60 ? 'MATCH' : 'MISMATCH'}
                      </span>
                      <div className="text-[10px] text-gray-500 mt-1 font-mono">{log.speakerScore.toFixed(0)}%</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${log.contextScore === 'CRITICAL' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                        {log.contextScore === 'CRITICAL' ? 'FRAUD' : 'CLEAN'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-bold border ${getVerdictStyle(log.verdict)}`}>
                        {getVerdictIcon(log.verdict)}
                        <span>{log.verdict}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
