import logo from './logo.png';
import './App.css';

import CompShowRegister from './registro/ShowRegister';
import CompCreateBlog from './registro/CreateRegister';
import ReportContext from './ReportContext';

import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import { useRef } from 'react';

function App() {
  // Guardamos la función imprimirReporte en una referencia
  const reportFnRef = useRef(() => {});

  return (
    <div className="App">
      <BrowserRouter>
        <ReportContext.Provider value={{ imprimirReporte: () => reportFnRef.current() }}>
          <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            
            {/* Texto central */}
            <div className="App-title">
              Registro Visitas
            </div>

            <nav className="App-nav">
              <Link to="/">Inicio</Link>
              <Link to="/create">Crear</Link>
              <button className="btn-nav" onClick={() => reportFnRef.current()}>
                Reporte
              </button>
            </nav>
          </header>


          <Routes>
            <Route path="/" element={<CompShowRegister reportFnRef={reportFnRef} />} />
            <Route path="/create" element={<CompCreateBlog />} />
          </Routes>
        </ReportContext.Provider>
      </BrowserRouter>
    </div>
  );
}

export default App;
