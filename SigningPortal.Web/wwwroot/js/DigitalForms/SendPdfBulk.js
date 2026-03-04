var fieldnameslist = [];
const preFilledData = {};
var pdfAnnotations = [];
var annotations = [];
var scaleX = "";
var scaleY = "";
var signatureX = "";
var signatureY = "";
var signaturePage = "";
var esealX = "";
var esealY = "";
var esealPage = "";
let canvasHeight = "";
let canvasWidth = "";
var originalHeight = "";
var originalWidth = "";
var radioGroups = {};
var numberOfRoles;

let renderedPages = new Set();
let pdfInstance = null;

var Cordinates = { "imgHeight": "", "imgWidth": "", "signatureYaxis": "", "signatureXaxis": "", "pageNumber": "" }
var signCoordinates = {
    "esealplaceHolderCoordinates": JSON.parse(JSON.stringify(Cordinates)),
    "placeHolderCoordinates": JSON.parse(JSON.stringify(Cordinates)),
    "qrPlaceHolderCoordinates": JSON.parse(JSON.stringify(Cordinates)),
}
var listCoordinates = [];


function confirmCheck(checkbox) {
    if (!checkbox.checked) { // User tries to uncheck
        swal({
            icon: 'info',
            title: 'Action not allowed',
            text: 'Forms do not permit signing roles in an unordered sequence.',

        });
        return false;
    }
    return true; // Allow checking (if unchecked previously)
}


const pdfjsLib = window['pdfjs-dist/build/pdf'];
if (!pdfjsLib) {
    console.error('PDF.js library is not loaded.');
} else {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
}
const pdfContainer = document.getElementById('pdf-container');

var data = document.getElementById('pdfschema').value;
var componentsdata = JSON.parse(data);

$(document).ready(function () {


    $('#networkOverlay').hide();
    // $('#digitalforms').addClass('active');


    const tempname = document.getElementById('docName')

    if (tempname) {

        tempname.addEventListener('keydown', (event) => {

            const allowedKeys = [
                'Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                'Delete', ' ', // Include space character explicitly
            ];

            const isLetterOrNumber = /^[a-zA-Z0-9]$/.test(event.key);

            if (!isLetterOrNumber && !allowedKeys.includes(event.key)) {
                event.preventDefault();

            } else {

            }
        });

    }

    $("li#FormsModel a:first").attr('aria-expanded', 'true');
    $("li#FormTemplatesMenu a:first").attr('aria-expanded', 'true');
    const pdfBase64 = document.getElementById('filebase64').value;

    const comps = document.getElementById('pdfschema').value;
    const components = JSON.parse(comps);
    const pdfArrayBuffer = base64ToArrayBuffer(pdfBase64);
    pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise.then(pdf => {
        pdfInstance = pdf;
        setupPlaceholders(pdf.numPages);
        setupLazyObserver(components);
    }).catch(error => {
        console.error('Error loading PDF:', error);

    });



    createRolesGroup();
    // fieldConfig(components);


    $('#sequentialSign').on('click', function () {
        return confirmCheck(this);
    });

    $('#addSignatoriesBtn').on('click', function () {
        addSignatories();
    });

    $("#plain-text").on("click", function () {
        onClick("plain-text");
    });

    $("#text-field").on("click", function () {
        onClick("text-field");
    });

    $("#radio-button").on("click", function () {
        onClick("radio-button");
    });

    $("#check-box").on("click", function () {
        onClick("check-box");
    });

    $("#select").on("click", function () {
        onClick("select");
    });

    $("#date").on("click", function () {
        onClick("date");
    });

    $("#imagefield").on("click", function () {
        onClick("imagefield");
    });

    $('#signDays').on('input', function (event) {
        validateInput(event);
    });

});

function loadTemplate() {
    const pdfBase64 = document.getElementById('filebase64').value;


    const pdfArrayBuffer = base64ToArrayBuffer(pdfBase64);

    pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise.then(pdf => {
        pdfInstance = pdf; // Use the same pdfInstance
        renderedPages.clear();
        setupPlaceholders(pdf.numPages);
        setupLazyObserver(componentsdata);
    }).catch(error => {
        console.error('Error loading PDF:', error);

    });

    const rightCol = document.getElementById('pdfContainerMain');
    var loader = document.getElementById('pdfloader');
    rightCol.removeChild(loader);
    document.getElementById('sendButton').disabled = false;
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
        placeholder.style.minHeight = '450px'; // approximate
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



    eagerPages.forEach(pageNum => {
        const pageDiv = document.querySelector(`.pdf-page[data-page-number="${pageNum}"]`);
        if (pageDiv && !renderedPages.has(pageNum)) {
            renderPage(pageNum, pageDiv, annotations);
            renderedPages.add(pageNum);
        }
    });

    // Observe only non-rendered pages
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
                const element = createPreviousDraggableElement(annotation);
                if (annotation.type === 'radio') {
                    element.forEach(ele => annotationLayer.appendChild(ele));
                } else {
                    annotationLayer.appendChild(element);
                }
            });



        });
    });
}

function createPreviousDraggableElement(annotation) {
    if (annotation.type === 'text') {
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
        input.placeholder = 'Please Enter ' + annotation.id.split('_')[0];
        input.setAttribute("role", annotation.role);
        input.classList.add('input-field');
        input.id = annotation.id;
        fieldnameslist.push(annotation.id);
        input.value = annotation.content;
        input.style.width = ((annotation.width / 100) * canvasWidth) + 'px';
        input.style.height = ((annotation.height / 100) * canvasHeight) + 'px';
        input.style.fontSize = ((annotation.fontsize / 100) * canvasWidth) + 'px';
        input.style.color = annotation.fontcolor;

        input.setAttribute('mandatory', annotation.isMandatory);

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
            radio.setAttribute("role", annotation.role);
            radio.setAttribute('mandatory', annotation.isMandatory);
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

        checkbox.setAttribute("role", annotation.role);
        fieldnameslist.push(annotation.id);
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
        if (annotation.content) {
            checkbox.checked = true;

        }

        content.appendChild(checkbox);
        element.appendChild(content);
        return element;
    }
    else if (annotation.type === 'select') {
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

        select.setAttribute("role", annotation.role);
        fieldnameslist.push(annotation.id);
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

        if (annotation.content) {
            select.selectedIndex = annotation.content;
            if (annotation.content != 0) {
                select.classList.add('has-value');
            }
        }


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

        content.appendChild(select);
        element.appendChild(content);
        return element;
    }
    else if (annotation.type === 'date') {
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

        input.setAttribute("role", annotation.role);
        fieldnameslist.push(annotation.id);
        input.value = annotation.content;
        input.style.color = '#636161';
        input.setAttribute('data-flag', annotation.fontcolor);
        input.style.width = ((annotation.width / 100) * canvasWidth) + 'px';
        input.style.height = ((annotation.height / 100) * canvasHeight) + 'px';
        input.style.fontSize = ((annotation.fontsize / 100) * canvasWidth) + 'px';

        if (input.value) {
            input.classList.add('has-value');
        }
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

        element.setAttribute("role", annotation.role);
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
        editableTextContainer.classList.add('editable-text');

        editableTextContainer.addEventListener("focus", () => {
            if (editableTextContainer.innerText == "Click to edit text") {
                editableTextContainer.innerText = ""; // Clear the content
            }
        });

        // Add blur event listener to restore default text if left empty
        editableTextContainer.addEventListener("blur", () => {
            if (editableTextContainer.innerText.trim() == "") {
                editableTextContainer.innerText = "Click to edit text"; // Restore default text
            }
        });

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
        input.id = "Signature" + "_" + annotation.role;
        input.setAttribute("role", annotation.role);
        fieldnameslist.push("Signature" + "_" + annotation.role);


        input.style.textAlign = 'center';

        input.style.width = ((annotation.width / 100) * canvasWidth) + 'px';
        input.style.height = ((annotation.height / 100) * canvasHeight) + 'px';

        input.textContent = 'Signature' + "_" + annotation.role;;

        input.style.backgroundColor = "#d8d7d78a";
        input.style.color = "#44aad1";
        input.style.fontSize = "100%";





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
        input.style.fontSize = "100%";



        input.id = 'Eseal' + "_" + annotation.role;
        input.setAttribute("role", annotation.role);
        fieldnameslist.push('Eseal' + "_" + annotation.role);
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
        fieldnameslist.push(annotation.type);
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
        fieldnameslist.push(annotation.type);
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
        uploadedImage.setAttribute("role", annotation.role);
        uploadedImage.setAttribute('mandatory', annotation.isMandatory);



        // Create the placeholder text
        const placeholderText = document.createElement('span');
        placeholderText.className = 'placeholder-text';
        placeholderText.innerText = 'Upload Image';
        placeholderText.style.fontSize = '50%';

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
            removeImageBtn.classList.add('uploaded');
        }
        content.appendChild(imageContainer);

        element.appendChild(content);

        return element;
    }
}

function fieldConfig(schema, roleindex, rolenumber) {

    console.log(schema)
    const container = document.getElementById(roleindex);
    var rolecontentdiv = document.createElement('div');
    rolecontentdiv.style.display = 'flex';
    rolecontentdiv.style.flexDirection = 'row';
    rolecontentdiv.style.flexWrap = 'wrap';

    container.appendChild(rolecontentdiv);

    schema.forEach((element, index) => {

        if (element.type == "text") {

            const elementdiv = document.createElement('div');
            elementdiv.style.width = '47%';
            elementdiv.style.marginRight = '3%';
            elementdiv.style.display = 'flex';
            elementdiv.style.alignItems = 'center';
            rolecontentdiv.appendChild(elementdiv);

            const label = document.createElement('label');
            label.htmlFor = element.id;
            label.textContent = (element.id).split('_')[0];
            label.style.color = 'black';
            label.style.fontSize = '15px';
            label.style.width = '28%';

            const label1 = document.createElement('label');
            label1.textContent = ':'
            label1.style.fontSize = '15px';

            const input = document.createElement('input');
            input.type = 'text';
            input.id = element.id;
            preFilledData.id = "";
            input.style.fontSize = '14px';
            input.style.border = '1px solid black';
            input.style.borderRadius = '5px';
            input.style.width = '65%';
            const space = document.createTextNode('\u00A0\u00A0\u00A0');

            elementdiv.appendChild(label);
            elementdiv.appendChild(label1);
            elementdiv.appendChild(space);
            elementdiv.appendChild(input);

            input.addEventListener('input', function () {

                const allLeftInputs = document.querySelectorAll('#rolesFields input[id="' + element.id + '"]');
                const allPdfInputs = document.querySelectorAll('#pdf-container input[id="' + element.id + '"]');

                const index = Array.from(allLeftInputs).indexOf(input);
                const pdfInput = allPdfInputs[index];
                if (pdfInput) {
                    pdfInput.value = input.value;
                    componentsdata.forEach((obj, i) => {
                        if (obj.id === element.id && obj.type === "text") {
                            const sameIdObjects = componentsdata.filter(o => o.id === element.id && o.type === "text");
                            const index = Array.from(document.querySelectorAll('#rolesFields input[id="' + element.id + '"]')).indexOf(input);

                            if (sameIdObjects[index] === obj) {
                                obj.content = input.value;
                            }
                        }
                    });
                    preFilledData.id = input.value;
                }
            });

        }
        else if (element.type == "date") {

            const elementdiv = document.createElement('div');
            elementdiv.style.width = '47%';
            elementdiv.style.marginRight = '3%';
            elementdiv.style.display = 'flex';
            elementdiv.style.alignItems = 'center';
            rolecontentdiv.appendChild(elementdiv);

            const label = document.createElement('label');
            label.htmlFor = element.id;
            label.textContent = element.id.split('_')[0];
            label.style.color = 'black';
            label.style.fontSize = '15px';
            label.style.width = '28%';

            const label1 = document.createElement('label');
            label1.textContent = ':'
            label1.style.fontSize = '15px';

            const input = document.createElement('input');
            input.type = 'date';
            input.id = element.id;
            preFilledData.id = "";
            input.style.fontSize = '14px';
            input.style.border = '1px solid black';
            input.style.borderRadius = '5px';
            input.style.width = '65%';
            const space = document.createTextNode('\u00A0\u00A0\u00A0');

            elementdiv.appendChild(label);
            elementdiv.appendChild(label1);
            elementdiv.appendChild(space);
            elementdiv.appendChild(input);

            input.addEventListener('input', function () {

                const pdfInputs = document.querySelectorAll('#pdf-container [id="' + element.id + '"]');
                const leftInputs = document.querySelectorAll('#rolesFields input[id="' + element.id + '"]');
                const index = Array.from(leftInputs).indexOf(input);

                if (pdfInputs[index]) {
                    const pdfInput = pdfInputs[index];
                    pdfInput.value = input.value;
                    pdfInput.classList.add('has-value');

                    const sameIdObjects = componentsdata.filter(obj => obj.id === element.id && obj.type === "date");
                    if (sameIdObjects[index]) {
                        sameIdObjects[index].content = input.value;
                    }
                    preFilledData.id = input.value;
                }
            });
        }
        else if (element.type == "select") {

            const elementdiv = document.createElement('div');
            elementdiv.style.width = '47%';
            elementdiv.style.marginRight = '3%';
            elementdiv.style.display = 'flex';
            elementdiv.style.alignItems = 'center';
            rolecontentdiv.appendChild(elementdiv);

            const label = document.createElement('label');
            label.htmlFor = element.id;
            label.textContent = element.id.split('_')[0];
            label.style.color = 'black';
            label.style.fontSize = '15px';
            label.style.width = '28%';

            const label1 = document.createElement('label');
            label1.textContent = ':'
            label1.style.fontSize = '15px';

            const input = document.createElement('select');

            input.id = element.id;
            preFilledData.id = "";
            input.style.fontSize = '14px';
            input.style.border = '1px solid black';
            input.style.borderRadius = '5px';
            input.style.width = '65%';

            var optionElement = document.createElement('option');
            optionElement.value = "Select Option";
            optionElement.textContent = "Select Option";
            input.appendChild(optionElement);

            (element.options).forEach(optionText => {
                var optionElement = document.createElement('option');
                optionElement.value = optionText;
                optionElement.textContent = optionText;
                input.appendChild(optionElement);
            });
            const space = document.createTextNode('\u00A0\u00A0\u00A0');

            elementdiv.appendChild(label);
            elementdiv.appendChild(label1);
            elementdiv.appendChild(space);
            elementdiv.appendChild(input);

            input.addEventListener('input', function () {

                const pdfInput = document.querySelector('#pdf-container [id="' + element.id + '"]');
                if (pdfInput) {
                    pdfInput.selectedIndex = input.selectedIndex;
                    pdfInput.classList.add('has-value');
                    // componentsdata[index].content = input.selectedIndex;
                    componentsdata.forEach(obj => {
                        if (obj.id === element.id && obj.type === "select") {
                            obj.content = input.selectedIndex;
                        }
                    });
                    preFilledData.id = input.value;
                }
            });

        }
        else if (element.type === "imagefield") {

            const elementdiv = document.createElement('div');
            elementdiv.style.width = '47%';
            elementdiv.style.marginRight = '3%';
            elementdiv.style.display = 'flex';
            elementdiv.style.alignItems = 'center';
            rolecontentdiv.appendChild(elementdiv);

            const label = document.createElement('label');
            label.htmlFor = element.id;
            label.textContent = element.id.split('_')[0];
            label.style.color = 'black';
            label.style.fontSize = '15px';
            label.style.width = '28%';

            const label1 = document.createElement('label');
            label1.textContent = ':';
            label1.style.fontSize = '15px';

            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = element.id;
            preFilledData.id = "";
            fileInput.accept = 'image/*';
            fileInput.style.fontSize = '14px';
            fileInput.style.border = '1px solid black';
            fileInput.style.borderRadius = '5px';
            fileInput.style.width = '65%';

            const deleteIcon = document.createElement('button');
            deleteIcon.type = 'button';
            deleteIcon.textContent = '🗑️';
            deleteIcon.style.border = 'none';
            deleteIcon.style.background = 'transparent';
            deleteIcon.style.cursor = 'pointer';
            deleteIcon.style.fontSize = '18px';
            deleteIcon.style.marginLeft = '10px';
            deleteIcon.style.display = 'none';


            fileInput.addEventListener('change', () => {
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const reader = new FileReader();

                    reader.onload = (e) => {

                        deleteIcon.style.display = 'inline';
                        fileInput.style.width = '55%';
                        const allLeftInputs = document.querySelectorAll('#rolesFields input[id="' + element.id + '"]');
                        const allPdfInputs = document.querySelectorAll('#pdf-container [id="' + element.id + '"]');

                        const index = Array.from(allLeftInputs).indexOf(fileInput);
                        const pdfInput = allPdfInputs[index];
                        if (pdfInput) {
                            pdfInput.src = e.target.result;
                            pdfInput.style.display = 'block';
                            pdfInput.nextElementSibling.style.display = 'none';

                            componentsdata.forEach((obj, i) => {
                                if (obj.id === element.id && obj.type === "imagefield") {
                                    const sameIdObjects = componentsdata.filter(o => o.id === element.id && o.type === "imagefield");
                                    const index = Array.from(document.querySelectorAll('#rolesFields input[id="' + element.id + '"]')).indexOf(fileInput);

                                    if (sameIdObjects[index] === obj) {
                                        obj.content = e.target.result;
                                    }
                                }
                            });
                            preFilledData.id = e.target.result;
                        }
                    };

                    reader.readAsDataURL(file);

                } else {

                    deleteIcon.style.display = 'none';
                }
            });

            deleteIcon.onclick = () => {
                const allLeftInputs = document.querySelectorAll('#rolesFields input[id="' + element.id + '"]');
                const allPdfInputs = document.querySelectorAll('#pdf-container [id="' + element.id + '"]');

                const index = Array.from(allLeftInputs).indexOf(fileInput);
                const pdfInput = allPdfInputs[index];

                if (pdfInput) {
                    fileInput.value = '';
                    pdfInput.style.display = 'none';
                    if (pdfInput.nextElementSibling) {
                        pdfInput.nextElementSibling.style.display = 'block';
                    }
                    deleteIcon.style.display = 'none';
                    fileInput.style.width = '65%';

                    const sameIdObjects = componentsdata.filter(obj => obj.id === element.id && obj.type === "imagefield");
                    if (sameIdObjects[index]) {
                        sameIdObjects[index].content = false;
                    }
                }
            };


            const space = document.createTextNode('\u00A0\u00A0\u00A0');

            elementdiv.appendChild(label);
            elementdiv.appendChild(label1);
            elementdiv.appendChild(space);
            elementdiv.appendChild(fileInput);
            elementdiv.appendChild(deleteIcon);

        }
        else if (element.type == "Signature") {
            listCoordinates[rolenumber] = JSON.parse(JSON.stringify(signCoordinates));
        }
    });
    schema.forEach((element, index) => {

        if (element.type == "checkbox") {
            const elementdiv = document.createElement('div');
            elementdiv.style.width = '90%';
            elementdiv.style.display = 'flex';
            elementdiv.style.flexDirection = 'row';
            elementdiv.style.marginRight = '3%';
            rolecontentdiv.appendChild(elementdiv);

            const label = document.createElement('label');
            label.htmlFor = element.id;
            label.textContent = element.id.split('_')[0];
            label.style.color = 'black';
            label.style.fontSize = '15px';
            label.style.width = '28%';
            label.style.margin = '0';
            label.style.marginLeft = '1%';
            label.style.display = 'flex';
            label.style.alignItems = 'center';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = element.id;

            checkbox.classList.add('input-field');


            elementdiv.appendChild(checkbox);
            elementdiv.appendChild(label);

            checkbox.addEventListener('change', () => {
                const pdfInput = document.querySelector('#pdf-container [id="' + element.id + '"]');

                if (checkbox.checked) {
                    if (pdfInput) {
                        pdfInput.checked = true;
                        componentsdata.forEach(obj => {
                            if (obj.id === element.id && obj.type === "checkbox") {
                                obj.content = true;
                            }
                        });
                    }
                    checkbox.classList.add('checked');
                } else {
                    if (pdfInput) {
                        pdfInput.checked = false;
                        componentsdata.forEach(obj => {
                            if (obj.id === element.id && obj.type === "checkbox") {
                                obj.content = false;
                            }
                        });
                    }
                    checkbox.classList.remove('checked');
                }
            });
        }




    });

    const excludedValues = ["text", "date", "select", "imagefield"];

    const noExcludedValues = !schema.some(obj => excludedValues.includes(obj.type));

    if (noExcludedValues) {
        // Create professional empty state placeholder
        var emptyState = document.createElement('div');
        emptyState.className = 'empty-state';

        // Icon container with SVG
        var iconContainer = document.createElement('div');
        iconContainer.className = 'empty-state-icon';
        iconContainer.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>';

        // Title
        var title = document.createElement('h4');
        title.className = 'empty-state-title';
        title.textContent = 'No fields assigned for this role';

        // Description
        var description = document.createElement('p');
        description.className = 'empty-state-description';
        description.textContent = 'This signer has no fillable fields in the document. You can proceed to the next step.';

        emptyState.appendChild(iconContainer);
        emptyState.appendChild(title);
        emptyState.appendChild(description);
        rolecontentdiv.appendChild(emptyState);
    }
}

function createRolesGroup() {

    const modelObject = document.getElementById('modelobject').value;

    var rolesAvailable = JSON.parse(modelObject);
    console.log(typeof (rolesAvailable));

    numberOfRoles = rolesAvailable.length;

    const clientSelect = document.getElementById("ClientSelect");

    const rolesfields = document.getElementById('rolesFields');
    const rolesforFields = document.getElementById('rolesForFields');
    rolesforFields.addEventListener('change', event => {
        var selectedValue = event.target.value;
        const parentDiv = document.getElementById('rolesFields');
        selectedValue = "#" + selectedValue;
        const targetDiv = parentDiv.querySelector(selectedValue);

        const allDivs = parentDiv.querySelectorAll(':scope > div');
        allDivs.forEach(div => {
            div.style.display = 'none';
        });
        targetDiv.style.display = 'flex';

    });
    rolesAvailable.forEach((roleobj, index) => {
        const option = document.createElement("option");
        const option1 = document.createElement("option");
        option.value = roleobj.role.name;
        option1.value = `role${index + 1}`;
        option.textContent = roleobj.role.name;
        option1.textContent = roleobj.role.name;

        if (index === 0) {
            option.selected = true;
            option1.selected = true;
            clientSelect.appendChild(option);
        }

        rolesforFields.appendChild(option1);

        const roleDiv = document.createElement('div');
        roleDiv.id = `role${index + 1}`;
        roleDiv.style.height = '100%';
        roleDiv.style.backgroundColor = '#ffffff';
        roleDiv.style.borderRadius = '12px';
        roleDiv.style.border = '1px solid #e2e8f0';

        if ((index + 1) != 1) {
            roleDiv.style.display = 'none';
        } else {
            roleDiv.style.display = 'flex';
        }

        roleDiv.style.flexDirection = 'column';

        roleDiv.style.overflowY = 'auto';
        roleDiv.style.padding = '20px';


        const heading = document.createElement('h3');
        heading.className = 'fields-section-heading';
        heading.style.width = '100%';
        heading.style.fontSize = "0.9375rem";
        heading.style.fontWeight = "600";
        heading.style.color = "#0F172A";
        heading.style.textAlign = 'left';
        heading.style.margin = '0 0 16px 0';
        heading.style.paddingBottom = '12px';
        heading.style.borderBottom = '1px solid #f1f5f9';
        heading.style.display = 'flex';
        heading.style.alignItems = 'center';
        heading.style.gap = '8px';
        heading.textContent = "Fields for Role: " + roleobj.role.name;

        roleDiv.appendChild(heading);
        rolesfields.appendChild(roleDiv);
    });



    const rolesGroup = document.createElement('div');
    rolesGroup.className = 'roles-group';
    rolesGroup.style.height = 'auto';
    rolesGroup.style.backgroundColor = '#ffffff';
    rolesGroup.style.marginBottom = '16px';
    rolesGroup.style.padding = '20px 24px';
    rolesGroup.style.overflowY = 'auto';
    rolesGroup.style.borderRadius = '12px';
    rolesGroup.style.border = '1px solid #e2e8f0';
    rolesGroup.style.transition = 'all 0.2s ease';

    const roleNamesWithEseal = rolesAvailable
        .filter(item =>
            item.esealplaceHolderCoordinates &&
            item.esealplaceHolderCoordinates.signatureXaxis !== null
        )
        .map(item => item.role.name);
    const selectedOrganizations = {};


    rolesAvailable.forEach((roleobj, index) => {

        // var space1 = document.createElement('span');
        var space2 = document.createElement('span');
        var space3 = document.createElement('span');
        // space1.innerHTML = ':';
        space2.innerHTML = ':';
        space3.innerHTML = ':';

        const ele = document.createElement('h5');
        ele.textContent = `Signer ${index + 1} : ${roleobj.role.name}`;
        ele.style.marginTop = '0';
        ele.style.marginBottom = '16px';
        ele.style.fontSize = '0.9375rem';
        ele.style.color = "#0F172A";
        ele.style.fontWeight = "600";
        ele.style.display = 'flex';
        ele.style.alignItems = 'center';
        ele.style.gap = '8px';
        ele.style.paddingBottom = '12px';
        ele.style.borderBottom = '1px solid #f1f5f9';
        rolesGroup.appendChild(ele);

        const roleContainer = document.createElement('div');
        roleContainer.className = 'role-container';
        roleContainer.style.display = 'flex';
        roleContainer.style.flexDirection = 'row';
        roleContainer.style.alignItems = 'flex-start';
        roleContainer.style.gap = '16px';
        roleContainer.style.flexWrap = 'wrap';
        roleContainer.style.marginLeft = '0';
        roleContainer.style.padding = '12px 0';




        const emailDiv = document.createElement('div')
        emailDiv.style.display = 'flex';
        emailDiv.style.flexDirection = 'column';
        emailDiv.style.flex = '1';
        emailDiv.style.minWidth = '280px';
        emailDiv.style.gap = '4px';

        const rowDiv = document.createElement('div');
        rowDiv.style.display = 'flex';
        rowDiv.style.flexDirection = 'row';
        rowDiv.style.alignItems = 'center';
        rowDiv.style.gap = '12px';

        const emailLabel = document.createElement('label');
        emailLabel.textContent = 'Email';
        emailLabel.htmlFor = `email-${roleobj.role.name}`;
        emailLabel.style.margin = '0';
        emailLabel.style.minWidth = '50px';
        emailLabel.style.fontSize = '0.875rem';
        emailLabel.style.fontWeight = '500';
        emailLabel.style.color = '#475569';


        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.id = `RoleEmail`;
        emailInput.name = `email-${roleobj.role.name}`;
        emailInput.style.fontSize = '0.875rem';
        emailInput.style.flex = '1';
        emailInput.style.padding = '10px 14px';
        emailInput.classList.add('form-control');
        emailInput.placeholder = 'Enter signer email address';

        const errorSpan = document.createElement('span');
        errorSpan.className = 'signer-email-error';
        errorSpan.style.color = '#ef4444';
        errorSpan.style.fontSize = '0.75rem';
        errorSpan.style.marginLeft = '62px';
        errorSpan.style.minHeight = '20px';
        errorSpan.style.display = 'block';
        errorSpan.classList.add('error-hidden');

        const alternatediv = document.createElement('div');

        alternatediv.style.display = "none";

        rowDiv.appendChild(emailLabel);
        rowDiv.appendChild(space3);
        rowDiv.appendChild(emailInput);

        emailDiv.appendChild(rowDiv);
        emailDiv.appendChild(errorSpan);
        emailDiv.appendChild(alternatediv);
        roleContainer.appendChild(emailDiv);

        const selectElement = document.createElement('select');


        selectElement.className = 'custom-select';
        selectElement.style.minWidth = '180px';
        selectElement.style.fontSize = '80%';
        selectElement.style.marginBottom = '1%';

        selectElement.style.padding = '0.3rem';

        const options = [
            { value: 'ChooseOrganization', text: 'Choose Account' },

        ];

        options.forEach(optionData => {
            const option = document.createElement('option');
            option.value = optionData.value;
            option.textContent = optionData.text;
            selectElement.appendChild(option);
        });


        const loader = document.createElement('div');
        loader.className = 'orgloader';
        loader.style.width = '18px';
        loader.style.height = '18px';
        loader.style.border = '2px solid #e2e8f0';
        loader.style.borderTop = '2px solid #059669';
        loader.style.borderRadius = '50%';
        loader.style.animation = 'spin 0.8s linear infinite';
        loader.style.display = 'none';
        loader.style.flexShrink = '0';


        roleContainer.appendChild(selectElement);
        roleContainer.appendChild(loader);

        rolesGroup.appendChild(roleContainer);


        emailInput.addEventListener('blur', (event) => {
            let iseseal = document.getElementById(`Eseal_${roleobj.role.name}`);
            let esealflag = false;

            if (iseseal) {

                esealflag = true;


            }
            loader.style.display = 'block';
            selectElement.innerHTML = "";
            const options = [
                { value: 'ChooseOrganization', text: 'Choose Account' },
            ];

            options.forEach(optionData => {
                const option = document.createElement('option');
                option.value = optionData.value;
                option.textContent = optionData.text;
                selectElement.appendChild(option);
            });

            sendEmailToGetThumbnail(emailInput.value)
                .then(orgsAndIds => {

                    if (orgsAndIds) {
                        if (numberOfRoles == 1 && emailInput.value == currentUserEmail) {
                            errorSpan.textContent = 'User cannot send a Document to themselves.';
                            errorSpan.classList.remove('error-hidden');
                        } else {


                            const inputs = rolesGroup.querySelectorAll('input');

                            const values = Array.from(inputs)
                                .map(input => input.value.trim())
                                .filter(value => value !== '');
                            const hasDuplicates = values.length !== new Set(values).size;


                            const selectorgroles = rolesGroup.querySelectorAll('select');
                            const dataIdSet = new Set();

                            selectorgroles.forEach(select => {
                                const options = select.options;
                                if (options.length > 1) {
                                    const secondOption = options[1];
                                    const dataId = secondOption.getAttribute('data-id');
                                    if (dataId) {
                                        dataIdSet.add(dataId);
                                    }
                                }
                            });

                            const targetValue = orgsAndIds["SELF"][1];




                            if (hasDuplicates) {
                                swal({
                                    title: "Info",
                                    text: "Roles within the same document cannot have the same signatory.",
                                    type: "info",
                                });
                                errorSpan.textContent = '';
                                errorSpan.classList.add('error-hidden');
                            }
                            else if (dataIdSet.has(targetValue)) {
                                swal({
                                    title: "Info",
                                    text: "Email of the subscriber already present the same document.",
                                    type: "info",
                                });
                                errorSpan.textContent = '';
                                errorSpan.classList.add('error-hidden');
                            }
                            else {
                                var option1 = document.createElement('option');
                                option1.value = "self";
                                option1.textContent = "Self";
                                option1.setAttribute('data-id', orgsAndIds["SELF"][1]);

                                if (esealflag || orgsAndIds["SELF"][0] != emailInput.value) {
                                    option1.style.display = 'none';
                                }

                                selectElement.appendChild(option1);
                                for (const [orgName, org] of Object.entries(orgsAndIds)) {
                                    if (orgName !== "SELF") {
                                        const option = document.createElement('option');
                                        option.value = org[0];
                                        option.textContent = orgName;
                                        option.setAttribute('data-id', org[1]);

                                        selectElement.appendChild(option);
                                    }

                                }

                                errorSpan.textContent = '';
                                errorSpan.classList.add('error-hidden');
                            }

                        }

                    } else {
                        console.log("No organizations found or success flag was present.");
                        errorSpan.textContent = 'Invalid email address';
                        errorSpan.classList.remove('error-hidden');

                    }
                    loader.style.display = 'none';
                })
                .catch(error => {
                    loader.style.display = 'none';
                    console.error("Error fetching organization details:", error);
                });

        });

        selectElement.addEventListener('change', async function () {
            const selectedOption = this.options[this.selectedIndex];
            const selectedValue = selectedOption.value;
            const selectedDataId = selectedOption.getAttribute('data-id');
            if (selectedValue == "self" || selectedValue == "ChooseOrganization") {
                selectedOrganizations[roleobj.role.name] = selectedValue;
            } else {

                for (const esealRole of roleNamesWithEseal) {
                    if (esealRole !== roleobj.role.name && selectedOrganizations[esealRole] === selectedValue) {


                        swal({
                            type: 'info',
                            title: 'E-seal Conflict',
                            text: `This organization is already used by ${esealRole} who has an e-seal. Only one e-seal per organization is allowed.`,
                        }, () => {


                            selectElement.selectedIndex = 0;



                        })

                        return;
                    }
                }


                selectedOrganizations[roleobj.role.name] = selectedValue;

                var res = await handle_delegation_orgid_suid(selectedValue, selectedDataId, emailInput.value, index)

                if (index == 0) {
                    if (res.delegateeid != "") {
                        selectElement.innerHTML = "";
                        const options = [
                            { value: 'ChooseOrganization', text: 'Choose Account' },
                        ];

                        options.forEach(optionData => {
                            const option = document.createElement('option');
                            option.value = optionData.value;
                            option.textContent = optionData.text;
                            selectElement.appendChild(option);
                        });
                    }
                } else {
                    if (res.iscancelled == true) {

                        selectElement.innerHTML = "";
                        const options = [
                            { value: 'ChooseOrganization', text: 'Choose Account' },
                        ];

                        options.forEach(optionData => {
                            const option = document.createElement('option');
                            option.value = optionData.value;
                            option.textContent = optionData.text;
                            selectElement.appendChild(option);
                        });
                    }
                    else {
                        alternatediv.setAttribute("data-delegates", JSON.stringify(res.listdata));

                        alternatediv.setAttribute("data-delegateid", res.delegateeid);
                    }
                }


            }

        });
    });


    (document.getElementById('roles')).appendChild(rolesGroup);


    rolesAvailable.forEach((roleobj, index) => {
        console.log(roleobj.annotationsList)
        console.log(typeof (roleobj.annotationsList))
        var roleindex = `role${index + 1}`
        fieldConfig(JSON.parse(roleobj.annotationsList), roleindex, index)
    });


}


function addSignatories() {

    var parentdiv = document.getElementById('roles');
    var roleGroupDivs = parentdiv.querySelectorAll('div.roles-group')
    const count = roleGroupDivs.length;

    if (count < 10) {
        const modelObject = document.getElementById('modelobject').value;

        var rolesAvailable = JSON.parse(modelObject);
        console.log(typeof (rolesAvailable));

        const rolesGroup = document.createElement('div');
        rolesGroup.className = 'roles-group';
        rolesGroup.style.height = 'auto';
        rolesGroup.style.backgroundColor = 'rgba(247, 249, 251, 1)';
        rolesGroup.style.marginBottom = '2%';
        rolesGroup.style.padding = '2%';
        rolesGroup.style.overflowY = 'auto';

        rolesAvailable.forEach((roleobj, index) => {

            // var space1 = document.createElement('span');
            var space2 = document.createElement('span');
            var space3 = document.createElement('span');
            // space1.innerHTML = ':';
            space2.innerHTML = ':';
            space3.innerHTML = ':';

            const ele = document.createElement('h5');
            ele.textContent = `Signer ${index + 1} : ${roleobj.role.name}`;
            ele.style.marginTop = '0';
            rolesGroup.appendChild(ele);

            const roleContainer = document.createElement('div');
            roleContainer.className = 'role-container';
            roleContainer.style.display = 'flex';
            roleContainer.style.flexDirection = 'row';
            roleContainer.style.alignItems = 'flex-start';
            roleContainer.style.gap = '16px';
            roleContainer.style.flexWrap = 'wrap';
            roleContainer.style.marginLeft = '0';
            roleContainer.style.padding = '12px 0';


            const emailDiv = document.createElement('div')
            emailDiv.style.display = 'flex';
            emailDiv.style.flexDirection = 'column';
            emailDiv.style.flex = '1';
            emailDiv.style.minWidth = '280px';
            emailDiv.style.gap = '4px';

            const rowDiv = document.createElement('div');
            rowDiv.style.display = 'flex';
            rowDiv.style.flexDirection = 'row';
            rowDiv.style.alignItems = 'center';
            rowDiv.style.gap = '12px';

            const emailLabel = document.createElement('label');
            emailLabel.textContent = 'Email';
            emailLabel.htmlFor = `email-${roleobj.role.name}`;
            emailLabel.style.margin = '0';
            emailLabel.style.minWidth = '50px';
            emailLabel.style.fontSize = '0.875rem';
            emailLabel.style.fontWeight = '500';
            emailLabel.style.color = '#475569';


            const emailInput = document.createElement('input');
            emailInput.type = 'email';
            emailInput.id = `RoleEmail`;
            emailInput.name = `email-${roleobj.role.name}`;
            emailInput.style.fontSize = '0.875rem';
            emailInput.style.flex = '1';
            emailInput.style.padding = '10px 14px';
            emailInput.classList.add('form-control');
            emailInput.placeholder = 'Enter signer email address';

            const alternatediv = document.createElement('div');

            alternatediv.style.display = "none";

            const errorSpan = document.createElement('span');
            errorSpan.className = 'signer-email-error';
            errorSpan.style.color = '#ef4444';
            errorSpan.style.fontSize = '0.75rem';
            errorSpan.style.marginLeft = '62px';
            errorSpan.style.minHeight = '20px';
            errorSpan.style.display = 'block';
            errorSpan.classList.add('error-hidden');

            rowDiv.appendChild(emailLabel);
            rowDiv.appendChild(space3);
            rowDiv.appendChild(emailInput);

            emailDiv.appendChild(rowDiv);
            emailDiv.appendChild(errorSpan);
            emailDiv.appendChild(alternatediv);

            roleContainer.appendChild(emailDiv);
            const selectElement = document.createElement('select');


            selectElement.className = 'custom-select';
            selectElement.style.minWidth = '180px';
            selectElement.style.fontSize = '80%';
            selectElement.style.marginBottom = '1%';
            selectElement.style.padding = '0.3rem';

            const options = [
                { value: 'ChooseOrganization', text: 'Choose Account' },
            ];

            options.forEach(optionData => {
                const option = document.createElement('option');
                option.value = optionData.value;
                option.textContent = optionData.text;
                selectElement.appendChild(option);
            });

            const loader = document.createElement('div');
            loader.className = 'orgloader';
            loader.style.width = '18px';
            loader.style.height = '18px';
            loader.style.border = '2px solid #e2e8f0';
            loader.style.borderTop = '2px solid #059669';
            loader.style.borderRadius = '50%';
            loader.style.animation = 'spin 0.8s linear infinite';
            loader.style.display = 'none';
            loader.style.flexShrink = '0';

            roleContainer.appendChild(selectElement);
            roleContainer.appendChild(loader);


            rolesGroup.appendChild(roleContainer);

            emailInput.addEventListener('blur', (event) => {
                // sendEmailToGetThumbnail(emailInput.value);
                loader.style.display = 'block';
                selectElement.innerHTML = "";
                let iseseal = document.getElementById(`Eseal_${roleobj.role.name}`);
                let esealflag = false;

                if (iseseal) {

                    esealflag = true;


                }
                const options = [
                    { value: 'ChooseOrganization', text: 'Choose Account' },
                ];

                options.forEach(optionData => {
                    const option = document.createElement('option');
                    option.value = optionData.value;
                    option.textContent = optionData.text;
                    selectElement.appendChild(option);
                });
                sendEmailToGetThumbnail(emailInput.value)
                    .then(orgsAndIds => {

                        if (orgsAndIds) {

                            if (numberOfRoles == 1 && emailInput.value == currentUserEmail) {
                                errorSpan.textContent = 'User cannot send a Document to themselves.';
                                errorSpan.classList.remove('error-hidden');
                            } else {
                                const inputs = rolesGroup.querySelectorAll('input');
                                const values = Array.from(inputs)
                                    .map(input => input.value.trim())
                                    .filter(value => value !== '');

                                const hasDuplicates = values.length !== new Set(values).size;

                                const selectorgroles = rolesGroup.querySelectorAll('select');
                                const dataIdSet = new Set();

                                selectorgroles.forEach(select => {
                                    const options = select.options;
                                    if (options.length > 1) {
                                        const secondOption = options[1];
                                        const dataId = secondOption.getAttribute('data-id');
                                        if (dataId) {
                                            dataIdSet.add(dataId);
                                        }
                                    }
                                });

                                const targetValue = orgsAndIds["SELF"][1];


                                if (hasDuplicates) {
                                    swal({
                                        title: "Info",
                                        text: "Roles within the same document cannot have the same signatory.",
                                        type: "info",
                                    });
                                    errorSpan.textContent = '';
                                    errorSpan.classList.add('error-hidden');
                                }
                                else if (dataIdSet.has(targetValue)) {
                                    swal({
                                        title: "Info",
                                        text: "Email of the subscriber already present the same document.",
                                        type: "info",
                                    });
                                    errorSpan.textContent = '';
                                    errorSpan.classList.add('error-hidden');
                                }
                                else {
                                    var option1 = document.createElement('option');
                                    option1.value = "self";
                                    option1.textContent = "Self";
                                    option1.setAttribute('data-id', orgsAndIds["SELF"][1]);


                                    if (esealflag || orgsAndIds["SELF"][0] != emailInput.value) {
                                        option1.style.display = 'none';
                                    }

                                    selectElement.appendChild(option1);
                                    for (const [orgName, org] of Object.entries(orgsAndIds)) {
                                        if (orgName !== "SELF") {
                                            const option = document.createElement('option');
                                            option.value = org[0];
                                            option.textContent = orgName;
                                            option.setAttribute('data-id', org[1]);

                                            selectElement.appendChild(option);
                                        }

                                    }

                                    errorSpan.textContent = '';
                                    errorSpan.classList.add('error-hidden');
                                }
                            }

                        } else {
                            console.log("No organizations found or success flag was present.");
                        }
                        loader.style.display = 'none';
                    })
                    .catch(error => {
                        loader.style.display = 'none';
                        console.error("Error fetching organization details:", error);
                    });

            });

            selectElement.addEventListener('change', async function () {
                const selectedOption = this.options[this.selectedIndex]; // Get selected <option>
                const selectedValue = selectedOption.value; // Get value
                const selectedDataId = selectedOption.getAttribute('data-id');
                if (selectedValue == "self") {

                } else {
                    var res = await handle_delegation_orgid_suid(selectedValue, selectedDataId, emailInput.value, index)

                    if (index == 0) {

                    } else {
                        if (res.iscancelled == true) {

                            selectElement.innerHTML = "";
                            const options = [
                                { value: 'ChooseOrganization', text: 'Choose Account' },
                            ];

                            options.forEach(optionData => {
                                const option = document.createElement('option');
                                option.value = optionData.value;
                                option.textContent = optionData.text;
                                selectElement.appendChild(option);
                            });
                        }
                        else {
                            alternatediv.setAttribute("data-delegates", JSON.stringify(res.listdata));

                            alternatediv.setAttribute("data-delegateid", res.delegateeid);
                        }
                    }
                }

            });


        });



        (document.getElementById('roles')).appendChild(rolesGroup);
        const deleteButton = document.createElement('button');

        deleteButton.style.minWidth = '10%';

        deleteButton.style.whiteSpace = 'nowrap';
        deleteButton.style.borderRadius = '5px';
        deleteButton.style.border = 'none';
        deleteButton.style.backgroundColor = 'red';
        deleteButton.style.color = 'white';
        deleteButton.style.float = 'right';
        deleteButton.style.marginRight = '1%';
        deleteButton.style.marginTop = '2%';
        deleteButton.style.fontSize = '85%';

        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => {
            rolesGroup.remove();
        });
        rolesGroup.appendChild(deleteButton)

        document.getElementById('roleblocks').scrollTop = document.getElementById('roleblocks').scrollHeight;

    }
    else {
        swal({
            title: "Info",
            text: "Requests can't be added more than 10.",
            type: "info",
        });
    }
}


var steps = document.querySelectorAll('.steps .circle');
var line = document.querySelector('.progress-bar .indicator');

function updateProgressBar(step, color) {
    steps.forEach((stepElement, index) => {
        stepElement.classList[index < step ? 'add' : 'remove']('active');
    });

    var width = ((step - 1) / (steps.length - 1)) * 100;
    line.style.width = width + '%';
    line.style.background = color;
}

function updateCircleColors(step, color) {
    steps.forEach((stepElement, index) => {
        stepElement.style.borderColor = index < step ? color : '#e0e0e0';
        stepElement.style.color = index < step ? color : '#e0e0e0';
    });
}

$("#nextButton").on("click", function (e) {
    e.preventDefault();

    const divs = document.querySelectorAll('#configurations > div');

    // Find the currently visible div (without the 'hide' class)
    const visibleDiv = Array.from(divs).find(div => !div.classList.contains('classshide'));

    if (visibleDiv) {
        const currentId = parseInt(visibleDiv.id);
        const nextId = currentId % 3 + 1;

        if (currentId === 1) {
            let shouldStop = false;
            const rolesGroups = document.querySelectorAll(".roles-group");
            rolesGroups.forEach((group) => {
                const customSelects = group.querySelectorAll(".custom-select");

                customSelects.forEach(customSelect => {
                    if (customSelect.value === "ChooseOrganization") {
                        shouldStop = true;
                        swal({
                            type: 'info',
                            title: 'Select Organization',
                            text: 'Please provide a valid email and select the organization.',
                        });
                        return;
                    }
                });
            });
            const daystocomplete = document.getElementById('signDays')
            if (daystocomplete) {
                if (daystocomplete.value === "") {
                    shouldStop = true;
                    swal({
                        type: 'info',
                        title: 'Info',
                        text: 'Signing Duration cannnot be Empty',
                    });
                    return;
                }
            }
            if (shouldStop) {
                return;
            }
            document.getElementById('prevButton').disabled = false;
        }

        visibleDiv.classList.add('classshide');

        const nextDiv = document.getElementById(nextId.toString());
        if (nextDiv) {
            nextDiv.classList.remove('classshide');
        }

        updateProgressBar(nextId, "#10b981");
        updateCircleColors(nextId, "#10b981");

        const leftCol = document.getElementById('stepContent');
        const rightCol = document.getElementById('pdfContainerMain');


        if (nextId === 3) {
            (document.getElementById('nextButton')).style.display = 'none';
            (document.getElementById('sendButton')).style.display = 'block';
            document.getElementById('sendButton').disabled = true;
            const loader = document.createElement('div');
            loader.className = 'loader';
            loader.id = 'pdfloader';

            rightCol.appendChild(loader);
            document.getElementById('pdf-container').innerHTML = "";

            rightCol.classList.remove('col-lg-4');
            leftCol.classList.remove('col-lg-8');
            rightCol.classList.add('col-lg-9');


            leftCol.classList.add('col-lg-3');

            setTimeout(loadTemplate, 1000);



        }



    }


    window.scrollTo(0, 0);
});

$("#prevButton").on("click", function (e) {
    e.preventDefault();

    const divs = document.querySelectorAll('#configurations > div');

    // Find the currently visible div (without the 'hide' class)
    const visibleDiv = Array.from(divs).find(div => !div.classList.contains('classshide'));

    if (visibleDiv) {
        const currentId = parseInt(visibleDiv.id);
        const prevId = currentId === 1 ? divs.length : currentId - 1; // Circular navigation

        // Hide the current div
        visibleDiv.classList.add('classshide');

        // Show the previous div
        const prevDiv = document.getElementById(prevId.toString());
        if (prevDiv) {
            prevDiv.classList.remove('classshide');
        }

        updateProgressBar(prevId, "#10b981");
        updateCircleColors(prevId, "#10b981");

        const leftCol = document.getElementById('stepContent');
        const rightCol = document.getElementById('pdfContainerMain');


        if (currentId === 3) {
            (document.getElementById('nextButton')).style.display = 'block';
            (document.getElementById('sendButton')).style.display = 'none';
            const loader = document.createElement('div');
            loader.className = 'loader';
            loader.id = 'pdfloader';

            rightCol.appendChild(loader);

            document.getElementById('pdf-container').innerHTML = "";

            rightCol.classList.remove('col-lg-9');
            leftCol.classList.remove('col-lg-3');
            rightCol.classList.add('col-lg-4');


            leftCol.classList.add('col-lg-8');
            setTimeout(loadTemplate, 1000);
        }
        if (currentId === 2) {
            document.getElementById('prevButton').disabled = true;
        }
    }

    window.scrollTo(0, 0);
});

$("#sendButton").on("click", function (e) {
    $('#overlay').show();
    e.preventDefault();
    try {
        const sequence = document.getElementById('sequentialSign');
        const docName = document.getElementById('docName').value;
        const signDays = document.getElementById('signDays').value;


        const rolesGroups = document.querySelectorAll(".roles-group");

        var roleDataList = []
        rolesGroups.forEach((group, index) => {
            var emaillst = [];
            const inputValues = Array.from(group.querySelectorAll("input")).map((input) => {


                var userobj = {};

                const parentEle = input.parentElement;
                const selectElement = (parentEle.parentElement).nextElementSibling;
                const lastChild = (parentEle.parentElement).lastElementChild;
                if (selectElement && selectElement.tagName === 'SELECT') {
                    const selectedValue = selectElement.value;
                    const selectedSuid = selectElement.selectedOptions[0].getAttribute('data-id');

                    const selectedText = selectElement.selectedOptions[0].innerHTML;
                    if (selectedText !== "Self") {
                        userobj.orgName = selectedText;
                        userobj.orgUid = selectedValue;
                        userobj.suid = selectedSuid;
                        userobj.accountType = "organization";
                        if (lastChild.getAttribute("data-delegateid") !== "" && lastChild.getAttribute("data-delegateid") !== null) {
                            userobj.HasDelegation = true;
                            userobj.DelegationId = lastChild.getAttribute("data-delegateid");
                            userobj.AlternateSignatories = lastChild.getAttribute("data-delegates");
                        }
                        else {
                            userobj.HasDelegation = false;
                            userobj.DelegationId = "";
                            userobj.AlternateSignatories = "";
                        }
                    } else {
                        userobj.orgName = "";
                        userobj.orgUid = "";
                        userobj.suid = selectedSuid;
                        userobj.accountType = "self";
                        userobj.HasDelegation = false;
                        userobj.DelegationId = "";
                        userobj.AlternateSignatories = "";
                    }

                }
                userobj.email = input.value;

                emaillst.push(userobj);
            });
            roleDataList.push(emaillst);
        });




        console.log(roleDataList);


        const radioGroups = {};
        const pdfradioGroups = {};
        var Data = currentRolesData;

        var Cordinates = { "imgHeight": "", "imgWidth": "", "signatureYaxis": "", "signatureXaxis": "", "pageNumber": "" }
        // var signCoordinates = {
        //     "esealplaceHolderCoordinates": Cordinates,
        //     "placeHolderCoordinates": Cordinates,
        //     "qrPlaceHolderCoordinates": Cordinates,
        // }
        // var esealplaceHolderCoordinates = {};
        // var placeHolderCoordinates = {};

        document.querySelectorAll('.pdf-page').forEach((pageElement, pageIndex) => {
            const annotationLayer = pageElement.querySelector('.annotation-layer');
            const canvas = pageElement.querySelector('canvas'); // Get the canvas element
            if (!canvas) {
                return;
            }
            const width = canvas.getBoundingClientRect().width; // Get the width of the canvas
            const height = canvas.getBoundingClientRect().height; // Get the height of the canvas

            annotationLayer.querySelectorAll('.draggable').forEach(element => {
                var computedStyle = window.getComputedStyle(element);


                var draggablepadding = computedStyle.getPropertyValue('padding-top');

                const rect = element.getBoundingClientRect();
                if (element.querySelectorAll('.editable-text')[0]) {
                    var inputrect = element.querySelector('.editable-text').getBoundingClientRect();
                }

                else if (element.querySelector('#Wsave')) {
                    var inputrect = element.querySelector('#Wsave').getBoundingClientRect();
                }
                else if (element.querySelector('#Wfill')) {
                    var inputrect = element.querySelector('#Wfill').getBoundingClientRect();
                }
                else if (element.querySelectorAll('.image-container')[0]) {
                    var inputrect = element.querySelector('.image-container').getBoundingClientRect();
                }
                else if (element.querySelector('.input-field')) {
                    var ele = element.querySelector('.input-field');
                    var inputrect = element.querySelector('.input-field').getBoundingClientRect();
                }

                const parentRect = element.parentElement.getBoundingClientRect();

                if (element.querySelector('input[type="radio"]')) {
                    // Handle radio buttons
                    const radio = element.querySelector('input[type="radio"]');
                    const groupName = radio.name;
                    if (!radioGroups[groupName]) {
                        radioGroups[groupName] = {
                            type: 'radio',
                            name: groupName,
                            buttons: [],
                            page: pageIndex + 1,
                            role: element.querySelector('input[type="radio"]').getAttribute('role'),
                            isMandatory: radio.getAttribute('mandatory')
                        };
                        pdfradioGroups[groupName] = {
                            type: 'radio',
                            name: groupName,
                            buttons: [],
                            page: pageIndex + 1 // Page number (1-based index)
                        };
                    }
                    radioGroups[groupName].buttons.push({
                        value: radio.value,
                        x: ((rect.left - parentRect.left) / width) * 100,
                        y: ((rect.top - parentRect.top) / height) * 100,
                        width: (inputrect.width / width) * 100,
                        height: (inputrect.height / height) * 100,
                        draggablepadding: (parseFloat(draggablepadding) / width) * 100,
                        id: radio.id,

                    });
                    pdfradioGroups[groupName].buttons.push({
                        value: radio.value,
                        x: ((rect.left - parentRect.left) * scaleX),
                        y: ((rect.top - parentRect.top) * scaleY),
                        width: (inputrect.width * scaleX),
                        height: (inputrect.height * scaleY),
                        radioName: radio.id,

                    });
                }
                else if (element.querySelector('input[type="text"]')) {
                    var fontSize = element.querySelector('input[type="text"]').style.fontSize;
                    if (fontSize === "") {
                        var computedStyle = window.getComputedStyle(element.querySelector('input[type="text"]'));
                        fontSize = computedStyle.getPropertyValue('font-size');
                    }
                    // Handle text fields and checkboxes
                    annotations.push({
                        type: 'text',
                        x: ((rect.left - parentRect.left) / width) * 100,
                        y: ((rect.top - parentRect.top) / height) * 100,
                        width: (inputrect.width / width) * 100,
                        height: (inputrect.height / height) * 100,
                        fontsize: (parseFloat(fontSize) / width) * 100,
                        draggablepadding: (parseFloat(draggablepadding) / width) * 100,
                        content: element.querySelector('input[type="text"]') ? element.querySelector('input[type="text"]').value : '',
                        id: element.querySelector('input') ? element.querySelector('input').id : '',
                        role: element.querySelector('input') ? element.querySelector('input').getAttribute('role') : '',
                        isMandatory: element.querySelector('input') ? element.querySelector('input').getAttribute('mandatory') : '',
                        page: pageIndex + 1 // Page number (1-based index)
                    });
                    pdfAnnotations.push({
                        type: 'text',
                        x: ((rect.left - parentRect.left) * scaleX),
                        y: ((rect.top - parentRect.top) * scaleY),
                        width: (inputrect.width * scaleX),
                        height: (inputrect.height * scaleY),
                        page: pageIndex + 1
                    });
                }
                else if (element.querySelector('input[type="checkbox"]')) {
                    annotations.push({
                        type: 'checkbox',
                        x: ((rect.left - parentRect.left) / width) * 100,
                        y: ((rect.top - parentRect.top) / height) * 100,
                        width: (inputrect.width / width) * 100,
                        height: (inputrect.height / height) * 100,
                        draggablepadding: (parseFloat(draggablepadding) / width) * 100,
                        value: element.querySelector('input[type="checkbox"]') ? element.querySelector('input[type="checkbox"]').value : '',
                        id: element.querySelector('input') ? element.querySelector('input').id : '',
                        role: element.querySelector('input[type="checkbox"]') ? element.querySelector('input[type="checkbox"]').getAttribute('role') : '',
                        isMandatory: element.querySelector('input[type="checkbox"]') ? element.querySelector('input[type="checkbox"]').getAttribute('mandatory') : '',
                        page: pageIndex + 1 // Page number (1-based index)
                    });
                    pdfAnnotations.push({
                        type: 'checkbox',
                        x: ((rect.left - parentRect.left) * scaleX),
                        y: ((rect.top - parentRect.top) * scaleY),
                        width: (inputrect.width * scaleX),
                        height: (inputrect.height * scaleY),
                        page: pageIndex + 1
                    });
                }
                else if (element.querySelector('select')) {

                    var fontSize = element.querySelector('select').style.fontSize;
                    if (fontSize === "") {
                        var computedStyle = window.getComputedStyle(element.querySelector('select'));
                        fontSize = computedStyle.getPropertyValue('font-size');
                    }
                    annotations.push({
                        type: 'select',
                        x: ((rect.left - parentRect.left) / width) * 100,
                        y: ((rect.top - parentRect.top) / height) * 100,
                        width: (inputrect.width / width) * 100,
                        height: (inputrect.height / height) * 100,
                        fontsize: (parseFloat(fontSize) / width) * 100,
                        draggablepadding: (parseFloat(draggablepadding) / width) * 100,
                        options: element.querySelector('select') ? Array.from(element.querySelector('select').options).map(option => option.value).filter(value => value !== "Select Option") : [],
                        content: element.querySelector('select') ? element.querySelector('select').selectedIndex : '',
                        id: element.querySelector('select') ? element.querySelector('select').id : '',
                        page: pageIndex + 1,
                        role: element.querySelector('select') ? element.querySelector('select').getAttribute('role') : '',
                        isMandatory: element.querySelector('select') ? element.querySelector('select').getAttribute('mandatory') : ''
                    });
                    pdfAnnotations.push({
                        type: 'select',
                        x: ((rect.left - parentRect.left) * scaleX),
                        y: ((rect.top - parentRect.top) * scaleY),
                        width: (inputrect.width * scaleX),
                        height: (inputrect.height * scaleY),
                        options: element.querySelector('select') ? Array.from(element.querySelector('select').options).map(option => option.value).filter(value => value !== "Select Option") : [],
                        name: element.querySelector('select') ? element.querySelector('select').id : '',
                        page: pageIndex + 1
                    });
                }
                else if (element.querySelector('input[type="date"]')) {
                    var fontSize = element.querySelector('input[type="date"]').style.fontSize;
                    if (fontSize === "") {
                        var computedStyle = window.getComputedStyle(element.querySelector('input[type="date"]'));
                        fontSize = computedStyle.getPropertyValue('font-size');
                    }
                    annotations.push({
                        type: 'date',
                        x: ((rect.left - parentRect.left) / width) * 100,
                        y: ((rect.top - parentRect.top) / height) * 100,
                        width: (inputrect.width / width) * 100,
                        height: (inputrect.height / height) * 100,
                        fontsize: (parseFloat(fontSize) / width) * 100,
                        draggablepadding: (parseFloat(draggablepadding) / width) * 100,
                        content: element.querySelector('input[type="date"]') ? element.querySelector('input[type="date"]').value : '',
                        id: element.querySelector('input') ? element.querySelector('input').id : '',
                        page: pageIndex + 1,
                        role: element.querySelector('input') ? element.querySelector('input').getAttribute('role') : '',
                        isMandatory: element.querySelector('input') ? element.querySelector('input').getAttribute('mandatory') : ''
                    });
                    pdfAnnotations.push({
                        type: 'date',
                        x: ((rect.left - parentRect.left) * scaleX),
                        y: ((rect.top - parentRect.top) * scaleY),
                        width: (inputrect.width * scaleX),
                        height: (inputrect.height * scaleY),
                        name: element.querySelector('input') ? element.querySelector('input').id : '',
                        page: pageIndex + 1
                    });
                }
                else if (element.querySelector('.editable-text')) {
                    var fontSize = element.querySelector('.editable-text').style.fontSize;
                    if (fontSize === "") {
                        var computedStyle = window.getComputedStyle(element.querySelector('.editable-text'));
                        fontSize = computedStyle.getPropertyValue('font-size');
                    }
                    const editable = element.querySelector('.editable-text');
                    annotations.push({
                        type: 'plain-text',
                        x: ((rect.left - parentRect.left) / width) * 100,
                        y: ((rect.top - parentRect.top) / height) * 100,
                        width: (inputrect.width / width) * 100,
                        height: (inputrect.height / height) * 100,
                        fontsize: (parseFloat(fontSize) / width) * 100,
                        draggablepadding: (parseFloat(draggablepadding) / width) * 100,
                        content: editable?.innerText === 'Click to edit text' ? '' : editable?.innerText || '',
                        page: pageIndex + 1
                    });
                    pdfAnnotations.push({
                        type: 'plain-text',
                        x: ((rect.left - parentRect.left) * scaleX),
                        y: ((rect.top - parentRect.top) * scaleY),
                        width: (inputrect.width * scaleX),
                        height: (inputrect.height * scaleY),
                        content: element.querySelectorAll('.editable-text') ? element.querySelectorAll('.editable-text')[0].innerText : '',
                        page: pageIndex + 1
                    });
                }
                else if (element.querySelector('#Wsave')) {
                    annotations.push({
                        type: 'Wsave',
                        x: ((rect.left - parentRect.left) / width) * 100,
                        y: ((rect.top - parentRect.top) / height) * 100,
                        width: (inputrect.width / width) * 100,
                        height: (inputrect.height / height) * 100,
                        page: pageIndex + 1
                    });
                }
                else if (element.querySelector('#Wfill')) {
                    annotations.push({
                        type: 'Wfill',
                        x: ((rect.left - parentRect.left) / width) * 100,
                        y: ((rect.top - parentRect.top) / height) * 100,
                        width: (inputrect.width / width) * 100,
                        height: (inputrect.height / height) * 100,
                        page: pageIndex + 1
                    });
                }
                else if (element.querySelector('.image-container')) {
                    annotations.push({
                        type: 'imagefield',
                        id: ((element.querySelector('.image-container')).children[1]).id,
                        x: ((rect.left - parentRect.left) / width) * 100,
                        y: ((rect.top - parentRect.top) / height) * 100,
                        width: (inputrect.width / width) * 100,
                        height: (inputrect.height / height) * 100,
                        content: ((element.querySelector('.image-container')).children[1]).src,
                        role: ((element.querySelector('.image-container')).children[1]).getAttribute('role'),
                        isMandatory: ((element.querySelector('.image-container')).children[1]) ? ((element.querySelector('.image-container')).children[1]).getAttribute('mandatory') : '',
                        page: pageIndex + 1
                    });
                }
                else {

                    Data.forEach((role, index) => {

                        if (element.querySelector(`[id="Signature_${role.Roles.name}"]`)) {
                            var inputrect = element.querySelector(`[id="Signature_${role.Roles.name}"]`).getBoundingClientRect();
                        } else if (element.querySelector(`[id="Eseal_${role.Roles.name}"]`)) {
                            var inputrect = element.querySelector(`[id="Eseal_${role.Roles.name}"]`).getBoundingClientRect();
                        }
                        roleId = (role._id);


                        if (element.querySelector(`[id="Signature_${role.Roles.name}"]`)) {
                            annotations.push({
                                type: 'Signature',
                                x: ((rect.left - parentRect.left) / width) * 100,
                                y: ((rect.top - parentRect.top) / height) * 100,
                                width: (inputrect.width / width) * 100,
                                height: (inputrect.height / height) * 100,
                                page: pageIndex + 1,
                                role: element.querySelector(`[id="Signature_${role.Roles.name}"]`) ? element.querySelector(`[id="Signature_${role.Roles.name}"]`).getAttribute('role') : ''
                            });
                            const pdfPage = document.getElementsByClassName("pdf-page")[0];
                            var rect1 = pdfPage.getBoundingClientRect();


                            scaleX = originalWidth / rect1.width;
                            scaleY = originalHeight / rect1.height;
                            signatureX = (rect.left - parentRect.left) * scaleX;
                            signatureY = (rect.top - parentRect.top) * scaleY;
                            signaturePage = pageIndex + 1;

                            listCoordinates[index].placeHolderCoordinates.signatureXaxis = signatureX;
                            listCoordinates[index].placeHolderCoordinates.signatureYaxis = signatureY;
                            listCoordinates[index].placeHolderCoordinates.pageNumber = signaturePage;
                            listCoordinates[index].placeHolderCoordinates.imgWidth = "120";
                            listCoordinates[index].placeHolderCoordinates.imgHeight = "30";


                        }
                        else if (element.querySelector(`[id="Eseal_${role.Roles.name}"]`)) {
                            annotations.push({
                                type: 'Eseal',
                                x: ((rect.left - parentRect.left) / width) * 100,
                                y: ((rect.top - parentRect.top) / height) * 100,
                                width: (inputrect.width / width) * 100,
                                height: (inputrect.height / height) * 100,
                                page: pageIndex + 1,
                                role: element.querySelector(`[id="Eseal_${role.Roles.name}"]`) ? element.querySelector(`[id="Eseal_${role.Roles.name}"]`).getAttribute('role') : ''
                            });

                            const pdfPage = document.getElementsByClassName("pdf-page")[0];
                            var rect1 = pdfPage.getBoundingClientRect();
                            scaleX = originalWidth / rect1.width;
                            scaleY = originalHeight / rect1.height;
                            esealX = (rect.left - parentRect.left) * scaleX;
                            esealY = (rect.top - parentRect.top) * scaleY;
                            esealPage = pageIndex + 1;

                            listCoordinates[index].esealplaceHolderCoordinates.signatureXaxis = esealX;
                            listCoordinates[index].esealplaceHolderCoordinates.signatureYaxis = esealY;
                            listCoordinates[index].esealplaceHolderCoordinates.pageNumber = esealPage;
                            listCoordinates[index].esealplaceHolderCoordinates.imgWidth = '70';
                            listCoordinates[index].esealplaceHolderCoordinates.imgHeight = '70';

                        }
                    });
                }
            });


        });




        for (const groupName in radioGroups) {
            if (radioGroups.hasOwnProperty(groupName)) {
                annotations.push(radioGroups[groupName]);
                pdfAnnotations.push(pdfradioGroups[groupName]);
            }
        }




        console.log(annotations)

        var signingOrder = {};
        var roleAnnotations = {};



        var roleMap = []
        console.log(listCoordinates)
        Data.forEach((role, index) => {
            roleId = (role._id);

            signingOrder[roleId] = index + 1;

            if (listCoordinates[index]) {
                roleAnnotations[roleId] = listCoordinates[index];


            }

        });
        console.log(listCoordinates)
        roleDataList.forEach(rolelst => {
            var result = {};
            Data.forEach((role, index) => {
                roleId = (role._id);
                result[role._id] = rolelst[index];
                result[role._id]["RoleName"] = role.Roles.name;
            });
            roleMap.push(result);
        });



        console.log(roleMap);


        var fileFormData = new FormData();
        fileFormData.append("sequentialSigning", !sequence.checked);
        fileFormData.append("documentName", docName);

        var parentdivroles = document.getElementById('roles');
        var roleGroupDivs = parentdivroles.querySelectorAll('div.roles-group')
        var count = roleGroupDivs.length;
        if (count == 1) {
            fileFormData.append("RequestType", "Individual");
        } else {
            fileFormData.append("RequestType", "Bulk");
        }



        fileFormData.append("TemplateType", "PDF");
        fileFormData.append("daysToComplete", signDays);
        fileFormData.append("roleMappings", JSON.stringify(roleMap));
        fileFormData.append("preFilledData", JSON.stringify(preFilledData));
        fileFormData.append("htmlSchema", JSON.stringify(annotations));
        fileFormData.append("pdfSchema", JSON.stringify(pdfAnnotations));
        fileFormData.append("RoleAnnotations", JSON.stringify(roleAnnotations));
        fileFormData.append("roleSigningOrder", JSON.stringify(signingOrder));
        fileFormData.append("formId", tempid);

        SaveDocument(SendRequestUrl, fileFormData)
            .then((response) => {
                if (response.status == "Success") {
                    swal({
                        title: "Success",
                        text: response.message,
                        type: "success",
                    }, function (isConfirm) {
                        if (isConfirm) {
                            document.getElementById("navigationNetworkOverlay").style.display = "block";
                            window.location.href = FormRequestsSentUrl;
                        }
                    });

                    setTimeout(function () {
                        $('#overlay').hide();
                    }, 400);
                }
                else {
                    swal({
                        title: "Error",
                        text: response.message,
                        type: "error",
                    }, function (isConfirm) {
                        if (isConfirm) {
                            document.getElementById("navigationNetworkOverlay").style.display = "block";
                            window.location.href = DigitalFormsIndex;
                        }
                    });
                    setTimeout(function () {
                        $('#overlay').hide();
                    }, 400);

                }

            })

    }
    catch (error) {
        $('#overlay').hide();
        console.error("Error while sending document:", error);
        swal({
            title: "Error",
            text: "An unexpected error occurred. Please try again.",
            type: "error",
        });
    }

});

const toolbarButtons = document.querySelectorAll('#toolbar button');
toolbarButtons.forEach(button => {
    button.addEventListener('mousedown', onMouseDown);
});

function onMouseDown(event) {
    const type = event.target.id;
    const ghostElement = createGhostElement(event);

    document.body.appendChild(ghostElement);


    const offsetX = document.documentElement.scrollLeft || document.body.scrollLeft;

    const offsetY = document.documentElement.scrollTop || document.body.scrollTop;

    function onMouseMove(e) {
        ghostElement.style.left = e.clientX + offsetX + 'px';
        ghostElement.style.top = e.clientY + offsetY + 'px';
    }

    function onMouseUp(e) {
        const pageElements = document.elementsFromPoint(e.clientX, e.clientY);
        const pdfPage = pageElements.find(el => el.classList.contains('pdf-page'));

        if (pdfPage) {
            const annotationLayer = pdfPage.querySelector('.annotation-layer');
            const rect = pdfPage.getBoundingClientRect();
            const left = e.clientX - rect.left;
            const top = e.clientY - rect.top;
            const selectElement = document.getElementById('ClientSelect');
            const selectedRole = selectElement.value;

            if (type === "text-field") {

                const newHeader = '<h5 class="modal-title">Enter Field Name</h5>';
                const newBody = `<input type="text"  id="FieldNameInput" class="form-control"  placeholder="Enter Field Name">
                                    <span id="errorFieldName" style="color: red; display: none;"></span>
                                    <div class="form-check mt-2">
                                    <input type="checkbox"  style="margin-top:2%" id="mandatoryCheckbox" class="form-check-input" checked>
                                    <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
                                </div>
                                `;
                const newFooter = `
                                                        <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                                `;

                updateModalContent(newHeader, newBody, newFooter);

                document.getElementById('saveFieldName').addEventListener('click', () => {
                    const mancheckbox = document.getElementById('mandatoryCheckbox');

                    const isMandatory = mancheckbox.checked;
                    fieldName = document.getElementById('FieldNameInput').value + "_" + selectedRole;
                    if (fieldName.replace(/\s+/g, '') !== '') {
                        if (!fieldnameslist.includes(fieldName)) {

                            const element = createDraggableElement(type, left, top, fieldName, "", isMandatory);
                            annotationLayer.appendChild(element);

                            const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                            const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                            const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                            const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                            element.setAttribute('data-wpercent', wratio)
                            element.setAttribute('data-hpercent', hratio)
                            element.setAttribute('data-lpercent', lratio)
                            element.setAttribute('data-tpercent', tratio)

                            if ((element.offsetWidth + left) > rect.width) {
                                annotationLayer.removeChild(element);
                            } else {
                                fieldnameslist.push(fieldName);
                            }

                            $('#EditFields_Modal').modal('hide');
                        } else {
                            document.getElementById('errorFieldName').innerText = "Field Name already taken";
                            document.getElementById('errorFieldName').style.display = 'block';

                        }

                    } else {
                        document.getElementById('errorFieldName').innerText = "Field Name can't be empty";
                        document.getElementById('errorFieldName').style.display = 'block';

                    }

                });

                document.getElementById('FieldNameInput').addEventListener('click', function () {
                    document.getElementById('errorFieldName').style.display = 'none';
                });

                $('#EditFields_Modal').modal('show');

            }
            else if (type === "radio-button") {

                const radioGroupOptions = Object.keys(radioGroups).map(group => `<option value="${group}">${group}</option>`).join('');


                const newHeader = '<h5 class="modal-title">Radio Button Details</h5>';
                const newBody = `

                                             <div style='display:flex;'>
                                                <label>Select Group :</label>
                                                    <select id="radio-group-select" style="margin-left:5%;width:46%" >
                                                        <option value="">Select Group</option>
                                                        ${radioGroupOptions}
                                                    </select>

                                                        <button id="radio-add-new-group-btn" style='margin-left:2%;' class="btn btn-primary">Create</button>
                                             </div>
                                                 <span id="errorSelectFieldName" style="color: red; display: none;">Group Name can't be empty</span>
                                             <div style='display:none;margin-top:5%;' id='entergroup'></div>
                                                 <span id="errorInputGroupName" style="color: red; display: none;">Group Name can't be empty</span>
                                             <div style='display:flex;margin-top:5%;'>
                                                <label>Radio Value :</label>
                                                <input id="radio-value" style='margin-left:6%' placeholder="Radio Button Value">
                                             </div>
                                                 <span id="errorRadioValue" style="color: red; display: none;">Radio Value can't be empty</span>
                                                 <div class="form-check mt-2">
                                    <input type="checkbox"  style="margin-top:2%" id="mandatoryCheckbox" class="form-check-input" checked>
                                    <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
                                </div>
                                                 `;
                const newFooter = `
                                                            <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                                    `;

                updateModalContent(newHeader, newBody, newFooter);

                document.getElementById('radio-add-new-group-btn').addEventListener('click', (event) => {

                    if (!document.getElementById('radio-group-name')) {
                        const groupinput = document.createElement('input');
                        const grouplabel = document.createElement('label');
                        const groupdiv = document.getElementById('entergroup');
                        const selectGroup = document.getElementById('radio-group-select');

                        selectGroup.selectedIndex = 0;

                        groupdiv.style.display = 'flex';

                        groupdiv.style.marginTop = '5%';

                        grouplabel.innerHTML = 'Group Name :';

                        grouplabel.id = 'group-label';

                        groupinput.id = 'radio-group-name';

                        groupinput.placeholder = 'Enter Group Name';

                        groupinput.style.marginLeft = '5%';

                        groupdiv.appendChild(grouplabel);

                        groupdiv.appendChild(groupinput);

                    }

                })

                document.getElementById('radio-group-select').addEventListener('change', (event) => {

                    const selectelement = document.getElementById('radio-group-select');

                    if (selectelement.value !== "") {

                        const ele = document.getElementById('radio-group-name')

                        const elelabel = document.getElementById('group-label')

                        if (ele) {

                            ele.remove()

                        }

                        if (elelabel) {

                            elelabel.remove()

                        }

                        const groupdiv = document.getElementById('entergroup');

                        groupdiv.style.display = 'none';

                        const radioInputs = document.querySelectorAll('#pdf-container input[type="radio"]');
                        radioInputs.forEach((radioInput) => {

                            if (radioInput.name === (selectelement.value + "_" + selectedRole)) {

                                const mandatoryValue = radioInput.getAttribute('mandatory');

                                const mancheckbox = document.getElementById('mandatoryCheckbox');

                                if (mandatoryValue == "true") {

                                    mancheckbox.checked = true;
                                } else {

                                    mancheckbox.checked = false;
                                }
                            }
                        });
                    }
                })

                document.getElementById('saveFieldName').addEventListener('click', () => {
                    const mancheckbox = document.getElementById('mandatoryCheckbox');

                    const isMandatory = mancheckbox.checked;
                    const radioValue = document.getElementById('radio-value').value;
                    if (document.getElementById('radio-group-select').value === "") {
                        if (document.getElementById('radio-group-name') != undefined) {
                            if (document.getElementById('radio-group-name').value !== "") {
                                var selectedGroup = 'new-group';
                                var newGroupName = document.getElementById('radio-group-name').value;
                            } else {
                                toastr.error('please create or select group name');
                                return false;
                            }
                        } else {
                            toastr.error('please create or select group name');
                            return false;
                        }

                    } else if (document.getElementById('radio-group-select').value !== "") {
                        var selectedGroup = document.getElementById('radio-group-select').value;
                        var newGroupName = document.getElementById('radio-group-select').value;

                    } else {
                        toastr.error('please create or select group name');
                        return false;
                    }

                    var group = (selectedGroup === 'new-group' ? newGroupName : selectedGroup);

                    if (!radioGroups[group]) {
                        radioGroups[group] = [];
                    }
                    radioGroups[group].push(radioValue);

                    const element = createDraggableElement(type, left, top, group, radioValue, isMandatory);

                    annotationLayer.appendChild(element);

                    const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                    const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                    const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                    const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                    element.setAttribute('data-wpercent', wratio)
                    element.setAttribute('data-hpercent', hratio)
                    element.setAttribute('data-lpercent', lratio)
                    element.setAttribute('data-tpercent', tratio)
                    if ((element.offsetWidth + left) > rect.width) {
                        annotationLayer.removeChild(element);
                    }

                    $('#EditFields_Modal').modal('hide');
                });

                $('#EditFields_Modal').modal('show');
            }
            else if (type === "check-box") {
                // Swal.fire({
                //     title: 'Enter checkbox value',
                //     input: 'text',
                //     inputPlaceholder: 'value Name',
                //     showCancelButton: true
                // }).then(result => {
                //     if (result.isConfirmed) {
                //         valueName = result.value;
                //         const element = createDraggableElement(type, left, top, valueName);
                //         annotationLayer.appendChild(element);
                //         // updateFieldsList();
                //     }
                // });
                const newHeader = '<h5 class="modal-title">Enter checkbox value</h5>';
                const newBody = `<input type="text"  id="FieldNameInput" class="form-control"  placeholder="Enter Value">
                                    <span id="errorFieldName" style="color: red; display: none;"></span>
                                     <div class="form-check mt-2">
                                    <input type="checkbox"  style="margin-top:2%" id="mandatoryCheckbox" class="form-check-input" checked>
                                    <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
                                </div>
                                    `;
                const newFooter = `
                                                            <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                                    `;

                updateModalContent(newHeader, newBody, newFooter);

                document.getElementById('saveFieldName').addEventListener('click', () => {
                    const mancheckbox = document.getElementById('mandatoryCheckbox');

                    const isMandatory = mancheckbox.checked;
                    valueName = document.getElementById('FieldNameInput').value + "_" + selectedRole;
                    if (valueName.replace(/\s+/g, '') !== '') {
                        if (!fieldnameslist.includes(valueName)) {

                            const element = createDraggableElement(type, left, top, valueName, "", isMandatory);
                            annotationLayer.appendChild(element);
                            const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                            const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                            const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                            const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                            element.setAttribute('data-wpercent', wratio)
                            element.setAttribute('data-hpercent', hratio)
                            element.setAttribute('data-lpercent', lratio)
                            element.setAttribute('data-tpercent', tratio)
                            if ((element.offsetWidth + left) > rect.width) {
                                annotationLayer.removeChild(element);
                            } else {
                                fieldnameslist.push(valueName);
                            }
                            $('#EditFields_Modal').modal('hide');
                        } else {
                            document.getElementById('errorFieldName').innerText = "Field Name already taken";
                            document.getElementById('errorFieldName').style.display = 'block';
                        }


                    } else {
                        document.getElementById('errorFieldName').innerText = "Field Name can't be empty";
                        document.getElementById('errorFieldName').style.display = 'block';
                    }
                });

                document.getElementById('FieldNameInput').addEventListener('click', function () {
                    document.getElementById('errorFieldName').style.display = 'none';
                });

                $('#EditFields_Modal').modal('show');
            }
            else if (type === "select") {
                // const swalHtml = `
                //             <div>
                //                 <label>Group Name:</label>
                //                 <input id="select-group-name" placeholder="Enter Group Name" style="margin-left:10px;">
                //             </div>
                //             <div id="options-container" style="margin-top:10px;">
                //                 <div style='display:flex;margin-top:10px;'>
                //                     <label>Option 1:</label>
                //                     <input class="select-option" placeholder="Enter Option" style="margin-left:10px;">
                //                     <button class="delete-option-btn" style="margin-left:10px;">X</button>
                //                 </div>
                //             </div>
                //             <button id="add-new-option-btn" class="swal2-button" style="margin-top:10px;">+</button>
                //         `;

                // Swal.fire({
                //     title: 'Select Group Details',
                //     html: swalHtml,
                //     preConfirm: () => {
                //         const groupName = document.getElementById('select-group-name').value.trim();
                //         const options = Array.from(Swal.getPopup().getElementsByClassName('select-option'))
                //             .map(input => input.value.trim())
                //             .filter(value => value);

                //         if (!groupName) {
                //              toastr.error('please create or select group name');
                //             return false;
                //         }

                //         if (options.length === 0) {
                //             Swal.showValidationMessage('At least one option must be provided');
                //             return false;
                //         }
                //         console.log(options)
                //         return { groupName, options };
                //     },
                //     showCancelButton: true,
                //     didOpen: () => {
                //         document.getElementById('add-new-option-btn').addEventListener('click', () => {
                //             const optionsContainer = document.getElementById('options-container');
                //             const optionIndex = optionsContainer.children.length + 1;
                //             const optionDiv = document.createElement('div');
                //             optionDiv.style.display = 'flex';
                //             optionDiv.style.marginTop = '10px';

                //             const optionLabel = document.createElement('label');
                //             optionLabel.innerText = `Option ${optionIndex}:`;

                //             const optionInput = document.createElement('input');
                //             optionInput.classList.add('select-option');
                //             optionInput.placeholder = 'Enter Option';
                //             optionInput.style.marginLeft = '10px';

                //             const deleteButton = document.createElement('button');
                //             deleteButton.innerText = 'X';
                //             deleteButton.classList.add('delete-option-btn');
                //             deleteButton.style.marginLeft = '10px';
                //             deleteButton.addEventListener('click', () => {
                //                 optionsContainer.removeChild(optionDiv);
                //                 updateOptionLabels();
                //             });

                //             optionDiv.appendChild(optionLabel);
                //             optionDiv.appendChild(optionInput);
                //             optionDiv.appendChild(deleteButton);
                //             optionsContainer.appendChild(optionDiv);
                //         });
                //         Array.from(document.getElementsByClassName('delete-option-btn')).forEach(button => {
                //             button.addEventListener('click', (event) => {
                //                 const optionsContainer = document.getElementById('options-container');
                //                 const optionDiv = event.target.parentElement;
                //                 optionsContainer.removeChild(optionDiv);
                //                 updateOptionLabels();
                //             });
                //         });
                //     }

                // }).then(result => {
                //     if (result.isConfirmed) {
                //         const { groupName, options } = result.value;




                //         const element = createDraggableElement(type, left, top, groupName, options);
                //         annotationLayer.appendChild(element);

                //         // updateFieldsList();
                //     }
                // });
                const newHeader = '<h5 class="modal-title">Select Group Details</h5>';
                const newBody = `<div>
                                                    <label>Group Name:</label>
                                                    <input id="select-group-name" placeholder="Enter Group Name" style="margin-left:6px;">
                                                        <span id="errorFieldName" style="color: red; display: none;"></span>
                                                </div>
                                                <div id="edit-options-container" style="margin-top:10px;display:flex;align-items:center;flex-direction:column">
                                                    <div style='display:flex;margin-top:10px;'>

                                                        <input class="edit-select-option" id="firstoption" placeholder="Enter Option" style="margin-left:10px;">
                                                        <button class="edit-delete-option-btn" style="margin-left:10px;border:none;background:transparent;visibility:none"><i class="fa fa-trash"></i></button>

                                                    </div>
                                                        <span id="errorOption1" style="color: red; display: none;"></span>

                                                </div>
                                                   <div class="form-check mt-2">
                                    <input type="checkbox"  style="margin-top:2%" id="mandatoryCheckbox" class="form-check-input" checked>
                                    <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>

                                    <button id="edit-add-new-option-btn" class="btn btn-primary" style="margin-top:10px;float:right;">Add Option</button>
                                </div>
                                                    `;
                const newFooter = `
                                        <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                `;

                updateModalContent(newHeader, newBody, newFooter);

                document.getElementById('edit-add-new-option-btn').addEventListener('click', () => {
                    const optionsContainer = document.getElementById('edit-options-container');
                    const optionIndex = optionsContainer.children.length + 1;
                    const optionDiv = document.createElement('div');
                    optionDiv.style.display = 'flex';
                    optionDiv.style.marginTop = '10px';

                    const optionLabel = document.createElement('label');
                    optionLabel.innerText = `Option ${optionIndex}:`;

                    const optionInput = document.createElement('input');
                    optionInput.classList.add('edit-select-option');
                    optionInput.placeholder = 'Enter Option';
                    optionInput.style.marginLeft = '10px';

                    const deleteButton = document.createElement('button');

                    const icon = document.createElement('i');
                    icon.classList.add('fa', 'fa-trash');
                    deleteButton.appendChild(icon);
                    deleteButton.classList.add('edit-delete-option-btn');
                    deleteButton.style.marginLeft = '10px';
                    deleteButton.style.border = 'none';
                    deleteButton.style.background = 'transparent';
                    deleteButton.addEventListener('click', () => {
                        optionsContainer.removeChild(optionDiv);
                        updateOptionLabels();
                    });

                    //optionDiv.appendChild(optionLabel);
                    optionDiv.appendChild(optionInput);
                    optionDiv.appendChild(deleteButton);
                    optionsContainer.appendChild(optionDiv);
                });
                Array.from(document.getElementsByClassName('edit-delete-option-btn')).forEach(button => {
                    button.addEventListener('click', (event) => {
                        const optionsContainer = document.getElementById('edit-options-container');
                        const optionDiv = event.target.parentElement;
                        optionsContainer.removeChild(optionDiv);
                        updateOptionLabels();
                    });
                });

                document.getElementById('saveFieldName').addEventListener('click', () => {
                    const groupName = document.getElementById('select-group-name').value.trim() + "_" + selectedRole;
                    const firstoption = document.getElementById('firstoption').value.trim();
                    const options = Array.from(document.getElementsByClassName('edit-select-option'))
                        .map(input => input.value.trim())
                        .filter(value => value);

                    const mancheckbox = document.getElementById('mandatoryCheckbox');

                    const isMandatory = mancheckbox.checked;
                    if ((groupName.replace(/\s+/g, '') !== '') && (firstoption.replace(/\s+/g, '') !== '')) {
                        if (!fieldnameslist.includes(groupName)) {


                            const element = createDraggableElement(type, left, top, groupName, options, isMandatory);
                            annotationLayer.appendChild(element);
                            const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                            const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                            const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                            const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                            element.setAttribute('data-wpercent', wratio)
                            element.setAttribute('data-hpercent', hratio)
                            element.setAttribute('data-lpercent', lratio)
                            element.setAttribute('data-tpercent', tratio)
                            if ((element.offsetWidth + left) > rect.width) {
                                annotationLayer.removeChild(element);
                            } else {
                                fieldnameslist.push(groupName);
                            }
                            $('#EditFields_Modal').modal('hide');
                        } else {
                            document.getElementById('errorFieldName').innerText = "Group Name already taken";
                            document.getElementById('errorFieldName').style.display = 'block';
                        }
                    }
                    else if ((groupName.replace(/\s+/g, '') == '') && (firstoption.replace(/\s+/g, '') !== '')) {
                        document.getElementById('errorFieldName').innerText = "Group Name can't be empty";
                        document.getElementById('errorFieldName').style.display = 'block';
                    } else if ((groupName.replace(/\s+/g, '') !== '') && (firstoption.replace(/\s+/g, '') == '')) {
                        document.getElementById('errorOption1').innerText = "Options can't be empty";
                        document.getElementById('errorOption1').style.display = 'block';
                    } else {
                        document.getElementById('errorFieldName').innerText = "Group Name can't be empty";
                        document.getElementById('errorFieldName').style.display = 'block';
                        document.getElementById('errorOption1').innerText = "Options can't be empty";
                        document.getElementById('errorOption1').style.display = 'block';
                    }





                });

                $('#EditFields_Modal').modal('show');

            }
            else if (type === "date") {
                // Swal.fire({
                //     title: 'Enter Field Name',
                //     input: 'text',
                //     inputPlaceholder: 'Field Name',
                //     showCancelButton: true
                // }).then(result => {
                //     if (result.isConfirmed) {
                //         fieldName = result.value;
                //         const element = createDraggableElement(type, left, top, fieldName);
                //         annotationLayer.appendChild(element);
                //         // updateFieldsList();
                //     }
                // });
                const newHeader = '<h5 class="modal-title">Enter Field Name</h5>';
                const newBody = `<input type="text"  id="FieldNameInput" class="form-control"  placeholder="Enter Field Name">
                                    <span id="errorFieldName" style="color: red; display: none;"></span>
                                    <div class="form-check mt-2">
        <input type="checkbox"  style="margin-top:2%" id="mandatoryCheckbox" class="form-check-input" checked>
        <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
    </div>
                                    `;
                const newFooter = `
                                                            <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                                    `;

                updateModalContent(newHeader, newBody, newFooter);

                document.getElementById('saveFieldName').addEventListener('click', () => {
                    const mancheckbox = document.getElementById('mandatoryCheckbox');

                    const isMandatory = mancheckbox.checked;
                    fieldName = document.getElementById('FieldNameInput').value + "_" + selectedRole;
                    if (fieldName.replace(/\s+/g, '') !== '') {
                        if (!fieldnameslist.includes(fieldName)) {

                            const element = createDraggableElement(type, left, top, fieldName, "", isMandatory);
                            annotationLayer.appendChild(element);
                            const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                            const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                            const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                            const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                            element.setAttribute('data-wpercent', wratio)
                            element.setAttribute('data-hpercent', hratio)
                            element.setAttribute('data-lpercent', lratio)
                            element.setAttribute('data-tpercent', tratio)
                            if ((element.offsetWidth + left) > rect.width) {
                                annotationLayer.removeChild(element);
                            } else {
                                fieldnameslist.push(fieldName);
                            }
                            $('#EditFields_Modal').modal('hide');
                        } else {
                            document.getElementById('errorFieldName').innerText = "Field Name already taken";
                            document.getElementById('errorFieldName').style.display = 'block';
                        }


                    } else {
                        document.getElementById('errorFieldName').innerText = "Field Name can't be empty";
                        document.getElementById('errorFieldName').style.display = 'block';
                    }

                });

                document.getElementById('FieldNameInput').addEventListener('click', function () {
                    document.getElementById('errorFieldName').style.display = 'none';
                });

                $('#EditFields_Modal').modal('show');
            }
            else if (type === "plain-text") {
                const element = createDraggableElement(type, left, top);
                annotationLayer.appendChild(element);


                const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                element.setAttribute('data-wpercent', wratio)
                element.setAttribute('data-hpercent', hratio)
                element.setAttribute('data-lpercent', lratio)
                element.setAttribute('data-tpercent', tratio)
                if ((element.offsetWidth + left) > rect.width) {
                    annotationLayer.removeChild(element);
                }
                // updateFieldsList();
            }
            else if (type === "signature" || type === "eseal") {
                if (type === "signature") {
                    var fieldname = 'Signature' + "_" + selectedRole;
                } else {
                    var fieldname = 'Eseal' + "_" + selectedRole;
                }
                if (!fieldnameslist.includes(fieldname)) {

                    const element = createDraggableElement(type, left, top);
                    annotationLayer.appendChild(element);

                    const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                    const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                    const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                    const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                    element.setAttribute('data-wpercent', wratio)
                    element.setAttribute('data-hpercent', hratio)
                    element.setAttribute('data-lpercent', lratio)
                    element.setAttribute('data-tpercent', tratio)
                    if ((element.offsetWidth + left) > rect.width) {
                        annotationLayer.removeChild(element);
                    } else {
                        fieldnameslist.push(fieldname);
                    }
                    scaleX = originalWidth / rect.width;
                    scaleY = originalHeight / rect.height;
                } else {

                }


            }
            else if (type === 'websave' || type === 'webfill') {
                if (type === "websave") {
                    var fieldname = 'Wsave';
                } else {
                    var fieldname = 'Wfill';
                }
                if (!fieldnameslist.includes(fieldname)) {
                    const element = createDraggableElement(type, left, top);
                    annotationLayer.appendChild(element);

                    if ((element.offsetWidth + left) > rect.width) {
                        annotationLayer.removeChild(element);
                    } else {
                        fieldnameslist.push(fieldname);
                    }
                }

            }
            else if (type === 'imagefield') {

                const newHeader = '<h5 class="modal-title">Enter Image Name</h5>';
                const newBody = `<input type="text"  id="FieldNameInput" class="form-control"  placeholder="Enter Image Name">
                                        <span id="errorFieldName" style="color: red; display: none;"></span>
                                        <div class="form-check mt-2">
        <input type="checkbox"  style="margin-top:2%" id="mandatoryCheckbox" class="form-check-input" checked>
        <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
    </div>
                                        `;
                const newFooter = `
                                                                <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                                        `;

                updateModalContent(newHeader, newBody, newFooter);

                document.getElementById('saveFieldName').addEventListener('click', () => {
                    const mancheckbox = document.getElementById('mandatoryCheckbox');

                    const isMandatory = mancheckbox.checked;
                    fieldName = document.getElementById('FieldNameInput').value + "_" + selectedRole;
                    if (fieldName.replace(/\s+/g, '') !== '') {
                        if (!fieldnameslist.includes(fieldName)) {

                            const element = createDraggableElement(type, left, top, fieldName, "", isMandatory);
                            annotationLayer.appendChild(element);

                            const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                            const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                            const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                            const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                            element.setAttribute('data-wpercent', wratio)
                            element.setAttribute('data-hpercent', hratio)
                            element.setAttribute('data-lpercent', lratio)
                            element.setAttribute('data-tpercent', tratio)
                            if ((element.offsetWidth + left) > rect.width) {
                                annotationLayer.removeChild(element);
                            } else {
                                fieldnameslist.push(fieldName);
                            }
                            $('#EditFields_Modal').modal('hide');
                        } else {
                            document.getElementById('errorFieldName').innerText = "Field Name already taken";
                            document.getElementById('errorFieldName').style.display = 'block';
                        }


                    } else {
                        document.getElementById('errorFieldName').innerText = "Field Name can't be empty";
                        document.getElementById('errorFieldName').style.display = 'block';
                    }

                });

                document.getElementById('FieldNameInput').addEventListener('click', function () {
                    document.getElementById('errorFieldName').style.display = 'none';
                });

                $('#EditFields_Modal').modal('show');
            }
        }
        ghostElement.remove();
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function onClick(type) {
    // const pdfPage = document.querySelector('div.pdf-page');
    const pages = document.querySelectorAll('.pdf-page');
    let current = null;
    let minDistance = Infinity;

    pages.forEach(page => {
        const rect = page.getBoundingClientRect();
        const distance = Math.abs(rect.top);

        if (distance < minDistance) {
            minDistance = distance;
            pdfPage = page;
        }
    });
    if (pdfPage) {
        const annotationLayer = pdfPage.querySelector('.annotation-layer');
        const rect = pdfPage.getBoundingClientRect();
        const left = rect.width / 2 - 50;
        const top = rect.height / 2 - 50;
        const selectElement = document.getElementById('ClientSelect');
        const selectedRole = selectElement.value;

        if (type === "text-field") {

            const newHeader = '<h5 class="modal-title">Enter Field Name</h5>';
            const newBody = `<input type="text"  id="FieldNameInput" class="form-control"  placeholder="Enter Field Name">
                                    <span id="errorFieldName" style="color: red; display: none;"></span>
                                    <div class="form-check mt-2">
                                    <input type="checkbox"  style="margin-top:2%" id="mandatoryCheckbox" class="form-check-input" checked>
                                    <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
                                </div>
                                `;
            const newFooter = `
                                                        <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                                `;

            updateModalContent(newHeader, newBody, newFooter);

            const fieldNameInput = document.getElementById('FieldNameInput');
            fieldNameInput.addEventListener('keydown', (event) => {

                const allowedKeys = [
                    'Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                    'Delete', ' ', // Include space character explicitly
                ];

                const isLetterOrNumber = /^[a-zA-Z0-9]$/.test(event.key);

                if (!isLetterOrNumber && !allowedKeys.includes(event.key)) {
                    event.preventDefault();

                } else {

                }
            });

            document.getElementById('saveFieldName').addEventListener('click', () => {
                const mancheckbox = document.getElementById('mandatoryCheckbox');

                const isMandatory = mancheckbox.checked;
                fieldName = document.getElementById('FieldNameInput').value + "_" + selectedRole;
                if (fieldName.replace(/\s+/g, '') !== '') {
                    if (!fieldnameslist.includes(fieldName)) {

                        const element = createDraggableElement(type, left, top, fieldName, "", isMandatory);
                        annotationLayer.appendChild(element);
                        const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                        const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                        const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                        const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                        element.setAttribute('data-wpercent', wratio)
                        element.setAttribute('data-hpercent', hratio)
                        element.setAttribute('data-lpercent', lratio)
                        element.setAttribute('data-tpercent', tratio)
                        if ((element.offsetWidth + left) > rect.width) {
                            annotationLayer.removeChild(element);
                        } else {
                            fieldnameslist.push(fieldName);
                        }

                        $('#EditFields_Modal').modal('hide');
                    } else {
                        document.getElementById('errorFieldName').innerText = "Field Name already taken";
                        document.getElementById('errorFieldName').style.display = 'block';

                    }

                } else {
                    document.getElementById('errorFieldName').innerText = "Field Name can't be empty";
                    document.getElementById('errorFieldName').style.display = 'block';

                }

            });

            document.getElementById('FieldNameInput').addEventListener('click', function () {
                document.getElementById('errorFieldName').style.display = 'none';
            });

            $('#EditFields_Modal').modal('show');

        }
        else if (type === "radio-button") {

            const radioGroupOptions = Object.keys(radioGroups).map(group => `<option value="${group}">${group}</option>`).join('');


            const newHeader = '<h5 class="modal-title">Radio Button Details</h5>';
            const newBody = `

                                             <div style='display:flex;'>
                                                <label>Select Group :</label>
                                                    <select id="radio-group-select" style="margin-left:5%;width:46%" >
                                                        <option value="">Select Group</option>
                                                        ${radioGroupOptions}
                                                    </select>

                                                        <button id="radio-add-new-group-btn" style='margin-left:2%;' class="btn btn-primary">Create</button>
                                             </div>
                                                 <span id="errorSelectFieldName" style="color: red; display: none;">Group Name can't be empty</span>
                                             <div style='display:none;margin-top:5%;' id='entergroup'></div>
                                                 <span id="errorInputGroupName" style="color: red; display: none;">Group Name can't be empty</span>
                                             <div style='display:flex;margin-top:5%;'>
                                                <label>Radio Value :</label>
                                                <input id="radio-value" style='margin-left:6%' placeholder="Radio Button Value">
                                             </div>
                                                 <span id="errorRadioValue" style="color: red; display: none;">Radio Value can't be empty</span>
                                                 <div class="form-check mt-2">
                                    <input type="checkbox"  style="margin-top:2%" id="mandatoryCheckbox" class="form-check-input" checked>
                                    <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
                                </div>
                                                 `;
            const newFooter = `
                                                            <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                                    `;

            updateModalContent(newHeader, newBody, newFooter);



            document.getElementById('radio-add-new-group-btn').addEventListener('click', (event) => {

                if (!document.getElementById('radio-group-name')) {
                    const groupinput = document.createElement('input');
                    const grouplabel = document.createElement('label');
                    const groupdiv = document.getElementById('entergroup');
                    const selectGroup = document.getElementById('radio-group-select');

                    selectGroup.selectedIndex = 0;

                    groupdiv.style.display = 'flex';

                    groupdiv.style.marginTop = '5%';

                    grouplabel.innerHTML = 'Group Name :';

                    grouplabel.id = 'group-label';

                    groupinput.id = 'radio-group-name';

                    groupinput.placeholder = 'Enter Group Name';

                    groupinput.style.marginLeft = '5%';

                    groupdiv.appendChild(grouplabel);

                    groupdiv.appendChild(groupinput);

                }

            })

            document.getElementById('radio-group-select').addEventListener('change', (event) => {

                const selectelement = document.getElementById('radio-group-select');

                if (selectelement.value !== "") {

                    const ele = document.getElementById('radio-group-name')

                    const elelabel = document.getElementById('group-label')

                    if (ele) {

                        ele.remove()

                    }

                    if (elelabel) {

                        elelabel.remove()

                    }

                    const groupdiv = document.getElementById('entergroup');

                    groupdiv.style.display = 'none';

                    const radioInputs = document.querySelectorAll('#pdf-container input[type="radio"]');
                    radioInputs.forEach((radioInput) => {

                        if (radioInput.name === (selectelement.value + "_" + selectedRole)) {

                            const mandatoryValue = radioInput.getAttribute('mandatory');

                            const mancheckbox = document.getElementById('mandatoryCheckbox');

                            if (mandatoryValue == "true") {

                                mancheckbox.checked = true;
                            } else {

                                mancheckbox.checked = false;
                            }
                        }
                    });
                }
            })

            document.getElementById('saveFieldName').addEventListener('click', () => {
                const mancheckbox = document.getElementById('mandatoryCheckbox');

                const isMandatory = mancheckbox.checked;
                const radioValue = document.getElementById('radio-value').value;
                if (document.getElementById('radio-group-select').value === "") {
                    if (document.getElementById('radio-group-name') != undefined) {
                        if (document.getElementById('radio-group-name').value !== "") {
                            var selectedGroup = 'new-group';
                            var newGroupName = document.getElementById('radio-group-name').value;
                        } else {
                            toastr.error('please create or select group name');
                            return false;
                        }
                    } else {
                        toastr.error('please create or select group name');
                        return false;
                    }

                } else if (document.getElementById('radio-group-select').value !== "") {
                    var selectedGroup = document.getElementById('radio-group-select').value;
                    var newGroupName = document.getElementById('radio-group-select').value;

                } else {
                    toastr.error('please create or select group name');
                    return false;
                }

                var group = (selectedGroup === 'new-group' ? newGroupName : selectedGroup);

                if (!radioGroups[group]) {
                    radioGroups[group] = [];
                }
                radioGroups[group].push(radioValue);

                const element = createDraggableElement(type, left, top, group, radioValue, isMandatory);

                annotationLayer.appendChild(element);
                const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                element.setAttribute('data-wpercent', wratio)
                element.setAttribute('data-hpercent', hratio)
                element.setAttribute('data-lpercent', lratio)
                element.setAttribute('data-tpercent', tratio)
                if ((element.offsetWidth + left) > rect.width) {
                    annotationLayer.removeChild(element);
                }

                $('#EditFields_Modal').modal('hide');
            });

            $('#EditFields_Modal').modal('show');
        }
        else if (type === "check-box") {

            const newHeader = '<h5 class="modal-title">Enter checkbox value</h5>';
            const newBody = `<input type="text"  id="FieldNameInput" class="form-control"  placeholder="Enter Value">
                                    <span id="errorFieldName" style="color: red; display: none;"></span>
                                    <div class="form-check mt-2">
                                    <input type="checkbox"  style="margin-top:2%" id="mandatoryCheckbox" class="form-check-input" checked>
                                    <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
                                </div>
                                    `;
            const newFooter = `
                                                            <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                                    `;

            updateModalContent(newHeader, newBody, newFooter);

            const fieldNameInput = document.getElementById('FieldNameInput');
            fieldNameInput.addEventListener('keydown', (event) => {

                const allowedKeys = [
                    'Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                    'Delete', ' ', // Include space character explicitly
                ];

                const isLetterOrNumber = /^[a-zA-Z0-9]$/.test(event.key);

                if (!isLetterOrNumber && !allowedKeys.includes(event.key)) {
                    event.preventDefault();

                } else {

                }
            });

            document.getElementById('saveFieldName').addEventListener('click', () => {
                const mancheckbox = document.getElementById('mandatoryCheckbox');

                const isMandatory = mancheckbox.checked;
                valueName = document.getElementById('FieldNameInput').value + "_" + selectedRole;
                if (valueName.replace(/\s+/g, '') !== '') {
                    if (!fieldnameslist.includes(valueName)) {

                        const element = createDraggableElement(type, left, top, valueName, "", isMandatory);
                        annotationLayer.appendChild(element);
                        const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                        const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                        const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                        const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                        element.setAttribute('data-wpercent', wratio)
                        element.setAttribute('data-hpercent', hratio)
                        element.setAttribute('data-lpercent', lratio)
                        element.setAttribute('data-tpercent', tratio)
                        if ((element.offsetWidth + left) > rect.width) {
                            annotationLayer.removeChild(element);
                        } else {
                            fieldnameslist.push(valueName);
                        }
                        $('#EditFields_Modal').modal('hide');
                    } else {
                        document.getElementById('errorFieldName').innerText = "Field Name already taken";
                        document.getElementById('errorFieldName').style.display = 'block';
                    }


                } else {
                    document.getElementById('errorFieldName').innerText = "Field Name can't be empty";
                    document.getElementById('errorFieldName').style.display = 'block';
                }
            });

            document.getElementById('FieldNameInput').addEventListener('click', function () {
                document.getElementById('errorFieldName').style.display = 'none';
            });

            $('#EditFields_Modal').modal('show');
        }
        else if (type === "select") {


            const newHeader = '<h5 class="modal-title">Select Group Details</h5>';
            const newBody = `<div>
                                                    <label>Group Name:</label>
                                                    <input id="select-group-name" placeholder="Enter Group Name" style="margin-left:6px;">
                                                        <span id="errorFieldName" style="color: red; display: none;"></span>
                                                </div>
                                                <div id="edit-options-container" style="margin-top:10px;display:flex;align-items:center;flex-direction:column">
                                                    <div style='display:flex;margin-top:10px;'>

                                                        <input class="edit-select-option" id="firstoption" placeholder="Enter Option" style="margin-left:10px;">
                                                        <button class="edit-delete-option-btn" style="margin-left:10px;border:none;background:transparent;visibility:none"><i class="fa fa-trash"></i></button>

                                                    </div>
                                                        <span id="errorOption1" style="color: red; display: none;"></span>

                                                </div>
                                                   <div class="form-check mt-2">
                                    <input type="checkbox"  style="margin-top:2%" id="mandatoryCheckbox" class="form-check-input" checked>
                                    <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>

                                    <button id="edit-add-new-option-btn" class="btn btn-primary" style="margin-top:10px;float:right;">Add Option</button>
                                </div>
                                                    `;
            const newFooter = `
                                        <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                `;

            updateModalContent(newHeader, newBody, newFooter);

            const fieldNameInput = document.getElementById('select-group-name');
            fieldNameInput.addEventListener('keydown', (event) => {

                const allowedKeys = [
                    'Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                    'Delete', ' ', // Include space character explicitly
                ];

                const isLetterOrNumber = /^[a-zA-Z0-9]$/.test(event.key);

                if (!isLetterOrNumber && !allowedKeys.includes(event.key)) {
                    event.preventDefault();

                } else {

                }
            });

            document.getElementById('edit-add-new-option-btn').addEventListener('click', () => {
                const optionsContainer = document.getElementById('edit-options-container');
                const optionIndex = optionsContainer.children.length + 1;
                const optionDiv = document.createElement('div');
                optionDiv.style.display = 'flex';
                optionDiv.style.marginTop = '10px';

                const optionLabel = document.createElement('label');
                optionLabel.innerText = `Option ${optionIndex}:`;

                const optionInput = document.createElement('input');
                optionInput.classList.add('edit-select-option');
                optionInput.placeholder = 'Enter Option';
                optionInput.style.marginLeft = '10px';

                const deleteButton = document.createElement('button');

                const icon = document.createElement('i');
                icon.classList.add('fa', 'fa-trash');
                deleteButton.appendChild(icon);
                deleteButton.classList.add('edit-delete-option-btn');
                deleteButton.style.marginLeft = '10px';
                deleteButton.style.border = 'none';
                deleteButton.style.background = 'transparent';
                deleteButton.addEventListener('click', () => {
                    optionsContainer.removeChild(optionDiv);
                    updateOptionLabels();
                });

                //optionDiv.appendChild(optionLabel);
                optionDiv.appendChild(optionInput);
                optionDiv.appendChild(deleteButton);
                optionsContainer.appendChild(optionDiv);
            });
            Array.from(document.getElementsByClassName('edit-delete-option-btn')).forEach(button => {
                button.addEventListener('click', (event) => {
                    const optionsContainer = document.getElementById('edit-options-container');
                    const optionDiv = event.target.parentElement;
                    optionsContainer.removeChild(optionDiv);
                    updateOptionLabels();
                });
            });

            document.getElementById('saveFieldName').addEventListener('click', () => {
                const groupName = document.getElementById('select-group-name').value.trim() + "_" + selectedRole;
                const firstoption = document.getElementById('firstoption').value.trim();
                const options = Array.from(document.getElementsByClassName('edit-select-option'))
                    .map(input => input.value.trim())
                    .filter(value => value);

                const mancheckbox = document.getElementById('mandatoryCheckbox');

                const isMandatory = mancheckbox.checked;
                if ((groupName.replace(/\s+/g, '') !== '') && (firstoption.replace(/\s+/g, '') !== '')) {
                    if (!fieldnameslist.includes(groupName)) {


                        const element = createDraggableElement(type, left, top, groupName, options, isMandatory);
                        annotationLayer.appendChild(element);
                        const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                        const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                        const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                        const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                        element.setAttribute('data-wpercent', wratio)
                        element.setAttribute('data-hpercent', hratio)
                        element.setAttribute('data-lpercent', lratio)
                        element.setAttribute('data-tpercent', tratio)
                        if ((element.offsetWidth + left) > rect.width) {
                            annotationLayer.removeChild(element);
                        } else {
                            fieldnameslist.push(groupName);
                        }
                        $('#EditFields_Modal').modal('hide');
                    } else {
                        document.getElementById('errorFieldName').innerText = "Group Name already taken";
                        document.getElementById('errorFieldName').style.display = 'block';
                    }
                }
                else if ((groupName.replace(/\s+/g, '') == '') && (firstoption.replace(/\s+/g, '') !== '')) {
                    document.getElementById('errorFieldName').innerText = "Group Name can't be empty";
                    document.getElementById('errorFieldName').style.display = 'block';
                } else if ((groupName.replace(/\s+/g, '') !== '') && (firstoption.replace(/\s+/g, '') == '')) {
                    document.getElementById('errorOption1').innerText = "Options can't be empty";
                    document.getElementById('errorOption1').style.display = 'block';
                } else {
                    document.getElementById('errorFieldName').innerText = "Group Name can't be empty";
                    document.getElementById('errorFieldName').style.display = 'block';
                    document.getElementById('errorOption1').innerText = "Options can't be empty";
                    document.getElementById('errorOption1').style.display = 'block';
                }





            });

            $('#EditFields_Modal').modal('show');

        }
        else if (type === "date") {

            const newHeader = '<h5 class="modal-title">Enter Field Name</h5>';
            const newBody = `<input type="text"  id="FieldNameInput" class="form-control"  placeholder="Enter Field Name">
                                    <span id="errorFieldName" style="color: red; display: none;"></span>
                                    <div class="form-check mt-2">
        <input type="checkbox"  style="margin-top:2%" id="mandatoryCheckbox" class="form-check-input" checked>
        <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
    </div>
                                    `;
            const newFooter = `
                                                            <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                                    `;

            updateModalContent(newHeader, newBody, newFooter);

            const fieldNameInput = document.getElementById('FieldNameInput');
            fieldNameInput.addEventListener('keydown', (event) => {

                const allowedKeys = [
                    'Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                    'Delete', ' ', // Include space character explicitly
                ];

                const isLetterOrNumber = /^[a-zA-Z0-9]$/.test(event.key);

                if (!isLetterOrNumber && !allowedKeys.includes(event.key)) {
                    event.preventDefault();

                } else {

                }
            });

            document.getElementById('saveFieldName').addEventListener('click', () => {
                const mancheckbox = document.getElementById('mandatoryCheckbox');

                const isMandatory = mancheckbox.checked;
                fieldName = document.getElementById('FieldNameInput').value + "_" + selectedRole;
                if (fieldName.replace(/\s+/g, '') !== '') {
                    if (!fieldnameslist.includes(fieldName)) {

                        const element = createDraggableElement(type, left, top, fieldName, "", isMandatory);
                        annotationLayer.appendChild(element);


                        const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                        const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                        const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                        const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                        element.setAttribute('data-wpercent', wratio)
                        element.setAttribute('data-hpercent', hratio)
                        element.setAttribute('data-lpercent', lratio)
                        element.setAttribute('data-tpercent', tratio)

                        if ((element.offsetWidth + left) > rect.width) {
                            annotationLayer.removeChild(element);
                        } else {
                            fieldnameslist.push(fieldName);
                        }
                        $('#EditFields_Modal').modal('hide');
                    } else {
                        document.getElementById('errorFieldName').innerText = "Field Name already taken";
                        document.getElementById('errorFieldName').style.display = 'block';
                    }


                } else {
                    document.getElementById('errorFieldName').innerText = "Field Name can't be empty";
                    document.getElementById('errorFieldName').style.display = 'block';
                }

            });

            document.getElementById('FieldNameInput').addEventListener('click', function () {
                document.getElementById('errorFieldName').style.display = 'none';
            });

            $('#EditFields_Modal').modal('show');
        }
        else if (type === "plain-text") {
            const element = createDraggableElement(type, left, top);
            annotationLayer.appendChild(element);

            const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
            const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
            const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
            const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
            element.setAttribute('data-wpercent', wratio)
            element.setAttribute('data-hpercent', hratio)
            element.setAttribute('data-lpercent', lratio)
            element.setAttribute('data-tpercent', tratio)

            if ((element.offsetWidth + left) > rect.width) {
                annotationLayer.removeChild(element);
            }
            // updateFieldsList();
        }
        else if (type === "signature" || type === "eseal") {
            if (type === "signature") {
                var fieldname = 'Signature' + "_" + selectedRole;
            } else {
                var fieldname = 'Eseal' + "_" + selectedRole;
            }
            if (!fieldnameslist.includes(fieldname)) {

                const element = createDraggableElement(type, left, top);
                annotationLayer.appendChild(element);

                const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                element.setAttribute('data-wpercent', wratio)
                element.setAttribute('data-hpercent', hratio)
                element.setAttribute('data-lpercent', lratio)
                element.setAttribute('data-tpercent', tratio)

                if ((element.offsetWidth + left) > rect.width) {
                    annotationLayer.removeChild(element);
                } else {
                    fieldnameslist.push(fieldname);
                }
                scaleX = originalWidth / rect.width;
                scaleY = originalHeight / rect.height;
            } else {

            }


        }
        else if (type === 'websave' || type === 'webfill') {
            if (type === "websave") {
                var fieldname = 'Wsave';
            } else {
                var fieldname = 'Wfill';
            }
            if (!fieldnameslist.includes(fieldname)) {
                const element = createDraggableElement(type, left, top);
                annotationLayer.appendChild(element);

                if ((element.offsetWidth + left) > rect.width) {
                    annotationLayer.removeChild(element);
                } else {
                    fieldnameslist.push(fieldname);
                }
            }

        }
        else if (type === 'imagefield') {

            const newHeader = '<h5 class="modal-title">Enter Image Name</h5>';
            const newBody = `<input type="text"  id="FieldNameInput" class="form-control"  placeholder="Enter Image Name">
                                        <span id="errorFieldName" style="color: red; display: none;"></span>
                                        <div class="form-check mt-2">
        <input type="checkbox"  style="margin-top:2%" id="mandatoryCheckbox" class="form-check-input" checked>
        <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
    </div>
                                        `;
            const newFooter = `
                                                                <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                                        `;

            updateModalContent(newHeader, newBody, newFooter);

            const fieldNameInput = document.getElementById('FieldNameInput');
            fieldNameInput.addEventListener('keydown', (event) => {

                const allowedKeys = [
                    'Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                    'Delete', ' ', // Include space character explicitly
                ];

                const isLetterOrNumber = /^[a-zA-Z0-9]$/.test(event.key);

                if (!isLetterOrNumber && !allowedKeys.includes(event.key)) {
                    event.preventDefault();

                } else {

                }
            });
            document.getElementById('saveFieldName').addEventListener('click', () => {
                const mancheckbox = document.getElementById('mandatoryCheckbox');

                const isMandatory = mancheckbox.checked;
                fieldName = document.getElementById('FieldNameInput').value + "_" + selectedRole;
                if (fieldName.replace(/\s+/g, '') !== '') {
                    if (!fieldnameslist.includes(fieldName)) {

                        const element = createDraggableElement(type, left, top, fieldName, "", isMandatory);
                        annotationLayer.appendChild(element);

                        const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                        const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                        const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                        const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                        element.setAttribute('data-wpercent', wratio)
                        element.setAttribute('data-hpercent', hratio)
                        element.setAttribute('data-lpercent', lratio)
                        element.setAttribute('data-tpercent', tratio)

                        if ((element.offsetWidth + left) > rect.width) {
                            annotationLayer.removeChild(element);
                        } else {
                            fieldnameslist.push(fieldName);
                        }
                        $('#EditFields_Modal').modal('hide');
                    } else {
                        document.getElementById('errorFieldName').innerText = "Field Name already taken";
                        document.getElementById('errorFieldName').style.display = 'block';
                    }


                } else {
                    document.getElementById('errorFieldName').innerText = "Field Name can't be empty";
                    document.getElementById('errorFieldName').style.display = 'block';
                }

            });

            document.getElementById('FieldNameInput').addEventListener('click', function () {
                document.getElementById('errorFieldName').style.display = 'none';
            });

            $('#EditFields_Modal').modal('show');
        }
    }


}






function updateModalContent(headerContent, bodyContent, footerContent) {

    document.querySelector('#EditFields_Modal .modal-header').innerHTML = headerContent;


    document.querySelector('#EditFields_Modal .modal-body').innerHTML = bodyContent;


    document.querySelector('#EditFields_Modal .modal-footer').innerHTML = footerContent;
}

// function createDraggableElement(type, left, top, group, value) {
//     const element = document.createElement('div');
//     element.classList.add('draggable');
//     element.style.left = left + 'px';
//     element.style.top = top + 'px';
//     element.style.border = 'none';

//     const content = document.createElement('div');
//     content.classList.add('draggable-content');

//     if (type === 'text-field') {
//         const input = document.createElement('input');
//         input.type = 'text';
//         input.placeholder = 'Please Enter ' + fieldName;
//         input.classList.add('input-field');
//         input.id = fieldName;

//         input.addEventListener('input', () => {
//             if (input.value) {
//                 input.classList.add('has-value');
//             } else {
//                 input.classList.remove('has-value');
//             }
//         });

//         input.addEventListener('blur', () => {
//             if (input.value) {
//                 input.classList.add('has-value');
//             } else {
//                 input.classList.remove('has-value');
//             }
//         });

//         content.appendChild(input);
//     }
//     else if (type === 'radio-button') {

//         const radioField = document.createElement('input');
//         radioField.type = 'radio';
//         radioField.name = group;
//         radioField.value = value;
//         radioField.classList.add('input-field');
//         content.appendChild(radioField);

//     }
//     else if (type === 'check-box') {
//         const checkbox = document.createElement('input');
//         checkbox.type = 'checkbox';
//         checkbox.id = valueName;
//         checkbox.value = valueName;
//         checkbox.classList.add('input-field');


//         checkbox.addEventListener('change', () => {
//             if (checkbox.checked) {
//                 checkbox.classList.add('checked');
//             } else {
//                 checkbox.classList.remove('checked');
//             }
//         });

//         content.appendChild(checkbox);
//     }
//     else if (type === 'select') {

//         const select = document.createElement('select');
//         select.id = group;

//         select.classList.add('input-field');
//         select.style.border = '2px solid black';

//         const option = document.createElement('option');
//         option.value = "Select Option";
//         option.text = "Select Option";
//         select.appendChild(option);


//         value.forEach(optionText => {

//             const option = document.createElement('option');
//             option.value = optionText;
//             option.text = optionText;
//             select.appendChild(option);
//         });


//         // Add an event listener for change event
//         select.addEventListener('change', () => {
//             console.log(`Selected value: ${select.value}`);
//             if (select.value === "Select Option") {
//                 select.classList.remove('has-value');
//             } else {
//                 select.classList.add('has-value');
//             }

//         });

//         // Append the select element to a container

//         content.appendChild(select);
//     }
//     else if (type === 'date') {
//         const input = document.createElement('input');
//         input.type = 'date';
//         input.placeholder = 'Date Field';
//         input.classList.add('input-field');
//         input.style.color = '#636161';
//         input.id = fieldName;

//         input.addEventListener('input', () => {
//             if (input.value) {
//                 input.classList.add('has-value');
//                 input.style.color = 'black';
//             } else {
//                 input.classList.remove('has-value');
//                 input.style.color = '#636161';
//             }
//         });

//         input.addEventListener('blur', () => {
//             if (input.value) {
//                 input.classList.add('has-value');
//             } else {
//                 input.classList.remove('has-value');
//             }
//         });

//         content.appendChild(input);
//     }
//     else if (type === 'plain-text') {
//         const editableTextContainer = document.createElement('div');

//         editableTextContainer.classList.add('editable-text');
//         editableTextContainer.setAttribute('contenteditable', 'true');

//         editableTextContainer.innerText = 'Click to edit text';
//         editableTextContainer.addEventListener('input', function () {
//             // updateFieldsList();
//         });
//         content.appendChild(editableTextContainer);
//     }
//     else if (type === 'signature') {
//         element.style.padding = '0';
//         const input = document.createElement('div');
//         input.style.border = "1px solid #44aad1";




//         input.style.textAlign = 'center';

//         input.style.width = (canvasWidth * 0.15) + 'px';
//         input.style.height = (canvasWidth * 0.03) + 'px';
//         input.textContent = 'Signature';

//         input.style.backgroundColor = "#d8d7d78a";
//         input.style.color = "#44aad1";
//         input.style.fontSize = "77%";


//         input.id = 'Signature';

//         content.appendChild(input);
//     }
//     else if (type === 'eseal') {
//         element.style.padding = '0';
//         const input = document.createElement('div');
//         input.style.border = "1px solid #44aad1";




//         input.style.textAlign = 'center';
//         input.style.padding = '30%';
//         input.style.width = (canvasWidth * 0.15) + 'px';
//         input.style.height = (canvasWidth * 0.15) + 'px';
//         input.textContent = 'Eseal';

//         input.style.backgroundColor = "#d8d7d78a";
//         input.style.color = "#44aad1";
//         input.style.fontSize = "77%";



//         input.id = 'Eseal';

//         content.appendChild(input);
//     }
//     else if (type === 'webfill') {
//         var fillbutton = document.createElement("button");
//         fillbutton.textContent = "Auto Fill";
//         fillbutton.id = "Wfill";
//         fillbutton.style.textAlign = 'center';

//         fillbutton.style.width = (canvasWidth * 0.15) + 'px';
//         fillbutton.style.height = (canvasWidth * 0.05) + 'px';
//         fillbutton.style.color = "white";
//         fillbutton.style.backgroundColor = 'rgb(37 66 95)';
//         fillbutton.style.borderRadius = '5px';
//         fillbutton.style.fontSize = "77%";

//         content.appendChild(fillbutton);
//     }
//     else if (type === 'websave') {
//         var submitbutton = document.createElement("button");
//         submitbutton.textContent = "Submit";
//         submitbutton.id = "Wsave";
//         submitbutton.style.textAlign = 'center';

//         submitbutton.style.width = (canvasWidth * 0.15) + 'px';
//         submitbutton.style.height = (canvasWidth * 0.05) + 'px';
//         submitbutton.style.color = "white";
//         submitbutton.style.backgroundColor = 'rgb(37 66 95)';
//         submitbutton.style.borderRadius = '5px';
//         submitbutton.style.fontSize = "77%";

//         content.appendChild(submitbutton);
//     }
//     else if (type === 'imagefield') {



//         const imageContainer = document.createElement('div');
//         imageContainer.className = 'image-container';

//         const imageUpload = document.createElement('input');
//         imageUpload.setAttribute('type', 'file');
//         imageUpload.className = 'image-upload';
//         imageUpload.setAttribute('accept', 'image/*');

//         const uploadedImage = document.createElement('img');
//         uploadedImage.className = 'uploaded-image';
//         uploadedImage.setAttribute('alt', 'Uploaded Image');
//         uploadedImage.id = fieldName;

//         // Create the placeholder text
//         const placeholderText = document.createElement('span');
//         placeholderText.className = 'placeholder-text';
//         placeholderText.innerText = 'Upload Image';

//         // Create the remove button
//         const removeImageBtn = document.createElement('button');
//         removeImageBtn.className = 'remove-image-btn';
//         removeImageBtn.innerHTML = '&times;';

//         // Append elements to the image container

//         imageContainer.appendChild(imageUpload);
//         imageContainer.appendChild(uploadedImage);
//         imageContainer.appendChild(placeholderText);
//         imageContainer.appendChild(removeImageBtn);
//         imageUpload.addEventListener('change', function (event) {
//             const file = event.target.files[0];
//             if (file) {
//                 const reader = new FileReader();
//                 reader.onload = function (e) {
//                     uploadedImage.src = e.target.result;
//                     uploadedImage.style.display = 'block';

//                     placeholderText.style.display = 'none';
//                     removeImageBtn.classList.add('uploaded');
//                 };
//                 reader.readAsDataURL(file);
//             }
//         });


//         removeImageBtn.addEventListener('click', function () {
//             // Hide the image
//             uploadedImage.src = '';
//             uploadedImage.style.display = 'none';

//             // Show the placeholder text again
//             placeholderText.style.display = 'block';

//             // Hide the remove button
//             removeImageBtn.classList.remove('uploaded');

//             // Clear the file input value
//             imageUpload.value = '';
//         });

//         content.appendChild(imageContainer);

//     }
//     element.appendChild(content);
//     if (type !== 'signature' && type !== 'eseal' && type !== 'websave' && type !== 'webfill') {
//         addResizeHandles(content);

//     }

//     addEditIcon(content, type);
//     element.style.position = 'absolute';
//     element.style.pointerEvents = 'auto';  // Enable interactions
//     element.style.zIndex = '1000';  // Ensure it's on top of other elements


//     makeDraggable(element);

//     return element;
// }

function createDraggableElement(type, left, top, group, value, isMandatory) {
    const selectElement = document.getElementById('ClientSelect');
    const selectedRole = selectElement.value;
    const element = document.createElement('div');
    element.classList.add('draggable');
    element.style.left = left + 'px';
    element.style.top = top + 'px';
    element.style.border = 'none';
    if (type === 'radio-button') {
        element.style.padding = '0.8%';
    }
    const content = document.createElement('div');
    content.classList.add('draggable-content');

    if (type === 'text-field') {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Please Enter ' + fieldName.split("_")[0];
        input.classList.add('input-field');
        input.id = fieldName;
        input.setAttribute('role', selectedRole);
        input.setAttribute('mandatory', isMandatory);


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
    }
    else if (type === 'radio-button') {

        const radioField = document.createElement('input');
        radioField.type = 'radio';
        radioField.name = group + "_" + selectedRole;
        radioField.value = value;
        radioField.classList.add('input-field');
        // radioField.disabled = true;
        content.appendChild(radioField);
        radioField.setAttribute('role', selectedRole);
        radioField.setAttribute('mandatory', isMandatory);

    }
    else if (type === 'check-box') {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = valueName;
        checkbox.value = valueName.split("_")[1];
        checkbox.classList.add('input-field');
        checkbox.setAttribute('role', selectedRole);
        checkbox.setAttribute('mandatory', isMandatory);


        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                checkbox.classList.add('checked');
            } else {
                checkbox.classList.remove('checked');
            }
        });

        content.appendChild(checkbox);
    }
    else if (type === 'select') {

        const select = document.createElement('select');
        select.id = group;

        select.classList.add('input-field');
        select.style.border = '2px solid black';
        select.style.color = '#636161';

        const option = document.createElement('option');
        option.value = "Select Option";
        option.text = "Select Option";
        option.style.color = '#636161';

        select.appendChild(option);
        select.setAttribute('role', selectedRole);
        select.setAttribute('mandatory', isMandatory);


        value.forEach(optionText => {

            const option = document.createElement('option');
            option.value = optionText;
            option.text = optionText;
            option.style.color = 'black';
            select.appendChild(option);
        });


        // Add an event listener for change event
        select.addEventListener('change', (event) => {


            console.log(`Selected value: ${select.value}`);
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

        // Append the select element to a container

        content.appendChild(select);
    }
    else if (type === 'date') {
        const input = document.createElement('input');
        input.type = 'date';
        input.placeholder = 'Date Field';
        input.classList.add('input-field');

        input.style.width = '150%'
        input.setAttribute('data-flag', 'black');
        input.id = fieldName;
        input.setAttribute('role', selectedRole);
        input.setAttribute('mandatory', isMandatory);
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

        content.appendChild(input);
    }
    else if (type === 'plain-text') {
        const editableTextContainer = document.createElement('div');

        editableTextContainer.classList.add('editable-text');
        editableTextContainer.setAttribute('contenteditable', 'true');
        editableTextContainer.setAttribute('role', selectedRole);

        editableTextContainer.innerText = 'Click to edit text';
        editableTextContainer.addEventListener('input', function () {

        });
        editableTextContainer.addEventListener("focus", () => {
            if (editableTextContainer.innerText == "Click to edit text") {
                editableTextContainer.innerText = ""; // Clear the content
            }
        });

        // Add blur event listener to restore default text if left empty
        editableTextContainer.addEventListener("blur", () => {
            if (editableTextContainer.innerText.trim() == "") {
                editableTextContainer.innerText = "Click to edit text"; // Restore default text
            }
        });
        content.appendChild(editableTextContainer);
    }
    else if (type === 'signature') {
        element.style.padding = '0';
        const input = document.createElement('div');
        input.style.border = "1px solid #44aad1";




        input.style.textAlign = 'center';

        input.style.width = (canvasWidth * 0.15) + 'px';
        input.style.height = (canvasWidth * 0.03) + 'px';
        input.textContent = 'Signature';

        input.style.backgroundColor = "#d8d7d78a";
        input.style.color = "#44aad1";
        input.style.fontSize = "77%";


        input.id = 'Signature' + "_" + selectedRole;
        input.setAttribute('role', selectedRole);

        content.appendChild(input);
    }
    else if (type === 'eseal') {
        element.style.padding = '0';
        const input = document.createElement('div');
        input.style.border = "1px solid #44aad1";




        input.style.textAlign = 'center';
        input.style.padding = '30%';
        input.style.width = (canvasWidth * 0.15) + 'px';
        input.style.height = (canvasWidth * 0.15) + 'px';
        input.textContent = 'Eseal';

        input.style.backgroundColor = "#d8d7d78a";
        input.style.color = "#44aad1";
        input.style.fontSize = "77%";



        input.id = 'Eseal' + "_" + selectedRole;
        input.setAttribute('role', selectedRole);

        content.appendChild(input);
    }
    else if (type === 'webfill') {
        var fillbutton = document.createElement("button");
        fillbutton.textContent = "Auto Fill";
        fillbutton.id = "Wfill";
        fillbutton.style.textAlign = 'center';

        fillbutton.style.width = (canvasWidth * 0.15) + 'px';
        fillbutton.style.height = (canvasWidth * 0.05) + 'px';
        fillbutton.style.color = "white";
        fillbutton.style.backgroundColor = 'rgb(37 66 95)';
        fillbutton.style.borderRadius = '5px';
        fillbutton.style.fontSize = "77%";

        content.appendChild(fillbutton);
    }
    else if (type === 'websave') {
        var submitbutton = document.createElement("button");
        submitbutton.textContent = "Submit";
        submitbutton.id = "Wsave";
        submitbutton.style.textAlign = 'center';

        submitbutton.style.width = (canvasWidth * 0.15) + 'px';
        submitbutton.style.height = (canvasWidth * 0.05) + 'px';
        submitbutton.style.color = "white";
        submitbutton.style.backgroundColor = 'rgb(37 66 95)';
        submitbutton.style.borderRadius = '5px';
        submitbutton.style.fontSize = "77%";

        content.appendChild(submitbutton);
    }
    else if (type === 'imagefield') {



        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';

        const imageUpload = document.createElement('input');
        imageUpload.setAttribute('type', 'file');
        imageUpload.className = 'image-upload';
        imageUpload.setAttribute('accept', 'image/*');

        const uploadedImage = document.createElement('img');
        uploadedImage.className = 'uploaded-image';
        uploadedImage.setAttribute('alt', 'Uploaded Image');
        uploadedImage.id = fieldName;
        uploadedImage.setAttribute('role', selectedRole);
        uploadedImage.setAttribute('mandatory', isMandatory);

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

    }

    element.appendChild(content);
    if (type !== 'signature' && type !== 'eseal' && type !== 'websave' && type !== 'webfill') {
        addResizeHandles(content);

    }

    addEditIcon(content, type);


    element.style.position = 'absolute';
    element.style.pointerEvents = 'auto';  // Enable interactions
    element.style.zIndex = '1000';  // Ensure it's on top of other elements


    makeDraggable(element);

    return element;
}


function createGhostElement(event) {
    const element = document.createElement('div');
    element.classList.add('draggable');

    const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;

    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;

    if (event.target.id === 'text-field') {

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Text Field';
        input.classList.add('input-field');
        element.appendChild(input);

    }
    else if (event.target.id === 'radio-button') {

        const radioField = document.createElement('input');
        radioField.type = 'radio';
        radioField.name = "group";
        radioField.value = "value";
        radioField.classList.add('input-field');
        element.appendChild(radioField);

    }
    else if (event.target.id === 'check-box') {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = "valueName";
        checkbox.value = "valueName";
        checkbox.classList.add('input-field');
        element.appendChild(checkbox);
    }
    else if (event.target.id === 'select') {
        const select = document.createElement('select');
        select.id = "group";

        select.classList.add('input-field');

        const option = document.createElement('option');
        option.value = "Select Option";
        option.text = "Select Option";
        select.appendChild(option);
        element.appendChild(select)
    }
    else if (event.target.id === 'date' || event.target.id === 'Date of Birth') {
        const input = document.createElement('input');
        input.type = 'date';
        input.placeholder = 'Date Field';
        input.classList.add('input-field');
        input.id = "fieldName";
        input.style.width = '150%'


        element.appendChild(input);
    }
    else if (event.target.id === 'plain-text') {
        const editableTextContainer = document.createElement('div');

        editableTextContainer.classList.add('editable-text');
        editableTextContainer.setAttribute('contenteditable', 'true');

        editableTextContainer.innerText = 'Click to edit text';

        element.appendChild(editableTextContainer);
    }
    else if (event.target.id === 'signature') {
        const input = document.createElement('div');
        input.style.border = "1px solid #44aad1";




        input.style.textAlign = 'center';

        input.style.width = (canvasWidth * 0.15) + 'px';
        input.style.height = (canvasWidth * 0.03) + 'px';
        input.textContent = 'Signature';

        input.style.backgroundColor = "#d8d7d78a";
        input.style.color = "#44aad1";
        input.style.fontSize = "77%";

        element.appendChild(input);
    }
    else if (event.target.id === 'eseal') {
        const input = document.createElement('div');
        input.style.border = "1px solid #44aad1";
        input.style.textAlign = 'center';
        input.style.padding = '30%';
        input.style.width = (canvasWidth * 0.15) + 'px';
        input.style.height = (canvasWidth * 0.15) + 'px';
        input.textContent = 'Eseal';

        input.style.backgroundColor = "#d8d7d78a";
        input.style.color = "#44aad1";
        input.style.fontSize = "77%";
        element.appendChild(input);
    }
    else if (event.target.id === 'websave') {
        var submitbutton = document.createElement("button");
        submitbutton.textContent = "Submit";
        submitbutton.style.textAlign = 'center';

        submitbutton.style.width = (canvasWidth * 0.15) + 'px';
        submitbutton.style.height = (canvasWidth * 0.05) + 'px';
        submitbutton.style.color = "white";
        submitbutton.style.backgroundColor = 'rgb(37 66 95)';
        submitbutton.style.borderRadius = '5px';
        submitbutton.style.fontSize = "77%";
        element.appendChild(submitbutton);
    }
    else if (event.target.id === 'webfill') {
        var fillbutton = document.createElement("button");
        fillbutton.textContent = "Auto Fill";
        fillbutton.style.textAlign = 'center';

        fillbutton.style.width = (canvasWidth * 0.15) + 'px';
        fillbutton.style.height = (canvasWidth * 0.05) + 'px';
        fillbutton.style.color = "white";
        fillbutton.style.backgroundColor = 'rgb(37 66 95)';
        fillbutton.style.borderRadius = '5px';
        fillbutton.style.fontSize = "77%";
        element.appendChild(fillbutton);
    }
    else if (event.target.id === 'imagefield' || event.target.id === 'Selfie') {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';

        // Create the placeholder text
        const placeholderText = document.createElement('span');
        placeholderText.className = 'placeholder-text';
        placeholderText.innerText = 'Upload Image';

        imageContainer.appendChild(placeholderText);
        element.appendChild(imageContainer);
    }
    else {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Text Field';
        input.classList.add('input-field');
        element.appendChild(input);
    }

    element.style.position = 'absolute';
    element.style.pointerEvents = 'none';  // Disable interactions while dragging
    element.style.zIndex = '1000';
    element.style.opacity = '0.5';
    element.style.left = (event.clientX + scrollLeft) + 'px';
    element.style.top = (event.clientY + scrollTop) + 'px';

    return element;
}

function addResizeHandles(content) {
    const handles = ['bottom-right'];
    handles.forEach(position => {
        const handle = document.createElement('div');
        handle.classList.add('resize-handle', position);
        content.appendChild(handle);

        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            resizeStart(e, content, position);
        });
    });
}

function addEditIcon(content, type) {
    const editIcon = document.createElement('div');
    editIcon.classList.add('edit-icon', 'top-right');
    editIcon.innerHTML = '✏️';


    // Add event listener for edit action
    if (type === 'text' || type === 'text-field') {
        editIcon.addEventListener('click', () => {

            const firstChild = content.firstElementChild;

            const newHeader = '<h5 class="modal-title">Update Field Name</h5>';
            const newBody = `<input type="text" value="${firstChild.id}" id="FieldNameInput" class="form-control"  placeholder="Enter new field name">
                            <span id="errorFieldName" style="color: red; display: none;"></span>
                            <div class="form-check mt-3">
                <input type="checkbox" id="mandatoryCheckbox"  style="margin-top:2%" class="form-check-input" ${firstChild.getAttribute('mandatory') === 'true' ? 'checked' : ''}>
            <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
        </div>
                            `;
            const newFooter = `
                                                <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                               <button type="button" class="btn btn-danger" style="color:red;"  id="deleteFieldName">Delete</button>
                                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                        `;

            // Update the modal content
            updateModalContent(newHeader, newBody, newFooter);

            document.getElementById('saveFieldName').addEventListener('click', () => {
                const mancheckbox = document.getElementById('mandatoryCheckbox');

                const isMandatory = mancheckbox.checked;

                if ((document.getElementById('FieldNameInput').value).replace(/\s+/g, '') !== '') {
                    if (!fieldnameslist.includes(document.getElementById('FieldNameInput').value) || (firstChild.id === document.getElementById('FieldNameInput').value)) {

                        fieldnameslist.push(document.getElementById('FieldNameInput').value);
                        fieldnameslist = fieldnameslist.filter(item => item !== firstChild.id);
                        firstChild.setAttribute('mandatory', isMandatory);
                        firstChild.id = document.getElementById('FieldNameInput').value;
                        $('#EditFields_Modal').modal('hide');
                    } else {
                        document.getElementById('errorFieldName').innerText = "Field Name already taken";
                        document.getElementById('errorFieldName').style.display = 'block';

                    }

                } else {
                    document.getElementById('errorFieldName').innerText = "Field Name can't be empty";
                    document.getElementById('errorFieldName').style.display = 'block';

                }
            });
            document.getElementById('deleteFieldName').addEventListener('click', () => {
                const element = content.parentElement;
                fieldnameslist = fieldnameslist.filter(item => item !== firstChild.id);
                element.remove();
                $('#EditFields_Modal').modal('hide');
            });
            // Show the modal
            $('#EditFields_Modal').modal('show');



        });
    }
    else if (type === 'checkbox' || type === 'check-box') {
        editIcon.addEventListener('click', () => {
            const firstChild = content.firstElementChild;

            const newHeader = '<h5 class="modal-title">Update Field Name</h5>';
            const newBody = `<input type="text" value="${firstChild.id}" id="FieldNameInput" class="form-control"  placeholder="Enter new field name">
                            <span id="errorFieldName" style="color: red; display: none;"></span>

                            <div class="form-check mt-3">
                <input type="checkbox" id="mandatoryCheckbox"  style="margin-top:2%" class="form-check-input" ${firstChild.getAttribute('mandatory') === 'true' ? 'checked' : ''}>
            <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
        </div>
                            `;
            const newFooter = `
                                                    <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                        <button type="button" class="btn btn-danger" style="color:red;"  id="deleteFieldName">Delete</button>
                                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                            `;

            // Update the modal content
            updateModalContent(newHeader, newBody, newFooter);

            document.getElementById('saveFieldName').addEventListener('click', () => {

                const mancheckbox = document.getElementById('mandatoryCheckbox');

                const isMandatory = mancheckbox.checked;
                if ((document.getElementById('FieldNameInput').value).replace(/\s+/g, '') !== '') {
                    if (!fieldnameslist.includes(document.getElementById('FieldNameInput').value) || (firstChild.id === document.getElementById('FieldNameInput').value)) {

                        fieldnameslist.push(document.getElementById('FieldNameInput').value);
                        fieldnameslist = fieldnameslist.filter(item => item !== firstChild.id);

                        firstChild.setAttribute('mandatory', isMandatory);
                        firstChild.id = document.getElementById('FieldNameInput').value;
                        firstChild.value = document.getElementById('FieldNameInput').value;
                        $('#EditFields_Modal').modal('hide');
                    } else {
                        document.getElementById('errorFieldName').innerText = "Field Name already taken";
                        document.getElementById('errorFieldName').style.display = 'block';

                    }

                } else {
                    document.getElementById('errorFieldName').innerText = "Field Name can't be empty";
                    document.getElementById('errorFieldName').style.display = 'block';

                }
            });
            document.getElementById('deleteFieldName').addEventListener('click', () => {
                const element = content.parentElement;
                fieldnameslist = fieldnameslist.filter(item => item !== firstChild.id);
                element.remove();
                $('#EditFields_Modal').modal('hide');
            });
            // Show the modal
            $('#EditFields_Modal').modal('show');

        });

    }
    else if (type === "select") {
        editIcon.addEventListener('click', () => {
            const firstChild = content.firstElementChild;


            const newHeader = '<h5 class="modal-title">Update Select Field</h5>';
            const newBody = `
                                    <div>
                                        <label>Group Name:</label>
                                        <input id="edit-select-group-name" value="${firstChild.id}" placeholder="Enter Group Name" style="margin-left:6px;">
                                            <span id="errorFieldName" style="color: red; display: none;"></span>
                                    </div>
                                        <div id="edit-options-container" style="margin-top:10px;margin-left:8%">
                                        ${Array.from(firstChild.options).map((group, index) => {
                if (group.text === "Select Option") {
                    return '';
                }
                return `
                                            <div style='display:flex;margin-top:10px;'>
                                                <label>Option ${index}:</label>
                                                <input class="select-option" placeholder="Enter Option" value="${group.text}" style="margin-left:10px;">

                                                <button class="edit-delete-option-btn" style="margin-left:10px;border:none;background:transparent;"><i class="fa fa-trash"></i></button>
                                            </div>
                                            `;
            }).join('')}
                                    </div>


                                         <div class="form-check mt-3">
                <input type="checkbox"  style="margin-top:2%" id="mandatoryCheckbox" class="form-check-input" ${firstChild.getAttribute('mandatory') === 'true' ? 'checked' : ''}>
            <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
            <button id="edit-add-new-option-btn" class="btn btn-primary" style="margin-top:10px;float:right;">Add Option</button>
        </div>


                                `;

            const newFooter = `
                                                        <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                            <button type="button" class="btn btn-danger" style="color:red;"  id="deleteFieldName">Delete</button>
                                                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                                `;

            updateModalContent(newHeader, newBody, newFooter);

            const addButton = document.querySelector('#edit-add-new-option-btn');
            const optionsContainer = document.querySelector('#edit-options-container');

            addButton.addEventListener('click', () => {
                const newOptionIndex = optionsContainer.children.length;
                optionsContainer.insertAdjacentHTML('beforeend', `
                                <div style='display:flex;margin-top:10px;'>
                                    <label>Option ${newOptionIndex + 1}:</label>
                                    <input class="select-option" placeholder="Enter Option" style="margin-left:10px;">

                                    <button class="edit-delete-option-btn" style="margin-left:10px;border:none;background:transparent;"><i class="fa fa-trash"></i></button>
                                </div>
                            `);
            });



            optionsContainer.addEventListener('click', (event) => {

                if (event.target.classList.contains('fa-trash')) {
                    (event.target.parentElement).parentElement.remove();

                    Array.from(optionsContainer.children).forEach((child, index) => {
                        child.querySelector('label').textContent = `Option ${index}:`;
                    });
                }
            });

            document.getElementById('saveFieldName').addEventListener('click', () => {
                const mancheckbox = document.getElementById('mandatoryCheckbox');

                const isMandatory = mancheckbox.checked;
                const groupName = document.querySelector('#edit-select-group-name').value;
                const options = Array.from(document.querySelectorAll('.select-option')).map(input => input.value);



                if (groupName.replace(/\s+/g, '') !== '') {
                    if (!fieldnameslist.includes(groupName) || firstChild.id === groupName) {

                        fieldnameslist = fieldnameslist.filter(item => item !== firstChild.id);
                        fieldnameslist.push(groupName);

                        firstChild.setAttribute('mandatory', isMandatory);
                        firstChild.id = groupName;
                        firstChild.innerHTML = '';


                        var optionElement = document.createElement('option');
                        optionElement.textContent = "Select Option";
                        optionElement.value = "Select Option";
                        firstChild.appendChild(optionElement);

                        options.forEach(option => {
                            var optionElement = document.createElement('option');
                            optionElement.textContent = option;
                            optionElement.value = option;
                            firstChild.appendChild(optionElement);
                        });

                        $('#EditFields_Modal').modal('hide');

                    } else {
                        document.getElementById('errorFieldName').innerText = "Group Name already taken";
                        document.getElementById('errorFieldName').style.display = 'block';
                    }
                } else {
                    document.getElementById('errorFieldName').innerText = "Group Name can't be empty";
                    document.getElementById('errorFieldName').style.display = 'block';
                }
            });
            document.getElementById('deleteFieldName').addEventListener('click', () => {
                const element = content.parentElement;
                fieldnameslist = fieldnameslist.filter(item => item !== firstChild.id);
                element.remove();
                $('#EditFields_Modal').modal('hide');
            });
            // Show the modal
            $('#EditFields_Modal').modal('show');

        });

    }
    else if (type === 'date') {
        editIcon.addEventListener('click', () => {
            const firstChild = content.firstElementChild;

            const newHeader = '<h5 class="modal-title">Update Field Name</h5>';
            const newBody = `<input type="text" value="${firstChild.id}" id="FieldNameInput" class="form-control"  placeholder="Enter new field name">
                            <span id="errorFieldName" style="color: red; display: none;"></span>
                            <div class="form-check mt-3">
                <input type="checkbox"  style="margin-top:2%" id="mandatoryCheckbox" class="form-check-input" ${firstChild.getAttribute('mandatory') === 'true' ? 'checked' : ''}>
            <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
        </div>
                            `;
            const newFooter = `
                                                        <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                            <button type="button" class="btn btn-danger" style="color:red;"  id="deleteFieldName">Delete</button>
                                                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                                `;

            // Update the modal content
            updateModalContent(newHeader, newBody, newFooter);

            document.getElementById('saveFieldName').addEventListener('click', () => {
                const mancheckbox = document.getElementById('mandatoryCheckbox');

                const isMandatory = mancheckbox.checked;

                if ((document.getElementById('FieldNameInput').value).replace(/\s+/g, '') !== '') {
                    if (!fieldnameslist.includes(document.getElementById('FieldNameInput').value) || (firstChild.id === document.getElementById('FieldNameInput').value)) {

                        fieldnameslist.push(document.getElementById('FieldNameInput').value);
                        fieldnameslist = fieldnameslist.filter(item => item !== firstChild.id);

                        firstChild.setAttribute('mandatory', isMandatory);
                        firstChild.id = document.getElementById('FieldNameInput').value;
                        $('#EditFields_Modal').modal('hide');
                    } else {
                        document.getElementById('errorFieldName').innerText = "Field Name already taken";
                        document.getElementById('errorFieldName').style.display = 'block';

                    }

                } else {
                    document.getElementById('errorFieldName').innerText = "Field Name can't be empty";
                    document.getElementById('errorFieldName').style.display = 'block';

                }
            });
            document.getElementById('deleteFieldName').addEventListener('click', () => {
                const element = content.parentElement;
                fieldnameslist = fieldnameslist.filter(item => item !== firstChild.id);
                element.remove();
                $('#EditFields_Modal').modal('hide');
            });

            // Show the modal
            $('#EditFields_Modal').modal('show');

        });

    }
    else if (type === 'plain-text') {
        editIcon.addEventListener('click', () => {
            const firstChild = content.firstElementChild;

            const newHeader = '<h5 class="modal-title">Do you want to delete this field?</h5>';
            const newBody = `<input type="text" value="${firstChild.innerHTML}" id="FieldNameInput" class="form-control"  placeholder="Enter new field name" readonly>`;
            const newFooter = `
                                                            <button type="button" class="btn btn-primary"  id="deleteFieldName">Delete</button>
                                                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                                    `;

            // Update the modal content
            updateModalContent(newHeader, newBody, newFooter);

            document.getElementById('deleteFieldName').addEventListener('click', () => {
                const element = content.parentElement;
                element.remove();
                $('#EditFields_Modal').modal('hide');
            });

            // Show the modal
            $('#EditFields_Modal').modal('show');

        });

    }
    else if (type === 'radio' || type === 'radio-button') {
        const firstChild = content.firstElementChild;
        editIcon.addEventListener('click', () => {


            const newHeader = '<h5 class="modal-title">Update Radio Group</h5>';
            const newBody = `
                            <div style='display:flex; margin-bottom:7%;'>
                                 <label for="group-name">Group Name :</label>
                                <input id="edit-group-name" style="margin-left:5%" class="swal2-input" value="${firstChild.name}">
                            </div>
                            <div style='display:flex;'>
                               <label for="radio-values">Radio Value  :</label>
                                    <div id="edit-radio-values-container" style="margin-left:6%">
                                        <div class="radio-value-item"  id="radio-item-${firstChild.value}">
                                                <input class="swal2-input"  type="text" value="${firstChild.value}" id="radio-value-${firstChild.value}">
                                    </div>
                                </div>
                            </div>
                            <div class="form-check mt-3">
                <input type="checkbox"  style="margin-top:2%" id="mandatoryCheckbox" class="form-check-input" ${firstChild.getAttribute('mandatory') === 'true' ? 'checked' : ''}>
            <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
        </div>
                             `;
            const newFooter = `
                                                    <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                        <button type="button" class="btn btn-danger" style="color:red;"  id="deleteFieldName">Delete</button>
                                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                            `;

            // Update the modal content
            updateModalContent(newHeader, newBody, newFooter);

            document.getElementById('saveFieldName').addEventListener('click', () => {

                const mancheckbox = document.getElementById('mandatoryCheckbox');

                const isMandatory = mancheckbox.checked;
                const updatedGroupName = document.getElementById('edit-group-name').value.trim();
                const newValues = [];
                document.querySelectorAll('#edit-radio-values-container input').forEach(input => {
                    newValues.push(input.value.trim());
                });
                firstChild.name = updatedGroupName;
                const radioInputs = document.querySelectorAll('#pdf-container input[type="radio"]');
                radioInputs.forEach((radioInput) => {
                    if (radioInput.name == updatedGroupName) {
                        radioInput.setAttribute('mandatory', isMandatory);
                    }
                });


                firstChild.setAttribute('mandatory', isMandatory);
                firstChild.value = newValues[0];
                radioGroups[firstChild.name] = radioGroups[updatedGroupName]

                $('#EditFields_Modal').modal('hide');
            });
            document.getElementById('deleteFieldName').addEventListener('click', () => {
                const element = content.parentElement;
                element.remove();
                $('#EditFields_Modal').modal('hide');
            });

            // Show the modal
            $('#EditFields_Modal').modal('show');

        });

    }
    else if (type === 'signature' || type === 'Signature') {
        editIcon.addEventListener('click', () => {
            const firstChild = content.firstElementChild;

            const newHeader = '<h5 class="modal-title">Do you want to delete this field?</h5>';
            const newBody = `<input type="text" value="${firstChild.id}" id="FieldNameInput" class="form-control"  placeholder="Enter new field name">`;
            const newFooter = `
                                                                <button type="button" class="btn btn-primary"  id="deleteFieldName">Delete</button>
                                                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                                        `;

            // Update the modal content
            updateModalContent(newHeader, newBody, newFooter);

            document.getElementById('deleteFieldName').addEventListener('click', () => {
                const element = content.parentElement;
                fieldnameslist = fieldnameslist.filter(item => item !== firstChild.id);
                element.remove();
                $('#EditFields_Modal').modal('hide');
            });

            // Show the modal
            $('#EditFields_Modal').modal('show');

        });
    }
    else if (type === 'eseal' || type === 'Eseal') {
        editIcon.addEventListener('click', () => {
            const firstChild = content.firstElementChild;

            const newHeader = '<h5 class="modal-title">Do you want to delete this field?</h5>';
            const newBody = `<input type="text" value="${firstChild.id}" id="FieldNameInput" class="form-control"  placeholder="Enter new field name">`;
            const newFooter = `
                                                                    <button type="button" class="btn btn-primary"  id="deleteFieldName">Delete</button>
                                                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                                            `;

            // Update the modal content
            updateModalContent(newHeader, newBody, newFooter);

            document.getElementById('deleteFieldName').addEventListener('click', () => {
                const element = content.parentElement;
                fieldnameslist = fieldnameslist.filter(item => item !== firstChild.id);
                element.remove();
                $('#EditFields_Modal').modal('hide');
            });

            // Show the modal
            $('#EditFields_Modal').modal('show');

        });
    }
    else if (type === 'Wsave') {
        editIcon.addEventListener('click', () => {
            const firstChild = content.firstElementChild;

            const newHeader = '<h5 class="modal-title">Do you want to delete this field?</h5>';
            const newBody = `<input type="text" value="This button is used to submit form" id="FieldNameInput" class="form-control"  placeholder="Enter new field name">`;
            const newFooter = `
                                                                        <button type="button" class="btn btn-danger"  id="deleteFieldName">Delete</button>
                                                                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                                                `;

            // Update the modal content
            updateModalContent(newHeader, newBody, newFooter);

            document.getElementById('deleteFieldName').addEventListener('click', () => {
                const element = content.parentElement;
                fieldnameslist = fieldnameslist.filter(item => item !== firstChild.id);
                element.remove();
                $('#EditFields_Modal').modal('hide');
            });

            // Show the modal
            $('#EditFields_Modal').modal('show');

        });
    }
    else if (type === 'Wfill') {
        editIcon.addEventListener('click', () => {
            const firstChild = content.firstElementChild;

            const newHeader = '<h5 class="modal-title">Do you want to delete this field?</h5>';
            const newBody = `<input type="text" value="This button is used to auto fill" id="FieldNameInput" class="form-control"  placeholder="Enter new field name">`;
            const newFooter = `
                                                                            <button type="button" class="btn btn-danger"  id="deleteFieldName">Delete</button>
                                                                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                                                    `;

            // Update the modal content
            updateModalContent(newHeader, newBody, newFooter);

            document.getElementById('deleteFieldName').addEventListener('click', () => {
                const element = content.parentElement;
                fieldnameslist = fieldnameslist.filter(item => item !== firstChild.id);
                element.remove();
                $('#EditFields_Modal').modal('hide');
            });

            // Show the modal
            $('#EditFields_Modal').modal('show');

        });
    }
    else if (type === 'imagefield') {
        editIcon.addEventListener('click', () => {

            const ele = content.firstElementChild;
            const secondChild = ele.children[1];


            const newHeader = '<h5 class="modal-title">Update Field Name</h5>';
            const newBody = `<input type="text" value="${secondChild.id}" id="FieldNameInput" class="form-control"  placeholder="Enter new field name">
                                <span id="errorFieldName" style="color: red; display: none;"></span>
                                <div class="form-check mt-3">
                <input type="checkbox"  style="margin-top:2%" id="mandatoryCheckbox" class="form-check-input" ${secondChild.getAttribute('mandatory') === 'true' ? 'checked' : ''}>
            <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
        </div>

                                `;
            const newFooter = `
                                                    <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                   <button type="button" class="btn btn-danger" style="color:red;"  id="deleteFieldName">Delete</button>
                                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                            `;

            // Update the modal content
            updateModalContent(newHeader, newBody, newFooter);

            document.getElementById('saveFieldName').addEventListener('click', () => {
                const mancheckbox = document.getElementById('mandatoryCheckbox');

                const isMandatory = mancheckbox.checked;

                if ((document.getElementById('FieldNameInput').value).replace(/\s+/g, '') !== '') {
                    if (!fieldnameslist.includes(document.getElementById('FieldNameInput').value) || (secondChild.id === document.getElementById('FieldNameInput').value)) {

                        fieldnameslist.push(document.getElementById('FieldNameInput').value);
                        fieldnameslist = fieldnameslist.filter(item => item !== secondChild.id);

                        secondChild.setAttribute('mandatory', isMandatory);
                        secondChild.id = document.getElementById('FieldNameInput').value;


                        $('#EditFields_Modal').modal('hide');
                    } else {
                        document.getElementById('errorFieldName').innerText = "Field Name already taken";
                        document.getElementById('errorFieldName').style.display = 'block';

                    }

                } else {
                    document.getElementById('errorFieldName').innerText = "Field Name can't be empty";
                    document.getElementById('errorFieldName').style.display = 'block';

                }
            });
            document.getElementById('deleteFieldName').addEventListener('click', () => {
                const element = content.parentElement;
                fieldnameslist = fieldnameslist.filter(item => item !== secondChild.id);
                element.remove();
                $('#EditFields_Modal').modal('hide');
            });
            // Show the modal
            $('#EditFields_Modal').modal('show');



        });
    }
    content.appendChild(editIcon);
}

function resizeStart(e, content, handlePosition) {
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = parseFloat(getComputedStyle(content.firstChild, null).width.replace('px', ''));
    const startHeight = parseFloat(getComputedStyle(content.firstChild, null).height.replace('px', ''));
    const isRadioButton = content.firstChild.type === 'radio';
    const isCheckBox = content.firstChild.type === 'checkbox';



    function resizeMove(e) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;

        if (handlePosition.includes('right')) {
            newWidth = startWidth + dx;
        } else if (handlePosition.includes('left')) {
            newWidth = startWidth - dx;
            content.style.left = `${content.offsetLeft + dx}px`; // Adjust position
        }

        if (handlePosition.includes('bottom')) {
            newHeight = startHeight + dy;
        } else if (handlePosition.includes('top')) {
            newHeight = startHeight - dy;
            content.style.top = `${content.offsetTop + dy}px`; // Adjust position
        }


        if (isRadioButton || isCheckBox) {

            const newSize = Math.min(newWidth, newHeight);
            content.firstChild.style.width = `${newSize}px`;
            content.firstChild.style.height = `${newSize}px`;

            const wratio = (newSize / (document.querySelector('canvas')).getBoundingClientRect().width);
            const hratio = (newSize / (document.querySelector('canvas')).getBoundingClientRect().height);

            content.parentElement.setAttribute('data-wpercent', wratio)
            content.parentElement.setAttribute('data-hpercent', hratio)
        } else {
            content.firstChild.style.width = `${newWidth}px`;
            content.firstChild.style.height = `${newHeight}px`;

            const wratio = (newWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
            const hratio = (newHeight / (document.querySelector('canvas')).getBoundingClientRect().height);

            content.parentElement.setAttribute('data-wpercent', wratio)
            content.parentElement.setAttribute('data-hpercent', hratio)
        }

        // Dynamically adjust font size based on height
        const fontSize = newHeight / 2; // You can adjust the divisor for better scaling
        content.firstChild.style.fontSize = `${fontSize}px`;
    }


    function resizeEnd() {
        document.removeEventListener('mousemove', resizeMove);
        document.removeEventListener('mouseup', resizeEnd);
    }

    document.addEventListener('mousemove', resizeMove);
    document.addEventListener('mouseup', resizeEnd);
}

function makeDraggable(element) {
    let offsetX, offsetY, isDragging = false;
    var newLeft;
    var newTop;
    element.addEventListener('mousedown', (e) => {
        if (!e.target.classList.contains('resize-handle') && !e.target.classList.contains('edit-icon') && !e.target.classList.contains('input-field') && !e.target.classList.contains('editable-text') && !e.target.classList.contains('image-upload') && !e.target.classList.contains('remove-image-btn')) {
            isDragging = true;
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }
    });



    function onMouseMove(e) {
        if (isDragging) {
            const pageRect = element.parentElement.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect(); // Get bounding rect of the draggable element

            // Calculate the new position of the draggable element
            newLeft = e.clientX - pageRect.left - offsetX;
            newTop = e.clientY - pageRect.top - offsetY;

            // Boundary checks for left, right, top, and bottom of the layer
            if (newLeft < 0) {
                newLeft = 0; // Restrict to the left boundary
            } else if (newLeft + elementRect.width > pageRect.width) {
                newLeft = pageRect.width - elementRect.width; // Restrict to the right boundary
            }

            if (newTop < 0) {
                newTop = 0; // Restrict to the top boundary
            } else if (newTop + elementRect.height > pageRect.height) {
                newTop = pageRect.height - elementRect.height; // Restrict to the bottom boundary
            }

            // Apply the new position to the element
            element.style.left = `${newLeft}px`;
            element.style.top = `${newTop}px`;
            // element.style.left = `${e.clientX - pageRect.left - offsetX}px`;
            // element.style.top = `${e.clientY - pageRect.top - offsetY}px`;
        }
    }

    function onMouseUp(e) {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);



        const pdfPages = document.querySelectorAll('.pdf-page');

        const draggableRect = element.getBoundingClientRect();

        // Loop through all pages to find where the draggable belongs
        for (let i = 0; i < pdfPages.length; i++) {
            const page = pdfPages[i];
            const pageRect = page.getBoundingClientRect();

            if (isInside(draggableRect, pageRect)) {
                // Move the draggable to the correct page's annotation layer
                const annotationLayer = page.querySelector('.annotation-layer');
                annotationLayer.appendChild(element);
                break; // Exit the loop once the correct page is found
            }
        }
        // var pageRect = element.parentElement.getBoundingClientRect();
        // element.style.left = `${e.clientX - pageRect.left - offsetX}px`;
        // element.style.top = `${e.clientY - pageRect.top - offsetY}px`;
        element.style.left = newLeft;
        element.style.top = newTop;

        const lratio = (newLeft / (document.querySelector('canvas')).getBoundingClientRect().width);
        const tratio = (newTop / (document.querySelector('canvas')).getBoundingClientRect().height);

        element.setAttribute('data-lpercent', lratio)
        element.setAttribute('data-tpercent', tratio)
    }
}

function isInside(elementRect, pageRect) {
    return (
        elementRect.top >= pageRect.top &&
        elementRect.bottom <= pageRect.bottom
    );
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
            success: function (data) {
                resolve(data)
            },
            error: function (err) {
                reject(err)
            }
        });
    });
}

function sendEmailToGetThumbnail(email) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: OrgDetailsByEmailUrl,
            data: { email: email },
            success: function (response) {
                if (response.success === undefined) {
                    console.log(response)
                    const orgsAndIds = {};
                    const orgDetails = response.orgDtos;

                    orgDetails.forEach(org => {
                        orgsAndIds[org.orgName] = [org.orgUid, response.userProfile.suid];
                    });
                    orgsAndIds["SELF"] = [response.userProfile.ugpassEmail, response.userProfile.suid];
                    resolve(orgsAndIds); // Resolve the Promise with the data
                } else {
                    resolve(null); // No data to return
                }
            },
            error: ajaxErrorHandler
        });
    });
}

function validateInput(event) {
    const input = event.target;

    if (input.value.length > 1) {
        input.value = input.value.slice(0, 1);
        return;
    }

    let value = parseInt(input.value);
    const min = parseInt(input.min, 10);
    const max = parseInt(input.max, 10);

    if (isNaN(value) || value < min || value > max) {
        input.value = '';
    }


}

async function handle_delegation_orgid_suid(selectedorgid, selectedsuid, email, index) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "GET",
            url: GetDelegationbyorgidsuidUrl,
            data: {
                organizationId: selectedorgid,
                suid: selectedsuid
            },
            beforeSend: function () {

                document.getElementById("navigationNetworkOverlay").style.display = "block";
            },
            complete: function () {


                document.getElementById("navigationNetworkOverlay").style.display = "none";
            },
            success: function (response) {
                var iscancelled = false;
                if (response.success == true) {
                    var result_list = response.result;
                    var swal_list = [];
                    var list_data = [];
                    for (var i = 0; i < result_list.length; i++) {
                        var obj_data = {
                            email: result_list[i].delegateeEmail,
                            suid: result_list[i].delegateeSuid,
                        };
                        swal_list.push(result_list[i].delegateeEmail);
                        list_data.push(obj_data);
                    }

                    if (response.result.length > 0) {
                        let text = "";
                        swal_list.forEach(function (value) {
                            text += value + "\n";
                        });

                        console.log(swal_list);

                        if (index == 0) {
                            swal({
                                title: "",
                                text: email + " " + "currently having an active delegation." + "\n" + "Form can't be sent to this account",
                                type: "info",
                            }, function (isConfirm) {
                                if (isConfirm) {
                                    var response_data_obj = {
                                        swallist: swal_list,
                                        listdata: list_data,
                                        delegateeid: response.result[0].delegationId,
                                        iscancelled: false

                                    }

                                    resolve(response_data_obj);

                                }


                            });
                        }
                        else {
                            swal({
                                title: "",
                                text: email + " currently has an active delegation." + "\n\n" + "Delegatee: " + swal_list,
                                type: "info",
                                showCancelButton: true,
                                confirmButtonColor: "#DD6B55",
                                confirmButtonText: "Proceed",
                                cancelButtonText: "Cancel",
                                closeOnConfirm: true,
                                closeOnCancel: true,

                            }, function (isConfirm) {
                                if (isConfirm) {
                                    var response_data_obj = {
                                        swallist: swal_list,
                                        listdata: list_data,
                                        delegateeid: response.result[0].delegationId,
                                        iscancelled: false

                                    }

                                    resolve(response_data_obj);

                                } else {
                                    var response_data_obj = {
                                        swallist: swal_list,
                                        listdata: list_data,
                                        delegateeid: response.result[0].delegationId,
                                        iscancelled: true

                                    }

                                    resolve(response_data_obj);

                                }


                            })

                        }



                    } else {
                        var response_data_obj = {
                            swallist: "",
                            listdata: [],
                            delegateeid: '',

                        }
                        resolve(response_data_obj);
                    }
                } else {
                    swal({
                        title: "Error",
                        text: response.message || "Unknown error occurred",
                        type: "error",
                    }, function (isConfirm) {
                        if (isConfirm) {

                        }
                    });
                    resolve(false);
                }
                console.log(response);
            },
            error: function (error) {
                resolve(false);
                ajaxErrorHandler(error);

            }
        });
    });
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