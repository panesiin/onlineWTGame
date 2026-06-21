const WebSocket = require("ws");
const express = require("express");

const app = express();
const server = require("http").createServer(app);
const wss = new WebSocket.Server({ server });

let clients = {};

function send(ws, data) {
    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify(data));
    }
}

// 🌐 NIGHTBOT / TWITCH INPUT
app.get("/msg", (req, res) => {
    const user = req.query.user || "unknown";
    const text = req.query.text || "";

    console.log(`[TWITCH] ${user}: ${text}`);

    // mandar a TODOS los clientes Unity
    for (let id in clients) {
        send(clients[id], {
            type: "twitch_message",
            user: user,
            text: text
        });
    }

    res.send("ok");
});

// 🔌 UNITY CONNECT
wss.on("connection", (ws) => {

    ws.on("message", (msg) => {
        const data = JSON.parse(msg);

        if (data.type === "register") {
            clients[data.id] = ws;
            console.log("Unity online:", data.id);
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

server.listen(process.env.PORT || 3000, () => {
    console.log("Server running");
});
