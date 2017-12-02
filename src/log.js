function log(anything) {
    let timestamp = Date.now();
    if (typeof anything === "string") {
	console.log(timestamp + ": " + anything);
    } else {
	console.log(timestamp);
	console.log(anything);
    }
}
