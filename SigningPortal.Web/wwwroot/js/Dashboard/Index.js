let scrollInterval = null;
let pauseTimeout = null;
$(document).ready(function () {
    $('#dashboardMenu').addClass('active');
    $('#networkOverlay').hide();
    window.getDocumentStats();
    let urlPath = window.location.href.split("/");
    $("#actionRequiredContainer").on("click", function () {
        redirectToIndex('In Progress', true, false);
    });

    $("#expiringSoonContainer").on("click", function () {
        redirectToIndex('In Progress', true, true);
    });

    $(".action-required-icon").on("click", function () {
        redirectToIndex('In Progress', true, false);
    });

    $(".sign-yourself-btn").on("click", function () {
        createDocument();
    });

    $(".send-now-btn").on("click", function () {
        PrepareDocumentForOthers();
    });

    $(".my-documents").on("click", function () {
        redirectToIndex('MyDocuments', false, false);
    });

    $(".sent-documents").on("click", function () {
        redirectToIndex('SentDocuments', false, false);
    });

    $(".received-documents").on("click", function () {
        redirectToIndex('RecievedDocuments', false, false);
    });

    $(".referred-documents").on("click", function () {
        redirectToIndex('ReferedDocuments', false, false);
    });

    $(document).on("click", ".sign-doc-row", function () {
        const id = $(this).data("id");
        const isReferred = $(this).data("referred");
        const viewName = $(this).data("viewname");

        signActionConfigByDocIdOnclick(id, isReferred, viewName);
    });

});

function cropFileNames(full) {

    const start = 25;
    const end = 25;

    if (full && full.length > start + end) {
        return full.slice(0, start) + '...' + full.slice(-end);
    } else {
        return full
    }

}

// To SHOW shimmer loader
function showShimmerLoader() {
    const shimmerItems = document.querySelectorAll(".shimmer-item");
    shimmerItems.forEach(item => item.classList.remove("hidden"));
}

// To HIDE shimmer loader
function hideShimmerLoader() {
    const shimmerItems = document.querySelectorAll(".shimmer-item");
    shimmerItems.forEach(item => item.classList.add("hidden"));
}


function getActionRequiredDocuments(response) {
    if (response && response.length > 0) {
        renderDocumentCards(response);
    } else {
        document.getElementById("docs-container").style.backgroundColor = "#ffffff";

        $('#docs-container').html(`
                            <div class="d-flex flex-column justify-content-center align-items-center" style="flex-grow:1;">
                                <img style="cursor: pointer; height: 90px;" src="${appBaseUrl}img/noActionRequired.png"  />
                                <p style="font-weight:600 !important;padding:0px;margin:0px;">No Action Required</p>
                                <p class="mb-1 mt-1" style="font-size:17px !important;">There are no documents awaiting your review or signature at this time</p>
                            </div>
                        `);


    }
}


function renderDocumentCards(documents) {
    const docsContainer = document.getElementById("docs-container");
    docsContainer.innerHTML = "";
    let html = '';
    const currentUserEmail = currentemailval;
    documents.forEach(doc => {

        let senderDisplay = "";
        let actionText = "";
        let isReferred = false;
        let docViewname = "";
        let documentName = cropFileNames(doc.documentName);

        if (doc.ownerEmail === currentUserEmail) {
            senderDisplay = "";
            actionText = 'You initiated a document for signing';
            if (doc.multiSign) {
                docViewname = "SentDocuments";
            }
            else {
                docViewname = "MyDocuments";
            }
        } else {
            const isExists = doc.pendingSignList[0]?.email === currentUserEmail;
            const isInPendingList = doc.pendingSignList?.some(signer => signer.email === currentUserEmail);
            //the document is from Recieved
            if (isExists || (doc.disableOrder && isInPendingList)) {
                senderDisplay = `${doc.ownerName} `;
                actionText = 'sent you a document';
                docViewname = "RecievedDocuments";
            } else {

                senderDisplay = `${doc.ownerName} `;
                actionText = 'referred you a document';
                isReferred = true;
                docViewname = "ReferedDocuments";
            }
        }
        html += `
                <div class="doc-row sign-doc-row" style="cursor:pointer;"  data-id="${doc._id}" data-referred="${isReferred}" data-viewname="${docViewname}">
                    <div class="doc-info">
                        <div class="doc-text">
                            <div class="doc-sender">${senderDisplay}${actionText}</div>
                            <div class="doc-name" ${documentName != doc.documentName ? `title="${doc.documentName}"` : ''}>${documentName}</div>
                        </div>
                    </div>
                    <button type="button" class="btn btn-success deepGreen-bgcolor no-margin" style="font-size:small;padding:4px 12px;max-width:90px;width:100%;text-transform: none !important;" >
                             <i class="fa fa-pencil"></i>&nbsp;Sign
                    </button>
                </div>
            `;
    });

    $('#docs-container').html(html);


    const hasVerticalScroll = docsContainer.scrollHeight > docsContainer.clientHeight;
    if (hasVerticalScroll) {
        document.getElementById("actionrequiredDocsContainer").style.border = '1px solid transparent';
        document.getElementById("actionrequiredDocsContainer").style.borderRadius = 'none';
        document.getElementById("actionrequiredDocsContainer").style.boxShadow = 'none';
        document.getElementById("actionRequiredText").style.border = '1px solid #d8dbe0';
        document.getElementById("actionRequiredText").style.marginBottom = '5px';
        startAutoScrolling();
    }
    else {
        document.getElementById("actionRequiredText").style.marginBottom = '5px';
        $('.doc-row').css({ marginLeft: '8px', marginRight: '8px' });
    }
}


function startAutoScrolling() {
    const docsContainer = $('#docs-container');

    function isAtBottom() {
        const currentScroll = docsContainer.scrollTop();
        const maxScroll = docsContainer[0].scrollHeight - docsContainer.outerHeight();
        return currentScroll >= maxScroll - 1;
    }

    function scrollContent() {
        if (isAtBottom()) {
            stopScrolling();
            pauseTimeout = setTimeout(() => {
                docsContainer.animate({ scrollTop: 0 }, 300, () => {
                    if (!docsContainer.is(':hover')) {
                        startScrolling();
                    }
                });
            }, 2000);
        } else {
            docsContainer.scrollTop(docsContainer.scrollTop() + 0.5);
        }
    }

    function startScrolling() {
        if (scrollInterval !== null) return; // Prevent duplicate intervals

        docsContainer.addClass('hide-scrollbar').removeClass('show-scrollbar');
        scrollInterval = setInterval(scrollContent, 50);
    }

    function stopScrolling() {
        if (scrollInterval !== null) {
            clearInterval(scrollInterval);
            scrollInterval = null;
        }
        if (pauseTimeout !== null) {
            clearTimeout(pauseTimeout);
            pauseTimeout = null;
        }
    }

    // Always stop on hover
    docsContainer.off('mouseenter.autoscroll').on('mouseenter.autoscroll', () => {
        stopScrolling();
        docsContainer.removeClass('hide-scrollbar').addClass('show-scrollbar');
    });

    //Resume
    docsContainer.off('mouseleave.autoscroll').on('mouseleave.autoscroll', () => {
        docsContainer.removeClass('show-scrollbar').addClass('hide-scrollbar');

        if (scrollInterval === null && pauseTimeout === null && docsContainer[0].scrollHeight > docsContainer.outerHeight()) {
            startScrolling();
        }
    });


    // Initial scroll state
    if (!docsContainer.is(':hover')) {
        startScrolling();
    }
}



async function signActionConfigByDocIdOnclick(docId, isReffered, viewName) {
    try {
        const response = await $.ajax({
            type: 'POST',
            url: IsDocumentBlocked,
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
            if (isReffered) {
                window.location.href = SignActionByDocIdForReferedDoc + '?docId=' + docId + '&viewName=' + viewName;
            }
            else {
                window.location.href = SignActionConfigByDocId + '?docId=' + docId + '&viewName=' + viewName;
            }
        }
    } catch (error) {
        ajaxErrorHandler(error);
    }

}



window.getDocumentStats = function () {
    $(".lds-spinner").show();
    $("#ActionRequired").hide();
    $("#ExpiringSoon").hide();
    $("#InProgress").hide();
    $("#Completed").hide();
    $("#Declined").hide();
    $("#Expired").hide();
    if (scrollInterval !== null) {
        clearInterval(scrollInterval);
        scrollInterval = null;
    }
    if (pauseTimeout !== null) {
        clearTimeout(pauseTimeout);
        pauseTimeout = null;
    }
    showShimmerLoader();
    document.getElementById("actionrequiredDocsContainer").style.border = '1px solid #d8dbe0';
    document.getElementById("actionrequiredDocsContainer").style.boxShadow = "0 0px 3px 0 rgb(0 0 0 / 20%)";
    document.getElementById("actionrequiredDocsContainer").style.borderRadius = '0.5rem';
    document.getElementById("actionRequiredText").style.borderTopLeftRadius = '0.5rem';
    document.getElementById("actionRequiredText").style.borderTopRightRadius = '0.5rem';
    document.getElementById("docs-container").style.borderTopLeftRadius = '0.5rem';
    document.getElementById("docs-container").style.borderTopRightRadius = '0.5rem';
    document.getElementById("actionRequiredText").style.border = 'none';
    document.getElementById("actionRequiredText").style.borderBottom = '1px solid #d8dbe0';
    $("#docs-container").hide();
    $.ajax({
        type: "GET",
        url: DocStats,
        datatype: "json",

        success: function (response) {
            $(".lds-spinner").hide();
            hideShimmerLoader();
            if (response.success) {
                $("#docs-container").show();
                $("#ActionRequired").show();
                $("#ExpiringSoon").show();
                $("#InProgress").show();
                $("#Completed").show();
                $("#Declined").show();
                $("#Expired").show();
                $('#InProgress').text(response.result.ownDocumentStatus.cnt_draft);
                $('#Completed').text(response.result.ownDocumentStatus.cnt_send);
                $('#Declined').text(response.result.ownDocumentStatus.cnt_received);
                $('#Expired').text(response.result.ownDocumentStatus.cnt_referred);
                $('#ActionRequired').text(response.result.otherDocumentStatus.action_required_cnt);
                $('#ExpiringSoon').text(response.result.otherDocumentStatus.expiry_soon_count);
                getActionRequiredDocuments(response.result.actionRequiredList);

            } else {
                swal({
                    type: 'info',
                    title: 'Info',
                    text: response.message

                });
                return;
            }
        },
        error: ajaxErrorHandler,
    });
}


function redirectToIndex(status, actionRequired, expiredSoon) {
    document.getElementById("navigationNetworkOverlay").style.display = "block";
    var url = GetFilteredDocumentsList + '?status=' + status;

    // Append actionRequired and expiredSoon parameters if provided
    if (actionRequired !== undefined) {
        url += '&action_required=' + actionRequired;
    }
    if (expiredSoon !== undefined) {
        url += '&expired_soon=' + expiredSoon;
    }

    if (status === "In Progress") {
        window.location.href = url
    }
    else {
        window.location.href = redirectingurl + status;
    }
}

function createDocument() {
    document.getElementById("navigationNetworkOverlay").style.display = "block";
    window.location.href = CreateDocumentsSIGN;
}

function PrepareDocumentForOthers() {
    document.getElementById("navigationNetworkOverlay").style.display = "block";
    window.location.href = CreateDocumentsSEND;
}