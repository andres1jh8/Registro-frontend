import axios from "axios";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const URI = `${process.env.REACT_APP_API_URL}/api/entradas`;

const CompCreateBlog = () => {
  const now = new Date();
  const formatoFecha = now.toISOString().slice(0, 10);
  const formatoHora = now.toTimeString().slice(0, 5);

  const [fecha, setFecha] = useState(formatoFecha);
  const [horaEntrada, setHoraEntrada] = useState(formatoHora);
  const [nombre, setNombre] = useState("");
  const [dpi, setDPI] = useState("");
  const [fotoDPI, setFotoDPI] = useState(null);
  const [previewDPI, setPreviewDPI] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [firmaBase64, setFirmaBase64] = useState("");
  const [firmaBlob, setFirmaBlob] = useState(null);
  const [errors, setErrors] = useState({});
  const [useCamera, setUseCamera] = useState(false);

  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  // --- Inicializar canvas ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // --- Cámara ---
  useEffect(() => {
    if (useCamera) {
      navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: { exact: "environment" } }, // trasera
        })
        .then((stream) => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch((err) => {
          console.warn("No se pudo abrir la cámara trasera, usando la disponible:", err);
          navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
              if (videoRef.current) videoRef.current.srcObject = stream;
            })
            .catch((err2) => console.error("Error accediendo a la cámara:", err2));
        });
    } else {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [useCamera]);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      setFotoDPI(blob);
      setPreviewDPI(URL.createObjectURL(blob));
    }, "image/jpeg");
  };

  // --- Validaciones ---
  const validarCampo = (name, value) => {
    const now = new Date();
    let error = "";

    switch (name) {
      case "fecha":
        if (!value) error = "Fecha obligatoria";
        else if (new Date(value) > now) error = "No puedes poner una fecha futura";
        break;
      case "horaEntrada":
        if (!value) error = "Hora de entrada obligatoria";
        else if (fecha === now.toISOString().slice(0, 10)) {
          const [h, m] = value.split(":");
          const horaDate = new Date();
          horaDate.setHours(h, m, 0, 0);
          if (horaDate > now) error = "No puedes poner una hora futura";
        }
        break;
      case "nombre":
        if (!value) error = "Nombre obligatorio";
        else if (value.length < 3) error = "El nombre debe tener al menos 3 caracteres";
        break;
      case "dpi":
        if (!value) error = "DPI obligatorio";
        else if (!/^\d{13}$/.test(value)) error = "El DPI debe tener 13 dígitos";
        break;
      case "motivo":
        if (!value) error = "Motivo obligatorio";
        else if (value.length < 5) error = "El motivo debe tener al menos 5 caracteres";
        break;
      case "empresa":
        if (!value) error = "Empresa obligatoria";
        else if (value.length < 2) error = "La empresa debe tener al menos 2 caracteres";
        break;
      case "firma":
        if (!value) error = "Firma obligatoria";
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return error === "";
  };

  const validarCampos = () => {
    const camposValidos = [
      validarCampo("fecha", fecha),
      validarCampo("horaEntrada", horaEntrada),
      validarCampo("nombre", nombre),
      validarCampo("dpi", dpi),
      validarCampo("motivo", motivo),
      validarCampo("empresa", empresa),
      validarCampo("firma", firmaBase64),
    ];

    return camposValidos.every(Boolean);
  };

  // --- Canvas Firma ---
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setFirmaBase64("");
    setErrors((prev) => ({ ...prev, firma: "Firma obligatoria" }));
  };

  const saveFirma = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      if (blob) {
        setFirmaBlob(blob);
        const reader = new FileReader();
        reader.onloadend = () => setFirmaBase64(reader.result);
        reader.readAsDataURL(blob);
        setErrors((prev) => ({ ...prev, firma: "" }));
      }
    }, "image/png");
  };

  const startDrawing = (e) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();

    const rect = canvas.getBoundingClientRect();
    const getPos = (ev) => {
      if (ev.touches) {
        ev.preventDefault();
        return {
          x: ev.touches[0].clientX - rect.left,
          y: ev.touches[0].clientY - rect.top,
        };
      } else {
        return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
      }
    };

    const pos = getPos(e);
    ctx.moveTo(pos.x, pos.y);

    const draw = (ev) => {
      if (ev.touches) ev.preventDefault();
      const p = getPos(ev);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    };

    const stop = () => {
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stop);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stop);
    };

    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stop);
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stop);
  };

  // --- DPI con validación solo números y máximo 13 ---
  const handleDPIInput = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 13) value = value.slice(0, 13);
    setDPI(value);
    validarCampo("dpi", value);
  };

  const handleDPIChange = (e) => {
    const file = e.target.files[0];
    setFotoDPI(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewDPI(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewDPI(null);
    }
  };

  const store = async (e) => {
    e.preventDefault();
    if (!validarCampos()) {
      alert("⚠️ Corrige los errores antes de guardar");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("fecha", fecha);
      formData.append("horaEntrada", horaEntrada);
      formData.append("nombre", nombre);
      formData.append("dpi", dpi);
      formData.append("motivo", motivo);
      formData.append("empresa", empresa);

      if (firmaBlob) formData.append("firma", firmaBlob, "firma.png");
      if (fotoDPI) formData.append("fotoDPI", fotoDPI);

      await axios.post(URI, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Entrada registrada con éxito");
      navigate("/");
    } catch (error) {
      if (error.response && error.response.data) {
        const { message, error: backendError } = error.response.data;
        alert(
          `❌ Error al guardar entrada:\n${message || backendError || "Error desconocido"}`
        );
      } else {
        alert("❌ Error al guardar entrada. Revisa tu conexión o inténtalo de nuevo.");
      }
    }
  };

  return (
    <div className="container py-3">
      <h3 className="mb-4 text-center">Crear Registro</h3>
      <form
        onSubmit={store}
        className="d-flex flex-column gap-3"
        style={{ maxWidth: "500px", margin: "0 auto" }}
      >
        {/* Fecha */}
        <div className="form-group">
          <label>Fecha</label>
          <input
            type="date"
            className={`form-control ${errors.fecha ? "is-invalid" : ""}`}
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value);
              validarCampo("fecha", e.target.value);
            }}
          />
          {errors.fecha && <div className="invalid-feedback">{errors.fecha}</div>}
        </div>

        {/* Hora Entrada */}
        <div className="form-group">
          <label>Hora Entrada</label>
          <input
            type="time"
            className={`form-control ${errors.horaEntrada ? "is-invalid" : ""}`}
            value={horaEntrada}
            onChange={(e) => {
              setHoraEntrada(e.target.value);
              validarCampo("horaEntrada", e.target.value);
            }}
          />
          {errors.horaEntrada && (
            <div className="invalid-feedback">{errors.horaEntrada}</div>
          )}
        </div>

        {/* Nombre */}
        <div className="form-group">
          <label>Nombre</label>
          <input
            type="text"
            className={`form-control ${errors.nombre ? "is-invalid" : ""}`}
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              validarCampo("nombre", e.target.value);
            }}
          />
          {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
        </div>

        {/* DPI */}
        <div className="form-group">
          <label>DPI</label>
          <input
            type="text"
            className={`form-control ${errors.dpi ? "is-invalid" : ""}`}
            value={dpi}
            onChange={handleDPIInput}
          />
          {errors.dpi && <div className="invalid-feedback">{errors.dpi}</div>}
        </div>

        {/* Foto DPI */}
        <div className="form-group">
          <label>Foto DPI</label>
          <div className="d-flex flex-wrap gap-2">
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={handleDPIChange}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setUseCamera(!useCamera)}
            >
              {useCamera ? "Usar archivo" : "Usar cámara"}
            </button>
          </div>
          {useCamera && (
            <div className="mt-2">
              <video
                ref={videoRef}
                autoPlay
                style={{ width: "100%", maxWidth: "300px" }}
              ></video>
              <button
                type="button"
                className="btn btn-success mt-2"
                onClick={capturePhoto}
              >
                Capturar Foto
              </button>
            </div>
          )}
          {previewDPI && (
            <img
              src={previewDPI}
              alt="Preview DPI"
              style={{
                width: "120px",
                height: "120px",
                objectFit: "cover",
                marginTop: "5px",
              }}
            />
          )}
        </div>

        {/* Motivo */}
        <div className="form-group">
          <label>Motivo</label>
          <input
            type="text"
            className={`form-control ${errors.motivo ? "is-invalid" : ""}`}
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value);
              validarCampo("motivo", e.target.value);
            }}
          />
          {errors.motivo && <div className="invalid-feedback">{errors.motivo}</div>}
        </div>

        {/* Empresa */}
        <div className="form-group">
          <label>Empresa</label>
          <input
            type="text"
            className={`form-control ${errors.empresa ? "is-invalid" : ""}`}
            value={empresa}
            onChange={(e) => {
              setEmpresa(e.target.value);
              validarCampo("empresa", e.target.value);
            }}
          />
          {errors.empresa && (
            <div className="invalid-feedback">{errors.empresa}</div>
          )}
        </div>

        {/* Firma */}
        <div className="form-group">
          <label>Firma</label>
          <canvas
            ref={canvasRef}
            width={400}
            height={150}
            style={{
              border: "1px solid #000",
              backgroundColor: "#fff",
              width: "100%",
              maxWidth: "100%",
              touchAction: "none",
            }}
            onMouseDown={startDrawing}
            onTouchStart={startDrawing}
          ></canvas>
          <div className="mt-2 d-flex gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={clearCanvas}
            >
              Limpiar Firma
            </button>
            <button
              type="button"
              className="btn btn-success"
              onClick={saveFirma}
            >
              Guardar Firma
            </button>
          </div>
          {firmaBase64 && (
            <img
              src={firmaBase64}
              alt="Preview Firma"
              style={{
                width: "200px",
                height: "100px",
                objectFit: "contain",
                marginTop: "5px",
              }}
            />
          )}
          {errors.firma && <div className="text-danger mt-1">{errors.firma}</div>}
        </div>

        <button type="submit" className="btn btn-primary mt-3">
          Guardar Entrada
        </button>
      </form>
    </div>
  );
};

export default CompCreateBlog;
