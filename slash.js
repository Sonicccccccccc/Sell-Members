const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const config = require('./config.js')
const commands = [
{
    name : 'setup', 
    description : 'انشاء التذكرة',  
    required : true , 
} , 

];


const clientID = config.bot.ClientId;

const rest = new REST({ version: '9' }).setToken(config.bot.TOKEN);

(async () => {
  try {
    await rest.put(Routes.applicationCommands(clientID), { body: commands });
    console.log('Successfully registered application commands.');
  } catch (error) {
    console.error('Error registering application commands:', error);
  }
})();