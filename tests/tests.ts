import {MaplibreClient} from '../src/index';

document.addEventListener('DOMContentLoaded', () => {
    const map = new MaplibreClient({
        style:'style.json',
        maxZoom: 25,
        minZoom: 1,
        icons: [
            {
                'name': 'Start',
                'url': "/static/img/start.png",
            }
        ]
    });

    const drawButton = document.querySelector('#draw') as HTMLButtonElement;
    drawButton.addEventListener('click', () => {
        map.LineDrawMode('data', true);
    });


    const finishDrawButton = document.querySelector('#fdraw') as HTMLButtonElement;
    finishDrawButton.addEventListener('click', () => {
        map.finaliseLineDraw('data',{colour: "green"});
    });

});