const http = require('http');
const fetch = global.fetch;
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

//  VALIDACIÓN SEGURA (sin tumbar Render)
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Faltan variables de entorno SUPABASE");
}

const server = http.createServer(async (req, res) => {

    // ===== CORS =====
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // ===== RUTA PRINCIPAL =====
    if (req.url.startsWith('/api/pokemon/') && req.method === 'GET') {

        try {
            if (!SUPABASE_URL || !SUPABASE_KEY) {
                throw new Error("Variables de entorno no configuradas");
            }

            const name = decodeURIComponent(req.url.split('/').pop()).toLowerCase().trim();

            if (!name) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: "Nombre requerido" }));
            }

            // 🔥 QUERY CORREGIDA
            const url = `${SUPABASE_URL}/pokemon?nombre=ilike.*${name}*`;

            console.log("🔍 Buscando en Supabase:", url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Supabase error: ${text}`);
            }

            const data = await response.json();

            if (!data || data.length === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: "No encontrado" }));
            }

            const p = data[0];

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                name: p.nombre,
                height: p.altura,
                weight: p.peso,
                abilities: Array.isArray(p.habilidades)
                    ? p.habilidades
                    : safeParse(p.habilidades),
                images: {
                    front: p.imagen_frontal,
                    back: p.imagen_trasera
                },
                source: "mysql"
            }));

        } catch (err) {
            console.error("ERROR SQL:", err.message);

            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                error: err.message || "Error interno"
            }));
        }
    }

    // ===== DEFAULT =====
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: "Ruta no encontrada" }));
});

// 🔥 PARSEO SEGURO
function safeParse(value) {
    try {
        return JSON.parse(value);
    } catch {
        return value ? [value] : [];
    }
}

server.listen(PORT, () => {
    console.log(`🚀 SQL API funcionando en puerto ${PORT}`);
});
