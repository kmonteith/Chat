class Profile {
	constructor() {
		this.socket = io();
		this.profileButtonInit = document.getElementById("profile");
		this.profile_panel = document.getElementById("profile_panel");
		this.profile_back_button = profile_panel.querySelector("#profile_back_button");
		this.darkMode = document.getElementById("dark_mode");
		this.addprofileButtonListener();
		this.buttonListener();
	}
	addprofileButtonListener() {
		var t = this;
		this.profileButtonInit.addEventListener("click", function() {
			t.showprofilePanel();
		});
		this.profile_back_button.addEventListener("click", function() {
			t.hideprofilePanel();
		});
	}
	buttonListener() {
		var t = this;
		this.darkMode.addEventListener("click", function() {
			t.toggleDarkMode();
		});
	}
	alterProfile(name,value) {
		var data = {};
		data['name'] = name;
		data['value'] = value;
		data['userId'] = getCurrentUserId();
		this.socket.emit("updateprofile",data);
	}
	hideprofilePanel() {
		this.profile_panel.style.right = "100%";
		this.profile_panel.style.zIndex = "-1";
	}
	showprofilePanel() {
		this.profile_panel.style.zIndex = "100";
		this.profile_panel.style.right = "calc( 100% - "+window.getComputedStyle(this.profile_panel).getPropertyValue('width')+")";
	}


}