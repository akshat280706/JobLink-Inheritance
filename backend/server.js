import app from './app.js';   // or whatever this file is named

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  const baseURL = process.env.BASE_URL || `http://localhost:${PORT}`;
  console.log(`🚀 Server running at ${baseURL}`);
});
