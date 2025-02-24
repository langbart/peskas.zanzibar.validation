import React from 'react';
import ValidationForm from './pages/ValidationForm';

// Import styles
import '@tabler/core/dist/css/tabler.min.css';

function App() {
  return (
    <div className="page">
      <div className="page-wrapper">
        <div className="page-body">
          <div className="container-xl">
            <ValidationForm />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 