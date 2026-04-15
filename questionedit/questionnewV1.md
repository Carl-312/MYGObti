## 

以下 8 个角色各占一个三维象限，坐标归一化到 [-1, 1]：

```markdown
| 角色 | 称号 | 情感表达 | 社交策略 | 自我认知 | 定位说明 |
|------|------|----------|----------|----------|----------|
| 高松灯 | 纯爱战神·沉重自闭少女 | -0.9 | -0.8 | -0.7 | 极度内敛、回避、迷茫 |
| 千早爱音 | 虚荣溜溜球·七秒记忆逃兵 | +0.3 | -0.7 | -0.4 | 表面外放、核心逃避、自我模糊 |
| 要乐奈 | 抹茶芭菲真理教主·自由野猫 | -0.2 | -0.3 | +0.8 | 情感中性、略回避、非常清醒 |
| 长崎爽世 | 精于算计的控制狂母亲 | -0.1 | +0.8 | +0.7 | 克制表达、强控制、高度清醒 |
| 椎名立希 | 正义狂犬·暴走人形炸弹 | +0.9 | +0.3 | +0.6 | 极度外放、略主动、有主张 |
| 三角初华 | 热血笨蛋·善良推土机 | +0.7 | +0.8 | -0.3 | 外放热血、强行介入、不太清醒 |
| 若叶睦 | 透明人·专业和事佬植物人 | -0.7 | +0.2 | -0.6 | 内敛、被动跟随、自我认知低 |
| 丰川祥子 *(隐藏)* | 破碎的高自尊客服小妹 | -0.4 | +0.5 | +0.9 | 压抑但有服务意识、极度清醒 |
```

<aside>
⚠️

以上坐标为初始估值，**必须找 3-5 个深度粉丝做独立标注校准**，取均值后确定最终锚点。

</aside>

{
"meta": {
"note": "为同时满足“20 题总量”和“主测覆盖 5/5/6”，Q1-Q16 为主覆盖计分题，Q20 为额外计分的反向校验题；覆盖统计按 Q1-Q16 计算。",
"axes": {
"emotionExpression": "内敛压抑(-1) ↔ 外放表达(+1)",
"socialStrategy": "回避/等待(-1) ↔ 主动介入/组织(+1)",
"selfRecognition": "迷茫/被动(-1) ↔ 清醒/有主张(+1)"
},
"hiddenRoleRule": {
"target": "丰川祥子",
"vectorGate": {
"emotionExpression": [-0.5, -0.1],
"socialStrategy": [0.3, 0.6],
"selfRecognition": [0.7, 1.0]
},
"cosineSimilarityThreshold": 0.85,
"flagBoost": "每命中 1 个辅助 flag，向祥子锚点方向额外 +0.1 boost；不再单独硬触发结果。"
},
"attentionRule": "Q19 若选择荒谬选项 C，则标记为 possibleCarelessResponse=true。",
"reverseCheckRule": "Q6 与 Q20 配对；若两题主轴选择方向一题落在 ≤ -0.7，另一题落在 ≥ +0.7，则标记 responseInconsistency=true。",
"experienceCurve": "Q1-Q5 轻冲突日常；Q6-Q11 中等冲突；Q12-Q16 深层自我拷问；Q17-Q20 用于趣味、信效度与隐藏加权。"
},
"questions": [
{
"id": "Q1",
"type": "scored",
"scene": "刚进新班，活动分组时你想加入一个看起来很默契的小组，对方说他们人数刚好。你接下来会？",
"primaryAxis": "socialStrategy",
"options": [
{
"id": "A",
"text": "先简单介绍自己，再问能否换种合作方式",
"delta": [0.1, 0.3, 0.0]
},
{
"id": "B",
"text": "先说没关系，然后自己去找别的小组",
"delta": [-0.1, -0.7, 0.0]
},
{
"id": "C",
"text": "主动提议重分任务，顺手把流程也定下来",
"delta": [0.0, 0.7, -0.1]
},
{
"id": "D",
"text": "先旁听一下气氛，再决定要不要继续争取",
"delta": [0.0, -0.3, 0.1]
}
],
"internalNotes": {
"sceneType": "日常生活",
"optionOrderIsRandomized": true
},
"changeNotes": [
"去掉“拉人被拒”的角色感台词，改成新班分组的常见场景。",
"4 个选项改为社交介入轴的四级光谱，避免对号入座。",
"每个选项都保留体面动机：试探、撤退、重组、观察都说得通。"
]
},
{
"id": "Q2",
"type": "scored",
"scene": "你把一条很在意的动态发出去后，收到了比预想更热烈的回应。你第一反应更像？",
"primaryAxis": "emotionExpression",
"options": [
{
"id": "A",
"text": "心里很高兴，但只回几个简短表情",
"delta": [-0.3, -0.1, 0.0]
},
{
"id": "B",
"text": "直接在群里分享喜悦，想让气氛再热一点",
"delta": [0.7, 0.0, -0.1]
},
{
"id": "C",
"text": "先把手机扣下，等情绪稳一点再看",
"delta": [-0.7, 0.0, 0.1]
},
{
"id": "D",
"text": "马上认真回复，把当时的开心说出来",
"delta": [0.3, 0.1, 0.0]
}
],
"internalNotes": {
"sceneType": "日常生活",
"optionOrderIsRandomized": true
},
"changeNotes": [
"把原本偏戏剧化的场景改成社交媒体日常反馈。",
"只主测情感表达轴，选项从克制查看到主动分享形成梯度。",
"弱化“高分更酷”的暗示，让含蓄回应也显得合理。"
]
},
{
"id": "Q3",
"type": "scored",
"scene": "老师让大家从三个主题里自选一个做长期项目，你对两个方向都感兴趣，但时间只够选一个。你通常会？",
"primaryAxis": "selfRecognition",
"options": [
{
"id": "A",
"text": "很快定下一个方向，也接受另一边会错过",
"delta": [-0.1, 0.0, 0.7]
},
{
"id": "B",
"text": "先缓一缓不急着选，等自己想清楚再说",
"delta": [0.1, 0.0, -0.3]
},
{
"id": "C",
"text": "先跟着熟人选，之后再慢慢找感觉",
"delta": [0.0, 0.1, -0.7]
},
{
"id": "D",
"text": "先写下最看重的标准，再按标准取舍",
"delta": [0.0, -0.1, 0.3]
}
],
"internalNotes": {
"sceneType": "泛化创作/长期项目",
"optionOrderIsRandomized": true
},
"changeNotes": [
"把“像谁的做法”改成面对选择时的自我取舍方式。",
"聚焦自我认知轴，用‘跟随—拖延—标准化—定向取舍’形成光谱。",
"保留少年人常见的犹豫与试探，不把低分端写成失败。"
]
},
{
"id": "Q4",
"type": "scored",
"scene": "小组展示前，搭档突然说自己很紧张，担心会拖累大家。你更可能怎么回应？",
"primaryAxis": "emotionExpression",
"options": [
{
"id": "A",
"text": "明确把鼓励说出来，顺便把气氛带轻松",
"delta": [0.7, -0.1, 0.0]
},
{
"id": "B",
"text": "轻声说别急，我们按原计划一点点来",
"delta": [-0.3, 0.0, 0.1]
},
{
"id": "C",
"text": "先陪她整理材料，用行动表示我在",
"delta": [-0.7, 0.1, 0.0]
},
{
"id": "D",
"text": "直接说我也会紧张，但我们能一起扛",
"delta": [0.3, 0.0, -0.1]
}
],
"internalNotes": {
"sceneType": "泛化团队合作",
"optionOrderIsRandomized": true
},
"changeNotes": [
"把鼓励搭档的行为写成真实问卷语气，不再像角色救场台词。",
"情感表达从行动支持到直接说出口逐级上升。",
"副轴扰动控制在 ±0.1，保持单轴清晰。"
]
},
{
"id": "Q5",
"type": "scored",
"scene": "周末活动临时改时间，群里消息很乱，有人没看懂安排。你通常会？",
"primaryAxis": "socialStrategy",
"options": [
{
"id": "A",
"text": "只确认和自己有关的部分，先别把话说满",
"delta": [-0.1, -0.3, 0.0]
},
{
"id": "B",
"text": "直接重新梳理安排，主动把人和时间对齐",
"delta": [0.0, 0.7, -0.1]
},
{
"id": "C",
"text": "等信息更清楚一点，再决定要不要开口",
"delta": [0.0, -0.7, 0.1]
},
{
"id": "D",
"text": "把关键信息整理一下，发给还没跟上的人",
"delta": [0.1, 0.3, 0.0]
}
],
"internalNotes": {
"sceneType": "日常生活",
"optionOrderIsRandomized": true
},
"changeNotes": [
"保留群聊混乱的轻冲突感，但改成普通学生都能代入的场景。",
"选项覆盖社交策略四档：观望、只顾自己、补充信息、主动统筹。",
"所有选项都带有“避免出错”或“帮助推进”的合理动机。"
]
},
{
"id": "Q6",
"type": "scored",
"scene": "家里希望你把精力放在更稳妥的方向上，但你最近越来越确定自己想尝试另一条路。你会怎么做？",
"primaryAxis": "selfRecognition",
"options": [
{
"id": "A",
"text": "把顾虑和想法都摊开，边谈边调整计划",
"delta": [0.1, 0.0, 0.3]
},
{
"id": "B",
"text": "先照着他们说的做，等以后再看看",
"delta": [0.0, -0.1, -0.7]
},
{
"id": "C",
"text": "定好自己的底线，再决定哪些能让步",
"delta": [0.0, 0.1, 0.7]
},
{
"id": "D",
"text": "表面先不争，私下继续摸索自己想要的",
"delta": [-0.1, 0.0, -0.3]
}
],
"internalNotes": {
"sceneType": "日常生活",
"optionOrderIsRandomized": true
},
"changeNotes": [
"将“家长期望 vs 自己想走的路”写成中等冲突的现实情境。",
"主测自我认知轴，覆盖顺从、延后、协商、设底线四档。",
"同时作为与 Q20 配对的核心题，为反向校验做基准。"
]
},
{
"id": "Q7",
"type": "scored",
"scene": "你所在的小组最近气氛有点僵，大家都默认问题存在，但没人先开口。你更可能？",
"primaryAxis": "socialStrategy",
"options": [
{
"id": "A",
"text": "直接把讨论约起来，并先给出沟通规则",
"delta": [0.0, 0.7, -0.1]
},
{
"id": "B",
"text": "私下问问关系近的人，先确认发生了什么",
"delta": [0.0, -0.3, 0.1]
},
{
"id": "C",
"text": "先把自己的部分做好，等别人愿意说再谈",
"delta": [-0.1, -0.7, 0.0]
},
{
"id": "D",
"text": "在小群里提一句，邀请大家找个时间聊聊",
"delta": [0.1, 0.3, 0.0]
}
],
"internalNotes": {
"sceneType": "泛化团队合作",
"optionOrderIsRandomized": true
},
"changeNotes": [
"把朋友群修罗场改成更泛化的团队气氛僵持。",
"主测社交策略轴，从等待到组织讨论形成明显梯度。",
"避免把低介入写成冷漠，而是解释为先稳住自己。"
]
},
{
"id": "Q8",
"type": "scored",
"scene": "你准备了很久的一次公开展示，临上场前发现关键部分出了小问题。你当下更像？",
"primaryAxis": "emotionExpression",
"options": [
{
"id": "A",
"text": "只跟最熟的人说一句，我现在有点乱",
"delta": [-0.3, -0.1, 0.0]
},
{
"id": "B",
"text": "一边讲清问题，一边主动把现场情绪稳住",
"delta": [0.7, 0.0, -0.1]
},
{
"id": "C",
"text": "先把慌张压住，尽量按原方案低调完成",
"delta": [-0.7, 0.0, 0.1]
},
{
"id": "D",
"text": "直接向大家说明状况，再继续往下做",
"delta": [0.3, 0.1, 0.0]
}
],
"internalNotes": {
"sceneType": "泛化舞台/展示",
"optionOrderIsRandomized": true
},
"changeNotes": [
"把‘舞台翻车’降到适中冲突，不再使用夸张崩溃表达。",
"情感表达轴从压住慌张到公开说明并稳场递进。",
"高分端不等于情绪化，而是更外显、可见。"
]
},
{
"id": "Q9",
"type": "scored",
"scene": "你花了很多时间准备的作品或作业，收到一条戳中痛点的评价。你更可能？",
"primaryAxis": "selfRecognition",
"options": [
{
"id": "A",
"text": "区分情绪和内容，只挑有用的部分处理",
"delta": [0.1, 0.0, 0.3]
},
{
"id": "B",
"text": "先默认对方说得对，连带怀疑整个自己",
"delta": [-0.1, 0.0, -0.7]
},
{
"id": "C",
"text": "先确认自己原本想表达什么，再决定改不改",
"delta": [0.0, 0.1, 0.7]
},
{
"id": "D",
"text": "先收起来缓一缓，过后再看要不要改",
"delta": [0.0, -0.1, -0.3]
}
],
"internalNotes": {
"sceneType": "泛化创作反馈",
"optionOrderIsRandomized": true
},
"changeNotes": [
"把恶评题重写为作品/作业反馈，更普适也更符合青年体验。",
"主测自我认知轴，从全盘怀疑到锚定表达目标递进。",
"保留‘先缓一缓’这一健康中低分选项，平衡社会魅力值。"
]
},
{
"id": "Q10",
"type": "scored",
"scene": "你发现几位熟人私下另组了一个活动群，没有叫你。你通常会怎么处理？",
"primaryAxis": "socialStrategy",
"options": [
{
"id": "A",
"text": "只去问最熟的那个人，确认是不是误会",
"delta": [0.0, -0.3, 0.1]
},
{
"id": "B",
"text": "把事情摊开聊清楚，也想知道以后怎么相处",
"delta": [0.0, 0.7, -0.1]
},
{
"id": "C",
"text": "先当作没看见，把情绪自己消化掉",
"delta": [-0.1, -0.7, 0.0]
},
{
"id": "D",
"text": "直接表达自己介意，但语气尽量保持平和",
"delta": [0.1, 0.3, 0.0]
}
],
"internalNotes": {
"sceneType": "日常生活",
"optionOrderIsRandomized": true
},
"changeNotes": [
"保留被排除的刺痛感，但避免戏剧化的公开对质设定。",
"社交策略从自我消化到摊开谈清楚逐级上升。",
"四个选项都能被理解为保护关系或保护自尊的不同方式。"
]
},
{
"id": "Q11",
"type": "scored",
"scene": "一个你很在意的人对你说：“你最近好像越来越不像你自己了。”这句话让你很在意。你会？",
"primaryAxis": "selfRecognition",
"options": [
{
"id": "A",
"text": "把这句话当提醒，但仍以自己的判断为准",
"delta": [0.0, 0.1, 0.7]
},
{
"id": "B",
"text": "先不急着回应，自己反复想一阵子再说",
"delta": [0.0, -0.1, -0.3]
},
{
"id": "C",
"text": "追问对方具体感受到什么，再回看自己",
"delta": [0.1, 0.0, 0.3]
},
{
"id": "D",
"text": "先顺着对方的话想，是不是我真的不太行",
"delta": [-0.1, 0.0, -0.7]
}
],
"internalNotes": {
"sceneType": "日常生活",
"optionOrderIsRandomized": true
},
"changeNotes": [
"把原题的外部冲突转成更深一层的自我镜像反馈。",
"继续测自我认知轴，但用‘他人提醒后如何定位自己’做切入。",
"选项措辞去标签化，不再暗示谁更成熟。"
]
},
{
"id": "Q12",
"type": "scored",
"scene": "一个你曾非常信任的人，说了一句让你意识到你们理解彼此的方式完全不同。你当下更可能？",
"primaryAxis": "emotionExpression",
"options": [
{
"id": "A",
"text": "把受伤和失望直接说出来，但尽量不指责",
"delta": [0.3, 0.1, 0.0]
},
{
"id": "B",
"text": "先沉默下来，等情绪过去后再决定要不要谈",
"delta": [-0.7, 0.0, 0.1]
},
{
"id": "C",
"text": "当场把感受讲清，也要求对方正面回应",
"delta": [0.7, 0.0, -0.1]
},
{
"id": "D",
"text": "只说一句我需要时间，然后先把距离拉开",
"delta": [-0.3, -0.1, 0.0]
}
],
"internalNotes": {
"sceneType": "泛化关系冲突",
"optionOrderIsRandomized": true
},
"changeNotes": [
"将强背叛感降成‘理解方式不一致’，更贴近真实关系裂缝。",
"情感表达从先沉默、拉开距离到当场说明形成光谱。",
"避免把外放写成攻击，把内敛写成脆弱。"
]
},
{
"id": "Q13",
"type": "scored",
"scene": "你想把一个已经散掉的合作关系重新拉回来，但对方态度很冷。你下一步更像？",
"primaryAxis": "socialStrategy",
"options": [
{
"id": "A",
"text": "只表达一次自己的想法，之后不再多推",
"delta": [0.0, -0.3, 0.0]
},
{
"id": "B",
"text": "主动把见面和沟通条件都安排好，争取一次说透",
"delta": [0.0, 0.7, -0.1]
},
{
"id": "C",
"text": "尊重对方不想继续，先把这段关系放下",
"delta": [-0.1, -0.7, 0.1]
},
{
"id": "D",
"text": "先问清对方现在想要什么，再决定怎么接近",
"delta": [0.1, 0.3, 0.0]
}
],
"internalNotes": {
"sceneType": "泛化合作修复",
"optionOrderIsRandomized": true
},
"changeNotes": [
"保留“想挽回关系”的高张力，但去掉操控感强的原型痕迹。",
"主测社交策略轴，覆盖放下、只表达一次、探询需求、主动组织。",
"高低分端都给出自我保护逻辑，减少价值导向。"
]
},
{
"id": "Q14",
"type": "scored",
"scene": "有人认真看完你的作品后，真诚地说“我很想更了解你在想什么。”你会如何回应这份靠近？",
"primaryAxis": "emotionExpression",
"options": [
{
"id": "A",
"text": "很快把想法摊开，希望对方真正听懂自己",
"delta": [0.7, 0.0, -0.1]
},
{
"id": "B",
"text": "会分享一点，但只挑自己比较能承受的部分",
"delta": [-0.3, -0.1, 0.0]
},
{
"id": "C",
"text": "先把话收住，只点头表示自己听见了",
"delta": [-0.7, 0.0, 0.1]
},
{
"id": "D",
"text": "愿意具体说出感受，也会说明自己的顾虑",
"delta": [0.3, 0.1, 0.0]
}
],
"internalNotes": {
"sceneType": "泛化创作表达",
"optionOrderIsRandomized": true
},
"changeNotes": [
"把“被理解”写成创作表达中的靠近，而非角色彩蛋。",
"情感表达从点头接住到主动摊开想法递进。",
"保留‘部分分享’这种中间选项，提升区分度。"
]
},
{
"id": "Q15",
"type": "scored",
"scene": "深夜里你突然觉得，自己努力了很久却还没有变成想成为的人。你通常会？",
"primaryAxis": "selfRecognition",
"options": [
{
"id": "A",
"text": "把情绪写下来，暂时不急着给自己结论",
"delta": [0.0, -0.1, -0.3]
},
{
"id": "B",
"text": "重新确认自己真正重视的东西，不被别人节奏带走",
"delta": [0.0, 0.1, 0.7]
},
{
"id": "C",
"text": "先陷进否定里，觉得现在做什么都不够",
"delta": [-0.1, 0.0, -0.7]
},
{
"id": "D",
"text": "先提醒自己还在路上，再想下一步要做什么",
"delta": [0.1, 0.0, 0.3]
}
],
"internalNotes": {
"sceneType": "日常生活",
"optionOrderIsRandomized": true
},
"changeNotes": [
"保留深夜比较焦虑，但改成更内在的自我评估场景。",
"主测自我认知轴，从陷入否定到确认重心逐级上升。",
"让写下来缓冲也成为合理而不失分寸的选择。"
]
},
{
"id": "Q16",
"type": "scored",
"scene": "需要用一句话介绍“你是怎样的人”，你录了很多次都不满意。最后你更可能提交？",
"primaryAxis": "selfRecognition",
"options": [
{
"id": "A",
"text": "挑几个最能代表现在自己的点，先讲清楚",
"delta": [0.1, 0.0, 0.3]
},
{
"id": "B",
"text": "借用别人常说的标签，先把作业交出去",
"delta": [0.0, -0.1, -0.7]
},
{
"id": "C",
"text": "明确说出自己的原则和取舍，即使不够讨喜",
"delta": [0.0, 0.1, 0.7]
},
{
"id": "D",
"text": "保留一点模糊，只说自己还在摸索之中",
"delta": [-0.1, 0.0, -0.3]
}
],
"internalNotes": {
"sceneType": "日常生活",
"optionOrderIsRandomized": true
},
"changeNotes": [
"把原题的人设包装感改为‘如何定义现在的自己’。",
"主测自我认知轴，覆盖借用标签、保留模糊、明确表达、坚持原则。",
"为结果页提供更稳定的高阶自我定义信息。"
]
},
{
"id": "Q17",
"type": "flag",
"scene": "如果要长期经营一个空间，你更想让它成为什么样子？",
"primaryAxis": null,
"options": [
{
"id": "A",
"text": "开一家气氛热闹、总有人来聊天的小店",
"delta": [0, 0, 0]
},
{
"id": "B",
"text": "开一家安静的店，保留很多只属于自己的角落",
"delta": [0, 0, 0]
},
{
"id": "C",
"text": "开一家规则清楚、深夜也能让人安心坐会儿的店",
"delta": [0, 0, 0]
},
{
"id": "D",
"text": "开什么都行，只要能按自己的节奏经营",
"delta": [0, 0, 0]
}
],
"internalNotes": {
"sceneType": "趣味氛围题",
"optionOrderIsRandomized": true,
"scoring": "不计入三维总分",
"hiddenBoost": {
"optionId": "C",
"target": "丰川祥子",
"amount": 0.1,
"reason": "克制的照顾欲+规则感"
}
},
"changeNotes": [
"保留趣味感，但去掉明显的角色店铺梗。",
"只保留一种对隐藏角色有辅助提升的空间偏好，不作硬触发。",
"其余选项均为中性审美或生活偏好，避免引导。"
]
},
{
"id": "Q18",
"type": "flag",
"scene": "别人夸你总替人着想时，你心里更接近哪一句？",
"primaryAxis": null,
"options": [
{
"id": "A",
"text": "被需要会让我开心，但我也希望自己的分量被看见",
"delta": [0, 0, 0]
},
{
"id": "B",
"text": "能帮就帮，不必把这件事讲得太重",
"delta": [0, 0, 0]
},
{
"id": "C",
"text": "别人怎么理解我无所谓，我先把该做的做完",
"delta": [0, 0, 0]
},
{
"id": "D",
"text": "我更在意关系是不是轻松，而不是谁付出更多",
"delta": [0, 0, 0]
}
],
"internalNotes": {
"sceneType": "趣味自我感受题",
"optionOrderIsRandomized": true,
"scoring": "不计入三维总分",
"hiddenBoost": {
"optionId": "A",
"target": "丰川祥子",
"amount": 0.1,
"reason": "愿意付出，但希望被认真看见"
}
},
"changeNotes": [
"把 flag 题写成对“付出与被看见”的态度差异。",
"祥子相关选项改为温和自述，不再是剧情式台词。",
"其余选项都成立，避免用户一眼看出答案。"
]
},
{
"id": "Q19",
"type": "attention_check",
"scene": "周末临时多出一项作业，你本来已经排了别的安排。你更可能？",
"primaryAxis": null,
"options": [
{
"id": "A",
"text": "先看看还能不能重排自己的时间安排",
"delta": [0, 0, 0]
},
{
"id": "B",
"text": "找同学确认要求，再决定怎么分配精力",
"delta": [0, 0, 0]
},
{
"id": "C",
"text": "给校长写长邮件，要求全校立刻取消作业",
"delta": [0, 0, 0]
},
{
"id": "D",
"text": "先完成最关键的部分，其余再看情况处理",
"delta": [0, 0, 0]
}
],
"internalNotes": {
"sceneType": "注意力检测",
"optionOrderIsRandomized": true,
"attentionCheck": {
"absurdOptionId": "C",
"onSelect": "possibleCarelessResponse=true"
}
},
"changeNotes": [
"新增注意力检测题，场景正常但加入一个明显荒谬选项。",
"不计分，只用于前端的‘是否随意作答’提示。",
"其余三个选项保持真实可选，避免整题过于突兀。"
]
},
{
"id": "Q20",
"type": "reverse_check",
"scene": "社团报名截止前，你发现“大家都推荐的选择”和“自己真正想投入的选择”不是同一个。你通常会？",
"primaryAxis": "selfRecognition",
"options": [
{
"id": "A",
"text": "先报大家都说稳妥的那个，免得之后后悔",
"delta": [0.0, -0.1, -0.7]
},
{
"id": "B",
"text": "先把两个选择都想一阵子，再决定报名哪个",
"delta": [-0.1, 0.0, -0.3]
},
{
"id": "C",
"text": "按自己最重视的标准选，即使和多数人不同",
"delta": [0.0, 0.1, 0.7]
},
{
"id": "D",
"text": "先问清资源和风险，再决定哪个更适合自己",
"delta": [0.1, 0.0, 0.3]
}
],
"internalNotes": {
"sceneType": "反向校验",
"optionOrderIsRandomized": true,
"pairedWith": "Q6",
"scoring": "计分，并作为反向校验"
},
"changeNotes": [
"新增与 Q6 同轴的反向校验题，场景与措辞完全不同。",
"仍测自我认知轴，但把家庭期待换成群体推荐，减少记忆性作答。",
"用于检测极端反向作答，不纳入 16 道主覆盖统计。"
]
}
]
}