

var userrole = Data[0].Roles.name;

let renderedPages = new Set();
let pdfInstance = null;
const annotationspages = new Set();
let pdfArrayBuffer;



const pdfjsLib = window['pdfjs-dist/build/pdf'];
if (!pdfjsLib) {
    console.error('PDF.js library is not loaded.');
} else {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
}


const pdfContainer = document.getElementById('pdf-container');


document.getElementById('save').addEventListener('click', async function () {
    const btn = this;
    btn.disabled = true;
    try {
        await generateDocument();
    } catch (err) {

    } finally {
        btn.disabled = false;
    }
});
document.getElementById('fill').addEventListener('click', autofill)

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




    pdfArrayBuffer = base64ToArrayBuffer(pdfBase64);
    pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise.then(pdf => {
        pdfInstance = pdf;
        setupPlaceholders(pdf.numPages);
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
    const eagerPages = new Set();

    const allPages = document.querySelectorAll('.pdf-page');

    const intial_pages = Math.min(20, allPages.length);

    // Eagerly render first 20 pages
    for (let i = 1; i <= intial_pages; i++) {
        eagerPages.add(i);
    }

    // Eagerly render pages with annotations
    if (allPages.length > 20) {
        annotations.forEach(a => {
            const p = parseInt(a.page);
            if (!isNaN(p) && p > 20) eagerPages.add(p);
        });
    }

    // Set up IntersectionObserver for lazy loading
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



    // Eagerly render only necessary pages
    eagerPages.forEach(pageNum => {
        const pageDiv = document.querySelector(`.pdf-page[data-page-number="${pageNum}"]`);
        if (pageDiv && !renderedPages.has(pageNum)) {
            renderPage(pageNum, pageDiv, annotations);
            renderedPages.add(pageNum);
        }
    });

    // Observe remaining pages
    allPages.forEach(pageDiv => {
        const pageNum = parseInt(pageDiv.dataset.pageNumber);
        if (!renderedPages.has(pageNum)) {
            observer.observe(pageDiv);
        }
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

            const pageAnnotations = annotations.filter(a => a.page === pageNum);
            pageAnnotations.forEach(annotation => {
                annotationspages.add(pageNum - 1);
                const element = createDraggableElement(annotation);
                if (element) {

                    annotationLayer.appendChild(element);

                }
            });



        });
    });
}

function createDraggableElement(annotation) {
    if (annotation.role === userrole || (annotation.type === 'plain-text')) {
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
            input.setAttribute('mandatory', annotation.isMandatory);
            if (input.value) {
                input.classList.add('has-value');
            }
            if (annotation.content) {

                input.disabled = true;
            }

            input.addEventListener('input', () => {
                if (input.value) {
                    input.classList.add('has-value');
                    input.style.borderColor = 'black'
                } else {
                    input.classList.remove('has-value');
                }
            });

            // input.addEventListener('blur', () => {
            //     if (input.value) {
            //         input.classList.add('has-value');
            //     } else {
            //         input.classList.remove('has-value');
            //     }
            // });

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
                radio.setAttribute('mandatory', annotation.isMandatory);
                radio.value = button.value;
                radio.id = button.id;
                radio.classList.add('input-field');
                radio.style.width = '100%';
                radio.style.height = '100%';
                radio.style.margin = '0';

                radio.addEventListener('change', () => {
                    if (radio.checked) {

                        const regimeRadios = document.querySelectorAll(`input[name="${annotation.name}"]`);
                        Array.from(regimeRadios).forEach(radio => {
                            radio.style.appearance = 'auto';
                            radio.style.borderColor = 'black'
                        });
                    } else {

                    }
                });

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

            checkbox.setAttribute('mandatory', annotation.isMandatory);

            checkbox.value = annotation.value;
            checkbox.classList.add('input-field');
            checkbox.style.width = annotation.width + 'px';
            checkbox.style.height = annotation.height + 'px';
            checkbox.style.width = ((annotation.width / 100) * canvasWidth) + 'px';
            checkbox.style.height = ((annotation.height / 100) * canvasHeight) + 'px';
            checkbox.style.margin = '8% 8% 8% 12.8%';
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    checkbox.style.appearance = 'auto'
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

            select.setAttribute('mandatory', annotation.isMandatory);

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
                    select.style.borderColor = 'black';
                }
            });
            if (annotation.content) {

                select.selectedIndex = annotation.content;
                if (annotation.content != 0) {

                    select.classList.add('has-value');

                }
                select.disabled = true;

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

            input.setAttribute('mandatory', annotation.isMandatory);

            input.value = annotation.content;
            input.style.color = '#636161';
            input.setAttribute('data-flag', annotation.fontcolor);
            input.style.width = ((annotation.width / 100) * canvasWidth) + 'px';
            input.style.height = ((annotation.height / 100) * canvasHeight) + 'px';
            input.style.fontSize = ((annotation.fontsize / 100) * canvasWidth) + 'px';

            if (annotation.content) {
                input.disabled = true;
            }

            input.addEventListener('input', (event) => {
                if (input.value) {
                    input.classList.add('has-value');
                    input.style.color = (event.target).getAttribute('data-flag');
                    input.style.borderColor = 'black';
                    input.style.display = 'flex';
                    input.style.alignItems = 'center';
                    input.style.justifyContent = 'center';



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

            input.textContent = 'Signature';

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

            input.textContent = 'Eseal';

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

            uploadedImage.setAttribute('mandatory', annotation.isMandatory);

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
                        imageContainer.style.borderColor = 'black';

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

                imageUpload.disabled = true;




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


function SignDocument(url, formData) {


    return new Promise(function (resolve, reject) {
        $.ajax({
            url: url,
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            headers: {

                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

            },
            method: 'POST',
            type: 'POST',
            beforeSend: function () {

                if (overlaysignflag && overlayesealflag) {

                    $('#overlay6').css('display', 'flex');



                }

                else if (overlayesealflag) {

                    $('#overlay6').css('display', 'flex');

                }

                else {

                    $('#overlay6').css('display', 'flex');

                }


            },
            complete: function () {
                if (overlaysignflag && overlayesealflag) {

                    $('#overlay6').hide();



                }

                else if (overlayesealflag) {

                    $('#overlay6').hide();

                }

                else {

                    $('#overlay6').hide();

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

function SaveDocument(url, formData) {


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
                $('#overlay').show();
            },
            complete: function () {
                $('#overlay').hide();
            },

            success: function (data) {
                resolve(data)
            },

            error: ajaxErrorHandler
        });
    });
}

async function capturePDFWithAnnotations() {
    const pages = Array.from(document.querySelectorAll('.pdf-page'));
    const images = [];

    for (let i = 0; i < pages.length; i++) {
        if (!annotationspages.has(i)) continue;

        const page = pages[i];
        const pdfCanvas = page.querySelector('canvas');
        if (!pdfCanvas) continue;


        const mergedCanvas = document.createElement('canvas');
        mergedCanvas.width = pdfCanvas.width;
        mergedCanvas.height = pdfCanvas.height;
        const ctx = mergedCanvas.getContext('2d');


        ctx.drawImage(pdfCanvas, 0, 0);


        const annotationContainer = page.querySelector('.annotation-layer');
        if (!annotationContainer) {
            images.push(mergedCanvas.toDataURL('image/png'));
            continue;
        }


        const clonedAnnotations = annotationContainer.cloneNode(true);
        clonedAnnotations.style.background = "transparent";


        const hiddenWrapper = document.createElement('div');
        hiddenWrapper.style.position = 'fixed';
        hiddenWrapper.style.top = '-10000px';
        hiddenWrapper.style.left = '-10000px';
        hiddenWrapper.style.width = page.offsetWidth + 'px';
        hiddenWrapper.style.height = page.offsetHeight + 'px';
        hiddenWrapper.style.background = 'transparent';
        hiddenWrapper.style.opacity = '0';
        hiddenWrapper.style.overflow = 'hidden';
        hiddenWrapper.appendChild(clonedAnnotations);
        document.body.appendChild(hiddenWrapper);

        await document.fonts.ready;


        const scale = pdfCanvas.width / page.offsetWidth;
        const annotationCanvas = await html2canvas(clonedAnnotations, {
            backgroundColor: null,
            useCORS: true,
            scale: scale,
            width: page.offsetWidth,
            height: page.offsetHeight
        });


        ctx.drawImage(annotationCanvas, 0, 0);

        images.push(mergedCanvas.toDataURL('image/png'));
        document.body.removeChild(hiddenWrapper);
    }

    return images;
}




async function createPDFWithImages(replaceSet, imageList) {
    const { PDFDocument } = PDFLib;


    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    const pages = pdfDoc.getPages();

    let imageIndex = 0;

    for (let i = 0; i < pages.length; i++) {
        if (replaceSet.has(i)) {
            const imageDataUrl = imageList[imageIndex];


            let img, isPng = imageDataUrl.startsWith("data:image/png");
            const imageBytes = await fetch(imageDataUrl).then(res => res.arrayBuffer());

            if (isPng) {
                img = await pdfDoc.embedPng(imageBytes);
            } else {
                img = await pdfDoc.embedJpg(imageBytes);
            }

            const { width, height } = pages[i].getSize();


            pages[i].drawRectangle({
                x: 0,
                y: 0,
                width,
                height,
                color: PDFLib.rgb(1, 1, 1),
            });


            pages[i].drawImage(img, {
                x: 0,
                y: 0,
                width,
                height
            });

            imageIndex++;
        }
    }

    const pdfBytes = await pdfDoc.save();



    return pdfBytes;
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
    if (data == "") {
        return swal({
            title: "Info",
            text: "Failed to receive Auto Fill data",
            type: "info",
        });
    }
    var autodata = JSON.parse(data);

    let fieldsFilled = 0;
    let totalAutofillFields = 0;


    if (document.getElementById(`email_${userrole}`)) {
        document.querySelectorAll(`[id="email_${userrole}"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.emailId;
                input.classList.add('has-value');
            }
        });

    }

    if (document.getElementById('x_cst_indv_Doc_type')) {
        document.querySelectorAll('#x_cst_indv_Doc_type').forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.onboardingMethod;
                input.classList.add('has-value');
            }
        });

    }
    if (document.getElementById(`Document Type_${userrole}`)) {
        document.querySelectorAll(`[id="Document Type_${userrole}"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.onboardingMethod;
                input.classList.add('has-value');
            }
        });

    }


    if (document.getElementById(`lastname_${userrole}`)) {
        document.querySelectorAll(`[id="lastname_${userrole}"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.secondaryIdentifier;
                input.classList.add('has-value');
            }
        });

    }

    if (document.getElementById(`firstname_${userrole}`)) {
        document.querySelectorAll(`[id="firstname_${userrole}"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.primaryIdentifier;
                input.classList.add('has-value');
            }
        });

    }

    if (document.getElementById('phone_sanitized')) {
        document.querySelectorAll('#phone_sanitized').forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.mobileNo;
                input.classList.add('has-value');
            }
        });

    }

    if (document.getElementById(`Phone Number_${userrole}`)) {
        document.querySelectorAll(`[id="Phone Number_${userrole}"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.mobileNo;
                input.classList.add('has-value');
            }
        });

    }


    if (document.getElementById('x_cst_indv_Doc_value')) {
        document.querySelectorAll('#x_cst_indv_Doc_value').forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.documentNumber;
                input.classList.add('has-value');
            }
        });
    }

    if (document.getElementById(`Document Number_${userrole}`)) {
        document.querySelectorAll(`[id="Document Number_${userrole}"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.documentNumber;
                input.classList.add('has-value');
            }
        });
    }

    if (document.getElementById(`Full Name_${userrole}`)) {
        document.querySelectorAll(`[id="Full Name_${userrole}"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.primaryIdentifier + " " + autodata.subscriberData.secondaryIdentifier;
                input.classList.add('has-value');
            }
        });
    }

    if (document.getElementById(`name_${userrole}`)) {
        document.querySelectorAll(`[id="name_${userrole}"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.primaryIdentifier + " " + autodata.subscriberData.secondaryIdentifier;
                input.classList.add('has-value');
            }
        });
    }


    if (document.getElementById(`Gender_${userrole}`)) {
        document.querySelectorAll(`[id="Gender_${userrole}"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.gender;
                input.classList.add('has-value');
            }
        });
    }

    if (document.getElementById('x_cst_indv_sex')) {
        document.querySelectorAll('#x_cst_indv_sex').forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.gender;
                input.classList.add('has-value');
            }
        });
    }


    if (document.getElementById(`Nation_${userrole}`)) {
        document.querySelectorAll(`[id="Nation_${userrole}"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.nationality;
                input.classList.add('has-value');
            }
        });
    }

    if (document.getElementById(`Date of Birth_${userrole}`)) {
        document.querySelectorAll(`[id="Date of Birth_${userrole}"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.dateOfBirth.split(' ')[0];
                input.classList.add('has-value');
            } else if (input.type === "date" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.dateOfBirth.split(' ')[0];
                input.classList.add('has-value');
                input.style.color = input.getAttribute('data-flag');
            }
        });
    }

    if (document.getElementById('birthdate')) {
        document.querySelectorAll('#birthdate').forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.dateOfBirth.split(' ')[0];
                input.classList.add('has-value');
            } else if (input.type === "date" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.dateOfBirth.split(' ')[0];
                input.classList.add('has-value');
                input.style.color = input.getAttribute('data-flag');
            }
        });
    }


    if (document.getElementById(`Selfie_${userrole}`)) {
        document.querySelectorAll(`[id="Selfie_${userrole}"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.tagName.toLowerCase() === 'img' && input.src.trim() === "") {
                fieldsFilled += 1;
                input.setAttribute('src', 'data:image/jpeg;base64,' + autodata.subscriberData.subscriberSelfie);
                input.style.display = 'block';
                if (input.nextElementSibling) {
                    input.nextElementSibling.style.display = 'none';
                }
            }
        });
    }
    if (totalAutofillFields === 0) {

        swal({
            title: "Info",
            text: "No Fields available to Auto Fill",
            type: "info",
        });

    }
    else if (fieldsFilled > 0) {
        swal({
            title: "Info",
            text: "Auto Fill Fields filled successfully",
            type: "success",
        });

    }
    else {
        swal({
            title: "Info",
            text: "Auto Fill not applied as fields are already filled",
            type: "info",
        });
    }
}

async function generateDocument() {
    var canSave = true;
    document.querySelectorAll('.draggable .input-field').forEach(input => {
        if (input.type === 'text' && input.getAttribute('mandatory') == "true") {
            if ((input.value).trim() === "") {
                canSave = false;
                input.style.borderColor = 'red'


            }
        }
        else if (input.type === 'checkbox' && input.getAttribute('mandatory') == "true") {
            if (!input.checked) {
                canSave = false;
                input.style.appearance = 'none'
                input.style.borderColor = 'red'

            }
        }
        else if (input.tagName.toLowerCase() === 'select' && input.getAttribute('mandatory') == "true") {
            if (input.selectedIndex === 0) {
                canSave = false;
                input.style.borderColor = 'red'
            }
        }
        else if (input.type === 'date' && input.getAttribute('mandatory') == "true") {
            if (input.value === '') {
                canSave = false;
                input.style.borderColor = 'red'
            }
        }
        else if (input.type === 'radio' && input.getAttribute('mandatory') == "true") {
            const regimeRadios = document.querySelectorAll(`input[name="${input.name}"]`);

            const isAnySelected = Array.from(regimeRadios).some(radio => radio.checked);

            if (!isAnySelected) {
                canSave = false;

                Array.from(regimeRadios).forEach(radio => {
                    radio.style.appearance = 'none'
                    radio.style.borderColor = 'red'
                    radio.style.borderRadius = '8px'
                });
            }
        }

    });
    document.querySelectorAll('.uploaded-image').forEach(imgdiv => {
        if (imgdiv.getAttribute('mandatory') == "true") {
            if (imgdiv.src.trim() == '') {
                canSave = false;
                (imgdiv.parentElement).style.borderColor = 'red'
            }
        }

    });



    if (canSave) {


        var fileFormData = new FormData();
        var userData = JSON.parse(document.getElementById('userdata').value);
        var roleAnnotations = {};
        var signingOrder = {};
        var roleMap = [{}];

        Data.forEach((role, index) => {
            roleId = (role._id);
            signingOrder[roleId] = index + 1;
            roleAnnotations[roleId] = {
                "placeHolderCoordinates": role.PlaceHolderCoordinates,
                "esealplaceHolderCoordinates": role.EsealPlaceHolderCoordinates,
                "qrPlaceHolderCoordinates": { "imgHeight": null, "imgWidth": null, "signatureYaxis": null, "signatureXaxis": null, "pageNumber": null }
            }
            if (index == 0) {
                roleMap[0][roleId] = {
                    "email": userData.Email,
                    "suid": userData.Suid,
                    "accountType": userData.AccountType,
                    "RoleName": role.Roles.name,
                    "orgUid": userData.OrganizationId,
                    "orgName": userData.OrganizationName,
                    "delegationid": role.Roles.delegationId

                }
            } else {

                if (role.Roles.organizationId && role.Roles.organizationId.trim() !== '') {
                    roleMap[0][roleId] = {
                        "email": role.Roles.email,
                        "suid": role.Roles.suid,
                        "accountType": "organization",
                        "RoleName": role.Roles.name,
                        "orgUid": role.Roles.organizationId,
                        "orgName": role.Roles.organizationName,
                        "delegationid": role.Roles.delegationId

                    }
                } else {

                    roleMap[0][roleId] = {
                        "email": role.Roles.email,
                        "suid": role.Roles.suid,
                        "accountType": "self",
                        "RoleName": role.Roles.name,
                        "orgUid": role.Roles.organizationId,
                        "orgName": role.Roles.organizationName,
                        "delegationid": role.Roles.delegationId

                    }
                }


            }


        });

        fileFormData.append("sequentialSigning", false);
        fileFormData.append("documentName", docFileName);
        fileFormData.append("RequestType", "Publish");
        fileFormData.append("TemplateType", "PDF");
        fileFormData.append("daysToComplete", Daystocomplete);
        fileFormData.append("preFilledData", JSON.stringify(""));
        fileFormData.append("htmlSchema", document.getElementById('pdfschema').value);
        fileFormData.append("pdfSchema", document.getElementById('oiginialpdfschema').value);
        fileFormData.append("formId", tempid);

        fileFormData.append("roleMappings", JSON.stringify(roleMap));
        fileFormData.append("RoleAnnotations", JSON.stringify(roleAnnotations));
        fileFormData.append("roleSigningOrder", JSON.stringify(signingOrder));

        SaveDocument(SavePublishedUrl, fileFormData)
            .then((response) => {

                if (response.status == "Success") {
                    var documentdata = response.message;
                    console.log(documentdata[0]._id)

                    saveAnnotations(documentdata[0]._id);
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
                            }
                            else {
                                window.location.href = OrgindexUrl;
                            }
                        }
                    });

                }

            })


    }

    else {
        swal({
            title: "Fields are empty",
            text: "Please fill all Mandatory fields",
            type: "info",
        });
    }
}


async function saveAnnotations(docId) {

    const annotations = {};
    const radioGroups = {};
    // const data = document.getElementById('autodata').value;
    // var autodata = JSON.parse(data);
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
    // if ("@Model.filename" === "SOCIAL BENEFICIARY FORM.pdf") {
    //     annotations.x_cst_indv_suid = autodata.suID;
    //     annotations.x_cst_indv_Doc_type = autodata.subscriberData.documentType;
    // }

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
            $('#overlay').show();
            const pdfData = await capturePDFWithAnnotations();
            const pdfBytes = await createPDFWithImages(annotationspages, pdfData);
            blob = new Blob([pdfBytes], { type: 'application/pdf' });
            $('#overlay').hide();

        }

    }
    else {
        $('#overlay').show();
        const pdfData = await capturePDFWithAnnotations();
        const pdfBytes = await createPDFWithImages(annotationspages, pdfData);
        blob = new Blob([pdfBytes], { type: 'application/pdf' });
        $('#overlay').hide();
    }


    var fileFormData = new FormData();
    fileFormData.append("File", blob, docFileName);
    fileFormData.append("FormId", tempid);
    fileFormData.append("FormFieldData", json);
    fileFormData.append("isEsealPresent", isesealpresent);
    fileFormData.append('DocumentId', docId);

    SignDocument(SaveandSignUrl, fileFormData)
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
                            window.location.href = OrgindexUrl;
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
                            window.location.href = OrgindexUrl;
                        }

                    }
                });

            }

        })


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
