Meteor.Router.add({'/': 'welcome'});

Meteor.Router.add({'/:id': function(id){
		Session.set('roomid',id);
		console.log('we are at ' + this.canonicalPath);
		return 'room';
	}
});

Meteor.Router.add({'/about':'about'});
