Template.loginForm.events({
	'click .serviceLogin': function(e,t){
		e.preventDefault();
		if(e.srcElement.classList.contains('twitter') ) {
			Meteor.loginWithTwitter();
		}else
		if(e.srcElement.classList.contains('facebook') ) {
			Meteor.loginWithFacebook();
		}else
		if(e.srcElement.classList.contains('github') ) {
			Meteor.loginWithGithub();
		}else
		if(e.srcElement.classList.contains('google') ) {
			Meteor.loginWithGoogle();
		}
	}
});