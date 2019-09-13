float sdfPlayerShip(vec3 pos)
{
    return sdfOpSmoothUnion(sdfBox(pos, vec3(0.05, 0.05, 0.15)),
        sdfBox(pos - vec3(0.0, 0.0, 0.06), vec3(0.3, 0.05, 0.05)), 0.1);
}

float sdOctahedron(in vec3 p, in float s)
{
    p = abs(p);
    return (p.x + p.y + p.z - s) * 0.57735027;
}

float dcm(vec3 p, vec3 pos, float model)
{
    if (model < 1.5) {
        return sdOctahedron(p - pos, 0.4);
    } else if (model < 2.5) {

        //Rotavirus
        float d = length(p - pos) - 0.15;
        const int N = 25;
        for (int i = 0; i < N; i++) {

            vec2 fLatt = vec2(float(i) / float(N), 2.0 * float(i) / (1.0 + sqrt(5.0)));
            vec2 cil = vec2(acos(2.0 * fLatt.x - 1.0) - (3.1415 / 2.0), 2.0 * 3.1415 * fLatt.y);
            vec3 dir = normalize(vec3(cos(cil.x) * cos(cil.y), cos(cil.x) * sin(cil.y), sin(cil.x)));
            vec3 offset = dir * (0.2 + 0.08 * sin(uTimeSeconds * 3.0 + float(i) * 3.1415));
            float nd = length(p - pos - offset) - 0.025;

            const float k = 0.18;
            float h = clamp(0.5 + 0.5 * (nd - d) / k, 0.0, 1.0);
            d = mix(nd, d, h) - k * h * (1.0 - h);
        }
        return d;
    }
    return length(p - pos) - 1.0;
}

float dynamicStuff(vec3 pos)
{
    int i = 0;
    float d = sdfPlayerShip(vec3(uDynamicTransforms[0] * vec4(pos, 1.0)));

    while (dynO[i].w >= 0.0) {
        d = min(d, dcm(pos, vec3(dynO[i]), dynO[i].w));
        i++;
    }

    return d;
}