/**
 * Nautical Charts API
 * NOAA, RNC, Nautical, Navigation, Charts
 *
 * @file NauticalChartsAPI.js
 * @date 2015-10-21 13:40 PDT
 * @author Paul Reuter <preuter@ucsd.edu>
 * @author John Maurer <jmaurer@hawaii.edu>
 * @version 2.1.0
 *
 * @depends Google Maps API v3.x
 * @depends Modern IE > 7.
 *
 * @modifications
 * 1.0.0 - 2010-08-25 - Created
 * 1.0.0 - 2010-08-26 - Continued development
 * 1.0.0 - 2010-10-19 - Continued development
 * 1.0.1 - 2010-10-20 - Add documentation; BugFix: missing methods.
 * 1.0.2 - 2011-12-22 - Add undocumented feature: getMaxZoom
 * 1.0.3 - 2013-05-15 - Updated for Google Maps API v3.x <jmaurer@hawaii.edu>
 * 2.0.0 - 2015-10-19 - Version bump to reflect API naming changes.
 * 2.0.1 - 2015-10-20 - BugFix: opacity changes weren't reflected in getTile
 * 2.1.0 - 2015-10-21 - Modify: trigger opacity_changed on all ImageMapType(s)
 *                      Remove: PanelMapType. Since GMv3, use ImageMapType.
 */


// ===========================================================================
//   Class: NauticalChartsAPI
// ===========================================================================


/**
 * The API object, used to access Chart and Panel metadata and tile layers.
 *
 * @constructor
 * @extends Object
 */
function NauticalChartsAPI() {
  // Programmatic access to the API version.

  /**
   * API version
   * @type string
   */
  this.version = "2.1.0";

  /**
   * Default TileLayer opacity
   * @private
   * @type float
   */
  this.opacity = 0.8;

  /**
   * Array of {@link Chart} objects
   * @type array
   */
  this.charts = [];

  /**
   * Flag indicating load status
   * @private
   * @type bool
   */
  this._loaded = false;

  // Do stuffs
  this.m_initializeRNCs();
  return this;
}
NauticalChartsAPI.prototype = new Object;


/**
 * Test if the API object has loaded and is initialized.
 *
 * @return bool true if loaded, false otherwise
 * @type bool
 */
NauticalChartsAPI.prototype.isLoaded = function() {
  return this._loaded;
}; // END: function isLoaded


/**
 * Fetch the Chart objected identified by chart number (eg. 18740)
 *
 * @param string no A chart number, like 1116A or something.
 * @return Chart The chart object, or null if none found.
 * @type Chart
 */
NauticalChartsAPI.prototype.getChartByNumber = function(no) {
  for(var i=0,n=this.charts.length; i<n; i++) { 
    if( this.charts[i].getNumber() == no ) { 
      return this.charts[i];
    }
  }
  return null;
}; // END: function getChartByNumber(no)


/**
 * Fetch the Panel objected identified by file name (eg. 18740_1, 18740_1.KAP)
 *
 * @param string no A KAP file name, like '18740_1.KAP', or '18740_1'
 * @return Panel The panel object, or null if none found.
 * @type Panel
 */
NauticalChartsAPI.prototype.getPanelByFileName = function(fn) { 
  var cn = fn.split('_')[0];
  var chart = this.getChartByNumber(cn);
  return (!chart) ? null : chart.getPanelByFileName(fn);
}; // END: function getPanelByFileName(fn)


/**
 * Fetch the Panel objected identified by NGA catalog number (eg. 1893)
 *
 * @param int no A panel number, like those assigned by the NGA.
 * @return Panel The panel object, or null if none found.
 * @type Panel
 */
NauticalChartsAPI.prototype.getPanelByNumber = function(no) { 
  for(var i=0,n=this.charts.length; i<n; i++) { 
    var panels = this.charts[i].getPanels();
    for(var j=0,m=panels.length; j<m; j++) { 
      if( panels[j].getNumber() == no ) { 
        return panels[j];
      }
    }
  }
  return null;
}; // END: function getPanelByNumber(no)


/**
 * Fetch an array of all Chart objects.
 *
 * @return array of {@link Chart} objects.
 * @type array
 */
NauticalChartsAPI.prototype.getCharts = function() { 
  return this.charts;
}; // END: function getCharts()


/**
 * Find all charts that contain the point identified by latlng.
 *
 * @param GLatLng latlng A Google latlng object.
 * @return array of {@link Chart} objects having a panel that contains latlng.
 * @type array
 * @see Panel
 */
NauticalChartsAPI.prototype.getChartsByLatLng = function(latlng) { 
  var charts = [];
  for(var i=0,n=this.charts.length; i<n; i++) { 
    if( this.charts[i].hasLatLng(latlng) ) { 
      charts.push( this.charts[i] );
    }
  }
  return charts;
}; // END: function getChartsByLatLng(latlng)


/**
 * Find all panels that contain the point identified by latlng.
 *
 * @param GLatLng latlng A Google latlng object.
 * @return array of {@link Panel} objects that contain latlng.
 * @type array
 */
NauticalChartsAPI.prototype.getPanelsByLatLng = function(latlng) { 
  var panels = [];
  for(var i=0,ni=this.charts.length; i<ni; i++) { 
    for(var j=0,nj=this.charts[i].panels.length; j<nj; j++) { 
      if( this.charts[i].panels[j].hasLatLng(latlng) ) { 
        panels.push( this.charts[i].panels[j] );
      }
    }
  }
  return panels;
}; // END: function getPanelsByLatLng(latlng)


/**
 * Find all charts that overlap bounds.
 *
 * @param GLatLngBounds bounds A Google LatLngBounds object.
 * @return array of {@link Chart} objects having a panel that overlaps bounds.
 * @type array
 * @see Panel
 * @see GLatLngBounds
 */
NauticalChartsAPI.prototype.getChartsByBounds = function(bounds) { 
  var charts = [];
  for(var i=0,n=this.charts.length; i<n; i++) { 
    if( this.charts[i].overlapsBounds(bounds) ) { 
      charts.push( this.charts[i] );
    }
  }
  return charts;
}; // END: function getChartsByBounds(bounds)


/**
 * Find all panels that overlap the specified bounds.
 *
 * @param GLatLngBounds A Google lat/lon bounds object.
 * @return array of {@link Panel} objects that overlap bounds.
 * @type array
 */
NauticalChartsAPI.prototype.getPanelsByBounds = function(bounds) { 
  var panels = [];
  for(var i=0,ni=this.charts.length; i<ni; i++) { 
    for(var j=0,nj=this.charts[i].panels.length; j<nj; j++) { 
      if( this.charts[i].panels[j].overlapsBounds(bounds) ) {
        panels.push( this.charts[i].panels[j] );
      }
    }
  }
  return panels;
}; // END: function getPanelsByBounds(bounds)


/**
 * Find all charts that overlap bounds, as specified by n,e,s,w.
 *
 * @param float n North-most coordinate
 * @param float e East-most coordinate
 * @param float s South-most coordinate
 * @param float w West-most coordinate
 * @return array of {@link Chart} objects having a panel that overlaps bounds.
 * @type array
 * @see NauticalChartsAPI#getChartsByBounds
 */
NauticalChartsAPI.prototype.getChartsByBoundsNESW = function(n,e,s,w) { 
  var bounds = new google.maps.Bounds(
    new google.maps.LatLng(s,w),
    new google.maps.LatLng(n,e)
  );
  return this.getChartsByBounds(bounds);
}; // END: function getChartsByBoundsNESW(n,e,s,w)


/**
 * Find all panels that overlap the specified bounds.
 *
 * @param float n North-most coordinate
 * @param float e East-most coordinate
 * @param float s South-most coordinate
 * @param float w West-most coordinate
 * @return array of {@link Panel} objects that overlap bounds.
 * @type array
 * @see Chart#getPanelsByBounds
 */
NauticalChartsAPI.prototype.getPanelsByBoundsNESW = function(n,e,s,w) { 
  var bounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(s,w),
    new google.maps.LatLng(n,e)
  );
  return this.getPanelsByBounds(bounds);
}; // END: function getPanelsByBoundsNESW(n,e,s,w)


/**
 * Get the opacity of newly created TileLayerOverlays will be.
 *
 * @return float The opacity [0,1] of future created GTileLayerOverlay.
 * @type float
 * @see GTileLayerOverlay
 */
NauticalChartsAPI.prototype.getOpacity = function() { 
  return this.opacity;
}; // END: function getOpacity()


/**
 * Set the opacity of newly created TileLayerOverlays will be.
 *
 * @param float o The opacity [0,1] of future created GTileLayerOverlay.
 * @return bool True if opacity is in range, false otherwise.
 * @type bool
 * @see GTileLayerOverlay
 */
NauticalChartsAPI.prototype.setOpacity = function(o) { 
  o = +o; // make numeric.
  this.opacity = (o>1) ? ((o>100) ? 1 : o/100) : ((o<0) ? 0 : o);
  google.maps.event.trigger(this,'opacity_changed', this.opacity);
  return (o>100||o<0) ? false : true;
}; // END: function setOpacity(o)


/**
 * Load and parse remote JSON metadata.  
 * This is done async to speed-up page load, at expense of complexity.
 *
 * @private
 * @return bool always true
 */
NauticalChartsAPI.prototype.m_initializeRNCs = function() { 
  this._loaded = false;
  var that = this;
  var fn = function(jcharts,status) {
    that.charts = [];
    for(var c=0,nc=jcharts.length; c<nc; c++) { 
      that.charts[c] = new Chart(that);
      var chart = that.charts[c];
      chart.number = jcharts[c].chart_id;
      chart.title  = jcharts[c].title;
      chart.sourceEdition = jcharts[c].source_edition;
      chart.rasterEdition = jcharts[c].raster_edition;
      chart.ntmEdition = jcharts[c].ntm_edition;
      chart.sourceDate = jcharts[c].source_date;
      chart.ntmDate = jcharts[c].ntm_date;
      for(var p=0,np=jcharts[c].panels.length; p<np; p++) { 
        var jpanel = jcharts[c].panels[p];
        that.charts[c].panels[p] = new Panel(chart);
        var panel = that.charts[c].panels[p];
        panel.encodedPolygon = jpanel.encoded_polygon;
        panel.encodedLevels = jpanel.encoded_levels;
        panel.scale = parseInt(jpanel.scale);
        if( jpanel.max_zoom ) { 
          panel.maxZoom = parseInt(jpanel.max_zoom);
        }
        panel.fileName = jpanel.file_name.toUpperCase();
        panel.number = jpanel.panel_no;
      } // end: for panels[0..M-1]
    } // end: for jcharts[0..N-1]

    that._loaded = true;
    if( typeof(google.maps.event) !== 'undefined' ) { 
      google.maps.event.trigger(that,'load');
    }
  };

  if( typeof(jQuery) === 'undefined' ) {
    this.m_appendScript(
      'http://ajax.googleapis.com/ajax/libs/jquery/1.4.3/jquery.min.js',
      'jquery_143', function() { 
        //jQuery.ajaxSetup({async:false});
        jQuery.getJSON('http://cordc.ucsd.edu/js/RNC/rnc.php?callback=?', fn);
      }
    );
  } else {
    // I ALREADY HAVE JQUERY LOADED SO DO NOT RE-APPEND! -jmaurer
    //jQuery.ajaxSetup({async:false});
    jQuery.getJSON('http://cordc.ucsd.edu/js/RNC/rnc.php?callback=?', fn);
  }
}; // END: function m_initializeRNCs()



/**
 * Append a script to the head section of our HTML website.
 * Used to load jQuery's awesome JSON features.
 *
 * @private
 * @param string url A url of a javascript to append to header section.
 * @param name An optional name to give to this script (for replacement later)
 * @param function cb A callback to execute on script load.
 * @return bool true for success, always true.
 * @type bool
 */
NauticalChartsAPI.prototype.m_appendScript = function(url,name,cb) { 
  if( typeof(name) == 'undefined' ) { 
    name = '__nci_' + (new Date()).getTime() + '_' + 
      Math.round(Math.random()*1000);
  } else { 
    name = '__nci_' + name;
  }

  var head = document.getElementsByTagName("head")[0];
  var scriptTag = document.getElementById(name);
  if(scriptTag) head.removeChild(scriptTag);
  script = document.createElement('script');
  script.src = url;
  script.type = 'text/javascript';
  script.id = name;
  script.onload_done = false;

  var that = this;
  script.onload = function() { 
    if( !script.onload_done ) {
      script.onload_done = true; 
      that.m_tell(name);
      if(typeof(cb) !== 'undefined') { 
        cb.call(that);
      }
    }
  };

  script.onreadystatechange = function() { 
    if( ( "loaded"===script.readyState || "complete"===script.readyState )
    && !script.onload_done ) {
      script.onload_done = true; 
      that.m_tell(name);
      if(typeof(cb) !== 'undefined') { 
        cb.call(that);
      }
    }
  }

  head.appendChild(script);
  this.m_wait(name,true);

  return true;
}; // END: function m_appendScript(url,name=null)


/**
 * Notify the object of an event. (Silly-man's event handling)
 *
 * @private
 * @param string name The name of an event to mark as occuring.
 * @return bool always true.
 * @type bool
 */
NauticalChartsAPI.prototype.m_tell = function(name) { 
  if( typeof(this.m_notices) == 'undefined' ) { 
    this.m_notices = [];
  }
  if( typeof(this.m_notices[name]) == 'undefined' ) { 
    this.m_notices[name] = [true,null];
  } else { 
    this.m_notices[name][0] = true;
  }
  return true;
}; // END: function m_tell(name)


/**
 * Wait for an event to occur, then return.  
 * This basically freezes execution until some event happens.
 *
 * @private
 * @param string name The name of an event to mark as occuring.
 * @return bool always true.
 * @type bool
 */
NauticalChartsAPI.prototype.m_wait = function(name,sem) { 
  if( typeof(this.m_notices) == 'undefined' ) { 
    this.m_notices = [];
  }
  // First time this is called, the state is assumed false.
  if( typeof(sem) !== 'undefined'
  ||  typeof(this.m_notices[name]) === 'undefined') { 
    this.m_notices[name] = [false,null];
  }

  if( this.m_notices[name][1] ) { 
    window.clearTimeout(this.m_notices[name][1]);
    this.m_notices[name][1] = null;
  }

  if( !this.m_notices[name][0] ) { 
    // sleep
    // TODO
  } else {
    return true;
  }
}; // END: function m_wait(name,sem)



// ===========================================================================
//   Class: Chart
// ===========================================================================



/**
 * Create a new Chart object.  A chart holds title, edition and panel info.
 *
 * @constructor
 * @extends Object
 * @param NauticalChartsAPI api The parent API object to associate with.
 *
 * @return Chart A new object.
 * @type Chart
 * @see NauticalChartsAPI
 */
function Chart(api) { 
  /**
   * Reference to parent API object
   * @private
   * @type NauticalChartsAPI
   */
  this.api = api;

  /**
   * A chart number (1116A, or something)
   * @private
   * @type string
   */
  this.number = null;

  /**
   * The chart's title
   * @private
   * @type string
   */
  this.title = null;

  /**
   * Data source edition
   * @private
   * @type number
   */
  this.sourceEdition = null;

  /**
   * Printed raster edition
   * @private
   * @type number
   */
  this.rasterEdition = null;

  /**
   * Notice to Mariners edition
   * @private
   * @type number
   */
  this.ntmEdition = null;

  /**
   * Date of data source edition
   * @private
   * @type string
   */
  this.sourceDate = null;

  /**
   * Date of NTM edition
   * @private
   * @type string
   */
  this.ntmDate = null;

  /**
   * Array of {@link Panel} objects.
   * @type array
   */
  this.panels = [];

  // Do stuffs
  return this;
}
Chart.prototype = new Object;


/**
 * Get the parent API object.  Used internally for the most part.
 *
 * @return NauticalChartsAPI
 * @type NauticalChartsAPI
 */
Chart.prototype.getAPI = function() { 
  return this.api;
}; // END: function getAPI()


/**
 * Fetch the chart number of this object (eg. 18740)
 *
 * @return string A chart number.
 * @type string
 */
Chart.prototype.getNumber = function() { 
  return this.number;
}; // END: function getNumber()


/**
 * Fetch the chart title of this object (eg. "San Diego to Santa Rosa Island")
 *
 * @return string The title(s) of this chart.
 * @type string
 */
Chart.prototype.getTitle = function() { 
  return this.title;
}; // END: function getTitle()


/**
 * Fetch the source edition, a number.
 *
 * @return number Source Edition
 * @type number
 */
Chart.prototype.getSourceEdition = function() { 
  return this.sourceEdition;
}; // END: function getSourceEdition()


/**
 * Fetch the raster edition, a number.
 *
 * @return Raster Edition
 * @type number
 */
Chart.prototype.getRasterEdition = function() { 
  return this.rasterEdition;
}; // END: function getRasterEdition()


/**
 * Fetch the NTM (notice to mariners) edition, a number.
 *
 * @return NTM Edition
 * @type number
 */
Chart.prototype.getNTMEdition = function() { 
  return this.ntmEdition;
}; // END: function getNTMEdition()


/**
 * Fetch the date the source edition was published.
 *
 * @return Source Date (YYYY-MM-DD)
 * @type string
 */
Chart.prototype.getSourceDate = function() { 
  return this.sourceDate;
}; // END: function getSourceDate()


/**
 * Fetch the date the NTM edition was published.
 *
 * @return string NTM Date (YYYY-MM-DD)
 * @type string
 */
Chart.prototype.getNTMDate = function() { 
  return this.ntmDate;
}; // END: function getNTMDate()


/**
 * Return a bounding box of all panels contained by this chart.
 *
 * @return GLatLngBounds A bounding box.
 * @type GLatLngBounds
 * @see GLatLngBounds
 */
Chart.prototype.getBounds = function() { 
  if( this.panels.length < 1 ) { 
    return null;
  }
  var bounds = this.panels[0].getBounds();
  for(var i=1,n=this.panels.length; i<n; i++) {
    var tmp = this.panels[i].getBounds();
    bounds.extend(tmp.getSouthWest());
    bounds.extend(tmp.getNorthEast());
  }
  return bounds;
}; // END: function getBounds()


/**
 * Test to see if this chart has data for a specified GLatLng location.
 *
 * @param GLatLng latlng A Google lat/lon object.
 * @return bool true if any {@link Panel} contains the latlng, false if none do.
 * @type bool
 * @see GLatLng
 */
Chart.prototype.hasLatLng = function(latlng) { 
  for(var i=0,n=this.panels.length; i<n; i++) { 
    if( this.panels[i].hasLatLng(latlng) ) { 
      return true;
    }
  }
  return false;
}; // END: function hasLatLng(latlng)


/**
 * Test to see if any of this chart's panels overlap the specified bounds.
 *
 * @param GLatLngBounds A Google lat/lon bounds object.
 * @return bool true if any {@link Panel} overlaps the bounds, false if none.
 * @type bool
 * @see GLatLngBounds
 */
Chart.prototype.overlapsBounds = function(bounds) { 
  return bounds.intersects(this.getBounds());
}; // END: function overlapsBounds(bounds)


/**
 * Test to see if any of this chart's panels overlap the specified bounds.
 *
 * @param float n North-most coordinate
 * @param float e East-most coordinate
 * @param float s South-most coordinate
 * @param float w West-most coordinate
 * @return bool true if any panel overlaps the bounds, false if none do.
 * @type bool
 * @see Chart#overlapsBounds
 */
Chart.prototype.overlapsBoundsNESW = function(n,e,s,w) { 
  var bounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(s,w),
    new google.maps.LatLng(n,e)
  );
  return this.overlapsBounds(bounds);
}; // END: function overlapsBoundsNESW(n,e,s,w)


/**
 * Fetch an array of all panel objects contained by this chart.
 *
 * @return array of {@link Panel} objects.
 * @type array
 */
Chart.prototype.getPanels = function() { 
  return this.panels;
}; // END: function getPanels()


/**
 * Fetch the panel identified by the file name (eg. 18740_1, or 18740_1.KAP)
 *
 * @param string fn A file name. This method safely compares panel file names.
 * @return Panel The object identified by the file name fn, or null if none.
 * @type Panel
 */
Chart.prototype.getPanelByFileName = function(fn) { 
  for(var i=0,n=this.panels.length; i<n; i++) { 
    if( this.panels[i].matchesFileName(fn) ) { 
      return this.panels[i];
    }
  }
  return null;
}; // END: function getPanelByFileName(fn)


/**
 * Fetch the Panel objected identified by NGA catalog number (eg. 1893)
 *
 * @param int no A panel number, like those assigned by the NGA.
 * @return Panel The panel object, or null if none found.
 * @type Panel
 */
Chart.prototype.getPanelByNumber = function(no) { 
  for(var i=0,n=this.panels.length; i<n; i++) { 
    if( panels[i].getNumber() == no ) { 
      return panels[i];
    }
  }
  return null;
}; // END: function getPanelByNumber(no)


/**
 * Find all panels that contain the point identified by latlng.
 *
 * @param GLatLng latlng A Google latlng object.
 * @return array of {@link Panel} objects that contain latlng.
 * @type array
 */
Chart.prototype.getPanelsByLatLng = function(latlng) { 
  var panels = [];
  for(var i=0,n=this.panels.length; i<n; i++) { 
    if( this.panels[i].hasLatLng(latlng) ) { 
      panels.push( this.panels[i] );
    }
  }
  return panels;
}; // END: function getPanelsByLatLng(latlng)


/**
 * Find all panels that overlap the specified bounds.
 *
 * @param GLatLngBounds A Google lat/lon bounds object.
 * @return array of {@link Panel} objects that overlap bounds.
 * @type array
 */
Chart.prototype.getPanelsByBounds = function(bounds) { 
  var panels = [];
  for(var i=0,n=this.panels.length; i<n; i++) { 
    if( this.panels[i].overlapsBounds(bounds) ) { 
      panels.push( this.panels[i] );
    }
  }
  return panels;
}; // END: function getPanelsByBounds(bounds)


/**
 * Find all panels that overlap the specified bounds.
 *
 * @param float n North-most coordinate
 * @param float e East-most coordinate
 * @param float s South-most coordinate
 * @param float w West-most coordinate
 * @return array of {@link Panel} objects that overlap bounds.
 * @type array
 * @see Chart#getPanelsByBounds
 */
Chart.prototype.getPanelsByBoundsNESW = function(n,e,s,w) { 
  var bounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(s,w),
    new google.maps.LatLng(n,e)
  );
  return this.getPanelsByBounds(bounds);
}; // END: function getPanelsByBoundsNESW(n,e,s,w)


// ===========================================================================
//   Class: Panel
// ===========================================================================



/**
 * Create a new Panel object
 *
 * @constructor
 * @extends Object
 * @param Chart chart The parent {@link Chart} object.
 * @return Panel A new Panel object.
 * @type Panel
 * @see Chart
 */
function Panel(chart) {
  /**
   * Reference to parent's {@link chart} object.
   * @private
   * @type Chart
   */
  this.chart = chart;
  
  /**
   * ASCII representation of a GPolygon
   * @private
   * @type string
   */
  this.encodedPolygon = null;

  /**
   * ASCII representation of level-of-detail for a GPolygon
   * @private
   * @type string
   */
  this.encodedLevels = null;

  /**
   * A GPolygon that represents the bounds of the panel
   * @private
   * @type GPolygon
   */
  this.polygon = null;

  /**
   * Map scale resolution (1:40000 would be represented as 40000)
   * @private
   * @type int
   */
  this.scale = null;
  
  /**
   * Max GMap zoom level available.
   * @private
   * @type int
   */
  this.maxZoom = null;
  
  /**
   * The KAP file name (base name) used by NOAA for their RNC storage.
   * @private
   * @type string
   */
  this.fileName = null;
  
  /**
   * The NGA panel number identifier.
   * @private
   * @type int
   */
  this.number = null;

  // Do stuffs
  return this;
}
Panel.prototype = new Object;


/**
 * Get the parent API object.  Used internally for the most part.
 *
 * @return NauticalChartsAPI
 * @type NauticalChartsAPI
 */
Panel.prototype.getAPI = function() { 
  return this.chart.getAPI();
}; // END: function getAPI()


/**
 * Get the parent Chart object.  Used internally for the most part.
 *
 * @return Chart
 * @type Chart
 */
Panel.prototype.getChart = function() { 
  return this.chart;
}; // END: function getChart()


/**
 * Fetch the string representation of the polygon that identifies this panel.
 *
 * @return string Some ASCII encoding of a polyline.
 * @type string
 */
Panel.prototype.getEncodedPolygon = function() { 
  return this.encodedPolygon;
}; // END: function getEncodedPolygon()


/**
 * Fetch the string representation of the polygon's level-of-detail
 *
 * @return string Some ASCII encoding of a polyline's level-of-detail.
 * @type string
 */
Panel.prototype.getEncodedLevels = function() { 
  return this.encodedLevels;
}; // END: function getEncodedLevels()


/**
 * Create a new GPolygon object using the internal encoded representation
 * of the bounds (an encodedPolygon, with encodedLevels)
 *
 * @return GPolygon A new Google GPolygon object.
 * @type GPolygon
 */
Panel.prototype.getPolygon = function() { 
  if( !this.polygon ) { 
    this.polygon = new google.maps.Polygon({
      'paths':google.maps.geometry.encoding.decodePath( this.encodedPolygon ),
      'fillColor':'#333',
      'fillOpacity':0.1,
      'strokeColor':'#f33',
      'strokeOpacity':0.5,
      'strokeWeight':2
    });
  }
  return this.polygon;
}; // END: function getPolygon()


/**
 * Fetch the scale of the current chart panel (1:40000 would return 40000).
 *
 * @return int The map scale.
 * @type int
 */
Panel.prototype.getScale = function() { 
  return this.scale;
}; // END: function getScale()


/**
 * Fetch the max zoom level available for the current panel.
 *
 * @return int The max available zoom level.
 * @type int
 */
Panel.prototype.getMaxZoom = function() { 
  return this.maxZoom;
}; // END: function getMaxZoom()


/**
 * Fetch the panel's KAP file name (base name) used by NOAA for RNC storage.
 *
 * @return string The file's base name (eg. 18740_1.KAP)
 * @type string
 */
Panel.prototype.getFileName = function() { 
  return this.fileName;
}; // END: function getFileName()


/**
 * Test if the user's file name matches the panel's file name.
 * A user may provide a file name like 18740_1, 18740_1.KAP, or 18740_1.kap .
 * This method will compare the core components.  Case insensitive.
 *
 * @param string fn A file name to compare Panel's fileName to.
 * @return bool true if core components match, false otherwise.
 * @type bool
 */
Panel.prototype.matchesFileName = function(fn) {
  fn = fn.toUpperCase().replace(/^.*?(\/|\\)/,'').replace(/\..*$/,'');
  return (this.fileName.replace(/\..*$/,'') == fn);
}; // END: function getFileName()


/**
 * Fetch the panel number, as assigned by the NGA.
 *
 * @return int The NGA panel number.
 * @type int
 */
Panel.prototype.getNumber = function() { 
  return this.number;
}; // END: function getNumber()


/**
 * Determine if this panel contains the point specified by latlng.
 *
 * @param GLatLng latlng A Google lat/lon object.
 * @return bool true if panel contains point, false otherwise.
 * @type bool
 */
Panel.prototype.hasLatLng = function(latlng) { 
  return google.maps.geometry.poly.containsLocation(latlng, this.getPolygon());
}; // END: function hasLatLng(latlng)


/**
 * Fetch the bounds of this panel.  The bounds is simply the polygon's bounds.
 *
 * @return GLatLngBounds A Google lat/lon bounds object.
 * @type GLatLngBounds
 */
Panel.prototype.getBounds = function() { 
  var bounds = new google.maps.LatLngBounds();
  this.getPolygon().getPath().forEach( function(latlng) {
    bounds.extend(latlng);
  }); 
  return bounds;
}; // END: function getBounds()


/**
 * Determine if this panel overlaps the bounds specified by bounds.
 *
 * @param GLatLngBounds bounds A Google lat/lon bounds object.
 * @return bool true if panel overlaps bounds, false otherwise.
 * @type bool
 */
Panel.prototype.overlapsBounds = function(bounds) { 
  return bounds.intersects( this.getBounds() );
}; // END: function overlapsBounds(bounds)


/**
 * Determine if this panel overlaps the bounds specified by bounds.
 *
 * @param float n The North-most coordinate
 * @param float e The East-most coordinate
 * @param float s The South-most coordinate
 * @param float w The West-most coordinate
 * @return bool true if panel overlaps bounds, false otherwise.
 * @type bool
 * @see Panel#overlapsBounds
 */
Panel.prototype.overlapsBoundsNESW = function(n,e,s,w) { 
  var bounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(s,w),
    new google.maps.LatLng(n,e)
  );
  return this.overlapsBounds(bounds);
}; // END: function overlapsBoundsNESW(n,e,s,w)


/**
 * Initialize & fetch Google ImageMapType object that represents this panel.
 *
 * @return ImageMapType An ImageMapType that can be added to a Google map.
 * @type ImageMapType
 * @see google.maps.ImageMapType 
 */
Panel.prototype.getMapType = function() {
  if( typeof(this._mapType) === 'undefined' ) {
    var fn = this.getFileName().replace(/\..*$/,'');
    var chart_id = fn.split('_')[0];
    var opts = {
      alt: fn,
      name: fn,
      minZoom: 0,
      maxZoom: this.getMaxZoom() || 18,
      opacity: this.getAPI().getOpacity() || 1,
      tileSize: new google.maps.Size(256,256),

      getTileUrl: function(t, z) {
        if( z < this.minZoom || z > this.maxZoom ) {
          return null;
        }
        var zz = (z<10) ? '0'+z : z;
        var nx = Math.pow(2,z);
        return 'http://mosaic.ucsd.edu/tiles/charts/gif'+
          '/'+chart_id+'/latest/'+fn+
          '/'+zz+'/z'+z+'y'+t.y+'x'+((nx+t.x)%nx)+'.gif';
      }
    };

    var mapType = new google.maps.ImageMapType(opts);
    this._mapType = mapType;
    google.maps.event.addListener(this.getAPI(),
      'opacity_changed', function(o) { mapType.setOpacity(o); });
  }
  return this._mapType;
}; // END: function getMapType()


// ===========================================================================
// EOF -- NauticalChartsAPI.js
// ===========================================================================
