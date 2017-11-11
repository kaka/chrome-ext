function Mode(args) {
    this.onEnterMode = args.onEnterMode || function() {};
    this.onExitMode = args.onExitMode || function() {};
    this.onSelect = args.onSelect || function() {};
    this.onAdvance = args.onAdvance || function() { return false; }; // Return whether the mode was advanced or not
    this.onBack = args.onBack || function() {};
    this.onTargetsChanged = args.onTargetsChanged || function() {};
    this.onSelectionChanged = args.onSelectionChanged || function() {};

    this.targets = [];
    this.filteredTargets = [];
    this.selectedTarget = 0;
    this.badge = args.badge;
    this.text = "";
    this.placeholder = args.placeholder || "Sök";
    this.urlToTarget = new Map(); // Used to avoid duplicates when adding more targets
}

Mode.prototype.enterMode = function() {
    this.onEnterMode();
    if (this.targets) {
	resetMatches(this.targets);
	this.onTargetsChanged(this.getTargets());
	this.onSelectionChanged(0);
    }
};

Mode.prototype.setInput = function(text, event) {
    console.log("setInput('" + text + "', " + event + ")");
    this.text = text;
    this.onTargetsChanged(this.getTargets());
    this.onSelectionChanged(this.selectedTarget = 0);
};

Mode.prototype.filterDuplicates = function(newTargets) {
    var urlToTarget = this.urlToTarget;
    return newTargets.filter(function(target) {
	var normalizedUrl = target.getNormalizedUrl();
	if (urlToTarget.has(normalizedUrl)) {
	    var originalTarget = urlToTarget.get(normalizedUrl);
	    if (originalTarget.searchTerms) {
		if (!originalTarget.searchTerms.toLowerCase().includes(target.name.toLowerCase()))
		    originalTarget.searchTerms += "," + target.name;
	    } else {
		if (originalTarget.name.toLowerCase() != target.name.toLowerCase())
		    originalTarget.searchTerms = originalTarget.name + "," + target.name;
	    }
	    return false;
	} else {
	    if (normalizedUrl) {
		urlToTarget.set(normalizedUrl, target);
	    }
	    return true;
	}
    });
}

Mode.prototype.addTargets = function(targets) {
    for (var i = 0; i < targets.length; i++) {
	targets[i] = new Target(targets[i]);
    }
    Array.prototype.push.apply(this.targets, this.filterDuplicates(targets));
    this.onTargetsChanged(this.getTargets());
    this.onSelectionChanged(0);
};

Mode.prototype.clearTargets = function() {
    this.targets = [];
    this.urlToTarget.clear();
};

Mode.prototype.getCurrentTarget = function() {
    return this.filteredTargets.length == 0 ? null : this.filteredTargets[this.selectedTarget];
};

Mode.prototype.navigate = function(delta) {
    var n = this.filteredTargets.length;
    this.selectedTarget = n == 0 ? 0 : ((this.selectedTarget + delta + n) % n);
    this.onSelectionChanged(this.selectedTarget);
};

Mode.prototype.filterTargets = function(text) {
    if (text.length) {
	this.filteredTargets = $(this.targets).filter(function(i, e) {
	    e.match = null;
	    var terms = e.searchTerms.split(",");
	    for (var i = 0; i < terms.length; i++) {
		var indices = matches(text, terms[i]);
		if (indices) {
		    if (indices.length > 0)
			e.match = new Match({text:terms[i], indices:indices});
		    return true;
		}
	    }
	    if (e.deeplink && e.deeplink.shorthand) {
		return e.deeplink.shorthand.test(text);
	    }
	    return false;
	    //	return matches(text, e.name) || (e.search != undefined && matches(text, e.search));
	});
    } else {
	resetMatches(this.targets);
	this.filteredTargets = Array.from(this.targets);
    }
    console.log("filterTargets('" + text + "') -> " + this.filteredTargets.length);
    return this.filteredTargets;
}

Mode.prototype.getTargets = function() {
    return this.filterTargets(this.text);
};

function resetMatches(targets) {
    $(targets).each(function(i, e) {
	e.match = null;
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
	    if (!matches) {
		matchingIndices.pop();
	    }
	}
	if (!matches) {
	    matches = recurse(si, ti + 1, false, matchingIndices);
	}
	return matches;
    }

    return recurse(0, 0, false, []);
}
