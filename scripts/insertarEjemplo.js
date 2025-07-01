const mongoose = require('mongoose');
const { connectMongoDB } = require('../db');
const Curso = require('../models/CursoMongo');

async function main() {
  await connectMongoDB();

  const cursoDePrueba = new Curso({
    title: "Curso de ejemplo",
    description: "Este es un curso de prueba",
    category: "Test",
    duration: 2,
    level: "Principiante",
    instructor: "Miriam",
    price: 10,
    image: "",
    published: false,
    sections: [
      {
        title: "Sección 1",
        description: "Descripción de la sección",
        slides: [
          {
            title: "Slide 1",
            description: "Contenido de prueba",
            html: "<p>Hola Mundo</p>",
            css: "p { color: red; }"
          }
        ],
        subsections: [],
        referenceCount: 0
      }
    ]
  });

  await cursoDePrueba.save();
  console.log("✅ Curso insertado correctamente");
  mongoose.disconnect();
}

main();
