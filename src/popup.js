// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Quick search for internal web pages at Itello.
 *
 * @author Tomas Wenström <twe@itello.se>
 */


var mode;
var basicMode = new Mode({
    onEnterMode: function() {
	console.log("onEnterMode()");
	this.text = "";
    },
    onExitMode: function() {
	clearNotifications();
    },
    onSelect: function() {
	var target = this.getCurrentTarget();
	if (!target)
	    return false;
	if (target.deeplink && target.deeplink.shorthand && target.deeplink.shorthand.test(this.text)) {
	    window.open(target.deeplink.url.replace("<replace>", this.text)); // TODO: replace with call to deeplink mode, for saving history
	} else {
	    window.open(target.url);
	}
    },
    onAdvance: function() {
	var target = this.getCurrentTarget();
	if (!target)
	    return false;
	if (target.deeplink) {
	    setDeepLinkMode(target);
	    return true;
	}
	return false;
    },
    onTargetsChanged: function(targets) {
	if (mode === basicMode)
	    buildTable(targets);
    },
    onSelectionChanged: function(index) {
	if (mode === basicMode)
	    updateSelection(index);
    },
});
setMode(basicMode);

function setMode(newMode) {
    console.log("setMode()");
    if (mode) mode.onExitMode();
    mode = newMode;
    mode.enterMode();
    if (mode.badge) {
	$("#mode")
	    .text(mode.badge)
	    .show();
    } else {
	$("#mode")
	    .hide();
    }
    $("#input")
	.val("")
	.attr("placeholder", mode.placeholder)
	.focus();
}

function setDeepLinkMode(target) {
    var newMode = new Mode({
	badge: target.name,
	placeholder: target.deeplink.placeholder,
	onEnterMode: function() {
	    $("#list").empty();
	    if (target.deeplink.description)
		$("#list").html(target.deeplink.description);
	},
	onBack: function() {
	    setMode(basicMode);
	},
	onSelect: function() {
	    window.open(target.deeplink.url.replace("<replace>", this.text));
	},
	onTargetsChanged: buildTable,
	onSelectionChanged: updateSelection,
    });
    setMode(newMode);
}

function setupHelp() {
    chrome.commands.getAll(function(cmds) {
	var commands = {};
	$(cmds).each(function(i, cmd) {
	    commands[cmd.name] = cmd;
	});
	chrome.browserAction.setTitle({title: "Inca-miljöer (" + commands["_execute_browser_action"].shortcut + ")"});
	$("#help").hover(function() {
	    hideHelp();
	});
    });
}

function hideHelp() {
    var help = $("#help");
    if (help.is(":visible")) {
	help.animate({opacity: 0}, 300, function() {
	    help.css("opacity", 1);
	    help.hide();
	});
    }
}

function setupStaticTargets() {
    console.log("setupStaticTargets()");
    var staticTargets = [
	{
	    name: "Fyren",
	    url: "https://fyren/intranet/",
	}, {
	    name: "Wiki",
	    url: "https://fyren/mediawiki/index.php",
	    deeplink: {
		url: "https://fyren/mediawiki/index.php?title=Special%3AS%C3%B6k&search=<replace>&fulltext=S%C3%B6k",
	    },
	}, {
	    name: "Faveo",
	    url: "https://taza.itello.se:8443/arsys/home",
	    deeplink: {
		url: "https://taza.itello.se:8443/arsys/forms/10.18.1.40/02%3A01%3AAR/?eid=<replace>",
		shorthand: "5[0-9]{5}",
		placeholder: "Issue",
	    },
	}, {
	    name: "Defect",
	    url: "https://taza.itello.se:8443/arsys/home",
	    deeplink: {
		url: "https://taza.itello.se:8443/arsys/forms/10.18.1.40/06%3A01%3ADefects/?eid=<replace>",
		shorthand: "1[0-9]{5}",
		placeholder: "#",
	    },
	}, {
	    name: "UNIT4 Agresso",
	    url: "https://unit4/",
	    searchTerms: "Unit4 Agresso,tid",
	}, {
	    name: "Mattermost",
	    url: "https://mattermost.itello.se/",
	    searchTerms: "MatterMost",
	}, {
	    name: "Gitlab",
	    url: "https://malaco",
	    deeplink: {
		url: "https://malaco/inca/inca/issues/<replace>",
		shorthand: "#?[1-9][0-9]*",
		placeholder: "Issue",
		description: "Öppnar ett issue i Inca-repot",
	    }
	}, {
	    name: "Itello Search",
	    url: "https://skotte/default.aspx",
	    deeplink: {
		url: "https://skotte/results.aspx?k=<replace>",
		description: "Sök efter dokument",
	    }
	}, {
	    name: "Kanboard",
	    url: "http://kallari/kanboard/",
	    searchTerms: "KanBoard",
	    // http://kallari/kanboard/?controller=DocumentationController&action=show&file=api-project-procedures  - se getAllProjects
	}, {
	    name: "BlameFactory",
	    url: "https://fyren/intranet/itello/development/testtools/BlameFactory/blame-factory.html",
	}, {
	    name: "Jenkins",
	    url: "https://marabou/",
	}, {
	    name: "Skumbanan",
	    url: "http://skumbanan.itello.se/",
	    searchTerms: "SkumBanan",
	}, {
	    name: "Lion Bar",
	    url: "http://lionbar.se/",
	    details: '<img src="http://lionbar.se/wp-content/uploads/2014/10/rest2.png" alt="HAPPY HOUR EVERY HOUR!" style="float: right" />' +
		'<h2>Lion Bar</h2>' +
		'<p><em>"Vår strävan att ge våra gäster en exceptionell upplevelse och ge stort utrymme för glädje och humor."</em></p>' +
		'<ul>' +
		'<li><a target="_blank" href="https://goo.gl/maps/EXaVkRiXKhs" title="Sveavägen 39">Sveavägen</a></li>' +
		'<li><a target="_blank" href="https://goo.gl/maps/CF4QapegZ4L2" title="Långholmsgatan 40">Hornstull</a></li>' +
		'<li><a target="_blank" href="https://goo.gl/maps/8sWoigBnKLz" title="Fridhemsgatan 34">Kungsholmen</a></li>' +
		'<li><a target="_blank" href="https://goo.gl/maps/ZRdh89xk7D82" title="Sveavägen 74">Rådmansgatan</a></li>' +
		'<li><a target="_blank" href="https://goo.gl/maps/DdBidPcYYyJ2" title="Kornhamnstorg 61">Gamla stan</a></li>' +
		'</ul>' +
		'<img src="http://lionbar.se/wp-content/uploads/2014/07/planka-212x300.jpg" />',
	    searchTerms: "Lion Bar,after work,sunkhak",
	}
    ];
    addTargets(staticTargets);
}

function loadCustomTargets() {
    console.log("loadCustomTargets()");
    chrome.storage.local.get(["custom-version", "custom-targets"], function(items) {
	var version = items["custom-version"];
	if (version == TARGET_VERSION) {
	    addTargets(items["custom-targets"]);
	}
    });
}

function addTargets(targets) {
    console.log("addTargets(Array(" + targets.length + "))");
    $.each(targets, function(i, e) {
	e.searchTerms = e.searchTerms || e.name;
	if (e.deeplink && !e.deeplink.url) e.deeplink = undefined;
	if (e.deeplink && e.deeplink.shorthand && typeof e.deeplink.shorthand === "string") e.deeplink.shorthand = new RegExp("^" + e.deeplink.shorthand + "$");
    });
    basicMode.addTargets(targets);
}

TargetLoader.defaultTargetReceiver = addTargets;

TargetLoader.add({
    name: "environments",
    url: "https://fyren/incaversions/testmiljoer.php",
    parser: function(text) {
	var targets = [];
	$("<div>").html(text)
	    .find("table tr").each(function(i, e) {
		if (i > 0) {
		    var td = $(e).children("td");
		    targets.push({
			name: td.eq(0).text(),
			searchTerms: td.eq(0).text(),
			url: td.eq(0).find("a").eq(0).attr("href"),
			details: td.eq(1).html() + "<br />"
			    + "<br /><b>Ansvarig</b>: " + td.eq(2).html()
			    + "<br /><b>App</b>: " + td.eq(3).html()
			    + "<br /><b>Databas</b>: " + td.eq(4).text()
		    });
		}
	    });
	return targets;
    },
    onLoadError: function(request) {
	notifyError("<b>Kunde inte hämta Inca-miljöerna :'(</b><pre>" + request.status + " " + request.statusText + "</pre>" +
		    "<p>Det kan bero på att din session på Fyren har gått ut. Klicka här för att testa.</p>",
		    "https://fyren/incaversions/testmiljoer.php");
    }
});

TargetLoader.add({
    name: "staff",
    url: "https://fyren/intranet/itello/stab/whoswho.data.txt",
    parser: function(text) {
	var targets = [];
	$.each(text.match(/addUser\((".*?"(,\s.*)?)+\)/g), function(i, e) {
	    var args = e.slice(9, -2).split(/"\s*,\s*"/);
	    targets.push({
		name: args[1],
		searchTerms: [args[1], args[0].toLowerCase(), args[3], args[5]].join(","),
		details: "<strong>" + args[1] + " (" + args[0].toLowerCase() + ")</strong>" +
		    "<br /><em>" + args[4] + "</em>" +
		    "<br />Började " + args[2] +
		    "<br />Roll: " + args[5] +
		    "<br />Avdelning: " + args[3] +
		    '<br /><br /><img style="max-width:100%" alt="Foto saknas" src="https://fyren/intranet/itello/stab/images/' + args[0].toLowerCase() + '.jpg" />',
	    });
	});
	return targets;
    },
    onLoadError: function(request) {
	notifyError("<p>Kunde inte hämta personalinfo</p>");
    }
});

TargetLoader.add({
    name: "fyren-main",
    url: "https://fyren/intranet/main.html",
    parser: function(text) {
	var targets = [];
	$("<div>").html(text)
	    .find("#inca-release article").each(function(i, e) {
		var article = $(e);
		targets.push({
		    name: "Release " + article.find("h4").text(),
		    searchTerms: "Release " + article.find("h4").text() + ",fyren,inca",
		    url: "https://fyren/intranet/main.html",
		    details: article.html(),
		});
	    });
	return targets;
    },
    onLoadError: function(request) {
	notifyError("<p>Kunde inte hämta fyren</p>");
    }
});

function notifyError(html, urlOnClick) {
    var div = $("<div>", {class: "error"})
	.html(html)
	.appendTo($("#notifications"))
	.hide()
	.slideToggle();
    if (urlOnClick) {
	div
	    .addClass("clickable")
	    .click(function() {
		window.open(urlOnClick);
	    });
    } else {
	div
	    .delay(3000)
	    .slideToggle();
	setTimeout(function() { div.remove(); }, 4000);
    }
    return div;
}

function buildTable(targets) {
    console.log("buildTable(Array(" + targets.length + "))");
    function highlightMatch(match) {
	if (match.indices.length == 0)
	    return match.text;
	var result = "";
	var prevIncluded = false;
	var included = false;
	for (var i = 0; i < match.text.length; i++) {
	    prevIncluded = included;
	    included = match.indices.includes(i)
	    if (included && !prevIncluded) {
		result += '<span class="matched-part">';
	    } else if (!included && prevIncluded) {
		result += '</span>';
	    }
	    result += match.text[i];
	}
	return result + (included ? '</span>' : '');
    }

    if (targets.length) {
	var content = $("#list");
	content.empty();
	var table = $("<table />");
	var hrow = $("<tr />");
	content.append(table);
	table.append(hrow);
	$.each(targets, function(i, e) {
	    var tr = $("<tr />");
	    if (e.details) {
		tr.attr("title", e.details.replace(/\<br\s*\/?\>/g, "\n").replace(/\<.+?\>/g, ""));
	    }
	    var td = $("<td></td>");
	    tr.append(
		td.append('<a target="_blank" href="' + e.url + '">' + (e.match && e.match.text == e.name ? highlightMatch(e.match) : e.name) + "</a>"),
		$("<td align=right>" + (e.deeplink ? "&#9656;" : "") + "</td>"),
	    );
	    if (e.match && e.match.text != e.name) { // Show the matching text, unless it's the same as the link
		td.append(' <span class="matched-alternative">' + highlightMatch(e.match)) + '</span>';
	    }
	    table.append(tr);
	});
    } else {
	$("#list").html("<br />Inga matchingar");
    }
}

function updateSelection(targetIndex) {
    console.log("updateSelection(" + targetIndex + ")");
    $("table tr").removeClass("selected");
    $("table tr").eq(targetIndex + 1).addClass("selected");
    $("#details").empty();
    var target = mode.getCurrentTarget();
    if (target) {
	if (target.details) {
	    $("#details").html("<hr />" + target.details);
	} else {
	    $("#details").html("<hr />" + target.url);
	}
    }
}

function copyToClipboard(text) {
    var temp = $("<input>")
    $(document.body).append(temp);
    temp.val(text).select();
    try {
	document.execCommand('copy');
    } catch (err) {
	alert('Unable to copy due to browser limitions.');
    }
    temp.remove();
}

function insertSelectionOrClipboardIfShorthand() {
    console.log("insertSelectionOrClipboardIfShorthand()");
    var input = $("#input");
    function insertIfMatch(text) {
	for (var i = 0; i < mode.targets.length; i++) {
	    var t = mode.targets[i];
	    if (t.deeplink && t.deeplink.shorthand && t.deeplink.shorthand.test(text)) {
		console.log("shorthand " + t.deeplink.shorthand + " matches '" + text + "'");
		input.val(text);
		input.select()
		mode.setInput(text, null);
		return true;
	    }
	}
	return false;
    }
    chrome.tabs.executeScript({
	code: "window.getSelection().toString();"
    }, function(selection) {
	if (!insertIfMatch(selection[0].trim())) {
	    input.focus();
	    document.execCommand("paste"); // This triggers an onInput event, filtering by what's pasted and rebuilding the list
	    var text = (input.val() || "").trim();
	    input.val("");
	    if (!insertIfMatch(text)) {
		mode.setInput("", null);
	    }
	}
    });
}

function clearNotifications() {
    $("#notifications > .error").each(function(i, e) {
	e.remove();
    });
}

function loadTargets(forceReload=false) {
    clearNotifications();
    basicMode.targets = [];
    setupStaticTargets();
    loadCustomTargets();
    TargetLoader.loadAll(forceReload);
}

document.addEventListener('DOMContentLoaded', function() {
    // setup refresh button
    Spinner.init($("#refresh"), function() {
	loadTargets(true);
	$("#input").focus();
    });

    setupHelp();
    loadTargets();
    insertSelectionOrClipboardIfShorthand();

    $("#main").height(600 - $("#top").outerHeight()); // Fix what CSS can't

    // setup options link
    $("#options").click(function() {
	if (chrome.runtime.openOptionsPage) {
	    chrome.runtime.openOptionsPage();
	} else { // fallback
	    window.open(chrome.runtime.getURL("options.html"));
	}
    });

    // handle filtering
    $("#input").focus();
    $("#input").on("input", function(event) {
	console.log("#input onInput");
	console.log(event);
	mode.setInput($("#input").val().trim(), event);
    });

    // handle navigation
    document.onkeydown = function(event) {
	hideHelp();
	if (event.keyCode == 13) { // enter
	    mode.onSelect();
	    return false;
	}
	if (event.keyCode == 8) { // backspace
	    if ($("#input").val() == "") {
		mode.onBack();
		return false;
	    }
	}
	if ([9, 32].includes(event.keyCode)) { // tab, space
	    return !mode.onAdvance() && event.keyCode == 32; // Allow spaces to be inserted
	}
	if (event.keyCode == 37) { // left
	    var input = document.getElementById("input");
	    if (input.value == "") {
		mode.onBack();
		return false;
	    }
	}
	if (event.keyCode == 39) { // right
	    var input = document.getElementById("input");
	    if (input.selectionStart == input.value.length) {
		mode.onAdvance();
		return false;
	    }
	}
	if ([38, 40].includes(event.keyCode)) { // up, down
	    mode.navigate({38: -1, 40: 1}[event.keyCode]);
	    return false;
	}
	return true;
    }
    chrome.commands.onCommand.addListener(function(cmd) {
	if (cmd == "navigate-up") {
	    mode.navigate(-1)
	}
	if (cmd == "navigate-down") {
	    mode.navigate(1)
	}
    });
});
