
var currentGroupName = `group-${Date.now()}`;
var editorInstance;
var editorinstancelist = [];
var overlaysignflag = false;
var overlayesealflag = false;
var userrole = Data[0].Roles.name;

$(document).ready(function () {
    $('#fill').on('click', function () {
        autofill();
    });
    $('#save').on('click', function () {
        generateDocument();
    });
});

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

    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'paragraph-block-wrapper';
        this.wrapper.style.position = 'relative';
        this.wrapper.style.padding = '1em 0';


        const paragraph = document.createElement('p');
        paragraph.className = 'paragraph-block';
        paragraph.contentEditable = false;
        paragraph.textContent = this.data.text;
        paragraph.style.setProperty('font-family', this.data.fontFamily, 'important');
        paragraph.style.fontSize = this.data.fontSize;
        paragraph.style.textAlign = this.data.textAlign;
        paragraph.style.fontWeight = this.data.fontWeight;
        paragraph.style.fontStyle = this.data.fontStyle;
        paragraph.style.outline = 'none';
        paragraph.style.margin = '0';
        paragraph.style.padding = '0';

        this.wrapper.appendChild(paragraph);
        return this.wrapper;
    }

    save(blockContent) {

        return {

            text: this.data.text,
            fontFamily: this.data.fontFamily,
            fontSize: this.data.fontSize,
            textAlign: this.data.textAlign,
            fontWeight: this.data.fontWeight,
            fontStyle: this.data.fontStyle,
            blockheight: this.data.blockheight
        };
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
        this.data = (data && Object.keys(data).length > 0) ? data : { tag: 'h1', alignment: 'left' };

        this.wrapper = null;

        this.header = null;
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.style.position = 'relative';
        this.header = document.createElement(this.data.tag);
        this.header.textContent = this.data.text;
        this.header.setAttribute('contenteditable', 'false');
        this.header.style.outline = 'none'
        this.header.style.marginBottom = '0';

        this.header.style.textAlign = this.data.alignment;

        this.wrapper.appendChild(this.header);




        return this.wrapper;
    }




    save(blockContent) {
        return this.data;
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
            selectWidth: '100%'
        };
        this.wrapper = null;
        this.labelElement = null;
        this.selectElement = null;
        this.asterisk = null;
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'd-flex align-items-center';
        this.wrapper.style.padding = "1em 0";

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
        inputWrapper.className = 'd-flex flex-column';
        inputWrapper.style.width = '100%';

        this.selectElement = document.createElement('select');
        this.selectElement.className = 'form-control mr-2';
        this.selectElement.id = this.data.label;
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

        if (this.data.role !== userrole) {
            this.selectElement.disabled = true;
        }
        if (this.data.mandatory) {
            this.labelElement.style.marginRight = "0px";
            this.asterisk.style.marginRight = "10px";
            this.asterisk.style.display = "unset";
        } else {

            this.labelElement.style.marginRight = "10px";
            this.asterisk.style.display = "none";
        }
        this.data.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.innerText = option.value;
            this.selectElement.appendChild(optionElement);
        });



        labeldiv.appendChild(this.labelElement);
        labeldiv.appendChild(this.asterisk);


        this.wrapper.appendChild(labeldiv);

        inputWrapper.appendChild(this.selectElement);
        this.wrapper.appendChild(inputWrapper)


        this.applyLabelPosition();

        this.errorRow = document.createElement('div');
        this.errorRow.className = 'error-row';
        this.errorRow.style.color = 'red';
        this.errorRow.style.fontSize = '12px';
        this.errorRow.style.marginTop = '0.5em';
        this.errorRow.textContent = '';
        this.errorRow.style.height = '1em';

        if (this.data.mandatory) {

            inputWrapper.appendChild(this.errorRow);

        }





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
            mandatory: this.data.mandatory
        };
    }

    validate(savedData) {
        return true;
    }
}

class dummyBlock {

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.style.display = 'none';
        return null;
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
            inputwidth: '50%',
            inputSize: '16px',
            inputplaceholder: 'Enter text',
            inputFontFamily: 'Arial',
            inputFontStyle: 'normal',
            inputFontWeight: 'normal',
            fieldName: 'FieldName',
        };
        this.wrapper = null;
        this.inputElement = null;
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'd-flex flex-column';
        this.wrapper.style.padding = "1em 0";

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'd-flex';
        inputWrapper.style.width = '100%';

        this.inputElement = document.createElement('input');
        this.inputElement.id = this.data.fieldName;
        this.inputElement.type = 'text';
        this.inputElement.className = 'form-control mr-2';
        this.inputElement.placeholder = this.data.inputplaceholder;
        this.inputElement.value = this.data.value;
        this.inputElement.style.width = this.data.inputwidth + "%";
        this.inputElement.style.fontSize = this.data.inputSize;
        this.inputElement.style.fontFamily = this.data.inputFontFamily;
        this.inputElement.style.fontStyle = this.data.inputFontStyle;
        this.inputElement.style.fontWeight = this.data.inputFontWeight;
        this.inputElement.style.lineHeight = '1.2';
        this.inputElement.setAttribute('role', this.data.role);
        if (this.data.role !== userrole) {
            this.inputElement.disabled = true;
        }



        inputWrapper.appendChild(this.inputElement);

        this.wrapper.appendChild(inputWrapper)

        this.errorRow = document.createElement('div');
        this.errorRow.className = 'error-row';
        this.errorRow.style.color = 'red';
        this.errorRow.style.fontSize = '12px';
        this.errorRow.style.marginTop = '0.5em';
        this.errorRow.textContent = '';
        this.errorRow.style.height = '1em';
        if (this.data.mandatory) {
            this.wrapper.appendChild(this.errorRow);
        }



        return this.wrapper;
    }

    validate() {

        this.errorRow.textContent = '';

        if (this.data.mandatory && this.inputElement.value.trim() == "") {


            this.errorRow.textContent = 'This field is required';
            return true;
        }



        return true;
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
            mandatory: this.data.mandatory
        };
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
            labelPosition: 'top'
        };
        this.wrapper = null;
        this.labelElement = null;
        this.labelWrapper = null;
        this.asterisk = null;
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'd-flex';
        this.wrapper.style.padding = "1em 0";

        this.labelWrapper = document.createElement('div');
        this.labelWrapper.className = 'd-flex align-items-center';
        this.labelWrapper.style.width = 'auto';

        this.labelElement = document.createElement('label');
        this.labelElement.textContent = this.data.label;
        this.labelElement.style.marginRight = "10px";
        this.labelElement.style.fontSize = this.data.labelFontSize;
        this.labelElement.style.marginBottom = 'auto';
        this.labelElement.style.marginTop = 'auto';

        const labeldiv = document.createElement('div')
        labeldiv.className = 'd-flex';
        labeldiv.style.gap = '0px';
        labeldiv.style.padding = '0px';
        labeldiv.style.margin = '0px';

        this.applyLabelStyles();
        this.applyOptionPosition();

        this.asterisk = document.createElement('span');
        this.asterisk.textContent = '*';
        this.asterisk.style.color = 'red';
        this.asterisk.style.fontSize = this.data.labelFontSize;
        const textSizeValue = parseInt(this.data.labelFontSize, 10);
        this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;

        labeldiv.appendChild(this.labelElement);
        labeldiv.appendChild(this.asterisk);


        this.labelWrapper.appendChild(labeldiv);
        this.wrapper.append(this.labelWrapper);

        if (this.data.mandatory) {
            this.labelElement.style.marginRight = "0px";
            this.asterisk.style.marginRight = "10px";
            this.asterisk.style.display = "unset";
        } else {
            this.labelElement.style.marginRight = "10px";
            this.asterisk.style.display = "none";
        }

        this.errorRow = document.createElement('div');
        this.errorRow.className = 'error-row';
        this.errorRow.style.color = 'red';
        this.errorRow.style.fontSize = '12px';
        this.errorRow.style.marginTop = '0.5em';
        this.errorRow.textContent = '';
        this.errorRow.style.height = '1em';
        this.errorRow.style.width = '100%';

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
            if (this.data.role !== userrole) {
                radioInput.disabled = true;
            }

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
            if (this.data.mandatory) {
                radiodiv.appendChild(this.errorRow);
            }
            this.wrapper.appendChild(radiodiv);

        }
        else {
            if (this.data.mandatory) {
                this.wrapper.appendChild(this.errorRow);
            }
        }








        return this.wrapper;
    }

    validate() {

        this.errorRow.textContent = '';

        const isAnyOptionSelected = this.data.options.some(option => option.selected);

        if (this.data.mandatory && !isAnyOptionSelected) {


            this.errorRow.textContent = 'This field is required';
            return true;
        }

        return true;
    }

    save(blockContent) {
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
            blockheight: this.data.blockheight,
            fieldName: this.data.fieldName,
            mandatory: this.data.mandatory
        };
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
            inputwidth: '50%',
            inputSize: '16px',
            inputplaceholder: 'Enter text',
            textwidth: '50%',
            textSize: '16px',
            textplaceholder: 'Enter text',
        };
        this.wrapper = null;
        this.labelInput = null;
        this.inputElement = null;
        this.asterisk = null;
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'd-flex align-items-start'; // Default row layout
        this.wrapper.style.position = 'relative';
        this.wrapper.style.padding = "1em 0";

        const labeldiv = document.createElement('div');
        labeldiv.className = 'd-flex align-items-center';
        labeldiv.style.gap = '0px';
        labeldiv.style.padding = '0px';
        labeldiv.style.margin = '0px';

        this.labelInput = document.createElement('label');
        this.labelInput.className = 'input-block-label';
        this.labelInput.textContent = this.data.labelTextInput;
        this.labelInput.style.width = "auto";
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

        const inputContainer = document.createElement('div'); // Specific container for input and error
        inputContainer.className = 'd-flex flex-column';
        inputContainer.style.width = '100%'; // Ensures it doesn’t affect other sibling elements
        inputContainer.style.marginLeft = '10px'; // Keeps alignment with the label

        this.inputElement = document.createElement('input');
        this.inputElement.type = 'text';
        this.inputElement.id = this.data.fieldName;
        this.inputElement.className = 'form-control mr-2';
        this.inputElement.placeholder = this.data.inputplaceholder;
        this.inputElement.value = this.data.value;
        this.inputElement.style.width = this.data.inputwidth + "%";
        this.inputElement.style.fontSize = this.data.inputSize;
        this.inputElement.style.lineHeight = '1.2';
        this.inputElement.setAttribute('role', this.data.role);
        if (this.data.role !== userrole) {
            this.inputElement.disabled = true;
        }


        this.errorRow = document.createElement('div');
        this.errorRow.className = 'error-row';
        this.errorRow.style.color = 'red';
        this.errorRow.style.fontSize = '12px';
        this.errorRow.style.marginTop = '0.5em';
        this.errorRow.textContent = '';
        this.errorRow.style.height = '1em';

        labeldiv.appendChild(this.labelInput);
        labeldiv.appendChild(this.asterisk);

        this.wrapper.appendChild(labeldiv);
        inputContainer.appendChild(this.inputElement);
        if (this.data.mandatory) {
            inputContainer.appendChild(this.errorRow);
            labeldiv.style.marginBottom = "12px";
        }


        this.wrapper.appendChild(inputContainer);

        this.applyLabelPosition();
        this.applyStyles();

        if (this.data.mandatory) {
            this.labelInput.style.marginRight = "0px";
            this.asterisk.style.marginRight = "10px";
        } else {
            this.asterisk.style.display = "none";
        }

        return this.wrapper;
    }

    validate() {

        this.errorRow.textContent = '';


        if (this.data.mandatory && !this.inputElement.value.trim()) {


            this.errorRow.textContent = 'This field is required';
            return true;
        }



        return true;
    }


    async save(blockContent) {

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
            mandatory: this.data.mandatory
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
        this.labelInput.style.fontFamily = this.data.labelfamily;
        this.labelInput.textContent = this.data.labelTextInput;
        this.labelInput.style.fontWeight = this.data.labelBold;
        this.labelInput.style.fontStyle = this.data.labelItalic;
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
            inputwidth: '50%',
            inputSize: '16px',
            inputplaceholder: 'Enter text',
            textwidth: '50%',
            textSize: '16px',
            textplaceholder: 'Enter text',
            textareaHeight: 'auto',
        };
        this.wrapper = null;
        this.labelInput = null;
        this.inputElement = null;
        this.asterisk = null;
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'd-flex flex-column';
        this.wrapper.style.position = 'relative';
        this.wrapper.style.padding = "1em 0";

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

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'd-flex';
        inputWrapper.style.width = '100%';

        this.asterisk = document.createElement('span');
        this.asterisk.textContent = '*';
        this.asterisk.style.color = 'red';
        this.asterisk.style.fontSize = this.data.textSize;
        const textSizeValue = parseInt(this.data.textSize, 10);
        this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;

        this.inputElement = document.createElement('textarea');
        this.inputElement.className = 'form-control mr-2';
        this.inputElement.placeholder = this.data.inputplaceholder;
        this.inputElement.value = this.data.value;
        this.inputElement.style.width = this.data.inputwidth + "%";
        this.inputElement.style.fontSize = this.data.inputSize;
        this.inputElement.style.lineHeight = '1.2';
        this.inputElement.style.resize = 'none';
        this.inputElement.setAttribute('role', this.data.role);
        // this.inputElement.addEventListener('keydown', async (event) => {
        //     if (event.key === 'Enter') {
        //         await event.preventDefault();
        //         console.log('Enter key pressed. Default action prevented.');
        //     }
        // });

        if (this.data.role !== userrole) {
            this.inputElement.disabled = true;
        }
        const scale = (766.29) / window.eHeight;

        this.inputElement.style.height = ((window.eHeight) * 0.20) + 'px';


        labeldiv.appendChild(this.labelInput);
        labeldiv.appendChild(this.asterisk);


        this.wrapper.appendChild(labeldiv);


        inputWrapper.appendChild(this.inputElement);
        this.wrapper.appendChild(inputWrapper);
        this.applyLabelPosition();
        this.applyStyles();

        if (this.data.mandatory) {
            this.labelInput.style.marginRight = "0px";
            this.asterisk.style.marginRight = "10px";
            this.asterisk.style.display = "unset";
        } else {
            this.asterisk.style.display = "none";
        }

        this.errorRow = document.createElement('div');
        this.errorRow.className = 'error-row';
        this.errorRow.style.color = 'red';
        this.errorRow.style.fontSize = '12px';
        this.errorRow.style.marginTop = '0.5em';
        this.errorRow.textContent = '';
        this.errorRow.style.height = '1em';
        if (this.data.mandatory) {
            this.wrapper.appendChild(this.errorRow);
        }



        return this.wrapper;
    }

    validate() {

        this.errorRow.textContent = '';


        if (this.data.mandatory && !this.inputElement.value.trim()) {


            this.errorRow.textContent = 'This field is required';
            return true;
        }



        return true;
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
            mandatory: this.data.mandatory
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
            labelPosition: 'top'
        };
        this.wrapper = null;
        this.labelElement = null;

        this.labelWrapper = null;
        this.asterisk = null;
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'd-flex';
        this.wrapper.style.padding = "1em 0";

        this.labelWrapper = document.createElement('div');
        this.labelWrapper.className = 'd-flex align-items-center';
        this.labelWrapper.style.width = 'auto';

        const labeldiv = document.createElement('div')
        labeldiv.className = 'd-flex';
        labeldiv.style.gap = '0px';
        labeldiv.style.padding = '0px';
        labeldiv.style.margin = '0px';

        this.asterisk = document.createElement('span');
        this.asterisk.textContent = '*';
        this.asterisk.style.color = 'red';
        this.asterisk.style.fontSize = this.data.labelFontSize;
        const textSizeValue = parseInt(this.data.labelFontSize, 10);
        this.asterisk.style.marginBottom = `${textSizeValue / 2}px`;

        this.labelElement = document.createElement('label');
        this.labelElement.textContent = this.data.label;
        this.labelElement.style.marginRight = "10px";
        this.labelElement.style.fontSize = this.data.labelFontSize;
        this.labelElement.style.marginBottom = '0.25rem'
        this.applyLabelStyles();
        this.applyOptionPosition();

        labeldiv.appendChild(this.labelElement);
        labeldiv.appendChild(this.asterisk);


        this.labelWrapper.appendChild(labeldiv);

        this.wrapper.append(this.labelWrapper);

        const radiodiv = document.createElement('div');
        radiodiv.className = 'm-0 p-0';

        this.data.options.forEach((option, index) => {
            const checkboxWrapper = document.createElement('div');
            checkboxWrapper.className = 'form-check d-flex align-items-center';

            const checkboxInput = document.createElement('input');
            checkboxInput.type = 'checkbox';
            checkboxInput.className = 'form-check-input mt-0';
            checkboxInput.name = 'checkbox-group';
            checkboxInput.setAttribute('role', this.data.role);
            if (this.data.role !== userrole) {
                checkboxInput.disabled = true;
            }
            if (option.selected) {
                checkboxInput.checked = true;
            }


            checkboxInput.addEventListener('change', () => {

                this.data.options.forEach((opt, i) => {
                    if (i == index) {
                        opt.selected = checkboxInput.checked;
                    }

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


        if (this.data.mandatory) {
            this.labelElement.style.marginRight = "0px";
            this.asterisk.style.marginRight = "10px";
            this.asterisk.style.display = "unset";
        } else {
            this.labelElement.style.marginRight = "10px";
            this.asterisk.style.display = "none";
        }

        this.errorRow = document.createElement('div');
        this.errorRow.className = 'error-row';
        this.errorRow.style.color = 'red';
        this.errorRow.style.fontSize = '12px';
        this.errorRow.style.marginTop = '0.5em';
        this.errorRow.textContent = '';
        this.errorRow.style.height = '1em';
        this.errorRow.style.width = '100%';


        if (this.data.optionPosition === 'vertical' && this.data.labelPosition === 'left') {
            if (this.data.mandatory) {
                radiodiv.appendChild(this.errorRow);
            }
            this.wrapper.appendChild(radiodiv);

        }
        else {
            if (this.data.mandatory) {
                this.wrapper.appendChild(this.errorRow);
            }
        }


        return this.wrapper;
    }


    validate() {

        this.errorRow.textContent = '';

        const isAnyOptionSelected = this.data.options.some(option => option.selected);

        if (this.data.mandatory && !isAnyOptionSelected) {


            this.errorRow.textContent = 'This field is required';
            return true;
        }



        return true;
    }

    save(blockContent) {
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
            blockheight: this.data.blockheight,
            fieldName: this.data.fieldName,
            mandatory: this.data.mandatory
        };
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
            buttonAction: 'button',
            buttonBold: 'normal',
            buttonItalic: 'normal',
            buttonBackgroundColor: '#007bff', // Default background color
            buttonBorderColor: '#007bff', // Default border color
        };
        this.wrapper = null;
        this.buttonElement = null;
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




        this.wrapper.appendChild(this.buttonElement);

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
            cells: Array(2).fill().map(() => Array(2).fill(''))
        };
        this.wrapper = null;
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'table-container';
        this.wrapper.style.padding = "1em 0";

        const table = document.createElement('table');
        table.className = 'custom-table mr-1';
        table.setAttribute('role', this.data.role);
        if (this.data.role !== userrole) {
            table.disabled = true;
        }
        this.wrapper.appendChild(table);

        this.renderTable();

        this.errorRow = document.createElement('div');
        this.errorRow.className = 'error-row';
        this.errorRow.style.color = 'red';
        this.errorRow.style.fontSize = '12px';
        this.errorRow.style.marginTop = '0.5em';

        this.errorRow.textContent = "";
        this.errorRow.style.height = '1em';
        if (this.data.mandatory) {
            this.wrapper.appendChild(this.errorRow);
        }


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
                    cell.contentEditable = false;
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


    validate() {

        this.errorRow.textContent = '';
        const isEveryCellFilled = this.data.cells.every(row =>
            row.every(cell => cell.trim() !== "")
        );
        if (this.data.mandatory && !isEveryCellFilled) {


            this.errorRow.textContent = 'This field is required';
            return true;
        }

        return true;
    }

    save() {
        return this.data;
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

    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'input-block';
        this.wrapper.style.position = 'relative';
        this.wrapper.style.height = this.data.height;
        this.wrapper.style.textAlign = this.data.alignment;
        this.wrapper.style.padding = "1em 0";


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
        inputDiv.style.textAlign = 'center'
        inputDiv.setAttribute('role', this.data.role);
        if (this.data.role !== userrole) {
            inputDiv.style.visibility = "hidden";

        }


        this.wrapper.appendChild(inputDiv);





        return this.wrapper;
    }

    save(blockContent) {
        return this.data;
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

    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'input-block';
        this.wrapper.style.position = 'relative';
        this.wrapper.style.height = this.data.height;
        this.wrapper.style.textAlign = this.data.alignment;
        this.wrapper.style.padding = "1em 0";


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
        inputDiv.style.textAlign = 'center'
        inputDiv.setAttribute('role', this.data.role);
        inputDiv.style.wordBreak = 'break-word';
        if (this.data.role !== userrole) {

            inputDiv.style.visibility = "hidden";
        }


        this.wrapper.appendChild(inputDiv);

        return this.wrapper;
    }

    save(blockContent) {
        return this.data;
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
            placeholderText: 'Upload Image'
        };
        this.wrapper = null;
        this.imageInput = null;
        this.placeholder = null;
        this.isImagepresent = null;
    }

    render() {
        this.isImagepresent = this.data.url === "";
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'image-block' + " " + this.data.fieldName + "div";

        this.wrapper.style.padding = "1em 0";

        this.imageInput = document.createElement('input');
        this.imageInput.type = 'file';
        this.imageInput.accept = 'image/*';
        this.imageInput.style.display = 'none';

        this.imageInput.onchange = (event) => {
            const file = event.target.files[0];
            const reader = new FileReader();

            reader.onload = (e) => {
                if (this.data.fieldName == "Selfie") {
                    this.imgelement.setAttribute('src', e.target.result);
                    this.placeholder.style.display = 'none';
                    this.imgelement.style.display = 'block';
                }
                else {
                    this.data.url = e.target.result;
                    this.renderImage();

                }

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
        this.placeholder.style.fontSize = '18px';
        this.placeholder.style.fontStyle = 'italic';
        this.placeholder.style.wordBreak = 'break-word';
        this.placeholder.id = this.data.fieldName + "placeholder";

        this.placeholder.onclick = () => this.imageInput.click();

        this.wrapper.appendChild(this.placeholder);


        this.renderImage();

        this.errorRow = document.createElement('div');
        this.errorRow.className = 'error-row';
        this.errorRow.style.color = 'red';
        this.errorRow.style.fontSize = '12px';
        this.errorRow.style.marginTop = '0.5em';
        this.errorRow.style.visibility = 'visible';
        this.errorRow.textContent = ""
        this.errorRow.style.height = '1em';
        if (this.data.mandatory) {
            this.wrapper.appendChild(this.errorRow);
        }


        return this.wrapper;
    }
    renderImage() {
        if (this.data.fieldName == "Selfie") {
            const img = document.createElement('img');
            img.id = this.data.fieldName;
            img.src = this.data.url;
            img.style.maxWidth = '100%';
            img.style.width = this.data.width + "%";
            const percentageNumber = parseFloat(this.data.height);
            const decimalValue = percentageNumber / 100;
            img.style.height = (decimalValue * window.eHeight) + 'px';

            if (this.isImagepresent) {
                img.onclick = () => this.imageInput.click();
            }
            img.addEventListener('load', () => {
                this.data.url = img.src;
            });
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
            if (this.data.url == "") {
                img.style.display = "none";
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
            else {
                this.placeholder.style.display = "none";
            }
        }

        else if (this.data.url) {
            const img = document.createElement('img');
            img.src = this.data.url;
            img.style.maxWidth = '100%';
            img.style.width = this.data.width + "%";
            const percentageNumber = parseFloat(this.data.height);
            const decimalValue = percentageNumber / 100;
            img.style.height = (decimalValue * window.eHeight) + 'px';
            this.wrapper.innerHTML = '';
            if (this.isImagepresent) {
                img.onclick = () => this.imageInput.click();
            }
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


    validate(savedData) {
        this.errorRow.textContent = '';
        if (this.data.mandatory && this.data.url.trim() === '') {
            this.errorRow.textContent = 'This field is required';
            return true;
        }
        return true;
    }
    save(blockContent) {
        // if (this.imgelement) {
        //     const height = parseFloat(window.getComputedStyle(this.imgelement).height);
        //     this.data.height = (height / window.eHeight) * 100;
        // }
        return this.data;
    }


    destroy() {
        const labelToRemove = this.data.fieldName;


        if (usedLabels.has(labelToRemove)) {
            usedLabels.delete(labelToRemove);
        }
    }

}

function customHeaderparser(block) {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    const header = document.createElement(block.data.tag);
    if (block.data.text === "") {
        header.textContent = "   ";
    }
    else {
        header.textContent = block.data.text;
    }
    if (block.data.height !== 0) {
        wrapper.style.height = (block.data.blockheight) + "px";
    }
    header.setAttribute('contenteditable', 'true');
    header.style.outline = 'none';
    header.style.marginBottom = '0';
    header.className = "mr-2";

    header.style.textAlign = block.data.alignment;

    wrapper.appendChild(header);

    return wrapper.outerHTML;
}
function customParagraphparser(block) {

    const wrapper = document.createElement('div');
    wrapper.className = 'paragraph-block-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.padding = '1em 0';
    if (block.data.height !== 0) {
        wrapper.style.height = (block.data.blockheight) + "px";
    }


    const paragraph = document.createElement('p');
    paragraph.className = 'paragraph-block mr-2';
    paragraph.contentEditable = false;
    paragraph.textContent = block.data.text;
    paragraph.style.setProperty('font-family', block.data.fontFamily, 'important');
    paragraph.style.fontSize = block.data.fontSize;
    paragraph.style.textAlign = block.data.textAlign;
    paragraph.style.fontWeight = block.data.fontWeight;
    paragraph.style.fontStyle = block.data.fontStyle;
    paragraph.style.outline = 'none';
    paragraph.style.margin = '0';
    paragraph.style.padding = '0';

    wrapper.appendChild(paragraph);
    return wrapper.outerHTML;

}


function customTableParser(block) {
    const wrapper = document.createElement('div');
    wrapper.className = 'table-container';
    wrapper.style.padding = "1em 0";

    const table = document.createElement('table');
    table.className = 'custom-table';
    table.style.marginRight = "1%";
    table.style.width = '99%';
    wrapper.appendChild(table);
    for (let i = 0; i < block.data.rows; i++) {
        const row = table.insertRow();
        for (let j = 0; j < block.data.cols; j++) {
            const cell = row.insertCell();
            cell.contentEditable = true;
            cell.textContent = block.data.cells[i][j] || (i === 0 ? `Header ${j + 1}` : ``);
            if (i == 0) {
                cell.style.fontWeight = "bold";
            }
            else {
                cell.style.fontWeight = block.data.isBold ? "bold" : "normal";
            }
            block.data.cells[i][j] = cell.textContent;
            cell.style.fontFamily = block.data.fontFamily;
            cell.style.fontSize = block.data.fontSize;
            cell.style.fontStyle = block.data.isItalic ? "italic" : "normal";
        }
    }

    return wrapper.outerHTML;
}

function customSelectParser(block) {
    if (block.data) {
        const wrapper = document.createElement('div');
        wrapper.className = 'd-flex align-items-center';
        wrapper.style.padding = "1em 0";

        const labelElement = document.createElement('label');
        labelElement.textContent = block.data.label;
        labelElement.style.fontFamily = block.data.labelfamily;
        labelElement.style.fontSize = block.data.labelSize;
        labelElement.style.fontWeight = block.data.labelBold;
        labelElement.style.fontStyle = block.data.labelItalic;
        labelElement.style.marginRight = '10px';
        labelElement.style.whiteSpace = 'nowrap';

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'd-flex';
        inputWrapper.style.width = '100%';

        const selectElement = document.createElement('select');
        selectElement.className = 'form-control mr-2';
        selectElement.style.fontFamily = block.data.optionFamily;
        selectElement.style.fontSize = block.data.optionSize;
        selectElement.style.fontWeight = block.data.optionBold;
        selectElement.style.fontStyle = block.data.optionItalic;
        selectElement.style.width = block.data.selectWidth + "%";
        const optionElement = document.createElement('option');
        optionElement.value = block.data.selected;
        optionElement.innerText = block.data.selected;
        selectElement.appendChild(optionElement);



        wrapper.appendChild(labelElement)
        inputWrapper.appendChild(selectElement);
        wrapper.appendChild(inputWrapper)


        if (block.data.labelPosition === 'top') {
            wrapper.classList.add('flex-column');
            wrapper.classList.remove('align-items-center');
        } else {
            wrapper.classList.remove('flex-column');
            wrapper.classList.add('align-items-center');
        }

        return wrapper.outerHTML;
    }
    return '';
}

function customOnlytextParser(block) {
    if (block.data) {
        const wrapper = document.createElement('div');
        wrapper.className = 'd-flex align-items-center';
        wrapper.style.padding = "1em 0";

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'd-flex';
        inputWrapper.style.width = '100%';

        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.className = 'form-control mr-2';
        inputElement.placeholder = block.data.value;
        inputElement.value = block.data.value;
        inputElement.style.width = block.data.inputwidth + "%";
        inputElement.style.fontSize = block.data.inputSize;
        inputElement.style.fontFamily = block.data.inputFontFamily;
        inputElement.style.fontStyle = block.data.inputFontStyle;
        inputElement.style.fontWeight = block.data.inputFontWeight;
        inputElement.style.lineHeight = '1.2';

        inputWrapper.appendChild(inputElement);

        wrapper.appendChild(inputWrapper);

        return wrapper.outerHTML;

    }
    return '';
}

function customRadioParser(block) {


    const wrapper = document.createElement('div');
    wrapper.className = 'd-flex';
    wrapper.style.padding = "1em 0";
    if (block.data.height !== 0) {
        wrapper.style.height = block.data.blockheight + "px";
    }

    const labelWrapper = document.createElement('div');
    labelWrapper.className = 'd-flex align-items-center';
    labelWrapper.style.width = 'auto';

    const labelElement = document.createElement('label');
    labelElement.textContent = block.data.label;
    labelElement.style.marginRight = "10px";
    labelElement.style.fontSize = block.data.labelFontSize;
    labelElement.style.marginBottom = 'auto';
    labelElement.style.marginTop = 'auto';
    labelElement.style.fontFamily = block.data.labelFamily;
    labelElement.style.fontWeight = block.data.labelBold;
    labelElement.style.fontStyle = block.data.labelItalic;
    if (block.data.optionPosition === 'vertical' && block.data.labelPosition === 'left') {
        wrapper.classList.remove('flex-column');
        labelWrapper.style.width = 'auto';
        labelWrapper.classList.remove('align-items-center');
        labelElement.style.marginTop = 'unset';

    }
    else {
        labelWrapper.classList.add('align-items-center');
        labelElement.style.marginTop = 'auto';
        if (block.data.optionPosition === 'vertical') {
            wrapper.classList.add('flex-column');
            wrapper.classList.remove('radio-options');

        }
        else {
            wrapper.classList.remove('flex-column');
            wrapper.classList.add('radio-options');
        }

        if (block.data.labelPosition === 'top') {
            labelWrapper.style.width = '100%';
        }
        else {
            labelWrapper.style.width = 'auto';
        }

    }





    labelWrapper.appendChild(labelElement);

    wrapper.append(labelWrapper);

    const radiodiv = document.createElement('div');
    radiodiv.className = 'm-0 p-0';

    block.data.options.forEach(option => {
        const radioWrapper = document.createElement('div');
        radioWrapper.className = 'form-check d-flex align-items-center radio-option';

        const radioInput = document.createElement('input');
        radioInput.type = 'radio';
        radioInput.className = 'form-check-input mt-0 ';
        radioInput.name = block.data.fieldName;
        if (option.selected) {
            radioInput.setAttribute('checked', 'checked');
        }

        const radioLabel = document.createElement('label');
        radioLabel.className = 'form-check-label';
        radioLabel.textContent = option.text;
        radioLabel.style.fontSize = block.data.optionsFontSize;
        radioLabel.style.fontFamily = block.data.optionFamily;
        radioLabel.style.fontWeight = block.data.optionBold;
        radioLabel.style.fontStyle = block.data.optionItalic;
        radioWrapper.appendChild(radioInput);
        radioWrapper.appendChild(radioLabel);

        if (block.data.optionPosition === 'vertical' && block.data.labelPosition === 'left') {
            radiodiv.appendChild(radioWrapper);
        }
        else {
            wrapper.appendChild(radioWrapper);
        }
    });

    if (block.data.optionPosition === 'vertical' && block.data.labelPosition === 'left') {
        wrapper.appendChild(radiodiv);
    }

    return wrapper.outerHTML;

    return '';
}


function customCheckParser(block) {
    const wrapper = document.createElement('div');
    wrapper.className = 'd-flex';
    wrapper.style.padding = "1em 0";
    if (block.data.height !== 0) {
        wrapper.style.height = block.data.blockheight + "px";
    }

    const labelWrapper = document.createElement('div');
    labelWrapper.className = 'd-flex align-items-center';
    labelWrapper.style.width = 'auto';

    const labelElement = document.createElement('label');
    labelElement.textContent = block.data.label;
    labelElement.style.marginRight = "10px";
    labelElement.style.fontSize = block.data.labelFontSize;
    labelElement.style.marginBottom = 'auto';
    labelElement.style.marginTop = 'auto';
    labelElement.style.fontFamily = block.data.labelFamily;
    labelElement.style.fontWeight = block.data.labelBold;
    labelElement.style.fontStyle = block.data.labelItalic;
    if (block.data.optionPosition === 'vertical' && block.data.labelPosition === 'left') {
        wrapper.classList.remove('flex-column');
        labelWrapper.style.width = 'auto';
        labelWrapper.classList.remove('align-items-center');
        labelElement.style.marginTop = 'unset';

    }
    else {
        labelWrapper.classList.add('align-items-center');
        labelElement.style.marginTop = 'auto';
        if (block.data.optionPosition === 'vertical') {
            wrapper.classList.add('flex-column');
            wrapper.classList.remove('radio-options');

        }
        else {
            wrapper.classList.remove('flex-column');
            wrapper.classList.add('radio-options');
        }

        if (block.data.labelPosition === 'top') {
            labelWrapper.style.width = '100%';
        }
        else {
            labelWrapper.style.width = 'auto';
        }

    }



    labelWrapper.appendChild(labelElement);

    wrapper.append(labelWrapper);
    const radiodiv = document.createElement('div');
    radiodiv.className = 'm-0 p-0';

    block.data.options.forEach(option => {
        const checkboxWrapper = document.createElement('div');
        checkboxWrapper.className = 'form-check d-flex align-items-center radio-option';

        const checkboxInput = document.createElement('input');
        checkboxInput.type = 'checkbox';
        checkboxInput.className = 'form-check-input mt-0';
        checkboxInput.name = 'checkbox-group';
        if (option.selected) {
            checkboxInput.setAttribute('checked', 'checked');
        }

        const checkboxLabel = document.createElement('label');
        checkboxLabel.className = 'form-check-label';
        checkboxLabel.textContent = option.text;
        checkboxLabel.style.fontSize = block.data.optionsFontSize;
        checkboxLabel.style.fontFamily = block.data.optionFamily;
        checkboxLabel.style.fontWeight = block.data.optionBold;
        checkboxLabel.style.fontStyle = block.data.optionItalic;

        checkboxWrapper.appendChild(checkboxInput);
        checkboxWrapper.appendChild(checkboxLabel);

        if (block.data.optionPosition === 'vertical' && block.data.labelPosition === 'left') {
            radiodiv.appendChild(checkboxWrapper);
        }
        else {
            wrapper.appendChild(checkboxWrapper);
        }
    });

    if (block.data.optionPosition === 'vertical' && block.data.labelPosition === 'left') {
        wrapper.appendChild(radiodiv);
    }


    return wrapper.outerHTML;

    return '';
}


function customInputParser(block) {
    if (block.data) {
        const wrapper = document.createElement('div');
        wrapper.className = 'd-flex align-items-center';
        wrapper.style.position = 'relative';
        wrapper.style.padding = "1em 0";

        const labelInput = document.createElement('label');
        labelInput.className = 'input-block-label';
        labelInput.textContent = block.data.labelTextInput;
        labelInput.style.width = "auto";
        labelInput.style.marginRight = "10px";
        labelInput.style.whiteSpace = 'nowrap';
        labelInput.style.fontSize = block.data.textSize;
        labelInput.style.flexGrow = '0';
        labelInput.style.padding = '0.4em 0';
        labelInput.style.lineHeight = '1.2';

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'd-flex';
        inputWrapper.style.width = '100%';


        const inputValueElement = document.createElement('span');
        inputValueElement.className = 'form-control mr-2';
        inputValueElement.textContent = block.data.value || block.data.inputplaceholder;
        inputValueElement.style.width = block.data.inputwidth + "%";
        inputValueElement.style.fontSize = block.data.inputSize;
        inputValueElement.style.lineHeight = '1.2';
        inputValueElement.style.border = '1px solid #ccc';
        inputValueElement.style.padding = '0.4em';

        inputWrapper.appendChild(inputValueElement);

        wrapper.appendChild(labelInput);
        wrapper.appendChild(inputWrapper);
        inputValueElement.style.width = block.data.inputwidth + "%";
        inputValueElement.style.fontSize = block.data.inputSize;
        inputValueElement.style.fontFamily = block.data.inputfamily;
        inputValueElement.placeholder = block.data.inputplaceholder;
        labelInput.style.fontSize = block.data.textSize;
        labelInput.style.fontFamily = block.data.labelfamily;
        labelInput.textContent = block.data.labelTextInput;
        labelInput.style.fontWeight = block.data.labelBold;
        labelInput.style.fontStyle = block.data.labelItalic;

        if (block.data.labelPosition === 'top') {
            wrapper.classList.add('flex-column');
            wrapper.classList.remove('align-items-center');
            labelInput.style.padding = "0.4em 0";
            labelInput.style.marginBottom = '0.4em';
        } else {
            wrapper.classList.remove('flex-column');
            wrapper.classList.add('align-items-center');
        }

        return wrapper.outerHTML;
    }
    return '';
}

function customTextAreaParser(block) {

    const scaleY = 841.89 / window.eHeight;
    const wrapper = document.createElement('div');
    wrapper.className = 'd-flex align-items-center';
    wrapper.style.position = 'relative';
    wrapper.style.padding = "1em 0";

    const labelInput = document.createElement('label');
    labelInput.className = 'input-block-label';
    labelInput.textContent = block.data.labelTextInput;
    labelInput.style.width = "auto";
    labelInput.style.marginRight = "10px";
    labelInput.style.fontSize = block.data.textSize || '1em';
    labelInput.style.flexGrow = '0';
    labelInput.style.padding = '0.4em 0';
    labelInput.style.lineHeight = '1.2';

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'd-flex';
    inputWrapper.style.width = '99%';
    inputWrapper.style.maxWidth = '99%';
    inputWrapper.style.marginRight = '1%'


    const inputElement = document.createElement('div');
    inputElement.className = 'simulated-textarea';
    inputElement.setAttribute('contenteditable', true);
    inputElement.setAttribute('placeholder', block.data.inputplaceholder);
    inputElement.style.width = block.data.inputwidth + "%";
    inputElement.style.maxWidth = '100%';
    inputElement.style.fontSize = block.data.inputSize || '1em';
    inputElement.style.lineHeight = '1.2';
    inputElement.style.height = (0.20 * 1108.4) + 'px';
    inputElement.style.border = '1px solid #ced4da';
    inputElement.style.padding = '0.4em';
    inputElement.style.overflow = 'auto';
    inputElement.style.whiteSpace = 'pre-wrap';
    inputElement.style.overflowWrap = 'break-word';


    inputElement.innerHTML = DOMPurify.sanitize(block.data.value || '');

    inputWrapper.appendChild(inputElement);

    // Set font styles
    inputElement.style.fontFamily = block.data.inputfamily || 'inherit';
    labelInput.style.fontFamily = block.data.labelfamily || 'inherit';
    labelInput.style.fontWeight = block.data.labelBold === 'bold' ? 'bold' : 'normal';
    labelInput.style.fontStyle = block.data.labelItalic === 'italic' ? 'italic' : 'normal';

    if (block.data.labelPosition === 'top') {
        wrapper.classList.add('flex-column');
        wrapper.classList.remove('align-items-center');
        labelInput.style.marginBottom = '0.4em';
    } else {
        wrapper.classList.remove('flex-column');
        wrapper.classList.add('align-items-center');
    }

    wrapper.appendChild(labelInput);
    wrapper.appendChild(inputWrapper);

    // Return HTML as a string
    return wrapper.outerHTML;
}

function customButtonParser(block) {
    if (block.data) {

        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.padding = '1em 0';

        const buttonElement = document.createElement('button');
        buttonElement.className = 'btn btn-primary';
        buttonElement.textContent = block.data.buttonText;
        buttonElement.style.width = block.data.buttonWidth;
        buttonElement.style.fontSize = block.data.buttonFontSize;
        buttonElement.style.fontFamily = block.data.buttonFontFamily;
        buttonElement.style.fontWeight = block.data.buttonBold;
        buttonElement.style.fontStyle = block.data.buttonItalic;
        buttonElement.style.backgroundColor = block.data.buttonBackgroundColor;
        buttonElement.style.borderColor = block.data.buttonBorderColor;
        buttonElement.type = block.data.buttonAction;


        wrapper.appendChild(buttonElement);

        return wrapper.outerHTML;


    }
    return '';
}

function customSignatureParser(block) {


    const wrapper = document.createElement('div');
    wrapper.className = 'input-block';
    wrapper.style.position = 'relative';
    wrapper.style.height = block.data.height;
    wrapper.style.textAlign = block.data.alignment;
    wrapper.style.padding = "1em 0";


    const inputDiv = document.createElement('div');
    inputDiv.style.border = "1px solid #44aad1";

    inputDiv.style.width = (window.eHeight * 0.2) + 'px';
    inputDiv.id = 'Signature';
    inputDiv.style.height = (window.eHeight * 0.05) + 'px';
    inputDiv.textContent = block.data.content;
    inputDiv.style.backgroundColor = "#d8d7d78a";
    inputDiv.style.color = "#44aad1";
    inputDiv.style.fontSize = "100%";
    inputDiv.style.display = 'inline-block';
    inputDiv.style.textAlign = 'center'
    wrapper.appendChild(inputDiv);
    wrapper.style.visibility = "hidden";
    wrapper.appendChild(inputDiv);
    return wrapper.outerHTML;
}
function customEsealParser(block) {

    const wrapper = document.createElement('div');
    wrapper.className = 'input-block';
    wrapper.style.position = 'relative';
    wrapper.style.height = block.data.height;
    wrapper.style.textAlign = block.data.alignment;
    wrapper.style.padding = "1em 0";


    const inputDiv = document.createElement('div');
    inputDiv.style.border = "1px solid #44aad1";

    inputDiv.style.width = (window.eHeight * 0.10) + 'px';;
    inputDiv.id = 'Signature';
    inputDiv.style.height = (window.eHeight * 0.10) + 'px';
    inputDiv.textContent = block.data.content;
    inputDiv.style.backgroundColor = "#d8d7d78a";
    inputDiv.style.color = "#44aad1";
    inputDiv.style.fontSize = "100%";
    inputDiv.style.display = 'inline-block';
    inputDiv.style.textAlign = 'center'
    wrapper.appendChild(inputDiv);
    wrapper.style.visibility = "hidden";
    wrapper.appendChild(inputDiv);
    return wrapper.outerHTML;
}


function customImageParser(block) {
    if (block.data) {
        const wrapper = document.createElement('div');
        const scaleY = 841.89 / window.eHeight;
        wrapper.className = 'image-block';

        wrapper.style.padding = "1em 0";

        const imageInput = document.createElement('input');
        imageInput.type = 'file';
        imageInput.accept = 'image/*';
        imageInput.style.display = 'none';

        const placeholder = document.createElement('div');
        placeholder.style.width = block.data.width + "%";
        const percentageNumber = parseFloat(block.data.height);
        const decimalValue = percentageNumber / 100;
        placeholder.style.height = (decimalValue * 1108.4) + 'px';
        placeholder.style.backgroundColor = '#e0e0e0';
        placeholder.style.display = 'flex';
        placeholder.style.alignItems = 'center';
        placeholder.style.justifyContent = 'center';
        placeholder.style.cursor = 'pointer';
        placeholder.style.textAlign = 'center';
        placeholder.innerHTML = DOMPurify.sanitize(block.data.placeholderText || 'Upload Image');
        placeholder.style.color = '#999';
        placeholder.style.fontSize = '18px';
        placeholder.style.fontStyle = 'italic';
        placeholder.style.wordBreak = 'break-word';


        wrapper.appendChild(placeholder);


        if (block.data.url) {

            const img = document.createElement('img');
            img.src = block.data.url;
            img.style.maxWidth = '100%';
            img.style.width = block.data.width + "%";
            const percentageNumber = parseFloat(block.data.height);
            const decimalValue = percentageNumber / 100;
            img.style.height = (decimalValue * 1108.4) + 'px';
            wrapper.innerHTML = '';
            wrapper.appendChild(img);

            switch (block.data.alignment) {
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
            switch (block.data.alignment) {
                case 'left':
                    placeholder.style.margin = '0';
                    break;
                case 'center':
                    placeholder.style.margin = '0 auto';
                    break;
                case 'right':
                    placeholder.style.margin = '0 0 0 auto';
                    break;
            }
        }


        return wrapper.outerHTML;
    }
    return '';
}








document.addEventListener('DOMContentLoaded', () => {
    $('#networkOverlay').hide();
    // $('#digitalforms').addClass('active')

    const pdfSchema = document.getElementById('pdfschema').value;
    const editorInstancesData = JSON.parse(pdfSchema);

    const pdfContainer = document.getElementById('pdf-container');



    function renderEditorInstance(data, index) {
        const editorId = `editor-instance-${index}`;


        const editorDiv = document.createElement('div');
        editorDiv.id = editorId;
        editorDiv.classList.add('editor-instance');
        if (window.innerWidth >= 768) {
            editorDiv.style.width = '90%';
            editorDiv.style.paddingLeft = "0px";
        } else {
            editorDiv.style.width = '100%';
            editorDiv.style.paddingLeft = "15px";
        }

        editorDiv.style.backgroundColor = 'white';
        editorDiv.style.border = '1px solid #ccc';
        editorDiv.style.margin = '2%';
        editorDiv.style.overflow = 'hidden';
        editorDiv.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';



        pdfContainer.appendChild(editorDiv);


        const editorInstance = new EditorJS({
            holder: editorId,
            tools: {
                paragraph: ParagraphBlock,
                header: HeaderBlock,
                check: CheckBoxBlock,
                radio: RadioBlock,
                inputfield: InputBlock,
                textarea: TextAreaBlock,
                select: SelectTool,
                image: ImageBlock,
                signature: SignatureBlock,
                eseal: EsealBlock,
                button: ButtonBlock,
                onlytext: OnlyTextBlock,
                table: TableBlock,
                dummy: dummyBlock
            },
            defaultBlock: 'dummy',
            onReady: async () => {

                await editorInstance.render(data);
                // var codex = editorDiv.querySelector(".codex-editor__redactor");
                // const computedStylecodex = window.getComputedStyle(codex);
                // var codexheight = parseFloat(computedStylecodex.height);
                // const editorHeight = codexheight;
                // editorDiv.style.height = (codexheight - 300) + 'px';
                editorDiv.style.minHeight = "1108.4px";
                disableAddingBlocks()
            },
            onChange: async (api, event) => {


            },


        });
        editorinstancelist.push(editorInstance)
        setheight(editorDiv);
    }

    function setheight(editorDiv) {
        const computedStyle = window.getComputedStyle(editorDiv);
        var editorWidth = parseFloat(computedStyle.width);

        window.eWidth = editorWidth
        window.eHeight = 1108.4;



    }


    editorInstancesData.forEach((editorData, index) => {
        renderEditorInstance(editorData, index);
    });

    const restrictedClass = "ce-block--selected";

    const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
            mutation.target.classList.forEach((cls) => {
                if (cls === restrictedClass) {
                    mutation.target.classList.remove(restrictedClass);
                }
            });
        });
    });


    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ["class"] });



});



async function handleDownloadPDF() {



    if (editorinstancelist && editorinstancelist.length > 0) {
        let htmlContent = '';


        for (const instance of editorinstancelist) {

            const content = await instance.save();


            const edjsParser = edjsHTML({
                table: customTableParser,
                select: customSelectParser,
                check: customCheckParser,
                radio: customRadioParser,
                inputfield: customInputParser,
                image: customImageParser,
                button: customButtonParser,
                onlytext: customOnlytextParser,
                signature: customSignatureParser,
                eseal: customEsealParser,
                textarea: customTextAreaParser,
                header: customHeaderparser,
                paragraph: customParagraphparser
            });


            const htmlContentArray = edjsParser.parse(content);
            const currentHtmlContent = htmlContentArray.join('');

            htmlContent += `<div>${currentHtmlContent}</div><div style="page-break-after: always;"></div>`;
        }


        htmlContent = htmlContent.replace(/<div style="page-break-after: always;"><\/div>$/, '');


        const options = {
            margin: 10,
            filename: 'editor_content.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait',
                putOnlyUsedFonts: true,
                precision: 16,
            },
            enableForms: true,
        };


        const pdfBlob = await html2pdf().from(htmlContent).set(options).output('blob');


        return pdfBlob;
    }
}

async function validatemandatory() {
    let isnotpassed = false;
    let submittedjson = {};

    for (const instance of editorinstancelist) {
        const content = await instance.save();


        for (const block of content?.blocks || []) {
            if (block.data.mandatory) {


                if (block.type === "inputfield" || block.type === "textarea") {
                    if (block.data.value.trim() == "") {
                        isnotpassed = true;
                    }
                }
                else if (block.type === "radio" || block.type === "check") {
                    // block.data.options.forEach((item) => {
                    //     submittedjson[item.text] = item.selected ? "true" : "false";
                    // });
                    const isAnyOptionSelected = block.data.options.some(option => option.selected);
                    if (!isAnyOptionSelected) {
                        isnotpassed = true;
                    }
                }
                else if (block.type === "select") {
                    submittedjson[block.data.fieldName] = block.data.selected;
                }
                else if (block.type === "onlytext") {
                    if (block.data.value.trim() == "") {
                        isnotpassed = true;
                    }
                }
                else if (block.type === 'image') {
                    if (block.data.url.trim() == "") {
                        isnotpassed = true;
                    };
                }
                else if (block.type === 'table') {
                    const isEveryCellFilled = block.data.cells.every(row =>
                        row.every(cell => cell.trim() !== "")
                    );
                    if (!isEveryCellFilled) {
                        isnotpassed = true;
                    }
                }

            }
        }
    }

    return isnotpassed;
}


async function generateDocument() {
    $('#overlay').show();
    const isnotpassed = await validatemandatory();
    if (isnotpassed) {
        $('#overlay').hide();
        swal({
            title: "Info",
            text: "Please Fill all Mandatory Fields",
            type: "error",
        });
        return;
    }

    var fileFormData = new FormData();
    var userData = JSON.parse(document.getElementById('userdata').value);
    var roleAnnotations = {};
    var signingOrder = {};
    var roleMap = [{}];

    Data.forEach((role, index) => {
        roleId = (role._id);
        signingOrder[roleId] = index + 1;
        roleAnnotations[roleId] = {
            "placeHolderCoordinates": role.PlaceHolderCoordinates,
            "esealplaceHolderCoordinates": role.EsealPlaceHolderCoordinates,
            "qrPlaceHolderCoordinates": { "imgHeight": null, "imgWidth": null, "signatureYaxis": null, "signatureXaxis": null, "pageNumber": null }
        }
        if (index == 0) {
            roleMap[0][roleId] = {
                "email": userData.Email,
                "suid": userData.Suid,
                "accountType": userData.AccountType,
                "RoleName": role.Roles.name,
                "orgUid": userData.OrganizationId,
                "orgName": userData.OrganizationName,
                "delegationid": role.Roles.delegationId
            }
        } else {

            if (role.Roles.organizationId && role.Roles.organizationId.trim() !== '') {
                roleMap[0][roleId] = {
                    "email": role.Roles.email,
                    "suid": role.Roles.suid,
                    "accountType": "organization",
                    "RoleName": role.Roles.name,
                    "orgUid": role.Roles.organizationId,
                    "orgName": role.Roles.organizationName,
                    "delegationid": role.Roles.delegationId
                }
            } else {

                roleMap[0][roleId] = {
                    "email": role.Roles.email,
                    "suid": role.Roles.suid,
                    "accountType": "self",
                    "RoleName": role.Roles.name,
                    "orgUid": role.Roles.organizationId,
                    "orgName": role.Roles.organizationName,
                    "delegationid": role.Roles.delegationId
                }
            }


        }


    });

    fileFormData.append("sequentialSigning", false);
    fileFormData.append("documentName", docFileName);
    fileFormData.append("RequestType", "Publish");
    fileFormData.append("TemplateType", "WEB");
    fileFormData.append("daysToComplete", Daystocomplete);
    fileFormData.append("preFilledData", JSON.stringify(""));
    fileFormData.append("htmlSchema", document.getElementById('pdfschema').value);
    fileFormData.append("pdfSchema", document.getElementById('schema').value);
    fileFormData.append("formId", tempid);

    fileFormData.append("roleMappings", JSON.stringify(roleMap));
    fileFormData.append("RoleAnnotations", JSON.stringify(roleAnnotations));
    fileFormData.append("roleSigningOrder", JSON.stringify(signingOrder));

    $('#overlay').hide();

    SaveDocument(SavePublishedUrl, fileFormData)
        .then((response) => {

            if (response.status == "Success") {
                var documentdata = response.message;
                console.log(documentdata[0]._id)

                saveAnnotations(documentdata[0]._id);
            }
            else {
                swal({
                    title: "Error",
                    text: response.message,
                    type: "error",
                }, function (isConfirm) {
                    if (isConfirm) {
                        document.getElementById("navigationNetworkOverlay").style.display = "block";
                        if (loggedAccountType.toLowerCase() === 'self') {
                            window.location.href = GlobalindexUrl;
                        }
                        else {
                            window.location.href = OrgindexUrl;
                        }
                    }
                });

            }

        })
}

async function saveAnnotations(docId) {
    var isesealpresent = false;
    const signele = document.getElementById('Signature')
    if (signele) {
        overlaysignflag = true;
    }
    const esealele = document.getElementById('Eseal')
    if (esealele) {
        overlayesealflag = true;
        isesealpresent = true
    }
    const annotations = await handleSaveAllInstances();
    const json = JSON.stringify(annotations);
    const blob = await handleDownloadPDF();
    var fileFormData = new FormData();
    fileFormData.append("File", blob, "webform")
    fileFormData.append("FormId", tempid);
    fileFormData.append("FormFieldData", json);
    fileFormData.append("isEsealPresent", isesealpresent);
    fileFormData.append('DocumentId', docId);
    SignDocument(SaveandSignUrl, fileFormData)
        .then((response) => {

            if (response.status == "Success") {
                swal({
                    title: "Success",
                    text: response.message,
                    type: "success",
                }, function (isConfirm) {
                    if (isConfirm) {
                        document.getElementById("navigationNetworkOverlay").style.display = "block";
                        if (loggedAccountType.toLowerCase() === 'self') {
                            window.location.href = GlobalindexUrl;
                        } else {
                            window.location.href = OrgindexUrl;
                        }

                    }
                });
            }
            else {
                swal({
                    title: "Error",
                    text: response.message,
                    type: "error",
                }, function (isConfirm) {
                    if (isConfirm) {

                        document.getElementById("navigationNetworkOverlay").style.display = "block";
                        if (loggedAccountType.toLowerCase() === 'self') {
                            window.location.href = GlobalindexUrl;
                        } else {
                            window.location.href = OrgindexUrl;
                        }

                    }
                });

            }

        })


}

function SignDocument(url, formData) {

    console.log($)
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

                if (overlaysignflag && overlayesealflag) {

                    $('#overlay7').css('display', 'flex');



                }

                else if (overlayesealflag) {

                    $('#overlay6').css('display', 'flex');

                }

                else {

                    $('#overlay8').css('display', 'flex');

                }


            },
            complete: function () {
                if (overlaysignflag && overlayesealflag) {

                    $('#overlay7').hide();



                }

                else if (overlayesealflag) {

                    $('#overlay6').hide();

                }

                else {

                    $('#overlay8').hide();

                }
            },
            success: function (data) {
                resolve(data)
            },
            // error: function (err) {
            //     reject(err)
            // }
            error: ajaxErrorHandler
        });
    });
}

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
            beforeSend: function () {
                $('#overlay').show();
            },
            complete: function () {
                $('#overlay').hide();
            },

            success: function (data) {
                resolve(data)
            },

            error: ajaxErrorHandler
        });
    });
}

async function handleSaveAllInstances() {
    const submittedjson = {};


    for (const instance of editorinstancelist) {
        const content = await instance.save();

        content?.blocks.map((block) => {
            if (block.type === "inputfield" || block.type === "textarea") {

                submittedjson[block.data.fieldName] = block.data.value;
            }
            else if (block.type === "radio") {
                block.data.options.map((item) => {
                    submittedjson[item.text] = item.selected ? "true" : "false";
                });
            }
            else if (block.type === "check") {
                block.data.options.map((item) => {
                    submittedjson[item.text] = item.selected ? "true" : "false";
                });
            }
            else if (block.type === "select") {
                submittedjson[block.data.fieldName] = block.data.selected;
            }
            else if (block.type === "onlytext") {
                submittedjson[block.data.fieldName] = block.data.value;
            }
            // else if (block.type === 'table') {
            //     submittedjson[block.data.fieldName] = block.data.cells
            // }
            // else if (block.type === 'image') {
            //     submittedjson[block.data.fieldName] = block.data.url
            // };
        });
    }

    return submittedjson

}

function disableAddingBlocks() {
    document.querySelectorAll('.ce-paragraph.cdx-block').forEach(element => element.contentEditable = 'false');
    // document.querySelectorAll('.ce-block__plus').forEach(button => button.style.display = 'none');
    // document.querySelectorAll('.ce-toolbar__plus').forEach(button => button.style.display = 'none');
    // document.querySelectorAll('.ce-toolbar__settings-btn').forEach(button => button.style.display = 'none');
    // document.querySelectorAll('.ce-inline-toolbar').forEach(button => button.style.display = 'none')
    document.querySelectorAll('.ce-header').forEach(element => element.contentEditable = 'false');


}

function autofill() {

    const data = document.getElementById('autodata').value;
    if (data == "") {
        return swal({
            title: "Info",
            text: "Failed to receive Auto Fill data",
            type: "info",
        });
    }
    var autodata = JSON.parse(data);

    let fieldsFilled = 0;
    let totalAutofillFields = 0;

    if (document.getElementById('email')) {
        document.querySelectorAll(`[id="email"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.emailId;
            }
        });
    }

    if (document.getElementById('Phone Number')) {
        document.querySelectorAll(`[id="Phone Number"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.mobileNo;
            }
        });
    }

    if (document.getElementById('Full Name')) {
        document.querySelectorAll(`[id="Full Name"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.primaryIdentifier + " " + autodata.subscriberData.secondaryIdentifier;
            }
        });
    }

    if (document.getElementById('name')) {
        document.querySelectorAll(`[id="name"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.primaryIdentifier + " " + autodata.subscriberData.secondaryIdentifier;
            }
        });
    }

    if (document.getElementById('lastname')) {
        document.querySelectorAll(`[id="lastname"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.secondaryIdentifier;
            }
        });
    }

    if (document.getElementById('firstname')) {
        document.querySelectorAll(`[id="firstname"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.primaryIdentifier;
            }
        });
    }

    if (document.getElementById('Gender')) {
        document.querySelectorAll(`[id="Gender"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.gender;
            }
        });
    }

    if (document.getElementById('x_cst_indv_sex')) {
        document.querySelectorAll(`[id="x_cst_indv_sex"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.gender;
            }
        });
    }

    if (document.getElementById('Nation')) {
        document.querySelectorAll(`[id="Nation"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.nationality;
            }
        });
    }

    if (document.getElementById('Date of Birth')) {
        document.querySelectorAll(`[id="Date of Birth"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "text" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.dateOfBirth.split(' ')[0];
            } else if (input.type === "date" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.dateOfBirth.split(' ')[0];
            }
        });
    }

    if (document.getElementById('birthdate')) {
        document.querySelectorAll(`[id="birthdate"]`).forEach((input) => {
            totalAutofillFields += 1;
            if (input.type === "date" && input.value.trim() === "") {
                fieldsFilled += 1;
                input.value = autodata.subscriberData.dateOfBirth.split(' ')[0];
            }
        });
    }

    if (document.getElementById('Selfie')) {
        document.querySelectorAll(".Selfiediv").forEach((input) => {
            totalAutofillFields += 1;
            if (input.querySelector('#Selfie').tagName.toLowerCase() === 'img') {
                const src = input.querySelector('#Selfie').getAttribute('src');
                if (src.trim() == "") {
                    fieldsFilled += 1;
                    input.querySelector('#Selfie').setAttribute('src', 'data:image/jpeg;base64,' + autodata.subscriberData.subscriberSelfie);
                    input.querySelector('#Selfieplaceholder').style.display = 'none';
                    input.querySelector('#Selfie').style.display = 'block';
                    input.querySelector('#Selfie').style.display = 'block';


                }
            }
        });
    }


    if (totalAutofillFields === 0) {

        swal({
            title: "Info",
            text: "No Fields available to Auto Fill",
            type: "info",
        });

    }
    else if (fieldsFilled > 0) {
        swal({
            title: "Info",
            text: "Auto Fill Fields filled successfully",
            type: "success",
        });

    }
    else {
        swal({
            title: "Info",
            text: "Auto Fill not applied as fields are already filled",
            type: "info",
        });
    }


}