import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
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

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const hideNav = location.pathname === '/scan' || location.pathname.startsWith('/onboarding');

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans pb-24">
      <main className="max-w-md mx-auto px-4 pt-6">
        {children}
      </main>
      
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-stone-200 px-6 py-3 z-50">
          <div className="max-w-md mx-auto flex justify-between items-center">
            <NavLink to="/" icon={<HomeIcon size={24} />} label="Home" />
            <NavLink to="/history" icon={<History size={24} />} label="History" />
            <div className="relative -top-8">
              <Link 
                to="/scan" 
                className="flex items-center justify-center w-16 h-16 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-200 active:scale-95 transition-transform"
              >
                <Scan size={32} />
              </Link>
            </div>
            <NavLink to="/saved" icon={<Heart size={24} />} label="Saved" />
            <NavLink to="/settings" icon={<Settings size={24} />} label="Settings" />
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
    "Healthy": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Moderate": "bg-yellow-100 text-yellow-700 border-yellow-200",
    "Not healthy": "bg-orange-100 text-orange-700 border-orange-200",
    "Avoid": "bg-red-100 text-red-700 border-red-200"
  };
  
  const icons = {
    "Healthy": <CheckCircle2 size={16} />,
    "Moderate": <Info size={16} />,
    "Not healthy": <AlertCircle size={16} />,
    "Avoid": <XCircle size={16} />
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-semibold",
      colors[label as keyof typeof colors]
    )}>
      {icons[label as keyof typeof icons]}
      <span>{label}</span>
      <span className="opacity-50">•</span>
      <span>{score}/100</span>
    </div>
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
    <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-8 text-center">
      <AnimatePresence mode="wait">
        <motion.div 
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex flex-col items-center"
        >
          <img src={steps[step].image} alt="" className="w-64 h-64 rounded-3xl mb-8 shadow-xl" referrerPolicy="no-referrer" />
          <h1 className="text-3xl font-bold mb-4">{steps[step].title}</h1>
          <p className="text-stone-500 mb-12 max-w-xs">{steps[step].desc}</p>
        </motion.div>
      </AnimatePresence>
      
      <div className="flex gap-2 mb-12">
        {steps.map((_, i) => (
          <div key={i} className={cn("w-2 h-2 rounded-full", i === step ? "bg-emerald-500 w-6" : "bg-stone-200")} />
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
        className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 active:scale-95 transition-transform"
      >
        {step === steps.length - 1 ? "Get Started" : "Next"}
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
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-stone-400 text-sm font-medium uppercase tracking-widest">Welcome back</h2>
          <h1 className="text-2xl font-bold">NutriScan</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
          <Utensils size={20} />
        </div>
      </header>

      <div className="bg-emerald-500 rounded-3xl p-8 text-white shadow-xl shadow-emerald-100 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Check your food</h2>
          <p className="text-emerald-100 mb-6 text-sm">Scan a barcode to see if it's healthy for you.</p>
          <button 
            onClick={() => navigate('/scan')}
            className="bg-white text-emerald-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 active:scale-95 transition-transform"
          >
            <Scan size={20} />
            Scan Now
          </button>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-20">
          <Scan size={160} />
        </div>
      </div>

      <section>
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-bold">Recent Scans</h3>
          <Link to="/history" className="text-emerald-600 text-sm font-medium">View All</Link>
        </div>
        
        {history.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-stone-200">
            <p className="text-stone-400 text-sm">No scans yet. Try scanning your first item!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.slice(0, 3).map((item) => (
              <Link 
                key={item.id} 
                to={`/product/${item.id}`}
                state={{ product: item }}
                className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-stone-100 shadow-sm active:scale-[0.98] transition-transform"
              >
                <img src={item.image_url} alt="" className="w-16 h-16 rounded-xl object-cover bg-stone-50" referrerPolicy="no-referrer" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold truncate">{item.name}</h4>
                  <p className="text-xs text-stone-400 truncate mb-1">{item.brand}</p>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      item.label === 'Healthy' ? 'bg-emerald-500' :
                      item.label === 'Moderate' ? 'bg-yellow-500' :
                      item.label === 'Not healthy' ? 'bg-orange-500' : 'bg-red-500'
                    )} />
                    <span className="text-xs font-medium text-stone-600">{item.label}</span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-stone-300" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-stone-900 rounded-3xl p-6 text-white">
        <h3 className="font-bold mb-2">Pro Tip</h3>
        <p className="text-stone-400 text-sm leading-relaxed">
          Foods with more than 5 ingredients are often ultra-processed. Look for short ingredient lists!
        </p>
      </section>
    </div>
  );
};

const ScanScreen = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (barcode: string) => {
    setScanning(false);
    setLoading(true);
    setError(null);

    try {
      const product = await fetchProductByBarcode(barcode);
      if (product) {
        navigate(`/product/${barcode}`, { state: { product } });
      } else {
        setError("Product not found. Try another barcode.");
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
      <div className="p-6 flex justify-between items-center text-white">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-bold">Scan Barcode</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {scanning && (
          <div className="w-full max-w-xs aspect-square border-2 border-emerald-500 rounded-3xl relative overflow-hidden">
            <BarcodeScanner onScan={handleScan} />
            <motion.div 
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] z-10"
            />
          </div>
        )}

        {loading && (
          <div className="text-center text-white space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-lg font-medium">Analyzing ingredients...</p>
          </div>
        )}

        {error && (
          <div className="mt-8 p-4 bg-red-500/20 text-red-400 rounded-2xl text-center border border-red-500/30">
            {error}
          </div>
        )}

        {scanning && (
          <p className="mt-8 text-stone-400 text-center">
            Point your camera at the barcode of any packaged food item.
          </p>
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
  const [loading, setLoading] = useState(!analysis);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!product && id) {
      fetchProductByBarcode(id).then(setProduct);
    }
  }, [id, product]);

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Analyzing Product</h2>
          <p className="text-stone-500">Checking ingredients and nutrition facts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <header className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm border border-stone-100">
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-2">
          <button className="p-2 bg-white rounded-full shadow-sm border border-stone-100">
            <Share2 size={20} />
          </button>
          <button className="p-2 bg-white rounded-full shadow-sm border border-stone-100">
            <Heart size={20} />
          </button>
        </div>
      </header>

      <div className="flex flex-col items-center text-center">
        <img src={product.image_url} alt="" className="w-48 h-48 rounded-3xl object-cover shadow-xl mb-6 bg-white" referrerPolicy="no-referrer" />
        <h1 className="text-2xl font-bold mb-1">{product.name}</h1>
        <p className="text-stone-400 font-medium mb-4">{product.brand}</p>
        
        {analysis && <ScoreBadge label={analysis.label} score={analysis.score} />}
      </div>

      {analysis && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
            <h3 className="font-bold mb-2">Why this score?</h3>
            <p className="text-stone-600 text-sm leading-relaxed mb-4">
              {analysis.summary}
            </p>
            
            <button 
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-emerald-600 text-sm font-bold"
            >
              {expanded ? "Show Less" : "Show Detailed Analysis"}
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {expanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-6 space-y-6 pt-6 border-t border-stone-100"
              >
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Nutritional Breakdown</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <NutriItem label="Calories" value={`${product.nutrition.calories} kcal`} />
                    <NutriItem label="Sugar" value={`${product.nutrition.sugar}g`} warning={product.nutrition.sugar > 10} />
                    <NutriItem label="Protein" value={`${product.nutrition.protein}g`} success={product.nutrition.protein > 5} />
                    <NutriItem label="Sodium" value={`${product.nutrition.sodium}mg`} warning={product.nutrition.sodium > 400} />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Ingredient Analysis</h4>
                  <p className="text-sm text-stone-600 leading-relaxed italic">
                    "{analysis.ingredientJustification}"
                  </p>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <h4 className="text-xs font-bold uppercase text-emerald-600 mb-2">Positives</h4>
                    <ul className="space-y-1">
                      {analysis.positives.map((p, i) => (
                        <li key={i} className="text-xs text-stone-600 flex items-start gap-1">
                          <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold uppercase text-red-600 mb-2">Negatives</h4>
                    <ul className="space-y-1">
                      {analysis.negatives.map((n, i) => (
                        <li key={i} className="text-xs text-stone-600 flex items-start gap-1">
                          <XCircle size={12} className="text-red-500 mt-0.5 shrink-0" />
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
            <div className="bg-stone-900 text-white rounded-3xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Guidance</h3>
              <p className="text-sm font-bold mb-1">{analysis.consumptionGuidance.portion}</p>
              <p className="text-xs text-stone-400">{analysis.consumptionGuidance.frequency}</p>
            </div>
            <div className="bg-emerald-50 text-emerald-900 rounded-3xl p-5 border border-emerald-100">
              <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">Impact</h3>
              <p className="text-sm font-bold">{analysis.consumptionGuidance.calorieImpact}</p>
            </div>
          </section>

          <section className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
            <h3 className="font-bold mb-4">Make it healthier</h3>
            <div className="space-y-3">
              {analysis.makeItHealthier.map((tip, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                    <span className="text-xs font-bold">{i + 1}</span>
                  </div>
                  <p className="text-sm text-stone-600">{tip}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="font-bold mb-4 px-2">Healthy Recipes</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
              {analysis.recipes.map((recipe) => (
                <Link 
                  key={recipe.id}
                  to={`/recipe/${recipe.id}`}
                  state={{ recipe, product }}
                  className="min-w-[240px] bg-white rounded-3xl p-4 shadow-sm border border-stone-100 flex flex-col gap-3"
                >
                  <img src={`https://picsum.photos/seed/${recipe.id}/400/300`} alt="" className="w-full h-32 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="font-bold text-sm mb-1">{recipe.name}</h4>
                    <p className="text-xs text-stone-400 line-clamp-2">{recipe.description}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600">{recipe.calories} kcal</span>
                    <ChevronRight size={16} className="text-stone-300" />
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
  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100">
    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">{label}</p>
    <p className={cn(
      "text-sm font-bold",
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
    <div className="space-y-6 pb-12">
      <header className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm border border-stone-100">
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-2">
          <button className="p-2 bg-white rounded-full shadow-sm border border-stone-100">
            <Share2 size={20} />
          </button>
          <button onClick={handleSave} className="p-2 bg-white rounded-full shadow-sm border border-stone-100">
            <Heart size={20} />
          </button>
        </div>
      </header>

      <img src={`https://picsum.photos/seed/${recipe.id}/800/600`} alt="" className="w-full h-64 rounded-[40px] object-cover shadow-xl" referrerPolicy="no-referrer" />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{recipe.name}</h1>
        <div className="flex items-center gap-4 text-stone-400 text-sm font-medium">
          <span className="flex items-center gap-1"><Clock size={16} /> 15 min</span>
          <span className="flex items-center gap-1"><Utensils size={16} /> {recipe.calories} kcal</span>
        </div>
      </div>

      <section className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100">
        <h3 className="text-emerald-900 font-bold mb-2">Why it's healthier</h3>
        <p className="text-emerald-700 text-sm leading-relaxed">{recipe.healthNote}</p>
      </section>

      <section>
        <h3 className="text-xl font-bold mb-4">Ingredients</h3>
        <ul className="space-y-3">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-stone-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-stone-700">{ing}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-bold mb-4">Instructions</h3>
        <div className="space-y-6">
          {recipe.instructions.map((step, i) => (
            <div key={i} className="flex gap-4">
              <span className="text-2xl font-black text-stone-200">{i + 1}</span>
              <p className="text-sm text-stone-600 leading-relaxed pt-1">{step}</p>
            </div>
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
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold mb-4">Scan History</h1>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['Healthy', 'Moderate', 'Not healthy', 'Avoid'].map(label => (
            <button 
              key={label}
              onClick={() => setFilter(filter === label ? null : label)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold border whitespace-nowrap transition-all",
                filter === label ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-400 border-stone-200"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-4">
        {filteredHistory.map((item) => (
          <Link 
            key={item.id} 
            to={`/product/${item.id}`}
            className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-stone-100 shadow-sm"
          >
            <img src={item.image_url} alt="" className="w-16 h-16 rounded-2xl object-cover bg-stone-50" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold truncate">{item.name}</h4>
              <p className="text-xs text-stone-400 mb-2">{format(new Date(item.timestamp), 'MMM d, h:mm a')}</p>
              <div className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                item.label === 'Healthy' ? 'bg-emerald-100 text-emerald-700' :
                item.label === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                item.label === 'Not healthy' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
              )}>
                {item.label}
              </div>
            </div>
            <ChevronRight size={20} className="text-stone-300" />
          </Link>
        ))}
        {filteredHistory.length === 0 && (
          <div className="text-center py-12">
            <p className="text-stone-400">No history found.</p>
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Saved Recipes</h1>
      <div className="grid gap-4">
        {recipes.map((recipe) => (
          <Link 
            key={recipe.id}
            to={`/recipe/${recipe.id}`}
            state={{ recipe }}
            className="bg-white rounded-3xl p-4 shadow-sm border border-stone-100 flex gap-4"
          >
            <img src={`https://picsum.photos/seed/${recipe.id}/400/300`} alt="" className="w-24 h-24 rounded-2xl object-cover" referrerPolicy="no-referrer" />
            <div className="flex-1">
              <h4 className="font-bold text-sm mb-1">{recipe.name}</h4>
              <p className="text-xs text-stone-400 line-clamp-2 mb-2">{recipe.description}</p>
              <span className="text-xs font-bold text-emerald-600">{recipe.calories} kcal</span>
            </div>
          </Link>
        ))}
        {recipes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-stone-400">No saved recipes yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsScreen = () => {
  const { preferences, updatePreferences } = usePreferences();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Dietary Preferences</h3>
        <div className="grid grid-cols-2 gap-3">
          {['none', 'vegetarian', 'vegan', 'halal', 'low-carb', 'low-sodium'].map(diet => (
            <button 
              key={diet}
              onClick={() => updatePreferences({ ...preferences, diet })}
              className={cn(
                "px-4 py-3 rounded-2xl text-sm font-bold border transition-all capitalize",
                preferences.diet === diet ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-stone-600 border-stone-200"
              )}
            >
              {diet}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">App Settings</h3>
        <div className="bg-white rounded-3xl p-6 border border-stone-100 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Personalized Analysis</p>
              <p className="text-xs text-stone-400">Tailor scores to your diet</p>
            </div>
            <button 
              onClick={() => updatePreferences({ ...preferences, personalized_recommendations: !preferences.personalized_recommendations })}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                preferences.personalized_recommendations ? "bg-emerald-500" : "bg-stone-200"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                preferences.personalized_recommendations ? "left-7" : "left-1"
              )} />
            </button>
          </div>
          <div className="flex items-center justify-between opacity-50">
            <div>
              <p className="font-bold">Notifications</p>
              <p className="text-xs text-stone-400">Daily health tips</p>
            </div>
            <div className="w-12 h-6 rounded-full bg-stone-200 relative">
              <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </section>

      <button 
        onClick={() => {
          fetch('/api/history', { method: 'DELETE' });
          window.location.reload();
        }}
        className="w-full py-4 text-red-500 font-bold border border-red-100 rounded-2xl active:bg-red-50 transition-colors"
      >
        Clear History
      </button>
    </div>
  );
};

// --- Main App ---

import { useParams } from 'react-router-dom';

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
