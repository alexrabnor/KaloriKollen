import React, { useState, useRef, useEffect } from 'react';
import { Camera, Scale, TrendingUp, History, X, Check, Zap, Target, Award, Droplet, Download, Star, BarChart3, Home, Utensils, Calendar, Trash2 } from 'lucide-react';
import { ResponsiveContainer, Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';

function KaloriApp() {
  // State
  const [currentView, setCurrentView] = useState('home');
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [weights, setWeights] = useState([]);
  const [newWeight, setNewWeight] = useState('');
  const [meals, setMeals] = useState([]);
  const [waterIntake, setWaterIntake] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [goals, setGoals] = useState({ weight: '', calories: '2000', protein: '150', carbs: '200', fat: '65', water: '2000' });
  const [userHeight, setUserHeight] = useState('');
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState([]);
  const [showCoaching, setShowCoaching] = useState(false);
  const [coachingMessage, setCoachingMessage] = useState('');
  const [loadingCoaching, setLoadingCoaching] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [loadingBarcode, setLoadingBarcode] = useState(false);
  const fileInputRef = useRef(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!window.storage) return;
    
    try {
      const weightsData = await window.storage.get('user-weights', false).catch(() => null);
      if (weightsData) setWeights(JSON.parse(weightsData.value));
      
      const mealsData = await window.storage.get('user-meals', false).catch(() => null);
      if (mealsData) setMeals(JSON.parse(mealsData.value));
      
      const waterData = await window.storage.get('user-water', false).catch(() => null);
      if (waterData) setWaterIntake(JSON.parse(waterData.value));
      
      const favoritesData = await window.storage.get('user-favorites', false).catch(() => null);
      if (favoritesData) setFavorites(JSON.parse(favoritesData.value));
      
      const goalsData = await window.storage.get('user-goals', false).catch(() => null);
      if (goalsData) setGoals(JSON.parse(goalsData.value));
      
      const heightData = await window.storage.get('user-height', false).catch(() => null);
      if (heightData) setUserHeight(heightData.value);
      
      const streakData = await window.storage.get('user-streak', false).catch(() => null);
      if (streakData) setStreak(parseInt(streakData.value));
      
      const badgesData = await window.storage.get('user-badges', false).catch(() => null);
      if (badgesData) setBadges(JSON.parse(badgesData.value));
    } catch (error) {
      console.log('Loading data...', error);
    }
  };

  // Save functions
  const saveData = async (key, value) => {
    if (!window.storage) return;
    try {
      await window.storage.set(key, typeof value === 'string' ? value : JSON.stringify(value), false);
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  // Image analysis
  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        analyzeImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (imageData) => {
    setAnalyzing(true);
    setCurrentView('analyzing');

    try {
      const base64Data = imageData.split(',')[1];
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Data } },
              { type: 'text', text: `Analysera denna maträtt och ge en uppskattning av kaloriinnehållet och makronutrienter. 
                
Svara ENDAST med JSON i följande format (ingen annan text):
{
  "dish": "namn på maträtten på svenska",
  "items": ["ingrediens 1", "ingrediens 2"],
  "calories": 500,
  "protein": 25.5,
  "carbs": 45.0,
  "fat": 15.5,
  "portion": "1 portion",
  "confidence": "hög"
}` }
            ]
          }]
        })
      });

      const data = await response.json();
      const textContent = data.content.find(item => item.type === 'text')?.text || '';
      const jsonText = textContent.replace(/```json\n?|\n?```/g, '').trim();
      const analysis = JSON.parse(jsonText);
      
      // Save meal
      const mealEntry = {
        ...analysis,
        image: imageData,
        date: new Date().toISOString(),
        dateStr: new Date().toLocaleDateString('sv-SE'),
        timeStr: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
      };
      
      const updatedMeals = [mealEntry, ...meals];
      setMeals(updatedMeals);
      saveData('user-meals', updatedMeals);
      
      setResult(analysis);
      setCurrentView('result');
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Kunde inte analysera bilden. Försök igen.');
      setCurrentView('home');
    } finally {
      setAnalyzing(false);
    }
  };

  // Weight functions
  const addWeight = () => {
    if (newWeight && parseFloat(newWeight) > 0) {
      const weightEntry = {
        weight: parseFloat(newWeight),
        date: new Date().toISOString(),
        dateStr: new Date().toLocaleDateString('sv-SE')
      };
      const updatedWeights = [weightEntry, ...weights];
      setWeights(updatedWeights);
      saveData('user-weights', updatedWeights);
      setNewWeight('');
    }
  };

  const deleteWeight = (index) => {
    const updatedWeights = weights.filter((_, i) => i !== index);
    setWeights(updatedWeights);
    saveData('user-weights', updatedWeights);
  };

  // Water functions
  const addWater = (amount) => {
    const waterEntry = {
      amount: amount,
      date: new Date().toISOString(),
      dateStr: new Date().toLocaleDateString('sv-SE'),
      timeStr: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [waterEntry, ...waterIntake];
    setWaterIntake(updated);
    saveData('user-water', updated);
  };

  // Favorites
  const addToFavorites = (meal) => {
    if (!favorites.find(f => f.dish === meal.dish)) {
      const updated = [...favorites, meal];
      setFavorites(updated);
      saveData('user-favorites', updated);
    }
  };

  const deleteFavorite = (index) => {
    const updated = favorites.filter((_, i) => i !== index);
    setFavorites(updated);
    saveData('user-favorites', updated);
  };

  // Stats calculations
  const getTodayMeals = () => {
    const today = new Date().toLocaleDateString('sv-SE');
    return meals.filter(m => m.dateStr === today);
  };

  const getTodayCalories = () => {
    return getTodayMeals().reduce((sum, meal) => sum + meal.calories, 0);
  };

  const getTodayMacros = () => {
    const todayMeals = getTodayMeals();
    return {
      protein: todayMeals.reduce((sum, m) => sum + m.protein, 0),
      carbs: todayMeals.reduce((sum, m) => sum + m.carbs, 0),
      fat: todayMeals.reduce((sum, m) => sum + m.fat, 0)
    };
  };

  const getTodayWater = () => {
    const today = new Date().toLocaleDateString('sv-SE');
    return waterIntake.filter(w => w.dateStr === today).reduce((sum, w) => sum + w.amount, 0);
  };

  const getWeeklyStats = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekMeals = meals.filter(m => new Date(m.date) >= weekAgo);
    const daysCount = [...new Set(weekMeals.map(m => m.dateStr))].length || 1;
    
    const totalCals = weekMeals.reduce((sum, m) => sum + m.calories, 0);
    const avgCals = Math.round(totalCals / daysCount);
    
    return { totalCals, avgCals, mealsCount: weekMeals.length };
  };

  const calculateBMI = () => {
    if (!userHeight || weights.length === 0) return null;
    const heightM = parseFloat(userHeight) / 100;
    const weight = weights[0].weight;
    return (weight / (heightM * heightM)).toFixed(1);
  };

  // Export function
  const exportData = () => {
    const data = {
      weights,
      meals,
      waterIntake,
      favorites,
      goals,
      userHeight,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kalorikollen-data-${new Date().toLocaleDateString('sv-SE')}.json`;
    a.click();
  };

  // Calculate streak
  const calculateStreak = () => {
    if (meals.length === 0) return 0;
    
    const sortedDates = [...new Set(meals.map(m => m.dateStr))].sort((a, b) => new Date(b) - new Date(a));
    let currentStreak = 0;
    const today = new Date().toLocaleDateString('sv-SE');
    
    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toLocaleDateString('sv-SE');
      
      if (sortedDates[i] === expectedDateStr) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    return currentStreak;
  };

  // Check and award badges
  const checkBadges = () => {
    const newBadges = [...badges];
    
    // First meal badge
    if (meals.length >= 1 && !badges.find(b => b.id === 'first_meal')) {
      newBadges.push({ id: 'first_meal', name: 'Första steget', emoji: '🎯', date: new Date().toISOString() });
    }
    
    // Week streak badge
    if (calculateStreak() >= 7 && !badges.find(b => b.id === 'week_streak')) {
      newBadges.push({ id: 'week_streak', name: '7 dagar i rad!', emoji: '🔥', date: new Date().toISOString() });
    }
    
    // 50 meals badge
    if (meals.length >= 50 && !badges.find(b => b.id === '50_meals')) {
      newBadges.push({ id: '50_meals', name: '50 måltider', emoji: '⭐', date: new Date().toISOString() });
    }
    
    // Goal reached badge
    if (getTodayCalories() >= parseInt(goals.calories) * 0.95 && getTodayCalories() <= parseInt(goals.calories) * 1.05 && !badges.find(b => b.id === 'goal_today' && b.date.split('T')[0] === new Date().toISOString().split('T')[0])) {
      newBadges.push({ id: 'goal_today', name: 'Perfekt dag!', emoji: '🎉', date: new Date().toISOString() });
    }
    
    if (newBadges.length > badges.length) {
      setBadges(newBadges);
      saveData('user-badges', newBadges);
    }
  };

  // AI Coaching
  const getAICoaching = async () => {
    setLoadingCoaching(true);
    setShowCoaching(true);
    
    try {
      const todayCals = getTodayCalories();
      const remaining = parseInt(goals.calories) - todayCals;
      const macros = getTodayMacros();
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `Du är en hälsocoach. Ge personligt råd på svenska baserat på:
- Dagens kalorier: ${todayCals} av ${goals.calories} kcal (${remaining} kvar)
- Protein: ${macros.protein.toFixed(0)}g av ${goals.protein}g
- Kolhydrater: ${macros.carbs.toFixed(0)}g av ${goals.carbs}g
- Fett: ${macros.fat.toFixed(0)}g av ${goals.fat}g

Ge ett kort, uppmuntrande råd (2-3 meningar) med konkreta förslag på vad personen kan äta härnäst. Var positiv och motiverande!`
          }]
        })
      });

      const data = await response.json();
      const message = data.content.find(item => item.type === 'text')?.text || 'Fortsätt så här! Du gör det bra! 💪';
      setCoachingMessage(message);
    } catch (error) {
      console.error('Coaching error:', error);
      setCoachingMessage('Fortsätt med ditt fantastiska arbete! Du är på rätt väg! 💪');
    } finally {
      setLoadingCoaching(false);
    }
  };

  // Update streak when meals change
  useEffect(() => {
    if (meals.length > 0) {
      const newStreak = calculateStreak();
      if (newStreak !== streak) {
        setStreak(newStreak);
        saveData('user-streak', newStreak.toString());
      }
      checkBadges();
    }
  }, [meals]);

  // Barcode Search
  const searchBarcode = async () => {
    if (!barcode) return;
    
    setLoadingBarcode(true);
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1) {
        const product = data.product;
        setBarcodeProduct({
          name: product.product_name || 'Okänd produkt',
          brand: product.brands || '',
          calories: Math.round(product.nutriments['energy-kcal_100g'] || 0),
          protein: product.nutriments.proteins_100g || 0,
          carbs: product.nutriments.carbohydrates_100g || 0,
          fat: product.nutriments.fat_100g || 0,
          image: product.image_url || null
        });
      } else {
        alert('Produkten hittades inte. Prova en annan streckkod.');
      }
    } catch (error) {
      console.error('Barcode error:', error);
      alert('Kunde inte söka produkten. Kontrollera din internetanslutning.');
    } finally {
      setLoadingBarcode(false);
    }
  };

  // Add barcode product to meals
  const addBarcodeProduct = () => {
    if (!barcodeProduct) return;
    
    const mealEntry = {
      dish: barcodeProduct.name,
      items: [barcodeProduct.brand].filter(Boolean),
      calories: barcodeProduct.calories,
      protein: barcodeProduct.protein,
      carbs: barcodeProduct.carbs,
      fat: barcodeProduct.fat,
      image: barcodeProduct.image,
      portion: '100g',
      confidence: 'hög',
      date: new Date().toISOString(),
      dateStr: new Date().toLocaleDateString('sv-SE'),
      timeStr: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
    };
    
    const updatedMeals = [mealEntry, ...meals];
    setMeals(updatedMeals);
    saveData('user-meals', updatedMeals);
    
    // Reset barcode
    setBarcode('');
    setBarcodeProduct(null);
    setCurrentView('home');
  };

  // Circular Progress Component
  const CircularProgress = ({ value, max, size = 120, strokeWidth = 10, color = '#10B981', label, sublabel }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const percentage = Math.min((value / max) * 100, 100);
    const offset = circumference - (percentage / 100) * circumference;
    
    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute text-center">
          <div className="text-2xl font-bold" style={{ color }}>{Math.round(value)}</div>
          {label && <div className="text-xs text-gray-600">{label}</div>}
          {sublabel && <div className="text-xs text-gray-500">{sublabel}</div>}
        </div>
      </div>
    );
  };

  // Navigation
  const NavBar = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-md mx-auto flex justify-around py-3">
        <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center ${currentView === 'home' ? 'text-green-600' : 'text-gray-500'}`}>
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">Hem</span>
        </button>
        <button onClick={() => setCurrentView('meals')} className={`flex flex-col items-center ${currentView === 'meals' ? 'text-green-600' : 'text-gray-500'}`}>
          <Utensils className="w-6 h-6" />
          <span className="text-xs mt-1">Måltider</span>
        </button>
        <button onClick={() => setCurrentView('weight')} className={`flex flex-col items-center ${currentView === 'weight' ? 'text-green-600' : 'text-gray-500'}`}>
          <Scale className="w-6 h-6" />
          <span className="text-xs mt-1">Vikt</span>
        </button>
        <button onClick={() => setCurrentView('water')} className={`flex flex-col items-center ${currentView === 'water' ? 'text-green-600' : 'text-gray-500'}`}>
          <Droplet className="w-6 h-6" />
          <span className="text-xs mt-1">Vatten</span>
        </button>
        <button onClick={() => setCurrentView('stats')} className={`flex flex-col items-center ${currentView === 'stats' ? 'text-green-600' : 'text-gray-500'}`}>
          <BarChart3 className="w-6 h-6" />
          <span className="text-xs mt-1">Stats</span>
        </button>
      </div>
    </div>
  );

  const COLORS = ['#F59E0B', '#3B82F6', '#10B981'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">KaloriKollen</h1>
                <p className="text-xs text-gray-500">Din hälsopartner</p>
              </div>
            </div>
            {currentView === 'stats' && (
              <button onClick={exportData} className="p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-colors">
                <Download className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto">
        {/* HOME VIEW */}
        {currentView === 'home' && (
          <div className="p-6 space-y-6">
            {/* Streak & Badges */}
            {(streak > 0 || badges.length > 0) && (
              <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl shadow-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">Din streak</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-4xl font-bold">{streak}</span>
                      <span className="text-2xl">🔥</span>
                    </div>
                    <p className="text-xs opacity-75 mt-1">dagar i rad</p>
                  </div>
                  
                  {badges.length > 0 && (
                    <div className="flex flex-col items-end">
                      <p className="text-xs opacity-90 mb-2">Senaste badges:</p>
                      <div className="flex space-x-1">
                        {badges.slice(-3).reverse().map((badge, idx) => (
                          <div key={idx} className="text-3xl" title={badge.name}>
                            {badge.emoji}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Progress Rings */}
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <span>Dagens progress</span>
                </div>
                <button 
                  onClick={getAICoaching}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
                >
                  💡 AI Coach
                </button>
              </h2>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col items-center">
                  <CircularProgress 
                    value={getTodayCalories()} 
                    max={parseInt(goals.calories)} 
                    size={110}
                    strokeWidth={8}
                    color="#10B981"
                    label="kcal"
                  />
                  <p className="text-sm text-gray-600 mt-3 font-medium">Kalorier</p>
                  <p className="text-xs text-gray-500">{getTodayCalories()} / {goals.calories}</p>
                </div>
                
                <div className="flex flex-col items-center">
                  <CircularProgress 
                    value={getTodayWater()} 
                    max={parseInt(goals.water)} 
                    size={110}
                    strokeWidth={8}
                    color="#3B82F6"
                    label="ml"
                  />
                  <p className="text-sm text-gray-600 mt-3 font-medium">Vatten</p>
                  <p className="text-xs text-gray-500">{getTodayWater()} / {goals.water}</p>
                </div>
              </div>

              {getTodayMeals().length > 0 && (
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <CircularProgress 
                      value={getTodayMacros().protein} 
                      max={parseInt(goals.protein)} 
                      size={70}
                      strokeWidth={6}
                      color="#F59E0B"
                    />
                    <p className="text-xs text-gray-600 mt-2">Protein</p>
                    <p className="text-xs text-gray-500">{getTodayMacros().protein.toFixed(0)}g</p>
                  </div>
                  <div className="text-center">
                    <CircularProgress 
                      value={getTodayMacros().carbs} 
                      max={parseInt(goals.carbs)} 
                      size={70}
                      strokeWidth={6}
                      color="#3B82F6"
                    />
                    <p className="text-xs text-gray-600 mt-2">Kolhydr.</p>
                    <p className="text-xs text-gray-500">{getTodayMacros().carbs.toFixed(0)}g</p>
                  </div>
                  <div className="text-center">
                    <CircularProgress 
                      value={getTodayMacros().fat} 
                      max={parseInt(goals.fat)} 
                      size={70}
                      strokeWidth={6}
                      color="#8B5CF6"
                    />
                    <p className="text-xs text-gray-600 mt-2">Fett</p>
                    <p className="text-xs text-gray-500">{getTodayMacros().fat.toFixed(0)}g</p>
                  </div>
                </div>
              )}
            </div>

            {/* AI Coaching Modal */}
            {showCoaching && (
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">💡</span>
                    <h3 className="font-bold text-lg">Din AI Coach</h3>
                  </div>
                  <button onClick={() => setShowCoaching(false)} className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {loadingCoaching ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-pulse text-center">
                      <div className="text-3xl mb-2">🤔</div>
                      <p>Analyserar din data...</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-4">
                    <p className="text-white leading-relaxed">{coachingMessage}</p>
                  </div>
                )}
              </div>
            )}

            {/* Camera Card */}
            <div className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-3xl shadow-2xl p-8 text-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Analysera mat 📸</h2>
                  <p className="text-green-100">AI-driven kalorianalys</p>
                </div>
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 bg-white text-green-600 rounded-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
              >
                Ta foto eller välj bild
              </button>
              
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageCapture} className="hidden" />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => setCurrentView('barcode')} className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all text-center text-white">
                <div className="text-3xl mb-2">📊</div>
                <p className="font-bold text-sm">Streckkod</p>
                <p className="text-xs opacity-90">Skanna vara</p>
              </button>
              
              <button onClick={() => setCurrentView('goals')} className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all text-center">
                <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="font-bold text-sm text-gray-900">Mål</p>
                <p className="text-xs text-gray-600">Sätt mål</p>
              </button>
              
              <button onClick={() => setCurrentView('favorites')} className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all text-center">
                <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="font-bold text-sm text-gray-900">Favoriter</p>
                <p className="text-xs text-gray-600">{favorites.length} st</p>
              </button>
            </div>
          </div>
        )}

        {/* BARCODE VIEW */}
        {currentView === 'barcode' && (
          <div className="p-6 space-y-6">
            <button onClick={() => setCurrentView('home')} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <X className="w-5 h-5" />
              <span>Tillbaka</span>
            </button>

            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl p-8 text-white">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-3xl font-bold mb-2">Streckkodsskanning</h2>
                <p className="text-indigo-100">Ange streckkod för packad mat</p>
              </div>
              
              <div className="space-y-4">
                <input 
                  type="text" 
                  value={barcode} 
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Ange streckkod (t.ex. 7310532100004)"
                  className="w-full px-5 py-4 rounded-2xl text-gray-900 text-lg font-mono focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50"
                  onKeyPress={(e) => e.key === 'Enter' && searchBarcode()}
                />
                
                <button 
                  onClick={searchBarcode}
                  disabled={!barcode || loadingBarcode}
                  className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {loadingBarcode ? 'Söker...' : '🔍 Sök produkt'}
                </button>
              </div>

              <p className="text-xs text-center text-indigo-100 mt-4">
                Använder Open Food Facts databas
              </p>
            </div>

            {barcodeProduct && (
              <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{barcodeProduct.name}</h3>
                  <button onClick={() => addToFavorites(barcodeProduct)} className="p-2 bg-yellow-100 text-yellow-600 rounded-xl hover:bg-yellow-200">
                    <Star className="w-5 h-5" />
                  </button>
                </div>
                
                {barcodeProduct.brand && <p className="text-sm text-gray-600 mb-4">{barcodeProduct.brand}</p>}
                
                {barcodeProduct.image && (
                  <img src={barcodeProduct.image} alt={barcodeProduct.name} className="w-full h-48 object-contain rounded-2xl mb-4" />
                )}

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 mb-4">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-green-700">{barcodeProduct.calories}</p>
                    <p className="text-green-600 font-medium mt-1">kcal / 100g</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-2xl p-4 text-center">
                    <p className="text-xs text-blue-600 font-medium mb-1">Kolhydr.</p>
                    <p className="text-2xl font-bold text-blue-700">{barcodeProduct.carbs}g</p>
                  </div>
                  <div className="bg-orange-50 rounded-2xl p-4 text-center">
                    <p className="text-xs text-orange-600 font-medium mb-1">Protein</p>
                    <p className="text-2xl font-bold text-orange-700">{barcodeProduct.protein}g</p>
                  </div>
                  <div className="bg-purple-50 rounded-2xl p-4 text-center">
                    <p className="text-xs text-purple-600 font-medium mb-1">Fett</p>
                    <p className="text-2xl font-bold text-purple-700">{barcodeProduct.fat}g</p>
                  </div>
                </div>

                <button 
                  onClick={addBarcodeProduct}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  ✅ Lägg till i dagboken
                </button>
              </div>
            )}
          </div>
        )}

        {/* ANALYZING VIEW */}
        {currentView === 'analyzing' && (
          <div className="p-6">
            <div className="bg-white rounded-3xl shadow-lg p-12 text-center border border-gray-100">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto flex items-center justify-center mb-6 animate-pulse">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Analyserar...</h2>
              <p className="text-gray-600">AI identifierar maten och beräknar näringsvärden</p>
              {image && <img src={image} alt="Mat" className="mt-6 rounded-2xl shadow-md max-h-64 mx-auto" />}
            </div>
          </div>
        )}

        {/* RESULT VIEW */}
        {currentView === 'result' && result && (
          <div className="p-6 space-y-6">
            <button onClick={() => { setCurrentView('home'); setImage(null); setResult(null); }} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <X className="w-5 h-5" />
              <span>Stäng</span>
            </button>

            {image && <img src={image} alt="Mat" className="w-full rounded-3xl shadow-lg" />}

            <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{result.dish}</h2>
                <button onClick={() => addToFavorites(result)} className="p-2 bg-yellow-100 text-yellow-600 rounded-xl hover:bg-yellow-200">
                  <Star className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">{result.portion}</p>
              
              {result.items && result.items.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Ingredienser:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.items.map((item, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{item}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 mb-4">
                <div className="text-center">
                  <p className="text-5xl font-bold text-green-700">{result.calories}</p>
                  <p className="text-green-600 font-medium mt-1">kcal</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-2xl p-4 text-center">
                  <p className="text-xs text-blue-600 font-medium mb-1">Kolhydr.</p>
                  <p className="text-2xl font-bold text-blue-700">{result.carbs}g</p>
                </div>
                <div className="bg-orange-50 rounded-2xl p-4 text-center">
                  <p className="text-xs text-orange-600 font-medium mb-1">Protein</p>
                  <p className="text-2xl font-bold text-orange-700">{result.protein}g</p>
                </div>
                <div className="bg-purple-50 rounded-2xl p-4 text-center">
                  <p className="text-xs text-purple-600 font-medium mb-1">Fett</p>
                  <p className="text-2xl font-bold text-purple-700">{result.fat}g</p>
                </div>
              </div>
            </div>

            <button onClick={() => { setCurrentView('home'); setImage(null); setResult(null); }} className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-semibold shadow-lg">
              Analysera ny måltid
            </button>
          </div>
        )}

        {/* MEALS VIEW */}
        {currentView === 'meals' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Måltidshistorik</h2>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">{meals.length} måltider</span>
            </div>

            {meals.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-xl p-12 text-center border border-gray-100">
                <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Inga måltider ännu</p>
                <p className="text-sm text-gray-500">Analysera din första måltid!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {meals.map((meal, idx) => (
                  <div key={idx} className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
                    {meal.image && <img src={meal.image} alt={meal.dish} className="w-full h-48 object-cover" />}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-gray-900">{meal.dish}</h3>
                        <span className="text-sm text-gray-500">{meal.timeStr}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{meal.dateStr}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-4">
                          <span className="text-sm"><span className="font-bold text-green-600">{meal.calories}</span> kcal</span>
                          <span className="text-sm"><span className="font-bold text-orange-600">{meal.protein}g</span> P</span>
                          <span className="text-sm"><span className="font-bold text-blue-600">{meal.carbs}g</span> K</span>
                          <span className="text-sm"><span className="font-bold text-purple-600">{meal.fat}g</span> F</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WEIGHT VIEW */}
        {currentView === 'weight' && (
          <div className="p-6 space-y-6">
            {weights.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 text-white shadow-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-5 h-5" />
                    <span className="text-sm opacity-90">Nuvarande</span>
                  </div>
                  <p className="text-3xl font-bold">{weights[0].weight}</p>
                  <p className="text-sm opacity-75">kg</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm opacity-90">Förändring</span>
                  </div>
                  <p className="text-3xl font-bold">
                    {weights.length > 1 ? (weights[0].weight - weights[weights.length - 1].weight).toFixed(1) : '0.0'}
                  </p>
                  <p className="text-sm opacity-75">kg</p>
                </div>
              </div>
            )}

            {weights.length > 1 && (
              <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Din viktresa</h3>
                </div>
                
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={[...weights].reverse()}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="dateStr" tick={{ fontSize: 12, fill: '#6B7280' }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFF', border: '2px solid #3B82F6', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="weight" stroke="#3B82F6" strokeWidth={3} fill="url(#colorWeight)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-xl p-6 border-2 border-blue-100">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Registrera vikt</h2>
              </div>
              
              <div className="flex space-x-3">
                <input type="number" step="0.1" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder="75.5" className="flex-1 px-5 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none text-xl font-semibold bg-white" />
                <button onClick={addWeight} disabled={!newWeight || parseFloat(newWeight) <= 0} className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-bold disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center space-x-2">
                  <Check className="w-6 h-6" />
                  <span>Spara</span>
                </button>
              </div>
            </div>

            {weights.length > 0 && (
              <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">Historik</h3>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">{weights.length}</span>
                </div>
                
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {weights.map((entry, index) => {
                    const isLatest = index === 0;
                    const prevWeight = index < weights.length - 1 ? weights[index + 1].weight : entry.weight;
                    const diff = entry.weight - prevWeight;
                    
                    return (
                      <div key={index} className={`flex items-center justify-between p-4 rounded-2xl border-2 ${isLatest ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-md' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isLatest ? 'bg-gradient-to-br from-blue-500 to-purple-500' : 'bg-gray-300'}`}>
                            <Scale className={`w-6 h-6 ${isLatest ? 'text-white' : 'text-gray-600'}`} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="text-2xl font-bold text-gray-900">{entry.weight} kg</p>
                              {index > 0 && diff !== 0 && (
                                <span className={`text-sm font-semibold px-2 py-1 rounded-lg ${diff < 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{entry.dateStr}</p>
                          </div>
                        </div>
                        <button onClick={() => deleteWeight(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-xl">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* WATER VIEW */}
        {currentView === 'water' && (
          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl shadow-2xl p-8 text-white">
              <div className="text-center mb-6">
                <Droplet className="w-20 h-20 mx-auto mb-4 opacity-90" />
                <h2 className="text-3xl font-bold mb-2">Vattenintag</h2>
                <p className="text-blue-100">Idag: {getTodayWater()} ml</p>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => addWater(250)} className="bg-white bg-opacity-20 backdrop-blur-sm py-4 rounded-2xl font-bold hover:bg-opacity-30 transition-all">
                  250ml
                </button>
                <button onClick={() => addWater(500)} className="bg-white bg-opacity-20 backdrop-blur-sm py-4 rounded-2xl font-bold hover:bg-opacity-30 transition-all">
                  500ml
                </button>
                <button onClick={() => addWater(750)} className="bg-white bg-opacity-20 backdrop-blur-sm py-4 rounded-2xl font-bold hover:bg-opacity-30 transition-all">
                  750ml
                </button>
              </div>
            </div>

            {waterIntake.length > 0 && (
              <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 text-lg mb-4">Historik</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {waterIntake.slice(0, 20).map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Droplet className="w-8 h-8 text-blue-500" />
                        <div>
                          <p className="font-bold text-blue-700">{entry.amount} ml</p>
                          <p className="text-sm text-gray-600">{entry.dateStr} {entry.timeStr}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STATS VIEW */}
        {currentView === 'stats' && (
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Statistik & Analys</h2>

            {/* BMI Calculator */}
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center space-x-2">
                <Target className="w-5 h-5 text-purple-600" />
                <span>BMI-Kalkylator</span>
              </h3>
              
              <div className="flex space-x-3 mb-4">
                <input type="number" value={userHeight} onChange={(e) => { setUserHeight(e.target.value); saveData('user-height', e.target.value); }} placeholder="Längd (cm)" className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:outline-none" />
              </div>

              {calculateBMI() && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center">
                  <p className="text-sm text-purple-600 font-medium mb-2">Ditt BMI</p>
                  <p className="text-5xl font-bold text-purple-700 mb-2">{calculateBMI()}</p>
                  <p className="text-sm text-purple-600">
                    {parseFloat(calculateBMI()) < 18.5 ? 'Undervikt' : parseFloat(calculateBMI()) < 25 ? 'Normalvikt' : parseFloat(calculateBMI()) < 30 ? 'Övervikt' : 'Fetma'}
                  </p>
                </div>
              )}
            </div>

            {/* Weekly Stats */}
            {meals.length > 0 && (
              <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <span>Veckostatistik</span>
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-2xl p-4 text-center">
                    <p className="text-sm text-green-600 font-medium mb-1">Snitt kalorier/dag</p>
                    <p className="text-3xl font-bold text-green-700">{getWeeklyStats().avgCals}</p>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-4 text-center">
                    <p className="text-sm text-blue-600 font-medium mb-1">Måltider denna vecka</p>
                    <p className="text-3xl font-bold text-blue-700">{getWeeklyStats().mealsCount}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Macros Distribution */}
            {getTodayMeals().length > 0 && (
              <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 text-lg mb-4">Dagens makrofördelning</h3>
                
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie 
                      data={[
                        { name: 'Protein', value: getTodayMacros().protein * 4 },
                        { name: 'Kolhydrater', value: getTodayMacros().carbs * 4 },
                        { name: 'Fett', value: getTodayMacros().fat * 9 }
                      ]} 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={80} 
                      dataKey="value" 
                      label
                    >
                      {[0, 1, 2].map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="text-center">
                    <div className="w-4 h-4 bg-orange-500 rounded-full mx-auto mb-1"></div>
                    <p className="text-xs text-gray-600">Protein</p>
                  </div>
                  <div className="text-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mx-auto mb-1"></div>
                    <p className="text-xs text-gray-600">Kolhydrater</p>
                  </div>
                  <div className="text-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-1"></div>
                    <p className="text-xs text-gray-600">Fett</p>
                  </div>
                </div>
              </div>
            )}

            {/* Export Section */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-2xl p-8 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Exportera all data</h3>
                  <p className="text-green-100">Spara all din data som JSON-fil</p>
                </div>
                <Download className="w-12 h-12 opacity-80" />
              </div>
              
              <button
                onClick={exportData}
                className="w-full py-4 bg-white text-green-600 rounded-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
              >
                📥 Ladda ner data
              </button>
              
              <p className="text-xs text-green-100 mt-3 text-center">
                Inkluderar: Vikter, Måltider, Vatten, Favoriter, Mål
              </p>
            </div>
          </div>
        )}

        {/* GOALS VIEW */}
        {currentView === 'goals' && (
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Mål & Inställningar</h2>

            <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Dagliga mål</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Viktmål (kg)</label>
                  <input type="number" step="0.1" value={goals.weight} onChange={(e) => { const newGoals = {...goals, weight: e.target.value}; setGoals(newGoals); saveData('user-goals', newGoals); }} placeholder="75.0" className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kalorimål (kcal)</label>
                  <input type="number" value={goals.calories} onChange={(e) => { const newGoals = {...goals, calories: e.target.value}; setGoals(newGoals); saveData('user-goals', newGoals); }} placeholder="2000" className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vattenmål (ml)</label>
                  <input type="number" value={goals.water} onChange={(e) => { const newGoals = {...goals, water: e.target.value}; setGoals(newGoals); saveData('user-goals', newGoals); }} placeholder="2000" className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Protein (g)</label>
                    <input type="number" value={goals.protein} onChange={(e) => { const newGoals = {...goals, protein: e.target.value}; setGoals(newGoals); saveData('user-goals', newGoals); }} className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-orange-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kolhydr. (g)</label>
                    <input type="number" value={goals.carbs} onChange={(e) => { const newGoals = {...goals, carbs: e.target.value}; setGoals(newGoals); saveData('user-goals', newGoals); }} className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fett (g)</label>
                    <input type="number" value={goals.fat} onChange={(e) => { const newGoals = {...goals, fat: e.target.value}; setGoals(newGoals); saveData('user-goals', newGoals); }} className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:outline-none" />
                  </div>
                </div>
              </div>

              {goals.weight && weights.length > 0 && (
                <div className="mt-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4">
                  <p className="text-sm text-green-600 font-medium mb-1">Progress mot viktmål</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-700">{weights[0].weight} kg</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-2xl font-bold text-green-700">{goals.weight} kg</span>
                  </div>
                  <p className="text-sm text-green-600 mt-2">
                    {(parseFloat(goals.weight) - weights[0].weight).toFixed(1)} kg kvar
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200">
              <div className="flex items-center space-x-3 mb-3">
                <Download className="w-6 h-6 text-blue-600" />
                <h3 className="font-bold text-gray-900">Exportera data</h3>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                Vill du spara all din data? Gå till <span className="font-bold text-blue-600">Stats-fliken</span> och tryck på nedladdningsknappen längst upp till höger för att exportera allt!
              </p>
              <button 
                onClick={() => setCurrentView('stats')} 
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
              >
                Gå till Stats
              </button>
            </div>
          </div>
        )}

        {/* FAVORITES VIEW */}
        {currentView === 'favorites' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Favoritmåltider</h2>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">{favorites.length}</span>
            </div>

            {favorites.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-xl p-12 text-center border border-gray-100">
                <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Inga favoriter ännu</p>
                <p className="text-sm text-gray-500">Spara dina favoriträtter för snabb loggning</p>
              </div>
            ) : (
              <div className="space-y-4">
                {favorites.map((fav, idx) => (
                  <div key={idx} className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900">{fav.dish}</h3>
                      <button onClick={() => deleteFavorite(idx)} className="p-2 text-red-500 hover:bg-red-100 rounded-xl">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-4">
                        <span className="text-sm"><span className="font-bold text-green-600">{fav.calories}</span> kcal</span>
                        <span className="text-sm"><span className="font-bold text-orange-600">{fav.protein}g</span> P</span>
                        <span className="text-sm"><span className="font-bold text-blue-600">{fav.carbs}g</span> K</span>
                        <span className="text-sm"><span className="font-bold text-purple-600">{fav.fat}g</span> F</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      {!['analyzing', 'result'].includes(currentView) && <NavBar />}
    </div>
  );
}

// Render app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<KaloriApp />);

// Initialize Lucide icons
document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});
