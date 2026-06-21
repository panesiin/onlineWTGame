const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: process.env.PORT || 3000 });

let clients = {};

function send(ws, data) {
    ws.send(JSON.stringify(data));
}

wss.on("connection", (ws) => {

    ws.on("message", (msg) => {
        const data = JSON.parse(msg);

        // registrar usuario
        if (data.type === "register") {
            clients[data.id] = ws;
            console.log("User online:", data.id);
        }

        // hacer llamada
        if (data.type === "call") {
            const target = clients[data.to];

            if (target) {
                send(target, {
                    type: "incoming_call",
                    from: data.from,
                    callId: data.callId
                });
            }
        }

        // aceptar llamada
        if (data.type === "accept") {
            const target = clients[data.to];

            if (target) {
                send(target, {
                    type: "call_accepted",
                    callId: data.callId
                });
            }
        }

        // rechazar llamada
        if (data.type === "reject") {
            const target = clients[data.to];

            if (target) {
                send(target, {
                    type: "call_rejected",
                    callId: data.callId
                });
            }
        }
    });

    ws.on("close", () => {
        for (let id in clients) {
            if (clients[id] === ws) {
                delete clients[id];
            }
        }
    });

});