float sdfPlayerShip(vec3 pos)
{
    return sdfOpSmoothUnion(sdfBox(pos, vec3(0.1, 0.1, 0.3)),
        sdfBox(pos - vec3(0.0, 0.0, 0.15), vec3(0.4, 0.05, 0.1)), 0.1);
}

float dynamicStuff(vec3 pos)
{
    return sdfPlayerShip(vec3(uDynamicTransforms[0] * vec4(pos, 1.0)));
}