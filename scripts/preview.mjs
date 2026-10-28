import handler from 'serve-handler';
import http from 'node:http';

const server = http.createServer((req, res) => {
    if (req.url.startsWith('/RDR2CollectorsMap')) {
        req.url = req.url.replace('/RDR2CollectorsMap', '') || '/';
    }
    return handler(req, res, { public: 'out' });
});

server.listen(3000, () => {
    console.log(`\n Preview ready`);
    console.log(`  ➜  Local:    http://localhost:3000/RDR2CollectorsMap/`);
    console.log(`  ➜  Serving:  out/\n`);
});
