import logo from './logo.png';
import './App.css';

// importamos los componentes 
import CompShowBlogs from './registro/ShowRegister';
import CompCreateBlog from './registro/CreateRegister';
import CompEditBlog from './registro/EditRegister';

// importamos el router
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <nav className="App-nav">
            <Link to="/">Inicio</Link>
            <Link to="/create">Crear</Link>
            <Link to="/edit/1">Editar</Link>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<CompShowBlogs />} />
          <Route path="/create" element={<CompCreateBlog />} />
          <Route path="/edit/:id" element={<CompEditBlog />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
