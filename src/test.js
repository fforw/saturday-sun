const path = require("path")
const fs = require("fs")
const pako = require("pako")
const printHex = require("./printHex");


const buffer = fs.readFileSync(
    path.join(__dirname, "../media/colors.raw"),
    null
)

const inflated = pako.inflate(Uint8Array.prototype.slice.call(buffer));

const [ width, height, numColorBytes ] = new Uint32Array(inflated.buffer, 0, 3);

console.log({width, height, numColorBytes, len: inflated.length})
console.log(printHex(inflated.slice(numColorBytes * 4, numColorBytes * 4 + 1000)));
