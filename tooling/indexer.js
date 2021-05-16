const Jimp = require("jimp");
const pako = require("pako");
const path = require("path");
const fs = require("fs");
const printHex = require("../src/printHex");
const {toRGB2} = require("../src/rgb");
const {toLinear} = require("../src/rgb");

const MAX = 65536;
const LIMIT = 6;

const {octree} = require("d3-octree")


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

    tree.visit(function (node, r1, g1, b1, r2, g2, b2) {

        // is it a leaf node?
        if (!node.length)
        {
            const {data} = node;
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
    for (let i = 0; i < DOMAINS; i++)
    {
        trees[i] = octree(null, getR, getG, getB)
        indexes[i] = 0
    }

    tree.visit(function (node, r1, g1, b1, r2, g2, b2) {

        // is it a leaf node?
        if (!node.length)
        {
            const {exact} = node.data;
            exact.sort((a, b) => b.count - a.count)

            for (let i = 0; i < DOMAINS; i++)
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




function addColors(tree, dataOut)
{
    tree.visit(function (node, r1, g1, b1, r2, g2, b2) {

        // is it a leaf node?
        if (!node.length)
        {
            const {data} = node;

            const domain = (data.col >> 24) & 0xff;
            const r = (data.col >> 16) & 0xff;
            const g = (data.col >> 8) & 0xff;
            const b = data.col & 0xff;

            const offset = data.index * 4;
            dataOut[offset    ] = r;
            dataOut[offset + 1] = g;
            dataOut[offset + 2] = b;
            dataOut[offset + 3] = 255 - domain;

            return true;
        }
        return false;
    });

}


Jimp.read(path.join(__dirname, "../src/saturday-morning.jpg")).then(image => {

    Jimp.read(path.join(__dirname, "../src/saturday-morning-mask.png")).then(mask => {

        const {bitmap} = image;

        const {width, height, data} = bitmap;
        const {width: maskWidth, height: maskHeight, data: maskData} = mask.bitmap;

        if (maskWidth !== width || maskHeight !== height)
        {
            throw new Error("Image and mask dimensions don't match: image = " + width + " x " + height + ", mask =" + maskWidth + " x " + maskHeight)
        }
        const tree = octree(null, getR, getG, getB)

        // leave space for header
        let colorsEnd = 3;
        for (let i = 0; i < data.length; i += 4)
        {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]

            const domain = Math.round(maskData[i + 1] * (DOMAINS - 1) / 255);
            const col = (domain << 24) | (r << 16) | (g << 8) | b;

            const entry = tree.find(r, g, b, LIMIT)
            if (entry)
            {
                const {exact} = entry;

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
                tree.add({col, exact: [{col, count: 1}]})
            }
        }

        const domainTrees = splitDomains(tree);

        const totalColors = domainTrees.reduce((a,b) => a + b.size(), 0)

        return Jimp.create(width, height, 255)
            .then(
                newImage => {

                    const {width: w, height: h, data: dataOut} = newImage.bitmap;

                    let off = 0;
                    for (let i = 0; i < data.length; i += 4)
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
                        const ri = entry.index & 0xff;
                        const gi = (entry.index >> 8) & 0xff;


                        dataOut[off] = ri;
                        dataOut[off + 1] = gi;
                        dataOut[off + 2] = 0;
                        dataOut[off + 3] = 255;
                        off += 4;
                    }
                    //console.log("DATA", printHex(new Uint8Array(buffer,0, 1024)))

                    //console.log(printHex(dataOut.slice(0, 1024)))

                    newImage.write(
                        path.join(__dirname, "../media/saturday-morning.index.png"),
                    )


                    return Jimp.create(totalColors, 1, 255)
                        .then(
                            newImage2 => {

                                const {data: dataOut} = newImage2.bitmap;

                                for (let i = 0; i < domainTrees.length; i++)
                                {
                                    const tree = domainTrees[i];
                                    addColors(tree, dataOut);
                                }
                                newImage2.write(
                                    path.join(__dirname, "../media/saturday-morning.color.png"),
                                )

                            }
                        )
                }
            )

    })
})
