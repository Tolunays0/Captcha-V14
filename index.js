const { Client, Collection, MessageEmbed, MessageButton, MessageActionRow, MessageAttachment } = require("discord.js");
const discordModals = require('discord-modals');
const { Modal, TextInputComponent, showModal } = require('discord-modals');
const { generateCaptcha } = require('better-captcha-image');
const { createDatabase } = require("whisky.db");
const db = new createDatabase();

const client = new Client({
    intents: 32767,
});

discordModals(client);
module.exports = client;

// Global Variables
client.commands = new Collection();
client.slashCommands = new Collection();
client.config = require("./config.json");

// Initializing the project
require("./handler")(client);

client.login(client.config.token);

function kodOlustur() {
    return generateCaptcha({
        code_length: 6, 
        width: 300,
        height: 100, 
        padding: 10, 
        font_family: "Arial", 
        font_size: [50,75], 
        letter_rotate: [-45,45], 
        line_size: 5, 
        font_color: "#a101de", 
        line_color: "#00bbbb", 
        filler_count: [10,15], 
        filler_font_size: [15,20], 
        filler_letter_rotate: [-45,45], 
        filler_font_color: "#646464", 
        returnAsUrl: false
    });
};

client.on("guildMemberAdd", async (member) => {
    if (member.user.bot) return member.roles.add(client.config.botRol);

    member.roles.add(client.config.otoVerilecekRol);
    
    const cKod = kodOlustur();

    const kodResim = new MessageAttachment(cKod.image, "kodonay.png");

    const embed = new MessageEmbed()
    .setAuthor(`${member.user.username}`, member.user.displayAvatarURL({ dynamic: true }))
    .setDescription(`Kayıt olabilmeniz için resimde gördüğünüz **6 haneli kod**u alttaki butona basarak açılan kutucuğa giriniz.`)
    .setFooter(`${member.guild.name} - Kayıt Sistemi`, member.guild.iconURL({ dynamic: true }))
    .setImage("attachment://kodonay.png")
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setTimestamp()
    .setColor("BLACK")

    const buton = new MessageActionRow().addComponents([new MessageButton()
    .setStyle("SUCCESS")
    .setLabel("Kodu Gir")
    .setCustomId("kod_gir")
    .setEmoji("✅")])
  
    client.channels.cache.get(client.config.kayitKanal).send({ content: `<@${member.user.id}>`, embeds: [embed], files: [kodResim], components: [buton]}).then((msg) => {
        db.set(`data_${member.user.id}`, {
            kod: cKod.code,
            mesajId: msg.id
        });
    });

    const collector = await client.channels.cache.get(client.config.kayitKanal).createMessageComponentCollector({ time: 0 });

    collector.on("collect", async (z) => {
        if (z.user.id != member.user.id) return
        const modal = new Modal()
        .setCustomId('onay_kod')
        .setTitle('Captcha Onay Kodu')
        .addComponents(
            new TextInputComponent()
                .setCustomId('kod')
                .setLabel('6 Haneli Onay Kodu')
                .setStyle('SHORT')
                .setPlaceholder('Resimdeki 6 haneli kodu giriniz.')
                .setRequired(true)
        )
            showModal(modal, {
                client: client,
                interaction: z,
            });
    });
});

client.on("modalSubmit", async (modal) => {
    if (modal.customId === "onay_kod") {
        let girilenKod = modal.getTextInputValue("kod");

        if (girilenKod === db.get(`data_${modal.user.id}`).kod) {
            modal.reply({ content: "Onay kodunu doğru girdiniz. Kaydınız **başarıyla** tamamlandı. :white_check_mark:", ephemeral: true });
            modal.guild.members.cache.get(modal.user.id).roles.add(client.config.verilecekRol);
            modal.guild.members.cache.get(modal.user.id).roles.remove(client.config.alinacakRol);
            client.channels.fetch(client.config.kayitKanal).then(channel => {
                channel.messages.delete(db.get(`data_${modal.user.id}`).mesajId);
                db.delete(`data_${modal.user.id}`);
                client.channels.cache.get(client.config.logKanal).send(`<@${modal.user.id}> (**${modal.user.id}**) **${girilenKod}** kodunu kullanarak kayıt oldu. :white_check_mark:`);
            });
        } else {
            modal.reply({ content: "Onay kodunu **yanlış** girdiniz. Tekrar deneyiniz. :x:", ephemeral: true });
        }
        return
    }
});

// developed by Whisky Lorean
// yt: @djsturkiye
// dc: @whiskeyxd