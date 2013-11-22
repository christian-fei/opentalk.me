Template.search.events({
	'keyup #search-tags':function(evnt,tmplt){
		Session.set('searchquery',evnt.target.value);
		Meteor.call('roomsTaggedWith',Session.get('searchquery'),function(err,res){
			// 
			// 
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
