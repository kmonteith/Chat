class User {
	constructor() {
		
	}
}

class Search {
	constructor(action,input,result_holder,chatsObject) {
		this.socket = io();
		this.input = input;
		this.chatsObject = chatsObject;
		this.action = action;
		this.result_holder = result_holder;
		this.returnResults();
		this.searchUsers();
		this.numUsers = 0;
		this.selectedUsers = [] ;
		this.selectedUsersDiv = document.getElementById("selected_users");
		this.newChatInit = document.getElementById("new_chat_init");
		this.chat_init_two = document.getElementById("chat_init_two");
		this.chat_init_one = document.getElementById("chat_init_one");
		this.chatPic = document.getElementById('filePicInput');
		this.picPreview = document.getElementById("picPreview");
		this.group_chat_init = document.getElementById("group_chat_init");
		this.chatName = document.getElementById("chatName");
		this.nameListener();
		this.search("");
		this.joinRoom();
		this.newGroupChatListener();
		this.newChatHandler();
		this.newChat();
		this.filePicListener();
		this.newFriendListener();
		this.finishedListener();
		this.moreFileData();
	}
	searchUsers(query) {
		var t = this;
		this.input.addEventListener("keyup", function() {t.search(this.innerText); });
	}
	search(query) {
		var data = {};
		data['userId'] = getCurrentUserId();
		data['notInclude'] = this.selectedUsers;
		data['query'] = query;
		this.socket.emit(this.action,data);
	}
	reset() {
		this.selectedUsers = [];
		this.numUsers = 0;
		this.selectedUsersDiv.innerHTML = "";
		this.chat_init_one.classList.remove("hidden");
		this.chat_init_two.classList.add("hidden");
		this.searchUsers("");
		this.picPreview.style.backgroundImage = "";
		this.picPreview.querySelector("#people").classList.remove("hidden");
		this.chatName.innerText = "";
		this.chatPic.disabled = false;
		this.chatName.contenteditable = true;
		this.group_chat_init.classList.remove('disabled');
		this.group_chat_init.disabled=false;
	}
	
	returnResults() {
		var t = this;
		this.socket.on('retrieveFriends', (data) => {
			this.result_holder.innerHTML = "";
			if(data.length != 0) {
				for(var i = 0; i < data.length; i++) {
					var result = document.createElement("div");
					var image = "";
					if(data[i]['profile_image'] != null) {
						image = "<div class='col n2 float-left'><div style='background-image: url(/images/"+data[i]['profile_image']+");' class='friend_image'></div></div>";
					} else {
						image = "<div class='col n2 float-left'><div class='friend_image'><i class='material-icons'>people_alt</i></div></div>";
					}
					result.className = "friend_item";
					var name = data[i]['first_name']+" "+data[i]['last_name'];
					result.dataset.name = name;
					result.dataset.userId = data[i]['id'];
					result.innerHTML = image+"<div class='col n10 float-right'><h5 class='friend_name'>"+name+"</h5><p class='friend_info'>"+data[i]['status']+"</p></div>";
					//result.innerText = data[i]['first_name'] + " "+ data[i]['last_name'];
					this.result_holder.appendChild(result);
					result.addEventListener("click", function() {
						this.classList.add("selected");
						this.classList.add("left_offscreen");
						var ele = this;
						setTimeout(function() { ele.classList.add("hidden"); },400);
						t.addToList(this.dataset.userId,this.dataset.name);
						
					});
				}
			} else {
				this.result_holder.innerHTML = '<span class="no_friends"><i class="material-icons">sentiment_dissatisfied</i></br>Sorry you dont have any friends...</span>';
			}
		});
	}
	newGroupChatListener() {
		var t = this;
		this.SelectedFile;
		this.FReader;
		this.Name;
		this.group_chat_init.addEventListener("click", function() {
			if(this.disabled == false) {
				t.chatName.contenteditable = false;
				this.disabled = true;
				this.classList.add("disabled");
				t.chatPic.disabled = true;
				t.SelectedFile = t.chatPic.files[0];
				if(t.SelectedFile != undefined) {
					t.FReader = new FileReader();
					t.Name =  t.SelectedFile.name;
					t.chatNameValue = t.chatName.innerText;
					t.FReader.onload = function(evnt){ t.socket.emit('Upload', { 'Name' : t.Name, Data : evnt.target.result }); }
					t.socket.emit('Start', { 'Name' : t.Name, 'Size' : t.SelectedFile.size });
				} else {
					t.initNewChat(false);
				}
				
				
			}
			
		});
	}
	
	moreFileData() {
		var t = this;
		t.socket.on('MoreData', function (data){
			//UpdateBar(data['Percent']);
			var Place = data['Place'] * 524288; //The Next Blocks Starting Position
			var NewFile; //The Variable that will hold the new Block of Data
			NewFile = t.SelectedFile.slice(Place, Place + Math.min(524288, (t.SelectedFile.size-Place)));
			t.FReader.readAsBinaryString(NewFile);
		}); 
	}
	finishedListener() {
		var t = this;
		this.socket.on('finished', function(data) {
			var data = {};
			data["fileName"] = t.Name;
			data['chatName'] = t.chatNameValue;
			data['userId']= getCurrentUserId();
			data['chatType'] = 'group';
			data['chatName'] = t.chatNameValue;
			data['users'] = t.selectedUsers;
			t.socket.emit("newChat", data);			
		});
	}
	filePicListener() {
		var t = this;
		var SelectedFile;
		var FReader;
		var Name;
		this.chatPic.addEventListener("change", function() {
			t.picPreview.style.backgroundImage = "url("+URL.createObjectURL(this.files[0])+")";
			t.picPreview.querySelector("#people").classList.add("hidden");
		});
	}
	joinRoom() {
		this.socket.emit("joinIdRoom", getCurrentUserId());
	}
	newFriendListener() {
		var t = this;	
		this.socket.on("newFriend",function() {
			console.log("F");
			t.search("");
		});
	}
	nameListener() {
		var t = this;
		this.chatName.addEventListener("keyup", function() {
			if(this.innerText != "") {
				t.group_chat_init.disabled = false;
				t.group_chat_init.classList.remove("disabled");
			} else {
				t.group_chat_init.disabled = true;
				t.group_chat_init.classList.add("disabled");
			}
		});
	}
	
	addToList(userId,name) {
		var t = this;
		this.selectedUsers[this.numUsers] = parseInt(userId);
		this.numUsers++;
		var selectedUser = document.createElement("p");
		selectedUser.className = "selected_user";
		selectedUser.innerText = name;
		var selectedUserCancel = document.createElement("i");
		selectedUserCancel.className = "material-icons";
		selectedUserCancel.dataset.id = userId;
		selectedUserCancel.innerText = "close";
		selectedUser.appendChild(selectedUserCancel);
		this.selectedUsersDiv.appendChild(selectedUser);
		this.newChatInit.classList.remove("disabled");
		selectedUserCancel.addEventListener("click", function() {
			t.removeFromList(this.dataset.id);
			this.parentNode.remove();
		});
	}
	removeFromList(userId) {
		var index = this.selectedUsers.findIndex(x => x == userId);
		this.selectedUsers.splice(index,1);
		this.numUsers--;
		if(this.numUsers == 0) {
			this.newChatInit.classList.add("disabled");
		}
		this.search(this.input.innerText);
	}
	newChat() {
		var t = this;
		this.newChatInit.addEventListener("click", function() {
			if(t.numUsers > 1) {
				t.groupChatWindow();
			} else if(t.numUsers == 1) {
				t.initNewChat(true);
			} else {
				alert("PUT IN A USER BIATCCHHH");
			}
			//t.socket.emit(this.action,data);
		});
	}
	groupChatWindow() {
		//t.initNewChat(false);
		this.chat_init_one.classList.add("hidden");
		this.chat_init_two.classList.remove("hidden");
		
	}
	
	initNewChat(singleChat) {
		var t= this;
		var data ={};
		if(singleChat) {
			data['userId']= getCurrentUserId();
			data['friendId'] = t.selectedUsers[0];
			socket.emit('checkChatExists', data, function (returnResult) { 
				if(!returnResult['exists']) {
					data['chatType'] = 'single';
					data['users'] = t.selectedUsers;
					t.socket.emit('newChat',data);
				} else {
					t.chatsObject.hideContacts();
					t.chatsObject.findChatAndOpen(returnResult['chatId']);
				}
			});
			
		} else {
			data['userId']= getCurrentUserId();
			data['chatType'] = 'group';
			data['chatName'] = t.chatName.innerText;
			data['users'] = t.selectedUsers;
			t.socket.emit('newChat',data);
			t.chatsObject.hideContacts();
		}
	}
	newChatHandler() {
		
		this.socket.on("newChatHandler", (data) => {
			this.chatsObject.updateChats();
			this.chatsObject.hideContacts();
			this.reset();
		});
	}
}


class Chats {
	constructor(chat_window,chat_preview,socket) {
		this.chat_window = chat_window;
		this.notifyInt = null;
		this.chat_preview = chat_preview;
		this.sendBox = new sendBox(this.chat_window);
		this.chats = [];
		this.socket = io();
		this.joinIdRoom();
		this.totalNotifications = 0;
		this.createLoadingHTML();
		this.chat_window_no_chat = document.getElementById("chat_window_no_chat");
		this.newChatButton();
		this.newChatListener();
		
	}
	selectChatReload() {
		var t =this;
		var oldChatId = getCook("activeChat");
		console.log(oldChatId);
		if(oldChatId !="") { 
			t.chat_window_no_chat.classList.add("hidden");
			this.findChatAndOpen(parseInt(oldChatId))
		}
	}
	addNotification() {
		this.totalNotifications++;
		if(this.totalNotifications > 0) { this.startNotify(); }
		else { this.endNotify(); }
	}
	addNotificationAmount(num) {
		this.totalNotifications += num;
		if(this.totalNotifications > 0) { this.startNotify(); }
		else { this.endNotify(); }
	}
	subtractNotificationAmount(num) {
		this.totalNotifications -= num;
		if(this.totalNotifications > 0) { this.startNotify(); }
		else { this.endNotify(); }
	}
	startNotify() {
		var t = this;
		var toggle = false;
		clearInterval(this.notifyInt);
		this.notifyInt = setInterval( function() {
			if(toggle) {
				document.title = "ChatApp";
				toggle = false;
			} else {
				document.title = "("+t.totalNotifications+") ChatApp";
				toggle = true;
			}		
		}, 1000);
		console.log(this.notifyInt);
	}
	endNotify() {
		console.log(this.notifyInt);
		clearInterval(this.notifyInt);
	}
	findChatAndOpen(chatId) {
		for(var i = 0; i < this.chats.length; i++) {
			if(this.chats[i].chatId == chatId) {
				this.chats[i].selectChat();
				console.log("foudn");
			}
		}
		return null;
	}
	joinIdRoom() {
		this.socket.emit("joinIdRoom", getCurrentUserId());
	}
	newChatListener() {
		var t = this;
		this.socket.on("newChatUpdate",function() {
			t.updateChats();
		});
	}
	updateChats() {
		this.chat_preview.innerHTML ="";
		var data = {};
		var t = this;
		data['userId'] = getCook('sess');
		this.socket.emit('getChats', data);
	}
	createChats() {
		var data = {};
		var t = this;
		data['userId'] = getCook('sess');
		this.socket.emit('getChats', data);
		this.socket.on('deliverChats', (data)=> {
			if(data.length == 0) {
				this.chat_holder.innerHTML = "<span class='no_chats_message'>No chats....Sorry you don't have any friends....</span>";
			} else {
				for (var i = 0; i < data.length; i++) { console.log(data[i]); this.chats[i] = new chat(data[i],t.chat_preview,t.chat_window,t); }	
			}
			t.chatClick();
			t.selectChatReload();
		});
	}
	unselectChat() {
		if(this.selectedChat != null) {
			this.selectedChat.unselectChat();
		}
	}
	newChatButton() {
		var t= this;
		var new_chat_button = document.getElementById("new_chat_button");
		this.contacts_panel = document.getElementById("contacts_panel");
		var contact_back_button = contacts_panel.querySelector("#contact_back_bottom");
		var search_users_new_chat = document.getElementById("search_users_new_chat");
		var user_holder = document.getElementById("user_holder");
		var search = new Search("searchFriends",search_users_new_chat,user_holder,this);
		
		new_chat_button.addEventListener("click", function() {
			t.showContacts();
		});
		contact_back_button.addEventListener("click", function() {
			t.hideContacts();
		});
	}
	hideContacts() {
		this.contacts_panel.style.right = "100%";
		this.contacts_panel.style.zIndex = "-1";
	}
	showContacts() {
		this.contacts_panel.style.zIndex = "100";
		this.contacts_panel.style.right = "calc( 100% - "+window.getComputedStyle(this.contacts_panel).getPropertyValue('width')+")";
	}
	createLoadingHTML() {
		this.loading = document.createElement("div");
		this.loading.className = "lds-ellipsis hidden";
		this.loading.innerHTML = '<div></div><div></div><div></div><div></div>';
		this.chat_window.appendChild(this.loading);
	}
	showLoading() {
		this.loading.classList.remove("hidden");
	}
	hideLoading() {
		this.loading.classList.add("hidden");
	}
	findChatById(chatId) {
		for(var i = 0; i < this.chats.length; i++) {
			if(this.chats[i].getId() == chatId) {
				return this.chats[i];
			}
		}
	}
	chatClick() {
		var chats = document.querySelectorAll(".chat");
		var t = this;
		chats.addEventListener("click", function(e) {
			var clickedChat = t.findChatById(this.dataset.chatId);
			if(t.selectedChat!=undefined) { t.selectedChat.hide(); }
			t.unselectChat();
			t.selectedChat = clickedChat;
			t.selectedChat.selectChat();
			//t.chat_window_no_chat.classList.add("hidden");
			//var oldChatId = getCook("activeChat");
			//if(oldChatId != e.currentTarget.dataset.chatId) {
				//var oldChat = document.querySelector('*[data-chat-id="'+oldChatId+'"]');
				//oldChat.classList.remove('selected');
				
			//}
			//t.selectChat();
		});
	}
	
}

class chat {
	constructor(chatData,chat_preview,chat_window,chatObject) {
		this.chatData = chatData;
		this.chatObject = chatObject;
		this.chatId = this.chatData['id'];
		this.chat_window = chat_window;
		this.container = chat_preview;
		this.chatSettings = new chatSettings(this);
		this.createChatHolder();
		this.createPreviewHTML();
		this.searchTimeout;
		this.chatLines = [];
		this.socket = io();
		this.joinRoom();
		this.retrieveMessageListener();
		this.newMessageListener();
		this.typingListener();
		this.createChatTop();
	}
	joinRoom() {
		var data = {};
		data['chatId'] = this.chatId;
		this.socket.emit('joinRoom', data);
	}
	
	notificationSound(send) {
		if(send) {
			var audio = new Audio('/sounds/clearly.mp3');
			audio.play();
		} else {
			var audio = new Audio('/sounds/swoosh.mp3');
			audio.play();
		}
	}
	createChatHolder() {
		this.chat_holder = document.createElement("div");
		this.chat_holder.className = "chat_messages";
		this.chat_holder.style.background = this.chatData['background'];
		this.chat_holder_holder = document.createElement("div");
		this.chat_holder_holder.className = "chat_messages_holder hidden";
		this.user_typing = document.createElement("span");
		this.user_typing.className ="user_typing hidden";
		this.user_typing.id = "user_typing";
		this.user_typing.innerHTML = '<div class="spinner"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div>';
		this.chat_holder_holder.appendChild(this.chat_holder);	
		this.chat_holder_holder.appendChild(this.user_typing);
		this.chat_window.appendChild(this.chat_holder_holder);
	}
	show() {
		this.chat_holder_holder.classList.remove("hidden");
		//getRid of notifications
		this.purgeChatNotifications();
	}
	hide() {
		this.chat_holder_holder.classList.add("hidden");
	}
	getId() {
		return this.chatId;
	}
	purgeChatNotifications() {
		var data = {};
		data['chatId'] = this.chatId;
		data['userId'] = getCurrentUserId();
		console.log(data);
		this.socket.emit("purgeNotifications",data);
		this.chatObject.subtractNotificationAmount(this.notifications);
		this.notifications = 0;
		this.unNotify();
	}
	newMessageListener() {
		var t=this;
		this.socket.on("newMessage", (data) => {
			t.numChats++;
			t.chatLines[t.numChats] = new chatLine(data['message'],data['user'],t.chat_holder,t.socket,t.chatObject,t);
			this.updateChatPreview(data['message']);
			if(parseInt(data['user']['id']) == getCurrentUserId()) {
				t.notificationSound(false);
			} else {
				t.notificationSound(true);
				console.log(t.chatObject.selectedChat);
				if(t.chatObject.selectedChat != t) {
					this.notifications++;
					t.notify();
				} else{ this.purgeChatNotifications();}
			}
		});
	}
	
	updateChatPreview(message) {
		if(message['message'].match(/<img/)) { message['message'] = '<i style="" class="gif_ico material-icons">gif</i>GIF'; }
		this.chatElement.querySelector(".last_time").innerText =  new Date().toLocaleTimeString();
		this.chatElement.querySelector(".last_message").innerHTML = message['message'];
	}
	createPreviewHTML() {
		this.notifications = this.chatData['notifications'];
		this.chatElement = document.createElement("div");
		var lastMessage = [];
		if(this.chatData['lastMessage'].length !=0) {var lastMessage = this.chatData['lastMessage'][0]; }
		else { lastMessage['message'] = "...";	lastMessage['timestamp'] = Date.now();}
		var name = this.chatData['chat_name'];
		var image = "<div class='chat_image'><i class='material-icons'>people_alt</i></div>";
		if(this.chatData['type'] == 'single') {
			
			name = this.chatData['otherUser'][0]['first_name'] + " "+this.chatData['otherUser'][0]['last_name'];
			if(this.chatData['otherUser'][0]['profile_image']) {
				image = "<div style='background-image: url(/images/"+this.chatData['otherUser'][0]['profile_image']+");' class='friend_image'></div>";
			}
		} else {
			
			if(this.chatData['chat_image'] && this.chatData['chat_image'] != 'undefined') {
				image = "<div style='background-image: url(/images/chatImages/"+this.chatData['chat_image']+");' class='friend_image'></div>";
			}
		}
		if(lastMessage['message'].match(/<img/)) {
			lastMessage['message'] = '<i style="" class="gif_ico material-icons">gif</i>GIF';
		}
		this.chatElement.className = "chat";
		this.chatElement.dataset.chatId = this.chatData['id'];
		this.chatElement.innerHTML = "<div style='padding-right: 15px; display:flex;' class='col float-left'>"+image+"</div><div class='col float-right' style='flex:100%;'><h5 class='chat_name'>"+name+"</h5><span class='last_time'>"+new Date(lastMessage['timestamp']).toLocaleString()+"</span><div class='break'></div><p class='last_message'>"+lastMessage['message']+"</p></div><div class='notify_dot hidden'>4</div>";
		this.container.appendChild(this.chatElement);
		this.notify_dot = this.chatElement.querySelector(".notify_dot");
		if(this.notifications > 0) { this.initNotifications();}
	}
	initNotifications() {
		this.notify_dot.innerText = this.notifications;
		this.notify_dot.classList.remove("hidden");
		this.chatObject.addNotificationAmount(this.notifications);
	}
	notify() {
		this.notify_dot.innerText = this.notifications;
		this.notify_dot.classList.remove("hidden");
		this.chatObject.addNotification();	
	}
	unNotify() {
		this.notify_dot.innerText = 0;
		this.notify_dot.classList.add("hidden");
	}
	unselectChat() {
		this.chatElement.classList.remove("selected");
	}
	selectChat() {
		this.chatObject.showLoading();
		this.chatObject.sendBox.show();
		this.chatElement.classList.add("selected");
		document.cookie = "activeChat="+this.chatId+"; /";
		var data = {};
		data['chatId'] = this.chatId;
		data['userId'] = getCurrentUserId();
		this.socket.emit("getChatMessages", data);
		this.chatObject.selectedChat = this;
	}
	retrieveMessageListener() {
		var t = this;
		this.socket.on("retrieveMessages", (data)=> {
			t.chat_holder.innerHTML = "";
			t.chatObject.hideLoading();
			var users = data['chatUsers'];
			var messages = data['messages'];
			for(var i = 0; i < messages.length; i++) {
				var userData = users[users.findIndex(x => x['id'] == messages[i]['userId'])];
				t.chatLines[i] = new chatLine(messages[i],userData,t.chat_holder,t.socket,t.chatObject,t);
			}	
			t.num_chats = i;
			t.show();
			this.chat_holder.scrollTop = this.chat_holder.scrollHeight;
		});
	}
	createChatTop() {
		console.log(this.chatData);
		this.chatTop = document.createElement("div");
		this.chatTop.className = "chat_top";
		this.chatIcon = document.createElement("div");
		this.chatIcon.className = "chat_image";
		var chatName = this.chatData['chat_name'];
		var chatInfo = "";
		if(this.chatData['type'] == 'group') {
			if(this.chatData['chat_image'] == 'undefined' || this.chatData['chat_image'] == null || this.chatData['chat_image'] == "") { this.chatIcon.innerHTML =  "<i class='material-icons'>people_alt</i>"; }
			else { this.chatIcon.style.backgroundImage =  "url(/images/chatImages/"+this.chatData['chat_image']+")"; }
			for(var i = 0; i < this.chatData['otherUser'].length; i++) {
				chatInfo += this.chatData['otherUser'][i]['first_name']+", ";
			}
		} else { 
			if(this.chatData['otherUser'][0]['profile_image'] == null) {
				this.chatIcon.innerHTML =  "<i class='material-icons'>people_alt</i>"; 
			} else {
				this.chatIcon.style.backgroundImage =  "url(/images/"+this.chatData['otherUser'][0]['profile_image']+")";
			}
			chatName = this.chatData['otherUser'][0]['first_name']+ " "+this.chatData['otherUser'][0]['last_name'];
		}
		this.chatInfo = document.createElement("div");
		this.chatInfo.className = "chat_info";
		this.chatInfo.innerHTML = "<h5 style='font-size: 14px; color: grey; padding-bottom: 12px;'>"+chatName+"</h5><p style='font-size: 12px; color: grey;'>"+chatInfo.replace(/(^\s*,)|(,\s*$)/g, '')+"</p>";
		this.chatMore = document.createElement("div");
		this.chatMoreI = document.createElement("i");
		this.chatMoreI.innerText = "more_vert";
		this.chatMoreI.className = "material-icons"
		this.chatMore.appendChild(this.chatMoreI);
		this.chatMore.className = "chat_more";
		this.chatTop.appendChild(this.chatIcon);
		this.chatTop.appendChild(this.chatInfo);
		this.chatTop.appendChild(this.chatMore);
		this.chat_holder_holder.appendChild(this.chatTop);
		this.createChatMore();
	}
	createChatMore() {
		var t = this;
		this.quickMenu = document.createElement("div");
		this.quickMenu.className = "quick_dropdown hiddenSize";
		this.quickMenu.innerHTML = '<ul><li id="settings">Settings</li></ul>';
		this.chatMore.appendChild(this.quickMenu);
		this.chatMoreI.addEventListener("click", function() {
			t.quickMenu.classList.remove("hiddenSize");
		});
		document.body.addEventListener("click", function(e) {
			if(!t.quickMenu.contains(e.target) && !e.target.contains(t.chatMoreI)) {
				t.quickMenu.classList.add("hiddenSize");
			}
		});
	}

	userTyping() {
		var t = this;
		this.socket.on('typingUser', (data) => {
			if(data['typing'] == true) { if(data['userId'] != getCurrentUserId()) { t.user_typing.classList.remove("hidden"); }
			} else { t.user_typing.classList.add("hidden"); }
		});
	}
	typingListener() {
		var t = this;
		var message_input = document.getElementById("message_input");
		this.userTyping();
		message_input.onkeypress = function () {
			var data = {};
			data['chatId'] = t.chatObject.selectedChat.chatId;
			data['userId'] = getCurrentUserId();
			data['typing'] = true;
			if (t.searchTimeout != undefined) clearTimeout(t.searchTimeout);
			t.socket.emit("typing", data);
			t.searchTimeout = setTimeout(function() {
				data['typing'] = false;
				data['userId'] = null;
				t.socket.emit("typing", data);
			}, 1000);
		};
	}
} 

class chatSettings {
	constructor() {
		
	}
}

class chatLine {
	constructor(messageData,userData,container,socket,chatObject,parentChat) {
		this.messageData = messageData;
		this.parentChat = parentChat;
		this.userData = userData;
		this.chatObject = chatObject;
		this.container = container;
		this.chat_line = document.createElement("div");
		this.chat_line_holder = document.createElement("div");
		this.createChatHTML();

	}
	createChatHTML() {
		this.chat_line_holder.className = "chat_line_holder";
		
		if(getCurrentUserId() == this.userData['id']) {
			this.chat_line.innerHTML =this.messageData['message'];
			this.chat_line.className = "chat_line right";
			this.chat_line.style.background = this.parentChat.chatData['colorTwo'];
			this.chat_line.style.color = this.parentChat.chatData['accentTwo'];
		} else {
			var image = "";
			if(this.userData['profile_image'] != null) {
				image = "<div style='background-image: url(/images/"+this.userData['profile_image']+");' class='friend_image'></div>";
			} else {
				image = "<div class='friend_image' style='background:"+this.messageData['colorOne']+"; color:"+this.messageData['accentOne']+"'><i class='material-icons'>people_alt</i></div>";
			}
			this.chat_line.innerHTML ="<p class='chat_line_user_name'>"+this.userData['first_name']+"</p>";
			this.chat_line.innerHTML +=this.messageData['message'];
			this.chat_line.className = "chat_line left";
			this.chat_line.style.background = this.parentChat.chatData['colorOne'];
			this.chat_line.style.color = this.parentChat.chatData['accentOne'];
			this.chat_line_holder.innerHTML += image;
		}
		this.chat_line_holder.appendChild(this.chat_line);
		this.container.appendChild(this.chat_line_holder);
		this.container.scrollTop = this.container.scrollHeight;
	}

}

class sendBox {
	constructor(chat_window) {
		this.chat_window_holder = document.querySelector(".chat_window_holder");
		this.chat_window = document.getElementById("chat_window");
		this.createSendBox();
		this.moreFeatures = document.getElementById("moreFeatures");
		this.message_input = document.getElementById("message_input");
		this.shift = false;
		this.create_gif_box();
		this.moreOpen = false;
		this.handleMessageIputs();
		this.moreFeaturesOpen();
		this.search();
	}
	moreFeaturesOpen() {
		var t= this;
		this.moreFeatures.addEventListener("click", function() {
			if(!t.moreOpen) {
				t.showMore();
			} else {
				t.hideMore();
			}
		});
	}
	hideMore() {
		this.gif_box.classList.add("flexShrink");
		this.send_box.style.height = "63px";
		this.chat_window.style.height = "calc( 100% - 63px )";
		this.moreOpen =false;
	}
	showMore() {
		this.gif_box.classList.remove("flexShrink");
		this.send_box.style.height = "360px";
		this.chat_window.style.height = "calc( 100% - 360px )";
		this.moreOpen = true;
	}
	createSendBox() {
		this.send_box = document.createElement("div");
		this.send_box.id = "send_box";
		this.send_box.className = "send_box hidden col n12";
		this.send_box.innerHTML = '<div style="height: 63px;"><i class="material-icons col n1 moreFeatures" id="moreFeatures">emoji_emotions</i><p contenteditable="true" id="message_input" class="message_input col n10" data-placeholder="Type a message..."></p><i class="material-icons col n1 microphone">mic</i></div>';
		this.chat_window_holder.appendChild(this.send_box);
	}
	show() {
		this.send_box.classList.remove('hidden');
	}
	hide() {
		this.send_box.classList.add('hidden');
	}
	create_gif_box() {
		var t = this;
		this.gif_box = document.createElement("div");
		this.gif_box.className = "gif_box flexShrink";
		this.gif_search = document.createElement("div");
		this.gif_search.contentEditable = "true";
		this.gif_search.className = "gif_search";
		this.gif_search.dataset.placeholder = "Search Gifs";
		this.send_box.appendChild(this.gif_search);
		this.send_box.appendChild(this.gif_box);
		t.defaultGifs();
	}
	defaultGifs() {
		var t = this;
		a.get("https://api.giphy.com/v1/gifs/trending?api_key=OaMemE1asdbPlBwuWFz6ZIYlN5GgfwMk&limit=25&rating=R").then( function(res) {
			res = JSON.parse(res);
			t.images = res.data;
			t.populateGifs();
		});
	}
	search() {
		var t = this;
		this.gif_search.addEventListener("keyup", function() {
			if(this.innerText == "") {
				t.defaultGifs();
			} else {
				a.get("https://api.giphy.com/v1/gifs/search?api_key=OaMemE1asdbPlBwuWFz6ZIYlN5GgfwMk&q="+this.innerText+"&limit=25&offset=0&rating=R&lang=en").then( function(res) {
					res = JSON.parse(res);
					t.images = res.data;
					t.populateGifs();
				});
			}
		});
	}
	populateGifs() {
		var t = this;
		this.gif_box.innerHTML = "";
		for(var i = 0; i < t.images.length; i++) {
			var display = document.createElement("img");
			display.className = 'gif';
			display.src = t.images[i]['images']['fixed_width_downsampled']['url'];
			display.dataset.data = i;
			t.gif_box.appendChild(display);
			display.addEventListener("click", function(e) {
				console.log(t.images[this.dataset.data]);
				t.sendMessage('<img style="height: 250px;" src="'+t.images[this.dataset.data]['images']['downsized_large']['url']+'">');
				t.hideMore();
				t.gif_search.innerText ="";
			});
		}
	}
	handleMessageIputs() {
		var t = this;
		document.addEventListener("keydown", function(e) { if(e.keyCode == 16) { t.shift = true; }});
		document.addEventListener("keyup", function(e) {if(e.keyCode == 16) { t.shift = false; }});
		
		this.message_input.addEventListener("keydown" , function(e) {
			if(t.shift != true && e.keyCode == 13) {
				e.preventDefault();
				if(this.innerText != "") {
					t.sendMessage(this.innerHTML);
					this.innerText = "";
				
				}
			}
			
		});
		replaceEmoji(t.message_input);
		
		
	}
	sendMessage(message) {
		var data = {};
		data['chatId'] = getCook('activeChat');
		data['userId'] = getCurrentUserId();
		data['message'] = message;
		socket.emit("sendMessage", data);
	}
}



class addFriends {
	constructor() {
		this.friendButtonInit = document.getElementById("add_friends");
		this.search = document.getElementById("search_new_friends");
		this.result_holder = document.getElementById("new_friend_holder");
		this.friend_requests = document.getElementById("friend_requests");
		this.friend_panel = document.getElementById("friend_panel");
		this.notifyRing = document.getElementById("notifyRing");
		this.animate = null;
		this.friend_back_button = friend_panel.querySelector("#friend_back_bottom");
		this.socket = io();
		this.count = 0;
		this.createNotify();
		this.joinIdRoom();
		this.addFriendButtonListener();
		this.searchListener();
		this.newFriendRequestListener();
		this.getFriendRequests();
	}
	addFriendButtonListener() {
		var t = this;
		this.friendButtonInit.addEventListener("click", function() {
			t.showFriendPanel();
		});
		this.friend_back_button.addEventListener("click", function() {
			t.hideFriendPanel();
		});
	}
	getFriendRequests() {
		this.friend_request_header = document.createElement("h1");
		this.friend_request_header.className = "header hidden";
		this.friend_request_header.innerText = "Friend Requests";
		this.friend_requests.appendChild(this.friend_request_header);
		var t = this;
		var data = {};
		data['userId'] = getCurrentUserId();
		t.socket.emit('getFriendRequests', data, function(response) {
			if(response.length > 0) {
				t.friendRequestNum = response.length;
				t.startNotifyAnimate();
				t.populateFriendRequests(response);
			}
		});
	}
	
	populateFriendRequests(data) {
		var t = this;
		if(data.length > 0) { this.friend_request_header.classList.remove('hidden'); }
		for(var i = 0; i < data.length; i++) {
			var friendRequest = document.createElement("div");
			friendRequest.className = "friend_request";
			friendRequest.id = "friend_request";
			friendRequest.dataset.frid = data[i]['fid'];
			var image = "";
			if(data[i]['profile_image'] != null) {image = "<div style='background-image: url(/images/"+data[i]['profile_image']+");' class='friend_image'></div>";} 
			else { image = "<div class='friend_image'><i class='material-icons'>people_alt</i></div>"; }
			friendRequest.innerHTML = '<div style="padding-right: 15px; display:flex;" class="col float-left">'+image+'</div><div class="float-left"><h5>'+data[i]['first_name']+' '+data[i]['last_name']+'</h5></div><div class="float-right friend_decide"><i id="approve" data-fid='+data[i]['fid']+' data-friend="'+data[i]['userId']+'" class="material-icons approve">done</i><i id="deny" data-friend="'+data[i]['userId']+'" data-fid='+data[i]['fid']+' class="material-icons deny">close</i></div>';
			t.friend_requests.appendChild(friendRequest);
			var approve = friendRequest.querySelector("#approve");
			var deny = friendRequest.querySelector("#deny");
			approve.addEventListener("click", function() { t.friendRequestResponse(1,this.dataset.fid,this.dataset.friend); });		
			deny.addEventListener("click", function() { t.friendRequestResponse(2,this.dataset.fid,this.dataset.friend); });	
		}
	}
	
	newFriendRequestListener() {
		console.log("E");
		var t =this;
		this.socket.on("newFriendRequest", function() {
			console.log("POP");
			t.getFriendRequests();
			t.startNotifyAnimate();
			
		});
	}
	friendRequestResponse(accept,fid,friend) {
		var t = this;
		var send = {};
		send['fid'] = fid;
		send['accept'] = accept;
		send['userId'] = getCurrentUserId();
		send['friendId'] = friend;
		this.socket.emit("friendRequestResponse",send, function() {
			t.friendRequestNum--;
			if(t.friendRequestNum < 1) { t.clearNotifyAnimate(); t.friend_request_header.classList.add('hidden');}
			var parent = document.querySelector("*[data-frid='"+fid+"']");
			parent.classList.add("left_offscreen");
			setTimeout(function() { parent.classList.add("hidden"); },400);
		});
	}
	
	startNotifyAnimate() {
		var t =this;
		this.friendButtonInit.parentElement.classList.add("notify");
		clearInterval(this.animate);
		this.animate = setInterval( function() {
			t.notifyRing.style.background = "linear-gradient("+t.count+"deg,#2189f4, #ff7979)";
			t.count = t.count +30;
			if(t.count >= 360) { t.count = 0; }
		},400);
	}
	clearNotifyAnimate() {
		this.friendButtonInit.parentElement.classList.remove("notify");
		this.friendButtonInit.parentElement.style.background = "transparent";
		clearInterval(this.animate);
	}
	hideFriendPanel() {
		this.friend_panel.style.right = "100%";
		this.friend_panel.style.zIndex = "-1";
	}
	showFriendPanel() {
		this.friend_panel.style.zIndex = "100";
		this.friend_panel.style.right = "calc( 100% - "+window.getComputedStyle(this.friend_panel).getPropertyValue('width')+")";
	}
	searchListener() {
		var t = this;
		this.search.addEventListener("keydown", function(e) {
			if(e.keyCode == 13 && this.innerText != "") {
				e.preventDefault();
				var data = {};
				data['userId'] = getCurrentUserId();
				data['query'] = this.innerText;
				t.socket.emit('searchNewFriends', data, function(response) {
					t.populateList(response);
				});
			}			
		});
	}
	populateList(data) {
		var t = this;
		this.result_holder.innerHTML = '<h1 class="header">Search Results</h1>';
		if(data.length != 0) {
			for(var i = 0; i < data.length; i++) {
				var result = document.createElement("div");
				var image = "";
				if(data[i]['profile_image'] != null) {
					image = "<div class='col n2 float-left'><div style='background-image: url(/images/"+data[i]['profile_image']+");' class='friend_image'></div></div>";
				} else {
					image = "<div class='col n2 float-left'><div class='friend_image'><i class='material-icons'>people_alt</i></div></div>";
				}
				result.className = "friend_item";
				var name = data[i]['first_name']+" "+data[i]['last_name'];
				result.dataset.name = name;
				result.dataset.userId = data[i]['id'];
				result.innerHTML = image+"<div class='col n10 float-right'><h5 class='friend_name'>"+name+"</h5><p class='friend_info'>"+data[i]['status']+"</p></div>";
				this.result_holder.appendChild(result);
				result.addEventListener("click", function() {
					this.classList.add("selected");
					this.classList.add("left_offscreen");
					var ele = this;
					setTimeout(function() { ele.classList.add("hidden"); },400);
					t.sendFriendRequest(this.dataset.userId);	
				});
			}
		} else {
			this.result_holder.innerHTML += '<span class="no_friends"><i class="material-icons">sentiment_dissatisfied</i></br>Sorry no one matched your search</br> Make sure everything is spelled correctly</span>';
		}
	}
	joinIdRoom() {
		this.socket.emit("joinIdRoom", getCurrentUserId());
	}
	sendFriendRequest(friendId) {
		var data = {};
		var t = this;
		data['userId'] = getCurrentUserId();
		data['friendId'] = friendId;
		this.socket.emit("friendRequest", data, function(result) {
			t.friendRequestNotify();
		});
	}
	createNotify() {
		this.show = document.createElement("div");
		this.show.className = "toast invisible";
		this.show.innerText = "Friend Request Sent!";
		document.body.appendChild(this.show);
	}
	
	friendRequestNotify() {
		var t = this;
		this.show.classList.remove("invisible");
		setTimeout(function() { t.show.classList.add("invisible"); },2000);
	}
}