// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Quick search for internal web pages at Itello.
 *
 * @author Tomas Wenström <twe@itello.se>
 */


var modes = [];
function mode() {
    return modes[modes.length - 1];
}

var basicMode = new Mode({
    onEnterMode: function() {
	log("onEnterMode()");
	this.text = "";
    },
    onExitMode: function() {
	clearNotifications();
    },
    onSelect: function() {
	var target = this.getCurrentTarget();
	if (!target)
	    return false;
	if (target.deeplinkShorthandMatches(this.text)) {
	    target.openDeeplink(this.text);
	} else {
	    target.activate();
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
	if (mode() === this)
	    updateTargets(targets);
    },
    onSelectionChanged: function(index) {
	if (mode() === this)
	    updateSelection(index);
    },
});
pushMode(basicMode);

function pushModeWithFilteredTargets() {
    log("pushModeWithFilteredTargets()");
    if (mode().filteredTargets.length > 1 && mode().filteredTargets.length < mode().targets.length) {
	pushMode(getModeFromCurrentSearch());
	return true;
    }
    return false;
}

function getModeFromCurrentSearch() {
    let copy = $.extend(true, {}, mode());
    copy.targets = mode().filteredTargets;
    copy.badge = mode().text;
    copy.onBack = popMode;
    return copy;
}

function pushMode(newMode) {
    log("pushMode()");
    mode.previous = mode()
    modes.push(newMode);
    changeMode(newMode);
}

function popMode() {
    log("popMode()");
    if (modes.length > 1) {
	mode.previous = modes.pop();
	changeMode(mode());
    }
}

function changeMode(newMode) {
    log("changeMode()");
    if (mode.previous) mode.previous.onExitMode();
    newMode.enterMode();
    $("#mode").empty();
    for (let i = 0; i < modes.length; i++) {
	let m = modes[i];
	if (m.badge) {
	    $("#mode").append($("<span>").addClass("label").text(m.badge));
	}
    }
    $("#input")
	.val("")
	.attr("placeholder", newMode.placeholder)
	.focus();
}

function setDeepLinkMode(target) {
    var newMode = new Mode({
	badge: target.name,
	placeholder: target.deeplink.placeholder,
	onEnterMode: function() {
	    $("#list-container").empty();
	    if (target.deeplink.description)
		$("#list-container").html(target.deeplink.description);
	},
	onBack: function() {
	    popMode();
	},
	onSelect: function() {
	    target.openDeeplink(this.text);
	},
	onTargetsChanged: updateTargets,
	onSelectionChanged: updateSelection,
    });
    // chrome.history.search({text:target.deeplink.url.split("<replace>")[0]}, function(historyItems) {
    // 	let targets = [];
    // 	$(historyItems).each(function(i, item) {
    // 	    targets.push({
    // 		name: item.title,
    // 		url: item.url,
    // 	    });
    // 	});
    // 	newMode.addTargets(targets);
    // });
    pushMode(newMode);
}

function setupHelp() {
    chrome.commands.getAll(function(cmds) {
	var commands = {};
	$(cmds).each(function(i, cmd) {
	    commands[cmd.name] = cmd;
	});
	chrome.browserAction.setTitle({title: chrome.runtime.getManifest().name + " (" + commands["_execute_browser_action"].shortcut + ")"});
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
    log("setupStaticTargets()");
    var staticTargets = [
	{
	    name: "Fyren",
	    url: "https://fyren/intranet/",
	}, {
	    name: "Wiki",
	    url: "https://yorkie/mediawiki/index.php",
	    deeplink: {
		url: "https://yorkie/mediawiki/index.php?title=Special%3AS%C3%B6k&search=<replace>&fulltext=S%C3%B6k",
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
	    searchTerms: "UNIT4 Agresso,tid",
	}, {
	    name: "Mattermost",
	    url: "https://mattermost/",
	    searchTerms: "MatterMost",
	}, {
	    name: "Gitlab Inca",
	    url: "https://gitlab/inca/inca",
	    searchTerms: "Gitlab Inca,malaco",
	    deeplink: {
		url: "https://gitlab/inca/inca/issues/<replace>",
		shorthand: "#?[1-9][0-9]{0,6}",
		placeholder: "Issue",
		description: "Öppnar ett issue i Inca-repot",
	    }
	}, {
	    name: "Itello Search",
	    url: "https://skotte/default.aspx",
	    searchTerms: "Itello Search,skotte",
	    deeplink: {
		url: "https://skotte/results.aspx?k=<replace>",
		description: "Sök efter dokument",
	    }
	}, {
	    name: "Kanboard",
	    url: "https://yorkie/kanboard/",
	    searchTerms: "KanBoard,kallari",
	    // https://yorkie/kanboard/?controller=DocumentationController&action=show&file=api-project-procedures  - se getAllProjects
	}, {
	    name: "BlameFactory",
	    url: "https://fyren/intranet/itello/development/testtools/BlameFactory/blame-factory.html",
	}, {
	    name: "Jenkins",
	    url: "https://jenkins/",
	    searchTerms: "Jenkins,marabou",
	}, {
	    name: "JFrog Artifactory",
	    url: "https://artifactory/artifactory/webapp",
	}, {
	    name: "Inca Changelog",
	    url: "file://itello.se/Versions/Itello/Inca/Changelog/",
	}, {
	    name: "Inca ReleaseNotes",
	    url: "file://itello.se/Versions/Itello/Inca/ReleaseNotes/",
	    searchTerms: "Inca ReleaseNotes,RS",
	}, {
	    name: "AccuRev",
	    url: "https://accurev:8443/accurev/WebGui.jsp",
	}, {
	    name: "Gitlab Inca History",
	    url: "https://gitlab/inca/inca-history",
	    searchTerms: "Gitlab Inca History,AccuRev",
	    details: `
		<em>https://gitlab/inca/inca-history</em>
		<h1>Inca-history</h1>
		<p>Versionshanteringshistoriken ifrån Accurev (med reservation för eventuella konverteringsfel)</p>
		<h2>Begränsningar</h2>
		<ul>
		<li>Inkluderar endast promotes till huvudströmmen (motsvarar att "squash" alltid har varit ikryssad i GitLab)
		<ul>
		<li>Behöver man mer detaljer får man titta i Accurev</li>
		</ul>
		</li>
		<li>Accurev har problem med att särskilja issues när overlap har uppstått, ibland listas därför flera ar-nummer i commit-meddelanden</li>
		<li>ThirdParty och Interfaces är exkluderat eftersom dessa tidigare innehöll symlänkar
		<ul>
		<li>Detta gör att det troligtvis inte går att starta en historisk Inca-miljö</li>
		</ul>
		</li>
		</ul>
		`,
	}, {
	    name: "ProductStudio - System text",
	    url: chrome.runtime.getURL("translate.html"),
	    searchTerms: "ProductStudio - System text,translate,översätt",
	    details: "Sök i systemtexttabellen",
	    deeplink: {
		url: chrome.runtime.getURL("translate.html") + "?search=<replace>",
	    },
	}, {
	    name: "Kundmiljöer - Prod",
	    url: "https://fyren/incaversions/kundmiljoer.php",
	    searchTerms: "Kundmiljöer - Prod,grisen",
	}, {
	    name: "Instruktioner Release Notes",
	    url: "https://fyren/intranet/itello/productmanagement/Instruktioner%20Release%20Notes.pdf",
	    searchTerms: "Instruktioner Release Notes,RS",
	}, {
	    name: "Benify",
	    url: "https://www.benify.se/fps/public/public.do",
	    searchTerms: "Benify,friskvård,förmånsportalen",
	}, {
	    name: "Skumbanan",
	    url: "http://skumbanan/",
	    searchTerms: "SkumBanan,Testla",
	}, {
	    name: "Inställningar",
	    url: chrome.runtime.getURL("options.html"),
	    searchTerms: "Inställningar,settings,options",
	    details: `Öppna inställningarna för ${chrome.runtime.getManifest().name}.`,
	}, {
	    name: "Lion Bar",
	    url: "http://lionbar.se/",
	    details: `
		<img src="http://lionbar.se/wp-content/uploads/2014/10/rest2.png" title="HAPPY HOUR EVERY HOUR!" style="float: right" />
		<h2>Lion Bar</h2>
		<p><em>"Vår strävan att ge våra gäster en exceptionell upplevelse och ge stort utrymme för glädje och humor."</em></p>
		<ul>
		<li><a target="_blank" href="https://goo.gl/maps/EXaVkRiXKhs" title="Sveavägen 39">Sveavägen</a></li>
		<li><a target="_blank" href="https://goo.gl/maps/CF4QapegZ4L2" title="Långholmsgatan 40">Hornstull</a></li>
		<li><a target="_blank" href="https://goo.gl/maps/8sWoigBnKLz" title="Fridhemsgatan 34">Kungsholmen</a></li>
		<li><a target="_blank" href="https://goo.gl/maps/ZRdh89xk7D82" title="Sveavägen 74">Rådmansgatan</a></li>
		<li><a target="_blank" href="https://goo.gl/maps/DdBidPcYYyJ2" title="Kornhamnstorg 61">Gamla stan</a></li>
		</ul>
		<img src="http://lionbar.se/wp-content/uploads/2014/07/planka-212x300.jpg" />
		`,
	    searchTerms: "Lion Bar,after work,sunkhak",
	}
    ];
    addTargets(staticTargets);
}

function loadCustomTargets() {
    log("loadCustomTargets()");
    chrome.storage.local.get(["custom-version", "custom-targets"], function(items) {
	var version = items["custom-version"];
	if (version == TARGET_VERSION) {
	    addTargets(items["custom-targets"]);
	}
    });
}

function loadBookmarkTargets() {
    log("loadBookmarkTargets()");
    chrome.bookmarks.getTree(function(bookmarkTreeNodes) {
	var targets = [];
	var breadcrumbs = [];
	function traverse(nodes) {
	    $(nodes).each(function(i, node) {
		if (node.url) {
		    let searchTerms = node.title + "," + breadcrumbs.join(",");
		    if (!searchTerms.toLowerCase().includes("bokmärk")) searchTerms += ",bokmärken";
		    if (!searchTerms.toLowerCase().includes("bookmark")) searchTerms += ",bookmarks";
		    targets.push({
			name: node.title,
			url: node.url,
			searchTerms: searchTerms,
		    });
		} else {
		    if (node.title != "")
			breadcrumbs.push(node.title);
		    traverse(node.children);
		    breadcrumbs.pop();
		}
	    });
	}
	traverse(bookmarkTreeNodes);
	addTargets(targets);
    });
}

function addTargets(targets) {
    log("addTargets(Array(" + targets.length + "))");
    basicMode.addTargets(targets);
}

TargetLoader.defaultTargetReceiver = addTargets;

TargetLoader.add({
    name: "environments",
    url: "https://fyren/incaversions/testmiljoer.php",
    parser: function(text) {
	function processName(name) {
	    return name == "Produktstudion" ? "ProduktStudion" : name;
	}
	function extraSearchTermFor(name) {
	    return (name.startsWith("Robur") ? ",Swedbank" : "");
	}
	var targets = [];
	$("<div>").html(text)
	    .find("table tr").each(function(i, e) {
		if (i > 0) {
		    var td = $(e).children("td");
		    var name = processName(td.eq(0).text());
		    targets.push({
			name: name,
			searchTerms: name + "," + td.eq(4).text() + extraSearchTermFor(name),
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
    name: "fyren-navigation",
    url: "https://fyren/intranet/navigation.html",
    parser: function(text) {
	var targets = [];
	$("<div>").html(text)
	    .find("a").each(function(i, e) {
		var a = $(e);
		var url = a.attr("href");
		if (!url.startsWith("http")) {
		    url = "https://fyren" + (url.startsWith("/") ? "" : "/intranet/") + url;
		}
		targets.push({
		    name: a.text(),
		    url: url,
		    searchTerms: a.text() + ",fyren",
		});
	    });
	return targets;
    },
    onLoadError: function(request) {
	notifyError("<p>Kunde inte läsa från Fyrens vänstermeny</p>");
    }
});

TargetLoader.add({
    name: "staff",
    file: "Q:\\Intranet\\itello\\stab\\whoswho.data.txt",
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

function parseIncaReleases(url) {
    return function(text) {
	var targets = [];
	$("<div>").html(text)
	    .find("#inca-release article").each(function(i, e) {
		var article = $(e);
		targets.push({
		    name: "Release " + article.find("h4").text(),
		    searchTerms: "Release " + article.find("h4").text() + ",fyren,inca",
		    url: url + "#release" + article.find("h4").text(),
		    details: article.html(),
		});
	    });
	return targets;
    }
}

TargetLoader.add({
    name: "fyren-main",
    url: "https://fyren/intranet/main.html",
    parser: parseIncaReleases("https://fyren/intranet/main.html"),
    onLoadError: function(request) {
	notifyError("<p>Kunde inte läsa från Fyren</p>");
    }
});

TargetLoader.add({
    name: "fyren-qualityassurance",
    url: "https://fyren/intranet/itello/qualityassurance/qualityassurance.html",
    parser: parseIncaReleases("https://fyren/intranet/itello/qualityassurance/qualityassurance.html"),
    onLoadError: function(request) {
	notifyError("<p>Kunde inte läsa från Quality Assurance</p>");
    }
});

TargetLoader.add({
    name: "personal",
    url: "https://fyren/intranet/itello/stab/personal/personal.html",
    parser: function(text) {
	var targets = [];
	$("<div>").html(text)
	    .find(".personalLink").each(function(i, e) {
		var a = $(e);
		targets.push({
		    name: a.text(),
		    url: "https://fyren/intranet/itello/stab/personal/" + a.attr("href"),
		    searchTerms: a.text() + ",fyren,personal",
		});
	    });
	return targets;
    },
    onLoadError: function(request) {
	notifyError("<p>Kunde inte hämta personalsidan</p>");
    }
});

TargetLoader.add({
    name: "personal-halsa",
    url: "https://fyren/intranet/itello/stab/halsoportal/halsa.html",
    parser: function(text) {
	var targets = [];
	$("<div>").html(text)
	    .find("td").each(function(i, e) {
		var td = $(e);
		targets.push({
		    name: td.find("h2").text(),
		    url: "https://fyren/intranet/itello/stab/halsoportal/halsa.html" + "#" + td.find("h2").text(),
		    searchTerms: td.find("h2").text() + ",fyren,personal,hälsa",
		    details: td.html(),
		});
	    });
	log(targets);
	return targets;
    },
    onLoadError: function(request) {
	notifyError("<p>Kunde inte hämta personalsidan</p>");
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

function updateTargets(targets) {
    log("updateTargets(Array(" + targets.length + "))");
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

    var container = $("#list-container");
    if (targets.length) {
	container.empty();
	var ul = $("<ul />");
	container.append(ul);
	$.each(targets, function(i, e) {
	    var li = $("<li />");
	    if (e.details) {
		li.attr("title", e.details.replace(/\<br\s*\/?\>/g, "\n").replace(/\<.+?\>/g, ""));
	    }
	    var span = $('<span class="match"></span>');
	    span.append($('<a target="_blank" href="' + e.url + '">' + (e.match && e.match.text == e.name ? highlightMatch(e.match) : e.name) + "</a>"));
	    li.append(span);
	    if (e.match && e.match.text != e.name) { // Show the matching text, unless it's the same as the link
		span.append('<span class="matched-alternative">' + highlightMatch(e.match)) + '</span>';
	    }
	    if (e.deeplink) {
		li.append('<span class="arrow">&#9656;</span>');
	    }
	    ul.append(li);
	});
    } else {
	container.html("<br />Inga matchingar");
    }

    $("#item-count").text(targets.length);
}

function updateSelection(targetIndex) {
    log("updateSelection(" + targetIndex + ")");
    $("#list-container > ul > li").removeClass("selected");
    $("#list-container > ul > li").eq(targetIndex).addClass("selected");
    let details = $("#details");
    details.empty();
    var target = mode().getCurrentTarget();
    if (target) {
	let tags = $('<div class="search-terms" />');
	$.each(target.searchTerms.split(","), function(i, e) {
	    tags.append("<span>" + e + "</span>");
	});
	details.append("<hr />");
	details.append(tags);
	if (target.details) {
	    details.append(target.details);
	} else {
	    details.append("<em>" + target.url + "</em>");
	}
    }
    var selected = $("#list-container > ul > li.selected")[0];
    if (selected) {
	selected.scrollIntoView({block: "center"});
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
    log("insertSelectionOrClipboardIfShorthand()");
    var input = $("#input");
    function insertIfMatch(text) {
	for (var i = 0; i < mode().targets.length; i++) {
	    var t = mode().targets[i];
	    if (t.deeplink && t.deeplink.shorthand && t.deeplink.shorthand.test(text)) {
		log("shorthand " + t.deeplink.shorthand + " matches '" + text + "'");
		input.val(text);
		input.select()
		mode().setInput(text, null);
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
		mode().setInput("", null);
	    }
	}
    });
}

function clearNotifications() {
    $("#notifications > .error").each(function(i, e) {
	e.remove();
    });
}

function async(func) {
    setTimeout(func, 0);
}

function loadTargets(forceReload=false) {
    function tryToInsertSelectionOrClipboard() {
	var isFirstTime = !forceReload; // i.e. not manually reloaded
	var inputIsEmpty = !$.trim($("#input").val());
	if (isFirstTime && inputIsEmpty) {
	    insertSelectionOrClipboardIfShorthand();
	}
    }

    async(function() {
	clearNotifications();
	basicMode.clearTargets();
	setupStaticTargets();			tryToInsertSelectionOrClipboard();
	loadCustomTargets();			tryToInsertSelectionOrClipboard();
	TargetLoader.loadAll(forceReload);	tryToInsertSelectionOrClipboard();
	loadBookmarkTargets();
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // setup refresh button
    Spinner.init($("#refresh"), function() {
	loadTargets(true);
	$("#input").focus();
    });

    setupHelp();
    loadTargets();

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
	log("#input onInput");
	log(event);
	mode().setInput($("#input").val().trim(), event);
    });

    // handle navigation
    document.onkeydown = function(event) {
	hideHelp();
	if (event.keyCode == 13) { // enter
	    mode().onSelect();
	    return false;
	}
	if (event.keyCode == 8) { // backspace
	    if ($("#input").val() == "") {
		mode().onBack();
		return false;
	    }
	}
	if ([9, 32].includes(event.keyCode)) { // tab, space
	    if (mode().onAdvance()) {
		return false;
	    } else if (event.keyCode == 9) {
		pushModeWithFilteredTargets();
		return false;
	    }
	    return event.keyCode == 32; // Allow spaces to be inserted
	}
	if (event.keyCode == 37) { // left
	    var input = document.getElementById("input");
	    if (input.value == "") {
		mode().onBack();
		return false;
	    }
	}
	if (event.keyCode == 39) { // right
	    var input = document.getElementById("input");
	    if (input.selectionStart == input.value.length) {
		mode().onAdvance();
		return false;
	    }
	}
	if ([38, 40].includes(event.keyCode)) { // up, down
	    mode().navigate({38: -1, 40: 1}[event.keyCode]);
	    return false;
	}
	if (event.keyCode == 191) { // forward slash
	    return !pushModeWithFilteredTargets();
	}
	$("#input").focus();
	return true;
    }
    chrome.commands.onCommand.addListener(function(cmd) {
	if (cmd == "navigate-up") {
	    mode().navigate(-1)
	}
	if (cmd == "navigate-down") {
	    mode().navigate(1)
	}
    });
});
