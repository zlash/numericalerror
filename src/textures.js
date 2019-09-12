function wallBricks(gl, side) {

    let raster = new Float32Array(3 * side * side);
    for (let y = 0; y < side; y++) {
        for (let x = 0; x < side; x++) {
            let col = (Math.floor(x * 2 / side) + Math.floor(y * 2 / side)) % 2;

            raster[3 * (y * side + x)] = col;
            raster[3 * (y * side + x) + 1] = col;
            raster[3 * (y * side + x) + 2] = col;
        }
    }

    return createTexture2d(gl, side, side, gl.RGB32F, gl.RGB, gl.FLOAT, raster);
}


function texturesArray(gl,side) {
    return wallBricks(gl,side);

} 
