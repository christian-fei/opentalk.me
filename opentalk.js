Messages = new Meteor.Collection('Messages');


if (Meteor.isClient) {

  var lastInsertId=0,
  text='',
  t=0;

  Session.set('chatRoomId', null)
  console.log(Meteor.user());
  
  /*
  Deps.autorun(function () {
    Meteor.subscribe("MessagesChatroom", Session.get("chatroom"));
  });
  */

  Template.selectChatRoom.events({
    'keyup #chatRoom': function(evnt,tmplt){
      Session.set('chatroom',tmplt.find('#chatRoom').value);
      Meteor.subscribe('MessagesChatroom',Session.get('chatroom'));
    }
  });

  Template.chatWindow.userName = function(){
    return Meteor.user().profile.name;
  }
  Template.chatWindow.messages = function(){
    return Messages.find(
      {'chatRoomId':Session.get('chatroom')}
      ,{sort: {timestamp: 1}}
    );
  };
  Template.chatWindow.enabled = function(){
    if(Meteor.user() && Session.get('chatroom'))
      return true;
    return false;
  }
  Template.chatWindow.events({
    'keyup #mymessage' : function(evnt,tmplt){
      if(Meteor.user()){

        text = tmplt.find('#mymessage').value;
        t = Date.now();

        /*First message (first keystroke) being sent*/
        if(!lastInsertId)
          lastInsertId = Messages.insert(
            {userId:Meteor.user()._id
            ,username:Meteor.user().profile.name
            ,chatRoomId:Session.get('chatroom')
            ,text:text
            ,timestamp:t});

        if(evnt.keyCode === 13){
          if(text.length){
            //new Message
            lastInsertId = Messages.insert(
              {userId:Meteor.user()._id
              ,username:Meteor.user().profile.name
              ,chatRoomId:Session.get('chatroom')
              ,text:'',
              timestamp:t}
            );
            tmplt.find('#mymessage').value = '';
          }
        }else{
          if(text.length){
            Messages.update(
              {_id:''+lastInsertId}
              ,{$set : {
                  text:text
                  ,timestamp:t
                }
              }
            );
          }else{
            Messages.remove({_id:''+lastInsertId});
            lastInsertId=null;
          }
        }
      }
    }
  });

}

if (Meteor.isServer) {
  Messages.allow({
    insert : function(){return true}
    ,update : function(){return true}
    ,remove : function(){return true}
  });

  Meteor.publish('MessagesChatroom',function(chatRoomId){
    return Messages.find(
      {chatRoomId:chatRoomId}
    )
   }
  );

  Meteor.startup(function () {
    // code to run on server at startup
  });
}
