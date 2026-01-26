// ============================================
// models/Banner.js - Modelo de banners
// ============================================
const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    required: true
  },
  linkUrl: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  buttonText: {
    type: String,
    default: 'Ver más'
  }
}, {
  timestamps: true
});

// Índice para ordenar
bannerSchema.index({ order: 1, isActive: 1 });

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
