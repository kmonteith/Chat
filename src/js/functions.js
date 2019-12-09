/* class Async {
    async post(url, formData) {
        var promise = new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
			xhr.timeout = 0;
            xhr.open('POST', url);
            xhr.onload = function() {
                if (xhr.status === 200) { resolve(xhr.responseText);
                } else if (xhr.status !== 200) { resolve('Request failed.... ' + xhr.status);
                } else { resolve(xhr.responseText); }
            };
            xhr.send(formData);
        });
        var res = await promise;
        return res;
    }
}


function setText(className,text) {
	var elements = document.getElementsByClassName(className);
	for(var i = 0; i < elements.length; i++){
	   elements[i].innerText = text;
	}
}

function login() {
	var login_button = document.getElementById("login-button");
	var username = document.getElementById("username");
	var password = document.getElementById("password");
	login_button.addEventListener("click", function(e) {
		e.preventDefault();
		setText("error","");
		var data = {};
		data['action'] = 'login';
		data['username'] = username.value;
		data['password'] = password.value;
		if(username.value == "" || password.value == "") {
			document.getElementById('login_error').innerText= "Please Enter all Values";
		} else {
			a.post("#", JSON.stringify(data)).then( function(res) {
				res = JSON.parse(res);
				if(res['success'] == 1) {
					window.location.href = "/user/home.html";
				} else {
					if(res['error'] == 'invalidUsername') { document.getElementById('username_error').innerText = res['errorMessage'];}
					if(res['error']  == 'invalidPassword') { document.getElementById('password_error').innerText = res['errorMessage'];}
					if(res['error']  == 'unknownError') { document.getElementById('login_error').innerText = res['errorMessage'];}
				}
			});
		}
	});
}


function register() {
	var register_button = document.getElementById("register-button");
	var username = document.getElementById("username");
	var password = document.getElementById("password");
	var first_name = document.getElementById("first_name");
	var last_name = document.getElementById("last_name");
	var register_form = document.getElementById("register_form");
	register_button.addEventListener("click", function(e) {
		e.preventDefault();
		setText("error","");
		var data = {};
		data['action'] = 'register';
		data['username'] = username.value;
		data['password'] = password.value;
		data['first_name'] = first_name.value;
		data['last_name'] = last_name.value;
		if(username.value == "" || password.value == "" || first_name.value == "" || last_name.value == "") {
			document.getElementById('register_error').innerText= "Please Enter all Values";
		} else if(!checkPassword(password.value)) {
			document.getElementById('password_error').innerText = "Password must be at least 8 characters long" ;	
		} else {
			a.post("#", JSON.stringify(data)).then( function(res) {
				res = JSON.parse(res);
				if(res['success'] == 1) {
					register_form.innerHTML = "<h1 class='margin-top margin-bottom successRegister'>Successfully Registered!</h1><p class='margin-top margin-bottom successRegisterP'>Please navigate <a href='/login.html'>here</a> to login.";
				} else {
					if(res['error'] == 'duplicateUsername') { document.getElementById('username_error').innerText = res['errorMessage'];}
					if(res['error']  == 'unknownError') { document.getElementById('login_error').innerText = res['errorMessage'];}
				}
			});
		}
	});
}

function getUserInfo(callback) {
	var data = {};
	data['userId'] = getCook('sess');
	socket.emit("getUserInfo", data);
	socket.on("retrieveUserInfo", (data) => {
		callback(data);
	});
}
		
function intializeChats() {
	var chat_holder = document.getElementById("chat_holder");
	var data = {};
	data['userId'] = getCook('sess');
	socket.emit('getChats', data);
	socket.on('deliverChats', (data)=> {
		if(data.length == 0) {
			chat_holder.innerHTML = "<span class='no_chats_message'>No chats....Sorry you don't have any friends....</span>";
		} else {
			for (var i = 0; i < data.length; i++) { 
					var chat = document.createElement("div");
					//var lastMessage = data[i]['lastMessage'][0];
					chat.className = "chat";
					chat.dataset.chatId = data[i]['id'];
					chat.innerHTML = "<div class='col n2 float-left'><div class='chat_image'><i class='material-icons'>people_alt</i></div></div><div class='col n10 float-right'><h5 class='chat_name'>"+data[i]['chat_name']+"</h5><span class='last_time'>message</span><p class='last_message'>?time?</p></div>";

					//chat.innerHTML = "<div class='col n2 float-left'><div class='chat_image'><i class='material-icons'>people_alt</i></div></div><div class='col n10 float-right'><h5 class='chat_name'>"+data[i]['chat_name']+"</h5><span class='last_time'>"+new Date(lastMessage['timestamp']).toLocaleString()+"</span><p class='last_message'>"+lastMessage['message']+"</p></div>";
					chat_holder.appendChild(chat);
			}	
			populate_on_reload();
			retrieveMessageListener();
			chatClick();
			newChatButton();
		}
	});
}
	
function retrieveMessageListener() {
	socket.on("retrieveMessages", (data)=> {
		var users = data['chatUsers'];
		var messages = data['messages'];
		for(var i = 0; i < messages.length; i++) {
			chat_line(chat_window,messages[i],users[users.findIndex(x => x['id'] == messages[i]['userId'])]);
		}
	});
}
	
function handleMessageIputs() {
	var message_input = document.getElementById("message_input");
	var shift = false;
	document.addEventListener("keydown", function(e) { if(e.keyCode == 16) { shift = true; }});
	document.addEventListener("keyup", function(e) {if(e.keyCode == 16) { shift = false; }});
	
	message_input.addEventListener("keydown" , function(e) {
		if(shift != true && e.keyCode == 13) {
			e.preventDefault();
			var data = {};
			data['chatId'] = getCook('activeChat');
			data['userId'] = getCurrentUserId();
			data['message'] = this.innerText;
			socket.emit("sendMessage", data);
			this.innerText = "";
		}
		
	});
	replaceEmoji(message_input);
	
	
}


function populate_on_reload() {
	var chatId = getCook("activeChat");
	if(chatId != "") {
		var chat = document.querySelector('*[data-chat-id="'+chatId+'"]');
		chat.classList.add('selected');
		populate_chat(getCook("activeChat"));
	}
}

function newMessageListener() {
	var chat_window = document.getElementById("chat_window");
	socket.on("newMessage", (data) => {
		chat_line(chat_window,data['message'],data['user'],true);
		updateChatPreview(data['chatId'],data['message']);
		//console.log(getCook('sess'));
		console.log(data['user']['id']);
		if(data['user']['id'] == getCook('sess')) {
			notificationSound(false);
		} else {
			notificationSound(true);
		}
	});
}

function notificationSound(send) {
	if(send) {
		var audio = new Audio('/sounds/notification.mp3');
		audio.play();
	} else {
		var audio = new Audio('/sounds/swoosh.mp3');
		audio.play();
	}
}

function titleNotify() {
	socket.on("notification", (data) => {
		
	});
}

function updateChatPreview(chatId,message) {
	var chat_holder = document.getElementById("chat_holder");
	var chat = document.querySelector('*[data-chat-id="'+chatId+'"]');
	chat.querySelector(".last_time").innerText =  new Date().toLocaleTimeString();
	chat.querySelector(".last_message").innerText = message['message'];
}

function chatClick() {
	var chats = document.querySelectorAll(".chat");
	chats.addEventListener("click", function(e) {
		var oldChatId = getCook("activeChat");
		if(oldChatId != e.currentTarget.dataset.chatId) {
			try {var oldChat = document.querySelector('*[data-chat-id="'+oldChatId+'"]');
				oldChat.classList.remove('selected');
			} catch(e) {}
			this.classList.add("selected");
			var chatId = e.currentTarget.dataset.chatId;
			document.cookie = "activeChat="+chatId+"; /";
			populate_chat(chatId);
		}
	});
}
	
function newChatButton() {
	var new_chat_button = document.getElementById("new_chat_button");
	var contacts_panel = document.getElementById("contacts_panel");
	var contact_back_button = contacts_panel.querySelector("#contact_back_bottom");
	new_chat_button.addEventListener("click", function() {
		contacts_panel.style.left = "0%"
	});
	contact_back_button.addEventListener("click", function() {
		contacts_panel.style.left = "-25%"
	});
}

function populate_chat(chatId) {
	var chat_window_no_chat = document.getElementById("chat_window_no_chat");
	var chat_window = document.getElementById("chat_window");
	var send_box = document.getElementById("send_box");
	chat_window.innerHTML = '<h4 id="chat_window_no_chat" class="chat_window_no_chat display-none">Start a chat?</h4>';
	send_box.classList.remove("display-none");
	var data = {};
	data['chatId'] = chatId;
	data['userId'] = getCook('sess');
	chat_window_no_chat.style.opacity="0";
	socket.emit("getChatMessages", data);
}

function chat_line(chat_window,message,user,newMessage=false) {
	var chat_line = document.createElement("div");
	if(getCurrentUserId() == user['id']) {
		chat_line.innerHTML =message['message'];
		chat_line.className = "chat_line right";
	} else {
		chat_line.innerHTML =message['message'];
		chat_line.className = "chat_line left";
	}
	if(newMessage) {
		chat_line.classList.add("hidden_message");
	}
	chat_window.appendChild(chat_line);
	chat_window.scrollTop = chat_window.scrollHeight;
}

function getCurrentUserId() {
	return getCook('sess');
}

function checkPassword(password) {
	if(password.length < 8) {
		return false;
	} else {
		return true;
	}
}



function notifyMe() {
  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notification");
  }

  // Let's check whether notification permissions have already been granted
  else if (Notification.permission === "granted") {
    // If it's okay let's create a notification
    var notification = new Notification("Hi there!");
  }

  // Otherwise, we need to ask the user for permission
  else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(function (permission) {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
        var notification = new Notification("Hi there!");
      }
    });
  }

  // At last, if the user has denied notifications, and you 
  // want to be respectful there is no need to bother them any more.
}

function replaceEmoji(input) {
	input.addEventListener("keyup" , function() {
			var res = this.innerText.replace("<3", "&#10084;");
			res = res.replace(":)", "&#128522;");
			res = res.replace(";)", "&#128521;");
			res = res.replace(":P", "&#128539;");
			res = res.replace(";P", "&#128540;");
			res = res.replace(":D", "&#128512;");
			res = res.replace(":|", "&#128528;");
			
			this.innerHTML = res;
			placeCaretAtEnd(this);
	});
}

function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection != "undefined"
            && typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
    }
}

Element.prototype.addEventListeners = function(events, funct) {
    var eventArray = events.split(" ");
    for (var i = 0; i < eventArray.length; i++) { this.addEventListener(eventArray[i], funct); }
};
NodeList.prototype.addEventListener = function(events, funct) {
	for(var i = 0; i < this.length; i++) {
		var eventArray = events.split(" ");
		for (var ii = 0; ii < eventArray.length; ii++) { this[i].addEventListener(eventArray[ii], funct); }
	}
};
Array.prototype.addEventListener = function(events, funct) {
	for(var i = 0; i < this.length; i++) {
		if(isNode(this[i]) || isElement(this[i])) {
			var eventArray = events.split(" ");
			for (var ii = 0; ii < eventArray.length; ii++) { this[i].addEventListener(eventArray[ii], funct); }
		}
	}
	
};
function getCook(cookiename) {
  var cookiestring=RegExp(""+cookiename+"[^;]+").exec(document.cookie);
  return decodeURIComponent(!!cookiestring ? cookiestring.toString().replace(/^[^=]+./,"") : "");
} */
function setText(className,text) {
	var elements = document.getElementsByClassName(className);
	for(var i = 0; i < elements.length; i++){
	   elements[i].innerText = text;
	}
}

function login() {
	var login_button = document.getElementById("login-button");
	var username = document.getElementById("username");
	var password = document.getElementById("password");
	login_button.addEventListener("click", function(e) {
		e.preventDefault();
		setText("error","");
		var data = {};
		data['action'] = 'login';
		data['username'] = username.value;
		data['password'] = password.value;
		if(username.value == "" || password.value == "") {
			document.getElementById('login_error').innerText= "Please Enter all Values";
		} else {
			a.post("#", JSON.stringify(data)).then( function(res) {
				res = JSON.parse(res);
				if(res['success'] == 1) {
					window.location.href = "/user/home.html";
				} else {
					if(res['error'] == 'invalidUsername') { document.getElementById('username_error').innerText = res['errorMessage'];}
					if(res['error']  == 'invalidPassword') { document.getElementById('password_error').innerText = res['errorMessage'];}
					if(res['error']  == 'unknownError') { document.getElementById('login_error').innerText = res['errorMessage'];}
				}
			});
		}
	});
}


function register() {
	var register_button = document.getElementById("register-button");
	var username = document.getElementById("username");
	var password = document.getElementById("password");
	var first_name = document.getElementById("first_name");
	var last_name = document.getElementById("last_name");
	var phone = document.getElementById("phone");
	var email = document.getElementById("email");
	var register_form = document.getElementById("register_form");
	register_button.addEventListener("click", function(e) {
		if(email.checkValidity() != false) {
			e.preventDefault();
			setText("error","");
			var data = {};
			data['action'] = 'register';
			data['username'] = username.value;
			data['password'] = password.value;
			data['first_name'] = first_name.value;
			data['last_name'] = last_name.value;
			data['phone'] = phone.dataset.value;
			data['email'] = email.value;
			if(username.value == "" || password.value == "" || first_name.value == "" || last_name.value == "" || phone.dataset.value.length != 10 || email.value == "") {
				document.getElementById('register_error').innerText= "Please Enter all Values";
			} else if(!checkPassword(password.value)) {
				document.getElementById('password_error').innerText = "Password must be at least 8 characters long" ;	
			} else {
				a.post("#", JSON.stringify(data)).then( function(res) {
					res = JSON.parse(res);
					if(res['success'] == 1) {
						register_form.innerHTML = "<h1 class='margin-top margin-bottom successRegister'>Successfully Registered!</h1><p class='margin-top margin-bottom successRegisterP'>Please navigate <a href='/login.html'>here</a> to login.";
					} else {
						if(res['error'] == 'duplicateUsername') { document.getElementById('username_error').innerText = res['errorMessage'];}
						if(res['error']  == 'unknownError') { document.getElementById('register_error').innerText = res['errorMessage'];}
					}
				});
			}
		}
	});
}

function getUserInfo(callback) {
	var data = {};
	data['userId'] = getCook('sess');
	socket.emit("getUserInfo", data);
	socket.on("retrieveUserInfo", (data) => {
		callback(data);
	});
}
		

function populate_on_reload() {
	var chatId = getCook("activeChat");
	if(chatId != "") {
		var chat = document.querySelector('*[data-chat-id="'+chatId+'"]');
		chat.classList.add('selected');
		populate_chat(getCook("activeChat"));
	}
}



function titleNotify() {
	socket.on("notification", (data) => {
		
	});
}

function updateChatPreview(chatId,message) {
	console.log(chatId);
	var chat_holder = document.getElementById("chat_holder");
	var chat = document.querySelector('*[data-chat-id="'+chatId+'"]');
	chat.querySelector(".last_time").innerText =  new Date().toLocaleTimeString();
	chat.querySelector(".last_message").innerText = message['message'];
}


function getCurrentUserId() {
	return getCook('sess');
}

function checkPassword(password) {
	if(password.length < 8) {
		return false;
	} else {
		return true;
	}
}



function notifyMe() {
  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notification");
  }

  // Let's check whether notification permissions have already been granted
  else if (Notification.permission === "granted") {
    // If it's okay let's create a notification
    var notification = new Notification("Hi there!");
  }

  // Otherwise, we need to ask the user for permission
  else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(function (permission) {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
        var notification = new Notification("Hi there!");
      }
    });
  }

  // At last, if the user has denied notifications, and you 
  // want to be respectful there is no need to bother them any more.
}

function replaceEmoji(input) {
	input.addEventListener("keyup" , function() {
			var res = this.innerText.replace("<3", "&#10084;");
			res = res.replace(":)", "&#128522;");
			res = res.replace(";)", "&#128521;");
			res = res.replace(":P", "&#128539;");
			res = res.replace(";P", "&#128540;");
			res = res.replace(":D", "&#128512;");
			res = res.replace(":|", "&#128528;");
			
			this.innerHTML = res;
			placeCaretAtEnd(this);
	});
}

function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection != "undefined"
            && typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
    }
}

Element.prototype.addEventListeners = function(events, funct) {
    var eventArray = events.split(" ");
    for (var i = 0; i < eventArray.length; i++) { this.addEventListener(eventArray[i], funct); }
};
NodeList.prototype.addEventListener = function(events, funct) {
	for(var i = 0; i < this.length; i++) {
		var eventArray = events.split(" ");
		for (var ii = 0; ii < eventArray.length; ii++) { this[i].addEventListener(eventArray[ii], funct); }
	}
};
Array.prototype.addEventListener = function(events, funct) {
	for(var i = 0; i < this.length; i++) {
		if(isNode(this[i]) || isElement(this[i])) {
			var eventArray = events.split(" ");
			for (var ii = 0; ii < eventArray.length; ii++) { this[i].addEventListener(eventArray[ii], funct); }
		}
	}
	
};
function logout() {
	deleteCook("sess");
	deleteCook("activeChat");
	location.reload();
}

function deleteCook( name ) {
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function getCook(cookiename) {
  var cookiestring=RegExp(""+cookiename+"[^;]+").exec(document.cookie);
  return decodeURIComponent(!!cookiestring ? cookiestring.toString().replace(/^[^=]+./,"") : "");
}

function quickDropDown() {
	var quick_dropdown = document.getElementById("quick_dropdown");
	quick_dropdown.classList.remove("hiddenSize");
	setTimeout(function() { document.body.addEventListener("click", hideQuickdropdown) }, 10);
}

function hideQuickdropdown(e) {
	//if(e.target.id == "quick_dropdown);
	var quick_dropdown = document.getElementById("quick_dropdown");
	quick_dropdown.classList.add("hiddenSize");
	document.body.removeEventListener("click",hideQuickdropdown);
}

