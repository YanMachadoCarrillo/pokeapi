const http = require('http');
const { MongoClient } = require('mongodb');

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;

let db = null;

async function connectDB() {
    if (db) return db;

    const client = new MongoClient(MONGO_URI);
    await client.connect();

    db = client.db("pokeapi");
    console.log("Mongo conectado");

    return db;
}

const server = http.createServer(async (req, res) => {

    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.url.startsWith('/api/pokemon/')) {
        try {
            const database = await connectDB();

            const name = decodeURIComponent(req.url.split('/').pop());

            const pokemon = await database.collection('pokemon').findOne({
                nombre: { $regex: `^${name}$`, $options: 'i' }
            });

            if (!pokemon) {
                res.writeHead(404);
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
            res.writeHead(500);
            return res.end(err.message);
        }
    }

    res.writeHead(404);
    res.end();
});

server.listen(PORT, () => console.log("Mongo API OK"));
