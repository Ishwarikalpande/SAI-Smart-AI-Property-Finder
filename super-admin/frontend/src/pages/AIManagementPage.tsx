import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Search,
  MessageSquare,
  Globe,
  Settings,
  Cpu,
  CheckCircle,
  Save,
} from 'lucide-react';
import { fetchAIStats, fetchAISettings, updateAISettings } from '../api/adminApi';
import { Badge } from '../components/Badge';

export const AIManagementPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [config, setConfig] = useState<any>({
    ai_model: 'qwen2.5:7b',
    llm_provider: 'ollama',
    ai_temperature: 0.7,
    ai_max_tokens: 1024,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, cData] = await Promise.all([fetchAIStats(), fetchAISettings()]);
      setStats(sData);
      if (cData) setConfig(cData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateAISettings({
        ai_model: config.ai_model,
        ai_temperature: parseFloat(config.ai_temperature),
        ai_max_tokens: parseInt(config.ai_max_tokens, 10),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Engine Card */}
      <div className="glass-panel rounded-3xl p-6 border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold font-heading text-white">Qwen Multilingual AI Telemetry</h3>
                <Badge status="ACTIVE" size="sm" />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Active Provider: <strong className="text-indigo-400">{config.llm_provider || 'Ollama (Local)'}</strong> &bull; Model:{' '}
                <strong className="text-white">{config.ai_model || 'qwen2.5:7b'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-xs bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Total Natural Searches</span>
              <span className="text-base font-bold text-white">{stats?.total_searches || 0}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Chat Interactivity</span>
              <span className="text-base font-bold text-white">{stats?.total_chat_interactions || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 8-Language Usage Matrix */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-teal-400" />
              <h4 className="font-bold font-heading text-white text-sm">
                8 Strictly Supported Indic Languages Distribution
              </h4>
            </div>
            <span className="text-xs text-slate-400">Zero-Hallucination Policy</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats?.languages?.map((lang: any) => (
              <div key={lang.code} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-400 uppercase">{lang.code}</span>
                  <span className="text-[10px] text-slate-500 font-semibold">{lang.queries_count} hits</span>
                </div>
                <p className="text-xs font-semibold text-white mt-1.5">{lang.name}</p>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, Math.max(10, (lang.queries_count / (stats?.total_searches || 1)) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Recent Query Log Stream */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Recent Query Stream</h4>
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {stats?.recent_queries?.map((q: any) => (
                <div key={q.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <Search className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-slate-200 font-medium italic">"{q.query}"</span>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{q.city || 'Pune'}</span>
                    <span>{q.results_count} results</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Operational Settings Panel */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Settings className="w-4 h-4 text-indigo-400" />
              <h4 className="font-bold font-heading text-white text-sm">Safe AI Operational Tuning</h4>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Configure parameters without exposing backend credentials or secret keys.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                  Active Model Identifier
                </label>
                <input
                  type="text"
                  value={config.ai_model || ''}
                  onChange={(e) => setConfig({ ...config, ai_model: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                    Temperature ({config.ai_temperature})
                  </label>
                  <span className="text-[10px] text-slate-500">Low = Deterministic</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={config.ai_temperature || 0.7}
                  onChange={(e) => setConfig({ ...config, ai_temperature: e.target.value })}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                  Max Output Tokens
                </label>
                <input
                  type="number"
                  value={config.ai_max_tokens || 1024}
                  onChange={(e) => setConfig({ ...config, ai_max_tokens: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>AI configuration saved successfully!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Updating Parameters...' : 'Save AI Settings'}</span>
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
            Secret API keys are securely read from server environment variables only.
          </div>
        </div>
      </div>
    </div>
  );
};
