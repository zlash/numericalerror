function v3Empty() {
    return [0, 0, 0];
}

function v3Add(v3a, v3b, result = v3Empty()) {
    result[0] = v3a[0] + v3b[0];
    result[1] = v3a[1] + v3b[1];
    result[2] = v3a[2] + v3b[2];
    return result;
}

function v3Subtract(v3a, v3b, result = v3Empty()) {
    result[0] = v3a[0] - v3b[0];
    result[1] = v3a[1] - v3b[1];
    result[2] = v3a[2] - v3b[2];
    return result;
}

function v3Scale(v3a, scale, result = v3Empty()) {
    result[0] = v3a[0] * scale;
    result[1] = v3a[1] * scale;
    result[2] = v3a[2] * scale;
    return result;
}

function v3Dot(v3a, v3b) {
    return v3a[0] * v3b[0] + v3a[1] * v3b[1] + v3a[2] * v3b[2];
}

function v3Length(v3a) {
    return Math.sqrt(v3Dot(v3a, v3a));
}

function v3Normalize(v3a, result = v3Empty()) {
    let len = v3Length(v3a);
    result[0] = v3a[0] / len;
    result[1] = v3a[1] / len;
    result[2] = v3a[2] / len;
    return result;
}

function v3Cross(v3a, v3b, result = v3Empty()) {
    result[0] = v3a[1] * v3b[2] - v3a[2] * v3b[1];
    result[1] = v3a[2] * v3b[0] - v3a[0] * v3b[2];
    result[2] = v3a[0] * v3b[1] - v3a[1] * v3b[0];
    return result;
}

