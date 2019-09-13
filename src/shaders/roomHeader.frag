
in vec4 vViewVector;

uniform mat4 uModelViewMatrix;
uniform ivec2 uScreenSize;

uniform mat4 uDynamicTransforms[10];

uniform float uTimeSeconds;

uniform vec4 uGameData; //x: item status

const float bigFloat=3.402823466e+38;

layout(location = 0) out vec4 fragColor;