const MaxQueries = 1024;
const QueriesEntries = 2;

class SDFQueryManager {
    async init(gl, roomSet) {

        this.readDst = (new Float32Array(4 * MaxQueries)).fill(SomeBigFloat);
        this.queries = (new Float32Array(3 * MaxQueries * QueriesEntries)).fill(SomeBigFloat);
        this.nQueries = 0;

        this.shader = await createProgramAsync(gl, prependPrecisionAndVersion(screenQuadVS), roomSet.generateCollisionsShader());
        console.log("Created collisions shader");
        this.fbo = createFBOWithTextureAttachment(gl, MaxQueries, 1, gl.RGBA32F, gl.RGBA, gl.FLOAT);
        this.aVertexPosition = gl.getAttribLocation(this.shader, "aVertexPosition");
        this.uScreenSize = getUniformLocation(gl, this.shader, "uScreenSize");
        this.uPositionsSampler = getUniformLocation(gl, this.shader, "uPositionsSampler");

        this.uploadTexture = createTexture2d(gl, MaxQueries, QueriesEntries, gl.RGB32F, gl.RGB, gl.FLOAT);
    }


    submitQuery(xa, ya, za, xb, yb, zb) {
        let n = this.nQueries++;
        let idx = n * 3;
        this.queries[idx] = xa;
        this.queries[idx + 1] = ya;
        this.queries[idx + 2] = za;
        idx += MaxQueries * 3;
        this.queries[idx] = xb;
        this.queries[idx + 1] = yb;
        this.queries[idx + 2] = zb;
        return n;
    }

    fetchQuery(idx) {
        idx *= 4;
        let r = this.readDst;
        return [r[idx], r[idx + 1], r[idx + 2], r[idx + 3]];
    }

    fetchQueries(gl) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo.fbo);
        gl.readPixels(0, 0, MaxQueries, 1, gl.RGBA, gl.FLOAT, this.readDst);
    }

    runGpuQuery(gl) {
        bindFBOAndSetViewport(gl, this.fbo.fbo, [MaxQueries, 1]);

        gl.bindBuffer(gl.ARRAY_BUFFER, globalRenderState.quadBuffer);
        gl.vertexAttribPointer(this.aVertexPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.aVertexPosition);
        gl.useProgram(this.shader);
        gl.uniform2iv(this.uScreenSize, [MaxQueries, 1]);

        gl.bindTexture(gl.TEXTURE_2D, this.uploadTexture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, MaxQueries, QueriesEntries, gl.RGB, gl.FLOAT, this.queries);
        gl.uniform1i(this.uPositionsSampler, 0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        this.nQueries = 0;
    }
}