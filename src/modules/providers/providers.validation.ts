import Joi from 'joi';

// PUT /api/providers/profile — provider updates own profile
export const updateProviderProfileSchema = Joi.object({
  bio: Joi.string().max(500).optional(),
  experience: Joi.number().integer().min(0).max(50).optional(),
  bankDetails: Joi.object({
    accountNumber: Joi.string().required(),
    ifscCode: Joi.string().required(),
    bankName: Joi.string().required(),
    accountHolderName: Joi.string().required(),
  }).optional(),
});

// POST /api/providers/services — provider adds a service they offer
export const addProviderServiceSchema = Joi.object({
  serviceId: Joi.string().uuid().required(),
  price: Joi.number().positive().required(), // provider's own price for this service
});

// PUT /api/providers/availability — provider sets working hours
export const setAvailabilitySchema = Joi.object({
  availability: Joi.array().items(
    Joi.object({
      dayOfWeek: Joi.number().integer().min(0).max(6).required(), // 0=Sun, 6=Sat
      startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(), // "09:00" format
      endTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
      isOff: Joi.boolean().default(false),
    })
  ).min(1).required(),
});

// PATCH /api/providers/toggle-availability — toggle online/offline
export const toggleAvailabilitySchema = Joi.object({
  isAvailable: Joi.boolean().required(),
});

// GET /api/providers/search — find providers by service + location
export const searchProvidersSchema = Joi.object({
  serviceId: Joi.string().uuid().required(),
  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(20).default(10),
  sortBy: Joi.string().valid('rating', 'price', 'experience').default('rating'),
});
