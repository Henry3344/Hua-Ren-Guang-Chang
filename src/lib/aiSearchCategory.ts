import type { Category } from '@prisma/client'
import { HOME_SUB_AI_LEXICON } from '@/lib/homeCategorySubs'

/**
 * ============================================================================
 *  业务词典（按站内发帖子类组织，便于后续"加一个子类就加一块"，不要零散补丁）
 * ----------------------------------------------------------------------------
 *  HOME_SUBS.SECONDHAND = 手机数码 | 家具家电 | 服装箱包 | 母婴玩具 | 汽车配件
 *                       | 餐饮设备 | 乐器/运动 | 其他（含书/宠物/建材/工具/园艺…）
 *  HOME_SUBS.RENT       = 整租 | 合租 | 单房 | 床位 | 车位 | 商铺/办公室 | 短租/民宿
 *  HOME_SUBS.JOB        = 餐饮服务 | 零售门店 | 美容美发 | 办公/IT | 医疗/保健
 *                       | 教育/培训 | 运输/搬家 | 建筑/装修 | 其他（保洁/保安/司机…）
 * ============================================================================
 */

// ---------- 二手：按 8 个子类穷举口语 + 英文同义词 ----------

/** 手机数码（品牌 / 型号 / 配件 / 外设 / 影音 / 游戏 / VR / 智能穿戴） */
const SH_DIGITAL =
  '手机|iphone|ipod|ipad|imac|macbook|mac\\s*mini|安卓|android|三星|samsung|galaxy|华为|huawei|荣耀|honor|小米|xiaomi|红米|oppo|vivo|一加|oneplus|pixel|谷歌|nokia|苹果|平板|tablet|电脑|笔记本|laptop|台式机?|主机|组装机|显示器|monitor|显卡|gpu|cpu|内存条|固态(?:硬盘)?|机械键盘|键盘|keyboard|鼠标|mouse|摄像头|webcam|打印机|printer|扫描仪|路由器|router|充电器|充电线|数据线|移动电源|充电宝|相机|单反|微单|dslr|镜头|lens|三脚架|闪光灯|耳机|headphones|耳塞|耳麦|airpods|beats|音响|音箱|speaker|蓝牙音箱|功放|家庭影院|电视|tv|投影仪|projector|游戏机|console|switch|ps[2345]|xbox|steamdeck|任天堂|nintendo|索尼|手柄|vr|vr头盔|vr眼镜|oculus|quest|元宇宙|智能手表|applewatch|手环|fitbit|数码|电子产品'

/** 家具家电（客厅/卧室/厨房/卫浴常见品） */
const SH_FURN_APPL =
  '沙发|沙發|loveseat|sectional|床|床垫|床架|双人床|单人床|衣柜|五斗柜|书架|书桌|书柜|餐桌|餐椅|椅子|办公椅|电脑椅|按摩椅|茶几|凳子|长凳|桌子|梳妆台|梳妆镜|镜子|鞋柜|鞋架|收纳柜|储物柜|电视柜|酒柜|家具|冰箱|fridge|冰柜|洗衣机|washer|烘干机|dryer|洗碗机|dishwasher|微波炉|microwave|烤箱|oven|空调|ac|风扇|电风扇|fan|电饭煲|电饭锅|电磁炉|电炖锅|慢炖锅|净化器|空气净化器|加湿器|除湿器|吸尘器|扫地机(?:器人)?|热水器|饮水机|咖啡机|咖啡壶|榨汁机|破壁机|料理机|豆浆机|面包机|电烤盘|电火锅|电水壶|电暖器|取暖器|油汀|暖风机|台灯|落地灯|吊灯|壁灯|地毯|床单|被子|被套|枕头|窗帘|百叶窗|床上用品|家电|家用电器'

/** 服装箱包（衣物 / 鞋帽 / 首饰 / 眼镜 / 表 / 奢侈品） */
const SH_APPAREL =
  '行李箱|拉杆箱|箱包|背包|双肩包|斜挎包|钱包|钱夹|手提包|购物袋|收纳袋|lv|gucci|chanel|coach|mk|michaelkors|prada|奢侈品|名牌包|衣服|衣物|外套|羽绒服|大衣|风衣|皮衣|毛衣|卫衣|帽衫|t恤|tshirt|衬衫|衬衣|西装|西服|裤子|牛仔裤|裙子|连衣裙|半裙|运动服|健身服|内衣|胸罩|泳衣|游泳衣|鞋|鞋子|球鞋|跑鞋|皮鞋|靴子|高跟鞋|拖鞋|凉鞋|帽子|围巾|手套|袜子|项链|手链|戒指|耳环|首饰|珠宝|太阳镜|墨镜|眼镜|手表|腕表'

/** 母婴玩具（车椅 / 喂养 / 玩乐 / 童装 / 婴儿家具） */
const SH_BABY =
  '童车|推车|stroller|婴儿车|安全座椅|carseat|奶瓶|奶粉|尿布|尿不湿|纸尿裤|diaper|玩具|儿童玩具|积木|乐高|lego|洋娃娃|毛绒玩具|玩偶|手办|模型|童装|童鞋|童袜|母婴|婴儿用品|幼儿用品|学步车|游戏垫|爬行垫|儿童桌椅|儿童床|摇篮|婴儿床|婴儿床垫|儿童自行车|儿童平衡车|儿童滑步车'

/** 汽车配件（不是卖车；二手车配件/用品） */
const SH_AUTO_PARTS =
  '汽车用品|车载|车用|轮胎|轮毂|行车记录仪|雨刷|机油|刹车片|电瓶|蓄电池|车载充电器|车载冰箱|车膜|脚垫|方向盘套|儿童汽车座椅|拖车钩|车顶架|后视镜'

/** 餐饮设备（商用厨房 / 奶茶咖啡店 / 后厨器具） */
const SH_RESTAURANT =
  '灶台|炉灶|奶茶设备|咖啡设备|餐饮设备|展示柜|保温柜|蒸柜|烤炉|油炸锅|炸锅|商用蒸柜|商用冰箱|商用烤箱|和面机|切片机|打蛋机|商用榨汁机|饮料机|冰淇淋机|绞肉机|压面机|搅拌机|不锈钢水槽|餐盘|餐具|厨具|锅具|平底锅|炒锅|蒸锅|压力锅|高压锅|电饭锅|烘焙工具|烤盘|烤模|咖啡豆机|磨豆机'

/** 乐器 & 运动器材（户外/健身/球类/滑雪/露营） */
const SH_INSTRUMENT_SPORT =
  '吉他|电吉他|贝斯|尤克里里|钢琴|电子琴|键盘乐器|小提琴|大提琴|二胡|古筝|扬琴|萨克斯|长笛|口琴|架子鼓|电子鼓|麦克风|话筒|乐器|琴弦|吉他弦|谱架|乐谱|跑步机|动感单车|椭圆机|划船机|哑铃|壶铃|杠铃|瑜伽垫|瑜伽球|拉力带|弹力带|健身器材|健身器械|自行车|单车|公路车|山地车|电动车|电动滑板车|滑板车|摩托车|电动摩托|滑板|滑雪板|滑雪服|滑雪杖|雪板|冲浪板|帐篷|睡袋|登山杖|登山包|露营装备|烧烤架|烧烤炉|bbq|篮球|足球|网球|羽毛球|羽毛球拍|网球拍|乒乓球拍|高尔夫|高尔夫球杆|钓鱼竿|鱼竿|渔具'

/**
 * 其他（书 / 工具 / 园艺 / 建材 / 宠物 / 家居杂货；覆盖"其他"子类的长尾）
 *
 * 宠物段覆盖：
 *   · 书面：宠物/宠物猫/宠物狗/幼犬/幼猫/仓鼠/龙猫/荷兰猪/兔子/金鱼/热带鱼/观赏鱼/乌龟/蜥蜴/鹦鹉/八哥
 *   · 口语：小猫/小狗/猫咪/狗狗/狗子/猫猫/喵喵/汪汪/喵星人/汪星人/兔兔
 *   · 用品：鸟笼/猫粮/狗粮/猫砂/宠物笼/宠物用品
 *   · 裸字兜底：猫/狗（为中老年口语"有人卖猫吗 / 想买只狗"保底；
 *              与"熊猫/龙猫/猫眼"等少量非宠物词的误触也不影响正确性——
 *              这类查询作为 SECONDHAND 归档同样合理）
 */
const SH_MISC =
  '书|书籍|课本|教材|画集|漫画|小说|教辅|工具|电钻|电锯|锤子|扳手|螺丝刀|工具箱|电动工具|园艺|园艺工具|草坪机|割草机|除草机|吹叶机|吹风机|雪铲|铲雪机|扫雪机|花盆|植物|多肉|绿植|花卉|盆栽|种子|树苗|建材|地板|瓷砖|地板砖|木板|木材|水管|水龙头|马桶|浴缸|花洒|淋浴头|水槽|铝合金|玻璃|栏杆|门窗|台面|橱柜|厨房橱柜|浴室柜|挂钩|挂架|灯具|灯泡|电线|开关|插座|壁纸|墙纸|涂料|宠物|宠物猫|宠物狗|小猫|小狗|猫咪|猫猫|狗狗|狗子|喵喵|汪汪|喵星人|汪星人|幼犬|幼猫|仓鼠|龙猫|荷兰猪|兔子|兔兔|金鱼|热带鱼|观赏鱼|乌龟|蜥蜴|鹦鹉|八哥|鸟笼|猫粮|狗粮|猫砂|宠物笼|宠物用品|美妆|化妆品|香水|护肤品|厨房用品|浴室用品|办公用品|猫|狗'

/**
 * 手机具体型号（让用户只说「s25 / iphone 15 pro / pixel 8 pro / redmi note 12」就能归类）。
 *
 * 覆盖：
 *   · iPhone SE / 5 / 6(s) / 7 / 8 / X/XR/XS / 11-17（含 Pro/Pro Max/Plus/Mini）
 *   · Samsung Galaxy S10-S26 / Note10-Note20 / Z Fold/Flip / A/M 低端系列 / Tab
 *   · 裸型号 s10-s26（典型"我找个 s25"场景，由 \b 约束避免误触"class25"之类）
 *   · Google Pixel 3-9（Pro / XL / a 变体）
 *   · 小米 / Redmi / Redmi K 系列 / 华为 Mate / P / Nova / OnePlus / OPPO Find / Reno / Vivo / iQOO
 */
const SH_PHONE_MODELS =
  'iphone\\s*(?:se|5s?|5c|6s?(?:\\s*plus)?|7(?:\\s*plus)?|8(?:\\s*plus)?|x[rs]?|\\b11\\b|\\b12\\b|\\b13\\b|\\b14\\b|\\b15\\b|\\b16\\b|\\b17\\b)(?:\\s*(?:pro\\s*max|pro|plus|mini|max))?|galaxy\\s*(?:s|note|a|m|z\\s*fold|z\\s*flip|fold|flip|tab)\\s*\\d{1,3}(?:\\s*(?:ultra|plus|\\+|fe|5g))?|\\bs(?:10|11|20|21|22|23|24|25|26)(?:\\s*(?:ultra|plus|\\+|fe))?\\b|\\bnote\\s*(?:10|20)(?:\\s*(?:ultra|plus|\\+))?\\b|pixel\\s*[3-9](?:\\s*(?:pro\\s*xl|pro|xl|a))?|\\bmi\\s*(?:mix\\s*)?\\d{1,2}(?:\\s*(?:pro|ultra|max|lite))?\\b|redmi\\s*(?:note\\s*)?\\d{1,3}(?:\\s*(?:pro|plus))?|\\bk\\d{2}\\b(?:\\s*(?:pro|ultra))?|mate\\s*\\d{1,2}(?:\\s*(?:pro|rs|x))?|\\bp\\d{2}\\b(?:\\s*(?:pro|plus|art))?|nova\\s*\\d{1,2}(?:\\s*pro)?|oneplus\\s*\\d{1,2}(?:\\s*(?:pro|t|r|ace))?|find\\s*x?\\d{1,3}(?:\\s*pro)?|reno\\s*\\d{1,3}(?:\\s*pro)?|iqoo\\s*\\d{1,2}'

/**
 * 电脑 / CPU / GPU / 笔记本 / 显示器 型号与品牌线。
 * 典型场景："出 MacBook Air M2 / RTX 4090 / i7-13700K / ThinkPad X1 / 2TB SSD"。
 */
const SH_COMPUTER_MODELS =
  'macbook(?:\\s*(?:air|pro))?(?:\\s*\\d{2})?|mac\\s*(?:mini|pro|studio)|imac(?:\\s*\\d{2})?|\\bm[1-4](?:\\s*(?:pro|max|ultra))?\\b|surface\\s*(?:pro|laptop|go|book|studio)\\s*\\d?|thinkpad\\s*[xtpel]\\s*\\d{1,3}|thinkbook\\s*\\d{1,2}|xps\\s*\\d{2}|alienware|latitude|inspiron|pavilion|elitebook|probook|\\bomen\\b|\\benvy\\b|\\brog\\b|zenbook|vivobook|legion|ideapad|yoga\\s*\\d{1,2}|chromebook|rtx\\s*\\d{3,4}(?:\\s*(?:ti|super))?|gtx\\s*\\d{3,4}(?:\\s*ti)?|\\brx\\s*\\d{3,4}(?:\\s*xt)?\\b|i[3579][\\s-]?\\d{4,5}[hkfusx]?|ryzen\\s*[3579](?:\\s*\\d{4}[xhg]?)?|\\br[3579]\\s*\\d{4}[xhg]?\\b|ddr[345]|\\bnvme\\b|\\bm\\.?2\\b|\\d(?:tb|t)\\s*ssd|\\d{3,4}(?:gb|g)\\s*ssd|\\bssd\\b|\\bhdd\\b|主板|motherboard|电源|power\\s*supply|机箱|机械革命|华硕|asus|惠普|hp笔记本|联想|lenovo|戴尔|dell|宏碁|acer|微星|msi|雷蛇|razer|外星人|神舟|雷神|华为笔记本|matebook'

/** 游戏机 / 掌机 / VR / 游戏配件 具体型号 */
const SH_GAMING_VR_MODELS =
  'switch\\s*(?:oled|lite|2)|\\bns2\\b|playstation\\s*[2-5]|\\bps\\s*vr\\s*2?\\b|dualsense|dualshock|xbox\\s*(?:series\\s*[xs]|one|360|elite)|\\b3ds\\b|new\\s*3ds|gameboy|\\bgba\\b|\\bnds\\b|quest\\s*[23](?:\\s*(?:s|pro))?|pico\\s*[34]|vision\\s*pro|valve\\s*index|htc\\s*vive|steam\\s*deck|rog\\s*ally|ayaneo|elite\\s*手柄|竞技版手柄|北通手柄|8bitdo'

/** 影音 / 耳机 / 音响 / 相机 / 无人机 品牌与型号 */
const SH_AV_MODELS =
  'airpods(?:\\s*(?:pro|max|\\d))?|beats(?:\\s*(?:studio|solo|fit|pro|x))?|\\bwh-?\\d{4}(?:xm\\d)?\\b|\\bwf-?\\d{4}\\b|quietcomfort|\\bqc\\s*\\d{1,2}\\b|soundlink|\\bbose\\b|sennheiser|森海塞尔|\\bakg\\b|audio[-\\s]?technica|铁三角|\\bjbl\\b|harman\\s*kardon|哈曼卡顿|marshall|马歇尔|sonos|yamaha|denon|天龙|onkyo|安桥|canon\\s*eos|\\beos\\s*r\\d\\b|\\beos\\s*\\d+d\\b|sony\\s*a\\d+|\\ba7\\s*(?:iii|iv|v|r|s|c)?\\b|\\balpha\\s*\\d+\\b|nikon\\s*z\\s*\\d|nikon\\s*d\\d+|\\bd\\d{3,4}\\b|\\bz\\s*[5-9]\\b|fuji(?:film)?\\s*x[-\\s]?(?:t|s|h|pro|e)\\s*\\d?|\\bx-?t\\d\\b|\\bx-?s\\d\\b|\\bx-?h\\d\\b|gopro(?:\\s*hero\\s*\\d+)?|hero\\s*\\d{1,2}|\\bdji\\b|mavic|osmo\\s*(?:pocket|action|mobile)?|insta360|大疆|御|灵眸|徕卡|leica|哈苏|hasselblad|\\btamron\\b|腾龙|sigma|适马|\\bvoigtlander\\b'

/** 家用 / 家电 品牌线：Dyson / Roborock / InstantPot / Vitamix / 美的 / 格力…… */
const SH_HOME_BRANDS =
  '\\bdyson\\b|戴森|roborock|石头扫地|\\birobot\\b|roomba|brava|shark\\s*vacuum|bissell|\\beufy\\b|ecovacs|科沃斯|云鲸|追觅|dreame|instant\\s*pot|instantpot|vitamix|\\bninja\\b|blendtec|breville|kitchenaid|cuisinart|nespresso|keurig|hamilton\\s*beach|krups|delonghi|德龙|philips|飞利浦|braun|博朗|tefal|特福|panasonic|松下|midea|美的|\\bgree\\b|格力|haier|海尔|bosch|博世|siemens|西门子|whirlpool|惠而浦|\\bge\\s*appliance|lg\\s*(?:电视|冰箱|洗衣|空调)|samsung\\s*(?:电视|冰箱|洗衣|空调)|toshiba|东芝|hitachi|日立|sharp|夏普|honeywell|霍尼韦尔|米家|mijia|九阳|joyoung|苏泊尔|supor|方太|老板电器|华帝|vatti|\\btcl\\b|海信|hisense|创维|skyworth|康佳|konka'

/**
 * 五金 / 紧固件 / 装修工具：覆盖「只说 M8 螺丝 / 自攻钉 / 角磨机 片」等场景。
 *
 * 设计要点：
 *   · 公制螺丝规格 m2-m16 用 \\b 限界（只匹配独立 token，避免误触 i7-12700m 之类）。
 *   · 手动/电动工具分两段，包含华人装修师傅常用国产品牌与规格。
 */
const SH_HARDWARE =
  '五金|紧固件|螺丝|螺栓|螺母|螺钉|螺帽|螺杆|螺纹|垫片|垫圈|铆钉|钉子|钢钉|木钉|水泥钉|自攻螺丝|自攻钉|木螺丝|机械螺丝|膨胀螺丝|膨胀管|膨胀螺栓|膨胀钉|内六角(?:螺丝)?|外六角(?:螺丝)?|平头螺丝|十字螺丝|沉头螺丝|盘头螺丝|法兰螺丝|地脚螺丝|\\bm[2-9]\\b|\\bm1[0-6]\\b|合页|铰链|锁具|门锁|挂锁|锯片|切割片|钻头|丝锥|扭力扳手|棘轮扳手|活动扳手|电锤|冲击钻|角磨机|切割机|砂光机|抛光机|曲线锯|圆锯|台锯|空压机|气钉枪|钉枪|铆钉枪|胶枪|热熔胶枪|水平仪|卷尺|直尺|游标卡尺|千分尺|万用表|示波器|电烙铁|焊锡|焊锡丝|万能胶|502胶|玻璃胶|硅胶|密封胶|胶带|绝缘胶带|美纹纸胶|梯子|折叠梯|伸缩梯|人字梯|工作台|台钳|\\bg\\s*夹\\b|\\bc\\s*夹\\b|夹具|博世电动|dewalt|milwaukee|makita|牧田|stanley|史丹利|ryobi|ridgid|porter[-\\s]?cable|skilsaw|black[-\\s]?&[-\\s]?decker|craftsman'

/** 汽车品牌 & 常见车型（用于 SH_AUTO_PARTS 周边：带品牌的配件/用品挂牌） */
const SH_CAR_BRANDS_MODELS =
  '丰田|toyota|本田|honda|日产|nissan|马自达|mazda|三菱|mitsubishi|雷克萨斯|lexus|英菲尼迪|infiniti|讴歌|acura|斯巴鲁|subaru|大众|volkswagen|\\bvw\\b|奥迪|\\baudi\\b|宝马|\\bbmw\\b|奔驰|benz|mercedes|保时捷|porsche|特斯拉|tesla|福特|\\bford\\b|雪佛兰|chevrolet|\\bchevy\\b|别克|buick|凯迪拉克|cadillac|\\bgmc\\b|\\bjeep\\b|道奇|dodge|克莱斯勒|chrysler|现代|hyundai|起亚|\\bkia\\b|沃尔沃|volvo|捷豹|jaguar|路虎|land\\s*rover|法拉利|ferrari|兰博基尼|lamborghini|玛莎拉蒂|maserati|比亚迪|\\bbyd\\b|蔚来|小鹏|xpeng|理想汽车|camry|corolla|\\bprius\\b|\\brav4\\b|highlander|sienna|tacoma|tundra|\\bcivic\\b|accord|\\bcr-?v\\b|\\bhr-?v\\b|\\bpilot\\b|odyssey|ridgeline|model\\s*[3syx]|cybertruck|\\bf-?150\\b|\\bf-?250\\b|silverado|suburban|tahoe|equinox|mustang|camaro|wrangler|cherokee|grand\\s*cherokee|\\bram\\s*1500\\b'

/**
 * 二手可交易物品总词表：覆盖 HOME_SUBS.SECONDHAND 全部 8 个子类。
 * 扩充原则：**只加"物品名词"**，不把"买/卖/便宜"这类情态词放进来（它们归 BUY_VERB/SELL_VERB）。
 */
const SECONDHAND_ITEM_LEXICON = new RegExp(
  [
    SH_DIGITAL,
    SH_PHONE_MODELS,
    SH_COMPUTER_MODELS,
    SH_GAMING_VR_MODELS,
    SH_AV_MODELS,
    SH_FURN_APPL,
    SH_HOME_BRANDS,
    SH_APPAREL,
    SH_BABY,
    SH_AUTO_PARTS,
    SH_CAR_BRANDS_MODELS,
    SH_RESTAURANT,
    SH_INSTRUMENT_SPORT,
    SH_MISC,
    SH_HARDWARE,
  ].join('|'),
  'i',
)

/** 同样一份词典但带 `g` 标记——用于 `extractSecondhandItemMatches` 穷举所有命中词 */
const SECONDHAND_ITEM_LEXICON_GLOBAL = new RegExp(
  [
    SH_DIGITAL,
    SH_PHONE_MODELS,
    SH_COMPUTER_MODELS,
    SH_GAMING_VR_MODELS,
    SH_AV_MODELS,
    SH_FURN_APPL,
    SH_HOME_BRANDS,
    SH_APPAREL,
    SH_BABY,
    SH_AUTO_PARTS,
    SH_CAR_BRANDS_MODELS,
    SH_RESTAURANT,
    SH_INSTRUMENT_SPORT,
    SH_MISC,
    SH_HARDWARE,
  ].join('|'),
  'gi',
)

/**
 * 从查询文本里穷举所有"二手物品词"。用于 Groq 没抽到 item 时做启发式兜底：
 * 把命中词拼成 `requiredAnyOf`，避免弱轨把整个 SECONDHAND 大池拖进来
 * （典型坑：用户问「闲置的 vr」却返回"奶茶店 全套设备转让"——转让也是弱轨 seed）。
 *
 * 返回小写 + 去重 + 按首字母/长度截断到 8 个以内（与 retrievePostsForAiQuery 的 slice 上限一致）。
 */
export function extractSecondhandItemMatches(text: string): string[] {
  const t = (text || '').trim()
  if (!t) return []
  const seen = new Set<string>()
  for (const m of t.matchAll(SECONDHAND_ITEM_LEXICON_GLOBAL)) {
    const w = (m[0] || '').trim().toLowerCase()
    if (w) seen.add(w)
  }
  return [...seen].slice(0, 8)
}

/**
 * 「整车交易」意图识别——用于在 AI 搜索链路尽早短路：
 * 站内二手板块目前只收录"汽车配件/汽车用品"，不做整车买卖。
 * 若用户在找"二手车/买车/卖车/辆车"，弱兜底会退化成"任何含『车』子串"
 * （马里奥赛车、滑板车、推车、车载充电器等全部被拉进来），用户体验很差。
 *
 * 正则严格：
 *  - 必含明确整车信号（二手车 / 买车 / 卖车 / 新车 / 旧车 / 老车 / 整车 / N 辆车 / 轿车 / SUV / 越野车 / 皮卡 / 面包车 / 卡车 / 跑车 ...）
 *  - 又不得命中配件/服务/代步车/儿童车/赛车等排除词（见 NEG 列表）
 *  - 再排除品牌词当作 whole-car 的情况——用户若带了品牌（如"二手丰田"）也视为整车，仍短路
 */
const WHOLE_CAR_POS =
  /二手车(?!位|库|载)|买车(?!位|库)|卖车(?!位|库)|出车(?!位|库)|收车(?!费)|新车|旧车|老车|整车|卖辆|出整车|整车出|[一两三四五六七八九十]\s*辆\s*车|轿车|越野车|皮卡|面包车|卡车(?!司机)|跑车|suv/i
const WHOLE_CAR_NEG =
  /停车|车位|车库|parking|代驾|网约车|打车|租车|借车|车载|车用|汽车用品|汽车配件|车配件|配件|用品|轮胎|轮毂|机油|雨刷|雨刮|刹车|电瓶|蓄电池|车膜|脚垫|方向盘|行车记录仪|滑板车|自行车|单车|电动车|电动滑板车|摩托车|电瓶车|三轮车|平衡车|婴儿车|推车|童车|学步车|安全座椅|赛车|司机|卡车司机|招聘|求职|工作/i

/**
 * 若判定为「整车买卖」意图则返回 true。route 侧应短路到一条带"本站无整车交易 + 跳去汽车配件"的引导。
 */
export function detectWholeCarSaleIntent(text: string): boolean {
  const t = (text || '').trim()
  if (!t) return false
  if (WHOLE_CAR_NEG.test(t)) return false
  return WHOLE_CAR_POS.test(t)
}

// ---------- 买卖 / 找物 口语动词 ----------

/**
 * 口语「买/购」意图（覆盖中老年口头禅：买个/买点/买一/买下/拿下/看上/收一个/想入手）。
 * 注：使用时需搭配 SECONDHAND_ITEM_LEXICON 上下文，避免误伤"买房/买车位"等 RENT 语义。
 */
const BUY_VERB =
  /(?:买|购|购买|想买|要买|打算买|准备买|求购|想收|收一?个?|收二?手|想入手|要入手|入手|拿下|买一|买个|买点|买些|买了|看上|看中|瞧上|有人.{0,2}卖|有没有.{0,2}卖|谁.{0,2}卖|谁家.{0,2}卖)/

/**
 * 口语「卖/出/转让」意图（排除"转让店铺/铺面/生意/租约"等商业转让语义）。
 * 注：包含「有人出 / 谁出 / 有没有出」等问句式，覆盖"有人出 macbook 吗"这种中老年口头提问。
 */
const SELL_VERB =
  /(?:卖|卖掉|卖出|卖给|出售|低价出|贱卖|急出(?!租)|转让(?!租|店|铺|生意|合同|合约)|出闲置|出个|出一|出手|出点|处理掉|清仓|甩卖|甩一个|便宜出|白送|白给|急转(?!让)|整体出|打包出|打包卖|一口价出|出一套|有人.{0,2}出|有没有.{0,2}出|谁.{0,2}出|谁家.{0,2}出)/

/**
 * 口语「找/要/想要/求」意图——仅与物品词配合使用（物品词已排除"工作/房子"）。
 * 允许后跟 0-8 字的数量/修饰语，覆盖「帮我找一些儿童玩具 / 想要个大点的沙发 / 求一个二手冰箱」。
 * 还覆盖「谁家有不用的 / 家里有闲置的 / 谁家还有」这类隔辈人口吻。
 */
const FIND_VERB =
  /(?:找|要|想要|想|需要|求|帮.{0,3}找|帮.{0,3}看|哪里有|哪里能买|哪有|谁有|谁家有|谁家还有|家里有|家里还有|有没有人有|有没有|推荐|给我推荐|给点建议).{0,8}/

// ---------- 租房 / 找房 业务词（对齐 HOME_SUBS.RENT 全部 7 个子类） ----------

/** 住宅类房型 / 户型 / 居室描述（住宅主语） */
const RENT_HOUSING_TYPE =
  /整租|合租|分租|转租|月租|年租|短租|长租|日租|周租|房源|房屋出租|出租(?!车位|车库)|套房|套间|一室一厅|两室一厅|三室(?:一|两)厅|\d+室\d+厅|1b1b|2b1b|2b2b|3b2b|studio|studios|单间|单房|主卧|次卧|床位|民宿|airbnb|土库|半土库|地下室|basement|阁楼|townhouse|独立屋|独立房|独栋|公寓|apartment|condo|联排|带家具|精装|简装|房东|房客|二房东|转租|转让合约|房子|房屋|住处/i

/** 商用/车位/仓库租赁 */
const RENT_COMMERCIAL =
  /商铺|旺铺|店面|写字楼|办公室|办公空间|co-?working|仓库出租|车库出租|车位出租|招租|转店|生意转让|店铺转让|商业空间|铺面|档口出租/i

/** 求租口语动词：找房/想租/看房/求个…… */
const RENT_SEEK_VERB =
  /(?:找|求|想|要|打算|准备).{0,4}(?:租|房|住)|租(?:[一二两几]?[个间套])?(?:房|屋|单间|公寓|studio)|(?:想|要)(?:租|住)|看房|看(?:[一二两几]?个?)?房|求租|长租|短租|租个房|租间|租套|租房|想找(?:个|一个)?(?:房|单间|合租)|有(?:没有)?.{0,4}(?:单间|房间|房源|房子)(?:出租|租)?/i

// ---------- 招聘 / 求职 业务词（对齐 HOME_SUBS.JOB 全部 9 个子类） ----------

/** 雇主招人信号（薪资 / 工时 / hiring 动词） */
const JOB_HIRING_VERB =
  /招聘|急聘|诚聘|招工|招人|请人|找人|缺人|hiring|time\s*now|时薪|周薪|月薪|日薪|薪资|全职|full[-\s]?time|兼职|part[-\s]?time|带薪|实习|intern|实习岗位|试工|提供培训|包食宿|包吃住|直招|急招|周末工|日结|现金日结|临时工|临工/i

/** 9 个子类的岗位词典（雇主/求职两侧都会用） */
const JOB_ROLE_LEXICON =
  /餐厅|饭店|奶茶店|咖啡店|面馆|寿司店|烧烤店|火锅店|厨师|帮厨|学徒|二厨|头厨|点心师|面点师|寿司师傅|前台|带位|迎宾|外送员|外卖员|打包|配送员|跑堂|洗碗|洗碗工|传菜|咖啡师|吧台|服务员|超市|便利店|专柜|商场|服装店|品牌店|收银|收银员|理货|理货员|导购|营业员|仓管|美容师|美发师|美甲师|美容|美发|美甲|spa|纹身师|按摩师|理发师|剪发|洗剪吹|化妆师|发型师|文员|助理|秘书|行政|客服|会计|出纳|报税|hr|人力|招聘专员|销售|sales|市场|运营|bd|商务|工程师|程序员|开发工程师|软件工程师|it运维|网络管理|数据分析|ui设计|ux|设计师|平面设计|美工|社媒|新媒体|小红书|tiktok|视频剪辑|剪辑师|摄影师|护士|助理医师|护工|护理员|cna|hha|养老院|中医|针灸|推拿|牙助|药剂师|老师|教师|助教|家教|托管|课后托管|辅导|中文老师|英文老师|英语老师|数学老师|钢琴老师|小提琴老师|早教|幼教|教练|培训师|搬家工|卡车司机|叉车司机|货运|配送员|物流|跟车|送货员|代驾|网约车司机|滴滴司机|uber|lyft|装修工|电工|水电工|木工|焊工|瓦工|油漆工|泥水工|地板工|铺地板|贴瓷砖|家装|工地|建筑工|小工|大工|粉刷|刷漆|保洁|清洁工|钟点工|家政|阿姨|保姆|月嫂|育儿嫂|保安|司机|代购员|代办/i

/**
 * 求职者一侧（"找工作"而非"招聘"）。
 * 中间可插入行业/岗位修饰（找一份餐厅工作 / 找个装修工作 / 找一个会计工作）。
 */
const JOB_SEEK_VERB =
  /找工作|找份工作|找一份工作|找个工作|找一个工作|求职|找工|寻工|求活|找活|找份活|找活干|干活|找差事|找岗位|想求职|求一份工作|应聘|投简历|发简历|有经验|(?:想|要|求|需要|打算).{0,4}(?:工作|活|岗位|职位|差事)|找.{0,6}(?:工作|活|岗位|职位|差事)|一份工作|份工作|打工|做工|做小时工|想做兼职|想做全职/

/** 明确以求职者身份发帖的信号词（强信号，走 JOB_SEEK 单栏） */
const JOB_SEEK_SELF =
  /我要求职|发求职|求职贴|寻工帖|寻职帖|我.{0,2}求.{0,2}工作|搭伙找工|搭伙打工|找工搭子/

/**
 * 先用当前检索句推断；若无把握再用「多轮用户发言合并串」推断（承接短句追问、丢主语场景）。
 */
export function inferCategoriesWithThreadContext(
  retrievalQuery: string,
  consolidatedUserText: string,
): Category[] | undefined {
  const rq = retrievalQuery.replace(/\s+/g, ' ').trim()
  const cu = consolidatedUserText.replace(/\s+/g, ' ').trim()
  const fromR = inferCategoriesForAiQuery(rq)
  if (fromR) return fromR
  if (cu && cu !== rq) return inferCategoriesForAiQuery(cu)
  return undefined
}

/**
 * 根据当前检索句推断发帖大类；置信度高时收窄到对应 Category，避免二手与租房/招聘混搜。
 * 不确定时返回 undefined（全站五类）。
 */
export function inferCategoriesForAiQuery(text: string): Category[] | undefined {
  const t = text.replace(/\s+/g, ' ').trim()
  if (!t) return undefined

  /**
   * 商业空间（店面/写字楼/仓库/车位）优先：这些语境下"转让"是"店铺转让"不是"二手转让"，
   * 必须先于 hasSecondhandMarker 分支返回，避免被误锁 SECONDHAND。
   */
  if (RENT_COMMERCIAL.test(t)) return ['RENT', 'RENT_SEEK']

  const hasSecondhandMarker =
    /二手|闲置|出闲置|九成新|八成新|七成新|全新未拆|半新|急出(?!租)|转让(?!租|店|铺|生意)/.test(t)

  /** 车位招租/求租分属 RENT 与 RENT_SEEK，两栏同搜；排除「二手.*车位」走二手逻辑 */
  if (!hasSecondhandMarker && /车位|停车位|车库|出租车位|月租.*车位|泊车|parking/i.test(t)) {
    return ['RENT', 'RENT_SEEK']
  }

  /** 住宅类房型：两栏同搜（非二手转让语境） */
  if (!hasSecondhandMarker && RENT_HOUSING_TYPE.test(t)) {
    return ['RENT', 'RENT_SEEK']
  }

  /**
   * 口语求租动词（想租 / 找房 / 看房 / 求个单间 …）：房客想租房时同时想看到
   * 房东招租帖（RENT）和其他求租搭子帖（RENT_SEEK）。
   */
  if (!hasSecondhandMarker && RENT_SEEK_VERB.test(t)) {
    return ['RENT', 'RENT_SEEK']
  }

  let secondhand = 0
  let rent = 0
  let rentSeek = 0
  let job = 0
  let jobSeek = 0

  // ====== 二手 / 闲置物品（8 子类全覆盖）======

  if (hasSecondhandMarker) secondhand += 6
  /** 命中物品词：本站语境下即便无"二手"字样也偏二手（买个手机 / 想换个冰箱 / 要个书桌） */
  if (SECONDHAND_ITEM_LEXICON.test(t)) secondhand += 3
  /** 买/卖/找 动词 + 物品名 是强信号 */
  if (BUY_VERB.test(t) && SECONDHAND_ITEM_LEXICON.test(t)) secondhand += 6
  if (SELL_VERB.test(t) && SECONDHAND_ITEM_LEXICON.test(t)) secondhand += 6
  if (FIND_VERB.test(t) && SECONDHAND_ITEM_LEXICON.test(t)) secondhand += 4
  /** 纯买/卖动词（无具体物品）弱信号：覆盖"求购 / 收一个 / 有人出吗"短句 */
  if (BUY_VERB.test(t) || SELL_VERB.test(t)) secondhand += 2
  /** 数字 + 数码品类：价位+手机/电脑/游戏机/VR 往往是闲置交易 */
  if (
    /\d/.test(t) &&
    /手机|iphone|ipad|macbook|数码|耳机|airpods|相机|switch|ps[2345]|xbox|quest|vr|galaxy|pixel|redmi|mate|三星|华为|小米|rtx|gtx|thinkpad|surface|imac|steam\s*deck/i.test(
      t,
    )
  ) {
    secondhand += 3
  }
  /** 与首页二手子类正则 + 交易动作词联合出现时再加分 */
  if (
    HOME_SUB_AI_LEXICON.secondhand.test(t) &&
    /二手|转让|出闲置|九成新|八成新|急出|求购|卖掉|面交|卖|出\s*一|低价出|买|购|收/.test(t)
  ) {
    secondhand += 4
  }

  // ====== 租房 / 找房（7 子类全覆盖）======

  if (RENT_HOUSING_TYPE.test(t)) rent += 5
  if (RENT_COMMERCIAL.test(t)) rent += 5
  /** 口语求租意图；避开"二手"语境，物品语境下"房/租"只做弱信号 */
  if (!hasSecondhandMarker && RENT_SEEK_VERB.test(t)) rentSeek += 6
  if (/单间/.test(t) && /找|求|租/.test(t) && !hasSecondhandMarker) rentSeek += 4

  // ====== 招聘 / 求职（9 子类全覆盖）======

  /** 雇主：薪资/工时/hiring 动词 */
  if (JOB_HIRING_VERB.test(t)) job += 6
  /** 岗位词 + 招人动作 → 强招聘信号 */
  if (JOB_ROLE_LEXICON.test(t) && /招|聘|请人|缺人|急需|需要.{0,4}(?:人|员|师)|hiring/i.test(t)) job += 6
  /** 与首页招聘子类正则 + 招人动作联合出现 */
  if (HOME_SUB_AI_LEXICON.job.test(t) && /招|聘|请人|急聘|诚聘|招工|兼职|全职|薪资|时薪/.test(t)) job += 4
  /**
   * 求职者："找工作 / 找活 / 想应聘 / 找一份工作"。
   * 明确自称求职者（JOB_SEEK_SELF）时走 JOB_SEEK 单栏，并**不再重复加 JOB 分**，
   * 否则两者同时加分会压缩分差、被顶层的阈值回 undefined。
   */
  const isSelfSeek = JOB_SEEK_SELF.test(t)
  if (isSelfSeek) {
    jobSeek += 8
  } else if (JOB_SEEK_VERB.test(t)) {
    job += 6
  }

  const scores: [Category, number][] = [
    ['SECONDHAND', secondhand],
    ['RENT', rent],
    ['RENT_SEEK', rentSeek],
    ['JOB', job],
    ['JOB_SEEK', jobSeek],
  ]
  scores.sort((a, b) => b[1] - a[1])
  const [topCat, top] = scores[0]!
  const second = scores[1]![1]

  if (top < 6) return undefined
  if (top - second >= 3) return [topCat]

  /** 分差小：不强行归类，避免误伤 */
  return undefined
}

/**
 * 主句已有稳定大类（含「租房+找房」双栏）时，子轨沿用，避免改写轨漂到其它品类。
 */
export function resolveCategoryInForTrack(
  primaryLock: Category[] | undefined,
  variantText: string,
): Category[] | undefined {
  if (primaryLock && primaryLock.length >= 1) return primaryLock
  return inferCategoriesForAiQuery(variantText)
}

/* ============================================================================
 *  子类（subcategory）推断：弱兜底时按"同子类"收窄，避免泛化到整个大类
 *  ----------------------------------------------------------------------------
 *  与 HOME_SUBS 的字面值**严格对齐**；发帖时 subCategory 字段就是这些值。
 *  检索侧把 `filters.sub = <推断出的子类>` 连同 seed 一起传下去，
 *  就能只在同子类池内做"泛化关键词召回"，不会跨子类串味。
 * ========================================================================== */

export type SecondhandSub =
  | '手机数码'
  | '家具家电'
  | '服装箱包'
  | '母婴玩具'
  | '汽车配件'
  | '餐饮设备'
  | '乐器/运动'
  | '其他'

export type RentSub = '整租' | '合租' | '单房' | '床位' | '车位' | '商铺/办公室' | '短租/民宿'

export type JobSub =
  | '餐饮服务'
  | '零售门店'
  | '美容美发'
  | '办公/IT'
  | '医疗/保健'
  | '教育/培训'
  | '运输/搬家'
  | '建筑/装修'
  | '其他'

/**
 * 顺序敏感：前面的子类更"窄"或更易混淆。按此顺序扫描，首个命中者即返回。
 * 例如 `儿童床` 应命中"母婴玩具"而非"家具家电"里的"床"，故母婴玩具放前。
 */
const SH_SUB_ORDER: [SecondhandSub, RegExp][] = [
  ['母婴玩具', new RegExp(SH_BABY, 'i')],
  ['汽车配件', new RegExp(SH_AUTO_PARTS, 'i')],
  ['餐饮设备', new RegExp(SH_RESTAURANT, 'i')],
  ['手机数码', new RegExp(SH_DIGITAL, 'i')],
  ['服装箱包', new RegExp(SH_APPAREL, 'i')],
  ['乐器/运动', new RegExp(SH_INSTRUMENT_SPORT, 'i')],
  ['家具家电', new RegExp(SH_FURN_APPL, 'i')],
  ['其他', new RegExp(SH_MISC, 'i')],
]

export function inferSecondhandSub(text: string): SecondhandSub | undefined {
  const t = (text || '').replace(/\s+/g, ' ').trim()
  if (!t) return undefined
  for (const [sub, re] of SH_SUB_ORDER) {
    if (re.test(t)) return sub
  }
  return undefined
}

/** 同子类内的"泛化 seed"：仅在该子类池内做 OR 关键词召回 */
export function pickSecondhandSubWeakSeed(sub: SecondhandSub): string {
  switch (sub) {
    case '手机数码':
      return '手机 数码 平板 电脑 笔记本 耳机 相机 游戏机 显示器 投影仪 vr'
    case '家具家电':
      return '沙发 床 床垫 衣柜 书桌 餐桌 椅子 冰箱 洗衣机 空调 微波炉 电饭煲'
    case '服装箱包':
      return '行李箱 背包 羽绒服 外套 衬衫 鞋 球鞋 首饰 手表'
    case '母婴玩具':
      return '玩具 积木 童车 婴儿车 安全座椅 童装 儿童床'
    case '汽车配件':
      return '轮胎 轮毂 车载 行车记录仪 车膜'
    case '餐饮设备':
      return '灶台 商用冰箱 商用烤箱 奶茶设备 展示柜 蒸柜 冰柜'
    case '乐器/运动':
      return '吉他 钢琴 跑步机 哑铃 自行车 电动车 滑板 帐篷 羽毛球拍'
    case '其他':
      return '工具 电钻 地板 瓷砖 宠物 猫 狗 花卉 书 化妆品'
  }
}

const RENT_SUB_ORDER: [RentSub, RegExp][] = [
  ['车位', /车位|停车位|车库|parking/i],
  ['商铺/办公室', /商铺|旺铺|店面|写字楼|办公室|办公空间|co-?working|仓库出租|车库出租|档口|铺面/i],
  /** 床位先于短租：避免"床位短租"被归到民宿 */
  ['床位', /床位/i],
  ['合租', /合租|分租/i],
  ['单房', /单间|单房|主卧|次卧/i],
  ['短租/民宿', /民宿|airbnb|短租|日租|周租/i],
  [
    '整租',
    /整租|一室一厅|两室一厅|三室(?:一|两)厅|\d+室\d+厅|1b1b|2b1b|2b2b|3b2b|studio|apartment|condo|公寓|townhouse|独立屋/i,
  ],
]

export function inferRentSub(text: string): RentSub | undefined {
  const t = (text || '').replace(/\s+/g, ' ').trim()
  if (!t) return undefined
  for (const [sub, re] of RENT_SUB_ORDER) {
    if (re.test(t)) return sub
  }
  return undefined
}

/**
 * 租赁**大意图**分类（比子类更粗），用于检索时收窄帖子池：
 *   - parking     : 车位 / 停车
 *   - commercial  : 商铺 / 办公室 / 档口
 *   - short_term  : 民宿 / Airbnb / 短租 / 日租周租
 *   - residential : 其它一律视为"找房子住"（整租 / 合租 / 单房 / 床位 / 未指定子类）
 *
 * "我想找一个房子" / "想租"这种模糊查询默认 residential，
 * 这样就不会在答句里混入"车位出租"或"店面转让"。
 */
export type RentIntent = 'parking' | 'commercial' | 'short_term' | 'residential'

export function inferRentIntent(text: string): RentIntent {
  const sub = inferRentSub(text)
  if (sub === '车位') return 'parking'
  if (sub === '商铺/办公室') return 'commercial'
  if (sub === '短租/民宿') return 'short_term'
  return 'residential'
}

/**
 * 住宅意图下用于 `requiredAnyOf` 的 OR 关键词：命中任一即视为"住宅帖"。
 * 关键取舍：把几个子类的字面值（整租/合租/单房/床位）放进来——
 * 因为 `subCategory` 字段会被并入 requiredAnyOf 匹配的 blob，
 * 任何正常挂子类的住宅帖都会通过；车位/商铺/民宿帖则一律被刷掉。
 * 注意：retrievePostsForAiQuery 会对 requiredAnyOf 做上限截断，
 *       这里给的顺序就是"最该保住的"8 个。
 */
export const RENT_RESIDENTIAL_REQUIRED_ANY_OF: readonly string[] = [
  '整租',
  '合租',
  '单房',
  '床位',
  '公寓',
  'studio',
  '主卧',
  '单间',
]

/** 商铺 / 办公室意图下的 requiredAnyOf */
export const RENT_COMMERCIAL_REQUIRED_ANY_OF: readonly string[] = [
  '商铺',
  '旺铺',
  '店面',
  '写字楼',
  '办公室',
  '档口',
  '铺面',
  '商业空间',
]

/** 短租 / 民宿意图下的 requiredAnyOf */
export const RENT_SHORT_TERM_REQUIRED_ANY_OF: readonly string[] = [
  '民宿',
  'airbnb',
  '短租',
  '日租',
  '周租',
]

export function pickRentSubWeakSeed(sub: RentSub): string {
  switch (sub) {
    case '整租':
      return '整租 一室 两室 三室 studio 公寓'
    case '合租':
      return '合租 分租 主卧 次卧'
    case '单房':
      return '单间 单房 主卧 次卧'
    case '床位':
      return '床位 短租 床铺'
    case '车位':
      return '车位 停车位 车库'
    case '商铺/办公室':
      return '商铺 旺铺 店面 写字楼 办公室 档口'
    case '短租/民宿':
      return '民宿 短租 日租 周租'
  }
}

const JOB_SUB_ORDER: [JobSub, RegExp][] = [
  [
    '餐饮服务',
    /餐饮|餐厅|饭店|奶茶店|咖啡店|面馆|寿司店|烧烤店|火锅店|厨师|帮厨|学徒|二厨|头厨|点心师|寿司师傅|带位|迎宾|外送员|外卖员|跑堂|洗碗工?|传菜|咖啡师|吧台|服务员/i,
  ],
  ['零售门店', /超市|便利店|专柜|商场|服装店|品牌店|收银(?:员)?|理货(?:员)?|导购|营业员|仓管/i],
  ['美容美发', /美容师?|美发师?|美甲师?|spa|纹身师?|按摩师?|理发师?|剪发|洗剪吹|化妆师|发型师/i],
  ['医疗/保健', /护士|护工|护理员|cna|hha|养老院|中医|针灸|推拿|牙助|药剂师|医生|医院/i],
  ['教育/培训', /老师|教师|助教|家教|托管|课后托管|辅导|早教|幼教|教练|培训师/i],
  ['运输/搬家', /搬家工?|卡车司机|叉车(?:司机)?|货运|配送员|物流|跟车|送货员?|代驾|网约车司机?|滴滴司机|uber|lyft/i],
  [
    '建筑/装修',
    /装修工?|电工|水电工|木工|焊工|瓦工|油漆工|泥水工|地板工|铺地板|贴瓷砖|家装|工地|建筑工|小工|大工|粉刷|刷漆/i,
  ],
  [
    '办公/IT',
    /文员|助理|秘书|行政|客服|会计|出纳|报税|hr|人力|销售|sales|市场|运营|工程师|程序员|开发(?:工程师)?|it运维|数据分析|ui设计|设计师|平面设计|美工|社媒|新媒体|剪辑师?|摄影师/i,
  ],
  ['其他', /保洁|清洁工?|钟点工|家政|阿姨|保姆|月嫂|育儿嫂|保安|司机|代购|代办/i],
]

export function inferJobSub(text: string): JobSub | undefined {
  const t = (text || '').replace(/\s+/g, ' ').trim()
  if (!t) return undefined
  for (const [sub, re] of JOB_SUB_ORDER) {
    if (re.test(t)) return sub
  }
  return undefined
}

export function pickJobSubWeakSeed(sub: JobSub): string {
  switch (sub) {
    case '餐饮服务':
      return '餐厅 饭店 奶茶店 服务员 厨师 帮厨 外卖 配送 咖啡师 点心师'
    case '零售门店':
      return '超市 便利店 商场 收银 导购 理货 服装店'
    case '美容美发':
      return '美容 美发 美甲 按摩 理发 剪发 spa 化妆师 发型师'
    case '办公/IT':
      return '文员 助理 行政 客服 会计 销售 运营 工程师 程序员 设计师'
    case '医疗/保健':
      return '护士 护工 护理 中医 针灸 医院 养老院'
    case '教育/培训':
      return '老师 教师 助教 家教 托管 辅导 教练 培训'
    case '运输/搬家':
      return '搬家 司机 货运 物流 配送 代驾'
    case '建筑/装修':
      return '装修 电工 木工 焊工 瓦工 油漆工 工地 铺地板'
    case '其他':
      return '保洁 钟点工 家政 保姆 月嫂 保安 司机'
  }
}
