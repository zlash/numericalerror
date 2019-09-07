function v4Empty() {
    return [0, 0, 0, 0];
}

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
    return Math.hypot(v3a[0], v3a[1], v3a[2]);
}

function v3Normalize(v3a, result = v3Empty()) {
    let len = v3Length(v3a);
    if (len == 0) {
        return undefined;
    }
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

function v3Reflect(v3a, normal, result = v3Empty()) {
    v3Scale(normal, v3Dot(v3a, normal) * 2, result);
    return v3Subtract(result, v3a, result);
}

function v3Mix(v3a, v3b, ratio, result = v3Empty()) {
    result[0] = mix(v3a[0], v3b[0], ratio);
    result[1] = mix(v3a[1], v3b[1], ratio);
    result[2] = mix(v3a[2], v3b[2], ratio);
    return result;
}

function v2ToStrVec2(v2) {
    return `vec2(${numberToStringWithDecimals(v2[0])},${numberToStringWithDecimals(v2[1])})`;
}

function v3xzToStrVec2(v3) {
    return `vec2(${numberToStringWithDecimals(v3[0])},${numberToStringWithDecimals(v3[2])})`;
}