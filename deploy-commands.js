const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId || !guildId) {
    console.error("Erro: Por favor, defina DISCORD_TOKEN, CLIENT_ID e GUILD_ID no seu arquivo .env");
    process.exit(1);
}

const commands = [
    new SlashCommandBuilder()
        .setName('gerar_webhooks_lua')
        .setDescription('Gera webhooks para todos os canais e salva em um arquivo .lua.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName('nome')
                .setDescription('O nome personalizado para os webhooks criados.')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('imagem_url')
                .setDescription('URL da imagem para o avatar do webhook (.png, .jpg, etc).')
                .setRequired(false)),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log(`Iniciando o registro de comandos para o servidor específico (Guild ID: ${guildId}).`);

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log('Comandos de barra (com as novas opções) registrados com sucesso NO SERVIDOR ESPECÍFICO!');
    } catch (error) {
        console.error(error);
    }
})();