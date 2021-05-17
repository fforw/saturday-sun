import React from "react";

const secret = Symbol("AppContextState secret")

export class AppContextState
{
    get app()
    {
        return this[secret].app;
    }

    get resources()
    {
        return this[secret].resources;
    }

    get config()
    {
        return this[secret].config;
    }

    get state()
    {
        return this[secret].state;
    }

    get indexData()
    {
        return this[secret].indexData;
    }

    get colorTree()
    {
        return this[secret].colorTree;
    }

    get colorArray()
    {
        return this[secret].colorArray;
    }

    constructor(app = null, resources = null, config = null, state = null, indexData = null, colorTree = null, colorArray = null)
    {
        this[secret] = {
            app,
            resources,
            config,
            state,
            indexData,
            colorTree,
            colorArray
        }
    }
}


const AppContext = React.createContext(new AppContextState());

export default AppContext;


