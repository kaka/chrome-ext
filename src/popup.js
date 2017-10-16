// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Quick search for internal web pages at Itello.
 *
 * @author Tomas Wenstr�m <twe@itello.se>
 */


function Mode(args) {
    this.onEnterMode = args.onEnterMode || function() {};
    this.onExitMode = args.onExitMode || function() {};
    this.onInput = args.onInput || function(text, event) {};
    this.onNavigate = args.onNavigate || function(direction) {};
    this.onSelect = args.onSelect || function() {};
    this.onAdvance = args.onAdvance || function() {};
    this.onBack = args.onBack || function() {};
}

Mode.prototype.badge = null;
Mode.prototype.text = "";
Mode.prototype.placeholder = "S�k";

const TARGET_VERSION = 1; // Increment when changing target structure

var allTargets = [];
var filteredTargets;
var selectedTarget = 0;
var mode;
var basicMode = new Mode({
    onEnterMode: function() {
	if (allTargets) {
	    filteredTargets = allTargets;
	    buildTable(allTargets);
	    updateSelection(0);
	}
    },
    onInput: function(text, event) {
	filterTargets(text);
	buildTable(filteredTargets);
	updateSelection(0);
    },
    onNavigate: function(direction) {
	navigate(direction);
    },
    onSelect: function() {
	var target = filteredTargets[selectedTarget];
	window.open(target.url);
    },
    onAdvance: function() {
	var target = filteredTargets[selectedTarget];
	if (target.deeplink) {
	    setDeepLinkMode(target);
	}
    }
});
setMode(basicMode);

function setMode(newMode) {
    if (mode) mode.onExitMode();
    mode = newMode;
    mode.onEnterMode();
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
	}
    });
    newMode.badge = target.name;
    newMode.placeholder = target.deeplink.placeholder;
    setMode(newMode);
}

function setupHelp() {
    chrome.commands.getAll(function(cmds) {
	var commands = {};
	$(cmds).each(function(i, cmd) {
	    commands[cmd.name] = cmd;
	});
	chrome.browserAction.setTitle({title: "Inca-milj�er (" + commands["_execute_browser_action"].shortcut + ")"});
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
		placeholder: "Issue",
	    },
	}, {
	    name: "Defect",
	    url: "https://taza.itello.se:8443/arsys/home",
	    deeplink: {
		url: "https://taza.itello.se:8443/arsys/forms/10.18.1.40/06%3A01%3ADefects/?eid=<replace>",
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
		placeholder: "Issue",
		description: "�ppnar ett issue i Inca-repot",
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
		'<p><em>"V�r str�van att ge v�ra g�ster en exceptionell upplevelse och ge stort utrymme f�r gl�dje och humor."</em></p>' +
		'<ul>' +
		'<li><a target="_blank" href="https://goo.gl/maps/EXaVkRiXKhs" title="Sveav�gen 39">Sveav�gen</a></li>' +
		'<li><a target="_blank" href="https://goo.gl/maps/CF4QapegZ4L2" title="L�ngholmsgatan 40">Hornstull</a></li>' +
		'<li><a target="_blank" href="https://goo.gl/maps/8sWoigBnKLz" title="Fridhemsgatan 34">Kungsholmen</a></li>' +
		'<li><a target="_blank" href="https://goo.gl/maps/ZRdh89xk7D82" title="Sveav�gen 74">R�dmansgatan</a></li>' +
		'<li><a target="_blank" href="https://goo.gl/maps/DdBidPcYYyJ2" title="Kornhamnstorg 61">Gamla stan</a></li>' +
		'</ul>' +
		'<img src="http://lionbar.se/wp-content/uploads/2014/07/planka-212x300.jpg" />'
	    ,
	}
    ];
    addTargets(staticTargets);
}

function loadCustomTargets() {
    chrome.storage.local.get(["custom-version", "custom-targets"], function(items) {
	var version = items["custom-version"];
	if (version == TARGET_VERSION) {
	    addTargets(items["custom-targets"]);
	}
    });
}

function addTargets(targets) {
    $.each(targets, function(i, e) {
	e.searchTerms = e.searchTerms || e.name;
	if (e.deeplink && !e.deeplink.url) e.deeplink = undefined;
    });
    Array.prototype.push.apply(allTargets, targets);
    var text = $("#input").val().trim();
    if (text.length) {
	filterTargets();
	buildTable(filterTargets);
    } else {
	filteredTargets = Array.from(allTargets);
	buildTable(allTargets);
    }
    updateSelection(0);
}

/* Used for fetching and caching targets from a resource */
function TargetLoader(name, url, parserFunction) {
    this.name = name;
    this.url = url;
    this.parse = parserFunction; // called with request.responseText
}

TargetLoader.prototype.fetch = function() {
    var loader = this;
    var request = new XMLHttpRequest();
    request.open("GET", this.url, true);
    request.onreadystatechange = function() {
	if (request.readyState != 4) return;
	if (request.status == 200) {
	    var targets = loader.parse(request.responseText);
	    loader.save(targets);
	    addTargets(targets);
	} else {
	    $("<div>", {class: "notification error"})
		.html("<p>Kunde inte h�mta Inca-milj�erna :'(<p><pre>" + request.status + " " + request.statusText + "</pre>")
		.appendTo(document.body)
		.hide()
		.slideToggle()
		.delay(3000)
		.slideToggle();
	}
    }
    request.send();
};

TargetLoader.prototype.load = function() {
    var loader = this;
    chrome.storage.local.get([loader.name + "-version",
			      loader.name + "-date",
			      loader.name + "-targets"], function(items) {
	var version = items[loader.name + "-version"];
	var date = items[loader.name + "-date"];
	if (version == TARGET_VERSION && date && ((new Date().getTime() - date) / (1000*60*60*24)) < 1) {
	    addTargets(items[loader.name + "-targets"]);
	} else {
	    loader.fetch();
	}
    });
};

TargetLoader.prototype.save = function(targets) {
    var args = {};
    args[this.name + "-version"] = TARGET_VERSION;
    args[this.name + "-date"] = new Date().getTime();
    args[this.name + "-targets"] = targets;
    chrome.storage.local.set(args);
};

TargetLoader.loaders = [];

TargetLoader.add = function(name, url, parser) {
    TargetLoader.loaders.push(new TargetLoader(name, url, parser));
};

TargetLoader.add("environments", "https://fyren/incaversions/testmiljoer.php", function(text) {
    var targets = [];
    $("<div>", {style: "display:none"})
	.appendTo(document.body)
	.html(text)
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
});

function buildTable(targets) {
    if (targets.length) {
	var content = $("#list");
	content.empty();
	var table = $("<table />");
	var hrow = $("<tr />");
	content.append(table);
	table.append(hrow);
	// hrow.append(
    	//     $("<th>Milj&ouml;</th>"),
       	//     // $("<th>Information</th>"),
	//     // $("<th>Ansvarig</th>"),
    	//     // $("<th>DB</th>"),
    	//     // $("<th>App.</th>"),
	// );
	$.each(targets, function(i, e) {
	    var tr = $("<tr />");
	    if (e.details) {
		tr.attr("title", e.details.replace(/\<br\s*\/?\>/g, "\n").replace(/\<.+?\>/g, ""));
	    }
	    tr.append(
		$("<td></td>").append('<a target="_blank" href="' + e.url + '">' + e.name + "</a>"),
		$("<td align=right>" + (e.deeplink ? "&#9656;" : "") + "</td>"),
		// $("<td>" + e.info + "</td>"),
		// $("<td>" + e.mail + "</td>"),
		// $("<td>" + e.data + "</td>"),
		// $("<td>" + e.home + "</td>"),
	    );
	    table.append(tr);
	});
    } else {
	$("#list").html("<br />Inga matchingar");
    }
}

function filterTargets(text) {
    filteredTargets = $(allTargets).filter(function(i, e) {
	var terms = e.searchTerms.split(",");
	for (var i = 0; i < terms.length; i++) {
	    if (matches(text, terms[i])) return true;
	}
	return false;
//	return matches(text, e.name) || (e.search != undefined && matches(text, e.search));
    });
}

function isBeginningOfWord(i, s) {
    return i == 0
	|| ((s.charAt(i) == s.charAt(i).toUpperCase()))// && (s.charAt(i-1) == s.charAt(i-1).toLowerCase()))
	|| "_- ([<>])/\\'\"".includes(s.charAt(i-1))
	|| !isNaN(s.charAt(i));
}

function matches(search, text) {
    var s = search.trim().toLowerCase();
    var t = text.trim();
    if (s.length > t.length) return false;
    if (s.length == t.length) return s == t.toLowerCase();

    function recurse(si, ti, continuous) {
	if (si == s.length || ti == t.length) {
	    return si == s.length;
	}
	var matches = false;
	if (s.charAt(si) == t.charAt(ti).toLowerCase() && (continuous ? true : isBeginningOfWord(ti, t))) {
	    matches = recurse(si + 1, ti + 1, true);
	}
	if (!matches) {
	    matches = recurse(si, ti + 1, false);
	}
	return matches;
    }

    return recurse(0, 0, false);
}

function matches_DEPRECATED(search, name) {
    var s = search.trim().toLowerCase();
    var n = name.trim();
    if (s.length > n.length) return false;
    if (s.length == n.length) return s == n.toLowerCase();
    var si = 0;
    var ni = 0;
    outer: while (si < s.length && ni < n.length) {
	if (s.charAt(si) == n.charAt(ni).toLowerCase()) {
	    si++;
	    ni++;
	    continue;
	} else {
	    ni++;
	    while (ni < n.length) {
		if (s.charAt(si) == n.charAt(ni).toLowerCase() && isBeginningOfWord(ni, n)) {
		    si++;
		    ni++;
		    continue outer;
		}
		ni++;
	    }
	    return false;
	}
    }
    return si == s.length;
}

function updateSelection(targetIndex) {
    selectedTarget = targetIndex;
    $("table tr").removeClass("selected");
    $("table tr").eq(selectedTarget + 1).addClass("selected");
    $("#details").empty();
    if (filteredTargets.length) {
	var target = filteredTargets[selectedTarget];
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

function navigate(delta) {
    var n = selectedTarget;
    var m = filteredTargets.length;
    var initialValue = delta > 0 ? -1 : 0;
    updateSelection((((n == null ? initialValue : n) + delta) + m) % m);
}

document.addEventListener('DOMContentLoaded', function() {
    setupHelp();
    setupStaticTargets();
    buildTable(allTargets);
    updateSelection(0);
    loadCustomTargets();
    $(TargetLoader.loaders).each(function(i, loader) {
	loader.load();
    });

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
    $("#input").on("input", function() {
	mode.text = $("#input").val().trim();
	mode.onInput(mode.text, event);
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
	    mode.onAdvance();
	    return false;
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
	    mode.onNavigate({38: -1, 40: 1}[event.keyCode]);
	    return false;
	}
	return true;
    }
    chrome.commands.onCommand.addListener(function(cmd) {
	if (cmd == "navigate-up") {
	    mode.onNavigate(-1);
	}
	if (cmd == "navigate-down") {
	    mode.onNavigate(1);
	}
    });
});
