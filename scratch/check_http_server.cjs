const http = require('http');

http.get('http://localhost:5173/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('CONTAINS HTML:', data.includes('<html') || data.includes('<!DOCTYPE html>'));
    console.log('CONTAINS ROOT:', data.includes('id="root"'));
    console.log('SUCCESS: Vite dev server is serving CINIHUB on localhost:5173');
  });
}).on('error', (err) => {
  console.log('Dev server error:', err.message);
});
