attribute vec4 aVertexPosition;

uniform mat4 uProjectionMatrix;

varying vec2 vUvs;
varying vec4 vViewVector;

mat4 matInverse(mat4 m)
{
    return mat4(
        m[0][0], m[1][0], m[2][0], 0.0,
        m[0][1], m[1][1], m[2][1], 0.0,
        m[0][2], m[1][2], m[2][2], 0.0,
        -dot(m[0].xyz, m[3].xyz),
        -dot(m[1].xyz, m[3].xyz),
        -dot(m[2].xyz, m[3].xyz),
        1.0);
}

void main()
{
    vUvs = (aVertexPosition.xy + vec2(1.0)) * 0.5;

    vViewVector = matInverse(uProjectionMatrix) * vec4(aVertexPosition.xy, 1.0, 1.0);
    vViewVector /= vViewVector.w;

    gl_Position = vec4(aVertexPosition.xy, 0.0, 1.0);
}