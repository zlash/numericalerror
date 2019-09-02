
in vec4 vViewVector;

uniform mat4 uModelViewMatrix;
uniform ivec2 uScreenSize;

uniform mat4 uDynamicTransforms[10];

layout(location = 0) out vec4 fragColor;