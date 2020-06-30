var currentUserKey = '';
var chatKey = '';
document.addEventListener('keyup', function(key){
	if(key.which === 13)
	{
		SendMessage();
	}
});
//////////////////////////////////////////////////
function StartChat(friendkey, friendname, friendimage)
{
	var friendlist = {friendId:friendkey, userId:currentUserKey};
	var db = firebase.database().ref('friend_list');
	var flag = false;
	db.on('value', function(friends)
	{
		friends.forEach(function(data){
			var user = data.val();
			if((user.friendId===friendlist.friendId && user.userId === friendlist.userId) || (user.userId===friendlist.friendId && user.friendId === friendlist.userId) ){
				flag = true;
				chatKey = data.key;
			}

		});

		if(flag === false)
		{
			chatkey = firebase.database().ref('friend_list').push(friendlist, function(error)
			{
				if(error) alert(error);
				else
				{
					document.getElementById('chatpanel').removeAttribute('style');
					document.getElementById('divStart').setAttribute('style', "display:none");
					hideChatList();
				}
			}).getKey();
		}
		else
		{
			document.getElementById('chatpanel').removeAttribute('style');
			document.getElementById('divStart').setAttribute('style', "display:none");
			hideChatList();
		}

		document.getElementById('closebtn').click();
		document.getElementById('imgChat').src = friendimage;
		document.getElementById("divChatName").innerHTML = friendname;
		document.getElementById('txtMessage').value='';
		document.getElementById('txtMessage').focus();
		document.getElementById('messages').innerHTML = '';

		loadChatMessages(chatKey, friendimage);
	});	
}

function loadChatMessages(chatKey, friendimage)
{
	var db = firebase.database().ref('chatMessages').child(chatKey);
	db.on('value', function(chats){
		var message = '';
		chats.forEach(function(data){
			var chat = data.val();
			var dateTime = chat.dateTime.split(',');
			if(chat.userId !== currentUserKey)
			{
				message += `<div class="row">
							<div class="col-2 col-sm-2 col-md-1">
								<img src="${friendimage}" class="rounded-circle chat-pic">
							</div>
							<div class="col-6 col-sm-7 col-md-7">
								<p class="recieve">${chat.msg}
									<span class="time float-right" title="${dateTime[0]}">${dateTime[1]}</span>
								</p>
							</div>
						</div>`;
			}
			else{
				message += `<div class="row justify-content-end">
							<div class="col-6 col-sm-7 col-md-7">
								<p class="sent float-right">${chat.msg}
									<span class="time float-right" title="${dateTime[0]}">${dateTime[1]}</span>
								</p>
							</div>
							<div class="col-2 col-sm-2 col-md-1">
								<img src="${firebase.auth().currentUser.photoURL}" class="rounded-circle chat-pic">
							</div>
						</div>`;
			}
		});
		document.getElementById('messages').innerHTML = message;
		document.getElementById('messages').scrollTo(0, document.getElementById('messages').clientHeight);	
	});
}

function loadChatList()
{
	var db = firebase.database().ref('friend_list');
	document.getElementById('listChat').innerHTML = `<li class="list-group-item" style="background-color: #f8f8f8">
							<input type="text" placeholder="Search or new chat" class="form-control form-rounded ">
						</li>`;
	db.on('value', function(lists){
		lists.forEach(function(data){
			var lst = data.val();
			var friendkey = '';
			if(lst.friendId === currentUserKey)
			{
				friendkey = lst.userId;
			}
			else if(lst.userId === currentUserKey)
			{
				friendkey = lst.friendId;
			}
			if(friendkey !== "")
			{
				firebase.database().ref('users').child(friendkey).on('value',function(data){
					var user = data.val();
					document.getElementById('listChat').innerHTML += `<li class="list-group-item list-group-item-action" onclick="StartChat('${data.key}','${user.name}', '${user.photoURL}')">
								<div class="row">
									<div class="col-2 col-sm-2 col-md-2 col-lg-2">
										<img src="${user.photoURL}" class="friend-pic rounded-circle">
									</div>
									<div class="col-10 col-sm-10 col-md-10 col-lg-10" style="cursor:pointer;">
										<div class="name">${user.name}</div>
										<div class="under-name">How are you?</div>
									</div>
								</div>
							</li>`;
				});
			}
		});
	});
}

function showChatList()
{
	document.getElementById('side-1').classList.remove('d-none', 'd-md-block');
	document.getElementById('side-2').classList.add('d-none');
}

function hideChatList()
{
	document.getElementById('side-1').classList.add('d-none', 'd-md-block');
	document.getElementById('side-2').classList.remove('d-none');
}


function SendMessage()
{
	var chatMessage = {userId:currentUserKey, msg:document.getElementById('txtMessage').value, dateTime:new Date().toLocaleString()};
	firebase.database().ref('chatMessages').child(chatKey).push(chatMessage, function(error){
		if(error) alert(error);
		else
		{
			document.getElementById('txtMessage').value = '';
			document.getElementById('txtMessage').focus();	
		}
	});
}

function showFriendList()
{
	document.getElementById("listFriend").innerHTML = `<div class="text-center">
														<span class="spinner-border text-warning mt-5" 
														style="width:7rem;height:7rem;"></span>
														</div>`;
		var db = firebase.database().ref('users');
		var lst = '';
		db.on('value', function(users)
		{
			if(users.hasChildren())
			{
				lst = `<li class="list-group-item" style="background-color: #f8f8f8">
							<input type="text" placeholder="Search or new chat" class="form-control form-rounded ">
						</li>`;
			}
			users.forEach(function(data){
				var user = data.val();
				if(user.email !== firebase.auth().currentUser.email)
				{
				   lst += `<li class="list-group-item list-group-item-action" onclick="StartChat('${data.key}', '${user.name}', '${user.photoURL}')">
							<div class="row">
								<div class="col-2 col-sm-2 col-md-2 col-lg-2">
									<img src="${user.photoURL}" class="friend-pic rounded-circle">
								</div>
								<div class="col-10 col-sm-10 col-md-10 col-lg-10" style="cursor:pointer;">
									<div class="name">
									${(user.name).charAt(0).toUpperCase() + (user.name).slice(1)}</div>
								</div>
							</div>
						</li>`;
				}
			});
			document.getElementById("listFriend").innerHTML = lst;
		});
}

///firebase code here

function signin()
{
	var provider = new firebase.auth.GoogleAuthProvider();
	firebase.auth().signInWithPopup(provider);
}

function signOut()
{
	firebase.auth().signOut();
}

function onFirebaseStateChanged()
{
	firebase.auth().onAuthStateChanged(onStateChanged);
}

function onStateChanged(user)
{
	if(user)
	{
		var userProfile = {email: '', name: '', photoURL: ''};
		userProfile.email = firebase.auth().currentUser.email;
		userProfile.name = firebase.auth().currentUser.displayName;
		userProfile.photoURL = firebase.auth().currentUser.photoURL;

		var db = firebase.database().ref('users');
		var flag = false;
		db.on('value', function(users)
		{
			users.forEach(function(data){
				var user = data.val();
				if(user.email === userProfile.email)
				{
					currentUserKey = data.key;
					flag = true;
				}
			});
			if(flag === false)
			{
				firebase.database().ref('users').push(userProfile, callback);
			}
			else
			{
				document.getElementById('imgProfile').src = firebase.auth().currentUser.photoURL;
				document.getElementById('imgProfile').title = firebase.auth().currentUser.displayName;
				document.getElementById('linkSignin').style = 'display:none';
				document.getElementById('linkSignout').style = '';
				document.getElementById('divsignout').style = 'display:block';
				document.getElementById('divsignin').style = 'display:none';
			}
		});

		document.getElementById('newchat').classList.remove('disabled');
		loadChatList();
	}
	else
	{
		document.getElementById('imgProfile').src = 'images/defaultprofile.jpg';
		document.getElementById('imgProfile').title = '';
		document.getElementById('listChat').innerHTML = '';
		document.getElementById('chatpanel').style = 'display:none';
		document.getElementById('divStart').style = 'display:block';
		document.getElementById('linkSignin').style = '';
		document.getElementById('divsignin').style = 'display:block';
		document.getElementById('divsignout').style = 'display:none';
		document.getElementById('linkSignout').style = 'display:none';
		document.getElementById('newchat').classList.add('disabled');
	}
}

function callback(error)
{
	if(error)
	{
		alert(error);
	}
	else
	{
		document.getElementById('imgProfile').src = firebase.auth().currentUser.photoURL;
		document.getElementById('imgProfile').title = firebase.auth().currentUser.displayName;
		document.getElementById('linkSignin').style = 'display:none';
		document.getElementById('linkSignout').style = '';
	}
}

//state change
onFirebaseStateChanged();

