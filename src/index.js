import * as PIXI from "pixi.js"
// noinspection ES6UnusedImports
import STYLE from "./style.css"
import { createFaderSprite } from "./createFaderSprite";
import { createAudioPlayer } from "./createAudioPlayer";


const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;
const DEG2RAD_FACTOR = TAU / 360;

const config = {
    width: 1900,
    height: 950
};

let app, saturdayMorning, leftPadding = 0;


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

    leftPadding = Math.round((origWidth - width) / 2);

    app.view.style.paddingLeft = leftPadding + "px";

    saturdayMorning.scale.x = width / 1900
    saturdayMorning.scale.y = height / 950

    app.renderer.resize(width, height);
}

let song, startTime, prevTime, colorTexture, fadeFilter;

window.onload = () => {

    song = createAudioPlayer(true);

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
        .add("saturdayMorningRes", "media/saturday-morning.index.png")
        .add("saturdayMorningColorRes", "media/saturday-morning.color.png")
        .load((loader, resources) => {


            const { saturdayMorningRes, saturdayMorningColorRes } = resources;

            ({sprite: saturdayMorning, filter: fadeFilter, colorTexture} = createFaderSprite( saturdayMorningRes, saturdayMorningColorRes , width, height));

            app.stage.addChild(saturdayMorning);
            onResize();

            //app.stage.addChild(saturdayMorning);

            // Listen for frame updates
            app.ticker.add(() => {
                const now = performance.now();

                const delta = now - prevTime;

                // blob.position.x += delta * 0.05;
                // blob.position.y += delta * 0.05;

                fadeFilter.uniforms.time = now - startTime;

                prevTime = now;
            });

            window.addEventListener("resize", onResize, true);

            startTime = prevTime = performance.now();
            app.start();
        });

};
