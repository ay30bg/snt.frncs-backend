// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const dotenv = require('dotenv');

// dotenv.config();

// const authRoutes = require('./routes/auth');
// const paymentRoutes  = require('./routes/payment');
// const notifyRoutes = require('./routes/notify'); 
// const productRoutes = require("./routes/products");
// // const cartRoutes = require('./routes/cart');

// const app = express();

// // CORS configuration
// app.use(cors({
//   origin: ['http://localhost:3000', 'https://snt-frncs.vercel.app', 'https://www.sntfrncs.store', 'https://sntfrncs-admin.vercel.app'],
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true,
// }));

// app.use(express.json());

// // Connect to MongoDB
// mongoose.connect(process.env.MONGO_URI, {
//   connectTimeoutMS: 30000,
//   socketTimeoutMS: 45000,
// })
//   .then(() => console.log('MongoDB connected'))
//   .catch((err) => {
//     console.error('MongoDB connection error:', err);
//     // Don't exit, allow server to run for non-MongoDB routes
//   });

// // Routes
// app.use('/api/', authRoutes);
// app.use('/api/paystack', paymentRoutes);
// app.use('/api', notifyRoutes);
// app.use("/api/products", productRoutes);
// // app.use('/api/cart', cartRoutes);

// app.get('/', (req, res) => {
//   res.json({ message: 'SNTFRNCS API' });
// });

// // 404 handler
// app.use((req, res) => {
//   console.log(`404: Route not found: ${req.method} ${req.url}`);
//   res.status(404).json({ error: 'Route not found' });
// });

// // Error handler
// app.use((err, req, res, next) => {
//   console.error('Server error:', err.stack);
//   res.status(500).json({ error: 'Internal server error', details: err.message });
// });

// module.exports = app;


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');
const notifyRoutes = require('./routes/notify');
const productRoutes = require('./routes/products');

const app = express();
const server = http.createServer(app);

// ✅ Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://snt-frncs.vercel.app',
      'https://www.sntfrncs.store',
      'https://sntfrncs-admin.vercel.app',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make Socket.IO available globally
app.set('io', io);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://snt-frncs.vercel.app',
    'https://www.sntfrncs.store',
    'https://sntfrncs-admin.vercel.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGO_URI, {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/', authRoutes);
app.use('/api/paystack', paymentRoutes);
app.use('/api', notifyRoutes);
app.use('/api/products', productRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'SNTFRNCS API is running' });
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('🟢 Admin connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔴 Admin disconnected:', socket.id);
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
