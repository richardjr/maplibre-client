import {MaplibreClient} from '../src/index';

document.addEventListener('DOMContentLoaded', () => {
    const map = new MaplibreClient({
        style:'style.json',
        maxZoom: 25,
        minZoom: 1,
        icons: [
            {
                'name': 'Start',
                'url': "icons/start.png",
            }
        ],
        debug: false
    });

    const drawButton = document.querySelector('#draw') as HTMLButtonElement;
    drawButton.addEventListener('click', () => {
        map.LineDrawMode('data', true);
    });


    const finishDrawButton = document.querySelector('#fdraw') as HTMLButtonElement;
    finishDrawButton.addEventListener('click', () => {
        map.finaliseLineDraw('data',{colour: "green"});
    });

    function dropMarker(point:[]) {
        map.addGeojson({type: "FeatureCollection",features: [{type: "Feature", properties:{icon:"Start"}, geometry: {type: "Point", coordinates: point}}]},'data', false, {merge:true})
        map.clearAllEvents();
    }

    const dropButton = document.querySelector('#drop') as HTMLButtonElement;
    dropButton.addEventListener('click', () => {
        map.clickEvent({ hook:dropMarker});
    });

    function editPoint(point: [], event: Event, features: any[]) {
        event.preventDefault();
        map.dragFeature('data', features[0].properties.id);

    }

    function editLineString(point: [], event: Event, features: any[]) {
        if(features.length>0)
            map.LineDrawMode('data', true, {type: "FeatureCollection", features: [features[0]]});
    }

    const editButton = document.querySelector('#edit') as HTMLButtonElement;
    editButton.addEventListener('click', () => {
        map.clearAllEvents();
        map.addEvent({event_type: 'mousedown', hook:editPoint, clear:true, layer_name: 'data', layer_filter:['data']});
        map.addEvent({event_type: 'click', layer_filter:['data-strings'], hook:editLineString, clear:false});
    });
});