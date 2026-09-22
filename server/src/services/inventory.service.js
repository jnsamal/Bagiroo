const { ApiError } = require('../middleware/errorHandler');

// All three operations run inside the caller's transaction (a `tx` Prisma
// client passed in), so a failed reservation rolls back the whole order
// creation instead of leaving partial state.

function inventoryWhere(productId, variationId) {
  return variationId ? { variationId } : { productId };
}

// Called at order creation: checks real availability and marks the stock
// as reserved (not yet decremented) so two simultaneous checkouts can't
// both succeed against the same last unit.
async function reserveStock(tx, productId, variationId, quantity) {
  const inventory = await tx.inventory.findFirst({ where: inventoryWhere(productId, variationId) });

  if (!inventory) {
    throw new ApiError(409, 'This item is not available for purchase right now.');
  }

  const available = inventory.quantityAvailable - inventory.quantityReserved;
  if (available < quantity) {
    throw new ApiError(409, `Only ${Math.max(available, 0)} left in stock.`);
  }

  await tx.inventory.update({
    where: { id: inventory.id },
    data: { quantityReserved: { increment: quantity } },
  });
}

// Called on confirmed payment: converts a reservation into a real
// decrement of on-hand stock.
async function finalizeReservation(tx, productId, variationId, quantity) {
  await tx.inventory.updateMany({
    where: inventoryWhere(productId, variationId),
    data: {
      quantityAvailable: { decrement: quantity },
      quantityReserved: { decrement: quantity },
    },
  });
}

// Called on payment failure/cancellation: gives the reserved stock back
// without ever having decremented quantityAvailable.
async function releaseReservation(tx, productId, variationId, quantity) {
  await tx.inventory.updateMany({
    where: inventoryWhere(productId, variationId),
    data: { quantityReserved: { decrement: quantity } },
  });
}

module.exports = { reserveStock, finalizeReservation, releaseReservation };
