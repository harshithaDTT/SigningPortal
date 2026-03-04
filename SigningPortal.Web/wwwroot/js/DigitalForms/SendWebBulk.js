var fieldnameslist = [];
const preFilledData = {};
var pdfAnnotations = [];
var annotations = [];
var scaleX = "";
var scaleY = "";
var signatureX = "";
var signatureY = "";
var signaturePage = "";
var esealX = "";
var esealY = "";
var esealPage = "";
var radioGroups = {};
var currentGroupName = `group-${Date.now()}`;
var editorInstance;
var editorInstances = [];
var annotations = [];
var signaturewidth = null;
var signatureheight = null;
var esealheight = null;
var esealwidth = null;
const usedLabels = new Set();
var isdrag = false;
var numberOfRoles;
var radiofieldname = 1;

var Cordinates = { "imgHeight": "", "imgWidth": "", "signatureYaxis": "", "signatureXaxis": "", "pageNumber": "" }
var signCoordinates = {
    "esealplaceHolderCoordinates": JSON.parse(JSON.stringify(Cordinates)),
    "placeHolderCoordinates": JSON.parse(JSON.stringify(Cordinates)),
    "qrPlaceHolderCoordinates": JSON.parse(JSON.stringify(Cordinates)),
}
var listCoordinates = [];

$(document).ready(function () {
    $('#sequentialSign').on('click', function () {
        return confirmCheck(this);
    });

    $('#addSignatoriesBtn').on('click', function () {
        addSignatories();
    });

    $('#headerid').on('click', function () {
        handleOpenTools(true);
    });

    $('#textid').on('click', function () {
        handleAddText(true);
    });

    $('#fieldid').on('click', function () {
        handleAddInputBlock(true);
    });


    $('#onlytextid').on('click', function () {
        handleAddOnlytext(true);
    });

    $('#textareaid').on('click', function () {
        handleAddTextArea(true);
    });

    $('#radioid').on('click', function () {
        handleAddRadio(true);
    });

    $('#checkboxid').on('click', function () {
        handleCheckbox(true);
    });

    $('#selectid').on('click', function () {
        handleAddSelect(true);
    });

    $('#tableid').on('click', function () {
        handleAddTable(true);
    });

    $('#signatureid').on('click', function () {
        handleSignature(true);
    });

    $('#esealid').on('click', function () {
        handleEseal(true);
    });

    $('#buttonid').on('click', function () {
        handleAddButton();
    });

    $('#imageid').on('click', function () {
        handleAddimage(true);
    });

    $('#signDays').on('input', function (event) {
        validateInput(event);
    });

    $('#tableRowsInput').on('input', function (event) {
        validateTable(event);
    });

});

function confirmCheck(checkbox) {
    if (!checkbox.checked) { // User tries to uncheck
        swal({
            icon: 'info',
            title: 'Action not allowed',
            text: 'Forms do not permit signing roles in an unordered sequence.',

        });
        return false;
    }
    return true; // Allow checking (if unchecked previously)
}

class dummyBlock {
    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.style.display = 'none';
        return this.wrapper;
    }
    validate() {
        return false;
    }
    save() {
        return {}
    }
}

class HeaderBlock {
    static get toolbox() {
        return {
            title: 'Header',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        };
    }



    constructor({ data, api }) {
        this.api = api;
        this.data = (data && Object.keys(data).length > 0) ? data : { tag: 'h2', alignment: 'left', text: '' }

        this.wrapper = null;
        this.editButton = null;
        this.header = null;
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.style.position = 'relative';
        this.header = document.createElement(this.data.tag);
        this.header.textContent = this.data.text;
        this.header.setAttribute('contenteditable', 'true');
        this.header.style.outline = 'none'
        this.header.style.marginBottom = '0';

        this.header.style.textAlign = this.data.alignment;

        this.wrapper.appendChild(this.header);

        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';
        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.backgroundColor = 'transparent';
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.zIndex = '100';
        this.editButton.style.outline = 'none';
        this.editButton.className = 'switchtab';

        this.editButton.onclick = () => this.openEditModal();

        this.wrapper.appendChild(this.editButton);

        this.wrapper.onmouseover = () => {
            this.editButton.classList.remove('switchtab')
            this.editButton.classList.add('openedit')
        };
        this.wrapper.onmouseout = () => {
            this.editButton.classList.remove('openedit')
            this.editButton.classList.add('switchtab')
        };

        return this.wrapper;
    }
    renderHeader() {
        this.wrapper.innerHTML = '';
        this.header = null;
        this.header = document.createElement(this.data.tag);
        this.header.textContent = this.data.text;
        this.header.setAttribute('contenteditable', 'true');
        this.header.style.outline = 'none'

        this.header.style.textAlign = this.data.alignment;

        this.wrapper.appendChild(this.header);
        this.wrapper.appendChild(this.editButton);
        this.wrapper.onmouseover = () => {
            this.editButton.style.display = 'block';
        };
        this.wrapper.onmouseout = () => {
            this.editButton.style.display = 'none';
        };

    }



    save(blockContent) {
        const height = this.wrapper?.offsetHeight || 0;
        this.data.text = this.header.textContent;
        this.data.blockheight = height;
        return this.data;
    }

    openEditModal() {
        const headerTagSelect = document.getElementById('headerTagSelect');
        const headerAlignmentSelect = document.getElementById('headerAlignmentSelect');

        const previewContainer = document.getElementById('headerPreview');


        const updateHeaderPreview = () => {

            previewContainer.innerHTML = '';


            const newPreviewHeader = document.createElement(headerTagSelect.value);
            newPreviewHeader.id = 'previewHeader';
            newPreviewHeader.style.textAlign = headerAlignmentSelect.value;
            newPreviewHeader.textContent = this.header.textContent

            previewContainer.appendChild(newPreviewHeader);
        };

        headerAlignmentSelect.value = this.data.alignment;
        headerTagSelect.value = this.data.tag;
        updateHeaderPreview();

        headerTagSelect.addEventListener('change', updateHeaderPreview);
        headerAlignmentSelect.addEventListener('change', updateHeaderPreview);


        const saveButton = document.getElementById('saveHeaderData');
        saveButton.onclick = () => {
            this.data.tag = headerTagSelect.value;
            this.data.alignment = headerAlignmentSelect.value;
            this.data.text = this.header.textContent;
            this.renderHeader();
            $('#editHeaderModal').modal('hide');
        };

        const deletebutton = document.getElementById('deleteheaderblock')
        deletebutton.onclick = () => {
            const index = this.api.blocks.getCurrentBlockIndex()
            this.api.blocks.delete(index)
            $('#editInputModal').modal('hide');

        };


        $('#editHeaderModal').modal('show');
    }

}

class ParagraphBlock {
    static get toolbox() {
        return {
            title: 'Paragraph',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 96 960 960" width="24"><path d="M260 776q-17 0-28.5-11.5T220 736q0-17 11.5-28.5T260 696h440q17 0 28.5 11.5T740 736q0 17-11.5 28.5T700 776H260Zm-60-240q-17 0-28.5-11.5T160 496q0-17 11.5-28.5T200 456h560q17 0 28.5 11.5T800 496q0 17-11.5 28.5T760 536H200Zm60-240q-17 0-28.5-11.5T220 256q0-17 11.5-28.5T260 216h440q17 0 28.5 11.5T740 256q0 17-11.5 28.5T700 296H260Z"/></svg>',
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            text: 'Paragraph',
            fontFamily: 'Arial',
            fontSize: '16px',
            textAlign: 'left',
            fontWeight: 'normal',
            fontStyle: 'normal',
        };
        this.wrapper = null;
        this.editButton = null;
    }



    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'paragraph-block-wrapper';
        this.wrapper.style.position = 'relative';
        this.wrapper.style.padding = '1em 0';


        const paragraph = document.createElement('p');
        paragraph.className = 'paragraph-block';
        paragraph.contentEditable = true;
        paragraph.textContent = this.data.text;
        paragraph.style.setProperty('font-family', this.data.fontFamily, 'important');
        paragraph.style.fontSize = this.data.fontSize;
        paragraph.style.textAlign = this.data.textAlign;
        paragraph.style.fontWeight = this.data.fontWeight;
        paragraph.style.fontStyle = this.data.fontStyle;
        paragraph.style.outline = 'none';
        paragraph.style.margin = '0';
        paragraph.style.padding = '0';
        this.paragraphElement = paragraph;

        paragraph.addEventListener('paste', (event) => {
            const selection = window.getSelection();
            const anchorNode = selection?.anchorNode;
            const text = this.data.text;
            const fontFamily = this.data.fontFamily;
            const fontSize = this.data.fontSize;
            const textAlign = this.data.textAlign;
            const fontWeight = this.data.fontWeight;
            const fontStyle = this.data.fontStyle;

            if (!anchorNode) return;



            const pastedContent = event.clipboardData.getData('text/plain');
            const paragraphs = pastedContent.split('\n').filter(paragraph => paragraph.trim() !== '');

            if (paragraphs.length <= 1) return;
            event.preventDefault();

            if (editorInstance) {

                const selectedBlockIndex = editorInstance.blocks.getCurrentBlockIndex();

                console.log(`🟢 Currently Selected Block Index: ${selectedBlockIndex}`);


                if (selectedBlockIndex !== -1) {

                    editorInstance.blocks.delete(selectedBlockIndex);
                }



                paragraphs.forEach(paragraph => {
                    editorInstance.blocks.insert('paragraph', {
                        text: paragraph,
                        fontFamily: 'Arial',
                        fontSize: '1rem',
                        textAlign: 'left',
                        fontWeight: 'normal',
                        fontStyle: 'normal',
                    });
                });

                editorInstance.blocks.insert('paragraph', {
                    text: text,
                    fontFamily: fontFamily,
                    fontSize: fontSize,
                    textAlign: textAlign,
                    fontWeight: fontWeight,
                    fontStyle: fontStyle,
                }, {}, selectedBlockIndex);

            }
        });


        paragraph.oninput = () => {
            this.data.text = paragraph.textContent;
        };

        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';
        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.background = 'transparent';
        this.editButton.style.border = 'none';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.outline = 'none';
        this.editButton.className = 'switchtab';
        this.editButton.onclick = () => this.openEditModal();

        this.wrapper.onmouseover = () => {
            this.editButton.classList.remove('switchtab')
            this.editButton.classList.add('openedit')
        };
        this.wrapper.onmouseout = () => {
            this.editButton.classList.remove('openedit')
            this.editButton.classList.add('switchtab')
        };

        this.wrapper.appendChild(paragraph);
        this.wrapper.appendChild(this.editButton);

        return this.wrapper;
    }

    save(blockContent) {
        const height = this.wrapper?.offsetHeight || 0;
        return {

            text: this.data.text,
            fontFamily: this.data.fontFamily,
            fontSize: this.data.fontSize,
            textAlign: this.data.textAlign,
            fontWeight: this.data.fontWeight,
            fontStyle: this.data.fontStyle,
            blockheight: height
        };
    }

    openEditModal() {

        const fontFamilySelect = document.getElementById('paragraphFontFamily');
        const fontSizeInput = document.getElementById('paragraphFontSize');
        const textAlignSelect = document.getElementById('paragraphTextAlign');
        const boldButton = document.getElementById('paragraphBoldButton');
        const italicButton = document.getElementById('paragraphItalicButton');

        fontFamilySelect.value = this.data.fontFamily;
        fontSizeInput.value = this.data.fontSize;
        textAlignSelect.value = this.data.textAlign;
        boldButton.classList.toggle('btn-primary', this.data.fontWeight === 'bold');
        italicButton.classList.toggle('btn-primary', this.data.fontStyle === 'italic');

        const updatePreview = () => {
            const preview = document.getElementById('paragraphPreview');
            preview.style.setProperty('font-family', fontFamilySelect.value, 'important');
            preview.style.fontSize = fontSizeInput.value;
            preview.style.textAlign = textAlignSelect.value;
            preview.style.fontWeight = boldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            preview.style.fontStyle = italicButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            preview.textContent = this.data.text;
        };
        fontFamilySelect.addEventListener('change', updatePreview);
        fontSizeInput.addEventListener('input', updatePreview);
        textAlignSelect.addEventListener('change', updatePreview);
        boldButton.onclick = () => {
            boldButton.classList.toggle("btn-primary");
            updatePreview();
        };
        italicButton.onclick = () => {
            italicButton.classList.toggle("btn-primary");
            updatePreview();
        };

        document.getElementById('saveParagraphButton').onclick = () => {
            this.data.fontFamily = fontFamilySelect.value;
            this.data.fontSize = fontSizeInput.value;
            this.data.textAlign = textAlignSelect.value;
            this.data.fontWeight = boldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            this.data.fontStyle = italicButton.classList.contains('btn-primary') ? 'italic' : 'normal';

            this.paragraphElement.textContent = this.data.text;
            this.paragraphElement.style.setProperty('font-family', this.data.fontFamily, 'important');
            this.paragraphElement.style.fontSize = this.data.fontSize;
            this.paragraphElement.style.textAlign = this.data.textAlign;
            this.paragraphElement.style.fontWeight = this.data.fontWeight;
            this.paragraphElement.style.fontStyle = this.data.fontStyle;

            $('#paragraphEditModal').modal('hide');
        };

        updatePreview();
        $('#paragraphEditModal').modal('show');
    }
}


class TableBlock {
    static get toolbox() {
        return {
            title: 'Table',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000"><path d="M4 4H2v16h2V4zm4 0H6v16h2V4zm4 0h-2v16h2V4zm4 0h-2v16h2V4zm4 0h-2v16h2V4z"/></svg>',
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            fieldName: 'table',
            rows: 2,
            cols: 2,
            fontFamily: 'Arial',
            fontSize: '16px',
            isBold: false,
            isItalic: false,
            cells: Array(2).fill().map(() => Array(2).fill('')),
            mandatory: false,
        };
        this.wrapper = null;
        this.editButton = null;

    }

    render() {
        const selectElement = document.getElementById('ClientSelect');
        const selectedRole = selectElement.value;
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'table-container';
        this.wrapper.style.padding = "1em 0";
        this.data.role = this.data.role ? this.data.role : selectedRole;

        const table = document.createElement('table');
        table.className = 'custom-table';
        table.setAttribute('role', this.data.role);

        this.wrapper.appendChild(table);
        this.renderTable();

        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';

        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.backgroundColor = 'transparent';
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.transition = 'opacity 0.3s';
        this.editButton.style.zIndex = '100';
        this.editButton.style.outline = 'none';
        this.editButton.className = 'switchtab';
        this.editButton.onclick = () => this.openEditModal();

        this.wrapper.appendChild(this.editButton);

        this.wrapper.onmouseover = () => {
            this.editButton.classList.remove('switchtab')
            this.editButton.classList.add('openedit')
        };
        this.wrapper.onmouseout = () => {
            this.editButton.classList.remove('openedit')
            this.editButton.classList.add('switchtab')
        };

        usedLabels.add(this.data.fieldName + "_" + this.data.role);


        return this.wrapper;
    }

    renderTable() {
        const table = this.wrapper.querySelector('table');
        table.innerHTML = '';
        for (let i = 0; i < this.data.rows; i++) {
            const row = table.insertRow();
            for (let j = 0; j < this.data.cols; j++) {
                const cell = row.insertCell();
                cell.contentEditable = true;
                cell.textContent = this.data.cells[i][j] || (i === 0 ? `Header ${j + 1}` : ``);
                if (i == 0) {
                    cell.style.fontWeight = "bold"
                }
                else {
                    cell.style.fontWeight = this.data.isBold ? "bold" : "normal";

                }
                this.data.cells[i][j] = cell.textContent;
                cell.style.fontFamily = this.data.fontFamily;
                cell.style.fontSize = this.data.fontSize;
                cell.style.fontStyle = this.data.isItalic ? "italic" : "normal";
                cell.addEventListener('input', (event) => {
                    this.data.cells[i][j] = event.target.textContent;
                });
            }
        }
    }

    renderTablePreview() {
        const tablePreview = document.getElementById('tablePreview');
        tablePreview.innerHTML = '';
        const table = document.createElement('table');
        table.className = 'custom-table';
        for (let i = 0; i < this.data.rows; i++) {
            const row = table.insertRow();
            for (let j = 0; j < this.data.cols; j++) {
                const cell = row.insertCell();
                cell.contentEditable = false;
                cell.style.whiteSpace = 'pre';
                cell.textContent = this.data.cells[i][j] || (i === 0 ? `Header ${j + 1}` : ` `);
                if (i == 0) {
                    cell.style.fontWeight = 'bold'

                }
                else {
                    cell.style.fontWeight = this.data.isBold ? "bold" : "normal";

                }
                cell.style.fontFamily = this.data.fontFamily;
                cell.style.fontSize = this.data.fontSize;
                cell.style.fontStyle = this.data.isItalic ? "italic" : "normal";
            }
        }
        tablePreview.appendChild(table);
    }

    save() {
        return this.data;
    }

    destroy() {
        const labelToRemove = this.data.fieldName + "_" + this.data.role;


        if (usedLabels.has(labelToRemove)) {
            usedLabels.delete(labelToRemove);
        }
    }


    openEditModal() {
        const fieldNameInput = document.getElementById('fieldNameInput');
        const tableRowsInput = document.getElementById('tableRowsInput');
        const tableColsInput = document.getElementById('tableColsInput');
        const fontFamilySelect = document.getElementById('fontFamilySelect');
        const fontSizeInput = document.getElementById('fontSizeInput');
        const boldButton = document.getElementById('tableboldButton');
        const italicButton = document.getElementById('tableitalicButton');
        const labelTableError = document.getElementById('labelTableError');
        labelTableError.classList.add('d-none');
        const mandatoryCheckboxTable = document.getElementById('mandatoryCheckboxTable');
        mandatoryCheckboxTable.checked = this.data.mandatory;
        mandatoryCheckboxTable.addEventListener('change', () => {
            this.data.mandatory = mandatoryCheckboxTable.checked;
        });

        fieldNameInput.value = this.data.fieldName;
        tableRowsInput.value = this.data.rows;
        tableColsInput.value = this.data.cols;
        fontFamilySelect.value = this.data.fontFamily;
        fontSizeInput.value = this.data.fontSize;
        boldButton.classList.toggle("btn-primary", this.data.isBold === 'bold');
        italicButton.classList.toggle("btn-primary", this.data.isItalic === 'italic');

        const updateTablePreview = () => {
            this.data.fieldName = fieldNameInput.value;
            this.data.rows = tableRowsInput.value;
            this.data.cols = tableColsInput.value;
            this.data.fontFamily = fontFamilySelect.value;
            this.data.fontSize = fontSizeInput.value;
            this.data.isBold = boldButton.classList.contains("btn-primary");
            this.data.isItalic = italicButton.classList.contains("btn-primary");
            this.data.cells = Array.from({ length: this.data.rows }, (_, i) =>
                Array.from({ length: this.data.cols }, (_, j) => this.data.cells[i]?.[j] || '')
            );
            this.renderTablePreview();
        };

        tableRowsInput.addEventListener('input', updateTablePreview);
        tableColsInput.addEventListener('input', updateTablePreview);
        fontFamilySelect.addEventListener('change', updateTablePreview);
        fontSizeInput.addEventListener('input', updateTablePreview);
        boldButton.onclick = () => {
            boldButton.classList.toggle("btn-primary");
            updateTablePreview();
        };
        italicButton.onclick = () => {
            italicButton.classList.toggle("btn-primary");
            updateTablePreview();
        };

        updateTablePreview();

        const saveButton = document.getElementById('saveTableData');
        saveButton.onclick = () => {
            const newLabel = fieldNameInput.value + "_" + this.data.role;
            if (usedLabels.has(newLabel) && newLabel !== this.data.fieldName + "_" + this.data.role) {
                labelTableError.innerText = "Dublicate Field Name";
                labelTableError.classList.remove('d-none');

                return;
            }
            else {
                labelTableError.classList.add('d-none');
            }

            if (fieldNameInput.value === "") {
                labelTableError.innerText = "Field Name can't be Empty";
                labelTableError.classList.remove('d-none');
                return;
            }
            else {
                labelTableError.classList.add('d-none');
            }


            usedLabels.delete(this.data.fieldName + "_" + this.data.role);
            usedLabels.add(newLabel);
            this.data.fieldName = fieldNameInput.value;
            this.data.rows = tableRowsInput.value;
            this.data.cols = tableColsInput.value;
            this.data.fontFamily = fontFamilySelect.value;
            this.data.fontSize = fontSizeInput.value;
            this.data.isBold = boldButton.classList.contains("btn-primary");
            this.data.isItalic = italicButton.classList.contains("btn-primary");
            this.data.cells = Array.from({ length: this.data.rows }, (_, i) =>
                Array.from({ length: this.data.cols }, (_, j) => this.data.cells[i]?.[j] || '')
            );
            this.renderTable();
            $('#editTableModal').modal('hide');
        };
        const deletebutton = document.getElementById('deletetableblock')
        deletebutton.onclick = () => {
            const index = this.api.blocks.getCurrentBlockIndex()
            this.api.blocks.delete(index)
            $('#editInputModal').modal('hide');

        };
        $('#editTableModal').modal('show');
    }
}






class FontFamilyInlineTool {
    static get isInline() {
        return true;
    }

    constructor({ api }) {
        this.api = api;
        this.button = null;
        this.select = null;
        this.tag = 'SPAN';
        this.class = 'cdx-font-family';
    }

    render() {
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.innerHTML = 'FF';
        this.button.classList.add('cdx-inline-tool-button');

        this.select = document.createElement('select');
        const fonts = ['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'];
        fonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.innerText = font;
            this.select.appendChild(option);
        });

        this.button.appendChild(this.select);
        this.select.addEventListener('change', this.changeFontFamily.bind(this));

        return this.button;
    }

    changeFontFamily() {
        const selectedFont = this.select.value;
        this.api.inlineToolbar.close();
        this.wrap(selectedFont);
    }

    wrap(fontFamily) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);

        if (range.collapsed) return;

        const span = document.createElement(this.tag);
        span.style.fontFamily = fontFamily;
        span.classList.add(this.class);


        const content = range.extractContents();
        span.appendChild(content);
        range.insertNode(span);

        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        selection.addRange(newRange);
    }

    checkState(selection) {
        const parent = selection.anchorNode.parentNode;
        this.button.classList.toggle(this.api.styles.inlineToolButtonActive, parent.tagName === this.tag && parent.style.fontFamily);
    }

    static get sanitize() {
        return {
            span: {
                class: this.class,
                style: true,
            }
        };
    }
}

class FontSizeInlineTool {
    static get isInline() {
        return true;
    }

    constructor({ api }) {
        this.api = api;
        this.button = null;
        this.select = null;
        this.tag = 'SPAN';
        this.class = 'cdx-font-size';
        this.value = null;
    }

    render() {
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.innerHTML = 'FS';
        this.button.classList.add('cdx-inline-tool-button');

        this.select = document.createElement('select');
        const sizes = ['10px', '12px', '14px', '16px', '18px', '24px', '36px'];
        sizes.forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.innerText = size;
            this.select.appendChild(option);
        });
        const selection = window.getSelection();
        const parent = selection.anchorNode.parentNode;
        if (parent.style.fontSize) {
            this.select.value = parent.style.fontSize;
        }

        this.button.appendChild(this.select);
        this.select.addEventListener('change', this.changeFontSize.bind(this));

        return this.button;
    }

    changeFontSize() {
        this.value = this.select.value; // Update the selected value
        this.api.inlineToolbar.close();
        this.wrap(this.value);
    }

    wrap(fontSize) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);

        if (range.collapsed) return;

        const span = document.createElement(this.tag);
        span.style.fontSize = fontSize;
        span.classList.add(this.class);

        const content = range.extractContents();
        span.appendChild(content);
        range.insertNode(span);

        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        selection.addRange(newRange);
    }

    checkState(selection) {
        const parent = selection.anchorNode.parentNode;
        if (parent.tagName === this.tag && parent.style.fontSize) {
            this.value = parent.style.fontSize; // Update the value based on the current selection
            this.select.value = this.value; // Show the selected value
            this.button.classList.add(this.api.styles.inlineToolButtonActive);
        } else {
            this.value = null; // Reset value if no font size is applied
            this.select.value = ''; // Clear the select
            this.button.classList.remove(this.api.styles.inlineToolButtonActive);
        }
    }

    static get sanitize() {
        return {
            span: {
                class: this.class,
                style: true,
            }
        };
    }
}


class SignatureBlock {
    static get toolbox() {
        return {
            title: 'Input',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M15 7L22 12L15 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            content: 'Signature',
            width: '15%',
            height: 'auto',
            alignment: 'center',
            fieldName: 'input field'
        };
        this.wrapper = null;
        this.editButton = null;

    }

    render() {
        const selectElement = document.getElementById('ClientSelect');
        const selectedRole = selectElement.value;
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'input-block';
        this.wrapper.style.position = 'relative';
        this.wrapper.style.height = this.data.height;
        this.wrapper.style.textAlign = this.data.alignment;
        this.wrapper.style.padding = "1em 0";
        this.data.role = this.data.role ? this.data.role : selectedRole;


        const inputDiv = document.createElement('div');
        inputDiv.style.border = "1px solid #44aad1";

        inputDiv.style.width = (window.eHeight * 0.2) + 'px';
        inputDiv.id = 'Signature' + "_" + this.data.role;
        inputDiv.style.height = (window.eHeight * 0.05) + 'px';
        inputDiv.textContent = 'Signature' + "_" + this.data.role;
        inputDiv.style.backgroundColor = "#d8d7d78a";
        inputDiv.style.color = "#44aad1";
        inputDiv.style.fontSize = "100%";
        inputDiv.style.display = 'inline-block';
        inputDiv.style.textAlign = 'center';
        inputDiv.setAttribute('role', this.data.role);



        this.wrapper.appendChild(inputDiv);

        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';
        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.backgroundColor = 'transparent';
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.zIndex = '100';
        this.editButton.onclick = () => this.openEditModal();
        this.editButton.className = 'switchtab';

        this.wrapper.appendChild(this.editButton);

        this.wrapper.onmouseover = () => {
            this.editButton.classList.remove('switchtab')
            this.editButton.classList.add('openedit')
        };
        this.wrapper.onmouseout = () => {
            this.editButton.classList.remove('openedit')
            this.editButton.classList.add('switchtab')
        };



        return this.wrapper;
    }

    save(blockContent) {
        return this.data;
    }



    openEditModal() {

        const inputAlignment = document.getElementById('inputAlignmentSig');
        const inputPreview = document.getElementById('inputPreviewSig');


        inputPreview.style.textAlign = this.data.alignment;
        inputAlignment.value = this.data.alignment;

        const updateInputPreview = () => {

            inputPreview.style.textAlign = inputAlignment.value;
        };
        inputAlignment.addEventListener('change', updateInputPreview);

        const saveButton = document.getElementById('saveInputData');
        saveButton.onclick = () => {

            this.data.alignment = inputAlignment.value;

            this.wrapper.style.textAlign = inputAlignment.value;
            $('#editSignatureModal').modal('hide');
        };
        const deletebutton = document.getElementById('deletesignatureblock')
        deletebutton.onclick = () => {
            const index = this.api.blocks.getCurrentBlockIndex()
            this.api.blocks.delete(index)
            $('#editInputModal').modal('hide');

        };

        $('#editSignatureModal').modal('show');
    }
}


class EsealBlock {
    static get toolbox() {
        return {
            title: 'Input',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M15 7L22 12L15 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            content: 'Eseal',
            width: '15%',
            height: 'auto',
            alignment: 'center',
            fieldName: 'input field'
        };
        this.wrapper = null;
        this.editButton = null;

    }

    render() {
        const selectElement = document.getElementById('ClientSelect');
        const selectedRole = selectElement.value;
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'input-block';
        this.wrapper.style.position = 'relative';
        this.wrapper.style.height = this.data.height;
        this.wrapper.style.textAlign = this.data.alignment;
        this.wrapper.style.padding = "1em 0";
        this.data.role = this.data.role ? this.data.role : selectedRole


        const inputDiv = document.createElement('div');
        inputDiv.style.border = "1px solid #44aad1";

        inputDiv.style.width = (window.eHeight * 0.10) + 'px';
        inputDiv.id = 'Eseal' + "_" + this.data.role;
        inputDiv.style.height = (window.eHeight * 0.10) + 'px';
        inputDiv.textContent = 'Eseal' + "_" + this.data.role;
        inputDiv.style.backgroundColor = "#d8d7d78a";
        inputDiv.style.color = "#44aad1";
        inputDiv.style.fontSize = "100%";
        inputDiv.style.display = 'inline-flex';
        inputDiv.style.alignItems = 'center';
        inputDiv.style.justifyContent = 'center';
        inputDiv.style.textAlign = 'center';
        inputDiv.setAttribute('role', this.data.role);

        inputDiv.style.wordBreak = 'break-word';




        this.wrapper.appendChild(inputDiv);

        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';
        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.backgroundColor = 'transparent';
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.zIndex = '100';
        this.editButton.onclick = () => this.openEditModal();
        this.editButton.className = 'switchtab';

        this.wrapper.appendChild(this.editButton);

        this.wrapper.onmouseover = () => {
            this.editButton.classList.remove('switchtab')
            this.editButton.classList.add('openedit')
        };
        this.wrapper.onmouseout = () => {
            this.editButton.classList.remove('openedit')
            this.editButton.classList.add('switchtab')
        };



        return this.wrapper;
    }

    save(blockContent) {
        return this.data;
    }

    openEditModal() {

        const inputAlignment = document.getElementById('inputAlignmentEseal');
        const inputPreview = document.getElementById('inputPreviewEseal');
        const esealpreview = document.getElementById('esealpreview');
        esealpreview.style.height = (window.eHeight * 0.10) + 'px';
        esealpreview.style.width = (window.eHeight * 0.10) + 'px';

        inputPreview.style.textAlign = this.data.alignment;
        inputAlignment.value = this.data.alignment;

        const updateInputPreview = () => {

            inputPreview.style.textAlign = inputAlignment.value;
        };
        inputAlignment.addEventListener('change', updateInputPreview);

        const saveButton = document.getElementById('saveEsealData');
        saveButton.onclick = () => {

            this.data.alignment = inputAlignment.value;

            this.wrapper.style.textAlign = inputAlignment.value;
            $('#editEsealModal').modal('hide');
        };
        const deletebutton = document.getElementById('deleteesealblock')
        deletebutton.onclick = () => {
            const index = this.api.blocks.getCurrentBlockIndex()
            this.api.blocks.delete(index)
            $('#editInputModal').modal('hide');

        };

        $('#editEsealModal').modal('show');
    }
}




class SelectTool {
    static get toolbox() {
        return {
            title: 'Select',
            icon: '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg" fill="#000000"><circle cx="8.5" cy="7.5" r="6.5" fill="#000000"/></svg>',
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            label: 'Select Label',
            options: [],
            selected: '',
            labelPosition: 'left',
            labelfamily: 'Arial',
            labelSize: '16px',
            labelBold: 'normal',
            labelItalic: 'normal',
            optionFamily: 'Arial',
            optionSize: '16px',
            optionBold: 'normal',
            optionItalic: 'normal',
            selectWidth: '100',
            mandatory: false,
        };
        this.wrapper = null;
        this.labelElement = null;
        this.selectElement = null;
        this.editButton = null;

        this.asterisk = null;


    }

    render() {
        const selectElement = document.getElementById('ClientSelect');
        const selectedRole = selectElement.value;
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'd-flex align-items-center';
        this.wrapper.style.padding = "1em 0";
        this.data.role = this.data.role ? this.data.role : selectedRole

        this.labelElement = document.createElement('label');
        this.labelElement.textContent = this.data.label;
        this.labelElement.style.fontFamily = this.data.labelfamily;
        this.labelElement.style.fontSize = this.data.labelSize;
        this.labelElement.style.fontWeight = this.data.labelBold;
        this.labelElement.style.fontStyle = this.data.labelItalic;
        this.labelElement.style.marginRight = '10px';
        this.labelElement.style.whiteSpace = 'nowrap';

        const labeldiv = document.createElement('div')
        labeldiv.className = 'd-flex align-items-center';
        labeldiv.style.gap = '0px';
        labeldiv.style.padding = '0px';
        labeldiv.style.margin = '0px';

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'd-flex';
        inputWrapper.style.width = '100%';

        this.selectElement = document.createElement('select');
        this.selectElement.className = 'form-control mr-2';
        this.selectElement.style.fontFamily = this.data.optionFamily;
        this.selectElement.style.fontSize = this.data.optionSize;
        this.selectElement.style.fontWeight = this.data.optionBold;
        this.selectElement.style.fontStyle = this.data.optionItalic;
        this.selectElement.style.width = this.data.selectWidth + "%";
        this.selectElement.setAttribute('role', this.data.role);

        this.asterisk = document.createElement('span');
        this.asterisk.textContent = '*';
        this.asterisk.style.color = 'red';
        this.asterisk.style.fontSize = this.data.labelSize;
        const textSizeValue = parseInt(this.data.labelSize, 10);
        this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;

        this.data.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.innerText = option.value;
            this.selectElement.appendChild(optionElement);
        });

        if (this.data.mandatory) {
            this.labelElement.style.marginRight = "0px";
            this.asterisk.style.marginRight = "10px";
            this.asterisk.style.display = "unset";
        } else {

            this.labelElement.style.marginRight = "10px";
            this.asterisk.style.display = "none";
        }

        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';

        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '10px';
        this.editButton.style.backgroundColor = 'transparent';
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.transition = 'opacity 0.3s';
        this.editButton.style.zIndex = '100';
        this.editButton.style.outline = 'none';
        this.editButton.className = 'switchtab';
        this.editButton.onclick = () => this.openEditModal();

        labeldiv.appendChild(this.labelElement);
        labeldiv.appendChild(this.asterisk);
        // this.wrapper.appendChild(this.labelInput);

        this.wrapper.appendChild(labeldiv);
        inputWrapper.appendChild(this.selectElement);
        inputWrapper.appendChild(this.editButton);
        this.wrapper.appendChild(inputWrapper)


        this.applyLabelPosition();

        this.wrapper.onmouseover = () => {
            this.editButton.classList.remove('switchtab')
            this.editButton.classList.add('openedit')
        };
        this.wrapper.onmouseout = () => {
            this.editButton.classList.remove('openedit')
            this.editButton.classList.add('switchtab')
        };

        usedLabels.add(this.data.fieldName + "_" + this.data.role);



        return this.wrapper;
    }

    applyLabelPosition() {
        if (this.data.labelPosition === 'top') {
            this.wrapper.classList.add('flex-column');
            this.wrapper.classList.remove('align-items-center');
        } else {
            this.wrapper.classList.remove('flex-column');
            this.wrapper.classList.add('align-items-center');
        }
    }

    openEditModal() {
        const labelTextInput = document.getElementById('selectLabelTextInput');
        const selectfieldName = document.getElementById('selectfieldName');
        const labelPositionSelect = document.getElementById('selectLabelPositionSelect');
        const labelfamilyselect = document.getElementById('selectLabelFamilySelect');
        const labelFontSizeInput = document.getElementById('selectLabelFontSize');
        const boldButton = document.getElementById('selectBoldButton');
        const italicButton = document.getElementById('selectItalicButton');
        const optionsContainer = document.getElementById('selectOptionsContainer');
        const optionFamilySelect = document.getElementById('optionFamilySelect');
        const optionFontSizeInput = document.getElementById('optionFontSize');
        const optionBoldButton = document.getElementById('optionBoldButton');
        const optionItalicButton = document.getElementById('optionItalicButton');
        const selectWidthInput = document.getElementById('selectWidthInput');
        const labelSelectError = document.getElementById('labelSelectError');
        const newOptionInput = document.getElementById('selectNewOptionInput');
        const mandatoryCheckboxSelect = document.getElementById('mandatoryCheckboxSelect');
        mandatoryCheckboxSelect.checked = this.data.mandatory;
        mandatoryCheckboxSelect.addEventListener('change', () => {
            this.data.mandatory = mandatoryCheckboxSelect.checked;
            updatePreview();
        });

        newOptionInput.value = '';
        labelSelectError.classList.add('d-none');
        let tempoptions = JSON.parse(JSON.stringify(this.data.options));

        labelTextInput.value = this.data.label;
        selectfieldName.value = this.data.fieldName;
        labelPositionSelect.value = this.data.labelPosition;
        labelfamilyselect.value = this.data.labelfamily;
        labelFontSizeInput.value = this.data.labelSize;
        boldButton.classList.toggle('btn-primary', this.data.labelBold === 'bold');
        italicButton.classList.toggle('btn-primary', this.data.labelItalic === 'italic');

        selectWidthInput.value = this.data.selectWidth;

        optionFamilySelect.value = this.data.optionFamily;
        optionFontSizeInput.value = this.data.optionSize;
        optionBoldButton.classList.toggle('btn-primary', this.data.optionBold === 'bold');
        optionItalicButton.classList.toggle('btn-primary', this.data.optionItalic === 'italic');

        optionsContainer.innerHTML = '';
        const addOptionEditor = (value, optionsContainer) => {
            const optionWrapper = document.createElement('div');
            optionWrapper.className = 'option-wrapper';

            const optionInput = document.createElement('input');
            optionInput.type = 'text';
            optionInput.value = value;
            optionInput.className = 'form-control d-inline-block mr-2';

            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn btn-danger btn-sm';
            deleteButton.innerText = 'Delete';
            deleteButton.onclick = () => {
                optionsContainer.removeChild(optionWrapper);
                tempoptions = tempoptions.filter(option => option.value !== value);
                updatePreview()
            };

            optionWrapper.appendChild(optionInput);
            optionWrapper.appendChild(deleteButton);
            optionsContainer.appendChild(optionWrapper);

            optionInput.oninput = (event) => {
                const newValue = event.target.value;
                const option = tempoptions.find(option => option.value === value);
                option.value = newValue;
                this.selectElement.querySelector(`option[value="${value}"]`).innerText = newValue;
                this.selectElement.querySelector(`option[value="${value}"]`).value = newValue;
                value = newValue;
            };
        }
        const addOption = async (value, updatePreview) => {
            if (value) {
                tempoptions.push({ value });

                const optionsContainer = document.getElementById('selectOptionsContainer');
                await addOptionEditor(value, optionsContainer);
            }
        }
        const updatePreview = () => {
            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'd-flex align-items-center';
            if (labelPositionSelect.value === 'top') {
                previewWrapper.classList.add('flex-column');
                previewWrapper.classList.remove('align-items-center')

            }
            else {
                previewWrapper.classList.remove('flex-column')
                previewWrapper.classList.add('align-items-center');
            }

            const previewLabel = document.createElement('label');
            previewLabel.textContent = labelTextInput.value;
            previewLabel.style.fontFamily = labelfamilyselect.value;
            previewLabel.style.fontSize = labelFontSizeInput.value;
            previewLabel.style.fontWeight = boldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            previewLabel.style.fontStyle = italicButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            previewLabel.style.marginRight = '10px';
            previewLabel.style.whiteSpace = 'nowrap';

            if (this.data.mandatory) {
                previewLabel.innerHTML += ' <span style="color: red;">*</span>';
            }


            const previewSelect = document.createElement('select');
            previewSelect.className = 'form-control mr-2';
            previewSelect.style.fontFamily = optionFamilySelect.value;
            previewSelect.style.fontSize = optionFontSizeInput.value;
            previewSelect.style.fontWeight = optionBoldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            previewSelect.style.fontStyle = optionItalicButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            previewSelect.style.width = selectWidthInput.value + "%";
            tempoptions.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.innerText = option.value;
                previewSelect.appendChild(optionElement);
            });

            previewWrapper.appendChild(previewLabel);
            previewWrapper.appendChild(previewSelect);
            const previewContainer = document.getElementById('selectPreviewContainer');
            previewContainer.innerHTML = '';
            previewContainer.appendChild(previewWrapper);
        };
        tempoptions.forEach(async (option) => {
            await addOptionEditor(option.value, optionsContainer);
        });



        updatePreview();

        boldButton.onclick = () => {
            boldButton.classList.toggle('btn-primary');
            updatePreview();
        };

        italicButton.onclick = () => {
            italicButton.classList.toggle('btn-primary');
            updatePreview();
        };

        optionBoldButton.onclick = () => {
            optionBoldButton.classList.toggle('btn-primary');
            updatePreview();
        };

        optionItalicButton.onclick = () => {
            optionItalicButton.classList.toggle('btn-primary');
            updatePreview();
        };




        labelTextInput.addEventListener('input', updatePreview);
        labelPositionSelect.addEventListener('change', updatePreview);
        labelfamilyselect.addEventListener('change', updatePreview);
        labelFontSizeInput.addEventListener('input', updatePreview);
        optionFamilySelect.addEventListener('change', updatePreview);
        optionFontSizeInput.addEventListener('input', updatePreview);
        selectWidthInput.addEventListener('input', updatePreview);

        document.getElementById('selectAddOptionButton').onclick = async () => {
            const newOptionInput = document.getElementById('selectNewOptionInput');
            await addOption(newOptionInput.value);
            newOptionInput.value = '';
            updatePreview();
        };

        $('#editSelectModal').modal('show');

        const saveButton = document.getElementById('selectSaveButton');
        saveButton.onclick = async () => {
            const newLabel = selectfieldName.value + "_" + this.data.role;
            if (usedLabels.has(newLabel) && newLabel !== this.data.fieldName + "_" + this.data.role) {
                labelSelectError.innerText = "Dublicate Field Name";
                labelSelectError.classList.remove('d-none');
                return;
            }
            else {
                labelSelectError.classList.add('d-none');
            }

            if (selectfieldName.value === "") {
                labelSelectError.innerText = "Field Name can't be Empty";
                labelSelectError.classList.remove('d-none');
                return;
            }
            else {

                labelSelectError.classList.add('d-none');
            }

            if (this.data.mandatory) {
                this.labelElement.style.marginRight = "0px";
                this.asterisk.style.marginRight = "10px";
                this.asterisk.style.display = "unset";
            } else {

                this.labelElement.style.marginRight = "10px";
                this.asterisk.style.display = "none";
            }

            const newOptionInput = document.getElementById('selectNewOptionInput');
            if (newOptionInput.value.trim('') !== "") {
                await addOption(newOptionInput.value);

            }
            usedLabels.delete(this.data.fieldName + "_" + this.data.role);
            usedLabels.add(newLabel);
            this.data.options = JSON.parse(JSON.stringify(tempoptions));
            this.data.label = labelTextInput.value;
            this.data.fieldName = selectfieldName.value;
            this.data.labelPosition = labelPositionSelect.value;
            this.data.labelfamily = labelfamilyselect.value;
            this.data.labelSize = labelFontSizeInput.value;
            this.data.labelBold = boldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            this.data.labelItalic = italicButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            this.data.optionFamily = optionFamilySelect.value;
            this.data.optionSize = optionFontSizeInput.value;
            this.data.optionBold = optionBoldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            this.data.optionItalic = optionItalicButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            this.data.selectWidth = selectWidthInput.value;

            this.selectElement.innerHTML = '';
            this.data.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.innerText = option.value;
                this.selectElement.appendChild(optionElement);
            });

            this.applyLabelPosition();
            this.applyStyles();
            $('#editSelectModal').modal('hide');
        };
        const deletebutton = document.getElementById('deleteselectblock')
        deletebutton.onclick = () => {
            const index = this.api.blocks.getCurrentBlockIndex()
            this.api.blocks.delete(index)
            $('#editInputModal').modal('hide');

        };
    }


    applyStyles() {
        this.labelElement.style.fontFamily = this.data.labelfamily;
        this.labelElement.style.fontSize = this.data.labelSize;
        const textSizeValue = parseInt(this.data.labelSize, 10);
        this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;
        this.labelElement.style.fontWeight = this.data.labelBold;
        this.labelElement.style.fontStyle = this.data.labelItalic;
        this.labelElement.textContent = this.data.label;
        this.selectElement.style.fontFamily = this.data.optionFamily;
        this.selectElement.style.fontSize = this.data.optionSize;
        this.selectElement.style.fontWeight = this.data.optionBold;
        this.selectElement.style.fontStyle = this.data.optionItalic;
        this.selectElement.style.width = this.data.selectWidth + "%";
    }

    save() {
        const options = Array.from(this.selectElement.options).map(option => ({
            value: option.value,
            text: option.text
        }));
        return {
            label: this.labelElement.innerText,
            options,
            selected: this.selectElement.value,
            labelPosition: this.data.labelPosition,
            labelfamily: this.data.labelfamily,
            labelSize: this.data.labelSize,
            labelBold: this.data.labelBold,
            labelItalic: this.data.labelItalic,
            optionFamily: this.data.optionFamily,
            optionSize: this.data.optionSize,
            optionBold: this.data.optionBold,
            optionItalic: this.data.optionItalic,
            selectWidth: this.data.selectWidth,
            fieldName: this.data.fieldName,
            role: this.data.role,

            mandatory: this.data.mandatory
        };
    }


    destroy() {
        const labelToRemove = this.data.fieldName + "_" + this.data.role;


        if (usedLabels.has(labelToRemove)) {
            usedLabels.delete(labelToRemove);
        }
    }
    validate(savedData) {
        return true;
    }
}

class OnlyTextBlock {
    static get toolbox() {
        return {
            title: 'OnlyText',
            icon: '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg" fill="#000000"><circle cx="8.5" cy="7.5" r="6.5" fill="#000000"/></svg>',
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            value: '',
            inputwidth: '50',
            inputSize: '16px',
            inputplaceholder: 'Enter text',
            inputFontFamily: 'Arial',
            inputFontStyle: 'normal',
            inputFontWeight: 'normal',
            fieldName: 'FieldName',
            mandatory: false,
        };
        this.wrapper = null;
        this.inputElement = null;
        this.editButton = null;


    }

    render() {
        const selectElement = document.getElementById('ClientSelect');
        const selectedRole = selectElement.value;
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'd-flex align-items-center';
        this.wrapper.style.padding = "1em 0";
        this.data.role = this.data.role ? this.data.role : selectedRole

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'd-flex';
        inputWrapper.style.width = '100%';

        this.inputElement = document.createElement('input');
        this.inputElement.type = 'text';
        this.inputElement.className = 'form-control';
        this.inputElement.placeholder = this.data.inputplaceholder;
        this.inputElement.value = this.data.value;
        this.inputElement.style.width = this.data.inputwidth + "%";
        this.inputElement.style.fontSize = this.data.inputSize;
        this.inputElement.style.fontFamily = this.data.inputFontFamily;
        this.inputElement.style.fontStyle = this.data.inputFontStyle;
        this.inputElement.style.fontWeight = this.data.inputFontWeight;
        this.inputElement.style.lineHeight = '1.2';
        this.inputElement.setAttribute('role', this.data.role);

        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';

        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.backgroundColor = 'transparent';
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.transition = 'opacity 0.3s';
        this.editButton.style.zIndex = '100';
        this.editButton.style.outline = 'none';
        this.editButton.className = 'switchtab';
        this.editButton.onclick = () => this.openEditModal();

        inputWrapper.appendChild(this.inputElement);
        inputWrapper.appendChild(this.editButton);

        this.wrapper.appendChild(inputWrapper);
        this.wrapper.onmouseover = () => {
            this.editButton.classList.remove('switchtab')
            this.editButton.classList.add('openedit')
        };
        this.wrapper.onmouseout = () => {
            this.editButton.classList.remove('openedit')
            this.editButton.classList.add('switchtab')
        };

        usedLabels.add(this.data.fieldName + "_" + this.data.role);



        return this.wrapper;
    }

    save(blockContent) {
        return {
            value: this.inputElement.value,
            inputwidth: this.data.inputwidth,
            inputSize: this.data.inputSize,
            inputplaceholder: this.data.inputplaceholder,
            inputFontFamily: this.data.inputFontFamily,
            inputFontStyle: this.data.inputFontStyle,
            inputFontWeight: this.data.inputFontWeight,
            fieldName: this.data.fieldName,
            role: this.data.role,
            mandatory: this.data.mandatory
        };
    }


    // destroy() {
    //     const labelToRemove = this.data.fieldName;


    //     if (usedLabels.has(labelToRemove)) {
    //         usedLabels.delete(labelToRemove);
    //     }
    // }

    openEditModal() {
        const inputWidth = document.getElementById('inputWidthOnlyText');
        const inputFontSize = document.getElementById('inputFontSizeOnlyText');
        const inputPlaceholder = document.getElementById('inputPlaceholderOnlyText');
        const inputFontFamily = document.getElementById('inputFontFamilyOnlyText');
        const inputFontStyleBold = document.getElementById('inputFontStyleBoldOnlyText');
        const inputFontStyleItalic = document.getElementById('inputFontStyleItalicOnlyText');
        const inputFieldName = document.getElementById('inputFieldNameOnlyText');
        const labelTextError = document.getElementById('labelTextError')
        labelTextError.classList.add('d-none');
        const mandatoryCheckboxOnlytext = document.getElementById('mandatoryCheckboxOnlytext');
        mandatoryCheckboxOnlytext.checked = this.data.mandatory;
        mandatoryCheckboxOnlytext.addEventListener('change', () => {
            this.data.mandatory = mandatoryCheckboxOnlytext.checked;
            updatePreview();
        });

        const previewContainer = document.getElementById('previewContainerOnlyText');

        inputWidth.value = this.data.inputwidth;
        inputFontSize.value = this.data.inputSize;
        inputPlaceholder.value = this.data.inputplaceholder;
        inputFontFamily.value = this.data.inputFontFamily;
        inputFieldName.value = this.data.fieldName;
        inputFontStyleBold.classList.toggle("btn-primary", this.data.inputFontWeight === 'bold');
        inputFontStyleItalic.classList.toggle("btn-primary", this.data.inputFontStyle === 'italic');

        const updatePreview = () => {
            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'd-flex align-items-center';

            const previewInputElement = document.createElement('input');
            previewInputElement.type = 'text';
            previewInputElement.className = 'form-control';
            previewInputElement.placeholder = inputPlaceholder.value;
            previewInputElement.value = this.data.value;
            previewInputElement.style.width = inputWidth.value + "%";
            previewInputElement.style.fontSize = inputFontSize.value;
            previewInputElement.style.fontFamily = inputFontFamily.value;
            previewInputElement.style.fontStyle = inputFontStyleItalic.classList.contains("btn-primary") ? 'italic' : 'normal';
            previewInputElement.style.fontWeight = inputFontStyleBold.classList.contains("btn-primary") ? 'bold' : 'normal';
            previewInputElement.style.lineHeight = '1.2';

            const previewInputWrapper = document.createElement('div');
            previewInputWrapper.className = 'd-flex';
            previewInputWrapper.style.width = '100%';
            previewInputWrapper.appendChild(previewInputElement);

            previewWrapper.appendChild(previewInputWrapper);

            previewContainer.innerHTML = '';
            previewContainer.appendChild(previewWrapper);
        };

        updatePreview();

        document.querySelectorAll('#editOnlyTextModal input').forEach(input => {
            input.addEventListener('input', updatePreview);
        });

        inputFontStyleBold.onclick = () => {
            inputFontStyleBold.classList.toggle("btn-primary");
            updatePreview();
        };

        inputFontFamily.addEventListener("change", updatePreview)

        inputFontStyleItalic.onclick = () => {
            inputFontStyleItalic.classList.toggle("btn-primary");
            updatePreview();
        };

        $('#editOnlyTextModal').modal('show');

        const saveButton = document.getElementById('saveButtonOnlyText');
        saveButton.onclick = () => {
            const newLabel = inputFieldName.value + "_" + this.data.role;
            if (usedLabels.has(newLabel) && newLabel !== this.data.fieldName + "_" + this.data.role) {
                labelTextError.innerText = "Dublicate Field Name";
                labelTextError.classList.remove('d-none');
                return;
            }
            else {
                labelTextError.classList.add('d-none');
            }
            if (inputFieldName.value === "") {
                labelTextError.innerText = "Field Name can't be Empty";
                labelTextError.classList.remove('d-none');
                return;
            }
            else {
                labelTextError.classList.add('d-none');
            }


            usedLabels.delete(this.data.fieldName + "_" + this.data.role);
            usedLabels.add(newLabel);
            this.data.inputwidth = inputWidth.value;
            this.data.inputSize = inputFontSize.value;
            this.data.inputplaceholder = inputPlaceholder.value;
            this.data.inputFontFamily = inputFontFamily.value;
            this.data.inputFontStyle = inputFontStyleItalic.classList.contains("btn-primary") ? 'italic' : 'normal';
            this.data.inputFontWeight = inputFontStyleBold.classList.contains("btn-primary") ? 'bold' : 'normal';
            this.data.fieldName = inputFieldName.value;
            this.applyStyles();
            $('#editOnlyTextModal').modal('hide');
        };
        const deletebutton = document.getElementById('deleteonlytextblock')
        deletebutton.onclick = () => {
            // const index = this.api.blocks.getCurrentBlockIndex()
            // this.api.blocks.delete(index)
            this.destroy();
            $('#editInputModal').modal('hide');

        };
    }

    applyStyles() {
        this.inputElement.style.width = this.data.inputwidth + "%";
        this.inputElement.style.fontSize = this.data.inputSize;
        this.inputElement.placeholder = this.data.inputplaceholder;
        this.inputElement.style.fontFamily = this.data.inputFontFamily;
        this.inputElement.style.fontStyle = this.data.inputFontStyle;
        this.inputElement.style.fontWeight = this.data.inputFontWeight;
    }
}












class RadioBlock {
    static get toolbox() {
        return {
            title: 'Radio',
            icon: '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg" fill="#000000"><circle cx="8.5" cy="7.5" r="6.5" fill="#000000"/></svg>',
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            label: 'Label',
            options: [{ text: 'Option 1', selected: false }],
            labelFamily: 'Arial',
            optionFamily: 'Arial',
            labelBold: 'normal',
            labelItalic: 'normal',
            optionBold: 'normal',
            optionItalic: 'normal',
            labelFontSize: '16px',
            optionsFontSize: '14px',
            optionPosition: 'vertical',
            labelPosition: 'top',
            mandatory: false,
        };
        this.wrapper = null;
        this.labelElement = null;
        this.editButton = null;
        this.labelWrapper = null;

        this.asterisk = null;
        radiofieldname += 1;
    }

    render() {
        const selectElement = document.getElementById('ClientSelect');
        const selectedRole = selectElement.value;

        this.wrapper = document.createElement('div');
        this.wrapper.className = 'd-flex';
        this.wrapper.style.padding = "1em 0";
        this.data.role = this.data.role ? this.data.role : selectedRole;

        this.labelWrapper = document.createElement('div');
        this.labelWrapper.className = 'd-flex align-items-center';
        this.labelWrapper.style.width = 'auto';

        const labeldiv = document.createElement('div')
        labeldiv.className = 'd-flex';
        labeldiv.style.gap = '0px';
        labeldiv.style.padding = '0px';
        labeldiv.style.margin = '0px';

        this.labelElement = document.createElement('label');
        this.labelElement.textContent = this.data.label;
        this.labelElement.style.marginRight = "10px";
        this.labelElement.style.fontSize = this.data.labelFontSize;
        this.labelElement.style.marginBottom = 'auto';
        this.labelElement.style.marginTop = 'auto';

        this.asterisk = document.createElement('span');
        this.asterisk.textContent = '*';
        this.asterisk.style.color = 'red';
        this.asterisk.style.fontSize = this.data.labelFontSize;
        const textSizeValue = parseInt(this.data.labelFontSize, 10);
        this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;

        this.applyLabelStyles();
        this.applyOptionPosition();

        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';

        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.backgroundColor = 'transparent';
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.transition = 'opacity 0.3s';
        this.editButton.style.zIndex = '100'; // Ensure it's on top
        this.editButton.style.outline = 'none';
        this.editButton.className = 'switchtab';
        this.editButton.onclick = () => this.openEditModal();

        labeldiv.appendChild(this.labelElement);
        labeldiv.appendChild(this.asterisk);
        // this.wrapper.appendChild(this.labelInput);

        this.labelWrapper.appendChild(labeldiv);
        this.labelWrapper.appendChild(this.editButton);
        this.wrapper.append(this.labelWrapper);



        if (this.data.mandatory) {
            this.labelElement.style.marginRight = "0px";
            this.asterisk.style.marginRight = "10px";
            this.asterisk.style.display = "unset";
        } else {
            this.labelElement.style.marginRight = "10px";
            this.asterisk.style.display = "none";
        }

        const radiodiv = document.createElement('div');
        radiodiv.className = 'm-0 p-0';


        this.data.options.forEach((option, index) => {
            const radioWrapper = document.createElement('div');
            radioWrapper.className = 'form-check d-flex align-items-center radio-option';

            const radioInput = document.createElement('input');
            radioInput.type = 'radio';
            radioInput.className = 'form-check-input mt-0 ';
            radioInput.name = this.data.fieldName;
            radioInput.setAttribute('role', this.data.role);

            if (option.selected) {
                radioInput.checked = true;
            }


            radioInput.addEventListener('change', () => {

                this.data.options.forEach((opt, i) => {
                    opt.selected = (i === index);
                });
            });


            const radioLabel = document.createElement('label');
            radioLabel.className = 'form-check-label';
            radioLabel.textContent = option.text;
            radioLabel.style.fontSize = this.data.optionsFontSize;
            this.applyOptionStyles(radioLabel);

            radioWrapper.appendChild(radioInput);
            radioWrapper.appendChild(radioLabel);


            if (this.data.optionPosition === 'vertical' && this.data.labelPosition === 'left') {
                radiodiv.appendChild(radioWrapper);
            }
            else {
                this.wrapper.appendChild(radioWrapper);
            }
        });

        if (this.data.optionPosition === 'vertical' && this.data.labelPosition === 'left') {
            this.wrapper.appendChild(radiodiv);
        }




        this.wrapper.onmouseover = () => {
            this.editButton.classList.remove('switchtab')
            this.editButton.classList.add('openedit')
        };
        this.wrapper.onmouseout = () => {
            this.editButton.classList.remove('openedit')
            this.editButton.classList.add('switchtab')
        };

        usedLabels.add(this.data.fieldName + "_" + this.data.role);

        return this.wrapper;
    }

    save(blockContent) {
        const height = this.wrapper?.offsetHeight || 0;
        return {
            label: this.labelElement.textContent,
            options: this.data.options,
            labelFamily: this.data.labelFamily,
            optionFamily: this.data.optionFamily,
            labelBold: this.data.labelBold,
            labelItalic: this.data.labelItalic,
            optionBold: this.data.optionBold,
            optionItalic: this.data.optionItalic,
            labelFontSize: this.data.labelFontSize,
            optionsFontSize: this.data.optionsFontSize,
            optionPosition: this.data.optionPosition,
            labelPosition: this.data.labelPosition,
            blockheight: height,
            fieldName: this.data.fieldName,
            role: this.data.role,

            mandatory: this.data.mandatory
        };
    }


    destroy() {
        const labelToRemove = this.data.fieldName + "_" + this.data.role;


        if (usedLabels.has(labelToRemove)) {
            usedLabels.delete(labelToRemove);
        }
    }

    applyLabelStyles() {
        this.labelElement.style.fontFamily = this.data.labelFamily;
        this.labelElement.style.fontWeight = this.data.labelBold;
        this.labelElement.style.fontStyle = this.data.labelItalic;
    }

    applyOptionStyles(optionElement) {
        optionElement.style.fontFamily = this.data.optionFamily;
        optionElement.style.fontWeight = this.data.optionBold;
        optionElement.style.fontStyle = this.data.optionItalic;
    }
    applyOptionPosition() {
        if (this.data.optionPosition === 'vertical' && this.data.labelPosition === 'left') {
            this.wrapper.classList.remove('flex-column');
            this.labelWrapper.style.width = 'auto';
            this.labelWrapper.classList.remove('align-items-center');
            this.labelElement.style.marginTop = 'unset';

        }
        else {
            this.labelWrapper.classList.add('align-items-center');
            this.labelElement.style.marginTop = 'auto';
            if (this.data.optionPosition === 'vertical') {
                this.wrapper.classList.add('flex-column');
                this.wrapper.classList.remove('radio-options');

            }
            else {
                this.wrapper.classList.remove('flex-column');
                this.wrapper.classList.add('radio-options');
            }

            if (this.data.labelPosition === 'top') {
                this.labelWrapper.style.width = '100%';
            }
            else {
                this.labelWrapper.style.width = 'auto';
            }
        }


    }

    openEditModal() {
        const radioLabelInput = document.getElementById('radioLabelInput');
        const radiofieldName = document.getElementById('radiofieldName');
        const radioOptions = document.getElementById('radioOptions');
        const radioPreview = document.getElementById('radioPreview');
        const radiolabelFamilySelect = document.getElementById('radiolabelFamilySelect');
        const radiooptionFamilySelect = document.getElementById('radiooptionFamilySelect');
        const radioboldLabelButton = document.getElementById('radioboldLabelButton');
        const radioitalicLabelButton = document.getElementById('radioitalicLabelButton');
        const radioboldOptionButton = document.getElementById('radioboldOptionButton');
        const radioitalicOptionButton = document.getElementById('radioitalicOptionButton');
        const radiolabelFontSizeInput = document.getElementById('radiolabelFontSizeInput');
        const radiooptionsFontSizeInput = document.getElementById('radiooptionsFontSizeInput');
        const labelRadioError = document.getElementById('labelRadioError');
        const radioPositionSelect = document.getElementById('radioPositionSelect');
        const radioLabelPositionSelect = document.getElementById('radioLabelPositionSelect')
        labelRadioError.classList.add('d-none');
        const mandatoryCheckboxRadio = document.getElementById('mandatoryCheckboxRadio');
        mandatoryCheckboxRadio.checked = this.data.mandatory;
        mandatoryCheckboxRadio.addEventListener('change', () => {
            this.data.mandatory = mandatoryCheckboxRadio.checked;
            updatePreview();
        });

        radiolabelFontSizeInput.value = this.data.labelFontSize;
        radiooptionsFontSizeInput.value = this.data.optionsFontSize;
        radioLabelInput.value = this.data.label;
        radiofieldName.value = this.data.fieldName;
        radiolabelFamilySelect.value = this.data.labelFamily;
        radiooptionFamilySelect.value = this.data.optionFamily;
        radioboldLabelButton.classList.toggle('btn-primary', this.data.labelBold === 'bold');
        radioitalicLabelButton.classList.toggle('btn-primary', this.data.labelItalic === 'italic');
        radioboldOptionButton.classList.toggle('btn-primary', this.data.optionBold === 'bold');
        radioitalicOptionButton.classList.toggle('btn-primary', this.data.optionItalic === 'italic');
        radioLabelInput.value = this.data.label;
        radiolabelFontSizeInput.value = this.data.labelFontSize;
        radioPositionSelect.value = this.data.optionPosition;
        radioLabelPositionSelect.value = this.data.labelPosition;
        const tempoptions = JSON.parse(JSON.stringify(this.data.options));


        radioOptions.innerHTML = '';
        tempoptions.forEach((option, index) => {
            const optionWrapper = document.createElement('div');
            optionWrapper.className = 'input-group mb-2';

            const optionInput = document.createElement('input');
            optionInput.type = 'text';
            optionInput.className = 'form-control mr-2';
            optionInput.placeholder = 'Option text';
            optionInput.value = option.text;

            const removeButton = document.createElement('button');
            removeButton.className = 'btn btn-danger';
            removeButton.innerText = 'Remove';
            removeButton.onclick = () => {
                tempoptions.splice(index, 1);
                optionWrapper.remove();
                updatePreview();
            };

            optionWrapper.appendChild(optionInput);
            optionWrapper.appendChild(removeButton);
            radioOptions.appendChild(optionWrapper);

            optionInput.addEventListener('input', (event) => {
                tempoptions[index].text = event.target.value;
                updatePreview();
            });
        });

        const addRadioOption = document.getElementById('addRadioOption');
        addRadioOption.onclick = () => {
            const newOption = { text: `Option ${tempoptions.length + 1}`, selected: false }
            tempoptions.push(newOption);
            const optionWrapper = document.createElement('div');
            optionWrapper.className = 'input-group mb-2';

            const optionInput = document.createElement('input');
            optionInput.type = 'text';
            optionInput.className = 'form-control mr-2';
            optionInput.placeholder = 'Option text';
            optionInput.value = newOption.text;

            const removeButton = document.createElement('button');
            removeButton.className = 'btn btn-danger';
            removeButton.innerText = 'Remove';
            removeButton.onclick = () => {
                tempoptions.splice(tempoptions.indexOf(newOption), 1);
                optionWrapper.remove();
                updatePreview();
            };

            optionWrapper.appendChild(optionInput);
            optionWrapper.appendChild(removeButton);
            radioOptions.appendChild(optionWrapper);

            optionInput.addEventListener('input', (event) => {
                newOption.text = event.target.value;
                updatePreview();
            });


            updatePreview();
        };

        const updatePreview = () => {
            radioPreview.innerHTML = '';
            const previewLabel = document.createElement('label');
            previewLabel.textContent = radioLabelInput.value;
            previewLabel.style.fontFamily = radiolabelFamilySelect.value;
            previewLabel.style.fontWeight = radioboldLabelButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            previewLabel.style.fontStyle = radioitalicLabelButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            previewLabel.style.fontSize = radiolabelFontSizeInput.value;
            previewLabel.style.marginBottom = '0.25rem'
            radioPreview.className = 'd-flex';
            radioPreview.appendChild(previewLabel);

            if (this.data.mandatory) {
                previewLabel.innerHTML += ' <span style="color: red;">*</span>';
            }
            const radiodiv = document.createElement('div');
            radiodiv.className = 'm-0 p-0';


            tempoptions.forEach(option => {
                const radioWrapper = document.createElement('div');
                radioWrapper.className = 'form-check d-flex align-items-center radio-option';

                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.className = 'form-check-input mt-0';
                radioInput.name = radiofieldName.value;
                radioInput.disabled = true;

                const radioLabel = document.createElement('label');
                radioLabel.className = 'form-check-label';
                radioLabel.textContent = option.text;
                radioLabel.style.fontFamily = radiooptionFamilySelect.value;
                radioLabel.style.fontWeight = radioboldOptionButton.classList.contains('btn-primary') ? 'bold' : 'normal';
                radioLabel.style.fontStyle = radioitalicOptionButton.classList.contains('btn-primary') ? 'italic' : 'normal';
                radioLabel.style.fontSize = radiooptionsFontSizeInput.value;

                radioWrapper.appendChild(radioInput);
                radioWrapper.appendChild(radioLabel);

                if (radioPositionSelect.value === 'vertical' && radioLabelPositionSelect.value === 'left') {

                    radiodiv.appendChild(radioWrapper);
                }
                else {
                    radioPreview.appendChild(radioWrapper);

                }

            });

            if (radioPositionSelect.value === 'vertical' && radioLabelPositionSelect.value === 'left') {
                radioPreview.appendChild(radiodiv);
            }

            if (radioPositionSelect.value === 'vertical' && radioLabelPositionSelect.value === 'left') {
                radioPreview.classList.remove('flex-column');
                previewLabel.style.width = 'auto';
                previewLabel.style.marginRight = "5px";


            }

            else {

                if (radioPositionSelect.value === 'vertical') {
                    radioPreview.classList.add('flex-column');
                    radioPreview.classList.remove('radio-options');
                }
                else {
                    radioPreview.classList.remove('flex-column');
                    radioPreview.classList.add('radio-options');
                }
                if (radioLabelPositionSelect.value === 'top') {
                    previewLabel.style.width = '100%';
                }
                else {
                    previewLabel.style.width = 'auto';
                }

            }



        };

        updatePreview();

        radioboldLabelButton.onclick = () => {
            radioboldLabelButton.classList.toggle('btn-primary');
            updatePreview();
        };

        radioitalicLabelButton.onclick = () => {
            radioitalicLabelButton.classList.toggle('btn-primary');
            updatePreview();
        };

        radioboldOptionButton.onclick = () => {
            radioboldOptionButton.classList.toggle('btn-primary');
            updatePreview();
        };

        radioitalicOptionButton.onclick = () => {
            radioitalicOptionButton.classList.toggle('btn-primary');
            updatePreview();
        };

        radioPositionSelect.addEventListener('change', updatePreview);

        radioLabelPositionSelect.addEventListener('change', updatePreview);

        radiolabelFamilySelect.onchange = updatePreview;
        radiooptionFamilySelect.onchange = updatePreview;
        document.querySelectorAll('#radioModal input').forEach(input => {
            input.addEventListener('input', updatePreview);
        });

        const saveButton = document.getElementById('saveRadioBlock');
        saveButton.onclick = () => {
            const newLabel = radiofieldName.value + "_" + this.data.role;
            if (usedLabels.has(newLabel) && newLabel !== this.data.fieldName + "_" + this.data.role) {
                labelRadioError.innerText = "Dublicate Field Name";
                labelRadioError.classList.remove('d-none');
                return;
            }
            else {
                labelRadioError.classList.add('d-none');
            }

            if (radiofieldName.value === "") {
                labelRadioError.innerText = "Field Name can't be Empty";
                labelRadioError.classList.remove('d-none');
                return;
            }
            else {
                labelRadioError.classList.add('d-none');
            }

            if (this.data.mandatory) {
                this.labelElement.style.marginRight = "0px";
                this.asterisk.style.marginRight = "10px";
                this.asterisk.style.display = "unset";
            } else {
                this.labelElement.style.marginRight = "10px";
                this.asterisk.style.display = "none";
            }


            usedLabels.delete(this.data.fieldName + "_" + this.data.role);
            usedLabels.add(newLabel);
            this.data.label = radioLabelInput.value;
            this.data.fieldName = radiofieldName.value;
            this.data.labelFamily = radiolabelFamilySelect.value;
            this.data.optionFamily = radiooptionFamilySelect.value;
            this.data.labelFontSize = radiolabelFontSizeInput.value;
            this.data.optionsFontSize = radiooptionsFontSizeInput.value;
            this.labelElement.style.fontSize = this.data.labelFontSize;
            const textSizeValue = parseInt(this.data.labelFontSize, 10);
            this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;
            this.data.labelBold = radioboldLabelButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            this.data.labelItalic = radioitalicLabelButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            this.data.optionBold = radioboldOptionButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            this.data.optionItalic = radioitalicOptionButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            this.data.options = JSON.parse(JSON.stringify(tempoptions));
            this.data.optionPosition = radioPositionSelect.value;
            this.data.labelPosition = radioLabelPositionSelect.value;

            this.labelElement.textContent = this.data.label;
            this.applyLabelStyles();
            this.applyOptionPosition();

            while (this.wrapper.children.length > 1) {
                this.wrapper.removeChild(this.wrapper.lastChild);
            }


            const radiodiv = document.createElement('div');
            radiodiv.className = 'm-0 p-0';


            this.data.options.forEach(option => {
                const radioWrapper = document.createElement('div');
                radioWrapper.className = 'form-check d-flex align-items-center radio-option';

                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.className = 'form-check-input mt-0 ';
                radioInput.name = this.data.fieldName;
                radioInput.setAttribute('role', this.data.role);

                radioInput.addEventListener('change', () => {

                    this.data.options.forEach((opt, i) => {
                        opt.selected = (i === index);
                    });
                });

                const radioLabel = document.createElement('label');
                radioLabel.className = 'form-check-label';
                radioLabel.textContent = option.text;
                radioLabel.style.fontSize = this.data.optionsFontSize;
                this.applyOptionStyles(radioLabel);

                radioWrapper.appendChild(radioInput);
                radioWrapper.appendChild(radioLabel);

                if (this.data.optionPosition === 'vertical' && this.data.labelPosition === 'left') {
                    radiodiv.appendChild(radioWrapper);
                }
                else {
                    this.wrapper.appendChild(radioWrapper);
                }
            });

            if (this.data.optionPosition === 'vertical' && this.data.labelPosition === 'left') {
                this.wrapper.appendChild(radiodiv);
            }


            $('#radioModal').modal('hide');
        };

        const deletebutton = document.getElementById('deleteradioblock')
        deletebutton.onclick = () => {
            const index = this.api.blocks.getCurrentBlockIndex()
            this.api.blocks.delete(index)
            $('#editInputModal').modal('hide');

        };

        $('#radioModal').modal('show');
    }
}



class InputBlock {
    static get toolbox() {
        return {
            title: 'Input',
            icon: '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg" fill="#000000"><circle cx="8.5" cy="7.5" r="6.5" fill="#000000"/></svg>',
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            labelTextInput: 'Label',
            value: '',
            labelPosition: 'left',
            inputwidth: '50',
            inputSize: '16px',
            inputplaceholder: 'Enter text',
            textwidth: '50',
            textSize: '16px',
            textplaceholder: 'Enter text',
            fieldName: 'Label',
            mandatory: false,

        };
        this.wrapper = null;
        this.labelInput = null;
        this.inputElement = null;
        this.editButton = null;

        this.asterisk = null;
        if (this.data.fieldName !== 'Label') {
            usedLabels.add(this.data.fieldName)
        }

    }

    render() {
        const selectElement = document.getElementById('ClientSelect');
        const selectedRole = selectElement.value;

        this.wrapper = document.createElement('div');
        this.wrapper.className = 'd-flex align-items-center';
        this.wrapper.style.position = 'relative';
        this.wrapper.style.padding = "1em 0";
        this.data.role = this.data.role ? this.data.role : selectedRole

        const labeldiv = document.createElement('div')
        labeldiv.className = 'd-flex align-items-center';
        labeldiv.style.gap = '0px';
        labeldiv.style.padding = '0px';
        labeldiv.style.margin = '0px';

        this.labelInput = document.createElement('label');
        this.labelInput.className = 'input-block-label';
        this.labelInput.textContent = this.data.labelTextInput;
        this.labelInput.style.marginRight = "10px";
        this.labelInput.style.whiteSpace = 'pre';
        this.labelInput.style.fontSize = this.data.textSize;
        this.labelInput.style.flexGrow = '0';
        this.labelInput.style.padding = '0.4em 0';
        this.labelInput.style.lineHeight = '1.2';

        this.asterisk = document.createElement('span');
        this.asterisk.textContent = '*';
        this.asterisk.style.color = 'red';
        this.asterisk.style.fontSize = this.data.textSize;
        const textSizeValue = parseInt(this.data.textSize, 10);
        this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;


        // this.labelInput.appendChild(asterisk);



        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'd-flex';
        inputWrapper.style.width = '100%';

        this.inputElement = document.createElement('input');
        this.inputElement.type = 'text';
        this.inputElement.className = 'form-control mr-2';
        this.inputElement.placeholder = this.data.inputplaceholder;
        this.inputElement.value = this.data.value;
        this.inputElement.style.width = this.data.inputwidth + '%';
        this.inputElement.style.fontSize = this.data.inputSize;
        this.inputElement.style.lineHeight = '1.2';
        this.inputElement.setAttribute('role', this.data.role);

        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';

        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.backgroundColor = 'transparent';
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.transition = 'opacity 0.3s';
        this.editButton.style.zIndex = '100';
        this.editButton.style.outline = 'none';
        this.editButton.className = 'switchtab';

        this.editButton.onclick = () => this.openEditModal();

        inputWrapper.appendChild(this.inputElement);
        inputWrapper.appendChild(this.editButton);

        labeldiv.appendChild(this.labelInput);
        labeldiv.appendChild(this.asterisk);
        // this.wrapper.appendChild(this.labelInput);

        this.wrapper.appendChild(labeldiv);
        this.wrapper.appendChild(inputWrapper);
        this.applyLabelPosition();
        if (this.data.mandatory) {
            this.labelInput.style.marginRight = "0px";
            this.asterisk.style.marginRight = "10px"
        } else {
            this.asterisk.style.display = "none";
        }
        this.applyStyles();

        // Show the edit button on hover
        this.wrapper.onmouseover = () => {
            this.editButton.classList.remove('switchtab')
            this.editButton.classList.add('openedit')
        };
        this.wrapper.onmouseout = () => {
            this.editButton.classList.remove('openedit')
            this.editButton.classList.add('switchtab')
        };

        usedLabels.add(this.data.fieldName + "_" + this.data.role);



        return this.wrapper;
    }

    save(blockContent) {
        return {
            label: this.labelInput.value,
            value: this.inputElement.value,
            labelPosition: this.data.labelPosition,
            labelfamily: this.data.labelfamily,
            inputfamily: this.data.inputfamily,
            labelTextInput: this.data.labelTextInput,
            inputwidth: this.data.inputwidth,
            inputSize: this.data.inputSize,
            inputplaceholder: this.data.inputplaceholder,
            textwidth: this.data.textwidth,
            textSize: this.data.textSize,
            textplaceholder: this.data.textplaceholder,
            labelBold: this.data.labelBold,
            labelItalic: this.data.labelItalic,
            fieldName: this.data.fieldName,
            role: this.data.role,
            mandatory: this.data.mandatory,


        };
    }
    destroy() {
        const labelToRemove = this.data.fieldName + "_" + this.data.role;


        if (usedLabels.has(labelToRemove)) {
            usedLabels.delete(labelToRemove);
        }
    }

    openEditModal() {
        const labelPositionSelect = document.getElementById('labelPositionSelect');
        const labelfamilyselect = document.getElementById('labelfamilyselect');
        const inputfamilyselect = document.getElementById('inputfamilyselect');
        const boldButton = document.getElementById('inputboldButton');
        const italicButton = document.getElementById('inputitalicButton');
        const labelInputError = document.getElementById('labelInputError')
        labelInputError.classList.add('d-none');
        // if (this.data.labelBold !== 'bold') {
        //     if (boldButton.classList.contains('btn-primary')) {
        //         boldButton.classList.remove('btn-primary');
        //     }
        // }
        // if (this.data.labelItalic !== 'italic') {
        //     if (italicButton.classList.contains('btn-primary')) {
        //         italicButton.classList.remove('btn-primary');
        //     }
        // }
        boldButton.classList.toggle('btn-primary', this.data.labelBold === 'bold');
        italicButton.classList.toggle('btn-primary', this.data.labelItalic === 'bold');

        const labelTextInput = document.getElementById('labelTextInput');
        const labelfieldName = document.getElementById('labelfieldName');
        const inputWidth = document.getElementById('inputWidth');
        const inputFontSize = document.getElementById('inputFontSize');
        const inputPlaceholder = document.getElementById('inputPlaceholder');

        const textWidth = document.getElementById('textWidth');
        const textSize = document.getElementById('textFontSize');
        const textPlaceholder = document.getElementById('textPlaceholder');

        const previewContainer = document.getElementById('previewContainer');
        const mandatoryCheckbox = document.getElementById('mandatoryCheckbox');
        mandatoryCheckbox.checked = this.data.mandatory;
        mandatoryCheckbox.addEventListener('change', () => {
            this.data.mandatory = mandatoryCheckbox.checked;
            updatePreview();
        });

        labelPositionSelect.value = this.data.labelPosition;
        labelfamilyselect.value = this.data.labelfamily;
        inputfamilyselect.value = this.data.inputfamily;

        labelTextInput.textContent = this.data.labelTextInput;
        labelfieldName.value = this.data.fieldName;
        inputWidth.value = this.data.inputwidth;
        labelTextInput.value = this.data.labelTextInput;
        inputFontSize.value = this.data.inputSize;
        inputPlaceholder.value = this.data.inputplaceholder;

        textWidth.value = this.data.textwidth;
        textSize.value = this.data.textSize;
        textPlaceholder.value = this.data.textplaceholder;

        const updatePreview = () => {
            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'd-flex align-items-center';

            const previewLabelInput = document.createElement('label');
            previewLabelInput.className = 'input-block-label';
            previewLabelInput.placeholder = textPlaceholder.value;
            previewLabelInput.textContent = labelTextInput.value;
            previewLabelInput.style.fontSize = textSize.value;
            previewLabelInput.style.fontWeight = boldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            previewLabelInput.style.fontStyle = italicButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            previewLabelInput.style.width = "auto";
            previewLabelInput.style.marginRight = "5px";
            previewLabelInput.style.whiteSpace = 'pre';
            previewLabelInput.style.padding = '0.4em 0px';
            previewLabelInput.style.lineHeight = '1.2';
            previewLabelInput.style.fontFamily = labelfamilyselect.value;

            if (this.data.mandatory) {
                previewLabelInput.innerHTML += ' <span style="color: red;">*</span>';
            }

            const previewInputElement = document.createElement('input');
            previewInputElement.type = 'text';
            previewInputElement.className = 'form-control mr-2';
            previewInputElement.placeholder = inputPlaceholder.value;
            previewInputElement.value = this.data.value;
            previewInputElement.style.width = inputWidth.value + "%";
            previewInputElement.style.fontSize = inputFontSize.value;
            previewInputElement.style.fontFamily = inputfamilyselect.value;
            previewInputElement.style.lineHeight = '1.2';

            previewWrapper.appendChild(previewLabelInput);

            const previewInputWrapper = document.createElement('div');
            previewInputWrapper.className = 'd-flex';
            previewInputWrapper.style.width = '100%';
            previewInputWrapper.appendChild(previewInputElement);

            previewWrapper.appendChild(previewInputWrapper);

            if (labelPositionSelect.value === 'top') {
                previewWrapper.classList.add('flex-column');
                previewWrapper.classList.remove('align-items-center');
                previewLabelInput.style.marginBottom = '0.4em';
            } else {
                previewWrapper.classList.remove('flex-column');
            }


            previewContainer.innerHTML = '';
            previewContainer.appendChild(previewWrapper);
        };

        updatePreview();

        boldButton.onclick = () => {
            boldButton.classList.toggle('btn-primary');
            updatePreview();
        };

        italicButton.onclick = () => {
            italicButton.classList.toggle('btn-primary');
            updatePreview();
        };

        labelPositionSelect.addEventListener('change', updatePreview);
        labelfamilyselect.addEventListener("change", updatePreview);
        inputfamilyselect.addEventListener("change", updatePreview);

        document.querySelectorAll('#editInputModal input').forEach(input => {
            input.addEventListener('input', updatePreview);
        });

        $('#editInputModal').modal('show');

        const saveButton = document.getElementById('saveLabelPositionButton');
        saveButton.onclick = () => {
            const newLabel = labelfieldName.value + "_" + this.data.role;
            if (usedLabels.has(newLabel) && newLabel !== this.data.fieldName + "_" + this.data.role) {
                labelInputError.innerText = "Dublicate Field Name";
                labelInputError.classList.remove('d-none');
                return;
            }
            else {
                labelInputError.classList.add('d-none');
            }

            if (labelfieldName.value === "") {
                labelInputError.innerText = "Field Name can't be Empty";
                labelInputError.classList.remove('d-none');
                return;
            }
            else {
                labelInputError.classList.add('d-none');
            }

            if (this.data.mandatory) {
                this.labelInput.style.marginRight = "0px";
                this.asterisk.style.marginRight = "10px";
                this.asterisk.style.display = "unset";
            } else {

                this.labelInput.style.marginRight = "10px";
                this.asterisk.style.display = "none";
            }




            usedLabels.delete(this.data.fieldName + "_" + this.data.role);
            usedLabels.add(newLabel);
            this.data.labelPosition = labelPositionSelect.value;
            this.data.labelfamily = labelfamilyselect.value;
            this.data.inputfamily = inputfamilyselect.value;
            this.data.labelTextInput = labelTextInput.value;
            this.data.fieldName = labelfieldName.value;
            this.data.inputwidth = inputWidth.value;
            this.data.inputSize = inputFontSize.value;
            this.data.inputplaceholder = inputPlaceholder.value;
            this.data.textwidth = textWidth.value;
            this.data.textSize = textSize.value;
            this.data.textplaceholder = textPlaceholder.value;
            this.data.labelBold = boldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            this.data.labelItalic = italicButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            this.applyLabelPosition();
            this.applyStyles();
            $('#editInputModal').modal('hide');
        };
        const deletebutton = document.getElementById('deleteinputblock')
        deletebutton.onclick = () => {
            const index = this.api.blocks.getCurrentBlockIndex()
            this.api.blocks.delete(index)
            $('#editInputModal').modal('hide');

        };
    }

    applyLabelPosition() {
        if (this.data.labelPosition === 'top') {
            this.wrapper.classList.add('flex-column');
            this.wrapper.classList.remove('align-items-center');
            this.labelInput.style.padding = "0.4em 0";
            this.labelInput.style.marginBottom = '0.4em';
        } else {
            this.wrapper.classList.remove('flex-column');
            this.wrapper.classList.add('align-items-center');
        }
    }

    applyStyles() {
        this.inputElement.style.width = this.data.inputwidth + '%';
        this.inputElement.style.fontSize = this.data.inputSize;
        this.inputElement.style.fontFamily = this.data.inputfamily;
        this.inputElement.placeholder = this.data.inputplaceholder;
        this.labelInput.style.fontSize = this.data.textSize;
        const textSizeValue = parseInt(this.data.textSize, 10);
        this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;
        this.labelInput.style.fontFamily = this.data.labelfamily;
        this.labelInput.textContent = this.data.labelTextInput;
        this.labelInput.style.fontWeight = this.data.labelBold;
        this.labelInput.style.fontStyle = this.data.labelItalic;
    }
}



class CheckBoxBlock {
    static get toolbox() {
        return {
            title: 'Checkbox',
            icon: '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg" fill="#000000"><rect x="1" y="1" width="14" height="14" stroke="#000000" fill="none"/><path d="M4 7l2 2 4-4" stroke="#000000" fill="none"/></svg>',
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            label: 'Label',
            options: [{ text: 'Option 1', selected: false }],
            labelFamily: 'Arial',
            optionFamily: 'Arial',
            labelBold: 'normal',
            labelItalic: 'normal',
            optionBold: 'normal',
            optionItalic: 'normal',
            labelFontSize: '16px',
            optionsFontSize: '14px',
            optionPosition: 'vertical',
            labelPosition: 'top',
            mandatory: false,
        };
        this.wrapper = null;
        this.labelElement = null;
        this.editButton = null;
        this.labelWrapper = null;

    }

    render() {
        const selectElement = document.getElementById('ClientSelect');
        const selectedRole = selectElement.value;

        this.wrapper = document.createElement('div');
        this.wrapper.className = 'd-flex';
        this.wrapper.style.padding = "1em 0";
        this.data.role = this.data.role ? this.data.role : selectedRole;

        this.labelWrapper = document.createElement('div');
        this.labelWrapper.className = 'd-flex align-items-center';
        this.labelWrapper.style.width = 'auto';

        const labeldiv = document.createElement('div')
        labeldiv.className = 'd-flex';
        labeldiv.style.gap = '0px';
        labeldiv.style.padding = '0px';
        labeldiv.style.margin = '0px';

        this.labelElement = document.createElement('label');
        this.labelElement.textContent = this.data.label;
        this.labelElement.style.marginRight = "10px";
        this.labelElement.style.fontSize = this.data.labelFontSize;
        this.labelElement.style.marginBottom = '0.25rem';

        this.asterisk = document.createElement('span');
        this.asterisk.textContent = '*';
        this.asterisk.style.color = 'red';
        this.asterisk.style.fontSize = this.data.labelFontSize;
        const textSizeValue = parseInt(this.data.labelFontSize, 10);
        this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;

        this.applyLabelStyles();
        this.applyOptionPosition();
        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';

        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.backgroundColor = 'transparent'; // Transparent background
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.transition = 'opacity 0.3s';
        this.editButton.style.zIndex = '100'; // Ensure it's on top
        this.editButton.style.outline = 'none';
        this.editButton.className = 'switchtab';
        this.editButton.onclick = () => this.openEditModal();

        labeldiv.appendChild(this.labelElement);
        labeldiv.appendChild(this.asterisk);
        // this.wrapper.appendChild(this.labelInput);

        this.labelWrapper.appendChild(labeldiv);
        this.labelWrapper.appendChild(this.editButton);
        this.wrapper.append(this.labelWrapper);



        if (this.data.mandatory) {
            this.labelElement.style.marginRight = "0px";
            this.asterisk.style.marginRight = "10px";
            this.asterisk.style.display = "unset";
        } else {
            this.labelElement.style.marginRight = "10px";
            this.asterisk.style.display = "none";
        }

        const radiodiv = document.createElement('div');
        radiodiv.className = 'm-0 p-0';

        this.data.options.forEach((option, index) => {
            const checkboxWrapper = document.createElement('div');
            checkboxWrapper.className = 'form-check d-flex align-items-center radio-option';

            const checkboxInput = document.createElement('input');
            checkboxInput.type = 'checkbox';
            checkboxInput.className = 'form-check-input mt-0';
            checkboxInput.name = 'checkbox-group';
            checkboxInput.setAttribute('role', this.data.role);
            if (option.selected) {
                checkboxInput.checked = true;
            }


            checkboxInput.addEventListener('change', () => {

                this.data.options.forEach((opt, i) => {
                    opt.selected = (i === index);
                });
            });



            const checkboxLabel = document.createElement('label');
            checkboxLabel.className = 'form-check-label';
            checkboxLabel.textContent = option.text;
            checkboxLabel.style.fontSize = this.data.optionsFontSize;
            this.applyOptionStyles(checkboxLabel);

            checkboxWrapper.appendChild(checkboxInput);
            checkboxWrapper.appendChild(checkboxLabel);

            if (this.data.optionPosition === 'vertical' && this.data.labelPosition === 'left') {
                radiodiv.appendChild(checkboxWrapper);
            }
            else {
                this.wrapper.appendChild(checkboxWrapper);
            }
        });

        if (this.data.optionPosition === 'vertical' && this.data.labelPosition === 'left') {
            this.wrapper.appendChild(radiodiv);
        }

        this.wrapper.onmouseover = () => {
            this.editButton.classList.remove('switchtab')
            this.editButton.classList.add('openedit')
        };
        this.wrapper.onmouseout = () => {
            this.editButton.classList.remove('openedit')
            this.editButton.classList.add('switchtab')
        };

        usedLabels.add(this.data.fieldName + "_" + this.data.role);

        return this.wrapper;
    }

    save(blockContent) {
        const height = this.wrapper?.offsetHeight || 0;
        return {
            label: this.labelElement.textContent,
            options: this.data.options,
            labelFamily: this.data.labelFamily,
            optionFamily: this.data.optionFamily,
            labelBold: this.data.labelBold,
            labelItalic: this.data.labelItalic,
            optionBold: this.data.optionBold,
            optionItalic: this.data.optionItalic,
            labelFontSize: this.data.labelFontSize,
            optionsFontSize: this.data.optionsFontSize,
            optionPosition: this.data.optionPosition,
            labelPosition: this.data.labelPosition,
            blockheight: height,
            fieldName: this.data.fieldName,
            role: this.data.role,
            mandatory: this.data.mandatory
        };
    }


    destroy() {
        const labelToRemove = this.data.fieldName + "_" + this.data.role;


        if (usedLabels.has(labelToRemove)) {
            usedLabels.delete(labelToRemove);
        }
    }

    applyLabelStyles() {
        this.labelElement.style.fontFamily = this.data.labelFamily;
        this.labelElement.style.fontWeight = this.data.labelBold;
        this.labelElement.style.fontStyle = this.data.labelItalic;
    }

    applyOptionStyles(optionElement) {
        optionElement.style.fontFamily = this.data.optionFamily;
        optionElement.style.fontWeight = this.data.optionBold;
        optionElement.style.fontStyle = this.data.optionItalic;
    }

    openEditModal() {
        const checkboxLabelInput = document.getElementById('checkboxLabelInput');
        const checkfieldName = document.getElementById('checkfieldName');
        const checkboxOptions = document.getElementById('checkboxOptions');
        const checkboxPreview = document.getElementById('checkboxPreview');
        const checklabelFamilySelect = document.getElementById('checklabelFamilySelect');
        const checkoptionFamilySelect = document.getElementById('checkoptionFamilySelect');
        const checkboldLabelButton = document.getElementById('checkboldLabelButton');
        const checkitalicLabelButton = document.getElementById('checkitalicLabelButton');
        const checkboldOptionButton = document.getElementById('checkboldOptionButton');
        const checkitalicOptionButton = document.getElementById('checkitalicOptionButton');
        const checklabelFontSizeInput = document.getElementById('checklabelFontSizeInput');
        const checkoptionsFontSizeInput = document.getElementById('checkoptionsFontSizeInput');
        const labelCheckError = document.getElementById('labelCheckError');

        const mandatoryCheckboxCheck = document.getElementById('mandatoryCheckboxCheck');
        mandatoryCheckboxCheck.checked = this.data.mandatory;
        mandatoryCheckboxCheck.addEventListener('change', () => {
            this.data.mandatory = mandatoryCheckboxCheck.checked;
            updatePreview();
        });

        const checkPositionSelect = document.getElementById('checkPositionSelect');
        const checkLabelPositionSelect = document.getElementById('checkLabelPositionSelect')
        labelCheckError.classList.add('d-none');

        checklabelFontSizeInput.value = this.data.labelFontSize;
        checkoptionsFontSizeInput.value = this.data.optionsFontSize;
        checkboxLabelInput.value = this.data.label;
        checkfieldName.value = this.data.fieldName;
        checklabelFamilySelect.value = this.data.labelFamily;
        checkoptionFamilySelect.value = this.data.optionFamily;
        checkboldLabelButton.classList.toggle('btn-primary', this.data.labelBold === 'bold');
        checkitalicLabelButton.classList.toggle('btn-primary', this.data.labelItalic === 'italic');
        checkboldOptionButton.classList.toggle('btn-primary', this.data.optionBold === 'bold');
        checkitalicOptionButton.classList.toggle('btn-primary', this.data.optionItalic === 'italic');
        checkboxLabelInput.value = this.data.label;
        checklabelFontSizeInput.value = this.data.labelFontSize;
        checkPositionSelect.value = this.data.optionPosition;
        checkLabelPositionSelect.value = this.data.labelPosition;
        const tempoptions = JSON.parse(JSON.stringify(this.data.options));

        checkboxOptions.innerHTML = '';
        tempoptions.forEach((option, index) => {
            const optionWrapper = document.createElement('div');
            optionWrapper.className = 'input-group mb-2';

            const optionInput = document.createElement('input');
            optionInput.type = 'text';
            optionInput.className = 'form-control mr-2';
            optionInput.placeholder = 'Option text';
            optionInput.value = option.text;

            const removeButton = document.createElement('button');
            removeButton.className = 'btn btn-danger';
            removeButton.innerText = 'Remove';
            removeButton.onclick = () => {
                tempoptions.splice(index, 1);
                optionWrapper.remove();
                updatePreview();
            };

            optionWrapper.appendChild(optionInput);
            optionWrapper.appendChild(removeButton);
            checkboxOptions.appendChild(optionWrapper);

            optionInput.addEventListener('input', (event) => {
                tempoptions[index].text = event.target.value;
                updatePreview();
            });
        });

        const addCheckboxOption = document.getElementById('addCheckboxOption');
        addCheckboxOption.onclick = () => {
            const newOption = { text: `Option ${tempoptions.length + 1}`, selected: false };
            tempoptions.push(newOption);
            const optionWrapper = document.createElement('div');
            optionWrapper.className = 'input-group mb-2';

            const optionInput = document.createElement('input');
            optionInput.type = 'text';
            optionInput.className = 'form-control mr-2';
            optionInput.placeholder = 'Option text';
            optionInput.value = newOption.text;

            const removeButton = document.createElement('button');
            removeButton.className = 'btn btn-danger';
            removeButton.innerText = 'Remove';
            removeButton.onclick = () => {
                tempoptions.splice(tempoptions.indexOf(newOption), 1);
                optionWrapper.remove();
                updatePreview();
            };

            optionWrapper.appendChild(optionInput);
            optionWrapper.appendChild(removeButton);
            checkboxOptions.appendChild(optionWrapper);

            optionInput.addEventListener('input', (event) => {
                newOption.text = event.target.value;
                updatePreview();
            });

            updatePreview();
        };

        const updatePreview = () => {
            checkboxPreview.innerHTML = '';
            const previewLabel = document.createElement('label');
            previewLabel.textContent = checkboxLabelInput.value;
            previewLabel.style.fontFamily = checklabelFamilySelect.value;
            previewLabel.style.fontWeight = checkboldLabelButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            previewLabel.style.fontStyle = checkitalicLabelButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            previewLabel.style.fontSize = checklabelFontSizeInput.value;
            previewLabel.style.marginBottom = '0.25rem';
            checkboxPreview.className = 'd-flex';
            checkboxPreview.appendChild(previewLabel);

            if (this.data.mandatory) {
                previewLabel.innerHTML += ' <span style="color: red;">*</span>';
            }



            if (checkPositionSelect.value === 'vertical' && checkLabelPositionSelect.value === 'left') {
                checkboxPreview.classList.remove('flex-column');
                previewLabel.style.width = 'auto';
                previewLabel.style.marginRight = "5px";
            }

            else {

                if (checkPositionSelect.value === 'vertical') {
                    checkboxPreview.classList.add('flex-column');
                    checkboxPreview.classList.remove('radio-options');
                }
                else {
                    checkboxPreview.classList.remove('flex-column');
                    checkboxPreview.classList.add('radio-options');
                }
                if (checkLabelPositionSelect.value === 'top') {
                    previewLabel.style.width = '100%';
                }
                else {
                    previewLabel.style.width = 'auto';
                }

            }



            const radiodiv = document.createElement('div');
            radiodiv.className = 'm-0 p-0';


            tempoptions.forEach(option => {
                const checkboxWrapper = document.createElement('div');
                checkboxWrapper.className = 'form-check d-flex align-items-center';

                const checkboxInput = document.createElement('input');
                checkboxInput.type = 'checkbox';
                checkboxInput.className = 'form-check-input mt-0';
                checkboxInput.name = 'checkbox-group-preview';
                checkboxInput.disabled = true;

                const checkboxLabel = document.createElement('label');
                checkboxLabel.className = 'form-check-label';
                checkboxLabel.textContent = option.text;
                checkboxLabel.style.fontFamily = checkoptionFamilySelect.value;
                checkboxLabel.style.fontWeight = checkboldOptionButton.classList.contains('btn-primary') ? 'bold' : 'normal';
                checkboxLabel.style.fontStyle = checkitalicOptionButton.classList.contains('btn-primary') ? 'italic' : 'normal';
                checkboxLabel.style.fontSize = checkoptionsFontSizeInput.value;

                checkboxWrapper.appendChild(checkboxInput);
                checkboxWrapper.appendChild(checkboxLabel);

                if (checkPositionSelect.value === 'vertical' && checkLabelPositionSelect.value === 'left') {

                    radiodiv.appendChild(checkboxWrapper);
                }
                else {
                    checkboxPreview.appendChild(checkboxWrapper);

                }


            });
            if (checkPositionSelect.value === 'vertical' && checkLabelPositionSelect.value === 'left') {
                checkboxPreview.appendChild(radiodiv);
            }
        };

        updatePreview();

        checkboldLabelButton.onclick = () => {
            checkboldLabelButton.classList.toggle('btn-primary');
            updatePreview();
        };

        checkitalicLabelButton.onclick = () => {
            checkitalicLabelButton.classList.toggle('btn-primary');
            updatePreview();
        };

        checkboldOptionButton.onclick = () => {
            checkboldOptionButton.classList.toggle('btn-primary');
            updatePreview();
        };

        checkitalicOptionButton.onclick = () => {
            checkitalicOptionButton.classList.toggle('btn-primary');
            updatePreview();
        };

        checkPositionSelect.addEventListener('change', updatePreview);

        checkLabelPositionSelect.addEventListener('change', updatePreview);

        checklabelFamilySelect.onchange = updatePreview;
        checkoptionFamilySelect.onchange = updatePreview;
        document.querySelectorAll('#checkboxModal input').forEach(input => {
            input.addEventListener('input', updatePreview);
        });

        const saveButton = document.getElementById('saveCheckboxBlock');
        saveButton.onclick = () => {
            const newLabel = checkfieldName.value + "_" + this.data.role;
            if (usedLabels.has(newLabel) && newLabel !== this.data.fieldName + "_" + this.data.role) {
                labelCheckError.innerText = "Dublicate Field Name";
                labelCheckError.classList.remove('d-none');
                return;
            }
            else {
                labelCheckError.classList.add('d-none');
            }

            if (checkfieldName.value === "") {
                labelCheckError.innerText = "Field Name can't be Empty";
                labelCheckError.classList.remove('d-none');
                return;
            }
            else {
                labelCheckError.classList.add('d-none');
            }

            if (this.data.mandatory) {
                this.labelElement.style.marginRight = "0px";
                this.asterisk.style.marginRight = "10px";
                this.asterisk.style.display = "unset";
            } else {
                this.asterisk.style.display = "none";
            }


            usedLabels.delete(this.data.fieldname + "_" + this.data.role);
            usedLabels.add(newLabel);
            this.data.label = checkboxLabelInput.value;
            this.data.fieldName = checkfieldName.value;
            this.data.labelFamily = checklabelFamilySelect.value;
            this.data.labelBold = checkboldLabelButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            this.data.labelItalic = checkitalicLabelButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            this.data.labelFontSize = checklabelFontSizeInput.value;

            this.data.optionFamily = checkoptionFamilySelect.value;
            this.data.optionBold = checkboldOptionButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            this.data.optionItalic = checkitalicOptionButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            this.data.optionsFontSize = checkoptionsFontSizeInput.value;
            this.data.options = JSON.parse(JSON.stringify(tempoptions));
            this.data.optionPosition = checkPositionSelect.value;
            this.data.labelPosition = checkLabelPositionSelect.value;


            this.labelElement.textContent = this.data.label;
            this.labelElement.style.fontFamily = this.data.labelFamily;
            this.labelElement.style.fontWeight = this.data.labelBold;
            this.labelElement.style.fontStyle = this.data.labelItalic;
            this.labelElement.style.fontSize = this.data.labelFontSize;
            const textSizeValue = parseInt(this.data.labelFontSize, 10);
            this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;

            this.applyOptionPosition();


            while (this.wrapper.children.length > 1) {
                this.wrapper.removeChild(this.wrapper.lastChild);
            }

            const radiodiv = document.createElement('div');
            radiodiv.className = 'm-0 p-0';

            this.data.options.forEach(option => {
                const checkboxWrapper = document.createElement('div');
                checkboxWrapper.className = 'form-check d-flex align-items-center radio-option';

                const checkboxInput = document.createElement('input');
                checkboxInput.type = 'checkbox';
                checkboxInput.className = 'form-check-input mt-0';
                checkboxInput.name = 'checkbox-group';
                checkboxInput.setAttribute('role', this.data.role);

                checkboxInput.addEventListener('change', () => {

                    this.data.options.forEach((opt, i) => {
                        opt.selected = (i === index);
                    });
                });

                const checkboxLabel = document.createElement('label');
                checkboxLabel.className = 'form-check-label';
                checkboxLabel.textContent = option.text;
                checkboxLabel.style.fontFamily = this.data.optionFamily;
                checkboxLabel.style.fontWeight = this.data.optionBold;
                checkboxLabel.style.fontStyle = this.data.optionItalic;
                checkboxLabel.style.fontSize = this.data.optionsFontSize;

                checkboxWrapper.appendChild(checkboxInput);
                checkboxWrapper.appendChild(checkboxLabel);


                if (this.data.optionPosition === 'vertical' && this.data.labelPosition === 'left') {
                    radiodiv.appendChild(checkboxWrapper);
                }
                else {
                    this.wrapper.appendChild(checkboxWrapper);
                }


            });
            if (this.data.optionPosition === 'vertical' && this.data.labelPosition === 'left') {
                this.wrapper.appendChild(radiodiv);
            }




            $('#checkboxModal').modal('hide');
        };
        const deletebutton = document.getElementById('deletecheckblock')
        deletebutton.onclick = () => {
            const index = this.api.blocks.getCurrentBlockIndex()
            this.api.blocks.delete(index)
            $('#editInputModal').modal('hide');

        };

        $('#checkboxModal').modal('show');

    }

    applyOptionPosition() {
        if (this.data.optionPosition === 'vertical' && this.data.labelPosition === 'left') {
            this.wrapper.classList.remove('flex-column');
            this.labelWrapper.style.width = 'auto';
            this.labelWrapper.classList.remove('align-items-center');
            this.labelElement.style.marginTop = 'unset';

        }
        else {
            this.labelWrapper.classList.add('align-items-center');
            this.labelElement.style.marginTop = 'auto';
            if (this.data.optionPosition === 'vertical') {
                this.wrapper.classList.add('flex-column');
                this.wrapper.classList.remove('radio-options');

            }
            else {
                this.wrapper.classList.remove('flex-column');
                this.wrapper.classList.add('radio-options');
            }

            if (this.data.labelPosition === 'top') {
                this.labelWrapper.style.width = '100%';
            }
            else {
                this.labelWrapper.style.width = 'auto';
            }
        }


    }
}

class ButtonBlock {
    static get toolbox() {
        return {
            title: 'Button',
            icon: '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg" fill="#000000"><circle cx="8.5" cy="7.5" r="6.5" fill="#000000"/></svg>',
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            buttonText: 'Button',
            buttonWidth: '100px',
            buttonFontSize: '16px',
            buttonFontFamily: 'Arial',
            buttonAction: 'submit',
            buttonBold: 'normal',
            buttonItalic: 'normal',
            buttonBackgroundColor: '#007bff', // Default background color
            buttonBorderColor: '#007bff', // Default border color
        };
        this.wrapper = null;
        this.buttonElement = null;
        this.editButton = null;
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.style.position = 'relative';
        this.wrapper.style.padding = '1em 0';

        this.buttonElement = document.createElement('button');
        this.buttonElement.className = 'btn btn-primary';
        this.buttonElement.textContent = this.data.buttonText;
        this.buttonElement.style.width = this.data.buttonWidth;
        this.buttonElement.style.fontSize = this.data.buttonFontSize;
        this.buttonElement.style.fontFamily = this.data.buttonFontFamily;
        this.buttonElement.style.fontWeight = this.data.buttonBold;
        this.buttonElement.style.fontStyle = this.data.buttonItalic;
        this.buttonElement.style.backgroundColor = this.data.buttonBackgroundColor;
        this.buttonElement.style.borderColor = this.data.buttonBorderColor;
        this.buttonElement.type = this.data.buttonAction;

        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';

        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.backgroundColor = 'transparent'; // Transparent background
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.transition = 'opacity 0.3s';
        this.editButton.style.zIndex = '100'; // Ensure it's on top
        this.editButton.style.outline = 'none';
        this.editButton.className = 'switchtab';

        this.editButton.onclick = () => this.openEditModal();

        // Add event listeners for hover effect
        this.wrapper.onmouseover = () => {
            this.editButton.classList.remove('switchtab')
            this.editButton.classList.add('openedit')
        };
        this.wrapper.onmouseout = () => {
            this.editButton.classList.remove('openedit')
            this.editButton.classList.add('switchtab')
        };

        this.wrapper.appendChild(this.buttonElement);
        this.wrapper.appendChild(this.editButton);

        return this.wrapper;
    }

    save(blockContent) {
        return {
            buttonText: this.data.buttonText,
            buttonWidth: this.data.buttonWidth,
            buttonFontSize: this.data.buttonFontSize,
            buttonFontFamily: this.data.buttonFontFamily,
            buttonAction: this.data.buttonAction,
            buttonBold: this.data.buttonBold,
            buttonItalic: this.data.buttonItalic,
            buttonBackgroundColor: this.data.buttonBackgroundColor,
            buttonBorderColor: this.data.buttonBorderColor,
        };
    }

    openEditModal() {
        const buttonWidth = document.getElementById('buttonWidth');
        const buttonFontSize = document.getElementById('buttonFontSize');
        const buttonFontFamily = document.getElementById('buttonFontFamily');
        const buttonAction = document.getElementById('buttonAction');
        const buttonText = document.getElementById('buttonText');
        const boldButton = document.getElementById('buttonboldButton');
        const italicButton = document.getElementById('buttonitalicButton');
        const buttonBackgroundColor = document.getElementById('buttonBackgroundColor');
        const buttonBorderColor = document.getElementById('buttonBorderColor');

        if (this.data.buttonBold !== 'bold') {
            if (boldButton.classList.contains('btn-primary')) {
                boldButton.classList.remove('btn-primary');
            }
        }
        if (this.data.buttonItalic !== 'italic') {
            if (italicButton.classList.contains('btn-primary')) {
                italicButton.classList.remove('btn-primary');
            }
        }

        const previewContainer = document.getElementById('buttonpreviewContainer');

        buttonWidth.value = this.data.buttonWidth;
        buttonFontSize.value = this.data.buttonFontSize;
        buttonFontFamily.value = this.data.buttonFontFamily;
        buttonAction.value = this.data.buttonAction;
        buttonText.value = this.data.buttonText;
        buttonBackgroundColor.value = this.data.buttonBackgroundColor;
        buttonBorderColor.value = this.data.buttonBorderColor;

        const updatePreview = () => {
            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'd-flex align-items-center';

            const previewButtonElement = document.createElement('button');
            previewButtonElement.className = 'btn btn-primary';
            previewButtonElement.textContent = buttonText.value;
            previewButtonElement.style.width = buttonWidth.value;
            previewButtonElement.style.fontSize = buttonFontSize.value;
            previewButtonElement.style.fontFamily = buttonFontFamily.value;
            previewButtonElement.style.fontWeight = boldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            previewButtonElement.style.fontStyle = italicButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            previewButtonElement.style.backgroundColor = buttonBackgroundColor.value;
            previewButtonElement.style.borderColor = buttonBorderColor.value;
            previewButtonElement.type = buttonAction.value;

            previewWrapper.appendChild(previewButtonElement);

            previewContainer.innerHTML = '';
            previewContainer.appendChild(previewWrapper);
        };

        updatePreview();

        boldButton.onclick = () => {
            boldButton.classList.toggle('btn-primary');
            updatePreview();
        };

        italicButton.onclick = () => {
            italicButton.classList.toggle('btn-primary');
            updatePreview();
        };

        document.querySelectorAll('#editButtonModal input, #editButtonModal select').forEach(input => {
            input.addEventListener('input', updatePreview);
        });

        $('#editButtonModal').modal('show');

        const saveButton = document.getElementById('saveButtonSettings');
        saveButton.onclick = () => {
            this.data.buttonWidth = buttonWidth.value;
            this.data.buttonFontSize = buttonFontSize.value;
            this.data.buttonFontFamily = buttonFontFamily.value;
            this.data.buttonAction = buttonAction.value;
            this.data.buttonText = buttonText.value;
            this.data.buttonBold = boldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            this.data.buttonItalic = italicButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            this.data.buttonBackgroundColor = buttonBackgroundColor.value;
            this.data.buttonBorderColor = buttonBorderColor.value;
            this.applyStyles();
            $('#editButtonModal').modal('hide');
        };
        const deletebutton = document.getElementById('deletebuttonblock')
        deletebutton.onclick = () => {
            const index = this.api.blocks.getCurrentBlockIndex()
            this.api.blocks.delete(index)
            $('#editInputModal').modal('hide');
        };
    }

    applyStyles() {
        this.buttonElement.style.width = this.data.buttonWidth;
        this.buttonElement.style.fontSize = this.data.buttonFontSize;
        this.buttonElement.style.fontFamily = this.data.buttonFontFamily;
        this.buttonElement.style.fontWeight = this.data.buttonBold;
        this.buttonElement.style.fontStyle = this.data.buttonItalic;
        this.buttonElement.style.backgroundColor = this.data.buttonBackgroundColor;
        this.buttonElement.style.borderColor = this.data.buttonBorderColor;
        this.buttonElement.textContent = this.data.buttonText;
        this.buttonElement.type = this.data.buttonAction;
    }
}

class ImageBlock {
    static get toolbox() {
        return {
            title: 'Image',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.5858 3.41421C18.8047 2.63316 17.5562 2.63316 16.7751 3.41421L13.4142 6.77515C12.6332 7.5562 12.6332 8.80474 13.4142 9.58579L14.8284 11L11 14.8284V16H12.1716L16 12.1716L17.4142 13.5858C18.1953 14.3668 19.4438 14.3668 20.2249 13.5858L23.5858 10.2249C24.3668 9.44384 24.3668 8.1953 23.5858 7.41421L19.5858 3.41421Z" fill="currentColor"/><path d="M3 20C3 19.4477 3.44772 19 4 19H20C20.5523 19 21 19.4477 21 20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20Z" fill="currentColor"/><path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12Z" fill="currentColor"/></svg>'
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            url: '',
            width: 'auto',
            height: 'auto',
            alignment: 'left',
            fieldName: 'image field',
            placeholderText: 'Upload Image',
            mandatory: false,

        };
        this.wrapper = null;
        this.imageInput = null;
        this.editButton = null;
        this.placeholder = null;


    }

    render() {
        const selectElement = document.getElementById('ClientSelect');
        const selectedRole = selectElement.value;

        this.wrapper = document.createElement('div');
        this.wrapper.className = 'image-block';

        this.wrapper.style.padding = "1em 0";
        this.data.role = this.data.role ? this.data.role : selectedRole

        this.imageInput = document.createElement('input');
        this.imageInput.type = 'file';
        this.imageInput.accept = 'image/*';
        this.imageInput.style.display = 'none';

        this.imageInput.onchange = (event) => {
            const file = event.target.files[0];
            const reader = new FileReader();

            reader.onload = (e) => {
                this.data.url = e.target.result;
                this.renderImage();
            };

            reader.readAsDataURL(file);
        };

        this.placeholder = document.createElement('div');
        this.placeholder.style.width = this.data.width + "%";
        const percentageNumber = parseFloat(this.data.height);
        const decimalValue = percentageNumber / 100;
        this.placeholder.style.height = (decimalValue * window.eHeight) + 'px';
        this.placeholder.style.backgroundColor = '#e0e0e0';
        this.placeholder.style.display = 'flex';
        this.placeholder.style.alignItems = 'center';
        this.placeholder.style.justifyContent = 'center';
        this.placeholder.style.cursor = 'pointer';
        this.placeholder.style.textAlign = 'center';
        this.placeholder.innerHTML = this.data.placeholderText || 'Upload Image';
        this.placeholder.style.color = '#999';
        this.placeholder.style.fontSize = 'medium';
        this.placeholder.style.fontStyle = 'italic';
        this.placeholder.setAttribute('role', this.data.role);
        this.placeholder.style.wordBreak = 'break-word';


        this.placeholder.onclick = () => this.imageInput.click();


        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';

        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.backgroundColor = 'transparent';
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.transition = 'opacity 0.3s';
        this.editButton.style.zIndex = '100';
        this.editButton.style.outline = 'none';
        this.editButton.className = 'switchtab';
        this.editButton.onclick = () => this.openEditModal();

        this.wrapper.appendChild(this.editButton);

        this.wrapper.appendChild(this.placeholder);

        this.renderImage();

        this.wrapper.onmouseover = () => {
            this.editButton.classList.remove('switchtab')
            this.editButton.classList.add('openedit')
        };
        this.wrapper.onmouseout = () => {
            this.editButton.classList.remove('openedit')
            this.editButton.classList.add('switchtab')
        };

        usedLabels.add(this.data.fieldName + "_" + this.data.role);





        return this.wrapper;
    }

    renderImage() {
        if (this.data.url) {
            const img = document.createElement('img');
            img.src = this.data.url;
            img.style.maxWidth = '100%';
            img.style.width = this.data.width + "%";
            const percentageNumber = parseFloat(this.data.height);
            const decimalValue = percentageNumber / 100;
            img.style.height = (decimalValue * window.eHeight) + 'px';
            this.wrapper.innerHTML = '';
            img.onclick = () => this.imageInput.click();
            img.setAttribute('role', this.data.role);
            this.wrapper.appendChild(this.editButton);
            this.wrapper.appendChild(img);
            this.imgelement = img;

            switch (this.data.alignment) {
                case 'left':
                    img.style.margin = '0';
                    break;
                case 'center':
                    img.style.display = 'block';
                    img.style.margin = '0 auto';
                    break;
                case 'right':
                    img.style.display = 'block';
                    img.style.margin = '0 0 0 auto';
                    break;
            }
        }
        else {
            switch (this.data.alignment) {
                case 'left':
                    this.placeholder.style.margin = '0';
                    break;
                case 'center':

                    this.placeholder.style.margin = '0 auto';
                    break;
                case 'right':
                    this.placeholder.style.margin = '0 0 0 auto';
                    break;
            }

        }
    }

    save(blockContent) {
        // if (this.imgelement) {
        // const height = parseFloat(window.getComputedStyle(this.imgelement).height);
        //     this.data.height = (height / window.eHeight) * 100;
        // }


        return this.data;
    }


    destroy() {
        const labelToRemove = this.data.fieldName + "_" + this.data.role;


        if (usedLabels.has(labelToRemove)) {
            usedLabels.delete(labelToRemove);
        }
    }

    openEditModal() {
        const imageHeightInput = document.getElementById('imageHeightInput');
        const imageWidthInput = document.getElementById('imageWidthInput');
        const imageAlignmentSelect = document.getElementById('imageAlignmentSelect');
        const imageFieldNameInput = document.getElementById('imageFieldNameInput');
        const imagePlaceholderInput = document.getElementById('imagePlaceholderInput');
        const previewImage = document.getElementById('previewImage');
        const previewPlaceholder = document.getElementById('previewPlaceholder');
        const labelImageError = document.getElementById('labelImageError');
        labelImageError.classList.add('d-none');
        const labelImageHeight = document.getElementById('labelImageHeight');
        labelImageHeight.classList.add('d-none');

        const mandatoryCheckboxImage = document.getElementById('mandatoryCheckboxImage');
        mandatoryCheckboxImage.checked = this.data.mandatory;
        mandatoryCheckboxImage.addEventListener('change', () => {
            this.data.mandatory = mandatoryCheckboxImage.checked;
        });

        imageHeightInput.value = parseFloat(this.data.height) + 10;
        imageWidthInput.value = this.data.width;
        imageAlignmentSelect.value = this.data.alignment;
        imageFieldNameInput.value = this.data.fieldName;
        imagePlaceholderInput.value = this.data.placeholderText;
        previewImage.src = this.data.url;
        const pn = parseFloat(this.data.height) / 100;
        previewImage.style.height = (pn * window.eHeight) + "px";
        previewImage.style.width = this.data.width + "%";
        previewPlaceholder.style.width = this.data.width + "%";
        previewPlaceholder.style.height = (pn * window.eHeight) + "px";

        const updateImagePreview = () => {
            const pn = (parseFloat(imageHeightInput.value) - 10) / 100;
            previewImage.style.height = (pn * window.eHeight) + "px";
            previewImage.style.width = imageWidthInput.value + "%";
            previewPlaceholder.style.height = (pn * window.eHeight) + "px";
            previewPlaceholder.style.width = imageWidthInput.value + "%";
            previewPlaceholder.innerHTML = imagePlaceholderInput.value;

            switch (imageAlignmentSelect.value) {
                case 'left':
                    previewImage.style.margin = '0';
                    previewPlaceholder.style.margin = '0';
                    break;
                case 'center':
                    previewImage.style.display = 'block';

                    previewImage.style.margin = '0 auto';
                    previewPlaceholder.style.margin = '0 auto';
                    break;
                case 'right':
                    previewImage.style.display = 'block';
                    previewImage.style.margin = '0 0 0 auto';
                    previewPlaceholder.style.margin = '0 0 0 auto';
                    break;
            }
            if (this.data.url) {
                previewImage.src = this.data.url;
                previewImage.style.display = 'block';
                previewPlaceholder.style.display = 'none';
            } else {
                previewImage.style.display = 'none';
                previewPlaceholder.style.display = 'flex';
            }
        };

        imageHeightInput.addEventListener('input', updateImagePreview);
        imageWidthInput.addEventListener('input', updateImagePreview);
        imageAlignmentSelect.addEventListener('change', updateImagePreview);
        imagePlaceholderInput.addEventListener('input', updateImagePreview);
        updateImagePreview();

        const saveButton = document.getElementById('saveImageData');
        saveButton.onclick = () => {
            const newLabel = imageFieldNameInput.value + "_" + this.data.role;
            if (usedLabels.has(newLabel) && newLabel !== this.data.fieldName + "_" + this.data.role) {
                labelImageError.innerText = "Dublicate Field Name";
                labelImageError.classList.remove('d-none');
                return;
            }
            else {
                labelImageError.classList.add('d-none');
            }

            if (parseFloat(imageHeightInput.value) < 15 || parseFloat(imageHeightInput.value) > 100 || imageHeightInput.value == "") {

                labelImageHeight.classList.remove('d-none');
                return;

            }
            else {
                labelImageHeight.classList.add('d-none');
            }

            if (imageFieldNameInput.value === "") {
                labelImageError.innerText = "Field Name can't be Empty";
                labelImageError.classList.remove('d-none');
                return;
            }
            else {
                labelImageError.classList.add('d-none');
            }


            usedLabels.delete(this.data.fieldName + "_" + this.data.role);
            usedLabels.add(newLabel);
            this.data.height = parseFloat(imageHeightInput.value) - 10;
            this.data.width = imageWidthInput.value;
            this.data.alignment = imageAlignmentSelect.value;
            this.data.fieldName = imageFieldNameInput.value;
            this.data.placeholderText = imagePlaceholderInput.value;
            this.placeholder.innerHTML = imagePlaceholderInput.value;
            const percentageNumber = parseFloat(this.data.height);
            const decimalValue = percentageNumber / 100;
            this.placeholder.style.height = (decimalValue * window.eHeight) + 'px';
            this.placeholder.style.width = this.data.width + "%";
            this.renderImage();
            $('#editImageModal').modal('hide');
        };
        const deletebutton = document.getElementById('deleteinputblock')
        deletebutton.onclick = () => {
            const index = this.api.blocks.getCurrentBlockIndex()
            this.api.blocks.delete(index)
            $('#editInputModal').modal('hide');

        };

        $('#editImageModal').modal('show');
    }
}

class TextAreaBlock {
    static get toolbox() {
        return {
            title: 'Input',
            icon: '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg" fill="#000000"><circle cx="8.5" cy="7.5" r="6.5" fill="#000000"/></svg>',
        };
    }

    constructor({ data, api }) {
        this.api = api;
        this.data = data || {
            labelTextInput: 'Label',
            value: '',
            labelPosition: 'top',
            inputwidth: '50',
            inputSize: '16px',
            inputplaceholder: 'Enter text',
            textwidth: '50%',
            textSize: '16px',
            textplaceholder: 'Enter text',
            textareaHeight: 'auto',
            mandatory: false,
        };
        this.wrapper = null;
        this.labelInput = null;
        this.inputElement = null;
        this.editButton = null;


    }

    render() {
        const selectElement = document.getElementById('ClientSelect');
        const selectedRole = selectElement.value;

        this.wrapper = document.createElement('div');
        this.wrapper.className = 'd-flex align-items-center';
        this.wrapper.style.position = 'relative';
        this.wrapper.style.padding = "1em 0";
        this.data.role = this.data.role ? this.data.role : selectedRole

        const labeldiv = document.createElement('div')
        labeldiv.className = 'd-flex align-items-center';
        labeldiv.style.gap = '0px';
        labeldiv.style.padding = '0px';
        labeldiv.style.margin = '0px';

        this.labelInput = document.createElement('label');
        this.labelInput.className = 'input-block-label';
        this.labelInput.textContent = this.data.labelTextInput;
        this.labelInput.style.width = "auto";
        this.labelInput.style.marginRight = "10px";
        this.labelInput.style.whiteSpace = 'nowrap';
        this.labelInput.style.fontSize = this.data.textSize;
        this.labelInput.style.flexGrow = '0';
        this.labelInput.style.padding = '0.4em 0';
        this.labelInput.style.lineHeight = '1.2';

        this.asterisk = document.createElement('span');
        this.asterisk.textContent = '*';
        this.asterisk.style.color = 'red';
        this.asterisk.style.fontSize = this.data.textSize;
        const textSizeValue = parseInt(this.data.textSize, 10);
        this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'd-flex';
        inputWrapper.style.width = '100%';

        this.inputElement = document.createElement('textarea');
        this.inputElement.className = 'form-control mr-2';
        this.inputElement.placeholder = this.data.inputplaceholder;
        this.inputElement.value = this.data.value;
        this.inputElement.style.width = this.data.inputwidth + "%";
        this.inputElement.style.fontSize = this.data.inputSize;
        this.inputElement.style.lineHeight = '1.2';
        this.inputElement.style.resize = 'none';
        this.inputElement.setAttribute('role', this.data.role);
        const scale = (766.29) / window.eHeight;

        this.inputElement.style.height = (window.eHeight * 0.20) + 'px';




        this.editButton = document.createElement('button');
        this.editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14.5 5.5L3 17 3 21 7 21 18.5 9.5zM21.2 2.8c-1.1-1.1-2.9-1.1-4 0L16 4l4 4 1.2-1.2C22.3 5.7 22.3 3.9 21.2 2.8z"/></svg>';

        this.editButton.style.position = 'absolute';
        this.editButton.style.top = '0';
        this.editButton.style.right = '0';
        this.editButton.style.backgroundColor = 'transparent';
        this.editButton.style.border = 'none';
        this.editButton.style.padding = '0.5em';
        this.editButton.style.cursor = 'pointer';
        this.editButton.style.transition = 'opacity 0.3s';
        this.editButton.style.zIndex = '100';
        this.editButton.style.outline = 'none';
        this.editButton.className = 'switchtab';

        this.editButton.onclick = () => this.openEditModal();

        labeldiv.appendChild(this.labelInput);
        labeldiv.appendChild(this.asterisk);
        // this.wrapper.appendChild(this.labelInput);

        this.wrapper.appendChild(labeldiv);
        inputWrapper.appendChild(this.inputElement);
        inputWrapper.appendChild(this.editButton);


        this.wrapper.appendChild(inputWrapper);

        if (this.data.mandatory) {
            this.labelInput.style.marginRight = "0px";
            this.asterisk.style.marginRight = "10px";
            this.asterisk.style.display = "unset";
        } else {
            this.asterisk.style.display = "none";
        }

        this.applyLabelPosition();
        this.applyStyles();

        this.wrapper.onmouseover = () => {
            this.editButton.classList.remove('switchtab')
            this.editButton.classList.add('openedit')
        };
        this.wrapper.onmouseout = () => {
            this.editButton.classList.remove('openedit')
            this.editButton.classList.add('switchtab')
        };

        usedLabels.add(this.data.fieldName + "_" + this.data.role);



        return this.wrapper;
    }

    save(blockContent) {
        return {
            label: this.labelInput.value,
            value: this.inputElement.value,
            labelPosition: this.data.labelPosition,
            labelfamily: this.data.labelfamily,
            inputfamily: this.data.inputfamily,
            labelTextInput: this.data.labelTextInput,
            inputwidth: this.data.inputwidth,
            inputSize: this.data.inputSize,
            inputplaceholder: this.data.inputplaceholder,
            textwidth: this.data.textwidth,
            textSize: this.data.textSize,
            textplaceholder: this.data.textplaceholder,
            textareaHeight: this.data.textareaHeight,
            labelBold: this.data.labelBold,
            labelItalic: this.data.labelItalic,
            fieldName: this.data.fieldName,
            role: this.data.role,

            mandatory: this.data.mandatory
        };
    }

    destroy() {
        const labelToRemove = this.data.fieldName + "_" + this.data.role;


        if (usedLabels.has(labelToRemove)) {
            usedLabels.delete(labelToRemove);
        }
    }

    openEditModal() {
        const labelPositionSelect = document.getElementById('talabelPositionSelect');
        const labelfamilyselect = document.getElementById('talabelfamilyselect');
        const inputfamilyselect = document.getElementById('tafamilyselect');
        const boldButton = document.getElementById('taboldButton');
        const italicButton = document.getElementById('taitalicButton');
        const labelInputError = document.getElementById('labelTaError')
        labelInputError.classList.add('d-none');

        const mandatoryCheckboxTextarea = document.getElementById('mandatoryCheckboxTextarea');
        mandatoryCheckboxTextarea.checked = this.data.mandatory;
        mandatoryCheckboxTextarea.addEventListener('change', () => {
            this.data.mandatory = mandatoryCheckboxTextarea.checked;
            updatePreview();
        });
        // if (this.data.labelBold !== 'bold') {
        //     if (boldButton.classList.contains('btn-primary')) {
        //         boldButton.classList.remove('btn-primary');
        //     }
        // }
        // if (this.data.labelItalic !== 'italic') {
        //     if (italicButton.classList.contains('btn-primary')) {
        //         italicButton.classList.remove('btn-primary');
        //     }
        // }
        boldButton.classList.toggle('btn-primary', this.data.labelBold === 'bold');
        italicButton.classList.toggle('btn-primary', this.data.labelItalic === 'bold');

        const labelTextInput = document.getElementById('talabelTextInput');
        const tafieldName = document.getElementById('tafieldName');
        const inputWidth = document.getElementById('taWidth');
        const inputFontSize = document.getElementById('taFontSize');
        const inputPlaceholder = document.getElementById('taPlaceholder');

        const textWidth = document.getElementById('tatextWidth');
        const textSize = document.getElementById('tatextFontSize');
        const textPlaceholder = document.getElementById('tatextPlaceholder');

        const previewContainer = document.getElementById('tapreviewContainer');

        labelPositionSelect.value = this.data.labelPosition;
        labelfamilyselect.value = this.data.labelfamily;
        inputfamilyselect.value = this.data.inputfamily;

        labelTextInput.textContent = this.data.labelTextInput;
        inputWidth.value = this.data.inputwidth;
        labelTextInput.value = this.data.labelTextInput;
        tafieldName.value = this.data.fieldName;
        inputFontSize.value = this.data.inputSize;
        inputPlaceholder.value = this.data.inputplaceholder;

        textWidth.value = this.data.textwidth;
        textSize.value = this.data.textSize;
        textPlaceholder.value = this.data.textplaceholder;

        const updatePreview = () => {
            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'd-flex align-items-center';

            const previewLabelInput = document.createElement('label');
            previewLabelInput.className = 'input-block-label';
            previewLabelInput.placeholder = textPlaceholder.value;
            previewLabelInput.textContent = labelTextInput.value;
            previewLabelInput.style.fontSize = textSize.value;
            previewLabelInput.style.fontWeight = boldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            previewLabelInput.style.fontStyle = italicButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            previewLabelInput.style.width = "auto";
            previewLabelInput.style.marginRight = "5px";
            previewLabelInput.style.whiteSpace = 'nowrap';
            previewLabelInput.style.padding = '0.4em 0px';
            previewLabelInput.style.lineHeight = '1.2';
            previewLabelInput.style.fontFamily = labelfamilyselect.value;

            if (this.data.mandatory) {

                previewLabelInput.innerHTML += ' <span style="color: red;">*</span>';

            }


            const previewInputElement = document.createElement('textarea');
            previewInputElement.className = 'form-control mr-2';
            previewInputElement.placeholder = inputPlaceholder.value;
            previewInputElement.value = this.data.value;
            previewInputElement.style.width = inputWidth.value + "%";
            previewInputElement.style.fontSize = inputFontSize.value;
            previewInputElement.style.fontFamily = inputfamilyselect.value;
            previewInputElement.style.lineHeight = '1.2';
            previewInputElement.style.resize = 'none';

            previewWrapper.appendChild(previewLabelInput);

            const previewInputWrapper = document.createElement('div');
            previewInputWrapper.className = 'd-flex';
            previewInputWrapper.style.width = '100%';
            previewInputWrapper.appendChild(previewInputElement);

            previewWrapper.appendChild(previewInputWrapper);

            if (labelPositionSelect.value === 'top') {
                previewWrapper.classList.add('flex-column');
                previewWrapper.classList.remove('align-items-center');
                previewLabelInput.style.marginBottom = '0.4em';
            } else {
                previewWrapper.classList.remove('flex-column');
            }


            previewContainer.innerHTML = '';
            previewContainer.appendChild(previewWrapper);
        };

        updatePreview();

        boldButton.onclick = () => {
            boldButton.classList.toggle('btn-primary');
            updatePreview();
        };

        italicButton.onclick = () => {
            italicButton.classList.toggle('btn-primary');
            updatePreview();
        };

        labelPositionSelect.addEventListener('change', updatePreview);
        labelfamilyselect.addEventListener("change", updatePreview);
        inputfamilyselect.addEventListener("change", updatePreview);

        document.querySelectorAll('#editTextAreaModal input').forEach(input => {
            input.addEventListener('input', updatePreview);
        });

        $('#editTextAreaModal').modal('show');

        const saveButton = document.getElementById('tasaveLabelPositionButton');
        saveButton.onclick = () => {
            const newLabel = tafieldName.value + "_" + this.data.role;
            if (usedLabels.has(newLabel) && newLabel !== this.data.fieldName + "_" + this.data.role) {
                labelInputError.innerText = "Dublicate Field Name";
                labelInputError.classList.remove('d-none');
                return;
            }
            else {
                labelInputError.classList.add('d-none');
            }

            if (tafieldName.value === "") {
                labelInputError.innerText = "Field Name can't be Empty";
                labelInputError.classList.remove('d-none');
                return;
            }
            else {
                labelInputError.classList.add('d-none');
            }

            if (this.data.mandatory) {
                this.labelInput.style.marginRight = "0px";
                this.asterisk.style.marginRight = "10px";
                this.asterisk.style.display = "unset";
            } else {

                this.labelInput.style.marginRight = "10px";
                this.asterisk.style.display = "none";
            }


            usedLabels.delete(this.data.fieldName + "_" + this.data.role);
            usedLabels.add(newLabel);
            this.data.labelPosition = labelPositionSelect.value;
            this.data.labelfamily = labelfamilyselect.value;
            this.data.inputfamily = inputfamilyselect.value;
            this.data.labelTextInput = labelTextInput.value;
            this.data.fieldName = tafieldName.value;
            this.data.inputwidth = inputWidth.value;
            this.data.inputSize = inputFontSize.value;
            this.data.inputplaceholder = inputPlaceholder.value;
            this.data.textwidth = textWidth.value;
            this.data.textSize = textSize.value;
            this.data.textplaceholder = textPlaceholder.value;
            this.data.labelBold = boldButton.classList.contains('btn-primary') ? 'bold' : 'normal';
            this.data.labelItalic = italicButton.classList.contains('btn-primary') ? 'italic' : 'normal';
            this.applyLabelPosition();
            this.applyStyles();
            $('#editTextAreaModal').modal('hide');
        };
        const deletebutton = document.getElementById('deletetextareablock')
        deletebutton.onclick = () => {
            const index = this.api.blocks.getCurrentBlockIndex()
            this.api.blocks.delete(index)
            $('#editInputModal').modal('hide');

        };
    }


    applyLabelPosition() {
        if (this.data.labelPosition === 'top') {
            this.wrapper.classList.add('flex-column');
            this.wrapper.classList.remove('align-items-center');
            this.labelInput.style.padding = "0.4em 0";
            this.labelInput.style.marginBottom = '0.4em';
        } else {
            this.wrapper.classList.remove('flex-column');
            this.wrapper.classList.add('align-items-center');
        }
    }

    applyStyles() {
        this.inputElement.style.width = this.data.inputwidth + "%";
        this.inputElement.style.fontSize = this.data.inputSize;
        this.inputElement.style.fontFamily = this.data.inputfamily;
        this.inputElement.placeholder = this.data.inputplaceholder;
        this.labelInput.style.fontSize = this.data.textSize;
        const textSizeValue = parseInt(this.data.textSize, 10);
        this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;
        this.labelInput.style.fontFamily = this.data.labelfamily;
        this.labelInput.textContent = this.data.labelTextInput;
        this.labelInput.style.fontWeight = this.data.labelBold;
        this.labelInput.style.fontStyle = this.data.labelItalic;
    }
}

$(document).ready(function () {


    $('#networkOverlay').hide();


    // $('#digitalforms').addClass('active');


    const tempname = document.getElementById('docName')

    if (tempname) {

        tempname.addEventListener('keydown', (event) => {

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

    }

    var data = document.getElementById('pdfschema').value;
    var editorInstancesData = JSON.parse(data);

    editorInstancesData.forEach((editorData) => {
        createEditorInstance(editorData);
    });

    createRolesGroup();
    // fieldConfig(components);
    var clientSelect = document.getElementById("ClientSelect");

    clientSelect.addEventListener("change", function () {

        const selectedIndex = clientSelect.selectedIndex;
        if (selectedIndex > 1) {


            $(".singlerole").addClass('d-none');


        } else {

            $(".singlerole").removeClass('d-none');
        }
    });
});
document.getElementById('add-page-btn').addEventListener('click', () => {

    createEditorInstance();
});

document.getElementById('delete-page-btn').addEventListener('click', deleteActivePage);

function createEditorInstance(data = false) {
    var pageContainer = document.getElementById('pdf-container');
    let editorDiv = document.createElement('div');
    let uniqueId = Date.now();
    editorDiv.id = `editor-${uniqueId}`;
    editorDiv.style.width = '96%';
    editorDiv.style.maxWidth = '210mm';
    editorDiv.style.backgroundColor = 'white';
    editorDiv.style.border = 'none';
    editorDiv.style.margin = '2%';
    editorDiv.style.overflow = 'hidden';
    // editorDiv.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
    editorDiv.style.marginLeft = 'auto';
    editorDiv.style.marginRight = 'auto';
    editorDiv.className = "something";
    editorDiv.style.borderBottom = "2px solid #E2E6EAFF";
    pageContainer.appendChild(editorDiv);


    let newEditor = new EditorJS({
        holder: editorDiv.id,
        tools: {
            paragraph: ParagraphBlock,
            // fontFamily: { class: FontFamilyInlineTool, inlineToolbar: false },
            // fontSize: { class: FontSizeInlineTool, inlineToolbar: false },
            table: TableBlock,
            header: HeaderBlock,
            check: CheckBoxBlock,
            radio: RadioBlock,
            inputfield: InputBlock,
            select: SelectTool,
            image: ImageBlock,
            button: ButtonBlock,
            onlytext: OnlyTextBlock,
            signature: { class: SignatureBlock, inlineToolbar: true },
            eseal: EsealBlock,
            textarea: TextAreaBlock,
            dummy: dummyBlock
        },
        defaultBlock: 'header',
        onReady: async () => {
            new DragDrop(newEditor);


            if (data) {
                await newEditor.render(data);

                if (editorInstances.length >= 1) {

                    editorInstance = editorInstances[0];

                }
            }
            else if (editorInstances.length > 1) {

                newEditor.blocks.insert("dummy", {}, {}, 1);
                newEditor.blocks.delete(0);




            }


        },
        onChange: (api, event) => {

            checkHeightLimit(editorDiv, newEditor);
        }
    });


    editorDiv.addEventListener('dragover', function (event) {
        event.preventDefault();
        editorInstance = newEditor;

    });

    editorDiv.addEventListener('dragenter', function (event) {
        editorInstance = newEditor;
        isdrag = true;

    });
    editorDiv.addEventListener('dragleave', function (event) {
        isdrag = false;

    });

    editorDiv.addEventListener('drop', function (event) {
        event.preventDefault();
        editorInstance = newEditor;
    });


    editorDiv.addEventListener('click', () => {
        editorInstance = newEditor;

    });
    editorInstances.push(newEditor);
    setheight(editorDiv);
}
function setheight(editorDiv) {
    const pdfcontainer = document.getElementById('pdf-container');
    const pdfstyle = window.getComputedStyle(pdfcontainer).width;
    const computedStyle = window.getComputedStyle(editorDiv);
    const editorWidth = parseFloat(computedStyle.width);
    window.eWidth = editorWidth
    const aspectRatio = 841.89 / 595.28;
    const editorHeight = 1108.4;
    editorDiv.style.height = editorHeight + 'px';
    editorDiv.style.maxHeight = editorHeight + 'px';
    window.eHeight = editorHeight;
}

function checkHeightLimit(editorDiv, editorInstance) {
    const currentHeight = editorDiv.scrollHeight;

    if (currentHeight > (window.eHeight + 250)) {
        console.log('Page height limit exceeded. Moving blocks to the next page...');
        moveBlocksToNextPage(editorInstance);
    }
}


function moveBlocksToNextPage(currentEditor) {
    currentEditor.save().then(async (outputData) => {

        let nextEditor = await getNextEditor(currentEditor);


        if (!nextEditor) {
            await createEditorInstance();
            nextEditor = editorInstances[editorInstances.length - 1];
            nextEditor.isReady
                .then(() => {


                    const lastBlock = outputData.blocks.pop();


                    currentEditor.render({
                        blocks: outputData.blocks
                    });


                    nextEditor.save().then((nextEditorData) => {
                        if (nextEditorData && nextEditorData.blocks) {
                            nextEditor.render({
                                blocks: [lastBlock, ...nextEditorData.blocks]
                            });
                        } else {
                            console.error("nextEditorData.blocks is undefined");
                        }
                    }).catch((error) => {
                        console.error("Error saving editor data:", error);
                    });



                    const nextEditorDiv = document.getElementById(nextEditor.configuration.holder);
                    const nextEditorHeight = nextEditorDiv.scrollHeight;

                    if (nextEditorHeight > (window.eHeight + 250)) {
                        console.log('Next page height limit exceeded. Moving blocks to a new page...');
                        moveBlocksToNextPage(nextEditor);
                    }


                })
                .catch((error) => {
                    console.error("Error initializing the next editor:", error);
                });
        }

        else {

            const lastBlock = outputData.blocks.pop();


            currentEditor.render({
                blocks: outputData.blocks
            });


            nextEditor.save().then((nextEditorData) => {
                if (nextEditorData && nextEditorData.blocks) {
                    nextEditor.render({
                        blocks: [lastBlock, ...nextEditorData.blocks]
                    });
                } else {
                    console.error("nextEditorData.blocks is undefined");
                }
            }).catch((error) => {
                console.error("Error saving editor data:", error);
            });



            const nextEditorDiv = document.getElementById(nextEditor.configuration.holder);
            const nextEditorHeight = nextEditorDiv.scrollHeight;

            if (nextEditorHeight > (window.eHeight + 250)) {
                console.log('Next page height limit exceeded. Moving blocks to a new page...');
                moveBlocksToNextPage(nextEditor);
            }
        }



    });
}

function getNextEditor(currentEditor) {
    const currentIndex = editorInstances.findIndex(editor => editor === currentEditor);
    return editorInstances[currentIndex + 1] || null;
}





function fieldConfig(schema, roleindex, rolenumber) {

    console.log(schema)
    const container = document.getElementById(roleindex);
    var rolecontentdiv = document.createElement('div');
    rolecontentdiv.style.display = 'flex';
    rolecontentdiv.style.flexDirection = 'row';
    rolecontentdiv.style.flexWrap = 'wrap';

    container.appendChild(rolecontentdiv);

    schema.forEach((element, index) => {

        if (element.type == "text") {

            const elementdiv = document.createElement('div');
            elementdiv.style.width = '47%';
            elementdiv.style.height = '15%';
            elementdiv.style.marginRight = '3%';
            rolecontentdiv.appendChild(elementdiv);

            const label = document.createElement('label');
            label.htmlFor = element.id;
            label.textContent = (element.id).split('_')[0];
            label.style.color = 'black';
            label.style.fontSize = '15px';
            label.style.width = '28%';

            const label1 = document.createElement('label');
            label1.textContent = ':'
            label1.style.fontSize = '15px';

            const input = document.createElement('input');
            input.type = 'text';
            input.id = element.id;
            preFilledData.id = "";
            input.style.fontSize = '14px';
            input.style.border = '1px solid black';
            input.style.borderRadius = '5px';
            input.style.width = '65%';
            const space = document.createTextNode('\u00A0\u00A0\u00A0');

            elementdiv.appendChild(label);
            elementdiv.appendChild(label1);
            elementdiv.appendChild(space);
            elementdiv.appendChild(input);

            input.addEventListener('input', function () {

                const pdfInput = document.querySelector('#pdf-container [id="' + element.id + '"]');
                if (pdfInput) {
                    pdfInput.value = input.value;
                    componentsdata.forEach(obj => {
                        if (obj.id === element.id && obj.type === "text") {
                            obj.content = input.value;
                        }
                    });
                    preFilledData.id = input.value;
                }
            });

        }
        else if (element.type == "date") {

            const elementdiv = document.createElement('div');
            elementdiv.style.width = '47%';
            elementdiv.style.height = '15%';
            elementdiv.style.marginRight = '3%';
            rolecontentdiv.appendChild(elementdiv);

            const label = document.createElement('label');
            label.htmlFor = element.id;
            label.textContent = element.id.split('_')[0];
            label.style.color = 'black';
            label.style.fontSize = '15px';
            label.style.width = '28%';

            const label1 = document.createElement('label');
            label1.textContent = ':'
            label1.style.fontSize = '15px';

            const input = document.createElement('input');
            input.type = 'date';
            input.id = element.id;
            preFilledData.id = "";
            input.style.fontSize = '14px';
            input.style.border = '1px solid black';
            input.style.borderRadius = '5px';
            input.style.width = '65%';
            const space = document.createTextNode('\u00A0\u00A0\u00A0');

            elementdiv.appendChild(label);
            elementdiv.appendChild(label1);
            elementdiv.appendChild(space);
            elementdiv.appendChild(input);

            input.addEventListener('input', function () {

                const pdfInput = document.querySelector('#pdf-container [id="' + element.id + '"]');
                if (pdfInput) {
                    pdfInput.value = input.value;
                    pdfInput.classList.add('has-value');
                    componentsdata.forEach(obj => {
                        if (obj.id === element.id && obj.type === "date") {
                            obj.content = input.value;
                        }
                    });
                    preFilledData.id = input.value;
                }
            });
        }
        else if (element.type == "select") {

            const elementdiv = document.createElement('div');
            elementdiv.style.width = '47%';
            elementdiv.style.height = '15%';
            elementdiv.style.marginRight = '3%';
            rolecontentdiv.appendChild(elementdiv);

            const label = document.createElement('label');
            label.htmlFor = element.id;
            label.textContent = element.id.split('_')[0];
            label.style.color = 'black';
            label.style.fontSize = '15px';
            label.style.width = '28%';

            const label1 = document.createElement('label');
            label1.textContent = ':'
            label1.style.fontSize = '15px';

            const input = document.createElement('select');

            input.id = element.id;
            preFilledData.id = "";
            input.style.fontSize = '14px';
            input.style.border = '1px solid black';
            input.style.borderRadius = '5px';
            input.style.width = '65%';

            var optionElement = document.createElement('option');
            optionElement.value = "Select Option";
            optionElement.textContent = "Select Option";
            input.appendChild(optionElement);

            (element.options).forEach(optionText => {
                var optionElement = document.createElement('option');
                optionElement.value = optionText;
                optionElement.textContent = optionText;
                input.appendChild(optionElement);
            });
            const space = document.createTextNode('\u00A0\u00A0\u00A0');

            elementdiv.appendChild(label);
            elementdiv.appendChild(label1);
            elementdiv.appendChild(space);
            elementdiv.appendChild(input);

            input.addEventListener('input', function () {

                const pdfInput = document.querySelector('#pdf-container [id="' + element.id + '"]');
                if (pdfInput) {
                    pdfInput.selectedIndex = input.selectedIndex;
                    pdfInput.classList.add('has-value');
                    // componentsdata[index].content = input.selectedIndex;
                    componentsdata.forEach(obj => {
                        if (obj.id === element.id && obj.type === "select") {
                            obj.content = input.selectedIndex;
                        }
                    });
                    preFilledData.id = input.value;
                }
            });

        }
        else if (element.type === "imagefield") {

            const elementdiv = document.createElement('div');
            elementdiv.style.width = '47%';
            elementdiv.style.height = '15%';
            elementdiv.style.marginRight = '3%';
            rolecontentdiv.appendChild(elementdiv);

            const label = document.createElement('label');
            label.htmlFor = element.id;
            label.textContent = element.id.split('_')[0];
            label.style.color = 'black';
            label.style.fontSize = '15px';
            label.style.width = '28%';

            const label1 = document.createElement('label');
            label1.textContent = ':';
            label1.style.fontSize = '15px';

            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = element.id;
            preFilledData.id = "";
            fileInput.accept = 'image/*';
            fileInput.style.fontSize = '14px';
            fileInput.style.border = '1px solid black';
            fileInput.style.borderRadius = '5px';
            fileInput.style.width = '65%';

            const deleteIcon = document.createElement('button');
            deleteIcon.type = 'button';
            deleteIcon.textContent = '🗑️';
            deleteIcon.style.border = 'none';
            deleteIcon.style.background = 'transparent';
            deleteIcon.style.cursor = 'pointer';
            deleteIcon.style.fontSize = '18px';
            deleteIcon.style.marginLeft = '10px';
            deleteIcon.style.display = 'none';


            fileInput.addEventListener('change', () => {
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const reader = new FileReader();

                    reader.onload = (e) => {

                        deleteIcon.style.display = 'inline';
                        fileInput.style.width = '55%';
                        const pdfInput = document.querySelector('#pdf-container [id="' + element.id + '"]');
                        if (pdfInput) {
                            pdfInput.src = e.target.result;
                            pdfInput.style.display = 'block';
                            pdfInput.nextElementSibling.style.display = 'none';

                            componentsdata.forEach(obj => {
                                if (obj.id === element.id && obj.type === "imagefield") {
                                    obj.content = e.target.result;
                                }
                            });
                            preFilledData.id = e.target.result;
                        }
                    };

                    reader.readAsDataURL(file);

                } else {

                    deleteIcon.style.display = 'none';
                }
            });

            deleteIcon.onclick = () => {
                fileInput.value = '';
                const pdfInput = document.querySelector('#pdf-container [id="' + element.id + '"]');
                pdfInput.style.display = 'none';
                pdfInput.nextElementSibling.style.display = 'block';
                deleteIcon.style.display = 'none';
                fileInput.style.width = '65%';
                componentsdata.forEach(obj => {
                    if (obj.id === element.id && obj.type === "imagefield") {
                        obj.content = false;
                    }
                });
            };

            const space = document.createTextNode('\u00A0\u00A0\u00A0');

            elementdiv.appendChild(label);
            elementdiv.appendChild(label1);
            elementdiv.appendChild(space);
            elementdiv.appendChild(fileInput);
            elementdiv.appendChild(deleteIcon);

        }
        else if (element.type == "Signature") {
            listCoordinates[rolenumber] = JSON.parse(JSON.stringify(signCoordinates));
        }
    });
    schema.forEach((element, index) => {

        if (element.type == "checkbox") {
            const elementdiv = document.createElement('div');
            elementdiv.style.width = '90%';
            elementdiv.style.height = '15%';
            elementdiv.style.display = 'flex';
            elementdiv.style.flexDirection = 'row';
            elementdiv.style.marginRight = '3%';
            rolecontentdiv.appendChild(elementdiv);

            const label = document.createElement('label');
            label.htmlFor = element.id;
            label.textContent = element.id.split('_')[0];
            label.style.color = 'black';
            label.style.fontSize = '15px';
            label.style.width = '28%';
            label.style.margin = '0';
            label.style.marginLeft = '1%';
            label.style.display = 'flex';
            label.style.alignItems = 'center';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = element.id;

            checkbox.classList.add('input-field');


            elementdiv.appendChild(checkbox);
            elementdiv.appendChild(label);

            checkbox.addEventListener('change', () => {
                const pdfInput = document.querySelector('#pdf-container [id="' + element.id + '"]');

                if (checkbox.checked) {
                    if (pdfInput) {
                        pdfInput.checked = true;
                        componentsdata.forEach(obj => {
                            if (obj.id === element.id && obj.type === "checkbox") {
                                obj.content = true;
                            }
                        });
                    }
                    checkbox.classList.add('checked');
                } else {
                    if (pdfInput) {
                        pdfInput.checked = false;
                        componentsdata.forEach(obj => {
                            if (obj.id === element.id && obj.type === "checkbox") {
                                obj.content = false;
                            }
                        });
                    }
                    checkbox.classList.remove('checked');
                }
            });
        }




    });

    const excludedValues = ["text", "date", "select", "imagefield"];

    const noExcludedValues = !schema.some(obj => excludedValues.includes(obj.type));

    if (noExcludedValues) {
        var txt = document.createElement('p');
        txt.innerHTML = "No fillable fields available"
        txt.style.fontSize = '95%';
        rolecontentdiv.appendChild(txt)
    }
}


function createRolesGroup() {

    const modelObject = document.getElementById('modelobject').value;

    var rolesAvailable = JSON.parse(modelObject);
    console.log(typeof (rolesAvailable));

    numberOfRoles = rolesAvailable.length;
    const clientSelect = document.getElementById("ClientSelect");

    const rolesfields = document.getElementById('rolesFields');
    const rolesforFields = document.getElementById('rolesForFields');
    // rolesforFields.addEventListener('change', event => {
    //     var selectedValue = event.target.value;
    //     const parentDiv = document.getElementById('rolesFields');
    //     selectedValue = "#" + selectedValue;
    //     const targetDiv = parentDiv.querySelector(selectedValue);

    //     const allDivs = parentDiv.querySelectorAll(':scope > div');
    //     allDivs.forEach(div => {
    //         div.style.display = 'none';
    //     });
    //     targetDiv.style.display = 'flex';

    // });
    rolesAvailable.forEach((roleobj, index) => {
        const option = document.createElement("option");
        const option1 = document.createElement("option");
        option.value = roleobj.role.name;
        option1.value = `role${index + 1}`;
        option.textContent = roleobj.role.name;
        option1.textContent = roleobj.role.name;

        if (index === 0) {
            option.selected = true;
            option1.selected = true;
        }
        clientSelect.appendChild(option);


        const roleDiv = document.createElement('div');
        roleDiv.id = `role${index + 1}`;
        roleDiv.style.height = '100%';
        roleDiv.style.backgroundColor = 'rgba(247,249,251,255)';

        if ((index + 1) != 1) {
            roleDiv.style.display = 'none';
        } else {
            roleDiv.style.display = 'flex';
        }

        // roleDiv.style.flexDirection = 'row';
        roleDiv.style.flexDirection = 'column';
        // roleDiv.style.flexWrap = 'wrap';

        roleDiv.style.overflowY = 'auto';
        roleDiv.style.padding = '2%';


        const heading = document.createElement('h3');
        heading.style.width = '100%';
        heading.style.height = '10%';

        heading.style.textAlign = 'left';
        heading.style.color = 'black';
        heading.textContent = roleobj.role.name;

        roleDiv.appendChild(heading);

    });



    const rolesGroup = document.createElement('div');
    rolesGroup.className = 'roles-group';
    rolesGroup.style.height = 'auto';
    rolesGroup.style.backgroundColor = '#ffffff';
    rolesGroup.style.marginBottom = '16px';
    rolesGroup.style.padding = '20px 24px';
    rolesGroup.style.overflowY = 'auto';
    rolesGroup.style.borderRadius = '12px';
    rolesGroup.style.border = '1px solid #e2e8f0';
    rolesGroup.style.transition = 'all 0.2s ease';

    const roleNamesWithEseal = rolesAvailable
        .filter(item =>
            item.esealplaceHolderCoordinates &&
            item.esealplaceHolderCoordinates.signatureXaxis !== null
        )
        .map(item => item.role.name);
    const selectedOrganizations = {};



    rolesAvailable.forEach((roleobj, index) => {

        // var space1 = document.createElement('span');
        var space2 = document.createElement('span');
        var space3 = document.createElement('span');
        // space1.innerHTML = ':';
        space2.innerHTML = ':';
        space3.innerHTML = ':';

        const ele = document.createElement('h5');
        ele.textContent = `Signer ${index + 1} : ${roleobj.role.name}`;
        ele.style.marginTop = '0';
        ele.style.marginBottom = '16px';
        ele.style.fontSize = '0.9375rem';
        ele.style.color = '#0F172A';
        ele.style.fontWeight = '600';
        ele.style.display = 'flex';
        ele.style.alignItems = 'center';
        ele.style.gap = '8px';
        ele.style.paddingBottom = '12px';
        ele.style.borderBottom = '1px solid #f1f5f9';

        rolesGroup.appendChild(ele);

        const roleContainer = document.createElement('div');
        roleContainer.className = 'role-container';
        roleContainer.style.display = 'flex';
        roleContainer.style.flexDirection = 'row';
        roleContainer.style.alignItems = 'flex-start';
        roleContainer.style.gap = '16px';
        roleContainer.style.flexWrap = 'wrap';
        roleContainer.style.marginLeft = '0';
        roleContainer.style.padding = '12px 0';


        const emailDiv = document.createElement('div')
        emailDiv.style.display = 'flex';
        emailDiv.style.flexDirection = 'column';
        emailDiv.style.flex = '1';
        emailDiv.style.minWidth = '280px';
        emailDiv.style.gap = '4px';

        const rowDiv = document.createElement('div');
        rowDiv.style.display = 'flex';
        rowDiv.style.flexDirection = 'row';
        rowDiv.style.alignItems = 'center';
        rowDiv.style.gap = '12px';

        const emailLabel = document.createElement('label');
        emailLabel.textContent = 'Email';
        emailLabel.htmlFor = `email-${roleobj.role.name}`;
        emailLabel.style.margin = '0';
        emailLabel.style.minWidth = '50px';
        emailLabel.style.fontSize = '0.875rem';
        emailLabel.style.fontWeight = '500';
        emailLabel.style.color = '#475569';


        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.id = `RoleEmail`;
        emailInput.name = `email-${roleobj.role.name}`;
        emailInput.style.fontSize = '0.875rem';
        emailInput.style.flex = '1';
        emailInput.style.padding = '10px 14px';
        emailInput.classList.add('form-control');
        emailInput.placeholder = 'Enter signer email address';

        const errorSpan = document.createElement('span');
        errorSpan.className = 'signer-email-error';
        errorSpan.style.color = '#ef4444';
        errorSpan.style.fontSize = '0.75rem';
        errorSpan.style.marginLeft = '62px';
        errorSpan.style.minHeight = '20px';
        errorSpan.style.display = 'block';
        errorSpan.classList.add('error-hidden');

        const alternatediv = document.createElement('div');

        alternatediv.style.display = "none";

        rowDiv.appendChild(emailLabel);
        rowDiv.appendChild(space3);
        rowDiv.appendChild(emailInput);

        emailDiv.appendChild(rowDiv);
        emailDiv.appendChild(errorSpan);
        emailDiv.appendChild(alternatediv);
        roleContainer.appendChild(emailDiv);

        const selectElement = document.createElement('select');


        selectElement.className = 'custom-select';
        selectElement.style.minWidth = '180px';
        selectElement.style.fontSize = '80%';
        selectElement.style.marginBottom = '1%';
        selectElement.style.padding = '0.3rem';

        const options = [
            { value: 'ChooseOrganization', text: 'Choose Account' },

        ];

        options.forEach(optionData => {
            const option = document.createElement('option');
            option.value = optionData.value;
            option.textContent = optionData.text;
            selectElement.appendChild(option);
        });


        const loader = document.createElement('div');
        loader.className = 'orgloader';
        loader.style.width = '18px';
        loader.style.height = '18px';
        loader.style.border = '2px solid #e2e8f0';
        loader.style.borderTop = '2px solid #059669';
        loader.style.borderRadius = '50%';
        loader.style.animation = 'spin 0.8s linear infinite';
        loader.style.display = 'none';
        loader.style.flexShrink = '0';


        roleContainer.appendChild(selectElement);
        roleContainer.appendChild(loader);

        rolesGroup.appendChild(roleContainer);


        emailInput.addEventListener('blur', (event) => {
            loader.style.display = 'block';
            let iseseal = document.getElementById(`Eseal_${roleobj.role.name}`);
            let esealflag = false;

            if (iseseal) {

                esealflag = true;

            }
            selectElement.innerHTML = "";
            const options = [
                { value: 'ChooseOrganization', text: 'Choose Account' },
            ];

            options.forEach(optionData => {
                const option = document.createElement('option');
                option.value = optionData.value;
                option.textContent = optionData.text;
                selectElement.appendChild(option);
            });
            sendEmailToGetThumbnail(emailInput.value)
                .then(orgsAndIds => {
                    if (orgsAndIds) {
                        if (numberOfRoles == 1 && emailInput.value == currentUserEmail) {
                            errorSpan.textContent = 'User cannot send a Document to themselves.';
                            errorSpan.classList.remove('error-hidden');
                        } else {
                            const inputs = rolesGroup.querySelectorAll('input');
                            const values = Array.from(inputs)
                                .map(input => input.value.trim())
                                .filter(value => value !== '');

                            const hasDuplicates = values.length !== new Set(values).size;


                            const selectorgroles = rolesGroup.querySelectorAll('select');
                            const dataIdSet = new Set();

                            selectorgroles.forEach(select => {
                                const options = select.options;
                                if (options.length > 1) {
                                    const secondOption = options[1];
                                    const dataId = secondOption.getAttribute('data-id');
                                    if (dataId) {
                                        dataIdSet.add(dataId);
                                    }
                                }
                            });

                            const targetValue = orgsAndIds["SELF"][1];

                            if (hasDuplicates) {
                                swal({
                                    title: "Info",
                                    text: "Roles within the same document cannot have the same signatory.",
                                    type: "info",
                                });
                                errorSpan.textContent = '';
                                errorSpan.classList.add('error-hidden');
                            }
                            else if (dataIdSet.has(targetValue)) {
                                swal({
                                    title: "Info",
                                    text: "Email of the subscriber already present the same document.",
                                    type: "info",
                                });
                                errorSpan.textContent = '';
                                errorSpan.classList.add('error-hidden');
                            }

                            else {
                                var option1 = document.createElement('option');
                                option1.value = "self";
                                option1.textContent = "Self";
                                option1.setAttribute('data-id', orgsAndIds["SELF"][1]);

                                if (esealflag || orgsAndIds["SELF"][0] != emailInput.value) {
                                    option1.style.display = 'none';
                                }
                                selectElement.appendChild(option1);
                                for (const [orgName, org] of Object.entries(orgsAndIds)) {
                                    if (orgName !== "SELF") {
                                        const option = document.createElement('option');
                                        option.value = org[0];
                                        option.textContent = orgName;
                                        option.setAttribute('data-id', org[1]);

                                        selectElement.appendChild(option);
                                    }

                                }

                                errorSpan.textContent = '';
                                errorSpan.classList.add('error-hidden');
                            }
                        }

                    } else {
                        console.log("No organizations found or success flag was present.");
                        errorSpan.textContent = 'Invalid email address';
                        errorSpan.classList.remove('error-hidden');

                    }
                    loader.style.display = 'none';
                })
                .catch(error => {
                    loader.style.display = 'none';
                    console.error("Error fetching organization details:", error);
                });

        });

        selectElement.addEventListener('change', async function () {
            const selectedOption = this.options[this.selectedIndex];
            const selectedValue = selectedOption.value;
            const selectedDataId = selectedOption.getAttribute('data-id');
            if (selectedValue == "self" || selectedValue == "ChooseOrganization") {
                selectedOrganizations[roleobj.role.name] = selectedValue;
            } else {

                for (const esealRole of roleNamesWithEseal) {
                    if (esealRole !== roleobj.role.name && selectedOrganizations[esealRole] === selectedValue) {


                        swal({
                            type: 'info',
                            title: 'E-seal Conflict',
                            text: `This organization is already used by ${esealRole} who has an e-seal. Only one e-seal per organization is allowed.`,
                        }, () => {


                            selectElement.selectedIndex = 0;



                        })

                        return;
                    }
                }


                selectedOrganizations[roleobj.role.name] = selectedValue;
                var res = await handle_delegation_orgid_suid(selectedValue, selectedDataId, emailInput.value, index)



                if (index == 0) {
                    if (res.delegateeid != "") {
                        selectElement.innerHTML = "";
                        const options = [
                            { value: 'ChooseOrganization', text: 'Choose Account' },
                        ];

                        options.forEach(optionData => {
                            const option = document.createElement('option');
                            option.value = optionData.value;
                            option.textContent = optionData.text;
                            selectElement.appendChild(option);
                        });
                    }
                } else {
                    if (res.iscancelled == true) {

                        selectElement.innerHTML = "";
                        const options = [
                            { value: 'ChooseOrganization', text: 'Choose Account' },
                        ];

                        options.forEach(optionData => {
                            const option = document.createElement('option');
                            option.value = optionData.value;
                            option.textContent = optionData.text;
                            selectElement.appendChild(option);
                        });
                    }
                    else {
                        alternatediv.setAttribute("data-delegates", JSON.stringify(res.listdata));

                        alternatediv.setAttribute("data-delegateid", res.delegateeid);
                    }
                }

            }



        });

    });


    (document.getElementById('roles')).appendChild(rolesGroup);


    rolesAvailable.forEach((roleobj, index) => {
        console.log(roleobj.annotationsList)
        console.log(typeof (roleobj.annotationsList))
        var roleindex = `role${index + 1}`
        // fieldConfig(JSON.parse(roleobj.annotationsList), roleindex, index)
    });


}


function addSignatories() {

    var parentdiv = document.getElementById('roles');
    var roleGroupDivs = parentdiv.querySelectorAll('div.roles-group')
    const count = roleGroupDivs.length;

    if (count < 10) {
        const modelObject = document.getElementById('modelobject').value;

        var rolesAvailable = JSON.parse(modelObject);
        console.log(typeof (rolesAvailable));

        const rolesGroup = document.createElement('div');
        rolesGroup.className = 'roles-group';
        rolesGroup.style.height = 'auto';
        rolesGroup.style.backgroundColor = 'rgba(247, 249, 251, 1)';
        rolesGroup.style.marginBottom = '2%';
        rolesGroup.style.padding = '2%';
        rolesGroup.style.overflowY = 'auto';

        rolesAvailable.forEach((roleobj, index) => {

            // var space1 = document.createElement('span');
            var space2 = document.createElement('span');
            var space3 = document.createElement('span');
            // space1.innerHTML = ':';
            space2.innerHTML = ':';
            space3.innerHTML = ':';

            const ele = document.createElement('h5');
            ele.textContent = `Signer ${index + 1} : ${roleobj.role.name}`;
            ele.style.marginTop = '0';
            rolesGroup.appendChild(ele);

            const roleContainer = document.createElement('div');
            roleContainer.className = 'role-container';
            roleContainer.style.display = 'flex';
            roleContainer.style.flexDirection = 'row';
            roleContainer.style.alignItems = 'flex-start';
            roleContainer.style.gap = '16px';
            roleContainer.style.flexWrap = 'wrap';
            roleContainer.style.marginLeft = '0';
            roleContainer.style.padding = '12px 0';


            const emailDiv = document.createElement('div')
            emailDiv.style.display = 'flex';
            emailDiv.style.flexDirection = 'column';
            emailDiv.style.flex = '1';
            emailDiv.style.minWidth = '280px';
            emailDiv.style.gap = '4px';

            const rowDiv = document.createElement('div');
            rowDiv.style.display = 'flex';
            rowDiv.style.flexDirection = 'row';
            rowDiv.style.alignItems = 'center';
            rowDiv.style.gap = '12px';

            const emailLabel = document.createElement('label');
            emailLabel.textContent = 'Email';
            emailLabel.htmlFor = `email-${roleobj.role.name}`;
            emailLabel.style.margin = '0';
            emailLabel.style.minWidth = '50px';
            emailLabel.style.fontSize = '0.875rem';
            emailLabel.style.fontWeight = '500';
            emailLabel.style.color = '#475569';


            const emailInput = document.createElement('input');
            emailInput.type = 'email';
            emailInput.id = `RoleEmail`;
            emailInput.name = `email-${roleobj.role.name}`;
            emailInput.style.fontSize = '0.875rem';
            emailInput.style.flex = '1';
            emailInput.style.padding = '10px 14px';
            emailInput.classList.add('form-control');
            emailInput.placeholder = 'Enter signer email address';


            const errorSpan = document.createElement('span');
            errorSpan.className = 'signer-email-error';
            errorSpan.style.color = '#ef4444';
            errorSpan.style.fontSize = '0.75rem';
            errorSpan.style.marginLeft = '62px';
            errorSpan.style.minHeight = '20px';
            errorSpan.style.display = 'block';
            errorSpan.classList.add('error-hidden');

            const alternatediv = document.createElement('div');

            alternatediv.style.display = "none";

            rowDiv.appendChild(emailLabel);
            rowDiv.appendChild(space3);
            rowDiv.appendChild(emailInput);

            emailDiv.appendChild(rowDiv);
            emailDiv.appendChild(errorSpan);
            emailDiv.appendChild(alternatediv);

            roleContainer.appendChild(emailDiv);
            const selectElement = document.createElement('select');


            selectElement.className = 'custom-select';
            selectElement.style.minWidth = '180px';
            selectElement.style.fontSize = '80%';
            selectElement.style.marginBottom = '1%';
            selectElement.style.padding = '0.3rem';

            const options = [
                { value: 'ChooseOrganization', text: 'Choose Account' },
            ];

            options.forEach(optionData => {
                const option = document.createElement('option');
                option.value = optionData.value;
                option.textContent = optionData.text;
                selectElement.appendChild(option);
            });

            const loader = document.createElement('div');
            loader.className = 'orgloader';
            loader.style.width = '18px';
            loader.style.height = '18px';
            loader.style.border = '2px solid #e2e8f0';
            loader.style.borderTop = '2px solid #059669';
            loader.style.borderRadius = '50%';
            loader.style.animation = 'spin 0.8s linear infinite';
            loader.style.display = 'none';
            loader.style.flexShrink = '0';

            roleContainer.appendChild(selectElement);
            roleContainer.appendChild(loader);


            rolesGroup.appendChild(roleContainer);

            emailInput.addEventListener('blur', (event) => {
                // sendEmailToGetThumbnail(emailInput.value);
                loader.style.display = 'block';
                selectElement.innerHTML = "";
                const options = [
                    { value: 'ChooseOrganization', text: 'Choose Account' },
                ];
                let iseseal = document.getElementById(`Eseal_${roleobj.role.name}`);
                let esealflag = false;

                if (iseseal) {

                    esealflag = true;


                }

                options.forEach(optionData => {
                    const option = document.createElement('option');
                    option.value = optionData.value;
                    option.textContent = optionData.text;
                    selectElement.appendChild(option);
                });
                sendEmailToGetThumbnail(emailInput.value)
                    .then(orgsAndIds => {
                        if (orgsAndIds) {
                            if (numberOfRoles == 1 && emailInput.value == currentUserEmail) {
                                errorSpan.textContent = 'User cannot send a Document to themselves.';
                                errorSpan.classList.remove('error-hidden');
                            } else {
                                const inputs = rolesGroup.querySelectorAll('input');
                                const values = Array.from(inputs)
                                    .map(input => input.value.trim())
                                    .filter(value => value !== '');

                                const hasDuplicates = values.length !== new Set(values).size;

                                const selectorgroles = rolesGroup.querySelectorAll('select');
                                const dataIdSet = new Set();

                                selectorgroles.forEach(select => {
                                    const options = select.options;
                                    if (options.length > 1) {
                                        const secondOption = options[1];
                                        const dataId = secondOption.getAttribute('data-id');
                                        if (dataId) {
                                            dataIdSet.add(dataId);
                                        }
                                    }
                                });

                                const targetValue = orgsAndIds["SELF"][1];

                                if (hasDuplicates) {
                                    swal({
                                        title: "Info",
                                        text: "Roles within the same document cannot have the same signatory.",
                                        type: "info",
                                    });
                                    errorSpan.textContent = '';
                                    errorSpan.classList.add('error-hidden');
                                }
                                else if (dataIdSet.has(targetValue)) {
                                    swal({
                                        title: "Info",
                                        text: "Email of the subscriber already present the same document.",
                                        type: "info",
                                    });
                                    errorSpan.textContent = '';
                                    errorSpan.classList.add('error-hidden');
                                }
                                else {
                                    var option1 = document.createElement('option');
                                    option1.value = "self";
                                    option1.textContent = "Self";
                                    option1.setAttribute('data-id', orgsAndIds["SELF"][1]);

                                    if (esealflag || orgsAndIds["SELF"][0] != emailInput.value) {
                                        option1.style.display = 'none';
                                    }

                                    selectElement.appendChild(option1);
                                    for (const [orgName, org] of Object.entries(orgsAndIds)) {
                                        if (orgName !== "SELF") {
                                            const option = document.createElement('option');
                                            option.value = org[0];
                                            option.textContent = orgName;
                                            option.setAttribute('data-id', org[1]);

                                            selectElement.appendChild(option);
                                        }

                                    }

                                    errorSpan.textContent = '';
                                    errorSpan.classList.add('error-hidden');
                                }
                            }

                        } else {
                            console.log("No organizations found or success flag was present.");
                        }
                        loader.style.display = 'none';
                    })
                    .catch(error => {
                        loader.style.display = 'none';
                        console.error("Error fetching organization details:", error);
                    });

            });

            selectElement.addEventListener('change', async function () {
                const selectedOption = this.options[this.selectedIndex];
                const selectedValue = selectedOption.value;
                const selectedDataId = selectedOption.getAttribute('data-id');
                if (selectedValue == "self") {

                } else {
                    var res = await handle_delegation_orgid_suid(selectedValue, selectedDataId, emailInput.value, index);



                    if (index == 0) {
                        if (res.delegateeid != "") {
                            selectElement.innerHTML = "";
                            const options = [
                                { value: 'ChooseOrganization', text: 'Choose Account' },
                            ];

                            options.forEach(optionData => {
                                const option = document.createElement('option');
                                option.value = optionData.value;
                                option.textContent = optionData.text;
                                selectElement.appendChild(option);
                            });
                        }
                    } else {
                        if (res.iscancelled == true) {

                            selectElement.innerHTML = "";
                            const options = [
                                { value: 'ChooseOrganization', text: 'Choose Account' },
                            ];

                            options.forEach(optionData => {
                                const option = document.createElement('option');
                                option.value = optionData.value;
                                option.textContent = optionData.text;
                                selectElement.appendChild(option);
                            });
                        }
                        else {
                            alternatediv.setAttribute("data-delegates", JSON.stringify(res.listdata));

                            alternatediv.setAttribute("data-delegateid", res.delegateeid);
                        }

                    }
                }



            });
        });



        (document.getElementById('roles')).appendChild(rolesGroup);
        const deleteButton = document.createElement('button');

        deleteButton.style.minWidth = '10%';

        deleteButton.style.whiteSpace = 'nowrap';
        deleteButton.style.borderRadius = '5px';
        deleteButton.style.border = 'none';
        deleteButton.style.backgroundColor = 'red';
        deleteButton.style.color = 'white';
        deleteButton.style.float = 'right';
        deleteButton.style.marginRight = '1%';
        deleteButton.style.marginTop = '2%';
        deleteButton.style.fontSize = '85%';
        deleteButton.style.padding = "4px 10px";

        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => {
            rolesGroup.remove();
        });
        rolesGroup.appendChild(deleteButton)

        document.getElementById('roleblocks').scrollTop = document.getElementById('roleblocks').scrollHeight;

    }
    else {
        swal({
            title: "Info",
            text: "Requests can't be added more than 10.",
            type: "info",
        });
    }
}

var steps = document.querySelectorAll('.steps .circle');
var line = document.querySelector('.progress-bar .indicator');

function updateProgressBar(step, color) {
    steps.forEach((stepElement, index) => {
        stepElement.classList[index < step ? 'add' : 'remove']('active');
    });

    var width = ((step - 1) / (steps.length - 1)) * 100;
    line.style.width = width + '%';
    line.style.background = color;
}

function updateCircleColors(step, color) {
    steps.forEach((stepElement, index) => {
        stepElement.style.borderColor = index < step ? color : '#e0e0e0';
        stepElement.style.color = index < step ? color : '#e0e0e0';
    });
}

$("#nextButton").on("click", function (e) {
    e.preventDefault();

    const divs = document.querySelectorAll('#configurations > div');

    // Find the currently visible div (without the 'hide' class)
    const visibleDiv = Array.from(divs).find(div => !div.classList.contains('classshide'));

    if (visibleDiv) {
        const currentId = parseInt(visibleDiv.id);
        const nextId = currentId % 3 + 1;

        if (currentId === 1) {
            let shouldStop = false;
            const rolesGroups = document.querySelectorAll(".roles-group");
            rolesGroups.forEach((group) => {
                const customSelects = group.querySelectorAll(".custom-select");

                customSelects.forEach(customSelect => {
                    if (customSelect.value === "ChooseOrganization") {
                        shouldStop = true;
                        swal({
                            type: 'info',
                            title: 'Select Organization',
                            text: 'Please provide a valid email and select the organization.',
                        });
                        return;
                    }
                });
            });
            const daystocomplete = document.getElementById('signDays')
            if (daystocomplete) {
                if (daystocomplete.value === "") {
                    shouldStop = true;
                    swal({
                        type: 'info',
                        title: 'Info',
                        text: 'Signing Duration cannnot be Empty',
                    });
                    return;
                }
            }
            if (shouldStop) {
                return;
            }
            document.getElementById('prevButton').disabled = false;
        }

        visibleDiv.classList.add('classshide');

        const nextDiv = document.getElementById(nextId.toString());
        if (nextDiv) {
            nextDiv.classList.remove('classshide');
        }

        updateProgressBar(nextId, "#10b981");
        updateCircleColors(nextId, "#10b981");

        const leftCol = document.getElementById('stepContent');
        const rightCol = document.getElementById('pdfContainerMain');


        if (nextId === 3) {
            (document.getElementById('nextButton')).style.display = 'none';
            (document.getElementById('sendButton')).style.display = 'block';

            // const loader = document.createElement('div');
            // loader.className = 'loader';
            // loader.id = 'pdfloader';

            // rightCol.appendChild(loader);
            // document.getElementById('pdf-container').innerHTML = "";
            document.getElementById('pdf-container').style.backgroundColor = 'unset';

            document.documentElement.style.setProperty('--button-display', 'unset');



            // setTimeout(loadTemplate, 1000);



        }

        if (nextId === 2) {



            document.getElementById('pdf-container').style.backgroundColor = 'unset';
            rightCol.classList.remove('col-lg-4');
            leftCol.classList.remove('col-lg-8');

            rightCol.classList.add('col-lg-9');


            leftCol.classList.add('col-lg-3');

            document.documentElement.style.setProperty('--button-events', 'auto');


        }



    }


    window.scrollTo(0, 0);
});

$("#prevButton").on("click", function (e) {
    e.preventDefault();

    const divs = document.querySelectorAll('#configurations > div');

    // Find the currently visible div (without the 'hide' class)
    const visibleDiv = Array.from(divs).find(div => !div.classList.contains('classshide'));

    if (visibleDiv) {
        const currentId = parseInt(visibleDiv.id);
        const prevId = currentId === 1 ? divs.length : currentId - 1; // Circular navigation

        // Hide the current div
        visibleDiv.classList.add('classshide');

        // Show the previous div
        const prevDiv = document.getElementById(prevId.toString());
        if (prevDiv) {
            prevDiv.classList.remove('classshide');
        }

        updateProgressBar(prevId, "#10b981");
        updateCircleColors(prevId, "#10b981");

        const leftCol = document.getElementById('stepContent');
        const rightCol = document.getElementById('pdfContainerMain');


        if (currentId === 3) {
            (document.getElementById('nextButton')).style.display = 'block';
            (document.getElementById('sendButton')).style.display = 'none';
            // const loader = document.createElement('div');
            // loader.className = 'loader';
            // loader.id = 'pdfloader';

            // rightCol.appendChild(loader);

            // document.getElementById('pdf-container').innerHTML = "";
            document.getElementById('pdf-container').style.backgroundColor = 'unset';
            document.documentElement.style.setProperty('--button-display', 'none');

            // setTimeout(loadTemplate, 1000);
        }
        if (currentId === 2) {
            document.getElementById('prevButton').disabled = true;
            leftCol.classList.remove('col-lg-3')
            rightCol.classList.remove('col-lg-9')
            rightCol.classList.add('col-lg-4');
            leftCol.classList.add('col-lg-8');

            document.getElementById('pdf-container').style.backgroundColor = 'white';

            document.documentElement.style.setProperty('--button-events', 'none');
        }
    }

    window.scrollTo(0, 0);
});

$("#sendButton").on("click", async function (e) {
    e.preventDefault();
    $('#overlay').show();

    try {
        const modelObject = document.getElementById('modelobject').value;

        var rolesAvailable = JSON.parse(modelObject);

        const missingroles = [];
        rolesAvailable.forEach((item) => {

            var signaturediv = document.getElementById(`Signature_${item.role.name}`)
            if (!signaturediv) {
                missingroles.push(item.role.name)
            }

        })

        if (missingroles.length > 0) {
            $('#overlay').hide()
            swal({

                title: "Info",
                text:
                    `Signature annotations are missing for ${missingroles
                        .map(role => `${role}`)
                        .join(', ')}.`,
                type: "info",
            });
        }

        else {

            const sequence = document.getElementById('sequentialSign');
            const docName = document.getElementById('docName').value;
            const signDays = document.getElementById('signDays').value;

            const editors = document.querySelectorAll('div[id^="editor-"]');


            const editordiv = editors[0].getBoundingClientRect();
            scaleX = 595.28 / editordiv.width;
            scaleY = 841.89 / editordiv.height;


            const rolesGroups = document.querySelectorAll(".roles-group");

            var roleDataList = []
            rolesGroups.forEach((group, index) => {
                var emaillst = [];
                const inputValues = Array.from(group.querySelectorAll("input")).map((input) => {


                    var userobj = {};

                    const parentEle = input.parentElement;
                    const selectElement = (parentEle.parentElement).nextElementSibling;
                    const lastChild = (parentEle.parentElement).lastElementChild;
                    if (selectElement && selectElement.tagName === 'SELECT') {
                        const selectedValue = selectElement.value;
                        const selectedSuid = selectElement.selectedOptions[0].getAttribute('data-id');

                        const selectedText = selectElement.selectedOptions[0].innerHTML;
                        if (selectedText !== "Self") {
                            userobj.orgName = selectedText;
                            userobj.orgUid = selectedValue;
                            userobj.suid = selectedSuid;
                            userobj.accountType = "organization";
                            if (lastChild.getAttribute("data-delegateid") !== "" && lastChild.getAttribute("data-delegateid") !== null) {
                                userobj.HasDelegation = true;
                                userobj.DelegationId = lastChild.getAttribute("data-delegateid");
                                userobj.AlternateSignatories = lastChild.getAttribute("data-delegates");
                            }
                            else {
                                userobj.HasDelegation = false;
                                userobj.DelegationId = "";
                                userobj.AlternateSignatories = "";
                            }
                        } else {
                            userobj.orgName = "";
                            userobj.orgUid = "";
                            userobj.suid = selectedSuid;
                            userobj.accountType = "self";
                            userobj.HasDelegation = false;
                            userobj.DelegationId = "";
                            userobj.AlternateSignatories = "";
                        }

                    }
                    userobj.email = input.value;

                    emaillst.push(userobj);
                });
                roleDataList.push(emaillst);
            });




            console.log(roleDataList);


            var Data = currentRolesData;


            var signingOrder = {};
            var roleAnnotations = {};



            var roleMap = []
            console.log(listCoordinates)
            Data.forEach((role, index) => {
                roleId = (role._id);
                signingOrder[roleId] = index + 1;
                roleAnnotations[roleId] = { "qrPlaceHolderCoordinates": {}, "placeHolderCoordinates": {}, "esealplaceHolderCoordinates": {} }

            });

            editors.forEach((editor, pageIndex) => {

                Data.forEach((role, index) => {


                    const matchingElements = editor.querySelectorAll(`[role="${role.Roles.name}"]`);

                    if (matchingElements.length !== 0) {

                        matchingElements.forEach(element => {



                            if (element.id === `Signature_${role.Roles.name}`) {

                                const computedStyle = window.getComputedStyle(editor)
                                const marginLeft = computedStyle.marginLeft;
                                const marginTop = computedStyle.marginTop;
                                const parentrect = editor.getBoundingClientRect();
                                const childrect = element.getBoundingClientRect();
                                signatureX = (childrect.left - parentrect.left - parseFloat(marginLeft)) * scaleX;
                                signatureY = (childrect.top - parentrect.top + 37.8) * scaleY;
                                signaturewidth = childrect.width * scaleX;
                                signatureheight = childrect.height * scaleY;

                                roleAnnotations[role._id].placeHolderCoordinates.signatureXaxis = signatureX;
                                roleAnnotations[role._id].placeHolderCoordinates.signatureYaxis = signatureY;
                                roleAnnotations[role._id].placeHolderCoordinates.imgWidth = signaturewidth;
                                roleAnnotations[role._id].placeHolderCoordinates.imgHeight = signatureheight;
                                roleAnnotations[role._id].placeHolderCoordinates.pageNumber = pageIndex + 1;
                                pdfAnnotations.push({
                                    type: 'Signature',
                                    x: (signatureX / 595.28) * 100,
                                    y: (signatureY / 841.89) * 100,
                                    width: (signaturewidth / 595.28) * 100,
                                    height: (signatureheight / 841.89) * 100,
                                    page: pageIndex + 1,
                                    role: element.getAttribute('role')
                                });
                            }
                            else if (element.id === `Eseal_${role.Roles.name}`) {

                                const computedStyle = window.getComputedStyle(editor)
                                const marginLeft = computedStyle.marginLeft;
                                const marginTop = computedStyle.marginTop;
                                const parentrect = editor.getBoundingClientRect();
                                const childrect = element.getBoundingClientRect();
                                esealX = (childrect.left - parentrect.left - parseFloat(marginLeft)) * scaleX;
                                esealY = (childrect.top - parentrect.top + 37.8) * scaleY;
                                esealwidth = childrect.width * scaleX;
                                esealheight = childrect.height * scaleY;


                                roleAnnotations[role._id].esealplaceHolderCoordinates.signatureXaxis = esealX;
                                roleAnnotations[role._id].esealplaceHolderCoordinates.signatureYaxis = esealY;
                                roleAnnotations[role._id].esealplaceHolderCoordinates.pageNumber = pageIndex + 1;
                                roleAnnotations[role._id].esealplaceHolderCoordinates.imgWidth = esealwidth;
                                roleAnnotations[role._id].esealplaceHolderCoordinates.imgHeight = esealheight;

                                pdfAnnotations.push({
                                    type: 'Eseal',
                                    x: (esealX / 595.28) * 100,
                                    y: (esealY / 841.89) * 100,
                                    width: (esealwidth / 595.28) * 100,
                                    height: (esealheight / 841.89) * 100,
                                    page: pageIndex + 1,
                                    role: element.getAttribute('role')
                                });
                            }
                        });


                    }
                });




            });
            console.log(listCoordinates)
            roleDataList.forEach(rolelst => {
                var result = {};
                Data.forEach((role, index) => {
                    roleId = (role._id);
                    result[role._id] = rolelst[index];
                    result[role._id]["RoleName"] = role.Roles.name;
                });
                roleMap.push(result);
            });



            console.log(roleMap);


            for (let i = 0; i < editorInstances.length; i++) {
                const editorInstance = editorInstances[i];
                try {
                    const savedData = await editorInstance.save();
                    annotations.push(savedData);
                } catch (error) {
                    console.error(`Error saving editor instance ${i + 1}:`, error);
                }
            }
            var fileFormData = new FormData();
            fileFormData.append("sequentialSigning", !sequence.checked);
            fileFormData.append("documentName", docName);

            var parentdivroles = document.getElementById('roles');
            var roleGroupDivs = parentdivroles.querySelectorAll('div.roles-group')
            var count = roleGroupDivs.length;
            if (count == 1) {
                fileFormData.append("RequestType", "Individual");
            } else {
                fileFormData.append("RequestType", "Bulk");
            }

            fileFormData.append("TemplateType", "WEB");
            fileFormData.append("daysToComplete", signDays);
            fileFormData.append("roleMappings", JSON.stringify(roleMap));
            fileFormData.append("preFilledData", JSON.stringify(preFilledData));
            fileFormData.append("htmlSchema", JSON.stringify(annotations));
            fileFormData.append("pdfSchema", JSON.stringify(pdfAnnotations));
            fileFormData.append("RoleAnnotations", JSON.stringify(roleAnnotations));
            fileFormData.append("roleSigningOrder", JSON.stringify(signingOrder));
            fileFormData.append("formId", tempid);

            SaveDocument(SendRequestUrl, fileFormData)
                .then((response) => {
                    if (response.status == "Success") {
                        swal({
                            title: "Success",
                            text: response.message,
                            type: "success",
                        }, function (isConfirm) {
                            if (isConfirm) {
                                document.getElementById("navigationNetworkOverlay").style.display = "block";
                                window.location.href = FormRequestsSentUrl;
                            }
                        });

                        setTimeout(function () {
                            $('#overlay').hide();
                        }, 400);
                    }
                    else {
                        swal({
                            title: "Error",
                            text: response.message,
                            type: "error",
                        }, function (isConfirm) {
                            if (isConfirm) {
                                document.getElementById("navigationNetworkOverlay").style.display = "block";
                                window.location.href = DigitalFormsIndex;
                            }
                        });
                        setTimeout(function () {
                            $('#overlay').hide();
                        }, 400);

                    }

                })
        }

    }
    catch (error) {
        $('#overlay').hide();
        console.error("Error while sending document:", error);
        swal({
            title: "Error",
            text: "An unexpected error occurred. Please try again.",
            type: "error",
        });
    }

});



function SaveDocument(url, formData) {

    console.log($)
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: url,
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            method: 'POST',
            type: 'POST',
            success: function (data) {
                resolve(data)
            },
            error: function (err) {
                reject(err)
            }
        });
    });
}

function sendEmailToGetThumbnail(email) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: OrgDetailsByEmailUrl,
            data: { email: email },
            success: function (response) {
                if (response.success === undefined) {
                    console.log(response)
                    const orgsAndIds = {};
                    const orgDetails = response.orgDtos;

                    orgDetails.forEach(org => {
                        orgsAndIds[org.orgName] = [org.orgUid, response.userProfile.suid];
                    });
                    orgsAndIds["SELF"] = [response.userProfile.ugpassEmail, response.userProfile.suid];
                    resolve(orgsAndIds); // Resolve the Promise with the data
                } else {
                    resolve(null); // No data to return
                }
            },
            error: ajaxErrorHandler
        });
    });
}




function handleOpenTools(isclick = false) {
    if (editorInstance) {
        if (isclick == true) {

            editorInstance.blocks.insert('header', {
                tag: 'h2',
                alignment: 'left',
                text: ''
            }, {}, editorInstance.blocks.getBlocksCount());

        }
        else {
            editorInstance.blocks.insert('header', {
                tag: 'h2',
                alignment: 'left',
                text: ''
            });
        }

    }
}



function handleAddText(isclick = false) {
    if (editorInstance) {
        if (isclick == true) {
            editorInstance.blocks.insert('paragraph', {
                text: 'Paragraph',
                fontFamily: 'Arial',
                fontSize: '1rem',
                textAlign: 'left',
                fontWeight: 'normal',
                fontStyle: 'normal',

            }, {}, editorInstance.blocks.getBlocksCount());
        }
        else {
            editorInstance.blocks.insert('paragraph', {
                text: 'Paragraph',
                fontFamily: 'Arial',
                fontSize: '1rem',
                textAlign: 'left',
                fontWeight: 'normal',
                fontStyle: 'normal',

            });

        }

    }
}

function handleCheckbox(isclick = false) {
    if (editorInstance) {
        if (isclick == true) {
            editorInstance.blocks.insert('check', {
                label: 'Label',
                options: [{ text: 'Option 1', selected: false }],
                labelFamily: 'Times New Roman',
                optionFamily: 'Arial',
                labelBold: 'bold',
                labelItalic: 'normal',
                optionBold: 'normal',
                optionItalic: 'normal',
                labelFontSize: '17px',
                optionsFontSize: '13px',
                optionPosition: 'horizontal',
                labelPosition: 'top',
                fieldName: 'Label',
                mandatory: false,
            }, {}, editorInstance.blocks.getBlocksCount());
        }
        else {
            editorInstance.blocks.insert('check', {
                label: 'Label',
                options: [{ text: 'Option 1', selected: false }],
                labelFamily: 'Times New Roman',
                optionFamily: 'Arial',
                labelBold: 'bold',
                labelItalic: 'normal',
                optionBold: 'normal',
                optionItalic: 'normal',
                labelFontSize: '17px',
                optionsFontSize: '13px',
                optionPosition: 'horizontal',
                labelPosition: 'top',
                fieldName: 'Label',
                mandatory: false,
            });

        }
    }
}

function handleAddRadio(isclick = false) {

    if (editorInstance) {
        if (isclick == true) {
            editorInstance.blocks.insert('radio', {
                label: 'Label',
                options: [{ text: 'Option 1', selected: false }],
                labelFamily: 'Times New Roman',
                optionFamily: 'Arial',
                labelBold: 'bold',
                labelItalic: 'normal',
                optionBold: 'normal',
                optionItalic: 'normal',
                labelFontSize: '17px',
                optionsFontSize: '13px',
                optionPosition: 'horizontal',
                labelPosition: 'top',
                fieldName: 'Label' + radiofieldname,
                mandatory: false,
            }, {}, editorInstance.blocks.getBlocksCount());
        }
        else {
            editorInstance.blocks.insert('radio', {
                label: 'Label',
                options: [{ text: 'Option 1', selected: false }],
                labelFamily: 'Times New Roman',
                optionFamily: 'Arial',
                labelBold: 'bold',
                labelItalic: 'normal',
                optionBold: 'normal',
                optionItalic: 'normal',
                labelFontSize: '17px',
                optionsFontSize: '13px',
                optionPosition: 'horizontal',
                labelPosition: 'top',
                fieldName: 'Label' + radiofieldname,
                mandatory: false,
            });
        }
    }

    radiofieldname += 1;
}

function handleAddTable(isclick = false) {
    if (editorInstance) {
        if (isclick == true) {
            editorInstance.blocks.insert('table', {
                fieldName: 'table',
                rows: 2,
                cols: 2,
                fontFamily: 'Arial',
                fontSize: '15px',
                isBold: false,
                isItalic: false,
                cells: Array(2).fill().map(() => Array(2).fill('')),
                mandatory: false
            }, {}, editorInstance.blocks.getBlocksCount());
        }
        else {
            editorInstance.blocks.insert('table', {
                fieldName: 'table',
                rows: 2,
                cols: 2,
                fontFamily: 'Arial',
                fontSize: '15px',
                isBold: false,
                isItalic: false,
                cells: Array(2).fill().map(() => Array(2).fill('')),
                mandatory: false
            });
        }
    }
}

function handleAddInputBlock(isclick = false) {
    if (editorInstance) {
        if (isclick == true) {
            editorInstance.blocks.insert('inputfield', {
                labelTextInput: 'Label', value: '', labelPosition: 'left', inputwidth: '75', inputSize: '13px', inputplaceholder: 'Enter text', textwidth: '50%', textSize: '17px', textplaceholder: 'Enter text', labelBold: 'bold',
                labelItalic: 'normal', labelfamily: 'Times New Roman', inputfamily: 'Arial', fieldName: 'Label', mandatory: false,
            }, {}, editorInstance.blocks.getBlocksCount())
        }
        else {
            editorInstance.blocks.insert('inputfield', {
                labelTextInput: 'Label', value: '', labelPosition: 'left', inputwidth: '75', inputSize: '13px', inputplaceholder: 'Enter text', textwidth: '50%', textSize: '17px', textplaceholder: 'Enter text', labelBold: 'bold',
                labelItalic: 'normal', labelfamily: 'Times New Roman', inputfamily: 'Arial', fieldName: 'Label', mandatory: false,
            })

        }
    }
}

function handleAddRecommended(labelname, fieldname, isclick = false) {
    const selectElement = document.getElementById('ClientSelect');
    const selectedRole = selectElement.value;
    if (usedLabels.has(fieldname + "_" + selectedRole)) {
        swal({
            title: "Info",
            text: "Field Name Already present",
            type: "error",
        });
    }
    else {
        if (editorInstance) {
            if (isclick == true) {

                editorInstance.blocks.insert('inputfield', {
                    labelTextInput: labelname, value: '', labelPosition: 'left', inputwidth: '75', inputSize: '13px', inputplaceholder: 'Enter text', textwidth: '50%', textSize: '17px', textplaceholder: 'Enter text', labelBold: 'bold',
                    labelItalic: 'normal', labelfamily: 'Times New Roman', inputfamily: 'Arial', fieldName: fieldname, mandatory: false
                }, {}, editorInstance.blocks.getBlocksCount())
            }
            else {
                editorInstance.blocks.insert('inputfield', {
                    labelTextInput: labelname, value: '', labelPosition: 'left', inputwidth: '75', inputSize: '13px', inputplaceholder: 'Enter text', textwidth: '50%', textSize: '17px', textplaceholder: 'Enter text', labelBold: 'bold',
                    labelItalic: 'normal', labelfamily: 'Times New Roman', inputfamily: 'Arial', fieldName: fieldname, mandatory: false
                })

            }

        }
    }
}
function handleAddTextArea(isclick = false) {
    if (editorInstance) {
        if (isclick == true) {
            editorInstance.blocks.insert('textarea', {
                labelTextInput: 'Label',
                value: '',
                labelPosition: 'top',
                inputwidth: '100',
                inputSize: '13px',
                inputplaceholder: 'Enter text',
                textwidth: '50',
                textSize: '17px',
                textplaceholder: 'Enter text',
                textareaHeight: 'auto',
                labelBold: 'bold',
                labelItalic: 'normal',
                labelfamily: 'Times New Roman',
                fieldName: 'Label',
                inputfamily: 'Arial',
                mandatory: false
            }, {}, editorInstance.blocks.getBlocksCount())

        }
        else {
            editorInstance.blocks.insert('textarea', {
                labelTextInput: 'Label',
                value: '',
                labelPosition: 'top',
                inputwidth: '100',
                inputSize: '13px',
                inputplaceholder: 'Enter text',
                textwidth: '50',
                textSize: '17px',
                textplaceholder: 'Enter text',
                textareaHeight: 'auto',
                labelBold: 'bold',
                labelItalic: 'normal',
                labelfamily: 'Times New Roman',
                fieldName: 'Label',
                inputfamily: 'Arial',
                mandatory: false
            })
        }
    }

}

function handleAddOnlytext(isclick = false) {
    if (editorInstance) {
        if (isclick == true) {
            editorInstance.blocks.insert('onlytext', {
                value: '',
                inputwidth: '50',
                inputSize: '13px',
                inputplaceholder: 'Enter text',
                inputFontFamily: 'Arial',
                inputFontStyle: 'normal',
                inputFontWeight: 'normal',
                fieldName: 'FieldName',
                mandatory: false
            }, {}, editorInstance.blocks.getBlocksCount())
        }
        else {
            editorInstance.blocks.insert('onlytext', {
                value: '',
                inputwidth: '50',
                inputSize: '13px',
                inputplaceholder: 'Enter text',
                inputFontFamily: 'Arial',
                inputFontStyle: 'normal',
                inputFontWeight: 'normal',
                fieldName: 'FieldName',
                mandatory: false
            })

        }
    }
}

function handleAddButton() {
    if (editorInstance) {
        editorInstance.blocks.insert('button', {
            buttonText: 'Button',
            buttonWidth: '100px',
            buttonFontSize: '16px',
            buttonFontFamily: 'Arial',
            buttonAction: 'submit',
            buttonBold: 'normal',
            buttonItalic: 'normal',
            buttonBackgroundColor: '#007bff',
            buttonBorderColor: '#007bff',
        }, {}, editorInstance.blocks.getBlocksCount())
    }
}



function handleAddSelect(isclick = false) {
    if (editorInstance) {
        if (isclick == true) {
            editorInstance.blocks.insert('select', {
                label: 'Dropdown Label',
                options: [{ 'value': 'Option 1' }],
                selected: '',
                labelPosition: 'left',
                labelfamily: 'Times New Roman',
                labelSize: '17px',
                labelBold: 'bold',
                labelItalic: 'normal',
                optionFamily: 'Arial',
                optionSize: '13px',
                optionBold: 'normal',
                optionItalic: 'normal',
                selectWidth: '100',
                fieldName: 'Dropdown Label',
                mandatory: false,
            }, {}, editorInstance.blocks.getBlocksCount());
        }
        else {
            editorInstance.blocks.insert('select', {
                label: 'Dropdown Label',
                options: [{ 'value': 'Option 1' }],
                selected: '',
                labelPosition: 'left',
                labelfamily: 'Times New Roman',
                labelSize: '17px',
                labelBold: 'bold',
                labelItalic: 'normal',
                optionFamily: 'Arial',
                optionSize: '13px',
                optionBold: 'normal',
                optionItalic: 'normal',
                selectWidth: '100',
                fieldName: 'Dropdown Label',
                mandatory: false,
            });

        }

    }
}

function handleAddimage(isclick = false) {
    if (editorInstance) {
        if (isclick == true) {
            editorInstance.blocks.insert('image', {
                url: '',
                width: '30',
                height: '15',
                alignment: 'left',
                fieldName: 'image field',
                placeholderText: 'Upload Image',
                mandatory: false,
            }, {}, editorInstance.blocks.getBlocksCount());
        }
        else {
            editorInstance.blocks.insert('image', {
                url: '',
                width: '30',
                height: '15',
                alignment: 'left',
                fieldName: 'image field',
                placeholderText: 'Upload Image',
                mandatory: false,
            });
        }
    }
}

function handleSignature(isclick = false) {
    const selectElement = document.getElementById('ClientSelect');
    const selectedRole = selectElement.value;
    if (document.getElementById(`Signature_${selectedRole}`)) {
        swal({
            title: "Info",
            text: "More than one Signature not allowed",
            type: "error",
        });
    }
    else {
        if (editorInstance) {
            if (isclick == true) {
                editorInstance.blocks.insert('signature', {
                    content: 'Signature',
                    width: '15%',
                    height: 'auto',
                    alignment: 'left',
                    fieldName: 'input field'
                }, {}, editorInstance.blocks.getBlocksCount());
            }
            else {
                editorInstance.blocks.insert('signature', {
                    content: 'Signature',
                    width: '15%',
                    height: 'auto',
                    alignment: 'left',
                    fieldName: 'input field'
                });
            }
        }

    }

}

function handleEseal(isclick = false) {
    const selectElement = document.getElementById('ClientSelect');
    const selectedRole = selectElement.value;
    if (document.getElementById(`Eseal_${selectedRole}`)) {
        swal({
            title: "Info",
            text: "More than one Eseal not allowed",
            type: "error",
        });
    }
    else {
        if (editorInstance) {
            if (isclick == true) {
                editorInstance.blocks.insert('eseal', {
                    content: 'Eseal',
                    width: '15%',
                    height: 'auto',
                    alignment: 'left',
                    fieldName: 'input field'
                }, {}, editorInstance.blocks.getBlocksCount());
            }
            else {
                editorInstance.blocks.insert('eseal', {
                    content: 'Eseal',
                    width: '15%',
                    height: 'auto',
                    alignment: 'left',
                    fieldName: 'input field'
                });
            }
        }
    }

}

function deleteActivePage() {
    if (!editorInstance) {
        console.log("No active editor to delete.");
        return;
    }
    if (editorInstances.length === 1) {
        swal({
            title: "Info",
            text: "At least one page must remain, deletion is not permitted.",
            type: "error",
        });
        return;
    }


    let editorDiv = document.getElementById(editorInstance.configuration.holder);

    if (editorDiv) {
        const index = editorInstances.indexOf(editorInstance);
        swal({
            title: "Info",
            text: `Do you want to Delete ${index + 1} page?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "OK",
            cancelButtonText: "Cancel",
        }, function (result) {
            if (result) {
                editorDiv.remove();
                if (index > -1) {
                    editorInstances.splice(index, 1);
                    console.log(`Deleted editor instance at index ${index}`);


                    editorInstance.destroy();
                    editorInstance = null;


                    if (editorInstances.length > 0) {
                        editorInstance = editorInstances[editorInstances.length - 1];
                        console.log("New active editor set to the last editor in the list.");
                    }
                }
            } else if (result === false) {
                console.log("Action canceled");
            }
        });




    }
}







const headerid = document.querySelector('#headerid');
headerid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
headerid.addEventListener('dragend',
    (event) => {

        const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


        if (elementUnderCursor && elementUnderCursor.closest('.something')) {
            handleOpenTools();
        }
    });

const checkboxid = document.querySelector('#checkboxid');
checkboxid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
checkboxid.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);
    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleCheckbox();
    }
});

const textid = document.querySelector('#textid');
textid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
textid.addEventListener('dragend',
    (event) => {

        const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


        if (elementUnderCursor && elementUnderCursor.closest('.something')) {
            handleAddText();
        }
    }
);

const radioid = document.querySelector('#radioid');
radioid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
radioid.addEventListener('dragend',
    (event) => {

        const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


        if (elementUnderCursor && elementUnderCursor.closest('.something')) {
            handleAddRadio();
        }
    }
);


const tableid = document.querySelector('#tableid');
tableid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
tableid.addEventListener('dragend',
    (event) => {

        const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


        if (elementUnderCursor && elementUnderCursor.closest('.something')) {
            handleAddTable();
        }
    });



const fieldid = document.querySelector('#fieldid');
fieldid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
// fieldid.addEventListener('dragend', handleAddInputBlock);

fieldid.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleAddInputBlock();
    }
});






const textareaid = document.querySelector('#textareaid');
textareaid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
textareaid.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleAddTextArea();
    }
});

const selectid = document.querySelector('#selectid');
selectid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
selectid.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleAddSelect();
    }
});

const onlytextid = document.querySelector('#onlytextid');
onlytextid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
onlytextid.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleAddOnlytext();
    }
});

const buttonid = document.querySelector('#buttonid');
buttonid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
buttonid.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleAddButton();
    }
});

const imageid = document.querySelector('#imageid');
imageid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
imageid.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleAddimage();
    }
});

const signatureid = document.querySelector('#signatureid')
signatureid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
signatureid.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleSignature();
    }
});

const esealid = document.querySelector('#esealid')
esealid.addEventListener('dragover', function (event) {
    event.preventDefault();
});
esealid.addEventListener('dragend', (event) => {

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);


    if (elementUnderCursor && elementUnderCursor.closest('.something')) {
        handleEseal();
    }
});

function validateInput(event) {
    const input = event.target;

    if (input.value.length > 1) {
        input.value = input.value.slice(0, 1);
        return;
    }

    let value = parseInt(input.value);
    const min = parseInt(input.min, 10);
    const max = parseInt(input.max, 10);

    if (isNaN(value) || value < min || value > max) {
        input.value = '';
    }


}

function validateTable(event) {
    const input = event.target;



    let value = parseInt(input.value);
    const min = parseInt(input.min, 10);
    const max = parseInt(input.max, 10);

    if (isNaN(value) || value < min || value > max) {
        input.value = min;
    }


}

async function handle_delegation_orgid_suid(selectedorgid, selectedsuid, email, index) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "GET",
            url: GetDelegationbyorgidsuidUrl,
            data: {
                organizationId: selectedorgid,
                suid: selectedsuid
            },
            beforeSend: function () {

                document.getElementById("navigationNetworkOverlay").style.display = "block";
            },
            complete: function () {


                document.getElementById("navigationNetworkOverlay").style.display = "none";
            },
            success: function (response) {
                var iscancelled = false;
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

                        if (index == 0) {
                            swal({
                                title: "",
                                text: email + " " + "currently having an active delegation." + "\n" + "Form can't be sent to this account",
                                type: "info",
                            }, function (isConfirm) {
                                if (isConfirm) {
                                    var response_data_obj = {
                                        swallist: swal_list,
                                        listdata: list_data,
                                        delegateeid: response.result[0].delegationId,
                                        iscancelled: false

                                    }

                                    resolve(response_data_obj);

                                }


                            });
                        }
                        else {
                            swal({
                                title: "",
                                text: email + " currently has an active delegation." + "\n\n" + "Delegatee: " + swal_list,
                                type: "info",
                                showCancelButton: true,
                                confirmButtonColor: "#DD6B55",
                                confirmButtonText: "Proceed",
                                cancelButtonText: "Cancel",
                                closeOnConfirm: true,
                                closeOnCancel: true,

                            }, function (isConfirm) {
                                if (isConfirm) {
                                    var response_data_obj = {
                                        swallist: swal_list,
                                        listdata: list_data,
                                        delegateeid: response.result[0].delegationId,
                                        iscancelled: false

                                    }

                                    resolve(response_data_obj);

                                } else {
                                    var response_data_obj = {
                                        swallist: swal_list,
                                        listdata: list_data,
                                        delegateeid: response.result[0].delegationId,
                                        iscancelled: true

                                    }

                                    resolve(response_data_obj);

                                }


                            })

                        }



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