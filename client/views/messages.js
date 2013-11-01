var initialMessageHeight = 0,
	keysPressed = [];


Template.messages.events({
	'keydown #mymessage' : function(evnt,tmplt){
		// 
		keysPressed[evnt.keyCode] = true;
		// 
	},
	'keyup #mymessage' : function(evnt,tmplt){
		// 
		
		// 
		// 
		// 

	    text = tmplt.find('#mymessage').value;
	    t= Date.now() + tdiff;
	    allowed = text.length < 500 ? true : false;


	    //remove last \n if any
		// text = text.charAt(text.length-1) === '\n' ? text.substring(0,text.length - 1) : text;



    	//remove last /n
    	// text = text.substring(0,text.length);

		if(keysPressed[13] && keysPressed[16]){
			//add a new line and then return
			// 
			//TODO:understand if not needed
			// text += '\n';
			keysPressed[evnt.keyCode] = false;
			return;
		}

		keysPressed[evnt.keyCode] = false;

		//return if typeahead is showing, so that the user can safely hit return withouth sending the message
		if( $('.typeahead').css('display') === 'block' )return;
 
    	/*
		working in Chrome 28.0.1500.95
    	*/
    	var mm=$('#mymessage')[0],
    		hackOffset = 0;
    	if(navigator.userAgent.indexOf('Firefox') >=0){
    		hackOffset=36;
    		//
    	}
    	if(initialMessageHeight===0)
    		initialMessageHeight = mm.offsetHeight;
    	if(mm.scrollHeight > initialMessageHeight)
	    	mm.style.height = mm.scrollHeight + hackOffset + 'px';
    	
    	// 
    	// 
    	// 

    	if(!text.trim().length){
    		removeLastMessage();
    		mm.style.height = initialMessageHeight + 'px';
    		return;
    	}

    	oldMessages=false;

	    if(!allowed){
	    	//show a notification that I shit on trolls, or just don't give a fuck
	    	// 

	    	tmplt.find('#mymessage').style.border='1px solid red';

	    	return;
	    }else{
	    	tmplt.find('#mymessage').style.border='none';
	    	tmplt.find('#mymessage').style.borderLeft='2px solid #cc9600';

	    }


    	if(Session.get('realtimeEnabled')) {
    		/*First message/first keystroke being sent*/
		    if(!Session.get('lastInsertId')){
				Session.set(
					'lastInsertId',
					Messages.insert(
						{
						userid:Meteor.userId()
						,username:Session.get('screenname')
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
					
					//
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
					userid:Meteor.userId()
					,username:Session.get('screenname')
					,roomid:Session.get('roomid')
					,text:text
					,timestamp:t
					,messageComplete:true
					,useravatar:Session.get('avatar')
					}
				);
				mm.style.height = initialMessageHeight + 'px';
				//
				$('#mymessage').val('');

	    	}
    	}
    	setTimeout(function(){
    		scrollDown();
    	},0);
	}
});


Meteor.startup(function(){
	messagesObserveChanges=null;
	messagesObserve=null;

	// emojify.setConfig({
	//     emojify_tag_type: 'span',
	//     emoticons_enabled: true
	// });
});

Template.messages.rendered = function() {
	// renderEmoji();
}




message=null;
avatar=null;
username=null;
text=null;

function renderMessages(){
	if(messagesAlreadyRendered)return;
	messagesAlreadyRendered=true;
	
	$('.fetching-your-messages').slideUp();

	if(messagesObserveChanges)
		messagesObserveChanges.stop();
	//reset
	var timetext='';
	timeRefChecker=[];
	currentTimeRef=10000;
	resetUnreadCount();

	messagesObserve=Messages.find({},{sort:{timestamp:1}}).observe({
		movedTo: function(doc, fromIndex, toIndex, before){
			//Don't show my message until it's marked as complete..
			if(doc.userid === Meteor.userId() && doc.messageComplete===false)return;
			//hide not yet completed messages to users who don't want to.
			if(!Session.get('realtimeEnabled') && doc.messageComplete===false)return;
			//i think this fixes some ff issues
			if(doc._id === $('#last').prev().attr('id')  )return;

			//the message
			message = document.createElement('li');
			message.setAttribute('class','message new-message diffUser lastOfUser');
			message.setAttribute('id',doc._id);
			message.setAttribute('data-userid',doc.userid);

				//span.avatar
				avatar=document.createElement('span');
				avatar.setAttribute('class','avatar tip avatar-border');
				avatar.style.background = 'url(\'' +doc.useravatar + '\')';

					//span.username
					username=document.createElement('span');
					username.classList.add('username');
					username.innerHTML = doc.username;

				//span.text
				text=document.createElement('span');
				text.classList.add('text');
				text.innerHTML=doc.text;

				time=document.createElement('span');
				time.classList.add('time');
				time.innerHTML = (new Date(doc.timestamp)).toLocaleString();

			//assemble the message
			avatar.appendChild( username );
			message.appendChild(avatar);
			message.appendChild(text);
			message.appendChild(time);

			$('#'+doc._id).remove();

			$('#last').before( $(message) );

			if(trolls.indexOf(doc.userid) >=0){
				//hiding because in trolls
				// 
				$(message).hide(); //not workging anymore
				// message.style.display = 'none';
			}
		}
	});
	messagesObserveChanges=Messages.find({},{sort:{timestamp:1}}).observeChanges({
		addedBefore: function(id, fields,before){

			// 

			timetext=checkPrintTime(fields.timestamp);

			// 

			//Don't show my message until it's marked as complete..
			if(fields.userid === Meteor.userId() && fields.messageComplete===false)return;
			else{
				// $('#last').prev().addClass('lastOfUser');
			}
			//hide not yet completed messages to users who don't want to.
			if(!Session.get('realtimeEnabled') && fields.messageComplete===false)return;





			//the message
			message = document.createElement('li');
			message.setAttribute('class','message new-message');
			message.setAttribute('id',id);
			message.setAttribute('data-userid',fields.userid);

				//span.avatar
				avatar=document.createElement('span');
				avatar.setAttribute('class','avatar');

					//span.username
					username=document.createElement('span');
					username.classList.add('username');
					username.innerHTML = fields.username;

				//span.text
				text=document.createElement('span');
				text.classList.add('text');
				if(fields.deletedAt){
					// 
					text.innerHTML='deleted message';
					text.classList.add('deleted');
				}else{
					text.innerHTML=fields.text;				
				}
				
				time=document.createElement('span');
				time.classList.add('time');
				time.innerHTML = (new Date(fields.timestamp)).toLocaleString();



			//assemble the message
			avatar.appendChild( username );
			message.appendChild(avatar);
			message.appendChild(text);
			message.appendChild(time);



			if(trolls.indexOf(fields.userid) >=0){
				//hiding because in trolls
				// 
				$(message).hide(); //not workging anymore
				// message.style.display = 'none';
			}

			if(before === null) {
				//first item of first load and recently typed ones
				$('#last').before(message);
				if($('#'+id).prev() && $('#'+id).prev().data('userid')!==fields.userid){
					//A NEW USER
					message.classList.add('diffUser');
					avatar.style.backgroundImage='url("' + fields.useravatar + '")';
					avatar.classList.add('avatar-border');
					avatar.classList.add('tip');
					if( !$('#'+id).prev().hasClass('timestamp-text') )
						$('#'+id).prev().addClass('lastOfUser');
				}
			}else{
				//stay at the same position
				var offsetBottom = document.body.offsetHeight - document.body.scrollTop;

				$('#'+before).before(message);

				avatar.style.backgroundImage='url("'+fields.useravatar+'")';

				if(firstRunAfterMore){
					// 
					message.classList.add('lastOfUser');
					avatar.classList.add('avatar-border');
					avatar.classList.add('tip');
					firstRunAfterMore=false;
				}else{
					if($('#'+id).next() && $('#'+id).next().data('userid')!==fields.userid){
						/*NEW USER*/
						message.classList.add('lastOfUser');
						if(message.nextSibling){
							message.nextSibling.classList.add('diffUser');
							message.nextSibling.firstChild.classList.add('avatar-border');
							message.nextSibling.firstChild.classList.add('tip');
						}
					}else{
						/*SAME USER*/
						//add the rounder top corner style class
						//and remove the same class to the next item on the list, since it's of the same user
						message.classList.add('diffUser');
						if(message.nextSibling){
							message.nextSibling.classList.remove('diffUser');
							message.nextSibling.firstChild.style.backgroundImage='none';
							message.nextSibling.firstChild.classList.remove('avatar-border');
							message.nextSibling.firstChild.classList.remove('tip');
						}

					}
				}
				document.body.scrollTop = document.body.offsetHeight - offsetBottom;
			}

			prevId=id;
			
			if(stick)scrollDown();

			// 
			if(visibly.hidden() && !oldMessages){ 
				message.classList.add('unread');
				unreadCount++;
				Tinycon.setBubble(unreadCount);
				if(notif && Session.get('notificationSoundEnabled') )
					notif.play();
			}

			autoCompleteUsername(fields.username,fields.useravatar);

			if( timetext ){

				timestampli=document.createElement('li');
				timestampli.setAttribute('class','timestamp-text');
				timestampli.innerHTML = timetext;


				//fix avatars and borders
				// 
				//  
				//  
				if( fields.userid === $('#'+id).next().data('userid') ){
					// 
					//because it is the same user
						//restore avatar
						//diffUser
						//and to the current message add lastOfUser
						// 
						// 

					// 

					var avatarElement = $( '#'+ $('#'+id).next().attr('id') +' .avatar' );
					avatarElement.css('background','url(\'' + fields.useravatar + '\')' );
					avatarElement.addClass('tip');
					avatarElement.addClass('avatar-border');

					$( '#'+ $('#'+id).next().attr('id') ).addClass('diffUser');


				}else{

				}
				
				$('.timestamp-text').prev().addClass('lastOfUser');

				$(message).after( $(timestampli) );
				
				imageExp();
			}
		},
		changed: function(id,fields){
			if(fields.deletedAt){
				// 
				var affMessage = $('#'+id+' .text');
				affMessage.html('deleted message');
				affMessage.addClass('deleted');
				return;
			}
			// 
			// 
			//the message that changed, since observeChanges does not provide us the whole message (hack)
			var mfdb = Messages.find({_id:id}).fetch()[0];
			//update other users message
			if( $('#'+id).length ){
				if(fields.text !== undefined)
					$('#'+id+' .text').html( fields.text );
			}
			else 
				if(fields.messageComplete === true){
					//if an element already exists => it's from an other user and he updated it
					//if it does not exist=> an other user OR I finished my message and have to check if the element before #last is mine or not
					if( $('#last') && $('#last').prev() &&  mfdb.userid === $('#last').prev().data('userid')){
						//same
						message = $('<li class="message new-message" id="'+id+'" data-userid="'+mfdb.userid+'"><span class="avatar"><span class="username">'+mfdb.username+'</span></span><span class="text">'+mfdb.text+'</span> <span class="time-hoverer"><span class="time">'+(new Date(mfdb.timestamp)).toLocaleString()+'</span></span> </li>');
					}else{
						//diff
						message = $('<li class="message diffUser new-message" id="'+id+'" data-userid="'+mfdb.userid+'"><span class="avatar avatar-border tip" style="background:url('+mfdb.useravatar+')"><span class="username">'+mfdb.username+'</span></span><span class="text">'+ mfdb.text +'</span> <span class="time-hoverer"><span class="time">'+(new Date(mfdb.timestamp)).toLocaleString()+'</span></span> </li>');
					}					
					$('#last').before(message);
				}
			prevId=id;
			imageExp();
			if(stick)
				scrollDown();
		},
		movedBefore: function(id,before){
			// 
			//kinda works, but only if the moved element has an avatar, else it's moved withouth
			// if(before===null){
			// 	$('#'+id).slideUp(animationDuration, function(){ $(this).insertBefore($('#last')) }).slideDown(animationDuration);
			// }
		},
		removed: function(id){
			// 
			//if the next element in the list has an empty background it means it is from the same user, apply the image from this element (id) to it
			if( $('#'+id).next()[0] !== undefined && $('#'+id).next()[0] !== null &&  $('#'+id).next()[0].id !== 'last'){
				if( $('#'+id).next()[0].querySelector('.username') && $('#'+id + ' .username').html() === $('#'+id).next()[0].querySelector('.username').innerHTML ){
					var bckpBg = $('#'+id)[0].firstChild.style.backgroundImage;
					$('#'+id).next()[0].firstChild.style.backgroundImage=bckpBg;
					$('#'+id).next()[0].firstChild.classList.add('avatar-border');
					$('#'+id).next().addClass('diffUser');
					$('#'+id).next()[0].firstChild.classList.add('tip');
				}else{
					// 
				}
			}
			$('#'+id).remove();
		}
	});
}

Template.messages.rendered=function(){
	
	
	if(!messagesAlreadyRendered){
		// messagesAlreadyRendered=true;
		Meteor.setTimeout(renderMessages,1000);
	}

	// renderMessages();
	if(stick){
		//
		scrollDown();
	}
	$(window).scroll(function (e) {
		if( $(window).scrollTop() < 300 ){
			if(!mSub.loading() && Messages.find().count() < mSub.loaded() ) {
				// 
				$('.loading').removeClass('show-loading');
			}else{
				// 
				
				$('.loading').addClass('show-loading');
			}
		}
		if($(window).scrollTop() + $(window).height()  < $(document).height() - 100){
			stick = false;
		}else{
			stick=true;
		}
	});

	$('.loading').on('click',function(){
		// 
		if(mSub)
			mSub.loadNextPage();
	});


}