// src/components/editRegister.js
import api from "../utils/axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const URI = "/salidas";

const CompEditBlog = () => {
  const { id } = useParams(); // id de la entrada relacionada
  const navigate = useNavigate();

  const [horaSalida, setHoraSalida] = useState("");
  const [error, setError] = useState("");

  // Obtener la salida existente si ya existe
  useEffect(() => {
    const getSalidaByEntradaId = async () => {
      try {
        const res = await api.get(`${URI}/entrada/${id}`);
        if (res.data && res.data.data && res.data.data.horaSalida) {
          // Si ya hay hora de salida registrada
          setHoraSalida(res.data.data.horaSalida);
        } else {
          // Si no hay salida, inicializar con hora local
          const now = new Date();
          const horaActual = now.toLocaleTimeString('es-GT', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
          });
          setHoraSalida(horaActual);
        }
      } catch (err) {
        console.error("Error al obtener la salida:", err);
      }
    };
    getSalidaByEntradaId();
  }, [id]);

  const updateSalida = async (e) => {
    e.preventDefault();

    if (!horaSalida) {
      setError("Hora de salida obligatoria");
      return;
    }

    try {
      // Intentar actualizar o crear la salida
      await api.put(`${URI}/${id}`, { horaSalida });
      alert("Hora de salida registrada correctamente");
      navigate("/");
    } catch (err) {
      console.error("Error al actualizar la salida:", err);
      alert(
        err.response?.data?.message || "Error al guardar la salida, intenta de nuevo"
      );
    }
  };

  return (
    <div className="container">
      <h3>Registrar Hora de Salida</h3>
      <form onSubmit={updateSalida}>
        <div className="mb-3">
          <label className="form-label">Hora de Salida</label>
          <input
            type="time"
            className={`form-control ${error ? "is-invalid" : ""}`}
            value={horaSalida}
            onChange={(e) => {
              setHoraSalida(e.target.value);
              if (e.target.value) setError("");
            }}
          />
          {error && <div className="invalid-feedback">{error}</div>}
        </div>

        <button type="submit" className="btn btn-primary mt-3">
          Guardar Salida
        </button>
      </form>
    </div>
  );
};

export default CompEditBlog;
