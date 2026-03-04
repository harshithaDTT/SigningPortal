
var thumbnail_Img;
var latestEmail = "";
var selectedEmails = [];
var selectedSuid = '';
var addedAnnotations = [];

// ============================================================
// DRAG & DROP INITIALIZATION STATE
// ============================================================
let isDragDropInitialized = false;
let dragDropReadyPromiseResolve = null;
const dragDropReadyPromise = new Promise((resolve) => {
    dragDropReadyPromiseResolve = resolve;
});

var PerpareDocumentContext = {
    receipientEmails: [],
    receipientEmailsList: [],
    selectuser: "",
    docName: "",
    fileName: "",
    edmsId: "",
    filesizerestrict: 15360000,
    filesize: "15",
    dropPoint: {},
}

var file;
var datapos_x;
var datapos_y;
var data_width;
var data_height;
var data_Email;

var rotationDataval = 0;
var isFileUploaded = false;
var config = "";
var functioncall = false;
var signature_dimensions = {
    width: 0,
    height: 0,
}
var eseal_dimensions = {
    width: 0,
    height: 0,
}
var qrcode_dimensions = {
    width: 0,
    height: 0,
}
var signature_img = '';
var eseal_img = '';
imgdata1 = qrcodeimgdataval;
const img2 = new Image();
img2.src = imgdata1;
img2.onload = function () {
    const width = img2.width;
    const height = img2.height;
    qrcode_dimensions = {
        width: width,
        height: height,
    }

};
var fieldnameslist = [];
var canvasWidth;
var canvasHeight;
var originalHeight = "";
var originalWidth = "";
var scaleX = "";
var scaleY = "";
let uploadedPDF = null;
const renderQueue = new Set();
const renderedPages = new Set();
const pdfjsLib = window['pdfjs-dist/build/pdf'];
if (!pdfjsLib) {
    console.error('PDF.js library is not loaded.');
} else {

    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
}

const pdfContainer = document.getElementById('pdf-container');
const components = document.getElementById('pdfschema').value;

// Viewer interaction state (zoom + pagination controls)
let pdfZoomLevel = 1;
let currentPage = 1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.1;

const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetZoomBtn = document.getElementById('resetZoomBtn');
const zoomDisplayEl = document.getElementById('zoomDisplay');
const pageIndicatorEl = document.getElementById('pageIndicator');
const pagePrevBtn = document.getElementById('pagePrevBtn');
const pageNextBtn = document.getElementById('pageNextBtn');
const scrollContainerEl = document.getElementById('scrollContainer');
const pageIndicatorOverlayEl = document.getElementById('pageIndicatorOverlay');

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
        scrollToPage(currentPage - 1);
    });
}
if (pageNextBtn) {
    pageNextBtn.addEventListener('click', function () {
        scrollToPage(currentPage + 1);
    });
}
if (scrollContainerEl) {
    scrollContainerEl.addEventListener('scroll', () => {
        const pages = document.querySelectorAll('.pdf-page');
        let closest = 1;
        let min = Infinity;

        pages.forEach(p => {
            const rect = p.getBoundingClientRect();
            const d = Math.abs(rect.top);

            if (d < min) {
                min = d;
                closest = parseInt(p.dataset.pageNumber) + 1;
            }
        });

        if (closest !== currentPage) {
            setCurrentPage(closest);
        }
    });
}

function adjustZoom(delta) {
    pdfZoomLevel = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pdfZoomLevel + delta));
    applyZoom();
}

function applyZoom() {
    const container = pdfContainer || document.getElementById('pdf-container');
    if (!container) return;
    container.style.transformOrigin = 'top center';
    container.style.transform = `scale(${pdfZoomLevel})`;
    updateZoomDisplay();
}

function updateZoomDisplay() {
    if (!zoomDisplayEl) return;
    zoomDisplayEl.textContent = `${Math.round(pdfZoomLevel * 100)}%`;
}

function resetZoomLevel() {
    pdfZoomLevel = 1;
    applyZoom();
}

function scrollToPage(targetPage) {
    if (!uploadedPDF || !scrollContainerEl) return;
    const clampedPage = Math.max(1, Math.min(uploadedPDF.numPages, targetPage));
    const pageElement = pdfContainer.querySelector(`[data-page-number="${clampedPage - 1}"]`);
    if (pageElement) {
        scrollContainerEl.scrollTo({ top: pageElement.offsetTop * pdfZoomLevel, behavior: 'smooth' });
        setCurrentPage(clampedPage);
    }
}

function setCurrentPage(pageNumber) {
    currentPage = pageNumber;
    updatePageIndicatorDisplay(pageNumber);
}

function updatePageIndicatorDisplay(pageNumber) {
    if (!uploadedPDF) {
        if (pageIndicatorEl) {
            pageIndicatorEl.textContent = 'Page 0 / 0';
        }
        if (pageIndicatorOverlayEl) {
            pageIndicatorOverlayEl.textContent = 'Page 0 / 0';
        }
        return;
    }
    const total = uploadedPDF.numPages || 0;
    const safePage = Math.max(1, Math.min(total, pageNumber || currentPage || 1));
    if (pageIndicatorEl) {
        pageIndicatorEl.textContent = `Page ${safePage} / ${total}`;
    }
    if (pageIndicatorOverlayEl) {
        pageIndicatorOverlayEl.textContent = `Page ${safePage} / ${total}`;
    }
}

updateZoomDisplay();

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

// ============================================================
// VIEWPORT HEIGHT SYNC (for --template-shell-vh CSS variable)
// ============================================================
function syncTemplateViewportHeight() {
    document.documentElement.style.setProperty('--template-shell-vh', window.innerHeight + 'px');
}
syncTemplateViewportHeight();
window.addEventListener('resize', function () {
    clearTimeout(window.__templateVhTimer);
    window.__templateVhTimer = setTimeout(syncTemplateViewportHeight, 120);
});

$('#SignatureTemp').show();
$('#esealTemplates').show();
$('#SecondesealTemplates').hide();
$('#SecondSignatureTemp').hide();

// ============================================================
// E-SEAL TOGGLE UI SYNC (settings panel)
// ============================================================
function syncEsealTemplateUI(isOn) {
    var $toggle = $('#esealToggle');
    var $group = $('#esealTemplatesGroup');

    if ($toggle.length) {
        $toggle
            .toggleClass('active', !!isOn)
            .attr('role', 'switch')
            .attr('aria-checked', isOn ? 'true' : 'false')
            .attr('aria-pressed', isOn ? 'true' : 'false');
    }

    if ($group.length) {
        $group.css('display', isOn ? '' : 'none');
    }

    if (!isOn) {
        var $select = $('#EsealtemplateSelect');
        if ($select.length) {
            $select.val('0');
        }
        $('#esealTemplatePreviewBtn').hide();
        $('#EsealInnerModel').hide();
    }
}

// ============================================================
// SIGNATORY PROFILE FETCHING - Load profile images & names
// ============================================================

/**
 * Fetches profile data (name, profile image) for a single signatory card
 * @param {string} email - The email address to fetch profile for
 */
function fetchSignatoryProfile(email) {
    if (!email) return;

    $.ajax({
        type: "POST",
        headers: {

            'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

        },
        url: OrgDetailsByEmail,
        data: { email: email },
        success: function (response) {
            const userProfile = response?.userProfile;

            // Find elements for this email
            const $loader = $('[data-loader="' + email + '"]');
            const $img = $('[data-img="' + email + '"]');
            const $fallback = $('[data-fallback="' + email + '"]');
            const $name = $('[data-name="' + email + '"]');

            // Hide the loader
            $loader.hide();

            if (userProfile && !$.isEmptyObject(userProfile)) {
                // Update name if available
                if (userProfile.name) {
                    $name
                        .text(userProfile.name)
                        .attr("title", userProfile.name);
                } else if (userProfile.firstName || userProfile.lastName) {
                    const fullName = ((userProfile.firstName || '') + ' ' + (userProfile.lastName || '')).trim();
                    $name.text(fullName || email);
                }

                // Update avatar image if available
                if (userProfile.selfieThumbnail) {
                    $img.attr('src', 'data:image/png;base64,' + userProfile.selfieThumbnail);
                    $img.show();
                    $fallback.hide();
                } else {
                    // Use fallback image or initials
                    $img.attr('src', '/img/Signatory_dp.png');
                    $img.on('error', function () {
                        // If fallback image fails, show initials
                        $(this).hide();
                        $fallback.css('display', 'flex');
                    });
                    $img.show();
                    $fallback.hide();
                }
            } else {
                // No user profile found - show fallback initials
                $img.hide();
                $fallback.css('display', 'flex');
            }
        },
        error: function (xhr, status, error) {
            console.warn('Failed to fetch profile for:', email, error);

            // Show fallback on error
            const $loader = $('[data-loader="' + email + '"]');
            const $img = $('[data-img="' + email + '"]');
            const $fallback = $('[data-fallback="' + email + '"]');

            $loader.hide();
            $img.hide();
            $fallback.css('display', 'flex');
        }
    });
}

/**
 * Fetches profiles for all signatory cards on the page
 */
function loadAllSignatoryProfiles() {
    const $cards = $('.signer-card');

    if ($cards.length === 0) {
        console.log('No signatory cards found');
        return;
    }

    console.log('Loading profiles for', $cards.length, 'signatories...');

    $cards.each(function () {
        const email = $(this).data('email');
        if (email) {
            fetchSignatoryProfile(email);
        }
    });
}

$(document).ready(function () {
    $('#networkOverlay').hide();
    document.getElementById("navigationNetworkOverlay").style.display = "none";
    $('#BulkSignTemplateMenu').addClass('active');
    var actWidth = $(".nav-tabs").find(".active").parent("li").width();
    var actPosition = $(".nav-tabs .active").position();
    $(".slider").css({ "left": 0, /* + actPosition.left, */ "width": $(".nav-tabs .active").parent("li").width() });
    $("#dropzone").on("click", open_file);
    //$("#File").on("change", fileSelect);

    // ============================================================
    // TOGGLE-SWITCH CLICK HANDLERS
    // Bridge the visual toggle-switch buttons to the hidden checkboxes
    // that the business logic depends on.
    // ============================================================
    $('#esealToggle').on('click', function () {
        var isActive = !$('#esealRequired').prop('checked');
        $('#esealRequired').prop('checked', isActive).trigger('change');
    });

    $('#qrcodeToggle').on('click', function () {
        var $btn = $(this);
        $btn.toggleClass('active');
        var isActive = $btn.hasClass('active');
        $('#QrCodeRequired').prop('checked', isActive).trigger('change');
    });

    $("#sidebarCollapse2").on("click", function () {
        sidebarcollapseSignatoriesfields();
    });
    $("#sidebarCollapse1").on("click", function () {
        sidebarcollapsefields();
    });
    $("#SIGNATURE").on("click", function () {
        onClick('SIGNATURE');
    });
    $("#ESEAL").on("click", function () {
        onClick('ESEAL');
    });
    $("#Send").on("click", function () {
        Save1();
    });

    $("#SIGNATURE").on("click", function () {
        onClick('SIGNATURE');
    });
    $("#ESEAL").on("click", function () {
        onClick('ESEAL');
    });
    $("#Save").on("click", function () {
        Save1();
    });

    $("#innerModel").on("click", function () {
        ImagePreview();
    });
    $("#SecondinnerModel").on("click", function () {
        ImagePreview();
    });
    $("#EsealInnerModel").on("click", function () {
        ImagePreviewEseal();
    });
    $("#SecondEsealInnerModel").on("click", function () {
        ImagePreviewEseal();
    });
    $("#OKbutton").on("click", function () {
        applySettings();
    });
    $("#closebutton").on("click", function () {
        closeModal();
    });
    $("#secondclosebutton").on("click", function () {
        closeModal();
    });
    $("#esealmodalpopup").on("click", function () {
        closeModals();
    });
    $("#secondesealmodalpopup").on("click", function () {
        closeModals();
    });
    $("#advancesettingsbutton").on("click", function () {
        Settings();
    });
    $("#clearbutton").on("click", function () {
        closeSettingsModal();
    });
    var firstSelectedEmail = latestselectedEmail.length > 0 ? latestselectedEmail[0] : null;

    if (firstSelectedEmail) {
        var $checkboxes = $('.select-checkbox');
        var emailMatched = false; // Flag to track if email is already matched
        selectedEmails = [];

        $checkboxes.each(function () {
            var $checkbox = $(this);
            var email = $checkbox.data('email');

            if (email === firstSelectedEmail) {
                if (!emailMatched) {
                    $checkbox.prop('checked', true).trigger('change');
                    emailMatched = true; // Set the flag to true
                } else {
                    // showCustomAlert("Please uncheck the previous checkbox before selecting another one.")
                    toastr.error("Please uncheck the previous checkbox before selecting another one.");
                }
            } else {
                $checkbox.prop('checked', false);
                $checkbox.closest('.signer-card').removeClass('selected');
            }
        });

        if (!emailMatched) {
            console.error("Selected signatory not found in Model.emailList.");
        }
    } else {
        console.error("No emails found in Model.emailList.");
    }

    updateQrCodeElements();
    updateEsealElements();
    $('#esealFirst').show();

    var sigAnnData = SigAnnData;
    var esealAnnData = EsealAnnData;
    var qrAnnData = QrAnnData;
    if (esealAnnData != null) {
        $("#esealRequired").prop("checked", true);
        $("#esealSecondRequired").prop("checked", true);
        $('#SecondesealTemplates').hide();
        $('#esealTemplates').show();

    } else {
        $("#esealRequired").prop("checked", false);
        $("#esealSecondRequired").prop("checked", false);
        $('#esealTemplates').hide();
        $('#SecondesealTemplates').hide();
    }

    // Sync toggle-switch visual state with hidden checkbox state on load
    syncEsealTemplateUI($('#esealRequired').prop('checked'));
    if ($('#QrCodeRequired').prop('checked')) {
        $('#qrcodeToggle').addClass('active');
    } else {
        $('#qrcodeToggle').removeClass('active');
    }

    var signTemplateSelction = $('#signaturetemplateSelect').val(selectedSigningTemplateId);
    if (selectedSigningTemplateId !== "0") {
        document.getElementById('innerModel').style.display = 'block';
        // Get the selected option's data-preview attribute
        var preview = $('option:selected', '#signaturetemplateSelect').attr('data-preview');
        // Update the preview image
        $("#signaturePreviewImage").attr("src", "data:image/png;base64," + preview);
    } else {
        document.getElementById('innerModel').style.display = 'none';
    }

    //////////Eseal Template/////////////
    var esealTemplateSelction = $('#EsealtemplateSelect').val(selectedEsealTemplateId);
    if (selectedEsealTemplateId !== "0") {
        document.getElementById('EsealInnerModel').style.display = 'flex';
        // Get the selected option's data-preview attribute
        var preview = $('option:selected', '#EsealtemplateSelect').attr('data-preview');
        // Update the preview image
        $("#esealTemplatePreviewImage").attr("src", "data:image/png;base64," + preview);
    } else {
        document.getElementById('EsealInnerModel').style.display = 'none';
    }

    // Load all signatory profiles (avatars, names)
    loadAllSignatoryProfiles();

});

function open_file() {
    document.getElementById('File').click();
}

$(document).ready(function () {

    $.ajax({
        url: TemplateAgentUrl,
        type: 'Get',
        success: function (response) {
            if (!response.success) {
                swal({
                    title: 'Info',
                    text: response.message,
                    type: 'info',
                    icon: 'info',
                }, function (isConfirm) {
                    window.location.href = IndexDashboard;
                });
            } else {

            }
        },

        error: ajaxErrorHandler
    });
});




function sidebarcollapsefields() {
    let rowContainer = document.getElementById('fieldsRecpRpw');
    let sidebarIcon = document.querySelector('#sidebarCollapse1 i'); // Select the <i> inside <h3>

    if (rowContainer.style.display === "none" || rowContainer.style.display === "") {
        rowContainer.setAttribute("style", "display: flex !important;");
        sidebarIcon.classList.remove("fa-angle-double-down");
        sidebarIcon.classList.add("fa-angle-double-up"); // Change to up icon
    } else {
        rowContainer.setAttribute("style", "display: none !important;");
        sidebarIcon.classList.remove("fa-angle-double-up");
        sidebarIcon.classList.add("fa-angle-double-down"); // Change back to down icon
    }
}
async function sendEmailToAjax(email) {

    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            headers: {

                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

            },
            url: OrgDetailsByEmail,
            data: {
                email: email
            },
            beforeSend: function () {
                $('#overlay').css('z-index', 1000000000).show();
            },
            complete: function () {
                $('#overlay').hide().css('z-index', '');
            },
            success: function (response) {
                // Handle the success response from the server

                if (response.userProfile == null || $.isEmptyObject(response.userProfile)) {
                    console.log("email not found");

                    toastr.error(`Signatory not found`);
                    return;
                } else {
                    console.log('Email sent successfully:', response);
                    var userdetails = response.userProfile;
                    selectedSuid = userdetails.suid;


                }

                resolve();
            },

            error: ajaxErrorHandler
        });
    });
}


function sidebarcollapseSignatoriesfields() {
    let rowContainer = document.getElementById('emailList');
    let sidebarIcon = document.querySelector('#sidebarCollapse2 i');

    if (rowContainer.style.display === "none" || rowContainer.style.display === "") {
        rowContainer.setAttribute("style", "display: block !important;");
        sidebarIcon.classList.remove("fa-angle-double-down");
        sidebarIcon.classList.add("fa-angle-double-up"); // Change to up icon
    } else {
        rowContainer.setAttribute("style", "display: none !important;");
        sidebarIcon.classList.remove("fa-angle-double-up");
        sidebarIcon.classList.add("fa-angle-double-down"); // Change back to down icon
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

function renderPDF(pdf, annotations = []) {
    // Use on-demand rendering: create page containers and render pages lazily using IntersectionObserver
    pdfContainer.innerHTML = '';
    uploadedPDF = pdf;
    currentPage = 1;
    updatePageIndicatorDisplay(1);

    // Create page containers WITHOUT awaiting getPage
    for (let pageNum = 0; pageNum < pdf.numPages; pageNum++) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'pdf-page';
        pageDiv.dataset.pageNumber = pageNum;
        pageDiv.style.minHeight = '200px';
        pdfContainer.appendChild(pageDiv);
    }

    // Pre-render first 20 pages and wait for all to complete
    const renderTasks = [];
    const limit = Math.min(20, pdf.numPages);

    // Pages to pre-render: first `limit` pages plus any pages that have annotations
    const pagesToRender = new Set();
    for (let i = 0; i < limit; i++) pagesToRender.add(i);
    try {
        if (Array.isArray(annotations) && annotations.length > 0) {
            annotations.forEach(a => {
                if (a && typeof a.page === 'number') {
                    const idx = a.page - 1;
                    if (idx >= 0 && idx < pdf.numPages) pagesToRender.add(idx);
                }
            });
        }
    } catch (e) {
        $('#overlay').hide();
        console.error('Error computing pages to pre-render from annotations', e);
    }

    // Launch render tasks for pages we want ready immediately
    pagesToRender.forEach(p => {
        renderTasks.push(renderPage(p, annotations));
    });

    Promise.all(renderTasks).then(() => {
        // Now enable scroll rendering
        setupScrollRendering(annotations);
        $('#overlay').hide();

        // CRITICAL: Initialize drag-and-drop AFTER pages are rendered
        // This ensures drop targets (.pdf-page, .annotation-layer) exist
        initDragAndDrop();
        console.log('[PDF] All initial pages rendered. Drag-drop is now active.');

        try {
            document.getElementById("loading-text1").innerText = "Document Loaded";
        } catch (e) {
        }
    }).catch(err => {
        console.error(err);
        // If pre-rendering fails, still setup the observer so pages render on scroll
        try { setupScrollRendering(annotations); } catch (e) { }
        try { $('#overlay').hide(); } catch (e) { }
        // Still try to initialize drag-drop even on error
        try { initDragAndDrop(); } catch (e) { }
    });
}


async function renderPage(pageNum, annotations = []) {
    if (renderedPages.has(pageNum)) return; // Skip if already rendered
    renderedPages.add(pageNum);

    const page = await uploadedPDF.getPage(pageNum + 1);

    const scale = 1.5;
    const rotation = page.rotate; // Rotation from the PDF metadata
    rotationDataval = rotation;
    const viewport = page.getViewport({ scale, rotation });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = '100%';

    const context = canvas.getContext('2d');
    const renderContext = { canvasContext: context, viewport };

    const container = document.querySelector(`[data-page-number="${pageNum}"]`);
    if (!container) return;
    container.innerHTML = '';
    container.style.position = 'relative';
    container.dataset.pageNum = pageNum;
    container.appendChild(canvas);

    await page.render(renderContext).promise;

    const rect = canvas.getBoundingClientRect();
    canvasWidth = rect.width;
    canvasHeight = rect.height;

    const annotationLayer = document.createElement('div');
    annotationLayer.className = 'annotation-layer';
    annotationLayer.style.position = 'absolute';
    annotationLayer.style.top = '0';
    annotationLayer.style.left = '0';
    annotationLayer.style.width = '100%';
    annotationLayer.style.height = '100%';
    annotationLayer.style.pointerEvents = 'none';
    annotationLayer.dataset.pageNumber = pageNum;
    container.appendChild(annotationLayer);

    originalWidth = viewport.viewBox[2];
    originalHeight = viewport.viewBox[3];
    pageWidth = originalWidth;
    pageHeight = originalHeight;

    // Add any previous annotations for this page
    try {
        const pageIndexOneBased = pageNum + 1;
        const pageAnnotations = annotations && Array.isArray(annotations) ? annotations.filter(a => a.page === pageIndexOneBased) : [];
        if (pageAnnotations.length > 0) {
            pageAnnotations.forEach(annotation => {
                if (annotation.type !== 'Wsave' && annotation.type !== 'Wfill') {
                    const element = createPreviousDraggableElement(annotation);
                    if (element) {
                        annotationLayer.appendChild(element);
                    }
                }
            });
        }
    } catch (e) {
        console.error('Error appending previous annotations', e);
    }
}

function setupScrollRendering(annotations = []) {
    const observer = new IntersectionObserver(async (entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                const pageDiv = entry.target;
                const pageNum = parseInt(pageDiv.dataset.pageNumber);

                // Load previous 2 to next 2 pages
                const start = Math.max(0, pageNum - 1);
                const end = Math.min(uploadedPDF.numPages - 1, pageNum + 1);

                for (let i = start; i <= end; i++) {
                    if (!renderQueue.has(i)) {
                        renderQueue.add(i);
                        await renderPage(i, annotations);
                    }
                }
            }
        }
    }, {
        root: null,
        rootMargin: '200px',
        threshold: 0.1
    });

    document.querySelectorAll('.pdf-page').forEach(div => observer.observe(div));
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

// ============================================================
// DRAG & DROP INITIALIZATION
// Centralized function to bind drag events to toolbar buttons.
// Called after PDF pages are ready to ensure drop targets exist.
// ============================================================
function initDragAndDrop() {
    // Prevent duplicate initialization
    if (isDragDropInitialized) {
        console.log('[DragDrop] Already initialized, skipping.');
        return;
    }

    const toolbarButtons = document.querySelectorAll('#fieldsRecpRpw button');

    if (toolbarButtons.length === 0) {
        console.warn('[DragDrop] No toolbar buttons found. Initialization deferred.');
        return;
    }

    // Check if PDF pages exist (drop targets)
    const pdfPages = document.querySelectorAll('.pdf-page');
    if (pdfPages.length === 0) {
        console.warn('[DragDrop] No PDF pages found. Drag-drop will work once PDF is loaded.');
        // Still attach event listeners - they'll find pages dynamically
    }

    toolbarButtons.forEach(button => {
        // Remove any existing listeners to prevent duplicates
        button.removeEventListener('mousedown', onMouseDown);
        button.removeEventListener('touchstart', onMouseDown);

        // Attach fresh listeners
        button.addEventListener('mousedown', onMouseDown);
        button.addEventListener('touchstart', onMouseDown, { passive: false });
    });

    isDragDropInitialized = true;
    console.log('[DragDrop] Initialized successfully with', toolbarButtons.length, 'buttons.');

    // Resolve the ready promise for any waiting code
    if (dragDropReadyPromiseResolve) {
        dragDropReadyPromiseResolve();
    }
}

/**
 * Re-initializes drag-and-drop after dynamic content changes.
 * Safe to call multiple times - will reset and rebind all handlers.
 */
function reinitDragAndDrop() {
    isDragDropInitialized = false;
    initDragAndDrop();
}

/**
 * Checks if drag-and-drop system is ready.
 * @returns {boolean}
 */
function isDragDropReady() {
    return isDragDropInitialized && document.querySelectorAll('.pdf-page .annotation-layer').length > 0;
}

// Defer initial binding - actual activation happens when PDF viewer opens via initDragAndDrop()


function onMouseDown(event) {
    // Defensive check: ensure PDF pages exist before starting drag
    const pdfPages = document.querySelectorAll('.pdf-page');
    if (pdfPages.length === 0) {
        console.warn('[DragDrop] No PDF pages available. Cannot start drag operation.');
        toastr.warning('Please wait for the document to load completely.');
        return;
    }

    // Prevent default touch behavior to avoid scroll conflicts
    if (event.type === 'touchstart') {
        event.preventDefault();
    }

    const type = event.target.id || event.target.closest('button')?.id;
    if (!type) {
        console.warn('[DragDrop] Could not determine field type from event target.');
        return;
    }

    const ghostElement = createGhostElement(event, false);
    if (!ghostElement) {
        console.warn('[DragDrop] Failed to create ghost element.');
        return;
    }

    document.body.appendChild(ghostElement);

    const offsetX = document.documentElement.scrollLeft || document.body.scrollLeft;

    const offsetY = document.documentElement.scrollTop || document.body.scrollTop;

    function onMouseMove(e) {
        const isTouch = e.type.startsWith('touch');
        const clientX = isTouch ? e.touches[0].clientX : e.clientX;
        const clientY = isTouch ? e.touches[0].clientY : e.clientY;

        ghostElement.style.left = clientX + offsetX + 'px';
        ghostElement.style.top = clientY + offsetY + 'px';
    }

    function onMouseUp(e) {
        const isTouch = e.type.startsWith('touch');
        const clientX = isTouch ? e.changedTouches[0].clientX : e.clientX;
        const clientY = isTouch ? e.changedTouches[0].clientY : e.clientY;
        var requiredreceipient = PerpareDocumentContext.receipientEmails.find(item => item.email == PerpareDocumentContext.selectuser);

        const pageElements = document.elementsFromPoint(clientX, clientY);

        const pdfPage = pageElements.find(el => el.classList.contains('pdf-page'));

        if (pdfPage) {
            const annotationLayer = pdfPage.querySelector('.annotation-layer');
            const rect = pdfPage.getBoundingClientRect();
            const left = clientX - rect.left;
            const top = clientY - rect.top;
            const selectElement = PerpareDocumentContext.selectuser;
            const selectedRole = PerpareDocumentContext.selectuser;

            if (type === "SIGNATURE") {
                if (type === "SIGNATURE") {
                    var fieldname = 'SIGNATURE' + "_" + selectedRole;
                }
                if (!fieldnameslist.includes(fieldname)) {

                    const element = createDraggableElementNew(type, left, top);
                    annotationLayer.appendChild(element);


                    //ratio of width
                    const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                    const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                    const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                    const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                    element.setAttribute('data-wpercent', wratio)
                    element.setAttribute('data-hpercent', hratio)
                    element.setAttribute('data-lpercent', lratio)
                    element.setAttribute('data-tpercent', tratio)

                    if ((element.offsetWidth + left) > rect.width) {
                        swal({
                            title: "Info",
                            text: `The annotation is exceeding the PDF boundaries. Please adjust its size or position to fit within the document limits.`,
                            type: "info",
                        });
                        annotationLayer.removeChild(element);
                    } else {
                        //fieldnameslist[requiredreceipient.order] = fieldname;
                        fieldnameslist.push(fieldname);
                    }
                    scaleX = originalWidth / rect.width;
                    scaleY = originalHeight / rect.height;

                } else {

                    swal({
                        title: "Info",
                        text: `More than one Signature field is selected for the Recepient : ${selectedRole}`,
                        type: "error",
                    });
                }


            } else if (type === "ESEAL") {
                var fieldname = 'ESEAL' + "_" + selectedRole;
                if (!fieldnameslist.includes(fieldname)) {

                    const element = createDraggableElementNew(type, left, top);
                    annotationLayer.appendChild(element);


                    //ratio of width
                    const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                    const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                    const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                    const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                    element.setAttribute('data-wpercent', wratio)
                    element.setAttribute('data-hpercent', hratio)
                    element.setAttribute('data-lpercent', lratio)
                    element.setAttribute('data-tpercent', tratio)

                    if ((element.offsetWidth + left) > rect.width) {
                        swal({
                            title: "Info",
                            text: `The annotation is exceeding the PDF boundaries. Please adjust its size or position to fit within the document limits.`,
                            type: "info",
                        });
                        annotationLayer.removeChild(element);
                    } else {
                        //fieldnameslist[requiredreceipient.order] = fieldname;
                        fieldnameslist.push(fieldname);
                    }
                    scaleX = originalWidth / rect.width;
                    scaleY = originalHeight / rect.height;
                } else {

                    swal({
                        title: "Info",
                        text: `More than one Eseal field is selected for the Recepient : ${selectedRole}`,
                        type: "error",
                    });
                }


            } else if (type === "QRCODE") {
                var fieldname = 'QRCODE' + "_" + selectedRole;
                if (!fieldnameslist.includes(fieldname)) {

                    const element = createDraggableElementNew(type, left, top);
                    annotationLayer.appendChild(element);


                    //ratio of width
                    const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                    const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                    const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                    const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                    element.setAttribute('data-wpercent', wratio)
                    element.setAttribute('data-hpercent', hratio)
                    element.setAttribute('data-lpercent', lratio)
                    element.setAttribute('data-tpercent', tratio)

                    if ((element.offsetWidth + left) > rect.width) {
                        swal({
                            title: "Info",
                            text: `The annotation is exceeding the PDF boundaries. Please adjust its size or position to fit within the document limits.`,
                            type: "info",
                        });
                        annotationLayer.removeChild(element);
                    } else {
                        fieldnameslist.push(fieldname);
                    }
                    scaleX = originalWidth / rect.width;
                    scaleY = originalHeight / rect.height;
                } else {

                    swal({
                        title: "Info",
                        text: `More than one QRCODE field is selected`,
                        type: "error",
                    });
                }


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

function onClick(type) {
    // const pdfPage = document.querySelector('div.pdf-page');
    const pages = document.querySelectorAll('.pdf-page');
    let current = null;
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
        //const selectElement = document.getElementById('ClientSelect');
        //const selectedRole = selectElement.value;
        const selectedRole = PerpareDocumentContext.selectuser;

        if (type === "plain-text") {
            const element = createDraggableElementNew(type, left, top);
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
            // updateFieldsList();
        }
        else if (type === "SIGNATURE" || type === "ESEAL" || type === "QRCODE") {
            if (type === "SIGNATURE") {
                var fieldname = 'SIGNATURE' + "_" + selectedRole;
            } else if (type === "ESEAL") {
                var fieldname = 'ESEAL' + "_" + selectedRole;
            } else if (type === "QRCODE") {
                var fieldname = 'QRCODE' + '_' + selectedRole;
            }

            if (!fieldnameslist.includes(fieldname)) {

                const element = createDraggableElementNew(type, left, top);
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
                } else {
                    fieldnameslist.push(fieldname);
                }
                scaleX = originalWidth / rect.width;
                scaleY = originalHeight / rect.height;
            } else {
                if (type === "SIGNATURE") {
                    swal({
                        title: "Info",
                        text: `More than one Signature field is selected for the Recepient : ${selectedRole}`,
                        type: "error",
                    });
                } else if (type === "ESEAL") {
                    swal({
                        title: "Info",
                        text: `More than one Eseal field is selected for the Recepient : ${selectedRole}`,
                        type: "error",
                    });
                } else if (type === "QRCODE") {
                    swal({
                        title: "Info",
                        text: `More than one QRCODE field is selected`,
                        type: "error",
                    });
                }
            }


        }

    }


}
function createGhostElement(event, autotype) {
    const selectedRole = PerpareDocumentContext.selectuser;
    const element = document.createElement('div');
    element.classList.add('draggable');

    const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;

    // Get the button ID - handle clicks on child elements (span, icon)
    const buttonId = event.target.id || event.target.closest('button')?.id || '';

    var fontSize = 0;
    if (!PerpareDocumentContext.MultiSign) {//single signer
        if (buttonId === 'SIGNATURE') {
            const input = document.createElement('div');
            input.style.border = "1px solid #44aad1";
            input.style.textAlign = 'center';

            // input.style.width = (canvasWidth * 0.3) + 'px';
            // input.style.height = (canvasWidth * 0.07) + 'px';
            if (signature_dimensions.height <= 120) {
                input.style.width = (signature_dimensions.width * 0.2702426536) + 'px';
                input.style.height = (signature_dimensions.height * 0.3756481986) + 'px';
                fontSize = (canvasWidth * 0.0575) / 4.5;
            } else if (signature_dimensions.height < 160 && signature_dimensions.height > 120) {

                input.style.width = (signature_dimensions.width * 0.2895) + 'px';
                input.style.height = (signature_dimensions.height * 0.4056481986) + 'px';
                fontSize = (canvasWidth * 0.0560) / 4.5;
            } else if (signature_dimensions.height > 160) {

                input.style.width = (signature_dimensions.width * 0.2895) + 'px';
                input.style.height = (signature_dimensions.height * 0.4056481986) + 'px';
                fontSize = (canvasWidth * 0.0560) / 4.5;
            }
            input.textContent = "Signature";
            input.style.backgroundColor = "#d8d7d78a";
            input.style.color = "#44aad1";
            input.style.fontSize = `${fontSize}px`;

            element.appendChild(input);
        }

        else if (buttonId === 'ESEAL') {
            const input = document.createElement('div');
            input.style.border = "1px solid #44aad1";
            input.style.textAlign = 'center';
            input.style.padding = '15%';
            //input.style.width = (canvasWidth * 0.15) + 'px';
            //input.style.height = (canvasWidth * 0.15) + 'px';
            input.style.width = (eseal_dimensions.width * 0.363097) + 'px';
            input.style.height = (eseal_dimensions.height * 0.341452) + 'px';
            fontSize = (canvasWidth * 0.08907) / 7.5;
            input.textContent = 'ESEAL';
            input.style.backgroundColor = "#d8d7d78a";
            input.style.color = "#44aad1";
            input.style.fontSize = `${fontSize}px`;
            element.appendChild(input);
        }


        else if (buttonId === 'QRCODE') {
            const input = document.createElement('div');
            input.style.border = "1px solid #44aad1";
            input.style.textAlign = 'center';
            input.style.padding = '15%';
            //input.style.width = (canvasWidth * 0.15) + 'px';
            //input.style.height = (canvasWidth * 0.15) + 'px';

            input.style.width = (qrcode_dimensions.width * 0.0601336711) + 'px';
            input.style.height = (qrcode_dimensions.width * 0.0601336711) + 'px';
            fontSize = (canvasWidth * 0.134) / 7.5;
            input.textContent = 'QRCODE';
            input.style.backgroundColor = "#d8d7d78a";
            input.style.color = "#44aad1";
            input.style.fontSize = `${fontSize}px`;
            element.appendChild(input);
        }


        else if (buttonId === 'INITIAL') {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'image-container';
            //imageContainer.style.width = "150px";
            //imageContainer.style.height = "70px";
            if (rotationData === 270 || rotationData === 90) {
                imageContainer.style.width = (canvasWidth * 0.08907) + 'px';
                imageContainer.style.height = (canvasWidth * 0.08245) + 'px';

            } else {
                imageContainer.style.width = (canvasWidth * 0.08245) + 'px';
                imageContainer.style.height = (canvasWidth * 0.08907) + 'px';

            }
            const img = document.createElement('img');
            if (initialImg.startsWith("data:image")) {
                img.src = initialImg;
            } else {
                img.src = 'data:image/png;base64,' + initialImg;
            }

            img.alt = 'Initial';
            img.style.width = '100%'; // Adjust as needed
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            imageContainer.appendChild(img);
            element.appendChild(imageContainer);

        }

    } else {
        if (buttonId === 'SIGNATURE') {
            const input = document.createElement('div');
            input.style.border = "1px solid #44aad1";
            input.style.textAlign = 'center';
            if (signature_dimensions_others.height <= 120) {
                input.style.width = (signature_dimensions.width * 0.2702426536) + 'px';
                input.style.height = (signature_dimensions.height * 0.3756481986) + 'px';
                fontSize = (canvasWidth * 0.0575) / 4.5;
            } else if (signature_dimensions_others.height < 160 && signature_dimensions_others.height > 120) {
                input.style.width = (signature_dimensions.width * 0.2895) + 'px';
                input.style.height = (signature_dimensions.height * 0.4056481986) + 'px';
                fontSize = (canvasWidth * 0.0560) / 4.5;
            } else if (signature_dimensions_others.height > 160) {
                input.style.width = (signature_dimensions.width * 0.2895) + 'px';
                input.style.height = (signature_dimensions.height * 0.4056481986) + 'px';
                fontSize = (canvasWidth * 0.0560) / 4.5;
            }
            input.textContent = "Signature";
            input.style.backgroundColor = "#d8d7d78a";
            input.style.color = "#44aad1";
            input.style.fontSize = `${fontSize}px`;

            element.appendChild(input);
        }
        else if (buttonId === 'QRCODE') {
            const input = document.createElement('div');
            input.style.border = "1px solid #44aad1";
            input.style.textAlign = 'center';
            input.style.padding = '15%';
            input.style.width = (qrcode_dimensions.width * 0.0601336711) + 'px';
            input.style.height = (qrcode_dimensions.width * 0.0601336711) + 'px';
            fontSize = (canvasWidth * 0.134) / 7.5;
            input.textContent = 'QRCODE';
            input.style.backgroundColor = "#d8d7d78a";
            input.style.color = "#44aad1";
            input.style.fontSize = `${fontSize}px`;
            element.appendChild(input);
        }

        else if (buttonId === 'ESEAL') {
            const input = document.createElement('div');
            input.style.border = "1px solid #44aad1";
            input.style.textAlign = 'center';
            input.style.padding = '30%';
            //input.style.width = (canvasWidth * 0.15) + 'px';
            //input.style.height = (canvasWidth * 0.15) + 'px';
            input.style.width = (eseal_dimensions.width * 0.363097) + 'px';
            input.style.height = (eseal_dimensions.height * 0.341452) + 'px';
            fontSize = (canvasWidth * 0.08907) / 7.5;
            input.textContent = "ESEAL";
            input.style.backgroundColor = "#d8d7d78a";
            input.style.color = "#44aad1";
            input.style.fontSize = `${fontSize}px`;
            element.appendChild(input);
        }


        else if (buttonId === 'INITIAL') {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'image-container';
            if (rotationData === 270 || rotationData === 90) {
                imageContainer.style.width = (canvasWidth * 0.08907) + 'px';
                imageContainer.style.height = (canvasWidth * 0.08245) + 'px';
            } else {
                imageContainer.style.width = (canvasWidth * 0.08245) + 'px';
                imageContainer.style.height = (canvasWidth * 0.08907) + 'px';
            }
            fontSize = (canvasWidth * 0.08907) / 7.5;
            const spanEle = document.createElement("span");
            spanEle.textContent = `INITIAL`;
            spanEle.style.backgroundColor = '#e5e5e5';
            spanEle.style.color = '#4A90E2';
            spanEle.style.width = "100%";
            spanEle.style.height = "100%";
            spanEle.style.fontSize = `13px`;
            spanEle.style.padding = '10px';
            spanEle.style.paddingRight = '40px';

            imageContainer.appendChild(spanEle);
            element.appendChild(imageContainer);





        }
    }

    element.style.position = 'absolute';
    element.style.pointerEvents = 'none';  // Disable interactions while dragging
    element.style.zIndex = '1000';
    element.style.opacity = '0.5';
    element.style.left = (event.clientX + scrollLeft) + 'px';
    element.style.top = (event.clientY + scrollTop) + 'px';

    return element;
}

function resizeStart(e, content, handlePosition, parele, type) {

    const isTouch = e.type.startsWith('touch');

    const startX = isTouch ? e.touches[0].clientX : e.clientX;
    const startY = isTouch ? e.touches[0].clientY : e.clientY;


    const rect = content.getBoundingClientRect();
    const startLeft = parseFloat(parele.style.left.replace('px', ''));
    const startTop = parseFloat(parele.style.top.replace('px', ''));
    const startRight = rect.right;

    const startWidth = parseFloat(getComputedStyle(content.firstChild, null).width.replace('px', ''));
    const startHeight = parseFloat(getComputedStyle(content.firstChild, null).height.replace('px', ''));
    const isRadioButton = content.firstChild.type === 'radio';
    const isCheckBox = content.firstChild.type === 'checkbox';

    var roledata = content.firstChild.role;
    const roleprefix = roledata.split('_')[0];
    const isSignature = roleprefix === 'SIGNATURE';
    const isEseal = roleprefix === 'ESEAL';

    let newWidth = null;
    let newHeight = null;
    let newLeft = null;
    let newTop = null;


    function resizeMove(e) {
        // e.preventDefault();
        let clientX, clientY;
        if (e.type === 'mousemove') {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        const dx = clientX - startX;
        const dy = clientY - startY;

        newWidth = startWidth;
        newHeight = startHeight;
        newLeft = startLeft;
        newTop = startTop;


        if (handlePosition === 'top-left') {
            newWidth = startWidth - dx;
            newHeight = startHeight - dy;

            newLeft = startLeft + dx;
            newTop = startTop + dy;
            console.log("top", newTop)
            var newL = `${newLeft}px`;
            var newT = `${newTop}px`;
            console.log("l,t", newL, newT);

            parele.style.left = newL;
            parele.style.top = newT;

        }
        else if (handlePosition === 'top-right') {
            newWidth = startWidth + dx;
            newHeight = startHeight - dy;
            newTop = startTop + dy;
            parele.style.top = `${newTop}px`;
        }
        else if (handlePosition === 'bottom-left') {
            newWidth = startWidth - dx;
            newHeight = startHeight + dy;
            newLeft = startLeft + dx;
            parele.style.left = `${newLeft}px`;

        }
        else { // bottom-right
            newWidth = startWidth + dx;
            newHeight = startHeight + dy;
        }


        if (isRadioButton || isCheckBox) {
            const newSize = Math.min(newWidth, newHeight);
            content.firstChild.style.width = `${newSize}px`;
            content.firstChild.style.height = `${newSize}px`;

            const wratio = newSize / document.querySelector('canvas').getBoundingClientRect().width;
            const hratio = newSize / document.querySelector('canvas').getBoundingClientRect().height;

            content.parentElement.setAttribute('data-wpercent', wratio);
            content.parentElement.setAttribute('data-hpercent', hratio);
        } else {
            content.firstChild.style.width = `${newWidth}px`;
            content.firstChild.style.height = `${newHeight}px`;

            if (content.firstChild.type === 'date') {
                content.parentElement.style.width = `${newWidth}px`;
            }

            const wratio = newWidth / document.querySelector('canvas').getBoundingClientRect().width;
            const hratio = newHeight / document.querySelector('canvas').getBoundingClientRect().height;

            content.parentElement.setAttribute('data-wpercent', wratio);
            content.parentElement.setAttribute('data-hpercent', hratio);
        }
        if (isSignature) {
            // Dynamically adjust font size based on height
            const fontSize = newHeight / 4.5;
            content.firstChild.style.fontSize = `${fontSize}px`;

        } else if (isEseal) {
            // Dynamically adjust font size based on height
            const fontSize = newHeight / 7.5;
            content.firstChild.style.fontSize = `${fontSize}px`;

        }
        else {
            // Dynamically adjust font size based on height
            const fontSize = newHeight / 2;
            content.firstChild.style.fontSize = `${fontSize}px`;
        }

    }


    function resizeEnd() {
        document.removeEventListener('mousemove', resizeMove);
        document.removeEventListener('mouseup', resizeEnd);

        document.removeEventListener('touchmove', resizeMove);
        document.removeEventListener('touchend', resizeEnd);

        if (type === "INITIAL") {
            swal({
                type: 'info',
                title: "Message",
                text: "Do you want to modify the initial annotation at the same location on every page where it is present?",
                showCancelButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Yes',
                cancelButtonText: "No"
            }, function (isConfirm) {
                if (isConfirm) {
                    const firstChild = content.firstElementChild;

                    const initialId = firstChild.firstChild.id;

                    const selectedRole = initialId.replace(/^INITIAL\d+/, "");
                    fieldnameslist.forEach((fieldName) => {
                        if (fieldName.endsWith(selectedRole) && fieldName.startsWith("INITIAL")) {
                            const initialImg = document.getElementById(fieldName);

                            if (initialImg) {
                                const parele = initialImg.closest(".draggable");
                                const content = initialImg.closest(".draggable-content");

                                //updsating left and top values
                                if (handlePosition === 'top-left') {
                                    parele.style.left = `${newLeft}px`;
                                    parele.style.top = `${newTop}px`;

                                }
                                else if (handlePosition === 'top-right') {
                                    parele.style.top = `${newTop}px`;
                                }
                                else if (handlePosition === 'bottom-left') {
                                    parele.style.left = `${newLeft}px`;
                                }

                                //updating width and height of initials
                                content.firstChild.style.width = `${newWidth}px`;
                                content.firstChild.style.height = `${newHeight}px`;

                                if (content.firstChild.type === 'date') {
                                    content.parentElement.style.width = `${newWidth}px`;
                                }

                                const wratio = newWidth / document.querySelector('canvas').getBoundingClientRect().width;
                                const hratio = newHeight / document.querySelector('canvas').getBoundingClientRect().height;

                                content.parentElement.setAttribute('data-wpercent', wratio);
                                content.parentElement.setAttribute('data-hpercent', hratio);

                            }


                        }
                    });
                }
            });
        }

    }

    document.addEventListener('mousemove', resizeMove);
    document.addEventListener('mouseup', resizeEnd);

    document.addEventListener('touchmove', resizeMove);
    document.addEventListener('touchend', resizeEnd);
}

function addResizeHandles(content, parele, type) {

    const handles = ['bottom-right', 'bottom-left', 'top-left', 'top-right'];
    handles.forEach(position => {
        const handle = document.createElement('div');
        handle.classList.add('resize-handle', position);
        content.appendChild(handle);
        handle.style.display = 'none';
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            resizeStart(e, content, position, parele, type);
        });

        handle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            resizeStart(e, content, position, parele, type);

        });
    });
}

function extractRGBValues(rgbString) {

    const rgbArray = rgbString.match(/\d+/g);
    return rgbArray ? rgbArray.map(Number) : [0, 0, 0];
}
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function updateModalContent(headerContent, bodyContent, footerContent) {
    // Update the modal header
    document.querySelector('#EditFields_Modal .modal-header').innerHTML = headerContent;

    // Update the modal body
    document.querySelector('#EditFields_Modal .modal-body').innerHTML = bodyContent;

    // Update the modal footer
    document.querySelector('#EditFields_Modal .modal-footer').innerHTML = footerContent;
}

function addEditIcon(content, type) {
    const editIcon = document.createElement('div');
    editIcon.classList.add('edit-icon');
    editIcon.innerHTML = '<i class="fas fa-trash-can" style="color: #e63946;"></i>';




    if (type === 'Signature' || type === 'SIGNATURE') {

        console.log("hellow12334");
        editIcon.addEventListener('click', () => {
            console.log("hellow1233fgfewf4");
            const firstChild = content.firstElementChild;
            console.log(firstChild);
            const newHeader = '<h5 class="modal-title">Do you want to delete this field?</h5>';
            const newBody = ``;
            //const newBody = `<input  type="text" value="${firstChild.id.split("_")[0]}" id="FieldNameInput" class="form-control"  placeholder="Enter new field name" readonly>`;
            const newFooter = `
                                                                                                                                                                                                                                                                             <button type="button" class="btn btn-danger"  id="deleteFieldName">Delete</button>
                                                                                                                                                                                                                                                                         <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                                                                                                                                                                                                                                                     `;

            // Update the modal content
            updateModalContent(newHeader, newBody, newFooter);

            document.getElementById('deleteFieldName').addEventListener('click', () => {
                console.log(content);
                const element = content.parentElement;
                console.log(element);
                fieldnameslist = fieldnameslist.filter(item => item !== firstChild.role);
                element.remove();
                $('#EditFields_Modal').modal('hide');
            });

            // Show the modal
            console.log($('#EditFields_Modal'));
            $('#EditFields_Modal').modal('show');

        });
    }
    else if (type === 'Eseal' || type === 'ESEAL') {
        editIcon.addEventListener('click', () => {
            const firstChild = content.firstElementChild;

            const newHeader = '<h5 class="modal-title">Do you want to delete this field?</h5>';
            const newBody = ``;
            //const newBody = `<input type="text" value="${firstChild.id.split("_")[0]}" id="FieldNameInput" class="form-control"  placeholder="Enter new field name" readonly>`;
            const newFooter = `
                                                                                                                                                                                                                                                                                 <button type="button" class="btn btn-danger"  id="deleteFieldName">Delete</button>
                                                                                                                                                                                                                                                                             <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                                                                                                                                                                                                                                                         `;

            // Update the modal content
            updateModalContent(newHeader, newBody, newFooter);

            document.getElementById('deleteFieldName').addEventListener('click', () => {
                console.log(content);
                const element = content.parentElement;
                console.log(element);
                fieldnameslist = fieldnameslist.filter(item => item !== firstChild.role);
                element.remove();
                $('#EditFields_Modal').modal('hide');
            });


            // Show the modal
            $('#EditFields_Modal').modal('show');

        });
    }
    else if (type === 'QRCODE') {
        editIcon.addEventListener('click', () => {
            const firstChild = content.firstElementChild;

            const newHeader = '<h5 class="modal-title">Do you want to delete this field?</h5>';
            const newBody = ``;
            //const newBody = `<input type="text" value="${firstChild.id.split("_")[0]}" id="FieldNameInput" class="form-control"  placeholder="Enter new field name" readonly>`;
            const newFooter = `
                                                                                                                                                                                                                                                                                 <button type="button" class="btn btn-danger"  id="deleteFieldName">Delete</button>
                                                                                                                                                                                                                                                                             <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                                                                                                                                                                                                                                                         `;

            // Update the modal content
            updateModalContent(newHeader, newBody, newFooter);

            document.getElementById('deleteFieldName').addEventListener('click', () => {
                console.log(content);
                const element = content.parentElement;
                console.log(element);
                fieldnameslist = fieldnameslist.filter(item => item !== firstChild.role);
                element.remove();
                $('#EditFields_Modal').modal('hide');
            });


            // Show the modal
            $('#EditFields_Modal').modal('show');

        });
    }

    content.appendChild(editIcon);
}
function makeDraggable(element) {
    let startX, startY;
    let offsetX, offsetY, isDragging = false;
    var newLeft;
    var newTop;
    element.addEventListener('mousedown', (e) => {
        if (!e.target.classList.contains('resize-handle') && !e.target.classList.contains('edit-icon') && !e.target.classList.contains('input-field') && !e.target.classList.contains('editable-text') && !e.target.classList.contains('image-upload') && !e.target.classList.contains('remove-image-btn')) {
            isDragging = true;
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;
            startX = e.clientX;
            startY = e.clientY;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);

        }
    });


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
    function isInside(elementRect, pageRect) {
        return (
            elementRect.top >= pageRect.top &&
            elementRect.bottom <= pageRect.bottom
        );
    }

    function onMouseUp(e) {
        const movedX = Math.abs(e.clientX - startX);
        const movedY = Math.abs(e.clientY - startY);
        const wasDragged = movedX > 2 || movedY > 2;

        isDragging = false;

        const isTouch = e.type.startsWith('touch');
        if (isTouch) {
            document.removeEventListener('touchmove', onMouseMove);
            document.removeEventListener('touchend', onMouseUp);
        } else {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

        }

        if (!wasDragged) {
            // This is a CLICK, don't run drag/drop logic, allow click handler to fire
            return;
        }


        const pdfPages = document.querySelectorAll('.pdf-page');

        const draggableRect = element.getBoundingClientRect();



        element.style.left = newLeft;
        element.style.top = newTop;


        const lratio = (newLeft / (document.querySelector('canvas')).getBoundingClientRect().width);
        const tratio = (newTop / (document.querySelector('canvas')).getBoundingClientRect().height);

        element.setAttribute('data-lpercent', lratio)
        element.setAttribute('data-tpercent', tratio)

        console.log(e.target.id);
        console.log(typeof (e.target.id));
        if (e.target.id.startsWith("INITIAL")) {
            swal({
                type: 'info',
                title: "Message",
                text: "Do you want to modify the initial annotation at the same location on every page where it is present?",
                showCancelButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Yes',
                cancelButtonText: "No"
            }, function (isConfirm) {
                if (isConfirm) {
                    const firstChild = element.firstElementChild?.firstElementChild;
                    const initialId = firstChild.firstChild.id;

                    const selectedRole = initialId.replace(/^INITIAL\d+/, "");
                    fieldnameslist.forEach((fieldName) => {
                        if (fieldName.endsWith(selectedRole) && fieldName.startsWith("INITIAL")) {
                            const initialImg = document.getElementById(fieldName);

                            if (initialImg) {
                                const draggableDiv = initialImg.closest(".draggable");

                                if (draggableDiv) {
                                    // Apply position to draggable div, not the img
                                    draggableDiv.style.left = `${newLeft}px`;
                                    draggableDiv.style.top = `${newTop}px`;

                                    const canvasRect = document.querySelector('canvas').getBoundingClientRect();

                                    const wratio = draggableDiv.offsetWidth / canvasRect.width;
                                    const hratio = draggableDiv.offsetHeight / canvasRect.height;
                                    const lratio = newLeft / canvasRect.width;
                                    const tratio = newTop / canvasRect.height;

                                    draggableDiv.setAttribute('data-wpercent', wratio);
                                    draggableDiv.setAttribute('data-hpercent', hratio);
                                    draggableDiv.setAttribute('data-lpercent', lratio);
                                    draggableDiv.setAttribute('data-tpercent', tratio);
                                }
                            }

                        }
                    });
                } else {
                    element.style.left = `${newLeft}px`;
                    element.style.top = `${newTop}px`;
                }
            });
        } else {
            // For non-initialButton, apply the position normally
            element.style.left = `${newLeft}px`;
            element.style.top = `${newTop}px`;
        }

    }
}

function createDraggableElementNew(type, left, top, group, value, isMandatory) {
    //const selectElement = document.getElementById('ClientSelect');
    const selectedRole = PerpareDocumentContext.selectuser;
    console.log(PerpareDocumentContext);
    var requiredreceipient = PerpareDocumentContext.receipientEmails.find(item => item.email == PerpareDocumentContext.selectuser);
    var fontSize = 0;

    const element = document.createElement('div');
    element.classList.add('draggable');
    element.style.left = left + 'px';
    element.style.top = top + 'px';
    element.style.border = 'none';
    if (type === 'radio-button') {
        element.style.padding = '0.8%';
    }

    const content = document.createElement('div');
    content.classList.add('draggable-content');

    if (type === 'SIGNATURE') {
        element.style.padding = '0';
        const input = document.createElement('div');
        input.style.border = "1px solid #44aad1";
        input.style.textAlign = 'center';

        if (signature_dimensions.height <= 120) {
            input.style.width = (signature_dimensions.width * 0.2702426536) + 'px';
            input.style.height = (signature_dimensions.height * 0.3756481986) + 'px';
        } else if (signature_dimensions.height < 160 && signature_dimensions.height > 120) {
            input.style.width = (signature_dimensions.width * 0.2895) + 'px';
            input.style.height = (signature_dimensions.height * 0.4056481986) + 'px';
        } else if (signature_dimensions.height > 160) {
            input.style.width = (signature_dimensions.width * 0.2895) + 'px';
            input.style.height = (signature_dimensions.height * 0.4056481986) + 'px';
        }
        fontSize = (canvasWidth * 0.0575) / 4.5;
        //input.textContent = 'SIGNATURE' + "_" + selectedRole;
        input.textContent = 'SIGNATURE' + "_" + selectedRole;
        input.style.backgroundColor = "#d8d7d78a";
        input.style.color = "#44aad1";
        input.style.fontSize = `${fontSize}px`;
        input.id = 'SIGNATURE' + "_" + selectedRole;
        input.setAttribute('role', 'SIGNATURE' + "_" + selectedRole);

        //fieldnameslist[requiredreceipient.order] = 'SIGNATURE' + "_" + selectedRole;


        content.appendChild(input);
    }
    else if (type === 'ESEAL') {
        element.style.padding = '0';
        const input = document.createElement('div');
        input.style.border = "1px solid #44aad1";
        input.style.textAlign = 'center';

        input.style.width = (eseal_dimensions.width * 0.363097) + 'px';
        input.style.height = (eseal_dimensions.height * 0.341452) + 'px';
        fontSize = (canvasWidth * 0.08245) / 7.5;
        input.textContent = "ESEAL";
        input.textContent = 'ESEAL' + "_" + selectedRole;
        input.style.backgroundColor = "#d8d7d78a";
        input.style.color = "#44aad1";
        input.style.fontSize = `${fontSize}px`;

        input.id = 'ESEAL' + "_" + selectedRole;
        input.setAttribute('role', 'ESEAL' + "_" + selectedRole);
        content.appendChild(input);
    }
    else if (type === 'QRCODE') {
        element.style.padding = '0';
        const input = document.createElement('div');
        //input.style.border = "1px solid #44aad1";
        input.style.textAlign = 'center';
        //input.style.padding = '30%';

        if (rotationData === 270 || rotationData === 90) {
            input.style.width = (canvasWidth * 0.134) + 'px';
            input.style.height = (canvasWidth * 0.134) + 'px';

        } else {
            input.style.width = (canvasWidth * 0.134) + 'px';
            input.style.height = (canvasWidth * 0.134) + 'px';

        }
        input.textContent = "ESEAL";
        input.style.width = (canvasWidth * 0.15) + 'px';
        input.style.height = (canvasWidth * 0.15) + 'px';
        input.textContent = 'ESEAL' + "_" + selectedRole;
        input.style.backgroundColor = "#d8d7d78a";
        input.style.color = "#44aad1";

        input.id = 'QRCODE' + "_" + selectedRole;
        input.setAttribute('role', 'QRCODE' + "_" + selectedRole);
        content.appendChild(input);
    }

    element.appendChild(content);
    if (type !== 'websave' && type !== 'webfill') {
        // Make the div focusable
        content.setAttribute('tabindex', '0');
        addResizeHandles(content, element, type);

        // On click, focus the content so blur works
        content.addEventListener("click", () => {
            content.focus();
        });

        // When focused, show resize handles
        content.addEventListener("focus", () => {
            const handles = content.querySelectorAll('.resize-handle');
            handles.forEach(handle => {
                handle.style.display = 'block';
            });

            content.style.border = '2px solid #4A90E2';
        });

        // When blurred, hide resize handles
        content.addEventListener("blur", () => {
            const handles = content.querySelectorAll('.resize-handle');
            handles.forEach(handle => {
                handle.style.display = 'none';
            });

            content.style.border = 'none';
        });
    }
    addEditIcon(content, type);

    element.style.position = 'absolute';
    element.style.pointerEvents = 'auto';  // Enable interactions
    element.style.zIndex = '1000';  // Ensure it's on top of other elements



    makeDraggable(element);

    return element;
}



function createPreviousDraggableElement(annotation) {
    var sigAnnData = SigAnnData;
    var esealAnnData = EsealAnnData;
    var qrAnnData = QrAnnData;
    var Docrotation = 0;
    var requireduser = PerpareDocumentContext.receipientEmails[0].email;
    var isEsealChecked = $("#esealRequired").prop("checked");
    var EsealChecked = $("#esealSecondRequired").prop("checked");

    if (annotation.type === "Signature") {
        if (annotation.role !== `SIGNATURE_${requireduser}`) {
            annotation.role = `SIGNATURE_${requireduser}`;
        }
        overlaysignflag = true;
        const element = document.createElement('div');
        element.classList.add('draggable');
        element.style.position = 'absolute';
        element.style.pointerEvents = 'auto';
        element.style.border = 'none';
        element.style.zIndex = '1000';
        element.style.padding = '0';

        const wratio = (annotation.width / 100);
        const hratio = (annotation.height / 100);
        const lratio = ((annotation.x) / 100);
        const tratio = ((annotation.y / 100));
        element.setAttribute('data-wpercent', wratio)
        element.setAttribute('data-hpercent', hratio)
        element.setAttribute('data-lpercent', lratio)
        element.setAttribute('data-tpercent', tratio)

        const content = document.createElement('div');
        content.classList.add('draggable-content');
        content.style.overflow = "hidden";

        element.style.left = ((annotation.x / 100) * canvasWidth) + 'px';
        element.style.top = ((annotation.y / 100) * canvasHeight) + 'px';
        const input = document.createElement('div');
        input.style.border = "1px solid #44aad1";
        input.id = annotation.role;
        input.setAttribute("role", annotation.role);
        fieldnameslist.push(annotation.role);


        input.style.textAlign = 'center';
        if (signature_dimensions.height <= 120) {
            input.style.width = (signature_dimensions.width * 0.2702426536) + 'px';
            input.style.height = (signature_dimensions.height * 0.3756481986) + 'px';
        } else if (signature_dimensions.height < 160 && signature_dimensions.height > 120) {
            input.style.width = (signature_dimensions.width * 0.2895) + 'px';
            input.style.height = (signature_dimensions.height * 0.4056481986) + 'px';
        } else if (signature_dimensions.height > 160) {
            input.style.width = (signature_dimensions.width * 0.2895) + 'px';
            input.style.height = (signature_dimensions.height * 0.4056481986) + 'px';
        }
        //input.style.width = ((annotation.width / 100) * canvasWidth) + 'px';
        //input.style.height = ((annotation.height / 100) * canvasHeight) + 'px';

        input.textContent = annotation.role;

        input.style.backgroundColor = "#d8d7d78a";
        input.style.color = "#44aad1";
        var fontSize = (canvasWidth * 0.0575) / 4.5;
        input.style.fontSize = `${fontSize}px`;

        var signatureconfig = JSON.parse(sigAnnData);
        content.appendChild(input);
        if (annotation.type !== 'websave' && annotation.type !== 'webfill') {
            // Make the div focusable
            content.setAttribute('tabindex', '0');
            addResizeHandles(content, element, annotation.type);

            // On click, focus the content so blur works
            content.addEventListener("click", () => {
                content.focus();
            });

            // When focused, show resize handles
            content.addEventListener("focus", () => {
                const handles = content.querySelectorAll('.resize-handle');
                handles.forEach(handle => {
                    handle.style.display = 'block';
                });

                content.style.border = '2px solid #4A90E2';
            });

            // When blurred, hide resize handles
            content.addEventListener("blur", () => {
                const handles = content.querySelectorAll('.resize-handle');
                handles.forEach(handle => {
                    handle.style.display = 'none';
                });

                content.style.border = 'none';
            });
        }

        //addResizeHandles(content, element, annotation.type);
        addEditIcon(content, annotation.type);
        element.appendChild(content);
        makeDraggable(element);
        return element;
    }
    else if (annotation.type === 'Eseal') {
        if (isEsealChecked) {
            if (annotation.role !== `ESEAL_${requireduser}`) {
                annotation.role = `ESEAL_${requireduser}`;
            }
            overlayesealflag = true;
            const element = document.createElement('div');
            element.classList.add('draggable');
            element.style.position = 'absolute';
            element.style.pointerEvents = 'auto';
            element.style.border = 'none';
            element.style.zIndex = '1000';
            element.style.padding = '0';

            const wratio = (annotation.width / 100);
            const hratio = (annotation.height / 100);
            const lratio = ((annotation.x) / 100);
            const tratio = ((annotation.y / 100));
            element.setAttribute('data-wpercent', wratio)
            element.setAttribute('data-hpercent', hratio)
            element.setAttribute('data-lpercent', lratio)
            element.setAttribute('data-tpercent', tratio)

            const content = document.createElement('div');
            content.classList.add('draggable-content');
            content.style.overflow = "hidden";

            element.style.left = ((annotation.x / 100) * canvasWidth) + 'px';
            element.style.top = ((annotation.y / 100) * canvasHeight) + 'px';

            element.style.padding = '0';
            const input = document.createElement('div');
            input.style.border = "1px solid #44aad1";
            var fontSize = (canvasWidth * 0.0575) / 4.5;
            input.style.fontSize = `${fontSize}px`;
            input.style.textAlign = 'center';
            //input.style.width = ((annotation.width / 100) * canvasWidth) + 'px';
            //input.style.height = ((annotation.height / 100) * canvasHeight) + 'px';
            input.style.width = (eseal_dimensions.width * 0.363097) + 'px';
            input.style.height = (eseal_dimensions.height * 0.341452) + 'px';
            input.id = annotation.role;
            input.textContent = annotation.role;
            input.style.backgroundColor = "#d8d7d78a";
            input.style.color = "#44aad1";

            input.setAttribute("role", annotation.role);
            fieldnameslist.push(annotation.role);
            content.appendChild(input);
            if (annotation.type !== 'websave' && annotation.type !== 'webfill') {
                // Make the div focusable
                content.setAttribute('tabindex', '0');
                addResizeHandles(content, element, annotation.type);

                // On click, focus the content so blur works
                content.addEventListener("click", () => {
                    content.focus();
                });

                // When focused, show resize handles
                content.addEventListener("focus", () => {
                    const handles = content.querySelectorAll('.resize-handle');
                    handles.forEach(handle => {
                        handle.style.display = 'block';
                    });

                    content.style.border = '2px solid #4A90E2';
                });

                // When blurred, hide resize handles
                content.addEventListener("blur", () => {
                    const handles = content.querySelectorAll('.resize-handle');
                    handles.forEach(handle => {
                        handle.style.display = 'none';
                    });

                    content.style.border = 'none';
                });
            }

            // addResizeHandles(content, element, annotation.type);
            addEditIcon(content, annotation.type);
            element.appendChild(content);
            makeDraggable(element);
            var esealconfig = JSON.parse(esealAnnData);
            return element;
        }

    }

}


function createDraggableElement(annotation) {
    var sigAnnData = SigAnnData;
    var esealAnnData = EsealAnnData;
    var qrAnnData = QrAnnData;
    var Docrotation = 0;


    if (annotation.type === "Signature") {
        overlaysignflag = true;

        const element = document.createElement('div');
        element.classList.add('draggable');
        element.style.position = 'absolute';
        element.style.overflow = "hidden"
        element.style.pointerEvents = 'auto';
        element.style.border = 'none';
        element.style.zIndex = '1000';
        element.style.padding = '0';
        const wratio = (annotation.width / 100);
        const hratio = (annotation.height / 100);
        const lratio = ((annotation.x) / 100);
        const tratio = ((annotation.y / 100));
        element.setAttribute('data-wpercent', wratio)
        element.setAttribute('data-hpercent', hratio)
        element.setAttribute('data-lpercent', lratio)
        element.setAttribute('data-tpercent', tratio)

        const content = document.createElement('div');
        content.classList.add('draggable-content');

        element.style.left = ((annotation.x / 100) * canvasWidth) + 'px';
        element.style.top = ((annotation.y / 100) * canvasHeight) + 'px';
        const input = document.createElement('div');
        input.style.border = "1px solid #44aad1";
        input.id = "Signature";
        input.style.textAlign = 'center';

        input.style.width = ((annotation.width / 100) * canvasWidth) + 'px';
        input.style.height = ((annotation.height / 100) * canvasHeight) + 'px';

        input.textContent = 'Signature';
        //input.innerHTML = SIG;
        input.style.backgroundColor = "#d8d7d78a";
        input.style.color = "#44aad1";
        // input.style.fontSize = "77%";



        content.appendChild(input);
        element.appendChild(content);
        var signatureconfig = JSON.parse(sigAnnData);

        return element;
    }
    else if (annotation.type === 'Eseal') {

        overlayesealflag = true;

        const element = document.createElement('div');
        element.classList.add('draggable');
        element.style.position = 'absolute';
        element.style.pointerEvents = 'auto';
        element.style.overflow = "hidden"
        element.style.border = 'none';
        element.style.zIndex = '1000';
        element.style.padding = '0';

        const wratio = (annotation.width / 100);
        const hratio = (annotation.height / 100);
        const lratio = ((annotation.x) / 100);
        const tratio = ((annotation.y / 100));
        element.setAttribute('data-wpercent', wratio)
        element.setAttribute('data-hpercent', hratio)
        element.setAttribute('data-lpercent', lratio)
        element.setAttribute('data-tpercent', tratio)

        const content = document.createElement('div');
        content.classList.add('draggable-content');

        element.style.left = ((annotation.x / 100) * canvasWidth) + 'px';
        element.style.top = ((annotation.y / 100) * canvasHeight) + 'px';

        element.style.padding = '0';
        const input = document.createElement('div');
        input.style.border = "1px solid #44aad1";
        input.style.textAlign = 'center';
        input.style.padding = '15%';
        input.style.width = ((annotation.width / 100) * canvasWidth) + 'px';
        input.style.height = ((annotation.height / 100) * canvasHeight) + 'px';
        input.id = 'Eseal';
        input.textContent = 'Eseal';
        // const img = document.createElement('img');
        // img.src = Eseal;
        // input.appendChild(img);



        input.style.backgroundColor = "#d8d7d78a";
        input.style.color = "#44aad1";
        //input.style.fontSize = "77%";



        content.appendChild(input);

        element.appendChild(content);
        var esealconfig = JSON.parse(esealAnnData);
        // matchedEsealData = {};
        // for (const key in esealconfig) {
        //     if (esealconfig.hasOwnProperty(key) && key === loginEmail) {
        //         matchedEsealData[key] = esealconfig[key];
        //     }
        // }

        return element;
    }

}

//---------------- QR Code Check Box
function updateQrCodeElements() {

    var qrCodeCheckbox = document.getElementById("QrCodeRequired");
    // var qrCodeButtonBox = document.getElementById("QRCODE");

    if (qrcodeChecked != "False") {
        // If QrCode is required, check the checkbox and remove the 'classshide' class
        qrCodeCheckbox.checked = true;

        $("#QRCODE").removeClass("classshide");
    } else {
        // If QrCode is not required, uncheck the checkbox and add the 'classshide' class
        qrCodeCheckbox.checked = false;
        $("#QRCODE").addClass("classshide");
    }
}

//---------------- ESEAL Check Box
function updateEsealElements() {

    var esealCheckbox = document.getElementById("esealRequired"); //
    // var EsealdummyChecked = document.getElementById("esealSecondRequired");//
    var EsealdummyChecked = $("#esealSecondRequired").prop("checked");

    if (esealChechked != "False" || EsealdummyChecked != false) {

        esealCheckbox.checked = true;
        //$("#esealTemplates").show();
        $("#Eseal").removeClass("classshide");
    } else {

        esealCheckbox.checked = false;
        $("#Eseal").addClass("classshide");
        $('#esealTemplates').hide();
        $('#SecondesealTemplates').hide();
    }

    // Keep the settings panel dropdown in sync
    syncEsealTemplateUI(esealCheckbox.checked);
}



// Handle checkbox change event
$(document).on('change', '.select-checkbox', function () {
    var $this = $(this);
    var $card = $this.closest('.signer-card');

    if ($this.prop('checked')) {
        // Single-select UI: uncheck all others and clear selected state
        $('.select-checkbox').not(this).prop('checked', false);
        $('.signer-card').not($card).removeClass('selected');

        selectedEmails = [];

        var email = $this.data('email');
        selectedEmails.push(email);

        // Populate the input field
        $('#RecpientList_0__Email').val(email);

        // Disable the input field
        $('#RecpientList_0__Email').prop('disabled', true);

        // Add visual selected state to the card
        $card.addClass('selected');
    } else {
        // If the checkbox is unchecked
        $('#RecpientList_0__Email').val('');
        $('#RecpientList_0__Email').prop('disabled', false);
        selectedEmails = [];

        // Remove visual selected state from the card
        $card.removeClass('selected');
    }
});

// Handle click on signer cards for better UX
$(document).on('click', '.signer-card', function (e) {
    // Let the native checkbox click behave normally
    if ($(e.target).is('input[type="checkbox"]')) {
        return;
    }

    e.preventDefault();

    var $checkbox = $(this).find('input[type="checkbox"]');
    if ($checkbox.length) {
        var nextState = !$checkbox.prop('checked');
        $checkbox.prop('checked', nextState).trigger('change');
    }
});

//Advance Settings button on click function//
function Settings() {

    if ($('.select-checkbox:checked').length === 1) {
        var model = document.getElementById("settingsModal");
        if (model.style.display === "none") {
            model.style.display = "flex";
        }
        document.getElementById('fadeBackground').style.display = 'block';
    } else {
        //showCustomAlert("Please select one Bulk Sign Signatory.");
        toastr.error("Please select one Bulk Sign Signatory.");
    }
}


//Custom Alert message
function showCustomAlert(message) {
    // Set the alert message
    document.getElementById('alert-message').innerText = message;

    // Show the alert box
    document.getElementById('custom-alert').style.display = 'block';

    // Add some additional styles to the custom alert box
    document.getElementById('custom-alert').style.animation = 'fadeIn 0.3s';
    document.getElementById('custom-alert').style.animationFillMode = 'forwards';

    // Add a click event listener to the OK button
    document.getElementById('ok-button').addEventListener('click', function () {
        // Hide the alert box when the OK button is clicked
        document.getElementById('custom-alert').style.animation = 'fadeOut 0.3s';
        document.getElementById('custom-alert').style.animationFillMode = 'forwards';

        setTimeout(function () {
            document.getElementById('custom-alert').style.display = 'none';
        }, 300);
    });
    setTimeout(function () {
        if (document.getElementById('custom-alert').style.display === 'block') {
            document.getElementById('custom-alert').style.animation = 'fadeOut 0.3s';
            document.getElementById('custom-alert').style.animationFillMode = 'forwards';

            setTimeout(function () {
                document.getElementById('custom-alert').style.display = 'none';
            }, 300);
        }
    }, 4000);
}

//=====================================================//
//Sign Img Previvew
$('#signaturetemplateSelect').change(function () {
    // Get the selected value
    selectedSigningTemplateId = $(this).val();
    if (selectedSigningTemplateId !== "0") {
        document.getElementById('innerModel').style.display = 'block';
    } else {
        document.getElementById('innerModel').style.display = 'none';
    }

    // Get the selected option's data-preview attribute
    var preview = $('option:selected', this).attr('data-preview');

    // Update the preview image
    $("#signaturePreviewImage").attr("src", "data:image/png;base64," + preview);

});

// Eseal Image Previvew
$('#EsealtemplateSelect').change(function () {
    // Get the selected value

    selectedEsealTemplateId = $(this).val();

    if (selectedEsealTemplateId !== "0") {
        document.getElementById('EsealInnerModel').style.display = 'flex';
    } else {
        document.getElementById('EsealInnerModel').style.display = 'none';
    }

    // Get the selected option's data-preview attribute
    var preview = $('option:selected', this).attr('data-preview');

    // Update the preview image
    $("#esealTemplatePreviewImage").attr("src", "data:image/png;base64," + preview);

});

//Sign Img Previvew 2
$('#SecndsignaturetemplateSelect').change(function () {
    // Get the selected value
    selectedSigningTemplateId = $(this).val();

    if (selectedSigningTemplateId !== "0") {
        document.getElementById('SecondinnerModel').style.display = 'block';
    } else {
        document.getElementById('SecondinnerModel').style.display = 'none';
    }
    // Get the selected option's data-preview attribute
    var preview = $('option:selected', this).attr('data-preview');

    // Update the preview image
    $("#SecondsignaturePreviewImage").attr("src", "data:image/png;base64," + preview);


});

// Eseal Image Previvew 2
$('#SecondEsealtemplateSelect').change(function () {
    // Get the selected value
    selectedEsealTemplateId = $(this).val();

    if (selectedEsealTemplateId !== "0") {
        document.getElementById('SecondEsealInnerModel').style.display = 'block';
    } else {
        document.getElementById('SecondEsealInnerModel').style.display = 'none';
    }
    // Get the selected option's data-preview attribute
    var preview = $('option:selected', this).attr('data-preview');

    // Update the preview image
    $("#SecondeSealPreviewImage").attr("src", "data:image/png;base64," + preview);

});


$('#esealRequired').change(function () {
    console.log("triggered1");
    var checked = $(this).prop("checked");

    if (checked) {
        $('#SecondSignatureTemp').hide();
        $('#SecondesealTemplates').hide();
        $('#esealTemplates').show();
    } else {
        $('#esealTemplates').hide();
        $('#SecondesealTemplates').hide();
    }

    // Keep settings panel E-Seal dropdown in sync
    syncEsealTemplateUI(checked);
});

//second Eseal Template Check box click
$("#esealSecondRequired").change(function () {
    console.log("triggered1");
    var checked = $(this).prop("checked");

    if (checked) {
        $('#SecondSignatureTemp').show();
        $('#SecondesealTemplates').show();
        $('#SignatureTemp').hide();
        $('#esealTemplates').hide();
    } else {
        $('#SecondSignatureTemp').show();
        $('#SecondesealTemplates').hide();
        $('#SignatureTemp').hide();
        $('#esealTemplates').hide();
    }
});


//------------------- Modal Close Button Click

function closeSettingsModal() {
    var model = document.getElementById("settingsModal");
    if (model.style.display === "flex") {
        model.style.display = "none";
    }
    document.getElementById("signaturetemplateSelect").value = "0";
    document.getElementById("EsealtemplateSelect").value = "0";
    document.getElementById("SecndsignaturetemplateSelect").value = "0";
    document.getElementById("SecondEsealtemplateSelect").value = "0";
    document.getElementById('innerModel').style.display = 'none';
    document.getElementById('EsealInnerModel').style.display = 'none';
    document.getElementById('SecondEsealInnerModel').style.display = 'none';
    document.getElementById('SecondinnerModel').style.display = 'none';
    // Get the checkbox element by its id
    var esealcheckbox = document.getElementById("esealRequired");
    var esealcheckbox2 = document.getElementById("esealSecondRequired")
    // Check if the checkbox is checked
    if (esealcheckbox.checked) {
        esealcheckbox.checked = false;
        $('#esealTemplates').hide();
    }

    var qrcheckbox = document.getElementById("QrCodeRequired");
    // Check if the checkbox is checked
    if (qrcheckbox.checked) {
        qrcheckbox.checked = false;
    }
    document.getElementById('fadeBackground').style.display = "none";
}

//------------------ Modal Ok Button Click
function applySettings() {


    if (selectedEmails.length > 0) {
        var signatureTemplate = selectedSigningTemplateId;
        var viewModel = {
            Email: selectedEmails[selectedEmails.length - 1], // Assign the email at the length-1 position
            TemplateId: signatureTemplate,
        };
        checkSignature();
    } else {
        var model = document.getElementById("settingsModal");
        if (model.style.display === "flex") {
            model.style.display = "none";
        }
        document.getElementById('fadeBackground').style.display = "none";
        // document.getElementById("settingsModal").classList.remove("MuiDialog-scrollPaper");
    }

    function checkSignature() {
        console.log(viewModel);
        // Add your AJAX call here to check e-seal permission
        $.ajax({
            url: Templateverifyorg,
            method: 'POST',
            headers: {

                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

            },
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(viewModel),

            success: function (response) {

                if (response.success) {
                    var model = document.getElementById("settingsModal");
                    if (model.style.display === "flex") {
                        model.style.display = "none";
                    }
                    document.getElementById('fadeBackground').style.display = "none";
                } else {
                    // showCustomAlert(response.message)
                    toastr.error(response.message);
                }
            },
            // error: function () {
            //     showCustomAlert("Something Went Wrong")
            // }
            error: ajaxErrorHandler
        });
    }
}

//------------------ Eye Icon Click
async function ImagePreview() {
    try {
        let tempid = document.getElementById('signaturetemplateSelect').value;
        const response = await handleTemplatePreviewimages(tempid);
        var model = document.getElementById("settingsInnerModal");
        if (response) {

            if (response.success) {

                $("#signaturePreviewImage").attr("src", "data:image/png;base64," + response.data);

                model.style.display = "flex";
            }
            else {
                swal({
                    type: 'error',
                    title: 'Error',
                    text: response.message
                })
                model.style.display = "none";
            }

        } else {
            console.error("No preview data received");
            model.style.display = "none";
        }
    } catch (err) {
        console.error("Error fetching preview images:", err);
    }
}
async function handleTemplatePreviewimages(tempid) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "GET",
            url: GetTemplatePreviewimages,
            beforeSend: function () {
                $('#overlay').show();
            },
            complete: function () {
                $('#overlay').hide();
            },
            data: {

                signtempid: tempid
            },
            success: function (response) {
                console.log(response);
                if (response) {

                    resolve(response);
                }
            },
            error: function (error) {
                ajaxErrorHandler(error);
                reject(error);
            }
        });
    });
}

function closeModal() {
    var model = document.getElementById("settingsInnerModal");
    if (model.style.display === "flex") {
        model.style.display = "none";
    }
}

async function ImagePreviewEseal() {


    try {
        let tempid = document.getElementById('EsealtemplateSelect').value;
        const response = await handleTemplatePreviewimages(tempid);
        var model = document.getElementById("settingsInnerModalEseal");
        if (response) {

            if (response.success) {

                $("#esealTemplatePreviewImage").attr("src", "data:image/png;base64," + response.data);

                model.style.display = "flex";
            }
            else {
                swal({
                    type: 'error',
                    title: 'Error',
                    text: response.message
                })
                model.style.display = "none";
            }

        } else {
            console.error("No preview data received");
            model.style.display = "none";
        }
    } catch (err) {
        console.error("Error fetching preview images:", err);
    }
}

function closeModals() {
    var model = document.getElementById("settingsInnerModalEseal");
    if (model.style.display === "flex") {
        model.style.display = "none";
    }
}


//---------------------------------- Back Button Click in web-viewer
$("#back").on("click", function () {
    fieldnameslist = [];
    pdfContainer.innerHTML = '';
    renderQueue.clear();
    renderedPages.clear();

    if (!$('#Send').hasClass("classshide"))
        $('#Send').addClass("classshide");
    if (!$('#Save').hasClass("classshide"))
        $('#Save').addClass("classshide");
    $("#Eseal").addClass("classshide");
    $("#QRCODE").addClass("classshide");
    $('#viwer').addClass("classshide");
    $('#create').removeClass("classshide");
    $("#fields").addClass("classshide")

    // Reset drag-drop state so it re-initializes on next document load
    isDragDropInitialized = false;
    console.log('[DragDrop] State reset for next document.');
});

$("#QrCodeRequired").on("change", function () {
    toggleQRCODEVisibility();
});


//--------------------------------------- Continue Button Click
$("#Continue").on("click", async function (e) {

    // SelfiePrevivew();
    if ($('.select-checkbox:checked').length === 1) {
        var docname = $('#DocumentName').val().trim();
        if (docname === '' || docname === null) {

            toastr.error("Please enter a document name");
            e.preventDefault();
            return;
        }

        var templateName = $("#TemplateName").val().trim();
        // Check if template name is empty
        if (templateName === "") {

            toastr.error("Template Name Should not be Empty");
            e.preventDefault();
            return;
        }

        // var EmailList = [];
        PerpareDocumentContext.receipientEmails = [];
        await sendEmailToAjax(selectedEmails[0]);

        $('.email').each(function (i) {
            console.log(this.value);
            var isEseal = $("#esealRequired").prop("checked");
            PerpareDocumentContext.receipientEmails.push({
                "order": i + 1,
                "email": this.value,
                "eseal": isEseal,
                "suid": selectedSuid
            });
        })

        if (PerpareDocumentContext.receipientEmails.length > 0) {

            latestEmail = selectedEmails[selectedEmails.length - 1];
            var isEsealChecked = $("#esealRequired").prop("checked");
            var isDummyEsealChecked = $("#esealSecondRequired").prop("checked");
            if (isEsealChecked || isDummyEsealChecked) {
                if (bulkSignerEsealEmails.includes(latestEmail)) {

                    SelfieImage();
                }
                else {
                    if (latestEmail == loginEmail) {
                        swal({
                            type: 'info',
                            title: 'Info',
                            text: `You don't have eSeal permission for ` + latestEmail

                        });
                    }
                    else {
                        swal({
                            type: 'info',
                            title: 'Info',
                            text: `Selected signatory does not have e-seal permission ` + latestEmail

                        });
                    }



                    return false;
                }

            } else {

                SelfieImage();
                // continuePreparingDocument();
            }
            var userObjvalue = PerpareDocumentContext.receipientEmails[0];
            if (loginorgUid.trim() != "") {
                var previewuserobjdata =
                {
                    email: userObjvalue.email,
                    suid: userObjvalue.suid,
                    OrganizationId: loginorgUid,
                    AccountType: 'organization',
                }
            }

            try {
                console.log(previewuserobjdata);
                let sign_tempid = document.getElementById('signaturetemplateSelect').value;
                let eseal_tempid = document.getElementById('EsealtemplateSelect').value;
                previewuserobjdata.signtempid = sign_tempid;
                previewuserobjdata.esealtempid = eseal_tempid;

                console.log(sign_tempid);
                console.log(eseal_tempid);
                const previewResponse = await handlePreviewimages(previewuserobjdata);
                console.log(previewResponse);
                if (previewResponse) {

                    signature_img = previewResponse.signatureImage;
                    eseal_img = previewResponse.esealImage;
                    var sigimgdataval_data = 'data:image/png;base64,' + signature_img;
                    var img_selected_user_sign = new Image();
                    img_selected_user_sign.src = sigimgdataval_data;
                    img_selected_user_sign.onload = function () {
                        const width = img_selected_user_sign.width;
                        const height = img_selected_user_sign.height;
                        signature_dimensions = {
                            width: width,
                            height: height,
                        }

                    };
                    var esealimgdataval_data = 'data:image/png;base64,' + eseal_img;
                    var img_selected_user_eseal = new Image();
                    img_selected_user_eseal.src = esealimgdataval_data;
                    img_selected_user_eseal.onload = function () {
                        const width = img_selected_user_eseal.width;
                        const height = img_selected_user_eseal.height;
                        eseal_dimensions = {
                            width: width,
                            height: height,
                        }

                    };

                    console.log("signaturedata", signature_dimensions);
                    console.log("esealdata", eseal_dimensions);
                    console.log("Preview Data:", previewResponse);
                } else {

                    console.warn("No preview data available.");
                }
            } catch (error) {
                console.error("Error fetching preview images:", error);
            }
        }
    } else {
        // showCustomAlert("Please select one Bulk Sign Signatory.");
        toastr.error("Please select one Bulk Sign Signatory.");
    }
});

function SelfieImage() {
    var signatureTemplate = selectedSigningTemplateId;
    var viewModel = {
        Email: selectedEmails[selectedEmails.length - 1], // Assign the email at the length-1 position
        TemplateId: signatureTemplate,
    };


    $.ajax({
        url: Templateverifyorg,
        method: 'POST',
        headers: {

            'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

        },
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify(viewModel),
        beforeSend: function () {
            $('#overlay').show();
        },
        success: function (response) {
            if (response.success == true) {

                var thumbnail = JSON.parse(response.result);
                var data = thumbnail.selfieThumbnail;
                thumbnail_Img = 'data:image/png;base64,' + data;
                continuePreparingDocument()

            }
            else {
                $('#overlay').hide();
                toastr.error(response.message);
                e.preventDefault();
                return;

            }
        },
        error: ajaxErrorHandler
    });
}

function continuePreparingDocument() {

    setTimeout(function () {
        $(".toolcontainer2").addClass("classshide");
    }, 5000);


    latestEmail = selectedEmails[selectedEmails.length - 1];
    // PerpareDocumentContext.selectuser = latestEmail;

    var isEsealChecked = $("#esealRequired").prop("checked");
    var EsealChecked = $("#esealSecondRequired").prop("checked");
    if (isEsealChecked) {
        $("#Eseal").removeClass("classshide");

        toggleQRCODEVisibility();
    } else {
        $("#Eseal").addClass("classshide");
    }

    // Show the "Fields" div
    $("#fields").removeClass("classshide");

    var intervalId = "";
    // Call PrepareDocument function
    getDocumentdata();
    PrepareDocument(latestEmail);

}

function getDocumentdata() {
    var url = GetPreviewConfig;
    var id = EdmsIdvalue;
    var sigAnnData = SigAnnData;
    var esealAnnData = EsealAnnData;
    var qrAnnData = QrAnnData;
    $.ajax({
        url: url + '/' + id,
        type: 'GET',
        beforeSend: function () {
            $('#overlay').show();
        },
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

                    renderPDF(pdf, JSON.parse(components));
                }).catch(error => {
                    $('#overlay').hide()
                    console.error('Error loading PDF:', error);
                });
            } else {
                $('#overlay').hide()
                swal({
                    title: 'Error',
                    text: resp.message,
                    type: 'error',
                }, function (isConfirm) {
                    if (isConfirm) {
                        window.location.href = IndexTemplate;
                    }
                });
            }
            console.log(resp);
        },

        error: ajaxErrorHandler
    });
}


function PrepareDocument(email) {


    let docusers = PerpareDocumentContext.receipientEmails;
    PerpareDocumentContext.receipientEmailsList = [];

    let recpfieldcount = Object.values(docusers).map((user) => {
        return { email: user.email, count: 0 };
    });

    if (recpfieldcount.length > 0) {
        PerpareDocumentContext.receipientEmailsList = recpfieldcount;
    }

    $('#emailList').empty();
    PerpareDocumentContext.receipientEmailsList.map((item, index) => {
        var selected = (index == 0) ? "selected" : "";
        $("#emailList").append(` <span style="display: inline-flex;align-items: center;font-size: 15px;"><img src="${thumbnail_Img}" class="selected2" alt="Thumbnail"> ${item.email}</span>`);


    })




    PerpareDocumentContext.selectuser = email;

    var userObj = PerpareDocumentContext.receipientEmails.find(x => x.email == email);
    var isEsealChecked = $("#esealRequired").prop("checked");
    var EsealChecked = $("#esealSecondRequired").prop("checked");
    if (isEsealChecked) {
        $("#Eseal").removeClass("classshide");
        toggleQRCODEVisibility();

    } else {
        $("#Eseal").addClass("classshide");
    }

    // Manage the field div visibility
    $("#fields").removeClass("classshide");

    var annDat = "";


    if (PerpareDocumentContext.MultiSign) {
        $('#Send').removeClass("classshide");
    } else {
        $('#Save').removeClass("classshide");
    }

    $('#create').addClass("classshide");
    $('#viwer').removeClass("classshide");
    //=============
}
async function handlePreviewimages(preview_req_data) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "GET",
            url: GetPreviewimagesUrl,
            data: {
                email: preview_req_data.email,
                suid: preview_req_data.suid,
                orgUid: preview_req_data.OrganizationId,
                AccountType: preview_req_data.AccountType,
                signtempid: preview_req_data?.signtempid !== undefined ? preview_req_data.signtempid : 0,
                esealtempid: preview_req_data?.esealtempid !== undefined ? preview_req_data.esealtempid : 0,
            },
            beforeSend: function () {
                //$('#overlay').show();  // Show loading overlay
                document.getElementById("navigationNetworkOverlay").style.display = "block";
            },
            complete: function () {

                document.getElementById("navigationNetworkOverlay").style.display = "none";
                //$('#overlay').hide();  // Hide loading overlay
            },
            success: function (response) {
                console.log(response);
                if (response.success) {
                    console.log("Preview images retrieved successfully:", response.data);
                    resolve(response.data); // Resolve with the preview data
                } else {
                    console.error("Failed to retrieve preview images:", response.message);
                    resolve(false); // Resolve with `false` for failure
                }
            },
            error: function (error) {
                console.error("Error during AJAX call:", error);
                ajaxErrorHandler(error); // Handle error (function to be implemented)
                reject(error); // Reject the promise
            }
        });
    });
}



function SaveDocument(url, formData) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: url,
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            method: 'POST',
            headers: {

                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()

            },
            type: 'POST',
            beforeSend: function () {
                $('#overlay').show();
            },
            complete: function () {
                $('#overlay').hide();
            },
            success: function (data) {
                resolve(data) // Resolve promise and when success
            },
            error: function (err) {
                reject(err) // Reject the promise and go to catch()
            }
        });
    });
}
async function Save1() {
    let signCordinates = {};
    let esealCordinates = {};
    var qrCordinates = {};
    var signCheckArr = [];
    var annotations = [];
    var esealCheckArr = [];
    var qrCheCheckArr = [];
    var Signatory = PerpareDocumentContext.receipientEmails;
    var len = PerpareDocumentContext.receipientEmails.length;
    document.querySelectorAll('.pdf-page').forEach((pageElement, pageIndex) => {
        const annotationLayer = pageElement.querySelector('.annotation-layer');
        const canvas = pageElement.querySelector('canvas');
        if (!canvas) {
            return; // Skip to next pageElement
        }
        if (!annotationLayer) {
            return;
        }
        const width = canvas.getBoundingClientRect().width; // Get the width of the canvas
        const height = canvas.getBoundingClientRect().height; // Get the height of the canvas
        const signatureElements = annotationLayer.querySelectorAll('[id^="SIGNATURE_"]');
        const rectele = pageElement.getBoundingClientRect();
        signatureElements.forEach(element1 => {
            var element = element1.parentElement?.parentElement;
            console.log(element);
            var computedStyle = window.getComputedStyle(element);
            var draggablepadding = computedStyle.getPropertyValue('padding-top');
            const rect = element.getBoundingClientRect();
            var emaildata = PerpareDocumentContext.receipientEmails[0].email;
            var suid = PerpareDocumentContext.receipientEmails[0].suid;
            var anname = Date.now();
            scaleX = originalWidth / rect.width;
            scaleY = originalHeight / rect.height;
            const signatureElement = element.querySelector(`[id^="SIGNATURE_"]`); // Find element with id starting with SIGNATURE_

            if (signatureElement && signatureElement.id === `SIGNATURE_${emaildata}`) {
                var inputrect = signatureElement.getBoundingClientRect();
                console.log('Matching element found:', inputrect);
            }
            if (element.querySelectorAll('.image-container')[0]) {
                var pele = element.parentElement;
                var parentRect = pele.parentElement.getBoundingClientRect();
            }
            else {
                var parentRect = element.parentElement.getBoundingClientRect();
            }
            if (rotationDataval === 90 || rotationDataval === 270) {
                scaleX = originalWidth / rectele.height;
                scaleY = originalHeight / rectele.width;
            } else {
                scaleX = originalWidth / rectele.width;
                scaleY = originalHeight / rectele.height;
            }
            if (signatureElement.id === `SIGNATURE_${emaildata}`) {
                annotations.push({
                    type: 'Signature',
                    x: ((rect.left - parentRect.left) / width) * 100,
                    y: ((rect.top - parentRect.top) / height) * 100,
                    width: (inputrect.width / width) * 100,
                    height: (inputrect.height / height) * 100,
                    page: pageIndex + 1,
                    role: `SIGNATURE_${emaildata}`,
                });
                signCordinates[emaildata] = {
                    fieldName: anname,
                    posX: (rect.left - parentRect.left) * scaleX,
                    posY: (rect.top - parentRect.top) * scaleY,
                    PageNumber: pageIndex + 1,
                    width: (inputrect.width) * scaleX,
                    height: (inputrect.height) * scaleY,
                };
                signCheckArr.push(emaildata);
                console.log(signCordinates);
            };
        });

        const esealElements = annotationLayer.querySelectorAll('[id^="ESEAL_"]');

        esealElements.forEach(element1 => {
            var element = element1.parentElement?.parentElement;
            console.log(element);
            var computedStyle = window.getComputedStyle(element);
            var draggablepadding = computedStyle.getPropertyValue('padding-top');
            const rect = element.getBoundingClientRect();
            var emaildata = PerpareDocumentContext.receipientEmails[0].email;
            var orguiddata = PerpareDocumentContext.receipientEmails[0].orgUid;
            var suid = PerpareDocumentContext.receipientEmails[0].suid;
            var anname = Date.now();
            scaleX = originalWidth / rect.width;
            scaleY = originalHeight / rect.height;
            const esealElement = element.querySelector(`[id^="ESEAL_"]`); // Find element with id starting with SIGNATURE_

            if (esealElement && esealElement.id === `ESEAL_${emaildata}`) {
                var inputrect = esealElement.getBoundingClientRect();
                console.log('Matching element found:', inputrect);
            }



            if (element.querySelectorAll('.image-container')[0]) {
                var pele = element.parentElement;
                var parentRect = pele.parentElement.getBoundingClientRect();
            }
            else {
                var parentRect = element.parentElement.getBoundingClientRect();
            }

            if (rotationDataval === 90 || rotationDataval === 270) {
                scaleX = originalWidth / rectele.height;
                scaleY = originalHeight / rectele.width;
            } else {
                scaleX = originalWidth / rectele.width;
                scaleY = originalHeight / rectele.height;
            }

            if (esealElement.id === `ESEAL_${emaildata}`) {
                annotations.push({
                    type: 'Eseal',
                    x: ((rect.left - parentRect.left) / width) * 100,
                    y: ((rect.top - parentRect.top) / height) * 100,
                    width: (inputrect.width / width) * 100,
                    height: (inputrect.height / height) * 100,
                    page: pageIndex + 1,
                    role: `ESEAL_${emaildata}`,
                });
                esealCordinates[emaildata] = {
                    fieldName: anname,
                    posX: (rect.left - parentRect.left) * scaleX,
                    posY: (rect.top - parentRect.top) * scaleY,
                    PageNumber: pageIndex + 1,
                    width: (inputrect.width) * scaleX,
                    height: (inputrect.height) * scaleY,
                    organizationID: orguiddata,
                };
                esealCheckArr.push(emaildata);

                console.log(esealCordinates);
            };
        });

        const qrcodeElements = annotationLayer.querySelectorAll('[id^="QRCODE_"]');

        qrcodeElements.forEach(element1 => {
            var element = element1.parentElement?.parentElement;
            console.log(element);
            var computedStyle = window.getComputedStyle(element);
            var draggablepadding = computedStyle.getPropertyValue('padding-top');
            const rect = element.getBoundingClientRect();
            var emaildata = PerpareDocumentContext.receipientEmails[0].email;
            var orguiddata = PerpareDocumentContext.receipientEmails[0].orgUid;
            var suid = PerpareDocumentContext.receipientEmails[0].suid;
            var anname = Date.now();
            scaleX = originalWidth / rect.width;
            scaleY = originalHeight / rect.height;
            const qrcodeElement = element.querySelector(`[id^="QRCODE_"]`); // Find element with id starting with SIGNATURE_

            if (qrcodeElement && qrcodeElement.id === `QRCODE_${emaildata}`) {
                var inputrect = qrcodeElement.getBoundingClientRect();
                console.log('Matching element found:', inputrect);
            }



            if (element.querySelectorAll('.image-container')[0]) {
                var pele = element.parentElement;
                var parentRect = pele.parentElement.getBoundingClientRect();
            }
            else {
                var parentRect = element.parentElement.getBoundingClientRect();
            }
            if (rotationDataval === 90 || rotationDataval === 270) {
                scaleX = originalWidth / rectele.height;
                scaleY = originalHeight / rectele.width;
            } else {
                scaleX = originalWidth / rectele.width;
                scaleY = originalHeight / rectele.height;
            }
            if (qrcodeElement.id === `QRCODE_${emaildata}`) {
                annotations.push({
                    type: 'Qrcode',
                    x: ((rect.left - parentRect.left) / width) * 100,
                    y: ((rect.top - parentRect.top) / height) * 100,
                    width: (inputrect.width / width) * 100,
                    height: (inputrect.height / height) * 100,
                    page: pageIndex + 1,
                    role: `QRCODE_${emaildata}`,
                });
                qrCordinates[emaildata] = {
                    fieldName: anname,
                    posX: (rect.left - parentRect.left) * scaleX,
                    posY: (rect.top - parentRect.top) * scaleY,
                    PageNumber: pageIndex + 1,
                    width: (inputrect.width) * scaleX,
                    height: (inputrect.height) * scaleY,
                };
                qrCheCheckArr.push(emaildata);
                console.log(qrCordinates);
            };
        });
    });

    var roleList = [];
    var i = 0;
    $('.email').each(function () {
        var isEseal = $("#esealRequired").prop("checked");
        roleList.push({
            "order": i + 1,
            "role": "signer",
            "eseal": isEseal
        });
    })
    let SettingConfig = {
        inputpath: '',
        outputpath: ''
    };

    let DocumentName = document.getElementById("DocumentName").value;
    let TemplateName = document.getElementById("TemplateName").value;
    let EsealSignatureTemplate = selectedEsealTemplateId;
    let SignatureTemplates = selectedSigningTemplateId;
    let Rotation = document.getElementById("Rotation");
    let SettingConfigElement = document.getElementById("SettingConfig");
    let isEseal = $("#RecpientList_0__Eseal").is(':checked');
    let QrCodeRequired = $("#QrCodeRequired").is(':checked');
    var contentType = "application/pdf";
    var pdfBlob = base64ToBlob(document.getElementById('filebase64').value, contentType);
    if (Object.keys(esealCordinates).length === 0) {
        esealCordinates = null
    }
    if (Object.keys(qrCordinates).length === 0) {
        qrCordinates = null
    }
    var config = {
        QrCodeRequired: QrCodeRequired,
        Signature: signCordinates,
        Eseal: esealCordinates,
        Qrcode: qrCordinates

    }
    console.log(JSON.stringify(config));

    console.log(signCordinates);
    console.log(esealCordinates);
    console.log(qrCordinates);

    var htmlSchemadata = JSON.stringify(annotations);
    var list = Signatory.map(x => { return x.email });
    var htmlSchemadata = JSON.stringify(annotations);
    var fileFormData = new FormData();
    fileFormData.append("File", pdfBlob, DocumentName);
    fileFormData.append("DocumentName", DocumentName);
    fileFormData.append("TemplateName", TemplateName);
    fileFormData.append("_id", templateId);
    fileFormData.append("SignatureTemplate", SignatureTemplates);
    fileFormData.append("EsealSignatureTemplate", EsealSignatureTemplate);
    fileFormData.append("Rotation", Rotation);
    fileFormData.append("SettingConfig", SettingConfig);
    fileFormData.append("Config", JSON.stringify(config));
    fileFormData.append("Signatory", list.join(","));
    fileFormData.append("RoleList", roleList);
    fileFormData.append("esealRequired", isEseal);
    fileFormData.append("QrCodeRequired", QrCodeRequired);
    fileFormData.append("htmlSchema", htmlSchemadata);
    SaveDocument(UpdateTemplate, fileFormData)
        .then((response) => {
            if (response.status == "Success") {
                swal({
                    title: "Success",
                    text: response.message,
                    type: "success",
                }, function (isConfirm) {
                    if (isConfirm) {
                        window.location.href = IndexTemplate;
                    }
                });
            } else {
                swal({
                    title: "Error",
                    text: response.message,
                    type: "error",
                }, function (isConfirm) {
                    if (isConfirm) {
                        window.location.href = IndexTemplate;
                    }
                });
            }
        })

        .catch((e) => {

            console.log(e.status);
            if (e.status == 401) {
                swal({ type: 'info', title: "Session Expired", text: "Click on 'Ok' button to login again!" }, function (isConfirm) {
                    if (isConfirm) {
                        window.location.href = IndexLogin;
                    }
                });
            }
            else {

                swal({
                    title: "Error",
                    text: "Something went wrong!",
                    type: "error",
                }, function (isConfirm) {
                    if (isConfirm) {
                        window.location.href = IndexTemplate;
                    }
                });
            }
        });
}



$("#emailList").on('click', 'li', function () {
    $(".list").removeClass("selected");
    $(this).addClass("selected");  // adding active class

    $("#fields").removeClass("classshide");
});



const toggleQRCODEVisibility = () => {
    var isQrCodeRequired = $("#QrCodeRequired").prop("checked");

    if (isQrCodeRequired || qrcodeChecked == true) {
        $("#QRCODE").removeClass("classshide");
    } else {
        $("#QRCODE").addClass("classshide");

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

