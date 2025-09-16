import axios from "axios";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const URI = `${process.env.REACT_APP_API_URL}/api/entradas`;;

const CompCreateBlog = () => {
  // --- Inicializar fecha y hora actual ---
  const now = new Date();
  const formatoFecha = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const formatoHora = now.toTimeString().slice(0, 5); // HH:MM

  const [fecha, setFecha] = useState(formatoFecha);
  const [horaEntrada, setHoraEntrada] = useState(formatoHora);
  const [nombre, setNombre] = useState("");
  const [dpi, setDPI] = useState("");
  const [fotoDPI, setFotoDPI] = useState(null);
  const [previewDPI, setPreviewDPI] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [firmaBase64, setFirmaBase64] = useState("");
  const [errors, setErrors] = useState({});
  const [useCamera, setUseCamera] = useState(false);

  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  // --- Inicializar canvas firma con fondo blanco ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // --- Manejar cámara ---
  useEffect(() => {
    if (useCamera) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => console.error("Error accediendo a la cámara:", err));
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [useCamera]);

  // Capturar foto desde cámara
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

  // --- Validación campo por campo ---
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
          const [hora, min] = value.split(":");
          const horaDate = new Date();
          horaDate.setHours(hora, min, 0, 0);
          if (horaDate > now) error = "No puedes poner una hora futura";
        }
        break;
      case "nombre":
        if (!value) error = "Nombre obligatorio";
        break;
      case "dpi":
        if (!value) error = "DPI obligatorio";
        else if (!/^\d{13}$/.test(value)) error = "El DPI debe tener 13 dígitos";
        break;
      case "motivo":
        if (!value) error = "Motivo obligatorio";
        break;
      case "empresa":
        if (!value) error = "Empresa obligatoria";
        break;
      case "firma":
        if (!value) error = "Firma obligatoria";
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // --- Validación completa antes de enviar ---
  const validarCampos = () => {
    const newErrors = {};
    const now = new Date();

    if (!fecha) newErrors.fecha = "Fecha obligatoria";
    else if (new Date(fecha) > now) newErrors.fecha = "No puedes poner una fecha futura";

    if (!horaEntrada) newErrors.horaEntrada = "Hora obligatoria";
    else if (fecha === now.toISOString().slice(0, 10)) {
      const [hora, min] = horaEntrada.split(":");
      const horaDate = new Date();
      horaDate.setHours(hora, min, 0, 0);
      if (horaDate > now) newErrors.horaEntrada = "No puedes poner una hora futura";
    }

    if (!nombre) newErrors.nombre = "Nombre obligatorio";
    if (!dpi) newErrors.dpi = "DPI obligatorio";
    else if (!/^\d{13}$/.test(dpi)) newErrors.dpi = "El DPI debe tener 13 dígitos";

    if (!motivo) newErrors.motivo = "Motivo obligatorio";
    if (!empresa) newErrors.empresa = "Empresa obligatoria";
    if (!firmaBase64) newErrors.firma = "Firma obligatoria";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Canvas Firma ---
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setFirmaBase64("");
    validarCampo("firma", "");
  };

  const saveFirma = () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL("image/png");
    setFirmaBase64(dataURL);
    validarCampo("firma", dataURL);
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);

    const draw = (ev) => {
      ctx.lineTo(ev.clientX - rect.left, ev.clientY - rect.top);
      ctx.stroke();
    };

    const stop = () => {
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stop);
    };

    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stop);
  };

  // --- Foto DPI desde archivo ---
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

  // --- Enviar formulario ---
  const store = async (e) => {
    e.preventDefault();

    if (!validarCampos()) {
      alert("Corrige los errores antes de guardar");
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
      formData.append("firma", firmaBase64);

      if (fotoDPI) {
        formData.append("fotoDPI", fotoDPI);
      }

      await axios.post(URI, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Entrada registrada con éxito");
      navigate("/");

    } catch (error) {
      console.error("Error al guardar entrada:", error);
      alert("Error al guardar entrada. Revisa los datos.");
    }
  };

  return (
    <div className="container">
      <h3>Crear Registro</h3>
      <form onSubmit={store}>
        {/* Fecha */}
        <div className="mb-3">
          <label className="form-label">Fecha</label>
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

        {/* Hora */}
        <div className="mb-3">
          <label className="form-label">Hora Entrada</label>
          <input
            type="time"
            className={`form-control ${errors.horaEntrada ? "is-invalid" : ""}`}
            value={horaEntrada}
            onChange={(e) => {
              setHoraEntrada(e.target.value);
              validarCampo("horaEntrada", e.target.value);
            }}
          />
          {errors.horaEntrada && <div className="invalid-feedback">{errors.horaEntrada}</div>}
        </div>

        {/* Nombre */}
        <div className="mb-3">
          <label className="form-label">Nombre</label>
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
        <div className="mb-3">
          <label className="form-label">DPI</label>
          <input
            type="text"
            className={`form-control ${errors.dpi ? "is-invalid" : ""}`}
            value={dpi}
            onChange={(e) => {
              setDPI(e.target.value);
              validarCampo("dpi", e.target.value);
            }}
          />
          {errors.dpi && <div className="invalid-feedback">{errors.dpi}</div>}
        </div>

        {/* Foto DPI */}
        <div className="mb-3">
          <label className="form-label">Foto DPI</label>
          <div className="d-flex gap-2">
            <input type="file" className="form-control" accept="image/*" onChange={handleDPIChange} />
            <button type="button" className="btn btn-secondary" onClick={() => setUseCamera(!useCamera)}>
              {useCamera ? "Usar archivo" : "Usar cámara"}
            </button>
          </div>

          {useCamera && (
            <div className="mt-2">
              <video ref={videoRef} autoPlay style={{ width: "100%", maxWidth: "300px" }}></video>
              <button type="button" className="btn btn-success mt-2" onClick={capturePhoto}>
                Capturar Foto
              </button>
            </div>
          )}

          {previewDPI && (
            <img
              src={previewDPI}
              alt="Preview DPI"
              style={{ width: "120px", height: "120px", objectFit: "cover", marginTop: "5px" }}
            />
          )}
        </div>

        {/* Motivo */}
        <div className="mb-3">
          <label className="form-label">Motivo</label>
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
        <div className="mb-3">
          <label className="form-label">Empresa</label>
          <input
            type="text"
            className={`form-control ${errors.empresa ? "is-invalid" : ""}`}
            value={empresa}
            onChange={(e) => {
              setEmpresa(e.target.value);
              validarCampo("empresa", e.target.value);
            }}
          />
          {errors.empresa && <div className="invalid-feedback">{errors.empresa}</div>}
        </div>

        {/* Firma */}
        <div className="mb-3">
          <label className="form-label">Firma</label>
          <canvas
            ref={canvasRef}
            width={400}
            height={150}
            style={{ border: "1px solid #000", backgroundColor: "#fff" }}
            onMouseDown={startDrawing}
          ></canvas>

          <div className="mt-2">
            <button type="button" className="btn btn-secondary me-2" onClick={clearCanvas}>
              Limpiar Firma
            </button>
            <button type="button" className="btn btn-success" onClick={saveFirma}>
              Guardar Firma
            </button>
          </div>

          {firmaBase64 && (
            <img
              src={firmaBase64}
              alt="Preview Firma"
              style={{ width: "200px", height: "100px", objectFit: "contain", marginTop: "5px" }}
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
