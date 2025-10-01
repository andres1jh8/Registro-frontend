import api from "../utils/axios";
import { useState, useEffect, useCallback, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const CompShowRegister = ({ reportFnRef }) => {
  const { user } = useContext(AuthContext); // <-- obtenemos el usuario y su rol
  const [entradas, setEntradas] = useState([]);
  const [zoomImg, setZoomImg] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentMonth, setCurrentMonth] = useState(null);
  const [currentYear, setCurrentYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [mesesDisponibles, setMesesDisponibles] = useState([]);
  const [searchDpi, setSearchDpi] = useState("");
  const [searchEmpresa, setSearchEmpresa] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [mensaje, setMensaje] = useState(""); // <-- mensaje de rol

  const monthNames = [
    "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Cargar meses disponibles
  useEffect(() => {
    const fetchMeses = async () => {
      try {
        const res = await api.get("/entradas/meses");
        setMesesDisponibles(res.data.meses);
      } catch (err) {
        console.error("Error al cargar meses:", err);
      }
    };
    fetchMeses();
  }, []);

  // Función para cargar entradas
  const getEntradas = useCallback(async (pageNumber = 1) => {
    try {
      const res = await api.get("/entradas", {
        params: {
          page: pageNumber,
          month: selectedMonth,
          year: selectedYear,
          dpi: searchDpi,
          empresa: searchEmpresa,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        },
      });
      setEntradas(res.data.data);
      setTotalPages(res.data.totalPages);
      setCurrentMonth(res.data.filtros?.month);
      setCurrentYear(res.data.filtros?.year);
    } catch (error) {
      console.error("Error al cargar entradas:", error);
    }
  }, [selectedMonth, selectedYear, searchDpi, searchEmpresa, startDate, endDate]);

  useEffect(() => {
    getEntradas(page);
  }, [page, getEntradas]);

  const deleteEntrada = async (id) => {
    if (user.role !== "Admin") {  // <-- control de rol
      setMensaje("No tienes permisos para eliminar entradas");
      return;
    }
    if (window.confirm("¿Seguro que deseas eliminar esta entrada?")) {
      await api.delete(`/entradas/${id}`);
      getEntradas(page);
    }
  };

  const marcarSalida = async (entradaId) => {
  try {
    const now = new Date();
    const horaActual = now.toTimeString().slice(0, 5);
    await api.post('/salidas', { entradaId, horaSalida: horaActual });
    getEntradas(page);
  } catch (err) {
    console.error("Error al marcar salida:", err);
    alert("No se pudo registrar salida. Intenta nuevamente.");
  }
};


  const handleImageClick = (src) => setZoomImg(src);
  const closeZoom = () => setZoomImg(null);

  const handleMonthChange = (e) => {
    const [month, year] = e.target.value.split("-");
    setSelectedMonth(month);
    setSelectedYear(year);
    setPage(1);
  };

  const handlePrevPage = () => page > 1 && setPage(page - 1);
  const handleNextPage = () => page < totalPages && setPage(page + 1);

  const handleSearchDpi = (e) => setSearchDpi(e.target.value);
  const handleSearchEmpresa = (e) => setSearchEmpresa(e.target.value);
  const handleStartDate = (e) => setStartDate(e.target.value);
  const handleEndDate = (e) => setEndDate(e.target.value);

  const clearFilters = () => {
    setSearchDpi("");
    setSearchEmpresa("");
    setSelectedMonth("");
    setSelectedYear("");
    setStartDate("");
    setEndDate("");
    setPage(1);
    setMensaje(""); // <-- limpiar mensaje al limpiar filtros
  };

  // Función para imprimir reporte
  const imprimirReporte = useCallback(async () => {
    try {
      const res = await api.get("/entradas", {
        params: {
          month: selectedMonth,
          year: selectedYear,
          all: true,
          dpi: searchDpi,
          empresa: searchEmpresa,
          startDate,
          endDate
        }
      });

      const todasEntradas = res.data.data;
      const ventana = window.open("", "_blank");

      const style = `
        <style>
          @media print {
            @page { size: landscape; margin: 20px; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
          }
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #000; padding: 8px; text-align: center; }
          th { background-color: #cfe2ff; }
          img { max-width: 80px; max-height: 80px; object-fit: cover; }
        </style>
      `;

      let html = `
        <html>
          <head><title>Reporte de Entradas</title>${style}</head>
          <body>
            <h3>CONTROL DE INGRESO AL CENTRO DE DATOS EDIFICIO CONTRALORIA GENERAL DE CUENTAS ZONA 13</h3>
            <table>
              <thead>
                <tr>
                  <th>No.</th><th>Fecha</th><th>Hora Entrada</th><th>Hora Salida</th>
                  <th>Nombre</th><th>DPI</th><th>Foto DPI</th>
                  <th>Motivo</th><th>Empresa</th><th>Firma</th>
                </tr>
              </thead>
              <tbody>
      `;

      todasEntradas.forEach(entry => {
        const ultimaSalida = entry.salidas?.length ? entry.salidas[entry.salidas.length - 1].horaSalida : "";
        html += `
          <tr>
            <td>${entry.numero}</td>
            <td>${new Date(entry.fecha).toLocaleDateString()}</td>
            <td>${entry.horaEntrada}</td>
            <td>${ultimaSalida}</td>
            <td>${entry.nombre}</td>
            <td>${entry.dpi}</td>
            <td>${entry.fotoDPI ? `<img src="${entry.fotoDPI}" />` : "No disponible"}</td>
            <td>${entry.motivo}</td>
            <td>${entry.empresa}</td>
            <td>${entry.firma ? `<img src="${entry.firma}" />` : "No disponible"}</td>
          </tr>
        `;
      });

      html += `</tbody></table></body></html>`;
      ventana.document.write(html);
      ventana.document.close();
      setTimeout(() => ventana.print(), 500);

    } catch (error) {
      console.error("Error al generar reporte:", error);
      alert("No se pudo generar el reporte. Intenta de nuevo.");
    }
  }, [selectedMonth, selectedYear, searchDpi, searchEmpresa, startDate, endDate]);

  useEffect(() => {
    reportFnRef.current = imprimirReporte;
  }, [imprimirReporte, reportFnRef]);

  return (
    <div className="container py-3">
      {mensaje && <div className="alert alert-warning">{mensaje}</div>} {/* <-- mensaje de rol */}

      <div className="row">
        <div className="col">
          {/* Filtros */}
          <div className="mb-3 d-flex flex-wrap gap-2">
            <div>
              <label>DPI:</label>
              <input type="text" className="form-control" value={searchDpi} onChange={handleSearchDpi} placeholder="Buscar por DPI" />
            </div>
            <div>
              <label>Empresa:</label>
              <input type="text" className="form-control" value={searchEmpresa} onChange={handleSearchEmpresa} placeholder="Buscar por Empresa" />
            </div>
            <div>
              <label>Fecha inicio:</label>
              <input type="date" className="form-control" value={startDate} onChange={handleStartDate} />
            </div>
            <div>
              <label>Fecha fin:</label>
              <input type="date" className="form-control" value={endDate} onChange={handleEndDate} />
            </div>
            <div className="align-self-end">
              <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Limpiar filtros</button>
            </div>
          </div>

          <div className="mb-3">
            <label>Buscar por mes:</label>
            <select className="form-select w-auto d-inline-block ms-2" onChange={handleMonthChange}>
              <option value="">Mes / Año</option>
              {mesesDisponibles.map(({ month, year }) => (
                <option key={`${month}-${year}`} value={`${month}-${year}`}>
                  {monthNames[month]} {year}
                </option>
              ))}
            </select>
          </div>

          {currentMonth && currentYear && (
            <h5 className="mb-3">Mostrando entradas de: {monthNames[currentMonth]} {currentYear}</h5>
          )}

          {/* Tabla escritorio */}
          <div className="d-none d-md-block" style={{ overflowX: "auto" }}>
            <table className="table table-striped table-hover">
              <thead className="table-primary">
                <tr>
                  <th>No.</th><th>Fecha</th><th>Hora Entrada</th><th>Hora Salida</th>
                  <th>Nombre</th><th>DPI</th><th>Foto DPI</th>
                  <th>Motivo</th><th>Empresa</th><th>Firma</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entradas.map(entry => {
                  const ultimaSalida = entry.salidas?.length ? entry.salidas[entry.salidas.length - 1].horaSalida : "";
                  return (
                    <tr key={entry._id}>
                      <td>{entry.numero}</td>
                      <td>{new Date(entry.fecha).toLocaleDateString()}</td>
                      <td>{entry.horaEntrada}</td>
                      <td>{ultimaSalida}</td>
                      <td>{entry.nombre}</td>
                      <td>{entry.dpi}</td>
                      <td>{entry.fotoDPI ? <img src={entry.fotoDPI} alt="DPI" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", cursor: "pointer" }} onClick={() => handleImageClick(entry.fotoDPI)} /> : "No disponible"}</td>
                      <td>{entry.motivo}</td>
                      <td>{entry.empresa}</td>
                      <td>{entry.firma ? <img src={entry.firma} alt="Firma" style={{ width: "80px", height: "50px", objectFit: "contain", cursor: "pointer" }} onClick={() => handleImageClick(entry.firma)} /> : "No disponible"}</td>
                      <td className="d-flex flex-column gap-1">
                        {!ultimaSalida && <button className="btn btn-info btn-sm rounded" onClick={() => marcarSalida(entry._id)}>Marcar Salida</button>}
                        <button className="btn btn-danger btn-sm rounded" onClick={() => deleteEntrada(entry._id)}>Delete</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Tarjetas móviles / tablet */}
          <div className="d-block d-md-none">
            {entradas.map(entry => {
              const ultimaSalida = entry.salidas?.length ? entry.salidas[entry.salidas.length - 1].horaSalida : "";
              return (
                <div key={entry._id} className="card mb-3 shadow-sm" style={{ borderRadius: "10px" }}>
                  <div className="card-body p-3">
                    <p><strong>No:</strong> {entry.numero}</p>
                    <p><strong>Fecha:</strong> {new Date(entry.fecha).toLocaleDateString()}</p>
                    <p><strong>Hora Entrada:</strong> {entry.horaEntrada}</p>
                    <p><strong>Hora Salida:</strong> {ultimaSalida}</p>
                    <p><strong>Nombre:</strong> {entry.nombre}</p>
                    <p><strong>DPI:</strong> {entry.dpi}</p>
                    <p><strong>Foto DPI:</strong><br/>{entry.fotoDPI ? <img src={entry.fotoDPI} alt="DPI" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", cursor: "pointer" }} onClick={() => handleImageClick(entry.fotoDPI)} /> : "No disponible"}</p>
                    <p><strong>Motivo:</strong> {entry.motivo}</p>
                    <p><strong>Empresa:</strong> {entry.empresa}</p>
                    <p><strong>Firma:</strong><br/>{entry.firma ? <img src={entry.firma} alt="Firma" style={{ width: "120px", height: "70px", objectFit: "contain", cursor: "pointer" }} onClick={() => handleImageClick(entry.firma)} /> : "No disponible"}</p>
                    <div className="d-flex flex-wrap gap-2">
                      {!ultimaSalida && <button className="btn btn-info btn-sm flex-grow-1 rounded" onClick={() => marcarSalida(entry._id)}>Marcar Salida</button>}
                      <button className="btn btn-danger btn-sm flex-grow-1 rounded" onClick={() => deleteEntrada(entry._id)}>Delete</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Paginación */}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <button className="btn btn-secondary btn-sm" onClick={handlePrevPage} disabled={page === 1}>Anterior</button>
            <span>Página {page} de {totalPages}</span>
            <button className="btn btn-secondary btn-sm" onClick={handleNextPage} disabled={page === totalPages}>Siguiente</button>
          </div>

          {/* Zoom Imagen */}
          {zoomImg && (
            <div onClick={closeZoom} style={{ position: "fixed", top:0, left:0, width:"100%", height:"100%", backgroundColor:"rgba(0,0,0,0.8)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000, cursor:"zoom-out" }}>
              <img src={zoomImg} alt="Zoom" style={{ maxWidth:"90%", maxHeight:"90%", borderRadius:"8px" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompShowRegister;
