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
	    name: "ONE",
	    url: "https://itellohq.sharepoint.com/",
	    searchTerms: "One,intranät,sharepoint",
	}, {
	    name: "Intranet",
	    url: "https://intranet.itello.se",
	    searchTerms: "Intranet,Confluence",
	}, {
	//     name: "Fyren",
	//     url: "https://fyren/intranet/",
	//     searchTerms: "Fyren,intranät",
	// }, {
	    name: "Wiki",
	    url: "https://mediawiki.itello.se/index.php",
	    deeplink: {
		url: "https://mediawiki.itello.se/index.php?title=Special%3AS%C3%B6k&search=<replace>&fulltext=S%C3%B6k",
	    },
	}, {
	    name: "Faveo",
	    url: "https://faveo.itello.se:8443/arsys/home",
	    deeplink: {
		url: "https://faveo.itello.se:8443/arsys/forms/faveoapp-prod/02%3A01%3AAR/Default+Web+View/?eid=<replace>",
		shorthand: "5[0-9]{5}",
		placeholder: "Issue",
	    },
	}, {
	    name: "Defect",
	    url: "https://faveo.itello.se:8443/arsys/home",
	    deeplink: {
		url: "https://faveo.itello.se:8443/arsys/forms/faveoapp-prod/06%3A01%3ADefects/?eid=<replace>",
		shorthand: "1[0-9]{5}",
		placeholder: "#",
	    },
	}, {
	    name: "Jira (Inca)",
	    url: "https://jira.itello.se/",
	    deeplink: {
		url: "https://jira.itello.se/browse/INCA-<$3>",
		shorthand: "([Ii]([Nn][Cc][Aa]-?)?)?([1-9][0-9]{0,6})",
		placeholder: "Issue",
		description: "Öppnar ett Inca-issue i Jira",
	    }
	}, {
	    name: "Jira (Customers)",
	    url: "https://jira.itello.se/",
	    deeplink: {
		url: "https://jira.itello.se/browse/CUST-<$3>",
		shorthand: "([Cc]([Uu][Ss][Tt]-?)?)?([1-9][0-9]{0,6})",
		placeholder: "Issue",
		description: "Öppnar ett Customers-issue i Jira",
	    }
	}, {
	    name: "Jira (alla projekt)",
	    url: "https://jira.itello.se/",
	    details: "Öppnar ett issue i Jira",
	    searchTerms: "Jira",
	    deeplink: {
		url: "https://jira.itello.se/browse/<replace>",
		shorthand: "[A-Za-z]+-[1-9][0-9]{0,6}",
		placeholder: "<Project>-<Issue number>",
		description: "Öppnar ett issue i Jira",
	    }
	}, {
	    name: "Gitlab Inca",
	    url: "https://gitlab.itello.se/inca/inca",
	    searchTerms: "Gitlab Inca,malaco",
	    deeplink: {
		url: "https://gitlab.itello.se/inca/inca/issues/<$1>",
		shorthand: "#?([1-9][0-9]{0,6})",
		placeholder: "Issue",
		description: "Öppnar ett issue i Inca-repot",
	    }
	}, {
	    name: "Itello Search",
//	    url: "", // utkommenterad så den inte slås ihop med exempelvis ONE
	    searchTerms: "Itello Search,One",
	    deeplink: {
		url: "https://itellohq.sharepoint.com/_layouts/15/search.aspx/siteall?q=<replace>",
		description: "Sök på ONE",
	    }
	}, {
	    name: "Xledger",
	    url: "https://www.xledger.net",
	    searchTerms: "Xledger,tidrapportering",
	}, {
	    name: "Mattermost",
	    url: "https://mattermost.itello.se/",
	    searchTerms: "MatterMost",
	}, {
	    name: "Hjälpcentral - Jira Service Desk",
	    url: "https://jira.itello.se/servicedesk/customer/portal/1",
	}, {
	//     name: "Planeringsverktyget",
	//     url: "https://forastero:10443/vertigo/common/GOActivities/GOActivities/mainFrameset",
	//     searchTerms: "Planeringsverktyget,backlog",
	//     deeplink: {
	// 	url: "https://forastero:10443/vertigo/common/GOBacklog/GOBacklog/viewObject?ItemClassName=BACKLOG_ENTRY&STORY_ID=<$1>",
	// 	shorthand: "#?([1-9][0-9]{0,6})",
	// 	placeholder: "Backlog-id",
	// 	description: "Öppnar en backlog-uppgift",
	//     }
	// }, {
	    name: "Kanboard",
	    url: "https://kanboard.itello.se/",
	    searchTerms: "KanBoard,kallari",
	    // https://yorkie.itello.se/kanboard/?controller=DocumentationController&action=show&file=api-project-procedures  - se getAllProjects
	}, {
	    name: "BlameFactory",
	    url: "https://pcloud.itello.se/inca/blame-factory/",
	}, {
	    name: "Jenkins",
	    url: "https://jenkins.itello.se/",
	    searchTerms: "Jenkins,marabou",
	}, {
	    name: "JFrog Artifactory",
	    url: "https://artifactory.itello.se/",
	}, {
	    name: "Inca Changelog",
	    url: "https://intranet.itello.se/display/PM/Changelog",
	}, {
	    name: "Inca Changelog (gamla)",
	    url: "file://itello.se/Versions/Itello/Inca/Changelog/",
	}, {
	//     name: "Inca Release Notes",
	//     url: "https://fyren/intranet/publicering/ReleaseNotesJira/",
	//     searchTerms: "Inca Release Notes,RS",
	// }, {
	//     name: "PAF Release Notes",
	//     url: "https://fyren/intranet/publicering/ReleaseNotesPAF/",
	//     searchTerms: "PAF Release Notes,RS",
	// }, {
	    name: "Inca Release Notes (gamla)",
	    url: "file://itello.se/Versions/Itello/Inca/ReleaseNotes/",
	    searchTerms: "Inca Release Notes (gamla),RS",
	}, {
	    name: "Release Notes Developer's Guide",
	    url: "https://itellohq.sharepoint.com/sites/LumeraProduct/SitePages/Release-Notes-Developer%C2%B4s-Guide.aspx",
	}, {
	    name: "IncaWebServiceStatistics",
	    url: "file://itello.se/Source/Users/Infra/WS/LogMerger/IncaWebServiceStatistics.xlsx",
	}, {
	//     name: "AccuRev",
	//     url: "https://accurev.itello.se:8443/accurev/WebGui.jsp",
	// }, {
	    name: "Gitlab Inca History",
	    url: "https://gitlab.itello.se/inca/inca-history",
	    searchTerms: "Gitlab Inca History,AccuRev",
	    details: `
		<em>https://gitlab.itello.se/inca/inca-history</em>
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
	//     name: "ProductStudio - System text",
	//     url: chrome.runtime.getURL("productstudio.html") + "?class=SYSTEM_TEXT_TABLE",
	//     searchTerms: "ProductStudio - System text,translate,översätt",
	//     details: "Sök i systemtexttabellen",
	//     deeplink: {
	// 	url: chrome.runtime.getURL("productstudio.html") + "?class=SYSTEM_TEXT_TABLE&search=<replace>",
	//     },
	// }, {
	//     name: "ProductStudio - Regler",
	//     url: chrome.runtime.getURL("productstudio.html") + "?class=MRULE",
	//     searchTerms: "ProductStudio - Regler,MRule",
	//     details: "Sök bland regler",
	//     deeplink: {
	// 	url: chrome.runtime.getURL("productstudio.html") + "?class=MRULE&search=<replace>",
	// 	shorthand: "[1-9][0-9]{0,6}",
	//     },
	// }, {
	    name: "Versions at Customers",
	    url: "https://itellohq.sharepoint.com/sites/Operations/SitePages/Versions-at-Customers.aspx",
	    searchTerms: "Versions at Customers,kundmiljöer,installationer,grisen",
	}, {
	    name: "Benify",
	    url: "https://www.benify.se/fps/public/public.do",
	    searchTerms: "Benify,friskvård,förmånsportalen",
	}, {
	    name: "Skumbanan",
	    url: "https://skumbanan.itello.se/",
	    searchTerms: "SkumBanan,Testla",
	}, {
	    name: "Inställningar",
	    url: chrome.runtime.getURL("options.html"),
	    searchTerms: "Inställningar,settings,options",
	    details: `Öppna inställningarna för ${chrome.runtime.getManifest().name}.`,
	}, {
	    name: "Lion Bar",
	    url: "https://lionbar.se/",
	    details: `
		<img src="https://lionbar.se/wp-content/uploads/2014/10/rest2.png" title="HAPPY HOUR EVERY HOUR!" style="float: right" />
		<h2>Lion Bar</h2>
		<p><em>Restaurang & Bar med familjär känsla</em></p>
		<ul>
		<li><a target="_blank" href="https://goo.gl/maps/EXaVkRiXKhs" title="Sveavägen 39">Sveavägen</a> (RIP)</li>
		<li><a target="_blank" href="https://goo.gl/maps/CF4QapegZ4L2" title="Långholmsgatan 40">Hornstull</a></li>
		<li><a target="_blank" href="https://goo.gl/maps/6fQGuSMgUk42" title="Östgötagatan 27">Medborgarplatsen</a> (RIP)</li>
		<li><a target="_blank" href="https://goo.gl/maps/ZRdh89xk7D82" title="Sveavägen 74">Rådmansgatan</a></li>
		<li><a target="_blank" href="https://goo.gl/maps/DdBidPcYYyJ2" title="Kornhamnstorg 61">Gamla stan</a></li>
		</ul>
		<img src="https://lionbar.se/wp-content/uploads/2014/07/planka-212x300.jpg" />
		`,
	    searchTerms: "Lion Bar,after work,sunkhak,Gränges",
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
    url: "https://knockout.itello.se/",
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
	notifyError("<b>Kunde inte hämta Inca-miljöerna :'(</b><pre>" + request.status + " " + request.statusText + "</pre>");
    }
});

// TargetLoader.add({
//     name: "fyren-navigation",
//     url: "https://fyren/intranet/navigation.html",
//     parser: function(text) {
// 	var targets = [];
// 	$("<div>").html(text)
// 	    .find("a").each(function(i, e) {
// 		var a = $(e);
// 		var url = a.attr("href");
// 		if (!url.startsWith("http")) {
// 		    url = "https://fyren" + (url.startsWith("/") ? "" : "/intranet/") + url;
// 		}
// 		targets.push({
// 		    name: a.text(),
// 		    url: url,
// 		    searchTerms: a.text() + ",fyren",
// 		});
// 	    });
// 	return targets;
//     },
//     onLoadError: function(request) {
// 	notifyError("<p>Kunde inte läsa från Fyrens vänstermeny</p>");
//     }
// });

// TargetLoader.add({
//     name: "staff",
//     url: "https://fyren/intranet/itello/stab/whoswho.data.txt",
//     parser: function(text) {
// 	var targets = [];
// 	$.each(text.match(/addUser\((".*?"(,\s.*)?)+\)/g), function(i, e) {
// 	    var args = e.slice(9, -2).split(/"\s*,\s*"/);
// 	    targets.push({
// 		name: args[1],
// 		searchTerms: [args[1], args[0].toLowerCase(), args[3], args[5]].join(","),
// 		details: "<strong>" + args[1] + " (" + args[0].toLowerCase() + ")</strong>" +
// 		    "<br /><em>" + args[4] + "</em>" +
// 		    "<br />Började " + args[2] +
// 		    "<br />Roll: " + args[5] +
// 		    "<br />Avdelning: " + args[3] +
// 		    '<br /><br /><img style="max-width:100%" alt="Foto saknas" src="https://fyren/intranet/itello/stab/images/' + args[0].toLowerCase() + '.jpg" />',
// 	    });
// 	});
// 	return targets;
//     },
//     onLoadError: function(request) {
// 	notifyError("<b>Kunde inte hämta personalinfo</b>");
//     }
// });

// function parseIncaReleases(url) {
//     return function(text) {
// 	var targets = [];
// 	$("<div>").html(text)
// 	    .find("#inca-release article").each(function(i, e) {
// 		var article = $(e);
// 		targets.push({
// 		    name: "Release " + article.find("h2,h4").text(),
// 		    searchTerms: "Release " + article.find("h2,h4").text() + ",fyren,inca",
// 		    url: url + "#release" + article.find("h2,h4").text(),
// 		    details: article.html(),
// 		});
// 	    });
// 	return targets;
//     }
// }

// TargetLoader.add({
//     name: "fyren-main",
//    url: "https://fyren/intranet/main.html",
//     parser: parseIncaReleases("https://fyren/intranet/main.html"),
//     onLoadError: function(request) {
// 	notifyError("<p>Kunde inte läsa från Fyren</p>");
//     }
// });

// TargetLoader.add({
//     name: "fyren-operations",
//     // url: "https://fyren/Intranet/itello/operations/operations.html",
//     // parser: parseIncaReleases("https://fyren/Intranet/itello/operations/operations.html"),
//     url: "https://fyren/intranet/itello/productmanagement/Inca.html",
//     parser: parseIncaReleases("https://fyren/intranet/itello/productmanagement/Inca.html"),
//     onLoadError: function(request) {
// 	notifyError("<p>Kunde inte läsa från Operations</p>");
//     }
// });

// TargetLoader.add({
//     name: "personal",
//     url: "https://fyren/intranet/itello/stab/personal/personal.html",
//     parser: function(text) {
// 	var targets = [];
// 	$("<div>").html(text)
// 	    .find(".personalLink").each(function(i, e) {
// 		var a = $(e);
// 		targets.push({
// 		    name: a.text(),
// 		    url: "https://fyren/intranet/itello/stab/personal/" + a.attr("href"),
// 		    searchTerms: a.text() + ",fyren,personal",
// 		});
// 	    });
// 	return targets;
//     },
//     onLoadError: function(request) {
// 	notifyError("<p>Kunde inte hämta personalsidan</p>");
//     }
// });

// TargetLoader.add({
//     name: "personal-halsa",
//     url: "https://fyren/intranet/itello/stab/halsoportal/halsa.html",
//     parser: function(text) {
// 	var targets = [];
// 	$("<div>").html(text)
// 	    .find("td").each(function(i, e) {
// 		var td = $(e);
// 		targets.push({
// 		    name: td.find("h2").text(),
// 		    url: "https://fyren/intranet/itello/stab/halsoportal/halsa.html" + "#" + td.find("h2").text(),
// 		    searchTerms: td.find("h2").text() + ",fyren,personal,hälsa",
// 		    details: td.html(),
// 		});
// 	    });
// 	log(targets);
// 	return targets;
//     },
//     onLoadError: function(request) {
// 	notifyError("<p>Kunde inte hämta personalsidan</p>");
//     }
// });

TargetLoader.add({
    name: "blamefactory",
    url: "https://pcloud.itello.se/inca/blame-factory/js/blame.js",
    parser: function(text) {
	function urlFor(name) {
	    switch (name) {
	    case "Team Flux": return "https://itellohq.sharepoint.com/sites/LumeraProduct/SitePages/Flux.aspx";
	    case "Team Postit": return "https://itellohq.sharepoint.com/sites/LumeraProduct/SitePages/Post-It.aspx";
	    case "Team Infra": return "https://itellohq.sharepoint.com/sites/LumeraProduct/SitePages/Infra.aspx";
	    case "Team Listerine": return "https://itellohq.sharepoint.com/sites/LumeraProduct/SitePages/Listerine.aspx";
	    case "Team Pythagoras": return "https://itellohq.sharepoint.com/sites/LumeraProduct/SitePages/Pythagoras.aspx";
	    case "Team Pactum": return "https://itellohq.sharepoint.com/sites/LumeraProduct/SitePages/Pactum.aspx";
	    case "Team Knappverket": return "https://itellohq.sharepoint.com/sites/LumeraProduct/SitePages/Knappverket.aspx";
	    case "Team Solvo": return "https://itellohq.sharepoint.com/sites/LumeraProduct/SitePages/Solvo.aspx";
	    case "Team FriendsWithBenefitAgreements": return "https://itellohq.sharepoint.com/sites/LumeraProduct/SitePages/Friends-With-Benefit-Agreements.aspx";
	    default: return "https://itellohq.sharepoint.com/sites/LumeraProduct";
	    }
	}
	let targets = [];
	let teams = {}
	let re = /se\.itello\.vertigo\.([^']+).+(framework|real)Code\(([^\)]+)/g;
	let match;
	while ((match = re.exec(text)) !== null) {
	    let name = match[3].replace(".", " ");
	    let team = teams[name] || [];
	    team.push(match[1]);
	    teams[name] = team;
	}
	$.each(teams, function(k, v) {
	    targets.push({
		name: k,
		url: urlFor(k),
		details: `<ul><li>${v.join("</li><li>")}</li></ul>`,
		searchTerms: `${k},${v.join(",")}`,
	    });
	});
	return targets;
    },
    onLoadError: function(request) {
	notifyError("<p>Kunde inte hämta info från BlameFactory</p>");
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

function loadTheme() {
    log("loadTheme()");
    var theme = localStorage["theme"];
    if (theme) {
	$(`head link[rel="stylesheet"]`).last().after(`<link href="/css/themes/${theme}.css" rel="stylesheet" />`);
    }
}

function executeCommand(input) {
    log("executeCommand()");
    if (!input.startsWith(":")) return false;
    let command = input.split(" ")[0].substr(1);
    let arg = input.split(" ", 2)[1];
    if (command == "theme") {
	arg = arg == "default" ? undefined : arg
	localStorage["theme"] = arg;
	loadTheme();
	return true;
    }
    return false;
}

document.addEventListener('DOMContentLoaded', function() {
    loadTheme();

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

    // setup info link
    $("#info").click(function() {
	window.open(chrome.runtime.getURL("info.html"));
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
	    if (executeCommand($("#input").val())) {
		return true;
	    }
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
