Meteor.absoluteUrl({rootUrl:'http://opentalk.me'})


var lastInsertId=0, //ID of the last inserted message
	text='', //current message text
	t=0, //current timestamp (synched with server)
	clientt= Date.now(),
	servert=0,
	tdiff=0. //difference between time on server and time on client
	keepaliveTime = 10000,
	siab=0,
	loggingOut = false,
	stick=true,
	messagesLimit=50
	,
	latestTimestampAtLoad=0,
	mSub=ouSub=mPagination=null,
	animationDuration=250,
	firstRunAfterMore=true;

function getMessages(){
	setTimeout(function(){
		if(mSub)mSub.stop();
	},1000);
	setTimeout(function(){
		mSub=Meteor.subscribeWithPagination('paginatedMessages',Session.get('roomid'), messagesLimit);
		ouSub=Meteor.subscribe('usersOnlineInThisRoom',Session.get('roomid'));
		Meteor.subscribe('MessagesReady',Session.get('roomid'),function(){
			console.log('messages ready');
			watchMessages();
		});
	},1000);
}

Meteor.call('calltest','======================',function(error,result){
	console.log(result);
});

Deps.autorun(function(){
	console.log('roomid ' + Session.get('roomid'));
	console.log('userid ' + Session.get('userid'));
	if(Session.get('roomid')){
		getMessages();
		setTimeout(scrollDown,0);
		scrollDown();
	}
	else{
		if(mSub)mSub.stop();
		$('.message').not('#mymessage').remove();
	}
});


function watchMessages(){
	$('.message').not('#mymessage').remove();
	setTimeout(function(){
	},1000);
	if(Messages.find({},{sort:{timestamp:-1},limit:1}).fetch().length > 0)
	latestTimestampAtLoad = Messages.find({},{sort:{timestamp:-1},limit:1}).fetch()[0].timestamp;
	if(mPagination)
		mPagination.stop();
	var prevUser=prevId=null;
	mPagination=Messages.find({},{sort:{timestamp:1}}).observeChanges({
		addedBefore: function(id, fields,before){
			// console.log('added id ' +id + ' before ' + before);

			/*if I write and the message is not complete, don't add it to the list, only as soon as it changed status to messageComplete=true*/
			if(fields.userid === Session.get('userid') && fields.messageComplete===false)return;
			/*if I don't want realtime messages why should I render them if they are not complete YET??! Huh?*/
			if(!Session.get('realtimeEnabled') && fields.messageComplete===false)return;
			
			var message = $('<li class="message" id="'+id+'"><span class="avatar"></span><b class="username">'+fields.username+'</b><span class="text">'+fields.text+'</span></li>');

			if(before === null) {
				//items of first load and recently typed ones
				message.hide();
				$('#last').before(message);
				console.log('prevUser ' +prevUser);
				console.log('currUser ' +fields.username);
				if(prevUser===null || prevUser!==fields.username){
					//A NEW USER
					message.addClass('diffUser');
					message[0].firstChild.style.backgroundImage='url("' + fields.useravatar + '")';
					message[0].firstChild.classList.add('avatar-border');
					$('#'+prevId).addClass('lastOfUser');
				}
				//since all the message that have before === null are at the bottom, thisis a new message => display it like one
				message.addClass('realtime').fadeIn(animationDuration,function(){if(stick && Session.get('userid'))scrollDown()});
			}else{
				//items of load-more+
				message.hide();
				$('#'+before).before(message);
				//it is at the bottom of the list, so add lastOfUser class
			
				// console.log('=========');
				// console.log(fields.username);
				// console.log(prevUser);
				// console.log('=========');
				message[0].firstChild.style.backgroundImage='url("'+fields.useravatar+'")';
				// message[0].firstChild.classList.add('avatar-border');

				if(firstRunAfterMore){
					message.addClass('lastOfUser');
				}else{
					if(prevUser!==fields.username){
						message.addClass('lastOfUser diffUser');
						// message.css({'background':'red'});
						message.next().addClass('diffUser');
						// message.next()[0].addClass('diffUser');
					}else{
						message.addClass('diffUser');
						message.next()[0].firstChild.style.backgroundImage='none';
						message.next().removeClass('diffUser');
					}
				}
				message.fadeIn(animationDuration,function(){if(stick && Session.get('userid'))scrollDown()});
				firstRunAfterMore=false;
			}

			prevUser=fields.username;
			prevId=id;
			if(stick && Session.get('userid'))scrollDown();
		},
		changed: function(id,fields){
			console.log('changed ' + id + ' to ' + fields.text);
			// console.log( $('#mymessage').val() );
			// console.log('lid ' +Session.get('lastInsertId'));
			// console.log(fields);
			// console.log('changed & lmu ' + prevUser);
			if( $('#'+id).length ){
				//update existing message
				if(fields.text !== undefined)
					$('#'+id+' .text').html( fields.text );
			}else 
			if(fields.messageComplete === true){
				console.log('message completed');
				var mfdb = Messages.find({_id:id}).fetch()[0];
				console.log(mfdb);
				if(prevUser===mfdb.username){
					message = $('<li class="message" id="'+id+'"><span class="avatar"></span><b class="username">'+mfdb.username+'</b><span class="text">'+mfdb.text+'</span></li>');
				}
				else{
					$('#'+prevId).addClass('lastOfUser');
					message = $('<li class="message diffUser" id="'+id+'"><span class="avatar avatar-border" style="background:url('+mfdb.useravatar+')"></span><b class="username">'+mfdb.username+'</b><span class="text">'+ mfdb.text +'</span></li>');
					// prevUser=null;
				}
				prevUser=mfdb.username;
				prevId=id;
				// if(!prevUser)prevUser=fields.username;
				
				message.hide();
				$('#last').before(message);
				message.addClass('realtime').fadeIn(animationDuration,function(){if(stick && Session.get('userid'))scrollDown()});	
			}
			if(stick && Session.get('userid'))
				scrollDown();
		},
		movedBefore: function(id,before){
			console.log(id + ' changed position to ' + before);
			//kinda works, but only if the moved element has an avatar, else it's moved withouth
			// if(before===null){
			// 	$('#'+id).slideUp(animationDuration, function(){ $(this).insertBefore($('#last')) }).slideDown(animationDuration);
			// }
		},
		removed: function(id){
			// if(id === $('.messages li').first().attr('id'))
			// 	return;

			console.log('removed ' + id);
			console.log('prevId ' + prevId);

			console.log( $('#last').prev().attr('id') );

			if(id === $('#last').prev().attr('id')){
				prevUser=prevId=null;
			}
			


			// //set prevUser and prevId respectively to the prev element
			// if( $('#'+id).prev().attr('id') !== 'first' ){
			// 	console.log('an user canceled his message');
			// 	//there is at least one message, because there are already these fix elements first,last,li-message
			// 	if( $('.messages').children().length > 3 && !Session.get('lastInsertId') ){
			// 		console.log('restore prevUser and prevId');
			// 		// prevId = $('#'+prevId)[0].id;
			// 		prevUser = $('#'+prevId + ' .username').html();
			// 		console.log('prevId ' + prevId + ' prevUser ' +prevUser);
			// 	}
			// 	prevUser=prevId=null;
			// } else{
			// 	// prevUser=prevId=null;
			// 	// console.log('setting prevId ' + prevId + ' prevUser ' +prevUser);

			// }
			if( $('#'+id).next()[0] !== undefined && $('#'+id).next()[0] !== null &&  $('#'+id).next()[0].id !== 'last'){
				if( $('#'+id + ' .username').html() === $('#'+id).next()[0].querySelector('.username').innerHTML ){
					var bckpBg = $('#'+id)[0].firstChild.style.backgroundImage;
					$('#'+id).next()[0].firstChild.style.backgroundImage=bckpBg;
					$('#'+id).next()[0].firstChild.classList.add('avatar-border');
					$('#'+id).next().addClass('diffUser');
				}
			}
			//if the next element in the list has an empty background it means it is from the same user, apply the image from this element (id) to it


			$('#'+id).remove();
			//DON'T
		}
	});
}

if(Meteor._localStorage.getItem('realtimeEnabled') === null){
	//set default
	Meteor._localStorage.setItem('realtimeEnabled',false);
	Session.set('realtimeEnabled',false);
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
	    //unsubscribe();
		//console.log('user logged in with services');
		var currentUser = Meteor.users.find().fetch()[0];
		Meteor.subscribe('userData');
	    subscribe();
	    setAvatar();
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


/*
unsubscribe from subscriptions
*/
function unsubscribe(){
	// if(mSub)
	//   mSub.stop();
	// if(ouSub)
	//   ouSub.stop();
}

function subscribe(){
	// mSub=Meteor.subscribe('MessagesReady',Session.get('roomid'),function(){
	// 	console.log('messages ready');
	// 	if(Session.get('roomid') && Session.get('userid')) {
	// 		//$('#mymessage').focus();
	// 	}
	// });
	// if(mSub && mSub._limit < messagesLimit)
	// if(!ouSub)
		
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
	//unsubscribe();
	Session.set('roomid',null);

	if(r === ''){
		Meteor.Router.to('/');
		goOffline();
		Session.set('roomid',null);
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
Meteor.Router.add({'/': function(){goOffline();Session.set('roomid',null); return 'welcome';}});
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
		// unsubscribe();
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
				$('.message').not('#mymessage').remove();
				setTimeout(function(){},1000);
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
	'click #toggleRealtime' : function(evnt){
		evnt.preventDefault();
		Meteor._localStorage.setItem('realtimeEnabled',!Session.get('realtimeEnabled'));
		Session.set('realtimeEnabled' , !Session.get('realtimeEnabled'));
	},
	'click .go-home-you-are-drunk' : function(evnt,tmplt){
		evnt.preventDefault();
		Session.set('roomid',null);
		$('.message').not('#mymessage').remove();
		setTimeout(function(){},1000);
		Meteor.Router.to('/');
	}
});


Template.messages.loggedIn=Template.room.loggedIn=function(){
	if(Session.get('username') && Session.get('userid'))
		return true;
	return false;
};
Template.messages.messagesReady = function() {
	return ! mSub.loading();
}
Template.messages.allMessagesLoaded = function() {
	return ! mSub.loading() && Messages.find().count() < mSub.loaded();
}
Template.messages.mymessageDisabled = function(){
	if(Session.get('userid'))
		return '';
	return 'disabled';
}

Template.messages.messages = function(){
	//return Messages.find({_id: {$ne: Session.get('lastInsertId')}},{sort:{timestamp:1}});
	/*if(Session.get('realtimeEnabled')) {
		if( Session.get('lastInsertId') )
			return Messages.find( {_id: {$ne: Session.get('lastInsertId')} },{sort:{timestamp:1}} );

	}
	else{
		return Messages.find({messageComplete:true},{sort:{timestamp:1}});
	}*/
};

Template.messages.rendered = function(){
	if(Session.get('userid') && Session.get('userid') && stick){
		//console.log('scrolling because stick');
		scrollDown();
		//this.find('#mymessage').focus();
	}
}

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
	var imagePattern = /(^|\s)(https?:\/\/[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?\.(?:png|jpg|jpeg|gif|bmp|svg))/gm;
	// var imagePattern = /(http(s?):)|([/|.|\w|\s])*\.(?:jpg|gif|png)/gm;
	t = t.replace(imagePattern, "  <a href='$2' rel='noindex,nofollow' target='_blank'><img src='$2' class='message-image'/></a>  ");
	var urlPatternWithProtocol = /(^|\s)(https?:\/\/[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gm;
	t = t.replace(urlPatternWithProtocol, "  <a href='$2' rel='noindex,nofollow' target='_blank'>$2</a>  ");
	var urlPatternWithoutProtocol = /(^|\s)([\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gm;
	t = t.replace(urlPatternWithoutProtocol, "  <a href='http://$2' rel='noindex,nofollow' target='_blank'>$2</a>  ");
	return t;
}






var initialMessageHeight = 0;
Template.room.events({
	'click .load-more': function(evnt) {
		evnt.preventDefault();
		// prevUser=prevId=null;
		firstRunAfterMore=true;
		console.log('loading more messages, current scrollTop ' + $('body').scrollTop() );
		mSub.loadNextPage();
		console.log('loading more messages, current scrollTop ' + $('body').scrollTop() );
	}
});
Template.messages.events({
	'keyup #mymessage' : function(evnt,tmplt){

		console.log(evnt.keyCode);
		console.log(evnt.which);

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
				//console.log('resetting textarea to ' + initialMessageHeight)
				$('#mymessage').val('');

	    	}
    	}
    	setTimeout(function(){
    		scrollDown();
    	},0);
	}
});



function scrollDown(){
	setTimeout(function(){
		$("html, body").scrollTop($('html').height()+2000);
		// $('html,body').animate({scrollTop: $('html').height() + 5000 },1);
	});
	// if($('.messages').children().length > 3){
	// }
}

// function scrollIfAtBottom(){
// 	siab = Meteor.setInterval(function(){
// 		if( $(window).scrollTop() + $(window).height()  > $(document).height() - 100 && Session.get('userid')) {
// 			//console.log('scrolling because at bottom');
// 			scrollDown();
// 		}
// 	},1500);
// }


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
	// console.log('room ============rendered=============');
	positionFixedContent();
	var instnc = this;

	if(this.find('#nickname')){
		this.find('#nickname').focus();
	}
};


Template.welcome.rendered = function(){
	goOffline();

	this.find('#roomid').focus();

	$('.blanket').on('click',function(){
		$('#roomid').focus();
	});
	
};






Meteor.startup(function(){

	FastClick.attach(document.body);

	$(document).ready(function() {
		
		$('body,html').bind('scroll mousedown wheel DOMMouseScroll mousewheel keyup', function(e){
			if ( e.which > 0 || e.type == "mousedown" || e.type == "mousewheel"){
				//console.log('scrolling because of '+ e.type);
				if($(window).scrollTop() + $(window).height()  < $(document).height() - 200 && (e.type == 'mousedown' || e.type == 'mousewheel') ){
					stick = false;
				}else{
					stick=true;
				}
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

Template.debug.helpers({
	lastInsertId: function(){return Session.get('lastInsertId')},
	userid: function(){return Session.get('userid')},
	username: function(){return Session.get('username')},
	roomid: function(){return Session.get('roomid')},
	realtimeEnabled: function(){return Session.get('realtimeEnabled')},
	avatar: function(){return Session.get('avatar')}
});