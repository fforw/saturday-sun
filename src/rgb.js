const TO_LINEAR_POWER = 2.4;
const TO_RGB_POWER = 1 / TO_LINEAR_POWER;
const TO_RGB2_POWER = 1 / (TO_LINEAR_POWER * 0.5);


function toLinear(value)
{
    return Math.pow(value, TO_LINEAR_POWER);
}


function toRGB(value)
{
    return Math.pow(value, TO_RGB_POWER);
}

function toRGB2(value)
{
    return Math.pow(value, TO_RGB2_POWER);
}

module.exports.toLinear = toLinear;
module.exports.toRGB = toRGB;
module.exports.toRGB2 = toRGB2;
