
function wallBricks(gl, side) {
    let bricks = [[0, 0, 1, 1]];

    while (bricks.length < 20) {
        let brick = getRandomElement(bricks);
        let fraction = Math.random() * 0.1 + 0.45;

        let dir = (brick[2] / brick[3] > 1) ? 0 : 1;

        let side = brick[2 + dir];
        brick[2 + dir] = side * fraction;

        let newBrick = [...brick];
        newBrick[dir] = brick[dir] + brick[2 + dir];
        newBrick[2 + dir] = side * (1 - fraction);

        bricks.push(newBrick);
    }

    const cornerR = 0.2;
    const brickScale = 0.45 - cornerR * 0.25;
    bricks = bricks.map(x => [x[0] + x[2] * 0.5, x[1] + x[3] * 0.5, x[2] * brickScale, x[3] * brickScale]);

    let raster = new Float32Array(3 * side * side);
    for (let y = 0; y < side; y++) {
        for (let x = 0; x < side; x++) {

            let ux = x / side;
            let uy = y / side;

            let dist = bricks.reduce((acc, cur, idx) => {
                let dv = [Math.abs(ux - cur[0]) - cur[2], Math.abs(uy - cur[1]) - cur[3]];
                let d = Math.min(Math.max(dv[0], dv[1]), 0);
                d += v2Length([Math.max(0, dv[0]), Math.max(0, dv[1])]);

                d = d - Math.min(cur[2], cur[3]) * cornerR;

                if (d < acc[0]) {
                    return [d, idx];
                }
                return acc;
            }, [side * side, 0]);

            let col = (dist[1] % 4 == 0) ? [0.738, 0.738, 0.738] : [0.519, 0.519, 0.519];

            col = (dist[0] <= 0) ? col : [0.15, 0.07, 0];

            raster[3 * (y * side + x)] = col[0];
            raster[3 * (y * side + x) + 1] = col[1];
            raster[3 * (y * side + x) + 2] = col[2];
        }
    }

    return createTexture2d(gl, side, side, gl.RGB32F, gl.RGB, gl.FLOAT, raster);
}


function texturesArray(gl, side) {
    return wallBricks(gl, side);

} 
