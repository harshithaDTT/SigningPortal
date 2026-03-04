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
    window.location.href = CreateTemplate;
}
function handleEditTemplate(templateId) {
    document.getElementById("navigationNetworkOverlay").style.display = "block";
    window.location.href = GetTemplateDetails + `?templateId=${templateId}`;

}

function handlePreview(templateId) {
    document.getElementById("navigationNetworkOverlay").style.display = "block";
    window.location.href = Preview + `?templateId=${templateId}`;

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
        window.location.href = url
    }
    else {
        window.location.href = IndexDocuments + status;
    }
}


function handleDocumentsSigningStatus(groupId) {

    document.getElementById("navigationNetworkOverlay").style.display = "block";
    window.location.href = DocumentsSigningStatus + `?groupId=${groupId}`;
}


$(".handleGroupSign").on("click", function () {
    const groupId = $(this).data("docid");
    document.getElementById("navigationNetworkOverlay").style.display = "block";
    window.location.href = DocumentsSigningStatus + `?groupId=${groupId}`;
})