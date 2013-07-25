/*
set absoluteUrl for setting up the accounts system for the right domain
*/
console.log(Meteor.absoluteUrl({rootUrl:'http://opentalk.me'}));


var lastInsertId=0, //ID of the last inserted message
	text='', //current message text
	t=0, //current timestamp
	mSub, //Message subscription
	ouSub; //OnlineUsers subscription



/*
UTILITY FUNCTIONS
*/

/*
unsubscribe from subscriptions
*/
function unsubscribe(){
	if(mSub)
	  mSub.stop();
	if(ouSub)
	  ouSub.stop();
}

/*
USER GOES OFFLINE
*/
/*
-remove user from OnlineUsers Collection (Meteor.call)
-unsubscribe from Messages, OnlineUsers
*/
function goOffline(){
	unsubscribe();
	if( !(Session.get('userid') && Session.get('roomid')) )
	  return;
	Meteor.call('removeOnlineUserFromRoom',Session.get('userid'),Session.get('roomid'));
	var str = Session.get('username') + '('+Session.get('userid')+') is leaving room ' + Session.get('roomid');
	Meteor.call('clog',str);
}


function isValidRoom(r){
	if(r.match(/^[^#\/>]+$/gi))
	  return true;
	return false;
}




/*
USER ENTERS A ROOM

CAUTION:
THE ROOM MUST BEGIN WITH NO SLASH
*/
function routeToRoom(r){
	//valid path
	/*
	unsubscribe and go offline from current room
	  This because if condition is true, the user will be subscribed and signed in as online again
	  else it's all ok, since he is in /
	*/
	/*
	unsubscribe();
	goOffline();
	*/
	Session.set('roomid',null);
	Meteor._localStorage.removeItem('roomid');
	if(isValidRoom(r)) {
	  console.log('valid path\nrouting to /' + r);
	  Meteor.Router.to('/'+r);
	  Session.set('roomid',r);
	  Meteor._localStorage.setItem('roomid',r);
	} else {
	  Meteor.Router.to('/');
	  console.log('invalid path or already root\nrouting to /');
	}
}



/*
-unsubscribe from previous rooms
-Session roomid will be set
-manage subscriptions
*/
function subscribeToRoom(r){
	if(isValidRoom(r)) {
	  
	  unsubscribe();
	  goOffline();

	  Session.set('roomid',r);
	  Meteor._localStorage.setItem('roomid',r);
	  mSub=Meteor.subscribe('MessagesChatroom',r);
	  ouSub = Meteor.subscribe('usersOnlineInThisRoom',r);

	  goOnline();
	}
}




/*
RESET
-lastInsertId = null, to reset the pointer of the current message //could be left blank, since Session resets after pageload
-TO FIGURE OUT: room in localStorage to Session or not
  -figured out: when the user logs out, clear the roomid in localStorage
-get the username,userid from localStorage
*/
Session.set('lastInsertId',null);
/*
*/
if(Meteor._localStorage.getItem('roomid'))
	Session.set('roomid',Meteor._localStorage.getItem('roomid'));

	Session.set('username',Meteor._localStorage.getItem('username'));
	Session.set('userid',Meteor._localStorage.getItem('userid'));

	Deps.autorun(function(){
	console.log('roomid ' + Session.get('roomid'));
	console.log('userid ' + Session.get('userid'));
	console.log('username ' + Session.get('username'));
});






/*
ACCOUNT MANAGEMENT
for users logged in with Twitter,Github and shit
*/
Deps.autorun(function () {
	if (Meteor.userId()) {
	  // on login
	  Meteor._localStorage.setItem('username',Meteor.user().profile.name);
	  Meteor._localStorage.setItem('userid',Meteor.user()._id);
	  Session.set('username',Meteor.user().profile.name);
	  Session.set('userid',Meteor.user()._id);
	}
});



/*
SET UP BASIC ROUTING
*/
Meteor.Router.add({'/about':'about'});
/*
there aren't no 404's
except the user types an invalid URL, then he will be redirected to /
*/
Meteor.Router.add({'/*':'messagesList'});

var pathRoot = window.location.pathname,
  room = pathRoot.substring(1); //path must be trimmed (no slash at beginning)

console.log('current loc ' +pathRoot);

goOffline();
unsubscribe();

if(isValidRoom(room)) {
	routeToRoom(room);
	subscribeToRoom(room);
	goOnline();
} else {
	if(Session.get('roomid')){
	  routeToRoom(Session.get('roomid'));
	  subscribeToRoom(Session.get('roomid'));
	}
}



function goOnline(){

	//register as online only if not already online
	if(!Session.get('userid') || !Session.get('username') || !Session.get('roomid'))
	  return;
	
	if(OnlineUsers.find({userid:Session.get('userid'),username:Session.get('username'),roomid:Session.get('roomid')}).fetch().length === 0){  
		console.log('register online status');
		var str = Session.get('username') + '('+Session.get('userid')+') entered room ' + Session.get('roomid');
		Meteor.call('clog',str);
		OnlineUsers.insert(
			{
			  userid:Session.get('userid'),
			  username:Session.get('username'),
			  roomid:Session.get('roomid')
			}
		);
	}
}




/*
going offline
*/
window.onbeforeunload = goOffline;





function distinctUsers(){
	var users = OnlineUsers.find().fetch(),
	    user,
	    distinctUsers=[],
	    du,
	    i=0,
	    j,
	    distinct;

	while(u=users[i++]){
	  j=0;
	  distinct=true;
	  while(du=distinctUsers[j++])
	    if(du.userid === u.userid)
	      distinct=false;
	  if(distinct)
	    distinctUsers.push(u);
	}
	return distinctUsers;
}

Template.messagesList.users =function(){
	return distinctUsers();
}
Template.messagesList.usersCount =function(){
	return distinctUsers().length;
}




Template.pickNickname.events({
	'keyup #nickname': function(evnt,tmplt){
	  if((evnt.type === 'click') || (evnt.type === 'keyup' && evnt.keyCode ===13)) {
	    var nickname = tmplt.find('#nickname').value;
	    if(nickname.length && nickname.indexOf(' ') <= 0) {
	      //TODO: better unique ID
	      //make to string as a (temporary?) fix
	      userid = '' + Date.now();

	      //bind it to the Session to make it reactive
	      Meteor._localStorage.setItem('username',nickname);
	      Meteor._localStorage.setItem('userid',userid);
	      Session.set('username',nickname);
	      Session.set('userid',userid);

	      subscribeToRoom(Session.get('roomid'));
	      routeToRoom(Session.get('roomid'));
	      goOnline;
	    } else{
	      //notify
	    }
	  }
	}
});


Template.logout.events({
	'click #logout' : function(evnt,tmplt){
	  evnt.preventDefault();
	  goOffline();
	  unsubscribe();

	  if(Meteor.user())
	    Meteor.logout();
	  Meteor._localStorage.removeItem('username');
	  Meteor._localStorage.removeItem('userid');
	  Meteor._localStorage.removeItem('roomid');

	  Session.set('username',null);
	  Session.set('userid',null);
	  Session.set('roomid',null);

	  //redirect user to /
	  Meteor.Router.to('/');
	}
});









Template.selectChatRoom.events({
	'keyup #roomid': function(evnt,tmplt){
	  if((evnt.type === 'click') || (evnt.type === 'keyup' && evnt.keyCode ===13)) {
	    var room = tmplt.find('#roomid').value;
	    if(isValidRoom(room)){
	      routeToRoom(room);
	      subscribeToRoom(room);
	    } else {
	      //notify
	      
	    }
	  }
	}
});




/*
global username, either from accounts or nickname
*/
Template.roomSelected.username = function(){
	return Session.get('username');
};

Template.messagesList.loggedIn=Template.roomSelected.loggedIn=function(){
	if(Session.get('username') && Session.get('roomid'))
	  return true;
	return false;
};
Template.messagesList.loggedInWithAccount=Template.login.loggedInWithAccount = function(){
	if(Meteor.user())
	  return true;
	return false;
}
Template.messagesList.loggedInWithNickname=Template.login.loggedInWithNickname = function(){
	if(!Meteor.user() && Session.get('username'))
	  return true;
	return false;
}

function iAmWriting(){
	if(Session.get('lastInsertId'))
	  return true;
	return false;
}

Template.messagesList.messages = function(){
	var ml = Messages.find({'roomid':Session.get('roomid')}).fetch().length;

	if(iAmWriting()){
	  if(ml <= 1)
	    return [];
	  return Messages.find(
	    {'roomid':Session.get('roomid')}
	    ,{sort: {timestamp: 1},limit:ml -1});
	}else
	  return Messages.find(
	    {'roomid':Session.get('roomid')}
	    ,{sort: {timestamp: 1}}
	  );  
};
Template.messagesList.roomSelected=Template.login.roomSelected=Template.selectChatRoom.roomSelected= function(){
	if(Session.get('roomid'))
	  return true;
	return false;
};

Template.selectChatRoom.selectedRoom= function(){
	if(Session.get('roomid'))
	  return Session.get('roomid');
	return '';
};


Template.messagesList.events({
	'keyup #mymessage' : function(evnt,tmplt){
	  if(Session.get('username')){

	    text = tmplt.find('#mymessage').value;
	    t = Date.now();

	    /*First message/first keystroke being sent*/
	    if(!Session.get('lastInsertId') && text.length){
	      Session.set(
	        'lastInsertId',
	        Messages.insert(
	          {userid:Session.get('userid')
	          ,user:Session.get('username')
	          ,roomid:Session.get('roomid')
	          ,text:text
	          ,timestamp:t}
	        )
	      );
	      return;
	    }

	    if(evnt.keyCode === 13){

	      if(text.length){
	        //new Message
	        Session.set('lastInsertId',null);
	        tmplt.find('#mymessage').value = '';
	      } else {
	        Messages.remove({_id:''+Session.get('lastInsertId')});
	        Session.set('lastInsertId',null);
	      }
	    } else {
	      if(text.length){
	        Messages.update(
	          {_id:''+Session.get('lastInsertId')}
	          ,{$set : {
	              text:text
	              ,timestamp:t
	            }
	          }
	        );
	      } else {
	        Messages.remove({_id:''+Session.get('lastInsertId')});
	        Session.set('lastInsertId',null);
	      }
	    }
	  }
	  $('#mymessage').focus();
	},

	'click #deleteMyMessages' : function(evnt,tmplt){
	  evnt.preventDefault();
	  if(confirm('Do you want to remove your messages from this room?')){
	    Meteor.call('removeMessagesOfUserInRoom',Session.get('userid'),Session.get('roomid'));
	  }
	}

});



$(document).ready(function() {

	function adapt(){

	  $('.messages').innerWidth( Math.floor($('.main').innerWidth() -1 - $('#online-users').innerWidth()) );

	}

	adapt();

	$(window).resize(function(){
	  adapt();
	});
});
