await telegramNotify({
  event: 'new_order',
  data: {
    order_number: order.order_number,
    customer_name: user.full_name,
    customer_email: user.email,
    customer_phone: user.phone ? `📱 Telefon: ${user.phone}` : '',
    final_amount: order.final_total,
    discount: order.discount_total ? `🎁 İndirim: ${order.discount_total} TL` : '',
    order_items: itemsText, // satır satır string
    created_at: new Date().toISOString(),
  },
});



await telegramNotify({
  event: 'new_ticket',
  data: {
    user_name: user.full_name ?? user.email,
    subject: ticket.subject,
    priority: ticket.priority,
    category: ticket.category ? `📌 Kategori: ${ticket.category}` : '',
    message: ticket.message,
    created_at: new Date().toISOString(),
  },
});


await createUserNotification({
  userId: adminId,
  title: `Yeni sipariş: #${order.order_number}`,
  message: `Müşteri: ${customerName} - Tutar: ${finalAmount} TL`,
  type: 'order',
});

await telegramNotify({
  event: 'new_order',
  data: {
    order_number: order.order_number,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone ? `📱 Telefon: ${customerPhone}` : '',
    final_amount: finalAmount,
    discount: discount ? `🎁 İndirim: ${discount} TL` : '',
    order_items: orderItemsText,
    created_at: new Date().toISOString(),
  },
});
  
