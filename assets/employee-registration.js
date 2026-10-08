(() => {
  const triggers = document.querySelectorAll('[data-employee-register]');
  let opened = false;
  triggers.forEach(trigger => trigger.addEventListener('click', async () => {
    if (opened) return;
    opened = true;
    const dialog = document.createElement('dialog');
    dialog.className = 'employee-registration-dialog';
    dialog.setAttribute('aria-labelledby', 'registrationTitle');
    dialog.innerHTML = `<form><div class="registration-heading"><div><div class="eyebrow">EMPLOYEE REGISTRATION</div><h2 id="registrationTitle">Register as an employee</h2></div><button type="button" class="secondary-button" data-close aria-label="Close">×</button></div><p>Register and start clocking in at your selected branch immediately. Only management accounts need approval.</p><div class="registration-fields"><label><span>Full name</span><input name="fullname" autocomplete="name" required maxlength="200"></label><label><span>Nickname</span><input name="nick" autocomplete="nickname" required maxlength="80"></label><label><span>Phone</span><input name="phone" type="tel" autocomplete="tel" required maxlength="30" placeholder="08x xxx xxxx"></label><label><span>Branch</span><select name="locationId" required disabled><option value="">Loading...</option></select></label><label class="registration-bank"><span><span>Bank account number</span> <span>(optional)</span></span><input name="bank" type="text" inputmode="numeric" autocomplete="off" maxlength="30" pattern="[0-9\\s\\-]{6,30}" disabled aria-describedby="registrationBankHelp"><small id="registrationBankHelp">Enter the account number only. Spaces and hyphens are allowed.</small></label><label class="registration-photo"><span><span>Profile photo</span> <span>(optional)</span></span><input name="photo" type="file" accept="image/jpeg,image/png,image/webp" disabled aria-describedby="registrationPhotoHelp"><small id="registrationPhotoHelp">Choose a clear photo of your face. It will be resized before upload.</small><img class="registration-photo-preview" alt="Profile photo preview" hidden></label></div><label class="registration-trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><p class="registration-help">Already registered or cannot find your name? Please contact HR.</p><p class="registration-message" role="status">Checking availability...</p><p class="registration-error" role="alert" hidden></p><div class="registration-actions"><button type="button" class="secondary-button" data-close>Cancel</button><button type="submit" class="primary-button" disabled>Submit registration</button></div></form>`;
    document.body.append(dialog);
    dialog.showModal();
    const form = dialog.querySelector('form'), submit = form.querySelector('[type="submit"]');
    const error = form.querySelector('.registration-error'), message = form.querySelector('.registration-message');
    const branch = form.elements.locationId;
    let bankSupported = false, photoSupported = false, photoData = '', preparingPhoto = false;
    const bankInput = form.elements.bank, bankHelp = form.querySelector('#registrationBankHelp');
    const photoInput = form.elements.photo, preview = form.querySelector('.registration-photo-preview');
    let busy = false, requestId = crypto.randomUUID(), fingerprint = '';
    dialog.querySelectorAll('[data-close]').forEach(button => button.onclick = () => { if (!busy) dialog.close(); });
    dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
    dialog.addEventListener('close', () => { opened = false; dialog.remove(); trigger.focus(); }, {once:true});
    try {
      const [health, locations] = await Promise.all([apiGet('health'), apiGet('getLocations')]);
      if (!dialog.isConnected) return;
      if (!health.capabilities?.employeeRegistration) throw new Error('Employee registration will be available after the backend update. Please contact HR for now.');
      if (!health.capabilities?.employeeRegistrationImmediate) throw new Error('Please update the backend to enable immediate employee registration.');
      branch.innerHTML = '<option value="">Select location</option>' + locations.map(location => '<option value="' + escapeHtml(location.id) + '">' + escapeHtml(location.name) + '</option>').join('');
      if (!locations.length) throw new Error('No branches are available. Please contact HR.');
      bankSupported = health.capabilities?.employeeRegistrationBankAccount === true;
      bankInput.disabled = !bankSupported;
      if (!bankSupported) bankHelp.textContent = 'Bank account entry will be available after the backend update. HR can add it later.';
      photoSupported = health.capabilities?.employeeRegistrationPhoto === true;
      photoInput.disabled = !photoSupported;
      if (!photoSupported) form.querySelector('#registrationPhotoHelp').textContent = 'Photo upload will be available after the backend update.';
      branch.disabled = false; submit.disabled = false; message.hidden = true;
    } catch (err) { message.hidden = true; error.textContent = err.message; error.hidden = false; }
    photoInput.onchange = async () => {
      photoInput.disabled = true;
      preparingPhoto = true; submit.disabled = true; photoData = ''; preview.hidden = true; preview.removeAttribute('src'); error.hidden = true;
      try {
        const file = photoInput.files[0];
        if (file) {
          if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('Choose a JPG, PNG or WebP photo under 10 MB.');
          const url = URL.createObjectURL(file);
          try {
            const image = new Image(); image.src = url; await image.decode();
            const scale = Math.min(1, 640 / image.naturalWidth, 640 / image.naturalHeight);
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
            const context = canvas.getContext('2d'); context.fillStyle = '#fff'; context.fillRect(0,0,canvas.width,canvas.height); context.drawImage(image,0,0,canvas.width,canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', .8);
            photoData = dataUrl.split(',')[1]; preview.src = dataUrl; preview.hidden = false;
          } finally { URL.revokeObjectURL(url); }
        }
      } catch (err) { photoInput.value = ''; error.textContent = err.message; error.hidden = false; }
      finally { preparingPhoto = false; if (dialog.isConnected) { submit.disabled = busy; photoInput.disabled = !photoSupported; } }
    };
    form.onsubmit = async event => {
      event.preventDefault();
      if (busy || preparingPhoto || submit.disabled || !form.reportValidity()) return;
      const details = Object.fromEntries(new FormData(form));
      delete details.photo;
      if (photoData) details.imageBase64 = photoData;
      const nextFingerprint = JSON.stringify(details);
      if (fingerprint && fingerprint !== nextFingerprint) requestId = crypto.randomUUID();
      fingerprint = nextFingerprint;
      busy = true; error.hidden = true; message.textContent = 'Submitting registration...'; message.hidden = false;
      Array.from(form.elements).forEach(input => input.disabled = true);
      try {
        const result = await apiPost({action:'registerEmployee',requestId,...details});
        const active = String(result.status).toLowerCase() === 'active';
        form.innerHTML = '<div class="eyebrow">REGISTRATION COMPLETE</div><h2 id="registrationTitle">' + (active ? 'You can clock in now' : 'Please contact HR') + '</h2><p>' + (active ? 'Your employee record is active. Select your branch and name on the attendance page to clock in.' : 'Your existing employee record is not active. Please contact HR to check its status.') + '</p>' + (result.photoSaved ? '<p>Your profile photo has been saved and will sync to the Employees sheet.</p>' : '') + '<p>Employee ID</p><strong class="registration-receipt" data-no-translate>' + escapeHtml(result.empId) + '</strong><div class="registration-actions"><button type="button" class="primary-button" data-done>Done</button></div>';
        if (active) document.dispatchEvent(new CustomEvent('employee-registered', {detail:{empId:result.empId,locationId:details.locationId}}));
        busy = false; form.querySelector('[data-done]').onclick = () => dialog.close(); form.querySelector('[data-done]').focus();
      } catch (err) {
        busy = false; Array.from(form.elements).forEach(input => input.disabled = false);
        bankInput.disabled = !bankSupported;
        photoInput.disabled = !photoSupported;
        message.hidden = true; error.textContent = err.message; error.hidden = false;
      }
    };
  }));
})();
