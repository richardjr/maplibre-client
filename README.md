# maplibre-client

A client for the MapLibre API giving simple access to basic map functionality.

## Installation

```bash
pip install maplibre-client
```

## Usage

```javascript
import {MaplibreClient} from 'maplibre-client';

const map = new MaplibreClient({
        style:'/mapfiles/?file=os-road.json',
        maxZoom: 25,
        icons: [
            {
                'name': 'Start',
                'url': "/static/img/start.png",
            },
            {
                'name': 'End',
                'url': "/static/img/end.png",
            },
            {
                'name': 'House',
                'url': "/static/img/link.png",
            }
        ]
    });
```

## Development

```bash
git clone
cd maplibre-client
npm link
cd ../your-project
npm link maplibre-client
```

## API

### addGeojson

Add a GeoJSON object to the map.

```javascript
map.addGeojson({type: "FeatureCollection",features: [{type: "Feature", geometry: {type: "Point", coordinates: lonLat}}]},'data', false, {merge:true})
```

### clearAllEvents

Clear all events from the map.

```javascript
map.clearAllEvents();
```

## Examples

### Drop an icon on the map

```javascript

// Event handler for dropping a marker on the map by clicking
function dropMarker(lonLat: any[],event: Event) {
	map.addGeojson({type: "FeatureCollection",features: [{type: "Feature", geometry: {type: "Point", coordinates: lonLat}}]},'data', false, {merge:true})
	map.clearAllEvents();
}

// add a click event to the map
map.clickEvent({'layer':'data', 'hook':dropMarker, 'clear':true});
```

### Draw a line on the map

```javascript

map.LineDrawMode('data', true);
// Add this to a button to finish the drawing
map.finaliseLineDraw('data',{colour: "green"});
```