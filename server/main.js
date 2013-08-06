Messages.allow({
  insert : function(){return true}
  ,update : function(){return true}
  ,remove : function(){return true}
});
OnlineUsers.allow({
  insert : function(){return true}
  ,update : function(){return true}
  ,remove : function(){return true}
});  

Meteor.publish('MessagesChatroom',function(roomid){
  return Messages.find(
    {
      roomid:roomid
    }
  );
});

Meteor.publish('usersOnlineInThisRoom',function(roomid){
  return OnlineUsers.find(
    {
      roomid:roomid
    }
  );
});


Meteor.methods({
  serverTime : function(){
    return Date.now();
  },
  removeMessagesOfUserInRoom : function(userid,roomid){
    Messages.remove({userid:userid,roomid:roomid}, function(){console.log('messages of user ' + userid + ' removed from room ' + roomid);});
  },
  clog : function(s){
    console.log(s);
  },
  setOnlineUser: function(userid,username,roomid){
    if(!userid || !username || !roomid){
      console.log('null shit ' + userid + ' ' + username + ' ' + roomid);
      return;
    }
    if( OnlineUsers.find( {userid:userid,username:username,roomid:roomid} ).fetch().length === 0 ){
      OnlineUsers.insert(
        {
          userid:userid,
          username:username,
          roomid:roomid
        }
      );
      console.log('setOnlineUser: registering as online [' + username + '](' + userid + ') @ ' + roomid );

    }else{
      console.log('setOnlineUser: already online [' + username + '](' + userid + ') @ ' + roomid );
    }
  },
  setOfflineUser: function(userid,roomid){
    OnlineUsers.remove({userid:userid,roomid:roomid});
    console.log('setOfflineUser: ' + userid + ' @ ' + roomid);
  }
});

Meteor.startup(function () {
  // code to run on server at startup
});

function cleanUpObsoleteOnlineUsers(){
  
}