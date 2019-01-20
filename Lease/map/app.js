// https://en.wikipedia.org/wiki/Haversine_formula
// http://www.movable-type.co.uk/scripts/latlong.html

function initialize() {

  //==========================================================
  const EARTH_RADIUS = 6.371e6;

  var pt1 = {lat: 43.555588, lng: -70.343551};
  var pt2 = {lat: 43.557133, lng: -70.348036};

  var bds = {
      north: 43.557133,
      south: 43.555588,
      east: -70.343551,
      west: -70.348036
    };
  //==========================================================

  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: {lat: 43.555588, lng: -70.343551},
    mapTypeId: 'satellite'
  });

  var api = new NauticalChartsAPI();
  google.maps.event.addListener(api,'load',function() { 
    // Select the panel we want.
    var panel = api.getPanelByFileName('13287_1');
    // var panel = api.getPanelByFileName('18740_1');
    // map.fitBounds(panel.getBounds());
    // add panel as a tile layer
    map.overlayMapTypes.push(panel.getMapType());
  });

  var area1 = rectangleBounds(pt1, 10);
  var area2 = rectangleBounds(pt2, 10);

  drawRectangle(area1);
  drawRectangle(area2);
  
  drawCircle(pt1, ft2m(300), '#FF0000');
  drawCircle(pt1, ft2m(1000), 'blue');

  drawCircle(pt2, ft2m(300), '#FF0000');
  drawCircle(pt2, ft2m(1000), 'blue');



  function drawMarker(position) {
    var marker = new google.maps.Marker({
      position: position,
      map: map,
      title: 'Holes'
    });
  }

  function drawRectangle(bounds) {
    var rectangle = new google.maps.Rectangle({
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35,
      map: map,
      bounds: bounds
    });
  }

  function drawCircle(position, radius, color) {
    var circle = new google.maps.Circle({
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      // fillColor: '#FF0000',
      fillOpacity: 0,
      map: map,
      center: position,
      radius: radius
    })
  }

  // Returns a box centered around the coordinate, with sides the specified number of meters 
  function rectangleBounds(centerPosition, dist) {
    var c = 0.5*dist/EARTH_RADIUS;
    var lat = deg2Rad(centerPosition.lat);
    var lng = deg2Rad(centerPosition.lng);

    var box = {
      north: rad2Deg(c + lat),
      south: -rad2Deg(c - lat),
      // The function is valid for north and south, but not for east/west
      // For now I filled in the same formula
      // To get north/south I raduced the haversine formula from Wikipedia to:
      // (I am using y as phi and x as lambda)
      // y2 = d/r - y1
      east: rad2Deg(c + lng),
      west: -rad2Deg(c - lng)
    }
    return box;
  }

  function deg2Rad(deg) {
    return deg*Math.PI/180;
  }

  function rad2Deg(rad) {
    return 180*rad/Math.PI;
  }

  function ft2m(ft) {
    return ft/3.281;
  }

  function m2ft(m) {
    return m*3.281;
  }



}