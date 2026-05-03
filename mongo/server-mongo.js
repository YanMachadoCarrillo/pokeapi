const http = require('http');
const { MongoClient } = require('mongodb');

const PORT = 3001;

const user = "YanCarlos";
const password = encodeURIComponent("@@Krq73g2023@@");

const MONGO_URI = `mongodb+srv://${user}:${password}@pokeapibd.crjoj9o.mongodb.net/pokeapiBD?retryWrites=true&w=majority`;

let db;

// Conexión
(async () => {
    try {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        db = client.db("pokeapi");
        console.log("MongoDB conectado");
    } catch (err) {
        console.error("Error MongoDB:", err.message);
    }
})();

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
        const name = decodeURIComponent(url.split('/').pop()).toLowerCase().trim();

        try {
            // Traer todos y buscar manualmente (más seguro)
            const all = await db.collection('pokemon').find().toArray();

            console.log("Buscando:", name);
            console.log("Total docs:", all.length);

            const pokemon = all.find(p =>
                p.nombre &&
                p.nombre.toLowerCase().trim() === name
            );

            if (!pokemon) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                    error: "No encontrado en MongoDB",
                    debug: all.map(p => p.nombre)
                }));
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                name: pokemon.nombre,
                height: pokemon.altura,
                weight: pokemon.peso,
                abilities: Array.isArray(pokemon.habilidades)
                    ? pokemon.habilidades
                    : [pokemon.habilidades],
                images: {
                    front: pokemon.imagen_frontal,
                    back: pokemon.imagen_trasera
                },
                source: "MongoDB"
            }));

        } catch (err) {
            console.error(err);
            res.writeHead(500);
            return res.end(err.message);
        }
    }

    res.writeHead(404);
    res.end("Not Found");
});

server.listen(PORT, () => {
    console.log(`Servidor Mongo activo en http://localhost:${PORT}`);
});
