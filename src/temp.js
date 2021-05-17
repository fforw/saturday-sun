const config = require("../media/config.json");
const {toLinear} = require("./rgb");
const {toRGB} = require("./rgb");

const profiles = {
    ... config.profiles
}

function createProfile(name, brightness)
{
    const { probes } = config;

    const colors = {};

    for (let i = 0; i < probes.length; i++)
    {
        const profile = probes[i];

        const {r,g,b,domain} = profile.color;

        const linR = toLinear(r);
        const linG = toLinear(g);
        const linB = toLinear(b);

        colors[profile.name] = {
            r: Math.round(toRGB(linR * brightness[domain])),
            g: Math.round(toRGB(linG * brightness[domain])),
            b: Math.round(toRGB(linB * brightness[domain]))
        }
    }

    profiles[name] = colors;
}

createProfile("Darkest", [0.08, 0.01])
createProfile("Medium", [0.5, 0.4])

console.log(
    profiles
)
