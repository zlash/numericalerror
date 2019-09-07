float sdfPlayerShip(vec3 pos)
{
    return sdfOpSmoothUnion(sdfBox(pos, vec3(0.1, 0.1, 0.3)),
        sdfBox(pos - vec3(0.0, 0.0, 0.15), vec3(0.4, 0.05, 0.1)), 0.1);
}

float dcm(vec3 p, vec3 pos, float model)
{
    if (model < 1.5) {
        return length(p - pos) - 0.1;
    } else if (model < 2.5) {
        return length(p - pos) - 0.5;
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