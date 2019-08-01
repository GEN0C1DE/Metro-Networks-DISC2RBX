global.Dependencies = {
	Discord = require("discord.js"),
	Request = require("require"),
	Express = require("express"),
	BodyParser = require("body-parser") 
}


const Application = Dependencies.Express()
const Client = new Dependencies.Discord.Client();

global.Settings = {
	Login = process.env.CLIENT_TOKEN,
	Version = "0.0.1",
	["Operations"]: {
		"MainUser": {
			"guildId": "000000000000000000",
			"commandChannelName": "botspam",
			"apikey": "Recommended to use a 24 character long alphanumeric string"
		},
		"AnotherUser": {
			"guildId": "000000000000000001",
			"commandChannelName": "bot_commands",
			"apikey": "a302A6bxz9UzO8PwS2nmF33i"
		}
	}
}


var Prefix = "?!" 
var BotStarts = 0;
var Restarts = -1;
var CallsFromApi = 0;
var Commands = 0;

function SendEmbededMessage(Channel, Information) {
	var URL = "https://www.roblox.com/bust-thumbnail/json?userId=" + Information.playerId + "&height=180&width=180";
	request({ url: URL, json: true }, function (Error, Response, Body) {
		if (!Error && Response.statusCode === 200) {
			if (Information.waitForProfPic && Body.Final === false) {
				console.log("No profile picture ready, Retrying. " + Body.Url);
				setTimeout(SendEmbededMessage, 7000, Channel, Information);
				return;
			}

			var Embed = new Dependencies.Discord.RichEmbed()
				.setColor(0x00AE86)
				.setThumbnail(Body.Url) 
				.addField("Player Name", "**" + Information.playerName + "**")
				.addField("Player UserId", "**" + Information.playerId + "**")
				.setDescription("*" + Information.text + "*");
			Channel.send(Embed);
		} else {
			console.log("Response Code Failed. " + Response.statusCode);
		}
	})
}

Application.use(Dependencies.BodyParser.json());

Application.get("/", function (request, results) {
	results.send("Vietnam War Roleplay Server Request Was Sent by Request. Connection is Established.");
});
Application.post("/vwrp", function (request, results) {
	CallsFromApi = CallsFromApi + 1;
	var TemporaryCheckGuildId = 0

	if (request.body.key === Settings.Operations.MainUser.apikey) {
		TemporaryCheckGuildId = Settings.Operations.MainUser.guildId;
	} else {
		console.log("Invalid API Key Sent.");
		results.send("Invalid Key. Result X0-1.");
		return;
	}

	var ChannelGottenFrmGuild = Client.guilds.get(TemporaryCheckGuildId).channels.find(x => x.name === request.body.channel);
	if (ChannelGottenFrmGuild) {
		if (request.body.messageType == "PlainText") {
			if(request.body.message.text.length > 1) {
				ChannelGottenFrmGuild.send(request.body.message.text);
				results.send("Success. Result X0.");
			} else {
				results.status(400).send('Text is empty. X0-2.');
			}
		} else if (request.body.messageType == "ProfilePicture") {
			if(request.body.message.text.length > 1) {
				var OptionsGotten = {
					"playerId": request.body.message.playerId,
					"playerName": request.body.message.playerName,
					"text": request.body.message.text,
					"waitForPictureReady": request.body.waitForPictureReady
				};
				SendEmbededMessage(ChannelGottenFrmGuild, OptionsGotten, 0);
				results.send("Success. Result X0.");
			} else {
				results.status(400).send('Text is empty. X0-2.');
			}
		} 
	} else {
		results.status(404).send('Could not find channel name. X0-3.');
	}	
});

Application.listen(3000);
console.log("Running express on port 3000...");


Client.on("ready", Ready => {
	console.log("Vietkong Loaded. Ready for Use!");
	Restarts += 1;
	BotStarts = Math.floor(new Date() / 1000);
});

//on message
Client.on("message", Message => {
	if (!Message.content.startsWith(Prefix) || Message.channel.name !== Settings.Operations.MainUser.commandChannelName) {
		return "";
	};

	//later: figure out how to manage per-guild settings
	if (Message.content === Prefix + "uptime") {
		var seconds = (Math.floor(new Date() / 1000) - BotStarts);
		var minutes = Math.floor(seconds / 60);
		var hours = Math.floor(minutes / 60) % 24;
		var days = Math.floor(hours / 24);
		Message.channel.send("*This bot instance has been up for*  **" +
		days + "d " +
		(hours%24) + "h " +
		(minutes%60) + "m " +
		(seconds%60) + "s " +
		"**");
	} else if (Message.content === Prefix + "stats") {
		Message.channel.send("*Since start, there has been*  **" + CallsFromApi + "** *api calls,*  **");
	}
});


Client.login(Settings.Login);