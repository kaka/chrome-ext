function Mode({onEnterMode, onExitMode, onSelect, onAdvance, onBack, onTargetsChanged, onSelectionChanged, badge, placeholder}) {
    this.onEnterMode = onEnterMode || function() {};
    this.onExitMode = onExitMode || function() {};
    this.onSelect = onSelect || function() {};
    this.onAdvance = onAdvance || function() { return false; }; // Return whether the mode was advanced or not
    this.onBack = onBack || function() {};
    this.onTargetsChanged = onTargetsChanged || function() {};
    this.onSelectionChanged = onSelectionChanged || function() {};

    this.targets = [];
    this.filteredTargets = [];
    this.selectedTarget = 0;
    this.badge = badge;
    this.text = "";
    this.placeholder = placeholder || "Sök";
    this.urlsToTargets = new Map(); // Used to avoid duplicates when adding more targets
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
    log("setInput('" + text + "', " + event + ")");
    this.text = text;
    this.onTargetsChanged(this.getTargets());
    this.onSelectionChanged(this.selectedTarget = 0);
};

Mode.prototype.filterDuplicates = function(newTargets) {
    var urlsToTargets = this.urlsToTargets;
    return newTargets.filter(function(target) {
	var normalizedUrl = target.getNormalizedUrl();
	if (urlsToTargets.has(normalizedUrl)) {
	    var originalTarget = urlsToTargets.get(normalizedUrl);
	    if (originalTarget.shouldMergeWith(target)) {
		originalTarget.merge(target);
		return false;
	    }
	} else {
	    if (normalizedUrl) {
		urlsToTargets.set(normalizedUrl, target);
	    }
	}
	return true;
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
    this.urlsToTargets.clear();
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
    log("filterTargets('" + text + "') -> " + this.filteredTargets.length);
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

function removeDiacritics(str) {
    return str
	.replace(/[ÅÄÁÀÂÃ]/g, "A")
	.replace(/[åäáàâã]/g, "a")
	.replace(/[ÉÈËÊ]/g, "E")
	.replace(/[éèëê]/g, "e")
	.replace(/[ÖÓÒÔÕ]/g, "O")
	.replace(/[öóòôõ]/g, "o");
}

function matches(search, text) {
    var s = removeDiacritics(search.trim()).toLowerCase();
    var t = removeDiacritics(text.trim());
    if (s.length > t.length) return null;
    if (s.length == t.length) return s == t.toLowerCase() ? Array.from(new Array(s.length).keys()) : null;

    function recurse(si, ti, continuous, matchingIndices) {
	if (si == s.length || ti == t.length) {
	    return si == s.length ? matchingIndices : null;
	}
	var matches = false;
	if (s.charAt(si) == t.charAt(ti).toLowerCase() && (continuous || isBeginningOfWord(ti, t))) {
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

    var result = recurse(0, 0, false, []);
    if (!result) {
	var start = t.toLowerCase().indexOf(s);
	if (start !== -1) {
	    result = []
	    var end = s.length + start;
	    for (i = start; i < end; i++) {
		result.push(i);
	    }
	}
    }
    return result;
}
