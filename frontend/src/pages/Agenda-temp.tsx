import { API_URL } from '../api';
import { useEffect, useState } from "react";

type CalendarEvent = {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  status?: string;
  location?: string;
};

export default function Agenda() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function loadEvents() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/calendar/events`
      );

      if (!response.ok) {
        throw new Error("No fue posible consultar Google Calendar.");
      }

      const data = await response.json();

      setEvents(data.events || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError(
        "No pudimos conectar con Google Calendar. Verificá que el backend esté activo."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function formatDate(date: string) {
    if (!date) return "Fecha no disponible";

    const parsed = new Date(date);

    if (date.length === 10) {
      return parsed.toLocaleDateString("es-CR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
    }

    return parsed.toLocaleDateString("es-CR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function formatTime(date: string) {
    if (!date || date.length === 10) return "Todo el día";

    return new Date(date).toLocaleTimeString("es-CR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div style={{ padding: "24px", color: "#1e293b" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "28px" }}>Agenda</h2>
          <p style={{ color: "#64748b", marginTop: "8px" }}>
            Gestión y seguimiento de citas.
          </p>
        </div>

        <button
          onClick={loadEvents}
          disabled={loading}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "11px 18px",
            cursor: loading ? "wait" : "pointer",
            fontWeight: 600,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Actualizando..." : "↻ Actualizar agenda"}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "20px",
            minWidth: "180px",
          }}
        >
          <div style={{ color: "#64748b", fontSize: "14px" }}>
            Eventos cargados
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, marginTop: "8px" }}>
            {events.length}
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "20px",
            minWidth: "220px",
          }}
        >
          <div style={{ color: "#64748b", fontSize: "14px" }}>
            Fuente de información
          </div>
          <div style={{ fontWeight: 600, marginTop: "8px" }}>
            Google Calendar
          </div>
          <div style={{ color: "#16a34a", fontSize: "13px", marginTop: "4px" }}>
            ● Conectado
          </div>
        </div>
      </div>

      {lastUpdated && (
        <p style={{ fontSize: "12px", color: "#94a3b8" }}>
          Última actualización: {lastUpdated.toLocaleTimeString("es-CR")}
        </p>
      )}

      {loading && (
        <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
          Cargando eventos de Google Calendar...
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            padding: "16px",
            borderRadius: "10px",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "32px",
            textAlign: "center",
            color: "#64748b",
          }}
        >
          No hay eventos próximos en Google Calendar.
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #e2e8f0",
              fontWeight: 600,
            }}
          >
            Próximas citas
          </div>

          {events.map((event) => (
            <div
              key={event.id}
              style={{
                display: "flex",
                gap: "20px",
                padding: "20px",
                borderBottom: "1px solid #f1f5f9",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  background: "#eff6ff",
                  color: "#2563eb",
                  borderRadius: "10px",
                  padding: "12px",
                  minWidth: "90px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "12px" }}>
                  {formatDate(event.start).split(" ")[1]?.toUpperCase()}
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700 }}>
                  {formatDate(event.start).split(" ")[0]}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "16px" }}>
                  {event.summary}
                </div>

                <div style={{ color: "#64748b", fontSize: "14px", marginTop: "8px" }}>
                  {formatDate(event.start)} · {formatTime(event.start)}
                  {event.end && event.start.length !== 10 && (
                    <> – {formatTime(event.end)}</>
                  )}
                </div>

                {event.location && (
                  <div style={{ color: "#64748b", fontSize: "13px", marginTop: "6px" }}>
                    📍 {event.location}
                  </div>
                )}

                {event.description && (
                  <div style={{ color: "#64748b", fontSize: "13px", marginTop: "8px" }}>
                    {event.description}
                  </div>
                )}
              </div>

              <span
                style={{
                  background: "#dcfce7",
                  color: "#166534",
                  padding: "5px 10px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                Google Calendar
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
