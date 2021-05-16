
const Jimp = require("jimp");
const pako = require("pako");
const path = require("path");
const fs = require("fs");
const printHex = require("../src/printHex");
const {toRGB2} = require("../src/rgb");
const {toLinear} = require("../src/rgb");

const MAX = 65536;
const MAX_SIZE = MAX * 3;
const LIMIT = 10000;

const s_color = 3;


function findColor(colors, colorsEnd, r, g, b, limit)
{
    for (let i = 0; i < colorsEnd; i += s_color)
    {
        const r0 = colors[i    ];
        const g0 = colors[i + 1];
        const b0 = colors[i + 2];

        const dr = r0 - r;
        const dg = g0 - g;
        const db = b0 - b;

        const dist =  (dr * dr + dg * dg + db * db);

        if (toRGB2(dist) < limit)
        {
            return i;
        }
    }
    return -1;
}

Jimp.read(path.join(__dirname, "../media/saturday-morning.jpg")).then( image => {

    const { bitmap } = image;

    const { width, height, data } = bitmap;

    const colors = new Uint32Array(1 + MAX_SIZE)
    const indexed = new Uint16Array(width * height)

    // leave space for header
    let colorsEnd = 3;
    let off = 0;
    for (let i = 0; i < data.length; i+=4)
    {
        const r = toLinear(data[i])
        const g = toLinear(data[i + 1])
        const b = toLinear(data[i + 2])

        let index = findColor(colors, colorsEnd, r, g, b, LIMIT);

        if (index < 0)
        {
            if (colorsEnd >= MAX_SIZE)
            {
                throw new Error("Color overflow");
            }

            index = colorsEnd;
            colors[colorsEnd++] = Math.round(r);
            colors[colorsEnd++] = Math.round(g);
            colors[colorsEnd++] = Math.round(b);
        }

        indexed[off++] = (index - 3) / 3;
    }

    const colorsUsed = colors.slice(0, colorsEnd);
    colorsUsed[0] = width;
    colorsUsed[1] = height;
    colorsUsed[2] = colorsUsed.length;

    const indexStart = colorsEnd * 4;
    const buffer = new ArrayBuffer(indexStart + indexed.length * 2);

    const uint8 = new Uint8Array(buffer);
    uint8.set(new Uint8Array(colorsUsed.buffer), 0);
    uint8.set(new Uint8Array(indexed.buffer), indexStart);

    //console.log("INDEXED", printHex(new Uint8Array(indexed.buffer,0,1024)));

    fs.writeFileSync(
        path.join(__dirname, "../media/colors.raw"),
        pako.deflate(buffer),
        "utf8"
    )


})
                                                                                                                                                            
