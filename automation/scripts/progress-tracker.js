const fs = require('fs');

const masterConfig = JSON.parse(fs.readFileSync('automation/config/master-config.json', 'utf8'));
const progress = JSON.parse(fs.readFileSync(masterConfig.paths.progress_file, 'utf8'));

function generateProgressDashboard() {
  const totalDays = masterConfig.learning.total_days;
  const currentDay = masterConfig.learning.current_day;
  
  // 计算统计信息
  const completedDays = Object.values(progress.daily_tasks || {}).filter(task => task.status === 'completed').length;
  const completionRate = ((completedDays / currentDay) * 100).toFixed(1);
  
  // 生成进度条
  function generateProgressBar(percentage, length = 20) {
    const filled = Math.round(length * (percentage / 100));
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percentage}%`;
  }
  
  const dashboard = `# 📊 前端181天学习进度面板

## 总体进度
${generateProgressBar(completionRate)}

| 指标 | 数据 |
|------|------|
| 🗓️ 总天数 | ${totalDays} 天 |
| ✅ 已完成 | ${completedDays} 天 |
| 🎯 当前进度 | 第 ${currentDay} 天 |
| 📈 完成率 | ${completionRate}% |
| 🔥 连续学习 | ${progress.current_streak || 0} 天 |

## 最近任务
${getRecentTasks()}

## 📚 学习建议
1. **每天固定时间学习**：建议 ${masterConfig.learning.daily_study_time}
2. **先预习再学习**：了解明天要学的内容
3. **及时复习**：按照系统安排的复习间隔进行复习
4. **注重底层逻辑**：理解浏览器工作原理

*最后更新: ${new Date().toLocaleString('zh-CN')}* 
`;

  fs.writeFileSync('PROGRESS-DASHBOARD.md', dashboard);
  console.log('✅ 进度看板已更新: PROGRESS-DASHBOARD.md');
}

function getRecentTasks() {
  const tasks = Object.entries(progress.daily_tasks || {})
    .slice(-3)
    .map(([date, task]) => {
      const statusIcon = task.status === 'completed' ? '✅' : '🟡';
      return `- ${statusIcon} 第 ${task.day_number} 天: ${task.study.title} (${date})`;
    })
    .join('\n');
  
  return tasks || '暂无任务记录';
}

generateProgressDashboard();