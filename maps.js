// Variables
	var map;
	var mapOptions;
	var gasMarkers = [];
	var electricMarkers = [];
	var gasInfo = [];
	var electricInfo = [];
	var currentLocationMarker;
	var currentOpenInfo;
	var gasTableListeners = [];
	
	var images = {
	  gas: './assets/images/gas.png',
	  electric: './assets/images/electric.png'
	};
	
	var myGasFeedJSON;
	var NRELData;
	
	var apiKey = {
	  NREL: '',
	  myGasFeed: ''
	};
	
	var toggleGas = true;
	var toggleElectric = true;
	var toggleHydrogen = true;
	var initSearch = true;
	
	///////////////////////////////////////////////////////////////////////////////////////////////
	
	$(document).ready(function() {
	  $("#search").focus();
	  $("#map-canvas").fadeTo(200,.20);
	  $("#gas-table-sec").fadeTo(200,.20);
	  $("#electric-table-sec").fadeTo(200,.20);
	  $("#hydrogen-table-sec").fadeTo(200,.20);
	  $("#info").fadeTo(200,.20);
	  mapInitialize();
	});
	
	$(document).keypress(function(e) {
	  if(e.which == 13) search();
	});
	
	///////////////////////////////////////////////////////////////////////////////////////////////
	
	function search() {
	  $("#map-canvas").fadeTo(200,.20);
	  $("#fuel-types").fadeTo(200,.20);
	  $("#gas-table-sec").fadeTo(200,.20);
	  $("#electric-table-sec").fadeTo(200,.20);
	  $("#hydrogen-table-sec").fadeTo(200,.20);
	  clearAllMarkersAndInfo();
	  initSearch = false;
	  $("gas-table-sec h4").html("gasoline");
	  $("electric-table-sec h4").html("electric");
	  console.info("search() invoked; value = " + $("#search").val());
	  var geocoder = new google.maps.Geocoder();
	  var searchValue = $("#search").val();
	  geocoder.geocode({ address: searchValue}, searchHelper);
	  $("#map-canvas").fadeTo(1000,1);
	  $("#fuel-types").fadeTo(200,1);
	  $("#info").fadeTo(200,1);
	}
		
	/* from step 7 */
	function searchHelper(results, status) {
	  if (status == google.maps.GeocoderStatus.OK) {
		map.setCenter(results[0].geometry.location);
		console.info("lat: " + results[0].geometry.location.lat() + " lng: " + results[0].geometry.location.lng());
			
		// JSON
		contactMyGasFeed(results[0].geometry.location.lat(),results[0].geometry.location.lng());
		contactNREL(results[0].geometry.location.lat(),results[0].geometry.location.lng());
			
		currentLocationMarker = new google.maps.Marker({
		  title: 'Current Location',
		  position: results[0].geometry.location
		});
		map.setZoom(12);
		} else {
		  alert("Geocode was not successful for the following reason: " + status);
		}
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////

	
	function contactMyGasFeed(latitude, longitude) {
	  $.ajax({
		url: './myProxy.php?http://api.mygasfeed.com/stations/radius/'
		  + latitude + '/' + longitude +'/3/reg/price/' + apiKey.myGasFeed 
		  + '.json',
		dataType: "json",
		jsonp: false,
		success: myGasFeedSuccess,
		error: error
	  });
	}
	
	function extendedMyGasFeed(stationID) {
	  $.ajax({
		url: './myProxy.php?http://api.mygasfeed.com/stations/details/'
		  + stationID + '/' + apiKey.myGasFeed + '.json',
		dataType: "json",
		jsonp: false,
		success: extendedGasFeedSuccess,
		error: error
	  });
	}

	function contactNREL(latitude, longitude) {
	  $.ajax({
		url: './myProxy.php?http://developer.nrel.gov/api/alt-fuel-stations/v1/nearest.json?api_key='
		  + apiKey.NREL + ';format=json;latitude=' + latitude +';longitude='
		  + longitude + ';fuel_type=ELEC;radius=' + 3,
		dataType: 'json',
		jsonp: false,
		success: NRELSuccess,
		error: error
	  });
	}
	
	function error(XMLHttpRequest, errorMessage, errorThrown) {
	  $('#gas-table').append("Error:" + errorMessage + ": " + errorThrown);
	}
			
	function myGasFeedSuccess(JSONData) {
	  console.info("myGasFeed success!");
	  myGasFeedJSON = JSONData;
	  $('#gas-table tbody').html("");
	  $('#gas-table-sec h4').html("gasoline ("+JSONData["stations"].length+")");
	  $.each(JSONData['stations'], function(index, value) { 
			
		$('#gas-table tbody').append("<tr id='gas-" + index + "'><td>"
		  + value.station + "</td><td>" + value.distance + "<td>$" 
		  + value.price + "</td><td>$" + value.price + "</td><td>$" 
		  + value.price + "</td></tr>");
			
		var currentMarker = new google.maps.Marker({
		  position: new google.maps.LatLng(value.lat, value.lng), 
		  title: value.station,
		  icon: images["gas"]
		});
		
		var currentInfo = new google.maps.InfoWindow({
		  content: "<img src='https://maps.googleapis.com/maps/api/streetview?size=250x75&location="
			+ value.lat+","+ value.lng 
			+ "&fov=90&pitch=10&sensor=false'></img><hr><strong>" 
			+ value.station + "</strong> (<em>" + value.distance
			+ " away</em>)<br>" + value.address + "<br>" 
			+ value.city + ", " + value.region + " " + value.zip 
			+ "<hr><b>Diesel</b>: " + (value.diesel==1? "Available" : "Not Available") 
			+ "<hr> <a href='http://www.mygasfeed.com/'>www.mygasfeed.com</a>"
		  });
			
		  gasMarkers.push(currentMarker);
		  gasInfo.push(currentInfo);
			
		  google.maps.event.addListener(currentMarker, 'click', function() {
			currentInfo.open(map,currentMarker);
			if(currentOpenInfo) currentOpenInfo.close();
			currentOpenInfo = currentInfo;
		});

		$('#gas-'+index).click(function() {
		  map.setCenter(new google.maps.LatLng(value.lat, value.lng));
		  currentInfo.open(map,currentMarker);
		  if(currentOpenInfo) currentOpenInfo.close();
		  currentOpenInfo = currentInfo;
		});
			
	  });
	  
	  $("#gas-table-sec").fadeTo(200,1);
	  refreshMarkers();
	}
	
	function extendedGasFeedSuccess(JSON) {
	
	}

	function NRELSuccess(JSON) {
	  console.info("NREL success!");
	  NRELData = JSON;
	  $("#electric-table-sec h4").html("electric ("+JSON["fuel_stations"].length+")");
	  $('#electric-table tbody').html("");
	  $.each(JSON["fuel_stations"], function(index,value) {
			
		$('#electric-table tbody').append("<tr id='elec-"+ index +"'><td>" 
		  + value.station_name + "</td><td>" 
		  + (value.distance).toFixed(1) + " miles</td></tr>");
			
		var currentMarker = new google.maps.Marker({
		  position: new google.maps.LatLng(value.latitude, value.longitude),
		  title: value.station_name,
		  icon: images["electric"]
		});
			
		var currentInfo = new google.maps.InfoWindow({
		  content: "<img src='https://maps.googleapis.com/maps/api/streetview?size=250x75&location="
			+ value.latitude+","+value.longitude 
			+ "&fov=90&pitch=10&sensor=false'></img><hr><strong>" 
			+ value.station_name + "</strong> (<em>" 
			+ value.distance.toFixed(1) + " miles away</em>)<br>" 
			+ value.street_address + "<br>"
			+ value.city + ", " + value.state + " " + value.zip 
			+ "<hr><b>J1772</b>: " 
			+ (value.ev_level1_evse_num==null? 0 : value.ev_level1_evse_num)
			+ "<br><b>110V</b>: " 
			+ (value.ev_level2_evse_num=null? 0 : value.ev_level2_evse_num) 
			+ "<br><b>DC Fast</b>: " 
			+ (value.ev_dc_fast_num==null? 0 : value.ev_dc_fast_num) 
			+"<hr> <a href = 'http://www.nrel.gov/'>www.nrel.gov</a>"
		});
			
			
		electricMarkers.push(currentMarker);
		electricInfo.push(currentInfo);
			
		google.maps.event.addListener(electricMarkers[index], 'click', function() {
		  electricInfo[index].open(map,electricMarkers[index]);
		  if(currentOpenInfo)
			currentOpenInfo.close();
			currentOpenInfo = electricInfo[index];
		});
			
		$('#elec-'+index).click(function() {
		  map.setCenter(new google.maps.LatLng(value.latitude, value.longitude));
		  currentInfo.open(map,currentMarker);
		  if(currentOpenInfo) currentOpenInfo.close();
		  currentOpenInfo = currentInfo;
		});
			
	  });
		
	  $("#electric-table-sec").fadeTo(200,1);
	  refreshMarkers();
	}
	
	///////////////////////////////////////////////////////////////////////////////////////////////

	
	function mapInitialize() {
	  console.info("mapInitialize() start")
	  mapOptions = {
		center: new google.maps.LatLng(33.683947, -117.794694),
		zoom: 5,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	  };
	  map = new google.maps.Map($('#map-canvas').get(0), mapOptions);
	  console.info("mapInitialize() complete")
	}
	
	function clearAllMarkersAndInfo() {
	  for(var i=0;i<gasMarkers.length;i++) {
	    gasMarkers[i].setMap(null);
	  }
	  for(var i=0;i<electricMarkers.length;i++) {
	    electricMarkers[i].setMap(null);
	  }
	  gasMarkers = [];
	  electricMarkers = [];
	  gasInfo = [];
	  electricInfo = [];
	  google.maps.event.clearListeners(map, 'click');		
	  if(!initSearch) currentLocationMarker.setMap(null);
	  console.info("All markers and info cleared!");
	}
	
	function refreshMarkers() {
	  console.info("refreshMarkers() start");
	  for(var i=0;i<gasMarkers.length;i++) {
		gasMarkers[i].setMap(map);
	  }
	  for(var i=0;i<electricMarkers.length;i++) {
		electricMarkers[i].setMap(map);
	  }
	  currentLocationMarker.setMap(map);
	  console.info("refreshMarkers() complete");
	}