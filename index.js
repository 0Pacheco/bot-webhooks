const { Client, GatewayIntentBits, ChannelType, AttachmentBuilder, PermissionFlagsBits, Events, MessageFlags } = require('discord.js');
require('dotenv').config();

// ... (todo o início do arquivo permanece o mesmo, incluindo as funções sleep e formatToLua) ...
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function formatToLua(data) {
    let luaString = "-- Webhooks geradas automaticamente pelo bot\nreturn {\n";
    for (const category in data) {
        const escapedCategory = category.replace(/"/g, '\\"');
        luaString += `    ["${escapedCategory}"] = {\n`;
        for (const channel in data[category]) {
            const escapedChannel = channel.replace(/"/g, '\\"');
            const url = data[category][channel];
            luaString += `        ["${escapedChannel}"] = "${url}",\n`;
        }
        luaString += "    },\n";
    }
    luaString += "}";
    return luaString;
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ],
});

client.once(Events.ClientReady, () => {
    console.log(`Bot logado como ${client.user.tag}!`);
});


client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'gerar_webhooks_lua') return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const customName = interaction.options.getString('nome');
    const customImageUrl = interaction.options.getString('imagem_url');

    const guild = interaction.guild;
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;
    const webhooksByCategory = {};

    const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
    
    await interaction.followUp({ content: `Iniciando a verificação de **${textChannels.size}** canais. Este processo pode levar mais de 15 minutos. O relatório final será enviado em uma nova mensagem neste canal.` });

    for (const channel of textChannels.values()) {
        const perms = channel.permissionsFor(guild.members.me);
        if (!perms.has(PermissionFlagsBits.ManageWebhooks)) {
            console.log(`Sem permissão no canal: #${channel.name}`);
            failCount++;
            continue;
        }

        try {
            const existingWebhooks = await channel.fetchWebhooks();
            if (existingWebhooks.size > 0) {
                console.log(`Canal #${channel.name} já possui webhooks. Ignorando.`);
                skipCount++;
                await sleep(50);
                continue;
            }

            const webhookOptions = {
                name: customName,
                avatar: customImageUrl,
                reason: 'Geração automática de webhooks'
            };

            const webhook = await channel.createWebhook(webhookOptions);

            const categoryName = channel.parent ? channel.parent.name : "Canais Sem Categoria";
            if (!webhooksByCategory[categoryName]) {
                webhooksByCategory[categoryName] = {};
            }
            webhooksByCategory[categoryName][channel.name] = webhook.url;
            successCount++;
            console.log(`Webhook criado com sucesso em: #${channel.name}`);

        } catch (error) {
            console.error(`Falha ao processar o canal #${channel.name}:`, error);
            failCount++;
        }

        await sleep(1500);
    }

    // --- LÓGICA DE RESPOSTA FINAL CORRIGIDA ---

    // 1. Prepare a mensagem e os anexos independentemente de qualquer erro
    const attachments = [];
    if (successCount > 0) {
        const luaString = formatToLua(webhooksByCategory);
        const buffer = Buffer.from(luaString, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, { name: 'webhooks.lua' });
        attachments.push(attachment);
    }

    const finalMessage = `✅ **Relatório do Processo de Webhooks**\n` +
                       `👍 **${successCount}** novos webhooks criados.\n` +
                       `⏭️ **${skipCount}** canais ignorados (já possuíam webhooks).\n` +
                       `👎 **${failCount}** falhas.` +
                       (attachments.length > 0 ? `\n\nO arquivo com os **novos** webhooks está abaixo:` : '');

    // 2. Tente enviar a mensagem principal com o arquivo no canal.
    // Esta é a ação mais importante e deve ser feita primeiro.
    try {
        await interaction.channel.send({
            content: finalMessage,
            files: attachments,
        });
    } catch (error) {
        console.error("ERRO CRÍTICO: Não foi possível enviar o relatório final no canal:", error);
        // Se nem isso funcionar, o bot pode não ter permissão de 'Enviar Mensagens' ou 'Anexar Arquivos'
    }

    // 3. Tente editar a resposta efêmera original como um feedback secundário.
    // Se isso falhar, não tem problema, a mensagem principal já foi enviada.
    try {
        await interaction.editReply({ content: 'Processo concluído! O relatório foi enviado publicamente neste canal.' });
    } catch (error) {
        console.log("Não foi possível editar a resposta original (token de interação provavelmente expirou, o que é normal).");
    }
});

client.login(process.env.DISCORD_TOKEN);