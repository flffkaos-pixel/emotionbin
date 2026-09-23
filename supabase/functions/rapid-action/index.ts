// Supabase Edge Function — rapid-action (지연 예약 전용)
// 과거: 즉시 AI 댓글 생성 → 지금: 1~2시간 예약 안내만, 댓글은 ai-comment-cron이 단다.
// 구버전 클라이언트가 호출해도 reply 필드에 예약 문구가 들어가 즉시 답처럼 안 보이게 한다.
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

// 지연 후보: 60 / 90 / 120분 — 응답마다 랜덤 안내 (실제 예약은 프론트 ai_due_at)
const AI_DELAY_STEPS_MIN = [60, 90, 120];

function randomDelayMinutes() {
  return AI_DELAY_STEPS_MIN[Math.floor(Math.random() * AI_DELAY_STEPS_MIN.length)];
}

function formatWhen(delayMin) {
  if (delayMin < 90) return "약 1시간 후";
  if (delayMin < 120) return "약 1시간 30분 후";
  return "약 2시간 후";
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  let body = {};
  try { body = await req.json(); } catch (_) {}

  const delayMin = randomDelayMinutes();
  const reply = `AI가 ${formatWhen(delayMin)} 이 글에 공감 댓글을 달아줘요. 지금은 바로 달리지 않아요.`;

  // 즉시 댓글 생성 안 함 — 지연은 서버 크론이 책임진다
  return new Response(JSON.stringify({
    ok: true,
    scheduled: true,
    delayMinutes: delayMin,
    reply,
  }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
