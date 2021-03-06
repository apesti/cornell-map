var map = L.map("mapid").setView([42.4469, -76.4820], 15.5);

L.tileLayer("https://api.mapbox.com/styles/v1/apesti/{style}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery &copy; <a href=\"https://www.mapbox.com/\">Mapbox</a>",
  maxZoom: 20,
  style: "cjt9enzhl070n1fp55qvcqbd2",
  accessToken: "pk.eyJ1IjoiYXBlc3RpIiwiYSI6ImNqdDllbmN5bDAzajc0M28zZTMxd2twbzgifQ.JeDPzf_2Zca6MY8Oy5Lj1A"
}).addTo(map);

var currentDate = new Date("10/7/1868");

var buildingStyle = {
  "color": "#dbccb3",
  "stroke": false,
  "fillOpacity": 1.0,
};

function httpGetAsync(url, callback) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
      callback(xmlHttp.responseText);
  }
  xmlHttp.open("GET", url, true);
  xmlHttp.send();
}

function processBuildingData(data) {
  window.buildings = JSON.parse(data).buildings;

  updateBuildings();

  $( function() {
    $( "#slider" ).slider({
      min: currentDate.getTime(),
      max: Math.ceil(new Date().getTime()/86400000)*86400000,
      step: 86400000,
      value: currentDate.getTime(),
      slide: function( event, ui ) {
        var date = new Date(ui.value);
        $( "#datepicker" ).datepicker(
          "setDate" , date.toLocaleDateString()
        );
        currentDate = date;
        updateBuildings();
      }
    });
  } );

  $( "#datepicker" ).datepicker({
    defaultDate: currentDate.toLocaleDateString(),
    onClose: function(date, datepicker) {
      currentDate = new Date(datepicker.currentYear,
        datepicker.currentMonth,
        datepicker.currentDay);
      updateBuildings();
    }
  });

  $( "#datepicker" ).datepicker(
    "setDate" , currentDate.toLocaleDateString()
  );
}

httpGetAsync('./data/buildings.json', processBuildingData);

function addBuilding(building) {
  var openedDate = new Date(building.properties.openedDate.year,
    building.properties.openedDate.month-1,
    building.properties.openedDate.day);

  if (openedDate > currentDate) {
    return;
  }

  var name;
  var i;
  for (i = 0; i < building.properties.names.length; i++) {
    var nameDate = new Date(building.properties.names[i].date.year,
      building.properties.names[i].date.month-1,
      building.properties.names[i].date.day);

    if (nameDate > currentDate) {
      break
    }

    name = building.properties.names[i].name;
  }

  var buildingFeature;
  for (i = 0; i < building.features.length; i++) {
    var modifiedDate = new Date(building.features[i].properties.date.year,
      building.features[i].properties.date.month-1,
      building.features[i].properties.date.day);

    if (modifiedDate > currentDate) {
      break
    }

    buildingFeature = building.features[i];
  }

  buildingFeature.properties.openedDate = building.properties.openedDate;
  buildingFeature.properties.destroyedDate = building.properties.destroyedDate;
  buildingFeature.properties.name = name;

  buildingLayer.addData(buildingFeature);
}

function processBuilding(building, layer) {
  var openedDate = new Date(building.properties.openedDate.year,
    building.properties.openedDate.month-1,
    building.properties.openedDate.day);
  var tooltipString = `<b>Name</b>: ${building.properties.name}
    <br><b>Opened</b>: ${openedDate.toLocaleDateString()}`
  if (typeof building.properties.destroyedDate !== 'undefined') {
    var destroyedDate = new Date(building.properties.destroyedDate.year,
      building.properties.destroyedDate.month-1,
      building.properties.destroyedDate.day);
    tooltipString +=
      `<br><b>Destroyed</b>: ${destroyedDate.toLocaleDateString()}<br>`;
  }
  layer.bindPopup(tooltipString);
}

function updateBuildings() {
  buildingLayer.clearLayers();
  window.buildings.forEach(addBuilding);
  buildingLayer.setStyle(buildingStyle);
}


var buildingLayer = L.geoJSON().addTo(map);
buildingLayer.options.onEachFeature = processBuilding;

L.Control.DatePicker = L.Control.extend({
    onAdd: function(map) {
        var datepicker = L.DomUtil.get('dateselector');
        L.DomEvent.disableClickPropagation(datepicker)
        return datepicker;
    },
    onRemove: function(map) {}
});

L.control.datepicker = function(opts) {
    return new L.Control.DatePicker(opts);
};

L.control.datepicker({ position: 'topright' }).addTo(map);
