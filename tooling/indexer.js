
const Jimp = require("jimp");
const pako = require("pako");
const path = require("path");
const fs = require("fs");
const printHex = require("../src/printHex");
const {toRGB2} = require("../src/rgb");
const {toLinear} = require("../src/rgb");

const MAX = 65536;
const LIMIT = 6;

const { octree } = require("d3-octree")


function getR(entry)
{
    return (entry.col >> 16) & 0xff;
}
function getG(entry)
{
    return (entry.col >> 8) & 0xff;
}
function getB(entry)
{
    return entry.col & 0xff;
}

const DOMAINS = 2;


function adjustIndexes(tree, baseIndex)
{
    if (baseIndex === 0)
    {
        // done
        return;
    }


    tree.visit(function(node, r1, g1, b1, r2, g2, b2) {

        // is it a leaf node?
        if (!node.length)
        {
            const { data } = node;
            data.index += baseIndex;
            return true;
        }
        return false;
    });

}


function splitDomains(tree)
{
    const trees = [];
    const indexes = [];
    for (let i=0; i < DOMAINS; i++)
    {
        trees[i] = octree(null, getR,getG,getB)
        indexes[i] = 0
    }

    tree.visit(function(node, r1, g1, b1, r2, g2, b2) {

        // is it a leaf node?
        if (!node.length)
        {
            const { exact } = node.data;
            exact.sort((a,b) => b.count - a.count)

            for (let i=0; i < DOMAINS; i++)
            {
                for (let j = 0; j < exact.length; j++)
                {
                    const entry = exact[j];
                    const domain = entry.col >>> 24;
                    if (domain === i)
                    {
                        entry.index = indexes[domain]++;
                        trees[i].add(entry)
                        break;
                    }
                }
            }
            return true;
        }
        return false;
    });

    let index = 0;
    for (let i = 0; i < DOMAINS; i++)
    {
        const count = trees[i].size()

        adjustIndexes(trees[i], index)

        index += count;
    }
    return trees;
}


function copyColors(tree, colors)
{
    tree.visit(function(node, r1, g1, b1, r2, g2, b2) {

        // is it a leaf node?
        if (!node.length)
        {
            const { data } = node;
            colors[data.index] = data.col;
            return true;
        }
        return false;
    });


}


Jimp.read(path.join(__dirname, "../media/saturday-morning.jpg")).then( image => {

    Jimp.read(path.join(__dirname, "../media/saturday-morning-mask.png")).then( mask => {

        const { bitmap } = image;

        const { width, height, data } = bitmap;
        const { width : maskWidth, height: maskHeight, data: maskData } = mask.bitmap;

        if (maskWidth !== width || maskHeight !== height)
        {
            throw new Error("Image and mask dimensions don't match: image = "+ width + " x " + height+ ", mask ="+ maskWidth + " x " + maskHeight)
        }
        const tree = octree(null, getR,getG,getB)

        // leave space for header
        let colorsEnd = 3;
        for (let i = 0; i < data.length; i+=4)
        {
            const r = data[i    ]
            const g = data[i + 1]
            const b = data[i + 2]

            const domain = Math.round(maskData[i+1] * (DOMAINS - 1)/255);
            const col = (domain << 24) | (r << 16) | (g << 8) | b;

            const entry = tree.find(r,g,b, LIMIT)
            if (entry)
            {
                const { exact } = entry;

                let found = false;
                for (let j = 0; j < exact.length; j++)
                {
                    if (exact[j].col === col)
                    {
                        exact[j].count++;
                        found = true;
                        break;
                    }
                }
                if (!found)
                {
                    exact.push({col, count: 1})
                }
            }
            else
            {
                tree.add({ col, exact: [{col, count: 1}]})
            }
        }

        const domainTrees = splitDomains(tree);

        /// HEADER
        /// width, height, domains, colorOffset, indexOffset, n0 ... nX


        const headerByteSize = (5 + DOMAINS) * 4;

        let colorByteSize = 0;
        for (let i = 0; i < DOMAINS; i++)
        {
            colorByteSize += domainTrees[i].size() * 4;
        }

        const buffer = new ArrayBuffer(headerByteSize + colorByteSize + width * height * 2)

        console.log("headerByteSize:", headerByteSize)
        console.log("colorByteSize:", colorByteSize, "(Number of colors: ", colorByteSize / 4 ,")")
        console.log("Buffer length:", buffer.byteLength)

        const header = new Uint32Array(buffer, 0, headerByteSize / 4);

        const indexOffset = headerByteSize + colorByteSize;
        header[0] = width;
        header[1] = height;
        header[2] = DOMAINS;
        header[3] = headerByteSize;
        header[4] = indexOffset;

        let offset = headerByteSize;
        for (let i = 0; i < DOMAINS; i++)
        {
            console.log("Offset for Domain #", i, ": ", offset);
            header[5 + i] = offset;

            offset += domainTrees[i].size() * 4;
        }

        const colors = new Uint32Array(buffer, headerByteSize, colorByteSize / 4);

        for (let i = 0; i < domainTrees.length; i++)
        {
            const tree = domainTrees[i];
            copyColors(tree, colors);
        }

        const indexed = new Uint16Array(buffer, indexOffset , width * height);
        let off = 0;
        for (let i = 0; i < data.length; i+=4)
        {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]

            const domain = Math.round(maskData[i + 1] * (DOMAINS - 1) / 255);

            const entry = domainTrees[domain].find(r, g, b, LIMIT * 2);

            if (!entry)
            {
                throw new Error("Could not find color for " + r + ", " + g + ", " + b);
            }
            indexed[off++] = entry.index;
        }

        //console.log("DATA", printHex(new Uint8Array(buffer,0, 1024)))

        fs.writeFileSync(
            path.join(__dirname, "../media/colors.raw"),
            pako.deflate(new Uint8Array(buffer)),
            null
        )


    })
})
