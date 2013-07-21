Messages = new Meteor.Collection('Messages');
if(Meteor.isClient) {
  console.log(Meteor.absoluteUrl({rootUrl:'http://opentalk.me'}));

  /*
    RESET
  */
  Session.set('lastInsertId',null);
  Session.set('roomID',null);


  var lastInsertId=0, //ID of the last inserted message
  text='', //current message text
  t=0, //current timestamp
  mSub, //Message subscription
  rSub=null,//Room subscription
  username='',
  userid=0;
  


  /*
    SET UP ROUTING
  */
  Meteor.Router.add({'/about':'about'});
  Meteor.Router.add({'/*':'messagesList'});

  if(window.location.pathname !== '/'){
    console.log('Routing to ' + window.location.pathname);
    Meteor.Router.to(window.location.pathname);
    subscribeToRoom(window.location.pathname.substring(1));
    Session.set('roomID',window.location.pathname.substring(1));
  }


  /*
    ACCOUNT MANAGEMENT
  */
  Meteor.autorun(function () {
    if (Meteor.userId()) {
      // on login
      username=Meteor.user().profile.name;
      userid=Meteor.user()._id;
      console.log(username + '  ' + userid);
      Session.set('username',username);
    } else {
      // on logout
      username='';
      userid=0;
      Session.set('username',null);
    }
  });

  Template.pickNickname.events({
    'keyup #nickname': function(evnt,tmplt){
      if((evnt.type === 'click') || (evnt.type === 'keyup' && evnt.keyCode ===13)) {
        var nickname = tmplt.find('#nickname').value;
        if(nickname.length && nickname.indexOf(' ') <= 0) {
          username = nickname;
          //TODO: better unique ID
          userid = Date.now();
          console.log(username + '  ' + userid);
          //bind it to the Session to make it reactive
          Session.set('username',username);
        }
      }
    }
  });







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
    'keyup #roomID': function(evnt,tmplt){
      if((evnt.type === 'click') || (evnt.type === 'keyup' && evnt.keyCode ===13)) {
        var room = tmplt.find('#roomID').value;
        subscribeToRoom(room);
      }
    }
  });



  
  /*
    global username, either from accounts or nickname
  */
  Template.messagesList.username=Template.login.username = function(){
    return Session.get('username');
  };

  Template.selectChatRoom.loggedIn=Template.login.loggedIn=function(){
    if(Session.get('username'))
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
    if(Session.get('lastInsertId')){
      var m,p=0,
      ml = Messages.find().fetch().length,
      lm = Messages.find().fetch()[ml-1],
      lmid;
      if(lm)
        lmid = lm._id;
      //console.log(lmid);
      if(m=Messages.find({_id:lmid,userID:userid}).fetch()[0])
        if(m.userID === userid){
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
  Template.messagesList.roomSelected=Template.selectChatRoom.roomSelected= function(){
    console.log('roomID  ' + Session.get('roomID'));
    if(Session.get('roomID'))
      return true;
    return false;
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
              {userID:userid
              ,user:Session.get('username')
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
