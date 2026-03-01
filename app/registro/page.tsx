"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Registro() {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const router = useRouter();

  const handleRegistro = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!nombre || !apellido || !dni || !telefono) {
      toast.error("Completá todos los campos");
      return;
    }

    const { error } = await supabase.from("usuarios").insert({
      nombre,
      apellido,
      dni,
      telefono,
      rol: "usuario",
    });

    if (error) {
      toast.error("Ese DNI ya está registrado");
      return;
    }

    toast.success("Registro exitoso");

    localStorage.setItem("dni", dni);
    router.push("/turnos");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFFF0]">
      {/* LOGO */}
      <img
        src="/logo_negro_sinfondo.png"
        alt="Logo"
        className="w-50 mb-6"
      />

      <form
        onSubmit={handleRegistro}
        className="w-full max-w-sm bg-white p-8 rounded-xl shadow-md flex flex-col items-center"
      >
        <p className="text-lg text-[#332921] mb-4 text-center">
          Ingrese sus datos
        </p>

        {/* NOMBRE */}
        <input
          className="w-full border border-gray-300 rounded-lg p-3 mb-3 focus:outline-none focus:ring-2"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        {/* APELLIDO */}
        <input
          className="w-full border border-gray-300 rounded-lg p-3 mb-3 focus:outline-none focus:ring-2"
          placeholder="Apellido"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
        />

        {/* DNI */}
        <input
          className="w-full border border-gray-300 rounded-lg p-3 mb-3 focus:outline-none focus:ring-2"
          placeholder="DNI"
          type="text"
          inputMode="numeric"
          value={dni}
          onChange={(e) => {
            const soloNumeros = e.target.value.replace(/\D/g, "").slice(0, 8);
            setDni(soloNumeros);
          }}
        />

        {/* TELEFONO */}
        <input
          className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2"
          placeholder="Número de teléfono"
          type="text"
          inputMode="numeric"
          value={telefono}
          onChange={(e) => {
            const soloNumeros = e.target.value.replace(/\D/g, "").slice(0, 15);
            setTelefono(soloNumeros);
          }}
        />

        {/* BOTON */}
        <button
          type="submit"
          className="w-full bg-[#48CDC1] text-black p-3 rounded-lg font-medium hover:opacity-90 transition cursor-pointer"
        >
          REGISTRARSE
        </button>
      </form>
    </div>
  );
}