
void main()
{
    fragColor = vec4(calcNormal(uPlayerPos), worldSdf(uPlayerPos));
}