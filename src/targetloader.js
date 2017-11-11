/* Used for fetching and caching targets from a resource */
function TargetLoader(name, url, ttl, parserFunction, onLoadError, targetReceiver) {
    this.name = name;
    this.url = url;
    this.ttl = ttl;
    this.parse = parserFunction; // called with request.responseText
    this.onLoadError = onLoadError;
    this.targetReceiver = targetReceiver;
}

TargetLoader.prototype.fetch = function() {
    console.log(this.name + ".fetch() - requesting " + this.url);
    var loader = this;
    var request = new XMLHttpRequest();
    request.open("GET", this.url, true);
    request.onreadystatechange = function() {
	if (request.readyState != 4) return;
	if (request.status == 200) {
	    console.log(loader.name + ".fetch() - loaded " + loader.url);
	    var targets = loader.parse(request.responseText);
	    loader.save(targets);
	    loader.targetReceiver(targets);
	} else {
	    console.log(loader.name + ".fetch() - failed to load " + loader.url);
	    if (loader.onLoadError)
		loader.onLoadError(request);
	}
	Spinner.popTask();
    };
    request.send();
};

TargetLoader.prototype.load = function() {
    console.log(this.name + ".load()");
    Spinner.pushTask();
    var loader = this;
    chrome.storage.local.get([loader.name + "-version",
			      loader.name + "-date",
			      loader.name + "-targets"], function(items) {
	var version = items[loader.name + "-version"];
	var date = items[loader.name + "-date"];
	if (version == TARGET_VERSION && date && ((new Date().getTime() - date) / (1000 * loader.ttl)) < 1) {
	    console.log("adding targets for " + loader.name);
	    loader.targetReceiver(items[loader.name + "-targets"]);
	    Spinner.popTask();
	} else {
	    loader.fetch();
	}
    });
};

TargetLoader.prototype.save = function(targets) {
    console.log(this.name + ".save()");
    var args = {};
    args[this.name + "-version"] = TARGET_VERSION;
    args[this.name + "-date"] = new Date().getTime();
    args[this.name + "-targets"] = targets;
    chrome.storage.local.set(args);
};

TargetLoader.loaders = [];

TargetLoader.add = function(args) {
    console.log("Adding loader - " + args.name + " / " + args.url);
    TargetLoader.loaders.push(new TargetLoader(
	args.name,
	args.url,
	args.ttl === undefined ? 60*60*24 : args.ttl,
	args.parser,
	args.onLoadError,
	args.targetReceiver || TargetLoader.defaultTargetReceiver
    ));
};

TargetLoader.loadAll = function(forceReload=false) {
    console.log("TargetLoader.loadAll(forceReload=" + forceReload + ")");
    console.log(TargetLoader.loaders);
    $(TargetLoader.loaders).each(function(i, loader) {
	console.log("loading " + loader.name);
	if (forceReload) {
	    Spinner.pushTask();
	    loader.fetch();
	} else {
	    loader.load();
	}
    });
}
