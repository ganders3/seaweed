// https://en.wikipedia.org/wiki/Haversine_formula
// http://www.movable-type.co.uk/scripts/latlong.html
// var dmr = [];
// var dmr;
function initialize() {

  //==========================================================
  const EARTH_RADIUS = 6.371e6;
  const URL_DMR = 'https://opendata.arcgis.com/datasets/a0b3c775cfc243a2b92df328ad85c642_2.geojson'

  var points  = [
    {lat: 43.557133, lng: -70.348036},
    {lat: 43.555588, lng: -70.343551},
    // new 4
    {lat: 43.524767, lng: -70.341655},
    // {lat: 43.52019, lng: -70.339658},
    {lat: 43.530172, lng: -70.34750},
    // {lat: 43.53, lng: -70.342441}
  ];
  //==========================================================

  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    // Coordinate to center the map upon
    center: {lat: 43.555588, lng: -70.343551},
    // Show the satellite view as the default
    mapTypeId: 'satellite',
    //scaleControl adds a scale in the bottom corner
    scaleControl: true
  });

  // Adds the NOAA nautical charts
  var api = new NauticalChartsAPI();
  google.maps.event.addListener(api,'load',function() { 
    // Select the panel we want.
    var panel = api.getPanelByFileName('13287_1');
    // map.fitBounds(panel.getBounds());
    // add panel as a tile layer
    map.overlayMapTypes.push(panel.getMapType());
  });


  //================running the program================
  
  for (i=0; i < points.length; i++) {
    var area = rectangleBounds(points[i], ft2m(20), ft2m(20));
    drawRectangle(area);
    drawCircle(points[i], ft2m(300), 'red');
    drawCircle(points[i], ft2m(1000), 'blue');
  }

  parseDMR(URL_DMR);
  drawCompass();

  //================running the program================


  function parseDMR(source) {
    var json = $.getJSON(source, function() {
      dmr = JSON.parse(json.responseText);

      data = [];
      dmr.features.forEach((f) => {
        var coords = [];
        f.geometry.coordinates[0].forEach((c) => {
          coords.push({
            lat: c[1],
            lng: c[0]
          });
        });
        data.push({
          leaseHolder: f.properties.LEASEHOLDE,
          contact: f.properties.CONTACT,
          coordinates: coords
        });
      });


      data.forEach((d) => {
        drawPolygon(d.coordinates, d.leaseHolder);
        // console.log(coordMidpoint(d.coordinates));
        // listen();
      });


    });
  }


  function drawCompass() {
    var canvas = document.getElementById('can'),
    ctx = canvas.getContext('2d');
    ctx.fillRect(25, 100, 100, 100)
  }

  function drawMarker(position) {
    var marker = new google.maps.Marker({
      map: map,
      position: position
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

  function drawPolygon(coordinateArray, dataString) {

    var polygon = new google.maps.Polygon({
      paths: coordinateArray,
      strokeColor: '#FF0000',
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
      // console.log(dataString);
      this.setOptions({fillOpacity: 0.8})
    });

    polygon.addListener('mouseout', function() {
      this.setOptions({fillOpacity: 0.35})
    });

    polygon.addListener('click', function() {
      infowindow.open(map);
    });
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

  function coordMidpoint(coordinateArray) {
    var midLat = coordinateArray.map(a => a.lat).reduce((a,c) => a+c)/coordinateArray.length;
    var midLng = coordinateArray.map(a => a.lng).reduce((a,c) => a+c)/coordinateArray.length;
    return {lat: midLat, lng:midLng}
  }

  function deg2Rad(deg) {return deg*Math.PI/180}
  function rad2Deg(rad) {return 180*rad/Math.PI}
  function ft2m(ft) {return ft/3.281}
  function m2ft(m) {return m*3.281}


}