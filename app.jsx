function KaloriApp() {
  const { useState, useRef, useEffect } = React;
  
  // State
  const [currentView, setCurrentView] = useState('home');
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [meals, setMeals] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const fileInputRef = useRef(null);

  // Load data
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
    
    const savedMeals = localStorage.getItem('meals');
    if (savedMeals) setMeals(JSON.parse(savedMeals));
  }, []);

  // Image analysis with Gemini
  const analyzeImage = async (imageData) => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      alert('Du behöver lägga till din Google Gemini API-nyckel först!');
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
              { text: "Analysera denna maträtt och ge uppskattning av kalorier och makronutrienter. Svara ENDAST med JSON: {\"dish\":\"namn på svenska\",\"items\":[\"ingrediens1\",\"ingrediens2\"],\"calories\":500,\"protein\":25,\"carbs\":45,\"fat\":15,\"portion\":\"1 portion\"}" },
              { inline_data: { mime_type: "image/jpeg", data: base64Data } }
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
      localStorage.setItem('meals', JSON.stringify(updatedMeals));
      
      setResult(analysis);
      setCurrentView('result');
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Kunde inte analysera bilden: ' + error.message);
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

  const saveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    setShowApiKeyInput(false);
    alert('API-nyckel sparad! Nu kan du analysera mat.');
  };

  const getTodayCalories = () => {
    const today = new Date().toLocaleDateString('sv-SE');
    return meals.filter(m => m.dateStr === today).reduce((sum, m) => sum + m.calories, 0);
  };

  // Render
  return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 pb-20' },
    
    // Header
    React.createElement('div', { className: 'bg-white shadow-sm border-b border-gray-200' },
      React.createElement('div', { className: 'max-w-md mx-auto px-4 py-4' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('div', { className: 'flex items-center space-x-3' },
            React.createElement('div', { className: 'w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center' },
              React.createElement('span', { className: 'text-2xl' }, '📸')
            ),
            React.createElement('div', null,
              React.createElement('h1', { className: 'text-xl font-bold text-gray-900' }, 'KaloriKollen'),
              React.createElement('p', { className: 'text-xs text-gray-500' }, 'Powered by Google Gemini')
            )
          ),
          React.createElement('button', {
            onClick: () => setShowApiKeyInput(!showApiKeyInput),
            className: 'px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm font-semibold'
          }, apiKey ? '🔑 Klar' : '⚙️ Setup')
        )
      )
    ),

    // API Key Modal
    showApiKeyInput && React.createElement('div', { className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6' },
      React.createElement('div', { className: 'bg-white rounded-3xl p-8 max-w-md w-full' },
        React.createElement('div', { className: 'flex justify-between items-center mb-6' },
          React.createElement('h2', { className: 'text-2xl font-bold' }, 'Google Gemini API'),
          React.createElement('button', {
            onClick: () => setShowApiKeyInput(false),
            className: 'text-gray-500 hover:text-gray-700'
          }, '✕')
        ),
        React.createElement('p', { className: 'text-sm text-gray-600 mb-4' }, 
          'Få din gratis API-nyckel:'
        ),
        React.createElement('ol', { className: 'text-sm text-gray-600 mb-6 space-y-2 list-decimal list-inside' },
          React.createElement('li', null, 'Gå till aistudio.google.com/apikey'),
          React.createElement('li', null, 'Logga in med Google'),
          React.createElement('li', null, 'Klicka "Create API Key"'),
          React.createElement('li', null, 'Kopiera nyckeln hit!')
        ),
        React.createElement('input', {
          type: 'text',
          value: apiKey,
          onChange: (e) => setApiKey(e.target.value),
          placeholder: 'Klistra in API-nyckel här...',
          className: 'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none mb-4'
        }),
        React.createElement('button', {
          onClick: saveApiKey,
          disabled: !apiKey,
          className: 'w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold disabled:opacity-50'
        }, 'Spara nyckel')
      )
    ),

    // Main Content
    React.createElement('div', { className: 'max-w-md mx-auto p-6 space-y-6' },
      
      // Home View
      currentView === 'home' && React.createElement('div', { className: 'space-y-6' },
        
        // Today's calories
        meals.length > 0 && React.createElement('div', { className: 'bg-white rounded-3xl shadow-xl p-6 border border-gray-100' },
          React.createElement('h2', { className: 'font-bold text-gray-900 text-lg mb-4' }, 'Idag'),
          React.createElement('div', { className: 'bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center' },
            React.createElement('p', { className: 'text-sm text-green-600 font-medium mb-1' }, 'Kalorier'),
            React.createElement('p', { className: 'text-5xl font-bold text-green-700' }, getTodayCalories()),
            React.createElement('p', { className: 'text-xs text-green-600 mt-1' }, 'kcal')
          )
        ),

        // Camera card
        React.createElement('div', { className: 'bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-3xl shadow-2xl p-8 text-white' },
          React.createElement('div', { className: 'text-center mb-6' },
            React.createElement('div', { className: 'text-6xl mb-4' }, '📸'),
            React.createElement('h2', { className: 'text-2xl font-bold mb-2' }, 'Analysera mat'),
            React.createElement('p', { className: 'text-green-100' }, 'AI-driven kalorianalys med Google Gemini')
          ),
          React.createElement('button', {
            onClick: () => fileInputRef.current?.click(),
            className: 'w-full py-4 bg-white text-green-600 rounded-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all'
          }, '📷 Ta eller välj bild'),
          React.createElement('input', {
            ref: fileInputRef,
            type: 'file',
            accept: 'image/*',
            onChange: handleImageCapture,
            className: 'hidden'
          })
        )
      ),

      // Analyzing View
      currentView === 'analyzing' && React.createElement('div', { className: 'bg-white rounded-3xl shadow-lg p-12 text-center border border-gray-100' },
        React.createElement('div', { className: 'w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto flex items-center justify-center mb-6 animate-pulse' },
          React.createElement('span', { className: 'text-4xl' }, '🤖')
        ),
        React.createElement('h2', { className: 'text-2xl font-bold text-gray-900 mb-3' }, 'Analyserar med Google Gemini...'),
        React.createElement('p', { className: 'text-gray-600' }, 'AI identifierar maten'),
        image && React.createElement('img', { src: image, alt: 'Mat', className: 'mt-6 rounded-2xl shadow-md max-h-64 mx-auto' })
      ),

      // Result View
      currentView === 'result' && result && React.createElement('div', { className: 'space-y-6' },
        React.createElement('button', {
          onClick: () => { setCurrentView('home'); setImage(null); setResult(null); },
          className: 'flex items-center space-x-2 text-gray-600 hover:text-gray-900'
        }, '← Stäng'),

        image && React.createElement('img', { src: image, alt: 'Mat', className: 'w-full rounded-3xl shadow-lg' }),

        React.createElement('div', { className: 'bg-white rounded-3xl shadow-lg p-6 border border-gray-100' },
          React.createElement('h2', { className: 'text-2xl font-bold text-gray-900 mb-4' }, result.dish),
          
          result.items && React.createElement('div', { className: 'mb-4' },
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
              React.createElement('p', { className: 'text-2xl font-bold text-blue-700' }, result.carbs + 'g')
            ),
            React.createElement('div', { className: 'bg-orange-50 rounded-2xl p-4 text-center' },
              React.createElement('p', { className: 'text-xs text-orange-600 font-medium mb-1' }, 'Protein'),
              React.createElement('p', { className: 'text-2xl font-bold text-orange-700' }, result.protein + 'g')
            ),
            React.createElement('div', { className: 'bg-purple-50 rounded-2xl p-4 text-center' },
              React.createElement('p', { className: 'text-xs text-purple-600 font-medium mb-1' }, 'Fett'),
              React.createElement('p', { className: 'text-2xl font-bold text-purple-700' }, result.fat + 'g')
            )
          )
        ),

        React.createElement('button', {
          onClick: () => { setCurrentView('home'); setImage(null); setResult(null); },
          className: 'w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-semibold shadow-lg'
        }, 'Analysera ny måltid')
      ),

      // Meals History
      meals.length > 0 && currentView === 'home' && React.createElement('div', { className: 'bg-white rounded-3xl shadow-xl p-6 border border-gray-100' },
        React.createElement('h3', { className: 'font-bold text-gray-900 text-lg mb-4' }, 
          'Senaste måltider (' + meals.length + ')'
        ),
        React.createElement('div', { className: 'space-y-3' },
          ...meals.slice(0, 5).map((meal, idx) =>
            React.createElement('div', {
              key: idx,
              className: 'flex items-center space-x-3 p-3 bg-gray-50 rounded-xl'
            },
              meal.image && React.createElement('img', {
                src: meal.image,
                alt: meal.dish,
                className: 'w-16 h-16 rounded-xl object-cover'
              }),
              React.createElement('div', { className: 'flex-1' },
                React.createElement('p', { className: 'font-bold text-gray-900 text-sm' }, meal.dish),
                React.createElement('p', { className: 'text-xs text-gray-500' }, meal.dateStr + ' ' + meal.timeStr)
              ),
              React.createElement('div', { className: 'text-right' },
                React.createElement('p', { className: 'font-bold text-green-600' }, meal.calories),
                React.createElement('p', { className: 'text-xs text-gray-500' }, 'kcal')
              )
            )
          )
        )
      )
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(KaloriApp));
