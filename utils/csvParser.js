const fs = require('fs');
const csv = require('csv-parser');

exports.parseCSVToJSON = (filePath) => {
  return new Promise((resolve, reject) => {
    const items = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        items.push(row);
      })
      .on('end', () => {
        resolve(items);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

exports.parseFoodWaterCSVForImport = (filePath) => {
  return new Promise((resolve, reject) => {
    const items = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {

        // ✅ FIXED: ensure date fields are properly captured even with spaces or capitalization
        const manufactured =
          row['Manufactured Date'] ||
          row['manufactured_date'] ||
          row['ManufacturedDate'] ||
          row.manufactured_date ||
          row['manufactureddate'] ||
          null;

        const expiration =
          row['Expiration Date'] ||
          row['expiration_date'] ||
          row['ExpirationDate'] ||
          row.expiration_date ||
          row['expiry_date'] ||
          row['Expiry Date'] ||
          null;

        items.push({
          item_name: row['Item Name'] || row.item_name || row['item_name'] || row['ItemName'],
          category: row['Category'] || row.category,
          quantity: parseInt(row['Quantity'] || row.quantity || 0),
          manufactured_date: manufactured ? String(manufactured).trim() : null,
          expiration_date: expiration ? String(expiration).trim() : null,
          location: row['Location'] || row.location || row['location'] || '',
          person_in_charge: row['Person In Charge'] || row['person_in_charge'] || row['PersonInCharge'] || row.person_in_charge || null
        });
      })
      .on('end', () => {
        fs.unlinkSync(filePath);
        resolve(items);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

exports.parseFoodWaterCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const items = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {

        // ✅ FIXED: same logic for exported CSV reading
        const manufactured =
          row['Manufactured Date'] ||
          row['manufactured_date'] ||
          row['ManufacturedDate'] ||
          row.manufactured_date ||
          row['manufactureddate'] ||
          null;

        const expiration =
          row['Expiration Date'] ||
          row['expiration_date'] ||
          row['ExpirationDate'] ||
          row.expiration_date ||
          row['expiry_date'] ||
          row['Expiry Date'] ||
          null;

        items.push({
          item_name: row['Item Name'] || row.item_name || row['item_name'],
          category: row['Category'] || row.category,
          quantity: parseInt(row['Quantity'] || row.quantity),
          manufactured_date: manufactured ? String(manufactured).trim() : null,
          expiration_date: expiration ? String(expiration).trim() : null,
          location: row['Location'] || row.location
        });
      })
      .on('end', () => {
        fs.unlinkSync(filePath);
        resolve(items);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

exports.parseHygieneSanitationCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const items = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        items.push({
          item_name: row['Item Name'] || row.item_name || row['item_name'],
          category: row['Category'] || row.category,
          quantity: parseInt(row['Quantity'] || row.quantity || 0),
          unit_type: row['Unit Type'] || row.unit_type || null,
          manufactured_date: row['Manufactured Date'] || row.manufactured_date || null,
          expiration_date: row['Expiration Date'] || row.expiration_date || null,
          location: row['Location'] || row.location || '',
          person_in_charge: row['Person In Charge'] || row.person_in_charge || null
        });
      })
      .on('end', () => {
        fs.unlinkSync(filePath);
        resolve(items);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

exports.parseMedicineCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const items = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        items.push({
          item_name: row['Item Name'] || row.item_name || row['item_name'],
          category: row['Category'] || row.category,
          quantity: parseInt(row['Quantity'] || row.quantity || 0),
          dosage: row['Dosage'] || row.dosage || null,
          manufactured_date: row['Manufactured Date'] || row.manufactured_date || null,
          expiration_date: row['Expiration Date'] || row.expiration_date || null,
          location: row['Location'] || row.location || '',
          person_in_charge: row['Person In Charge'] || row.person_in_charge || null
        });
      })
      .on('end', () => {
        fs.unlinkSync(filePath);
        resolve(items);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};
