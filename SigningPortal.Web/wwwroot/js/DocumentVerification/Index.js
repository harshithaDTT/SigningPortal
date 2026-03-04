
document.addEventListener('DOMContentLoaded', function () {
    const dropArea = document.getElementById('drop-area');
    const documentUpload = document.getElementById('document-upload');
    const submitButton = document.getElementById('submit-button');
    const uploadedFileInfo = document.getElementById('uploaded-file-info');
    const buttons = document.getElementById('buttons');
    const removeButton = document.getElementById('remove-button');
    const uploadForm = document.getElementById('upload-form');
    getFileConfiguration();
    let isFileSelected = false;

    function handleFileSelection(file) {
        $('#overlay').show();
        if (file.type === 'application/pdf') {
            console.log(filesizerestrict * 1024 * 1024);
            if (file.size <= filesizerestrict * 1024 * 1024) {
                isFileSelected = true;
                uploadedFileInfo.innerHTML = `<img src="${appBaseUrl}img/icon/document-signature.png" alt="Image">`;
                buttons.classList.remove('hidden');
                removeButton.disabled = false;
                $('#overlay').hide();
            } else {
                Swal.fire({
                    icon: 'info',
                    title: 'Server Message',
                    text: `File size should be up to ${filesizerestrict} MB.`,
                    confirmButtonColor: "#acc33e",
                    iconColor: "#acc33e"
                });
                $('#overlay').hide();
            }
        } else {
            Swal.fire({
                icon: 'info',
                title: 'Server Message',
                text: 'Please upload only pdf files',
                confirmButtonColor: "#acc33e",
                iconColor: "#acc33e"
            });
            $('#overlay').hide();
        }
    }

    function resetUpload() {
        if (isFileSelected) {
            uploadedFileInfo.innerHTML = '';
            buttons.classList.add('hidden');
            removeButton.disabled = true;
            isFileSelected = false;
            documentUpload.value = '';
        }
    }

    dropArea.addEventListener('dragover', function (e) {
        e.preventDefault();
        dropArea.classList.add('highlight');
    });

    dropArea.addEventListener('dragleave', function (e) {
        e.preventDefault();
        dropArea.classList.remove('highlight');
    });

    dropArea.addEventListener('drop', function (e) {
        e.preventDefault();
        dropArea.classList.remove('highlight');
        const file = e.dataTransfer.files[0];
        if (file) {
            // Attach file to input so it gets posted to controller
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            documentUpload.files = dataTransfer.files;

            handleFileSelection(file);
        }
    });


    document.querySelector('.upload-box-inner').addEventListener('click', function () {
        documentUpload.click();
    });

    documentUpload.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            handleFileSelection(file);
        }
    });

    removeButton.addEventListener('click', function () {
        resetUpload();
    });

    uploadForm.addEventListener('submit', function (e) {
        if (!isFileSelected) {
            e.preventDefault();
            Swal.fire({
                icon: 'info',
                title: 'Server Message',
                text: 'Please Upload Document',
                confirmButtonColor: "#acc33e",
                iconColor: "#acc33e"
            });
        } else {
            showLoader();
        }
    });
});

function showLoader() {
    $('#overlay').show();
}

function hideLoader() {
    $('#overlay').hide();
}

function getFileConfiguration() {
    $.ajax({
        type: 'GET',
        url: GetFileConfigurationUrl,
        success: function (data) {
            filesizerestrict = data.fileSize;

        },
        error: ajaxErrorHandler,
    });
}