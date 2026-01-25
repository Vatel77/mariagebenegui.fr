const http = require('http');
const fs = require('fs');

const postData = JSON.stringify({
    name: 'Test Agent',
    message: 'Hello from verification script!'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/guestbook',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('Sending request...');
const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
        console.log('No more data in response.');

        // Check file
        setTimeout(() => {
            if (fs.existsSync('guestbook.txt')) {
                const content = fs.readFileSync('guestbook.txt', 'utf8');
                console.log('File Content:\n' + content);
            } else {
                console.log('guestbook.txt not found!');
            }
        }, 1000);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
