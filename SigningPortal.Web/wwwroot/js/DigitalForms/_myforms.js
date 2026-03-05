$(document).ready(function () {
    $('#networkOverlay').hide();
    $('#MyListTb').DataTable({
        paging: true,
        lengthChange: false,
        pageLength: 5,
        orderClasses: false,
        stripeClasses: [],
        info: true,
        "ordering": false
    });

    updateTimestamps();

    $("#digitalFormModalContinueButton").on("click", function () {
        ChangeStatus(changeSelectedText(), getRolesDetails());
    });

    $("#DownloadPDF").on("click", function () {
        DownloadForm();
    });

    $("#sendFormModalcontinueBtn").on("click", function () {
        getSelectedSendType();
    });


    $(document).on("click", ".btn-unpublish", function (e) {
        e.preventDefault(); // stop page jump
        const id = $(this).data("id");
        Unpublish(id);
    });

    $(document).on("click", ".btn-sendform", function (e) {
        e.preventDefault();
        const id = $(this).data("id");
        const edmsId = $(this).data("edmsid");
        const name = $(this).data("name");
        const action = $(this).data("action");
        const type = $(this).data("type");

        SendForm(id, edmsId, name, action, type);
    });

    $(document).on("click", ".btn-publish", function (e) {
        e.preventDefault();
        const roles = $(this).data("roles");
        const id = $(this).data("id");
        const sigs = $(this).data("sigs");
        const allRequired = $(this).data("allrequired");

        Publish(this, id, sigs, allRequired);
    });

    $(document).on("click", ".btn-modalform", function (e) {
        e.preventDefault();
        const id = $(this).data("id");
        modalForm(id);
    });



    // const observer = new MutationObserver(() => {
    //     updateTimestamps();
    // });

    // observer.observe(document.body, { childList: true, subtree: true });







});





var TemplateId = ""


function redirectToDocumentDetails(id) {
    // Construct the URL for the action
    var url = DocumentDetailsByIdUrl + "/" + id;
    // Redirect to the URL
    const urlval = new URL(url, window.location.origin);
    window.location.href = urlval.toString();
}


window.Publish = function (ele, templateId, noofsignatories, iseseal) {
    const isesealpresent = document.getElementById('isesealpresent')

    // const globalradio = document.getElementById('Globally')
    // if (globalradio) {
    //     globalradio.disabled = true;
    // }
    if (Number(noofsignatories) > 1) {
        document.getElementById('publishmodalroles').style.maxWidth = '750px';
    } else {
        document.getElementById('publishmodalroles').style.maxWidth = '750px';
    }


    var rolesJson = JSON.parse(ele.getAttribute('data-roles'));
    const roleNamesWithEseal = rolesJson
        .filter(item =>
            item.EsealPlaceHolderCoordinates &&
            item.EsealPlaceHolderCoordinates.signatureXaxis !== null
        )
        .map(item => item.Roles.name);
    const selectedOrganizations = {};
    var container = document.getElementById('publishroles');
    container.innerHTML = '';
    rolesJson.forEach((role, index) => {
        if (index != 0) {
            var roleWrapper = document.createElement('div');
            roleWrapper.style.marginBottom = '20px';

            var label = document.createElement('label');
            label.textContent = role.Roles.name + ":";
            label.style.fontWeight = 'bold';
            label.style.fontSize = '1rem';
            label.style.display = 'block';
            label.style.marginBottom = '10px';

            var inputSelectWrapper = document.createElement('div');
            inputSelectWrapper.style.display = 'flex';
            inputSelectWrapper.style.gap = '15px';
            inputSelectWrapper.style.alignItems = 'center';

            var emailInput = document.createElement('input');
            emailInput.type = 'email';
            emailInput.placeholder = 'Enter your email';
            emailInput.style.flex = '1';
            emailInput.style.padding = '6px';
            emailInput.style.fontSize = '1rem';
            emailInput.style.border = '1px solid #ddd';
            emailInput.style.borderRadius = '8px';
            emailInput.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            emailInput.style.width = '70%';
            emailInput.id = role._id;


            const alternatediv = document.createElement('div');

            alternatediv.style.display = "none";

            var select = document.createElement('select');
            select.style.padding = '10px';
            select.style.fontSize = '1rem';
            select.style.border = '1px solid #ddd';
            select.style.borderRadius = '8px';
            select.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            select.style.cursor = 'pointer';
            select.style.width = '30%';

            const options = [
                { value: 'ChooseOrganization', text: 'Choose Account' },
            ];

            options.forEach(optionData => {
                const option = document.createElement('option');
                option.value = optionData.value;
                option.textContent = optionData.text;
                select.appendChild(option);
            });

            emailInput.addEventListener('blur', (event) => {

                select.innerHTML = "";
                const options = [
                    { value: 'ChooseOrganization', text: 'Choose Account' },
                ];

                options.forEach(optionData => {
                    const option = document.createElement('option');
                    option.value = optionData.value;
                    option.textContent = optionData.text;
                    select.appendChild(option);
                });
                sendEmailToGetThumbnail(emailInput.value)
                    .then(orgsAndIds => {
                        if (orgsAndIds) {

                            const inputs = (document.getElementById('publishroles')).querySelectorAll('input');

                            const values = Array.from(inputs)
                                .map(input => input.value.trim())
                                .filter(value => value !== '');
                            const hasDuplicates = values.length !== new Set(values).size;


                            const selectorgroles = (document.getElementById('publishroles')).querySelectorAll('select');
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

                                $('#digitalFormModal').css('z-index', 1040);
                                swal({
                                    title: "Info",
                                    text: "Roles within the same document cannot have the same signatory.",
                                    type: "info",
                                }, function (isConfirm) {

                                    $('#digitalFormModal').css('z-index', '');
                                });

                            }
                            else if (dataIdSet.has(targetValue)) {

                                $('#digitalFormModal').css('z-index', 1040);
                                swal({
                                    title: "Info",
                                    text: "Email of the subscriber already present the same document.",
                                    type: "info",
                                }, function (isConfirm) {

                                    $('#digitalFormModal').css('z-index', '');
                                });

                            } else {

                                var option1 = document.createElement('option');
                                option1.value = "";
                                option1.textContent = "Self";
                                option1.setAttribute('data-id', orgsAndIds["SELF"][1]);


                                if (role.EsealPlaceHolderCoordinates?.signatureXaxis !== null || orgsAndIds["SELF"][0] != emailInput.value) {
                                    option1.style.display = 'none';
                                }
                                select.appendChild(option1);

                                for (const [orgName, org] of Object.entries(orgsAndIds)) {

                                    if (orgName !== "SELF") {
                                        const option = document.createElement('option');
                                        option.value = org[0];
                                        option.textContent = orgName;
                                        option.setAttribute('data-id', org[1]);

                                        select.appendChild(option);

                                    }
                                }

                            }



                        }

                        else {

                            console.log("No organizations found or success flag was present.");
                        }

                    })
                    .catch(error => {

                        console.error("Error fetching organization details:", error);
                    });

            });

            select.addEventListener('change', async function () {
                const selectedOption = this.options[this.selectedIndex];
                const selectedValue = selectedOption.value;
                const selectedDataId = selectedOption.getAttribute('data-id');
                if (selectedValue == "self" || selectedValue == "ChooseOrganization") {
                    selectedOrganizations[role.Roles.name] = selectedValue;
                } else {

                    for (const esealRole of roleNamesWithEseal) {
                        if (esealRole !== role.Roles.name && selectedOrganizations[esealRole] === selectedValue) {
                            $('#digitalFormModal').css('z-index', 1040);

                            swal({
                                type: 'info',
                                title: 'E-seal Conflict',
                                text: `This organization is already used by ${esealRole} who has an e-seal. Only one e-seal per organization is allowed.`,
                            }, () => {

                                $('#digitalFormModal').css('z-index', '');
                                select.selectedIndex = 0;



                            })

                            return;
                        }
                    }


                    selectedOrganizations[role.Roles.name] = selectedValue;

                    var res = await handle_delegation_orgid_suid(selectedValue, selectedDataId, emailInput.value)

                    if (index == 0) {
                        if (res.delegateeid != "") {
                            select.innerHTML = "";
                            const options = [
                                { value: 'ChooseOrganization', text: 'Choose Account' },
                            ];

                            options.forEach(optionData => {
                                const option = document.createElement('option');
                                option.value = optionData.value;
                                option.textContent = optionData.text;
                                select.appendChild(option);
                            });
                        }
                    } else {
                        if (res.iscancelled == true) {
                            select.innerHTML = "";
                            const options = [
                                { value: 'ChooseOrganization', text: 'Choose Account' },
                            ];

                            options.forEach(optionData => {
                                const option = document.createElement('option');
                                option.value = optionData.value;
                                option.textContent = optionData.text;
                                select.appendChild(option);
                            });
                        }
                        else {
                            alternatediv.setAttribute("data-delegateid", res.delegateeid);
                        }


                    }


                }

            });

            inputSelectWrapper.appendChild(emailInput);
            inputSelectWrapper.appendChild(select);
            inputSelectWrapper.appendChild(alternatediv);

            roleWrapper.appendChild(label);
            roleWrapper.appendChild(inputSelectWrapper);

            container.appendChild(roleWrapper);
        }
        else if (index == 0) {

            if (role.EsealPlaceHolderCoordinates?.signatureXaxis !== null) {
                if (isesealpresent) {
                    var modelCount = ModelCount;
                    if (parseInt(modelCount) != 0) {
                        selectedOrganizations[role.Roles.name] = OrganizationUid;
                        isesealpresent.value = 'True';

                    }

                }
            }
            else {
                if (isesealpresent) {
                    isesealpresent.value = 'False';
                }
            }

            var roleWrapper = document.createElement('div');

            roleWrapper.style.display = 'flex';

            var label = document.createElement('label');
            label.textContent = role.Roles.name + ":";
            label.style.fontWeight = 'bold';
            label.style.fontSize = '1rem';
            label.style.display = 'block';
            label.style.marginBottom = '10px';
            label.style.marginRight = '1%';

            var inputSelectWrapper = document.createElement('div');
            inputSelectWrapper.id = "role1text";
            inputSelectWrapper.innerHTML = "This Role in the form can be anyone from your organization.";
            inputSelectWrapper.style.fontSize = '1rem';
            inputSelectWrapper.style.color = 'black';



            roleWrapper.appendChild(label);
            roleWrapper.appendChild(inputSelectWrapper);

            container.appendChild(roleWrapper);
        }
    });


    const errorSpan = document.getElementById('publisherrorspan');
    errorSpan.textContent = "";

    $("#digitalFormModal").modal('show');
    TemplateId = templateId;

}

function updateDependentText() {

    if (changeSelectedText() == "Publish") {
        document.getElementById('role1text').innerHTML = "This Role in the form can be anyone from your organization.";
    }
    else {
        document.getElementById('role1text').innerHTML = "This Role in the form can be any " + currentStaging + " Subscriber.";
    }

}
var radioButtons = document.querySelectorAll('input[name="publishOption"]');
radioButtons.forEach((radio) => {
    radio.addEventListener('change', updateDependentText);
});

function SendForm(tempId, edmsId, docName, flag, type) {
    $("#sendFormModal").modal('show');
    document.getElementById('sendtempid').value = tempId;
    document.getElementById('sendedmsid').value = edmsId;
    document.getElementById('senddocname').value = docName;
    document.getElementById('sendflag').value = flag;
    document.getElementById('sendtype').value = type;

}

// document.getElementById('csv-upload').addEventListener('change', function(event) {

//     const file = event.target.files[0];

//     if (file) {
//         const reader = new FileReader();
//         reader.onload = function(e) {
//             const content = e.target.result;

//             // Parse CSV and validate emails
//             const rows = content.split(/\r?\n/);



//             rows.forEach((row, index) => {
//                 const email = row.trim();
//                 console.log(email)
//             });


//         };
//         reader.readAsText(file);
//     }
// });

// document.querySelector('div[style*="border: 2px dashed"]').addEventListener('click', (event) => {
//     if (event.target.id !== 'csv-upload' && event.target.tagName !== 'LABEL') {
//         document.getElementById('csv-upload').click();
//     }

// });

function getSelectedValue() {

    $('#digitalFormModal').modal('hide');
    const radios = document.getElementsByName('publishOption');

    for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            return radios[i].value;
        }
    }

}

function changeSelectedText() {

    const radios = document.getElementsByName('publishOption');

    for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            return radios[i].value;
        }
    }

}

function getRolesDetails() {
    var container = document.getElementById('publishroles');
    var rolesdetails = {};
    var children = container.children;
    for (var i = 1; i < children.length; i++) {
        var child = children[i];

        var inputElement = child.querySelector('input');
        var selectElement = child.querySelector('select');
        var selectedSuid = selectElement.selectedOptions[0].getAttribute('data-id');

        const lastChild = (inputElement.parentElement).lastElementChild;

        rolesdetails[inputElement.id] = {
            "Email": inputElement.value,
            "OrganizationName": selectElement.selectedOptions[0].innerHTML,
            "OrganizationId": selectElement.value,
            "Suid": selectedSuid,
            "delegationId": lastChild.getAttribute("data-delegateid")
        }

    }
    return rolesdetails;

}

function getSelectedSendType() {
    $('#sendFormModal').modal('hide');
    const radios = document.getElementsByName('sendOption');



    var payload = {
        tempId: document.getElementById('sendtempid').value,
        edmsId: document.getElementById('sendedmsid').value,
        documentName: document.getElementById('senddocname').value,
        flag: document.getElementById('sendflag').value,
        type: document.getElementById('sendtype').value
    };
    for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            payload.flag = radios[i].value;
            if (radios[i].value == "Individual") {

                var baseUrl = SendFormUrl;
                const params = payload;

                const queryString = new URLSearchParams(params).toString();
                const urlWithParams = `${baseUrl}?${queryString}`;
                document.getElementById('navigationNetworkOverlay').style.display = 'block';
                const urlval = new URL(urlWithParams, window.location.origin);
                window.location.href = urlval.toString();
            } else {
                var baseUrl = SendFormUrl;
                const params = payload;

                const queryString = new URLSearchParams(params).toString();
                const urlWithParams = `${baseUrl}?${queryString}`;
                document.getElementById('navigationNetworkOverlay').style.display = 'block'
                const urlval = new URL(urlWithParams, window.location.origin);
                window.location.href = urlval.toString();
            }

        }
    }

}


async function showSuccess(message) {
    await swal({
        title: "Success",
        text: message,
        type: 'success',
    }, function (isConfirm) {
        if (isConfirm) {
            redirectToIndex();
        }
    });
    //redirectToIndex();
}
function redirectToIndex() {
    document.getElementById('navigationNetworkOverlay').style.display = 'block'
    const urlval = new URL(DigitalFormsIndexUrl, window.location.origin);
    window.location.href = urlval.toString();
}

function Unpublish(templateId) {
    $.ajax({
        url: changeStatusUrl,
        type: 'POST',
        data: { templateId: templateId, action: "Unpublish" },
        success: function (response) {
            handleResponse(response);
        },
        // error: function (xhr, status, error) {
        //     console.log("Error:", error);
        //     swal({
        //         title: 'Error',
        //         text: 'An error occurred while processing your request.',
        //         type: 'error',
        //     });
        // }
        error: ajaxErrorHandler
    });
}
function handleResponse(response) {
    const { status, message } = response;
    const type = status === 'Failed' ? 'info' : 'success';
    const title = status === 'Failed' ? 'Server response' : 'Success';

    swal({
        title: title,
        text: message,
        type: type,
    }, function (isConfirm) {
        if (isConfirm && status !== 'Failed') {
            redirectToIndex();
        }
    });
}

async function ChangeStatus(selectedValue, roledetails) {
    var container = document.getElementById('publishroles');
    const iseseal = document.getElementById('isesealpresent');
    // Find all select elements inside the container (not limited to direct children)
    var selectElements = container.querySelectorAll('select');

    // Loop through the select elements to check if any have a selected value of "ChooseOrganization"
    var hasChooseOrganization = Array.from(selectElements).some(function (select) {
        return select.value === "ChooseOrganization";
    });

    // Log the result
    if (iseseal?.value === 'True' && selectedValue === 'PublishAll') {
        const errorSpan = document.getElementById('publisherrorspan');
        errorSpan.textContent = "Global publishing is restricted due to the presence of an eSeal";
        errorSpan.style.color = "red";
    }
    else if (hasChooseOrganization) {
        const errorSpan = document.getElementById('publisherrorspan');
        errorSpan.textContent = "Please provide a valid email and select the organization.";
        errorSpan.style.color = "red"; // Set the text color to red
    } else {
        $('#digitalFormModal').modal('hide');
        try {

            const response = await $.ajax({
                url: NewChangeStatusUrl,
                type: 'POST',
                data: { templateId: TemplateId, action: selectedValue, roles: JSON.stringify(roledetails) },
                beforeSend: () => $('#overlay').show(),
                complete: () => $('#overlay').hide(),
            });

            if (response.status == "Failed") {
                await showError(response.message);
            } else {
                await showSuccess(response.message);
            }
        } catch (error) {
            console.log("Error:", error);
            await showError('An error occurred while processing your request.');
        }
    }

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