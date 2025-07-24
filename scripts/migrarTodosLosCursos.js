
require('dotenv').config();
const { connectMySQL, connectMongoDB } = require('../db');
const Curso = require('../models/CursoMongo');

/*script para migrar todos los cursos de MySQL a MongoDB
verificado que trae todo el html,css,scripts*/

async function migrarTodosLosCursos() {
  try {
    // 1. Conectar a MongoDB y MySQL
    await connectMongoDB();
    const connection = await connectMySQL();

    // 2. Obtener todos los cursos (sin filtro de estado)
    const [cursos] = await connection.execute(`
      SELECT idContenido FROM contenido
      ORDER BY idContenido
      
    `);

    if (cursos.length === 0) {
      console.log('⚠️ No se encontraron cursos en la base de datos.');
      return;
    }

    console.log(`🔎 Se encontraron ${cursos.length} cursos en total.`);

    for (const { idContenido } of cursos) {
      console.log(`\n🚀 Migrando curso ID: ${idContenido}`);

      // 3. Obtener metadatos del curso
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
        WHERE c.idContenido = ?;

      `, [idContenido]);

      if (cursoMetaRows.length === 0) {
        console.warn(`⚠️ Curso ${idContenido} no tiene metadatos. Se omite.`);
        continue;
      }

      const cursoMeta = cursoMetaRows[0];

      // 3.1 Verificar si ya existe en Mongo
      const existe = await Curso.findOne({ title: cursoMeta.title });
      if (existe) {
        console.log(`⏭️ El curso "${cursoMeta.title}" ya existe. Se omite.`);
        continue;
      }

      // 4. Obtener secciones y slides
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
        WHERE c.idContenido = ?
        ORDER BY sco.IdSCO, d.orden;
      `, [idContenido]);

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

      // 5. Crear y guardar el curso en Mongo
      const parsedDuration = cursoMeta.duration
        ? parseInt(String(cursoMeta.duration).match(/\d+/)?.[0]) || 0
        : 0;

      const published = cursoMeta.estado?.toLowerCase() === 'activo';

      const cursoFinal = new Curso({
        title: cursoMeta.title || '',
        description: cursoMeta.description || '',
        category: cursoMeta.category || 'uncategorized',
        duration: parsedDuration,
        level: '',
        instructor: '',
        author: cursoMeta.author || '',
        price: 0,
        image: '',
        published: published,
        previewImage: '',
        sections: sections
      });

      await cursoFinal.save();
      console.log(`✅ Curso "${cursoMeta.title}" migrado con éxito.`);
    }

    await connection.end();
    console.log('\n🎉 Migración de todos los cursos completada.');
    process.exit();

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

migrarTodosLosCursos();