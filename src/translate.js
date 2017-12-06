// https://forastero/vertigo/maintenanceps-api/getObjects?className=SYSTEM_TEXT_TABLE&itemCount=30&streamName=Inca+17.3&attr[]=TEXT_STRING&attr[]=LANGUAGE&value[]=%25address%25&value[]=35509
// https://forastero/vertigo/maintenanceps-api/getObjects?className=SYSTEM_TEXT_TABLE&itemCount=50&streamName=Inca+17.3&attr[]=TEXT_OBJECT&attr[]=TEXT_OBJECT_TYPE&attr[]=LANGUAGE&value[]=%25address%25&value[]=ATTRIBUTE&value[]=35509
// https://forastero/vertigo/maintenanceps-api/getObjects?className=SYSTEM_TEXT_TABLE&itemCount=30&streamName=Inca+17.3&attr[]=TEXT_OBJECT_VALUE&attr[]=TEXT_OBJECT_TYPE&attr[]=LANGUAGE&value[]=address&value[]=CONSTANT&value[]=35509
// https://forastero/vertigo/maintenanceps-api/getObjects?className=SYSTEM_TEXT_TABLE&itemCount=30&streamName=Inca+17.3&attr[]=TEXT_OBJECT&attr[]=TEXT_OBJECT_TYPE&attr[]=LANGUAGE&value[]=address&value[]=CONSTANT&value[]=35509

class Search {
    constructor(text, streamName, onAddResults) {
	this.text = text;
	this.streamName = streamName;
	this.onAddResults = onAddResults;
	this.parts = [
	    this.newSearchPart(["TEXT_STRING"], ["%25"+text+"%25"]),
	    this.newSearchPart(["TEXT_OBJECT", "TEXT_OBJECT_TYPE"], ["%25"+text+"%25", "ATTRIBUTE"]),
	    this.newSearchPart(["TEXT_OBJECT_VALUE", "TEXT_OBJECT_TYPE"], [text, "CONSTANT"]),
	    this.newSearchPart(["TEXT_OBJECT", "TEXT_OBJECT_TYPE"], [text, "CONSTANT"]),
	];
	this.results = [];
    }

    newSearchPart(attrs, values) {
	attrs.push("LANGUAGE");
	values.push("35509");
	return new SearchPart(this, this.streamName, attrs, values);
    }

    startSearch() {
	for(let i = 0; i < this.parts.length; i++) {
	    let part = this.parts[i];
	    setTimeout(function() {
		part.startSearch();
	    }, 0);
	}
    }

    addResults(results) {
	Array.prototype.push.apply(this.results, results);
	let s = this;
	setTimeout(function() {
	    s.onAddResults(results);
	}, 0);
    }
}

class SearchPart {
    constructor(search, streamName, attrs, values) {
	this.search = search;
	this.streamName = streamName.replace(/ /g, "+");
	this.itemCount = 30;
	this.startIndex = 0;
	this.attrs = attrs;
	this.values = values;
    }

    get urlParams() {
	return "&startIndex=" + this.startIndex + "&itemCount=" + this.itemCount + "&streamName=" + this.streamName
	    + this.attrs.map(a => "&attr[]=" + a).join("")
	    + this.values.map(a => "&value[]=" + a).join("");
    }

    get url() {
	return "https://forastero/vertigo/maintenanceps-api/getObjects?className=SYSTEM_TEXT_TABLE" + this.urlParams;
    }

    startSearch() {
	let s = this;
	fetchTranslation(this.url, function(r) { s.onResponse(r); });
    }

    onResponse(response) {
	let properJSON = response.replace(/(['"])?([a-zA-ZåäöÅÄÖ_]+)(['"])?:/g, '"$2":');
	let obj = JSON.parse(properJSON);
	this.search.addResults(obj.objects);
	if (obj.meta.moreRowsAvailable) {
	    this.startIndex += this.itemCount;
	    this.start();
	}
    }
}

function search(text, incaVersion) {
    let table = $("table.table");
    table.empty();
    let s = new Search(text, incaVersion, onAddResults);
    s.startSearch();
    log(s);
}

function onAddResults(results) {
    let table = $("table.table");
    for (let i = 0; i < results.length; i++) {
	let r = results[i];
	let tr = $("<tr>");
	tr.append($("<td>").append(r.TEXT_OBJECT));
	tr.append($("<td>").append(r.TEXT_OBJECT_VALUE));
	tr.append($("<td>").append(r.TEXT_STRING));
	table.append(tr);
    }
}

function fetchTranslation(url, callback) {
    // let request = new XMLHttpRequest();
    // let url = "url";
    // request.open("GET", url, true);
    // request.onreadystatechange = function() {
    // 	if (request.readyState != 4) return;
    // 	if (request.status == 200) {
    callback(fakeResponse);
    // 	} else {
    // 	}
    // };
    // request.send();
}

document.addEventListener('DOMContentLoaded', function() {
    let input = $("#input");
    let params = new URL(document.location).searchParams;
    if (params.has("search")) {
	input.val(params.get("search"));
    }
    input.focus();
    $("form").submit(function(event) {
	let text = input.val().trim();
	if (text) {
	    search(text, $("#stream").val());
	}
	return false;
    });
});

var fakeResponse = `
{
	objects: [
		{
			CREATED_BY: "ITELLO\dby",
			CREATED_DATE: "2015-08-17 15:22:57.293",
			LANGUAGE: "SV",
			LATEST_CHANGED_BY: "ITELLO\jws",
			LATEST_CHANGED_DATE: "2015-08-25 11:05:29.777",
			Obekräftad: "1",
			TEXT_OBJECT: "TaxError.PersonMissingAddressWhenCreatingIncomeStatementOutfile",
			TEXT_OBJECT_TYPE: "MESSAGE",
			TEXT_OBJECT_VALUE: "",
			TEXT_STRING: "Person saknar address. Personen måste ha rapporterad address för att dess KU ska kunna rapporteras",
			TEXT_TABLE_ID: "265912",
			TEXT_TYPE: "LABEL"
		},
		{
			CREATED_BY: "ITELLO\\fhi",
			CREATED_DATE: "2010-07-29 12:50:59.833",
			LANGUAGE: "SV",
			LATEST_CHANGED_BY: "",
			LATEST_CHANGED_DATE: "",
			TEXT_OBJECT: "OrganizationError.AddMemberToOrganizationBeforeAddingAddress",
			TEXT_OBJECT_TYPE: "MESSAGE",
			TEXT_OBJECT_VALUE: "",
			TEXT_STRING: "Måsta lägga till ombud till en organisation innan en specifik address kan läggas till.",
			TEXT_TABLE_ID: "59382",
			TEXT_TYPE: "LABEL"
		}
	],
	meta: {
		startIndex: 0,
		itemCount: 30,
		moreRowsAvailable: false
	}
}
`;
