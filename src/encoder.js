
const ALPHABET = "0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopq";


function runLengthEncoding(array)
{
    const len = array.length;
    const compressed = new Uint16Array(len * 2 + 2);

    let off = 0;
    let prev = -1;
    let done;
    for (let i = 0; i < len; i++)
    {
        const value = array[i];

        done = false;
        if (prev === value)
        {
            let count = compressed[off - 2];
            if (count < 65535)
            {
                compressed[off - 2] = count + 1;
                done = true;
            }
        }

        if (!done)
        {
            compressed[off++] = 1;
            compressed[off++] = value;
        }

        prev = value;
    }

    const compression = off < len;
    return {
        compression,
        data: compression ? compressed.slice(0, off) : array
    };
}

module.exports.runLengthEncoding = runLengthEncoding;

module.exports.encode = function(array)
{
    const { compression , data } = runLengthEncoding(array);

    const len = data.length;
    let s = array.length + (compression ? ";" : ":");
    for (let i = 0; i < len; i++)
    {
        const arrayElement = data[i];

        const n0 = arrayElement & 63;
        const n1 = (arrayElement >> 6) & 63;

        s += ALPHABET[n0] + ALPHABET[n1];
    }
    return s;
}

module.exports.decode = function(string)
{
    const m = /^([0-9]+)([;:])(.*)/.exec(string);
    if (!m)
    {
        throw new Error("Wrong format");
    }

    const len = +m[1];
    const compression = m[2] === ";";
    const b64 = m[3];

    const out = new Uint16Array(len);

    const dc = c => {
        const idx = ALPHABET.indexOf(c);

        if (idx < 0)
        {
            throw new Error("Invalid code: " + c);
        }
        return idx;
    };

    let off = 0;

    if (compression)
    {
        for (let i = 0; i < b64.length; i += 4)
        {
            const count = (dc(b64[i + 1]) << 6) + dc(b64[i    ]);
            const word =  (dc(b64[i + 3]) << 6) + dc(b64[i + 2]);
            for (let j=0; j < count; j++)
            {
                out[off++] = word;
            }
        }
    }
    else
    {
        for (let i = 0; i < b64.length; i+=2)
        {
            out[off++] = (dc(b64[i + 1]) << 6) + dc(b64[i]);
        }
    }
    return out;
}
