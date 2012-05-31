var map,
	geocoder,
	marker,
	initialZoom = 14,
	initialAddress = "EC2A 4RQ, UK",
	venues = [],
	palettes = [],
	purses = [],
	postcodes = [];

function removeMarker() {
	if(marker) {
		marker.setMap(null);
	}
}

function createMarker(latlng) {
	removeMarker();
	marker = new google.maps.Marker({
		position: latlng,
		map: map
	});
}

function initialiseMap(callback) {
	var mapDiv = document.getElementById('mapCanvas'),
		mapOptions = {
			mapTypeControl: false,
			zoomControl: false,
			scrollwheel: false,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
	geocoder = new google.maps.Geocoder();
	map = new google.maps.Map(mapDiv, mapOptions);

	lookupAndCentre(initialAddress);

	if(callback) {
		callback();
	}
}

function lookupAndCentre(address, showMarker) {
	geocoder.geocode({
		'address': address
	}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			var latlng = results[0].geometry.location;
			map.setZoom(initialZoom);
			map.setCenter(latlng);
			if(showMarker) {
				createMarker(latlng);
			}
		} else {
			alert("Geocode was not successful for the following reason: " + status);
		}
	});
}

function chooseRandomVenue(callback) {
	var mapFunction = function() {
			if(!this.checked) {
				return this.value.toLowerCase();
			}
		},
		uncheckedPalettes = $('#palette input').map(mapFunction).get(),
		uncheckedPurses = $('#purse input').map(mapFunction).get(),
		filteredVenues = $.grep(venues, function() {
			if(uncheckedPalettes.indexOf(this.palette)===-1 && uncheckedPurses.indexOf(this.purse)===-1) {
				return true;
			}
		}),
		venue,
		postcode = $('#postcode').val();
		if(postcode) {
			// do we use latlon to determine distance? or just adjacent postcodes?
		}
		venue = filteredVenues[Math.floor(Math.random()*filteredVenues.length)];
		callback(venue);
}

function sanitiseTwitter(twitter) {
	if(!twitter) {
		return "";
	}
	if(twitter.indexOf('@')===0) {
		twitter = twitter.substring(1);
	}
	return twitter;
}

$(document).ready(function() {
	// loading
	/*
		show lovely loading graphic before everything is ready
	*/
	// fruit machine
	/*
		on fruitMachine click,
			button text changes to venue name - DONE
			infobox for venue appears on right of button - DONE
	*/
	// map
	/*
		show set of venues as markers
		is draggable - DONE
		marker set filters according to ticked boxes
		on fruitMachine click
			map moves to show venue marker - DONE
			if you put in postcode, add postcode marker
			if you put in postcode, make postcode marker and venue marker visible
		postcode geocode
		filter markers based on distance (SPUKE)
	*/
	// venues
	/*
		show venues on the map
		figure out how to make a random choice - DONE
		filter set according to which checkboxes are deselected - DONE
		meta data: storage - DONE (Google Spreadsheet)
		on marker click
			not sure yet!
	*/
	// collaboration options
	/*
		google spreadsheet and form setup - DONE
			- add the description field
		pull data in from spreadsheet using YQL - DONE
	*/
	
	$.ajax({
		url: 'http://query.yahooapis.com/v1/public/yql',
		data: {
			// this query handles moderation - q: "select * from csv where url='https://docs.google.com/spreadsheet/pub?key=0AgQJ7FGUGIp_dG9JVjNHYmR2aWF4ckZWdU1JMU9VZHc&output=csv&range=B1%3AG78' and columns='Palette,Purse,Name,Postcode,Notable quality,Approved?' and Approved_='y'",
			// NB: for 5-minute caching, add '&_maxage=3600'
			q: "select * from csv where url='https://docs.google.com/spreadsheet/pub?key=0AgQJ7FGUGIp_dG9JVjNHYmR2aWF4ckZWdU1JMU9VZHc&output=csv&range=B2%3AH78' and columns='Palette,Purse,Name,Postcode,Notable quality,Twitter,Approved?'",
			format: 'json'
		},
		dataType: 'jsonp',
		success: function(rsp) {
			$.each( rsp.query.results.row, function(i, item) {
				var name = item.Name,
					palette = item.Palette,
					purse = item.Purse,
					postcode = item.Postcode,
					notable_quality = item.Notable_quality,
					twitter = sanitiseTwitter(item.Twitter);
				if(palettes.indexOf(palette)===-1) {
					palettes.push(palette.toLowerCase());
				}
				if(purses.indexOf(purse)===-1) {
					purses.push(purse.toLowerCase());
				}
				venues.push({
					name: name,
					palette: palette,
					purse: purse,
					postcode: postcode,
					notable_quality: notable_quality,
					twitter: twitter
				});
			});
		}
	});
	
	initialiseMap();
	
	$('#fruitMachine').click(function() {
		var that = this;
		chooseRandomVenue(function(venue) {
			var postcode = venue.postcode;
			$(that).text(venue.name);
			$('#infoPanel').html("<p>"+venue.notable_quality+"</p><p>Suggested by <a href='twitter.com/"+venue.twitter+"'>"+@venue.twitter+"</a></p>");
			$('#findAnother').show();
			lookupAndCentre(postcode, true);
		});
	});
	
	$('#findAnother').click(function(e) {
		e.preventDefault();
		$('#fruitMachine').click();
	});
	
	$('#submitYourOwn').click(function(e) {
		e.preventDefault();
		var popup = window.open('https://docs.google.com/spreadsheet/embeddedform?formkey=dG9JVjNHYmR2aWF4ckZWdU1JMU9VZHc6MQ', '_blank','width=760,height=931');
	});
	
});