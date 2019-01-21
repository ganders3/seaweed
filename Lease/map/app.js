// https://en.wikipedia.org/wiki/Haversine_formula
// http://www.movable-type.co.uk/scripts/latlong.html
dmr = [];

function initialize() {

  //==========================================================
  const EARTH_RADIUS = 6.371e6;
  const URL_DMR = 'https://opendata.arcgis.com/datasets/a0b3c775cfc243a2b92df328ad85c642_2.geojson'

  var points  = [
    {lat: 43.557133, lng: -70.348036},
    {lat: 43.555588, lng: -70.343551}
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
  dmr = readDMR(URL_DMR);
  console.log('dmr:', dmr);
  for (i=0; i> dmr.length; i++) {
    console.log(dmr[i]);
  }
  dmr.forEach((d) => {
    console.log(d.lat);
  });


  for (i=0; i < points.length; i++) {
    var area = rectangleBounds(points[i], ft2m(20), ft2m(20));
    drawRectangle(area);
    drawCircle(points[i], ft2m(300), 'red');
    drawCircle(points[i], ft2m(1000), 'blue');
  }
  //================running the program================


  function readDMR(source) {
    var arr = new Array;
    $.getJSON(source, function(data) {
      data.features.forEach((f) => {
        let coords = {
          // Adding coordinates of the FIRST point in each existing aquaculture spot
          // Need to modify to draw the entire space with polygons
          lat: f.geometry.coordinates[0][0][1],
          lng: f.geometry.coordinates[0][0][0]
        };
        arr.push(coords);
        drawMarker(coords);
      });
    });
    return arr;
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

  function deg2Rad(deg) {return deg*Math.PI/180}
  function rad2Deg(rad) {return 180*rad/Math.PI}
  function ft2m(ft) {return ft/3.281}
  function m2ft(m) {return m*3.281}


}