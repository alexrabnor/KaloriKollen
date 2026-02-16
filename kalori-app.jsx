import React, { useState, useRef, useEffect } from 'react';
import { Camera, Scale, TrendingUp, History, X, Check } from 'lucide-react';

export default function KaloriApp() {
  const [currentView, setCurrentView] = useState('home');
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [weights, setWeights] = useState([]);
  const [newWeight, setNewWeight] = useState('');
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Load data from storage on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const weightsData = await window.storage.get('user-weights', false);
      if (weightsData) {
        setWeights(JSON.parse(weightsData.value));
      }
    } catch (error) {
      console.log('No stored weights yet');
    }
  };

  const saveWeights = async (newWeights) => {
    try {
      await window.storage.set('user-weights', JSON.stringify(newWeights), false);
    } catch (error) {
      console.error('Error saving weights:', error);
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      alert('Kunde inte starta kameran. Använd filväljaren istället.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      // Stop camera
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      setCameraActive(false);
      
      setImage(dataUrl);
      analyzeImage(dataUrl);
    }
  };

  const analyzeImage = async (imageData) => {
    setAnalyzing(true);
    setCurrentView('analyzing');

    try {
      const base64Data = imageData.split(',')[1];
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Data
                }
              },
              {
                type: 'text',
                text: `Analysera denna maträtt och ge en uppskattning av kaloriinnehållet och makronutrienter. 
                
Svara ENDAST med JSON i följande format (ingen annan text):
{
  "dish": "namn på maträtten på svenska",
  "items": ["ingrediens 1", "ingrediens 2", ...],
  "calories": antal kalorier (heltal),
  "protein": gram protein (decimal),
  "carbs": gram kolhydrater (decimal),
  "fat": gram fett (decimal),
  "portion": "uppskattad portionsstorlek",
  "confidence": "hög/medel/låg"
}`
              }
            ]
          }]
        })
      });

      const data = await response.json();
      const textContent = data.content.find(item => item.type === 'text')?.text || '';
      
      // Clean and parse JSON
      const jsonText = textContent.replace(/```json\n?|\n?```/g, '').trim();
      const analysis = JSON.parse(jsonText);
      
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

  const addWeight = () => {
    if (newWeight && parseFloat(newWeight) > 0) {
      const weightEntry = {
        weight: parseFloat(newWeight),
        date: new Date().toISOString(),
        dateStr: new Date().toLocaleDateString('sv-SE')
      };
      const updatedWeights = [weightEntry, ...weights];
      setWeights(updatedWeights);
      saveWeights(updatedWeights);
      setNewWeight('');
    }
  };

  const deleteWeight = (index) => {
    const updatedWeights = weights.filter((_, i) => i !== index);
    setWeights(updatedWeights);
    saveWeights(updatedWeights);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
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
                <p className="text-xs text-gray-500">Fota & analysera din mat</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto">
        {currentView === 'home' && (
          <div className="p-6 space-y-6">
            {/* Camera Section */}
            <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
              <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto flex items-center justify-center shadow-lg">
                  <Camera className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Fota din mat</h2>
                  <p className="text-gray-600">Ta en bild så analyserar vi kalorier och näring</p>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
                  >
                    📸 Ta foto
                  </button>
                  
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="w-full py-4 bg-white border-2 border-green-500 text-green-600 rounded-2xl font-semibold hover:bg-green-50 transition-all"
                  >
                    📁 Välj bild
                  </button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageCapture}
                  className="hidden"
                />
              </div>
            </div>

            {/* Weight Tracking Button */}
            <button
              onClick={() => setCurrentView('weight')}
              className="w-full bg-white rounded-3xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center">
                    <Scale className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-900 text-lg">Viktregistrering</h3>
                    <p className="text-sm text-gray-600">Följ din viktresa</p>
                  </div>
                </div>
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
            </button>
          </div>
        )}

        {currentView === 'analyzing' && (
          <div className="p-6">
            <div className="bg-white rounded-3xl shadow-lg p-12 text-center border border-gray-100">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto flex items-center justify-center mb-6 animate-pulse">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Analyserar...</h2>
              <p className="text-gray-600">AI identifierar maten och beräknar näringsvärden</p>
              {image && (
                <img src={image} alt="Mat" className="mt-6 rounded-2xl shadow-md max-h-64 mx-auto" />
              )}
            </div>
          </div>
        )}

        {currentView === 'result' && result && (
          <div className="p-6 space-y-6">
            <button
              onClick={() => {
                setCurrentView('home');
                setImage(null);
                setResult(null);
              }}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
              <span>Stäng</span>
            </button>

            {image && (
              <img src={image} alt="Mat" className="w-full rounded-3xl shadow-lg" />
            )}

            <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{result.dish}</h2>
              <p className="text-sm text-gray-500 mb-4">{result.portion}</p>
              
              {result.items && result.items.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Ingredienser:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.items.map((item, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {item}
                      </span>
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

              {result.confidence && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  Säkerhet: {result.confidence}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setCurrentView('home');
                setImage(null);
                setResult(null);
              }}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-semibold shadow-lg"
            >
              Analysera ny måltid
            </button>
          </div>
        )}

        {currentView === 'weight' && (
          <div className="p-6 space-y-6">
            <button
              onClick={() => setCurrentView('home')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
              <span>Tillbaka</span>
            </button>

            <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Registrera vikt</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Din vikt (kg)
                  </label>
                  <div className="flex space-x-3">
                    <input
                      type="number"
                      step="0.1"
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                      placeholder="75.5"
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none text-lg"
                    />
                    <button
                      onClick={addWeight}
                      disabled={!newWeight || parseFloat(newWeight) <= 0}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                    >
                      <Check className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {weights.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                        <History className="w-5 h-5" />
                        <span>Historik</span>
                      </h3>
                      <span className="text-sm text-gray-500">{weights.length} registreringar</span>
                    </div>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {weights.map((entry, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-gray-100"
                        >
                          <div>
                            <p className="text-2xl font-bold text-gray-900">{entry.weight} kg</p>
                            <p className="text-sm text-gray-600">{entry.dateStr}</p>
                          </div>
                          <button
                            onClick={() => deleteWeight(index)}
                            className="p-2 text-red-500 hover:bg-red-100 rounded-xl transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {weights.length > 1 && (
                      <div className="mt-6 p-4 bg-green-50 rounded-2xl border border-green-200">
                        <p className="text-sm font-medium text-green-800">
                          Förändring: {(weights[0].weight - weights[weights.length - 1].weight).toFixed(1)} kg
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {weights.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Scale className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>Ingen viktdata ännu</p>
                    <p className="text-sm">Börja registrera din vikt för att följa din utveckling</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}