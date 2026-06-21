const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: process.env.PORT || 3000 });

let clients = {};
let socketToId = new Map();

function send(ws, data) {
    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify(data));
    }
}

function register(id, ws) {
    // si ya existía ese id, lo reemplazamos (IMPORTANTE)
    if (clients[id] && clients[id] !== ws) {
        console.log("Replacing old connection for:", id);
    }

    clients[id] = ws;
    socketToId.set(ws, id);

    console.log("User online:", id);
}

wss.on("connection", (ws) => {
    console.log("Nueva conexión");

    ws.on("message", (msg) => {
        let data;

        try {
            data = JSON.parse(msg);
        } catch (e) {
            console.log("JSON inválido");
            return;
        }

        console.log("Mensaje recibido:", data);

        // REGISTER
        if (data.type === "register") {
            register(data.id, ws);
        }

        // MESSAGE
        if (data.type === "message") {
            const target = clients[data.to];

            console.log("Intentando enviar a:", data.to);
            console.log("Existe target?", !!target);

            if (target && target.readyState === 1) {
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

        // CALL SYSTEM
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
        const id = socketToId.get(ws);

        if (id) {
            console.log("User offline:", id);
            delete clients[id];
            socketToId.delete(ws);
        }
    });
});
