const http = require('http');
const { MongoClient } = require('mongodb');
const fs = require('fs');

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;

let db = null;

// 🔌 conexión Mongo
async function connectDB() {
    if (db) return db;

    const client = new MongoClient(MONGO_URI);
    await client.connect();

    db = client.db("pokeapi");
    console.log("Mongo conectado");

    return db;
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

    // ===== SWAGGER UI =====
    if (req.url === '/docs') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(`
            <html>
            <head>
                <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
            </head>
            <body>
                <div id="swagger-ui"></div>
                <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
                <script>
                    SwaggerUIBundle({
                        url: '/swagger.json',
                        dom_id: '#swagger-ui'
                    });
                </script>
            </body>
            </html>
        `);
    }

    // ===== SWAGGER JSON =====
    if (req.url === '/swagger.json') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return fs.createReadStream('./swagger.json').pipe(res);
    }

    // ===== API =====
    if (req.url.startsWith('/api/pokemon/') && req.method === 'GET') {
        try {
            const database = await connectDB();

            const name = decodeURIComponent(req.url.split('/').pop());

            const pokemon = await database.collection('pokemon').findOne({
                nombre: { $regex: `^${name}$`, $options: 'i' }
            });

            if (!pokemon) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: "No encontrado" }));
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                name: pokemon.nombre,
                height: pokemon.altura,
                weight: pokemon.peso,
                abilities: pokemon.habilidades,
                images: {
                    front: pokemon.imagen_frontal,
                    back: pokemon.imagen_trasera
                },
                source: "mongo"
            }));

        } catch (err) {
            console.error("ERROR MONGO:", err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: err.message }));
        }
    }

    // ===== DEFAULT =====
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: "Ruta no encontrada" }));
});

server.listen(PORT, () => {
    console.log(`🚀 Mongo API corriendo en puerto ${PORT}`);
});
