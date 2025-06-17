//parameter (1, 'coldroomTableBody', 'coldroom', 'ColdRoom')

// Global counters for different table types
let chillerCount = 1;
let boilerCount = 1;
let heatPumpCount = 1;
let splitUnitCount = 1;
let fanCoilUnitCount = 1;
let coolingTowerCount = 1;
let treatedFreshAirUnitCount = 1;
let airHandlingUnitCount = 1;
let packagedUnitCount = 1;
let airWasherCount = 1;
let solarHotWaterCount = 1;
let freshAirCount = 1;

function getRemoveFunctionName(ComponentText) {
  // Map display name to actual remove function name
  const map = {
    'Solar Hot Water': 'removeSolarHotWaterColumn',
    'ColdRoom': 'removeColdRoomColumn',
    'Boiler': 'removeBoilerColumn',
    'Chiller': 'removeChillerColumn',
    'Heat Pump': 'removeHeatPumpColumn',
    "Split Unit": 'removeSplitUnitColumn',
    "Unit": 'removePackagedUnitColumn',
    "Fan Coil Unit": 'removeFanCoilUnitColumn',
    "Air Handling Unit": 'removeAirHandlingUnitColumn',
    "Treated Fresh Air Unit": 'removeTreatedFreshAirUnitColumn',
    "Cooling Tower": 'removeCoolingTowerColumn',
    // Add more mappings as needed
  };
  return map[ComponentText] || `remove${ComponentText}Column`;
}

function addTableColumn(colCount, tbodyID, componentTypeID, ComponentText){
  //get all rows and header row
  const tbody = document.getElementById(tbodyID);
  const rows = tbody.rows;
  const headerRow = tbody.previousElementSibling.rows[0];
  
  // Count existing equipment columns (excluding fixed column and action column)
  const existingCols = headerRow.cells.length - 2; // Subtract fixed col and action col
  const newColNumber = existingCols + 1;
  
  // Create new header with remove button
  const newHeader = document.createElement('th');
  newHeader.className = componentTypeID + '-col'; // add class to header
  newHeader.innerHTML = `
      <div class="${componentTypeID}-header">
      <span>${ComponentText} ${newColNumber}</span>
      <button type="button" class="btn btn-sm btn-danger btn-remove-col" onclick="${getRemoveFunctionName(ComponentText)}(${existingCols})" title="Remove ${ComponentText}">-</button>
      </div>
  `;

  // Insert before the action column (last column)
  headerRow.insertBefore(newHeader, headerRow.lastElementChild);

  // Enable remove buttons if this is the second column
  if (newColNumber === 2) {
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
        // regex to match any existing numeric suffix
        const idRegex = new RegExp(`(${componentTypeID})(\\d+)_`, 'g');
      
      for (let input of inputs) {
      input.name = input.name.replace(idRegex, `$1${newColNumber}_`);
      input.value = '';
      input.id = input.id ? input.id.replace(idRegex, `$1${newColNumber}_`) : '';
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
      select.name = select.name.replace(idRegex, `$1${newColNumber}_`);
      select.id = select.id ? select.id.replace(idRegex, `$1${newColNumber}_`) : '';
      select.selectedIndex = 0;
      }
      
      rows[i].insertBefore(newCell, rows[i].lastElementChild);
  }

    // Reinitialize year pickers and VFD fields for the new column
  $(document).trigger('columnAdded');
  $('[name^="'+componentTypeID + newColNumber + '_vfd_status"]').each(function() {
      updateVFDModulationField(this);
  });
  
  // Return the updated column count
  return newColNumber;
  // if(componentTypeID === 'boiler') {
  //   setTimeout(function() {
  //     $('.boiler-insulation-select[data-col="'+colCount+'"]').on('change', function() {
  //       var col = $(this).data('col');
  //       var show = $(this).val() === 'Yes';
  //       $('.boiler-damage-row[data-col="'+col+'"]').toggle(show);
  //     }).trigger('change');
  //   }, 10);
  // }
  // // Attach boiler insulation damage dependency logic for the first column
  // if (colCount === 1) {
  //   document.addEventListener('DOMContentLoaded', function() {
  //     console.log('Attaching boiler insulation damage dependency logic');
  //     $('.boiler-insulation-select[data-col="1"]').on('change', function() {
  //       var show = $(this).val() === 'Yes';
  //       $('.boiler-damage-row[data-col="1"]').toggle(show);
  //     }).trigger('change');
  //   });
  // }
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

  // Generic dependency configuration: map controller IDs to value-based enable/disable rules
  const dependencyConfig = {
    
    'chiller1_vfd_status': {
      'Yes': { enable: ['chiller1_vfd_modulation'], disable: [] },
      'No': { enable: [], disable: ['chiller1_vfd_modulation'] },
    },
    'chiller1_insulation_damage': {
      'Yes': { enable: ['chiller1_insulation_damage_pct'], disable: [] },
      'No': { enable: [], disable: ['chiller1_insulation_damage_pct'] },

    },
    'coolingTower1_vfd': {
      'Yes': { enable: ['coolingTower1_modulatingFrequencyRange'], disable: [] },
      'No': { enable: [], disable: ['coolingTower1_modulatingFrequencyRange'] },
    },
    
    'treatedairunit1_vfd': {
      'Yes': { enable: ['treatedairunit1_modulatingFrequencyRange'], disable: [] },
      'No': { enable: [], disable: ['treatedairunit1_modulatingFrequencyRange'] },
    },
    'treatedairunit1_sensortype': {
      'DP': { enable: ['treatedairunit1_modulatingFrequencyRange'], disable: [] },
      'Temperature': { enable: [], disable: ['treatedairunit1_modulatingFrequencyRange'] },
    },
    'coolingTower1_bmsIntegration': {
    'Yes': { enable: ['coolingTower1_sensortype'], disable: [] },
    'No' : { enable: [], disable: ['coolingTower1_sensortype'] }
    },
    'treatedairunit1_bmsIntegration': {
    'Yes': { enable: ['treatedairunit1_sensortype'], disable: [] },
    'No' : { enable: [], disable: ['treatedairunit1_sensortype'] }
    },
    "airhandlingunit1_vfd": {
      'Yes': { enable: ['airhandlingunit1_modulatingFrequencyRange'], disable: [] },
      'No': { enable: [], disable: ['airhandlingunit1_modulatingFrequencyRange'] },
    },
    "airwasher1_vfd": {
      'Yes': { enable: ['airwasher1_modulatingFrequencyRange'], disable: [] },
      'No': { enable: [], disable: ['airwasher1_modulatingFrequencyRange'] },
    },
    "airwasher1_bmsIntegration": {
    'Yes': { enable: ['airwasher1_sensortype'], disable: [] },
    'No' : { enable: [], disable: ['airwasher1_sensortype'] }
    },
    "heatpump1_vfd": {
    'Yes': { enable: ['heatpump1_modulatingFrequencyRange'], disable: [] },
    'No' : { enable: [], disable: ['heatpump1_modulatingFrequencyRange'] }
    },
    "boiler1_unit": {
    'Fuel': { enable: ['boiler1_fuelConsumption','boiler1_vfd'], disable: ['boiler1_electricityConsumption'] },
    'Electricity' : { enable: ['boiler1_electricityConsumption'], disable: ['boiler1_fuelConsumption','boiler1_vfd'] }
    },
    "solarhotwater1_insulation_damage": {
    'Yes': { enable: ['solarhotwater1_insulation_damage_pct'], disable: [] },
    'No' : { enable: [], disable: ['solarhotwater1_insulation_damage_pct'] }
    },
    "freshair1_vfd": {
    'Yes': { enable: ['freshair1_modulatingFrequencyRange'], disable: [] },
    'No' : { enable: [], disable: ['freshair1_modulatingFrequencyRange'] }
    },

    // 'controllerID': {
    //   'value1': { enable: ['targetId1','targetId2'], disable: ['targetId3'] },
    //   'value2': { enable: ['targetId3'], disable: ['targetId1'] },
    // },
  };

  // Initialize dependency listeners based on dependencyConfig
function initDependencies() {
  Object.keys(dependencyConfig).forEach(ctrlId => {
    const controllers = document.querySelectorAll(`#${ctrlId}, [name=\"${ctrlId}\"]`);
    controllers.forEach(el => {
      const eventType = (el.tagName.toLowerCase() === 'select' || el.type === 'checkbox') ? 'change' : 'input';
      console.log(`initDependencies: binding to ${ctrlId}`);
      el.addEventListener(eventType, () => {
        const val = el.type === 'checkbox' ? String(el.checked) : el.value;
        console.log(`initDependencies: ${ctrlId} changed to ${val}`);
        const rules = dependencyConfig[ctrlId] && dependencyConfig[ctrlId][val];
        if (!rules) return;
        (rules.enable || []).forEach(key => {
          const target = document.querySelector(`#${key}, [name=\"${key}\"]`);
          if (target) {
            target.disabled = false;
            console.log(`Enabled ${key}`);
          }
        });
        (rules.disable || []).forEach(key => {
          const target = document.querySelector(`#${key}, [name=\"${key}\"]`);
          if (target) {
            target.disabled = true;
            console.log(`Disabled ${key}`);
          }
        });
      });
      // Trigger initial state
      el.dispatchEvent(new Event(eventType));
    });
  });
}

  // -----  UNIVERSAL DEPENDENCY HANDLER  -----
(function () {
  // Pre-compute a regex + metadata for every key in dependencyConfig
  const descriptors = Object.keys(dependencyConfig).map(k => {
    const m = k.match(/^(.+?)(\d+)(_.*)$/);          // <prefix>1<suffix>
    if (!m) return null;
    const [, prefix, origNum, suffix] = m;
    return {
      ctrlKey: k,
      prefix, origNum, suffix,
      re: new RegExp(`^${prefix}(\\d+)${suffix}$`)   // e.g.  ^chiller(\d+)_vfd_status$
    };
  }).filter(Boolean);

  function applyRules(el) {
    const name = el.name || el.id || '';
    for (const d of descriptors) {
      const match = name.match(d.re);
      if (!match) continue;            // not one of our controllers
      const col = match[1];            // actual column number clicked
      const val = el.type === 'checkbox' ? String(el.checked) : el.value;
      const cfg = dependencyConfig[d.ctrlKey][val];
      if (!cfg) return;

      // Enable / disable targets, rewriting column 1 -> current column
      const toggle = (arr, disable) => arr.forEach(targetKey => {
        const actual = targetKey.replace(d.prefix + d.origNum, d.prefix + col);
        const t = document.querySelector(`[name="${actual}"], #${actual}`);
        if (t) t.disabled = disable;
      });
      toggle(cfg.enable || [], false);
      toggle(cfg.disable || [], true);
      return;
    }
  }

  // Delegated listeners (new elements automatically covered)
  document.addEventListener('change', e => applyRules(e.target), true);
  document.addEventListener('input',  e => applyRules(e.target), true);

  // Run once on page load so every field starts in the right state
  window.addEventListener('DOMContentLoaded', () => {
    descriptors.forEach(d => {
      const selector = `[name^="${d.prefix}"][name$="${d.suffix}"], [id^="${d.prefix}"][id$="${d.suffix}"]`;
      document.querySelectorAll(selector).forEach(applyRules);
    });
  });
})();

// Specific remove functions for different equipment types
function removeChillerColumn(index) {
  chillerCount = removeColumn(chillerCount, index, 'chillerTableBody', 'chiller', 'Chiller');
}

function removeBoilerColumn(index) {
  boilerCount = removeColumn(boilerCount, index, 'boilerTableBody', 'boiler', 'Boiler');
}

function removeHeatPumpColumn(index) {
  heatPumpCount = removeColumn(heatPumpCount, index, 'heatPumpTableBody', 'heatpump', 'Heat Pump');
}

function removeSplitUnitColumn(index) {
  splitUnitCount = removeColumn(splitUnitCount, index, 'splitUnitTableBody', 'splitunit', 'Split Unit');
}

function removeFanCoilUnitColumn(index) {
  fanCoilUnitCount = removeColumn(fanCoilUnitCount, index, 'fanCoilUnitTableBody', 'fancoilunit', 'Fan Coil Unit');
}

function addCoolingTowerColumn() {
  coolingTowerCount = addTableColumn(coolingTowerCount, 'coolingTowerTableBody', 'coolingTower', 'Cooling Tower');
}

function removeCoolingTowerColumn(index) {
  coolingTowerCount = removeColumn(coolingTowerCount, index, 'coolingTowerTableBody', 'coolingTower', 'Cooling Tower');
}

// Add column functions for all dynamic tables
function addChillerColumn() {
  chillerCount = addTableColumn(chillerCount, 'chillerTableBody', 'chiller', 'Chiller');
}

function addBoilerColumn() {
  boilerCount = addTableColumn(boilerCount, 'boilerTableBody', 'boiler', 'Boiler');
}

function addHeatPumpColumn() {
  heatPumpCount = addTableColumn(heatPumpCount, 'heatPumpTableBody', 'heatpump', 'Heat Pump');
}

function addSplitUnitColumn() {
  splitUnitCount = addTableColumn(splitUnitCount, 'splitUnitTableBody', 'splitunit', 'Split Unit');
}

function addFanCoilUnitColumn() {
  fanCoilUnitCount = addTableColumn(fanCoilUnitCount, 'fanCoilUnitTableBody', 'fancoilunit', 'Fan Coil Unit');
}

function addTreatedFreshAirUnitColumn() {
  treatedFreshAirUnitCount = addTableColumn(treatedFreshAirUnitCount, 'treatedairunitTableBody', 'treatedairunit', 'Treated Fresh Air Unit');
}

function addAirHandlingUnitColumn() {
  airHandlingUnitCount = addTableColumn(airHandlingUnitCount, 'airHandlingUnitTableBody', 'airhandlingunit', 'Air Handling Unit');
}

function addPackagedUnitColumn() {
  packagedUnitCount = addTableColumn(packagedUnitCount, 'packagedUnitTableBody', 'packagedunit', 'Unit');
}

function addAirWasherColumn() {
  airWasherCount = addTableColumn(airWasherCount, 'airWasherTableBody', 'airwasher', 'AirWasher');
}

function addSolarHotWaterColumn() {
  solarHotWaterCount = addTableColumn(solarHotWaterCount, 'solarHotWaterTableBody', 'solarhotwater', 'Solar Hot Water');
}

function addFreshAirColumn() {
  freshAirCount = addTableColumn(freshAirCount, 'freshAirTableBody', 'freshair', 'FreshAir');
}

// Remove column functions for all dynamic tables
function removeTreatedFreshAirUnitColumn(index) {
  treatedFreshAirUnitCount = removeColumn(treatedFreshAirUnitCount, index, 'treatedairunitTableBody', 'treatedairunit', 'Treated Fresh Air Unit');
}

function removeAirHandlingUnitColumn(index) {
  airHandlingUnitCount = removeColumn(airHandlingUnitCount, index, 'airHandlingUnitTableBody', 'airhandlingunit', 'Air Handling Unit');
}

function removePackagedUnitColumn(index) {
  packagedUnitCount = removeColumn(packagedUnitCount, index, 'packagedUnitTableBody', 'packagedunit', 'Unit');
}

function removeAirWasherColumn(index) {
  airWasherCount = removeColumn(airWasherCount, index, 'airWasherTableBody', 'airwasher', 'AirWasher');
}

function removeSolarHotWaterColumn(index) {
  solarHotWaterCount = removeColumn(solarHotWaterCount, index, 'solarHotWaterTableBody', 'solarhotwater', 'Solar Hot Water');
}

function removeFreshAirColumn(index) {
  freshAirCount = removeColumn(freshAirCount, index, 'freshAirTableBody', 'freshair', 'FreshAir');
}
