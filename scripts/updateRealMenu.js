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
        '卷心菜': '🥬', '宫保肉丁面': '🍜', '榨菜肉丝': '🥢', '黑椒猪柳': '🥩', 
        '本帮葱油鸡': '🍗', '番茄炒蛋': '🍳', '腐竹包菜肉片': '🥗', '青菜': '🥬',
        '黑米猫爪糕': '🍰', '番茄意大利面': '🍝', '罗宋汤': '🍲', '酸奶': '🥛',
        '红烧肉圆': '🍖', '特色炒双柳': '🍗', '酱烧鸭块': '🦆', '咖喱培根土豆': '🥔',
        '西葫芦': '🥒', '豆沙包': '🥟', '农家菜饭': '🍚', '榨菜肉丝蛋汤': '🍲',
        '香蕉': '🍌', '水煮牛肉片': '🥩', '炸猪排': '🍖', '宫保鸡丁': '🍗',
        '西葫芦炒蛋': '🍳', '卡通包': '🥟', '欧式培根炒饭': '🍚', '番茄蛋汤': '🍲',
        '香梨': '🍐'
      };
      return emojiMap[dishName] || '🍽️';
    };

    const getDishCategory = (dishName) => {
      if (dishName.includes('面') || dishName.includes('饭') || dishName.includes('包') || dishName.includes('糕') || dishName.includes('饼')) return '面食';
      if (dishName.includes('汤') || dishName.includes('豆浆') || dishName.includes('酸奶') || dishName.includes('粥')) return '饮品';
      if (dishName.includes('肉') || dishName.includes('鸡') || dishName.includes('鸭') || dishName.includes('猪') || dishName.includes('牛')) return '快餐';
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
          breakfast: ['豆浆', '粥', '鸡蛋', '肉包', '甜大饼', '卷心菜', '宫保肉丁面', '榨菜肉丝'],
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

    console.log(`🍽️ 找到 ${allDishes.size} 种菜品...`);

    // ✅ 修复：仅检查现有菜品，不自动创建
    const foodsMap = new Map();
    let foundCount = 0;
    let missingCount = 0;
    let missingDishes = [];

    for (const dishName of allDishes) {
      // ✅ 修复：明确查找食堂菜品
      const existingFood = await Food.findOne({ 
        name: dishName,
        $or: [
          { location: { $regex: '食堂', $options: 'i' } },
          { location: { $regex: '曹杨二中', $options: 'i' } },
          { location: { $regex: '学校', $options: 'i' } }
        ]
      });
      
      if (existingFood) {
        foodsMap.set(dishName, existingFood);
        foundCount++;
        console.log(`✅ 找到现有食堂菜品: ${dishName}`);
      } else {
        missingCount++;
        missingDishes.push(dishName);
        console.log(`⚠️ 食堂菜品不存在: ${dishName}`);
      }
    }

    console.log(`\n📊 菜品检查结果:`);
    console.log(`✅ 找到现有食堂菜品: ${foundCount} 个`);
    console.log(`⚠️ 缺失食堂菜品: ${missingCount} 个`);
    
    if (missingDishes.length > 0) {
      console.log(`\n❌ 以下食堂菜品需要在系统中手动创建:`);
      missingDishes.forEach(dish => {
        console.log(`  - ${dish} (${getDishCategory(dish)}) ${getEmojiForDish(dish)}`);
        console.log(`    建议位置: 曹杨二中食堂`);
      });
      console.log(`\n🔧 请先在系统中创建这些食堂菜品，然后重新运行此脚本。`);
      console.log(`💡 注意：位置字段必须包含"食堂"关键词，以便区分周边美食。`);
      return;
    }

    // 随机价格生成函数
    const getRandomPrice = (dishName, mealType) => {
      const basePrice = mealType === 'breakfast' ? 3 : mealType === 'lunch' ? 8 : 6;
      const variance = Math.floor(Math.random() * 5) + 1; // 1-5元浮动
      return basePrice + variance;
    };

    // 创建菜单数据
    let menuCount = 0;
    for (const dayData of menuData) {
      const date = new Date(dayData.date);
      
      for (const [mealType, dishes] of Object.entries(dayData.meals)) {
        // 仅为存在的菜品创建菜单项
        const availableDishes = dishes.filter(dishName => foodsMap.has(dishName));
        
        if (availableDishes.length === 0) {
          console.log(`⚠️ 跳过 ${date.toLocaleDateString()} ${mealType}，无可用菜品`);
          continue;
        }

        const mealTypeMap = {
          breakfast: 'breakfast',
          lunch: 'lunch', 
          dinner: 'dinner'
        };

        const menuDishes = availableDishes.map(dishName => ({
          foodId: foodsMap.get(dishName)._id,
          price: getRandomPrice(dishName, mealType)
        }));

        const menu = new SchoolMenu({
          date: date,
          mealType: mealTypeMap[mealType],
          dishes: menuDishes,
          source: 'manual',
          sourceUrl: 'https://web-hscyez.pte.sh.cn/tzgg/20250904/a1097612c3ac4d189652a981d8fa3e6a.html',
          createdAt: new Date()
        });

        await menu.save();
        menuCount++;
        console.log(`✅ 创建菜单: ${date.toLocaleDateString()} ${mealType} (${availableDishes.length}道菜)`);
      }
    }

    console.log(`\n🎉 菜单导入完成!`);
    console.log(`📊 统计信息:`);
    console.log(`  📅 创建菜单: ${menuCount} 个`);
    console.log(`  🍽️ 使用现有菜品: ${foundCount} 个`);
    
  } catch (error) {
    console.error('❌ 更新菜单失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 数据库连接已关闭');
  }
}

updateRealMenu();