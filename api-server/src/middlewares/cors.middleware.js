import cors from 'cors';

/**
 * Configure CORS middleware
 * Allows requests from primary frontend and SEB frontend
 */
const configureCors = () => {
  const allowedOrigins = [
    process.env.PRIMARY_FRONTEND_URL || 'http://localhost:5173',
    process.env.SEB_FRONTEND_URL || 'http://localhost:5174',
    'http://localhost:3000', // Main backend
  ];

  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };

  return cors(corsOptions);
};

export default configureCors;
