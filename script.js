//parameter (1, 'coldroomTableBody', 'coldroom', 'ColdRoom')
function addTableColumn(colCount, tbodyID, componentTypeID, ComponentText){
  //increase the colcount
  colCount++;

  //get all rows and header row
  const tbody = document.getElementById(tbodyID);
  const rows = tbody.rows;
  const headerRow = tbody.previousElementSibling.rows[0];
  
  // Create new header with remove button
  const newHeader = document.createElement('th');
  newHeader.className = componentTypeID+'-col'; // add class to header
  newHeader.innerHTML = `
      <div class=${componentTypeID}"-header">
      <span>${ComponentText} ${colCount}</span>
      <button type="button" class="btn btn-sm btn-danger btn-remove-col" onclick="remove${ComponentText}Column(${colCount - 1})" title="Remove ${ComponentText}">-</button>
      </div>
  `;

  // Insert before the action column (last column)
  headerRow.insertBefore(newHeader, headerRow.lastElementChild);

  // Enable remove buttons if this is the second column
  if (colCount === 2) {
      const removeButtons = headerRow.querySelectorAll('.btn-remove-col');
      removeButtons.forEach(btn => btn.disabled = false);
  }

  // Add cells to each row
  for (let i = 0; i < rows.length; i++) {
      const firstCell = rows[i].cells[1];
      const newCell = firstCell.cloneNode(true);
      
      // Update input names
      const inputs = newCell.getElementsByTagName('input');
      const selects = newCell.getElementsByTagName('select');
      
      for (let input of inputs) {
      input.name = input.name.replace(`${componentTypeID}1_`, `${componentTypeID}${colCount}_`);
      input.value = '';
      input.id = input.id ? input.id.replace(`${componentTypeID}1_`, `${componentTypeID}${colCount}_`) : '';
      if (input.type === 'checkbox') {
          input.checked = false;
      }
      // Remove any existing datepicker classes and data
      if ($(input).hasClass('hasDatepicker')) {
          $(input).removeClass('hasDatepicker');
          $(input).removeAttr('id');
          $(input).datepicker('destroy');
      }
      }
      
      for (let select of selects) {
      select.name = select.name.replace(`${componentTypeID}1_`, `${componentTypeID}${colCount}_`);
      select.id = select.id ? select.id.replace(`${componentTypeID}1_`, `${componentTypeID}${colCount}_`) : '';
      select.selectedIndex = 0;
      }
      
      rows[i].insertBefore(newCell, rows[i].lastElementChild);
  }

  
  // Reinitialize year pickers and VFD fields for the new column
  $(document).trigger('columnAdded');
  $('[name^="'+componentTypeID + colCount + '_vfd_status"]').each(function() {
      updateVFDModulationField(this);
  });
  return colCount;

}


//remove col function
function removeColumn(colCount,clickedIndex,tbodyID, componentTypeID, ComponentText) {
      if (colCount <= 1) return;
      
      const tbody = document.getElementById(tbodyID);
      const headerRow = tbody.previousElementSibling.rows[0];
      
      // The clicked column is at clickedIndex + 1 (accounting for the fixed column)
      const colToRemove = clickedIndex + 1;
      
      if (colToRemove >= 1 && colToRemove < headerRow.cells.length - 1) {
        // Remove header
        headerRow.removeChild(headerRow.cells[colToRemove]);
        
        // Remove cells from each row
        const rows = tbody.rows;
        for (let i = 0; i < rows.length; i++) {
          if (rows[i].cells.length > colToRemove) {
            rows[i].deleteCell(colToRemove);
          }
        }
        
        // Update chiller numbers in headers and adjust event handlers
        for (let i = 1; i < headerRow.cells.length - 1; i++) {
          const header = headerRow.cells[i];
          header.querySelector('span').textContent = `${ComponentText} ${i}`;
          // Update the onclick handler with the correct index
          const removeBtn = header.querySelector('.btn-remove-col');
          if (removeBtn) {
            removeBtn.onclick = (function(index) {
              return function() { removeColumn(colCount,index - 1,tbodyID,componentTypeID,ComponentText); };
            })(i);
          }
        }
        
        colCount--;
        
        // Disable remove buttons if only one column left
        if (colCount === 1) {
          const removeButtons = headerRow.querySelectorAll('.btn-remove-col');
          removeButtons.forEach(btn => btn.disabled = true);
        }
      }
      return colCount;
    }

// Number formatting utility: formats with commas (e.g., 10000 => 10,000)
function formatNumberWithCommas(value) {
  if (value === '' || isNaN(Number(value))) return value;
  const parts = value.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

// Remove all commas from a string
function unformatNumber(value) {
  return value.replace(/,/g, '');
}

// Attach event listeners to all .number-format inputs
function initNumberFormatting() {
  function handleInput(e) {
    const input = e.target;
    let raw = unformatNumber(input.value);
    if (raw === '' || isNaN(Number(raw))) {
      input.value = '';
      return;
    }
    input.value = formatNumberWithCommas(raw);
  }

  function handleBlur(e) {
    const input = e.target;
    let raw = unformatNumber(input.value);
    if (raw === '' || isNaN(Number(raw))) {
      input.value = '';
      return;
    }
    input.value = formatNumberWithCommas(raw);
  }

  function handleFocus(e) {
    // On focus, show unformatted value for editing
    const input = e.target;
    let raw = unformatNumber(input.value);
    input.value = raw;
    // Optionally select all text
    setTimeout(() => input.select(), 0);
  }

  // For form submission: ensure value is unformatted (no commas)
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function() {
      form.querySelectorAll('.number-format').forEach(input => {
        input.value = unformatNumber(input.value);
      });
    });
  });

  // Attach to all current and future .number-format inputs
  function attachToInputs() {
    document.querySelectorAll('.number-format').forEach(input => {
      if (!input._hasNumberFormat) {
        input.addEventListener('input', handleInput);
        input.addEventListener('blur', handleBlur);
        input.addEventListener('focus', handleFocus);
        // Format initial value
        if (input.value) input.value = formatNumberWithCommas(unformatNumber(input.value));
        input._hasNumberFormat = true;
      }
    });
  }

  attachToInputs();

  // For dynamically added fields: observe DOM changes
  const observer = new MutationObserver(attachToInputs);
  observer.observe(document.body, { childList: true, subtree: true });
}