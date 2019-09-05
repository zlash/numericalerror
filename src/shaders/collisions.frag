
uniform sampler2D uPositionsSampler;

void main()
{
    vec3 pos = vec3(texelFetch(uPositionsSampler, ivec2(gl_FragCoord.x, 0), 0));
    fragColor = vec4(calcNormal(pos), worldSdf(pos));
}