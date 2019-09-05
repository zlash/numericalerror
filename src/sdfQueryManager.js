const MaxQueries = 1024;

class SDFQueryManager {
    constructor(gl, roomSet) {
        this.shader = createProgram(gl, prependPrecisionAndVersion(screenQuadVS), roomSet.generateCollisionsShader());
        this.fbo = createFBOWithTextureAttachment(gl, MaxQueries, 1, gl.RGBA32F, gl.RGBA, gl.FLOAT);
        this.aVertexPosition = gl.getAttribLocation(this.shader, "aVertexPosition");
        this.uScreenSize = getUniformLocation(gl, this.shader, "uScreenSize");
        this.uPositionsSampler = getUniformLocation(gl, this.shader, "uPositionsSampler");
        this.readDst = (new Float32Array(4 * MaxQueries)).fill(SomeBigFloat);
        this.queries = (new Float32Array(3 * MaxQueries)).fill(SomeBigFloat);
        this.uploadTexture = createTexture2d(gl, MaxQueries, 1, gl.RGB32F, gl.RGB, gl.FLOAT);
        this.nQueries = 0;
    }

    submitQuery(x, y, z) {
        let n = this.nQueries++;
        let idx = n * 4;
        this.queries[idx] = x;
        this.queries[idx + 1] = y;
        this.queries[idx + 2] = z;
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
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, MaxQueries, 1, gl.RGB, gl.FLOAT, this.queries);
        gl.uniform1i(this.uPositionsSampler, 0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        this.nQueries = 0;
    }
}