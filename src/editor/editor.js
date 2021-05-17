import * as PIXI from "pixi.js"
import React, { useMemo } from "react"
import ReactDOM from "react-dom"
// noinspection ES6UnusedImports
import STYLE from "./editor.css"
import { createFaderSprite } from "../createFaderSprite";
import { createAudioPlayer } from "../createAudioPlayer";
import EditorState from "./EditorState";
import EditorUI from "./EditorUI";
import AppContext, { AppContextState } from "./AppContext";
import { Resource, ResourceURLS } from "./Resource";
import { octree } from "d3-octree";
import { toLinear } from "../rgb";


const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;
const DEG2RAD_FACTOR = TAU / 360;

const config = {
    width: 1900,
    height: 950
};

let app, saturdayMorning, leftPadding = 0;

function transformResource(resource, imageDataConverter)
{
    const canvas = document.createElement("canvas");
    const { data } = resource;
    canvas.width = data.width
    canvas.height = data.height

    const ctx = canvas.getContext("2d");
    ctx.drawImage(data, 0, 0);
    const imageData = ctx.getImageData(0, 0, data.width, data.height);

    return imageDataConverter(imageData);
}


function onResize()
{
    const { parentNode } = app.view;

    let origWidth, height;

    if (parentNode)
    {
        const rect = parentNode.getBoundingClientRect();

        console.log(parentNode, rect);

        origWidth = rect.width | 0;
        height = (window.innerHeight - 100) | 0;
    }
    else
    {
        origWidth = 1900;
        height = (window.innerHeight - 100) | 0;
    }
    let width = origWidth;

    if (width / height < 2)
    {
        height = width / 2;
    }
    else
    {
        width = height * 2;
    }

    config.width = width;
    config.height = height;

    leftPadding = 0;
    //leftPadding = Math.round((origWidth - width) / 2);

    //app.view.style.paddingLeft = leftPadding + "px";

    saturdayMorning.scale.x = width / 1900
    saturdayMorning.scale.y = height / 950

    console.log("leftPadding", (origWidth - width) * 0.5 * saturdayMorning.scale.x)
    app.renderer.resize(width, height);
}

function getR(entry)
{
    return entry.r;
}


function getG(entry)
{
    return entry.g;
}


function getB(entry)
{
    return entry.b;
}


let song, startTime, prevTime, colorTexture, fadeFilter;

const defaultState = require("../../media/config.json")

let appContext;

window.onload = () => {

    song = createAudioPlayer(true);

    const controls = document.getElementById("controls");

    const editorUI = document.createElement("div");
    editorUI.id = "editor-ui"

    controls.parentNode.insertBefore(editorUI, controls);

    const {width, height} = config;

    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST

    app = new PIXI.Application({
        width,
        height
    });
    app.stop();

    app.view.id = "pixi"


    Object.keys(Resource).forEach(
        name => PIXI.Loader.shared.add(name, ResourceURLS[name])
    );


    // load the texture we need
    PIXI.Loader.shared.load((loader, resources) => {

        ({sprite: saturdayMorning, filter: fadeFilter, colorTexture} = createFaderSprite( resources[Resource.INDEX], resources[Resource.COLOR] , width, height));

        config.saturdayMorning = saturdayMorning;
        config.leftPadding = leftPadding;

        app.stage.addChild(saturdayMorning);

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


        const indexData = transformResource( resources[Resource.INDEX], ({width, height, data}) => {

                const numPixels = width * height;
                const array = new Uint16Array(numPixels);
                let off = 0;
                for (let i = 0; i < data.length; i += 4)
                {
                    array[off++] = (data[i + 1] << 8) + data[i];
                }
                return array;
            })

        const { colorTree, colorArray } = transformResource( resources[Resource.COLOR], ({width, height, data}) => {

                const colorTree = octree(null, getR, getG, getB)
                const colorArray = [];
                for (let index = 0; index < data.length; index += 4)
                {
                    const r = data[index    ];
                    const g = data[index + 1];
                    const b = data[index + 2];
                    const domain = 255 - data[index + 3];

                    const color = {
                        index,
                        r,g,b,
                        domain
                    }

                    colorTree.add(color)
                    colorArray.push( color)
                }

                //console.log("COLOR OCTREE", colorTree, colorArray)

                return { colorTree, colorArray };
            })


        appContext = new AppContextState(
            app,
            resources,
            config,
            new EditorState(defaultState),
            indexData,
            colorTree,
            colorArray
        )


        ReactDOM.render(
            <EditorUI
                appContext={ appContext }
            />,
            editorUI,
            () => {

                setTimeout(() => {

                    window.addEventListener("resize", onResize, true);
                    onResize();

                    startTime = prevTime = performance.now();
                    app.start();

                }, 10)

            }
        )
    });

};
