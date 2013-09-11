function setGlobalStats(){
	//setInterval to retrieve info periodcally
	Meteor.call('globalMessagesCount',function(err,res){$('#globalMessagesCount').text(res);});
	Meteor.call('globalRoomsCount',function(err,res){$('#globalRoomsCount').text(res);});
	Meteor.call('globalOnlineUsersCount',function(err,res){$('#globalOnlineUsersCount').text(res);});
}

Template.welcome.rendered = setGlobalStats;