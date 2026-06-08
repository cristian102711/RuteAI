const http = require('https');

const services = [
  {
    name: "Web Frontend",
    url: "https://ruteai.vercel.app/"
  },
  {
    name: "Auth Service",
    url: "https://ruteai-auth.vercel.app/api/v1/health"
  },
  {
    name: "Core Service",
    url: "https://rute-ai-core.vercel.app/api/v1/health"
  },
  {
    name: "AI Service",
    url: "https://ruteai-ai-service.vercel.app/api/health"
  }
];

console.log("\x1b[36m%s\x1b[0m", "🔍 Iniciando comprobación de microservicios RuteAI...\n");

function checkUrl(service) {
  return new Promise((resolve) => {
    const start = Date.now();
    http.get(service.url, (res) => {
      const duration = Date.now() - start;
      resolve({
        name: service.name,
        url: service.url,
        status: res.statusCode,
        duration: duration,
        success: res.statusCode === 200
      });
    }).on('error', (e) => {
      resolve({
        name: service.name,
        url: service.url,
        status: "ERROR",
        duration: 0,
        success: false,
        error: e.message
      });
    });
  });
}

async function run() {
  const results = await Promise.all(services.map(checkUrl));
  
  let allOk = true;
  results.forEach(res => {
    if (res.success) {
      console.log(`\x1b[32m✅ %s: %s OK (%s ms) \x1b[90m-> %s\x1b[0m`, res.name, res.status, res.duration, res.url);
    } else {
      allOk = false;
      console.log(`\x1b[31m❌ %s: Falló con estado %s \x1b[90m-> %s\x1b[0m`, res.name, res.status, res.url);
    }
  });

  console.log("\n------------------------------------------------");
  if (allOk) {
    console.log("\x1b[32m%s\x1b[0m", "🎉 ¡Todos los microservicios responden con HTTP 200 OK!");
  } else {
    console.log("\x1b[31m%s\x1b[0m", "⚠️ Algunos servicios no respondieron correctamente. Revisa los logs de Vercel.");
  }
  console.log("------------------------------------------------\n");
}

run();
