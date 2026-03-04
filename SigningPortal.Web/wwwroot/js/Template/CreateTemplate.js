
let uploadedPDF = null;
let currentPage = 1;
const pagesPerBatch = 10; // Load 10 pages at a time

const renderQueue = new Set();
const renderedPages = new Set();
var thumbnail_Img;
var selectedEmails = [];
var selectedSuid = '';
var selectedSigningTemplateId = 0;
var selectedEsealTemplateId;
var inputpath;
var outputpath;
var PerpareDocumentContext = {
    receipientEmails: [],
    receipientEmailsList: [],
    selectuser: "",
    docName: "",
    fileName: "",
    edmsId: "",
    filesizerestrict: 0,
    filesize: "15",
    dropPoint: {},

}


var selectCheckbox = []

var isFileUploaded = false;
var signature_dimensions = {
    width: 0,
    height: 0,
}
var eseal_dimensions = {
    width: 0,
    height: 0,
}
var qrcode_dimensions = {
    width: 0,
    height: 0,
}
var signature_img = '';
var eseal_img = '';

imgdata1 = qrcodeimgdataval;
const img2 = new Image();
img2.src = imgdata1;
img2.onload = function () {
    const width = img2.width;
    const height = img2.height;
    qrcode_dimensions = {
        width: width,
        height: height,
    }

};
var rotationDataval = 0;
var fieldnameslist = [];
var canvasWidth;
var canvasHeight;
var originalHeight = "";
var originalWidth = "";
var scaleX = "";
var scaleY = "";
const pdfContainer = document.getElementById('pdf-container');
const pdfjsLib = window['pdfjs-dist/build/pdf'];
if (!pdfjsLib) {
    console.error('PDF.js library is not loaded.');
} else {

    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
}

//$(document).ready(function () {

$(document).ready(function () {
    document.getElementById("navigationNetworkOverlay").style.display = "none";
    $('#networkOverlay').hide();
    $('#BulkSignTemplateMenu').addClass('active');
    var actWidth = $(".nav-tabs").find(".active").parent("li").width();
    var actPosition = $(".nav-tabs .active").position();
    $(".slider").css({ "left": 0, /* + actPosition.left, */ "width": $(".nav-tabs .active").parent("li").width() });
    console.log(bulkSignerEsealEmails);

    $("#dropzone").on("click", open_file);
    $("#File").on("change", fileSelect);
    $("#SIGNATURE").on("click", function () {
        onClick('SIGNATURE');
    });
    $("#ESEAL").on("click", function () {
        onClick('ESEAL');
    });
    $("#sidebarCollapse2").on("click", function () {
        sidebarcollapseSignatoriesfields();
    });
    $("#sidebarCollapse1").on("click", function () {
        sidebarcollapsefields();
    });

    $("#templateSelect").on("change", function () {
        InnerDiv();
    });
    $("#EsealtemplateSelect").on("change", function () {
        InnerEsealDiv();
    });


    $("#innerModel").on("click", function () {
        ImagePreview();
    });

    $("#EsealInnerModel").on("click", function () {
        ImagePreviewEseal();
    });


    $("#Send").on("click", function () {
        Save1();
    });

    $("#clearbutton").on("click", function () {
        closeSettingsModal();
    });
    $("#OKbutton").on("click", function () {
        applySettings();
    });
    $("#closebutton").on("click", function () {
        closeModal();
    });
    $("#esealmodalpopup").on("click", function () {
        closeModals();
    });
    $("#advancesettingsbutton").on("click", function () {
        Settings();
    });

    $("#Save").on("click", function () {
        Save1();
    });
    getFileConfiguration();
    getAgentURL();


});
function getFileConfiguration() {
    $.ajax({
        type: 'GET',
        url: GetFileConfigurationUrl,
        success: function (data) {
            PerpareDocumentContext.filesizerestrict = data.fileSize;

        },
        error: ajaxErrorHandler,
    });
}
function getAgentURL() {
    $.ajax({
        url: TemplateAgentUrl,
        type: 'Get',
        // beforeSend: function () {

        // },
        // complete: function () {
        // 	$('#overlay').hide();
        // },
        success: function (response) {
            if (!response.success) {
                swal({
                    title: 'Info',
                    text: response.message,
                    type: 'info',
                    icon: 'info',
                }, function (isConfirm) {
                    window.location.href = IndexDashboard;
                });
            } else {

            }
        },
        error: ajaxErrorHandler
    });
}

async function sendEmailToAjax(email) {

    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: OrgDetailsByEmail,
            headers: {

                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

            },
            data: {
                email: email
            },
            beforeSend: function () {
                $('#overlay').css('z-index', 1000000000).show();
            },
            complete: function () {
                $('#overlay').hide().css('z-index', '');
            },
            success: function (response) {
                // Handle the success response from the server

                if (response.userProfile == null || $.isEmptyObject(response.userProfile)) {
                    console.log("email not found");

                    toastr.error(`Signatory not found`);
                    return;
                } else {
                    console.log('Email sent successfully:', response);
                    var userdetails = response.userProfile;
                    selectedSuid=userdetails.suid;
                    

                }

                resolve();
            },

            error: ajaxErrorHandler
        });
    });
}

$('.select-checkbox').change(function () {

    // If checkbox is checked
    if ($(this).prop('checked')) {
        selectCheckbox.push(this);

        // Get the email from the data attribute
        var email = $(this).data('email');

        selectedEmails.push(email);

        // Populate the input field
        $('#RecpientList_0__Email').val(email);

        // Disable the input field
        $('#RecpientList_0__Email').prop('disabled', true);

    } else {
        // If the checkbox is unchecked
        $('#RecpientList_0__Email').val(''); // Remove the email
        $('#RecpientList_0__Email').prop('disabled', false);
        selectCheckbox = selectCheckbox.filter(function (checkbox) {
            return checkbox !== this;
        }.bind(this));
        // If the checkbox is unchecked
        var emailToRemove = $(this).data('email');

        // Remove the email from the selectedEmails array
        selectedEmails = selectedEmails.filter(function (email) {
            return email !== emailToRemove;
        });
    }
});

//////////////////////////////////////////////
///Advance Settings button on click function//

function Settings() {


    if (selectCheckbox.length === 0 || selectCheckbox.length === 1) {
        var model = document.getElementById("settingsModal");
        if (model.style.display === "none") {
            model.style.display = "flex";
        }
        document.getElementById('fadeBackground').style.display = 'block';
        // document.getElementById("settingsModal").classList.add("MuiDialog-scrollPaper");
    } else {
        //showCustomAlert("Please select only one subscriber for template ");
        toastr.error("Please select only one subscriber for template ");
    }
}



function sidebarcollapsefields() {
    let rowContainer = document.getElementById('fieldsRecpRpw');
    let sidebarIcon = document.querySelector('#sidebarCollapse1 i'); // Select the <i> inside <h3>

    if (rowContainer.style.display === "none" || rowContainer.style.display === "") {
        rowContainer.setAttribute("style", "display: flex !important;");
        sidebarIcon.classList.remove("fa-angle-double-down");
        sidebarIcon.classList.add("fa-angle-double-up"); // Change to up icon
    } else {
        rowContainer.setAttribute("style", "display: none !important;");
        sidebarIcon.classList.remove("fa-angle-double-up");
        sidebarIcon.classList.add("fa-angle-double-down"); // Change back to down icon
    }
}


function sidebarcollapseSignatoriesfields() {
    let rowContainer = document.getElementById('emailList');
    let sidebarIcon = document.querySelector('#sidebarCollapse2 i');

    if (rowContainer.style.display === "none" || rowContainer.style.display === "") {
        rowContainer.setAttribute("style", "display: block !important;");
        sidebarIcon.classList.remove("fa-angle-double-down");
        sidebarIcon.classList.add("fa-angle-double-up"); // Change to up icon
    } else {
        rowContainer.setAttribute("style", "display: none !important;");
        sidebarIcon.classList.remove("fa-angle-double-up");
        sidebarIcon.classList.add("fa-angle-double-down"); // Change back to down icon
    }
}




// Close Button Click In Advance Setting
function closeSettingsModal() {


    document.getElementById("templateSelect").value = "0";
    document.getElementById("EsealtemplateSelect").value = "0";
    document.getElementById('innerModel').style.display = 'none';
    document.getElementById('EsealInnerModel').style.display = 'none';
    selectedSigningTemplateId = "";
    selectedEsealTemplateId = "";

    // Get the checkbox element by its id
    var esealcheckbox = document.getElementById("RecpientList_0__Eseal");
    // Check if the checkbox is checked
    if (esealcheckbox.checked) {
        esealcheckbox.checked = false;
        $('#esealTemplates').hide();
    }


    var model = document.getElementById("settingsModal");
    if (model.style.display === "flex") {
        model.style.display = "none";
    }
    document.getElementById('fadeBackground').style.display = "none";
    //document.getElementById("settingsModal").classList.remove("MuiDialog-scrollPaper");
}

function applySettings() {


    if (selectedEmails.length > 0) {
        var signatureTemplate = selectedSigningTemplateId;

        var viewModel = {
            Email: selectedEmails[selectedEmails.length - 1], // Assign the email at the length-1 position
            TemplateId: signatureTemplate,
        };
        checkSignature();
    } else {
        var model = document.getElementById("settingsModal");
        if (model.style.display === "flex") {
            model.style.display = "none";
        }
        document.getElementById('fadeBackground').style.display = "none";
        // document.getElementById("settingsModal").classList.remove("MuiDialog-scrollPaper");
    }

    function checkSignature() {

        // Add your AJAX call here to check e-seal permission
        $.ajax({
            url: Templateverifyorg,
            method: 'POST',
            headers: {

                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

            },
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(viewModel),

            success: function (response) {

                if (response.success) {
                    var model = document.getElementById("settingsModal");
                    if (model.style.display === "flex") {
                        model.style.display = "none";
                    }
                    document.getElementById('fadeBackground').style.display = "none";
                } else {
                    //showCustomAlert(response.message)
                    toastr.error(response.message);
                }
            },
            //error: function () {
            //	showCustomAlert("Something Went Wrong")
            //}
            error: ajaxErrorHandler
        });
    }
}

//Sign Img Previvew
$('#templateSelect').change(function () {
    // Get the selected value
    selectedSigningTemplateId = $(this).val();


    // Get the selected option's data-preview attribute
    var preview = $('option:selected', this).attr('data-preview');

    // Update the preview image
    $("#signatureTemplatePreviewImage").attr("src", "data:image/png;base64," + preview);


});

// Eseal Image Previvew
$('#EsealtemplateSelect').change(function () {
    // Get the selected value
    selectedEsealTemplateId = $(this).val();

    // Get the selected option's data-preview attribute
    var preview = $('option:selected', this).attr('data-preview');

    // Update the preview image
    $("#esealSignatureTemplatePreviewImage").attr("src", "data:image/png;base64," + preview);
});

// EyeIcon
document.getElementById('templateSelect').addEventListener('change', function () {
    console.log(this.value);
    var selectedValue = this.value;
    if (selectedValue !== "0") {
        document.getElementById('innerModel').style.display = 'block';
    } else {
        document.getElementById('innerModel').style.display = 'none';
    }
});

// Eseal EyeIcon
document.getElementById('EsealtemplateSelect').addEventListener('change', function () {
    console.log(this.value);
    var selectedValue = this.value;
    if (selectedValue !== "0") {
        document.getElementById('EsealInnerModel').style.display = 'flex';
    } else {
        document.getElementById('EsealInnerModel').style.display = 'none';
    }
});

// Eseal Template Check box click

$('#RecpientList_0__Eseal').change(function () {
    if (this.checked) {
        $('#esealTemplates').show();
    } else {
        $('#esealTemplates').hide();
        document.getElementById('EsealInnerModel').style.display = 'none';
        document.getElementById("EsealtemplateSelect").value = "0";
    }
});

function InnerDiv() {
    var model = document.getElementById("innerModel");
    if (model.style.display === "none") {
        model.style.display = "block";
    } else {
        model.style.display = "none";
    }
}

function InnerEsealDiv() {
    var model = document.getElementById("EsealInnerModel");
    if (model.style.display === "none") {
        model.style.display = "flex";
    } else {
        model.style.display = "none";
    }
}
async function ImagePreview() {
    try {
        let tempid = document.getElementById('templateSelect').value;
        const response = await handleTemplatePreviewimages(tempid);
        var model = document.getElementById("settingsInnerModal");
        if (response) {

            if (response.success) {

                $("#signatureTemplatePreviewImage").attr("src", "data:image/png;base64," + response.data);

                model.style.display = "flex";
            }
            else {
                swal({
                    type: 'error',
                    title: 'Error',
                    text: response.message
                })
                model.style.display = "none";
            }

        } else {
            console.error("No preview data received");
            model.style.display = "none";
        }
    } catch (err) {
        console.error("Error fetching preview images:", err);
    }
}
async function handleTemplatePreviewimages(tempid) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "GET",
            url: GetTemplatePreviewimages,
            beforeSend: function () {
                $('#overlay').show();
            },
            complete: function () {
                $('#overlay').hide();
            },
            data: {

                signtempid: tempid
            },
            success: function (response) {
                console.log(response);
                if (response) {

                    resolve(response);
                }
            },
            error: function (error) {
                ajaxErrorHandler(error);
                reject(error);
            }
        });
    });
}
// Inner Modal


function closeModal() {
    var model = document.getElementById("settingsInnerModal");
    if (model.style.display === "flex") {
        model.style.display = "none";
    }
}

async function ImagePreviewEseal() {


    try {
        let tempid = document.getElementById('EsealtemplateSelect').value;
        const response = await handleTemplatePreviewimages(tempid);
        var model = document.getElementById("settingsInnerModalEseal");
        if (response) {

            if (response.success) {

                $("#esealSignatureTemplatePreviewImage").attr("src", "data:image/png;base64," + response.data);

                model.style.display = "flex";
            }
            else {
                swal({
                    type: 'error',
                    title: 'Error',
                    text: response.message
                })
                model.style.display = "none";
            }

        } else {
            console.error("No preview data received");
            model.style.display = "none";
        }
    } catch (err) {
        console.error("Error fetching preview images:", err);
    }
}

function closeModals() {
    var model = document.getElementById("settingsInnerModalEseal");
    if (model.style.display === "flex") {
        model.style.display = "none";
    }
}

// Back Button click in webviewer

$("#back").on("click", function () {
    if (!$('#Send').hasClass("classshide"))
        $('#Send').addClass("classshide");
    if (!$('#Save').hasClass("classshide"))
        $('#Save').addClass("classshide");
    $("#Eseal").addClass("classshide");
    $("#QRCODE").addClass("classshide");  // Hide QRCODE button
    $('#viwer').addClass("classshide");
    $('#create').removeClass("classshide");
    $("#fields").addClass("classshide")
    fieldnameslist = [];
    pdfContainer.innerHTML = '';
    currentPage = 1;
    renderQueue.clear();
    renderedPages.clear();
   
});

function showAlert(message) {
    var alertDiv = document.getElementById('alertDiv');
    var alertText = document.getElementById('alertText');
    alertText.innerText = message;
    alertDiv.classList.add('show');
}

// Continue button click
$("#Continue").on("click", async function (e) {


    if (!isFileUploaded) {
        //showCustomAlert('Please Upload the Document');
        toastr.error('Please Upload the Document');
        e.preventDefault();
        return;
    }

    if (selectCheckbox.length === 0 || selectCheckbox.length > 1) {
        //showCustomAlert("Please select only one subscriber for template");
        toastr.error("Please select only one subscriber for template");
        e.preventDefault();
        return;
    }

    var templateName = $("#TemplateName").val().trim();

    // Check if template name is empty
    if (templateName === "") {

        toastr.error("Please enter templatename");
        e.preventDefault();
        return;
    }

    PerpareDocumentContext.receipientEmails = [];
    await sendEmailToAjax(selectedEmails[0]);
    // Populate the input field
    $('.email').each(function (i) {
        var isEseal = $("#RecpientList_0__Eseal").prop("checked");
        PerpareDocumentContext.receipientEmails.push({
            "order": i + 1,
            "email": selectedEmails[0],
            "eseal": isEseal,
            "suid": selectedSuid
        });
    })

    if (PerpareDocumentContext.receipientEmails.length > 0) { //<== new
        var firstEmail = PerpareDocumentContext.receipientEmails[0].email;
        if (selectedSigningTemplateId == "") {
            selectedSigningTemplateId = 0;
            var viewModel = {
                Email: firstEmail, // Assign the email at the length-1 position
                TemplateId: selectedSigningTemplateId,
            };
        } else {
            var viewModel = {
                Email: firstEmail, // Assign the email at the length-1 position
                TemplateId: selectedSigningTemplateId,
            };
        }

        var isEsealChecked = $("#RecpientList_0__Eseal").prop("checked");
        if (isEsealChecked) {
            if (bulkSignerEsealEmails.includes(firstEmail)) {
                checkEsealPermission(firstEmail);
            }
            else {
                if (firstEmail == loginEmail) {
                    swal({
                        type: 'info',
                        title: 'Info',
                        text: `You don't have eSeal permission for ` + firstEmail

                    });
                }
                else {
                    swal({
                        type: 'info',
                        title: 'Info',
                        text: `Selected signatory does not have e-seal permission ` + firstEmail

                    });
                }



                return false;
            }

        } else {
            checkEsealPermission(firstEmail);
            //continuePreparingDocument();
        }
        
        var userObjvalue = PerpareDocumentContext.receipientEmails[0];
        if (loginorgUid.trim() != "") {
            var previewuserobjdata =
            {
                email: userObjvalue.email,
                suid: userObjvalue.suid,
                OrganizationId: loginorgUid,
                AccountType: 'organization',
            }
        }
       
        try {
            console.log(previewuserobjdata);
            let sign_tempid = document.getElementById('templateSelect').value;
            let eseal_tempid = document.getElementById('EsealtemplateSelect').value;
            previewuserobjdata.signtempid = sign_tempid;
            previewuserobjdata.esealtempid = eseal_tempid;

            console.log(sign_tempid);
            console.log(eseal_tempid);
            const previewResponse = await handlePreviewimages(previewuserobjdata);
            console.log(previewResponse);
            if (previewResponse) {

                signature_img = previewResponse.signatureImage;
                eseal_img = previewResponse.esealImage;
                var sigimgdataval_data = 'data:image/png;base64,' + signature_img;
                var img_selected_user_sign = new Image();
                img_selected_user_sign.src = sigimgdataval_data;
                img_selected_user_sign.onload = function () {
                    const width = img_selected_user_sign.width;
                    const height = img_selected_user_sign.height;
                    signature_dimensions = {
                        width: width,
                        height: height,
                    }

                };
                var esealimgdataval_data = 'data:image/png;base64,' + eseal_img;
                var img_selected_user_eseal = new Image();
                img_selected_user_eseal.src = esealimgdataval_data;
                img_selected_user_eseal.onload = function () {
                    const width = img_selected_user_eseal.width;
                    const height = img_selected_user_eseal.height;
                    eseal_dimensions = {
                        width: width,
                        height: height,
                    }

                };

                console.log("signaturedata", signature_dimensions);
                console.log("esealdata", eseal_dimensions);
                console.log("Preview Data:", previewResponse);
            } else {


                console.warn("No preview data available.");
            }
        } catch (error) {
            console.error("Error fetching preview images:", error);
        }


    }

    function checkEsealPermission() {

        // Add your AJAX call here to check e-seal permission
        $.ajax({
            url: Templateverifyorg,
            method: 'POST',
            headers: {

                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

            },
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(viewModel),
            beforeSend: function () {
                $('#overlay').show();
            },
            complete: function () {
                $('#overlay').hide();
            },
            success: function (response) {

                if (response.success) {
                    var thumbnail = JSON.parse(response.result);
                    var data = thumbnail.selfieThumbnail;
                    thumbnail_Img = 'data:image/png;base64,' + data;
                    continuePreparingDocument();
                } else {

                    toastr.error(response.message);
                }
            },

            error: ajaxErrorHandler
        });

    }
});

function continuePreparingDocument() {
    setTimeout(function () {
        $(".toolcontainer2").addClass("classshide");
    }, 5000);

    PerpareDocumentContext.selectuser = PerpareDocumentContext.receipientEmails[0].email;

    var isEsealChecked = $("#RecpientList_0__Eseal").prop("checked");
    if (isEsealChecked) {
        $("#Eseal").removeClass("classshide");
    } else {
        $("#Eseal").addClass("classshide");
    }

    var isQrChecked = $("#QrCodeRequired").prop("checked");
    if (isQrChecked) {
        $("#QRCODE").removeClass("classshide");
    } else {
        $("#QRCODE").addClass("classshide");
    }
    // Add the following line to show the "Fields" div
    $("#fields").removeClass("classshide");
    PrepareDocument();


}

//Prepare Document
function PrepareDocument() {

    let docusers = PerpareDocumentContext.receipientEmails;
    // PerpareDocumentContext.receipientEmailsList = [];

    let recpfieldcount = Object.values(docusers).map((user) => {
        return { email: user.email, count: 0 };
    });

    if (recpfieldcount.length > 0) {
        PerpareDocumentContext.receipientEmailsList = recpfieldcount;
    }


    $('#emailList').empty();
    PerpareDocumentContext.receipientEmailsList.map((item, index) => {
        var selected = (index == 0) ? "selected" : "";
        $("#emailList").append(` <span style="display: inline-flex;align-items: center;font-size: 15px;"><img src="${thumbnail_Img}" class="selected2" alt="Thumbnail"> ${item.email}</span>`);


    })


    var annDat = "";

    if (PerpareDocumentContext.MultiSign) {
        $('#Send').removeClass("classshide");
    } else {
        $('#Save').removeClass("classshide");
    }
    var filebase64 = document.getElementById('filebase64').value;

    processfile(filebase64);
    $('#create').addClass("classshide");
    $('#viwer').removeClass("classshide");

    //=============
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
async function handlePreviewimages(preview_req_data) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "GET",
            url: GetPreviewimagesUrl,
            data: {
                email: preview_req_data.email,
                suid: preview_req_data.suid,
                orgUid: preview_req_data.OrganizationId,
                AccountType: preview_req_data.AccountType,
                signtempid: preview_req_data?.signtempid !== undefined ? preview_req_data.signtempid : 0,
                esealtempid: preview_req_data?.esealtempid !== undefined ? preview_req_data.esealtempid : 0,
            },
            beforeSend: function () {
                //$('#overlay').show();  // Show loading overlay
                document.getElementById("navigationNetworkOverlay").style.display = "block";
            },
            complete: function () {

                document.getElementById("navigationNetworkOverlay").style.display = "none";
                //$('#overlay').hide();  // Hide loading overlay
            },
            success: function (response) {
                console.log(response);
                if (response.success) {
                    console.log("Preview images retrieved successfully:", response.data);
                    resolve(response.data); // Resolve with the preview data
                } else {
                    console.error("Failed to retrieve preview images:", response.message);
                    resolve(false); // Resolve with `false` for failure
                }
            },
            error: function (error) {
                console.error("Error during AJAX call:", error);
                ajaxErrorHandler(error); // Handle error (function to be implemented)
                reject(error); // Reject the promise
            }
        });
    });
}

// Save Document
function SaveDocument(url, formData) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: url,
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            method: 'POST',
            headers: {

                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

            },
            type: 'POST',
            beforeSend: function () {
                $('#overlay').show();
            },
            complete: function () {
                $('#overlay').hide();
            },
            success: function (data) {
                resolve(data) // Resolve promise and when success
            },
            error: function (err) {
                reject(err) // Reject the promise and go to catch()
            }
        });
    });
}
async function Save1() {
    let signCordinates = {};
    let esealCordinates = {};
    var qrCordinates = {};
    var signCheckArr = [];
    var annotations = [];
    var esealCheckArr = [];
    var qrCheCheckArr = [];
    var Signatory = PerpareDocumentContext.receipientEmails;
    var len = PerpareDocumentContext.receipientEmails.length;
    document.querySelectorAll('.pdf-page').forEach((pageElement, pageIndex) => {
        const annotationLayer = pageElement.querySelector('.annotation-layer');
        const canvas = pageElement.querySelector('canvas');
        if (!canvas) {
            return; // Skip to next pageElement
        }
        if (!annotationLayer) {
            return;
        }
        const width = canvas.getBoundingClientRect().width;
        const height = canvas.getBoundingClientRect().height;
        const signatureElements = annotationLayer.querySelectorAll('[id^="SIGNATURE_"]');
        const rectele = pageElement.getBoundingClientRect();
        signatureElements.forEach(element1 => {
            var element = element1.parentElement?.parentElement;
            console.log(element);
            var computedStyle = window.getComputedStyle(element);
            var draggablepadding = computedStyle.getPropertyValue('padding-top');
            const rect = element.getBoundingClientRect();
            var emaildata = PerpareDocumentContext.receipientEmails[0].email;
            var suid = PerpareDocumentContext.receipientEmails[0].suid;
            var anname = Date.now();
            const signatureElement = element.querySelector(`[id^="SIGNATURE_"]`); // Find element with id starting with SIGNATURE_

            if (signatureElement && signatureElement.id === `SIGNATURE_${emaildata}`) {
                var inputrect = signatureElement.getBoundingClientRect();
                console.log('Matching element found:', inputrect);
            }
            if (element.querySelectorAll('.image-container')[0]) {
                var pele = element.parentElement;
                var parentRect = pele.parentElement.getBoundingClientRect();
            }
            else {
                var parentRect = element.parentElement.getBoundingClientRect();
            }

            if (rotationDataval === 90 || rotationDataval === 270) {
                scaleX = originalWidth / rectele.height;
                scaleY = originalHeight / rectele.width;
            } else {
                scaleX = originalWidth / rectele.width;
                scaleY = originalHeight / rectele.height;
            }

            if (signatureElement.id === `SIGNATURE_${emaildata}`) {
                annotations.push({
                    type: 'Signature',
                    x: ((rect.left - parentRect.left) / width) * 100,
                    y: ((rect.top - parentRect.top) / height) * 100,
                    width: (inputrect.width / width) * 100,
                    height: (inputrect.height / height) * 100,
                    page: pageIndex + 1,
                    role: `SIGNATURE_${emaildata}`,
                });
                signCordinates[emaildata] = {
                    fieldName: anname,
                    posX: (rect.left - parentRect.left) * scaleX,
                    posY: (rect.top - parentRect.top) * scaleY,
                    PageNumber: pageIndex + 1,
                    width: (inputrect.width) * scaleX,
                    height: (inputrect.height) * scaleY,
                };
                signCheckArr.push(emaildata);
                console.log(signCordinates);
            };
        });

        const esealElements = annotationLayer.querySelectorAll('[id^="ESEAL_"]');

        esealElements.forEach(element1 => {
            var element = element1.parentElement?.parentElement;
            console.log(element);
            var computedStyle = window.getComputedStyle(element);
            var draggablepadding = computedStyle.getPropertyValue('padding-top');
            const rect = element.getBoundingClientRect();
            var emaildata = PerpareDocumentContext.receipientEmails[0].email;
            var orguiddata = PerpareDocumentContext.receipientEmails[0].orgUid;
            var suid = PerpareDocumentContext.receipientEmails[0].suid;
            var anname = Date.now();
            const esealElement = element.querySelector(`[id^="ESEAL_"]`); // Find element with id starting with SIGNATURE_

            if (esealElement && esealElement.id === `ESEAL_${emaildata}`) {
                var inputrect = esealElement.getBoundingClientRect();
                console.log('Matching element found:', inputrect);
            }



            if (element.querySelectorAll('.image-container')[0]) {
                var pele = element.parentElement;
                var parentRect = pele.parentElement.getBoundingClientRect();
            }
            else {
                var parentRect = element.parentElement.getBoundingClientRect();
            }
            if (rotationDataval === 90 || rotationDataval === 270) {
                scaleX = originalWidth / rectele.height;
                scaleY = originalHeight / rectele.width;
            } else {
                scaleX = originalWidth / rectele.width;
                scaleY = originalHeight / rectele.height;
            }


            if (esealElement.id === `ESEAL_${emaildata}`) {
                annotations.push({
                    type: 'Eseal',
                    x: ((rect.left - parentRect.left) / width) * 100,
                    y: ((rect.top - parentRect.top) / height) * 100,
                    width: (inputrect.width / width) * 100,
                    height: (inputrect.height / height) * 100,
                    page: pageIndex + 1,
                    role: `ESEAL_${emaildata}`,
                });
                esealCordinates[emaildata] = {
                    fieldName: anname,
                    posX: (rect.left - parentRect.left) * scaleX,
                    posY: (rect.top - parentRect.top) * scaleY,
                    PageNumber: pageIndex + 1,
                    width: (inputrect.width) * scaleX,
                    height: (inputrect.height) * scaleY,
                    organizationID: orguiddata,
                };
                esealCheckArr.push(emaildata);

                console.log(esealCordinates);
            };
        });

        const qrcodeElements = annotationLayer.querySelectorAll('[id^="QRCODE_"]');

        qrcodeElements.forEach(element1 => {
            var element = element1.parentElement?.parentElement;
            console.log(element);
            var computedStyle = window.getComputedStyle(element);
            var draggablepadding = computedStyle.getPropertyValue('padding-top');
            const rect = element.getBoundingClientRect();
            var emaildata = PerpareDocumentContext.receipientEmails[0].email;
            var orguiddata = PerpareDocumentContext.receipientEmails[0].orgUid;
            var suid = PerpareDocumentContext.receipientEmails[0].suid;
            var anname = Date.now();
            const esealElement = element.querySelector(`[id^="QRCODE_"]`); // Find element with id starting with SIGNATURE_

            if (esealElement && esealElement.id === `QRCODE_${emaildata}`) {
                var inputrect = esealElement.getBoundingClientRect();
                console.log('Matching element found:', inputrect);
            }



            if (element.querySelectorAll('.image-container')[0]) {
                var pele = element.parentElement;
                var parentRect = pele.parentElement.getBoundingClientRect();
            }
            else {
                var parentRect = element.parentElement.getBoundingClientRect();
            }
            if (rotationDataval === 90 || rotationDataval === 270) {
                scaleX = originalWidth / rectele.height;
                scaleY = originalHeight / rectele.width;
            } else {
                scaleX = originalWidth / rectele.width;
                scaleY = originalHeight / rectele.height;
            }


            if (esealElement.id === `QRCODE_${emaildata}`) {
                annotations.push({
                    type: 'Qrcode',
                    x: ((rect.left - parentRect.left) / width) * 100,
                    y: ((rect.top - parentRect.top) / height) * 100,
                    width: (inputrect.width / width) * 100,
                    height: (inputrect.height / height) * 100,
                    page: pageIndex + 1,
                    role: `QRCODE_${emaildata}`,
                });
                qrCordinates[emaildata] = {
                    fieldName: anname,
                    posX: (rect.left - parentRect.left) * scaleX,
                    posY: (rect.top - parentRect.top) * scaleY,
                    PageNumber: pageIndex + 1,
                    width: (inputrect.width) * scaleX,
                    height: (inputrect.height) * scaleY,
                };
                qrCheCheckArr.push(emaildata);
                console.log(qrCordinates);
            };
        });
    });

    let SettingConfig = {
        inputpath: '',
        outputpath: ''
    };

    let DocumentName = document.getElementById("DocumentName").value;
    let TemplateName = document.getElementById("TemplateName").value;
    let EsealSignatureTemplate = selectedEsealTemplateId;
    let SignatureTemplates = selectedSigningTemplateId;
    let Rotation = document.getElementById("Rotation");
    let SettingConfigElement = document.getElementById("SettingConfig");
    let isEseal = $("#RecpientList_0__Eseal").is(':checked');
    let QrCodeRequired = $("#QrCodeRequired").is(':checked');
    var contentType = "application/pdf";
    var pdfBlob = base64ToBlob(document.getElementById('filebase64').value, contentType);
    if (Object.keys(esealCordinates).length === 0) {
        esealCordinates = null
    }
    if (Object.keys(qrCordinates).length === 0) {
        qrCordinates = null
    }
    var config = {
        QrCodeRequired: QrCodeRequired,
        Signature: signCordinates,
        Eseal: esealCordinates,
        Qrcode: qrCordinates

    }

    console.log(JSON.stringify(config));

    console.log(signCordinates);
    console.log(esealCordinates);
    console.log(qrCordinates);

    var htmlSchemadata = JSON.stringify(annotations);
    var list = Signatory.map(x => { return x.email });

    var fileFormData = new FormData();
    fileFormData.append("File", pdfBlob, DocumentName);
    fileFormData.append("DocumentName", DocumentName);
    fileFormData.append("TemplateName", TemplateName);
    fileFormData.append("SignatureTemplate", SignatureTemplates);
    fileFormData.append("EsealSignatureTemplate", EsealSignatureTemplate);
    fileFormData.append("Rotation", Rotation);
    fileFormData.append("SettingConfig", JSON.stringify(SettingConfig));
    fileFormData.append("Config", JSON.stringify(config));
    fileFormData.append("Signatory", list.join(","));
    fileFormData.append("esealRequired", isEseal);
    fileFormData.append("QrCodeRequired", QrCodeRequired);
    fileFormData.append("htmlSchema", htmlSchemadata);
    SaveDocument(SaveTemplate, fileFormData)
        .then((response) => {
            if (response.status == "Success") {
                swal({
                    title: "Success",
                    text: response.message,
                    type: "success",
                }, function (isConfirm) {
                    if (isConfirm) {
                        window.location.href = IndexTemplate;
                    }
                });
            } else {
                swal({
                    title: "Error",
                    text: response.message,
                    type: "error",
                }, function (isConfirm) {
                    if (isConfirm) {

                    }
                });
            }
        })

        .catch((e) => {

            console.log(e.status);
            if (e.status == 401) {
                swal({ type: 'info', title: "Session Expired", text: "Click on 'Ok' button to login again!" }, function (isConfirm) {
                    if (isConfirm) {
                        window.location.href = IndexLogin;
                    }
                });
            }
            else {

                swal({
                    title: "Error",
                    text: "Something went wrong!",
                    type: "error",
                }, function (isConfirm) {
                    if (isConfirm) {
                        window.location.href = IndexTemplate;
                    }
                });
            }
        });

}

function open_file() {
    document.getElementById('File').click();
}

var dragAndDropableDiv = $(".dropzone");
dragAndDropableDiv.on('dragenter', function (e) {
    console.log("hi");
});
dragAndDropableDiv.on('dragover', function (e) {
    e.stopPropagation();
    e.preventDefault();
    console.log("hello");
});

//If user drop File on DropArea

dragAndDropableDiv.on("drop", (event) => {

    event.preventDefault(); //preventing from default behaviour
    //getting user select file and [0] this means if user select multiple files then we'll select only the first one
    file = event.originalEvent.dataTransfer.files[0];
    let acceptableSize = false;
    let acceptableExt = false;
    if (isFileUploaded === true) {
        swal({
            type: 'info',
            title: 'Info',
            text: "File already uploaded."

        });
        return false;
    }

    if (e.target.files[0].size > PerpareDocumentContext.filesizerestrict * 1024 * 1024) {

        swal({
            type: 'info',
            title: 'Info',
            text: `File size should be ${PerpareDocumentContext.filesizerestrict} MB or below.`

        });
        return false;
    }

    acceptableSize = true;


    if (file.type != "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
        file.type != "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" &&
        file.type != "application/pdf") {
        swal({
            type: 'info',
            title: 'Info',
            text: "Only pdf are supported"

        });
        return false;
    }

    acceptableExt = true;

    var len = file.name.length;
    if (len > 50) {
        swal({
            type: 'info',
            title: 'Info',
            text: "File name length should be less than 50 characters"

        });
        return false;
    }

    if (!acceptableSize || !acceptableExt) {
        swal({
            type: 'info',
            title: 'Info',
            text: "Something went wrong. Try after sometime or Contact Administrator"

        });
        return false;
    }

    $("#DocumentName").val(file.name);
    PerpareDocumentContext.fileName = file.name.split(".").slice(0, -1).join(".")
    PerpareDocumentContext.docName = file.name
    $("#thumbnail").removeClass('classshide');
    isFileUploaded = true;
    $("#myModal").addClass('classshide');
    var blob = getblob(file, file.name).then(data => {
        webviwerInstance.loadDocument(data, { filename: file.name });
    });
});

$("#removefile").on("click", function () {
    $("#thumbnail").addClass("classshide");
    $("#DocumentName").val("");
    isFileUploaded = false;
    $("#File").val("");
});

async function fileSelect(e) {
    $('#overlay').show();
    let file = e.target.files[0];
    let extn = file.name.substring(file.name.lastIndexOf(".") + 1).toLowerCase();

    if (isFileUploaded) {
        toastr.error(`File already uploaded.`);
        e.target.value = ""; // Reset file input
        $('#overlay').hide();
        return false;
    }

    if (file.size > PerpareDocumentContext.filesizerestrict * 1024 * 1024) {
        toastr.error(`File size should be ${PerpareDocumentContext.filesizerestrict} MB or below.`);
        e.target.value = ""; // Reset file input
        $('#overlay').hide();
        return false;
    }

    const validTypes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/pdf"
    ];
    if (!validTypes.includes(file.type)) {
        toastr.error(`Only PDFs, Word documents, and Excel sheets are supported.`);
        e.target.value = ""; // Reset file input
        $('#overlay').hide();
        return false;
    }



    let acceptableSize = false;
    let acceptableExt = false;
    if (PerpareDocumentContext.filesizerestrict * 1024 * 1024 < file.size) {
        FileError("Document size should be less than " + PerpareDocumentContext.filesizerestrict + " MB");
        $('#overlay').hide();
        return false;
    }

    acceptableSize = true;


    acceptableExt = true;




    var len = file.name.length;
    if (len > 50) {
        toastr.error(`File name length should be less than 50 characters`);
        e.target.value = ""; // Reset file input
        $('#overlay').hide();
        return false;

    }


    if (!acceptableSize || !acceptableExt) {
        toastr.error(`Something went wrong. Try after sometime or Contact Administrator`);
        e.target.value = ""; // Reset file input
        $('#overlay').hide();
        return false;

    }


    // Check for signatures or password protection if it's a PDF
    if (file.type === "application/pdf") {
        const valid = await validatePDF(file);
        if (!valid) {
            e.target.value = "";
            $('#overlay').hide();
            return false;
        }
    }

    if (file) {
        const reader = new FileReader();
        reader.onload = async function (event) {
            let formData = new FormData();
            formData.append("file", file);
            let docDiv = document.getElementById('DocumentName');
            docDiv.innerHTML = "";
            docDiv.style.color = 'black';
            let loaderSpan = document.createElement('span');
            loaderSpan.className = 'loaderfile';

            docDiv.appendChild(loaderSpan);

            if (file.type == "application/pdf") {


                const filebase64String = event.target.result.split(',')[1];
                document.getElementById('filebase64').value = filebase64String;
                $("#DocumentName").val(file.name);
                PerpareDocumentContext.fileName = file.name.split(".").slice(0, -1).join(".");
                PerpareDocumentContext.docName = file.name;
                $("#thumbnail").removeClass('classshide');
                $('#Continue').removeAttr('disabled').removeClass('disabled-blur');
                $('#quickSign').removeAttr('disabled').removeClass('disabled-blur');
                isFileUploaded = true;
                $("#myModal").addClass('classshide');
                globalFile = file;

                // Update drive integration display
                toggleDriveIntegrationDisplay();


            } else {

                var convertedfile = await convertDocxToPDF(file, e)

                document.getElementById('filebase64').value = await fileToBase64(convertedfile)

                $("#DocumentName").val(file.name);
                PerpareDocumentContext.fileName = file.name.split(".").slice(0, -1).join(".");
                PerpareDocumentContext.docName = file.name;
                $("#thumbnail").removeClass('classshide');
                $('#Continue').removeAttr('disabled').removeClass('disabled-blur');
                $('#quickSign').removeAttr('disabled').removeClass('disabled-blur');
                isFileUploaded = true;
                $("#myModal").addClass('classshide');
                globalFile = convertedfile;

                // Update drive integration display
                toggleDriveIntegrationDisplay();

                e.target.value = ""; // Reset file input

            }




        };


        reader.readAsDataURL(file);
    }

    const toggleDriveIntegrationDisplay = () => {
        if (isFileUploaded) {
            $("#driveIntegration").css('display', 'none');
        } else {
            $("#driveIntegration").css('display', 'flex');
        }
        $('#overlay').hide();
    };



    async function validatePDF(file) {
        const reader = new FileReader();
        return new Promise((resolve) => {
            reader.readAsArrayBuffer(file);
            reader.onload = async function () {
                const arrayBuffer = reader.result;
                try {
                    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                    const pdf = await loadingTask.promise;

                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                        const page = await pdf.getPage(pageNum);
                        const annotations = await page.getAnnotations();
                        if (annotations.some(ann => ann.subtype === 'Widget' && ann.fieldType === 'Sig')) {
                            swal({
                                type: 'info',
                                title: 'Info',
                                text: "Invalid Document, Document has already been signed."
                            });
                            resolve(false);
                            return;
                        }
                    }

                    resolve(true); // No signatures found

                } catch (error) {
                    if (error.name === 'PasswordException') {
                        swal({
                            type: 'info',
                            title: 'Info',
                            text: "Password-protected documents are not allowed."
                        });
                    } else {
                        swal({
                            type: 'error',
                            title: 'Error',
                            text: "Failed to load the document."
                        });
                    }
                    resolve(false);
                }
            };
        });
    }



    const PrintSignaturesInfo = async (file) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = async function () {
            const arrayBuffer = reader.result;
            try {
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;

                let hasSignatures = false;
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const annotations = await page.getAnnotations();
                    if (annotations.some(ann => ann.subtype === 'Widget' && ann.fieldType === 'Sig')) {
                        hasSignatures = true;
                        break; // No need to check further if one is found
                    }
                }

                if (hasSignatures) {
                    swal({
                        type: 'info',
                        title: 'Info',
                        text: "Invalid Document, Document has already been signed."
                    });
                    e.target.value = ""; // Reset file input
                    $('#overlay').hide();
                    isFileUploaded = false;
                    return false;
                }
            } catch (error) {

                if (error.name === 'PasswordException') {
                    e.target.value = ""; // Reset file input
                    $('#overlay').hide();
                    isFileUploaded = false;
                    swal({
                        type: 'info',
                        title: 'Info',
                        text: "Password-protected documents are not allowed."
                    });

                    return false;
                } else {
                    swal({
                        type: 'error',
                        title: 'error',
                        text: "Error to load the file"
                    });
                    e.target.value = ""; // Reset file input
                    isFileUploaded = false;
                    $('#overlay').hide();
                    return false;
                }
            }
        };
    };


    //document.getElementById('ContinueButton').disabled = false;
    // toggleDriveIntegrationDisplay();

    //document.getElementById('FileName').value = file.name;


}



async function convertDocxToPDF(wordFile, e) {
    try {
        let formData = new FormData();
        formData.append("file", wordFile);
        let response = await fetch("/ConvertToPdf/ConvertFile", { // Adjust the API endpoint
            method: "POST",
            headers: {

                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

            },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            e.target.value = ""; // Reset file input
            $('#overlay').hide();
            swal({
                type: 'info',
                title: 'Info',
                text: errorText
            });
            return false;
        }

        let blob = await response.blob();


        const pdfFile = new File(
            [blob],
            wordFile.name.replace(/\.docx$/, '.pdf'),
            { type: 'application/pdf', lastModified: wordFile.lastModified }
        );

        return pdfFile;


    } catch (error) {
        console.error("Error converting DOCX to PDF:", error);
        throw error;
    }
}

function processfile(filebase64) {
    const pdfData = atob(filebase64);
    const arrayBuffer = new Uint8Array(pdfData.length);
    for (let i = 0; i < pdfData.length; i++) {
        arrayBuffer[i] = pdfData.charCodeAt(i);
    }

    pdfjsLib.getDocument({ data: arrayBuffer }).promise.then(async pdf => {
        uploadedPDF = pdf;
        pdfContainer.innerHTML = '';



        // Create page containers WITHOUT awaiting getPage
        for (let pageNum = 0; pageNum < pdf.numPages; pageNum++) {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'pdf-page';
            pageDiv.dataset.pageNumber = pageNum;
            pageDiv.style.minHeight = '200px';
            pdfContainer.appendChild(pageDiv);
        }

        // Pre-render first 20 pages and wait for all to complete
        const renderTasks = [];
        const limit = Math.min(20, pdf.numPages);
        for (let i = 0; i < limit; i++) {
            renderTasks.push(renderPage(i));
        }

        await Promise.all(renderTasks);  // Wait for all top 20 to render



        // Now enable scroll rendering
        setupScrollRendering();

        document.getElementById("loading-text1").innerText = "Document Loaded";
    }).catch(err => {
        console.error("Error loading PDF:", err);
    });
}

function setupScrollRendering() {
    const observer = new IntersectionObserver(async (entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                const pageDiv = entry.target;
                const pageNum = parseInt(pageDiv.dataset.pageNumber);

                // Load previous 2 to next 2 pages
                const start = Math.max(0, pageNum - 1);
                const end = Math.min(uploadedPDF.numPages - 1, pageNum + 1);

                for (let i = start; i <= end; i++) {
                    if (!renderQueue.has(i)) {
                        renderQueue.add(i);
                        await renderPage(i);
                    }
                }
            }
        }
    }, {
        root: null,
        rootMargin: '200px',
        threshold: 0.1
    });

    document.querySelectorAll('.pdf-page').forEach(div => observer.observe(div));
}


function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}


//function renderPDF(pdf) {

//    pdfContainer.innerHTML = '';
//    const numPages = pdf.numPages;
//    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
//        pdf.getPage(pageNum).then(page => {
//            const scale = 1.5;
//            const rotation = page.rotate;
//            rotationDataval = rotation;
//            console.log(rotation);

//            const viewport = page.getViewport({ scale });
//            const canvas = document.createElement('canvas');
//            const context = canvas.getContext('2d');
//            canvas.height = viewport.height;
//            canvas.width = viewport.width;
//            canvas.style.width = '100%';


//            const pageContainer = document.createElement('div');
//            pageContainer.className = 'pdf-page';
//            pageContainer.style.position = 'relative';
//            pageContainer.appendChild(canvas);
//            pdfContainer.appendChild(pageContainer);

//            const firstCanvas = document.querySelector('canvas');
//            canvasWidth = firstCanvas.getBoundingClientRect().width;
//            canvasHeight = firstCanvas.getBoundingClientRect().height;
//            const renderContext = {
//                canvasContext: context,
//                viewport: viewport
//            };
//            page.render(renderContext).promise.then(() => {
//                // Add annotation container to each page
//                const annotationLayer = document.createElement('div');
//                annotationLayer.className = 'annotation-layer';
//                annotationLayer.style.position = 'absolute';
//                annotationLayer.style.top = '0';
//                annotationLayer.style.left = '0';
//                annotationLayer.style.width = '100%';
//                annotationLayer.style.height = '100%';
//                annotationLayer.style.pointerEvents = 'none';
//                pageContainer.appendChild(annotationLayer);

//                originalWidth = viewport.viewBox[2];
//                originalHeight = viewport.viewBox[3];
//                pageWidth = originalWidth;
//                pageHeight = originalHeight;
//            });
//        });
//    }
//}

async function renderPage(pageNum) {
    if (renderedPages.has(pageNum)) return;  //Skip if already rendered
    renderedPages.add(pageNum);
    const page = await uploadedPDF.getPage(pageNum + 1);

    const scale = 1.5;
    const rotation = page.rotate; // Rotation from the PDF metadata
    rotationDataval = rotation;
    const viewport = page.getViewport({ scale, rotation }); // ✅ Apply rotation

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = '100%';

    const context = canvas.getContext('2d');
    const renderContext = { canvasContext: context, viewport };

    const container = document.querySelector(`[data-page-number="${pageNum}"]`);
    container.innerHTML = '';
    container.style.position = 'relative';
    container.dataset.pageNum = pageNum;
    //container.dataset.rotation = rotation; // Optional: store for later
    container.appendChild(canvas);

    await page.render(renderContext).promise;

    const rect = canvas.getBoundingClientRect();
    canvasWidth = rect.width;
    canvasHeight = rect.height;

    const annotationLayer = document.createElement('div');
    annotationLayer.className = 'annotation-layer';
    annotationLayer.style.position = 'absolute';
    annotationLayer.style.top = '0';
    annotationLayer.style.left = '0';
    annotationLayer.style.width = '100%';
    annotationLayer.style.height = '100%';
    annotationLayer.style.pointerEvents = 'none';
    annotationLayer.dataset.pageNumber = pageNum;
    container.appendChild(annotationLayer);

    originalWidth = viewport.viewBox[2];
    originalHeight = viewport.viewBox[3];
    pageWidth = originalWidth;
    pageHeight = originalHeight;

   
}


function convertFileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (event) {
            resolve(event.target.result); // This is the ArrayBuffer
        };

        reader.onerror = function (error) {
            reject(error);
        };

        reader.readAsArrayBuffer(file); // Read the file as ArrayBuffer
    });
}

var toolbarButtons = document.querySelectorAll('#fieldsRecpRpw button');
toolbarButtons.forEach(button => {
    button.addEventListener('mousedown', onMouseDown);
    button.addEventListener('touchstart', onMouseDown);

});


function onMouseDown(event) {
    const type = event.target.id;
    const ghostElement = createGhostElement(event, false);

    document.body.appendChild(ghostElement);
    var requiredreceipient = PerpareDocumentContext.receipientEmails.find(item => item.email == PerpareDocumentContext.selectuser);


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
        var requiredreceipient = PerpareDocumentContext.receipientEmails.find(item => item.email == PerpareDocumentContext.selectuser);

        if (pdfPage) {
            const annotationLayer = pdfPage.querySelector('.annotation-layer');
            const rect = pdfPage.getBoundingClientRect();
            const left = clientX - rect.left;
            const top = clientY - rect.top;
            const selectElement = PerpareDocumentContext.selectuser;
            const selectedRole = PerpareDocumentContext.selectuser;

            if (type === "SIGNATURE") {
                if (type === "SIGNATURE") {
                    var fieldname = 'SIGNATURE' + "_" + selectedRole;
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
                        swal({
                            title: "Info",
                            text: `The annotation is exceeding the PDF boundaries. Please adjust its size or position to fit within the document limits.`,
                            type: "info",
                        });
                        annotationLayer.removeChild(element);
                    } else {

                        fieldnameslist.push(fieldname);
                    }
                    scaleX = originalWidth / rect.width;
                    scaleY = originalHeight / rect.height;
                } else {

                    swal({
                        title: "Info",
                        text: `More than one Signature field is selected for the Recepient : ${selectedRole}`,
                        type: "error",
                    });
                }


            } else if (type === "ESEAL") {
                var fieldname = 'ESEAL' + "_" + selectedRole;
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
                        swal({
                            title: "Info",
                            text: `The annotation is exceeding the PDF boundaries. Please adjust its size or position to fit within the document limits.`,
                            type: "info",
                        });
                        annotationLayer.removeChild(element);
                    } else {
                        fieldnameslist.push(fieldname);
                    }
                    scaleX = originalWidth / rect.width;
                    scaleY = originalHeight / rect.height;
                } else {

                    swal({
                        title: "Info",
                        text: `More than one Eseal field is selected for the Recepient : ${selectedRole}`,
                        type: "error",
                    });
                }


            } else if (type === "QRCODE") {
                var fieldname = 'QRCODE' + "_" + selectedRole;
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
                        swal({
                            title: "Info",
                            text: `The annotation is exceeding the PDF boundaries. Please adjust its size or position to fit within the document limits.`,
                            type: "info",
                        });
                        annotationLayer.removeChild(element);
                    } else {
                        //fieldnameslist[requiredreceipient.order] = fieldname;
                        fieldnameslist.push(fieldname);
                    }
                    scaleX = originalWidth / rect.width;
                    scaleY = originalHeight / rect.height;
                } else {

                    swal({
                        title: "Info",
                        text: `More than one QRCODE field is selected`,
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

function onClick(type) {
    // const pdfPage = document.querySelector('div.pdf-page');
    const pages = document.querySelectorAll('.pdf-page');
    let current = null;
    let minDistance = Infinity;
    var requiredreceipient = PerpareDocumentContext.receipientEmails.find(item => item.email == PerpareDocumentContext.selectuser);

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
        //const selectElement = document.getElementById('ClientSelect');
        //const selectedRole = selectElement.value;
        const selectedRole = PerpareDocumentContext.selectuser;

        if (type === "plain-text") {
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
        else if (type === "SIGNATURE" || type === "ESEAL" || type === "QRCODE") {
            if (type === "SIGNATURE") {
                var fieldname = 'SIGNATURE' + "_" + selectedRole;
            } else if (type === "ESEAL") {
                var fieldname = 'ESEAL' + "_" + selectedRole;
            } else if (type === "QRCODE") {
                var fieldname = 'QRCODE' + '_' + selectedRole;
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
                    swal({
                        title: "Info",
                        text: `The annotation is exceeding the PDF boundaries. Please adjust its size or position to fit within the document limits.`,
                        type: "info",
                    });
                    annotationLayer.removeChild(element);
                } else {
                    //fieldnameslist[requiredreceipient.order] = fieldname;
                    fieldnameslist.push(fieldname);
                }
                scaleX = originalWidth / rect.width;
                scaleY = originalHeight / rect.height;
            } else {
                if (type === "SIGNATURE") {
                    swal({
                        title: "Info",
                        text: `More than one Signature field is selected for the Recepient : ${selectedRole}`,
                        type: "error",
                    });
                } else if (type === "ESEAL") {
                    swal({
                        title: "Info",
                        text: `More than one Eseal field is selected for the Recepient : ${selectedRole}`,
                        type: "error",
                    });
                } else if (type === "QRCODE") {
                    swal({
                        title: "Info",
                        text: `More than one QRCODE field is selected`,
                        type: "error",
                    });
                }
            }


        }

    }


}


function createGhostElement(event, autotype) {
    const selectedRole = PerpareDocumentContext.selectuser;
    const element = document.createElement('div');
    element.classList.add('draggable');

    const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;

    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    var fontSize = 0;
    if (event.target.id === 'SIGNATURE') {
        const input = document.createElement('div');
        input.style.border = "1px solid #44aad1";
        input.style.textAlign = 'center';

        if (signature_dimensions.height <= 120) {
            input.style.width = (signature_dimensions.width * 0.2702426536) + 'px';
            input.style.height = (signature_dimensions.height * 0.3756481986) + 'px';
            fontSize = (canvasWidth * 0.0575) / 4.5;
        } else if (signature_dimensions.height < 160 && signature_dimensions.height > 120) {

            input.style.width = (signature_dimensions.width * 0.2895) + 'px';
            input.style.height = (signature_dimensions.height * 0.4056481986) + 'px';
            fontSize = (canvasWidth * 0.0560) / 4.5;
        } else if (signature_dimensions.height > 160) {

            input.style.width = (signature_dimensions.width * 0.2895) + 'px';
            input.style.height = (signature_dimensions.height * 0.4056481986) + 'px';
            fontSize = (canvasWidth * 0.0560) / 4.5;
        }
        input.textContent = "Signature";
        input.style.backgroundColor = "#d8d7d78a";
        input.style.color = "#44aad1";
        input.style.fontSize = `${fontSize}px`;

        element.appendChild(input);
    }

    else if (event.target.id === 'ESEAL') {
        const input = document.createElement('div');
        input.style.border = "1px solid #44aad1";
        input.style.textAlign = 'center';
        input.style.padding = '15%';
        input.style.width = (eseal_dimensions.width * 0.363097) + 'px';
        input.style.height = (eseal_dimensions.height * 0.341452) + 'px';
        fontSize = (canvasWidth * 0.08907) / 7.5;
        input.textContent = 'ESEAL';
        input.style.backgroundColor = "#d8d7d78a";
        input.style.color = "#44aad1";
        input.style.fontSize = `${fontSize}px`;
        element.appendChild(input);
    }


    else if (event.target.id === 'QRCODE') {
        const input = document.createElement('div');
        input.style.border = "1px solid #44aad1";
        input.style.textAlign = 'center';
        input.style.padding = '15%';
        input.style.width = (qrcode_dimensions.width * 0.0601336711) + 'px';
        input.style.height = (qrcode_dimensions.width * 0.0601336711) + 'px';
        fontSize = (canvasWidth * 0.134) / 7.5;
        input.textContent = 'QRCODE';
        input.style.backgroundColor = "#d8d7d78a";
        input.style.color = "#44aad1";
        input.style.fontSize = `${fontSize}px`;
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



function resizeStart(e, content, handlePosition, parele, type) {
    isResizing = true;
    const isTouch = e.type.startsWith('touch');

    const startX = isTouch ? e.touches[0].clientX : e.clientX;
    const startY = isTouch ? e.touches[0].clientY : e.clientY;


    const rect = content.getBoundingClientRect();
    const startLeft = parseFloat(parele.style.left.replace('px', ''));
    const startTop = parseFloat(parele.style.top.replace('px', ''));
    const startRight = rect.right;

    const startWidth = parseFloat(getComputedStyle(content.firstChild, null).width.replace('px', ''));
    const startHeight = parseFloat(getComputedStyle(content.firstChild, null).height.replace('px', ''));
    const isRadioButton = content.firstChild.type === 'radio';
    const isCheckBox = content.firstChild.type === 'checkbox';

    var roledata = content.firstChild.role;
    const roleprefix = roledata.split('_')[0];
    const isSignature = roleprefix === 'SIGNATURE';
    const isEseal = roleprefix === 'ESEAL';

    let newWidth = null;
    let newHeight = null;
    let newLeft = null;
    let newTop = null;

    let updatedLeft = -1;
    let updatedTop = -1;
    let updatedWidth = -1;
    let updatedHeight = -1;




    const MIN_WIDTH = 30;
    const MIN_HEIGHT = 30;

    function resizeMove(e) {
        let clientX, clientY;
        if (e.type === 'mousemove') {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        const pdfPage = content.closest('.pdf-page');
        const annotationLayer = pdfPage?.querySelector('.annotation-layer');
        if (!pdfPage || !annotationLayer) return;

        const annotationRect = annotationLayer.getBoundingClientRect();

        if (
            clientX < annotationRect.left ||
            clientX > annotationRect.right ||
            clientY < annotationRect.top ||
            clientY > annotationRect.bottom
        ) {
            console.log("Cursor left current annotation-layer, skipping resize update");
            return;
        }

        const dx = clientX - startX;
        const dy = clientY - startY;

        newWidth = startWidth;
        newHeight = startHeight;
        newLeft = startLeft;
        newTop = startTop;
        if (handlePosition === 'top-left') {
            const tempWidth = startWidth - dx;
            const tempHeight = startHeight - dy;

            if (tempWidth >= MIN_WIDTH) {
                newWidth = tempWidth;
                newLeft = startLeft + dx;
                parele.style.left = `${newLeft}px`;
            } else {
                newWidth = MIN_WIDTH; // lock width
            }

            if (tempHeight >= MIN_HEIGHT) {
                newHeight = tempHeight;
                newTop = startTop + dy;
                parele.style.top = `${newTop}px`;
            } else {
                newHeight = MIN_HEIGHT; // lock height
            }
        }
        else if (handlePosition === 'top-right') {
            const tempWidth = startWidth + dx;
            const tempHeight = startHeight - dy;

            if (tempWidth >= MIN_WIDTH) {
                newWidth = tempWidth;
            } else {
                newWidth = MIN_WIDTH;
            }

            if (tempHeight >= MIN_HEIGHT) {
                newHeight = tempHeight;
                newTop = startTop + dy;
                parele.style.top = `${newTop}px`;
            } else {
                newHeight = MIN_HEIGHT;
            }
        }
        else if (handlePosition === 'bottom-left') {
            const tempWidth = startWidth - dx;
            const tempHeight = startHeight + dy;

            if (tempWidth >= MIN_WIDTH) {
                newWidth = tempWidth;
                newLeft = startLeft + dx;
                parele.style.left = `${newLeft}px`;
            } else {
                newWidth = MIN_WIDTH;
            }

            if (tempHeight >= MIN_HEIGHT) {
                newHeight = tempHeight;
            } else {
                newHeight = MIN_HEIGHT;
            }
        }
        else { // bottom-right
            const tempWidth = startWidth + dx;
            const tempHeight = startHeight + dy;

            newWidth = Math.max(MIN_WIDTH, tempWidth);
            newHeight = Math.max(MIN_HEIGHT, tempHeight);
            // top/left don’t move here anyway
        }


        // apply resizing only if above threshold
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

        if (isSignature) {
            content.firstChild.style.fontSize = `${newHeight / 4.5}px`;
        } else if (isEseal) {
            content.firstChild.style.fontSize = `${newHeight / 7.5}px`;
        } else {
            content.firstChild.style.fontSize = `${newHeight / 2}px`;
        }

        updatedLeft = content.parentElement.style.left;
        updatedTop = content.parentElement.style.top;
        updatedWidth = content.firstChild.style.width;
        updatedHeight = content.firstChild.style.height;
    }



    function resizeEnd() {
        isResizing = false;
        document.removeEventListener('mousemove', resizeMove);
        document.removeEventListener('mouseup', resizeEnd);
        document.removeEventListener('touchmove', resizeMove);
        document.removeEventListener('touchend', resizeEnd);


        if (type === "INITIAL") {
            swal({
                type: 'info',
                title: "Message",
                text: "Do you want to modify the initial annotation at the same location on every page where it is present?",
                showCancelButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Yes',
                cancelButtonText: "No"
            }, function (isConfirm) {
                const firstChild = content.firstElementChild;
                const inner = firstChild?.firstChild;
                if (!inner || !inner.id) return;

                const initialId = inner.id;
                const selectedRole = initialId.replace(/^INITIAL\d+/, "");

                const newWidth = content.querySelector('.image-container')?.offsetWidth || 0;
                const newHeight = content.querySelector('.image-container')?.offsetHeight || 0;

                if (isConfirm) {
                    fieldnameslist.forEach((fieldName) => {
                        if (fieldName.startsWith("INITIAL") && fieldName.endsWith(selectedRole)) {
                            const initialImg = document.getElementById(fieldName);
                            if (!initialImg) return;

                            const parele = initialImg.closest(".draggable");
                            const container = initialImg.closest(".image-container");
                            const canvas = initialImg.closest('.pdf-page')?.querySelector('canvas');
                            if (!parele || !container || !canvas) return;

                            const canvasRect = canvas.getBoundingClientRect();

                            const lPercent = (newLeft / canvasRect.width) * 100;
                            const tPercent = (newTop / canvasRect.height) * 100;
                            const wPercent = (newWidth / canvasRect.width) * 100;
                            const hPercent = (newHeight / canvasRect.height) * 100;

                            if (newLeft !== null) {
                                parele.style.left = `${newLeft}px`;
                            }
                            if (newTop !== null) {
                                parele.style.top = `${newTop}px`;
                            }
                            if (newWidth !== null) {
                                container.style.width = `${newWidth}px`;
                            }
                            if (newHeight !== null) {
                                container.style.height = `${newHeight}px`;
                            }

                            // Update size only on image-container
                            container.style.width = `${newWidth}px`;
                            container.style.height = `${newHeight}px`;

                            // Update initialsStore for the exact field
                            const pageMatch = fieldName.match(/^INITIAL(\d+)/);
                            const pageIndex = pageMatch ? parseInt(pageMatch[1]) : null;

                            if (pageIndex !== null && initialsStore[selectedRole]?.[pageIndex]) {
                                initialsStore[selectedRole][pageIndex].forEach(obj => {
                                    if (obj.id === fieldName) {
                                        obj.left = lPercent;
                                        obj.top = tPercent;
                                        obj.width = wPercent;
                                        obj.height = hPercent;
                                    }
                                });
                            }
                        }
                    });
                }
                else {
                    const pageIndexMatch = initialId.match(/^INITIAL(\d+)/);
                    if (!pageIndexMatch) return;
                    const pageIndex = parseInt(pageIndexMatch[1]);

                    const initialImg = document.getElementById(initialId);
                    if (!initialImg) return;

                    const parele = initialImg.closest(".draggable");
                    const draggableContent = initialImg.closest(".draggable-content");
                    const container = initialImg.closest(".image-container");
                    const canvas = initialImg.closest('.pdf-page')?.querySelector('canvas');
                    if (!parele || !draggableContent || !container || !canvas) return;

                    const canvasRect = canvas.getBoundingClientRect();

                    // Update position
                    if (handlePosition === 'top-left') {
                        parele.style.left = `${newLeft}px`;
                        parele.style.top = `${newTop}px`;
                    } else if (handlePosition === 'top-right') {
                        parele.style.top = `${newTop}px`;
                    } else if (handlePosition === 'bottom-left') {
                        parele.style.left = `${newLeft}px`;
                    }

                    // Update size
                    container.style.width = `${newWidth}px`;
                    container.style.height = `${newHeight}px`;

                    if (draggableContent.firstChild?.type === 'date') {
                        draggableContent.parentElement.style.width = `${newWidth}px`;
                    }

                    const lPx = parseFloat(parele.style.left) || (parele.getBoundingClientRect().left - canvasRect.left);
                    const tPx = parseFloat(parele.style.top) || (parele.getBoundingClientRect().top - canvasRect.top);

                    const lPercent = (lPx / canvasRect.width) * 100;
                    const tPercent = (tPx / canvasRect.height) * 100;
                    const wPercent = (newWidth / canvasRect.width) * 100;
                    const hPercent = (newHeight / canvasRect.height) * 100;

                    parele.setAttribute('data-wpercent', wPercent / 100);
                    parele.setAttribute('data-hpercent', hPercent / 100);

                    if (initialsStore[selectedRole]?.[pageIndex]) {
                        initialsStore[selectedRole][pageIndex].forEach(obj => {
                            if (obj.id === initialId) {
                                obj.left = lPercent;
                                obj.top = tPercent;
                                obj.width = wPercent;
                                obj.height = hPercent;
                            }
                        });
                    }
                }
            });

        }
    }


    document.addEventListener('mousemove', resizeMove);
    document.addEventListener('mouseup', resizeEnd);

    document.addEventListener('touchmove', resizeMove, { passive: false });
    document.addEventListener('touchend', resizeEnd, { passive: false });
}


function addResizeHandles(content, parele, type) {
    const handles = ['bottom-right', 'bottom-left', 'top-left', 'top-right'];
    handles.forEach(position => {
        const handle = document.createElement('div');
        handle.classList.add('resize-handle', position);
        content.appendChild(handle);
        handle.style.display = 'none';
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            resizeStart(e, content, position, parele, type);
        });

        handle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            resizeStart(e, content, position, parele, type);

        });
    });
}


function extractRGBValues(rgbString) {

    const rgbArray = rgbString.match(/\d+/g);
    return rgbArray ? rgbArray.map(Number) : [0, 0, 0];
}
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function updateModalContent(headerContent, bodyContent, footerContent) {
    // Update the modal header
    document.querySelector('#EditFields_Modal .modal-header').innerHTML = headerContent;

    // Update the modal body
    document.querySelector('#EditFields_Modal .modal-body').innerHTML = bodyContent;

    // Update the modal footer
    document.querySelector('#EditFields_Modal .modal-footer').innerHTML = footerContent;
}

function addEditIcon(content, type) {
    const editIcon = document.createElement('div');
    editIcon.classList.add('edit-icon', 'top-right');
    editIcon.innerHTML = '<i class="fas fa-trash-can" style="color: #e63946;"></i>';





    if (type === 'SIGNATURE') {
        editIcon.addEventListener('click', () => {
            const firstChild = content.firstElementChild;
            console.log(firstChild);
            const newHeader = '<h5 class="modal-title">Do you want to delete this field?</h5>';
            const newBody = ``;
            //const newBody = `<input  type="text" value="${firstChild.id.split("_")[0]}" id="FieldNameInput" class="form-control"  placeholder="Enter new field name" readonly>`;
            const newFooter = `
																																																																	 <button type="button" class="btn btn-danger"  id="deleteFieldName">Delete</button>
																																																																 <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
																																																															 `;

            // Update the modal content
            updateModalContent(newHeader, newBody, newFooter);

            document.getElementById('deleteFieldName').addEventListener('click', () => {
                console.log(content);
                const element = content.parentElement;
                console.log(element);
                fieldnameslist = fieldnameslist.filter(item => item !== firstChild.role);
                element.remove();
                $('#EditFields_Modal').modal('hide');
            });

            // Show the modal
            $('#EditFields_Modal').modal('show');

        });
    }
    else if (type === 'ESEAL') {
        editIcon.addEventListener('click', () => {
            const firstChild = content.firstElementChild;

            const newHeader = '<h5 class="modal-title">Do you want to delete this field?</h5>';
            const newBody = ``;
            //const newBody = `<input type="text" value="${firstChild.id.split("_")[0]}" id="FieldNameInput" class="form-control"  placeholder="Enter new field name" readonly>`;
            const newFooter = `
																																																																		 <button type="button" class="btn btn-danger"  id="deleteFieldName">Delete</button>
																																																																	 <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
																																																																 `;

            // Update the modal content
            updateModalContent(newHeader, newBody, newFooter);

            document.getElementById('deleteFieldName').addEventListener('click', () => {
                console.log(content);
                const element = content.parentElement;
                console.log(element);
                fieldnameslist = fieldnameslist.filter(item => item !== firstChild.role);
                element.remove();
                $('#EditFields_Modal').modal('hide');
            });


            // Show the modal
            $('#EditFields_Modal').modal('show');

        });
    }
    else if (type === 'QRCODE') {
        editIcon.addEventListener('click', () => {
            const firstChild = content.firstElementChild;

            const newHeader = '<h5 class="modal-title">Do you want to delete this field?</h5>';
            const newBody = ``;
            //const newBody = `<input type="text" value="${firstChild.id.split("_")[0]}" id="FieldNameInput" class="form-control"  placeholder="Enter new field name" readonly>`;
            const newFooter = `
																																																																		 <button type="button" class="btn btn-danger"  id="deleteFieldName">Delete</button>
																																																																	 <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
																																																																 `;

            // Update the modal content
            updateModalContent(newHeader, newBody, newFooter);

            document.getElementById('deleteFieldName').addEventListener('click', () => {
                console.log(content);
                const element = content.parentElement;
                console.log(element);
                fieldnameslist = fieldnameslist.filter(item => item !== firstChild.role);
                element.remove();
                $('#EditFields_Modal').modal('hide');
            });


            // Show the modal
            $('#EditFields_Modal').modal('show');

        });
    }

    content.appendChild(editIcon);
}

function makeDraggable(element) {
    let startX, startY;
    let offsetX, offsetY, isDragging = false;
    var newLeft;
    var newTop;
    element.addEventListener('mousedown', (e) => {
        if (!e.target.classList.contains('resize-handle') && !e.target.classList.contains('edit-icon') && !e.target.classList.contains('input-field') && !e.target.classList.contains('editable-text') && !e.target.classList.contains('image-upload') && !e.target.classList.contains('remove-image-btn')) {
            isDragging = true;
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;
            startX = e.clientX;
            startY = e.clientY;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);

        }
    });
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

        }
    }
    function isInside(elementRect, pageRect) {
        return (
            elementRect.top >= pageRect.top &&
            elementRect.bottom <= pageRect.bottom
        );
    }

    function onMouseUp(e) {
        const movedX = Math.abs(e.clientX - startX);
        const movedY = Math.abs(e.clientY - startY);
        const wasDragged = movedX > 2 || movedY > 2;

        isDragging = false;

        const isTouch = e.type.startsWith('touch');
        if (isTouch) {
            document.removeEventListener('touchmove', onMouseMove);
            document.removeEventListener('touchend', onMouseUp);
        } else {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

        }

        if (!wasDragged) {
            // This is a CLICK, don't run drag/drop logic, allow click handler to fire
            return;
        }


        const pdfPages = document.querySelectorAll('.pdf-page');

        const draggableRect = element.getBoundingClientRect();


        element.style.left = newLeft;
        element.style.top = newTop;


        const lratio = (newLeft / (document.querySelector('canvas')).getBoundingClientRect().width);
        const tratio = (newTop / (document.querySelector('canvas')).getBoundingClientRect().height);

        element.setAttribute('data-lpercent', lratio)
        element.setAttribute('data-tpercent', tratio)

        console.log(e.target.id);
        console.log(typeof (e.target.id));
        if (e.target.id.startsWith("INITIAL")) {
            swal({
                type: 'info',
                title: "Message",
                text: "Do you want to modify the initial annotation at the same location on every page where it is present?",
                showCancelButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Yes',
                cancelButtonText: "No"
            }, function (isConfirm) {
                if (isConfirm) {
                    const firstChild = element.firstElementChild?.firstElementChild;
                    const initialId = firstChild.firstChild.id;

                    const selectedRole = initialId.replace(/^INITIAL\d+/, "");
                    fieldnameslist.forEach((fieldName) => {
                        if (fieldName.endsWith(selectedRole) && fieldName.startsWith("INITIAL")) {
                            const initialImg = document.getElementById(fieldName);

                            if (initialImg) {
                                const draggableDiv = initialImg.closest(".draggable");

                                if (draggableDiv) {
                                    // Apply position to draggable div, not the img
                                    draggableDiv.style.left = `${newLeft}px`;
                                    draggableDiv.style.top = `${newTop}px`;

                                    const canvasRect = document.querySelector('canvas').getBoundingClientRect();

                                    const wratio = draggableDiv.offsetWidth / canvasRect.width;
                                    const hratio = draggableDiv.offsetHeight / canvasRect.height;
                                    const lratio = newLeft / canvasRect.width;
                                    const tratio = newTop / canvasRect.height;

                                    draggableDiv.setAttribute('data-wpercent', wratio);
                                    draggableDiv.setAttribute('data-hpercent', hratio);
                                    draggableDiv.setAttribute('data-lpercent', lratio);
                                    draggableDiv.setAttribute('data-tpercent', tratio);
                                }
                            }


                        }
                    });
                } else {
                    element.style.left = `${newLeft}px`;
                    element.style.top = `${newTop}px`;
                }
            });
        } else {
            // For non-initialButton, apply the position normally
            element.style.left = `${newLeft}px`;
            element.style.top = `${newTop}px`;
        }

    }
}



function createDraggableElement(type, left, top, group, value, isMandatory) {
    //const selectElement = document.getElementById('ClientSelect');
    const selectedRole = PerpareDocumentContext.selectuser;
    console.log(PerpareDocumentContext);
    var requiredreceipient = PerpareDocumentContext.receipientEmails.find(item => item.email == PerpareDocumentContext.selectuser);
    var fontSize = 0;

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
    content.style.overflow = "hidden";

    if (type === 'SIGNATURE') {
        element.style.padding = '0';
        const input = document.createElement('div');
        input.style.border = "1px solid #44aad1";
        input.style.textAlign = 'center';

        if (signature_dimensions.height <= 120) {
            input.style.width = (signature_dimensions.width * 0.2702426536) + 'px';
            input.style.height = (signature_dimensions.height * 0.3756481986) + 'px';
        } else if (signature_dimensions.height < 160 && signature_dimensions.height > 120) {
            input.style.width = (signature_dimensions.width * 0.2895) + 'px';
            input.style.height = (signature_dimensions.height * 0.4056481986) + 'px';
        } else if (signature_dimensions.height > 160) {
            input.style.width = (signature_dimensions.width * 0.2895) + 'px';
            input.style.height = (signature_dimensions.height * 0.4056481986) + 'px';
        }
        fontSize = (canvasWidth * 0.0575) / 4.5;
        //input.textContent = 'SIGNATURE' + "_" + selectedRole;
        input.textContent = 'SIGNATURE' + "_" + selectedRole;
        input.style.backgroundColor = "#d8d7d78a";
        input.style.color = "#44aad1";
        input.style.fontSize = `${fontSize}px`;
        input.id = 'SIGNATURE' + "_" + selectedRole;
        input.setAttribute('role', 'SIGNATURE' + "_" + selectedRole);


        content.appendChild(input);
    }
    else if (type === 'ESEAL') {
        element.style.padding = '0';
        const input = document.createElement('div');
        input.style.border = "1px solid #44aad1";
        input.style.textAlign = 'center';

        input.style.width = (eseal_dimensions.width * 0.363097) + 'px';
        input.style.height = (eseal_dimensions.height * 0.341452) + 'px';
        fontSize = (canvasWidth * 0.08245) / 7.5;

        input.textContent = "ESEAL";
        // input.style.width = (canvasWidth * 0.15) + 'px';
        // input.style.height = (canvasWidth * 0.15) + 'px';
        input.textContent = 'ESEAL' + "_" + selectedRole;
        input.style.backgroundColor = "#d8d7d78a";
        input.style.color = "#44aad1";
        input.style.fontSize = `${fontSize}px`;

        input.id = 'ESEAL' + "_" + selectedRole;
        input.setAttribute('role', 'ESEAL' + "_" + selectedRole);
        //fieldnameslist[requiredreceipient.order] = 'ESEAL' + "_" + selectedRole;

        content.appendChild(input);
    }
    else if (type === 'QRCODE') {
        element.style.padding = '0';
        const input = document.createElement('div');
        //input.style.border = "1px solid #44aad1";
        input.style.textAlign = 'center';
        //input.style.padding = '30%';

        if (rotationData === 270 || rotationData === 90) {
            input.style.width = (canvasWidth * 0.134) + 'px';
            input.style.height = (canvasWidth * 0.134) + 'px';


        } else {
            input.style.width = (canvasWidth * 0.134) + 'px';
            input.style.height = (canvasWidth * 0.134) + 'px';


        }
        input.textContent = "ESEAL";
        input.style.width = (canvasWidth * 0.15) + 'px';
        input.style.height = (canvasWidth * 0.15) + 'px';
        input.textContent = 'ESEAL' + "_" + selectedRole;
        input.style.backgroundColor = "#d8d7d78a";
        input.style.color = "#44aad1";
        // input.style.fontSize = "50%";


        input.id = 'QRCODE' + "_" + selectedRole;
        input.setAttribute('role', 'QRCODE' + "_" + selectedRole);
        //fieldnameslist[requiredreceipient.order] = 'QRCODE' + "_" + selectedRole;


        content.appendChild(input);
    }

    element.appendChild(content);
    if (type !== 'websave' && type !== 'webfill') {
        // Make the div focusable
        content.setAttribute('tabindex', '0');
        addResizeHandles(content, element, type);

        // On click, focus the content so blur works
        content.addEventListener("click", () => {
            content.focus();
        });

        // When focused, show resize handles
        content.addEventListener("focus", () => {
            const handles = content.querySelectorAll('.resize-handle');
            handles.forEach(handle => {
                handle.style.display = 'block';
            });

            content.style.border = '2px solid #4A90E2';
        });

        // When blurred, hide resize handles
        content.addEventListener("blur", () => {
            const handles = content.querySelectorAll('.resize-handle');
            handles.forEach(handle => {
                handle.style.display = 'none';
            });

            content.style.border = 'none';
        });
    }
    addEditIcon(content, type);

    element.style.position = 'absolute';
    element.style.pointerEvents = 'auto';  // Enable interactions
    element.style.zIndex = '1000';  // Ensure it's on top of other elements

    makeDraggable(element);

    return element;
}




function showCustomAlert(message) {
    // Set the alert message
    document.getElementById('alert-message').innerText = message;

    // Show the alert box
    document.getElementById('custom-alert').style.display = 'block';

    // Add some additional styles to the custom alert box
    document.getElementById('custom-alert').style.animation = 'fadeIn 0.3s';
    document.getElementById('custom-alert').style.animationFillMode = 'forwards';

    // Add a click event listener to the OK button
    document.getElementById('ok-button').addEventListener('click', function () {
        // Hide the alert box when the OK button is clicked
        document.getElementById('custom-alert').style.animation = 'fadeOut 0.3s';
        document.getElementById('custom-alert').style.animationFillMode = 'forwards';

        setTimeout(function () {
            document.getElementById('custom-alert').style.display = 'none';
        }, 300);
    });
    setTimeout(function () {
        if (document.getElementById('custom-alert').style.display === 'block') {
            document.getElementById('custom-alert').style.animation = 'fadeOut 0.3s';
            document.getElementById('custom-alert').style.animationFillMode = 'forwards';

            setTimeout(function () {
                document.getElementById('custom-alert').style.display = 'none';
            }, 300);
        }
    }, 4000);
}


const dragOver = (e) => {
    e.preventDefault();
    return false;
};

const drop = (e) => {
    e.preventDefault();
    return false;
};



$("#emailList").on('click', 'li', function () {
    $(".list").removeClass("selected");
    $(this).addClass("selected");  // adding active class

    $("#fields").removeClass("classshide");
});

//const toggleRecepientSelection = (email) => {

const toggleRecepientSelection = (email) => {
    PerpareDocumentContext.selectuser = email;

    var userObj = PerpareDocumentContext.receipientEmails.find(x => x.email == email);
    if (userObj.eseal) {
        $("#Eseal").removeClass("classshide");
        toggleQRCODEVisibility();
    } else {
        $("#Eseal").addClass("classshide");
        $("#QRCODE").addClass("classshide");
    }

    // Manage the field div visibility
    $("#fields").removeClass("classshide");
};

const toggleQRCODEVisibility = () => {
    var isQrCodeRequired = $("#QrCodeRequired").prop("checked");

    if (isQrCodeRequired) {
        $("#QRCODE").removeClass("classshide");
    } else {
        $("#QRCODE").addClass("classshide");
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

