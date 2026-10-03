// Supabase Edge Function — 공개 글에 AI 공감 댓글 자동 생성
// 예약 댓글(ai_due_at) 존중 + 15분 크론(GitHub Actions)이 호출
// 주의: 실제 배포는 Supabase 대시보드(via Editor) — 이 파일은 원본 보관용
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GROQ_KEY = Deno.env.get("GROQ_API_KEY") || "";
const GROQ_MODEL = Deno.env.get("GROQ_MODEL") || "qwen/qwen3.8-27b";
const SB_URL = Deno.env.get("SB_URL") || "";
const SB_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY") || "";

const SYSTEM = `너는 '감정쓰레기통' 앱의 단짝 친구다. 사용자의 글을 읽고, 그 글의 구체적인 상황과 감정에 맞춰 매번 새로운 문장으로 반응한다.

톤 원칙:
- 분노/짜증/억울함 → 사용자 편에서 함께 공분하고, 버틴 사용자를 알아준다
- 슬픔/외로움/불안/지침 → 따뜻하게 위로하고, 혼자가 아님을 전한다
- 무기력 → 쉬어도 괜찮다고 감싸준다
- 글의 구체적 내용(사람, 상황, 사건)을 언급하며 맞춤 반응을 한다

절대 금지:
- 비슷한 댓글 반복 — 매번 다른 표현으로 새로 창작할 것
- 특정인 비난·저격·죽음 기원·폭력 조장에 동조하거나 반복하지 않는다. 사용자가 특정인을 저격하면 그 사람을 언급하지 말고 '그런 마음이 들 만큼 힘들었구나'처럼 사용자의 감정 자체에만 공감한다
- 욕설 사용

형식: 반드시 한국어 반말 2문장만. 분석·조언·설명 금지. 다른 언어 혼용 금지.`;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

let lastError = "";

async function getDuePosts() {
  // 예약(ai_due_at) 도래한 글 + 예약 없는 최근 6시간 공개 글
  const now = Date.now();
  const since = now - 6 * 3600 * 1000;
  const r = await fetch(
    `${SB_URL}/rest/v1/public_posts?select=id,content,comments,ai_due_at&privacy=eq.public&order=timestamp.desc&limit=80`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
  );
  const rows = await r.json();
  return (rows || []).filter(p => {
    const hasAI = (p.comments || []).some(c => c.author === "🤖 AI");
    if (hasAI) return false;
    if (p.ai_due_at) return p.ai_due_at <= now;      // 예약 글: 시간 다 됐을 때만
    return (p.timestamp || 0) >= since;               // 예약 없는 옛 글: 6시간 창
  });
}

async function generateReply(content) {
  lastError = "";
  const text = (content || "").slice(0, 400);
  try {
    const r = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: text },
        ],
        temperature: 0.85,
        max_tokens: 120,
        reasoning_effort: "none",
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      lastError = `GROQ ${r.status}: ${data?.error?.message || "unknown"}`;
      return "";
    }
    const reply = data?.choices?.[0]?.message?.content?.trim() || "";
    const hangul = (reply.match(/[가-힣]/g) || []).length;
    if (!reply || reply.length < 4) { lastError = "empty reply"; return ""; }
    if (reply.length > 20 && hangul / reply.length < 0.15) { lastError = "filter: hangul ratio"; return ""; }
    return reply.split(/(?<=[.!?。])/).slice(0, 2).join("").trim().slice(0, 140);
  } catch (e) {
    lastError = "EXC: " + String(e);
    return "";
  }
}

async function addComment(postId, text) {
  const r = await fetch(`${SB_URL}/rest/v1/public_posts?id=eq.${postId}&select=comments`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  const rows = await r.json();
  const existing = rows?.[0]?.comments ?? [];
  const comment = { text: text.slice(0, 300), timestamp: Date.now(), author: "🤖 AI" };
  await fetch(`${SB_URL}/rest/v1/public_posts?id=eq.${postId}`, {
    method: "PATCH",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ comments: [...existing, comment] }),
  });
}

export default {
  async fetch(req) {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

    try {
      let body = {};
      try { body = await req.json(); } catch (_) {}

      // 개별 요청 모드: { content } → 즉시 1건 생성 (테스트용)
      if (body && body.content) {
        const reply = await generateReply(body.content);
        if (reply && body.postId) await addComment(body.postId, reply);
        return new Response(JSON.stringify({
          ok: true,
          reply,
          debug: lastError || `model=${GROQ_MODEL}`,
        }), {
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      // 크론 모드: 예약 도래글 일괄 처리 (GitHub Actions 15분 크론이 호출)
      const posts = await getDuePosts();
      let commented = 0;
      for (const post of posts) {
        const reply = await generateReply(post.content);
        if (!reply) continue;
        await addComment(post.id, reply);
        commented++;
      }
      return new Response(JSON.stringify({ ok: true, commented, debug: lastError || "ok" }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: String(e) }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
  },
};