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
function dropMarker(point:[]) {
	map.addGeojson({type: "FeatureCollection",features: [{type: "Feature", geometry: {type: "Point", coordinates: point}}]},'data', false, {merge:true})
	map.clearAllEvents();
}

// add a click event to the map
map.clickEvent({ 'hook':dropMarker, 'clear':true});
```

### Draw a line on the map

```typescript

map.LineDrawMode('data', true);
// Add this to a button to finish the drawing
const finishDrawButton = document.querySelector('#fdraw') as HTMLButtonElement;
finishDrawButton.addEventListener('click', () => {
	map.finaliseLineDraw('data', {colour: "green"});
});
```

### Edit things

```typescript
function editFeatures(point: [], event: Event, features: any[]) {
    if (features.length > 0) {
        const feature = features[0];
        if (feature.geometry.type === 'Point') {
            // Do something with the point
        }
        if (feature.geometry.type === 'LineString') {
            // Replay the feature into line edit
            map.LineDrawMode('data', true, {type: "FeatureCollection", features: [feature]});

        }
    }
}

map.clickEvent({layer_filter:['data','data-strings'], hook:editFeatures, clear:true});
```