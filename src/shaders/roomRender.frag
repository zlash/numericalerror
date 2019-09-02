
float shadow(vec3 ro, vec3 rd, float mint, float tmax)
{
    float res = 1.0;
    float t = mint;

    for (int i = 0; i < 32; i++) {
        float h = room(ro + rd * t).x;

        res = min(res, 10.0 * h / t);

        t += h;

        if (abs(h) < 0.001 || t > tmax)
            break;
    }
    return step(0.01, res);
}

uniform mat4 uProjectionMatrix;

void main()
{
    const float sensorSize = 3.0;
    vec3 col = vec3(0.0);
    vec3 p;
    vec2 mt;
    float t = 0.1;
    mat4 invModelView = inverse(uModelViewMatrix);

    vec2 vUvs = gl_FragCoord.xy / vec2(uScreenSize);

    vec4 pView = inverse(uProjectionMatrix) * vec4(vUvs.xy * 2.0 - vec2(1), -1.0, 1.0);
    vec4 pView2 = inverse(uProjectionMatrix) * vec4(vUvs.xy * 2.0 - vec2(1), 1.0, 1.0);
    vec3 pos = (pView.xyz / pView.w);
    vec3 view = normalize((pView2.xyz / pView2.w) - pos);

    for (int i = 0; i < 64; i++) {
        p = pos + view * t;
        p = vec3(invModelView * vec4(p, 1.0));
        mt = room(p);
        float h = mt.x;
        if (abs(h) < 0.001 || t > 20.0)
            break;
        t += h;
    }

    if (t < 20.0) {
        vec3 light = normalize(vec3(1.0, 1.0, 1.0));
        if (mt.y > 0.0) {
            col = vec3(1.0, 0.0, 0.0);
        } else {
            col = vec3(0.6);
        }
        vec3 n = calcNormal(p);

        float att = 1.0;
        att *= max(0.0, dot(light, n));
        //att *= shadow(p, light, 0.05, 20.0);
        col *= min(1.0, 0.4 + att);
    } else {
        discard;
    }

    fragColor = vec4(col.xyz, 1.0);
}