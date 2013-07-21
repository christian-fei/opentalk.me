Messages = new Meteor.Collection('Messages');
if(Meteor.isClient) {
  console.log(Meteor.absoluteUrl({rootUrl:'http://opentalk.me'}));

  Session.set('lastInsertId',null);


  var lastInsertId=0, //ID of the last inserted message
  text='', //current message text
  t=0, //current timestamp
  mSub, //Message subscription
  rSub=null;//Room subscription
  /*
    SET UP ROUTING
  */
  Meteor.Router.add({'/about':'about'});
  Meteor.Router.add({'/*':'messagesList'});

  if(window.location.pathname !== '/'){
    console.log('Routing to ' + window.location.pathname);
    Meteor.Router.to(window.location.pathname);
    subscribeToRoom(window.location.pathname.substring(1));
  }


  /*
    Subscribes the user to a room
      -sets the Session var 'roomID'
      -registers a subscription to 'MessagesChatRoom' in mSub
      -routes to r
  */
  function subscribeToRoom(r){
    if(r.length){
      Session.set('roomID',r);
      mSub=Meteor.subscribe('MessagesChatroom',Session.get('roomID'));
      console.log('subscribed to ' +r)
      Session.set('route','/'+r);
      Meteor.Router.to(Session.get('route'));
    }else{
      Meteor.Router.to('/');
      Session.set('roomID',null);
      if(mSub)
        mSub.stop();
    }
  }

  Template.selectChatRoom.events({
    'click #roomConfirm, keyup #roomID': function(evnt,tmplt){
      if((evnt.type === 'click') || (evnt.type === 'keyup' && evnt.keyCode ===13)) {
        var room = tmplt.find('#roomID').value;
        subscribeToRoom(room);
      }
    }
  });



  

  Template.messagesList.userName=Template.login.userName = function(){
    if(Meteor.user())
      return Meteor.user().profile.name;
    return '';
  };

  function iAmWriting(){
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
  Template.messagesList.loggedIn=Template.selectChatRoom.loggedIn=Template.login.loggedIn=function(){
    if(Meteor.user())
      return true;
    return false;
  };
  Template.messagesList.loggedInWithAccount=Template.selectChatRoom.loggedInWithAccount = function(){
    if(Meteor.user())
      return true;
    return false;
  }
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
