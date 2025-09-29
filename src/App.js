// src/App.js
import logo from './logo.png';
import './App.css';

import homeIcon from './assets/icons/home.svg';
import createIcon from './assets/icons/create.svg';
import reportIcon from './assets/icons/report.svg';
import logoutIcon from './assets/icons/logout.svg';
import registroIcon from './assets/icons/Registro.png'

import CompShowRegister from './registro/ShowRegister';
import CompCreateBlog from './registro/CreateRegister';
import ReportContext from './ReportContext';

import LoginPage from './pages/Login.js';
import RegisterPage from "./pages/Register.js";
import Home from "./pages/Home";

import { BrowserRouter, Route, Routes, Link, Navigate } from 'react-router-dom';
import { useRef, useContext } from 'react';
import { AuthContext } from './context/AuthContext';

function App() {
  const reportFnRef = useRef(() => {});
  const { user, logout } = useContext(AuthContext);

  // Middleware de ruta protegida
  const ProtectedRoute = ({ children }) => {
    if (!user) return <Navigate to="/login" replace />;
    return children;
  };

  return (
    <div className="App">
      <BrowserRouter>
        <ReportContext.Provider value={{ imprimirReporte: () => reportFnRef.current() }}>
          {/* Header */}
          <header className="App-header">
            <div className="header-left">
              <img src={logo} className="App-logo" alt="logo" />
            </div>
            <div className="header-center">
              <h1 className="App-title">Registro Visitas</h1>
            </div>
            <div className="header-right">
              {user && (
                <div className="user-info">
                  {/* Icono Home que redirige a /home */}
                  <Link to="/home" className="home-link">
                    <img src={homeIcon} alt="Home" className="home-user-icon" />
                  </Link>
                  <span>{user.username}</span>
                </div>
              )}
            </div>
          </header>

          {/* Body con sidebar y contenido */}
          {user && (
            <div className="App-body">
              {/* Sidebar */}
              <aside className="sidebar">
                {/* Contenedor superior */}
                <div className="btn-container">
                  <Link to="/" className="btn-nav">
                    <img src={registroIcon} alt="Inicio" className="btn-icon" />
                    <span>Registro</span>
                  </Link>
                  <Link to="/create" className="btn-nav">
                    <img src={createIcon} alt="Crear" className="btn-icon" />
                    <span>Crear</span>
                  </Link>
                  <button className="btn-nav" onClick={() => reportFnRef.current()}>
                    <img src={reportIcon} alt="Reporte" className="btn-icon" />
                    <span>Reporte</span>
                  </button>
                </div>

                {/* Contenedor inferior */}
                <div className="logout-container">
                  <button className="btn-nav logout-btn" onClick={logout}>
                    <img src={logoutIcon} alt="Salir" className="btn-icon" />
                    <span>Salir</span>
                  </button>
                </div>
              </aside>

              {/* Contenido principal */}
              <main className="main-content">
                <Routes>
                  <Route path="/" element={
                    <ProtectedRoute>
                      <CompShowRegister reportFnRef={reportFnRef} />
                    </ProtectedRoute>
                  } />
                  <Route path="/create" element={
                    <ProtectedRoute>
                      <CompCreateBlog />
                    </ProtectedRoute>
                  } />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/home" element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          )}

          {!user && (
            <main className="main-content">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </main>
          )}
        </ReportContext.Provider>
      </BrowserRouter>
    </div>
  );
}

export default App;
