// https://en.wikipedia.org/wiki/Haversine_formula
// http://www.movable-type.co.uk/scripts/latlong.html

leases = [];
landowners = [];

points  = [
  // {lat: 43.558899, lng: -70.354702},

  {lat: 43.55890335761595, lng: -70.35474212466664},
  {lat: 43.558496056236656, lng: -70.35487984470706},

  {lat: 43.55701862974057, lng: -70.34682329499816},
  {lat: 43.557049730009915, lng: -70.3463083108673},

  {lat: 43.527249470181346, lng: -70.34599193458439},
  {lat: 43.52726934094715, lng: -70.34506376588439},

  {lat: 43.515225, lng: -70.286559},
  {lat: 43.520070, lng: -70.280611}
];

distances = [];

function initialize() {

  //==========================================================
  const EARTH_RADIUS = 6.371e6;
  const URL_DMR = 'data/dmr.min.json';
  // const URL_DMR = 'https://opendata.arcgis.com/datasets/a0b3c775cfc243a2b92df328ad85c642_2.geojson';
  const URL_SCAR = 'data/taxmap.min.json';
  //==========================================================

  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    // Coordinate to center the map upon
    center: {lat: 43.555588, lng: -70.343551},
    // Show the satellite view as the default
    mapTypeId: 'roadmap',
    //scaleControl adds a scale in the bottom corner
    scaleControl: true
  });

  var geocoder = new google.maps.Geocoder();

  // Adds the NOAA nautical charts
  var api = new NauticalChartsAPI();
  google.maps.event.addListener(api,'load',function() { 
    var panel = api.getPanelByFileName('13287_1');
    map.overlayMapTypes.push(panel.getMapType());
  });


  map.addListener('rightclick', function(event) {displayCoordinates(event)});

  function displayCoordinates(event) {
    var lat = event.latLng.lat();
    var lng = event.latLng.lng();

    var coord = {lat: lat, lng: lng}
    var contentString = '{lat: ' + lat + ', lng: ' + lng + '}';
    drawInfoWindow(contentString, coord);
  }


  //================running the program================
  
  for (i=0; i < points.length; i++) {
    var area = rectangleBounds(points[i], ft2m(20), ft2m(20));
    var pointIndex = (i + 1).toString();

    drawMarker(points[i], pointIndex);
    drawCircle(points[i], ft2m(300), 'red');
    drawCircle(points[i], ft2m(1000), 'blue');
  }

  leases = parseDMR(URL_DMR);
  landowners = parseLandowners(URL_SCAR);






  drawCompass();

  // address2LatLng('299 BEECH RIDGE RD Scarborough ME', function(coord) {
  //   var cheese = haversineDistance(coord, points[1]);
  //   console.log(cheese);
  // });
  //================running the program================


  function parseDMR(source) {
    const COORD_CUTOFF_MAX = 43.567640909258415;
    const COORD_CUTOFF_MIN = 43.434592821089645;
    var output = [];
    var json = $.getJSON(source, function() {
      data = JSON.parse(json.responseText);

      data.features.forEach(f => {
        var coords = [];
        f.geometry.coordinates[0].forEach(c => {
          coords.push({
            lat: c[1],
            lng: c[0]
          });
        });

        if (Math.min(...coords.map(a => a.lat)) < COORD_CUTOFF_MAX &&
          Math.min(...coords.map(a => a.lat)) > COORD_CUTOFF_MIN) {
            output.push({
              leaseHolder: f.properties.LEASEHOLDE,
              contact: f.properties.CONTACT,
              coordinates: coords
            });
        }

        output.forEach(o => {
          drawPolygon(o, o.coordinates, o.leaseHolder);
        });
      });
    });
    return output;
  }

  function parseLandowners(source) {
    const INVALID_REGEX_STRINGS = /^$/
    var output = [];
    var json = $.getJSON(source, function() {
      data = JSON.parse(json.responseText);
      data.forEach(d => {
        let coord = {lat: d.lat, lng: d.lon}

        // Calculate the distance between each point and each landowner
        let dist = []
        for (i=0; i<points.length; i++) {
          dist.push(m2ft(haversineDistance(coord, points[i])));
        }

        output.push({
          id: d.STATE_ID,
          address: d.PROP_LOC,
          grantee1: d.Grantee,
          grantee2: d['Co.Grantee'],
          mailingAddress: d.Mailing,
          mailingCity: d.City,
          mailingState: d.State,
          mailingZip: d.Zip,
          coordinates: coord,
          distances: dist
        });
       });
    });

    return output;
  }



  function drawCompass() {
    var canvas = document.getElementById('can'),
    ctx = canvas.getContext('2d');
    ctx.fillRect(25, 100, 100, 100)
  }

  function drawMarker(position, label = '') {
    var marker = new google.maps.Marker({
      map: map,
      position: position,
      label: label
    });
  }

  function drawRectangle(bounds) {
    var rectangle = new google.maps.Rectangle({
      map: map,
      bounds: bounds,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35
    });
  }

  function drawCircle(position, radius, color) {
    var circle = new google.maps.Circle({
      map: map,
      center: position,
      radius: radius,
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      // fillColor: '#FF0000',
      fillOpacity: 0
    })
  }

  function drawPolygon(data, coordinateArray, dataString) {
    var polygon = new google.maps.Polygon({
      paths: coordinateArray
 ,     strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35
    });
    polygon.setMap(map);

    var infowindow = new google.maps.InfoWindow({
      size: new google.maps.Size(150, 50),
      content: dataString,
      position: coordMidpoint(coordinateArray)
    });

    polygon.addListener('mouseover', function() {
      this.setOptions({fillOpacity: 0.8})
      infowindow.open(map);
    });

    polygon.addListener('mouseout', function() {
      this.setOptions({fillOpacity: 0.35})
      infowindow.close(map);
    });

  }

  function drawInfoWindow(content, position) {
    var infowindow = new google.maps.InfoWindow({
      size: new google.maps.Size(150, 50),
      content: content,
      position: position
    });

    infowindow.open(map);
  }

  // Returns a box centered around the coordinate, with sides the specified number of meters 
  function rectangleBounds(centerPosition, height, width) {
    var h = 0.5*height/EARTH_RADIUS;
    var w = 0.5*width/EARTH_RADIUS;
    var lat = deg2Rad(centerPosition.lat);
    var lng = deg2Rad(centerPosition.lng);

    var box = {
      north: rad2Deg(lat + h),
      south: rad2Deg(lat - h),
      east: rad2Deg(lng + w),
      west: rad2Deg(lng - w)
    }
    return box;
  }


  function address2LatLng(address, callback) {
    var geocoder = new google.maps.Geocoder();

    geocoder.geocode({'address': address}, function(results, status) {
      if (status == 'OK') {
        var lat = results[0].geometry.location.lat();
        var lng = results[0].geometry.location.lng();
        var coord = {lat: lat, lng: lng}

        callback(coord);
      }
    });
  }


  function geocodeAddress(geocoder, map, addressString = '1 Walker St Portland ME') {
    var address = addressString;
    // var address = '1 Walker St Portland ME 04012';
    geocoder.geocode({'address': address}, function(results, status) {
    if (status === 'OK') {
      console.log(results);
      console.log(points[0]);
      var lat = results[0].geometry.location.lat();
      var lng = results[0].geometry.location.lng();
      // console.log(results)
      console.log(lat, lng);
      return({'lat': lat, 'lng': lng});

      // var marker = new google.maps.Marker({
      //   map: map,
      //   position: results[0].geometry.location
      // });

    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
    });

  }

  function coordMidpoint(coordinateArray) {
    var midLat = coordinateArray.map(a => a.lat).reduce((a,c) => a+c)/coordinateArray.length;
    var midLng = coordinateArray.map(a => a.lng).reduce((a,c) => a+c)/coordinateArray.length;
    return {lat: midLat, lng:midLng}
  }

  function deg2Rad(deg) {return deg*Math.PI/180}
  function rad2Deg(rad) {return 180*rad/Math.PI}
  function ft2m(ft) {return ft/3.281}
  function m2ft(m) {return m*3.281}

  function haversineDistance(coord1, coord2) {
    const EARTH_RADIUS = 6.371e6;
    var lat1 = deg2Rad(coord1.lat);
    var lng1 = deg2Rad(coord1.lng);
    var lat2 = deg2Rad(coord2.lat);
    var lng2 = deg2Rad(coord2.lng);

    dLat = lat2 - lat1;
    dLng = lng2 - lng1;
    a = Math.sin(dLat/2)**2;
    b = Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
    d = 2*EARTH_RADIUS*Math.asin(Math.sqrt(a + b));

    // Outputs result in meters
    return d;
  }


}