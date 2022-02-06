(() => {

    // Elements
    const $g_canvasesWrapper = document.querySelector('.canvases-wrapper');
    const $g_colorsWrapper = document.querySelector('.colors-wrapper');
    const $g_uploadButton = document.querySelector('.upload-button');
    const $g_colorThresholdRange = document.querySelector('.color-threshold-range');
    const $g_alphaThresholdRange = document.querySelector('.alpha-threshold-range');
    const $g_resetButton = document.querySelector('.reset-button');
    const $g_saveButton = document.querySelector('.save-button');
    const $g_previewImage = document.querySelector('.preview-image');
    const $g_previewSpeedRange = document.querySelector('.preview-speed-range');

    // Storage of canvas element and its corresponding filename
    let $g_canvasElements = [];

    // Storage of canvas element but the index is the filename
    let g_sortedCanvases = [];

    // Storage of different colors and its canvases with that color plus index of that color
    let g_colors = [];

    // Normal variables
    let g_fileCount = 0;
    let g_files = [];

    // Options
    let g_colorThreshold = 50;
    let g_alphaThreshold = 255;
    let g_previewSpeed = 300;

    // Intervals
    let g_uploadingInterval;
    let g_spritePreviewInterval;

    const init = () => {
        bindEvents();
    };

    const bindEvents = () => {

        // Set events for our elements
        $g_uploadButton.addEventListener('change', addToCanvasEvent, false);
        $g_colorThresholdRange.addEventListener('change', changeColorThresholdEvent);
        $g_alphaThresholdRange.addEventListener('change', changeAlphaThresholdEvent);
        $g_previewSpeedRange.addEventListener('change', changePreviewSpeedEvent);
        $g_resetButton.addEventListener('click', recomputeDataEvent);
        $g_saveButton.addEventListener('click', saveImagesEvent);
    };

    // Reset everything to default
    const resetData = () => {
        $g_canvasElements = [];
        g_colors = [];
        g_sortedCanvases = [];

        g_fileCount = 0;

        clearInterval(g_uploadingInterval);
        clearInterval(g_spritePreviewInterval);

        $g_canvasesWrapper.innerHTML = '';
        $g_colorsWrapper.innerHTML = '';
    };

    // Recompute everything using the updated color threshold
    const changeColorThresholdEvent = () => {
        g_colorThreshold = $g_colorThresholdRange.value;

        recomputeDataEvent();
    }

    // Recompute everything using the updated alpha threshold
    const changeAlphaThresholdEvent = () => {
        g_alphaThreshold = $g_alphaThresholdRange.value;

        recomputeDataEvent();
    }

    // Run preview again using the updated preview speed
    const changePreviewSpeedEvent = () => {

        // Speed is in ms, we need to reverse the value so that we can have smaller ms on bigger value
        g_previewSpeed = 1000 - $g_previewSpeedRange.value;

        runPreviewInterval();
    }

    // Recompute everything using the same uploaded files
    const recomputeDataEvent = () => {
        addToCanvas(g_files);
    };

    // Save the updated images using the same filename
    const saveImagesEvent = () => {

        var zip = new JSZip();

        $g_canvasElements.forEach(canvasElement => {

            const $canvasElement = canvasElement.canvas;
            const fileName = canvasElement.fileName;

            // Convert canvas to base64 and remove data:image/png;base64, we only need the base64 data
            let dataUrl = $canvasElement.toDataURL('image/png').replace('data:image/png;base64,', "");

            // Add to js zip
            zip.file(fileName, dataUrl, { base64: true });
        });

        zip.generateAsync({ type: "blob" })
            .then(function (content) {

                saveAs(content, 'output.zip');
            });
    };

    // Start previewing the sprites
    const startPreview = () => {

        const tmpSortedCanvases = [];

        // Sort by file name
        $g_canvasElements.forEach(canvasElement => {

            const $canvasElement = canvasElement.canvas;
            const fileName = canvasElement.fileName;

            // Get the sprite number
            const fileNameSplit = fileName.split('.');

            // Store the canvas using the sprite number as index
            tmpSortedCanvases[fileNameSplit[0]] = $canvasElement;
        });

        g_sortedCanvases = [];

        // Re order to remove skips, because what if filename is 11, array will start at index 11 but we don't want that
        for (let i = 0; i < tmpSortedCanvases.length; i++) {
            if (tmpSortedCanvases[i] instanceof HTMLCanvasElement) {
                g_sortedCanvases.push(tmpSortedCanvases[i]);
            }
        }

        runPreviewInterval();
    };

    // After uploading images event
    const addToCanvasEvent = e => {

        // Store the files for future use
        g_files = e.target.files;

        addToCanvas(e.target.files);
    };

    // Loop all canvas images on preview image element
    const runPreviewInterval = () => {

        clearInterval(g_spritePreviewInterval);

        var canvasIndex = 0;

        g_spritePreviewInterval = setInterval(() => {

            const canvas = g_sortedCanvases[canvasIndex];

            // Set image of preview image if its a valid canvas
            if (canvas instanceof HTMLCanvasElement) {
                $g_previewImage.src = canvas.toDataURL();
            }

            canvasIndex++;

            if (canvasIndex > g_fileCount) {

                // Start previewing again
                runPreviewInterval();

                return;
            }

        }, g_previewSpeed);
    };

    // Create canvas and set the image based on image files uploaded
    const addToCanvas = files => {

        // Fresh start
        resetData();

        // Store file count for future use
        g_fileCount = files.length;

        // Loop through all files
        for (let i = 0; i < files.length; i++) {

            const fileReader = new FileReader();

            fileReader.onload = event => {

                const img = new Image();

                // Event after loading image
                img.onload = () => {

                    let $canvasWrapper = document.createElement('div');
                    $canvasWrapper.classList.add('canvas-wrapper');

                    let $label = document.createElement('label');
                    $label.classList.add('canvas-filename');
                    $label.innerHTML = event.target.fileName;

                    // Create canvas element
                    let $canvas = document.createElement('canvas');
                    let ctx = $canvas.getContext('2d');

                    // Set canvas width and height based on image
                    $canvas.width = img.width;
                    $canvas.height = img.height;

                    // Draw the image on the canvas
                    ctx.drawImage(img, 0, 0);

                    $canvasWrapper.appendChild($canvas);
                    $canvasWrapper.appendChild($label);

                    // Add canvas to canvas wrapper
                    $g_canvasesWrapper.appendChild($canvasWrapper);

                    // Add canvas and its corresponding file name to array of canvas
                    $g_canvasElements.push({
                        canvas: $canvas,
                        fileName: event.target.fileName
                    });
                }

                // Set image to load
                img.src = event.target.result;
            }

            // Set file name on file reader
            fileReader.fileName = files[i].name;

            // Set blob on file reader
            fileReader.readAsDataURL(files[i]);
        }

        // Wait until every image is loaded
        g_uploadingInterval = setInterval(() => {

            if (g_fileCount == $g_canvasElements.length) {

                // Stop waiting and set colors
                clearInterval(g_uploadingInterval);
                setColors();
            }

        }, 100);

    }

    // Save the colors based on unique images colors
    const setColors = () => {

        $g_canvasElements.forEach(canvasElement => {

            const $canvasElement = canvasElement.canvas;

            const ctx = $canvasElement.getContext('2d');

            // Get the canvas data starting top left with the same height and width
            const canvasImageData = ctx.getImageData(0, 0, $canvasElement.width, $canvasElement.height);

            // Get the canvas data, canvas data are the pixels, for example: r,g,b,a,r,g,b,a,r,g,b,a
            const data = canvasImageData.data;

            for (let i = 0; i < data.length; i += 4) {

                // RGBA
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];

                // a is alpha, there's no color if alpha is 0
                if (a == 0) {
                    continue;
                }

                // Check if the color is unique to our stored colors
                if (isColorDifferent(r, g, b, a, $canvasElement, i)) {

                    // If color is unique or different, we will create a new color
                    g_colors.push(
                        {
                            // Original data index rgba of canvas in the loop 
                            originalColor: {
                                r: r,
                                g: g,
                                b: b,
                                a: a
                            },

                            // Store the initial data of canvases
                            canvases: [{

                                // Canvas in the loop
                                canvasElement: $canvasElement,

                                // Data index of canvas in the loop
                                dataIndexes: [i]
                            }]
                        }
                    );
                }
            }
        });

        createColorPanels();
    };

    // Check if color is different from our stored colors using threshold logic
    const isColorDifferent = (r, g, b, a, canvasElement, dataIndex) => {

        for (let i = 0; i < g_colors.length; i++) {

            // Get the stored color
            const color = g_colors[i];

            // Get the stored color rgba
            const red = r - color.originalColor.r;
            const green = g - color.originalColor.g;
            const blue = b - color.originalColor.b;
            const alpha = a - color.originalColor.a;

            let distance = 0;

            // Include alpha if the alpha of color is in the alpha threshold
            if (a >= g_alphaThreshold) {
                distance = red * red + green * green + blue * blue + alpha * alpha;
            }

            // Don't mind alpha here
            else {
                distance = red * red + green * green + blue * blue;
            }

            const colorThreshold = g_colorThreshold * g_colorThreshold;

            // If distance is in the threshold, color is slightly the same
            if (distance <= colorThreshold) {

                const canvasIndex = getCanvasIndexOnColors(i, canvasElement);

                // If not found, we will create a new canvases element
                if (canvasIndex == -1) {

                    g_colors[i].canvases.push({
                        canvasElement: canvasElement,

                        // Save the initial data index
                        dataIndexes: [dataIndex]
                    });
                }

                // If found, we just add the data index of canvas to the storage of data indexes
                else {
                    g_colors[i].canvases[canvasIndex].dataIndexes.push(dataIndex);
                }
                return false;
            }
        }

        // Color is different
        return true;
    };

    // Get canvas index inside the color canvases
    const getCanvasIndexOnColors = (colorIndex, canvasElement) => {

        // Get the canvases of color
        const canvases = g_colors[colorIndex].canvases;

        for (let i = 0; i < canvases.length; i++) {

            // Return the index if the stored canvas is the same with the parameter canvas
            if (canvases[i].canvasElement == canvasElement) {
                return i;
            }
        }

        // Not found
        return -1;
    };

    // Create color elements using the stored colors
    const createColorPanels = () => {

        g_colors.forEach((color, index) => {

            // Color element wrapper
            const $colorDiv = document.createElement('div');
            $colorDiv.classList.add('color');

            // Old color input, disabled
            const $oldColorInput = document.createElement('input');
            $oldColorInput.setAttribute('type', 'color');
            $oldColorInput.disabled = true;
            $oldColorInput.classList.add('old-color-input');

            // New color input
            const $newColorInput = document.createElement('input');
            $newColorInput.setAttribute('type', 'color');
            $newColorInput.setAttribute('data-color-index', index);
            $newColorInput.classList.add('new-color-input');
            $newColorInput.addEventListener('input', colorChangeEvent);

            // We need to convert the original rgba to hex because input type color only accepts hex color
            const oldColorHex = rgbToHex(color.originalColor);

            // Set the color input value to the original color
            $oldColorInput.value = oldColorHex;
            $newColorInput.value = oldColorHex;

            // Alpha range wrapper
            const $inputRangeWrapper = document.createElement('div');
            $inputRangeWrapper.classList.add('range-wrapper');

            // Alpha range label
            const $labelForInputRange = document.createElement('label');
            $labelForInputRange.classList.add('range-label');
            $labelForInputRange.innerHTML = 'Alpha';

            // Alpha range input
            const $inputRange = document.createElement('input');
            $inputRange.setAttribute('data-color-index', index);
            $inputRange.setAttribute('type', 'range');
            $inputRange.setAttribute('min', '0');
            $inputRange.setAttribute('max', '255');
            $inputRange.setAttribute('value', '255');
            $inputRange.addEventListener('input', alphaChangeEvent);

            // Add alpha range input and alpha range label to alpha range wrapper, they need to be together forever
            $inputRangeWrapper.appendChild($labelForInputRange);
            $inputRangeWrapper.appendChild($inputRange);

            // Add all needed elements to color element wrapper
            $colorDiv.appendChild($oldColorInput);
            $colorDiv.appendChild($newColorInput);
            $colorDiv.appendChild($inputRangeWrapper);

            // Add the color element wrapper to our static colors wrapper
            $g_colorsWrapper.appendChild($colorDiv);
        });

        // After everything is set, we will start previewing the sprites
        startPreview();
    };

    // Change the color of canvas data after changing the color of color input
    const colorChangeEvent = e => {

        // We need to know what color index is this element
        const colorIndex = e.target.getAttribute('data-color-index');

        // Get the new rgba
        const newColor = hexToRgba(e.target.value);

        // Get the color, we need to know what canvases and data indexes to update
        const color = g_colors[colorIndex];

        // Loop through the canvases of the stored color
        color.canvases.forEach((canvas) => {

            // Get the canvas element to update
            const $canvasElement = canvas.canvasElement;

            // Indexes we need to update
            const dataIndexes = canvas.dataIndexes;

            const ctx = $canvasElement.getContext('2d');

            // Get the canvas image data, we will update this data
            const canvasImageData = ctx.getImageData(0, 0, $canvasElement.width, $canvasElement.height);

            for (let i = 0; i < dataIndexes.length; i++) {

                // Get the data index we need to update
                const dataIndex = dataIndexes[i];

                // Update the rgb now
                canvasImageData.data[dataIndex] = newColor.r;
                canvasImageData.data[dataIndex + 1] = newColor.g;
                canvasImageData.data[dataIndex + 2] = newColor.b;
            }

            // Set back the updated canvas image data
            ctx.putImageData(canvasImageData, 0, 0);
        });
    };

    // Change the alpha of canvas data after changing the color of color input
    const alphaChangeEvent = (e) => {

        // We need to know what color index is this element
        const colorIndex = e.target.getAttribute('data-color-index');

        /**
         * We need to know the new color of this data indexes
         * because if we change the alpha to 0, rgb will become 0 too
         * we need to update rgb also using the new color picked
         */
        const newColorInput = document.querySelector('.new-color-input[data-color-index="' + colorIndex + '"]');

        const newColor = hexToRgba(newColorInput.value);

        /**
         * Updated alpha, once we change the alpha of colors, we can't go back to the original alpha
         * For example: color1 alpha is 150, color2 alpha is 50, these 2 colors have the same threshold
         * Therefore, if we change the alpha of color1 it will also change the alpha of color2
         * If the updated alpha is 200, color1 and color2 alpha will be updated to 200, we can't go back to 150 and 50
         */
        const newAlpha = e.target.value;

        // Get the color, we need to know what canvases and data indexes to update
        const color = g_colors[colorIndex];

        // Loop through the canvases of the stored color
        color.canvases.forEach((canvas) => {

            // Get the canvas element to update
            const $canvasElement = canvas.canvasElement;

            // Indexes we need to update
            const dataIndexes = canvas.dataIndexes;

            const ctx = $canvasElement.getContext('2d');

            // Get the canvas image data, we will update this data
            const canvasImageData = ctx.getImageData(0, 0, $canvasElement.width, $canvasElement.height);

            for (let i = 0; i < dataIndexes.length; i++) {

                // Get the data index we need to update
                const dataIndex = dataIndexes[i];

                // Set rgb first
                canvasImageData.data[dataIndex] = newColor.r;
                canvasImageData.data[dataIndex + 1] = newColor.g;
                canvasImageData.data[dataIndex + 2] = newColor.b;

                // Update the alpha of rgb
                canvasImageData.data[dataIndex + 3] = newAlpha;
            }

            // Set back the updated canvas image data
            ctx.putImageData(canvasImageData, 0, 0);
        });
    };

    init();

})();