import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Link, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scan, 
  History, 
  Settings, 
  Home as HomeIcon, 
  ChevronRight, 
  ArrowLeft, 
  Heart, 
  Share2, 
  Info,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Utensils,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { BarcodeScanner } from './components/BarcodeScanner';
import { fetchProductByBarcode, Product } from './services/foodService';
import { analyzeProduct, AnalysisResult, Recipe } from './services/geminiService';
import { usePreferences } from './hooks/usePreferences';
import { cn } from './lib/utils';
import { format } from 'date-fns';

// --- Components ---

const Logo = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <div className={cn("flex items-center justify-center bg-linear-to-br from-emerald-400 to-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100", className)} style={{ width: size * 1.8, height: size * 1.8 }}>
    <Utensils size={size} />
  </div>
);

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const hideNav = location.pathname === '/scan' || location.pathname.startsWith('/onboarding');

  return (
    <div className="min-h-screen pb-24">
      <main className="max-w-md mx-auto px-5 pt-8">
        {children}
      </main>
      
      {!hideNav && (
        <nav className="fixed bottom-6 left-6 right-6 glass rounded-[32px] px-8 py-4 z-50 shadow-2xl shadow-stone-200/50">
          <div className="max-w-md mx-auto flex justify-between items-center">
            <NavLink to="/" icon={<HomeIcon size={22} />} label="Home" />
            <NavLink to="/history" icon={<History size={22} />} label="History" />
            <div className="relative -top-10">
              <Link 
                to="/scan" 
                className="flex items-center justify-center w-16 h-16 bg-linear-to-br from-emerald-400 to-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-200 active:scale-90 transition-all duration-300 rotate-45"
              >
                <div className="-rotate-45">
                  <Scan size={28} />
                </div>
              </Link>
            </div>
            <NavLink to="/saved" icon={<Heart size={22} />} label="Saved" />
            <NavLink to="/settings" icon={<Settings size={22} />} label="Settings" />
          </div>
        </nav>
      )}
    </div>
  );
};

const NavLink = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={cn(
      "flex flex-col items-center gap-1 transition-colors",
      isActive ? "text-emerald-600" : "text-stone-400 hover:text-stone-600"
    )}>
      {icon}
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </Link>
  );
};

const ScoreBadge = ({ label, score }: { label: string, score: number }) => {
  const colors = {
    "Healthy": "bg-emerald-500 text-white shadow-emerald-100",
    "Moderate": "bg-yellow-500 text-white shadow-yellow-100",
    "Not healthy": "bg-orange-500 text-white shadow-orange-100",
    "Avoid": "bg-red-500 text-white shadow-red-100"
  };
  
  const icons = {
    "Healthy": <CheckCircle2 size={18} />,
    "Moderate": <Info size={18} />,
    "Not healthy": <AlertCircle size={18} />,
    "Avoid": <XCircle size={18} />
  };

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "flex items-center gap-3 px-6 py-3 rounded-2xl font-bold shadow-xl",
        colors[label as keyof typeof colors]
      )}
    >
      {icons[label as keyof typeof icons]}
      <div className="flex flex-col">
        <span className="text-xs opacity-80 uppercase tracking-widest leading-none mb-1">Health Score</span>
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{label}</span>
          <span className="opacity-40">|</span>
          <span className="text-lg leading-none">{score}/100</span>
        </div>
      </div>
    </motion.div>
  );
};

// --- Screens ---

const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  
  const steps = [
    {
      title: "Scan Packaged Foods",
      desc: "Just point your camera at any barcode to get instant nutritional insights.",
      image: "https://picsum.photos/seed/scan/400/400"
    },
    {
      title: "See Health Scores",
      desc: "Our AI analyzes ingredients and nutrition to give you a clear 4-level health score.",
      image: "https://picsum.photos/seed/health/400/400"
    },
    {
      title: "Get Recipes",
      desc: "Discover healthier ways to enjoy your favorite products with AI-generated recipes.",
      image: "https://picsum.photos/seed/recipe/400/400"
    }
  ];

  return (
    <div className="fixed inset-0 bg-mesh z-[100] flex flex-col items-center justify-center p-10 text-center">
      <div className="absolute top-12 flex flex-col items-center gap-3">
        <Logo size={32} className="rounded-2xl shadow-2xl" />
        <span className="text-xs font-black uppercase tracking-[0.3em] text-emerald-600/50">NutriScan Coach</span>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div 
          key={step}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="flex flex-col items-center"
        >
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150"></div>
            <img src={steps[step].image} alt="" className="relative w-72 h-72 rounded-[48px] shadow-2xl border-4 border-white" referrerPolicy="no-referrer" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-gradient">{steps[step].title}</h1>
          <p className="text-stone-500 font-medium mb-12 max-w-xs leading-relaxed">{steps[step].desc}</p>
        </motion.div>
      </AnimatePresence>
      
      <div className="flex gap-3 mb-12">
        {steps.map((_, i) => (
          <div key={i} className={cn("h-2 rounded-full transition-all duration-500", i === step ? "bg-emerald-500 w-8" : "bg-stone-200 w-2")} />
        ))}
      </div>

      <button 
        onClick={() => {
          if (step < steps.length - 1) {
            setStep(step + 1);
          } else {
            onComplete();
            navigate('/');
          }
        }}
        className="w-full py-5 bg-linear-to-br from-emerald-500 to-emerald-700 text-white rounded-3xl font-bold shadow-2xl shadow-emerald-200 active:scale-95 transition-all duration-300"
      >
        {step === steps.length - 1 ? "Get Started" : "Continue"}
      </button>
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/history').then(res => res.json()).then(setHistory);
  }, []);

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Logo size={24} />
          <div>
            <h2 className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5">NutriScan Coach</h2>
            <h1 className="text-2xl font-extrabold tracking-tight text-gradient">Welcome Back</h1>
          </div>
        </div>
      </header>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-linear-to-br from-emerald-500 to-emerald-700 rounded-[40px] p-10 text-white shadow-2xl shadow-emerald-200 relative overflow-hidden group"
      >
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-3 leading-tight">Analyze your<br/>daily nutrition</h2>
          <p className="text-emerald-100/80 mb-8 text-sm font-medium max-w-[200px]">Scan barcodes to see instant health scores and recipes.</p>
          <button 
            onClick={() => navigate('/scan')}
            className="bg-white text-emerald-600 px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl active:scale-95 transition-all duration-300"
          >
            <Scan size={22} />
            Start Scanning
          </button>
        </div>
        <div className="absolute -right-12 -bottom-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Scan size={240} />
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
      </motion.div>

      <section>
        <div className="flex justify-between items-end mb-6 px-2">
          <h3 className="text-xl font-bold">Recent Scans</h3>
          <Link to="/history" className="text-emerald-600 text-sm font-bold flex items-center gap-1">
            View All <ChevronRight size={16} />
          </Link>
        </div>
        
        {history.length === 0 ? (
          <div className="glass rounded-[32px] p-12 text-center border-dashed border-stone-200">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
              <Scan size={32} />
            </div>
            <p className="text-stone-400 text-sm font-medium">No scans yet. Try scanning your first item!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.slice(0, 3).map((item, idx) => (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                key={item.id}
              >
                <Link 
                  to={`/product/${item.id}`}
                  state={{ product: item }}
                  className="flex items-center gap-5 bg-white p-4 rounded-[28px] border border-stone-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-300"
                >
                  <div className="relative">
                    <img src={item.image_url} alt="" className="w-20 h-20 rounded-2xl object-cover bg-stone-50" referrerPolicy="no-referrer" />
                    <div className={cn(
                      "absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-lg",
                      item.label === 'Healthy' ? 'bg-emerald-500' :
                      item.label === 'Moderate' ? 'bg-yellow-500' :
                      item.label === 'Not healthy' ? 'bg-orange-500' : 'bg-red-500'
                    )}>
                      {item.label === 'Healthy' ? <CheckCircle2 size={12} className="text-white" /> : <Info size={12} className="text-white" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-lg truncate mb-0.5">{item.name}</h4>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-wider truncate mb-2">{item.brand}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-stone-600 bg-stone-100 px-2 py-1 rounded-lg uppercase tracking-widest">{item.label}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-300">
                    <ChevronRight size={20} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-stone-900 rounded-[32px] p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-400 mb-3">
            <Info size={18} />
            <h3 className="font-bold text-xs uppercase tracking-[0.2em]">Pro Tip</h3>
          </div>
          <p className="text-stone-300 text-sm leading-relaxed font-medium">
            Foods with more than 5 ingredients are often ultra-processed. Look for short, clean ingredient lists!
          </p>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </section>
    </div>
  );
};

const ScanScreen = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");

  const handleScan = async (barcode: string) => {
    setScanning(false);
    setLoading(true);
    setError(null);

    try {
      const product = await fetchProductByBarcode(barcode);
      if (product) {
        navigate(`/product/${barcode}`, { state: { product } });
      } else {
        setError("Product not found. Try another barcode or enter manually.");
        setScanning(true);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setScanning(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      <div className="p-6 flex justify-between items-center text-white z-20">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-bold">Scan Barcode</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        {scanning && (
          <div className="w-full max-w-xs aspect-square border-2 border-emerald-500/50 rounded-3xl relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <BarcodeScanner onScan={handleScan} />
            <motion.div 
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] z-10"
            />
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-lg font-medium">Analyzing ingredients...</p>
            <p className="text-stone-400 text-sm">Checking sugar and sodium levels...</p>
          </div>
        )}

        {error && (
          <div className="mt-8 p-4 bg-red-500/20 text-red-400 rounded-2xl text-center border border-red-500/30 max-w-xs">
            {error}
          </div>
        )}

        {scanning && !loading && (
          <div className="mt-12 w-full max-w-xs space-y-6">
            <p className="text-stone-400 text-center text-sm">
              Point your camera at the barcode of any packaged food item.
            </p>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black px-2 text-stone-500 font-bold tracking-widest">Or enter manually</span>
              </div>
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Barcode number..."
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button 
                onClick={() => manualBarcode && handleScan(manualBarcode)}
                disabled={!manualBarcode}
                className="bg-emerald-500 text-white px-4 py-3 rounded-xl font-bold disabled:opacity-50 active:scale-95 transition-transform"
              >
                Go
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { preferences } = usePreferences();
  
  const [product, setProduct] = useState<Product | null>(location.state?.product || null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  // Reset state when ID changes to prevent showing old product data
  useEffect(() => {
    setAnalysis(null);
    setLoading(true);
    setExpanded(false);
    
    if (location.state?.product && location.state.product.id === id) {
      setProduct(location.state.product);
    } else if (id) {
      setProduct(null);
      fetchProductByBarcode(id).then(setProduct);
    }
  }, [id, location.state]);

  useEffect(() => {
    if (product && !analysis) {
      setLoading(true);
      analyzeProduct(product.name, product.brand, product.nutrition, product.ingredients, preferences.diet)
        .then(res => {
          setAnalysis(res);
          // Save to history
          fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: product.id,
              name: product.name,
              brand: product.brand,
              image_url: product.image_url,
              score: res.score,
              label: res.label,
              summary: res.summary
            })
          });
        })
        .finally(() => setLoading(false));
    }
  }, [product, analysis, preferences.diet]);

  if (!product || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-emerald-500/20 rounded-full" />
          <div className="absolute top-0 w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 tracking-tight">Analyzing Product</h2>
          <p className="text-stone-400 font-medium">Checking ingredients and nutrition facts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="w-12 h-12 glass rounded-2xl flex items-center justify-center shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-3">
          <button className="w-12 h-12 glass rounded-2xl flex items-center justify-center shadow-sm">
            <Share2 size={20} />
          </button>
          <button className="w-12 h-12 glass rounded-2xl flex items-center justify-center shadow-sm">
            <Heart size={20} />
          </button>
        </div>
      </header>

      <div className="flex flex-col items-center text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>
          <img src={product.image_url} alt="" className="relative w-56 h-56 rounded-[48px] object-cover shadow-2xl bg-white border-4 border-white" referrerPolicy="no-referrer" />
        </motion.div>
        
        <h1 className="text-3xl font-extrabold tracking-tight mb-2 px-4">{product.name}</h1>
        <p className="text-stone-400 font-bold uppercase tracking-[0.2em] text-xs mb-8">{product.brand}</p>
        
        {analysis && <ScoreBadge label={analysis.label} score={analysis.score} />}
      </div>

      {analysis && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <section className="bg-white rounded-[40px] p-8 shadow-xl shadow-stone-200/50 border border-stone-100">
            <div className="flex items-center gap-2 text-stone-400 mb-4">
              <Info size={18} />
              <h3 className="font-bold text-xs uppercase tracking-[0.2em]">Analysis Summary</h3>
            </div>
            <p className="text-stone-700 text-lg leading-relaxed font-medium mb-6">
              {analysis.summary}
            </p>
            
            <button 
              onClick={() => setExpanded(!expanded)}
              className="w-full py-4 bg-stone-50 rounded-2xl flex items-center justify-center gap-2 text-stone-900 text-sm font-bold border border-stone-100 hover:bg-stone-100 transition-colors"
            >
              {expanded ? "Show Less" : "Show Detailed Analysis"}
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {expanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-8 space-y-8 pt-8 border-t border-stone-100"
              >
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 mb-4">Nutritional Breakdown</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <NutriItem label="Calories" value={`${product.nutrition.calories} kcal`} />
                    <NutriItem label="Sugar" value={`${product.nutrition.sugar}g`} warning={product.nutrition.sugar > 10} />
                    <NutriItem label="Protein" value={`${product.nutrition.protein}g`} success={product.nutrition.protein > 5} />
                    <NutriItem label="Sodium" value={`${product.nutrition.sodium}mg`} warning={product.nutrition.sodium > 400} />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 mb-4">Ingredient Analysis</h4>
                  <div className="bg-stone-50 rounded-3xl p-6 border border-stone-100 italic text-stone-600 leading-relaxed">
                    "{analysis.ingredientJustification}"
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100">
                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 mb-4">Key Positives</h4>
                    <ul className="space-y-3">
                      {analysis.positives.map((p, i) => (
                        <li key={i} className="text-sm text-emerald-900 font-medium flex items-start gap-3">
                          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-red-50 rounded-3xl p-6 border border-red-100">
                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-red-600 mb-4">Key Negatives</h4>
                    <ul className="space-y-3">
                      {analysis.negatives.map((n, i) => (
                        <li key={i} className="text-sm text-red-900 font-medium flex items-start gap-3">
                          <XCircle size={18} className="text-red-500 shrink-0" />
                          {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </section>

          <section className="grid grid-cols-2 gap-4">
            <div className="bg-stone-900 text-white rounded-[32px] p-6 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-4">Guidance</h3>
              <p className="text-lg font-bold mb-1">{analysis.consumptionGuidance.portion}</p>
              <p className="text-xs text-stone-400 font-medium">{analysis.consumptionGuidance.frequency}</p>
            </div>
            <div className="bg-white rounded-[32px] p-6 border border-stone-100 shadow-xl shadow-stone-200/50">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 mb-4">Impact</h3>
              <p className="text-lg font-bold text-stone-900">{analysis.consumptionGuidance.calorieImpact}</p>
            </div>
          </section>

          <section className="bg-white rounded-[40px] p-8 shadow-xl shadow-stone-200/50 border border-stone-100">
            <h3 className="text-xl font-bold mb-6">Make it healthier</h3>
            <div className="space-y-4">
              {analysis.makeItHealthier.map((tip, i) => (
                <div key={i} className="flex gap-4 items-start bg-stone-50 p-4 rounded-2xl border border-stone-100">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-100">
                    <span className="text-sm font-bold">{i + 1}</span>
                  </div>
                  <p className="text-sm text-stone-700 font-medium leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-bold mb-6 px-4">Healthy Recipes</h3>
            <div className="flex gap-6 overflow-x-auto pb-6 -mx-5 px-5 scrollbar-hide">
              {analysis.recipes.map((recipe) => (
                <Link 
                  key={recipe.id}
                  to={`/recipe/${recipe.id}`}
                  state={{ recipe, product }}
                  className="min-w-[280px] bg-white rounded-[40px] p-5 shadow-xl shadow-stone-200/50 border border-stone-100 flex flex-col gap-4 group"
                >
                  <div className="overflow-hidden rounded-[32px]">
                    <img src={`https://picsum.photos/seed/${recipe.id}/400/300`} alt="" className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                  </div>
                  <div className="px-2">
                    <h4 className="font-bold text-lg mb-2 leading-tight">{recipe.name}</h4>
                    <p className="text-xs text-stone-400 font-medium line-clamp-2 leading-relaxed">{recipe.description}</p>
                  </div>
                  <div className="mt-auto px-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Utensils size={14} className="text-emerald-500" />
                      <span className="text-sm font-bold text-stone-900">{recipe.calories} kcal</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-300 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </motion.div>
      )}
    </div>
  );
};

const NutriItem = ({ label, value, warning, success }: { label: string, value: string, warning?: boolean, success?: boolean }) => (
  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-2">{label}</p>
    <p className={cn(
      "text-lg font-bold tracking-tight",
      warning ? "text-orange-600" : success ? "text-emerald-600" : "text-stone-900"
    )}>{value}</p>
  </div>
);

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const recipe = location.state?.recipe as Recipe;
  const product = location.state?.product as Product;

  if (!recipe) return null;

  const handleSave = async () => {
    await fetch('/api/saved-recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...recipe,
        product_id: product.id
      })
    });
    alert("Recipe saved!");
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="w-12 h-12 glass rounded-2xl flex items-center justify-center shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-3">
          <button className="w-12 h-12 glass rounded-2xl flex items-center justify-center shadow-sm">
            <Share2 size={20} />
          </button>
          <button onClick={handleSave} className="w-12 h-12 glass rounded-2xl flex items-center justify-center shadow-sm">
            <Heart size={20} />
          </button>
        </div>
      </header>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative"
      >
        <img src={`https://picsum.photos/seed/${recipe.id}/800/600`} alt="" className="w-full h-80 rounded-[48px] object-cover shadow-2xl" referrerPolicy="no-referrer" />
        <div className="absolute bottom-6 left-6 right-6 glass p-6 rounded-[32px] shadow-xl">
          <h1 className="text-2xl font-bold mb-2">{recipe.name}</h1>
          <div className="flex items-center gap-6 text-stone-600 text-sm font-bold">
            <span className="flex items-center gap-2"><Clock size={18} className="text-emerald-500" /> 15 min</span>
            <span className="flex items-center gap-2"><Utensils size={18} className="text-emerald-500" /> {recipe.calories} kcal</span>
          </div>
        </div>
      </motion.div>

      <section className="bg-emerald-50 rounded-[32px] p-8 border border-emerald-100 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-600 mb-4">
          <CheckCircle2 size={20} />
          <h3 className="font-bold text-xs uppercase tracking-[0.2em]">Health Note</h3>
        </div>
        <p className="text-emerald-900 text-lg leading-relaxed font-medium">{recipe.healthNote}</p>
      </section>

      <section>
        <h3 className="text-2xl font-bold mb-6 px-4">Ingredients</h3>
        <div className="grid gap-3">
          {recipe.ingredients.map((ing, i) => (
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              key={i} 
              className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-stone-100 shadow-sm"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-bold text-stone-700">{ing}</span>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-bold mb-6 px-4">Instructions</h3>
        <div className="space-y-8">
          {recipe.instructions.map((step, i) => (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className="flex gap-6"
            >
              <span className="text-4xl font-black text-stone-100 leading-none">{i + 1}</span>
              <p className="text-stone-600 leading-relaxed font-medium pt-1">{step}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

const HistoryScreen = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/history').then(res => res.json()).then(setHistory);
  }, []);

  const filteredHistory = filter ? history.filter(h => h.label === filter) : history;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight mb-6 text-gradient">Scan History</h1>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5">
          {['Healthy', 'Moderate', 'Not healthy', 'Avoid'].map(label => (
            <button 
              key={label}
              onClick={() => setFilter(filter === label ? null : label)}
              className={cn(
                "px-6 py-2.5 rounded-2xl text-xs font-bold border whitespace-nowrap transition-all duration-300",
                filter === label ? "bg-stone-900 text-white border-stone-900 shadow-xl" : "bg-white text-stone-400 border-stone-100 shadow-sm"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-4">
        {filteredHistory.map((item, idx) => (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.05 }}
            key={item.id}
          >
            <Link 
              to={`/product/${item.id}`}
              className="flex items-center gap-5 bg-white p-4 rounded-[32px] border border-stone-100 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <img src={item.image_url} alt="" className="w-20 h-20 rounded-2xl object-cover bg-stone-50" referrerPolicy="no-referrer" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-lg truncate mb-0.5">{item.name}</h4>
                <p className="text-xs text-stone-400 font-bold mb-3">{format(new Date(item.timestamp), 'MMM d, h:mm a')}</p>
                <div className={cn(
                  "inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest",
                  item.label === 'Healthy' ? 'bg-emerald-100 text-emerald-700' :
                  item.label === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                  item.label === 'Not healthy' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                )}>
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    item.label === 'Healthy' ? 'bg-emerald-500' :
                    item.label === 'Moderate' ? 'bg-yellow-500' :
                    item.label === 'Not healthy' ? 'bg-orange-500' : 'bg-red-500'
                  )} />
                  {item.label}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-300">
                <ChevronRight size={20} />
              </div>
            </Link>
          </motion.div>
        ))}
        {filteredHistory.length === 0 && (
          <div className="text-center py-20 glass rounded-[40px] border-dashed border-stone-200">
            <History size={48} className="mx-auto text-stone-200 mb-4" />
            <p className="text-stone-400 font-medium">No history found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SavedScreen = () => {
  const [recipes, setRecipes] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/saved-recipes').then(res => res.json()).then(setRecipes);
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Saved Recipes</h1>
      <div className="grid gap-6">
        {recipes.map((recipe, idx) => (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: idx * 0.1 }}
            key={recipe.id}
          >
            <Link 
              to={`/recipe/${recipe.id}`}
              state={{ recipe }}
              className="bg-white rounded-[40px] p-5 shadow-xl shadow-stone-200/50 border border-stone-100 flex gap-5 group"
            >
              <div className="overflow-hidden rounded-[32px] shrink-0">
                <img src={`https://picsum.photos/seed/${recipe.id}/400/300`} alt="" className="w-28 h-28 object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 py-1">
                <h4 className="font-bold text-lg mb-1 leading-tight">{recipe.name}</h4>
                <p className="text-xs text-stone-400 font-medium line-clamp-2 mb-3 leading-relaxed">{recipe.description}</p>
                <div className="flex items-center gap-1.5">
                  <Utensils size={14} className="text-emerald-500" />
                  <span className="text-sm font-bold text-stone-900">{recipe.calories} kcal</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
        {recipes.length === 0 && (
          <div className="text-center py-20 glass rounded-[40px] border-dashed border-stone-200">
            <Heart size={48} className="mx-auto text-stone-200 mb-4" />
            <p className="text-stone-400 font-medium">No saved recipes yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsScreen = () => {
  const { preferences, updatePreferences } = usePreferences();

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Settings</h1>
      </header>

      <section className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 px-2">Dietary Preferences</h3>
        <div className="grid grid-cols-2 gap-4">
          {['none', 'vegetarian', 'vegan', 'halal', 'low-carb', 'low-sodium'].map(diet => (
            <button 
              key={diet}
              onClick={() => updatePreferences({ ...preferences, diet })}
              className={cn(
                "px-6 py-4 rounded-[24px] text-sm font-bold border transition-all duration-300 capitalize shadow-sm",
                preferences.diet === diet ? "bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-100" : "bg-white text-stone-600 border-stone-100 hover:border-emerald-200"
              )}
            >
              {diet}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 px-2">App Settings</h3>
        <div className="bg-white rounded-[40px] p-8 border border-stone-100 space-y-8 shadow-xl shadow-stone-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">Personalized Analysis</p>
              <p className="text-xs text-stone-400 font-medium">Tailor scores to your diet</p>
            </div>
            <button 
              onClick={() => updatePreferences({ ...preferences, personalized_recommendations: !preferences.personalized_recommendations })}
              className={cn(
                "w-14 h-8 rounded-full transition-all duration-500 relative p-1",
                preferences.personalized_recommendations ? "bg-emerald-500" : "bg-stone-200"
              )}
            >
              <div className={cn(
                "w-6 h-6 bg-white rounded-full transition-all duration-500 shadow-md",
                preferences.personalized_recommendations ? "translate-x-6" : "translate-x-0"
              )} />
            </button>
          </div>
          <div className="flex items-center justify-between opacity-40">
            <div>
              <p className="font-bold text-lg">Notifications</p>
              <p className="text-xs text-stone-400 font-medium">Daily health tips</p>
            </div>
            <div className="w-14 h-8 rounded-full bg-stone-200 relative p-1">
              <div className="w-6 h-6 bg-white rounded-full shadow-md" />
            </div>
          </div>
        </div>
      </section>

      <button 
        onClick={() => {
          if (confirm("Are you sure you want to clear your history?")) {
            fetch('/api/history', { method: 'DELETE' });
            window.location.reload();
          }
        }}
        className="w-full py-5 text-red-500 font-bold border border-red-100 rounded-[32px] active:bg-red-50 transition-all duration-300 shadow-sm"
      >
        Clear Scan History
      </button>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('onboarded'));

  useEffect(() => {
    if (!showOnboarding) {
      localStorage.setItem('onboarded', 'true');
    }
  }, [showOnboarding]);

  return (
    <BrowserRouter>
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scan" element={<ScanScreen />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/history" element={<HistoryScreen />} />
          <Route path="/saved" element={<SavedScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
