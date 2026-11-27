const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', (ws) => {
    ws.on('message', (data) => {
        for(const c of wss.clients) {
            if(c.readyState === 1) c.send(data.toString());
        }
    });
});

console.log("Chattserver körs på port 3000");