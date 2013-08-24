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


/*
USER ENTERS A ROOM

CAUTION:
THE ROOM MUST BEGIN WITH NO SLASH
*/
function joinRoom(r){
	if(isValidRoom(r)) {
	  //console.log('valid path\nrouting to /' + r);
	  Meteor.Router.to('/'+r);
	} else {
	  Meteor.Router.to('/');
	  console.log('invalid path or already root\nrouting to /');
	}
}

Template.selectChatRoom.rendered = function(){
	// $('#roomid').focus();
	$('.blanket').on('click',function(){
		$('#roomid').focus();
	});
}

function isValidRoom(r){
	if(r.match(/^[^#\/>]+$/gi))
	  return true;
	return false;
}