const fs = require('fs');

exports.parseFoodWaterJSON = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const jsonData = JSON.parse(data);
      
      const items = jsonData.map(item => ({
        item_name: item.item_name || item['Item Name'],
        category: item.category || item['Category'],
        quantity: parseInt(item.quantity || item['Quantity']),
        expiration_date: item.expiration_date || item['Expiration Date'],
        location: item.location || item['Location']
      }));

      fs.unlinkSync(filePath);
      resolve(items);
    } catch (error) {
      reject(error);
    }
  });
};

exports.formatJSON = (data) => {
  return JSON.stringify(data, null, 2);
};