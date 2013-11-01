var statsUpdater=null;
function renderGlobalStats(){
	if(!statsUpdater){
		getGlobalStats();
		statsUpdater = setInterval(function(){
			getGlobalStats();
		},1500);
	}
}
function getGlobalStats(){
	Meteor.call('globalMessagesCount',function(err,res){$('#globalMessagesCount').text(res);});
	Meteor.call('globalRoomsCount',function(err,res){$('#globalRoomsCount').text(res);});
	Meteor.call('globalOnlineUsersCount',function(err,res){$('#globalOnlineUsersCount').text(res);});
	Meteor.call('globalRegisteredUsersCount',function(err,res){$('#globalRegisteredUsersCount').text(res);});
}

Template.welcome.rendered = function(){
	renderGlobalStats();

	$('.Modal:not(.bound)').addClass('bound').bind('click',function(e){e.stopPropagation()});
	$('.toggle-Modal:not(.bound)').addClass('bound').bind('click',function(){$(this).toggleClass('is-Hidden')});

	$('.tipstricks-toggle:not(.bound)').addClass('bound').bind('click',function(){
		// 
		$('#tipstricks-modal.is-Hidden').toggleClass('is-Hidden');
	});
} 