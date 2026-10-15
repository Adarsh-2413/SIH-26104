import React from 'react';
import { Save, Bell, ShieldAlert, Key } from 'lucide-react';

export default function DashboardSettings() {
  return (
    <div className="p-8 h-full flex flex-col overflow-y-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
        <p className="text-secondary">Configure detection thresholds and API integrations.</p>
      </div>

      <div className="max-w-4xl space-y-8">
        
        {/* Detection Thresholds */}
        <div className="bg-[#111111] border border-border rounded-2xl p-8">
          <div className="flex items-center space-x-3 mb-6 border-b border-border pb-4">
            <ShieldAlert className="text-accent w-6 h-6" />
            <h2 className="text-xl font-medium text-white">Detection Thresholds</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-white">Spoof Detection Sensitivity</label>
                <span className="text-xs text-accent">Aggressive</span>
              </div>
              <input type="range" className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#8B5CF6]" defaultValue="80" />
              <p className="text-xs text-secondary mt-2">Determines how aggressively the system flags acoustic anomalies. Higher sensitivity may increase false positives.</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-white">Biometric Match Threshold</label>
                <span className="text-xs text-white font-mono">75%</span>
              </div>
              <input type="range" className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#8B5CF6]" defaultValue="75" />
              <p className="text-xs text-secondary mt-2">Minimum ECAPA-TDNN cosine similarity required to verify identity.</p>
            </div>
            
            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Auto-Drop Critical Calls</p>
                <p className="text-xs text-secondary mt-1">Automatically disconnect calls that exceed the critical risk threshold.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* API Integrations */}
        <div className="bg-[#111111] border border-border rounded-2xl p-8">
          <div className="flex items-center space-x-3 mb-6 border-b border-border pb-4">
            <Key className="text-accent-alt w-6 h-6" />
            <h2 className="text-xl font-medium text-white">API Integrations</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">FastAPI Backend URL</label>
              <input type="text" className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent" defaultValue="http://localhost:8000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">SIP Trunk Provider Key</label>
              <input type="password" className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent" defaultValue="sk_test_123456789" />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-[#111111] border border-border rounded-2xl p-8">
          <div className="flex items-center space-x-3 mb-6 border-b border-border pb-4">
            <Bell className="text-accent-alt2 w-6 h-6" />
            <h2 className="text-xl font-medium text-white">Alert Preferences</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-700 bg-black text-accent focus:ring-accent focus:ring-offset-gray-900" defaultChecked />
              <span className="text-sm text-secondary group-hover:text-white transition-colors">Email alerts for Critical risk calls</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-700 bg-black text-accent focus:ring-accent focus:ring-offset-gray-900" defaultChecked />
              <span className="text-sm text-secondary group-hover:text-white transition-colors">Daily ML performance reports</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="bg-white text-black font-medium px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-gray-200 transition-colors">
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>

      </div>
    </div>
  );
}
