
var storedInitialImages = {};
var config = "";
var Documentbase64;
var matchedEsealData = {};
var matchedSignData = {};
var matchedqrcodeData = {};
var rotationDataval = 0;
var receptemp = {};

var globalblobdata = '';
var sign_here = "/img/sign_here.svg";
var sign_here_90 = "/img/sign_here_90.svg"
var sign_here_180 = "/img/sign_here_180.svg"
var sign_here_270 = "/img/sign_here_270.svg"

var zoomlevelval = '100%';

// Viewer zoom and pagination state
let pdfZoomLevel = 1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.1;
let totalPdfPages = 0;
let currentVisiblePage = 1;
let scrollRafToken = null;
let viewerControlsInitialized = false;

const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetZoomBtn = document.getElementById('resetZoomBtn');
const zoomDisplayEl = document.getElementById('zoomDisplay');
const pageIndicatorEl = document.getElementById('pageIndicator');
const pagePrevBtn = document.getElementById('pagePrevBtn');
const pageNextBtn = document.getElementById('pageNextBtn');
const scrollContainerEl = document.getElementById('scrollContainer');

function refreshZoomDisplay() {
    if (typeof zoomlevelval === 'string' && zoomlevelval.indexOf('%') > -1) {
        var parsedZoom = parseFloat(zoomlevelval) / 100;
        if (!isNaN(parsedZoom) && parsedZoom > 0) {
            pdfZoomLevel = parsedZoom;
            applyZoom();
            return;
        }
    }
    updateZoomDisplay();
}

function refreshPageIndicator(currentPage, totalPages) {
    if (typeof totalPages === 'number' && totalPages >= 0) {
        totalPdfPages = totalPages;
    }
    if (typeof currentPage === 'number' && currentPage > 0) {
        currentVisiblePage = currentPage;
    }

    if (!totalPdfPages) {
        updatePageIndicatorDisplay(0);
        return;
    }

    setCurrentPage(currentVisiblePage || 1);

    if (scrollContainerEl) {
        window.requestAnimationFrame(updatePageFromScroll);
    }
}

function initializeViewerControls() {
    if (viewerControlsInitialized) {
        return;
    }

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', function () {
            adjustZoom(ZOOM_STEP);
        });
    }
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', function () {
            adjustZoom(-ZOOM_STEP);
        });
    }
    if (resetZoomBtn) {
        resetZoomBtn.addEventListener('click', resetZoomLevel);
    }
    if (pagePrevBtn) {
        pagePrevBtn.addEventListener('click', function () {
            scrollToPage(currentVisiblePage - 1);
        });
    }
    if (pageNextBtn) {
        pageNextBtn.addEventListener('click', function () {
            scrollToPage(currentVisiblePage + 1);
        });
    }
    if (scrollContainerEl) {
        scrollContainerEl.addEventListener('scroll', handleScrollIndicator);
    }

    viewerControlsInitialized = true;
    applyZoom();
    updateZoomDisplay();
    updatePageIndicatorDisplay(currentVisiblePage);
}

function adjustZoom(delta) {
    pdfZoomLevel = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(pdfZoomLevel + delta).toFixed(2)));
    applyZoom();
}

function applyZoom() {
    if (!pdfContainer) {
        return;
    }
    pdfContainer.style.transformOrigin = 'top center';
    pdfContainer.style.transform = 'scale(' + pdfZoomLevel + ')';
    updateZoomDisplay();
}

function updateZoomDisplay() {
    var percentage = Math.round(pdfZoomLevel * 100);
    zoomlevelval = percentage + '%';
    if (zoomDisplayEl) {
        zoomDisplayEl.textContent = zoomlevelval;
    }
}

function resetZoomLevel() {
    pdfZoomLevel = 1;
    applyZoom();
}

function scrollToPage(targetPage) {
    if (!scrollContainerEl || !pdfContainer || !totalPdfPages) {
        return;
    }
    var clampedPage = Math.max(1, Math.min(totalPdfPages, targetPage));
    var targetElement = findPageElementByNumber(clampedPage);
    if (targetElement) {
        scrollContainerEl.scrollTo({ top: targetElement.offsetTop, behavior: 'smooth' });
        setCurrentPage(clampedPage);
    }
}

function findPageElementByNumber(pageNumber) {
    if (!pdfContainer) {
        return null;
    }
    var pages = pdfContainer.querySelectorAll('.pdf-page');
    if (pageNumber >= 1 && pageNumber <= pages.length) {
        return pages[pageNumber - 1];
    }
    return null;
}

function setCurrentPage(pageNumber) {
    if (pageNumber < 1 || pageNumber > totalPdfPages) {
        return;
    }
    currentVisiblePage = pageNumber;
    updatePageIndicatorDisplay(pageNumber);
}

function updatePageIndicatorDisplay(pageNumber) {
    if (pageIndicatorEl) {
        if (!totalPdfPages) {
            pageIndicatorEl.textContent = 'Page 0 / 0';
        } else {
            pageIndicatorEl.textContent = 'Page ' + pageNumber + ' / ' + totalPdfPages;
        }
    }
}

function handleScrollIndicator() {
    if (scrollRafToken) {
        cancelAnimationFrame(scrollRafToken);
    }
    scrollRafToken = requestAnimationFrame(updatePageFromScroll);
}

function updatePageFromScroll() {
    scrollRafToken = null;
    if (!scrollContainerEl || !pdfContainer || !totalPdfPages) {
        return;
    }
    var pages = pdfContainer.querySelectorAll('.pdf-page');
    if (!pages || !pages.length) {
        return;
    }

    var containerRect = scrollContainerEl.getBoundingClientRect();
    var containerMid = containerRect.top + containerRect.height / 2;

    var closestPage = 1;
    var closestDistance = Infinity;

    pages.forEach(function (page, index) {
        var rect = page.getBoundingClientRect();
        var pageMid = rect.top + rect.height / 2;
        var distance = Math.abs(pageMid - containerMid);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestPage = index + 1;
        }
    });

    if (closestPage !== currentVisiblePage) {
        currentVisiblePage = closestPage;
        updatePageIndicatorDisplay(closestPage);
    }
}

const pdfjsLib = window['pdfjs-dist/build/pdf'];
if (!pdfjsLib) {
    console.error('PDF.js library is not loaded.');
} else {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
}
var finalblob = '';
var finalresponse = '';
const pdfContainer = document.getElementById('pdf-container');
const components = document.getElementById('pdfschema').value;

function base64ToBlob(base64) {

    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; ++i) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    console.log(Blob[bytes]);
    return new Blob([bytes], { type: 'application/pdf' });
};
$(document).ready(function () {
    $('#networkOverlay').hide();
    $('#DocumentMenu').addClass('active');

    // Initialize viewer controls
    initializeViewerControls();

    var currentUserEmail = loginEmail;

    var isSigningCompleted = recipients.some(recipient => {
        // find if this recipient is in completedSignList
        var isRecipientCompleted = completedSignList.some(c => c.email === recipient.email);
        if (isRecipientCompleted && recipient.AlternateSignatories) {
            // check inside alternate signatories
            return recipient.AlternateSignatories.some(alt => alt.email === currentUserEmail);
        }
        return false;
    });

    if (isSigningCompleted) {
        swal({
            title: 'Signing Completed',
            text: 'Your document signing is already completed.',
            type: 'info',
            confirmButtonText: 'OK'
        }, function (isConfirm) {
            if (isConfirm) {
                window.location.href = redirectingurl + viewName;
            }
        });
        return;
    }


    // Get the button element by its ID
    var commentButton = document.getElementById("commentButton");
    // Loop through the recipients array
    for (var i = 0; i < recipients.length; i++) {
        var recipient = recipients[i];

        // Check if the suid matches
        var matchedRecipient = recipient;



        // Check in the recipient's alternateSignatories array
        if (matchedRecipient.alternateSignatories) {
            for (let alternate of matchedRecipient.alternateSignatories) {
                if (alternate.suid === suid) {
                    receptemp = matchedRecipient;
                    if (matchedRecipient.allowComments) {

                        commentButton.style.display = "flex";
                        commentButton.addEventListener('mousedown', onMouseDown);
                    } else {

                        commentButton.style.display = "none";
                    }
                    i = recipients.length;
                    break;

                }
            };
        }





    }
    $('#overlay').show();
    getDocumentdata();

    if ($(window).width() >= 768) {
        zoomlevelval = '100%';
    }
    else if ($(window).width() < 768) {
        zoomlevelval = '58%';
    }


    $("#signButton").on("click", function () {
        SaveQuickSign(viewName);
    });

    $("#Rejectbutton").on("click", function () {
        showCommentBox();
    });

    $("#commentButton").on("click", function () {
        onClick("comment-field");
    });

    $("#btnSubmitReject").on("click", function () {
        SubmitReject();
    });

    $("#btnSaveComment").on("click", function () {
        SubmitComment();
    });

    $("#gobackbtn").on("click", function () {
        closeCustomModal();
    });

    $("#cancelbtn").on("click", function () {
        closeCustomModal();
    });


});

window.addEventListener("resize", function () {
    const {
        Annotations,
        docViewer,
        PDFNet,
        CoreControls,
        toolManager
    } = webviwerInstance;


    if ($(window).width() >= 768) {
        zoomlevelval = '100%';
        webviwerInstance.setZoomLevel(zoomlevelval);
    }
    else if ($(window).width() < 768) {
        zoomlevelval = '58%';
        webviwerInstance.setZoomLevel(zoomlevelval);
    }
    let viewerelementdiv = document.getElementById('viewerdivtag');
    let fieldselementdiv = document.getElementById('fieldsdivtag');
    if ($(window).width() >= 768) {
        // Remove classes separately
        viewerelementdiv.classList.remove("col-lg-9", "col-md-12");
        viewerelementdiv.classList.add("col-lg-9", "col-md-9");

        fieldselementdiv.classList.remove("col-lg-3", "col-md-12");
        fieldselementdiv.classList.add("col-lg-3", "col-md-3");
    } else if ($(window).width() < 768) {
        viewerelementdiv.classList.remove("col-lg-9", "col-md-9");
        viewerelementdiv.classList.add("col-lg-9", "col-md-12");

        fieldselementdiv.classList.remove("col-lg-3", "col-md-3");
        fieldselementdiv.classList.add("col-lg-3", "col-md-12");
    }
});

function showOverlay(matchedEsealData, matchedSignData) {
    if ((Object.keys(matchedEsealData).length === 0) && (Object.keys(matchedSignData).length !== 0)) {
        $('#overlay8').css('display', 'flex');
    } else if ((Object.keys(matchedEsealData).length !== 0) && (Object.keys(matchedSignData).length === 0)) {
        // $('#overlay6').show();
        $('#overlay6').css('display', 'flex');

    } else if ((Object.keys(matchedEsealData).length !== 0) && (Object.keys(matchedSignData).length !== 0)) {
        //$('#overlay7').show();
        $('#overlay7').css('display', 'flex');

    } else {
        //$('#overlay8').show();
        $('#overlay8').css('display', 'flex');

    }
}

function hideOverlay(matchedEsealData, matchedSignData) {
    if ((Object.keys(matchedEsealData).length === 0) && (Object.keys(matchedSignData).length !== 0)) {
        $('#overlay8').hide();
    } else if ((Object.keys(matchedEsealData).length !== 0) && (Object.keys(matchedSignData).length === 0)) {
        $('#overlay6').hide();
    } else if ((Object.keys(matchedEsealData).length !== 0) && (Object.keys(matchedSignData).length !== 0)) {
        $('#overlay7').hide();
    } else {
        $('#overlay8').hide();
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


async function renderPDF(pdf) {
    $('#overlay').hide();
    pdfContainer.innerHTML = '';
    const numPages = pdf.numPages;

    // Initialize page indicator
    totalPdfPages = numPages;
    refreshPageIndicator(1, numPages);

    // Get annotation data
    var sigAnnData = SigAnnData;
    var esealAnnData = EsealAnnData;
    var qrAnnData = QrAnnData;
    let sign_annotations = sigAnnData !== "null" ? JSON.parse(sigAnnData) : null;
    let eseal_annotations = esealAnnData !== "null" ? JSON.parse(esealAnnData) : null;
    let qr_annotations = qrAnnData !== "null" ? JSON.parse(qrAnnData) : null;

    // Collect all unique annotation pages
    let allPageNumbers = [
        ...(sign_annotations ? Object.values(sign_annotations).map(a => a.PageNumber) : []),
        ...(eseal_annotations ? Object.values(eseal_annotations).map(a => a.PageNumber) : []),
        ...(qr_annotations ? Object.values(qr_annotations).map(a => a.PageNumber) : [])
    ];
    let uniqueAnnotationPages = [...new Set(allPageNumbers)].sort((a, b) => a - b);

    // IntersectionObserver for lazy rendering
    const observer = new IntersectionObserver(async (entries, observer) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;

            const placeholder = entry.target;
            const pageNum = parseInt(placeholder.dataset.pageNumber);

            if (placeholder.dataset.rendered === 'true') continue;
            placeholder.dataset.rendered = 'true';

            await renderPDFBatch(pdf, pageNum);
            observer.unobserve(placeholder);
        }
    }, {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
    });

    // Step 1: Create placeholders
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const placeholder = document.createElement('div');
        placeholder.className = 'pdf-page';
        placeholder.dataset.pageNumber = pageNum;
        placeholder.style.minHeight = '500px';
        placeholder.style.marginBottom = '10px';
        placeholder.style.position = 'relative';
        pdfContainer.appendChild(placeholder);
    }

    // Step 2: Decide which pages to render eagerly
    let eagerPages = new Set();
    for (let i = 1; i <= Math.min(5, numPages); i++) {
        eagerPages.add(i); // First 5 pages
    }
    uniqueAnnotationPages.forEach(p => eagerPages.add(p)); // All annotation pages

    // Step 3: Render eager pages now
    for (const pageNum of [...eagerPages].sort((a, b) => a - b)) {
        const placeholder = pdfContainer.querySelector(`[data-page-number="${pageNum}"]`);
        if (placeholder && placeholder.dataset.rendered !== 'true') {
            placeholder.dataset.rendered = 'true';
            await renderPDFBatch(pdf, pageNum);

            const percentage = Math.floor((pageNum / numPages) * 100);
            document.getElementById("loading-text1").innerHTML =
                `Loading document... <span class="percent-highlight">${percentage}%</span>`;
            await new Promise(resolve => setTimeout(resolve, 30));
        }
    }

    // Step 4: Observe remaining pages for lazy load
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const placeholder = pdfContainer.querySelector(`[data-page-number="${pageNum}"]`);
        if (placeholder && placeholder.dataset.rendered !== 'true') {
            observer.observe(placeholder);
        }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
}





async function renderPDFBatch(pdf, pageNum) {
    let placeholder = pdfContainer.querySelector(`[data-page-number="${pageNum}"]`);
    if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.className = 'pdf-page';
        placeholder.dataset.pageNumber = pageNum;
        pdfContainer.appendChild(placeholder);
    }
    placeholder.innerHTML = ''; // Clear placeholder

    const page = await pdf.getPage(pageNum);
    const rotation = page.rotate;
    rotationDataval = rotation;
    console.log(rotation);
    const annotationslist = await page.getAnnotations();
    const container = document.querySelector(`.pdf-page[data-page-num="${pageNum}"]`);
    const containerWidth = container ? container.clientWidth : window.innerWidth; // use actual screen/container width
    const unscaledViewport = page.getViewport({ scale: 1 });

    const scale = containerWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvas.style.width = '100%';
    placeholder.style.position = 'relative';
    placeholder.appendChild(canvas);

    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };

    await page.render(renderContext).promise;

    const annotationLayer = document.createElement('div');
    annotationLayer.className = 'annotation-layer';
    annotationLayer.style.position = 'absolute';
    annotationLayer.style.top = '0';
    annotationLayer.style.left = '0';
    annotationLayer.style.width = '100%';
    annotationLayer.style.height = '100%';
    annotationLayer.style.pointerEvents = 'none';
    placeholder.appendChild(annotationLayer);
    originalWidth = viewport.viewBox[2];
    originalHeight = viewport.viewBox[3];

    annotationslist.forEach(annotation => {
        const { rect, subtype, contents } = annotation;
        if (subtype === 'Text') {
            const [x1, y1, x2, y2] = annotation.rect;
            const pdfX = Math.min(x1, x2);
            const pdfWidth = Math.abs(x2 - x1);
            const pdfYBottom = Math.min(y1, y2);
            const pdfHeight = Math.abs(y2 - y1);
            const pdfY = originalHeight - pdfYBottom - pdfHeight;
            const scaleX = annotationLayer.getBoundingClientRect().width / originalWidth;
            const scaleY = annotationLayer.getBoundingClientRect().height / originalHeight;
            const canvasX = pdfX * scaleX;
            const canvasY = pdfY * scaleY;
            const canvasWidth = pdfWidth * scaleX;
            const canvasHeight = pdfHeight * scaleY;

            const highlight = document.createElement('div');
            highlight.style.position = 'absolute';
            highlight.style.left = `${canvasX}px`;
            highlight.style.top = `${canvasY}px`;
            highlight.style.width = `${canvasWidth}px`;
            highlight.style.height = `${canvasHeight}px`;
            highlight.style.border = 'none';
            highlight.title = annotation.title + "\n" + annotation.contents;
            highlight.style.pointerEvents = 'auto';
            annotationLayer.appendChild(highlight);
        }
    });

    // Render annotations
    var sigAnnData = SigAnnData;
    var esealAnnData = EsealAnnData;
    var qrAnnData = QrAnnData;
    let sign_annotations = sigAnnData !== "null" ? JSON.parse(sigAnnData) : null;
    let eseal_annotations = esealAnnData !== "null" ? JSON.parse(esealAnnData) : null;
    let qr_annotations = qrAnnData !== "null" ? JSON.parse(qrAnnData) : null;

    if (sign_annotations !== null) {
        for (const key in sign_annotations) {
            if (sign_annotations[key].PageNumber === pageNum) {
                const element = await createDraggableElementForMobile("Signature", annotationLayer, sign_annotations[key], sign_annotations, eseal_annotations, qr_annotations, key);
                if (element) {
                    annotationLayer.appendChild(element);
                }
            }
        }
    }
    if (eseal_annotations !== null) {
        for (const key in eseal_annotations) {
            if (eseal_annotations[key].PageNumber === pageNum) {
                const element = await createDraggableElementForMobile("Eseal", annotationLayer, eseal_annotations[key], sign_annotations, eseal_annotations, qr_annotations, key);
                if (element) {
                    annotationLayer.appendChild(element);
                }
            }
        }
    }
    if (qr_annotations !== null) {
        for (const key in qr_annotations) {
            if (qr_annotations[key].PageNumber === pageNum) {
                const element = await createDraggableElementForMobile("Qrcode", annotationLayer, qr_annotations[key], sign_annotations, eseal_annotations, qr_annotations, key);
                if (element) {
                    annotationLayer.appendChild(element);
                }
            }
        }
    }
}




async function renderPDFQuicksign(pdf) {
    $('#overlay').hide();
    pdfContainer.innerHTML = '';
    const numPages = pdf.numPages;

    // IntersectionObserver for lazy rendering
    const observer = new IntersectionObserver(async (entries, observer) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;

            const placeholder = entry.target;
            const pageNum = parseInt(placeholder.dataset.pageNumber);
            if (placeholder.dataset.rendered === 'true') continue;

            placeholder.dataset.rendered = 'true';
            await renderPDFQuicksignBatch(pdf, pageNum);
            observer.unobserve(placeholder);
        }
    }, {
        root: null,
        rootMargin: '200px',
        threshold: 0.1
    });

    // Step 1: Create all placeholders immediately
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const placeholder = document.createElement('div');
        placeholder.className = 'pdf-page';
        placeholder.dataset.pageNumber = pageNum;
        placeholder.style.minHeight = '600px';
        placeholder.style.marginBottom = '10px';
        placeholder.style.position = 'relative';
        pdfContainer.appendChild(placeholder);
    }

    // Step 2: Eagerly render first 20 pages
    for (let pageNum = 1; pageNum <= Math.min(20, numPages); pageNum++) {
        const placeholder = pdfContainer.querySelector(`[data-page-number="${pageNum}"]`);
        placeholder.dataset.rendered = 'true';
        await renderPDFQuicksignBatch(pdf, pageNum);
    }

    // Step 3: Lazy-load remaining pages
    for (let pageNum = 21; pageNum <= numPages; pageNum++) {
        const placeholder = pdfContainer.querySelector(`[data-page-number="${pageNum}"]`);
        observer.observe(placeholder);
    }
}



async function renderPDFQuicksignBatch(pdf, pageNum) {
    let placeholder = pdfContainer.querySelector(`[data-page-number="${pageNum}"]`);
    if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.className = 'pdf-page';
        placeholder.dataset.pageNumber = pageNum;
        pdfContainer.appendChild(placeholder);
    }
    placeholder.innerHTML = ''; // Clear placeholder contents

    const page = await pdf.getPage(pageNum);
    const annotationslist = await page.getAnnotations();

    const container = document.querySelector(`.pdf-page[data-page-num="${pageNum}"]`);
    const containerWidth = container ? container.clientWidth : window.innerWidth; // use actual screen/container width
    const unscaledViewport = page.getViewport({ scale: 1 });

    const scale = containerWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvas.style.width = '100%';

    placeholder.style.position = 'relative';
    placeholder.appendChild(canvas);

    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };

    await page.render(renderContext).promise;

    const annotationLayer = document.createElement('div');
    annotationLayer.className = 'annotation-layer';
    annotationLayer.style.position = 'absolute';
    annotationLayer.style.top = '0';
    annotationLayer.style.left = '0';
    annotationLayer.style.width = '100%';
    annotationLayer.style.height = '100%';
    annotationLayer.style.pointerEvents = 'none';
    placeholder.appendChild(annotationLayer);

    originalWidth = viewport.viewBox[2];
    originalHeight = viewport.viewBox[3];

    annotationslist.forEach(annotation => {
        const { rect, subtype, contents } = annotation;
        if (subtype === 'Text') {
            const [x1, y1, x2, y2] = annotation.rect;
            const pdfX = Math.min(x1, x2);
            const pdfWidth = Math.abs(x2 - x1);
            const pdfYBottom = Math.min(y1, y2);
            const pdfHeight = Math.abs(y2 - y1);
            const pdfY = originalHeight - pdfYBottom - pdfHeight;
            const scaleX = annotationLayer.getBoundingClientRect().width / originalWidth;
            const scaleY = annotationLayer.getBoundingClientRect().height / originalHeight;
            const canvasX = pdfX * scaleX;
            const canvasY = pdfY * scaleY;
            const canvasWidth = pdfWidth * scaleX;
            const canvasHeight = pdfHeight * scaleY;

            const highlight = document.createElement('div');
            highlight.style.position = 'absolute';
            highlight.style.left = `${canvasX}px`;
            highlight.style.top = `${canvasY}px`;
            highlight.style.width = `${canvasWidth}px`;
            highlight.style.height = `${canvasHeight}px`;
            highlight.style.border = 'none';
            highlight.title = annotation.title + "\n" + annotation.contents;
            highlight.style.pointerEvents = 'auto';
            annotationLayer.appendChild(highlight);
        }
    });
}



async function SubmitComment(point) {
    point = point || {};
    const { docViewer, Annotations, CoreControls, iframeWindow, PDFNet, Tools } = webviwerInstance;

    let commentData = document.getElementById("comment-field").value;
    if (commentData === '') {
        settoast({ open: true });
        showToast("error", " Please enter a comment");
        return false;
    }

    const user = JSON.parse(localStorage.getItem("user"));
    //const AnnotationManager = documentViewer.getAnnotationManager();
    const annotManager = docViewer.getAnnotationManager();
    annotManager.setCurrentUser(loginName);

    const annot = new Annotations.StickyAnnotation();
    const displayMode = docViewer.getDisplayModeManager().getDisplayMode();
    const page = displayMode.getSelectedPages(point, point);
    if (!!point.x && page.first == null) {
        return; //don't add field to an invalid page location
    }

    const page_idx =
        page.first !== null ? page.first : docViewer.getCurrentPage();


    annot.PageNumber = page_idx;
    annot.X = 100;
    annot.Y = 50;
    annot.Author = loginName;
    annot.StrokeColor = new Annotations.Color(0, 255, 0, 1);
    annot.setContents(commentData);

    annotManager.addAnnotation(annot);
    annotManager.redrawAnnotation(annot);
    document.getElementById("comment-field").value = "";
    // setCommentsAllowed(true);
    // showTextFieldForComments(false);
    document.getElementById("commentBox").style.display = "none";
    document.getElementById("addcommentBox").style.display = "none";

};


let timeoutIdformodal = null;
function updateStepper(currentStep, state, msg, esealcorddata, signcorddata, data, tempidfordetails, resp) {
    var colr = "";
    if (state == "success") {
        if (currentStep == 2) {
            colr = '#059669';
        } else {
            colr = "#059669";
        }
    } else {
        colr = '#d21717';
    }
    const steps = document.querySelectorAll('.step');

    steps.forEach((step, index) => {
        const circle = step.querySelector('.circle');
        const line = step.querySelector('div[style*="height: 4px"]');



        if (index < currentStep) {
            circle.classList.remove('blinking');
            circle.style.backgroundColor = colr;
            if (state == "success") {
                if (line) line.style.backgroundColor = colr;
            }

        } else if (index === currentStep) {

            if (state == "success") {
                circle.style.backgroundColor = colr;
                if (currentStep != 2) {
                    circle.classList.add('blinking');
                }

                if (index != 0) {
                    document.getElementById('signstatusloader').style.display = 'none';
                    document.getElementById('gobackbtn').style.display = 'block';
                    if (index == 2) {
                        const goBackBtn = document.getElementById('gobackbtn');
                        let countdown = 5;
                        goBackBtn.textContent = `Go Back (${countdown}s)`;


                        let autoCloseTriggered = false;

                        const interval = setInterval(() => {
                            countdown--;
                            if (countdown > 0) {
                                goBackBtn.textContent = `Go Back (${countdown}s)`;
                            } else {
                                clearInterval(interval);
                                goBackBtn.textContent = "Go Back";
                                if (!autoCloseTriggered) {
                                    autoCloseTriggered = true;
                                    closeCustomModal();
                                }
                            }
                        }, 1000);

                        // Optional: if clicked during countdown, stop timer and close
                        goBackBtn.onclick = function () {
                            if (!autoCloseTriggered) {
                                autoCloseTriggered = true;
                                clearInterval(interval);
                                closeCustomModal();
                            }
                        };
                    }
                }

                document.getElementById('retrybtn').style.display = 'none';
                document.getElementById('cancelbtn').style.display = 'none';
            }
        }
    });

    if (state == "success") {
        const messages = ["Check for " + currentStaging + " mobile app notification and approve signing request...",
            "Document Signing in progress, Please wait a moment or return to the previous page",
            "Document Signed Successfully."
        ];
        const headings = ["Signatory Verification",
            "Document Signing Status",
            "Signing Complete!"
        ];
        const successImages = ["smartphone2.png", "contract.png", "check1.png"];



        const messageBox = document.getElementById("stepper-message");
        const stepImage = document.getElementById("stepper-image");
        const stepLoader = document.getElementById("stepper-loader");

        if (messageBox) {
            messageBox.textContent = messages[currentStep] || "";

            if (currentStep === 1) {

                stepImage.style.display = "none";
                stepImage.parentElement.style.display = "none";
                stepLoader.style.display = "flex";
                stepImage.parentElement.style.animation = '';
            }
            else if (currentStep === 0) {
                stepImage.style.display = "inline-block";


                stepImage.parentElement.style.width = "100px";
                stepImage.parentElement.style.height = "100px";
                stepImage.parentElement.style.borderRadius = "";
                stepLoader.style.display = "none";
                stepImage.src = appBaseUrl + "assets/images/" + successImages[currentStep];
                stepImage.parentElement.style.animation = '';
            } else {
                stepImage.style.display = "inline-block";
                stepImage.parentElement.style.display = "inline-block";


                stepImage.parentElement.style.width = "80px";
                stepImage.parentElement.style.height = "80px";
                stepImage.parentElement.style.borderRadius = "50%";
                stepLoader.style.display = "none";
                stepImage.src = appBaseUrl + "assets/images/" + successImages[currentStep];
                stepImage.parentElement.style.animation = 'blinkGreenGlow 1s infinite';
            }


        }

        //document.getElementById('SigningModalheading').innerHTML = headings[currentStep] || "";
        if (currentStep == 1) {
            timeoutId = setTimeout(() => {
                var messageB = document.getElementById("stepper-message");
                messageB.textContent = "Signing is taking longer than expected. Redirecting to status page..."
                const goBackBtn = document.getElementById('gobackbtn');
                let countdown = 5;
                goBackBtn.textContent = `Redirect (${countdown}s)`;


                let autoCloseTriggered = false;

                const interval = setInterval(() => {
                    countdown--;
                    if (countdown > 0) {
                        goBackBtn.textContent = `Redirect (${countdown}s)`;
                    } else {
                        clearInterval(interval);
                        goBackBtn.textContent = "Redirect";
                        if (!autoCloseTriggered) {
                            autoCloseTriggered = true;

                            var docid = tempidfordetails;
                            if (tempidfordetails == null) {
                                docid = JSON.parse(resp.result.model).tempid;
                            }
                            var url = DocumentDetailsByIdUrl + docid;
                            window.location.href = url;
                        }
                    }
                }, 1000);

                // Optional: if clicked during countdown, stop timer and close
                goBackBtn.onclick = function () {
                    if (!autoCloseTriggered) {
                        autoCloseTriggered = true;
                        clearInterval(interval);

                        var docid = tempidfordetails;
                        if (tempidfordetails == null) {
                            docid = JSON.parse(resp.result.model).tempid;
                        }
                        var url = DocumentDetailsByIdUrl + docid;
                        window.location.href = url;
                    }
                };
            }, 30000);
        } else if (currentStep == 2) {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
                console.log("Timer cleared before 30 seconds!");
            }
        }
    }
    else {
        document.getElementById('signstatusloader').style.display = 'none';
        var message = ["", "Verification Failed", "Signing Failed"]
        document.getElementById("stepper-message").textContent = msg;
        document.getElementById("stepper-image").src = appBaseUrl + "assets/images/cancel1.png";
        document.getElementById("stepper-loader").style.display = 'none';
        document.getElementById("stepper-image").style.display = 'inline-block';
        document.getElementById("stepper-image").parentElement.style.display = 'inline-block';
        document.getElementById("stepper-image").style.marginLeft = '';
        document.getElementById("stepper-image").parentElement.style.width = '80px';
        document.getElementById("stepper-image").parentElement.style.height = '80px';
        document.getElementById("stepper-image").parentElement.style.borderRadius = '50%';
        document.getElementById("stepper-image").parentElement.style.animation = 'blinkRedGlow 1s infinite';

        // document.getElementById('SigningModalheading').innerHTML = message[currentStep];

        if (currentStep == 2) {
            document.getElementById('retrybtn').style.display = 'none';
            document.getElementById('cancelbtn').style.display = 'none';
            var goBackBtn = document.getElementById('gobackbtn')
            goBackBtn.style.display = 'block';

            let countdown = 5;
            goBackBtn.textContent = `Go Back (${countdown}s)`;


            let autoCloseTriggered = false;

            const interval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    goBackBtn.textContent = `Go Back (${countdown}s)`;
                } else {
                    clearInterval(interval);
                    goBackBtn.textContent = "Go Back";
                    if (!autoCloseTriggered) {
                        autoCloseTriggered = true;
                        closeCustomModal();
                    }
                }
            }, 1000);

            // Optional: if clicked during countdown, stop timer and close
            goBackBtn.onclick = function () {
                if (!autoCloseTriggered) {
                    autoCloseTriggered = true;
                    clearInterval(interval);
                    closeCustomModal();
                }
            };
        }
        else {
            if (msg === "Credits are not available" || msg === "Eseal credits are not available") {
                document.getElementById('retrybtn').style.display = 'none';
                document.getElementById('cancelbtn').style.display = 'none';
                document.getElementById('gobackbtn').style.display = 'block';
            } else {
                document.getElementById('retrybtn').style.display = 'block';
                document.getElementById('cancelbtn').style.display = 'block';
                document.getElementById('gobackbtn').style.display = 'none';
            }

        }


        if (currentStep == 2) {
            const previousStep = steps[currentStep - 2];
            const prevLine = previousStep.querySelector('div[style*="height: 4px"]');
            if (prevLine) {
                prevLine.style.backgroundColor = colr;
            }

            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
                console.log("Timer cleared before 30 seconds!");
            }
        }

        document.getElementById('retrybtn').onclick = function () {
            document.getElementById('signstatusloader').style.display = 'flex';
            steps.forEach((step, index) => {
                const circle = step.querySelector('.circle');
                const line = step.querySelector('div[style*="height: 4px"]');

                if (index == 0) {

                } else {
                    circle.style.backgroundColor = '#dcdcdc';
                    if (line) line.style.backgroundColor = '#dcdcdc';
                }

            });

            QuicksignRetry();


        };
    }

}
function closeCustomModal() {
    window.location.href = redirectingurl + viewName;
}


function getDocumentdata() {
    var url = GetPreviewConfig;
    var id = Edmsidvalue;
    var sigAnnData = SigAnnData;
    var esealAnnData = EsealAnnData;
    var qrAnnData = QrAnnData;
    var matche

    $.ajax({
        url: url + '/' + id,
        type: 'GET',
        success: function (resp) {
            if (resp.success) {
                Documentbase64 = resp.result;
                var blobdata = base64ToBlob(Documentbase64);
                globalblobdata = blobdata;
                var reader = new FileReader();
                reader.readAsDataURL(blobdata);
                reader.onloadend = function () {
                    document.getElementById('filebase64').value = reader.result.split(',')[1]; // Extract only the Base64 part
                };
                const pdfBase64 = Documentbase64;

                const pdfArrayBuffer = base64ToArrayBuffer(pdfBase64);
                pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise.then(pdf => {
                    let annotations = Annotations;
                    let esealannotations = EsealAnnotations;
                    let qrannotations = QrCodeAnnotations;
                    if (annotations != '' || esealannotations != "" || qrannotations != "") {
                        renderPDF(pdf);
                    }
                    else {
                        renderPDFQuicksign(pdf);
                    }
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
                        window.location.href = IndexDocuments;
                    }
                });
            }
            console.log(resp);
        },

        error: ajaxErrorHandler
    });
}


function get() {

    var url = GetPreviewConfig;
    var id = Edmsidvalue;
    var signpresent = false;
    var esealpresent = false;

    var sigAnnData = SigAnnData;
    var esealAnnData = EsealAnnData;
    var qrAnnData = QrAnnData;

    const { docViewer, Annotations, CoreControls, iframeWindow, PDFNet, Tools } = webviwerInstance;




    const applyannotations = (data, key) => {

        console.log(data);
        const { docViewer, Annotations, CoreControls, iframeWindow, PDFNet, Tools } = webviwerInstance;
        const annotManager = docViewer.getAnnotationManager();
        const fieldManager = annotManager.getFieldManager();
        const rotation = docViewer.getCompleteRotation(1) * 90;
        const Docrotation = docViewer.getCompleteRotation(1) * 90;
        if (data.type === 'SIGNATURE') {
            Annotations.SignatureWidgetAnnotation.prototype.createSignHereElement =
                function () {
                    const rotation =
                        docViewer.getCompleteRotation(1) * 90;


                    const SIG90 =
                        '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="27" height="150" viewBox="0 0 27 150"><g id="Group_4534" data-name="Group 4534" transform="translate(754 1451) rotate(-90)"><rect id="Rectangle_6850" data-name="Rectangle 6850" width="150" height="27" rx="5" transform="translate(1301 -754)" fill="#aecf5b"/><g id="Group_4525" data-name="Group 4525" transform="translate(1464.083 -786.275) rotate(15.009)"><rect id="Rectangle_6855" data-name="Rectangle 6855" width="3.041" height="17.855" rx="1.52" transform="translate(-117.696 67.202)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><path id="Rectangle_6856" data-name="Rectangle 6856" d="M.921,0h0a.921.921,0,0,1,.921.921V1.2H0V.921A.921.921,0,0,1,.921,0Z" transform="translate(-117.098 66)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><path id="Rectangle_6857" data-name="Rectangle 6857" d="M0,0H2.21V1.1a1.1,1.1,0,0,1-1.1,1.1h0A1.1,1.1,0,0,1,0,1.1Z" transform="translate(-117.28 85.057)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><line id="Line_23" data-name="Line 23" y2="1.715" transform="translate(-116.175 87.267)" fill="none" stroke="#15161e" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1"/><path id="Path_8480" data-name="Path 8480" d="M-119.12,107.786v-4.349a1.008,1.008,0,0,1,1.008-1.008h.371" transform="translate(0 -34.926)" fill="none" stroke="#15161e" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1"/></g><g id="Group_4530" data-name="Group 4530" transform="translate(9)"><g id="Group_4526" data-name="Group 4526" transform="translate(0 -1)"><circle id="Ellipse_76" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4529" data-name="Group 4529" transform="translate(50 -1)"><circle id="Ellipse_76-2" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-2" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-2" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-2" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-2" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-2" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-2" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-2" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4527" data-name="Group 4527" transform="translate(25 -1)"><circle id="Ellipse_76-3" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-3" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-3" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-3" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-3" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-3" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-3" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-3" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4528" data-name="Group 4528" transform="translate(75 -1)"><circle id="Ellipse_76-4" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-4" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-4" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-4" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-4" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-4" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-4" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-4" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g></g><text id="Sign_here" data-name="Sign here" transform="translate(1339 -735)" fill="#0d0c0c" font-size="17" font-family="Montserrat-SemiBold, Montserrat" font-weight="600"><tspan x="0" y="0">Sign here</tspan></text></g></svg>';
                    const SIG270 =
                        '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="27" height="150" viewBox="0 0 27 150"><g id="Group_4533" data-name="Group 4533" transform="translate(-727 -1301) rotate(90)"><rect id="Rectangle_6850" data-name="Rectangle 6850" width="150" height="27" rx="5" transform="translate(1301 -754)" fill="#aecf5b"/><path id="Subtraction_6" data-name="Subtraction 6" d="M147,30a4.969,4.969,0,0,0,2.882-.913Z" transform="translate(1301 -757)" fill="#384e00" opacity="0.22"/><g id="Group_4525" data-name="Group 4525" transform="translate(1464.083 -786.275) rotate(15.009)"><rect id="Rectangle_6855" data-name="Rectangle 6855" width="3.041" height="17.855" rx="1.52" transform="translate(-117.696 67.202)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><path id="Rectangle_6856" data-name="Rectangle 6856" d="M.921,0h0a.921.921,0,0,1,.921.921V1.2H0V.921A.921.921,0,0,1,.921,0Z" transform="translate(-117.098 66)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><path id="Rectangle_6857" data-name="Rectangle 6857" d="M0,0H2.21V1.1a1.1,1.1,0,0,1-1.1,1.1h0A1.1,1.1,0,0,1,0,1.1Z" transform="translate(-117.28 85.057)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><line id="Line_23" data-name="Line 23" y2="1.715" transform="translate(-116.175 87.267)" fill="none" stroke="#15161e" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1"/><path id="Path_8480" data-name="Path 8480" d="M-119.12,107.786v-4.349a1.008,1.008,0,0,1,1.008-1.008h.371" transform="translate(0 -34.926)" fill="none" stroke="#15161e" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1"/></g><g id="Group_4530" data-name="Group 4530" transform="translate(9)"><g id="Group_4526" data-name="Group 4526" transform="translate(0 -1)"><circle id="Ellipse_76" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4529" data-name="Group 4529" transform="translate(50 -1)"><circle id="Ellipse_76-2" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-2" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-2" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-2" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-2" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-2" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-2" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-2" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4527" data-name="Group 4527" transform="translate(25 -1)"><circle id="Ellipse_76-3" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-3" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-3" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-3" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-3" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-3" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-3" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-3" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4528" data-name="Group 4528" transform="translate(75 -1)"><circle id="Ellipse_76-4" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-4" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-4" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-4" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-4" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-4" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-4" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-4" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g></g><text id="Sign_here" data-name="Sign here" transform="translate(1339 -735)" fill="#0d0c0c" font-size="17" font-family="Montserrat-SemiBold, Montserrat" font-weight="600"><tspan x="0" y="0">Sign here</tspan></text></g></svg>';

                    const SIG180 =
                        '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="150" height="27" viewBox="0 0 150 27"><g id="Group_4532" data-name="Group 4532" transform="translate(1451 -727) rotate(180)"><rect id="Rectangle_6850" data-name="Rectangle 6850" width="150" height="27" rx="5" transform="translate(1301 -754)" fill="#aecf5b"/><g id="Group_4525" data-name="Group 4525" transform="translate(1464.083 -786.275) rotate(15.009)"><rect id="Rectangle_6855" data-name="Rectangle 6855" width="3.041" height="17.855" rx="1.52" transform="translate(-117.696 67.202)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><path id="Rectangle_6856" data-name="Rectangle 6856" d="M.921,0h0a.921.921,0,0,1,.921.921V1.2H0V.921A.921.921,0,0,1,.921,0Z" transform="translate(-117.098 66)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><path id="Rectangle_6857" data-name="Rectangle 6857" d="M0,0H2.21V1.1a1.1,1.1,0,0,1-1.1,1.1h0A1.1,1.1,0,0,1,0,1.1Z" transform="translate(-117.28 85.057)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><line id="Line_23" data-name="Line 23" y2="1.715" transform="translate(-116.175 87.267)" fill="none" stroke="#15161e" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1"/><path id="Path_8480" data-name="Path 8480" d="M-119.12,107.786v-4.349a1.008,1.008,0,0,1,1.008-1.008h.371" transform="translate(0 -34.926)" fill="none" stroke="#15161e" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1"/></g><g id="Group_4530" data-name="Group 4530" transform="translate(9)"><g id="Group_4526" data-name="Group 4526" transform="translate(0 -1)"><circle id="Ellipse_76" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4529" data-name="Group 4529" transform="translate(50 -1)"><circle id="Ellipse_76-2" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-2" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-2" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-2" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-2" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-2" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-2" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-2" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4527" data-name="Group 4527" transform="translate(25 -1)"><circle id="Ellipse_76-3" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-3" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-3" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-3" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-3" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-3" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-3" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-3" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4528" data-name="Group 4528" transform="translate(75 -1)"><circle id="Ellipse_76-4" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-4" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-4" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-4" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-4" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-4" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-4" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-4" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g></g><text id="Sign_here" data-name="Sign here" transform="translate(1339 -735)" fill="#0d0c0c" font-size="17" font-family="Montserrat-SemiBold, Montserrat" font-weight="600"><tspan x="0" y="0">Sign here</tspan></text></g></svg>';
                    const SIG0 =
                        '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="150" height="27" viewBox="0 0 150 27"><g id="Group_4531" data-name="Group 4531" transform="translate(-1301 754)"><rect id="Rectangle_6850" data-name="Rectangle 6850" width="150" height="27" rx="5" transform="translate(1301 -754)" fill="#aecf5b"/><g id="Group_4525" data-name="Group 4525" transform="translate(1464.083 -786.275) rotate(15.009)"><rect id="Rectangle_6855" data-name="Rectangle 6855" width="3.041" height="17.855" rx="1.52" transform="translate(-117.696 67.202)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><path id="Rectangle_6856" data-name="Rectangle 6856" d="M.921,0h0a.921.921,0,0,1,.921.921V1.2H0V.921A.921.921,0,0,1,.921,0Z" transform="translate(-117.098 66)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><path id="Rectangle_6857" data-name="Rectangle 6857" d="M0,0H2.21V1.1a1.1,1.1,0,0,1-1.1,1.1h0A1.1,1.1,0,0,1,0,1.1Z" transform="translate(-117.28 85.057)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><line id="Line_23" data-name="Line 23" y2="1.715" transform="translate(-116.175 87.267)" fill="none" stroke="#15161e" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1"/><path id="Path_8480" data-name="Path 8480" d="M-119.12,107.786v-4.349a1.008,1.008,0,0,1,1.008-1.008h.371" transform="translate(0 -34.926)" fill="none" stroke="#15161e" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1"/></g><g id="Group_4530" data-name="Group 4530" transform="translate(9)"><g id="Group_4526" data-name="Group 4526" transform="translate(0 -1)"><circle id="Ellipse_76" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4529" data-name="Group 4529" transform="translate(50 -1)"><circle id="Ellipse_76-2" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-2" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-2" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-2" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-2" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-2" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-2" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-2" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4527" data-name="Group 4527" transform="translate(25 -1)"><circle id="Ellipse_76-3" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-3" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-3" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-3" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-3" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-3" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-3" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-3" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4528" data-name="Group 4528" transform="translate(75 -1)"><circle id="Ellipse_76-4" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-4" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-4" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-4" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-4" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-4" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-4" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-4" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g></g><text id="Sign_here" data-name="Sign here" transform="translate(1339 -735)" fill="#0d0c0c" font-size="17" font-family="Montserrat-SemiBold, Montserrat" font-weight="600"><tspan x="0" y="0">Sign here</tspan></text></g></svg>';

                    const div = document.createElement("div");
                    div.style.width = "100%";
                    div.style.height = "100%";
                    div.style.cursor = "pointer";

                    if (Docrotation === 90) {
                        div.innerHTML = SIG90;
                    } else if (Docrotation === 180) {
                        div.innerHTML = SIG180;
                    } else if (Docrotation === 270) {
                        div.innerHTML = SIG270;
                    } else {
                        div.innerHTML = SIG0;
                    }

                    return div;
                };
            let signfieldvals = data;


            const field = new Annotations.Forms.Field(
                signfieldvals.fieldName,
                {
                    type: "Sig",
                }
            );

            const widgetAnnot =
                new Annotations.SignatureWidgetAnnotation(field, {
                    appearance: "_DEFAULT",
                    appearances: {
                        _DEFAULT: {
                            Normal: {
                                data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjEuMWMqnEsAAAANSURBVBhXY/j//z8DAAj8Av6IXwbgAAAAAElFTkSuQmCC",
                                offset: {
                                    x: 100,
                                    y: 100,
                                },
                            },
                        },
                    },
                    // rotation:Docrotation
                });


            widgetAnnot.PageNumber = signfieldvals.PageNumber;
            widgetAnnot.X = signfieldvals.posX;
            widgetAnnot.Y = signfieldvals.posY;
            widgetAnnot.Width = signfieldvals.width;
            widgetAnnot.Height = signfieldvals.height;

            widgetAnnot.setCustomData("issigfield", true);
            widgetAnnot.setCustomData(
                "recepient",
                suid
            );
            annotManager.addAnnotation(widgetAnnot);
            annotManager.drawAnnotationsFromList([widgetAnnot]);
            fieldManager.addField(field);

        } else if (data.type === 'ESEAL') {
            if (signpresent == true) {
                var Eseal = "";
                if (Docrotation == 180) {
                    Eseal =
                        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI3MS4yNyIgaGVpZ2h0PSI2NC42MTgiIHZpZXdCb3g9IjAgMCA3MS4yNyA2NC42MTgiPg0KICA8ZyBpZD0iR3JvdXBfOTc1ODMiIGRhdGEtbmFtZT0iR3JvdXAgOTc1ODMiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zOTYwLjg2NSAtNDg3MC41KSI+DQogICAgPHBhdGggaWQ9IlVuaW9uXzEiIGRhdGEtbmFtZT0iVW5pb24gMSIgZD0iTTIzLjUzNCw2Mi4wNzlBMzIuMzM0LDMyLjMzNCwwLDAsMSw0LjcsMzkuOTExSDJhMiwyLDAsMCwxLTItMlYyMS45NTVhMiwyLDAsMCwxLDItMkg2LjI0N2wuMDkzLS4yMjNhMzIuMzI4LDMyLjMyOCwwLDAsMSw1OS41NCwwbC4wOTMuMjIzaDMuM2EyLDIsMCwwLDEsMiwyVjM3LjkxMmEyLDIsMCwwLDEtMiwySDY3LjUyMkEzMi4zNDEsMzIuMzQxLDAsMCwxLDIzLjUzNCw2Mi4wNzlabTEyLjU3Ny02Ljk2M2EyMi44NDcsMjIuODQ3LDAsMCwwLDIxLjUtMTUuMkgxNC42MDhBMjIuODQ4LDIyLjg0OCwwLDAsMCwzNi4xMTEsNTUuMTE2Wm0xOS4xNjMtMzUuMTZhMjIuNzkyLDIyLjc5MiwwLDAsMC0zOC4zMjcsMFoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQwMzIuMTM1IDQ5MzUuMTE4KSByb3RhdGUoMTgwKSIgZmlsbD0iIzhhYmIyYSIvPg0KICAgIDx0ZXh0IGlkPSJFLVNFQUwiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQwMjEuNjgyIDQ5MDAuMTU3KSByb3RhdGUoMTgwKSIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSIxNiIgZm9udC1mYW1pbHk9Ik1hdHRlby1TZW1pYm9sZCwgTWF0dGVvIiBmb250LXdlaWdodD0iNjAwIj48dHNwYW4geD0iMCIgeT0iMCIgZmlsbD0iIzAwMCI+RTwvdHNwYW4+PHRzcGFuIHk9IjAiIGZpbGw9IiNmZmYiPi1TRUFMPC90c3Bhbj48L3RleHQ+DQogIDwvZz4NCjwvc3ZnPg0K";
                } else if (Docrotation == 90) {
                    Eseal =
                        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NC42MTgiIGhlaWdodD0iNzEuMjcxIiB2aWV3Qm94PSIwIDAgNjQuNjE4IDcxLjI3MSI+DQogIDxnIGlkPSJHcm91cF85NzU4MSIgZGF0YS1uYW1lPSJHcm91cCA5NzU4MSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNjQuNjE4KSByb3RhdGUoOTApIj4NCiAgICA8cGF0aCBpZD0iVW5pb25fMSIgZGF0YS1uYW1lPSJVbmlvbiAxIiBkPSJNMjMuNTM0LDYyLjA3OUEzMi4zMzQsMzIuMzM0LDAsMCwxLDQuNywzOS45MTFIMmEyLDIsMCwwLDEtMi0yVjIxLjk1NWEyLDIsMCwwLDEsMi0ySDYuMjQ3bC4wOTMtLjIyM2EzMi4zMjgsMzIuMzI4LDAsMCwxLDU5LjU0LDBsLjA5My4yMjNoMy4zYTIsMiwwLDAsMSwyLDJWMzcuOTEyYTIsMiwwLDAsMS0yLDJINjcuNTIyQTMyLjM0MSwzMi4zNDEsMCwwLDEsMjMuNTM0LDYyLjA3OVptMTIuNTc4LTYuOTYzYTIyLjg0NywyMi44NDcsMCwwLDAsMjEuNS0xNS4ySDE0LjYwOEEyMi44NDksMjIuODQ5LDAsMCwwLDM2LjExMiw1NS4xMTZabTE5LjE2My0zNS4xNmEyMi43OTIsMjIuNzkyLDAsMCwwLTM4LjMyNywwWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAwKSIgZmlsbD0iIzhhYmIyYSIvPg0KICAgIDx0ZXh0IGlkPSJFLVNFQUwiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDYzLjQ1NCAyNC45NjEpIHJvdGF0ZSgxODApIiBmaWxsPSIjZmZmIiBmb250LXNpemU9IjE2IiBmb250LWZhbWlseT0iTWF0dGVvLVNlbWlib2xkLCBNYXR0ZW8iIGZvbnQtd2VpZ2h0PSI2MDAiPjx0c3BhbiB4PSIwIiB5PSIwIiBmaWxsPSIjMDAwIj5FPC90c3Bhbj48dHNwYW4geT0iMCIgZmlsbD0iI2ZmZiI+LVNFQUw8L3RzcGFuPjwvdGV4dD4NCiAgPC9nPg0KPC9zdmc+DQo=";
                } else if (Docrotation == 270) {
                    Eseal =
                        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NC42MTgiIGhlaWdodD0iNzEuMjcxIiB2aWV3Qm94PSIwIDAgNjQuNjE4IDcxLjI3MSI+DQogIDxnIGlkPSJHcm91cF85NzU4MiIgZGF0YS1uYW1lPSJHcm91cCA5NzU4MiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTQwMjQuMTkxIC00OTU0LjE3NCkiPg0KICAgIDxwYXRoIGlkPSJVbmlvbl8xIiBkYXRhLW5hbWU9IlVuaW9uIDEiIGQ9Ik0yMy41MzQsNjIuMDc5QTMyLjQyNiwzMi40MjYsMCwwLDEsNi4zNDEsNDQuODg2bC0uMDkzLS4yMjNIMmEyLDIsMCwwLDEtMi0yVjI2LjcwN2EyLDIsMCwwLDEsMi0ySDQuN2EzMi4zMjYsMzIuMzI2LDAsMCwxLDYxLjE4Mi00Ljk3NCwzMi4wNzcsMzIuMDc3LDAsMCwxLDEuNjQyLDQuOTc0aDEuNzQ5YTIsMiwwLDAsMSwyLDJWNDIuNjYzYTIsMiwwLDAsMS0yLDJoLTMuM2wtLjA5My4yMjNBMzIuMzQ2LDMyLjM0NiwwLDAsMSwyMy41MzQsNjIuMDc5Wm0xMi41NzgtNi45NjNBMjIuOCwyMi44LDAsMCwwLDU1LjI3NCw0NC42NjNIMTYuOTQ3QTIyLjgwNywyMi44MDcsMCwwLDAsMzYuMTEyLDU1LjExNlptMjEuNS0zMC40MDlhMjIuODA4LDIyLjgwOCwwLDAsMC00My4wMDYsMFoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQwODguODEgNDk1NC4xNzQpIHJvdGF0ZSg5MCkiIGZpbGw9IiM4YWJiMmEiLz4NCiAgICA8dGV4dCBpZD0iRS1TRUFMIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0MDQ5LjE1MyA0OTY0LjYyNykgcm90YXRlKDkwKSIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSIxNiIgZm9udC1mYW1pbHk9Ik1hdHRlby1TZW1pYm9sZCwgTWF0dGVvIiBmb250LXdlaWdodD0iNjAwIj48dHNwYW4geD0iMCIgeT0iMCIgZmlsbD0iIzAwMCI+RTwvdHNwYW4+PHRzcGFuIHk9IjAiIGZpbGw9IiNmZmYiPi1TRUFMPC90c3Bhbj48L3RleHQ+DQogIDwvZz4NCjwvc3ZnPg0K";
                } else {
                    Eseal =
                        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI3MS4yNyIgaGVpZ2h0PSI2NC42MTgiIHZpZXdCb3g9IjAgMCA3MS4yNyA2NC42MTgiPg0KICA8ZyBpZD0iR3JvdXBfOTc1NzgiIGRhdGEtbmFtZT0iR3JvdXAgOTc1NzgiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xIC00KSI+DQogICAgPHBhdGggaWQ9IlVuaW9uXzEiIGRhdGEtbmFtZT0iVW5pb24gMSIgZD0iTTIzLjUzMyw2Mi4wOEEzMi40MjYsMzIuNDI2LDAsMCwxLDYuMzQsNDQuODg3bC0uMDkzLS4yMjNIMmEyLDIsMCwwLDEtMi0yVjI2LjcwOGEyLDIsMCwwLDEsMi0ySDQuN0EzMi4zMjUsMzIuMzI1LDAsMCwxLDY1Ljg4LDE5LjczNGEzMi4wNTksMzIuMDU5LDAsMCwxLDEuNjQyLDQuOTczaDEuNzQ4YTIsMiwwLDAsMSwyLDJWNDIuNjY0YTIsMiwwLDAsMS0yLDJoLTMuM2wtLjA5My4yMjNBMzIuMzQ2LDMyLjM0NiwwLDAsMSwyMy41MzMsNjIuMDhaTTM2LjExLDU1LjExN0EyMi44MDYsMjIuODA2LDAsMCwwLDU1LjI3Myw0NC42NjNIMTYuOTQ3QTIyLjgwNiwyMi44MDYsMCwwLDAsMzYuMTEsNTUuMTE3Wm0yMS41LTMwLjQwOWEyMi44MDgsMjIuODA4LDAsMCwwLTQzLjAwNiwwWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMSA0KSIgZmlsbD0iIzhhYmIyYSIvPg0KICAgIDx0ZXh0IGlkPSJFLVNFQUwiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDExLjQ1MyA0My42NTcpIiBmaWxsPSIjZmZmIiBmb250LXNpemU9IjE2IiBmb250LWZhbWlseT0iTWF0dGVvLVNlbWlib2xkLCBNYXR0ZW8iIGZvbnQtd2VpZ2h0PSI2MDAiPjx0c3BhbiB4PSIwIiB5PSIwIiBmaWxsPSIjMDAwIj5FPC90c3Bhbj48dHNwYW4geT0iMCIgZmlsbD0iI2ZmZiI+LVNFQUw8L3RzcGFuPjwvdGV4dD4NCiAgPC9nPg0KPC9zdmc+DQo=";
                }

                let esealfieldvals = data;

                const field = new Annotations.Forms.Field(
                    esealfieldvals.fieldName,
                    {
                        type: "Sig",
                    }
                );
                const widgetAnnot =
                    new Annotations.SignatureWidgetAnnotation(field, {
                        appearance: "_DEFAULT",
                        appearances: {
                            _DEFAULT: {
                                Normal: {
                                    data: Eseal,
                                    offset: {
                                        x: 100,
                                        y: 100,
                                    },
                                },
                            },
                        },
                        // rotation: Docrotation,
                    });
                widgetAnnot.PageNumber = esealfieldvals.PageNumber;
                widgetAnnot.X = esealfieldvals.posX;
                widgetAnnot.Y = esealfieldvals.posY;
                widgetAnnot.Width = esealfieldvals.width;
                widgetAnnot.Height = esealfieldvals.height;

                widgetAnnot.setCustomData("isesealField", true);
                widgetAnnot.setCustomData(
                    "recepient",
                    suid
                );

                //add the form field and widget annotation
                annotManager.addAnnotation(widgetAnnot);
                annotManager.drawAnnotationsFromList([widgetAnnot]);
                fieldManager.addField(field);

            } else {
                Annotations.SignatureWidgetAnnotation.prototype.createSignHereElement =
                    function () {
                        const rotation =
                            docViewer.getCompleteRotation(1) * 90;

                        const SIG90 =
                            '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="27" height="150" viewBox="0 0 27 150"><g id="Group_4534" data-name="Group 4534" transform="translate(754 1451) rotate(-90)"><rect id="Rectangle_6850" data-name="Rectangle 6850" width="150" height="27" rx="5" transform="translate(1301 -754)" fill="#aecf5b"/><g id="Group_4525" data-name="Group 4525" transform="translate(1464.083 -786.275) rotate(15.009)"><rect id="Rectangle_6855" data-name="Rectangle 6855" width="3.041" height="17.855" rx="1.52" transform="translate(-117.696 67.202)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><path id="Rectangle_6856" data-name="Rectangle 6856" d="M.921,0h0a.921.921,0,0,1,.921.921V1.2H0V.921A.921.921,0,0,1,.921,0Z" transform="translate(-117.098 66)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><path id="Rectangle_6857" data-name="Rectangle 6857" d="M0,0H2.21V1.1a1.1,1.1,0,0,1-1.1,1.1h0A1.1,1.1,0,0,1,0,1.1Z" transform="translate(-117.28 85.057)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><line id="Line_23" data-name="Line 23" y2="1.715" transform="translate(-116.175 87.267)" fill="none" stroke="#15161e" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1"/><path id="Path_8480" data-name="Path 8480" d="M-119.12,107.786v-4.349a1.008,1.008,0,0,1,1.008-1.008h.371" transform="translate(0 -34.926)" fill="none" stroke="#15161e" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1"/></g><g id="Group_4530" data-name="Group 4530" transform="translate(9)"><g id="Group_4526" data-name="Group 4526" transform="translate(0 -1)"><circle id="Ellipse_76" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4529" data-name="Group 4529" transform="translate(50 -1)"><circle id="Ellipse_76-2" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-2" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-2" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-2" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-2" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-2" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-2" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-2" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4527" data-name="Group 4527" transform="translate(25 -1)"><circle id="Ellipse_76-3" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-3" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-3" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-3" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-3" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-3" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-3" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-3" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4528" data-name="Group 4528" transform="translate(75 -1)"><circle id="Ellipse_76-4" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-4" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-4" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-4" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-4" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-4" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-4" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-4" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g></g><text id="Sign_here" data-name="Sign here" transform="translate(1339 -735)" fill="#0d0c0c" font-size="17" font-family="Montserrat-SemiBold, Montserrat" font-weight="600"><tspan x="0" y="0">Sign here</tspan></text></g></svg>';
                        const SIG270 =
                            '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="27" height="150" viewBox="0 0 27 150"><g id="Group_4533" data-name="Group 4533" transform="translate(-727 -1301) rotate(90)"><rect id="Rectangle_6850" data-name="Rectangle 6850" width="150" height="27" rx="5" transform="translate(1301 -754)" fill="#aecf5b"/><path id="Subtraction_6" data-name="Subtraction 6" d="M147,30a4.969,4.969,0,0,0,2.882-.913Z" transform="translate(1301 -757)" fill="#384e00" opacity="0.22"/><g id="Group_4525" data-name="Group 4525" transform="translate(1464.083 -786.275) rotate(15.009)"><rect id="Rectangle_6855" data-name="Rectangle 6855" width="3.041" height="17.855" rx="1.52" transform="translate(-117.696 67.202)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><path id="Rectangle_6856" data-name="Rectangle 6856" d="M.921,0h0a.921.921,0,0,1,.921.921V1.2H0V.921A.921.921,0,0,1,.921,0Z" transform="translate(-117.098 66)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><path id="Rectangle_6857" data-name="Rectangle 6857" d="M0,0H2.21V1.1a1.1,1.1,0,0,1-1.1,1.1h0A1.1,1.1,0,0,1,0,1.1Z" transform="translate(-117.28 85.057)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><line id="Line_23" data-name="Line 23" y2="1.715" transform="translate(-116.175 87.267)" fill="none" stroke="#15161e" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1"/><path id="Path_8480" data-name="Path 8480" d="M-119.12,107.786v-4.349a1.008,1.008,0,0,1,1.008-1.008h.371" transform="translate(0 -34.926)" fill="none" stroke="#15161e" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1"/></g><g id="Group_4530" data-name="Group 4530" transform="translate(9)"><g id="Group_4526" data-name="Group 4526" transform="translate(0 -1)"><circle id="Ellipse_76" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4529" data-name="Group 4529" transform="translate(50 -1)"><circle id="Ellipse_76-2" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-2" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-2" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-2" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-2" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-2" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-2" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-2" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4527" data-name="Group 4527" transform="translate(25 -1)"><circle id="Ellipse_76-3" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-3" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-3" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-3" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-3" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-3" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-3" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-3" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4528" data-name="Group 4528" transform="translate(75 -1)"><circle id="Ellipse_76-4" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-4" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-4" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-4" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-4" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-4" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-4" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-4" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g></g><text id="Sign_here" data-name="Sign here" transform="translate(1339 -735)" fill="#0d0c0c" font-size="17" font-family="Montserrat-SemiBold, Montserrat" font-weight="600"><tspan x="0" y="0">Sign here</tspan></text></g></svg>';

                        const SIG180 =
                            '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="150" height="27" viewBox="0 0 150 27"><g id="Group_4532" data-name="Group 4532" transform="translate(1451 -727) rotate(180)"><rect id="Rectangle_6850" data-name="Rectangle 6850" width="150" height="27" rx="5" transform="translate(1301 -754)" fill="#aecf5b"/><g id="Group_4525" data-name="Group 4525" transform="translate(1464.083 -786.275) rotate(15.009)"><rect id="Rectangle_6855" data-name="Rectangle 6855" width="3.041" height="17.855" rx="1.52" transform="translate(-117.696 67.202)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><path id="Rectangle_6856" data-name="Rectangle 6856" d="M.921,0h0a.921.921,0,0,1,.921.921V1.2H0V.921A.921.921,0,0,1,.921,0Z" transform="translate(-117.098 66)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><path id="Rectangle_6857" data-name="Rectangle 6857" d="M0,0H2.21V1.1a1.1,1.1,0,0,1-1.1,1.1h0A1.1,1.1,0,0,1,0,1.1Z" transform="translate(-117.28 85.057)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><line id="Line_23" data-name="Line 23" y2="1.715" transform="translate(-116.175 87.267)" fill="none" stroke="#15161e" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1"/><path id="Path_8480" data-name="Path 8480" d="M-119.12,107.786v-4.349a1.008,1.008,0,0,1,1.008-1.008h.371" transform="translate(0 -34.926)" fill="none" stroke="#15161e" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1"/></g><g id="Group_4530" data-name="Group 4530" transform="translate(9)"><g id="Group_4526" data-name="Group 4526" transform="translate(0 -1)"><circle id="Ellipse_76" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4529" data-name="Group 4529" transform="translate(50 -1)"><circle id="Ellipse_76-2" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-2" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-2" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-2" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-2" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-2" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-2" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-2" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4527" data-name="Group 4527" transform="translate(25 -1)"><circle id="Ellipse_76-3" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-3" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-3" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-3" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-3" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-3" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-3" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-3" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4528" data-name="Group 4528" transform="translate(75 -1)"><circle id="Ellipse_76-4" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-4" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-4" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-4" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-4" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-4" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-4" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-4" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g></g><text id="Sign_here" data-name="Sign here" transform="translate(1339 -735)" fill="#0d0c0c" font-size="17" font-family="Montserrat-SemiBold, Montserrat" font-weight="600"><tspan x="0" y="0">Sign here</tspan></text></g></svg>';
                        const SIG0 =
                            '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="71.27" height="64.617" viewBox="0 0 71.27 64.617"><g id="Group_97578" data-name="Group 97578" transform="translate(-1 -4.01)"><path id="Union_1" data-name="Union 1" d="M23.533,62.08A32.426,32.426,0,0,1,6.34,44.887l-.093-.223H2a2,2,0,0,1-2-2V26.708a2,2,0,0,1,2-2H4.7a32.32,32.32,0,0,1,62.822,0H69.27a2,2,0,0,1,2,2V42.664a2,2,0,0,1-2,2h-3.3l-.093.223A32.346,32.346,0,0,1,23.533,62.08ZM36.11,55.117A22.806,22.806,0,0,0,55.273,44.663H16.947A22.806,22.806,0,0,0,36.11,55.117Zm21.5-30.409a22.808,22.808,0,0,0-43.006,0Z" transform="translate(1 4)" fill="#8abb2a"/><text id="E-SEAL" transform="translate(5.135 43.657)" fill="#fff" font-size="15" font-family="Matteo-Semibold, Matteo" font-weight="600"><tspan x="0" y="0" fill="#000">Sign</tspan><tspan y="0" fill="#fff">here</tspan></text></g></svg>'

                        const div = document.createElement("div");
                        div.style.width = "100%";
                        div.style.height = "100%";
                        div.style.cursor = "pointer";

                        if (Docrotation === 90) {
                            div.innerHTML = SIG90;
                        } else if (Docrotation === 180) {
                            div.innerHTML = SIG180;
                        } else if (Docrotation === 270) {
                            div.innerHTML = SIG270;
                        } else {
                            console.log("print")
                            div.innerHTML = SIG0;
                        }

                        return div;
                    };
                let esealfieldvals = data;


                const field = new Annotations.Forms.Field(
                    esealfieldvals.fieldName,
                    {
                        type: "Sig",
                    }
                );
                const widgetAnnot =
                    new Annotations.SignatureWidgetAnnotation(field, {
                        appearance: "_DEFAULT",
                        appearances: {
                            _DEFAULT: {
                                Normal: {
                                    data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjEuMWMqnEsAAAANSURBVBhXY/j//z8DAAj8Av6IXwbgAAAAAElFTkSuQmCC",
                                    offset: {
                                        x: 100,
                                        y: 100,
                                    },
                                },
                            },
                        },
                        // rotation: Docrotation,
                    });

                widgetAnnot.PageNumber = esealfieldvals.PageNumber;
                widgetAnnot.X = esealfieldvals.posX;
                widgetAnnot.Y = esealfieldvals.posY;
                widgetAnnot.Width = esealfieldvals.width;
                widgetAnnot.Height = esealfieldvals.height;

                widgetAnnot.setCustomData("isesealField", true);
                widgetAnnot.setCustomData(
                    "recepient",
                    suid
                );

                //add the form field and widget annotation
                annotManager.addAnnotation(widgetAnnot);
                annotManager.drawAnnotationsFromList([widgetAnnot]);
                fieldManager.addField(field);

            }
        }
        else if (data.type == 'QRCODE') {



            var Qrcode = "";
            if (Docrotation == 180) {
                Qrcode =
                    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI1OS45MDIiIHZpZXdCb3g9IjAgMCA2MCA1OS45MDIiPg0KICA8ZyBpZD0iX2Rvd24iIGRhdGEtbmFtZT0iIGRvd24iIHRyYW5zZm9ybT0idHJhbnNsYXRlKDYwIDU5LjkwMikgcm90YXRlKDE4MCkiPg0KICAgIDxnIGlkPSJHcm91cF8zNDMzIiBkYXRhLW5hbWU9Ikdyb3VwIDM0MzMiPg0KICAgICAgPGcgaWQ9Ikdyb3VwXzM0MDUiIGRhdGEtbmFtZT0iR3JvdXAgMzQwNSI+DQogICAgICAgIDxnIGlkPSJHcm91cF8zNDM0IiBkYXRhLW5hbWU9Ikdyb3VwIDM0MzQiPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTUiIGRhdGEtbmFtZT0iUGF0aCA1MTE1IiBkPSJNMTAwLjA3NSw2NS4wMTJoMi44NTlWNjIuOTQ5YzAtLjcxNCwwLS43MS42OS0uNzE5LjU3Ny0uMDA3LDEuMTU1LS4wMSwxLjczMS0uMDQ1LjMtLjAxOS40MjQuMDkyLjQxOS4zNzktLjAxMy42NjcsMCwxLjMzNy0uMDQ4LDItLjAyNy4zODUuMDg2LjUxOS40Ny41LjY2Ny0uMDI3LDEuMzM3LS4wMzYsMi0uMDE4LjMyMi4wMDguNDMxLS4xLjQyLS40MTQtLjAyMi0uNjY3LS4wMDctMS4zMzYtLjAzMi0yLS4wMTItLjMzOS4xMTEtLjQ1OC40NS0uNDQ3LjY2OC4wMjEsMS4zMzcuMDI1LDIsMCwuMzE5LS4wMTEuNDM1LjA4NS40MjEuNDA5LS4wMjkuNjY3LS4wMTQsMS4zMzctLjA0NywyLS4wMTUuMy4wNC40NTguMzguNDUyLjgtLjAxMywxLjYwOSwwLDIuNDY1LDB2Mi44MTRoLS41OGMtLjYyMywwLTEuMjQ3LS4wMTMtMS44NjguMDE2LS4xMjMuMDA1LS4zMzguMTcyLS4zNDEuMjctLjAyNy44NDgtLjAxNiwxLjctLjAxNiwyLjZoMi44djIuOTMySDExMS40N2MwLC44NzUsMCwxLjcwNiwwLDIuNTM2LDAsLjMuMjI0LjI3Mi40MjEuMjcuNjY5LS4wMDgsMS4zMzgsMCwyLS4wMzMuMzM3LS4wMTYuNDYyLjA4Ni40NDkuNDMyLS4wMjYuNjY3LS4wMzMsMS4zMzYtLjAxMiwyLC4wMTEuMzQ4LS4xMTcuNDUzLS40NDcuNDQ2LS42ODMtLjAxNS0xLjM2OC0uMDE1LTIuMDUuMDEtLjExMSwwLS4zMDguMTYtLjMxLjI1LS4wMjQuODMzLS4wMTQsMS42NjYtLjAxNCwyLjU1MmgyLjc4MVY4Ny44OGgtNS42NWMwLS44MTgtLjAxOS0xLjYxOC4wMDgtMi40MTcuMDEzLS4zOTEtLjEzMy0uNDkxLS41LS40NzktLjc1Ny4wMjQtMS41MTYuMDA3LTIuMzMuMDA3LDAtLjk1MywwLTEuODg3LDAtMi44MmgyLjgxN2MwLS45LjAwOC0xLjc2Ni0uMDE0LTIuNjI2LDAtLjA3Ny0uMi0uMjA5LS4zMS0uMjEzcS0xLjExNS0uMDM5LTIuMjMxLS4wMjFjLS4xLDAtLjI3NC4xMjktLjI3NS4yLS4wMDcuODkxLjAxMiwxLjc4Mi4wMjUsMi42NzJIMTAzVjg3LjloMi43NzVjMCwuOTIuMDExLDEuNzk0LS4wMTcsMi42NjYsMCwuMDkxLS4yNDYuMjUtLjM3Ny4yNDktMi40MTUtLjAwNy00LjgzLS4wMzktNy4yNDQtLjA1NC0uOTI5LS4wMDYtLjk0OC4wMjUtLjkyNS45MzQuMDEzLjUuMDE4LDEsLjA0NSwxLjUuMDE2LjI5My0uMDg3LjQwOC0uMzg4LjQtLjgtLjAxNC0xLjYwNSwwLTIuNSwwLDAsLjkzMi0uMDA3LDEuNzkzLjAxMiwyLjY1MywwLC4wNzQuMTczLjIwNi4yNjcuMjA2LDEuNjg2LDAsMy4zNzMtLjAxOCw1LjA1OS0uMDI4LjI2NSwwLC4zNzEtLjEwNi4zNjMtLjM4Ni0uMDE4LS42NTMuMDEyLTEuMzA3LS4wMTItMS45Ni0uMDE0LS4zNjUuMDg0LS41MTIuNDc3LS41MSwyLjU4My4wMTEsNS4xNjYsMCw3Ljc0OSwwLC4yNTEsMCwuMzYyLjA3Ni4zNjEuMzM1LDAsLjctLjAwNiwxLjQuMDEzLDIuMS4wMS4zNjctLjE1NC40Ni0uNS40NTktMi42LS4wMS01LjIsMC03LjgsMC0uMDc1LDAtLjE1LjAwNy0uMjc2LjAxM3YyLjc2M0g4NS44Njh2LTIuOEg4OGMuNzIyLDAsLjcxOCwwLC43MDgtLjcxMS0uMDA4LS41OTItLjAyNy0xLjE4NiwwLTEuNzc3LjAxNi0uMzMtLjEwOS0uMzY5LS4zOTUtLjM2Mi0uOC4wMi0xLjYwNy4wMDctMi40ODEuMDA3LDAtMS45MTcsMC0zLjc5MiwwLTUuNjY4bC0uMDEzLjAxNUg4OC43Vjg0Ljk5M2MuNzksMCwxLjUxNS0uMDMyLDIuMjM1LjAxMS40NzkuMDI4LjYtLjE0LjU3Ny0uNTkxLS4wMjgtLjU5LjAwOS0xLjE4NC4wMzYtMS43NzUuMDE1LS4zMzctLjA3MS0uNS0uNDU3LS40NzgtLjY4Mi4wMzItMS4zNjcuMDA1LTIuMDUuMDA4LS4zLDAtLjQyMi0uMDgxLS4zOTQtLjQzMWExOC45NDQsMTguOTQ0LDAsMCwwLC4wMzItMS45NTNjLS4wMDctLjMyMS4wNTktLjQ2NC40MjEtLjQ2MSwxLjcxNS4wMTYsMy40My4wMDcsNS4yMTQuMDA3Vjg0Ljk5Yy0uODMsMC0xLjYxNy4wMTUtMi40LS4wMDctLjMyNi0uMDA5LS40MjQuMTA4LS40MTcuNDE4LjAxNi42NjgtLjAxNSwxLjMzOC4wMTcsMiwuMDIuNDE3LS4xNDMuNTIzLS41My41MDktLjcyNy0uMDI1LTEuNDU1LS4wMDctMi4yNS0uMDA3djIuODQ0Yy4yMjcsMCwuNDk0LDAsLjc2MSwwLDIuNDYuMDE4LDQuOTIuMDQsNy4zOC4wNDUuMTIzLDAsLjM1NC0uMTM3LjM1NC0uMjEzLjAxMi0uODQ4LS4wMTEtMS43LS4wMy0yLjU0NSwwLS4wMzYtLjA1Mi0uMDctLjA4LS4xMDZsLS4wMS4wMTFoMi45NTl2LS42OTJjMC0xLjUzNS4wMTMtMy4wNy0uMDEtNC42LS4wMDYtLjM3OC4xMzktLjQ3Ni40NzMtLjQ3My44LjAwOSwxLjYsMCwyLjQyOSwwVjc5LjM2Yy0uMTQyLS4wMTEtLjI3My0uMDI5LS40LS4wMjktMS42MjYsMC0zLjI1Mi0uMDEtNC44NzguMDE0LS4zODEuMDA2LS41MDYtLjEtLjUtLjQ4LjAyMi0uNzcxLjAwNy0xLjU0Mi4wMDctMi4zNzYtLjgwNywwLTEuNTYzLS4wMTUtMi4zMTcuMDA2LS4zODUuMDExLS41NjUtLjA0LS41MzQtLjUxNi4wNDgtLjc1NC0uMDE1LTEuNTE2LS4wMzItMi4yNzRsLS4wMTIuMDE1Yy42NzgtLjAzNCwxLjM1Ny0uMDcyLDIuMDM2LS4xLjI1NS0uMDExLjUxMiwwLC44MjYsMFY3MC43OGg1Ljc5NVY2Ny44NjloLTIuODYxVjY1Wm01LjcxMyw1Ljc1NmMuODY3LDAsMS43MTUuMDEsMi41NjItLjAxNC4wOTUsMCwuMjU5LS4yLjI2My0uMzA5LjAyNS0uNzQzLjAxMi0xLjQ4OC4wMTgtMi4yMzEsMC0uMjUyLS4xMDctLjM0Ny0uMzYtLjM0NC0uNzI4LjAxMS0xLjQ1Ni0uMDA2LTIuMTg0LjAxNS0uMSwwLS4yODQuMTQ5LS4yODYuMjMxLS4wMjEuODYxLS4wMTMsMS43MjQtLjAxMywyLjY1Mm0yLjg0OCw1LjdjMC0uOSwwLTEuNzUsMC0yLjYsMC0uMjUyLS4xMzMtLjMtLjM1LS4yODctLjcyNC4wMzQtMS40NDguMDY2LTIuMTczLjA3OS0uMjU5LDAtLjMzOS4xMS0uMzQxLjM1NS0uMDA3LjcxLS4wNDIsMS40MjEtLjAzNiwyLjEzMSwwLC4xMDcuMTU5LjMuMjQ5LjMuODU5LjAyMywxLjcxOC4wMTQsMi42NDkuMDE0bS04LjYtMi43NzNIOTcuMjI5djIuNzc0aDIuODA3WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTU0LjM0NiAtMzkuMzc3KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTYiIGRhdGEtbmFtZT0iUGF0aCA1MTE2IiBkPSJNMjUuNywzOC43MzljLjAxNC4yMzkuMDM5LjQ3OS4wNDEuNzE4LjAwOCwxLjUzNC4wMTgsMy4wNjcuMDEyLDQuNiwwLC4zLjA1Ni40NDkuNC40NC42NjgtLjAxNywxLjMzNi4wMDgsMiwuMDExLjM2MiwwLC41MzctLjEzMy41MTctLjU0Ni0uMDM2LS43NC0uMDEtMS40ODItLjAxLTIuMjY2Ljc3NiwwLDEuNTE0LDAsMi4yNTMsMCwuNTg2LDAsLjY1MS0uMDY0LjY1LS42NDcsMC0uNzQxLDAtMS40ODEsMC0yLjI1Mi4xNy0uMDA4LjI4Ny0uMDE3LjQtLjAxNywxLjYxMSwwLDMuMjIyLjAwNiw0LjgzMy0uMDA2LjMxMywwLC40Mi4wODUuNDE3LjQxMS0uMDE0LDEuNjEtLjAxNiwzLjIyMi4wMDgsNC44MzIuMDA2LjQxNy0uMTMzLjUxOC0uNTI2LjUtLjYzNy0uMDMyLTEuMjc2LDAtMS45MTQtLjAxMS0uMzU4LS4wMDctLjQ3OS4xNDctLjQ2NC41LjAyOS42NTEuMDI1LDEuMy4wMzUsMS45NTUuMDA1LjMyMi0uMTc0LjQwNy0uNDY3LjQtLjY2OC0uMDEzLTEuMzM4LS4wMjQtMi4wMDUsMC0uMzU1LjAxMy0uMzkzLS4xNDQtLjM4LS40MzkuMDMtLjY4Mi4wMzItMS4zNjYuMDQxLTIuMDQ5LDAtLjEzMi0uMDE5LS4yNjYtLjAzLS40LS44NzgsMC0xLjcyNC0uMDEyLTIuNTY4LjAxNi0uMSwwLS4yNy4yMjEtLjI3NS4zNDQtLjAyNi42ODMtLjAyOCwxLjM2OCwwLDIuMDUxLjAxMi4zMzItLjA3Ny40NjQtLjQyNy40NTQtLjY4My0uMDIxLTEuMzY4LDAtMi4wNTEtLjAwOC0uMjg4LDAtLjQuMDk0LS40LjQsMCwuNjY4LDAsMS4zMzgtLjA1MywyLS4wMzEuNDMyLjE2MS41LjUzLjQ5NCwxLjY3MS0uMDIxLDMuMzQzLS4wMjEsNS4wMTQtLjAyOGguMjczVjUzLjAxaDEuODU5YzEuMTI0LDAsMi4yNDktLjAxMywzLjM3MywwLC4zMzIsMCwuNDU2LS4wODcuNDQ0LS40MzgtLjAyNC0uNjgzLS4wMS0xLjM2OC4wMDctMi4wNTEuMDA4LS4zLS4xLS4zOS0uNC0uMzc1LS43MTIuMDM1LTEuNDI3LjA0Mi0yLjE0LjAzLS4xMjcsMC0uMzU5LS4xNDEtLjM2MS0uMjIyLS4wMjctLjg1OS0uMDE3LTEuNzItLjAxNy0yLjYsMS4xNCwwLDIuMTY5LDAsMy4yLDAsLjcyOSwwLDEuNDU5LjAwNiwyLjE4OC0uMDE1LjI3NS0uMDA4LjM4LjA3Mi4zOC4zNTVxMCwyLjUyOS4wMTMsNS4wNTljMCwuMzEyLS4yMTIuMjg0LS40MDYuMjg1LS43ODksMC0xLjU3NywwLTIuNDY1LDAsMCwuNTIzLDAsMS4wNjIsMCwxLjYtLjAxMSwxLjI3Ny0uMDEzLDEuMjc3LTEuMjY5LDEuMjc3SDI4LjY3M2MwLDEsMCwxLjk2NCwwLDIuOTNIMjUuNzY3YzAsLjg2Ny0uMDA2LDEuNzExLjAxLDIuNTU0YS4zMTcuMzE3LDAsMCwwLC4yMjkuMjA2Yy44NzIuMDE1LDEuNzQ1LjAxLDIuNjUxLjAxVjU4LjgzNmMxLjc3NC0uMDIzLDMuNTQ4LS4wNDIsNS4zMjEtLjA3My4yOTMtLjAwNS40NDkuMDUyLjQzOS40LS4wMjEuNy0uMDEyLDEuNCwwLDIuMDkzLjAwNS4yOTMtLjEwNy40MDYtLjQuNC0uNzg3LS4wMTItMS41NzQsMC0yLjQ0MSwwVjYzLjRjMCwxLjA3LDAsMS4wNjYtMS4wODgsMS4wNjEtLjUzMSwwLTEuMDYxLjAxNC0xLjU5Mi4wMjRhMi4zMzMsMi4zMzMsMCwwLDAtLjI0Mi4wMzZ2Mi44bC4wMDktLjAxYy0xLjczMS4wMDYtMy40NjMsMC01LjE5NC4wMjYtLjM3NS4wMDYtLjUtLjA3Ny0uNS0uNDcyLjAxOC0xLjU2NS4wMDYtMy4xMy0uMDA4LTQuNjk0LS4wMDYtLjU5My0uMDcxLS42LS42MDUtLjU3MS0xLjU2MS4wNy0zLjEyOC4wMTgtNC42OTMuMDI1LS4zMiwwLS40MTQtLjEyNy0uNDA1LS40MzkuMDIxLS43NTcuMDA3LTEuNTE1LjAwNy0yLjM1LjMyMS0uMDIzLjYyOS0uMDY1LjkzNy0uMDY1LDIuMzg1LDAsNC43NzEuMDA3LDcuMTU1LjAzNy4zNTYsMCwuNDU2LS4xMS40NTQtLjQzMS0uMDA3LS44LDAtMS42LDAtMi40MzItLjIyOS0uMDE0LS4zNjEtLjAzLS40OTMtLjAzLTIuNTIyLDAtNS4wNDUuMDA2LTcuNTY3LS4wMDgtLjM3MywwLS41MDcuMDg4LS40ODMuNDgzLjAzOC42MzYuMDE2LDEuMjc0LjAxNCwxLjkxMiwwLC4zNzgtLjE5NC41MzktLjU3NC41MzMtLjc0LS4wMTItMS40ODIsMC0yLjI3OSwwdjIuOGMtLjYyOCwwLTEuMiwwLTEuNzcyLDAtMS4xODUsMC0yLjM3LS4wMTQtMy41NTUtLjAxMy0uMzI1LDAtLjQzMS0uMTA2LS40MjMtLjQ1OC4wMzEtMS41MTkuMDI3LTMuMDM4LjAxOS00LjU1OGE0LjAwOCw0LjAwOCwwLDAsMC0uMTMxLS43MWgyLjkxNVY1MC4xODZjLS43MjksMC0xLjQyNSwwLTIuMTIxLDAtLjcxNSwwLS43MDctLjAwOC0uNzE0LjcyNi0uMDE4LDEuNjY2LS4wNDQsMy4zMzItLjA2Niw1SDUuODU4Yy0uMDE1LjIxNS0uMDM5LjM5Mi0uMDM4LjU2OC4wMTEsMS41OC4wMjEsMy4xNjEuMDQ2LDQuNzQxLjAwNS4zMDktLjA4My40NDMtLjQxMS40MzUtLjctLjAxOC0xLjQtLjAxNC0yLjEtLjAwNi0uMjU2LDAtLjQtLjA2Ny0uNC0uMzU1LjAwNS0xLjc3NCwwLTMuNTQ4LDAtNS4zNjguODQ2LDAsMS42MzMtLjAxNiwyLjQxOS4wMDcuMzUyLjAxLjQ5LS4wODguNDc5LS40NTgtLjAyMi0uOC0uMDA3LTEuNi0uMDA3LTIuNDI3LS44MzksMC0xLjYzOS0uMDI2LTIuNDM2LjAxMi0uMzcxLjAxOC0uNDc5LS4wNzUtLjQ2Ny0uNDQyLjAyNC0uOC4wMDctMS42LjAwNy0yLjQzN0guMTMyYzAtLjg2Ni0uMDExLTEuNy4wMTQtMi41MjcsMC0uMS4xOTEtLjI1MS4zMTQtLjI3NmEzLjQyOCwzLjQyOCwwLDAsMSwuNjgxLS4wMTNjNC4yNywwLDguNTQsMCwxMi44MS0uMDE1LjQsMCwuNDk0LjEzNC40ODYuNS0uMDE5Ljc3Mi0uMDA2LDEuNTQ1LS4wMDYsMi4zNDdoMi43NjJ2Mi43NjlhMi41NjgsMi41NjgsMCwwLDAsLjM2MS4wNjJjMS42NTYuMDEyLDMuMzEyLjAxNyw0Ljk2OC4wMzIuMzI0LDAsLjUtLjA2Ni40ODYtLjQ1Ny0uMDM0LS43NDMtLjAxNy0xLjQ4OC0uMDI2LTIuMjMzYTEuMSwxLjEsMCwwLDAtLjA1Ni0uMjI5SDE3LjI2OWMwLS44NzksMC0xLjcsMC0yLjUxNCwwLS4zMzYuMjY1LS4yNjYuNDY3LS4yNjZxMy4xOTEsMCw2LjM4My4wMTNjLjUyOCwwLDEuMDU3LDAsMS42MzksMHYtMi44NWMtLjg1MSwwLTEuNjM3LS4wMTctMi40MjIuMDA4LS4zNDIuMDEtLjQzMi0uMDgzLS40MjUtLjQzMy4wMjktMS40NzQuMDIyLTIuOTQ4LjAyOC00LjQyMiwwLS4yODQsMC0uNTY3LDAtLjkyNGgyLjc2NGwtLjAwOC0uMDA3bTUuODczLDNjMCwuNzgxLjAyMiwxLjU1MS0uMDEsMi4zMTgtLjAxNS4zNTguMTI1LjQ1MS40MzkuNDQ4LjY1Mi0uMDA4LDEuMy0uMDI3LDEuOTU1LDAsLjMxNy4wMTUuNDE1LS4xMi40MTUtLjM4NCwwLS43MjcsMC0xLjQ1NS0uMDM2LTIuMTgxYS40NTguNDU4LDAsMCwwLS4zMzEtLjNjLS43ODYuMDA4LTEuNTcuMDU2LTIuNDMyLjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0wLjA4MiAtMjQuNTMyKSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTciIGRhdGEtbmFtZT0iUGF0aCA1MTE3IiBkPSJNMTI4LjkwNiwyMC4wM0gxMDguOTU3Vi4xNGgxOS45NDlabS0yLjg1LTIuOFYyLjk3OUgxMTEuODM3YTEuMDg0LDEuMDg0LDAsMCwwLS4wMzYuMTc1cTAsNi44MzQtLjAwNywxMy42NjljMCwuMy4xMzEuNDExLjQwOC40MDcuMTM3LDAsLjI3NC4wMDYuNDEuMDA2bDEwLjcwNy0uMDFoMi43MzciIHRyYW5zZm9ybT0idHJhbnNsYXRlKC02OC45OTcgLTAuMDg5KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTgiIGRhdGEtbmFtZT0iUGF0aCA1MTE4IiBkPSJNMCwuMDQ1Qy4xODMuMDM2LjMxNy4wMjUuNDUxLjAyNVExMCwuMDE1LDE5LjU0OSwwYy4zMjgsMCwuNDQ1LjA1Mi40NDUuNDE0cS0uMDA2LDkuMzIxLjAxNiwxOC42NDNjMCwuOTM2LDAsLjkzLS45MjkuOTNMLjgsMTkuOTc2Yy0uNzUxLDAtLjc0LS4wMDUtLjc0Mi0uNzQzUS4wMzQsMTAuMzkyLDAsMS41NTFDMCwxLjA2NiwwLC41ODIsMCwuMDQ1TTE3LjE2NCwxNy4xNjZjMC0uNDA2LDAtLjczNywwLTEuMDY4LS4wMTQtNC4yMjQtLjAzNi04LjQ0Ny0uMDMxLTEyLjY3MSwwLS40NTEtLjA5MS0uNi0uNTY4LS41OTQtNC4zNjEuMDIxLTguNzIxLjAxNi0xMy4wODIuMDE4LS42MywwLS42MzIsMC0uNjMxLjYzOXEuMDA4LDYuMzU4LjAxNSwxMi43MTdjMCwuOTI4LS4wMTQuOTI1LjkxLjkyN2wxMS4xMjEuMDMxYy43MjgsMCwxLjQ1NSwwLDIuMjY2LDAiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMC4wMDEpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTExOSIgZGF0YS1uYW1lPSJQYXRoIDUxMTkiIGQ9Ik0uMjc2LDEyOC44MjNjMC0uMjQsMC0uNDgsMC0uNzIxcS0uMDIyLTkuMy0uMDQ0LTE4LjU5MWMwLS42MTgsMC0uNjE0LjYxOC0uNjE0cTguOTMxLjAwNywxNy44NjIuMDFjLjIsMCwuMzk1LDAsLjU5Mi0uMDA4LjkwNy0uMDE4LjkxMi0uMDE4LjkxMy45MTVxLjAwOCw5LjIyNy4wMTEsMTguNDU1di41NTRabTE3LjExNi0xNy4xMTJjLS44OSwwLTEuNzM2LDAtMi41ODIsMC0zLjcyMS4wMDktNy40NDMuMDI4LTExLjE2NC4wMTgtLjQ1NCwwLS41NTYuMTQ1LS41NTUuNTY2cS4wMTcsNi42NzcsMCwxMy4zNTNjMCwuMzYxLjE2Ny4zOC40NDcuMzc5cTYuNTYzLS4wMSwxMy4xMjUtLjAxYy4yMzgsMCwuNDc1LS4wMjEuNzMtLjAzM1oiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0wLjE0NyAtNjguOTU4KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjAiIGRhdGEtbmFtZT0iUGF0aCA1MTIwIiBkPSJNNjguMTc4LDExNi42N2gyLjljMCwxLjk1MywwLDMuODU3LDAsNS43NjJsLjAxMi0uMDE0SDY4LjIxMmMwLC43NzgtLjAwOSwxLjUxNywwLDIuMjU2LjAwOS41NjcuMDIuNTc0LS41NjguNTgtLjYwNy4wMDYtMS4yMTUuMDI1LTEuODE5LS4wMi0uMzg2LS4wMjktLjQ2OS4xMTgtLjQ2OC40NTcuMDA4LDIuMDY0LDAsNC4xMjksMCw2LjE5NCwwLC41LjAyLDEsMCwxLjUtLjAwNi4xMjctLjEzNy4zNTMtLjIxNi4zNTYtLjg1OC4wMjYtMS43MTcuMDE2LTIuNi4wMTZ2LTE0LjI0aDUuNjQyVjExNi42NmwtLjAwOS4wMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTM5LjYwNyAtNzMuODc1KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjEiIGRhdGEtbmFtZT0iUGF0aCA1MTIxIiBkPSJNNjguMDA2LDguNjEyVjUuOGMtLjE2MS0uMDE0LS4yNzUtLjAzMi0uMzg5LS4wMzItMS42MjUsMC0zLjI1LS4wMDctNC44NzYuMDE1LS4zODguMDA1LS41NDItLjA4MS0uNTEzLS41YTExLjc1MywxMS43NTMsMCwwLDAsMC0xLjc3NWMtLjAzOC0uNDUuMS0uNTg2LjU0MS0uNTc2LDEuNDEyLjAzMiwyLjgyNC4wMzYsNC4yMzcuMDQ5LjMsMCwuNiwwLC45NTMsMFYuMTI4aDIuODMzYzAsMS43MjMuMDE0LDMuNDM0LS4wMSw1LjE0NC0uMDA2LjQyMy4wODkuNTUxLjUzMS41MjEuNzcxLS4wNTMsMS41NDctLjAyNiwyLjMyMS0uMDMzbC0uMDA5LS4wMWMuMDA5LDEuOC4wMjIsMy42LjAxOCw1LjQwNywwLC4xMDktLjEzNS4zMDktLjIxMi4zMTEtLjg1Ny4wMjItMS43MTUuMDE0LTIuNTcyLjAxNCwwLS44OTEtLjAxNS0xLjY3My4wMDctMi40NTUuMDEtLjMzLS4wNy0uNDYtLjQyNS0uNDQ3LS44MTYuMDI3LTEuNjMzLjAxNS0yLjQ1LjAybC4wMTUuMDEzIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzkuNDAyIC0wLjA4MSkiIGZpbGw9IiNhZWM3MzciLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTIyIiBkYXRhLW5hbWU9IlBhdGggNTEyMiIgZD0iTTY4LjAyLDIzLjIyNXY1LjY5SDY1LjA0NmwuMDA4LjAwN3EwLTEuNDIzLDAtMi44NDlINjIuMjdjMC0uODc4LS4wMTgtMS43MjEuMDI0LTIuNTYxLjAwNS0uMS4zMzMtLjI2Ny41MTQtLjI3LDEuMTUyLS4wMjEsMi4zLDAsMy40NTcsMCwuNTg5LDAsMS4xNzksMCwxLjc2OSwwbC0uMDE0LS4wMTIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zOS40MyAtMTQuNzA3KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjMiIGRhdGEtbmFtZT0iUGF0aCA1MTIzIiBkPSJNOTMuMzI0LDUuNzU4Vi4xMjdoMi44MzVBLjk2MS45NjEsMCwwLDEsOTYuMi4zMzNxMCwyLjQzOCwwLDQuODc2YzAsLjU4Ny0uMDI2LjYtLjYxOS41OC0uNzU3LS4wMjItMS41MTYtLjAyOC0yLjI3My0uMDQxbC4wMDkuMDEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01OS4wOTIgLTAuMDgpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyNCIgZGF0YS1uYW1lPSJQYXRoIDUxMjQiIGQ9Ik0xNDguMTA2LDE1OC4yOGMwLS44MjIsMC0xLjYzOCwwLTIuNDU0LDAtLjIzNC4wODMtLjM0LjM1Ny0uMzMuNzExLjAyNywxLjQyMy4wMjEsMi4xMzQuMDA4LjI2LS4wMDUuNC4wNTEuMzkxLjM0NC0uMDE4Ljc0Mi0uMDEsMS40ODQtLjAzOCwyLjIyNSwwLC4xMDYtLjE1My4yOTQtLjIzNi4yOTUtLjgzMS4wMDktMS42NjItLjAxMi0yLjQ5My0uMDMtLjA0LDAtLjA3OS0uMDM5LS4xMTYtLjA1OCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTkzLjc4OSAtOTguNDY4KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjUiIGRhdGEtbmFtZT0iUGF0aCA1MTI1IiBkPSJNMTE5LjY0NCw2NS4wNTJjLS44NzcuMDEzLTEuNzU0LjAzNi0yLjYzLjAyOGEuNDA3LjQwNywwLDAsMS0uMy0uMjYyYy0uMDIzLS44My0uMDE0LTEuNjYxLS4wMTQtMi41NTIuNjE4LDAsMS4yLDAsMS43ODYsMCwxLjEyOSwwLDEuMTI4LS4wMDYsMS4xMywxLjExOSwwLC41Ni4wMDcsMS4xMi4wMTEsMS42OGwuMDE0LS4wMTIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC03My45MDEgLTM5LjQyOSkiIGZpbGw9IiNhZWM3MzciLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTI3IiBkYXRhLW5hbWU9IlBhdGggNTEyNyIgZD0iTTExMS45MzIsMTI3LjM2OWgtMi43MTh2LTIuOTEyaDIuNzA4cTAsMS40NjIsMCwyLjkyM2wuMDEtLjAxMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTY5LjE2IC03OC44MTMpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyOCIgZGF0YS1uYW1lPSJQYXRoIDUxMjgiIGQ9Ik0xMjQuNzE5LDE1LjYzMWg4LjQyNmEuMzA3LjMwNywwLDAsMSwuMDQ3LjExMWMuMDEzLDIuNi4wMjksNS4yLjAzLDcuNzkzLDAsLjYyLS4wMjIuNjEyLS42MzIuNjExcS0zLjczOCwwLTcuNDc1LDBoLS40WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTc4Ljk3OSAtOS44OTgpIiBmaWxsPSIjMWExODE4Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyOSIgZGF0YS1uYW1lPSJQYXRoIDUxMjkiIGQ9Ik0yNC4yNTIsMjQuMDMzSDE1LjY0NVYxNS41NmE1Ljc1Myw1Ljc1MywwLDAsMSwuNTk0LS4wNTljMi40NDUtLjAwNiw0Ljg5LDAsNy4zMzUtLjAxNS40NTMsMCwuNjU2LjEyMS42NTQuNjEzLS4wMDcsMi4zNjkuMDEzLDQuNzM4LjAyMyw3LjEwNywwLC4yNTcsMCwuNTE1LDAsLjgyNyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTkuOTA3IC05LjgwNikiLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTMwIiBkYXRhLW5hbWU9IlBhdGggNTEzMCIgZD0iTTI0LjMxLDEyNC40NzN2OC41ODRjLS42MDcsMC0xLjE5MiwwLTEuNzc3LDAtMi4wOTUtLjAwNi00LjE5LS4wMjItNi4yODUtLjAxMy0uNCwwLS40ODktLjEyMi0uNDg0LS41MjUuMDI4LTIuMzgzLjAxNy00Ljc2Ny4wMTktNy4xNSwwLS4yODcsMC0uNTc0LDAtLjlaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtOS45ODIgLTc4LjgyMykiIGZpbGw9IiMxYTE4MTgiLz4NCiAgICAgICAgPC9nPg0KICAgICAgPC9nPg0KICAgIDwvZz4NCiAgPC9nPg0KPC9zdmc+DQo='
            } else if (Docrotation == 90) {
                Qrcode =
                    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1OS45MDIiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA1OS45MDIgNjAiPg0KICA8ZyBpZD0iUmlnaHQiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDU5LjkwMikgcm90YXRlKDkwKSI+DQogICAgPGcgaWQ9Ikdyb3VwXzM0MzMiIGRhdGEtbmFtZT0iR3JvdXAgMzQzMyI+DQogICAgICA8ZyBpZD0iR3JvdXBfMzQwNSIgZGF0YS1uYW1lPSJHcm91cCAzNDA1Ij4NCiAgICAgICAgPGcgaWQ9Ikdyb3VwXzM0MzQiIGRhdGEtbmFtZT0iR3JvdXAgMzQzNCI+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTExNSIgZGF0YS1uYW1lPSJQYXRoIDUxMTUiIGQ9Ik0xMDAuMDc1LDY1LjAxMmgyLjg1OVY2Mi45NDljMC0uNzE0LDAtLjcxLjY5LS43MTkuNTc3LS4wMDcsMS4xNTUtLjAxLDEuNzMxLS4wNDUuMy0uMDE5LjQyNC4wOTIuNDE5LjM3OS0uMDEzLjY2NywwLDEuMzM3LS4wNDgsMi0uMDI3LjM4NS4wODYuNTE5LjQ3LjUuNjY3LS4wMjcsMS4zMzctLjAzNiwyLS4wMTguMzIyLjAwOC40MzEtLjEuNDItLjQxNC0uMDIyLS42NjctLjAwNy0xLjMzNi0uMDMyLTItLjAxMi0uMzM5LjExMS0uNDU4LjQ1LS40NDcuNjY4LjAyMSwxLjMzNy4wMjUsMiwwLC4zMTktLjAxMS40MzUuMDg1LjQyMS40MDktLjAyOS42NjctLjAxNCwxLjMzNy0uMDQ3LDItLjAxNS4zLjA0LjQ1OC4zOC40NTIuOC0uMDEzLDEuNjA5LDAsMi40NjUsMHYyLjgxNGgtLjU4Yy0uNjIzLDAtMS4yNDctLjAxMy0xLjg2OC4wMTYtLjEyMy4wMDUtLjMzOC4xNzItLjM0MS4yNy0uMDI3Ljg0OC0uMDE2LDEuNy0uMDE2LDIuNmgyLjh2Mi45MzJIMTExLjQ3YzAsLjg3NSwwLDEuNzA2LDAsMi41MzYsMCwuMy4yMjQuMjcyLjQyMS4yNy42NjktLjAwOCwxLjMzOCwwLDItLjAzMy4zMzctLjAxNi40NjIuMDg2LjQ0OS40MzItLjAyNi42NjctLjAzMywxLjMzNi0uMDEyLDIsLjAxMS4zNDgtLjExNy40NTMtLjQ0Ny40NDYtLjY4My0uMDE1LTEuMzY4LS4wMTUtMi4wNS4wMS0uMTExLDAtLjMwOC4xNi0uMzEuMjUtLjAyNC44MzMtLjAxNCwxLjY2Ni0uMDE0LDIuNTUyaDIuNzgxVjg3Ljg4aC01LjY1YzAtLjgxOC0uMDE5LTEuNjE4LjAwOC0yLjQxNy4wMTMtLjM5MS0uMTMzLS40OTEtLjUtLjQ3OS0uNzU3LjAyNC0xLjUxNi4wMDctMi4zMy4wMDcsMC0uOTUzLDAtMS44ODcsMC0yLjgyaDIuODE3YzAtLjkuMDA4LTEuNzY2LS4wMTQtMi42MjYsMC0uMDc3LS4yLS4yMDktLjMxLS4yMTNxLTEuMTE1LS4wMzktMi4yMzEtLjAyMWMtLjEsMC0uMjc0LjEyOS0uMjc1LjItLjAwNy44OTEuMDEyLDEuNzgyLjAyNSwyLjY3MkgxMDNWODcuOWgyLjc3NWMwLC45Mi4wMTEsMS43OTQtLjAxNywyLjY2NiwwLC4wOTEtLjI0Ni4yNS0uMzc3LjI0OS0yLjQxNS0uMDA3LTQuODMtLjAzOS03LjI0NC0uMDU0LS45MjktLjAwNi0uOTQ4LjAyNS0uOTI1LjkzNC4wMTMuNS4wMTgsMSwuMDQ1LDEuNS4wMTYuMjkzLS4wODcuNDA4LS4zODguNC0uOC0uMDE0LTEuNjA1LDAtMi41LDAsMCwuOTMyLS4wMDcsMS43OTMuMDEyLDIuNjUzLDAsLjA3NC4xNzMuMjA2LjI2Ny4yMDYsMS42ODYsMCwzLjM3My0uMDE4LDUuMDU5LS4wMjguMjY1LDAsLjM3MS0uMTA2LjM2My0uMzg2LS4wMTgtLjY1My4wMTItMS4zMDctLjAxMi0xLjk2LS4wMTQtLjM2NS4wODQtLjUxMi40NzctLjUxLDIuNTgzLjAxMSw1LjE2NiwwLDcuNzQ5LDAsLjI1MSwwLC4zNjIuMDc2LjM2MS4zMzUsMCwuNy0uMDA2LDEuNC4wMTMsMi4xLjAxLjM2Ny0uMTU0LjQ2LS41LjQ1OS0yLjYtLjAxLTUuMiwwLTcuOCwwLS4wNzUsMC0uMTUuMDA3LS4yNzYuMDEzdjIuNzYzSDg1Ljg2OHYtMi44SDg4Yy43MjIsMCwuNzE4LDAsLjcwOC0uNzExLS4wMDgtLjU5Mi0uMDI3LTEuMTg2LDAtMS43NzcuMDE2LS4zMy0uMTA5LS4zNjktLjM5NS0uMzYyLS44LjAyLTEuNjA3LjAwNy0yLjQ4MS4wMDcsMC0xLjkxNywwLTMuNzkyLDAtNS42NjhsLS4wMTMuMDE1SDg4LjdWODQuOTkzYy43OSwwLDEuNTE1LS4wMzIsMi4yMzUuMDExLjQ3OS4wMjguNi0uMTQuNTc3LS41OTEtLjAyOC0uNTkuMDA5LTEuMTg0LjAzNi0xLjc3NS4wMTUtLjMzNy0uMDcxLS41LS40NTctLjQ3OC0uNjgyLjAzMi0xLjM2Ny4wMDUtMi4wNS4wMDgtLjMsMC0uNDIyLS4wODEtLjM5NC0uNDMxYTE4Ljk0NCwxOC45NDQsMCwwLDAsLjAzMi0xLjk1M2MtLjAwNy0uMzIxLjA1OS0uNDY0LjQyMS0uNDYxLDEuNzE1LjAxNiwzLjQzLjAwNyw1LjIxNC4wMDdWODQuOTljLS44MywwLTEuNjE3LjAxNS0yLjQtLjAwNy0uMzI2LS4wMDktLjQyNC4xMDgtLjQxNy40MTguMDE2LjY2OC0uMDE1LDEuMzM4LjAxNywyLC4wMi40MTctLjE0My41MjMtLjUzLjUwOS0uNzI3LS4wMjUtMS40NTUtLjAwNy0yLjI1LS4wMDd2Mi44NDRjLjIyNywwLC40OTQsMCwuNzYxLDAsMi40Ni4wMTgsNC45Mi4wNCw3LjM4LjA0NS4xMjMsMCwuMzU0LS4xMzcuMzU0LS4yMTMuMDEyLS44NDgtLjAxMS0xLjctLjAzLTIuNTQ1LDAtLjAzNi0uMDUyLS4wNy0uMDgtLjEwNmwtLjAxLjAxMWgyLjk1OXYtLjY5MmMwLTEuNTM1LjAxMy0zLjA3LS4wMS00LjYtLjAwNi0uMzc4LjEzOS0uNDc2LjQ3My0uNDczLjguMDA5LDEuNiwwLDIuNDI5LDBWNzkuMzZjLS4xNDItLjAxMS0uMjczLS4wMjktLjQtLjAyOS0xLjYyNiwwLTMuMjUyLS4wMS00Ljg3OC4wMTQtLjM4MS4wMDYtLjUwNi0uMS0uNS0uNDguMDIyLS43NzEuMDA3LTEuNTQyLjAwNy0yLjM3Ni0uODA3LDAtMS41NjMtLjAxNS0yLjMxNy4wMDYtLjM4NS4wMTEtLjU2NS0uMDQtLjUzNC0uNTE2LjA0OC0uNzU0LS4wMTUtMS41MTYtLjAzMi0yLjI3NGwtLjAxMi4wMTVjLjY3OC0uMDM0LDEuMzU3LS4wNzIsMi4wMzYtLjEuMjU1LS4wMTEuNTEyLDAsLjgyNiwwVjcwLjc4aDUuNzk1VjY3Ljg2OWgtMi44NjFWNjVabTUuNzEzLDUuNzU2Yy44NjcsMCwxLjcxNS4wMSwyLjU2Mi0uMDE0LjA5NSwwLC4yNTktLjIuMjYzLS4zMDkuMDI1LS43NDMuMDEyLTEuNDg4LjAxOC0yLjIzMSwwLS4yNTItLjEwNy0uMzQ3LS4zNi0uMzQ0LS43MjguMDExLTEuNDU2LS4wMDYtMi4xODQuMDE1LS4xLDAtLjI4NC4xNDktLjI4Ni4yMzEtLjAyMS44NjEtLjAxMywxLjcyNC0uMDEzLDIuNjUybTIuODQ4LDUuN2MwLS45LDAtMS43NSwwLTIuNiwwLS4yNTItLjEzMy0uMy0uMzUtLjI4Ny0uNzI0LjAzNC0xLjQ0OC4wNjYtMi4xNzMuMDc5LS4yNTksMC0uMzM5LjExLS4zNDEuMzU1LS4wMDcuNzEtLjA0MiwxLjQyMS0uMDM2LDIuMTMxLDAsLjEwNy4xNTkuMy4yNDkuMy44NTkuMDIzLDEuNzE4LjAxNCwyLjY0OS4wMTRtLTguNi0yLjc3M0g5Ny4yMjl2Mi43NzRoMi44MDdaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNTQuMzQ2IC0zOS4zNzcpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTExNiIgZGF0YS1uYW1lPSJQYXRoIDUxMTYiIGQ9Ik0yNS43LDM4LjczOWMuMDE0LjIzOS4wMzkuNDc5LjA0MS43MTguMDA4LDEuNTM0LjAxOCwzLjA2Ny4wMTIsNC42LDAsLjMuMDU2LjQ0OS40LjQ0LjY2OC0uMDE3LDEuMzM2LjAwOCwyLC4wMTEuMzYyLDAsLjUzNy0uMTMzLjUxNy0uNTQ2LS4wMzYtLjc0LS4wMS0xLjQ4Mi0uMDEtMi4yNjYuNzc2LDAsMS41MTQsMCwyLjI1MywwLC41ODYsMCwuNjUxLS4wNjQuNjUtLjY0NywwLS43NDEsMC0xLjQ4MSwwLTIuMjUyLjE3LS4wMDguMjg3LS4wMTcuNC0uMDE3LDEuNjExLDAsMy4yMjIuMDA2LDQuODMzLS4wMDYuMzEzLDAsLjQyLjA4NS40MTcuNDExLS4wMTQsMS42MS0uMDE2LDMuMjIyLjAwOCw0LjgzMi4wMDYuNDE3LS4xMzMuNTE4LS41MjYuNS0uNjM3LS4wMzItMS4yNzYsMC0xLjkxNC0uMDExLS4zNTgtLjAwNy0uNDc5LjE0Ny0uNDY0LjUuMDI5LjY1MS4wMjUsMS4zLjAzNSwxLjk1NS4wMDUuMzIyLS4xNzQuNDA3LS40NjcuNC0uNjY4LS4wMTMtMS4zMzgtLjAyNC0yLjAwNSwwLS4zNTUuMDEzLS4zOTMtLjE0NC0uMzgtLjQzOS4wMy0uNjgyLjAzMi0xLjM2Ni4wNDEtMi4wNDksMC0uMTMyLS4wMTktLjI2Ni0uMDMtLjQtLjg3OCwwLTEuNzI0LS4wMTItMi41NjguMDE2LS4xLDAtLjI3LjIyMS0uMjc1LjM0NC0uMDI2LjY4My0uMDI4LDEuMzY4LDAsMi4wNTEuMDEyLjMzMi0uMDc3LjQ2NC0uNDI3LjQ1NC0uNjgzLS4wMjEtMS4zNjgsMC0yLjA1MS0uMDA4LS4yODgsMC0uNC4wOTQtLjQuNCwwLC42NjgsMCwxLjMzOC0uMDUzLDItLjAzMS40MzIuMTYxLjUuNTMuNDk0LDEuNjcxLS4wMjEsMy4zNDMtLjAyMSw1LjAxNC0uMDI4aC4yNzNWNTMuMDFoMS44NTljMS4xMjQsMCwyLjI0OS0uMDEzLDMuMzczLDAsLjMzMiwwLC40NTYtLjA4Ny40NDQtLjQzOC0uMDI0LS42ODMtLjAxLTEuMzY4LjAwNy0yLjA1MS4wMDgtLjMtLjEtLjM5LS40LS4zNzUtLjcxMi4wMzUtMS40MjcuMDQyLTIuMTQuMDMtLjEyNywwLS4zNTktLjE0MS0uMzYxLS4yMjItLjAyNy0uODU5LS4wMTctMS43Mi0uMDE3LTIuNiwxLjE0LDAsMi4xNjksMCwzLjIsMCwuNzI5LDAsMS40NTkuMDA2LDIuMTg4LS4wMTUuMjc1LS4wMDguMzguMDcyLjM4LjM1NXEwLDIuNTI5LjAxMyw1LjA1OWMwLC4zMTItLjIxMi4yODQtLjQwNi4yODUtLjc4OSwwLTEuNTc3LDAtMi40NjUsMCwwLC41MjMsMCwxLjA2MiwwLDEuNi0uMDExLDEuMjc3LS4wMTMsMS4yNzctMS4yNjksMS4yNzdIMjguNjczYzAsMSwwLDEuOTY0LDAsMi45M0gyNS43NjdjMCwuODY3LS4wMDYsMS43MTEuMDEsMi41NTRhLjMxNy4zMTcsMCwwLDAsLjIyOS4yMDZjLjg3Mi4wMTUsMS43NDUuMDEsMi42NTEuMDFWNTguODM2YzEuNzc0LS4wMjMsMy41NDgtLjA0Miw1LjMyMS0uMDczLjI5My0uMDA1LjQ0OS4wNTIuNDM5LjQtLjAyMS43LS4wMTIsMS40LDAsMi4wOTMuMDA1LjI5My0uMTA3LjQwNi0uNC40LS43ODctLjAxMi0xLjU3NCwwLTIuNDQxLDBWNjMuNGMwLDEuMDcsMCwxLjA2Ni0xLjA4OCwxLjA2MS0uNTMxLDAtMS4wNjEuMDE0LTEuNTkyLjAyNGEyLjMzMywyLjMzMywwLDAsMC0uMjQyLjAzNnYyLjhsLjAwOS0uMDFjLTEuNzMxLjAwNi0zLjQ2MywwLTUuMTk0LjAyNi0uMzc1LjAwNi0uNS0uMDc3LS41LS40NzIuMDE4LTEuNTY1LjAwNi0zLjEzLS4wMDgtNC42OTQtLjAwNi0uNTkzLS4wNzEtLjYtLjYwNS0uNTcxLTEuNTYxLjA3LTMuMTI4LjAxOC00LjY5My4wMjUtLjMyLDAtLjQxNC0uMTI3LS40MDUtLjQzOS4wMjEtLjc1Ny4wMDctMS41MTUuMDA3LTIuMzUuMzIxLS4wMjMuNjI5LS4wNjUuOTM3LS4wNjUsMi4zODUsMCw0Ljc3MS4wMDcsNy4xNTUuMDM3LjM1NiwwLC40NTYtLjExLjQ1NC0uNDMxLS4wMDctLjgsMC0xLjYsMC0yLjQzMi0uMjI5LS4wMTQtLjM2MS0uMDMtLjQ5My0uMDMtMi41MjIsMC01LjA0NS4wMDYtNy41NjctLjAwOC0uMzczLDAtLjUwNy4wODgtLjQ4My40ODMuMDM4LjYzNi4wMTYsMS4yNzQuMDE0LDEuOTEyLDAsLjM3OC0uMTk0LjUzOS0uNTc0LjUzMy0uNzQtLjAxMi0xLjQ4MiwwLTIuMjc5LDB2Mi44Yy0uNjI4LDAtMS4yLDAtMS43NzIsMC0xLjE4NSwwLTIuMzctLjAxNC0zLjU1NS0uMDEzLS4zMjUsMC0uNDMxLS4xMDYtLjQyMy0uNDU4LjAzMS0xLjUxOS4wMjctMy4wMzguMDE5LTQuNTU4YTQuMDA4LDQuMDA4LDAsMCwwLS4xMzEtLjcxaDIuOTE1VjUwLjE4NmMtLjcyOSwwLTEuNDI1LDAtMi4xMjEsMC0uNzE1LDAtLjcwNy0uMDA4LS43MTQuNzI2LS4wMTgsMS42NjYtLjA0NCwzLjMzMi0uMDY2LDVINS44NThjLS4wMTUuMjE1LS4wMzkuMzkyLS4wMzguNTY4LjAxMSwxLjU4LjAyMSwzLjE2MS4wNDYsNC43NDEuMDA1LjMwOS0uMDgzLjQ0My0uNDExLjQzNS0uNy0uMDE4LTEuNC0uMDE0LTIuMS0uMDA2LS4yNTYsMC0uNC0uMDY3LS40LS4zNTUuMDA1LTEuNzc0LDAtMy41NDgsMC01LjM2OC44NDYsMCwxLjYzMy0uMDE2LDIuNDE5LjAwNy4zNTIuMDEuNDktLjA4OC40NzktLjQ1OC0uMDIyLS44LS4wMDctMS42LS4wMDctMi40MjctLjgzOSwwLTEuNjM5LS4wMjYtMi40MzYuMDEyLS4zNzEuMDE4LS40NzktLjA3NS0uNDY3LS40NDIuMDI0LS44LjAwNy0xLjYuMDA3LTIuNDM3SC4xMzJjMC0uODY2LS4wMTEtMS43LjAxNC0yLjUyNywwLS4xLjE5MS0uMjUxLjMxNC0uMjc2YTMuNDI4LDMuNDI4LDAsMCwxLC42ODEtLjAxM2M0LjI3LDAsOC41NCwwLDEyLjgxLS4wMTUuNCwwLC40OTQuMTM0LjQ4Ni41LS4wMTkuNzcyLS4wMDYsMS41NDUtLjAwNiwyLjM0N2gyLjc2MnYyLjc2OWEyLjU2OCwyLjU2OCwwLDAsMCwuMzYxLjA2MmMxLjY1Ni4wMTIsMy4zMTIuMDE3LDQuOTY4LjAzMi4zMjQsMCwuNS0uMDY2LjQ4Ni0uNDU3LS4wMzQtLjc0My0uMDE3LTEuNDg4LS4wMjYtMi4yMzNhMS4xLDEuMSwwLDAsMC0uMDU2LS4yMjlIMTcuMjY5YzAtLjg3OSwwLTEuNywwLTIuNTE0LDAtLjMzNi4yNjUtLjI2Ni40NjctLjI2NnEzLjE5MSwwLDYuMzgzLjAxM2MuNTI4LDAsMS4wNTcsMCwxLjYzOSwwdi0yLjg1Yy0uODUxLDAtMS42MzctLjAxNy0yLjQyMi4wMDgtLjM0Mi4wMS0uNDMyLS4wODMtLjQyNS0uNDMzLjAyOS0xLjQ3NC4wMjItMi45NDguMDI4LTQuNDIyLDAtLjI4NCwwLS41NjcsMC0uOTI0aDIuNzY0bC0uMDA4LS4wMDdtNS44NzMsM2MwLC43ODEuMDIyLDEuNTUxLS4wMSwyLjMxOC0uMDE1LjM1OC4xMjUuNDUxLjQzOS40NDguNjUyLS4wMDgsMS4zLS4wMjcsMS45NTUsMCwuMzE3LjAxNS40MTUtLjEyLjQxNS0uMzg0LDAtLjcyNywwLTEuNDU1LS4wMzYtMi4xODFhLjQ1OC40NTgsMCwwLDAtLjMzMS0uM2MtLjc4Ni4wMDgtMS41Ny4wNTYtMi40MzIuMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTAuMDgyIC0yNC41MzIpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTExNyIgZGF0YS1uYW1lPSJQYXRoIDUxMTciIGQ9Ik0xMjguOTA2LDIwLjAzSDEwOC45NTdWLjE0aDE5Ljk0OVptLTIuODUtMi44VjIuOTc5SDExMS44MzdhMS4wODQsMS4wODQsMCwwLDAtLjAzNi4xNzVxMCw2LjgzNC0uMDA3LDEzLjY2OWMwLC4zLjEzMS40MTEuNDA4LjQwNy4xMzcsMCwuMjc0LjAwNi40MS4wMDZsMTAuNzA3LS4wMWgyLjczNyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTY4Ljk5NyAtMC4wODkpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTExOCIgZGF0YS1uYW1lPSJQYXRoIDUxMTgiIGQ9Ik0wLC4wNDVDLjE4My4wMzYuMzE3LjAyNS40NTEuMDI1UTEwLC4wMTUsMTkuNTQ5LDBjLjMyOCwwLC40NDUuMDUyLjQ0NS40MTRxLS4wMDYsOS4zMjEuMDE2LDE4LjY0M2MwLC45MzYsMCwuOTMtLjkyOS45M0wuOCwxOS45NzZjLS43NTEsMC0uNzQtLjAwNS0uNzQyLS43NDNRLjAzNCwxMC4zOTIsMCwxLjU1MUMwLDEuMDY2LDAsLjU4MiwwLC4wNDVNMTcuMTY0LDE3LjE2NmMwLS40MDYsMC0uNzM3LDAtMS4wNjgtLjAxNC00LjIyNC0uMDM2LTguNDQ3LS4wMzEtMTIuNjcxLDAtLjQ1MS0uMDkxLS42LS41NjgtLjU5NC00LjM2MS4wMjEtOC43MjEuMDE2LTEzLjA4Mi4wMTgtLjYzLDAtLjYzMiwwLS42MzEuNjM5cS4wMDgsNi4zNTguMDE1LDEyLjcxN2MwLC45MjgtLjAxNC45MjUuOTEuOTI3bDExLjEyMS4wMzFjLjcyOCwwLDEuNDU1LDAsMi4yNjYsMCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAwLjAwMSkiIGZpbGw9IiNhZWM3MzciLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTE5IiBkYXRhLW5hbWU9IlBhdGggNTExOSIgZD0iTS4yNzYsMTI4LjgyM2MwLS4yNCwwLS40OCwwLS43MjFxLS4wMjItOS4zLS4wNDQtMTguNTkxYzAtLjYxOCwwLS42MTQuNjE4LS42MTRxOC45MzEuMDA3LDE3Ljg2Mi4wMWMuMiwwLC4zOTUsMCwuNTkyLS4wMDguOTA3LS4wMTguOTEyLS4wMTguOTEzLjkxNXEuMDA4LDkuMjI3LjAxMSwxOC40NTV2LjU1NFptMTcuMTE2LTE3LjExMmMtLjg5LDAtMS43MzYsMC0yLjU4MiwwLTMuNzIxLjAwOS03LjQ0My4wMjgtMTEuMTY0LjAxOC0uNDU0LDAtLjU1Ni4xNDUtLjU1NS41NjZxLjAxNyw2LjY3NywwLDEzLjM1M2MwLC4zNjEuMTY3LjM4LjQ0Ny4zNzlxNi41NjMtLjAxLDEzLjEyNS0uMDFjLjIzOCwwLC40NzUtLjAyMS43My0uMDMzWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTAuMTQ3IC02OC45NTgpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyMCIgZGF0YS1uYW1lPSJQYXRoIDUxMjAiIGQ9Ik02OC4xNzgsMTE2LjY3aDIuOWMwLDEuOTUzLDAsMy44NTcsMCw1Ljc2MmwuMDEyLS4wMTRINjguMjEyYzAsLjc3OC0uMDA5LDEuNTE3LDAsMi4yNTYuMDA5LjU2Ny4wMi41NzQtLjU2OC41OC0uNjA3LjAwNi0xLjIxNS4wMjUtMS44MTktLjAyLS4zODYtLjAyOS0uNDY5LjExOC0uNDY4LjQ1Ny4wMDgsMi4wNjQsMCw0LjEyOSwwLDYuMTk0LDAsLjUuMDIsMSwwLDEuNS0uMDA2LjEyNy0uMTM3LjM1My0uMjE2LjM1Ni0uODU4LjAyNi0xLjcxNy4wMTYtMi42LjAxNnYtMTQuMjRoNS42NDJWMTE2LjY2bC0uMDA5LjAxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzkuNjA3IC03My44NzUpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyMSIgZGF0YS1uYW1lPSJQYXRoIDUxMjEiIGQ9Ik02OC4wMDYsOC42MTJWNS44Yy0uMTYxLS4wMTQtLjI3NS0uMDMyLS4zODktLjAzMi0xLjYyNSwwLTMuMjUtLjAwNy00Ljg3Ni4wMTUtLjM4OC4wMDUtLjU0Mi0uMDgxLS41MTMtLjVhMTEuNzUzLDExLjc1MywwLDAsMCwwLTEuNzc1Yy0uMDM4LS40NS4xLS41ODYuNTQxLS41NzYsMS40MTIuMDMyLDIuODI0LjAzNiw0LjIzNy4wNDkuMywwLC42LDAsLjk1MywwVi4xMjhoMi44MzNjMCwxLjcyMy4wMTQsMy40MzQtLjAxLDUuMTQ0LS4wMDYuNDIzLjA4OS41NTEuNTMxLjUyMS43NzEtLjA1MywxLjU0Ny0uMDI2LDIuMzIxLS4wMzNsLS4wMDktLjAxYy4wMDksMS44LjAyMiwzLjYuMDE4LDUuNDA3LDAsLjEwOS0uMTM1LjMwOS0uMjEyLjMxMS0uODU3LjAyMi0xLjcxNS4wMTQtMi41NzIuMDE0LDAtLjg5MS0uMDE1LTEuNjczLjAwNy0yLjQ1NS4wMS0uMzMtLjA3LS40Ni0uNDI1LS40NDctLjgxNi4wMjctMS42MzMuMDE1LTIuNDUuMDJsLjAxNS4wMTMiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zOS40MDIgLTAuMDgxKSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjIiIGRhdGEtbmFtZT0iUGF0aCA1MTIyIiBkPSJNNjguMDIsMjMuMjI1djUuNjlINjUuMDQ2bC4wMDguMDA3cTAtMS40MjMsMC0yLjg0OUg2Mi4yN2MwLS44NzgtLjAxOC0xLjcyMS4wMjQtMi41NjEuMDA1LS4xLjMzMy0uMjY3LjUxNC0uMjcsMS4xNTItLjAyMSwyLjMsMCwzLjQ1NywwLC41ODksMCwxLjE3OSwwLDEuNzY5LDBsLS4wMTQtLjAxMiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTM5LjQzIC0xNC43MDcpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyMyIgZGF0YS1uYW1lPSJQYXRoIDUxMjMiIGQ9Ik05My4zMjQsNS43NThWLjEyN2gyLjgzNUEuOTYxLjk2MSwwLDAsMSw5Ni4yLjMzM3EwLDIuNDM4LDAsNC44NzZjMCwuNTg3LS4wMjYuNi0uNjE5LjU4LS43NTctLjAyMi0xLjUxNi0uMDI4LTIuMjczLS4wNDFsLjAwOS4wMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTU5LjA5MiAtMC4wOCkiIGZpbGw9IiNhZWM3MzciLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTI0IiBkYXRhLW5hbWU9IlBhdGggNTEyNCIgZD0iTTE0OC4xMDYsMTU4LjI4YzAtLjgyMiwwLTEuNjM4LDAtMi40NTQsMC0uMjM0LjA4My0uMzQuMzU3LS4zMy43MTEuMDI3LDEuNDIzLjAyMSwyLjEzNC4wMDguMjYtLjAwNS40LjA1MS4zOTEuMzQ0LS4wMTguNzQyLS4wMSwxLjQ4NC0uMDM4LDIuMjI1LDAsLjEwNi0uMTUzLjI5NC0uMjM2LjI5NS0uODMxLjAwOS0xLjY2Mi0uMDEyLTIuNDkzLS4wMy0uMDQsMC0uMDc5LS4wMzktLjExNi0uMDU4IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtOTMuNzg5IC05OC40NjgpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyNSIgZGF0YS1uYW1lPSJQYXRoIDUxMjUiIGQ9Ik0xMTkuNjQ0LDY1LjA1MmMtLjg3Ny4wMTMtMS43NTQuMDM2LTIuNjMuMDI4YS40MDcuNDA3LDAsMCwxLS4zLS4yNjJjLS4wMjMtLjgzLS4wMTQtMS42NjEtLjAxNC0yLjU1Mi42MTgsMCwxLjIsMCwxLjc4NiwwLDEuMTI5LDAsMS4xMjgtLjAwNiwxLjEzLDEuMTE5LDAsLjU2LjAwNywxLjEyLjAxMSwxLjY4bC4wMTQtLjAxMiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTczLjkwMSAtMzkuNDI5KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjciIGRhdGEtbmFtZT0iUGF0aCA1MTI3IiBkPSJNMTExLjkzMiwxMjcuMzY5aC0yLjcxOHYtMi45MTJoMi43MDhxMCwxLjQ2MiwwLDIuOTIzbC4wMS0uMDExIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNjkuMTYgLTc4LjgxMykiIGZpbGw9IiNhZWM3MzciLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTI4IiBkYXRhLW5hbWU9IlBhdGggNTEyOCIgZD0iTTEyNC43MTksMTUuNjMxaDguNDI2YS4zMDcuMzA3LDAsMCwxLC4wNDcuMTExYy4wMTMsMi42LjAyOSw1LjIuMDMsNy43OTMsMCwuNjItLjAyMi42MTItLjYzMi42MTFxLTMuNzM4LDAtNy40NzUsMGgtLjRaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNzguOTc5IC05Ljg5OCkiIGZpbGw9IiMxYTE4MTgiLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTI5IiBkYXRhLW5hbWU9IlBhdGggNTEyOSIgZD0iTTI0LjI1MiwyNC4wMzNIMTUuNjQ1VjE1LjU2YTUuNzUzLDUuNzUzLDAsMCwxLC41OTQtLjA1OWMyLjQ0NS0uMDA2LDQuODksMCw3LjMzNS0uMDE1LjQ1MywwLC42NTYuMTIxLjY1NC42MTMtLjAwNywyLjM2OS4wMTMsNC43MzguMDIzLDcuMTA3LDAsLjI1NywwLC41MTUsMCwuODI3IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtOS45MDcgLTkuODA2KSIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMzAiIGRhdGEtbmFtZT0iUGF0aCA1MTMwIiBkPSJNMjQuMzEsMTI0LjQ3M3Y4LjU4NGMtLjYwNywwLTEuMTkyLDAtMS43NzcsMC0yLjA5NS0uMDA2LTQuMTktLjAyMi02LjI4NS0uMDEzLS40LDAtLjQ4OS0uMTIyLS40ODQtLjUyNS4wMjgtMi4zODMuMDE3LTQuNzY3LjAxOS03LjE1LDAtLjI4NywwLS41NzQsMC0uOVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC05Ljk4MiAtNzguODIzKSIgZmlsbD0iIzFhMTgxOCIvPg0KICAgICAgICA8L2c+DQogICAgICA8L2c+DQogICAgPC9nPg0KICA8L2c+DQo8L3N2Zz4NCg==";
            } else if (Docrotation == 270) {
                Qrcode =
                    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1OS45MDIiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA1OS45MDIgNjAiPg0KICA8ZyBpZD0iX2xlZnRfIiBkYXRhLW5hbWU9IiBsZWZ0ICIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCA2MCkgcm90YXRlKC05MCkiPg0KICAgIDxnIGlkPSJHcm91cF8zNDMzIiBkYXRhLW5hbWU9Ikdyb3VwIDM0MzMiPg0KICAgICAgPGcgaWQ9Ikdyb3VwXzM0MDUiIGRhdGEtbmFtZT0iR3JvdXAgMzQwNSI+DQogICAgICAgIDxnIGlkPSJHcm91cF8zNDM0IiBkYXRhLW5hbWU9Ikdyb3VwIDM0MzQiPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTUiIGRhdGEtbmFtZT0iUGF0aCA1MTE1IiBkPSJNMTAwLjA3NSw2NS4wMTJoMi44NTlWNjIuOTQ5YzAtLjcxNCwwLS43MS42OS0uNzE5LjU3Ny0uMDA3LDEuMTU1LS4wMSwxLjczMS0uMDQ1LjMtLjAxOS40MjQuMDkyLjQxOS4zNzktLjAxMy42NjcsMCwxLjMzNy0uMDQ4LDItLjAyNy4zODUuMDg2LjUxOS40Ny41LjY2Ny0uMDI3LDEuMzM3LS4wMzYsMi0uMDE4LjMyMi4wMDguNDMxLS4xLjQyLS40MTQtLjAyMi0uNjY3LS4wMDctMS4zMzYtLjAzMi0yLS4wMTItLjMzOS4xMTEtLjQ1OC40NS0uNDQ3LjY2OC4wMjEsMS4zMzcuMDI1LDIsMCwuMzE5LS4wMTEuNDM1LjA4NS40MjEuNDA5LS4wMjkuNjY3LS4wMTQsMS4zMzctLjA0NywyLS4wMTUuMy4wNC40NTguMzguNDUyLjgtLjAxMywxLjYwOSwwLDIuNDY1LDB2Mi44MTRoLS41OGMtLjYyMywwLTEuMjQ3LS4wMTMtMS44NjguMDE2LS4xMjMuMDA1LS4zMzguMTcyLS4zNDEuMjctLjAyNy44NDgtLjAxNiwxLjctLjAxNiwyLjZoMi44djIuOTMySDExMS40N2MwLC44NzUsMCwxLjcwNiwwLDIuNTM2LDAsLjMuMjI0LjI3Mi40MjEuMjcuNjY5LS4wMDgsMS4zMzgsMCwyLS4wMzMuMzM3LS4wMTYuNDYyLjA4Ni40NDkuNDMyLS4wMjYuNjY3LS4wMzMsMS4zMzYtLjAxMiwyLC4wMTEuMzQ4LS4xMTcuNDUzLS40NDcuNDQ2LS42ODMtLjAxNS0xLjM2OC0uMDE1LTIuMDUuMDEtLjExMSwwLS4zMDguMTYtLjMxLjI1LS4wMjQuODMzLS4wMTQsMS42NjYtLjAxNCwyLjU1MmgyLjc4MVY4Ny44OGgtNS42NWMwLS44MTgtLjAxOS0xLjYxOC4wMDgtMi40MTcuMDEzLS4zOTEtLjEzMy0uNDkxLS41LS40NzktLjc1Ny4wMjQtMS41MTYuMDA3LTIuMzMuMDA3LDAtLjk1MywwLTEuODg3LDAtMi44MmgyLjgxN2MwLS45LjAwOC0xLjc2Ni0uMDE0LTIuNjI2LDAtLjA3Ny0uMi0uMjA5LS4zMS0uMjEzcS0xLjExNS0uMDM5LTIuMjMxLS4wMjFjLS4xLDAtLjI3NC4xMjktLjI3NS4yLS4wMDcuODkxLjAxMiwxLjc4Mi4wMjUsMi42NzJIMTAzVjg3LjloMi43NzVjMCwuOTIuMDExLDEuNzk0LS4wMTcsMi42NjYsMCwuMDkxLS4yNDYuMjUtLjM3Ny4yNDktMi40MTUtLjAwNy00LjgzLS4wMzktNy4yNDQtLjA1NC0uOTI5LS4wMDYtLjk0OC4wMjUtLjkyNS45MzQuMDEzLjUuMDE4LDEsLjA0NSwxLjUuMDE2LjI5My0uMDg3LjQwOC0uMzg4LjQtLjgtLjAxNC0xLjYwNSwwLTIuNSwwLDAsLjkzMi0uMDA3LDEuNzkzLjAxMiwyLjY1MywwLC4wNzQuMTczLjIwNi4yNjcuMjA2LDEuNjg2LDAsMy4zNzMtLjAxOCw1LjA1OS0uMDI4LjI2NSwwLC4zNzEtLjEwNi4zNjMtLjM4Ni0uMDE4LS42NTMuMDEyLTEuMzA3LS4wMTItMS45Ni0uMDE0LS4zNjUuMDg0LS41MTIuNDc3LS41MSwyLjU4My4wMTEsNS4xNjYsMCw3Ljc0OSwwLC4yNTEsMCwuMzYyLjA3Ni4zNjEuMzM1LDAsLjctLjAwNiwxLjQuMDEzLDIuMS4wMS4zNjctLjE1NC40Ni0uNS40NTktMi42LS4wMS01LjIsMC03LjgsMC0uMDc1LDAtLjE1LjAwNy0uMjc2LjAxM3YyLjc2M0g4NS44Njh2LTIuOEg4OGMuNzIyLDAsLjcxOCwwLC43MDgtLjcxMS0uMDA4LS41OTItLjAyNy0xLjE4NiwwLTEuNzc3LjAxNi0uMzMtLjEwOS0uMzY5LS4zOTUtLjM2Mi0uOC4wMi0xLjYwNy4wMDctMi40ODEuMDA3LDAtMS45MTcsMC0zLjc5MiwwLTUuNjY4bC0uMDEzLjAxNUg4OC43Vjg0Ljk5M2MuNzksMCwxLjUxNS0uMDMyLDIuMjM1LjAxMS40NzkuMDI4LjYtLjE0LjU3Ny0uNTkxLS4wMjgtLjU5LjAwOS0xLjE4NC4wMzYtMS43NzUuMDE1LS4zMzctLjA3MS0uNS0uNDU3LS40NzgtLjY4Mi4wMzItMS4zNjcuMDA1LTIuMDUuMDA4LS4zLDAtLjQyMi0uMDgxLS4zOTQtLjQzMWExOC45NDQsMTguOTQ0LDAsMCwwLC4wMzItMS45NTNjLS4wMDctLjMyMS4wNTktLjQ2NC40MjEtLjQ2MSwxLjcxNS4wMTYsMy40My4wMDcsNS4yMTQuMDA3Vjg0Ljk5Yy0uODMsMC0xLjYxNy4wMTUtMi40LS4wMDctLjMyNi0uMDA5LS40MjQuMTA4LS40MTcuNDE4LjAxNi42NjgtLjAxNSwxLjMzOC4wMTcsMiwuMDIuNDE3LS4xNDMuNTIzLS41My41MDktLjcyNy0uMDI1LTEuNDU1LS4wMDctMi4yNS0uMDA3djIuODQ0Yy4yMjcsMCwuNDk0LDAsLjc2MSwwLDIuNDYuMDE4LDQuOTIuMDQsNy4zOC4wNDUuMTIzLDAsLjM1NC0uMTM3LjM1NC0uMjEzLjAxMi0uODQ4LS4wMTEtMS43LS4wMy0yLjU0NSwwLS4wMzYtLjA1Mi0uMDctLjA4LS4xMDZsLS4wMS4wMTFoMi45NTl2LS42OTJjMC0xLjUzNS4wMTMtMy4wNy0uMDEtNC42LS4wMDYtLjM3OC4xMzktLjQ3Ni40NzMtLjQ3My44LjAwOSwxLjYsMCwyLjQyOSwwVjc5LjM2Yy0uMTQyLS4wMTEtLjI3My0uMDI5LS40LS4wMjktMS42MjYsMC0zLjI1Mi0uMDEtNC44NzguMDE0LS4zODEuMDA2LS41MDYtLjEtLjUtLjQ4LjAyMi0uNzcxLjAwNy0xLjU0Mi4wMDctMi4zNzYtLjgwNywwLTEuNTYzLS4wMTUtMi4zMTcuMDA2LS4zODUuMDExLS41NjUtLjA0LS41MzQtLjUxNi4wNDgtLjc1NC0uMDE1LTEuNTE2LS4wMzItMi4yNzRsLS4wMTIuMDE1Yy42NzgtLjAzNCwxLjM1Ny0uMDcyLDIuMDM2LS4xLjI1NS0uMDExLjUxMiwwLC44MjYsMFY3MC43OGg1Ljc5NVY2Ny44NjloLTIuODYxVjY1Wm01LjcxMyw1Ljc1NmMuODY3LDAsMS43MTUuMDEsMi41NjItLjAxNC4wOTUsMCwuMjU5LS4yLjI2My0uMzA5LjAyNS0uNzQzLjAxMi0xLjQ4OC4wMTgtMi4yMzEsMC0uMjUyLS4xMDctLjM0Ny0uMzYtLjM0NC0uNzI4LjAxMS0xLjQ1Ni0uMDA2LTIuMTg0LjAxNS0uMSwwLS4yODQuMTQ5LS4yODYuMjMxLS4wMjEuODYxLS4wMTMsMS43MjQtLjAxMywyLjY1Mm0yLjg0OCw1LjdjMC0uOSwwLTEuNzUsMC0yLjYsMC0uMjUyLS4xMzMtLjMtLjM1LS4yODctLjcyNC4wMzQtMS40NDguMDY2LTIuMTczLjA3OS0uMjU5LDAtLjMzOS4xMS0uMzQxLjM1NS0uMDA3LjcxLS4wNDIsMS40MjEtLjAzNiwyLjEzMSwwLC4xMDcuMTU5LjMuMjQ5LjMuODU5LjAyMywxLjcxOC4wMTQsMi42NDkuMDE0bS04LjYtMi43NzNIOTcuMjI5djIuNzc0aDIuODA3WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTU0LjM0NiAtMzkuMzc3KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTYiIGRhdGEtbmFtZT0iUGF0aCA1MTE2IiBkPSJNMjUuNywzOC43MzljLjAxNC4yMzkuMDM5LjQ3OS4wNDEuNzE4LjAwOCwxLjUzNC4wMTgsMy4wNjcuMDEyLDQuNiwwLC4zLjA1Ni40NDkuNC40NC42NjgtLjAxNywxLjMzNi4wMDgsMiwuMDExLjM2MiwwLC41MzctLjEzMy41MTctLjU0Ni0uMDM2LS43NC0uMDEtMS40ODItLjAxLTIuMjY2Ljc3NiwwLDEuNTE0LDAsMi4yNTMsMCwuNTg2LDAsLjY1MS0uMDY0LjY1LS42NDcsMC0uNzQxLDAtMS40ODEsMC0yLjI1Mi4xNy0uMDA4LjI4Ny0uMDE3LjQtLjAxNywxLjYxMSwwLDMuMjIyLjAwNiw0LjgzMy0uMDA2LjMxMywwLC40Mi4wODUuNDE3LjQxMS0uMDE0LDEuNjEtLjAxNiwzLjIyMi4wMDgsNC44MzIuMDA2LjQxNy0uMTMzLjUxOC0uNTI2LjUtLjYzNy0uMDMyLTEuMjc2LDAtMS45MTQtLjAxMS0uMzU4LS4wMDctLjQ3OS4xNDctLjQ2NC41LjAyOS42NTEuMDI1LDEuMy4wMzUsMS45NTUuMDA1LjMyMi0uMTc0LjQwNy0uNDY3LjQtLjY2OC0uMDEzLTEuMzM4LS4wMjQtMi4wMDUsMC0uMzU1LjAxMy0uMzkzLS4xNDQtLjM4LS40MzkuMDMtLjY4Mi4wMzItMS4zNjYuMDQxLTIuMDQ5LDAtLjEzMi0uMDE5LS4yNjYtLjAzLS40LS44NzgsMC0xLjcyNC0uMDEyLTIuNTY4LjAxNi0uMSwwLS4yNy4yMjEtLjI3NS4zNDQtLjAyNi42ODMtLjAyOCwxLjM2OCwwLDIuMDUxLjAxMi4zMzItLjA3Ny40NjQtLjQyNy40NTQtLjY4My0uMDIxLTEuMzY4LDAtMi4wNTEtLjAwOC0uMjg4LDAtLjQuMDk0LS40LjQsMCwuNjY4LDAsMS4zMzgtLjA1MywyLS4wMzEuNDMyLjE2MS41LjUzLjQ5NCwxLjY3MS0uMDIxLDMuMzQzLS4wMjEsNS4wMTQtLjAyOGguMjczVjUzLjAxaDEuODU5YzEuMTI0LDAsMi4yNDktLjAxMywzLjM3MywwLC4zMzIsMCwuNDU2LS4wODcuNDQ0LS40MzgtLjAyNC0uNjgzLS4wMS0xLjM2OC4wMDctMi4wNTEuMDA4LS4zLS4xLS4zOS0uNC0uMzc1LS43MTIuMDM1LTEuNDI3LjA0Mi0yLjE0LjAzLS4xMjcsMC0uMzU5LS4xNDEtLjM2MS0uMjIyLS4wMjctLjg1OS0uMDE3LTEuNzItLjAxNy0yLjYsMS4xNCwwLDIuMTY5LDAsMy4yLDAsLjcyOSwwLDEuNDU5LjAwNiwyLjE4OC0uMDE1LjI3NS0uMDA4LjM4LjA3Mi4zOC4zNTVxMCwyLjUyOS4wMTMsNS4wNTljMCwuMzEyLS4yMTIuMjg0LS40MDYuMjg1LS43ODksMC0xLjU3NywwLTIuNDY1LDAsMCwuNTIzLDAsMS4wNjIsMCwxLjYtLjAxMSwxLjI3Ny0uMDEzLDEuMjc3LTEuMjY5LDEuMjc3SDI4LjY3M2MwLDEsMCwxLjk2NCwwLDIuOTNIMjUuNzY3YzAsLjg2Ny0uMDA2LDEuNzExLjAxLDIuNTU0YS4zMTcuMzE3LDAsMCwwLC4yMjkuMjA2Yy44NzIuMDE1LDEuNzQ1LjAxLDIuNjUxLjAxVjU4LjgzNmMxLjc3NC0uMDIzLDMuNTQ4LS4wNDIsNS4zMjEtLjA3My4yOTMtLjAwNS40NDkuMDUyLjQzOS40LS4wMjEuNy0uMDEyLDEuNCwwLDIuMDkzLjAwNS4yOTMtLjEwNy40MDYtLjQuNC0uNzg3LS4wMTItMS41NzQsMC0yLjQ0MSwwVjYzLjRjMCwxLjA3LDAsMS4wNjYtMS4wODgsMS4wNjEtLjUzMSwwLTEuMDYxLjAxNC0xLjU5Mi4wMjRhMi4zMzMsMi4zMzMsMCwwLDAtLjI0Mi4wMzZ2Mi44bC4wMDktLjAxYy0xLjczMS4wMDYtMy40NjMsMC01LjE5NC4wMjYtLjM3NS4wMDYtLjUtLjA3Ny0uNS0uNDcyLjAxOC0xLjU2NS4wMDYtMy4xMy0uMDA4LTQuNjk0LS4wMDYtLjU5My0uMDcxLS42LS42MDUtLjU3MS0xLjU2MS4wNy0zLjEyOC4wMTgtNC42OTMuMDI1LS4zMiwwLS40MTQtLjEyNy0uNDA1LS40MzkuMDIxLS43NTcuMDA3LTEuNTE1LjAwNy0yLjM1LjMyMS0uMDIzLjYyOS0uMDY1LjkzNy0uMDY1LDIuMzg1LDAsNC43NzEuMDA3LDcuMTU1LjAzNy4zNTYsMCwuNDU2LS4xMS40NTQtLjQzMS0uMDA3LS44LDAtMS42LDAtMi40MzItLjIyOS0uMDE0LS4zNjEtLjAzLS40OTMtLjAzLTIuNTIyLDAtNS4wNDUuMDA2LTcuNTY3LS4wMDgtLjM3MywwLS41MDcuMDg4LS40ODMuNDgzLjAzOC42MzYuMDE2LDEuMjc0LjAxNCwxLjkxMiwwLC4zNzgtLjE5NC41MzktLjU3NC41MzMtLjc0LS4wMTItMS40ODIsMC0yLjI3OSwwdjIuOGMtLjYyOCwwLTEuMiwwLTEuNzcyLDAtMS4xODUsMC0yLjM3LS4wMTQtMy41NTUtLjAxMy0uMzI1LDAtLjQzMS0uMTA2LS40MjMtLjQ1OC4wMzEtMS41MTkuMDI3LTMuMDM4LjAxOS00LjU1OGE0LjAwOCw0LjAwOCwwLDAsMC0uMTMxLS43MWgyLjkxNVY1MC4xODZjLS43MjksMC0xLjQyNSwwLTIuMTIxLDAtLjcxNSwwLS43MDctLjAwOC0uNzE0LjcyNi0uMDE4LDEuNjY2LS4wNDQsMy4zMzItLjA2Niw1SDUuODU4Yy0uMDE1LjIxNS0uMDM5LjM5Mi0uMDM4LjU2OC4wMTEsMS41OC4wMjEsMy4xNjEuMDQ2LDQuNzQxLjAwNS4zMDktLjA4My40NDMtLjQxMS40MzUtLjctLjAxOC0xLjQtLjAxNC0yLjEtLjAwNi0uMjU2LDAtLjQtLjA2Ny0uNC0uMzU1LjAwNS0xLjc3NCwwLTMuNTQ4LDAtNS4zNjguODQ2LDAsMS42MzMtLjAxNiwyLjQxOS4wMDcuMzUyLjAxLjQ5LS4wODguNDc5LS40NTgtLjAyMi0uOC0uMDA3LTEuNi0uMDA3LTIuNDI3LS44MzksMC0xLjYzOS0uMDI2LTIuNDM2LjAxMi0uMzcxLjAxOC0uNDc5LS4wNzUtLjQ2Ny0uNDQyLjAyNC0uOC4wMDctMS42LjAwNy0yLjQzN0guMTMyYzAtLjg2Ni0uMDExLTEuNy4wMTQtMi41MjcsMC0uMS4xOTEtLjI1MS4zMTQtLjI3NmEzLjQyOCwzLjQyOCwwLDAsMSwuNjgxLS4wMTNjNC4yNywwLDguNTQsMCwxMi44MS0uMDE1LjQsMCwuNDk0LjEzNC40ODYuNS0uMDE5Ljc3Mi0uMDA2LDEuNTQ1LS4wMDYsMi4zNDdoMi43NjJ2Mi43NjlhMi41NjgsMi41NjgsMCwwLDAsLjM2MS4wNjJjMS42NTYuMDEyLDMuMzEyLjAxNyw0Ljk2OC4wMzIuMzI0LDAsLjUtLjA2Ni40ODYtLjQ1Ny0uMDM0LS43NDMtLjAxNy0xLjQ4OC0uMDI2LTIuMjMzYTEuMSwxLjEsMCwwLDAtLjA1Ni0uMjI5SDE3LjI2OWMwLS44NzksMC0xLjcsMC0yLjUxNCwwLS4zMzYuMjY1LS4yNjYuNDY3LS4yNjZxMy4xOTEsMCw2LjM4My4wMTNjLjUyOCwwLDEuMDU3LDAsMS42MzksMHYtMi44NWMtLjg1MSwwLTEuNjM3LS4wMTctMi40MjIuMDA4LS4zNDIuMDEtLjQzMi0uMDgzLS40MjUtLjQzMy4wMjktMS40NzQuMDIyLTIuOTQ4LjAyOC00LjQyMiwwLS4yODQsMC0uNTY3LDAtLjkyNGgyLjc2NGwtLjAwOC0uMDA3bTUuODczLDNjMCwuNzgxLjAyMiwxLjU1MS0uMDEsMi4zMTgtLjAxNS4zNTguMTI1LjQ1MS40MzkuNDQ4LjY1Mi0uMDA4LDEuMy0uMDI3LDEuOTU1LDAsLjMxNy4wMTUuNDE1LS4xMi40MTUtLjM4NCwwLS43MjcsMC0xLjQ1NS0uMDM2LTIuMTgxYS40NTguNDU4LDAsMCwwLS4zMzEtLjNjLS43ODYuMDA4LTEuNTcuMDU2LTIuNDMyLjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0wLjA4MiAtMjQuNTMyKSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTciIGRhdGEtbmFtZT0iUGF0aCA1MTE3IiBkPSJNMTI4LjkwNiwyMC4wM0gxMDguOTU3Vi4xNGgxOS45NDlabS0yLjg1LTIuOFYyLjk3OUgxMTEuODM3YTEuMDg0LDEuMDg0LDAsMCwwLS4wMzYuMTc1cTAsNi44MzQtLjAwNywxMy42NjljMCwuMy4xMzEuNDExLjQwOC40MDcuMTM3LDAsLjI3NC4wMDYuNDEuMDA2bDEwLjcwNy0uMDFoMi43MzciIHRyYW5zZm9ybT0idHJhbnNsYXRlKC02OC45OTcgLTAuMDg5KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTgiIGRhdGEtbmFtZT0iUGF0aCA1MTE4IiBkPSJNMCwuMDQ1Qy4xODMuMDM2LjMxNy4wMjUuNDUxLjAyNVExMCwuMDE1LDE5LjU0OSwwYy4zMjgsMCwuNDQ1LjA1Mi40NDUuNDE0cS0uMDA2LDkuMzIxLjAxNiwxOC42NDNjMCwuOTM2LDAsLjkzLS45MjkuOTNMLjgsMTkuOTc2Yy0uNzUxLDAtLjc0LS4wMDUtLjc0Mi0uNzQzUS4wMzQsMTAuMzkyLDAsMS41NTFDMCwxLjA2NiwwLC41ODIsMCwuMDQ1TTE3LjE2NCwxNy4xNjZjMC0uNDA2LDAtLjczNywwLTEuMDY4LS4wMTQtNC4yMjQtLjAzNi04LjQ0Ny0uMDMxLTEyLjY3MSwwLS40NTEtLjA5MS0uNi0uNTY4LS41OTQtNC4zNjEuMDIxLTguNzIxLjAxNi0xMy4wODIuMDE4LS42MywwLS42MzIsMC0uNjMxLjYzOXEuMDA4LDYuMzU4LjAxNSwxMi43MTdjMCwuOTI4LS4wMTQuOTI1LjkxLjkyN2wxMS4xMjEuMDMxYy43MjgsMCwxLjQ1NSwwLDIuMjY2LDAiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMC4wMDEpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTExOSIgZGF0YS1uYW1lPSJQYXRoIDUxMTkiIGQ9Ik0uMjc2LDEyOC44MjNjMC0uMjQsMC0uNDgsMC0uNzIxcS0uMDIyLTkuMy0uMDQ0LTE4LjU5MWMwLS42MTgsMC0uNjE0LjYxOC0uNjE0cTguOTMxLjAwNywxNy44NjIuMDFjLjIsMCwuMzk1LDAsLjU5Mi0uMDA4LjkwNy0uMDE4LjkxMi0uMDE4LjkxMy45MTVxLjAwOCw5LjIyNy4wMTEsMTguNDU1di41NTRabTE3LjExNi0xNy4xMTJjLS44OSwwLTEuNzM2LDAtMi41ODIsMC0zLjcyMS4wMDktNy40NDMuMDI4LTExLjE2NC4wMTgtLjQ1NCwwLS41NTYuMTQ1LS41NTUuNTY2cS4wMTcsNi42NzcsMCwxMy4zNTNjMCwuMzYxLjE2Ny4zOC40NDcuMzc5cTYuNTYzLS4wMSwxMy4xMjUtLjAxYy4yMzgsMCwuNDc1LS4wMjEuNzMtLjAzM1oiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0wLjE0NyAtNjguOTU4KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjAiIGRhdGEtbmFtZT0iUGF0aCA1MTIwIiBkPSJNNjguMTc4LDExNi42N2gyLjljMCwxLjk1MywwLDMuODU3LDAsNS43NjJsLjAxMi0uMDE0SDY4LjIxMmMwLC43NzgtLjAwOSwxLjUxNywwLDIuMjU2LjAwOS41NjcuMDIuNTc0LS41NjguNTgtLjYwNy4wMDYtMS4yMTUuMDI1LTEuODE5LS4wMi0uMzg2LS4wMjktLjQ2OS4xMTgtLjQ2OC40NTcuMDA4LDIuMDY0LDAsNC4xMjksMCw2LjE5NCwwLC41LjAyLDEsMCwxLjUtLjAwNi4xMjctLjEzNy4zNTMtLjIxNi4zNTYtLjg1OC4wMjYtMS43MTcuMDE2LTIuNi4wMTZ2LTE0LjI0aDUuNjQyVjExNi42NmwtLjAwOS4wMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTM5LjYwNyAtNzMuODc1KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjEiIGRhdGEtbmFtZT0iUGF0aCA1MTIxIiBkPSJNNjguMDA2LDguNjEyVjUuOGMtLjE2MS0uMDE0LS4yNzUtLjAzMi0uMzg5LS4wMzItMS42MjUsMC0zLjI1LS4wMDctNC44NzYuMDE1LS4zODguMDA1LS41NDItLjA4MS0uNTEzLS41YTExLjc1MywxMS43NTMsMCwwLDAsMC0xLjc3NWMtLjAzOC0uNDUuMS0uNTg2LjU0MS0uNTc2LDEuNDEyLjAzMiwyLjgyNC4wMzYsNC4yMzcuMDQ5LjMsMCwuNiwwLC45NTMsMFYuMTI4aDIuODMzYzAsMS43MjMuMDE0LDMuNDM0LS4wMSw1LjE0NC0uMDA2LjQyMy4wODkuNTUxLjUzMS41MjEuNzcxLS4wNTMsMS41NDctLjAyNiwyLjMyMS0uMDMzbC0uMDA5LS4wMWMuMDA5LDEuOC4wMjIsMy42LjAxOCw1LjQwNywwLC4xMDktLjEzNS4zMDktLjIxMi4zMTEtLjg1Ny4wMjItMS43MTUuMDE0LTIuNTcyLjAxNCwwLS44OTEtLjAxNS0xLjY3My4wMDctMi40NTUuMDEtLjMzLS4wNy0uNDYtLjQyNS0uNDQ3LS44MTYuMDI3LTEuNjMzLjAxNS0yLjQ1LjAybC4wMTUuMDEzIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzkuNDAyIC0wLjA4MSkiIGZpbGw9IiNhZWM3MzciLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTIyIiBkYXRhLW5hbWU9IlBhdGggNTEyMiIgZD0iTTY4LjAyLDIzLjIyNXY1LjY5SDY1LjA0NmwuMDA4LjAwN3EwLTEuNDIzLDAtMi44NDlINjIuMjdjMC0uODc4LS4wMTgtMS43MjEuMDI0LTIuNTYxLjAwNS0uMS4zMzMtLjI2Ny41MTQtLjI3LDEuMTUyLS4wMjEsMi4zLDAsMy40NTcsMCwuNTg5LDAsMS4xNzksMCwxLjc2OSwwbC0uMDE0LS4wMTIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zOS40MyAtMTQuNzA3KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjMiIGRhdGEtbmFtZT0iUGF0aCA1MTIzIiBkPSJNOTMuMzI0LDUuNzU4Vi4xMjdoMi44MzVBLjk2MS45NjEsMCwwLDEsOTYuMi4zMzNxMCwyLjQzOCwwLDQuODc2YzAsLjU4Ny0uMDI2LjYtLjYxOS41OC0uNzU3LS4wMjItMS41MTYtLjAyOC0yLjI3My0uMDQxbC4wMDkuMDEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01OS4wOTIgLTAuMDgpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyNCIgZGF0YS1uYW1lPSJQYXRoIDUxMjQiIGQ9Ik0xNDguMTA2LDE1OC4yOGMwLS44MjIsMC0xLjYzOCwwLTIuNDU0LDAtLjIzNC4wODMtLjM0LjM1Ny0uMzMuNzExLjAyNywxLjQyMy4wMjEsMi4xMzQuMDA4LjI2LS4wMDUuNC4wNTEuMzkxLjM0NC0uMDE4Ljc0Mi0uMDEsMS40ODQtLjAzOCwyLjIyNSwwLC4xMDYtLjE1My4yOTQtLjIzNi4yOTUtLjgzMS4wMDktMS42NjItLjAxMi0yLjQ5My0uMDMtLjA0LDAtLjA3OS0uMDM5LS4xMTYtLjA1OCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTkzLjc4OSAtOTguNDY4KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjUiIGRhdGEtbmFtZT0iUGF0aCA1MTI1IiBkPSJNMTE5LjY0NCw2NS4wNTJjLS44NzcuMDEzLTEuNzU0LjAzNi0yLjYzLjAyOGEuNDA3LjQwNywwLDAsMS0uMy0uMjYyYy0uMDIzLS44My0uMDE0LTEuNjYxLS4wMTQtMi41NTIuNjE4LDAsMS4yLDAsMS43ODYsMCwxLjEyOSwwLDEuMTI4LS4wMDYsMS4xMywxLjExOSwwLC41Ni4wMDcsMS4xMi4wMTEsMS42OGwuMDE0LS4wMTIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC03My45MDEgLTM5LjQyOSkiIGZpbGw9IiNhZWM3MzciLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTI3IiBkYXRhLW5hbWU9IlBhdGggNTEyNyIgZD0iTTExMS45MzIsMTI3LjM2OWgtMi43MTh2LTIuOTEyaDIuNzA4cTAsMS40NjIsMCwyLjkyM2wuMDEtLjAxMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTY5LjE2IC03OC44MTMpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyOCIgZGF0YS1uYW1lPSJQYXRoIDUxMjgiIGQ9Ik0xMjQuNzE5LDE1LjYzMWg4LjQyNmEuMzA3LjMwNywwLDAsMSwuMDQ3LjExMWMuMDEzLDIuNi4wMjksNS4yLjAzLDcuNzkzLDAsLjYyLS4wMjIuNjEyLS42MzIuNjExcS0zLjczOCwwLTcuNDc1LDBoLS40WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTc4Ljk3OSAtOS44OTgpIiBmaWxsPSIjMWExODE4Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyOSIgZGF0YS1uYW1lPSJQYXRoIDUxMjkiIGQ9Ik0yNC4yNTIsMjQuMDMzSDE1LjY0NVYxNS41NmE1Ljc1Myw1Ljc1MywwLDAsMSwuNTk0LS4wNTljMi40NDUtLjAwNiw0Ljg5LDAsNy4zMzUtLjAxNS40NTMsMCwuNjU2LjEyMS42NTQuNjEzLS4wMDcsMi4zNjkuMDEzLDQuNzM4LjAyMyw3LjEwNywwLC4yNTcsMCwuNTE1LDAsLjgyNyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTkuOTA3IC05LjgwNikiLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTMwIiBkYXRhLW5hbWU9IlBhdGggNTEzMCIgZD0iTTI0LjMxLDEyNC40NzN2OC41ODRjLS42MDcsMC0xLjE5MiwwLTEuNzc3LDAtMi4wOTUtLjAwNi00LjE5LS4wMjItNi4yODUtLjAxMy0uNCwwLS40ODktLjEyMi0uNDg0LS41MjUuMDI4LTIuMzgzLjAxNy00Ljc2Ny4wMTktNy4xNSwwLS4yODcsMC0uNTc0LDAtLjlaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtOS45ODIgLTc4LjgyMykiIGZpbGw9IiMxYTE4MTgiLz4NCiAgICAgICAgPC9nPg0KICAgICAgPC9nPg0KICAgIDwvZz4NCiAgPC9nPg0KPC9zdmc+DQo=";
            } else {
                Qrcode =
                    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI1OS45MDIiIHZpZXdCb3g9IjAgMCA2MCA1OS45MDIiPg0KICA8ZyBpZD0iVVAiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMCkiPg0KICAgIDxnIGlkPSJHcm91cF8zNDMzIiBkYXRhLW5hbWU9Ikdyb3VwIDM0MzMiPg0KICAgICAgPGcgaWQ9Ikdyb3VwXzM0MDUiIGRhdGEtbmFtZT0iR3JvdXAgMzQwNSI+DQogICAgICAgIDxnIGlkPSJHcm91cF8zNDM0IiBkYXRhLW5hbWU9Ikdyb3VwIDM0MzQiPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTUiIGRhdGEtbmFtZT0iUGF0aCA1MTE1IiBkPSJNMTAwLjA3NSw2NS4wMTJoMi44NTlWNjIuOTQ5YzAtLjcxNCwwLS43MS42OS0uNzE5LjU3Ny0uMDA3LDEuMTU1LS4wMSwxLjczMS0uMDQ1LjMtLjAxOS40MjQuMDkyLjQxOS4zNzktLjAxMy42NjcsMCwxLjMzNy0uMDQ4LDItLjAyNy4zODUuMDg2LjUxOS40Ny41LjY2Ny0uMDI3LDEuMzM3LS4wMzYsMi0uMDE4LjMyMi4wMDguNDMxLS4xLjQyLS40MTQtLjAyMi0uNjY3LS4wMDctMS4zMzYtLjAzMi0yLS4wMTItLjMzOS4xMTEtLjQ1OC40NS0uNDQ3LjY2OC4wMjEsMS4zMzcuMDI1LDIsMCwuMzE5LS4wMTEuNDM1LjA4NS40MjEuNDA5LS4wMjkuNjY3LS4wMTQsMS4zMzctLjA0NywyLS4wMTUuMy4wNC40NTguMzguNDUyLjgtLjAxMywxLjYwOSwwLDIuNDY1LDB2Mi44MTRoLS41OGMtLjYyMywwLTEuMjQ3LS4wMTMtMS44NjguMDE2LS4xMjMuMDA1LS4zMzguMTcyLS4zNDEuMjctLjAyNy44NDgtLjAxNiwxLjctLjAxNiwyLjZoMi44djIuOTMySDExMS40N2MwLC44NzUsMCwxLjcwNiwwLDIuNTM2LDAsLjMuMjI0LjI3Mi40MjEuMjcuNjY5LS4wMDgsMS4zMzgsMCwyLS4wMzMuMzM3LS4wMTYuNDYyLjA4Ni40NDkuNDMyLS4wMjYuNjY3LS4wMzMsMS4zMzYtLjAxMiwyLC4wMTEuMzQ4LS4xMTcuNDUzLS40NDcuNDQ2LS42ODMtLjAxNS0xLjM2OC0uMDE1LTIuMDUuMDEtLjExMSwwLS4zMDguMTYtLjMxLjI1LS4wMjQuODMzLS4wMTQsMS42NjYtLjAxNCwyLjU1MmgyLjc4MVY4Ny44OGgtNS42NWMwLS44MTgtLjAxOS0xLjYxOC4wMDgtMi40MTcuMDEzLS4zOTEtLjEzMy0uNDkxLS41LS40NzktLjc1Ny4wMjQtMS41MTYuMDA3LTIuMzMuMDA3LDAtLjk1MywwLTEuODg3LDAtMi44MmgyLjgxN2MwLS45LjAwOC0xLjc2Ni0uMDE0LTIuNjI2LDAtLjA3Ny0uMi0uMjA5LS4zMS0uMjEzcS0xLjExNS0uMDM5LTIuMjMxLS4wMjFjLS4xLDAtLjI3NC4xMjktLjI3NS4yLS4wMDcuODkxLjAxMiwxLjc4Mi4wMjUsMi42NzJIMTAzVjg3LjloMi43NzVjMCwuOTIuMDExLDEuNzk0LS4wMTcsMi42NjYsMCwuMDkxLS4yNDYuMjUtLjM3Ny4yNDktMi40MTUtLjAwNy00LjgzLS4wMzktNy4yNDQtLjA1NC0uOTI5LS4wMDYtLjk0OC4wMjUtLjkyNS45MzQuMDEzLjUuMDE4LDEsLjA0NSwxLjUuMDE2LjI5My0uMDg3LjQwOC0uMzg4LjQtLjgtLjAxNC0xLjYwNSwwLTIuNSwwLDAsLjkzMi0uMDA3LDEuNzkzLjAxMiwyLjY1MywwLC4wNzQuMTczLjIwNi4yNjcuMjA2LDEuNjg2LDAsMy4zNzMtLjAxOCw1LjA1OS0uMDI4LjI2NSwwLC4zNzEtLjEwNi4zNjMtLjM4Ni0uMDE4LS42NTMuMDEyLTEuMzA3LS4wMTItMS45Ni0uMDE0LS4zNjUuMDg0LS41MTIuNDc3LS41MSwyLjU4My4wMTEsNS4xNjYsMCw3Ljc0OSwwLC4yNTEsMCwuMzYyLjA3Ni4zNjEuMzM1LDAsLjctLjAwNiwxLjQuMDEzLDIuMS4wMS4zNjctLjE1NC40Ni0uNS40NTktMi42LS4wMS01LjIsMC03LjgsMC0uMDc1LDAtLjE1LjAwNy0uMjc2LjAxM3YyLjc2M0g4NS44Njh2LTIuOEg4OGMuNzIyLDAsLjcxOCwwLC43MDgtLjcxMS0uMDA4LS41OTItLjAyNy0xLjE4NiwwLTEuNzc3LjAxNi0uMzMtLjEwOS0uMzY5LS4zOTUtLjM2Mi0uOC4wMi0xLjYwNy4wMDctMi40ODEuMDA3LDAtMS45MTcsMC0zLjc5MiwwLTUuNjY4bC0uMDEzLjAxNUg4OC43Vjg0Ljk5M2MuNzksMCwxLjUxNS0uMDMyLDIuMjM1LjAxMS40NzkuMDI4LjYtLjE0LjU3Ny0uNTkxLS4wMjgtLjU5LjAwOS0xLjE4NC4wMzYtMS43NzUuMDE1LS4zMzctLjA3MS0uNS0uNDU3LS40NzgtLjY4Mi4wMzItMS4zNjcuMDA1LTIuMDUuMDA4LS4zLDAtLjQyMi0uMDgxLS4zOTQtLjQzMWExOC45NDQsMTguOTQ0LDAsMCwwLC4wMzItMS45NTNjLS4wMDctLjMyMS4wNTktLjQ2NC40MjEtLjQ2MSwxLjcxNS4wMTYsMy40My4wMDcsNS4yMTQuMDA3Vjg0Ljk5Yy0uODMsMC0xLjYxNy4wMTUtMi40LS4wMDctLjMyNi0uMDA5LS40MjQuMTA4LS40MTcuNDE4LjAxNi42NjgtLjAxNSwxLjMzOC4wMTcsMiwuMDIuNDE3LS4xNDMuNTIzLS41My41MDktLjcyNy0uMDI1LTEuNDU1LS4wMDctMi4yNS0uMDA3djIuODQ0Yy4yMjcsMCwuNDk0LDAsLjc2MSwwLDIuNDYuMDE4LDQuOTIuMDQsNy4zOC4wNDUuMTIzLDAsLjM1NC0uMTM3LjM1NC0uMjEzLjAxMi0uODQ4LS4wMTEtMS43LS4wMy0yLjU0NSwwLS4wMzYtLjA1Mi0uMDctLjA4LS4xMDZsLS4wMS4wMTFoMi45NTl2LS42OTJjMC0xLjUzNS4wMTMtMy4wNy0uMDEtNC42LS4wMDYtLjM3OC4xMzktLjQ3Ni40NzMtLjQ3My44LjAwOSwxLjYsMCwyLjQyOSwwVjc5LjM2Yy0uMTQyLS4wMTEtLjI3My0uMDI5LS40LS4wMjktMS42MjYsMC0zLjI1Mi0uMDEtNC44NzguMDE0LS4zODEuMDA2LS41MDYtLjEtLjUtLjQ4LjAyMi0uNzcxLjAwNy0xLjU0Mi4wMDctMi4zNzYtLjgwNywwLTEuNTYzLS4wMTUtMi4zMTcuMDA2LS4zODUuMDExLS41NjUtLjA0LS41MzQtLjUxNi4wNDgtLjc1NC0uMDE1LTEuNTE2LS4wMzItMi4yNzRsLS4wMTIuMDE1Yy42NzgtLjAzNCwxLjM1Ny0uMDcyLDIuMDM2LS4xLjI1NS0uMDExLjUxMiwwLC44MjYsMFY3MC43OGg1Ljc5NVY2Ny44NjloLTIuODYxVjY1Wm01LjcxMyw1Ljc1NmMuODY3LDAsMS43MTUuMDEsMi41NjItLjAxNC4wOTUsMCwuMjU5LS4yLjI2My0uMzA5LjAyNS0uNzQzLjAxMi0xLjQ4OC4wMTgtMi4yMzEsMC0uMjUyLS4xMDctLjM0Ny0uMzYtLjM0NC0uNzI4LjAxMS0xLjQ1Ni0uMDA2LTIuMTg0LjAxNS0uMSwwLS4yODQuMTQ5LS4yODYuMjMxLS4wMjEuODYxLS4wMTMsMS43MjQtLjAxMywyLjY1Mm0yLjg0OCw1LjdjMC0uOSwwLTEuNzUsMC0yLjYsMC0uMjUyLS4xMzMtLjMtLjM1LS4yODctLjcyNC4wMzQtMS40NDguMDY2LTIuMTczLjA3OS0uMjU5LDAtLjMzOS4xMS0uMzQxLjM1NS0uMDA3LjcxLS4wNDIsMS40MjEtLjAzNiwyLjEzMSwwLC4xMDcuMTU5LjMuMjQ5LjMuODU5LjAyMywxLjcxOC4wMTQsMi42NDkuMDE0bS04LjYtMi43NzNIOTcuMjI5djIuNzc0aDIuODA3WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTU0LjM0NiAtMzkuMzc3KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTYiIGRhdGEtbmFtZT0iUGF0aCA1MTE2IiBkPSJNMjUuNywzOC43MzljLjAxNC4yMzkuMDM5LjQ3OS4wNDEuNzE4LjAwOCwxLjUzNC4wMTgsMy4wNjcuMDEyLDQuNiwwLC4zLjA1Ni40NDkuNC40NC42NjgtLjAxNywxLjMzNi4wMDgsMiwuMDExLjM2MiwwLC41MzctLjEzMy41MTctLjU0Ni0uMDM2LS43NC0uMDEtMS40ODItLjAxLTIuMjY2Ljc3NiwwLDEuNTE0LDAsMi4yNTMsMCwuNTg2LDAsLjY1MS0uMDY0LjY1LS42NDcsMC0uNzQxLDAtMS40ODEsMC0yLjI1Mi4xNy0uMDA4LjI4Ny0uMDE3LjQtLjAxNywxLjYxMSwwLDMuMjIyLjAwNiw0LjgzMy0uMDA2LjMxMywwLC40Mi4wODUuNDE3LjQxMS0uMDE0LDEuNjEtLjAxNiwzLjIyMi4wMDgsNC44MzIuMDA2LjQxNy0uMTMzLjUxOC0uNTI2LjUtLjYzNy0uMDMyLTEuMjc2LDAtMS45MTQtLjAxMS0uMzU4LS4wMDctLjQ3OS4xNDctLjQ2NC41LjAyOS42NTEuMDI1LDEuMy4wMzUsMS45NTUuMDA1LjMyMi0uMTc0LjQwNy0uNDY3LjQtLjY2OC0uMDEzLTEuMzM4LS4wMjQtMi4wMDUsMC0uMzU1LjAxMy0uMzkzLS4xNDQtLjM4LS40MzkuMDMtLjY4Mi4wMzItMS4zNjYuMDQxLTIuMDQ5LDAtLjEzMi0uMDE5LS4yNjYtLjAzLS40LS44NzgsMC0xLjcyNC0uMDEyLTIuNTY4LjAxNi0uMSwwLS4yNy4yMjEtLjI3NS4zNDQtLjAyNi42ODMtLjAyOCwxLjM2OCwwLDIuMDUxLjAxMi4zMzItLjA3Ny40NjQtLjQyNy40NTQtLjY4My0uMDIxLTEuMzY4LDAtMi4wNTEtLjAwOC0uMjg4LDAtLjQuMDk0LS40LjQsMCwuNjY4LDAsMS4zMzgtLjA1MywyLS4wMzEuNDMyLjE2MS41LjUzLjQ5NCwxLjY3MS0uMDIxLDMuMzQzLS4wMjEsNS4wMTQtLjAyOGguMjczVjUzLjAxaDEuODU5YzEuMTI0LDAsMi4yNDktLjAxMywzLjM3MywwLC4zMzIsMCwuNDU2LS4wODcuNDQ0LS40MzgtLjAyNC0uNjgzLS4wMS0xLjM2OC4wMDctMi4wNTEuMDA4LS4zLS4xLS4zOS0uNC0uMzc1LS43MTIuMDM1LTEuNDI3LjA0Mi0yLjE0LjAzLS4xMjcsMC0uMzU5LS4xNDEtLjM2MS0uMjIyLS4wMjctLjg1OS0uMDE3LTEuNzItLjAxNy0yLjYsMS4xNCwwLDIuMTY5LDAsMy4yLDAsLjcyOSwwLDEuNDU5LjAwNiwyLjE4OC0uMDE1LjI3NS0uMDA4LjM4LjA3Mi4zOC4zNTVxMCwyLjUyOS4wMTMsNS4wNTljMCwuMzEyLS4yMTIuMjg0LS40MDYuMjg1LS43ODksMC0xLjU3NywwLTIuNDY1LDAsMCwuNTIzLDAsMS4wNjIsMCwxLjYtLjAxMSwxLjI3Ny0uMDEzLDEuMjc3LTEuMjY5LDEuMjc3SDI4LjY3M2MwLDEsMCwxLjk2NCwwLDIuOTNIMjUuNzY3YzAsLjg2Ny0uMDA2LDEuNzExLjAxLDIuNTU0YS4zMTcuMzE3LDAsMCwwLC4yMjkuMjA2Yy44NzIuMDE1LDEuNzQ1LjAxLDIuNjUxLjAxVjU4LjgzNmMxLjc3NC0uMDIzLDMuNTQ4LS4wNDIsNS4zMjEtLjA3My4yOTMtLjAwNS40NDkuMDUyLjQzOS40LS4wMjEuNy0uMDEyLDEuNCwwLDIuMDkzLjAwNS4yOTMtLjEwNy40MDYtLjQuNC0uNzg3LS4wMTItMS41NzQsMC0yLjQ0MSwwVjYzLjRjMCwxLjA3LDAsMS4wNjYtMS4wODgsMS4wNjEtLjUzMSwwLTEuMDYxLjAxNC0xLjU5Mi4wMjRhMi4zMzMsMi4zMzMsMCwwLDAtLjI0Mi4wMzZ2Mi44bC4wMDktLjAxYy0xLjczMS4wMDYtMy40NjMsMC01LjE5NC4wMjYtLjM3NS4wMDYtLjUtLjA3Ny0uNS0uNDcyLjAxOC0xLjU2NS4wMDYtMy4xMy0uMDA4LTQuNjk0LS4wMDYtLjU5My0uMDcxLS42LS42MDUtLjU3MS0xLjU2MS4wNy0zLjEyOC4wMTgtNC42OTMuMDI1LS4zMiwwLS40MTQtLjEyNy0uNDA1LS40MzkuMDIxLS43NTcuMDA3LTEuNTE1LjAwNy0yLjM1LjMyMS0uMDIzLjYyOS0uMDY1LjkzNy0uMDY1LDIuMzg1LDAsNC43NzEuMDA3LDcuMTU1LjAzNy4zNTYsMCwuNDU2LS4xMS40NTQtLjQzMS0uMDA3LS44LDAtMS42LDAtMi40MzItLjIyOS0uMDE0LS4zNjEtLjAzLS40OTMtLjAzLTIuNTIyLDAtNS4wNDUuMDA2LTcuNTY3LS4wMDgtLjM3MywwLS41MDcuMDg4LS40ODMuNDgzLjAzOC42MzYuMDE2LDEuMjc0LjAxNCwxLjkxMiwwLC4zNzgtLjE5NC41MzktLjU3NC41MzMtLjc0LS4wMTItMS40ODIsMC0yLjI3OSwwdjIuOGMtLjYyOCwwLTEuMiwwLTEuNzcyLDAtMS4xODUsMC0yLjM3LS4wMTQtMy41NTUtLjAxMy0uMzI1LDAtLjQzMS0uMTA2LS40MjMtLjQ1OC4wMzEtMS41MTkuMDI3LTMuMDM4LjAxOS00LjU1OGE0LjAwOCw0LjAwOCwwLDAsMC0uMTMxLS43MWgyLjkxNVY1MC4xODZjLS43MjksMC0xLjQyNSwwLTIuMTIxLDAtLjcxNSwwLS43MDctLjAwOC0uNzE0LjcyNi0uMDE4LDEuNjY2LS4wNDQsMy4zMzItLjA2Niw1SDUuODU4Yy0uMDE1LjIxNS0uMDM5LjM5Mi0uMDM4LjU2OC4wMTEsMS41OC4wMjEsMy4xNjEuMDQ2LDQuNzQxLjAwNS4zMDktLjA4My40NDMtLjQxMS40MzUtLjctLjAxOC0xLjQtLjAxNC0yLjEtLjAwNi0uMjU2LDAtLjQtLjA2Ny0uNC0uMzU1LjAwNS0xLjc3NCwwLTMuNTQ4LDAtNS4zNjguODQ2LDAsMS42MzMtLjAxNiwyLjQxOS4wMDcuMzUyLjAxLjQ5LS4wODguNDc5LS40NTgtLjAyMi0uOC0uMDA3LTEuNi0uMDA3LTIuNDI3LS44MzksMC0xLjYzOS0uMDI2LTIuNDM2LjAxMi0uMzcxLjAxOC0uNDc5LS4wNzUtLjQ2Ny0uNDQyLjAyNC0uOC4wMDctMS42LjAwNy0yLjQzN0guMTMyYzAtLjg2Ni0uMDExLTEuNy4wMTQtMi41MjcsMC0uMS4xOTEtLjI1MS4zMTQtLjI3NmEzLjQyOCwzLjQyOCwwLDAsMSwuNjgxLS4wMTNjNC4yNywwLDguNTQsMCwxMi44MS0uMDE1LjQsMCwuNDk0LjEzNC40ODYuNS0uMDE5Ljc3Mi0uMDA2LDEuNTQ1LS4wMDYsMi4zNDdoMi43NjJ2Mi43NjlhMi41NjgsMi41NjgsMCwwLDAsLjM2MS4wNjJjMS42NTYuMDEyLDMuMzEyLjAxNyw0Ljk2OC4wMzIuMzI0LDAsLjUtLjA2Ni40ODYtLjQ1Ny0uMDM0LS43NDMtLjAxNy0xLjQ4OC0uMDI2LTIuMjMzYTEuMSwxLjEsMCwwLDAtLjA1Ni0uMjI5SDE3LjI2OWMwLS44NzksMC0xLjcsMC0yLjUxNCwwLS4zMzYuMjY1LS4yNjYuNDY3LS4yNjZxMy4xOTEsMCw2LjM4My4wMTNjLjUyOCwwLDEuMDU3LDAsMS42MzksMHYtMi44NWMtLjg1MSwwLTEuNjM3LS4wMTctMi40MjIuMDA4LS4zNDIuMDEtLjQzMi0uMDgzLS40MjUtLjQzMy4wMjktMS40NzQuMDIyLTIuOTQ4LjAyOC00LjQyMiwwLS4yODQsMC0uNTY3LDAtLjkyNGgyLjc2NGwtLjAwOC0uMDA3bTUuODczLDNjMCwuNzgxLjAyMiwxLjU1MS0uMDEsMi4zMTgtLjAxNS4zNTguMTI1LjQ1MS40MzkuNDQ4LjY1Mi0uMDA4LDEuMy0uMDI3LDEuOTU1LDAsLjMxNy4wMTUuNDE1LS4xMi40MTUtLjM4NCwwLS43MjcsMC0xLjQ1NS0uMDM2LTIuMTgxYS40NTguNDU4LDAsMCwwLS4zMzEtLjNjLS43ODYuMDA4LTEuNTcuMDU2LTIuNDMyLjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0wLjA4MiAtMjQuNTMyKSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTciIGRhdGEtbmFtZT0iUGF0aCA1MTE3IiBkPSJNMTI4LjkwNiwyMC4wM0gxMDguOTU3Vi4xNGgxOS45NDlabS0yLjg1LTIuOFYyLjk3OUgxMTEuODM3YTEuMDg0LDEuMDg0LDAsMCwwLS4wMzYuMTc1cTAsNi44MzQtLjAwNywxMy42NjljMCwuMy4xMzEuNDExLjQwOC40MDcuMTM3LDAsLjI3NC4wMDYuNDEuMDA2bDEwLjcwNy0uMDFoMi43MzciIHRyYW5zZm9ybT0idHJhbnNsYXRlKC02OC45OTcgLTAuMDg5KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTgiIGRhdGEtbmFtZT0iUGF0aCA1MTE4IiBkPSJNMCwuMDQ1Qy4xODMuMDM2LjMxNy4wMjUuNDUxLjAyNVExMCwuMDE1LDE5LjU0OSwwYy4zMjgsMCwuNDQ1LjA1Mi40NDUuNDE0cS0uMDA2LDkuMzIxLjAxNiwxOC42NDNjMCwuOTM2LDAsLjkzLS45MjkuOTNMLjgsMTkuOTc2Yy0uNzUxLDAtLjc0LS4wMDUtLjc0Mi0uNzQzUS4wMzQsMTAuMzkyLDAsMS41NTFDMCwxLjA2NiwwLC41ODIsMCwuMDQ1TTE3LjE2NCwxNy4xNjZjMC0uNDA2LDAtLjczNywwLTEuMDY4LS4wMTQtNC4yMjQtLjAzNi04LjQ0Ny0uMDMxLTEyLjY3MSwwLS40NTEtLjA5MS0uNi0uNTY4LS41OTQtNC4zNjEuMDIxLTguNzIxLjAxNi0xMy4wODIuMDE4LS42MywwLS42MzIsMC0uNjMxLjYzOXEuMDA4LDYuMzU4LjAxNSwxMi43MTdjMCwuOTI4LS4wMTQuOTI1LjkxLjkyN2wxMS4xMjEuMDMxYy43MjgsMCwxLjQ1NSwwLDIuMjY2LDAiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMC4wMDEpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTExOSIgZGF0YS1uYW1lPSJQYXRoIDUxMTkiIGQ9Ik0uMjc2LDEyOC44MjNjMC0uMjQsMC0uNDgsMC0uNzIxcS0uMDIyLTkuMy0uMDQ0LTE4LjU5MWMwLS42MTgsMC0uNjE0LjYxOC0uNjE0cTguOTMxLjAwNywxNy44NjIuMDFjLjIsMCwuMzk1LDAsLjU5Mi0uMDA4LjkwNy0uMDE4LjkxMi0uMDE4LjkxMy45MTVxLjAwOCw5LjIyNy4wMTEsMTguNDU1di41NTRabTE3LjExNi0xNy4xMTJjLS44OSwwLTEuNzM2LDAtMi41ODIsMC0zLjcyMS4wMDktNy40NDMuMDI4LTExLjE2NC4wMTgtLjQ1NCwwLS41NTYuMTQ1LS41NTUuNTY2cS4wMTcsNi42NzcsMCwxMy4zNTNjMCwuMzYxLjE2Ny4zOC40NDcuMzc5cTYuNTYzLS4wMSwxMy4xMjUtLjAxYy4yMzgsMCwuNDc1LS4wMjEuNzMtLjAzM1oiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0wLjE0NyAtNjguOTU4KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjAiIGRhdGEtbmFtZT0iUGF0aCA1MTIwIiBkPSJNNjguMTc4LDExNi42N2gyLjljMCwxLjk1MywwLDMuODU3LDAsNS43NjJsLjAxMi0uMDE0SDY4LjIxMmMwLC43NzgtLjAwOSwxLjUxNywwLDIuMjU2LjAwOS41NjcuMDIuNTc0LS41NjguNTgtLjYwNy4wMDYtMS4yMTUuMDI1LTEuODE5LS4wMi0uMzg2LS4wMjktLjQ2OS4xMTgtLjQ2OC40NTcuMDA4LDIuMDY0LDAsNC4xMjksMCw2LjE5NCwwLC41LjAyLDEsMCwxLjUtLjAwNi4xMjctLjEzNy4zNTMtLjIxNi4zNTYtLjg1OC4wMjYtMS43MTcuMDE2LTIuNi4wMTZ2LTE0LjI0aDUuNjQyVjExNi42NmwtLjAwOS4wMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTM5LjYwNyAtNzMuODc1KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjEiIGRhdGEtbmFtZT0iUGF0aCA1MTIxIiBkPSJNNjguMDA2LDguNjEyVjUuOGMtLjE2MS0uMDE0LS4yNzUtLjAzMi0uMzg5LS4wMzItMS42MjUsMC0zLjI1LS4wMDctNC44NzYuMDE1LS4zODguMDA1LS41NDItLjA4MS0uNTEzLS41YTExLjc1MywxMS43NTMsMCwwLDAsMC0xLjc3NWMtLjAzOC0uNDUuMS0uNTg2LjU0MS0uNTc2LDEuNDEyLjAzMiwyLjgyNC4wMzYsNC4yMzcuMDQ5LjMsMCwuNiwwLC45NTMsMFYuMTI4aDIuODMzYzAsMS43MjMuMDE0LDMuNDM0LS4wMSw1LjE0NC0uMDA2LjQyMy4wODkuNTUxLjUzMS41MjEuNzcxLS4wNTMsMS41NDctLjAyNiwyLjMyMS0uMDMzbC0uMDA5LS4wMWMuMDA5LDEuOC4wMjIsMy42LjAxOCw1LjQwNywwLC4xMDktLjEzNS4zMDktLjIxMi4zMTEtLjg1Ny4wMjItMS43MTUuMDE0LTIuNTcyLjAxNCwwLS44OTEtLjAxNS0xLjY3My4wMDctMi40NTUuMDEtLjMzLS4wNy0uNDYtLjQyNS0uNDQ3LS44MTYuMDI3LTEuNjMzLjAxNS0yLjQ1LjAybC4wMTUuMDEzIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzkuNDAyIC0wLjA4MSkiIGZpbGw9IiNhZWM3MzciLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTIyIiBkYXRhLW5hbWU9IlBhdGggNTEyMiIgZD0iTTY4LjAyLDIzLjIyNXY1LjY5SDY1LjA0NmwuMDA4LjAwN3EwLTEuNDIzLDAtMi44NDlINjIuMjdjMC0uODc4LS4wMTgtMS43MjEuMDI0LTIuNTYxLjAwNS0uMS4zMzMtLjI2Ny41MTQtLjI3LDEuMTUyLS4wMjEsMi4zLDAsMy40NTcsMCwuNTg5LDAsMS4xNzksMCwxLjc2OSwwbC0uMDE0LS4wMTIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zOS40MyAtMTQuNzA3KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjMiIGRhdGEtbmFtZT0iUGF0aCA1MTIzIiBkPSJNOTMuMzI0LDUuNzU4Vi4xMjdoMi44MzVBLjk2MS45NjEsMCwwLDEsOTYuMi4zMzNxMCwyLjQzOCwwLDQuODc2YzAsLjU4Ny0uMDI2LjYtLjYxOS41OC0uNzU3LS4wMjItMS41MTYtLjAyOC0yLjI3My0uMDQxbC4wMDkuMDEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01OS4wOTIgLTAuMDgpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyNCIgZGF0YS1uYW1lPSJQYXRoIDUxMjQiIGQ9Ik0xNDguMTA2LDE1OC4yOGMwLS44MjIsMC0xLjYzOCwwLTIuNDU0LDAtLjIzNC4wODMtLjM0LjM1Ny0uMzMuNzExLjAyNywxLjQyMy4wMjEsMi4xMzQuMDA4LjI2LS4wMDUuNC4wNTEuMzkxLjM0NC0uMDE4Ljc0Mi0uMDEsMS40ODQtLjAzOCwyLjIyNSwwLC4xMDYtLjE1My4yOTQtLjIzNi4yOTUtLjgzMS4wMDktMS42NjItLjAxMi0yLjQ5My0uMDMtLjA0LDAtLjA3OS0uMDM5LS4xMTYtLjA1OCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTkzLjc4OSAtOTguNDY4KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjUiIGRhdGEtbmFtZT0iUGF0aCA1MTI1IiBkPSJNMTE5LjY0NCw2NS4wNTJjLS44NzcuMDEzLTEuNzU0LjAzNi0yLjYzLjAyOGEuNDA3LjQwNywwLDAsMS0uMy0uMjYyYy0uMDIzLS44My0uMDE0LTEuNjYxLS4wMTQtMi41NTIuNjE4LDAsMS4yLDAsMS43ODYsMCwxLjEyOSwwLDEuMTI4LS4wMDYsMS4xMywxLjExOSwwLC41Ni4wMDcsMS4xMi4wMTEsMS42OGwuMDE0LS4wMTIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC03My45MDEgLTM5LjQyOSkiIGZpbGw9IiNhZWM3MzciLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTI3IiBkYXRhLW5hbWU9IlBhdGggNTEyNyIgZD0iTTExMS45MzIsMTI3LjM2OWgtMi43MTh2LTIuOTEyaDIuNzA4cTAsMS40NjIsMCwyLjkyM2wuMDEtLjAxMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTY5LjE2IC03OC44MTMpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyOCIgZGF0YS1uYW1lPSJQYXRoIDUxMjgiIGQ9Ik0xMjQuNzE5LDE1LjYzMWg4LjQyNmEuMzA3LjMwNywwLDAsMSwuMDQ3LjExMWMuMDEzLDIuNi4wMjksNS4yLjAzLDcuNzkzLDAsLjYyLS4wMjIuNjEyLS42MzIuNjExcS0zLjczOCwwLTcuNDc1LDBoLS40WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTc4Ljk3OSAtOS44OTgpIiBmaWxsPSIjMWExODE4Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyOSIgZGF0YS1uYW1lPSJQYXRoIDUxMjkiIGQ9Ik0yNC4yNTIsMjQuMDMzSDE1LjY0NVYxNS41NmE1Ljc1Myw1Ljc1MywwLDAsMSwuNTk0LS4wNTljMi40NDUtLjAwNiw0Ljg5LDAsNy4zMzUtLjAxNS40NTMsMCwuNjU2LjEyMS42NTQuNjEzLS4wMDcsMi4zNjkuMDEzLDQuNzM4LjAyMyw3LjEwNywwLC4yNTcsMCwuNTE1LDAsLjgyNyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTkuOTA3IC05LjgwNikiLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTMwIiBkYXRhLW5hbWU9IlBhdGggNTEzMCIgZD0iTTI0LjMxLDEyNC40NzN2OC41ODRjLS42MDcsMC0xLjE5MiwwLTEuNzc3LDAtMi4wOTUtLjAwNi00LjE5LS4wMjItNi4yODUtLjAxMy0uNCwwLS40ODktLjEyMi0uNDg0LS41MjUuMDI4LTIuMzgzLjAxNy00Ljc2Ny4wMTktNy4xNSwwLS4yODcsMC0uNTc0LDAtLjlaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtOS45ODIgLTc4LjgyMykiIGZpbGw9IiMxYTE4MTgiLz4NCiAgICAgICAgPC9nPg0KICAgICAgPC9nPg0KICAgIDwvZz4NCiAgPC9nPg0KPC9zdmc+DQo=";
            }

            let qrcodefieldvals = data;
            const field = new Annotations.Forms.Field(
                qrcodefieldvals.fieldName,
                {
                    type: "Sig",
                }
            );
            const widgetAnnot =
                new Annotations.SignatureWidgetAnnotation(field, {
                    appearance: "_DEFAULT",
                    appearances: {
                        _DEFAULT: {
                            Normal: {
                                data: Qrcode,
                                offset: {
                                    x: 100,
                                    y: 100,
                                },
                            },
                        },
                    },
                    // rotation: Docrotation,
                });
            widgetAnnot.PageNumber = qrcodefieldvals.PageNumber;
            widgetAnnot.X = qrcodefieldvals.posX;
            widgetAnnot.Y = qrcodefieldvals.posY;
            widgetAnnot.Width = qrcodefieldvals.width;
            widgetAnnot.Height = qrcodefieldvals.height;

            widgetAnnot.setCustomData("isqrcodeField", true);
            widgetAnnot.setCustomData(
                "recepient",
                suid
            );

            //add the form field and widget annotation
            annotManager.addAnnotation(widgetAnnot);
            annotManager.drawAnnotationsFromList([widgetAnnot]);
            fieldManager.addField(field);

        }



    }

    docViewer.on('documentLoaded', () => {
        try {
            const { docViewer, Annotations, CoreControls, iframeWindow, PDFNet, Tools } = webviwerInstance;
            webviwerInstance.setZoomLevel(zoomlevelval);
            var signatureconfig = JSON.parse(sigAnnData);
            matchedSignData = {};

            const signatureTool = docViewer.getTool(

                "AnnotationCreateSignature"
            );
            signatureTool.addEventListener("locationSelected", () => {
                webviwerInstance.UI.closeElements(["signatureModal"]);
                SaveQuickSign(viewName);

            });
            //const matchedSignData = {}; // Define matchedSignData object
            const matchedRecipients = [];

            for (const recipient of recipients) {
                for (const alternateSignatory of recipient.alternateSignatories) {
                    const ownerSuid = alternateSignatory.suid;
                    // Assuming 'suid' is a variable containing the suid you want to compare
                    if (ownerSuid == suid) {
                        // If suid matches, store the recipient data somewhere
                        // For example, you can push it into an array
                        matchedRecipients.push(recipient);
                    }

                }
            }
            for (const data of matchedRecipients) {
                const ownermatchedSuid = data.suid; // Assuming suid is the property that holds the ID

                for (const key in signatureconfig) {
                    if (signatureconfig.hasOwnProperty(key)) {
                        if (key == ownermatchedSuid) {
                            matchedSignData[suid] = signatureconfig[key];
                        }
                    }
                }
            }




            // Now matchedSignData contains the matched data from signatureconfig

            //for (const key in signatureconfig) {
            //	if (signatureconfig.hasOwnProperty(key)) {
            //		if (key === suid) {
            //			matchedSignData[key] = signatureconfig[key];
            //		} else {
            //			matchedSignData[suid] = signatureconfig[key];
            //		}
            //	}
            //}


            for (const key in matchedSignData) {
                if (matchedSignData.hasOwnProperty(key)) {
                    var obj = matchedSignData[key];
                    obj.name = 'SIGNATURE_' + loginEmail;
                    obj.type = 'SIGNATURE';
                    signpresent = true;
                    //addField(obj, key);
                    applyannotations(obj, key);
                }
            }

            var esealconfig = JSON.parse(esealAnnData);
            matchedEsealData = {};

            for (const data of matchedRecipients) {
                const ownermatchedSuid = data.suid; // Assuming suid is the property that holds the ID

                for (const key in esealconfig) {
                    if (esealconfig.hasOwnProperty(key)) {
                        if (key == ownermatchedSuid) {
                            matchedEsealData[suid] = esealconfig[key];
                        }
                    }
                }
            }



            for (const key in matchedEsealData) {
                if (matchedEsealData.hasOwnProperty(key)) {
                    var obj = matchedEsealData[key];
                    obj.name = 'ESEAL_' + loginEmail;
                    obj.type = 'ESEAL';
                    //addField(obj, key);
                    applyannotations(obj, key);
                }
            }

        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    })

    $.ajax({
        url: url + '/' + id,
        type: 'GET',
        success: function (resp) {
            if (resp.success) {
                Documentbase64 = resp.result;

                webviwerInstance.loadDocument(base64ToBlob(Documentbase64), { filename: 'Sample.pdf' });
                webviwerInstance.disableElements(['annotationDeleteButton', 'annotationCommentButton', 'annotationStyleEditButton', 'linkButton',]);
            } else {
                swal({
                    title: 'Error',
                    text: resp.message,
                    type: 'error',
                }, function (isConfirm) {
                    if (isConfirm) {
                        window.location.href = IndexDocuments;
                    }
                });
            }
            console.log(resp);
        },

        error: ajaxErrorHandler
    });
}




function QuicksignRetry() {

    var parsedModel = JSON.parse(finalresponse.result.model);
    var documentRetryViewModel = new FormData();
    documentRetryViewModel.append("File", finalblob, DocumentName);
    documentRetryViewModel.append("Config", JSON.stringify(parsedModel));



    $.ajax({

        url: SendSigningRequest,
        method: 'POST',
        data: documentRetryViewModel,
        headers: {

            'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

        },
        contentType: false,
        processData: false,
        beforeSend: function () {
            updateStepper(0, "success", "", "", "", "");
        },
        complete: function () {
            //$('#overlay8').hide();
        },
        success: function (response) {
            document.getElementById('signingdocid').value = JSON.parse(response.result.model).tempid;
            finalresponse = response;
            if (response.status === "Success") {


                var tempid = response.result.tempid || JSON.parse(response.result.model).tempid;
                updateStepper(1, "success", "", "", "", "", tempid, response);
            } else {

                updateStepper(1, "failed", response.message, "", "", "");
            }
        },
        error: function (err) {
            reject(err);
        }
    });
}

async function createDraggableElementForMobile(type, annotationLayer, annotation, sigAnnData, esealAnnData, qrAnnData, key) {

    var Docrotation = 0;
    var suid1 = '';
    const matchedRecipients = [];
    if (type === 'Signature') {
        var signatureconfig = sigAnnData;
        matchedSignData = {};

        for (const recipient of recipients) {
            for (const alternateSignatory of recipient.alternateSignatories) {
                const ownerSuid = alternateSignatory.suid;
                if (ownerSuid == suid) {
                    matchedRecipients.push(recipient);
                }

            }
        }
        for (const data of matchedRecipients) {
            const ownermatchedSuid = data.suid; // Assuming suid is the property that holds the ID
            suid1 = data.suid;
            for (const key in signatureconfig) {
                if (signatureconfig.hasOwnProperty(key)) {
                    if (key == ownermatchedSuid) {
                        matchedSignData[suid] = signatureconfig[key];
                    }
                }
            }
        }


    }
    else if (type === 'Eseal') {

        var esealconfig = esealAnnData;
        matchedEsealData = {};
        for (const recipient of recipients) {
            for (const alternateSignatory of recipient.alternateSignatories) {
                const ownerSuid = alternateSignatory.suid;
                if (ownerSuid == suid) {
                    matchedRecipients.push(recipient);
                }

            }
        }

        for (const data of matchedRecipients) {
            const ownermatchedSuid = data.suid;
            suid1 = data.suid;
            for (const key in esealconfig) {
                if (esealconfig.hasOwnProperty(key)) {
                    if (key == ownermatchedSuid) {
                        matchedEsealData[suid] = esealconfig[key];
                    }
                }
            }
        }

    }

    else if (type === 'Qrcode') {

        var qrconfig = qrAnnData;
        matchedqrcodeData = {};
        for (const recipient of recipients) {
            for (const alternateSignatory of recipient.alternateSignatories) {
                const ownerSuid = alternateSignatory.suid;
                if (ownerSuid == suid) {
                    matchedRecipients.push(recipient);
                }

            }
        }

        for (const data of matchedRecipients) {
            const ownermatchedSuid = data.suid; // Assuming suid is the property that holds the ID
            email = data.email;
            suid1 = data.suid;
            for (const key in qrconfig) {
                if (qrconfig.hasOwnProperty(key)) {
                    if (key == ownermatchedSuid) {
                        matchedqrcodeData[suid] = qrconfig[key];
                    }
                }
            }
        }
        console.log(matchedqrcodeData);

    }

    if (type === "Signature" && key === suid1) {

        overlaysignflag = true;
        var SIG = '';
        if (Docrotation == 90) {

            const SIG90 =
                '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="27" height="150" viewBox="0 0 27 150"><g id="Group_4534" data-name="Group 4534" transform="translate(754 1451) rotate(-90)"><rect id="Rectangle_6850" data-name="Rectangle 6850" width="150" height="27" rx="5" transform="translate(1301 -754)" fill="#aecf5b"/><g id="Group_4525" data-name="Group 4525" transform="translate(1464.083 -786.275) rotate(15.009)"><rect id="Rectangle_6855" data-name="Rectangle 6855" width="3.041" height="17.855" rx="1.52" transform="translate(-117.696 67.202)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><path id="Rectangle_6856" data-name="Rectangle 6856" d="M.921,0h0a.921.921,0,0,1,.921.921V1.2H0V.921A.921.921,0,0,1,.921,0Z" transform="translate(-117.098 66)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><path id="Rectangle_6857" data-name="Rectangle 6857" d="M0,0H2.21V1.1a1.1,1.1,0,0,1-1.1,1.1h0A1.1,1.1,0,0,1,0,1.1Z" transform="translate(-117.28 85.057)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><line id="Line_23" data-name="Line 23" y2="1.715" transform="translate(-116.175 87.267)" fill="none" stroke="#15161e" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1"/><path id="Path_8480" data-name="Path 8480" d="M-119.12,107.786v-4.349a1.008,1.008,0,0,1,1.008-1.008h.371" transform="translate(0 -34.926)" fill="none" stroke="#15161e" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1"/></g><g id="Group_4530" data-name="Group 4530" transform="translate(9)"><g id="Group_4526" data-name="Group 4526" transform="translate(0 -1)"><circle id="Ellipse_76" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4529" data-name="Group 4529" transform="translate(50 -1)"><circle id="Ellipse_76-2" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-2" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-2" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-2" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-2" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-2" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-2" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-2" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4527" data-name="Group 4527" transform="translate(25 -1)"><circle id="Ellipse_76-3" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-3" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-3" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-3" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-3" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-3" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-3" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-3" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4528" data-name="Group 4528" transform="translate(75 -1)"><circle id="Ellipse_76-4" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-4" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-4" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-4" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-4" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-4" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-4" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-4" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g></g><text id="Sign_here" data-name="Sign here" transform="translate(1339 -735)" fill="#0d0c0c" font-size="17" font-family="Montserrat-SemiBold, Montserrat" font-weight="600"><tspan x="0" y="0">Sign here</tspan></text></g></svg>';
            SIG = SIG90;
        } else if (Docrotation == 270) {
            const SIG270 =
                '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="27" height="150" viewBox="0 0 27 150"><g id="Group_4533" data-name="Group 4533" transform="translate(-727 -1301) rotate(90)"><rect id="Rectangle_6850" data-name="Rectangle 6850" width="150" height="27" rx="5" transform="translate(1301 -754)" fill="#aecf5b"/><path id="Subtraction_6" data-name="Subtraction 6" d="M147,30a4.969,4.969,0,0,0,2.882-.913Z" transform="translate(1301 -757)" fill="#384e00" opacity="0.22"/><g id="Group_4525" data-name="Group 4525" transform="translate(1464.083 -786.275) rotate(15.009)"><rect id="Rectangle_6855" data-name="Rectangle 6855" width="3.041" height="17.855" rx="1.52" transform="translate(-117.696 67.202)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><path id="Rectangle_6856" data-name="Rectangle 6856" d="M.921,0h0a.921.921,0,0,1,.921.921V1.2H0V.921A.921.921,0,0,1,.921,0Z" transform="translate(-117.098 66)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><path id="Rectangle_6857" data-name="Rectangle 6857" d="M0,0H2.21V1.1a1.1,1.1,0,0,1-1.1,1.1h0A1.1,1.1,0,0,1,0,1.1Z" transform="translate(-117.28 85.057)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><line id="Line_23" data-name="Line 23" y2="1.715" transform="translate(-116.175 87.267)" fill="none" stroke="#15161e" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1"/><path id="Path_8480" data-name="Path 8480" d="M-119.12,107.786v-4.349a1.008,1.008,0,0,1,1.008-1.008h.371" transform="translate(0 -34.926)" fill="none" stroke="#15161e" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1"/></g><g id="Group_4530" data-name="Group 4530" transform="translate(9)"><g id="Group_4526" data-name="Group 4526" transform="translate(0 -1)"><circle id="Ellipse_76" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4529" data-name="Group 4529" transform="translate(50 -1)"><circle id="Ellipse_76-2" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-2" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-2" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-2" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-2" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-2" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-2" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-2" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4527" data-name="Group 4527" transform="translate(25 -1)"><circle id="Ellipse_76-3" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-3" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-3" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-3" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-3" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-3" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-3" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-3" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4528" data-name="Group 4528" transform="translate(75 -1)"><circle id="Ellipse_76-4" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-4" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-4" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-4" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-4" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-4" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-4" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-4" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g></g><text id="Sign_here" data-name="Sign here" transform="translate(1339 -735)" fill="#0d0c0c" font-size="17" font-family="Montserrat-SemiBold, Montserrat" font-weight="600"><tspan x="0" y="0">Sign here</tspan></text></g></svg>';
            SIG = SIG270;

        } else if (Docrotation == 180) {
            const SIG180 =
                '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="150" height="27" viewBox="0 0 150 27"><g id="Group_4532" data-name="Group 4532" transform="translate(1451 -727) rotate(180)"><rect id="Rectangle_6850" data-name="Rectangle 6850" width="150" height="27" rx="5" transform="translate(1301 -754)" fill="#aecf5b"/><g id="Group_4525" data-name="Group 4525" transform="translate(1464.083 -786.275) rotate(15.009)"><rect id="Rectangle_6855" data-name="Rectangle 6855" width="3.041" height="17.855" rx="1.52" transform="translate(-117.696 67.202)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><path id="Rectangle_6856" data-name="Rectangle 6856" d="M.921,0h0a.921.921,0,0,1,.921.921V1.2H0V.921A.921.921,0,0,1,.921,0Z" transform="translate(-117.098 66)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><path id="Rectangle_6857" data-name="Rectangle 6857" d="M0,0H2.21V1.1a1.1,1.1,0,0,1-1.1,1.1h0A1.1,1.1,0,0,1,0,1.1Z" transform="translate(-117.28 85.057)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><line id="Line_23" data-name="Line 23" y2="1.715" transform="translate(-116.175 87.267)" fill="none" stroke="#15161e" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1"/><path id="Path_8480" data-name="Path 8480" d="M-119.12,107.786v-4.349a1.008,1.008,0,0,1,1.008-1.008h.371" transform="translate(0 -34.926)" fill="none" stroke="#15161e" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1"/></g><g id="Group_4530" data-name="Group 4530" transform="translate(9)"><g id="Group_4526" data-name="Group 4526" transform="translate(0 -1)"><circle id="Ellipse_76" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4529" data-name="Group 4529" transform="translate(50 -1)"><circle id="Ellipse_76-2" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-2" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-2" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-2" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-2" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-2" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-2" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-2" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4527" data-name="Group 4527" transform="translate(25 -1)"><circle id="Ellipse_76-3" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-3" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-3" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-3" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-3" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-3" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-3" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-3" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4528" data-name="Group 4528" transform="translate(75 -1)"><circle id="Ellipse_76-4" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-4" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-4" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-4" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-4" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-4" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-4" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-4" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g></g><text id="Sign_here" data-name="Sign here" transform="translate(1339 -735)" fill="#0d0c0c" font-size="17" font-family="Montserrat-SemiBold, Montserrat" font-weight="600"><tspan x="0" y="0">Sign here</tspan></text></g></svg>';
            SIG = SIG180;
        } else {
            const SIG0 =
                '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="150" height="27" viewBox="0 0 150 27"><g id="Group_4531" data-name="Group 4531" transform="translate(-1301 754)"><rect id="Rectangle_6850" data-name="Rectangle 6850" width="150" height="27" rx="5" transform="translate(1301 -754)" fill="#aecf5b"/><g id="Group_4525" data-name="Group 4525" transform="translate(1464.083 -786.275) rotate(15.009)"><rect id="Rectangle_6855" data-name="Rectangle 6855" width="3.041" height="17.855" rx="1.52" transform="translate(-117.696 67.202)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><path id="Rectangle_6856" data-name="Rectangle 6856" d="M.921,0h0a.921.921,0,0,1,.921.921V1.2H0V.921A.921.921,0,0,1,.921,0Z" transform="translate(-117.098 66)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><path id="Rectangle_6857" data-name="Rectangle 6857" d="M0,0H2.21V1.1a1.1,1.1,0,0,1-1.1,1.1h0A1.1,1.1,0,0,1,0,1.1Z" transform="translate(-117.28 85.057)" fill="none" stroke="#15161e" stroke-miterlimit="10" stroke-width="1"/><line id="Line_23" data-name="Line 23" y2="1.715" transform="translate(-116.175 87.267)" fill="none" stroke="#15161e" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1"/><path id="Path_8480" data-name="Path 8480" d="M-119.12,107.786v-4.349a1.008,1.008,0,0,1,1.008-1.008h.371" transform="translate(0 -34.926)" fill="none" stroke="#15161e" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1"/></g><g id="Group_4530" data-name="Group 4530" transform="translate(9)"><g id="Group_4526" data-name="Group 4526" transform="translate(0 -1)"><circle id="Ellipse_76" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4529" data-name="Group 4529" transform="translate(50 -1)"><circle id="Ellipse_76-2" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-2" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-2" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-2" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-2" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-2" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-2" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-2" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4527" data-name="Group 4527" transform="translate(25 -1)"><circle id="Ellipse_76-3" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-3" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-3" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-3" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-3" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-3" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-3" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-3" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g><g id="Group_4528" data-name="Group 4528" transform="translate(75 -1)"><circle id="Ellipse_76-4" data-name="Ellipse 76" cx="1" cy="1" r="1" transform="translate(1324 -730)"/><circle id="Ellipse_83-4" data-name="Ellipse 83" cx="1" cy="1" r="1" transform="translate(1336 -730)"/><circle id="Ellipse_79-4" data-name="Ellipse 79" cx="1" cy="1" r="1" transform="translate(1330 -730)"/><circle id="Ellipse_81-4" data-name="Ellipse 81" cx="1" cy="1" r="1" transform="translate(1342 -730)"/><circle id="Ellipse_77-4" data-name="Ellipse 77" cx="1" cy="1" r="1" transform="translate(1327 -730)"/><circle id="Ellipse_82-4" data-name="Ellipse 82" cx="1" cy="1" r="1" transform="translate(1339 -730)"/><circle id="Ellipse_78-4" data-name="Ellipse 78" cx="1" cy="1" r="1" transform="translate(1333 -730)"/><circle id="Ellipse_80-4" data-name="Ellipse 80" cx="1" cy="1" r="1" transform="translate(1345 -730)"/></g></g><text id="Sign_here" data-name="Sign here" transform="translate(1339 -735)" fill="#0d0c0c" font-size="17" font-family="Montserrat-SemiBold, Montserrat" font-weight="600"><tspan x="0" y="0">Sign here</tspan></text></g></svg>';
            SIG = SIG0;
        }

        const element = document.createElement('div');
        element.classList.add('draggable');
        element.style.position = 'absolute';
        element.style.pointerEvents = 'auto';
        element.style.border = 'none';
        element.style.zIndex = '1000';
        const rect1 = annotationLayer.getBoundingClientRect();
        if (rotationDataval === 90 || rotationDataval === 270) {
            scaleX = originalWidth / rect1.height;
            scaleY = originalHeight / rect1.width;
        } else {
            scaleX = originalWidth / rect1.width;
            scaleY = originalHeight / rect1.height;
        }

        const wratio = (annotation.width / originalWidth);
        const hratio = (annotation.height / originalHeight);
        const lratio = ((annotation.posX) / originalWidth);
        const tratio = ((annotation.posY / originalHeight));

        const annotation_width = annotation.width / scaleX;
        const annotation_height = annotation.height / scaleY;

        const annotation_x = (annotation.posX / scaleX);
        const annotation_y = (annotation.posY / scaleY)



        element.setAttribute('data-wpercent', wratio)
        element.setAttribute('data-hpercent', hratio)
        element.setAttribute('data-lpercent', lratio)
        element.setAttribute('data-tpercent', tratio)

        const content = document.createElement('div');
        content.classList.add('draggable-content');

        element.style.left = annotation_x + 'px';
        element.style.top = annotation_y + 'px';
        const input = document.createElement('div');
        // input.style.border = "1px solid #44aad1";
        input.id = "Signature";
        //input.style.textAlign = 'center';

        input.style.width = annotation_width + 'px';
        input.style.height = annotation_height + 'px';

        input.textContent = 'Signature';
        input.innerHTML = SIG;
        input.onclick = () => { SaveQuickSign(viewName); };
        input.style.cursor = "pointer";







        content.appendChild(input);
        element.appendChild(content);


        return element;
    }
    else if (type === 'Eseal' && key === suid1) {

        overlayesealflag = true;
        var Eseal = '';
        if (Docrotation == 180) {
            Eseal =
                "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI3MS4yNyIgaGVpZ2h0PSI2NC42MTgiIHZpZXdCb3g9IjAgMCA3MS4yNyA2NC42MTgiPg0KICA8ZyBpZD0iR3JvdXBfOTc1ODMiIGRhdGEtbmFtZT0iR3JvdXAgOTc1ODMiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zOTYwLjg2NSAtNDg3MC41KSI+DQogICAgPHBhdGggaWQ9IlVuaW9uXzEiIGRhdGEtbmFtZT0iVW5pb24gMSIgZD0iTTIzLjUzNCw2Mi4wNzlBMzIuMzM0LDMyLjMzNCwwLDAsMSw0LjcsMzkuOTExSDJhMiwyLDAsMCwxLTItMlYyMS45NTVhMiwyLDAsMCwxLDItMkg2LjI0N2wuMDkzLS4yMjNhMzIuMzI4LDMyLjMyOCwwLDAsMSw1OS41NCwwbC4wOTMuMjIzaDMuM2EyLDIsMCwwLDEsMiwyVjM3LjkxMmEyLDIsMCwwLDEtMiwySDY3LjUyMkEzMi4zNDEsMzIuMzQxLDAsMCwxLDIzLjUzNCw2Mi4wNzlabTEyLjU3Ny02Ljk2M2EyMi44NDcsMjIuODQ3LDAsMCwwLDIxLjUtMTUuMkgxNC42MDhBMjIuODQ4LDIyLjg0OCwwLDAsMCwzNi4xMTEsNTUuMTE2Wm0xOS4xNjMtMzUuMTZhMjIuNzkyLDIyLjc5MiwwLDAsMC0zOC4zMjcsMFoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQwMzIuMTM1IDQ5MzUuMTE4KSByb3RhdGUoMTgwKSIgZmlsbD0iIzhhYmIyYSIvPg0KICAgIDx0ZXh0IGlkPSJFLVNFQUwiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQwMjEuNjgyIDQ5MDAuMTU3KSByb3RhdGUoMTgwKSIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSIxNiIgZm9udC1mYW1pbHk9Ik1hdHRlby1TZW1pYm9sZCwgTWF0dGVvIiBmb250LXdlaWdodD0iNjAwIj48dHNwYW4geD0iMCIgeT0iMCIgZmlsbD0iIzAwMCI+RTwvdHNwYW4+PHRzcGFuIHk9IjAiIGZpbGw9IiNmZmYiPi1TRUFMPC90c3Bhbj48L3RleHQ+DQogIDwvZz4NCjwvc3ZnPg0K";
        } else if (Docrotation == 90) {
            Eseal =
                "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NC42MTgiIGhlaWdodD0iNzEuMjcxIiB2aWV3Qm94PSIwIDAgNjQuNjE4IDcxLjI3MSI+DQogIDxnIGlkPSJHcm91cF85NzU4MSIgZGF0YS1uYW1lPSJHcm91cCA5NzU4MSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNjQuNjE4KSByb3RhdGUoOTApIj4NCiAgICA8cGF0aCBpZD0iVW5pb25fMSIgZGF0YS1uYW1lPSJVbmlvbiAxIiBkPSJNMjMuNTM0LDYyLjA3OUEzMi4zMzQsMzIuMzM0LDAsMCwxLDQuNywzOS45MTFIMmEyLDIsMCwwLDEtMi0yVjIxLjk1NWEyLDIsMCwwLDEsMi0ySDYuMjQ3bC4wOTMtLjIyM2EzMi4zMjgsMzIuMzI4LDAsMCwxLDU5LjU0LDBsLjA5My4yMjNoMy4zYTIsMiwwLDAsMSwyLDJWMzcuOTEyYTIsMiwwLDAsMS0yLDJINjcuNTIyQTMyLjM0MSwzMi4zNDEsMCwwLDEsMjMuNTM0LDYyLjA3OVptMTIuNTc4LTYuOTYzYTIyLjg0NywyMi44NDcsMCwwLDAsMjEuNS0xNS4ySDE0LjYwOEEyMi44NDksMjIuODQ5LDAsMCwwLDM2LjExMiw1NS4xMTZabTE5LjE2My0zNS4xNmEyMi43OTIsMjIuNzkyLDAsMCwwLTM4LjMyNywwWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAwKSIgZmlsbD0iIzhhYmIyYSIvPg0KICAgIDx0ZXh0IGlkPSJFLVNFQUwiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDYzLjQ1NCAyNC45NjEpIHJvdGF0ZSgxODApIiBmaWxsPSIjZmZmIiBmb250LXNpemU9IjE2IiBmb250LWZhbWlseT0iTWF0dGVvLVNlbWlib2xkLCBNYXR0ZW8iIGZvbnQtd2VpZ2h0PSI2MDAiPjx0c3BhbiB4PSIwIiB5PSIwIiBmaWxsPSIjMDAwIj5FPC90c3Bhbj48dHNwYW4geT0iMCIgZmlsbD0iI2ZmZiI+LVNFQUw8L3RzcGFuPjwvdGV4dD4NCiAgPC9nPg0KPC9zdmc+DQo=";
        } else if (Docrotation == 270) {
            Eseal =
                "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NC42MTgiIGhlaWdodD0iNzEuMjcxIiB2aWV3Qm94PSIwIDAgNjQuNjE4IDcxLjI3MSI+DQogIDxnIGlkPSJHcm91cF85NzU4MiIgZGF0YS1uYW1lPSJHcm91cCA5NzU4MiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTQwMjQuMTkxIC00OTU0LjE3NCkiPg0KICAgIDxwYXRoIGlkPSJVbmlvbl8xIiBkYXRhLW5hbWU9IlVuaW9uIDEiIGQ9Ik0yMy41MzQsNjIuMDc5QTMyLjQyNiwzMi40MjYsMCwwLDEsNi4zNDEsNDQuODg2bC0uMDkzLS4yMjNIMmEyLDIsMCwwLDEtMi0yVjI2LjcwN2EyLDIsMCwwLDEsMi0ySDQuN2EzMi4zMjYsMzIuMzI2LDAsMCwxLDYxLjE4Mi00Ljk3NCwzMi4wNzcsMzIuMDc3LDAsMCwxLDEuNjQyLDQuOTc0aDEuNzQ5YTIsMiwwLDAsMSwyLDJWNDIuNjYzYTIsMiwwLDAsMS0yLDJoLTMuM2wtLjA5My4yMjNBMzIuMzQ2LDMyLjM0NiwwLDAsMSwyMy41MzQsNjIuMDc5Wm0xMi41NzgtNi45NjNBMjIuOCwyMi44LDAsMCwwLDU1LjI3NCw0NC42NjNIMTYuOTQ3QTIyLjgwNywyMi44MDcsMCwwLDAsMzYuMTEyLDU1LjExNlptMjEuNS0zMC40MDlhMjIuODA4LDIyLjgwOCwwLDAsMC00My4wMDYsMFoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQwODguODEgNDk1NC4xNzQpIHJvdGF0ZSg5MCkiIGZpbGw9IiM4YWJiMmEiLz4NCiAgICA8dGV4dCBpZD0iRS1TRUFMIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0MDQ5LjE1MyA0OTY0LjYyNykgcm90YXRlKDkwKSIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSIxNiIgZm9udC1mYW1pbHk9Ik1hdHRlby1TZW1pYm9sZCwgTWF0dGVvIiBmb250LXdlaWdodD0iNjAwIj48dHNwYW4geD0iMCIgeT0iMCIgZmlsbD0iIzAwMCI+RTwvdHNwYW4+PHRzcGFuIHk9IjAiIGZpbGw9IiNmZmYiPi1TRUFMPC90c3Bhbj48L3RleHQ+DQogIDwvZz4NCjwvc3ZnPg0K";
        } else {
            Eseal =
                "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI3MS4yNyIgaGVpZ2h0PSI2NC42MTgiIHZpZXdCb3g9IjAgMCA3MS4yNyA2NC42MTgiPg0KICA8ZyBpZD0iR3JvdXBfOTc1NzgiIGRhdGEtbmFtZT0iR3JvdXAgOTc1NzgiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xIC00KSI+DQogICAgPHBhdGggaWQ9IlVuaW9uXzEiIGRhdGEtbmFtZT0iVW5pb24gMSIgZD0iTTIzLjUzMyw2Mi4wOEEzMi40MjYsMzIuNDI2LDAsMCwxLDYuMzQsNDQuODg3bC0uMDkzLS4yMjNIMmEyLDIsMCwwLDEtMi0yVjI2LjcwOGEyLDIsMCwwLDEsMi0ySDQuN0EzMi4zMjUsMzIuMzI1LDAsMCwxLDY1Ljg4LDE5LjczNGEzMi4wNTksMzIuMDU5LDAsMCwxLDEuNjQyLDQuOTczaDEuNzQ4YTIsMiwwLDAsMSwyLDJWNDIuNjY0YTIsMiwwLDAsMS0yLDJoLTMuM2wtLjA5My4yMjNBMzIuMzQ2LDMyLjM0NiwwLDAsMSwyMy41MzMsNjIuMDhaTTM2LjExLDU1LjExN0EyMi44MDYsMjIuODA2LDAsMCwwLDU1LjI3Myw0NC42NjNIMTYuOTQ3QTIyLjgwNiwyMi44MDYsMCwwLDAsMzYuMTEsNTUuMTE3Wm0yMS41LTMwLjQwOWEyMi44MDgsMjIuODA4LDAsMCwwLTQzLjAwNiwwWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMSA0KSIgZmlsbD0iIzhhYmIyYSIvPg0KICAgIDx0ZXh0IGlkPSJFLVNFQUwiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDExLjQ1MyA0My42NTcpIiBmaWxsPSIjZmZmIiBmb250LXNpemU9IjE2IiBmb250LWZhbWlseT0iTWF0dGVvLVNlbWlib2xkLCBNYXR0ZW8iIGZvbnQtd2VpZ2h0PSI2MDAiPjx0c3BhbiB4PSIwIiB5PSIwIiBmaWxsPSIjMDAwIj5FPC90c3Bhbj48dHNwYW4geT0iMCIgZmlsbD0iI2ZmZiI+LVNFQUw8L3RzcGFuPjwvdGV4dD4NCiAgPC9nPg0KPC9zdmc+DQo=";
        }
        const element = document.createElement('div');
        element.classList.add('draggable');
        element.style.position = 'absolute';
        element.style.pointerEvents = 'auto';
        element.style.border = 'none';
        element.style.zIndex = '1000';

        const rect1 = annotationLayer.getBoundingClientRect();
        if (rotationDataval === 90 || rotationDataval === 270) {
            scaleX = originalWidth / rect1.height;
            scaleY = originalHeight / rect1.width;
        } else {
            scaleX = originalWidth / rect1.width;
            scaleY = originalHeight / rect1.height;
        }

        const wratio = (annotation.width / originalWidth);
        const hratio = (annotation.height / originalHeight);
        const lratio = ((annotation.posX) / originalWidth);
        const tratio = ((annotation.posY / originalHeight));

        const annotation_width = annotation.width / scaleX;
        const annotation_height = annotation.height / scaleY

        const annotation_x = (annotation.posX / scaleX);
        const annotation_y = (annotation.posY / scaleY);



        element.setAttribute('data-wpercent', wratio)
        element.setAttribute('data-hpercent', hratio)
        element.setAttribute('data-lpercent', lratio)
        element.setAttribute('data-tpercent', tratio)
        const content = document.createElement('div');
        content.classList.add('draggable-content');

        element.style.left = annotation_x + 'px';
        element.style.top = annotation_y + 'px';

        element.style.padding = '0';
        const input = document.createElement('div');

        input.style.width = annotation_width + 'px';
        input.style.height = annotation_height + 'px';

        input.id = 'Eseal';


        const img = document.createElement('img');
        img.src = Eseal;
        input.appendChild(img);







        content.appendChild(input);

        element.appendChild(content);


        return element;
    }
    else if (type === 'Qrcode' && key === suid1) {

        overlayesealflag = true;

        var Qrcode = "";
        if (Docrotation == 180) {
            Qrcode =
                "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI1OS45MDIiIHZpZXdCb3g9IjAgMCA2MCA1OS45MDIiPg0KICA8ZyBpZD0iX2Rvd24iIGRhdGEtbmFtZT0iIGRvd24iIHRyYW5zZm9ybT0idHJhbnNsYXRlKDYwIDU5LjkwMikgcm90YXRlKDE4MCkiPg0KICAgIDxnIGlkPSJHcm91cF8zNDMzIiBkYXRhLW5hbWU9Ikdyb3VwIDM0MzMiPg0KICAgICAgPGcgaWQ9Ikdyb3VwXzM0MDUiIGRhdGEtbmFtZT0iR3JvdXAgMzQwNSI+DQogICAgICAgIDxnIGlkPSJHcm91cF8zNDM0IiBkYXRhLW5hbWU9Ikdyb3VwIDM0MzQiPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTUiIGRhdGEtbmFtZT0iUGF0aCA1MTE1IiBkPSJNMTAwLjA3NSw2NS4wMTJoMi44NTlWNjIuOTQ5YzAtLjcxNCwwLS43MS42OS0uNzE5LjU3Ny0uMDA3LDEuMTU1LS4wMSwxLjczMS0uMDQ1LjMtLjAxOS40MjQuMDkyLjQxOS4zNzktLjAxMy42NjcsMCwxLjMzNy0uMDQ4LDItLjAyNy4zODUuMDg2LjUxOS40Ny41LjY2Ny0uMDI3LDEuMzM3LS4wMzYsMi0uMDE4LjMyMi4wMDguNDMxLS4xLjQyLS40MTQtLjAyMi0uNjY3LS4wMDctMS4zMzYtLjAzMi0yLS4wMTItLjMzOS4xMTEtLjQ1OC40NS0uNDQ3LjY2OC4wMjEsMS4zMzcuMDI1LDIsMCwuMzE5LS4wMTEuNDM1LjA4NS40MjEuNDA5LS4wMjkuNjY3LS4wMTQsMS4zMzctLjA0NywyLS4wMTUuMy4wNC40NTguMzguNDUyLjgtLjAxMywxLjYwOSwwLDIuNDY1LDB2Mi44MTRoLS41OGMtLjYyMywwLTEuMjQ3LS4wMTMtMS44NjguMDE2LS4xMjMuMDA1LS4zMzguMTcyLS4zNDEuMjctLjAyNy44NDgtLjAxNiwxLjctLjAxNiwyLjZoMi44djIuOTMySDExMS40N2MwLC44NzUsMCwxLjcwNiwwLDIuNTM2LDAsLjMuMjI0LjI3Mi40MjEuMjcuNjY5LS4wMDgsMS4zMzgsMCwyLS4wMzMuMzM3LS4wMTYuNDYyLjA4Ni40NDkuNDMyLS4wMjYuNjY3LS4wMzMsMS4zMzYtLjAxMiwyLC4wMTEuMzQ4LS4xMTcuNDUzLS40NDcuNDQ2LS42ODMtLjAxNS0xLjM2OC0uMDE1LTIuMDUuMDEtLjExMSwwLS4zMDguMTYtLjMxLjI1LS4wMjQuODMzLS4wMTQsMS42NjYtLjAxNCwyLjU1MmgyLjc4MVY4Ny44OGgtNS42NWMwLS44MTgtLjAxOS0xLjYxOC4wMDgtMi40MTcuMDEzLS4zOTEtLjEzMy0uNDkxLS41LS40NzktLjc1Ny4wMjQtMS41MTYuMDA3LTIuMzMuMDA3LDAtLjk1MywwLTEuODg3LDAtMi44MmgyLjgxN2MwLS45LjAwOC0xLjc2Ni0uMDE0LTIuNjI2LDAtLjA3Ny0uMi0uMjA5LS4zMS0uMjEzcS0xLjExNS0uMDM5LTIuMjMxLS4wMjFjLS4xLDAtLjI3NC4xMjktLjI3NS4yLS4wMDcuODkxLjAxMiwxLjc4Mi4wMjUsMi42NzJIMTAzVjg3LjloMi43NzVjMCwuOTIuMDExLDEuNzk0LS4wMTcsMi42NjYsMCwuMDkxLS4yNDYuMjUtLjM3Ny4yNDktMi40MTUtLjAwNy00LjgzLS4wMzktNy4yNDQtLjA1NC0uOTI5LS4wMDYtLjk0OC4wMjUtLjkyNS45MzQuMDEzLjUuMDE4LDEsLjA0NSwxLjUuMDE2LjI5My0uMDg3LjQwOC0uMzg4LjQtLjgtLjAxNC0xLjYwNSwwLTIuNSwwLDAsLjkzMi0uMDA3LDEuNzkzLjAxMiwyLjY1MywwLC4wNzQuMTczLjIwNi4yNjcuMjA2LDEuNjg2LDAsMy4zNzMtLjAxOCw1LjA1OS0uMDI4LjI2NSwwLC4zNzEtLjEwNi4zNjMtLjM4Ni0uMDE4LS42NTMuMDEyLTEuMzA3LS4wMTItMS45Ni0uMDE0LS4zNjUuMDg0LS41MTIuNDc3LS41MSwyLjU4My4wMTEsNS4xNjYsMCw3Ljc0OSwwLC4yNTEsMCwuMzYyLjA3Ni4zNjEuMzM1LDAsLjctLjAwNiwxLjQuMDEzLDIuMS4wMS4zNjctLjE1NC40Ni0uNS40NTktMi42LS4wMS01LjIsMC03LjgsMC0uMDc1LDAtLjE1LjAwNy0uMjc2LjAxM3YyLjc2M0g4NS44Njh2LTIuOEg4OGMuNzIyLDAsLjcxOCwwLC43MDgtLjcxMS0uMDA4LS41OTItLjAyNy0xLjE4NiwwLTEuNzc3LjAxNi0uMzMtLjEwOS0uMzY5LS4zOTUtLjM2Mi0uOC4wMi0xLjYwNy4wMDctMi40ODEuMDA3LDAtMS45MTcsMC0zLjc5MiwwLTUuNjY4bC0uMDEzLjAxNUg4OC43Vjg0Ljk5M2MuNzksMCwxLjUxNS0uMDMyLDIuMjM1LjAxMS40NzkuMDI4LjYtLjE0LjU3Ny0uNTkxLS4wMjgtLjU5LjAwOS0xLjE4NC4wMzYtMS43NzUuMDE1LS4zMzctLjA3MS0uNS0uNDU3LS40NzgtLjY4Mi4wMzItMS4zNjcuMDA1LTIuMDUuMDA4LS4zLDAtLjQyMi0uMDgxLS4zOTQtLjQzMWExOC45NDQsMTguOTQ0LDAsMCwwLC4wMzItMS45NTNjLS4wMDctLjMyMS4wNTktLjQ2NC40MjEtLjQ2MSwxLjcxNS4wMTYsMy40My4wMDcsNS4yMTQuMDA3Vjg0Ljk5Yy0uODMsMC0xLjYxNy4wMTUtMi40LS4wMDctLjMyNi0uMDA5LS40MjQuMTA4LS40MTcuNDE4LjAxNi42NjgtLjAxNSwxLjMzOC4wMTcsMiwuMDIuNDE3LS4xNDMuNTIzLS41My41MDktLjcyNy0uMDI1LTEuNDU1LS4wMDctMi4yNS0uMDA3djIuODQ0Yy4yMjcsMCwuNDk0LDAsLjc2MSwwLDIuNDYuMDE4LDQuOTIuMDQsNy4zOC4wNDUuMTIzLDAsLjM1NC0uMTM3LjM1NC0uMjEzLjAxMi0uODQ4LS4wMTEtMS43LS4wMy0yLjU0NSwwLS4wMzYtLjA1Mi0uMDctLjA4LS4xMDZsLS4wMS4wMTFoMi45NTl2LS42OTJjMC0xLjUzNS4wMTMtMy4wNy0uMDEtNC42LS4wMDYtLjM3OC4xMzktLjQ3Ni40NzMtLjQ3My44LjAwOSwxLjYsMCwyLjQyOSwwVjc5LjM2Yy0uMTQyLS4wMTEtLjI3My0uMDI5LS40LS4wMjktMS42MjYsMC0zLjI1Mi0uMDEtNC44NzguMDE0LS4zODEuMDA2LS41MDYtLjEtLjUtLjQ4LjAyMi0uNzcxLjAwNy0xLjU0Mi4wMDctMi4zNzYtLjgwNywwLTEuNTYzLS4wMTUtMi4zMTcuMDA2LS4zODUuMDExLS41NjUtLjA0LS41MzQtLjUxNi4wNDgtLjc1NC0uMDE1LTEuNTE2LS4wMzItMi4yNzRsLS4wMTIuMDE1Yy42NzgtLjAzNCwxLjM1Ny0uMDcyLDIuMDM2LS4xLjI1NS0uMDExLjUxMiwwLC44MjYsMFY3MC43OGg1Ljc5NVY2Ny44NjloLTIuODYxVjY1Wm01LjcxMyw1Ljc1NmMuODY3LDAsMS43MTUuMDEsMi41NjItLjAxNC4wOTUsMCwuMjU5LS4yLjI2My0uMzA5LjAyNS0uNzQzLjAxMi0xLjQ4OC4wMTgtMi4yMzEsMC0uMjUyLS4xMDctLjM0Ny0uMzYtLjM0NC0uNzI4LjAxMS0xLjQ1Ni0uMDA2LTIuMTg0LjAxNS0uMSwwLS4yODQuMTQ5LS4yODYuMjMxLS4wMjEuODYxLS4wMTMsMS43MjQtLjAxMywyLjY1Mm0yLjg0OCw1LjdjMC0uOSwwLTEuNzUsMC0yLjYsMC0uMjUyLS4xMzMtLjMtLjM1LS4yODctLjcyNC4wMzQtMS40NDguMDY2LTIuMTczLjA3OS0uMjU5LDAtLjMzOS4xMS0uMzQxLjM1NS0uMDA3LjcxLS4wNDIsMS40MjEtLjAzNiwyLjEzMSwwLC4xMDcuMTU5LjMuMjQ5LjMuODU5LjAyMywxLjcxOC4wMTQsMi42NDkuMDE0bS04LjYtMi43NzNIOTcuMjI5djIuNzc0aDIuODA3WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTU0LjM0NiAtMzkuMzc3KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTYiIGRhdGEtbmFtZT0iUGF0aCA1MTE2IiBkPSJNMjUuNywzOC43MzljLjAxNC4yMzkuMDM5LjQ3OS4wNDEuNzE4LjAwOCwxLjUzNC4wMTgsMy4wNjcuMDEyLDQuNiwwLC4zLjA1Ni40NDkuNC40NC42NjgtLjAxNywxLjMzNi4wMDgsMiwuMDExLjM2MiwwLC41MzctLjEzMy41MTctLjU0Ni0uMDM2LS43NC0uMDEtMS40ODItLjAxLTIuMjY2Ljc3NiwwLDEuNTE0LDAsMi4yNTMsMCwuNTg2LDAsLjY1MS0uMDY0LjY1LS42NDcsMC0uNzQxLDAtMS40ODEsMC0yLjI1Mi4xNy0uMDA4LjI4Ny0uMDE3LjQtLjAxNywxLjYxMSwwLDMuMjIyLjAwNiw0LjgzMy0uMDA2LjMxMywwLC40Mi4wODUuNDE3LjQxMS0uMDE0LDEuNjEtLjAxNiwzLjIyMi4wMDgsNC44MzIuMDA2LjQxNy0uMTMzLjUxOC0uNTI2LjUtLjYzNy0uMDMyLTEuMjc2LDAtMS45MTQtLjAxMS0uMzU4LS4wMDctLjQ3OS4xNDctLjQ2NC41LjAyOS42NTEuMDI1LDEuMy4wMzUsMS45NTUuMDA1LjMyMi0uMTc0LjQwNy0uNDY3LjQtLjY2OC0uMDEzLTEuMzM4LS4wMjQtMi4wMDUsMC0uMzU1LjAxMy0uMzkzLS4xNDQtLjM4LS40MzkuMDMtLjY4Mi4wMzItMS4zNjYuMDQxLTIuMDQ5LDAtLjEzMi0uMDE5LS4yNjYtLjAzLS40LS44NzgsMC0xLjcyNC0uMDEyLTIuNTY4LjAxNi0uMSwwLS4yNy4yMjEtLjI3NS4zNDQtLjAyNi42ODMtLjAyOCwxLjM2OCwwLDIuMDUxLjAxMi4zMzItLjA3Ny40NjQtLjQyNy40NTQtLjY4My0uMDIxLTEuMzY4LDAtMi4wNTEtLjAwOC0uMjg4LDAtLjQuMDk0LS40LjQsMCwuNjY4LDAsMS4zMzgtLjA1MywyLS4wMzEuNDMyLjE2MS41LjUzLjQ5NCwxLjY3MS0uMDIxLDMuMzQzLS4wMjEsNS4wMTQtLjAyOGguMjczVjUzLjAxaDEuODU5YzEuMTI0LDAsMi4yNDktLjAxMywzLjM3MywwLC4zMzIsMCwuNDU2LS4wODcuNDQ0LS40MzgtLjAyNC0uNjgzLS4wMS0xLjM2OC4wMDctMi4wNTEuMDA4LS4zLS4xLS4zOS0uNC0uMzc1LS43MTIuMDM1LTEuNDI3LjA0Mi0yLjE0LjAzLS4xMjcsMC0uMzU5LS4xNDEtLjM2MS0uMjIyLS4wMjctLjg1OS0uMDE3LTEuNzItLjAxNy0yLjYsMS4xNCwwLDIuMTY5LDAsMy4yLDAsLjcyOSwwLDEuNDU5LjAwNiwyLjE4OC0uMDE1LjI3NS0uMDA4LjM4LjA3Mi4zOC4zNTVxMCwyLjUyOS4wMTMsNS4wNTljMCwuMzEyLS4yMTIuMjg0LS40MDYuMjg1LS43ODksMC0xLjU3NywwLTIuNDY1LDAsMCwuNTIzLDAsMS4wNjIsMCwxLjYtLjAxMSwxLjI3Ny0uMDEzLDEuMjc3LTEuMjY5LDEuMjc3SDI4LjY3M2MwLDEsMCwxLjk2NCwwLDIuOTNIMjUuNzY3YzAsLjg2Ny0uMDA2LDEuNzExLjAxLDIuNTU0YS4zMTcuMzE3LDAsMCwwLC4yMjkuMjA2Yy44NzIuMDE1LDEuNzQ1LjAxLDIuNjUxLjAxVjU4LjgzNmMxLjc3NC0uMDIzLDMuNTQ4LS4wNDIsNS4zMjEtLjA3My4yOTMtLjAwNS40NDkuMDUyLjQzOS40LS4wMjEuNy0uMDEyLDEuNCwwLDIuMDkzLjAwNS4yOTMtLjEwNy40MDYtLjQuNC0uNzg3LS4wMTItMS41NzQsMC0yLjQ0MSwwVjYzLjRjMCwxLjA3LDAsMS4wNjYtMS4wODgsMS4wNjEtLjUzMSwwLTEuMDYxLjAxNC0xLjU5Mi4wMjRhMi4zMzMsMi4zMzMsMCwwLDAtLjI0Mi4wMzZ2Mi44bC4wMDktLjAxYy0xLjczMS4wMDYtMy40NjMsMC01LjE5NC4wMjYtLjM3NS4wMDYtLjUtLjA3Ny0uNS0uNDcyLjAxOC0xLjU2NS4wMDYtMy4xMy0uMDA4LTQuNjk0LS4wMDYtLjU5My0uMDcxLS42LS42MDUtLjU3MS0xLjU2MS4wNy0zLjEyOC4wMTgtNC42OTMuMDI1LS4zMiwwLS40MTQtLjEyNy0uNDA1LS40MzkuMDIxLS43NTcuMDA3LTEuNTE1LjAwNy0yLjM1LjMyMS0uMDIzLjYyOS0uMDY1LjkzNy0uMDY1LDIuMzg1LDAsNC43NzEuMDA3LDcuMTU1LjAzNy4zNTYsMCwuNDU2LS4xMS40NTQtLjQzMS0uMDA3LS44LDAtMS42LDAtMi40MzItLjIyOS0uMDE0LS4zNjEtLjAzLS40OTMtLjAzLTIuNTIyLDAtNS4wNDUuMDA2LTcuNTY3LS4wMDgtLjM3MywwLS41MDcuMDg4LS40ODMuNDgzLjAzOC42MzYuMDE2LDEuMjc0LjAxNCwxLjkxMiwwLC4zNzgtLjE5NC41MzktLjU3NC41MzMtLjc0LS4wMTItMS40ODIsMC0yLjI3OSwwdjIuOGMtLjYyOCwwLTEuMiwwLTEuNzcyLDAtMS4xODUsMC0yLjM3LS4wMTQtMy41NTUtLjAxMy0uMzI1LDAtLjQzMS0uMTA2LS40MjMtLjQ1OC4wMzEtMS41MTkuMDI3LTMuMDM4LjAxOS00LjU1OGE0LjAwOCw0LjAwOCwwLDAsMC0uMTMxLS43MWgyLjkxNVY1MC4xODZjLS43MjksMC0xLjQyNSwwLTIuMTIxLDAtLjcxNSwwLS43MDctLjAwOC0uNzE0LjcyNi0uMDE4LDEuNjY2LS4wNDQsMy4zMzItLjA2Niw1SDUuODU4Yy0uMDE1LjIxNS0uMDM5LjM5Mi0uMDM4LjU2OC4wMTEsMS41OC4wMjEsMy4xNjEuMDQ2LDQuNzQxLjAwNS4zMDktLjA4My40NDMtLjQxMS40MzUtLjctLjAxOC0xLjQtLjAxNC0yLjEtLjAwNi0uMjU2LDAtLjQtLjA2Ny0uNC0uMzU1LjAwNS0xLjc3NCwwLTMuNTQ4LDAtNS4zNjguODQ2LDAsMS42MzMtLjAxNiwyLjQxOS4wMDcuMzUyLjAxLjQ5LS4wODguNDc5LS40NTgtLjAyMi0uOC0uMDA3LTEuNi0uMDA3LTIuNDI3LS44MzksMC0xLjYzOS0uMDI2LTIuNDM2LjAxMi0uMzcxLjAxOC0uNDc5LS4wNzUtLjQ2Ny0uNDQyLjAyNC0uOC4wMDctMS42LjAwNy0yLjQzN0guMTMyYzAtLjg2Ni0uMDExLTEuNy4wMTQtMi41MjcsMC0uMS4xOTEtLjI1MS4zMTQtLjI3NmEzLjQyOCwzLjQyOCwwLDAsMSwuNjgxLS4wMTNjNC4yNywwLDguNTQsMCwxMi44MS0uMDE1LjQsMCwuNDk0LjEzNC40ODYuNS0uMDE5Ljc3Mi0uMDA2LDEuNTQ1LS4wMDYsMi4zNDdoMi43NjJ2Mi43NjlhMi41NjgsMi41NjgsMCwwLDAsLjM2MS4wNjJjMS42NTYuMDEyLDMuMzEyLjAxNyw0Ljk2OC4wMzIuMzI0LDAsLjUtLjA2Ni40ODYtLjQ1Ny0uMDM0LS43NDMtLjAxNy0xLjQ4OC0uMDI2LTIuMjMzYTEuMSwxLjEsMCwwLDAtLjA1Ni0uMjI5SDE3LjI2OWMwLS44NzksMC0xLjcsMC0yLjUxNCwwLS4zMzYuMjY1LS4yNjYuNDY3LS4yNjZxMy4xOTEsMCw2LjM4My4wMTNjLjUyOCwwLDEuMDU3LDAsMS42MzksMHYtMi44NWMtLjg1MSwwLTEuNjM3LS4wMTctMi40MjIuMDA4LS4zNDIuMDEtLjQzMi0uMDgzLS40MjUtLjQzMy4wMjktMS40NzQuMDIyLTIuOTQ4LjAyOC00LjQyMiwwLS4yODQsMC0uNTY3LDAtLjkyNGgyLjc2NGwtLjAwOC0uMDA3bTUuODczLDNjMCwuNzgxLjAyMiwxLjU1MS0uMDEsMi4zMTgtLjAxNS4zNTguMTI1LjQ1MS40MzkuNDQ4LjY1Mi0uMDA4LDEuMy0uMDI3LDEuOTU1LDAsLjMxNy4wMTUuNDE1LS4xMi40MTUtLjM4NCwwLS43MjcsMC0xLjQ1NS0uMDM2LTIuMTgxYS40NTguNDU4LDAsMCwwLS4zMzEtLjNjLS43ODYuMDA4LTEuNTcuMDU2LTIuNDMyLjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0wLjA4MiAtMjQuNTMyKSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTciIGRhdGEtbmFtZT0iUGF0aCA1MTE3IiBkPSJNMTI4LjkwNiwyMC4wM0gxMDguOTU3Vi4xNGgxOS45NDlabS0yLjg1LTIuOFYyLjk3OUgxMTEuODM3YTEuMDg0LDEuMDg0LDAsMCwwLS4wMzYuMTc1cTAsNi44MzQtLjAwNywxMy42NjljMCwuMy4xMzEuNDExLjQwOC40MDcuMTM3LDAsLjI3NC4wMDYuNDEuMDA2bDEwLjcwNy0uMDFoMi43MzciIHRyYW5zZm9ybT0idHJhbnNsYXRlKC02OC45OTcgLTAuMDg5KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTgiIGRhdGEtbmFtZT0iUGF0aCA1MTE4IiBkPSJNMCwuMDQ1Qy4xODMuMDM2LjMxNy4wMjUuNDUxLjAyNVExMCwuMDE1LDE5LjU0OSwwYy4zMjgsMCwuNDQ1LjA1Mi40NDUuNDE0cS0uMDA2LDkuMzIxLjAxNiwxOC42NDNjMCwuOTM2LDAsLjkzLS45MjkuOTNMLjgsMTkuOTc2Yy0uNzUxLDAtLjc0LS4wMDUtLjc0Mi0uNzQzUS4wMzQsMTAuMzkyLDAsMS41NTFDMCwxLjA2NiwwLC41ODIsMCwuMDQ1TTE3LjE2NCwxNy4xNjZjMC0uNDA2LDAtLjczNywwLTEuMDY4LS4wMTQtNC4yMjQtLjAzNi04LjQ0Ny0uMDMxLTEyLjY3MSwwLS40NTEtLjA5MS0uNi0uNTY4LS41OTQtNC4zNjEuMDIxLTguNzIxLjAxNi0xMy4wODIuMDE4LS42MywwLS42MzIsMC0uNjMxLjYzOXEuMDA4LDYuMzU4LjAxNSwxMi43MTdjMCwuOTI4LS4wMTQuOTI1LjkxLjkyN2wxMS4xMjEuMDMxYy43MjgsMCwxLjQ1NSwwLDIuMjY2LDAiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMC4wMDEpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTExOSIgZGF0YS1uYW1lPSJQYXRoIDUxMTkiIGQ9Ik0uMjc2LDEyOC44MjNjMC0uMjQsMC0uNDgsMC0uNzIxcS0uMDIyLTkuMy0uMDQ0LTE4LjU5MWMwLS42MTgsMC0uNjE0LjYxOC0uNjE0cTguOTMxLjAwNywxNy44NjIuMDFjLjIsMCwuMzk1LDAsLjU5Mi0uMDA4LjkwNy0uMDE4LjkxMi0uMDE4LjkxMy45MTVxLjAwOCw5LjIyNy4wMTEsMTguNDU1di41NTRabTE3LjExNi0xNy4xMTJjLS44OSwwLTEuNzM2LDAtMi41ODIsMC0zLjcyMS4wMDktNy40NDMuMDI4LTExLjE2NC4wMTgtLjQ1NCwwLS41NTYuMTQ1LS41NTUuNTY2cS4wMTcsNi42NzcsMCwxMy4zNTNjMCwuMzYxLjE2Ny4zOC40NDcuMzc5cTYuNTYzLS4wMSwxMy4xMjUtLjAxYy4yMzgsMCwuNDc1LS4wMjEuNzMtLjAzM1oiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0wLjE0NyAtNjguOTU4KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjAiIGRhdGEtbmFtZT0iUGF0aCA1MTIwIiBkPSJNNjguMTc4LDExNi42N2gyLjljMCwxLjk1MywwLDMuODU3LDAsNS43NjJsLjAxMi0uMDE0SDY4LjIxMmMwLC43NzgtLjAwOSwxLjUxNywwLDIuMjU2LjAwOS41NjcuMDIuNTc0LS41NjguNTgtLjYwNy4wMDYtMS4yMTUuMDI1LTEuODE5LS4wMi0uMzg2LS4wMjktLjQ2OS4xMTgtLjQ2OC40NTcuMDA4LDIuMDY0LDAsNC4xMjksMCw2LjE5NCwwLC41LjAyLDEsMCwxLjUtLjAwNi4xMjctLjEzNy4zNTMtLjIxNi4zNTYtLjg1OC4wMjYtMS43MTcuMDE2LTIuNi4wMTZ2LTE0LjI0aDUuNjQyVjExNi42NmwtLjAwOS4wMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTM5LjYwNyAtNzMuODc1KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjEiIGRhdGEtbmFtZT0iUGF0aCA1MTIxIiBkPSJNNjguMDA2LDguNjEyVjUuOGMtLjE2MS0uMDE0LS4yNzUtLjAzMi0uMzg5LS4wMzItMS42MjUsMC0zLjI1LS4wMDctNC44NzYuMDE1LS4zODguMDA1LS41NDItLjA4MS0uNTEzLS41YTExLjc1MywxMS43NTMsMCwwLDAsMC0xLjc3NWMtLjAzOC0uNDUuMS0uNTg2LjU0MS0uNTc2LDEuNDEyLjAzMiwyLjgyNC4wMzYsNC4yMzcuMDQ5LjMsMCwuNiwwLC45NTMsMFYuMTI4aDIuODMzYzAsMS43MjMuMDE0LDMuNDM0LS4wMSw1LjE0NC0uMDA2LjQyMy4wODkuNTUxLjUzMS41MjEuNzcxLS4wNTMsMS41NDctLjAyNiwyLjMyMS0uMDMzbC0uMDA5LS4wMWMuMDA5LDEuOC4wMjIsMy42LjAxOCw1LjQwNywwLC4xMDktLjEzNS4zMDktLjIxMi4zMTEtLjg1Ny4wMjItMS43MTUuMDE0LTIuNTcyLjAxNCwwLS44OTEtLjAxNS0xLjY3My4wMDctMi40NTUuMDEtLjMzLS4wNy0uNDYtLjQyNS0uNDQ3LS44MTYuMDI3LTEuNjMzLjAxNS0yLjQ1LjAybC4wMTUuMDEzIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzkuNDAyIC0wLjA4MSkiIGZpbGw9IiNhZWM3MzciLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTIyIiBkYXRhLW5hbWU9IlBhdGggNTEyMiIgZD0iTTY4LjAyLDIzLjIyNXY1LjY5SDY1LjA0NmwuMDA4LjAwN3EwLTEuNDIzLDAtMi44NDlINjIuMjdjMC0uODc4LS4wMTgtMS43MjEuMDI0LTIuNTYxLjAwNS0uMS4zMzMtLjI2Ny41MTQtLjI3LDEuMTUyLS4wMjEsMi4zLDAsMy40NTcsMCwuNTg5LDAsMS4xNzksMCwxLjc2OSwwbC0uMDE0LS4wMTIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zOS40MyAtMTQuNzA3KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjMiIGRhdGEtbmFtZT0iUGF0aCA1MTIzIiBkPSJNOTMuMzI0LDUuNzU4Vi4xMjdoMi44MzVBLjk2MS45NjEsMCwwLDEsOTYuMi4zMzNxMCwyLjQzOCwwLDQuODc2YzAsLjU4Ny0uMDI2LjYtLjYxOS41OC0uNzU3LS4wMjItMS41MTYtLjAyOC0yLjI3My0uMDQxbC4wMDkuMDEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01OS4wOTIgLTAuMDgpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyNCIgZGF0YS1uYW1lPSJQYXRoIDUxMjQiIGQ9Ik0xNDguMTA2LDE1OC4yOGMwLS44MjIsMC0xLjYzOCwwLTIuNDU0LDAtLjIzNC4wODMtLjM0LjM1Ny0uMzMuNzExLjAyNywxLjQyMy4wMjEsMi4xMzQuMDA4LjI2LS4wMDUuNC4wNTEuMzkxLjM0NC0uMDE4Ljc0Mi0uMDEsMS40ODQtLjAzOCwyLjIyNSwwLC4xMDYtLjE1My4yOTQtLjIzNi4yOTUtLjgzMS4wMDktMS42NjItLjAxMi0yLjQ5My0uMDMtLjA0LDAtLjA3OS0uMDM5LS4xMTYtLjA1OCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTkzLjc4OSAtOTguNDY4KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjUiIGRhdGEtbmFtZT0iUGF0aCA1MTI1IiBkPSJNMTE5LjY0NCw2NS4wNTJjLS44NzcuMDEzLTEuNzU0LjAzNi0yLjYzLjAyOGEuNDA3LjQwNywwLDAsMS0uMy0uMjYyYy0uMDIzLS44My0uMDE0LTEuNjYxLS4wMTQtMi41NTIuNjE4LDAsMS4yLDAsMS43ODYsMCwxLjEyOSwwLDEuMTI4LS4wMDYsMS4xMywxLjExOSwwLC41Ni4wMDcsMS4xMi4wMTEsMS42OGwuMDE0LS4wMTIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC03My45MDEgLTM5LjQyOSkiIGZpbGw9IiNhZWM3MzciLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTI3IiBkYXRhLW5hbWU9IlBhdGggNTEyNyIgZD0iTTExMS45MzIsMTI3LjM2OWgtMi43MTh2LTIuOTEyaDIuNzA4cTAsMS40NjIsMCwyLjkyM2wuMDEtLjAxMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTY5LjE2IC03OC44MTMpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyOCIgZGF0YS1uYW1lPSJQYXRoIDUxMjgiIGQ9Ik0xMjQuNzE5LDE1LjYzMWg4LjQyNmEuMzA3LjMwNywwLDAsMSwuMDQ3LjExMWMuMDEzLDIuNi4wMjksNS4yLjAzLDcuNzkzLDAsLjYyLS4wMjIuNjEyLS42MzIuNjExcS0zLjczOCwwLTcuNDc1LDBoLS40WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTc4Ljk3OSAtOS44OTgpIiBmaWxsPSIjMWExODE4Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyOSIgZGF0YS1uYW1lPSJQYXRoIDUxMjkiIGQ9Ik0yNC4yNTIsMjQuMDMzSDE1LjY0NVYxNS41NmE1Ljc1Myw1Ljc1MywwLDAsMSwuNTk0LS4wNTljMi40NDUtLjAwNiw0Ljg5LDAsNy4zMzUtLjAxNS40NTMsMCwuNjU2LjEyMS42NTQuNjEzLS4wMDcsMi4zNjkuMDEzLDQuNzM4LjAyMyw3LjEwNywwLC4yNTcsMCwuNTE1LDAsLjgyNyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTkuOTA3IC05LjgwNikiLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTMwIiBkYXRhLW5hbWU9IlBhdGggNTEzMCIgZD0iTTI0LjMxLDEyNC40NzN2OC41ODRjLS42MDcsMC0xLjE5MiwwLTEuNzc3LDAtMi4wOTUtLjAwNi00LjE5LS4wMjItNi4yODUtLjAxMy0uNCwwLS40ODktLjEyMi0uNDg0LS41MjUuMDI4LTIuMzgzLjAxNy00Ljc2Ny4wMTktNy4xNSwwLS4yODcsMC0uNTc0LDAtLjlaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtOS45ODIgLTc4LjgyMykiIGZpbGw9IiMxYTE4MTgiLz4NCiAgICAgICAgPC9nPg0KICAgICAgPC9nPg0KICAgIDwvZz4NCiAgPC9nPg0KPC9zdmc+DQo=";
        } else if (Docrotation == 90) {
            Qrcode =
                "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1OS45MDIiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA1OS45MDIgNjAiPg0KICA8ZyBpZD0iUmlnaHQiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDU5LjkwMikgcm90YXRlKDkwKSI+DQogICAgPGcgaWQ9Ikdyb3VwXzM0MzMiIGRhdGEtbmFtZT0iR3JvdXAgMzQzMyI+DQogICAgICA8ZyBpZD0iR3JvdXBfMzQwNSIgZGF0YS1uYW1lPSJHcm91cCAzNDA1Ij4NCiAgICAgICAgPGcgaWQ9Ikdyb3VwXzM0MzQiIGRhdGEtbmFtZT0iR3JvdXAgMzQzNCI+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTExNSIgZGF0YS1uYW1lPSJQYXRoIDUxMTUiIGQ9Ik0xMDAuMDc1LDY1LjAxMmgyLjg1OVY2Mi45NDljMC0uNzE0LDAtLjcxLjY5LS43MTkuNTc3LS4wMDcsMS4xNTUtLjAxLDEuNzMxLS4wNDUuMy0uMDE5LjQyNC4wOTIuNDE5LjM3OS0uMDEzLjY2NywwLDEuMzM3LS4wNDgsMi0uMDI3LjM4NS4wODYuNTE5LjQ3LjUuNjY3LS4wMjcsMS4zMzctLjAzNiwyLS4wMTguMzIyLjAwOC40MzEtLjEuNDItLjQxNC0uMDIyLS42NjctLjAwNy0xLjMzNi0uMDMyLTItLjAxMi0uMzM5LjExMS0uNDU4LjQ1LS40NDcuNjY4LjAyMSwxLjMzNy4wMjUsMiwwLC4zMTktLjAxMS40MzUuMDg1LjQyMS40MDktLjAyOS42NjctLjAxNCwxLjMzNy0uMDQ3LDItLjAxNS4zLjA0LjQ1OC4zOC40NTIuOC0uMDEzLDEuNjA5LDAsMi40NjUsMHYyLjgxNGgtLjU4Yy0uNjIzLDAtMS4yNDctLjAxMy0xLjg2OC4wMTYtLjEyMy4wMDUtLjMzOC4xNzItLjM0MS4yNy0uMDI3Ljg0OC0uMDE2LDEuNy0uMDE2LDIuNmgyLjh2Mi45MzJIMTExLjQ3YzAsLjg3NSwwLDEuNzA2LDAsMi41MzYsMCwuMy4yMjQuMjcyLjQyMS4yNy42NjktLjAwOCwxLjMzOCwwLDItLjAzMy4zMzctLjAxNi40NjIuMDg2LjQ0OS40MzItLjAyNi42NjctLjAzMywxLjMzNi0uMDEyLDIsLjAxMS4zNDgtLjExNy40NTMtLjQ0Ny40NDYtLjY4My0uMDE1LTEuMzY4LS4wMTUtMi4wNS4wMS0uMTExLDAtLjMwOC4xNi0uMzEuMjUtLjAyNC44MzMtLjAxNCwxLjY2Ni0uMDE0LDIuNTUyaDIuNzgxVjg3Ljg4aC01LjY1YzAtLjgxOC0uMDE5LTEuNjE4LjAwOC0yLjQxNy4wMTMtLjM5MS0uMTMzLS40OTEtLjUtLjQ3OS0uNzU3LjAyNC0xLjUxNi4wMDctMi4zMy4wMDcsMC0uOTUzLDAtMS44ODcsMC0yLjgyaDIuODE3YzAtLjkuMDA4LTEuNzY2LS4wMTQtMi42MjYsMC0uMDc3LS4yLS4yMDktLjMxLS4yMTNxLTEuMTE1LS4wMzktMi4yMzEtLjAyMWMtLjEsMC0uMjc0LjEyOS0uMjc1LjItLjAwNy44OTEuMDEyLDEuNzgyLjAyNSwyLjY3MkgxMDNWODcuOWgyLjc3NWMwLC45Mi4wMTEsMS43OTQtLjAxNywyLjY2NiwwLC4wOTEtLjI0Ni4yNS0uMzc3LjI0OS0yLjQxNS0uMDA3LTQuODMtLjAzOS03LjI0NC0uMDU0LS45MjktLjAwNi0uOTQ4LjAyNS0uOTI1LjkzNC4wMTMuNS4wMTgsMSwuMDQ1LDEuNS4wMTYuMjkzLS4wODcuNDA4LS4zODguNC0uOC0uMDE0LTEuNjA1LDAtMi41LDAsMCwuOTMyLS4wMDcsMS43OTMuMDEyLDIuNjUzLDAsLjA3NC4xNzMuMjA2LjI2Ny4yMDYsMS42ODYsMCwzLjM3My0uMDE4LDUuMDU5LS4wMjguMjY1LDAsLjM3MS0uMTA2LjM2My0uMzg2LS4wMTgtLjY1My4wMTItMS4zMDctLjAxMi0xLjk2LS4wMTQtLjM2NS4wODQtLjUxMi40NzctLjUxLDIuNTgzLjAxMSw1LjE2NiwwLDcuNzQ5LDAsLjI1MSwwLC4zNjIuMDc2LjM2MS4zMzUsMCwuNy0uMDA2LDEuNC4wMTMsMi4xLjAxLjM2Ny0uMTU0LjQ2LS41LjQ1OS0yLjYtLjAxLTUuMiwwLTcuOCwwLS4wNzUsMC0uMTUuMDA3LS4yNzYuMDEzdjIuNzYzSDg1Ljg2OHYtMi44SDg4Yy43MjIsMCwuNzE4LDAsLjcwOC0uNzExLS4wMDgtLjU5Mi0uMDI3LTEuMTg2LDAtMS43NzcuMDE2LS4zMy0uMTA5LS4zNjktLjM5NS0uMzYyLS44LjAyLTEuNjA3LjAwNy0yLjQ4MS4wMDcsMC0xLjkxNywwLTMuNzkyLDAtNS42NjhsLS4wMTMuMDE1SDg4LjdWODQuOTkzYy43OSwwLDEuNTE1LS4wMzIsMi4yMzUuMDExLjQ3OS4wMjguNi0uMTQuNTc3LS41OTEtLjAyOC0uNTkuMDA5LTEuMTg0LjAzNi0xLjc3NS4wMTUtLjMzNy0uMDcxLS41LS40NTctLjQ3OC0uNjgyLjAzMi0xLjM2Ny4wMDUtMi4wNS4wMDgtLjMsMC0uNDIyLS4wODEtLjM5NC0uNDMxYTE4Ljk0NCwxOC45NDQsMCwwLDAsLjAzMi0xLjk1M2MtLjAwNy0uMzIxLjA1OS0uNDY0LjQyMS0uNDYxLDEuNzE1LjAxNiwzLjQzLjAwNyw1LjIxNC4wMDdWODQuOTljLS44MywwLTEuNjE3LjAxNS0yLjQtLjAwNy0uMzI2LS4wMDktLjQyNC4xMDgtLjQxNy40MTguMDE2LjY2OC0uMDE1LDEuMzM4LjAxNywyLC4wMi40MTctLjE0My41MjMtLjUzLjUwOS0uNzI3LS4wMjUtMS40NTUtLjAwNy0yLjI1LS4wMDd2Mi44NDRjLjIyNywwLC40OTQsMCwuNzYxLDAsMi40Ni4wMTgsNC45Mi4wNCw3LjM4LjA0NS4xMjMsMCwuMzU0LS4xMzcuMzU0LS4yMTMuMDEyLS44NDgtLjAxMS0xLjctLjAzLTIuNTQ1LDAtLjAzNi0uMDUyLS4wNy0uMDgtLjEwNmwtLjAxLjAxMWgyLjk1OXYtLjY5MmMwLTEuNTM1LjAxMy0zLjA3LS4wMS00LjYtLjAwNi0uMzc4LjEzOS0uNDc2LjQ3My0uNDczLjguMDA5LDEuNiwwLDIuNDI5LDBWNzkuMzZjLS4xNDItLjAxMS0uMjczLS4wMjktLjQtLjAyOS0xLjYyNiwwLTMuMjUyLS4wMS00Ljg3OC4wMTQtLjM4MS4wMDYtLjUwNi0uMS0uNS0uNDguMDIyLS43NzEuMDA3LTEuNTQyLjAwNy0yLjM3Ni0uODA3LDAtMS41NjMtLjAxNS0yLjMxNy4wMDYtLjM4NS4wMTEtLjU2NS0uMDQtLjUzNC0uNTE2LjA0OC0uNzU0LS4wMTUtMS41MTYtLjAzMi0yLjI3NGwtLjAxMi4wMTVjLjY3OC0uMDM0LDEuMzU3LS4wNzIsMi4wMzYtLjEuMjU1LS4wMTEuNTEyLDAsLjgyNiwwVjcwLjc4aDUuNzk1VjY3Ljg2OWgtMi44NjFWNjVabTUuNzEzLDUuNzU2Yy44NjcsMCwxLjcxNS4wMSwyLjU2Mi0uMDE0LjA5NSwwLC4yNTktLjIuMjYzLS4zMDkuMDI1LS43NDMuMDEyLTEuNDg4LjAxOC0yLjIzMSwwLS4yNTItLjEwNy0uMzQ3LS4zNi0uMzQ0LS43MjguMDExLTEuNDU2LS4wMDYtMi4xODQuMDE1LS4xLDAtLjI4NC4xNDktLjI4Ni4yMzEtLjAyMS44NjEtLjAxMywxLjcyNC0uMDEzLDIuNjUybTIuODQ4LDUuN2MwLS45LDAtMS43NSwwLTIuNiwwLS4yNTItLjEzMy0uMy0uMzUtLjI4Ny0uNzI0LjAzNC0xLjQ0OC4wNjYtMi4xNzMuMDc5LS4yNTksMC0uMzM5LjExLS4zNDEuMzU1LS4wMDcuNzEtLjA0MiwxLjQyMS0uMDM2LDIuMTMxLDAsLjEwNy4xNTkuMy4yNDkuMy44NTkuMDIzLDEuNzE4LjAxNCwyLjY0OS4wMTRtLTguNi0yLjc3M0g5Ny4yMjl2Mi43NzRoMi44MDdaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNTQuMzQ2IC0zOS4zNzcpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTExNiIgZGF0YS1uYW1lPSJQYXRoIDUxMTYiIGQ9Ik0yNS43LDM4LjczOWMuMDE0LjIzOS4wMzkuNDc5LjA0MS43MTguMDA4LDEuNTM0LjAxOCwzLjA2Ny4wMTIsNC42LDAsLjMuMDU2LjQ0OS40LjQ0LjY2OC0uMDE3LDEuMzM2LjAwOCwyLC4wMTEuMzYyLDAsLjUzNy0uMTMzLjUxNy0uNTQ2LS4wMzYtLjc0LS4wMS0xLjQ4Mi0uMDEtMi4yNjYuNzc2LDAsMS41MTQsMCwyLjI1MywwLC41ODYsMCwuNjUxLS4wNjQuNjUtLjY0NywwLS43NDEsMC0xLjQ4MSwwLTIuMjUyLjE3LS4wMDguMjg3LS4wMTcuNC0uMDE3LDEuNjExLDAsMy4yMjIuMDA2LDQuODMzLS4wMDYuMzEzLDAsLjQyLjA4NS40MTcuNDExLS4wMTQsMS42MS0uMDE2LDMuMjIyLjAwOCw0LjgzMi4wMDYuNDE3LS4xMzMuNTE4LS41MjYuNS0uNjM3LS4wMzItMS4yNzYsMC0xLjkxNC0uMDExLS4zNTgtLjAwNy0uNDc5LjE0Ny0uNDY0LjUuMDI5LjY1MS4wMjUsMS4zLjAzNSwxLjk1NS4wMDUuMzIyLS4xNzQuNDA3LS40NjcuNC0uNjY4LS4wMTMtMS4zMzgtLjAyNC0yLjAwNSwwLS4zNTUuMDEzLS4zOTMtLjE0NC0uMzgtLjQzOS4wMy0uNjgyLjAzMi0xLjM2Ni4wNDEtMi4wNDksMC0uMTMyLS4wMTktLjI2Ni0uMDMtLjQtLjg3OCwwLTEuNzI0LS4wMTItMi41NjguMDE2LS4xLDAtLjI3LjIyMS0uMjc1LjM0NC0uMDI2LjY4My0uMDI4LDEuMzY4LDAsMi4wNTEuMDEyLjMzMi0uMDc3LjQ2NC0uNDI3LjQ1NC0uNjgzLS4wMjEtMS4zNjgsMC0yLjA1MS0uMDA4LS4yODgsMC0uNC4wOTQtLjQuNCwwLC42NjgsMCwxLjMzOC0uMDUzLDItLjAzMS40MzIuMTYxLjUuNTMuNDk0LDEuNjcxLS4wMjEsMy4zNDMtLjAyMSw1LjAxNC0uMDI4aC4yNzNWNTMuMDFoMS44NTljMS4xMjQsMCwyLjI0OS0uMDEzLDMuMzczLDAsLjMzMiwwLC40NTYtLjA4Ny40NDQtLjQzOC0uMDI0LS42ODMtLjAxLTEuMzY4LjAwNy0yLjA1MS4wMDgtLjMtLjEtLjM5LS40LS4zNzUtLjcxMi4wMzUtMS40MjcuMDQyLTIuMTQuMDMtLjEyNywwLS4zNTktLjE0MS0uMzYxLS4yMjItLjAyNy0uODU5LS4wMTctMS43Mi0uMDE3LTIuNiwxLjE0LDAsMi4xNjksMCwzLjIsMCwuNzI5LDAsMS40NTkuMDA2LDIuMTg4LS4wMTUuMjc1LS4wMDguMzguMDcyLjM4LjM1NXEwLDIuNTI5LjAxMyw1LjA1OWMwLC4zMTItLjIxMi4yODQtLjQwNi4yODUtLjc4OSwwLTEuNTc3LDAtMi40NjUsMCwwLC41MjMsMCwxLjA2MiwwLDEuNi0uMDExLDEuMjc3LS4wMTMsMS4yNzctMS4yNjksMS4yNzdIMjguNjczYzAsMSwwLDEuOTY0LDAsMi45M0gyNS43NjdjMCwuODY3LS4wMDYsMS43MTEuMDEsMi41NTRhLjMxNy4zMTcsMCwwLDAsLjIyOS4yMDZjLjg3Mi4wMTUsMS43NDUuMDEsMi42NTEuMDFWNTguODM2YzEuNzc0LS4wMjMsMy41NDgtLjA0Miw1LjMyMS0uMDczLjI5My0uMDA1LjQ0OS4wNTIuNDM5LjQtLjAyMS43LS4wMTIsMS40LDAsMi4wOTMuMDA1LjI5My0uMTA3LjQwNi0uNC40LS43ODctLjAxMi0xLjU3NCwwLTIuNDQxLDBWNjMuNGMwLDEuMDcsMCwxLjA2Ni0xLjA4OCwxLjA2MS0uNTMxLDAtMS4wNjEuMDE0LTEuNTkyLjAyNGEyLjMzMywyLjMzMywwLDAsMC0uMjQyLjAzNnYyLjhsLjAwOS0uMDFjLTEuNzMxLjAwNi0zLjQ2MywwLTUuMTk0LjAyNi0uMzc1LjAwNi0uNS0uMDc3LS41LS40NzIuMDE4LTEuNTY1LjAwNi0zLjEzLS4wMDgtNC42OTQtLjAwNi0uNTkzLS4wNzEtLjYtLjYwNS0uNTcxLTEuNTYxLjA3LTMuMTI4LjAxOC00LjY5My4wMjUtLjMyLDAtLjQxNC0uMTI3LS40MDUtLjQzOS4wMjEtLjc1Ny4wMDctMS41MTUuMDA3LTIuMzUuMzIxLS4wMjMuNjI5LS4wNjUuOTM3LS4wNjUsMi4zODUsMCw0Ljc3MS4wMDcsNy4xNTUuMDM3LjM1NiwwLC40NTYtLjExLjQ1NC0uNDMxLS4wMDctLjgsMC0xLjYsMC0yLjQzMi0uMjI5LS4wMTQtLjM2MS0uMDMtLjQ5My0uMDMtMi41MjIsMC01LjA0NS4wMDYtNy41NjctLjAwOC0uMzczLDAtLjUwNy4wODgtLjQ4My40ODMuMDM4LjYzNi4wMTYsMS4yNzQuMDE0LDEuOTEyLDAsLjM3OC0uMTk0LjUzOS0uNTc0LjUzMy0uNzQtLjAxMi0xLjQ4MiwwLTIuMjc5LDB2Mi44Yy0uNjI4LDAtMS4yLDAtMS43NzIsMC0xLjE4NSwwLTIuMzctLjAxNC0zLjU1NS0uMDEzLS4zMjUsMC0uNDMxLS4xMDYtLjQyMy0uNDU4LjAzMS0xLjUxOS4wMjctMy4wMzguMDE5LTQuNTU4YTQuMDA4LDQuMDA4LDAsMCwwLS4xMzEtLjcxaDIuOTE1VjUwLjE4NmMtLjcyOSwwLTEuNDI1LDAtMi4xMjEsMC0uNzE1LDAtLjcwNy0uMDA4LS43MTQuNzI2LS4wMTgsMS42NjYtLjA0NCwzLjMzMi0uMDY2LDVINS44NThjLS4wMTUuMjE1LS4wMzkuMzkyLS4wMzguNTY4LjAxMSwxLjU4LjAyMSwzLjE2MS4wNDYsNC43NDEuMDA1LjMwOS0uMDgzLjQ0My0uNDExLjQzNS0uNy0uMDE4LTEuNC0uMDE0LTIuMS0uMDA2LS4yNTYsMC0uNC0uMDY3LS40LS4zNTUuMDA1LTEuNzc0LDAtMy41NDgsMC01LjM2OC44NDYsMCwxLjYzMy0uMDE2LDIuNDE5LjAwNy4zNTIuMDEuNDktLjA4OC40NzktLjQ1OC0uMDIyLS44LS4wMDctMS42LS4wMDctMi40MjctLjgzOSwwLTEuNjM5LS4wMjYtMi40MzYuMDEyLS4zNzEuMDE4LS40NzktLjA3NS0uNDY3LS40NDIuMDI0LS44LjAwNy0xLjYuMDA3LTIuNDM3SC4xMzJjMC0uODY2LS4wMTEtMS43LjAxNC0yLjUyNywwLS4xLjE5MS0uMjUxLjMxNC0uMjc2YTMuNDI4LDMuNDI4LDAsMCwxLC42ODEtLjAxM2M0LjI3LDAsOC41NCwwLDEyLjgxLS4wMTUuNCwwLC40OTQuMTM0LjQ4Ni41LS4wMTkuNzcyLS4wMDYsMS41NDUtLjAwNiwyLjM0N2gyLjc2MnYyLjc2OWEyLjU2OCwyLjU2OCwwLDAsMCwuMzYxLjA2MmMxLjY1Ni4wMTIsMy4zMTIuMDE3LDQuOTY4LjAzMi4zMjQsMCwuNS0uMDY2LjQ4Ni0uNDU3LS4wMzQtLjc0My0uMDE3LTEuNDg4LS4wMjYtMi4yMzNhMS4xLDEuMSwwLDAsMC0uMDU2LS4yMjlIMTcuMjY5YzAtLjg3OSwwLTEuNywwLTIuNTE0LDAtLjMzNi4yNjUtLjI2Ni40NjctLjI2NnEzLjE5MSwwLDYuMzgzLjAxM2MuNTI4LDAsMS4wNTcsMCwxLjYzOSwwdi0yLjg1Yy0uODUxLDAtMS42MzctLjAxNy0yLjQyMi4wMDgtLjM0Mi4wMS0uNDMyLS4wODMtLjQyNS0uNDMzLjAyOS0xLjQ3NC4wMjItMi45NDguMDI4LTQuNDIyLDAtLjI4NCwwLS41NjcsMC0uOTI0aDIuNzY0bC0uMDA4LS4wMDdtNS44NzMsM2MwLC43ODEuMDIyLDEuNTUxLS4wMSwyLjMxOC0uMDE1LjM1OC4xMjUuNDUxLjQzOS40NDguNjUyLS4wMDgsMS4zLS4wMjcsMS45NTUsMCwuMzE3LjAxNS40MTUtLjEyLjQxNS0uMzg0LDAtLjcyNywwLTEuNDU1LS4wMzYtMi4xODFhLjQ1OC40NTgsMCwwLDAtLjMzMS0uM2MtLjc4Ni4wMDgtMS41Ny4wNTYtMi40MzIuMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTAuMDgyIC0yNC41MzIpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTExNyIgZGF0YS1uYW1lPSJQYXRoIDUxMTciIGQ9Ik0xMjguOTA2LDIwLjAzSDEwOC45NTdWLjE0aDE5Ljk0OVptLTIuODUtMi44VjIuOTc5SDExMS44MzdhMS4wODQsMS4wODQsMCwwLDAtLjAzNi4xNzVxMCw2LjgzNC0uMDA3LDEzLjY2OWMwLC4zLjEzMS40MTEuNDA4LjQwNy4xMzcsMCwuMjc0LjAwNi40MS4wMDZsMTAuNzA3LS4wMWgyLjczNyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTY4Ljk5NyAtMC4wODkpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTExOCIgZGF0YS1uYW1lPSJQYXRoIDUxMTgiIGQ9Ik0wLC4wNDVDLjE4My4wMzYuMzE3LjAyNS40NTEuMDI1UTEwLC4wMTUsMTkuNTQ5LDBjLjMyOCwwLC40NDUuMDUyLjQ0NS40MTRxLS4wMDYsOS4zMjEuMDE2LDE4LjY0M2MwLC45MzYsMCwuOTMtLjkyOS45M0wuOCwxOS45NzZjLS43NTEsMC0uNzQtLjAwNS0uNzQyLS43NDNRLjAzNCwxMC4zOTIsMCwxLjU1MUMwLDEuMDY2LDAsLjU4MiwwLC4wNDVNMTcuMTY0LDE3LjE2NmMwLS40MDYsMC0uNzM3LDAtMS4wNjgtLjAxNC00LjIyNC0uMDM2LTguNDQ3LS4wMzEtMTIuNjcxLDAtLjQ1MS0uMDkxLS42LS41NjgtLjU5NC00LjM2MS4wMjEtOC43MjEuMDE2LTEzLjA4Mi4wMTgtLjYzLDAtLjYzMiwwLS42MzEuNjM5cS4wMDgsNi4zNTguMDE1LDEyLjcxN2MwLC45MjgtLjAxNC45MjUuOTEuOTI3bDExLjEyMS4wMzFjLjcyOCwwLDEuNDU1LDAsMi4yNjYsMCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAwLjAwMSkiIGZpbGw9IiNhZWM3MzciLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTE5IiBkYXRhLW5hbWU9IlBhdGggNTExOSIgZD0iTS4yNzYsMTI4LjgyM2MwLS4yNCwwLS40OCwwLS43MjFxLS4wMjItOS4zLS4wNDQtMTguNTkxYzAtLjYxOCwwLS42MTQuNjE4LS42MTRxOC45MzEuMDA3LDE3Ljg2Mi4wMWMuMiwwLC4zOTUsMCwuNTkyLS4wMDguOTA3LS4wMTguOTEyLS4wMTguOTEzLjkxNXEuMDA4LDkuMjI3LjAxMSwxOC40NTV2LjU1NFptMTcuMTE2LTE3LjExMmMtLjg5LDAtMS43MzYsMC0yLjU4MiwwLTMuNzIxLjAwOS03LjQ0My4wMjgtMTEuMTY0LjAxOC0uNDU0LDAtLjU1Ni4xNDUtLjU1NS41NjZxLjAxNyw2LjY3NywwLDEzLjM1M2MwLC4zNjEuMTY3LjM4LjQ0Ny4zNzlxNi41NjMtLjAxLDEzLjEyNS0uMDFjLjIzOCwwLC40NzUtLjAyMS43My0uMDMzWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTAuMTQ3IC02OC45NTgpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyMCIgZGF0YS1uYW1lPSJQYXRoIDUxMjAiIGQ9Ik02OC4xNzgsMTE2LjY3aDIuOWMwLDEuOTUzLDAsMy44NTcsMCw1Ljc2MmwuMDEyLS4wMTRINjguMjEyYzAsLjc3OC0uMDA5LDEuNTE3LDAsMi4yNTYuMDA5LjU2Ny4wMi41NzQtLjU2OC41OC0uNjA3LjAwNi0xLjIxNS4wMjUtMS44MTktLjAyLS4zODYtLjAyOS0uNDY5LjExOC0uNDY4LjQ1Ny4wMDgsMi4wNjQsMCw0LjEyOSwwLDYuMTk0LDAsLjUuMDIsMSwwLDEuNS0uMDA2LjEyNy0uMTM3LjM1My0uMjE2LjM1Ni0uODU4LjAyNi0xLjcxNy4wMTYtMi42LjAxNnYtMTQuMjRoNS42NDJWMTE2LjY2bC0uMDA5LjAxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzkuNjA3IC03My44NzUpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyMSIgZGF0YS1uYW1lPSJQYXRoIDUxMjEiIGQ9Ik02OC4wMDYsOC42MTJWNS44Yy0uMTYxLS4wMTQtLjI3NS0uMDMyLS4zODktLjAzMi0xLjYyNSwwLTMuMjUtLjAwNy00Ljg3Ni4wMTUtLjM4OC4wMDUtLjU0Mi0uMDgxLS41MTMtLjVhMTEuNzUzLDExLjc1MywwLDAsMCwwLTEuNzc1Yy0uMDM4LS40NS4xLS41ODYuNTQxLS41NzYsMS40MTIuMDMyLDIuODI0LjAzNiw0LjIzNy4wNDkuMywwLC42LDAsLjk1MywwVi4xMjhoMi44MzNjMCwxLjcyMy4wMTQsMy40MzQtLjAxLDUuMTQ0LS4wMDYuNDIzLjA4OS41NTEuNTMxLjUyMS43NzEtLjA1MywxLjU0Ny0uMDI2LDIuMzIxLS4wMzNsLS4wMDktLjAxYy4wMDksMS44LjAyMiwzLjYuMDE4LDUuNDA3LDAsLjEwOS0uMTM1LjMwOS0uMjEyLjMxMS0uODU3LjAyMi0xLjcxNS4wMTQtMi41NzIuMDE0LDAtLjg5MS0uMDE1LTEuNjczLjAwNy0yLjQ1NS4wMS0uMzMtLjA3LS40Ni0uNDI1LS40NDctLjgxNi4wMjctMS42MzMuMDE1LTIuNDUuMDJsLjAxNS4wMTMiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zOS40MDIgLTAuMDgxKSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjIiIGRhdGEtbmFtZT0iUGF0aCA1MTIyIiBkPSJNNjguMDIsMjMuMjI1djUuNjlINjUuMDQ2bC4wMDguMDA3cTAtMS40MjMsMC0yLjg0OUg2Mi4yN2MwLS44NzgtLjAxOC0xLjcyMS4wMjQtMi41NjEuMDA1LS4xLjMzMy0uMjY3LjUxNC0uMjcsMS4xNTItLjAyMSwyLjMsMCwzLjQ1NywwLC41ODksMCwxLjE3OSwwLDEuNzY5LDBsLS4wMTQtLjAxMiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTM5LjQzIC0xNC43MDcpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyMyIgZGF0YS1uYW1lPSJQYXRoIDUxMjMiIGQ9Ik05My4zMjQsNS43NThWLjEyN2gyLjgzNUEuOTYxLjk2MSwwLDAsMSw5Ni4yLjMzM3EwLDIuNDM4LDAsNC44NzZjMCwuNTg3LS4wMjYuNi0uNjE5LjU4LS43NTctLjAyMi0xLjUxNi0uMDI4LTIuMjczLS4wNDFsLjAwOS4wMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTU5LjA5MiAtMC4wOCkiIGZpbGw9IiNhZWM3MzciLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTI0IiBkYXRhLW5hbWU9IlBhdGggNTEyNCIgZD0iTTE0OC4xMDYsMTU4LjI4YzAtLjgyMiwwLTEuNjM4LDAtMi40NTQsMC0uMjM0LjA4My0uMzQuMzU3LS4zMy43MTEuMDI3LDEuNDIzLjAyMSwyLjEzNC4wMDguMjYtLjAwNS40LjA1MS4zOTEuMzQ0LS4wMTguNzQyLS4wMSwxLjQ4NC0uMDM4LDIuMjI1LDAsLjEwNi0uMTUzLjI5NC0uMjM2LjI5NS0uODMxLjAwOS0xLjY2Mi0uMDEyLTIuNDkzLS4wMy0uMDQsMC0uMDc5LS4wMzktLjExNi0uMDU4IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtOTMuNzg5IC05OC40NjgpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyNSIgZGF0YS1uYW1lPSJQYXRoIDUxMjUiIGQ9Ik0xMTkuNjQ0LDY1LjA1MmMtLjg3Ny4wMTMtMS43NTQuMDM2LTIuNjMuMDI4YS40MDcuNDA3LDAsMCwxLS4zLS4yNjJjLS4wMjMtLjgzLS4wMTQtMS42NjEtLjAxNC0yLjU1Mi42MTgsMCwxLjIsMCwxLjc4NiwwLDEuMTI5LDAsMS4xMjgtLjAwNiwxLjEzLDEuMTE5LDAsLjU2LjAwNywxLjEyLjAxMSwxLjY4bC4wMTQtLjAxMiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTczLjkwMSAtMzkuNDI5KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjciIGRhdGEtbmFtZT0iUGF0aCA1MTI3IiBkPSJNMTExLjkzMiwxMjcuMzY5aC0yLjcxOHYtMi45MTJoMi43MDhxMCwxLjQ2MiwwLDIuOTIzbC4wMS0uMDExIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNjkuMTYgLTc4LjgxMykiIGZpbGw9IiNhZWM3MzciLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTI4IiBkYXRhLW5hbWU9IlBhdGggNTEyOCIgZD0iTTEyNC43MTksMTUuNjMxaDguNDI2YS4zMDcuMzA3LDAsMCwxLC4wNDcuMTExYy4wMTMsMi42LjAyOSw1LjIuMDMsNy43OTMsMCwuNjItLjAyMi42MTItLjYzMi42MTFxLTMuNzM4LDAtNy40NzUsMGgtLjRaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNzguOTc5IC05Ljg5OCkiIGZpbGw9IiMxYTE4MTgiLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTI5IiBkYXRhLW5hbWU9IlBhdGggNTEyOSIgZD0iTTI0LjI1MiwyNC4wMzNIMTUuNjQ1VjE1LjU2YTUuNzUzLDUuNzUzLDAsMCwxLC41OTQtLjA1OWMyLjQ0NS0uMDA2LDQuODksMCw3LjMzNS0uMDE1LjQ1MywwLC42NTYuMTIxLjY1NC42MTMtLjAwNywyLjM2OS4wMTMsNC43MzguMDIzLDcuMTA3LDAsLjI1NywwLC41MTUsMCwuODI3IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtOS45MDcgLTkuODA2KSIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMzAiIGRhdGEtbmFtZT0iUGF0aCA1MTMwIiBkPSJNMjQuMzEsMTI0LjQ3M3Y4LjU4NGMtLjYwNywwLTEuMTkyLDAtMS43NzcsMC0yLjA5NS0uMDA2LTQuMTktLjAyMi02LjI4NS0uMDEzLS40LDAtLjQ4OS0uMTIyLS40ODQtLjUyNS4wMjgtMi4zODMuMDE3LTQuNzY3LjAxOS03LjE1LDAtLjI4NywwLS41NzQsMC0uOVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC05Ljk4MiAtNzguODIzKSIgZmlsbD0iIzFhMTgxOCIvPg0KICAgICAgICA8L2c+DQogICAgICA8L2c+DQogICAgPC9nPg0KICA8L2c+DQo8L3N2Zz4NCg==";
        } else if (Docrotation == 270) {
            Qrcode =
                "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1OS45MDIiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA1OS45MDIgNjAiPg0KICA8ZyBpZD0iX2xlZnRfIiBkYXRhLW5hbWU9IiBsZWZ0ICIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCA2MCkgcm90YXRlKC05MCkiPg0KICAgIDxnIGlkPSJHcm91cF8zNDMzIiBkYXRhLW5hbWU9Ikdyb3VwIDM0MzMiPg0KICAgICAgPGcgaWQ9Ikdyb3VwXzM0MDUiIGRhdGEtbmFtZT0iR3JvdXAgMzQwNSI+DQogICAgICAgIDxnIGlkPSJHcm91cF8zNDM0IiBkYXRhLW5hbWU9Ikdyb3VwIDM0MzQiPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTUiIGRhdGEtbmFtZT0iUGF0aCA1MTE1IiBkPSJNMTAwLjA3NSw2NS4wMTJoMi44NTlWNjIuOTQ5YzAtLjcxNCwwLS43MS42OS0uNzE5LjU3Ny0uMDA3LDEuMTU1LS4wMSwxLjczMS0uMDQ1LjMtLjAxOS40MjQuMDkyLjQxOS4zNzktLjAxMy42NjcsMCwxLjMzNy0uMDQ4LDItLjAyNy4zODUuMDg2LjUxOS40Ny41LjY2Ny0uMDI3LDEuMzM3LS4wMzYsMi0uMDE4LjMyMi4wMDguNDMxLS4xLjQyLS40MTQtLjAyMi0uNjY3LS4wMDctMS4zMzYtLjAzMi0yLS4wMTItLjMzOS4xMTEtLjQ1OC40NS0uNDQ3LjY2OC4wMjEsMS4zMzcuMDI1LDIsMCwuMzE5LS4wMTEuNDM1LjA4NS40MjEuNDA5LS4wMjkuNjY3LS4wMTQsMS4zMzctLjA0NywyLS4wMTUuMy4wNC40NTguMzguNDUyLjgtLjAxMywxLjYwOSwwLDIuNDY1LDB2Mi44MTRoLS41OGMtLjYyMywwLTEuMjQ3LS4wMTMtMS44NjguMDE2LS4xMjMuMDA1LS4zMzguMTcyLS4zNDEuMjctLjAyNy44NDgtLjAxNiwxLjctLjAxNiwyLjZoMi44djIuOTMySDExMS40N2MwLC44NzUsMCwxLjcwNiwwLDIuNTM2LDAsLjMuMjI0LjI3Mi40MjEuMjcuNjY5LS4wMDgsMS4zMzgsMCwyLS4wMzMuMzM3LS4wMTYuNDYyLjA4Ni40NDkuNDMyLS4wMjYuNjY3LS4wMzMsMS4zMzYtLjAxMiwyLC4wMTEuMzQ4LS4xMTcuNDUzLS40NDcuNDQ2LS42ODMtLjAxNS0xLjM2OC0uMDE1LTIuMDUuMDEtLjExMSwwLS4zMDguMTYtLjMxLjI1LS4wMjQuODMzLS4wMTQsMS42NjYtLjAxNCwyLjU1MmgyLjc4MVY4Ny44OGgtNS42NWMwLS44MTgtLjAxOS0xLjYxOC4wMDgtMi40MTcuMDEzLS4zOTEtLjEzMy0uNDkxLS41LS40NzktLjc1Ny4wMjQtMS41MTYuMDA3LTIuMzMuMDA3LDAtLjk1MywwLTEuODg3LDAtMi44MmgyLjgxN2MwLS45LjAwOC0xLjc2Ni0uMDE0LTIuNjI2LDAtLjA3Ny0uMi0uMjA5LS4zMS0uMjEzcS0xLjExNS0uMDM5LTIuMjMxLS4wMjFjLS4xLDAtLjI3NC4xMjktLjI3NS4yLS4wMDcuODkxLjAxMiwxLjc4Mi4wMjUsMi42NzJIMTAzVjg3LjloMi43NzVjMCwuOTIuMDExLDEuNzk0LS4wMTcsMi42NjYsMCwuMDkxLS4yNDYuMjUtLjM3Ny4yNDktMi40MTUtLjAwNy00LjgzLS4wMzktNy4yNDQtLjA1NC0uOTI5LS4wMDYtLjk0OC4wMjUtLjkyNS45MzQuMDEzLjUuMDE4LDEsLjA0NSwxLjUuMDE2LjI5My0uMDg3LjQwOC0uMzg4LjQtLjgtLjAxNC0xLjYwNSwwLTIuNSwwLDAsLjkzMi0uMDA3LDEuNzkzLjAxMiwyLjY1MywwLC4wNzQuMTczLjIwNi4yNjcuMjA2LDEuNjg2LDAsMy4zNzMtLjAxOCw1LjA1OS0uMDI4LjI2NSwwLC4zNzEtLjEwNi4zNjMtLjM4Ni0uMDE4LS42NTMuMDEyLTEuMzA3LS4wMTItMS45Ni0uMDE0LS4zNjUuMDg0LS41MTIuNDc3LS41MSwyLjU4My4wMTEsNS4xNjYsMCw3Ljc0OSwwLC4yNTEsMCwuMzYyLjA3Ni4zNjEuMzM1LDAsLjctLjAwNiwxLjQuMDEzLDIuMS4wMS4zNjctLjE1NC40Ni0uNS40NTktMi42LS4wMS01LjIsMC03LjgsMC0uMDc1LDAtLjE1LjAwNy0uMjc2LjAxM3YyLjc2M0g4NS44Njh2LTIuOEg4OGMuNzIyLDAsLjcxOCwwLC43MDgtLjcxMS0uMDA4LS41OTItLjAyNy0xLjE4NiwwLTEuNzc3LjAxNi0uMzMtLjEwOS0uMzY5LS4zOTUtLjM2Mi0uOC4wMi0xLjYwNy4wMDctMi40ODEuMDA3LDAtMS45MTcsMC0zLjc5MiwwLTUuNjY4bC0uMDEzLjAxNUg4OC43Vjg0Ljk5M2MuNzksMCwxLjUxNS0uMDMyLDIuMjM1LjAxMS40NzkuMDI4LjYtLjE0LjU3Ny0uNTkxLS4wMjgtLjU5LjAwOS0xLjE4NC4wMzYtMS43NzUuMDE1LS4zMzctLjA3MS0uNS0uNDU3LS40NzgtLjY4Mi4wMzItMS4zNjcuMDA1LTIuMDUuMDA4LS4zLDAtLjQyMi0uMDgxLS4zOTQtLjQzMWExOC45NDQsMTguOTQ0LDAsMCwwLC4wMzItMS45NTNjLS4wMDctLjMyMS4wNTktLjQ2NC40MjEtLjQ2MSwxLjcxNS4wMTYsMy40My4wMDcsNS4yMTQuMDA3Vjg0Ljk5Yy0uODMsMC0xLjYxNy4wMTUtMi40LS4wMDctLjMyNi0uMDA5LS40MjQuMTA4LS40MTcuNDE4LjAxNi42NjgtLjAxNSwxLjMzOC4wMTcsMiwuMDIuNDE3LS4xNDMuNTIzLS41My41MDktLjcyNy0uMDI1LTEuNDU1LS4wMDctMi4yNS0uMDA3djIuODQ0Yy4yMjcsMCwuNDk0LDAsLjc2MSwwLDIuNDYuMDE4LDQuOTIuMDQsNy4zOC4wNDUuMTIzLDAsLjM1NC0uMTM3LjM1NC0uMjEzLjAxMi0uODQ4LS4wMTEtMS43LS4wMy0yLjU0NSwwLS4wMzYtLjA1Mi0uMDctLjA4LS4xMDZsLS4wMS4wMTFoMi45NTl2LS42OTJjMC0xLjUzNS4wMTMtMy4wNy0uMDEtNC42LS4wMDYtLjM3OC4xMzktLjQ3Ni40NzMtLjQ3My44LjAwOSwxLjYsMCwyLjQyOSwwVjc5LjM2Yy0uMTQyLS4wMTEtLjI3My0uMDI5LS40LS4wMjktMS42MjYsMC0zLjI1Mi0uMDEtNC44NzguMDE0LS4zODEuMDA2LS41MDYtLjEtLjUtLjQ4LjAyMi0uNzcxLjAwNy0xLjU0Mi4wMDctMi4zNzYtLjgwNywwLTEuNTYzLS4wMTUtMi4zMTcuMDA2LS4zODUuMDExLS41NjUtLjA0LS41MzQtLjUxNi4wNDgtLjc1NC0uMDE1LTEuNTE2LS4wMzItMi4yNzRsLS4wMTIuMDE1Yy42NzgtLjAzNCwxLjM1Ny0uMDcyLDIuMDM2LS4xLjI1NS0uMDExLjUxMiwwLC44MjYsMFY3MC43OGg1Ljc5NVY2Ny44NjloLTIuODYxVjY1Wm01LjcxMyw1Ljc1NmMuODY3LDAsMS43MTUuMDEsMi41NjItLjAxNC4wOTUsMCwuMjU5LS4yLjI2My0uMzA5LjAyNS0uNzQzLjAxMi0xLjQ4OC4wMTgtMi4yMzEsMC0uMjUyLS4xMDctLjM0Ny0uMzYtLjM0NC0uNzI4LjAxMS0xLjQ1Ni0uMDA2LTIuMTg0LjAxNS0uMSwwLS4yODQuMTQ5LS4yODYuMjMxLS4wMjEuODYxLS4wMTMsMS43MjQtLjAxMywyLjY1Mm0yLjg0OCw1LjdjMC0uOSwwLTEuNzUsMC0yLjYsMC0uMjUyLS4xMzMtLjMtLjM1LS4yODctLjcyNC4wMzQtMS40NDguMDY2LTIuMTczLjA3OS0uMjU5LDAtLjMzOS4xMS0uMzQxLjM1NS0uMDA3LjcxLS4wNDIsMS40MjEtLjAzNiwyLjEzMSwwLC4xMDcuMTU5LjMuMjQ5LjMuODU5LjAyMywxLjcxOC4wMTQsMi42NDkuMDE0bS04LjYtMi43NzNIOTcuMjI5djIuNzc0aDIuODA3WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTU0LjM0NiAtMzkuMzc3KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTYiIGRhdGEtbmFtZT0iUGF0aCA1MTE2IiBkPSJNMjUuNywzOC43MzljLjAxNC4yMzkuMDM5LjQ3OS4wNDEuNzE4LjAwOCwxLjUzNC4wMTgsMy4wNjcuMDEyLDQuNiwwLC4zLjA1Ni40NDkuNC40NC42NjgtLjAxNywxLjMzNi4wMDgsMiwuMDExLjM2MiwwLC41MzctLjEzMy41MTctLjU0Ni0uMDM2LS43NC0uMDEtMS40ODItLjAxLTIuMjY2Ljc3NiwwLDEuNTE0LDAsMi4yNTMsMCwuNTg2LDAsLjY1MS0uMDY0LjY1LS42NDcsMC0uNzQxLDAtMS40ODEsMC0yLjI1Mi4xNy0uMDA4LjI4Ny0uMDE3LjQtLjAxNywxLjYxMSwwLDMuMjIyLjAwNiw0LjgzMy0uMDA2LjMxMywwLC40Mi4wODUuNDE3LjQxMS0uMDE0LDEuNjEtLjAxNiwzLjIyMi4wMDgsNC44MzIuMDA2LjQxNy0uMTMzLjUxOC0uNTI2LjUtLjYzNy0uMDMyLTEuMjc2LDAtMS45MTQtLjAxMS0uMzU4LS4wMDctLjQ3OS4xNDctLjQ2NC41LjAyOS42NTEuMDI1LDEuMy4wMzUsMS45NTUuMDA1LjMyMi0uMTc0LjQwNy0uNDY3LjQtLjY2OC0uMDEzLTEuMzM4LS4wMjQtMi4wMDUsMC0uMzU1LjAxMy0uMzkzLS4xNDQtLjM4LS40MzkuMDMtLjY4Mi4wMzItMS4zNjYuMDQxLTIuMDQ5LDAtLjEzMi0uMDE5LS4yNjYtLjAzLS40LS44NzgsMC0xLjcyNC0uMDEyLTIuNTY4LjAxNi0uMSwwLS4yNy4yMjEtLjI3NS4zNDQtLjAyNi42ODMtLjAyOCwxLjM2OCwwLDIuMDUxLjAxMi4zMzItLjA3Ny40NjQtLjQyNy40NTQtLjY4My0uMDIxLTEuMzY4LDAtMi4wNTEtLjAwOC0uMjg4LDAtLjQuMDk0LS40LjQsMCwuNjY4LDAsMS4zMzgtLjA1MywyLS4wMzEuNDMyLjE2MS41LjUzLjQ5NCwxLjY3MS0uMDIxLDMuMzQzLS4wMjEsNS4wMTQtLjAyOGguMjczVjUzLjAxaDEuODU5YzEuMTI0LDAsMi4yNDktLjAxMywzLjM3MywwLC4zMzIsMCwuNDU2LS4wODcuNDQ0LS40MzgtLjAyNC0uNjgzLS4wMS0xLjM2OC4wMDctMi4wNTEuMDA4LS4zLS4xLS4zOS0uNC0uMzc1LS43MTIuMDM1LTEuNDI3LjA0Mi0yLjE0LjAzLS4xMjcsMC0uMzU5LS4xNDEtLjM2MS0uMjIyLS4wMjctLjg1OS0uMDE3LTEuNzItLjAxNy0yLjYsMS4xNCwwLDIuMTY5LDAsMy4yLDAsLjcyOSwwLDEuNDU5LjAwNiwyLjE4OC0uMDE1LjI3NS0uMDA4LjM4LjA3Mi4zOC4zNTVxMCwyLjUyOS4wMTMsNS4wNTljMCwuMzEyLS4yMTIuMjg0LS40MDYuMjg1LS43ODksMC0xLjU3NywwLTIuNDY1LDAsMCwuNTIzLDAsMS4wNjIsMCwxLjYtLjAxMSwxLjI3Ny0uMDEzLDEuMjc3LTEuMjY5LDEuMjc3SDI4LjY3M2MwLDEsMCwxLjk2NCwwLDIuOTNIMjUuNzY3YzAsLjg2Ny0uMDA2LDEuNzExLjAxLDIuNTU0YS4zMTcuMzE3LDAsMCwwLC4yMjkuMjA2Yy44NzIuMDE1LDEuNzQ1LjAxLDIuNjUxLjAxVjU4LjgzNmMxLjc3NC0uMDIzLDMuNTQ4LS4wNDIsNS4zMjEtLjA3My4yOTMtLjAwNS40NDkuMDUyLjQzOS40LS4wMjEuNy0uMDEyLDEuNCwwLDIuMDkzLjAwNS4yOTMtLjEwNy40MDYtLjQuNC0uNzg3LS4wMTItMS41NzQsMC0yLjQ0MSwwVjYzLjRjMCwxLjA3LDAsMS4wNjYtMS4wODgsMS4wNjEtLjUzMSwwLTEuMDYxLjAxNC0xLjU5Mi4wMjRhMi4zMzMsMi4zMzMsMCwwLDAtLjI0Mi4wMzZ2Mi44bC4wMDktLjAxYy0xLjczMS4wMDYtMy40NjMsMC01LjE5NC4wMjYtLjM3NS4wMDYtLjUtLjA3Ny0uNS0uNDcyLjAxOC0xLjU2NS4wMDYtMy4xMy0uMDA4LTQuNjk0LS4wMDYtLjU5My0uMDcxLS42LS42MDUtLjU3MS0xLjU2MS4wNy0zLjEyOC4wMTgtNC42OTMuMDI1LS4zMiwwLS40MTQtLjEyNy0uNDA1LS40MzkuMDIxLS43NTcuMDA3LTEuNTE1LjAwNy0yLjM1LjMyMS0uMDIzLjYyOS0uMDY1LjkzNy0uMDY1LDIuMzg1LDAsNC43NzEuMDA3LDcuMTU1LjAzNy4zNTYsMCwuNDU2LS4xMS40NTQtLjQzMS0uMDA3LS44LDAtMS42LDAtMi40MzItLjIyOS0uMDE0LS4zNjEtLjAzLS40OTMtLjAzLTIuNTIyLDAtNS4wNDUuMDA2LTcuNTY3LS4wMDgtLjM3MywwLS41MDcuMDg4LS40ODMuNDgzLjAzOC42MzYuMDE2LDEuMjc0LjAxNCwxLjkxMiwwLC4zNzgtLjE5NC41MzktLjU3NC41MzMtLjc0LS4wMTItMS40ODIsMC0yLjI3OSwwdjIuOGMtLjYyOCwwLTEuMiwwLTEuNzcyLDAtMS4xODUsMC0yLjM3LS4wMTQtMy41NTUtLjAxMy0uMzI1LDAtLjQzMS0uMTA2LS40MjMtLjQ1OC4wMzEtMS41MTkuMDI3LTMuMDM4LjAxOS00LjU1OGE0LjAwOCw0LjAwOCwwLDAsMC0uMTMxLS43MWgyLjkxNVY1MC4xODZjLS43MjksMC0xLjQyNSwwLTIuMTIxLDAtLjcxNSwwLS43MDctLjAwOC0uNzE0LjcyNi0uMDE4LDEuNjY2LS4wNDQsMy4zMzItLjA2Niw1SDUuODU4Yy0uMDE1LjIxNS0uMDM5LjM5Mi0uMDM4LjU2OC4wMTEsMS41OC4wMjEsMy4xNjEuMDQ2LDQuNzQxLjAwNS4zMDktLjA4My40NDMtLjQxMS40MzUtLjctLjAxOC0xLjQtLjAxNC0yLjEtLjAwNi0uMjU2LDAtLjQtLjA2Ny0uNC0uMzU1LjAwNS0xLjc3NCwwLTMuNTQ4LDAtNS4zNjguODQ2LDAsMS42MzMtLjAxNiwyLjQxOS4wMDcuMzUyLjAxLjQ5LS4wODguNDc5LS40NTgtLjAyMi0uOC0uMDA3LTEuNi0uMDA3LTIuNDI3LS44MzksMC0xLjYzOS0uMDI2LTIuNDM2LjAxMi0uMzcxLjAxOC0uNDc5LS4wNzUtLjQ2Ny0uNDQyLjAyNC0uOC4wMDctMS42LjAwNy0yLjQzN0guMTMyYzAtLjg2Ni0uMDExLTEuNy4wMTQtMi41MjcsMC0uMS4xOTEtLjI1MS4zMTQtLjI3NmEzLjQyOCwzLjQyOCwwLDAsMSwuNjgxLS4wMTNjNC4yNywwLDguNTQsMCwxMi44MS0uMDE1LjQsMCwuNDk0LjEzNC40ODYuNS0uMDE5Ljc3Mi0uMDA2LDEuNTQ1LS4wMDYsMi4zNDdoMi43NjJ2Mi43NjlhMi41NjgsMi41NjgsMCwwLDAsLjM2MS4wNjJjMS42NTYuMDEyLDMuMzEyLjAxNyw0Ljk2OC4wMzIuMzI0LDAsLjUtLjA2Ni40ODYtLjQ1Ny0uMDM0LS43NDMtLjAxNy0xLjQ4OC0uMDI2LTIuMjMzYTEuMSwxLjEsMCwwLDAtLjA1Ni0uMjI5SDE3LjI2OWMwLS44NzksMC0xLjcsMC0yLjUxNCwwLS4zMzYuMjY1LS4yNjYuNDY3LS4yNjZxMy4xOTEsMCw2LjM4My4wMTNjLjUyOCwwLDEuMDU3LDAsMS42MzksMHYtMi44NWMtLjg1MSwwLTEuNjM3LS4wMTctMi40MjIuMDA4LS4zNDIuMDEtLjQzMi0uMDgzLS40MjUtLjQzMy4wMjktMS40NzQuMDIyLTIuOTQ4LjAyOC00LjQyMiwwLS4yODQsMC0uNTY3LDAtLjkyNGgyLjc2NGwtLjAwOC0uMDA3bTUuODczLDNjMCwuNzgxLjAyMiwxLjU1MS0uMDEsMi4zMTgtLjAxNS4zNTguMTI1LjQ1MS40MzkuNDQ4LjY1Mi0uMDA4LDEuMy0uMDI3LDEuOTU1LDAsLjMxNy4wMTUuNDE1LS4xMi40MTUtLjM4NCwwLS43MjcsMC0xLjQ1NS0uMDM2LTIuMTgxYS40NTguNDU4LDAsMCwwLS4zMzEtLjNjLS43ODYuMDA4LTEuNTcuMDU2LTIuNDMyLjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0wLjA4MiAtMjQuNTMyKSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTciIGRhdGEtbmFtZT0iUGF0aCA1MTE3IiBkPSJNMTI4LjkwNiwyMC4wM0gxMDguOTU3Vi4xNGgxOS45NDlabS0yLjg1LTIuOFYyLjk3OUgxMTEuODM3YTEuMDg0LDEuMDg0LDAsMCwwLS4wMzYuMTc1cTAsNi44MzQtLjAwNywxMy42NjljMCwuMy4xMzEuNDExLjQwOC40MDcuMTM3LDAsLjI3NC4wMDYuNDEuMDA2bDEwLjcwNy0uMDFoMi43MzciIHRyYW5zZm9ybT0idHJhbnNsYXRlKC02OC45OTcgLTAuMDg5KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTgiIGRhdGEtbmFtZT0iUGF0aCA1MTE4IiBkPSJNMCwuMDQ1Qy4xODMuMDM2LjMxNy4wMjUuNDUxLjAyNVExMCwuMDE1LDE5LjU0OSwwYy4zMjgsMCwuNDQ1LjA1Mi40NDUuNDE0cS0uMDA2LDkuMzIxLjAxNiwxOC42NDNjMCwuOTM2LDAsLjkzLS45MjkuOTNMLjgsMTkuOTc2Yy0uNzUxLDAtLjc0LS4wMDUtLjc0Mi0uNzQzUS4wMzQsMTAuMzkyLDAsMS41NTFDMCwxLjA2NiwwLC41ODIsMCwuMDQ1TTE3LjE2NCwxNy4xNjZjMC0uNDA2LDAtLjczNywwLTEuMDY4LS4wMTQtNC4yMjQtLjAzNi04LjQ0Ny0uMDMxLTEyLjY3MSwwLS40NTEtLjA5MS0uNi0uNTY4LS41OTQtNC4zNjEuMDIxLTguNzIxLjAxNi0xMy4wODIuMDE4LS42MywwLS42MzIsMC0uNjMxLjYzOXEuMDA4LDYuMzU4LjAxNSwxMi43MTdjMCwuOTI4LS4wMTQuOTI1LjkxLjkyN2wxMS4xMjEuMDMxYy43MjgsMCwxLjQ1NSwwLDIuMjY2LDAiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMC4wMDEpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTExOSIgZGF0YS1uYW1lPSJQYXRoIDUxMTkiIGQ9Ik0uMjc2LDEyOC44MjNjMC0uMjQsMC0uNDgsMC0uNzIxcS0uMDIyLTkuMy0uMDQ0LTE4LjU5MWMwLS42MTgsMC0uNjE0LjYxOC0uNjE0cTguOTMxLjAwNywxNy44NjIuMDFjLjIsMCwuMzk1LDAsLjU5Mi0uMDA4LjkwNy0uMDE4LjkxMi0uMDE4LjkxMy45MTVxLjAwOCw5LjIyNy4wMTEsMTguNDU1di41NTRabTE3LjExNi0xNy4xMTJjLS44OSwwLTEuNzM2LDAtMi41ODIsMC0zLjcyMS4wMDktNy40NDMuMDI4LTExLjE2NC4wMTgtLjQ1NCwwLS41NTYuMTQ1LS41NTUuNTY2cS4wMTcsNi42NzcsMCwxMy4zNTNjMCwuMzYxLjE2Ny4zOC40NDcuMzc5cTYuNTYzLS4wMSwxMy4xMjUtLjAxYy4yMzgsMCwuNDc1LS4wMjEuNzMtLjAzM1oiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0wLjE0NyAtNjguOTU4KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjAiIGRhdGEtbmFtZT0iUGF0aCA1MTIwIiBkPSJNNjguMTc4LDExNi42N2gyLjljMCwxLjk1MywwLDMuODU3LDAsNS43NjJsLjAxMi0uMDE0SDY4LjIxMmMwLC43NzgtLjAwOSwxLjUxNywwLDIuMjU2LjAwOS41NjcuMDIuNTc0LS41NjguNTgtLjYwNy4wMDYtMS4yMTUuMDI1LTEuODE5LS4wMi0uMzg2LS4wMjktLjQ2OS4xMTgtLjQ2OC40NTcuMDA4LDIuMDY0LDAsNC4xMjksMCw2LjE5NCwwLC41LjAyLDEsMCwxLjUtLjAwNi4xMjctLjEzNy4zNTMtLjIxNi4zNTYtLjg1OC4wMjYtMS43MTcuMDE2LTIuNi4wMTZ2LTE0LjI0aDUuNjQyVjExNi42NmwtLjAwOS4wMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTM5LjYwNyAtNzMuODc1KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjEiIGRhdGEtbmFtZT0iUGF0aCA1MTIxIiBkPSJNNjguMDA2LDguNjEyVjUuOGMtLjE2MS0uMDE0LS4yNzUtLjAzMi0uMzg5LS4wMzItMS42MjUsMC0zLjI1LS4wMDctNC44NzYuMDE1LS4zODguMDA1LS41NDItLjA4MS0uNTEzLS41YTExLjc1MywxMS43NTMsMCwwLDAsMC0xLjc3NWMtLjAzOC0uNDUuMS0uNTg2LjU0MS0uNTc2LDEuNDEyLjAzMiwyLjgyNC4wMzYsNC4yMzcuMDQ5LjMsMCwuNiwwLC45NTMsMFYuMTI4aDIuODMzYzAsMS43MjMuMDE0LDMuNDM0LS4wMSw1LjE0NC0uMDA2LjQyMy4wODkuNTUxLjUzMS41MjEuNzcxLS4wNTMsMS41NDctLjAyNiwyLjMyMS0uMDMzbC0uMDA5LS4wMWMuMDA5LDEuOC4wMjIsMy42LjAxOCw1LjQwNywwLC4xMDktLjEzNS4zMDktLjIxMi4zMTEtLjg1Ny4wMjItMS43MTUuMDE0LTIuNTcyLjAxNCwwLS44OTEtLjAxNS0xLjY3My4wMDctMi40NTUuMDEtLjMzLS4wNy0uNDYtLjQyNS0uNDQ3LS44MTYuMDI3LTEuNjMzLjAxNS0yLjQ1LjAybC4wMTUuMDEzIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzkuNDAyIC0wLjA4MSkiIGZpbGw9IiNhZWM3MzciLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTIyIiBkYXRhLW5hbWU9IlBhdGggNTEyMiIgZD0iTTY4LjAyLDIzLjIyNXY1LjY5SDY1LjA0NmwuMDA4LjAwN3EwLTEuNDIzLDAtMi44NDlINjIuMjdjMC0uODc4LS4wMTgtMS43MjEuMDI0LTIuNTYxLjAwNS0uMS4zMzMtLjI2Ny41MTQtLjI3LDEuMTUyLS4wMjEsMi4zLDAsMy40NTcsMCwuNTg5LDAsMS4xNzksMCwxLjc2OSwwbC0uMDE0LS4wMTIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zOS40MyAtMTQuNzA3KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjMiIGRhdGEtbmFtZT0iUGF0aCA1MTIzIiBkPSJNOTMuMzI0LDUuNzU4Vi4xMjdoMi44MzVBLjk2MS45NjEsMCwwLDEsOTYuMi4zMzNxMCwyLjQzOCwwLDQuODc2YzAsLjU4Ny0uMDI2LjYtLjYxOS41OC0uNzU3LS4wMjItMS41MTYtLjAyOC0yLjI3My0uMDQxbC4wMDkuMDEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01OS4wOTIgLTAuMDgpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyNCIgZGF0YS1uYW1lPSJQYXRoIDUxMjQiIGQ9Ik0xNDguMTA2LDE1OC4yOGMwLS44MjIsMC0xLjYzOCwwLTIuNDU0LDAtLjIzNC4wODMtLjM0LjM1Ny0uMzMuNzExLjAyNywxLjQyMy4wMjEsMi4xMzQuMDA4LjI2LS4wMDUuNC4wNTEuMzkxLjM0NC0uMDE4Ljc0Mi0uMDEsMS40ODQtLjAzOCwyLjIyNSwwLC4xMDYtLjE1My4yOTQtLjIzNi4yOTUtLjgzMS4wMDktMS42NjItLjAxMi0yLjQ5My0uMDMtLjA0LDAtLjA3OS0uMDM5LS4xMTYtLjA1OCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTkzLjc4OSAtOTguNDY4KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjUiIGRhdGEtbmFtZT0iUGF0aCA1MTI1IiBkPSJNMTE5LjY0NCw2NS4wNTJjLS44NzcuMDEzLTEuNzU0LjAzNi0yLjYzLjAyOGEuNDA3LjQwNywwLDAsMS0uMy0uMjYyYy0uMDIzLS44My0uMDE0LTEuNjYxLS4wMTQtMi41NTIuNjE4LDAsMS4yLDAsMS43ODYsMCwxLjEyOSwwLDEuMTI4LS4wMDYsMS4xMywxLjExOSwwLC41Ni4wMDcsMS4xMi4wMTEsMS42OGwuMDE0LS4wMTIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC03My45MDEgLTM5LjQyOSkiIGZpbGw9IiNhZWM3MzciLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTI3IiBkYXRhLW5hbWU9IlBhdGggNTEyNyIgZD0iTTExMS45MzIsMTI3LjM2OWgtMi43MTh2LTIuOTEyaDIuNzA4cTAsMS40NjIsMCwyLjkyM2wuMDEtLjAxMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTY5LjE2IC03OC44MTMpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyOCIgZGF0YS1uYW1lPSJQYXRoIDUxMjgiIGQ9Ik0xMjQuNzE5LDE1LjYzMWg4LjQyNmEuMzA3LjMwNywwLDAsMSwuMDQ3LjExMWMuMDEzLDIuNi4wMjksNS4yLjAzLDcuNzkzLDAsLjYyLS4wMjIuNjEyLS42MzIuNjExcS0zLjczOCwwLTcuNDc1LDBoLS40WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTc4Ljk3OSAtOS44OTgpIiBmaWxsPSIjMWExODE4Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyOSIgZGF0YS1uYW1lPSJQYXRoIDUxMjkiIGQ9Ik0yNC4yNTIsMjQuMDMzSDE1LjY0NVYxNS41NmE1Ljc1Myw1Ljc1MywwLDAsMSwuNTk0LS4wNTljMi40NDUtLjAwNiw0Ljg5LDAsNy4zMzUtLjAxNS40NTMsMCwuNjU2LjEyMS42NTQuNjEzLS4wMDcsMi4zNjkuMDEzLDQuNzM4LjAyMyw3LjEwNywwLC4yNTcsMCwuNTE1LDAsLjgyNyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTkuOTA3IC05LjgwNikiLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTMwIiBkYXRhLW5hbWU9IlBhdGggNTEzMCIgZD0iTTI0LjMxLDEyNC40NzN2OC41ODRjLS42MDcsMC0xLjE5MiwwLTEuNzc3LDAtMi4wOTUtLjAwNi00LjE5LS4wMjItNi4yODUtLjAxMy0uNCwwLS40ODktLjEyMi0uNDg0LS41MjUuMDI4LTIuMzgzLjAxNy00Ljc2Ny4wMTktNy4xNSwwLS4yODcsMC0uNTc0LDAtLjlaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtOS45ODIgLTc4LjgyMykiIGZpbGw9IiMxYTE4MTgiLz4NCiAgICAgICAgPC9nPg0KICAgICAgPC9nPg0KICAgIDwvZz4NCiAgPC9nPg0KPC9zdmc+DQo=";
        } else {
            Qrcode =
                "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI1OS45MDIiIHZpZXdCb3g9IjAgMCA2MCA1OS45MDIiPg0KICA8ZyBpZD0iVVAiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMCkiPg0KICAgIDxnIGlkPSJHcm91cF8zNDMzIiBkYXRhLW5hbWU9Ikdyb3VwIDM0MzMiPg0KICAgICAgPGcgaWQ9Ikdyb3VwXzM0MDUiIGRhdGEtbmFtZT0iR3JvdXAgMzQwNSI+DQogICAgICAgIDxnIGlkPSJHcm91cF8zNDM0IiBkYXRhLW5hbWU9Ikdyb3VwIDM0MzQiPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTUiIGRhdGEtbmFtZT0iUGF0aCA1MTE1IiBkPSJNMTAwLjA3NSw2NS4wMTJoMi44NTlWNjIuOTQ5YzAtLjcxNCwwLS43MS42OS0uNzE5LjU3Ny0uMDA3LDEuMTU1LS4wMSwxLjczMS0uMDQ1LjMtLjAxOS40MjQuMDkyLjQxOS4zNzktLjAxMy42NjcsMCwxLjMzNy0uMDQ4LDItLjAyNy4zODUuMDg2LjUxOS40Ny41LjY2Ny0uMDI3LDEuMzM3LS4wMzYsMi0uMDE4LjMyMi4wMDguNDMxLS4xLjQyLS40MTQtLjAyMi0uNjY3LS4wMDctMS4zMzYtLjAzMi0yLS4wMTItLjMzOS4xMTEtLjQ1OC40NS0uNDQ3LjY2OC4wMjEsMS4zMzcuMDI1LDIsMCwuMzE5LS4wMTEuNDM1LjA4NS40MjEuNDA5LS4wMjkuNjY3LS4wMTQsMS4zMzctLjA0NywyLS4wMTUuMy4wNC40NTguMzguNDUyLjgtLjAxMywxLjYwOSwwLDIuNDY1LDB2Mi44MTRoLS41OGMtLjYyMywwLTEuMjQ3LS4wMTMtMS44NjguMDE2LS4xMjMuMDA1LS4zMzguMTcyLS4zNDEuMjctLjAyNy44NDgtLjAxNiwxLjctLjAxNiwyLjZoMi44djIuOTMySDExMS40N2MwLC44NzUsMCwxLjcwNiwwLDIuNTM2LDAsLjMuMjI0LjI3Mi40MjEuMjcuNjY5LS4wMDgsMS4zMzgsMCwyLS4wMzMuMzM3LS4wMTYuNDYyLjA4Ni40NDkuNDMyLS4wMjYuNjY3LS4wMzMsMS4zMzYtLjAxMiwyLC4wMTEuMzQ4LS4xMTcuNDUzLS40NDcuNDQ2LS42ODMtLjAxNS0xLjM2OC0uMDE1LTIuMDUuMDEtLjExMSwwLS4zMDguMTYtLjMxLjI1LS4wMjQuODMzLS4wMTQsMS42NjYtLjAxNCwyLjU1MmgyLjc4MVY4Ny44OGgtNS42NWMwLS44MTgtLjAxOS0xLjYxOC4wMDgtMi40MTcuMDEzLS4zOTEtLjEzMy0uNDkxLS41LS40NzktLjc1Ny4wMjQtMS41MTYuMDA3LTIuMzMuMDA3LDAtLjk1MywwLTEuODg3LDAtMi44MmgyLjgxN2MwLS45LjAwOC0xLjc2Ni0uMDE0LTIuNjI2LDAtLjA3Ny0uMi0uMjA5LS4zMS0uMjEzcS0xLjExNS0uMDM5LTIuMjMxLS4wMjFjLS4xLDAtLjI3NC4xMjktLjI3NS4yLS4wMDcuODkxLjAxMiwxLjc4Mi4wMjUsMi42NzJIMTAzVjg3LjloMi43NzVjMCwuOTIuMDExLDEuNzk0LS4wMTcsMi42NjYsMCwuMDkxLS4yNDYuMjUtLjM3Ny4yNDktMi40MTUtLjAwNy00LjgzLS4wMzktNy4yNDQtLjA1NC0uOTI5LS4wMDYtLjk0OC4wMjUtLjkyNS45MzQuMDEzLjUuMDE4LDEsLjA0NSwxLjUuMDE2LjI5My0uMDg3LjQwOC0uMzg4LjQtLjgtLjAxNC0xLjYwNSwwLTIuNSwwLDAsLjkzMi0uMDA3LDEuNzkzLjAxMiwyLjY1MywwLC4wNzQuMTczLjIwNi4yNjcuMjA2LDEuNjg2LDAsMy4zNzMtLjAxOCw1LjA1OS0uMDI4LjI2NSwwLC4zNzEtLjEwNi4zNjMtLjM4Ni0uMDE4LS42NTMuMDEyLTEuMzA3LS4wMTItMS45Ni0uMDE0LS4zNjUuMDg0LS41MTIuNDc3LS41MSwyLjU4My4wMTEsNS4xNjYsMCw3Ljc0OSwwLC4yNTEsMCwuMzYyLjA3Ni4zNjEuMzM1LDAsLjctLjAwNiwxLjQuMDEzLDIuMS4wMS4zNjctLjE1NC40Ni0uNS40NTktMi42LS4wMS01LjIsMC03LjgsMC0uMDc1LDAtLjE1LjAwNy0uMjc2LjAxM3YyLjc2M0g4NS44Njh2LTIuOEg4OGMuNzIyLDAsLjcxOCwwLC43MDgtLjcxMS0uMDA4LS41OTItLjAyNy0xLjE4NiwwLTEuNzc3LjAxNi0uMzMtLjEwOS0uMzY5LS4zOTUtLjM2Mi0uOC4wMi0xLjYwNy4wMDctMi40ODEuMDA3LDAtMS45MTcsMC0zLjc5MiwwLTUuNjY4bC0uMDEzLjAxNUg4OC43Vjg0Ljk5M2MuNzksMCwxLjUxNS0uMDMyLDIuMjM1LjAxMS40NzkuMDI4LjYtLjE0LjU3Ny0uNTkxLS4wMjgtLjU5LjAwOS0xLjE4NC4wMzYtMS43NzUuMDE1LS4zMzctLjA3MS0uNS0uNDU3LS40NzgtLjY4Mi4wMzItMS4zNjcuMDA1LTIuMDUuMDA4LS4zLDAtLjQyMi0uMDgxLS4zOTQtLjQzMWExOC45NDQsMTguOTQ0LDAsMCwwLC4wMzItMS45NTNjLS4wMDctLjMyMS4wNTktLjQ2NC40MjEtLjQ2MSwxLjcxNS4wMTYsMy40My4wMDcsNS4yMTQuMDA3Vjg0Ljk5Yy0uODMsMC0xLjYxNy4wMTUtMi40LS4wMDctLjMyNi0uMDA5LS40MjQuMTA4LS40MTcuNDE4LjAxNi42NjgtLjAxNSwxLjMzOC4wMTcsMiwuMDIuNDE3LS4xNDMuNTIzLS41My41MDktLjcyNy0uMDI1LTEuNDU1LS4wMDctMi4yNS0uMDA3djIuODQ0Yy4yMjcsMCwuNDk0LDAsLjc2MSwwLDIuNDYuMDE4LDQuOTIuMDQsNy4zOC4wNDUuMTIzLDAsLjM1NC0uMTM3LjM1NC0uMjEzLjAxMi0uODQ4LS4wMTEtMS43LS4wMy0yLjU0NSwwLS4wMzYtLjA1Mi0uMDctLjA4LS4xMDZsLS4wMS4wMTFoMi45NTl2LS42OTJjMC0xLjUzNS4wMTMtMy4wNy0uMDEtNC42LS4wMDYtLjM3OC4xMzktLjQ3Ni40NzMtLjQ3My44LjAwOSwxLjYsMCwyLjQyOSwwVjc5LjM2Yy0uMTQyLS4wMTEtLjI3My0uMDI5LS40LS4wMjktMS42MjYsMC0zLjI1Mi0uMDEtNC44NzguMDE0LS4zODEuMDA2LS41MDYtLjEtLjUtLjQ4LjAyMi0uNzcxLjAwNy0xLjU0Mi4wMDctMi4zNzYtLjgwNywwLTEuNTYzLS4wMTUtMi4zMTcuMDA2LS4zODUuMDExLS41NjUtLjA0LS41MzQtLjUxNi4wNDgtLjc1NC0uMDE1LTEuNTE2LS4wMzItMi4yNzRsLS4wMTIuMDE1Yy42NzgtLjAzNCwxLjM1Ny0uMDcyLDIuMDM2LS4xLjI1NS0uMDExLjUxMiwwLC44MjYsMFY3MC43OGg1Ljc5NVY2Ny44NjloLTIuODYxVjY1Wm01LjcxMyw1Ljc1NmMuODY3LDAsMS43MTUuMDEsMi41NjItLjAxNC4wOTUsMCwuMjU5LS4yLjI2My0uMzA5LjAyNS0uNzQzLjAxMi0xLjQ4OC4wMTgtMi4yMzEsMC0uMjUyLS4xMDctLjM0Ny0uMzYtLjM0NC0uNzI4LjAxMS0xLjQ1Ni0uMDA2LTIuMTg0LjAxNS0uMSwwLS4yODQuMTQ5LS4yODYuMjMxLS4wMjEuODYxLS4wMTMsMS43MjQtLjAxMywyLjY1Mm0yLjg0OCw1LjdjMC0uOSwwLTEuNzUsMC0yLjYsMC0uMjUyLS4xMzMtLjMtLjM1LS4yODctLjcyNC4wMzQtMS40NDguMDY2LTIuMTczLjA3OS0uMjU5LDAtLjMzOS4xMS0uMzQxLjM1NS0uMDA3LjcxLS4wNDIsMS40MjEtLjAzNiwyLjEzMSwwLC4xMDcuMTU5LjMuMjQ5LjMuODU5LjAyMywxLjcxOC4wMTQsMi42NDkuMDE0bS04LjYtMi43NzNIOTcuMjI5djIuNzc0aDIuODA3WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTU0LjM0NiAtMzkuMzc3KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTYiIGRhdGEtbmFtZT0iUGF0aCA1MTE2IiBkPSJNMjUuNywzOC43MzljLjAxNC4yMzkuMDM5LjQ3OS4wNDEuNzE4LjAwOCwxLjUzNC4wMTgsMy4wNjcuMDEyLDQuNiwwLC4zLjA1Ni40NDkuNC40NC42NjgtLjAxNywxLjMzNi4wMDgsMiwuMDExLjM2MiwwLC41MzctLjEzMy41MTctLjU0Ni0uMDM2LS43NC0uMDEtMS40ODItLjAxLTIuMjY2Ljc3NiwwLDEuNTE0LDAsMi4yNTMsMCwuNTg2LDAsLjY1MS0uMDY0LjY1LS42NDcsMC0uNzQxLDAtMS40ODEsMC0yLjI1Mi4xNy0uMDA4LjI4Ny0uMDE3LjQtLjAxNywxLjYxMSwwLDMuMjIyLjAwNiw0LjgzMy0uMDA2LjMxMywwLC40Mi4wODUuNDE3LjQxMS0uMDE0LDEuNjEtLjAxNiwzLjIyMi4wMDgsNC44MzIuMDA2LjQxNy0uMTMzLjUxOC0uNTI2LjUtLjYzNy0uMDMyLTEuMjc2LDAtMS45MTQtLjAxMS0uMzU4LS4wMDctLjQ3OS4xNDctLjQ2NC41LjAyOS42NTEuMDI1LDEuMy4wMzUsMS45NTUuMDA1LjMyMi0uMTc0LjQwNy0uNDY3LjQtLjY2OC0uMDEzLTEuMzM4LS4wMjQtMi4wMDUsMC0uMzU1LjAxMy0uMzkzLS4xNDQtLjM4LS40MzkuMDMtLjY4Mi4wMzItMS4zNjYuMDQxLTIuMDQ5LDAtLjEzMi0uMDE5LS4yNjYtLjAzLS40LS44NzgsMC0xLjcyNC0uMDEyLTIuNTY4LjAxNi0uMSwwLS4yNy4yMjEtLjI3NS4zNDQtLjAyNi42ODMtLjAyOCwxLjM2OCwwLDIuMDUxLjAxMi4zMzItLjA3Ny40NjQtLjQyNy40NTQtLjY4My0uMDIxLTEuMzY4LDAtMi4wNTEtLjAwOC0uMjg4LDAtLjQuMDk0LS40LjQsMCwuNjY4LDAsMS4zMzgtLjA1MywyLS4wMzEuNDMyLjE2MS41LjUzLjQ5NCwxLjY3MS0uMDIxLDMuMzQzLS4wMjEsNS4wMTQtLjAyOGguMjczVjUzLjAxaDEuODU5YzEuMTI0LDAsMi4yNDktLjAxMywzLjM3MywwLC4zMzIsMCwuNDU2LS4wODcuNDQ0LS40MzgtLjAyNC0uNjgzLS4wMS0xLjM2OC4wMDctMi4wNTEuMDA4LS4zLS4xLS4zOS0uNC0uMzc1LS43MTIuMDM1LTEuNDI3LjA0Mi0yLjE0LjAzLS4xMjcsMC0uMzU5LS4xNDEtLjM2MS0uMjIyLS4wMjctLjg1OS0uMDE3LTEuNzItLjAxNy0yLjYsMS4xNCwwLDIuMTY5LDAsMy4yLDAsLjcyOSwwLDEuNDU5LjAwNiwyLjE4OC0uMDE1LjI3NS0uMDA4LjM4LjA3Mi4zOC4zNTVxMCwyLjUyOS4wMTMsNS4wNTljMCwuMzEyLS4yMTIuMjg0LS40MDYuMjg1LS43ODksMC0xLjU3NywwLTIuNDY1LDAsMCwuNTIzLDAsMS4wNjIsMCwxLjYtLjAxMSwxLjI3Ny0uMDEzLDEuMjc3LTEuMjY5LDEuMjc3SDI4LjY3M2MwLDEsMCwxLjk2NCwwLDIuOTNIMjUuNzY3YzAsLjg2Ny0uMDA2LDEuNzExLjAxLDIuNTU0YS4zMTcuMzE3LDAsMCwwLC4yMjkuMjA2Yy44NzIuMDE1LDEuNzQ1LjAxLDIuNjUxLjAxVjU4LjgzNmMxLjc3NC0uMDIzLDMuNTQ4LS4wNDIsNS4zMjEtLjA3My4yOTMtLjAwNS40NDkuMDUyLjQzOS40LS4wMjEuNy0uMDEyLDEuNCwwLDIuMDkzLjAwNS4yOTMtLjEwNy40MDYtLjQuNC0uNzg3LS4wMTItMS41NzQsMC0yLjQ0MSwwVjYzLjRjMCwxLjA3LDAsMS4wNjYtMS4wODgsMS4wNjEtLjUzMSwwLTEuMDYxLjAxNC0xLjU5Mi4wMjRhMi4zMzMsMi4zMzMsMCwwLDAtLjI0Mi4wMzZ2Mi44bC4wMDktLjAxYy0xLjczMS4wMDYtMy40NjMsMC01LjE5NC4wMjYtLjM3NS4wMDYtLjUtLjA3Ny0uNS0uNDcyLjAxOC0xLjU2NS4wMDYtMy4xMy0uMDA4LTQuNjk0LS4wMDYtLjU5My0uMDcxLS42LS42MDUtLjU3MS0xLjU2MS4wNy0zLjEyOC4wMTgtNC42OTMuMDI1LS4zMiwwLS40MTQtLjEyNy0uNDA1LS40MzkuMDIxLS43NTcuMDA3LTEuNTE1LjAwNy0yLjM1LjMyMS0uMDIzLjYyOS0uMDY1LjkzNy0uMDY1LDIuMzg1LDAsNC43NzEuMDA3LDcuMTU1LjAzNy4zNTYsMCwuNDU2LS4xMS40NTQtLjQzMS0uMDA3LS44LDAtMS42LDAtMi40MzItLjIyOS0uMDE0LS4zNjEtLjAzLS40OTMtLjAzLTIuNTIyLDAtNS4wNDUuMDA2LTcuNTY3LS4wMDgtLjM3MywwLS41MDcuMDg4LS40ODMuNDgzLjAzOC42MzYuMDE2LDEuMjc0LjAxNCwxLjkxMiwwLC4zNzgtLjE5NC41MzktLjU3NC41MzMtLjc0LS4wMTItMS40ODIsMC0yLjI3OSwwdjIuOGMtLjYyOCwwLTEuMiwwLTEuNzcyLDAtMS4xODUsMC0yLjM3LS4wMTQtMy41NTUtLjAxMy0uMzI1LDAtLjQzMS0uMTA2LS40MjMtLjQ1OC4wMzEtMS41MTkuMDI3LTMuMDM4LjAxOS00LjU1OGE0LjAwOCw0LjAwOCwwLDAsMC0uMTMxLS43MWgyLjkxNVY1MC4xODZjLS43MjksMC0xLjQyNSwwLTIuMTIxLDAtLjcxNSwwLS43MDctLjAwOC0uNzE0LjcyNi0uMDE4LDEuNjY2LS4wNDQsMy4zMzItLjA2Niw1SDUuODU4Yy0uMDE1LjIxNS0uMDM5LjM5Mi0uMDM4LjU2OC4wMTEsMS41OC4wMjEsMy4xNjEuMDQ2LDQuNzQxLjAwNS4zMDktLjA4My40NDMtLjQxMS40MzUtLjctLjAxOC0xLjQtLjAxNC0yLjEtLjAwNi0uMjU2LDAtLjQtLjA2Ny0uNC0uMzU1LjAwNS0xLjc3NCwwLTMuNTQ4LDAtNS4zNjguODQ2LDAsMS42MzMtLjAxNiwyLjQxOS4wMDcuMzUyLjAxLjQ5LS4wODguNDc5LS40NTgtLjAyMi0uOC0uMDA3LTEuNi0uMDA3LTIuNDI3LS44MzksMC0xLjYzOS0uMDI2LTIuNDM2LjAxMi0uMzcxLjAxOC0uNDc5LS4wNzUtLjQ2Ny0uNDQyLjAyNC0uOC4wMDctMS42LjAwNy0yLjQzN0guMTMyYzAtLjg2Ni0uMDExLTEuNy4wMTQtMi41MjcsMC0uMS4xOTEtLjI1MS4zMTQtLjI3NmEzLjQyOCwzLjQyOCwwLDAsMSwuNjgxLS4wMTNjNC4yNywwLDguNTQsMCwxMi44MS0uMDE1LjQsMCwuNDk0LjEzNC40ODYuNS0uMDE5Ljc3Mi0uMDA2LDEuNTQ1LS4wMDYsMi4zNDdoMi43NjJ2Mi43NjlhMi41NjgsMi41NjgsMCwwLDAsLjM2MS4wNjJjMS42NTYuMDEyLDMuMzEyLjAxNyw0Ljk2OC4wMzIuMzI0LDAsLjUtLjA2Ni40ODYtLjQ1Ny0uMDM0LS43NDMtLjAxNy0xLjQ4OC0uMDI2LTIuMjMzYTEuMSwxLjEsMCwwLDAtLjA1Ni0uMjI5SDE3LjI2OWMwLS44NzksMC0xLjcsMC0yLjUxNCwwLS4zMzYuMjY1LS4yNjYuNDY3LS4yNjZxMy4xOTEsMCw2LjM4My4wMTNjLjUyOCwwLDEuMDU3LDAsMS42MzksMHYtMi44NWMtLjg1MSwwLTEuNjM3LS4wMTctMi40MjIuMDA4LS4zNDIuMDEtLjQzMi0uMDgzLS40MjUtLjQzMy4wMjktMS40NzQuMDIyLTIuOTQ4LjAyOC00LjQyMiwwLS4yODQsMC0uNTY3LDAtLjkyNGgyLjc2NGwtLjAwOC0uMDA3bTUuODczLDNjMCwuNzgxLjAyMiwxLjU1MS0uMDEsMi4zMTgtLjAxNS4zNTguMTI1LjQ1MS40MzkuNDQ4LjY1Mi0uMDA4LDEuMy0uMDI3LDEuOTU1LDAsLjMxNy4wMTUuNDE1LS4xMi40MTUtLjM4NCwwLS43MjcsMC0xLjQ1NS0uMDM2LTIuMTgxYS40NTguNDU4LDAsMCwwLS4zMzEtLjNjLS43ODYuMDA4LTEuNTcuMDU2LTIuNDMyLjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0wLjA4MiAtMjQuNTMyKSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTciIGRhdGEtbmFtZT0iUGF0aCA1MTE3IiBkPSJNMTI4LjkwNiwyMC4wM0gxMDguOTU3Vi4xNGgxOS45NDlabS0yLjg1LTIuOFYyLjk3OUgxMTEuODM3YTEuMDg0LDEuMDg0LDAsMCwwLS4wMzYuMTc1cTAsNi44MzQtLjAwNywxMy42NjljMCwuMy4xMzEuNDExLjQwOC40MDcuMTM3LDAsLjI3NC4wMDYuNDEuMDA2bDEwLjcwNy0uMDFoMi43MzciIHRyYW5zZm9ybT0idHJhbnNsYXRlKC02OC45OTcgLTAuMDg5KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMTgiIGRhdGEtbmFtZT0iUGF0aCA1MTE4IiBkPSJNMCwuMDQ1Qy4xODMuMDM2LjMxNy4wMjUuNDUxLjAyNVExMCwuMDE1LDE5LjU0OSwwYy4zMjgsMCwuNDQ1LjA1Mi40NDUuNDE0cS0uMDA2LDkuMzIxLjAxNiwxOC42NDNjMCwuOTM2LDAsLjkzLS45MjkuOTNMLjgsMTkuOTc2Yy0uNzUxLDAtLjc0LS4wMDUtLjc0Mi0uNzQzUS4wMzQsMTAuMzkyLDAsMS41NTFDMCwxLjA2NiwwLC41ODIsMCwuMDQ1TTE3LjE2NCwxNy4xNjZjMC0uNDA2LDAtLjczNywwLTEuMDY4LS4wMTQtNC4yMjQtLjAzNi04LjQ0Ny0uMDMxLTEyLjY3MSwwLS40NTEtLjA5MS0uNi0uNTY4LS41OTQtNC4zNjEuMDIxLTguNzIxLjAxNi0xMy4wODIuMDE4LS42MywwLS42MzIsMC0uNjMxLjYzOXEuMDA4LDYuMzU4LjAxNSwxMi43MTdjMCwuOTI4LS4wMTQuOTI1LjkxLjkyN2wxMS4xMjEuMDMxYy43MjgsMCwxLjQ1NSwwLDIuMjY2LDAiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMC4wMDEpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTExOSIgZGF0YS1uYW1lPSJQYXRoIDUxMTkiIGQ9Ik0uMjc2LDEyOC44MjNjMC0uMjQsMC0uNDgsMC0uNzIxcS0uMDIyLTkuMy0uMDQ0LTE4LjU5MWMwLS42MTgsMC0uNjE0LjYxOC0uNjE0cTguOTMxLjAwNywxNy44NjIuMDFjLjIsMCwuMzk1LDAsLjU5Mi0uMDA4LjkwNy0uMDE4LjkxMi0uMDE4LjkxMy45MTVxLjAwOCw5LjIyNy4wMTEsMTguNDU1di41NTRabTE3LjExNi0xNy4xMTJjLS44OSwwLTEuNzM2LDAtMi41ODIsMC0zLjcyMS4wMDktNy40NDMuMDI4LTExLjE2NC4wMTgtLjQ1NCwwLS41NTYuMTQ1LS41NTUuNTY2cS4wMTcsNi42NzcsMCwxMy4zNTNjMCwuMzYxLjE2Ny4zOC40NDcuMzc5cTYuNTYzLS4wMSwxMy4xMjUtLjAxYy4yMzgsMCwuNDc1LS4wMjEuNzMtLjAzM1oiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0wLjE0NyAtNjguOTU4KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjAiIGRhdGEtbmFtZT0iUGF0aCA1MTIwIiBkPSJNNjguMTc4LDExNi42N2gyLjljMCwxLjk1MywwLDMuODU3LDAsNS43NjJsLjAxMi0uMDE0SDY4LjIxMmMwLC43NzgtLjAwOSwxLjUxNywwLDIuMjU2LjAwOS41NjcuMDIuNTc0LS41NjguNTgtLjYwNy4wMDYtMS4yMTUuMDI1LTEuODE5LS4wMi0uMzg2LS4wMjktLjQ2OS4xMTgtLjQ2OC40NTcuMDA4LDIuMDY0LDAsNC4xMjksMCw2LjE5NCwwLC41LjAyLDEsMCwxLjUtLjAwNi4xMjctLjEzNy4zNTMtLjIxNi4zNTYtLjg1OC4wMjYtMS43MTcuMDE2LTIuNi4wMTZ2LTE0LjI0aDUuNjQyVjExNi42NmwtLjAwOS4wMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTM5LjYwNyAtNzMuODc1KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjEiIGRhdGEtbmFtZT0iUGF0aCA1MTIxIiBkPSJNNjguMDA2LDguNjEyVjUuOGMtLjE2MS0uMDE0LS4yNzUtLjAzMi0uMzg5LS4wMzItMS42MjUsMC0zLjI1LS4wMDctNC44NzYuMDE1LS4zODguMDA1LS41NDItLjA4MS0uNTEzLS41YTExLjc1MywxMS43NTMsMCwwLDAsMC0xLjc3NWMtLjAzOC0uNDUuMS0uNTg2LjU0MS0uNTc2LDEuNDEyLjAzMiwyLjgyNC4wMzYsNC4yMzcuMDQ5LjMsMCwuNiwwLC45NTMsMFYuMTI4aDIuODMzYzAsMS43MjMuMDE0LDMuNDM0LS4wMSw1LjE0NC0uMDA2LjQyMy4wODkuNTUxLjUzMS41MjEuNzcxLS4wNTMsMS41NDctLjAyNiwyLjMyMS0uMDMzbC0uMDA5LS4wMWMuMDA5LDEuOC4wMjIsMy42LjAxOCw1LjQwNywwLC4xMDktLjEzNS4zMDktLjIxMi4zMTEtLjg1Ny4wMjItMS43MTUuMDE0LTIuNTcyLjAxNCwwLS44OTEtLjAxNS0xLjY3My4wMDctMi40NTUuMDEtLjMzLS4wNy0uNDYtLjQyNS0uNDQ3LS44MTYuMDI3LTEuNjMzLjAxNS0yLjQ1LjAybC4wMTUuMDEzIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzkuNDAyIC0wLjA4MSkiIGZpbGw9IiNhZWM3MzciLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTIyIiBkYXRhLW5hbWU9IlBhdGggNTEyMiIgZD0iTTY4LjAyLDIzLjIyNXY1LjY5SDY1LjA0NmwuMDA4LjAwN3EwLTEuNDIzLDAtMi44NDlINjIuMjdjMC0uODc4LS4wMTgtMS43MjEuMDI0LTIuNTYxLjAwNS0uMS4zMzMtLjI2Ny41MTQtLjI3LDEuMTUyLS4wMjEsMi4zLDAsMy40NTcsMCwuNTg5LDAsMS4xNzksMCwxLjc2OSwwbC0uMDE0LS4wMTIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zOS40MyAtMTQuNzA3KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjMiIGRhdGEtbmFtZT0iUGF0aCA1MTIzIiBkPSJNOTMuMzI0LDUuNzU4Vi4xMjdoMi44MzVBLjk2MS45NjEsMCwwLDEsOTYuMi4zMzNxMCwyLjQzOCwwLDQuODc2YzAsLjU4Ny0uMDI2LjYtLjYxOS41OC0uNzU3LS4wMjItMS41MTYtLjAyOC0yLjI3My0uMDQxbC4wMDkuMDEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01OS4wOTIgLTAuMDgpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyNCIgZGF0YS1uYW1lPSJQYXRoIDUxMjQiIGQ9Ik0xNDguMTA2LDE1OC4yOGMwLS44MjIsMC0xLjYzOCwwLTIuNDU0LDAtLjIzNC4wODMtLjM0LjM1Ny0uMzMuNzExLjAyNywxLjQyMy4wMjEsMi4xMzQuMDA4LjI2LS4wMDUuNC4wNTEuMzkxLjM0NC0uMDE4Ljc0Mi0uMDEsMS40ODQtLjAzOCwyLjIyNSwwLC4xMDYtLjE1My4yOTQtLjIzNi4yOTUtLjgzMS4wMDktMS42NjItLjAxMi0yLjQ5My0uMDMtLjA0LDAtLjA3OS0uMDM5LS4xMTYtLjA1OCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTkzLjc4OSAtOTguNDY4KSIgZmlsbD0iI2FlYzczNyIvPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzUxMjUiIGRhdGEtbmFtZT0iUGF0aCA1MTI1IiBkPSJNMTE5LjY0NCw2NS4wNTJjLS44NzcuMDEzLTEuNzU0LjAzNi0yLjYzLjAyOGEuNDA3LjQwNywwLDAsMS0uMy0uMjYyYy0uMDIzLS44My0uMDE0LTEuNjYxLS4wMTQtMi41NTIuNjE4LDAsMS4yLDAsMS43ODYsMCwxLjEyOSwwLDEuMTI4LS4wMDYsMS4xMywxLjExOSwwLC41Ni4wMDcsMS4xMi4wMTEsMS42OGwuMDE0LS4wMTIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC03My45MDEgLTM5LjQyOSkiIGZpbGw9IiNhZWM3MzciLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTI3IiBkYXRhLW5hbWU9IlBhdGggNTEyNyIgZD0iTTExMS45MzIsMTI3LjM2OWgtMi43MTh2LTIuOTEyaDIuNzA4cTAsMS40NjIsMCwyLjkyM2wuMDEtLjAxMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTY5LjE2IC03OC44MTMpIiBmaWxsPSIjYWVjNzM3Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyOCIgZGF0YS1uYW1lPSJQYXRoIDUxMjgiIGQ9Ik0xMjQuNzE5LDE1LjYzMWg4LjQyNmEuMzA3LjMwNywwLDAsMSwuMDQ3LjExMWMuMDEzLDIuNi4wMjksNS4yLjAzLDcuNzkzLDAsLjYyLS4wMjIuNjEyLS42MzIuNjExcS0zLjczOCwwLTcuNDc1LDBoLS40WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTc4Ljk3OSAtOS44OTgpIiBmaWxsPSIjMWExODE4Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfNTEyOSIgZGF0YS1uYW1lPSJQYXRoIDUxMjkiIGQ9Ik0yNC4yNTIsMjQuMDMzSDE1LjY0NVYxNS41NmE1Ljc1Myw1Ljc1MywwLDAsMSwuNTk0LS4wNTljMi40NDUtLjAwNiw0Ljg5LDAsNy4zMzUtLjAxNS40NTMsMCwuNjU2LjEyMS42NTQuNjEzLS4wMDcsMi4zNjkuMDEzLDQuNzM4LjAyMyw3LjEwNywwLC4yNTcsMCwuNTE1LDAsLjgyNyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTkuOTA3IC05LjgwNikiLz4NCiAgICAgICAgICA8cGF0aCBpZD0iUGF0aF81MTMwIiBkYXRhLW5hbWU9IlBhdGggNTEzMCIgZD0iTTI0LjMxLDEyNC40NzN2OC41ODRjLS42MDcsMC0xLjE5MiwwLTEuNzc3LDAtMi4wOTUtLjAwNi00LjE5LS4wMjItNi4yODUtLjAxMy0uNCwwLS40ODktLjEyMi0uNDg0LS41MjUuMDI4LTIuMzgzLjAxNy00Ljc2Ny4wMTktNy4xNSwwLS4yODcsMC0uNTc0LDAtLjlaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtOS45ODIgLTc4LjgyMykiIGZpbGw9IiMxYTE4MTgiLz4NCiAgICAgICAgPC9nPg0KICAgICAgPC9nPg0KICAgIDwvZz4NCiAgPC9nPg0KPC9zdmc+DQo=";
        }

        const element = document.createElement('div');
        element.classList.add('draggable');
        element.style.position = 'absolute';
        element.style.pointerEvents = 'auto';
        element.style.border = 'none';
        element.style.zIndex = '1000';

        const rect1 = annotationLayer.getBoundingClientRect();
        if (rotationDataval === 90 || rotationDataval === 270) {
            scaleX = originalWidth / rect1.height;
            scaleY = originalHeight / rect1.width;
        } else {
            scaleX = originalWidth / rect1.width;
            scaleY = originalHeight / rect1.height;
        }

        const wratio = (annotation.width / originalWidth);
        const hratio = (annotation.height / originalHeight);
        const lratio = ((annotation.posX) / originalWidth);
        const tratio = ((annotation.posY / originalHeight));

        const annotation_width = annotation.width / scaleX
        const annotation_height = annotation.height / scaleY

        const annotation_x = (annotation.posX / scaleX);
        const annotation_y = (annotation.posY / scaleY)


        element.setAttribute('data-wpercent', wratio)
        element.setAttribute('data-hpercent', hratio)
        element.setAttribute('data-lpercent', lratio)
        element.setAttribute('data-tpercent', tratio)

        const content = document.createElement('div');
        content.classList.add('draggable-content');

        element.style.left = annotation_x + 'px';
        element.style.top = annotation_y + 'px';

        element.style.padding = '0';
        const input = document.createElement('div');

        input.style.width = annotation_width + 'px';
        input.style.height = annotation_height + 'px';

        input.id = 'Qrcode';


        const img = document.createElement('img');
        img.src = Qrcode;
        input.appendChild(img);
        content.appendChild(input);

        element.appendChild(content);

        return element;
    }

}

async function addCommentToPDF(File) {
    try {

        const Comments = [];
        document.querySelectorAll('.pdf-page').forEach((pageElement, pageIndex) => {


            const annotationLayer = pageElement.querySelector('.annotation-layer');
            if (!annotationLayer) {
                return;
            }
            const rect1 = annotationLayer.getBoundingClientRect();
            const scaleX = originalWidth / rect1.width;
            const scaleY = originalHeight / rect1.height;

            const commentElements = annotationLayer.querySelectorAll('[id^="comment_"]');

            commentElements.forEach(element1 => {
                var element = element1.parentElement?.parentElement;
                const rect = element.getBoundingClientRect();
                if (element.querySelectorAll('.image-container')[0]) {
                    var pele = element.parentElement;
                    var parentRect = pele.parentElement.getBoundingClientRect();
                }
                else {
                    var parentRect = element.parentElement.getBoundingClientRect();
                }
                const x = (rect.left - parentRect.left) * scaleX;
                const y = (rect.top - parentRect.top) * scaleY;
                const page = pageIndex + 1;
                const comment = element1.getAttribute('data-commenttext');
                const title = loginName;

                Comments.push({ x, y, page, comment, title });

            });

        });
        let formData = new FormData();
        formData.append("File", File);
        formData.append("Comments", JSON.stringify(Comments));

        let response = await fetch("/ConvertToPdf/AddCommentFile", {
            method: "POST",
            headers: {

                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

            },
            body: formData
        });

        if (!response.ok) {
            throw new Error("Comments embeded Failed");
        }

        let blob = await response.blob();

        return blob;


    } catch (error) {
        console.error("Comments embeded Failed:", error);
        throw error;
    }
}


async function SaveQuickSign(viewName) {


    let processreq = [];
    const temp = {
        Suid: suid,
        OrganizationId: receptemp.organizationId,
        SignatureTemplateId: receptemp.signTemplate,
        email: loginEmail

    }
    processreq.push(temp);

    if (receptemp.signTemplate !== 1 && receptemp.signTemplate !== 0) {
        const result = await Processrecipients(processreq);
        if (result.success) {
            const emailsWithTemplate = result.data.filter(item => !item.hasSignatureTemplate).map(item => item.email);
            if (emailsWithTemplate.length > 0) {
                document.getElementById("navigationNetworkOverlay").style.display = "none";
                swal({
                    type: 'info',
                    title: 'Info',
                    text: `Selected template is currently unavailable for your account.Please contact admin`

                });
                return false;
            }
            console.log("Processed recipients:", result);
        } else {
            document.getElementById("navigationNetworkOverlay").style.display = "none";
            swal({
                type: 'error',
                title: 'Error',
                text: result.message

            });
            return false;
        }
    }


    if (Object.keys(matchedEsealData).length !== 0) {
        var responseFlag = true;
        $.ajax({
            url: GetOrganizationStatusUrl,
            type: 'GET',
            dataType: 'json',
            data: { loginorgUid: matchedEsealData[suid].organizationID },
            error: ajaxErrorHandler,
            success: function (response) {
                if (!response.success) {
                    document.getElementById('overlay9').style.display = 'none';
                    swal({
                        type: 'info',
                        title: 'Info',
                        text: `You can not perform eseal operation, please contact organization `
                    }, function (isConfirm) {
                        window.location.href = redirectingurl + viewName;
                    });
                    responseFlag = false;
                } else {
                    console.log(response)
                    responseFlag = true;
                }
            }
        });
    }


    //var blob = base64ToBlob(Documentbase64);


    var config = {
        Signature: matchedSignData,
        Eseal: matchedEsealData,
        Qrcode: matchedqrcodeData,

    };

    console.log(JSON.stringify(config));

    var signDocumentViewModel = new FormData();
    //signDocumentViewModel.append("File", blob, DocumentName);
    signDocumentViewModel.append("Config", JSON.stringify(config));
    signDocumentViewModel.append("DocId", docID);
    signDocumentViewModel.append("SignTemplate", receptemp.signTemplate);
    if (disableorderval) {
        signDocumentViewModel.append("CompleteSignCount", CompleteSignListCount);
    }
    console.log(signDocumentViewModel);
    document.getElementById('overlay9').style.display = 'flex';

    // Handle the OK button click
    $('#okButton').off('click').on('click', async function () {
        // Hide the modal
        document.getElementById('overlay9').style.display = 'none';
        const commentElements = document.querySelectorAll('[id^="comment_"]');
        if (commentElements.length !== 0) {
            $('#overlay').show();
            const commentblob = await addCommentToPDF(new File([globalblobdata], DocumentName, { type: globalblobdata.type }));
            $('#overlay').hide();
            signDocumentViewModel.append("File", commentblob, DocumentName);
            finalblob = commentblob;
        }
        else {
            signDocumentViewModel.append("File", globalblobdata, DocumentName);
            finalblob = globalblobdata;
        }

        $('#digitalShowModal').addClass('show').css('display', 'block');

        $.ajax({
            url: SignDocument,
            method: 'POST',
            headers: {

                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

            },
            data: signDocumentViewModel,
            contentType: false,
            processData: false,
            beforeSend: function () {
                showOverlay(matchedEsealData, matchedSignData);
            },
            complete: function () {
                hideOverlay(matchedEsealData, matchedSignData);
            },

            success: function (response) {
                document.getElementById('signingdocid').value = JSON.parse(response.result.model).tempid;
                finalresponse = response;
                if (response.status == "Success") {

                    var tempid = response.result.tempid || JSON.parse(response.result.model).tempid;
                    updateStepper(1, "success", "", "", "", "", tempid, response);
                }
                else if (response.documtStatus != "") {

                    if (response.documtStatus.isDocumentBlocked == true) {
                        $('#digitalShowModal').removeClass('show').css('display', 'none');
                        swal({
                            type: 'info',
                            title: "Info",
                            text: response.message,

                        }, function (isConfirm) {
                            if (isConfirm) {
                                window.location.href = redirectingurl + viewName;
                            }

                        });
                    }
                    else if (response.documtStatus) {
                        // Handle case where document has changed
                        $('#digitalShowModal').removeClass('show').css('display', 'none');
                        swal({
                            title: "Info",
                            text: response.message,  // e.g., "The original document has been updated. Please refresh the document."
                            type: "info",
                        }, function (isConfirm) {
                            if (isConfirm) {
                                location.reload();
                            }
                        });
                    }
                }
                else {
                    if (response.message == "Delegation has been revoked.") {
                        $('#digitalShowModal').removeClass('show').css('display', 'none');
                        swal({
                            type: 'info',
                            title: "Info",
                            text: response.message,

                        }, function (isConfirm) {
                            if (isConfirm) {
                                window.location.href = IndexDocuments;
                            }

                        });
                    }
                    else {

                        updateStepper(1, "failed", response.message, "", "", "");
                    }

                }
            },

            error: ajaxErrorHandler
        });
    });

    $('#cancelButton').off('click').on('click', function () {
        document.getElementById('overlay9').style.display = 'none';
    });
}


function showCommentBox() {
    // Show the comment box when the Reject button is clicked
    document.getElementById("commentBox").style.display = "block";
}


function showAddCommentBox() {
    // Show the comment box when the Reject button is clicked
    document.getElementById("addcommentBox").style.display = "block";
}

function SubmitReject() {
    // Get the comment entered by the user
    var comment = document.getElementById("rejectComment").value;
    if (comment.length > 500) {
        swal({
            title: "Info",
            text: "Your rejection comment is too long. Please limit your input to 500 characters.",
            type: "info",
        }, function (isConfirm) {
            if (isConfirm) {
                // Optional: focus the comment box or take other actions
            }
        });
        return;

    }
    // Form data for reject signing
    var rejectSigningViewModel = new FormData();
    rejectSigningViewModel.append("Comment", comment);
    rejectSigningViewModel.append("UserEmail", loginEmail);
    rejectSigningViewModel.append("Suid", suid);
    rejectSigningViewModel.append("UserName", loginName);
    rejectSigningViewModel.append("DocId", docID);

    $.ajax({
        url: RejectSigning,
        method: 'POST',
        headers: {

            'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

        },
        data: rejectSigningViewModel,
        contentType: false,
        processData: false,
        beforeSend: function () {
            $('#overlay').show();
        },
        complete: function () {
            $('#overlay').hide();
        },
        success: function (response) {
            if (response.status == "Success") {
                swal({
                    title: "Deline The Document",
                    text: "Successfully Declined the Document",
                    type: "success",
                }, function (isConfirm) {
                    if (isConfirm) {
                        window.location.href = redirectingurl + viewName;
                    }
                });
            } else {
                swal({
                    title: "Error",
                    text: response.message || "Unknown error occurred",
                    type: "error",
                }, function (isConfirm) {
                    if (isConfirm) {
                        window.location.href = redirectingurl + viewName;
                    }
                });
            }
        },

        error: ajaxErrorHandler
    });
}

function onClick(type) {
    // const pdfPage = document.querySelector('div.pdf-page');
    const pages = document.querySelectorAll('.pdf-page');

    let minDistance = Infinity;

    pages.forEach(page => {
        const rect = page.getBoundingClientRect();
        const distance = Math.abs(rect.top);

        if (distance < minDistance) {
            minDistance = distance;
            pdfPage = page;
        }
    });
    if (pdfPage) {
        const annotationLayer = pdfPage.querySelector('.annotation-layer');
        const rect = pdfPage.getBoundingClientRect();
        const left = rect.width / 2 - 50;
        const top = rect.height / 2 - 50;
        if (type === "comment-field") {

            const newHeader = '<h5 class="modal-title">Enter Comment</h5>';
            const newBody = `<textarea id="FieldNameInput" class="form-control" placeholder="Enter Comments here"></textarea>
																			<span id="errorFieldName" style="color: red; display: none;"></span>
																			<div class="form-check mt-2">

																		</div>
																		`;
            const newFooter = `
																								<button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
																							<button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
																						`;

            updateModalContent(newHeader, newBody, newFooter);



            document.getElementById('saveFieldName').addEventListener('click', () => {
                const value = document.getElementById('FieldNameInput').value;
                const element = createComment(type, left, top, value);
                annotationLayer.appendChild(element);

                const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                element.setAttribute('data-wpercent', wratio)
                element.setAttribute('data-hpercent', hratio)
                element.setAttribute('data-lpercent', lratio)
                element.setAttribute('data-tpercent', tratio)
                if ((element.offsetWidth + left) > rect.width) {
                    annotationLayer.removeChild(element);
                }

                $('#EditFields_Modal').modal('hide');

            });
            $('#EditFields_Modal').modal('show');

        }

    }


}

function createComment(type, left, top, value) {

    const element = document.createElement('div');
    element.classList.add('draggable', 'comment-block');
    element.style.left = left + 'px';
    element.style.top = top + 'px';
    element.style.border = 'none';


    const content = document.createElement('div');
    content.classList.add('draggable-content');
    let img;

    if (type === 'comment-field' || type === "commentButton") {
        const uniqueId = 'comment_' + Date.now();
        img = document.createElement('img');
        img.src = appBaseUrl + 'img/commenticon.png';
        img.id = uniqueId;
        img.draggable = false;
        img.setAttribute("data-commenttext", value);
        img.title = loginName + "\n" + value;
        content.appendChild(img);

    }

    const deleteIcon = document.createElement('span');
    deleteIcon.innerHTML = '❌';
    deleteIcon.classList.add('delete-icon');
    deleteIcon.title = 'Delete Comment';
    element.appendChild(deleteIcon);

    deleteIcon.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
    });

    deleteIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        const element = content.parentElement;
        element.remove();
    });





    element.appendChild(content);
    element.style.position = 'absolute';
    element.style.pointerEvents = 'auto';
    makeDraggable(element);
    return element;
}

function makeDraggable(element) {
    let offsetX, offsetY, isDragging = false;
    var newLeft;
    var newTop;
    element.addEventListener('mousedown', (e) => {
        if (!e.target.classList.contains('resize-handle') && !e.target.classList.contains('edit-icon') && !e.target.classList.contains('input-field') && !e.target.classList.contains('editable-text') && !e.target.classList.contains('image-upload') && !e.target.classList.contains('remove-image-btn')) {
            isDragging = true;
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }
    });

    element.addEventListener('touchstart', (e) => {
        if (true) {
            e.preventDefault();
            isDragging = true;
            const isTouch = e.type.startsWith('touch');
            const clientX = isTouch ? e.touches[0].clientX : e.clientX;
            const clientY = isTouch ? e.touches[0].clientY : e.clientY;

            offsetX = clientX - element.getBoundingClientRect().left;
            offsetY = clientY - element.getBoundingClientRect().top;
            document.addEventListener('touchmove', onMouseMove);
            document.addEventListener('touchend', onMouseUp);
        }
    }, { passive: false });





    function onMouseMove(e) {
        const isTouch = e.type.startsWith('touch');
        if (isDragging) {
            const pageRect = element.parentElement.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect(); // Get bounding rect of the draggable element


            newLeft = (isTouch ? e.touches[0].clientX : e.clientX) - pageRect.left - offsetX;
            newTop = (isTouch ? e.touches[0].clientY : e.clientY) - pageRect.top - offsetY;

            // Boundary checks for left, right, top, and bottom of the layer
            if (newLeft < 0) {
                newLeft = 0; // Restrict to the left boundary
            } else if (newLeft + elementRect.width > pageRect.width) {
                newLeft = pageRect.width - elementRect.width; // Restrict to the right boundary
            }

            if (newTop < 0) {
                newTop = 0; // Restrict to the top boundary
            } else if (newTop + elementRect.height > pageRect.height) {
                newTop = pageRect.height - elementRect.height; // Restrict to the bottom boundary
            }

            // Apply the new position to the element
            element.style.left = `${newLeft}px`;
            element.style.top = `${newTop}px`;
            //element.style.left = `${e.clientX - pageRect.left - offsetX}px`;
            //element.style.top = `${e.clientY - pageRect.top - offsetY}px`;
        }
    }

    function onMouseUp(e) {
        isDragging = false;

        const isTouch = e.type.startsWith('touch');
        if (isTouch) {
            document.removeEventListener('touchmove', onMouseMove);
            document.removeEventListener('touchend', onMouseUp);
        } else {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }





        const pdfPages = document.querySelectorAll('.pdf-page');

        const draggableRect = element.getBoundingClientRect();

        // Loop through all pages to find where the draggable belongs
        for (let i = 0; i < pdfPages.length; i++) {
            const page = pdfPages[i];
            const pageRect = page.getBoundingClientRect();

            if (isInside(draggableRect, pageRect)) {
                // Move the draggable to the correct page's annotation layer
                const annotationLayer = page.querySelector('.annotation-layer');
                annotationLayer.appendChild(element);
                break; // Exit the loop once the correct page is found
            }
        }
        //var pageRect = element.parentElement.getBoundingClientRect();
        //element.style.left = `${e.clientX - pageRect.left - offsetX}px`;
        //element.style.top = `${e.clientY - pageRect.top - offsetY}px`;
        element.style.left = newLeft;
        element.style.top = newTop;


        const lratio = (newLeft / (document.querySelector('canvas')).getBoundingClientRect().width);
        const tratio = (newTop / (document.querySelector('canvas')).getBoundingClientRect().height);

        element.setAttribute('data-lpercent', lratio)
        element.setAttribute('data-tpercent', tratio)

    }
}








function isInside(elementRect, pageRect) {
    return (
        elementRect.top >= pageRect.top &&
        elementRect.bottom <= pageRect.bottom
    );
}

function updateModalContent(headerContent, bodyContent, footerContent) {
    // Update the modal header
    document.querySelector('#EditFields_Modal .modal-header').innerHTML = headerContent;

    // Update the modal body
    document.querySelector('#EditFields_Modal .modal-body').innerHTML = bodyContent;

    // Update the modal footer
    document.querySelector('#EditFields_Modal .modal-footer').innerHTML = footerContent;
}

function onMouseDown(event) {
    const type = event.target.id;
    const ghostElement = createGhostElement(event);

    document.body.appendChild(ghostElement);


    // const offsetX = event.clientX - ghostElement.getBoundingClientRect().left;
    // const offsetY = event.clientY - ghostElement.getBoundingClientRect().top;

    const offsetX = document.documentElement.scrollLeft || document.body.scrollLeft;

    const offsetY = document.documentElement.scrollTop || document.body.scrollTop;

    function onMouseMove(e) {
        const isTouch = e.type.startsWith('touch');
        // ghostElement.style.left = e.clientX - offsetX + 'px';
        // ghostElement.style.top = e.clientY - offsetY + 'px';
        const clientX = isTouch ? e.touches[0].clientX : e.clientX;
        const clientY = isTouch ? e.touches[0].clientY : e.clientY;

        ghostElement.style.left = clientX + offsetX + 'px';
        ghostElement.style.top = clientY + offsetY + 'px';
    }

    function onMouseUp(e) {
        const isTouch = e.type.startsWith('touch');
        const clientX = isTouch ? e.changedTouches[0].clientX : e.clientX;
        const clientY = isTouch ? e.changedTouches[0].clientY : e.clientY;

        const pageElements = document.elementsFromPoint(clientX, clientY);

        const pdfPage = pageElements.find(el => el.classList.contains('pdf-page'));

        if (pdfPage) {
            const annotationLayer = pdfPage.querySelector('.annotation-layer');
            const rect = pdfPage.getBoundingClientRect();
            const left = clientX - rect.left;
            const top = clientY - rect.top;

            if (type === "commentButton") {

                const newHeader = '<h5 class="modal-title">Enter Comment</h5>';
                const newBody = `<textarea id="FieldNameInput" class="form-control" placeholder="Enter Comments here"></textarea>
																			<span id="errorFieldName" style="color: red; display: none;"></span>
																			<div class="form-check mt-2">

																		</div>
																		`;
                const newFooter = `
																								<button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
																							<button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
																						`;

                updateModalContent(newHeader, newBody, newFooter);



                document.getElementById('saveFieldName').addEventListener('click', () => {
                    const value = document.getElementById('FieldNameInput').value;
                    const element = createComment(type, left, top, value);
                    annotationLayer.appendChild(element);

                    const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                    const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                    const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                    const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                    element.setAttribute('data-wpercent', wratio)
                    element.setAttribute('data-hpercent', hratio)
                    element.setAttribute('data-lpercent', lratio)
                    element.setAttribute('data-tpercent', tratio)
                    if ((element.offsetWidth + left) > rect.width) {
                        annotationLayer.removeChild(element);
                    }

                    $('#EditFields_Modal').modal('hide');

                });
                $('#EditFields_Modal').modal('show');

            }

        }
        ghostElement.remove();
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        document.removeEventListener('touchmove', onMouseMove);
        document.removeEventListener('touchend', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    document.addEventListener('touchmove', onMouseMove);
    document.addEventListener('touchend', onMouseUp);
}

function createGhostElement(event) {
    const element = document.createElement('div');
    element.classList.add('draggable');

    const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;

    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;

    if (event.target.id === 'commentButton') {

        const img = document.createElement('img');
        img.src = appBaseUrl + 'img/commenticon.png';
        element.appendChild(img);

    }


    element.style.position = 'absolute';
    element.style.pointerEvents = 'none';  // Disable interactions while dragging
    element.style.zIndex = '1000';
    element.style.opacity = '0.5';
    element.style.left = (event.clientX + scrollLeft) + 'px';
    element.style.top = (event.clientY + scrollTop) + 'px';

    return element;
}

window.SignedDocCheck = function (docid, status) {

    if (document.getElementById("digitalShowModal").style.display != 'none') {
        const interval = setInterval(() => {
            const elem = document.getElementById('signingdocid');
            if (elem && elem.value) {

                if (elem.value === docid) {
                    if (status === true) {
                        updateStepper(2, "success", "");
                    } else {
                        updateStepper(2, "failed", "Document Signing failed.");
                    }
                }
                clearInterval(interval);
            }
        }, 20);

    }

};


window.addEventListener('resize', function () {

    const canvWidth = document.querySelector('canvas').getBoundingClientRect().width;
    const canvHeight = document.querySelector('canvas').getBoundingClientRect().height;

    document.querySelectorAll('.pdf-page').forEach((pageElement, pageIndex) => {
        const annotationLayer = pageElement.querySelector('.annotation-layer');



        const matchingElements = annotationLayer.querySelectorAll('.draggable');

        if (matchingElements.length !== 0) {

            matchingElements.forEach(element => {

                const draggableContent = element.querySelector('.draggable-content');
                const firstChild = draggableContent.firstElementChild;
                firstChild.style.width = (canvWidth * parseFloat(element.getAttribute('data-wpercent'))) + 'px';
                firstChild.style.height = (canvHeight * parseFloat(element.getAttribute('data-hpercent'))) + 'px';
                element.style.left = (canvWidth * parseFloat(element.getAttribute('data-lpercent'))) + 'px';
                element.style.top = (canvHeight * parseFloat(element.getAttribute('data-tpercent'))) + 'px';


            });


        }

    });

});

async function Processrecipients(recipients) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: ProcessRecipientsUrl,
            headers: {

                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

            },
            contentType: "application/json",
            data: JSON.stringify(recipients),
            beforeSend: function () {
                document.getElementById("navigationNetworkOverlay").style.display = "block";
            },
            complete: function () {
                document.getElementById("navigationNetworkOverlay").style.display = "none";
            },
            success: function (response) {
                console.log(response);

                resolve(response);

            },
            error: function (error) {
                console.error("Error during AJAX call:", error);
                ajaxErrorHandler(error);
                reject(error);
            }
        });
    });
}