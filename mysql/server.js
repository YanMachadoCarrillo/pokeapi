const http = require('http');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const PORT = process.env.PORT || 3000;

// SUPABASE (USA URL BASE, SIN /rest/v1)
const supabase = createClient(
    'https://gupnlcjeuujxkbwvqdkx.supabase.co',
    'sb_publishable_FElCbs-k5paiRgXPz7QYQA__rOktMvU' // <-- sb_publishable_...
);

// Test conexión
(async () => {
    try {
        const { error } = await supabase.from('pokemon').select('*').limit(1);
        if (error) throw error;
        console.log('Supabase conectado');
    } catch (err) {
        console.error('Error Supabase:', err.message);
    }
})();

const MIME = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png'
};

const server = http.createServer(async (req, res) => {
    const { url, method } = req;

    // ===== CORS =====
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // ===== SWAGGER =====
    if (url === '/docs') {
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
          SwaggerUIBundle({ url: '/swagger.json', dom_id: '#swagger-ui' });
        </script>
      </body>
      </html>
    `);
    }

    if (url === '/swagger.json') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return fs.createReadStream('./swagger.json').pipe(res);
    }

    // ===== API =====
    if (url.startsWith('/api/pokemon/') && method === 'GET') {
        const name = decodeURIComponent(url.split('/').pop()).toLowerCase();

        try {
            const { data, error } = await supabase
                .from('pokemon')
                .select('*')
                .ilike('nombre', name) // case-insensitive
                .single();

            if (error || !data) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'No encontrado' }));
            }

            // Asegura que habilidades sea array
            let abilities = data.habilidades;
            if (typeof abilities === 'string') {
                try { abilities = JSON.parse(abilities); } catch { /* queda string */ }
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                name: data.nombre,
                height: data.altura,
                weight: data.peso,
                abilities: Array.isArray(abilities) ? abilities : [abilities],
                images: {
                    front: data.imagen_frontal,
                    back: data.imagen_trasera
                }
            }));

        } catch (err) {
            console.error('🔥 ERROR:', err);
            res.writeHead(500);
            return res.end(err.message);
        }
    }

    // ===== FRONTEND =====
    let filePath = path.join(__dirname, 'public', url === '/' ? 'index.html' : url);
    let ext = path.extname(filePath);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            return res.end('404');
        }
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
    console.log(`Swagger: http://localhost:${PORT}/docs`);
});
