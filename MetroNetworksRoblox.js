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
		if(request.body.extensions) {
			var OptionsGotten = {		
				"waitForPictureReady": request.body.waitForPictureReady,
				"assignedGroup": Settings.Operations.MainUser.assignedGroup,
				"extensions": request.body.extensions
			};

			if (request.body.extensions.Message){
				var MessageExtension = request.body.extensions.Message
				if (MessageExtension.MessageType == "RichEmbed") {
					SendEmbed(ChannelGottenFrmGuild, OptionsGotten);
				} else {
					if (MessageExtension.MessageEnabled !== false) {
						if(MessageExtension.Message.length > 1) { ChannelGottenFrmGuild.send(`**Message from the Roblox Server: ${MessageExtension.Message}**`) } else { results.status(400).send('Message was not supplied. X0-2.') }
					}
				}	
			}		
			results.send("Success. Result X0.");
		} else {
			results.status(400).send('Extensions were not supplied. X0-2.');
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
async function SendEmbed(Channel, Information){
	if (!Information.extensions) return console.error("You must supply Extensions in order to comply with the bot.")
	var Extensions = Information.extensions

	var DiscordDataEmbed = {
		color: 0000000, 
		fields: [

		],
		timestamp: new Date()
	}

	

	if (Extensions.Message){
		var MessageExtension = Extensions.Message
		if (MessageExtension.MessageColor && MessageExtension.MessageColor !== false) {DiscordDataEmbed.color = MessageExtension.MessageColor}
		if (MessageExtension.Message.length > 1) { DiscordDataEmbed.description = MessageExtension.Message }
	}

 	function PlayerCallback(){
		if (Extensions.Player) {
			if (Extensions.Player.Enabled && Extensions.Player.Enabled !== true) return; 
			var PlayerExtensions = Extensions.Player
			if (PlayerExtensions.Username && PlayerExtensions.Username.Enabled !== false) DiscordDataEmbed.fields.push({name: '__Player Name__', value: "**" + PlayerExtensions.Username.Value + "**"});
			if (PlayerExtensions.UserId && PlayerExtensions.UserId.Enabled !== false) DiscordDataEmbed.fields.push({name: '__Player UserId__', value: "**" + PlayerExtensions.UserId.Value + "**"});
			if (PlayerExtensions.AccountAge && PlayerExtensions.AccountAge.Enabled !== false) DiscordDataEmbed.fields.push({name: '__Player Account Age__', value: "**" + PlayerExtensions.AccountAge.Value + "**"});

			if (PlayerExtensions.InGroup && PlayerExtensions.InGroup == true) {
				var PlayerGroupURL = ("https://api.roblox.com/users/" + Information.playerId + "/groups")
				return Dependencies.Fetch(PlayerGroupURL)
					.then(Resolve => Resolve.json())
					.then(json => {
						var Search =  SearchArray(Information.assignedGroup, json)
						if (Search) {
							DiscordDataEmbed.fields.push({name: `__Is In Group(${Information.assignedGroup})?__`, value: "**Yes**"});
							if (PlayerExtensions.RoleInGroup && PlayerExtensions.RoleInGroup == true) DiscordDataEmbed.fields.push({name: `__Role In Group(${Information.assignedGroup})?__`, value: "**" + Search.Role + "**"});
						} else {
							DiscordDataEmbed.fields.push({name: `__Is In Group(${Information.assignedGroup})?__`, value: "**No**"});
							if (PlayerExtensions.RoleInGroup && PlayerExtensions.RoleInGroup == true) DiscordDataEmbed.fields.push({name: `__Role In Group(${Information.assignedGroup})?__`, value: "**N/A**"});
						}
					})
			}
		};
	}
	function ThumbnailCallback(){	
		if (Extensions.Player) {
			if (Extensions.Player.Enabled && Extensions.Player.Enabled !== true) return; 

			var PlayerExtensions = Extensions.Player
			if (PlayerExtensions.Thumbnail && PlayerExtensions.Thumbnail == true){
				var ThumbnailURL = "https://www.roblox.com/bust-thumbnail/json?userId=" + PlayerExtensions.UserId.Value + "&height=180&width=180";
				return Dependencies.Fetch(ThumbnailURL)
					.then(Resolve => Resolve.json())
					.then(json => {
						if (Information.waitForPictureReady && json.Final === false) {
							console.log("No Profile Picture ready. " + json.Url);
						} else {	
							if (!DiscordDataEmbed.thumbnail){
								DiscordDataEmbed.thumbnail = { url: json.Url };
							}	
						}
					})
			}		
		};
	}
	function GroupCallback(){	
		if (Extensions.Group) {
			if (Extensions.Group.Enabled && Extensions.Group.Enabled !== true) return; 

			var GroupExtension = Extensions.Group
			var GroupURL = ("https://api.roblox.com/groups/" + Information.assignedGroup)
			return Dependencies.Fetch(GroupURL)
				.then(Resolve => Resolve.json())
				.then(json => {
					if (GroupExtension.Name && GroupExtension.Name !== false) DiscordDataEmbed.fields.push({name: '__Group Name__', value: "**" + json.Name + "**"});
					if (GroupExtension.Owner && GroupExtension.Owner !== false) DiscordDataEmbed.fields.push({name: '__Group Owner__', value: "**" + `${json.Owner.Name}:${json.Owner.Id}` + "**"});
					if (GroupExtension.Description && GroupExtension.Description !== false) DiscordDataEmbed.fields.push({name: '__Group Description__', value: "*" + json.Description + "*"});
					if (GroupExtension.Thumbnail && GroupExtension.Thumbnail !== false){
						if (!DiscordDataEmbed.thumbnail){
							DiscordDataEmbed.thumbnail = { url: "https://www.roblox.com/asset-thumbnail/image?assetId=" + ImageLink.slice(0, 31) + "&width=420&height=420&format=png" }
						}
					}
				})
		};
	}
	function ServerCallback(){
		if (Extensions.Server) {
			if (Extensions.Server.Enabled && Extensions.Server.Enabled !== true) return;
			var ServerExtension = Extensions.Server
			if (ServerExtension.JobId && ServerExtension.JobId !== false) DiscordDataEmbed.fields.push({name: '__Server ID__', value: "**" + ServerExtension.JobId + "**"});
			if (ServerExtension.PlayerCount && ServerExtension.PlayerCount !== false) DiscordDataEmbed.fields.push({name: '__Server Player Count__', value: "**" + ServerExtension.PlayerCount + "**"});
		}
	}

	Promise.all([PlayerCallback(), ThumbnailCallback(), GroupCallback(), ServerCallback()])
	.then(([PCB, TCB, GCB, SCB]) => {
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
			"extensions": {
				Group: {
					"Name": true,
					"Owner": true,
					"Description": true,
					"Thumbnail": true
				}
			}
		}
		SendEmbed(Message.channel, ToSend);
	}
});


Client.login(Settings.Login);
