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
        debug: true
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

    function editFeatures(point: [], event: Event, features: any[]) {
        console.log(features);
        if (features.length > 0) {
            const feature = features[0];
            if (feature.geometry.type === 'Point') {
                //map.clickEvent({'layer': 'data', 'hook': moveFeaturePoint, 'clear': true});
            }
            if (feature.geometry.type === 'LineString') {
                map.LineDrawMode('data', true, {type: "FeatureCollection", features: [feature]});

            }
        }
    }

    const editButton = document.querySelector('#edit') as HTMLButtonElement;
    editButton.addEventListener('click', () => {
        map.clickEvent({layer_filter:['data','data-strings'], hook:editFeatures, clear:true});
    });
});