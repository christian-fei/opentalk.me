var alreadyTracked=[];

Meteor.Router.add({'/': function(){
		goOffline();
		//reset
		Session.set('roomid',null);
		if(!alreadyTracked['/'] && window.location.hostname === 'opentalk.me' && Meteor.userId() !== 'AZHSZ59HnHn2qiKW5'){
                // console.log('tracking /');
                mixpanel.track('landing');
                alreadyTracked['/']=true;
        }
        onlineUsersAutoComplete=[];
		return 'welcome';
	}
});

Meteor.Router.add({'/profile':function(){
		goOffline(); //because you're not anymore in the room
		//reset
		// console.log('pageview profile');
		if(!alreadyTracked['/profile'] && window.location.hostname === 'opentalk.me' && Meteor.userId() !== 'AZHSZ59HnHn2qiKW5'){
	            // console.log('tracking /profile');
	            mixpanel.track('profile');
	            alreadyTracked['/profile']=true;
	    }
	    onlineUsersAutoComplete=[];
		return 'profile';
	}
});


Meteor.Router.add({'/:id': function(id){
		//reset
		

		Session.set('roomid',id);
		prevUserId=prevId=null;
		goOnline();
		ouSub=Meteor.subscribe('usersOnlineInThisRoom',Session.get('roomid'));
		mSub=Meteor.subscribeWithPagination('paginatedMessages',Session.get('roomid'), messagesLimit);
		// console.log('we are at ' + this.canonicalPath);
		if( $('#mymessage') )
			$('#mymessage').focus();
		if(!alreadyTracked[id] && window.location.hostname === 'opentalk.me' && Meteor.userId() !== 'AZHSZ59HnHn2qiKW5'){
			// console.log('tracking /' + id);
			mixpanel.track(
			    'room',
			    { 'roomid': id }
			);
			alreadyTracked[id]=true;			
		}
		// onlineUsersAutoComplete=[];
		return 'room';
	}
});
