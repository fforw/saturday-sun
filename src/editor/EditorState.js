import { action, makeObservable, observable, toJS } from "mobx";
import { v4 as uuidV4 } from "uuid";
import { findNamed } from "./EditorUI";

/**

 "duration": 245.208,
 "probes" : [],
 "profiles" : {

    }

 */

let counter = 0;

export default class EditorState
{
    @observable
    duration = 60;

    @observable
    probes = [];

    @observable
    profiles = {
        
    }

    constructor(raw)
    {
        makeObservable(this);

        for (let name in this)
        {
            if (this.hasOwnProperty(name))
            {
                const value = raw[name];
                if (value)
                {
                    this[name] = raw[name];
                }
            }
        }
    }

    @action
    addProbe()
    {
        this.probes.push({
            name: "Unnamed #" + counter++,
            x: 0,
            y: 0,
            color: { r: 0, g: 0, b: 0 }
        })
    }

    @action
    renameProbe(index, newName)
    {
        this.probes[index].name = newName;
    }

    @action
    updateProbeColor(name, newColor, x, y)
    {
        console.log("updateProbeColor", name, newColor)
        if (newColor)
        {
            const probe = findNamed(this.probes, name);
            if (!probe)
            {
                throw new Error("Could not find probe with name '" + name + "'")
            }
            probe.color = newColor;
            if (x !== undefined)
            {
                probe.x = x;
            }
            if (y !== undefined)
            {
                probe.y = y;
            }
        }
    }

    toJSON()
    {
        return {
            duration: this.duration,
            probes: toJS(this.probes),
            profiles: toJS(this.profiles)
        }
    }
}
