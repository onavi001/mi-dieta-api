const BASE_URL = process.env.PUBLIC_API_BASE_URL || 'http://localhost:3000'

const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Mi Dieta API',
    version: '1.0.0',
    description: 'Documentacion de endpoints para la app Mi Dieta (Express + Supabase).',
  },
  servers: [{ url: BASE_URL }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Plans' },
    { name: 'Meals' },
    { name: 'Nutrition' },
    { name: 'Shares' },
    { name: 'Reference' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ApiSuccess: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          data: { type: 'object', additionalProperties: true },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Validation error' },
        },
      },
      DailyEngagement: {
        type: 'object',
        properties: {
          date: { type: 'string', nullable: true, example: '2026-04-27' },
          mood: { type: 'string', nullable: true, enum: ['good', 'slip', 'help'] },
          streak: { type: 'number', example: 5 },
          lastGoodDate: { type: 'string', nullable: true, example: '2026-04-26' },
          updatedAt: { type: 'string', nullable: true, example: '2026-04-27T12:34:56.000Z' },
        },
      },
      EventTrackPayload: {
        type: 'object',
        required: ['event'],
        properties: {
          event: { type: 'string', example: 'today_brief_viewed' },
          context: { type: 'object', additionalProperties: true },
        },
      },
      SlotAlternativePayload: {
        type: 'object',
        required: ['slotId'],
        properties: {
          slotId: { type: 'string', example: 'lun-desayuno' },
          limit: { type: 'number', example: 5 },
        },
      },
      SlotIngredientReplacePayload: {
        type: 'object',
        required: ['slotId', 'ingredientIndex', 'nextIngredientId'],
        properties: {
          slotId: { type: 'string', example: 'lun-comida' },
          ingredientIndex: { type: 'number', example: 0 },
          nextIngredientId: { type: 'string', example: 'pollo_pechuga' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: {
            description: 'Server healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'healthy' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true },
            },
          },
        },
        responses: { 200: { description: 'Registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with credentials',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true },
            },
          },
        },
        responses: { 200: { description: 'Logged in', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        responses: { 200: { description: 'Token refreshed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout current session',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Logged out', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current authenticated user',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Current user', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/users/me/profile': {
      get: {
        tags: ['Users'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/users/me/daily-engagement': {
      get: {
        tags: ['Users'],
        summary: 'Get daily engagement state',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Daily engagement',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiSuccess' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            dailyEngagement: { $ref: '#/components/schemas/DailyEngagement' },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Update daily engagement state',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['dailyEngagement'],
                properties: {
                  dailyEngagement: { $ref: '#/components/schemas/DailyEngagement' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Daily engagement updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/users/me/events': {
      post: {
        tags: ['Users'],
        summary: 'Track analytics event for current user',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EventTrackPayload' },
            },
          },
        },
        responses: { 200: { description: 'Event tracked', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/users/me/reset-data': {
      post: {
        tags: ['Users'],
        summary: 'Reset current user data',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Data reset', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/plans/my': {
      get: {
        tags: ['Plans'],
        summary: 'Get my plan',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Plan', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/plans/my/generate': {
      post: {
        tags: ['Plans'],
        summary: 'Generate my weekly plan',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Plan generated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/plans/my/alternatives': {
      post: {
        tags: ['Plans'],
        summary: 'Get alternatives for a slot',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SlotAlternativePayload' },
            },
          },
        },
        responses: { 200: { description: 'Alternatives', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/plans/my/slot': {
      put: {
        tags: ['Plans'],
        summary: 'Update slot meal',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true },
            },
          },
        },
        responses: { 200: { description: 'Slot updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/plans/my/ingredient': {
      put: {
        tags: ['Plans'],
        summary: 'Replace ingredient in slot',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SlotIngredientReplacePayload' },
            },
          },
        },
        responses: { 200: { description: 'Ingredient replaced', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/plans/my/complete': {
      put: {
        tags: ['Plans'],
        summary: 'Mark a slot as complete/incomplete',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Completion updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/plans/my/grocery': {
      put: {
        tags: ['Plans'],
        summary: 'Update grocery checks',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Grocery updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/plans/my/week-state': {
      put: {
        tags: ['Plans'],
        summary: 'Update week state',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Week state updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/plans/combined/{otherUserId}': {
      get: {
        tags: ['Plans'],
        summary: 'Get combined plan with another user',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'otherUserId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Combined plan', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/plans/{userId}': {
      get: {
        tags: ['Plans'],
        summary: 'Get plan by user id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Plan by user', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/meals': {
      get: {
        tags: ['Meals'],
        summary: 'List meals',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Meals list', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
      post: {
        tags: ['Meals'],
        summary: 'Create meal',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true },
            },
          },
        },
        responses: { 200: { description: 'Meal created', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/meals/{id}': {
      get: {
        tags: ['Meals'],
        summary: 'Get meal by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Meal', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
      put: {
        tags: ['Meals'],
        summary: 'Update meal by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true },
            },
          },
        },
        responses: { 200: { description: 'Meal updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
      delete: {
        tags: ['Meals'],
        summary: 'Delete meal by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Meal deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/nutrition/summary': {
      get: {
        tags: ['Nutrition'],
        summary: 'Get nutrition summary',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Nutrition summary', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/nutrition/profile': {
      put: {
        tags: ['Nutrition'],
        summary: 'Create or update nutrition profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true },
            },
          },
        },
        responses: { 200: { description: 'Profile upserted', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/nutrition/plans': {
      get: {
        tags: ['Nutrition'],
        summary: 'List nutrition plan versions',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Plan versions', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
      post: {
        tags: ['Nutrition'],
        summary: 'Create nutrition plan version',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true },
            },
          },
        },
        responses: { 200: { description: 'Plan version created', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/nutrition/progress': {
      get: {
        tags: ['Nutrition'],
        summary: 'List nutrition progress logs',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Progress logs', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
      put: {
        tags: ['Nutrition'],
        summary: 'Create or update progress log',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true },
            },
          },
        },
        responses: { 200: { description: 'Progress upserted', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/nutrition/calculate-plan': {
      post: {
        tags: ['Nutrition'],
        summary: 'Preview nutrition plan calculation',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true },
            },
          },
        },
        responses: { 200: { description: 'Plan preview', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/shares/my': {
      get: {
        tags: ['Shares'],
        summary: 'List users I share with',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'My shares', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/shares/my/users': {
      get: {
        tags: ['Shares'],
        summary: 'List user details for my shares',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'My share users', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/shares/search': {
      get: {
        tags: ['Shares'],
        summary: 'Search share candidates',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Candidates', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/shares': {
      post: {
        tags: ['Shares'],
        summary: 'Create share permission',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true },
            },
          },
        },
        responses: { 200: { description: 'Share created', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/shares/{sharedWithUserId}': {
      put: {
        tags: ['Shares'],
        summary: 'Update share permission',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'sharedWithUserId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true },
            },
          },
        },
        responses: { 200: { description: 'Share updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
      delete: {
        tags: ['Shares'],
        summary: 'Delete share permission',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'sharedWithUserId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Share deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/shares/invites/incoming': {
      get: {
        tags: ['Shares'],
        summary: 'List incoming share invites',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Incoming invites', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/shares/invites/outgoing': {
      get: {
        tags: ['Shares'],
        summary: 'List outgoing share invites',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Outgoing invites', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/shares/invites': {
      post: {
        tags: ['Shares'],
        summary: 'Send share invite',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true },
            },
          },
        },
        responses: { 200: { description: 'Invite sent', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/shares/invites/{inviteId}/accept': {
      post: {
        tags: ['Shares'],
        summary: 'Accept invite',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'inviteId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Invite accepted', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/shares/invites/{inviteId}/reject': {
      post: {
        tags: ['Shares'],
        summary: 'Reject invite',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'inviteId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Invite rejected', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } } },
      },
    },
    '/api/reference/ingredients': {
      get: {
        tags: ['Reference'],
        summary: 'Get ingredient reference payload',
        responses: { 200: { description: 'Ingredient reference payload', content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } } } },
      },
    },
  },
}

module.exports = { openapiSpec }
