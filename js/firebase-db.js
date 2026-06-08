const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB4hIzZJ_CmISg7za95mFXIyWxPjPzo0ig",
  authDomain: "emotionbin-2bafe.firebaseapp.com",
  projectId: "emotionbin-2bafe",
  storageBucket: "emotionbin-2bafe.firebasestorage.app",
  messagingSenderId: "74339911129",
  appId: "1:74339911129:web:3715c463d186fe8b8b85c8",
  measurementId: "G-R0PSCZ6RFT"
};

firebase.initializeApp(FIREBASE_CONFIG);
const fbDb = firebase.firestore();
const POSTS_COLLECTION = 'publicPosts';

let fbUnsubscribe = null;

async function fbSavePost(data) {
  try {
    const docRef = await fbDb.collection(POSTS_COLLECTION).add({
      ...data,
      reactions: {},
      serverTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } catch (e) {
    console.error('[FB] save error:', e);
    return null;
  }
}

async function fbLoadPosts() {
  try {
    const snapshot = await fbDb.collection(POSTS_COLLECTION)
      .orderBy('timestamp', 'desc')
      .limit(500)
      .get();
    return snapshot.docs.map(doc => ({ ...doc.data(), _fbId: doc.id }));
  } catch (e) {
    console.error('[FB] load error:', e);
    return [];
  }
}

function fbSubscribePosts(callback) {
  if (fbUnsubscribe) fbUnsubscribe();
  fbUnsubscribe = fbDb.collection(POSTS_COLLECTION)
    .orderBy('timestamp', 'desc')
    .limit(500)
    .onSnapshot(snapshot => {
      const posts = snapshot.docs.map(doc => ({ ...doc.data(), _fbId: doc.id }));
      callback(posts);
    }, error => {
      console.error('[FB] subscribe error:', error);
    });
}

async function fbUpdateReactions(postId, type, count) {
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
    console.error('[FB] reaction update error:', e);
  }
}
