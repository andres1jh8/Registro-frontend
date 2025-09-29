import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/axios";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    surname: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    usernameAdmin: "",
    passwordAdmin: "",
  });

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [adminValid, setAdminValid] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setMsg("");
    if (e.target.name === "usernameAdmin" || e.target.name === "passwordAdmin") {
      checkAdminDebounced(e.target.name, e.target.value);
    }
  };

  // Función para chequear admin en backend
  const checkAdmin = async () => {
    const { usernameAdmin, passwordAdmin } = form;

    if (!usernameAdmin || !passwordAdmin) {
      setAdminValid(false);
      return;
    }

    setCheckingAdmin(true);

    try {
      // Endpoint especial para verificar admin (puede ser /auth/check-admin)
      const res = await api.post("/auth/check-admin", { usernameAdmin, passwordAdmin });
      if (res.data.valid) {
        setAdminValid(true);
        setError("");
      } else {
        setAdminValid(false);
        setError("El administrador no es válido o contraseña incorrecta.");
      }
    } catch (err) {
      setAdminValid(false);
      setError(err.response?.data?.message || "Error verificando admin");
    } finally {
      setCheckingAdmin(false);
    }
  };

  // Debounce simple para no disparar request en cada letra
  let adminTimeout;
  const checkAdminDebounced = (name, value) => {
    clearTimeout(adminTimeout);
    adminTimeout = setTimeout(checkAdmin, 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación local
    if (!form.name || !form.surname || !form.username || !form.email || !form.password || !form.phone) {
      setError("Por favor completa todos los datos del nuevo usuario.");
      return;
    }

    if (!form.usernameAdmin || !form.passwordAdmin) {
      setError("Se requiere autorización de un administrador para crear un usuario.");
      return;
    }

    if (!adminValid) {
      setError("El administrador no es válido o contraseña incorrecta.");
      return;
    }

    try {
      const res = await api.post("/auth/register", form);
      setMsg(res.data.message || "Usuario registrado con éxito ✅");

      // Reset del formulario
      setForm({
        name: "",
        surname: "",
        username: "",
        email: "",
        password: "",
        phone: "",
        usernameAdmin: "",
        passwordAdmin: "",
      });
      setAdminValid(false);
    } catch (err) {
      setError(err.response?.data?.message || "Error al registrar usuario ❌");
    }
  };

  return (
    <div className="register-container">
      <h2>Registro de Usuario</h2>
      <form onSubmit={handleSubmit}>
        <h3>Datos del nuevo usuario</h3>
        <input name="name" placeholder="Nombre" value={form.name} onChange={handleChange} />
        <input name="surname" placeholder="Apellido" value={form.surname} onChange={handleChange} />
        <input name="username" placeholder="Usuario" value={form.username} onChange={handleChange} />
        <input name="email" type="email" placeholder="Correo" value={form.email} onChange={handleChange} />
        <input name="password" type="password" placeholder="Contraseña" value={form.password} onChange={handleChange} />
        <input name="phone" placeholder="Teléfono" value={form.phone} onChange={handleChange} />

        <h3>Autorización del Administrador</h3>
        <input
          name="usernameAdmin"
          placeholder="Usuario/Admin"
          value={form.usernameAdmin}
          onChange={handleChange}
        />
        <input
          name="passwordAdmin"
          type="password"
          placeholder="Contraseña del Admin"
          value={form.passwordAdmin}
          onChange={handleChange}
        />
        {checkingAdmin && <p style={{ color: "orange" }}>Verificando admin...</p>}
        {adminValid && !checkingAdmin && <p style={{ color: "green" }}>Administrador válido ✅</p>}

        <button type="submit" disabled={!adminValid}>Registrar</button>
      </form>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
      {msg && <p style={{ color: "green", marginTop: "10px" }}>{msg}</p>}

      <p style={{ marginTop: "20px" }}>
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
      </p>
    </div>
  );
};

export default Register;
