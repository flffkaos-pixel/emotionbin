const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB4hIzZJ_CmISg7za95mFXIyWxPjPzo0ig",
  authDomain: "emotionbin-2bafe.firebaseapp.com",
  projectId: "emotionbin-2bafe",
  storageBucket: "emotionbin-2bafe.firebasestorage.app",
  messagingSenderId: "74339911129",
  appId: "1:74339911129:web:3715c463d186fe8b8b85c8",
  measurementId: "G-R0PSCZ6RFT"
};

let fbDb, fbConnected = false, fbUnsubscribe = null;

try {
  firebase.initializeApp(FIREBASE_CONFIG);
  fbDb = firebase.firestore();
  fbDb.settings({ merge: true });
  fbConnected = true;
  console.log('[FB] Firebase initialized');
} catch (e) {
  console.warn('[FB] init error:', e);
}

const POSTS_COLLECTION = 'publicPosts';

async function fbSavePost(data) {
  if (!fbConnected) return null;
  try {
    const docRef = await fbDb.collection(POSTS_COLLECTION).add({
      ...data,
      reactions: {},
      serverTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } catch (e) {
    console.warn('[FB] save error:', e);
    return null;
  }
}

async function fbLoadPosts() {
  if (!fbConnected) return [];
  try {
    const snapshot = await fbDb.collection(POSTS_COLLECTION)
      .orderBy('timestamp', 'desc')
      .limit(500)
      .get();
    console.log('[FB] loaded', snapshot.docs.length, 'posts');
    return snapshot.docs.map(doc => ({ ...doc.data(), _fbId: doc.id }));
  } catch (e) {
    console.warn('[FB] load error:', e);
    return [];
  }
}

function fbSubscribePosts(callback) {
  if (!fbConnected) return;
  if (fbUnsubscribe) fbUnsubscribe();
  fbUnsubscribe = fbDb.collection(POSTS_COLLECTION)
    .orderBy('timestamp', 'desc')
    .limit(500)
    .onSnapshot(snapshot => {
      const posts = snapshot.docs.map(doc => ({ ...doc.data(), _fbId: doc.id }));
      callback(posts);
    }, error => {
      console.warn('[FB] subscribe error:', error);
    });
}

async function fbUpdateReactions(postId, type, count) {
  if (!fbConnected) return;
  try {
    const snapshot = await fbDb.collection(POSTS_COLLECTION)
      .where('id', '==', postId)
      .limit(1)
      .get();
    if (!snapshot.empty) {
      const ref = snapshot.docs[0].ref;
      await ref.update({ [`reactions.${type}`]: count });
    }
  } catch (e) {
    console.warn('[FB] reaction update error:', e);
  }
}

async function fbDeletePost(postId) {
  if (!fbConnected) return;
  try {
    const snapshot = await fbDb.collection(POSTS_COLLECTION)
      .where('id', '==', postId)
      .limit(1)
      .get();
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.delete();
      console.log('[FB] deleted post:', postId);
    }
  } catch (e) {
    console.warn('[FB] delete post error:', e);
  }
}

async function fbAddComment(postId, text) {
  if (!fbConnected) return null;
  try {
    const snapshot = await fbDb.collection(POSTS_COLLECTION)
      .where('id', '==', postId)
      .limit(1)
      .get();
    if (!snapshot.empty) {
      const ref = snapshot.docs[0].ref;
      const comment = { text: text.substring(0, 300), timestamp: Date.now() };
      const existing = snapshot.docs[0].data().comments || [];
      await ref.update({ comments: [...existing, comment] });
      return comment;
    }
  } catch (e) {
    console.warn('[FB] comment error:', e);
  }
  return null;
}

async function fbDeleteAllPosts() {
  if (!fbConnected) return;
  try {
    const snapshot = await fbDb.collection(POSTS_COLLECTION).get();
    const batch = fbDb.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log('[FB] deleted', snapshot.docs.length, 'posts');
  } catch (e) {
    console.warn('[FB] delete error:', e);
  }
}
