import axios from "axios";
import { useState, useEffect, useCallback } from "react";

const URI_ENTRADAS = `${process.env.REACT_APP_API_URL}/api/entradas`;
const URI_SALIDAS = `${process.env.REACT_APP_API_URL}/api/salidas`;

const CompShowRegister = ({ reportFnRef }) => {
  const [blogs, setBlog] = useState([]);
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

  const monthNames = [
    "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  useEffect(() => {
    const fetchMeses = async () => {
      try {
        const res = await axios.get(`${URI_ENTRADAS}/meses`);
        setMesesDisponibles(res.data.meses);
      } catch (err) {
        console.error("Error al cargar meses:", err);
      }
    };
    fetchMeses();
  }, []);

  const getBlogs = useCallback(async (pageNumber, month = "", year = "", dpi = "", empresa = "") => {
    try {
      const res = await axios.get(`${URI_ENTRADAS}`, {
        params: { page: pageNumber, month, year, dpi, empresa },
      });
      setBlog(res.data.data);
      setTotalPages(res.data.totalPages);
      setCurrentMonth(res.data.month);
      setCurrentYear(res.data.year);
    } catch (error) {
      console.error("Error al cargar entradas:", error);
    }
  }, []);

  useEffect(() => {
    getBlogs(page, selectedMonth, selectedYear, searchDpi, searchEmpresa);
  }, [page, selectedMonth, selectedYear, searchDpi, searchEmpresa, getBlogs]);

  const deleteBlog = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar esta entrada?")) {
      await axios.delete(`${URI_ENTRADAS}/${id}`);
      getBlogs(page, selectedMonth, selectedYear, searchDpi, searchEmpresa);
    }
  };

  const marcarSalida = async (entradaId) => {
    try {
      const now = new Date();
      const horaActual = now.toTimeString().slice(0, 5);
      await axios.post(`${URI_SALIDAS}`, { entradaId, horaSalida: horaActual });
      getBlogs(page, selectedMonth, selectedYear, searchDpi, searchEmpresa);
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

  const imprimirReporte = useCallback(async () => {
    try {
      const res = await axios.get(`${URI_ENTRADAS}`, {
        params: {
          month: selectedMonth,
          year: selectedYear,
          all: true,
          dpi: searchDpi,
          empresa: searchEmpresa
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

      todasEntradas.forEach(blog => {
        const ultimaSalida = blog.salidas?.length ? blog.salidas[blog.salidas.length - 1].horaSalida : "";
        html += `
          <tr>
            <td>${blog.numero}</td>
            <td>${new Date(blog.fecha).toLocaleDateString()}</td>
            <td>${blog.horaEntrada}</td>
            <td>${ultimaSalida}</td>
            <td>${blog.nombre}</td>
            <td>${blog.dpi}</td>
            <td>${blog.fotoDPI ? `<img src="${blog.fotoDPI}" />` : "No disponible"}</td>
            <td>${blog.motivo}</td>
            <td>${blog.empresa}</td>
            <td>${blog.firma ? `<img src="${blog.firma}" />` : "No disponible"}</td>
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
  }, [selectedMonth, selectedYear, searchDpi, searchEmpresa]);

  useEffect(() => {
    reportFnRef.current = imprimirReporte;
  }, [imprimirReporte, reportFnRef]);

  return (
    <div className="container py-3">
      <div className="row">
        <div className="col">
          {/* Filtros */}
          <div className="mb-3 d-flex flex-wrap gap-2">
            <div>
              <label>DPI:</label>
              <input
                type="text"
                className="form-control"
                value={searchDpi}
                onChange={handleSearchDpi}
                placeholder="Buscar por DPI"
              />
            </div>
            <div>
              <label>Empresa:</label>
              <input
                type="text"
                className="form-control"
                value={searchEmpresa}
                onChange={handleSearchEmpresa}
                placeholder="Buscar por Empresa"
              />
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
            <table className="table table-striped-columns table-responsive">
              <thead className="table-primary">
                <tr>
                  <th>No.</th><th>Fecha</th><th>Hora Entrada</th><th>Hora Salida</th>
                  <th>Nombre</th><th>DPI</th><th>Foto DPI</th>
                  <th>Motivo</th><th>Empresa</th><th>Firma</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map(blog => {
                  const ultimaSalida = blog.salidas?.length ? blog.salidas[blog.salidas.length - 1].horaSalida : "";
                  return (
                    <tr key={blog._id}>
                      <td>{blog.numero}</td>
                      <td>{new Date(blog.fecha).toLocaleDateString()}</td>
                      <td>{blog.horaEntrada}</td>
                      <td>{ultimaSalida}</td>
                      <td>{blog.nombre}</td>
                      <td>{blog.dpi}</td>
                      <td>
                        {blog.fotoDPI ? (
                          <img
                            src={blog.fotoDPI}
                            alt="Foto DPI"
                            style={{
                              width: "60px",
                              height: "60px",
                              objectFit: "cover",
                              borderRadius: "8px",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                              cursor: "pointer",
                              transition: "transform 0.2s"
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"}
                            onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                            onClick={() => handleImageClick(blog.fotoDPI)}
                          />
                        ) : <span style={{ color: "#999" }}>No disponible</span>}
                      </td>
                      <td>{blog.motivo}</td>
                      <td>{blog.empresa}</td>
                      <td>
                        {blog.firma ? (
                          <img
                            src={blog.firma}
                            alt="Firma"
                            style={{
                              width: "80px",
                              height: "50px",
                              objectFit: "contain",
                              borderRadius: "6px",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                              cursor: "pointer",
                              transition: "transform 0.2s"
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"}
                            onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                            onClick={() => handleImageClick(blog.firma)}
                          />
                        ) : <span style={{ color: "#999" }}>No disponible</span>}
                      </td>
                      <td className="d-flex flex-column gap-1">
                        {!ultimaSalida && (
                          <button onClick={() => marcarSalida(blog._id)} className="btn btn-info btn-sm rounded">
                            Marcar Salida
                          </button>
                        )}
                        <button onClick={() => deleteBlog(blog._id)} className="btn btn-danger btn-sm rounded">
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tarjetas móviles */}
          <div className="d-block d-md-none">
            {blogs.map(blog => {
              const ultimaSalida = blog.salidas?.length ? blog.salidas[blog.salidas.length - 1].horaSalida : "";
              return (
                <div key={blog._id} className="card mb-3 shadow-sm" style={{ backgroundColor: "#f8f9fa", borderRadius: "10px" }}>
                  <div className="card-body p-3">
                    <p><strong>No:</strong> {blog.numero}</p>
                    <p><strong>Fecha:</strong> {new Date(blog.fecha).toLocaleDateString()}</p>
                    <p><strong>Hora Entrada:</strong> {blog.horaEntrada}</p>
                    <p><strong>Hora Salida:</strong> {ultimaSalida}</p>
                    <p><strong>Nombre:</strong> {blog.nombre}</p>
                    <p><strong>DPI:</strong> {blog.dpi}</p>
                    <p><strong>Foto DPI:</strong><br/>
                      {blog.fotoDPI ? (
                        <img
                          src={blog.fotoDPI}
                          alt="Foto DPI"
                          style={{
                            width: "100px",
                            height: "100px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                            cursor: "pointer",
                            transition: "transform 0.2s"
                          }}
                          onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"}
                          onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                          onClick={() => handleImageClick(blog.fotoDPI)}
                        />
                      ) : <span style={{ color: "#999" }}>No disponible</span>}
                    </p>
                    <p><strong>Motivo:</strong> {blog.motivo}</p>
                    <p><strong>Empresa:</strong> {blog.empresa}</p>
                    <p><strong>Firma:</strong><br/>
                      {blog.firma ? (
                        <img
                          src={blog.firma}
                          alt="Firma"
                          style={{
                            width: "120px",
                            height: "70px",
                            objectFit: "contain",
                            borderRadius: "6px",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                            cursor: "pointer",
                            transition: "transform 0.2s"
                          }}
                          onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"}
                          onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                          onClick={() => handleImageClick(blog.firma)}
                        />
                      ) : <span style={{ color: "#999" }}>No disponible</span>}
                    </p>
                    <div className="d-flex flex-wrap gap-2">
                      {!ultimaSalida && (
                        <button onClick={() => marcarSalida(blog._id)} className="btn btn-info btn-sm flex-grow-1 rounded">
                          Marcar Salida
                        </button>
                      )}
                      <button onClick={() => deleteBlog(blog._id)} className="btn btn-danger btn-sm flex-grow-1 rounded">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Paginación */}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <button className="btn btn-secondary btn-sm" onClick={handlePrevPage} disabled={page === 1}>Mes anterior</button>
            <span>Página {page} de {totalPages}</span>
            <button className="btn btn-secondary btn-sm" onClick={handleNextPage} disabled={page === totalPages}>Mes siguiente</button>
          </div>

          {/* Zoom Imagen */}
          {zoomImg && (
            <div
              onClick={closeZoom}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
                cursor: "zoom-out"
              }}
            >
              <img src={zoomImg} alt="Zoom" style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: "8px" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompShowRegister;
