const http = require('http');

const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const server = http.createServer(async (req, res) => {

    //CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    if (req.url.startsWith('/api/pokemon/')) {

        try {
            const name = decodeURIComponent(req.url.split('/').pop()).toLowerCase();

            const response = await fetch(
                `${SUPABASE_URL}/pokemon?nombre=ilike.${name}`,
                {
                    headers: {
                        apikey: SUPABASE_KEY,
                        Authorization: `Bearer ${SUPABASE_KEY}`
                    }
                }
            );

            const data = await response.json();

            if (!data.length) {
                res.writeHead(404);
                return res.end(JSON.stringify({ error: "No encontrado" }));
            }

            const p = data[0];

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                name: p.nombre,
                height: p.altura,
                weight: p.peso,
                abilities: p.habilidades,
                images: {
                    front: p.imagen_frontal,
                    back: p.imagen_trasera
                },
                source: "mysql"
            }));

        } catch (err) {
            res.writeHead(500);
            return res.end(JSON.stringify({ error: err.message }));
        }
    }

    res.writeHead(404);
    res.end("Not Found");
});

server.listen(PORT, () => {
    console.log("SQL API corriendo");
});
