// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Quick search for internal web pages at Itello.
 *
 * @author Tomas Wenström <twe@itello.se>
 */


function Mode(args) {
    this.onEnterMode = args.onEnterMode || function() {};
    this.onExitMode = args.onExitMode || function() {};
    this.onInput = args.onInput || function(text, event) {};
    this.onNavigate = args.onNavigate || function(direction) {};
    this.onSelect = args.onSelect || function() {};
    this.onAdvance = args.onAdvance || function() { return false; }; // Return whether the mode was advanced or not
    this.onBack = args.onBack || function() {};
}

Mode.prototype.badge = null;
Mode.prototype.text = "";
Mode.prototype.placeholder = "Sök";

const TARGET_VERSION = 1; // Increment when changing target structure

var allTargets = [];
var filteredTargets;
var selectedTarget = 0;
var mode;
var basicMode = new Mode({
    onEnterMode: function() {
	if (allTargets) {
	    $(allTargets).each(function(i, e) { // Reset all matches
		e.match = null;
	    });
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
	if (filteredTargets.length == 0)
	    return false;
	var target = filteredTargets[selectedTarget];
	if (target.deeplink && target.deeplink.shorthand && target.deeplink.shorthand.test(this.text)) {
	    window.open(target.deeplink.url.replace("<replace>", this.text)); // TODO: replace with call to deeplink mode, for saving history
	} else {
	    window.open(target.url);
	}
    },
    onAdvance: function() {
	if (filteredTargets.length == 0)
	    return false;
	var target = filteredTargets[selectedTarget];
	if (target.deeplink) {
	    setDeepLinkMode(target);
	    return true;
	}
	return false;
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
		shorthand: "^5[0-9]{5}$",
		placeholder: "Issue",
	    },
	}, {
	    name: "Defect",
	    url: "https://taza.itello.se:8443/arsys/home",
	    deeplink: {
		url: "https://taza.itello.se:8443/arsys/forms/10.18.1.40/06%3A01%3ADefects/?eid=<replace>",
		shorthand: "^1[0-9]{5}$",
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
		shorthand: "^#?[1-9][0-9]*",
		placeholder: "Issue",
		description: "Öppnar ett issue i Inca-repot",
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
	if (e.deeplink && e.deeplink.shorthand && typeof e.deeplink.shorthand === "string") e.deeplink.shorthand = new RegExp(e.deeplink.shorthand);
    });
    Array.prototype.push.apply(allTargets, targets);
    var text = $("#input").val().trim();
    if (text.length) {
	filterTargets();
	buildTable(filteredTargets);
    } else {
	filteredTargets = Array.from(allTargets);
	buildTable(allTargets);
    }
    updateSelection(0);
}

/* Used for fetching and caching targets from a resource */
function TargetLoader(name, url, ttl, parserFunction) {
    this.name = name;
    this.url = url;
    this.ttl = ttl;
    this.parse = parserFunction; // called with request.responseText
}

TargetLoader.prototype.fetch = function() {
    console.log(this.name + ".fetch() - requesting " + this.url);
    var loader = this;
    var request = new XMLHttpRequest();
    request.open("GET", this.url, true);
    request.onreadystatechange = function() {
	if (request.readyState != 4) return;
	if (request.status == 200) {
	    console.log(loader.name + ".fetch() - loaded " + this.url);
	    var targets = loader.parse(request.responseText);
	    loader.save(targets);
	    addTargets(targets);
	} else {
	    console.log(loader.name + ".fetch() - failed to load " + this.url);
	    $("<div>", {class: "notification error"})
		.html("<p>Kunde inte hämta Inca-miljöerna :'(<p><pre>" + request.status + " " + request.statusText + "</pre>")
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
    console.log(this.name + ".load()");
    var loader = this;
    chrome.storage.local.get([loader.name + "-version",
			      loader.name + "-date",
			      loader.name + "-targets"], function(items) {
	var version = items[loader.name + "-version"];
	var date = items[loader.name + "-date"];
	if (version == TARGET_VERSION && date && ((new Date().getTime() - date) / (1000 * loader.ttl)) < 1) {
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

TargetLoader.add = function(name, url, parser, ttl=60*60*24) {
    console.log("Adding loader - " + name + " / " + url);
    TargetLoader.loaders.push(new TargetLoader(name, url, ttl, parser));
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

TargetLoader.add("staff", "https://fyren/intranet/itello/stab/whoswho.data.txt", function(text) {
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
});

function buildTable(targets) {
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

function filterTargets(text) {
    filteredTargets = $(allTargets).filter(function(i, e) {
	e.match = null;
	var terms = e.searchTerms.split(",");
	for (var i = 0; i < terms.length; i++) {
	    var indices = matches(text, terms[i]);
	    if (indices) {
		if (indices.length > 0)
		    e.match = {text:terms[i], indices:indices};
		return true;
	    }
	}
	if (e.deeplink && e.deeplink.shorthand) {
	    return e.deeplink.shorthand.test(text);
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
    if (s.length > t.length) return null;
    if (s.length == t.length) return s == t.toLowerCase() ? Array.from(new Array(s.length).keys()) : null;

    function recurse(si, ti, continuous, matchingIndices) {
	if (si == s.length || ti == t.length) {
	    return si == s.length ? matchingIndices : null;
	}
	var matches = false;
	if (s.charAt(si) == t.charAt(ti).toLowerCase() && (continuous ? true : isBeginningOfWord(ti, t))) {
	    matchingIndices.push(ti);
	    matches = recurse(si + 1, ti + 1, true, matchingIndices);
	}
	if (!matches) {
	    matches = recurse(si, ti + 1, false, matchingIndices);
	}
	return matches;
    }

    return recurse(0, 0, false, []);
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
    console.log(TargetLoader.loaders);
    $(TargetLoader.loaders).each(function(i, loader) {
	console.log("loading " + loader.name);
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
