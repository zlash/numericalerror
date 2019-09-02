
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

function m4v4Multiply(m4a, v4a, result = v4Empty()) {
    for (let x = 0; x < result.length; x++) {
        result[x] = 0.0;
        for (let i = 0; i < 4; i++) {
            result[x] += m4a[i * 4 + x] * v4a[i];
        }
    }
    return result;
}

function m4v3Multiply(m4a, v3a, w, result = v3Empty()) {
    return m4v4Multiply(m4a, [...v3a, w], result);
}


function m4Translation(v3Offset, result = m4Identity()) {
    result[12] = v3Offset[0];
    result[13] = v3Offset[1];
    result[14] = v3Offset[2];
    return result;
}

function m4Scale(v3Scale, result = m4Identity()) {
    result[0] = v3Scale[0];
    result[5] = v3Scale[1];
    result[10] = v3Scale[2];
    return result;
}

//Borrowed from https://github.com/toji/gl-matrix
function m4Invert(m, result = []) {
    let a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
    let a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
    let a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
    let a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
  
    let b00 = a00 * a11 - a01 * a10;
    let b01 = a00 * a12 - a02 * a10;
    let b02 = a00 * a13 - a03 * a10;
    let b03 = a01 * a12 - a02 * a11;
    let b04 = a01 * a13 - a03 * a11;
    let b05 = a02 * a13 - a03 * a12;
    let b06 = a20 * a31 - a21 * a30;
    let b07 = a20 * a32 - a22 * a30;
    let b08 = a20 * a33 - a23 * a30;
    let b09 = a21 * a32 - a22 * a31;
    let b10 = a21 * a33 - a23 * a31;
    let b11 = a22 * a33 - a23 * a32;
  
    // Calculate the determinant
    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  
    if (!det) {
      return null;
    }
    det = 1.0 / det;
  
    result[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    result[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    result[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    result[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    result[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    result[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    result[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    result[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    result[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    result[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    result[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    result[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    result[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    result[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    result[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    result[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  
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

function m4Perspective(fovY, aspectRatio, zNear, zFar, result = m4Identity()) {

    const tanHalfFovy = Math.tan(fovY / 2);

    result[0] = 1 / (aspectRatio * tanHalfFovy);
    result[5] = 1 / (tanHalfFovy);
    result[10] = - (zFar + zNear) / (zFar - zNear);
    result[11] = - 1.0;
    result[14] = - (2 * zFar * zNear) / (zFar - zNear);
    return result;
}

function m4ToStrMat4(m) {
    return `mat4(${m.map((x) => { return numberToStringWithDecimals(x); }).join(",")})`;
}