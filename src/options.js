var allTargets = [];

function getForm() {
    return {
	"name": $("#name").val(),
	"url": $("#url").val(),
	"description": $("#description").val(),
	"searchTerms": $("#searchTerms").val(),
	"deeplink": {
	    "url": $("#deeplink-url").val(),
	    "description": $("#deeplink-description").val(),
	    "placeholder": $("#deeplink-placeholder").val(),
	},
    };
}

function fillForm(target) {
    $("#name").val(target.name);
    $("#url").val(target.url);
    $("#description").val(target.description);
    $("#searchTerms").val(target.searchTerms);
    $("#deeplink-url").val(target.deeplink.url);
    $("#deeplink-description").val(target.deeplink.description);
    $("#deeplink-placeholder").val(target.deeplink.placeholder);
}

function clearForm() {
    fillForm({deeplink: {}});
}

function addTarget(target) {
    var i = indexOf(target.name);
    if (i != undefined) {
	allTargets[i] = target;
	return
    }
    allTargets.push(target);
}

function removeTarget(target) {
    var i = indexOf(target.name);
    if (i != undefined) {
	allTargets.splice(i, 1);
    }
}

function indexOf(name) {
    for (var i = 0; i < allTargets.length; i++) {
	if (allTargets[i].name == name) {
	    return i;
	}
    }
    return undefined;
}

function loadTargets() {
    chrome.storage.local.get("custom-targets", function(items) {
	var targets = items["custom-targets"];
	if (targets) {
	    allTargets = targets;
	    updateGUI();
	}
    });
}

function saveTargets() {
    chrome.storage.local.set({
	"custom-version": 1,//TARGET_VERSION,
	"custom-targets": allTargets, // TODO it may be that objects can't be saved directly
    });
}

function updateSelectList() {
    var select = $("#targets");
    select.empty();
    $.each(allTargets, function(i, e) {
	select.append($("<option />").text(e.name));
    });
}

function updateGUI() {
    updateSelectList();
    clearForm();
}

document.addEventListener('DOMContentLoaded', function() {
    loadTargets();

    $("#save").click(function() {
	addTarget(getForm());
	saveTargets();
	updateGUI();
    });

    $("#delete").click(function() {
	removeTarget(getForm());
	saveTargets();
	updateGUI();
    });

    $("#targets").change(function() {
	var name = $("#targets option:selected").text();
	fillForm(allTargets[indexOf(name)]);
    });
});
