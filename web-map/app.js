leases = [];
landowners = [];
vicinityLandowners = [];

points  = [
  // {lat: 43.55890335761595, lng: -70.35474212466664},
  // {lat: 43.558496056236656, lng: -70.35487984470706},

  // {lat: 43.55701862974057, lng: -70.34682329499816},
  // {lat: 43.557049730009915, lng: -70.3463083108673},

  // {lat: 43.527249470181346, lng: -70.34599193458439},
  // {lat: 43.52726934094715, lng: -70.34506376588439},

  // {lat: 43.515225, lng: -70.286559},
  // {lat: 43.520070, lng: -70.280611}
];

leaseArea = [
  {lat: 43.559137, lng: -70.355621},
  {lat: 43.558824, lng: -70.354155},
  {lat: 43.55833, lng: -70.353125},
  {lat: 43.557738, lng: -70.351106},
  {lat: 43.557427, lng: -70.351278},
  {lat: 43.557711, lng: -70.352378},
  {lat: 43.558511, lng: -70.354236},
  {lat: 43.558935, lng: -70.355701}
];


function initialize() {

  //==========================================================
  const EARTH_RADIUS = 6.371e6;
  const LANDOWNER_DISTANCE = 1000;
  const URL_DMR = 'data/dmr.min.json';
  // const URL_DMR = 'https://opendata.arcgis.com/datasets/a0b3c775cfc243a2b92df328ad85c642_2.geojson';
  const URL_SCAR = 'data/taxmap.min.json';
  //==========================================================

  leases = parseDMR(URL_DMR);
  landowners = parseLandowners(URL_SCAR);


  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: {lat: 43.555588, lng: -70.343551},
    mapTypeId: 'roadmap',
    scaleControl: true //scaleControl adds a scale in the bottom corner
  });

  var geocoder = new google.maps.Geocoder();

  // Adds the NOAA nautical charts
  // var nc = new NauticalChartsAPI();
  // google.maps.event.addListener(nc,'load',function() { 
  //   var panel = nc.getPanelByFileName('13287_1');
  //   // panel.setOpacity(1);
  //   map.overlayMapTypes.push(panel.getMapType());
  //   // console.log(map.overlayMapTypes);
  // });


  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: null, //google.maps.drawing.OverlayType.MARKER,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: ['marker', 'circle', 'polygon', 'polyline', 'rectangle']
    },
    markerOptions: {icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png'},
    circleOptions: {
      fillColor: '#ffff00',
      fillOpacity: 1,
      strokeWeight: 5,
      clickable: false,
      editable: true,
      zIndex: 1
    }
  });
  drawingManager.setMap(map);


  leaseArea.forEach(a => {drawCircle(a, ft2m(1000), 'blue', 0.2, 'blue', 0.2);});
  drawPolygon(leaseArea, leaseArea, 'Proposed Lease Site');


  var selecting = false;
  window.onkeydown = function(e) {
    selecting = (
      (e.keyIdentifier == 'Control') ||
      (e.ctrlKey == true)
      );
  }
  window.onkeyup = function(e) {
    selecting = false;
  }

  map.addListener('rightclick', function(event) {
    // console.log(selecting);
    var lat = event.latLng.lat();
    var lng = event.latLng.lng();

    var coord = {lat: lat, lng: lng}
    var contentString = '{lat: ' + lat + ', lng: ' + lng + '}';

    if (selecting) {
      const GUBMINS = ft2m(1000);
      // MAKE THIS A FUNCTION LATER

      closeLandowners = findCloseLandowners(landowners, coord, GUBMINS);

      closeLandowners.forEach(c => {
        contentString += '<br>' +
          c.grantee1 + ', ' +
          c.mailingAddress + ' ' + c.mailingCity + ' ' + c.mailingState + ' ' + c.mailingZip;
      });
    }
    drawInfoWindow(contentString, coord);
  });


  function findCloseLandowners(landowners, coordinate, distanceInMeters = 0) {
    var arr = landowners.filter(x =>
      haversineDistance(x.coordinates, coordinate) < distanceInMeters);
    console.log('arr:', arr);
    return arr;
  }



  //================running the program================

  leaseArea.forEach(coord => {
    console.log(coord);
    // console.log(landowners);
    let cl = findCloseLandowners(landowners, coord, ft2m(1000))
    console.log('landowners:', landowners)
    // console.log(cl);
    vicinityLandowners.push(cl)
  });  
  // for (i=0; i < points.length; i++) {
  //   var area = rectangleBounds(points[i], ft2m(20), ft2m(20));
  //   var pointIndex = (i + 1).toString();

  //   drawMarker(points[i], pointIndex);
  //   // drawCircle(points[i], ft2m(300), 'red');
  //   // drawCircle(points[i], ft2m(1000), 'blue');
  // }

  drawCompass();
  //================running the program================


  function parseDMR(source) {
    // Cut off portions of the DMR list that aren't needed
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
        });
       });
    });

    return output;
  }



  function drawCompass() {
    var canvas = document.getElementById('can'),
    ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(25, 100, 100, 100);
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

  function drawCircle(position, radius, strokeColor = 'red', strokeOpacity = 0.8, fillColor = 'red', fillOpacity = 0.5) {
    var circle = new google.maps.Circle({
      map: map,
      center: position,
      radius: radius,
      strokeColor: strokeColor,
      strokeOpacity: strokeOpacity,
      strokeWeight: 2,
      fillColor: fillColor,
      fillOpacity: fillOpacity
    })
  }

  function drawPolygon(data, coordinateArray, dataString) {
    var polygon = new google.maps.Polygon({
      paths: coordinateArray,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.1
    });
    polygon.setMap(map);

    var infowindow = new google.maps.InfoWindow({
      size: new google.maps.Size(150, 50),
      content: dataString,
      position: coordMidpoint(coordinateArray)
    });

    polygon.addListener('mouseover', function() {
      this.setOptions({fillOpacity: 0.1})
      infowindow.open(map);
    });

    polygon.addListener('mouseout', function() {
      this.setOptions({fillOpacity: 0.1})
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
    geocoder.geocode({'address': address}, function(results, status) {
    if (status === 'OK') {
      // console.log(results);
      // console.log(points[0]);
      var lat = results[0].geometry.location.lat();
      var lng = results[0].geometry.location.lng();
      // console.log(lat, lng);
      return({'lat': lat, 'lng': lng});


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