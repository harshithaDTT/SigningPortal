
var roleList = [];
var i = 2;

var inputId = '';
var inputEmail = '';
var inputDesc = '';


var radioGroups = {};
var originalHeight = "";
var originalWidth = "";
var scaleX = "";
var scaleY = "";
var signatureX = "";
var signatureY = "";
var signaturePage = "";
var esealX = "";
var esealY = "";
var esealPage = "";
var annotations = [];
var pdfAnnotations = [];
var fieldnameslist = [];
var canvasWidth;
var canvasHeight;

var docConfig = {
    "name": "",
    "daysToComplete": "",
    "numberOfSignatures": "",
    "allSigRequired": true,
    "publishGlobally": false,
    "sequentialSigning": true,
    "AdvancedSettings": { "signatureSelectedName": "", "signatureSelectedImage": "", "previewsignselected": false, "previewesealselected": false, "esealSelectedImage": "", "esealSelectedName": "", "signatureSelected": 0, "esealSelected": 0 },
    "documentName": "",
    "docType": "PDF",
    "htmlSchema": "",
    "pdfSchema": ""

};
var roles = [{
    "email": "",
    "name": "Client",
    "description": "Default Signer Role"
}];
var rolesConfig = [];

const pdfjsLib = window['pdfjs-dist/build/pdf'];
if (!pdfjsLib) {
    console.error('PDF.js library is not loaded.');
} else {

    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
}
$('#allSignRequiredCheckbox').change(function () {
    $('#noSignRequiredInput').toggle(!$(this).prop('checked'));
});
const pdfContainer = document.getElementById('pdf-container');

$(document).ready(function () {
    // $('#digitalforms').addClass('active');
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl, {
            customClass: "custom-tooltip",
            placement: 'bottom',
            html: true,
        });
    });

    function showTooltipsSequentially(index = 0) {
        if (index >= tooltipList.length) return;

        let tooltip = tooltipList[index];
        tooltip.show();

        setTimeout(() => {
            tooltip.hide();
            showTooltipsSequentially(index + 1);
        }, 2000);
    }


    setTimeout(() => {
        showTooltipsSequentially();
    }, 500);


    $('#networkOverlay').hide();
    const tempname = document.getElementById("tempName");

    if (tempname) {

        tempname.addEventListener('keydown', (event) => {

            const allowedKeys = [
                'Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                'Delete', ' ', '_'
            ];

            const isLetterOrNumber = /^[a-zA-Z0-9]$/.test(event.key);

            if (!isLetterOrNumber && !allowedKeys.includes(event.key)) {
                event.preventDefault();

            } else {

            }
        });

    }



    var filebase64 = document.getElementById('filebase64').value;

    document.getElementById('templateSelect').selectedIndex = 1;
    const innerModel = document.getElementById('innerModel');
    innerModel.style.display = 'block';
    document.getElementById('templateSelect').style.width = '80%';
    document.getElementById('templateSelect').style.width = '80%';

    document.getElementById('EsealtemplateSelect').selectedIndex = 3;
    const esealinnerModel = document.getElementById('EsealInnerModel');
    esealinnerModel.style.display = 'block';
    document.getElementById('EsealtemplateSelect').style.width = '80%';
    document.getElementById('EsealtemplateSelect').style.width = '80%';
    processfile(filebase64)

    $("#btnSaveForm").on("click", SaveForm);

    // Stepper
    $("#circle1").on("click", DocConfig);
    $("#circle2").on("click", Roles);
    $("#circle3").on("click", RolesConfiguraton);

    // Validation
    $("#daysToComplete").on("input", validateInput);

    // Signature & Eseal template preview
    $("#btnSignaturePreview").on("click", ImagePreview);
    $("#btnEsealPreview").on("click", ImagePreviewEseal);

    // Navigation
    $("#btnNextStep1").on("click", Roles);
    $("#inputRoleName1").on("input", validateRole);
    $("#btnRemoveRole1").on("click", function () { removeRoleCard(1); });
    $("#btnAddRole").on("click", addNewRole);
    $("#btnPrevRoles").on("click", DocConfig);
    $("#btnNextRoles").on("click", RolesConfiguraton);

    // Toolbar buttons
    $("#plain-text").on("click", () => onClick("plain-text"));
    $("#text-field").on("click", () => onClick("text-field"));
    $("#radio-button").on("click", () => onClick("radio-button"));
    $("#check-box").on("click", () => onClick("check-box"));
    $("#select").on("click", () => onClick("select"));
    $("#date").on("click", () => onClick("date"));
    $("#signature").on("click", () => onClick("signature"));
    $("#eseal").on("click", () => onClick("eseal"));
    $("#imagefield").on("click", () => onClick("imagefield"));

    // Recommended fields
    $("#Full\\ Name").on("click", () => onClickRecommended("Full Name"));
    $("#Gender").on("click", () => onClickRecommended("Gender"));
    $("#email").on("click", () => onClickRecommended("email"));
    $("#Phone\\ Number").on("click", () => onClickRecommended("Phone Number"));
    $("#Date\\ of\\ Birth").on("click", () => onClickRecommended("Date of Birth"));
    $("#firstname").on("click", () => onClickRecommended("firstname"));
    $("#lastname").on("click", () => onClickRecommended("lastname"));
    $("#Nation").on("click", () => onClickRecommended("Nation"));
    $("#Selfie").on("click", () => onClickRecommended("Selfie"));

    // Navigation roles configuration
    $("#btnPrevRolesConfig").on("click", Roles);

    // Modals
    $("#btnCloseSignaturePreview").on("click", closeModal);
    $("#btnCloseEsealPreview").on("click", closeModals);

    $("#addRoleBtn").on("click", addNewRole);
    document.getElementById('templateSelect').addEventListener('change', function () {


        const signSelectedValue = this.value;
        const innerModel = document.getElementById('innerModel');

        innerModel.style.display = (signSelectedValue !== 'Choose Template') ? 'block' : 'none';
        document.getElementById('templateSelect').style.width = (signSelectedValue !== 'Choose Template') ? '80%' : '100%';
    });
    $('#templateSelect').change(function () {

        // Get the selected option's data-preview attribute
        var preview = $('option:selected', this).attr('data-preview');

        // Update the preview image
        $("#signatureTemplatePreviewImage").attr("src", "data:image/png;base64," + preview);


    });
    document.getElementById('EsealtemplateSelect').addEventListener('change', function () {

        esealSelectedValue = this.value;
        if (esealSelectedValue !== 'Choose Template') {
            document.getElementById('EsealInnerModel').style.display = 'block';
            document.getElementById('EsealtemplateSelect').style.width = '80%';
        } else {
            document.getElementById('EsealInnerModel').style.display = 'none';
            document.getElementById('EsealtemplateSelect').style.width = '100%'
        }
    });
    $('#EsealtemplateSelect').change(function () {

        // Get the selected option's data-preview attribute
        var preview = $('option:selected', this).attr('data-preview');
        // Update the preview image
        $("#esealSignatureTemplatePreviewImage").attr("src", "data:image/png;base64," + preview);
    });
})


// function replaceKeywordInPlace(keyword, newKeyword) {
//     fieldnameslist.forEach((word, index) => {
//         const parts = word.split('_'); // Split the word by "_"
//         if (parts[1] === keyword) {
//             parts[1] = newKeyword; // Replace the second part with the new keyword
//             fieldnameslist[index] = parts.join('_'); // Update the word in the array
//         }
//     });

//     document.querySelectorAll('.pdf-page').forEach((pageElement) => {
//             const annotationLayer = pageElement.querySelector('.annotation-layer');

//             var matchingElements = annotationLayer.querySelectorAll(`[role="${keyword}"]`);

//             matchingElements.forEach((element) => {


//                 if (element.querySelector('input[type="radio"]')){
//                     var newid = (element.id).split('_')[0] + '_' + newKeyword;
//                     element.name = newid;
//                 }
//                 else if (element.querySelector('input[type="text"]')){
//                     var newid = (element.id).split('_')[0] + '_' + newKeyword;
//                     element.id = newid;
//                 }
//                 else if (element.querySelector('input[type="checkbox"]')){
//                     var newid = (element.id).split('_')[0] + '_' + newKeyword;
//                     element.id = newid;
//                 }
//                 else if (element.querySelector('select')){
//                     var newid = (element.id).split('_')[0] + '_' + newKeyword;
//                     element.id = newid;
//                 }
//                 else if (element.querySelector('input[type="date"]')){
//                     var newid = (element.id).split('_')[0] + '_' + newKeyword;
//                     element.id = newid;
//                 }

//                 else if (element.id == `Signature_${keyword}`){
//                     var newid = (element.id).split('_')[0] + '_' + newKeyword;
//                     element.id = newid;
//                     element.innerHTML = newid;
//                 }
//                 else if (element.id == `Eseal_${keyword}`){
//                     var newid = (element.id).split('_')[0] + '_' + newKeyword;
//                     element.id = newid;
//                     element.innerHTML = newid;
//                 }
//                 else if (element.querySelector('.image-container')){
//                     var newid = (element.id).split('_')[0] + '_' + newKeyword;
//                     element.id = newid;
//                 }

//                 element.setAttribute('role', newKeyword);

//             });

//     });



// }

// const rolesDivforfirstcontainer = document.getElementById('rolesdiv');

// const inputElementforfirstrole = rolesDivforfirstcontainer.querySelector('#input_1');


// inputElementforfirstrole.addEventListener('input', (event) => {

//     const clientSelect = document.getElementById('ClientSelect');
//     if (clientSelect && clientSelect.options[1]) {
//         const newValue = event.target.value;


//         var count = 0;


//         for (let j = 0; j < clientSelect.options.length; j++) {
//           if(j != (i-1)){
//           if (clientSelect.options[j].text == (newValue)) {
//             count++;
//           }
//             }
//         }

//         if (count == 0 && ((newValue).trim() !== "") ) {
//             replaceKeywordInPlace(clientSelect.options[1].value, newValue)

//         clientSelect.options[1].value = newValue;
//         clientSelect.options[1].text = newValue;
//         }
//          else{
//              event.target.value = "";
//              count = 0
//         }

//     }

// });


function DocConfig() {

    document.getElementById('circle2').classList.remove('active');
    document.getElementById('stepline1').classList.remove('active');
    document.getElementById('circle3').classList.remove('active');
    document.getElementById('stepline2').classList.remove('active');

    var divToToggle = document.getElementById('docConfig');
    var divToToggle_1 = document.getElementById('roles');
    var divToToggle_2 = document.getElementById('rolesconfiguraton');
    if (divToToggle.style.display === 'none' || divToToggle.style.display === '') {
        divToToggle.style.display = 'block';
        divToToggle_1.style.display = 'none';
        divToToggle_2.style.display = 'none';
    }

    $('#docConfigBtn').css({
        'box-shadow': '0px 0px 10px 7px rgba(0, 0, 0, 0.2)'
    });
    $('#rolesConfigBtn').css('box-shadow', '');
    $('#rolesBtn').css('box-shadow', '');

}

function RolesConfiguraton() {

    document.getElementById('circle2').classList.add('active');
    document.getElementById('stepline1').classList.add('active');
    document.getElementById('circle3').classList.add('active');
    document.getElementById('stepline2').classList.add('active');

    var divToToggle = document.getElementById('docConfig');
    var divToToggle_1 = document.getElementById('roles');
    var divToToggle_2 = document.getElementById('rolesconfiguraton');
    var toolbarButtons = document.querySelectorAll('#toolbar button');
    document.getElementById('toolbar').style.height = '45%';
    document.getElementById('recommendedfields').style.display = 'flex';
    (document.getElementById('recommendedfields').previousElementSibling).style.display = 'block';
    toolbarButtons.forEach(button => {
        if (button.id === "signature" || button.id === "eseal") {

        } else {
            button.style.display = "block";
        }
    });
    if (divToToggle_2.style.display === 'none' || divToToggle_2.style.display === '') {
        divToToggle.style.display = 'none';
        divToToggle_1.style.display = 'none';
        divToToggle_2.style.display = 'block';
    }
    roleList = [{
        name: "Select a role",
        email: "",
        description: ""
    }];
    for (var x = 1; x < i; x++) {

        var roleData = {
            name: $("#input_" + x).val(),
            email: $("#inputEmail_" + x).val(),
            description: $("#inputDesc_" + x).val(),
            inputid: "input_" + x,
        };

        if (roleData.name !== undefined) {
            roleList.push(roleData);

        }


    }

    var selectDropdown = $('#ClientSelect');
    selectDropdown.empty();

    $.each(roleList, function (index, role) {
        // selectDropdown.append($('<option></option>').attr('value', role.name).text(role.name));
        const option = $('<option></option>')
            .attr('value', role.name)
            .text(role.name);

        // For the first index, hide the option
        if (index === 0) {
            option.css('display', 'none');
        }

        selectDropdown.append(option);
    });


    if (roleList.length == 1) {
        selectDropdown.prop('selectedIndex', 0);
    }
    else {
        if (roleList.some(role => role.name.replace(/\s+/g, '') === '')) {

            swal({
                title: "Info",
                text: "Role name is empty",
                type: "error",
            }, () => { Roles() });
        } else {
            const roleNames = roleList.map(role => role.name);
            const duplicateNames = roleNames.filter((name, index, arr) => arr.indexOf(name) !== index);

            if (duplicateNames.length > 0) {
                swal({
                    title: "Info",
                    text: "Duplicate Role names",
                    type: "error",
                }, () => { Roles() });
            }
        }
        selectDropdown.prop('selectedIndex', 1);
    }


    $('#docConfigBtn').css({
        'box-shadow': ''
    });
    $('#rolesConfigBtn').css('box-shadow', '0px 0px 10px 7px rgba(0, 0, 0, 0.2)');
    $('#rolesBtn').css('box-shadow', '');



}
function Roles() {

    document.getElementById('circle2').classList.add('active');
    document.getElementById('stepline1').classList.add('active');
    document.getElementById('circle3').classList.remove('active');
    document.getElementById('stepline2').classList.remove('active');

    var divToToggle = document.getElementById('docConfig');
    var divToToggle_1 = document.getElementById('roles');
    var divToToggle_2 = document.getElementById('rolesconfiguraton');
    if (divToToggle_1.style.display === 'none' || divToToggle.style.display === '') {
        divToToggle_1.style.display = 'block';
        divToToggle.style.display = 'none';
        divToToggle_2.style.display = 'none';
    }

    var docConfigBtn = document.getElementById('docConfigBtn');
    var rolesBtn = document.getElementById('rolesBtn');
    var rolesConfigBtn = document.getElementById('rolesConfigBtn');

    $('#docConfigBtn').css({
        'box-shadow': ''
    });
    $('#rolesConfigBtn').css('box-shadow', '');
    $('#rolesBtn').css('box-shadow', '0px 0px 10px 7px rgba(0, 0, 0, 0.2)');
}

function addNewRole() {

    const rolesContainer = document.getElementById('rolesdiv');


    const existingRoleCards = rolesContainer.querySelectorAll("div.role-card.odd.card");
    if (existingRoleCards.length >= 5) {
        swal({
            type: 'info',
            title: 'Limit Reached',
            text: 'You can add only up to 5 roles.',
        });
        return;
    }

    const roleCardDiv = document.createElement('div');
    roleCardDiv.className = 'role-card odd card';
    roleCardDiv.style.padding = '0px';
    roleCardDiv.style.width = '95%';
    roleCardDiv.style.margin = '0 auto';
    roleCardDiv.style.marginBottom = '5%';

    // Create card body div
    const cardBodyDiv = document.createElement('div');
    cardBodyDiv.className = 'card-body';
    cardBodyDiv.style.padding = '5px';

    // Create form group for Name
    const nameFormGroup = document.createElement('div');
    nameFormGroup.className = 'form-group';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'd-flex align-items-center mb-0';

    const nameLabel = document.createElement('label');
    nameLabel.htmlFor = `input_${i}`;
    nameLabel.className = 'col-form-label pl-0';
    nameLabel.style.fontSize = '12.5px';
    nameLabel.style.paddingRight = '0.1rem';
    nameLabel.style.whiteSpace = 'nowrap';
    nameLabel.innerHTML = 'Role Name<span class="text-danger">*</span>:';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = `input_${i}`;
    nameInput.className = 'form-control';
    nameInput.oninput = function (event) {
        validateRole(event);
    };

    //     nameInput.addEventListener('input', function () {
    //     const clientSelect = document.getElementById('ClientSelect');
    //     if (clientSelect && clientSelect.options[i-1]) {



    //     var count = 0;


    //     for (let j = 0; j < clientSelect.options.length; j++) {
    //       if(j != (i-1)){
    //           if (clientSelect.options[j].text == (this.value)) {
    //             count++;
    //           }
    //       }

    //     }

    //     console.log(count)
    //     if (count == 0 && ((this.value).trim() !== "") ) {
    //             replaceKeywordInPlace(clientSelect.options[i-1].value,this.value)
    //             clientSelect.options[i-1].value = this.value;
    //             clientSelect.options[i-1].text = this.value;
    //     } else{
    //         this.value = ""
    //         count = 0
    //     }




    //     }
    // });

    const matchingDivs = rolesContainer.querySelectorAll("div.role-card.odd.card");
    const count = matchingDivs.length + 1;

    nameInput.value = "";

    nameDiv.appendChild(nameLabel);
    nameDiv.appendChild(nameInput);
    nameFormGroup.appendChild(nameDiv);
    cardBodyDiv.appendChild(nameFormGroup);

    // Create form group for Email
    const emailFormGroup = document.createElement('div');
    emailFormGroup.className = 'form-group mt-0 mb-0';
    emailFormGroup.style.display = 'none';

    const emailDiv = document.createElement('div');
    emailDiv.className = 'd-flex align-items-center';

    const emailLabel = document.createElement('label');
    emailLabel.htmlFor = `inputEmail_${i}`;
    emailLabel.className = 'col-form-label col-sm-3 pl-0';
    emailLabel.style.fontSize = '12.5px';
    emailLabel.textContent = 'Email:';

    const emailInput = document.createElement('input');
    emailInput.type = 'text';
    emailInput.id = `inputEmail_${i}`;
    emailInput.className = 'form-control';

    emailDiv.appendChild(emailLabel);
    emailDiv.appendChild(emailInput);
    emailFormGroup.appendChild(emailDiv);
    cardBodyDiv.appendChild(emailFormGroup);

    // Create form group for Description
    const descFormGroup = document.createElement('div');
    descFormGroup.className = 'form-group mt-0 mb-0';

    const descLabel = document.createElement('label');
    descLabel.htmlFor = `inputDesc_${i}`;
    descLabel.className = 'col-form-label';
    descLabel.style.fontSize = '12.5px';
    descLabel.textContent = 'Description:';

    const descTextarea = document.createElement('textarea');
    descTextarea.id = `inputDesc_${i}`;
    descTextarea.className = 'form-control';
    descTextarea.innerHTML = 'This role can only review the form and perform Signing';
    descTextarea.style.height = 'auto';
    descTextarea.readOnly = true;

    descFormGroup.appendChild(descLabel);
    descFormGroup.appendChild(descTextarea);
    cardBodyDiv.appendChild(descFormGroup);

    // Create Delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-danger float-end mt-1';
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';

   const index = i;
    deleteButton.addEventListener("click", function () {
        removeRoleCard(index);
    });


    cardBodyDiv.appendChild(deleteButton);
    roleCardDiv.appendChild(cardBodyDiv);

    rolesContainer.appendChild(roleCardDiv);
    i++;


    rolesContainer.scrollTop = rolesContainer.scrollHeight;
}

function removeRoleCard(index) {
    var roleToRemove = document.getElementById('input_' + index);
    if (roleToRemove) {

        var role = roleToRemove.value;
        const pdfContainer = document.getElementById('pdf-container');
        if (pdfContainer) {

            const hasRole = pdfContainer.querySelector('[role="' + role + '"]') !== null;

            if (hasRole) {
                swal({
                    title: "Info",
                    text: "Role can't be deleted, as fields related to role are present.",
                    type: "error",
                });

            } else {
                roleToRemove.closest('.role-card').remove();

                roleList.splice(index - 1, 1);

                var selectDropdown = $('#ClientSelect');
                selectDropdown.empty();

                $.each(roleList, function (index, role) {
                    // selectDropdown.append($('<option></option>').attr('value', role.name).text(role.name));
                    const option = $('<option></option>')
                        .attr('value', role.name)
                        .text(role.name);

                    // For the first index, hide the option
                    if (index === 0) {
                        option.css('display', 'none');
                    }

                    selectDropdown.append(option);
                });
            }
        } else {
            console.log("pdfcontainer does not exist.");
        }

    }
}

function ImagePreview() {
    $("#digitalFormModal1").modal('show');
}


function closeModal() {
    $("#digitalFormModal1").modal('hide');
}
function ImagePreviewEseal() {
    $("#digitalFormModal2").modal('show');
}

function closeModals() {
    $("#digitalFormModal2").modal('hide');
}

function processfile(filebase64) {
    const pdfData = atob(filebase64);
    const arrayBuffer = new Uint8Array(pdfData.length);

    for (let i = 0; i < pdfData.length; i++) {
        arrayBuffer[i] = pdfData.charCodeAt(i);
    }

    pdfjsLib.getDocument({ data: arrayBuffer }).promise.then(pdf => {
        uploadedPDF = pdf;
        renderPDF(uploadedPDF);
    }).catch(error => {
        console.error('Error loading PDF:', error);
    });
}

function renderPDF(pdf) {
    pdfContainer.innerHTML = '';
    const numPages = pdf.numPages;
    const INITIAL_PAGES = 20;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const container = entry.target;
                const pageNum = parseInt(container.dataset.pageNumber);
                observer.unobserve(container);
                renderPage(pdf, pageNum, container);
            }
        });
    }, {
        root: null,
        rootMargin: '200px',
        threshold: 0.1
    });

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const pageContainer = document.createElement('div');
        pageContainer.className = 'pdf-page';
        pageContainer.dataset.pageNumber = pageNum;
        pageContainer.style.minHeight = '1000px';
        pageContainer.style.position = 'relative';
        pdfContainer.appendChild(pageContainer);

        if (pageNum <= INITIAL_PAGES) {
            renderPage(pdf, pageNum, pageContainer);
        } else {
            observer.observe(pageContainer);
        }
    }
}

function renderPage(pdf, pageNum, container) {
    pdf.getPage(pageNum).then(page => {
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.style.width = '100%';

        // Clear placeholder content and append canvas
        container.innerHTML = '';
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
            container.appendChild(annotationLayer);

            if (pageNum === 1) {
                originalWidth = viewport.viewBox[2];
                originalHeight = viewport.viewBox[3];
                const firstCanvas = document.querySelector('canvas');
                canvasWidth = firstCanvas.getBoundingClientRect().width;
                canvasHeight = firstCanvas.getBoundingClientRect().height;
            }
        });
    });
}




function updateOptionLabels() {
    const optionsContainer = document.getElementById('options-container');
    Array.from(optionsContainer.children).forEach((optionDiv, index) => {
        const optionLabel = optionDiv.querySelector('label');
        optionLabel.innerText = `Option ${index + 1}:`;
    });
}


var toolbarButtons = document.querySelectorAll('#toolbar button');
toolbarButtons.forEach(button => {
    button.addEventListener('mousedown', onMouseDown);
    button.addEventListener('touchstart', onMouseDown);

});


var clientSelect = document.getElementById("ClientSelect");

clientSelect.addEventListener("change", function () {

    const selectedIndex = clientSelect.selectedIndex;
    var toolbarButtons = document.querySelectorAll('#toolbar button');
    if (selectedIndex > 1) {

        document.getElementById('toolbar').style.height = 'auto';
        document.getElementById('recommendedfields').style.display = 'none';
        (document.getElementById('recommendedfields').previousElementSibling).style.display = 'none';
        toolbarButtons.forEach(button => {
            if (button.id === "signature" || button.id === "eseal") {

            } else {
                button.style.display = "none";
            }
        });
    } else {
        document.getElementById('toolbar').style.height = '45%';
        document.getElementById('recommendedfields').style.display = 'flex';
        (document.getElementById('recommendedfields').previousElementSibling).style.display = 'block';
        toolbarButtons.forEach(button => {
            if (button.id === "signature" || button.id === "eseal") {

            } else {
                button.style.display = "block";
            }
        });
    }
});

function onMouseDown(event) {
    const type = event.target.id;
    const ghostElement = createGhostElement(event, false);

    document.body.appendChild(ghostElement);


    // const offsetX = event.clientX - ghostElement.getBoundingClientRect().left;
    // const offsetY = event.clientY - ghostElement.getBoundingClientRect().top;

    const offsetX = document.documentElement.scrollLeft || document.body.scrollLeft;

    const offsetY = document.documentElement.scrollTop || document.body.scrollTop;

    function onMouseMove(e) {
        const isTouch = e.type.startsWith('touch');
        // ghostElement.style.left = e.clientX - offsetX + 'px';
        // ghostElement.style.top = e.clientY - offsetY + 'px';
        const clientX = isTouch ? e.touches[0].clientX : e.clientX;
        const clientY = isTouch ? e.touches[0].clientY : e.clientY;

        ghostElement.style.left = clientX + offsetX + 'px';
        ghostElement.style.top = clientY + offsetY + 'px';
    }

    function onMouseUp(e) {
        const isTouch = e.type.startsWith('touch');
        const clientX = isTouch ? e.changedTouches[0].clientX : e.clientX;
        const clientY = isTouch ? e.changedTouches[0].clientY : e.clientY;

        const pageElements = document.elementsFromPoint(clientX, clientY);

        const pdfPage = pageElements.find(el => el.classList.contains('pdf-page'));

        if (!pdfPage) {
            ghostElement.remove();
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            document.removeEventListener('touchmove', onMouseMove);
            document.removeEventListener('touchend', onMouseUp);
            return;
        }

        const ghostRect = ghostElement.getBoundingClientRect();
        const pageRect = pdfPage.getBoundingClientRect();

        const tolerance = 1;
        const isFullyInside =
            ghostRect.top >= pageRect.top - tolerance &&
            ghostRect.left >= pageRect.left - tolerance &&
            ghostRect.bottom <= pageRect.bottom + tolerance &&
            ghostRect.right <= pageRect.right + tolerance;


        if (!isFullyInside) {
            ghostElement.remove(); // Not fully inside the page
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            document.removeEventListener('touchmove', onMouseMove);
            document.removeEventListener('touchend', onMouseUp);
            return;
        }

        if (pdfPage) {
            const annotationLayer = pdfPage.querySelector('.annotation-layer');
            const rect = pdfPage.getBoundingClientRect();
            const left = clientX - rect.left;
            const top = clientY - rect.top;
            const selectElement = document.getElementById('ClientSelect');
            const selectedRole = selectElement.value;

            if (type === "text-field") {

                const newHeader = '<h5 class="modal-title">Enter Field Name</h5>';
                const newBody = `<input type="text"  id="FieldNameInput" class="form-control"  placeholder="Enter Field Name">
                                <span id="errorFieldName" style="color: red; display: none;"></span>
                                <div class="form-check mt-2">
                                    <input type="checkbox"  id="mandatoryCheckbox" class="form-check-input" checked>
                                    <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
                                </div>
                            `;
                const newFooter = `
                                                    <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
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
                    if ((document.getElementById('FieldNameInput').value).replace(/\s+/g, '') !== '') {
                        if (!fieldnameslist.includes(fieldName)) {

                            const element = createDraggableElement(type, left, top, fieldName, "", isMandatory);

                            annotationLayer.appendChild(element);


                            //ratio of width
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
                const selectElement = document.getElementById('ClientSelect');
                const selectedRole = selectElement.value;

                const radioGroupOptions = Object.keys(radioGroups).map(group => `<option value="${group}">${group}</option>`).join('');

                console.log(radioGroupOptions)

                let selectVisibility = radioGroupOptions.trim() ? 'block' : 'none';

                let labeltext = radioGroupOptions.trim() ? 'Select Group' : 'Create Group';


                const newHeader = '<h5 class="modal-title">Radio Button Details</h5>';
                const newBody = `

                                         <div style='display:flex;'>
                                                <label>${labeltext} :</label>
                                                    <select id="radio-group-select" style="margin-left:5%;width:46%;display:${selectVisibility}" >
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
                                    <input type="checkbox"  id="mandatoryCheckbox" class="form-check-input" checked>
                                    <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
                                </div>
                                             `;
                const newFooter = `
                                                        <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
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


                    //ratio of width
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
                                    <input type="checkbox"  id="mandatoryCheckbox" class="form-check-input" checked>
                                    <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
                                </div>
                                `;
                const newFooter = `
                                                        <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
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
                    if ((document.getElementById('FieldNameInput').value).replace(/\s+/g, '') !== '') {
                        if (!fieldnameslist.includes(valueName)) {

                            const element = createDraggableElement(type, left, top, valueName, "", isMandatory);
                            annotationLayer.appendChild(element);


                            //ratio of width
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
                                                <label style="font-size:13px">Group Name:</label>
                                                <input id="select-group-name" placeholder="Enter Group Name" style="margin-left:6px;">
                                                    <span id="errorFieldName" style="color: red; display: none;"></span>
                                            </div>
                                            <div id="edit-options-container" style="margin-top:10px;display:flex;align-items:center;flex-direction:column">
                                                <div style='display:flex;margin-top:10px;'>

                                                    <input class="edit-select-option" id="firstoption" placeholder="Enter Option" style="margin-left:10px;">
                                                    <button class="edit-delete-option-btn" style="margin-left:10px;border:none;background:transparent;visibility:hidden"><i class="fa fa-trash"></i></button>

                                                </div>
                                                    <span id="errorOption1" style="color: red; display: none;"></span>

                                            </div>
                                                
                                                <div class="form-check mt-2">
                                    <input type="checkbox"  id="mandatoryCheckbox" class="form-check-input" checked>
                                    <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>

                                    <button id="edit-add-new-option-btn" class="btn btn-primary" style="margin-top:10px;float:right;">Add Option</button>
                                </div>
                                                `;
                const newFooter = `
                                    <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
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

                    if (((document.getElementById('select-group-name').value.trim()).replace(/\s+/g, '') !== '') && (firstoption.replace(/\s+/g, '') !== '')) {
                        if (!fieldnameslist.includes(groupName)) {


                            const element = createDraggableElement(type, left, top, groupName, options, isMandatory);
                            annotationLayer.appendChild(element);


                            //ratio of width
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
                    else if (((document.getElementById('select-group-name').value.trim()).replace(/\s+/g, '') == '') && (firstoption.replace(/\s+/g, '') !== '')) {
                        document.getElementById('errorFieldName').innerText = "Group Name can't be empty";
                        document.getElementById('errorFieldName').style.display = 'block';
                    } else if (((document.getElementById('select-group-name').value.trim()).replace(/\s+/g, '') !== '') && (firstoption.replace(/\s+/g, '') == '')) {
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
        <input type="checkbox"  id="mandatoryCheckbox" class="form-check-input" checked>
        <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
    </div>
                                `;
                const newFooter = `
                                                        <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
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
                    if ((document.getElementById('FieldNameInput').value).replace(/\s+/g, '') !== '') {
                        if (!fieldnameslist.includes(fieldName)) {

                            const element = createDraggableElement(type, left, top, fieldName, "", isMandatory);
                            annotationLayer.appendChild(element);



                            //ratio of width
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


                //ratio of width
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


                    //ratio of width
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
        <input type="checkbox"  id="mandatoryCheckbox" class="form-check-input" checked>
        <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
    </div>
                                    `;
                const newFooter = `
                                                            <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
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
                    if ((document.getElementById('FieldNameInput').value).replace(/\s+/g, '') !== '') {
                        if (!fieldnameslist.includes(fieldName)) {

                            const element = createDraggableElement(type, left, top, fieldName, "", isMandatory);
                            annotationLayer.appendChild(element);



                            //ratio of width
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

        document.removeEventListener('touchmove', onMouseMove);
        document.removeEventListener('touchend', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    document.addEventListener('touchmove', onMouseMove);
    document.addEventListener('touchend', onMouseUp);
}

var autoButtons = document.querySelectorAll('#recommendedfields button');
autoButtons.forEach(button => {
    button.addEventListener('mousedown', onAutoMouseDown);
    button.addEventListener('touchstart', onAutoMouseDown);
});

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
                                    <input type="checkbox"  id="mandatoryCheckbox" class="form-check-input" checked>
                                    <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
                                </div>
                                `;
            const newFooter = `
                                                        <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
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
                if ((document.getElementById('FieldNameInput').value).replace(/\s+/g, '') !== '') {
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
                                    <input type="checkbox"  id="mandatoryCheckbox" class="form-check-input" checked>
                                    <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
                                </div>
                                                 `;
            const newFooter = `
                                                            <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
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
                        document.getElementById('errorSelectFieldName').style.display = 'none';
                        if (document.getElementById('radio-group-name').value !== "") {
                            var selectedGroup = 'new-group';
                            var newGroupName = document.getElementById('radio-group-name').value;
                            document.getElementById('errorInputGroupName').style.display = 'none';
                        } else {
                            document.getElementById('errorInputGroupName').style.display = 'block';
                            toastr.error('please create or select group name');
                            return false;
                        }
                    } else {
                        document.getElementById('errorSelectFieldName').style.display = 'block';
                        toastr.error('please create or select group name');
                        return false;
                    }

                } else if (document.getElementById('radio-group-select').value !== "") {
                    var selectedGroup = document.getElementById('radio-group-select').value;
                    var newGroupName = document.getElementById('radio-group-select').value;
                    document.getElementById('errorSelectFieldName').style.display = 'none';

                } else {
                    document.getElementById('errorSelectFieldName').style.display = 'block';
                    return false;
                }
                if (radioValue == "") {
                    document.getElementById('errorRadioValue').style.display = 'block';
                    return false;
                }
                document.getElementById('errorRadioValue').style.display = 'none';

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
                                    <input type="checkbox"  id="mandatoryCheckbox" class="form-check-input" checked>
                                    <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
                                </div>
                                    `;
            const newFooter = `
                                                            <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
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
                if ((document.getElementById('FieldNameInput').value).replace(/\s+/g, '') !== '') {
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
                                                    <label style="font-size:13px">Group Name:</label>
                                                    <input id="select-group-name" placeholder="Enter Group Name" style="margin-left:6px;">
                                                        <span id="errorFieldName" style="color: red; display: none;"></span>
                                                </div>
                                                <div id="edit-options-container" style="margin-top:10px;display:flex;align-items:center;flex-direction:column">
                                                    <div style='display:flex;margin-top:10px;'>

                                                        <input class="edit-select-option" id="firstoption" placeholder="Enter Option" style="margin-left:10px;">
                                                        <button class="edit-delete-option-btn" style="margin-left:10px;border:none;background:transparent;visibility:hidden"><i class="fa fa-trash"></i></button>

                                                    </div>
                                                        <span id="errorOption1" style="color: red; display: none;"></span>

                                                </div>
                                                    <div class="form-check mt-2">
                                    <input type="checkbox"  id="mandatoryCheckbox" class="form-check-input" checked>
                                    <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>

                                    <button id="edit-add-new-option-btn" class="btn btn-primary" style="margin-top:10px;float:right;">Add Option</button>
                                </div>
                                                    `;
            const newFooter = `
                                        <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
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

                if (((document.getElementById('select-group-name').value.trim()).replace(/\s+/g, '') !== '') && (firstoption.replace(/\s+/g, '') !== '')) {
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
                else if (((document.getElementById('select-group-name').value.trim()).replace(/\s+/g, '') == '') && (firstoption.replace(/\s+/g, '') !== '')) {
                    document.getElementById('errorFieldName').innerText = "Group Name can't be empty";
                    document.getElementById('errorFieldName').style.display = 'block';
                } else if (((document.getElementById('select-group-name').value.trim()).replace(/\s+/g, '') !== '') && (firstoption.replace(/\s+/g, '') == '')) {
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
        <input type="checkbox"  id="mandatoryCheckbox" class="form-check-input" checked>
        <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
    </div>
                                    `;
            const newFooter = `
                                                            <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
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
                if ((document.getElementById('FieldNameInput').value).replace(/\s+/g, '') !== '') {
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
        <input type="checkbox"  id="mandatoryCheckbox" class="form-check-input" checked>
        <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
    </div>
                                        `;
            const newFooter = `
                                                                <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
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
                if ((document.getElementById('FieldNameInput').value).replace(/\s+/g, '') !== '') {
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

function onClickRecommended(btnid) {
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

    const rect = pdfPage.getBoundingClientRect();
    const left = rect.width / 2 - 50;
    const top = rect.height / 2 - 50;
    const selectElement = document.getElementById('ClientSelect');
    const selectedRole = selectElement.value;

    if (pdfPage) {
        var annotationLayer = pdfPage.querySelector('.annotation-layer');


        if (btnid === "Date of Birth") {
            fieldName = btnid + "_" + selectedRole;
            if (true) {

                var element = createDraggableElement("date", left, top, fieldName, "", "true");
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

                }
            } else {
                swal({
                    title: "Info",
                    text: "Field Name Already Taken",
                    type: "error",
                });
            }



        }
        else if (btnid === "Selfie") {
            fieldName = btnid + "_" + selectedRole;
            if (true) {
                var element = createDraggableElement("imagefield", left, top, fieldName, "", "true");
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

                }
            } else {
                swal({
                    title: "Info",
                    text: "Field Name Already Taken",
                    type: "error",
                });
            }
        }
        else {
            fieldName = btnid + "_" + selectedRole;
            if (true) {

                var element = createDraggableElement("text-field", left, top, fieldName, "", "true");
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

                }
            } else {
                swal({
                    title: "Info",
                    text: "Field Name Already Taken",
                    type: "error",
                });
            }

        }

    }


}

function onAutoMouseDown(event) {
    const btnid = event.target.id;
    var autotype = true;
    if (event.target.id === 'Date of Birth' || event.target.id === 'Selfie') {
        autotype = false;
    }
    const ghostElement = createGhostElement(event, autotype);

    document.body.appendChild(ghostElement);


    // var offsetX = event.clientX - ghostElement.getBoundingClientRect().left;
    // var offsetY = event.clientY - ghostElement.getBoundingClientRect().top;
    var offsetX = document.documentElement.scrollLeft || document.body.scrollLeft;

    var offsetY = document.documentElement.scrollTop || document.body.scrollTop;

    function onMouseMove(e) {
        const isTouch = e.type.startsWith('touch');
        // ghostElement.style.left = e.clientX - offsetX + 'px';
        // ghostElement.style.top = e.clientY - offsetY + 'px';
        const clientX = isTouch ? e.touches[0].clientX : e.clientX;
        const clientY = isTouch ? e.touches[0].clientY : e.clientY;

        ghostElement.style.left = clientX + offsetX + 'px';
        ghostElement.style.top = clientY + offsetY + 'px';
    }


    function onMouseUp(e) {
        const isTouch = e.type.startsWith('touch');
        const clientX = isTouch ? e.changedTouches[0].clientX : e.clientX;
        const clientY = isTouch ? e.changedTouches[0].clientY : e.clientY;

        const pageElements = document.elementsFromPoint(clientX, clientY);

        var pdfPage = pageElements.find(el => el.classList.contains('pdf-page'));
        const selectElement = document.getElementById('ClientSelect');
        const selectedRole = selectElement.value;

        if (!pdfPage) {
            ghostElement.remove();
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            document.removeEventListener('touchmove', onMouseMove);
            document.removeEventListener('touchend', onMouseUp);
            return;
        }

        const ghostRect = ghostElement.getBoundingClientRect();
        const pageRect = pdfPage.getBoundingClientRect();

        const tolerance = 1;
        const isFullyInside =
            ghostRect.top >= pageRect.top - tolerance &&
            ghostRect.left >= pageRect.left - tolerance &&
            ghostRect.bottom <= pageRect.bottom + tolerance &&
            ghostRect.right <= pageRect.right + tolerance;


        if (!isFullyInside) {
            ghostElement.remove(); // Not fully inside the page
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            document.removeEventListener('touchmove', onMouseMove);
            document.removeEventListener('touchend', onMouseUp);
            return;
        }


        if (pdfPage) {
            var annotationLayer = pdfPage.querySelector('.annotation-layer');
            var rect = pdfPage.getBoundingClientRect();
            const left = clientX - rect.left;
            const top = clientY - rect.top;

            if (btnid === "Date of Birth") {
                fieldName = btnid + "_" + selectedRole;
                if (true) {

                    var element = createDraggableElement("date", left, top, fieldName, "", "true");
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

                    }
                } else {
                    swal({
                        title: "Info",
                        text: "Field Name Already Taken",
                        type: "error",
                    });
                }



            }
            else if (btnid === "Selfie") {
                fieldName = btnid + "_" + selectedRole;
                if (true) {
                    var element = createDraggableElement("imagefield", left, top, fieldName, "", "true");
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

                    }
                } else {
                    swal({
                        title: "Info",
                        text: "Field Name Already Taken",
                        type: "error",
                    });
                }
            }
            else {
                fieldName = btnid + "_" + selectedRole;
                if (true) {

                    var element = createDraggableElement("text-field", left, top, fieldName, "", "true");
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

                    }
                } else {
                    swal({
                        title: "Info",
                        text: "Field Name Already Taken",
                        type: "error",
                    });
                }

            }

        }
        ghostElement.remove();
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        document.removeEventListener('touchmove', onMouseMove);
        document.removeEventListener('touchend', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    document.addEventListener('touchmove', onMouseMove);
    document.addEventListener('touchend', onMouseUp);
}


// function onClickAutoMouseDown(event) {
//     const btnid = event.target.id;

//     if (btnid === "Date of Birth") {
//                 fieldName = btnid + "_" + selectedRole;
//                 if (!fieldnameslist.includes(fieldName)) {

//                     var element = createDraggableElement("date", left, top, fieldName);
//                     annotationLayer.appendChild(element);
//                     if ((element.offsetWidth + left) > rect.width) {
//                         annotationLayer.removeChild(element);
//                     } else {
//                         fieldnameslist.push(fieldName);
//                     }
//                 } else {
//                     swal({
//                         title: "Info",
//                         text: "Field Name Already Taken",
//                         type: "error",
//                     });
//                 }



//             }
//             else if (btnid === "Selfie") {
//                 fieldName = btnid + "_" + selectedRole;
//                 if (!fieldnameslist.includes(fieldName)) {
//                     var element = createDraggableElement("imagefield", left, top, fieldName);
//                     annotationLayer.appendChild(element);
//                     if ((element.offsetWidth + left) > rect.width) {
//                         annotationLayer.removeChild(element);
//                     } else {
//                         fieldnameslist.push(fieldName);
//                     }
//                 } else {
//                     swal({
//                         title: "Info",
//                         text: "Field Name Already Taken",
//                         type: "error",
//                     });
//                 }
//             }
//             else {
//                 fieldName = btnid + "_" + selectedRole;
//                 if (!fieldnameslist.includes(fieldName)) {

//                     var element = createDraggableElement("text-field", left, top, fieldName);
//                     annotationLayer.appendChild(element);
//                     if ((element.offsetWidth + left) > rect.width) {
//                         annotationLayer.removeChild(element);
//                     } else {
//                         fieldnameslist.push(fieldName);
//                     }
//                 } else {
//                     swal({
//                         title: "Info",
//                         text: "Field Name Already Taken",
//                         type: "error",
//                     });
//                 }

//             }

// }



function createGhostElement(event, autotype) {
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

        radioField.style.width = '15px';
        radioField.style.height = '15px';

    }
    else if (event.target.id === 'check-box') {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = "valueName";
        checkbox.value = "valueName";
        checkbox.classList.add('input-field');
        element.appendChild(checkbox);

        checkbox.style.width = '15px';
        checkbox.style.height = '15px';
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

        input.style.width = (canvasWidth * 0.3) + 'px';
        input.style.height = (canvasWidth * 0.07) + 'px';
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
    else if (autotype) {
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


function createDraggableElement(type, left, top, group, value, isMandatory) {
    const selectElement = document.getElementById('ClientSelect');
    const selectedRole = selectElement.value;
    const roleinputId = roleList[selectElement.selectedIndex].inputid;


    const rolesDivforfirstcontainer = document.getElementById('rolesdiv');

    const roleinput = rolesDivforfirstcontainer.querySelector(`#${roleinputId}`);

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
        // input.setAttribute("maxlength", "10");

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

        roleinput.addEventListener('input', (event) => {


            input.setAttribute('role', event.target.value);
            for (let i = 0; i < fieldnameslist.length; i++) {
                if (fieldnameslist[i] === input.id) {
                    fieldnameslist[i] = (input.id).split('_')[0] + "_" + event.target.value;
                    break;
                }
            }
            input.id = (input.id).split('_')[0] + "_" + event.target.value;

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

        radioField.style.width = '15px';
        radioField.style.height = '15px';

        roleinput.addEventListener('input', (event) => {


            radioField.setAttribute('role', event.target.value);


        });

    }
    else if (type === 'check-box') {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = valueName;
        checkbox.value = valueName.split("_")[1];
        checkbox.classList.add('input-field');
        checkbox.setAttribute('role', selectedRole);
        checkbox.setAttribute('mandatory', isMandatory);

        checkbox.style.width = '15px';
        checkbox.style.height = '15px';


        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                checkbox.classList.add('checked');
            } else {
                checkbox.classList.remove('checked');
            }
        });

        roleinput.addEventListener('input', (event) => {


            checkbox.setAttribute('role', event.target.value);
            for (let i = 0; i < fieldnameslist.length; i++) {
                if (fieldnameslist[i] === checkbox.id) {
                    fieldnameslist[i] = (checkbox.id).split('_')[0] + "_" + event.target.value;
                    break;
                }
            }

            checkbox.id = (checkbox.id).split('_')[0] + "_" + event.target.value;
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

        roleinput.addEventListener('input', (event) => {


            select.setAttribute('role', event.target.value);
            for (let i = 0; i < fieldnameslist.length; i++) {
                if (fieldnameslist[i] === select.id) {
                    fieldnameslist[i] = (select.id).split('_')[0] + "_" + event.target.value;
                    break;
                }
            }
            select.id = (select.id).split('_')[0] + "_" + event.target.value;

        });

        // Append the select element to a container

        content.appendChild(select);
    }
    else if (type === 'date') {
        const input = document.createElement('input');
        input.type = 'date';
        input.placeholder = 'Date Field';
        input.classList.add('input-field');





        element.style.width = '28%';
        input.style.width = '100%'



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

        roleinput.addEventListener('input', (event) => {


            input.setAttribute('role', event.target.value);

            for (let i = 0; i < fieldnameslist.length; i++) {
                if (fieldnameslist[i] === input.id) {
                    fieldnameslist[i] = (input.id).split('_')[0] + "_" + event.target.value;
                    break;
                }
            }
            input.id = (input.id).split('_')[0] + "_" + event.target.value;
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

        roleinput.addEventListener('input', (event) => {


            editableTextContainer.setAttribute('role', event.target.value);


        });

        content.appendChild(editableTextContainer);
    }
    else if (type === 'signature') {
        element.style.padding = '0';
        const input = document.createElement('div');
        input.style.border = "1px solid #44aad1";




        input.style.textAlign = 'center';

        input.style.width = (canvasWidth * 0.3) + 'px';
        input.style.height = (canvasWidth * 0.07) + 'px';
        input.textContent = 'Signature' + "_" + selectedRole;

        input.style.backgroundColor = "#d8d7d78a";
        input.style.color = "#44aad1";
        input.style.fontSize = "77%";


        input.id = 'Signature' + "_" + selectedRole;
        input.setAttribute('role', selectedRole);

        roleinput.addEventListener('input', (event) => {



            input.textContent = 'Signature' + "_" + event.target.value;
            input.setAttribute('role', event.target.value);
            for (let i = 0; i < fieldnameslist.length; i++) {
                if (fieldnameslist[i] === input.id) {
                    fieldnameslist[i] = 'Signature' + "_" + event.target.value;
                    break;
                }
            }

            input.id = 'Signature' + "_" + event.target.value;
        });


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
        input.textContent = 'Eseal' + "_" + selectedRole;

        input.style.backgroundColor = "#d8d7d78a";
        input.style.color = "#44aad1";
        input.style.fontSize = "77%";



        input.id = 'Eseal' + "_" + selectedRole;
        input.setAttribute('role', selectedRole);

        roleinput.addEventListener('input', (event) => {



            input.textContent = 'Eseal' + "_" + event.target.value;
            input.setAttribute('role', event.target.value);

            for (let i = 0; i < fieldnameslist.length; i++) {
                if (fieldnameslist[i] === input.id) {
                    fieldnameslist[i] = 'Eseal' + "_" + event.target.value;
                    break;
                }
            }
            input.id = 'Eseal' + "_" + event.target.value;

        });

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

        roleinput.addEventListener('input', (event) => {


            uploadedImage.setAttribute('role', event.target.value);

            for (let i = 0; i < fieldnameslist.length; i++) {
                if (fieldnameslist[i] === uploadedImage.id) {
                    fieldnameslist[i] = (uploadedImage.id).split('_')[0] + "_" + event.target.value;
                    break;
                }
            }

            uploadedImage.id = (uploadedImage.id).split('_')[0] + "_" + event.target.value;
        });

        content.appendChild(imageContainer);

    }

    element.appendChild(content);
    if (type !== 'signature' && type !== 'eseal' && type !== 'websave' && type !== 'webfill') {
        addResizeHandles(content);

    }

    addEditIcon(content, type);

    // if(type == 'date'){
    //     element.style.width = content.style.width;
    // }
    element.style.position = 'absolute';
    element.style.pointerEvents = 'auto';  // Enable interactions
    element.style.zIndex = '1000';  // Ensure it's on top of other elements



    makeDraggable(element);

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

        handle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            resizeStart(e, content, position);
        });
    });
}

function updateModalContent(headerContent, bodyContent, footerContent) {
    // Update the modal header
    document.querySelector('#EditFields_Modal .modal-header').innerHTML = headerContent;

    // Update the modal body
    document.querySelector('#EditFields_Modal .modal-body').innerHTML = bodyContent;

    // Update the modal footer
    document.querySelector('#EditFields_Modal .modal-footer').innerHTML = footerContent;
}
function extractRGBValues(rgbString) {

    const rgbArray = rgbString.match(/\d+/g);
    return rgbArray ? rgbArray.map(Number) : [0, 0, 0];
}
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function addEditIcon(content, type) {
    const editIcon = document.createElement('div');
    editIcon.classList.add('edit-icon', 'top-right');
    editIcon.innerHTML = '✏️';



    if (type === 'text-field') {
        editIcon.addEventListener('click', () => {

            const firstChild = content.firstElementChild;
            const firstchild_value = firstChild.id.split("_");

            const [r, g, b] = extractRGBValues(firstChild.style.color);


            const hexColor = rgbToHex(r, g, b);

            const newHeader = '<h5 class="modal-title">Update Field Name</h5>';
            const newBody = `<input type="text" value="${firstchild_value[0]}" id="FieldNameInput" class="form-control"  placeholder="Enter new field name">
                            <span id="errorFieldName" style="color: red; display: none;"></span>
                                <div style="display:flex;margin-top:5%;font-size:14px">
                                                <label for="FieldColorInput">Select font color:</label>
                                                        <input style="width: 25px;height: 28px;padding: 0;border-radius: 5px;border: 1px solid #ccc; cursor: pointer;margin-left:5%" type="color" title="Tap the color area to pick your desired color" id="FieldColorInput" value="${hexColor}">
                                             </div>

                                             <div class="form-check mt-3">
        <input type="checkbox"  id="mandatoryCheckbox" class="form-check-input" ${firstChild.getAttribute('mandatory') === 'true' ? 'checked' : ''}>
        <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
    </div>
                            `;
            const newFooter = `
                                                <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                               <button type="button" class="btn btn-danger"  id="deleteFieldName">Delete</button>
                                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                        `;

            // Update the modal content
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

                if ((document.getElementById('FieldNameInput').value).replace(/\s+/g, '') !== '') {
                    if (!fieldnameslist.includes(document.getElementById('FieldNameInput').value + "_" + firstchild_value[1]) || (firstChild.id === document.getElementById('FieldNameInput').value + "_" + firstchild_value[1])) {

                        fieldnameslist = fieldnameslist.filter(item => item !== firstChild.id);
                        fieldnameslist.push(document.getElementById('FieldNameInput').value + "_" + firstchild_value[1]);

                        firstChild.setAttribute('mandatory', isMandatory);
                        firstChild.id = document.getElementById('FieldNameInput').value + "_" + firstchild_value[1];
                        firstChild.style.color = document.getElementById('FieldColorInput').value;
                        firstChild.placeholder = "Please Enter " + document.getElementById('FieldNameInput').value;
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
    else if (type === 'check-box') {
        editIcon.addEventListener('click', () => {
            const firstChild = content.firstElementChild;
            const firstchild_value = firstChild.id.split("_");



            const newHeader = '<h5 class="modal-title">Update Field Name</h5>';
            const newBody = `<input type="text" value="${firstchild_value[0]}" id="FieldNameInput" class="form-control"  placeholder="Enter new field name">
                            <span id="errorFieldName" style="color: red; display: none;"></span>
                            <div class="form-check mt-3">
        <input type="checkbox"   id="mandatoryCheckbox" class="form-check-input" ${firstChild.getAttribute('mandatory') === 'true' ? 'checked' : ''}>
        <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
    </div>
                            `;
            const newFooter = `
                                                    <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                        <button type="button" class="btn btn-danger"   id="deleteFieldName">Delete</button>
                                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                            `;

            // Update the modal content
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

                if ((document.getElementById('FieldNameInput').value).replace(/\s+/g, '') !== '') {
                    if (!fieldnameslist.includes(document.getElementById('FieldNameInput').value + "_" + firstchild_value[1]) || (firstChild.id === document.getElementById('FieldNameInput').value + "_" + firstchild_value[1])) {

                        fieldnameslist = fieldnameslist.filter(item => item !== firstChild.id);
                        fieldnameslist.push(document.getElementById('FieldNameInput').value + "_" + firstchild_value[1]);

                        firstChild.setAttribute('mandatory', isMandatory);
                        firstChild.id = document.getElementById('FieldNameInput').value + "_" + firstchild_value[1];
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
            const firstchild_value = firstChild.id.split("_");

            const [r, g, b] = extractRGBValues((firstChild.options[1]).style.color);


            const hexColor = rgbToHex(r, g, b);

            const newHeader = '<h5 class="modal-title">Update Select Field</h5>';
            const newBody = `
                                    <div>
                                        <label style="font-size:13px">Group Name:</label>
                                        <input id="edit-select-group-name" value="${firstchild_value[0]}" placeholder="Enter Group Name" style="margin-left:6px;">
                                            <span id="errorFieldName" style="color: red; display: none;"></span>
                                    </div>
                                        <div id="edit-options-container" style="margin-top:10px;display:flex;align-items:center;flex-direction:column">
                                        ${Array.from(firstChild.options).map((group, index) => {
                if (group.text === "Select Option") {
                    return '';
                }
                return `
                                            <div style='display:flex;margin-top:10px;'>

                                                <input class="select-option" placeholder="Enter Option" value="${group.text}" style="margin-left:10px;">

                                                <button class="edit-delete-option-btn" style="margin-left:10px;border:none;background:transparent;"><i class="fa fa-trash"></i></button>
                                            </div>
                                            `;
            }).join('')}
                                    </div>
                                        <button id="edit-add-new-option-btn" class="btn btn-primary" style="margin-top:10px;float:right;">Add Option</button>

                               <div style="display:flex;margin-top:5%;font-size:14px">
                            <label for="FieldColorInput">Select font color:</label>
                                        <input style="width: 25px;height: 28px;padding: 0;border-radius: 5px;border: 1px solid #ccc; cursor: pointer;margin-left:5%" type="color" title="Tap the color area to pick your desired color" id="FieldColorInput" value="${hexColor}">
                         </div>

                         <div class="form-check mt-3">
        <input type="checkbox"   id="mandatoryCheckbox" class="form-check-input" ${firstChild.getAttribute('mandatory') === 'true' ? 'checked' : ''}>
        <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
    </div>

                                `;

            const newFooter = `
                                                        <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                            <button type="button" class="btn btn-danger"   id="deleteFieldName">Delete</button>
                                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                                `;

            updateModalContent(newHeader, newBody, newFooter);

            const fieldNameInput = document.getElementById('edit-select-group-name');
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

            const addButton = document.querySelector('#edit-add-new-option-btn');
            const optionsContainer = document.querySelector('#edit-options-container');

            addButton.addEventListener('click', () => {
                const newOptionIndex = optionsContainer.children.length;
                optionsContainer.insertAdjacentHTML('beforeend', `
                                <div style='display:flex;margin-top:10px;'>

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
                const groupName = document.querySelector('#edit-select-group-name').value + "_" + firstchild_value[1];
                const options = Array.from(document.querySelectorAll('.select-option')).map(input => input.value);



                if (groupName.replace(/\s+/g, '') !== '') {
                    if (!fieldnameslist.includes(groupName) || firstChild.id === groupName) {

                        fieldnameslist.push(groupName);
                        fieldnameslist = fieldnameslist.filter(item => item !== firstChild.id);

                        firstChild.setAttribute('mandatory', isMandatory);
                        firstChild.id = groupName;
                        firstChild.innerHTML = '';


                        var optionElement = document.createElement('option');
                        optionElement.textContent = "Select Option";
                        optionElement.value = "Select Option";
                        optionElement.style.color = "#636161"
                        firstChild.appendChild(optionElement);

                        options.forEach(option => {
                            var optionElement = document.createElement('option');
                            optionElement.textContent = option;
                            optionElement.value = option;
                            optionElement.style.color = document.getElementById('FieldColorInput').value;
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
            const firstchild_value = firstChild.id.split("_");

            //console.log(firstChild.getAttribute('data-flag'))
            //const [r, g, b] = extractRGBValues(firstChild.getAttribute('data-flag'));
            const hexColor = firstChild.getAttribute('data-flag');

            const newHeader = '<h5 class="modal-title">Update Field Name</h5>';
            const newBody = `<input type="text" value="${firstchild_value[0]}" id="FieldNameInput" class="form-control"  placeholder="Enter new field name">
                            <span id="errorFieldName" style="color: red; display: none;"></span>
                                <div style="display:flex;margin-top:5%;font-size:14px">
                                <label for="FieldColorInput">Select font color:</label>
                                            <input style="width: 25px;height: 28px;padding: 0;border-radius: 5px;border: 1px solid #ccc; cursor: pointer;margin-left:5%" type="color" title="Tap the color area to pick your desired color" id="FieldColorInput" value="${hexColor}">
                             </div>
                                                                          <div class="form-check mt-3">
        <input type="checkbox"   id="mandatoryCheckbox" class="form-check-input" ${firstChild.getAttribute('mandatory') === 'true' ? 'checked' : ''}>
        <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
    </div>

                            `;
            const newFooter = `
                                                        <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                            <button type="button" class="btn btn-danger"   id="deleteFieldName">Delete</button>
                                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                                `;

            // Update the modal content
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
                if ((document.getElementById('FieldNameInput').value).replace(/\s+/g, '') !== '') {
                    if (!fieldnameslist.includes(document.getElementById('FieldNameInput').value + "_" + firstchild_value[1]) || (firstChild.id === document.getElementById('FieldNameInput').value + "_" + firstchild_value[1])) {

                        fieldnameslist.push(document.getElementById('FieldNameInput').value + "_" + firstchild_value[1]);
                        fieldnameslist = fieldnameslist.filter(item => item !== firstChild.id);

                        firstChild.setAttribute('mandatory', isMandatory);
                        firstChild.id = document.getElementById('FieldNameInput').value + "_" + firstchild_value[1];
                        firstChild.setAttribute('data-flag', document.getElementById('FieldColorInput').value);
                        if (firstChild.value !== "") {
                            firstChild.style.color = document.getElementById('FieldColorInput').value;
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

            const [r, g, b] = extractRGBValues(firstChild.style.color);


            const hexColor = rgbToHex(r, g, b);
            const newHeader = '<h5 class="modal-title">Do you want to delete this field?</h5>';
            const newBody = `<input type="text" value="${firstChild.innerHTML}" id="FieldNameInput" class="form-control"  placeholder="Enter new field name" readonly>
                            <div style="display:flex;margin-top:5%;font-size:14px">
                            <label for="FieldColorInput">Select font color:</label>
                                        <input style="width: 25px;height: 28px;padding: 0;border-radius: 5px;border: 1px solid #ccc; cursor: pointer;margin-left:5%" type="color" title="Tap the color area to pick your desired color" id="FieldColorInput" value="${hexColor}">
                         </div>
                                         `;
            const newFooter = `
                                                            <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                            <button type="button" class="btn btn-danger"  id="deleteFieldName">Delete</button>
                                                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                                    `;

            // Update the modal content
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
                firstChild.style.color = document.getElementById('FieldColorInput').value;
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
    else if (type === 'radio-button') {
        const firstChild = content.firstElementChild;

        const firstchildname = firstChild.name.split("_");
        editIcon.addEventListener('click', () => {



            const newHeader = '<h5 class="modal-title">Update Radio Group</h5>';
            const newBody = `
                            <div style='display:flex; margin-bottom:7%;'>
                                 <label for="group-name">Group Name :</label>
                                <input id="edit-group-name" style="margin-left:5%" class="swal2-input" value="${firstchildname[0]}" readonly>
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
        <input type="checkbox"  id="mandatoryCheckbox" class="form-check-input" ${firstChild.getAttribute('mandatory') === 'true' ? 'checked' : ''}>
        <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
    </div>
                             `;
            const newFooter = `
                                                    <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                        <button type="button" class="btn btn-danger"   id="deleteFieldName">Delete</button>
                                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                            `;

            // Update the modal content
            updateModalContent(newHeader, newBody, newFooter);

            const fieldNameInput = document.getElementById('edit-group-name');
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
                const updatedGroupName = document.getElementById('edit-group-name').value.trim();
                const newValues = [];
                document.querySelectorAll('#edit-radio-values-container input').forEach(input => {
                    newValues.push(input.value.trim());
                });
                firstChild.name = updatedGroupName + "_" + firstchildname[1];
                firstChild.value = newValues[0];

                const radioInputs = document.querySelectorAll('#pdf-container input[type="radio"]');
                var newname = updatedGroupName + "_" + firstchildname[1];
                radioInputs.forEach((radioInput) => {
                    if (radioInput.name == newname) {
                        radioInput.setAttribute('mandatory', isMandatory);
                    }
                });

                firstChild.setAttribute('mandatory', isMandatory);
                console.log(radioGroups)
                radioGroups[firstchildname[0]] = radioGroups[updatedGroupName]

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
    else if (type === 'signature') {
        editIcon.addEventListener('click', () => {
            const firstChild = content.firstElementChild;

            const newHeader = '<h5 class="modal-title">Do you want to delete this field?</h5>';
            const newBody = `<input  type="text" value="${firstChild.id.split("_")[0]}" id="FieldNameInput" class="form-control"  placeholder="Enter new field name" readonly>`;
            const newFooter = `
                                                                <button type="button" class="btn btn-danger"  id="deleteFieldName">Delete</button>
                                                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
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
    else if (type === 'eseal') {
        editIcon.addEventListener('click', () => {
            const firstChild = content.firstElementChild;

            const newHeader = '<h5 class="modal-title">Do you want to delete this field?</h5>';
            const newBody = `<input type="text" value="${firstChild.id.split("_")[0]}" id="FieldNameInput" class="form-control"  placeholder="Enter new field name" readonly>`;
            const newFooter = `
                                                                    <button type="button" class="btn btn-danger"  id="deleteFieldName">Delete</button>
                                                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
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
    else if (type === 'websave') {
        editIcon.addEventListener('click', () => {
            const firstChild = content.firstElementChild;

            const newHeader = '<h5 class="modal-title">Do you want to delete this field?</h5>';
            const newBody = `<input type="text" value="This button is used to submit form" id="FieldNameInput" class="form-control"  placeholder="Enter new field name">`;
            const newFooter = `
                                                                        <button type="button" class="btn btn-danger"  id="deleteFieldName">Delete</button>
                                                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
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
    else if (type === 'webfill') {
        editIcon.addEventListener('click', () => {
            const firstChild = content.firstElementChild;

            const newHeader = '<h5 class="modal-title">Do you want to delete this field?</h5>';
            const newBody = `<input type="text" value="This button is used to auto fill" id="FieldNameInput" class="form-control"  placeholder="Enter new field name">`;
            const newFooter = `
                                                                            <button type="button" class="btn btn-danger"  id="deleteFieldName">Delete</button>
                                                                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
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
            const firstchild_value = secondChild.id.split("_");


            const newHeader = '<h5 class="modal-title">Update Field Name</h5>';
            const newBody = `<input type="text" value="${firstchild_value[0]}" id="FieldNameInput" class="form-control"  placeholder="Enter new field name">
                                <span id="errorFieldName" style="color: red; display: none;"></span>
                                                                             <div class="form-check mt-3">
        <input type="checkbox"   id="mandatoryCheckbox" class="form-check-input" ${secondChild.getAttribute('mandatory') === 'true' ? 'checked' : ''}>
        <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
    </div>

                                `;
            const newFooter = `
                                                    <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                   <button type="button" class="btn btn-danger"   id="deleteFieldName">Delete</button>
                                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                            `;

            // Update the modal content
            updateModalContent(newHeader, newBody, newFooter);

            document.getElementById('saveFieldName').addEventListener('click', () => {
                const mancheckbox = document.getElementById('mandatoryCheckbox');

                const isMandatory = mancheckbox.checked;

                if ((document.getElementById('FieldNameInput').value).replace(/\s+/g, '') !== '') {
                    if (!fieldnameslist.includes(document.getElementById('FieldNameInput').value + "_" + firstchild_value[1]) || (secondChild.id === document.getElementById('FieldNameInput').value + "_" + firstchild_value[1])) {

                        fieldnameslist = fieldnameslist.filter(item => item !== secondChild.id);
                        fieldnameslist.push(document.getElementById('FieldNameInput').value + "_" + firstchild_value[1]);

                        secondChild.setAttribute('mandatory', isMandatory);
                        secondChild.id = document.getElementById('FieldNameInput').value + "_" + firstchild_value[1];


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

            $('#EditFields_Modal').modal('show');
        });
    }
    content.appendChild(editIcon);
}

function resizeStart(e, content, handlePosition) {


    const isTouch = e.type.startsWith('touch');

    const startX = isTouch ? e.touches[0].clientX : e.clientX;
    const startY = isTouch ? e.touches[0].clientY : e.clientY;

    const startWidth = parseFloat(getComputedStyle(content.firstChild, null).width.replace('px', ''));
    const startHeight = parseFloat(getComputedStyle(content.firstChild, null).height.replace('px', ''));
    const isRadioButton = content.firstChild.type === 'radio';
    const isCheckBox = content.firstChild.type === 'checkbox';



    // function resizeMove(e) {
    //     const dx = e.clientX - startX;
    //     const dy = e.clientY - startY;

    //     let newWidth = startWidth;
    //     let newHeight = startHeight;

    //     if (handlePosition.includes('right')) {
    //         newWidth = startWidth + dx;
    //     } else if (handlePosition.includes('left')) {
    //         newWidth = startWidth - dx;
    //         content.style.left = `${content.offsetLeft + dx}px`;
    //     }

    //     if (handlePosition.includes('bottom')) {
    //         newHeight = startHeight + dy;
    //     } else if (handlePosition.includes('top')) {
    //         newHeight = startHeight - dy;
    //         content.style.top = `${content.offsetTop + dy}px`;
    //     }


    //     if (isRadioButton || isCheckBox) {

    //         const newSize = Math.min(newWidth, newHeight);
    //         content.firstChild.style.width = `${newSize}px`;
    //         content.firstChild.style.height = `${newSize}px`;

    //         const wratio = (newSize / (document.querySelector('canvas')).getBoundingClientRect().width );
    //         const hratio = (newSize / (document.querySelector('canvas')).getBoundingClientRect().height );

    //         content.parentElement.setAttribute('data-wpercent', wratio)
    //         content.parentElement.setAttribute('data-hpercent', hratio)


    //     } else {
    //         content.firstChild.style.width = `${newWidth}px`;
    //         content.firstChild.style.height = `${newHeight}px`;
    //         if(content.firstChild.type == 'date'){
    //             content.parentElement.style.width = `${newWidth}px`;
    //         }

    //         const wratio = (newWidth / (document.querySelector('canvas')).getBoundingClientRect().width );
    //         const hratio = (newHeight / (document.querySelector('canvas')).getBoundingClientRect().height );

    //         content.parentElement.setAttribute('data-wpercent', wratio)
    //         content.parentElement.setAttribute('data-hpercent', hratio)


    //     }


    //     const fontSize = newHeight / 2;
    //     content.firstChild.style.fontSize = `${fontSize}px`;



    // }

    function resizeMove(e) {
        // e.preventDefault();

        let clientX, clientY;
        if (e.type === 'mousemove') {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        const dx = clientX - startX;
        const dy = clientY - startY;

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

            const wratio = newSize / document.querySelector('canvas').getBoundingClientRect().width;
            const hratio = newSize / document.querySelector('canvas').getBoundingClientRect().height;

            content.parentElement.setAttribute('data-wpercent', wratio);
            content.parentElement.setAttribute('data-hpercent', hratio);
        } else {
            content.firstChild.style.width = `${newWidth}px`;
            content.firstChild.style.height = `${newHeight}px`;

            if (content.firstChild.type === 'date') {
                content.parentElement.style.width = `${newWidth}px`;
            }

            const wratio = newWidth / document.querySelector('canvas').getBoundingClientRect().width;
            const hratio = newHeight / document.querySelector('canvas').getBoundingClientRect().height;

            content.parentElement.setAttribute('data-wpercent', wratio);
            content.parentElement.setAttribute('data-hpercent', hratio);
        }

        // Dynamically adjust font size based on height
        const fontSize = newHeight / 2;
        content.firstChild.style.fontSize = `${fontSize}px`;
    }


    function resizeEnd() {
        document.removeEventListener('mousemove', resizeMove);
        document.removeEventListener('mouseup', resizeEnd);

        document.removeEventListener('touchmove', resizeMove);
        document.removeEventListener('touchend', resizeEnd);
    }

    document.addEventListener('mousemove', resizeMove);
    document.addEventListener('mouseup', resizeEnd);

    document.addEventListener('touchmove', resizeMove);
    document.addEventListener('touchend', resizeEnd);
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

    element.addEventListener('touchstart', (e) => {
        if (true) {
            e.preventDefault();
            isDragging = true;
            const isTouch = e.type.startsWith('touch');
            const clientX = isTouch ? e.touches[0].clientX : e.clientX;
            const clientY = isTouch ? e.touches[0].clientY : e.clientY;

            offsetX = clientX - element.getBoundingClientRect().left;
            offsetY = clientY - element.getBoundingClientRect().top;
            document.addEventListener('touchmove', onMouseMove);
            document.addEventListener('touchend', onMouseUp);
        }
    }, { passive: false });





    function onMouseMove(e) {
        const isTouch = e.type.startsWith('touch');
        if (isDragging) {
            const pageRect = element.parentElement.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect(); // Get bounding rect of the draggable element


            newLeft = (isTouch ? e.touches[0].clientX : e.clientX) - pageRect.left - offsetX;
            newTop = (isTouch ? e.touches[0].clientY : e.clientY) - pageRect.top - offsetY;

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
            //element.style.left = `${e.clientX - pageRect.left - offsetX}px`;
            //element.style.top = `${e.clientY - pageRect.top - offsetY}px`;
        }
    }

    function onMouseUp(e) {
        isDragging = false;

        const isTouch = e.type.startsWith('touch');
        if (isTouch) {
            document.removeEventListener('touchmove', onMouseMove);
            document.removeEventListener('touchend', onMouseUp);
        } else {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }





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
        //var pageRect = element.parentElement.getBoundingClientRect();
        //element.style.left = `${e.clientX - pageRect.left - offsetX}px`;
        //element.style.top = `${e.clientY - pageRect.top - offsetY}px`;
        element.style.left = newLeft;
        element.style.top = newTop;


        const lratio = (newLeft / (document.querySelector('canvas')).getBoundingClientRect().width);
        const tratio = (newTop / (document.querySelector('canvas')).getBoundingClientRect().height);

        element.setAttribute('data-lpercent', lratio)
        element.setAttribute('data-tpercent', tratio)

    }
}

// Get all PDF pages dynamically






// Helper function to check if the draggable element is inside a page's boundaries
function isInside(elementRect, pageRect) {
    return (
        elementRect.top >= pageRect.top &&
        elementRect.bottom <= pageRect.bottom
    );
}


function base64ToBlob(base64, contentType = '', sliceSize = 512) {
    const byteCharacters = atob(base64); // Decoding base64
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
}

async function addrolelist() {
    roleList = [{
        name: "Select a role",
        email: "",
        description: ""
    }];
    for (var x = 1; x < i; x++) {

        var roleData = {
            name: $("#input_" + x).val(),
            email: $("#inputEmail_" + x).val(),
            description: $("#inputDesc_" + x).val(),
            inputid: "input_" + x,
        };

        if (roleData.name !== undefined) {
            roleList.push(roleData);

        }


    }
}

async function SaveForm() {
    await addrolelist();
    var isesealpresent = false;
    if (((document.getElementById("tempName").value).replace(/\s+/g, '')).length > 40) {
        swal({
            title: "Info",
            text: "Form name must not exceed 40 characters",
            type: "error",
        });
    }
    else if ((document.getElementById("tempName").value).replace(/\s+/g, '') !== '' && ((document.getElementById("daysToComplete").value).toString()).replace(/\s+/g, '') !== '') {


        const radioGroups = {};
        const pdfradioGroups = {};
        let duplicateCheck = new Set();
        let isValid = true;
        let missingRoles = [];
        let totalSignatureCount = 0;
        const pdfcontainer = document.getElementById('pdf-container');


        roleList.forEach((role, index) => {

            if (!role.name) {
                swal("Info", `Role name is empty`, "info");
                isValid = false;
                return;
            }


            if (duplicateCheck.has(role.name)) {
                swal("Info", `Duplicate role name found: ${role.name}. Please ensure unique role names`, "info");
                isValid = false;
                return;
            }

            duplicateCheck.add(role.name);

            const matchingElements = pdfcontainer.querySelectorAll(`[role="${role.name}"]`);

            if (index !== 0) {
                if (matchingElements.length !== 0) {
                    let roleHasSignature = false;

                    matchingElements.forEach((element1) => {
                        const element = element1.parentElement?.parentElement;

                        if (element.querySelector(`[id="Signature_${role.name}"]`)) {
                            const inputrect = element.querySelector(`[id="Signature_${role.name}"]`).getBoundingClientRect();
                            totalSignatureCount++;
                            roleHasSignature = true;
                        }
                    });

                    if (!roleHasSignature) {

                        if (!missingRoles.includes(role.name)) {
                            missingRoles.push(role.name);
                        }
                    }
                }
                else {

                    if (!missingRoles.includes(role.name)) {
                        missingRoles.push(role.name);
                    }
                }

            } else {

            }
        });

        if (!isValid) {
            return;
        }

        if (totalSignatureCount !== (roleList.length - 1)) {
            swal({

                title: "Info",

                text: `Signature annotations are missing for ${missingRoles
                    .map(role => `${role}`)
                    .join(', ')}.`,
                type: "info",
            });
        }

        // document.querySelectorAll('.pdf-page').forEach((pageElement) => {
        //     const annotationLayer = pageElement.querySelector('.annotation-layer');
        //     roleList.forEach((role, index) => {

        //         const matchingElements = annotationLayer.querySelectorAll(`[role="${role.name}"]`);

        //         if (matchingElements.length !== 0 && index !== 0) {
        //             matchingElements.forEach(element1 => {
        //                 var element = element1.parentElement?.parentElement;

        //                 if (element.querySelector(`[id="Signature_${role.name}"]`)) {
        //                     inputrect = element.querySelector(`[id="Signature_${role.name}"]`).getBoundingClientRect();
        //                     totalSignatureCount++;
        //                 }
        //             });
        //         };

        //     });
        // });


        // if(totalSignatureCount !== (roleList.length -1)){

        //     swal({
        //     title: "Info",
        //     text: 'The number of Signatures present not match the number of roles',
        //     type: "error",
        //     })
        // }
        else {

            roleList.forEach((role, index) => {
                if (index !== 0) {
                    var rolejson = { "roleId": "", "email": "", "role": role, "annotationsList": [], "placeHolderCoordinates": { "pageNumber": "", "signatureXaxis": "", "signatureYaxis": "" }, "esealplaceHolderCoordinates": {} };
                    rolesConfig.push(rolejson);
                }
            })

            document.querySelectorAll('.pdf-page').forEach((pageElement, pageIndex) => {
                const annotationLayer = pageElement.querySelector('.annotation-layer');
                const canvas = pageElement.querySelector('canvas'); // Get the canvas element
                if (!canvas) {
                    return;
                }
                const width = canvas.getBoundingClientRect().width; // Get the width of the canvas
                const height = canvas.getBoundingClientRect().height; // Get the height of the canvas
                console.log(roleList)

                roleList.forEach((role, index) => {


                    const matchingElements = annotationLayer.querySelectorAll(`[role="${role.name}"]`);

                    if (matchingElements.length !== 0 && index !== 0) {
                        const matchingObject = rolesConfig.find(obj => obj.role.name === role.name);
                        var roleannotionlist = [];


                        matchingElements.forEach(element1 => {
                            var element = element1.parentElement?.parentElement;
                            var computedStyle = window.getComputedStyle(element);


                            var draggablepadding = computedStyle.getPropertyValue('padding-top');

                            const rect = element.getBoundingClientRect();
                            if (element.querySelectorAll('.editable-text')[0]) {
                                var inputrect = element.querySelector('.editable-text').getBoundingClientRect();
                            } else if (element.querySelector(`[id="Signature_${role.name}"]`)) {
                                var inputrect = element.querySelector(`[id="Signature_${role.name}"]`).getBoundingClientRect();
                            }
                            else if (element.querySelector(`[id="Eseal_${role.name}"]`)) {
                                var inputrect = element.querySelector(`[id="Eseal_${role.name}"]`).getBoundingClientRect();
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
                            else {
                                var inputrect = element.querySelector('.input-field').getBoundingClientRect();
                            }


                            if (element.querySelectorAll('.image-container')[0]) {
                                var pele = element.parentElement;
                                var parentRect = pele.parentElement.getBoundingClientRect();
                            }
                            else {
                                var parentRect = element.parentElement.getBoundingClientRect();
                            }


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
                                        role: role.name,
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
                                    role: radio.getAttribute('role')

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
                                    page: pageIndex + 1,
                                    fontcolor: element.querySelector('input[type="text"]').style.color,
                                    role: element.querySelector('input') ? element.querySelector('input').getAttribute('role') : '',
                                    isMandatory: element.querySelector('input') ? element.querySelector('input').getAttribute('mandatory') : '',
                                });
                                matchingObject.annotationsList.push({
                                    type: 'text',
                                    x: ((rect.left - parentRect.left) / width) * 100,
                                    y: ((rect.top - parentRect.top) / height) * 100,
                                    width: (inputrect.width / width) * 100,
                                    height: (inputrect.height / height) * 100,
                                    fontsize: (parseFloat(fontSize) / width) * 100,
                                    draggablepadding: (parseFloat(draggablepadding) / width) * 100,
                                    content: element.querySelector('input[type="text"]') ? element.querySelector('input[type="text"]').value : '',
                                    id: element.querySelector('input') ? element.querySelector('input').id : '',
                                    page: pageIndex + 1,
                                    fontcolor: element.querySelector('input[type="text"]').style.color,
                                    role: element.querySelector('input') ? element.querySelector('input').getAttribute('role') : '',
                                    isMandatory: element.querySelector('input') ? element.querySelector('input').getAttribute('mandatory') : '',
                                })
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
                                    page: pageIndex + 1,
                                    role: element.querySelector('input[type="checkbox"]') ? element.querySelector('input[type="checkbox"]').getAttribute('role') : '',
                                    isMandatory: element.querySelector('input[type="checkbox"]') ? element.querySelector('input[type="checkbox"]').getAttribute('mandatory') : ''
                                });
                                matchingObject.annotationsList.push({
                                    type: 'checkbox',
                                    x: ((rect.left - parentRect.left) / width) * 100,
                                    y: ((rect.top - parentRect.top) / height) * 100,
                                    width: (inputrect.width / width) * 100,
                                    height: (inputrect.height / height) * 100,
                                    draggablepadding: (parseFloat(draggablepadding) / width) * 100,
                                    value: element.querySelector('input[type="checkbox"]') ? element.querySelector('input[type="checkbox"]').value : '',
                                    id: element.querySelector('input') ? element.querySelector('input').id : '',
                                    page: pageIndex + 1,
                                    role: element.querySelector('input[type="checkbox"]') ? element.querySelector('input[type="checkbox"]').getAttribute('role') : '',
                                    isMandatory: element.querySelector('input[type="checkbox"]') ? element.querySelector('input[type="checkbox"]').getAttribute('mandatory') : ''
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
                                    id: element.querySelector('select') ? element.querySelector('select').id : '',
                                    page: pageIndex + 1,
                                    fontcolor: element.querySelector('select').options[1] ? element.querySelector('select').options[1].style.color : "black",
                                    role: element.querySelector('select') ? element.querySelector('select').getAttribute('role') : '',
                                    isMandatory: element.querySelector('select') ? element.querySelector('select').getAttribute('mandatory') : ''
                                });
                                matchingObject.annotationsList.push({
                                    type: 'select',
                                    x: ((rect.left - parentRect.left) / width) * 100,
                                    y: ((rect.top - parentRect.top) / height) * 100,
                                    width: (inputrect.width / width) * 100,
                                    height: (inputrect.height / height) * 100,
                                    fontsize: (parseFloat(fontSize) / width) * 100,
                                    draggablepadding: (parseFloat(draggablepadding) / width) * 100,
                                    options: element.querySelector('select') ? Array.from(element.querySelector('select').options).map(option => option.value).filter(value => value !== "Select Option") : [],
                                    id: element.querySelector('select') ? element.querySelector('select').id : '',
                                    page: pageIndex + 1,
                                    fontcolor: element.querySelector('select').options[1] ? element.querySelector('select').options[1].style.color : "black",
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
                                    fontcolor: element.querySelector('input').getAttribute("data-flag"),
                                    role: element.querySelector('input') ? element.querySelector('input').getAttribute('role') : '',
                                    isMandatory: element.querySelector('input') ? element.querySelector('input').getAttribute('mandatory') : ''
                                });
                                matchingObject.annotationsList.push({
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
                                    fontcolor: element.querySelector('input').getAttribute("data-flag"),
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
                                    page: pageIndex + 1,
                                    fontcolor: (element.querySelectorAll('.editable-text')[0]).style.color,
                                    role: element.querySelectorAll('.editable-text')[0].getAttribute('role')
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
                            else if (element.querySelector(`[id="Signature_${role.name}"]`)) {
                                annotations.push({
                                    type: 'Signature',
                                    x: ((rect.left - parentRect.left) / width) * 100,
                                    y: ((rect.top - parentRect.top) / height) * 100,
                                    width: (inputrect.width / width) * 100,
                                    height: (inputrect.height / height) * 100,
                                    page: pageIndex + 1,
                                    role: element.querySelector(`[id="Signature_${role.name}"]`) ? element.querySelector(`[id="Signature_${role.name}"]`).getAttribute('role') : ''
                                });
                                matchingObject.annotationsList.push({
                                    type: 'Signature',
                                    x: ((rect.left - parentRect.left) / width) * 100,
                                    y: ((rect.top - parentRect.top) / height) * 100,
                                    width: (inputrect.width / width) * 100,
                                    height: (inputrect.height / height) * 100,
                                    page: pageIndex + 1,
                                    role: element.querySelector(`[id="Signature_${role.name}"]`) ? element.querySelector(`[id="Signature_${role.name}"]`).getAttribute('role') : ''
                                });

                                signatureX = (rect.left - parentRect.left) * scaleX;
                                signatureY = (rect.top - parentRect.top) * scaleY;

                                signaturePage = pageIndex + 1;


                                matchingObject.placeHolderCoordinates.signatureXaxis = signatureX;
                                matchingObject.placeHolderCoordinates.signatureYaxis = signatureY;
                                matchingObject.placeHolderCoordinates.signaturewidth = (inputrect.width) * scaleX;
                                matchingObject.placeHolderCoordinates.signatureheight = (inputrect.height) * scaleY;
                                matchingObject.placeHolderCoordinates.pageNumber = pageIndex + 1;
                            }
                            else if (element.querySelector(`[id="Eseal_${role.name}"]`)) {
                                isesealpresent = true;
                                annotations.push({
                                    type: 'Eseal',
                                    x: ((rect.left - parentRect.left) / width) * 100,
                                    y: ((rect.top - parentRect.top) / height) * 100,
                                    width: (inputrect.width / width) * 100,
                                    height: (inputrect.height / height) * 100,
                                    page: pageIndex + 1,
                                    role: element.querySelector(`[id="Eseal_${role.name}"]`) ? element.querySelector(`[id="Eseal_${role.name}"]`).getAttribute('role') : ''
                                });
                                matchingObject.annotationsList.push({
                                    type: 'Eseal',
                                    x: ((rect.left - parentRect.left) / width) * 100,
                                    y: ((rect.top - parentRect.top) / height) * 100,
                                    width: (inputrect.width / width) * 100,
                                    height: (inputrect.height / height) * 100,
                                    page: pageIndex + 1,
                                    role: element.querySelector(`[id="Eseal_${role.name}"]`) ? element.querySelector(`[id="Eseal_${role.name}"]`).getAttribute('role') : ''
                                });
                                esealX = (rect.left - parentRect.left) * scaleX;
                                esealY = (rect.top - parentRect.top) * scaleY;

                                esealPage = pageIndex + 1;

                                matchingObject.esealplaceHolderCoordinates.signatureXaxis = esealX;
                                matchingObject.esealplaceHolderCoordinates.signatureYaxis = esealY;
                                matchingObject.esealplaceHolderCoordinates.signaturewidth = (inputrect.width) * scaleX;
                                matchingObject.esealplaceHolderCoordinates.signatureheight = (inputrect.height) * scaleY;
                                matchingObject.esealplaceHolderCoordinates.pageNumber = esealPage;
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
                                    page: pageIndex + 1,
                                    role: ((element.querySelector('.image-container')).children[1]) ? ((element.querySelector('.image-container')).children[1]).getAttribute('role') : '',
                                    isMandatory: ((element.querySelector('.image-container')).children[1]) ? ((element.querySelector('.image-container')).children[1]).getAttribute('mandatory') : ''
                                });
                                matchingObject.annotationsList.push({
                                    type: 'imagefield',
                                    id: ((element.querySelector('.image-container')).children[1]).id,
                                    x: ((rect.left - parentRect.left) / width) * 100,
                                    y: ((rect.top - parentRect.top) / height) * 100,
                                    width: (inputrect.width / width) * 100,
                                    height: (inputrect.height / height) * 100,
                                    content: ((element.querySelector('.image-container')).children[1]).src,
                                    page: pageIndex + 1,
                                    isMandatory: ((element.querySelector('.image-container')).children[1]) ? ((element.querySelector('.image-container')).children[1]).getAttribute('mandatory') : ''
                                });
                            }


                        });


                    }
                });
            });

            // Add radio groups to annotations
            for (const groupName in radioGroups) {
                const matchingObject = rolesConfig.find(obj => obj.role.name === radioGroups[groupName].role);
                if (radioGroups.hasOwnProperty(groupName)) {
                    annotations.push(radioGroups[groupName]);
                    matchingObject.annotationsList.push(radioGroups[groupName]);
                    pdfAnnotations.push(pdfradioGroups[groupName]);
                }
            }

            rolesConfig.forEach(obj => {
                obj.annotationsList = JSON.stringify(obj.annotationsList);
            });

            console.log(rolesConfig.length)

            docConfig.name = document.getElementById("tempName").value;
            docConfig.daysToComplete = (document.getElementById("daysToComplete").value).toString();
            docConfig.AdvancedSettings = JSON.stringify(docConfig.AdvancedSettings);
            docConfig.documentName = docFileName;
            docConfig.htmlSchema = JSON.stringify(annotations);
            docConfig.pdfSchema = JSON.stringify(pdfAnnotations);
            docConfig.sequentialSigning = $("#sequentialSign").prop('checked');
            docConfig.numberOfSignatures = (rolesConfig.length).toString();
            docConfig.allSigRequired = $("#allSignRequiredCheckbox").prop('checked');

            var tosend = {
                docConfig: docConfig,
                roles: roles,
                rolesConfig: JSON.stringify(rolesConfig)
            }



            var contentType = "application/pdf";
            var pdfBlob = base64ToBlob(document.getElementById('filebase64').value, contentType);

            var fileFormData = new FormData();
            fileFormData.append("File", pdfBlob, docConfig.documentName);
            fileFormData.append("DocumentName", docConfig.documentName);
            fileFormData.append("name", docConfig.name);
            fileFormData.append("daysToComplete", docConfig.daysToComplete);
            fileFormData.append("numberOfSignatures", docConfig.numberOfSignatures)
            fileFormData.append("allSigRequired", isesealpresent);
            fileFormData.append("sequentialSigning", docConfig.sequentialSigning)
            fileFormData.append("docType", docConfig.docType)
            fileFormData.append("htmlSchema", docConfig.htmlSchema)
            fileFormData.append("pdfSchema", docConfig.pdfSchema)
            fileFormData.append("advancedSettings", docConfig.AdvancedSettings);
            fileFormData.append("roles", JSON.stringify(roles));
            fileFormData.append("rolesConfig", JSON.stringify(rolesConfig));

            SaveDocument(saveFormUrl, fileFormData)
                .then((response) => {
                    console.log(response)

                    if (response.status == "Success") {
                        swal({
                            title: "Success",
                            text: response.message,
                            type: "success",
                        }, function (isConfirm) {
                            if (isConfirm) {
                                document.getElementById("navigationNetworkOverlay").style.display = "block";
                                window.location.href = DigitalFormsIndexUrl;
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
                                rolesConfig = [];
                                annotations = [];
                                pdfAnnotations = [];
                            }
                        });

                    }

                })

        }

    }

    else if ((document.getElementById("tempName").value).replace(/\s+/g, '') !== '' && ((document.getElementById("daysToComplete").value).toString()).replace(/\s+/g, '') === '') {
        swal({
            title: "Info",
            text: "Form Validity should not be empty",
            type: "error",
        });

    }
    else if ((document.getElementById("tempName").value).replace(/\s+/g, '') === '' && ((document.getElementById("daysToComplete").value).toString()).replace(/\s+/g, '') !== '') {
        swal({
            title: "Info",
            text: "Form Name should not be empty",
            type: "error",
        });

    }
    else {
        swal({
            title: "Info",
            text: "Form Name and Form Validity should not be empty",
            type: "error",
        });
    }

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

function validateRole(event) {
    event.target.value = event.target.value.replace(/[^a-zA-Z0-9 _]/g, '');
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


