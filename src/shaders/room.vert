in vec4 aVertexPosition;

uniform mat4 uProjectionMatrix;
uniform mat4 uClipModelViewMatrix;

out vec4 vViewVector;


void main()
{
    vec4 v1 = inverse(uProjectionMatrix) * vec4(aVertexPosition.xy, 1.0, 1.0);
    v1/=v1.w;
    vec4 v2 = inverse(uProjectionMatrix) * vec4(aVertexPosition.xy, -1.0, 1.0);
    v2/=v2.w;

    vViewVector = v1-v2;

    gl_Position = uClipModelViewMatrix*vec4(aVertexPosition.xy, 0.0, 1.0);
}