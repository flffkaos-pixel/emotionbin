import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ufvqbjduffflcijtrkkn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmdnFiamR1ZmZmbGNpanRya2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNjM5NDcsImV4cCI6MjA5ODczOTk0N30.Yp2R_4HWxZiDcyHD91Bd03kf6S92qhLkwnw-B6FzkNc';

const sbClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let sbConnected = true;
let sbUnsubscribe = null;
const TABLE_NAME = 'public_posts';

window.sbConnected = true;

async function sbSavePost(data) {
  if (!sbConnected) return null;
  try {
    const { error } = await sbClient.from(TABLE_NAME).insert([{
      id: data.id,
      content: data.content,
      tags: data.tags,
      weightBefore: data.weightBefore,
      weightAfter: data.weightAfter,
      weightDiff: data.weightDiff,
      timestamp: data.timestamp,
      privacy: data.privacy,
      trashType: data.trashType,
      reactions: {},
      comments: [],
    }]);
    if (error) throw error;
    return data.id;
  } catch (e) {
    console.warn('[SB] save error:', e);
    return null;
  }
}

async function sbLoadPosts() {
  if (!sbConnected) return [];
  try {
    const { data, error } = await sbClient
      .from(TABLE_NAME)
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(500);
    if (error) throw error;
    console.log('[SB] loaded', data.length, 'posts');
    return data;
  } catch (e) {
    console.warn('[SB] load error:', e);
    return [];
  }
}

function sbSubscribePosts(callback) {
  if (sbUnsubscribe) { sbUnsubscribe.unsubscribe(); sbUnsubscribe = null; }
  sbUnsubscribe = sbClient
    .channel('public_posts_changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: TABLE_NAME },
      () => { sbLoadPosts().then(callback); }
    )
    .subscribe();
}

async function sbUpdateReactions(postId, type, count) {
  if (!sbConnected) return;
  try {
    const { data, error } = await sbClient
      .from(TABLE_NAME)
      .select('reactions')
      .eq('id', postId)
      .single();
    if (error) throw error;
    const reactions = { ...(data?.reactions || {}), [type]: count };
    const { error: updateError } = await sbClient
      .from(TABLE_NAME)
      .update({ reactions })
      .eq('id', postId);
    if (updateError) throw updateError;
  } catch (e) {
    console.warn('[SB] reaction update error:', e);
  }
}

async function sbDeletePost(postId) {
  if (!sbConnected) return;
  try {
    const { error } = await sbClient
      .from(TABLE_NAME)
      .delete()
      .eq('id', postId);
    if (error) throw error;
    console.log('[SB] deleted post:', postId);
  } catch (e) {
    console.warn('[SB] delete error:', e);
  }
}

async function sbAddComment(postId, text) {
  if (!sbConnected) return null;
  try {
    const { data, error } = await sbClient
      .from(TABLE_NAME)
      .select('comments')
      .eq('id', postId)
      .single();
    if (error) throw error;
    const comment = { text: text.substring(0, 300), timestamp: Date.now() };
    const comments = [...(data?.comments || []), comment];
    const { error: updateError } = await sbClient
      .from(TABLE_NAME)
      .update({ comments })
      .eq('id', postId);
    if (updateError) throw updateError;
    return comment;
  } catch (e) {
    console.warn('[SB] comment error:', e);
    return null;
  }
}

async function sbDeleteAllPosts() {
  if (!sbConnected) return;
  try {
    const { error } = await sbClient
      .from(TABLE_NAME)
      .delete()
      .neq('id', 0);
    if (error) throw error;
    console.log('[SB] deleted all posts');
  } catch (e) {
    console.warn('[SB] delete error:', e);
  }
}

window.sbSavePost = sbSavePost;
window.sbLoadPosts = sbLoadPosts;
window.sbSubscribePosts = sbSubscribePosts;
window.sbUpdateReactions = sbUpdateReactions;
window.sbDeletePost = sbDeletePost;
window.sbAddComment = sbAddComment;
window.sbDeleteAllPosts = sbDeleteAllPosts;
