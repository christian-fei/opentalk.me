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
  removeMessagesOfUserInRoom : function(userid,roomid){
    Messages.remove({userid:userid,roomid:roomid}, function(){console.log('messages of user ' + userid + ' removed from room ' + roomid);});
  },
  clog : function(s){
    console.log(s);
  },
  removeOnlineUserFromRoom : function(userid,roomid){
    OnlineUsers.remove({userid:userid,roomid:roomid});
  }
});

Meteor.startup(function () {
  // code to run on server at startup
});

function cleanUpObsoleteOnlineUsers(){
  
}