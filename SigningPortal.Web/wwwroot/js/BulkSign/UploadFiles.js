var selectedFiles = [];
var selectedTemplateId = '';
var worddocCovertedFiles = [];
var selectedFilesTotallist = [];


const pdfjsLib = window['pdfjs-dist/build/pdf'];

if (!pdfjsLib) {
	console.error('PDF.js library is not loaded.');
} else {

	pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
}


$('#DocumentTemplate').change(function () {

	selectedTemplateId = $(this).val();
	if (selectedTemplateId != '') {

		selectedFiles = [];
		totalfilessize = 0;
		var uploadpart = document.getElementById('uploadpart');
		uploadpart.style.display = 'block';
		document.getElementById('scopesTable').style.display = 'none';
		document.getElementById('fileTableContainer').style.display = 'none';
		document.getElementById('folderInput').value = '';
		document.getElementById('fileInput').value = '';

	}
	else {
		var uploadpart = document.getElementById('uploadpart');
		uploadpart.style.display = 'none';
		document.getElementById('scopesTable').style.display = 'none';
		document.getElementById('fileTableContainer').style.display = 'none';
		document.getElementById('folderInput').value = '';
		document.getElementById('fileInput').value = '';

	}

});
$(document).ready(function () {
	document.getElementById("navigationNetworkOverlay").style.display = "none";
	$('#networkOverlay').hide();

	$('#BulkSign').addClass('active');

	// $('#scopesTable').DataTable({
	// 	searching: true,
	// 	paging: true,
	// 	lengthChange: false,
	// 	pageLength: 5,
	// 	orderClasses: false,
	// 	stripeClasses: [],
	// 	info: false,
	// 	"ordering": false,
	// 	responsive: true

	// });
	getFileConfiguration();

	$("#fileRadio").on("change", function () {
		showFileInput();
	});

	$("#folderRadio").on("change", function () {
		showFolderInput();
	});

	$("#chooseFilesBtn").on("click", function () {
		chooseFiles();
	});

	$("#chooseFolderBtn").on("click", function () {
		chooseFolder();
	});

	$("#removeAllBtn").on("click", function () {
		handleRemoveAll();
	});

	$("#uploadfiles").on("click", function () {
		uploadFiles();
	});

	$("#bulksignbutton").on("click", function () {
		PerformBulkSign();
	});

	$("#sendrequest").on("click", function () {
		SendRequest();
	});

	$("#saverequest").on("click", function () {
		SaveRequest();
	});

	$("#fileInput").on("change", function (event) {
		handleSelection(event);
	});

	$("#folderInput").on("change", function (event) {
		handleSelection1(event);
	});

});

function showOverlay(matchedEsealData, matchedSignData) {
	if (matchedEsealData == null && matchedSignData !== null) {
		$('#overlay8').css('display', 'flex');
	} else if (matchedEsealData !== null && matchedSignData === null) {
		$('#overlay6').css('display', 'flex');

	} else if (matchedEsealData !== null && matchedSignData !== null) {
		$('#overlay7').css('display', 'flex');

	} else {
		$('#overlay8').css('display', 'flex');

	}
}

function hideOverlay(matchedEsealData, matchedSignData) {
	if (matchedEsealData == null && matchedSignData !== null) {
		$('#overlay8').hide();
	} else if (matchedEsealData !== null && matchedSignData === null) {
		$('#overlay6').hide();

	} else if (matchedEsealData !== null && matchedSignData !== null) {
		$('#overlay7').hide();
	} else {
		$('#overlay8').hide();

	}

}

function ActivateUploadfilesButton() {
	document.getElementById('uploadfiles').style.display = 'flex';
	document.getElementById('fileInput').value = '';
	document.getElementById('folderInput').value = '';
}
function handleRemoveAll() {
	selectedFiles = [];
	totalfilessize = 0;
	selectedFilesTotallist = [];
	var fileInput = document.getElementById('fileInput');
	fileInput.value = '';
	var folderInput = document.getElementById('folderInput');
	folderInput.value = '';
	var tableContainer = document.getElementById('fileTableContainer');
	tableContainer.style.display = selectedFiles.length > 0 ? 'block' : 'none';
}

function AddFilesData(filesArray) {
	var tableContainer = document.getElementById('fileTableContainer');
	tableContainer.style.display = filesArray.length > 0 ? 'block' : 'none';
	var tableBody = document.getElementById('FilesTable').getElementsByTagName('tbody')[0];

	tableBody.innerHTML = "";

	for (var i = 0; i < filesArray.length; i++) {
		var row = tableBody.insertRow(i);
		var cell1 = row.insertCell(0);

		cell1.textContent = filesArray[i].name;

	}

	$('#FilesTable').css('display', 'block');
	$('#scopesTable').DataTable().destroy();
	$('#scopesTable').css('display', 'none');
	$('#FilesTable').DataTable({
		searching: true,
		paging: true,
		lengthChange: false,
		pageLength: 10,
		orderClasses: false,
		stripeClasses: [],
		info: false,
		"ordering": false,
		responsive: true


	});

}

async function convertDocxToPDF(wordFile) {
	return new Promise(async (resolve, reject) => {
		try {
			const { docViewer, PDFNet, CoreControls } = webviwerInstance;
			const licenseKey = "DigitalTrust Technologies Pvt Ltd:OEM:Digital Signature Services Portal::B+:AMS(20270629):3CA5587D04B7080AC360B13AC982536160617FD5C900ED4BF50419D44A60189E528AB6F5C7";
			await PDFNet.initialize(licenseKey);
			const annotManager = docViewer.getAnnotationManager();

			// Load the document
			const arrayBuffer = await convertFileToArrayBuffer(wordFile);
			let blob1 = new Blob([arrayBuffer], { type: wordFile.type });
			let url = URL.createObjectURL(blob1);
			webviwerInstance.loadDocument(url, { filename: wordFile.name });

			// Wait for the document to load
			webviwerInstance.docViewer.on('documentLoaded', async () => {
				try {
					const xfdfString = await annotManager.exportAnnotations();

					// Ensure that the document is loaded before calling getFileData
					const document = webviwerInstance.docViewer.getDocument();
					if (document) {
						const data = await document.getFileData({
							xfdfString,
							flags: CoreControls.SaveOptions.INCREMENTAL,
							downloadType: "pdf",
						});

						const doc = await PDFNet.PDFDoc.createFromBuffer(new Uint8Array(data));
						doc.lock();
						const buf = await doc.saveMemoryBuffer(PDFNet.SDFDoc.SaveOptions.e_incremental);
						const pdfBlob = new Blob([buf], { type: "application/pdf" });
						console.log(pdfBlob);
						const pdfFile = new File(
							[pdfBlob],
							wordFile.name.replace(/\.(docx|xlsx)$/, '.pdf'),
							{
								type: 'application/pdf',
								lastModified: wordFile.lastModified,
							}
						);
						resolve(pdfFile);
					} else {
						console.error("Document could not be loaded properly.");
						reject("Document loading failed.");
					}
				} catch (error) {
					console.error("An error occurred:", error);
					reject(error);
				}
			});
		} catch (error) {
			console.error("An error occurred during initialization:", error);
			reject(error);
		}
	});
}




function showFileInput() {

	$('#my-dropzone').css('visibility', 'visible');
	document.getElementById('scopesTable').style.display = 'none';
	document.getElementById('fileTableContainer').style.display = 'none';
	document.getElementById('folderInput').value = '';
	document.getElementById('fileInput').value = '';
	selectedFiles = [];
	document.getElementById('fileinputdisplay').style.display = 'flex';
	document.getElementById('folderinputdisplay').style.display = 'none';
	/*document.getElementById('getFiles').style.visibility = 'hidden';*/
	$('#scopesTable').css('display', 'none');
	$('#uploadfiles').css('display', 'none');
	$('#fileTableContainer').css('display', 'none');
	if ($.fn.DataTable.isDataTable('#scopesTable')) {
		$('#scopesTable').DataTable().destroy();
	}

	var tableBody = document.getElementById('scopesTable').getElementsByTagName('tbody')[0];

	tableBody.innerHTML = "";
}

async function handleSelection1(event) {

	var fileInput = document.getElementById('folderInput');

	if ($.fn.DataTable.isDataTable('#scopesTable')) {
		$('#scopesTable').DataTable().destroy();
	}

	if (selectedFiles.length > 0) {
		var duplicateList = [];
		for (var i = 0; i < fileInput.files.length; i++) {
			var fileNameData = fileInput.files[i].name;
			var foundFile = selectedFiles.find(function (item) {
				return item.name === fileNameData;
			});
			if (foundFile) {
				duplicateList.push(foundFile.name);
			}
		}
		if (duplicateList.length > 0) {
			var duplicateString = duplicateList.join(', ');
			swal({
				type: 'info',
				title: 'Alert',
				text: duplicateString + ': Files Already Existed'

			});
			document.getElementById('folderInput').value = '';

			return;
		}
	}


	for (let i = 0; i < fileInput.files.length; i++) {
		$('#overlay').show();
		const file = fileInput.files[i];
		const fileExtension = file.name.split('.').pop().toLowerCase();

		try {
			if (fileExtension === 'pdf') {
				const valid = await validatePDF(file);
				if (!valid) {
					document.getElementById('folderInput').value = '';
					return;
				}
			} else if (fileExtension === 'docx') {
				console.log("Converting DOCX to PDF:", file);
				const pdfFile = await processDocxFile(file); // Process each file one by one
				worddocCovertedFiles.push(pdfFile);
			} else if (fileExtension === 'xlsx') {
				console.log("Converting xlsx to PDF:", file);
				const pdfFile = await processDocxFile(file); // Process each file one by one
				worddocCovertedFiles.push(pdfFile);
			}
			else {
				alert("Only PDF or DOCX or XLSX files are allowed.");
				fileInput.value = ''; // Clear the input if invalid file type
				return;
			}
		} catch (error) {
			console.error("Error processing file:", error);
		} finally {
			$('#overlay').hide();
		}
	}


	var totalfiles = selectedFiles.length + fileInput.files.length;
	if (totalfiles > NumberOfFiles) {
		swal({
			type: 'info',
			title: 'Alert',
			text: 'You can only select up to  ' + NumberOfFiles + ' files.'
		});
		document.getElementById('folderInput').value = '';

		return;
	}
	if (fileInput.files.length > NumberOfFiles) {
		swal({
			type: 'info',
			title: 'Alert',
			text: 'You can only select up to  ' + NumberOfFiles + ' files.'
		});
		document.getElementById('folderInput').value = '';

		return;
	}

	var currentFolderSize = 0;
	for (var i = 0; i < fileInput.files.length; i++) {
		var fileName = fileInput.files[i].name;
		var fileOnlyname = fileName.split('.').slice(0, -1).join('.')
		const fileExtension = fileName.split('.').pop().toLowerCase();
		if (fileExtension === 'docx' || fileExtension === 'xlsx') {
			var replacefile = worddocCovertedFiles.find(item => item.name.split('.').slice(0, -1).join('.') === fileOnlyname);
			var fileSize = replacefile.size;
			var maxSize = EachFileSize * 1000000;
			currentFolderSize = currentFolderSize + fileSize;
			if (fileSize > maxSize) {
				swal({
					type: 'info',
					title: 'Alert',
					text: 'File Size Exceeded: ' + fileName + ' exceeds the ' + EachFileSize + 'MB limit.'
				});
				document.getElementById('folderInput').value = '';

				return;
			}
		} else {
			var fileSize = fileInput.files[i].size;
			var maxSize = EachFileSize * 1000000;
			currentFolderSize = currentFolderSize + fileSize;
			if (fileSize > maxSize) {
				swal({
					type: 'info',
					title: 'Alert',
					text: 'File Size Exceeded: ' + fileName + ' exceeds the ' + EachFileSize + 'MB limit.'
				});
				document.getElementById('folderInput').value = '';

				return;
			}
		}

	}

	if (totalfilessize + currentFolderSize > (AllFileSize * 1000000)) {
		swal({
			type: 'info',
			title: 'Alert',
			text: 'Folder Size Limit Exceeded: Your folder size exceeds the 50 MB limit',
		});
		document.getElementById('folderInput').value = '';

		return;
	}
	totalfilessize = totalfilessize + currentFolderSize;

	for (var i = 0; i < fileInput.files.length; i++) {
		var fileName = fileInput.files[i].name;
		var fileOnlyname = fileName.split('.').slice(0, -1).join('.')
		const fileExtension = fileName.split('.').pop().toLowerCase();
		if (fileExtension === 'docx' || fileExtension === 'xlsx') {
			var replacefile = worddocCovertedFiles.find(item => item.name.split('.').slice(0, -1).join('.') === fileOnlyname);
			var updatedFile2 = new File([replacefile], replacefile.name, { type: replacefile.type });

			selectedFilesTotallist.push(updatedFile2);
		} else {
			var updatedFile3 = new File([fileInput.files[i]], fileInput.files[i].name, { type: fileInput.files[i].type });

			selectedFilesTotallist.push(updatedFile3);

		}
	}

	for (var i = 0; i < fileInput.files.length; i++) {
		//selectedFiles.push(fileInput.files[i]);
		var updatedFile1 = new File([fileInput.files[i]], fileInput.files[i].name, { type: fileInput.files[i].type });
		selectedFiles.push(updatedFile1);

	}
	

	AddTableData();
}


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



function getFileConfiguration() {
	$.ajax({
		type: 'GET',
		url: GetFileConfigurationUrl,
		success: function (data) {
			EachFileSize = data.eachFileSize;
			NumberOfFiles = data.numberOfFiles;
			AllFileSize = data.allFileSize;
		},
		error: ajaxErrorHandler,
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


// async function processDocxFile(wordFile) {
// 	return new Promise((resolve, reject) => {
// 		const { docViewer, PDFNet, CoreControls } = webviwerInstance;
// 		const licenseKey = "DigitalTrust Technologies Pvt Ltd:OEM:Digital Signature Services Portal::B+:AMS(20270629):3CA5587D04B7080AC360B13AC982536160617FD5C900ED4BF50419D44A60189E528AB6F5C7";

// 		Initialize PDFNet
// 		PDFNet.initialize(licenseKey)
// 			.then(async () => {
// 				const arrayBuffer = await convertFileToArrayBuffer(wordFile);
// 				const blob = new Blob([arrayBuffer], { type: wordFile.type });
// 				const url = URL.createObjectURL(blob);

// 				Remove existing documentLoaded listeners
// 				webviwerInstance.docViewer.off('documentLoaded');

// 				webviwerInstance.loadDocument(url, { filename: wordFile.name });

// 				webviwerInstance.docViewer.on('documentLoaded', async () => {
// 					try {
// 						const annotManager = webviwerInstance.docViewer.getAnnotationManager();
// 						const xfdfString = await annotManager.exportAnnotations();

// 						const document = webviwerInstance.docViewer.getDocument();
// 						if (document) {
// 							const data = await document.getFileData({
// 								xfdfString,
// 								flags: CoreControls.SaveOptions.INCREMENTAL,
// 								downloadType: "pdf",
// 							});

// 							const doc = await PDFNet.PDFDoc.createFromBuffer(new Uint8Array(data));
// 							doc.lock();
// 							const buf = await doc.saveMemoryBuffer(PDFNet.SDFDoc.SaveOptions.e_incremental);
// 							const pdfBlob = new Blob([buf], { type: "application/pdf" });

// 							const pdfFile = new File(
// 								[pdfBlob],
// 								wordFile.name.replace(/\.(docx|xlsx)$/, '.pdf'),
// 								{
// 									type: 'application/pdf',
// 									lastModified: wordFile.lastModified,
// 								}
// 							);
// 							resolve(pdfFile);
// 						} else {
// 							reject("Document loading failed.");
// 						}
// 					} catch (error) {
// 						reject(error);
// 					}
// 				});
// 			})
// 			.catch(reject);
// 	});
// }


async function processDocxFile(wordFile) {
	try {
		// Create a FormData object and append the file
		let formData = new FormData();
		formData.append("file", wordFile);

		// Send the file to your conversion service
		let response = await fetch("/ConvertToPdf/ConvertFile", { // Adjust the API endpoint if needed
			method: "POST",
			headers: {

				'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

			},
			body: formData
		});

		// Check if the response is OK
		if (!response.ok) {
			document.getElementById('fileInput').value = '';
			const errorText = await response.text();
			swal({
				type: 'info',
				title: 'Info',
				text: errorText
			});
			return;
		}

		// Convert response to a Blob
		let blob = await response.blob();

		// Create a new File object for the converted PDF
		const pdfFile = new File(
			[blob],
			wordFile.name.replace(/\.\w+$/, ".pdf"), // Ensure correct file extension
			{ type: "application/pdf", lastModified: wordFile.lastModified }
		);

		return pdfFile; // Return the converted file
	} catch (error) {
		console.error("Error during file conversion:", error);
		throw error; // Propagate the error
	}
}




async function handleSelection(event) {

	var fileInput = document.getElementById('fileInput');

	// Reset totalfilessize to 0 at the beginning
	/*var totalfilessize = 0;*/

	if ($.fn.DataTable.isDataTable('#scopesTable')) {
		$('#scopesTable').DataTable().destroy();
	}

	if (selectedFiles.length > 0) {
		var duplicateList = [];
		for (var i = 0; i < fileInput.files.length; i++) {
			var fileNameData = fileInput.files[i].name;
			var foundFile = selectedFiles.find(function (item) {
				return item.name === fileNameData;
			});
			if (foundFile) {
				duplicateList.push(foundFile.name);
			}
		}
		if (duplicateList.length > 0) {
			var duplicateString = duplicateList.join(', ');
			swal({
				type: 'info',
				title: 'Alert',
				text: duplicateString + ': Files Already Existed'
			});
			document.getElementById('fileInput').value = '';

			return;
		}
	}


	for (let i = 0; i < fileInput.files.length; i++) {
		$('#overlay').show();
		const file = fileInput.files[i];
		const fileExtension = file.name.split('.').pop().toLowerCase();

		try {
			if (fileExtension === 'pdf') {
				const valid = await validatePDF(file);
				if (!valid) {
					document.getElementById('fileInput').value = '';
					return;
				}
			} else if (fileExtension === 'docx') {
				console.log("Converting DOCX to PDF:", file);
				const pdfFile = await processDocxFile(file); // Process each file one by one
				worddocCovertedFiles.push(pdfFile);
			} else if (fileExtension === 'xlsx') {
				console.log("Converting xlsx to PDF:", file);
				const pdfFile = await processDocxFile(file); // Process each file one by one
				worddocCovertedFiles.push(pdfFile);
			}
			else {
				alert("Only PDF or DOCX or XLSX files are allowed.");
				fileInput.value = ''; // Clear the input if invalid file type
				return;
			}
		} catch (error) {
			console.error("Error processing file:", error);
		} finally {
			$('#overlay').hide();
		}
	}


	var totalfiles = selectedFiles.length + fileInput.files.length;
	if (totalfiles > NumberOfFiles) {
		swal({
			type: 'info',
			title: 'Alert',
			text: 'You can only select up to ' + NumberOfFiles + ' files.'
		});
		document.getElementById('fileInput').value = '';

		return;
	}
	if (fileInput.files.length > NumberOfFiles) {
		swal({
			type: 'info',
			title: 'Alert',
			text: 'You can only select up to ' + NumberOfFiles + ' files.'
		});
		document.getElementById('fileInput').value = '';

		return;
	}

	var currentFolderSize = 0;
	for (var i = 0; i < fileInput.files.length; i++) {
		var fileName = fileInput.files[i].name;
		var fileOnlyname = fileName.split('.').slice(0, -1).join('.')
		const fileExtension = fileName.split('.').pop().toLowerCase();
		if (fileExtension === 'docx' || fileExtension === 'xlsx') {
			var replacefile = worddocCovertedFiles.find(item => item.name.split('.').slice(0, -1).join('.') === fileOnlyname);
			var fileSize = replacefile.size;
			var maxSize = EachFileSize * 1000000;
			currentFolderSize = currentFolderSize + fileSize;
			if (fileSize > maxSize) {
				swal({
					type: 'info',
					title: 'Alert',
					text: 'File Size Exceeded: ' + fileName + ' exceeds the ' + EachFileSize + 'MB limit.'
				});
				document.getElementById('fileInput').value = '';

				return;
			}
		} else {
			var fileSize = fileInput.files[i].size;
			var maxSize = EachFileSize * 1000000;
			currentFolderSize = currentFolderSize + fileSize;
			if (fileSize > maxSize) {
				swal({
					type: 'info',
					title: 'Alert',
					text: 'File Size Exceeded: ' + fileName + ' exceeds the ' + EachFileSize + 'MB limit.'
				});
				document.getElementById('fileInput').value = '';

				return;
			}
		}

	}

	if (totalfilessize + currentFolderSize > (AllFileSize * 1000000)) {
		swal({
			type: 'info',
			title: 'Alert',
			text: 'Folder Size Limit Exceeded: Your folder size exceeds the 50 MB limit',
		});
		document.getElementById('fileInput').value = '';

		return;
	}
	totalfilessize = totalfilessize + currentFolderSize;

	for (var i = 0; i < fileInput.files.length; i++) {
		var fileName = fileInput.files[i].name;
		var fileOnlyname = fileName.split('.').slice(0, -1).join('.')
		const fileExtension = fileName.split('.').pop().toLowerCase();
		if (fileExtension === 'docx' || fileExtension === 'xlsx') {
			var replacefile = worddocCovertedFiles.find(item => item.name.split('.').slice(0, -1).join('.') === fileOnlyname);
			selectedFilesTotallist.push(replacefile);
		} else {
			selectedFilesTotallist.push(fileInput.files[i]);

		}
	}

	for (var i = 0; i < fileInput.files.length; i++) {
		selectedFiles.push(fileInput.files[i]);
	}


	AddTableData();
}

function chooseFiles() {
	var fileInput = document.getElementById('fileInput');
	if (fileInput) {
		fileInput.click(); // Trigger the click event
	} else {
		console.error("File input element not found.");
	}

}

function chooseFolder() {
	var folderInput = document.getElementById('folderInput');
	if (folderInput) {
		folderInput.click(); // Trigger the click event
	} else {
		console.error("File input element not found.");
	}

}


function showFolderInput() {
	$('#my-dropzone').css('visibility', 'visible');
	selectedFiles = [];
	document.getElementById('scopesTable').style.display = 'none';
	document.getElementById('fileTableContainer').style.display = 'none';
	document.getElementById('fileInput').value = '';
	document.getElementById('folderInput').value = '';
	document.getElementById('fileinputdisplay').style.display = 'none';
	document.getElementById('folderinputdisplay').style.display = 'flex';
	/*document.getElementById('getFiles').style.visibility = 'hidden';*/

	$('#scopesTable').css('display', 'none');
	$('#uploadfiles').css('display', 'none');
	$('#fileTableContainer').css('display', 'none');
	if ($.fn.DataTable.isDataTable('#scopesTable')) {
		$('#scopesTable').DataTable().destroy();
	}

	var tableBody = document.getElementById('scopesTable').getElementsByTagName('tbody')[0];

	tableBody.innerHTML = "";
}

function cropFileNames(full) {

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
	else {
		start = 10;
		end = 10;
	}

	if (full && full.length > start + end) {
		return full.slice(0, start) + '...' + full.slice(-end);
	} else {
		return full
	}



}

function AddTableData() {
	var tableBody = document.getElementById('scopesTable').getElementsByTagName('tbody')[0];
	var fileCountDisplay = document.getElementById('fileCountDisplay');

	tableBody.innerHTML = "";

	for (var i = 0; i < selectedFiles.length; i++) {
		var row = tableBody.insertRow(i);
		var cell1 = row.insertCell(0);
		var cell2 = row.insertCell(1);


		if (selectedFiles[i].name.length > 50) {
			cell1.textContent = cropFileNames(selectedFiles[i].name);
			cell1.title = selectedFiles[i].name;
			cell1.style.cursor = "pointer";
		}
		else {
			cell1.textContent = selectedFiles[i].name;
		}

		var deleteButton = document.createElement('button');
		deleteButton.style.backgroundImage = "url('/img/delete-F44336.png')";
		deleteButton.style.backgroundSize = "cover"; // Adjust size as needed
		deleteButton.style.width = "24px"; // Set the width of the button
		deleteButton.style.height = "24px"; // Set the height of the button
		deleteButton.style.border = "none"; // Optional: remove border
		deleteButton.style.borderRadius = '50%';
		deleteButton.style.border = 'none';
		deleteButton.style.outline = 'none';
		deleteButton.style.backgroundColor = 'none';
		deleteButton.style.backgroundColor = "white"; // Optional: make background transparent
		document.body.appendChild(deleteButton);
		deleteButton.onclick = function () {
			if ($.fn.DataTable.isDataTable('#scopesTable')) {
				$('#scopesTable').DataTable().destroy();
			}
			var fileNameToRemove = this.parentElement.parentElement.cells[0].textContent;
			selectedFiles = selectedFiles.filter(file => file.name !== fileNameToRemove);
			var filterlistdata = [];
			for (var x = 0; x < selectedFilesTotallist.length; x++) {
				var fileOnlyname = selectedFilesTotallist[x].name.split('.').slice(0, -1).join('.');
				var fileremoveOnlyname = fileNameToRemove.split('.').slice(0, -1).join('.');
				if (fileOnlyname !== fileremoveOnlyname) {
					filterlistdata.push(selectedFilesTotallist[x]);
				}

			}

			selectedFilesTotallist = filterlistdata;
			tableBody.removeChild(this.parentElement.parentElement);
			fileCountDisplay.textContent = 'Total Documents Uploaded :' + selectedFiles.length;
			tableContainer.style.display = selectedFiles.length > 0 ? 'block' : 'none';
			if (selectedFiles.length == 0) {
				selectedFiles = [];
				totalfilessize = 0;
				var folderInput = document.getElementById('folderInput');
				folderInput.value = '';
				var fileInput = document.getElementById('fileInput');
				fileInput.value = '';
			}
			$('#scopesTable').DataTable({
				pageLength: 10,
				searching: true,
				ordering: false,
				paging: true,
				responsive: true
			});
		};

		cell2.appendChild(deleteButton);
	}
	fileCountDisplay.textContent = 'Total Documents Uploaded :' + selectedFiles.length;
	var tableContainer = document.getElementById('fileTableContainer');
	tableContainer.style.display = selectedFiles.length > 0 ? 'block' : 'none';
	document.getElementById('scopesTable').style.display = 'inline-table';


	ActivateUploadfilesButton();
	$('#scopesTable').DataTable({
		pageLength: 10,
		searching: true,
		ordering: false,
		paging: true,
		responsive: true,
	});
}




function UpdateDetails() {
	var corelationid = CorelationId;
	$.ajax({
		url: UpdateDocumentDetailsUrl,
		method: 'GET',
		data: { correlationId: corelationid },
		success: function (data) {
			if (data.totalFileCount > 0) {
				var fileArray = data.fileArray;
				if (data.totalFileCount == data.successFileCount) {
					swal({
						type: 'success',
						title: "Upload files",
						text: "All files uploaded successfully",
						showCancelButton: false,
						closeOnConfirm: true

					});

				}
				else {
					swal({
						type: 'info',
						title: "Upload files",
						text: data.successFileCount + 'out of ' + data.totalFileCount + 'uploaded',
						showCancelButton: false,
						closeOnConfirm: true

					});

				}
				updateTable(fileArray);
			}
		},
		error: ajaxErrorHandler
	});
}

function ActivateBulkSignButton() {

	document.getElementById('bulksignbutton').style.display = 'flex';
}

function ActivateSendRequestButton() {
	document.getElementById('sendrequest').style.display = 'flex';
}


function SendRequest() {
	var correlationId = CorelationId;
	$.ajax({
		url: SendRequestUrl,
		method: 'POST',
		headers: {

			'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

		},
		contentType: "application/json",
		data: JSON.stringify(correlationId),
		beforeSend: function () {
			$('#overlay').show();
		},
		complete: function () {
			$('#overlay').hide();
		},
		success: function (response) {
			if (response.success == false) {

				swal({
					type: 'error',
					title: "Send Request",
					text: response.message,
				}, function (isConfirm) {
					if (isConfirm) {

					}
				});

			}
			else {
				swal({
					type: 'success',
					title: "Send Request",
					text: "Successfully sent",
					showCancelButton: false,
					closeOnConfirm: true
				}, function (isConfirm) {
					if (isConfirm) {
						window.location.href = BulkSignIndexUrl + "?viewName=SentDocuments";
					}
				});
			}


		},
		error: ajaxErrorHandler
	});
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
							window.location.href = BulkSignIndexUrl;
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

async function uploadFiles() {
	selectedFiles = selectedFilesTotallist;
	var transactionName = document.getElementById('inputField1').value;
	if (transactionName === null || transactionName.trim() === '') {
		swal({
			type: 'info',
			title: "Server Message",
			text: "Transaction name cannot be empty or blank spaces",
			showCancelButton: false,
			closeOnConfirm: true
		});
		return;
	}

	if (selectedFiles.length > 0) {
		var delegation_req_data = {
			id: loginOrgId,
			suid: loginSuid,
			email: loginEmail,
		};

		// Await the response from delegation check
		var delegation_response = await handle_delegation_orgid_suid_selfloginuser(delegation_req_data);

		if (delegation_response != undefined && delegation_response.listdata.length > 0) {
			console.log("Delegation found. Further processing stopped.");
			swal({
				type: 'info',
				title: 'Info',
				text: "Signing cannot be performed because there is an active signature delegation",
			});
			return false; // Stop further execution
		} else {
			var formData = new FormData();
			for (var i = 0; i < selectedFiles.length; i++) {
				formData.append('files', selectedFiles[i]);
			}
			formData.append('displayName', document.getElementById('inputField1').value);
			formData.append('id', document.getElementById('DocumentTemplate').value);
			$.ajax({
				url: SendFilesUrl,
				method: 'POST',
				headers: {

					'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

				},
				data: formData,
				processData: false,
				contentType: false,
				beforeSend: function () {
					$('#overlay').show();
				},
				complete: function () {
					$('#overlay').hide();
				},
				success: function (response) {
					if (response.success == true) {
						CorelationId = response.correlationid;
						swal({
							type: 'success',
							title: "Upload files",
							text: response.message,
							showCancelButton: false,
							closeOnConfirm: true
						}, function (isConfirm) {
							if (isConfirm) {
							}
						});
						UpdateDetails();
						$('#my-dropzone input, #my-dropzone select').prop('readonly', true);
						document.getElementById('uploadfiles').style.display = 'none';
						document.getElementById('fileInput').disabled = true;
						document.getElementById('folderInput').disabled = true;
						document.getElementById('DocumentTemplate').disabled = true;
						document.getElementById('fileRadio').disabled = true;
						document.getElementById('inputField1').disabled = true;
						document.getElementById('folderRadio').disabled = true;
						document.getElementById('deleteid').textContent = '';

						if (response.ispreparator) {
							ActivateSendRequestButton();
						} else {
							ActivateBulkSignButton();
						}
					} else {
						swal({
							type: 'info',
							title: "Upload files",
							text: response.message,
							showCancelButton: false,
							closeOnConfirm: true
						}, function (isConfirm) {
							if (isConfirm) {
							}
						});
					}
				},
				error: ajaxErrorHandler
			});
		}
	} else {
		console.log('No files selected.');
	}
}



function updateTable(fileArray) {
	var tableBody = document.getElementById('scopesTable').getElementsByTagName('tbody')[0];
	tableBody.innerHTML = "";

	for (var i = 0; i < fileArray.length; i++) {
		var row = document.createElement('tr');

		var fileNameCell = document.createElement('td');
		var successCell = document.createElement('td');

		if (fileArray[i].fileName.length > 50) {
			fileNameCell.textContent = cropFileNames(fileArray[i].fileName);
			fileNameCell.title = fileArray[i].fileName;
			fileNameCell.style.cursor = "pointer";
		}
		else {
			fileNameCell.textContent = fileArray[i].fileName;
		}

		if (fileArray[i].status === 'success') {
			var successIcon = document.createElement('i');
			successIcon.classList.add('fa', 'fa-check-circle', 'fa-2x', 'text-success');
			successIcon.style.cursor = 'pointer';
			successCell.appendChild(successIcon);
		}
		else {
			var failedIcon = document.createElement('i');
			failedIcon.classList.add('fa', 'fa-times-circle', 'fa-2x', 'text-danger');
			failedIcon.style.cursor = 'pointer';

			successCell.appendChild(failedIcon);
		}

		row.appendChild(fileNameCell);
		row.appendChild(successCell);

		tableBody.appendChild(row);
	}
}

function PerformBulkSign() {

	if (bulksignPermisson != 'False') {
		var correlationId = CorelationId;
		var tempId = $('#DocumentTemplate').val();
		var signcord = "";
		var esealcord = "";
		for (var i = 0; i < templateList.length; i++) {
			if (templateList[i]._id == tempId) {
				signcord = templateList[i].Annotations;
				esealcord = templateList[i].EsealAnnotations;
			}
		}
		if (esealcord !== null) {
			var responseFlag = true;
			$.ajax({
				url: GetOrganizationStatusUrl,
				type: 'GET',
				dataType: 'json',
				data: { loginorgUid: loginOrgId },
				success: function (response) {
					if (!response.success) {
						document.getElementById('overlay9').style.display = 'none';
						swal({
							type: 'info',
							title: 'Info',
							text: `You can not perform eseal operation, please contact organization `,
						}, function (isConfirm) {
							if (isConfirm) {
								window.location.href = BulkSignIndexUrl + "?viewName=MyDocuments";
							}
						});
						responseFlag = false;
					} else {
						responseFlag = true;
						PerformBulkSigning(correlationId, signcord, esealcord);
					}
				},
				error: ajaxErrorHandler
			});
		}
		else {
			PerformBulkSigning(correlationId, signcord, esealcord);
		}

	}

	else {
		swal({
			title: "info",
			text: "You Don't have Bulksing permission",
			type: "info",
		}, function (isConfirm) {
			if (isConfirm) {
				window.location.href = BulkSignIndexUrl + "?viewName=MyDocuments";
			}
		});
	}


}


function PerformBulkSigning(correlationId, signcord, esealcord) {
	console.log("Bulk Sign Started");
	$.ajax({
		url: PerformBulkSignUrl,
		method: 'POST',
		headers: {

			'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

		},
		contentType: "application/json",
		data: JSON.stringify(correlationId),
		beforeSend: function () {
			showOverlay(esealcord, signcord);
		},
		complete: function () {
			hideOverlay(esealcord, signcord);
		},
		success: function (response) {
			if (response.success == false) {
				swal({
					type: 'info',
					title: "Server Message",
					text: response.message,
					showCancelButton: true,
					confirmButtonText: 'Retry',
					closeOnConfirm: true
				}, function (isConfirm) {
					if (isConfirm) {
						PerformBulkSign();
					}

					else {

					}
				});
			}
			else {


				swal({
					title: "info",
					text: "Document Signing is initiated.",
					type: "info",
				}, function (isConfirm) {
					if (isConfirm) {
						//window.location.href = BulkSigningStatusUrl + '?correlationId=' + correlationId;
						const url = new URL(BulkSigningStatusUrl, window.location.origin);
						url.searchParams.append('correlationId', correlationId);

						window.location.href = url.toString();
					}
				});

			}
		},
		error: ajaxErrorHandler
	});
}

function Sign() {

	var correlationId = '';
	$.ajax({
		url: BulkSigningUrl,
		method: 'POST',
		headers: {

			'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

		},
		contentType: "application/json",
		data: JSON.stringify(selectedTemplateId),
		success: function (response) {
			correlationId = response.result;

			swal({
				icon: 'info',
				title: 'Server Message',
				text: 'Document Signing is initiated.',
				confirmButtonColor: "#acc33e",
				iconColor: "#acc33e",
			}, function (isConfirm) {
				if (isConfirm) {
					window.location.href = "/BulkSignList/BulkSigningStatus?correlationId=" + correlationId;
				}
			});

		},
		error: ajaxErrorHandler,
	});

}