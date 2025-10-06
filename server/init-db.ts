import { storage } from './storage';
import bcrypt from 'bcrypt';

export async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database...');

    // Test database connection first
    try {
      // Check if default teacher exists
      const existingTeacher = await storage.getUserByPhoneNumber('01762602056');

      if (!existingTeacher) {
        console.log('👨‍🏫 Creating default teacher account...');

        // Hash password for teacher
        const hashedPassword = await bcrypt.hash('sir@123@', 10);

        await storage.createUser({
          firstName: 'Golam Sarowar',
          lastName: 'Sir',
          phoneNumber: '01762602056',
          password: hashedPassword,
          role: 'teacher',
          email: 'sarowar@studentnursing.com',
          smsCount: 1000,
          isActive: true
        });

        console.log('✅ Default teacher created:');
        console.log('   Phone: 01762602056');
        console.log('   Password: sir@123@');
        console.log('   SMS Count: 1000');
      } else {
        console.log('✅ Default teacher already exists');
      }

      // Check if default super user exists
      const existingSuperUser = await storage.getUserByPhoneNumber('01818291546');

      if (!existingSuperUser) {
        console.log('👑 Creating default super user account...');

        // Hash password for super user
        const hashedSuperPassword = await bcrypt.hash('sahidx@123', 10);

        await storage.createUser({
          firstName: 'Sahid',
          lastName: 'Rahman',
          phoneNumber: '01818291546',
          password: hashedSuperPassword,
          role: 'super_user',
          email: 'sahid@studentnursing.com',
          smsCount: 0,
          isActive: true
        });

        console.log('✅ Default super user created:');
        console.log('   Phone: 01818291546');
        console.log('   Password: sahidx@123');
      } else {
        console.log('✅ Default super user already exists');
      }

      // Seed syllabus data
      await seedSyllabus();

      console.log('✅ Database initialization complete');
    } catch (dbError: any) {
      console.warn('⚠️ Database connection failed, but hardcoded authentication will still work:', dbError?.message || dbError);
      console.log('🔑 Hardcoded accounts available:');
      console.log('   Teacher: 01762602056 / sir@123@');
      console.log('   Admin: 01818291546 / sahidx@123@');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

async function seedSyllabus() {
  const { db } = await import('./db');
  const { syllabusClasses, syllabusSubjects, syllabusChapters } = await import('@shared/schema');
  const { eq, or } = await import('drizzle-orm');
  
  const classes = await storage.getAllClasses();
  
  // Check if we have the correct classes (6, 7, 8, 9-10) and no class 11-12
  const hasClass11_12 = classes.some(c => c.name === 'class_11_12');
  const hasCorrectClasses = classes.some(c => c.name === 'class_6') && 
                           classes.some(c => c.name === 'class_7') && 
                           classes.some(c => c.name === 'class_8') && 
                           classes.some(c => c.name === 'class_9_10');
  
  // If we have class 11-12 or missing correct classes, reseed
  if (hasClass11_12 || !hasCorrectClasses) {
    console.log('🔄 Reseeding syllabus data (removing class 11-12)...');
    
    // Delete all existing syllabus data
    await db.delete(syllabusChapters);
    await db.delete(syllabusSubjects);
    await db.delete(syllabusClasses);
    
    console.log('📚 Seeding fresh NCTB syllabus data...');
  } else if (classes.length > 0) {
    // Check if chapters exist
    const allChapters = await db.select().from(syllabusChapters);
    if (allChapters.length > 0) {
      console.log('✅ Syllabus already seeded');
      return;
    }
    console.log('📚 Seeding chapters data...');
  } else {
    console.log('📚 Seeding NCTB syllabus data...');
  }

  // Insert classes (removed class 11-12)
  const classData = [
    { name: 'class_6', displayName: 'ষষ্ঠ শ্রেণী (Class 6)', level: 'primary', displayOrder: 1 },
    { name: 'class_7', displayName: 'সপ্তম শ্রেণী (Class 7)', level: 'primary', displayOrder: 2 },
    { name: 'class_8', displayName: 'অষ্টম শ্রেণী (Class 8)', level: 'primary', displayOrder: 3 },
    { name: 'class_9_10', displayName: 'নবম-দশম শ্রেণী (SSC)', level: 'secondary', displayOrder: 4 }
  ];

  const insertedClasses = await db.insert(syllabusClasses).values(classData).returning();
  
  // Create class map
  const classMap: Record<string, string> = {};
  insertedClasses.forEach(c => classMap[c.name] = c.id);

  // Insert subjects (removed class 11-12 subjects)
  const subjectData = [
    // Class 6 subjects
    { classId: classMap['class_6'], name: 'math', displayName: 'গণিত (Mathematics)', code: 'MATH_6', displayOrder: 1 },
    { classId: classMap['class_6'], name: 'science', displayName: 'বিজ্ঞান অনুসন্ধানী পাঠ (Science)', code: 'SCI_6', displayOrder: 2 },
    
    // Class 7 subjects
    { classId: classMap['class_7'], name: 'math', displayName: 'গণিত (Mathematics)', code: 'MATH_7', displayOrder: 1 },
    { classId: classMap['class_7'], name: 'science', displayName: 'বিজ্ঞান অনুসন্ধানী পাঠ (Science)', code: 'SCI_7', displayOrder: 2 },
    
    // Class 8 subjects
    { classId: classMap['class_8'], name: 'math', displayName: 'গণিত (Mathematics)', code: 'MATH_8', displayOrder: 1 },
    { classId: classMap['class_8'], name: 'science', displayName: 'বিজ্ঞান (Science)', code: 'SCI_8', displayOrder: 2 },
    
    // Class 9-10 subjects
    { classId: classMap['class_9_10'], name: 'general_math', displayName: 'সাধারণ গণিত (General Math)', code: 'GMATH_910', displayOrder: 1 },
    { classId: classMap['class_9_10'], name: 'higher_math', displayName: 'উচ্চতর গণিত (Higher Math)', code: 'HMATH_910', displayOrder: 2 }
  ];

  const insertedSubjects = await db.insert(syllabusSubjects).values(subjectData).returning();

  // Create subject map
  const subjectMap: Record<string, string> = {};
  insertedSubjects.forEach(s => subjectMap[`${s.classId}_${s.name}`] = s.id);

  // Insert chapters - Complete NCTB chapters
  const chapterData = [
    // Class 6 Math - 8 chapters
    { subjectId: subjectMap[`${classMap['class_6']}_math`], title: 'Natural Numbers & Fractions', titleBn: 'স্বাভাবিক সংখ্যা ও ভগ্নাংশ', sequence: 1, topics: [] },
    { subjectId: subjectMap[`${classMap['class_6']}_math`], title: 'Ratio & Percentage', titleBn: 'অনুপাত ও শতকরা', sequence: 2, topics: [] },
    { subjectId: subjectMap[`${classMap['class_6']}_math`], title: 'Integers', titleBn: 'পূর্ণসংখ্যা', sequence: 3, topics: [] },
    { subjectId: subjectMap[`${classMap['class_6']}_math`], title: 'Algebraic Expressions', titleBn: 'বীজগণিতীয় রাশি', sequence: 4, topics: [] },
    { subjectId: subjectMap[`${classMap['class_6']}_math`], title: 'Simple Equations', titleBn: 'সরল সমীকরণ', sequence: 5, topics: [] },
    { subjectId: subjectMap[`${classMap['class_6']}_math`], title: 'Basic Concepts of Geometry', titleBn: 'জ্যামিতির মৌলিক ধারণা', sequence: 6, topics: [] },
    { subjectId: subjectMap[`${classMap['class_6']}_math`], title: 'Practical Geometry', titleBn: 'ব্যবহারিক জ্যামিতি', sequence: 7, topics: [] },
    { subjectId: subjectMap[`${classMap['class_6']}_math`], title: 'Data & Statistics', titleBn: 'তথ্য ও উপাত্ত', sequence: 8, topics: [] },
    
    // Class 6 Science - 16 chapters
    { subjectId: subjectMap[`${classMap['class_6']}_science`], title: 'Science & Technology', titleBn: 'বিজ্ঞান ও প্রযুক্তি', sequence: 1, topics: [] },
    { subjectId: subjectMap[`${classMap['class_6']}_science`], title: 'Matter & Its Properties', titleBn: 'পদার্থ ও তার বৈশিষ্ট্য', sequence: 2, topics: [] },
    { subjectId: subjectMap[`${classMap['class_6']}_science`], title: 'Introduction to Living World', titleBn: 'জীবিত বিশ্বের পরিচয়', sequence: 3, topics: [] },
    { subjectId: subjectMap[`${classMap['class_6']}_science`], title: 'Plants', titleBn: 'উদ্ভিদ', sequence: 4, topics: [] },
    { subjectId: subjectMap[`${classMap['class_6']}_science`], title: 'Animals & Microorganisms', titleBn: 'প্রাণী ও ক্ষুদ্রজীব', sequence: 5, topics: [] },
    { subjectId: subjectMap[`${classMap['class_6']}_science`], title: 'Weather & Climate', titleBn: 'আবহাওয়া ও জলবায়ু', sequence: 6, topics: [] },
    { subjectId: subjectMap[`${classMap['class_6']}_science`], title: 'Earth & Universe', titleBn: 'পৃথিবী ও মহাবিশ্ব', sequence: 7, topics: [] },
    { subjectId: subjectMap[`${classMap['class_6']}_science`], title: 'Motion, Force & Energy', titleBn: 'গতি, বল ও শক্তি', sequence: 8, topics: [] },
    { subjectId: subjectMap[`${classMap['class_6']}_science`], title: 'Rotation of Sun, Earth & Moon', titleBn: 'সূর্য, পৃথিবী ও চন্দ্রের ঘূর্ণন', sequence: 9, topics: [] },
    { subjectId: subjectMap[`${classMap['class_6']}_science`], title: 'Properties of Matter', titleBn: 'পদার্থের গুণ', sequence: 10, topics: [] },
    { subjectId: subjectMap[`${classMap['class_6']}_science`], title: 'Human Body', titleBn: 'মানবদেহ', sequence: 11, topics: [] },
    { subjectId: subjectMap[`${classMap['class_6']}_science`], title: 'Mixtures & Separation', titleBn: 'মিশ্রণ ও ভেঙে বের করা', sequence: 12, topics: [] },
    { subjectId: subjectMap[`${classMap['class_6']}_science`], title: 'Nutrition & Metabolism', titleBn: 'পুষ্টি ও বিপাক', sequence: 13, topics: [] },
    { subjectId: subjectMap[`${classMap['class_6']}_science`], title: 'Light', titleBn: 'আলো', sequence: 14, topics: [] },
    { subjectId: subjectMap[`${classMap['class_6']}_science`], title: 'Environment & Landforms', titleBn: 'পরিবেশ ও ভূ–আকৃতি', sequence: 15, topics: [] },
    { subjectId: subjectMap[`${classMap['class_6']}_science`], title: 'Interdependence of Organisms & Sustainable Environment', titleBn: 'জীবদের আন্তঃসম্পর্ক ও টেকসই পরিবেশ', sequence: 16, topics: [] },
    
    // Class 7 Math - 11 chapters
    { subjectId: subjectMap[`${classMap['class_7']}_math`], title: 'Rational & Irrational Numbers', titleBn: 'যুক্তিবাচক ও অযৌক্তিক সংখ্যা', sequence: 1, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_math`], title: 'Proportion, Profit and Loss', titleBn: 'অনুপাত, লাভ ও ক্ষতি', sequence: 2, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_math`], title: 'Measurement', titleBn: 'পরিমাপ', sequence: 3, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_math`], title: 'Multiplication & Division of Algebraic Expressions', titleBn: 'বীজগণিতীয় রাশি ও গুণ/ভাগ', sequence: 4, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_math`], title: 'Algebraic Formulae & Applications', titleBn: 'বীজগণিতীয় সূত্রাবলী ও প্রয়োগ', sequence: 5, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_math`], title: 'Algebraic Fractions', titleBn: 'বীজগণিতীয় ভগ্নাংশ', sequence: 6, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_math`], title: 'Simple Equations', titleBn: 'সরল সমীকরণ', sequence: 7, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_math`], title: 'Parallel Straight Lines', titleBn: 'সমান্তর রেখা', sequence: 8, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_math`], title: 'Triangles', titleBn: 'ত্রিভুজ', sequence: 9, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_math`], title: 'Congruence & Similarity', titleBn: 'সাম্যতা ও সমরূপতা', sequence: 10, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_math`], title: 'Information & Data', titleBn: 'তথ্য ও উপাত্ত', sequence: 11, topics: [] },
    
    // Class 7 Science - 14 chapters
    { subjectId: subjectMap[`${classMap['class_7']}_science`], title: 'Lower Organisms', titleBn: 'নিম্নজীব', sequence: 1, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_science`], title: 'Cellular Organisation of Plants and Animals', titleBn: 'উদ্ভিদ ও প্রাণীর কোষীয় সংগঠন', sequence: 2, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_science`], title: 'External Morphology of Plants', titleBn: 'উদ্ভিদের বাহ্যিক বৈশিষ্ট্য', sequence: 3, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_science`], title: 'Respiration', titleBn: 'শ্বাসক্রিয়া', sequence: 4, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_science`], title: 'Digestive System & Blood Circulation', titleBn: 'পরিপাকতন্ত্র ও রক্ত সঞ্চালন', sequence: 5, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_science`], title: 'Structure of Matter', titleBn: 'পদার্থের গঠন', sequence: 6, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_science`], title: 'Use of Energy', titleBn: 'শক্তির ব্যবহার', sequence: 7, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_science`], title: 'Sound', titleBn: 'শব্দ', sequence: 8, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_science`], title: 'Heat & Temperature', titleBn: 'তাপ ও তাপমাত্রা', sequence: 9, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_science`], title: 'Electricity & Magnetism', titleBn: 'বিদ্যুৎ ও চুম্বক', sequence: 10, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_science`], title: 'Changes Around Us & Various Phenomena', titleBn: 'পারিপার্শ্বিক পরিবর্তন ও বিভিন্ন ঘটনা', sequence: 11, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_science`], title: 'Solar System & Earth', titleBn: 'সৌরজগৎ ও আমাদের পৃথিবী', sequence: 12, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_science`], title: 'Natural Environment & Pollution', titleBn: 'প্রাকৃতিক পরিবেশ ও দূষণ', sequence: 13, topics: [] },
    { subjectId: subjectMap[`${classMap['class_7']}_science`], title: 'Climate Change', titleBn: 'জলবায়ু পরিবর্তন', sequence: 14, topics: [] },
    
    // Class 8 Math - 11 chapters
    { subjectId: subjectMap[`${classMap['class_8']}_math`], title: 'Patterns', titleBn: 'প্যাটার্ন', sequence: 1, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_math`], title: 'Profit', titleBn: 'মুনাফা', sequence: 2, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_math`], title: 'Measurement', titleBn: 'পরিমাপ', sequence: 3, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_math`], title: 'Algebraic Formulae & Applications', titleBn: 'বীজগণিতীয় সূত্রাবলী ও প্রয়োগ', sequence: 4, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_math`], title: 'Algebraic Fractions', titleBn: 'বীজগণিতীয় ভগ্নাংশ', sequence: 5, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_math`], title: 'Simple Equations', titleBn: 'সরল সমীকরণ', sequence: 6, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_math`], title: 'Set', titleBn: 'সেট', sequence: 7, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_math`], title: 'Quadrilateral', titleBn: 'চতুর্ভুজ', sequence: 8, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_math`], title: 'Pythagoras Theorem', titleBn: 'পিথাগোরাসের উপপাদ্য', sequence: 9, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_math`], title: 'Circle', titleBn: 'বৃত্ত', sequence: 10, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_math`], title: 'Information & Data', titleBn: 'তথ্য ও উপাত্ত', sequence: 11, topics: [] },
    
    // Class 8 Science - 14 chapters
    { subjectId: subjectMap[`${classMap['class_8']}_science`], title: 'Classification of Animal World', titleBn: 'প্রাণিজগতের শ্রেণিবিন্যাস', sequence: 1, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_science`], title: 'Growth and Heredity of Living Organism', titleBn: 'জীবের বৃদ্ধি ও বংশগতি', sequence: 2, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_science`], title: 'Diffusion, Osmosis and Transpiration', titleBn: 'ব্যাপন, অভিস্রবণ ও প্রস্বেদন', sequence: 3, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_science`], title: 'Reproduction in Plants', titleBn: 'উদ্ভিদের বংশ বৃদ্ধি', sequence: 4, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_science`], title: 'Coordination and Secretion', titleBn: 'সমন্বয় ও নিঃসরণ', sequence: 5, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_science`], title: 'The Structure of Atoms', titleBn: 'পরমাণুর গঠন', sequence: 6, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_science`], title: 'The Earth and Gravitation', titleBn: 'পৃথিবী ও মহাকর্ষ', sequence: 7, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_science`], title: 'Chemical Reaction', titleBn: 'রাসায়নিক বিক্রিয়া', sequence: 8, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_science`], title: 'Electric Circuits and Current Electricity', titleBn: 'বর্তনী ও চলবিদ্যুৎ', sequence: 9, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_science`], title: 'Acid, Base and Salt', titleBn: 'অম্ল, ক্ষারক ও লবণ', sequence: 10, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_science`], title: 'Light', titleBn: 'আলো', sequence: 11, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_science`], title: 'The Outer Space and Satellites', titleBn: 'মহাকাশ ও উপগ্রহ', sequence: 12, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_science`], title: 'Food and Nutrition', titleBn: 'খাদ্য ও পুষ্টি', sequence: 13, topics: [] },
    { subjectId: subjectMap[`${classMap['class_8']}_science`], title: 'Environment and Ecosystem', titleBn: 'পরিবেশ এবং বাস্তুতন্ত্র', sequence: 14, topics: [] },
    
    // Class 9-10 General Math - 16 chapters
    { subjectId: subjectMap[`${classMap['class_9_10']}_general_math`], title: 'Real Numbers', titleBn: 'বাস্তব সংখ্যা', sequence: 1, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_general_math`], title: 'Set & Function', titleBn: 'সেট ও ফাংশন', sequence: 2, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_general_math`], title: 'Algebraic Expressions', titleBn: 'বীজগাণিতিক রাশি', sequence: 3, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_general_math`], title: 'Index & Logarithm', titleBn: 'সূচক ও লগারিদম', sequence: 4, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_general_math`], title: 'Single Variable Equation', titleBn: 'একচর সমীকরণ', sequence: 5, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_general_math`], title: 'Lines, Angles & Triangles', titleBn: 'রেখা, কোণ ও ত্রিভুজ', sequence: 6, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_general_math`], title: 'Practical Geometry', titleBn: 'ব্যবহারিক জ্যামিতি', sequence: 7, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_general_math`], title: 'Trigonometric Ratios', titleBn: 'ত্রিকোণমিতিক অনুপাত', sequence: 8, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_general_math`], title: 'Distance & Height', titleBn: 'দূরত্ব ও উচ্চতা', sequence: 9, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_general_math`], title: 'Ratio & Similarity', titleBn: 'অনুপাত ও সমরূপতা', sequence: 10, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_general_math`], title: 'Simultaneous Equations', titleBn: 'সমবাহু সমীকরণ', sequence: 11, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_general_math`], title: 'Series', titleBn: 'ধারা', sequence: 12, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_general_math`], title: 'Symmetry & Reflection', titleBn: 'সমমিতি ও প্রতিসম', sequence: 13, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_general_math`], title: 'Area & Drawing', titleBn: 'ক্ষেত্রফল ও অঙ্কন', sequence: 14, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_general_math`], title: 'Mensuration', titleBn: 'মাপজোক', sequence: 15, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_general_math`], title: 'Statistics', titleBn: 'পরিসংখ্যান', sequence: 16, topics: [] },
    
    // Class 9-10 Higher Math - 17 chapters
    { subjectId: subjectMap[`${classMap['class_9_10']}_higher_math`], title: 'Set & Function', titleBn: 'সেট ও ফাংশন', sequence: 1, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_higher_math`], title: 'Algebraic Expressions', titleBn: 'বীজগাণিতিক রাশি', sequence: 2, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_higher_math`], title: 'Geometry', titleBn: 'জ্যামিতি', sequence: 3, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_higher_math`], title: 'Geometric Construction', titleBn: 'জ্যামিতিক অঙ্কন', sequence: 4, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_higher_math`], title: 'Equations', titleBn: 'সমীকরণ', sequence: 5, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_higher_math`], title: 'Inequality', titleBn: 'অসমতা', sequence: 6, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_higher_math`], title: 'Infinite Series', titleBn: 'অসীম ধারা', sequence: 7, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_higher_math`], title: 'Trigonometry', titleBn: 'ত্রিকোণমিতি', sequence: 8, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_higher_math`], title: 'Exponential & Logarithmic Functions', titleBn: 'সূচকীয় ও লগারিদমীয় ফাংশন', sequence: 9, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_higher_math`], title: 'Binomial Expansion', titleBn: 'দ্বিপদী বিস্তৃতি', sequence: 10, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_higher_math`], title: 'Coordinate Geometry', titleBn: 'স্থানাঙ্ক জ্যামিতি', sequence: 11, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_higher_math`], title: 'Plane Vectors', titleBn: 'সমতলীয় ভেক্টর', sequence: 12, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_higher_math`], title: 'Solid Geometry', titleBn: 'ঘন জ্যামিতি', sequence: 13, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_higher_math`], title: 'Probability', titleBn: 'সম্ভাবনা', sequence: 14, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_higher_math`], title: 'Higher Mathematics: Practical', titleBn: 'উচ্চতর গণিত: ব্যবহারিক', sequence: 15, topics: [] },
    { subjectId: subjectMap[`${classMap['class_9_10']}_higher_math`], title: 'Higher Mathematics: Model Test', titleBn: 'উচ্চতর গণিত: মডেল টেস্ট', sequence: 16, topics: [] },
  ];

  await db.insert(syllabusChapters).values(chapterData);

  console.log('✅ Syllabus seeded successfully');
}
