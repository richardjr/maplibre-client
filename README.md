# maplibre-client

A client for the MapLibre API giving simple access to basic map functionality.

## Installation

```bash
npm install git://github.com/nautoguide/maplibre-client.git

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

### Simple react component

```typescript
import React, {useEffect, useRef} from "react";
import pkg from 'maplibre-client';
const {MaplibreClient} = pkg;

interface MapProps {
    geojson: {
        type?: string,
        features?: []
    };
}

const Map: React.FC<MapProps> = ({ geojson }) => {

    const mapRef = useRef(null);
    const map = useRef(null);

    useEffect(() => {
        if(!map.current) {
            map.current = new MaplibreClient({
                style: '/mapfile.json',
                maxZoom: 25,
                minZoom: 1,
            });
        }
    },[]);

    useEffect(() => {
        if(map.current ) {
            if ( geojson && geojson.features && geojson.features.length > 0) {
                map.current.addGeojson(geojson, 'data', true);
            }
        }

    },[geojson]);

    return (
        <main className="flex-grow relative">
                <div id={"map"} ref={mapRef} className={"w-full bg-gray-300"} style={{ height: 'calc(100vh - 144px)' }}/>
        </main>
    );
}

export default Map;
```