import React, { useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  AIChatMessage,
  AICropRecommendationResponse,
  AIDiseaseDetectionResponse,
  AIIrrigationResponse,
  AICentreRecommendationResponse,
} from '@smart-farmer/shared';
import {
  Bot,
  Sparkles,
  Send,
  Upload,
  AlertTriangle,
  Droplets,
  Building2,
  Wheat,
  Activity,
  CheckCircle2,
  FileSearch,
  Key,
  Settings,
  X,
  ExternalLink,
} from 'lucide-react';

export const AIAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'chat' | 'crop' | 'disease' | 'irrigation' | 'centre'>(
    'chat'
  );

  // ==========================================
  // 1. Chatbot State
  // ==========================================
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role: 'assistant',
      content: `Namaste! I am Kisan Sahayak, your AI farming & procurement assistant. I am linked with live APMC mandi queues, official MSP rates, and local weather forecasts. How may I assist your farm today?`,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Dynamic AI Engine & API Key configuration
  const [aiKey, setAiKey] = useState<string>(() => localStorage.getItem('smart_farmer_ai_key') || '');
  const [aiProvider, setAiProvider] = useState<'auto' | 'gemini' | 'groq' | 'openai'>(
    () => (localStorage.getItem('smart_farmer_ai_provider') as any) || 'auto'
  );
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState(aiKey);

  const sampleQuestions = [
    t('ai.sampleQ1'),
    t('ai.sampleQ2'),
    t('ai.sampleQ3'),
    t('ai.sampleQ4'),
    t('ai.sampleQ5'),
    t('ai.sampleQ6'),
    t('ai.sampleQ7'),
    t('ai.sampleQ8'),
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend || chatInput;
    if (!message.trim() || isChatLoading) return;

    const newHistory: AIChatMessage[] = [...messages, { role: 'user', content: message }];
    setMessages(newHistory);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await api.ai.chat({
        messages: newHistory,
        location: { latitude: 29.6857, longitude: 76.9905, district: user?.district, state: user?.state },
        apiKey: aiKey || undefined,
        provider: aiProvider,
      });
      if (res.data.success) {
        setMessages([...newHistory, { role: 'assistant', content: res.data.reply }]);
      }
    } catch (err: any) {
      setMessages([
        ...newHistory,
        {
          role: 'assistant',
          content: 'Unable to connect to Kisan Sahayak AI advisory service at the moment. Please verify connection or retry.',
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSaveAIKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = keyInput.trim();
    setAiKey(cleanKey);
    localStorage.setItem('smart_farmer_ai_key', cleanKey);
    localStorage.setItem('smart_farmer_ai_provider', aiProvider);
    setShowKeyModal(false);
  };

  const handleClearAIKey = () => {
    setAiKey('');
    setKeyInput('');
    localStorage.removeItem('smart_farmer_ai_key');
    setShowKeyModal(false);
  };

  // ==========================================
  // 2. Crop Recommendation State
  // ==========================================
  const [cropForm, setCropForm] = useState({
    state: user?.state || 'Haryana',
    district: user?.district || 'Karnal',
    season: 'Rabi',
    soilType: 'Alluvial Loam',
    waterAvailability: 'Moderate (Tube well / Canal)',
    landAreaAcres: user?.farmerProfile?.landAreaTotal || 5,
    previousCrop: 'Paddy',
  });
  const [cropResult, setCropResult] = useState<AICropRecommendationResponse | null>(null);
  const [isCropLoading, setIsCropLoading] = useState(false);

  const handleCropSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCropLoading(true);
    try {
      const res = await api.ai.cropRecommendation(cropForm);
      if (res.data.success) setCropResult(res.data.recommendation);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCropLoading(false);
    }
  };

  // ==========================================
  // 3. Disease Detection State
  // ==========================================
  const [selectedLeafFile, setSelectedLeafFile] = useState<File | null>(null);
  const [leafPreviewUrl, setLeafPreviewUrl] = useState<string | null>(null);
  const [diseaseResult, setDiseaseResult] = useState<AIDiseaseDetectionResponse | null>(null);
  const [isDiseaseLoading, setIsDiseaseLoading] = useState(false);

  const handleLeafFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedLeafFile(file);
      setLeafPreviewUrl(URL.createObjectURL(file));
      setDiseaseResult(null);
    }
  };

  const handleDiseaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeafFile) return;

    const fd = new FormData();
    fd.append('image', selectedLeafFile);

    setIsDiseaseLoading(true);
    try {
      const res = await api.ai.diseaseDetection(fd);
      if (res.data.success) setDiseaseResult(res.data.diagnosis);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDiseaseLoading(false);
    }
  };

  // ==========================================
  // 4. Irrigation Assistant State
  // ==========================================
  const [irrigationForm, setIrrigationForm] = useState({
    cropName: 'Wheat',
    growthStage: 'Crown Root Initiation (CRI)',
    soilType: 'Loamy Sand',
  });
  const [irrigationResult, setIrrigationResult] = useState<AIIrrigationResponse | null>(null);
  const [isIrrigationLoading, setIsIrrigationLoading] = useState(false);

  const handleIrrigationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIrrigationLoading(true);
    try {
      const res = await api.ai.irrigation(irrigationForm);
      if (res.data.success) setIrrigationResult(res.data.advisory);
    } catch (err) {
      console.error(err);
    } finally {
      setIsIrrigationLoading(false);
    }
  };

  // ==========================================
  // 5. Centre Recommendation State
  // ==========================================
  const [centreReqForm, setCentreReqForm] = useState({
    cropName: 'Wheat',
    quantityQuintals: 50,
  });
  const [centreRecResult, setCentreRecResult] = useState<AICentreRecommendationResponse | null>(null);
  const [isCentreRecLoading, setIsCentreRecLoading] = useState(false);

  const handleCentreRecSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCentreRecLoading(true);
    try {
      const res = await api.ai.centreRecommendation({
        ...centreReqForm,
        farmerLatitude: 29.6857,
        farmerLongitude: 76.9905,
      });
      if (res.data.success) setCentreRecResult(res.data.recommendation);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to analyze centres');
    } finally {
      setIsCentreRecLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          {t('ai.headerTitle')} <Sparkles className="w-5 h-5 text-emerald-600" />
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t('ai.headerSubtitle')}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'chat', label: t('ai.tabChat'), icon: Bot },
          { id: 'crop', label: t('ai.tabCrop'), icon: Wheat },
          { id: 'disease', label: t('ai.tabDisease'), icon: Activity },
          { id: 'irrigation', label: t('ai.tabIrrigation'), icon: Droplets },
          { id: 'centre', label: t('ai.tabCentre'), icon: Building2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================== */}
      {/* 1. CHATBOT TAB */}
      {/* ========================================== */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card flex flex-col h-[650px] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{t('ai.assistantTitle')}</h3>
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {t('ai.onlineStatus')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowKeyModal(true)}
              className="px-3 py-1.5 rounded-3xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Configure AI Engine or API Key"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{aiKey ? t('ai.cloudAiKeySet') : t('ai.agroNlpEngine')}</span>
              <Settings className="w-3 h-3 text-emerald-600/70 ml-0.5" />
            </button>
          </div>

          {/* AI Settings Modal */}
          {showKeyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Kisan Sahayak AI Engine</h4>
                      <p className="text-[11px] text-slate-500">Configure Cloud AI API or Local Engine</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowKeyModal(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveAIKey} className="space-y-4 pt-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Select Provider
                    </label>
                    <select
                      value={aiProvider}
                      onChange={(e) => setAiProvider(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-3xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="auto">Auto-Detect from API Key</option>
                      <option value="gemini">Google Gemini (Recommended - Free Tier)</option>
                      <option value="groq">Groq Cloud (Llama-3.3-70b - Free Tier)</option>
                      <option value="openai">OpenAI (ChatGPT / GPT-4o-mini)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      API Key (Optional)
                    </label>
                    <input
                      type="password"
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder="e.g. AIzaSy... or gsk_..."
                      className="w-full px-3 py-2 rounded-3xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Leave empty to use our built-in <strong>Kisan Agro-NLP Engine</strong> (grounded with real MSP prices, live APMC mandis, and ICAR agricultural protocols).
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                    <div className="font-semibold text-slate-700">Where to get free API keys?</div>
                    <div className="flex items-center justify-between">
                      <span>• Google Gemini (100% Free):</span>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        Google AI Studio <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Groq Llama-3 (100% Free):</span>
                      <a
                        href="https://console.groq.com/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        Groq Console <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {aiKey ? (
                      <button
                        type="button"
                        onClick={handleClearAIKey}
                        className="text-xs text-rose-600 hover:text-rose-700 font-medium px-3 py-2 rounded-3xl hover:bg-rose-50 transition-colors"
                      >
                        Clear Saved Key
                      </button>
                    ) : (
                      <div />
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowKeyModal(false)}
                        className="px-4 py-2 rounded-3xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-3xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all"
                      >
                        Save Settings
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-2xl ${
                  m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-3xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    m.role === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-emerald-700'
                  }`}
                >
                  {m.role === 'user' ? t('ai.you') : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none whitespace-pre-line'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex gap-3 max-w-md mr-auto">
                <div className="w-8 h-8 rounded-3xl bg-slate-100 text-emerald-700 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-400 flex items-center gap-2">
                  <span className="animate-pulse">{t('ai.thinking')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-4 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
              {t('landing.quickTools')}
            </span>
            {sampleQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1 rounded-3xl bg-white border border-slate-200 hover:border-emerald-300 text-[11px] text-slate-700 font-medium whitespace-nowrap transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-slate-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t('ai.chatPlaceholder')}
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition-all shadow-md shadow-emerald-600/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. CROP RECOMMENDATION TAB */}
      {/* ========================================== */}
      {activeTab === 'crop' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
              Soil & Land Parameters
            </h3>

            <form onSubmit={handleCropSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Season
                </label>
                <select
                  value={cropForm.season}
                  onChange={(e) => setCropForm({ ...cropForm, season: e.target.value })}
                  className="w-full px-3 py-2 rounded-3xl border border-slate-200 text-xs bg-white"
                >
                  <option value="Rabi (Winter)">Rabi (Winter)</option>
                  <option value="Kharif (Monsoon)">Kharif (Monsoon)</option>
                  <option value="Zaid (Summer)">Zaid (Summer)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Soil Type
                </label>
                <input
                  type="text"
                  value={cropForm.soilType}
                  onChange={(e) => setCropForm({ ...cropForm, soilType: e.target.value })}
                  className="w-full px-3 py-2 rounded-3xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Water Availability
                </label>
                <input
                  type="text"
                  value={cropForm.waterAvailability}
                  onChange={(e) => setCropForm({ ...cropForm, waterAvailability: e.target.value })}
                  className="w-full px-3 py-2 rounded-3xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Land Area (Acres)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={cropForm.landAreaAcres}
                  onChange={(e) =>
                    setCropForm({ ...cropForm, landAreaAcres: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 rounded-3xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Previous Crop
                </label>
                <input
                  type="text"
                  value={cropForm.previousCrop}
                  onChange={(e) => setCropForm({ ...cropForm, previousCrop: e.target.value })}
                  className="w-full px-3 py-2 rounded-3xl border border-slate-200 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isCropLoading}
                className="w-full mt-3 py-3 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isCropLoading ? 'Analyzing Soil & Agro-climatic zone...' : 'Generate Recommendations'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {cropResult ? (
              <>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-900 leading-relaxed">
                  <span className="font-bold block mb-1">Agronomic Advisory:</span>
                  {cropResult.generalAdvisory}
                </div>

                <div className="space-y-3">
                  {cropResult.recommendedCrops.map((c, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card hover:shadow-soft transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-base font-bold text-slate-900">{c.cropName}</h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{c.reason}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                          {c.suitabilityScore}% Match
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-50 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Expected Yield</span>
                          <span className="font-bold text-slate-800">{c.expectedYield}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Est. Revenue / Acre</span>
                          <span className="font-bold text-emerald-700">{c.estimatedRevenuePerAcre}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Water Need</span>
                          <span className="font-bold text-slate-800">{c.waterRequirement}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-slate-400 italic text-center">
                  {cropResult.disclaimer}
                </p>
              </>
            ) : (
              <div className="bg-white rounded-3xl p-12 border border-slate-100 text-center text-slate-400 text-xs">
                Configure your land parameters on the left to generate scientific crop recommendations.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. LEAF DISEASE DOCTOR TAB */}
      {/* ========================================== */}
      {activeTab === 'disease' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
            <h3 className="text-base font-bold text-slate-900 mb-2">Upload Crop Leaf Photo</h3>
            <p className="text-xs text-slate-500 mb-4">
              Take a clear, close-up photo of the affected leaf showing spots, lesions, or yellowing
            </p>

            <form onSubmit={handleDiseaseSubmit} className="space-y-4">
              <label className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50">
                {leafPreviewUrl ? (
                  <img
                    src={leafPreviewUrl}
                    alt="Leaf Preview"
                    className="max-h-48 rounded-3xl object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <span className="text-xs font-bold text-slate-700 block">
                      Click to choose or drop leaf photo
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      JPG, PNG, or WebP up to 5MB
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLeafFileChange}
                  className="hidden"
                />
              </label>

              <button
                type="submit"
                disabled={!selectedLeafFile || isDiseaseLoading}
                className="w-full py-3.5 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isDiseaseLoading ? 'Analyzing leaf symptoms...' : 'Diagnose Plant Disease'}
              </button>
            </form>
          </div>

          <div>
            {diseaseResult ? (
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Diagnosis Result
                    </span>
                    <h4 className="text-lg font-black text-slate-900 mt-0.5">
                      {diseaseResult.diseaseName}
                    </h4>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {Math.round(diseaseResult.confidence * 100)}% Confidence
                  </span>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-slate-700 mb-1">Identified Symptoms:</h5>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                    {diseaseResult.symptoms.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                {diseaseResult.organicRemedy && (
                  <div className="p-3 rounded-3xl bg-emerald-50 border border-emerald-100 text-xs">
                    <span className="font-bold text-emerald-900 block mb-0.5">Organic Treatment:</span>
                    <p className="text-emerald-800">{diseaseResult.organicRemedy}</p>
                  </div>
                )}

                {diseaseResult.chemicalRemedy && (
                  <div className="p-3 rounded-3xl bg-blue-50 border border-blue-100 text-xs">
                    <span className="font-bold text-blue-900 block mb-0.5">Chemical Spray:</span>
                    <p className="text-blue-800">{diseaseResult.chemicalRemedy}</p>
                  </div>
                )}

                <div className="p-3 rounded-3xl bg-slate-50 text-xs text-slate-600">
                  <span className="font-bold block mb-0.5">KVK Expert Advice:</span>
                  {diseaseResult.expertConsultationAdvice}
                </div>

                <p className="text-[10px] text-slate-400 italic">{diseaseResult.disclaimer}</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 border border-slate-100 text-center text-slate-400 text-xs">
                Upload a plant leaf image to view symptom analysis and remedy recommendations.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 4. IRRIGATION ADVISOR TAB */}
      {/* ========================================== */}
      {activeTab === 'irrigation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
            <h3 className="text-base font-bold text-slate-900 mb-2">Irrigation Schedule Advisor</h3>
            <p className="text-xs text-slate-500 mb-4">
              Integrates crop phenology stage with live Open-Meteo precipitation probability
            </p>

            <form onSubmit={handleIrrigationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Crop
                </label>
                <select
                  value={irrigationForm.cropName}
                  onChange={(e) => setIrrigationForm({ ...irrigationForm, cropName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-3xl border border-slate-200 text-xs bg-white"
                >
                  <option value="Wheat">Wheat</option>
                  <option value="Paddy">Paddy / Rice</option>
                  <option value="Mustard">Mustard</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Gram">Gram (Chana)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Growth Stage
                </label>
                <input
                  type="text"
                  value={irrigationForm.growthStage}
                  onChange={(e) => setIrrigationForm({ ...irrigationForm, growthStage: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-3xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Soil Type
                </label>
                <input
                  type="text"
                  value={irrigationForm.soilType}
                  onChange={(e) => setIrrigationForm({ ...irrigationForm, soilType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-3xl border border-slate-200 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isIrrigationLoading}
                className="w-full py-3 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isIrrigationLoading ? 'Checking rain telemetry...' : 'Check Irrigation Advisory'}
              </button>
            </form>
          </div>

          <div>
            {irrigationResult ? (
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Recommendation
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      irrigationResult.recommendation === 'IRRIGATE_NOW'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {irrigationResult.recommendation.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {irrigationResult.advisory}
                </p>

                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-xs text-blue-900">
                  <span className="font-bold block mb-0.5">Weather Forecast Telemetry:</span>
                  {irrigationResult.rainForecastSummary}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-50">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Recommended Volume</span>
                    <span className="font-bold text-slate-800">
                      {irrigationResult.recommendedWaterVolume}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Next Soil Check Date</span>
                    <span className="font-bold text-slate-800">{irrigationResult.nextCheckDate}</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic">{irrigationResult.disclaimer}</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 border border-slate-100 text-center text-slate-400 text-xs">
                Submit your crop details to calculate moisture needs against precipitation forecasts.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 5. CENTRE OPTIMIZER TAB */}
      {/* ========================================== */}
      {activeTab === 'centre' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
            <h3 className="text-base font-bold text-slate-900 mb-2">Centre Recommendation</h3>
            <p className="text-xs text-slate-500 mb-4">
              Calculates shortest driving distance, lowest queue wait time, and available intake capacity
            </p>

            <form onSubmit={handleCentreRecSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Crop for Delivery
                </label>
                <select
                  value={centreReqForm.cropName}
                  onChange={(e) => setCentreReqForm({ ...centreReqForm, cropName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-3xl border border-slate-200 text-xs bg-white"
                >
                  <option value="Wheat">Wheat</option>
                  <option value="Paddy (Common)">Paddy</option>
                  <option value="Mustard / Rapeseed">Mustard</option>
                  <option value="Cotton (Medium Staple)">Cotton</option>
                  <option value="Soybean (Yellow)">Soybean</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Quantity (Quintals)
                </label>
                <input
                  type="number"
                  min="1"
                  value={centreReqForm.quantityQuintals}
                  onChange={(e) =>
                    setCentreReqForm({
                      ...centreReqForm,
                      quantityQuintals: parseFloat(e.target.value) || 1,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-3xl border border-slate-200 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isCentreRecLoading}
                className="w-full py-3 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isCentreRecLoading ? 'Scoring centres...' : 'Find Optimal Centre'}
              </button>
            </form>
          </div>

          <div>
            {centreRecResult ? (
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full">
                  ★ Recommended Centre Match
                </span>
                <h4 className="text-xl font-black text-slate-900">{centreRecResult.centreName}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{centreRecResult.reason}</p>

                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 text-xs text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Distance</span>
                    <span className="font-bold text-slate-800">{centreRecResult.distanceKm} km</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Queue Wait</span>
                    <span className="font-bold text-amber-600">
                      ~{centreRecResult.queueWaitMinutes}m
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Capacity Available</span>
                    <span className="font-bold text-emerald-700">
                      {centreRecResult.availableCapacityPercent}%
                    </span>
                  </div>
                </div>

                {centreRecResult.alternatives.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 block mb-2">
                      Alternative Centres Nearby:
                    </span>
                    <div className="space-y-2">
                      {centreRecResult.alternatives.map((alt) => (
                        <div
                          key={alt.centreId}
                          className="flex items-center justify-between text-xs p-2.5 rounded-3xl border border-slate-100 bg-slate-50/50"
                        >
                          <span className="font-bold text-slate-800">{alt.centreName}</span>
                          <span className="text-slate-500">
                            {alt.distanceKm} km • {alt.queueWaitMinutes}m wait
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 border border-slate-100 text-center text-slate-400 text-xs">
                Select your crop to calculate the nearest centre with lowest waiting time.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
