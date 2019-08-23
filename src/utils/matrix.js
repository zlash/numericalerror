
function m4Identity() {
    return [1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1];
}

function m4Multiply(m4A, m4B, result = m4Identity()) {
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            let idx = x * 4 + y;
            result[idx] = 0.0;
            for (let i = 0; i < 4; i++) {
                result[idx] += m4A[i * 4 + y] * m4B[x * 4 + i];
            }
        }
    }

    return result;
}


function m4v3Multiply(m4a, v3a, w, result = v3Empty()) {
    let v = [...v3a, w];
    for (let x = 0; x < 3; x++) {
        result[x] = 0.0;
        for (let i = 0; i < 4; i++) {
            result[x] += m4a[i * 4 + x] * v[i];
        }
    }
    return result;
}


function m4AxisAngleRotation(v3Axis, angle, result = m4Identity()) {

    const ct = Math.cos(angle);
    const st = Math.sin(angle);
    const omct = 1.0 - ct;

    result[0] = ct + v3Axis[0] * v3Axis[0] * omct;
    result[1] = v3Axis[0] * v3Axis[1] * omct + v3Axis[2] * st;
    result[2] = v3Axis[0] * v3Axis[2] * omct - v3Axis[1] * st;

    result[4] = v3Axis[0] * v3Axis[1] * omct - v3Axis[2] * st;
    result[5] = ct + v3Axis[1] * v3Axis[1] * omct;
    result[6] = v3Axis[1] * v3Axis[2] * omct + v3Axis[0] * st;

    result[8] = v3Axis[0] * v3Axis[2] * omct + v3Axis[1] * st;
    result[9] = v3Axis[1] * v3Axis[2] * omct - v3Axis[0] * st;
    result[10] = ct + v3Axis[2] * v3Axis[2] * omct;

    return result;
}

function m4LookAt(v3Eye, v3Center, v3Up, result = m4Identity()) {

    let f = v3Normalize(v3Subtract(v3Center, v3Eye));
    let s = v3Normalize(v3Cross(f, v3Up));
    let u = v3Cross(s, f);

    result[0] = s[0];
    result[4] = s[1];
    result[8] = s[2];

    result[1] = u[0];
    result[5] = u[1];
    result[9] = u[2];

    result[2] = -f[0];
    result[6] = -f[1];
    result[10] = -f[2];

    result[12] = -v3Dot(s, v3Eye);
    result[13] = -v3Dot(u, v3Eye);
    result[14] = v3Dot(f, v3Eye);

    return result;
}