$(document).ready(function () {

    /*  $('#digitalforms').addClass('active') */

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

    // var tooltipTrigger = document.getElementById("circle1"); // Target your element
    // var tooltip = new bootstrap.Tooltip(tooltipTrigger, {
    //     customClass: "custom-tooltip",
    //     trigger: "manual", // ✅ Prevents hover/click events from controlling visibility
    // });

    // tooltip.show();

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


    // Step Navigation
    $("#saveFormBtn").on("click", SaveForm);
    $("#circle1").on("click", DocConfig);
    $("#circle2").on("click", Roles);
    $("#circle3").on("click", RolesConfiguraton);

    // Input validation
    $("#daysToComplete").on("input", validateInput);
    $("#input_1").on("input", validateRole);

    // Template options
    $("#innerModel").on("click", ImagePreview);
    $("#EsealInnerModel").on("click", ImagePreviewEseal);

    // Step Buttons
    $("#step1Next").on("click", Roles);
    $("#step2Prev").on("click", DocConfig);
    $("#step2Next").on("click", RolesConfiguraton);
    $("#step3Prev").on("click", Roles);

    // Roles
    $("#addRoleBtn").on("click", addNewRole);

    // Tools (left side menu)
    $("#headerid").on("click", () => handleOpenTools(true));
    $("#textid").on("click", () => handleAddText(true));
    $("#fieldid").on("click", () => handleAddInputBlock(true));
    $("#onlytextid").on("click", () => handleAddOnlytext(true));
    $("#textareaid").on("click", () => handleAddTextArea(true));
    $("#radioid").on("click", () => handleAddRadio(true));
    $("#checkboxid").on("click", () => handleCheckbox(true));
    $("#selectid").on("click", () => handleAddSelect(true));
    $("#signatureid").on("click", () => handleSignature(true));
    $("#esealid").on("click", () => handleEseal(true));
    $("#tableid").on("click", () => handleAddTable(true));
    $("#buttonid").on("click", handleAddButton);
    $("#imageid").on("click", () => handleAddimage("image field", true));

    // Recommended fields
    $("#rfullname").on("click", () => handleAddRecommended("Full Name", "Full Name", true));
    $("#rgender").on("click", () => handleAddRecommended("Gender", "Gender", true));
    $("#remail").on("click", () => handleAddRecommended("Email", "email", true));
    $("#rphone").on("click", () => handleAddRecommended("Phone Number", "Phone Number", true));
    $("#rdate").on("click", () => handleAddRecommended("Date of Birth", "Date of Birth", true));
    $("#rfname").on("click", () => handleAddRecommended("First Name", "firstname", true));
    $("#rLastName").on("click", () => handleAddRecommended("Last Name", "lastname", true));
    $("#rNation").on("click", () => handleAddRecommended("Nation", "Nation", true));
    $("#rSelfie").on("click", () => handleAddimage("Selfie", true));

    // Role block actions
    $("#signatureid1").on("click", () => handleSignature(true));
    $("#esealid1").on("click", () => handleEseal(true));

    $("#btnCloseSignaturePreview").on("click", closeModal);
    $("#btnCloseEsealPreview").on("click", closeModals);

    $('#tableRowsInput').on('input', function (event) {

        validateTable(event);

    });



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
    document.getElementById('secondrole').style.display = 'none';
    document.getElementById('singlerole').style.display = 'block';
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
            var toolbarButtons = document.querySelectorAll('#toolbar button');
            toolbarButtons.forEach(button => {
                button.disabled = true;

            });
            var autoButtons = document.querySelectorAll('#recommendedfields button');
            autoButtons.forEach(button => {
                button.disabled = true;
            });
            swal({
                title: "Info",
                text: "Role name is empty",
                type: "error",
            }, () => { Roles() });
        } else {
            var toolbarButtons = document.querySelectorAll('#toolbar button');
            toolbarButtons.forEach(button => {
                button.disabled = false;

            });
            var autoButtons = document.querySelectorAll('#recommendedfields button');
            autoButtons.forEach(button => {
                button.disabled = false;
            });
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
var roleList = [];
var i = 2;
var radiofieldname = 1;

var inputId = '';
var inputEmail = '';
var inputDesc = '';




var currentGroupName = `group-${Date.now()}`;
var editorInstance;
var editorInstances = [];
var annotations = [];
var scaleX = '';
var scaleY = '';
var signatureX = null;
var signatureY = null;
var signaturePage = null;
var signaturewidth = null;
var signatureheight = null;
var esealX = null;
var esealY = null;
var esealPage = null;
var esealheight = null;
var esealwidth = null;
const usedLabels = new Set();
var isdrag = false;
var pdfAnnotations = [];
var docConfig = {
    "name": "",
    "daysToComplete": "",
    "numberOfSignatures": "",
    "allSigRequired": true,
    "publishGlobally": false,
    "sequentialSigning": true,
    "AdvancedSettings": { "signatureSelectedName": "", "signatureSelectedImage": "", "previewsignselected": false, "previewesealselected": false, "esealSelectedImage": "", "esealSelectedName": "", "signatureSelected": 0, "esealSelected": 0 },
    "documentName": "",
    "docType": "WEB",
    "htmlSchema": "",
    "pdfSchema": ""

};
var roles = [{
    "email": "",
    "name": "Client",
    "description": "Default Signer Role"
}];
var rolesConfig = [];


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
    nameLabel.className = 'col-form-label  pl-0';
    nameLabel.style.fontSize = '11.5px';
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
    emailLabel.style.fontSize = '11.5px';
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
    descLabel.style.fontSize = '11.5px';
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
        const pdfContainer = document.getElementById('page-container');
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
// function InnerDiv() {
//     var model = document.getElementById("innerModel");
//     var model_1 = document.getElementById("EsealInnerModel");

//     // Toggle display based on the current state
//     var isHidden = model.style.display === "none" || model_1.style.display === "none";
//     model.style.display = isHidden ? "block" : "none";
//     model_1.style.display = isHidden ? "block" : "none";
// }
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


class dummyBlock {
    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.style.display = 'none';
        return this.wrapper;
    }
    validate() {
        return false;
    }
    save() {
        return {}
    }
}

class HeaderBlock {
    static get toolbox() {
        return {
            title: 'Header',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        };
    }



    constructor({ data, api }) {
        this.api = api;
        this.data = (data && Object.keys(data).length > 0) ? data : { tag: 'h2', alignment: 'left', text: '' }

        this.wrapper = null;
        this.editButton = null;
        this.header = null;
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.style.position = 'relative';
        this.header = document.createElement(this.data.tag);
        this.header.textContent = this.data.text;
        this.header.setAttribute('contenteditable', 'true');
        this.header.style.outline = 'none'
        this.header.style.marginBottom = '0';

        this.header.style.textAlign = this.data.alignment;

        this.wrapper.appendChild(this.header);

        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';
        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.backgroundColor = 'transparent';
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.zIndex = '100';
        this.editButton.style.outline = 'none';
        this.editButton.style.display = 'none';
        this.editButton.onclick = () => this.openEditModal();

        this.wrapper.appendChild(this.editButton);

        this.wrapper.onmouseover = () => {
            this.editButton.style.display = 'block';
        };
        this.wrapper.onmouseout = () => {
            this.editButton.style.display = 'none';
        };

        return this.wrapper;
    }
    renderHeader() {
        this.wrapper.innerHTML = '';
        this.header = null;
        this.header = document.createElement(this.data.tag);
        this.header.textContent = this.data.text;
        this.header.setAttribute('contenteditable', 'true');
        this.header.style.outline = 'none'

        this.header.style.textAlign = this.data.alignment;

        this.wrapper.appendChild(this.header);
        this.wrapper.appendChild(this.editButton);
        this.wrapper.onmouseover = () => {
            this.editButton.style.display = 'block';
        };
        this.wrapper.onmouseout = () => {
            this.editButton.style.display = 'none';
        };

    }



    save(blockContent) {
        const height = this.wrapper?.offsetHeight || 0;
        this.data.text = this.header.textContent;
        this.data.blockheight = height;
        return this.data;
    }

    openEditModal() {
        const headerTagSelect = document.getElementById('headerTagSelect');
        const headerAlignmentSelect = document.getElementById('headerAlignmentSelect');

        const previewContainer = document.getElementById('headerPreview');


        const updateHeaderPreview = () => {

            previewContainer.innerHTML = '';


            const newPreviewHeader = document.createElement(headerTagSelect.value);
            newPreviewHeader.id = 'previewHeader';
            newPreviewHeader.style.textAlign = headerAlignmentSelect.value;
            newPreviewHeader.textContent = this.header.textContent

            previewContainer.appendChild(newPreviewHeader);
        };

        headerAlignmentSelect.value = this.data.alignment;
        headerTagSelect.value = this.data.tag;
        updateHeaderPreview();

        headerTagSelect.addEventListener('change', updateHeaderPreview);
        headerAlignmentSelect.addEventListener('change', updateHeaderPreview);


        const saveButton = document.getElementById('saveHeaderData');
        saveButton.onclick = () => {
            this.data.tag = headerTagSelect.value;
            this.data.alignment = headerAlignmentSelect.value;
            this.data.text = this.header.textContent;
            this.renderHeader();
            $('#editHeaderModal').modal('hide');
        };

        const deletebutton = document.getElementById('deleteheaderblock')
        deletebutton.onclick = () => {
            const index = this.api.blocks.getCurrentBlockIndex()
            this.api.blocks.delete(index)
            $('#editInputModal').modal('hide');

        };


        $('#editHeaderModal').modal('show');
    }

}

class ParagraphBlock {
    static get toolbox() {
        return {
            title: 'Paragraph',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 96 960 960" width="24"><path d="M260 776q-17 0-28.5-11.5T220 736q0-17 11.5-28.5T260 696h440q17 0 28.5 11.5T740 736q0 17-11.5 28.5T700 776H260Zm-60-240q-17 0-28.5-11.5T160 496q0-17 11.5-28.5T200 456h560q17 0 28.5 11.5T800 496q0 17-11.5 28.5T760 536H200Zm60-240q-17 0-28.5-11.5T220 256q0-17 11.5-28.5T260 216h440q17 0 28.5 11.5T740 256q0 17-11.5 28.5T700 296H260Z"/></svg>',
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            text: 'Paragraph',
            fontFamily: 'Arial',
            fontSize: '16px',
            textAlign: 'left',
            fontWeight: 'normal',
            fontStyle: 'normal',
        };
        this.wrapper = null;
        this.editButton = null;
    }



    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'paragraph-block-wrapper';
        this.wrapper.style.position = 'relative';
        this.wrapper.style.padding = '1em 0';


        const paragraph = document.createElement('p');
        paragraph.className = 'paragraph-block';
        paragraph.contentEditable = true;
        paragraph.textContent = this.data.text;
        paragraph.style.setProperty('font-family', this.data.fontFamily, 'important');
        paragraph.style.fontSize = this.data.fontSize;
        paragraph.style.textAlign = this.data.textAlign;
        paragraph.style.fontWeight = this.data.fontWeight;
        paragraph.style.fontStyle = this.data.fontStyle;
        paragraph.style.outline = 'none';
        paragraph.style.margin = '0';
        paragraph.style.padding = '0';
        this.paragraphElement = paragraph;

        paragraph.addEventListener('paste', (event) => {
            const selection = window.getSelection();
            const anchorNode = selection?.anchorNode;
            const text = this.data.text;
            const fontFamily = this.data.fontFamily;
            const fontSize = this.data.fontSize;
            const textAlign = this.data.textAlign;
            const fontWeight = this.data.fontWeight;
            const fontStyle = this.data.fontStyle;

            if (!anchorNode) return;



            const pastedContent = event.clipboardData.getData('text/plain');
            const paragraphs = pastedContent.split('\n').filter(paragraph => paragraph.trim() !== '');

            if (paragraphs.length <= 1) return;
            event.preventDefault();

            if (editorInstance) {

                const selectedBlockIndex = editorInstance.blocks.getCurrentBlockIndex();

                console.log(`🟢 Currently Selected Block Index: ${selectedBlockIndex}`);


                if (selectedBlockIndex !== -1) {

                    editorInstance.blocks.delete(selectedBlockIndex);
                }



                paragraphs.forEach(paragraph => {
                    editorInstance.blocks.insert('paragraph', {
                        text: paragraph,
                        fontFamily: 'Arial',
                        fontSize: '1rem',
                        textAlign: 'left',
                        fontWeight: 'normal',
                        fontStyle: 'normal',
                    });
                });

                editorInstance.blocks.insert('paragraph', {
                    text: text,
                    fontFamily: fontFamily,
                    fontSize: fontSize,
                    textAlign: textAlign,
                    fontWeight: fontWeight,
                    fontStyle: fontStyle,
                }, {}, selectedBlockIndex);

            }
        });


        paragraph.oninput = () => {
            this.data.text = paragraph.textContent;
        };

        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';
        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.background = 'transparent';
        this.editButton.style.border = 'none';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.outline = 'none';
        this.editButton.style.display = 'none';
        this.editButton.onclick = () => this.openEditModal();

        this.wrapper.onmouseover = () => (this.editButton.style.display = 'block');
        this.wrapper.onmouseout = () => (this.editButton.style.display = 'none');

        this.wrapper.appendChild(paragraph);
        this.wrapper.appendChild(this.editButton);

        return this.wrapper;
    }

    save(blockContent) {
        const height = this.wrapper?.offsetHeight || 0;
        return {

            text: this.data.text,
            fontFamily: this.data.fontFamily,
            fontSize: this.data.fontSize,
            textAlign: this.data.textAlign,
            fontWeight: this.data.fontWeight,
            fontStyle: this.data.fontStyle,
            blockheight: height
        };
    }

    openEditModal() {

        const fontFamilySelect = document.getElementById('paragraphFontFamily');
        const fontSizeInput = document.getElementById('paragraphFontSize');
        const textAlignSelect = document.getElementById('paragraphTextAlign');
        const boldButton = document.getElementById('paragraphBoldButton');
        const italicButton = document.getElementById('paragraphItalicButton');

        fontFamilySelect.value = this.data.fontFamily;
        fontSizeInput.value = this.data.fontSize;
        textAlignSelect.value = this.data.textAlign;
        boldButton.classList.toggle('btn-primary', this.data.fontWeight === 'bold');
        italicButton.classList.toggle('btn-primary', this.data.fontStyle === 'italic');

        const updatePreview = () => {
            const preview = document.getElementById('paragraphPreview');
            preview.style.setProperty('font-family', fontFamilySelect.value, 'important');
            preview.style.fontSize = fontSizeInput.value;
            preview.style.textAlign = textAlignSelect.value;
            preview.style.fontWeight = boldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            preview.style.fontStyle = italicButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            preview.textContent = this.data.text;
        };
        fontFamilySelect.addEventListener('change', updatePreview);
        fontSizeInput.addEventListener('input', updatePreview);
        textAlignSelect.addEventListener('change', updatePreview);
        boldButton.onclick = () => {
            boldButton.classList.toggle("btn-primary");
            updatePreview();
        };
        italicButton.onclick = () => {
            italicButton.classList.toggle("btn-primary");
            updatePreview();
        };

        document.getElementById('saveParagraphButton').onclick = () => {
            this.data.fontFamily = fontFamilySelect.value;
            this.data.fontSize = fontSizeInput.value;
            this.data.textAlign = textAlignSelect.value;
            this.data.fontWeight = boldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            this.data.fontStyle = italicButton.classList.contains('btn-primary') ? 'italic' : 'normal';

            this.paragraphElement.textContent = this.data.text;
            this.paragraphElement.style.setProperty('font-family', this.data.fontFamily, 'important');
            this.paragraphElement.style.fontSize = this.data.fontSize;
            this.paragraphElement.style.textAlign = this.data.textAlign;
            this.paragraphElement.style.fontWeight = this.data.fontWeight;
            this.paragraphElement.style.fontStyle = this.data.fontStyle;

            $('#paragraphEditModal').modal('hide');
        };

        updatePreview();
        $('#paragraphEditModal').modal('show');
    }
}


class TableBlock {
    static get toolbox() {
        return {
            title: 'Table',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000"><path d="M4 4H2v16h2V4zm4 0H6v16h2V4zm4 0h-2v16h2V4zm4 0h-2v16h2V4zm4 0h-2v16h2V4z"/></svg>',
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            fieldName: 'table',
            rows: 2,
            cols: 2,
            fontFamily: 'Arial',
            fontSize: '16px',
            isBold: false,
            isItalic: false,
            cells: Array(2).fill().map(() => Array(2).fill('')),
            mandatory: false,
        };
        this.wrapper = null;
        this.editButton = null;
        this.inputid = null;
    }

    render() {
        const selectElement = document.getElementById('ClientSelect');
        const selectedRole = selectElement.value;
        this.data.selectedIndex = this.data.selectedIndex ? this.data.selectedIndex : selectElement.selectedIndex;
        this.inputid = document.getElementById(roleList[this.data.selectedIndex]?.inputid);
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'table-container';
        this.wrapper.style.padding = "1em 0";
        this.data.role = this.data.role ? this.data.role : selectedRole;

        const table = document.createElement('table');
        table.className = 'custom-table';
        table.setAttribute('role', this.data.role);

        this.wrapper.appendChild(table);
        this.renderTable();

        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';
        this.editButton.style.display = 'none';
        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.backgroundColor = 'transparent';
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.transition = 'opacity 0.3s';
        this.editButton.style.zIndex = '100';
        this.editButton.style.outline = 'none';
        this.editButton.onclick = () => this.openEditModal();

        this.wrapper.appendChild(this.editButton);

        this.wrapper.onmouseover = () => {
            this.editButton.style.display = 'block';
        };
        this.wrapper.onmouseout = () => {
            this.editButton.style.display = 'none';
        };
        if (this.inputid) {
            this.inputid.addEventListener('input', (event) => {
                usedLabels.delete(this.data.fieldName + "_" + this.data.role);
                this.data.role = event.target.value;
                table.setAttribute('role', this.data.role);
                usedLabels.add(this.data.fieldName + "_" + this.data.role);
            });

        }

        return this.wrapper;
    }

    renderTable() {
        const table = this.wrapper.querySelector('table');
        table.innerHTML = '';
        for (let i = 0; i < this.data.rows; i++) {
            const row = table.insertRow();
            for (let j = 0; j < this.data.cols; j++) {
                const cell = row.insertCell();
                cell.contentEditable = true;
                cell.textContent = this.data.cells[i][j] || (i === 0 ? `Header ${j + 1}` : ``);
                if (i == 0) {
                    cell.style.fontWeight = "bold"
                }
                else {
                    cell.style.fontWeight = this.data.isBold ? "bold" : "normal";

                }
                this.data.cells[i][j] = cell.textContent;
                cell.style.fontFamily = this.data.fontFamily;
                cell.style.fontSize = this.data.fontSize;
                cell.style.fontStyle = this.data.isItalic ? "italic" : "normal";
                cell.addEventListener('input', (event) => {
                    this.data.cells[i][j] = event.target.textContent;
                });
            }
        }
    }

    renderTablePreview() {
        const tablePreview = document.getElementById('tablePreview');
        tablePreview.innerHTML = '';
        const table = document.createElement('table');
        table.className = 'custom-table';
        for (let i = 0; i < this.data.rows; i++) {
            const row = table.insertRow();
            for (let j = 0; j < this.data.cols; j++) {
                const cell = row.insertCell();
                cell.contentEditable = false;
                cell.style.whiteSpace = 'pre';
                cell.textContent = this.data.cells[i][j] || (i === 0 ? `Header ${j + 1}` : ` `);
                if (i == 0) {
                    cell.style.fontWeight = 'bold'

                }
                else {
                    cell.style.fontWeight = this.data.isBold ? "bold" : "normal";

                }
                cell.style.fontFamily = this.data.fontFamily;
                cell.style.fontSize = this.data.fontSize;
                cell.style.fontStyle = this.data.isItalic ? "italic" : "normal";
            }
        }
        tablePreview.appendChild(table);
    }

    save() {
        return this.data;
    }

    destroy() {
        const labelToRemove = this.data.fieldName + "_" + this.data.role;


        if (usedLabels.has(labelToRemove)) {
            usedLabels.delete(labelToRemove);
        }
    }


    openEditModal() {
        const fieldNameInput = document.getElementById('fieldNameInput');
        const tableRowsInput = document.getElementById('tableRowsInput');
        const tableColsInput = document.getElementById('tableColsInput');
        const fontFamilySelect = document.getElementById('fontFamilySelect');
        const fontSizeInput = document.getElementById('fontSizeInput');
        const boldButton = document.getElementById('tableboldButton');
        const italicButton = document.getElementById('tableitalicButton');
        const labelTableError = document.getElementById('labelTableError');
        labelTableError.classList.add('d-none');
        const mandatoryCheckboxTable = document.getElementById('mandatoryCheckboxTable');
        mandatoryCheckboxTable.checked = this.data.mandatory;
        mandatoryCheckboxTable.addEventListener('change', () => {
            this.data.mandatory = mandatoryCheckboxTable.checked;
        });

        fieldNameInput.value = this.data.fieldName;
        tableRowsInput.value = this.data.rows;
        tableColsInput.value = this.data.cols;
        fontFamilySelect.value = this.data.fontFamily;
        fontSizeInput.value = this.data.fontSize;
        boldButton.classList.toggle("btn-primary", this.data.isBold === 'bold');
        italicButton.classList.toggle("btn-primary", this.data.isItalic === 'italic');

        const updateTablePreview = () => {
            this.data.fieldName = fieldNameInput.value;
            this.data.rows = tableRowsInput.value;
            this.data.cols = tableColsInput.value;
            this.data.fontFamily = fontFamilySelect.value;
            this.data.fontSize = fontSizeInput.value;
            this.data.isBold = boldButton.classList.contains("btn-primary");
            this.data.isItalic = italicButton.classList.contains("btn-primary");
            this.data.cells = Array.from({ length: this.data.rows }, (_, i) =>
                Array.from({ length: this.data.cols }, (_, j) => this.data.cells[i]?.[j] || '')
            );
            this.renderTablePreview();
        };

        tableRowsInput.addEventListener('input', updateTablePreview);
        tableColsInput.addEventListener('input', updateTablePreview);
        fontFamilySelect.addEventListener('change', updateTablePreview);
        fontSizeInput.addEventListener('input', updateTablePreview);
        boldButton.onclick = () => {
            boldButton.classList.toggle("btn-primary");
            updateTablePreview();
        };
        italicButton.onclick = () => {
            italicButton.classList.toggle("btn-primary");
            updateTablePreview();
        };

        updateTablePreview();

        const saveButton = document.getElementById('saveTableData');
        saveButton.onclick = () => {
            const newLabel = fieldNameInput.value + "_" + this.data.role;
            if (usedLabels.has(newLabel) && newLabel !== this.data.fieldName + "_" + this.data.role) {
                labelTableError.innerText = "Dublicate Field Name";
                labelTableError.classList.remove('d-none');

                return;
            }
            else {
                labelTableError.classList.add('d-none');
            }

            if (fieldNameInput.value === "") {
                labelTableError.innerText = "Field Name can't be Empty";
                labelTableError.classList.remove('d-none');
                return;
            }
            else {
                labelTableError.classList.add('d-none');
            }


            usedLabels.delete(this.data.fieldName + "_" + this.data.role);
            usedLabels.add(newLabel);
            this.data.fieldName = fieldNameInput.value;
            this.data.rows = tableRowsInput.value;
            this.data.cols = tableColsInput.value;
            this.data.fontFamily = fontFamilySelect.value;
            this.data.fontSize = fontSizeInput.value;
            this.data.isBold = boldButton.classList.contains("btn-primary");
            this.data.isItalic = italicButton.classList.contains("btn-primary");
            this.data.cells = Array.from({ length: this.data.rows }, (_, i) =>
                Array.from({ length: this.data.cols }, (_, j) => this.data.cells[i]?.[j] || '')
            );
            this.renderTable();
            $('#editTableModal').modal('hide');
        };
        const deletebutton = document.getElementById('deletetableblock')
        deletebutton.onclick = () => {
            const index = this.api.blocks.getCurrentBlockIndex()
            this.api.blocks.delete(index)
            $('#editInputModal').modal('hide');

        };
        $('#editTableModal').modal('show');
    }
}






class FontFamilyInlineTool {
    static get isInline() {
        return true;
    }

    constructor({ api }) {
        this.api = api;
        this.button = null;
        this.select = null;
        this.tag = 'SPAN';
        this.class = 'cdx-font-family';
    }

    render() {
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.innerHTML = 'FF';
        this.button.classList.add('cdx-inline-tool-button');

        this.select = document.createElement('select');
        const fonts = ['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'];
        fonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.innerText = font;
            this.select.appendChild(option);
        });

        this.button.appendChild(this.select);
        this.select.addEventListener('change', this.changeFontFamily.bind(this));

        return this.button;
    }

    changeFontFamily() {
        const selectedFont = this.select.value;
        this.api.inlineToolbar.close();
        this.wrap(selectedFont);
    }

    wrap(fontFamily) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);

        if (range.collapsed) return;

        const span = document.createElement(this.tag);
        span.style.fontFamily = fontFamily;
        span.classList.add(this.class);


        const content = range.extractContents();
        span.appendChild(content);
        range.insertNode(span);

        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        selection.addRange(newRange);
    }

    checkState(selection) {
        const parent = selection.anchorNode.parentNode;
        this.button.classList.toggle(this.api.styles.inlineToolButtonActive, parent.tagName === this.tag && parent.style.fontFamily);
    }

    static get sanitize() {
        return {
            span: {
                class: this.class,
                style: true,
            }
        };
    }
}

class FontSizeInlineTool {
    static get isInline() {
        return true;
    }

    constructor({ api }) {
        this.api = api;
        this.button = null;
        this.select = null;
        this.tag = 'SPAN';
        this.class = 'cdx-font-size';
        this.value = null;
    }

    render() {
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.innerHTML = 'FS';
        this.button.classList.add('cdx-inline-tool-button');

        this.select = document.createElement('select');
        const sizes = ['10px', '12px', '14px', '16px', '18px', '24px', '36px'];
        sizes.forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.innerText = size;
            this.select.appendChild(option);
        });
        const selection = window.getSelection();
        const parent = selection.anchorNode.parentNode;
        if (parent.style.fontSize) {
            this.select.value = parent.style.fontSize;
        }

        this.button.appendChild(this.select);
        this.select.addEventListener('change', this.changeFontSize.bind(this));

        return this.button;
    }

    changeFontSize() {
        this.value = this.select.value; // Update the selected value
        this.api.inlineToolbar.close();
        this.wrap(this.value);
    }

    wrap(fontSize) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);

        if (range.collapsed) return;

        const span = document.createElement(this.tag);
        span.style.fontSize = fontSize;
        span.classList.add(this.class);

        const content = range.extractContents();
        span.appendChild(content);
        range.insertNode(span);

        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        selection.addRange(newRange);
    }

    checkState(selection) {
        const parent = selection.anchorNode.parentNode;
        if (parent.tagName === this.tag && parent.style.fontSize) {
            this.value = parent.style.fontSize; // Update the value based on the current selection
            this.select.value = this.value; // Show the selected value
            this.button.classList.add(this.api.styles.inlineToolButtonActive);
        } else {
            this.value = null; // Reset value if no font size is applied
            this.select.value = ''; // Clear the select
            this.button.classList.remove(this.api.styles.inlineToolButtonActive);
        }
    }

    static get sanitize() {
        return {
            span: {
                class: this.class,
                style: true,
            }
        };
    }
}


class SignatureBlock {
    static get toolbox() {
        return {
            title: 'Input',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M15 7L22 12L15 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            content: 'Signature',
            width: '15%',
            height: 'auto',
            alignment: 'center',
            fieldName: 'input field'
        };
        this.wrapper = null;
        this.editButton = null;
        this.inputid = null;
    }

    render() {
        const selectElement = document.getElementById('ClientSelect');
        const selectedRole = selectElement.value;
        this.data.selectedIndex = this.data.selectedIndex ? this.data.selectedIndex : selectElement.selectedIndex;
        this.inputid = document.getElementById(roleList[this.data.selectedIndex]?.inputid);
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'input-block';
        this.wrapper.style.position = 'relative';
        this.wrapper.style.height = this.data.height;
        this.wrapper.style.textAlign = this.data.alignment;
        this.wrapper.style.padding = "1em 0";
        this.data.role = this.data.role ? this.data.role : selectedRole;


        const inputDiv = document.createElement('div');
        inputDiv.style.border = "1px solid #44aad1";

        inputDiv.style.width = (window.eHeight * 0.2) + 'px';
        inputDiv.id = 'Signature' + "_" + this.data.role;
        inputDiv.style.height = (window.eHeight * 0.05) + 'px';
        inputDiv.textContent = 'Signature' + "_" + this.data.role;
        inputDiv.style.backgroundColor = "#d8d7d78a";
        inputDiv.style.color = "#44aad1";
        inputDiv.style.fontSize = "100%";
        inputDiv.style.display = 'inline-block';
        inputDiv.style.textAlign = 'center';
        inputDiv.setAttribute('role', this.data.role);



        this.wrapper.appendChild(inputDiv);

        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';
        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.backgroundColor = 'transparent';
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.zIndex = '100';
        this.editButton.onclick = () => this.openEditModal();
        this.editButton.style.display = 'none';

        this.wrapper.appendChild(this.editButton);

        this.wrapper.onmouseover = () => {
            this.editButton.style.display = 'block';
        };
        this.wrapper.onmouseout = () => {
            this.editButton.style.display = 'none';
        };

        if (this.inputid) {
            this.inputid.addEventListener('input', (event) => {
                usedLabels.delete(this.data.fieldName + "_" + this.data.role);
                this.data.role = event.target.value;
                inputDiv.id = 'Signature' + "_" + this.data.role;
                inputDiv.textContent = 'Signature' + "_" + this.data.role;
                inputDiv.setAttribute('role', this.data.role);
                usedLabels.add(this.data.fieldName + "_" + this.data.role);
            });

        }

        return this.wrapper;
    }

    save(blockContent) {
        return this.data;
    }



    openEditModal() {

        const inputAlignment = document.getElementById('inputAlignmentSig');
        const inputPreview = document.getElementById('inputPreviewSig');


        inputPreview.style.textAlign = this.data.alignment;
        inputAlignment.value = this.data.alignment;

        const updateInputPreview = () => {

            inputPreview.style.textAlign = inputAlignment.value;
        };
        inputAlignment.addEventListener('change', updateInputPreview);

        const saveButton = document.getElementById('saveInputData');
        saveButton.onclick = () => {

            this.data.alignment = inputAlignment.value;

            this.wrapper.style.textAlign = inputAlignment.value;
            $('#editSignatureModal').modal('hide');
        };
        const deletebutton = document.getElementById('deletesignatureblock')
        deletebutton.onclick = () => {
            const index = this.api.blocks.getCurrentBlockIndex()
            this.api.blocks.delete(index)
            $('#editInputModal').modal('hide');

        };

        $('#editSignatureModal').modal('show');
    }
}


class EsealBlock {
    static get toolbox() {
        return {
            title: 'Input',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M15 7L22 12L15 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            content: 'Eseal',
            width: '15%',
            height: 'auto',
            alignment: 'center',
            fieldName: 'input field'
        };
        this.wrapper = null;
        this.editButton = null;
        this.inputid = null;
    }

    render() {
        const selectElement = document.getElementById('ClientSelect');
        const selectedRole = selectElement.value;
        this.data.selectedIndex = this.data.selectedIndex ? this.data.selectedIndex : selectElement.selectedIndex;
        this.inputid = document.getElementById(roleList[this.data.selectedIndex]?.inputid);
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'input-block';
        this.wrapper.style.position = 'relative';
        this.wrapper.style.height = this.data.height;
        this.wrapper.style.textAlign = this.data.alignment;
        this.wrapper.style.padding = "1em 0";
        this.data.role = this.data.role ? this.data.role : selectedRole


        const inputDiv = document.createElement('div');
        inputDiv.style.border = "1px solid #44aad1";

        inputDiv.style.width = (window.eHeight * 0.10) + 'px';
        inputDiv.id = 'Eseal' + "_" + this.data.role;
        inputDiv.style.height = (window.eHeight * 0.10) + 'px';
        inputDiv.textContent = 'Eseal' + "_" + this.data.role;
        inputDiv.style.backgroundColor = "#d8d7d78a";
        inputDiv.style.color = "#44aad1";
        inputDiv.style.fontSize = "100%";
        inputDiv.style.display = 'inline-flex';
        inputDiv.style.alignItems = 'center';
        inputDiv.style.justifyContent = 'center';
        inputDiv.style.textAlign = 'center';
        inputDiv.setAttribute('role', this.data.role);

        inputDiv.style.wordBreak = 'break-word';




        this.wrapper.appendChild(inputDiv);

        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';
        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.backgroundColor = 'transparent';
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.zIndex = '100';
        this.editButton.onclick = () => this.openEditModal();
        this.editButton.style.display = 'none';

        this.wrapper.appendChild(this.editButton);

        this.wrapper.onmouseover = () => {
            this.editButton.style.display = 'block';
        };
        this.wrapper.onmouseout = () => {
            this.editButton.style.display = 'none';
        };

        if (this.inputid) {
            this.inputid.addEventListener('input', (event) => {
                usedLabels.delete(this.data.fieldName + "_" + this.data.role);
                this.data.role = event.target.value;
                inputDiv.id = 'Eseal' + "_" + this.data.role;
                inputDiv.textContent = 'Eseal' + "_" + this.data.role;
                inputDiv.setAttribute('role', this.data.role);
                usedLabels.add(this.data.fieldName + "_" + this.data.role);
            });

        }

        return this.wrapper;
    }

    save(blockContent) {
        return this.data;
    }

    openEditModal() {

        const inputAlignment = document.getElementById('inputAlignmentEseal');
        const inputPreview = document.getElementById('inputPreviewEseal');
        const esealpreview = document.getElementById('esealpreview');
        esealpreview.style.height = (window.eHeight * 0.10) + 'px';
        esealpreview.style.width = (window.eHeight * 0.10) + 'px';

        inputPreview.style.textAlign = this.data.alignment;
        inputAlignment.value = this.data.alignment;

        const updateInputPreview = () => {

            inputPreview.style.textAlign = inputAlignment.value;
        };
        inputAlignment.addEventListener('change', updateInputPreview);

        const saveButton = document.getElementById('saveEsealData');
        saveButton.onclick = () => {

            this.data.alignment = inputAlignment.value;

            this.wrapper.style.textAlign = inputAlignment.value;
            $('#editEsealModal').modal('hide');
        };
        const deletebutton = document.getElementById('deleteesealblock')
        deletebutton.onclick = () => {
            const index = this.api.blocks.getCurrentBlockIndex()
            this.api.blocks.delete(index)
            $('#editInputModal').modal('hide');

        };

        $('#editEsealModal').modal('show');
    }
}




class SelectTool {
    static get toolbox() {
        return {
            title: 'Select',
            icon: '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg" fill="#000000"><circle cx="8.5" cy="7.5" r="6.5" fill="#000000"/></svg>',
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            label: 'Select Label',
            options: [],
            selected: '',
            labelPosition: 'left',
            labelfamily: 'Arial',
            labelSize: '16px',
            labelBold: 'normal',
            labelItalic: 'normal',
            optionFamily: 'Arial',
            optionSize: '16px',
            optionBold: 'normal',
            optionItalic: 'normal',
            selectWidth: '100',
            mandatory: false,
        };
        this.wrapper = null;
        this.labelElement = null;
        this.selectElement = null;
        this.editButton = null;
        this.inputid = null;
        this.asterisk = null;


    }

    render() {
        const selectElement = document.getElementById('ClientSelect');
        const selectedRole = selectElement.value;
        this.data.selectedIndex = this.data.selectedIndex ? this.data.selectedIndex : selectElement.selectedIndex;
        this.inputid = document.getElementById(roleList[this.data.selectedIndex]?.inputid);
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'd-flex align-items-center';
        this.wrapper.style.padding = "1em 0";
        this.data.role = this.data.role ? this.data.role : selectedRole

        this.labelElement = document.createElement('label');
        this.labelElement.textContent = this.data.label;
        this.labelElement.style.fontFamily = this.data.labelfamily;
        this.labelElement.style.fontSize = this.data.labelSize;
        this.labelElement.style.fontWeight = this.data.labelBold;
        this.labelElement.style.fontStyle = this.data.labelItalic;
        this.labelElement.style.marginRight = '10px';
        this.labelElement.style.whiteSpace = 'nowrap';

        const labeldiv = document.createElement('div')
        labeldiv.className = 'd-flex align-items-center';
        labeldiv.style.gap = '0px';
        labeldiv.style.padding = '0px';
        labeldiv.style.margin = '0px';

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'd-flex';
        inputWrapper.style.width = '100%';

        this.selectElement = document.createElement('select');
        this.selectElement.className = 'form-control mr-2';
        this.selectElement.style.fontFamily = this.data.optionFamily;
        this.selectElement.style.fontSize = this.data.optionSize;
        this.selectElement.style.fontWeight = this.data.optionBold;
        this.selectElement.style.fontStyle = this.data.optionItalic;
        this.selectElement.style.width = this.data.selectWidth + "%";
        this.selectElement.setAttribute('role', this.data.role);

        this.asterisk = document.createElement('span');
        this.asterisk.textContent = '*';
        this.asterisk.style.color = 'red';
        this.asterisk.style.fontSize = this.data.labelSize;
        const textSizeValue = parseInt(this.data.labelSize, 10);
        this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;

        this.data.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.innerText = option.value;
            this.selectElement.appendChild(optionElement);
        });

        if (this.data.mandatory) {
            this.labelElement.style.marginRight = "0px";
            this.asterisk.style.marginRight = "10px";
            this.asterisk.style.display = "unset";
        } else {

            this.labelElement.style.marginRight = "10px";
            this.asterisk.style.display = "none";
        }

        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';
        this.editButton.style.display = 'none';
        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '10px';
        this.editButton.style.backgroundColor = 'transparent';
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.transition = 'opacity 0.3s';
        this.editButton.style.zIndex = '100';
        this.editButton.style.outline = 'none';
        this.editButton.onclick = () => this.openEditModal();

        labeldiv.appendChild(this.labelElement);
        labeldiv.appendChild(this.asterisk);
        // this.wrapper.appendChild(this.labelInput);

        this.wrapper.appendChild(labeldiv);
        inputWrapper.appendChild(this.selectElement);
        inputWrapper.appendChild(this.editButton);
        this.wrapper.appendChild(inputWrapper)


        this.applyLabelPosition();

        this.wrapper.onmouseover = () => {
            this.editButton.style.display = 'block';
        };
        this.wrapper.onmouseout = () => {
            this.editButton.style.display = 'none';
        };

        if (this.inputid) {
            this.inputid.addEventListener('input', (event) => {
                usedLabels.delete(this.data.fieldName + "_" + this.data.role);
                this.data.role = event.target.value;
                this.selectElement.setAttribute('role', this.data.role);
                usedLabels.add(this.data.fieldName + "_" + this.data.role);
            });

        }

        return this.wrapper;
    }

    applyLabelPosition() {
        if (this.data.labelPosition === 'top') {
            this.wrapper.classList.add('flex-column');
            this.wrapper.classList.remove('align-items-center');
        } else {
            this.wrapper.classList.remove('flex-column');
            this.wrapper.classList.add('align-items-center');
        }
    }

    openEditModal() {
        const labelTextInput = document.getElementById('selectLabelTextInput');
        const selectfieldName = document.getElementById('selectfieldName');
        const labelPositionSelect = document.getElementById('selectLabelPositionSelect');
        const labelfamilyselect = document.getElementById('selectLabelFamilySelect');
        const labelFontSizeInput = document.getElementById('selectLabelFontSize');
        const boldButton = document.getElementById('selectBoldButton');
        const italicButton = document.getElementById('selectItalicButton');
        const optionsContainer = document.getElementById('selectOptionsContainer');
        const optionFamilySelect = document.getElementById('optionFamilySelect');
        const optionFontSizeInput = document.getElementById('optionFontSize');
        const optionBoldButton = document.getElementById('optionBoldButton');
        const optionItalicButton = document.getElementById('optionItalicButton');
        const selectWidthInput = document.getElementById('selectWidthInput');
        const labelSelectError = document.getElementById('labelSelectError');
        const newOptionInput = document.getElementById('selectNewOptionInput');
        const mandatoryCheckboxSelect = document.getElementById('mandatoryCheckboxSelect');
        mandatoryCheckboxSelect.checked = this.data.mandatory;
        mandatoryCheckboxSelect.addEventListener('change', () => {
            this.data.mandatory = mandatoryCheckboxSelect.checked;
            updatePreview();
        });

        newOptionInput.value = '';
        labelSelectError.classList.add('d-none');
        let tempoptions = JSON.parse(JSON.stringify(this.data.options));

        labelTextInput.value = this.data.label;
        selectfieldName.value = this.data.fieldName;
        labelPositionSelect.value = this.data.labelPosition;
        labelfamilyselect.value = this.data.labelfamily;
        labelFontSizeInput.value = this.data.labelSize;
        boldButton.classList.toggle('btn-primary', this.data.labelBold === 'bold');
        italicButton.classList.toggle('btn-primary', this.data.labelItalic === 'italic');

        selectWidthInput.value = this.data.selectWidth;

        optionFamilySelect.value = this.data.optionFamily;
        optionFontSizeInput.value = this.data.optionSize;
        optionBoldButton.classList.toggle('btn-primary', this.data.optionBold === 'bold');
        optionItalicButton.classList.toggle('btn-primary', this.data.optionItalic === 'italic');

        optionsContainer.innerHTML = '';
        const addOptionEditor = (value, optionsContainer) => {
            const optionWrapper = document.createElement('div');
            optionWrapper.className = 'option-wrapper';

            const optionInput = document.createElement('input');
            optionInput.type = 'text';
            optionInput.value = value;
            optionInput.className = 'form-control d-inline-block mr-2';

            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn btn-danger btn-sm';
            deleteButton.innerText = 'Delete';
            deleteButton.onclick = () => {
                optionsContainer.removeChild(optionWrapper);
                tempoptions = tempoptions.filter(option => option.value !== value);
                updatePreview()
            };

            optionWrapper.appendChild(optionInput);
            optionWrapper.appendChild(deleteButton);
            optionsContainer.appendChild(optionWrapper);

            optionInput.oninput = (event) => {
                const newValue = event.target.value;
                const option = tempoptions.find(option => option.value === value);
                option.value = newValue;
                this.selectElement.querySelector(`option[value="${value}"]`).innerText = newValue;
                this.selectElement.querySelector(`option[value="${value}"]`).value = newValue;
                value = newValue;
            };
        }
        const addOption = async (value, updatePreview) => {
            if (value) {
                tempoptions.push({ value });

                const optionsContainer = document.getElementById('selectOptionsContainer');
                await addOptionEditor(value, optionsContainer);
            }
        }
        const updatePreview = () => {
            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'd-flex align-items-center';
            if (labelPositionSelect.value === 'top') {
                previewWrapper.classList.add('flex-column');
                previewWrapper.classList.remove('align-items-center')

            }
            else {
                previewWrapper.classList.remove('flex-column')
                previewWrapper.classList.add('align-items-center');
            }

            const previewLabel = document.createElement('label');
            previewLabel.textContent = labelTextInput.value;
            previewLabel.style.fontFamily = labelfamilyselect.value;
            previewLabel.style.fontSize = labelFontSizeInput.value;
            previewLabel.style.fontWeight = boldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            previewLabel.style.fontStyle = italicButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            previewLabel.style.marginRight = '10px';
            previewLabel.style.whiteSpace = 'nowrap';

            if (this.data.mandatory) {
                previewLabel.innerHTML += ' <span style="color: red;">*</span>';
            }


            const previewSelect = document.createElement('select');
            previewSelect.className = 'form-control mr-2';
            previewSelect.style.fontFamily = optionFamilySelect.value;
            previewSelect.style.fontSize = optionFontSizeInput.value;
            previewSelect.style.fontWeight = optionBoldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            previewSelect.style.fontStyle = optionItalicButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            previewSelect.style.width = selectWidthInput.value + "%";
            tempoptions.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.innerText = option.value;
                previewSelect.appendChild(optionElement);
            });

            previewWrapper.appendChild(previewLabel);
            previewWrapper.appendChild(previewSelect);
            const previewContainer = document.getElementById('selectPreviewContainer');
            previewContainer.innerHTML = '';
            previewContainer.appendChild(previewWrapper);
        };
        tempoptions.forEach(async (option) => {
            await addOptionEditor(option.value, optionsContainer);
        });



        updatePreview();

        boldButton.onclick = () => {
            boldButton.classList.toggle('btn-primary');
            updatePreview();
        };

        italicButton.onclick = () => {
            italicButton.classList.toggle('btn-primary');
            updatePreview();
        };

        optionBoldButton.onclick = () => {
            optionBoldButton.classList.toggle('btn-primary');
            updatePreview();
        };

        optionItalicButton.onclick = () => {
            optionItalicButton.classList.toggle('btn-primary');
            updatePreview();
        };




        labelTextInput.addEventListener('input', updatePreview);
        labelPositionSelect.addEventListener('change', updatePreview);
        labelfamilyselect.addEventListener('change', updatePreview);
        labelFontSizeInput.addEventListener('input', updatePreview);
        optionFamilySelect.addEventListener('change', updatePreview);
        optionFontSizeInput.addEventListener('input', updatePreview);
        selectWidthInput.addEventListener('input', updatePreview);

        document.getElementById('selectAddOptionButton').onclick = async () => {
            const newOptionInput = document.getElementById('selectNewOptionInput');
            await addOption(newOptionInput.value);
            newOptionInput.value = '';
            updatePreview();
        };

        $('#editSelectModal').modal('show');

        const saveButton = document.getElementById('selectSaveButton');
        saveButton.onclick = async () => {
            const newLabel = selectfieldName.value + "_" + this.data.role;
            if (usedLabels.has(newLabel) && newLabel !== this.data.fieldName + "_" + this.data.role) {
                labelSelectError.innerText = "Dublicate Field Name";
                labelSelectError.classList.remove('d-none');
                return;
            }
            else {
                labelSelectError.classList.add('d-none');
            }

            if (selectfieldName.value === "") {
                labelSelectError.innerText = "Field Name can't be Empty";
                labelSelectError.classList.remove('d-none');
                return;
            }
            else {

                labelSelectError.classList.add('d-none');
            }

            if (this.data.mandatory) {
                this.labelElement.style.marginRight = "0px";
                this.asterisk.style.marginRight = "10px";
                this.asterisk.style.display = "unset";
            } else {

                this.labelElement.style.marginRight = "10px";
                this.asterisk.style.display = "none";
            }

            const newOptionInput = document.getElementById('selectNewOptionInput');
            if (newOptionInput.value.trim('') !== "") {
                await addOption(newOptionInput.value);

            }
            usedLabels.delete(this.data.fieldName + "_" + this.data.role);
            usedLabels.add(newLabel);
            this.data.options = JSON.parse(JSON.stringify(tempoptions));
            this.data.label = labelTextInput.value;
            this.data.fieldName = selectfieldName.value;
            this.data.labelPosition = labelPositionSelect.value;
            this.data.labelfamily = labelfamilyselect.value;
            this.data.labelSize = labelFontSizeInput.value;
            this.data.labelBold = boldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            this.data.labelItalic = italicButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            this.data.optionFamily = optionFamilySelect.value;
            this.data.optionSize = optionFontSizeInput.value;
            this.data.optionBold = optionBoldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            this.data.optionItalic = optionItalicButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            this.data.selectWidth = selectWidthInput.value;

            this.selectElement.innerHTML = '';
            this.data.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.innerText = option.value;
                this.selectElement.appendChild(optionElement);
            });

            this.applyLabelPosition();
            this.applyStyles();
            $('#editSelectModal').modal('hide');
        };
        const deletebutton = document.getElementById('deleteselectblock')
        deletebutton.onclick = () => {
            const index = this.api.blocks.getCurrentBlockIndex()
            this.api.blocks.delete(index)
            $('#editInputModal').modal('hide');

        };
    }


    applyStyles() {
        this.labelElement.style.fontFamily = this.data.labelfamily;
        this.labelElement.style.fontSize = this.data.labelSize;
        const textSizeValue = parseInt(this.data.labelSize, 10);
        this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;
        this.labelElement.style.fontWeight = this.data.labelBold;
        this.labelElement.style.fontStyle = this.data.labelItalic;
        this.labelElement.textContent = this.data.label;
        this.selectElement.style.fontFamily = this.data.optionFamily;
        this.selectElement.style.fontSize = this.data.optionSize;
        this.selectElement.style.fontWeight = this.data.optionBold;
        this.selectElement.style.fontStyle = this.data.optionItalic;
        this.selectElement.style.width = this.data.selectWidth + "%";
    }

    save() {
        const options = Array.from(this.selectElement.options).map(option => ({
            value: option.value,
            text: option.text
        }));
        return {
            label: this.labelElement.innerText,
            options,
            selected: this.selectElement.value,
            labelPosition: this.data.labelPosition,
            labelfamily: this.data.labelfamily,
            labelSize: this.data.labelSize,
            labelBold: this.data.labelBold,
            labelItalic: this.data.labelItalic,
            optionFamily: this.data.optionFamily,
            optionSize: this.data.optionSize,
            optionBold: this.data.optionBold,
            optionItalic: this.data.optionItalic,
            selectWidth: this.data.selectWidth,
            fieldName: this.data.fieldName,
            role: this.data.role,
            selectedIndex: this.data.selectedIndex,
            mandatory: this.data.mandatory
        };
    }


    destroy() {
        const labelToRemove = this.data.fieldName + "_" + this.data.role;


        if (usedLabels.has(labelToRemove)) {
            usedLabels.delete(labelToRemove);
        }
    }
    validate(savedData) {
        return true;
    }
}

class OnlyTextBlock {
    static get toolbox() {
        return {
            title: 'OnlyText',
            icon: '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg" fill="#000000"><circle cx="8.5" cy="7.5" r="6.5" fill="#000000"/></svg>',
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            value: '',
            inputwidth: '50',
            inputSize: '16px',
            inputplaceholder: 'Enter text',
            inputFontFamily: 'Arial',
            inputFontStyle: 'normal',
            inputFontWeight: 'normal',
            fieldName: 'FieldName',
            mandatory: false,
        };
        this.wrapper = null;
        this.inputElement = null;
        this.editButton = null;
        this.inputid = null;

    }

    render() {
        const selectElement = document.getElementById('ClientSelect');
        const selectedRole = selectElement.value;
        this.data.selectedIndex = this.data.selectedIndex ? this.data.selectedIndex : selectElement.selectedIndex;
        this.inputid = document.getElementById(roleList[this.data.selectedIndex]?.inputid);
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'd-flex align-items-center';
        this.wrapper.style.padding = "1em 0";
        this.data.role = this.data.role ? this.data.role : selectedRole

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'd-flex';
        inputWrapper.style.width = '100%';

        this.inputElement = document.createElement('input');
        this.inputElement.type = 'text';
        this.inputElement.className = 'form-control';
        this.inputElement.placeholder = this.data.inputplaceholder;
        this.inputElement.value = this.data.value;
        this.inputElement.style.width = this.data.inputwidth + "%";
        this.inputElement.style.fontSize = this.data.inputSize;
        this.inputElement.style.fontFamily = this.data.inputFontFamily;
        this.inputElement.style.fontStyle = this.data.inputFontStyle;
        this.inputElement.style.fontWeight = this.data.inputFontWeight;
        this.inputElement.style.lineHeight = '1.2';
        this.inputElement.setAttribute('role', this.data.role);

        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';
        this.editButton.style.display = 'none';
        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.backgroundColor = 'transparent';
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.transition = 'opacity 0.3s';
        this.editButton.style.zIndex = '100';
        this.editButton.style.outline = 'none';
        this.editButton.onclick = () => this.openEditModal();

        inputWrapper.appendChild(this.inputElement);
        inputWrapper.appendChild(this.editButton);

        this.wrapper.appendChild(inputWrapper);
        this.wrapper.onmouseover = () => {
            this.editButton.style.display = 'block';
        };
        this.wrapper.onmouseout = () => {
            this.editButton.style.display = 'none';
        };

        if (this.inputid) {
            this.inputid.addEventListener('input', (event) => {
                usedLabels.delete(this.data.fieldName + "_" + this.data.role);
                this.data.role = event.target.value;
                this.inputElement.setAttribute('role', this.data.role);
                usedLabels.add(this.data.fieldName + "_" + this.data.role);
            });

        }

        return this.wrapper;
    }

    save(blockContent) {
        return {
            value: this.inputElement.value,
            inputwidth: this.data.inputwidth,
            inputSize: this.data.inputSize,
            inputplaceholder: this.data.inputplaceholder,
            inputFontFamily: this.data.inputFontFamily,
            inputFontStyle: this.data.inputFontStyle,
            inputFontWeight: this.data.inputFontWeight,
            fieldName: this.data.fieldName,
            role: this.data.role,
            selectedIndex: this.data.selectedIndex,
            mandatory: this.data.mandatory
        };
    }


    // destroy() {
    //     const labelToRemove = this.data.fieldName;


    //     if (usedLabels.has(labelToRemove)) {
    //         usedLabels.delete(labelToRemove);
    //     }
    // }

    openEditModal() {
        const inputWidth = document.getElementById('inputWidthOnlyText');
        const inputFontSize = document.getElementById('inputFontSizeOnlyText');
        const inputPlaceholder = document.getElementById('inputPlaceholderOnlyText');
        const inputFontFamily = document.getElementById('inputFontFamilyOnlyText');
        const inputFontStyleBold = document.getElementById('inputFontStyleBoldOnlyText');
        const inputFontStyleItalic = document.getElementById('inputFontStyleItalicOnlyText');
        const inputFieldName = document.getElementById('inputFieldNameOnlyText');
        const labelTextError = document.getElementById('labelTextError')
        labelTextError.classList.add('d-none');
        const mandatoryCheckboxOnlytext = document.getElementById('mandatoryCheckboxOnlytext');
        mandatoryCheckboxOnlytext.checked = this.data.mandatory;
        mandatoryCheckboxOnlytext.addEventListener('change', () => {
            this.data.mandatory = mandatoryCheckboxOnlytext.checked;
            updatePreview();
        });

        const previewContainer = document.getElementById('previewContainerOnlyText');

        inputWidth.value = this.data.inputwidth;
        inputFontSize.value = this.data.inputSize;
        inputPlaceholder.value = this.data.inputplaceholder;
        inputFontFamily.value = this.data.inputFontFamily;
        inputFieldName.value = this.data.fieldName;
        inputFontStyleBold.classList.toggle("btn-primary", this.data.inputFontWeight === 'bold');
        inputFontStyleItalic.classList.toggle("btn-primary", this.data.inputFontStyle === 'italic');

        const updatePreview = () => {
            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'd-flex align-items-center';

            const previewInputElement = document.createElement('input');
            previewInputElement.type = 'text';
            previewInputElement.className = 'form-control';
            previewInputElement.placeholder = inputPlaceholder.value;
            previewInputElement.value = this.data.value;
            previewInputElement.style.width = inputWidth.value + "%";
            previewInputElement.style.fontSize = inputFontSize.value;
            previewInputElement.style.fontFamily = inputFontFamily.value;
            previewInputElement.style.fontStyle = inputFontStyleItalic.classList.contains("btn-primary") ? 'italic' : 'normal';
            previewInputElement.style.fontWeight = inputFontStyleBold.classList.contains("btn-primary") ? 'bold' : 'normal';
            previewInputElement.style.lineHeight = '1.2';

            const previewInputWrapper = document.createElement('div');
            previewInputWrapper.className = 'd-flex';
            previewInputWrapper.style.width = '100%';
            previewInputWrapper.appendChild(previewInputElement);

            previewWrapper.appendChild(previewInputWrapper);

            previewContainer.innerHTML = '';
            previewContainer.appendChild(previewWrapper);
        };

        updatePreview();

        document.querySelectorAll('#editOnlyTextModal input').forEach(input => {
            input.addEventListener('input', updatePreview);
        });

        inputFontStyleBold.onclick = () => {
            inputFontStyleBold.classList.toggle("btn-primary");
            updatePreview();
        };

        inputFontFamily.addEventListener("change", updatePreview)

        inputFontStyleItalic.onclick = () => {
            inputFontStyleItalic.classList.toggle("btn-primary");
            updatePreview();
        };

        $('#editOnlyTextModal').modal('show');

        const saveButton = document.getElementById('saveButtonOnlyText');
        saveButton.onclick = () => {
            const newLabel = inputFieldName.value + "_" + this.data.role;
            if (usedLabels.has(newLabel) && newLabel !== this.data.fieldName + "_" + this.data.role) {
                labelTextError.innerText = "Dublicate Field Name";
                labelTextError.classList.remove('d-none');
                return;
            }
            else {
                labelTextError.classList.add('d-none');
            }
            if (inputFieldName.value === "") {
                labelTextError.innerText = "Field Name can't be Empty";
                labelTextError.classList.remove('d-none');
                return;
            }
            else {
                labelTextError.classList.add('d-none');
            }


            usedLabels.delete(this.data.fieldName + "_" + this.data.role);
            usedLabels.add(newLabel);
            this.data.inputwidth = inputWidth.value;
            this.data.inputSize = inputFontSize.value;
            this.data.inputplaceholder = inputPlaceholder.value;
            this.data.inputFontFamily = inputFontFamily.value;
            this.data.inputFontStyle = inputFontStyleItalic.classList.contains("btn-primary") ? 'italic' : 'normal';
            this.data.inputFontWeight = inputFontStyleBold.classList.contains("btn-primary") ? 'bold' : 'normal';
            this.data.fieldName = inputFieldName.value;
            this.applyStyles();
            $('#editOnlyTextModal').modal('hide');
        };
        const deletebutton = document.getElementById('deleteonlytextblock')
        deletebutton.onclick = () => {
            // const index = this.api.blocks.getCurrentBlockIndex()
            // this.api.blocks.delete(index)
            this.destroy();
            $('#editInputModal').modal('hide');

        };
    }

    applyStyles() {
        this.inputElement.style.width = this.data.inputwidth + "%";
        this.inputElement.style.fontSize = this.data.inputSize;
        this.inputElement.placeholder = this.data.inputplaceholder;
        this.inputElement.style.fontFamily = this.data.inputFontFamily;
        this.inputElement.style.fontStyle = this.data.inputFontStyle;
        this.inputElement.style.fontWeight = this.data.inputFontWeight;
    }
}













class RadioBlock {
    static get toolbox() {
        return {
            title: 'Radio',
            icon: '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg" fill="#000000"><circle cx="8.5" cy="7.5" r="6.5" fill="#000000"/></svg>',
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            label: 'Label',
            options: [{ text: 'Option 1', selected: false }],
            labelFamily: 'Arial',
            optionFamily: 'Arial',
            labelBold: 'normal',
            labelItalic: 'normal',
            optionBold: 'normal',
            optionItalic: 'normal',
            labelFontSize: '16px',
            optionsFontSize: '14px',
            optionPosition: 'vertical',
            labelPosition: 'top',
            mandatory: false,
        };
        this.wrapper = null;
        this.labelElement = null;
        this.editButton = null;
        this.labelWrapper = null;
        this.inputid = null;
        this.asterisk = null;
    }

    render() {
        const selectElement = document.getElementById('ClientSelect');
        const selectedRole = selectElement.value;
        this.data.selectedIndex = this.data.selectedIndex ? this.data.selectedIndex : selectElement.selectedIndex;
        this.inputid = document.getElementById(roleList[this.data.selectedIndex]?.inputid);
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'd-flex';
        this.wrapper.style.padding = "1em 0";
        this.data.role = this.data.role ? this.data.role : selectedRole;

        this.labelWrapper = document.createElement('div');
        this.labelWrapper.className = 'd-flex align-items-center';
        this.labelWrapper.style.width = 'auto';

        const labeldiv = document.createElement('div')
        labeldiv.className = 'd-flex';
        labeldiv.style.gap = '0px';
        labeldiv.style.padding = '0px';
        labeldiv.style.margin = '0px';

        this.labelElement = document.createElement('label');
        this.labelElement.textContent = this.data.label;
        this.labelElement.style.marginRight = "10px";
        this.labelElement.style.fontSize = this.data.labelFontSize;
        this.labelElement.style.marginBottom = 'auto';
        this.labelElement.style.marginTop = 'auto';

        this.asterisk = document.createElement('span');
        this.asterisk.textContent = '*';
        this.asterisk.style.color = 'red';
        this.asterisk.style.fontSize = this.data.labelFontSize;
        const textSizeValue = parseInt(this.data.labelFontSize, 10);
        this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;

        this.applyLabelStyles();
        this.applyOptionPosition();

        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';
        this.editButton.style.display = 'none';
        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.backgroundColor = 'transparent';
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.transition = 'opacity 0.3s';
        this.editButton.style.zIndex = '100'; // Ensure it's on top
        this.editButton.style.outline = 'none';
        this.editButton.onclick = () => this.openEditModal();

        labeldiv.appendChild(this.labelElement);
        labeldiv.appendChild(this.asterisk);
        // this.wrapper.appendChild(this.labelInput);

        this.labelWrapper.appendChild(labeldiv);
        this.labelWrapper.appendChild(this.editButton);
        this.wrapper.append(this.labelWrapper);



        if (this.data.mandatory) {
            this.labelElement.style.marginRight = "0px";
            this.asterisk.style.marginRight = "10px";
            this.asterisk.style.display = "unset";
        } else {
            this.labelElement.style.marginRight = "10px";
            this.asterisk.style.display = "none";
        }

        const radiodiv = document.createElement('div');
        radiodiv.className = 'm-0 p-0';


        this.data.options.forEach((option, index) => {
            const radioWrapper = document.createElement('div');
            radioWrapper.className = 'form-check d-flex align-items-center radio-option';

            const radioInput = document.createElement('input');
            radioInput.type = 'radio';
            radioInput.className = 'form-check-input mt-0 ';
            radioInput.name = this.data.fieldName;
            radioInput.setAttribute('role', this.data.role);

            if (option.selected) {
                radioInput.checked = true;
            }


            radioInput.addEventListener('change', () => {

                this.data.options.forEach((opt, i) => {
                    opt.selected = (i === index);
                });
            });

            if (this.inputid) {
                this.inputid.addEventListener('input', (event) => {
                    usedLabels.delete(this.data.fieldName + "_" + this.data.role);
                    this.data.role = event.target.value;
                    radioInput.setAttribute('role', this.data.role);
                    usedLabels.add(this.data.fieldName + "_" + this.data.role);
                });

            }

            const radioLabel = document.createElement('label');
            radioLabel.className = 'form-check-label';
            radioLabel.textContent = option.text;
            radioLabel.style.fontSize = this.data.optionsFontSize;
            this.applyOptionStyles(radioLabel);

            radioWrapper.appendChild(radioInput);
            radioWrapper.appendChild(radioLabel);


            if (this.data.optionPosition === 'vertical' && this.data.labelPosition === 'left') {
                radiodiv.appendChild(radioWrapper);
            }
            else {
                this.wrapper.appendChild(radioWrapper);
            }
        });

        if (this.data.optionPosition === 'vertical' && this.data.labelPosition === 'left') {
            this.wrapper.appendChild(radiodiv);
        }




        this.wrapper.onmouseover = () => {
            this.editButton.style.display = 'block';
        };
        this.wrapper.onmouseout = () => {
            this.editButton.style.display = 'none';
        };

        return this.wrapper;
    }

    save(blockContent) {
        const height = this.wrapper?.offsetHeight || 0;
        return {
            label: this.labelElement.textContent,
            options: this.data.options,
            labelFamily: this.data.labelFamily,
            optionFamily: this.data.optionFamily,
            labelBold: this.data.labelBold,
            labelItalic: this.data.labelItalic,
            optionBold: this.data.optionBold,
            optionItalic: this.data.optionItalic,
            labelFontSize: this.data.labelFontSize,
            optionsFontSize: this.data.optionsFontSize,
            optionPosition: this.data.optionPosition,
            labelPosition: this.data.labelPosition,
            blockheight: height,
            fieldName: this.data.fieldName,
            role: this.data.role,
            selectedIndex: this.data.selectedIndex,
            mandatory: this.data.mandatory
        };
    }


    destroy() {
        const labelToRemove = this.data.fieldName + "_" + this.data.role;


        if (usedLabels.has(labelToRemove)) {
            usedLabels.delete(labelToRemove);
        }
    }

    applyLabelStyles() {
        this.labelElement.style.fontFamily = this.data.labelFamily;
        this.labelElement.style.fontWeight = this.data.labelBold;
        this.labelElement.style.fontStyle = this.data.labelItalic;
    }

    applyOptionStyles(optionElement) {
        optionElement.style.fontFamily = this.data.optionFamily;
        optionElement.style.fontWeight = this.data.optionBold;
        optionElement.style.fontStyle = this.data.optionItalic;
    }
    applyOptionPosition() {
        if (this.data.optionPosition === 'vertical' && this.data.labelPosition === 'left') {
            this.wrapper.classList.remove('flex-column');
            this.labelWrapper.style.width = 'auto';
            this.labelWrapper.classList.remove('align-items-center');
            this.labelElement.style.marginTop = 'unset';

        }
        else {
            this.labelWrapper.classList.add('align-items-center');
            this.labelElement.style.marginTop = 'auto';
            if (this.data.optionPosition === 'vertical') {
                this.wrapper.classList.add('flex-column');
                this.wrapper.classList.remove('radio-options');

            }
            else {
                this.wrapper.classList.remove('flex-column');
                this.wrapper.classList.add('radio-options');
            }

            if (this.data.labelPosition === 'top') {
                this.labelWrapper.style.width = '100%';
            }
            else {
                this.labelWrapper.style.width = 'auto';
            }
        }


    }

    openEditModal() {
        const radioLabelInput = document.getElementById('radioLabelInput');
        const radiofieldName = document.getElementById('radiofieldName');
        const radioOptions = document.getElementById('radioOptions');
        const radioPreview = document.getElementById('radioPreview');
        const radiolabelFamilySelect = document.getElementById('radiolabelFamilySelect');
        const radiooptionFamilySelect = document.getElementById('radiooptionFamilySelect');
        const radioboldLabelButton = document.getElementById('radioboldLabelButton');
        const radioitalicLabelButton = document.getElementById('radioitalicLabelButton');
        const radioboldOptionButton = document.getElementById('radioboldOptionButton');
        const radioitalicOptionButton = document.getElementById('radioitalicOptionButton');
        const radiolabelFontSizeInput = document.getElementById('radiolabelFontSizeInput');
        const radiooptionsFontSizeInput = document.getElementById('radiooptionsFontSizeInput');
        const labelRadioError = document.getElementById('labelRadioError');
        const radioPositionSelect = document.getElementById('radioPositionSelect');
        const radioLabelPositionSelect = document.getElementById('radioLabelPositionSelect')
        labelRadioError.classList.add('d-none');
        const mandatoryCheckboxRadio = document.getElementById('mandatoryCheckboxRadio');
        mandatoryCheckboxRadio.checked = this.data.mandatory;
        mandatoryCheckboxRadio.addEventListener('change', () => {
            this.data.mandatory = mandatoryCheckboxRadio.checked;
            updatePreview();
        });

        radiolabelFontSizeInput.value = this.data.labelFontSize;
        radiooptionsFontSizeInput.value = this.data.optionsFontSize;
        radioLabelInput.value = this.data.label;
        radiofieldName.value = this.data.fieldName;
        radiolabelFamilySelect.value = this.data.labelFamily;
        radiooptionFamilySelect.value = this.data.optionFamily;
        radioboldLabelButton.classList.toggle('btn-primary', this.data.labelBold === 'bold');
        radioitalicLabelButton.classList.toggle('btn-primary', this.data.labelItalic === 'italic');
        radioboldOptionButton.classList.toggle('btn-primary', this.data.optionBold === 'bold');
        radioitalicOptionButton.classList.toggle('btn-primary', this.data.optionItalic === 'italic');
        radioLabelInput.value = this.data.label;
        radiolabelFontSizeInput.value = this.data.labelFontSize;
        radioPositionSelect.value = this.data.optionPosition;
        radioLabelPositionSelect.value = this.data.labelPosition;
        const tempoptions = JSON.parse(JSON.stringify(this.data.options));


        radioOptions.innerHTML = '';
        tempoptions.forEach((option, index) => {
            const optionWrapper = document.createElement('div');
            optionWrapper.className = 'input-group mb-2';

            const optionInput = document.createElement('input');
            optionInput.type = 'text';
            optionInput.className = 'form-control mr-2';
            optionInput.placeholder = 'Option text';
            optionInput.value = option.text;

            const removeButton = document.createElement('button');
            removeButton.className = 'btn btn-danger';
            removeButton.innerText = 'Remove';
            removeButton.onclick = () => {
                tempoptions.splice(index, 1);
                optionWrapper.remove();
                updatePreview();
            };

            optionWrapper.appendChild(optionInput);
            optionWrapper.appendChild(removeButton);
            radioOptions.appendChild(optionWrapper);

            optionInput.addEventListener('input', (event) => {
                tempoptions[index].text = event.target.value;
                updatePreview();
            });
        });

        const addRadioOption = document.getElementById('addRadioOption');
        addRadioOption.onclick = () => {
            const newOption = { text: `Option ${tempoptions.length + 1}`, selected: false }
            tempoptions.push(newOption);
            const optionWrapper = document.createElement('div');
            optionWrapper.className = 'input-group mb-2';

            const optionInput = document.createElement('input');
            optionInput.type = 'text';
            optionInput.className = 'form-control mr-2';
            optionInput.placeholder = 'Option text';
            optionInput.value = newOption.text;

            const removeButton = document.createElement('button');
            removeButton.className = 'btn btn-danger';
            removeButton.innerText = 'Remove';
            removeButton.onclick = () => {
                tempoptions.splice(tempoptions.indexOf(newOption), 1);
                optionWrapper.remove();
                updatePreview();
            };

            optionWrapper.appendChild(optionInput);
            optionWrapper.appendChild(removeButton);
            radioOptions.appendChild(optionWrapper);

            optionInput.addEventListener('input', (event) => {
                newOption.text = event.target.value;
                updatePreview();
            });


            updatePreview();
        };

        const updatePreview = () => {
            radioPreview.innerHTML = '';
            const previewLabel = document.createElement('label');
            previewLabel.textContent = radioLabelInput.value;
            previewLabel.style.fontFamily = radiolabelFamilySelect.value;
            previewLabel.style.fontWeight = radioboldLabelButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            previewLabel.style.fontStyle = radioitalicLabelButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            previewLabel.style.fontSize = radiolabelFontSizeInput.value;
            previewLabel.style.marginBottom = '0.25rem'
            radioPreview.className = 'd-flex';
            radioPreview.appendChild(previewLabel);

            if (this.data.mandatory) {
                previewLabel.innerHTML += ' <span style="color: red;">*</span>';
            }
            const radiodiv = document.createElement('div');
            radiodiv.className = 'm-0 p-0';


            tempoptions.forEach(option => {
                const radioWrapper = document.createElement('div');
                radioWrapper.className = 'form-check d-flex align-items-center radio-option';

                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.className = 'form-check-input mt-0';
                radioInput.name = radiofieldName.value;
                radioInput.disabled = true;

                const radioLabel = document.createElement('label');
                radioLabel.className = 'form-check-label';
                radioLabel.textContent = option.text;
                radioLabel.style.fontFamily = radiooptionFamilySelect.value;
                radioLabel.style.fontWeight = radioboldOptionButton.classList.contains('btn-primary') ? 'bold' : 'normal';
                radioLabel.style.fontStyle = radioitalicOptionButton.classList.contains('btn-primary') ? 'italic' : 'normal';
                radioLabel.style.fontSize = radiooptionsFontSizeInput.value;

                radioWrapper.appendChild(radioInput);
                radioWrapper.appendChild(radioLabel);

                if (radioPositionSelect.value === 'vertical' && radioLabelPositionSelect.value === 'left') {

                    radiodiv.appendChild(radioWrapper);
                }
                else {
                    radioPreview.appendChild(radioWrapper);

                }

            });

            if (radioPositionSelect.value === 'vertical' && radioLabelPositionSelect.value === 'left') {
                radioPreview.appendChild(radiodiv);
            }

            if (radioPositionSelect.value === 'vertical' && radioLabelPositionSelect.value === 'left') {
                radioPreview.classList.remove('flex-column');
                previewLabel.style.width = 'auto';
                previewLabel.style.marginRight = "5px";


            }

            else {

                if (radioPositionSelect.value === 'vertical') {
                    radioPreview.classList.add('flex-column');
                    radioPreview.classList.remove('radio-options');
                }
                else {
                    radioPreview.classList.remove('flex-column');
                    radioPreview.classList.add('radio-options');
                }
                if (radioLabelPositionSelect.value === 'top') {
                    previewLabel.style.width = '100%';
                }
                else {
                    previewLabel.style.width = 'auto';
                }

            }



        };

        updatePreview();

        radioboldLabelButton.onclick = () => {
            radioboldLabelButton.classList.toggle('btn-primary');
            updatePreview();
        };

        radioitalicLabelButton.onclick = () => {
            radioitalicLabelButton.classList.toggle('btn-primary');
            updatePreview();
        };

        radioboldOptionButton.onclick = () => {
            radioboldOptionButton.classList.toggle('btn-primary');
            updatePreview();
        };

        radioitalicOptionButton.onclick = () => {
            radioitalicOptionButton.classList.toggle('btn-primary');
            updatePreview();
        };

        radioPositionSelect.addEventListener('change', updatePreview);

        radioLabelPositionSelect.addEventListener('change', updatePreview);

        radiolabelFamilySelect.onchange = updatePreview;
        radiooptionFamilySelect.onchange = updatePreview;
        document.querySelectorAll('#radioModal input').forEach(input => {
            input.addEventListener('input', updatePreview);
        });

        const saveButton = document.getElementById('saveRadioBlock');
        saveButton.onclick = () => {
            const newLabel = radiofieldName.value + "_" + this.data.role;
            if (usedLabels.has(newLabel) && newLabel !== this.data.fieldName + "_" + this.data.role) {
                labelRadioError.innerText = "Dublicate Field Name";
                labelRadioError.classList.remove('d-none');
                return;
            }
            else {
                labelRadioError.classList.add('d-none');
            }

            if (radiofieldName.value === "") {
                labelRadioError.innerText = "Field Name can't be Empty";
                labelRadioError.classList.remove('d-none');
                return;
            }
            else {
                labelRadioError.classList.add('d-none');
            }

            if (this.data.mandatory) {
                this.labelElement.style.marginRight = "0px";
                this.asterisk.style.marginRight = "10px";
                this.asterisk.style.display = "unset";
            } else {
                this.labelElement.style.marginRight = "10px";
                this.asterisk.style.display = "none";
            }


            usedLabels.delete(this.data.fieldName + "_" + this.data.role);
            usedLabels.add(newLabel);
            this.data.label = radioLabelInput.value;
            this.data.fieldName = radiofieldName.value;
            this.data.labelFamily = radiolabelFamilySelect.value;
            this.data.optionFamily = radiooptionFamilySelect.value;
            this.data.labelFontSize = radiolabelFontSizeInput.value;
            this.data.optionsFontSize = radiooptionsFontSizeInput.value;
            this.labelElement.style.fontSize = this.data.labelFontSize;
            const textSizeValue = parseInt(this.data.labelFontSize, 10);
            this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;
            this.data.labelBold = radioboldLabelButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            this.data.labelItalic = radioitalicLabelButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            this.data.optionBold = radioboldOptionButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            this.data.optionItalic = radioitalicOptionButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            this.data.options = JSON.parse(JSON.stringify(tempoptions));
            this.data.optionPosition = radioPositionSelect.value;
            this.data.labelPosition = radioLabelPositionSelect.value;

            this.labelElement.textContent = this.data.label;
            this.applyLabelStyles();
            this.applyOptionPosition();

            while (this.wrapper.children.length > 1) {
                this.wrapper.removeChild(this.wrapper.lastChild);
            }


            const radiodiv = document.createElement('div');
            radiodiv.className = 'm-0 p-0';


            this.data.options.forEach(option => {
                const radioWrapper = document.createElement('div');
                radioWrapper.className = 'form-check d-flex align-items-center radio-option';

                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.className = 'form-check-input mt-0 ';
                radioInput.name = this.data.fieldName;
                radioInput.setAttribute('role', this.data.role);

                radioInput.addEventListener('change', () => {

                    this.data.options.forEach((opt, i) => {
                        opt.selected = (i === index);
                    });
                });

                if (this.inputid) {
                    this.inputid.addEventListener('input', (event) => {
                        usedLabels.delete(this.data.fieldName + "_" + this.data.role);
                        this.data.role = event.target.value;
                        radioInput.setAttribute('role', this.data.role);
                        usedLabels.add(this.data.fieldName + "_" + this.data.role);
                    });

                }

                const radioLabel = document.createElement('label');
                radioLabel.className = 'form-check-label';
                radioLabel.textContent = option.text;
                radioLabel.style.fontSize = this.data.optionsFontSize;
                this.applyOptionStyles(radioLabel);

                radioWrapper.appendChild(radioInput);
                radioWrapper.appendChild(radioLabel);

                if (this.data.optionPosition === 'vertical' && this.data.labelPosition === 'left') {
                    radiodiv.appendChild(radioWrapper);
                }
                else {
                    this.wrapper.appendChild(radioWrapper);
                }
            });

            if (this.data.optionPosition === 'vertical' && this.data.labelPosition === 'left') {
                this.wrapper.appendChild(radiodiv);
            }


            $('#radioModal').modal('hide');
        };

        const deletebutton = document.getElementById('deleteradioblock')
        deletebutton.onclick = () => {
            const index = this.api.blocks.getCurrentBlockIndex()
            this.api.blocks.delete(index)
            $('#editInputModal').modal('hide');

        };

        $('#radioModal').modal('show');
    }
}



class InputBlock {
    static get toolbox() {
        return {
            title: 'Input',
            icon: '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg" fill="#000000"><circle cx="8.5" cy="7.5" r="6.5" fill="#000000"/></svg>',
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            labelTextInput: 'Label',
            value: '',
            labelPosition: 'left',
            inputwidth: '50',
            inputSize: '16px',
            inputplaceholder: 'Enter text',
            textwidth: '50',
            textSize: '16px',
            textplaceholder: 'Enter text',
            fieldName: 'Label',
            mandatory: false,

        };
        this.wrapper = null;
        this.labelInput = null;
        this.inputElement = null;
        this.editButton = null;
        this.inputid = null;
        this.asterisk = null;


    }

    render() {
        const selectElement = document.getElementById('ClientSelect');
        const selectedRole = selectElement.value;
        this.data.selectedIndex = this.data.selectedIndex ? this.data.selectedIndex : selectElement.selectedIndex;
        this.inputid = document.getElementById(roleList[this.data.selectedIndex]?.inputid);
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'd-flex align-items-center';
        this.wrapper.style.position = 'relative';
        this.wrapper.style.padding = "1em 0";
        this.data.role = this.data.role ? this.data.role : selectedRole

        const labeldiv = document.createElement('div')
        labeldiv.className = 'd-flex align-items-center';
        labeldiv.style.gap = '0px';
        labeldiv.style.padding = '0px';
        labeldiv.style.margin = '0px';

        this.labelInput = document.createElement('label');
        this.labelInput.className = 'input-block-label';
        this.labelInput.textContent = this.data.labelTextInput;
        this.labelInput.style.marginRight = "10px";
        this.labelInput.style.whiteSpace = 'pre';
        this.labelInput.style.fontSize = this.data.textSize;
        this.labelInput.style.flexGrow = '0';
        this.labelInput.style.padding = '0.4em 0';
        this.labelInput.style.lineHeight = '1.2';

        this.asterisk = document.createElement('span');
        this.asterisk.textContent = '*';
        this.asterisk.style.color = 'red';
        this.asterisk.style.fontSize = this.data.textSize;
        const textSizeValue = parseInt(this.data.textSize, 10);
        this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;


        // this.labelInput.appendChild(asterisk);



        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'd-flex';
        inputWrapper.style.width = '100%';

        this.inputElement = document.createElement('input');
        this.inputElement.type = 'text';
        this.inputElement.className = 'form-control mr-2';
        this.inputElement.placeholder = this.data.inputplaceholder;
        this.inputElement.value = this.data.value;
        this.inputElement.style.width = this.data.inputwidth + '%';
        this.inputElement.style.fontSize = this.data.inputSize;
        this.inputElement.style.lineHeight = '1.2';
        this.inputElement.setAttribute('role', this.data.role);

        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';
        this.editButton.style.display = 'none';
        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.backgroundColor = 'transparent';
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.transition = 'opacity 0.3s';
        this.editButton.style.zIndex = '100';
        this.editButton.style.outline = 'none';

        this.editButton.onclick = () => this.openEditModal();

        inputWrapper.appendChild(this.inputElement);
        inputWrapper.appendChild(this.editButton);

        labeldiv.appendChild(this.labelInput);
        labeldiv.appendChild(this.asterisk);
        // this.wrapper.appendChild(this.labelInput);

        this.wrapper.appendChild(labeldiv);
        this.wrapper.appendChild(inputWrapper);
        this.applyLabelPosition();
        if (this.data.mandatory) {
            this.labelInput.style.marginRight = "0px";
            this.asterisk.style.marginRight = "10px"
        } else {
            this.asterisk.style.display = "none";
        }
        this.applyStyles();

        // Show the edit button on hover
        this.wrapper.onmouseover = () => {
            this.editButton.style.display = 'block';
        };
        this.wrapper.onmouseout = () => {
            this.editButton.style.display = 'none';
        };
        if (this.inputid) {
            this.inputid.addEventListener('input', (event) => {
                usedLabels.delete(this.data.fieldName + "_" + this.data.role);
                this.data.role = event.target.value;
                this.inputElement.setAttribute('role', this.data.role);
                usedLabels.add(this.data.fieldName + "_" + this.data.role);
            });

        }
        usedLabels.add(this.data.fieldName + "_" + this.data.role);


        return this.wrapper;
    }

    save(blockContent) {
        return {
            label: this.labelInput.value,
            value: this.inputElement.value,
            labelPosition: this.data.labelPosition,
            labelfamily: this.data.labelfamily,
            inputfamily: this.data.inputfamily,
            labelTextInput: this.data.labelTextInput,
            inputwidth: this.data.inputwidth,
            inputSize: this.data.inputSize,
            inputplaceholder: this.data.inputplaceholder,
            textwidth: this.data.textwidth,
            textSize: this.data.textSize,
            textplaceholder: this.data.textplaceholder,
            labelBold: this.data.labelBold,
            labelItalic: this.data.labelItalic,
            fieldName: this.data.fieldName,
            role: this.data.role,
            selectedIndex: this.data.selectedIndex,
            mandatory: this.data.mandatory,


        };
    }
    destroy() {
        const labelToRemove = this.data.fieldName + "_" + this.data.role;


        if (usedLabels.has(labelToRemove)) {
            usedLabels.delete(labelToRemove);
        }
    }

    openEditModal() {
        const labelPositionSelect = document.getElementById('labelPositionSelect');
        const labelfamilyselect = document.getElementById('labelfamilyselect');
        const inputfamilyselect = document.getElementById('inputfamilyselect');
        const boldButton = document.getElementById('inputboldButton');
        const italicButton = document.getElementById('inputitalicButton');
        const labelInputError = document.getElementById('labelInputError')
        labelInputError.classList.add('d-none');
        // if (this.data.labelBold !== 'bold') {
        //     if (boldButton.classList.contains('btn-primary')) {
        //         boldButton.classList.remove('btn-primary');
        //     }
        // }
        // if (this.data.labelItalic !== 'italic') {
        //     if (italicButton.classList.contains('btn-primary')) {
        //         italicButton.classList.remove('btn-primary');
        //     }
        // }
        boldButton.classList.toggle('btn-primary', this.data.labelBold === 'bold');
        italicButton.classList.toggle('btn-primary', this.data.labelItalic === 'bold');

        const labelTextInput = document.getElementById('labelTextInput');
        const labelfieldName = document.getElementById('labelfieldName');
        const inputWidth = document.getElementById('inputWidth');
        const inputFontSize = document.getElementById('inputFontSize');
        const inputPlaceholder = document.getElementById('inputPlaceholder');

        const textWidth = document.getElementById('textWidth');
        const textSize = document.getElementById('textFontSize');
        const textPlaceholder = document.getElementById('textPlaceholder');

        const previewContainer = document.getElementById('previewContainer');
        const mandatoryCheckbox = document.getElementById('mandatoryCheckbox');
        mandatoryCheckbox.checked = this.data.mandatory;
        mandatoryCheckbox.addEventListener('change', () => {
            this.data.mandatory = mandatoryCheckbox.checked;
            updatePreview();
        });

        labelPositionSelect.value = this.data.labelPosition;
        labelfamilyselect.value = this.data.labelfamily;
        inputfamilyselect.value = this.data.inputfamily;

        labelTextInput.textContent = this.data.labelTextInput;
        labelfieldName.value = this.data.fieldName;
        inputWidth.value = this.data.inputwidth;
        labelTextInput.value = this.data.labelTextInput;
        inputFontSize.value = this.data.inputSize;
        inputPlaceholder.value = this.data.inputplaceholder;

        textWidth.value = this.data.textwidth;
        textSize.value = this.data.textSize;
        textPlaceholder.value = this.data.textplaceholder;

        const updatePreview = () => {
            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'd-flex align-items-center';

            const previewLabelInput = document.createElement('label');
            previewLabelInput.className = 'input-block-label';
            previewLabelInput.placeholder = textPlaceholder.value;
            previewLabelInput.textContent = labelTextInput.value;
            previewLabelInput.style.fontSize = textSize.value;
            previewLabelInput.style.fontWeight = boldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            previewLabelInput.style.fontStyle = italicButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            previewLabelInput.style.width = "auto";
            previewLabelInput.style.marginRight = "5px";
            previewLabelInput.style.whiteSpace = 'pre';
            previewLabelInput.style.padding = '0.4em 0px';
            previewLabelInput.style.lineHeight = '1.2';
            previewLabelInput.style.fontFamily = labelfamilyselect.value;

            if (this.data.mandatory) {
                previewLabelInput.innerHTML += ' <span style="color: red;">*</span>';
            }

            const previewInputElement = document.createElement('input');
            previewInputElement.type = 'text';
            previewInputElement.className = 'form-control mr-2';
            previewInputElement.placeholder = inputPlaceholder.value;
            previewInputElement.value = this.data.value;
            previewInputElement.style.width = inputWidth.value + "%";
            previewInputElement.style.fontSize = inputFontSize.value;
            previewInputElement.style.fontFamily = inputfamilyselect.value;
            previewInputElement.style.lineHeight = '1.2';

            previewWrapper.appendChild(previewLabelInput);

            const previewInputWrapper = document.createElement('div');
            previewInputWrapper.className = 'd-flex';
            previewInputWrapper.style.width = '100%';
            previewInputWrapper.appendChild(previewInputElement);

            previewWrapper.appendChild(previewInputWrapper);

            if (labelPositionSelect.value === 'top') {
                previewWrapper.classList.add('flex-column');
                previewWrapper.classList.remove('align-items-center');
                previewLabelInput.style.marginBottom = '0.4em';
            } else {
                previewWrapper.classList.remove('flex-column');
            }


            previewContainer.innerHTML = '';
            previewContainer.appendChild(previewWrapper);
        };

        updatePreview();

        boldButton.onclick = () => {
            boldButton.classList.toggle('btn-primary');
            updatePreview();
        };

        italicButton.onclick = () => {
            italicButton.classList.toggle('btn-primary');
            updatePreview();
        };

        labelPositionSelect.addEventListener('change', updatePreview);
        labelfamilyselect.addEventListener("change", updatePreview);
        inputfamilyselect.addEventListener("change", updatePreview);

        document.querySelectorAll('#editInputModal input').forEach(input => {
            input.addEventListener('input', updatePreview);
        });

        $('#editInputModal').modal('show');

        const saveButton = document.getElementById('saveLabelPositionButton');
        saveButton.onclick = () => {
            const newLabel = labelfieldName.value + "_" + this.data.role;
            if (usedLabels.has(newLabel) && newLabel !== this.data.fieldName + "_" + this.data.role) {
                labelInputError.innerText = "Dublicate Field Name";
                labelInputError.classList.remove('d-none');
                return;
            }
            else {
                labelInputError.classList.add('d-none');
            }

            if (labelfieldName.value === "") {
                labelInputError.innerText = "Field Name can't be Empty";
                labelInputError.classList.remove('d-none');
                return;
            }
            else {
                labelInputError.classList.add('d-none');
            }

            if (this.data.mandatory) {
                this.labelInput.style.marginRight = "0px";
                this.asterisk.style.marginRight = "10px";
                this.asterisk.style.display = "unset";
            } else {

                this.labelInput.style.marginRight = "10px";
                this.asterisk.style.display = "none";
            }




            usedLabels.delete(this.data.fieldName + "_" + this.data.role);
            usedLabels.add(newLabel);
            this.data.labelPosition = labelPositionSelect.value;
            this.data.labelfamily = labelfamilyselect.value;
            this.data.inputfamily = inputfamilyselect.value;
            this.data.labelTextInput = labelTextInput.value;
            this.data.fieldName = labelfieldName.value;
            this.data.inputwidth = inputWidth.value;
            this.data.inputSize = inputFontSize.value;
            this.data.inputplaceholder = inputPlaceholder.value;
            this.data.textwidth = textWidth.value;
            this.data.textSize = textSize.value;
            this.data.textplaceholder = textPlaceholder.value;
            this.data.labelBold = boldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            this.data.labelItalic = italicButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            this.applyLabelPosition();
            this.applyStyles();
            $('#editInputModal').modal('hide');
        };
        const deletebutton = document.getElementById('deleteinputblock')
        deletebutton.onclick = () => {
            const index = this.api.blocks.getCurrentBlockIndex()
            this.api.blocks.delete(index)
            $('#editInputModal').modal('hide');

        };
    }

    applyLabelPosition() {
        if (this.data.labelPosition === 'top') {
            this.wrapper.classList.add('flex-column');
            this.wrapper.classList.remove('align-items-center');
            this.labelInput.style.padding = "0.4em 0";
            this.labelInput.style.marginBottom = '0.4em';
        } else {
            this.wrapper.classList.remove('flex-column');
            this.wrapper.classList.add('align-items-center');
        }
    }

    applyStyles() {
        this.inputElement.style.width = this.data.inputwidth + '%';
        this.inputElement.style.fontSize = this.data.inputSize;
        this.inputElement.style.fontFamily = this.data.inputfamily;
        this.inputElement.placeholder = this.data.inputplaceholder;
        this.labelInput.style.fontSize = this.data.textSize;
        const textSizeValue = parseInt(this.data.textSize, 10);
        this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;
        this.labelInput.style.fontFamily = this.data.labelfamily;
        this.labelInput.textContent = this.data.labelTextInput;
        this.labelInput.style.fontWeight = this.data.labelBold;
        this.labelInput.style.fontStyle = this.data.labelItalic;
    }
}




class CheckBoxBlock {
    static get toolbox() {
        return {
            title: 'Checkbox',
            icon: '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg" fill="#000000"><rect x="1" y="1" width="14" height="14" stroke="#000000" fill="none"/><path d="M4 7l2 2 4-4" stroke="#000000" fill="none"/></svg>',
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            label: 'Label',
            options: [{ text: 'Option 1', selected: false }],
            labelFamily: 'Arial',
            optionFamily: 'Arial',
            labelBold: 'normal',
            labelItalic: 'normal',
            optionBold: 'normal',
            optionItalic: 'normal',
            labelFontSize: '16px',
            optionsFontSize: '14px',
            optionPosition: 'vertical',
            labelPosition: 'top',
            mandatory: false,
        };
        this.wrapper = null;
        this.labelElement = null;
        this.editButton = null;
        this.labelWrapper = null;
        this.inputid = null;
        this.asterisk = null;
    }

    render() {
        const selectElement = document.getElementById('ClientSelect');
        const selectedRole = selectElement.value;
        this.data.selectedIndex = this.data.selectedIndex ? this.data.selectedIndex : selectElement.selectedIndex;
        this.inputid = document.getElementById(roleList[this.data.selectedIndex]?.inputid);
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'd-flex';
        this.wrapper.style.padding = "1em 0";
        this.data.role = this.data.role ? this.data.role : selectedRole;

        this.labelWrapper = document.createElement('div');
        this.labelWrapper.className = 'd-flex align-items-center';
        this.labelWrapper.style.width = 'auto';

        const labeldiv = document.createElement('div')
        labeldiv.className = 'd-flex';
        labeldiv.style.gap = '0px';
        labeldiv.style.padding = '0px';
        labeldiv.style.margin = '0px';

        this.labelElement = document.createElement('label');
        this.labelElement.textContent = this.data.label;
        this.labelElement.style.marginRight = "10px";
        this.labelElement.style.fontSize = this.data.labelFontSize;
        this.labelElement.style.marginBottom = '0.25rem';

        this.asterisk = document.createElement('span');
        this.asterisk.textContent = '*';
        this.asterisk.style.color = 'red';
        this.asterisk.style.fontSize = this.data.labelFontSize;
        const textSizeValue = parseInt(this.data.labelFontSize, 10);
        this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;

        this.applyLabelStyles();
        this.applyOptionPosition();
        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';
        this.editButton.style.display = 'none';
        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.backgroundColor = 'transparent'; // Transparent background
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.transition = 'opacity 0.3s';
        this.editButton.style.zIndex = '100'; // Ensure it's on top
        this.editButton.style.outline = 'none';
        this.editButton.onclick = () => this.openEditModal();

        labeldiv.appendChild(this.labelElement);
        labeldiv.appendChild(this.asterisk);
        // this.wrapper.appendChild(this.labelInput);

        this.labelWrapper.appendChild(labeldiv);
        this.labelWrapper.appendChild(this.editButton);
        this.wrapper.append(this.labelWrapper);



        if (this.data.mandatory) {
            this.labelElement.style.marginRight = "0px";
            this.asterisk.style.marginRight = "10px";
            this.asterisk.style.display = "unset";
        } else {
            this.labelElement.style.marginRight = "10px";
            this.asterisk.style.display = "none";
        }

        const radiodiv = document.createElement('div');
        radiodiv.className = 'm-0 p-0';

        this.data.options.forEach((option, index) => {
            const checkboxWrapper = document.createElement('div');
            checkboxWrapper.className = 'form-check d-flex align-items-center radio-option';

            const checkboxInput = document.createElement('input');
            checkboxInput.type = 'checkbox';
            checkboxInput.className = 'form-check-input mt-0';
            checkboxInput.name = 'checkbox-group';
            checkboxInput.setAttribute('role', this.data.role);
            if (option.selected) {
                checkboxInput.checked = true;
            }


            checkboxInput.addEventListener('change', () => {

                this.data.options.forEach((opt, i) => {
                    opt.selected = (i === index);
                });
            });

            if (this.inputid) {
                this.inputid.addEventListener('input', (event) => {
                    usedLabels.delete(this.data.fieldName + "_" + this.data.role);
                    this.data.role = event.target.value;
                    checkboxInput.setAttribute('role', this.data.role);
                    usedLabels.add(this.data.fieldName + "_" + this.data.role);
                });

            }

            const checkboxLabel = document.createElement('label');
            checkboxLabel.className = 'form-check-label';
            checkboxLabel.textContent = option.text;
            checkboxLabel.style.fontSize = this.data.optionsFontSize;
            this.applyOptionStyles(checkboxLabel);

            checkboxWrapper.appendChild(checkboxInput);
            checkboxWrapper.appendChild(checkboxLabel);

            if (this.data.optionPosition === 'vertical' && this.data.labelPosition === 'left') {
                radiodiv.appendChild(checkboxWrapper);
            }
            else {
                this.wrapper.appendChild(checkboxWrapper);
            }
        });

        if (this.data.optionPosition === 'vertical' && this.data.labelPosition === 'left') {
            this.wrapper.appendChild(radiodiv);
        }

        this.wrapper.onmouseover = () => {
            this.editButton.style.display = 'block';
        };
        this.wrapper.onmouseout = () => {
            this.editButton.style.display = 'none';
        };

        return this.wrapper;
    }

    save(blockContent) {
        const height = this.wrapper?.offsetHeight || 0;
        return {
            label: this.labelElement.textContent,
            options: this.data.options,
            labelFamily: this.data.labelFamily,
            optionFamily: this.data.optionFamily,
            labelBold: this.data.labelBold,
            labelItalic: this.data.labelItalic,
            optionBold: this.data.optionBold,
            optionItalic: this.data.optionItalic,
            labelFontSize: this.data.labelFontSize,
            optionsFontSize: this.data.optionsFontSize,
            optionPosition: this.data.optionPosition,
            labelPosition: this.data.labelPosition,
            blockheight: height,
            fieldName: this.data.fieldName,
            role: this.data.role,
            selectedIndex: this.data.selectedIndex,
            mandatory: this.data.mandatory
        };
    }


    destroy() {
        const labelToRemove = this.data.fieldName + "_" + this.data.role;


        if (usedLabels.has(labelToRemove)) {
            usedLabels.delete(labelToRemove);
        }
    }

    applyLabelStyles() {
        this.labelElement.style.fontFamily = this.data.labelFamily;
        this.labelElement.style.fontWeight = this.data.labelBold;
        this.labelElement.style.fontStyle = this.data.labelItalic;
    }

    applyOptionStyles(optionElement) {
        optionElement.style.fontFamily = this.data.optionFamily;
        optionElement.style.fontWeight = this.data.optionBold;
        optionElement.style.fontStyle = this.data.optionItalic;
    }

    openEditModal() {
        const checkboxLabelInput = document.getElementById('checkboxLabelInput');
        const checkfieldName = document.getElementById('checkfieldName');
        const checkboxOptions = document.getElementById('checkboxOptions');
        const checkboxPreview = document.getElementById('checkboxPreview');
        const checklabelFamilySelect = document.getElementById('checklabelFamilySelect');
        const checkoptionFamilySelect = document.getElementById('checkoptionFamilySelect');
        const checkboldLabelButton = document.getElementById('checkboldLabelButton');
        const checkitalicLabelButton = document.getElementById('checkitalicLabelButton');
        const checkboldOptionButton = document.getElementById('checkboldOptionButton');
        const checkitalicOptionButton = document.getElementById('checkitalicOptionButton');
        const checklabelFontSizeInput = document.getElementById('checklabelFontSizeInput');
        const checkoptionsFontSizeInput = document.getElementById('checkoptionsFontSizeInput');
        const labelCheckError = document.getElementById('labelCheckError');

        const mandatoryCheckboxCheck = document.getElementById('mandatoryCheckboxCheck');
        mandatoryCheckboxCheck.checked = this.data.mandatory;
        mandatoryCheckboxCheck.addEventListener('change', () => {
            this.data.mandatory = mandatoryCheckboxCheck.checked;
            updatePreview();
        });

        const checkPositionSelect = document.getElementById('checkPositionSelect');
        const checkLabelPositionSelect = document.getElementById('checkLabelPositionSelect')
        labelCheckError.classList.add('d-none');

        checklabelFontSizeInput.value = this.data.labelFontSize;
        checkoptionsFontSizeInput.value = this.data.optionsFontSize;
        checkboxLabelInput.value = this.data.label;
        checkfieldName.value = this.data.fieldName;
        checklabelFamilySelect.value = this.data.labelFamily;
        checkoptionFamilySelect.value = this.data.optionFamily;
        checkboldLabelButton.classList.toggle('btn-primary', this.data.labelBold === 'bold');
        checkitalicLabelButton.classList.toggle('btn-primary', this.data.labelItalic === 'italic');
        checkboldOptionButton.classList.toggle('btn-primary', this.data.optionBold === 'bold');
        checkitalicOptionButton.classList.toggle('btn-primary', this.data.optionItalic === 'italic');
        checkboxLabelInput.value = this.data.label;
        checklabelFontSizeInput.value = this.data.labelFontSize;
        checkPositionSelect.value = this.data.optionPosition;
        checkLabelPositionSelect.value = this.data.labelPosition;
        const tempoptions = JSON.parse(JSON.stringify(this.data.options));

        checkboxOptions.innerHTML = '';
        tempoptions.forEach((option, index) => {
            const optionWrapper = document.createElement('div');
            optionWrapper.className = 'input-group mb-2';

            const optionInput = document.createElement('input');
            optionInput.type = 'text';
            optionInput.className = 'form-control mr-2';
            optionInput.placeholder = 'Option text';
            optionInput.value = option.text;

            const removeButton = document.createElement('button');
            removeButton.className = 'btn btn-danger';
            removeButton.innerText = 'Remove';
            removeButton.onclick = () => {
                tempoptions.splice(index, 1);
                optionWrapper.remove();
                updatePreview();
            };

            optionWrapper.appendChild(optionInput);
            optionWrapper.appendChild(removeButton);
            checkboxOptions.appendChild(optionWrapper);

            optionInput.addEventListener('input', (event) => {
                tempoptions[index].text = event.target.value;
                updatePreview();
            });
        });

        const addCheckboxOption = document.getElementById('addCheckboxOption');
        addCheckboxOption.onclick = () => {
            const newOption = { text: `Option ${tempoptions.length + 1}`, selected: false };
            tempoptions.push(newOption);
            const optionWrapper = document.createElement('div');
            optionWrapper.className = 'input-group mb-2';

            const optionInput = document.createElement('input');
            optionInput.type = 'text';
            optionInput.className = 'form-control mr-2';
            optionInput.placeholder = 'Option text';
            optionInput.value = newOption.text;

            const removeButton = document.createElement('button');
            removeButton.className = 'btn btn-danger';
            removeButton.innerText = 'Remove';
            removeButton.onclick = () => {
                tempoptions.splice(tempoptions.indexOf(newOption), 1);
                optionWrapper.remove();
                updatePreview();
            };

            optionWrapper.appendChild(optionInput);
            optionWrapper.appendChild(removeButton);
            checkboxOptions.appendChild(optionWrapper);

            optionInput.addEventListener('input', (event) => {
                newOption.text = event.target.value;
                updatePreview();
            });

            updatePreview();
        };

        const updatePreview = () => {
            checkboxPreview.innerHTML = '';
            const previewLabel = document.createElement('label');
            previewLabel.textContent = checkboxLabelInput.value;
            previewLabel.style.fontFamily = checklabelFamilySelect.value;
            previewLabel.style.fontWeight = checkboldLabelButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            previewLabel.style.fontStyle = checkitalicLabelButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            previewLabel.style.fontSize = checklabelFontSizeInput.value;
            previewLabel.style.marginBottom = '0.25rem'
            checkboxPreview.className = 'd-flex';
            checkboxPreview.appendChild(previewLabel);

            if (this.data.mandatory) {
                previewLabel.innerHTML += ' <span style="color: red;">*</span>';
            }



            if (checkPositionSelect.value === 'vertical' && checkLabelPositionSelect.value === 'left') {
                checkboxPreview.classList.remove('flex-column');
                previewLabel.style.width = 'auto';
                previewLabel.style.marginRight = "5px";
            }

            else {

                if (checkPositionSelect.value === 'vertical') {
                    checkboxPreview.classList.add('flex-column');
                    checkboxPreview.classList.remove('radio-options');
                }
                else {
                    checkboxPreview.classList.remove('flex-column');
                    checkboxPreview.classList.add('radio-options');
                }
                if (checkLabelPositionSelect.value === 'top') {
                    previewLabel.style.width = '100%';
                }
                else {
                    previewLabel.style.width = 'auto';
                }

            }



            const radiodiv = document.createElement('div');
            radiodiv.className = 'm-0 p-0';


            tempoptions.forEach(option => {
                const checkboxWrapper = document.createElement('div');
                checkboxWrapper.className = 'form-check d-flex align-items-center';

                const checkboxInput = document.createElement('input');
                checkboxInput.type = 'checkbox';
                checkboxInput.className = 'form-check-input mt-0';
                checkboxInput.name = 'checkbox-group-preview';
                checkboxInput.disabled = true;

                const checkboxLabel = document.createElement('label');
                checkboxLabel.className = 'form-check-label';
                checkboxLabel.textContent = option.text;
                checkboxLabel.style.fontFamily = checkoptionFamilySelect.value;
                checkboxLabel.style.fontWeight = checkboldOptionButton.classList.contains('btn-primary') ? 'bold' : 'normal';
                checkboxLabel.style.fontStyle = checkitalicOptionButton.classList.contains('btn-primary') ? 'italic' : 'normal';
                checkboxLabel.style.fontSize = checkoptionsFontSizeInput.value;

                checkboxWrapper.appendChild(checkboxInput);
                checkboxWrapper.appendChild(checkboxLabel);

                if (checkPositionSelect.value === 'vertical' && checkLabelPositionSelect.value === 'left') {

                    radiodiv.appendChild(checkboxWrapper);
                }
                else {
                    checkboxPreview.appendChild(checkboxWrapper);

                }


            });
            if (checkPositionSelect.value === 'vertical' && checkLabelPositionSelect.value === 'left') {
                checkboxPreview.appendChild(radiodiv);
            }
        };

        updatePreview();

        checkboldLabelButton.onclick = () => {
            checkboldLabelButton.classList.toggle('btn-primary');
            updatePreview();
        };

        checkitalicLabelButton.onclick = () => {
            checkitalicLabelButton.classList.toggle('btn-primary');
            updatePreview();
        };

        checkboldOptionButton.onclick = () => {
            checkboldOptionButton.classList.toggle('btn-primary');
            updatePreview();
        };

        checkitalicOptionButton.onclick = () => {
            checkitalicOptionButton.classList.toggle('btn-primary');
            updatePreview();
        };

        checkPositionSelect.addEventListener('change', updatePreview);

        checkLabelPositionSelect.addEventListener('change', updatePreview);

        checklabelFamilySelect.onchange = updatePreview;
        checkoptionFamilySelect.onchange = updatePreview;
        document.querySelectorAll('#checkboxModal input').forEach(input => {
            input.addEventListener('input', updatePreview);
        });

        const saveButton = document.getElementById('saveCheckboxBlock');
        saveButton.onclick = () => {
            const newLabel = checkfieldName.value + "_" + this.data.role;
            if (usedLabels.has(newLabel) && newLabel !== this.data.fieldName + "_" + this.data.role) {
                labelCheckError.innerText = "Dublicate Field Name";
                labelCheckError.classList.remove('d-none');
                return;
            }
            else {
                labelCheckError.classList.add('d-none');
            }

            if (checkfieldName.value === "") {
                labelCheckError.innerText = "Field Name can't be Empty";
                labelCheckError.classList.remove('d-none');
                return;
            }
            else {
                labelCheckError.classList.add('d-none');
            }

            if (this.data.mandatory) {
                this.labelElement.style.marginRight = "0px";
                this.asterisk.style.marginRight = "10px";
                this.asterisk.style.display = "unset";
            } else {
                this.asterisk.style.display = "none";
            }


            usedLabels.delete(this.data.fieldname + "_" + this.data.role);
            usedLabels.add(newLabel);
            this.data.label = checkboxLabelInput.value;
            this.data.fieldName = checkfieldName.value;
            this.data.labelFamily = checklabelFamilySelect.value;
            this.data.labelBold = checkboldLabelButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            this.data.labelItalic = checkitalicLabelButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            this.data.labelFontSize = checklabelFontSizeInput.value;

            this.data.optionFamily = checkoptionFamilySelect.value;
            this.data.optionBold = checkboldOptionButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            this.data.optionItalic = checkitalicOptionButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            this.data.optionsFontSize = checkoptionsFontSizeInput.value;
            this.data.options = JSON.parse(JSON.stringify(tempoptions));
            this.data.optionPosition = checkPositionSelect.value;
            this.data.labelPosition = checkLabelPositionSelect.value;


            this.labelElement.textContent = this.data.label;
            this.labelElement.style.fontFamily = this.data.labelFamily;
            this.labelElement.style.fontWeight = this.data.labelBold;
            this.labelElement.style.fontStyle = this.data.labelItalic;
            this.labelElement.style.fontSize = this.data.labelFontSize;
            const textSizeValue = parseInt(this.data.labelFontSize, 10);
            this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;

            this.applyOptionPosition();


            while (this.wrapper.children.length > 1) {
                this.wrapper.removeChild(this.wrapper.lastChild);
            }

            const radiodiv = document.createElement('div');
            radiodiv.className = 'm-0 p-0';

            this.data.options.forEach(option => {
                const checkboxWrapper = document.createElement('div');
                checkboxWrapper.className = 'form-check d-flex align-items-center radio-option';

                const checkboxInput = document.createElement('input');
                checkboxInput.type = 'checkbox';
                checkboxInput.className = 'form-check-input mt-0';
                checkboxInput.name = 'checkbox-group';
                checkboxInput.setAttribute('role', this.data.role);

                checkboxInput.addEventListener('change', () => {

                    this.data.options.forEach((opt, i) => {
                        opt.selected = (i === index);
                    });
                });

                if (this.inputid) {
                    this.inputid.addEventListener('input', (event) => {
                        usedLabels.delete(this.data.fieldName + "_" + this.data.role);
                        this.data.role = event.target.value;
                        checkboxInput.setAttribute('role', this.data.role);
                        usedLabels.add(this.data.fieldName + "_" + this.data.role);
                    });

                }

                const checkboxLabel = document.createElement('label');
                checkboxLabel.className = 'form-check-label';
                checkboxLabel.textContent = option.text;
                checkboxLabel.style.fontFamily = this.data.optionFamily;
                checkboxLabel.style.fontWeight = this.data.optionBold;
                checkboxLabel.style.fontStyle = this.data.optionItalic;
                checkboxLabel.style.fontSize = this.data.optionsFontSize;

                checkboxWrapper.appendChild(checkboxInput);
                checkboxWrapper.appendChild(checkboxLabel);


                if (this.data.optionPosition === 'vertical' && this.data.labelPosition === 'left') {
                    radiodiv.appendChild(checkboxWrapper);
                }
                else {
                    this.wrapper.appendChild(checkboxWrapper);
                }


            });
            if (this.data.optionPosition === 'vertical' && this.data.labelPosition === 'left') {
                this.wrapper.appendChild(radiodiv);
            }




            $('#checkboxModal').modal('hide');
        };
        const deletebutton = document.getElementById('deletecheckblock')
        deletebutton.onclick = () => {
            const index = this.api.blocks.getCurrentBlockIndex()
            this.api.blocks.delete(index)
            $('#editInputModal').modal('hide');

        };

        $('#checkboxModal').modal('show');

    }

    applyOptionPosition() {
        if (this.data.optionPosition === 'vertical' && this.data.labelPosition === 'left') {
            this.wrapper.classList.remove('flex-column');
            this.labelWrapper.style.width = 'auto';
            this.labelWrapper.classList.remove('align-items-center');
            this.labelElement.style.marginTop = 'unset';

        }
        else {
            this.labelWrapper.classList.add('align-items-center');
            this.labelElement.style.marginTop = 'auto';
            if (this.data.optionPosition === 'vertical') {
                this.wrapper.classList.add('flex-column');
                this.wrapper.classList.remove('radio-options');

            }
            else {
                this.wrapper.classList.remove('flex-column');
                this.wrapper.classList.add('radio-options');
            }

            if (this.data.labelPosition === 'top') {
                this.labelWrapper.style.width = '100%';
            }
            else {
                this.labelWrapper.style.width = 'auto';
            }
        }


    }
}

class ButtonBlock {
    static get toolbox() {
        return {
            title: 'Button',
            icon: '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg" fill="#000000"><circle cx="8.5" cy="7.5" r="6.5" fill="#000000"/></svg>',
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            buttonText: 'Button',
            buttonWidth: '100px',
            buttonFontSize: '16px',
            buttonFontFamily: 'Arial',
            buttonAction: 'submit',
            buttonBold: 'normal',
            buttonItalic: 'normal',
            buttonBackgroundColor: '#007bff', // Default background color
            buttonBorderColor: '#007bff', // Default border color
        };
        this.wrapper = null;
        this.buttonElement = null;
        this.editButton = null;
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.style.position = 'relative';
        this.wrapper.style.padding = '1em 0';

        this.buttonElement = document.createElement('button');
        this.buttonElement.className = 'btn btn-primary';
        this.buttonElement.textContent = this.data.buttonText;
        this.buttonElement.style.width = this.data.buttonWidth;
        this.buttonElement.style.fontSize = this.data.buttonFontSize;
        this.buttonElement.style.fontFamily = this.data.buttonFontFamily;
        this.buttonElement.style.fontWeight = this.data.buttonBold;
        this.buttonElement.style.fontStyle = this.data.buttonItalic;
        this.buttonElement.style.backgroundColor = this.data.buttonBackgroundColor;
        this.buttonElement.style.borderColor = this.data.buttonBorderColor;
        this.buttonElement.type = this.data.buttonAction;

        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';
        this.editButton.style.display = 'none'; // Initially hidden
        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.backgroundColor = 'transparent'; // Transparent background
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.transition = 'opacity 0.3s';
        this.editButton.style.zIndex = '100'; // Ensure it's on top
        this.editButton.style.outline = 'none';

        this.editButton.onclick = () => this.openEditModal();

        // Add event listeners for hover effect
        this.wrapper.onmouseover = () => {
            this.editButton.style.display = 'block';
        };
        this.wrapper.onmouseout = () => {
            this.editButton.style.display = 'none';
        };

        this.wrapper.appendChild(this.buttonElement);
        this.wrapper.appendChild(this.editButton);

        return this.wrapper;
    }

    save(blockContent) {
        return {
            buttonText: this.data.buttonText,
            buttonWidth: this.data.buttonWidth,
            buttonFontSize: this.data.buttonFontSize,
            buttonFontFamily: this.data.buttonFontFamily,
            buttonAction: this.data.buttonAction,
            buttonBold: this.data.buttonBold,
            buttonItalic: this.data.buttonItalic,
            buttonBackgroundColor: this.data.buttonBackgroundColor,
            buttonBorderColor: this.data.buttonBorderColor,
        };
    }

    openEditModal() {
        const buttonWidth = document.getElementById('buttonWidth');
        const buttonFontSize = document.getElementById('buttonFontSize');
        const buttonFontFamily = document.getElementById('buttonFontFamily');
        const buttonAction = document.getElementById('buttonAction');
        const buttonText = document.getElementById('buttonText');
        const boldButton = document.getElementById('buttonboldButton');
        const italicButton = document.getElementById('buttonitalicButton');
        const buttonBackgroundColor = document.getElementById('buttonBackgroundColor');
        const buttonBorderColor = document.getElementById('buttonBorderColor');

        if (this.data.buttonBold !== 'bold') {
            if (boldButton.classList.contains('btn-primary')) {
                boldButton.classList.remove('btn-primary');
            }
        }
        if (this.data.buttonItalic !== 'italic') {
            if (italicButton.classList.contains('btn-primary')) {
                italicButton.classList.remove('btn-primary');
            }
        }

        const previewContainer = document.getElementById('buttonpreviewContainer');

        buttonWidth.value = this.data.buttonWidth;
        buttonFontSize.value = this.data.buttonFontSize;
        buttonFontFamily.value = this.data.buttonFontFamily;
        buttonAction.value = this.data.buttonAction;
        buttonText.value = this.data.buttonText;
        buttonBackgroundColor.value = this.data.buttonBackgroundColor;
        buttonBorderColor.value = this.data.buttonBorderColor;

        const updatePreview = () => {
            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'd-flex align-items-center';

            const previewButtonElement = document.createElement('button');
            previewButtonElement.className = 'btn btn-primary';
            previewButtonElement.textContent = buttonText.value;
            previewButtonElement.style.width = buttonWidth.value;
            previewButtonElement.style.fontSize = buttonFontSize.value;
            previewButtonElement.style.fontFamily = buttonFontFamily.value;
            previewButtonElement.style.fontWeight = boldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            previewButtonElement.style.fontStyle = italicButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            previewButtonElement.style.backgroundColor = buttonBackgroundColor.value;
            previewButtonElement.style.borderColor = buttonBorderColor.value;
            previewButtonElement.type = buttonAction.value;

            previewWrapper.appendChild(previewButtonElement);

            previewContainer.innerHTML = '';
            previewContainer.appendChild(previewWrapper);
        };

        updatePreview();

        boldButton.onclick = () => {
            boldButton.classList.toggle('btn-primary');
            updatePreview();
        };

        italicButton.onclick = () => {
            italicButton.classList.toggle('btn-primary');
            updatePreview();
        };

        document.querySelectorAll('#editButtonModal input, #editButtonModal select').forEach(input => {
            input.addEventListener('input', updatePreview);
        });

        $('#editButtonModal').modal('show');

        const saveButton = document.getElementById('saveButtonSettings');
        saveButton.onclick = () => {
            this.data.buttonWidth = buttonWidth.value;
            this.data.buttonFontSize = buttonFontSize.value;
            this.data.buttonFontFamily = buttonFontFamily.value;
            this.data.buttonAction = buttonAction.value;
            this.data.buttonText = buttonText.value;
            this.data.buttonBold = boldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            this.data.buttonItalic = italicButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            this.data.buttonBackgroundColor = buttonBackgroundColor.value;
            this.data.buttonBorderColor = buttonBorderColor.value;
            this.applyStyles();
            $('#editButtonModal').modal('hide');
        };
        const deletebutton = document.getElementById('deletebuttonblock')
        deletebutton.onclick = () => {
            const index = this.api.blocks.getCurrentBlockIndex()
            this.api.blocks.delete(index)
            $('#editInputModal').modal('hide');
        };
    }

    applyStyles() {
        this.buttonElement.style.width = this.data.buttonWidth;
        this.buttonElement.style.fontSize = this.data.buttonFontSize;
        this.buttonElement.style.fontFamily = this.data.buttonFontFamily;
        this.buttonElement.style.fontWeight = this.data.buttonBold;
        this.buttonElement.style.fontStyle = this.data.buttonItalic;
        this.buttonElement.style.backgroundColor = this.data.buttonBackgroundColor;
        this.buttonElement.style.borderColor = this.data.buttonBorderColor;
        this.buttonElement.textContent = this.data.buttonText;
        this.buttonElement.type = this.data.buttonAction;
    }
}

class ImageBlock {
    static get toolbox() {
        return {
            title: 'Image',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.5858 3.41421C18.8047 2.63316 17.5562 2.63316 16.7751 3.41421L13.4142 6.77515C12.6332 7.5562 12.6332 8.80474 13.4142 9.58579L14.8284 11L11 14.8284V16H12.1716L16 12.1716L17.4142 13.5858C18.1953 14.3668 19.4438 14.3668 20.2249 13.5858L23.5858 10.2249C24.3668 9.44384 24.3668 8.1953 23.5858 7.41421L19.5858 3.41421Z" fill="currentColor"/><path d="M3 20C3 19.4477 3.44772 19 4 19H20C20.5523 19 21 19.4477 21 20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20Z" fill="currentColor"/><path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12Z" fill="currentColor"/></svg>'
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            url: '',
            width: 'auto',
            height: 'auto',
            alignment: 'left',
            fieldName: 'image field',
            placeholderText: 'Upload Image',
            mandatory: false,

        };
        this.wrapper = null;
        this.imageInput = null;
        this.editButton = null;
        this.placeholder = null;
        this.inputid = null;

    }

    render() {
        const selectElement = document.getElementById('ClientSelect');
        const selectedRole = selectElement.value;
        this.data.selectedIndex = this.data.selectedIndex ? this.data.selectedIndex : selectElement.selectedIndex;
        this.inputid = document.getElementById(roleList[this.data.selectedIndex]?.inputid);
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'image-block';

        this.wrapper.style.padding = "1em 0";
        this.data.role = this.data.role ? this.data.role : selectedRole

        this.imageInput = document.createElement('input');
        this.imageInput.type = 'file';
        this.imageInput.accept = 'image/*';
        this.imageInput.style.display = 'none';

        this.imageInput.onchange = (event) => {
            const file = event.target.files[0];
            const reader = new FileReader();

            reader.onload = (e) => {
                this.data.url = e.target.result;
                this.renderImage();
            };

            reader.readAsDataURL(file);
        };

        this.placeholder = document.createElement('div');
        this.placeholder.style.width = this.data.width + "%";
        const percentageNumber = parseFloat(this.data.height);
        const decimalValue = percentageNumber / 100;
        this.placeholder.style.height = (decimalValue * window.eHeight) + 'px';
        this.placeholder.style.backgroundColor = '#e0e0e0';
        this.placeholder.style.display = 'flex';
        this.placeholder.style.alignItems = 'center';
        this.placeholder.style.justifyContent = 'center';
        this.placeholder.style.cursor = 'pointer';
        this.placeholder.style.textAlign = 'center';
        this.placeholder.innerHTML = this.data.placeholderText || 'Upload Image';
        this.placeholder.style.color = '#999';
        this.placeholder.style.fontSize = 'medium';
        this.placeholder.style.fontStyle = 'italic';
        this.placeholder.setAttribute('role', this.data.role);
        this.placeholder.style.wordBreak = 'break-word';


        this.placeholder.onclick = () => this.imageInput.click();


        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';
        this.editButton.style.display = 'none';
        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.backgroundColor = 'transparent';
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.transition = 'opacity 0.3s';
        this.editButton.style.zIndex = '100';
        this.editButton.style.outline = 'none';
        this.editButton.onclick = () => this.openEditModal();

        this.wrapper.appendChild(this.editButton);

        this.wrapper.appendChild(this.placeholder);

        this.renderImage();

        this.wrapper.onmouseover = () => {
            this.editButton.style.display = 'block';
        };
        this.wrapper.onmouseout = () => {
            this.editButton.style.display = 'none';
        };

        if (this.inputid) {
            this.inputid.addEventListener('input', (event) => {
                usedLabels.delete(this.data.fieldName + "_" + this.data.role);
                this.data.role = event.target.value;
                this.placeholder.setAttribute('role', this.data.role);
                usedLabels.add(this.data.fieldName + "_" + this.data.role);
            });

        }

        usedLabels.add(this.data.fieldName + "_" + this.data.role);



        return this.wrapper;
    }

    renderImage() {
        if (this.data.url) {

            const img = document.createElement('img');
            img.src = this.data.url;
            img.style.maxWidth = '100%';
            img.style.width = this.data.width + "%";
            const percentageNumber = parseFloat(this.data.height);
            const decimalValue = percentageNumber / 100;
            img.style.height = (decimalValue * window.eHeight) + 'px';
            this.wrapper.innerHTML = '';
            img.onclick = () => this.imageInput.click();
            img.setAttribute('role', this.data.role);
            this.wrapper.appendChild(this.editButton);
            this.wrapper.appendChild(img);
            this.imgelement = img;

            switch (this.data.alignment) {
                case 'left':
                    img.style.margin = '0';
                    break;
                case 'center':
                    img.style.display = 'block';
                    img.style.margin = '0 auto';
                    break;
                case 'right':
                    img.style.display = 'block';
                    img.style.margin = '0 0 0 auto';
                    break;
            }
        }
        else {
            switch (this.data.alignment) {
                case 'left':
                    this.placeholder.style.margin = '0';
                    break;
                case 'center':

                    this.placeholder.style.margin = '0 auto';
                    break;
                case 'right':
                    this.placeholder.style.margin = '0 0 0 auto';
                    break;
            }

        }
    }

    save(blockContent) {
        // if (this.imgelement) {
        // const height = parseFloat(window.getComputedStyle(this.imgelement).height);
        //     this.data.height = (height / window.eHeight) * 100;
        // }


        return this.data;
    }


    destroy() {
        const labelToRemove = this.data.fieldName + "_" + this.data.role;


        if (usedLabels.has(labelToRemove)) {
            usedLabels.delete(labelToRemove);
        }
    }

    openEditModal() {
        const imageHeightInput = document.getElementById('imageHeightInput');
        const imageWidthInput = document.getElementById('imageWidthInput');
        const imageAlignmentSelect = document.getElementById('imageAlignmentSelect');
        const imageFieldNameInput = document.getElementById('imageFieldNameInput');
        const imagePlaceholderInput = document.getElementById('imagePlaceholderInput');
        const previewImage = document.getElementById('previewImage');
        const previewPlaceholder = document.getElementById('previewPlaceholder');
        const labelImageError = document.getElementById('labelImageError');
        labelImageError.classList.add('d-none');
        const labelImageHeight = document.getElementById('labelImageHeight');
        labelImageHeight.classList.add('d-none');

        const mandatoryCheckboxImage = document.getElementById('mandatoryCheckboxImage');
        mandatoryCheckboxImage.checked = this.data.mandatory;
        mandatoryCheckboxImage.addEventListener('change', () => {
            this.data.mandatory = mandatoryCheckboxImage.checked;
        });

        imageHeightInput.value = parseFloat(this.data.height) + 10;
        imageWidthInput.value = this.data.width;
        imageAlignmentSelect.value = this.data.alignment;
        imageFieldNameInput.value = this.data.fieldName;
        imagePlaceholderInput.value = this.data.placeholderText;
        previewImage.src = this.data.url;
        const pn = parseFloat(this.data.height) / 100;
        previewImage.style.height = (pn * window.eHeight) + "px";
        previewImage.style.width = this.data.width + "%";
        previewPlaceholder.style.width = this.data.width + "%";
        previewPlaceholder.style.height = (pn * window.eHeight) + "px";

        const updateImagePreview = () => {
            const pn = (parseFloat(imageHeightInput.value) - 10) / 100;
            previewImage.style.height = (pn * window.eHeight) + "px";
            previewImage.style.width = imageWidthInput.value + "%";
            previewPlaceholder.style.height = (pn * window.eHeight) + "px";
            previewPlaceholder.style.width = imageWidthInput.value + "%";
            previewPlaceholder.innerHTML = imagePlaceholderInput.value;

            switch (imageAlignmentSelect.value) {
                case 'left':
                    previewImage.style.margin = '0';
                    previewPlaceholder.style.margin = '0';
                    break;
                case 'center':
                    previewImage.style.display = 'block';

                    previewImage.style.margin = '0 auto';
                    previewPlaceholder.style.margin = '0 auto';
                    break;
                case 'right':
                    previewImage.style.display = 'block';
                    previewImage.style.margin = '0 0 0 auto';
                    previewPlaceholder.style.margin = '0 0 0 auto';
                    break;
            }
            if (this.data.url) {
                previewImage.src = this.data.url;
                previewImage.style.display = 'block';
                previewPlaceholder.style.display = 'none';
            } else {
                previewImage.style.display = 'none';
                previewPlaceholder.style.display = 'flex';
            }
        };

        imageHeightInput.addEventListener('input', updateImagePreview);
        imageWidthInput.addEventListener('input', updateImagePreview);
        imageAlignmentSelect.addEventListener('change', updateImagePreview);
        imagePlaceholderInput.addEventListener('input', updateImagePreview);
        updateImagePreview();

        const saveButton = document.getElementById('saveImageData');
        saveButton.onclick = () => {
            const newLabel = imageFieldNameInput.value + "_" + this.data.role;
            if (usedLabels.has(newLabel) && newLabel !== this.data.fieldName + "_" + this.data.role) {
                labelImageError.innerText = "Dublicate Field Name";
                labelImageError.classList.remove('d-none');
                return;
            }
            else {
                labelImageError.classList.add('d-none');
            }

            if (parseFloat(imageHeightInput.value) < 15 || parseFloat(imageHeightInput.value) > 100 || imageHeightInput.value == "") {

                labelImageHeight.classList.remove('d-none');
                return;

            }
            else {
                labelImageHeight.classList.add('d-none');
            }



            if (imageFieldNameInput.value === "") {
                labelImageError.innerText = "Field Name can't be Empty";
                labelImageError.classList.remove('d-none');
                return;
            }
            else {
                labelImageError.classList.add('d-none');
            }


            usedLabels.delete(this.data.fieldName + "_" + this.data.role);
            usedLabels.add(newLabel);
            this.data.height = parseFloat(imageHeightInput.value) - 10;
            this.data.width = imageWidthInput.value;
            this.data.alignment = imageAlignmentSelect.value;
            this.data.fieldName = imageFieldNameInput.value;
            this.data.placeholderText = imagePlaceholderInput.value;
            this.placeholder.innerHTML = imagePlaceholderInput.value;
            const percentageNumber = parseFloat(this.data.height);
            const decimalValue = percentageNumber / 100;
            this.placeholder.style.height = (decimalValue * window.eHeight) + 'px';
            this.placeholder.style.width = this.data.width + "%";
            this.renderImage();
            $('#editImageModal').modal('hide');
        };
        const deletebutton = document.getElementById('deleteinputblock')
        deletebutton.onclick = () => {
            const index = this.api.blocks.getCurrentBlockIndex()
            this.api.blocks.delete(index)
            $('#editInputModal').modal('hide');

        };

        $('#editImageModal').modal('show');
    }
}

class TextAreaBlock {
    static get toolbox() {
        return {
            title: 'Input',
            icon: '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg" fill="#000000"><circle cx="8.5" cy="7.5" r="6.5" fill="#000000"/></svg>',
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            labelTextInput: 'Label',
            value: '',
            labelPosition: 'top',
            inputwidth: '50',
            inputSize: '16px',
            inputplaceholder: 'Enter text',
            textwidth: '50%',
            textSize: '16px',
            textplaceholder: 'Enter text',
            textareaHeight: 'auto',
            mandatory: false,
        };
        this.wrapper = null;
        this.labelInput = null;
        this.inputElement = null;
        this.editButton = null;
        this.inputid = null;

    }

    render() {
        const selectElement = document.getElementById('ClientSelect');
        const selectedRole = selectElement.value;
        this.data.selectedIndex = this.data.selectedIndex ? this.data.selectedIndex : selectElement.selectedIndex;
        this.inputid = document.getElementById(roleList[this.data.selectedIndex]?.inputid);
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'd-flex align-items-center';
        this.wrapper.style.position = 'relative';
        this.wrapper.style.padding = "1em 0";
        this.data.role = this.data.role ? this.data.role : selectedRole

        const labeldiv = document.createElement('div')
        labeldiv.className = 'd-flex align-items-center';
        labeldiv.style.gap = '0px';
        labeldiv.style.padding = '0px';
        labeldiv.style.margin = '0px';

        this.labelInput = document.createElement('label');
        this.labelInput.className = 'input-block-label';
        this.labelInput.textContent = this.data.labelTextInput;
        this.labelInput.style.width = "auto";
        this.labelInput.style.marginRight = "10px";
        this.labelInput.style.whiteSpace = 'nowrap';
        this.labelInput.style.fontSize = this.data.textSize;
        this.labelInput.style.flexGrow = '0';
        this.labelInput.style.padding = '0.4em 0';
        this.labelInput.style.lineHeight = '1.2';

        this.asterisk = document.createElement('span');
        this.asterisk.textContent = '*';
        this.asterisk.style.color = 'red';
        this.asterisk.style.fontSize = this.data.textSize;
        const textSizeValue = parseInt(this.data.textSize, 10);
        this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'd-flex';
        inputWrapper.style.width = '100%';

        this.inputElement = document.createElement('textarea');
        this.inputElement.className = 'form-control mr-2';
        this.inputElement.placeholder = this.data.inputplaceholder;
        this.inputElement.value = this.data.value;
        this.inputElement.style.width = this.data.inputwidth + "%";
        this.inputElement.style.fontSize = this.data.inputSize;
        this.inputElement.style.lineHeight = '1.2';
        this.inputElement.style.resize = 'none';
        this.inputElement.setAttribute('role', this.data.role);
        const scale = (766.29) / window.eHeight;

        this.inputElement.style.height = (window.eHeight * 0.20) + 'px';




        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';
        this.editButton.style.display = 'none';
        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.backgroundColor = 'transparent';
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.transition = 'opacity 0.3s';
        this.editButton.style.zIndex = '100';
        this.editButton.style.outline = 'none';

        this.editButton.onclick = () => this.openEditModal();

        labeldiv.appendChild(this.labelInput);
        labeldiv.appendChild(this.asterisk);
        // this.wrapper.appendChild(this.labelInput);

        this.wrapper.appendChild(labeldiv);
        inputWrapper.appendChild(this.inputElement);
        inputWrapper.appendChild(this.editButton);


        this.wrapper.appendChild(inputWrapper);

        if (this.data.mandatory) {
            this.labelInput.style.marginRight = "0px";
            this.asterisk.style.marginRight = "10px";
            this.asterisk.style.display = "unset";
        } else {
            this.asterisk.style.display = "none";
        }

        this.applyLabelPosition();
        this.applyStyles();

        this.wrapper.onmouseover = () => {
            this.editButton.style.display = 'block';
        };
        this.wrapper.onmouseout = () => {
            this.editButton.style.display = 'none';
        };

        if (this.inputid) {
            this.inputid.addEventListener('input', (event) => {
                usedLabels.delete(this.data.fieldName + "_" + this.data.role);
                this.data.role = event.target.value;
                this.inputElement.setAttribute('role', this.data.role);
                usedLabels.add(this.data.fieldName + "_" + this.data.role);
            });

        }

        return this.wrapper;
    }

    save(blockContent) {
        return {
            label: this.labelInput.value,
            value: this.inputElement.value,
            labelPosition: this.data.labelPosition,
            labelfamily: this.data.labelfamily,
            inputfamily: this.data.inputfamily,
            labelTextInput: this.data.labelTextInput,
            inputwidth: this.data.inputwidth,
            inputSize: this.data.inputSize,
            inputplaceholder: this.data.inputplaceholder,
            textwidth: this.data.textwidth,
            textSize: this.data.textSize,
            textplaceholder: this.data.textplaceholder,
            textareaHeight: this.data.textareaHeight,
            labelBold: this.data.labelBold,
            labelItalic: this.data.labelItalic,
            fieldName: this.data.fieldName,
            role: this.data.role,
            selectedIndex: this.data.selectedIndex,
            mandatory: this.data.mandatory
        };
    }

    destroy() {
        const labelToRemove = this.data.fieldName + "_" + this.data.role;


        if (usedLabels.has(labelToRemove)) {
            usedLabels.delete(labelToRemove);
        }
    }

    openEditModal() {
        const labelPositionSelect = document.getElementById('talabelPositionSelect');
        const labelfamilyselect = document.getElementById('talabelfamilyselect');
        const inputfamilyselect = document.getElementById('tafamilyselect');
        const boldButton = document.getElementById('taboldButton');
        const italicButton = document.getElementById('taitalicButton');
        const labelInputError = document.getElementById('labelTaError')
        labelInputError.classList.add('d-none');

        const mandatoryCheckboxTextarea = document.getElementById('mandatoryCheckboxTextarea');
        mandatoryCheckboxTextarea.checked = this.data.mandatory;
        mandatoryCheckboxTextarea.addEventListener('change', () => {
            this.data.mandatory = mandatoryCheckboxTextarea.checked;
            updatePreview();
        });
        // if (this.data.labelBold !== 'bold') {
        //     if (boldButton.classList.contains('btn-primary')) {
        //         boldButton.classList.remove('btn-primary');
        //     }
        // }
        // if (this.data.labelItalic !== 'italic') {
        //     if (italicButton.classList.contains('btn-primary')) {
        //         italicButton.classList.remove('btn-primary');
        //     }
        // }
        boldButton.classList.toggle('btn-primary', this.data.labelBold === 'bold');
        italicButton.classList.toggle('btn-primary', this.data.labelItalic === 'bold');

        const labelTextInput = document.getElementById('talabelTextInput');
        const tafieldName = document.getElementById('tafieldName');
        const inputWidth = document.getElementById('taWidth');
        const inputFontSize = document.getElementById('taFontSize');
        const inputPlaceholder = document.getElementById('taPlaceholder');

        const textWidth = document.getElementById('tatextWidth');
        const textSize = document.getElementById('tatextFontSize');
        const textPlaceholder = document.getElementById('tatextPlaceholder');

        const previewContainer = document.getElementById('tapreviewContainer');

        labelPositionSelect.value = this.data.labelPosition;
        labelfamilyselect.value = this.data.labelfamily;
        inputfamilyselect.value = this.data.inputfamily;

        labelTextInput.textContent = this.data.labelTextInput;
        inputWidth.value = this.data.inputwidth;
        labelTextInput.value = this.data.labelTextInput;
        tafieldName.value = this.data.fieldName;
        inputFontSize.value = this.data.inputSize;
        inputPlaceholder.value = this.data.inputplaceholder;

        textWidth.value = this.data.textwidth;
        textSize.value = this.data.textSize;
        textPlaceholder.value = this.data.textplaceholder;

        const updatePreview = () => {
            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'd-flex align-items-center';

            const previewLabelInput = document.createElement('label');
            previewLabelInput.className = 'input-block-label';
            previewLabelInput.placeholder = textPlaceholder.value;
            previewLabelInput.textContent = labelTextInput.value;
            previewLabelInput.style.fontSize = textSize.value;
            previewLabelInput.style.fontWeight = boldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            previewLabelInput.style.fontStyle = italicButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            previewLabelInput.style.width = "auto";
            previewLabelInput.style.marginRight = "5px";
            previewLabelInput.style.whiteSpace = 'nowrap';
            previewLabelInput.style.padding = '0.4em 0px';
            previewLabelInput.style.lineHeight = '1.2';
            previewLabelInput.style.fontFamily = labelfamilyselect.value;

            if (this.data.mandatory) {

                previewLabelInput.innerHTML += ' <span style="color: red;">*</span>';

            }


            const previewInputElement = document.createElement('textarea');
            previewInputElement.className = 'form-control mr-2';
            previewInputElement.placeholder = inputPlaceholder.value;
            previewInputElement.value = this.data.value;
            previewInputElement.style.width = inputWidth.value + "%";
            previewInputElement.style.fontSize = inputFontSize.value;
            previewInputElement.style.fontFamily = inputfamilyselect.value;
            previewInputElement.style.lineHeight = '1.2';
            previewInputElement.style.resize = 'none';

            previewWrapper.appendChild(previewLabelInput);

            const previewInputWrapper = document.createElement('div');
            previewInputWrapper.className = 'd-flex';
            previewInputWrapper.style.width = '100%';
            previewInputWrapper.appendChild(previewInputElement);

            previewWrapper.appendChild(previewInputWrapper);

            if (labelPositionSelect.value === 'top') {
                previewWrapper.classList.add('flex-column');
                previewWrapper.classList.remove('align-items-center');
                previewLabelInput.style.marginBottom = '0.4em';
            } else {
                previewWrapper.classList.remove('flex-column');
            }


            previewContainer.innerHTML = '';
            previewContainer.appendChild(previewWrapper);
        };

        updatePreview();

        boldButton.onclick = () => {
            boldButton.classList.toggle('btn-primary');
            updatePreview();
        };

        italicButton.onclick = () => {
            italicButton.classList.toggle('btn-primary');
            updatePreview();
        };

        labelPositionSelect.addEventListener('change', updatePreview);
        labelfamilyselect.addEventListener("change", updatePreview);
        inputfamilyselect.addEventListener("change", updatePreview);

        document.querySelectorAll('#editTextAreaModal input').forEach(input => {
            input.addEventListener('input', updatePreview);
        });

        $('#editTextAreaModal').modal('show');

        const saveButton = document.getElementById('tasaveLabelPositionButton');
        saveButton.onclick = () => {
            const newLabel = tafieldName.value + "_" + this.data.role;
            if (usedLabels.has(newLabel) && newLabel !== this.data.fieldName + "_" + this.data.role) {
                labelInputError.innerText = "Dublicate Field Name";
                labelInputError.classList.remove('d-none');
                return;
            }
            else {
                labelInputError.classList.add('d-none');
            }

            if (tafieldName.value === "") {
                labelInputError.innerText = "Field Name can't be Empty";
                labelInputError.classList.remove('d-none');
                return;
            }
            else {
                labelInputError.classList.add('d-none');
            }

            if (this.data.mandatory) {
                this.labelInput.style.marginRight = "0px";
                this.asterisk.style.marginRight = "10px";
                this.asterisk.style.display = "unset";
            } else {

                this.labelInput.style.marginRight = "10px";
                this.asterisk.style.display = "none";
            }


            usedLabels.delete(this.data.fieldName + "_" + this.data.role);
            usedLabels.add(newLabel);
            this.data.labelPosition = labelPositionSelect.value;
            this.data.labelfamily = labelfamilyselect.value;
            this.data.inputfamily = inputfamilyselect.value;
            this.data.labelTextInput = labelTextInput.value;
            this.data.fieldName = tafieldName.value;
            this.data.inputwidth = inputWidth.value;
            this.data.inputSize = inputFontSize.value;
            this.data.inputplaceholder = inputPlaceholder.value;
            this.data.textwidth = textWidth.value;
            this.data.textSize = textSize.value;
            this.data.textplaceholder = textPlaceholder.value;
            this.data.labelBold = boldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            this.data.labelItalic = italicButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            this.applyLabelPosition();
            this.applyStyles();
            $('#editTextAreaModal').modal('hide');
        };
        const deletebutton = document.getElementById('deletetextareablock')
        deletebutton.onclick = () => {
            const index = this.api.blocks.getCurrentBlockIndex()
            this.api.blocks.delete(index)
            $('#editInputModal').modal('hide');

        };
    }


    applyLabelPosition() {
        if (this.data.labelPosition === 'top') {
            this.wrapper.classList.add('flex-column');
            this.wrapper.classList.remove('align-items-center');
            this.labelInput.style.padding = "0.4em 0";
            this.labelInput.style.marginBottom = '0.4em';
        } else {
            this.wrapper.classList.remove('flex-column');
            this.wrapper.classList.add('align-items-center');
        }
    }

    applyStyles() {
        this.inputElement.style.width = this.data.inputwidth + "%";
        this.inputElement.style.fontSize = this.data.inputSize;
        this.inputElement.style.fontFamily = this.data.inputfamily;
        this.inputElement.placeholder = this.data.inputplaceholder;
        this.labelInput.style.fontSize = this.data.textSize;
        const textSizeValue = parseInt(this.data.textSize, 10);
        this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;
        this.labelInput.style.fontFamily = this.data.labelfamily;
        this.labelInput.textContent = this.data.labelTextInput;
        this.labelInput.style.fontWeight = this.data.labelBold;
        this.labelInput.style.fontStyle = this.data.labelItalic;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    $('#networkOverlay').hide();
    $('#digitalforms').addClass('active');
    document.getElementById('add-page-btn').addEventListener('click', () => {

        createEditorInstance();
    });

    document.getElementById('delete-page-btn').addEventListener('click', deleteActivePage);

    await createEditorInstance();

});

var clientSelect = document.getElementById("ClientSelect");

clientSelect.addEventListener("change", function () {

    const selectedIndex = clientSelect.selectedIndex;
    if (selectedIndex > 1) {


        document.getElementById('secondrole').style.display = 'block';
        document.getElementById('singlerole').style.display = 'none';


    } else {

        document.getElementById('secondrole').style.display = 'none';
        document.getElementById('singlerole').style.display = 'block';
    }
});

// document.addEventListener('paste', (event) => {
//        event.preventDefault()
//        const selection = window.getSelection();
//        const anchorNode = selection?.anchorNode;

//        if (!anchorNode) {
//            return;
//        }

//        // const paragraphBlock =anchorNode.parentElement.closest('.paragraph-block');

//        // if (!paragraphBlock) {
//        //     return; // Exit if the selection is not within a paragraph block
//        // }


//        event.preventDefault();


//        const pastedContent = event.clipboardData.getData('text/plain');


//        const paragraphs = pastedContent.split('\n').filter(paragraph => paragraph.trim() !== '');


//        if (paragraphs.length <= 1) {
//            return
//        }

//        if (editorInstance) {
//            paragraphs.forEach(paragraph => {
//                editorInstance.blocks.insert('paragraph', {
//                    text: paragraph,
//                    fontFamily: 'Arial',
//                    fontSize: '1rem',
//                    textAlign: 'left',
//                    fontWeight: 'normal',
//                    fontStyle: 'normal',
//                });
//            });
//        }
//    });

function createEditorInstance() {
    var pageContainer = document.getElementById('page-container');
    let editorDiv = document.createElement('div');
    let uniqueId = Date.now();
    editorDiv.id = `editor-${uniqueId}`;
    editorDiv.style.width = '96%';
    editorDiv.style.backgroundColor = 'white';
    editorDiv.style.border = '1px solid #ccc';
    editorDiv.style.margin = '2%';
    editorDiv.style.overflow = 'hidden';
    editorDiv.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
    editorDiv.className = "something";
    pageContainer.appendChild(editorDiv);


    let newEditor = new EditorJS({
        holder: editorDiv.id,
        tools: {
            paragraph: ParagraphBlock,
            // fontFamily: { class: FontFamilyInlineTool, inlineToolbar: false },
            // fontSize: { class: FontSizeInlineTool, inlineToolbar: false },
            table: TableBlock,
            header: HeaderBlock,

            check: CheckBoxBlock,
            radio: RadioBlock,
            inputfield: InputBlock,
            select: SelectTool,
            image: ImageBlock,
            button: ButtonBlock,
            onlytext: OnlyTextBlock,
            signature: { class: SignatureBlock, inlineToolbar: true },
            eseal: EsealBlock,
            textarea: TextAreaBlock,
            dummy: dummyBlock
        },
        defaultBlock: 'header',
        onReady: () => {
            new DragDrop(newEditor);
            if (editorInstances.length === 1) {
                setTimeout(() => {
                    newEditor.blocks.insert("paragraph", {}, {}, 0);
                    newEditor.blocks.delete(0);
                }, 100);
                editorInstance = newEditor;

            }

            else if (editorInstances.length > 1) {

                newEditor.blocks.insert("dummy", {}, {}, 1);
                newEditor.blocks.delete(0);




            }


        },
        onChange: (api, event) => {

            checkHeightLimit(editorDiv, newEditor);
        },
    });


    editorDiv.addEventListener('dragover', function (event) {
        event.preventDefault();
        editorInstance = newEditor;

    });

    editorDiv.addEventListener('dragenter', function (event) {
        editorInstance = newEditor;
        isdrag = true;

    });
    editorDiv.addEventListener('dragleave', function (event) {
        isdrag = false;

    });

    editorDiv.addEventListener('drop', function (event) {
        event.preventDefault();
        editorInstance = newEditor;
    });


    editorDiv.addEventListener('click', () => {
        editorInstance = newEditor;

    });
    editorInstances.push(newEditor);
    setheight(editorDiv);
}
function setheight(editorDiv) {
    const pdfcontainer = document.getElementById('page-container');
    const pdfstyle = window.getComputedStyle(pdfcontainer).width;
    const computedStyle = window.getComputedStyle(editorDiv);
    const editorWidth = parseFloat(computedStyle.width);
    window.eWidth = editorWidth
    const aspectRatio = 841.89 / 595.28;
    const editorHeight = 1108.4;
    editorDiv.style.height = editorHeight + 'px';
    editorDiv.style.maxHeight = editorHeight + 'px';
    window.eHeight = editorHeight;
}

function checkHeightLimit(editorDiv, editorInstance) {
    const currentHeight = editorDiv.scrollHeight;

    if (currentHeight > (window.eHeight + 250)) {
        console.log('Page height limit exceeded. Moving blocks to the next page...');
        moveBlocksToNextPage(editorInstance);
    }
}


function moveBlocksToNextPage(currentEditor) {
    currentEditor.save().then(async (outputData) => {

        let nextEditor = await getNextEditor(currentEditor);


        if (!nextEditor) {
            await createEditorInstance();
            nextEditor = editorInstances[editorInstances.length - 1];
            nextEditor.isReady
                .then(() => {


                    const lastBlock = outputData.blocks.pop();


                    currentEditor.render({
                        blocks: outputData.blocks
                    });


                    nextEditor.save().then((nextEditorData) => {
                        if (nextEditorData && nextEditorData.blocks) {
                            nextEditor.render({
                                blocks: [lastBlock, ...nextEditorData.blocks]
                            });
                        } else {
                            console.error("nextEditorData.blocks is undefined");
                        }
                    }).catch((error) => {
                        console.error("Error saving editor data:", error);
                    });



                    const nextEditorDiv = document.getElementById(nextEditor.configuration.holder);
                    const nextEditorHeight = nextEditorDiv.scrollHeight;

                    if (nextEditorHeight > (window.eHeight + 250)) {
                        console.log('Next page height limit exceeded. Moving blocks to a new page...');
                        moveBlocksToNextPage(nextEditor);
                    }


                })
                .catch((error) => {
                    console.error("Error initializing the next editor:", error);
                });
        }

        else {

            const lastBlock = outputData.blocks.pop();


            currentEditor.render({
                blocks: outputData.blocks
            });


            nextEditor.save().then((nextEditorData) => {
                if (nextEditorData && nextEditorData.blocks) {
                    nextEditor.render({
                        blocks: [lastBlock, ...nextEditorData.blocks]
                    });
                } else {
                    console.error("nextEditorData.blocks is undefined");
                }
            }).catch((error) => {
                console.error("Error saving editor data:", error);
            });



            const nextEditorDiv = document.getElementById(nextEditor.configuration.holder);
            const nextEditorHeight = nextEditorDiv.scrollHeight;

            if (nextEditorHeight > (window.eHeight + 250)) {
                console.log('Next page height limit exceeded. Moving blocks to a new page...');
                moveBlocksToNextPage(nextEditor);
            }
        }



    });
}

function getNextEditor(currentEditor) {
    const currentIndex = editorInstances.findIndex(editor => editor === currentEditor);
    return editorInstances[currentIndex + 1] || null;
}


function deleteActivePage() {
    if (!editorInstance) {
        console.log("No active editor to delete.");
        return;
    }
    if (editorInstances.length === 1) {
        swal({
            title: "Info",
            text: "At least one page must remain, deletion is not permitted.",
            type: "error",
        });
        return;
    }


    let editorDiv = document.getElementById(editorInstance.configuration.holder);

    if (editorDiv) {
        const index = editorInstances.indexOf(editorInstance);
        swal({
            title: "Info",
            text: `Do you want to Delete ${index + 1} page?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "OK",
            cancelButtonText: "Cancel",
        }, function (result) {
            if (result) {
                editorDiv.remove();
                if (index > -1) {
                    editorInstances.splice(index, 1);
                    console.log(`Deleted editor instance at index ${index}`);


                    editorInstance.destroy();
                    editorInstance = null;


                    if (editorInstances.length > 0) {
                        editorInstance = editorInstances[editorInstances.length - 1];
                        console.log("New active editor set to the last editor in the list.");
                    }
                }
            } else if (result === false) {
                console.log("Action canceled");
            }
        });




    }
}





function handleOpenTools(isclick = false) {
    if (editorInstance) {
        if (isclick == true) {

            editorInstance.blocks.insert('header', {
                tag: 'h2',
                alignment: 'left',
                text: ''
            }, {}, editorInstance.blocks.getBlocksCount());

        }
        else {
            editorInstance.blocks.insert('header', {
                tag: 'h2',
                alignment: 'left',
                text: ''
            });
        }

    }
}



function handleAddText(isclick = false) {
    if (editorInstance) {
        if (isclick == true) {
            editorInstance.blocks.insert('paragraph', {
                text: 'Paragraph',
                fontFamily: 'Arial',
                fontSize: '1rem',
                textAlign: 'left',
                fontWeight: 'normal',
                fontStyle: 'normal',

            }, {}, editorInstance.blocks.getBlocksCount());
        }
        else {
            editorInstance.blocks.insert('paragraph', {
                text: 'Paragraph',
                fontFamily: 'Arial',
                fontSize: '1rem',
                textAlign: 'left',
                fontWeight: 'normal',
                fontStyle: 'normal',

            });

        }

    }
}

function handleCheckbox(isclick = false) {
    if (editorInstance) {
        if (isclick == true) {
            editorInstance.blocks.insert('check', {
                label: 'Label',
                options: [{ text: 'Option 1', selected: false }],
                labelFamily: 'Times New Roman',
                optionFamily: 'Arial',
                labelBold: 'bold',
                labelItalic: 'normal',
                optionBold: 'normal',
                optionItalic: 'normal',
                labelFontSize: '17px',
                optionsFontSize: '13px',
                optionPosition: 'horizontal',
                labelPosition: 'top',
                fieldName: 'Label',
                mandatory: false,
            }, {}, editorInstance.blocks.getBlocksCount());
        }
        else {
            editorInstance.blocks.insert('check', {
                label: 'Label',
                options: [{ text: 'Option 1', selected: false }],
                labelFamily: 'Times New Roman',
                optionFamily: 'Arial',
                labelBold: 'bold',
                labelItalic: 'normal',
                optionBold: 'normal',
                optionItalic: 'normal',
                labelFontSize: '17px',
                optionsFontSize: '13px',
                optionPosition: 'horizontal',
                labelPosition: 'top',
                fieldName: 'Label',
                mandatory: false,
            });

        }
    }
}

function handleAddRadio(isclick = false) {

    if (editorInstance) {
        if (isclick == true) {
            editorInstance.blocks.insert('radio', {
                label: 'Label',
                options: [{ text: 'Option 1', selected: false }],
                labelFamily: 'Times New Roman',
                optionFamily: 'Arial',
                labelBold: 'bold',
                labelItalic: 'normal',
                optionBold: 'normal',
                optionItalic: 'normal',
                labelFontSize: '17px',
                optionsFontSize: '13px',
                optionPosition: 'horizontal',
                labelPosition: 'top',
                fieldName: 'Label' + radiofieldname,
                mandatory: false,
            }, {}, editorInstance.blocks.getBlocksCount());
        }
        else {
            editorInstance.blocks.insert('radio', {
                label: 'Label',
                options: [{ text: 'Option 1', selected: false }],
                labelFamily: 'Times New Roman',
                optionFamily: 'Arial',
                labelBold: 'bold',
                labelItalic: 'normal',
                optionBold: 'normal',
                optionItalic: 'normal',
                labelFontSize: '17px',
                optionsFontSize: '13px',
                optionPosition: 'horizontal',
                labelPosition: 'top',
                fieldName: 'Label' + radiofieldname,
                mandatory: false,
            });
        }
    }

    radiofieldname += 1;
}

function handleAddTable(isclick = false) {
    if (editorInstance) {
        if (isclick == true) {
            editorInstance.blocks.insert('table', {
                fieldName: 'table',
                rows: 2,
                cols: 2,
                fontFamily: 'Arial',
                fontSize: '15px',
                isBold: false,
                isItalic: false,
                cells: Array(2).fill().map(() => Array(2).fill('')),
                mandatory: false
            }, {}, editorInstance.blocks.getBlocksCount());
        }
        else {
            editorInstance.blocks.insert('table', {
                fieldName: 'table',
                rows: 2,
                cols: 2,
                fontFamily: 'Arial',
                fontSize: '15px',
                isBold: false,
                isItalic: false,
                cells: Array(2).fill().map(() => Array(2).fill('')),
                mandatory: false
            });
        }
    }
}

function handleAddInputBlock(isclick = false) {
    if (editorInstance) {
        if (isclick == true) {
            editorInstance.blocks.insert('inputfield', {
                labelTextInput: 'Label', value: '', labelPosition: 'left', inputwidth: '75', inputSize: '13px', inputplaceholder: 'Enter text', textwidth: '50%', textSize: '17px', textplaceholder: 'Enter text', labelBold: 'bold',
                labelItalic: 'normal', labelfamily: 'Times New Roman', inputfamily: 'Arial', fieldName: 'Label', mandatory: false,
            }, {}, editorInstance.blocks.getBlocksCount())
        }
        else {
            editorInstance.blocks.insert('inputfield', {
                labelTextInput: 'Label', value: '', labelPosition: 'left', inputwidth: '75', inputSize: '13px', inputplaceholder: 'Enter text', textwidth: '50%', textSize: '17px', textplaceholder: 'Enter text', labelBold: 'bold',
                labelItalic: 'normal', labelfamily: 'Times New Roman', inputfamily: 'Arial', fieldName: 'Label', mandatory: false,
            })

        }
    }
}

function handleAddRecommended(labelname, fieldname, isclick = false) {
    const selectElement = document.getElementById('ClientSelect');
    const selectedRole = selectElement.value;

    if (editorInstance) {
        if (isclick == true) {

            editorInstance.blocks.insert('inputfield', {
                labelTextInput: labelname, value: '', labelPosition: 'left', inputwidth: '75', inputSize: '13px', inputplaceholder: 'Enter text', textwidth: '50%', textSize: '17px', textplaceholder: 'Enter text', labelBold: 'bold',
                labelItalic: 'normal', labelfamily: 'Times New Roman', inputfamily: 'Arial', fieldName: fieldname, mandatory: false
            }, {}, editorInstance.blocks.getBlocksCount())
        }
        else {
            editorInstance.blocks.insert('inputfield', {
                labelTextInput: labelname, value: '', labelPosition: 'left', inputwidth: '75', inputSize: '13px', inputplaceholder: 'Enter text', textwidth: '50%', textSize: '17px', textplaceholder: 'Enter text', labelBold: 'bold',
                labelItalic: 'normal', labelfamily: 'Times New Roman', inputfamily: 'Arial', fieldName: fieldname, mandatory: false
            })

        }

    }

}
function handleAddTextArea(isclick = false) {
    if (editorInstance) {
        if (isclick == true) {
            editorInstance.blocks.insert('textarea', {
                labelTextInput: 'Label',
                value: '',
                labelPosition: 'top',
                inputwidth: '100',
                inputSize: '13px',
                inputplaceholder: 'Enter text',
                textwidth: '50',
                textSize: '17px',
                textplaceholder: 'Enter text',
                textareaHeight: 'auto',
                labelBold: 'bold',
                labelItalic: 'normal',
                labelfamily: 'Times New Roman',
                fieldName: 'Label',
                inputfamily: 'Arial',
                mandatory: false
            }, {}, editorInstance.blocks.getBlocksCount())

        }
        else {
            editorInstance.blocks.insert('textarea', {
                labelTextInput: 'Label',
                value: '',
                labelPosition: 'top',
                inputwidth: '100',
                inputSize: '13px',
                inputplaceholder: 'Enter text',
                textwidth: '50',
                textSize: '17px',
                textplaceholder: 'Enter text',
                textareaHeight: 'auto',
                labelBold: 'bold',
                labelItalic: 'normal',
                labelfamily: 'Times New Roman',
                fieldName: 'Label',
                inputfamily: 'Arial',
                mandatory: false
            })
        }
    }

}

function handleAddOnlytext(isclick = false) {
    if (editorInstance) {
        if (isclick == true) {
            editorInstance.blocks.insert('onlytext', {
                value: '',
                inputwidth: '50',
                inputSize: '13px',
                inputplaceholder: 'Enter text',
                inputFontFamily: 'Arial',
                inputFontStyle: 'normal',
                inputFontWeight: 'normal',
                fieldName: 'FieldName',
                mandatory: false
            }, {}, editorInstance.blocks.getBlocksCount())
        }
        else {
            editorInstance.blocks.insert('onlytext', {
                value: '',
                inputwidth: '50',
                inputSize: '13px',
                inputplaceholder: 'Enter text',
                inputFontFamily: 'Arial',
                inputFontStyle: 'normal',
                inputFontWeight: 'normal',
                fieldName: 'FieldName',
                mandatory: false
            })

        }
    }
}

function handleAddButton() {
    if (editorInstance) {
        editorInstance.blocks.insert('button', {
            buttonText: 'Button',
            buttonWidth: '100px',
            buttonFontSize: '16px',
            buttonFontFamily: 'Arial',
            buttonAction: 'submit',
            buttonBold: 'normal',
            buttonItalic: 'normal',
            buttonBackgroundColor: '#007bff',
            buttonBorderColor: '#007bff',
        }, {}, editorInstance.blocks.getBlocksCount())
    }
}



function handleAddSelect(isclick = false) {
    if (editorInstance) {
        if (isclick == true) {
            editorInstance.blocks.insert('select', {
                label: 'Dropdown Label',
                options: [{ 'value': 'Option 1' }],
                selected: '',
                labelPosition: 'left',
                labelfamily: 'Times New Roman',
                labelSize: '17px',
                labelBold: 'bold',
                labelItalic: 'normal',
                optionFamily: 'Arial',
                optionSize: '13px',
                optionBold: 'normal',
                optionItalic: 'normal',
                selectWidth: '100',
                fieldName: 'Dropdown Label',
                mandatory: false,
            }, {}, editorInstance.blocks.getBlocksCount());
        }
        else {
            editorInstance.blocks.insert('select', {
                label: 'Dropdown Label',
                options: [{ 'value': 'Option 1' }],
                selected: '',
                labelPosition: 'left',
                labelfamily: 'Times New Roman',
                labelSize: '17px',
                labelBold: 'bold',
                labelItalic: 'normal',
                optionFamily: 'Arial',
                optionSize: '13px',
                optionBold: 'normal',
                optionItalic: 'normal',
                selectWidth: '100',
                fieldName: 'Dropdown Label',
                mandatory: false,
            });

        }

    }
}

function handleAddimage(fieldname, isclick = false) {


    if (editorInstance) {
        if (isclick == true) {
            editorInstance.blocks.insert('image', {
                url: '',
                width: '30',
                height: '15',
                alignment: 'left',
                fieldName: fieldname,
                placeholderText: 'Upload Image',
                mandatory: false,
            }, {}, editorInstance.blocks.getBlocksCount());
        }
        else {
            editorInstance.blocks.insert('image', {
                url: '',
                width: '30',
                height: '15',
                alignment: 'left',
                fieldName: fieldname,
                placeholderText: 'Upload Image',
                mandatory: false,
            });
        }
    }



}

function handleSignature(isclick = false) {
    const selectElement = document.getElementById('ClientSelect');
    const selectedRole = selectElement.value;
    if (document.getElementById(`Signature_${selectedRole}`)) {
        swal({
            title: "Info",
            text: "More than one Signature not allowed",
            type: "error",
        });
    }
    else {
        if (editorInstance) {
            if (isclick == true) {
                editorInstance.blocks.insert('signature', {
                    content: 'Signature',
                    width: '15%',
                    height: 'auto',
                    alignment: 'left',
                    fieldName: 'input field'
                }, {}, editorInstance.blocks.getBlocksCount());
            }
            else {
                editorInstance.blocks.insert('signature', {
                    content: 'Signature',
                    width: '15%',
                    height: 'auto',
                    alignment: 'left',
                    fieldName: 'input field'
                });
            }
        }

    }

}

function handleEseal(isclick = false) {
    const selectElement = document.getElementById('ClientSelect');
    const selectedRole = selectElement.value;
    if (document.getElementById(`Eseal_${selectedRole}`)) {
        swal({
            title: "Info",
            text: "More than one Eseal not allowed",
            type: "error",
        });
    }
    else {
        if (editorInstance) {
            if (isclick == true) {
                editorInstance.blocks.insert('eseal', {
                    content: 'Eseal',
                    width: '15%',
                    height: 'auto',
                    alignment: 'left',
                    fieldName: 'input field'
                }, {}, editorInstance.blocks.getBlocksCount());
            }
            else {
                editorInstance.blocks.insert('eseal', {
                    content: 'Eseal',
                    width: '15%',
                    height: 'auto',
                    alignment: 'left',
                    fieldName: 'input field'
                });
            }
        }
    }

}







const headerid = document.querySelector('#headerid');
headerid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
headerid.addEventListener('dragend',
    (event) => {

        const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


        if (elementUnderCursor && elementUnderCursor.closest('.something')) {
            handleOpenTools();
        }
    });

const checkboxid = document.querySelector('#checkboxid');
checkboxid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
checkboxid.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);
    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleCheckbox();
    }
});

const textid = document.querySelector('#textid');
textid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
textid.addEventListener('dragend',
    (event) => {

        const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


        if (elementUnderCursor && elementUnderCursor.closest('.something')) {
            handleAddText();
        }
    }
);

const radioid = document.querySelector('#radioid');
radioid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
radioid.addEventListener('dragend',
    (event) => {

        const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


        if (elementUnderCursor && elementUnderCursor.closest('.something')) {
            handleAddRadio();
        }
    }
);


const tableid = document.querySelector('#tableid');
tableid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
tableid.addEventListener('dragend',
    (event) => {

        const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


        if (elementUnderCursor && elementUnderCursor.closest('.something')) {
            handleAddTable();
        }
    });



const fieldid = document.querySelector('#fieldid');
fieldid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
// fieldid.addEventListener('dragend', handleAddInputBlock);

fieldid.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleAddInputBlock();
    }
});


const rfullname = document.querySelector('#rfullname');
rfullname.addEventListener('dragover', function (event) {
    event.preventDefault();
})
rfullname.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleAddRecommended("Full Name", "Full Name");
    }
}

);

const rgender = document.querySelector('#rgender');
rgender.addEventListener('dragover', function (event) {
    event.preventDefault();
})
rgender.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleAddRecommended("Gender", "Gender");
    }
});

const remail = document.querySelector('#remail');
remail.addEventListener('dragover', function (event) {
    event.preventDefault();
})
remail.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleAddRecommended("Email", "email")
    }
});

const rdate = document.querySelector('#rdate');
rdate.addEventListener('dragover', function (event) {
    event.preventDefault();
})
rdate.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleAddRecommended("Date of Birth", "Date of Birth");
    }
});

const rphonenumber = document.querySelector('#rphone');
rphonenumber.addEventListener('dragover', function (event) {
    event.preventDefault();
})
rphonenumber.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleAddRecommended("Phone Number", "Phone Number")
    }
});

const rfname = document.querySelector('#rfname');
rfname.addEventListener('dragover', function (event) {
    event.preventDefault();
})
rfname.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleAddRecommended("First Name", "firstname");
    }
});

const rlastname = document.querySelector('#rLastName');
rlastname.addEventListener('dragover', function (event) {
    event.preventDefault();
})
rlastname.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleAddRecommended("Last Name", "lastname");
    }
});

const rnation = document.querySelector('#rNation');
rnation.addEventListener('dragover', function (event) {
    event.preventDefault();
})
rnation.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleAddRecommended("Nation", "Nation");
    }
});



const textareaid = document.querySelector('#textareaid');
textareaid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
textareaid.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleAddTextArea();
    }
});

const selectid = document.querySelector('#selectid');
selectid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
selectid.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleAddSelect();
    }
});

const onlytextid = document.querySelector('#onlytextid');
onlytextid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
onlytextid.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleAddOnlytext();
    }
});

const buttonid = document.querySelector('#buttonid');
buttonid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
buttonid.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleAddButton();
    }
});

const imageid = document.querySelector('#imageid');
imageid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
imageid.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleAddimage('image field');

    }
});

const rSelfie = document.querySelector('#rSelfie');
rSelfie.addEventListener('dragover', function (event) {
    event.preventDefault();
});
rSelfie.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleAddimage('Selfie');

    }
});

const signatureid = document.querySelector('#signatureid')
signatureid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
signatureid.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleSignature();
    }
});

const esealid = document.querySelector('#esealid')
esealid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
esealid.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleEseal();
    }
});

const signatureid1 = document.querySelector('#signatureid1')
signatureid1.addEventListener('dragover', function (event) {
    event.preventDefault();
});
signatureid1.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleSignature();
    }
});

const esealid1 = document.querySelector('#esealid1')
esealid1.addEventListener('dragover', function (event) {
    event.preventDefault();
});
esealid1.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleEseal();
    }
});

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
    let missingroles = [];
    let duplicateCheck = new Set();
    let isValid = true;

    roleList.forEach((role, index) => {

        if (!role.name) {
            swal("Info", `Role name is empty`, "info");
            isValid = false;
            return;
        }

        // Check for duplicates
        if (duplicateCheck.has(role.name)) {
            swal("Info", `Duplicate role name found: ${role.name}. Please ensure unique role names`, "info");
            isValid = false;
            return;
        }
        duplicateCheck.add(role.name);

        if (index !== 0) {
            var signaturediv = document.getElementById(`Signature_${role.name}`);
            if (!signaturediv) {
                missingroles.push(role.name);
            }
        }
    });
    if (!isValid) {
        return;
    }

    if (missingroles.length > 0) {

        swal({

            title: "Info",
            text:
                `Signature annotations are missing for ${missingroles
                    .map(role => `${role}`)
                    .join(', ')}.`,
            type: "info",
        });
    }
    else if (((document.getElementById("tempName").value).replace(/\s+/g, '')).length > 40) {
        swal({
            title: "Info",
            text: "Form name must not exceed 40 characters",
            type: "error",
        });
    }

    else if ((document.getElementById("tempName").value).replace(/\s+/g, '') !== '' && ((document.getElementById("daysToComplete").value).toString()).replace(/\s+/g, '') !== '') {


        const editors = document.querySelectorAll('div[id^="editor-"]');


        const editordiv = editors[0].getBoundingClientRect();
        scaleX = 595.28 / editordiv.width;
        scaleY = 841.89 / editordiv.height;
        roleList.forEach((role, index) => {
            if (index !== 0) {
                var rolejson = { "roleId": "", "email": "", "role": role, "annotationsList": [], "placeHolderCoordinates": { "pageNumber": "", "signatureXaxis": "", "signatureYaxis": "" }, "esealplaceHolderCoordinates": {} };
                rolesConfig.push(rolejson);
            }
        })
        editors.forEach((editor, pageIndex) => {

            roleList.forEach((role, index) => {


                const matchingElements = editor.querySelectorAll(`[role="${role.name}"]`);

                if (matchingElements.length !== 0 && index !== 0) {
                    const matchingObject = rolesConfig.find(obj => obj.role.name === role.name);


                    matchingElements.forEach(element => {



                        if (element.id === `Signature_${role.name}`) {

                            const computedStyle = window.getComputedStyle(editor)
                            const marginLeft = computedStyle.marginLeft;
                            const marginTop = computedStyle.marginTop;
                            const parentrect = editor.getBoundingClientRect();
                            const childrect = element.getBoundingClientRect();
                            signatureX = (childrect.left - parentrect.left - parseFloat(marginLeft)) * scaleX;
                            signatureY = (childrect.top - parentrect.top + 37.8) * scaleY;
                            signaturewidth = childrect.width * scaleX;
                            signatureheight = childrect.height * scaleY;

                            matchingObject.placeHolderCoordinates.signatureXaxis = signatureX;
                            matchingObject.placeHolderCoordinates.signatureYaxis = signatureY;
                            matchingObject.placeHolderCoordinates.signaturewidth = signaturewidth;
                            matchingObject.placeHolderCoordinates.signatureheight = signatureheight;
                            matchingObject.placeHolderCoordinates.pageNumber = pageIndex + 1;

                            pdfAnnotations.push({
                                type: 'Signature',
                                x: (signatureX / 595.28) * 100,
                                y: (signatureY / 841.89) * 100,
                                width: (signaturewidth / 595.28) * 100,
                                height: (signatureheight / 841.89) * 100,
                                page: pageIndex + 1,
                                role: element.getAttribute('role')
                            });


                        }
                        else if (element.id === `Eseal_${role.name}`) {
                            isesealpresent = true;
                            const computedStyle = window.getComputedStyle(editor)
                            const marginLeft = computedStyle.marginLeft;
                            const marginTop = computedStyle.marginTop;
                            const parentrect = editor.getBoundingClientRect();
                            const childrect = element.getBoundingClientRect();
                            esealX = (childrect.left - parentrect.left - parseFloat(marginLeft)) * scaleX;
                            esealY = (childrect.top - parentrect.top + 37.8) * scaleY;
                            esealwidth = childrect.width * scaleX;
                            esealheight = childrect.height * scaleY;


                            matchingObject.esealplaceHolderCoordinates.signatureXaxis = esealX;
                            matchingObject.esealplaceHolderCoordinates.signatureYaxis = esealY;
                            matchingObject.esealplaceHolderCoordinates.pageNumber = pageIndex + 1;
                            matchingObject.esealplaceHolderCoordinates.signaturewidth = esealwidth;
                            matchingObject.esealplaceHolderCoordinates.signatureheight = esealheight;

                            pdfAnnotations.push({
                                type: 'Eseal',
                                x: (esealX / 595.28) * 100,
                                y: (esealY / 841.89) * 100,
                                width: (esealwidth / 595.28) * 100,
                                height: (esealheight / 841.89) * 100,
                                page: pageIndex + 1,
                                role: element.getAttribute('role')
                            });


                        }



                    });


                }
            });




        });
        // editors.forEach((editor, index) => {
        //   const rect = editor.querySelector('#Signature');
        //   if (rect) {
        //        const computedStyle = window.getComputedStyle(editor)
        //         const marginLeft = computedStyle.marginLeft;
        //         const marginTop = computedStyle.marginTop;
        //         const parentrect = editor.getBoundingClientRect();
        //         const childrect = rect.getBoundingClientRect();
        //         signatureX = (childrect.left - parentrect.left - parseFloat(marginLeft)) * scaleX;
        //         signatureY = (childrect.top - parentrect.top + 37.8) * scaleY;
        //         signaturewidth = childrect.width*1.3*scaleX;
        //         signatureheight = childrect.height*1.7*scaleY;

        //         signaturePage = index + 1;

        //   }

        //   const esealrect = editor.querySelector('#Eseal');
        //     if (esealrect) {
        //         const computedStyle = window.getComputedStyle(editor)
        //         const marginLeft = computedStyle.marginLeft;
        //         const marginTop = computedStyle.marginTop;
        //         const parentrect = editor.getBoundingClientRect();
        //         const childrect = esealrect.getBoundingClientRect();
        //         esealX = (childrect.left - parentrect.left - parseFloat(marginLeft)) * scaleX;
        //         esealY = (childrect.top - parentrect.top + 37.8) * scaleY;
        //         esealwidth = childrect.width * 1.3 * scaleX;
        //         esealheight = childrect.height*1.3*scaleY;

        //         esealPage = index + 1;

        //     }




        // });
        rolesConfig.forEach(obj => {
            obj.annotationsList = JSON.stringify(obj.annotationsList);
        });
        for (let i = 0; i < editorInstances.length; i++) {
            const editorInstance = editorInstances[i];
            try {
                const savedData = await editorInstance.save();
                annotations.push(savedData);
            } catch (error) {
                console.error(`Error saving editor instance ${i + 1}:`, error);
            }
        }

        docConfig.name = document.getElementById("tempName").value;
        docConfig.daysToComplete = (document.getElementById("daysToComplete").value).toString();
        docConfig.AdvancedSettings = JSON.stringify(docConfig.AdvancedSettings);
        docConfig.documentName = docConfig.name;
        docConfig.htmlSchema = JSON.stringify(annotations);
        docConfig.pdfSchema = JSON.stringify(pdfAnnotations);
        docConfig.sequentialSigning = $("#sequentialSign").prop('checked');
        docConfig.numberOfSignatures = (rolesConfig.length).toString();
        docConfig.allSigRequired = $("#allSignRequiredCheckbox").prop('checked');

        // roles[0].name = document.getElementById("input_1").value;


        // rolesConfig[0].placeHolderCoordinates.signatureXaxis = signatureX;
        // rolesConfig[0].placeHolderCoordinates.signatureYaxis = signatureY;
        // rolesConfig[0].placeHolderCoordinates.pageNumber = signaturePage;
        // rolesConfig[0].placeHolderCoordinates.signaturewidth = signaturewidth;
        // rolesConfig[0].placeHolderCoordinates.signatureheight = signatureheight;


        // rolesConfig[0].esealplaceHolderCoordinates.signatureXaxis = esealX;
        // rolesConfig[0].esealplaceHolderCoordinates.signatureYaxis = esealY;
        // rolesConfig[0].esealplaceHolderCoordinates.pageNumber = esealPage;
        // rolesConfig[0].placeHolderCoordinates.esealwidth = esealwidth;
        // rolesConfig[0].placeHolderCoordinates.esealheight = esealheight;

        var tosend = {
            docConfig: docConfig,
            roles: roles,
            rolesConfig: JSON.stringify(rolesConfig)
        }






        var fileFormData = new FormData();
        fileFormData.append("DocumentName", docConfig.documentName);
        fileFormData.append("name", docConfig.name);
        fileFormData.append("daysToComplete", docConfig.daysToComplete);
        fileFormData.append("numberOfSignatures", docConfig.numberOfSignatures)
        fileFormData.append("allSigRequired", isesealpresent);
        fileFormData.append("sequentialSigning", docConfig.sequentialSigning)
        fileFormData.append("docType", docConfig.docType)
        fileFormData.append("htmlSchema", docConfig.htmlSchema)
        fileFormData.append("pdfSchema", JSON.stringify(pdfAnnotations));
        fileFormData.append("advancedSettings", docConfig.AdvancedSettings);
        fileFormData.append("roles", JSON.stringify(roles));
        fileFormData.append("rolesConfig", JSON.stringify(rolesConfig));

        SaveDocument(saveFormUrl, fileFormData)
            .then((response) => {

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
                            // document.getElementById("navigationNetworkOverlay").style.display = "block";
                            // window.location.href = '@Url.Action("Index", "DigitalForms")';
                        }
                    });

                }

            })



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
            text: "Form Name and Form Validity: should not be empty",
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
            // error: function (err) {
            //     reject(err)
            // }
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

function validateTable(event) {
    const input = event.target;



    let value = parseInt(input.value);
    const min = parseInt(input.min, 10);
    const max = parseInt(input.max, 10);

    if (isNaN(value) || value < min || value > max) {
        input.value = min;
    }


}

function validateRole(event) {
    event.target.value = event.target.value.replace(/[^a-zA-Z0-9 _]/g, '');
}