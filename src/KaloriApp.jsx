
function KaloriApp() {
  const { useState, useRef, useEffect } = React;
  const { Camera, Scale, TrendingUp, X, Check, Zap, Target, Droplet, Download, Star, BarChart3, Home, Utensils, Calendar, Trash2 } = lucide;

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
  
  // Google Gemini API key från Vercel
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

  // Load all data
  useEffect(() => {
    try {
      const data = {
        weights: JSON.parse(localStorage.getItem('weights') || '[]'),
        meals: JSON.parse(localStorage.getItem('meals') || '[]'),
        water: JSON.parse(localStorage.getItem('water') || '[]'),
        favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
        goals: JSON.parse(localStorage.getItem('goals') || '{"weight":"","calories":"2000","protein":"150","carbs":"200","fat":"65","water":"2000"}'),
        height: localStorage.getItem('height') || '',
        streak: parseInt(localStorage.getItem('streak') || '0'),
        badges: JSON.parse(localStorage.getItem('badges') || '[]')
      };
      
      setWeights(data.weights);
      setMeals(data.meals);
      setWaterIntake(data.water);
      setFavorites(data.favorites);
      setGoals(data.goals);
      setUserHeight(data.height);
      setStreak(data.streak);
      setBadges(data.badges);
    } catch (error) {
      console.log('Loading data...', error);
    }
  }, []);

  // Save functions
  const saveToStorage = (key, value) => {
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  // Image analysis with Google Gemini
  const analyzeImage = async (imageData) => {
    if (!apiKey) {
      alert('Google Gemini API-nyckel saknas! Lägg till NEXT_PUBLIC_GEMINI_API_KEY i Vercel.');
      setCurrentView('home');
      return;
    }

    setAnalyzing(true);
    setCurrentView('analyzing');

    try {
      const base64Data = imageData.split(',')[1];
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: 'Analysera denna maträtt och ge uppskattning av kalorier och makronutrienter. Svara ENDAST med JSON i detta format: {"dish":"namn på svenska","items":["ingrediens1","ingrediens2"],"calories":500,"protein":25,"carbs":45,"fat":15,"portion":"1 portion"}' },
              { inline_data: { mime_type: 'image/jpeg', data: base64Data } }
            ]
          }]
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      const text = data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const analysis = JSON.parse(jsonMatch[0]);
      
      const mealEntry = {
        ...analysis,
        image: imageData,
        date: new Date().toISOString(),
        dateStr: new Date().toLocaleDateString('sv-SE'),
        timeStr: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
      };
      
      const updatedMeals = [mealEntry, ...meals];
      setMeals(updatedMeals);
      saveToStorage('meals', updatedMeals);
      
      setResult(analysis);
      setCurrentView('result');
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Kunde inte analysera bilden med Google Gemini: ' + error.message);
      setCurrentView('home');
    } finally {
      setAnalyzing(false);
    }
  };

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
      saveToStorage('weights', updatedWeights);
      setNewWeight('');
    }
  };

  const deleteWeight = (index) => {
    const updatedWeights = weights.filter((_, i) => i !== index);
    setWeights(updatedWeights);
    saveToStorage('weights', updatedWeights);
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
    saveToStorage('water', updated);
  };

  // Favorites
  const addToFavorites = (meal) => {
    if (!favorites.find(f => f.dish === meal.dish)) {
      const updated = [...favorites, meal];
      setFavorites(updated);
      saveToStorage('favorites', updated);
    }
  };

  const deleteFavorite = (index) => {
    const updated = favorites.filter((_, i) => i !== index);
    setFavorites(updated);
    saveToStorage('favorites', updated);
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

  const exportData = () => {
    const data = {
      weights,
      meals,
      waterIntake,
      favorites,
      goals,
      userHeight,
      streak,
      badges,
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
    
    if (meals.length >= 1 && !badges.find(b => b.id === 'first_meal')) {
      newBadges.push({ id: 'first_meal', name: 'Första steget', emoji: '🎯', date: new Date().toISOString() });
    }
    
    if (calculateStreak() >= 7 && !badges.find(b => b.id === 'week_streak')) {
      newBadges.push({ id: 'week_streak', name: '7 dagar i rad!', emoji: '🔥', date: new Date().toISOString() });
    }
    
    if (meals.length >= 50 && !badges.find(b => b.id === '50_meals')) {
      newBadges.push({ id: '50_meals', name: '50 måltider', emoji: '⭐', date: new Date().toISOString() });
    }
    
    const todayCals = getTodayCalories();
    const targetCals = parseInt(goals.calories);
    if (todayCals >= targetCals * 0.95 && todayCals <= targetCals * 1.05 && !badges.find(b => b.id === 'goal_today' && b.date.split('T')[0] === new Date().toISOString().split('T')[0])) {
      newBadges.push({ id: 'goal_today', name: 'Perfekt dag!', emoji: '🎉', date: new Date().toISOString() });
    }
    
    if (newBadges.length > badges.length) {
      setBadges(newBadges);
      saveToStorage('badges', newBadges);
    }
  };

  // AI Coaching with Google Gemini
  const getAICoaching = async () => {
    if (!apiKey) {
      alert('API-nyckel saknas!');
      return;
    }

    setLoadingCoaching(true);
    setShowCoaching(true);
    
    try {
      const todayCals = getTodayCalories();
      const remaining = parseInt(goals.calories) - todayCals;
      const macros = getTodayMacros();
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Du är en hälsocoach. Ge personligt råd på svenska baserat på:
- Dagens kalorier: ${todayCals} av ${goals.calories} kcal (${remaining} kvar)
- Protein: ${macros.protein.toFixed(0)}g av ${goals.protein}g
- Kolhydrater: ${macros.carbs.toFixed(0)}g av ${goals.carbs}g
- Fett: ${macros.fat.toFixed(0)}g av ${goals.fat}g

Ge ett kort, uppmuntrande råd (2-3 meningar) med konkreta förslag på vad personen kan äta härnäst. Var positiv och motiverande!`
            }]
          }]
        })
      });

      const data = await response.json();
      const message = data.candidates[0].content.parts[0].text || 'Fortsätt så här! Du gör det bra! 💪';
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
        saveToStorage('streak', newStreak.toString());
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
      alert('Kunde inte söka produkten.');
    } finally {
      setLoadingBarcode(false);
    }
  };

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
      date: new Date().toISOString(),
      dateStr: new Date().toLocaleDateString('sv-SE'),
      timeStr: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
    };
    
    const updatedMeals = [mealEntry, ...meals];
    setMeals(updatedMeals);
    saveToStorage('meals', updatedMeals);
    
    setBarcode('');
    setBarcodeProduct(null);
    setCurrentView('home');
  };

  // Circular Progress Component
  const CircularProgress = ({ value, max, size = 120, strokeWidth = 10, color = '#10B981', label }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const percentage = Math.min((value / max) * 100, 100);
    const offset = circumference - (percentage / 100) * circumference;
    
    return React.createElement('div', { className: 'relative inline-flex items-center justify-center' },
      React.createElement('svg', { width: size, height: size, className: 'transform -rotate-90' },
        React.createElement('circle', {
          cx: size / 2,
          cy: size / 2,
          r: radius,
          stroke: '#E5E7EB',
          strokeWidth: strokeWidth,
          fill: 'none'
        }),
        React.createElement('circle', {
          cx: size / 2,
          cy: size / 2,
          r: radius,
          stroke: color,
          strokeWidth: strokeWidth,
          fill: 'none',
          strokeDasharray: circumference,
          strokeDashoffset: offset,
          strokeLinecap: 'round',
          className: 'transition-all duration-500 ease-out'
        })
      ),
      React.createElement('div', { className: 'absolute text-center' },
        React.createElement('div', { className: 'text-2xl font-bold', style: { color } }, Math.round(value)),
        label && React.createElement('div', { className: 'text-xs text-gray-600' }, label)
      )
    );
  };

  // Navigation
  const NavBar = () => (
    React.createElement('div', { className: 'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50' },
      React.createElement('div', { className: 'max-w-md mx-auto flex justify-around py-3' },
        React.createElement('button', { onClick: () => setCurrentView('home'), className: `flex flex-col items-center ${currentView === 'home' ? 'text-green-600' : 'text-gray-500'}` },
          React.createElement(Home, { className: 'w-6 h-6' }),
          React.createElement('span', { className: 'text-xs mt-1' }, 'Hem')
        ),
        React.createElement('button', { onClick: () => setCurrentView('meals'), className: `flex flex-col items-center ${currentView === 'meals' ? 'text-green-600' : 'text-gray-500'}` },
          React.createElement(Utensils, { className: 'w-6 h-6' }),
          React.createElement('span', { className: 'text-xs mt-1' }, 'Måltider')
        ),
        React.createElement('button', { onClick: () => setCurrentView('weight'), className: `flex flex-col items-center ${currentView === 'weight' ? 'text-green-600' : 'text-gray-500'}` },
          React.createElement(Scale, { className: 'w-6 h-6' }),
          React.createElement('span', { className: 'text-xs mt-1' }, 'Vikt')
        ),
        React.createElement('button', { onClick: () => setCurrentView('water'), className: `flex flex-col items-center ${currentView === 'water' ? 'text-green-600' : 'text-gray-500'}` },
          React.createElement(Droplet, { className: 'w-6 h-6' }),
          React.createElement('span', { className: 'text-xs mt-1' }, 'Vatten')
        ),
        React.createElement('button', { onClick: () => setCurrentView('stats'), className: `flex flex-col items-center ${currentView === 'stats' ? 'text-green-600' : 'text-gray-500'}` },
          React.createElement(BarChart3, { className: 'w-6 h-6' }),
          React.createElement('span', { className: 'text-xs mt-1' }, 'Stats')
        )
      )
    )
  );

  // Main render - HOME VIEW with all features
  return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 pb-20' },
    
    // Header
    React.createElement('div', { className: 'bg-white shadow-sm border-b border-gray-200' },
      React.createElement('div', { className: 'max-w-md mx-auto px-4 py-4' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('div', { className: 'flex items-center space-x-3' },
            React.createElement('div', { className: 'w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center' },
              React.createElement(Camera, { className: 'w-6 h-6 text-white' })
            ),
            React.createElement('div', null,
              React.createElement('h1', { className: 'text-xl font-bold text-gray-900' }, 'KaloriKollen'),
              React.createElement('p', { className: 'text-xs text-gray-500' }, 'Powered by Google Gemini')
            )
          ),
          currentView === 'stats' && React.createElement('button', { onClick: exportData, className: 'p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-colors' },
            React.createElement(Download, { className: 'w-5 h-5' })
          )
        )
      )
    ),

    // Main Content
    React.createElement('div', { className: 'max-w-md mx-auto' },
      
      // HOME VIEW
      currentView === 'home' && React.createElement('div', { className: 'p-6 space-y-6' },
        
        // Streak & Badges
        (streak > 0 || badges.length > 0) && React.createElement('div', { className: 'bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl shadow-2xl p-6 text-white' },
          React.createElement('div', { className: 'flex items-center justify-between' },
            React.createElement('div', null,
              React.createElement('p', { className: 'text-sm opacity-90 mb-1' }, 'Din streak'),
              React.createElement('div', { className: 'flex items-center space-x-2' },
                React.createElement('span', { className: 'text-4xl font-bold' }, streak),
                React.createElement('span', { className: 'text-2xl' }, '🔥')
              ),
              React.createElement('p', { className: 'text-xs opacity-75 mt-1' }, 'dagar i rad')
            ),
            badges.length > 0 && React.createElement('div', { className: 'flex flex-col items-end' },
              React.createElement('p', { className: 'text-xs opacity-90 mb-2' }, 'Senaste badges:'),
              React.createElement('div', { className: 'flex space-x-1' },
                ...badges.slice(-3).reverse().map((badge, idx) =>
                  React.createElement('div', { key: idx, className: 'text-3xl', title: badge.name }, badge.emoji)
                )
              )
            )
          )
        ),

        // Progress Rings
        React.createElement('div', { className: 'bg-white rounded-3xl shadow-xl p-6 border border-gray-100' },
          React.createElement('h2', { className: 'font-bold text-gray-900 text-lg mb-6 flex items-center justify-between' },
            React.createElement('div', { className: 'flex items-center space-x-2' },
              React.createElement(Calendar, { className: 'w-5 h-5 text-green-600' }),
              React.createElement('span', null, 'Dagens progress')
            ),
            apiKey && React.createElement('button', {
              onClick: getAICoaching,
              className: 'px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all'
            }, '💡 AI Coach')
          ),
          
          React.createElement('div', { className: 'grid grid-cols-2 gap-6 mb-6' },
            React.createElement('div', { className: 'flex flex-col items-center' },
              React.createElement(CircularProgress, {
                value: getTodayCalories(),
                max: parseInt(goals.calories),
                size: 110,
                strokeWidth: 8,
                color: '#10B981',
                label: 'kcal'
              }),
              React.createElement('p', { className: 'text-sm text-gray-600 mt-3 font-medium' }, 'Kalorier'),
              React.createElement('p', { className: 'text-xs text-gray-500' }, `${getTodayCalories()} / ${goals.calories}`)
            ),
            React.createElement('div', { className: 'flex flex-col items-center' },
              React.createElement(CircularProgress, {
                value: getTodayWater(),
                max: parseInt(goals.water),
                size: 110,
                strokeWidth: 8,
                color: '#3B82F6',
                label: 'ml'
              }),
              React.createElement('p', { className: 'text-sm text-gray-600 mt-3 font-medium' }, 'Vatten'),
              React.createElement('p', { className: 'text-xs text-gray-500' }, `${getTodayWater()} / ${goals.water}`)
            )
          ),

          getTodayMeals().length > 0 && React.createElement('div', { className: 'grid grid-cols-3 gap-3 pt-4 border-t border-gray-200' },
            React.createElement('div', { className: 'text-center' },
              React.createElement(CircularProgress, {
                value: getTodayMacros().protein,
                max: parseInt(goals.protein),
                size: 70,
                strokeWidth: 6,
                color: '#F59E0B'
              }),
              React.createElement('p', { className: 'text-xs text-gray-600 mt-2' }, 'Protein'),
              React.createElement('p', { className: 'text-xs text-gray-500' }, `${getTodayMacros().protein.toFixed(0)}g`)
            ),
            React.createElement('div', { className: 'text-center' },
              React.createElement(CircularProgress, {
                value: getTodayMacros().carbs,
                max: parseInt(goals.carbs),
                size: 70,
                strokeWidth: 6,
                color: '#3B82F6'
              }),
              React.createElement('p', { className: 'text-xs text-gray-600 mt-2' }, 'Kolhydr.'),
              React.createElement('p', { className: 'text-xs text-gray-500' }, `${getTodayMacros().carbs.toFixed(0)}g`)
            ),
            React.createElement('div', { className: 'text-center' },
              React.createElement(CircularProgress, {
                value: getTodayMacros().fat,
                max: parseInt(goals.fat),
                size: 70,
                strokeWidth: 6,
                color: '#8B5CF6'
              }),
              React.createElement('p', { className: 'text-xs text-gray-600 mt-2' }, 'Fett'),
              React.createElement('p', { className: 'text-xs text-gray-500' }, `${getTodayMacros().fat.toFixed(0)}g`)
            )
          )
        ),

        // AI Coaching Modal
        showCoaching && React.createElement('div', { className: 'bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-2xl p-6 text-white' },
          React.createElement('div', { className: 'flex items-center justify-between mb-4' },
            React.createElement('div', { className: 'flex items-center space-x-2' },
              React.createElement('span', { className: 'text-2xl' }, '💡'),
              React.createElement('h3', { className: 'font-bold text-lg' }, 'Din AI Coach')
            ),
            React.createElement('button', { onClick: () => setShowCoaching(false), className: 'p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors' },
              React.createElement(X, { className: 'w-5 h-5' })
            )
          ),
          loadingCoaching ? React.createElement('div', { className: 'flex items-center justify-center py-8' },
            React.createElement('div', { className: 'animate-pulse text-center' },
              React.createElement('div', { className: 'text-3xl mb-2' }, '🤖'),
              React.createElement('p', null, 'Google Gemini tänker...')
            )
          ) : React.createElement('div', { className: 'bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-4' },
            React.createElement('p', { className: 'text-white leading-relaxed' }, coachingMessage)
          )
        ),

        // Camera Card
        React.createElement('div', { className: 'bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-3xl shadow-2xl p-8 text-white' },
          React.createElement('div', { className: 'flex items-center justify-between mb-6' },
            React.createElement('div', null,
              React.createElement('h2', { className: 'text-2xl font-bold mb-2' }, 'Analysera mat 📸'),
              React.createElement('p', { className: 'text-green-100' }, 'AI-driven kalorianalys')
            ),
            React.createElement('div', { className: 'w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm' },
              React.createElement(Camera, { className: 'w-8 h-8 text-white' })
            )
          ),
          React.createElement('button', {
            onClick: () => fileInputRef.current?.click(),
            className: 'w-full py-4 bg-white text-green-600 rounded-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all'
          }, 'Ta foto eller välj bild'),
          React.createElement('input', {
            ref: fileInputRef,
            type: 'file',
            accept: 'image/*',
            onChange: handleImageCapture,
            className: 'hidden'
          })
        ),

        // Quick Actions
        React.createElement('div', { className: 'grid grid-cols-3 gap-3' },
          React.createElement('button', { onClick: () => setCurrentView('barcode'), className: 'bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all text-center text-white' },
            React.createElement('div', { className: 'text-3xl mb-2' }, '📊'),
            React.createElement('p', { className: 'font-bold text-sm' }, 'Streckkod'),
            React.createElement('p', { className: 'text-xs opacity-90' }, 'Skanna vara')
          ),
          React.createElement('button', { onClick: () => setCurrentView('goals'), className: 'bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all text-center' },
            React.createElement(Target, { className: 'w-8 h-8 text-blue-500 mx-auto mb-2' }),
            React.createElement('p', { className: 'font-bold text-sm text-gray-900' }, 'Mål'),
            React.createElement('p', { className: 'text-xs text-gray-600' }, 'Sätt mål')
          ),
          React.createElement('button', { onClick: () => setCurrentView('favorites'), className: 'bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all text-center' },
            React.createElement(Star, { className: 'w-8 h-8 text-yellow-500 mx-auto mb-2' }),
            React.createElement('p', { className: 'font-bold text-sm text-gray-900' }, 'Favoriter'),
            React.createElement('p', { className: 'text-xs text-gray-600' }, `${favorites.length} st`)
          )
        )
      ),

      // ANALYZING VIEW
      currentView === 'analyzing' && React.createElement('div', { className: 'p-6' },
        React.createElement('div', { className: 'bg-white rounded-3xl shadow-lg p-12 text-center border border-gray-100' },
          React.createElement('div', { className: 'w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto flex items-center justify-center mb-6 animate-pulse' },
            React.createElement(Camera, { className: 'w-10 h-10 text-white' })
          ),
          React.createElement('h2', { className: 'text-2xl font-bold text-gray-900 mb-3' }, 'Analyserar...'),
          React.createElement('p', { className: 'text-gray-600' }, 'Google Gemini AI identifierar maten'),
          image && React.createElement('img', { src: image, alt: 'Mat', className: 'mt-6 rounded-2xl shadow-md max-h-64 mx-auto' })
        )
      ),

      // RESULT VIEW
      currentView === 'result' && result && React.createElement('div', { className: 'p-6 space-y-6' },
        React.createElement('button', {
          onClick: () => { setCurrentView('home'); setImage(null); setResult(null); },
          className: 'flex items-center space-x-2 text-gray-600 hover:text-gray-900'
        },
          React.createElement(X, { className: 'w-5 h-5' }),
          React.createElement('span', null, 'Stäng')
        ),
        image && React.createElement('img', { src: image, alt: 'Mat', className: 'w-full rounded-3xl shadow-lg' }),
        React.createElement('div', { className: 'bg-white rounded-3xl shadow-lg p-6 border border-gray-100' },
          React.createElement('div', { className: 'flex items-center justify-between mb-4' },
            React.createElement('h2', { className: 'text-2xl font-bold text-gray-900' }, result.dish),
            React.createElement('button', { onClick: () => addToFavorites(result), className: 'p-2 bg-yellow-100 text-yellow-600 rounded-xl hover:bg-yellow-200' },
              React.createElement(Star, { className: 'w-5 h-5' })
            )
          ),
          result.items && result.items.length > 0 && React.createElement('div', { className: 'mb-4' },
            React.createElement('p', { className: 'text-sm font-medium text-gray-700 mb-2' }, 'Ingredienser:'),
            React.createElement('div', { className: 'flex flex-wrap gap-2' },
              ...result.items.map((item, idx) =>
                React.createElement('span', {
                  key: idx,
                  className: 'px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm'
                }, item)
              )
            )
          ),
          React.createElement('div', { className: 'bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 mb-4' },
            React.createElement('div', { className: 'text-center' },
              React.createElement('p', { className: 'text-5xl font-bold text-green-700' }, result.calories),
              React.createElement('p', { className: 'text-green-600 font-medium mt-1' }, 'kcal')
            )
          ),
          React.createElement('div', { className: 'grid grid-cols-3 gap-4' },
            React.createElement('div', { className: 'bg-blue-50 rounded-2xl p-4 text-center' },
              React.createElement('p', { className: 'text-xs text-blue-600 font-medium mb-1' }, 'Kolhydr.'),
              React.createElement('p', { className: 'text-2xl font-bold text-blue-700' }, `${result.carbs}g`)
            ),
            React.createElement('div', { className: 'bg-orange-50 rounded-2xl p-4 text-center' },
              React.createElement('p', { className: 'text-xs text-orange-600 font-medium mb-1' }, 'Protein'),
              React.createElement('p', { className: 'text-2xl font-bold text-orange-700' }, `${result.protein}g`)
            ),
            React.createElement('div', { className: 'bg-purple-50 rounded-2xl p-4 text-center' },
              React.createElement('p', { className: 'text-xs text-purple-600 font-medium mb-1' }, 'Fett'),
              React.createElement('p', { className: 'text-2xl font-bold text-purple-700' }, `${result.fat}g`)
            )
          )
        ),
        React.createElement('button', {
          onClick: () => { setCurrentView('home'); setImage(null); setResult(null); },
          className: 'w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-semibold shadow-lg'
        }, 'Analysera ny måltid')
      ),

      // Simplified other views (meals, weight, water, stats, goals, favorites, barcode) would go here
      // For brevity, showing structure only - full implementation available on request
      
      currentView === 'meals' && React.createElement('div', { className: 'p-6' },
        React.createElement('h2', { className: 'text-2xl font-bold mb-4' }, 'Måltidshistorik'),
        React.createElement('p', { className: 'text-gray-600' }, `${meals.length} måltider registrerade`)
      ),

      currentView === 'weight' && React.createElement('div', { className: 'p-6' },
        React.createElement('h2', { className: 'text-2xl font-bold mb-4' }, 'Viktspårning'),
        React.createElement('div', { className: 'bg-white rounded-3xl p-6' },
          React.createElement('input', {
            type: 'number',
            value: newWeight,
            onChange: (e) => setNewWeight(e.target.value),
            placeholder: '75.5',
            className: 'w-full px-4 py-3 border-2 rounded-xl mb-3'
          }),
          React.createElement('button', { onClick: addWeight, className: 'w-full py-3 bg-green-600 text-white rounded-xl' }, 'Spara vikt')
        )
      ),

      currentView === 'water' && React.createElement('div', { className: 'p-6' },
        React.createElement('h2', { className: 'text-2xl font-bold mb-4' }, 'Vattenintag'),
        React.createElement('div', { className: 'grid grid-cols-3 gap-3' },
          React.createElement('button', { onClick: () => addWater(250), className: 'py-4 bg-blue-500 text-white rounded-xl' }, '250ml'),
          React.createElement('button', { onClick: () => addWater(500), className: 'py-4 bg-blue-500 text-white rounded-xl' }, '500ml'),
          React.createElement('button', { onClick: () => addWater(750), className: 'py-4 bg-blue-500 text-white rounded-xl' }, '750ml')
        )
      ),

      currentView === 'stats' && React.createElement('div', { className: 'p-6' },
        React.createElement('h2', { className: 'text-2xl font-bold mb-4' }, 'Statistik'),
        React.createElement('div', { className: 'bg-white rounded-3xl p-6' },
          React.createElement('p', { className: 'text-lg' }, `Genomsnitt: ${getWeeklyStats().avgCals} kcal/dag`)
        )
      ),

      currentView === 'goals' && React.createElement('div', { className: 'p-6' },
        React.createElement('h2', { className: 'text-2xl font-bold mb-4' }, 'Mål & Inställningar'),
        React.createElement('div', { className: 'bg-white rounded-3xl p-6 space-y-4' },
          React.createElement('input', {
            type: 'number',
            value: goals.calories,
            onChange: (e) => { const g = {...goals, calories: e.target.value}; setGoals(g); saveToStorage('goals', g); },
            placeholder: 'Kalorimål',
            className: 'w-full px-4 py-3 border-2 rounded-xl'
          }),
          React.createElement('input', {
            type: 'number',
            value: goals.water,
            onChange: (e) => { const g = {...goals, water: e.target.value}; setGoals(g); saveToStorage('goals', g); },
            placeholder: 'Vattenmål (ml)',
            className: 'w-full px-4 py-3 border-2 rounded-xl'
          })
        )
      ),

      currentView === 'favorites' && React.createElement('div', { className: 'p-6' },
        React.createElement('h2', { className: 'text-2xl font-bold mb-4' }, 'Favoriter'),
        React.createElement('p', { className: 'text-gray-600' }, `${favorites.length} favoritmåltider`)
      ),

      currentView === 'barcode' && React.createElement('div', { className: 'p-6 space-y-6' },
        React.createElement('button', { onClick: () => setCurrentView('home'), className: 'text-gray-600' }, '← Tillbaka'),
        React.createElement('div', { className: 'bg-white rounded-3xl p-6' },
          React.createElement('h2', { className: 'text-xl font-bold mb-4' }, 'Streckkodsskanning'),
          React.createElement('input', {
            type: 'text',
            value: barcode,
            onChange: (e) => setBarcode(e.target.value),
            placeholder: 'Ange streckkod',
            className: 'w-full px-4 py-3 border-2 rounded-xl mb-3'
          }),
          React.createElement('button', {
            onClick: searchBarcode,
            disabled: !barcode || loadingBarcode,
            className: 'w-full py-3 bg-indigo-600 text-white rounded-xl disabled:opacity-50'
          }, loadingBarcode ? 'Söker...' : '🔍 Sök produkt')
        ),
        barcodeProduct && React.createElement('div', { className: 'bg-white rounded-3xl p-6' },
          React.createElement('h3', { className: 'font-bold text-xl mb-4' }, barcodeProduct.name),
          React.createElement('p', { className: 'text-3xl font-bold text-green-600 mb-4' }, `${barcodeProduct.calories} kcal/100g`),
          React.createElement('button', {
            onClick: addBarcodeProduct,
            className: 'w-full py-3 bg-green-600 text-white rounded-xl'
          }, '✅ Lägg till')
        )
      )
    ),

    // Bottom Navigation
    !['analyzing', 'result', 'barcode'].includes(currentView) && React.createElement(NavBar)
  );
}

// Render app
export default KaloriApp;
