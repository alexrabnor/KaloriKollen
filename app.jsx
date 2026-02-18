function KaloriApp() {
  const { useState, useRef, useEffect } = React;
  const [message, setMessage] = useState('Laddar KaloriKollen...');
  
  useEffect(() => {
    setMessage('KaloriKollen är redo! 🎉');
  }, []);
  
  return React.createElement('div', {
    className: 'min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-6'
  },
    React.createElement('div', {
      className: 'bg-white rounded-3xl shadow-2xl p-12 max-w-md text-center'
    },
      React.createElement('div', {
        className: 'w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-6 flex items-center justify-center'
      },
        React.createElement('span', { className: 'text-5xl' }, '📸')
      ),
      React.createElement('h1', {
        className: 'text-4xl font-bold text-gray-900 mb-4'
      }, 'KaloriKollen'),
      React.createElement('p', {
        className: 'text-xl text-gray-600 mb-8'
      }, message),
      React.createElement('p', {
        className: 'text-sm text-gray-500'
      }, 'Full version coming soon!')
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(KaloriApp));
