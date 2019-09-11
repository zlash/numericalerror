function randomElement(arr) {
    return arr[Math.floor(arr.length * Math.random())];
}

function randomWithNeg() {
    return Math.random() * 2.0 - 1.0;
}

function toIntInterval(f, a, b) {
    return Math.floor(f * (b - a)) + a;
}

function randBetween(a, b) {
    return toIntInterval(Math.random(), a, b);
}

function generateRandomNode() {
    return {
        osc: randomElement(["sin", "sq", "saw"]),
        freq: randomWithNeg(),
        amplitude: Math.random()
    }
}

function randomGraph(nNodes) {
    let nodes = Array(nNodes).fill(null).map(() => generateRandomNode());
    let outputs = [];

    for (let i = 1; i < nodes.length; i++) {
        let node = nodes[i];
        const maxOutputsChance = 0.7;
        let moreOutputsChance = maxOutputsChance;
        while (true) {

            if (Math.random() < moreOutputsChance) {
                let randNode = randomElement(nodes);
                let input = randomElement(["freqMod", "amplitudeMod"]);
                randNode[input] = randNode[input] || [];
                randNode[input].push(i);
            } else break;
            moreOutputsChance /= 5;
        }

        if (moreOutputsChance === maxOutputsChance) {
            outputs.push(i);
        }
    }

    return { nodes: nodes, outputs: outputs };
}



function playNode(frameResults, graph, nodeId, baseNote, timeSeconds, output) {

    if (frameResults[nodeId]) {
        return frameResults[nodeId];
    }

    let node = graph.nodes[nodeId];
    let freq = node.freq;
    let amplitude = node.amplitude;

    //Adapt frequecy to musical multiples
    if (output) {
        freq = baseNote + 12 * Math.floor(freq * 2);
    } else {
        freq = baseNote + Math.floor(12 * freq * 8);
    }
    freq = Math.pow(2, (freq - 69) / 12) * 440;

    //Apply mods

    if (node.amplitudeMod) {
        let ampMod = node.amplitudeMod.reduce((acc, nodeI) => acc + (playNode(frameResults, graph, nodeI, baseNote, timeSeconds) / node.amplitudeMod.length), 0);
        amplitude += ampMod;
    }

    if (node.freqMod) {
        let freqMod = node.freqMod.reduce((acc, nodeI) => acc + (playNode(frameResults, graph, nodeI, baseNote, timeSeconds) / node.freqMod.length), 0);
        freq *= freqMod * 3;
    }

    let pi2 = Math.PI * 2;

    node.oscPos += freq * pi2 * timeSeconds;

    let val = Math.sin(node.oscPos);

    //"sq", "saw"
    switch (node.osc) {
        case "sq":
            val = Math.sign(val);
            break;
        case "saw":
            val = node.oscPos;
            val = val - Math.floor(val);
            val = 2 * val - 1;
            break;
    }

    frameResults[nodeId] = amplitude * val;



    return frameResults[nodeId];
}

function generateSample(ctx, durationSeconds, graph, baseNote) {
    let sampleRate = ctx.sampleRate;
    var buffer = ctx.createBuffer(1, sampleRate * durationSeconds, sampleRate);
    var audioData = buffer.getChannelData(0);

    console.log(JSON.stringify(graph));
    graph.nodes.forEach(x => x.oscPos = 0.0);

    let biggest = -200;


    for (var i = 0; i < buffer.length; i++) {
        let t = 1 / sampleRate;

        let noteOffset = [0, 6, 0, 8][Math.floor(4 * i / buffer.length)];


        noteOffset += [0, 4, 7][Math.floor(100 * i / buffer.length) % 3];

        audioData[i] = graph.outputs.reduce((acc, node) => acc + playNode([], graph, node, baseNote + noteOffset, t, true), 0);

        //Reverb?
        const samples = sampleRate * 0.2;
        if (i > samples) {
            audioData[i] = audioData[i] * 0.7 + 0.3 * audioData[i - samples];
        }

        //Flange?
        const flangeDist = sampleRate * 0.2;
        if (i > flangeDist) {
            let flange = Math.floor((Math.sin(0.1 * 2 * Math.PI * i / sampleRate) * 0.5 + 0.5) * flangeDist);
            audioData[i] = 0.5 * audioData[i] + 0.5 * audioData[i - flange];
        }

        if (audioData[i] > biggest) {
            biggest = audioData[i];
        }
    }

    //normalize
    for (var i = 0; i < buffer.length; i++) {
        audioData[i] /= biggest;
    }

    console.log("DONE");
    return buffer;
}


document.addEventListener("click", () => {
    let duration = 10;
    var context = new AudioContext()
    let sample = generateSample(context, duration, randomGraph(randBetween(4, 15)), 71);

    var compressor = context.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, context.currentTime);
    compressor.knee.setValueAtTime(40, context.currentTime);
    compressor.ratio.setValueAtTime(12, context.currentTime);
    compressor.attack.setValueAtTime(0, context.currentTime);
    compressor.release.setValueAtTime(0.25, context.currentTime);


    var source = context.createBufferSource();
    source.buffer = sample;

    source.connect(compressor);
    compressor.connect(context.destination);


    source.start();

    //setTimeout(() => { source.stop() }, duration * 1000);
});
