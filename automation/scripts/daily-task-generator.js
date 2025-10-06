const fs = require('fs');

// 加载配置
const masterConfig = JSON.parse(fs.readFileSync('automation/config/master-config.json', 'utf8'));
const curriculum = JSON.parse(fs.readFileSync(masterConfig.paths.course_curriculum, 'utf8'));
let progress = JSON.parse(fs.readFileSync(masterConfig.paths.progress_file, 'utf8'));

function getDailyContent(dayNumber) {
  // 遍历模块找到对应天数的内容
  for (const moduleKey in curriculum.modules) {
    const module = curriculum.modules[moduleKey];
    if (dayNumber <= module.days) {
      return module.days_detail[dayNumber.toString()];
    }
  }
  return null;
}

function generateDailyTask() {
  const currentDay = masterConfig.learning.current_day;
  const today = new Date().toISOString().split('T')[0];
  
  console.log(`🎯 开始生成第 ${currentDay} 天学习任务...`);
  
  // 获取今日学习内容
  const dailyContent = getDailyContent(currentDay);
  if (!dailyContent) {
    console.log(`❌ 第 ${currentDay} 天的课程内容未配置`);
    return;
  }
  
  // 生成复习任务
  const reviewTasks = generateReviewTasks(currentDay);
  
  // 生成预习任务
  const previewTasks = generatePreviewTasks(currentDay);
  
  const dailyTask = {
    date: today,
    day_number: currentDay,
    study: dailyContent,
    review: reviewTasks,
    preview: previewTasks,
    status: 'pending'
  };
  
  // 保存每日任务
  if (!progress.daily_tasks) progress.daily_tasks = {};
  progress.daily_tasks[today] = dailyTask;
  
  // 更新进度文件
  fs.writeFileSync(masterConfig.paths.progress_file, JSON.stringify(progress, null, 2));
  
  // 生成任务摘要
  generateTaskSummary(dailyTask);
  
  console.log(`✅ 第 ${currentDay} 天学习任务生成完成！`);
}

function generateReviewTasks(currentDay) {
  const reviewIntervals = masterConfig.learning.review_intervals;
  const reviews = [];
  
  reviewIntervals.forEach(interval => {
    const reviewDay = currentDay - interval;
    if (reviewDay > 0) {
      const reviewContent = getDailyContent(reviewDay);
      if (reviewContent) {
        reviews.push({
          day: reviewDay,
          title: reviewContent.title,
          focus_questions: reviewContent.review_questions,
          interval: `${interval}天间隔复习`
        });
      }
    }
  });
  
  return reviews;
}

function generatePreviewTasks(currentDay) {
  const previewAhead = masterConfig.learning.preview_ahead_days;
  const previewDay = currentDay + previewAhead;
  const previewContent = getDailyContent(previewDay);
  
  if (!previewContent) return [];
  
  return [{
    day: previewDay,
    title: previewContent.title,
    focus_points: previewContent.preview_focus,
    underlying_principles: previewContent.underlying_principles
  }];
}

function generateTaskSummary(dailyTask) {
  const summary = `# 🎯 第 ${dailyTask.day_number} 天学习任务

## 📚 今日学习
**主题**: ${dailyTask.study.title}
**目标**: ${dailyTask.study.goals}
**交付要求**: ${dailyTask.study.deliverables}
**难度**: ${dailyTask.study.difficulty}
**视频**: [B站第${dailyTask.study.bilibili_p}节](${masterConfig.learning.bilibili_url}&p=${dailyTask.study.bilibili_p})

## 🔁 复习任务
${dailyTask.review.length > 0 ? dailyTask.review.map(review => 
  `- 第 ${review.day} 天复习: ${review.title} (${review.interval})`
).join('\n') : '今天没有复习任务'}

## 🔮 预习任务  
${dailyTask.preview.length > 0 ? dailyTask.preview.map(preview => 
  `- 第 ${preview.day} 天预习: ${preview.title}`
).join('\n') : '今天没有预习任务'}

## 💡 底层逻辑重点
${dailyTask.study.underlying_principles.map(principle => `- ${principle}`).join('\n')}

## ❓ 复习思考题
${dailyTask.study.review_questions.map(question => `- ${question}`).join('\n')}

**开始学习时间建议**: ${masterConfig.learning.daily_study_time}
`;

  // 确保daily-tasks目录存在
  if (!fs.existsSync('daily-tasks')) {
    fs.mkdirSync('daily-tasks', { recursive: true });
  }

  fs.writeFileSync(`daily-tasks/day-${dailyTask.day_number}.md`, summary);
  console.log(`📁 任务文件已保存: daily-tasks/day-${dailyTask.day_number}.md`);
}

// 运行主函数
generateDailyTask();