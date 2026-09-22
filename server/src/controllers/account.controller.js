const { z } = require('zod');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const prisma = require('../config/prismaClient');
const { updateAccountSchema } = require('../../../shared/validation/accountSchemas');
const { addressSchema } = require('../../../shared/validation/orderSchemas');
const { createInvoicePdf } = require('../services/invoice.service');

const getAccount = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ success: true, data: { id: user.id, phone: user.phone, name: user.name, email: user.email } });
});

const updateAccount = asyncHandler(async (req, res) => {
  const body = updateAccountSchema.parse(req.body);
  const user = await prisma.user.update({ where: { id: req.user.id }, data: body });
  res.json({ success: true, data: { id: user.id, phone: user.phone, name: user.name, email: user.email } });
});

const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await prisma.userAddress.findMany({ where: { userId: req.user.id } });
  res.json({ success: true, data: addresses });
});

const createAddress = asyncHandler(async (req, res) => {
  const body = addressSchema.extend({ label: z.string().optional() }).parse(req.body);
  const address = await prisma.userAddress.create({ data: { ...body, userId: req.user.id } });
  res.status(201).json({ success: true, data: address });
});

async function assertOwnAddress(userId, addressId) {
  const address = await prisma.userAddress.findFirst({ where: { id: addressId, userId } });
  if (!address) throw new ApiError(404, 'Address not found.');
  return address;
}

const updateAddress = asyncHandler(async (req, res) => {
  const body = addressSchema.partial().parse(req.body);
  const result = await prisma.userAddress.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: body });
  if (!result.count) throw new ApiError(404, 'Address not found.');
  const address = await assertOwnAddress(req.user.id, req.params.id);
  res.json({ success: true, data: address });
});

const deleteAddress = asyncHandler(async (req, res) => {
  const result = await prisma.userAddress.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
  if (!result.count) throw new ApiError(404, 'Address not found.');
  res.json({ success: true, data: { message: 'Address removed.' } });
});

const listOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      items: { include: { product: { include: { media: { take: 1 } } }, variation: true } },
      addresses: true,
    },
  });
  res.json({ success: true, data: orders });
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: { items: true, addresses: true, statusHistory: { orderBy: { createdAt: 'asc' } }, payments: true },
  });
  if (!order) throw new ApiError(404, 'Order not found.');
  res.json({ success: true, data: order });
});

const downloadInvoice = asyncHandler(async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: { items: { include: { variation: true } }, addresses: true, payments: true, user: { select: { name: true, email: true } } },
  });
  if (!order) throw new ApiError(404, 'Order not found.');
  const pdf = createInvoicePdf(order);
  const filename = `Bagiroo-Invoice-${order.orderNumber.replace(/[^a-z0-9_-]/gi, '-')}.pdf`;
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"`, 'Content-Length': pdf.length, 'Cache-Control': 'private, no-store' });
  res.send(pdf);
});

module.exports = {
  getAccount,
  updateAccount,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  listOrders,
  getOrder,
  downloadInvoice,
};
