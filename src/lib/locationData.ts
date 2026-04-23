export const locationData = [
  {
    state: '纽约州',
    cities: [
      { city: '皇后区', areas: ['法拉盛', '贝赛', '艾姆赫斯特'] },
      { city: '布鲁克林区', areas: ['八大道', '日落公园', '本森赫斯特'] },
      { city: '曼哈顿区', areas: ['华埠'] },
      { city: '长岛', areas: ['大颈', '杰瑞科'] },
    ],
  },
  {
    state: '新泽西州',
    cities: [
      { city: '卑尔根县', areas: ['李堡', '埃奇沃特'] },
      { city: '密德萨克斯县', areas: ['爱迪生'] },
    ],
  },
  {
    state: '加利福尼亚州',
    cities: [
      { city: '洛杉矶都会区', areas: ['蒙特利公园', '阿凯迪亚', '圣马力诺', '罗兰岗', '哈岗', '尔湾', '新港滩'] },
      { city: '旧金山湾区', areas: ['库珀蒂诺', '桑尼维尔', '圣荷西', '弗里蒙特', '旧金山列治文区', '旧金山日落区'] },
    ],
  },
  {
    state: '德克萨斯州',
    cities: [
      { city: '休斯顿都会区', areas: ['糖城', '凯蒂'] },
      { city: '达拉斯都会区', areas: ['普莱诺', '弗里斯科'] },
      { city: '奥斯汀都会区', areas: ['圆石城', '域蓝'] },
    ],
  },
  {
    state: '华盛顿州',
    cities: [
      { city: '西雅图都会区', areas: ['贝尔维尤', '雷德蒙德', '柯克兰'] },
    ],
  },
  {
    state: '内华达州',
    cities: [
      { city: '拉斯维加斯都会区', areas: ['春之谷'] },
    ],
  },
  {
    state: '北卡罗来纳州',
    cities: [
      { city: '罗利-达勒姆都会区', areas: ['卡瑞'] },
    ],
  },
  {
    state: '伊利诺伊州',
    cities: [
      { city: '芝加哥都会区', areas: ['内珀维尔', '桥港区'] },
    ],
  },
  {
    state: '佐治亚州',
    cities: [
      { city: '亚特兰大都会区', areas: ['约翰斯克里克', '杜鲁斯'] },
    ],
  },
  {
    state: '马萨诸塞州',
    cities: [
      { city: '波士顿都会区', areas: ['摩顿', '昆西', '布鲁克莱恩'] },
    ],
  },
]

export type LocationData = typeof locationData
