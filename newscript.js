//variables
var geocoder;
var map;
var userCity;
var userState;
var centerPoint = {lat: 47.6062, lng: -122.3321};
var frequentFeelings = {};

//initialize map
function initMap() {
  console.log('initial');
  geocoder = new google.maps.Geocoder();  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 4,
    center: centerPoint,
    mapTypeId: 'roadmap',
    scrollwheel: false
  });
};

$(document).ready(function () {
  $('form').submit(function( event ) {
    formValidation(event);
    event.preventDefault();
  });
})

// form validation; triggers wff api request
function formValidation(event) {
  event.preventDefault();
  userCity = $('#city').val();
  userState = $('#state').val();
  var formInput = $('form :input').val();
  if(formInput == null || formInput == '') {
    alert('nice try');
  }
  else {
    console.log('else');
    // var url = 'index.html?userCity=' + userCity + '&userState=' + userState + '#map';
    window.location.assign('#map');
    map.center = codeAddress();
    map.zoom = 8;
    console.log(userCity, userState);
    // google.maps.event.trigger(map, 'resize');
    wffRequest();
  }
}

//gets lat/lon from user input
function codeAddress() {
  console.log(userCity, userState);
  var address = userCity + userState;
  geocoder.geocode( { 'address': address}, function(results, status) {
    if (status == 'OK') {
      map.setCenter(results[0].geometry.location);
      var marker = new google.maps.Marker({
        map: map,
        position:  results[0].geometry.location
      });
      createCircles();
    }
    else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

//make circles
function createCircles() {
  for(i = 0; i < 3; i++) {
    var cityCircle = new google.maps.Circle({
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        map: map,
        center: map.center,
        radius: 100000
    });
  }
}

//we feel fine data request
function wffRequest() {
var parser;
var xmlDoc;
var $xhr;
      $xhr = $.get('https://g-wefeelfine.herokuapp.com/ShowFeelings?display=xml&returnfields=feeling' + '&city=' + userCity + '&state=' + userState + '&limit=1500');
        $xhr.done(function(data) {
    if ($xhr.status !== 200) {
        alert('uncool');
        return;
    }
    else{
      parser = new DOMParser();
      xmlDoc = parser.parseFromString(data,"text/xml");
      emotionOccurance(xmlToJson(xmlDoc));
    }
  })
}

// Changes XML to JSON. Code mostly from the David Walsh blog
function xmlToJson(xml) {
  var obj = {};
	if (xml.nodeType == 1) {
		if (xml.attributes.length > 0) {
		  obj["attributes"] = {};
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				obj["attributes"][attribute.nodeName] = attribute.nodeValue;
			}
		}
	}
  else if (xml.nodeType == 3) {
		obj = xml.nodeValue;
	}
	if (xml.hasChildNodes()) {
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;
			if (typeof(obj[nodeName]) == "undefined") {
				obj[nodeName] = xmlToJson(item);
			}
      else {
				if (typeof(obj[nodeName].push) == "undefined") {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(xmlToJson(item));
			}
		}
	}
	return obj;
}

function emotionOccurance(result) {
  var feelingArr = [];
  var feelingCount = {};
  //returns feelings as an array
  for (var i = 0; i < result.feelings.feeling.length; i++) {
    var trueFeeling = result.feelings.feeling[i].attributes;
    if(trueFeeling !== undefined) {
      feelingArr[feelingArr.length] = trueFeeling.feeling;
    }
  }
  //returns object with key being a feeling and value being # of occurances
  for(var i = 0; i < feelingArr.length; i++) {
    var feel = feelingArr[i];
    var num = 1;
    for (var x = 0; x < feelingArr.length; x++) {
      if(feel === feelingArr[x]) {
        feelingCount[feel] = num;
        num++;
        feelingArr.splice(x, 1);
      }
    }
  }
  //returns obj of 5 highest occuring feelings
  var key = Object.keys(feelingCount);
  for(var i = 0; i < 5; i++) {
    var feelings = 'feelings' + i;
    var highestEmotions = {};
    var highestNum = 0;
    for(var x = 0; x < Object.keys(feelingCount).length; x++) {
      var key = Object.keys(feelingCount);
      var currentVal = feelingCount[key[x]];
      if(currentVal > highestNum) {
        highestNum = currentVal;
        highestEmotions.feeling = key[x];
        highestEmotions.frequency = currentVal;
      }
    }
    var objToRemove = highestEmotions.feeling;
    delete feelingCount[objToRemove];
    frequentFeelings[feelings] = highestEmotions;
  }
  console.log(frequentFeelings);
  console.log(frequentFeelings.propertyIsEnumerable());
}
