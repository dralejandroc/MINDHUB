/**
 * Create STAI scale with proper Estado/Rasgo response groups
 * STAI requires 2 different response option sets:
 * - Estado (items 1-20): Nada, Algo, Bastante, Mucho
 * - Rasgo (items 21-40): Casi nunca, A veces, A menudo, Casi siempre
 */

const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function createStaiWithResponseGroups() {
  try {
    console.log('🏗️  Creating STAI with response groups...');
    
    // Clean existing STAI data
    await prisma.scaleResponseOption.deleteMany({ where: { scaleId: 'stai' } });
    await prisma.scaleResponseGroup.deleteMany({ where: { scaleId: 'stai' } });
    await prisma.scaleItem.deleteMany({ where: { scaleId: 'stai' } });
    console.log('🗑️  Cleaned existing STAI data');
    
    // Create response groups
    const estadoGroup = await prisma.scaleResponseGroup.create({
      data: {
        id: 'stai-group-estado',
        scaleId: 'stai',
        groupKey: 'estado',
        name: 'Ansiedad Estado',
        description: 'Cómo se siente en este momento',
        displayOrder: 1
      }
    });
    
    const rasgoGroup = await prisma.scaleResponseGroup.create({
      data: {
        id: 'stai-group-rasgo',
        scaleId: 'stai',
        groupKey: 'rasgo', 
        name: 'Ansiedad Rasgo',
        description: 'Cómo se siente generalmente',
        displayOrder: 2
      }
    });
    
    console.log('✅ Created response groups:', estadoGroup.name, rasgoGroup.name);
    
    // Create Estado response options (items 1-20)
    const estadoOptions = [
      { value: '0', label: 'Nada', score: 0 },
      { value: '1', label: 'Algo', score: 1 },
      { value: '2', label: 'Bastante', score: 2 },
      { value: '3', label: 'Mucho', score: 3 }
    ];
    
    for (let i = 0; i < estadoOptions.length; i++) {
      const option = estadoOptions[i];
      await prisma.scaleResponseOption.create({
        data: {
          id: `stai-estado-opt-${i}`,
          scaleId: 'stai',
          responseGroup: 'estado',
          optionValue: option.value,
          optionLabel: option.label,
          scoreValue: option.score,
          displayOrder: i + 1
        }
      });
    }
    
    console.log('✅ Created Estado options:', estadoOptions.map(o => o.label).join(', '));
    
    // Create Rasgo response options (items 21-40)
    const rasgoOptions = [
      { value: '0', label: 'Casi nunca', score: 0 },
      { value: '1', label: 'A veces', score: 1 },
      { value: '2', label: 'A menudo', score: 2 },
      { value: '3', label: 'Casi siempre', score: 3 }
    ];
    
    for (let i = 0; i < rasgoOptions.length; i++) {
      const option = rasgoOptions[i];
      await prisma.scaleResponseOption.create({
        data: {
          id: `stai-rasgo-opt-${i}`,
          scaleId: 'stai',
          responseGroup: 'rasgo',
          optionValue: option.value,
          optionLabel: option.label,
          scoreValue: option.score,
          displayOrder: i + 1
        }
      });
    }
    
    console.log('✅ Created Rasgo options:', rasgoOptions.map(o => o.label).join(', '));
    
    // STAI items with proper response groups
    const staiItems = [
      // ESTADO items (1-20)
      { num: 1, text: 'Me siento calmado', group: 'estado', reverse: true },
      { num: 2, text: 'Me siento seguro', group: 'estado', reverse: true },
      { num: 3, text: 'Estoy tenso', group: 'estado', reverse: false },
      { num: 4, text: 'Estoy contrariado', group: 'estado', reverse: false },
      { num: 5, text: 'Me siento cómodo', group: 'estado', reverse: true },
      { num: 6, text: 'Me siento alterado', group: 'estado', reverse: false },
      { num: 7, text: 'Estoy preocupado por posibles desgracias', group: 'estado', reverse: false },
      { num: 8, text: 'Me siento descansado', group: 'estado', reverse: true },
      { num: 9, text: 'Me siento angustiado', group: 'estado', reverse: false },
      { num: 10, text: 'Me siento confortable', group: 'estado', reverse: true },
      { num: 11, text: 'Tengo confianza en mí mismo', group: 'estado', reverse: true },
      { num: 12, text: 'Me siento nervioso', group: 'estado', reverse: false },
      { num: 13, text: 'Estoy desasosegado', group: 'estado', reverse: false },
      { num: 14, text: 'Me siento muy atado', group: 'estado', reverse: false },
      { num: 15, text: 'Estoy relajado', group: 'estado', reverse: true },
      { num: 16, text: 'Me siento satisfecho', group: 'estado', reverse: true },
      { num: 17, text: 'Estoy preocupado', group: 'estado', reverse: false },
      { num: 18, text: 'Me siento aturdido y sobreexcitado', group: 'estado', reverse: false },
      { num: 19, text: 'Me siento alegre', group: 'estado', reverse: true },
      { num: 20, text: 'En este momento me siento bien', group: 'estado', reverse: true },
      
      // RASGO items (21-40)
      { num: 21, text: 'Me siento bien', group: 'rasgo', reverse: true },
      { num: 22, text: 'Me canso rápidamente', group: 'rasgo', reverse: false },
      { num: 23, text: 'Siento ganas de llorar', group: 'rasgo', reverse: false },
      { num: 24, text: 'Me gustaría ser tan feliz como otros', group: 'rasgo', reverse: false },
      { num: 25, text: 'Pierdo oportunidades por no decidirme pronto', group: 'rasgo', reverse: false },
      { num: 26, text: 'Me siento descansado', group: 'rasgo', reverse: true },
      { num: 27, text: 'Soy calmado, sereno y sosegado', group: 'rasgo', reverse: true },
      { num: 28, text: 'Veo que las dificultades se acumulan y no puedo con ellas', group: 'rasgo', reverse: false },
      { num: 29, text: 'Me preocupo demasiado por cosas sin importancia', group: 'rasgo', reverse: false },
      { num: 30, text: 'Soy feliz', group: 'rasgo', reverse: true },
      { num: 31, text: 'Suelo tomar las cosas muy a pecho', group: 'rasgo', reverse: false },
      { num: 32, text: 'Me falta confianza en mí mismo', group: 'rasgo', reverse: false },
      { num: 33, text: 'Me siento seguro', group: 'rasgo', reverse: true },
      { num: 34, text: 'No suelo afrontar las crisis o dificultades', group: 'rasgo', reverse: false },
      { num: 35, text: 'Me siento triste', group: 'rasgo', reverse: false },
      { num: 36, text: 'Estoy satisfecho', group: 'rasgo', reverse: true },
      { num: 37, text: 'Me rondan y molestan pensamientos sin importancia', group: 'rasgo', reverse: false },
      { num: 38, text: 'Me afectan tanto los desengaños que no puedo olvidarlos', group: 'rasgo', reverse: false },
      { num: 39, text: 'Soy una persona estable', group: 'rasgo', reverse: true },
      { num: 40, text: 'Cuando pienso sobre asuntos y preocupaciones actuales me pongo tenso y agitado', group: 'rasgo', reverse: false }
    ];
    
    // Create items
    for (const item of staiItems) {
      await prisma.scaleItem.create({
        data: {
          id: `stai-item-${item.num}`,
          scaleId: 'stai',
          itemNumber: item.num,
          itemText: item.text,
          itemCode: `STAI${item.num}`,
          responseGroup: item.group,
          reverseScored: item.reverse,
          question_type: 'likert',
          required: true
        }
      });
    }
    
    console.log('✅ Created 40 STAI items (20 Estado + 20 Rasgo)');
    
    // Update existing STAI scale to remove global response options (now using groups)
    await prisma.scaleResponseOption.deleteMany({ 
      where: { 
        scaleId: 'stai',
        responseGroup: null 
      } 
    });
    
    console.log('✅ Removed old global STAI options');
    
    // Verify creation
    const verification = await prisma.scale.findUnique({
      where: { id: 'stai' },
      include: {
        responseGroups: true,
        items: {
          orderBy: { itemNumber: 'asc' },
          take: 5 // Just first 5 for verification
        },
        _count: {
          select: {
            responseOptions: true,
            items: true
          }
        }
      }
    });
    
    console.log('\\n🎉 STAI with response groups created successfully!');
    console.log(`📊 Response Groups: ${verification.responseGroups.length}`);
    verification.responseGroups.forEach(group => {
      console.log(`   - ${group.name} (${group.groupKey}): ${group.description}`);
    });
    console.log(`📝 Total Items: ${verification._count.items}`);
    console.log(`🎯 Total Response Options: ${verification._count.responseOptions}`);
    console.log('\\n✅ STAI now supports Estado (Nada/Algo/Bastante/Mucho) and Rasgo (Casi nunca/A veces/A menudo/Casi siempre)');

  } catch (error) {
    console.error('❌ Error creating STAI with response groups:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createStaiWithResponseGroups();