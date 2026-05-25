import Joi from 'joi';

// POST /api/services — create service (admin only)
export const createServiceSchema = Joi.object({
  categoryId: Joi.string().uuid().required(),   // must be a valid UUID
  name: Joi.string().min(3).max(100).trim().required(),
  description: Joi.string().max(500).optional(),
  image: Joi.string().uri().optional(),
  basePrice: Joi.number().positive().required(), // must be > 0
  duration: Joi.number().integer().positive().required(), // minutes
});

// PUT /api/services/:id — update service (admin only)
export const updateServiceSchema = Joi.object({
  categoryId: Joi.string().uuid().optional(),
  name: Joi.string().min(3).max(100).trim().optional(),
  description: Joi.string().max(500).optional(),
  image: Joi.string().uri().optional(),
  basePrice: Joi.number().positive().optional(),
  duration: Joi.number().integer().positive().optional(),
  isActive: Joi.boolean().optional(),
});

// GET /api/services/search — search/filter query params
export const searchServicesSchema = Joi.object({
  category: Joi.string().uuid().optional(),         // filter by category ID
  q: Joi.string().min(1).max(100).optional(),       // search keyword
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().positive().optional(),
  lat: Joi.number().min(-90).max(90).optional(),    // customer's GPS latitude
  lng: Joi.number().min(-180).max(180).optional(),  // customer's GPS longitude
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});
