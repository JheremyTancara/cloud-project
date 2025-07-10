const admin = require("firebase-admin");
const path = require("path");
const serviceAccount = require(path.resolve(__dirname, "../../serviceAccountKey.json"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

async function deleteCollection(name) {
  const snap = await db.collection(name).get();
  const batch = db.batch();
  snap.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log(`Colección ${name} eliminada`);
}

(async () => {
  await deleteCollection("genres");
  await deleteCollection("artists");
  await deleteCollection("songs");
  process.exit(0);
})(); 