const pdfjsLib = window['pdfjs-dist/build/pdf'];
if (!pdfjsLib) {
    console.error('PDF.js library is not loaded.');
} else {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
}


const pdfContainer = document.getElementById('pdf-container');

let uploadedTemplate = null;
let canvasHeight = "";
let canvasWidth = "";
var originalHeight = "";
var originalWidth = "";
var overlaysignflag = false;
let renderedPages = new Set();
let pdfInstance = null;

var overlayesealflag = false;

$(document).ready(function () {
    $('#networkOverlay').hide();
    // $('#digitalforms').addClass('active');

    const pdfBase64 = document.getElementById('filebase64').value;

    const components = document.getElementById('pdfschema').value;



    // let binaryString = '';
    // for (let i = 0; i < pdfByteArray.length; i++) {
    //     binaryString += String.fromCharCode(pdfByteArray[i]);
    // }


    // const pdfBase64 = btoa(binaryString);
    const pdfArrayBuffer = base64ToArrayBuffer(pdfBase64);
    pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise.then(pdf => {
        pdfInstance = pdf;
        setupPlaceholders(pdf.numPages);
        setupLazyObserver(JSON.parse(components));
    }).catch(error => {
        console.error('Error loading PDF:', error);
    });
});




function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function setupPlaceholders(totalPages) {
    pdfContainer.innerHTML = '';
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const placeholder = document.createElement('div');
        placeholder.className = 'pdf-page';
        placeholder.dataset.pageNumber = pageNum;
        placeholder.style.position = 'relative';
        placeholder.style.minHeight = '600px'; // approximate
        pdfContainer.appendChild(placeholder);
    }
}

function setupLazyObserver(annotations) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const pageNum = parseInt(entry.target.dataset.pageNumber);
                if (!renderedPages.has(pageNum)) {
                    renderPage(pageNum, entry.target, annotations);
                    renderedPages.add(pageNum);
                }
            }
        });
    }, {
        root: null,
        rootMargin: '200px',
        threshold: 0.1
    });

    document.querySelectorAll('.pdf-page').forEach(pageDiv => {
        observer.observe(pageDiv);
    });
}


function renderPage(pageNum, container, annotations = []) {
    const canvasScale = 1.5;
    pdfInstance.getPage(pageNum).then(page => {
        const viewport = page.getViewport({ scale: canvasScale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = '100%';

        container.innerHTML = ''; // Clear placeholder
        container.appendChild(canvas);

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        page.render(renderContext).promise.then(() => {
            const annotationLayer = document.createElement('div');
            annotationLayer.className = 'annotation-layer';
            annotationLayer.style.position = 'absolute';
            annotationLayer.style.top = '0';
            annotationLayer.style.left = '0';
            annotationLayer.style.width = '100%';
            annotationLayer.style.height = '100%';
            annotationLayer.style.pointerEvents = 'none';
            annotationLayer.style.zIndex = '10'; // Optional
            container.appendChild(annotationLayer);

            canvasWidth = canvas.getBoundingClientRect().width;
            canvasHeight = canvas.getBoundingClientRect().height;

            originalWidth = viewport.viewBox[2];
            originalHeight = viewport.viewBox[3];

            const pageAnnotations = annotations.filter(annotation => annotation.page === pageNum);
            if (pageAnnotations.length > 0) {
                pageAnnotations.forEach(annotation => {
                    if (annotation.type !== 'Wsave' && annotation.type !== 'Wfill') {
                        const element = createDraggableElement(annotation);
                        if (element) {
                            element.style.pointerEvents = "none";
                            annotationLayer.appendChild(element)
                        }
                    }

                });
            }



        });
    });
}

function createDraggableElement(annotation) {
    if (annotation.type === 'text') {
        const element = document.createElement('div');
        element.classList.add('draggable');
        element.style.position = 'absolute';
        element.style.pointerEvents = 'none';
        element.style.border = 'none';
        element.style.padding = '0';

        const wratio = (annotation.width / 100);
        const hratio = (annotation.height / 100);
        const lratio = ((annotation.x) / 100);
        const tratio = ((annotation.y / 100));
        element.setAttribute('data-wpercent', wratio)
        element.setAttribute('data-hpercent', hratio)
        element.setAttribute('data-lpercent', lratio)
        element.setAttribute('data-tpercent', tratio)

        const content = document.createElement('div');
        content.classList.add('draggable-content');

        element.style.left = (((annotation.x + annotation.draggablepadding) / 100) * canvasWidth) + 'px';
        element.style.top = (((annotation.y / 100) * canvasHeight) + ((annotation.draggablepadding / 100) * canvasWidth)) + 'px';
        // element.style.top = (((annotation.y + annotation.draggablepadding) / 100) * canvasHeight) + 'px';
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Please Enter ' + annotation.id;
        input.classList.add('input-field');
        input.id = annotation.id;
        input.value = annotation.content;
        input.style.width = ((annotation.width / 100) * canvasWidth) + 'px';
        input.style.height = ((annotation.height / 100) * canvasHeight) + 'px';
        input.style.fontSize = ((annotation.fontsize / 100) * canvasWidth) + 'px';
        if (input.value) {
            input.classList.add('has-value');
        }

        input.addEventListener('input', () => {
            if (input.value) {
                input.classList.add('has-value');
            } else {
                input.classList.remove('has-value');
            }
        });

        input.addEventListener('blur', () => {
            if (input.value) {
                input.classList.add('has-value');
            } else {
                input.classList.remove('has-value');
            }
        });

        content.appendChild(input);
        element.appendChild(content);
        return element;
    }
    else if (annotation.type === 'radio') {
        const radiodiv = document.createElement('div');
        annotation.buttons.forEach(button => {
            const element = document.createElement('div');
            element.classList.add('draggable');
            element.style.position = 'absolute';
            element.style.pointerEvents = 'none';
            element.style.border = 'none';
            element.style.padding = '0';

            const wratio = (button.width / 100);
            const hratio = (button.height / 100);
            const lratio = ((button.x) / 100);
            const tratio = ((button.y / 100));
            element.setAttribute('data-wpercent', wratio)
            element.setAttribute('data-hpercent', hratio)
            element.setAttribute('data-lpercent', lratio)
            element.setAttribute('data-tpercent', tratio)

            const content = document.createElement('div');
            content.classList.add('draggable-content');
            // element.style.left = ((button.x / 100) * canvasWidth) + 'px';
            // element.style.top = ((button.y / 100) * canvasHeight) + 'px';
            element.style.left = (((button.x + button.draggablepadding) / 100) * canvasWidth) + 'px';
            element.style.top = (((button.y / 100) * canvasHeight) + ((button.draggablepadding / 100) * canvasWidth)) + 'px';
            // element.style.top = (((button.y + button.draggablepadding) / 100) * canvasHeight) + 'px';

            const radioWrapper = document.createElement('div');
            radioWrapper.classList.add('radio-wrapper');
            radioWrapper.style.position = 'absolute';


            radioWrapper.style.width = ((button.width / 100) * canvasWidth) + 'px';
            radioWrapper.style.height = ((button.height / 100) * canvasHeight) + 'px';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = annotation.name;
            radio.value = button.value;
            radio.id = button.id;
            radio.classList.add('input-field');
            radio.style.width = '100%';
            radio.style.height = '100%';
            radio.style.margin = '0';

            radioWrapper.appendChild(radio);
            content.appendChild(radioWrapper);
            element.appendChild(content);
            radiodiv.appendChild(element);
        });
        return radiodiv;
    }
    else if (annotation.type === 'checkbox') {
        const element = document.createElement('div');
        element.classList.add('draggable');
        element.style.position = 'absolute';
        element.style.pointerEvents = 'none';
        element.style.border = 'none';
        element.style.padding = '0';

        const wratio = (annotation.width / 100);
        const hratio = (annotation.height / 100);
        const lratio = ((annotation.x) / 100);
        const tratio = ((annotation.y / 100));
        element.setAttribute('data-wpercent', wratio)
        element.setAttribute('data-hpercent', hratio)
        element.setAttribute('data-lpercent', lratio)
        element.setAttribute('data-tpercent', tratio)

        const content = document.createElement('div');
        content.classList.add('draggable-content');


        // element.style.left = ((annotation.x / 100) * canvasWidth) + 'px';
        // element.style.top = ((annotation.y / 100) * canvasHeight) + 'px';
        element.style.left = (((annotation.x + annotation.draggablepadding) / 100) * canvasWidth) + 'px';
        element.style.top = (((annotation.y / 100) * canvasHeight) + ((annotation.draggablepadding / 100) * canvasWidth)) + 'px';
        // element.style.top = (((annotation.y + annotation.draggablepadding) / 100) * canvasHeight) + 'px';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = annotation.id;
        checkbox.value = annotation.value;
        checkbox.classList.add('input-field');
        checkbox.style.width = annotation.width + 'px';
        checkbox.style.height = annotation.height + 'px';
        checkbox.style.width = ((annotation.width / 100) * canvasWidth) + 'px';
        checkbox.style.height = ((annotation.height / 100) * canvasHeight) + 'px';
        checkbox.style.margin = '8% 8% 8% 12.8%';
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                checkbox.classList.add('checked');
            } else {
                checkbox.classList.remove('checked');
            }
        });

        content.appendChild(checkbox);
        element.appendChild(content);
        return element;
    }
    else if (annotation.type === 'select') {
        const element = document.createElement('div');
        element.classList.add('draggable');
        element.style.position = 'absolute';
        element.style.pointerEvents = 'none';
        element.style.border = 'none';
        element.style.padding = '0';

        const wratio = (annotation.width / 100);
        const hratio = (annotation.height / 100);
        const lratio = ((annotation.x) / 100);
        const tratio = ((annotation.y / 100));
        element.setAttribute('data-wpercent', wratio)
        element.setAttribute('data-hpercent', hratio)
        element.setAttribute('data-lpercent', lratio)
        element.setAttribute('data-tpercent', tratio)

        const content = document.createElement('div');
        content.classList.add('draggable-content');

        // element.style.left = ((annotation.x / 100) * canvasWidth) + 'px';
        // element.style.top = ((annotation.y / 100) * canvasHeight) + 'px';
        element.style.left = (((annotation.x + annotation.draggablepadding) / 100) * canvasWidth) + 'px';
        element.style.top = (((annotation.y / 100) * canvasHeight) + ((annotation.draggablepadding / 100) * canvasWidth)) + 'px';
        // element.style.top = (((annotation.y + annotation.draggablepadding) / 100) * canvasHeight) + 'px';

        const select = document.createElement('select');
        select.id = annotation.id;

        select.style.width = ((annotation.width / 100) * canvasWidth) + 'px';
        select.style.height = ((annotation.height / 100) * canvasHeight) + 'px';
        select.style.fontSize = ((annotation.fontsize / 100) * canvasWidth) + 'px';
        select.style.border = '2px solid black';
        select.classList.add('input-field');

        const option = document.createElement('option');
        option.value = "Select Option";
        option.text = "Select Option";
        select.appendChild(option);

        annotation.options.forEach(optionText => {
            const option = document.createElement('option');
            option.value = optionText;
            option.text = optionText;
            select.appendChild(option);
        });

        select.addEventListener('change', () => {
            console.log(`Selected value: ${select.value}`);
            if (select.value === "Select Option") {
                select.classList.remove('has-value');
            } else {
                select.classList.add('has-value');
            }
        });

        content.appendChild(select);
        element.appendChild(content);
        return element;
    }
    else if (annotation.type === 'date') {
        const element = document.createElement('div');
        element.classList.add('draggable');
        element.style.position = 'absolute';
        element.style.pointerEvents = 'none';
        element.style.border = 'none';
        element.style.padding = '0';

        const wratio = (annotation.width / 100);
        const hratio = (annotation.height / 100);
        const lratio = ((annotation.x) / 100);
        const tratio = ((annotation.y / 100));
        element.setAttribute('data-wpercent', wratio)
        element.setAttribute('data-hpercent', hratio)
        element.setAttribute('data-lpercent', lratio)
        element.setAttribute('data-tpercent', tratio)

        const content = document.createElement('div');
        content.classList.add('draggable-content');

        // element.style.left = ((annotation.x / 100) * canvasWidth) + 'px';
        // element.style.top = ((annotation.y / 100) * canvasHeight) + 'px';
        element.style.left = (((annotation.x + annotation.draggablepadding) / 100) * canvasWidth) + 'px';
        element.style.top = (((annotation.y / 100) * canvasHeight) + ((annotation.draggablepadding / 100) * canvasWidth)) + 'px';
        // element.style.top = (((annotation.y + annotation.draggablepadding) / 100) * canvasHeight) + 'px';

        const input = document.createElement('input');
        input.type = 'date';
        input.placeholder = 'Date Field';
        input.classList.add('input-field');
        input.id = annotation.id;
        input.value = annotation.content;
        input.style.color = '#636161';

        input.style.width = ((annotation.width / 100) * canvasWidth) + 'px';
        input.style.height = ((annotation.height / 100) * canvasHeight) + 'px';
        input.style.fontSize = ((annotation.fontsize / 100) * canvasWidth) + 'px';

        input.addEventListener('input', () => {
            if (input.value) {
                input.classList.add('has-value');
                input.style.color = 'black';
            } else {
                input.classList.remove('has-value');
                input.style.color = '#636161';
            }
        });

        input.addEventListener('blur', () => {
            if (input.value) {
                input.classList.add('has-value');
            } else {
                input.classList.remove('has-value');
            }
        });

        content.appendChild(input);
        element.appendChild(content);
        return element;
    }
    else if (annotation.type === 'plain-text') {
        const element = document.createElement('div');
        element.classList.add('draggable');
        element.style.position = 'absolute';
        element.style.pointerEvents = 'none';
        element.style.border = 'none';
        element.style.padding = '0';

        const wratio = (annotation.width / 100);
        const hratio = (annotation.height / 100);
        const lratio = ((annotation.x) / 100);
        const tratio = ((annotation.y / 100));
        element.setAttribute('data-wpercent', wratio)
        element.setAttribute('data-hpercent', hratio)
        element.setAttribute('data-lpercent', lratio)
        element.setAttribute('data-tpercent', tratio)

        const content = document.createElement('div');
        content.classList.add('draggable-content');

        // element.style.left = ((annotation.x / 100) * canvasWidth) + 'px';
        // element.style.top = ((annotation.y / 100) * canvasHeight) + 'px';
        element.style.left = (((annotation.x + annotation.draggablepadding) / 100) * canvasWidth) + 'px';
        element.style.top = (((annotation.y / 100) * canvasHeight) + ((annotation.draggablepadding / 100) * canvasWidth)) + 'px';
        // element.style.top = (((annotation.y + annotation.draggablepadding) / 100) * canvasHeight) + 'px';

        const editableTextContainer = document.createElement('div');

        // editableTextContainer.classList.add('editable-text');
        // editableTextContainer.setAttribute('contenteditable', 'true');


        editableTextContainer.style.width = ((annotation.width / 100) * canvasWidth) + 'px';
        editableTextContainer.style.height = ((annotation.height / 100) * canvasHeight) + 'px';
        editableTextContainer.style.fontSize = ((annotation.fontsize / 100) * canvasWidth) + 'px';
        editableTextContainer.innerText = annotation.content;

        content.appendChild(editableTextContainer);
        element.appendChild(content);
        return element;
    }
    else if (annotation.type === "Signature") {
        overlaysignflag = true;
        const element = document.createElement('div');
        element.classList.add('draggable');
        element.style.position = 'absolute';
        element.style.pointerEvents = 'none';
        element.style.border = 'none';
        element.style.zIndex = '1000';
        element.style.padding = '0';

        const wratio = (annotation.width / 100);
        const hratio = (annotation.height / 100);
        const lratio = ((annotation.x) / 100);
        const tratio = ((annotation.y / 100));
        element.setAttribute('data-wpercent', wratio)
        element.setAttribute('data-hpercent', hratio)
        element.setAttribute('data-lpercent', lratio)
        element.setAttribute('data-tpercent', tratio)

        const content = document.createElement('div');
        content.classList.add('draggable-content');

        element.style.left = ((annotation.x / 100) * canvasWidth) + 'px';
        element.style.top = ((annotation.y / 100) * canvasHeight) + 'px';
        const input = document.createElement('div');
        input.style.border = "1px solid #44aad1";
        input.id = "Signature";



        input.style.textAlign = 'center';

        input.style.width = ((annotation.width / 100) * canvasWidth) + 'px';
        input.style.height = ((annotation.height / 100) * canvasHeight) + 'px';
        input.textContent = 'Signature' + "_" + annotation.role;

        input.style.backgroundColor = "#d8d7d7";
        input.style.color = "#44aad1";
        input.style.fontSize = "77%";



        content.appendChild(input);

        element.appendChild(content);

        return element;
    }
    else if (annotation.type === 'Eseal') {

        overlayesealflag = true;
        const element = document.createElement('div');
        element.classList.add('draggable');
        element.style.position = 'absolute';
        element.style.pointerEvents = 'none';
        element.style.border = 'none';
        element.style.zIndex = '1000';
        element.style.padding = '0';

        const wratio = (annotation.width / 100);
        const hratio = (annotation.height / 100);
        const lratio = ((annotation.x) / 100);
        const tratio = ((annotation.y / 100));
        element.setAttribute('data-wpercent', wratio)
        element.setAttribute('data-hpercent', hratio)
        element.setAttribute('data-lpercent', lratio)
        element.setAttribute('data-tpercent', tratio)

        const content = document.createElement('div');
        content.classList.add('draggable-content');

        element.style.left = ((annotation.x / 100) * canvasWidth) + 'px';
        element.style.top = ((annotation.y / 100) * canvasHeight) + 'px';

        element.style.padding = '0';
        const input = document.createElement('div');
        input.style.border = "1px solid #44aad1";




        input.style.textAlign = 'center';
        input.style.padding = '30%';
        input.style.width = ((annotation.width / 100) * canvasWidth) + 'px';
        input.style.height = ((annotation.height / 100) * canvasHeight) + 'px';
        input.textContent = 'Eseal' + "_" + annotation.role;

        input.style.backgroundColor = "#d8d7d7";
        input.style.color = "#44aad1";
        input.style.fontSize = "77%";



        input.id = 'Eseal';

        content.appendChild(input);

        element.appendChild(content);

        return element;
    }
    else if (annotation.type === 'imagefield') {
        const element = document.createElement('div');
        element.classList.add('draggable');
        element.style.position = 'absolute';
        element.style.pointerEvents = 'none';
        element.style.border = 'none';
        element.style.zIndex = '1000';
        element.style.padding = '0';

        const wratio = (annotation.width / 100);
        const hratio = (annotation.height / 100);
        const lratio = ((annotation.x) / 100);
        const tratio = ((annotation.y / 100));
        element.setAttribute('data-wpercent', wratio)
        element.setAttribute('data-hpercent', hratio)
        element.setAttribute('data-lpercent', lratio)
        element.setAttribute('data-tpercent', tratio)

        const content = document.createElement('div');
        content.classList.add('draggable-content');

        element.style.left = ((annotation.x / 100) * canvasWidth) + 'px';
        element.style.top = ((annotation.y / 100) * canvasHeight) + 'px';

        element.style.padding = '0';

        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';
        imageContainer.style.width = ((annotation.width / 100) * canvasWidth) + 'px';
        imageContainer.style.height = ((annotation.height / 100) * canvasHeight) + 'px';

        const imageUpload = document.createElement('input');
        imageUpload.setAttribute('type', 'file');
        imageUpload.className = 'image-upload';
        imageUpload.setAttribute('accept', 'image/*');

        const uploadedImage = document.createElement('img');
        uploadedImage.className = 'uploaded-image';
        uploadedImage.setAttribute('alt', 'Uploaded Image');
        uploadedImage.id = annotation.id;

        // Create the placeholder text
        const placeholderText = document.createElement('span');
        placeholderText.className = 'placeholder-text';
        placeholderText.innerText = 'Upload Image';

        // Create the remove button
        const removeImageBtn = document.createElement('button');
        removeImageBtn.className = 'remove-image-btn';
        removeImageBtn.innerHTML = '&times;';

        // Append elements to the image container

        imageContainer.appendChild(imageUpload);
        imageContainer.appendChild(uploadedImage);
        imageContainer.appendChild(placeholderText);
        imageContainer.appendChild(removeImageBtn);
        imageUpload.addEventListener('change', function (event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    uploadedImage.src = e.target.result;
                    uploadedImage.style.display = 'block';

                    placeholderText.style.display = 'none';
                    removeImageBtn.classList.add('uploaded');
                };
                reader.readAsDataURL(file);
            }
        });


        removeImageBtn.addEventListener('click', function () {
            // Hide the image
            uploadedImage.src = '';
            uploadedImage.style.display = 'none';

            // Show the placeholder text again
            placeholderText.style.display = 'block';

            // Hide the remove button
            removeImageBtn.classList.remove('uploaded');

            // Clear the file input value
            imageUpload.value = '';
        });

        content.appendChild(imageContainer);

        element.appendChild(content);

        return element;
    }
}

window.addEventListener('resize', function () {

    const canvWidth = document.querySelector('canvas').getBoundingClientRect().width;
    const canvHeight = document.querySelector('canvas').getBoundingClientRect().height;

    document.querySelectorAll('.pdf-page').forEach((pageElement, pageIndex) => {
        const annotationLayer = pageElement.querySelector('.annotation-layer');



        const matchingElements = annotationLayer.querySelectorAll('.draggable');

        if (matchingElements.length !== 0) {

            matchingElements.forEach(element => {

                const draggableContent = element.querySelector('.draggable-content');
                const firstChild = draggableContent.firstElementChild;
                firstChild.style.width = (canvWidth * parseFloat(element.getAttribute('data-wpercent'))) + 'px';
                firstChild.style.height = (canvHeight * parseFloat(element.getAttribute('data-hpercent'))) + 'px';
                element.style.left = (canvWidth * parseFloat(element.getAttribute('data-lpercent'))) + 'px';
                element.style.top = (canvHeight * parseFloat(element.getAttribute('data-tpercent'))) + 'px';


            });


        }

    });




});