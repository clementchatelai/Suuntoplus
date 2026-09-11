var slopeSamples = [];

var slopeSampleCount = 0;

var state = {};

var recordSlope = function(output, rawSlope) {

var total = 0;

var index;

if (slopeSampleCount < 3) {

slopeSamples[slopeSampleCount] = rawSlope;

++slopeSampleCount;


} else {


slopeSamples[0] = slopeSamples[1];

slopeSamples[1] = slopeSamples[2];

slopeSamples[2] = rawSlope;


}

for (index = 0; index < slopeSampleCount; ++index) total += slopeSamples[index];

output.slopeDeg = Math.max(0, Math.min(55, Math.round(total / slopeSampleCount)));

};

var resetSlopeSmoothing = function() {

slopeSamples[0] = 0;

slopeSamples[1] = 0;

slopeSamples[2] = 0;

slopeSampleCount = 0;

};

var resetState = function() {

state.previousLatitude = 0;

state.previousLongitude = 0;

state.previousAltitude = 0;

state.previousDistance = 0;

state.straightStartDistance = 0;

state.lastTraverseMidLatitude = 0;

state.lastTraverseMidLongitude = 0;

state.lastTraverseMidAltitude = 0;

state.lastSegmentBearing = 0;

state.lastSegmentDistance = 0;

state.straightStartBearing = 0;

state.straightStartLatitude = 0;

state.straightStartLongitude = 0;

state.straightStartAltitude = 0;

state.straightDistance = 0;

state.traverseBearing = 0;

state.traverseDistance = 0;

state.traverseStartLatitude = 0;

state.traverseStartLongitude = 0;

state.traverseStartAltitude = 0;

state.traverseMidLatitude = 0;

state.traverseMidLongitude = 0;

state.traverseMidAltitude = 0;

state.conversionActive = false;

state.newTraverseStartLatitude = 0;

state.newTraverseStartLongitude = 0;

state.newTraverseStartAltitude = 0;

state.newTraverseDistance = 0;

state.newTraverseBearing = 0;

state.newTraverseMidLatitude = 0;

state.newTraverseMidLongitude = 0;

state.newTraverseMidAltitude = 0;

state.gpsReady = 0;

};

var angleDifference = function(firstBearing, secondBearing) {

var difference = Math.abs(firstBearing - secondBearing);

if (difference > Math.PI) {


difference = 2 * Math.PI - difference;


}

return difference;

};

function onLoad(_input, output) {

resetSlopeSmoothing();

resetState();

output.slopeDeg = 0;

output.riskLevel = 2;

output.slopeBand = 2;

output.isDescending = 0;

output.slopeMethod = -1;

}

function onExerciseStart(_input, output) {

resetSlopeSmoothing();

resetState();

output.isDescending = 0;

output.slopeMethod = -1;

}

function onEvent(_input, output, eventId) {

if (eventId == 8) {


resetSlopeSmoothing();

resetState();

output.slopeDeg = 0;

output.isDescending = 0;

output.slopeMethod = -1;


}

var slopeLevel = output.slopeDeg >= 40 ? 4 : output.slopeDeg >= 35 ? 3 : output.slopeDeg >= 30 ? 2 : output.slopeDeg >= 25 ? 1 : 0;

output.riskLevel = slopeLevel;

output.slopeBand = slopeLevel;

}

function evaluate(input, output) {

var coordinates = input.coordinates;

var gpsCoordinates = input.gpsCoordinates;

var latitude;

var longitude;

var altitude = input.altitude;

var distance = input.distance;

var earthRadius = 6371000;

var latitudeDelta;

var longitudeDelta;

var northSouth;

var eastWest;

var horizontalDistance;

var verticalDistance;

var currentBearing;

var bearingChange;

var currentSegmentDistance;

var currentMidLatitude;

var currentMidLongitude;

var currentMidAltitude;

var midNorthSouth;

var midEastWest;

var conversionThreshold = 65 * Math.PI / 180;

var conversionStabilityThreshold = 35 * Math.PI / 180;

var traverseConfirmationDistance = 20;

if (coordinates && coordinates.geoCoordinate) {


coordinates = coordinates.geoCoordinate;


} else if (coordinates && coordinates.value) {


coordinates = coordinates.value;


}

if (coordinates) {


if (typeof coordinates.latitude == 'number' && typeof coordinates.longitude == 'number') {

  latitude = coordinates.latitude > 90 ? coordinates.latitude / 10000000 : coordinates.latitude;

  longitude = coordinates.longitude > 180 ? coordinates.longitude / 10000000 : coordinates.longitude;

} else if (typeof coordinates.latitudeE7 == 'number' && typeof coordinates.longitudeE7 == 'number') {

  latitude = coordinates.latitudeE7 / 10000000;

  longitude = coordinates.longitudeE7 / 10000000;

}

if (typeof altitude != 'number' && typeof coordinates.altitude == 'number') { altitude = coordinates.altitude; }


}

if (typeof latitude != 'number' && typeof longitude != 'number' && typeof gpsCoordinates == 'string') {


var gpsText = gpsCoordinates.toUpperCase();

var gpsNumbers = gpsText.match(/-?[0-9]+(?:\.[0-9]+)?/g);

if (gpsNumbers && gpsNumbers.length >= 2) {

  latitude = parseFloat(gpsNumbers[0]);

  longitude = parseFloat(gpsNumbers[1]);

  if (gpsText.indexOf('S') >= 0) { latitude = -Math.abs(latitude); }

  if (gpsText.indexOf('W') >= 0) { longitude = -Math.abs(longitude); }

}


}

if (typeof latitude == 'number' && !isNaN(latitude) && typeof longitude == 'number' && !isNaN(longitude) && typeof altitude == 'number' && !isNaN(altitude)) {


if (state.gpsReady == 0) {

  state.previousLatitude = latitude;

  state.previousLongitude = longitude;

  state.previousAltitude = altitude;

  state.gpsReady = 1;

} else if (state.gpsReady == 1) {

  latitudeDelta = (latitude - state.previousLatitude) * Math.PI / 180;

  longitudeDelta = (longitude - state.previousLongitude) * Math.PI / 180;

  northSouth = latitudeDelta * earthRadius;

  eastWest = longitudeDelta * earthRadius * Math.cos(latitude * Math.PI / 180);

  horizontalDistance = Math.sqrt(northSouth * northSouth + eastWest * eastWest);

  if (horizontalDistance >= 10) {

    state.lastSegmentBearing = Math.atan2(eastWest, northSouth);

    state.lastSegmentDistance = horizontalDistance;

    state.straightStartBearing = state.lastSegmentBearing;

    state.straightStartLatitude = state.previousLatitude;

    state.straightStartLongitude = state.previousLongitude;

    state.straightStartAltitude = state.previousAltitude;

    state.straightDistance = horizontalDistance;

    state.traverseBearing = state.lastSegmentBearing;

    state.traverseDistance = horizontalDistance;

    state.traverseStartLatitude = state.previousLatitude;

    state.traverseStartLongitude = state.previousLongitude;

    state.traverseStartAltitude = state.previousAltitude;

    state.traverseMidLatitude = (state.previousLatitude + latitude) / 2;

    state.traverseMidLongitude = (state.previousLongitude + longitude) / 2;

    state.traverseMidAltitude = (state.previousAltitude + altitude) / 2;

    state.lastTraverseMidLatitude = state.traverseMidLatitude;

    state.lastTraverseMidLongitude = state.traverseMidLongitude;

    state.lastTraverseMidAltitude = state.traverseMidAltitude;

    state.previousLatitude = latitude;

    state.previousLongitude = longitude;

    state.previousAltitude = altitude;

    state.gpsReady = 2;

  }

} else {

  latitudeDelta = (latitude - state.previousLatitude) * Math.PI / 180;

  longitudeDelta = (longitude - state.previousLongitude) * Math.PI / 180;

  northSouth = latitudeDelta * earthRadius;

  eastWest = longitudeDelta * earthRadius * Math.cos(latitude * Math.PI / 180);

  horizontalDistance = Math.sqrt(northSouth * northSouth + eastWest * eastWest);

  if (horizontalDistance >= 5) {

    currentSegmentDistance = horizontalDistance;

    currentBearing = Math.atan2(eastWest, northSouth);

    output.isDescending = altitude < state.previousAltitude ? 1 : 0;

    if (!state.conversionActive) {

      bearingChange = angleDifference(currentBearing, state.traverseBearing);

      if (bearingChange >= conversionThreshold) {

        state.conversionActive = true;

        state.newTraverseStartLatitude = state.previousLatitude;

        state.newTraverseStartLongitude = state.previousLongitude;

        state.newTraverseStartAltitude = state.previousAltitude;

        state.newTraverseDistance = currentSegmentDistance;

        state.newTraverseBearing = currentBearing;

        state.newTraverseMidLatitude = (state.previousLatitude + latitude) / 2;

        state.newTraverseMidLongitude = (state.previousLongitude + longitude) / 2;

        state.newTraverseMidAltitude = (state.previousAltitude + altitude) / 2;

      } else {

        state.straightDistance += currentSegmentDistance;

        state.traverseDistance += currentSegmentDistance;

        if (state.traverseDistance > 0) {

          state.traverseMidLatitude =
            (state.traverseStartLatitude + latitude) / 2;

          state.traverseMidLongitude =
            (state.traverseStartLongitude + longitude) / 2;

          state.traverseMidAltitude =
            (state.traverseStartAltitude + altitude) / 2;

        }

        if (state.straightDistance >= 80) {

          verticalDistance = Math.abs(altitude - state.straightStartAltitude);

          recordSlope(output, Math.atan2(verticalDistance, state.straightDistance) * 180 / Math.PI);

          output.slopeMethod = 1;

          state.straightStartLatitude = latitude;

          state.straightStartLongitude = longitude;

          state.straightStartAltitude = altitude;

          state.straightDistance = 0;

        }

      }

    } else {

      bearingChange = angleDifference(currentBearing, state.newTraverseBearing);

      if (bearingChange <= conversionStabilityThreshold) {

        state.newTraverseDistance += currentSegmentDistance;

        state.newTraverseMidLatitude =
          (state.newTraverseStartLatitude + latitude) / 2;

        state.newTraverseMidLongitude =
          (state.newTraverseStartLongitude + longitude) / 2;

        state.newTraverseMidAltitude =
          (state.newTraverseStartAltitude + altitude) / 2;

        if (state.newTraverseDistance >= traverseConfirmationDistance) {

          midNorthSouth =
            (state.newTraverseMidLatitude - state.traverseMidLatitude) *
            Math.PI / 180 * earthRadius;

          midEastWest =
            (state.newTraverseMidLongitude - state.traverseMidLongitude) *
            Math.PI / 180 * earthRadius *
            Math.cos(state.newTraverseMidLatitude * Math.PI / 180);

          horizontalDistance =
            Math.sqrt(
              midNorthSouth * midNorthSouth +
              midEastWest * midEastWest
            );

          if (horizontalDistance >= 5) {

            verticalDistance =
              Math.abs(
                state.newTraverseMidAltitude -
                state.traverseMidAltitude
              );

            recordSlope(
              output,
              Math.atan2(verticalDistance, horizontalDistance) *
              180 / Math.PI
            );

            output.slopeMethod = 0;

          }

          state.traverseBearing = state.newTraverseBearing;

          state.traverseDistance = state.newTraverseDistance;

          state.traverseStartLatitude = state.newTraverseStartLatitude;

          state.traverseStartLongitude = state.newTraverseStartLongitude;

          state.traverseStartAltitude = state.newTraverseStartAltitude;

          state.traverseMidLatitude = state.newTraverseMidLatitude;

          state.traverseMidLongitude = state.newTraverseMidLongitude;

          state.traverseMidAltitude = state.newTraverseMidAltitude;

          state.lastTraverseMidLatitude = state.traverseMidLatitude;

          state.lastTraverseMidLongitude = state.traverseMidLongitude;

          state.lastTraverseMidAltitude = state.traverseMidAltitude;

          state.straightStartLatitude = latitude;

          state.straightStartLongitude = longitude;

          state.straightStartAltitude = altitude;

          state.straightDistance = 0;

          state.conversionActive = false;

        }

      } else {

        state.newTraverseStartLatitude = state.previousLatitude;

        state.newTraverseStartLongitude = state.previousLongitude;

        state.newTraverseStartAltitude = state.previousAltitude;

        state.newTraverseDistance = currentSegmentDistance;

        state.newTraverseBearing = currentBearing;

        state.newTraverseMidLatitude =
          (state.previousLatitude + latitude) / 2;

        state.newTraverseMidLongitude =
          (state.previousLongitude + longitude) / 2;

        state.newTraverseMidAltitude =
          (state.previousAltitude + altitude) / 2;

      }

    }

    state.lastSegmentBearing = currentBearing;

    state.lastSegmentDistance = currentSegmentDistance;

    state.previousLatitude = latitude;

    state.previousLongitude = longitude;

    state.previousAltitude = altitude;

  }

}


} else if (typeof distance == 'number' && typeof altitude == 'number') {


if (state.gpsReady == 0) {

  state.previousDistance = distance;

  state.straightStartDistance = distance;

  state.straightDistance = 0;

  state.previousAltitude = altitude;

  state.gpsReady = 1;

} else {

  horizontalDistance = distance - state.previousDistance;

  verticalDistance = Math.abs(altitude - state.previousAltitude);

  if (horizontalDistance >= 30) {

    state.straightDistance = Math.max(0, distance - state.straightStartDistance);

    recordSlope(output, Math.atan2(verticalDistance, horizontalDistance) * 180 / Math.PI);

    output.isDescending = altitude < state.previousAltitude ? 1 : 0;

    output.slopeMethod = 1;

    state.previousDistance = distance;

    state.previousAltitude = altitude;

  }

}


}

var slopeLevel = output.slopeDeg >= 40 ? 4 : output.slopeDeg >= 35 ? 3 : output.slopeDeg >= 30 ? 2 : output.slopeDeg >= 25 ? 1 : 0;

output.riskLevel = slopeLevel;

output.slopeBand = slopeLevel;

}

function getUserInterface() {

var displayId = '{{ DISPLAY_ID }}';

return { template: 't-' + displayId };

}

function getSummaryOutputs(_input, output) {

return [


{ id: 'slope', name: 'Maximum slope (deg)', format: 'Count_Fourdigits', value: output.slopeDeg },

{ id: 'risk', name: 'Risk level', format: 'Count_Fourdigits', value: output.riskLevel },


];

}
