const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: process.env.PORT || 3000 });

let clients = {};

function send(ws, data) {
    ws.send(JSON.stringify(data));
}

wss.on("connection", (ws) => {
    console.log("Nueva conexión");

    ws.on("message", (msg) => {
        const data = JSON.parse(msg);

        console.log("Mensaje recibido:", data);

        // REGISTRO
        if (data.type === "register") {
            clients[data.id] = ws;
            console.log("User online:", data.id);
        }

        // MENSAJERÍA (ESTO FALTABA)
        if (data.type === "message") {
            const target = clients[data.to];

            console.log("Intentando enviar a:", data.to);
            console.log("Existe target?", !!target);

            if (target) {
                send(target, {
                    type: "message",
                    from: data.from,
                    text: data.text
                });

                console.log("Mensaje reenviado");
            } else {
                console.log("Target offline:", data.to);
            }
        }

        // LLAMADAS
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

        if (data.type === "accept") {
            const target = clients[data.to];

            if (target) {
                send(target, {
                    type: "call_accepted",
                    callId: data.callId
                });
            }
        }

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
                console.log("User offline:", id);
                delete clients[id];
            }
        }
    });
});
