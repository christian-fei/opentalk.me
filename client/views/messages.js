var initialMessageHeight = 0,
	keysPressed = [];


Template.messages.events({
	'keydown #mymessage' : function(evnt,tmplt){
		// console.log('keydown');
		keysPressed[evnt.keyCode] = true;
		// console.log(keysPressed);
	},
	'keyup #mymessage' : function(evnt,tmplt){
		// console.log('keyup');
		
		// console.log(keysPressed);
		// console.log(evnt.keyCode);
		// console.log(evnt.which);

	    text = tmplt.find('#mymessage').value;
	    t= Date.now() + tdiff;
	    allowed = text.length < 500 ? true : false;


	    //remove last \n if any
		text = text.charAt(text.length-1) === '\n' ? text.substring(0,text.length - 1) : text;




    	//remove last /n
    	// text = text.substring(0,text.length);

		if(keysPressed[13] && keysPressed[16]){
			//add a new line and then return
			console.log('shift + enter');
			//TODO:understand if not needed
			// text += '\n';
			keysPressed[evnt.keyCode] = false;
			return;
		}

		keysPressed[evnt.keyCode] = false;
 
    	/*
		working in Chrome 28.0.1500.95
    	*/
    	var mm=$('#mymessage')[0],
    		hackOffset = 0;
    	if(navigator.userAgent.indexOf('Firefox') >=0){
    		hackOffset=36;
    		//console.log('firefox');
    	}
    	if(initialMessageHeight===0)
    		initialMessageHeight = mm.offsetHeight;
    	if(mm.scrollHeight > initialMessageHeight)
	    	mm.style.height = mm.scrollHeight + hackOffset + 'px';
    	
    	// console.log('offsetheight ' + initialMessageHeight);
    	// console.log('scrollheight ' + mm.scrollHeight);
    	// console.log('offsetheight ' + mm.offsetHeight);

    	if(!text.trim().length){
    		removeLastMessage();
    		mm.style.height = initialMessageHeight + 'px';
    		return;
    	}

	    if(!allowed){
	    	//show a notification that I shit on trolls, or just don't give a fuck
	    	console.log('troll');

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
				//console.log('resetting textarea to ' + initialMessageHeight)
				$('#mymessage').val('');

	    	}
    	}
    	setTimeout(function(){
    		scrollDown();
    	},0);
	}
});


Meteor.startup(function(){
	mPagination=null;
});


function renderMessages(){
	if(mPagination)
		mPagination.stop();
	mPagination=Messages.find({},{sort:{timestamp:1}}).observeChanges({
		addedBefore: function(id, fields,before){
			// console.log('added id ' +id + ' before ' + before);
			imageExp();
			//Don't show my message until it's marked as complete..
			if(fields.userid === Meteor.userId() && fields.messageComplete===false)return;
			//hide not yet completed messages to users who don't want to.
			if(!Session.get('realtimeEnabled') && fields.messageComplete===false)return;

			
			message = $('<li class="message new-message" id="'+id+'" data-userid="'+fields.userid+'"><span class="avatar"><b class="username">'+fields.username+'</b></span><div class="text">'+fields.text+'</div></li>');

			if(trolls.indexOf(fields.userid) >=0){
				//hiding because in trolls
				console.log('hiding because in trolls');
				message.hide();
			}

			if(before === null) {
				//first item of first load and recently typed ones
				$('#last').before(message);
				if($('#'+id).prev() && $('#'+id).prev().data('userid')!==fields.userid){
					//A NEW USER
					message.addClass('diffUser');
					message[0].firstChild.style.backgroundImage='url("' + fields.useravatar + '")';
					message[0].firstChild.classList.add('avatar-border');
					message[0].firstChild.classList.add('tip');
					$('#'+id).prev().addClass('lastOfUser');
				}
			}else{
				//stay at the same position
				var offsetBottom = document.body.offsetHeight - document.body.scrollTop;
				$('#'+before).before(message);
				message[0].firstChild.style.backgroundImage='url("'+fields.useravatar+'")';
				if(firstRunAfterMore){
					console.log('firstRunAfterMore');
					message.addClass('lastOfUser');
					message.firstChild.classList.add('avatar-border');
					message.firstChild.classList.add('tip');
					firstRunAfterMore=false;
				}else{
					if($('#'+id).next() && $('#'+id).next().data('userid')!==fields.userid){
						/*NEW USER*/
						message.addClass('lastOfUser');
						if(message.next()[0]){
							message.next().addClass('diffUser');
							message.next()[0].firstChild.classList.add('avatar-border');
							message.next()[0].firstChild.classList.add('tip');
						}
					}else{
						/*SAME USER*/
						//add the rounder top corner style class
						//and remove the same class to the next item on the list, since it's of the same user
						message.addClass('diffUser');
						if(message.next()[0]){
							message.next().removeClass('diffUser');
							message.next()[0].firstChild.style.backgroundImage='none';
							message.next()[0].firstChild.classList.remove('avatar-border');
							message.next()[0].firstChild.classList.remove('tip');
						}

					}
				}
				document.body.scrollTop = document.body.offsetHeight - offsetBottom;
			}

			prevId=id;
			imageExp();
			
			if(stick)scrollDown();

			// console.log('got message when tab was ' + visibly.visibilityState() );
			if(visibly.hidden()){
				message.addClass('unread');
				unreadCount++;
				Tinycon.setBubble(unreadCount);
			}
		},
		changed: function(id,fields){
			// console.log('changed ' + id);
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
					if($('#last').prev() && $('#last') && mfdb.userid === $('#last').prev().data('userid')){
						//same
						message = $('<li class="message new-message" id="'+id+'" data-userid="'+mfdb.userid+'"><span class="avatar"><b class="username">'+mfdb.username+'</b></span><div class="text">'+mfdb.text+'</div></li>');
					}else{
						//diff
						message = $('<li class="message diffUser new-message" id="'+id+'" data-userid="'+mfdb.userid+'"><span class="avatar avatar-border tip" style="background:url('+mfdb.useravatar+')"><b class="username">'+mfdb.username+'</b></span><div class="text">'+ mfdb.text +'</div></li>');
					}					
					$('#last').before(message);
				}
			prevId=id;
			imageExp();
			if(stick)
				scrollDown();
		},
		movedBefore: function(id,before){
			// console.log(id + ' changed position to ' + before);
			//kinda works, but only if the moved element has an avatar, else it's moved withouth
			// if(before===null){
			// 	$('#'+id).slideUp(animationDuration, function(){ $(this).insertBefore($('#last')) }).slideDown(animationDuration);
			// }
		},
		removed: function(id){
			// console.log('removed ' + id);
			//if the next element in the list has an empty background it means it is from the same user, apply the image from this element (id) to it
			if( $('#'+id).next()[0] !== undefined && $('#'+id).next()[0] !== null &&  $('#'+id).next()[0].id !== 'last'){
				if( $('#'+id + ' .username').html() === $('#'+id).next()[0].querySelector('.username').innerHTML ){
					var bckpBg = $('#'+id)[0].firstChild.style.backgroundImage;
					$('#'+id).next()[0].firstChild.style.backgroundImage=bckpBg;
					$('#'+id).next()[0].firstChild.classList.add('avatar-border');
					$('#'+id).next().addClass('diffUser');
					$('#'+id).next()[0].firstChild.classList.add('tip');
				}else{
					// console.log('strange behaviour');
				}
			}
			$('#'+id).remove();
		}
	});
}

Template.messages.rendered=function(){
	// console.log('messages rendered');
	renderMessages();
	if(stick){
		//console.log('scrolling because stick');
		scrollDown();
	}
	$(window).scroll(function (e) {
		if( $(window).scrollTop() < 300 ){
			if(!mSub.loading() && Messages.find().count() < mSub.loaded() ) {
				// console.log('all messages loaded');
				$('.loading').removeClass('show-loading');
			}else{
				// console.log('load more messages');
				
				$('.loading').addClass('show-loading');
			}
		}
		if($(window).scrollTop() + $(window).height()  < $(document).height() - 100){
			stick = false;
		}else{
			stick=true;
		}
	});
}

Meteor.startup(function(){
	$('.loading').on('click',function(){
		console.log('load more clicked');
		if(!mSub.loading()){
			mSub.loadNextPage();
		}
	});
});