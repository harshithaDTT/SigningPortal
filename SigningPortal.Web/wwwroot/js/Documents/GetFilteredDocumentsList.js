

var documentsobjectslist = [];
var selectedIdListData = [];
var currentPage = 0;
var pageSize = 5;
var totalRecords = 0;
var shimmer;

let currentSentAjaxRequest = null;

//Get these parameters from query parameters
var status = getQueryParam('status') || 'In Progress';
var actionRequired = getQueryParam('action_required') === 'true';
var expiredSoon = getQueryParam('expired_soon') === 'true';
if (expiredSoon) {
    document.getElementById("Filterheading").innerHTML = "Expiring Soon Documents";
}
else {
    document.getElementById("Filterheading").innerHTML = "Action Required Documents";
}
$(document).ready(function () {

    $('#DocumentMenu').addClass('active');
    $('#networkOverlay').hide();
    $('#actionCardsContainer').empty();

    // Initial load
    fetchDocuments();

    function fetchDocuments() {

        shimmer = showShimmer(pageSize);

        if (currentSentAjaxRequest) {
            currentSentAjaxRequest.abort();
        }

        currentSentAjaxRequest = $.ajax({
            url: GetPaginatedFilteredDocumentsList,
            type: 'POST',
            dataType: 'json',
            headers: {

                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

            },
            data: {
                start: currentPage * pageSize,
                length: pageSize,
                status: status,
                action_required: actionRequired,
                expired_soon: expiredSoon,
                searchValue: $('#searchInput').val()?.trim() || ''
            },
            success: function (res) {

                shimmer.remove();

                totalRecords = res.recordsFiltered || 0;

                if (totalRecords > 0) {
                    $("#docsSearchContainer").css("display", "flex");
                }

                const selectAllCheckbox = document.getElementById('selectAllCheckbox');
                const selectAllCheckboxlabel = document.getElementById('selectAllCheckboxlabel');

                if (res.data.length === 0 && currentPage === 0) {

                    $('#actionCardsContainer').empty();
                    $('#noDataMessageAction').show();
                    $('#showMoreBtnAction').hide();
                    $('#allDocsLoadedMsgAction').hide();

                    if (selectAllCheckbox) selectAllCheckbox.style.display = 'none';
                    if (selectAllCheckboxlabel) selectAllCheckboxlabel.style.display = 'none';

                    return;
                }

                $('#noDataMessageAction').hide();

                if (loginAccounttype.toString().toLowerCase() !== 'self') {
                    if (selectAllCheckbox) selectAllCheckbox.style.display = 'block';
                    if (selectAllCheckboxlabel) selectAllCheckboxlabel.style.display = 'block';
                }

                renderAndAppendCards(res.data, totalRecords);

                // Pagination handling
                if ((currentPage + 1) * pageSize >= totalRecords) {
                    $('#showMoreBtnAction').hide();

                    if (totalRecords > pageSize) {
                        $('#allDocsLoadedMsgAction')
                            .show()
                            .text(`All documents loaded (${totalRecords})`);
                    }
                } else {
                    $('#showMoreBtnAction').show();
                    $('#allDocsLoadedMsgAction').hide();
                }
            }
        });
    }

    /* =======================
       EVENT HANDLERS
    ======================= */

    $(document).on("click", ".redirect-card", function () {
        const id = $(this).data("id");
        redirectToDocumentDetails(id);
    });

    $(document).on("click", ".checkboxContainer", function (event) {
        event.stopPropagation();
        const checkbox = $(this).find("input")[0];
        toggleRowHighlight(checkbox);
    });

    const actions = {
        signActionConfigByDocIdOnclick: (id, current, total) =>
            signActionConfigByDocIdOnclick(id, current, total),
        redirectToDocumentDetails: (id) =>
            redirectToDocumentDetails(id)
    };

    $(document).on("click", ".action-btn", function (event) {
        event.stopPropagation();

        const action = $(this).data("action");
        const id = $(this).data("id");
        const current = $(this).data("current");
        const total = $(this).data("total");

        if (actions[action]) {
            actions[action](id, current, total);
        }
    });

    $('#showMoreBtnAction').on('click', function () {
        currentPage++;
        $('#showMoreBtnAction').hide();
        fetchDocuments();
    });

    $('#searchButton').on('click', function () {

        currentPage = 0;
        $('#actionCardsContainer').empty();
        $('#allDocsLoadedMsgAction').hide();
        $('#noDataMessageAction').hide();

        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        const selectAllCheckboxlabel = document.getElementById('selectAllCheckboxlabel');

        if (loginAccounttype.toString().toLowerCase() !== 'self') {
            if (selectAllCheckbox) selectAllCheckbox.style.display = 'block';
            if (selectAllCheckboxlabel) selectAllCheckboxlabel.style.display = 'block';
        }

        $('#showMoreBtnAction').hide();
        fetchDocuments();
    });

    $("#selectAllCheckbox").on("change", function () {
        toggleSelectAll(this);
    });

    $("#groupSignBtn").on("click", function () {
        performGroupSigningAction();
    });

});



function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}


async function renderAndAppendCards(data, total) {

    let container = $('#actionCardsContainer');

    const promises = data.map((item, index) => {
        return generateDocumentCardHtml(item, loginSuid);
    });

    const cards = await Promise.all(promises);
    shimmer.remove();
    container.append(cards.join(''));
    updateTimestamps();

}






function showShimmer(count) {
    let shimmerHtml = `<div class="shimmer-wrapper">`;
    for (let i = 0; i < count; i++) {
        shimmerHtml += `<div class="shimmer-item"></div>`;
    }
    shimmerHtml += `</div>`;
    const $shimmer = $(shimmerHtml);
    $('#actionCardsContainer').append($shimmer);

    // Scroll to the bottom of the shimmer once added
    setTimeout(() => {
        $shimmer[0]?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 10); // slight delay for DOM paint

    return $shimmer;
}

function cropFileNames(full) {

    // Adjust crop lengths based on screen width
    let start, end;

    const width = window.innerWidth;

    if (width >= 1300) {
        start = 25;
        end = 25;
    } else if (width >= 768) {
        start = 20;
        end = 20;
    } else if (width >= 460) {
        start = 13;
        end = 13;
    }
    else { // Small screens (mobiles)
        start = 10;
        end = 10;
    }

    if (full && full.length > start + end) {
        return full.slice(0, start) + '...' + full.slice(-end);
    } else {
        return full
    }



}


function cropSentListNames(full) {

    const start = 50;


    if (full && full.length > start) {
        return full.slice(0, start) + '...';
    } else {
        return full
    }

}


function getAllRecepientsNames(item) {
    if (!item || !Array.isArray(item.recepients)) return "";

    return item.recepients
        .map(recepient => toProperCase(recepient.name))
        .filter(name => name) // remove any undefined/null/empty names
        .join(", ");
}

function toProperCase(str) {
    if (!str) return "";
    return str
        .toLowerCase()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}




function getViewName(doc) {
    let docViewname = "";
    let userEmail = loginEmail;
    if (doc.ownerEmail === userEmail) {
        if (doc.multiSign) {
            docViewname = "SentDocuments";
        }
        else {
            docViewname = "MyDocuments";
        }
    } else {
        const isExists = doc.pendingSignList[0]?.email === userEmail;
        const isInPendingList = doc.pendingSignList?.some(signer => signer.email === userEmail);
        //the document is from Recieved
        if (isExists || (doc.disableOrder && isInPendingList)) {
            docViewname = "RecievedDocuments";
        } else {

            senderDisplay = `${doc.ownerName} `;
            actionText = 'referred you a document';
            isReferred = true;
            docViewname = "ReferedDocuments";
        }
    }
    return docViewname;
}

// function toggleCheckboxes() {
//     const containers = document.querySelectorAll('.checkboxContainer');
//     const button = document.getElementById('toggleCheckboxesBtn');
//     const signingButtonGroup = document.getElementById('signingButtonGroup');

//     // Determine if any checkbox container is currently visible
//     const anyVisible = Array.from(containers).some(container => container.style.display === 'block');

//     if (anyVisible) {
//         // Hide containers and uncheck all checkboxes
//         containers.forEach(container => {
//             container.style.display = 'none';
//             const checkboxes = container.querySelectorAll('input[type="checkbox"]');
//             checkboxes.forEach(cb => cb.checked = false);
//         });

//         // Hide signing button group if visible
//         if (signingButtonGroup && signingButtonGroup.style.display === 'inline-flex') {
//             signingButtonGroup.style.display = 'none';
//         }

//         // Update button text and style
//         button.textContent = 'Select Documents';
//         button.classList.remove('select-mode');
//         button.classList.add('default-mode');

//     } else {
//         // Show all checkbox containers
//         containers.forEach(container => {
//             container.style.display = 'block';
//         });

//         // Update button text and style
//         button.textContent = 'Cancel Selection';
//         button.classList.remove('default-mode');
//         button.classList.add('select-mode');
//     }
// }

function fetchTooltipMessage(organizationID) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: GetOrganizationStatusUrl,
            type: 'GET',
            dataType: 'json',
            data: { loginorgUid: organizationID },
            error: function (xhr, status, error) {
                ajaxErrorHandler(xhr, status, error);
                resolve({ success: false, message: 'Error checking organization status' });
            },
            success: function (response) {
                resolve(response);
            }
        });
    });
}

async function generateDocumentCardHtml(item, suid) {
    let documentName = await cropFileNames(item.documentName);
    let createdAt = item.createdAt;
    let expireDate = item.expireDate;
    let viewName = getViewName(item);
    var matchedEsealData = {};
    var matchedSignData = {};
    var matchedQrcodeData = {};
    let recepientsNames = getAllRecepientsNames(item);
    let croppedRecepientsNames = cropSentListNames(recepientsNames);

    let owner = item.ownerName.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    let ownerName = owner;


    let docStatusHtml = renderDocumentStatusHtml(item);
    let signingStatusHtml = renderSigningStatusHtml(item, suid);
    var docStatusHtmlval = docStatusHtml.toLocaleLowerCase();

    let actionButtonHtml = renderActionButtonHtml(item, suid, viewName);
    let showActionButton = !actionButtonHtml.toLowerCase().includes("view");
    if (item.annotations != null && item.annotations != "{ }") {
        var signconfig = JSON.parse(item.annotations);
        for (const key in signconfig) {
            if (signconfig.hasOwnProperty(key) && key === suid) {
                matchedSignData[key] = signconfig[key];
            }
        }
    }
    if (item.qrcodeannotations != null && item.qrcodeannotations != "{ }") {
        var qrcodeconfig = JSON.parse(item.qrcodeannotations);
        for (const key in qrcodeconfig) {
            if (qrcodeconfig.hasOwnProperty(key) && key === suid) {
                matchedQrcodeData[key] = qrcodeconfig[key];
            }
        }
    }
    if (item.esealannotations != null && item.esealannotations != "{ }") {

        var esealconfig = JSON.parse(item.esealannotations);

        for (const key in esealconfig) {
            if (esealconfig.hasOwnProperty(key) && key === suid) {
                matchedEsealData[key] = esealconfig[key];
            }
        }

    }


    let docobject = {
        id: item.id,
        annotations: matchedSignData,
        esealannotations: matchedEsealData,
        qrcodeannotations: matchedQrcodeData,
        docname: documentName

    }
    console.log(docobject);
    var val = docobject.id;
    if (!documentsobjectslist.some(doc => doc.id === val)) {
        documentsobjectslist.push(docobject);

    }
    const masterCheckbox = document.getElementById('selectAllCheckbox');
    var isAllSelected = masterCheckbox.checked;

    const hasSignOrRetry =
        actionButtonHtml.includes('sign') || actionButtonHtml.includes('retry');

    var signingstatusval = signingStatusHtml.toLowerCase();

    if (signingstatusval !== 'need to sign' && signingstatusval !== 'failed' && !hasSignOrRetry) {
        isAllSelected = false;
    }
    var makeDisabled = false;
    if (!hasSignOrRetry) {
        makeDisabled = true;
    }
    var tooltipmessage = 'Document is not available';
    if (docStatusHtmlval.includes('expired')) {
        tooltipmessage = 'Document got expired';
    } else if (signingstatusval.includes('signed')) {
        tooltipmessage = 'Document is already signed';
    } else if (docStatusHtmlval.includes('recalled')) {
        tooltipmessage = 'Document is not available for signing';
    } else if (signingstatusval.includes('signing in progress')) {
        tooltipmessage = 'Document signing is already initiated';
    } else if (signingstatusval.includes('signing')) {
        tooltipmessage = 'Document signing is already initiated';
    }
    if (Object.keys(matchedEsealData).length !== 0) {
        const orgResponse = await fetchTooltipMessage(matchedEsealData[suid].organizationID);
        console.log(orgResponse);
        if (!orgResponse.success) {
            tooltipmessage = 'Organization not authorized for eSeal operation';
            makeDisabled = true;
        }
    }

    const id = item._id || item.id;
    if (isAllSelected) {
        selectedIdListData.push(id);
    }
    if (loginAccounttype.toString().toLowerCase() !== 'self') {
        var anyVisible = true;
    } else {
        var anyVisible = false;
    }

    const selectedCountDisplay = document.getElementById('selectedCount');
    if (selectedCountDisplay) {
        selectedCountDisplay.innerText = `(${selectedIdListData.length})`;
    }

    return `
            <div class="card mb-3 shadow-sm border rounded-3 p-1 pl-2 pr-2 onhoverclass ${isAllSelected ? 'card-selected' : ''} redirect-card" style="cursor:pointer;" data-id="${id}" >
                <div class="d-flex flex-row flex-sm-column flex-xl-row justify-content-start justify-content-xl-between align-items-start align-items-xl-center">
                    <div class="d-flex align-items-center gap-3 flex-grow-1">
                        <div class=" checkboxContainer align-self-start mt-3 mr-1 align-self-sm-center mt-sm-0 mr-sm-0 custom-checkbox-wrapper ${makeDisabled ? 'disabled' : ''}" style="display:${anyVisible ? " block" : "none"};" >
                        <input type="checkbox" class="custom-checkbox document-checkbox "
                            id="doc_${id}" value="${id}"
                            ${isAllSelected ? 'checked' : ''}
                            ${makeDisabled ? 'disabled' : ''}>
                            <label for="doc_${id}" class="custom-checkmark">
                                <svg class="check-icon" viewBox="0 0 24 24">
                                    <path d="M20 6L9 17l-5-5" fill="none" stroke="white" stroke-width="3" />
                                </svg>
                            </label>
                            <div class="tooltip-message">${tooltipmessage}</div>
                    </div>
                    <!-- Mobile View: Shown only on small screens -->
                    <div class="d-flex d-sm-none flex-column gap-2 mt-2 w-100">

                        <div class="row align-items-center">
                            <!-- Left Content: Document Info -->
                            <div class="col-10">

                                <!-- Document Name -->
                                <div class="small fw-semibold" style="font-size:14px;font-weight:600;">
                                    <span class="text-dark">Document Name:</span>
                                    <span class="fw-bold text-dark">
                                        ${documentName}
                                    </span>
                                </div>


                                <!-- Created and Expiry Dates -->
                                <div class="small fw-semibold">
                                    <span class="text-dark">Created Date:</span>
                                    <span class="convert-time" data-timestamp="${createdAt}">${createdAt}</span>
                                </div>

                                <div class="small fw-semibold">
                                    <span class="text-dark">Expiry Date:</span>
                                    <span class="convert-time" data-timestamp="${expireDate}">${expireDate}</span>
                                </div>


                                <!-- Document Status -->
                                <div class="small fw-semibold">
                                    <span class="text-dark">Document Status:</span>
                                    <span class="fw-bold docstats-text">
                                        ${docStatusHtml}
                                    </span>
                                </div>

                                <!-- My Sign Status -->
                                <div class="small fw-semibold">
                                    <span class="text-dark">My Sign Status:</span>
                                    <span class="fw-bold signingstats-text">
                                        ${signingStatusHtml}
                                    </span>
                                </div>
                            </div>

                            <!-- Chevron Icon on the Right -->
                            <div class="col-2 d-flex justify-content-end">
                                <div style="
                                            background-color: #E8F5E9;
                                            width: 28px;
                                            height: 28px;
                                            border-radius: 50%;
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                        ">
                                    <i class="fa fa-chevron-right" style="font-size: 12px; color: #2e7d32;"></i>
                                </div>
                            </div>
                        </div>
                        <!-- Sign Summary and Actions -->
                        ${showActionButton ? `
                                    <div class="d-flex align-items-center justify-content-end w-100">
                                        ${actionButtonHtml}
                                    </div>
                                    ` : ''}
                    </div>




                    <div class="d-none d-sm-flex align-items-center justify-content-center rounded-circle mr-3"
                        style="background-color: #E8F5E9; width: 50px; height: 50px;">
                        <img width="24" height="24" src="${appBaseUrl}img/get-signed.png" />

                    </div>
                    <div class="d-none d-sm-flex flex-column text-truncate">
                        <h5 class="mb-1 fw-semibold text-dark" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 16px !important;" ${documentName != item.documentName ? `title="${item.documentName}"` : ''}>
                            ${documentName}
                        </h5>
                        <p class="sent-by p-0 m-0">
                            ${viewName == "MyDocuments"
            ? 'You initiated document.'
            : viewName === "SentDocuments" ? `Sent to: <span class="sender-badge" ${croppedRecepientsNames != recepientsNames ? `title="${recepientsNames}"` : ''} >${croppedRecepientsNames}</span>`
                : `Received From: <span class="sender-badge">${ownerName}</span>`}
                        </p>

                        <div class="text-muted small d-flex flex-wrap">
                            Created: <span class="convert-time" data-timestamp="${createdAt}">${createdAt}</span>  <span class="mx-1 pl-1 pr-1">•</span> Expires: <span class="convert-time" data-timestamp="${expireDate}" > ${expireDate} </span>
                        </div>
                    </div>
                </div>
                <div class="d-none d-sm-flex justify-content-between align-items-center align-items-xl-start gap-4 doc-stats-container">
                    <div class="stats-container mr-5">
                        <div class="docstats-heading">Document Status</div>
                        <div class="gap-1 docstats-text">
                            ${docStatusHtml}
                        </div>
                        <div class="d-flex align-items-center">
                            <i style="font-size:small;color:#919aa3;margin-right:6px;" class="fa-solid fa-user-group"></i>
                            <span class="small" style="color:#919aa3;font-size:15px;" > ${item.completeSignList.length} of ${item.recepientCount} signed</span>
                        </div>
                    </div>

                    <div class="stats-container mr-3" style="min-width:130px;">
                        <div class="signingstats-heading">My Sign Status</div>
                        <div class="gap-1 signingstats-text">
                            ${signingStatusHtml}
                        </div>
                    </div>
                    <div class="d-flex align-self-center gap-1 px-3" style="align-self:center;">
                        ${actionButtonHtml}
                    </div>
                </div>
            </div>
        </div>
                                         `;
}



function renderDocumentStatusHtml(item) {

    let className = {
        "Completed": "completebtn",
        "In Progress": "inprogressbtn",
        "Declined": "Declinedbtn"
    }[item.status] || "otherbtn";

    let popupHtml = "";

    if (item.status === "Completed") {
        let signers = (item.completeSignList || []).map(val => {

            let datasuid = val.suid;
            let html = '';

            (item.recepients || []).forEach(i => {
                if (i.suid === datasuid) {
                    const alternates = i.alternateSignatories || [];

                    if (i.hasDelegation) {
                        // Render the first alternate signatory with a bullet
                        if (alternates.length > 0) {
                            html += `<li class="first-email" style="display:flex;justify-content:start;">
                                                                          <span class="sec" style="padding-left:6%">${alternates[0].email}</span>
                                                                        </li>`;
                        }

                        // Render the remaining alternate signatories without bullets
                        for (let j = 1; j < alternates.length; j++) {
                            html += `<li class="no-bullet" style="display:flex;">
                                                                      <span class="sec" style="padding-left:6%">${alternates[j].email}</span>
                                                                    </li>`;
                        }

                        // Render the delegator label and email
                        html += `<li class="no-bullet delegator-section" style="display:flex;">
        <span class="sec" style="padding-left:6%">Delegator:</span>
    </li>
    <li class="no-bullet delegator-section" style="display:flex;">
        <span class="sec" style="padding-left:6%">${val.email}</span>
    </li>`;

                    } else if (alternates.length > 0) {
                        html += `<li class="first-email" style="display:flex;justify-content:start;">
                                                                    <span class="sec" style="padding-left:6%">${val.email}</span>
                                                                  </li>
                                          <li class="no-bullet delegator-section" style="display:flex;">
                                            <span class="sec" style="padding-left:6%">Alternative Signatories:</span>
                                          </li>`;

                        alternates.forEach(alt => {
                            html += `<li class="no-bullet" style="display:flex;">
                                              <span class="sec" style="padding-left:6%">${alt.email}</span>
                                            </li>`;
                        });

                    } else {
                        html += `<li class="first-email" style="display:flex;justify-content:start;">
                                            <span class="sec" style="padding-left:6%">${val.email}</span>
                                          </li>`;
                    }
                }
            });



            return html;
        }).join('');
        popupHtml = `
    <div class='popup'>
        <p class='header'><span class='headersp'>TOTAL RECIPIENTS: ${item.recepientCount}</span></p>
        <div class='row'>
            <p style='text-align:left'>SIGNED: ${item.completeSignList?.length || 0}</p>
            <ul class='email-list' style='margin-bottom:0;'>${signers}</ul>
        </div>
    </div>`;
    }
    else if (item.status === "In Progress") {
        let signers = (item.completeSignList || []).map(val => {
            let datasuid = val.suid;
            let html = '';

            (item.recepients || []).forEach(i => {
                if (i.suid === datasuid) {
                    const alternates = i.alternateSignatories || [];

                    if (i.hasDelegation) {
                        // Render the first alternate signatory with a bullet
                        if (alternates.length > 0) {
                            html += `<li class="first-email" style="display:flex;justify-content:start;">
                                                                              <span class="sec" style="padding-left:6%">${alternates[0].email}</span>
                                                                            </li>`;
                        }

                        // Render the remaining alternate signatories without bullets
                        for (let j = 1; j < alternates.length; j++) {
                            html += `<li class="no-bullet" style="display:flex;">
                                                                          <span class="sec" style="padding-left:6%">${alternates[j].email}</span>
                                                                        </li>`;
                        }

                        // Render the delegator label and email
                        html += `<li class="no-bullet delegator-section" style="display:flex;">
        <span class="sec" style="padding-left:6%">Delegator:</span>
    </li>
    <li class="no-bullet delegator-section" style="display:flex;">
        <span class="sec" style="padding-left:6%">${val.email}</span>
    </li>`;

                    } else if (alternates.length > 0) {
                        html += `<li class="first-email" style="display:flex;justify-content:start;">
                                                                        <span class="sec" style="padding-left:6%">${val.email}</span>
                                                                      </li>
                                              <li class="no-bullet delegator-section" style="display:flex;">
                                                <span class="sec" style="padding-left:6%">Alternative Signatories:</span>
                                              </li>`;

                        alternates.forEach(alt => {
                            html += `<li class="no-bullet" style="display:flex;">
                                                  <span class="sec" style="padding-left:6%">${alt.email}</span>
                                                </li>`;
                        });

                    } else {
                        html += `<li class="first-email" style="display:flex;justify-content:start;">
                                                <span class="sec" style="padding-left:6%">${val.email}</span>
                                              </li>`;
                    }
                }
            });




            return html;
        }).join('');

        let pendings = (item.pendingSignList || []).map(val => {
            let datasuid = val.suid;
            let html = '';

            (item.recepients || []).forEach(i => {
                if (i.suid === datasuid) {
                    const alternates = i.alternateSignatories || [];

                    if (i.hasDelegation) {
                        // Render the first alternate signatory with a bullet
                        if (alternates.length > 0) {
                            html += `<li class="first-email" style="display:flex;justify-content:start;">
                                                                              <span class="sec" style="padding-left:6%">${alternates[0].email}</span>
                                                                            </li>`;
                        }

                        // Render the remaining alternate signatories without bullets
                        for (let j = 1; j < alternates.length; j++) {
                            html += `<li class="no-bullet" style="display:flex;">
                                                                          <span class="sec" style="padding-left:6%">${alternates[j].email}</span>
                                                                        </li>`;
                        }

                        // Render the delegator label and email
                        html += `<li class="no-bullet delegator-section" style="display:flex;">
        <span class="sec" style="padding-left:6%">Delegator:</span>
    </li>
    <li class="no-bullet delegator-section" style="display:flex;">
        <span class="sec" style="padding-left:6%">${val.email}</span>
    </li>`;

                    } else if (alternates.length > 0) {
                        html += `<li class="first-email" style="display:flex;justify-content:start;">
                                                                        <span class="sec" style="padding-left:6%">${val.email}</span>
                                                                      </li>
                                              <li class="no-bullet delegator-section" style="display:flex;">
                                                <span class="sec" style="padding-left:6%">Alternative Signatories:</span>
                                              </li>`;

                        alternates.forEach(alt => {
                            html += `<li class="no-bullet" style="display:flex;">
                                                  <span class="sec" style="padding-left:6%">${alt.email}</span>
                                                </li>`;
                        });

                    } else {
                        html += `<li class="first-email" style="display:flex;justify-content:start;">
                                                <span class="sec" style="padding-left:6%">${val.email}</span>
                                              </li>`;
                    }
                }
            });




            return html;
        }).join('');

        if (item.completeSignList && item.completeSignList.length > 0) {
            popupHtml = `
                                                <div class='popup'>
                                                    <p class='header'><span class='headersp'>TOTAL RECIPIENTS: ${item.recepientCount}</span></p>
                                                    <div class='row'>
                                                         <p style='text-align:left'>SIGNED: ${item.completeSignList?.length || 0}</p>
                                                         <ul class='email-list' style='margin-bottom:0;'>${signers}</ul>
                                                        <p style='text-align:left'>PENDING: ${item.pendingSignList?.length || 0}</p>
                                                        <ul class='email-list' style='margin-bottom:0;'>${pendings}</ul>
                                                    </div>
                                                </div>`;
        }
        else {
            popupHtml = `
                                                <div class='popup'>
                                                    <p class='header'><span class='headersp'>TOTAL RECIPIENTS: ${item.recepientCount}</span></p>
                                                    <div class='row'>
                                                        <p style='text-align:left'>PENDING: ${item.pendingSignList?.length || 0}</p>
                                                        <ul class='email-list' style='margin-bottom:0;'>${pendings}</ul>
                                                    </div>
                                                </div>`;
        }

    }


    if (item.status == "In Progress") {
        return `
    <div class='status-container' style='position: relative; display: inline-block;'>
        <span class='${className} redirect-card' style='cursor:pointer;'  data-id="${item.id}" >Signatures Pending</span>
        ${popupHtml}
    </div>`;
    }


    return `
    <div class='status-container' style='position: relative; display: inline-block;'>
        <span class='${className} redirect-card' style='cursor:pointer;' data-id="${item.id}">${item.status}</span>
        ${popupHtml}
    </div>`;
}

function renderSigningStatusHtml(item, suid) {
    let rec = (item.recepients || []).find(r => r.suid === suid);

    let statusMap = {
        "Need to sign": "<div class='inprogressbtn'>Need To Sign</div>",
        "Waiting_for_Others": "<div class='inprogressbtn'>Waiting for Others</div>",
        "Signing_Pending": "<div class='inprogressbtn'>In Progress</div>",
        "Signing_in_progress": "<div class='inprogressbtn'>In Progress</div>",
        "Pin_Failed": "<div class='Declinedbtn'>Failed</div>",
        "Failed": "<div class='Declinedbtn'>Failed</div>",
        "Rejected": "<div class='Declinedbtn'>Rejected</div>",
        "Signed": "<div class='completebtn'>Signed</div>"
    };

    if (!rec) {
        let loginrecpdata = null;

        (item.recepients || []).forEach(r => {
            (r.alternateSignatories || []).forEach(alternativeSignatory => {
                if (alternativeSignatory.suid === suid) {
                    loginrecpdata = r;
                }
            });
        });
        if (!loginrecpdata || !loginrecpdata.status) {
            return "<div >---</div>";
        }
        return statusMap[loginrecpdata.status] || "<div>---</div>";
    }

    return statusMap[rec.status] || "<div>---</div>";
}

function renderActionButtonHtml(item, suid, viewName) {
    if (viewName == "ReferedDocuments") {
        const baseBtn = "btn btn-success deepGreen-bgcolor no-margin";
        const style = "font-size:small;padding:4px 12px;max-width:90px;width:100%;text-transform: none !important;";
        const id = item._id || item.id;

        const allRecipients = item.recepients || [];
        const pendingSignList = item.pendingSignList || [];
        const completeSignList = item.completeSignList || [];

        const allList = [...completeSignList, ...pendingSignList];
        let matchingRecipient = null;

        // Helper to check if user is in alternate signatories
        const isUserAlternateFor = (recipient) => {
            return (recipient.alternateSignatories || []).some(alt => alt.suid === suid);
        };

        const findRecipientWithAltMatch = () => {
            for (const recipient of allRecipients) {
                if (isUserAlternateFor(recipient)) {
                    return recipient;
                }
            }
            return null;
        };

        const renderButton = (icon, label, action) => {
            if (action === "signActionConfigByDocIdOnclick") {
                return `<button type='button' class='${baseBtn} action-btn' style='${style}' 
                             data-action='${action}' 
                             data-id='${id}' 
                             data-current='${currentDocNo}' 
                             data-total='${totalDocs}'>
                    <i class='${icon}'></i>&nbsp;${label}
                    </button>`;
                                }
                                return `<button type='button' class='${baseBtn} action-btn' style='${style}' 
                         data-action='${action}' 
                         data-id='${id}'>
                    <i class='${icon}'></i>&nbsp;${label}
                    </button>`;
        };

        if (item.status === "In Progress") {
            if (!item.disableOrder) {
                const firstUser = pendingSignList.length > 0 ? pendingSignList[0] : null;

                if (firstUser) {
                    const firstRecipient = allRecipients.find(r => r.suid === firstUser.suid);

                    if (firstRecipient && isUserAlternateFor(firstRecipient)) {
                        matchingRecipient = firstRecipient;

                        if ((matchingRecipient.status === "Failed" || matchingRecipient.status === "Pin Failed") &&
                            matchingRecipient.signedBy === userEmail) {
                            return renderButton("fa-solid fa-arrow-rotate-left", "Retry", "signActionConfigByDocIdOnclick");
                        } else if (["Signing_in_Progress", "Signing_Pending", "Waiting_for_Others", "Signed", "Rejected"].includes(matchingRecipient.status)) {
                            return renderButton("fa-regular fa-eye", "View", "redirectToDocumentDetails");
                        } else {
                            return renderButton("fa fa-pencil", "Sign", "signActionConfigByDocIdOnclick");
                        }
                    } else {
                        return renderButton("fa-regular fa-eye", "View", "redirectToDocumentDetails");
                    }
                }
            } else {

                matchingRecipient = findRecipientWithAltMatch();
                if (matchingRecipient) {
                    if ((matchingRecipient.status === "Failed" || matchingRecipient.status === "Pin_Failed") &&
                        matchingRecipient.signedBy === userEmail) {
                        return renderButton("fa-solid fa-arrow-rotate-left", "Retry", "signActionConfigByDocIdOnclick");
                    } else if (["Signing_in_Progress", "Signing_Pending", "Waiting_for_Others", "Signed", "Rejected"].includes(matchingRecipient.status)) {
                        return renderButton("fa-regular fa-eye", "View", "redirectToDocumentDetails");
                    } else {
                        return renderButton("fa fa-pencil", "Sign", "signActionConfigByDocIdOnclick");
                    }
                } else {
                    return renderButton("fa-regular fa-eye", "View", "redirectToDocumentDetails");
                }

            }
        }

        return renderButton("fa-regular fa-eye", "View", "redirectToDocumentDetails");
    }
    else {
        let rec = (item.recepients || []).find(r => r.suid === suid);

        const pendingSignList = item.pendingSignList || [];

        let baseBtn = "btn btn-success deepGreen-bgcolor no-margin";
        let style = "font-size:small;padding:4px 12px;max-width:90px;width:100%;text-transform: none !important;";
        let id = item.id || item._id;

        if (!rec) return `<button type='button' class='${baseBtn} redirect-card' data-id="${id}" style='${style}'>
        <i class='fa-regular fa-eye'></i>&nbsp;View</button>`;



        if (item.status === "In Progress") {
            if (item.disableOrder) {
                switch (rec.status) {
                    case "Need to sign":
                        return `<button type='button' class='${baseBtn}' style='${style}' onclick='event.stopPropagation();signActionConfigByDocIdOnclick("${id},"${viewName}")'>
        <i class='fa fa-pencil'></i>&nbsp;Sign</button>`;
                    case "Signing_Pending":
                    case "Signing_in_Progress":
                    case "Waiting_for_Others":
                    case "Rejected":
                    case "Signed":
                        return `<button type='button' class='${baseBtn} redirect-card' style='${style}' data-id="${id}">
        <i class='fa-regular fa-eye'></i>&nbsp;View</button>`;
                    case "Pin_Failed":
                    case "Failed":
                        return `<button type='button' class='${baseBtn}' style='${style}' onclick='event.stopPropagation(); signActionConfigByDocIdOnclick("${id}","${viewName}")'>
        <i class='fa-solid fa-arrow-rotate-left'></i>&nbsp;Retry</button>`;
                    default:
                        return `<button type='button redirect-card' class='${baseBtn} redirect-card' style='${style}' data-id="${id}">
        <i class='fa-regular fa-eye'></i>&nbsp;View</button>`;
                }
            } else {
                if (pendingSignList[0].suid === suid) {
                    switch (rec.status) {
                        case "Need to sign":
                            return `<button type='button' class='${baseBtn}' style='${style}' onclick='event.stopPropagation();signActionConfigByDocIdOnclick("${id}", "${viewName}")'>
        <i class='fa fa-pencil'></i>&nbsp;Sign</button>`;
                        case "Signing_Pending":
                        case "Signing_in_Progress":
                        case "Waiting_for_Others":
                        case "Rejected":
                        case "Signing in progress":
                        case "Signed":
                            return `<button type='button' class='${baseBtn} redirect-card' style='${style}' data-id="${id}">
        <i class='fa-regular fa-eye'></i>&nbsp;View</button>`;
                        case "Pin_Failed":
                        case "Failed":
                            return `<button type='button' class='${baseBtn}' style='${style}' onclick='event.stopPropagation();signActionConfigByDocIdOnclick("${id}","${viewName}")'>
        <i class='fa-solid fa-arrow-rotate-left'></i>&nbsp;Retry</button>`;
                        default:
                            return `<button type='button' class='${baseBtn} redirect-card' style='${style}' data-id="${id}">
        <i class='fa-regular fa-eye'></i>&nbsp;View</button>`;
                    }
                } else {
                    return `<button type='button' class='${baseBtn} redirect-card' style='${style}' data-id="${id}">
        <i class='fa-regular fa-eye'></i>&nbsp;View</button>`;
                }
            }
        }

        return `<button type='button' class='${baseBtn} redirect-card' style='${style}' data-id="${id}">
        <i class='fa-regular fa-eye'></i>&nbsp;View</button>`;
    }

}



function redirectToDocumentDetails(id) {

    const masterCheckbox = document.getElementById('selectAllCheckbox');
    masterCheckbox.checked = false;

    // Construct the URL for the action
    var url = DocumentDetailsByIdUrl+"/" + id;
    // Redirect to the URL
    const urlval = new URL(url, window.location.origin);

    window.location.href = urlval.toString();
}


async function signActionConfigByDocIdOnclick(docId, viewName) {

    const masterCheckbox = document.getElementById('selectAllCheckbox');
    masterCheckbox.checked = false;
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
                id: loginorgUid,
                suid: loginSuid,
                email: loginEmail,
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

                if (viewName == "ReferedDocuments") {
                    const url = new URL(SignActionByDocIdForReferedDoc, window.location.origin);
                    url.searchParams.append('?docId=', docId);
                    url.searchParams.append('&viewName=', viewName)
                    window.location.href = url.toString();
                }
                else {
                    const url = new URL(SignActionConfigByDocId, window.location.origin);
                    url.searchParams.append('?docId=', docId);
                    url.searchParams.append('&viewName=', viewName)
                    window.location.href = url.toString();
                }

            }
        }
    } catch (error) {
        ajaxErrorHandler(error);
    }
}


async function SignActionByDocIdForReferedDocIdOnclick(docId) {

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
                id: loginorgUid,
                suid: loginSuid,
                email: loginEmail,
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

                var viewName = "ReferedDocuments";
                const url = new URL(SignActionByDocIdForReferedDoc, window.location.origin);
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


function toggleRowHighlight(checkbox) {
    const cardElement = checkbox.closest('.card');
    const signingStatusEl = cardElement.querySelector('.signingstats-text');
    const signingStatus = signingStatusEl ? signingStatusEl.textContent.trim().toLowerCase() : '';
    const actionHtml = cardElement.querySelector('button');
    //const actionHtml = actionContainer ? actionContainer.innerHTML.toLowerCase() : '';
    const hasSignOrRetry = actionHtml
        ? actionHtml.textContent.toLowerCase().includes('sign') || actionHtml.textContent.toLowerCase().includes('retry')
        : false;
    console.log(hasSignOrRetry);
    // Check if the status is not allowed
    if (checkbox.checked && !(signingStatus.includes('need to sign') || signingStatus.includes('failed'))) {
        // Show alert and uncheck the box
        swal({
            type: 'info',
            title: 'Info',
            text: 'Only documents that need to be signed or failed documents can be selected.',
            confirmButtonText: 'OK'
        });

        checkbox.checked = false;
        return; // Do not proceed with highlighting or updating
    }
    if (!hasSignOrRetry) {
        swal({
            type: 'info',
            title: 'Info',
            text: 'This document is currently not available for signing as others need to sign',
            confirmButtonText: 'OK'
        });

        checkbox.checked = false;
        return;
    }
    var responseFlag = true;
    var requireddata = documentsobjectslist.find((item) => item.id = checkbox.id);
    var matchedEsealData = requireddata.esealannotations;
    if (Object.keys(matchedEsealData).length !== 0) {
        var responseFlag = true;
        $.ajax({
            url: GetOrganizationStatusUrl,
            type: 'GET',
            dataType: 'json', // Corrected the dataType to 'json' to match the expected response type
            data: { loginorgUid: matchedEsealData[loginSuid].organizationID }, // Encapsulate loginorgUid in an object
            success: function (response) {
                if (!response.success) {
                    swal({
                        type: 'info',
                        title: 'Info',
                        text: `You can not perform eseal operation, please contact organization `
                    }, function (isConfirm) {
                        //window.location.href = '@Url.Action("Index", "Documents")?viewName=' + viewName;
                    });
                    responseFlag = false;
                } else {
                    console.log(response)
                    responseFlag = true;
                }
            },

            error: ajaxErrorHandler
        });

    }
    if (!responseFlag) {
        checkbox.checked = false;
        return;
    }

    // Proceed with visual highlighting
    if (checkbox.checked) {
        cardElement.classList.add('card-selected');
    } else {
        cardElement.classList.remove('card-selected');
    }

    // Sync "Select All"
    const allCheckboxes = document.querySelectorAll('.document-checkbox');
    const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
    document.getElementById('selectAllCheckbox').checked = allChecked;

    // Update selected ID list
    updateSelectedIdList();
}



function applySelectAllToNewlyVisibleItems() {
    const checkboxes = document.querySelectorAll('.document-checkbox');
    checkboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            checkbox.checked = true;
            const cardElement = checkbox.closest('.card');
            if (cardElement) {
                cardElement.classList.add('card-selected');
            }
        }
    });

    updateSelectedIdList();
}
let isAllSelected = false; // Global flag

function toggleSelectAll(masterCheckbox) {
    const checked = masterCheckbox.checked;
    isAllSelected = checked;

    // Get only checkboxes inside visible containers
    const visibleContainers = Array.from(document.querySelectorAll('.checkboxContainer')).filter(container => {
        return container.offsetParent !== null; // visible on screen
    });

    let checkboxes = [];
    visibleContainers.forEach(container => {
        checkboxes.push(...container.querySelectorAll('.document-checkbox'));
    });

    checkboxes.forEach(checkbox => {
        const cardElement = checkbox.closest('.card');

        if (cardElement) {
            // const signingStatusEl = cardElement.querySelector('.signingstats-text');
            // const signingStatus = signingStatusEl ? signingStatusEl.textContent.trim().toLowerCase() : '';

            // const actionButtonEl = cardElement.querySelector('.d-flex.align-items-center.gap-1.px-3 button');
            // let actionButtonType = '';
            // let hasSignOrRetry = false;

            // if (actionButtonEl) {
            // 	const btnText = actionButtonEl.textContent.trim().toLowerCase();
            // 	if (btnText.includes('sign')) {
            // 		actionButtonType = 'sign';
            // 		hasSignOrRetry = true;
            // 	} else if (btnText.includes('retry')) {
            // 		actionButtonType = 'retry';
            // 		hasSignOrRetry = true;
            // 	} else if (btnText.includes('view')) {
            // 		actionButtonType = 'view';
            // 		hasSignOrRetry = false;
            // 	}
            // }

            // if (signingStatus.includes('need to sign') || signingStatus.includes('failed')) {
            // 	if (!hasSignOrRetry) {
            // 		checkbox.checked = false;
            // 		cardElement.classList.remove('card-selected');
            // 	} else {
            // 		checkbox.checked = checked;
            // 		cardElement.classList.toggle('card-selected', checked);
            // 	}
            // } else {
            // 	checkbox.checked = false;
            // 	cardElement.classList.remove('card-selected');
            // }

            if (checkbox.disabled) {
                checkbox.checked = false;
                cardElement.classList.remove('card-selected');
            } else {
                checkbox.checked = checked;
                cardElement.classList.toggle('card-selected', checked);
            }
        }
    });

    updateSelectedIdList();
}



function applySelectAllToNewlyVisibleItems() {
    if (!isAllSelected) return;

    const checkboxes = document.querySelectorAll('.document-checkbox');
    checkboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            checkbox.checked = true;
            const cardElement = checkbox.closest('.card');
            if (cardElement) {
                cardElement.classList.add('card-selected');
            }
        }
    });

    updateSelectedIdList();
}
function statusupadteapi() {
    $.ajax({
        type: 'POST',
        url: GroupSigningStatus, // Change to your endpoint
        headers: {

            'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

        },
        contentType: 'application/json',
        data: JSON.stringify({ documentIds: selectedIdListData }),
        success: function (response) {
            console.log('Success:', response);
            swal({
                title: "info",
                text: "Document Signing is initiated.",
                type: "info",
            }, function (isConfirm) {
                console.log(response);
                if (isConfirm) {
                    const url = new URL(DocumentsSigningStatus, window.location.origin);
                    url.searchParams.append('?groupId=', response.result);
                    window.location.href = url.toString();
                }
            });

            // handle success
        },
        error: function (xhr, status, error) {
            console.error('Error:', error);
            // handle error
        }
    });
}
function performGroupSigningAction() {
    if (selectedIdListData.length === 0) {
        swal({
            title: "Info",
            text: "Please select documents for signing",
            type: "info",
        }, function (isConfirm) {
            if (isConfirm) {
                //window.location.reload();
            }
        });
        return;
    } else if (selectedIdListData.length < 2) {
        swal({
            title: "Info",
            text: "Please select at least two documents to perform Group Signing, or continue with the Normal Signing process.",
        }, function (isConfirm) {
            if (isConfirm) {
                //window.location.reload();
            }
        });
        return;
    } else if (selectedIdListData.length > 20) {
        swal({
            title: "Info",
            text: "Maximum limit reached. You can select only 20 documents.",
            type: "info",
        }, function (isConfirm) {
            if (isConfirm) {
                //window.location.reload();
            }
        });
        return;
    }
    document.getElementById('overlay7').style.display = 'flex';
    $.ajax({
        type: 'POST',
        url: PerformGroupSigning, // Change to your endpoint
        headers: {

            'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

        },
        contentType: 'application/json',
        data: JSON.stringify({ documentIds: selectedIdListData }),
        success: function (response) {
            document.getElementById('overlay7').style.display = 'none';
            console.log('Success:', response);
            if (response.success) {
                swal({
                    title: "info",
                    text: "Document Signing is initiated.",
                    type: "info",
                }, function (isConfirm) {
                    if (isConfirm) {
                        const url = new URL(DocumentsSigningStatus, window.location.origin);
                        url.searchParams.append('?groupId=', response.result);
                        window.location.href = url.toString();
                    }
                });

            } else {
                swal({
                    title: "Error",
                    text: response.message,
                    type: "error",
                }, function (isConfirm) {
                    if (isConfirm) {
                        window.location.reload();
                    }
                });

                // handle success
            }

        },
        error: function (xhr, status, error) {
            console.error('Error:', error);
            // handle error
        }
    });
}
function updateSelectedIdList() {
    const selectedCheckboxes = document.querySelectorAll('.document-checkbox:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    console.log("Selected IDs:", selectedIds);
    const selectedCountDisplay = document.getElementById('selectedCount');
    if (selectedCountDisplay) {
        selectedCountDisplay.innerText = `(${selectedIds.length})`;
    }
    const buttonGroup = document.getElementById('signingButtonGroup');
    if (buttonGroup) {
        buttonGroup.style.display = selectedIds.length > 0 ? 'inline-flex' : 'none';
    }
    selectedIdListData = selectedIds;
    window.selectedDocumentIds = selectedIds;
    const masterCheckbox = document.getElementById('selectAllCheckbox');
    if (masterCheckbox.checked && selectedIds.length === 0) {
        swal({
            title: "Info",
            text: "No documents are available for signing",
            type: "info",
        }, function (isConfirm) {

        });

        masterCheckbox.checked = false;

    }
}


function updateMasterCheckboxAndSelection() {
    const allCheckboxes = document.querySelectorAll('.document-checkbox');
    const visibleCheckboxes = Array.from(allCheckboxes).filter(cb => !cb.closest('.record').classList.contains('hidden'));
    const checkedVisible = visibleCheckboxes.filter(cb => cb.checked).length;

    const masterCheckbox = document.getElementById('selectAllCheckbox');

    if (checkedVisible === 0) {
        masterCheckbox.checked = false;
        masterCheckbox.indeterminate = false;
        isAllSelected = false;
    } else if (checkedVisible === visibleCheckboxes.length) {
        masterCheckbox.checked = true;
        masterCheckbox.indeterminate = false;
        isAllSelected = true;
    } else {
        masterCheckbox.checked = false;
        masterCheckbox.indeterminate = true;
        isAllSelected = false;
    }

    updateSelectedIdList();
}

document.getElementById("searchInput").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("searchButton").click();
    }
});

window.signActionConfigByDocIdOnclick = signActionConfigByDocIdOnclick;


