// services/csvGenerator.js
const { Parser } = require('json2csv');

function generateCSV(orders) {
  try {
    // Prepare the data for CSV
    const formattedData = orders.map(order => ({
      orderId: order._id.toString(),
      customerName: order.user?.name || 'Guest',
      customerEmail: order.user?.email || '',
      totalAmount: order.totalAmount,
      orderDate: order.createdAt.toISOString().split('T')[0],
      status: order.status,
      paymentMethod: order.paymentMethod,
      itemCount: order.items.length
    }));

    // Define CSV fields
    const fields = [
      { label: 'Order ID', value: 'orderId' },
      { label: 'Customer Name', value: 'customerName' },
      { label: 'Customer Email', value: 'customerEmail' },
      { label: 'Total Amount (₹)', value: 'totalAmount' },
      { label: 'Order Date', value: 'orderDate' },
      { label: 'Status', value: 'status' },
      { label: 'Payment Method', value: 'paymentMethod' },
      { label: 'Items Count', value: 'itemCount' }
    ];

    // CSV parser options
    const opts = { fields };
    const parser = new Parser(opts);
    
    // Generate CSV
    return parser.parse(formattedData);

  } catch (error) {
    console.error('CSV generation error:', error);
    throw new Error('Failed to generate CSV report');
  }
}

module.exports = { generateCSV };