var statsUpdater=null;
function setGlobalStats(){
	if(!statsUpdater){
		statsUpdater = setInterval(function(){
			// console.log('updating stats');
			//setInterval to retrieve info periodcally
			Meteor.call('globalMessagesCount',function(err,res){$('#globalMessagesCount').text(res);});
			Meteor.call('globalRoomsCount',function(err,res){$('#globalRoomsCount').text(res);});
			Meteor.call('globalOnlineUsersCount',function(err,res){$('#globalOnlineUsersCount').text(res);});
			Meteor.call('globalRegisteredUsersCount',function(err,res){$('#globalRegisteredUsersCount').text(res);});
		},1500);
	}
}

Template.welcome.rendered = setGlobalStats;