$(document).ready(function () {
    $('#GroupSigningMenu').addClass('active');
    $('#networkOverlay').hide();
    var table = $("#roleTable").DataTable({
        "bLengthChange": false,
        "searching": false,
        "pageLength": 5,
        "orderClasses": false,
        "stripeClasses": [],
        "info": true,
        "ordering": false,
        "responsive": {
            details: {
                type: 'column',
                target: 'tr'
            }
        },
        "columnDefs": [
            { className: 'control', orderable: false, targets: 0 }, // Makes 1st column only for expansion
            { responsivePriority: 1, targets: 1 },
            { responsivePriority: 2, targets: 2 },
            { responsivePriority: 3, targets: 4 },
        ]
    });
    $("#createTemplateBtn").on("click", function () {
        handlenewTranscation('In Progress', true, false);
    });
    updateTimestamps_forGroupSIgning();

});
function handlecreateTemplate() {
    document.getElementById("navigationNetworkOverlay").style.display = "block";
    const urlval = new URL(CreateTemplate, window.location.origin);
    window.location.href = urlval.toString();
}
function handleEditTemplate(templateId) {
    document.getElementById("navigationNetworkOverlay").style.display = "block";
    const url = new URL(GetTemplateDetails, window.location.origin);
    url.searchParams.append('?templateId=', templateId);
    window.location.href = url.toString();

}

function handlePreview(templateId) {
    document.getElementById("navigationNetworkOverlay").style.display = "block";
    const url = new URL(Preview, window.location.origin);
    url.searchParams.append('?templateId=', templateId);
    window.location.href = url.toString();

}

function handlenewTranscation(status, actionRequired, expiredSoon) {
    document.getElementById("navigationNetworkOverlay").style.display = "block";
    var url = GetFilteredDocumentsList + '?status=' + encodeURIComponent(status);

    // Append actionRequired and expiredSoon parameters if provided
    if (actionRequired !== undefined) {
        url += '&action_required=' + actionRequired;
    }
    if (expiredSoon !== undefined) {
        url += '&expired_soon=' + expiredSoon;
    }

    if (status === "In Progress") {
        const urlval = new URL(url, window.location.origin);
        window.location.href = urlval.toString();
    }
    else {
        const url = new URL(IndexDocuments, window.location.origin);
        url.pathname += encodeURIComponent(status);

        window.location.href = url.toString();
    }
}


function handleDocumentsSigningStatus(groupId) {

    document.getElementById("navigationNetworkOverlay").style.display = "block";
    const url = new URL(DocumentsSigningStatus, window.location.origin);
    url.searchParams.append('?groupId=', groupId);
    window.location.href = url.toString();
}


$(".handleGroupSign").on("click", function () {
    const groupId = $(this).data("docid");
    document.getElementById("navigationNetworkOverlay").style.display = "block";
    const url = new URL(DocumentsSigningStatus, window.location.origin);
    url.searchParams.append('?groupId=', groupId);
    window.location.href = url.toString();
})