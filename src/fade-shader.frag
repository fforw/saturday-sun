precision mediump float;

varying vec2 vTextureCoord;
varying vec4 vColor;

uniform sampler2D uSampler;
uniform sampler2D uColors;
uniform float time;
uniform float width;
uniform float height;
uniform float uColorsCount;

void main(void)
{
    vec4 fg = texture2D(uSampler, vTextureCoord);

    float index = floor(fg.r * 255.0) + floor(fg.g * 255.0 * 256.0);

    vec4 col = texture2D(uColors, vec2((index + 0.25) * (1.0/uColorsCount) , 1));
    float domain = floor(col.a * 255.0);

//    if (domain != 255.0)
//    {
//        fg = texture2D(uSampler, vTextureCoord + vec2(sin(vTextureCoord.y + time * 0.002) * 0.003, 0));
//        index = floor(fg.r * 255.0) + floor(fg.g * 255.0 * 256.0);
//        col = texture2D(uColors, vec2((index + 0.25) * (1.0/uColorsCount) , 1));
//    }

    col.a = 1.0;

    gl_FragColor = col;

}
