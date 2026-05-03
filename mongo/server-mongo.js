const http = require('http');
const { MongoClient } = require('mongodb');

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;

let db;

// 🔥 conexión segura
async function connectDB() {
    if (db) return db;

    const client = new MongoClient(MONGO_URI);
    await client.connect();

    db = client.db("pokeapi"); // 👈 importante
    console.log("Mongo conectado en Render");

    return db;
}

const server = http.createServer(async (req, res) => {

    const { url, method } = req;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    if (url.startsWith('/api/pokemon/') && method === 'GET') {

        try {
            const database = await connectDB();

            const name = decodeURIComponent(url.split('/').pop()).toLowerCase().trim();

            const pokemon = await database.collection('pokemon').findOne({
                nombre: name.charAt(0).toUpperCase() + name.slice(1)
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
            console.error("ERROR SERVER:", err);
            res.writeHead(500);
            return res.end(err.message);
        }
    }

    res.writeHead(404);
    res.end("Not Found");
});

server.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});
