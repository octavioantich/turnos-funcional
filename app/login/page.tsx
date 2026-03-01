"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Login() {
  const [dni, setDni] = useState("");
  const router = useRouter();

const handleLogin = async (e?: React.FormEvent) => {
  if (e) e.preventDefault();

  if (!dni) {
    toast.error("Ingresá un DNI");
    return;
  }

  const { data, error } = await supabase
    .from("usuarios")
    .select("dni")
    .eq("dni", dni)
    .single();

  if (error || !data) {
    toast.error("El dni no se encuentra registrado");
    return;
  }

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
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-white p-8 rounded-xl shadow-md flex flex-col items-center"
      >
        {/* TEXTO */}
        <p className="text-lg text-[#332921] mb-3 text-center">
          Ingrese con su DNI
        </p>

        {/* INPUT */}
        <input
          className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2"
          placeholder="DNI"
          value={dni}
          type="text"
          inputMode="numeric"
          onChange={(e) => {
            const soloNumeros = e.target.value.replace(/\D/g, "");
            setDni(soloNumeros);
          }}
        />

        {/* BOTON */}
        <button
          type="submit"
          className="w-full bg-[#48CDC1] text-black p-3 rounded-lg font-medium hover:opacity-90 transition cursor-pointer"
        >
          INGRESAR
        </button>

        {/* REGISTRO */}
        <p className="text-lg text-[#332921] mt-6 mb-1">
          Si nunca ingresó antes
        </p>

        <button
          type="button"
          onClick={() => router.push("/registro")}
          className="w-full bg-[#48CDC1] text-black p-3 rounded-lg font-medium hover:opacity-90 transition cursor-pointer"
        >
          REGISTRARSE
        </button>
      </form>
    </div>
  );
}
