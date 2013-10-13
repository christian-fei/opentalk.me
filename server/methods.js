Meteor.methods({

  globalMessagesCount: function(){
    return Messages.find().count();
  },
  globalRoomsCount: function(){
    return Rooms.find().count();
  },
  globalOnlineUsersCount: function(){
    return OnlineUsers.find().count();
  },
  globalRegisteredUsersCount: function(){
    return Meteor.users.find().count();
  },
  calltest:function(arg1){
    console.log(arg1);
    return arg1;
  },
  messagesCount:function(roomid){
    return Messages.find({roomid:roomid}).count();
  },
  serverTime : function(){
    //console.log('requested serverTime');
    return Date.now();
  },
  removeMessagesOfUserInRoom : function(roomid){
    if(Meteor.userId())
      Messages.update(
        {userid:Meteor.userId(),roomid:roomid},
        {$set:
          {deletedAt:Date.now()}
        },
        {multi:true}
      );
      // Messages.remove({userid:userid,roomid:roomid}, function(){console.log('messages of user ' + userid + ' removed from room ' + roomid);});
  },
  removeMessagesOfUser : function(){
    if(Meteor.userId())
      Messages.update(
        {userid:Meteor.userId()},
        {$set:{
          deletedAt:Date.now()}
        },
        {multi:true}
      );
      // Messages.remove({userid:Meteor.userId()}, function(){console.log('messages of user removed ' + userid);});
  },
  clog : function(s){
    console.log(s);
  },
  setUserStatus: function(username,roomid,avatar,status){
    //console.log('t.uid ' + this.userId);
    //console.log('m.u()' + Meteor.userId());
    if(!roomid || !username || !Meteor.userId())
      return;

    var now = Date.now();

    LastSeenInRoom.update(
      {userid:Meteor.userId(),roomid:roomid},
      {$set:{lastSeen:now}},
      {upsert:true} //create the shit if it doesn't already exist
    );

    if(status === 'offline'){
      OnlineUsers.remove({userid:Meteor.userId(),roomid:roomid});
      // console.log('offline ' + userid);
      /*mark all messages as complete*/
      Messages.update(
        {userid:Meteor.userId(),roomid:roomid},
        {$set : {messageComplete:true}},
        {multi:true}
      );

      // console.log(Meteor.userId() + ' logged out from room ' + roomid + ' at ' + Date.now());
      return;
    }
    
    //not already online
    if( OnlineUsers.find( {userid:Meteor.userId(),nickname:username,roomid:roomid} ).fetch().length === 0 ){
      OnlineUsers.insert(
        {
          userid:Meteor.userId(),
          nickname:username,
          roomid:roomid,
          status:status,
          lastSeen:now,
          avatar:avatar
        }
      );
      // console.log('setOnlineUser: registering as online [' + username + '](' + userid + ') @ ' + roomid  + ' with status ' + status);
    }else{
      //already online
      //keep alive
      OnlineUsers.update({userid:Meteor.userId(),roomid:roomid},{$set:{status:'online',lastSeen:now,avatar:avatar}});
      // console.log('keep alive ' + userid + ' in  ' + roomid);
    }
  },
  //not used anymore
  // setUserId: function(userId) {
  //   this.setUserId(userId)
  // },
  getUserStats:function(){
    var ret={};
    ret.messagesCount = Messages.find({userid:Meteor.userId()},{fields:{roomid:true,text:true}}).count();
    var charactersCount=wordsCount=0;
    var mu=Messages.find({userid:Meteor.userId()},{sort:{roomid:-1}}).fetch(),
        i=unreadCount=lastSeenInRoom=0,roomsOcc=[],roomsOccWithStats=[];
    while(m=mu[i++]){
      if(roomsOcc.indexOf(m.roomid) === -1){
        roomsOcc.push(m.roomid);
        unreadCount=0
        if( lastSeenInRoom = LastSeenInRoom.findOne({userid:Meteor.userId(),roomid:m.roomid}) ){
          // console.log(lastSeenInRoom);

          unreadCount = Messages.find({roomid:m.roomid,timestamp: {$gt:lastSeenInRoom.lastSeen}}).count();
        }
        roomsOccWithStats.push({roomid:m.roomid,unreadCount:unreadCount});
      }
      charactersCount+=m.text.length;
      wordsCount+=m.text.trim().replace(/\s+/gi, ' ').split(' ').length;
    }

    if(roomsOcc)
      ret.roomsCount= roomsOcc.length;
    else
      ret.roomsCount= 0;
    ret.charactersCount=charactersCount;
    ret.wordsCount=wordsCount;
    ret.roomsOccWithStats=roomsOccWithStats;
    
    return ret;
  },
  roomsTaggedWith:function(tag){
    if(!tag)return [];
    var regex = new RegExp(tag, "gi");
    return Rooms.find({tags: {$in: [regex] }},{limit: 10}).fetch();
  }
});