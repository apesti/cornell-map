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
}

httpGetAsync('./data/buildings.json', processBuildingData);

function addBuilding(building) {
  var builtDate = new Date(building.properties.builtDate.year,
    building.properties.builtDate.month-1,
    building.properties.builtDate.day);

  if (builtDate > currentDate) {
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

  buildingFeature.properties.builtDate = building.properties.builtDate;
  buildingFeature.properties.destroyedDate = building.properties.destroyedDate;
  buildingFeature.properties.name = name;

  buildingLayer.addData(buildingFeature);
}

function processBuilding(building, layer) {
  var builtDate = new Date(building.properties.builtDate.year,
    building.properties.builtDate.month-1,
    building.properties.builtDate.day);
  var tooltipString = `<b>Name</b>: ${building.properties.name}
    <br><b>Date Built</b>: ${builtDate.toLocaleDateString()}`
  if (typeof building.properties.destroyedDate !== 'undefined') {
    var destroyedDate = new Date(building.properties.destroyedDate.year,
      building.properties.destroyedDate.month-1,
      building.properties.destroyedDate.day);
    tooltipString +=
      `<br><b>Date Destroyed</b>: ${destroyedDate.toLocaleDateString()}<br>`;
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
updateBuildings();

L.Control.DatePicker = L.Control.extend({
    onAdd: function(map) {
        var datepicker = L.DomUtil.get('datepickerp');
        L.DomEvent.disableClickPropagation(datepicker)
        return datepicker;
    },
    onRemove: function(map) {}
});

L.control.datepicker = function(opts) {
    return new L.Control.DatePicker(opts);
};

L.control.datepicker({ position: 'topright' }).addTo(map);

$( "#datepicker" ).datepicker({
  defaultDate: currentDate.toLocaleDateString(),
  onClose: function(date, datepicker) {
    currentDate = new Date(datepicker.currentDay,
      datepicker.currentMonth,
      datepicker.currentYear);
    updateBuildings();
  }
});

$( "#datepicker" ).datepicker(
  "setDate" , currentDate.toLocaleDateString()
);
