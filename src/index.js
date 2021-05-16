import * as PIXI from "pixi.js"

import domready from "domready"
// noinspection ES6UnusedImports
import STYLE from "./style.css"
import Fader from "./Fader";
import pako from "pako";
import { toRGB } from "./rgb";
import printHex from "./printHex";

import fadeShader from "./fade-shader.frag"


const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;
const DEG2RAD_FACTOR = TAU / 360;

const config = {
    width: 1900,
    height: 950
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


function checkStatus(response)
{
    if (!response.ok)
    {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }
    return response;
}


let start, song;

window.onload = () => {

    song = document.getElementById("song");

    const {width, height} = config;

    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST

    app = new PIXI.Application({
        width,
        height
    });
    app.stop();

    document.body.appendChild(app.view);


    // load the texture we need
    PIXI.Loader.shared
        .add("saturdayMorning", "media/saturday-morning.index.png")
        .add("saturdayMorningColor", "media/saturday-morning.color.png")
        .load((loader, resources) => {


            console.log(resources.saturdayMorningColor.texture.width);
        //console.log({width, height, domains, colorOffset, indexOffset, len: inflated.length})

        saturdayMorning = new PIXI.Sprite(resources.saturdayMorning.texture);

        saturdayMorning.filters = [
            new PIXI.Filter(
                null,
                fadeShader,//.replace(/0000/g, colors.length).replace(/COLORS/, colors.map(c => c).join(",")),
                {
                    width,
                    height,
                    uColors: resources.saturdayMorningColor.texture,
                    uColorsCount: Math.floor(resources.saturdayMorningColor.texture.width)
                }
            )
        ]

        app.stage.addChild(saturdayMorning);

        onResize();
        app.start();


        //app.stage.addChild(saturdayMorning);

        // Listen for frame updates
        app.ticker.add(() => {
            const now = performance.now();
        });

        window.addEventListener("resize", onResize, true);

        start = performance.now();
    });

};
