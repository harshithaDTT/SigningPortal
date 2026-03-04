


function toggleFilterSections() {
	const selectedValue = filterSelector.value;
	if (selectedValue === "time") {
		daysFilterSection.style.display = "flex";
		docsFilterSection.style.display = "none";
		documentFilterActiveTab = "timePeriod";
		document.getElementById("timeIcon").style.display = "inline-block";
		document.getElementById("latestCountIcon").style.display = "none";
	} else {
		daysFilterSection.style.display = "none";
		docsFilterSection.style.display = "flex";
		documentFilterActiveTab = "latestCount";
		document.getElementById("timeIcon").style.display = "none";
		document.getElementById("latestCountIcon").style.display = "inline-block";
	}
}

toggleFilterSections();
filterSelector.addEventListener("change", toggleFilterSections);

// Loop through the last 5 years and generate radio buttons
for (let i = 0; i < 5; i++) {
	const year = currentYear - i;
	const radioButtonHTML = `
				<div class="col-6 col-sm-4">
					<div class="form-check custom-radio p-0 ">
						<input class="form-check-input" type="radio" name="filterDays" id="year${year}" value="${year}">
						<label class="form-check-label" for="year${year}">${year}</label>
					</div>
				</div>
			`;
	container.innerHTML += radioButtonHTML; // Add radio button HTML to the container
}
//Adding all option
const radioButtonHTML = `
				<div class="col-6 col-sm-4">
					<div class="form-check custom-radio p-0 ">
						<input class="form-check-input" type="radio" name="filterDays" id="allYears" value="All">
						<label class="form-check-label" for="allYears">All</label>
					</div>
				</div>
		`;
container.innerHTML += radioButtonHTML;


function reloadPage() {
	location.reload();
}

$(document).ready(function () {
	$('#networkOverlay').hide();
	$('#DocumentMenu').addClass('active');
	viewName = viewname;
	storeFilters();
	initializeFilterRadioButtons();
	setFilterTexts();
	document.getElementById("searchInput").value = "";
	if (viewName == "MyDocuments") {
		activeTab = "List";
		myDocument();
	} else if (viewName == "SentDocuments") {
		activeTab = "SendTb";
		sendDocument();
	} else if (viewName == "RecievedDocuments") {
		activeTab = "RecvTb";
		receivedDoc();
	} else if (viewName == "ReferedDocuments") {
		activeTab = "CompTb";
		referredDocument();
	}
	else {
		activeTab = "List";
		myDocument();
	}

	$("#home-tab").on("click", myDocument);
	$("#home1-tab").on("click", sendDocument);
	$("#profile-tab").on("click", receivedDoc);
	$("#contact-tab").on("click", referredDocument);
	$("#createDocumentBtn").on("click", handlecreateDocument);

	$("#selectAllCheckbox").on("change", function () {
		toggleSelectAll(this);
	});

	$("#toggleCheckboxesBtn").on("click", function () {
		toggleCheckboxes();
	});

	$("#filterDataBtn").on("click", function (e) {
		FilterData();
	});

	$("#signSelectedBtn").on("click", function (e) {
		performGroupSigningAction(); 
	});

	$("#closeFilterIcon").on("click", function () {
		closefilter();
	});

	$("#applyFilterBtn").on("click", function () {
		applyfilter();
	});

	$("#resetFilterBtn").on("click", function () {
		ResetFilter();
	});





	// Close button click event

	document.getElementById("notification-close-icon").addEventListener("click", function () {

		document.getElementById("notification-reload-bar").style.display = "none";

	});


	// Reload button click event (optional)

	document.getElementById("notification-reload-button").addEventListener("click", function () {

		document.getElementById("notification-reload-bar").style.display = "none";

		ResetFilter();

	});




});

$(".tab-item").on("click", function () {

	const tabKey = $(this).data("tab");

	// Reset selection & UI
	deleteList = [];
	$("#notification-reload-bar").hide();
	$("#selectAllCheckboxContainer").hide();
	$("#selectAllCheckbox").prop("checked", false);

	// Call correct tab function
	if (tabKey === "List") {
		myDocument();
	}
	else if (tabKey === "SendTb") {
		sendDocument();
	}
	else if (tabKey === "RecvTb") {
		receivedDoc();
	}
	else if (tabKey === "CompTb") {
		referredDocument();
	}
});

function getDocumentType(doc, currentUserEmail) {
	if (doc.documentDetails.ownerEmail === currentUserEmail) {
		return doc.documentDetails.multiSign ? "Sent" : "Draft";
	}
	return doc.signatoryDetails?.[0]?.recepientEmail === currentUserEmail ? "Received" : "Referred";

}


window.UpdateDocumentsList = function (docId) {
	$.ajax({
		url: DocumentDetailsUrl,
		type: 'GET',
		data: { docid: docId },
		success: function (data) {
			if (data.success) {
				const doc = data.result;
				const currentUserEmail = UserEmail;
				const docType = getDocumentType(doc, currentUserEmail);
				var url = window.location.href;
				var targetUrl = 'Documents?viewName=MyDocuments';
				var targetUrl1 = 'Documents?viewName=SentDocuments';
				var targetUrl2 = 'Documents?viewName=RecievedDocuments';
				var targetUrl3 = 'Documents?viewName=ReferedDocuments';

				if (url.endsWith(targetUrl) && docType === "Draft") {
					document.getElementById("notification-reload-bar").style.display = "flex";
					$("#notification-reload-message").html('Some document status changes were detected in the background. Refresh to see the updated list');
				}
				else if (url.endsWith(targetUrl1) && docType === "Sent") {
					document.getElementById("notification-reload-bar").style.display = "flex";
					$("#notification-reload-message").html('Some document status changes were detected in the background. Refresh to see the updated list');
				}
				else if (docType === "Received" && activeTab === "RecvTb") {
					document.getElementById("notification-reload-bar").style.display = "flex";
					if ($('#receivedCardsContainer').is(':empty')) {
						$("#notification-reload-message").html('New documents were detected in the background. Refresh to see the updated list');
					} else {
						let firstCreatedAt = new Date($("#receivedCardsContainer .created-date").first().data("timestamp"));
						let docCreatedAt = new Date(doc.documentDetails.createdAt);

						if (docCreatedAt > firstCreatedAt) {
							$("#notification-reload-message").html('New documents were detected in the background. Refresh to see the updated list');
						} else {
							$("#notification-reload-message").html('Some document status changes were detected in the background. Refresh to see the updated list');
						}
					}
				}
				else if (docType === "Referred" && activeTab === "CompTb") {
					document.getElementById("notification-reload-bar").style.display = "flex";
					if ($('#referredCardsContainer').is(':empty')) {
						$("#notification-reload-message").html('New documents were detected in the background. Refresh to see the updated list');
					} else {
						let firstCreatedAt = new Date($("#referredCardsContainer .created-date").first().data("timestamp"));
						let docCreatedAt = new Date(doc.documentDetails.createdAt);

						if (docCreatedAt > firstCreatedAt) {
							$("#notification-reload-message").html('New documents were detected in the background. Refresh to see the updated list');
						} else {
							$("#notification-reload-message").html('Some document status changes were detected in the background. Refresh to see the updated list');
						}
					}
				}
			} else {
				swal({
					title: "Error",
					text: data.message || "Unknown error occurred",
					type: "error",
				}, function (isConfirm) {
					if (isConfirm) {
						window.location.href = DocumentsIndexUrl;
					}
				});
			}
		},
		error: ajaxErrorHandler
	});
};





function handlecreateDocument() {
	document.getElementById("navigationNetworkOverlay").style.display = "block";
	window.location.href =CreateDocuments;
}
function activateTab(tabKey) {

	activeTab = tabKey;

	// Reset selection
	$(".RowCheckbox").prop("checked", false);
	$("#del").addClass("classshide");

	// Remove active class from all tabs
	$(".tab-item").removeClass("active");

	// Activate clicked tab
	$('.tab-item[data-tab="' + tabKey + '"]').addClass("active");

	// Hide all tab contents
	$("#myDoc, #sendDoc, #receiveDoc, #referredDoc").hide();

	// Show correct content
	const map = {
		"List": "#myDoc",
		"SendTb": "#sendDoc",
		"RecvTb": "#receiveDoc",
		"CompTb": "#referredDoc"
	};

	$(map[tabKey]).show();
}
function showInitialShimmer(count, targetSelector = '#myDoc') {
	let shimmerHtml = `<div class="shimmer-wrapper">`;
	for (let i = 0; i < count; i++) {
		shimmerHtml += `<div class="shimmer-item"></div>`;
	}
	shimmerHtml += `</div>`;

	const $shimmer = $(shimmerHtml);
	const $target = $(targetSelector);

	$target.append($shimmer);

	return $shimmer;
}




function myDocument() {
	initialLoading = true;
	document.getElementById("docsSearchContainer").style.display = "none";
	const button = document.getElementById('toggleCheckboxesBtn');
	const iconClass = 'fa-list'; // or 'fa-times' depending on mode

	// Update innerHTML to include icon + text
	button.innerHTML = `<i id="checkboxToggleIcon" class="fa ${iconClass}" aria-hidden="true"></i>`;

	// Update classes
	button.classList.remove('select-mode', 'default-mode');
	button.classList.add('default-mode');

	// Optional: Update background or tooltip
	button.classList.remove('select-mode');
	button.classList.add('default-mode');
	button.title = 'Click here for multiple selection mode';


	const containers = document.querySelectorAll('.checkboxContainer');
	containers.forEach(container => {
		container.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
		container.style.display = 'none';

	});
	const signingButtonGroup = document.getElementById('signingButtonGroup');
	if (signingButtonGroup) signingButtonGroup.style.display = 'none';
	const selectedCountDisplay = document.getElementById('selectedCount');
	var initialval = 0;
	if (selectedCountDisplay) {
		selectedCountDisplay.innerText = `(${initialval})`;
	}
	selectedIdListData = [];
	window.selectedDocumentIds = [];
	document.getElementById("searchInput").value = "";
	const currentDocNo = localStorage.getItem("CurrentDocNo");
	if (currentDocNo !== null) {
		document.getElementById("searchInput").value = localStorage.getItem("DocumentsSearchValue")?.trim() || '';
	}
	else {
		localStorage.removeItem("DocumentsSearchValue");
	}
	const currentUrl = window.location.href.split('?')[0];
	const newUrl = `${currentUrl}?viewName=MyDocuments`;
	window.history.pushState(null, '', newUrl);

	$('#myDoc').empty();
	$('#sendDoc').css('display', 'none');
	$('#receiveDoc').css('display', 'none');
	$('#referredDoc').css('display', 'none');
	$('#myDoc').css('display', 'block');
	const intialShimmer = showInitialShimmer(5, "#myDoc");

	$.ajax({
		type: 'GET',
		url: draftDocuments,

		error: ajaxErrorHandler,
		success: function (data) {
			if (data != null) {
				$('#myDoc').html(data);
				activateTab('List');

			}
			else {
				swal({
					type: 'error',
					title: 'Error',
					text: response.message
				});
			}
		}


	});
}

function sendDocument() {
	initialLoading = true;
	document.getElementById("docsSearchContainer").style.display = "none";
	const button = document.getElementById('toggleCheckboxesBtn');
	const iconClass = 'fa-list'; // or 'fa-times' depending on mode

	// Update innerHTML to include icon + text
	button.innerHTML = `<i id="checkboxToggleIcon" class="fa ${iconClass}" aria-hidden="true"></i>`;

	// Update classes
	button.classList.remove('select-mode', 'default-mode');
	button.classList.add('default-mode');

	// Optional: Update background or tooltip
	button.classList.remove('select-mode');
	button.classList.add('default-mode');
	button.title = 'Click here for multiple selection mode';


	const containers = document.querySelectorAll('.checkboxContainer');
	containers.forEach(container => {
		container.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
		container.style.display = 'none';

	});
	const signingButtonGroup = document.getElementById('signingButtonGroup');
	if (signingButtonGroup) signingButtonGroup.style.display = 'none';

	const selectedCountDisplay = document.getElementById('selectedCount');
	var initialval = 0;
	if (selectedCountDisplay) {
		selectedCountDisplay.innerText = `(${initialval})`;
	}
	selectedIdListData = [];
	window.selectedDocumentIds = [];
	document.getElementById("searchInput").value = "";
	const currentDocNo = localStorage.getItem("CurrentDocNo");
	if (currentDocNo !== null) {
		document.getElementById("searchInput").value = localStorage.getItem("DocumentsSearchValue")?.trim() || '';
	}
	else {
		localStorage.removeItem("DocumentsSearchValue");
	}
	const currentUrl = window.location.href.split('?')[0];
	const newUrl = `${currentUrl}?viewName=SentDocuments`;
	window.history.pushState(null, '', newUrl);

	$('#sendDoc').empty();
	$('#myDoc').css('display', 'none');
	$('#receiveDoc').css('display', 'none');
	$('#referredDoc').css('display', 'none');
	$('#sendDoc').css('display', 'block');
	const intialShimmer = showInitialShimmer(5, "#sendDoc");

	$.ajax({
		type: 'GET',
		url: sentDocumentslist,

		error: ajaxErrorHandler,
		success: function (data) {
			if (data != null) {
				$('#sendDoc').html(data);
				activateTab('SendTb');
			}
			else {
				swal({
					type: 'error',
					title: 'Error',
					text: response.message
				});
			}
		}


	});
}

function receivedDoc() {
	initialLoading = true;
	document.getElementById("docsSearchContainer").style.display = "none";
	const button = document.getElementById('toggleCheckboxesBtn');
	const iconClass = 'fa-list'; // or 'fa-times' depending on mode

	// Update innerHTML to include icon + text
	button.innerHTML = `<i id="checkboxToggleIcon" class="fa ${iconClass}" aria-hidden="true"></i>`;

	// Update classes
	button.classList.remove('select-mode', 'default-mode');
	button.classList.add('default-mode');

	// Optional: Update background or tooltip
	button.classList.remove('select-mode');
	button.classList.add('default-mode');
	button.title = 'Click here for multiple selection mode';


	const containers = document.querySelectorAll('.checkboxContainer');
	containers.forEach(container => {
		container.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
		container.style.display = 'none';

	});
	const signingButtonGroup = document.getElementById('signingButtonGroup');
	if (signingButtonGroup) signingButtonGroup.style.display = 'none';
	const selectedCountDisplay = document.getElementById('selectedCount');
	var initialval = 0;
	if (selectedCountDisplay) {
		selectedCountDisplay.innerText = `(${initialval})`;
	}
	selectedIdListData = [];
	window.selectedDocumentIds = [];
	document.getElementById("searchInput").value = "";
	const currentDocNo = localStorage.getItem("CurrentDocNo");
	if (currentDocNo !== null) {
		document.getElementById("searchInput").value = localStorage.getItem("DocumentsSearchValue")?.trim() || '';
	}
	else {
		localStorage.removeItem("DocumentsSearchValue");
	}
	const currentUrl = window.location.href.split('?')[0];
	const newUrl = `${currentUrl}?viewName=RecievedDocuments`;
	window.history.pushState(null, '', newUrl);

	$('#receiveDoc').empty();
	$('#myDoc').css('display', 'none');
	$('#sendDoc').css('display', 'none');
	$('#referredDoc').css('display', 'none');
	$('#receiveDoc').css('display', 'block');
	const intialShimmer = showInitialShimmer(5, "#receiveDoc");

	$.ajax({
		type: 'GET',
		url: recivedDocumentslist,
		error: ajaxErrorHandler,
		success: function (data) {
			if (data != null) {
				$('#receiveDoc').html(data);
				activateTab('RecvTb');

			}
			else {
				swal({
					type: 'error',
					title: 'Error',
					text: response.message
				});
			}
		}


	});
}

function referredDocument() {
	initialLoading = true;
	document.getElementById("docsSearchContainer").style.display = "none";
	const button = document.getElementById('toggleCheckboxesBtn');
	const iconClass = 'fa-list'; // or 'fa-times' depending on mode

	// Update innerHTML to include icon + text
	button.innerHTML = `<i id="checkboxToggleIcon" class="fa ${iconClass}" aria-hidden="true"></i>`;

	// Update classes
	button.classList.remove('select-mode', 'default-mode');
	button.classList.add('default-mode');

	// Optional: Update background or tooltip
	button.classList.remove('select-mode');
	button.classList.add('default-mode');
	button.title = 'Click here for multiple selection mode';


	const containers = document.querySelectorAll('.checkboxContainer');
	containers.forEach(container => {
		container.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
		container.style.display = 'none';

	});
	const signingButtonGroup = document.getElementById('signingButtonGroup');
	if (signingButtonGroup) signingButtonGroup.style.display = 'none';
	const selectedCountDisplay = document.getElementById('selectedCount');
	var initialval = 0;
	if (selectedCountDisplay) {
		selectedCountDisplay.innerText = `(${initialval})`;
	}
	selectedIdListData = [];
	window.selectedDocumentIds = [];
	document.getElementById("searchInput").value = "";
	const currentDocNo = localStorage.getItem("CurrentDocNo");
	if (currentDocNo !== null) {
		document.getElementById("searchInput").value = localStorage.getItem("DocumentsSearchValue")?.trim() || '';
	}
	else {
		localStorage.removeItem("DocumentsSearchValue");
	}
	const currentUrl = window.location.href.split('?')[0];
	const newUrl = `${currentUrl}?viewName=ReferedDocuments`;
	window.history.pushState(null, '', newUrl);

	$('#referredDoc').empty();
	$('#myDoc').css('display', 'none');
	$('#sendDoc').css('display', 'none');
	$('#receiveDoc').css('display', 'none');
	$('#referredDoc').css('display', 'block');
	const intialShimmer = showInitialShimmer(5, "#referredDoc");

	$.ajax({
		type: 'GET',
		url: referredDocumentslist,
		error: ajaxErrorHandler,
		success: function (data) {
			if (data != null) {
				$('#referredDoc').html(data);
				activateTab('CompTb');
			}
			else {
				swal({
					type: 'error',
					title: 'Error',
					text: response.message
				});
			}
		}


	});
}


function FilterData() {
	$('#Filter_Modal').addClass('show').css('display', 'block');
	initialFilterActiveTab = documentFilterActiveTab;
	initialFilterdaysVal = document.querySelector('input[name="filterDays"]:checked').value;
	initialFilterCountVal = document.querySelector('input[name="filterCount"]:checked').value;
	initialFilterDocumentStatusVal = document.querySelector('input[name="filterDocumentStatus"]:checked').value;
	initialFilterSigningStatusVal = document.querySelector('input[name="filterSigningStatus"]:checked').value;
}

function ResetFilter() {
	$('#Filter_Modal').removeClass('show').css('display', 'none');

	localStorage.setItem("selectedFilterTab", "time");
	localStorage.setItem("selectedDocumentDays", "last90days");
	localStorage.setItem("selectedDocumentCount", "latest50");
	localStorage.setItem("selectedDocumentStatus", "All");
	localStorage.setItem("selectedSigningStatus", "All");

	initializeFilterRadioButtons();
	setFilterTexts();

	if (activeTab == "List") {
		$('#myDoc').empty();
		myDocument();
	} else if (activeTab == "SendTb") {
		$('#sendDoc').empty();
		sendDocument();
	} else if (activeTab == "RecvTb") {
		$('#receiveDoc').empty();
		receivedDoc();
	} else {
		$('#referredDoc').empty();
		referredDocument();
	}

}

function applyfilter() {
	$('#Filter_Modal').removeClass('show').css('display', 'none');

	const filterSelector = document.getElementById("filterSelector");//values are "time", "latest"
	const filterDaysInput = document.querySelector('input[name="filterDays"]:checked');
	const filterCountInput = document.querySelector('input[name="filterCount"]:checked');
	const filterDocumentStatusInput = document.querySelector('input[name="filterDocumentStatus"]:checked');
	const filterSigningStatusInput = document.querySelector('input[name="filterSigningStatus"]:checked');
	//store it in local storage  
	localStorage.setItem("selectedFilterTab", filterSelector.value);
	localStorage.setItem("selectedDocumentDays", filterDaysInput.value);
	localStorage.setItem("selectedDocumentCount", filterCountInput.value);
	localStorage.setItem("selectedDocumentStatus", filterDocumentStatusInput.value);
	localStorage.setItem("selectedSigningStatus", filterSigningStatusInput.value);

	setFilterTexts();

	if (activeTab == "List") {
		$('#myDoc').empty();
		myDocument();
	} else if (activeTab == "SendTb") {
		$('#sendDoc').empty();
		sendDocument();
	} else if (activeTab == "RecvTb") {
		$('#receiveDoc').empty();
		receivedDoc();
	} else {
		$('#referredDoc').empty();
		referredDocument();
	}
}




function setFilterTexts() {
	const selectedTab = localStorage.getItem("selectedFilterTab") || "time";
	const selectedDocumentDays = localStorage.getItem("selectedDocumentDays") || "last90days";
	const selectedDocumentCount = localStorage.getItem("selectedDocumentCount") || "latest50";
	const selectedDocumentStatus = localStorage.getItem("selectedDocumentStatus") || "All";
	const selectedSigningStatus = localStorage.getItem("selectedSigningStatus") || "All";

	let documentFilter = "";

	if (selectedTab === "time") {
		// Get Selected Value
		const daysInput = document.querySelector(`input[name="filterDays"][value="${selectedDocumentDays}"]`);
		const daysLabel = document.querySelector(`label[for="${daysInput?.id}"]`);
		documentFilter = daysLabel?.textContent.trim() || '';
		document.getElementById("timePeriodIcon").style.display = "inline-block";
	} else {
		const countInput = document.querySelector(`input[name="filterCount"][value="${selectedDocumentCount}"]`);
		const countLabel = document.querySelector(`label[for="${countInput?.id}"]`);
		documentFilter = countLabel?.textContent.trim() || '';
		document.getElementById("timePeriodIcon").style.display = "none";
	}

	const docStatusInput = document.querySelector(`input[name="filterDocumentStatus"][value="${selectedDocumentStatus}"]`);
	const docStatusLabel = document.querySelector(`label[for="${docStatusInput?.id}"]`);

	const signStatusInput = document.querySelector(`input[name="filterSigningStatus"][value="${selectedSigningStatus}"]`);
	const signStatusLabel = document.querySelector(`label[for="${signStatusInput?.id}"]`);

	const documentStatus = docStatusLabel ? docStatusLabel.textContent.trim() : '';
	const signingStatus = signStatusLabel ? signStatusLabel.textContent.trim() : '';

	document.getElementById("filterdays").textContent = documentFilter;
	document.getElementById("filterDocumentStatusText").textContent = documentStatus;
	document.getElementById("filterSigningStatusText").textContent = signingStatus;

	document.getElementById("filterDaysStatusContainer").style.display = (documentFilter === "All") ? "none" : "block";
	document.getElementById("documentStatusContainer").style.display = (documentStatus === "All") ? "none" : "block";
	document.getElementById("signingStatusContainer").style.display = (signingStatus === "All") ? "none" : "block";
}


function initializeFilterRadioButtons() {
	const selectedFilterTab = localStorage.getItem("selectedFilterTab");
	const selectedDocumentDays = localStorage.getItem("selectedDocumentDays");
	const selectedDocumentCount = localStorage.getItem("selectedDocumentCount");
	const selectedDocumentStatus = localStorage.getItem("selectedDocumentStatus");
	const selectedSigningStatus = localStorage.getItem("selectedSigningStatus");

	// Set filterSelector dropdown
	if (selectedFilterTab) {
		document.getElementById("filterSelector").value = selectedFilterTab;

		// Toggle visibility of day/count sections
		if (selectedFilterTab === "time") {
			document.getElementById("daysFilterSection").style.display = "flex";
			document.getElementById("docsFilterSection").style.display = "none";
		} else {
			document.getElementById("daysFilterSection").style.display = "none";
			document.getElementById("docsFilterSection").style.display = "flex";
		}
	}

	// Set Days filter radio button
	if (selectedDocumentDays) {
		const dayRadio = document.querySelector(`input[name="filterDays"][value="${selectedDocumentDays}"]`);
		if (dayRadio) {
			dayRadio.checked = true;
		}
	}

	// Set Count filter radio button
	if (selectedDocumentCount) {
		const countRadio = document.querySelector(`input[name="filterCount"][value="${selectedDocumentCount}"]`);
		if (countRadio) {
			countRadio.checked = true;
		}
	}

	// Set Document Status filter radio button
	if (selectedDocumentStatus) {
		const docStatusRadio = document.querySelector(`input[name="filterDocumentStatus"][value="${selectedDocumentStatus}"]`);
		if (docStatusRadio) {
			docStatusRadio.checked = true;
		}
	}

	// Set Signing Status filter radio button
	if (selectedSigningStatus) {
		const signStatusRadio = document.querySelector(`input[name="filterSigningStatus"][value="${selectedSigningStatus}"]`);
		if (signStatusRadio) {
			signStatusRadio.checked = true;
		}
	}
}



function closefilter() {
	$('#Filter_Modal').removeClass('show').css('display', 'none');
	const daysFilterSection = document.getElementById("daysFilterSection");
	const docsFilterSection = document.getElementById("docsFilterSection");
	if (initialFilterActiveTab === "latestCount") {
		daysFilterSection.style.display = "none";
		docsFilterSection.style.display = "flex";
		documentFilterActiveTab = "latestCount";
		document.getElementById("filterSelector").value = "latest";
		document.getElementById("timeIcon").style.display = "none";
		document.getElementById("latestCountIcon").style.display = "inline-block";
	}
	else {
		daysFilterSection.style.display = "flex";
		docsFilterSection.style.display = "none";
		documentFilterActiveTab = "timePeriod";
		document.getElementById("filterSelector").value = "time";
		document.getElementById("timeIcon").style.display = "inline-block";
		document.getElementById("latestCountIcon").style.display = "none";
	}

	document.querySelector(`input[name="filterCount"][value="${initialFilterCountVal}"]`).checked = true;
	document.querySelector(`input[name="filterDays"][value="${initialFilterdaysVal}"]`).checked = true;
	document.querySelector(`input[name="filterDocumentStatus"][value="${initialFilterDocumentStatusVal}"]`).checked = true;
	document.querySelector(`input[name="filterSigningStatus"][value="${initialFilterSigningStatusVal}"]`).checked = true;
}



function storeFilters() {
	if (localStorage.getItem("selectedFilterTab") === null) {
		localStorage.setItem("selectedFilterTab", "time");
	}

	if (localStorage.getItem("selectedDocumentDays") === null) {
		localStorage.setItem("selectedDocumentDays", "last90days");
	}

	if (localStorage.getItem("selectedDocumentCount") === null) {
		localStorage.setItem("selectedDocumentCount", "latest50");
	}

	if (localStorage.getItem("selectedDocumentStatus") === null) {
		localStorage.setItem("selectedDocumentStatus", "All");
	}

	if (localStorage.getItem("selectedSigningStatus") === null) {
		localStorage.setItem("selectedSigningStatus", "All");
	}

}


function toggleCheckboxes() {
	const containers = document.querySelectorAll('.checkboxContainer');
	const button = document.getElementById('toggleCheckboxesBtn');
	const icon = document.getElementById('checkboxToggleIcon');
	const signingButtonGroup = document.getElementById('signingButtonGroup');
	const showButtonGroup = document.getElementById('showButtonGroup');
	const anyVisible = Array.from(containers).some(container => container.style.display === 'block');

	if (anyVisible) {
		// Hide containers and uncheck all checkboxes
		document.getElementById("selectAllCheckboxContainer").style.display = 'none';
		document.getElementById("selectAllCheckbox").checked = false;
		containers.forEach(container => {
			container.style.display = 'none';
			container.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
		});

		if (signingButtonGroup) signingButtonGroup.style.display = 'none';

		// Change icon and tooltip
		icon.className = 'fa fa-list';
		button.setAttribute('title', 'Click here for multiple selection mode');
	} else {
		// Show containers
		document.getElementById("selectAllCheckboxContainer").style.display = 'block';
		containers.forEach(container => container.style.display = 'block');

		//if (signingButtonGroup) signingButtonGroup.style.display = 'inline-flex';

		// Change icon and tooltip
		icon.className = 'fa fa-external-link';
		button.setAttribute('title', 'Click here for single selection mode');
	}
}





function fetchTooltipMessage(organizationID) {
	return new Promise((resolve, reject) => {
		$.ajax({
			url: '/Documents/GetOrganizationStatus',
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
		contentType: 'application/json',
		headers: {

			'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

		},
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
					window.location.href = "/GroupSigning/DocumentsSigningStatus?groupId=" + response.result;
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
			type: "info",
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
		contentType: 'application/json',
		headers: {

			'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

		},
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
						window.location.href = "/GroupSigning/DocumentsSigningStatus?groupId=" + response.result;
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


window.updateSelectedIdList = function () {
	const selectedCheckboxes = document.querySelectorAll('.document-checkbox:checked');
	const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);

	console.log("Selected IDs:", selectedIds);

	const buttonGroup = document.getElementById('signingButtonGroup');
	if (buttonGroup) {
		buttonGroup.style.display = selectedIds.length > 0 ? 'inline-flex' : 'none';
	}
	const selectedCountDisplay = document.getElementById('selectedCount');
	if (selectedCountDisplay) {
		selectedCountDisplay.innerText = `(${selectedIds.length})`;
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

