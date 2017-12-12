/* Used for fetching and caching targets from a resource */
function TargetLoader(type, name, uri, ttl, parserFunction, onLoadError, targetReceiver) {
    this.name = name;
    this.uri = uri;
    this.ttl = ttl;
    this.parse = parserFunction; // called with request.responseText
    this.onLoadError = onLoadError;
    this.targetReceiver = targetReceiver;
    this.fetch = type == "web" ? this.fetchFromWeb : this.fetchFromFile;
}

TargetLoader.prototype.fetchFromWeb = function() {
    log(this.name + ".fetchFromWeb() - requesting " + this.uri);
    var loader = this;
    var request = new XMLHttpRequest();
    request.open("GET", this.uri, true);
    request.overrideMimeType("application/x-www-form-urlencoded; charset=iso-8859-1");
    request.onreadystatechange = function() {
	if (request.readyState != 4) return;
	if (request.status == 200) {
	    loader.onXHRLoad(request.responseText);
	} else {
	    loader.onXHRError(request);
	}
	Spinner.popTask();
    };
    request.send();
};

TargetLoader.prototype.fetchFromFile = function() {
    log(this.name + ".fetchFromFile() - requesting " + this.uri);
    var loader = this;
    var request = new XMLHttpRequest();
    request.open("GET", this.uri, true);
    request.overrideMimeType("application/x-www-form-urlencoded; charset=iso-8859-1");
    request.onload = function(e) {
	loader.onXHRLoad(request.responseText);
	Spinner.popTask();
    };
    request.onerror = function(e) {
	loader.onXHRError(request);
	Spinner.popTask();
    };
    request.send();
};

TargetLoader.prototype.onXHRLoad = function(responseText) {
    log(this.name + ".fetch() - loaded " + this.uri);
    var targets = this.parse(responseText);
    this.save(targets);
    this.targetReceiver(targets);
};

TargetLoader.prototype.onXHRError = function(request) {
    log(this.name + ".fetch() - failed to load " + this.uri);
    if (this.onLoadError)
	this.onLoadError(request);
};

TargetLoader.prototype.load = function() {
    log(this.name + ".load()");
    Spinner.pushTask();
    var loader = this;
    chrome.storage.local.get([loader.name + "-version",
			      loader.name + "-date",
			      loader.name + "-targets"], function(items) {
	var version = items[loader.name + "-version"];
	var date = items[loader.name + "-date"];
	if (version == TARGET_VERSION && date && ((new Date().getTime() - date) / (1000 * loader.ttl)) < 1) {
	    log("adding targets for " + loader.name);
	    loader.targetReceiver(items[loader.name + "-targets"]);
	    Spinner.popTask();
	} else {
	    loader.fetch();
	}
    });
};

TargetLoader.prototype.save = function(targets) {
    log(this.name + ".save()");
    var args = {};
    args[this.name + "-version"] = TARGET_VERSION;
    args[this.name + "-date"] = new Date().getTime();
    args[this.name + "-targets"] = targets;
    chrome.storage.local.set(args);
};

TargetLoader.loaders = [];

TargetLoader.add = function(args) {
    log("Adding loader - " + args.name + " / " + (args.url || args.file));
    TargetLoader.loaders.push(new TargetLoader(
	args.url ? "web" : "file",
	args.name,
	args.url || args.file,
	args.ttl === undefined ? 60*60*24 : args.ttl,
	args.parser,
	args.onLoadError,
	args.targetReceiver || TargetLoader.defaultTargetReceiver
    ));
};

TargetLoader.loadAll = function(forceReload=false) {
    log("TargetLoader.loadAll(forceReload=" + forceReload + ")");
    log(TargetLoader.loaders);
    $(TargetLoader.loaders).each(function(i, loader) {
	log("loading " + loader.name);
	if (forceReload) {
	    Spinner.pushTask();
	    loader.fetch();
	} else {
	    loader.load();
	}
    });
}
