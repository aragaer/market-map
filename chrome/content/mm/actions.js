var status;

function onLoad() {
    status = document.getElementById('status');
    
	println("Application initialized.");

	DB_INIT();
	println("Databases initialized");
	
	mapOnLoad();
}

function setupExports() {
	println("Exports activated.");
    openPreferences('exports');
}

function openPreferences(paneID) {
	var instantApply = getBoolPref("browser.preferences.instantApply", false);
	var features = "chrome,titlebar,toolbar,centerscreen"
            + (instantApply ? ",dialog=no" : ",modal");
	var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
			.getService(Ci.nsIWindowMediator);
	var win = wm.getMostRecentWindow("Preferences");
	if (win) {
		win.focus();
		if (paneID) {
			var pane = win.document.getElementById(paneID);
			win.document.documentElement.showPane(pane);
		}
	} else 
		openDialog("chrome://mm/content/dialogs/preferences.xul", 
		"Preferences", features, paneID);
}

function onAbout (event) {
	println("onAbout activated.");
	window.openDialog("dialogs/about.xul", "_blank", "chrome,close,modal");   	
}

function quit(aForceQuit) {
	if (!confirm(document.getElementById('exit-confirm').value))
		return;

	var appStartup = Cc['@mozilla.org/toolkit/app-startup;1']
  		.getService(Ci.nsIAppStartup);

	var quitSeverity = aForceQuit
  		? Ci.nsIAppStartup.eForceQuit
  		: Ci.nsIAppStartup.eAttemptQuit;

	appStartup.quit(quitSeverity);
}

