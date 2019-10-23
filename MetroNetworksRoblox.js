Client.on("ready", Ready => {
	console.log("r/MetroNetworks Loaded. Ready for Use!");
	BotStarts = Math.floor(new Date() / 1000);

	var Count = 0
	function GetUsers(){
		return Client.guilds.forEach((guild) => {
			guild.fetchMembers().then(g => {
				g.members.forEach((member) => {
					Count++;
				});
			});
		});
	}

	Promise.all([GetUsers()])
	.then(([GU]) => {
		console.log(Count)
		Client.user.setActivity(`⬡ Metro Networks | Watching ${Count} Users.`, {type: "STREAMING", url: "http://twitch.tv/MetroScripts"})
	})
});
