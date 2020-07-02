var currentUserKey = '';
var chatKey = '';
document.addEventListener('keyup', function(key){
	if(key.which === 13)
	{
		SendMessage();
	}
});

loadAllEmoji();


function changeSendIcon(control)
{
	if(control.value !== '')
	{
		document.getElementById('audioicon').setAttribute('style','display:none');
		document.getElementById('sendicon').removeAttribute('style');
		document.getElementById('sendicon').setAttribute('style', 'cursor:pointer; font-size:22px;');
	}
	else
	{
		document.getElementById('sendicon').setAttribute('style','display:none');
		document.getElementById('audioicon').removeAttribute('style');
	}
}
//############################################
//Audio Record

let chunks = [];
let recorder;

var timeout;
function record(control)
{
	
	let device = navigator.mediaDevices.getUserMedia({audio:true});
	device.then(stream => {

		if(recorder === undefined)
		{
			recorder = new MediaRecorder(stream);
			recorder.ondataavailable = e => {
				chunks.push(e.data);

				if(recorder.state === 'inactive')
				{
					let blob = new Blob(chunks, {type:'audio/webm'});
					var reader = new FileReader();
					reader.addEventListener('load', function(){
						var chatMessage = {userId:currentUserKey, msg:reader.result, msgType:'audio', dateTime:new Date().toLocaleString()};
						firebase.database().ref('chatMessages').child(chatKey).push(chatMessage, function(error){
							if(error) alert(error);
							else
							{
								document.getElementById('txtMessage').value = '';
								document.getElementById('txtMessage').focus();	
							}
						});

					}, false);

					reader.readAsDataURL(blob);
				}
			}
			recorder.start();
			control.setAttribute('class', 'fa fa-stop fa-2x');
		}
	});

	if(recorder !== undefined)
	{
		if(control.getAttribute('class').indexOf('stop') !== -1)
		{
			recorder.stop();
			control.setAttribute('class', 'fa fa-microphone fa-2x');

		}
		else
		{
			chunks = [];
			recorder.start();
			control.setAttribute('class', 'fa fa-stop fa-2x');
		}
	}
}

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
			var msg = '';
			if(chat.msgType === 'image')
			{
				msg = `<img src='${chat.msg}' class='img-fluid' />`;
			}
			else if(chat.msgType === 'audio')
			{
				msg = `<audio controls><source src='${chat.msg}' type='video/webm' /></audio>`;
			}
			else
			{
				msg = chat.msg;
			}
			if(chat.userId !== currentUserKey)
			{
				message += `<div class="row">
				<div class="col-6 col-sm-7 col-md-7">
				<p class="recieve">${msg}
				<span class="time float-right" title="${dateTime[0]}">${dateTime[1]}</span>
				</p>
				</div>
				</div>`;
			}
			else{
				message += `<div class="row justify-content-end">
				<div class="col-6 col-sm-7 col-md-7">
				<p class="sent float-right">${msg}
				<span class="time float-right" title="${dateTime[0]}">${dateTime[1]}</span>
				</p>
				</div>
				</div>`;
			}
		});
		document.getElementById('messages').innerHTML = message;
		document.getElementById('messages').scrollTo(0, document.getElementById('messages').scrollHeight - document.getElementById('messages').clientHeight);	
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
	var message = document.getElementById('txtMessage').value;
	if(message !== '')
	{
		var chatMessage = {userId:currentUserKey, msg:message, msgType:'normal', dateTime:new Date().toLocaleString()};
		firebase.database().ref('chatMessages').child(chatKey).push(chatMessage, function(error){
			if(error) alert(error);
			else
			{
				document.getElementById('txtMessage').value = '';
				document.getElementById('txtMessage').focus();	
			}
		});
	}
}

//###########################################################
//send images
function chooseImage()
{
	document.getElementById('imagefile').click();
}

function sendImage(event)
{
	var file = event.files[0];
	if(!file.type.match("image.*")){
		alert("Please Choose Image only..");
	}
	else{
		var reader = new FileReader();

		reader.addEventListener('load', function(){
			
			var chatMessage = {userId:currentUserKey, msg:reader.result, msgType:'image', dateTime:new Date().toLocaleString()};
			firebase.database().ref('chatMessages').child(chatKey).push(chatMessage, function(error){
				if(error) alert(error);
				else
				{
					document.getElementById('txtMessage').value = '';
					document.getElementById('txtMessage').focus();	
				}
			});

		}, false);

		if(file)
		{
			reader.readAsDataURL(file);
		}
	}
}

function showUserList()
{
	document.getElementById("listUser").innerHTML = `<div class="text-center">
	<span class="spinner-border text-warning mt-5" 
	style="width:7rem;height:7rem;"></span>
	</div>`;
	var db = firebase.database().ref('users');
	var dbnoti = firebase.database().ref('notifications');
	var lst = '';
	db.on('value', function(users)
	{
		if(users.hasChildren())
		{
			lst = `<li class="list-group-item" style="background-color: #f8f8f8">
			<input type="text" placeholder="Search or new chat" class="form-control form-rounded ">
			</li>`;
			document.getElementById("listUser").innerHTML = lst;
		}
		users.forEach(function(data){
			var user = data.val();
			if(user.email !== firebase.auth().currentUser.email)
			{
				dbnoti.orderByChild('sendTo').equalTo(data.key).on('value', function(noti){

					if(noti.numChildren() > 0 && Object.values(noti.val())[0].sendFrom === currentUserKey)
					{
						lst = `<li class="list-group-item list-group-item-action">
						<div class="row">
						<div class="col-2 col-sm-2 col-md-2 col-lg-2">
						<img src="${user.photoURL}" class="friend-pic rounded-circle">
						</div>
						<div class="col-10 col-sm-10 col-md-10 col-lg-10" style="cursor:pointer;">
						<div class="name">
						${(user.name).charAt(0).toUpperCase() + (user.name).slice(1)}
						<button class="btn btn-sm btn-default float-right"><i class="fa fa-user-plus"></i> Sent</button>
						</div>
						</div>
						</div>
						</li>`;
						document.getElementById("listUser").innerHTML += lst;
					}

					else
					{

						dbnoti.orderByChild('sendFrom').equalTo(data.key).on('value', function(noti){

							if(noti.numChildren() > 0 && Object.values(noti.val())[0].sendTo === currentUserKey)
							{

								lst = `<li class="list-group-item list-group-item-action">
								<div class="row">
								<div class="col-2 col-sm-2 col-md-2 col-lg-2">
								<img src="${user.photoURL}" class="friend-pic rounded-circle">
								</div>
								<div class="col-10 col-sm-10 col-md-10 col-lg-10" style="cursor:pointer;">
								<div class="name">
								${(user.name).charAt(0).toUpperCase() + (user.name).slice(1)}
								<button class="btn btn-sm btn-default float-right">Pending</button>
								</div>
								</div>
								</div>
								</li>`;
								document.getElementById("listUser").innerHTML += lst;

							}
							else
							{
								lst = `<li class="list-group-item list-group-item-action">
								<div class="row">
								<div class="col-2 col-sm-2 col-md-2 col-lg-2">
								<img src="${user.photoURL}" class="friend-pic rounded-circle">
								</div>
								<div class="col-10 col-sm-10 col-md-10 col-lg-10" style="cursor:pointer;">
								<div class="name">
								${(user.name).charAt(0).toUpperCase() + (user.name).slice(1)}
								<button onclick="SendRequest('${data.key}')" class="btn btn-sm btn-primary float-right"><i class="fa fa-user-plus"></i> Sent Request</button>
								</div>
								</div>
								</div>
								</li>`;
								document.getElementById("listUser").innerHTML += lst;
							}
						});

					}
				});
			}
		});

	});
}


///###########################################################
//send request
function SendRequest(key)
{
	var notification = {
		sendTo:key, 
		sendFrom:currentUserKey, 
		name:firebase.auth().currentUser.displayName,
		photo:firebase.auth().currentUser.photoURL,
		dateTime: new Date().toLocaleString(),
		status:"pending"
	};

	firebase.database().ref('notifications').push(notification, function(error){
		if(error) alert(error);
		else{
			showUserList();
		}
	});
}
function NotificationCount()
{
	let db = firebase.database().ref('notifications');
	db.orderByChild('sendTo').equalTo(currentUserKey).on('value', function(noti){
		var notiArray = Object.values(noti.val()).filter(n => n.status === 'pending');
		document.getElementById('notiBell').innerHTML = notiArray.length;
	});
}

function ShowFriendRequest()
{
	document.getElementById("listRequest").innerHTML = `<div class="text-center">
	<span class="spinner-border text-warning mt-5" 
	style="width:7rem;height:7rem;"></span>
	</div>`;
	var dbnoti = firebase.database().ref('notifications');
	var lst = '';
	dbnoti.orderByChild('sendTo').equalTo(currentUserKey).on('value', function(noti){
		if(noti.hasChildren())
		{
			lst = `<li class="list-group-item" style="background-color: #f8f8f8">
			<input type="text" placeholder="Search or new chat" class="form-control form-rounded ">
			</li>`;
		}
		noti.forEach(function(data){
			var notis = data.val();
			if(notis.status === 'pending')
			{
				lst += `<li class="list-group-item list-group-item-action">
				<div class="row">
				<div class="col-2 col-sm-2 col-md-2 col-lg-2">
				<img src="${notis.photo}" class="friend-pic rounded-circle">
				</div>
				<div class="col-10 col-sm-10 col-md-10 col-lg-10" style="cursor:pointer;">
				<div class="name">
				${(notis.name).charAt(0).toUpperCase() + (notis.name).slice(1)}
				<button onclick="Reject('${data.key}')" class="btn btn-sm btn-danger float-right ml-2"><i class="fa fa-user-times"></i> Reject</button>
				<button onclick="Accept('${data.key}')" class="btn btn-sm btn-success float-right"><i class="fa fa-user-check"></i> Accept</button>
				</div>
				</div>
				</div>
				</li>`;
			}
		});		
		document.getElementById("listRequest").innerHTML = lst;			
	});
}


function Reject(key)
{
	var db = firebase.database().ref('notifications').child(key).once('value', function(noti){
		var obj = noti.val();
		obj.status = "reject";
		firebase.database().ref('notifications').child(key).update(obj, function(error){
			if(error) alert(error);
			else
			{
				showFriendList();
			}
		});
	});
}

function Accept(key)
{
	var db = firebase.database().ref('notifications').child(key).once('value', function(noti){
		var obj = noti.val();
		obj.status = "accept";
		firebase.database().ref('notifications').child(key).update(obj, function(error){
			if(error) alert(error);
			else
			{
				var friendlist = {friendId:obj.sendFrom, userId:obj.sendTo};
				firebase.database().ref('friend_list').push(friendlist, function(error){
					if(error) alert(error);
					else
					{
						showFriendList();
					}
				});
			}
		});
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
				lst += `<li class="list-group-item list-group-item-action" data-dismiss="modal" onclick="StartChat('${data.key}', '${user.name}', '${user.photoURL}')">
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


/////#######################################
//emoji panel 

function loadAllEmoji()
{
	var emoji = '';
	for(var i=128512; i<=128566; i++)
	{
		emoji += `<a style="font-size:22px" class='p-2' href="#" onclick="getEmoji(this)">&#${i};</a>`;
	}
	document.getElementById("smiley").innerHTML = emoji;
}

function showEmojiPanel()
{
	document.getElementById("emoji").style="display:block";
}
function hideEmojiPanel()
{
	document.getElementById("emoji").style="display:none";
}
function getEmoji(control)
{
	document.getElementById('txtMessage').value += control.innerHTML;
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
				var name = firebase.auth().currentUser.displayName;
				name = name.charAt(0).toUpperCase() + (name).slice(1);
				document.getElementById('imgProfile').src = firebase.auth().currentUser.photoURL;
				document.getElementById('username').innerHTML = name;
				document.getElementById('linkSignin').style = 'display:none';
				document.getElementById('linkSignout').style = '';
				document.getElementById('divsignout').style = 'display:block';
				document.getElementById('divsignin').style = 'display:none';
				NotificationCount();
			}
		});

		document.getElementById('newchat').classList.remove('disabled');
		loadChatList();
	}
	else
	{
		document.getElementById('imgProfile').src = 'images/defaultprofile.jpg';
		document.getElementById('username').innerHTML ='';
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

