const express = require('express');
const routes = require('./routes');

const app = express();

app.disable('x-powered-by');
app.use(express.json());
app.use(routes);

app.use((req, res) => {
  return res.status(404).json({
    error: 'Route not found'
  });
});

module.exports = app;
