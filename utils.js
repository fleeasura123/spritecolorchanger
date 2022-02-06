// https://stackoverflow.com/a/66476236/17404143
const rgbToHex = (rgb) => {
    return `#${((1 << 24) + (parseInt(rgb.r) << 16) + (parseInt(rgb.g) << 8) + parseInt(rgb.b)).toString(16).slice(1)}`;
};

// https://stackoverflow.com/a/21648508/17404143
const hexToRgba = (hex) => {
    var c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return {
            r: (c >> 16) & 255,
            g: (c >> 8) & 255,
            b: c & 255,
            a: 255
        };
    }
    throw new Error('Bad Hex');
}