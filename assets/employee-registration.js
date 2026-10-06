(() => {
  const triggers = document.querySelectorAll('[data-employee-register]');
  let opened = false;
  triggers.forEach(trigger => trigger.addEventListener('click', async () => {
    if (opened) return;
    opened = true;
    const dialog = document.createElement('dialog');
    dialog.className = 'employee-registration-dialog';
    dialog.setAttribute('aria-labelledby', 'registrationTitle');
    dialog.innerHTML = `<form><div class="registration-heading"><div><div class="eyebrow">EMPLOYEE REGISTRATION</div><h2 id="registrationTitle">Register as an employee</h2></div><button type="button" class="secondary-button" data-close aria-label="Close">×</button></div><p>Submit your details for HR approval. Once approved, your name will appear on the attendance page.</p><div class="registration-fields"><label><span>Full name</span><input name="fullname" autocomplete="name" required maxlength="200"></label><label><span>Nickname</span><input name="nick" autocomplete="nickname" required maxlength="80"></label><label><span>Phone</span><input name="phone" type="tel" autocomplete="tel" required maxlength="30" placeholder="08x xxx xxxx"></label><label><span>Preferred branch</span><select name="locationId" required disabled><option value="">Loading...</option></select></label><label class="registration-bank"><span><span>Bank account number</span> <span>(optional)</span></span><input name="bank" type="text" inputmode="numeric" autocomplete="off" maxlength="30" pattern="[0-9\\s\\-]{6,30}" disabled aria-describedby="registrationBankHelp"><small id="registrationBankHelp">Enter the account number only. Spaces and hyphens are allowed.</small></label></div><label class="registration-trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><p class="registration-help">Already registered or cannot find your name? Please contact HR.</p><p class="registration-message" role="status">Checking availability...</p><p class="registration-error" role="alert" hidden></p><div class="registration-actions"><button type="button" class="secondary-button" data-close>Cancel</button><button type="submit" class="primary-button" disabled>Submit registration</button></div></form>`;
    document.body.append(dialog);
    dialog.showModal();
    const form = dialog.querySelector('form'), submit = form.querySelector('[type="submit"]');
    const error = form.querySelector('.registration-error'), message = form.querySelector('.registration-message');
    const branch = form.elements.locationId;
    let bankSupported = false;
    const bankInput = form.elements.bank, bankHelp = form.querySelector('#registrationBankHelp');
    let busy = false, requestId = crypto.randomUUID(), fingerprint = '';
    dialog.querySelectorAll('[data-close]').forEach(button => button.onclick = () => { if (!busy) dialog.close(); });
    dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
    dialog.addEventListener('close', () => { opened = false; dialog.remove(); trigger.focus(); }, {once:true});
    try {
      const [health, locations] = await Promise.all([apiGet('health'), apiGet('getLocations')]);
      if (!dialog.isConnected) return;
      if (!health.capabilities?.employeeRegistration) throw new Error('Employee registration will be available after the backend update. Please contact HR for now.');
      branch.innerHTML = '<option value="">Select location</option>' + locations.map(location => '<option value="' + escapeHtml(location.id) + '">' + escapeHtml(location.name) + '</option>').join('');
      if (!locations.length) throw new Error('No branches are available. Please contact HR.');
      bankSupported = health.capabilities?.employeeRegistrationBankAccount === true;
      bankInput.disabled = !bankSupported;
      if (!bankSupported) bankHelp.textContent = 'Bank account entry will be available after the backend update. HR can add it later.';
      branch.disabled = false; submit.disabled = false; message.hidden = true;
    } catch (err) { message.hidden = true; error.textContent = err.message; error.hidden = false; }
    form.onsubmit = async event => {
      event.preventDefault();
      if (busy || submit.disabled || !form.reportValidity()) return;
      const details = Object.fromEntries(new FormData(form));
      const nextFingerprint = JSON.stringify(details);
      if (fingerprint && fingerprint !== nextFingerprint) requestId = crypto.randomUUID();
      fingerprint = nextFingerprint;
      busy = true; error.hidden = true; message.textContent = 'Submitting registration...'; message.hidden = false;
      Array.from(form.elements).forEach(input => input.disabled = true);
      try {
        const result = await apiPost({action:'registerEmployee',requestId,...details});
        form.innerHTML = '<div class="eyebrow">REGISTRATION SUBMITTED</div><h2 id="registrationTitle">Waiting for HR approval</h2><p>Your details have been submitted. HR will assign your employee type and branch before you can clock in.</p><p>Employee ID</p><strong class="registration-receipt" data-no-translate>' + escapeHtml(result.empId) + '</strong><div class="registration-actions"><button type="button" class="primary-button" data-done>Done</button></div>';
        busy = false; form.querySelector('[data-done]').onclick = () => dialog.close(); form.querySelector('[data-done]').focus();
      } catch (err) {
        busy = false; Array.from(form.elements).forEach(input => input.disabled = false);
        bankInput.disabled = !bankSupported;
        message.hidden = true; error.textContent = err.message; error.hidden = false;
      }
    };
  }));
})();
