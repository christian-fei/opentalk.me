Template.search.events({
	'keyup #search':function(evnt,tmplt){
		Session.set('searchquery',evnt.target.value);
		Meteor.call('roomsTaggedWith',Session.get('searchquery'),function(err,res){
			console.log(err);
			console.log(res);
			Session.set('searchresults',res);
		});
	}
});

Template.search.helpers({
	'searchResults':function(){
		if( !Session.get('searchquery') )return [];
		return Session.get('searchresults');
	}
});
