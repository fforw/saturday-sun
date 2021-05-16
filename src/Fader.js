



export default class Fader
{
    constructor(source)
    {
        const { width, height } = source;


        const canvas = document.createElement("canvas")

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(source, 0 ,0);

        const imageData = ctx.getImageData(0,0,width, height);

        const { data } = imageData;

        console.log("FADER", width, height, data.length / 4);

        // const colors = new Float64Array(COLOR_LIMIT * s_color);
        //
        // let colorsEnd = 0;
        //
        // for (let off = 0; off < data.length; off += 4 )
        // {
        //     const r = toLinear(data[off    ] << 16);
        //     const g = toLinear(data[off + 1]);
        //     const b = toLinear(data[off + 2]);
        //
        //     const index = findColor(colors, colorsEnd, r, g, b, LIMIT);
        //
        //     if (index < 0)
        //     {
        //         colors[colorsEnd++] = r;
        //         colors[colorsEnd++] = g;
        //         colors[colorsEnd++] = b;
        //     }
        // }

        console.log(colors.length, colors);

    }
}
