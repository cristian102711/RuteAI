// app/page.tsx
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Este es un "Server Component" asíncrono. Todo lo que pasa aquí ocurre de forma invisible y segura en tu servidor.
export default async function Home() {
  
  // 1. LEER DATOS (GET): Le pedimos a Prisma que traiga TODAS las empresas de Supabase.
  // Fíjate que al escribir "prisma." VS Code ya sabe que existe ".empresa" porque leíste el "schema".
  const empresas = await prisma.empresa.findMany({
    orderBy: { createdAt: "desc" }, // Las más nuevas primero
  });

  // 2. ESCRIBIR DATOS (POST): Este es un "Server Action".
  // Es una función mágica que conectamos al botón y muta nuestra base de datos sin necesitar APIS molestas.
  async function crearEmpresaDemonstracion(formData: FormData) {
    "use server"; // Esto le dice a Next.js: "Esta función jamás llegará a la vista del hacker, es de mi servidor seguro"
    
    // Obtenemos los campos del formulario
    const nombre = formData.get("nombre") as string;
    const correo = formData.get("correo") as string;
    
    if (!nombre || !correo) return;

    // Le decimos a Prisma que inserte (create)
    await prisma.empresa.create({
      data: {
        nombre: nombre,
        email: correo,
        plan: "pro", // Simulamos un pago exitoso
      },
    });

    // Refrescamos la pantalla automáticamente para que se vean los datos nuevos
    revalidatePath("/");
  }

  // 3. VISTA LOGÍSTICA (HTML + Tailwind)
  return (
    <div className="flex flex-col min-h-screen text-zinc-100 p-10 bg-zinc-950">
      <main className="max-w-4xl mx-auto w-full">
        
        <h1 className="text-4xl font-extrabold mb-8 tracking-tight">
          Panel de Control <span className="text-emerald-400">RouteAI</span>
        </h1>

        {/* Tarjeta de Formulario Moderno Premium */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 mb-10 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-emerald-400">1. Simulación: Crear Primera Empresa</h2>
          <form action={crearEmpresaDemonstracion} className="flex gap-4">
            <input 
              name="nombre" 
              placeholder="Ej: Awna Digital" 
              required
              className="bg-zinc-950 border border-zinc-700 rounded-md px-4 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-zinc-600"
            />
            <input 
              name="correo"
              type="email"
              placeholder="correo@ejemplo.com" 
              required
              className="bg-zinc-950 border border-zinc-700 rounded-md px-4 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-zinc-600"
            />
            <button 
              type="submit" 
              className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2 rounded-md font-bold transition-all whitespace-nowrap"
            >
              Registrar
            </button>
          </form>
        </section>

        {/* Lista de Registros que Prisma Leyó Arriba */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-emerald-400">2. Base de Datos en Tiempo Real</h2>
          
          {empresas.length === 0 ? (
            <div className="text-zinc-500 italic p-6 border border-zinc-800 border-dashed rounded-lg text-center">
              Aún no hay registros en Supabase. Llena el formulario de arriba.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {empresas.map((emp) => (
                <div key={emp.id} className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
                  <h3 className="font-bold text-lg">{emp.nombre}</h3>
                  <p className="text-sm text-zinc-400">{emp.email}</p>
                  <div className="mt-4 inline-flex items-center text-xs font-semibold px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full">
                    Plan {emp.plan.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
