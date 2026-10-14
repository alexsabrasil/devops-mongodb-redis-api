const { Router } = require('express');
const UserController = require('./controllers/UserController');

const routes = Router();

routes.post('/users', UserController.create);
routes.get('/users/:id', UserController.getById);

module.exports = routes;
