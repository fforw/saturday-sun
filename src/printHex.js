function printHex(array)
{
    let s = "";
    let hexCodes = "";
    let readable = "";

    const flush = () => {

        s += hexCodes + "   " + readable + "\n";
        hexCodes = "";
        readable = "";

    }

    for (let i = 0; i < array.length; i++)
    {
        const byte = array[i];

        const hex = byte.toString(16);

        hexCodes += (hex.length < 2 ? "0" + hex : hex) + " "
        readable += (byte >= 32 && byte < 127) ? byte : "."

        if ((i & 15) === 15)
        {
            flush();
        }
    }

    if (hexCodes.length)
    {
        flush();
    }

    return s;
}

module.exports = printHex;
