
var documentsobjectslist = [];
var previousDocNo = parseInt(localStorage.getItem("CurrentDocNo")) || 0;
var previousTotalDocs = parseInt(localStorage.getItem("TotalDocs")) || 0;
var updatedPageLength = 0;
var updatedStart = 0;

var scrollToDocNo = previousDocNo;
var shimmer;


var currentPage = 0;
var pageSize = 5;
var totalRecords = 0;

var selectedFilterTab = localStorage.getItem("selectedFilterTab");
var selectedDocumentDays = localStorage.getItem("selectedDocumentDays");
var selectedDocumentCount = localStorage.getItem("selectedDocumentCount");
var selectedDocumentStatus = localStorage.getItem("selectedDocumentStatus");
var selectedSigningStatus = localStorage.getItem("selectedSigningStatus");

$(document).ready(function () {
    $('#DocumentMenu').addClass('active');
    $('#networkOverlay').hide();
    $('#draftCardsContainer').empty();

    if ($.fn.DataTable.isDataTable('#MyListTb')) {
        $('#MyListTb').DataTable().destroy(); // Destroy the existing instance
        $('#MyListTb').empty();
    }

    var table = $('#MyListTb').DataTable({
        searching: false,
        serverSide: true,
        paging: false,
        ordering: false,
        info: false,
        lengthChange: false,
        ajax: function (data, callback, settings) {

            shimmer = showShimmer(pageSize);

            if (previousDocNo !== 0) {
                currentPage = Math.floor((previousDocNo - 1) / pageSize);
                updatedStart = 0;
                updatedPageLength = (currentPage + 1) * pageSize;
            }

            function fetchDocuments() {
                if (currentSentAjaxRequest) {
                    currentSentAjaxRequest.abort();
                }
                currentSentAjaxRequest = $.ajax({
                    url: GetDraftDocuments,
                    type: 'POST',
                    headers: {

                        'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

                    },
                    dataType: 'json',
                    data: {
                        start: previousDocNo != 0 ? updatedStart : currentPage * pageSize,
                        length: previousDocNo != 0 ? updatedPageLength : pageSize,
                        documentFilter: selectedFilterTab === "time" ? selectedDocumentDays : selectedDocumentCount,
                        documentStatus: selectedDocumentStatus,
                        signingStatus: selectedSigningStatus,
                        searchValue: localStorage.getItem("DocumentsSearchValue")?.trim() || ''
                    },

                    success: function (res) {

                        totalRecords = res.recordsFiltered;
                        if (previousTotalDocs != 0) {
                            if (totalRecords != previousTotalDocs) {
                                let delta = totalRecords - previousTotalDocs;
                                currentPage = Math.floor((previousDocNo + delta - 1) / pageSize);
                                updatedPageLength = (currentPage + 1) * pageSize;
                                previousTotalDocs = totalRecords;
                                fetchDocuments();
                                return;
                            }

                        }
                        localStorage.removeItem("CurrentDocNo");
                        localStorage.removeItem("TotalDocs");
                        previousTotalDocs = 0;
                        previousDocNo = 0;
                        if (initialLoading && totalRecords > 0) {
                            document.getElementById("docsSearchContainer").style.display = "flex";
                        }
                        initialLoading = false;

                        var showgroupbutton = document.getElementById('showButtonGroup');
                        if (res.data.length === 0 && currentPage === 0) {
                            shimmer.remove();
                            $('#draftCardsContainer').empty();
                            $('#noDataMessageDraft').show();
                            $('#showMoreBtnDraft').hide();
                            if (showgroupbutton) {
                                showgroupbutton.style.display = 'none';
                            }
                            $('#allDocsLoadedMsgDraft').hide();
                        } else {
                            $('#noDataMessageDraft').hide();
                            if (showgroupbutton && (loginAccounttype.toString().toLowerCase() !== 'self')) {
                                showgroupbutton.style.display = 'block';
                            }
                            renderAndAppendCards(res.data, totalRecords);



                            // Show "All documents are loaded" message if all data fetched
                            if ((currentPage + 1) * pageSize >= totalRecords) {
                                $('#showMoreBtnDraft').hide();
                                if (totalRecords > pageSize) {
                                    $('#allDocsLoadedMsgDraft').show();
                                    document.getElementById("allDocsLoadedMsgDraft").innerHTML = `All documents loaded (${totalRecords})`
                                }

                            } else {
                                $('#showMoreBtnDraft').show();
                                $('#allDocsLoadedMsgDraft').hide();
                            }
                        }
                    }
                });
            }

            fetchDocuments();

        },
        columns: [{ data: null, defaultContent: '' }],
        drawCallback: function () { }
    });

    $('#showMoreBtnDraft').on('click', function () {
        currentPage++;
        $('#showMoreBtnDraft').hide();
        table.ajax.reload(null, false);
    });


    getstatstics();

    $('#searchButton').on('click', function () {
        const searchValue = $('#searchInput').val();

        const val = searchValue.trim();
        if (val === "") {
            toastr.error('Please enter at least one character');
            return; // Stop execution if input is empty
        }
        localStorage.setItem("DocumentsSearchValue", searchValue);
        currentPage = 0;
        $('#draftCardsContainer').empty();
        $('#allDocsLoadedMsgDraft').hide();
        $('#noDataMessageDraft').hide();
        $('#showMoreBtnDraft').hide();
        $('#MyListTb').DataTable().ajax.reload();
    });

    $(document).on("click", ".redirect-doc", function () {
        const id = $(this).data("id");
        redirectToDocumentDetails(id); // This can be a normal function in your JS file
    });


    $(document).on("click", ".sign-button", function (event) {
        event.stopPropagation();
        const id = $(this).data("id");
        const currentDocNo = $(this).data("current");
        const totalDocs = $(this).data("total");

        signActionConfigByDocIdOnclick(id, currentDocNo, totalDocs);
    });


    $(document).on("click", ".checkboxContainer", function (event) {
        event.stopPropagation();
        const checkbox = $(this).find("input")[0];
        toggleRowHighlight(checkbox);
    });




});


function getstatstics() {
    // 1️⃣ Clear old data
    $("#Totalcount").text("");
    $("#InProgresscount").text("");
    $("#Completedcount").text("");
    $("#expiredcount").text("");

    // 2️⃣ Add shimmer
    $("#Totalcount").addClass("loading");
    $("#InProgresscount").addClass("loading");
    $("#Completedcount").addClass("loading");
    $("#expiredcount").addClass("loading");
    $.ajax({
        url: GetMydocumentsStatstics,
        type: 'GET',
        dataType: 'json',
        success: function (response) {
            console.log(response);
            if (response.success) {
                document.getElementById("Totalcount").classList.remove("loading");
                $('#Totalcount').text(response.result.total);
                document.getElementById("InProgresscount").classList.remove("loading");
                $('#InProgresscount').text(response.result.inProgress);
                document.getElementById("Completedcount").classList.remove("loading");
                $('#Completedcount').text(response.result.completed);
                document.getElementById("expiredcount").classList.remove("loading");
                $('#expiredcount').text(response.result.expired);


            } else {
                swal({
                    type: 'error',
                    title: 'Error',
                    text: response.message,
                    confirmButtonText: 'OK'
                });
                return;
            }
        },
        error: function (xhr, status, error) {
            ajaxErrorHandler(xhr, status, error);
        }
    });

}

async function renderAndAppendCards(data, total) {
    let container = $('#draftCardsContainer');

    const promises = data.map((item, index) => {
        let current = index + 1 + (currentPage * pageSize);
        if (scrollToDocNo != 0) {
            current = index + 1;
        }
        return generateDocumentCardHtml(item, loginSuid, current, total);
    }
    );

    const cards = await Promise.all(promises);
    shimmer.remove();
    container.append(cards.join(''));

    updateTimestamps();
    if (scrollToDocNo != 0) {
        requestAnimationFrame(() => {
            const targetCard = document.getElementById(`doc-${scrollToDocNo}`);
            if (targetCard) {
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

                targetCard.classList.add("active-document");

                function handleMouseMove() {
                    targetCard.classList.remove("active-document");
                }

                document.addEventListener('mousemove', handleMouseMove);



                // Add blinking effect
                targetCard.classList.remove('shadow-sm');
                targetCard.classList.add('blink-highlight');

                // Remove blinking effect after 10 seconds
                setTimeout(() => {
                    targetCard.classList.remove('blink-highlight');
                    targetCard.classList.add('shadow-sm');
                }, 5000);
            }
            scrollToDocNo = 0;
        });
    }
}






function showShimmer(count) {
    let shimmerHtml = `<div class="shimmer-wrapper">`;
    for (let i = 0; i < count; i++) {
        shimmerHtml += `<div class="shimmer-item"></div>`;
    }
    shimmerHtml += `</div>`;
    const $shimmer = $(shimmerHtml);
    $('#draftCardsContainer').append($shimmer);

    // Scroll to the bottom of the shimmer once added
    if (currentPage != 0 && scrollToDocNo == 0) {
        setTimeout(() => {
            $shimmer[0]?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 10);
    }


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
async function generateDocumentCardHtml(item, suid, current, total) {
    let documentName = await cropFileNames(item.documentName);
    let createdAt = item.createdAt || '-';
    let expireDate = item.expireDate || '-';
    var matchedEsealData = {};
    var matchedSignData = {};
    var matchedQrcodeData = {};

    let docStatusHtml = renderDocumentStatusHtml(item);
    let signingStatusHtml = renderSigningStatusHtml(item, suid);
    let actionButtonHtml = renderActionButtonHtml(item, suid, current, total);
    let showActionButton = !actionButtonHtml.toLowerCase().includes("view");
    if (item.annotations != null && item.annotations != "{}") {
        var signconfig = JSON.parse(item.annotations);
        for (const key in signconfig) {
            if (signconfig.hasOwnProperty(key) && key === suid) {
                matchedSignData[key] = signconfig[key];
            }
        }
    }
    if (item.qrcodeannotations != null && item.qrcodeannotations != "{}") {
        var qrcodeconfig = JSON.parse(item.qrcodeannotations);
        for (const key in qrcodeconfig) {
            if (qrcodeconfig.hasOwnProperty(key) && key === suid) {
                matchedQrcodeData[key] = qrcodeconfig[key];
            }
        }
    }
    if (item.esealannotations != null && item.esealannotations != "{}") {

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
    var docStatusHtmlval = docStatusHtml.toLocaleLowerCase();

    if (signingstatusval !== 'need to sign' && signingstatusval !== 'failed' && !hasSignOrRetry) {
        isAllSelected = false;
    }
    var isAllSelected = masterCheckbox.checked;
    if (signingstatusval !== 'need to sign' && signingstatusval !== 'failed' && !hasSignOrRetry) {
        isAllSelected = false;
    }
    const containers = document.querySelectorAll('.checkboxContainer');
    const anyVisible = Array.from(containers).some(container => {
        return container.style.display === 'block';
    });

    // var isallselectedvisible = masterCheckbox.display;
    console.log(anyVisible);
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

    const selectedCountDisplay = document.getElementById('selectedCount');
    if (selectedCountDisplay) {
        selectedCountDisplay.innerText = `(${selectedIdListData.length})`;
    }


    return `
                                <div class="nd-card onhoverclass redirect-doc" style="cursor:pointer;" id="doc-${current}" data-id="${id}">

                          <div class="nd-row">

                                <!-- LEFT -->
                                <div class="nd-left">

                                    <!-- CHECKBOX -->
                                    <div style="display:${anyVisible ? "block" : "none"}; margin-top: 4px;"
                                         class="checkboxContainer custom-checkbox-wrapper ${makeDisabled ? 'disabled' : ''}">

                                        <input type="checkbox"
                                               class="custom-checkbox document-checkbox"
                                               id="doc_${id}"
                                               value="${id}"
                                               ${isAllSelected ? 'checked' : ''}
                                               ${makeDisabled ? 'disabled' : ''}>

                                        <label for="doc_${id}" class="custom-checkmark">
                                            <svg class="check-icon" viewBox="0 0 24 24">
                                                <path d="M20 6L9 17l-5-5"
                                                      fill="none" stroke="white" stroke-width="3" />
                                            </svg>
                                        </label>

                                        <div class="tooltip-message">${tooltipmessage}</div>
                                    </div>

                                    <!-- ICON -->
                                    <div class="nd-icon">
                                        <i class="fa-solid fa-file-lines"></i>
                                    </div>

                                    <!-- INFO -->
                                    <div class="nd-info">
                                        <div class="nd-title" title="${item.documentName}">
                                            ${documentName}
                                        </div>

                                        <div class="nd-mobile-action">
                                            ${actionButtonHtml}
                                        </div>

                                        <div class="nd-dates">
                                            <span>Created:</span>
                                            <span class="convert-time" data-timestamp="${createdAt}">${createdAt}</span>
                                            <span class="nd-dot">•</span>
                                            <span>Expires:</span>
                                            <span class="convert-time" data-timestamp="${expireDate}">${expireDate}</span>
                                        </div>

                                        <!-- MOBILE STATUS -->
                                        <div class="nd-mobile-status">

                                            <div>
                                                <span class="nd-label">Document Status:</span>
                                                    <span class="nd-value docstats-text">${docStatusHtml}</span>
                                            </div>

                                            <div>
                                                <span class="nd-label">My Sign Status:</span>
                                                      ${signingStatusHtml}
                                            </div>

                                            <!-- BUTTON AT BOTTOM ON SMALL MOBILE -->
                                            <div class="nd-mobile-action-bottom">
                                                ${actionButtonHtml}
                                            </div>

                                        </div>
                                    </div>

                                </div>



                            <!-- RIGHT (DESKTOP) -->
                            <div class="nd-right">

                              <div class="nd-col">
                                <div class="nd-head">DOCUMENT STATUS</div>
                                    <div class="nd-val docstats-text">${docStatusHtml}</div>
                              </div>

                              <div class="nd-col">
                                <div class="nd-head">MY SIGN STATUS</div>
                                    <div class="nd-val signingstats-text">${signingStatusHtml}</div>
                              </div>

                              <div class="nd-action">
                                ${actionButtonHtml}
                              </div>

                            </div>

                          </div>

                        </div>
                        `;

}


//async function generateDocumentCardHtml(item, suid, current, total) {
//    let documentName = await cropFileNames(item.documentName);
//    let createdAt = item.createdAt || '-';
//    let expireDate = item.expireDate || '-';
//    var matchedEsealData = {};
//    var matchedSignData = {};
//    var matchedQrcodeData = {};

//    let docStatusHtml = renderDocumentStatusHtml(item);
//    let signingStatusHtml = renderSigningStatusHtml(item, suid);
//    let actionButtonHtml = renderActionButtonHtml(item, suid, current, total);
//    let showActionButton = !actionButtonHtml.toLowerCase().includes("view");
//    if (item.annotations != null && item.annotations != "{}") {
//        var signconfig = JSON.parse(item.annotations);
//        for (const key in signconfig) {
//            if (signconfig.hasOwnProperty(key) && key === suid) {
//                matchedSignData[key] = signconfig[key];
//            }
//        }
//    }
//    if (item.qrcodeannotations != null && item.qrcodeannotations != "{}") {
//        var qrcodeconfig = JSON.parse(item.qrcodeannotations);
//        for (const key in qrcodeconfig) {
//            if (qrcodeconfig.hasOwnProperty(key) && key === suid) {
//                matchedQrcodeData[key] = qrcodeconfig[key];
//            }
//        }
//    }
//    if (item.esealannotations != null && item.esealannotations != "{}") {

//        var esealconfig = JSON.parse(item.esealannotations);

//        for (const key in esealconfig) {
//            if (esealconfig.hasOwnProperty(key) && key === suid) {
//                matchedEsealData[key] = esealconfig[key];
//            }
//        }

//    }
//    let docobject = {
//        id: item.id,
//        annotations: matchedSignData,
//        esealannotations: matchedEsealData,
//        qrcodeannotations: matchedQrcodeData,
//        docname: documentName

//    }
//    console.log(docobject);
//    var val = docobject.id;
//    if (!documentsobjectslist.some(doc => doc.id === val)) {
//        documentsobjectslist.push(docobject);

//    }

//    const masterCheckbox = document.getElementById('selectAllCheckbox');
//    var isAllSelected = masterCheckbox.checked;

//    const hasSignOrRetry =
//        actionButtonHtml.includes('sign') || actionButtonHtml.includes('retry');

//    var signingstatusval = signingStatusHtml.toLowerCase();
//    var docStatusHtmlval = docStatusHtml.toLocaleLowerCase();

//    if (signingstatusval !== 'need to sign' && signingstatusval !== 'failed' && !hasSignOrRetry) {
//        isAllSelected = false;
//    }
//    var isAllSelected = masterCheckbox.checked;
//    if (signingstatusval !== 'need to sign' && signingstatusval !== 'failed' && !hasSignOrRetry) {
//        isAllSelected = false;
//    }
//    const containers = document.querySelectorAll('.checkboxContainer');
//    const anyVisible = Array.from(containers).some(container => {
//        return container.style.display === 'block';
//    });

//    // var isallselectedvisible = masterCheckbox.display;
//    console.log(anyVisible);
//    var makeDisabled = false;
//    if (!hasSignOrRetry) {
//        makeDisabled = true;
//    }

//    var tooltipmessage = 'Document is not available';
//    if (docStatusHtmlval.includes('expired')) {
//        tooltipmessage = 'Document got expired';
//    } else if (signingstatusval.includes('signed')) {
//        tooltipmessage = 'Document is already signed';
//    } else if (docStatusHtmlval.includes('recalled')) {
//        tooltipmessage = 'Document is not available for signing';
//    } else if (signingstatusval.includes('signing in progress')) {
//        tooltipmessage = 'Document signing is already initiated';
//    } else if (signingstatusval.includes('signing')) {
//        tooltipmessage = 'Document signing is already initiated';
//    }
//    if (Object.keys(matchedEsealData).length !== 0) {
//        const orgResponse = await fetchTooltipMessage(matchedEsealData[suid].organizationID);
//        console.log(orgResponse);
//        if (!orgResponse.success) {
//            tooltipmessage = 'Organization not authorized for eSeal operation';
//            makeDisabled = true;
//        }
//    }

//    const id = item._id || item.id;
//    if (isAllSelected) {
//        selectedIdListData.push(id);
//    }

//    const selectedCountDisplay = document.getElementById('selectedCount');
//    if (selectedCountDisplay) {
//        selectedCountDisplay.innerText = `(${selectedIdListData.length})`;
//    }


//    return `
//                           <div id="doc-${current}" class="card mb-3 shadow-sm border rounded-3 p-2 onhoverclass redirect-doc ${isAllSelected ? 'card-selected' : ''}"
//                style="cursor:pointer;" data-id="${id}">
//               <div class="d-flex flex-row flex-sm-column flex-xl-row justify-content-start justify-content-xl-between align-items-start align-items-xl-center">
//                   <div class="d-flex align-items-center gap-3 flex-grow-1">
//                                       <div style="display:${anyVisible ? "block" : "none"};" class="checkboxContainer custom-checkbox-wrapper ${makeDisabled ? 'disabled' : ''}">
//                           <input type="checkbox" class="custom-checkbox document-checkbox"
//                                  id="doc_${id}" value="${id}"
//                                  ${isAllSelected ? 'checked' : ''}
//                                  ${makeDisabled ? 'disabled' : ''}>
//                           <label for="doc_${id}" class="custom-checkmark">
//                               <svg class="check-icon" viewBox="0 0 24 24">
//                                   <path d="M20 6L9 17l-5-5" fill="none" stroke="white" stroke-width="3"/>
//                               </svg>
//                           </label>
//                               <div class="tooltip-message">${tooltipmessage}</div>
//                       </div>
//                        <!-- Mobile View: Shown only on small screens -->
//                        <div class="d-flex d-sm-none flex-column gap-2 mt-2 w-100">

//                            <div class="row align-items-center">
//                                <!-- Left Content: Document Info -->
//                                <div class="col-10">

//                                    <!-- Document Name -->
//                                    <div class="small fw-semibold" style="font-size:14px;font-weight:600;">
//                                        <span class="text-dark">Document Name:</span>
//                                        <span class="fw-bold text-dark">
//                                            ${documentName}
//                                        </span>
//                                    </div>


//                                    <!-- Created and Expiry Dates -->
//                                    <div class="small fw-semibold">
//                                        <span class="text-dark">Created Date:</span>
//                                        <span class="convert-time" data-timestamp="${createdAt}">${createdAt}</span>
//                                    </div>

//                                    <div class="small fw-semibold">
//                                        <span class="text-dark">Expiry Date:</span>
//                                        <span class="convert-time" data-timestamp="${expireDate}">${expireDate}</span>
//                                    </div>


//                                    <!-- Document Status -->
//                                    <div class="small fw-semibold">
//                                        <span class="text-dark">Document Status:</span>
//                                        <span class="fw-bold docstats-text">
//                                            ${docStatusHtml}
//                                        </span>
//                                    </div>

//                                    <!-- My Sign Status -->
//                                    <div class="small fw-semibold">
//                                        <span class="text-dark">My Sign Status:</span>
//                                        <span class="fw-bold signingstats-text">
//                                            ${signingStatusHtml}
//                                        </span>
//                                    </div>
//                                </div>

//                                <!-- Chevron Icon on the Right -->
//                                <div class="col-2 d-flex justify-content-end">
//                                    <div style="
//                                        background-color: #E8F5E9;
//                                        width: 28px;
//                                        height: 28px;
//                                        border-radius: 50%;
//                                        display: flex;
//                                        align-items: center;
//                                        justify-content: center;
//                                    ">
//                                        <i class="fa fa-chevron-right" style="font-size: 12px; color: #2e7d32;"></i>
//                                    </div>
//                                </div>
//                            </div>
//                            <!-- Sign Summary and Actions -->
//                            ${showActionButton ? `
//                                <div class="d-flex align-items-center justify-content-end w-100">
//                                    ${actionButtonHtml}
//                                </div>
//                                ` : ''}
//                        </div>
//                       <div class="d-none d-sm-flex align-items-center justify-content-center rounded-circle mr-3"
//                            style="background-color: #E8F5E9; width: 50px; height: 50px;">
//                           <img width="24" height="24" src="${appBaseUrl}img/get-signed.png" />
//                       </div>
//                       <div class="d-none d-sm-flex flex-column text-truncate">
//                           <h5 class="mb-1 fw-semibold text-dark" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 16px !important;" ${documentName != item.documentName ? `title="${item.documentName}"` : ''}>
//                               ${documentName}
//                           </h5>
//                           <div class="text-muted small d-flex flex-wrap">
//                                    Created: <span class="convert-time" data-timestamp="${createdAt}">${createdAt}</span>  <span class="mx-1 pl-1 pr-1">•</span> Expires: <span class="convert-time" data-timestamp="${expireDate}" > ${expireDate} </span>
//                           </div>
//                       </div>
//                   </div>
//                   <div class="d-none d-sm-flex justify-content-between align-items-center align-items-xl-start gap-4 doc-stats-container">
//                       <div class="stats-container mr-5">
//                           <div class="docstats-heading">Document Status</div>
//                           <div class="gap-1 docstats-text">
//                               ${docStatusHtml}
//                           </div>
//                       </div>
//                       <div class="stats-container mr-5">
//                           <div class="signingstats-heading">My Sign Status</div>
//                           <div class="gap-1 signingstats-text">
//                               ${signingStatusHtml}
//                           </div>
//                       </div>
//                       <div class="d-flex align-self-center gap-1 px-3">
//                           ${actionButtonHtml}
//                            </div>
//                    </div>
//               </div>
//           </div>
//                   `;
//}

function toggleRowHighlight(checkbox) {
    const cardElement = checkbox.closest('.card');
    const signingStatusEl = cardElement.querySelector('.signingstats-text');
    const signingStatus = signingStatusEl ? signingStatusEl.textContent.trim().toLowerCase() : '';
    const docStatusEl = cardElement.querySelector('.docstats-text');
    const docStatus = docStatusEl ? docStatusEl.textContent.trim().toLowerCase() : '';
    // const actionContainer = cardElement.querySelector('.d-flex.align-self-center.gap-1.px-3');
    // const actionHtml = actionContainer ? actionContainer.innerHTML.toLowerCase() : '';
    const actionHtml = cardElement.querySelector('button');
    // const hasSignOrRetry =
    //     actionHtml.includes('sign') || actionHtml.includes('retry');
    const hasSignOrRetry = actionHtml
        ? actionHtml.textContent.toLowerCase().includes('sign') || actionHtml.textContent.toLowerCase().includes('retry')
        : false;
    console.log(hasSignOrRetry);
    if (checkbox.checked && (docStatus.includes('expired'))) {
        swal({
            type: 'info',
            title: 'Info',
            text: 'This document cannot be selected as the signing deadline has passed and it is now expired.',
            confirmButtonText: 'OK'
        });

        checkbox.checked = false;
        return;
    }
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

function redirectToDocumentDetails(id) {
    // Construct the URL for the action
    var viewName = "MyDocuments";
    var url = DocumentDetailsByIdUrl +'?id=' + id + '&viewName=' + viewName;
    // Redirect to the URL
    window.location.href = url;
}



window.signActionConfigByDocIdOnclick = async function (docId, currentDocNo = 0, totalDocs = 0) {
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
                var viewName = "MyDocuments";
                localStorage.setItem("CurrentDocNo", currentDocNo);
                localStorage.setItem("TotalDocs", totalDocs);
                window.location.href = SignActionConfigByDocId + '?docId=' + docId + '&viewName=' + viewName;
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
                            window.location.href = IndexDocuments;
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

function renderDocumentStatusHtml(item) {
    let className = {
        "Completed": "completebtn",
        "In Progress": "inprogressbtn",
        "Declined": "Declinedbtn"
    }[item.status] || "otherbtn";

    let popupHtml = "";
    if (item.status === "Completed") {
        let signers = (item.completeSignList || []).map(s =>
            `<li class='first-email' style='display:flex;justify-content:start;'><span class='sec' style='padding-left:6%'>${s.email}</span></li>`
        ).join('');
        popupHtml = `
            <div class='popup'>
                <p class='header'><span class='headersp'>TOTAL RECIPIENTS: ${item.recepientCount}</span></p>
                <div class='row'>
                    <p style='text-align:left'>SIGNED: ${item.completeSignList?.length || 0}</p>
                    <ul class='email-list' style='margin-bottom:0;'>${signers}</ul>
                </div>
            </div>`;
    } else if (item.status === "In Progress") {
        let pendings = (item.pendingSignList || []).map(s =>
            `<li class='first-email' style='display:flex;justify-content:start;'><span class='sec' style='padding-left:6%'>${s.email}</span></li>`
        ).join('');
        popupHtml = `
            <div class='popup'>
                <p class='header'><span class='headersp'>TOTAL RECIPIENTS: ${item.recepientCount}</span></p>
                <div class='row'>
                    <p style='text-align:left'>PENDING: ${item.pendingSignList?.length || 0}</p>
                    <ul class='email-list' style='margin-bottom:0;'>${pendings}</ul>
                </div>
            </div>`;
    }

    if (item.status == "In Progress") {
        return `
                <div class='status-container' style='position: relative; display: inline-block;'>
                    <span class='${className} redirect-doc' style='cursor:pointer;'  data-id="${item.id}">Signatures Pending</span>
                    ${popupHtml}
                </div>`;
    }

    return `
        <div class='status-container' style='position: relative; display: inline-block;'>
            <span class='${className} redirect-doc' style='cursor:pointer;' data-id="${item.id}">${item.status}</span>
            ${popupHtml}
        </div>`;
}

function renderSigningStatusHtml(item, suid) {
    let rec = (item.recepients || []).find(r => r.suid === suid);
    if (!rec) return "<div class='otherbtn'>Not Required</div>";

    let html = "";

    switch (rec.status) {
        case "Need to sign":
            html = `<div class='inprogressbtn'>Need to Sign</div>`;
            break;
        case "Waiting_for_Others":
            html = `<div class='inprogressbtn'>Waiting for Others</div>`;
            break;
        case "Signing_Pending":
        case "Signing_in_Progress":
            html = `<div class='inprogressbtn'>Signing in Progress</div>`;
            break;
        case "Pin_Failed":
        case "Failed":
            html = `<div class='Declinedbtn'>Failed</div>`;
            break;
        case "Signed":
            html = `<div class='completebtn'>Signed</div>`;
            break;
        case "Rejected":
            html = `<div class='Declinedbtn'>Rejected</div>`;
            break;
        default:
            html = "<div class='otherbtn'>Not Required</div>";
    }

    // Override the class if item is expired
    if (item.status === "Expired" || item.status === "Recalled") {
        html = html.replace(/class='[^']*'/, "class='otherbtn'");
    }

    return html;
}


function renderActionButtonHtml(item, suid, currentDocNo, totalDocs) {
    let rec = (item.recepients || []).find(r => r.suid === suid);
    if (!rec) return "";

    let baseBtn = "btn btn-success deepGreen-bgcolor no-margin";
    let style = "font-size:small;padding:4px 12px;max-width:90px;width:80px;text-transform: none !important;";
    let id = item.id;

    if (item.status === "In Progress") {
        switch (rec.status) {
            case "Need to sign":
                return `<button type='button' class='${baseBtn} sign-button' style='${style}' data-id='${id}' data-current='${currentDocNo}' data-total='${totalDocs}'>
                                <i class='fa fa-pencil'></i>&nbsp;Sign</button>`;
            case "Signing_Pending":
            case "Signing_in_Progress":
            case "Waiting_for_Others":
            case "Rejected":
            case "Signed":
                return `<button type='button' class='${baseBtn} redirect-doc' style='${style}' data-id="${id}">
                                <i class='fa-regular fa-eye'></i>&nbsp;View</button>`;
            case "Pin_Failed":
            case "Failed":
                return `<button type='button' class='${baseBtn} sign-button' style='${style}' data-id='${id}' data-current='${currentDocNo}' data-total='${totalDocs}'>
                                <i class='fa-solid fa-arrow-rotate-left'></i>&nbsp;Retry</button>`;
            default:
                return `<button type='button' class='${baseBtn} redirect-doc' style='${style}' data-id="${id}">
                                <i class='fa-regular fa-eye'></i>&nbsp;View</button>`;
        }
    }

    return `<button type='button' class='${baseBtn}' style='${style}' data-id="${id}">
                    <i class='fa-regular fa-eye'></i>&nbsp;View</button>`;
}
