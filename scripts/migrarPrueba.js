const { connectMySQL, connectMongoDB } = require('../db');
const Curso = require('../models/CursoMongo');

async function migrarCurso500() {
  try {
    // 1. Conectamos a MongoDB y MySQL
    await connectMongoDB();
    const connection = await connectMySQL();

    // 2. Obtener metadatos del curso 500
    const [cursoMetaRows] = await connection.execute(`
      SELECT 
        c.idContenido,
        TRIM(SUBSTRING_INDEX(c.nombre, ':', -1)) AS title,
        cr.nombre AS description,
        cat.Denominacion AS category,
        ch.horas AS duration,
        c.estado
      FROM contenido c
      LEFT JOIN ContenidosResumen cr ON cr.idcontenido = c.idContenido
      LEFT JOIN CategoriasCampusGv cat ON cat.idCategorias = c.categoriaCampusGV
      LEFT JOIN certificadosHoras ch ON ch.codigo = SUBSTRING_INDEX(c.nombre, ':', 1)
      WHERE c.idContenido = 500
      LIMIT 1;
    `);

    if (cursoMetaRows.length === 0) {
      console.error('❌ Curso 500 no encontrado.');
      return;
    }

    const cursoMeta = cursoMetaRows[0];

    /* 2.1 Verificar si ya existe en Mongo
    const existing = await Curso.findOne({ title: cursoMeta.title });
    if (existing) {
      console.log(`⚠️ El curso "${cursoMeta.title}" ya existe en MongoDB. Se omite.`);
      await connection.end();
      return;
    }*/

    // 3. Obtener secciones y slides del curso 500
    const [rows] = await connection.execute(`
      SELECT 
        sco.IdSCO,
        sco.Nombre AS sectionTitle,
        d.title AS slideTitle,
        ce.contenido AS html
      FROM celdas ce
      INNER JOIN tablas t ON t.id = ce.id_tabla
      INNER JOIN documentos d ON d.tablas = ce.id_tabla
      INNER JOIN sco ON sco.IdSCO = d.id_sco
      INNER JOIN contenido c ON FIND_IN_SET(sco.IdSCO, c.scos)
      WHERE c.idContenido = 500
      ORDER BY sco.IdSCO, d.orden;
    `);

    // 4. Agrupar secciones y slides
    const seccionesMap = new Map();

    for (const row of rows) {
      if (!seccionesMap.has(row.IdSCO)) {
        seccionesMap.set(row.IdSCO, {
          title: row.sectionTitle || '',
          description: '',
          slides: [],
          subsections: [],
          referenceCount: 0
        });
      }

      seccionesMap.get(row.IdSCO).slides.push({
        title: row.slideTitle || '',
        description: '',
        html: row.html || '',
        css: ''
      });
    }

    const sections = Array.from(seccionesMap.values());

    // 5. Crear documento del curso con estructura Mongo
    console.log('📦 Duración cruda desde MySQL:', cursoMeta.duration);
    const parsedDuration = cursoMeta.duration
      ? parseInt(String(cursoMeta.duration).match(/\d+/)?.[0]) || 0
      : 0;

    const published = cursoMeta.estado?.toLowerCase() === 'activo';

    const cursoFinal = new Curso({
      title: cursoMeta.title || '',
      description: cursoMeta.description || '',
      category: cursoMeta.category || '',
      duration: parsedDuration,
      level: '',
      instructor: '',
      price: 0,
      image: '',
      published: published,
      sections: sections
    });

    // 6. Guardar en Mongo
    await cursoFinal.save();
    console.log('✅ Curso 500 migrado correctamente a MongoDB');

    await connection.end();
    process.exit();

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

migrarCurso500();
