import * as PIXI from "pixi.js";
import fadeShader from "./fade-shader.frag";


export function createFaderSprite(indexResource, colorResource, width, height)
{
    const colorCanvas = document.createElement("canvas")
    const {width: w, height: h} = colorResource.texture;
    colorCanvas.width = w;
    colorCanvas.height = h;

    const ctx = colorCanvas.getContext("2d");
    ctx.drawImage(colorResource.texture.baseTexture.resource.source, 0, 0)

    const colorTexture = PIXI.Texture.from(colorCanvas, {
        SCALE_MODE: PIXI.SCALE_MODES.NEAREST,
    });

    const sprite = new PIXI.Sprite(indexResource.texture);

    const filter = new PIXI.Filter(
        null,
        fadeShader,
        {
            width,
            height,
            time: 0,
            uColors: colorTexture,
            uColorsCount: Math.floor(colorResource.texture.width)
        }
    );

    sprite.filters = [ filter ];

    return {
        sprite,
        filter,
        colorTexture
    };
}
