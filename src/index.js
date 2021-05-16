import * as PIXI from 'pixi.js'

import domready from "domready"
// noinspection ES6UnusedImports
import STYLE from "./style.css"
import Fader from "./Fader";
import pako from "pako";
import { toRGB } from "./rgb";
import printHex from "./printHex";

const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;
const DEG2RAD_FACTOR = TAU / 360;

const config = {
    width: 0,
    height: 0
};

let app, saturdayMorning;

function onResize()
{
    const origWidth = (window.innerWidth) | 0;
    let width = origWidth;
    let height = (window.innerHeight) | 0;

    if (width / height < 2)
    {
        height = width * 2;
    }
    else
    {
        width = height * 2;
    }

    config.width = width;
    config.height = height;

    app.view.style.paddingLeft = Math.round((origWidth - width) / 2) + "px";

    saturdayMorning.scale.x = width / 1900
    saturdayMorning.scale.y = height / 950

    app.renderer.resize(width, height);

}


function checkStatus(response) {
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }
    return response;
}

let start, song;

window.onload = () => {

    song = document.getElementById("song");


    const {width, height} = config;


    // app = new PIXI.Application({
    //     width,
    //     height,
    //     antialias: true
    // });
    //
    // document.body.appendChild(app.view);
    //
    // // load the texture we need
    // PIXI.Loader.shared.add('saturdayMorning', 'media/saturday-morning.jpg').load((loader, resources) => {
    //
    //
    //     saturdayMorning = new PIXI.Sprite(resources.saturdayMorning.texture);
    //
    //
    //
    //     //app.stage.addChild(saturdayMorning);
    //
    //     // Listen for frame updates
    //     app.ticker.add(() => {
    //
    //         const now = performance.now();
    //
    //     });
    //
    //     onResize();
    //     window.addEventListener("resize", onResize, true);
    //
    //     start = performance.now();
    // });

    fetch("media/colors.raw")
        .then(response => checkStatus(response) && response.arrayBuffer())
        .then(buffer => {

            const inflated = pako.inflate(new Uint8Array(buffer));

            const [ width, height, domains, colorOffset, indexOffset ] = new Uint32Array(inflated.buffer, 0, 5);

            //console.log({width, height, domains, colorOffset, indexOffset, len: inflated.length})

            const colors = new Uint32Array(inflated.buffer, colorOffset, (indexOffset - colorOffset)/4);
            const indexed = new Uint16Array(inflated.buffer, indexOffset, width * height)

            const canvas = document.getElementById("screen")

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");

            const imageData = ctx.createImageData(width, height)

            const { data } = imageData;

            let srcOff = 0, dstOff = 0;
            for (let y = 0; y < height; y++)
            {
                for (let x = 0; x < width; x++)
                {
                    const index = indexed[srcOff];
                    const col = colors[index];

                    const r = (col >> 16) & 0xff;
                    const g = (col >> 8) & 0xff;
                    const b = col & 0xff;

                    data[dstOff] = r;
                    data[dstOff + 1] = g;
                    data[dstOff + 2] = b;
                    data[dstOff + 3] = 255;

                    srcOff += 1;
                    dstOff += 4;
                }
            }

            //console.log(printHex(new Uint8Array(data.buffer, 0, 1024)))

            ctx.putImageData(imageData, 0, 0);



            //console.log({colors, indexed})

        })
        .catch(err => console.error(err)); // Never forget the final catch!

};
