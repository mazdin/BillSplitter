/**
 * Calculation utility for Bill Splitter
 */

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export const calculateBill = (session, members, items, assignments) => {
  // 1. Map items to their assigned members
  const memberTotals = {};
  members.forEach(m => memberTotals[m.id] = 0);

  let subtotal = 0;

  items.forEach(item => {
    subtotal += item.price;
    const itemAssignees = assignments.filter(a => a.item_id === item.id);
    
    if (itemAssignees.length > 0) {
      const share = item.price / itemAssignees.length;
      itemAssignees.forEach(a => {
        if (memberTotals[a.member_id] !== undefined) {
          memberTotals[a.member_id] += share;
        }
      });
    }
  });

  // 2. Calculate global charges
  let taxAmount = 0;
  if (session.tax_type === 'percentage') {
    taxAmount = subtotal * (session.tax_value / 100);
  } else {
    taxAmount = session.tax_value || 0;
  }

  const serviceAmount = session.service_charge || 0;
  const totalChargeable = subtotal + taxAmount + serviceAmount;

  // 3. Apply charges proportionally to each member
  const finalMemberTotals = [];
  let totalAfterRounding = 0;

  members.forEach(member => {
    const rawTotal = memberTotals[member.id];
    // Proportion of subtotal
    const proportion = subtotal > 0 ? rawTotal / subtotal : 0;
    
    const shareOfCharges = (taxAmount + serviceAmount) * proportion;
    let finalAmount = rawTotal + shareOfCharges;

    // Apply Rounding
    if (session.rounding_type !== 'none' && session.rounding_value > 0) {
      const r = session.rounding_value;
      if (session.rounding_type === 'ceil') {
        finalAmount = Math.ceil(finalAmount / r) * r;
      } else if (session.rounding_type === 'floor') {
        finalAmount = Math.floor(finalAmount / r) * r;
      } else if (session.rounding_type === 'nearest') {
        finalAmount = Math.round(finalAmount / r) * r;
      }
    }

    finalMemberTotals.push({
      ...member,
      subtotal: rawTotal,
      finalAmount: Math.round(finalAmount)
    });

    totalAfterRounding += Math.round(finalAmount);
  });

  return {
    subtotal,
    taxAmount,
    serviceAmount,
    totalBeforeRounding: totalChargeable,
    totalAfterRounding,
    memberBreakdown: finalMemberTotals
  };
};
