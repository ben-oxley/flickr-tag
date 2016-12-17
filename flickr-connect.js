var querystring = require('querystring');
var request = require('request');
var Flickr = require("flickrapi"),
    flickrOptions = {
        api_key: "",
        secret: "",
        permissions:'write'
    };


Flickr.authenticate(flickrOptions, function (error, flickr) {
    
    receiveImagesFromFlickr(flickr)
});




var receiveImagesFromFlickr = function search(flickr) {
    flickr.photos.search({
        user_id: flickr.options.user_id,
        page: 1,
        per_page: 100
    }, function (err, result) {
        console.log("Total photos: " + result.photos.total);
        doURLSearch(flickr, result);
    });
}

var doURLSearch = function (flickr, result) {
    for (var i = 0; i < result.photos.perpage; i++) {
        console.log(result.photos.photo[i].id);
        var id = result.photos.photo[i].id;
        flickr.photos.getSizes({
            photo_id: result.photos.photo[i].id
        }, function (err, result) {
            var url = result.sizes.size.find(s=> s.label === "Original").source;
            console.log(url);
            azureRequest(url,flickr,id);
        })
    }
}

var azureRequest = function (url,flickr,id) {
    var post_data = { "url": url };

    request({
        headers: {
            'Content-Type': 'application/json',
            'Host' : 'api.projectoxford.ai',
            'Ocp-Apim-Subscription-Key': ''
        },
        
        uri: 'https://api.projectoxford.ai/vision/v1.0/tag',
        json: post_data,
        method: 'POST'
    }, function (err, res, body) {
        if (!err && res.statusCode == 200) {
            var tags = body.tags
            .filter(e=>parseFloat(e.confidence) > 0.9)
            .map(k=> k.name).join(" ");
            console.log(tags);
            addTags(flickr,id,tags);
        } else {
            console.log("Error: "+err);
            console.log(body);
        }   
        
    });

}

var addTags = function(flickr,id,photoTags){
    flickr.photos.addTags({
        photo_id:id,
        tags:photoTags
    }, function (err, result) {
        if (err){
            console.log("Error: "+err);
            console.log(result);
        } else {
            console.log("Tagged successfully");
        }
    });
}

