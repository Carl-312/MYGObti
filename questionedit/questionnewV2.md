##

以下 8 个角色继续使用三维主模型进行匹配，并新增 1 条只在接近平局时介入的 latent trait。

```markdown
| 角色 | 称号 | 情感表达 | 社交策略 | 自我认知 | 控制/服务 latent | 定位说明 |
|------|------|----------|----------|----------|------------------|----------|
| 高松灯 | 纯爱战神·沉重自闭少女 | -0.9 | -0.8 | -0.7 | -0.3 | 极度内敛、回避、迷茫，不控局，更多是退让承受 |
| 千早爱音 | 虚荣溜溜球·七秒记忆逃兵 | +0.3 | -0.7 | -0.4 | -0.1 | 表面外放、核心逃避、自我模糊，略讨好但以自保为先 |
| 要乐奈 | 抹茶芭菲真理教主·自由野猫 | -0.2 | -0.3 | +0.8 | 0.0 | 情感中性、略回避、非常清醒，独立，不热衷控局或兜底 |
| 长崎爽世 | 精于算计的控制狂母亲 | -0.1 | +0.8 | +0.7 | +0.8 | 克制表达、强介入、高度清醒，介入动机偏控局与安排 |
| 椎名立希 | 正义狂犬·暴走人形炸弹 | +0.9 | +0.3 | +0.6 | +0.5 | 外放、有主张，常把自己的判断推向他人 |
| 三角初华 | 热血笨蛋·善良推土机 | +0.7 | +0.8 | -0.3 | +0.3 | 外放热血、强行介入，但更多是善意推动而非精密控制 |
| 若叶睦 | 透明人·专业和事佬植物人 | -0.7 | +0.2 | -0.6 | -0.5 | 内敛、被动跟随、自我认知低，更接近顺从式承担 |
| 丰川祥子 *(隐藏)* | 破碎的高自尊客服小妹 | -0.4 | +0.5 | +0.9 | -0.7 | 压抑但有服务意识、极度清醒，介入多出于兜底与克制自我 |
```

<aside>
⚠️

以上坐标仍为工作版估值，正式定稿前建议找 3-5 个深度粉丝独立标注，再取均值校准。

</aside>

{
"meta": {
"version": "V2",
"note": "Q1-Q16 为 3D 主计分题；Q17-Q19 为 latent 题，只累计 controlServiceOrientation；Q20 为额外计分的反向校验题。主轴覆盖统计按 Q1-Q16 计算。",
"axes": {
"emotionExpression": "内敛压抑(-1) ↔ 外放表达(+1)",
"socialStrategy": "回避/等待(-1) ↔ 主动介入/组织(+1)",
"selfRecognition": "迷茫/被动(-1) ↔ 清醒/有主张(+1)"
},
"latentTraits": {
"controlServiceOrientation": {
"description": "控制/主导(+1) ↔ 克制/服务(-1)",
"questionIds": ["Q17", "Q18", "Q19"],
"characterAnchors": {
"高松灯": -0.3,
"千早爱音": -0.1,
"要乐奈": 0.0,
"长崎爽世": 0.8,
"椎名立希": 0.5,
"三角初华": 0.3,
"若叶睦": -0.5,
"丰川祥子": -0.7
}
}
},
"tieBreakerRule": {
"enabledWhenTop2DiffBelow": 0.08,
"onlyWhenTop2IncludesAnyOf": ["长崎爽世", "丰川祥子"],
"primaryTrait": "controlServiceOrientation",
"latentScoreAggregation": "mean(Q17,Q18,Q19)",
"latentScoreRange": [-1, 1],
"lambda": {
"default": 0.08,
"priorityPair": 0.12
},
"priorityPairs": [["长崎爽世", "丰川祥子"]],
"formula": "finalTieScore = baseCosine + lambda * (1 - abs(latentScore - characterLatentAnchor))"
},
"carelessResponseRuleV2": {
"possibleSignals": [
"totalDurationTooShort",
"sameOptionIndexRepeatedTooOften",
"Q6_Q20_reverseConflict",
"extremeAnswerPatternAcrossMainAxes"
],
"markWhenSignalCountAtLeast": 2
},
"reverseCheckRule": "Q6 与 Q20 配对；若两题主轴选择方向一题落在 ≤ -0.7，另一题落在 ≥ +0.7，则标记 responseInconsistency=true。",
"experienceCurve": "Q1-Q5 轻冲突日常；Q6-Q11 中等冲突；Q12-Q16 深层自我拷问；Q17-Q19 用于 latent tie-breaker；Q20 用于反向校验。"
},
"questions": [
{
"id": "Q1",
"type": "scored",
"scene": "刚进新班，活动分组时你想加入一个看起来很默契的小组，对方说他们人数刚好。你接下来会？",
"primaryAxis": "socialStrategy",
"options": [
{ "id": "A", "text": "先简单介绍自己，再问能否换种合作方式", "delta": [0.1, 0.3, 0.0] },
{ "id": "B", "text": "先说没关系，然后自己去找别的小组", "delta": [-0.1, -0.7, 0.0] },
{ "id": "C", "text": "主动提议重分任务，顺手把流程也定下来", "delta": [0.0, 0.7, -0.1] },
{ "id": "D", "text": "先旁听一下气氛，再决定要不要继续争取", "delta": [0.0, -0.3, 0.1] }
]
},
{
"id": "Q2",
"type": "scored",
"scene": "你把一条很在意的动态发出去后，收到了比预想更热烈的回应。你第一反应更像？",
"primaryAxis": "emotionExpression",
"options": [
{ "id": "A", "text": "心里很高兴，但只回几个简短表情", "delta": [-0.3, -0.1, 0.0] },
{ "id": "B", "text": "直接在群里分享喜悦，想让气氛再热一点", "delta": [0.7, 0.0, -0.1] },
{ "id": "C", "text": "先把手机扣下，等情绪稳一点再看", "delta": [-0.7, 0.0, 0.1] },
{ "id": "D", "text": "马上认真回复，把当时的开心说出来", "delta": [0.3, 0.1, 0.0] }
]
},
{
"id": "Q3",
"type": "scored",
"scene": "老师让大家从三个主题里自选一个做长期项目，你对两个方向都感兴趣，但时间只够选一个。你通常会？",
"primaryAxis": "selfRecognition",
"options": [
{ "id": "A", "text": "很快定下一个方向，也接受另一边会错过", "delta": [-0.1, 0.0, 0.7] },
{ "id": "B", "text": "先缓一缓不急着选，等自己想清楚再说", "delta": [0.1, 0.0, -0.3] },
{ "id": "C", "text": "先跟着熟人选，之后再慢慢找感觉", "delta": [0.0, 0.1, -0.7] },
{ "id": "D", "text": "先写下最看重的标准，再按标准取舍", "delta": [0.0, -0.1, 0.3] }
]
},
{
"id": "Q4",
"type": "scored",
"scene": "小组展示前，搭档突然说自己很紧张，担心会拖累大家。你更可能怎么回应？",
"primaryAxis": "emotionExpression",
"options": [
{ "id": "A", "text": "明确把鼓励说出来，顺便把气氛带轻松", "delta": [0.7, -0.1, 0.0] },
{ "id": "B", "text": "轻声说别急，我们按原计划一点点来", "delta": [-0.3, 0.0, 0.1] },
{ "id": "C", "text": "先陪她整理材料，用行动表示我在", "delta": [-0.7, 0.1, 0.0] },
{ "id": "D", "text": "直接说我也会紧张，但我们能一起扛", "delta": [0.3, 0.0, -0.1] }
]
},
{
"id": "Q5",
"type": "scored",
"scene": "周末活动临时改时间，群里消息很乱，有人没看懂安排。你通常会？",
"primaryAxis": "socialStrategy",
"options": [
{ "id": "A", "text": "只确认和自己有关的部分，先别把话说满", "delta": [-0.1, -0.3, 0.0] },
{ "id": "B", "text": "直接重新梳理安排，主动把人和时间对齐", "delta": [0.0, 0.7, -0.1] },
{ "id": "C", "text": "等信息更清楚一点，再决定要不要开口", "delta": [0.0, -0.7, 0.1] },
{ "id": "D", "text": "把关键信息整理一下，发给还没跟上的人", "delta": [0.1, 0.3, 0.0] }
]
},
{
"id": "Q6",
"type": "scored",
"scene": "家里希望你把精力放在更稳妥的方向上，但你最近越来越确定自己想尝试另一条路。你会怎么做？",
"primaryAxis": "selfRecognition",
"options": [
{ "id": "A", "text": "把顾虑和想法都摊开，边谈边调整计划", "delta": [0.1, 0.0, 0.3] },
{ "id": "B", "text": "先照着他们说的做，等以后再看看", "delta": [0.0, -0.1, -0.7] },
{ "id": "C", "text": "定好自己的底线，再决定哪些能让步", "delta": [0.0, 0.1, 0.7] },
{ "id": "D", "text": "表面先不争，私下继续摸索自己想要的", "delta": [-0.1, 0.0, -0.3] }
]
},
{
"id": "Q7",
"type": "scored",
"scene": "你所在的小组最近气氛有点僵，大家都默认问题存在，但没人先开口。你更可能？",
"primaryAxis": "socialStrategy",
"options": [
{ "id": "A", "text": "直接把讨论约起来，并先给出沟通规则", "delta": [0.0, 0.7, -0.1] },
{ "id": "B", "text": "私下问问关系近的人，先确认发生了什么", "delta": [0.0, -0.3, 0.1] },
{ "id": "C", "text": "先把自己的部分做好，等别人愿意说再谈", "delta": [-0.1, -0.7, 0.0] },
{ "id": "D", "text": "在小群里提一句，邀请大家找个时间聊聊", "delta": [0.1, 0.3, 0.0] }
]
},
{
"id": "Q8",
"type": "scored",
"scene": "你准备了很久的一次公开展示，临上场前发现关键部分出了小问题。你当下更像？",
"primaryAxis": "emotionExpression",
"options": [
{ "id": "A", "text": "只跟最熟的人说一句，我现在有点乱", "delta": [-0.3, -0.1, 0.0] },
{ "id": "B", "text": "一边讲清问题，一边主动把现场情绪稳住", "delta": [0.7, 0.0, -0.1] },
{ "id": "C", "text": "先把慌张压住，尽量按原方案低调完成", "delta": [-0.7, 0.0, 0.1] },
{ "id": "D", "text": "直接向大家说明状况，再继续往下做", "delta": [0.3, 0.1, 0.0] }
]
},
{
"id": "Q9",
"type": "scored",
"scene": "你花了很多时间准备的作品或作业，收到一条戳中痛点的评价。你更可能？",
"primaryAxis": "selfRecognition",
"options": [
{ "id": "A", "text": "区分情绪和内容，只挑有用的部分处理", "delta": [0.1, 0.0, 0.3] },
{ "id": "B", "text": "先默认对方说得对，连带怀疑整个自己", "delta": [-0.1, 0.0, -0.7] },
{ "id": "C", "text": "先确认自己原本想表达什么，再决定改不改", "delta": [0.0, 0.1, 0.7] },
{ "id": "D", "text": "先收起来缓一缓，过后再看要不要改", "delta": [0.0, -0.1, -0.3] }
]
},
{
"id": "Q10",
"type": "scored",
"scene": "你发现几位熟人私下另组了一个活动群，没有叫你。你通常会怎么处理？",
"primaryAxis": "socialStrategy",
"options": [
{ "id": "A", "text": "只去问最熟的那个人，确认是不是误会", "delta": [0.0, -0.3, 0.1] },
{ "id": "B", "text": "把事情摊开聊清楚，也想知道以后怎么相处", "delta": [0.0, 0.7, -0.1] },
{ "id": "C", "text": "先当作没看见，把情绪自己消化掉", "delta": [-0.1, -0.7, 0.0] },
{ "id": "D", "text": "直接表达自己介意，但语气尽量保持平和", "delta": [0.1, 0.3, 0.0] }
]
},
{
"id": "Q11",
"type": "scored",
"scene": "一个你很在意的人对你说：“你最近好像越来越不像你自己了。”这句话让你很在意。你会？",
"primaryAxis": "selfRecognition",
"options": [
{ "id": "A", "text": "把这句话当提醒，但仍以自己的判断为准", "delta": [0.0, 0.1, 0.7] },
{ "id": "B", "text": "先不急着回应，自己反复想一阵子再说", "delta": [0.0, -0.1, -0.3] },
{ "id": "C", "text": "追问对方具体感受到什么，再回看自己", "delta": [0.1, 0.0, 0.3] },
{ "id": "D", "text": "先顺着对方的话想，是不是我真的不太行", "delta": [-0.1, 0.0, -0.7] }
]
},
{
"id": "Q12",
"type": "scored",
"scene": "一个你曾非常信任的人，说了一句让你意识到你们理解彼此的方式完全不同。你当下更可能？",
"primaryAxis": "emotionExpression",
"options": [
{ "id": "A", "text": "把受伤和失望直接说出来，但尽量不指责", "delta": [0.3, 0.1, 0.0] },
{ "id": "B", "text": "先沉默下来，等情绪过去后再决定要不要谈", "delta": [-0.7, 0.0, 0.1] },
{ "id": "C", "text": "当场把感受讲清，也要求对方正面回应", "delta": [0.7, 0.0, -0.1] },
{ "id": "D", "text": "只说一句我需要时间，然后先把距离拉开", "delta": [-0.3, -0.1, 0.0] }
]
},
{
"id": "Q13",
"type": "scored",
"scene": "你想把一个已经散掉的合作关系重新拉回来，但对方态度很冷。你下一步更像？",
"primaryAxis": "socialStrategy",
"options": [
{ "id": "A", "text": "只表达一次自己的想法，之后不再多推", "delta": [0.0, -0.3, 0.0] },
{ "id": "B", "text": "主动把见面和沟通条件都安排好，争取一次说透", "delta": [0.0, 0.7, -0.1] },
{ "id": "C", "text": "尊重对方不想继续，先把这段关系放下", "delta": [-0.1, -0.7, 0.1] },
{ "id": "D", "text": "先问清对方现在想要什么，再决定怎么接近", "delta": [0.1, 0.3, 0.0] }
]
},
{
"id": "Q14",
"type": "scored",
"scene": "有人认真看完你的作品后，真诚地说“我很想更了解你在想什么。”你会如何回应这份靠近？",
"primaryAxis": "emotionExpression",
"options": [
{ "id": "A", "text": "很快把想法摊开，希望对方真正听懂自己", "delta": [0.7, 0.0, -0.1] },
{ "id": "B", "text": "会分享一点，但只挑自己比较能承受的部分", "delta": [-0.3, -0.1, 0.0] },
{ "id": "C", "text": "先把话收住，只点头表示自己听见了", "delta": [-0.7, 0.0, 0.1] },
{ "id": "D", "text": "愿意具体说出感受，也会说明自己的顾虑", "delta": [0.3, 0.1, 0.0] }
]
},
{
"id": "Q15",
"type": "scored",
"scene": "深夜里你突然觉得，自己努力了很久却还没有变成想成为的人。你通常会？",
"primaryAxis": "selfRecognition",
"options": [
{ "id": "A", "text": "把情绪写下来，暂时不急着给自己结论", "delta": [0.0, -0.1, -0.3] },
{ "id": "B", "text": "重新确认自己真正重视的东西，不被别人节奏带走", "delta": [0.0, 0.1, 0.7] },
{ "id": "C", "text": "先陷进否定里，觉得现在做什么都不够", "delta": [-0.1, 0.0, -0.7] },
{ "id": "D", "text": "先提醒自己还在路上，再想下一步要做什么", "delta": [0.1, 0.0, 0.3] }
]
},
{
"id": "Q16",
"type": "scored",
"scene": "需要用一句话介绍“你是怎样的人”，你录了很多次都不满意。最后你更可能提交？",
"primaryAxis": "selfRecognition",
"options": [
{ "id": "A", "text": "挑几个最能代表现在自己的点，先讲清楚", "delta": [0.1, 0.0, 0.3] },
{ "id": "B", "text": "借用别人常说的标签，先把作业交出去", "delta": [0.0, -0.1, -0.7] },
{ "id": "C", "text": "明确说出自己的原则和取舍，即使不够讨喜", "delta": [0.0, 0.1, 0.7] },
{ "id": "D", "text": "保留一点模糊，只说自己还在摸索之中", "delta": [-0.1, 0.0, -0.3] }
]
},
{
"id": "Q17",
"type": "latent",
"scene": "如果你要长期经营一个总会有人来的空间，你更想让它怎样运转？",
"primaryAxis": null,
"latentTrait": "controlServiceOrientation",
"options": [
{
"id": "A",
"text": "先把规则、边界和节奏定清楚，这样谁来都知道该怎么相处",
"delta": [0.0, 0.0, 0.0],
"latentDelta": 0.8
},
{
"id": "B",
"text": "关键流程我会先想好，但现场还是留一点让大家自己流动的空间",
"delta": [0.0, 0.0, 0.0],
"latentDelta": 0.3
},
{
"id": "C",
"text": "我更想把环境照顾得顺手稳定，让来的人待着自然舒服",
"delta": [0.0, 0.0, 0.0],
"latentDelta": -0.3
},
{
"id": "D",
"text": "只要大家能被好好接住，我愿意多做些不显眼但不能没人做的事",
"delta": [0.0, 0.0, 0.0],
"latentDelta": -0.8
}
],
"internalNotes": {
"scoring": "不计入 3D 总分，只累计 latentScore",
"optionOrderIsRandomized": true
}
},
{
"id": "Q18",
"type": "latent",
"scene": "当一段关系或合作快要失衡时，你更容易为什么站出来？",
"primaryAxis": null,
"latentTrait": "controlServiceOrientation",
"options": [
{
"id": "A",
"text": "因为总得有人把话讲明、把局面收回来，不然只会更乱",
"delta": [0.0, 0.0, 0.0],
"latentDelta": 0.8
},
{
"id": "B",
"text": "我会先把重点捋顺，让事情不要继续失控，再慢慢谈感受",
"delta": [0.0, 0.0, 0.0],
"latentDelta": 0.3
},
{
"id": "C",
"text": "我不想让谁更难堪，能先接住的部分就先接住",
"delta": [0.0, 0.0, 0.0],
"latentDelta": -0.3
},
{
"id": "D",
"text": "如果必须有人多承担一点，我通常会先把自己的感受往后放",
"delta": [0.0, 0.0, 0.0],
"latentDelta": -0.8
}
],
"internalNotes": {
"scoring": "不计入 3D 总分，只累计 latentScore",
"optionOrderIsRandomized": true
}
},
{
"id": "Q19",
"type": "latent",
"scene": "活动当天有人临时状态很差，但事情还是得继续往下走。你更可能？",
"primaryAxis": null,
"latentTrait": "controlServiceOrientation",
"options": [
{
"id": "A",
"text": "先把接下来谁做什么重新排好，确保现场不会再乱",
"delta": [0.0, 0.0, 0.0],
"latentDelta": 0.8
},
{
"id": "B",
"text": "我会先稳住进度，再一个个把人和事对上",
"delta": [0.0, 0.0, 0.0],
"latentDelta": 0.3
},
{
"id": "C",
"text": "先把零碎却要紧的部分默默补上，让最难的人少扛一点",
"delta": [0.0, 0.0, 0.0],
"latentDelta": -0.3
},
{
"id": "D",
"text": "我愿意把没人接的部分先揽过来，只要现场还能顺着转下去",
"delta": [0.0, 0.0, 0.0],
"latentDelta": -0.8
}
],
"internalNotes": {
"scoring": "不计入 3D 总分，只累计 latentScore",
"optionOrderIsRandomized": true
}
},
{
"id": "Q20",
"type": "reverse_check",
"scene": "社团报名截止前，你发现“大家都推荐的选择”和“自己真正想投入的选择”不是同一个。你通常会？",
"primaryAxis": "selfRecognition",
"options": [
{ "id": "A", "text": "先报大家都说稳妥的那个，免得之后后悔", "delta": [0.0, -0.1, -0.7] },
{ "id": "B", "text": "先把两个选择都想一阵子，再决定报名哪个", "delta": [-0.1, 0.0, -0.3] },
{ "id": "C", "text": "按自己最重视的标准选，即使和多数人不同", "delta": [0.0, 0.1, 0.7] },
{ "id": "D", "text": "先问清资源和风险，再决定哪个更适合自己", "delta": [0.1, 0.0, 0.3] }
],
"internalNotes": {
"pairedWith": "Q6",
"scoring": "计分，并作为反向校验",
"optionOrderIsRandomized": true
}
}
]
}
