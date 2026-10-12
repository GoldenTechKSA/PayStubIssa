import { z } from 'zod';
import { ITEM_TYPES } from '../services/pricing';

export const cartSchema = z.object({
  items: z
    .array(
      z.object({
        type: z.enum(ITEM_TYPES),
        qty: z.number().int().min(1).max(1000),
      }),
    )
    .min(1)
    .max(10),
  couponCode: z.string().trim().max(40).optional(),
});

export const createOrderSchema = cartSchema.extend({
  meta: z
    .object({
      attestedAt: z.string().datetime({ offset: true }).optional(),
      templateId: z.union([z.number().int(), z.string().max(64)]).optional(),
    })
    .strict()
    .optional(),
});

export const orderIdParam = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
});

export const verifyUnlockSchema = z.object({
  token: z.string().min(16).max(4096),
});
