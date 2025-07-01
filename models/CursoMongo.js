// modeloCurso.js

const mongoose = require('mongoose');

const slideSchema = new mongoose.Schema({
  title: String,
  description: String,
  html: String,
  css: String
});

const sectionSchema = new mongoose.Schema({
  title: String,
  description: String,
  slides: [slideSchema],
  subsections: [],
  referenceCount: Number
});

const cursoSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  duration: Number,
  level: String,
  instructor: String,
  price: Number,
  image: String,
  published: Boolean,
  sections: [sectionSchema]
}, { timestamps: true });

const Curso = mongoose.model('Curso', cursoSchema);
module.exports = Curso;
