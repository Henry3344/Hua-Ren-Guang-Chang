#!/usr/bin/env node
/**
 * 为"Henry"账号批量发一批覆盖各子类的测试帖（AI 检索场景冒烟用）。
 *
 * 运行方式（从仓库根目录）：
 *   node scripts/seedHenryTestPosts.mjs
 *
 * 行为：
 *   · 查找 name='Henry' 的启用账号；多个时用首个，无则报错退出。
 *   · 新增若干 status=ACTIVE 的帖子，分类、子类、州/市/区均覆盖。
 *   · 标题里带 [SEED-HENRY] 前缀便于后续批量清理（见下方删除命令）。
 *   · 若本批标题已存在则跳过，脚本可重复运行不产生重复数据。
 *
 * 删除本脚本插入的全部测试帖（仅 Henry 的）：
 *   node -e "import('@prisma/client').then(async ({PrismaClient})=>{const p=new PrismaClient();const u=await p.user.findFirst({where:{name:'Henry'}});if(!u){console.log('no Henry');process.exit(0)}const r=await p.post.deleteMany({where:{userId:u.id,title:{startsWith:'[SEED-HENRY]'}}});console.log('deleted',r.count);await p.\$disconnect();})"
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TITLE_PREFIX = '[SEED-HENRY]'

/** state · city · area 组装 */
function joinLocation(state, city, area) {
  return [state, city, area].filter(Boolean).join(' · ')
}

/**
 * 帖子清单：覆盖站内所有发帖子类 + 常见口语长尾商品（VR、婴儿车、地板砖、宠物、搬家工…）。
 * 字段含义：
 *   - category    : RENT | RENT_SEEK | JOB | JOB_SEEK | SECONDHAND
 *   - subCategory : 与 HOME_SUBS 字面值严格一致
 *   - state/city/area : 与 src/lib/locationData.ts 字面值一致
 */
const POSTS = [
  // ========== SECONDHAND · 手机数码 ==========
  {
    category: 'SECONDHAND',
    subCategory: '手机数码',
    title: 'Meta Quest 3 VR一体机 出 九成新',
    description:
      '自用 Meta Quest 3 一体机 128G 出，九成新，带原装充电线和收纳包。买来玩 Beat Saber 用了没几次，盒子齐全。纽约法拉盛面交，或加 $15 可本州范围 USPS 寄送。',
    price: 380,
    itemCondition: '几乎全新',
    state: '纽约州',
    city: '皇后区',
    area: '法拉盛',
  },
  {
    category: 'SECONDHAND',
    subCategory: '手机数码',
    title: '二手 iPhone 15 Pro 256G 原色钛金属 出',
    description:
      '去年 11 月苹果官网买的 iPhone 15 Pro 256G，原色钛金属，电池健康 97%，无磕碰无维修，一直贴膜带壳。配件齐全。洛杉矶蒙特利公园可面交验机。',
    price: 720,
    itemCondition: '几乎全新',
    state: '加利福尼亚州',
    city: '洛杉矶都会区',
    area: '蒙特利公园',
  },
  {
    category: 'SECONDHAND',
    subCategory: '手机数码',
    title: 'MacBook Air M2 13寸 8+256 深空灰 便宜出',
    description:
      'MacBook Air M2 13 寸 深空灰 8G/256G，电池循环 84 次，屏幕无伤，键盘清洁过。办公、写代码、剪小视频都够用。送原装 30W 充电器。',
    price: 620,
    itemCondition: '明显使用',
    state: '新泽西州',
    city: '卑尔根县',
    area: '李堡',
  },
  {
    category: 'SECONDHAND',
    subCategory: '手机数码',
    title: '索尼 WH-1000XM5 蓝牙降噪耳机 出',
    description:
      '索尼 WH-1000XM5 黑色，2024 年购入，使用频率低，降噪效果非常好。盒子说明书齐全。适合通勤和飞机上。',
    price: 180,
    itemCondition: '几乎全新',
    state: '纽约州',
    city: '布鲁克林区',
    area: '八大道',
  },
  {
    category: 'SECONDHAND',
    subCategory: '手机数码',
    title: 'Nintendo Switch OLED + 4游戏 打包',
    description:
      'Switch OLED 白色主机 + 塞尔达王国之泪 + 马里奥赛车 8 + 健身环 + 超级马里奥派对。小孩长大不爱玩了，整包便宜出。',
    price: 260,
    itemCondition: '明显使用',
    state: '加利福尼亚州',
    city: '旧金山湾区',
    area: '库珀蒂诺',
  },
  // —— 三星 Galaxy 系列测试覆盖（老旗舰 / 中端 / 折叠屏 / 平板，价位 140-560）——
  {
    category: 'SECONDHAND',
    subCategory: '手机数码',
    title: '三星 Galaxy S22 Ultra 256G 幻影黑 出',
    description:
      'Samsung Galaxy S22 Ultra 256G，幻影黑，2022 年 BestBuy 入手，电池健康良好，屏幕无磕碰，带 S Pen。包装盒齐全，附原装充电线和 2 个磨砂壳。喜欢安卓旗舰的可以入。纽约法拉盛面交。',
    price: 380,
    itemCondition: '明显使用',
    state: '纽约州',
    city: '皇后区',
    area: '法拉盛',
  },
  {
    category: 'SECONDHAND',
    subCategory: '手机数码',
    title: '便宜出 Samsung Galaxy S23 FE 128G 薄荷绿',
    description:
      '三星 Galaxy S23 FE 128G 薄荷绿，使用半年，电池循环少，无磕碰贴膜带壳。主力换到 iPhone 了所以闲置。洛杉矶蒙市可当面验机，也可寄送。',
    price: 260,
    itemCondition: '几乎全新',
    state: '加利福尼亚州',
    city: '洛杉矶都会区',
    area: '蒙特利公园',
  },
  {
    category: 'SECONDHAND',
    subCategory: '手机数码',
    title: 'Galaxy Note 20 Ultra 5G 256G 铜色 老旗舰 便宜',
    description:
      'Samsung Galaxy Note 20 Ultra 5G 256G 神秘铜，老旗舰但系统流畅，S Pen 记笔记写字很舒服。屏幕有轻微擦痕，已贴保护膜不影响观感。便宜出给喜欢手写的朋友。',
    price: 160,
    itemCondition: '明显使用',
    state: '纽约州',
    city: '布鲁克林区',
    area: '八大道',
  },
  {
    category: 'SECONDHAND',
    subCategory: '手机数码',
    title: '三星 Galaxy A54 5G 128G 校园机 白菜价',
    description:
      'Samsung Galaxy A54 5G 128G 紫色，中端性价比款，续航好，拍照够用，适合学生/老人机。电池健康 95%，无磕碰。配件全。新泽西李堡可面交。',
    price: 140,
    itemCondition: '明显使用',
    state: '新泽西州',
    city: '卑尔根县',
    area: '李堡',
  },
  {
    category: 'SECONDHAND',
    subCategory: '手机数码',
    title: 'Samsung Galaxy Z Flip5 256G 薄荷绿 出',
    description:
      '三星 Galaxy Z Flip5 256G 薄荷绿 折叠屏，买了不到半年，带原装壳，铰链紧实，内屏无折痕。喜欢紧凑机型的可以考虑。西雅图 Bellevue 面交。',
    price: 520,
    itemCondition: '几乎全新',
    state: '华盛顿州',
    city: '西雅图都会区',
    area: '贝尔维尤',
  },
  {
    category: 'SECONDHAND',
    subCategory: '手机数码',
    title: '三星 Galaxy Tab S9+ 12.4寸 256G 平板 转让',
    description:
      'Samsung Galaxy Tab S9+ 12.4 寸 256G，带原装 S Pen 和键盘保护套。追剧记笔记画图都够用。屏幕无伤，原装包装齐全。波士顿布鲁克莱恩可当面试用。',
    price: 560,
    itemCondition: '明显使用',
    state: '马萨诸塞州',
    city: '波士顿都会区',
    area: '布鲁克莱恩',
  },

  // ========== SECONDHAND · 家具家电 ==========
  {
    category: 'SECONDHAND',
    subCategory: '家具家电',
    title: '宜家 三人布艺沙发 灰色 转让',
    description:
      '搬家急出，宜家三人位布艺沙发，浅灰色，长约 2.1m，使用一年多，无明显污渍。需要自提，有朋友可帮忙搬到电梯楼。',
    price: 120,
    itemCondition: '明显使用',
    state: '纽约州',
    city: '皇后区',
    area: '艾姆赫斯特',
  },
  {
    category: 'SECONDHAND',
    subCategory: '家具家电',
    title: '惠而浦 二手冰箱 双开门 白色 便宜出',
    description:
      'Whirlpool 双开门冰箱，使用 3 年，制冷正常无异味，搬家带不走。尺寸 H69"xW36"xD30"，需要自行找人搬运。',
    price: 150,
    itemCondition: '明显使用',
    state: '德克萨斯州',
    city: '休斯顿都会区',
    area: '糖城',
  },
  {
    category: 'SECONDHAND',
    subCategory: '家具家电',
    title: '小型洗衣机 公寓便携式 出',
    description:
      '便携式滚筒小洗衣机，适合 studio / 合租单间。约 7kg 容量，功能正常，带排水管。搬离公寓出。',
    price: 80,
    state: '华盛顿州',
    city: '西雅图都会区',
    area: '贝尔维尤',
  },

  // ========== SECONDHAND · 服装箱包 ==========
  {
    category: 'SECONDHAND',
    subCategory: '服装箱包',
    title: '新秀丽 28寸拉杆箱 行李箱 转让',
    description:
      'Samsonite 28 寸硬壳行李箱，黑色，带 TSA 锁。只用过一次国际航班，九成新，轮子顺滑。',
    price: 90,
    itemCondition: '几乎全新',
    state: '纽约州',
    city: '曼哈顿区',
    area: '华埠',
  },
  {
    category: 'SECONDHAND',
    subCategory: '服装箱包',
    title: '加拿大鹅 羽绒服 男款 L 九成新 出',
    description:
      'Canada Goose 男款 羽绒服 L 码，黑色主色，保暖性好。今年冬天穿过几次，朋友送礼多了一件。',
    price: 420,
    itemCondition: '几乎全新',
    state: '伊利诺伊州',
    city: '芝加哥都会区',
    area: '内珀维尔',
  },

  // ========== SECONDHAND · 母婴玩具 ==========
  {
    category: 'SECONDHAND',
    subCategory: '母婴玩具',
    title: 'UPPAbaby Vista V2 婴儿推车 转让',
    description:
      'UPPAbaby Vista V2 双胞胎推车，带 bassinet + 座椅 + 一个 RumbleSeat，含遮阳棚。宝宝长大了用不上。有正常使用痕迹，功能完好。',
    price: 480,
    itemCondition: '明显使用',
    state: '马萨诸塞州',
    city: '波士顿都会区',
    area: '布鲁克莱恩',
  },
  {
    category: 'SECONDHAND',
    subCategory: '母婴玩具',
    title: '乐高 Lego 城市系列 打包 出',
    description:
      'Lego City 系列 5 盒已拼成品 + 大量散件（约 3kg）。小孩上初中没兴趣了。有拼图指南电子版。',
    price: 60,
    itemCondition: '明显使用',
    state: '佐治亚州',
    city: '亚特兰大都会区',
    area: '约翰斯克里克',
  },

  // ========== SECONDHAND · 汽车配件 ==========
  {
    category: 'SECONDHAND',
    subCategory: '汽车配件',
    title: '米其林 235/55R18 四条轮胎 九成新 出',
    description:
      'Michelin Primacy 235/55R18 四条，使用一万英里，胎纹深，无补丁。换车出闲置。自提价，帮装另算。',
    price: 260,
    itemCondition: '明显使用',
    state: '内华达州',
    city: '拉斯维加斯都会区',
    area: '春之谷',
  },

  // ========== SECONDHAND · 乐器/运动 ==========
  {
    category: 'SECONDHAND',
    subCategory: '乐器/运动',
    title: 'Fender Player 电吉他 + 小音箱 打包',
    description:
      'Fender Player Stratocaster 电吉他（日落色）+ Fender Mustang LT25 音箱 + 琴包 + 调音器。学了半年不坚持，整套出。',
    price: 450,
    itemCondition: '几乎全新',
    state: '北卡罗来纳州',
    city: '罗利-达勒姆都会区',
    area: '卡瑞',
  },
  {
    category: 'SECONDHAND',
    subCategory: '乐器/运动',
    title: '小米电动滑板车 9号Pro 便宜出',
    description:
      '小米九号 Pro 电动滑板车，续航 25 英里，刹车正常，折叠方便上地铁。轮胎有正常磨损。搬家用不上。',
    price: 160,
    itemCondition: '明显使用',
    state: '加利福尼亚州',
    city: '旧金山湾区',
    area: '旧金山日落区',
  },

  // ========== SECONDHAND · 餐饮设备 ==========
  {
    category: 'SECONDHAND',
    subCategory: '餐饮设备',
    title: '奶茶店 全套设备转让 封口机+展示柜+制冰机',
    description:
      '奶茶店 执照到期不做了，整套设备低价转让：封口机、果糖机、开水机、制冰机、展示保温柜、不锈钢水槽、工作台若干。可整套打包谈。',
    price: 1800,
    itemCondition: '明显使用',
    state: '纽约州',
    city: '皇后区',
    area: '法拉盛',
  },

  // ========== SECONDHAND · 其他 ==========
  {
    category: 'SECONDHAND',
    subCategory: '其他',
    title: '地板砖 60x60 米黄色 清仓 出',
    description:
      '家里装修剩下的地板砖，60x60cm 米黄色亚光款，约 120 片，原价 $4.5/片。库房里占地方，便宜清掉。需要自提。',
    price: 180,
    state: '德克萨斯州',
    city: '达拉斯都会区',
    area: '普莱诺',
  },
  {
    category: 'SECONDHAND',
    subCategory: '其他',
    title: '小猫领养 家养蓝猫 两只',
    description:
      '家猫生了两只小蓝猫，已三个月，疫苗第一针打完。希望找有养猫经验、能坐得住的家庭。象征性收点疫苗费，不做盈利。',
    price: 50,
    state: '加利福尼亚州',
    city: '洛杉矶都会区',
    area: '阿凯迪亚',
  },
  {
    category: 'SECONDHAND',
    subCategory: '其他',
    title: '二手书 IELTS / SAT / 教辅 打包 便宜出',
    description:
      '剑桥雅思 10-17 真题 + 巴朗 SAT 阅读+数学 + 托福 TPO 纸质练习本。考完搬家不留，整包出。',
    price: 35,
    state: '华盛顿州',
    city: '西雅图都会区',
    area: '雷德蒙德',
  },

  // ========== RENT · 整租 ==========
  {
    category: 'RENT',
    subCategory: '整租',
    title: '法拉盛 一室一厅 公寓 整租 近7号线',
    description:
      '法拉盛主街一室一厅整租，电梯房，步行 5 分钟到缅街 7 号线地铁口。户型方正，家电齐全，含洗烘，物业包水电热。禁止养宠，不接 section 8。',
    price: 2100,
    rentType: '公寓',
    state: '纽约州',
    city: '皇后区',
    area: '法拉盛',
  },
  {
    category: 'RENT',
    subCategory: '整租',
    title: '尔湾 Irvine 独栋 3b2b 整租 学区佳',
    description:
      '尔湾 University Park 3 房 2 卫独栋，精装修，带后院和两车车位。University High 学区，附近 UCI 开车 8 分钟。不养宠物，一年起租。',
    price: 4800,
    rentType: '独栋',
    state: '加利福尼亚州',
    city: '洛杉矶都会区',
    area: '尔湾',
  },

  // ========== RENT · 合租 ==========
  {
    category: 'RENT',
    subCategory: '合租',
    title: '桑尼维尔 合租主卧 带独卫 女生优先',
    description:
      '桑尼维尔公寓 3b2b，出一个主卧带独立卫浴，家具齐全。室友两个，都是在附近大厂上班的女生，作息规律。步行 10 分钟到 Caltrain。',
    price: 1400,
    rentType: '公寓',
    state: '加利福尼亚州',
    city: '旧金山湾区',
    area: '桑尼维尔',
  },

  // ========== RENT · 单房/车位/商铺 ==========
  {
    category: 'RENT',
    subCategory: '单房',
    title: '八大道 单间出租 包水电网 短租可',
    description:
      '八大道 60 街附近民宅，出一间单房，家具齐全，包水电网。可短租一个月起，押一付一。夫妻学生党都可。',
    price: 900,
    state: '纽约州',
    city: '布鲁克林区',
    area: '八大道',
  },
  {
    category: 'RENT',
    subCategory: '车位',
    title: '曼哈顿华埠 室内车位出租 月租',
    description:
      '华埠 Bowery 附近 室内地下车位，24 小时安保，7 天随进随出。月租，短租长租都可谈。',
    price: 380,
    state: '纽约州',
    city: '曼哈顿区',
    area: '华埠',
  },
  {
    category: 'RENT',
    subCategory: '商铺/办公室',
    title: '法拉盛主街 临街店面 300尺 转让',
    description:
      '法拉盛主街店铺转让，300 尺，带一个小后厨，适合奶茶、甜品、小吃外卖。二房东租约两年，可续。顶手费另谈。',
    price: 5500,
    state: '纽约州',
    city: '皇后区',
    area: '法拉盛',
  },

  // ========== RENT_SEEK · 求租 ==========
  {
    category: 'RENT_SEEK',
    subCategory: '整租',
    title: '求租 尔湾 / 阿凯迪亚 2b1b 学区房 预算3500',
    description:
      '一家三口求租尔湾或阿凯迪亚 2b1b 公寓或联排，预算 $3500，8 月起租一年。小孩上小学，要求好学区。无宠物不抽烟。',
    price: 3500,
    rentType: '公寓',
    state: '加利福尼亚州',
    city: '洛杉矶都会区',
    area: '阿凯迪亚',
  },

  // ========== JOB · 餐饮服务 ==========
  {
    category: 'JOB',
    subCategory: '餐饮服务',
    title: '法拉盛 奶茶店 招全职店员 包吃 时薪18+小费',
    description:
      '法拉盛新开奶茶店招全职店员 2 名，有经验优先，无经验可教。时薪 $18 + 小费，每天包一餐。六天制，周休一天。中英双语优先但非必需。',
    price: 18,
    jobWorkType: '全职',
    jobTaxType: '现金',
    jobLanguage: '无要求（普通话）',
    state: '纽约州',
    city: '皇后区',
    area: '法拉盛',
  },
  {
    category: 'JOB',
    subCategory: '餐饮服务',
    title: '蒙特利公园 餐厅 招聘厨师帮厨 全职',
    description:
      '蒙市中餐馆 招聘 炒锅师傅 1 位 + 帮厨 1 位。炒锅要求 3 年以上经验，能独立出菜。帮厨包教。周薪可谈，全税/现金都可。',
    price: 1100,
    jobWorkType: '全职',
    jobTaxType: '全税',
    jobLanguage: '无要求（普通话）',
    state: '加利福尼亚州',
    city: '洛杉矶都会区',
    area: '蒙特利公园',
  },

  // ========== JOB · 办公/IT ==========
  {
    category: 'JOB',
    subCategory: '办公/IT',
    title: '招聘 会计助理 全职 法拉盛 中英双语',
    description:
      '会计事务所 招聘 会计助理 1 名，全职，有 QuickBooks / Excel 经验者优先。中英双语沟通无障碍。提供 401k 和带薪病假。',
    price: 55000,
    jobWorkType: '全职',
    jobTaxType: '全税',
    jobLanguage: '中英双语（流利）',
    state: '纽约州',
    city: '皇后区',
    area: '法拉盛',
  },

  // ========== JOB · 建筑/装修 ==========
  {
    category: 'JOB',
    subCategory: '建筑/装修',
    title: '急招 木工 / 油漆工 多个工地 日结现金',
    description:
      '长岛、皇后区多个家装工地急招熟手木工和油漆工，日结现金 $180-$250 按经验。有工具优先，团队包午餐。',
    price: 220,
    jobWorkType: '全职',
    jobTaxType: '现金',
    jobLanguage: '无要求（普通话）',
    state: '纽约州',
    city: '长岛',
    area: '大颈',
  },

  // ========== JOB · 运输/搬家 ==========
  {
    category: 'JOB',
    subCategory: '运输/搬家',
    title: '搬家公司 招聘搬运工 / 司机 日结 体力活',
    description:
      '本地华人搬家公司 招搬运工和 box truck 司机，需要体力好、能吃苦。日结 $180 起，经验好可商议。司机须 21 岁以上，干净驾照。',
    price: 180,
    jobWorkType: '全职',
    jobTaxType: '现金',
    jobLanguage: '无要求（普通话）',
    state: '新泽西州',
    city: '密德萨克斯县',
    area: '爱迪生',
  },

  // ========== JOB · 美容美发 ==========
  {
    category: 'JOB',
    subCategory: '美容美发',
    title: '招聘 美甲师 全职/兼职 均可 桥港区',
    description:
      '桥港区美甲店 招聘美甲师，全职或兼职都可。有执照优先，没执照也可以做简单款。客源稳定小费高。',
    price: 900,
    jobWorkType: '兼职',
    jobTaxType: '现金',
    jobLanguage: '无要求（普通话）',
    state: '伊利诺伊州',
    city: '芝加哥都会区',
    area: '桥港区',
  },

  // ========== JOB_SEEK · 求职 ==========
  {
    category: 'JOB_SEEK',
    subCategory: '餐饮服务',
    title: '本人找一份餐厅服务员工作 纽约法拉盛',
    description:
      '本人 25 岁男，来美两年，有国内餐厅服务员经验两年，法拉盛附近找全职服务员工作。中英基础沟通，态度好不怕累。时薪谈。',
    price: 17,
    jobWorkType: '全职',
    jobTaxType: '现金',
    jobLanguage: '中英双语（基本）',
    jobSalaryUnit: 'HOURLY',
    state: '纽约州',
    city: '皇后区',
    area: '法拉盛',
  },
  {
    category: 'JOB_SEEK',
    subCategory: '家政',
    title: '阿姨找钟点工 / 月嫂工作 湾区',
    description:
      '阿姨 48 岁，在湾区做钟点工和月嫂 5 年，有经验能做简餐，可带娃做饭打扫。寻求长期稳定雇主，时薪或按次谈。',
    price: 30,
    jobWorkType: '兼职',
    jobTaxType: '现金',
    jobLanguage: '无要求（普通话）',
    jobSalaryUnit: 'PER_VISIT',
    state: '加利福尼亚州',
    city: '旧金山湾区',
    area: '弗里蒙特',
  },
]

async function main() {
  const henry = await prisma.user.findFirst({
    where: { name: 'Henry', isDeleted: false, isBanned: false },
    select: { id: true, name: true, email: true },
  })
  if (!henry) {
    console.error('[seed] 找不到 name="Henry" 的账号；请先注册一个叫 Henry 的账号再运行本脚本。')
    process.exit(1)
  }
  console.log(`[seed] 使用账号 ${henry.name} <${henry.email ?? 'no-email'}> (${henry.id})`)

  let created = 0
  let skipped = 0
  for (const p of POSTS) {
    const title = `${TITLE_PREFIX} ${p.title}`
    const existing = await prisma.post.findFirst({
      where: { userId: henry.id, title },
      select: { id: true },
    })
    if (existing) {
      skipped++
      continue
    }
    const location = joinLocation(p.state, p.city, p.area)
    await prisma.post.create({
      data: {
        title,
        description: p.description,
        price: typeof p.price === 'number' ? p.price : null,
        location,
        state: p.state,
        category: p.category,
        subCategory: p.subCategory ?? null,
        contact: '微信: henry_seed_demo / 短信: 917-000-0000',
        images: [],
        rentType:
          p.category === 'RENT' || p.category === 'RENT_SEEK' ? p.rentType ?? null : null,
        jobWorkType:
          p.category === 'JOB' || p.category === 'JOB_SEEK' ? p.jobWorkType ?? null : null,
        jobTaxType:
          p.category === 'JOB' || p.category === 'JOB_SEEK' ? p.jobTaxType ?? null : null,
        jobLanguage:
          p.category === 'JOB' || p.category === 'JOB_SEEK' ? p.jobLanguage ?? null : null,
        jobSalaryUnit: p.category === 'JOB_SEEK' ? p.jobSalaryUnit ?? null : null,
        itemCondition: p.category === 'SECONDHAND' ? p.itemCondition ?? null : null,
        userId: henry.id,
        status: 'ACTIVE',
      },
    })
    created++
  }

  console.log(`[seed] 完成：新建 ${created} 条，跳过 ${skipped} 条（已存在同名 SEED 帖）。`)
  console.log(`[seed] 清理命令见本文件顶部注释（按 "[SEED-HENRY]" 前缀删除）。`)
}

main()
  .catch((e) => {
    console.error('[seed] 失败：', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
