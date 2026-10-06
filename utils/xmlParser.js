const xml2js = require('xml2js');
const fs = require('fs');

exports.parseFoodWaterXML = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return reject(err);
      }

      xml2js.parseString(data, (err, result) => {
        if (err) {
          return reject(err);
        }

        try {
          const items = result.inventory.item.map(item => ({
            item_name: item.item_name[0],
            category: item.category[0],
            quantity: parseInt(item.quantity[0]),
            expiration_date: item.expiration_date[0],
            location: item.location[0]
          }));

          fs.unlinkSync(filePath);
          resolve(items);
        } catch (error) {
          reject(error);
        }
      });
    });
  });
};

exports.generateFoodWaterXML = (items) => {
  const builder = new xml2js.Builder({
    rootName: 'inventory',
    xmldec: { version: '1.0', encoding: 'UTF-8' }
  });

  const xmlData = {
    item: items.map(item => ({
      batch_no: item.batch_no,
      item_name: item.item_name,
      category: item.category,
      quantity: item.quantity,
      expiration_date: item.expiration_date,
      location: item.location,
      days_until_expiry: item.days_until_expiry
    }))
  };

  return builder.buildObject(xmlData);
};

exports.toXML = (rootName, itemName, items) => {
  const builder = new xml2js.Builder({
    rootName: rootName,
    xmldec: { version: '1.0', encoding: 'UTF-8' }
  });

  const xmlData = {
    [itemName]: items
  };

  return builder.buildObject(xmlData);
};