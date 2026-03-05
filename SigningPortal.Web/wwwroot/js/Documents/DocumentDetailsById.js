

$(document).ready(function () {
    $('#networkOverlay').hide();
    $('#DocumentMenu').addClass('active');


    recipients.forEach((recipient, index) => {
        const email = recipient.email;
        const imgId = `thumb-${index}`;
        const loaderId = `loader-${index}`;
        sendEmailToGetThumbnail(email, imgId, loaderId);
    });



    function showTooltipsSequentially(index = 0) {
        if (index >= tooltipList.length) return;

        let tooltip = tooltipList[index];
        tooltip.show();

        setTimeout(() => {
            tooltip.hide();
            showTooltipsSequentially(index + 1);
        }, 3000);
    }


    setTimeout(() => {
        showTooltipsSequentially();
    }, 500);




    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl, {
            customClass: "custom-tooltip",
            placement: 'top',
            html: true,
        });
    });




    // conditions to show download button
    for (let k = 0; k < completesignList.length; k++) {
        completesignlist_email.push(completesignList[k].email);
    }
    for (let i = 0; i < recepients.length; i++) {
        if (recepients[i].signatureMandatory === true) {
            signatureMandatoryEmails.push(recepients[i].email);
        }

    }

    var showDownVal = false;
    var showdown = 0;
    if (recepientCount == recepients.length) {
        if (completesignlist_email.length >= mandatorycount) {
            if (signatureMandatoryEmails.length !== 0) {
                for (let j = 0; j < signatureMandatoryEmails.length; j++) {
                    if (completesignlist_email.includes(signatureMandatoryEmails[j]) === true) {
                        showdown = showdown + 1;
                    }

                }
                if (showdown === signatureMandatoryEmails.length) {
                    showDownVal = true;
                }
            }
            else {
                showDownVal = true;
            }

        }
    } else {
        if (signatureMandatoryEmails.length !== 0) {
            for (let j = 0; j < signatureMandatoryEmails.length; j++) {
                if (signatureMandatoryEmails[j].includes(completesignlist_email) === true) {
                    showdown = showdown + 1;
                }

            }
            if (showdown === signatureMandatoryEmails.length) {
                showDownVal = true;
            }
        }
    }

    if (showDownVal) {
        console.log(showDownVal);
        $('#downloadbutton').show();
        $('#downloadbutton').show();
    } else {
        console.log(showDownVal);
        $('#downloadbutton').hide();
    }

    getDocdetails(documentid);


    // Initial call to display the date and time immediately on load

    updateTimestamps_statuspage();
    updateDatestamps();


    setTimeout(function () {
        document.querySelectorAll(".convert-time.date-only").forEach(function (element) {
            element.textContent = element.textContent.split(" ")[0]; // Keep only DD/MM/YYYY
        });
    }, 0);


    $("#recallbutton").on("click", function () {
        Recall();
    });


    $("#downloadbutton").on("click", function () {
        downloadDoc(DocumentFileName, DocedmsId);
    });

    $("#Viewdetails").on("click", function () {
        ViewDataDetails();
    });
        
    $(".signBtn").on("click", function () {
        const docId = $(this).data("docid");
        Signbuttonhandle(docId);
    });

    $(".retryBtn").on("click", function () {
        const docId = $(this).data("docid");
        signActionConfigByDocIdOnclick(docId);
    });

    $(".check-status-icon").on("click", function () {
        let suid = $(this).data("suid"); // fetch from data attribute
        checkstatus(this, suid);
    });

    $("#exportAdminReportBtn").on("click", function () {
        handleGeneratepdf();
    });

    $("#closebutton").on("click", function () {
        CloseButton();
    });


});



var completesignlist_email = [];
var signatureMandatoryEmails = [];
// Example JavaScript to dynamically update the progress based on the "status" property

var steps = document.querySelectorAll('.steps .circle');
var line = document.querySelector('.progress-bar .indicator');

var docdetailsresponse = {};
var reporttimeglobal = '';



function sendEmailToGetThumbnail(email, imgId, loaderId) {
    $.ajax({
        type: "POST",
        url: OrgDetailsByEmailUrl,
        headers: {

            'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

        },
        data: { email: email },
        success: function (response) {
            const userdetails = response.userProfile;
            const imgUrl = userdetails?.selfieThumbnail;
            document.getElementById(loaderId).style.display = "none";
            document.getElementById(imgId).style.display = "flex";
            document.getElementById(imgId).src = `data:image/jpeg;base64,${imgUrl}`;
        },
        error: ajaxErrorHandler
    });
}

async function Signbuttonhandle(docId) {

    if (viewname == 'ReferedDocuments') {
        signActionByDocIdForReferedDocOnclick(docId);
    } else {
        signActionConfigByDocIdOnclick(docId);
    }


}

async function signActionByDocIdForReferedDocOnclick(docId) {
    try {
        const response = await $.ajax({
            type: 'POST',
            url: IsDocumentBlocked,
            headers: {

                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

            },
            data: {
                docId: docId,
            }
        });

        if (!response.success) {
            swal({
                type: 'info',
                title: 'Info',
                text: response.message,
            });
        } else {
            var delegation_req_data = {
                id: loginOrgUid,
                suid: suid,
                email: loginemail,
            };
            var hasDelegationFound = false;

            // Await the response from delegation check
            var delegation_response = await handle_delegation_orgid_suid_selfloginuser(delegation_req_data);

            if (delegation_response != undefined && delegation_response.listdata.length > 0) {
                hasDelegationFound = true;
            }

            if (hasDelegationFound) {
                console.log("Delegation found. Further processing stopped.");
                swal({
                    type: 'info',
                    title: 'Info',
                    text: "Currently having an active delegation.\nDelegatee: " + delegation_response.swallist.join(', '),
                });
                return false; // Stop further execution
            } else {
                const url = new URL(signActionByDocIdForReferedDoc, window.location.origin);
                url.searchParams.append('?docId=', docId);
                url.searchParams.append('&viewName=', viewName)
                window.location.href = url.toString();


            }
        }
    } catch (error) {
        ajaxErrorHandler(error);
    }
}

async function signActionConfigByDocIdOnclick(docId) {
    try {
        const response = await $.ajax({
            type: 'POST',
            url: IsDocumentBlocked,
            headers: {

                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

            },
            data: {
                docId: docId,
            }
        });

        if (!response.success) {
            swal({
                type: 'info',
                title: 'Info',
                text: response.message,
            });
        } else {
            var delegation_req_data = {
                id: loginOrgUid,
                suid: suid,
                email: loginemail,
            };
            var hasDelegationFound = false;

            // Await the response from delegation check
            var delegation_response = await handle_delegation_orgid_suid_selfloginuser(delegation_req_data);

            if (delegation_response != undefined && delegation_response.listdata.length > 0) {
                hasDelegationFound = true;
            }

            if (hasDelegationFound) {
                console.log("Delegation found. Further processing stopped.");
                swal({
                    type: 'info',
                    title: 'Info',
                    text: "Currently having an active delegation.\nDelegatee: " + delegation_response.swallist.join(', '),
                });
                return false; // Stop further execution
            } else {
                const url = new URL(SignActionConfigByDocId, window.location.origin);
                url.searchParams.append('?docId=', docId);
                url.searchParams.append('&viewName=', viewName)
                window.location.href = url.toString();


            }
        }
    } catch (error) {
        ajaxErrorHandler(error);
    }
}


async function handle_delegation_orgid_suid_selfloginuser(delegation_req_data) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "GET",
            url: GetDelegationbyorgidsuidUrl,
            data: {
                organizationId: delegation_req_data.id,
                suid: delegation_req_data.suid
            },
            beforeSend: function () {
                $('#overlay').show();
            },
            complete: function () {
                $('#overlay').hide();
            },
            success: function (response) {
                if (response.success === true) {
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

                    let response_data_obj = {
                        swallist: swal_list,
                        listdata: list_data,
                        delegateeid: response.result[0]?.delegationId || '',
                    };

                    resolve(response_data_obj);
                } else {
                    swal({
                        title: "Error",
                        text: response.message || "Unknown error occurred",
                        type: "error",
                    }, function (isConfirm) {
                        if (isConfirm) {
                            const urlval = new URL(IndexDocuments, window.location.origin);

                            window.location.href = urlval.toString();
                        }
                    });
                    resolve(false);
                }
            },
            error: function (error) {
                ajaxErrorHandler(error);
                resolve(false);
            }
        });
    });
}



function updateDateTime() {
    const now = new Date();

    // Extract date components
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so add 1
    const year = now.getFullYear();

    // Extract time components (24-hour format)
    const hours = String(now.getHours()).padStart(2, '0'); // Keep it in 24-hour format
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // Format the final date and time string (24-hour format)
    const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;

    // Update global variable and display the date-time
    reporttimeglobal = formattedDateTime.toString();
    document.getElementById('currentDateTime').innerText = formattedDateTime;
}

// Update every second

setInterval(updateDateTime, 1000);

function updateProgressBar(step, color) {
    steps.forEach((stepElement, index) => {
        stepElement.classList[index < step ? 'add' : 'remove']('active');
    });

    // Calculate the width of the progress bar based on the step
    var width = ((step - 1) / (steps.length - 1)) * 100;
    line.style.width = width + '%';
    line.style.background = color;

}

// function to update colors of progress bar/status bar
function updateCircleColors(step, color) {
    steps.forEach((stepElement, index) => {
        stepElement.style.borderColor = index < step ? color : '#e0e0e0';
        stepElement.style.color = index < step ? color : '#e0e0e0';
    });
}

// Recall function
function Recall() {

    console.log(documentid);
    swal({
        type: 'info',
        title: "Message",
        text: "Are you sure to recall document?",
        closeOnConfirm: true,
        showCancelButton: true,
    }, function (isConfirm) {
        if (isConfirm) {
            $.ajax({
                url: Recallurl,
                method: 'PUT',
                headers: {

                    'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

                },
                dataType: 'json',
                data: { documentid: documentid }, // Stringify the data
                success: function (data) {
                    console.log(data);
                    if (data.success) {
                        swal({
                            type: 'info',
                            title: "Server Message",
                            text: data.message,
                            showCancelButton: false,
                            closeOnConfirm: true
                        }, function (isConfirm) {
                            if (isConfirm) {
                                window.location.reload();
                            }
                        });
                    } else {
                        swal({
                            type: 'info',
                            title: "Server Message",
                            text: data.message,
                            showCancelButton: false,
                            closeOnConfirm: true
                        }, function (isConfirm) {

                        });
                    }
                },
                //error: function (error) {
                //    console.error('Error recalling file:', error);
                //    swal({ type: 'info', title: "recall file", text: "Failed to recall file", showCancelButton: false, closeOnConfirm: true }, function (isConfirm) {
                //        if (isConfirm) {
                //        }
                //    });
                //}
                error: ajaxErrorHandler
            });
        } else {

        }
    });

}
function CloseButton() {

    $('#Details_Modal').modal('hide');

}



//qrcode data funtcionality

function ViewDataDetails() {

    $('#Details_Modal').modal('show');

    var dataToSend = docdetailsresponse;

    $.ajax({

        // Adjust to your actual controller/action
        url: ViewDetails,
        type: 'GET',

        contentType: 'application/json',

        data: { docid: documentid },

        success: function (response) {

            $('#overlay').hide();

        },

        error: function (error) {

            $('#overlay').hide();

            console.error('Error:', error);

        }

    });

}





function handleGeneratepdf() {
    var reporttimeval = reporttimeglobal;
    if (docdetailsresponse.documentDetails.multiSign) {
        var signedOnValue = $("#completedOn").text().trim();
        var expiryOnValue = $("#expiryOn").text().trim();
        var preparedOnValue = $("#preparedOn").text().trim();

        var signatoryDetailsList = [];

        $(".signatorieslists").each(function () {
            var signatory = {};

            // Extract Signatory Email
            var email = $(this).find("td:contains('Signatory Email')").next().next().text().trim();

            // Extract Requested On
            var requestedOn = $(this).find("td:contains('Requested On')").next().next().text().trim();

            // Extract Signed On
            var signedOn = $(this).find("td:contains('Signed On')").next().next().text().trim();

            // Store in object
            signatory.Email = email;
            signatory.RequestedOn = requestedOn;
            signatory.SignedOn = signedOn;

            var reqdataval = docdetailsresponse.signatoryDetails.find((item) => item.recepientEmail === email);
            reqdataval.signingReqTime = requestedOn;
            reqdataval.signingCompleteTime = signedOn;
            signatoryDetailsList.push(reqdataval);
            // Push to list
            // signatoryDetailsList.push(signatory);
        });
        console.log(signatoryDetailsList);
        docdetailsresponse.documentDetails.createdAt = preparedOnValue;
        docdetailsresponse.documentDetails.expireAt = expiryOnValue;
        docdetailsresponse.documentDetails.completedAt = signedOnValue;
        docdetailsresponse.signatoryDetails = signatoryDetailsList;
    }
    else {
        var signedOnValue = $("#completedOn").text().trim();
        var expiryOnValue = $("#expiryOn").text().trim();
        var preparedOnValue = $("#preparedOn").text().trim();

        // Create an object with these values
        var signatoryDetails = {
            signedOn: signedOnValue,
            expiryOn: expiryOnValue,
            preparedOn: preparedOnValue
        };
        docdetailsresponse.documentDetails.createdAt = preparedOnValue;
        docdetailsresponse.documentDetails.expireAt = expiryOnValue;
        docdetailsresponse.documentDetails.completedAt = signedOnValue;

    }
    var datasent = docdetailsresponse;

    $('#overlay').css('z-index', 1000000000).show();


    var viewModel = {
        DocumentDetails: datasent.documentDetails,
        SignatoryDetails: datasent.signatoryDetails,
        ReportGeneration: reporttimeglobal,
    }
    console.log(JSON.stringify(viewModel));
    $.ajax({
        type: "POST", // Change from GET to POST
        url: GetGeneratePdf,
        headers: {

            'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

        },
        data: JSON.stringify(viewModel),

        contentType: "application/json", // Ensure correct Content-Type
        dataType: "json",
        processData: false,
        beforeSend: function () {
            $('#overlay').css('z-index', 1000000000).show();
        },
        complete: function () {
            $('#overlay').hide().css('z-index', '');
        },
        success: function (data) {
            $('#overlay').hide().css('z-index', '');
            if (data.status === "Success") { // Fix casing issue (data.Status, not data.status)
                saveByteArray("DocumentDetails", data.result); // Save PDF
            } else {
                console.error(data.message);
            }
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });


}



function saveByteArray(name, bytes) {

    var myBytes = base64ToArrayBuffer(bytes);

    var blob = new Blob([myBytes], { type: "application/pdf" });

    var link = document.createElement('a');

    link.href = window.URL.createObjectURL(blob);

    let fileName = name + ".pdf";

    link.download = fileName;

    link.click()

    $('#overlay').hide();

}



function base64ToArrayBuffer(base64) {

    var binaryString = window.atob(base64);

    var binaryLen = binaryString.length;

    var bytes = new Uint8Array(binaryLen);

    for (var i = 0; i < binaryLen; i++) {

        var ascii = binaryString.charCodeAt(i);

        bytes[i] = ascii;

    }

    return bytes;
}
function getDocdetails(docid) {

    $.ajax({

        url: DocumentDetails,

        method: 'GET',

        contentType: 'application/json',

        data: { docid: docid },  // Corrected variable name

        success: function (data) {

            if (data.success === false) {

                console.log(data);

                //docdetailsdata = data;

            } else {

                console.log(data);

                docdetailsresponse = data.result;

                $('#documentname').html(data.result.documentDetails.documentName);

                $('#preparedBy').html(data.result.documentDetails.ownerName);

                if (data.result.documentDetails.ownerEmail === loginemail) {

                    $('#exportAdminReportBtn').removeClass('classshide');

                } else {
                    $('#exportAdminReportBtn').addClass('classshide');
                }
                let createdate = convertToLocalTime(data.result.documentDetails.createdAt);
                let finalcreatedate = formatDateToDDMMYYYYtime(createdate);

                // let createday = String(createdate.getDate()).padStart(2, '0');

                // let createmonth = String(createdate.getMonth() + 1).padStart(2, '0');

                // let createyear = createdate.getFullYear();

                // let createhours = createdate.getHours();

                // let createminutes = String(createdate.getMinutes()).padStart(2, '0');

                // let createseconds = String(createdate.getSeconds()).padStart(2, '0');



                // // Convert to 12-hour format and determine AM/PM

                // let period = createhours >= 12 ? 'PM' : 'AM';

                // createhours = createhours % 12 || 12; // Convert 0 hour to 12



                // let createtime = ' ' + String(createhours).padStart(2, '0') + ':' + createminutes + ':' + createseconds + ' ' + period;

                // Expire date

                let expiredate = convertToLocalTime(data.result.documentDetails.expireAt);
                let finalexpiredate = formatDateToDDMMYYYYtime(expiredate);
                // let expireday = String(expiredate.getDate()).padStart(2, '0');

                // let expiremonth = String(expiredate.getMonth() + 1).padStart(2, '0');

                // let expireyear = expiredate.getFullYear();

                // let expirehours = expiredate.getHours();

                // let expireminutes = String(expiredate.getMinutes()).padStart(2, '0');

                // let expireseconds = String(expiredate.getSeconds()).padStart(2, '0');



                // // Convert to 12-hour format and determine AM/PM for expiretime

                // let expirePeriod = expirehours >= 12 ? 'PM' : 'AM';

                // expirehours = expirehours % 12 || 12; // Convert 0 hour to 12



                // let expiretime = ' ' + String(expirehours).padStart(2, '0') + ':' + expireminutes + ':' + expireseconds + ' ' + expirePeriod;



                // Completed date

                let completeddate = convertToLocalTime(data.result.documentDetails.completedAt);
                let finalcompletedate = formatDateToDDMMYYYYtime(completeddate);
                // let completedday = String(completeddate.getDate()).padStart(2, '0');

                // let completedmonth = String(completeddate.getMonth() + 1).padStart(2, '0');

                // let completedyear = completeddate.getFullYear();

                // let completedhours = completeddate.getHours();

                // let completedminutes = String(completeddate.getMinutes()).padStart(2, '0');

                // let completedseconds = String(completeddate.getSeconds()).padStart(2, '0');



                // // Convert to 12-hour format and determine AM/PM for completedtime

                // let completedPeriod = completedhours >= 12 ? 'PM' : 'AM';

                // completedhours = completedhours % 12 || 12; // Convert 0 hour to 12



                // let completedtime = ' ' + String(completedhours).padStart(2, '0') + ':' + completedminutes + ':' + completedseconds + ' ' + completedPeriod;





                $('#status').html(data.result.documentDetails.signingStatus);



                $('#preparedOn').html(`${finalcreatedate}`);

                //$('#preparedTime').html(`${createtime}`);

                $('#expiryOn').html(`${finalexpiredate}`);

                //$('#expiryTime').html(`${expiretime}`);



                $('#completedOn').html(`${finalcompletedate}`);

                //$('#completedTime').html(`${completedtime}`);

                if (!data.result.documentDetails.multiSign) {

                    $('#signedBy').html('Self');



                } else {

                    $('#signedBy').html('Others (Others may include self)');

                    $('#preparatorAccountType').html(data.result.documentDetails.organization.accountType);
                    if (data.result.documentDetails.organization.accountType == 'self') {

                        $('#prepareorgnamerow').css('display', 'none');

                    }
                    else {

                        $('#prepareorgnamerow').css('display', 'contents');

                        $('#preparatorOrganizationName').html(data.result.documentDetails.organization.organizationName);

                    }


                }
                if (data.result.signatoryDetails.length > 1) {
                    $('#disableorderrow').css('display', 'contents');
                    if (data.result.documentDetails.disableOrder) {

                        $('#disableOrder').html('Random');

                    }
                    else {
                        $('#disableOrder').html('Sequential');

                    }
                } else {
                    $('#disableorderrow').css('display', 'none');
                }


            }

        },

        error: ajaxErrorHandler

    });

}

//function to download the signed Document
function downloadDoc(fileName, fieldID) {
    $('#overlay').show();
    $.ajax({
        url: DownloadSignedDocument,
        method: 'GET',
        contentType: 'application/json',
        data: { fileName: fileName, edmsid: fieldID },
        success: function (data) {
            if (data.success === false) {
                $('#overlay').hide();
                swal({ type: 'info', title: "Download file", text: data.message, showCancelButton: false, closeOnConfirm: true }, function (isConfirm) {
                    if (isConfirm) {

                    }
                });

            } else {

                // Extract the Base64 string from data.result.fileContents
                var base64String = data.result.fileContents; // Assuming data.result.fileContents holds the Base64 string

                // Decode the Base64 string to get the binary data
                var byteCharacters = atob(base64String);
                var byteNumbers = new Array(byteCharacters.length);

                for (var i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }

                // Convert the binary data to a Blob object
                var byteArray = new Uint8Array(byteNumbers);
                var blob = new Blob([byteArray], { type: 'application/octet-stream' });

                // Create an object URL for the Blob
                var url = window.URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;

                var parts = fileName.split('.');

                // Extract the base name (everything before the last ".")
                var baseName = parts.slice(0, -1).join('.');

                // Extract the extension (everything after the last ".")
                var extension = parts.pop();

                if (extension !== 'pdf') {
                    var pdfFileName = baseName + '.pdf';
                    fileName = pdfFileName;
                }

                a.download = fileName;

                // Append the link to the body
                document.body.appendChild(a);

                // Trigger a click on the link to start the download
                a.click();

                // Remove the link from the body
                document.body.removeChild(a);

                // Release the object URL
                window.URL.revokeObjectURL(url);
                $('#overlay').hide();
            }
        },
        error: ajaxErrorHandler
    });
}

function checkstatus(ele, suid) {

    ele.classList.add('fa-spin');


    $.ajax({
        url: IsDocumentBlocked,
        type: 'GET',
        data: { suid: suid, docId: documentid },
        success: function (res) {
            console.log("Status Response:", res);
            if (res.success == true || res.success == false) {
                setTimeout(function () {
                    ele.classList.remove('fa-spin');
                }, 2000);
                if (res.result != 'Signing_Pending' && res.result != 'Signing_in_Progress') {
                    window.location.reload();
                }

            }

        },
        error: function (err) {
            console.error("Error checking status", err);
        }
    });
}

window.SignedDocCheck = function (docid, status) {
    if (documentid == docid) {
        window.location.reload();
    }
};
