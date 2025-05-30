import DeviceDetector from "https://cdn.skypack.dev/device-detector-js@2.2.10";
// Usage: testSupport({client?: string, os?: string}[])
// Client and os are regular expressions.
// See: https://cdn.jsdelivr.net/npm/device-detector-js@2.2.10/README.md for
// legal values for client and os
testSupport([
    { client: 'Chrome' },
]);
function testSupport(supportedDevices) {
    const deviceDetector = new DeviceDetector();
    const detectedDevice = deviceDetector.parse(navigator.userAgent);
    let isSupported = false;
    for (const device of supportedDevices) {
        if (device.client !== undefined) {
            const re = new RegExp(`^${device.client}$`);
            if (!re.test(detectedDevice.client.name)) {
                continue;
            }
        }
        if (device.os !== undefined) {
            const re = new RegExp(`^${device.os}$`);
            if (!re.test(detectedDevice.os.name)) {
                continue;
            }
        }
        isSupported = true;
        break;
    }
}
const controls = window;
const drawingUtils = window;
const mpFaceMesh = window;
const config = { locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@` +
            `${mpFaceMesh.VERSION}/${file}`;
    } };
// Our input frames will come from here.
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const controlsElement = document.getElementsByClassName('control-panel')[0];
const canvasCtx = canvasElement.getContext('2d');
/**
 * Solution options.
 */
const solutionOptions = {
    selfieMode: true,
    enableFaceGeometry: false,
    maxNumFaces: 2,
    refineLandmarks: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
};
// We'll add this to our control panel later, but we'll save it here so we can
// call tick() each time the graph runs.
const fpsControl = new controls.FPS();
// Optimization: Turn off animated spinner after its hiding animation is done.
const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
    spinner.style.display = 'none';
};

// function to rotate landmark 
function flipLanmarks(all_landmarks, landmarkIndices, flipx=true, flipy=false) {
// find smallest and largest x and y coordinates for lips
        for (const landmarks of all_landmarks) {
            // max and min x and y coordinates
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            for (const lip_indeces of landmarkIndices) {
                for (const lip_index of lip_indeces) {
                    const landmark = landmarks[lip_index];
                    if (!landmark) {
                        // console.warn(`Landmark index ${lip_index} is undefined`);
                        continue;
                    }
                    const x = landmarks[lip_index].x * canvasElement.width;
                    const y = landmarks[lip_index].y * canvasElement.height;
                    if (x < 0 || x > canvasElement.width || y < 0 || y > canvasElement.height) {
                        console.warn(`Lips landmark ${lip_index} is out of bounds: (${x}, ${y})`);
                    } else {
                        if (x < minX) {
                            minX = x;
                        }
                        if (x > maxX) {
                            maxX = x;
                        }
                        if (y < minY) {
                            minY = y;
                        }
                        if (y > maxY) {
                            maxY = y;
                        }
                    }
                }
            }
            // check if minX, minY, maxX, maxY are valid
            if (minX === Infinity || maxX === -Infinity || minY === Infinity || maxY === -Infinity) {
                // console.warn('No valid lips landmarks found');
                continue;
            }
            // log the coordinates
            // console.log(`Lips bounding box: (${minX}, ${minY}) - (${maxX}, ${maxY})`);
            // draw a rectangle around the lips
            canvasCtx.strokeStyle = '#FF0000';
            canvasCtx.lineWidth = 2;
            // canvasCtx.strokeRect(minX, minY, maxX - minX, maxY - minY);
            // flip the image int the rectangle 
            const imageData = canvasCtx.getImageData(minX, minY, maxX - minX, maxY - minY);
            const flippedImageData = new ImageData(imageData.width, imageData.height);
            for (let y = 0; y < imageData.height; y++) {
                for (let x = 0; x < imageData.width; x++) {
                    const index = (y * imageData.width + x) * 4;
                    const flippedX = flipx ? imageData.width - x - 1 : x;
                    const flippedY = flipy ? imageData.height - y - 1 : y; // flip vertically
                    const flippedIndex = (flippedY * imageData.width + flippedX) * 4;
                    flippedImageData.data[flippedIndex] = imageData.data[index];
                    flippedImageData.data[flippedIndex + 1] = imageData.data[index + 1];
                    flippedImageData.data[flippedIndex + 2] = imageData.data[index + 2];
                    flippedImageData.data[flippedIndex + 3] = imageData.data[index + 3];
                }
            }
            // put the flipped image data back to the canvas
            canvasCtx.putImageData(flippedImageData, minX, minY);
            
        }
}

function onResults(results) {
    // Hide the spinner.
    document.body.classList.add('loaded');
    // Update the frame rate.
    fpsControl.tick();
    // Draw the overlays.
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    if (results.multiFaceLandmarks) {
        for (const landmarks of results.multiFaceLandmarks) {
            // drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
            // drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_RIGHT_EYE, { color: '#FF3030' });
            // drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_RIGHT_EYEBROW, { color: '#FF3030' });
            // drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_LEFT_EYE, { color: '#30FF30' });
            // drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_LEFT_EYEBROW, { color: '#30FF30' });
            // drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_FACE_OVAL, { color: '#E0E0E0' });
            // drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_LIPS, { color: '#E0E0E0' });

            if (solutionOptions.refineLandmarks) {
                drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_RIGHT_IRIS, { color: '#FF3030' });
                drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_LEFT_IRIS, { color: '#30FF30' });
            }
        }
        
        // flip the lips landmarks
        flipLanmarks(results.multiFaceLandmarks, mpFaceMesh.FACEMESH_LIPS, true, false);
        flipLanmarks(results.multiFaceLandmarks, mpFaceMesh.FACEMESH_RIGHT_EYE, true, false);
        flipLanmarks(results.multiFaceLandmarks, mpFaceMesh.FACEMESH_LEFT_EYE, true, false);



    }
    canvasCtx.restore();
}
const faceMesh = new mpFaceMesh.FaceMesh(config);
faceMesh.setOptions(solutionOptions);
faceMesh.onResults(onResults);
// Present a control panel through which the user can manipulate the solution
// options.
new controls
    .ControlPanel(controlsElement, solutionOptions)
    .add([
    new controls.StaticText({ title: 'MediaPipe Face Mesh' }),
    fpsControl,
    new controls.Toggle({ title: 'Selfie Mode', field: 'selfieMode' }),
    new controls.SourcePicker({
        onFrame: async (input, size) => {
            // console.log(`Received input frame of size ${size.width}x${size.height}`);
            const aspect = size.height / size.width;
            let width, height;
            if (window.innerWidth > window.innerHeight) {
                height = window.innerHeight;
                width = height / aspect;
            }
            else {
                width = window.innerWidth;
                height = width * aspect;
            }
            canvasElement.width = width;
            canvasElement.height = height;
            await faceMesh.send({ image: input });
        },
    }),
    new controls.Slider({
        title: 'Max Number of Faces',
        field: 'maxNumFaces',
        range: [1, 4],
        step: 1
    }),
    new controls.Toggle({ title: 'Refine Landmarks', field: 'refineLandmarks' }),
    new controls.Slider({
        title: 'Min Detection Confidence',
        field: 'minDetectionConfidence',
        range: [0, 1],
        step: 0.01
    }),
    new controls.Slider({
        title: 'Min Tracking Confidence',
        field: 'minTrackingConfidence',
        range: [0, 1],
        step: 0.01
    }),
])
    .on(x => {
    const options = x;
    videoElement.classList.toggle('selfie', options.selfieMode);
    faceMesh.setOptions(options);
});
