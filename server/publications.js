Meteor.publish('paginatedMessages', function(roomid,limit) {
  return Messages.find({roomid:roomid}, {sort: {timestamp:-1}, limit: limit});
});
Meteor.publish('usersOnlineInThisRoom',function(roomid){
  return OnlineUsers.find(
    {
      roomid:roomid
    }
  );
});
Meteor.publish("userData", function () {
  return Meteor.users.find({_id: this.userId},{});
});
Meteor.publish('roomTags',function(roomid){
  //if there is no such room, create one
  if( Rooms.find({roomid:roomid}).count() === 0  && roomid !== null)
    Rooms.insert({roomid:roomid,tags:[]});
  return Rooms.find({roomid:roomid});
});

Meteor.publish('userLastSeenInRooms', function(roomid) {
  return LastSeenInRoom.find({userid:this.userId,roomid:roomid}, {sort: {timestamp:-1}});
});


function isAdmin(userId){
  return Meteor.users.find({_id:userId,admin:true}).count() === 1;
}

Meteor.publish('OnlineUsersAdmin',function(){
  if( isAdmin(this.userId) )
    return OnlineUsers.find();
  return [];
});
Meteor.publish('MessagesAdmin',function(){
  if( isAdmin(this.userId) )
    return Messages.find({}, {sort: {timestamp:-1}, limit: 250});
  return [];
});
Meteor.publish('UsersAdmin',function(){
  if( isAdmin(this.userId) )
    return Meteor.users.find({}, {sort: {timestamp:-1}, limit: 250});
  return [];
});