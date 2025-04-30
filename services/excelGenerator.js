const ExcelJS = require('exceljs');

async function generateExcel(orders) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Orders');
  
  worksheet.columns = [
    { header: 'Order ID', key: 'id', width: 25 },
    { header: 'Customer', key: 'customer', width: 20 },
    { header: 'Total (₹)', key: 'total', width: 15 },
    { header: 'Date', key: 'date', width: 15 }
  ];
  
  orders.forEach(order => {
    worksheet.addRow({
      id: order._id,
      customer: order.user.name,
      total: order.totalAmount,
      date: order.createdAt.toISOString().split('T')[0]
    });
  });
  
  return await workbook.xlsx.writeBuffer();
}

module.exports = { generateExcel };