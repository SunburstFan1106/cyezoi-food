const mongoose = require('mongoose');
const Food = require('../models/Food');
const SchoolMenu = require('../models/SchoolMenu');
require('dotenv').config();

async function updateRealMenu() {
  try {
    console.log('🔗 连接数据库...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cyezoi-food');
    
    console.log('🗑️ 清除现有菜单数据...');
    // 清除现有的菜单数据
    await SchoolMenu.deleteMany({});
    
    // 菜品分类和emoji映射
    const getEmojiForDish = (dishName) => {
      const emojiMap = {
        '豆浆': '🥛', '粥': '🥣', '鸡蛋': '🥚', '肉包': '🥟', '甜大饼': '🥖', 
        '卷心菜': '🥬', '宫保肉丁面': '🍜', '榨菜肉丝': '🥬',
        '黑椒猪柳': '🍖', '本帮葱油鸡': '🐔', '番茄炒蛋': '🍅', '腐竹包菜肉片': '🥘',
        '青菜': '🥬', '黑米猫爪糕': '🍰', '番茄意大利面': '🍝', '罗宋汤': '🍲', '酸奶': '🥛',
        '红烧肉圆': '🍖', '特色炒双柳': '🥘', '酱烧鸭块': '🦆', '咖喱培根土豆': '🥔',
        '西葫芦': '🥒', '豆沙包': '🥟', '农家菜饭': '🍚', '榨菜肉丝蛋汤': '🍲', '香蕉': '🍌',
        '小馄饨': '🥟', '麻饼': '🥖', '白菜': '🥬', '炸酱面': '🍜', '素肠鸡片': '🥘',
        '红烧鸡块': '🐔', '特色风味虾': '🦐', '老北京鸡肉卷': '🌮', '胡萝卜豆芽肉丝': '🥕',
        '花卷': '🥖', '肉糜酱香炒饭': '🍚', '萝卜骨头汤': '🍲', '苹果': '🍎',
        '酱爆肉丁': '🍖', '港式盐焗鸡': '🐔', '鱼香茄子': '🍆', '黄瓜肉片': '🥒',
        '咖喱土豆': '🥔', '扬州炒饭': '🍚', '肉圆海带汤': '🍲', '香梨': '🍐',
        '赤豆卷': '🥟', '梅干菜煎包': '🥟', '生菜': '🥬', '炒酱面': '🍜', '咸菜肉丝': '🥬',
        '孜然肉片': '🍖', '水晶虾仁': '🦐', '豆豉蒸鸡块': '🐔', '香肠炒蛋': '🥚',
        '胡萝卜卷心菜': '🥕', '奶香刀切': '🥖', '上海蛋炒饭': '🍚', '虾皮紫菜汤': '🍲',
        '锅包肉': '🍖', '烤肠': '🌭', '肉糜豆腐': '🧈', '芹菜肉丝': '🥬', '冬瓜': '🥒',
        '奶黄包': '🥟', '青菜鸡丝炒面': '🍜', '鱼丸粉丝汤': '🍲',
        '生煎': '🥟', '鸡毛菜': '🥬', '蚝油牛肉面': '🍜', '素鸡': '🧈',
        '油豆腐烧肉': '🍖', '酥香鱼饼': '🐟', '烂糊肉丝': '🍖', '甜椒土豆肉片': '🫑',
        '西芹炒香干': '🥬', '四喜福糕': '🍰', '咖喱鸡肉炒饭': '🍚', '玉米排骨汤': '🍲',
        '汉堡': '🍔', '清蒸糯米肉圆': '🍖', '果仁辣酱': '🌶️', '白菜肉丝': '🥬',
        '山药': '🍠', '龟兔包': '🥟', '冬瓜虾皮汤': '🍲',
        '蛋糕': '🍰', '菜包': '🥟', '青椒肉丝面': '🍜',
        '水煮牛肉片': '🥩', '炸猪排': '🍖', '宫保鸡丁': '🐔', '西葫芦炒蛋': '🥒',
        '卡通包': '🥟', '欧式培根炒饭': '🍚', '番茄蛋汤': '🍲'
      };
      return emojiMap[dishName] || '🍽️';
    };
    
    const getDishCategory = (dishName) => {
      if (dishName.includes('汤') || dishName.includes('豆浆') || dishName.includes('酸奶')) return '饮品';
      if (dishName.includes('面') || dishName.includes('馄饨') || dishName.includes('饭')) return '面食';
      if (dishName.includes('肉') || dishName.includes('鸡') || dishName.includes('鱼') || dishName.includes('虾') || dishName.includes('牛')) return '快餐';
      if (dishName.includes('菜') || dishName.includes('豆腐') || dishName.includes('萝卜') || dishName.includes('土豆')) return '小吃';
      if (dishName.includes('粥') || dishName.includes('蛋') || dishName.includes('包') || dishName.includes('饼')) return '早餐';
      return '其他';
    };

    // 解析菜单数据
    const menuData = [
      {
        date: '2025-09-08',
        meals: {
          breakfast: ['豆浆', '粥', '鸡蛋', '肉包', '甜大饼', '卷心菜', '宫保肉丁面', '榨菜肉丝'],
          lunch: ['黑椒猪柳', '本帮葱油鸡', '番茄炒蛋', '腐竹包菜肉片', '青菜', '黑米猫爪糕', '番茄意大利面', '罗宋汤', '酸奶'],
          dinner: ['红烧肉圆', '特色炒双柳', '酱烧鸭块', '咖喱培根土豆', '西葫芦', '豆沙包', '农家菜饭', '榨菜肉丝蛋汤', '香蕉']
        }
      },
      {
        date: '2025-09-09',
        meals: {
          breakfast: ['豆浆', '粥', '鸡蛋', '小馄饨', '麻饼', '白菜', '炸酱面', '素肠鸡片'],
          lunch: ['红烧鸡块', '特色风味虾', '老北京鸡肉卷', '胡萝卜豆芽肉丝', '白菜', '花卷', '肉糜酱香炒饭', '萝卜骨头汤', '苹果'],
          dinner: ['酱爆肉丁', '港式盐焗鸡', '鱼香茄子', '黄瓜肉片', '咖喱土豆', '黑米猫爪糕', '扬州炒饭', '肉圆海带汤', '香梨']
        }
      },
      {
        date: '2025-09-10',
        meals: {
          breakfast: ['豆浆', '粥', '鸡蛋', '赤豆卷', '梅干菜煎包', '生菜', '炒酱面', '咸菜肉丝'],
          lunch: ['孜然肉片', '水晶虾仁', '豆豉蒸鸡块', '香肠炒蛋', '胡萝卜卷心菜', '奶香刀切', '上海蛋炒饭', '虾皮紫菜汤', '香梨'],
          dinner: ['锅包肉', '烤肠', '肉糜豆腐', '芹菜肉丝', '冬瓜', '奶黄包', '青菜鸡丝炒面', '鱼丸粉丝汤', '酸奶']
        }
      },
      {
        date: '2025-09-11',
        meals: {
          breakfast: ['豆浆', '粥', '鸡蛋', '生煎', '花卷', '鸡毛菜', '蚝油牛肉面', '素鸡'],
          lunch: ['油豆腐烧肉', '酥香鱼饼', '烂糊肉丝', '甜椒土豆肉片', '西芹炒香干', '四喜福糕', '咖喱鸡肉炒饭', '玉米排骨汤', '苹果'],
          dinner: ['汉堡', '清蒸糯米肉圆', '果仁辣酱', '白菜肉丝', '山药', '龟兔包', '肉糜酱香炒饭', '冬瓜虾皮汤', '香蕉']
        }
      },
      {
        date: '2025-09-12',
        meals: {
          breakfast: ['豆浆', '粥', '鸡蛋', '蛋糕', '菜包', '白菜', '青椒肉丝面', '番茄炒蛋'],
          lunch: ['水煮牛肉片', '炸猪排', '宫保鸡丁', '西葫芦炒蛋', '青菜', '卡通包', '欧式培根炒饭', '番茄蛋汤', '香梨']
        }
      }
    ];

    // 收集所有唯一的菜品名称
    const allDishes = new Set();
    menuData.forEach(day => {
      Object.values(day.meals).forEach(mealDishes => {
        mealDishes.forEach(dish => allDishes.add(dish));
      });
    });

    console.log(`🍽️ 创建 ${allDishes.size} 种菜品...`);

    // 创建菜品数据
    const foodsMap = new Map();
    let createdCount = 0;
    let existingCount = 0;

    for (const dishName of allDishes) {
      let food = await Food.findOne({ name: dishName });
      
      if (!food) {
        food = new Food({
          name: dishName,
          category: getDishCategory(dishName),
          location: '曹杨二中食堂',
          description: `曹杨二中食堂供应的${dishName}`,
          emoji: getEmojiForDish(dishName),
          averageRating: 3.5 + Math.random() * 1.5, // 3.5-5.0 随机评分
          reviewsCount: Math.floor(Math.random() * 20) + 5, // 5-25 随机评论数
          totalRating: 0,
          ratingDistribution: { 1: 0, 2: 1, 3: 2, 4: 8, 5: 5 },
          createdByName: 'system'
        });
        
        food.totalRating = Math.round(food.averageRating * food.reviewsCount);
        await food.save();
        createdCount++;
        console.log(`✅ 创建菜品: ${dishName} ${getEmojiForDish(dishName)}`);
      } else {
        existingCount++;
        console.log(`⚠️ 菜品已存在: ${dishName}`);
      }
      
      foodsMap.set(dishName, food);
    }

    console.log(`📊 菜品统计: 新增 ${createdCount} 个，已存在 ${existingCount} 个`);

    // 创建菜单数据
    console.log('📅 创建菜单数据...');
    let menuCount = 0;

    for (const dayData of menuData) {
      const date = new Date(dayData.date);
      
      for (const [mealType, dishes] of Object.entries(dayData.meals)) {
        const mealTypeMap = {
          breakfast: 'breakfast',
          lunch: 'lunch', 
          dinner: 'dinner'
        };

        const menuDishes = dishes.map(dishName => ({
          foodId: foodsMap.get(dishName)._id,
          price: getRandomPrice(dishName, mealType)
        }));

        const menu = new SchoolMenu({
          date: date,
          mealType: mealTypeMap[mealType],
          dishes: menuDishes,
          source: 'manual', // 修复：使用正确的枚举值
          sourceUrl: 'https://web-hscyez.pte.sh.cn/tzgg/20250904/a1097612c3ac4d189652a981d8fa3e6a.html',
          createdAt: new Date()
        });

        await menu.save();
        menuCount++;
        console.log(`✅ 创建菜单: ${date.toLocaleDateString()} ${mealType} (${dishes.length}道菜)`);
      }
    }

    function getRandomPrice(dishName, mealType) {
      if (mealType === 'breakfast') return 7;
      if (mealType === 'lunch') return 0;
      if (mealType === 'dinner') return 20;
      return 10;
    }

    console.log('🎉 菜单更新完成！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 更新统计:');
    console.log(`  🍽️ 菜品总数: ${allDishes.size}`);
    console.log(`  ✨ 新增菜品: ${createdCount}`);
    console.log(`  📅 菜单总数: ${menuCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 提示: 刷新浏览器页面查看最新菜单');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 更新菜单失败:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

updateRealMenu();