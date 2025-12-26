// clear-commands.js
const { REST, Routes } = require('discord.js');
require('dotenv').config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId || !guildId) {
    console.error("Erro: Verifique se DISCORD_TOKEN, CLIENT_ID, e GUILD_ID estão no .env");
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        // Limpa os comandos do servidor específico (Guild Commands)
        console.log(`Iniciando a limpeza de comandos do servidor (Guild ID: ${guildId}).`);
        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: [] } // Um array vazio significa "apagar todos"
        );
        console.log('Comandos do servidor limpos com sucesso.');

        // Limpa os comandos globais (Global Commands)
        console.log('Iniciando a limpeza de comandos globais.');
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: [] } // Apaga todos os globais também, por segurança
        );
        console.log('Comandos globais limpos com sucesso.');

    } catch (error) {
        console.error('Ocorreu um erro ao tentar limpar os comandos:', error);
    }
})();