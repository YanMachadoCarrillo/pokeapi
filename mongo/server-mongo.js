const http = require('http');
const { MongoClient } = require('mongodb');

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;

let db = null;

// 🔥 Validar que exista la variable en Render
if (!MONGO_URI) {
    console.error("❌ ERROR: MONGO_URI no está definida");
    process.exit(1);
}

// 🔥 Conectar UNA SOLA VEZ
async function connectDB() {
    if (db) return db;

    const client = new MongoClient(MONGO_URI);

    await client.connect();

    // ⚠️ IMPORTANTE: esta es tu DB real
    db = client.db("pokeapi");

    console.log("✅ MongoDB conectado correctamente");

    return db;
}

const server = http.createServer(async (req, res) => {

    const { url, method } = req;

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // API
    if (url.startsWith('/api/pokemon/') && method === 'GET') {

        try {
            const database = await connectDB();

            const name = decodeURIComponent(url.split('/').pop()).trim();

            // 🔥 búsqueda directa
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
                }
            }));

        } catch (err) {
            console.error("🔥 ERROR:", err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: err.message }));
        }
    }

    res.writeHead(404);
    res.end("Not Found");
});

server.listen(PORT, () => {
    console.log(`🚀 Server activo en puerto ${PORT}`);
});
