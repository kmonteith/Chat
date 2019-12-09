const http = require("http");
var fs = require('fs');
var url = require('url');
const qs = require('querystring');
var cookie = require('cookie');
var path = require('path')
var fileExtension = require('file-extension');
var mysql = require('mysql');
var passwordHash = require('password-hash');


var Files = {};
var SqlString = require('sqlstring');

//mysql connection
var con = mysql.createConnection({
  host: "localhost",
  user: "admins",
  password: "Drakie1!",
  database: "chat",
  multipleStatements: true
});

const server = http.createServer(function (req, res) {
	if (req.method === 'POST') {
		handlePOST(req,res);
	} else {
		requestHandler(req,res);
	}
}).listen(80);

//sockets
const io = require('socket.io')(server);

io.on('connection', client => { 
	//retrieve Chats
	client.on('getChats', (data) => {
		var counter = 0;
		var sql = "SELECT * FROM `chat_participants` WHERE `userId` = "+SqlString.escape(data['userId'])+"";
		con.connect(function(err) {
			con.query(sql, function (err,results) { 
				if(results.length == 0) {  } 
				else {
					var list = "";
					for(var i = 0; i < results.length; i++) {list += results[i]['chatId']+",";}
					list = list.replace(/,\s*$/, "");
					var sql = "SELECT * FROM `chats` WHERE `id` IN ("+list+")";
					con.query(sql, function (err,result) {
						var result = JSON.parse(JSON.stringify(result));
							for(var ii = 0; ii < result.length; ii++) {			
									var sqlLastChat = "SELECT * FROM `chat_messages` WHERE `chatId` = '"+result[ii]['id']+"' ORDER BY `timestamp` DESC LIMIT 1;SELECT * FROM `chat_participants` INNER JOIN `users` ON chat_participants.userId = users.id AND chat_participants.chatId = '"+result[ii]['id']+"' AND chat_participants.userId != '"+data['userId']+"';SELECT * FROM `notifications` WHERE `chatId` = '"+result[ii]['id']+"' && `userId` = '"+data['userId']+"' AND `seen` = '0';";							
									con.query(sqlLastChat, function (err,resultLastChat) {
										result[counter]['lastMessage'] = resultLastChat[0];
										result[counter]['otherUser'] = resultLastChat[1];
										result[counter]['notifications'] = resultLastChat[2].length
										counter++;
										if(counter == result.length) {
											console.log(result);
											client.emit("deliverChats",result);
										}
									});
								
							}
					});
					
				}
			});
		});
	});
	client.on('joinRoom', (data) => {
		client.join(data['chatId'],function() {
		});
	});
	client.on('searchFriends', (data) => {
		var userList = [];
		console.log(data);
		if(data['notInclude'].length != 0) {
			var sql = "SELECT * FROM `friendships` INNER JOIN `users` ON friendships.friendId = users.id AND friendships.userId = '"+data['userId']+"' AND (`first_name` LIKE '%"+data['query']+"%' OR `last_name` LIKE '%"+data['query']+"%') AND users.id NOT IN ("+data['notInclude'].toString()+")";
		} else {
			var sql = "SELECT * FROM `friendships` INNER JOIN `users` ON friendships.friendId = users.id AND friendships.userId = '"+data['userId']+"' AND (`first_name` LIKE '%"+data['query']+"%' OR `last_name` LIKE '%"+data['query']+"%')";

		}
		console.log(sql);
		con.connect(function(err) {
			con.query(sql, function (err,results) { client.emit('retrieveFriends',results); });	
		});
	});
	
	client.on('searchNewFriends', (data, callback) => {
		var userList = [];
		var sql = "SELECT * FROM `users` WHERE `email` = '"+data['query']+"' OR `phone` = '"+data['query']+"';";
		con.connect(function(err) {
			con.query(sql, function (err,results) { 
				if(results.length == 0) { callback([]); } else {
					var sqlCheck = "SELECT * FROM `friendships` WHERE `friendId` = '"+results[0]['id']+"' AND `userId` = '"+data['userId']+"'; SELECT * FROM `friend_requests` WHERE `userId` = '"+data['userId']+"' AND `friendId` = '"+results[0]['id']+"'";
					console.log(sqlCheck);
					con.query(sqlCheck, function (err,checkResults) { 
						var sum = checkResults[0].length + checkResults[1].length;
						if(sum == 0) { callback(results); } else { callback([]); }
					});
				}
			});	
		});
	});
	
	client.on("getFriendRequests", (data,callback) => {
		var sql = "SELECT * FROM `friend_requests` INNER jOIN `users` ON users.id = friend_requests.userId AND `friendId` = '"+data['userId']+"' AND friend_requests.accepted = '0'";
		con.connect(function(err) {
			con.query(sql, function (err,results) { callback(results); });	
		});
	});
	
	client.on("friendRequestResponse", (data,callback) => {
		if(data['accept'] == 1) {
			var sql = "UPDATE `friend_requests` SET `accepted` = '"+data['accept']+"' WHERE `fid` = '"+data['fid']+"'; INSERT INTO `friendships` (`userId`,`friendId`) VALUES ('"+data['friendId']+"','"+data['userId']+"'); INSERT INTO `friendships` (`userId`,`friendId`) VALUES ('"+data['userId']+"','"+data['friendId']+"')";
		} else {
			var sql = "UPDATE `friend_requests` SET `accepted` = '"+data['accept']+"' WHERE `fid` = '"+data['fid']+"';";
		}
		con.connect(function(err) {
			con.query(sql, function (err,resultUsers) { 
				if(data['accept'] == 1) {
					io.to(data['userId']).emit("newFriend");
					io.to(data['friendId']).emit("newFriend");
				}
				callback(); 
			});
		});
	});
	
	client.on("friendRequest", (data,callback) => {
		var sql = "INSERT INTO `friend_requests` (`userId`, `friendId`) VALUES ('"+data['userId']+"','"+data['friendId']+"')";
		con.connect(function(err) {
			con.query(sql, function (err,results) {
				console.log(data['friendId']);
				io.to(data['friendId']).emit("newFriendRequest");
				callback(err); });	
		});
	});
	
	client.on('getUserInfo', (data)=> {
		var sql = "SELECT * FROM `users` WHERE `id` = '"+data['userId']+"'";
		con.connect(function(err) {
			con.query(sql, function (err,results) { 
				client.emit("retrieveUserInfo", results[0]);
			});
		});
	});
	
	client.on('getChatMessages', (data)=> {
		var response = {};
		var sql = "SELECT * FROM `chat_messages` WHERE `chatId` = '"+data['chatId']+"'";
		var sqlUsers = "SELECT * FROM `chat_participants` INNER JOIN `users` ON users.id = chat_participants.userId AND `chatId` = '"+data['chatId']+"'";
		con.connect(function(err) {
			con.query(sql, function (err,results) { 
				response['messages'] = results;
				con.query(sqlUsers, function (err,resultsUsers) { 
						response['chatUsers'] = resultsUsers;
						client.emit("retrieveMessages", response);
					
				});
				
			});
		});
	});
	client.on('typing', (data) => {
		var response = {};
		if(data['typing']) {
			response['userId'] = data['userId'];
			response['typing'] = true;
			io.to(data['chatId']).emit("typingUser", response);
		} else {
			response['typing'] = false;
			io.to(data['chatId']).emit("typingUser",response);
		}
		
	});
	
	client.on('purgeNotifications', (data) => {
		
		var sql = "UPDATE `notifications` SET `seen` = '1' WHERE `userId` = '"+data['userId']+"' AND `chatId` = '"+data['chatId']+"';";
		console.log(sql);
		con.connect(function(err) {
			con.query(sql, function (err,resultUsers) { 
				console.log(err);
			
			});
		});
	});
	
	client.on('sendMessage', (data) => {
		var sql = "SET NAMES utf8mb4;INSERT INTO `chat_messages` (`chatId`,`userId`,`message`) VALUES ('"+data['chatId']+"','"+data['userId']+"',"+SqlString.escape(data['message'])+"); ";
		var sqlUsers = "SELECT * FROM `chat_participants` WHERE `chatId` = '"+data['chatId']+"'";
		var response = {};
		con.connect(function(err) {
			con.query(sqlUsers, function (err,resultUsers) { 
				var sqlNotify = "INSERT INTO `notifications` (`userId`,`chatId`) VALUES ?";
				var values = [];
				for(var i = 0; i < resultUsers.length; i++) { values[i] = [resultUsers[i]['userId'],data['chatId']]; }
				console.log(values);
				con.query(sqlNotify, [values], function(err) { });
				con.query(sql, function (err,results) { 
				var sqlUser = "SELECT * FROM `users` WHERE `id` = '"+data['userId']+"'";
					con.query(sqlUser, function (err,results) { 
						response['user'] = results[0];
						response['message'] = data;
						response['chatId'] = data['chatId'];
						io.to(data['chatId']).emit('newMessage',response);
					});
				});
			});
			
			
		});
	});
	client.on('checkChatExists', (data,fn) => {		
		checkSingleChat(data['userId'],data['friendId'], function(exists) {
			fn(exists);
		});
	});
	client.on("joinIdRoom", (data) => {
		client.join(data,function() {
			console.log("Socket now in rooms", client.rooms);
		});
		
	});
	
	client.on('Start', function (data) { //data contains the variables that we passed through in the html file;
        var Name = data['Name'];
        Files[Name] = {  FileSize : data['Size'],Data     : "",Downloaded : 0 }
        var Place = 0;
        try{
            var Stat = fs.statSync('/server/chat/images/chatImages/' +  Name);
            if(Stat.isFile()) {
                Files[Name]['Downloaded'] = Stat.size;
                Place = Stat.size / 524288;
            }
        }
        catch(er){} //It's a New File
        fs.open("/server/chat/images/chatImages/" + Name, "a", 0755, function(err, fd){
            if(err) { console.log(err); }
            else {
                Files[Name]['Handler'] = fd; //We store the file handler so we can write to it later
                client.emit('MoreData', { 'Place' : Place, Percent : 0 });
            }
        });
	});

	client.on('Upload', function (data){			
			var Name = data['Name'];
			Files[Name]['Downloaded'] += data['Data'].length;
			Files[Name]['Data'] += data['Data'];
			if(Files[Name]['Downloaded'] == Files[Name]['FileSize']) {
				fs.write(Files[Name]['Handler'], Files[Name]['Data'], null, 'Binary', function(err, Writen){ client.emit('finished'); });				
			}
			else if(Files[Name]['Data'].length > 10485760){ //If the Data Buffer reaches 10MB
				fs.write(Files[Name]['Handler'], Files[Name]['Data'], null, 'Binary', function(err, Writen){
					Files[Name]['Data'] = ""; //Reset The Buffer
					var Place = Files[Name]['Downloaded'] / 524288;
					var Percent = (Files[Name]['Downloaded'] / Files[Name]['FileSize']) * 100;
					client.emit('MoreData', { 'Place' : Place, 'Percent' :  Percent});
				});
			}
			else {
				var Place = Files[Name]['Downloaded'] / 524288;
				var Percent = (Files[Name]['Downloaded'] / Files[Name]['FileSize']) * 100;
				client.emit('MoreData', { 'Place' : Place, 'Percent' :  Percent});
			}
			
			
	});
	
	client.on('updateSettings', (data) => { 
		var sql = "UPDATE `users` SET `"+data['name']+"` = '"+data['value']+"' WHERE `id` = '"+data['userId']+"'";
		con.connect(function(err) {
			con.query(sql, function (err,results) { console.log(err); });
		});
	});
	
	client.on('getSettings', (data,callback) => {
		var sql = "SELECT * FROM `users` WHERE `id` = '"+data['userId']+"'";
		con.connect(function(err) {
			con.query(sql, function (err,result) { 
				var res = {};
				res['dark'] = result[0]['dark'];
				callback(res);
			});
		});
	});
	
	client.on('newChat', (data) => {
		var users = data['users'];
		if(data['chatType']=='single') {
			var sql = "INSERT INTO `chats` (`ownerId`,`chat_name`,`type`) VALUES ('"+data['userId']+"','single','"+data['chatType']+"')";
		} else {
			var sql = "INSERT INTO `chats` (`ownerId`,`chat_name`,`type`,`chat_image`) VALUES ('"+data['userId']+"','"+data['chatName']+"','"+data['chatType']+"','"+data['fileName']+"')";
		}
		console.log(sql);
		con.connect(function(err) {
			con.query(sql, function (err,results) { 
				console.log(err);
				var chatId = results.insertId;
				var sqlParticipants = "INSERT INTO `chat_participants` (`chatId`,`userId`) VALUES ?";
				var values = [];
				values[0] = [chatId,data['userId']];
				for(var i = 0; i < users.length; i++) { values[i+1] = [chatId,users[i]]; }
				console.log(values);
				con.query(sqlParticipants, [values], function(err) {
						console.log(err);
					for(var i = 0; i < users.length; i++) {
						io.to(users[i]).emit("newChatUpdate");
					}
					
					client.emit('newChatHandler',"Uhoh");
					if (err) throw err;
				});
			}); 
		});
	});
});



function checkSingleChat(userId, friendId, callback) {
	var returnResult = {};
	console.log(friendId);
	var sql = "SELECT * FROM `chats` WHERE `type` = 'single' AND (`ownerId` = '"+userId+"')";
	con.connect(function(err) {
		con.query(sql, function (err,results) { 
			if(results.length == 0 ) { returnResult['exists'] = false; callback(returnResult);}
			else {
				var values = [];
				for(var i = 0; i < results.length; i++) {values[i] = results[i]['id']; }
				var sqlParticipants = "SELECT * FROM `chat_participants` WHERE `userId` = '"+friendId+"' AND `chatId` IN ("+values.toString()+")";
				con.query(sqlParticipants, function(err,resultsParticipants) {
					if(resultsParticipants.length >= 1) { returnResult['exists'] = true; returnResult['chatId'] = resultsParticipants[0]['chatId']; callback(returnResult);} else { returnResult['exists'] = false; callback(returnResult);}
				});
			}
		});
	});
}

function handlePOST(req,res) {
	let data= '';
    req.on('data', chunk => {
        data += chunk.toString();
    });
    req.on('end', () => {
		data = JSON.parse(data);
		switch(data.action) {
			case 'login':
				login(data.username,data.password,res);
				break;
			case 'register':
				register(data,res);
				break;
			default:
				res.end('ok');
				break;
			
		}
        
    });	
}

function requestHandler(req,res) {
	var q = url.parse(req.url, true);
	var filename = q.pathname;
	var fileType = null;
	var cookies = cookie.parse(req.headers.cookie || '');
	
	//redirect to index
	if(filename == '/') { filename = 'login.html'; }
	
	//remove leading slash
	filename = filename.replace(/^\/+/, '');
	
	//session checker
	if(path.extname(filename) == ".html") {
		if(!("sess" in cookies)) {
			if(filename == "register.html") {
				filename = "register.html";
			} else {
				filename = "login.html";
			}
		} else {
			if(filename == "register.html" || filename == "login.html") {
				filename = "user/home.html";
			}
		}
	}
	
	//decide content type
	switch(fileExtension(filename)) {
		case 'html':
			fileType = 'text/html';
			break;
		case 'js':
			fileType = 'text/javascript';
			break;
		case 'css':
			fileType = 'text/css';
			break;
		case 'png':
			fileType = 'image/png';
			break;
		case 'svg':
			fileType = 'image/svg+xml';
			break;
	}
	
	//read file
	if(path.extname(filename) == ".html") {
		readInHeader(filename, function(err, data) {
			if (err) {
				res.writeHead(404, {'Content-Type': 'text/html'});
				return res.end("404 Not Found");
			} else {
				res.writeHead(200, {'Content-Type': fileType});
				res.write(data);
				return res.end();
			}
		});
	} else {
		fs.readFile(filename, function(err, data) {
			if (err) { res.writeHead(404, {'Content-Type': 'text/html'}); file = "404 Not Found"; }  
			else {
				res.writeHead(200, {'Content-Type': fileType});
				res.write(data);
			}
			return res.end();
		});
	}
}

function login(username,password,res) {
	var response = {};
	var sql = "SELECT * FROM `users` WHERE `username` = '"+username+"'";
	con.connect(function(err) {
		con.query(sql, function (err,results) { 
			if(results.length == 0) {  response['success'] = 0;  response['error'] = 'invalidUsername'; response['errorMessage'] = 'Username is incorrect'; } 
			else if(results.length == 1) {
				results = results[0];
				if(passwordHash.verify(password,results['password'])) { 
					res.setHeader('Set-Cookie', cookie.serialize('sess',results['id'],{httpOnly: false,maxAge: 60*60*24*7}));
					response['success'] = 1; 
				} 
				else {  response['success'] = 0;  response['error'] = 'invalidPassword'; response['errorMessage'] = 'Password is incorrect';  }
			} else {  response['success'] = 0;  response['error'] = 'unknownError'; response['errorMessage'] = 'Oops something went wrong'; } 
			res.end(JSON.stringify(response));
		});
	});
	
}


function register(data,res) {
	var response = {};
	var sql = "SELECT * FROM `users` WHERE `username` = '"+data['username']+"'";
      con.connect(function(err) {
        con.query(sql, function (err,results) { 
			if(results.length == 0) {
				var sql = "INSERT INTO `users` (`username`,`password`,`first_name`,`last_name`,`phone`,`email`) VALUES ('"+data['username']+"','"+passwordHash.generate(data['password'])+"','"+data['first_name']+"','"+data['last_name']+"','"+data['phone']+"','"+data['email']+"')";
				con.connect(function(err) { con.query(sql, function (err) { if(err) { response['success'] = 0;  response['error'] = err;  response['errorMessage'] = 'Oops something went wrong';}  else { response['success'] = 1; } res.end(JSON.stringify(response)); }); });
			} else { response['success'] = 0;  response['error'] = 'duplicateUsername'; response['errorMessage'] = 'Username is already in use'; res.end(JSON.stringify(response)); }
		
        });
      }); 
}


function readInHeader(filename,callback) {
	var file;
	var header;
	if(filename == "login.html" || filename == "register.html") {
		header="/server/chat/headers/headerLogin.html";
	} else {
		header="/server/chat/headers/headerMain.html";
	}
	fs.readFile(header, function(err, data) {
		file = data;
		fs.readFile(filename, function(err, data) {
			if (err) { file = "404 Not Found"; }  
			file += data;
			callback(err,file);
		});
	});
  
}