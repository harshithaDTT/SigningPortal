/* Legacy CreateDocuments.js restored */

var serialnumber = '';
var entityname = '';
var faceRequired = false;
let isResizing = false;
var initialsStore = {};
const initialsDrawnPages = new Set();
var signature_img_others = '';
var eseal_img_others = '';
var signature_dimensions = { width: 0, height: 0 };
var eseal_dimensions = { width: 0, height: 0 };
var signature_dimensions_others = { width: 0, height: 0 };
var eseal_dimensions_others = { width: 0, height: 0 };
var qrcode_dimensions = { width: 0, height: 0 };
var initial_dimensions = { width: 0, height: 0 };
var initial_dimensions_others = { width: 0, height: 0 };
var quickflag = false;
var iswatermarkpresent = false;
var watermarktext = '';
var continueFlag = false;
var prefix = 'data:image/png;base64,';
var initialImg = '';
var initialImg_others = '';
var settingsButtonIndex;
var alternateSignatoriesList = [];
var signatoriesList = [];
var responses = [];
var organizationobjlist = [];
var userDataResponses = [];
var loginUserDetails = [];
var modalobjlist = [];
var modalobjSelectedorglist = [];
let globalBlob = null;
let OrderZero = true;
var PerpareDocumentContext = {
    receipientEmails: [],
    MultiSign: false,
    receipientEmailsList: [],
    selectuser: '',
    docName: '',
    fileName: '',
    edmsId: '',
    filesizerestrict: 0,
    filesize: '15',
    dropPoint: {}
};
var organizations;
var isFileUploaded = false;
var numberofsignatures = '1';
var alternateSignatoriesCounter = 1;
var orderId = 0;
var listCount = 0;
var modalId = 0;
var rotationData = 0;
var pageHeight = 0;
var pageWidth = 0;
var zoomlevelval = '100%';
var fieldnameslist = [];
var canvasWidth;
var canvasHeight;
var originalHeight = '';
var originalWidth = '';
var scaleX = '';
var scaleY = '';
var pdfContainer = document.getElementById('pdf-container') || null;
var scrollContainer = document.getElementById('scrollContainer') || null;
const pdfjsLib = window['pdfjs-dist/build/pdf'];
var finalblob = '';
var finalresponse = '';
var watermarkfontsize = '';

// ============================================================
// WORKFLOW MODE MANAGEMENT (Simplified - Implicit Detection)
// ============================================================
const SIGNING_MODES = Object.freeze({
    SELF: 'SELF',
    MULTI: 'MULTI'
});

/**
 * Determines signing mode implicitly based on recipient count.
 * No explicit toggle required - mode is derived from document context.
 */
function getCurrentSigningMode() {
    const recipientCount = getRecipientCount();
    return recipientCount > 0 ? SIGNING_MODES.MULTI : SIGNING_MODES.SELF;
}

/**
 * Updates Quick Sign button visibility based on current state.
 * Quick Sign is visible when:
 * - No recipients added (self-sign mode)
 * - No special requirements enabled (Initials, E-Seal, QR Code)
 */
function updateQuickSignVisibility() {
    const $quickSign = $('#quickSign');
    if (!$quickSign.length) return;

    const hasRecipients = getRecipientCount() > 0;
    const initialsRequired = $('#InitialRequired').is(':checked');
    const esealRequired = $('#Eseal_Required').is(':checked');
    const qrCodeRequired = $('#QrCodeRequired').is(':checked');

    const shouldHide = hasRecipients || initialsRequired || esealRequired || qrCodeRequired;

    if (shouldHide) {
        $quickSign.addClass('classshide');
    } else {
        $quickSign.removeClass('classshide');
    }
}

/**
 * Updates the Continue button label based on current context.
 * - If recipients present → "Continue to Send"
 * - If self-sign (no recipients) → "Continue to Sign"
 */
function updateContinueButtonLabel() {
    const $continueText = $('#continueButtonText');
    if (!$continueText.length) return;

    const hasRecipients = getRecipientCount() > 0;
    const newLabel = hasRecipients ? 'Continue to Send' : 'Continue to Sign';
    $continueText.text(newLabel);
}

/**
 * Gets the current signing mode (sequential or parallel)
 */
function getSigningModeType() {
    return $('#signatorySection').hasClass('parallel-mode') ? 'parallel' : 'sequential';
}

/**
 * Sets the signing mode (sequential or parallel)
 */
function setSigningMode(mode) {
    const $section = $('#signatorySection');
    const $sequentialBtn = $('#sequentialModeBtn');
    const $parallelBtn = $('#parallelModeBtn');

    if (mode === 'parallel') {
        $section.removeClass('sequential-mode').addClass('parallel-mode');
        $sequentialBtn.removeClass('active');
        $parallelBtn.addClass('active');
        $('#sequentialSigning').val('false');
        if (typeof PerpareDocumentContext === 'object') {
            PerpareDocumentContext.disableOrder = true;
        }
    } else {
        $section.removeClass('parallel-mode').addClass('sequential-mode');
        $parallelBtn.removeClass('active');
        $sequentialBtn.addClass('active');
        $('#sequentialSigning').val('true');
        if (typeof PerpareDocumentContext === 'object') {
            PerpareDocumentContext.disableOrder = false;
        }
    }

    // Update drag & drop behavior
    updateDragDropState();
}

/**
 * Calculates and returns the count of mandatory recipients
 * SOURCE OF TRUTH: window.recipients array with mandatory property
 */
function getMandatoryRecipientCount() {
    if (!Array.isArray(window.recipients)) return 0;
    return window.recipients.filter(r => r && r.mandatory !== false).length;
}

/**
 * Gets the current minimum required signatures value
 * DERIVED from window.recipients - count of mandatory recipients
 */
function getMinRequiredSignatures() {
    // SINGLE SOURCE OF TRUTH: window.recipients array
    // Min required signatures = count of mandatory recipients
    return getMandatoryRecipientCount();
}

/**
 * Sets the minimum required signatures by updating recipient mandatory status
 * 
 * DERIVED MODEL: The "min required signatures" is derived from the count of 
 * recipients where mandatory !== false. To change this value, we update
 * the mandatory status of recipients.
 * 
 * When called with a value:
 * - If value >= totalCount: make all recipients mandatory
 * - If value <= 0: make all recipients optional
 * - Otherwise: make first N recipients mandatory, rest optional (preserves order)
 */
function setMinRequiredSignatures(value) {
    const totalCount = getRecipientCount();

    // Parse and validate input
    let numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
        numValue = totalCount; // Default to all required
    }

    // Clamp value: 0 to totalCount
    const clamped = Math.min(Math.max(numValue, 0), totalCount);

    // Update window.recipients mandatory status based on target count
    if (Array.isArray(window.recipients)) {
        window.recipients.forEach(function (recipient, index) {
            if (!recipient) return;
            // First N recipients are mandatory, rest are optional
            recipient.mandatory = (index < clamped);
        });
    }

    // Update all UI from single source of truth
    updateRecipientCountLabel();

    // Re-render cards to reflect new mandatory status
    if (typeof renderRecipientCards === 'function') {
        renderRecipientCards({ preserveFocus: true });
    }

    return clamped;
}

/**
 * Updates the visual state of the min-signatures badge based on current recipients state
 * Derives state directly from window.recipients - no caching
 */
function updateMinSignaturesBadgeState() {
    const $badge = $('#minSignaturesDisplay');
    if (!$badge.length) return;

    const totalCount = getRecipientCount();
    const mandatoryCount = getMandatoryRecipientCount();
    const currentRequired = getMinRequiredSignatures();

    // Update the edit-total-count for inline editing
    $badge.find('.edit-total-count').text(totalCount);

    // Remove all state classes first
    $badge.removeClass('mixed-state all-optional all-required');

    // Determine visual state based on current recipients configuration
    if (totalCount === 0) {
        // No recipients - neutral state
        $badge.addClass('all-optional');
    } else if (mandatoryCount === 0) {
        // All recipients are optional
        $badge.addClass('all-optional');
    } else if (mandatoryCount === totalCount) {
        // All recipients are required
        $badge.addClass('all-required');
    } else {
        // Mix of required and optional
        $badge.addClass('mixed-state');
    }
}

/**
 * Initializes the interactive min-signatures badge
 * Sets up click-to-edit behavior without layout shift
 */
function initializeMinSignaturesBadge() {
    const $badge = $('#minSignaturesDisplay');
    const $input = $('#minSigInput');

    if (!$badge.length) return;

    // Click to enter edit mode (unless clicking input itself)
    $badge.off('click.minSig').on('click.minSig', function (e) {
        if ($(e.target).is('input')) return;

        if (!$badge.hasClass('editing')) {
            enterMinSignaturesEditMode();
        }
    });

    // Input validation on each keystroke
    $input.off('input.minSig').on('input.minSig', function () {
        const totalCount = getRecipientCount();
        let val = parseInt($(this).val(), 10);

        // Allow empty during typing
        if ($(this).val() === '') return;

        // Clamp to valid range
        if (!isNaN(val)) {
            if (val < 0) val = 0;
            if (val > totalCount) val = totalCount;
            $(this).val(val);
        }
    });

    // Blur to confirm and exit edit mode
    $input.off('blur.minSig').on('blur.minSig', function () {
        exitMinSignaturesEditMode(true);
    });

    // Keyboard handling
    $input.off('keydown.minSig').on('keydown.minSig', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            exitMinSignaturesEditMode(true);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            exitMinSignaturesEditMode(false); // Don't save on escape
        }
    });

    // Prevent badge click from triggering when clicking input
    $input.off('click.minSig').on('click.minSig', function (e) {
        e.stopPropagation();
    });
}

/**
 * Enters inline edit mode for min signatures
 */
function enterMinSignaturesEditMode() {
    const $badge = $('#minSignaturesDisplay');
    const $input = $('#minSigInput');

    // Set current value in input
    const currentValue = getMinRequiredSignatures();
    const totalCount = getRecipientCount();

    $input.val(currentValue);
    $input.attr('max', totalCount);

    // Update total in edit view
    $badge.find('.edit-total-count').text(totalCount);

    // Enter edit mode (CSS handles visibility)
    $badge.addClass('editing');

    // Focus and select input
    setTimeout(() => {
        $input.focus().select();
    }, 10);
}

/**
 * Exits inline edit mode, optionally saving the value
 */
function exitMinSignaturesEditMode(save = true) {
    const $badge = $('#minSignaturesDisplay');
    const $input = $('#minSigInput');

    if (save) {
        const inputVal = $input.val();
        let value = parseInt(inputVal, 10);

        // Handle empty input - default to current mandatory count or 0
        if (inputVal === '' || isNaN(value)) {
            value = getMandatoryRecipientCount();
        }

        // Set the value (this updates all displays)
        setMinRequiredSignatures(value);
    } else {
        // Restore display to current stored value
        const currentValue = getMinRequiredSignatures();
        $input.val(currentValue);
    }

    // Exit edit mode (CSS handles visibility)
    $badge.removeClass('editing');
}

/**
 * Updates the minimum signatures display - BACKWARD COMPATIBILITY ALIAS
 * This function delegates to updateRecipientCountLabel() which is the single source of truth.
 * Kept for backward compatibility with existing code that calls this directly.
 */
function updateMinSignaturesDisplay() {
    // Delegate to the single source of truth
    updateRecipientCountLabel();
}

/**
 * Updates UI state based on current signing mode (derived from recipients).
 * Called automatically when recipients are added/removed.
 * - Signing mode selector shows only when 2+ recipients
 * 
 * NOTE: This function should NOT call updateMinSignaturesDisplay() or updateRecipientCountLabel()
 * to avoid circular calls. Badge count updates are handled by updateRecipientCountLabel().
 */
function updateWorkflowMode() {
    const recipientCount = getRecipientCount();
    const isMultiMode = recipientCount > 0;
    const hasMultipleRecipients = recipientCount >= 2;
    const signatorySection = $('#signatorySection');
    const signingModeContainer = $('#signingModeContainer');

    // Update PerpareDocumentContext
    if (typeof PerpareDocumentContext === 'object' && PerpareDocumentContext !== null) {
        PerpareDocumentContext.MultiSign = isMultiMode;
    }

    // Show/hide signing mode selector - only when 2+ recipients
    if (signingModeContainer.length) {
        signingModeContainer.css('display', hasMultipleRecipients ? 'flex' : 'none');
    }

    // Update section state
    if (isMultiMode) {
        signatorySection.addClass('multi-sign-active');
    } else {
        signatorySection.removeClass('multi-sign-active');
    }

    // Update dependent UI elements
    toggleMultiSignDependencies(isMultiMode);

    // Update multi-sign option visibility
    updateMultiSignOptionVisibility();

    // Update Continue button label based on context
    updateContinueButtonLabel();
    updateQuickSignVisibility();

    // Update drag & drop state based on signing mode
    updateDragDropState();
}

/**
 * Initializes the workflow mode based on current document state.
 * No modal bindings needed - mode is implicit.
 */
function initializeSigningMode() {
    // Initialize all badge displays from the single source of truth
    updateRecipientCountLabel();

    // Sync checkbox state with actual recipient count
    const hasRecipients = getRecipientCount() > 0;
    $('#addSignatoriesCheckbox').prop('checked', hasRecipients);

    // Bind workflow option handlers
    bindWorkflowOptionHandlers();

    // Initialize interactive min-signatures badge
    initializeMinSignaturesBadge();
}

/**
 * Binds event handlers for workflow options (Signing Mode Selector)
 */
function bindWorkflowOptionHandlers() {
    // Signing mode selector - Sequential button
    $('#sequentialModeBtn').off('click.signingMode').on('click.signingMode', function (e) {
        e.preventDefault();
        setSigningMode('sequential');
    });

    // Signing mode selector - Parallel button
    $('#parallelModeBtn').off('click.signingMode').on('click.signingMode', function (e) {
        e.preventDefault();
        setSigningMode('parallel');
    });

    // Legacy compatibility: keep hidden inputs in sync
    $('#sequentialSigning').off('change.workflow').on('change.workflow', function () {
        const isSequential = $(this).val() === 'true';
        if (typeof PerpareDocumentContext === 'object' && PerpareDocumentContext !== null) {
            PerpareDocumentContext.disableOrder = !isSequential;
        }
    });
}

// ============================================================
// DRAG & DROP RECIPIENT REORDERING
// ============================================================
let draggedRecipientIndex = null;
let draggedElement = null;

/**
 * Updates drag & drop state based on current signing mode
 */
function updateDragDropState() {
    const isSequential = getSigningModeType() === 'sequential';
    const $cards = $('.recipient-card');

    $cards.each(function () {
        $(this).attr('draggable', isSequential ? 'true' : 'false');
    });
}

/**
 * Initializes drag & drop event handlers for recipient cards
 */
function initializeDragAndDrop() {
    const $list = $(recipientSelectors.list);
    if (!$list.length) return;

    // Drag start
    $list.off('dragstart.recipientDrag').on('dragstart.recipientDrag', '.recipient-card', function (e) {
        if (getSigningModeType() !== 'sequential') {
            e.preventDefault();
            return false;
        }

        draggedElement = this;
        draggedRecipientIndex = resolveCardIndexFromElement(this);

        $(this).addClass('dragging');

        // Set drag data
        e.originalEvent.dataTransfer.effectAllowed = 'move';
        e.originalEvent.dataTransfer.setData('text/plain', draggedRecipientIndex);

        // Create a subtle ghost image
        const ghost = this.cloneNode(true);
        ghost.style.opacity = '0.8';
        ghost.style.position = 'absolute';
        ghost.style.top = '-1000px';
        document.body.appendChild(ghost);
        e.originalEvent.dataTransfer.setDragImage(ghost, 50, 25);

        setTimeout(() => {
            document.body.removeChild(ghost);
        }, 0);
    });

    // Drag over
    $list.off('dragover.recipientDrag').on('dragover.recipientDrag', '.recipient-card', function (e) {
        if (getSigningModeType() !== 'sequential') return;

        e.preventDefault();
        e.originalEvent.dataTransfer.dropEffect = 'move';

        const $card = $(this);
        const overIndex = resolveCardIndexFromElement(this);

        if (overIndex !== draggedRecipientIndex) {
            $card.addClass('drag-over');
        }
    });

    // Drag leave
    $list.off('dragleave.recipientDrag').on('dragleave.recipientDrag', '.recipient-card', function (e) {
        $(this).removeClass('drag-over');
    });

    // Drag end
    $list.off('dragend.recipientDrag').on('dragend.recipientDrag', '.recipient-card', function (e) {
        $(this).removeClass('dragging');
        $('.recipient-card').removeClass('drag-over drag-placeholder');
        draggedElement = null;
        draggedRecipientIndex = null;
    });

    // Drop
    $list.off('drop.recipientDrag').on('drop.recipientDrag', '.recipient-card', function (e) {
        e.preventDefault();

        if (getSigningModeType() !== 'sequential') return;

        const dropIndex = resolveCardIndexFromElement(this);

        if (draggedRecipientIndex !== null && dropIndex !== null && draggedRecipientIndex !== dropIndex) {
            // Reorder recipients array
            reorderRecipients(draggedRecipientIndex, dropIndex);
        }

        // Clean up
        $('.recipient-card').removeClass('dragging drag-over drag-placeholder');
        draggedElement = null;
        draggedRecipientIndex = null;
    });
}

/**
 * Reorders recipients array by moving item from fromIndex to toIndex
 */
function reorderRecipients(fromIndex, toIndex) {
    if (!Array.isArray(window.recipients) || fromIndex < 0 || toIndex < 0) return;
    if (fromIndex >= window.recipients.length || toIndex >= window.recipients.length) return;

    // Remove from original position
    const [movedRecipient] = window.recipients.splice(fromIndex, 1);

    // Insert at new position
    window.recipients.splice(toIndex, 0, movedRecipient);

    // Reorder legacy arrays too
    reorderLegacyArrays(fromIndex, toIndex);

    // Re-render cards
    renderRecipientCards({ preserveFocus: true });
}

/**
 * Reorders legacy arrays to match recipient reordering
 */
function reorderLegacyArrays(fromIndex, toIndex) {
    const legacyArrays = ['userDataResponses', 'responses', 'organizationobjlist', 'modalobjlist', 'alternateSignatoriesList', 'modalobjSelectedorglist'];

    legacyArrays.forEach(function (key) {
        const arr = window[key];
        if (Array.isArray(arr) && fromIndex < arr.length) {
            const [movedItem] = arr.splice(fromIndex, 1);
            arr.splice(toIndex, 0, movedItem);
        }
    });
}

function toggleMultiSignDependencies(isMultiMode) {
    const $dependent = $('[data-requires-multi-sign="true"]');
    if (!$dependent.length) {
        return;
    }
    $dependent.each(function () {
        const $section = $(this);
        $section.toggleClass('mode-disabled', !isMultiMode);
        const $interactive = $section.is('input, select, button') ? $section : $section.find('input, select, button');
        $interactive.each(function () {
            $(this).prop('disabled', !isMultiMode);
        });
    });
}

function resetMultiSignWorkflowState() {
    // Reset requirement checkboxes
    $('#InitialRequired, #Eseal_Required, #QrCodeRequired').prop('checked', false);

    // Reset workflow options to defaults - use new signing mode
    setSigningMode('sequential');

    updateMultiSignOptionVisibility();
    // Sync all displays from single source of truth
    updateRecipientCountLabel();
}

function getRecipientCount() {
    // SINGLE SOURCE OF TRUTH: window.recipients array
    // No fallbacks - this ensures deterministic, synchronized state
    if (!Array.isArray(window.recipients)) {
        window.recipients = [];
    }
    return window.recipients.length;
}

// ============================================================
// REQUIRED SIGNATURE MANAGEMENT
// ============================================================
const REQUIRED_SIGNATURE_SELECTORS = {
    wrapper: '#RequiredSignatureNo',
    input: '#RequiredSignatureInput',
    error: '#RequiredSignatureNoError'
};

function syncAllSignersToggleDisabledState(isDisabled) {
    const $modernToggle = $('#allSignersRequiredToggle');
    if ($modernToggle.length) {
        const disabled = !!isDisabled;
        const $wrapper = $modernToggle.closest('.workflow-toggle');
        $modernToggle.prop('disabled', disabled).attr('aria-disabled', disabled);
        if ($wrapper.length) {
            $wrapper.toggleClass('toggle-disabled', disabled).attr('aria-disabled', disabled);
        }
    }
}

function getEstimatedRecipientCount() {
    // DEPRECATED: This function now delegates to getRecipientCount()
    // Kept for backward compatibility only
    // SINGLE SOURCE OF TRUTH: window.recipients array
    return getRecipientCount();
}

function getMandatorySignatureCountEstimate(totalRecipients) {
    // DEPRECATED: This function now delegates to getMandatoryRecipientCount()
    // Kept for backward compatibility only
    // SINGLE SOURCE OF TRUTH: window.recipients array with mandatory property
    return getMandatoryRecipientCount();
}

function updateRequiredSignatureState(options) {
    // DEPRECATED: This function now delegates to updateRecipientCountLabel()
    // Kept for backward compatibility with existing code
    // SINGLE SOURCE OF TRUTH: window.recipients array

    const totalCount = getRecipientCount();
    const mandatoryCount = getMandatoryRecipientCount();

    // Update global variable for backward compatibility
    numberofsignatures = mandatoryCount;
    if (typeof PerpareDocumentContext === 'object' && PerpareDocumentContext !== null) {
        PerpareDocumentContext.signaturesRequiredCount = mandatoryCount;
    }

    // Update the hidden input to reflect derived value
    const $input = $(REQUIRED_SIGNATURE_SELECTORS.input);
    if ($input.length) {
        $input.val(mandatoryCount);
    }

    return {
        value: mandatoryCount,
        min: 0,
        max: totalCount,
        visible: true
    };
}

function validateNoOfSignatures(showErrors) {
    // DEPRECATED: Required signatures are now derived from window.recipients
    // This function always returns true since the value is derived, not user-entered
    // Kept for backward compatibility
    return true;
}

function bindRequiredSignatureInputHandlers() {
    // DEPRECATED: Required signatures are now derived from window.recipients
    // Input handlers are no longer needed for the hidden input
    // The inline badge editor uses setMinRequiredSignatures() which updates recipients
    return;
}

if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
}
if (typeof window !== 'undefined') {
    window.pdfContainer = pdfContainer;
    window.scrollContainer = scrollContainer;
    window.PerpareDocumentContext = PerpareDocumentContext;
}

window.toggleMoreOptions = function (id) {
    let allMoreOptions = document.querySelectorAll('[id^="moreOptions_"]');
    let allButtons = document.querySelectorAll('[id^="moreOptionsBtn_"] i');

    // Hide all other dropdowns and reset their parent rows
    allMoreOptions.forEach((div) => {
        const rowId = div.id.replace('moreOptions_', '');
        const row = document.getElementById(rowId);
        if (rowId !== id.toString()) {
            div.style.display = "none";
            row.classList.remove('more-options-open');
        }
    });

    // Reset all buttons (set to down arrow)
    allButtons.forEach((icon) => {
        icon.classList.remove("fa-angle-double-up");
        icon.classList.add("fa-angle-double-down");
    });

    const moreOptionsDiv = document.getElementById(`moreOptions_${id}`);
    const buttonIcon = document.querySelector(`#moreOptionsBtn_${id} i`);
    const currentRow = document.getElementById(`${id}`);

    if (moreOptionsDiv.style.display === "none" || moreOptionsDiv.style.display === "") {
        moreOptionsDiv.style.display = "block";
        currentRow.classList.add('more-options-open');
        buttonIcon.classList.remove("fa-angle-double-down");
        buttonIcon.classList.add("fa-angle-double-up");
        setTimeout(() => {
            document.addEventListener("click", outsideClickListener);
        }, 0);
    } else {
        moreOptionsDiv.style.display = "none";
        currentRow.classList.remove('more-options-open');
        buttonIcon.classList.remove("fa-angle-double-up");
        buttonIcon.classList.add("fa-angle-double-down");

        document.removeEventListener("click", outsideClickListener);
    }

    function outsideClickListener(event) {
        if (!moreOptionsDiv.contains(event.target) && !event.target.closest(`#moreOptionsBtn_${id}`)) {
            moreOptionsDiv.style.display = "none";
            currentRow.classList.remove('more-options-open');
            buttonIcon.classList.remove("fa-angle-double-up");
            buttonIcon.classList.add("fa-angle-double-down");

            // Remove event listener after closing
            document.removeEventListener("click", outsideClickListener);
        }
    }
}

function getDesktopRecipientDiv() {
    var esealcheckbox = $(".esealCheckBox").prop("checked");
    var esealDisplay = esealcheckbox ? 'flex' : 'none';
    var initialCheckbox = $(".initialCheckBox").prop("checked");
    var initialDisplay = initialCheckbox ? 'flex' : 'none';
    var addSignatoriesIsChecked = $('#addSignatoriesCheckbox').prop('checked');
    if (addSignatoriesIsChecked) {
        return `
                                                                                                                                                                                                                                                                                                                <div class="row recp desktop-version" id="0">
                                                                                                                                                                                                                                                                                                      <div class="col-md-12">
                                                                                                                                                                                                                                                                                                          <div class="row">
                                                                                                                                                                                                                                                                                                              <div class="col-md-1 margin"><input maxlength="4" pattern="[0-9]{1,4}" class="orderId" style="width: 50px;text-align:end;" readonly="" type="number" data-val="true" data-val-required="The Order field is required." id="RecpientList_0__Order" name="RecpientList[0].Order" value="1"></div>
                                                                                                                                                                                                                                                                                                              <div class="col-md-3 margin">
                                                                                                                                                                                                                                                                                                                  <input class="form-control email" type="text" data-val="true" data-val-regex="Please enter valid email" data-val-required="The Email field is required." id="RecpientList_0__Email" name="RecpientList[0].Email" value="" autocomplete="off" placeholder='E-Mail'>
                                                                                                                                                                                                                                                                                                                  <span class="text-danger classshide" style='text-align: center;font-size: 15px;position:absolute;'>Please enter valid E-Mail address</span>
                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                              <div class="col-md-2 margin organizationDropdown">
                                                                                                                                                                                                                                                                                                                  <div class="selctloader">
                                                                                                                                                                                                                                                                                                                      <select class="dropdown organizationDropdownSelect" id="organizationDropdown_0" onchange="handleOrganizationSelection(event,0)" style="background-color: #acc43d; width:173px; padding: 2px; border-radius: 5px; margin-right: 13px; height: 34px;">
                                                                                                                                                                                                                                                                                                                          <option>Choose Account</option>
                                                                                                                                                                                                                                                                                                                      </select>
                                                                                                                                                                                                                                                                                                                      <div class="loader" style="display: none;height: 18px !important; margin-left: -7px !important;">
                                                                                                                                                                                                                                                                                                                                          <img  src="${appBaseUrl}img/icon/loaderGif.gif">
                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                                                                                              </div>

                                                                                                                                                                                                                                                                                                                      <div class="col-md-2 margin classshide settingsButtonLi" id="settingsButtonLi" style="padding: 0px 20px;">
                                                                                                                                                                                                                                                                                                                  <button type="button" class="btn btn-outline-primary ml-3 settings-form-elements" id="settings" style="font-size:15px !important;">
                                                                                                                                                                                                                                                                                                                      <i class="fa fa-cog" style="color:white;"></i> <!-- cogs icon -->
                                                                                                                                                                                                                                                                                                                  </button>
                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                                      <div class="col-md-1 esealcheck margin" style="padding: 0px; display: ${esealDisplay};align-items:center;">
                                                                                                                                                                                                                                                                                                                  <label for='RecpientList_" + id + "__Eseal' class="form-check-label" style="font-size: 14px !important; ">Eseal :</label>
                                                                                                                                                                                                                                                                                                                  <input style="width: 25px; height: 14px;" type="checkbox" data-val-required="The Order field is required." id="RecpientList_0__Eseal" onchange="esealUserCheckBox(0)" name="RecpientList[0].Eseal" value="1">
                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                              <div class="col-md-1 initialcheck margin" style="padding: 0px; display: ${initialDisplay};">
                                                                                                                                                                                                                                                                                                                  <label for='RecpientList_" + id + "__Initial' class="form-check-label" style="font-size: 14px !important; ">Initial :</label>
                                                                                                                                                                                                                                                                                                                  <input class="allInitial-checkbox" style="width: 25px; height: 14px;" type="checkbox" data-val-required="The Order field is required." id="RecpientList_0__Initial" onchange="initialCheckBox(0)" name="RecpientList[0].Initial" value="1">
                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                              <div class="col-md-2 margin">
                                                                                                                                                                                                                                                                                                                  <button type="button" onclick="deleteRecipient(this)" id="btnRemove_0" class="btn btn-danger del classshide" style="font-size:15px !important;"><i class="fa fa-minus" aria-hidden="true"></i></button>
                                                                                                                                                                                                                                                                                                                  <button type="button" onclick="addRecipient(this)" id="btnadd_0" class="btn btn-primary text-center org-pluse-button add" style="font-size:15px !important;"><i class="fa fa-plus-circle" aria-hidden="true"></i></button>
                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                          </div>
                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                  </div>

                                                                                                                                                                                                                                                                                                    `;
    }
    else {
        return `
                                                                                                                                                                                                                                                                                                                <div class="row recp classshide desktop-version" id="0">
                                                                                                                                                                                                                                                                                                      <div class="col-md-12">
                                                                                                                                                                                                                                                                                                          <div class="row">
                                                                                                                                                                                                                                                                                                              <div class="col-md-1 margin"><input maxlength="4" pattern="[0-9]{1,4}" class="orderId" style="width: 50px;text-align:end;" readonly="" type="number" data-val="true" data-val-required="The Order field is required." id="RecpientList_0__Order" name="RecpientList[0].Order" value="1"></div>
                                                                                                                                                                                                                                                                                                              <div class="col-md-3 margin">
                                                                                                                                                                                                                                                                                                                  <input class="form-control email" type="text" data-val="true" data-val-regex="Please enter valid email" data-val-required="The Email field is required." id="RecpientList_0__Email" name="RecpientList[0].Email" value="" autocomplete="off" placeholder='E-Mail'>
                                                                                                                                                                                                                                                                                                                          <span class="text-danger classshide" style='text-align: center;font-size: 15px;position:absolute;'>Please enter valid E-Mail address</span>
                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                              <div class="col-md-2 margin organizationDropdown">
                                                                                                                                                                                                                                                                                                                  <div class="selctloader">
                                                                                                                                                                                                                                                                                                                      <select class="dropdown organizationDropdownSelect" id="organizationDropdown_0" onchange="handleOrganizationSelection(event,0)" style="background-color: #acc43d; width:173px; padding: 2px; border-radius: 5px; margin-right: 13px; height: 34px;">
                                                                                                                                                                                                                                                                                                                          <option>Choose Account</option>
                                                                                                                                                                                                                                                                                                                      </select>
                                                                                                                                                                                                                                                                                                                      <div class="loader" style="display: none;height: 18px !important; margin-left: -7px !important;">
                                                                                                                                                                                                                                                                                                                                  <img  src="${appBaseUrl}img/icon/loaderGif.gif">
                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                                                                                              </div>

                                                                                                                                                                                                                                                                                                              <div class="col-md-2 margin classshide settingsButtonLi" id="settingsButtonLi" style="padding: 0px 20px;">
                                                                                                                                                                                                                                                                                                                  <button type="button" class="btn btn-outline-primary ml-3 settings-form-elements" id="settings" style="font-size:15px !important;">
                                                                                                                                                                                                                                                                                                                      <i class="fa fa-cog" style="color:white;"></i> <!-- cogs icon -->
                                                                                                                                                                                                                                                                                                                  </button>
                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                                      <div class="col-md-1 esealcheck margin" style="padding: 0px; display: ${esealDisplay};align-items:center;">
                                                                                                                                                                                                                                                                                                                  <label for='RecpientList_" + id + "__Eseal' class="form-check-label" style="font-size: 14px !important; ">Eseal :</label>
                                                                                                                                                                                                                                                                                                                  <input style="width: 25px; height: 14px;" type="checkbox" data-val-required="The Order field is required." id="RecpientList_0__Eseal" onchange="esealUserCheckBox(0)" name="RecpientList[0].Eseal" value="1">
                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                                      <div class="col-md-1 initialcheck margin" style="padding: 0px; display: ${initialDisplay};">
                                                                                                                                                                                                                                                                                                                  <label for='RecpientList_" + id + "__Initial' class="form-check-label" style="font-size: 14px !important; ">Initial :</label>
                                                                                                                                                                                                                                                                                                                  <input class="allInitial-checkbox" style="width: 25px; height: 14px;" type="checkbox" data-val-required="The Order field is required." id="RecpientList_0__Initial" onchange="initialCheckBox(0)" name="RecpientList[0].Initial" value="1">
                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                              <div class="col-md-2 margin">
                                                                                                                                                                                                                                                                                                                  <button type="button" onclick="deleteRecipient(this)" id="btnRemove_0" class="btn btn-danger del classshide" style="font-size:15px !important;"><i class="fa fa-minus" aria-hidden="true"></i></button>
                                                                                                                                                                                                                                                                                                                  <button type="button" onclick="addRecipient(this)" id="btnadd_0" class="btn btn-primary text-center org-pluse-button add" style="font-size:15px !important;"><i class="fa fa-plus-circle" aria-hidden="true"></i></button>
                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                          </div>
                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                  </div>

                                                                                                                                                                                                                                                                                                    `;
    }

}


function getMobileRecipientDiv() {
    var esealcheckbox = $(".esealCheckBox").prop("checked");
    var esealDisplay = esealcheckbox ? 'flex' : 'none';
    var initialCheckbox = $(".initialCheckBox").prop("checked");
    var initialDisplay = initialCheckbox ? 'flex' : 'none';
    var addSignatoriesIsChecked = $('#addSignatoriesCheckbox').prop('checked');
    if (addSignatoriesIsChecked) {
        return `
                                                                                                                                                                                                                                                                                                           <div class="row recp mobile-version" id="0">
                                                                                                                                                                                                                                                                                                      <div class="col-md-12">
                                                                                                                                                                                                                                                                                                          <div class="row align-items-center">
                                                                                                                                                                                                                                                                                                              <!-- Order Input -->
                                                                                                                                                                                                                                                                                                                      <div class="col-1 margin" style="margin-right:17px;">
                                                                                                                                                                                                                                                                                                                  <input maxlength="4" pattern="[0-9]{1,4}" class="orderId" style="width: 50px;text-align:end;" readonly="" type="number" data-val="true" data-val-required="The Order field is required." id="RecpientList_0__Order" name="RecpientList[0].Order" value="1">
                                                                                                                                                                                                                                                                                                              </div>

                                                                                                                                                                                                                                                                                                              <!-- Email Input -->
                                                                                                                                                                                                                                                                                                              <div class="col-md-4 margin" style="padding-left:0px;padding-right:0px;margin-right:10px;" id="mobileEmailInput">
                                                                                                                                                                                                                                                                                                                  <input class="form-control emailinputfield email" type="text" data-val="true" data-val-regex="Please enter valid email" data-val-required="The Email field is required."  id="RecpientList_0__Email" name="RecpientList[0].Email" value="" autocomplete="off" placeholder='E-Mail' style="width:none !important;">
                                                                                                                                                                                                                                                                                                                          <span class="text-danger classshide" style="text-align: center;font-size: 10px;position:absolute;">Please enter valid E-Mail address</span>

                                                                                                                                                                                                                                                                                                                  <!-- More Options Dropdown (Hidden Initially) -->
                                                                                                                                                                                                                                                                                                                          <div class="more-options-section dropdown-content mt-2" id="moreOptions_0" style="display: none; position: absolute; background: rgba(0,0,0,0.1); border: 1px solid #ccc; padding: 10px;box-shadow: 0px 4px 6px rgba(0,0,0,0.5); z-index: 1000;max-height:100px;overflow-y:auto;">
                                                                                                                                                                                                                                                                                                                      <!-- Organization Dropdown -->
                                                                                                                                                                                                                                                                                                                      <div class="margin organizationDropdown">
                                                                                                                                                                                                                                                                                                                          <div class="selctloader">
                                                                                                                                                                                                                                                                                                                              <select class="dropdown organizationDropdownSelect" id="organizationDropdown_0" onchange="handleOrganizationSelection(event,0)" style="background-color: #acc43d; width:100%; padding: 5px; border-radius: 5px;">
                                                                                                                                                                                                                                                                                                                                  <option>Choose Account</option>
                                                                                                                                                                                                                                                                                                                              </select>
                                                                                                                                                                                                                                                                                                                              <div class="loader" style="display: none;height: 18px !important;">
                                                                                                                                                                                                                                                                                                                                          <img  src="${appBaseUrl}img/icon/mobileloaderGif.gif">
                                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                                          </div>
                                                                                                                                                                                                                                                                                                                      </div>

                                                                                                                                                                                                                                                                                                                      <!-- Eseal Checkbox -->
                                                                                                                                                                                                                                                                                                                      <div class="esealcheck margin" style="padding: 0px; display: ${esealDisplay}; align-items:center;">
                                                                                                                                                                                                                                                                                                                          <label for='RecpientList_0__Eseal' class="form-check-label" style="font-size: 17px !important;">Eseal :</label>
                                                                                                                                                                                                                                                                                                                          <input style="width: 25px; height: 19px;margin-left:87px;" type="checkbox" data-val-required="The Order field is required." id="RecpientList_0__Eseal" onchange="esealUserCheckBox(0)" name="RecpientList[0].Eseal" value="1">
                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                      <!-- Initial Checkbox -->
                                                                                                                                                                                                                                                                                                                      <div class="initialcheck margin" style="padding: 0px; display: ${initialDisplay}; align-items:center;">
                                                                                                                                                                                                                                                                                                                          <label for='RecpientList_0__Initial' class="form-check-label" style="font-size: 17px !important;">Initial :</label>
                                                                                                                                                                                                                                                                                                                          <input style="width: 25px; height: 19px;margin-left:90px;" type="checkbox" data-val-required="The Order field is required." id="RecpientList_0__Initial" onchange="initialCheckBox(0)" name="RecpientList[0].Initial" value="1">
                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                       <!-- Settings Button -->
                                                                                                                                                                                                                                                                                                                      <div class="margin classshide settingsButtonLi"  id="settingsButtonLi" style="padding: 10px 0;white-space:nowrap;">
                                                                                                                                                                                                                                                                                                                                    <label style="font-size:17px !important">Setting :</label>
                                                                                                                                                                                                                                                                                                                          <button type="button" class="btn btn-outline-primary ml-3 settings-form-elements" id="settings" style="font-size:15px !important;width:25% !important;margin-left:81px !important;">
                                                                                                                                                                                                                                                                                                                              <i class="fa fa-cog" style="color:white;"></i>
                                                                                                                                                                                                                                                                                                                          </button>
                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                                                                                              </div>

                                                                                                                                                                                                                                                                                                              <!-- More Options Button -->
                                                                                                                                                                                                                                                                                                              <div class="col-md-1 col-1 margin text-center" style="padding-left:0px;padding-right:0px;margin-right:10px;">
                                                                                                                                                                                                                                                                                                                    <button type="button" id="moreOptionsBtn_0" class="btn btn-outline-secondary more-options-btn"
                                                                                                                                                                                                                                                                                                                                    onclick="toggleMoreOptions(0)" style="background:#acc43d;font-size:12px !important;">
                                                                                                                                                                                                                                                                                                                                <i class="fa fa-angle-double-down" style="font-size:10px;margin-bottom:3px;"></i>
                                                                                                                                                                                                                                                                                                                    </button>
                                                                                                                                                                                                                                                                                                                </div>

                                                                                                                                                                                                                                                                                                              <!-- Add & Remove Buttons -->
                                                                                                                                                                                                                                                                                                              <div class="col-md-1 col-1 margin text-center" style="padding-left:0px;padding-right:0px;margin-right:10px;">
                                                                                                                                                                                                                                                                                                                  <button type="button" onclick="deleteRecipient(this)" id="btnRemove_0" class="btn btn-danger del classshide" style="font-size:12px !important;"><i class="fa fa-minus" style="font-size:10px;margin-bottom:3px;" aria-hidden="true"></i></button>
                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                                      <div class="col-md-1 col-1 margin text-center" style="padding-left:0px;padding-right:0px;">
                                                                                                                                                                                                                                                                                                                          <button type="button" onclick="addRecipient(this)" id="btnadd_0" class="btn btn-primary text-center org-pluse-button add" style="font-size:12px !important;"><i class="fa fa-plus-circle" style="font-size:10px;margin-bottom:3px;" aria-hidden="true"></i></button>

                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                          </div>
                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                  </div>

                                                                                                                                                                                                                                                                                                            `;
    }
    else {
        return `
                                                                                                                                                                                                                                                                                                           <div class="row recp classshide mobile-version" id="0">
                                                                                                                                                                                                                                                                                                      <div class="col-md-12">
                                                                                                                                                                                                                                                                                                          <div class="row align-items-center">
                                                                                                                                                                                                                                                                                                              <!-- Order Input -->
                                                                                                                                                                                                                                                                                                              <div class="col-1 margin" style="margin-right:17px;">
                                                                                                                                                                                                                                                                                                                  <input maxlength="4" pattern="[0-9]{1,4}" class="orderId" style="width: 50px;text-align:end;" readonly="" type="number" data-val="true" data-val-required="The Order field is required." id="RecpientList_0__Order" name="RecpientList[0].Order" value="1">
                                                                                                                                                                                                                                                                                                              </div>

                                                                                                                                                                                                                                                                                                              <!-- Email Input -->
                                                                                                                                                                                                                                                                                                              <!-- Email Input -->
                                                                                                                                                                                                                                                                                                                      <div class="col-md-4 margin" style="padding-left:0px;padding-right:0px;margin-right:10px;" id="mobileEmailInput">
                                                                                                                                                                                                                                                                                                                          <input class="form-control emailinputfield email" type="text" data-val="true" data-val-regex="Please enter valid email" data-val-required="The Email field is required." id="RecpientList_0__Email" name="RecpientList[0].Email" value="" autocomplete="off" placeholder='E-Mail' style="width:none !important;">
                                                                                                                                                                                                                                                                                                                          <span class="text-danger classshide" style="text-align: center;font-size: 10px;position:absolute;">Please enter valid E-Mail address</span>

                                                                                                                                                                                                                                                                                                                  <!-- More Options Dropdown (Hidden Initially) -->
                                                                                                                                                                                                                                                                                                                                  <div class="more-options-section dropdown-content mt-2" id="moreOptions_0" style="display: none; position: absolute; background: rgba(0,0,0,0.1); border: 1px solid #ccc; padding: 10px;box-shadow: 0px 4px 6px rgba(0,0,0,0.5); z-index: 1000;max-height:100px;overflow-y:auto;">
                                                                                                                                                                                                                                                                                                                      <!-- Organization Dropdown -->
                                                                                                                                                                                                                                                                                                                      <div class="margin organizationDropdown">
                                                                                                                                                                                                                                                                                                                          <div class="selctloader">
                                                                                                                                                                                                                                                                                                                              <select class="dropdown organizationDropdownSelect" id="organizationDropdown_0" onchange="handleOrganizationSelection(event,0)" style="background-color: #acc43d; width:100%; padding: 5px; border-radius: 5px;">
                                                                                                                                                                                                                                                                                                                                  <option>Choose Account</option>
                                                                                                                                                                                                                                                                                                                              </select>
                                                                                                                                                                                                                                                                                                                              <div class="loader" style="display: none;height: 18px !important;">
                                                                                                                                                                                                                                                                                                                                          <img  src="${appBaseUrl}img/icon/mobileloaderGif.gif">
                                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                                          </div>
                                                                                                                                                                                                                                                                                                                      </div>


                                                                                                                                                                                                                                                                                                                      <!-- Eseal Checkbox -->
                                                                                                                                                                                                                                                                                                                      <div class="esealcheck margin" style="padding: 0px; display: flex; align-items:center;">
                                                                                                                                                                                                                                                                                                                          <label for='RecpientList_0__Eseal' class="form-check-label" style="font-size: 17px !important;">Eseal :</label>
                                                                                                                                                                                                                                                                                                                          <input style="width: 25px; height: 19px;margin-left:87px;" type="checkbox" data-val-required="The Order field is required." id="RecpientList_0__Eseal" onchange="esealUserCheckBox(0)" name="RecpientList[0].Eseal" value="1">
                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                      <!-- Initial Checkbox -->
                                                                                                                                                                                                                                                                                                                              <div class="initialcheck margin" style="padding: 0px; display: ${initialDisplay}; align-items:center;">
                                                                                                                                                                                                                                                                                                                          <label for='RecpientList_0__Initial' class="form-check-label" style="font-size: 17px !important;">Initial :</label>
                                                                                                                                                                                                                                                                                                                          <input style="width: 25px; height: 19px;margin-left:90px;" type="checkbox" data-val-required="The Order field is required." id="RecpientList_0__Initial" onchange="initialCheckBox(0)" name="RecpientList[0].Initial" value="1">
                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                                <!-- Settings Button -->
                                                                                                                                                                                                                                                                                                                                              <div class="margin classshide settingsButtonLi" id=""settingsButtonLi style="padding: 10px 0;white-space:nowrap;">
                                                                                                                                                                                                                                                                                                                                    <label style="font-size:17px !important;">Setting :</label>
                                                                                                                                                                                                                                                                                                                                                          <button type="button" class="btn btn-outline-primary ml-3 settings-form-elements" id="settings" style="font-size:15px !important;width:25% !important;margin-left:81px !important;">
                                                                                                                                                                                                                                                                                                                                      <i class="fa fa-cog" style="color:white;"></i>
                                                                                                                                                                                                                                                                                                                                  </button>
                                                                                                                                                                                                                                                                                                                              </div>

                                                                                                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                                                                                              </div>

                                                                                                                                                                                                                                                                                                              <!-- More Options Button -->
                                                                                                                                                                                                                                                                                                                     <div class="col-md-1 col-1 margin text-center" style="padding-left:0px;padding-right:0px;margin-right:10px;">
                                                                                                                                                                                                                                                                                                                        <button type="button" id="moreOptionsBtn_0" class="btn btn-outline-secondary more-options-btn"
                                                                                                                                                                                                                                                                                                                                onclick="toggleMoreOptions(0)" style="background:#acc43d;font-size:12px !important;">
                                                                                                                                                                                                                                                                                                                                            <i class="fa fa-angle-double-down" style="font-size:10px;margin-bottom:3px;" ></i>
                                                                                                                                                                                                                                                                                                                        </button>
                                                                                                                                                                                                                                                                                                                    </div>

                                                                                                                                                                                                                                                                                                              <!-- Add & Remove Buttons -->
                                                                                                                                                                                                                                                                                                              <div class="col-md-1 col-1 margin text-center" style="padding-left:0px;padding-right:0px;margin-right:10px;">
                                                                                                                                                                                                                                                                                                                  <button type="button" onclick="deleteRecipient(this)" id="btnRemove_0" class="btn btn-danger del classshide" style="font-size:12px !important;"><i class="fa fa-minus" style="font-size:10px !important;margin-bottom:3px;" aria-hidden="true"></i></button>
                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                                      <div class="col-md-1 col-1 margin text-center" style="padding-left:0px;padding-right:0px;">
                                                                                                                                                                                                                                                                                                                          <button type="button" onclick="addRecipient(this)" id="btnadd_0" class="btn btn-primary text-center org-pluse-button add" style="font-size:12px !important;"><i class="fa fa-plus-circle" style="font-size:10px !important;margin-bottom:3px;" aria-hidden="true"></i></button>

                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                          </div>
                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                  </div>

                                                                                                                                                                                                                                                                                                            `;
    }

}


function handleResponsiveLayout() {
    if (isModernRecipientLayoutActive()) {
        return;
    }
    const isMobile = $(window).width() < 768;
    const $cards = $("#recplist .recp");
    if (!$cards.length) {
        return;
    }
    $cards.toggleClass('mobile-version', isMobile);
    $cards.toggleClass('desktop-version', !isMobile);
}


window.addEventListener("resize", function () {

    let rowContainer = document.getElementById('fieldsRecpRpw');
    let rowContainer2 = document.getElementById('emailList');
    let sidebarIcon1 = document.querySelector('#sidebarCollapse1 i');
    let sidebarIcon2 = document.querySelector('#sidebarCollapse2 i');
    var hhjj = $(window).width();
    if ($(window).width() >= 768) {
        rowContainer.setAttribute("style", "display: flex !important;");
        rowContainer2.setAttribute("style", "display: block !important;");
    }
    else if ($(window).width() < 768) {
        rowContainer.setAttribute("style", "display: none !important;");
        rowContainer2.setAttribute("style", "display: none !important;");
        sidebarIcon1.classList.remove("fa-angle-double-up");
        sidebarIcon1.classList.add("fa-angle-double-down");
        sidebarIcon2.classList.remove("fa-angle-double-up");
        sidebarIcon2.classList.add("fa-angle-double-down");

    }


    let viewerelementdiv = document.getElementById('viewerdivtag');
    let fieldselementdiv = document.getElementById('fieldsdivtag');
    if ($(window).width() >= 768) {
        // Remove classes separately
        fieldselementdiv.setAttribute('style', "width:none;");
        viewerelementdiv.setAttribute('style', "height:100%; !important;");
    } else if ($(window).width() < 768) {
        viewerelementdiv.setAttribute('style', "height:81% !important;");
        //viewerelementdiv.style.height = '81%';
        fieldselementdiv.setAttribute('style', 'width:100%;');
    }
    if (!isModernRecipientLayoutActive()) {
        handleResponsiveLayout();
    }
});

const ACCOUNT_TYPE_INPUT_ID = 'accountTypeHidden';
const SEQUENTIAL_TOGGLE_ID = 'sequentialSigning';
const MULTI_SIGN_OPTION_SELECTOR = '.multi-sign-only';
const MODERN_RECIPIENT_LAYOUT = document.getElementById('recipientsList') !== null;

function resolveLoginAccountType() {
    if (typeof loginuserAccount !== 'undefined' && loginuserAccount) {
        return loginuserAccount;
    }
    const hiddenField = document.getElementById(ACCOUNT_TYPE_INPUT_ID);
    if (hiddenField && hiddenField.value) {
        return hiddenField.value;
    }
    if (document.body && document.body.getAttribute('data-account-type')) {
        return document.body.getAttribute('data-account-type');
    }
    return 'Self';
}

function applyAccountTypeVisibility() {
    const accountType = resolveLoginAccountType();
    window.loginuserAccount = accountType;
    const isSelf = (accountType || '').toLowerCase() === 'self';

    const $initialReq = $('#InitialReq');
    const $esealReq = $('#EsealReq');
    const $qrReq = $('#QrCodeReq');
    const $templateSelectDiv = $('#templateSelectdiv');

    if ($initialReq.length) {
        $initialReq.css('display', isSelf ? 'none' : 'flex');
    }
    if ($esealReq.length) {
        $esealReq.css('display', isSelf ? 'none' : 'flex');
    }
    if ($qrReq.length) {
        $qrReq.css('display', isSelf ? 'none' : 'flex');
    }
    if ($templateSelectDiv.length) {
        $templateSelectDiv.css('display', isSelf ? 'none' : 'flex');
    }

    if (isSelf) {
        $('#InitialRequired, #Eseal_Required, #QrCodeRequired').prop('checked', false);
    }
}

function getDisableOrderFlag() {
    const legacyCheckbox = document.getElementById('DiasbleOrder');
    if (legacyCheckbox) {
        return legacyCheckbox.checked;
    }
    const sequentialToggle = document.getElementById(SEQUENTIAL_TOGGLE_ID);
    if (sequentialToggle) {
        return !sequentialToggle.checked;
    }
    return false;
}

function syncSequentialSigningState() {
    const disableOrder = getDisableOrderFlag();
    if (typeof PerpareDocumentContext === 'object' && PerpareDocumentContext !== null) {
        PerpareDocumentContext.disableOrder = disableOrder;
    }
}

function isModernRecipientLayoutActive() {
    return MODERN_RECIPIENT_LAYOUT === true;
}

function updateMultiSignOptionVisibility() {
    // Workflow controls visibility is now managed by updateWorkflowMode()
    // This function is kept for backwards compatibility but is no longer needed
    return;
}

function applyAddSignatoriesState(isEnabled) {
    const multiEnabled = !!isEnabled;
    const esealcheckbox = $(".esealCheckBox").prop("checked");
    const $recipientWrapper = $('#recplist');
    const $recipientList = $('#recipientsList');
    const $signatorySection = $('#signatorySection');

    syncAllSignersToggleDisabledState(!multiEnabled);

    if (!esealcheckbox) {
        $(".esealcheck").hide();
    }

    if (multiEnabled) {
        $recipientWrapper.removeClass('classshide');
        $recipientList.removeClass('classshide');
        $signatorySection.removeClass('signatory-disabled');
        if (loginuserAccount == 'Self') {
            $('#templateSelectdiv').css('display', 'flex');
        }
        if (typeof renderRecipientCards === 'function') {
            renderRecipientCards({ preserveFocus: true });
        }
    } else {
        $('#AllSignatoriesRequired').prop('checked', true).trigger('change');
        $('#RequiredSignatureNo').css('display', 'none');
        $recipientList.addClass('classshide');
        $recipientWrapper.addClass('classshide');
        $signatorySection.addClass('signatory-disabled');

        if (loginuserAccount != 'Self') {
            $('#QrCodeReq').css('display', 'flex');
        } else {
            document.getElementById('templateSelect').selectedIndex = 0;
            $('#templateSelectdiv').css('display', 'none');
        }

        $(".settingsButtonLi").addClass("classshide");
        if (typeof resetRecipientCards === 'function') {
            resetRecipientCards();
        }
    }

    updateMultiSignOptionVisibility();
    updateRequiredSignatureState({ force: true });
    updateQuickSignVisibility();
}

$(function () {
    applyAccountTypeVisibility();

    if (typeof toggleInitialVisibility === 'function') {
        toggleInitialVisibility();
    }
    if (typeof toggleQRCODEVisibility === 'function') {
        toggleQRCODEVisibility();
    }

    bindRequiredSignatureInputHandlers();
    updateRequiredSignatureState({ force: true });
    syncAllSignersToggleDisabledState(!$('#addSignatoriesCheckbox').is(':checked'));

    const $sequentialToggle = $('#' + SEQUENTIAL_TOGGLE_ID);
    if ($sequentialToggle.length) {
        $sequentialToggle.on('change', function () {
            syncSequentialSigningState();
        });
        syncSequentialSigningState();
    }

    const $templateSelect = $('#templateSelect');
    if ($templateSelect.length) {
        $templateSelect.on('change', function () {
            if (typeof signature_img !== 'undefined') {
                signature_img = "";
            } else {
                window.signature_img = "";
            }
        });
    }

    const $previewButton = $('#innerModel');
    if ($previewButton.length) {
        $previewButton.on('click', function (event) {
            event.preventDefault();
            if (typeof ImagePreview === 'function') {
                ImagePreview();
            }
        });
    }

    const $qrDataButton = $('#qrcodeDataBtn');
    if ($qrDataButton.length) {
        $qrDataButton.on('click', function (event) {
            event.preventDefault();
            if (typeof QrcodeData === 'function') {
                QrcodeData();
            }
        });
    }

    // Watermark Set button click handler
    const $watermarkSetBtn = $('#setwatermarkid');
    if ($watermarkSetBtn.length) {
        $watermarkSetBtn.off('click.watermark').on('click.watermark', function (event) {
            event.preventDefault();
            if (typeof setWatermark === 'function') {
                setWatermark();
                const text = $('#watermark-field').val().trim();
                if (text) {
                    toastr.success('Watermark applied successfully');
                } else {
                    toastr.info('Watermark cleared');
                }
            }
        });
    }

    const $addRecipientButton = $('#addRecipientBtn');
    if ($addRecipientButton.length) {
        $addRecipientButton.off('click.multiRecipients').on('click.multiRecipients', function (event) {
            event.preventDefault();
            if (typeof window.addRecipient === 'function') {
                window.addRecipient();
                return;
            }
            if (!$('#addSignatoriesCheckbox').is(':checked')) {
                $('#addSignatoriesCheckbox').prop('checked', true).trigger('change');
            }
            addRecipientCard();
        });
    }

    initializeSigningMode();
    initializeRecipientCards();
    updateMultiSignOptionVisibility();
    updateQuickSignVisibility();
    updateContinueButtonLabel();
});


// add signatories checkbox onchange functionality
$('#addSignatoriesCheckbox').off('change.multiSignCheckbox').on('change.multiSignCheckbox', function () {
    const isEnabled = $(this).is(":checked");
    applyAddSignatoriesState(isEnabled);
    // Update all displays from single source of truth
    updateRecipientCountLabel();
});

//qrcode data funtcionality
function QrcodeData() {
    $('#Qrcode_Modal').show();
}

function QrcodeOkButton() {
    var entityname_value = $('#entityname').val();
    var serialnumber_value = $('#serialnumber').val();


    if (entityname_value === "" || serialnumber_value === "") {
        // showCustomAlert("please fill both fields");
        toastr.error('please fill both fields');
        return false;
    } else {
        serialnumber = serialnumber_value;
        entityname = entityname_value;
        faceRequired = $('#faceVerification').prop('checked');
        console.log(entityname_value);
        console.log(serialnumber_value);
        $('#Qrcode_Modal').hide();
    }

}

function QrcodeCloseButton() {
    $('#entityname').val('');
    $('#serialnumber').val('');
    serialnumber = '';
    entityname = '';
    $('#faceVerification').prop('checked', false);
    $('#Qrcode_Modal').hide();
}
//qrcodeData ///////




function sendEmailToGetThumbnail(email) {

    $.ajax({
        type: "POST",
        url: OrgDetailsByEmail,
        data: {
            email: email
        },

        success: function (response) {
            // Handle the success response from the server
            console.log('Email sent successfully:', response);
            var userdetails = response.userProfile;
            loginUserDetails.push(userdetails); // Pass the userdetails back to the callback function
        },

        error: ajaxErrorHandler
    });
}





$("#recplist").on("click", function (event) {
    // Get the modal ID from some variable or event
    console.log(event.id);

});
setTimeout(function () {
    $(".toolcontainer1").addClass("classshide");
}, 5000);








$(".esealCheckBox").change(function () {
    if ($(this).is(":checked")) {
        $(".esealcheck").show(); // Show the checkbox if the first checkbox is checked
    } else {
        $(".esealcheck").hide(); // Hide the checkbox if the first checkbox is unchecked
    }
});


$(".initialCheckBox").change(function () {
    if ($(this).is(":checked")) {
        $(".initialcheck").show(); // Show the checkbox if the first checkbox is checked
    } else {
        $(".initialcheck").hide(); // Hide the checkbox if the first checkbox is unchecked
    }
});
$(document).ready(function () {
    $("#settings_Modal").hide();
    var esealcheckbox = $(".esealCheckBox").prop("checked");
    if (esealcheckbox) {
        $(".esealcheck").show();
    } else {
        $(".esealcheck").hide();
    }
    var initialcheckbox = $(".initialCheckBox").prop("checked");
    if (initialcheckbox) {
        $(".initialcheck").show();
    } else {
        $(".initialcheck").hide();
    }
    getFileConfiguration();

    $('#gobackbtn, #cancelbtn').on('click', function () {
        closeCustomModal();
    });

    // Initialize workflow mode on page load
    if (typeof updateWorkflowMode === 'function') {
        updateWorkflowMode();
    }

    $("#Save").on("click", function () {
        Save1();
    });
    $("#Send").on("click", function () {
        Save1();
    });

    $('#clearButton').on('click', function () {
        CloseButton();
    });
});

function getFileConfiguration() {
    $.ajax({
        type: 'GET',
        url: GetFileConfigurationUrl,
        success: function (data) {
            if (data && typeof data.fileSize !== 'undefined') {
                PerpareDocumentContext.filesizerestrict = data.fileSize;
            }
        },
        error: ajaxErrorHandler
    });
}

$('#AllSignatoriesRequired').change(function () {
    const enforceAll = $(this).is(':checked');

    // Update ONLY window.recipients (single source of truth)
    if (Array.isArray(window.recipients)) {
        window.recipients.forEach(function (rec, idx) {
            if (!rec) return;
            rec.mandatory = enforceAll;

            // Sync legacy modalobjlist for backward compatibility
            if (Array.isArray(window.modalobjlist) && window.modalobjlist[idx]) {
                window.modalobjlist[idx].signatureMandatory = enforceAll;
            }

            if (typeof syncRecipientSettings === 'function') {
                syncRecipientSettings(idx, { signatureMandatory: enforceAll });
            }
        });
    }

    // Re-render cards to reflect new mandatory status
    if (typeof renderRecipientCards === 'function') {
        renderRecipientCards({ preserveFocus: true });
    }
});

var dragAndDropableDiv = $(".dropzone");
dragAndDropableDiv.on('dragenter', function (e) {
    console.log("hi");
});
dragAndDropableDiv.on('dragover', function (e) {
    e.stopPropagation();
    e.preventDefault();
    console.log("hello");
});


dragAndDropableDiv.on("drop", async (event) => {
    event.preventDefault();
    const file = event.originalEvent.dataTransfer.files[0];

    if (!file) return;


    const mockEvent = {
        target: {
            files: [file],
            value: ''
        }
    };

    await fileSelect(mockEvent);
});



$("#removefile").on("click", function () {
    $("#thumbnail").addClass("classshide");
    $("#DocumentName").val("");
    $('#Continue').attr('disabled', 'disabled').addClass('disabled-blur');
    $('#quickSign').attr('disabled', 'disabled').addClass('disabled-blur');
    $('#InitialRequired, #QrCodeRequired').prop('disabled', false);
    $('label[for="InitialRequired"], label[for="QrCodeRequired"]').css('opacity', '1');
    $('#signatureWarning').css('display', 'none');
    $('#watermarkdiv').show();
    isFileUploaded = false;
    // Reset file input field
    $("#File").val("");
});

function resetPdfViewerState() {
    if (pdfContainer) {
        pdfContainer.innerHTML = '';
        pdfContainer.style.transform = '';
    }
    if (scrollContainerEl) {
        scrollContainerEl.scrollTop = 0;
    }
    renderQueue.clear();
    renderedPages.clear();
    uploadedPDF = null;
    currentPage = 1;
    pdfZoomLevel = 1;
    updateZoomDisplay();
    updatePageIndicatorDisplay(0);
}

$("#back").on("click", function () {
    if (!$('#Send').hasClass("classshide"))
        $('#Send').addClass("classshide");
    if (!$('#Save').hasClass("classshide"))
        $('#Save').addClass("classshide");
    $("#Initial").addClass("classshide");
    $('#viwer').addClass("classshide");
    $('#createDoc').removeClass("classshide");
    $("#fields").addClass("classshide")
    document.getElementById('INITIAL').disabled = true;
    initialsDelete = true;
    fieldnameslist = [];
    initialsStore = [];
    iswatermarkpresent = false;
    watermarktext = "";
    resetPdfViewerState();

    document.getElementById("watermark-field").value = '';

})

// Quick Sign button handler - bind to legacy SaveQuickSign workflow
$("#quickSign").on("click", async function (e) {
    e.preventDefault();

    // Quick sign uses empty visible/invisible list (no annotations pre-placed)
    const visibleAndInvisibleList = {};

    // Call legacy Quick Sign function
    await SaveQuickSign(visibleAndInvisibleList);
});
function QuicksignRetry(blob) {
    let DocumentName = document.getElementById("DocumentName").value;


    var parsedModel = JSON.parse(finalresponse.result.model);
    var documentRetryViewModel = new FormData();
    documentRetryViewModel.append("File", blob, DocumentName);
    documentRetryViewModel.append("Config", JSON.stringify(parsedModel));


    $.ajax({

        url: SendSigningRequest,
        method: 'POST',
        data: documentRetryViewModel,
        contentType: false,
        processData: false,
        beforeSend: function () {
            updateStepper(0, "success", "", "", "", "");
        },
        success: function (response) {
            document.getElementById('signingdocid').value = JSON.parse(response.result.model).tempid;
            finalresponse = response;
            if (response.status === "Success") {

                var tempid = response.result.tempid;
                updateStepper(1, "success", "", "", "", "", tempid, response);
            }
            else if (response.title == "Save New Document") {
                swal({
                    type: 'info',
                    title: "Info",
                    text: response.message,
                }, function (isConfirm) {
                    if (isConfirm) {
                        window.location.href = IndexDashboard;
                    }
                });
            }
            else {
                if (response.message == "Credits are not available" || response.message == "Eseal credits are not available") {

                    updateStepper(1, "failed", response.message, "", "", "", "", "", blob);

                }
                else {

                    updateStepper(1, "failed", response.message, "", "", "", "", "", blob);
                }

            }
        },
        error: function (error) {
            setTimeout(function () {
                ajaxErrorHandler(error);
            }, 400);
        }
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
                //$('#overlay').show();

                document.getElementById("navigationNetworkOverlay").style.display = "flex";
            },
            complete: function () {
                //$('#overlay').hide();

                document.getElementById("navigationNetworkOverlay").style.display = "none";
            },
            success: function (response) {
                // Handle the success response from the server
                if (response.success == true) {
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

                    if (response.result.length > 0) {
                        let text = "";
                        swal_list.forEach(function (value) {
                            text += value + "\n";
                        });
                        var response_data_obj = {
                            swallist: swal_list,
                            listdata: list_data,
                            delegateeid: response.result[0].delegationId,
                        }

                        resolve(response_data_obj);
                    } else {
                        var response_data_obj = {
                            swallist: "",
                            listdata: [],
                            delegateeid: '',
                        }
                        resolve(response_data_obj);
                    }
                } else {
                    swal({
                        title: "Error",
                        text: response.message || "Unknown error occurred",
                        type: "error",
                    }, function (isConfirm) {
                        if (isConfirm) {
                            window.location.href = IndexDocuments;
                        }
                    });
                    resolve(false);
                }
                console.log(response);
            },
            error: function (error) {
                resolve(false);
                ajaxErrorHandler(error);

            }
        });
    });
}

async function SaveQuickSignQrcode(qrcodedata, visibleAndInvisibleList) {
    quickflag = true;
    if (!isFileUploaded) {
        // showCustomAlert('Please upload a file ');
        toastr.error('Please upload a file ');
        e.preventDefault();
        return;
    }
    var docname = ($('#DocumentName').val() || '').trim();
    if (docname === '' || docname === null) {
        // showCustomAlert(`Please enter a document name`);
        toastr.error(`Please enter a document name`);
        e.preventDefault();
        return;
    }

    if (!globalFile) {
        console.error("No file uploaded.");
        return;
    }



    let DocumentName = document.getElementById("DocumentName").value;
    var delegation_req_data = {
        id: loginorgUid,
        suid: loginSuid,
        email: loginEmail,
    };
    var hasDelegationFound = false;
    var delegation_response = await handle_delegation_orgid_suid_selfloginuser(delegation_req_data);
    delegation_response_val = delegation_response;
    console.log(delegation_response);
    if (delegation_response != undefined) {
        if (delegation_response.listdata.length > 0) {
            hasDelegationFound = true; // Set the flag to true
            delegationid_val = delegation_response.delegateeid;
        } else {
            delegationid_val = '';
        }
    }
    if (hasDelegationFound) {
        console.log("Delegation found. Further processing stopped.");
        swal({
            type: 'info',
            title: 'Info',
            text: "Currently having an active delegation.\nDelegatee: " + delegation_response_val.swallist,
        });
        return false;
    }

    let SettingConfig = { inputpath: '', outputpath: '' };
    let QrCodeRequired = $("#QrCodeRequired").is(':checked');

    var roleList = [];
    $('.email').each(function (i) {
        var isEseal = $("#RecpientList_" + i + "__Eseal").prop("checked");
        roleList.push({
            "order": i + 1,
            "role": "signer",
            "eseal": isEseal
        });
    });

    var daystoComplete_val = $('#DaysToComplete').val();
    var daystoCompleteInt_val = parseInt(daystoComplete_val, 10);
    var Recps = PerpareDocumentContext.receipientEmails
    var RequiredSignatureNo = $('#RequiredSignatureInput').val();
    var RequiredSignatureNoInt_Count = typeof getMinRequiredSignatures === 'function' ? getMinRequiredSignatures() : parseInt(RequiredSignatureNo);
    var allSignaturesRequired = $("#AllSignatoriesRequired").prop("checked");
    var signaturesRequiredCount = Recps.length;
    if (!allSignaturesRequired) {
        signaturesRequiredCount = RequiredSignatureNoInt_Count;
    }

    var config = {
        QrCodeRequired: QrCodeRequired,
        Qrcode: qrcodedata
    };

    console.log(JSON.stringify(config));
    var documentCreateViewModel = new FormData();

    documentCreateViewModel.append("DocumentName", DocumentName);
    documentCreateViewModel.append("DaysToComplete", daystoCompleteInt_val);
    documentCreateViewModel.append("SettingConfig", JSON.stringify(SettingConfig));
    documentCreateViewModel.append("Config", JSON.stringify(config));
    documentCreateViewModel.append("Signatory", loginEmail);
    documentCreateViewModel.append("RoleList", JSON.stringify(roleList));
    documentCreateViewModel.append("QrCodeRequired", QrCodeRequired);
    documentCreateViewModel.append("docSerialNo", serialnumber);
    documentCreateViewModel.append("entityName", entityname);
    documentCreateViewModel.append("faceRequired", faceRequired);
    documentCreateViewModel.append("pageHeight", pageHeight);
    documentCreateViewModel.append("pageWidth", pageWidth);
    documentCreateViewModel.append("RequiredSignatureNo", signaturesRequiredCount);



    const hasFalseValue = Object.values(visibleAndInvisibleList).includes(false);

    var okElement;
    var cancelElement;

    if (hasFalseValue) {
        let invisiblevisibledata = "<div style='font-size:1rem; color:black; text-align:left; width:100%;'>";
        invisiblevisibledata += "<ul style='padding-left: 20px; margin: 0;'>";

        for (const key in visibleAndInvisibleList) {
            if (visibleAndInvisibleList.hasOwnProperty(key) && visibleAndInvisibleList[key] === false) {
                invisiblevisibledata += `
                                                                            <li style="margin-bottom: 5px;font-weight:bold">${key}</li>`;
            }
        }

        invisiblevisibledata += "</ul></div>";

        const overlayListEl = document.getElementById('overlay11List');
        if (overlayListEl) overlayListEl.innerHTML = invisiblevisibledata;

        document.getElementById('overlay11').style.display = 'flex';
        okElement = document.getElementById('okButton2');
        cancelElement = document.getElementById('cancelButton2')
    }
    else {
        document.getElementById('overlay9').style.display = 'flex';
        okElement = document.getElementById('okButton');
        cancelElement = document.getElementById('cancelButton')
    }


    // Ensure event listeners are added only once
    okElement.addEventListener('click', async function () {
        // Hide the modal
        if (hasFalseValue) {
            document.getElementById('overlay11').style.display = 'none';
        } else {
            document.getElementById('overlay9').style.display = 'none';
        }
        $('#overlay').show();
        var blob = null;

        const isInitialChecked = document.getElementById('InitialRequired').checked;
        if (isInitialChecked || iswatermarkpresent) {

            try {
                var blob = await addWatermark_Initial("org", isInitialChecked, iswatermarkpresent);

                const maxSizeInBytes = PerpareDocumentContext.filesizerestrict * 1024 * 1024;
                if (blob.size > maxSizeInBytes) {
                    $('#overlay').hide();
                    swal({
                        icon: 'warning',
                        title: 'File Too Large',
                        text: `PDF exceeds ${PerpareDocumentContext.filesizerestrict} MB after adding watermark or initial`
                    });
                    return;
                }



            } catch (error) {
                $('#overlay').hide();
                swal({
                    type: 'error',
                    title: 'Error',
                    text: error.message || 'Something went wrong while processing the PDF.'
                });
                return;
            }
        }
        else {
            blob = new Blob([globalFile], {
                type: globalFile.type
            });
        }
        $('#overlay').hide();

        documentCreateViewModel.append("File", blob, DocumentName);
        $('#digitalShowModal').addClass('show').css('display', 'block');
        // Proceed with the AJAX call
        $.ajax({
            url: SaveNewDocument,
            method: 'POST',
            data: documentCreateViewModel,
            contentType: false,
            processData: false,
            success: function (response) {
                document.getElementById('signingdocid').value = JSON.parse(response.result.model).tempid;
                finalresponse = response;
                if (response.status === "Success") {

                    var tempid = response.result.tempid;
                    updateStepper(1, "success", "", "", "", "", tempid, response);
                }

                else {
                    if (response.message == "Credits are not available" || response.message == "Eseal credits are not available") {


                        updateStepper(1, "failed", response.message, "", "", "", "", "", blob);
                    }
                    else if (response.title == "Save New Document") {
                        swal({
                            type: 'info',
                            title: "Info",
                            text: response.message,
                        }, function (isConfirm) {
                            if (isConfirm) {
                                window.location.href = IndexDashboard;
                            }
                        });
                    }
                    else {

                        updateStepper(1, "failed", response.message, "", "", "", "", "", blob);
                    }

                }
            },
            error: ajaxErrorHandler
        });
    });

    cancelElement.addEventListener('click', function () {
        if (hasFalseValue) {
            document.getElementById('overlay11').style.display = 'none';
        } else {
            document.getElementById('overlay9').style.display = 'none';
        }
    });
}



async function SaveQuickSign(visibleAndInvisibleList) {

    quickflag = true;
    var daysToCompleteError = document.getElementById('daysToCompleteError');

    daysToCompleteError.innerText = '';
    if (!isFileUploaded) {
        // showCustomAlert('Please upload a file ');
        toastr.error('Please upload a file ');
        e.preventDefault();
        return;
    }
    var docname = ($('#DocumentName').val() || '').trim();
    if (docname === '' || docname === null) {
        // showCustomAlert(`Please enter a document name`);
        toastr.error(`Please enter a document name`);
        e.preventDefault();
        return;
    }
    var daystoComplete = $('#DaysToComplete').val();
    var daystoCompleteInt = parseInt(daystoComplete, 10);
    var daysToCompleteError = document.getElementById('daysToCompleteError');
    if (daystoComplete === '') {
        // showCustomAlert(`Please enter number days to complete`);
        document.getElementById("navigationNetworkOverlay").style.display = "none";
        //toastr.error(`Please enter number days to complete`);
        daysToCompleteError.innerText = 'Please enter days in range of 2 to 6';
        e.preventDefault();
        return;
    }
    if (daystoComplete === 0 || daystoCompleteInt < 2 || daystoCompleteInt > 6) {
        document.getElementById("navigationNetworkOverlay").style.display = "none";
        daysToCompleteError.innerText = 'Please enter days in range of 2 to 6';
        e.preventDefault();
        return;
    }

    if (!globalFile) {
        console.error("No file uploaded.");
        return;
    }


    $('#overlay').show();
    var blob = null;

    const isInitialChecked = document.getElementById('InitialRequired').checked;
    if (isInitialChecked || iswatermarkpresent) {

        try {
            var blob = await addWatermark_Initial("org", isInitialChecked, iswatermarkpresent);

            const maxSizeInBytes = PerpareDocumentContext.filesizerestrict * 1024 * 1024;
            if (blob.size > maxSizeInBytes) {
                $('#overlay').hide();
                swal({
                    icon: 'warning',
                    title: 'File Too Large',
                    text: `PDF exceeds ${PerpareDocumentContext.filesizerestrict} MB after adding watermark or initial`
                });
                return;
            }



        } catch (error) {
            $('#overlay').hide();
            swal({
                type: 'error',
                title: 'Error',
                text: error.message || 'Something went wrong while processing the PDF.'
            });
            return;
        }
    }
    else {
        blob = new Blob([globalFile], {
            type: globalFile.type
        });
    }
    $('#overlay').hide();

    let DocumentName = document.getElementById("DocumentName").value;
    var delegation_req_data = {
        id: loginorgUid,
        suid: loginSuid,
        email: loginEmail,
    };
    var hasDelegationFound = false;
    var delegation_response = await handle_delegation_orgid_suid_selfloginuser(delegation_req_data);
    delegation_response_val = delegation_response;
    console.log(delegation_response);
    if (delegation_response != undefined) {
        if (delegation_response.listdata.length > 0) {
            hasDelegationFound = true; // Set the flag to true
            delegationid_val = delegation_response.delegateeid;
        } else {
            delegationid_val = '';
        }
    }
    if (hasDelegationFound) {
        console.log("Delegation found. Further processing stopped.");
        swal({
            type: 'info',
            title: 'Info',
            text: "Currently having an active delegation.\nDelegatee: " + delegation_response_val.swallist,
        });
        return false;
    }

    let SettingConfig = { inputpath: '', outputpath: '' };
    let QrCodeRequired = $("#QrCodeRequired").is(':checked');

    var roleList = [];
    $('.email').each(function (i) {
        var isEseal = $("#RecpientList_" + i + "__Eseal").prop("checked");
        roleList.push({
            "order": i + 1,
            "role": "signer",
            "eseal": isEseal
        });
    });

    var daystoComplete_val = $('#DaysToComplete').val();
    var daystoCompleteInt_val = parseInt(daystoComplete_val, 10);
    var RequiredSignatureNo = $('#RequiredSignatureInput').val();
    var RequiredSignatureNoInt_Count = typeof getMinRequiredSignatures === 'function' ? getMinRequiredSignatures() : parseInt(RequiredSignatureNo);

    var addSignatoriesIsChecked = $('#addSignatoriesCheckbox').prop('checked');

    if (!addSignatoriesIsChecked) {
        var signaturesRequiredCount = RequiredSignatureNoInt_Count;
    }

    var config = {
        QrCodeRequired: QrCodeRequired,
    };

    console.log(JSON.stringify(config));
    var documentCreateViewModel = new FormData();
    documentCreateViewModel.append("File", blob, DocumentName);
    documentCreateViewModel.append("DocumentName", DocumentName);
    documentCreateViewModel.append("DaysToComplete", daystoCompleteInt_val);
    documentCreateViewModel.append("SettingConfig", JSON.stringify(SettingConfig));
    documentCreateViewModel.append("Config", JSON.stringify(config));
    documentCreateViewModel.append("Signatory", loginEmail);
    documentCreateViewModel.append("RoleList", JSON.stringify(roleList));
    documentCreateViewModel.append("QrCodeRequired", QrCodeRequired);
    documentCreateViewModel.append("pageHeight", pageHeight);
    documentCreateViewModel.append("pageWidth", pageWidth);
    documentCreateViewModel.append("RequiredSignatureNo", signaturesRequiredCount);


    var okElement;
    var cancelElement;
    if (Object.keys(visibleAndInvisibleList).length !== 0) {
        let invisiblevisibledata = "<div style='font-size:1rem; color:black; text-align:left; width:100%;'>";
        invisiblevisibledata += "<ul style='padding-left: 20px; margin: 0;'>";

        for (const key in visibleAndInvisibleList) {
            if (visibleAndInvisibleList.hasOwnProperty(key) && visibleAndInvisibleList[key] === false) {
                invisiblevisibledata += `
                                                                            <li style="margin-bottom: 5px;font-weight:bold">${key}</li>`;
            }
        }

        invisiblevisibledata += "</ul></div>";

        const overlayListEl = document.getElementById('overlay11List');
        if (overlayListEl) overlayListEl.innerHTML = invisiblevisibledata;

        document.getElementById('overlay11').style.display = 'flex';
        okElement = document.getElementById('okButton2');
        cancelElement = document.getElementById('cancelButton2')

    } else {
        document.getElementById('overlay9').style.display = 'flex';
        okElement = document.getElementById('okButton');
        cancelElement = document.getElementById('cancelButton')
    }


    // Ensure event listeners are added only once
    okElement.addEventListener('click', function () {
        // Hide the modal
        if (Object.keys(visibleAndInvisibleList).length !== 0) {
            document.getElementById('overlay11').style.display = 'none';
        }
        else {
            document.getElementById('overlay9').style.display = 'none';
        }
        $('#digitalShowModal').addClass('show').css('display', 'block');
        // Proceed with the AJAX call
        $.ajax({
            url: SaveNewDocument,
            method: 'POST',
            data: documentCreateViewModel,
            contentType: false,
            processData: false,
            success: function (response) {

                if (response.status === "Success") {

                    document.getElementById('signingdocid').value = JSON.parse(response.result.model).tempid;
                    finalresponse = response;
                    var tempid = response.result.tempid;
                    updateStepper(1, "success", "", "", "", "", tempid, response);
                }
                else {
                    if (response.message == "Credits are not available" || response.message == "Eseal credits are not available") {

                        finalresponse = response;
                        updateStepper(1, "failed", response.message, "", "", "", "", "", blob);
                    }
                    else if (response.title == "Save New Document") {
                        swal({
                            type: 'info',
                            title: "Info",
                            text: response.message,
                        }, function (isConfirm) {
                            if (isConfirm) {
                                window.location.href = IndexDashboard;
                            }
                        });
                    }
                    else {

                        document.getElementById('signingdocid').value = JSON.parse(response.result.model).tempid;
                        finalresponse = response;
                        updateStepper(1, "failed", response.message, "", "", "", "", "", blob);
                    }

                }
            },

            error: ajaxErrorHandler
        });
    });

    cancelElement.addEventListener('click', function () {
        if (Object.keys(visibleAndInvisibleList).length !== 0) {
            document.getElementById('overlay11').style.display = 'none';
        }
        else {
            document.getElementById('overlay9').style.display = 'none';
        }

    });
}

$('#recplist').on('blur', '.email', function (e) {
    var trimmedemailInput = ($(this).val() || '').trim();
    var emailInputValue = trimmedemailInput;
    $(this).val(emailInputValue);
    var $this = $(this);
    var emailArray = [];
    var $organizationDropdown = $this.closest('.recp').find('.organizationDropdown');
    var $validationSpan = $this.closest('.recp').find('.text-danger');
    var alternateEmails = $('.email-input1').map(function () {
        return $(this).val();
    }).get().filter(email => email.trim() !== '').join(',');
    if (emailInputValue.trim() == "") {
        $organizationDropdown.find('.organizationDropdownSelect').empty();
        $organizationDropdown.find('.organizationDropdownSelect').append($('<option>', {
            value: '',
            text: 'Choose Account'
        }));
        orderId = parseInt($this.closest('.recp').find('input[name^="RecpientList["]').attr('name').match(/\d+/)[0]);
        if (orderId == 0) {
            $('#settingsButtonLi').addClass("classshide");
        } else {
            $(`#settingsButtonLi_${orderId}`).addClass("classshide");
        }
        var updatedresponsesdata = [];
        for (var i = 0; i < userDataResponses.length; i++) {
            if (orderId !== i) {
                updatedresponsesdata[i] = userDataResponses[i];
            } else {
                updatedresponsesdata[i] = {};
            }
        }
        userDataResponses = updatedresponsesdata;
        console.log(userDataResponses);
        persistOrganizationDropdownState(orderId);
    }
    if (alternateEmails) {

        emailArray = alternateEmails.split(',');
        if (emailArray.includes(emailInputValue.trim())) {
            toastr.error(`Already a selected alternative signatory.`);
            return;
        }
    }
    if (isEmailUsedInOtherList(emailInputValue, $this)) {

        toastr.error(`Signatory already exists`);
        return;
    }

    else {

        var emailRegex = new RegExp(
            /^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i
        );

        if (!emailRegex.test(emailInputValue)) {
            var $thisReference = $this;
            $thisReference.closest('.recp').find('.text-danger').text('Please enter valid E-Mail address');
            $(this).next("span").removeClass("classshide");
            //toastr.error(`Please enter a valid Email Id.`);
            return;

        } else {
            var $listItem = $this.closest('.recp');
            var $thisReference = $this;

            // Extract the order number from the ID attribute of the input element
            orderId = parseInt($this.closest('.recp').find('input[name^="RecpientList["]').attr('name').match(/\d+/)[0]);

            if (userDataResponses.length !== 0) {
                // Iterate through each data object in userDataResponses
                for (let i = 0; i < userDataResponses.length; i++) {
                    if (Object.keys(userDataResponses[i]).length !== 0) {
                        const emailList = userDataResponses[i].emailList;
                        const rowEmail_value = userDataResponses[i].rowEmail;
                        const emailArray = emailList.split(',');

                        if (i === orderId) {
                            // If the index matches orderId, check rowEmail_value
                            if (rowEmail_value === emailInputValue.trim()) {
                                // Do not show an error since it's a match with the same index
                                continue; // Continue to the next iteration without showing an error
                            }
                        } else {
                            // If the index does not match orderId, check the conditions
                            if (emailArray.includes(emailInputValue.trim()) || rowEmail_value === emailInputValue.trim()) {
                                toastr.error(`Sorry! Email of the subscriber already exists.`);
                                return; // Exit if a match is found
                            }
                        }
                    }

                }
            }

            $.ajax({
                type: "POST",
                url: OrgDetailsByEmail,
                data: {
                    email: emailInputValue
                },
                beforeSend: function () {
                    $organizationDropdown.find('.organizationDropdownSelect').prop('disabled', true);
                    $listItem.find('.loader').css('display', 'flex').show();
                },
                complete: function () {
                    $listItem.find('.loader').hide();
                    $organizationDropdown.find('.organizationDropdownSelect').prop('disabled', false);

                },
                success: function (response) {
                    if (response.success == false) {
                        swal({
                            title: "Error",
                            text: response.message,
                            type: "error",
                        });
                        return;
                    } else {
                        ajaxResponse = response;
                        $organizationDropdown.find('.organizationDropdownSelect').empty();
                        $organizationDropdown.find('.organizationDropdownSelect').append($('<option>', {
                            value: '',
                            text: 'Choose Account'
                        }));
                        if (orderId == 0) {
                            $('#settingsButtonLi').addClass("classshide");
                        } else {
                            $(`#settingsButtonLi_${orderId}`).addClass("classshide");
                        }
                        userdetails = response.userProfile;
                        userdetails.rowEmail = emailInputValue;

                        userDataResponses[orderId] = userdetails;

                        if (Array.isArray(window.recipients) && window.recipients[orderId]) {
                            window.recipients[orderId].email = emailInputValue;
                        }
                        $this.closest('.recipient-card').find('.recipient-email-label').text(emailInputValue || 'No email specified');

                        organizations = response.orgDtos;

                        // Store the response with the order number
                        responses[orderId] = organizations;

                        console.log(SelfEmails);
                        var selfobj = {
                            employee_list: [],
                            eseal_employee_list: [],
                            has_eseal_permission: false,
                            orgName: 'Self',
                            orgUid: ' ',
                            initial: '',

                        };
                        if (organizations.length === 0) {
                            $organizationDropdown.find('.organizationDropdownSelect').append($('<option>', {
                                value: " ",
                                text: "Self"
                            }));
                            var orglist = [];
                            orglist.push(selfobj);
                            var orgobj = {
                                orderid: orderId,
                                orgList: orglist,
                                originalList: orglist,
                                selectedorgList: []
                            };
                            if (organizationobjlist.length === 0) {
                                // If empty, push the new orgobj
                                organizationobjlist.push(orgobj);
                            } else {
                                // If not empty, replace the data at the same index
                                organizationobjlist[orderId] = orgobj; // Replace the existing object
                            }
                            if (orderId == 0) {
                                $('#settingsButtonLi').removeClass("classshide");
                            } else {
                                $(`#settingsButtonLi_${orderId}`).removeClass("classshide");
                            }

                            $organizationDropdown.find('.organizationDropdownSelect').val(" ").trigger('change');


                        } else {
                            var loggedInUserEmail = loginEmail; // Replace this with the actual logged in user email
                            if (emailInputValue === loggedInUserEmail) {
                                if (userdetails.ugpassEmail === loggedInUserEmail) {


                                    organizations.push(selfobj);

                                    var orgUid = loginorgUid;
                                    var orgFound = organizations.find(function (org) {
                                        return org.orgUid.trim() === orgUid.trim();
                                    });
                                    var orgobj = {
                                        orderid: orderId,
                                        orgList: organizations,
                                        originalList: organizations,
                                        selectedorgList: []
                                    };
                                    if (organizationobjlist.length === 0) {
                                        // If empty, push the new orgobj
                                        organizationobjlist.push(orgobj);
                                    } else {
                                        // If not empty, replace the data at the same index
                                        organizationobjlist[orderId] = orgobj; // Replace the existing object
                                    }

                                    if (orgFound) {
                                        $organizationDropdown.find('.organizationDropdownSelect').append($('<option>', {
                                            value: orgFound.orgUid,
                                            text: orgFound.orgName
                                        }));
                                        $organizationDropdown.find('.organizationDropdownSelect').val(orgFound.orgUid).trigger('change');
                                        //$('.settingsButtonLi').removeClass("classshide");
                                        if (orderId == 0) {
                                            $('#settingsButtonLi').removeClass("classshide");
                                        } else {
                                            $(`#settingsButtonLi_${orderId}`).removeClass("classshide");
                                        }

                                    } else {
                                        $organizationDropdown.find('.organizationDropdownSelect').append($('<option>', {
                                            value: " ",
                                            text: "Self"
                                        }));
                                        $organizationDropdown.find('.organizationDropdownSelect').val(" ").trigger('change');
                                        //$('.settingsButtonLi').removeClass("classshide");
                                        if (orderId == 0) {
                                            $('#settingsButtonLi').removeClass("classshide");
                                        } else {
                                            $(`#settingsButtonLi_${orderId}`).removeClass("classshide");
                                        }

                                    }
                                } else {

                                    var orgUid = loginorgUid;
                                    var orgFound = organizations.find(function (org) {
                                        return org.orgUid.trim() === orgUid.trim();
                                    });
                                    var orgobj = {
                                        orderid: orderId,
                                        orgList: organizations,
                                        originalList: organizations,
                                        selectedorgList: []
                                    };
                                    if (organizationobjlist.length === 0) {
                                        // If empty, push the new orgobj
                                        organizationobjlist.push(orgobj);
                                    } else {
                                        // If not empty, replace the data at the same index
                                        organizationobjlist[orderId] = orgobj; // Replace the existing object
                                    }
                                    if (orgFound) {
                                        $organizationDropdown.find('.organizationDropdownSelect').append($('<option>', {
                                            value: orgFound.orgUid,
                                            text: orgFound.orgName
                                        }));
                                        $organizationDropdown.find('.organizationDropdownSelect').val(orgFound.orgUid).trigger('change');
                                        //$('.settingsButtonLi').removeClass("classshide");
                                        if (orderId == 0) {
                                            $('#settingsButtonLi').removeClass("classshide");
                                        } else {
                                            $(`#settingsButtonLi_${orderId}`).removeClass("classshide");
                                        }
                                    }

                                }
                            } else {
                                if (emailInputValue === userdetails.ugpassEmail) {

                                    if (organizations.length > 0) {
                                        organizations.push(selfobj);

                                        var orgobj = {
                                            orderid: orderId,
                                            orgList: organizations,
                                            originalList: organizations,
                                            selectedorgList: []
                                        };
                                        if (organizationobjlist.length === 0) {
                                            // If empty, push the new orgobj
                                            organizationobjlist.push(orgobj);
                                        } else {
                                            // If not empty, replace the data at the same index
                                            organizationobjlist[orderId] = orgobj; // Replace the existing object
                                        }
                                        for (var i = 0; i < organizations.length; i++) {
                                            $organizationDropdown.find('.organizationDropdownSelect').append($('<option>', {
                                                value: organizations[i].orgUid,
                                                text: organizations[i].orgName
                                            }));
                                        }
                                    } else {
                                        organizations.push(selfobj);
                                        var orgobj = {
                                            orderid: orderId,
                                            orgList: organizations,
                                            originalList: organizations,
                                            selectedorgList: []
                                        };
                                        if (organizationobjlist.length === 0) {
                                            // If empty, push the new orgobj
                                            organizationobjlist.push(orgobj);
                                        } else {
                                            // If not empty, replace the data at the same index
                                            organizationobjlist[orderId] = orgobj; // Replace the existing object
                                        }
                                        $organizationDropdown.find('.organizationDropdownSelect').append($('<option>', {
                                            value: " ",
                                            text: "Self"
                                        }));
                                    }

                                } else {
                                    if (organizations.length > 0) {
                                        var orgobj = {
                                            orderid: orderId,
                                            orgList: organizations,
                                            originalList: organizations,
                                            selectedorgList: []
                                        };
                                        if (organizationobjlist.length === 0) {
                                            // If empty, push the new orgobj
                                            organizationobjlist.push(orgobj);
                                        } else {
                                            // If not empty, replace the data at the same index
                                            organizationobjlist[orderId] = orgobj; // Replace the existing object
                                        }
                                        if (organizations.length == 1) {


                                            for (var i = 0; i < organizations.length; i++) {
                                                $organizationDropdown.find('.organizationDropdownSelect').append($('<option>', {
                                                    value: organizations[i].orgUid,
                                                    text: organizations[i].orgName
                                                }));
                                            }
                                            $organizationDropdown.find('.organizationDropdownSelect').val(organizations[0].orgUid).trigger('change');

                                            if (orderId == 0) {
                                                $('#settingsButtonLi').removeClass("classshide");
                                            } else {
                                                $(`#settingsButtonLi_${orderId}`).removeClass("classshide");
                                            }
                                        } else {
                                            for (var i = 0; i < organizations.length; i++) {
                                                $organizationDropdown.find('.organizationDropdownSelect').append($('<option>', {
                                                    value: organizations[i].orgUid,
                                                    text: organizations[i].orgName
                                                }));
                                            }
                                        }

                                    }
                                }

                            }
                            console.log(organizations);
                            persistOrganizationDropdownState(orderId);


                        }
                        // Listen for changes in the dropdown value
                        $organizationDropdown.find('.organizationDropdownSelect').change(function () {
                            // Check if an organization is selected
                            orderId = parseInt($this.closest('.recp').find('input[name^="RecpientList["]').attr('name').match(/\d+/)[0]);

                            if ($(this).val() !== '') {
                                // $('.settingsButtonLi').removeClass("classshide");
                                if (orderId == 0) {
                                    $('#settingsButtonLi').removeClass("classshide");
                                } else {
                                    $(`#settingsButtonLi_${orderId}`).removeClass("classshide");
                                }
                            } else {
                                // $('.settingsButtonLi').addClass("classshide");
                                if (orderId == 0) {
                                    $('#settingsButtonLi').removeClass("classshide");
                                } else {
                                    $(`#settingsButtonLi_${orderId}`).removeClass("classshide");
                                }
                            }
                        });



                        $thisReference.closest('.recp').find('.text-danger').text('');
                    }


                },
                error: ajaxErrorHandler
            });
        }
    }
});


function isEmailUsedInOtherList(email, currentInput) {
    var isUsed = false;
    var inputs = document.querySelectorAll('.email');

    inputs.forEach(function (input) {
        if (input.id != currentInput[0].id) {
            var otherEmail = input.value.trim();
            if ((otherEmail.toLowerCase() === email.toLowerCase()) && (otherEmail.toLowerCase() !== "")) {
                isUsed = true;
            }
        }
    });

    return isUsed;
}

function isEmailUsedInOtherListAlter(email, currentInput) {
    var isUsed = false;
    $(".email-input").not(currentInput).each(function () {
        var otherEmail = ($(this).val() || '').trim();
        if (otherEmail.toLowerCase() === email.toLowerCase()) {
            isUsed = true;
            return false;
        }
    });
    return isUsed;
}



$('#OKbutton, #SettingsOKbutton').on('click', async function () {

    var allSignaturesRequired = $("#AllSignatoriesRequired").prop("checked");
    var isInitialRequired = $('#RecpientList_' + orderId + '__Initial').prop("checked");

    // Get mandatory status from the recipient card (not from modal anymore)
    var recipientMandatory = true; // default to required
    if (Array.isArray(window.recipients) && window.recipients[orderId]) {
        recipientMandatory = window.recipients[orderId].mandatory !== false;
    }

    // Create or update the object for modal settings
    var objval = {
        orderid: orderId,
        signatureMandatory: recipientMandatory,
        allowComments: $('#allowComments').prop('checked'),
        allowanyonesign: $('#anyoneSign').prop('checked'),
    };



    // Update or add the object in modalobjlist
    var existingIndex = modalobjlist.findIndex(item => item.orderid === orderId);
    if (existingIndex !== -1) {
        modalobjlist[existingIndex] = objval;
    } else {
        modalobjlist.push(objval);
    }
    syncRecipientSettings(orderId, {
        signatureMandatory: objval.signatureMandatory,
        allowComments: objval.allowComments,
        anyoneSign: objval.allowanyonesign
    });

    // Update recipient mandatory status in recipients array and UI
    if (Array.isArray(window.recipients) && window.recipients[orderId]) {
        window.recipients[orderId].mandatory = objval.signatureMandatory;

        // Update the status badge on the card
        updateRecipientStatusBadge(orderId, objval.signatureMandatory);

        // Recalculate minimum signatures
        updateMinSignaturesDisplay();
    }

    // Process email inputs
    var emails = $('.email-input1').map(function () {
        return $(this).val();
    }).get().filter(email => email.trim() !== '').join(',');

    if (emails) {
        var emailArray = emails.split(',');

        // Send emails sequentially
        for (const email of emailArray) {
            await sendEmailToAjax(email);
        }
    }
    var modalobjdata_val = modalobjSelectedorglist.find(item => item.orderid === orderId);
    // Handle modal visibility based on anyoneSign checkbox and validation
    var anyonesign_val = $("#anyoneSign").prop("checked");
    if (anyonesign_val) {
        var result_boolen = validateAlternateEmail(orderId, modalobjdata_val.selectedorg);
        if (!result_boolen.bool) {
            $('#settings_Modal').show();
        } else {
            $('#settings_Modal').hide();
            console.log(result_boolen);
        }
    } else {
        $('#settings_Modal').hide();
    }



    console.log(alternateSignatoriesList);
});

async function sendEmailToAjax(email) {

    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
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
                    var isEsealRequired = $('#RecpientList_' + orderId + '__Eseal').prop("checked");

                    var userObject = {
                        email: email,
                        suid: userdetails.suid
                    };
                    var modalobjdata_val = modalobjSelectedorglist.find(item => item.orderid === orderId);
                    if (modalobjdata_val.selectedorg.orgName == "Self") {
                        if (userdetails.ugpassEmail != email) {
                            toastr.error(`Sorry, the signatory is not self signatory ${email}`);
                            return;
                        }
                    }
                    if (modalobjdata_val.selectedorg.orgName !== "Self" || modalobjdata_val.selectedorg.orgUid.trim() != "") {
                        if (isEsealRequired) {
                            if (!modalobjdata_val.selectedorg.eseal_employee_list.includes(email)) {
                                toastr.error(`Sorry,signatory does not have e-seal permission ${email}`);
                                return;
                            }

                        } else {
                            if (!modalobjdata_val.selectedorg.employee_list.includes(email)) {
                                toastr.error(`Sorry,signatory does not have e-seal permission ${email}`);
                                return;
                            }

                        }
                    }
                    if (!Array.isArray(alternateSignatoriesList[orderId])) {
                        // If not, create a new array and push the userObject
                        alternateSignatoriesList[orderId] = [userObject];
                    } else {
                        // If yes, push the userObject into the existing array
                        alternateSignatoriesList[orderId].push(userObject);

                        // Remove duplicate entries in the array
                        const uniqueList = [...new Set(alternateSignatoriesList[orderId].map(user => JSON.stringify(user)))].map(user => JSON.parse(user));

                        // Reassign the unique list back to the alternateSignatoriesList
                        alternateSignatoriesList[orderId] = uniqueList;

                        // Ensure only emails present in the innerForm input fields are kept
                        var innerForm = document.getElementById('innerForm');
                        var inputFields = innerForm.querySelectorAll('input');
                        var filteredList = [];
                        uniqueList.forEach(function (uniqueUser) {
                            inputFields.forEach(function (input) {
                                if (input.value === uniqueUser.email) {
                                    filteredList.push(uniqueUser);
                                }
                            });
                        });

                        // Update the alternateSignatoriesList with the filtered list
                        alternateSignatoriesList[orderId] = filteredList;
                        userDataResponses[orderId].alternateSignatoriesList = alternateSignatoriesList[orderId];
                        console.log(alternateSignatoriesList[orderId]);
                        syncRecipientAlternateEmails(orderId);
                    }
                }

                resolve();
            },

            error: ajaxErrorHandler
        });
    });
}


function CloseMark() {

    var alternativEmailsdata = alternateSignatoriesList;
    var alternateEmailsByOrder = [];
    if (alternateSignatoriesList.hasOwnProperty(String(orderId))) {
        alternateEmailsByOrder = alternateSignatoriesList[orderId];

    }
    if (alternateEmailsByOrder.length == 0) {
        $('#anyoneSign').prop('checked', false);
    }


    var allSignaturesRequired = $("#AllSignatoriesRequired").prop("checked");
    if (allSignaturesRequired) {
        $('#signatureMandatory').prop('checked', true).prop('disabled', true);
    }

    // Create or update the object for modal settings
    var objval = {
        orderid: orderId,
        signatureMandatory: $('#signatureMandatory').prop('checked'),
        allowComments: $('#allowComments').prop('checked'),
        allowanyonesign: $('#anyoneSign').prop('checked'),
    };

    // Update or add the object in modalobjlist
    var existingIndex = modalobjlist.findIndex(item => item.orderid === orderId);
    if (existingIndex !== -1) {
        modalobjlist[existingIndex] = objval;
    } else {
        modalobjlist.push(objval);
    }
    syncRecipientSettings(orderId, {
        signatureMandatory: objval.signatureMandatory,
        allowComments: objval.allowComments,
        anyoneSign: objval.allowanyonesign
    });

    $('#settings_Modal').hide();
}

function CloseButton() {


    var requireddata = modalobjlist.filter(item => item.orderid == orderId);
    if (requireddata.length > 0) {
        modalobjlist[orderId].allowComments = false;
        var allSignaturesRequired = $("#AllSignatoriesRequired").prop("checked");
        // Clear any previously entered data in the modal
        if (allSignaturesRequired) {
            $('#signatureMandatory').prop('checked', true);
            $('#signatureMandatory').prop('disabled', true);
            modalobjlist[orderId].signatureMandatory = true;
        } else {
            modalobjlist[orderId].signatureMandatory = false;
        }

    } else {
        var objval = {
            orderid: orderId,
            signatureMandatory: false,
            allowComments: false,
            allowanyonesign: false,
        };
        var allSignaturesRequired = $("#AllSignatoriesRequired").prop("checked");

        if (allSignaturesRequired) {
            objval.signatureMandatory = true;
            objval.allowComments = false;
            objval.allowanyonesign = false;
            $('#signatureMandatory').prop('checked', true);
            $('#signatureMandatory').prop('disabled', true);
        } else {
            objval.signatureMandatory = false;
            objval.allowComments = false;
            objval.allowanyonesign = false;
        }
        modalobjlist[orderId] = objval;
    }
    if (modalobjlist[orderId]) {
        syncRecipientSettings(orderId, {
            signatureMandatory: modalobjlist[orderId].signatureMandatory,
            allowComments: modalobjlist[orderId].allowComments,
            anyoneSign: modalobjlist[orderId].allowanyonesign
        });
    }
    console.log(alternateSignatoriesList);
    var allowanyonesign = $("#anyoneSign").prop("checked");
    if (allowanyonesign) {
        alternateSignatoriesList[orderId] = [];
        userDataResponses[orderId].alternateSignatoriesList = [];
        syncRecipientAlternateEmails(orderId);

    }

    console.log(alternateSignatoriesList);
    $('#settings_Modal').hide();
}

document.getElementById('anyoneSign').addEventListener('change', function () {

    var innerForm = document.getElementById('innerForm');
    var listItems = innerForm.querySelectorAll('li');

    // Clear the input fields manually
    var inputFields = innerForm.querySelectorAll('input');
    inputFields.forEach(function (input) {
        input.value = '';
    });

    // Remove all rows except the first one
    for (var i = listItems.length - 1; i > 0; i--) {
        listItems[i].remove();
    }

    // Hide minus button for the first row and show plus button
    if (listItems.length > 0) {
        var firstRow = listItems[0];
        var addButton = firstRow.querySelector('.addAlternateEmail');
        var removeButton = firstRow.querySelector('.removeAlternateEmail');
        removeButton.style.display = 'none';
        addButton.style.display = 'inline-block';
    }

    console.log(this.checked);
    // Set the display style based on the checkbox state
    innerForm.style.display = this.checked ? 'block' : 'none';
});

function resetModalState() {

    $('#signatureMandatory').prop('checked', false).prop('disabled', false);
    $('#allowComments').prop('checked', false);
    $('#anyoneSign').prop('checked', false);

    // Clear all input fields within innerForm
    var innerForm = document.getElementById('innerForm');
    var inputFields = innerForm.querySelectorAll('input');
    inputFields.forEach(function (input) {
        input.value = '';
    });

    // Remove dynamically added email list items, keep the first one
    var listItems = innerForm.querySelectorAll('li');
    for (var i = listItems.length - 1; i > 0; i--) {
        listItems[i].remove();
    }
    // var required_objdata = modalobjlist.filter(item => item.orderid == orderId);

    $('#innerForm').hide();
}


$("#recplist").on("click", ".settings-form-elements", function (event) {
    event.preventDefault();
    const resolvedIndex = resolveSettingsIndex(this);
    openRecipientSettings(resolvedIndex);
});

function openRecipientSettings(targetIndex) {
    let normalizedIndex = (typeof targetIndex === 'number' && targetIndex >= 0) ? targetIndex : parseInt(targetIndex, 10);
    if (Number.isNaN(normalizedIndex) || normalizedIndex < 0) {
        normalizedIndex = 0;
    }

    orderId = normalizedIndex;
    OrderZero = (normalizedIndex === 0);

    resetModalState();

    const recipientUserData = userDataResponses[orderId];
    if (!recipientUserData || Object.keys(recipientUserData).length === 0) {
        toastr.error('Please add a valid recipient email and organization before opening recipient settings.');
        return;
    }

    var isInitialRequired = $('#RecpientList_' + orderId + '__Initial').prop("checked");

    var required_objdata = modalobjlist.filter(item => item.orderid == orderId);
    if (required_objdata.length > 0) {
        $('#signatureMandatory').prop('checked', required_objdata[0].signatureMandatory);
        $('#allowComments').prop('checked', required_objdata[0].allowComments);
        $('#anyoneSign').prop('checked', required_objdata[0].allowanyonesign);

        if (isInitialRequired && required_objdata[0].allowanyonesign == true) {
            $('#anyoneSignDiv_0').css('display', 'none');
            $('#anyoneSign').prop('checked', false);
            $('#anyoneSign').prop('disabled', true);
        }
        if (isInitialRequired == false && required_objdata[0].allowanyonesign == true) {
            $('#anyoneSignDiv_0').css('display', 'flex');
            $('#anyoneSign').prop('disabled', false);
        }
        if (isInitialRequired == false && required_objdata[0].allowanyonesign == false) {
            $('#anyoneSignDiv_0').css('display', 'flex');
            $('#anyoneSign').prop('disabled', false);
        }
        if (isInitialRequired) {
            $('#anyoneSignDiv_0').css('display', 'none');
            $('#anyoneSign').prop('checked', false);
            $('#anyoneSign').prop('disabled', true);
        }
    }

    var allSignaturesRequired = $("#AllSignatoriesRequired").prop("checked");
    if (allSignaturesRequired) {
        $('#signatureMandatory').prop('checked', true)
        $('#signatureMandatory').prop('disabled', true);
    }
    var hasdelegationfalg = recipientUserData.hasDelegation;
    if (hasdelegationfalg) {
        $('#anyoneSignDiv_0').css('display', 'none');
    } else {
        $('#anyoneSignDiv_0').css('display', 'flex');
    }

    var allowanyonesign = $("#anyoneSign").prop("checked");
    if (allowanyonesign) {
        $('#innerForm').show();
        populateInnerForm(orderId);
    } else {
        $('#innerForm').hide();
    }

    $("#settings_Modal").show();
}

window.showSettingsModal = function (id) {
    openRecipientSettings(id);
}

function generateInputFields(orderId) {

    var alternativeemailslist_val = alternateSignatoriesList[orderId] || [];
    var innerForm = document.getElementById('innerForm');

    // Clear existing list items
    innerForm.querySelector('ul').innerHTML = '';

    alternativeemailslist_val.forEach((emailObj, index) => {
        var listItem = document.createElement('li');
        listItem.style.padding = '5px';
        listItem.id = `email_${index}`;
        if ($(window).width() < 768) {
            listItem.innerHTML = `
                                                                                                                                                                                                                                                                                                                                                                                                                                                <div class="form-row align-items-center">
                                                                                                                                                                                                                                                                                                                                                                                                                                                    <div class="col-auto">
                                                                                                                                                                                                                                                                                                                                                                                                                                                        <div class="form-group">
                                                                                                                                                                                                                                                                                                                                                                                                                                                            <div class="email-input-container">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                <input asp-for="signatoriesEmailId" id="Email_${index}" type="email" class="form-control email-input1"  name="emailInput" value="${emailObj.email}">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                <span asp-validation-for="signatoriesEmailId" class="text-danger errorMessage"></span>
                                                                                                                                                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                    <button type="button" class="btn btn-outline-danger ml-2 form-inline-element removeAlternateEmail" style="display: ${index === 0 ? 'none' : 'inline-block'};">
                                                                                                                                                                                                                                                                                                                                                                                                                                                        <i class="fa fa-minus"></i>
                                                                                                                                                                                                                                                                                                                                                                                                                                                    </button>
                                                                                                                                                                                                                                                                                                                                                                                                                                                            <button type="button" class=" btn btn-primary ml-2 form-inline-element text-center addAlternateEmail">
                                                                                                                                                                                                                                                                                                                                                                                                                                                            <i class="fa fa-plus-circle" aria-hidden="true"></i>

                                                                                                                                                                                                                                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                            `;

        } else {
            listItem.innerHTML = `
                                                                                                                                                                                                                                                                                                                                                                                                                                                        <div class="form-row align-items-center">
                                                                                                                                                                                                                                                                                                                                                                                                                                                            <div class="col-auto">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                <div class="form-group">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <div class="email-input-container">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <input asp-for="signatoriesEmailId" id="Email_${index}" type="email" class="form-control email-input1"  name="emailInput" style="width:271px;" value="${emailObj.email}">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <span asp-validation-for="signatoriesEmailId" class="text-danger errorMessage"></span>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                            <button type="button" class="btn btn-outline-danger ml-2 form-inline-element removeAlternateEmail" style="display: ${index === 0 ? 'none' : 'inline-block'};">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                <i class="fa fa-minus"></i>
                                                                                                                                                                                                                                                                                                                                                                                                                                                            </button>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                             <button type="button" class=" btn btn-primary ml-2 form-inline-element text-center addAlternateEmail">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                             <i class="fa fa-plus-circle" aria-hidden="true"></i>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                    `;

        }

        innerForm.querySelector('ul').appendChild(listItem);
    });

    // Show or hide the form based on whether there are any emails
    innerForm.style.display = alternativeemailslist_val.length > 0 ? 'block' : 'none';
}

function populateInnerForm(orderId) {



    var alternativeemailslist_val = alternateSignatoriesList[orderId] || [];
    if (alternativeemailslist_val.length > 1) {
        generateInputFields(orderId);
    }


    var innerForm = document.getElementById('innerForm');
    var listItems = innerForm.querySelectorAll('li');
    var inputFields = innerForm.querySelectorAll('input');

    inputFields.forEach((input, index) => {
        if (alternativeemailslist_val[index] && alternativeemailslist_val[index].email !== undefined) {
            input.value = alternativeemailslist_val[index].email;
            input.style.display = 'block';
        } else {
            input.style.display = 'none';
        }
    });

    if (alternativeemailslist_val.length > 1) {
        var firstRow = listItems[0];
        var addButton = firstRow.querySelector('.addAlternateEmail');
        var removeButton = firstRow.querySelector('.removeAlternateEmail');
        removeButton.style.display = 'inline-block';
        addButton.style.display = 'none';
    } else {
        var firstRow = listItems[0];
        var addButton = firstRow.querySelector('.addAlternateEmail');
        var removeButton = firstRow.querySelector('.removeAlternateEmail');
        removeButton.style.display = 'none';
        addButton.style.display = 'inline-block';
    }
}
function validateAlternateEmailobj(settingsIndex, selectedorg) {
    var alternativeSignatories_obj = {
        bool: true,
        alt_list: []
    };
    $('.email-input1').each(function () {
        var trimmedemaildata = ($(this).val() || '').trim();
        var emaildata = trimmedemaildata;
        var isEseal = $("#RecpientList_" + settingsIndex + "__Eseal").prop("checked");

        if (emaildata === "") {
            toastr.error(`Please enter a valid email`);
            alternativeSignatories_obj.bool = false;
            return false; // Exit early
        }

        if (emaildata === loginEmail) {
            // showCustomAlert(`Cannot assign to the owner of the document`);
            toastr.error(`Cannot assign to the owner of the document`);
            alternativeSignatories_obj.bool = false;
            return false; // Exit early
        }

        if (!isEseal && !selectedorg.employee_list.includes(emaildata)) {
            // showCustomAlert(`Sorry, the assigned signatory does not belong to the selected organization`);
            toastr.error(`Sorry, the assigned signatory does not belong to the selected organization`);
            alternativeSignatories_obj.bool = false;
            return false; // Exit early
        }

        if (isEseal && !selectedorg.eseal_employee_list.includes(emaildata)) {
            // showCustomAlert(`Selected signatory does not have e-seal permission`);
            toastr.error(`Selected signatory does not have e-seal permission`);
            alternativeSignatories_obj.bool = false;
            return false; // Exit early
        }

        // If all checks pass, continue
        alternativeSignatories_obj.alt_list.push(emaildata); // Add email to the alt_list
    });

    return alternativeSignatories_obj;
}

function validateAlternateEmail(settingsIndex, selectedorg) {
    var isAlternateEmailsValid = true;
    var emailValidFlag = false;
    var row_email = '';
    var alternativeSignatories_obj = {
        bool: false,
        alt_list: []
    };
    $('.email-input1').each(function () {
        var trimmedEmaildata = ($(this).val() || '').trim();
        var emaildata = trimmedEmaildata;
        var isError = true;
        var isEmailMatched = false;
        var isEsealEmailMatched = false;
        var selectedListdata = [];
        var isEseal = $("#RecpientList_" + settingsIndex + "__Eseal").prop("checked");

        // Check if email is entered
        if (emaildata === "") {
            // showCustomAlert(`Please enter a valid email`);
            toastr.error(`Please enter a valid email`);
            isAlternateEmailsValid = false;
            return false; // Exit early
        }

        // Check if email matches loginEmail
        if (emaildata === loginEmail) {

            // showCustomAlert(`Cannot assign to the owner of the document`);
            toastr.error(`Cannot assign to the owner of the document`);
            isAlternateEmailsValid = false;
            return false; // Exit early
        }

        // Check if email matches any employee_list or eseal_employee_list
        $('.email').each(function () {
            var email = this.value;
            row_email = email;

            var orgDtos = responses[settingsIndex];

            var matchedOrg = selectedorg;
            if (matchedOrg) {
                selectedListdata.push(matchedOrg);
            }
            if (row_email == emaildata) {
                emailValidFlag = true;
            }
        });

        if (emailValidFlag) {
            // showCustomAlert(`Sorry a signatory cannot assign himself as alternative signatory`);
            toastr.error(`Sorry a signatory cannot assign himself as alternative signatory`);
            isAlternateEmailsValid = false;
            return false; // Exit early

        }

        console.log(orderId);

        for (let i = 0; i < alternateSignatoriesList.length; i++) {
            // Skip the element at the orderId index
            if (i === orderId) {
                continue;
            }

            let signatories = alternateSignatoriesList[i];
            for (let j = 0; j < signatories.length; j++) {
                console.log(signatories[j].email);
                if (signatories[j].email === emaildata) {
                    // showCustomAlert(`Sorry, this user is already an alternative signatory`);
                    toastr.error(`Sorry, this user is already an alternative signatory`);
                    isAlternateEmailsValid = false;
                    return false; // Exit early
                }
            }
        }

        var selfEmails = userDataResponses[settingsIndex];
        var emailArray = selfEmails.emailList.split(',');

        if (userDataResponses[settingsIndex].rowEmail === emaildata) {

            // showCustomAlert(`Sorry, you cannot assign yourself as alternative signatory`);
            toastr.error(`Sorry, you cannot assign yourself as alternative signatory`);
            isAlternateEmailsValid = false;
            return false; // Exit early
        }


        var anyonesign_val = $("#anyoneSign").prop("checked");

        selectedListdata.forEach(function (data) {
            if (data.orgName === 'Self' && data.orgUid.trim() === "") {
                isError = false;
                isEmailMatched = true;
            } else {
                if (data.employee_list && data.employee_list.includes(emaildata)) {
                    if ((isEseal && data.eseal_employee_list) && (!data.eseal_employee_list.includes(emaildata))) {
                        isError = true;
                        isEsealEmailMatched = true;
                    }
                    else {
                        isError = false;
                        isEmailMatched = true;
                    }
                }
                else if (emaildata == "" && !anyonesign_val) {
                    isError = false;
                    isEmailMatched = true;
                }
            }
        });

        if (isError) {
            if (isEmailMatched) {
                // showCustomAlert(`Sorry assigned signatory does not belong to the selected organization`);
                toastr.error(`Sorry assigned signatory does not belong to the selected organization`);
            } else if (isEsealEmailMatched) {
                //showCustomAlert(`Selected signatory does not have e-seal permission`);
                toastr.error(`Selected signatory does not have e-seal permission`);
            } else if (emailArray.includes(emaildata)) {
                // showCustomAlert(`Login email matches one of the self emails.`);
                toastr.error(`Login email matches one of the self emails.`);
                console.log("Login email matches one of the self emails.");
            } else {
                // showCustomAlert(`Sorry assigned signatory does not belongs to selected organization`);
                toastr.error(`Sorry assigned signatory does not belongs to selected organization`);
            }
            isAlternateEmailsValid = false;
            return false; // Exit early
        } else {
            $(this).siblings('.text-danger').text('').hide(); // Hide error message
        }
    });

    if (!isAlternateEmailsValid) {
        return alternativeSignatories_obj; // Don't proceed if emails are not valid
    }

    alternativeSignatories_obj.bool = true;
    return alternativeSignatories_obj;
}





function addNewList() {
    listCount++;
    var $ul = $("#innerForm ul");
    var $prevLi = $ul.find('li:last');
    var newLi = $("<li id='email_" + listCount + "' style='padding:5px;'>").html(
        '<div class="row form-row">' +
        '<div class="col-8 col-sm-9">' +
        '<div class="form-group">' + // Added container for input and error message
        '<div class="email-input-container" style="width:100%;">' +
        '<input asp-for="signatoriesEmailId" id="Email_' + alternateSignatoriesCounter + '" type="email" style="width:100%;" class="form-control email-input1" name="emailInput_' + alternateSignatoriesCounter + '" placeholder="E-Mail" >' + // Added placeholder and style here
        '<span asp-validation-for="signatoriesEmailId" class="text-danger errorMessage"></span>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<button type="button" class=" btn btn-danger removeAlternateEmail">' +
        '<i class="fa fa-minus" aria-hidden="true"></i>' +
        '</button>&nbsp;&nbsp;' +
        // '<div class="col-auto">' +
        '<button type="button" class=" btn btn-primary text-center addAlternateEmail addAlternateEmail">' +
        '<i class="fa fa-plus-circle" aria-hidden="true"></i>' +
        '</button>&nbsp;' +
        //'</div>' +
        '</div>'
    );

    $ul.append(newLi);

    var $prevLi = newLi.prev('li');
    if (alternateSignatoriesCounter === 2) {
        $prevLi.find('.addAlternateEmail').hide();
        $prevLi.find('.removeAlternateEmail').show();
    } else {
        if ($ul.children('li').length == 2) {
            $prevLi.find('.removeAlternateEmail').hide();
        } else {
            $prevLi.find('.addAlternateEmail').hide();
            $prevLi.find('.removeAlternateEmail').show();
        }
    }
}

$("#innerForm").on("click", ".addAlternateEmail", function () {
    settingsButtonIndexorderId = orderId
    var modalobjdata_val = modalobjSelectedorglist.find(item => item.orderid === orderId);
    var validity_response = validateAlternateEmail(settingsButtonIndexorderId, modalobjdata_val.selectedorg)
    if (validity_response.bool == true) {
        alternateSignatoriesCounter++;
        addNewList();
    }
});


// Event handler for the minus button click
$("#innerForm ul").on("click", ".removeAlternateEmail", function () {


    var $li = $(this).closest('li');
    var isLastItem = $li.is(":last-child");
    var isFirstItem = $li.is(":first-child");
    var isListLengthTwo = $("#innerForm ul li").length === 2;
    if (isFirstItem && isListLengthTwo) {
        var $nextLi = $li.next('li');
        $nextLi.find('.removeAlternateEmail').hide();
        $li.remove();
    } else if (isFirstItem) {
        $li.remove();
    } else if (isLastItem) {
        var $prevLi = $li.prev('li');

        if (alternateSignatoriesCounter === 2) {
            $prevLi.find('.removeAlternateEmail').hide();
        }

        $prevLi.find('.addAlternateEmail').show();
        $li.remove();
    } else {
        $li.remove();
    }
    alternateSignatoriesCounter--;
});


$("#Eseal_Required").on("change", function () {
    if (this.checked) {
        // E-Seal logic
    } else {
        persistOrganizationDropdownState(id);
    }
    toggleQRCODEVisibility();
    updateQuickSignVisibility();
});




$("#QrCodeRequired").on("change", function () {
    toggleQRCODEVisibility();
    updateQuickSignVisibility();
});

$("#InitialRequired").on("change", function () {

    toggleInitialVisibility();

    var isInitialRequired = $("#InitialRequired").prop("checked");
    if (isInitialRequired == false) {
        $('.allInitial-checkbox').prop('checked', false);
        $('#AllSignatoriesRequired').prop('checked', false).trigger('change');
        $('#AllSignatoriesRequired').prop('disabled', false);
    }
    else { //true
        $('#AllSignatoriesRequired').prop('checked', true).trigger('change');
        $('#AllSignatoriesRequired').prop('disabled', true);
    }
    updateQuickSignVisibility();
});

function findDuplicates(emailList) {
    const seen = {};
    const duplicates = [];

    emailList.forEach(email => {
        if (seen[email]) {
            if (!duplicates.includes(email)) {
                duplicates.push(email);
            }
        } else {
            seen[email] = true;
        }
    });

    return duplicates;
}

const recipientSelectors = {
    list: '#recipientsList',
    card: '.recipient-card',
    legacyRow: '.recp',
    emailInput: '.recipient-email, .form-control.email, .email',
    accountSelect: '.account-select, .organizationDropdownSelect',
    mandatoryToggle: '[data-field="mandatory"] input, .recipient-toggle.mandatory input',
    initialsToggle: '[data-field="initials"] input, .allInitial-checkbox',
    esealToggle: '[data-field="eseal"] input, .recipient-toggle.eseal input',
    commentsToggle: '[data-field="comments"] input',
    reviewToggle: '[data-field="review"] input',
    alternateRow: '.alternate-email-row input'
};

const recipientCardConfig = {
    countLabel: '#recipientCount',
    addButton: '#addRecipientBtn',
    initializedKey: '__recipientModuleInitialized'
};

let recipientUidCounter = 0;

function nextRecipientUid() {
    recipientUidCounter += 1;
    return `recipient-${Date.now()}-${recipientUidCounter}`;
}

function escapeHtmlAttr(value) {
    if (value === null || value === undefined) {
        return '';
    }
    return String(value).replace(/"/g, '&quot;');
}

function getOrganizationEntry(orderId) {
    if (!Array.isArray(organizationobjlist)) {
        return null;
    }
    const direct = organizationobjlist[orderId];
    if (direct && typeof direct === 'object' && direct.orderid === orderId) {
        return direct;
    }
    return organizationobjlist.find(entry => entry && entry.orderid === orderId) || null;
}

function persistOrganizationDropdownState(orderId) {
    if (typeof orderId !== 'number' || orderId < 0) {
        return;
    }
    const entry = getOrganizationEntry(orderId);
    if (!entry) {
        return;
    }
    const $dropdown = $('#organizationDropdown_' + orderId);
    if (!$dropdown.length) {
        return;
    }
    const options = [];
    $dropdown.find('option').each(function () {
        options.push({
            value: this.value,
            text: $(this).text(),
            selected: this.selected
        });
    });
    entry.renderedOptions = options;
}

function shouldShowSettingsButton(orderId) {
    const userData = userDataResponses[orderId];
    const hasUserData = userData && typeof userData === 'object' && Object.keys(userData).length > 0 && !!userData.rowEmail;
    const orgEntry = getOrganizationEntry(orderId);
    const hasOrganizations = orgEntry && Array.isArray(orgEntry.orgList) && orgEntry.orgList.length > 0;
    return hasUserData && hasOrganizations;
}

function buildOrganizationOptionsHtml(orderId, accountUid) {
    const normalizedValue = (accountUid || '').trim();
    const entry = getOrganizationEntry(orderId);

    if (entry && Array.isArray(entry.renderedOptions) && entry.renderedOptions.length > 0) {
        return entry.renderedOptions.map(opt => {
            const value = opt.value || '';
            const isSelected = opt.selected === true || (normalizedValue && normalizedValue === value.trim());
            return `<option value="${escapeHtmlAttr(value)}"${isSelected ? ' selected' : ''}>${escapeHtmlAttr(opt.text || 'Choose Account')}</option>`;
        }).join('');
    }

    const options = ['<option value="">Choose Account</option>'];
    const sourceList = (entry && Array.isArray(entry.orgList)) ? entry.orgList : [];
    sourceList.forEach(org => {
        if (!org || typeof org !== 'object') {
            return;
        }
        const value = org.orgUid || '';
        const label = org.orgName || 'Account';
        const isSelected = normalizedValue && normalizedValue === value.trim();
        options.push(`<option value="${escapeHtmlAttr(value)}"${isSelected ? ' selected' : ''}>${escapeHtmlAttr(label)}</option>`);
    });
    return options.join('');
}

function resolveSettingsIndex(element) {
    if (!element) {
        return 0;
    }
    const datasetValue = element.getAttribute && element.getAttribute('data-settings-index');
    if (datasetValue !== null && datasetValue !== undefined && datasetValue !== '') {
        const parsed = parseInt(datasetValue, 10);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }
    const id = element.id || '';
    if (id.indexOf('_') !== -1) {
        const parsed = parseInt(id.split('_')[1], 10);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }
    return 0;
}

function createRecipientState(overrides) {
    const base = {
        uid: nextRecipientUid(),
        email: '',
        name: '',
        accountUid: '',
        accountName: '',
        mandatory: true,
        initialsRequired: false,
        esealRequired: false,
        allowComments: false,
        allowReview: false,
        anyoneSign: false,
        order: (Array.isArray(window.recipients) ? window.recipients.length : 0) + 1,
        alternateEmails: []
    };
    return Object.assign(base, overrides || {});
}

function buildRecipientCard(recipient, index) {
    const order = index + 1;
    const emailValue = recipient.email || '';
    const emailLabel = emailValue || 'Enter recipient email';
    const accountUid = recipient.accountUid || '';
    const loaderBaseUrl = (typeof appBaseUrl !== 'undefined' && appBaseUrl) ? appBaseUrl : '/';
    const orderInputId = `RecpientList_${index}__Order`;
    const emailInputId = `RecpientList_${index}__Email`;
    const esealInputId = `RecpientList_${index}__Eseal`;
    const initialInputId = `RecpientList_${index}__Initial`;
    const settingsButtonId = index === 0 ? 'settings' : `settings_${index}`;
    const settingsContainerId = index === 0 ? 'settingsButtonLi' : `settingsButtonLi_${index}`;
    const esealDisplay = $('.esealCheckBox').prop('checked') ? 'flex' : 'none';
    const initialDisplay = $('.initialCheckBox').prop('checked') ? 'flex' : 'none';
    const selectOptionsHtml = buildOrganizationOptionsHtml(index, accountUid);
    const settingsClassName = shouldShowSettingsButton(index) ? 'settingsButtonLi' : 'settingsButtonLi classshide';

    // Determine if recipient is required (mandatory) or optional
    const isMandatory = recipient.mandatory !== false;
    const requiredActive = isMandatory ? 'active' : '';
    const optionalActive = isMandatory ? '' : 'active';

    const cardAttributes = [
        `data-uid="${escapeHtmlAttr(recipient.uid)}"`,
        `data-email="${escapeHtmlAttr(emailValue)}"`,
        `data-account-uid="${escapeHtmlAttr(accountUid)}"`,
        `data-account-name="${escapeHtmlAttr(recipient.accountName || '')}"`,
        `data-order="${order}"`,
        `data-index="${index}"`,
        `data-mandatory="${recipient.mandatory !== false}"`,
        `data-initials-required="${recipient.initialsRequired === true}"`,
        `data-eseal-required="${recipient.esealRequired === true}"`
    ].join(' ');

    return `
        <div class="recipient-card recp" ${cardAttributes} id="recipient_card_${index}" draggable="true">
            <input type="hidden" class="orderId" id="${orderInputId}" name="RecpientList[${index}].Order" value="${order}" data-val="true" data-val-required="The Order field is required.">
            
            <!-- Card Header: Order, Email (left) | Status Toggle (right) -->
            <div class="recipient-header">
                <div class="recipient-order">
                    <div class="recipient-drag-handle" title="Drag to reorder">
                        <i class="fa fa-grip-vertical"></i>
                    </div>
                    <span class="order-badge">${order}</span>
                    <span class="recipient-email-label">${escapeHtmlAttr(emailLabel)}</span>
                </div>
                <div class="recipient-status-toggle" id="statusToggle_${index}" data-recipient-index="${index}">
                    <button type="button" class="status-option required-opt ${requiredActive}" data-value="required">
                        <i class="fa fa-check-circle"></i>
                        <span>REQUIRED</span>
                    </button>
                    <button type="button" class="status-option optional-opt ${optionalActive}" data-value="optional">
                        OPTIONAL
                    </button>
                </div>
            </div>

            <!-- Card Body: Email Input + Account + Actions -->
            <div class="recipient-body">
                <div class="recipient-field-group">
                    <label class="recipient-field-label">RECIPIENT EMAIL</label>
                    <div class="recipient-email-wrap">
                        <input class="form-input recipient-email email" type="text" id="${emailInputId}" name="RecpientList[${index}].Email" value="${escapeHtmlAttr(emailValue)}" autocomplete="off" placeholder="Enter email address" data-val="true" data-val-regex="Please enter valid email" data-val-required="The Email field is required.">
                        <span class="text-danger classshide">Please enter valid E-Mail address</span>
                    </div>
                </div>
                <div class="recipient-field-group account-field-group">
                    <label class="recipient-field-label">ACCOUNT</label>
                    <div class="account-row">
                        <div class="recipient-account-dropdown organizationDropdown">
                            <div class="account-wrapper">
                                <div class="selctloader">
                                    <select class="account-select organizationDropdownSelect" id="organizationDropdown_${index}" data-recipient-index="${index}">
                                        ${selectOptionsHtml}
                                    </select>
                                    <div class="loader" style="display:none;height:18px;">
                                        <img src="${loaderBaseUrl}img/icon/loaderGif.gif" alt="loading">
                                    </div>
                                </div>
                                <i class="fa fa-chevron-down"></i>
                            </div>
                        </div>
                        <div class="recipient-inline-actions">
                            <div class="${settingsClassName}" id="${settingsContainerId}">
                                <button type="button" class="btn-icon-action btn-settings settings-form-elements" id="${settingsButtonId}" data-settings-index="${index}" title="Settings">
                                    <i class="fa fa-cog"></i>
                                </button>
                            </div>
                            <button type="button" class="btn-icon-action remove-recipient" title="Remove recipient" aria-label="Remove recipient">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Card Footer: eSeal & Initials Toggles -->
            <div class="recipient-toggles">
                <label class="recipient-toggle eseal esealcheck" data-field="esealRequired" style="display:${esealDisplay};">
                    <span class="toggle-switch">
                        <input type="checkbox" id="${esealInputId}" onchange="esealUserCheckBox(${index})" ${recipient.esealRequired ? 'checked' : ''}>
                        <span class="toggle-slider"><span class="toggle-knob"></span></span>
                    </span>
                    <span class="toggle-label">eSeal</span>
                </label>
                <label class="recipient-toggle initial initialcheck" data-field="initialsRequired" style="display:${initialDisplay};">
                    <span class="toggle-switch">
                        <input type="checkbox" class="allInitial-checkbox" id="${initialInputId}" onchange="initialCheckBox(${index})" ${recipient.initialsRequired ? 'checked' : ''}>
                        <span class="toggle-slider"><span class="toggle-knob"></span></span>
                    </span>
                    <span class="toggle-label">Initials</span>
                </label>
            </div>
        </div>
    `;
}

/**
 * Updates the Required/Optional status badge on a recipient card
 * @param {number} index - The recipient index
 * @param {boolean} isMandatory - Whether the recipient is mandatory (required)
 */
function updateRecipientStatusBadge(index, isMandatory) {
    const $toggle = $(`#statusToggle_${index}`);
    if (!$toggle.length) return;

    const $card = $(`#recipient_card_${index}`);

    // Update toggle button states
    $toggle.find('.status-option').removeClass('active');
    if (isMandatory) {
        $toggle.find('.required-opt').addClass('active');
        $card.attr('data-mandatory', 'true');
    } else {
        $toggle.find('.optional-opt').addClass('active');
        $card.attr('data-mandatory', 'false');
    }
}

// Expose function globally
window.updateRecipientStatusBadge = updateRecipientStatusBadge;

/**
 * SINGLE SOURCE OF TRUTH: Updates all recipient count displays
 * This function derives ALL counts from window.recipients array and updates:
 * - Left panel badge: Recipients (X)
 * - Right badge total: Required: N of X
 * - All related displays
 * 
 * Call this function after ANY mutation to window.recipients array.
 * 
 * DERIVATION RULES (from requirements):
 * - totalCount = window.recipients.length
 * - mandatoryCount = window.recipients.filter(r => r.mandatory !== false).length
 * - Badge displays: "Required: mandatoryCount of totalCount"
 */
function updateRecipientCountLabel() {
    // DERIVE from single source of truth: window.recipients
    const totalCount = Array.isArray(window.recipients) ? window.recipients.length : 0;
    const mandatoryCount = getMandatoryRecipientCount();

    // 1. Update left panel badge: Recipients (X)
    $(recipientCardConfig.countLabel).text(totalCount);
    $('#recipientCount').text(totalCount);

    // 2. Update right badge "Required: N of X" - the total part
    $('#totalRecipientsCount').text(totalCount);
    $('#minSignaturesDisplay .edit-total-count').text(totalCount);

    // 3. DERIVED required count = mandatoryCount (recipients where mandatory !== false)
    // This is the SINGLE SOURCE OF TRUTH for "Required: N of X"
    // The mandatoryCount IS the required count - no separate storage needed
    const derivedRequired = mandatoryCount;

    // 4. Update required count in all places (derived from mandatory recipients)
    const $hiddenInput = $('#RequiredSignatureInput');
    $hiddenInput.val(derivedRequired);
    $('#minSigInput').val(derivedRequired);
    $('#requiredSignaturesCount').text(derivedRequired);

    // 5. Update global variable for backward compatibility
    numberofsignatures = derivedRequired.toString();

    // 6. Update PerpareDocumentContext
    if (typeof PerpareDocumentContext === 'object' && PerpareDocumentContext !== null) {
        PerpareDocumentContext.signaturesRequiredCount = derivedRequired;
    }

    // 7. Update badge visual state (all-required, all-optional, mixed)
    updateMinSignaturesBadgeState();

    // 8. Update legacy AllSignatoriesRequired checkbox
    // All required when every recipient is mandatory
    const allRequired = (mandatoryCount === totalCount && totalCount > 0);
    $('#AllSignatoriesRequired').prop('checked', allRequired);

    // 9. Update workflow mode options visibility based on recipient count
    // NOTE: Call updateWorkflowMode but avoid infinite loop - it should not call back here
    updateWorkflowMode();
}

function renderRecipientCards(options) {
    const opts = Object.assign({ preserveFocus: false, focusIndex: null }, options || {});
    ensureRecipientGlobals();
    const $list = $(recipientSelectors.list);
    if (!$list.length) {
        return;
    }

    const activeElementId = opts.preserveFocus && document.activeElement ? document.activeElement.id : null;
    const focusIndex = typeof opts.focusIndex === 'number' ? opts.focusIndex : null;

    const cardsHtml = (window.recipients || []).map(function (rec, idx) {
        rec.order = idx + 1;
        return buildRecipientCard(rec, idx);
    }).join('');

    syncLegacyOrderIds();

    $list.html(cardsHtml);
    updateRecipientCountLabel();
    if (!isModernRecipientLayoutActive() && typeof handleResponsiveLayout === 'function') {
        handleResponsiveLayout();
    }

    if (focusIndex !== null) {
        const focusInput = document.getElementById(`RecpientList_${focusIndex}__Email`);
        if (focusInput) {
            focusInput.focus();
            focusInput.setSelectionRange(focusInput.value.length, focusInput.value.length);
            return;
        }
    }

    if (opts.preserveFocus && activeElementId) {
        const nextEl = document.getElementById(activeElementId);
        if (nextEl) {
            nextEl.focus();
            const len = nextEl.value ? nextEl.value.length : 0;
            if (typeof nextEl.setSelectionRange === 'function') {
                nextEl.setSelectionRange(len, len);
            }
        }
    }
}

function insertLegacyPlaceholders(index) {
    const targets = ['userDataResponses', 'responses', 'organizationobjlist', 'modalobjlist', 'alternateSignatoriesList', 'modalobjSelectedorglist'];
    targets.forEach(function (key) {
        if (!Array.isArray(window[key])) {
            window[key] = [];
        }
        window[key].splice(index, 0, {});
    });
}

function removeLegacyIndex(index) {
    const targets = ['userDataResponses', 'responses', 'organizationobjlist', 'modalobjlist', 'alternateSignatoriesList', 'modalobjSelectedorglist'];
    targets.forEach(function (key) {
        const arr = window[key];
        if (Array.isArray(arr)) {
            arr.splice(index, 1);
        }
    });
}

function swapLegacyIndices(i, j) {
    const targets = ['userDataResponses', 'responses', 'organizationobjlist', 'modalobjlist', 'alternateSignatoriesList', 'modalobjSelectedorglist'];
    targets.forEach(function (key) {
        const arr = window[key];
        if (Array.isArray(arr)) {
            const temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    });
}

function addRecipientCard(options) {
    const opts = Object.assign({ render: true }, options || {});
    ensureRecipientGlobals();
    window.recipients = Array.isArray(window.recipients) ? window.recipients : [];
    const newRecipient = createRecipientState(opts.data || {});
    window.recipients.push(newRecipient);
    insertLegacyPlaceholders(window.recipients.length - 1);
    if (opts.render !== false) {
        // renderRecipientCards calls updateRecipientCountLabel which syncs all displays
        renderRecipientCards({ focusIndex: window.recipients.length - 1 });
    }

    return newRecipient;
}

function resolveCardIndexFromElement(element) {
    if (element && element.getAttribute) {
        const directValue = element.getAttribute('data-recipient-index');
        if (directValue !== null && directValue !== undefined && directValue !== '') {
            const parsed = Number(directValue);
            if (!Number.isNaN(parsed)) {
                return parsed;
            }
        }
    }
    const $card = $(element).closest(recipientSelectors.card);
    if (!$card.length) {
        return null;
    }
    const idx = Number($card.attr('data-index'));
    return Number.isNaN(idx) ? null : idx;
}

function removeRecipientAtIndex(index) {
    ensureRecipientGlobals();
    if (!Array.isArray(window.recipients) || index < 0 || index >= window.recipients.length) {
        return;
    }
    window.recipients.splice(index, 1);
    removeLegacyIndex(index);
    // renderRecipientCards calls updateRecipientCountLabel which syncs all displays
    renderRecipientCards({ preserveFocus: true });
}

function moveRecipientCard(index, direction) {
    ensureRecipientGlobals();
    if (!Array.isArray(window.recipients) || window.recipients.length < 2) {
        return;
    }
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= window.recipients.length) {
        return;
    }
    const temp = window.recipients[index];
    window.recipients[index] = window.recipients[targetIndex];
    window.recipients[targetIndex] = temp;
    swapLegacyIndices(index, targetIndex);
    renderRecipientCards({ preserveFocus: true });
}

function resetRecipientCards() {
    window.recipients = [];
    ['userDataResponses', 'responses', 'organizationobjlist', 'modalobjlist', 'alternateSignatoriesList', 'modalobjSelectedorglist'].forEach(function (key) {
        if (Array.isArray(window[key])) {
            window[key] = [];
        }
    });
    $(recipientSelectors.list).empty();
    // updateRecipientCountLabel syncs all displays and calls updateWorkflowMode
    updateRecipientCountLabel();
}

function bindRecipientCardEvents() {
    if (window[recipientCardConfig.initializedKey]) {
        return;
    }
    const $list = $(recipientSelectors.list);
    if ($list.length) {
        $list.on('click', '.move-up', function (event) {
            event.preventDefault();
            const idx = resolveCardIndexFromElement(this);
            if (idx !== null) {
                moveRecipientCard(idx, -1);
            }
        });
        $list.on('click', '.move-down', function (event) {
            event.preventDefault();
            const idx = resolveCardIndexFromElement(this);
            if (idx !== null) {
                moveRecipientCard(idx, 1);
            }
        });
        $list.on('click', '.remove-recipient', function (event) {
            event.preventDefault();
            const idx = resolveCardIndexFromElement(this);
            if (idx !== null) {
                removeRecipientAtIndex(idx);
            }
        });
        // Status toggle (Required/Optional) click handler
        $list.on('click', '.status-option', function (event) {
            event.preventDefault();
            event.stopPropagation();
            const $toggle = $(this).closest('.recipient-status-toggle');
            const idx = parseInt($toggle.data('recipient-index'), 10);
            const value = $(this).data('value');
            const isMandatory = (value === 'required');

            // Update visual state immediately
            $toggle.find('.status-option').removeClass('active');
            $(this).addClass('active');

            // Update ONLY window.recipients[idx].mandatory - this is the single source of truth
            if (!isNaN(idx) && Array.isArray(window.recipients) && window.recipients[idx]) {
                window.recipients[idx].mandatory = isMandatory;

                // Update card data attribute for CSS/DOM consistency
                const $card = $(this).closest('.recipient-card');
                $card.attr('data-mandatory', isMandatory);

                // Sync with legacy modalobjlist for backward compatibility
                if (Array.isArray(window.modalobjlist)) {
                    const existingEntry = window.modalobjlist.find(item => item && item.orderid === idx);
                    if (existingEntry) {
                        existingEntry.signatureMandatory = isMandatory;
                    } else {
                        window.modalobjlist[idx] = {
                            orderid: idx,
                            signatureMandatory: isMandatory,
                            allowComments: false,
                            allowanyonesign: false
                        };
                    }
                }

                // Sync with syncRecipientSettings for complete legacy support
                if (typeof syncRecipientSettings === 'function') {
                    syncRecipientSettings(idx, { signatureMandatory: isMandatory });
                }

                // SINGLE SOURCE OF TRUTH: updateRecipientCountLabel() derives ALL counts
                // from window.recipients and updates all UI elements
                updateRecipientCountLabel();
            }
        });
        $list.on('input', '.recipient-email', function () {
            const idx = resolveCardIndexFromElement(this);
            if (idx !== null && Array.isArray(window.recipients) && window.recipients[idx]) {
                const value = ($(this).val() || '').trim();
                window.recipients[idx].email = value;
                $(this).closest('.recipient-card').find('.recipient-email-label').text(value || 'Enter recipient email');
            }
        });
        $list.on('change', '.recipient-toggle input', function () {
            const idx = resolveCardIndexFromElement(this);
            if (idx === null || !Array.isArray(window.recipients) || !window.recipients[idx]) {
                return;
            }
            const $toggle = $(this).closest('.recipient-toggle');
            const field = $toggle.data('field');
            if (field) {
                window.recipients[idx][field] = $(this).is(':checked');
                // For mandatory field changes, update all derived UI from single source of truth
                if (field === 'mandatory') {
                    updateRecipientCountLabel();
                }
            }
        });
        $list.on('change', '.organizationDropdownSelect', async function (event) {
            const idx = resolveCardIndexFromElement(this);
            const syncRecipientAccount = () => {
                if (idx !== null && Array.isArray(window.recipients) && window.recipients[idx]) {
                    const selectedOption = $(this).find('option:selected');
                    window.recipients[idx].accountUid = $(this).val() || '';
                    window.recipients[idx].accountName = selectedOption.text() || '';
                }
            };

            syncRecipientAccount();

            if (typeof idx === 'number' && typeof handleOrganizationSelection === 'function') {
                try {
                    await handleOrganizationSelection(event, idx);
                } finally {
                    syncRecipientAccount();
                    persistOrganizationDropdownState(idx);
                }
            } else if (typeof idx === 'number') {
                persistOrganizationDropdownState(idx);
            }
        });
    }
    window[recipientCardConfig.initializedKey] = true;
}

function initializeRecipientCards() {
    ensureRecipientGlobals();
    bindRecipientCardEvents();
    initializeDragAndDrop(); // Initialize drag & drop functionality
    const multiEnabled = $('#addSignatoriesCheckbox').is(':checked');
    if (multiEnabled) {
        renderRecipientCards({ preserveFocus: true });
    } else {
        resetRecipientCards();
    }
}

window.addRecipientCard = addRecipientCard;
window.renderRecipientCards = renderRecipientCards;
window.resetRecipientCards = resetRecipientCards;
window.removeRecipientAtIndex = removeRecipientAtIndex;
window.resolveCardIndexFromElement = resolveCardIndexFromElement;
window.setSigningMode = setSigningMode;
window.getSigningModeType = getSigningModeType;
window.updateMinSignaturesDisplay = updateMinSignaturesDisplay;
window.getMandatoryRecipientCount = getMandatoryRecipientCount;
window.getMinRequiredSignatures = getMinRequiredSignatures;
window.setMinRequiredSignatures = setMinRequiredSignatures;
window.addRecipient = function () {
    // Implicit mode: simply add a recipient - mode is determined by recipient count
    addRecipientCard();

    // Ensure the add signatories checkbox is checked
    if (!$('#addSignatoriesCheckbox').is(':checked')) {
        $('#addSignatoriesCheckbox').prop('checked', true);
        applyAddSignatoriesState(true);
    }
};

function coerceBoolean(value, fallback = false) {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        const normalized = value.toLowerCase().trim();
        if (['true', '1', 'yes', 'on'].includes(normalized)) {
            return true;
        }
        if (['false', '0', 'no', 'off'].includes(normalized)) {
            return false;
        }
    }
    if (typeof value === 'number') {
        return value === 1;
    }
    return fallback;
}

function ensureRecipientGlobals() {
    if (typeof window.recipients === 'undefined') {
        window.recipients = [];
    }
    if (typeof window.settingsMap === 'undefined') {
        window.settingsMap = {};
    }
    if (typeof window.organizationMap === 'undefined') {
        window.organizationMap = {};
    }
    if (!Array.isArray(window.userDataResponses)) {
        window.userDataResponses = [];
    }
    if (!Array.isArray(window.responses)) {
        window.responses = [];
    }
    if (!Array.isArray(window.organizationobjlist)) {
        window.organizationobjlist = [];
    }
    if (!Array.isArray(window.modalobjlist)) {
        window.modalobjlist = [];
    }
    if (!Array.isArray(window.alternateSignatoriesList)) {
        window.alternateSignatoriesList = [];
    }
    if (!Array.isArray(window.modalobjSelectedorglist)) {
        window.modalobjSelectedorglist = [];
    }
}

function syncLegacyOrderIds() {
    const targetKeys = ['organizationobjlist', 'modalobjlist', 'modalobjSelectedorglist'];
    targetKeys.forEach(function (key) {
        const collection = window[key];
        if (!Array.isArray(collection)) {
            return;
        }
        collection.forEach(function (entry, index) {
            if (entry && typeof entry === 'object') {
                entry.orderid = index;
            }
        });
    });
}

function syncRecipientAlternateEmails(orderId) {
    ensureRecipientGlobals();
    const index = Number(orderId);
    if (!Array.isArray(window.recipients) || Number.isNaN(index) || index < 0) {
        return;
    }
    const recipient = window.recipients[index];
    if (!recipient) {
        return;
    }
    if (!Array.isArray(window.alternateSignatoriesList)) {
        window.alternateSignatoriesList = [];
    }
    const alternates = Array.isArray(window.alternateSignatoriesList[index])
        ? window.alternateSignatoriesList[index].map(function (entry) {
            if (!entry) {
                return entry;
            }
            if (typeof entry === 'string') {
                return { email: entry };
            }
            return Object.assign({}, entry);
        })
        : [];
    recipient.alternateEmails = alternates;
}

function syncRecipientSettings(orderId, settings) {
    ensureRecipientGlobals();
    const index = Number(orderId);
    if (!Array.isArray(window.recipients) || Number.isNaN(index) || index < 0) {
        return;
    }
    const recipient = window.recipients[index];
    if (!recipient || !recipient.uid) {
        return;
    }
    const uid = recipient.uid;
    const baseSettings = window.settingsMap[uid] || {};
    window.settingsMap[uid] = Object.assign({}, baseSettings, settings || {});
}

function readValue($scope, selectorList) {
    const selectors = Array.isArray(selectorList) ? selectorList : [selectorList];
    for (let i = 0; i < selectors.length; i++) {
        const selector = selectors[i];
        if (!selector) {
            continue;
        }
        const $target = $scope.find(selector);
        if ($target.length) {
            const val = $target.val();
            if (typeof val !== 'undefined' && val !== null) {
                return val;
            }
        }
    }
    return undefined;
}

function readBoolean($scope, selectorList, fallback = false) {
    const selectors = Array.isArray(selectorList) ? selectorList : [selectorList];
    for (let i = 0; i < selectors.length; i++) {
        const selector = selectors[i];
        if (!selector) {
            continue;
        }
        const $target = $scope.find(selector);
        if ($target.length) {
            if ($target.is(':checkbox')) {
                return $target.is(':checked');
            }
            const dataChecked = $target.data('checked');
            if (typeof dataChecked !== 'undefined') {
                return coerceBoolean(dataChecked, fallback);
            }
        }
    }
    return fallback;
}

function normalizeRecipientFromState(rec, index) {
    if (!rec || typeof rec !== 'object') {
        return null;
    }

    const altEmails = Array.isArray(rec.alternateEmails) ? rec.alternateEmails : [];

    return {
        source: 'state',
        uid: rec.uid || rec.id || `recipient-${index + 1}`,
        order: rec.order || rec.index || index + 1,
        email: (rec.email || rec.emailAddress || rec.primaryEmail || '').toString().trim(),
        name: rec.name || rec.fullName || '',
        accountUid: (rec.accountUid || rec.orgUid || rec.organizationUid || '').toString().trim(),
        accountName: rec.accountName || rec.orgName || rec.organizationName || '',
        mandatory: coerceBoolean(rec.mandatory ?? rec.signatureMandatory, true),
        initialsRequired: coerceBoolean(rec.initialsRequired ?? rec.initial ?? rec.initialRequired, false),
        esealRequired: coerceBoolean(rec.esealRequired ?? rec.eseal ?? rec.esealRequiredToggle, false),
        allowComments: coerceBoolean(rec.allowComments ?? rec.commentsAllowed, false),
        allowReview: coerceBoolean(rec.allowReview ?? rec.reviewAllowed, false),
        anyoneSign: coerceBoolean(rec.anyoneSign, false),
        alternateEmails: altEmails,
        templateId: rec.signatureTemplateId || rec.templateId || null
    };
}

function normalizeRecipientFromCard($card, index) {
    const data = $card.data() || {};
    const emailFromData = data.email || data.emailAddress;
    const altEmailsData = Array.isArray(data.alternateEmails) ? data.alternateEmails : [];
    return {
        source: 'card',
        uid: data.uid || data.id || `card-${index + 1}`,
        order: data.order || Number($card.attr('data-order')) || index + 1,
        email: (emailFromData || readValue($card, recipientSelectors.emailInput) || '').toString().trim(),
        name: data.name || '',
        accountUid: (data.accountUid || data.orgUid || readValue($card, recipientSelectors.accountSelect) || '').toString().trim(),
        accountName: data.accountName || data.orgName || ($card.find(recipientSelectors.accountSelect + ' option:selected').text() || ''),
        mandatory: coerceBoolean(data.mandatory, readBoolean($card, recipientSelectors.mandatoryToggle, true)),
        initialsRequired: coerceBoolean(data.initialsRequired, readBoolean($card, recipientSelectors.initialsToggle, false)),
        esealRequired: coerceBoolean(data.esealRequired, readBoolean($card, recipientSelectors.esealToggle, false)),
        allowComments: coerceBoolean(data.allowComments, readBoolean($card, recipientSelectors.commentsToggle, false)),
        allowReview: coerceBoolean(data.allowReview, readBoolean($card, recipientSelectors.reviewToggle, false)),
        anyoneSign: coerceBoolean(data.anyoneSign, false),
        alternateEmails: altEmailsData
    };
}

function normalizeRecipientFromLegacyRow($row, index) {
    const email = ($row.find('.email').val() || '').toString().trim();
    const $orgSelect = $row.find('.organizationDropdownSelect');
    const orgUid = ($orgSelect.val() || '').toString().trim();
    const orgName = $orgSelect.find('option:selected').text() || '';
    return {
        source: 'legacy',
        uid: $row.attr('id') ? `legacy-${$row.attr('id')}` : `legacy-${index + 1}`,
        order: Number($row.find('.orderId').val()) || index + 1,
        email,
        name: '',
        accountUid: orgUid,
        accountName: orgName,
        mandatory: true,
        initialsRequired: $row.find('.allInitial-checkbox').is(':checked'),
        esealRequired: $row.find(`#RecpientList_${index}__Eseal`).is(':checked'),
        allowComments: false,
        allowReview: false,
        anyoneSign: false,
        alternateEmails: []
    };
}

function captureRecipientState() {
    ensureRecipientGlobals();
    const normalized = [];

    if (Array.isArray(window.recipients) && window.recipients.length) {
        window.recipients.forEach((rec, index) => {
            const normalizedRec = normalizeRecipientFromState(rec, index);
            if (normalizedRec && normalizedRec.email) {
                normalized.push(normalizedRec);
            }
        });
    }

    if (normalized.length === 0) {
        const $cards = $(recipientSelectors.list).find(recipientSelectors.card);
        if ($cards.length) {
            $cards.each(function (idx) {
                const normalizedRec = normalizeRecipientFromCard($(this), idx);
                if (normalizedRec && normalizedRec.email) {
                    normalized.push(normalizedRec);
                }
            });
        }
    }

    if (normalized.length === 0) {
        const $legacyRows = $(recipientSelectors.legacyRow);
        $legacyRows.each(function (idx) {
            const normalizedRec = normalizeRecipientFromLegacyRow($(this), idx);
            if (normalizedRec && normalizedRec.email) {
                normalized.push(normalizedRec);
            }
        });
    }

    return normalized.sort((a, b) => (a.order || 0) - (b.order || 0));
}

async function gatherRecipients(options) {
    const defaultOptions = {
        hydrateLegacy: true
    };
    const opts = Object.assign({}, defaultOptions, options);
    ensureRecipientGlobals();

    const response = {
        ok: true,
        message: '',
        recipients: [],
        mode: 'SELF_SIGN'
    };

    try {
        const normalized = captureRecipientState();
        const addSignatoriesChecked = $('#addSignatoriesCheckbox').prop('checked');
        const recipientCount = normalized.length;

        if (recipientCount === 0) {
            response.mode = 'SELF_SIGN';
            if (!opts.hydrateLegacy) {
                return response;
            }
            await hydrateSelfRecipientContext();
            return response;
        }

        if (!addSignatoriesChecked && recipientCount > 0) {
            response.ok = false;
            response.message = 'Multi-recipient workflow is disabled. Enable signatories to continue.';
            return response;
        }

        const seenEmails = new Set();
        for (let i = 0; i < normalized.length; i++) {
            const rec = normalized[i];
            if (!rec.email) {
                response.ok = false;
                response.message = 'Email is required for each recipient.';
                break;
            }
            const lowerEmail = rec.email.toLowerCase();
            if (seenEmails.has(lowerEmail)) {
                response.ok = false;
                response.message = 'Duplicate recipients detected. Each email must be unique.';
                break;
            }
            seenEmails.add(lowerEmail);

            if (!rec.accountUid && $('#addSignatoriesCheckbox').prop('checked')) {
                response.ok = false;
                response.message = `Please choose account for ${rec.email}`;
                break;
            }
        }

        if (!response.ok) {
            return response;
        }

        response.mode = 'MULTI_SIGN';
        response.recipients = normalized;

        if (opts.hydrateLegacy) {
            await hydrateMultiRecipientContext(normalized);
        }

        return response;
    } catch (error) {
        console.error('gatherRecipients failed:', error);
        return {
            ok: false,
            message: error && error.message ? error.message : 'Unable to gather recipients',
            recipients: [],
            mode: 'SELF_SIGN'
        };
    }
}

async function hydrateMultiRecipientContext(recipientRecords) {
    ensureRecipientGlobals();
    window.alternateSignatoriesList = [];
    window.modalobjlist = [];
    window.modalobjSelectedorglist = Array.isArray(window.modalobjSelectedorglist) ? window.modalobjSelectedorglist : [];

    recipientRecords.forEach((rec, index) => {
        window.settingsMap[rec.uid] = Object.assign({}, window.settingsMap[rec.uid], {
            signatureMandatory: rec.mandatory !== false,
            allowComments: !!rec.allowComments,
            anyoneSign: !!rec.anyoneSign
        });
    });

    await adaptRecipientsToLegacyStructure({ recipients: recipientRecords });

    PerpareDocumentContext.receipientEmails = [];
    PerpareDocumentContext.MultiSign = true;

    recipientRecords.forEach((rec, index) => {
        const fallbackOrgList = (window.organizationobjlist[index] && window.organizationobjlist[index].orgList) || [];
        const orgDtos = (Array.isArray(window.responses[index]) && window.responses[index].length > 0) ? window.responses[index] : fallbackOrgList;
        const userProfile = window.userDataResponses[index] || {};
        const selectedOrg = orgDtos.find(org => org.orgUid && rec.accountUid && org.orgUid.trim() === rec.accountUid.trim()) || orgDtos[0] || fallbackOrgList[0] || {
            orgUid: rec.accountUid || ' ',
            orgName: rec.accountName || 'Self',
            initial: ''
        };

        if (!rec.accountUid && selectedOrg.orgUid) {
            rec.accountUid = selectedOrg.orgUid;
        }
        if (!rec.accountName && selectedOrg.orgName) {
            rec.accountName = selectedOrg.orgName;
        }

        const alternateEmails = Array.isArray(rec.alternateEmails) ? rec.alternateEmails : [];
        const normalizedAlternate = alternateEmails.map((alt, altIndex) => {
            if (typeof alt === 'string') {
                return { email: alt, index: altIndex };
            }
            return Object.assign({ index: altIndex }, alt);
        });

        window.alternateSignatoriesList[index] = normalizedAlternate;
        syncRecipientAlternateEmails(index);
        window.modalobjlist[index] = {
            orderid: index,
            signatureMandatory: rec.mandatory !== false,
            allowComments: !!rec.allowComments,
            allowanyonesign: !!rec.anyoneSign
        };
        window.modalobjSelectedorglist[index] = {
            orderid: index,
            selectedorg: selectedOrg
        };

        const esealEnabled = !!rec.esealRequired;
        const initialEnabled = !!rec.initialsRequired;

        const legacyEntry = {
            index: Math.random(),
            order: rec.order || index + 1,
            email: rec.email,
            eseal: esealEnabled,
            initial: initialEnabled,
            orgUid: rec.accountUid || (selectedOrg.orgUid || ''),
            orgName: rec.accountName || selectedOrg.orgName || '',
            orgList: orgDtos,
            originallist: orgDtos,
            selectedList: selectedOrg && selectedOrg.orgUid ? [selectedOrg] : [],
            suid: userProfile.suid || null,
            self_emails: userProfile.emailList || [],
            alernateSignatories: '',
            alternateSignatoriesList: normalizedAlternate,
            name: userProfile.name || rec.name || (rec.email ? rec.email.split('@')[0] : ''),
            thumbnailImage: userProfile.thumbnailImage || userProfile.selfieThumbnail || null,
            hasDelegation: !!userProfile.hasDelegation,
            delegationId: userProfile.delegationId || null,
            initialImage: initialEnabled && selectedOrg ? selectedOrg.initial : null
        };

        PerpareDocumentContext.receipientEmails.push(legacyEntry);
    });
}

async function hydrateSelfRecipientContext() {
    ensureRecipientGlobals();
    window.userDataResponses = [];
    window.responses = [];
    window.organizationobjlist = [];
    window.modalobjlist = [];
    window.modalobjSelectedorglist = [];
    window.alternateSignatoriesList = [];
    PerpareDocumentContext.receipientEmails = [];
    PerpareDocumentContext.MultiSign = false;

    const isInitialReq = $('#InitialRequired').prop('checked');
    const isEsealReq = $('#Eseal_Required').prop('checked');

    const delegationReq = {
        id: loginorgUid,
        suid: loginSuid,
        email: loginEmail
    };

    const delegationResponse = await handle_delegation_orgid_suid_selfloginuser(delegationReq);
    const hasDelegation = delegationResponse && Array.isArray(delegationResponse.listdata) && delegationResponse.listdata.length > 0;
    const delegationId = hasDelegation ? delegationResponse.delegateeid : '';

    const entry = {
        order: 1,
        email: loginEmail,
        suid: loginSuid,
        name: loginName,
        initial: isInitialReq,
        eseal: isEsealReq,
        self_emails: Array.isArray(loginUserDetails) && loginUserDetails[0] ? loginUserDetails[0].emailList || [] : [],
        thumbnailImage: Array.isArray(loginUserDetails) && loginUserDetails[0] ? loginUserDetails[0].selfieThumbnail || null : null,
        alernateSignatories: '',
        alternateSignatoriesList: [],
        orgUid: (loginorgUid || '').trim(),
        orgName: loginorgName || 'Self',
        hasDelegation,
        delegationId
    };

    PerpareDocumentContext.receipientEmails.push(entry);
}

/**
 * CRITICAL ADAPTER: Converts modern recipients[] array to legacy data structures
 * This function MUST be called before Continue handler logic to populate:
 * - userDataResponses[]: User profile data from OrgDetailsByEmail
 * - responses[]: Organization DTOs from OrgDetailsByEmail
 * - organizationobjlist[]: Dropdown structure for organization selection
 * - modalobjlist[]: Settings data for each recipient
 * - alternateSignatoriesList[]: Alternate signatory data
 */
async function adaptRecipientsToLegacyStructure(recipientData) {
    const recipients = recipientData.recipients;
    const gw = (typeof window !== 'undefined') ? window : {};

    // Ensure legacy arrays exist on window and clear them locally
    gw.userDataResponses = Array.isArray(gw.userDataResponses) ? [] : [];
    gw.responses = Array.isArray(gw.responses) ? [] : [];
    gw.organizationobjlist = Array.isArray(gw.organizationobjlist) ? [] : [];
    gw.modalobjlist = Array.isArray(gw.modalobjlist) ? [] : [];
    gw.alternateSignatoriesList = Array.isArray(gw.alternateSignatoriesList) ? [] : [];

    // Iterate each recipient and fetch org details
    for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        const orderId = i;

        try {
            // Call OrgDetailsByEmail API to get user profile and org list
            const response = await $.ajax({
                type: "POST",
                url: OrgDetailsByEmail,
                data: { email: recipient.email }
            });

            if (response.success === false) {
                throw new Error(response.message || 'Failed to fetch organization details');
            }

            // Populate userDataResponses[i] with user profile (store on window)
            const userdetails = response.userProfile || {};
            userdetails.rowEmail = recipient.email;

            // Populate critical legacy fields from userProfile
            userdetails.hasDelegation = userdetails.hasDelegation || false;
            userdetails.delegationId = userdetails.delegationId || null;
            userdetails.suid = userdetails.suid || null;
            userdetails.thumbnailImage = userdetails.thumbnailImage || null;
            userdetails.emailList = userdetails.emailList || [];
            userdetails.name = userdetails.name || recipient.email.split('@')[0];

            gw.userDataResponses[orderId] = userdetails;

            // Populate responses[i] with org DTOs
            const organizations = response.orgDtos || [];
            gw.responses[orderId] = organizations;

            // Populate organizationobjlist[i] with dropdown structure
            let orgList = [];
            if (organizations.length === 0) {
                // No orgs = Self only
                const selfObj = {
                    employee_list: [],
                    eseal_employee_list: [],
                    has_eseal_permission: false,
                    orgName: 'Self',
                    orgUid: ' ',
                    initial: ''
                };
                orgList.push(selfObj);
            } else {
                orgList = organizations;
            }

            const orgobj = {
                orderid: orderId,
                orgList: orgList,
                originalList: orgList,
                selectedorgList: []
            };
            gw.organizationobjlist[orderId] = orgobj;

            // Populate modalobjlist[i] with settings from modern settingsMap
            const settings = (typeof settingsMap !== 'undefined' ? settingsMap[recipient.uid] : (window && window.settingsMap ? window.settingsMap[recipient.uid] : undefined)) || {};
            const modalObj = {
                orderid: orderId,
                signatureMandatory: settings.signatureMandatory !== false,
                allowComments: settings.allowComments === true,
                anyoneSign: settings.anyoneSign === true
            };
            gw.modalobjlist[orderId] = modalObj;

            // Populate alternateSignatoriesList[i] if present
            const alternateEmails = recipient.alternateEmails || [];
            gw.alternateSignatoriesList[orderId] = alternateEmails.map((altEmail, idx) => {
                if (typeof altEmail === 'string') {
                    return { email: altEmail, index: idx };
                }
                if (altEmail && typeof altEmail === 'object') {
                    return Object.assign({ index: idx }, altEmail);
                }
                return { email: '', index: idx };
            });
            syncRecipientAlternateEmails(orderId);

            // Store alternate signatories in userDataResponses
            if (gw.userDataResponses[orderId]) {
                gw.userDataResponses[orderId].alternateSignatoriesList = gw.alternateSignatoriesList[orderId];
            }

        } catch (error) {
            console.error(`Failed to adapt recipient ${recipient.email}:`, error);
            throw error;
        }
    }

    console.log('Adapter completed:', {
        userDataResponses: gw.userDataResponses,
        responses: gw.responses,
        organizationobjlist: gw.organizationobjlist,
        modalobjlist: gw.modalobjlist,
        alternateSignatoriesList: gw.alternateSignatoriesList
    });

    return true;
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
                signtempid: preview_req_data?.signtempid !== undefined ? preview_req_data.signtempid : 1
            },
            beforeSend: function () {
                //$('#overlay').show();  // Show loading overlay
                document.getElementById("navigationNetworkOverlay").style.display = "flex";
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

function PrepareDocument() {
    // Ensure PDF container exists before proceeding
    const container = (typeof window !== 'undefined' && window.pdfContainer) ||
        document.getElementById('pdf-container') ||
        document.querySelector('#pdf-container');

    if (!container) {
        console.error('[PrepareDocument] PDF container #pdf-container not found in DOM');
        safeToastrError('Viewer container not found. Please refresh the page.');
        document.getElementById("navigationNetworkOverlay").style.display = "none";
        return;
    }

    console.log('[PrepareDocument] Starting document preparation...');
    console.log('[PrepareDocument] PDF container found:', container.id);

    var imgdata = '';
    var imgdata1 = '';
    var imgdata2 = '';
    var imgdata_others = '';
    var imgdata1_others = '';



    var sigimgdataval_others = 'data:image/png;base64,' + signature_img_others;
    imgdata = sigimgdataval_others;
    var img_others = new Image();
    img_others.src = imgdata;
    img_others.onload = function () {
        const width = img_others.width;
        const height = img_others.height;
        signature_dimensions_others = {
            width: width,
            height: height,
        }

    };

    var sigimgdataval = 'data:image/png;base64,' + signature_img;
    imgdata = sigimgdataval;
    const img = new Image();
    img.src = imgdata;
    img.onload = function () {
        const width = img.width;
        const height = img.height;
        signature_dimensions = {
            width: width,
            height: height,
        }

    };

    var esealimgdataval_others = 'data:image/png;base64,' + eseal_img_others;
    imgdata1_others = esealimgdataval_others;
    var img1_others = new Image();
    img1_others.src = imgdata1_others;
    img1_others.onload = function () {
        const width = img1_others.width;
        const height = img1_others.height;
        eseal_dimensions_others = {
            width: width,
            height: height,
        }

    };
    var esealimgdataval = 'data:image/png;base64,' + eseal_img;
    imgdata1 = esealimgdataval;
    const img1 = new Image();
    img1.src = imgdata1;
    img1.onload = function () {
        const width = img1.width;
        const height = img1.height;
        eseal_dimensions = {
            width: width,
            height: height,
        }

    };
    var imgdata3 = '';
    if (initialImg.startsWith("data:image")) {
        var initialimgdataval = initialImg;
    } else {
        var initialimgdataval = 'data:image/png;base64,' + initialImg;
    }
    imgdata3 = initialimgdataval;
    const img3 = new Image();
    img3.src = imgdata3;
    img3.onload = function () {
        const width = img3.width;
        const height = img3.height;
        initial_dimensions = {
            width: width,
            height: height,
        }

    };

    var imgdata4 = '';
    var initialimgdataval_others = 'data:image/png;base64,' + initialImg_others;
    imgdata4 = initialimgdataval_others;
    const img4 = new Image();
    img4.src = imgdata4;
    img4.onload = function () {
        const width = img4.width;
        const height = img4.height;
        initial_dimensions_others = {
            width: width,
            height: height,
        }

    };
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
    let docusers = PerpareDocumentContext.receipientEmails;
    PerpareDocumentContext.receipientEmailsList = [];

    let recpfieldcount = Object.values(docusers).map((user) => {
        return {
            email: user.email,
            thumbnailImage: user.thumbnailImage,
            initialImage: user.initialImage,
            hasDelegation: user.hasDelegation,
            alternateSignatoriesList: user.alternateSignatoriesList,
            count: 0
        };
    });

    if (recpfieldcount.length > 0) {
        PerpareDocumentContext.receipientEmailsList = recpfieldcount;
    }

    $('#emailList').empty();

    PerpareDocumentContext.receipientEmailsList.map((item, index) => {
        console.log(item);
        var selected = (index == 0) ? "selected" : "";
        let thumbnailSrc = `data:image/jpeg;base64,${item.thumbnailImage}`; // Assuming thumbnailImage is already base64 encoded
        //$("#emailList").append(`<li class="list ${selected}" onclick="toggleRecepientSelection('${item.email}')"><span><img src="${thumbnailSrc}"  class="initial" alt="Thumbnail" /></span>${item.email}</li>`);
        // Assuming item has a hasDelegation property
        $("#emailList").append(`
                                                                                                                                                                                                                                                                                                                                                                                                                    <li class="list ${selected}"
                                                                                                                                                                                                                                                                                                                                                                                                                        data-initial-image="${item.initialImage}"
                                                                                                                                                                                                                                                                                                                                                                                                                        data-email-initial="${item.email}"
                                                                                                                                                                                                                                                                                                                                                                                                                        onclick="toggleRecepientSelection('${item.email}', '${item.initialImage}')"
                                                                                                                                                                                                                                                                                                                                                                                                                                style="cursor: pointer; ">
                                                                                                                                                                                                                                                                                                                                                                                                                        <span>
                                                                                                                                                                                                                                                                                                                                                                                                                            <img src="${thumbnailSrc}" class="initial ${selected ? 'selected1' : ''}" alt="Thumbnail" style="margin-left:10px;" />
                                                                                                                                                                                                                                                                                                                                                                                                                        </span>
                                                                                                                                                                                                                                                                                                                                                                                                                         <div>
                                                                                                                                                                                                                                                                                                                                                                                                                            <span style="display: inline-block; ${item.hasDelegation ? 'text-decoration-line: line-through; -webkit-text-decoration-line: line-through; text-decoration-color: rgba(0, 0, 0, 0.2);' : ''}">
                                                                                                                                                                                                                                                                                                                                                                                                                            ${item.email}
                                                                                                                                                                                                                                                                                                                                                                                                                        </span>
                                                                                                                                                                                                                                                                                                                                                                                                                            ${item.hasDelegation ? `<a href="#" onclick="showDelegateeInfo('${item.email}'); return false;" style="font-size: 11px; color: #acc33e !important; display: flex; margin-top: -5px;">Click here for delegatee info</a>` : ''}
                                                                                                                                                                                                                                                                                                                                                                                                                        </div>

                                                                                                                                                                                                                                                                                                                                                                                                                    </li>
                                                                                                                                                                                                                                                                                                                                                                                                                `);




    });

    var selectedUserEmail = PerpareDocumentContext.selectuser;


    if (PerpareDocumentContext.MultiSign == true) {
        var userObj = PerpareDocumentContext.receipientEmails.find(x => x.email == selectedUserEmail)
        if (userObj.initial) {
            $("#Initial").removeClass("classshide");
        } else {
            $("#Initial").addClass("classshide");
        }
        // Ensure signatories panel is visible for multi-sign
        $("#signatoriesfieldbox").show();
    } else {
        // Hide signatories panel for self-sign
        $("#signatoriesfieldbox").hide();
    }




    var addSignatoriesCheckbox = $('#addSignatoriesCheckbox');
    var isChecked = addSignatoriesCheckbox.prop('checked');
    if (isChecked) {
        $('#Send').removeClass("classshide");
    } else {
        $('#Save').removeClass("classshide");
    }
    document.getElementById("navigationNetworkOverlay").style.display = "none";
    $('#createDoc').addClass("classshide");
    $('#viwer').removeClass("classshide");

    // Validate filebase64 exists and is not empty
    var filebase64Input = document.getElementById('filebase64');
    if (!filebase64Input) {
        console.error('[PrepareDocument] filebase64 input element not found');
        safeToastrError('File upload error. Please refresh and try again.');
        $('#createDoc').removeClass("classshide");
        $('#viwer').addClass("classshide");
        return;
    }

    var filebase64 = filebase64Input.value;
    if (!filebase64 || filebase64.trim() === '') {
        console.error('[PrepareDocument] filebase64 is empty or undefined');
        console.log('[PrepareDocument] filebase64 value:', filebase64);
        safeToastrError('No file data found. Please upload a file first.');
        $('#createDoc').removeClass("classshide");
        $('#viwer').addClass("classshide");
        return;
    }

    console.log('[PrepareDocument] Base64 data length:', filebase64.length);
    processfile(filebase64);
}

$("#Continue").off('click.documentFlow').on("click.documentFlow", async function (e) {
    document.getElementById("navigationNetworkOverlay").style.display = "flex";
    console.log(modalobjlist);
    var addSignatoriesCheckbox = $('#addSignatoriesCheckbox');
    initialsDelete = false;
    var isChecked = addSignatoriesCheckbox.prop('checked');
    var isEsealChecked = $("#Eseal_Required").prop("checked");
    var emailInput = $("#RecpientList_0__Email");
    if (emailInput.length > 0 && !isChecked) {
        emailInput.val(loginEmail);

    }

    if (!isFileUploaded) {
        document.getElementById("navigationNetworkOverlay").style.display = "none";
        toastr.error('Please Upload the file');
        e.preventDefault();
        return;
    }
    var docname = $('#DocumentName').val().trim();
    if (docname === '' || docname === null) {

        document.getElementById("navigationNetworkOverlay").style.display = "none";
        toastr.error(`Please enter a document name`);
        e.preventDefault();
        return;
    }
    var daystoComplete = $('#DaysToComplete').val();
    var daystoCompleteInt = parseInt(daystoComplete, 10);
    var daysToCompleteError = document.getElementById('daysToCompleteError');
    if (daystoComplete === '') {
        // showCustomAlert(`Please enter number days to complete`);
        document.getElementById("navigationNetworkOverlay").style.display = "none";
        //toastr.error(`Please enter number days to complete`);
        daysToCompleteError.innerText = 'Please enter days in range of 2 to 6';
        e.preventDefault();
        return;
    }
    if (daystoComplete === 0 || daystoCompleteInt < 2 || daystoCompleteInt > 6) {
        document.getElementById("navigationNetworkOverlay").style.display = "none";

        daysToCompleteError.innerText = 'Please enter days in range of 2 to 6';
        e.preventDefault();
        return;
    }


    var requiredsignsvalue = $("#RequiredSignatureInput").val();
    if (requiredsignsvalue == "") {

        document.getElementById("navigationNetworkOverlay").style.display = "none";
        toastr.error(`Please enter number of signatures required`);
        e.preventDefault();
        return;
    }
    var isEmailsValid = true;
    $('.email').each(function () {
        if (!validateEmail(this)) {
            document.getElementById("navigationNetworkOverlay").style.display = "none";
            isEmailsValid = false;
        }
    });


    if (!isEmailsValid) {
        return;
    }

    const gatherResult = await gatherRecipients({ hydrateLegacy: true });
    if (!gatherResult.ok) {
        document.getElementById("navigationNetworkOverlay").style.display = "none";
        if (gatherResult.message) {
            toastr.error(gatherResult.message);
        }
        e.preventDefault();
        return;
    }

    isChecked = gatherResult.mode === 'MULTI_SIGN';
    if (isChecked !== addSignatoriesCheckbox.prop('checked')) {
        addSignatoriesCheckbox.prop('checked', isChecked);
    }

    if (isChecked) {
        PerpareDocumentContext.MultiSign = true;
        if (!Array.isArray(PerpareDocumentContext.receipientEmails) || PerpareDocumentContext.receipientEmails.length === 0) {
            document.getElementById("navigationNetworkOverlay").style.display = "none";
            toastr.error('Please add at least one recipient.');
            e.preventDefault();
            return;
        }

        const hasEsealRecipient = PerpareDocumentContext.receipientEmails.some(rec => !!rec.eseal);
        const hasInitialRecipient = PerpareDocumentContext.receipientEmails.some(rec => !!rec.initial);
        if (hasEsealRecipient) {
            $("#Eseal").removeClass("classshide");
        } else {
            $("#Eseal").addClass("classshide");
        }
        if (hasInitialRecipient) {
            $("#Initial").removeClass("classshide");
        } else {
            $("#Initial").addClass("classshide");
        }

        if ($("#InitialRequired").prop("checked")) {
            const missingInitialRecipient = PerpareDocumentContext.receipientEmails.find(rec => rec.initial === true && (!rec.initialImage || rec.initialImage === null || rec.initialImage === ""));
            if (missingInitialRecipient) {
                document.getElementById("navigationNetworkOverlay").style.display = "none";
                swal({
                    type: 'info',
                    title: 'Info',
                    text: `Initial Image is not present for ${missingInitialRecipient.email} email or selected organization`

                });
                return;
            }
        }

        let QrCodeRequiredval = $("#QrCodeRequired").is(':checked');
        if (QrCodeRequiredval) {
            if (PerpareDocumentContext.receipientEmails.length > 1) {
                document.getElementById("navigationNetworkOverlay").style.display = "none";
                swal({
                    type: 'info',
                    title: 'info',
                    text: `QRCODE is available for single user signing`,

                });
                return;
            } else {
                if (PerpareDocumentContext.receipientEmails[0].orgName === 'Self' || PerpareDocumentContext.receipientEmails[0].orgUid.trim() === '') {
                    document.getElementById("navigationNetworkOverlay").style.display = "none";
                    swal({
                        type: 'info',
                        title: 'info',
                        text: `QRCODE is not available for self account.Please Choose other account`,

                    });
                    return;
                } else {
                    if (QrCodeRequiredval) {
                        $("#QRCODEbutton").removeClass("classshide");
                        $("#qrfield").css('display', 'flex');

                        $('#QrCodeRequired').prop('checked', true);

                    } else {
                        $("#QRCODEbutton").addClass("classshide");
                        $("#qrfield").css('display', 'none');

                        $('#QrCodeRequired').prop('checked', false)

                    }
                }

            }

        }

        var esealOrganizations = {};
        var processShouldStop = false; // Flag to stop the process
        let recipients = [];
        let tempid = document.getElementById('templateSelect').value;
        PerpareDocumentContext.receipientEmails.forEach(function (receipient) {
            if (!receipient.hasDelegation) {
                const temp = {
                    Suid: receipient.suid,
                    OrganizationId: receipient.orgUid,
                    SignatureTemplateId: tempid,
                    email: receipient.email

                }
                recipients.push(temp);
            }
            if (receipient.alternateSignatoriesList) {
                receipient.alternateSignatoriesList.forEach((alternate) => {
                    const temp = {
                        Suid: alternate.suid,
                        OrganizationId: receipient.orgUid,
                        SignatureTemplateId: tempid,
                        email: alternate.email

                    }
                    recipients.push(temp);

                })


            }


            if (receipient.eseal) {
                if (esealOrganizations[receipient.orgName]) {
                    // Display swal if the organization is already found with eseal
                    swal({
                        type: 'info',
                        title: 'info',
                        text: `Multiple recipients from "${receipient.orgName}" have eSeal enabled. Only one recipient per organization can have eSeal.`,

                    });
                    processShouldStop = true;

                } else {
                    esealOrganizations[receipient.orgName] = true;
                }
            }
        });

        // Stop further processing if the flag is set
        if (processShouldStop) {
            document.getElementById("navigationNetworkOverlay").style.display = "none";
            return;
        }
        if (tempid !== "1") {
            const hasEmptyOrgUid = recipients.some(item => item.OrganizationId.trim() === "");
            if (hasEmptyOrgUid) {
                toastr.error(`Only standard Template will be available for self`);
                document.getElementById("navigationNetworkOverlay").style.display = "none";
                return;
            }
            const result = await Processrecipients(recipients);
            if (result.success) {
                const emailsWithTemplate = result.data.filter(item => !item.hasSignatureTemplate).map(item => item.email);

                if (emailsWithTemplate.length > 0) {

                    let resultHTML = "<div style='font-size:1rem; color:black; text-align:left; width:100%;'>";
                    resultHTML += "<ul style='padding-left: 20px; margin: 0;'>";

                    emailsWithTemplate.forEach(item => {
                        resultHTML += `<li style="margin-bottom: 5px; font-weight: lighter;">${item}</li>`;
                    });

                    resultHTML += "</ul></div>";

                    // Show in overlay
                    document.getElementById('visibleInvisibleData1').innerHTML = resultHTML;
                    document.getElementById("navigationNetworkOverlay").style.display = "none";
                    document.getElementById('overlay12').style.display = 'flex';
                    let cancelElement = document.getElementById('okButton3');
                    cancelElement.addEventListener('click', function () {

                        document.getElementById('overlay12').style.display = 'none';


                    });

                    // Stop further processing
                    return;
                }

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


    }
    else {
        PerpareDocumentContext.MultiSign = isChecked;
        var isEseal = $("#Eseal_Required").prop("checked");
        var isInitialReq = $("#InitialRequired").prop("checked");
        var requiresLegacySelfBuild = !Array.isArray(PerpareDocumentContext.receipientEmails) || PerpareDocumentContext.receipientEmails.length === 0;
        if (requiresLegacySelfBuild) {
            console.log("Start of processEmails, isEseal:", isEseal);
            var emailPromises = [];
            var hasDelegationFound = false;
            var delegationid_val = '';
            var delegation_response_val;
            if (loginuserAccount === 'Self') {
                loginorgName = 'Self'
            }

            for (let i = 0; i < $('.email').length; i++) {

                let promise = (async function () {
                    if (hasDelegationFound) {

                        return;
                    }

                    var ownerEmail = $('.email').eq(i).val();
                    var userdataForThumnail = loginUserDetails[i];
                    var loginThumbail = null;
                    var emailList = null;
                    if (ownerEmail === loginEmail) {
                        loginThumbail = userdataForThumnail.selfieThumbnail;
                        emailList = userdataForThumnail.emailList;
                    }
                    var delegation_req_data = {
                        id: loginorgUid,
                        suid: loginSuid,
                        email: loginEmail,
                    };


                    var delegation_response = await handle_delegation_orgid_suid_selfloginuser(delegation_req_data);
                    delegation_response_val = delegation_response;
                    console.log(delegation_response);
                    if (delegation_response != undefined) {
                        if (delegation_response.listdata.length > 0) {
                            hasDelegationFound = true;
                            delegationid_val = delegation_response.delegateeid;
                        } else {
                            delegationid_val = '';
                        }
                    }

                    if (hasDelegationFound) {
                        PerpareDocumentContext.receipientEmails.push({
                            "order": i + 1,
                            "email": ownerEmail,
                            "suid": loginSuid,
                            "name": loginName,
                            "initial": isInitialReq,
                            "eseal": isEseal,
                            "self_emails": emailList,
                            "thumbnailImage": loginThumbail,
                            "alernateSignatories": "",
                            "alternateSignatoriesList": [],
                            "orgUid": loginorgUid,
                            "orgName": loginorgName,
                            "hasDelegation": true,
                            "delegationId": delegationid_val,
                        });

                        // You can break out of the loop early if desired
                        return;
                    } else {
                        PerpareDocumentContext.receipientEmails.push({
                            "order": i + 1,
                            "email": ownerEmail,
                            "suid": loginSuid,
                            "eseal": isEseal,
                            "initial": isInitialReq,
                            "name": loginName,
                            "thumbnailImage": loginThumbail,
                            "alernateSignatories": "",
                            "self_emails": emailList,
                            "alternateSignatoriesList": [],
                            "orgUid": loginorgUid,
                            "orgName": loginorgName,
                            "hasDelegation": false,
                            "delegationId": delegationid_val,
                        });
                    }

                    var isInitial = $("#InitialRequired").prop("checked");
                    if (isInitial) {
                        $("#Initial").removeClass("classshide");
                    } else {
                        $("#Initial").addClass("classshide");
                    }
                })();

                emailPromises.push(promise);

                // If delegation is found, no need to process further
                if (hasDelegationFound) {
                    break; // Exit the loop early
                }
            }

            await Promise.all(emailPromises);
            if (hasDelegationFound) {
                console.log("Delegation found. Further processing stopped.");
                swal({
                    type: 'info',
                    title: 'Info',
                    text: "currently having an active delegation." + "\n" + "Delegatee :" + " " + delegation_response_val.swallist,

                });
                return false;
            }
        }

        if (isEseal) {
            $("#Eseal").removeClass("classshide");
        } else {
            $("#Eseal").addClass("classshide");
        }
        if (isInitialReq) {
            $("#Initial").removeClass("classshide");
        } else {
            $("#Initial").addClass("classshide");
        }

        let tempid = document.getElementById('templateSelect').value;

        let recipients = [];
        const temp = {
            Suid: PerpareDocumentContext.receipientEmails[0].suid,
            OrganizationId: PerpareDocumentContext.receipientEmails[0].orgUid,
            SignatureTemplateId: tempid,
            email: PerpareDocumentContext.receipientEmails[0].email

        }
        recipients.push(temp);

        if (tempid !== "1") {
            const hasEmptyOrgUid = recipients.some(item => item.OrganizationId.trim() === "");
            if (hasEmptyOrgUid) {
                toastr.error(`Only standard Template will be available for self`);
                document.getElementById("navigationNetworkOverlay").style.display = "none";
                return;
            }
            const result = await Processrecipients(recipients);
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

        if (signature_img === "" || (isInitialReq && (initialImg == "" || initialImg == null))) {
            let previewuserobjdata =
            {
                email: PerpareDocumentContext.receipientEmails[0].email,
                suid: PerpareDocumentContext.receipientEmails[0].suid,
                OrganizationId: PerpareDocumentContext.receipientEmails[0].orgUid,
                AccountType: 'self',
                signtempid: tempid

            }
            if (PerpareDocumentContext.receipientEmails[0].orgUid.trim() !== "") {
                previewuserobjdata.AccountType = "organization";
            }

            var previwe_response = await handlePreviewimages(previewuserobjdata);
            if (previwe_response) {
                signature_img = previwe_response.signatureImage;
                eseal_img = previwe_response.esealImage;
                initial_Image = previwe_response.initial;
                if (isInitialReq && (initial_Image == "" || initial_Image == null)) {
                    return swal({
                        type: 'info',
                        title: 'Info',
                        text: `Initial is not present`

                    });
                }
                if (isInitialReq) {
                    initialImg = initial_Image.startsWith(prefix) ? initial_Image.substring(prefix.length) : initial_Image;
                }

            } else {
                console.warn("Processing failed.");
            }
        }

        //if (isInitialReq && (initialImg == "" || initialImg == null)) {
        //    return swal({
        //        type: 'info',
        //        title: 'Info',
        //        text: `Initial is not present`

        //    });

        //}



    }
    var esealcheckboxval = $(".esealCheckBox").prop("checked");
    if (loginesealsignatoryrole === 'False' && esealcheckboxval && !isChecked) {
        document.getElementById("navigationNetworkOverlay").style.display = "none";
        swal({
            type: 'info',
            title: 'Info',
            text: `sorry you don't have eseal permission for logged in organization`

        });
        return false;
    }
    let QrCode_Requiredcheck = $("#QrCodeRequired").is(':checked');
    if (QrCode_Requiredcheck) {
        $("#QRCODEbutton").removeClass("classshide");
        $("#qrfield").css('display', 'contents');

    }
    var mandatorycount = 0;
    var esealusers = 0;
    var initialusers = 0;
    var emailslistvalue = [];

    var emailslistarray = [];
    var suidslistarray = [];
    var alternativesignatoriesobjs = [];
    if (modalobjlist.length > 0) {
        for (let i = 0; i < PerpareDocumentContext.receipientEmails.length; i++) {
            emailslistarray.push(PerpareDocumentContext.receipientEmails[i].email);
            suidslistarray.push(PerpareDocumentContext.receipientEmails[i].suid);
            if (PerpareDocumentContext.receipientEmails[i].hasDelegation) {
                if (PerpareDocumentContext.receipientEmails[i].alternateSignatoriesList.length > 0) {

                    alternativesignatoriesobjs.push(PerpareDocumentContext.receipientEmails[i].alternateSignatoriesList);

                }
            }
            var ordervalue = PerpareDocumentContext.receipientEmails[i].order - 1;
            var required_objdata = modalobjlist.filter(item => item.orderid == ordervalue);
            if (required_objdata[0].signatureMandatory == true) {
                mandatorycount = mandatorycount + 1;
            }
            if (PerpareDocumentContext.receipientEmails[i].eseal == true) {
                esealusers = esealusers + 1;
            }
            if (PerpareDocumentContext.receipientEmails[i].initial == true) {
                initialusers = initialusers + 1;
            }
            if (PerpareDocumentContext.receipientEmails[i].alternateSignatoriesList.length > 0) {
                for (let k = 0; k < PerpareDocumentContext.receipientEmails[i].alternateSignatoriesList.length; k++) {
                    emailslistarray.push(PerpareDocumentContext.receipientEmails[i].alternateSignatoriesList[k].email);
                }
            }
            emailslistvalue.push(PerpareDocumentContext.receipientEmails[i].email);
            PerpareDocumentContext.receipientEmails[i].signatureMandatory = required_objdata[0].signatureMandatory;
            PerpareDocumentContext.receipientEmails[i].allowComments = required_objdata[0].allowComments;
        }
        console.log(alternativesignatoriesobjs);
        const areSignatoriesSame = (obj1, obj2) => {
            return obj1.suid === obj2.suid;
        };
        let matchFound = false;
        if (alternativesignatoriesobjs.length > 0) {
            for (let i = 0; i < alternativesignatoriesobjs.length; i++) {
                for (let j = i + 1; j < alternativesignatoriesobjs.length; j++) {
                    alternativesignatoriesobjs[i].forEach(obj1 => {
                        alternativesignatoriesobjs[j].forEach(obj2 => {
                            if (areSignatoriesSame(obj1, obj2)) {
                                matchFound = true; // Set the flag to stop further execution
                                // Trigger Swal alert if two objects have the same suid
                                document.getElementById("navigationNetworkOverlay").style.display = "none";
                                swal({
                                    title: "Server Message",
                                    text: "Signatories with same delegate not allowed to sign on same document",
                                    icon: "info"
                                }).then(() => {
                                    // Optionally handle post-alert logic if needed
                                    return; // Stop further execution
                                });

                                return; // Stop the current function execution
                            }
                        });
                    });
                }
            }

        }
        //Iterate through the lists to compare objects between different lists
        const uniquesuidslist = [...new Set(suidslistarray)];
        if (suidslistarray.length > uniquesuidslist.length) {
            document.getElementById("navigationNetworkOverlay").style.display = "none";
            toastr.error("Sorry! Email of the subsciber already exists.");
            e.preventDefault();
            return;
        }
        if (PerpareDocumentContext.MultiSign === true) {
            for (let m = 0; m < PerpareDocumentContext.receipientEmails.length; m++) {
                for (let n = 0; n < emailslistarray.length; n++) {
                    if ((PerpareDocumentContext.receipientEmails[m].self_emails.includes(emailslistarray[n])) && (PerpareDocumentContext.receipientEmails[m].email != emailslistarray[n])) {
                        document.getElementById("navigationNetworkOverlay").style.display = "none";
                        toastr.error("Already" + " " + emailslistarray[n] + " " + "a selected signatory");
                        e.preventDefault();
                        return;
                    }
                }
            }
        }
        var allSignaturesRequired = $("#AllSignatoriesRequired").prop("checked");
        if (allSignaturesRequired == false) {
            mandatorycount = 0;
        }
        // Use the centralized function to get min required signatures
        let integer_numberofsignatures = typeof getMinRequiredSignatures === 'function' ? getMinRequiredSignatures() : +numberofsignatures;
        // Skip validation if min is 0 (all optional) - validation will happen on actual signing
        if (integer_numberofsignatures > 0) {
            if ((integer_numberofsignatures > PerpareDocumentContext.receipientEmails.length) && (allSignaturesRequired == false)) {

                document.getElementById("navigationNetworkOverlay").style.display = "none";
                toastr.error(`email list is less than number of required signs`);
                e.preventDefault();
                return;
            }
        }
        if ((integer_numberofsignatures < 0)) {

            document.getElementById("navigationNetworkOverlay").style.display = "none";
            toastr.error(`Please enter number of required signs greater than or equal to 0`);
            e.preventDefault();
            return;
        }
    } else {
        for (let i = 0; i < PerpareDocumentContext.receipientEmails.length; i++) {

            if (PerpareDocumentContext.receipientEmails[i].eseal == true) {
                esealusers = esealusers + 1;
            }
            if (PerpareDocumentContext.receipientEmails[i].initial == true) {
                initialusers = initialusers + 1;
            }
            emailslistvalue.push(PerpareDocumentContext.receipientEmails[i].email);
            var allSignaturesRequired = $("#AllSignatoriesRequired").prop("checked");
            if (allSignaturesRequired) {

                PerpareDocumentContext.receipientEmails[i].signatureMandatory = true;

            } else {
                PerpareDocumentContext.receipientEmails[i].signatureMandatory = false;

            }
            PerpareDocumentContext.receipientEmails[i].allowComments = false;
        }
    }

    console.log(PerpareDocumentContext.receipientEmails);
    for (let i = 0; i < PerpareDocumentContext.receipientEmails.length; i++) {
        // Check if the 'ogruid' property is empty for the current object
        if (PerpareDocumentContext.receipientEmails[i].orgUid.trim() === "" && PerpareDocumentContext.receipientEmails[i].orgName !== 'Self') {
            document.getElementById("navigationNetworkOverlay").style.display = "none";
            toastr.error(`please select organization for ${PerpareDocumentContext.receipientEmails[i].email}`);
            e.preventDefault();
            return;

        }
    }
    const duplicateEmails = findDuplicates(emailslistvalue);

    if (continueFlag == true) {
        return;
    }

    if (duplicateEmails.length > 0) {
        const message = duplicateEmails.join("\n");

        //showCustomAlert(`Already a selected signatory`);
        document.getElementById("navigationNetworkOverlay").style.display = "none";
        toastr.error(`Signatory already exists`);
        e.preventDefault();
        return;

    }

    var esealcheckbox = $(".esealCheckBox").prop("checked");
    if (esealcheckbox == true) {
        if (esealusers == 0) {

            // showCustomAlert(`Please select atleast one eseal signatory`);
            document.getElementById("navigationNetworkOverlay").style.display = "none";
            toastr.error('Please select atleast one eseal signatory');
            e.preventDefault();
            return;
        }
    }
    var initialCheckBOX = $(".initialCheckBox").prop("checked");
    if (initialCheckBOX == true && isChecked) {
        if (initialusers == 0) {
            document.getElementById("navigationNetworkOverlay").style.display = "none";
            toastr.error('Please select atleast one initial');
            e.preventDefault();
            return;
        }
    }
    var nuberofsignatures_count = 0;
    for (let i = 0; i < PerpareDocumentContext.receipientEmails.length; i++) {
        // Check if the 'ogruid' property is empty for the current object
        if (PerpareDocumentContext.receipientEmails[i].Signaturema === "" && PerpareDocumentContext.receipientEmails[i].orgName !== 'Self') {

            //showCustomAlert(`please select organization for ${PerpareDocumentContext.receipientEmails[i].email}`);
            document.getElementById("navigationNetworkOverlay").style.display = "none";
            toastr.error(`please select organization for ${PerpareDocumentContext.receipientEmails[i].email}`);
            e.preventDefault();
            return;

        }
    }



    //code for restricting user to send document for himself by checking addsignatories
    if (PerpareDocumentContext.receipientEmails.length == 1 && isChecked == true) {
        if (PerpareDocumentContext.receipientEmails[0].suid == loginSuid) {

            // showCustomAlert('Try Adding A Different Email , You cannot send yourself');
            document.getElementById("navigationNetworkOverlay").style.display = "none";
            toastr.error('Try Adding A Different Email , You cannot send yourself');
            e.preventDefault();
            return;
        }
    }


    //code for validating whether all signatories selected organization or not
    for (let i = 0; i < PerpareDocumentContext.receipientEmails.length; i++) {
        // Check if the 'orgUid' property is empty for the current object
        if (PerpareDocumentContext.receipientEmails[i].orgUid.trim() === "" && PerpareDocumentContext.receipientEmails[i].orgName !== 'Self') {

            // showCustomAlert(`please select organization for ${PerpareDocumentContext.receipientEmails[i].email}`);
            document.getElementById("navigationNetworkOverlay").style.display = "none";
            toastr.error(`please select organization for ${PerpareDocumentContext.receipientEmails[i].email}`);
            e.preventDefault();
            return;

        }
    }
    if (PerpareDocumentContext.receipientEmails[0].orgUid.trim() != "") {
        if (PerpareDocumentContext.receipientEmails[0].hasDelegation) {
            var previewuserobjdata =
            {
                email: PerpareDocumentContext.receipientEmails[0].alternateSignatoriesList[0].email,
                suid: PerpareDocumentContext.receipientEmails[0].alternateSignatoriesList[0].suid,
                OrganizationId: PerpareDocumentContext.receipientEmails[0].orgUid,
                AccountType: 'organization',
            }
        } else {
            var previewuserobjdata =
            {
                email: PerpareDocumentContext.receipientEmails[0].email,
                suid: PerpareDocumentContext.receipientEmails[0].suid,
                OrganizationId: PerpareDocumentContext.receipientEmails[0].orgUid,
                AccountType: 'organization',
            }
        }

    } else {
        var previewuserobjdata =
        {
            email: PerpareDocumentContext.receipientEmails[0].email,
            suid: PerpareDocumentContext.receipientEmails[0].suid,
            OrganizationId: PerpareDocumentContext.receipientEmails[0].orgUid,
            AccountType: 'self',
        }
    }
    console.log(previewuserobjdata);
    if (isChecked) {
        let tempid = document.getElementById('templateSelect').value;
        previewuserobjdata.signtempid = tempid;


        var previwe_response = await handlePreviewimages(previewuserobjdata);
        if (previwe_response) {

            // Process the preview data
            PerpareDocumentContext.receipientEmails[0].signatureImage = previwe_response.signatureImage;
            PerpareDocumentContext.receipientEmails[0].esealImage = previwe_response.esealImage;
            initialImg_others = PerpareDocumentContext.receipientEmails[0].initialImage;
            signature_img_others = previwe_response.signatureImage;
            eseal_img_others = previwe_response.esealImage;
            console.log("Preview Data:", previwe_response);
        } else {

            console.warn("No preview data available.");
        }
    }

    setTimeout(function () {
        $(".toolcontainer2").addClass("classshide");
    }, 5000);

    PerpareDocumentContext.selectuser = PerpareDocumentContext.receipientEmails[0].email;
    var isEsealChecked = PerpareDocumentContext.receipientEmails[0].eseal;
    if (isEsealChecked) {
        $("#Eseal").removeClass("classshide");
    } else {
        $("#Eseal").addClass("classshide");
    }

    $("#fields").removeClass("classshide");
    PrepareDocument();


});


async function signRetry(blob) {

    let DocumentName = document.getElementById("DocumentName").value;
    var parsedModel = JSON.parse(finalresponse.result.model);
    var documentRetryViewModel = new FormData();
    documentRetryViewModel.append("File", blob, DocumentName);
    documentRetryViewModel.append("Config", JSON.stringify(parsedModel));
    $('#digitalShowModal').addClass('show').css('display', 'block');

    $.ajax({

        url: SendSigningRequest,
        method: 'POST',
        data: documentRetryViewModel,
        contentType: false,
        processData: false,
        beforeSend: function () {
            updateStepper(0, "success", "", "", "", "");
        },
        success: function (response) {
            document.getElementById('signingdocid').value = JSON.parse(response.result.model).tempid;
            finalresponse = response;
            if (response.status === "Success") {



                var tempid = response.result.tempid;
                updateStepper(1, "success", "", "", "", "", tempid, response);
            } else {
                if (response.message == "Credits are not available" || response.message == "Eseal credits are not available") {

                    updateStepper(1, "failed", response.message, "", "", "", "", "", blob);
                }
                else if (response.title == "Save New Document") {
                    swal({
                        type: 'info',
                        title: "Info",
                        text: response.message,
                    }, function (isConfirm) {
                        if (isConfirm) {
                            window.location.href = IndexDashboard;
                        }
                    });
                }
                else {

                    updateStepper(1, "failed", response.message, "", "", "", "", "", blob);
                }

            }
        },
        error: function (error) {
            setTimeout(function () {
                ajaxErrorHandler(error);
            }, 400);
        }
    });
}





function SaveDocument(url, formData, esealCordinates, signCordinates, initialCheckArr, blob) {

    return new Promise(function (resolve, reject) {
        var addSignatoriesCheckboxdata = $('#addSignatoriesCheckbox');
        var isCheckeddata = addSignatoriesCheckboxdata.prop('checked');
        var formdata = formData;
        var urldata = url;
        var signcorddata = signCordinates;
        var esealcorddata = {};
        if (esealCordinates == null) {
            esealcorddata = {};

        }
        else {
            esealcorddata = esealCordinates;
        }

        if (!isCheckeddata) {

            // Proceed with the AJAX call
            $.ajax({
                url: url,
                data: formData,
                cache: false,
                contentType: false,
                processData: false,
                method: 'POST',
                complete: function () {
                    $('#overlay').hide();
                },
                success: function (data) {
                    console.log(data);
                    finalresponse = data;
                    if (data.status == "Success") {
                        resolve(data);
                    }
                    else {
                        if (data.message == "Credits are not available" || data.message == "Eseal credits are not available") {

                            updateStepper(1, "failed", data.message, "", "", "", "", "", blob);
                        }
                        else if (data.title == "Save New Document") {
                            $('#digitalShowModal').removeClass('show').css('display', 'none');

                            swal({
                                type: 'info',
                                title: "Info",
                                text: data.message,
                            }, function (isConfirm) {
                                if (isConfirm) {
                                    window.location.href = IndexDashboard;
                                }
                            });
                        }
                        else {

                            updateStepper(1, "failed", data.message, "", "", "", "", "", blob);
                            document.getElementById('signingdocid').value = JSON.parse(data.result.model).tempid;
                        }

                    }
                },
                error: function (err) {
                    reject(err);
                }
            });



        }

        else {
            $.ajax({
                url: url,
                data: formData,
                cache: false,
                contentType: false,
                processData: false,
                method: 'POST',
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
        }

    });
}

function base64ToBlob(base64, contentType = '', sliceSize = 512) {
    const byteCharacters = atob(base64); // Decoding base64
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
}



async function capturePDFWithAnnotations(pageElement) {
    const scale = window.devicePixelRatio;
    const canvas = await html2canvas(pageElement, {
        scale: scale,
        useCORS: true
    });

    const image = canvas.toDataURL('image/png');

    // Free up memory if needed
    canvas.width = 0;
    canvas.height = 0;

    return image;
}

async function createPDFWithImages(images) {
    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.create();
    for (const image of images) {

        const img = await pdfDoc.embedPng(image);
        var { width, height } = img.scale(1);
        width = originalWidth
        height = originalHeight
        const page = pdfDoc.addPage([width, height]);

        page.drawImage(img, {
            x: 0,
            y: 0,
            width,
            height
        });
    }
    return pdfDoc.save();
}


let timeoutIdformodal = null;
let timeoutId = null;
function updateStepper(currentStep, state, msg, esealcorddata, signcorddata, data, tempidfordetails, resp, blob) {
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
        const messages = ["Check for UgPass mobile app notification and approve signing request...",
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
                stepLoader.style.display = "block";
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
                            var url = DocumentDetailsByIdUrl + '?id=' + docid;
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
                        var url = DocumentDetailsByIdUrl + '?id=' + docid;
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
            if (quickflag) {
                QuicksignRetry(blob);
            } else {
                signRetry(blob);
            }

        };
    }

}
function closeCustomModal() {
    window.location.href = IndexDocuments;
}




async function Save1() {
    var addSignatoriesCheckbox = $('#addSignatoriesCheckbox');
    var annotations = [];
    var isChecked = addSignatoriesCheckbox.prop('checked');

    if (isChecked && !validateNoOfSignatures(true)) {
        return;
    }


    if (isChecked) {//multi signers
        let signCordinates = {};
        let initialCordinates = {};
        let esealCordinates = {};
        var qrCordinates = {};
        var qrCheCheckArr = [];
        var visibleAndInvisibleList = {};

        var isInitialsSelected = $("#InitialRequired").prop("checked");
        if (isInitialsSelected) {
            for (var i = 0; i < PerpareDocumentContext.receipientEmails.length; i++) {
                let isInitialSelected = PerpareDocumentContext.receipientEmails[i].initial;
                if (isInitialSelected) {
                    let email = PerpareDocumentContext.receipientEmails[i].email;
                    var isExists = fieldnameslist.some(name => name.startsWith("INITIAL") && name.endsWith(email));
                    if (!isExists) {
                        swal({
                            type: 'info',
                            title: 'Info',
                            text: `Please drop initial for recipient  :: \n ${email}`

                        });

                        return;
                    }
                }
            }
        }


        var isEsealSelected = $("#Eseal_Required").prop("checked");
        if (isEsealSelected) {
            for (var i = 0; i < PerpareDocumentContext.receipientEmails.length; i++) {
                let isEseal = PerpareDocumentContext.receipientEmails[i].eseal;
                if (isEseal) {
                    let email = PerpareDocumentContext.receipientEmails[i].email;
                    var isExists = fieldnameslist.some(name => name.startsWith("ESEAL") && name.endsWith(email));
                    if (!isExists) {
                        swal({
                            type: 'info',
                            title: 'Info',
                            text: `Please drop Eseal for recipient  :: \n ${email}`

                        });

                        return;
                    }
                }
            }
        }

        var isQrSelected = $("#QrCodeRequired").prop("checked");
        if (isQrSelected) {
            var isExists = fieldnameslist.some(name => name.startsWith("QRCODE"));
            if (!isExists) {
                swal({
                    type: 'info',
                    title: 'Info',
                    text: `Please Drop QR Code`
                });
                return;
            }
        }



        document.querySelectorAll('.pdf-page').forEach((pageElement, pageIndex) => {
            const annotationLayer = pageElement.querySelector('.annotation-layer');
            const canvas = pageElement.querySelector('canvas'); // Get the canvas element
            if (!canvas) {
                return; // Skip to next pageElement
            }
            if (!annotationLayer) {
                return;
            }
            const width = canvas.getBoundingClientRect().width; // Get the width of the canvas
            const height = canvas.getBoundingClientRect().height; // Get the height of the canvas
            const rectele = pageElement.getBoundingClientRect();
            for (var i = 0; i < PerpareDocumentContext.receipientEmails.length; i++) {

                if (pageIndex == 0) {
                    visibleAndInvisibleList[PerpareDocumentContext.receipientEmails[i].email] = false;
                }


                const signatureElements = annotationLayer.querySelectorAll('[id^="SIGNATURE_"]');

                if (signatureElements && signatureElements.length > 0) {

                    signatureElements.forEach(element1 => {
                        var element = element1.parentElement?.parentElement;
                        console.log(element);
                        var computedStyle = window.getComputedStyle(element);
                        var draggablepadding = computedStyle.getPropertyValue('padding-top');
                        const rect = element.getBoundingClientRect();
                        var emaildata = PerpareDocumentContext.receipientEmails[i].email;
                        var suid = PerpareDocumentContext.receipientEmails[i].suid;
                        var anname = Date.now();
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
                            if (isInitialsSelected) {
                                annotations.push({
                                    type: 'Signature',
                                    x: ((rect.left - parentRect.left) / width) * 100,
                                    y: ((rect.top - parentRect.top) / height) * 100,
                                    width: (inputrect.width / width) * 100,
                                    height: (inputrect.height / height) * 100,
                                    page: pageIndex + 1,
                                    role: `SIGNATURE_${emaildata}`,
                                });
                            }
                            signCordinates[suid] = {
                                fieldName: anname,
                                posX: (rect.left - parentRect.left) * scaleX,
                                posY: (rect.top - parentRect.top) * scaleY,
                                PageNumber: pageIndex + 1,
                                width: (inputrect.width) * scaleX,
                                height: (inputrect.height) * scaleY,
                            };

                            visibleAndInvisibleList[emaildata] = true;


                            console.log(signCordinates);

                        };
                    });

                }




                const esealElements = annotationLayer.querySelectorAll('[id^="ESEAL_"]');

                esealElements.forEach(element1 => {
                    var element = element1.parentElement?.parentElement;
                    console.log(element);
                    var computedStyle = window.getComputedStyle(element);
                    var draggablepadding = computedStyle.getPropertyValue('padding-top');
                    const rect = element.getBoundingClientRect();
                    var emaildata = PerpareDocumentContext.receipientEmails[i].email;
                    var orguiddata = PerpareDocumentContext.receipientEmails[i].orgUid;
                    var suid = PerpareDocumentContext.receipientEmails[i].suid;
                    var anname = Date.now();
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
                        if (isInitialsSelected) {
                            annotations.push({
                                type: 'Eseal',
                                x: ((rect.left - parentRect.left) / width) * 100,
                                y: ((rect.top - parentRect.top) / height) * 100,
                                width: (inputrect.width / width) * 100,
                                height: (inputrect.height / height) * 100,
                                page: pageIndex + 1,
                                role: `ESEAL_${emaildata}`,
                            });
                        }
                        esealCordinates[suid] = {
                            fieldName: anname,
                            posX: (rect.left - parentRect.left) * scaleX,
                            posY: (rect.top - parentRect.top) * scaleY,
                            PageNumber: pageIndex + 1,
                            width: (inputrect.width) * scaleX,
                            height: (inputrect.height) * scaleY,
                            organizationID: orguiddata,
                        };
                        console.log(esealCordinates);

                        visibleAndInvisibleList[emaildata] = true;


                    };
                });


                const qrcodeElements = annotationLayer.querySelectorAll('[id^="QRCODE_"]');

                qrcodeElements.forEach(element1 => {
                    var element = element1.parentElement?.parentElement;
                    console.log(element);
                    var computedStyle = window.getComputedStyle(element);
                    var draggablepadding = computedStyle.getPropertyValue('padding-top');
                    const rect = element.getBoundingClientRect();
                    var emaildata = PerpareDocumentContext.receipientEmails[i].email;
                    var orguiddata = PerpareDocumentContext.receipientEmails[i].orgUid;
                    var suid = PerpareDocumentContext.receipientEmails[i].suid;
                    var anname = Date.now();
                    const esealElement = element.querySelector(`[id^="QRCODE_"]`); // Find element with id starting with SIGNATURE_

                    if (esealElement && esealElement.id === `QRCODE_${emaildata}`) {
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
                    if (esealElement.id === `QRCODE_${emaildata}`) {
                        if (isInitialsSelected) {
                            annotations.push({
                                type: 'Qrcode',
                                x: ((rect.left - parentRect.left) / width) * 100,
                                y: ((rect.top - parentRect.top) / height) * 100,
                                width: (inputrect.width / width) * 100,
                                height: (inputrect.height / height) * 100,
                                page: pageIndex + 1,
                                role: `QRCODE_${emaildata}`,
                            });
                        }
                        qrCordinates[suid] = {
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
            }

        });

        Object.keys(initialsStore).forEach(selectedRole => {
            const pages = initialsStore[selectedRole];

            Object.keys(pages).forEach(pageIndex => {
                const items = pages[pageIndex]; // Array of initialData for this page

                items.forEach(data => {
                    // Convert percentages back to decimals
                    const x = parseFloat(data.left);
                    const y = parseFloat(data.top);
                    const w = parseFloat(data.width);
                    const h = parseFloat(data.height);

                    annotations.push({
                        type: 'Initial',
                        x: x,
                        y: y,
                        width: w,
                        height: h,
                        page: parseInt(pageIndex) + 1,
                        role: data.id,
                        watermarktext: watermarktext
                    });
                });
            });
        });



        console.log(signCordinates);
        console.log(esealCordinates);

        const hasFalseValue = Object.values(visibleAndInvisibleList).includes(false);

        var okElement;
        var cancelElement;

        if (hasFalseValue) {
            let invisiblevisibledata = "<div style='font-size:1rem; color:black; text-align:left; width:100%;'>";
            invisiblevisibledata += "<ul style='padding-left: 20px; margin: 0;'>";

            for (const key in visibleAndInvisibleList) {
                if (visibleAndInvisibleList.hasOwnProperty(key) && visibleAndInvisibleList[key] === false) {
                    invisiblevisibledata += `
                                                                                    <li style="margin-bottom: 5px;font-weight:bold">${key}</li>`;
                }
            }

            invisiblevisibledata += "</ul></div>";


            const overlayListEl = document.getElementById('overlay11List');
            if (overlayListEl) overlayListEl.innerHTML = invisiblevisibledata;

            document.getElementById('overlay11').style.display = 'flex';
            okElement = document.getElementById('okButton2');
            cancelElement = document.getElementById('cancelButton2')
        }
        else {
            document.getElementById('overlay9_1').style.display = 'flex';
            okElement = document.getElementById('okButton9_1');
            cancelElement = document.getElementById('cancelButton9_1')
        }



        okElement.addEventListener('click', async function () {

            if (hasFalseValue) {
                document.getElementById('overlay11').style.display = 'none';
            } else {
                document.getElementById('overlay9_1').style.display = 'none';
            }
            $('#overlay').show();
            let DocumentName = document.getElementById("DocumentName").value;
            let Rotation = document.getElementById("Rotation");
            let SettingConfigElement = document.getElementById("SettingConfig");
            var Signatory = PerpareDocumentContext.receipientEmails;
            var len = PerpareDocumentContext.receipientEmails.length;
            // Create an empty object for SettingConfig
            let SettingConfig = {
                inputpath: '',
                outputpath: ''
            };

            let QrCodeRequired = $("#QrCodeRequired").is(':checked');
            var roleList = [];

            $('.email').each(function (i) {
                var isEseal = $("#RecpientList_" + i + "__Eseal").prop("checked");
                roleList.push({
                    "order": i + 1,
                    "role": "signer",
                    "eseal": isEseal
                });
            })

            // START FIX: Populate roleList for Self-Sign if empty (since no .email inputs exist)
            if (roleList.length === 0 && PerpareDocumentContext.receipientEmails.length > 0) {
                PerpareDocumentContext.receipientEmails.forEach((recipient, i) => {
                    roleList.push({
                        "order": i + 1,
                        "role": "signer",
                        "eseal": recipient.eseal
                    });
                });
            }
            // END FIX

            var addSignatoriesCheckbox = $('#addSignatoriesCheckbox');

            // Get the checked status of the checkbox
            var isChecked = addSignatoriesCheckbox.prop('checked');

            // Store the checked status in a variable
            var checkboxValue = isChecked ? 'checked' : 'unchecked';

            if (Object.keys(esealCordinates).length === 0) {
                esealCordinates = null
            }

            var esealcorddata = {};
            if (esealCordinates == null) {
                esealcorddata = {};

            }
            else {
                esealcorddata = esealCordinates;
            }




            var daystoComplete_val = $('#DaysToComplete').val();
            var daystoCompleteInt_val = parseInt(daystoComplete_val, 10);




            var config = {
                QrCodeRequired: QrCodeRequired,
                Signature: signCordinates,
                Eseal: esealCordinates,
                Qrcode: qrCordinates,


            }

            var Recps = PerpareDocumentContext.receipientEmails
            var RequiredSignatureNo = $('#RequiredSignatureInput').val();
            var RequiredSignatureNoInt_Count = typeof getMinRequiredSignatures === 'function' ? getMinRequiredSignatures() : parseInt(RequiredSignatureNo);
            var allSignaturesRequired = $("#AllSignatoriesRequired").prop("checked");
            var signaturesRequiredCount = Recps.length;
            if (!allSignaturesRequired) {
                signaturesRequiredCount = RequiredSignatureNoInt_Count;
            }

            console.log(JSON.stringify(config));

            var list = Signatory.map(x => {
                return x.email
            });
            var contentType = "application/pdf";
            var pdfBlob = base64ToBlob(document.getElementById('filebase64').value, contentType);


            const isInitialChecked = document.getElementById('InitialRequired').checked;
            if (isInitialChecked || iswatermarkpresent) {

                try {
                    var pdfBlob_embed = await addWatermark_Initial("org", isInitialChecked, iswatermarkpresent);

                    const maxSizeInBytes = PerpareDocumentContext.filesizerestrict * 1024 * 1024;
                    if (pdfBlob_embed.size > maxSizeInBytes) {
                        $('#overlay').hide();
                        swal({
                            icon: 'warning',
                            title: 'File Too Large',
                            text: `PDF exceeds ${PerpareDocumentContext.filesizerestrict} MB after adding watermark or initial`
                        });
                        return;
                    }



                } catch (error) {
                    $('#overlay').hide();
                    swal({
                        type: 'error',
                        title: 'Error',
                        text: error.message || 'Something went wrong while processing the PDF.'
                    });
                    return;
                }
            }



            var initialCheckArr = [];
            var htmlSchemadata = JSON.stringify(annotations);
            var fileFormData = new FormData();
            if (isInitialChecked) {
                fileFormData.append("File", pdfBlob_embed, DocumentName);
                fileFormData.append("OriginalFile", pdfBlob, DocumentName);
            }
            else {
                if (iswatermarkpresent) {

                    fileFormData.append("File", pdfBlob_embed, DocumentName);
                }
                else {
                    fileFormData.append("File", pdfBlob, DocumentName);
                }
            }
            let tempid = document.getElementById('templateSelect').value;
            Recps.forEach(item => {
                item.signTemplate = tempid;
            });
            fileFormData.append("DocumentName", DocumentName);
            fileFormData.append("DaysToComplete", daystoCompleteInt_val);
            // fileFormData.append("Rotation", Rotation);
            fileFormData.append("Rotation", rotationData);
            fileFormData.append("SettingConfig", JSON.stringify(SettingConfig));
            fileFormData.append("Config", JSON.stringify(config));
            fileFormData.append("Recps", JSON.stringify(Recps));
            fileFormData.append("Signatory", list.join(","));
            fileFormData.append("RoleList", roleList);
            fileFormData.append("QrCodeRequired", QrCodeRequired);
            fileFormData.append("checkboxValue", checkboxValue);
            fileFormData.append("docSerialNo", serialnumber);
            fileFormData.append("entityName", entityname);
            fileFormData.append("faceRequired", faceRequired);
            fileFormData.append("pageHeight", pageHeight);
            fileFormData.append("pageWidth", pageWidth);
            fileFormData.append("RequiredSignatureNo", signaturesRequiredCount);
            if (isInitialsSelected) {
                fileFormData.append("htmlSchema", htmlSchemadata)
            }
            const isDisableOrder = (typeof getDisableOrderFlag === 'function') ? getDisableOrderFlag() : false;
            fileFormData.append("DisableOrder", isDisableOrder);

            SaveDocument(SaveNewDocument, fileFormData, esealCordinates, signCordinates, initialCheckArr, pdfBlob_embed)
                .then((response) => {
                    if (response.status == "Success") {
                        $('#overlay').show();

                        var redirectUrl = sentredirecturl;

                        swal({
                            title: "Success",
                            text: response.message,
                            type: "success",
                            closeOnClickOutside: false, // disable overlay click
                            closeOnEsc: false           // disable ESC key
                        }, function (isConfirm) {
                            if (isConfirm) {
                                window.location.href = redirectUrl; // redirect only on button click
                            }
                        });

                        // hide overlay after swal is rendered
                        setTimeout(function () {
                            $('#overlay').hide();
                        }, 400); // adjust delay if swal takes longer

                    }
                    else {
                        swal({
                            title: "Error",
                            text: response.message,
                            type: "error",
                        }, function (isConfirm) {
                            if (isConfirm) {
                                window.location.href = IndexDocuments;
                            }
                        });
                    }
                })
                .catch((e) => {

                    console.log(e.status);
                    if (e.status == 401) {
                        swal({ type: 'info', title: "Session Expired", text: "Click on 'Ok' button to login again!" }, function (isConfirm) {
                            if (isConfirm) {
                                window.location.href = IndexLogin
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
                                window.location.href = IndexDocuments;
                            }
                        });
                    }
                });

        });
        cancelElement.addEventListener('click', function () {
            if (hasFalseValue) {
                document.getElementById('overlay11').style.display = 'none';
            } else {
                document.getElementById('overlay9_1').style.display = 'none';
            }

        });

    }
    else {
        //checking initial is selected for self user or not
        var isInitialsPresent = $("#InitialRequired").prop("checked");
        if (isInitialsPresent) {
            var isexists = fieldnameslist.some(name => name.startsWith("INITIAL"));
            if (!isexists) {
                swal({
                    type: 'info',
                    title: 'Info',
                    text: "Please drop Initial annotation"
                });
                return;
            }
        }


        var isEsealSelected = $("#Eseal_Required").prop("checked");
        if (isEsealSelected) {
            var isExists = fieldnameslist.some(name => name.startsWith("ESEAL"));
            if (!isExists) {
                swal({
                    type: 'info',
                    title: 'Info',
                    text: "Please drop Eseal annotation"

                });

                return;
            }
        }

        var isQrSelected = $("#QrCodeRequired").prop("checked");
        if (isQrSelected) {
            var isExists = fieldnameslist.some(name => name.startsWith("QRCODE"));
            if (!isExists) {
                swal({
                    type: 'info',
                    title: 'Info',
                    text: `Please Drop QR Code`
                });
                return;
            }
        }



        let signCordinates = {};
        let esealCordinates = {};
        var qrCordinates = {};
        var signCheckArr = [];
        var esealCheckArr = [];
        var qrCheCheckArr = [];
        var visibleAndInvisibleList = {};

        visibleAndInvisibleList[PerpareDocumentContext.receipientEmails[0].email] = false;

        document.querySelectorAll('.pdf-page').forEach((pageElement, pageIndex) => {

            const annotationLayer = pageElement.querySelector('.annotation-layer');
            const canvas = pageElement.querySelector('canvas'); // Get the canvas element
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
            if (signatureElements && signatureElements.length > 0) {
                signatureElements.forEach(element1 => {
                    var element = element1.parentElement?.parentElement;
                    console.log(element);
                    var computedStyle = window.getComputedStyle(element);
                    var draggablepadding = computedStyle.getPropertyValue('padding-top');
                    const rect = element.getBoundingClientRect();
                    var emaildata = PerpareDocumentContext.receipientEmails[0].email;
                    var suid = PerpareDocumentContext.receipientEmails[0].suid;
                    var anname = Date.now();
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
                        visibleAndInvisibleList[emaildata] = true;
                    };
                });

            }

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
                    visibleAndInvisibleList[emaildata] = true;
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
                const esealElement = element.querySelector(`[id^="QRCODE_"]`); // Find element with id starting with SIGNATURE_

                if (esealElement && esealElement.id === `QRCODE_${emaildata}`) {
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

                if (esealElement.id === `QRCODE_${emaildata}`) {

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





        if (signCheckArr.length === 0) {
            if (esealCheckArr.length == 0 && qrCheCheckArr.length == 0) {
                quickflag = true;
                SaveQuickSign(visibleAndInvisibleList)
                return;
            }
        }
        if (signCheckArr.length === 0) {
            if (esealCheckArr.length == 0 && qrCheCheckArr.length != 0) {
                quickflag = true;
                SaveQuickSignQrcode(qrCordinates, visibleAndInvisibleList);
                return;
            }
        }

        quickflag = false;
        console.log(signCordinates);
        console.log(esealCordinates);
        document.getElementById('overlay9').style.display = 'flex';

        $('#okButton').off('click').on('click', async function () {

            document.getElementById('overlay9').style.display = 'none';
            $('#overlay').show();


            //$('#digitalShowModal').addClass('show').css('display', 'block');
            let DocumentName = document.getElementById("DocumentName").value;
            let Rotation = document.getElementById("Rotation");
            let SettingConfigElement = document.getElementById("SettingConfig");
            var Signatory = PerpareDocumentContext.receipientEmails;
            var len = PerpareDocumentContext.receipientEmails.length;
            // Create an empty object for SettingConfig
            let SettingConfig = {
                inputpath: '',
                outputpath: ''
            };

            let QrCodeRequired = $("#QrCodeRequired").is(':checked');
            var roleList = [];

            $('.email').each(function (i) {
                var isEseal = $("#RecpientList_" + i + "__Eseal").prop("checked");
                roleList.push({
                    "order": i + 1,
                    "role": "signer",
                    "eseal": isEseal
                });
            })

            // START FIX: Populate roleList for Self-Sign if empty (since no .email inputs exist)
            if (roleList.length === 0 && PerpareDocumentContext.receipientEmails.length > 0) {
                PerpareDocumentContext.receipientEmails.forEach((recipient, i) => {
                    roleList.push({
                        "order": i + 1,
                        "role": "signer",
                        "eseal": recipient.eseal
                    });
                });
            }
            // END FIX

            var addSignatoriesCheckbox = $('#addSignatoriesCheckbox');

            // Get the checked status of the checkbox
            var isChecked = addSignatoriesCheckbox.prop('checked');

            // Store the checked status in a variable
            var checkboxValue = isChecked ? 'checked' : 'unchecked';

            if (Object.keys(esealCordinates).length === 0) {
                esealCordinates = null
            }

            var esealcorddata = {};
            if (esealCordinates == null) {
                esealcorddata = {};

            }
            else {
                esealcorddata = esealCordinates;
            }




            var daystoComplete_val = $('#DaysToComplete').val();
            var daystoCompleteInt_val = parseInt(daystoComplete_val, 10);




            var config = {
                QrCodeRequired: QrCodeRequired,
                Signature: signCordinates,
                Eseal: esealCordinates,
                Qrcode: qrCordinates

            }

            var Recps = PerpareDocumentContext.receipientEmails
            var RequiredSignatureNo = $('#RequiredSignatureInput').val();
            var RequiredSignatureNoInt_Count = parseInt(RequiredSignatureNo);
            var allSignaturesRequired = $("#AllSignatoriesRequired").prop("checked");
            var signaturesRequiredCount = Recps.length;
            if (!allSignaturesRequired) {
                signaturesRequiredCount = RequiredSignatureNoInt_Count;
            }

            console.log(JSON.stringify(config));

            var list = Signatory.map(x => {
                return x.email
            });
            var contentType = "application/pdf";
            var pdfBlob = "";
            const isInitialChecked = document.getElementById('InitialRequired').checked;

            if (iswatermarkpresent || isInitialChecked) {
                try {
                    pdfBlob = await addWatermark_Initial("self", isInitialChecked, iswatermarkpresent);

                    const maxSizeInBytes = PerpareDocumentContext.filesizerestrict * 1024 * 1024;
                    if (pdfBlob.size > maxSizeInBytes) {
                        $('#overlay').hide();
                        swal({
                            icon: 'warning',
                            title: 'File Too Large',
                            text: `PDF exceeds ${PerpareDocumentContext.filesizerestrict} MB after adding watermark or initial`
                        });
                        return;
                    }

                } catch (error) {
                    $('#overlay').hide();
                    swal({
                        type: 'error',
                        title: 'Error',
                        text: error.message || 'Something went wrong while processing the PDF.'
                    });

                    return;
                }
            }
            else {

                pdfBlob = base64ToBlob(document.getElementById('filebase64').value, "application/pdf");
            }

            finalblob = pdfBlob;

            var initialCheckArr = [];

            var fileFormData = new FormData();
            fileFormData.append("File", pdfBlob, DocumentName);
            fileFormData.append("DocumentName", DocumentName);
            fileFormData.append("DaysToComplete", daystoCompleteInt_val);
            // fileFormData.append("Rotation", Rotation);
            fileFormData.append("Rotation", rotationData);
            fileFormData.append("SettingConfig", JSON.stringify(SettingConfig));
            fileFormData.append("Config", JSON.stringify(config));
            fileFormData.append("Recps", JSON.stringify(Recps));
            fileFormData.append("Signatory", list.join(","));
            fileFormData.append("RoleList", roleList);
            fileFormData.append("QrCodeRequired", QrCodeRequired);
            fileFormData.append("checkboxValue", checkboxValue);
            fileFormData.append("docSerialNo", serialnumber);
            fileFormData.append("entityName", entityname);
            fileFormData.append("faceRequired", faceRequired);
            fileFormData.append("pageHeight", pageHeight);
            fileFormData.append("pageWidth", pageWidth);
            fileFormData.append("RequiredSignatureNo", signaturesRequiredCount);
            let tempid = document.getElementById('templateSelect').value;
            fileFormData.append("SignTemplate", tempid);
            $('#overlay').hide();
            $('#digitalShowModal').addClass('show').css('display', 'block');




            SaveDocument(SaveNewDocument, fileFormData, esealCordinates, signCordinates, initialCheckArr, pdfBlob)
                .then((response) => {
                    // document.getElementById('signingdocid').value = response.result.tempid;
                    document.getElementById('signingdocid').value = JSON.parse(response.result.model).tempid;
                    finalresponse = response;
                    if (response.status == "Success") {
                        if (isChecked) {
                            swal({
                                title: "Success",
                                text: response.message,
                                type: "info",
                            }, function (isConfirm) {
                                if (isConfirm) {
                                    window.location.href = sentredirecturl;
                                }
                            });
                        } else {

                            var tempid = response.result.tempid;
                            updateStepper(1, "success", "", "", "", "", tempid, response);
                        }
                    } else {

                        updateStepper(1, "failed", response.message, "", "", "", "", "", pdfBlob);
                    }
                })
                .catch((e) => {
                    $('#digitalShowModal').removeClass('show').css('display', 'none');

                    console.log(e.status);
                    if (e.status == 401) {
                        swal({ type: 'info', title: "Session Expired", text: "Click on 'Ok' button to login again!" }, function (isConfirm) {
                            if (isConfirm) {
                                window.location.href = IndexLogin
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
                                window.location.href = IndexDocuments;
                            }
                        });
                    }
                });

        });
        $('#cancelButton').off('click').on('click', function () {
            document.getElementById('overlay9').style.display = 'none';
        });

    }

};

function validateEmail(email) {
    if (email.value.trim() === "") {
        $(email).next("span").removeClass("classshide")
        return false
    }
    var emailReg = new RegExp(
        /^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i
    );

    var emailvaluedata = email.value.trim();
    if (!emailReg.test(emailvaluedata)) {
        $(email).next("span").removeClass("classshide")
        return false
    } else {
        $(email).next("span").addClass("classshide")
        return true;
    }
}

function open_file() {
    document.getElementById('File').click();
}

function ShowError(msg) {
    $("#ErrMsg").html(msg)
    $("#myModal").removeClass('classshide');
}

function onMouseDown(event) {
    const trigger = event.currentTarget || event.target;
    let type = trigger ? trigger.id : '';

    if (!type && trigger && typeof trigger.closest === 'function') {
        const button = trigger.closest('button');
        type = button ? button.id : '';
    }

    if (!type && trigger && trigger.parentElement && typeof trigger.parentElement.closest === 'function') {
        const parentButton = trigger.parentElement.closest('button');
        type = parentButton ? parentButton.id : '';
    }

    if (!type) {
        return;
    }

    const ghostElement = createGhostElement(event, false, type);

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

        //used to check whether annotation drop is inside content or not
        let pageElements = document.elementsFromPoint(clientX, clientY);

        const pageExists = pageElements.find(el => {
            if (el.classList.contains('pdf-page')) {
                return true;
            }
            return false;
        });


        if (pageExists) {
            const allPages = document.querySelectorAll('.pdf-page');
            let pageNumber = -1;
            let pdfPage = null;
            allPages.forEach((page, index) => {
                const rect = page.getBoundingClientRect();
                if (
                    clientY >= rect.top &&
                    clientY <= rect.bottom &&
                    clientX >= rect.left &&
                    clientX <= rect.right
                ) {
                    pdfPage = page;
                    pageNumber = index;
                }
            });



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

                        const element = createDraggableElement(type, left, top);
                        annotationLayer.appendChild(element);

                        const elementRect = element.getBoundingClientRect();
                        // Ensure the entire annotation is within the current page's visible bounds
                        const isOutOfBounds =
                            elementRect.left < rect.left ||
                            elementRect.top < rect.top ||
                            elementRect.right > rect.right ||
                            elementRect.bottom > rect.bottom;


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
                        }
                        else if (isOutOfBounds) {
                            swal({
                                title: "Info",
                                text: `The annotation is placed outside the valid page area. Please adjust its size or move it within the page boundaries.`,
                                type: "info",
                            });
                            annotationLayer.removeChild(element);
                        }
                        else {
                            fieldnameslist.push(fieldname);
                            document.getElementById('INITIAL').disabled = false;
                        }
                        scaleX = originalWidth / rect.width;
                        scaleY = originalHeight / rect.height;
                    } else {

                        swal({
                            title: "Info",
                            text: `More than one Signature field is selected for the Recepient : ${selectedRole}`,
                            type: "info",
                        });
                    }


                }
                else if (type === "INITIAL") {


                    const element = createDraggableElement(type, left, top);
                    annotationLayer.appendChild(element);
                    setTimeout(() => {
                        const elementRect = element.getBoundingClientRect();

                        const isOutOfBounds =
                            elementRect.left < rect.left ||
                            elementRect.top < rect.top ||
                            elementRect.right > rect.right ||
                            elementRect.bottom > rect.bottom;

                        if (isOutOfBounds) {
                            swal({
                                title: "Info",
                                text: `The annotation is placed outside the valid page area. Please adjust its size or move it within the page boundaries.`,
                                type: "info",
                            });
                            element.remove(); // safer than annotationLayer.removeChild(element)
                            return;
                        }
                        else {
                            element.remove();
                        }

                    }, 10);

                    const className = `${selectedRole}_signature-container`;
                    const isSignaturePresent = pdfPage.getElementsByClassName(className)[0];
                    const initialFieldName = 'INITIAL' + pageNumber + selectedRole;
                    if (isSignaturePresent) {
                        swal({
                            title: "Info",
                            text: `Initials are not permitted on pages where a signature is already present : ${selectedRole}`,
                            type: "info",
                        });

                    }
                    else if (fieldnameslist.includes(initialFieldName)) {
                        swal({
                            title: "Info",
                            text: "More than one initial is not allowed in a page",
                            type: "info",
                        });
                    }
                    else {



                        swal({
                            type: 'info', title: "Message", text: "Do you want to place initials on every page at the same location ?", showCancelButton: true, showConfirmButton: true, confirmButtonText: 'Yes', cancelButtonText: "No",
                        }, function (isConfirm) {
                            if (isConfirm) {
                                const initialsList = fieldnameslist
                                    .filter(each => each.startsWith("INITIAL") && each.endsWith(selectedRole))
                                    .map(each => {
                                        const regex = new RegExp(`^INITIAL(\\d+)${selectedRole}$`);
                                        const match = each.match(regex);
                                        return match ? parseInt(match[1], 10) + 1 : null; // convert to number and add 1
                                    })
                                    .filter(num => num !== null);

                                if (initialsList.length !== 0) {
                                    setTimeout(() => {
                                        swal({
                                            title: "Info",
                                            text: `More than one initial is not allowed at page number(s): ${initialsList.join(", ")}`,
                                            type: "info",
                                        });
                                    }, 200);
                                    return;

                                }

                                document.querySelectorAll('.pdf-page').forEach((page, i) => {
                                    if (page.classList.contains('pdf-page')) {
                                        const pageannotationLayer = page.querySelector('.annotation-layer');
                                        var fieldname = 'INITIAL' + i + selectedRole;
                                        const number = PerpareDocumentContext.receipientEmails.findIndex(
                                            item => item.email === selectedRole
                                        );
                                        const user = `image${number + 1}`;
                                        if (!pageannotationLayer) {
                                            fieldnameslist.push(fieldname);
                                            let defaultWidth, defaultHeight;

                                            if (rotationData === 270 || rotationData === 90) {
                                                defaultWidth = (canvasWidth * 0.08907);   // wider in vertical orientation
                                                defaultHeight = (canvasWidth * 0.08245);
                                            } else {
                                                defaultWidth = (canvasWidth * 0.08245);   // normal horizontal orientation
                                                defaultHeight = (canvasWidth * 0.08907);
                                            }

                                            const initialData = {
                                                id: fieldname,
                                                user: user,
                                                width: ((defaultWidth / canvasWidth) * 100).toFixed(2),   // Store as percentage
                                                height: ((defaultHeight / canvasHeight) * 100).toFixed(2),
                                                top: ((top / canvasHeight) * 100).toFixed(2),
                                                left: ((left / canvasWidth) * 100).toFixed(2)
                                            };


                                            if (!initialsStore[selectedRole]) initialsStore[selectedRole] = {};
                                            if (!initialsStore[selectedRole][i]) initialsStore[selectedRole][i] = [];
                                            initialsStore[selectedRole][i].push(initialData);
                                            return;
                                        }
                                        initialsDrawnPages.add(i);
                                        const className = `${selectedRole}_signature-container`;
                                        const isSignaturePresent = page.getElementsByClassName(className)[0];
                                        if (!isSignaturePresent) {

                                            const element = createDraggableElement(type, left, top, fieldname);
                                            pageannotationLayer.appendChild(element);


                                            const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                                            const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                                            const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                                            const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                                            element.setAttribute('data-wpercent', wratio)
                                            element.setAttribute('data-hpercent', hratio)
                                            element.setAttribute('data-lpercent', lratio)
                                            element.setAttribute('data-tpercent', tratio)

                                            if ((element.offsetWidth + left) > rect.width) {
                                                pageannotationLayer.removeChild(element);
                                            } else {
                                                fieldnameslist.push(fieldname);
                                                const secondChild = element.querySelector('.image-container');
                                                let width = 0;
                                                let height = 0;

                                                if (secondChild) {
                                                    width = secondChild.offsetWidth;
                                                    height = secondChild.offsetHeight;

                                                }

                                                const canvasRect = document.querySelector('canvas').getBoundingClientRect();

                                                const initialData = {
                                                    id: fieldname,
                                                    user: user,
                                                    width: ((width / canvasRect.width) * 100).toFixed(2),   // percentage string
                                                    height: ((height / canvasRect.height) * 100).toFixed(2),
                                                    top: ((top / canvasRect.height) * 100).toFixed(2),
                                                    left: ((left / canvasRect.width) * 100).toFixed(2)
                                                };

                                                if (!initialsStore[selectedRole]) initialsStore[selectedRole] = {};
                                                if (!initialsStore[selectedRole][i]) initialsStore[selectedRole][i] = [];

                                                initialsStore[selectedRole][i].push(initialData);

                                            }
                                            scaleX = originalWidth / rect.width;
                                            scaleY = originalHeight / rect.height;
                                            //addDragAndDropListeners(element);
                                        }
                                    }

                                });

                            }
                            else {
                                const pageannotationLayer = pdfPage.querySelector('.annotation-layer');
                                var fieldname = 'INITIAL' + pageNumber + selectedRole;
                                const element = createDraggableElement(type, left, top, fieldname);
                                pageannotationLayer.appendChild(element);
                                initialsDrawnPages.add(pageNumber);

                                const number = PerpareDocumentContext.receipientEmails.findIndex(
                                    item => item.email === selectedRole
                                );
                                const user = `image${number + 1}`;



                                const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                                const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                                const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                                const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                                element.setAttribute('data-wpercent', wratio)
                                element.setAttribute('data-hpercent', hratio)
                                element.setAttribute('data-lpercent', lratio)
                                element.setAttribute('data-tpercent', tratio)

                                if ((element.offsetWidth + left) > rect.width) {
                                    pageannotationLayer.removeChild(element);
                                } else {
                                    fieldnameslist.push(fieldname);

                                    const secondChild = element.querySelector('.image-container');

                                    let width = 0;
                                    let height = 0;

                                    if (secondChild) {
                                        width = secondChild.offsetWidth;
                                        height = secondChild.offsetHeight;

                                    }

                                    const canvasRect = document.querySelector('canvas').getBoundingClientRect();

                                    const initialData = {
                                        id: fieldname,
                                        user: user,
                                        width: ((width / canvasRect.width) * 100).toFixed(2),   // percentage string
                                        height: ((height / canvasRect.height) * 100).toFixed(2),
                                        top: ((top / canvasRect.height) * 100).toFixed(2),
                                        left: ((left / canvasRect.width) * 100).toFixed(2)
                                    };


                                    if (!initialsStore[selectedRole]) initialsStore[selectedRole] = {};
                                    if (!initialsStore[selectedRole][pageNumber]) initialsStore[selectedRole][pageNumber] = [];

                                    initialsStore[selectedRole][pageNumber].push(initialData);

                                }
                                scaleX = originalWidth / rect.width;
                                scaleY = originalHeight / rect.height;
                                //addDragAndDropListeners(element);
                            }

                        });

                    }

                }

                else if (type === "ESEAL") {
                    var fieldname = 'ESEAL' + "_" + selectedRole;
                    if (!fieldnameslist.includes(fieldname)) {

                        const element = createDraggableElement(type, left, top);
                        annotationLayer.appendChild(element);

                        const elementRect = element.getBoundingClientRect();
                        // Ensure the entire annotation is within the current page's visible bounds
                        const isOutOfBounds =
                            elementRect.left < rect.left ||
                            elementRect.top < rect.top ||
                            elementRect.right > rect.right ||
                            elementRect.bottom > rect.bottom;


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
                        }
                        else if (isOutOfBounds) {
                            swal({
                                title: "Info",
                                text: `The annotation is placed outside the valid page area. Please adjust its size or move it within the page boundaries.`,
                                type: "info",
                            });
                            annotationLayer.removeChild(element);
                        }
                        else {
                            fieldnameslist.push(fieldname);
                        }
                        scaleX = originalWidth / rect.width;
                        scaleY = originalHeight / rect.height;
                    } else {

                        swal({
                            title: "Info",
                            text: `More than one Eseal field is selected for the Recepient : ${selectedRole}`,
                            type: "info",
                        });
                    }


                }

                else if (type === 'imagefield') {

                    const newHeader = '<h5 class="modal-title">Enter Image Name</h5>';
                    const newBody = `<input type="text"  id="FieldNameInput" class="form-control"  placeholder="Enter Image Name">
                                                                                                                                                                                                                                <span id="errorFieldName" style="color: red; display: none;"></span>
                                                                                                                                                                                                                                    <div class="form-check mt-2">
                                                                                                                                                                                                    <input type="checkbox" style="margin-top:2%" id="mandatoryCheckbox" class="form-check-input" checked>
                                                                                                                                                                                                    <label for="mandatoryCheckbox" class="form-check-label">Mandatory</label>
                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                `;
                    const newFooter = `
                                                                                                                                                                                                                                                        <button type="button" class="btn btn-primary"  id="saveFieldName">Save</button>
                                                                                                                                                                                                                                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                                                                                                                                                                                                                                `;

                    updateModalContent(newHeader, newBody, newFooter);

                    const fieldNameInput = document.getElementById('FieldNameInput');
                    fieldNameInput.addEventListener('keydown', (event) => {

                        const allowedKeys = [
                            'Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                            'Delete', ' ', // Include space character explicitly
                        ];

                        const isLetterOrNumber = /^[a-zA-Z0-9]$/.test(event.key);

                        if (!isLetterOrNumber && !allowedKeys.includes(event.key)) {
                            event.preventDefault();

                        } else {

                        }
                    });
                    document.getElementById('saveFieldName').addEventListener('click', () => {
                        const mancheckbox = document.getElementById('mandatoryCheckbox');

                        const isMandatory = mancheckbox.checked;
                        fieldName = document.getElementById('FieldNameInput').value + "_" + selectedRole;
                        if ((document.getElementById('FieldNameInput').value).replace(/\s+/g, '') !== '') {
                            if (!fieldnameslist.includes(fieldName)) {

                                const element = createDraggableElement(type, left, top, fieldName, "", isMandatory);
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
                                    annotationLayer.removeChild(element);
                                } else {
                                    fieldnameslist.push(fieldName);
                                }
                                $('#EditFields_Modal').modal('hide');
                            } else {
                                document.getElementById('errorFieldName').innerText = "Field Name already taken";
                                document.getElementById('errorFieldName').style.display = 'block';
                            }


                        } else {
                            document.getElementById('errorFieldName').innerText = "Field Name can't be empty";
                            document.getElementById('errorFieldName').style.display = 'block';
                        }

                    });

                    document.getElementById('FieldNameInput').addEventListener('click', function () {
                        document.getElementById('errorFieldName').style.display = 'none';
                    });

                    $('#EditFields_Modal').modal('show');
                }

                else if (type === "QRCODE") {
                    var fieldname = 'QRCODE' + "_" + selectedRole;
                    if (!fieldnameslist.includes(fieldname)) {

                        const element = createDraggableElement(type, left, top);
                        annotationLayer.appendChild(element);

                        const elementRect = element.getBoundingClientRect();
                        // Ensure the entire annotation is within the current page's visible bounds
                        const isOutOfBounds =
                            elementRect.left < rect.left ||
                            elementRect.top < rect.top ||
                            elementRect.right > rect.right ||
                            elementRect.bottom > rect.bottom;


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
                        }
                        else if (isOutOfBounds) {
                            swal({
                                title: "Info",
                                text: `The annotation is placed outside the valid page area. Please adjust its size or move it within the page boundaries.`,
                                type: "info",
                            });
                            annotationLayer.removeChild(element);
                        }
                        else {
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

        }


        ghostElement.remove();
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        document.removeEventListener('touchmove', onMouseMove);
        document.removeEventListener('touchend', onMouseUp);
    }



    function isElementInside(draggableRect, pageRect) {
        return (
            draggableRect.top >= pageRect.top &&
            draggableRect.left >= pageRect.left &&
            draggableRect.bottom <= pageRect.bottom &&
            draggableRect.right <= pageRect.right
        );
    }



    function addDragAndDropListeners(element) {
        let isDragging = false;
        let offsetX, offsetY;
        let newLeft = 0, newTop = 0;

        element.addEventListener('mousedown', function (e) {
            isDragging = true;
            offsetX = e.clientX - element.offsetLeft;
            offsetY = e.clientY - element.offsetTop;
            element.style.position = 'absolute';
            element.style.zIndex = 1000;
        });

        document.addEventListener('mousemove', function (e) {
            if (isDragging) {
                const canvas = document.querySelector('canvas');
                const rect = canvas.getBoundingClientRect();

                newLeft = e.clientX - offsetX;
                newTop = e.clientY - offsetY;

                // Prevent dragging outside canvas
                newLeft = Math.max(rect.left, Math.min(newLeft, rect.right - element.offsetWidth));
                newTop = Math.max(rect.top, Math.min(newTop, rect.bottom - element.offsetHeight));

                element.style.left = newLeft + 'px';
                element.style.top = newTop + 'px';

                const lratio = (newLeft - rect.left) / rect.width;
                const tratio = (newTop - rect.top) / rect.height;

                element.setAttribute('data-lpercent', lratio);
                element.setAttribute('data-tpercent', tratio);
            }
        });

        document.addEventListener('mouseup', function () {
            if (isDragging) {
                isDragging = false;
                swal({
                    type: 'info',
                    title: "Message",
                    text: "Do you want to modify the initial annotation at the same location on every page where it is present?",
                    showCancelButton: true,
                    showConfirmButton: true,
                    confirmButtonText: 'Yes',
                    cancelButtonText: "No",
                }, function (isConfirm) {
                    if (isConfirm) {
                        const selectedRole = PerpareDocumentContext.selectuser;
                        fieldnameslist.forEach((fieldName) => {
                            if (fieldName.endsWith(selectedRole)) {
                                const el = document.getElementById(fieldName);
                                if (el) {
                                    el.style.left = `${newLeft}px`;
                                    el.style.top = `${newTop}px`;
                                }
                            }
                        });
                    } else {
                        element.style.left = `${newLeft}px`;
                        element.style.top = `${newTop}px`;
                    }
                });
            }
        });
    }




    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    document.addEventListener('touchmove', onMouseMove);
    document.addEventListener('touchend', onMouseUp);
}

function FileError(msg) {
    ShowError(msg);
    $("#DocumentName").val("");
    $("#File").val(null);
}

var toolbarButtons = document.querySelectorAll('#fieldsRecpRpw button');
toolbarButtons.forEach(button => {
    button.addEventListener('mousedown', onMouseDown);
    button.addEventListener('touchstart', onMouseDown);

});

async function fileSelect(e) {
    $('#overlay').show();
    let file = e.target.files[0];
    let extn = file.name.substring(file.name.lastIndexOf(".") + 1).toLowerCase();

    if (isFileUploaded) {
        toastr.error(`File already uploaded.`);
        e.target.value = ""; // Reset file input
        $('#overlay').hide();
        return false;
    }

    var maxSizeBytes = PerpareDocumentContext.filesizerestrict * 1024 * 1024;
    console.log(PerpareDocumentContext.filesizerestrict * 1024 * 1024);
    if (file.size > maxSizeBytes) {
        toastr.error(
            `File size must be ${PerpareDocumentContext.filesizerestrict}MB or less.<br>` +
            `Received: ${file.size.toLocaleString()} bytes (limit: ${Math.floor(maxSizeBytes).toLocaleString()} bytes).<br>` +
            `Note: File Explorer may round file sizes.`,
            'Upload Error',
        );
        e.target.value = ""; // Reset file input
        $('#overlay').hide();
        return false;
    }

    const validTypes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/pdf"
    ];
    if (!validTypes.includes(file.type)) {
        toastr.error(`Only PDFs, Word documents, and Excel sheets are supported.`);
        e.target.value = ""; // Reset file input
        $('#overlay').hide();
        return false;
    }



    let acceptableSize = false;
    let acceptableExt = false;
    if (PerpareDocumentContext.filesizerestrict * 1024 * 1024 < file.size) {
        $("#fileuploadoverlay").css('display', 'none');
        FileError("Document size should be less than " + PerpareDocumentContext.filesizerestrict + " MB")
        return false;
    }

    acceptableSize = true;


    acceptableExt = true;



    var len = file.name.length;
    if (len > 250) {
        $('#overlay').hide();
        let docDiv = document.getElementById('DocumentName');
        docDiv.innerHTML = 'File name length should be less than 250 characters';
        docDiv.style.color = 'red';

        return false;
    }


    if (!acceptableSize || !acceptableExt) {
        $('#overlay').hide();
        let docDiv = document.getElementById('docname');
        docDiv.innerHTML = 'Something went wrong. Try after sometime or Contact Administrator';
        docDiv.style.color = 'red';
        return false;
    }


    // Check for signatures or password protection if it's a PDF
    if (file.type === "application/pdf") {
        const valid = await validatePDF(file);
        if (!valid) {
            $('#overlay').hide();
            return false;

        }
        if (valid == "signed") {

            $('#InitialRequired, #QrCodeRequired').prop('checked', false).prop('disabled', true);

            // Make labels look disabled (light opacity)
            $('label[for="InitialRequired"], label[for="QrCodeRequired"]').css('opacity', '0.5');

            // Show warning
            $('#signatureWarning').css('display', 'flex');

            $('#watermarkdiv').hide();
        }
    }

    if (file) {
        const reader = new FileReader();
        reader.onload = async function (event) {
            let formData = new FormData();
            formData.append("file", file);
            let docDiv = document.getElementById('DocumentName');
            docDiv.innerHTML = "";
            docDiv.style.color = 'black';
            let loaderSpan = document.createElement('span');
            loaderSpan.className = 'loaderfile';

            docDiv.appendChild(loaderSpan);

            if (file.type == "application/pdf") {
                const filebase64String = event.target.result.split(',')[1];
                document.getElementById('filebase64').value = filebase64String;
                // Legacy context assignments
                PerpareDocumentContext.fileBase64 = filebase64String;
                PerpareDocumentContext.fileName = file.name.split('.').slice(0, -1).join('.');
                PerpareDocumentContext.docName = file.name;
                PerpareDocumentContext.fileSize = file.size;
                PerpareDocumentContext.isDocOrExcelConverted = false;
                window.globalFile = file;
                window.globalFileName = file.name;

                $("#DocumentName").val(file.name);
                $("#thumbnail").removeClass('classshide');
                $('#Continue').removeAttr('disabled').removeClass('disabled-blur');
                $('#quickSign').removeAttr('disabled').removeClass('disabled-blur');
                isFileUploaded = true;
                $("#myModal").addClass('classshide');
                $('#overlay').hide();

            } else {
                $('#overlay').hide();
                const maxConvertedSize = PerpareDocumentContext.filesizerestrict * 1024 * 1024;
                if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                    startLoaderForConversion('docx');
                    const convertedfile = await convertDocxToPDF(file, "word");
                    if (!convertedfile) {
                        e.target.value = "";
                        return false;
                    }
                    if (convertedfile.size > maxConvertedSize) {
                        timererror(`Converted to PDF, but file size exceeds ${PerpareDocumentContext.filesizerestrict} MB. Please upload a smaller file.`);
                        e.target.value = "";
                        return false;
                    }
                    const b64 = await fileToBase64(convertedfile);
                    document.getElementById('filebase64').value = b64;
                    // Legacy context assignments for converted doc
                    PerpareDocumentContext.fileBase64 = b64;
                    PerpareDocumentContext.fileName = file.name.split('.').slice(0, -1).join('.');
                    PerpareDocumentContext.docName = file.name;
                    PerpareDocumentContext.fileSize = convertedfile.size;
                    PerpareDocumentContext.isDocOrExcelConverted = true;
                    window.globalFile = convertedfile;
                    window.globalFileName = convertedfile.name || file.name.replace(/\.docx$/i, '.pdf');

                    $("#DocumentName").val(file.name);
                    $("#thumbnail").removeClass('classshide');
                    $('#Continue').removeAttr('disabled').removeClass('disabled-blur');
                    $('#quickSign').removeAttr('disabled').removeClass('disabled-blur');
                    isFileUploaded = true;
                    $("#myModal").addClass('classshide');


                    timersuccess();
                    e.target.value = ""; // Reset file input
                } else {
                    startLoaderForConversion('xlsx');
                    const convertedfile = await convertDocxToPDF(file, "xlsx");
                    if (!convertedfile) {
                        e.target.value = "";
                        return false;
                    }
                    if (convertedfile.size > maxConvertedSize) {
                        timererror(`Converted to PDF, but file size exceeds ${PerpareDocumentContext.filesizerestrict} MB. Please upload a smaller file.`);
                        e.target.value = ""; // Reset file input
                        return false;
                    }
                    const b64 = await fileToBase64(convertedfile);
                    document.getElementById('filebase64').value = b64;
                    PerpareDocumentContext.fileBase64 = b64;
                    PerpareDocumentContext.fileName = file.name.split('.').slice(0, -1).join('.');
                    PerpareDocumentContext.docName = file.name;
                    PerpareDocumentContext.fileSize = convertedfile.size;
                    PerpareDocumentContext.isDocOrExcelConverted = true;
                    window.globalFile = convertedfile;
                    window.globalFileName = convertedfile.name || file.name.replace(/\.xlsx$/i, '.pdf');

                    $("#DocumentName").val(file.name);
                    $("#thumbnail").removeClass('classshide');
                    $('#Continue').removeAttr('disabled').removeClass('disabled-blur');
                    $('#quickSign').removeAttr('disabled').removeClass('disabled-blur');
                    isFileUploaded = true;
                    $("#myModal").addClass('classshide');


                    timersuccess();
                    e.target.value = ""; // Reset file input
                }


            }

        };


        reader.readAsDataURL(file);
    }
    globalFile = file;
    updateFileInfo(file);
    showPrepareScreen();
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
                            text: "This document has already been signed, but you can still use it for signing."
                        });
                        resolve("signed");
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
                        title: 'File error',
                        text: "The document may be corrupted."
                    });
                }
                resolve(false);
            }
        };
    });
}

async function convertDocxToPDF(wordFile, filetype) {
    try {
        let formData = new FormData();
        formData.append("file", wordFile);
        let response = await fetch("/ConvertToPdf/ConvertFile", { // Adjust the API endpoint
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            handleConversionFailure(filetype, `Unable to convert the ${filetype === 'xlsx' ? 'Excel' : 'Word'} document. Please try again.`);
            return null;
        }

        let blob = await response.blob();


        const pdfFile = new File(
            [blob],
            wordFile.name.replace(/\.docx$/, '.pdf'),
            { type: 'application/pdf', lastModified: wordFile.lastModified }
        );

        return pdfFile;


    } catch (error) {
        console.error("Error converting DOCX to PDF:", error);
        handleConversionFailure(filetype, 'Something went wrong during file conversion.');
        return null;
    }
}

function convertFileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (event) {
            resolve(event.target.result);
        };

        reader.onerror = function (error) {
            reject(error);
        };

        reader.readAsArrayBuffer(file);
    });
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

let conversionLoaderTimeoutHandle = null;
let conversionLongRunningNotified = false;
let timersuccessIntervalHandle = null;
let overlayCountdownIntervalHandle = null;

function startLoaderForConversion(type) {
    stopLoaderForConversion();
    const overlayId = type === 'xlsx' ? 'fileuploadxlsxconversionoverlay' : 'fileuploaddocxconversionoverlay';
    const overlay = document.getElementById(overlayId);
    if (overlay) {
        overlay.style.display = 'flex';
    }
    conversionLongRunningNotified = false;
    conversionLoaderTimeoutHandle = setTimeout(() => {
        if (!conversionLongRunningNotified) {
            conversionLongRunningNotified = true;
            timermessage('Conversion is taking longer than expected. Please wait…');
        }
    }, 45000);
}

function stopLoaderForConversion(success = true) {
    if (conversionLoaderTimeoutHandle) {
        clearTimeout(conversionLoaderTimeoutHandle);
        conversionLoaderTimeoutHandle = null;
    }
    conversionLongRunningNotified = false;
    ['fileuploaddocxconversionoverlay', 'fileuploadxlsxconversionoverlay'].forEach((id) => {
        const overlay = document.getElementById(id);
        if (overlay) {
            overlay.style.display = 'none';
        }
    });
    if (!success) {
        if (typeof $ === 'function') {
            $('#overlay').hide();
        } else {
            const rootOverlay = document.getElementById('overlay');
            if (rootOverlay) {
                rootOverlay.style.display = 'none';
            }
        }
    }
}

function showConversionIssueModal(type) {
    const modal = document.getElementById('modal-overlay');
    const wordIssue = document.getElementById('worldissue');
    const excelIssue = document.getElementById('excelissue');
    if (!modal) {
        return;
    }

    modal.style.display = 'flex';
    if (wordIssue) {
        wordIssue.classList.add('d-none');
    }
    if (excelIssue) {
        excelIssue.classList.add('d-none');
    }

    if (type === 'xlsx') {
        if (excelIssue) {
            excelIssue.classList.remove('d-none');
        }
    } else if (wordIssue) {
        wordIssue.classList.remove('d-none');
    }
}

function handleConversionFailure(filetype, message) {
    stopLoaderForConversion(false);
    showConversionIssueModal(filetype === 'xlsx' ? 'xlsx' : 'docx');
    timererror(message || 'Unable to convert the selected file. Please check the document and try again.');
}

function timersuccess(durationSeconds = 3) {
    stopLoaderForConversion(true);
    const overlay = document.getElementById('fileuploadsuccessoverlay');
    if (!overlay) {
        timermessage('Document converted successfully.', 'success');
        return;
    }

    overlay.style.display = 'flex';
    const countdownEl = document.getElementById('timersuccess');
    if (timersuccessIntervalHandle) {
        clearInterval(timersuccessIntervalHandle);
    }
    let remaining = durationSeconds;
    if (countdownEl) {
        countdownEl.textContent = ` (${remaining}s)`;
    }
    timersuccessIntervalHandle = setInterval(() => {
        remaining -= 1;
        if (countdownEl) {
            countdownEl.textContent = ` (${Math.max(remaining, 0)}s)`;
        }
        if (remaining <= 0) {
            clearInterval(timersuccessIntervalHandle);
            timersuccessIntervalHandle = null;
            overlay.style.display = 'none';
            if (countdownEl) {
                countdownEl.textContent = '';
            }
        }
    }, 1000);

    timermessage('Document converted successfully.', 'success');
}

function timererror(message) {
    stopLoaderForConversion(false);
    const overlay = document.getElementById('fileuploadsuccessoverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    timermessage(message || 'Something went wrong during conversion.', 'error');
}

function timermessage(message, type = 'info') {
    if (typeof toastr !== 'undefined' && toastr) {
        const method = type === 'error' ? 'error' : type === 'success' ? 'success' : 'info';
        if (typeof toastr[method] === 'function') {
            toastr[method](message);
            return;
        }
    }

    if (type === 'error') {
        console.error(message);
    } else {
        console.log(message);
    }
}


if (typeof window !== 'undefined') {
    if (!window.timersuccess) {
        window.timersuccess = timersuccess;
    }
    if (!window.timererror) {
        window.timererror = timererror;
    }
    if (!window.timermessage) {
        window.timermessage = timermessage;
    }
    window.startLoaderForConversion = startLoaderForConversion;
    window.stopLoaderForConversion = stopLoaderForConversion;
}
function resolvePdfContainer() {
    if (typeof document === 'undefined') {
        return null;
    }

    if (typeof window !== 'undefined' && window.pdfContainer instanceof HTMLElement) {
        if (document.contains(window.pdfContainer)) {
            return window.pdfContainer;
        }
    }

    if (typeof pdfContainer !== 'undefined' && pdfContainer instanceof HTMLElement) {
        if (document.contains(pdfContainer)) {
            return pdfContainer;
        }
    }

    const fallback = document.getElementById('pdf-container') || document.querySelector('#pdf-container');
    if (typeof window !== 'undefined') {
        window.pdfContainer = fallback || null;
    }
    return fallback || null;
}
function processfile(filebase64) {
    // Validate base64 input
    if (!filebase64 || typeof filebase64 !== 'string' || filebase64.trim() === '') {
        console.error('[processfile] Invalid filebase64 parameter:', filebase64);
        safeToastrError('Invalid file data. Please upload a file again.');
        return;
    }

    console.log('[processfile] Received base64 data, length:', filebase64.length);

    // Safe pdfContainer access with fallback
    const container = resolvePdfContainer();

    if (!container) {
        console.error('[processfile] Missing pdf-container element; cannot render document.');
        safeToastrError('PDF viewer container not found. Please refresh the page.');
        return;
    }

    resetPdfViewerState();

    // Decode base64 with error handling
    let pdfData;
    try {
        pdfData = atob(filebase64);
        console.log('[processfile] Decoded PDF data, size:', pdfData.length, 'bytes');

        if (pdfData.length === 0) {
            console.error('[processfile] Decoded PDF data is empty (0 bytes)');
            safeToastrError('The uploaded file is empty. Please upload a valid PDF.');
            return;
        }
    } catch (err) {
        console.error('[processfile] Failed to decode base64:', err);
        safeToastrError('Invalid file encoding. Please re-upload the file.');
        return;
    }
    const arrayBuffer = new Uint8Array(pdfData.length);
    for (let i = 0; i < pdfData.length; i++) {
        arrayBuffer[i] = pdfData.charCodeAt(i);
    }

    pdfjsLib.getDocument({ data: arrayBuffer }).promise.then(async pdf => {
        uploadedPDF = pdf;
        container.innerHTML = '';

        // Expose page count to legacy context
        try {
            if (window.PerpareDocumentContext && typeof window.PerpareDocumentContext === 'object') {
                window.PerpareDocumentContext.pageCount = pdf.numPages;
            }
        } catch (e) {
            console.warn('Failed to set PerpareDocumentContext.pageCount', e);
        }



        // Create page containers WITHOUT awaiting getPage
        for (let pageNum = 0; pageNum < pdf.numPages; pageNum++) {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'pdf-page';
            pageDiv.dataset.pageNumber = pageNum;
            pageDiv.style.minHeight = '200px';
            container.appendChild(pageDiv);
        }

        // Pre-render first 20 pages and wait for all to complete
        const renderTasks = [];
        const limit = Math.min(20, pdf.numPages);
        for (let i = 0; i < limit; i++) {
            renderTasks.push(renderPage(i));
        }

        await Promise.all(renderTasks);  // Wait for all top 20 to render



        // Now enable scroll rendering
        setupScrollRendering();
        updatePageIndicatorDisplay(1);
        resetZoomLevel();
    }).catch(err => {
        console.error('[processfile] Error loading PDF:', err);
        console.error('[processfile] Error name:', err.name);
        console.error('[processfile] Error message:', err.message);

        let errorMsg = 'Failed to load PDF document.';
        if (err.name === 'InvalidPDFException') {
            if (err.message.includes('empty') || err.message.includes('zero bytes')) {
                errorMsg = 'The PDF file is empty. Please upload a valid file.';
                console.error('[processfile] Likely cause: filebase64 input is empty or file conversion failed');
            } else {
                errorMsg = 'The file is not a valid PDF. Please upload a PDF document.';
            }
        } else if (err.name === 'PasswordException') {
            errorMsg = 'This PDF is password protected. Please upload an unprotected file.';
        }

        safeToastrError(errorMsg);
        document.getElementById("loading-text1").innerText = "Error loading document";
    });
}

async function checkprotectedorsigned(file) {


    const buffer = await convertFileToArrayBuffer(file);
    const { PDFNet } = webviwerInstance;
    await PDFNet.initialize();

    const doc = await PDFNet.PDFDoc.createFromBuffer(buffer);
    if (!(await doc.initSecurityHandler())) {


        document.getElementById('docname').innerHTML = "Password-protected documents are not allowed."
        document.getElementById('docname').style.color = 'red';
        return false;
    } else if (await doc.hasSignatures()) {

        document.getElementById('docname').innerHTML = "Invalid Document, Document has already been signed."
        document.getElementById('docname').style.color = 'red';
        return false;
    } else {
        return true;
    }
}

let uploadedPDF = null;
let currentPage = 1;
const pagesPerBatch = 10; // Load 10 pages at a time

const renderQueue = new Set();
const renderedPages = new Set();

// Viewer interaction state (zoom + pagination controls)
let pdfZoomLevel = 1;
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





function setupScrollRendering() {
    const observer = new IntersectionObserver(async (entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                const pageDiv = entry.target;
                const pageNum = parseInt(pageDiv.dataset.pageNumber);
                setCurrentPage(pageNum + 1);

                // Load previous 2 to next 2 pages
                const start = Math.max(0, pageNum - 1);
                const end = Math.min(uploadedPDF.numPages - 1, pageNum + 1);

                for (let i = start; i <= end; i++) {
                    if (!renderQueue.has(i)) {
                        renderQueue.add(i);
                        await renderPage(i);
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

function adjustZoom(delta) {
    pdfZoomLevel = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pdfZoomLevel + delta));
    applyZoom();
}

function applyZoom() {
    const container = (typeof window !== 'undefined' && window.pdfContainer) ||
        (typeof pdfContainer !== 'undefined' ? pdfContainer : null) ||
        document.getElementById('pdf-container');
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
    const container = (typeof window !== 'undefined' && window.pdfContainer) ||
        (typeof pdfContainer !== 'undefined' ? pdfContainer : null) ||
        document.getElementById('pdf-container');
    if (!uploadedPDF || !container || !scrollContainerEl) return;
    const clampedPage = Math.max(1, Math.min(uploadedPDF.numPages, targetPage));
    const pageElement = container.querySelector(`[data-page-number="${clampedPage - 1}"]`);
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
    if (!pageIndicatorEl) return;
    const total = uploadedPDF ? uploadedPDF.numPages : 0;
    if (!total) {
        pageIndicatorEl.textContent = 'Page 0 / 0';
        return;
    }
    const safePage = Math.max(1, Math.min(total, pageNumber || currentPage || 1));
    pageIndicatorEl.textContent = `Page ${safePage} / ${total}`;
}





async function renderPage(pageNum) {
    if (renderedPages.has(pageNum)) return;  //Skip if already rendered
    renderedPages.add(pageNum);
    const page = await uploadedPDF.getPage(pageNum + 1);

    const scale = 1.5;
    const rotation = page.rotate; // Rotation from the PDF metadata
    rotationDataval = rotation;
    const viewport = page.getViewport({ scale, rotation }); // ✅ Apply rotation

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = '100%';

    const context = canvas.getContext('2d');
    const renderContext = { canvasContext: context, viewport };

    const container = document.querySelector(`[data-page-number="${pageNum}"]`);
    container.innerHTML = '';
    container.style.position = 'relative';
    container.dataset.pageNum = pageNum;
    //container.dataset.rotation = rotation; // Optional: store for later
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

    if (iswatermarkpresent && watermarktext) {
        applyWatermark(annotationLayer, watermarktext);
    }

    drawInitialsForPage(pageNum, canvas, annotationLayer);
    initialsDrawnPages.add(pageNum);
}



function drawInitialsForPage(pageNum, canvas, pageannotationLayer) {
    for (const selectedRole in initialsStore) {
        const pageData = initialsStore[selectedRole][pageNum];
        if (!pageData) continue;
        for (const initialData of pageData) {
            const fieldname = initialData.id;
            let left = initialData.left;
            let top = initialData.top;
            let width = initialData.width;
            let height = initialData.height;
            const element = createInitialElement("INITIAL", selectedRole, left, top, fieldname, width, height);
            pageannotationLayer.appendChild(element);

            const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
            const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
            const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
            const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
            element.setAttribute('data-wpercent', wratio)
            element.setAttribute('data-hpercent', hratio)
            element.setAttribute('data-lpercent', lratio)
            element.setAttribute('data-tpercent', tratio)
        }
    }
}



function createInitialElement(type, selectedRole, leftPercent, topPercent, group, widthPercent, heightPercent) {
    const canvas = document.querySelector('canvas');
    const canvasRect = canvas.getBoundingClientRect();

    // Convert percentages to pixels
    const left = (leftPercent / 100) * canvasWidth;
    const top = (topPercent / 100) * canvasHeight;
    const width = (widthPercent / 100) * canvasWidth;
    const height = (heightPercent / 100) * canvasHeight;

    const element = document.createElement('div');
    element.classList.add('draggable');
    element.style.left = left + 'px';
    element.style.top = top + 'px';
    element.style.border = 'none';

    const content = document.createElement('div');
    content.classList.add('draggable-content');

    if (!PerpareDocumentContext.MultiSign) {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';
        imageContainer.style.minWidth = "30px";
        imageContainer.style.minHeight = "30px";

        if (width > 0 && height > 0) {
            imageContainer.style.width = width + 'px';
            imageContainer.style.height = height + 'px';
        } else if (rotationData === 270 || rotationData === 90) {
            imageContainer.style.width = width + 'px';
            imageContainer.style.height = height + 'px';
        } else {
            imageContainer.style.width = width + 'px';
            imageContainer.style.height = height + 'px';
        }

        imageContainer.setAttribute('role', 'INITIAL' + "_" + selectedRole);

        const uploadedImage = document.createElement('img');
        uploadedImage.className = 'uploaded-image';
        uploadedImage.setAttribute('alt', 'initial');
        uploadedImage.id = group;

        if (initialImg.startsWith("data:image")) {
            uploadedImage.src = initialImg;
        } else {
            uploadedImage.src = 'data:image/png;base64,' + initialImg;
        }

        uploadedImage.draggable = false;
        uploadedImage.style.width = '100%';
        uploadedImage.style.height = '100%';
        imageContainer.appendChild(uploadedImage);
        content.appendChild(imageContainer);

    } else {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';
        imageContainer.style.minWidth = "30px";
        imageContainer.style.minHeight = "30px";

        if (width > 0 && height > 0) {
            imageContainer.style.width = width + 'px';
            imageContainer.style.height = height + 'px';
        } else if (rotationData === 270 || rotationData === 90) {
            imageContainer.style.width = width + 'px';
            imageContainer.style.height = height + 'px';
        } else {
            imageContainer.style.width = width + 'px';
            imageContainer.style.height = height + 'px';
        }

        const fontSize = (canvasWidth * 0.08907) / 7.5;
        imageContainer.setAttribute('role', 'INITIAL' + "_" + selectedRole);

        const spanEle = document.createElement("span");
        spanEle.textContent = `INITIAL_${selectedRole}`;
        spanEle.id = group;
        spanEle.style.color = '#4A90E2';
        spanEle.style.backgroundColor = '#e5e5e5';
        spanEle.style.fontSize = '13px';
        spanEle.style.overflow = 'hidden';
        spanEle.style.width = '100%';
        spanEle.style.height = '100%';
        spanEle.style.display = 'block';

        imageContainer.appendChild(spanEle);
        content.style.border = '2px solid #4A90E2';
        content.appendChild(imageContainer);
    }

    element.appendChild(content);

    addEditIcon(content, type);

    content.setAttribute('tabindex', '0');
    addResizeHandles(content, element, type);

    content.addEventListener("click", () => {
        content.focus();
    });

    content.addEventListener("touchstart", () => {
        showHandles();

        const editIcon = content.querySelector('.edit-icon');
        if (editIcon) {
            editIcon.style.opacity = '1';
        }
    });

    content.addEventListener("focus", showHandles);
    content.addEventListener("blur", hideHandles);

    function showHandles() {
        const handles = content.querySelectorAll('.resize-handle');
        handles.forEach(handle => handle.style.display = 'block');
        content.style.border = '2px solid #4A90E2';
    }

    function hideHandles() {
        const handles = content.querySelectorAll('.resize-handle');
        handles.forEach(handle => handle.style.display = 'none');
        content.style.border = 'none';

        // Optionally hide edit icon again here
        const editIcon = content.querySelector('.edit-icon');
        if (editIcon) {
            editIcon.style.opacity = '0';
        }
    }

    element.style.position = 'absolute';
    element.style.pointerEvents = 'auto';
    element.style.zIndex = '1000';

    makeDraggable(element);

    return element;
}






















function onClick(type) {
    // const pdfPage = document.querySelector('div.pdf-page');
    const pages = document.querySelectorAll('.pdf-page');
    let current = null;
    let minDistance = Infinity;
    let currentPage = "";
    let pdfPage = null;

    pages.forEach((page, i) => {
        const rect = page.getBoundingClientRect();
        const distance = Math.abs(rect.top);

        if (distance < minDistance) {
            minDistance = distance;
            pdfPage = page;
            currentPage = i;
        }
    });
    if (pdfPage) {
        const annotationLayer = pdfPage.querySelector('.annotation-layer');
        const rect = pdfPage.getBoundingClientRect();
        const left = rect.width / 2 - 50;
        const top = rect.height / 2 - 50;
        const selectedRole = PerpareDocumentContext.selectuser;



        if (type === "SIGNATURE" || type === "ESEAL" || type === "QRCODE") {
            if (type === "SIGNATURE") {
                var fieldname = 'SIGNATURE' + "_" + selectedRole;
            } else if (type === "ESEAL") {
                var fieldname = 'ESEAL' + "_" + selectedRole;
            } else if (type === "QRCODE") {
                var fieldname = 'QRCODE' + '_' + selectedRole;
            }

            if (!fieldnameslist.includes(fieldname)) {

                const element = createDraggableElement(type, left, top);
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
                    if (type === "SIGNATURE") {
                        document.getElementById('INITIAL').disabled = false;
                    }

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
        else if (type === "INITIAL") {
            const className = `${selectedRole}_signature-container`;
            const isSignaturePresent = pdfPage.getElementsByClassName(className)[0];
            const initialFieldName = 'INITIAL' + currentPage + selectedRole;
            const number = PerpareDocumentContext.receipientEmails.findIndex(
                item => item.email === selectedRole
            );
            const user = `image${number + 1}`;
            if (isSignaturePresent) {
                swal({
                    title: "Info",
                    text: `Initials are not permitted on pages where a signature is already present : ${selectedRole}`,
                    type: "info",
                });

            }
            else if (fieldnameslist.includes(initialFieldName)) {
                swal({
                    title: "Info",
                    text: "More than one initial is not allowed in a page",
                    type: "info",
                });

            }
            else {
                swal({
                    type: 'info', title: "Message", text: "Do you want to place initials on every page ?", showCancelButton: true, showConfirmButton: true, confirmButtonText: 'Yes', cancelButtonText: "No",
                }, function (isConfirm) {
                    if (isConfirm) {
                        const initialsList = fieldnameslist
                            .filter(each => each.startsWith("INITIAL") && each.endsWith(selectedRole))
                            .map(each => {
                                const regex = new RegExp(`^INITIAL(\\d+)${selectedRole}$`);
                                const match = each.match(regex);
                                return match ? parseInt(match[1], 10) + 1 : null; // convert to number and add 1
                            })
                            .filter(num => num !== null);

                        if (initialsList.length !== 0) {
                            swal({
                                title: "Info",
                                text: `More than one initial is not allowed at page number(s): ${initialsList.join(", ")}`,
                                type: "info",
                            }, function () {
                                return;
                            });

                        }

                        document.querySelectorAll('.pdf-page').forEach((page, i) => {
                            if (page.classList.contains('pdf-page')) {
                                const pageannotationLayer = page.querySelector('.annotation-layer');
                                var fieldname = 'INITIAL' + i + selectedRole;
                                const number = PerpareDocumentContext.receipientEmails.findIndex(
                                    item => item.email === selectedRole
                                );
                                const user = `image${number + 1}`;
                                if (!pageannotationLayer) {
                                    fieldnameslist.push(fieldname);
                                    let defaultWidth, defaultHeight;

                                    if (rotationData === 270 || rotationData === 90) {
                                        defaultWidth = (canvasWidth * 0.08907);   // wider in vertical orientation
                                        defaultHeight = (canvasWidth * 0.08245);
                                    } else {
                                        defaultWidth = (canvasWidth * 0.08245);   // normal horizontal orientation
                                        defaultHeight = (canvasWidth * 0.08907);
                                    }

                                    const initialData = {
                                        id: fieldname,
                                        user: user,
                                        width: ((defaultWidth / canvasWidth) * 100).toFixed(2),   // Store as percentage
                                        height: ((defaultHeight / canvasHeight) * 100).toFixed(2),
                                        top: ((top / canvasHeight) * 100).toFixed(2),
                                        left: ((left / canvasWidth) * 100).toFixed(2)
                                    };


                                    if (!initialsStore[selectedRole]) initialsStore[selectedRole] = {};
                                    if (!initialsStore[selectedRole][i]) initialsStore[selectedRole][i] = [];
                                    initialsStore[selectedRole][i].push(initialData);
                                    return;
                                }
                                initialsDrawnPages.add(i);
                                const className = `${selectedRole}_signature-container`;
                                const isSignaturePresent = page.getElementsByClassName(className)[0];
                                if (!isSignaturePresent) {

                                    const element = createDraggableElement(type, left, top, fieldname);
                                    pageannotationLayer.appendChild(element);


                                    const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                                    const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                                    const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                                    const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                                    element.setAttribute('data-wpercent', wratio)
                                    element.setAttribute('data-hpercent', hratio)
                                    element.setAttribute('data-lpercent', lratio)
                                    element.setAttribute('data-tpercent', tratio)

                                    if ((element.offsetWidth + left) > rect.width) {
                                        pageannotationLayer.removeChild(element);
                                    } else {
                                        fieldnameslist.push(fieldname);
                                        const secondChild = element.querySelector('.image-container');
                                        let width = 0;
                                        let height = 0;

                                        if (secondChild) {
                                            width = secondChild.offsetWidth;
                                            height = secondChild.offsetHeight;

                                        }

                                        const canvasRect = document.querySelector('canvas').getBoundingClientRect();

                                        const initialData = {
                                            id: fieldname,
                                            user: user,
                                            width: ((width / canvasRect.width) * 100).toFixed(2),   // percentage string
                                            height: ((height / canvasRect.height) * 100).toFixed(2),
                                            top: ((top / canvasRect.height) * 100).toFixed(2),
                                            left: ((left / canvasRect.width) * 100).toFixed(2)
                                        };

                                        if (!initialsStore[selectedRole]) initialsStore[selectedRole] = {};
                                        if (!initialsStore[selectedRole][i]) initialsStore[selectedRole][i] = [];

                                        initialsStore[selectedRole][i].push(initialData);

                                    }
                                    scaleX = originalWidth / rect.width;
                                    scaleY = originalHeight / rect.height;
                                    //addDragAndDropListeners(element);
                                }
                            }

                        });

                    }
                    else {
                        const pageannotationLayer = pdfPage.querySelector('.annotation-layer');
                        var fieldname = 'INITIAL' + pageNumber + selectedRole;
                        const element = createDraggableElement(type, left, top, fieldname);
                        pageannotationLayer.appendChild(element);
                        initialsDrawnPages.add(pageNumber);

                        const number = PerpareDocumentContext.receipientEmails.findIndex(
                            item => item.email === selectedRole
                        );
                        const user = `image${number + 1}`;



                        const wratio = (element.firstElementChild.offsetWidth / (document.querySelector('canvas')).getBoundingClientRect().width);
                        const hratio = (element.firstElementChild.offsetHeight / (document.querySelector('canvas')).getBoundingClientRect().height);
                        const lratio = (left / (document.querySelector('canvas')).getBoundingClientRect().width);
                        const tratio = (top / (document.querySelector('canvas')).getBoundingClientRect().height);
                        element.setAttribute('data-wpercent', wratio)
                        element.setAttribute('data-hpercent', hratio)
                        element.setAttribute('data-lpercent', lratio)
                        element.setAttribute('data-tpercent', tratio)

                        if ((element.offsetWidth + left) > rect.width) {
                            pageannotationLayer.removeChild(element);
                        } else {
                            fieldnameslist.push(fieldname);

                            const secondChild = element.children[1]; // second child (index 1)

                            let width = 0;
                            let height = 0;

                            if (secondChild) {
                                width = secondChild.offsetWidth;
                                height = secondChild.offsetHeight;

                            }

                            const canvasRect = document.querySelector('canvas').getBoundingClientRect();

                            const initialData = {
                                id: fieldname,
                                user: user,
                                width: width,
                                height: height,
                                top: ((top / canvasRect.height) * 100).toFixed(2),
                                left: ((left / canvasRect.width) * 100).toFixed(2)
                            };

                            if (!initialsStore[selectedRole]) initialsStore[selectedRole] = {};
                            if (!initialsStore[selectedRole][pageNumber]) initialsStore[selectedRole][pageNumber] = [];

                            initialsStore[selectedRole][pageNumber].push(initialData);

                        }
                        scaleX = originalWidth / rect.width;
                        scaleY = originalHeight / rect.height;
                        //addDragAndDropListeners(element);
                    }


                });

            }

        }



    }


}



function createGhostElement(event, autotype, fieldTypeOverride) {
    const selectedRole = PerpareDocumentContext.selectuser;
    const element = document.createElement('div');
    element.classList.add('draggable');

    const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;

    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    var fontSize = 0;
    const targetId = fieldTypeOverride || (event && event.target ? event.target.id : '');
    if (!PerpareDocumentContext.MultiSign) {//single signer
        if (targetId === 'SIGNATURE') {
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

        else if (targetId === 'ESEAL') {
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


        else if (targetId === 'QRCODE') {
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


        else if (targetId === 'INITIAL') {
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
        if (targetId === 'SIGNATURE') {
            const input = document.createElement('div');
            input.style.border = "1px solid #44aad1";
            input.style.textAlign = 'center';
            if (signature_dimensions_others.height <= 120) {
                input.style.width = (signature_dimensions_others.width * 0.2702426536) + 'px';
                input.style.height = (signature_dimensions_others.height * 0.3756481986) + 'px';
                fontSize = (canvasWidth * 0.0575) / 4.5;
            } else if (signature_dimensions_others.height < 160 && signature_dimensions_others.height > 120) {
                input.style.width = (signature_dimensions_others.width * 0.2895) + 'px';
                input.style.height = (signature_dimensions_others.height * 0.4056481986) + 'px';
                fontSize = (canvasWidth * 0.0560) / 4.5;
            } else if (signature_dimensions_others.height > 160) {
                input.style.width = (signature_dimensions_others.width * 0.2895) + 'px';
                input.style.height = (signature_dimensions_others.height * 0.4056481986) + 'px';
                fontSize = (canvasWidth * 0.0560) / 4.5;
            }
            input.textContent = "Signature";
            input.style.backgroundColor = "#d8d7d78a";
            input.style.color = "#44aad1";
            input.style.fontSize = `${fontSize}px`;

            element.appendChild(input);
        }
        else if (targetId === 'QRCODE') {
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

        else if (targetId === 'ESEAL') {
            const input = document.createElement('div');
            input.style.border = "1px solid #44aad1";
            input.style.textAlign = 'center';
            input.style.padding = '30%';
            input.style.width = (eseal_dimensions_others.width * 0.363097) + 'px';
            input.style.height = (eseal_dimensions_others.height * 0.341452) + 'px';
            fontSize = (canvasWidth * 0.08907) / 7.5;
            input.textContent = "ESEAL";
            input.style.backgroundColor = "#d8d7d78a";
            input.style.color = "#44aad1";
            input.style.fontSize = `${fontSize}px`;
            element.appendChild(input);
        }


        else if (targetId === 'INITIAL') {
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
    editIcon.classList.add('edit-icon', 'top-right');
    editIcon.innerHTML = '<i class="fas fa-trash-can" style="color: #e63946;"></i>';

    //editIcon.innerHTML = '🗑';




    if (type === 'SIGNATURE') {
        editIcon.addEventListener('click', () => {
            const firstChild = content.firstElementChild;
            const emailvalue = firstChild.id.replace("SIGNATURE_", "");
            const hasInitials = fieldnameslist.some(item =>
                item.startsWith("INITIAL") && item.includes(emailvalue)
            );
            if (hasInitials) {
                // Show popup if initials exist for that email
                $('#EditFields_Modal').modal('hide');
                swal({
                    title: 'Info',
                    text: `Please remove all initials linked to ${emailvalue} before deleting the signature.`,
                    type: 'info',
                    icon: 'info',
                }, function (isConfirm) {

                });
                return;
            }
            console.log(firstChild);
            const newHeader = '<h5 class="modal-title">Do you want to delete this field?</h5>';
            const newBody = ``;

            const newFooter = `
                                                                                                                                                                                                                                                                                                                     <button type="button" class="btn btn-danger"  id="deleteFieldName">Delete</button>
                                                                                                                                                                                                                                                                                                                 <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                                                                                                                                                                                                                                                                                             `;

            //Update the modal content
            updateModalContent(newHeader, newBody, newFooter);

            document.getElementById('deleteFieldName').addEventListener('click', () => {
                console.log(content);
                //make initial disable
                const selectedRole = PerpareDocumentContext.selectuser;
                const email = firstChild.id.replace("SIGNATURE_", "");
                if (selectedRole === email) {
                    document.getElementById('INITIAL').disabled = true;
                }
                const element = content.parentElement;
                console.log(element);
                fieldnameslist = fieldnameslist.filter(item => item !== firstChild.role);
                element.remove();

                $('#EditFields_Modal').modal('hide');
            });

            //Show the modal
            $('#EditFields_Modal').modal('show');

        });
    }
    else if (type === 'ESEAL') {
        editIcon.addEventListener('click', () => {
            const firstChild = content.firstElementChild;

            const newHeader = '<h5 class="modal-title">Do you want to delete this field?</h5>';
            const newBody = ``;
            const newFooter = `
                                                                                                                                                                                                                                                                                                                             <button type="button" class="btn btn-danger"  id="deleteFieldName">Delete</button>
                                                                                                                                                                                                                                                                                                                         <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                                                                                                                                                                                                                                                                                                     `;

            //Update the modal content
            updateModalContent(newHeader, newBody, newFooter);

            document.getElementById('deleteFieldName').addEventListener('click', () => {
                console.log(content);
                const element = content.parentElement;
                console.log(element);
                fieldnameslist = fieldnameslist.filter(item => item !== firstChild.role);
                element.remove();
                $('#EditFields_Modal').modal('hide');
            });


            //Show the modal
            $('#EditFields_Modal').modal('show');

        });
    }
    else if (type === 'QRCODE') {
        editIcon.addEventListener('click', () => {
            const firstChild = content.firstElementChild;

            const newHeader = '<h5 class="modal-title">Do you want to delete this field?</h5>';
            const newBody = ``;

            const newFooter = `
                                                                                                                                                                                                                                                                                                                         <button type="button" class="btn btn-danger"  id="deleteFieldName">Delete</button>
                                                                                                                                                                                                                                                                                                                     <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                                                                                                                                                                                                                                                                                                 `;

            //Update the modal content
            updateModalContent(newHeader, newBody, newFooter);

            document.getElementById('deleteFieldName').addEventListener('click', () => {
                console.log(content);
                const element = content.parentElement;
                console.log(element);
                fieldnameslist = fieldnameslist.filter(item => item !== firstChild.role);
                element.remove();
                $('#EditFields_Modal').modal('hide');
            });


            //Show the modal
            $('#EditFields_Modal').modal('show');

        });
    } else if (type === "INITIAL") {

        editIcon.addEventListener('click', () => {

            swal({

                type: 'info',

                title: "Message",

                text: "Do you want to delete initials on every page at the same location?",

                showCancelButton: true,

                showConfirmButton: true,

                confirmButtonText: 'Yes',

                cancelButtonText: "No"

            }, function (isConfirm) {

                if (isConfirm) {

                    const firstChild = content.firstElementChild;

                    const initialId = firstChild.firstChild.id;

                    const email = initialId.replace(/^INITIAL\d+/, "");

                    //Filter the list and remove matching elements from DOM

                    fieldnameslist = fieldnameslist.filter((fieldName) => {

                        const shouldDelete = fieldName.endsWith(email) && fieldName.startsWith("INITIAL");

                        if (shouldDelete) {

                            const initialImg = document.getElementById(fieldName);

                            if (initialImg) {

                                const draggableDiv = initialImg.closest(".draggable");

                                if (draggableDiv) {

                                    draggableDiv.remove(); //Remove from DOM

                                }

                            }

                        }

                        return !shouldDelete;// Keep only non-matching items
                    });
                    delete initialsStore[email];

                } else {
                    const firstChild = content.firstElementChild;
                    const initialId = firstChild.firstChild.id;
                    const email = initialId.replace(/^INITIAL\d+/, "");

                    const match = initialId.match(/^INITIAL(\d+)/);
                    const pagenum = match ? parseInt(match[1]) : -1;

                    const element = content.parentElement;

                    fieldnameslist = fieldnameslist.filter(item => item !== firstChild.firstChild.id);

                    element.remove();
                    delete initialsStore[email][pagenum];
                }

            });

        });

    }



    content.appendChild(editIcon);
}



function resizeStart(e, content, handlePosition, parele, type) {
    isResizing = true;
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

    let updatedLeft = -1;
    let updatedTop = -1;
    let updatedWidth = -1;
    let updatedHeight = -1;




    const MIN_WIDTH = 30;
    const MIN_HEIGHT = 30;

    function resizeMove(e) {
        let clientX, clientY;
        if (e.type === 'mousemove') {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        const pdfPage = content.closest('.pdf-page');
        const annotationLayer = pdfPage?.querySelector('.annotation-layer');
        if (!pdfPage || !annotationLayer) return;

        const annotationRect = annotationLayer.getBoundingClientRect();

        if (
            clientX < annotationRect.left ||
            clientX > annotationRect.right ||
            clientY < annotationRect.top ||
            clientY > annotationRect.bottom
        ) {
            console.log("Cursor left current annotation-layer, skipping resize update");
            return;
        }

        const dx = clientX - startX;
        const dy = clientY - startY;

        newWidth = startWidth;
        newHeight = startHeight;
        newLeft = startLeft;
        newTop = startTop;
        if (handlePosition === 'top-left') {
            const tempWidth = startWidth - dx;
            const tempHeight = startHeight - dy;

            if (tempWidth >= MIN_WIDTH) {
                newWidth = tempWidth;
                newLeft = startLeft + dx;
                parele.style.left = `${newLeft}px`;
            } else {
                newWidth = MIN_WIDTH; // lock width
            }

            if (tempHeight >= MIN_HEIGHT) {
                newHeight = tempHeight;
                newTop = startTop + dy;
                parele.style.top = `${newTop}px`;
            } else {
                newHeight = MIN_HEIGHT; // lock height
            }
        }
        else if (handlePosition === 'top-right') {
            const tempWidth = startWidth + dx;
            const tempHeight = startHeight - dy;

            if (tempWidth >= MIN_WIDTH) {
                newWidth = tempWidth;
            } else {
                newWidth = MIN_WIDTH;
            }

            if (tempHeight >= MIN_HEIGHT) {
                newHeight = tempHeight;
                newTop = startTop + dy;
                parele.style.top = `${newTop}px`;
            } else {
                newHeight = MIN_HEIGHT;
            }
        }
        else if (handlePosition === 'bottom-left') {
            const tempWidth = startWidth - dx;
            const tempHeight = startHeight + dy;

            if (tempWidth >= MIN_WIDTH) {
                newWidth = tempWidth;
                newLeft = startLeft + dx;
                parele.style.left = `${newLeft}px`;
            } else {
                newWidth = MIN_WIDTH;
            }

            if (tempHeight >= MIN_HEIGHT) {
                newHeight = tempHeight;
            } else {
                newHeight = MIN_HEIGHT;
            }
        }
        else { // bottom-right
            const tempWidth = startWidth + dx;
            const tempHeight = startHeight + dy;

            newWidth = Math.max(MIN_WIDTH, tempWidth);
            newHeight = Math.max(MIN_HEIGHT, tempHeight);
            // top/left don’t move here anyway
        }


        // apply resizing only if above threshold
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
            content.firstChild.style.fontSize = `${newHeight / 4.5}px`;
        } else if (isEseal) {
            content.firstChild.style.fontSize = `${newHeight / 7.5}px`;
        } else {
            content.firstChild.style.fontSize = `${newHeight / 2}px`;
        }

        updatedLeft = content.parentElement.style.left;
        updatedTop = content.parentElement.style.top;
        updatedWidth = content.firstChild.style.width;
        updatedHeight = content.firstChild.style.height;
    }



    function resizeEnd() {
        isResizing = false;
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
                const firstChild = content.firstElementChild;
                const inner = firstChild?.firstChild;
                if (!inner || !inner.id) return;

                const initialId = inner.id;
                const selectedRole = initialId.replace(/^INITIAL\d+/, "");

                const newWidth = content.querySelector('.image-container')?.offsetWidth || 0;
                const newHeight = content.querySelector('.image-container')?.offsetHeight || 0;

                if (isConfirm) {
                    fieldnameslist.forEach((fieldName) => {
                        if (fieldName.startsWith("INITIAL") && fieldName.endsWith(selectedRole)) {
                            const initialImg = document.getElementById(fieldName);
                            if (!initialImg) return;

                            const parele = initialImg.closest(".draggable");
                            const container = initialImg.closest(".image-container");
                            const canvas = initialImg.closest('.pdf-page')?.querySelector('canvas');
                            if (!parele || !container || !canvas) return;

                            const canvasRect = canvas.getBoundingClientRect();

                            const lPercent = (newLeft / canvasRect.width) * 100;
                            const tPercent = (newTop / canvasRect.height) * 100;
                            const wPercent = (newWidth / canvasRect.width) * 100;
                            const hPercent = (newHeight / canvasRect.height) * 100;

                            if (newLeft !== null) {
                                parele.style.left = `${newLeft}px`;
                            }
                            if (newTop !== null) {
                                parele.style.top = `${newTop}px`;
                            }
                            if (newWidth !== null) {
                                container.style.width = `${newWidth}px`;
                            }
                            if (newHeight !== null) {
                                container.style.height = `${newHeight}px`;
                            }

                            // Update size only on image-container
                            container.style.width = `${newWidth}px`;
                            container.style.height = `${newHeight}px`;

                            // Update initialsStore for the exact field
                            const pageMatch = fieldName.match(/^INITIAL(\d+)/);
                            const pageIndex = pageMatch ? parseInt(pageMatch[1]) : null;

                            if (pageIndex !== null && initialsStore[selectedRole]?.[pageIndex]) {
                                initialsStore[selectedRole][pageIndex].forEach(obj => {
                                    if (obj.id === fieldName) {
                                        obj.left = lPercent;
                                        obj.top = tPercent;
                                        obj.width = wPercent;
                                        obj.height = hPercent;
                                    }
                                });
                            }
                        }
                    });
                }
                else {
                    const pageIndexMatch = initialId.match(/^INITIAL(\d+)/);
                    if (!pageIndexMatch) return;
                    const pageIndex = parseInt(pageIndexMatch[1]);

                    const initialImg = document.getElementById(initialId);
                    if (!initialImg) return;

                    const parele = initialImg.closest(".draggable");
                    const draggableContent = initialImg.closest(".draggable-content");
                    const container = initialImg.closest(".image-container");
                    const canvas = initialImg.closest('.pdf-page')?.querySelector('canvas');
                    if (!parele || !draggableContent || !container || !canvas) return;

                    const canvasRect = canvas.getBoundingClientRect();

                    // Update position
                    if (handlePosition === 'top-left') {
                        parele.style.left = `${newLeft}px`;
                        parele.style.top = `${newTop}px`;
                    } else if (handlePosition === 'top-right') {
                        parele.style.top = `${newTop}px`;
                    } else if (handlePosition === 'bottom-left') {
                        parele.style.left = `${newLeft}px`;
                    }

                    // Update size
                    container.style.width = `${newWidth}px`;
                    container.style.height = `${newHeight}px`;

                    if (draggableContent.firstChild?.type === 'date') {
                        draggableContent.parentElement.style.width = `${newWidth}px`;
                    }

                    const lPx = parseFloat(parele.style.left) || (parele.getBoundingClientRect().left - canvasRect.left);
                    const tPx = parseFloat(parele.style.top) || (parele.getBoundingClientRect().top - canvasRect.top);

                    const lPercent = (lPx / canvasRect.width) * 100;
                    const tPercent = (tPx / canvasRect.height) * 100;
                    const wPercent = (newWidth / canvasRect.width) * 100;
                    const hPercent = (newHeight / canvasRect.height) * 100;

                    parele.setAttribute('data-wpercent', wPercent / 100);
                    parele.setAttribute('data-hpercent', hPercent / 100);

                    if (initialsStore[selectedRole]?.[pageIndex]) {
                        initialsStore[selectedRole][pageIndex].forEach(obj => {
                            if (obj.id === initialId) {
                                obj.left = lPercent;
                                obj.top = tPercent;
                                obj.width = wPercent;
                                obj.height = hPercent;
                            }
                        });
                    }
                }
            });

        }
    }


    document.addEventListener('mousemove', resizeMove);
    document.addEventListener('mouseup', resizeEnd);

    document.addEventListener('touchmove', resizeMove, { passive: false });
    document.addEventListener('touchend', resizeEnd, { passive: false });
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



function makeDraggable(element) {
    let startX, startY;
    let offsetX, offsetY, isDragging = false;
    let newLeft, newTop;

    const excludedClasses = [
        'resize-handle',
        'edit-icon',
        'input-field',
        'editable-text',
        'image-upload',
        'remove-image-btn'
    ];

    element.addEventListener('mousedown', (e) => {
        if (isResizing) return;
        if (!excludedClasses.some(cls => e.target.classList.contains(cls))) {
            isDragging = true;
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;
            startX = e.clientX;
            startY = e.clientY;
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onEnd);
        }
    });

    element.addEventListener('touchstart', (e) => {
        if (isResizing) return;

        const isInsideExcluded = excludedClasses.some(cls => e.target.closest(`.${cls}`));
        if (isInsideExcluded) return;

        e.preventDefault(); // prevent scroll
        const touch = e.touches[0];
        isDragging = true;
        offsetX = touch.clientX - element.getBoundingClientRect().left;
        offsetY = touch.clientY - element.getBoundingClientRect().top;
        startX = touch.clientX;
        startY = touch.clientY;
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }, { passive: false });


    function onMove(e) {
        if (!isDragging) return;

        const isTouch = e.type.startsWith('touch');
        const clientX = isTouch ? e.touches[0].clientX : e.clientX;
        const clientY = isTouch ? e.touches[0].clientY : e.clientY;

        const pageRect = element.parentElement.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        newLeft = clientX - pageRect.left - offsetX;
        newTop = clientY - pageRect.top - offsetY;

        // Boundary checks
        newLeft = Math.max(0, Math.min(newLeft, pageRect.width - elementRect.width));
        newTop = Math.max(0, Math.min(newTop, pageRect.height - elementRect.height));

        element.style.left = `${newLeft}px`;
        element.style.top = `${newTop}px`;
    }

    function onEnd(e) {
        const isTouch = e.type.startsWith('touch');
        const endX = isTouch ? (e.changedTouches[0]?.clientX ?? 0) : e.clientX;
        const endY = isTouch ? (e.changedTouches[0]?.clientY ?? 0) : e.clientY;

        const movedX = Math.abs(endX - startX);
        const movedY = Math.abs(endY - startY);
        const wasDragged = movedX > 2 || movedY > 2;

        isDragging = false;

        if (isTouch) {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
        } else {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onEnd);
        }

        if (!wasDragged) return; // Skip processing if it's just a tap/click

        // Handle annotations and percentages
        const canvas = document.querySelector('canvas');
        if (!canvas) return;

        const canvasRect = canvas.getBoundingClientRect();

        const lratio = newLeft / canvasRect.width;
        const tratio = newTop / canvasRect.height;

        element.setAttribute('data-lpercent', lratio);
        element.setAttribute('data-tpercent', tratio);

        if (e.target.id.startsWith("INITIAL")) {
            handleInitialAnnotationUpdate(element, lratio, tratio);
        } else {
            element.style.left = `${newLeft}px`;
            element.style.top = `${newTop}px`;
        }
    }

    function handleInitialAnnotationUpdate(element, lPercent, tPercent) {
        swal({
            type: 'info',
            title: "Message",
            text: "Do you want to modify the initial annotation at the same location on every page where it is present?",
            showCancelButton: true,
            showConfirmButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: "No"
        }, function (isConfirm) {
            const firstChild = element.firstElementChild?.firstElementChild;
            const initialId = firstChild?.firstChild?.id;
            if (!initialId) return;

            const selectedRole = initialId.replace(/^INITIAL\d+/, "");
            const newWidth = element.offsetWidth;
            const newHeight = element.offsetHeight;

            const canvas = element.closest('.pdf-page')?.querySelector('canvas');
            const canvasRect = canvas?.getBoundingClientRect();
            if (!canvasRect) return;

            const wPercent = newWidth / canvasRect.width;
            const hPercent = newHeight / canvasRect.height;

            if (isConfirm) {
                fieldnameslist.forEach((fieldName) => {
                    if (fieldName.startsWith("INITIAL") && fieldName.endsWith(selectedRole)) {
                        const initialImg = document.getElementById(fieldName);
                        if (!initialImg) return;

                        const draggableDiv = initialImg.closest(".draggable");
                        const canvas = draggableDiv?.closest('.pdf-page')?.querySelector('canvas');
                        const canvasRect = canvas?.getBoundingClientRect();
                        if (!draggableDiv || !canvasRect) return;

                        draggableDiv.style.left = `${lPercent * canvasRect.width}px`;
                        draggableDiv.style.top = `${tPercent * canvasRect.height}px`;

                        const inner = draggableDiv.querySelector('.image-container');
                        if (inner) {
                            inner.style.width = `${newWidth}px`;
                            inner.style.height = `${newHeight}px`;
                        }

                        const pageMatch = fieldName.match(/^INITIAL(\d+)/);
                        const pageIndex = pageMatch ? parseInt(pageMatch[1]) : null;

                        if (pageIndex !== null && initialsStore[selectedRole]?.[pageIndex]) {
                            initialsStore[selectedRole][pageIndex].forEach(obj => {
                                if (obj.id === fieldName) {
                                    obj.left = lPercent * 100;
                                    obj.top = tPercent * 100;
                                    obj.width = wPercent * 100;
                                    obj.height = hPercent * 100;
                                }
                            });
                        }
                    }
                });
            } else {
                const id = element.id;
                const pageMatch = id.match(/^INITIAL(\d+)/);
                const pageIndex = pageMatch ? parseInt(pageMatch[1]) : null;
                const role = id.replace(/^INITIAL\d+/, "");

                if (pageIndex !== null && initialsStore[role]?.[pageIndex]) {
                    initialsStore[role][pageIndex].forEach(obj => {
                        if (obj.id === id) {
                            obj.left = lPercent * 100;
                            obj.top = tPercent * 100;
                            obj.width = wPercent * 100;
                            obj.height = hPercent * 100;
                        }
                    });
                }
            }
        });
    }
}





function createDraggableElement(type, left, top, group, value, isMandatory) {
    //const selectElement = document.getElementById('ClientSelect');
    const selectedRole = PerpareDocumentContext.selectuser;
    console.log(PerpareDocumentContext);
    var requiredreceipient = PerpareDocumentContext.receipientEmails.find(item => item.email == PerpareDocumentContext.selectuser);


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
    if (!PerpareDocumentContext.MultiSign) {

        if (type === 'SIGNATURE') {
            const input = document.createElement('div');
            content.style.border = "1px solid #44aad1";
            input.style.textAlign = 'center';
            input.classList.add(`${selectedRole}_signature-container`);
            if (signature_dimensions.height <= 120) {

                input.style.width = (signature_dimensions.width * 0.2702426536) + 'px';
                input.style.height = (signature_dimensions.height * 0.3756481986) + 'px';
                const img = document.createElement('img');
                img.src = 'data:image/png;base64,' + signature_img;
                img.draggable = false;
                img.style.width = '100%';
                img.style.height = '100%';
                input.appendChild(img);
            } else if (signature_dimensions.height < 160 && signature_dimensions.height > 120) {

                input.style.width = (signature_dimensions.width * 0.2895) + 'px';
                input.style.height = (signature_dimensions.height * 0.4056481986) + 'px';
                const img = document.createElement('img');
                img.src = 'data:image/png;base64,' + signature_img;
                img.style.width = '100%';
                img.style.height = '100%';
                img.draggable = false;
                input.appendChild(img);

            } else if (signature_dimensions.height > 160) {

                input.style.width = (signature_dimensions.width * 0.2924) + 'px';
                input.style.height = (signature_dimensions.height * 0.4056481986) + 'px';
                const img = document.createElement('img');
                img.src = 'data:image/png;base64,' + signature_img;
                img.draggable = false;
                img.style.width = '100%';
                img.style.height = '100%';
                input.appendChild(img);
            }
            input.id = 'SIGNATURE' + "_" + selectedRole;
            input.setAttribute('role', 'SIGNATURE' + "_" + selectedRole);


            content.appendChild(input);
        }
        else if (type === 'ESEAL') {
            const input = document.createElement('div');
            input.style.border = "1px solid #44aad1";
            input.style.textAlign = 'center';
            //input.style.padding = '30%';

            input.style.width = (eseal_dimensions.width * 0.363097) + 'px';
            input.style.height = (eseal_dimensions.height * 0.341452) + 'px';
            const img = document.createElement('img');
            img.src = 'data:image/png;base64,' + eseal_img;
            img.draggable = false;
            img.style.width = '100%';
            img.style.height = '100%';
            input.appendChild(img);

            input.id = 'ESEAL' + "_" + selectedRole;
            input.setAttribute('role', 'ESEAL' + "_" + selectedRole);

            content.appendChild(input);
        }
        else if (type === 'QRCODE') {
            const input = document.createElement('div');
            //input.style.border = "1px solid #44aad1";
            input.style.textAlign = 'center';
            //input.style.padding = '30%';
            console.log(qrcode_dimensions.width);
            console.log(qrcode_dimensions.height);
            input.style.width = (qrcode_dimensions.width * 0.0601336711) + 'px';
            input.style.height = (qrcode_dimensions.width * 0.0601336711) + 'px';

            const img = document.createElement('img');
            img.src = qrcodeimgdataval;
            img.style.width = '100%';
            img.style.height = '100%';
            img.draggable = false;
            input.appendChild(img);


            input.id = 'QRCODE' + "_" + selectedRole;
            input.setAttribute('role', 'QRCODE' + "_" + selectedRole);

            content.appendChild(input);
        }
        else if (type === "INITIAL") {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'image-container';
            imageContainer.style.minWidth = "30px";
            imageContainer.style.minHeight = "30px";

            if (rotationData === 270 || rotationData === 90) {
                imageContainer.style.width = (canvasWidth * 0.08907) + 'px';
                imageContainer.style.height = (canvasWidth * 0.08245) + 'px';

            } else {
                imageContainer.style.width = (canvasWidth * 0.08245) + 'px';
                imageContainer.style.height = (canvasWidth * 0.08907) + 'px';


            }
            imageContainer.setAttribute('role', 'INITIAL' + "_" + selectedRole);

            const uploadedImage = document.createElement('img');
            uploadedImage.className = 'uploaded-image';
            uploadedImage.setAttribute('alt', 'initial');
            uploadedImage.id = group;
            if (initialImg.startsWith("data:image")) {
                uploadedImage.src = initialImg;
            } else {
                uploadedImage.src = 'data:image/png;base64,' + initialImg;
            }


            uploadedImage.draggable = false;
            uploadedImage.style.width = '100%';
            uploadedImage.style.height = '100%';
            imageContainer.appendChild(uploadedImage);

            content.appendChild(imageContainer);
        }
    }
    else {
        if (type === 'SIGNATURE') {
            const input = document.createElement('div');
            input.style.border = "1px solid #44aad1";
            input.style.textAlign = 'center';
            input.classList.add(`${selectedRole}_signature-container`);
            input.style.overflow = 'none';
            var fontSize = 0;

            if (signature_dimensions_others.height <= 120) {
                input.style.width = (signature_dimensions_others.width * 0.2702426536) + 'px';
                input.style.height = (signature_dimensions_others.height * 0.3756481986) + 'px';
            } else if (signature_dimensions_others.height < 160 && signature_dimensions_others.height > 120) {
                input.style.width = (signature_dimensions_others.width * 0.2895) + 'px';
                input.style.height = (signature_dimensions_others.height * 0.4056481986) + 'px';
            } else if (signature_dimensions_others.height > 160) {
                input.style.width = (signature_dimensions_others.width * 0.2895) + 'px';
                input.style.height = (signature_dimensions_others.height * 0.4056481986) + 'px';
            }
            fontSize = (canvasWidth * 0.0575) / 4.5;
            input.textContent = 'SIGNATURE' + "_" + selectedRole;
            input.style.backgroundColor = "#d8d7d78a";
            input.style.color = "#44aad1";
            input.style.fontSize = `${fontSize}px`;
            input.id = 'SIGNATURE' + "_" + selectedRole;
            input.setAttribute('role', 'SIGNATURE' + "_" + selectedRole);
            input.style.overflow = 'hidden';


            content.appendChild(input);
        }
        else if (type === 'ESEAL') {
            const input = document.createElement('div');
            input.style.border = "1px solid #44aad1";
            input.style.textAlign = 'center';
            //input.style.padding = '30%';
            var fontSize = 0;
            input.style.width = (eseal_dimensions_others.width * 0.363097) + 'px';
            input.style.height = (eseal_dimensions_others.height * 0.341452) + 'px';
            fontSize = (canvasWidth * 0.08245) / 7.5;
            input.textContent = "ESEAL";

            //input.style.width = (canvasWidth * 0.15) + 'px';
            //input.style.height = (canvasWidth * 0.15) + 'px';
            input.textContent = 'ESEAL' + "_" + selectedRole;
            input.style.backgroundColor = "#d8d7d78a";
            input.style.color = "#44aad1";
            input.style.overflow = 'hidden';

            input.style.fontSize = `${fontSize}px`;
            input.id = 'ESEAL' + "_" + selectedRole;
            input.setAttribute('role', 'ESEAL' + "_" + selectedRole);


            content.appendChild(input);
        }
        else if (type === 'QRCODE') {
            const input = document.createElement('div');
            //input.style.border = "1px solid #44aad1";
            input.style.textAlign = 'center';
            //input.style.padding = '30%';


            input.style.width = (qrcode_dimensions.width * 0.0601336711) + 'px';
            input.style.height = (qrcode_dimensions.width * 0.0601336711) + 'px';


            const img = document.createElement('img');
            img.src = qrcodeimgdataval;
            img.style.width = '100%';
            img.style.height = '100%';
            img.draggable = false;
            input.appendChild(img);
            input.id = 'QRCODE' + "_" + selectedRole;
            input.setAttribute('role', 'QRCODE' + "_" + selectedRole);
            //fieldnameslist[requiredreceipient.order] = 'QRCODE' + "_" + selectedRole;


            content.appendChild(input);
        }

        else if (type === "INITIAL") {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'image-container';
            imageContainer.style.minWidth = "30px";
            imageContainer.style.minHeight = "30px";
            var fontSize = 0;
            if (rotationData === 270 || rotationData === 90) {
                imageContainer.style.width = (canvasWidth * 0.08907) + 'px';
                imageContainer.style.height = (canvasWidth * 0.08245) + 'px';


            } else {
                imageContainer.style.width = (canvasWidth * 0.08245) + 'px';
                imageContainer.style.height = (canvasWidth * 0.08907) + 'px';

            }
            fontSize = (canvasWidth * 0.08907) / 7.5;
            imageContainer.setAttribute('role', 'INITIAL' + "_" + selectedRole);

            const spanEle = document.createElement("span");
            spanEle.textContent = `INITIAL_${selectedRole}`;
            spanEle.id = group;
            spanEle.style.color = '#4A90E2';
            spanEle.style.backgroundColor = '#e5e5e5';
            spanEle.style.fontSize = '13px';
            spanEle.style.overflow = 'hidden';
            spanEle.style.width = '100%';
            spanEle.style.height = '100%';



            imageContainer.appendChild(spanEle);


            spanEle.style.display = 'block';
            content.style.border = '2px solid #4A90E2';


            content.appendChild(imageContainer);
        }
    }

    element.appendChild(content);

    addEditIcon(content, type);

    if (type !== 'websave' && type !== 'webfill' && type !== 'QRCODE') {
        content.setAttribute('tabindex', '0');
        addResizeHandles(content, element, type);

        content.addEventListener("click", () => {
            content.focus();
        });

        content.addEventListener("touchstart", () => {
            showHandles();

            const editIcon = content.querySelector('.edit-icon');
            if (editIcon) {
                editIcon.style.opacity = '1';
            }
        });

        content.addEventListener("focus", showHandles);
        content.addEventListener("blur", hideHandles);

        function showHandles() {
            const handles = content.querySelectorAll('.resize-handle');
            handles.forEach(handle => handle.style.display = 'block');
            content.style.border = '2px solid #4A90E2';
        }

        function hideHandles() {
            const handles = content.querySelectorAll('.resize-handle');
            handles.forEach(handle => handle.style.display = 'none');
            content.style.border = 'none';

            // Optionally hide edit icon again here
            const editIcon = content.querySelector('.edit-icon');
            if (editIcon) {
                editIcon.style.opacity = '0';
            }
        }
    }


    element.style.position = 'absolute';
    element.style.pointerEvents = 'auto';
    element.style.zIndex = '1000';



    makeDraggable(element);

    return element;
}


async function Processrecipients(recipients) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: ProcessRecipientsUrl,
            contentType: "application/json",
            data: JSON.stringify(recipients),
            beforeSend: function () {
                document.getElementById("navigationNetworkOverlay").style.display = "flex";

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





async function handle_delegation_orgid_suid(delegation_req_data) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "GET",
            url: GetDelegationbyorgidsuidUrl,
            data: {
                organizationId: delegation_req_data.id,
                suid: delegation_req_data.suid
            },
            beforeSend: function () {
                //$('#overlay').show();
                document.getElementById("navigationNetworkOverlay").style.display = "flex";
            },
            complete: function () {
                //$('#overlay').hide();

                document.getElementById("navigationNetworkOverlay").style.display = "none";
            },
            success: function (response) {
                // Handle the success response from the server
                if (response.success == true) {
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

                    if (response.result.length > 0) {
                        let text = "";
                        swal_list.forEach(function (value) {
                            text += value + "\n";
                        });

                        console.log(swal_list);

                        swal({
                            title: "",
                            text: delegation_req_data.email + " " + "currently having an active delegation." + "\n" + "Delegatee :" + " " + swal_list,
                            type: "info",
                        }, function (isConfirm) {
                            // You can add additional actions here if needed
                        });

                        var response_data_obj = {
                            swallist: swal_list,
                            listdata: list_data,
                            delegateeid: response.result[0].delegationId,
                        }

                        resolve(response_data_obj);
                    } else {
                        var response_data_obj = {
                            swallist: "",
                            listdata: [],
                            delegateeid: '',
                        }
                        resolve(response_data_obj);
                    }
                } else {
                    swal({
                        title: "Error",
                        text: response.message || "Unknown error occurred",
                        type: "error",
                    }, function (isConfirm) {
                        if (isConfirm) {
                            window.location.href = IndexDocuments;
                        }
                    });
                    resolve(false);
                }
                console.log(response);
            },
            error: function (error) {
                resolve(false);
                ajaxErrorHandler(error);

            }
        });
    });
}

window.handleOrganizationSelection = async function (event, id) {
    console.log(userDataResponses);
    let tempid = document.getElementById('templateSelect').value;
    if (tempid !== "1") {
        if (event.target.value.trim() === "" && event.target.selectedIndex !== 0) {
            toastr.error(`Only standard Template will be available for self`);
            event.target.selectedIndex = 0;
            return false;
        }
    }
    var initialCheckbox = document.getElementById('RecpientList_' + id + '__Initial');
    initialCheckbox.disabled = false;
    var usersuid_id = userDataResponses[id].suid;
    var useremail_email = userDataResponses[id].rowEmail;
    var idval = id;
    var orguid_val = event.target.value;
    var selectedobj = organizationobjlist.find(item => item.orderid == idval);
    var selectedOrgObject = selectedobj.originalList.find(function (org) {
        return org.orgUid.trim() === orguid_val.trim();
    });
    if (orguid_val.trim() == "" || orguid_val == null) {
        // initialCheckbox.disabled = true;
        initialCheckbox.checked = false;
    };
    if (userDataResponses[id].alternateSignatoriesList && userDataResponses[id].alternateSignatoriesList.length > 0) {
        var responseflag = false;
        var responsemessage = '';
        for (var j = 0; j < userDataResponses[id].alternateSignatoriesList.length; j++) {
            if (!selectedOrgObject.employee_list.includes(userDataResponses[id].alternateSignatoriesList[j].email)) {
                responseflag = true;
                var emaildata_val = userDataResponses[id].alternateSignatoriesList[j].email;
                responsemessage = `${emaildata_val} does not belongs to the selected organization`;
                break;
            };
        };
        if (responseflag) {
            toastr.error(`${responsemessage}`);
            return false;
        };
    };
    var selectedlist = [];
    selectedlist.push(selectedOrgObject);
    var updateorganization_obj = organizationobjlist.find(item => item.orderid == idval);
    updateorganization_obj.selectedorgList = selectedlist;

    var allSignaturesRequired = $("#AllSignatoriesRequired").prop("checked");
    if (allSignaturesRequired) {
        $('#signatureMandatory').prop('checked', true).prop('disabled', true);
    }

    if (allSignaturesRequired) {
        var objval = {
            orderid: idval,
            signatureMandatory: true,
            allowComments: false,
            allowanyonesign: false,
        };
    } else {
        var objval = {
            orderid: idval,
            signatureMandatory: false,
            allowComments: false,
            allowanyonesign: false,
        };
    }
    // Create or update the object for modal settings
    // Update or add the object in modalobjlist
    var existingIndex = modalobjlist.findIndex(item => item.orderid === idval);
    if (existingIndex !== -1) {
        modalobjlist[existingIndex] = objval;
    } else {
        modalobjlist.push(objval);
    }

    var orgobjval = {
        orderid: idval,
        selectedorg: selectedOrgObject,
    }
    var existingIndexorg = modalobjSelectedorglist.findIndex(item => item.orderid === idval);
    if (existingIndexorg !== -1) {
        modalobjSelectedorglist[existingIndexorg] = orgobjval;
    } else {
        modalobjSelectedorglist.push(orgobjval);
    }

    if (Array.isArray(window.recipients) && window.recipients[idval]) {
        window.recipients[idval].orgUid = selectedOrgObject ? selectedOrgObject.orgUid : '';
        window.recipients[idval].orgName = selectedOrgObject ? selectedOrgObject.orgName : '';
    }

    var delegation_req_data = {
        id: orguid_val,
        suid: usersuid_id,
        email: useremail_email,
    }
    console.log(delegation_req_data);
    var delegation_response = await handle_delegation_orgid_suid(delegation_req_data);
    console.log(delegation_response);
    if (delegation_response != undefined) {
        alternateSignatoriesList[id] = delegation_response.listdata;
        if (delegation_response.listdata.length > 0) {
            userDataResponses[id].hasDelegation = true;
            userDataResponses[id].alternateSignatoriesList = delegation_response.listdata;
            userDataResponses[id].delegationId = delegation_response.delegateeid;
        } else {
            userDataResponses[id].hasDelegation = false;
            userDataResponses[id].delegationId = '';
        }

    }
    persistOrganizationDropdownState(id);
    syncRecipientAlternateEmails(id);
    continueFlag = false;
}

window.esealUserCheckBox = function (id) {
    var checkbox = document.getElementById('RecpientList_' + id + '__Eseal');
    var selectedorderobj = organizationobjlist.find(item => item.orderid == id);

    if (Array.isArray(window.recipients) && window.recipients[id]) {
        window.recipients[id].esealRequired = checkbox.checked;
    }

    var alternateSignatoriesListById = [];
    var alternateSignatoriesEsealList = [];

    alternateSignatoriesListById.push(alternateSignatoriesList[id]);
    const selectedAlternateSignatories = alternateSignatoriesListById[0];

    const esealListt = selectedorderobj?.selectedorgList?.[0]?.eseal_employee_list;
    if (esealListt !== undefined) {
        alternateSignatoriesEsealList.push(esealListt);
    }


    const missingEmails = selectedAlternateSignatories
        ?.filter(item => !alternateSignatoriesEsealList?.[0]?.includes(item.email))
        .map(item => item.email) || [];


    if (selectedorderobj?.selectedorgList?.length == 1) {
        var eseal_organizations = [];
        var noneseal_organizations = [];
        for (var j = 0; j < selectedorderobj.orgList.length; j++) {
            if (selectedorderobj.orgList[j].has_eseal_permission === true) {
                eseal_organizations.push(selectedorderobj.orgList[j]);
            } else {
                noneseal_organizations.push(selectedorderobj.orgList[j]);
            }
        };

        var $organizationDropdown = $('#organizationDropdown_' + id);
        if (checkbox.checked === true) {
            if (selectedorderobj.selectedorgList[0].has_eseal_permission === false) {
                if (selectedorderobj.selectedorgList[0].orgUid.trim() == "" && selectedorderobj.selectedorgList[0].orgName == "Self") {

                    // showCustomAlert(`Sorry you don't have eseal permission for self account`);
                    toastr.error(`Sorry you don't have eseal permission for self account`);
                    checkbox.checked = false;
                    return false;
                } else {

                    // showCustomAlert(`Selected signatory does not have e-seal permission`);
                    toastr.error(`Selected signatory does not have e-seal permission`);
                    checkbox.checked = false;
                    return false;
                }
            }
            else {
                if (missingEmails.length > 0) {
                    const missingEmailsString = missingEmails.join(', ');
                    toastr.error(`Selected alternative signatory does not have e-seal permission: ${missingEmailsString}`);

                    checkbox.checked = false;
                    return false;
                }
            }

            // Iterate through each item in the list
            noneseal_organizations.forEach(function (item) {
                // Find and remove the option containing the current item
                $organizationDropdown.find('option').filter(function () {
                    return $(this).text() === item.orgName;
                }).remove();
            });
        } else {
            // Iterate through each item in the list
            noneseal_organizations.forEach(function (item) {
                // Append a new option element with the current item text
                $organizationDropdown.append($('<option>', {
                    value: item.orgUid,
                    text: item.orgName
                }));
            });
        }
    } else {
        if (checkbox.checked === true) {
            var eseal_organizations = [];
            for (var j = 0; j < selectedorderobj?.orgList?.length; j++) {
                if (selectedorderobj.orgList[j].has_eseal_permission === true) {
                    eseal_organizations.push(selectedorderobj.orgList[j]);
                }
            };

            var $organizationDropdown = $('#organizationDropdown_' + id);
            $organizationDropdown.empty();
            $organizationDropdown.append($('<option>', {
                value: '',
                text: 'Choose Account'
            }));
            if (eseal_organizations.length === 0) {
                toastr.error(`Please Enter Valid E-Mail address to select Eseal`);
                checkbox.checked = false;
                return false;
            }
            for (var i = 0; i < eseal_organizations?.length; i++) {
                $organizationDropdown.append($('<option>', {
                    value: eseal_organizations[i].orgUid,
                    text: eseal_organizations[i].orgName
                }));
            }
        } else {
            var $organizationDropdown = $('#organizationDropdown_' + id);
            $organizationDropdown.empty();
            $organizationDropdown.append($('<option>', {
                value: '',
                text: 'Choose Account'
            }));
            for (var i = 0; i < selectedorderobj?.orgList?.length; i++) {
                $organizationDropdown.append($('<option>', {
                    value: selectedorderobj.orgList[i].orgUid,
                    text: selectedorderobj.orgList[i].orgName
                }));
            }
        }
    }
}

window.initialCheckBox = function (id) {

    var selectedorderobj = organizationobjlist.find(item => item.orderid == id);
    var checkbox = document.getElementById('RecpientList_' + id + '__Initial');

    if (Array.isArray(window.recipients) && window.recipients[id]) {
        window.recipients[id].initialsRequired = checkbox.checked;
    }

    var isInitialRequired = $('#RecpientList_' + id + '__Initial').prop("checked");
    var emailValue = $('#RecpientList_' + id + '__Email').val();

    if (emailValue == "" || emailValue == null || emailValue == undefined) {
        swal({
            type: 'info',
            title: 'Message',
            text: "Please enter any email"
        });
        checkbox.checked = false;
        return;
    }

    if (isInitialRequired) {
        //  if(selectedorderobj != undefined){
        if (selectedorderobj.selectedorgList.length == 0) {
            swal({
                type: 'info',
                title: 'Info',
                text: "Please select organization"
            });
            checkbox.checked = false;
            return;
        }
        // }
    }



    if (selectedorderobj.selectedorgList.length != 0) {
        if (selectedorderobj.selectedorgList == undefined) {
            checkbox.checked = false;
            checkbox.disabled = true;
        }

    }

    if (isInitialRequired) {

        if (selectedorderobj.selectedorgList[0].initial != undefined || selectedorderobj.selectedorgList[0].initial == null) {
            // if (selectedorderobj.selectedorgList == undefined) {

            if (selectedorderobj.selectedorgList[0].initial == null || selectedorderobj.selectedorgList[0].initial == '') {
                swal({
                    type: 'info',
                    title: 'Info',
                    text: "Selected signatory does not have initial image"
                });
                checkbox.checked = false;
                console.log("No initials");
                return;
            }
        }




        var required_objdata = modalobjlist.filter(item => item.orderid == selectedorderobj.orderid);
        if (required_objdata.length > 0) {
            $('#signatureMandatory').prop('checked', required_objdata[0].signatureMandatory);
            $('#allowComments').prop('checked', required_objdata[0].allowComments);
            $('#anyoneSign').prop('checked', required_objdata[0].allowanyonesign);

            if (isInitialRequired && required_objdata[0].allowanyonesign == true) {
                $('#anyoneSignDiv_0').css('display', 'none');
                $('#anyoneSign').prop('checked', false);
                $('#anyoneSign').prop('disabled', true);
            }

        }



        // clear the data of allow anyone can sign and hide that div
        var requireddata = modalobjlist.filter(item => item.orderid == selectedorderobj.orderid);
        if (requireddata.length < 0) {
            requireddata[0].allowComments = false;
            var allSignaturesRequired = $("#AllSignatoriesRequired").prop("checked");
            // Clear any previously entered data in the modal
            if (allSignaturesRequired) {
                $('#signatureMandatory').prop('checked', true);
                $('#signatureMandatory').prop('disabled', true);
            } else {
                requireddata[0].signatureMandatory = false;
            }

        } else {
            var objval = {
                orderid: 0,
                signatureMandatory: false,
                allowComments: false,
                allowanyonesign: false,
            };
            var allSignaturesRequired = $("#AllSignatoriesRequired").prop("checked");

            if (allSignaturesRequired) {
                objval.signatureMandatory = true;
                objval.allowComments = false;
                objval.allowanyonesign = false;
                objval.orderid = selectedorderobj.orderid;
                modalobjlist[selectedorderobj.orderid] = objval;

            } else {
                objval.signatureMandatory = false;
                objval.allowComments = false;
                objval.allowanyonesign = false;
                objval.orderid = selectedorderobj.orderid;
                modalobjlist[selectedorderobj.orderid] = objval;
            }
        }
        console.log(alternateSignatoriesList);
        var allowanyonesign = $("#anyoneSign").prop("checked");
        if (allowanyonesign) {
            alternateSignatoriesList[id] = [];
            if (userDataResponses[id]) {
                userDataResponses[id].alternateSignatoriesList = [];
            }
            syncRecipientAlternateEmails(id);
        }


    } else {

        $('#anyoneSignDiv_0').css('display', 'flex');
        $('#anyoneSign').prop('disabled', false);
        $('#anyoneSign').prop('checked', false);
    }

}
window.deleteRecipient = function (trigger) {
    const esealcheckbox = $(".esealCheckBox").prop("checked");
    if (esealcheckbox) {
        $(".esealcheck").show();
    } else {
        $(".esealcheck").hide();
    }

    const initialcheckbox = $(".initialCheckBox").prop("checked");
    if (initialcheckbox) {
        $(".initialcheck").show();
    } else {
        $(".initialcheck").hide();
    }

    PerpareDocumentContext.receipientEmails = [];
    PerpareDocumentContext.receipientEmailsList = [];

    if (typeof resolveCardIndexFromElement === 'function' && typeof removeRecipientAtIndex === 'function') {
        const index = resolveCardIndexFromElement(trigger);
        if (index !== null && index !== undefined) {
            removeRecipientAtIndex(index);
        }
    }
};

function showDelegateeInfo(email) {
    // Implement the logic to show delegatee info here

    console.log(`Showing delegatee info for email: ${email}`);
    var getdelegationdata = PerpareDocumentContext.receipientEmailsList.find(item => item.email == email);
    console.log(getdelegationdata.alternateSignatoriesList);
    var swal_list = [];
    if (getdelegationdata.hasDelegation) {
        for (var i = 0; i < getdelegationdata.alternateSignatoriesList.length; i++) {
            swal_list.push(getdelegationdata.alternateSignatoriesList[i].email);
        }
        let text = "";
        swal_list.forEach(function (value) {
            text += value + "\n";
        });
        console.log(swal_list);
        swal({
            title: "",
            text: email + " " + "currently having an active delegation." + "\n" + "Delegatee :" + " " + swal_list,
            type: "info",
        }, function (isConfirm) {
            // You can add additional actions here if needed
        });
    }

    // Example: display a modal, alert, or other UI components
}

function PrepareDocument() {
    // Ensure PDF container exists before proceeding
    const container = (typeof window !== 'undefined' && window.pdfContainer) ||
        document.getElementById('pdf-container') ||
        document.querySelector('#pdf-container');

    if (!container) {
        console.error('[PrepareDocument] PDF container #pdf-container not found in DOM');
        safeToastrError('Viewer container not found. Please refresh the page.');
        document.getElementById("navigationNetworkOverlay").style.display = "none";
        return;
    }

    console.log('[PrepareDocument] Starting document preparation...');
    console.log('[PrepareDocument] PDF container found:', container.id);

    var imgdata = '';
    var imgdata1 = '';
    var imgdata2 = '';
    var imgdata_others = '';
    var imgdata1_others = '';



    var sigimgdataval_others = 'data:image/png;base64,' + signature_img_others;
    imgdata = sigimgdataval_others;
    var img_others = new Image();
    img_others.src = imgdata;
    img_others.onload = function () {
        const width = img_others.width;
        const height = img_others.height;
        signature_dimensions_others = {
            width: width,
            height: height,
        }

    };

    var sigimgdataval = 'data:image/png;base64,' + signature_img;
    imgdata = sigimgdataval;
    const img = new Image();
    img.src = imgdata;
    img.onload = function () {
        const width = img.width;
        const height = img.height;
        signature_dimensions = {
            width: width,
            height: height,
        }

    };

    var esealimgdataval_others = 'data:image/png;base64,' + eseal_img_others;
    imgdata1_others = esealimgdataval_others;
    var img1_others = new Image();
    img1_others.src = imgdata1_others;
    img1_others.onload = function () {
        const width = img1_others.width;
        const height = img1_others.height;
        eseal_dimensions_others = {
            width: width,
            height: height,
        }

    };
    var esealimgdataval = 'data:image/png;base64,' + eseal_img;
    imgdata1 = esealimgdataval;
    const img1 = new Image();
    img1.src = imgdata1;
    img1.onload = function () {
        const width = img1.width;
        const height = img1.height;
        eseal_dimensions = {
            width: width,
            height: height,
        }

    };
    var imgdata3 = '';
    if (initialImg.startsWith("data:image")) {
        var initialimgdataval = initialImg;
    } else {
        var initialimgdataval = 'data:image/png;base64,' + initialImg;
    }
    imgdata3 = initialimgdataval;
    const img3 = new Image();
    img3.src = imgdata3;
    img3.onload = function () {
        const width = img3.width;
        const height = img3.height;
        initial_dimensions = {
            width: width,
            height: height,
        }

    };

    var imgdata4 = '';
    var initialimgdataval_others = 'data:image/png;base64,' + initialImg_others;
    imgdata4 = initialimgdataval_others;
    const img4 = new Image();
    img4.src = imgdata4;
    img4.onload = function () {
        const width = img4.width;
        const height = img4.height;
        initial_dimensions_others = {
            width: width,
            height: height,
        }

    };
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
    let docusers = PerpareDocumentContext.receipientEmails;
    PerpareDocumentContext.receipientEmailsList = [];

    let recpfieldcount = Object.values(docusers).map((user) => {
        return {
            email: user.email,
            thumbnailImage: user.thumbnailImage,
            initialImage: user.initialImage,
            hasDelegation: user.hasDelegation,
            alternateSignatoriesList: user.alternateSignatoriesList,
            count: 0
        };
    });

    if (recpfieldcount.length > 0) {
        PerpareDocumentContext.receipientEmailsList = recpfieldcount;
    }

    $('#emailList').empty();

    PerpareDocumentContext.receipientEmailsList.map((item, index) => {
        console.log(item);
        var selected = (index == 0) ? "selected" : "";
        let thumbnailSrc = `data:image/jpeg;base64,${item.thumbnailImage}`; // Assuming thumbnailImage is already base64 encoded
        //$("#emailList").append(`<li class="list ${selected}" onclick="toggleRecepientSelection('${item.email}')"><span><img src="${thumbnailSrc}"  class="initial" alt="Thumbnail" /></span>${item.email}</li>`);
        // Assuming item has a hasDelegation property
        $("#emailList").append(`
                                                                                                                                                                                                                                                                                                                                                                                                                    <li class="list ${selected}"
                                                                                                                                                                                                                                                                                                                                                                                                                        data-initial-image="${item.initialImage}"
                                                                                                                                                                                                                                                                                                                                                                                                                        data-email-initial="${item.email}"
                                                                                                                                                                                                                                                                                                                                                                                                                        onclick="toggleRecepientSelection('${item.email}', '${item.initialImage}')"
                                                                                                                                                                                                                                                                                                                                                                                                                                style="cursor: pointer; ">
                                                                                                                                                                                                                                                                                                                                                                                                                        <span>
                                                                                                                                                                                                                                                                                                                                                                                                                            <img src="${thumbnailSrc}" class="initial ${selected ? 'selected1' : ''}" alt="Thumbnail" style="margin-left:10px;" />
                                                                                                                                                                                                                                                                                                                                                                                                                        </span>
                                                                                                                                                                                                                                                                                                                                                                                                                         <div>
                                                                                                                                                                                                                                                                                                                                                                                                                            <span style="margin-top: 2%;font-size:0.9rem;text-overflow: ellipsis;overflow: hidden;max-width: 170px; display: inline-block; ${item.hasDelegation ? 'text-decoration-line: line-through; -webkit-text-decoration-line: line-through; text-decoration-color: rgba(0, 0, 0, 0.2);' : ''}">
                                                                                                                                                                                                                                                                                                                                                                                                                            ${item.email}
                                                                                                                                                                                                                                                                                                                                                                                                                        </span>
                                                                                                                                                                                                                                                                                                                                                                                                                            ${item.hasDelegation ? `<a href="#" onclick="showDelegateeInfo('${item.email}'); return false;" style="font-size: 11px; color: #059669 !important; display: flex; margin-top: -5px;">Click here for delegatee info</a>` : ''}
                                                                                                                                                                                                                                                                                                                                                                                                                        </div>

                                                                                                                                                                                                                                                                                                                                                                                                                    </li>
                                                                                                                                                                                                                                                                                                                                                                                                                `);




    });

    var selectedUserEmail = PerpareDocumentContext.selectuser;


    if (PerpareDocumentContext.MultiSign == true) {
        var userObj = PerpareDocumentContext.receipientEmails.find(x => x.email == selectedUserEmail)
        if (userObj.initial) {
            $("#Initial").removeClass("classshide");
        } else {
            $("#Initial").addClass("classshide");
        }
        // Ensure signatories panel is visible for multi-sign
        $("#signatoriesfieldbox").show();
    } else {
        // Hide signatories panel for self-sign
        $("#signatoriesfieldbox").hide();
    }




    var addSignatoriesCheckbox = $('#addSignatoriesCheckbox');
    var isChecked = addSignatoriesCheckbox.prop('checked');
    if (isChecked) {
        $('#Send').removeClass("classshide");
    } else {
        $('#Save').removeClass("classshide");
    }
    document.getElementById("navigationNetworkOverlay").style.display = "none";
    $('#createDoc').addClass("classshide");
    $('#viwer').removeClass("classshide");

    // Validate filebase64 exists and is not empty
    var filebase64Input = document.getElementById('filebase64');
    if (!filebase64Input) {
        console.error('[PrepareDocument] filebase64 input element not found');
        safeToastrError('File upload error. Please refresh and try again.');
        $('#createDoc').removeClass("classshide");
        $('#viwer').addClass("classshide");
        return;
    }

    var filebase64 = filebase64Input.value;
    if (!filebase64 || filebase64.trim() === '') {
        console.error('[PrepareDocument] filebase64 is empty or undefined');
        console.log('[PrepareDocument] filebase64 value:', filebase64);
        safeToastrError('No file data found. Please upload a file first.');
        $('#createDoc').removeClass("classshide");
        $('#viwer').addClass("classshide");
        return;
    }

    console.log('[PrepareDocument] Base64 data length:', filebase64.length);
    processfile(filebase64);
}
// Custom Alert
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


// DRIVE INTEGRATIONS


$("#oneDrive").on("click", function (e) {
    var storageName = "ONE_DRIVE";
    var url = GetStoratgeConfiguration;
    url = url + "?storageName=" + storageName;

    $('#overlay').show();
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.result.hasOwnProperty("url")) {
                    window.location.href = data.result.url;

                } else {
                    //

                    oneDrivepicker(data.result.accessToken, data.result.clientId)
                        .then(async (res) => {
                            console.log(res);

                            console.log(res.data);
                            let blob = res.data; // Assuming res.data is a Blob

                            if (blob != null) {
                                let fakeEvent = { target: { files: [new File([blob], res.documentName + '.' + res.extension[1], { type: res.data.type })] } };
                                fileSelect(fakeEvent);
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                            if (error.type == "show") {
                                toastr.error(error.message);
                            }
                        });

                }
            } else {
                console.error('Error:', data.message);
                toastr.error('Error:', data.message);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            toastr.error('Error:', error);
        })
        .finally(() => {
            $('#overlay').hide(); // Hide overlay after fetch call
        });
});

function oneDrivepicker(accessToken, clientId) {
    return new Promise((resolve, reject) => {
        const pickerOptions = {
            clientId: clientId,
            action: "download", // Change action to "open" if you want to open files for selection
            multiSelect: false,
            accessToken: accessToken,
            success: async function (result) {
                console.log(JSON.stringify(result));

                if (result && result.value && result.value.length > 0) {
                    const downloadUrl = result.value[0]["@microsoft.graph.downloadUrl"];
                    $('#overlay').show();
                    await download(downloadUrl, accessToken)
                        .then((data) => {

                            const extension = result.value[0]["name"].split('.');
                            const docname = result.value[0]["name"].split('.');
                            resolve({
                                fileSet: true,
                                isActive: false,
                                data: data,
                                documentName: docname[0],
                                extension: extension,
                                resultvalue: result
                            });
                        })
                        .catch((e) => {
                            console.error("Download error:", e.message);
                            reject(e);
                        })
                        .finally(() => {
                            $('#overlay').hide(); // Hide overlay after fetch call
                        });
                } else {
                    reject({ type: "show", message: "No file selected" });
                }
            },
            cancel: function () {
                reject({ type: "hide", message: "User canceled file selection" });
            },
            error: function (error) {
                console.log(error);
                reject({ type: "show", message: error });
            }
        };

        window.OneDrive.open(pickerOptions);
    });
}

// without authorization download url api call
async function download(fileUrl, token) {
    return new Promise((resolve, reject) => {
        if (fileUrl) {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", fileUrl);
            xhr.responseType = "blob"; // Only if you expect file data like PDFs or images

            xhr.onload = function () {
                if (xhr.status === 200) {
                    resolve(xhr.response); // Success: return the Blob response
                } else {
                    reject(new Error(`Failed to download file. Status: ${xhr.status} ${xhr.statusText}`));
                }
            };

            xhr.onerror = function () {
                reject(new Error("Failed to download the file"));
            };

            xhr.send();
        } else {
            reject(new Error("Invalid file URL"));
        }
    });
}







$("#googleDirve").on("click", function (e) {

    var storageName = "GOOGLE_DRIVE";
    var url = GetStoratgeConfiguration;
    url = url + "?storageName=" + storageName;

    $('#overlay').show();
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.result.hasOwnProperty("url")) {
                    window.location.href = data.result.url;
                } else {
                    //$('#overlay').show();

                    googleDrivePicker(data.result.accessToken, data.result.clientId, PerpareDocumentContext.filesizerestrict)
                        .then(async (res) => {
                            console.log(res);

                            console.log(res.data);
                            let blob = res.data; // Assuming res.data is a Blob

                            if (blob != null) {
                                let fakeEvent = { target: { files: [new File([blob], res.documentName + '.' + res.extension[1], { type: res.data.type })] } };
                                fileSelect(fakeEvent);
                            }
                        });
                    //$('#overlay').hide();
                }
            } else {
                console.error('Error:', data.message);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        })
        .finally(() => {
            $('#overlay').hide(); // Hide overlay after fetch call
        });
});

function googleDrivePicker(oauthToken, clientID, filesizerestrict) {

    var google = window.google;
    return new Promise(function (myResolve, myReject) {
        if (oauthToken === "noToken" || clientID === "noClientId") {
            toastr.error("Please Link Google Drive.");
            //  picker.build().setVisible(false);
        } else {
            const googleViewId = google.picker.ViewId.DOCS;
            const docsView = new google.picker.DocsView(googleViewId)
                .setIncludeFolders(true)
                .setMimeTypes(
                    "application/vnd.google-apps.folder,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
                .setSelectFolderEnabled(true);

            try {
                const picker = new window.google.picker.PickerBuilder()
                    .addView(docsView)
                    .setOAuthToken(oauthToken)
                    .setAppId(clientID)
                    // .setDeveloperKey(`${process.env.REACT_APP_GOOGLEDEVELOPER_KEY}`)
                    .setCallback((files) => {

                        // console.log(files.docs);
                        // console.log("Custom picker is ready!");
                        var myHeaders = new Headers();
                        myHeaders.append("Authorization", `Bearer ${oauthToken}`);

                        var requestOptions = {
                            headers: myHeaders,
                        };

                        if (files.action === "picked") {

                            if (files.docs[0].sizeBytes > filesizerestrict * 1024 * 1024) {
                                toastr.error("Please upload the file size less than " + filesizerestrict + " MB");
                                picker.build().setVisible(true);
                            } else {
                                if ((files.docs[0].mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                                    files.docs[0].mimeType === "application/pdf" ||
                                    files.docs[0].mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
                                    // this.setState({ isActive: true });
                                    fetch(
                                        `https://www.googleapis.com/drive/v2/files/${files.docs[0].id}`, //?key=${process.env.REACT_APP_GOOGLEDEVELOPER_KEY}`,
                                        requestOptions
                                    )
                                        .then((response) => response.json())
                                        .then(async (result) => {

                                            var regEx = /^[0-9a-zA-Z]{0,40}$/;
                                            let documentName = result.originalFilename.split(".").slice(0, -1).join(".")

                                            $('#overlay').show();
                                            await download(result.downloadUrl, oauthToken)
                                                .then(async (data) => {

                                                    window.constantBlobdata = data;
                                                    var extension = result.originalFilename.split('.');
                                                    myResolve({ fileSet: true, isActive: false, data: data, documentName: documentName, extension: extension, resultvalue: result })
                                                    //validating file uploaded================


                                                })
                                                .catch((e) => {
                                                    console.log("response ===" + e.response);
                                                    console.log("Message ===" + e.message);

                                                    error(e, 1002049).then((value) => {
                                                        if (value == 401) {
                                                            window.history.push("/");
                                                        }
                                                    });
                                                })
                                                .finally(() => {
                                                    $('#overlay').hide(); // Hide overlay after fetch call
                                                });
                                        })
                                        .catch((e) => {
                                            console.log("response ===" + e.response);
                                            console.log("Message ===" + e.message);

                                            error(e, 1002040).then((value) => {
                                                if (value == 401) {
                                                    window.history.push("/");
                                                }
                                            });
                                        });

                                    async function download(fileUrl, token) {
                                        return new Promise(function (myResolve, myReject) {
                                            if (fileUrl) {
                                                var accessToken = token;
                                                var xhr = new XMLHttpRequest();
                                                xhr.open("GET", fileUrl);
                                                xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
                                                xhr.responseType = "blob";

                                                xhr.onload = function () {
                                                    // console.log(xhr.response);
                                                    let xhrResponse = xhr.response;
                                                    myResolve(xhr.response);
                                                };

                                                xhr.onerror = function () {
                                                    // console.log("error");
                                                };
                                                xhr.send();
                                            } else {
                                                // console.log("failed");
                                            }
                                        });
                                    }
                                }
                                else {
                                    toastr.error("Please upload PDF,DOCX,XLSX files");
                                    //return false;
                                    //myResolve({ fileSet: false, isActive: false ,data: null, documentName: null});
                                    picker.build().setVisible(true);
                                }
                            }
                        }
                        else if (files.action === "cancel") {
                            // this.setState({ isActive: false })
                            //document.getElementById("kkkk").style.pointerEvents = "visible";
                            myResolve({ fileSet: false, isActive: false, data: null, documentName: null })
                        }
                    });

                picker.build().setVisible(true);


            }
            catch (e) {
                alert(e);
            }
        }
    })
}


function setWatermark() {
    const annotationLayers = Array.from(document.querySelectorAll('.annotation-layer'));
    const text = document.getElementById('watermark-field').value.trim();

    if (text) {
        iswatermarkpresent = true;
        watermarktext = text;
    } else {
        iswatermarkpresent = false;
        watermarktext = text;
    }

    let index = 0;

    function processNextBatch() {
        const batchSize = 20; // adjust for responsiveness
        const end = Math.min(index + batchSize, annotationLayers.length);

        for (let i = index; i < end; i++) {
            const layer = annotationLayers[i];
            applyWatermark(layer, text);
        }

        index = end;

        if (index < annotationLayers.length) {
            setTimeout(processNextBatch, 10); // yield to the browser
        }
    }

    processNextBatch();
}

function applyWatermark(layer, text) {
    let watermark = layer.querySelector('.watermark');

    if (!watermark) {
        watermark = document.createElement('div');
        watermark.className = 'watermark';
        watermark.style.position = 'absolute';
        watermark.style.textAlign = 'center';
        watermark.style.whiteSpace = 'nowrap';
        watermark.style.transform = 'translate(-50%, -50%) rotate(-50deg)';
        watermark.style.color = 'rgba(102, 100, 100, 0.16)';
        watermark.style.top = '50%';
        watermark.style.left = '50%';
        layer.style.overflow = 'hidden';
        layer.appendChild(watermark);
    }

    watermark.innerText = text;

    const annotationWidth = layer.offsetWidth;
    const measuringSpan = document.createElement('span');
    measuringSpan.style.position = 'absolute';
    measuringSpan.style.visibility = 'hidden';
    measuringSpan.style.whiteSpace = 'nowrap';
    measuringSpan.style.fontFamily = 'inherit';
    measuringSpan.innerText = text;
    document.body.appendChild(measuringSpan);

    let fontSize = annotationWidth / 10;
    fontSize = Math.min(fontSize, 100);
    fontSize = Math.max(fontSize, 16);

    while (fontSize > 1) {
        measuringSpan.style.fontSize = `${fontSize}px`;
        const measuredWidth = measuringSpan.offsetWidth;

        if (measuredWidth <= layer.offsetHeight * 0.9) {
            break;
        }

        fontSize -= 1;
    }
    watermarkfontsize = fontSize;
    document.body.removeChild(measuringSpan);
    watermark.style.fontSize = `${fontSize}px`;
}

async function addWatermark_Initial(account, isinitialpresent, iswaterpresent) {
    try {
        var formData_image_watermark = new FormData();
        if (account == "self") {
            if (isinitialpresent) {
                let iniimage = "";
                if (initialImg.startsWith("data:image")) {
                    iniimage = initialImg;
                } else {
                    iniimage = 'data:image/png;base64,' + initialImg;
                }
                const imageFile = await base64ToFile(iniimage, "Image1.png");
                formData_image_watermark.append("image1", imageFile);
            }
        }
        else {
            for (var i = 0; i < PerpareDocumentContext.receipientEmails.length; i++) {
                if (PerpareDocumentContext.receipientEmails[i].initial) {
                    let iniimage = "";
                    let initialother = PerpareDocumentContext.receipientEmails[i].initialImage;
                    if (initialother.startsWith("data:image")) {
                        iniimage = initialother;
                    } else {
                        iniimage = 'data:image/png;base64,' + initialother;
                    }
                    const imageFile = await base64ToFile(iniimage, `Image${i + 1}.png`);
                    formData_image_watermark.append(`image${i + 1}`, imageFile);
                }
            }
        }




        formData_image_watermark.append("pdf", globalFile);
        if (isinitialpresent) {


            const params = {};

            for (const email in initialsStore) {
                const pages = initialsStore[email];

                for (const pageNum in pages) {
                    const annotations = pages[pageNum];

                    let pageElement = document.querySelector(`[data-page-number="${pageNum}"]`);
                    let canvas, width1, height1, rect;

                    if (pageElement && pageElement.querySelector('canvas')) {
                        canvas = pageElement.querySelector('canvas');
                        width1 = canvas.getBoundingClientRect().width;
                        height1 = canvas.getBoundingClientRect().height;
                        const annotationLayer = pageElement.querySelector('.annotation-layer');
                        rect = pageElement.getBoundingClientRect();
                    }
                    else {
                        const fallbackPage = document.querySelector('[data-page-number="1"]');
                        if (fallbackPage && fallbackPage.querySelector('canvas')) {
                            const fallbackCanvas = fallbackPage.querySelector('canvas');
                            let fallbackWidth = fallbackCanvas.getBoundingClientRect().width;
                            let fallbackHeight = fallbackCanvas.getBoundingClientRect().height;
                            const annotationLayer = fallbackPage.querySelector('.annotation-layer');
                            const fallbackRect = annotationLayer.getBoundingClientRect();
                            width1 = fallbackWidth;
                            height1 = fallbackHeight;

                            rect = fallbackRect;
                        } else {
                            console.warn(`No canvas found for page ${pageNum} or fallback page.`);
                            continue;
                        }
                    }


                    for (const annotation of annotations) {
                        const user = annotation.user;

                        let x, y, width, height;

                        if (rotationDataval == 90 || rotationDataval == 270) {
                            const scy = originalWidth / rect.height;
                            const scx = originalHeight / rect.width;

                            x = (parseFloat(annotation.left) / 100) * width1 * scx;
                            y = (parseFloat(annotation.top) / 100) * height1 * scy;
                            width = (parseFloat(annotation.width) / 100) * width1 * scx;
                            height = (parseFloat(annotation.height) / 100) * height1 * scy;
                        } else {
                            x = (parseFloat(annotation.left) / 100) * width1 * scaleX;
                            y = (parseFloat(annotation.top) / 100) * height1 * scaleY;
                            width = (parseFloat(annotation.width) / 100) * width1 * scaleX;
                            height = (parseFloat(annotation.height) / 100) * height1 * scaleY;
                        }


                        const key = `${x}|${y}|${width}|${height}`;

                        if (!params[user]) {
                            params[user] = { groupedPages: [] };
                        }

                        // Try to find existing group
                        let group = params[user].groupedPages.find(
                            g => g.x === x && g.y === y && g.width === width && g.height === height
                        );

                        if (group) {
                            // Add page if not already present
                            const pageNumInt = parseInt(pageNum);
                            if (!group.pages.includes(pageNumInt)) {
                                group.pages.push(pageNumInt);
                            }
                        } else {
                            // Create a new group
                            params[user].groupedPages.push({
                                x,
                                y,
                                width,
                                height,
                                pages: [parseInt(pageNum)]
                            });
                        }
                    }
                }
            }

            formData_image_watermark.append("params", JSON.stringify(params));


        }
        if (iswatermarkpresent) {
            formData_image_watermark.append("text", watermarktext);
            formData_image_watermark.append("font_size", parseInt(watermarkfontsize, 10));
        }



        let response = await fetch("/ConvertToPdf/AddInitial_WatermarkFile", {
            method: "POST",
            body: formData_image_watermark
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.message || "An error occurred");
        }

        let blob = await response.blob();

        globalBlob = blob;

        return blob;


    } catch (error) {
        console.error("Comments embeded Failed:", error);
        throw error;
    }
}

function base64ToFile(base64, filename) {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

const handlecomment = (event) => {
    setcomment(event.target.value);
};

const commentsubmit = () => {
    let detaisl = {
        commentoption: commentoption,
        comment: comment
    };

    if (reject == true) {
        if (comment === "" || comment == undefined) {
            alert("Please Enter the Comment");
            return false;
        } else {
            const currentuser = JSON.parse(localStorage.getItem("user"));
            DocumentService.decline(tempid, {
                useremail: currentuser.email,
                comment: comment,
            })
                .then((response) => {
                    if (!response.data.success) {

                        toastr.error(response.data.message);
                        return false;
                    }
                    window.location.href = "/dashboard";
                    // process.env.REACT_APP_ROUTER_BASE + "/dashboard";
                })
                .catch((e) => {
                    console.log("response ===" + e.response);
                    console.log("Message ===" + e.message);
                    error(e, 1002013).then((value) => {
                        if (value == 401) {
                            history.push("/")
                        }

                    })
                });
        }
    }
};




const nextField = () => {
    const {
        Annotations,
        docViewer
    } = webviwerInstance;
    const annotManager = docViewer.getAnnotationManager();
    let annots = annotManager.getAnnotationsList();
    if (annots[annotPosition]) {
        annotManager.jumpToAnnotation(annots[annotPosition]);
        if (annots[annotPosition + 1]) {
            setAnnotPosition(annotPosition + 1);
        }
    }
};

const prevField = () => {
    const {
        Annotations,
        docViewer
    } = webviwerInstance;
    const annotManager = docViewer.getAnnotationManager();
    let annots = annotManager.getAnnotationsList();
    if (annots[annotPosition]) {
        annotManager.jumpToAnnotation(annots[annotPosition]);
        if (annots[annotPosition - 1]) {
            setAnnotPosition(annotPosition - 1);
        }
    }
};

$("#emailList").on('click', 'li', function () {
    // Remove 'selected' class from all list items and their child images
    $(".list").removeClass("selected");
    $(".list img").removeClass("selected1");

    // Add 'selected' class to the clicked list item
    $(this).addClass("selected");
    // Add 'selected' class to the img element within the clicked list item
    $(this).find("img").addClass("selected1");
});

window.toggleRecepientSelection = async function (email) {
    PerpareDocumentContext.selectuser = email;

    if (fieldnameslist.includes(`SIGNATURE_${email}`)) {
        document.getElementById('INITIAL').disabled = false;
    }
    else {
        document.getElementById('INITIAL').disabled = true;
    }

    var userObj = PerpareDocumentContext.receipientEmails.find(x => x.email == email)
    if ('signatureImage' in userObj) { // Check if the attribute exists
        if (userObj.signatureImage !== "") { // Check if it's an empty string
            signature_img_others = userObj.signatureImage;
            eseal_img_others = userObj.esealImage;

            var sigimgdataval_others_data = 'data:image/png;base64,' + signature_img_others;
            imgdata_others = sigimgdataval_others_data;
            var img_others = new Image();
            img_others.src = imgdata_others;
            img_others.onload = function () {
                const width = img_others.width;
                const height = img_others.height;
                signature_dimensions_others = {
                    width: width,
                    height: height,
                }

            };
            var esealimgdataval_others_data = 'data:image/png;base64,' + eseal_img_others;
            var img1_others = new Image();
            imgdata1_others = esealimgdataval_others_data;
            img1_others.src = imgdata1_others;
            img1_others.onload = function () {
                const width = img1_others.width;
                const height = img1_others.height;
                eseal_dimensions_others = {
                    width: width,
                    height: height,
                }

            };

            initialImg_others = userObj.initialImage;
            var initialimgdataval_others_data = 'data:image/png;base64,' + initialImg_others;
            initialimgdata_others = initialimgdataval_others_data;
            var initialimg_others = new Image();
            initialimg_others.src = initialimgdata_others;
            initialimg_others.onload = function () {
                const width = initialimg_others.width;
                const height = initialimg_others.height;
                initial_dimensions_others = {
                    width: width,
                    height: height,
                }

            };
            // console.log("signature_image exists and is an empty string.");
        } else {
            if (userObj.orgUid.trim() != "") {

                if (userObj.hasDelegation) {
                    var previewuserobjdata =
                    {
                        email: userObj.alternateSignatoriesList[0].email,
                        suid: userObj.alternateSignatoriesList[0].suid,
                        OrganizationId: userObj.orgUid,
                        AccountType: 'organization',
                    }
                } else {
                    var previewuserobjdata =
                    {
                        email: userObj.email,
                        suid: userObj.suid,
                        OrganizationId: userObj.orgUid,
                        AccountType: 'organization',
                    }
                }
            }
            else {
                var previewuserobjdata =
                {
                    email: userObj.email,
                    suid: userObj.suid,
                    OrganizationId: userObj.orgUid,
                    AccountType: 'self',
                }
            }
            let tempid = document.getElementById('templateSelect').value;
            previewuserobjdata.signtempid = tempid;
            try {
                // Await the response from `handlePreviewimages`
                console.log(previewuserobjdata);
                const previewResponse = await handlePreviewimages(previewuserobjdata);
                if (previewResponse) {


                    // Update `PerpareDocumentContext` with the preview data

                    // Assign to external variables if needed
                    signature_img_others = previewResponse.signatureImage;
                    eseal_img_others = previewResponse.esealImage;
                    userObj.signatureImage = signature_img_others;
                    userObj.esealImage = eseal_img_others;
                    var sigimgdataval_others_data = 'data:image/png;base64,' + signature_img_others;
                    imgdata_others = sigimgdataval_others_data;
                    var img_others = new Image();
                    img_others.src = imgdata_others;
                    img_others.onload = function () {
                        const width = img_others.width;
                        const height = img_others.height;
                        signature_dimensions_others = {
                            width: width,
                            height: height,
                        }

                    };
                    var esealimgdataval_others_data = 'data:image/png;base64,' + eseal_img_others;
                    var img1_others = new Image();
                    imgdata1_others = esealimgdataval_others_data;
                    img1_others.src = imgdata1_others;
                    img1_others.onload = function () {
                        const width = img1_others.width;
                        const height = img1_others.height;
                        eseal_dimensions_others = {
                            width: width,
                            height: height,
                        }

                    };

                    console.log("signaturedata", signature_dimensions_others);
                    console.log("esealdata", eseal_dimensions_others);
                    console.log("Preview Data:", previewResponse);
                } else {


                    console.warn("No preview data available.");
                }
            } catch (error) {
                console.error("Error fetching preview images:", error);
            }


        }

    } else {
        if (userObj.orgUid.trim() != "") {

            if (userObj.hasDelegation) {
                var previewuserobjdata =
                {
                    email: userObj.alternateSignatoriesList[0].email,
                    suid: userObj.alternateSignatoriesList[0].suid,
                    OrganizationId: userObj.orgUid,
                    AccountType: 'organization',
                }
            } else {
                var previewuserobjdata =
                {
                    email: userObj.email,
                    suid: userObj.suid,
                    OrganizationId: userObj.orgUid,
                    AccountType: 'organization',
                }
            }
        }
        else {
            var previewuserobjdata =
            {
                email: userObj.email,
                suid: userObj.suid,
                OrganizationId: userObj.orgUid,
                AccountType: 'self',
            }
        }
        try {
            let tempid = document.getElementById('templateSelect').value;
            previewuserobjdata.signtempid = tempid;
            // Await the response from `handlePreviewimages`
            console.log(previewuserobjdata);
            const previewResponse = await handlePreviewimages(previewuserobjdata);
            if (previewResponse) {
                // Update `PerpareDocumentContext` with the preview data

                // Assign to external variables if needed
                signature_img_others = previewResponse.signatureImage;
                eseal_img_others = previewResponse.esealImage;
                userObj.signatureImage = signature_img_others;
                userObj.esealImage = eseal_img_others;
                var sigimgdataval_others_data = 'data:image/png;base64,' + signature_img_others;
                imgdata_others = sigimgdataval_others_data;
                var img_others = new Image();
                img_others.src = imgdata_others;
                img_others.onload = function () {
                    const width = img_others.width;
                    const height = img_others.height;
                    signature_dimensions_others = {
                        width: width,
                        height: height,
                    }

                };
                var esealimgdataval_others_data = 'data:image/png;base64,' + eseal_img_others;
                var img1_others = new Image();
                imgdata1_others = esealimgdataval_others_data;
                img1_others.src = imgdata1_others;
                img1_others.onload = function () {
                    const width = img1_others.width;
                    const height = img1_others.height;
                    eseal_dimensions_others = {
                        width: width,
                        height: height,
                    }

                };
                initialImg_others = userObj.initialImage;
                var initialimgdataval_others_data = 'data:image/png;base64,' + initialImg_others;
                initialimgdata_others = initialimgdataval_others_data;
                var initialimg_others = new Image();
                initialimg_others.src = initialimgdata_others;
                initialimg_others.onload = function () {
                    const width = initialimg_others.width;
                    const height = initialimg_others.height;
                    initial_dimensions_others = {
                        width: width,
                        height: height,
                    }

                };
                console.log("signaturedata", signature_dimensions_others);
                console.log("esealdata", eseal_dimensions_others);
                console.log("Preview Data:", previewResponse);
            } else {


                console.warn("No preview data available.");
            }
        } catch (error) {
            console.error("Error fetching preview images:", error);
        }


    }

    if (userObj.eseal) {
        $("#Eseal").removeClass("classshide");
    } else {
        $("#Eseal").addClass("classshide");
    }
    if (userObj.initial) {
        $("#Initial").removeClass("classshide");
    } else {
        $("#Initial").addClass("classshide");
    }
    //here manage field div
    if ($("#fields").hasClass("classshide"))
        $("#fields").removeClass("classshide");

    $("#fields").removeClass("classshide");

};


const toggleQRCODEVisibility = () => {
    var isQrCodeRequired = $("#QrCodeRequired").prop("checked");

    if (isQrCodeRequired) {
        $("#QRCODEbutton").removeClass("classshide");
        $("#qrfield").css('display', 'flex');

    } else {
        $("#QRCODEbutton").addClass("classshide");
        $("#qrfield").css('display', 'none');
    }
};

const toggleInitialVisibility = () => {
    var isInitialRequired = $("#InitialRequired").prop("checked");
    if (isInitialRequired) {
        $("#Initial").removeClass("classshide");
    } else {
        $("#Initial").addClass("classshide");
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


window.SignedDocCheck = function (docid, status) {

    if (document.getElementById("digitalShowModal").style.display != 'none') {
        const interval = setInterval(() => {
            const elem = document.getElementById('signingdocid');
            if (elem && elem.value) {

                if (elem.value === docid) {
                    if (status === true) {
                        updateStepper(2, "success", "");
                    } else {
                        if (globalBlob === null) {

                            globalBlob = new Blob([globalFile], {
                                type: globalFile.type
                            });
                        }

                        updateStepper(2, "failed", "Document Signing failed.", "", "", "", "", "", globalBlob);
                    }
                }
                clearInterval(interval);
            }
        }, 20);

    }

};


let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (iswatermarkpresent) {
            setWatermark();
        }
    }, 100);
});

async function ImagePreview() {
    try {

        let tempid = document.getElementById('templateSelect').value;

        const response = await handleTemplatePreviewimages(tempid);

        if (response) {

            if (response.success) {

                $("#signatureTemplatePreviewImage").attr("src", "data:image/png;base64," + response.data);

                $("#digitalFormModal1").modal('show');
            }
            else {
                swal({
                    type: 'error',
                    title: 'Error',
                    text: response.message
                })
            }

        } else {
            console.error("No preview data received");
        }
    } catch (err) {
        console.error("Error fetching preview images:", err);
    }
}


function closeModal() {
    $("#digitalFormModal1").modal('hide');
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

if (typeof window !== 'undefined') {
    window.onMouseDown = onMouseDown;
    window.fileSelect = fileSelect;
    window.getFileConfiguration = getFileConfiguration;
}

function closeModal(modalEl) {
    if (!modalEl) return;

    const modalInstance = bootstrap.Modal.getInstance(modalEl)
        || new bootstrap.Modal(modalEl);

    modalInstance.hide();
}

// Global click listener for close buttons and overlay click
document.addEventListener("click", function (e) {

    // Close button inside modal (.modal-close, .close-btn, .close)
    if (e.target.closest(".modal-close, .close-btn, .close")) {
        const modal = e.target.closest(".modal");
        closeModal(modal);
    }

    // Clicking directly on overlay closes modal
    if (e.target.classList.contains("modal-overlay")) {
        closeModal(e.target);
    }
});
