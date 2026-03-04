document.addEventListener("DOMContentLoaded", async function () {
    $('#networkOverlay').hide();
    viewName = currentviewName;

    // Initialize based on view name from URL
    if (viewName === 'SentDocuments') {
        switchToTab('sent');
        loadSent();
    } else if (viewName === 'RecievedDocuments') {
        switchToTab('received');
        loadReceived();
    } else if (viewName === 'RefferedDocuments') {
        switchToTab('referred');
        loadReferred();
    } else {
        // Default to My Templates
        loadMyTemplates();
    }

    // Setup tab click handlers
    document.querySelectorAll('.df-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            const tabName = this.getAttribute('data-tab');
            switchToTab(tabName);
        });
    });
});


$(document).ready(function () {
    $("#createform").on("click", function () {
        openModal();
    });

    $("#docOption").on("click", function () {
        handleOptionChange("option2");
        $(this).find("input[type=radio]").prop("checked", true); // ensure radio gets checked
    });

    $("#blankOption").on("click", function () {
        handleOptionChange('option1');
        $(this).find("input[type=radio]").prop("checked", true); // ensure radio gets checked
    });


    $("#filedropzone").on("click", function () {
        open_file();
    });

    // File selection handler
    $("#File").on("change", function (event) {
        fileSelect(event);
    });

    $("#CancelButton").on("click", function () {
        CloseButton();
    });

    // Continue button
    $("#ContinueButton").on("click", function () {
        CreateButton();
    });




    $("#closedigitalShowModalBtn").on("click", function () {
        closemodal();
    });



});

// Tab switching logic
function switchToTab(tabName) {
    // Remove active class from all tabs and panels
    document.querySelectorAll('.df-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.df-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    // Add active class to selected tab and panel
    const selectedTab = document.querySelector(`.df-tab[data-tab="${tabName}"]`);
    if (selectedTab) {
        selectedTab.classList.add('active');
        selectedTab.setAttribute('aria-selected', 'true');
    }

    const selectedPanel = document.getElementById(`panel-${tabName}`);
    if (selectedPanel) {
        selectedPanel.classList.add('active');
    }
}

// Load My Templates tab
function loadMyTemplates() {
    const currentUrl = window.location.href.split('?')[0];
    const newUrl = `${currentUrl}?viewName=myforms`;
    window.history.pushState(null, '', newUrl);

    $('#myforms').empty().hide();
    $('#sendDoc').empty().hide();
    $('#receiveDoc').empty().hide();
    $('#refferedDoc').empty().hide();

    switchToTab('myTemplates');

    $.ajax({
        type: 'GET',
        url: myDigitalformsUrl,
        beforeSend: function () {
            showShimmer('#myforms', 6);
        },
        complete: function () {
            clearShimmer('#myforms');
        },
        success: function (data) {
            if (data != null) {
                $('#myforms').css('display', 'block');
                $('#myforms').html(data);
                $('#myTemplatesEmptyState').css('display', 'none');
                updateTabCount('myTemplates');
            } else {
                $('#myforms').css('display', 'none');
                $('#myTemplatesEmptyState').css('display', 'block');
                swal({
                    type: 'error',
                    title: 'Error',
                    text: 'Failed to load templates'
                });
            }
        },
        error: ajaxErrorHandler
    });
}

// Load Sent tab
function loadSent() {
    const currentUrl = window.location.href.split('?')[0];
    const newUrl = `${currentUrl}?viewName=SentDocuments`;
    window.history.pushState(null, '', newUrl);

    $('#myforms').empty().hide();
    $('#sendDoc').empty().hide();
    $('#receiveDoc').empty().hide();
    $('#refferedDoc').empty().hide();

    switchToTab('sent');

    $.ajax({
        type: 'GET',
        url: sentFormsPartialUrl,
        beforeSend: function () {
            showShimmer('#sendDoc', 4);
        },
        complete: function () {
            clearShimmer('#sendDoc');
        },
        success: function (data) {
            if (data != null) {
                $('#sendDoc').css('display', 'block');
                $('#sendDoc').html(data);
                $('#sentEmptyState').css('display', 'none');
                updateTabCount('sent');
            } else {
                $('#sendDoc').css('display', 'none');
                $('#sentEmptyState').css('display', 'block');
            }
        },
        error: ajaxErrorHandler
    });
}

// Load Received tab
function loadReceived() {
    const currentUrl = window.location.href.split('?')[0];
    const newUrl = `${currentUrl}?viewName=RecievedDocuments`;
    window.history.pushState(null, '', newUrl);

    $('#myforms').empty().hide();
    $('#sendDoc').empty().hide();
    $('#receiveDoc').empty().hide();
    $('#refferedDoc').empty().hide();

    switchToTab('received');

    $.ajax({
        type: 'GET',
        url: receivedFormsPartialUrl,
        beforeSend: function () {
            showShimmer('#receiveDoc', 4);
        },
        complete: function () {
            clearShimmer('#receiveDoc');
        },
        success: function (data) {
            if (data != null) {
                $('#receiveDoc').css('display', 'block');
                $('#receiveDoc').html(data);
                $('#receivedEmptyState').css('display', 'none');
                updateTabCount('received');
            } else {
                $('#receiveDoc').css('display', 'none');
                $('#receivedEmptyState').css('display', 'block');
            }
        },
        error: ajaxErrorHandler
    });
}

// Load Referred tab
function loadReferred() {
    const currentUrl = window.location.href.split('?')[0];
    const newUrl = `${currentUrl}?viewName=RefferedDocuments`;
    window.history.pushState(null, '', newUrl);

    $('#myforms').empty().hide();
    $('#sendDoc').empty().hide();
    $('#receiveDoc').empty().hide();
    $('#refferedDoc').empty().hide();

    switchToTab('referred');

    $.ajax({
        type: 'GET',
        url: referredFormsPartialUrl,
        beforeSend: function () {
            showShimmer('#refferedDoc', 4);
        },
        complete: function () {
            clearShimmer('#refferedDoc');
        },
        success: function (data) {
            if (data != null) {
                $('#refferedDoc').css('display', 'block');
                $('#refferedDoc').html(data);
                $('#referredEmptyState').css('display', 'none');
                updateTabCount('referred');
            } else {
                $('#refferedDoc').css('display', 'none');
                $('#referredEmptyState').css('display', 'block');
            }
        },
        error: ajaxErrorHandler
    });
}

// Render a lightweight shimmer skeleton in the target container.
function showShimmer(containerSelector, rows) {
    try {
        var $cont = $(containerSelector);
        if (!$cont || $cont.length === 0) return;
        $cont.css('display', 'block');
        $cont.html('');
        var wrapper = $('<div/>').addClass('shimmer-wrapper');
        rows = rows || 5;
        for (var i = 0; i < rows; i++) {
            var card = $("<div/>").addClass('shimmer-card');
            var icon = $("<div/>").addClass('shimmer-rect shimmer-icon');
            var middle = $("<div/>").css('display', 'flex').css('flex-direction', 'column').css('gap', '6px').css('min-width', '0');
            var title = $("<div/>").addClass('shimmer-rect shimmer-title');
            var meta = $("<div/>").addClass('shimmer-rect shimmer-meta');
            middle.append(title).append(meta);
            var right = $("<div/>").css('display', 'flex').css('flex-direction', 'column').css('gap', '8px').css('align-items', 'flex-end');
            var status = $("<div/>").addClass('shimmer-rect shimmer-status');
            var action = $("<div/>").addClass('shimmer-rect shimmer-action');
            right.append(status).append(action);
            card.append(icon).append(middle).append(right);
            wrapper.append(card);
        }
        $cont.append(wrapper);
    } catch (e) {
        console.warn('shimmer error', e);
    }
}

function clearShimmer(containerSelector) {
    try {
        var $cont = $(containerSelector);
        if (!$cont || $cont.length === 0) return;
        // If server returned real content it will replace; otherwise clear wrapper
        $cont.find('.shimmer-wrapper').remove();
    } catch (e) {
        console.warn('clear shimmer error', e);
    }
}

// Update tab counts
function updateTabCount(tabName) {
    setTimeout(function () {
        let count = 0;

        if (tabName === 'myTemplates') {
            count = $('#myforms table tbody tr').length || $('#myforms .card').length || 0;
        } else if (tabName === 'sent') {
            count = $('#sendDoc table tbody tr').length || $('#sendDoc .card').length || 0;
        } else if (tabName === 'received') {
            count = $('#receiveDoc table tbody tr').length || $('#receiveDoc .card').length || 0;
        } else if (tabName === 'referred') {
            count = $('#refferedDoc table tbody tr').length || $('#refferedDoc .card').length || 0;
        }

        $(`#badge-${tabName}`).text(count);
    }, 500);
}


// Legacy function - now handled by loadMyTemplates()
function myforms() {
    loadMyTemplates();
}



function openModal() {
    $('#DocType_Modal').show();
}

function CloseButton() {
    isFileUploaded = false;
    const fileInput = document.getElementById('File');
    if (fileInput) fileInput.value = '';

    const radioBtn = document.querySelector(`input[name="documentOption"][value="${'option2'}"]`);
    if (radioBtn) radioBtn.checked = true;

    const dropzone = document.getElementById('filedropzone');
    if (dropzone) dropzone.style.display = 'block';

    const docDiv = document.getElementById('docname');
    if (docDiv) docDiv.innerHTML = "";

    const continueBtn = document.getElementById('ContinueButton');
    if (continueBtn) continueBtn.disabled = true;

    $('#DocType_Modal').hide();
}

function CreateButton() {
    const navOverlay = document.getElementById("navigationNetworkOverlay");
    if (navOverlay) {
        navOverlay.style.display = "block";
    }
    $('#DocType_Modal').hide();
}

function open_file() {
    const fileInput = document.getElementById('File');
    if (fileInput) {
        fileInput.click();
    }
}

async function fileSelect(e) {

    let file = e.target.files[0];

    if (

        (file.type !== "application/pdf") && (file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    ) {
        let docDiv = document.getElementById('docname');
        if (docDiv) {
            docDiv.innerHTML = 'Only pdf,docx are supported';
            docDiv.style.color = 'red';
        }
        return false;
    }

    let acceptableSize = false;
    let acceptableExt = false;
    if (PerpareDocumentContext.filesizerestrict < file.size) {
        let docDiv = document.getElementById('docname');
        if (docDiv) {
            docDiv.innerHTML = "Document size should be less than " + PerpareDocumentContext.filesize + " MB";
            docDiv.style.color = 'red';
        }
        return false;
    }

    acceptableSize = true;


    acceptableExt = true;




    var len = file.name.length;
    if (len > 40) {
        let docDiv = document.getElementById('docname');
        if (docDiv) {
            docDiv.innerHTML = 'File name length should be less than 40 characters';
            docDiv.style.color = 'red';
        }
        return false;
    }


    if (!acceptableSize || !acceptableExt) {
        let docDiv = document.getElementById('docname');
        if (docDiv) {
            docDiv.innerHTML = 'Something went wrong. Try after sometime or Contact Administrator';
            docDiv.style.color = 'red';
        }
        return false;
    }

    if (file) {
        const reader = new FileReader();
        reader.onload = async function (event) {
            let docDiv = document.getElementById('docname');
            if (!docDiv) return;

            docDiv.innerHTML = "";
            docDiv.style.color = 'black';
            let loaderSpan = document.createElement('span');
            loaderSpan.className = 'loaderfile';

            docDiv.appendChild(loaderSpan);

            if (file.type == "application/pdf") {

                if (await checkprotectedorsigned(file)) {

                } else {
                    return false
                }

                const filebase64String = event.target.result.split(',')[1];
                const fileBase64Input = document.getElementById('FileBase64');
                if (fileBase64Input) fileBase64Input.value = filebase64String;


            } else {

                var convertedfile = await convertDocxToPDF(file)
                if (PerpareDocumentContext.filesizerestrict < convertedfile.size) {
                    let docDiv = document.getElementById('docname');
                    if (docDiv) {
                        docDiv.innerHTML = "Converted Document size is more than " + PerpareDocumentContext.filesize + " MB";
                        docDiv.style.color = 'red';
                    }
                    return false;
                }

                const fileBase64Input2 = document.getElementById('FileBase64');
                if (fileBase64Input2) fileBase64Input2.value = await fileToBase64(convertedfile)



            }


            docDiv.innerHTML = "";
            let img = document.createElement("img");
            if (file.type === "application/pdf") {
                img.src = `${appBaseUrl}img/pdf image.png`;
            } else {
                img.src = `${appBaseUrl}img/docx image.png`;
            }

            img.alt = "PDF";
            img.style.width = '30px'
            img.style.height = '30px'
            img.style.marginRight = '10px'



            let fileNameinside = document.createElement("span");
            fileNameinside.textContent = file.name;

            docDiv.appendChild(img);
            docDiv.appendChild(fileNameinside);

            const continueBtn = document.getElementById('ContinueButton');
            if (continueBtn) continueBtn.disabled = false;

        };
        reader.readAsDataURL(file);
    }





    isFileUploaded = true;

    const fileNameInput = document.getElementById('FileName');
    if (fileNameInput) fileNameInput.value = file.name;


}

var dragAndDropableDiv = $(".dropzone");
dragAndDropableDiv.on('dragenter', function (e) {
    console.log("hi");
});

dragAndDropableDiv.on('dragover', function (e) {
    e.stopPropagation();
    e.preventDefault();

});

//If user drop File on DropArea
dragAndDropableDiv.on("drop", async (event) => {

    event.preventDefault();
    file = event.originalEvent.dataTransfer.files[0];

    if (

        (file.type !== "application/pdf") && (file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    ) {

        let docDiv = document.getElementById('docname');
        if (docDiv) {
            docDiv.innerHTML = 'Only pdf,docx are supported';
            docDiv.style.color = 'red';
        }
        return false;
    }

    let acceptableSize = false;
    let acceptableExt = false;


    if (PerpareDocumentContext.filesizerestrict < file.size) {
        FileError("Document size should be less than " + PerpareDocumentContext.filesize + " MB")
        return false;
    }

    acceptableSize = true;




    acceptableExt = true;

    var len = file.name.length;
    if (len > 40) {
        let docDiv = document.getElementById('docname');
        if (docDiv) {
            docDiv.innerHTML = 'File name length should be less than 40 characters';
            docDiv.style.color = 'red';
        }
        return false;
    }

    if (!acceptableSize || !acceptableExt) {
        let docDiv = document.getElementById('docname');
        if (docDiv) {
            docDiv.innerHTML = 'Something went wrong. Try after sometime or Contact Administrator';
            docDiv.style.color = 'red';
        }
        return false;
    }




    if (file) {
        const reader = new FileReader();
        reader.onload = async function (event) {
            let docDiv = document.getElementById('docname');
            if (!docDiv) return;

            docDiv.innerHTML = "";
            docDiv.style.color = 'black';
            let loaderSpan = document.createElement('span');
            loaderSpan.className = 'loaderfile';

            docDiv.appendChild(loaderSpan);

            if (file.type == "application/pdf") {

                if (await checkprotectedorsigned(file)) {

                } else {
                    return false
                }

                const filebase64String = event.target.result.split(',')[1];
                const fileBase64Input = document.getElementById('FileBase64');
                if (fileBase64Input) fileBase64Input.value = filebase64String;
            } else {

                var convertedfile = await convertDocxToPDF(file)
                if (PerpareDocumentContext.filesizerestrict < convertedfile.size) {
                    let docDiv = document.getElementById('docname');
                    if (docDiv) {
                        docDiv.innerHTML = "Converted Document size is more than " + PerpareDocumentContext.filesize + " MB";
                        docDiv.style.color = 'red';
                    }
                    return false;
                }

                const fileBase64Input2 = document.getElementById('FileBase64');
                if (fileBase64Input2) fileBase64Input2.value = await fileToBase64(convertedfile)



            }

            docDiv.innerHTML = "";
            let img = document.createElement("img");
            if (file.type === "application/pdf") {
                img.src = `${appBaseUrl}img/pdf image.png`;
            } else {
                img.src = `${appBaseUrl}img/docx image.png`;
            }


            img.alt = "PDF";
            img.style.width = '30px'
            img.style.height = '30px'
            img.style.marginRight = '10px'



            let fileNameinside = document.createElement("span");
            fileNameinside.textContent = file.name;

            docDiv.appendChild(img);
            docDiv.appendChild(fileNameinside);

            const continueBtn = document.getElementById('ContinueButton');
            if (continueBtn) continueBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }



    isFileUploaded = true;

    const fileNameInput = document.getElementById('FileName');
    if (fileNameInput) fileNameInput.value = file.name;

});

function handleOptionChange(value) {
    console.log(value)
    if (value === 'option1') {
        const fileInput = document.getElementById('File');
        if (fileInput) fileInput.value = '';

        isFileUploaded = false;

        const docDiv = document.getElementById('docname');
        if (docDiv) docDiv.innerHTML = "";

        const dropzone = document.getElementById('filedropzoneWrapper');
        if (dropzone) dropzone.style.display = 'none';

        const continueBtn = document.getElementById('ContinueButton');
        if (continueBtn) continueBtn.disabled = false;

        const existingDoc = document.getElementById('ExistingDoc');
        if (existingDoc) existingDoc.value = 'false';

        const blankDoc = document.getElementById('BlankDoc');
        if (blankDoc) blankDoc.value = 'true';

    }
    else if (value === 'option2') {
        const dropzone = document.getElementById('filedropzoneWrapper');
        if (dropzone) dropzone.style.display = 'block';

        const continueBtn = document.getElementById('ContinueButton');
        if (continueBtn) continueBtn.disabled = true;

        const existingDoc = document.getElementById('ExistingDoc');
        if (existingDoc) existingDoc.value = 'true';

        const blankDoc = document.getElementById('BlankDoc');
        if (blankDoc) blankDoc.value = 'false';
    }
    const radioButton = document.querySelector(`input[name="documentOption"][value="${value}"]`);


    if (radioButton) {
        radioButton.checked = true;
    }
}
function closemodal() {
    $("#digitalShowModal").modal('hide');
}




async function convertDocxToPDF(wordFile) {
    try {
        let formData = new FormData();
        formData.append("file", wordFile);
        let response = await fetch("/ConvertToPdf/ConvertFile", { // Adjust the API endpoint
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
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


function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.readAsDataURL(file); // Read file as Base64
        reader.onload = () => resolve(reader.result.split(',')[1]); // Extract Base64 part
        reader.onerror = error => reject(error);
    });
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



async function checkprotectedorsigned(file) {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
        reader.readAsArrayBuffer(file);
        reader.onload = async function () {
            const arrayBuffer = reader.result;

            try {
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;

                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const annotations = await page.getAnnotations();

                    const hasSignature = annotations.some(ann =>
                        ann.subtype === 'Widget' && ann.fieldType === 'Sig'
                    );

                    if (hasSignature) {
                        const docDiv = document.getElementById('docname');
                        if (docDiv) {
                            docDiv.innerHTML = "Invalid Document, Document has already been signed."
                            docDiv.style.color = 'red';
                        }
                        resolve(false); // Document already signed
                        return;
                    }
                }

                resolve(true); // No signatures found
            } catch (error) {
                // Handle errors like password protection or general failure
                if (error.name === 'PasswordException') {
                    const docDiv = document.getElementById('docname');
                    if (docDiv) {
                        docDiv.innerHTML = "Password-protected documents are not allowed."
                        docDiv.style.color = 'red';
                    }
                }
                resolve(false); // Invalid PDF or error occurred
            }
        };

        reader.onerror = function () {
            resolve(false); // Reading error
        };
    });
}



window.handle_delegation_orgid_suid = async function (selectedorgid, selectedsuid, email) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "GET",
            url: GetDelegationbyorgidsuidUrl,
            data: {
                organizationId: selectedorgid,
                suid: selectedsuid
            },
            beforeSend: function () {
                const navOverlay = document.getElementById("navigationNetworkOverlay");
                if (navOverlay) {
                    navOverlay.style.display = "block";
                }
            },
            complete: function () {
                const navOverlay = document.getElementById("navigationNetworkOverlay");
                if (navOverlay) {
                    navOverlay.style.display = "none";
                }
            },
            success: function (response) {

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
                        $('#digitalFormModal').css('z-index', 1040);
                        let text = "";
                        swal_list.forEach(function (value) {
                            text += value + "\n";
                        });

                        console.log(swal_list);


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
                            $('#digitalFormModal').css('z-index', '');
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