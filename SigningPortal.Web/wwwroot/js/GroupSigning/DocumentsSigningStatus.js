var myChart;
var intervalId;
var filelist;
var allfilelist;
var completefilelist;
var failfilelist;
var pendingfilelist;
var yValues = [successFileCount1, pendingCount1, failedFileCount1];
var xValues = ["Signed", "Pending", "Failed"];
var barColors = [
    "#10B981",
    "#F59E0B",
    "#EF4444"
];
var success = "/img/Completed.png"
var fail = "/img/Failed.png"
var pending = "/img/Notstarted.png"

$(document).ready(function () {
    $('#GroupSigningMenu').addClass('active');
    document.getElementById("navigationNetworkOverlay").style.display = "none";
    $('#networkOverlay').hide();
    loadpiechart();

    if (status != "Completed") {

        intervalId = setInterval(checkstatus, 1000);

    }
    else {
        UpdateDetails();
    }
    updateTimestamps_statuspage();
});

function loadpiechart() {

    // ✅ If chart already exists → just update it
    if (myChart) {
        myChart.data.labels = xValues;
        myChart.data.datasets[0].data = yValues;
        myChart.data.datasets[0].backgroundColor = barColors;

        myChart.update();   // Only updates changes
        return;
    }

    // ✅ Create chart only first time
    myChart = new Chart("myChart", {
        type: "pie",
        data: {
            labels: xValues,
            datasets: [{
                backgroundColor: barColors,
                data: yValues
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        boxWidth: 14,
                        padding: 15
                    }
                }
            }
        }
    });
}

function updateTable(fileArray) {

    // Update counts
    $('#successcount').text(successFileCount1);
    $('#failcount').text(failedFileCount1);
    $('#pendingcount').text(pendingCount1);

    const listContainer = document.querySelector('.dg-doc-list');
    listContainer.querySelectorAll('.dg-doc-card').forEach(e => e.remove());

    if (!fileArray || fileArray.length === 0) {
        listContainer.insertAdjacentHTML(
            'beforeend',
            `<div class="alert alert-info text-center mt-3">No Documents Available</div>`
        );
        return;
    }

    fileArray.forEach(item => {

        let textColor = '#6b7280';
        let bgColor = '#f1f5f9';
        let iconHtml = `<i class="fa fa-hourglass-1"></i>`;

        if (item.status === "Signed") {
            textColor = '#16a34a';
            bgColor = '#dcfce7';
            iconHtml = `<i class="fa fa-check-circle"></i>`;
        }
        else if (item.status === "Failed" || item.status === "PIN_FAILED") {
            textColor = '#dc2626';
            bgColor = '#fee2e2';
            iconHtml = `<i class="fa-solid fa-circle-xmark"></i>`;
        }
        else {
            textColor = '#f59e0b';
            bgColor = '#fef3c7';
        }

        const html = `
        <div class="dg-doc-card onhoverclass">

            <!-- Document -->
            <div class="dg-doc-left">
                <div>
                     <img src="/img/icon/groupsigning_list_icon.png" style="width:2rem;" />
                    </div>
                <div>
                    <small class="titleclass">Document Name</small>
                    <div class="dg-doc-name">${item.documentName}</div>
                </div>
            </div>

            <!-- Status -->
            <div class="dg-doc-status">
                <small class="titleclass">Signing Status</small>
                <div class="dg-status-pill" style="color:${textColor}; background:${bgColor};">
                    ${iconHtml} ${item.status.replaceAll('_', ' ')}
                </div>
            </div>

            <!-- Action -->
            <div>
                <a href="${documentDetailsBaseUrl}/${item.documentId}" class="dg-view-btn">
                    <i class="fa fa-eye"></i> View
                </a>
            </div>

        </div>`;

        listContainer.insertAdjacentHTML('beforeend', html);
    });
}



function handleFilter(data) {
    var updatedfilelist = [];
    if (data === "all") {
        updatedfilelist = filelist;
        updateTable(updatedfilelist);

    } else if (data === "complete") {
        updatedfilelist = filelist.filter(item => item.status == "Signed");
        updateTable(updatedfilelist);
    } else if (data === "fail") {
        updatedfilelist = filelist.filter(item => item.status == "Failed");
        updateTable(updatedfilelist);
    } else if (data === "notstarted") {
        updatedfilelist = filelist.filter(item => item.status == "Signing in progress");
        updateTable(updatedfilelist);
    }

}


//when transcation is completed then calling the backend api to set the data finally
function UpdateDetails() {
    var groupid = groupId;
    $.ajax({
        url: documentResultDetailsUrl,
        method: 'GET',
        data: { groupId: groupid },
        success: function (data) {
            console.log(data);
            if (data.success) {

                console.log(data);
                var fileArray = data.result.groupsigningstatusdetailsViewModel.groupSignStatus;
                if (fileArray.length == 0) {
                    return;
                }
                failedFileCount1 = data.result.groupsigningstatusdetailsViewModel.failedFileCount;
                successFileCount1 = data.result.groupsigningstatusdetailsViewModel.successFileCount;
                pendingCount1 = data.result.groupsigningstatusdetailsViewModel.totalFileCount - successFileCount1 - failedFileCount1;
                yValues = [successFileCount1, pendingCount1, failedFileCount1];

                updateTable(fileArray);
                filelist = fileArray;
                loadpiechart();
            } else {
                swal({
                    title: 'Error',
                    text: data.message,
                    type: 'error',
                }, function (isConfirm) {
                    if (isConfirm) {
                    }
                });
            }

        },
        error: ajaxErrorHandler
    });
}


//when transcation is in inprogress and still trying to update the data of bulksign
function updatestatus() {
    var groupid = groupId;
    $.ajax({
        url: updateGroupDocSignDetailsUrl,
        method: 'GET',
        data: { groupId: groupid },
        success: function (data) {
            if (data.success) {

                console.log(data);
                var fileArray = data.result.groupSignStatus;
                if (fileArray.length == 0) {
                    return;
                }
                failedFileCount1 = data.result.failedFileCount;
                successFileCount1 = data.result.successFileCount;
                pendingCount1 = data.result.totalFileCount - successFileCount1 - failedFileCount1;

                // failedFileCount1 = 5;
                // successFileCount1 = 7;
                // pendingCount1 = 3;
                yValues = [successFileCount1, pendingCount1, failedFileCount1];
                updateTable(fileArray);
                filelist = fileArray;
                loadpiechart();
            } else {
                swal({
                    title: 'Error',
                    text: data.message,
                    type: 'error',
                }, function (isConfirm) {
                    if (isConfirm) {
                    }
                });
            }

        },
        error: ajaxErrorHandler
    });
}

//checking whether the transcation is completed or not v
function checkstatus() {

    var groupid = groupId;
    $.ajax({
        url: groupDocStatusDetailsUrl,
        method: 'GET',
        data: { groupId: groupid },
        success: function (data) {
            if (data.success) {
                $('#groupStatusText').text(data.result);
                if (data.result != "Completed") {
                    updatestatus();
                }
                else {
                    clearInterval(intervalId);
                    UpdateDetails();
                }
            } else {
                swal({
                    title: 'Error',
                    text: data.message,
                    type: 'error',
                }, function (isConfirm) {
                    if (isConfirm) {
                    }
                });
            }

        },
        error: ajaxErrorHandler
    });
}
