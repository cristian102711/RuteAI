"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Lock, ShieldCheck, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { procesarPagoSimulado } from "../../actions";

export function PagoClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") || "pro";

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPlanInfo = () => {
    switch (planId) {
      case "pro": return { nombre: "Plan Pro", monto: "$99.00 USD" };
      case "business": return { nombre: "Plan Business", monto: "Personalizado" };
      default: return { nombre: "Plan Starter", monto: "$29.00 USD" };
    }
  };

  const planInfo = getPlanInfo();

  // Formateo simple de tarjeta (1234 5678 1234 5678)
  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 16) val = val.slice(0, 16);
    const parts = val.match(/[\s\S]{1,4}/g) || [];
    setCardNumber(parts.join(" "));
  };

  // Formateo de fecha (MM/AA)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length >= 2) {
      setExpiry(`${val.slice(0, 2)}/${val.slice(2)}`);
    } else {
      setExpiry(val);
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 4) val = val.slice(0, 4);
    setCvc(val);
  };

  const handlePagar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, '').length < 15 || expiry.length < 5 || cvc.length < 3) {
      setError("Por favor completa todos los datos de la tarjeta correctamente.");
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const res = await procesarPagoSimulado(planId, cardNumber, expiry, cvc);
      
      if (res.error) {
        setError(res.error);
        setIsProcessing(false);
      } else {
        // Simular éxito y volver al dashboard con estado=exito
        router.push(`/dashboard/planes?estado=exito&nuevoPlan=${planId}`);
      }
    } catch (err) {
      setError("Error de conexión al banco simulado.");
      setIsProcessing(false);
    }
  };

  const setTestCardSuccess = () => {
    setCardNumber("4242 4242 4242 4242");
    setExpiry("12/28");
    setCvc("123");
    setError(null);
  };

  const setTestCardFail = () => {
    setCardNumber("4000 0000 0000 0000");
    setExpiry("12/28");
    setCvc("123");
    setError(null);
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-2xl max-w-sm w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
        <Loader2 className="h-16 w-16 text-blue-600 animate-spin mb-6 relative z-10" />
        <h2 className="text-xl font-bold text-slate-800 relative z-10 mb-2">Conectando con el banco...</h2>
        <p className="text-sm text-slate-500 text-center relative z-10">Por favor no cierres esta ventana ni actualices la página.</p>
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400 relative z-10">
          <ShieldCheck className="h-4 w-4" />
          Conexión segura SSL
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden relative">
      {/* Header tipo pasarela de pagos */}
      <div className="bg-slate-50 p-6 border-b border-slate-100 relative">
        <button 
          onClick={() => router.back()}
          className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Lock className="h-6 w-6 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-1">Pago Seguro</h1>
        <p className="text-sm text-center text-slate-500 flex items-center justify-center gap-1">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          Entorno de pruebas
        </p>
      </div>

      <div className="p-6">
        {/* Resumen de la orden */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6 flex justify-between items-center border border-slate-100">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total a pagar</div>
            <div className="text-slate-800 font-medium">{planInfo.nombre}</div>
          </div>
          <div className="text-xl font-bold text-slate-800">{planInfo.monto}</div>
        </div>

        {/* Tarjetas de prueba (SOLO EN DESARROLLO) */}
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800 font-medium mb-2">Datos de prueba simulados:</p>
          <div className="flex gap-2">
            <button type="button" onClick={setTestCardSuccess} className="flex-1 bg-white border border-amber-300 text-amber-700 text-xs py-1.5 rounded shadow-sm hover:bg-amber-100 font-medium transition">
              Tarjeta Exitosa
            </button>
            <button type="button" onClick={setTestCardFail} className="flex-1 bg-white border border-red-300 text-red-700 text-xs py-1.5 rounded shadow-sm hover:bg-red-50 font-medium transition">
              Tarjeta Rechazada
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-3 border border-red-100 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="mt-0.5">{error}</p>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handlePagar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Número de tarjeta</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CreditCard className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={cardNumber}
                onChange={handleCardChange}
                placeholder="0000 0000 0000 0000"
                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900 placeholder:text-slate-400 transition"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Vencimiento</label>
              <input
                type="text"
                value={expiry}
                onChange={handleExpiryChange}
                placeholder="MM/AA"
                className="block w-full px-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900 placeholder:text-slate-400 transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">CVC</label>
              <input
                type="text"
                value={cvc}
                onChange={handleCvcChange}
                placeholder="123"
                className="block w-full px-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900 placeholder:text-slate-400 transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-6 bg-blue-600 text-white font-semibold py-3.5 px-4 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
          >
            <Lock className="h-4 w-4" />
            Pagar {planInfo.monto}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-4 grayscale opacity-60">
          <div className="font-bold text-slate-800 text-lg italic tracking-tight">VISA</div>
          <div className="flex h-6 w-10">
            <div className="w-6 h-6 rounded-full bg-red-500 opacity-80 z-10" />
            <div className="w-6 h-6 rounded-full bg-amber-500 opacity-80 -ml-2 mix-blend-multiply" />
          </div>
          <div className="font-bold text-slate-800 italic">AMEX</div>
        </div>
      </div>
    </div>
  );
}
