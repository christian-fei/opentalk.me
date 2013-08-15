var Messages = new Meteor.Collection('Messages');
var OnlineUsers = new Meteor.Collection('OnlineUsers');
/*
set absoluteUrl for setting up the accounts system for the right domain
edit:obsolete now, since no account-system is implemented anymore
*/
Meteor.absoluteUrl({rootUrl:'http://opentalk.me'})


var lastInsertId=0, //ID of the last inserted message
	text='', //current message text
	t=0, //current timestamp (synched with server)
	clientt= Date.now(),
	servert=0,
	tdiff=0. //difference between time on server and time on client
	mSub = null, //Messages subscription
	ouSub = null, //OnlineUsers subscription
	keepaliveTime = 10000,
	siab=0,
	loggingOut = false;

if(Meteor._localStorage.getItem('realtimeEnabled') === null){
	//set default
	Meteor._localStorage.setItem('realtimeEnabled',true);
	Session.set('realtimeEnabled',true);
} else {
	if(Meteor._localStorage.getItem('realtimeEnabled') === 'true')
		Session.set('realtimeEnabled',true);
	else
		Session.set('realtimeEnabled',false);
}

if(Meteor._localStorage.getItem('userid') && Meteor._localStorage.getItem('username') && !loggingOut){
	//console.log('restoring session from localstorage');
	Session.set('userid',Meteor._localStorage.getItem('userid'));
	Session.set('username',Meteor._localStorage.getItem('username'));
}

Deps.autorun(function(){
	if( Meteor.user() && !loggingOut) {
		//console.log('user logged in with services');
		var currentUser = Meteor.users.find().fetch()[0];
		Meteor.subscribe('userData');
	    setAvatar();
	    subscribe();
		Session.set('userid',currentUser._id);
		// Session.set('username',currentUser.profile.name);
		//setMeteorUserName();
		var username,s,u;
		if(s=Meteor.user().services){
			if(u=s.facebook)
				username=u.username;
			if(u=s.github)
				username=u.username;
			if(u=s.google)
				username=u.name;
			if(u=s.twitter)
				username=u.screenName;
		}
		Session.set('username',username);
		goOnline();
	}
});

function setMeteorUserName(){

}

var pathRoot = window.location.pathname,
  	room = pathRoot.substring(1); //path must be trimmed (no slash at beginning)


var limit = 32, //same as CSS _vars.scss
	sidebarWidth = 12; //same as CSS _room.scss

Meteor.call('serverTime',function(error, result){
	servert=result;
	tdiff = servert - clientt;
});

Meteor.setInterval(function () {
	if(Session.get('roomid') && !loggingOut){
		Meteor.call('setUserStatus',Session.get('userid'),Session.get('username'),Session.get('roomid'),'online');
	}
}, keepaliveTime);



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

function subscribe(){
	mSub=Meteor.subscribe('MessagesChatroom',Session.get('roomid'),function(){
		console.log('messages ready');
		if(Session.get('userid')) {
			scrollDown();
			$('#mymessage').focus();
		}
	});
	ouSub=Meteor.subscribe('usersOnlineInThisRoom',Session.get('roomid'));
}

/*
USER GOES OFFLINE
*/
/*
-unsubscribe from Messages, OnlineUsers
-remove user from OnlineUsers Collection (Meteor.call)
*/
function goOffline(){
	Meteor.call('setUserStatus',Session.get('userid'),Session.get('username'),Session.get('roomid'),'offline');
}


function goOnline(){
	if(!loggingOut && Session.get('userid') && Session.get('roomid') && OnlineUsers.find({userid:Session.get('userid'),roomid:Session.get('roomid')}).fetch().length === 0){  
		//console.log('going Online with ' + Session.get('userid') + ' ' + Session.get('roomid') );
		setAvatar();
		Meteor.call('setUserStatus',Session.get('userid'),Session.get('username'),Session.get('roomid'),'online');
		Meteor.call('setUserId',Session.get('userid'));
	}
}


function setAvatar(){
	if( Meteor.user() ){
		if(Meteor.user().services){
			if(Meteor.user().services.twitter)
				Session.set('avatar',Meteor.user().services.twitter.profile_image_url);
			if(Meteor.user().services.google)
				Session.set('avatar',Meteor.user().services.google.picture);
			if(Meteor.user().services.facebook)
				Session.set('avatar','https://graph.facebook.com/'+Meteor.user().services.facebook.username+'/picture');
			if(Meteor.user().services.github){
				//make ajax call to get profile image
				var gh_api_url = 'https://api.github.com/users/' + Meteor.user().services.github.username;
				//console.log('ajax to gh');
				$.ajax({
				  url: gh_api_url
				}).done(function ( data ) {
				    if(data.avatar_url)
				    	Session.set('avatar',data.avatar_url);
				});
			}
		}
	}else{
		Session.set('avatar','/images/avatar.png');
	}
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
function joinRoom(r){
	//valid path
	/*
	unsubscribe and go offline from current room
	  This because if condition is true, the user will be subscribed and signed in as online again
	  else it's all ok, since he is in /
	*/

	goOffline();
	unsubscribe();
	//Session.set('roomid',null);

	if(r === ''){
		Meteor.Router.to('/');
	}
	if(isValidRoom(r)) {
	  //console.log('valid path\nrouting to /' + r);
	  Meteor.Router.to('/'+r);
	  Session.set('roomid',r);
	  Meteor._localStorage.setItem('roomid',r);
	  goOnline();
	  subscribe();
	} else {
	  Meteor.Router.to('/');
	  console.log('invalid path or already root\nrouting to /');
	}
}




/*
RESET
-lastInsertId = null, to reset the pointer of the current message //could be left blank, since Session resets after pageload
*/
Session.set('lastInsertId',null);





/*
SET UP BASIC ROUTING
*/
Meteor.Router.add({'/about':'about'});
Meteor.Router.add({'/':'welcome'});
/*
there aren't no 404's
except the user types an invalid URL, then he will be redirected to /
*/
Meteor.Router.add({'/*':'room'});




if(isValidRoom(room)) {
	

	joinRoom(room);
	goOnline();
} else {

}




/*
going offline when the user closes the browser (also at page releod, but that's how onbeforeunload works)
*/
window.onbeforeunload = function(){
	goOffline();
	return null;
}

function validNickname(n){
	if(n.length && n.length < 25 && n.charAt(n.length - 1) !== ' ' && n.trim().length && nicknameAvailable(n))
		return true;
	return false;
}

function nicknameAvailable(n){
	if(OnlineUsers.find({nickname:n}).fetch().length === 0)
		return true;
	return false;
}



function showSidebar(){
	if( !$('.fixed-sidebar').hasClass('show') && $(window).width() < limit*16 + sidebarWidth*2*16 ){
		$('.fixed-sidebar').addClass('show');
		$('.main').addClass('under-modal');
		$('.toggle-sidebar').addClass('left');
		if($('#mymessage'))
			$('#mymessage').attr('disabled',true);
		if($('#nickname'))
			$('#nickname').attr('disabled',true);
	}
}
function hideSidebar(){
	if( $('.fixed-sidebar').hasClass('show') && $(window).width() < limit*16 + sidebarWidth*2*16 ){
		$('.fixed-sidebar').removeClass('show');
		$('.main').removeClass('under-modal');
		$('.toggle-sidebar').removeClass('left');
		if($('#mymessage'))
			$('#mymessage').attr('disabled',false);
		if($('#nickname'))
			$('#nickname').attr('disabled',false);
	}
}
function toggleSidebar(){
	if($('.fixed-sidebar').hasClass('show')){
		hideSidebar();
	}else{
		showSidebar();
	}
}



Template.loginForm.events({
	'keyup #nickname': function(evnt,tmplt){
	  if((evnt.type === 'click') || (evnt.type === 'keyup' && evnt.keyCode ===13)) {
	    var nickname = tmplt.find('#nickname').value;

	    if(validNickname(nickname)) {
	      //TODO: better unique ID
	      //make to string as a (temporary?) fix
	      var uid = Date.now() + tdiff;
	      userid = '' + uid;


	      Meteor._localStorage.setItem('username',nickname);
	      Meteor._localStorage.setItem('userid',userid);

	      Session.set('username',nickname);
	      Session.set('userid',userid);

	      goOnline();
	      subscribe();

	    } else{
	      //notify
	    }
	  }
	}
});


Template.logout.events({
	'click #logout' : function(evnt,tmplt){
		//console.log('logout clicked');
		evnt.preventDefault();

		loggingOut=true;

		goOffline();
		Session.set('userid',null);
		Session.set('username',null);
		Meteor._localStorage.removeItem('avatar');
		Meteor._localStorage.removeItem('userid');
		Meteor._localStorage.removeItem('username');
		if(Meteor.user())
			Meteor.logout(function(){
				Session.set('userid',null);
				Session.set('username',null);
			});
		setTimeout(function(){
			loggingOut=false;
		},50);
		//loggingOut=false;
		//Session.set('roomid',null);

		//redirect user to /
		//Meteor.Router.to('/');
	}
});




Template.selectChatRoom.events({
	'keyup #roomid': function(evnt,tmplt){
		if((evnt.type === 'click') || (evnt.type === 'keyup' && evnt.keyCode ===13)) {
			var room = tmplt.find('#roomid').value;
			if(isValidRoom(room)){
				joinRoom(room);
			} else {
				//notify
			}
		}
	}
});




Template.room.onlineUsers =function(){
	return OnlineUsers.find();
}
Template.room.onlineUsersCount =function(){
	return OnlineUsers.find().fetch().length;
}
Template.room.realtimeEnabled = function(){
	return Session.get('realtimeEnabled') ? 'on' : 'off';
}
/*username and userid, either from accounts or nickname*/
Template.room.username = function(){
	return Session.get('username');
};
Template.room.avatar = function(){
	return Session.get('avatar');
}
Template.room.roomSelected = function(){
	if(Session.get('roomid'))
		return true;
	return false;
}

Template.room.events({
	'click .toggle-sidebar' : toggleSidebar,
	'click #toggleRealtime' : function(evnt,tmplt){
		evnt.preventDefault();
		Meteor._localStorage.setItem('realtimeEnabled',!Session.get('realtimeEnabled'));
		Session.set('realtimeEnabled' , !Session.get('realtimeEnabled'));
	}
});


Template.messages.loggedIn=Template.room.loggedIn=function(){
	if(Session.get('username') && Session.get('userid'))
		return true;
	return false;
};


Template.messages.messages = function(){
	if(Session.get('realtimeEnabled')) {
		if( Session.get('lastInsertId') )
			return Messages.find( {_id: {$ne: Session.get('lastInsertId')} },{sort:{timestamp:1}} );
		return Messages.find({},{sort:{timestamp:1}});

	}
	else{
		return Messages.find({messageComplete:true},{sort:{timestamp:1}});
	}
};

function removeLastMessage(){
    Messages.remove({_id:''+Session.get('lastInsertId')});
    Session.set('lastInsertId',null);
    $('#mymessage').val('');
}


//http://shebang.brandonmintern.com/foolproof-html-escaping-in-javascript/
function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
};
 
// UNSAFE with unsafe strings; only use on previously-escaped ones!
function unescapeHtml(escapedStr) {
    var div = document.createElement('div');
    div.innerHTML = escapedStr;
    var child = div.childNodes[0];
    return child ? child.nodeValue : '';
};



function formatMessage(t) {
	t = escapeHtml(t);
	t = t.replace('\n','');
	var imagePattern = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|bmp|svg))/gm;
	t = t.replace(imagePattern, "  <a href='$1' rel='noindex,nofollow' class='message-image' target='_blank'><img src='$1'/></a>  ");
	var urlPatternWithProtocol = /(^|\s)(https?:\/\/[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gm;
	t = t.replace(urlPatternWithProtocol, "  <a href='$2' rel='noindex,nofollow' target='_blank'>$2</a>  ");
	var urlPatternWithoutProtocol = /(^|\s)([\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gm;
	t = t.replace(urlPatternWithoutProtocol, "  <a href='http://$2' rel='noindex,nofollow' target='_blank'>$2</a>  ");
	return t;
}






var initialMessageHeight = 0;
Template.messages.events({
	'keyup #mymessage' : function(evnt,tmplt){
	    text = tmplt.find('#mymessage').value;
	    t= Date.now() + tdiff;

    	if(!text.trim().length){
    		removeLastMessage();
    		return;
    	}

    	text = text.substring(0,text.length);

    	/*
		working in Chrome 28.0.1500.95
    	*/
    	var mm=$('#mymessage')[0],
    		hackOffset = 0;
    	if(navigator.userAgent.indexOf('Firefox') >=0){
    		hackOffset=32;
    		//console.log('firefox');
    	}
    	if(initialMessageHeight===0)
    		initialMessageHeight = mm.offsetHeight;
    	if(mm.scrollHeight > initialMessageHeight)
	    	mm.style.height = mm.scrollHeight + hackOffset + 'px';
    	
    	// console.log('offsetheight ' + initialMessageHeight);
    	// console.log('scrollheight ' + mm.scrollHeight);
    	// console.log('offsetheight ' + mm.offsetHeight);



    	if(Session.get('realtimeEnabled')) {
    		/*First message/first keystroke being sent*/
		    if(!Session.get('lastInsertId')){
				Session.set(
					'lastInsertId',
					Messages.insert(
						{
						userid:Session.get('userid')
						,username:Session.get('username')
						,roomid:Session.get('roomid')
						,text:text
						,timestamp:t
						,messageComplete:false
						,useravatar:Session.get('avatar')
						}
					)
				);
		      	return;
		    }
		    text = formatMessage(text);
		    if(evnt.keyCode === 13){

				if(text.length){
					//format message, strip tags and shit
					
					//console.log(text);
					Messages.update(
						{
							_id:''+Session.get('lastInsertId')
						}
						,{$set : 
							{
								text:text
								,timestamp:t
								,messageComplete:true
							}
						}
					);
					//new Message
					Session.set('lastInsertId',null);
					tmplt.find('#mymessage').value = '';
				} else {
					removeLastMessage();
				}
				mm.style.height = initialMessageHeight + 'px';

		    } else {

				if(text.length){
					Messages.update(
						{
							_id:''+Session.get('lastInsertId')
						}
						,{$set : 
							{
								text:text
								,timestamp:t
							}
						}
					);
				} else {
					removeLastMessage();
					mm.style.height = initialMessageHeight + 'px';
				}
		    }

    	} else {
    		if(Session.get('lastInsertId') !== null){
				Messages.remove({_id:Session.get('lastInsertId')});
				Session.set('lastInsertId',null);
    		}
    		if(evnt.keyCode === 13){
    			text = formatMessage(text);
	    		Messages.insert(
					{
					userid:Session.get('userid')
					,username:Session.get('username')
					,roomid:Session.get('roomid')
					,text:text
					,timestamp:t
					,messageComplete:true
					,useravatar:Session.get('avatar')
					}
				);
				mm.style.height = initialMessageHeight + 'px';
				console.log('resetting textarea to ' + initialMessageHeight)
				$('#mymessage').val('');

	    	}
    	}
    	scrollDown();
	}
});



function scrollDown(){
	setTimeout(function(){
		$('body').animate({scrollTop: $('body').height() + 5000},500);
		//$('#mymessage').focus();
	},10);
}

function scrollIfAtBottom(){

	siab = Meteor.setInterval(function(){
		if( $(window).scrollTop() + $(window).height()  > $(document).height() - 100 && Session.get('userid')) {
			//console.log('scrolling because at bottom');
			scrollDown();
		}
	},1000);
}

scrollIfAtBottom();

function positionFixedContent(){
	//if the room hasn't been rendered (like on the welcome page)
		//there ain't no .online-users-count
	if( !$('.online-users-count').length )return;

	var pcView = limit * 16 + 2*sidebarWidth*16;
	if($(window).width() > pcView){
		var l = $('.main').offset().left - sidebarWidth*16;
		$('.fixed-sidebar').css( 'left', l );
		$('.online-users-count').css( 'left', l );

		
		if($('.fixed-sidebar').hasClass('show')){
			$('.fixed-sidebar').toggleClass('show');
			$('.main').toggleClass('under-modal');
		}
	}
	else{
		if( $('.toggle-sidebar') && $('.toggle-sidebar').hasClass('left'))
			$('.toggle-sidebar').removeClass('left');
	}
};

Template.room.rendered = function(){
	//console.log('room ============rendered=============');
	positionFixedContent();
	var instnc = this;

	if(this.find('#nickname')){
		this.find('#nickname').focus();
	}
};

Template.welcome.rendered = function(){
	goOffline();

	$('#roomid').focus();

	$('.blanket').on('click',function(){
		$('#roomid').focus();
	});
	
};






Meteor.startup(function(){

	FastClick.attach(document.body);

	$(document).ready(function() {
		
		$('body,html').bind('scroll mousedown wheel DOMMouseScroll mousewheel keyup', function(e){
			if ( e.which > 0 || e.type == "mousedown" || e.type == "mousewheel"){
				$("html,body").stop();
			}
		});		
		

		$(window).resize(function(){
			positionFixedContent();
		});

		$(document).wipetouch({
			preventDefault:false,
			wipeLeft: function(result) {
				hideSidebar();
			},
			wipeRight: function(result) {
				showSidebar();
			}
		});
	});


	if(!Modernizr.input.placeholder){
		//console.log('there ain\'t no placeholder support in your shitty browser, dude');
		$('[placeholder]').focus(function() {
		var input = $(this);
		if (input.val() == input.attr('placeholder')) {
			input.val('');
			input.removeClass('placeholder');
		}
		}).blur(function() {
			var input = $(this);
			if (input.val() == '' || input.val() == input.attr('placeholder')) {
				input.addClass('placeholder');
				input.val(input.attr('placeholder'));
			}
		}).blur();
		$('[placeholder]').parents('form').submit(function() {
			$(this).find('[placeholder]').each(function() {
				var input = $(this);
				if (input.val() == input.attr('placeholder')) {
					input.val('');
				}
			})
		});
	}

});