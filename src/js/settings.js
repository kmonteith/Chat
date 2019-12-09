class settings {
	constructor() {
		this.socket = io();
		
		this.root = document.documentElement;
		this.dark = 0;
		this.getSettings();
	}
	getSettings() {
		var t = this;
		var data = {};
		data['userId'] = getCurrentUserId();
		this.socket.emit("getSettings", data, function(response) {
			t.dark = response['dark'];
			if(t.dark == 1) { t.setDark(); }
		});
	}
	init() {
		this.settingsButtonInit = document.getElementById("settings");
		this.settings_panel = document.getElementById("settings_panel");
		this.settings_back_button = settings_panel.querySelector("#settings_back_button");
		this.darkMode = document.getElementById("dark_mode");
		this.addSettingsButtonListener();
		this.buttonListener();
	}
	addSettingsButtonListener() {
		var t = this;
		this.settingsButtonInit.addEventListener("click", function() {
			t.showSettingsPanel();
		});
		this.settings_back_button.addEventListener("click", function() {
			t.hideSettingsPanel();
		});
	}
	buttonListener() {
		var t = this;
		this.darkMode.addEventListener("click", function() {
			t.toggleDarkMode();
		});
	}
	setDark() {
		this.root.style.setProperty('--main-bg-color', "#353535");
		this.root.style.setProperty('--main-accent-color', "#4a4a4a");
		this.root.style.setProperty('--second-accent-color', "#2d2d2d");
		this.root.style.setProperty('--third-accent-color', "#565656");
		this.root.style.setProperty('--fourth-accent-color', "#353535");
		this.root.style.setProperty('--main-txt-color', "#eee");
		this.darkMode.innerHTML = '<i class="material-icons">brightness_5</i>Light Mode';
	}
	toggleDarkMode() {
		if(!this.dark) {
			this.root.style.setProperty('--main-bg-color', "#353535");
			this.root.style.setProperty('--main-accent-color', "#4a4a4a");
			this.root.style.setProperty('--second-accent-color', "#2d2d2d");
			this.root.style.setProperty('--third-accent-color', "#565656");
			this.root.style.setProperty('--fourth-accent-color', "#353535");
			this.root.style.setProperty('--main-txt-color', "#eee");
			this.dark = 1;
			this.alterSettings("dark",this.dark);
			this.darkMode.innerHTML = '<i class="material-icons">brightness_5</i>Light Mode';
		} else {
			this.root.style.setProperty('--main-bg-color', "#FFF");
			this.root.style.setProperty('--main-accent-color', "#eee");
			this.root.style.setProperty('--second-accent-color', "#f1f1f1");
			this.root.style.setProperty('--third-accent-color', "#d1d1d1");
			this.root.style.setProperty('--fourth-accent-color', "#e2e2e2");
			this.root.style.setProperty('--main-txt-color', "#000");
			this.dark = 0;
			this.alterSettings("dark",this.dark);
			this.darkMode.innerHTML = '<i class="material-icons">brightness_3</i>Dark Mode';
		}
	}
	alterSettings(name,value) {
		var data = {};
		data['name'] = name;
		data['value'] = value;
		data['userId'] = getCurrentUserId();
		this.socket.emit("updateSettings",data);
	}
	hideSettingsPanel() {
		this.settings_panel.style.right = "100%";
		this.settings_panel.style.zIndex = "-1";
	}
	showSettingsPanel() {
		this.settings_panel.style.zIndex = "100";
		this.settings_panel.style.right = "calc( 100% - "+window.getComputedStyle(this.settings_panel).getPropertyValue('width')+")";
	}


}
