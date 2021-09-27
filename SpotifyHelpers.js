var request = require('request');
var _ = require('lodash');

var client_id = '<CLIENT-ID>';
var client_secret = '<CLIENT-SECRET>';

// your application requests authorization
var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    form: {
        grant_type: 'client_credentials'
    },
    json: true
};

var getAccessToken = function () {
    return new Promise((resolve, reject) => {
        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                // use the access token to access the Spotify Web API
                resolve(body.access_token);
            }
        });
    });
}

var PerformSearchWithKeywordsAndFilters = function (searchTerm, filters) {
    return new Promise((resolve, reject) => {
        getAccessToken()
            .then(accessToken => {
                var options = {
                    url: 'https://api.spotify.com/v1/search?q=' + searchTerm + '&type=' + filters,
                    headers: {
                        'Authorization': 'Bearer ' + accessToken
                    },
                    json: true
                };

                request.get(options, function (error, response, body) {

                    var result = {}

                    if (body == undefined || body == null)
                        return reject(null);

                    if (body.albums != undefined && body.albums != null && body.albums.total > 0)
                        result.albums = parseAlbums(body.albums.items);

                    if (body.artists != undefined && body.artists != null && body.artists.total > 0)
                        result.artists = parseArtists(body.artists.items);

                    if (body.playlists != undefined && body.playlists != null && body.playlists.total > 0)
                        result.playlists = parsePlaylists(body.playlists.items);

                    if (body.tracks != undefined && body.tracks != null && body.tracks.total > 0)
                        result.tracks = parseTracks(body.tracks.items);

                    resolve(result);
                });
            });
    });
}

var PerformAlbumSmartSearch = function (searchTerm) {
    return new Promise((resolve, reject) => {
        getAccessToken()
            .then(accessToken => {
                var options = {
                    url: 'https://api.spotify.com/v1/search?q=' + searchTerm + '&type=album&limit=1',
                    headers: {
                        'Authorization': 'Bearer ' + accessToken
                    },
                    json: true
                };

                request.get(options, function (error, response, body) {                   

                    if (body == undefined || body == null)
                        return reject(null);

                    if (body.albums == undefined || body.albums == null || body.albums.total == 0)
                        return resolve("");

                    var album = parseAlbum(body.albums.items[0]);

                    fetchFirstTrackInAlbum(accessToken, album.id)
                        .then(firstTrack =>
                            resolve(firstTrack.uri)
                        );
                });
            });
    });
}

var fetchFirstTrackInAlbum = function (accessToken, albumId) {
    return new Promise((resolve, reject) => {
        var options = {
            url: 'https://api.spotify.com/v1/albums/' + albumId,
            headers: {
                'Authorization': 'Bearer ' + accessToken
            },
            json: true
        };

        request.get(options, function (error, response, body) {

            if (body.tracks == undefined || body.tracks == null || body.tracks.total > 0) {
                resolve(parseTrack(body.tracks.items[0]));
            }
        });
    });
}

var parseTracks = function (tracks) {
    return _.map(tracks, track => {
        return {
            name: track.name,
            uri: track.uri,
            album: track.album.name,
            artists: _.join(_.map(parseSimpleArtists(track.artists), artist => artist.name), ', ')
        }
    });
}

var parseTrack = function (track) {
    return {
        uri: track.uri        
    }
}

var parseArtists = function (artists) {
    return _.map(artists, artist => {
        return {
            name: artist.name,
            uri: artist.uri,
            coverArt: _.last(artist.images)
        }
    });
}

var parsePlaylists = function (playlists) {
    return _.map(playlists, playlist => {
        return {
            name: playlist.name,
            owner: playlist.owner.display_name,
            uri: playlist.uri,
            coverArt: _.last(playlist.images)
        }
    });
}

var parseAlbums = function (albums) {
    return _.map(albums, album => {
        return parseAlbum(album);
    });
}

var parseAlbum = function (album) {
    return {
        id: album.id,
        artists: _.join(_.map(parseSimpleArtists(album.artists), artist => artist.name), ', '),
        name: album.name,
        uri: album.uri,
        coverArt: _.last(album.images)
    }
}

var parseSimpleArtists = function (artists) {
    return _.map(artists, artist => {
        return {
            name: artist.name
        };
    });
}

module.exports =
    {
        PerformSearchWithKeywordsAndFilters: PerformSearchWithKeywordsAndFilters,
        PerformAlbumSmartSearch: PerformAlbumSmartSearch
    }