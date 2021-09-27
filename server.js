var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var SpotifyHelpers = require("./SpotifyHelpers")

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

var server = app.listen(process.env.PORT || 8080, function () {
	server.address().port;
});

app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.get("/search/:searchTerm/:filters", function (req, res) {
	var searchTerm = req.params.searchTerm;
	var filters = req.params.filters;

	SpotifyHelpers.PerformSearchWithKeywordsAndFilters(searchTerm, filters).then(result => {
		res.json(result)
	});
});

app.get("/AlbumSmartSearch/:searchTerm", function (req, res) {
	var searchTerm = req.params.searchTerm;	

	SpotifyHelpers.PerformAlbumSmartSearch(searchTerm).then(result => {
		res.json(result)
	});
});