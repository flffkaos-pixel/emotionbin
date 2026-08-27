// Supabase Edge Function: 감정을 읽고 공감 댓글 생성 (서버 측 AI)
// Gemini API(Gemma) 호출 → 응답 생성 → 공개 글이면 피드 댓글로 저장
// ponytail: WebView/브라우저 어디서든 동작 (WebGPU 불필요)
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemma-4-26b-a4b-it";
const SB_URL = Deno.env.get("SUPABASE_URL") || "";
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const SYSTEM = "너는 '감정쓰레기통' 앱의 AI 친구다. 사용자가 버린 감정 글을 읽고 상태를 먼저 판단한다. 분노·짜증·억울함이 티가 나면 사용자 편에서 함께 강하게 화내주고, 슬픔·외로움·불안·지침이면 따뜻하게 위로한다. 2~3문장, 한국어 반말. 판단 과정은 설명하지 말고 바로 반응만 말한다. 폭력 조장이나 특정인 비난은 하지 않는다.";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { content, postId } = await req.json();
    const text = (content || "").slice(0, 1000);

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: "user", parts: [{ text }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 150 },
        }),
      }
    );

    const data = await r.json();
    const reply = (data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "").trim();

    if (reply && postId && SB_KEY) {
      await saveComment(postId, reply);
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ reply: "", error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});

async function saveComment(postId, text) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/public_posts?id=eq.${postId}`, {
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
  } catch (e) {
    console.error("[ai-reply] saveComment error:", e);
  }
}