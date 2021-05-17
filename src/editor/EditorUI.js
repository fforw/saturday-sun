import * as PIXI from "pixi.js"
import React, { useContext, useEffect, useMemo, useRef, useState } from "react"
import cx from "classnames"
import { observer } from "mobx-react-lite"
import PIXIWrapper from "./PIXIWrapper";
import ColorInput from "./ColorInput";

import { octree } from "d3-octree";
import { toLinear } from "../rgb";
import printHex from "../printHex";
import AppContext from "./AppContext";
import { Resource } from "./Resource";
import { toJS } from "mobx";


export function findNamed(array, name)
{
    if (name)
    {
        for (let i = 0; i < array.length; i++)
        {
            const elem = array[i];
            if (elem.name === name)
            {
                return elem
            }
        }
    }
    return null;
}



const Probe = observer(({ index, isActiveProbe, setActiveProbe, probe}) => {
    const appContext = useContext(AppContext);

    const sprite = useRef(null);
    const [blink, setBlink] = useState(() => [0,1]);

    const { app, resources, config, state } = appContext;

    useEffect(
        () => {


            const { texture } = resources[Resource.PROBE];

            const tex2 = new PIXI.Texture(
                texture.baseTexture,
                new PIXI.Rectangle(isActiveProbe * 18,0,9,9),
                texture.baseTexture._frame,
                undefined,
                undefined,
                new PIXI.Point(0.5,0.5)
            )

            sprite.current = new PIXI.Sprite( tex2);

            const sx = config.saturdayMorning.scale.x
            const sy = config.saturdayMorning.scale.y

            sprite.current.x = probe.x * sx
            sprite.current.y = probe.y * sy

            app.stage.addChild(sprite.current)

            return () => {
                app.stage.removeChild(sprite.current)
            }

        },
        [ index, probe ]
    )
    useEffect(
        () => {

            if (sprite.current)
            {
                const sx = config.saturdayMorning.scale.x
                const sy = config.saturdayMorning.scale.y

                sprite.current.texture._frame.x = isActiveProbe * 18;
                sprite.current.x = probe.x * sx
                sprite.current.y = probe.y * sy
            }

        },
        [ probe.x, probe.y, isActiveProbe ]
    )

    return (
        <div
            className="list-group-item"
        >
            <div className="d-flex">
                <div className="button-toolbar">
                    <button
                        type="button"
                        className={
                            cx(
                                "btn btn-secondary mr-1",
                                isActiveProbe && "active"
                            )
                        }
                        aria-pressed={ isActiveProbe }
                        onClick={() => setActiveProbe(isActiveProbe ? null : probe.name)}
                    >
                        {
                            isActiveProbe ? "Accept" : "Pick"
                        }
                    </button>
                </div>
                <div className="form-inline">
                    <div className="form-group">
                        <label htmlFor="probe-name-input" className="sr-only">Name</label>
                        <input
                            id="probe-name-input"
                            className="form-control"
                            type="text"
                            value={ probe.name.replace("_", " ")}
                            onChange={
                                ev => state.renameProbe(index, ev.target.value.replace(" ", "_"))
                            }
                        />

                    </div>
                    <div className="form-group">
                        <ColorInput
                            value={probe.color}
                            onChange={col => state.updateProbeColor(probe.name, col)}
                            disabled={true}
                        />
                    </div>
                </div>
            </div>

        </div>
    );
});


const EditorUI = observer(({appContext}) => {

    const { app, state, indexData, colorArray, resources, config } = appContext;

    const [tab, setTab] = useState(0);
    const [ activeProbe, setActiveProbe ] = useState(null);
    const mouseDown = useRef(false);

    const pixiApp = useRef(null)


    useEffect(
        () => {

            pixiApp.current = document.getElementById("pixi");

            const updateColor = ev => {
                const {pageX, pageY} = ev;

                const rect = pixiApp.current.getBoundingClientRect();

                const x = ((pageX - rect.x) / config.saturdayMorning.scale.x) | 0;
                const y = ((pageY - rect.y) / config.saturdayMorning.scale.y) | 0;

                const { width, height } = resources[Resource.INDEX].data;

                //console.log("updateColor", x, y, width, height)

                if (x >= 0 && x < width && y >= 0 && y < height)
                {
                    const colorIndex = indexData[width * y + x];
                    const color = colorArray[colorIndex];

                    state.updateProbeColor(activeProbe, color, x, y)
                }
            }


            const onMouseDown = ev => {

                if (activeProbe && ev.target.id === "pixi")
                {
                    mouseDown.current = true;
                    updateColor(ev);
                }
            };

            const onMouseUp = ev => {

                mouseDown.current = false;
            };

            const onMouseMove = ev => {

                if (mouseDown.current)
                {
                    if (activeProbe)
                    {
                        updateColor(ev);
                    }
                }
            }

            window.addEventListener("mousedown", onMouseDown, true);
            window.addEventListener("mouseup", onMouseUp, true);
            window.addEventListener("mousemove", onMouseMove, true);

            return () => {
                window.removeEventListener("mousedown", onMouseDown, true);
                window.removeEventListener("mouseup", onMouseUp, true);
                window.removeEventListener("mousemove", onMouseMove, true);
            }
        },
        [ activeProbe ]
    )

    //const activeProbeInstance = findNamed(state.probes, activeProbe);

    //console.log("EditorUI", saturdayMorningRes);

    return (
        <AppContext.Provider value={ appContext }>
            <div className="container-fluid">
                <div className="row">
                    <div className="col-3">
                        <div className="button-toolbar">
                            <button
                                type="button"
                                className={
                                    cx(
                                        "btn btn-primary mr-1",
                                        tab === 0 && "active"
                                    )
                                }
                                aria-pressed={ tab === 0 }
                                onClick={ () => setTab(0)}
                            >
                                Editor
                            </button>
                            <button
                                type="button"
                                className={
                                    cx(
                                        "btn btn-secondary mr-1",
                                        tab === 1 && "active"
                                    )
                                }
                                aria-pressed={ tab === 1}
                                onClick={ () => setTab(1)}
                            >
                                Probes
                            </button>
                        </div>
                        {
                            tab === 0 && (
                                "TIMELINE"
                            )
                        }
                        {
                            tab === 1 && (
                                <>
                                    <form
                                        className="form"
                                        onSubmit={ ev => ev.preventDefault() }>

                                        <div
                                            className="list-group"
                                            style={{
                                                maxHeight: 500,
                                                overflow: "auto"
                                            }}
                                        >

                                            {
                                                state.probes.map((probe,idx) => {
                                                    const isActiveProbe = activeProbe === probe.name;
                                                    return (
                                                        <Probe
                                                            key={ idx }
                                                            app={ app }
                                                            state={ state }
                                                            probe={ probe }
                                                            index={ idx }
                                                            isActiveProbe={ isActiveProbe }
                                                            setActiveProbe={ setActiveProbe }
                                                        />
                                                    )
                                                })
                                            }
                                        </div>
                                    </form>
                                    <div className="button-toolbar">
                                        <button
                                            type="button"
                                            className={
                                                cx(
                                                    "btn btn-secondary mr-1"
                                                )
                                            }
                                            onClick={ () => state.addProbe() }
                                        >
                                            Add Probe
                                        </button>
                                        <button
                                            type="button"
                                            className={
                                                cx(
                                                    "btn btn-dark mr-1"
                                                )
                                            }
                                            onClick={ () => console.log(state.toJSON()) }
                                        >
                                            Dump JSON
                                        </button>
                                    </div>

                                </>
                            )
                        }
                    </div>
                    <div className="col-9">
                        <div className="row">
                            <PIXIWrapper
                                className="col"
                                element={ app.view }
                            />
                        </div>
                        <div className="row">
                            <div
                                className="col"
                                style={{ height: 100 }}
                            >
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AppContext.Provider>
    );
});

export default EditorUI;
