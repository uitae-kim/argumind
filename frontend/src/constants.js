// Shared option data + score rubric for ArguMind.
// Keys here MUST match the backend choices (api/models.py Game.CATEGORY_CHOICES /
// PERSONA_CHOICES) so selections round-trip cleanly through the API.

// The 5 scoring axes, ALWAYS in this fixed order. Keys match the structured
// `scores` object from POST /api/get-scores and the Score model fields.
export const SCORE_AXES = [
  { key: "logical_consistency", label: "논리적 일관성" },
  { key: "relevance", label: "관련성" },
  { key: "creativity", label: "창의성" },
  { key: "rebuttal", label: "반박 효과" },
  { key: "summarization", label: "요약력" },
];

// Backwards-compatible label map (key -> Korean label).
export const SCORE_LABELS = SCORE_AXES.reduce((acc, { key, label }) => {
  acc[key] = label;
  return acc;
}, {});

export const MAX_AXIS = 100;
export const MAX_TOTAL = MAX_AXIS * SCORE_AXES.length; // 500

// Debate topic areas the user can pick on the setup screen.
export const CATEGORIES = [
  { key: "ethics", label: "사회·윤리", desc: "분배, 정의, 권리가 부딪치는 쟁점" },
  { key: "tech", label: "기술·AI", desc: "자동화와 알고리즘이 바꾸는 질서" },
  { key: "culture", label: "문화·예술", desc: "취향과 표현의 경계를 둘러싼 논쟁" },
  { key: "random", label: "무작위", desc: "어떤 영역이 나올지 모르는 채로 시작" },
];

// AI opponent personalities. `avatar` is a single glyph shown in the avatar chip.
export const PERSONAS = [
  { key: "logician", label: "논리주의자", desc: "전제와 결론의 빈틈을 파고듭니다.", avatar: "論" },
  { key: "provocateur", label: "도발가", desc: "당신의 약한 고리를 집요하게 물고 늘어집니다.", avatar: "挑" },
  { key: "socratic", label: "소크라테스식", desc: "질문을 던져 스스로 모순에 이르게 합니다.", avatar: "蘇" },
  { key: "historical", label: "역사 속 인물", desc: "특정 사상가의 관점을 빌려 논쟁합니다.", avatar: "史" },
];

// Match length options. value 0 means unlimited (no automatic verdict).
export const MATCH_LENGTHS = [
  { value: 3, label: "3턴" },
  { value: 5, label: "5턴" },
  { value: 0, label: "무제한" },
];

export const DEFAULT_CATEGORY = "tech";
export const DEFAULT_PERSONA = "provocateur";
export const DEFAULT_MAX_TURNS = 3;

export const MAX_ARGUMENT_LENGTH = 600;

// Lookup helpers (label/avatar by key) for screens that render stored games.
export const categoryLabel = (key) =>
  (CATEGORIES.find((c) => c.key === key) || {}).label || key;
export const personaLabel = (key) =>
  (PERSONAS.find((p) => p.key === key) || {}).label || key;
export const personaAvatar = (key) =>
  (PERSONAS.find((p) => p.key === key) || {}).avatar || "AI";
