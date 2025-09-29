// src/pages/Home.js
import React from "react";
import "./Home.css";

const Home = () => {
  return (
    <div className="home-page">
      <div className="home-background" />
      <div className="home-overlay">
        <main className="home-content">
          <h1>Bienvenido al Sistema de Entradas</h1>
          <p>Administra y registra las entradas de manera eficiente y segura.</p>
        </main>
        <footer className="home-footer">
          <p>© 2025 Sistema de Entradas. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
};

export default Home;
