
uniform sampler2D uPositionsSampler;

void main()
{
    vec3 posA = vec3(texelFetch(uPositionsSampler, ivec2(gl_FragCoord.x, 0), 0));
    vec3 initialPos = posA;
    vec3 posB = vec3(texelFetch(uPositionsSampler, ivec2(gl_FragCoord.x, 1), 0));
    vec3 view = posB - posA;
    float viewLen = length(view);
    vec4 result = vec4(0);

    if (viewLen != 0.0) {

        view /= viewLen;
        float t = 0.0;
        viewLen = max(0.1, viewLen);

        for (int i = ZERO; i < 128; i++) {
            float h = worldSdf(posA + view * t);
            if (abs(h) < 0.001 || t > viewLen)
                break;
            t += h;
        }

        if (t < viewLen) {
            vec3 n = calcNormal(posA + view * t);
            result = vec4(posA, t);
        }
    }

    fragColor = result;
}