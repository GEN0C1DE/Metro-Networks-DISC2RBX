global.Dependencies = {
	Discord: require("discord.js"),
	Request: require("request"),
	Express: require("express"),
	BodyParser: require("body-parser") 
}


const Application = Dependencies.Express()
const Client = new Dependencies.Discord.Client();
const Port = process.env.PORT || 3000;

global.Settings = {
	Login: process.env.CLIENT_TOKEN,
	Version: "0.0.1",
	Operations: {
		MainUser: {
			guildId: "606476944250241025",
			commandChannelName: "bot-commands",
			apikey: "45967b6b-4be1-4578-9527-e9c44873996a",
			assignedGroup: 3309618
		},
	}
}


var Prefix = "?!" 
var BotStarts = 0;
var Restarts = -1;
var CallsFromApi = 0;
var Commands = 0;

Application.use(Dependencies.BodyParser.json());

Application.get("/", function (request, results) {
	results.send("Metro Networks Server Request Was Sent by Request. Connection is Established.");
});
Application.post("/primesyn", function (request, results) {
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
					"waitForPictureReady": request.body.waitForPictureReady,
					"assignedGroup": Settings.Operations.MainUser.assignedGroup
				};
				SendEmbed(ChannelGottenFrmGuild, OptionsGotten, true, true, false, true);
				results.send("Success. Result X0.");
			} else {
				results.status(400).send('Text is empty. X0-2.');
			}
		} 
	} else {
		results.status(404).send('Could not find channel name. X0-3.');
	}	
});

Application.listen(Port);
console.log(`Running express on port ${Port}...`);

function SendEmbed(Channel, Information, Player, PlayerInGroup, Group, Thumbnail){
	var GroupURL = ("https://api.roblox.com/groups/" + Information.assignedGroup)
	var PlayerGroupURL = ("https://api.roblox.com/users/" + Information.playerId + "/groups")
	var ThumbnailURL = "https://www.roblox.com/bust-thumbnail/json?userId=" + Information.playerId + "&height=180&width=180";

	var Embed = new Dependencies.Discord.RichEmbed()
	Embed.setColor("000000")
	
	if (Player == true) {
		Embed.addField("Player Name", "**" + Information.playerName + "**")
		Embed.addField("Player UserId", "**" + Information.playerId + "**")	
		if (PlayerInGroup == true) {
			Dependencies.Request({ url: PlayerGroupURL, json: true }, function (Error, Response, Body) {
				if (!Error && Response.statusCode === 200) {
					if (Body.Final === false) {
						console.log("No Player Group Information ready. " + Body.Url);
					}
	
					var Search = Body.find(F => F.Id == Information.assignedGroup)
					if (Search) {
						Embed.addField(`Is In Group(${Information.assignedGroup})?`, "**" + "Yes" + "**")
						Embed.addField("Role In Group", "**" + Search.Role + "**")	
					} else {
						Embed.addField(`Is In Group(${Information.assignedGroup})?`, "**" + "No" + "**")

					}
				} else {
					console.log("Response Code Failed. " + Response.statusCode);
				}
			})
		}
	}
	if (Thumbnail == true) {
		Dependencies.Request({ url: ThumbnailURL, json: true }, function (Error, Response, Body) {
			if (!Error && Response.statusCode === 200) {
				if (Information.waitForPictureReady && Body.Final === false) {
					console.log("No Profile Picture ready. " + Body.Url);
				} else {
					Embed.setThumbnail(Body.Url) 
				}
			} else {
				console.log("Response Code Failed. " + Response.statusCode);
			}
		})
	} 
	if (Group == true) {
		Dependencies.Request({ url: GroupURL, json: true }, function (Error, Response, Body) {
			if (!Error && Response.statusCode === 200) {
				if (Body.Final === false) {
					console.log("No information ready. " + Body.Url);
				}

				Embed.addField("Group Name", "**" + Body.Name + "**")
				Embed.addField("Group Owner", "**" + `${Body.Owner.Name}:${Body.Owner.Id}` + "**")
				Embed.addField("Group Description", "*" + Body.Description + "*");
			} else {
				console.log("Response Code Failed. " + Response.statusCode);
			}
		})
	}
}



Client.on("ready", Ready => {
	console.log("r/MetroNetworks Loaded. Ready for Use!");
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
	} else if (Message.content === Prefix + "group") {
		var ToSend = {
			"assignedGroup": Settings.Operations.MainUser.assignedGroup,
		}

		SendEmbededGroup(Message.channel, ToSend, false, false, true, false);
	}
});


Client.login(Settings.Login);
