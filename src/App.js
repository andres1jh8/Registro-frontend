import logo from './logo.png';
import './App.css';

import CompShowRegister from './registro/ShowRegister';
import CompCreateBlog from './registro/CreateRegister';
import ReportContext from './ReportContext';

import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import { useRef } from 'react';

function App() {
  const reportFnRef = useRef(() => {});

  return (
    <div className="App">
      <BrowserRouter>
        <ReportContext.Provider value={{ imprimirReporte: () => reportFnRef.current() }}>
          <header className="App-header">
            
            {/* Logo */}
            <div className="header-left">
              <img src={logo} className="App-logo" alt="logo" />
            </div>

            {/* Título */}
            <div className="header-center">
              <h1 className="App-title">Registro Visitas</h1>
            </div>

            {/* Navegación */}
            <div className="header-right">
              <nav className="App-nav">
                <Link to="/">Inicio</Link>
                <Link to="/create">Crear</Link>
                <button className="btn-nav" onClick={() => reportFnRef.current()}>
                  Reporte
                </button>
              </nav>
            </div>
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
