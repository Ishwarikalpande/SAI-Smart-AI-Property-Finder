import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  Trash2,
  Image,
  Megaphone,
  HelpCircle,
  Layers,
  ExternalLink,
} from 'lucide-react';
import {
  fetchBanners,
  createBanner,
  deleteBanner,
  fetchAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  fetchFAQs,
  createFAQ,
  deleteFAQ,
  fetchCategories,
} from '../api/adminApi';
import { Badge } from '../components/Badge';

export const ContentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'banners' | 'announcements' | 'faqs' | 'categories'>('banners');

  const [banners, setBanners] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Banner Form
  const [newBanner, setNewBanner] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    target_url: '',
    badge_text: '',
  });

  // New FAQ Form
  const [newFaq, setNewFaq] = useState({
    category: 'General',
    question: '',
    answer: '',
  });

  const loadContent = async () => {
    setLoading(true);
    try {
      const [b, a, f, c] = await Promise.all([
        fetchBanners(),
        fetchAnnouncements(),
        fetchFAQs(),
        fetchCategories(),
      ]);
      setBanners(b);
      setAnnouncements(a);
      setFaqs(f);
      setCategories(c);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanner.title.trim()) return;
    try {
      await createBanner(newBanner);
      setNewBanner({ title: '', subtitle: '', image_url: '', target_url: '', badge_text: '' });
      await loadContent();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBanner = async (id: number) => {
    try {
      await deleteBanner(id);
      await loadContent();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
    try {
      await createFAQ(newFaq);
      setNewFaq({ category: 'General', question: '', answer: '' });
      await loadContent();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFaq = async (id: number) => {
    try {
      await deleteFAQ(id);
      await loadContent();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Tab Switcher */}
      <div className="glass-panel rounded-2xl p-2 flex space-x-2 border border-slate-800">
        <button
          onClick={() => setActiveTab('banners')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-2 ${
            activeTab === 'banners' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Image className="w-4 h-4" />
          <span>Homepage Banners ({banners.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-2 ${
            activeTab === 'announcements' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Announcements ({announcements.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('faqs')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-2 ${
            activeTab === 'faqs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>FAQs ({faqs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-2 ${
            activeTab === 'categories' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Categories ({categories.length})</span>
        </button>
      </div>

      {/* Banners View */}
      {activeTab === 'banners' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-bold text-sm text-white flex items-center space-x-2">
              <Image className="w-4 h-4 text-indigo-400" />
              <span>Active Homepage Promotional Banners</span>
            </h4>
            <div className="space-y-3">
              {banners.map((b) => (
                <div key={b.id} className="glass-card rounded-2xl p-4 flex items-center justify-between gap-4 border border-slate-800">
                  <div className="flex items-center space-x-4">
                    {b.image_url ? (
                      <img src={b.image_url} alt="" className="w-20 h-14 object-cover rounded-xl border border-slate-700 shrink-0" />
                    ) : (
                      <div className="w-20 h-14 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                        <Image className="w-6 h-6 text-slate-600" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{b.title}</span>
                        {b.badge_text && <Badge status={b.badge_text} size="sm" />}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{b.subtitle}</p>
                      {b.target_url && (
                        <p className="text-[11px] text-indigo-400 mt-1 flex items-center space-x-1">
                          <span>Link: {b.target_url}</span>
                          <ExternalLink className="w-3 h-3" />
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteBanner(b.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Banner Form */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Add New Banner</h4>
            <form onSubmit={handleCreateBanner} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Festival Homes 2026"
                  value={newBanner.title}
                  onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. 0% Stamp Duty on Verified Projects"
                  value={newBanner.subtitle}
                  onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Image URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newBanner.image_url}
                  onChange={(e) => setNewBanner({ ...newBanner, image_url: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Badge Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Festive Offer"
                  value={newBanner.badge_text}
                  onChange={(e) => setNewBanner({ ...newBanner, badge_text: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
              >
                Publish Banner
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FAQs View */}
      {activeTab === 'faqs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {faqs.map((f) => (
              <div key={f.id} className="glass-card rounded-2xl p-4 border border-slate-800">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                      {f.category}
                    </span>
                    <h5 className="font-bold text-white text-sm mt-1.5">{f.question}</h5>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{f.answer}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteFaq(f.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Add FAQ Item</h4>
            <form onSubmit={handleCreateFaq} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Category</label>
                <input
                  type="text"
                  value={newFaq.category}
                  onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Question</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How does SAI verify properties?"
                  value={newFaq.question}
                  onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Answer</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Official answer text..."
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              >
                Save FAQ
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Categories View */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div key={c.id} className="glass-card rounded-2xl p-4 border border-slate-800 flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-white text-sm">{c.name}</h5>
                <p className="text-[11px] text-slate-400 font-mono">slug: /{c.slug}</p>
                <p className="text-xs text-slate-300 mt-1">{c.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Announcements View */}
      {activeTab === 'announcements' && (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <Badge status={a.type} size="sm" />
                  <span className="font-bold text-white text-sm">{a.title}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{a.message}</p>
                <p className="text-[11px] text-slate-500 mt-1">Audience: {a.target_role}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
