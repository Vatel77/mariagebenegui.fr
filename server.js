const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const AUTH_USER = 'BeneGui2026';
const AUTH_PASS = 'Amour2026';

const server = http.createServer((req, res) => {
    // 1. Basic Authentication
    const auth = req.headers['authorization'];
    if (!auth) {
        res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Mariage Bene & Gui"' });
        res.end('Authentification requise');
        return;
    }

    const tmp = auth.split(' ');
    const buf = Buffer.from(tmp[1], 'base64');
    const plain_auth = buf.toString();
    const [credUser, credPass] = plain_auth.split(':');

    if (credUser !== AUTH_USER || credPass !== AUTH_PASS) {
        res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Mariage Bene & Gui"' });
        res.end('Identifiants incorrects');
        return;
    }

    // Serve static files
    if (req.method === 'GET') {
        let filePath = '.' + req.url;
        // Handle basics
        if (filePath === './') filePath = './index.html';
        const q = filePath.indexOf('?');
        if (q !== -1) filePath = filePath.substring(0, q);

        const extname = path.extname(filePath);
        let contentType = 'text/html';
        switch (extname) {
            case '.js': contentType = 'text/javascript'; break;
            case '.css': contentType = 'text/css'; break;
            case '.json': contentType = 'application/json'; break;
            case '.png': contentType = 'image/png'; break;
            case '.jpg': contentType = 'image/jpg'; break;
            case '.ico': contentType = 'image/x-icon'; break;
        }

        fs.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code == 'ENOENT') {
                    res.writeHead(404);
                    res.end('404 Not Found');
                    console.log(`404: ${filePath}`);
                } else {
                    res.writeHead(500);
                    res.end('Error: ' + error.code);
                    console.log(`500: ${filePath}`);
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    }
    // Handle Guestbook POST
    else if (req.method === 'POST' && req.url === '/api/guestbook') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            console.log('Received guestbook submission');
            try {
                const { name, message } = JSON.parse(body);
                if (!name || !message) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Nom et message requis.' }));
                    return;
                }

                const entry = `Date: ${new Date().toLocaleString()}\nNom: ${name}\nMessage: ${message}\n-----------------------------------\n\n`;

                fs.appendFile(path.join(__dirname, 'guestbook.txt'), entry, err => {
                    if (err) {
                        console.error('File write error:', err);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Erreur lors de la sauvegarde.' }));
                    } else {
                        console.log('Message saved.');
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, message: 'Message reçu !' }));
                    }
                });
            } catch (e) {
                console.error('JSON parse error:', e);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Données invalides.' }));
            }
        });
    }
    // Handle Photo Upload
    else if (req.method === 'POST' && req.url === '/api/upload') {
        handleFileUpload(req, res);
    }
    else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

// Helper to handle file uploads (Multipart Parser)
function handleFileUpload(req, res) {
    const boundary = req.headers['content-type'].split('; boundary=')[1];

    // Config: Upload Path
    // Try NAS path first, fallback to local 'uploads'
    const nasPath = '/volume3/Photos/Mariage';
    let uploadDir = nasPath;

    // Check if NAS path exists, otherwise use local
    if (!fs.existsSync(nasPath)) {
        console.log(`NAS path ${nasPath} not found. Using local 'uploads' folder.`);
        uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
    }

    let rawData = [];
    req.on('data', chunk => {
        rawData.push(chunk);
    });

    req.on('end', () => {
        const buffer = Buffer.concat(rawData);
        const boundaryBuffer = Buffer.from('--' + boundary);
        const parts = [];

        let start = buffer.indexOf(boundaryBuffer) + boundaryBuffer.length + 2; // skip CRLF
        let end = buffer.indexOf(boundaryBuffer, start);

        while (end !== -1) {
            parts.push(buffer.slice(start, end - 2)); // remove trailing CRLF
            start = end + boundaryBuffer.length + 2;
            end = buffer.indexOf(boundaryBuffer, start);
        }

        let savedCount = 0;

        parts.forEach(part => {
            const headerEnd = part.indexOf('\r\n\r\n');
            const header = part.slice(0, headerEnd).toString();
            const content = part.slice(headerEnd + 4);

            if (header.includes('filename="')) {
                const filenameMatch = header.match(/filename="(.+?)"/);
                if (filenameMatch) {
                    const originalFilename = filenameMatch[1];
                    // Clean filename
                    const safeFilename = path.basename(originalFilename).replace(/[^a-zA-Z0-9.\-_]/g, '_');
                    const timestamp = Date.now();
                    const finalPath = path.join(uploadDir, `${timestamp}_${safeFilename}`);

                    try {
                        fs.writeFileSync(finalPath, content);
                        console.log(`Saved: ${finalPath}`);
                        savedCount++;
                    } catch (err) {
                        console.error('Error saving file:', err);
                    }
                }
            }
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: savedCount, message: `${savedCount} photo(s) envoyée(s) !` }));
    });
}


server.listen(PORT, () => {
    console.log(`\n-------------------------------------------------------------`);
    console.log(` Serveur démarré !`);
    console.log(` Obrez votre navigateur à l'adresse : http://localhost:${PORT}`);
    console.log(`-------------------------------------------------------------\n`);
});
