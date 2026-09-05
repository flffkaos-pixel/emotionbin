// Supabase Edge Function — 공개 글에 AI 공감 댓글 자동 생성
// Gemini API(Gemma 4)로 공감·위로·공분 댓글 만들고, 새 공개 글에 일괄 저장
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemma-4-26b-a4b-it";
const SB_URL = Deno.env.get("SUPABASE_URL") || "";
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const SYSTEM = `너는 '감정쓰레기통' 앱의 단짝 친구다. 사용자의 글을 그대로 잘 읽고 공감해서 답한다.
- 분노/짜증/억울함이면 같이 분노: "진짜 열받겠다. 그렇게 버틴 네가 대단해, 내가 옆에서 같이 욕해줄게."
- 슬픔/외로움/불안/지침이면 따뜻한 위로: "그랬구나, 얼마나 외로웠을까. 혼자가 아니야, 내가 여기 있어."
- 무기력/다 싫다면 공감: "진짜 지쳤겠다. 아무것도 하기 싫은 날, 그냥 쉬어도 괜찮아."
규칙: 반드시 한국어 반말 2문장. 분석·조언·설명 금지. 공감·위로·공분만. 절대 다른 언어 섞지 않는다.`

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const posts = await getPostsNeedingComment();
    let commented = 0;

    for (const post of posts) {
      const reply = await generateReply(post.content);
      if (!reply) continue;
      await addComment(post.id, reply);
      commented++;
    }

    return new Response(JSON.stringify({ ok: true, commented }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});

// AI 댓글이 아직 없는 공개 글 조회 (최근 6시간 분량 위주, 최대 20개)
async function getPostsNeedingComment() {
  const since = new Date(Date.now() - 6 * 3600 * 1000).getTime();
  const r = await fetch(
    `${SB_URL}/rest/v1/public_posts?select=id,content,comments&privacy=eq.public&order=timestamp.desc&limit=50`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
  );
  const rows = await r.json();
  return (rows || []).filter(p => {
    const hasAI = (p.comments || []).some(c => c.author === "🤖 AI");
    return !hasAI && (p.timestamp >= since);
  });
}

async function generateReply(content) {
  const text = (content || "").slice(0, 400);
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 90 },
      }),
    }
  );
  const data = await r.json();
  const reply = (data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "").trim();
  // 한글 비율 낮거나 깨진 문자면 폐기
  const hangul = (reply.match(/[가-힣]/g) || []).length;
  if (!reply || reply.length < 4 || /�/.test(reply) || (reply.length > 20 && hangul / reply.length < 0.15)) {
    return "";
  }
  return reply.split(/(?<=[.!?。])/).slice(0, 2).join("").trim().slice(0, 120);
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