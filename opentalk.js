Messages = new Meteor.Collection('Messages');
Rooms = new Meteor.Collection('Rooms');

if (Meteor.isClient) {
  console.log(Meteor.absoluteUrl({rootUrl:'http://opentalk.me'}));

  var lastInsertId=0, //ID of the last inserted message
  text='', //current message text
  t=0, //current timestamp
  mSub, //Message subscription
  rSub=null; //Room subscription

  Template.selectChatRoom.events({
    'keyup #roomID': function(evnt,tmplt){
      var room = tmplt.find('#roomID').value;
      if(room.length){
        Session.set('roomID',tmplt.find('#roomID').value);
        mSub=Meteor.subscribe('MessagesChatroom',Session.get('roomID'));
      }else{
        Session.set('roomID',null);
        if(mSub)
          mSub.stop();
      }
    }
  });

  Template.messagesList.userName = function(){
    return Meteor.user().profile.name;
  };

  function iAmWriting(){
    console.log('liid  ' + Session.get('lastInsertId'));
    if(Session.get('lastInsertId')){
      var m,p=0,
      ml = Messages.find().fetch().length,
      lm = Messages.find().fetch()[ml-1],
      lmid;
      if(lm)
        lmid = lm._id;
      //console.log(lmid);
      if(m=Messages.find({_id:lmid,userID:Meteor.user()._id}).fetch()[0])
        if(m.userID === Meteor.user()._id){
          return true;
        }
      return false;
    }
    return false;    
  }

  Template.messagesList.messages = function(){
    /*
    TODO
      - do not return the last message to the user that is typing it
    */
    var ml = Messages.find({'roomID':Session.get('roomID')}).fetch().length;

    console.log(iAmWriting());
    if(iAmWriting()){
      console.log(ml);
      if(ml <= 1)
        return [];
      return Messages.find(
        {'roomID':Session.get('roomID')}
        ,{sort: {timestamp: 1},limit:ml -1});
    }else
      return Messages.find(
        {'roomID':Session.get('roomID')}
        ,{sort: {timestamp: 1}}
      );  
  };
  Template.messagesList.loggedIn=Template.selectChatRoom.loggedIn=function(){
    if(Meteor.user())
      return true;
    return false;
  };
  Template.messagesList.roomSelected = function(){
    if(Session.get('roomID'))
      return true;
    return false;
  };
  Template.messagesList.events({
    'keyup #mymessage' : function(evnt,tmplt){
      if(Meteor.user()){

        text = tmplt.find('#mymessage').value;
        t = Date.now();

        /*First message/first keystroke being sent*/
        if(!Session.get('lastInsertId') && text.length){
          Session.set(
            'lastInsertId',
            Messages.insert(
              {userID:Meteor.user()._id
              ,username:Meteor.user().profile.name
              ,roomID:Session.get('roomID')
              ,text:text
              ,timestamp:t}
            )
          );
          return;
        }

        if(evnt.keyCode === 13){
          if(text.length){
            //new Message
            /*Session.set(
              'lastInsertId',
              Messages.insert(
                {userId:Meteor.user()._id
                ,username:Meteor.user().profile.name
                ,roomID:Session.get('roomID')
                ,text:'',
                timestamp:t}
              )
            );*/
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
    }
  });

}

if (Meteor.isServer) {


  Messages.allow({
    insert : function(){return true}
    ,update : function(){return true}
    ,remove : function(){return true}
  });

  Meteor.publish('MessagesChatroom',function(roomID){
    return Messages.find(
      {roomID:roomID}
    )
   }
  );

  Meteor.startup(function () {
    // code to run on server at startup
  });
}
