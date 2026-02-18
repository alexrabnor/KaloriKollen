function KaloriApp() {
  const { useState, useRef, useEffect } = React;
  
  const [currentView, setCurrentView] = useState('home');
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [meals, setMeals] = useState([]);
  
  // Hämtar din Google-nyckel från Vercel
  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''); 
  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedMeals = localStorage.getItem('meals');
    if (savedMeals) setMeals(JSON.parse(savedMeals));
  }, []);

  const analyzeImage = async (imageData) => {
    if (!apiKey) {
      alert("API-nyckel saknas i Vercel!");
      return;
    }

    setAnalyzing(true);
    setCurrentView('analyzing');

    try {
      const base64Data = imageData.split(',')[1];
      
      // VIKTIGT: Här anropar vi GOOGLE GEMINI, inte Anthropic
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Analysera bilden. Svara ENBART med JSON på svenska: {\"dish\":\"namn\",\"items\":[\"ingrediens\"],\"calories\":500,\"protein\":25,\"carbs\":45,\"fat\":15,\"portion\":\"1 portion\"}" },
              { inline_data: { mime_type: "image/jpeg", data: base64Data } }
            ]
          }]
        })
      });

      const data = await response.json();
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
      console.error('Fel vid analys:', error);
      alert('Kunde inte nå Google Gemini. Kontrollera din nyckel i Vercel.');
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

  return React.createElement('div', { className: 'min-h-screen bg-gray-50 pb-20 p-4' },
    React.createElement('div', { className: 'max-w-md mx-auto space-y-6' },
      React.createElement('h1', { className: 'text-2xl font-bold text-center text-green-600' }, '📸 KaloriKollen'),
      
      currentView === 'home' && React.createElement('div', { className: 'bg-green-600 rounded-3xl p-8 text-white shadow-xl text-center' },
        React.createElement('h2', { className: 'text-4xl font-bold mb-4' }, meals.reduce((s, m) => s + m.calories, 0), ' kcal'),
        React.createElement('p', { className: 'mb-6 opacity-80' }, 'Totalt idag'),
        React.createElement('button', {
          onClick: () => fileInputRef.current?.click(),
          className: 'w-full py-4 bg-white text-green-600 rounded-2xl font-bold'
        }, 'Ta bild på maten')
      ),

      currentView === 'analyzing' && React.createElement('div', { className: 'text-center p-10 bg-white rounded-3xl shadow' },
        React.createElement('div', { className: 'animate-spin text-4xl mb-4' }, '🌀'),
        React.createElement('p', { className: 'font-bold' }, 'Använder Google Gemini AI...')
      ),

      currentView === 'result' && result && React.createElement('div', { className: 'bg-white rounded-3xl p-6 shadow-xl' },
        React.createElement('img', { src: image, className: 'w-full rounded-2xl mb-4' }),
        React.createElement('h2', { className: 'text-xl font-bold' }, result.dish),
        React.createElement('p', { className: 'text-3xl font-bold text-green-600 my-2' }, result.calories, ' kcal'),
        React.createElement('button', { onClick: () => setCurrentView('home'), className: 'w-full py-3 bg-gray-200 rounded-xl mt-4' }, 'Klar')
      )
    ),
    React.createElement('input', { ref: fileInputRef, type: 'file', accept: 'image/*', onChange: handleImageCapture, className: 'hidden' })
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(KaloriApp));
