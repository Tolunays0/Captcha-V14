const client = require("../index");

client.on("ready", () => {
        console.log(`${client.user.tag} ile giriş yapıldı. // Whisky Lorean`)
        client.user.setActivity(`${client.config.botDurum}`)
    });
