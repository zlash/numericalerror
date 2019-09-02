function qIdentity() {
    return [0, 0, 0, 1];
}

function qDot(q1, q2) {
    return q1[0] * q2[0] + q1[1] * q2[1] + q1[2] * q2[2] + q1[3] * q2[3];
}

function qLength(q) {
    return Math.sqrt(qDot(q, q));
}

function qFromAxisAngle(axis, angle, result = qIdentity()) {
    angle *= 0.5;
    let s = Math.sin(angle);
    v3Scale(axis, s, result);
    result[3] = Math.cos(angle);
    return result;
}

function qNormalize(q, result = qIdentity()) {
    let len = qLength(q);
    if (len == 0) {
        return;
    }
    result[0] = q[0] / len;
    result[1] = q[1] / len;
    result[2] = q[2] / len;
    result[3] = q[3] / len;
    return result;
}

function qMultiply(q1, q2, result = qIdentity()) {
    result[3] = q1[3] * q2[3] - q1[0] * q2[0] - q1[1] * q2[1] - q1[2] * q2[2];
    result[0] = q1[3] * q2[0] + q1[0] * q2[3] + q1[1] * q2[2] - q1[2] * q2[1];
    result[1] = q1[3] * q2[1] + q1[1] * q2[3] + q1[2] * q2[0] - q1[0] * q2[2];
    result[2] = q1[3] * q2[2] + q1[2] * q2[3] + q1[0] * q2[1] - q1[1] * q2[0];
    return result;
}

function qConjugate(q, result = qIdentity()) {
    result[0] = -q[0];
    result[1] = -q[1];
    result[2] = -q[2];
    result[3] = q[3];
    return result;
}


function qApplyToV3(q1, v3, result = v3Empty()) {
    let q = qMultiply(q1, qMultiply([...v3, 0], qConjugate(q1)));
    result[0] = q[0];
    result[1] = q[1];
    result[2] = q[2];
    return result;
}
