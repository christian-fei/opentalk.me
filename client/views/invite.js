Template.invite.helpers({
	'room':function(){
		return Session.get('roomid')
	}
});

Template.invite.events({
	'click .share-url' : function(evnt,tmplt){
		console.log(evnt.target);
		_select(evnt.target);
	}
});
