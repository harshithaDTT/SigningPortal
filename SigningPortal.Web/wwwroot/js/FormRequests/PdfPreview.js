
var secondsign = "";
const pdfjsLib = window['pdfjs-dist/build/pdf'];
if (!pdfjsLib) {
    console.error('PDF.js library is not loaded.');
} else {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
}


const pdfContainer = document.getElementById('pdf-container');

let renderedPages = new Set();
let pdfInstance = null;


let uploadedTemplate = null;
let canvasHeight = "";
let canvasWidth = "";
var originalHeight = "";
var originalWidth = "";
var overlaysignflag = false;

var overlayesealflag = false;

var isannotationspresent = true;

$(document).ready(function () {
    $('#networkOverlay').hide();
    const pdfBase64 = document.getElementById('filebase64').value;

    const components = document.getElementById('pdfschema').value;

    if (status1 === "In Progress") {
        secondsign = document.getElementById('filebase64').value;
    }




    const pdfArrayBuffer = base64ToArrayBuffer(pdfBase64);
    pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise.then(async pdf => {
        pdfInstance = pdf;
        await setupPlaceholders(pdf.numPages);
        setupLazyObserver(JSON.parse(components));
    }).catch(error => {
        console.error('Error loading PDF:', error);
    });
});

function base64ToBlob(base64, contentType = 'application/pdf') {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);


    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }


    const byteArray = new Uint8Array(byteNumbers);


    return new Blob([byteArray], { type: contentType });
}


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
    if (annotation.role === userrole || (annotation.type === 'plain-text' && status1 === "New") || flag1 === "previewsend") {
        if (annotation.type === 'text') {
            isannotationspresent = false;
            const element = document.createElement('div');
            element.classList.add('draggable');
            element.style.position = 'absolute';
            element.style.pointerEvents = 'auto';
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
            input.style.color = annotation.fontcolor;
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
            isannotationspresent = false;
            const radiodiv = document.createElement('div');
            annotation.buttons.forEach(button => {
                const element = document.createElement('div');
                element.classList.add('draggable');
                element.style.position = 'absolute';
                element.style.pointerEvents = 'auto';
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
            isannotationspresent = false;
            const element = document.createElement('div');
            element.classList.add('draggable');
            element.style.position = 'absolute';
            element.style.pointerEvents = 'auto';
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
            isannotationspresent = false;
            const element = document.createElement('div');
            element.classList.add('draggable');
            element.style.position = 'absolute';
            element.style.pointerEvents = 'auto';
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
            option.style.color = '#636161';
            select.appendChild(option);

            annotation.options.forEach(optionText => {
                const option = document.createElement('option');
                option.value = optionText;
                option.text = optionText;
                option.style.color = annotation.fontcolor;
                select.appendChild(option);
            });

            select.addEventListener('change', (event) => {

                if (select.value === "Select Option") {
                    select.classList.remove('has-value');
                    select.style.color = '#636161';
                    Array.from(event.target.options).map(option => {
                        option.style.color = ((event.target.options)[1]).style.color;
                        return null;
                    });
                    (select.options[0]).style.color = '#636161';
                } else {
                    select.classList.add('has-value');
                    select.style.color = ((event.target.options)[1]).style.color;
                    (select.options[0]).style.color = '#636161';
                }
            });
            if (annotation.content) {

                select.selectedIndex = annotation.content;
                if (annotation.content != 0) {

                    select.classList.add('has-value');

                }

            }


            content.appendChild(select);
            element.appendChild(content);
            return element;
        }
        else if (annotation.type === 'date') {
            isannotationspresent = false;
            const element = document.createElement('div');
            element.classList.add('draggable');
            element.style.position = 'absolute';
            element.style.pointerEvents = 'auto';
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
            input.setAttribute('data-flag', annotation.fontcolor);
            input.style.width = ((annotation.width / 100) * canvasWidth) + 'px';
            input.style.height = ((annotation.height / 100) * canvasHeight) + 'px';
            input.style.fontSize = ((annotation.fontsize / 100) * canvasWidth) + 'px';

            input.addEventListener('input', (event) => {
                if (input.value) {
                    input.classList.add('has-value');
                    input.style.color = (event.target).getAttribute('data-flag');


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
            if (input.value) {
                input.classList.add('has-value');
            }

            content.appendChild(input);
            element.appendChild(content);
            return element;
        }
        else if (annotation.type === 'plain-text') {
            const element = document.createElement('div');
            element.classList.add('draggable');
            element.style.position = 'absolute';
            element.style.pointerEvents = 'auto';
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
            editableTextContainer.style.color = annotation.fontcolor;
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
            element.style.pointerEvents = 'auto';
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

            input.style.backgroundColor = "#d8d7d78a";
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
            element.style.pointerEvents = 'auto';
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

            input.style.backgroundColor = "#d8d7d78a";
            input.style.color = "#44aad1";
            input.style.fontSize = "77%";



            input.id = 'Eseal';

            content.appendChild(input);

            element.appendChild(content);

            return element;
        }
        else if (annotation.type === 'Wsave') {
            const element = document.createElement('div');
            element.classList.add('draggable');
            element.style.position = 'absolute';
            element.style.pointerEvents = 'auto';
            element.style.border = 'none';
            element.style.zIndex = '1000';
            element.style.padding = '0';

            const content = document.createElement('div');
            content.classList.add('draggable-content');

            element.style.left = ((annotation.x / 100) * canvasWidth) + 'px';
            element.style.top = ((annotation.y / 100) * canvasHeight) + 'px';

            element.style.padding = '0';

            var submitbutton = document.createElement("button");
            submitbutton.textContent = "Submit";
            submitbutton.id = "Wsave";
            submitbutton.style.textAlign = 'center';

            submitbutton.style.width = ((annotation.width / 100) * canvasWidth) + 'px';
            submitbutton.style.height = ((annotation.height / 100) * canvasHeight) + 'px';
            submitbutton.style.color = "white";
            submitbutton.style.backgroundColor = 'rgb(37 66 95)';
            submitbutton.style.borderRadius = '5px';
            submitbutton.style.fontSize = "77%";
            submitbutton.onclick = function () {
                saveAnnotations();
            };
            content.appendChild(submitbutton);

            element.appendChild(content);

            return element;
        }
        else if (annotation.type === 'Wfill') {
            const element = document.createElement('div');
            element.classList.add('draggable');
            element.style.position = 'absolute';
            element.style.pointerEvents = 'auto';
            element.style.border = 'none';
            element.style.zIndex = '1000';
            element.style.padding = '0';

            const content = document.createElement('div');
            content.classList.add('draggable-content');

            element.style.left = ((annotation.x / 100) * canvasWidth) + 'px';
            element.style.top = ((annotation.y / 100) * canvasHeight) + 'px';

            element.style.padding = '0';

            var fillbutton = document.createElement("button");
            fillbutton.textContent = "Auto Fill";
            fillbutton.id = "Wfill";
            fillbutton.style.textAlign = 'center';

            fillbutton.style.width = ((annotation.width / 100) * canvasWidth) + 'px';
            fillbutton.style.height = ((annotation.height / 100) * canvasHeight) + 'px';
            fillbutton.style.color = "white";
            fillbutton.style.backgroundColor = 'rgb(37 66 95)';
            fillbutton.style.borderRadius = '5px';
            fillbutton.style.fontSize = "77%";
            fillbutton.onclick = function () {
                autofill();
            };
            content.appendChild(fillbutton);

            element.appendChild(content);

            return element;
        }

        else if (annotation.type === 'imagefield') {
            isannotationspresent = false;
            const element = document.createElement('div');
            element.classList.add('draggable');
            element.style.position = 'absolute';
            element.style.pointerEvents = 'auto';
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
            if (annotation.content) {

                uploadedImage.src = annotation.content;
                uploadedImage.style.display = 'block';

                placeholderText.style.display = 'none';

                removeImageBtn.style.display = 'none';


            }


            content.appendChild(imageContainer);

            element.appendChild(content);

            return element;
        }
    }
}

function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${year}-${month}-${day}`;
}

async function saveAnnotations() {

    const annotations = {};
    const radioGroups = {};
    const data = document.getElementById('autodata').value;
    var autodata = JSON.parse(data);
    var canvases = document.querySelectorAll('canvas');
    var isesealpresent = false;
    canvases.forEach(canvas => {

        canvas.style.width = document.getElementsByClassName('pdf-page')[0].clientWidth + 'px';

    });

    console.log(document.getElementsByTagName('canvas')[0].style.width);

    document.querySelectorAll('.draggable .input-field').forEach(input => {
        if (input.type === 'text') {
            annotations[input.id] = input.value;

            const textElement = document.createElement('div');
            textElement.textContent = input.value;
            textElement.style.fontSize = input.style.fontSize;
            textElement.style.color = 'black';
            textElement.style.border = input.style.border;
            input.style.display = 'none';

            input.parentNode.insertBefore(textElement, input);

        } else if (input.type === 'radio') {
            if (!radioGroups[input.name]) {
                radioGroups[input.name] = [];
            }
            radioGroups[input.name].push({
                value: input.value,
                checked: input.checked
            });
        }
        else if (input.type === 'checkbox') {
            annotations[input.id] = input.checked;
        }
        else if (input.tagName.toLowerCase() === 'select') {
            const selectedValue = input.value;
            input.style.border = 'none';
            const textElement = document.createElement('div');
            textElement.textContent = selectedValue;
            textElement.style.fontSize = input.style.fontSize;
            textElement.style.color = 'black';

            input.style.display = 'none';

            input.parentNode.insertBefore(textElement, input);
            annotations[input.id] = selectedValue !== 'Select Option' ? selectedValue : '';
        }
        else if (input.type === 'date') {



            const textElement = document.createElement('div');
            if (input.value) {
                annotations[input.id] = formatDate(input.value);
                textElement.textContent = formatDate(input.value);
            }
            else {
                annotations[input.id] = "";
                textElement.textContent = "";
            }
            textElement.style.fontSize = input.style.fontSize;
            textElement.style.color = 'black';
            textElement.style.border = input.style.border;
            input.style.display = 'none';

            input.parentNode.insertBefore(textElement, input);
        }
    });

    for (const groupName in radioGroups) {
        const selectedRadio = radioGroups[groupName].find(radio => radio.checked);
        annotations[groupName] = selectedRadio ? selectedRadio.value : '';
    }
    // if docConfig name is spp then add suid key and logged in suid
    if (docFileName === "SOCIAL BENEFICIARY FORM.pdf") {
        annotations.x_cst_indv_suid = autodata.suID;
        annotations.x_cst_indv_Doc_type = autodata.subscriberData.documentType;
    }

    console.log(annotations);
    const json = JSON.stringify(annotations, null, 2);
    console.log("result")
    console.log(typeof json)
    if (document.getElementById("Signature")) {
        const sigannot = document.getElementById("Signature");
        sigannot.parentNode.removeChild(sigannot);
    }
    if (document.getElementById("Eseal")) {
        isesealpresent = true;
        const esealannot = document.getElementById("Eseal");
        esealannot.parentNode.removeChild(esealannot);
    }
    if (document.getElementById("Wsave")) {
        const saveannot = document.getElementById("Wsave");
        saveannot.remove();
    }
    if (document.getElementById("Wfill")) {
        const fillannot = document.getElementById("Wfill");
        fillannot.remove();
    }

    var blob;

    if (secondsign !== "") {


        if (isannotationspresent) {
            blob = await base64ToBlob(secondsign)
        }
        else {
            const pdfData = await capturePDFWithAnnotations();
            const pdfBytes = await createPDFWithImages(pdfData);
            blob = new Blob([pdfBytes], { type: 'application/pdf' });

        }

    }
    else {
        const pdfData = await capturePDFWithAnnotations();
        const pdfBytes = await createPDFWithImages(pdfData);
        blob = new Blob([pdfBytes], { type: 'application/pdf' });
    }


    var fileFormData = new FormData();
    fileFormData.append("File", blob, docFileName);
    fileFormData.append("FormId", tempid);
    fileFormData.append("FormFieldData", json);
    fileFormData.append("isEsealPresent", isesealpresent);
    fileFormData.append('DocumentId', DocumentId);

    SaveDocument(SaveandSignUrl, fileFormData)
        .then((response) => {

            if (response.status == "Success") {
                swal({
                    title: "Success",
                    text: response.message,
                    type: "success",
                }, function (isConfirm) {
                    if (isConfirm) {
                        document.getElementById("navigationNetworkOverlay").style.display = "block";
                        if (loggedAccountType.toLowerCase() === 'self') {
                            window.location.href = GlobalindexUrl;
                        } else {
                            window.location.href = FormRequestsReceivedUrl;
                        }

                    }
                });
            }
            else {
                swal({
                    title: "Error",
                    text: response.message,
                    type: "error",
                }, function (isConfirm) {
                    if (isConfirm) {
                        document.getElementById("navigationNetworkOverlay").style.display = "block";
                        if (loggedAccountType.toLowerCase() === 'self') {
                            window.location.href = GlobalindexUrl;
                        } else {
                            window.location.href = FormRequestsReceivedUrl;
                        }

                    }
                });

            }

        })


}

function SaveDocument(url, formData) {

    console.log($)
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: url,
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            method: 'POST',
            type: 'POST',
            beforeSend: function () {

                if (overlaysignflag && overlayesealflag) {

                    $('#overlay7').css('display', 'flex');



                }

                else if (overlayesealflag) {

                    $('#overlay6').css('display', 'flex');

                }

                else {

                    $('#overlay8').css('display', 'flex');

                }


            },
            complete: function () {
                if (overlaysignflag && overlayesealflag) {

                    $('#overlay7').hide();



                }

                else if (overlayesealflag) {

                    $('#overlay6').hide();

                }

                else {

                    $('#overlay8').hide();

                }
            },
            success: function (data) {
                resolve(data)
            },
            // error: function (err) {
            //     reject(err)
            // }
            error: ajaxErrorHandler
        });
    });
}

async function capturePDFWithAnnotations() {
    const scale = window.devicePixelRatio;
    const pages = Array.from(document.querySelectorAll('.pdf-page'));
    const images = await Promise.all(
        pages.map(async (page) => {
            const canvas = await html2canvas(page, {
                scale: scale,
                useCORS: true
            });
            return canvas.toDataURL('image/png');
        })
    );
    return images;
}

async function createPDFWithImages(images) {
    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.create();
    for (const image of images) {

        const img = await pdfDoc.embedPng(image);
        var { width, height } = img.scale(1);
        width = originalWidth
        height = originalHeight
        const page = pdfDoc.addPage([width, height]);

        page.drawImage(img, {
            x: 0,
            y: 0,
            width,
            height
        });
    }
    return pdfDoc.save();
}



function downloadPDF(pdfBytes) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const element = document.createElement('a');
    element.href = url;
    element.download = 'annotated.pdf';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function autofill() {

    const data = document.getElementById('autodata').value;
    var autodata = JSON.parse(data);

    console.log(autodata.subscriberData);
    if (document.getElementById(`#email_${userrole}`)) {
        if (document.getElementById(`#email_${userrole}`).type === "text") {
            document.getElementById(`#email_${userrole}`).value = autodata.emailId;
            document.getElementById(`#email_${userrole}`).classList.add('has-value');
        }
    }

    if (document.getElementById('x_cst_indv_Doc_type')) {
        if (document.getElementById('x_cst_indv_Doc_type').type === "text") {
            document.getElementById('x_cst_indv_Doc_type').value = autodata.onboardingMethod;
            document.getElementById('x_cst_indv_Doc_type').classList.add('has-value');
        }
    }

    if (document.getElementById('phone_sanitized')) {
        if (document.getElementById('phone_sanitized').type === "text") {
            document.getElementById('phone_sanitized').value = autodata.mobileNo;
            document.getElementById('phone_sanitized').classList.add('has-value');
        }
    }

    if (document.getElementById(`Phone Number_${userrole}`)) {
        if (document.getElementById(`Phone Number_${userrole}`).type === "text") {
            document.getElementById(`Phone Number_${userrole}`).value = autodata.mobileNo;
            document.getElementById(`Phone Number_${userrole}`).classList.add('has-value');
        }
    }

    if (document.getElementById('x_cst_indv_Doc_value')) {
        if (document.getElementById('x_cst_indv_Doc_value').type === "text") {
            document.getElementById('x_cst_indv_Doc_value').value = autodata.subscriberData.documentNumber;
            document.getElementById('x_cst_indv_Doc_value').classList.add('has-value');
        }
    }


    if (document.getElementById(`Full Name_${userrole}`)) {
        if (document.getElementById(`Full Name_${userrole}`).type === "text") {
            document.getElementById(`Full Name_${userrole}`).value = autodata.subscriberData.primaryIdentifier + " " + autodata.subscriberData.secondaryIdentifier;
            document.getElementById(`Full Name_${userrole}`).classList.add('has-value');
        }
    }

    if (document.getElementById('name')) {
        if (document.getElementById('name').type === "text") {
            document.getElementById('name').value = autodata.subscriberData.primaryIdentifier + " " + autodata.subscriberData.secondaryIdentifier;
            document.getElementById('name').classList.add('has-value');
        }
    }


    if (document.getElementById(`Gender_${userrole}`)) {
        if (document.getElementById(`Gender_${userrole}`).type === "text") {
            document.getElementById(`Gender_${userrole}`).value = autodata.subscriberData.gender;
            document.getElementById(`Gender_${userrole}`).classList.add('has-value');
        }
    }

    if (document.getElementById('x_cst_indv_sex')) {
        if (document.getElementById('x_cst_indv_sex').type === "text") {
            document.getElementById('x_cst_indv_sex').value = autodata.subscriberData.gender;
            document.getElementById('x_cst_indv_sex').classList.add('has-value');
        }
    }


    if (document.getElementById(`Nation_${userrole}`)) {
        if (document.getElementById(`Nation_${userrole}`).type === "text") {
            document.getElementById(`Nation_${userrole}`).value = autodata.subscriberData.nationality;
            document.getElementById(`Nation_${userrole}`).classList.add('has-value');
        }
    }
    if (document.getElementById(`Date of Birth_${userrole}`)) {
        if (document.getElementById(`Date of Birth_${userrole}`).type === "text") {
            document.getElementById(`Date of Birth_${userrole}`).value = autodata.subscriberData.dateOfBirth.split(' ')[0];
            document.getElementById(`Date of Birth_${userrole}`).classList.add('has-value');

        } else if (document.getElementById(`Date of Birth_${userrole}`).type === "date") {
            document.getElementById(`Date of Birth_${userrole}`).value = autodata.subscriberData.dateOfBirth.split(' ')[0];


            document.getElementById(`Date of Birth_${userrole}`).classList.add('has-value');
            document.getElementById(`Date of Birth_${userrole}`).style.color = document.getElementById('Date of Birth').getAttribute('data-flag');
        }
    }

    if (document.getElementById('birthdate')) {
        if (document.getElementById('birthdate').type === "text") {
            document.getElementById('birthdate').value = autodata.subscriberData.dateOfBirth.split(' ')[0];
            document.getElementById('birthdate').classList.add('has-value');

        }

        else if (document.getElementById('birthdate').type === "date") {
            document.getElementById('birthdate').value = autodata.subscriberData.dateOfBirth.split(' ')[0];


            document.getElementById('birthdate').classList.add('has-value');
            document.getElementById('birthdate').style.color = document.getElementById('Date of Birth').getAttribute('data-flag');
        }
    }


    if (document.getElementById(`Selfie_${userrole}`)) {
        if (document.getElementById(`Selfie_${userrole}`).tagName.toLowerCase() === 'img') {
            document.getElementById(`Selfie_${userrole}`).setAttribute('src', 'data:image/jpeg;base64,' + autodata.subscriberData.subscriberSelfie);
            document.getElementById(`Selfie_${userrole}`).style.display = 'block';
            (document.getElementById(`Selfie_${userrole}`).nextElementSibling).style.display = 'none';
        }
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