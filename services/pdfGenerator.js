const PDFDocument = require('pdfkit');

function generatePDF(orders) {
  const doc = new PDFDocument();
  const buffers = [];
  
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {});
  
  // Add report content
  doc.fontSize(20).text('Order Report', { align: 'center' });
  doc.moveDown();
  
  orders.forEach(order => {
    doc.fontSize(12)
      .text(`Order ID: ${order._id}`)
      .text(`Customer: ${order.user.name}`)
      .text(`Total: ₹${order.totalAmount}`)
      .text(`Date: ${order.createdAt.toLocaleDateString()}`)
      .moveDown();
  });
  
  doc.end();
  return Buffer.concat(buffers);
}

module.exports = { generatePDF };