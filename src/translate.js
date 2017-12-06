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

class PSStreams {
    static load(callback) {
	this.fetch(callback);
    }

    static fetch(callback) {
	let streams = this.parse(fakeStreams);
	callback(streams);
    }

    static parse(html) {
	let streams = [];
	$("<div>").html(html)
	    .find("a[title=Ström]").each(function(i, e) {
		let a = $(e);
		if (a.text().startsWith("Inca ")) {
		    streams.push({
			name: a.text(),
			link: "https://forastero/vertigo/maintenanceps/" + a.attr("href"),
		    });
		}
	    });
	streams.sort((a, b) => a.name < b.name ? 1 : -1); // Latest Inca version first
	return streams;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    let input = $("#input");
    let button = $("button");
    let params = new URL(document.location).searchParams;
    if (params.has("search")) {
	input.val(params.get("search"));
    }

    PSStreams.load(function(streams) {
	button.removeAttr("disabled");
	let select = $("#stream");
	select.empty();
	for(let i = 0; i < streams.length; i++) {
	    select.append($("<option>").append(streams[i].name));
	}
	if (params.has("search")) {
	    search(params.get("search"), streams[0].name);
	}
    });

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
var fakeStreams = `
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv=Content-Type content="text/html; charset=windows-1252" />
    <title>ProductStudio</title>
    <script type="text/javascript" src="../static/lib/jquery/js/jquery-1.7.2.min.js"></script>
    <link type="text/css" href="../static/lib/select2/select2.css" rel="stylesheet" />
    <script src="../static/lib/select2/select2.min.js"></script>
    <link rel="stylesheet" href="../static/productstudio.css" />
    <script src="../static/toggle.js" type="text/javascript"></script>
    <script type="text/javascript">
      $(document).ready(function(){
      $("select").select2({placeholder: "", allowClear: true});
      });
    </script>
  </head>
  <body>
    <DIV class="mainMenu">
      <UL>
	<LI class="enabled">
	  <a href="reInit">Ladda om</a>
	</LI>
	<LI class="enabled">
	  <a href="objectList?className=PS_STREAM">Strömmar</a>
	</LI>
	<LI class="enabled">
	  <a href="objectList?className=PS_ISSUE">Ärenden</a>
	</LI>
      </UL>
    </DIV>
    <DIV class="version info">
      <a href="about">PS5_b20160623_77</a>
    </DIV>
    <DIV class="workArea">
      <DIV class="menu-spec">
	<UL>
	  <LI>
	    <H2>Åtgärder</H2>
	    <UL>
	      <LI class="enabled">
		<a href="createObjectGui?className=PS_STREAM">Ny ström</a>
	      </LI>
	    </UL>
	  </LI>
	</UL>
	<UL>
	  <LI>
	    <H2>Visa</H2>
	    <UL>
	      <LI class="enabled">
		<a href="objectList?className=PS_SNAPSHOT">Visa snapshots</a>
	      </LI>
	    </UL>
	  </LI>
	</UL>
	<UL>
	  <LI>
	    <H2>Utveckling</H2>
	    <UL>
	    </UL>
	  </LI>
	</UL>
      </DIV>
      <DIV class="heading">Strömmar</DIV>
      <UL>
	<LI class="locked">
	  <a href="viewObject?className=PS_SNAPSHOT&objectId=2423" title="Snapshot">Inca 15.3.0.14 (rot)</a>
	</LI>
	<UL>
	  <LI class="locked">
	    <a href="viewObject?className=PS_STREAM&objectId=2208" title="Ström">Inca 15.4</a>
	  </LI>
	  <UL>
	    <LI class="locked">
	      <a href="viewObject?className=PS_STREAM&objectId=2209" title="Ström">Inca 16.1</a>
	    </LI>
	    <UL>
	      <LI class="locked">
		<a href="viewObject?className=PS_STREAM&objectId=2424" title="Ström">Inca 16.2</a>
	      </LI>
	      <UL>
		<LI class="locked">
		  <a href="viewObject?className=PS_STREAM&objectId=2472" title="Ström">Inca 16.3</a>
		</LI>
		<UL>
		  <LI>
		    <a href="viewObject?className=PS_STREAM&objectId=2685" title="Ström">Ändra gruppering på debiteringsunderlag</a>
		  </LI>
		</UL>
		<UL>
		  <LI>
		    <a href="viewObject?className=PS_STREAM&objectId=2643" title="Ström">Inca 16.4</a>
		  </LI>
		  <UL>
		    <LI class="locked">
		      <a href="viewObject?className=PS_STREAM&objectId=2823" title="Ström">Inca 16.4.1 (SPP)</a>
		    </LI>
		    <UL>
		      <LI>
			<a href="viewObject?className=PS_STREAM&objectId=2728" title="Ström">SPP Migrering (ej prod)</a>
		      </LI>
		      <UL>
			<LI class="locked">
			  <a href="viewObject?className=PS_STREAM&objectId=2671" title="Ström">Inca 17.1</a>
			</LI>
			<UL>
			  <LI>
			    <a href="viewObject?className=PS_STREAM&objectId=2930" title="Ström">Engelsk text på inbetalningsavtalsprodukten </a>
			  </LI>
			</UL>
			<UL>
			  <LI>
			    <a href="viewObject?className=PS_STREAM&objectId=2903" title="Ström">Inca 17.2</a>
			  </LI>
			  <UL>
			    <LI>
			      <a href="viewObject?className=PS_STREAM&objectId=3071" title="Ström">Beräkningsgrunder och mallar (SPP)</a>
			    </LI>
			    <UL>
			      <LI>
				<a href="viewObject?className=PS_STREAM&objectId=2932" title="Ström">Inca 17.3</a>
			      </LI>
			      <UL>
				<LI>
				  <a href="viewObject?className=PS_STREAM&objectId=3174" title="Ström">Nordnet Norge - IPS till PKB</a>
				</LI>
			      </UL>
			      <UL>
				<LI>
				  <a href="viewObject?className=PS_STREAM&objectId=3086" title="Ström">Inca 17.4</a>
				</LI>
				<UL>
				  <LI>
				    <a href="viewObject?className=PS_STREAM&objectId=3172" title="Ström">Nordnet Norge - IPS 2.0</a>
				  </LI>
				</UL>
				<UL>
				  <LI>
				    <a href="viewObject?className=PS_STREAM&objectId=3136" title="Ström">Inca 17.4.1</a>
				  </LI>
				  <UL>
				    <LI>
				      <a href="viewObject?className=PS_STREAM&objectId=3183" title="Ström">Inca 18.1</a>
				    </LI>
				    <UL>
				      <LI>
					<a href="viewObject?className=PS_STREAM&objectId=3267" title="Ström">Fondhandel_2</a>
				      </LI>
				    </UL>
				    <UL>
				      <LI>
					<a href="viewObject?className=PS_STREAM&objectId=3261" title="Ström">Fondhandel</a>
				      </LI>
				    </UL>
				    <UL>
				      <LI>
					<a href="viewObject?className=PS_STREAM&objectId=3245" title="Ström">Skandia - omdöpningar fondhantering</a>
				      </LI>
				    </UL>
				    <UL>
				      <LI>
					<a href="viewObject?className=PS_STREAM&objectId=3206" title="Ström">Falken 2</a>
				      </LI>
				    </UL>
				    <UL>
				      <LI>
					<a href="viewObject?className=PS_STREAM&objectId=3142" title="Ström">STÖT Omläggning Ö och T Folksam</a>
				      </LI>
				    </UL>
				    <UL>
				      <LI>
					<a href="viewObject?className=PS_STREAM&objectId=3044" title="Ström">Kritisk sjukdom Swedbank</a>
				      </LI>
				    </UL>
				  </UL>
				  <UL>
				    <LI>
				      <a href="viewObject?className=PS_STREAM&objectId=3092" title="Ström">SPP ÅS-Å</a>
				    </LI>
				  </UL>
				</UL>
				<UL>
				  <LI>
				    <a href="viewObject?className=PS_STREAM&objectId=3134" title="Ström">dröjsmålsränta 1418</a>
				  </LI>
				</UL>
				<UL>
				  <LI>
				    <a href="viewObject?className=PS_STREAM&objectId=3078" title="Ström">Utbetalningsålder DK-rate</a>
				  </LI>
				</UL>
				<UL>
				  <LI>
				    <a href="viewObject?className=PS_STREAM&objectId=2918" title="Ström">Nordea implementation</a>
				  </LI>
				</UL>
			      </UL>
			      <UL>
				<LI>
				  <a href="viewObject?className=PS_STREAM&objectId=3072" title="Ström">SPP (DKV samt EP med PB)</a>
				</LI>
			      </UL>
			      <UL>
				<LI>
				  <a href="viewObject?className=PS_STREAM&objectId=3033" title="Ström">Värdeinstrumentsubud på produktversion</a>
				</LI>
			      </UL>
			      <UL>
				<LI class="locked">
				  <a href="viewObject?className=PS_STREAM&objectId=3006" title="Ström">Migrering</a>
				</LI>
			      </UL>
			      <UL>
				<LI>
				  <a href="viewObject?className=PS_STREAM&objectId=2983" title="Ström">Danska utskrifter 593</a>
				</LI>
			      </UL>
			      <UL>
				<LI>
				  <a href="viewObject?className=PS_STREAM&objectId=2947" title="Ström">Dröjsmålsränta 541</a>
				</LI>
			      </UL>
			      <UL>
				<LI>
				  <a href="viewObject?className=PS_STREAM&objectId=2849" title="Ström">Bra adress</a>
				</LI>
			      </UL>
			      <UL>
				<LI>
				  <a href="viewObject?className=PS_STREAM&objectId=2631" title="Ström">Initial uppsättning Handelsbanken</a>
				</LI>
			      </UL>
			    </UL>
			  </UL>
			  <UL>
			    <LI>
			      <a href="viewObject?className=PS_STREAM&objectId=2862" title="Ström">Generisk miljö</a>
			    </LI>
			  </UL>
			</UL>
			<UL>
			  <LI>
			    <a href="viewObject?className=PS_STREAM&objectId=2882" title="Ström">Automatiska överföringar utbetalningsavtal</a>
			  </LI>
			</UL>
			<UL>
			  <LI>
			    <a href="viewObject?className=PS_STREAM&objectId=2876" title="Ström">Movestic Riskförsäkring</a>
			  </LI>
			</UL>
			<UL>
			  <LI>
			    <a href="viewObject?className=PS_STREAM&objectId=2867" title="Ström">Split tax model</a>
			  </LI>
			</UL>
			<UL>
			  <LI>
			    <a href="viewObject?className=PS_STREAM&objectId=2853" title="Ström">Inbetalningsmotorn</a>
			  </LI>
			</UL>
			<UL>
			  <LI class="locked">
			    <a href="viewObject?className=PS_STREAM&objectId=2801" title="Ström">Ny planmodell</a>
			  </LI>
			</UL>
			<UL>
			  <LI>
			    <a href="viewObject?className=PS_STREAM&objectId=2785" title="Ström">Periodisk indirekt provision på trad</a>
			  </LI>
			</UL>
			<UL>
			  <LI class="locked">
			    <a href="viewObject?className=PS_STREAM&objectId=2672" title="Ström">Scheduler SB12</a>
			  </LI>
			</UL>
		      </UL>
		    </UL>
		  </UL>
		  <UL>
		    <LI>
		      <a href="viewObject?className=PS_STREAM&objectId=2705" title="Ström">Annullationsdatum trad</a>
		    </LI>
		  </UL>
		  <UL>
		    <LI>
		      <a href="viewObject?className=PS_STREAM&objectId=2694" title="Ström">AR22053 - Utskriftsmall och inbetalningskonfig</a>
		    </LI>
		  </UL>
		</UL>
		<UL>
		  <LI>
		    <a href="viewObject?className=PS_STREAM&objectId=2554" title="Ström">Brutto via WS</a>
		  </LI>
		</UL>
	      </UL>
	    </UL>
	    <UL>
	      <LI>
		<a href="viewObject?className=PS_STREAM&objectId=2344" title="Ström">Generell trad</a>
	      </LI>
	    </UL>
	  </UL>
	</UL>
	<UL>
	  <LI class="locked">
	    <a href="viewObject?className=PS_STREAM&objectId=1993" title="Ström">Avtalspension Folksam (sparad till senare)</a>
	  </LI>
	</UL>
      </UL>
    </DIV>
  </body>
</html>
`
