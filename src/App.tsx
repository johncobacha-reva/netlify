/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  History, 
  Calendar, 
  MapPin, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Info,
  LayoutDashboard,
  LogOut,
  BrainCircuit,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import { getDeals, getMarketTrends, addDeal, testConnection } from './services/firestoreService';
import { analyzeDeal, getBrokerDailyBriefing, PropertyAnalysis } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analyzer' | 'history'>('dashboard');
  const [trends, setTrends] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [briefing, setBriefing] = useState<string>('');
  
  // Analyzer Form State
  const [form, setForm] = useState({
    address: '',
    city: 'Riverside',
    propertyType: 'Retail',
    price: '',
    squareFootage: '',
    capRate: '',
    occupancy: '100'
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PropertyAnalysis | null>(null);

  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        fetchData();
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    const [t, d] = await Promise.all([getMarketTrends(), getDeals()]);
    setTrends(t || []);
    setDeals(d || []);
    const brief = await getBrokerDailyBriefing(t || []);
    setBriefing(brief);
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const property = {
        ...form,
        price: Number(form.price),
        squareFootage: Number(form.squareFootage),
        capRate: Number(form.capRate),
        occupancy: Number(form.occupancy)
      };
      const result = await analyzeDeal(property, trends);
      setAnalysisResult(result);
      
      // Save it automatically to history
      await addDeal({
        ...property,
        analysis: result
      });
      fetchData();
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="animate-spin text-blue-600">
          <TrendingUp size={48} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8 rounded-3xl border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50"
        >
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <Building2 size={32} />
            </div>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">IE Commercial Insight</h1>
            <p className="mt-2 text-sm font-medium uppercase tracking-widest text-slate-400">Deal Research Terminal</p>
          </div>
          <button
            onClick={handleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-slate-900 py-4 text-white transition-all hover:bg-slate-800"
          >
            Sign in with Google
          </button>
          <p className="text-center text-xs text-slate-400">Secure broker portal. Access restricted to verified users.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-slate-200 bg-white lg:flex shadow-sm">
        <div className="border-b border-slate-100 p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">IE <span className="text-blue-600">Insight</span></h1>
        </div>
        
        <nav className="flex-1 space-y-2 p-4">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<BrainCircuit size={20} />} 
            label="Deal Analyzer" 
            active={activeTab === 'analyzer'} 
            onClick={() => setActiveTab('analyzer')} 
          />
          <NavItem 
            icon={<History size={20} />} 
            label="Historical Archive" 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
          />
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
            <img src={user.photoURL} alt="User" className="h-8 w-8 rounded-full border-2 border-white shadow-sm" />
            <div className="truncate flex-1">
              <p className="text-xs font-bold leading-none">{user.displayName}</p>
              <p className="text-[10px] text-slate-500">{user.email}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-rose-500 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 overflow-y-auto">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 p-6 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full w-fit mb-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Inland Empire Live</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight capitalize">{activeTab}</h2>
          </div>
          <div className="hidden lg:block max-w-sm rounded-2xl border border-slate-200 bg-blue-600 p-4 text-white shadow-lg shadow-blue-200">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/80 mb-1">
              <BrainCircuit size={14} />
              Broker Advisory
            </div>
            <p className="text-[11px] leading-relaxed line-clamp-2 opacity-90">{briefing || "Fetching market intelligence..."}</p>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Avg Price / Sq Ft" value={`$${trends[trends.length-1]?.avgPricePerSqFt || 195}`} trend="+4.2%" />
                  <StatCard label="Avg Cap Rate" value={`${trends[trends.length-1]?.avgCapRate || 5.2}%`} trend="-0.1%" />
                  <StatCard label="Vacancy Rate" value={`${trends[trends.length-1]?.vacancyRate || 4.5}%`} trend="-0.3%" inverted />
                  <StatCard label="Inventory Count" value="1,248" trend="+12" />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <ChartCard title="Price per Square Foot Trend">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trends}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                        <YAxis fontSize={10} axisLine={false} tickLine={false} domain={['auto', 'auto']} tick={{fill: '#94a3b8'}} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Line type="monotone" dataKey="avgPricePerSqFt" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#2563eb' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>
                  
                  <ChartCard title="Capitalization Rate Evolution">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={trends}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                        <YAxis fontSize={10} axisLine={false} tickLine={false} domain={[0, 10]} tick={{fill: '#94a3b8'}} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="avgCapRate" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </motion.div>
            )}

            {activeTab === 'analyzer' && (
              <motion.div 
                key="analyzer"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="grid gap-6 lg:grid-cols-12"
              >
                <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
                  <h3 className="flex items-center gap-2 text-lg font-bold mb-6">
                    <Plus className="text-blue-600" size={20} /> New Analysis
                  </h3>
                  <form onSubmit={handleAnalyze} className="space-y-4">
                    <Input label="Address" value={form.address} onChange={address => setForm({...form, address})} placeholder="123 Main St" required />
                    <Input label="City" value={form.city} onChange={city => setForm({...form, city})} placeholder="Riverside" />
                    <Select label="Property Type" value={form.propertyType} options={['Retail', 'Industrial', 'Office', 'Multi-family', 'Land']} onChange={propertyType => setForm({...form, propertyType})} />
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Price ($)" type="number" value={form.price} onChange={price => setForm({...form, price})} required />
                      <Input label="Cap Rate (%)" type="number" step="0.1" value={form.capRate} onChange={capRate => setForm({...form, capRate})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Sq Footage" type="number" value={form.squareFootage} onChange={squareFootage => setForm({...form, squareFootage})} required />
                      <Input label="Occupancy %" type="number" value={form.occupancy} onChange={occupancy => setForm({...form, occupancy})} />
                    </div>
                    <button 
                      type="submit" 
                      disabled={analyzing}
                      className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50 mt-4 h-12 flex items-center justify-center gap-2"
                    >
                      {analyzing ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Processing...</span>
                        </>
                      ) : 'Run Intelligence Report'}
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-8 flex flex-col gap-6">
                  {analysisResult ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "rounded-2xl border p-8 shadow-sm flex flex-col h-full",
                        analysisResult.rating === 'Good' ? "bg-emerald-50 border-emerald-100" : analysisResult.rating === 'Bad' ? "bg-rose-50 border-rose-100" : "bg-slate-100 border-slate-200"
                      )}
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl",
                            analysisResult.rating === 'Good' ? "bg-emerald-100 text-emerald-700" : analysisResult.rating === 'Bad' ? "bg-rose-100 text-rose-700" : "bg-slate-200 text-slate-700"
                          )}>
                            {analysisResult.rating === 'Good' ? '90+' : analysisResult.rating === 'Bad' ? '40-' : '65'}
                          </div>
                          <div>
                            <h4 className="text-xl font-bold">{form.address}</h4>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">{analysisResult.rating} Score • Benchmark Pass</p>
                          </div>
                        </div>
                        <span className={cn(
                          "rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest border",
                          analysisResult.rating === 'Good' ? "bg-emerald-200 border-emerald-300 text-emerald-800" : analysisResult.rating === 'Bad' ? "bg-rose-200 border-rose-300 text-rose-800" : "bg-slate-300 border-slate-400 text-slate-800"
                        )}>
                          {analysisResult.rating === 'Good' ? 'Strong Buy' : analysisResult.rating === 'Bad' ? 'High Risk' : 'Neutral'}
                        </span>
                      </div>

                      <div className="space-y-6 flex-1">
                        <div>
                          <h5 className="text-sm font-bold mb-2">Deal Summary</h5>
                          <p className="text-sm leading-relaxed text-slate-600">{analysisResult.summary}</p>
                        </div>
                        
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="rounded-xl bg-white/50 p-4 border border-slate-200/50">
                            <h5 className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-3">Key Advantages</h5>
                            <ul className="space-y-2">
                              {analysisResult.pros.map((p, i) => <li key={i} className="text-xs flex items-center gap-3 text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {p}</li>)}
                            </ul>
                          </div>
                          <div className="rounded-xl bg-white/50 p-4 border border-slate-200/50">
                            <h5 className="text-[10px] font-bold uppercase tracking-widest text-rose-700 mb-3">Potential Risks</h5>
                            <ul className="space-y-2">
                              {analysisResult.cons.map((c, i) => <li key={i} className="text-xs flex items-center gap-3 text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {c}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-slate-200/50">
                        <div className="bg-slate-900 rounded-xl p-6 text-white relative overflow-hidden">
                           <div className="relative z-10">
                            <h5 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">Strategic Recommendation</h5>
                            <p className="text-sm font-medium italic opacity-90 leading-relaxed">"{analysisResult.recommendation}"</p>
                           </div>
                           <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-blue-600/20 rounded-full blur-2xl"></div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center text-slate-400">
                      <div className="mb-4 rounded-full bg-slate-50 p-6">
                        <BrainCircuit size={48} className="text-slate-300" />
                      </div>
                      <h4 className="text-lg font-bold text-slate-500">Awaiting Data Entry</h4>
                      <p className="max-w-xs text-xs">Fill out the property profile on the left to generate an AI-powered market benchmarking report.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm"
              >
                <div className="border-b border-slate-100 p-6 flex justify-between items-center">
                  <h3 className="font-bold">Recent Deal Archive</h3>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 cursor-pointer">←</div>
                    <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 cursor-pointer">→</div>
                  </div>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="p-4 pl-6">Property Profile</th>
                      <th className="p-4">Investment</th>
                      <th className="p-4">Return Profile</th>
                      <th className="p-4">AI Score</th>
                      <th className="p-4 text-right pr-6">Archive Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map((deal) => (
                      <tr key={deal.id} className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors group">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-slate-100 p-2 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                              <Building2 size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 tracking-tight">{deal.address}</p>
                              <p className="text-[10px] font-medium text-slate-400 uppercase">{deal.city} • {deal.propertyType}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-bold text-slate-700 tracking-tight">${(deal.price / 1000000).toFixed(2)}M</p>
                          <p className="text-[10px] text-slate-400 uppercase font-medium">{deal.squareFootage.toLocaleString()} SQ FT</p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700 tracking-tight">{deal.capRate}%</span>
                            <span className="text-[10px] text-slate-400 font-medium">CAP</span>
                          </div>
                          <p className="text-[10px] text-slate-400 uppercase font-medium">{deal.occupancy}% OCC</p>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "rounded-full px-3 py-1 text-[10px] font-bold uppercase border",
                            deal.analysis?.rating === 'Good' ? "bg-emerald-50 border-emerald-100 text-emerald-700" : deal.analysis?.rating === 'Bad' ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-slate-100 border-slate-200 text-slate-600"
                          )}>
                            {deal.analysis?.rating || 'Pending'}
                          </span>
                        </td>
                        <td className="p-4 text-right pr-6 text-[10px] font-bold text-slate-400 uppercase">
                          {deal.createdAt?.toDate().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
                        </td>
                      </tr>
                    ))}
                    {deals.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-16 text-center text-slate-300 italic text-sm">Historical deal records will appear here after analysis.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all",
        active 
          ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      )}
    >
      {icon}
      <span className="text-xs font-bold tracking-wide">{label}</span>
    </button>
  );
}

function StatCard({ label, value, trend, inverted }: { label: string, value: string, trend: string, inverted?: boolean }) {
  const isUp = trend.startsWith('+');
  const isGood = inverted ? !isUp : isUp;
  
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <h4 className="text-2xl font-bold tracking-tight text-slate-800">{value}</h4>
        <span className={cn(
          "text-[10px] font-bold px-2 py-1 rounded-lg",
          isGood ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        )}>
          {trend}
        </span>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
        <div className="w-1 h-4 bg-blue-600 rounded-full" />
        {title}
      </h4>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', ...props }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">{label}</label>
      <input 
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
        {...props}
      />
    </div>
  );
}

function Select({ label, value, options, onChange }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">{label}</label>
      <select 
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-all focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-50"
      >
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
