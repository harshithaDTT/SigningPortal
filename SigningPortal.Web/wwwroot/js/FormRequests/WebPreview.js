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

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'd-flex';
        inputWrapper.style.width = '100%';

        this.selectElement = document.createElement('select');
        this.selectElement.className = 'form-control mr-2';
        this.selectElement.id = this.data.label;
        this.selectElement.style.fontFamily = this.data.optionFamily;
        this.selectElement.style.fontSize = this.data.optionSize;
        this.selectElement.style.fontWeight = this.data.optionBold;
        this.selectElement.style.fontStyle = this.data.optionItalic;
        this.selectElement.style.width = this.data.selectWidth + "%";
        this.data.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.innerText = option.value;
            this.selectElement.appendChild(optionElement);
        });


        this.wrapper.appendChild(this.labelElement)
        inputWrapper.appendChild(this.selectElement);
        this.wrapper.appendChild(inputWrapper)


        this.applyLabelPosition();
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
            selectWidth: this.data.selectWidth
        };
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
        this.wrapper.className = 'd-flex align-items-center';
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



        inputWrapper.appendChild(this.inputElement);

        this.wrapper.appendChild(inputWrapper)

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
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'd-flex align-items-center';
        this.wrapper.style.position = 'relative';
        this.wrapper.style.padding = "1em 0";

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

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'd-flex';
        inputWrapper.style.width = '100%';

        this.inputElement = document.createElement('input');
        this.inputElement.type = 'text';
        this.inputElement.id = this.data.labelTextInput;
        this.inputElement.className = 'form-control mr-2';
        this.inputElement.placeholder = this.data.inputplaceholder;
        this.inputElement.value = this.data.value;
        this.inputElement.style.width = this.data.inputwidth + "%";
        this.inputElement.style.fontSize = this.data.inputSize;
        this.inputElement.style.lineHeight = '1.2';



        inputWrapper.appendChild(this.inputElement);

        this.wrapper.appendChild(this.labelInput);
        this.wrapper.appendChild(inputWrapper);
        this.applyLabelPosition();
        this.applyStyles();


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
            labelItalic: this.data.labelItalic
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
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'd-flex align-items-center';
        this.wrapper.style.position = 'relative';
        this.wrapper.style.padding = "1em 0";

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

        this.inputElement = document.createElement('textarea');
        this.inputElement.className = 'form-control mr-2';
        this.inputElement.placeholder = this.data.inputplaceholder;
        this.inputElement.value = this.data.value;
        this.inputElement.style.width = this.data.inputwidth + "%";
        this.inputElement.style.fontSize = this.data.inputSize;
        this.inputElement.style.lineHeight = '1.2';
        this.inputElement.style.resize = 'none';
        const scale = (766.29) / window.eHeight;

        this.inputElement.style.height = ((window.eHeight) * 0.20) + 'px';





        inputWrapper.appendChild(this.inputElement);


        this.wrapper.appendChild(this.labelInput);
        this.wrapper.appendChild(inputWrapper);
        this.applyLabelPosition();
        this.applyStyles();


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
            labelItalic: this.data.labelItalic
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

            if (option.selected) {
                checkboxInput.checked = true;
            }


            checkboxInput.addEventListener('change', () => {

                this.data.options.forEach((opt, i) => {
                    if (i == index) {
                        opt.selected = (i === index);
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
        table.className = 'custom-table';
        this.wrapper.appendChild(table);

        this.renderTable();

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
        inputDiv.style.textAlign = 'center';

        inputDiv.style.wordBreak = 'break-word';


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
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'image-block';

        this.wrapper.style.padding = "1em 0";

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
        this.placeholder.style.fontSize = '18px';
        this.placeholder.style.fontStyle = 'italic';
        this.placeholder.style.wordBreak = 'break-word';

        this.placeholder.onclick = () => this.imageInput.click();

        this.wrapper.appendChild(this.placeholder);


        this.renderImage();



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























document.addEventListener('DOMContentLoaded', () => {
    $('#networkOverlay').hide();
    // $('#digitalforms').addClass('active');

    const pdfSchema = document.getElementById('pdfschema').value;
    const editorInstancesData = JSON.parse(pdfSchema);

    const pdfContainer = document.getElementById('pdf-container');


    function renderEditorInstance(data, index) {
        const editorId = `editor-instance-${index}`;


        const editorDiv = document.createElement('div');
        editorDiv.id = editorId;
        editorDiv.classList.add('editor-instance');
        editorDiv.style.width = '100%';
        editorDiv.style.backgroundColor = 'white';
        editorDiv.style.border = '1px solid #ccc';
        editorDiv.style.overflow = 'hidden';
        editorDiv.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
        editorDiv.style.pointerEvents = 'none';



        pdfContainer.appendChild(editorDiv);


        const editorInstance = new EditorJS({
            holder: editorId,
            tools: {
                paragraph: ParagraphBlock,
                header: HeaderBlock,

                checklist: {
                    class: Checklist,
                    inlineToolbar: true,
                },
                check: CheckBoxBlock,
                radio: RadioBlock,
                inputfield: InputBlock,
                select: SelectTool,
                image: ImageBlock,
                signature: SignatureBlock,
                eseal: EsealBlock,
                button: ButtonBlock,
                onlytext: OnlyTextBlock,
                table: TableBlock,
                textarea: TextAreaBlock
            },
            onReady: async () => {

                await editorInstance.render(data);
                editorDiv.style.minHeight = "1108.4px";
                disableAddingBlocks()

            },
            onChange: (api, event) => {
                console.log('Now I know that Editor\'s content changed!', event)

            }

        });
        setheight(editorDiv);
    }

    function setheight(editorDiv) {
        const computedStyle = window.getComputedStyle(editorDiv);
        const editorWidth = parseFloat(computedStyle.width);
        window.eWidth = editorWidth
        const aspectRatio = 841.89 / 595.28;
        const editorHeight = editorWidth * aspectRatio;
        editorDiv.style.height = editorHeight + 'px';
        window.eHeight = editorHeight;
    }



    editorInstancesData.forEach((editorData, index) => {
        renderEditorInstance(editorData, index);
    });

    function disableAddingBlocks() {
        document.querySelectorAll('.ce-paragraph.cdx-block').forEach(element => element.contentEditable = 'false');
        document.querySelectorAll('.ce-block__plus').forEach(button => button.style.display = 'none');
        document.querySelectorAll('.ce-toolbar__plus').forEach(button => button.style.display = 'none');
        document.querySelectorAll('.ce-toolbar__settings-btn').forEach(button => button.style.display = 'none');
        document.querySelectorAll('.ce-inline-toolbar').forEach(button => button.style.display = 'none')
        document.querySelectorAll('.cdx-checklist__item-text').forEach(element => element.contentEditable = 'false');
        document.querySelectorAll('.ce-header').forEach(element => element.contentEditable = 'false');


    }
});