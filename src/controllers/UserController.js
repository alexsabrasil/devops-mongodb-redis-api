
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const redisClient = require('../config/redis');

function publicUser(user) {
  const { password, ...safeUser } = user.toObject();
  return safeUser;
}

module.exports = {
  async create(req, res) {
    try {
      const { name, email, password } = req.body;

      if (
        typeof name !== 'string' || !name.trim() ||
        typeof email !== 'string' || !email.trim() ||
        typeof password !== 'string' || password.length < 8
      ) {
        return res.status(400).json({
          error: 'Invalid input: name, email and password (minimum 8 characters) are required'
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const userExists = await User.findOne({ email: normalizedEmail });

      if (userExists) {
        return res.status(409).json({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword
      });

      const safeUser = publicUser(user);

      await redisClient.set(
        `user:${user._id}`,
        JSON.stringify(safeUser),
        { EX: 3600 }
      );

      return res.status(201).json(safeUser);
    } catch (error) {
      console.error(error);

      if (error.code === 11000) {
        return res.status(409).json({ error: 'User already exists' });
      }

      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const cachedUser = await redisClient.get(`user:${id}`);

      if (cachedUser) {
        const { password, ...safeCachedUser } = JSON.parse(cachedUser);

        return res.json({
          source: 'redis',
          data: safeCachedUser
        });
      }

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const safeUser = publicUser(user);

      await redisClient.set(
        `user:${id}`,
        JSON.stringify(safeUser),
        { EX: 3600 }
      );

      return res.json({
        source: 'mongodb',
        data: safeUser
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
};
