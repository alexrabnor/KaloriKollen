function KaloriApp() {
  const { useState, useRef, useEffect } = React;
  
  // State - Hämtar nyckel från Vercels miljövariabler om de finns
  const [currentView, setCurrentView] = useState('home');
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [meals, setMeals] = useState([]);
  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''); 
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const fileInputRef = useRef(null);

  // Laddar historik och kollar om en nyckel sparats manuellt tidigare
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey && !apiKey) setApiKey(savedKey);
    
    const savedMeals = localStorage.getItem('meals');
    if (savedMeals) setMeals(JSON.parse(savedMeals));
  }, [apiKey]);

  // Analysera bilden med Gemini
  const analyzeImage = async (imageData) => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      alert('Ingen API-nyckel hittades. Lägg till en i inställningar eller via Vercel.');
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
              { text: "Analysera denna maträtt. Svara ENBART med JSON på svenska: {\"dish\":\"namn\",\"items\":[\"ingrediens\"],\"calories\":500,\"protein\":25,\"carbs\":45,\"fat\":15,\"portion\":\"1 portion\"}" },
              { inline_data: { mime_type: "image/jpeg", data: base64Data } }
            ]
          }]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const text = data.candidates[0].content.parts[0].text;
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const analysis = JSON.parse(cleanJson);
      
      const mealEntry = {
        ...analysis,
        image: imageData,
        id: Date.now(),
        dateStr: new Date().toLocaleDateString('sv-SE'),
        timeStr: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
      };
      
      const updatedMeals = [mealEntry, ...meals];
      setMeals(updatedMeals);
      localStorage.setItem('meals', JSON.stringify(updatedMeals));
      
      setResult(analysis);
      setCurrentView('result');
    } catch (error) {
      console.error('Analysfel:', error);
      alert('Kunde inte analysera bilden. Kontrollera din API-nyckel i Vercel/inställningar.');
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

  const deleteMeal = (id) => {
    const updatedMeals = meals.filter(m => m.id !== id);
    setMeals(updatedMeals);
    localStorage.setItem('meals', JSON.stringify(updatedMeals));
  };

  const getTodayCalories = () => {
    const today = new Date().toLocaleDateString('sv-SE');
    return meals.filter(m => m.dateStr === today).reduce((sum, m) => sum + m.calories, 0);
  };

  return React.createElement('div', { className: 'min-h-screen bg-gray-50 pb-20 font-sans' },
    // Header
    React.createElement('div', { className: 'bg-white shadow-sm p-4 mb-6' },
      React.createElement('div', { className: 'max-w-md mx-auto flex justify-between items-center' },
        React.createElement('h1', { className: 'text-xl font-bold text-green-600' }, '📸 KaloriKollen'),
        React.createElement('button', { 
          onClick: () => setShowApiKeyInput(true),
          className: 'text-xs bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors' 
        }, '⚙️ Setup')
      )
    ),

    // API Key Modal (om man vill ändra manuellt)
    showApiKeyInput && React.createElement('div', { className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6' },
      React.createElement('div', { className: 'bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl' },
        React.createElement('h2', { className: 'text-lg font-bold mb-4' }, 'API Inställningar'),
        React.createElement('input', {
          type: 'password',
          placeholder: 'Klistra in nyckel...',
          value: apiKey,
          onChange: (e) => setApiKey(e.target.value),
          className: 'w-full p-3 border rounded-xl mb-4 text-sm'
        }),
        React.createElement('button', {
          onClick: () => {
            localStorage.setItem('gemini_api_key', apiKey);
            setShowApiKeyInput(false);
          },
          className: 'w-full py-3 bg-green-600 text-white rounded-xl font-bold'
        }, 'Spara lokalt')
      )
    ),

    // Innehåll
    React.createElement('div', { className: 'max-w-md mx-auto px-4' },
      
      currentView === 'home' && React.createElement('div', { className: 'space-y-6' },
        React.createElement('div', { className: 'bg-gradient-to-br from-green-500 to-green-700 rounded-3xl p-8 text-white text-center shadow-xl' },
          React.createElement('p', { className: 'text-xs uppercase tracking-wider opacity-80' }, 'Kalorier idag'),
          React.createElement('h2', { className: 'text-6xl font-black my-2' }, getTodayCalories()),
          React.createElement('button', {
            onClick: () => fileInputRef.current?.click(),
            className: 'mt-6 w-full py-4 bg-white text-green-700 rounded-2xl font-bold shadow-md hover:bg-gray-50 active:scale-95 transition-all'
          }, '📷 Fotografera måltid')
        ),

        meals.length > 0 && React.createElement('div', { className: 'space-y-3' },
          React.createElement('h3', { className: 'font-bold text-gray-700 ml-1' }, 'Historik'),
          ...meals.map((meal) =>
            React.createElement('div', { key: meal.id, className: 'bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 animate-fadeIn' },
              meal.image && React.createElement('img', { src: meal.image, className: 'w-14 h-14 rounded-xl object-cover' }),
              React.createElement('div', { className: 'flex-1' },
                React.createElement('p', { className: 'font-bold text-gray-800' }, meal.dish),
                React.createElement('p', { className: 'text-xs text-gray-400' }, meal.timeStr)
              ),
              React.createElement('div', { className: 'text-right' },
                React.createElement('p', { className: 'font-bold text-green-600' }, meal.calories),
                React.createElement('button', { 
                  onClick: () => deleteMeal(meal.id),
                  className: 'text-red-300 hover:text-red-500 text-xs mt-1'
                }, 'Radera')
              )
            )
          )
        )
      ),

      currentView === 'analyzing' && React.createElement('div', { className: 'bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100' },
        React.createElement('div', { className: 'w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-6' }),
        React.createElement('h2', { className: 'text-xl font-bold text-gray-800' }, 'AI analyserar...'),
        React.createElement('p', { className: 'text-gray-500 text-sm mt-2' }, 'Identifierar näringsvärden')
      ),

      currentView === 'result' && result && React.createElement('div', { className: 'bg-white rounded-3xl p-6 shadow-xl border border-gray-100 animate-slideUp' },
        React.createElement('button', { onClick: () => setCurrentView('home'), className: 'mb-4 text-sm text-gray-500' }, '← Avbryt'),
        React.createElement('img', { src: image, className: 'w-full h-48 object-cover rounded-2xl mb-4' }),
        React.createElement('h2', { className: 'text-2xl font-bold text-gray-800' }, result.dish),
        React.createElement('div', { className: 'grid grid-cols-2 gap-3 my-6' },
          React.createElement('div', { className: 'bg-green-50 p-4 rounded-2xl border border-green-100 text-center' }, 
            React.createElement('p', { className: 'text-2xl font-bold text-green-700' }, result.calories),
            React.createElement('p', { className: 'text-xs text-green-600' }, 'kcal')
          ),
          React.createElement('div', { className: 'bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center' }, 
            React.createElement('p', { className: 'text-2xl font-bold text-blue-700' }, result.protein, 'g'),
            React.createElement('p', { className: 'text-xs text-blue-600' }, 'Protein')
          )
        ),
        React.createElement('button', { 
          onClick: () => setCurrentView('home'),
          className: 'w-full py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all'
        }, 'Spara i dagboken')
      )
    ),

    React.createElement('input', {
      ref: fileInputRef,
      type: 'file',
      accept: 'image/*',
      onChange: handleImageCapture,
      className: 'hidden'
    })
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(KaloriApp));
