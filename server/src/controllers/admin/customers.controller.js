const prisma = require('../../config/prismaClient');
const asyncHandler = require('../../middleware/asyncHandler');
const { ApiError } = require('../../middleware/errorHandler');

const listCustomers = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 100);
  const where = {
    role: 'CUSTOMER',
    deletedAt: null,
    ...(q ? {
      OR: [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
      ],
    } : {}),
  };

  const customers = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 250,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      addresses: { select: { id: true } },
      orders: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, totalMinor: true, createdAt: true },
      },
    },
  });

  res.json({
    success: true,
    data: customers.map(({ addresses, orders, ...customer }) => ({
      ...customer,
      addressCount: addresses.length,
      orderCount: orders.length,
      totalSpentMinor: orders.reduce((sum, order) => sum + order.totalMinor, 0),
      lastOrderAt: orders[0]?.createdAt || null,
    })),
  });
});

const getCustomer = asyncHandler(async (req, res) => {
  const customer = await prisma.user.findFirst({
    where: { id: req.params.id, role: 'CUSTOMER', deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      addresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] },
      orders: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalMinor: true,
          currency: true,
          createdAt: true,
          items: { select: { id: true, titleSnapshot: true, quantity: true, priceMinor: true } },
        },
      },
      returns: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, orderId: true, reason: true, status: true, refundStatus: true, createdAt: true },
      },
      wishlist: {
        select: {
          items: {
            orderBy: { createdAt: 'desc' },
            select: { id: true, createdAt: true, product: { select: { id: true, title: true, slug: true } } },
          },
        },
      },
    },
  });

  if (!customer) throw new ApiError(404, 'Customer not found.');
  const { wishlist, ...details } = customer;
  res.json({ success: true, data: { ...details, wishlistItems: wishlist?.items || [] } });
});

module.exports = { listCustomers, getCustomer };
