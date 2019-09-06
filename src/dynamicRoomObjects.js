const MaxDynamicRoomObjects = 1024;
const DynamicObjectsUBlock = `layout(std140) uniform DO {vec4 dynO[${MaxDynamicRoomObjects}];};`;


class DynamicRoomObjects {
    constructor(gl) {
        this.data = (new Float32Array(MaxDynamicRoomObjects * 4)).fill(-1);
        this.ubo = createUniformBuffer(gl, MaxDynamicRoomObjects * 4 * 4);
        this.nObjects = 0;
    }

    submitObject(x, y, z, model) {
        let idx = 4 * this.nObjects++;
        this.data[idx] = x;
        this.data[idx + 1] = y;
        this.data[idx + 2] = z;
        this.data[idx + 3] = model;
    }

    submitUBO(gl) {
        this.data[4 * this.nObjects + 3] = -1;
        updateUniformBuffer(gl, this.ubo, this.data);
        this.nObjects = 0;
    }
}