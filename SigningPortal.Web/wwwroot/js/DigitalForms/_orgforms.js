var pdfjsLib = window['pdfjs-dist/build/pdf'];
if (!pdfjsLib) {
    console.error('PDF.js library is not loaded.');
} else {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
}
$(document).ready(function () {
    // $('#digitalforms').addClass('active');
    $('#networkOverlay').hide();

    $('#MyOrgFormTb').DataTable({

        paging: true,
        lengthChange: false,
        pageLength: 5,
        orderClasses: false,
        stripeClasses: [],
        info: true,
        "ordering": false


    });

    $(document).on("click", ".fillFormBtn", function (e) {
        e.preventDefault(); // prevent link default behavior
        const templateId = $(this).data("id");
        const edmsId = $(this).data("edmsid");
        const templateName = $(this).data("name");
        const type = $(this).data("type");

        fillFormData(templateId, edmsId, templateName, type);
    });

    updateTimestamps();

 
});


var formbase64 = "";

function renderPDF(pdf) {
    const pdfContainer = document.getElementById('pdf-container');
    pdfContainer.innerHTML = '';
    const numPages = pdf.numPages;
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        pdf.getPage(pageNum).then(page => {
            const scale = 1.5;
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.style.width = '100%';
            const pageContainer = document.createElement('div');
            pageContainer.className = 'pdf-page';
            pageContainer.style.position = 'relative';
            pageContainer.appendChild(canvas);
            pdfContainer.appendChild(pageContainer);

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            page.render(renderContext)
        });
    }

}

function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}
function modalForm(EdmsId, SignerName) {
    $("#digitalShowModal").modal('show');
    FileName = SignerName + "_signed";

    $.ajax({
        url: GetPreviewConfigUrl,
        type: 'GET',
        data: {
            edmsId: EdmsId
        },
        beforeSend: function () {
            $('#overlay').show();
        },
        complete: function () {
            $('#overlay').hide();
        },
        success: function (resp) {
            if (resp.success) {

                formbase64 = resp.result;
                const pdfArrayBuffer = base64ToArrayBuffer(resp.result);
                pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise.then(pdf => {
                    renderPDF(pdf);
                }).catch(error => {
                    console.error('Error loading PDF:', error);
                });

            } else {
                swal({
                    title: 'Error',
                    text: resp.message,
                    type: 'error',
                }, function (isConfirm) {
                    if (isConfirm) {
                        window.location.href = DigitalFormsIndexUrl;
                    }
                });
            }
        },
        error: function (xhr, status, error) {
            console.log(error);
            swal({
                title: 'Error',
                text: 'Something went wrong!',
                type: 'error',
            }, function (isConfirm) {
                if (isConfirm) {
                    window.location.href = DigitalFormsIndexUrl;
                }
            });
        }
    });
}

function DownloadForm() {
    var byteCharacters = atob(formbase64); // decode base64
    var byteNumbers = new Array(byteCharacters.length);

    for (var i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    var byteArray = new Uint8Array(byteNumbers);
    var blob = new Blob([byteArray], { type: 'application/pdf' });

    // Create a download link and trigger the download
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'SignedForm.pdf'; // The name of the downloaded file
    link.click(); // Trigger the download
};

function fillFormData(tempId, edmsId, documentName, flag) {
    $.ajax({
        type: "POST",
        url: ValidateEsealUrl,
        data: {
            tempId: tempId,

        },
        beforeSend: function () {
            $('#overlay').show();
        },
        complete: function () {
            $('#overlay').hide();
        },
        success: function (response) {
            if (response.success) {
                // Redirect to FillFormData if validation passes
                document.getElementById("navigationNetworkOverlay").style.display = "block";
                window.location.href = FillFormDataUrl + `?tempId=${tempId}&edmsId=${edmsId}&documentName=${documentName}&flag=${flag}`;
            } else {
                // Show Swal message if validation fails
                swal({
                    icon: "error",
                    title: "Info",
                    text: response.message,
                });
            }
        },
        error: ajaxErrorHandler
    });
}