import type {
  CanonicalCharacterContent,
  CharacterProfile,
  CharacterRelationships,
  CharacterResultContent,
} from "@mygobti/quiz-core";

interface CharacterPresentation {
  id: string;
  summary: string;
  tags: string[];
  relationships: CharacterRelationships;
  result: CharacterResultContent;
}

const PRESENTATION_BY_NAME: Record<string, CharacterPresentation> = {
  高松灯: {
    id: "tomori",
    summary: "把所有在意都藏进沉默里，越重视越像在往后退。",
    tags: ["敏感", "执着", "闷烧"],
    relationships: {
      rivalId: "anon",
      soulmateId: "taki",
    },
    result: {
      description: "你会先吞下自己的情绪，再慢慢确认自己有没有资格开口。关系对你来说不是社交游戏，而是会压在胸口一整天的重力。",
      shortReview: "安静得像退场，其实是把全部真心都抱太紧。",
      quote: "你不是不想说，只是每句话都先在心里受了一次伤。",
      posterCaption: "沉默像潮湿歌词，把所有求救都写成省略号。",
      highlights: ["先感受伤口，再决定开口", "对重要关系会默默加倍上心", "越认真越容易把自己缩回去"],
    },
  },
  千早爱音: {
    id: "anon",
    summary: "看起来很会接球，真正需要承担时却想先溜。",
    tags: ["社牛伪装", "回避", "轻盈"],
    relationships: {
      rivalId: "soyo",
      soulmateId: "tomori",
    },
    result: {
      description: "你很懂得把场面撑住，也很懂得在真正危险之前给自己留后路。你不是没感情，只是讨厌被问题钉在原地。",
      shortReview: "会救场，也会逃场，浪漫和逃避装在同一个口袋里。",
      quote: "先把气氛弄好，至于代价能不能晚一点再结算。",
      posterCaption: "嘴角挂着营业笑，脚下已经在找离场路线。",
      highlights: ["社交反应快，擅长先把气氛救回来", "危险一靠近就会开始找退路", "轻盈感是你最熟悉的防御"],
    },
  },
  要乐奈: {
    id: "raana",
    summary: "情绪不一定热闹，但内心坐标一直很稳。",
    tags: ["自由", "冷静", "自洽"],
    relationships: {
      rivalId: "taki",
      soulmateId: "sakiko",
    },
    result: {
      description: "你不爱被流程绑死，也不喜欢替别人演戏。比起吵赢，你更在意自己是不是还站在舒服的位置上。",
      shortReview: "像猫一样懒得解释，但方向感比谁都清楚。",
      quote: "不合拍的时候，你宁可转身，也不会把自己塞进错误节奏里。",
      posterCaption: "自由不是叛逆，是在喧闹里仍能慢慢走自己的线。",
      highlights: ["比起正确答案，你更在意自在", "边界感稳定，不会被热闹轻易卷跑", "看似松弛，其实一直知道自己要什么"],
    },
  },
  长崎爽世: {
    id: "soyo",
    summary: "温柔只是外壳，你真正擅长的是把局面捏回自己手里。",
    tags: ["控制", "照料", "体面"],
    relationships: {
      rivalId: "anon",
      soulmateId: "mutsumi",
    },
    result: {
      description: "你会先判断谁快失控，再用最不动声色的方式接管局面。你给人的安全感很高，但那份安全往往也带着不容拒绝的方向感。",
      shortReview: "披着体贴外套的精密操盘手，越平静越让人不敢掉线。",
      quote: "你不是在请求合作，你是在温柔地把结局排好。",
      posterCaption: "指尖像缝纫线，一边安抚，一边把场面重新缝回秩序。",
      highlights: ["总能最先发现局面开始失控", "照料别人时会顺手重排节奏", "体面和掌控感经常一起出现"],
    },
  },
  椎名立希: {
    id: "taki",
    summary: "情绪和原则都上脸，认定的东西会直接护到底。",
    tags: ["爆发", "护短", "直球"],
    relationships: {
      rivalId: "raana",
      soulmateId: "tomori",
    },
    result: {
      description: "你最讨厌阴阳怪气和拖泥带水，想保的人会被你直接拽到自己身后。外表像炸药，核心却是很少妥协的真心。",
      shortReview: "脾气像火药桶，但每次爆炸都带着明确的偏爱。",
      quote: "你可以不圆滑，但你会让所有人知道你到底站哪边。",
      posterCaption: "怒气像鼓点砸下来，轰隆一声把偏爱敲到最前排。",
      highlights: ["情绪和原则都会直接上脸", "护短的时候没有模糊地带", "你宁可炸，也不愿意装作没看见"],
    },
  },
  三角初华: {
    id: "uika",
    summary: "热情来得很快，判断却常常追不上行动力。",
    tags: ["热血", "介入", "横冲直撞"],
    relationships: {
      rivalId: "sakiko",
      soulmateId: "anon",
    },
    result: {
      description: "你遇到问题第一反应不是退，而是冲进去把场子扛起来。你未必总能选到最细腻的方法，但诚意和行动力从来都很大声。",
      shortReview: "像推土机一样善良，救场时顺便把门框也拆了。",
      quote: "先把人抱回来再说，细节和后果晚点再补票。",
      posterCaption: "一身热度撞进夜里，把犹豫和门槛一起推平。",
      highlights: ["行动力总比犹豫更快一步", "会本能地冲去救场或接住别人", "细节不一定漂亮，但诚意从不静音"],
    },
  },
  若叶睦: {
    id: "mutsumi",
    summary: "常常站在边缘维持平衡，却不太替自己争取位置。",
    tags: ["和事佬", "透明", "迟疑"],
    relationships: {
      rivalId: "soyo",
      soulmateId: "tomori",
    },
    result: {
      description: "你对场上气压很敏感，会本能地去补别人没说出口的那一块。但轮到自己时，你又很容易把需求缩回去，像默默退成背景。",
      shortReview: "会把所有人的情绪都照顾到，唯独忘了给自己留一句台词。",
      quote: "你不是没有立场，只是太习惯先确认别人会不会受伤。",
      posterCaption: "像安静盆栽一样守在角落，把裂缝悄悄盖成一片阴影。",
      highlights: ["能敏感察觉气氛里的裂缝", "习惯先给别人留空间", "自己的需求常常被你排到最后"],
    },
  },
  丰川祥子: {
    id: "sakiko",
    summary: "外表仍维持体面与服务，内里却在用清醒感硬撑碎裂。",
    tags: ["高自尊", "服务意识", "克制"],
    relationships: {
      rivalId: "uika",
      soulmateId: "raana",
    },
    result: {
      description: "你会把脆弱整理成体面，把不甘压缩成礼貌，把求救包装成还算漂亮的句子。你不是不疼，只是不允许自己疼得难看。",
      shortReview: "体面得近乎残忍，清醒得让人听见玻璃裂开的回音。",
      quote: "你连崩溃都想保持服务态度，只是不肯让别人看见账单。",
      posterCaption: "礼貌像碎掉的瓷器，仍然反着冷光，仍然不肯低头。",
      highlights: ["高自尊让你连失控都想收拾整齐", "会照料别人，却很少允许别人看见你的代价", "清醒感既保护你，也持续割伤你"],
    },
  },
};

export function buildCharacters(
  canonicalCharacters: CanonicalCharacterContent[],
): CharacterProfile[] {
  return canonicalCharacters.map((character) => {
    const presentation = PRESENTATION_BY_NAME[character.name];
    if (!presentation) {
      throw new Error(`Missing presentation data for ${character.name}.`);
    }

    return {
      id: presentation.id,
      name: character.name,
      title: character.title,
      anchor: character.anchor,
      latentAnchor: character.latentAnchor,
      summary: presentation.summary,
      tags: presentation.tags,
      relationships: presentation.relationships,
      result: presentation.result,
      hidden: character.hidden,
    };
  });
}

export function getPublicCharacters(
  characters: CharacterProfile[],
): CharacterProfile[] {
  return characters.filter((character) => !character.hidden);
}
