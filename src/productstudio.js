// https://forastero/vertigo/maintenanceps-api/getObjects?className=SYSTEM_TEXT_TABLE&itemCount=30&streamName=Inca+17.3&attr[]=TEXT_STRING&attr[]=LANGUAGE&value[]=%25address%25&value[]=35509
// https://forastero/vertigo/maintenanceps-api/getObjects?className=SYSTEM_TEXT_TABLE&itemCount=50&streamName=Inca+17.3&attr[]=TEXT_OBJECT&attr[]=TEXT_OBJECT_TYPE&attr[]=LANGUAGE&value[]=%25address%25&value[]=ATTRIBUTE&value[]=35509
// https://forastero/vertigo/maintenanceps-api/getObjects?className=SYSTEM_TEXT_TABLE&itemCount=30&streamName=Inca+17.3&attr[]=TEXT_OBJECT_VALUE&attr[]=TEXT_OBJECT_TYPE&attr[]=LANGUAGE&value[]=address&value[]=CONSTANT&value[]=35509
// https://forastero/vertigo/maintenanceps-api/getObjects?className=SYSTEM_TEXT_TABLE&itemCount=30&streamName=Inca+17.3&attr[]=TEXT_OBJECT&attr[]=TEXT_OBJECT_TYPE&attr[]=LANGUAGE&value[]=address&value[]=CONSTANT&value[]=35509

var spinner;

class Spinner {
    constructor(element) {
	this.element = element;
	this.counter = 0;
    }

    pushTask() {
	this.counter++;
	if (this.counter > 0) {
	    this.element.show();
	}
    }

    popTask() {
	this.counter--;
	if (this.counter == 0) {
	    this.element.hide();
	}
    }
}

class Search {
    constructor(className, streamName, text) {
	this.className = className;
	this.streamName = streamName;
	this.text = text;
	this.onAddResults = null;
	this.attributes = [];
	this.parts = [];
	this.results = [];
    }

    setClassName(className) {
	this.className = className;
    }

    setOnAddResults(onAddResults) {
	this.onAddResults = onAddResults;
    }

    /* Will be applied to all search parts */
    addAttribute(name, value) {
	this.attributes.push({name: name, value: value});
    }

    addSearchPart(builder) {
	let a = builder(encodeURI(this.text));
	let attrs = a[0];
	let values = a[1];
	this.attributes.map(a => {
	    attrs.push(a.name);
	    values.push(a.value);
	});
	this.parts.push(new SearchPart(this, this.streamName, attrs, values));
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
	    s.onAddResults(s.text, results);
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
	return "className=" + this.search.className
	    + "&startIndex=" + this.startIndex
	    + "&itemCount=" + this.itemCount
	    + "&streamName=" + this.streamName
	    + this.attrs.map(a => "&attr[]=" + a).join("")
	    + this.values.map(a => "&value[]=" + a).join("");
    }

    get url() {
	return "https://forastero/vertigo/maintenanceps-api/getObjects?" + this.urlParams;
    }

    startSearch() {
	let s = this;
	spinner.pushTask()
	fetchTranslation(this.url, function(r) {
	    spinner.popTask()
	    if (r) {
		s.onResponse(r);
	    }
	});
    }

    onResponse(response) {
	let json = JSON.parse(response);
	this.search.addResults(json.objects);
	if (json.meta.moreRowsAvailable) {
	    this.startIndex += this.itemCount;
	    this.startSearch();
	}
    }
}

function search(text, incaVersion) {
    let table = $("#results");
    table.empty();

    let cls = $("#class").val();
    let s = new Search(cls, incaVersion, text);

    if (cls == "SYSTEM_TEXT_TABLE")	searchSYSTEM_TEXT_TABLE(s);
    else if (cls == "MRULE")		searchMRULE(s);

    s.startSearch();
    log(s);
}

function searchSYSTEM_TEXT_TABLE(s) {
    s.addAttribute("LANGUAGE", $("#language").val());
    s.addSearchPart(encodedText => [["TEXT_STRING"], ["%25"+encodedText+"%25"]]);
    s.addSearchPart(encodedText => [["TEXT_OBJECT"], ["%25"+encodedText+"%25"]]);
    s.addSearchPart(encodedText => [["TEXT_OBJECT_VALUE", "TEXT_OBJECT_TYPE"], [encodedText, "CONSTANT"]]);
    s.setOnAddResults((searchText, results) => {
	function highlight(text) {
	    return $("<span>").html(text.replace(new RegExp(searchText, "gi"), "<mark>$&</mark>"));
	}

	let table = $("#results");
	for (let i = 0; i < results.length; i++) {
	    let r = results[i];
	    let tr = $("<tr>");
	    tr.append($("<td>")
		      .append($("<span>").addClass("badge badge-secondary").append(r.TEXT_TYPE))
		      .append(" ")
		      .append($("<span>").addClass("badge badge-secondary").append(r.TEXT_OBJECT_TYPE))
		     );
	    tr.append($("<td>").append(highlight(r.TEXT_OBJECT)));
	    tr.append($("<td>").append(highlight(r.TEXT_OBJECT_VALUE)));
	    tr.append($("<td>").append(highlight(r.TEXT_STRING)));
	    table.append(tr);
	}
    });
}

function searchMRULE(s) {
    s.addSearchPart(encodedText => [["MRULE_ID"], [encodedText]]);
    s.addSearchPart(encodedText => [["RULE_NAME"], ["%25"+encodedText+"%25"]]);
    s.addSearchPart(encodedText => [["CLASS_NAME"], ["%25"+encodedText+"%25"]]);
    s.addSearchPart(encodedText => [["ATTRIBUTE_NAME"], ["%25"+encodedText+"%25"]]);
    s.setOnAddResults((searchText, results) => {
	function highlight(text) {
	    return $("<span>").html(text.replace(new RegExp(searchText, "gi"), "<mark>$&</mark>"));
	}

	let table = $("#results");
	for (let i = 0; i < results.length; i++) {
	    let r = results[i];
	    let tr = $('<tr class="clickable">');
	    tr.append($("<td>").append(highlight(r.MRULE_ID)));
	    tr.append($("<td>").append(highlight(r.CLASS_NAME)));
	    tr.append($("<td>").append(highlight(r.ATTRIBUTE_NAME)));
	    tr.append($("<td>").append(highlight(r.RULE_NAME)));
	    tr.append($("<td>").append(highlight(r.RULE_STANDARD_VAL_DESC)));
	    tr.append($("<td>").append(highlight(r.RULE_VALUE_DESCRIPTION)));
	    tr.click(() => {
		$("#rowModal .modal-title").text(r.MRULE_ID + " - " + r.RULE_NAME);
		let dl = $('<dl class="row">');
		Object.keys(r).forEach((key, index) => {
		    // Highlight only the values of attributes that was searched
		    let value = ["MRULE_ID", "RULE_NAME", "CLASS_NAME", "ATTRIBUTE_NAME"].includes(key) ?
			highlight(r[key]) : r[key];
		    dl.append($('<dt class="col-sm-3">').append(key));
		    dl.append($('<dd class="col-sm-9">').append($("<pre>").append(value)));
		});
		$("#rowModal .modal-body").html(dl);
		$("#rowModal").modal("show");
	    });
	    table.append(tr);
	}
    });
}

function fetchTranslation(url, callback) {
//    callback(fakeResponse);
    fetchUrl(url, callback);
}

function fetchUrl(url, callback) {
    let request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.onreadystatechange = function() {
	if (request.readyState != 4) return;
	if (request.status == 200) {
	    callback(request.responseText);
	} else {
	    callback(null);
	}
    };
    request.send();
}

class PSStreams {
    static load(callbacks) {
	this.fetch(callbacks);
    }

    static fetch(callbacks) {
	fetchUrl("https://forastero/vertigo/maintenanceps/", function(response) {
	    if (response) {
//		let streams = this.parse(fakeStreams);
		let streams = PSStreams.parse(response);
		callbacks.onLoad(streams);
	    } else {
		callbacks.onError();
	    }
	});
    }

    static parse(html) {
	let streams = [];
	$("<div>").html(html)
	    .find("a[title=Str�m]").each(function(i, e) {
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
    spinner = new Spinner($("#spinner"));
    let input = $("#input");
    let button = $("button");
    let params = new URL(document.location).searchParams;
    if (params.has("class")) {
	$("#class").val(params.get("class"));
    }
    if (params.has("search")) {
	input.val(params.get("search"));
    } else {
	input.focus();
    }

    PSStreams.load({
	onLoad: function(streams) {
	    button.removeAttr("disabled");
	    let select = $("#stream");
	    select.empty();
	    for(let i = 0; i < streams.length; i++) {
		select.append($("<option>").append(streams[i].name));
	    }
	    if (params.has("search")) {
		search(params.get("search"), streams[0].name);
	    }
	},
	onError: function() {
	    // TODO
	},
    });

    $("form").submit(function(event) {
	let text = input.val().trim();
	if (text) {
	    search(text, $("#stream").val());
	}
	return false;
    });

    $("#class").change(function() {
	$("#language").prop("disabled", $(this).val() != "SYSTEM_TEXT_TABLE");
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
			Obekr�ftad: "1",
			TEXT_OBJECT: "TaxError.PersonMissingAddressWhenCreatingIncomeStatementOutfile",
			TEXT_OBJECT_TYPE: "MESSAGE",
			TEXT_OBJECT_VALUE: "",
			TEXT_STRING: "Person saknar address. Personen m�ste ha rapporterad address f�r att dess KU ska kunna rapporteras",
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
			TEXT_STRING: "M�sta l�gga till ombud till en organisation innan en specifik address kan l�ggas till.",
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
	  <a href="objectList?className=PS_STREAM">Str�mmar</a>
	</LI>
	<LI class="enabled">
	  <a href="objectList?className=PS_ISSUE">�renden</a>
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
	    <H2>�tg�rder</H2>
	    <UL>
	      <LI class="enabled">
		<a href="createObjectGui?className=PS_STREAM">Ny str�m</a>
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
      <DIV class="heading">Str�mmar</DIV>
      <UL>
	<LI class="locked">
	  <a href="viewObject?className=PS_SNAPSHOT&objectId=2423" title="Snapshot">Inca 15.3.0.14 (rot)</a>
	</LI>
	<UL>
	  <LI class="locked">
	    <a href="viewObject?className=PS_STREAM&objectId=2208" title="Str�m">Inca 15.4</a>
	  </LI>
	  <UL>
	    <LI class="locked">
	      <a href="viewObject?className=PS_STREAM&objectId=2209" title="Str�m">Inca 16.1</a>
	    </LI>
	    <UL>
	      <LI class="locked">
		<a href="viewObject?className=PS_STREAM&objectId=2424" title="Str�m">Inca 16.2</a>
	      </LI>
	      <UL>
		<LI class="locked">
		  <a href="viewObject?className=PS_STREAM&objectId=2472" title="Str�m">Inca 16.3</a>
		</LI>
		<UL>
		  <LI>
		    <a href="viewObject?className=PS_STREAM&objectId=2685" title="Str�m">�ndra gruppering p� debiteringsunderlag</a>
		  </LI>
		</UL>
		<UL>
		  <LI>
		    <a href="viewObject?className=PS_STREAM&objectId=2643" title="Str�m">Inca 16.4</a>
		  </LI>
		  <UL>
		    <LI class="locked">
		      <a href="viewObject?className=PS_STREAM&objectId=2823" title="Str�m">Inca 16.4.1 (SPP)</a>
		    </LI>
		    <UL>
		      <LI>
			<a href="viewObject?className=PS_STREAM&objectId=2728" title="Str�m">SPP Migrering (ej prod)</a>
		      </LI>
		      <UL>
			<LI class="locked">
			  <a href="viewObject?className=PS_STREAM&objectId=2671" title="Str�m">Inca 17.1</a>
			</LI>
			<UL>
			  <LI>
			    <a href="viewObject?className=PS_STREAM&objectId=2930" title="Str�m">Engelsk text p� inbetalningsavtalsprodukten </a>
			  </LI>
			</UL>
			<UL>
			  <LI>
			    <a href="viewObject?className=PS_STREAM&objectId=2903" title="Str�m">Inca 17.2</a>
			  </LI>
			  <UL>
			    <LI>
			      <a href="viewObject?className=PS_STREAM&objectId=3071" title="Str�m">Ber�kningsgrunder och mallar (SPP)</a>
			    </LI>
			    <UL>
			      <LI>
				<a href="viewObject?className=PS_STREAM&objectId=2932" title="Str�m">Inca 17.3</a>
			      </LI>
			      <UL>
				<LI>
				  <a href="viewObject?className=PS_STREAM&objectId=3174" title="Str�m">Nordnet Norge - IPS till PKB</a>
				</LI>
			      </UL>
			      <UL>
				<LI>
				  <a href="viewObject?className=PS_STREAM&objectId=3086" title="Str�m">Inca 17.4</a>
				</LI>
				<UL>
				  <LI>
				    <a href="viewObject?className=PS_STREAM&objectId=3172" title="Str�m">Nordnet Norge - IPS 2.0</a>
				  </LI>
				</UL>
				<UL>
				  <LI>
				    <a href="viewObject?className=PS_STREAM&objectId=3136" title="Str�m">Inca 17.4.1</a>
				  </LI>
				  <UL>
				    <LI>
				      <a href="viewObject?className=PS_STREAM&objectId=3183" title="Str�m">Inca 18.1</a>
				    </LI>
				    <UL>
				      <LI>
					<a href="viewObject?className=PS_STREAM&objectId=3267" title="Str�m">Fondhandel_2</a>
				      </LI>
				    </UL>
				    <UL>
				      <LI>
					<a href="viewObject?className=PS_STREAM&objectId=3261" title="Str�m">Fondhandel</a>
				      </LI>
				    </UL>
				    <UL>
				      <LI>
					<a href="viewObject?className=PS_STREAM&objectId=3245" title="Str�m">Skandia - omd�pningar fondhantering</a>
				      </LI>
				    </UL>
				    <UL>
				      <LI>
					<a href="viewObject?className=PS_STREAM&objectId=3206" title="Str�m">Falken 2</a>
				      </LI>
				    </UL>
				    <UL>
				      <LI>
					<a href="viewObject?className=PS_STREAM&objectId=3142" title="Str�m">ST�T Oml�ggning � och T Folksam</a>
				      </LI>
				    </UL>
				    <UL>
				      <LI>
					<a href="viewObject?className=PS_STREAM&objectId=3044" title="Str�m">Kritisk sjukdom Swedbank</a>
				      </LI>
				    </UL>
				  </UL>
				  <UL>
				    <LI>
				      <a href="viewObject?className=PS_STREAM&objectId=3092" title="Str�m">SPP �S-�</a>
				    </LI>
				  </UL>
				</UL>
				<UL>
				  <LI>
				    <a href="viewObject?className=PS_STREAM&objectId=3134" title="Str�m">dr�jsm�lsr�nta 1418</a>
				  </LI>
				</UL>
				<UL>
				  <LI>
				    <a href="viewObject?className=PS_STREAM&objectId=3078" title="Str�m">Utbetalnings�lder DK-rate</a>
				  </LI>
				</UL>
				<UL>
				  <LI>
				    <a href="viewObject?className=PS_STREAM&objectId=2918" title="Str�m">Nordea implementation</a>
				  </LI>
				</UL>
			      </UL>
			      <UL>
				<LI>
				  <a href="viewObject?className=PS_STREAM&objectId=3072" title="Str�m">SPP (DKV samt EP med PB)</a>
				</LI>
			      </UL>
			      <UL>
				<LI>
				  <a href="viewObject?className=PS_STREAM&objectId=3033" title="Str�m">V�rdeinstrumentsubud p� produktversion</a>
				</LI>
			      </UL>
			      <UL>
				<LI class="locked">
				  <a href="viewObject?className=PS_STREAM&objectId=3006" title="Str�m">Migrering</a>
				</LI>
			      </UL>
			      <UL>
				<LI>
				  <a href="viewObject?className=PS_STREAM&objectId=2983" title="Str�m">Danska utskrifter 593</a>
				</LI>
			      </UL>
			      <UL>
				<LI>
				  <a href="viewObject?className=PS_STREAM&objectId=2947" title="Str�m">Dr�jsm�lsr�nta 541</a>
				</LI>
			      </UL>
			      <UL>
				<LI>
				  <a href="viewObject?className=PS_STREAM&objectId=2849" title="Str�m">Bra adress</a>
				</LI>
			      </UL>
			      <UL>
				<LI>
				  <a href="viewObject?className=PS_STREAM&objectId=2631" title="Str�m">Initial upps�ttning Handelsbanken</a>
				</LI>
			      </UL>
			    </UL>
			  </UL>
			  <UL>
			    <LI>
			      <a href="viewObject?className=PS_STREAM&objectId=2862" title="Str�m">Generisk milj�</a>
			    </LI>
			  </UL>
			</UL>
			<UL>
			  <LI>
			    <a href="viewObject?className=PS_STREAM&objectId=2882" title="Str�m">Automatiska �verf�ringar utbetalningsavtal</a>
			  </LI>
			</UL>
			<UL>
			  <LI>
			    <a href="viewObject?className=PS_STREAM&objectId=2876" title="Str�m">Movestic Riskf�rs�kring</a>
			  </LI>
			</UL>
			<UL>
			  <LI>
			    <a href="viewObject?className=PS_STREAM&objectId=2867" title="Str�m">Split tax model</a>
			  </LI>
			</UL>
			<UL>
			  <LI>
			    <a href="viewObject?className=PS_STREAM&objectId=2853" title="Str�m">Inbetalningsmotorn</a>
			  </LI>
			</UL>
			<UL>
			  <LI class="locked">
			    <a href="viewObject?className=PS_STREAM&objectId=2801" title="Str�m">Ny planmodell</a>
			  </LI>
			</UL>
			<UL>
			  <LI>
			    <a href="viewObject?className=PS_STREAM&objectId=2785" title="Str�m">Periodisk indirekt provision p� trad</a>
			  </LI>
			</UL>
			<UL>
			  <LI class="locked">
			    <a href="viewObject?className=PS_STREAM&objectId=2672" title="Str�m">Scheduler SB12</a>
			  </LI>
			</UL>
		      </UL>
		    </UL>
		  </UL>
		  <UL>
		    <LI>
		      <a href="viewObject?className=PS_STREAM&objectId=2705" title="Str�m">Annullationsdatum trad</a>
		    </LI>
		  </UL>
		  <UL>
		    <LI>
		      <a href="viewObject?className=PS_STREAM&objectId=2694" title="Str�m">AR22053 - Utskriftsmall och inbetalningskonfig</a>
		    </LI>
		  </UL>
		</UL>
		<UL>
		  <LI>
		    <a href="viewObject?className=PS_STREAM&objectId=2554" title="Str�m">Brutto via WS</a>
		  </LI>
		</UL>
	      </UL>
	    </UL>
	    <UL>
	      <LI>
		<a href="viewObject?className=PS_STREAM&objectId=2344" title="Str�m">Generell trad</a>
	      </LI>
	    </UL>
	  </UL>
	</UL>
	<UL>
	  <LI class="locked">
	    <a href="viewObject?className=PS_STREAM&objectId=1993" title="Str�m">Avtalspension Folksam (sparad till senare)</a>
	  </LI>
	</UL>
      </UL>
    </DIV>
  </body>
</html>
`
