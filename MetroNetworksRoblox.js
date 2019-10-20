global.Dependencies = {
	Discord: require("discord.js"),
	Fetch: require("node-fetch"),
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
			guildId: "592079101716594702",
			commandChannelName: "commands-text",
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

function SearchArray(nameKey, myArray){
    for (var i=0; i < myArray.length; i++) {
        if (myArray[i].Id === nameKey) {
            return myArray[i];
        }
    }
}
async function SendEmbed(Channel, Information, Player, PlayerInGroup, Group, Thumbnail){
	var DiscordDataEmbed = {
		color: 000000, 
		fields: [

		],
		timestamp: new Date()
	}
 	function PlayerCallback(){
		if (Player == true) {
			DiscordDataEmbed.fields.push({name: '__Player Name__', value: "**" + Information.playerName + "**"})
			DiscordDataEmbed.fields.push({name: '__Player UserId__', value: "**" + Information.playerId + "**"})
			DiscordDataEmbed.description = Information.text
			if (PlayerInGroup == true) {
				var PlayerGroupURL = ("https://api.roblox.com/users/" + Information.playerId + "/groups")
				return Dependencies.Fetch(PlayerGroupURL)
					.then(Resolve => Resolve.json())
					.then(json => {
						var Search =  SearchArray(Information.assignedGroup, json)
						if (Search) {
							console.log("Pushing Role Values..")

							DiscordDataEmbed.fields.push({name: `__Is In Group(${Information.assignedGroup})?__`, value: "**Yes**"});
							DiscordDataEmbed.fields.push({name: `__Role In Group(${Information.assignedGroup})?__`, value: "**" + Search.Role + "**"});
						} else {
							console.log("Pushing Role Values..")

							DiscordDataEmbed.fields.push({name: `__Is In Group(${Information.assignedGroup})?__`, value: "**No**"});
							DiscordDataEmbed.fields.push({name: `__Role In Group(${Information.assignedGroup})?__`, value: "**N/A**"});
						}
					})
			}
		};
	}
	function ThumbnailCallback(){	
		if (Thumbnail == true) {
			var ThumbnailURL = "https://www.roblox.com/bust-thumbnail/json?userId=" + Information.playerId + "&height=180&width=180";
			return Dependencies.Fetch(ThumbnailURL)
				.then(Resolve => Resolve.json())
				.then(json => {
					if (Information.waitForPictureReady && json.Final === false) {
						console.log("No Profile Picture ready. " + json.Url);
					} else {	
						console.log("Pushing Thumbnail Value..");
						DiscordDataEmbed.thumbnail = { url: json.Url };
					}
				})
		};
	}
	function GroupCallback(){	
		if (Group == true) {
			var GroupURL = ("https://api.roblox.com/groups/" + Information.assignedGroup)
			return Dependencies.Fetch(GroupURL)
				.then(Resolve => Resolve.json())
				.then(json => {
					console.log("Pushing Group Information")

					DiscordDataEmbed.fields.push({name: '__Group Name__', value: "**" + json.Name + "**"});
					DiscordDataEmbed.fields.push({name: '__Group Owner__', value: "**" + `${json.Owner.Name}:${json.Owner.Id}` + "**"});
					DiscordDataEmbed.fields.push({name: '__Group Description__', value: "*" + json.Description + "*"});
				})
		};
	}

	Promise.all([PlayerCallback(), ThumbnailCallback(), GroupCallback()])
	.then(([PCB, TCB, GCB]) => {
		console.log(DiscordDataEmbed)
		Channel.send({ embed: DiscordDataEmbed })
	})
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

		SendEmbed(Message.channel, ToSend, false, false, true, false);
	}
});


Client.login(Settings.Login);
