function search(text, incaVersion) {
    let request = new XMLHttpRequest();
    let url = "url";
    request.open("GET", url, true);
    request.onreadystatechange = function() {
	if (request.readyState != 4) return;
	if (request.status == 200) {
	} else {
	}
    };
    request.send();
}

document.addEventListener('DOMContentLoaded', function() {
    $("#input").focus();
    $("#input").keydown(function(event) {
	if (event.keyCode == 13) {
	    $("#search").click();
	}
    });
    $("#search").click(function(event) {
	search($("#input").val().trim(), "17.4");
    });
});
