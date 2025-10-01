import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../utils/axios";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // 👈 usamos íconos bonitos

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    surname: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    role: "",
    usernameAdmin: "",
    passwordAdmin: "",
  });

  const [msg, setMsg] = useState("");
  const [error, setError] = useState({});
  const [adminValid, setAdminValid] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  // 👇 estados para mostrar/ocultar contraseña
  const [showPasswordUser, setShowPasswordUser] = useState(false);
  const [showPasswordAdmin, setShowPasswordAdmin] = useState(false);

  const adminTimeout = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setMsg("");
    validateField(name, value);

    if (name === "usernameAdmin" || name === "passwordAdmin") {
      checkAdminDebounced(name, value);
    }
  };

  const validateField = (name, value) => {
    switch (name) {
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setError(prev => ({ ...prev, email: emailRegex.test(value) ? "" : "Correo inválido" }));
        break;
      case "password":
        const pwdRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        setError(prev => ({ ...prev, password: pwdRegex.test(value) ? "" : "Mínimo 8 caracteres, letras y números" }));
        break;
      case "phone":
        const phoneRegex = /^\d{8}$/;
        setError(prev => ({ ...prev, phone: phoneRegex.test(value) ? "" : "Teléfono debe tener 8 dígitos" }));
        break;
      default:
        setError(prev => ({ ...prev, [name]: value ? "" : "Campo requerido" }));
    }
  };

  const checkAdmin = async (fieldName, fieldValue) => {
    const usernameAdmin = fieldName === "usernameAdmin" ? fieldValue : form.usernameAdmin;
    const passwordAdmin = fieldName === "passwordAdmin" ? fieldValue : form.passwordAdmin;

    if (!usernameAdmin || !passwordAdmin) {
      setAdminValid(false);
      return;
    }

    setCheckingAdmin(true);

    try {
      const res = await api.post("/auth/check-admin", {
        usernameAdmin: usernameAdmin.trim(),
        passwordAdmin: passwordAdmin.trim(),
      });
      if (res.data.valid) {
        setAdminValid(true);
        setError(prev => ({ ...prev, admin: "" }));
      } else {
        setAdminValid(false);
        setError(prev => ({ ...prev, admin: "Administrador no válido o contraseña incorrecta" }));
      }
    } catch (err) {
      setAdminValid(false);
      setError(prev => ({ ...prev, admin: err.response?.data?.message || "Error verificando admin" }));
    } finally {
      setCheckingAdmin(false);
    }
  };

  const checkAdminDebounced = (fieldName, fieldValue) => {
    if (adminTimeout.current) clearTimeout(adminTimeout.current);
    adminTimeout.current = setTimeout(() => checkAdmin(fieldName, fieldValue), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let hasErrors = false;
    Object.keys(form).forEach(key => {
      if (!form[key] && key !== "usernameAdmin" && key !== "passwordAdmin") {
        setError(prev => ({ ...prev, [key]: "Campo requerido" }));
        hasErrors = true;
      }
    });
    if (hasErrors || Object.values(error).some(msg => msg)) return;

    if (!form.usernameAdmin || !form.passwordAdmin || !adminValid) {
      setError(prev => ({ ...prev, admin: "Se requiere autorización de un administrador válido" }));
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        surname: form.surname.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        phone: form.phone.trim(),
        role: form.role,
        usernameAdmin: form.usernameAdmin.trim(),
        passwordAdmin: form.passwordAdmin.trim()
      };

      const res = await api.post("/auth/register", payload);
      setMsg(res.data.message || "Usuario registrado con éxito ✅");

      setForm({
        name: "",
        surname: "",
        username: "",
        email: "",
        password: "",
        phone: "",
        role: "",
        usernameAdmin: "",
        passwordAdmin: "",
      });
      setAdminValid(false);
      setError({});
    } catch (err) {
      setError(prev => ({ ...prev, submit: err.response?.data?.message || "Error al registrar usuario ❌" }));
    }
  };

  return (
    <div className="register-container">
      <h2>Registro de Usuario</h2>
      <form onSubmit={handleSubmit}>
        <h3>Datos del nuevo usuario</h3>
        <input name="name" placeholder="Nombre" value={form.name} onChange={handleChange} style={{ borderColor: error.name ? "red" : "green" }} />
        {error.name && <small style={{ color: "red" }}>{error.name}</small>}
        
        <input name="surname" placeholder="Apellido" value={form.surname} onChange={handleChange} style={{ borderColor: error.surname ? "red" : "green" }} />
        {error.surname && <small style={{ color: "red" }}>{error.surname}</small>}
        
        <input name="username" placeholder="Usuario" value={form.username} onChange={handleChange} style={{ borderColor: error.username ? "red" : "green" }} />
        {error.username && <small style={{ color: "red" }}>{error.username}</small>}
        
        <input name="email" type="email" placeholder="Correo" value={form.email} onChange={handleChange} style={{ borderColor: error.email ? "red" : "green" }} />
        {error.email && <small style={{ color: "red" }}>{error.email}</small>}

        {/* Campo de contraseña con ojito */}
        <div style={{ position: "relative" }}>
          <input
            name="password"
            type={showPasswordUser ? "text" : "password"}
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            style={{ borderColor: error.password ? "red" : "green", width: "100%", paddingRight: "30px" }}
          />
          <span
            onClick={() => setShowPasswordUser(!showPasswordUser)}
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              color: "gray"
            }}
          >
            {showPasswordUser ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        {error.password && <small style={{ color: "red" }}>{error.password}</small>}

        <input name="phone" placeholder="Teléfono" value={form.phone} onChange={handleChange} style={{ borderColor: error.phone ? "red" : "green" }} />
        {error.phone && <small style={{ color: "red" }}>{error.phone}</small>}

        <label>Rol del usuario:</label>
        <select name="role" value={form.role} onChange={handleChange} style={{ borderColor: error.role ? "red" : "green" }}>
          <option value="">-- Selecciona un rol --</option>
          <option value="Employee">Employee</option>
          <option value="Admin">Admin</option>
        </select>
        {error.role && <small style={{ color: "red" }}>{error.role}</small>}

        <h3>Autorización del Administrador</h3>
        <input name="usernameAdmin" placeholder="Usuario Admin" value={form.usernameAdmin} onChange={handleChange} />

        {/* Campo de contraseña admin con ojito también */}
        <div style={{ position: "relative" }}>
          <input
            name="passwordAdmin"
            type={showPasswordAdmin ? "text" : "password"}
            placeholder="Contraseña del Admin"
            value={form.passwordAdmin}
            onChange={handleChange}
            style={{ width: "100%", paddingRight: "30px" }}
          />
          <span
            onClick={() => setShowPasswordAdmin(!showPasswordAdmin)}
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              color: "gray"
            }}
          >
            {showPasswordAdmin ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        {checkingAdmin && <p style={{ color: "orange" }}>Verificando admin...</p>}
        {adminValid && !checkingAdmin && <p style={{ color: "green" }}>Administrador válido ✅</p>}
        {error.admin && <p style={{ color: "red" }}>{error.admin}</p>}

        <button type="submit" disabled={Object.values(error).some(msg => msg) || !adminValid}>Registrar</button>
        {error.submit && <p style={{ color: "red" }}>{error.submit}</p>}
      </form>

      {msg && <p style={{ color: "green", marginTop: "10px" }}>{msg}</p>}

      <p style={{ marginTop: "20px" }}>
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
      </p>
    </div>
  );
};

export default Register;
