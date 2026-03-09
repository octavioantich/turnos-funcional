"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";


type Turno = {
  id: number;
  fecha: string;
  hora: string;
  activo: boolean;
  capacidad: number;
};

export default function Turnos() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [inscripciones, setInscripciones] = useState<any[]>([]);
  const [dni, setDni] = useState<string | null>(null);
  const [modal, setModal] = useState<any>(null);
  // adminModal puede ser "agregar" | "eliminar" | null o un objeto con turno e inscritos
  const [adminModal, setAdminModal] = useState<
    | { turno: Turno; inscritos: { nombre: string; apellido: string }[] }
    | "agregar"
    | "eliminar"
    | null
  >(null);
  const [nuevoDia, setNuevoDia] = useState("");
  const [nuevaHora, setNuevaHora] = useState("");
  const [modalRenovar, setModalRenovar] = useState(false);
  const [loadingRenovar, setLoadingRenovar] = useState(false);
  const [checked, setChecked] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);
  const router = useRouter();
  const cerrarSesion = () => {
    localStorage.removeItem("dni");
    router.replace("/login");
  };
  // ✅ 1. Validar sesión simple
  useEffect(() => {
    const storedDni = localStorage.getItem("dni");

    if (!storedDni) {
      router.replace("/login");
    } else {
      setDni(storedDni);
      setChecked(true);
    }
  }, [router]);

  // ✅ 2. Traer datos SOLO si está validado
  useEffect(() => {
    if (!checked) return;

    const fetchData = async () => {
      const { data: turnosData } = await supabase
        .from("turnos")
        .select("*")
        .order("fecha")
        .order("hora");

      const { data: inscData } = await supabase
        .from("inscripciones")
        .select("*");

      setTurnos(turnosData || []);
      setInscripciones(inscData || []);
    };

    fetchData();
  }, [checked]);

  // ✅ 3. Traer rol admin
  useEffect(() => {
    if (!dni) return;

    const fetchRol = async () => {
      const { data } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("dni", dni)
        .single();

      if (data?.rol === "admin") {
        setEsAdmin(true);
      }
    };

    fetchRol();
  }, [dni]);

  // ⛔ IMPORTANTE: recién ahora podés cortar render
  if (!checked) return null;

  
  const diasSemana = [...new Set(turnos.map((t) => t.fecha))].sort();
  const horarios = [...new Set(turnos.map((t) => t.hora))].sort();

  const estaAnotado = (turnoId: number) => {
    return inscripciones.some(
      (i) => i.turno_id === turnoId && i.usuario_dni === dni
    );
  };

  const cantidadInscriptos = (turnoId: number) => {
    return inscripciones.filter((i) => i.turno_id === turnoId).length;
  };

  // 🔥 FUNCIÓN CORREGIDA
  const turnoPaso = (fecha: string, hora: string) => {
    const ahora = new Date();

    const [year, month, day] = fecha.split("-").map(Number);
    const [hours, minutes] = hora.split(":").map(Number);

    const fechaTurno = new Date(
      year,
      month - 1,
      day,
      hours,
      minutes
    );

    return fechaTurno.getTime() < ahora.getTime();
  };


  const formatearFecha = (fecha: string) => {
    const d = new Date(fecha + "T00:00:00");
    return d.toLocaleDateString("es-AR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
  };

  const confirmarAccion = async () => {
    if (!modal || !dni) return;

    if (modal.tipo === "anotar") {
      const { error } = await supabase.from("inscripciones").insert({
        turno_id: modal.turno.id,
        usuario_dni: dni,
      });

      if (!error) {
        toast.success("Reserva confirmada");
      } else {
        toast.error("Error al confirmar reserva");
      }
    }

    if (modal.tipo === "cancelar") {
      const { error } = await supabase
        .from("inscripciones")
        .delete()
        .eq("turno_id", modal.turno.id)
        .eq("usuario_dni", dni);

      if (!error) {
        toast.success("Reserva cancelada");
      } else {
        toast.error("Error al cancelar reserva");
      }
    }

    const { data } = await supabase.from("inscripciones").select("*");
    setInscripciones(data || []);
    setModal(null);
  };

  // Función para abrir modal admin y traer inscritos (nombre y apellido)
  const abrirAdminTurno = async (turno: Turno) => {
    // Intentamos traer con relación (si la FK y el nombre de relación están configurados)
    try {
      const { data, error } = await supabase
        .from("inscripciones")
        .select("usuario_dni, usuarios(nombre, apellido)")
        .eq("turno_id", turno.id);

      if (!error && data) {
        const inscritos = (data || []).map((i: any) => {
          const u = i.usuarios || {};
          return { nombre: u.nombre || "", apellido: u.apellido || "" };
        });
        setAdminModal({ turno, inscritos });
        return;
      }
    } catch (e) {
      // continúa a fallback
    }

    // Fallback: traer inscripciones y luego usuarios por dni
    const { data: inscData, error: inscErr } = await supabase
      .from("inscripciones")
      .select("usuario_dni")
      .eq("turno_id", turno.id);

    if (inscErr) {
      toast.error("Error al traer inscripciones");
      return;
    }

    const dnis = (inscData || []).map((i: any) => i.usuario_dni);
    if (dnis.length === 0) {
      setAdminModal({ turno, inscritos: [] });
      return;
    }

    const { data: usuariosData, error: usuariosErr } = await supabase
      .from("usuarios")
      .select("nombre, apellido, dni")
      .in("dni", dnis);

    if (usuariosErr) {
      toast.error("Error al traer usuarios");
      return;
    }

    const inscritos = (usuariosData || []).map((u: any) => ({
      nombre: u.nombre || "",
      apellido: u.apellido || "",
    }));

    setAdminModal({ turno, inscritos });
  };

  const getTurno = (fecha: string, hora: string) => {
    return turnos.find((t) => t.fecha === fecha && t.hora === hora);
  };

  return (
    <div className="page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Turnos</h1>

        <button
          onClick={cerrarSesion}
          className="btn btn-muted text-sm"
        >
          Cerrar sesión
        </button>
      </div>
      {esAdmin && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setAdminModal("agregar")}
            className="btn btn-admin-add"
          >
            Agregar turno
          </button>

          <button
            onClick={() => setAdminModal("eliminar")}
            className="btn btn-admin-delete"
          >
            Eliminar turno
          </button>

          <button
            onClick={() => setModalRenovar(true)}
            className="btn btn-admin-renew"
          >
            Renovar semana
          </button>
        </div>
      )}
      {/* GRILLA */}
      <div className="overflow-x-auto">
        <div
          className="turnos-grid"
          style={{
            gridTemplateColumns: `repeat(${diasSemana.length}, minmax(100px, 1fr))`,
          }}
        >
          {/* HEADER */}
          {diasSemana.map((fecha) => (
            <div key={fecha} className="turnos-header">
              {formatearFecha(fecha)}
            </div>
          ))}

          {/* BOTONES */}
          {horarios.map((hora) =>
            diasSemana.map((fecha) => {
              const turno = getTurno(fecha, hora);
              if (!turno) return <div key={fecha + hora} className="h-14" />;

              const anotado = estaAnotado(turno.id);
              const inscriptosCount = cantidadInscriptos(turno.id);
              const lleno = inscriptosCount >= turno.capacidad;
              const paso = turnoPaso(turno.fecha, turno.hora);

              let estilo = "bg-[#48CDC1] text-black";
              let disabled = false;
              let title = "";

              if (anotado) {
                estilo = "turno-reservado";
              } else if (lleno || paso) {
                estilo = "turno-no-disponible";
                disabled = true;
                title = "Clase no disponible";
              }

              return (
                <button
                  key={fecha + hora}
                  disabled={disabled}
                  title={title}
                  onClick={() => {
                    if (esAdmin) {
                      abrirAdminTurno(turno);
                    } else {
                      setModal({
                        tipo: anotado ? "cancelar" : "anotar",
                        turno,
                      });
                    }
                  }}
                  className={`h-14 rounded-lg flex flex-col items-center justify-center text-sm font-medium
                  ${estilo}
                  ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:opacity-90"}
                  `}
                >
                  <div>{hora.slice(0, 5)}</div>
                  <div className="text-xs">
                    ({inscriptosCount}/{turno.capacidad})
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL usuario normal */}
      {modal && (
        <div className="modal-bg">
          <div className="modal">
            <p className="mb-4">
              {modal.tipo === "anotar"
                ? "¿Confirmar reserva?"
                : "¿Cancelar reserva?"}
            </p>

            <p className="mb-4 font-medium">
              {modal.turno.fecha} {modal.turno.hora.slice(0, 5)}
            </p>

            <div className="flex gap-2">
              <button
                className="btn-modal"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>

              <button
                className="btn-turno"
                onClick={confirmarAccion}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL admin: lista de inscritos (objeto) */}
      {adminModal && typeof adminModal === "object" && "turno" in adminModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="modal">
            <p className="mb-2 font-medium">
              Inscritos - {adminModal.turno.fecha} {adminModal.turno.hora.slice(0,5)}
            </p>

            {adminModal.inscritos.length === 0 ? (
              <p className="mb-4">No hay usuarios anotados.</p>
            ) : (
              <ul className="mb-4 max-h-60 overflow-auto w-80">
                {adminModal.inscritos.map((u, idx) => (
                  <li key={idx} className="py-1 border-b last:border-b-0 flex justify-between">
                    <span className="font-medium">{u.nombre}</span>
                    <span className="text-sm text-gray-600">{u.apellido}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2">
              <button className="btn-modal" onClick={() => setAdminModal(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL admin: agregar */}
      {adminModal === "agregar" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="modal modal-sm">
            <h2 className="mb-4 font-bold">Agregar turno</h2>

            <select
              className="select select-lg"
              onChange={(e) => setNuevoDia(e.target.value)}
            >
              <option value="">Seleccionar día</option>
              {diasSemana.map((d) => (
                <option key={d} value={d}>
                  {formatearFecha(d)}
                </option>
              ))}
            </select>

            <select
              className="select select-sm"
              onChange={(e) => setNuevaHora(e.target.value)}
            >
              <option value="">Seleccionar hora</option>
              {Array.from({ length: 24 }).map((_, h) => (
                <option key={h} value={`${h}:00:00`}>
                  {h.toString().padStart(2, "0")}:00
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                className="btn-modal"
                onClick={() => setAdminModal(null)}
              >
                Cancelar
              </button>

              <button
                className="btn btn-admin-add"
                onClick={async () => {
                  if (!nuevoDia || !nuevaHora) return;

                  await supabase.from("turnos").insert({
                    fecha: nuevoDia,
                    hora: nuevaHora,
                  });

                  toast.success("Turno agregado");

                  const { data } = await supabase
                    .from("turnos")
                    .select("*")
                    .order("fecha")
                    .order("hora");

                  setTurnos(data || []);
                  setAdminModal(null);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL admin: eliminar */}
      {adminModal === "eliminar" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="modal modal-sm">
            <h2 className="mb-4 font-bold">Eliminar turno</h2>

            <select
              className="w-full mb-4 border p-2"
              onChange={(e) => setNuevoDia(e.target.value)}
            >
              <option value="">Seleccionar turno</option>
              {turnos.map((t) => (
                <option key={t.id} value={t.id}>
                  {formatearFecha(t.fecha)} - {t.hora.slice(0,5)}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                className="btn-modal"
                onClick={() => setAdminModal(null)}
              >
                Cancelar
              </button>

              <button
                className="btn btn-admin-delete"
                onClick={async () => {
                  if (!nuevoDia) return;

                  await supabase
                    .from("turnos")
                    .delete()
                    .eq("id", nuevoDia);

                  toast.success("Turno eliminado");

                  const { data } = await supabase
                    .from("turnos")
                    .select("*")
                    .order("fecha")
                    .order("hora");

                  setTurnos(data || []);
                  setAdminModal(null);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      {modalRenovar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-96">
            <h2 className="text-lg font-bold mb-4 text-[#332921]">
              Renovar semana
            </h2>

            <p className="mb-6 text-sm text-gray-600">
              Se borrarán todos los turnos e inscripciones actuales.
              Esta acción no se puede deshacer.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalRenovar(false)}
                className="btn-modal"
                disabled={loadingRenovar}
              >
                Cancelar
              </button>

              <button
                onClick={async () => {
                  setLoadingRenovar(true);

                  const { error } = await supabase.rpc("renovar_semana_martes_modificado");

                  if (error) {
                    toast.error("Error al renovar semana");
                    console.error(error);
                    setLoadingRenovar(false);
                    return;
                  }

                  const { data } = await supabase
                    .from("turnos")
                    .select("*")
                    .order("fecha")
                    .order("hora");

                  setTurnos(data || []);
                  setInscripciones([]);

                  toast.success("Semana renovada");
                  setLoadingRenovar(false);
                  setModalRenovar(false);
                }}
                className="btn btn-admin-delete"
                disabled={loadingRenovar}
              >
                {loadingRenovar ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Confirmar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
