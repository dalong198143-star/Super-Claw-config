// 内部使用 - 预设用户配置
const INTERNAL_USERS = [
  { 
    id: 'user1', 
    name: '张三', 
    avatar: '👨‍💻',
    balance: 1000,
    role: 'admin' // 管理员
  },
  { 
    id: 'user2', 
    name: '李四', 
    avatar: '👩‍🎨',
    balance: 800,
    role: 'creator' // 创作者
  },
  { 
    id: 'user3', 
    name: '王五', 
    avatar: '🧑‍🔬',
    balance: 600,
    role: 'learner' // 学习者
  }
]

export default INTERNAL_USERS
