// Filter controls keep draft dates separate until the user applies them.
export function bindPayrollControls({ section, types, months, state, bounds, esc, onChange }) {
  const picker = section.querySelector('#payrollTypes');
  const checks = picker.querySelectorAll('[data-type]');
  function syncTypes() {
    picker.querySelector('#payrollAllTypes').checked = state.types === null;
    checks.forEach(input => { input.checked = state.types === null || state.types.has(input.value); });
    const count = state.types === null ? 'All employee types' : state.types.size + ' types selected';
    picker.querySelector('#payrollTypeSummary').textContent = count;
    const selected = section.querySelector('#payrollSelectedTypes');
    selected.innerHTML = state.types === null ? '' : Array.from(state.types).map(type => '<span class="payroll-chip">' + esc(type) + '</span>').join('');
  }
  picker.querySelector('#payrollAllTypes').onchange = event => {
    state.types = event.target.checked ? null : new Set(); syncTypes(); onChange();
  };
  checks.forEach(input => { input.onchange = () => {
    if (state.types === null) state.types = new Set(types);
    if (input.checked) state.types.add(input.value);
    else state.types.delete(input.value);
    if (types.length && state.types.size === types.length) state.types = null;
    syncTypes(); onChange();
  }; });
  picker.querySelector('#payrollTypesDone').onclick = () => { picker.open = false; picker.querySelector('summary').focus(); };
  picker.addEventListener('keydown', event => { if (event.key === 'Escape') { picker.open = false; picker.querySelector('summary').focus(); } });
  section.addEventListener('click', event => { if (!picker.contains(event.target)) picker.open = false; });
  syncTypes();

  const trigger = section.querySelector('#payrollRangeBtn');
  trigger.onclick = () => {
    const dialog = document.createElement('dialog');
    dialog.className = 'payroll-range-dialog leave-dialog';
    let preset = state.preset, month = state.month;
    dialog.innerHTML = '<form><div class="payroll-dialog-head"><h2>Date range</h2><button type="button" class="btn btn-soft" data-cancel aria-label="Close">×</button></div>' +
      '<div class="payroll-presets">' + [['month','Monthly'],['first','1–15'],['second','16–Month end'],['today','Today'],['yesterday','Yesterday'],['7','7 Days'],['30','30 Days'],['60','60 Days'],['custom','Custom range']].map(([value,label]) => '<button type="button" data-preset="' + value + '" aria-pressed="' + (preset === value) + '">' + label + '</button>').join('') + '</div>' +
      '<div class="payroll-month-nav"><button type="button" data-month-step="1" class="btn btn-soft" aria-label="Previous month">‹</button><label><span>Payroll month</span><select id="rangeMonth">' + months.map(key => '<option value="' + key + '"' + (month === key ? ' selected' : '') + '>' + new Date(key + '-01T00:00:00Z').toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'}) + '</option>').join('') + '</select></label><button type="button" data-month-step="-1" class="btn btn-soft" aria-label="Next month">›</button></div>' +
      '<div class="payroll-range-fields"><label><span>From date</span><input id="rangeFrom" type="date" required min="' + bounds.from + '" max="' + bounds.to + '" value="' + state.from + '"></label><label><span>To date</span><input id="rangeTo" type="date" required min="' + bounds.from + '" max="' + bounds.to + '" value="' + state.to + '"></label></div>' +
      '<p class="leave-help">Available attendance data</p><p class="payroll-range-coverage" data-no-translate>' + bounds.from + ' → ' + bounds.to + '</p><p class="leave-error" role="alert" hidden></p>' +
      '<div class="leave-actions"><button type="button" data-cancel class="btn btn-soft">Cancel</button><button type="submit" class="btn btn-primary">Apply dates</button></div></form>';
    const from = dialog.querySelector('#rangeFrom'), to = dialog.querySelector('#rangeTo');
    const monthSelect = dialog.querySelector('#rangeMonth');
    const shift = (key, days) => { const date = new Date(key + 'T00:00:00Z'); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0,10); };
    function update() {
      const last = new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0).getDate();
      const halfAvailable = value => {
        const start = month + (value === 'second' ? '-16' : '-01');
        const end = month + '-' + (value === 'first' ? '15' : String(last));
        return start <= bounds.to && end >= bounds.from;
      };
      if (['first','second'].includes(preset) && !halfAvailable(preset)) preset = 'month';
      dialog.querySelectorAll('[data-preset]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.preset === preset)));
      dialog.querySelectorAll('[data-preset="first"],[data-preset="second"]').forEach(button => { button.disabled = !halfAvailable(button.dataset.preset); });
      const monthly = ['month','first','second'].includes(preset);
      dialog.querySelector('.payroll-month-nav').hidden = !monthly;
      dialog.querySelectorAll('[data-month-step]').forEach(button => { const index = months.indexOf(month) + Number(button.dataset.monthStep); button.disabled = index < 0 || index >= months.length; });
      if (monthly) {
        from.value = month + (preset === 'second' ? '-16' : '-01');
        to.value = month + '-' + (preset === 'first' ? '15' : String(last));
      } else if (preset !== 'custom') {
        const offset = preset === 'yesterday' ? 1 : 0;
        to.value = shift(bounds.to, -offset);
        from.value = shift(to.value, -(Number(preset) || 1) + 1);
      }
      if (preset !== 'custom') { from.value = from.value < bounds.from ? bounds.from : from.value; to.value = to.value > bounds.to ? bounds.to : to.value; }
      dialog.querySelector('.leave-error').hidden = true;
    }
    dialog.querySelectorAll('[data-preset]').forEach(button => { button.onclick = () => { preset = button.dataset.preset; update(); }; });
    monthSelect.onchange = () => { month = monthSelect.value; update(); };
    dialog.querySelectorAll('[data-month-step]').forEach(button => { button.onclick = () => { month = months[months.indexOf(month) + Number(button.dataset.monthStep)]; monthSelect.value = month; update(); }; });
    [from,to].forEach(input => { input.oninput = () => { preset = 'custom'; update(); }; });
    dialog.querySelectorAll('[data-cancel]').forEach(button => { button.onclick = () => dialog.close(); });
    dialog.addEventListener('close', () => { dialog.remove(); trigger.focus(); }, {once:true});
    dialog.querySelector('form').onsubmit = event => {
      event.preventDefault();
      if (!from.value || !to.value || from.value > to.value || from.value < bounds.from || to.value > bounds.to) {
        const error = dialog.querySelector('.leave-error'); error.textContent = 'Choose a start date before the end date, within available data.'; error.hidden = false; return;
      }
      state.preset = preset; state.month = month; state.from = from.value; state.to = to.value;
      onChange(); dialog.close();
    };
    document.body.append(dialog); update(); dialog.showModal();
  };
}
