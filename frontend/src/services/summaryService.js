import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";

import { db, auth } from "./firebase";

export async function loadSummary(docId) {
  const docRef = doc(db, "class_logs_summary", docId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data().summary || "要約データが空っぽです。";
}

export async function savePendingPatch(docId, text) {
  await addDoc(collection(db, "summary_pending_requests"), {
    docId,
    text,
    userEmail: auth.currentUser?.email,
    createdAt: new Date(),
  });
}

export async function deleteSummaryPage(docId) {
  const commentsRef = collection(db, "class_logs_summary", docId, "comments");

  const commentsSnapshot = await getDocs(commentsRef);

  for (const commentDoc of commentsSnapshot.docs) {
    await deleteDoc(commentDoc.ref);
  }

  await deleteDoc(doc(db, "class_logs_summary", docId));
}

export async function checkAndRunPendingPatches(docId) {
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (!isLocal) {
    return false;
  }

  const q = query(
    collection(db, "summary_pending_requests"),
    where("docId", "==", docId),
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return false;
  }

  const patchTexts = [];
  const deletePromises = [];

  querySnapshot.forEach((patchDoc) => {
    patchTexts.push(patchDoc.data().text);

    deletePromises.push(
      deleteDoc(doc(db, "summary_pending_requests", patchDoc.id)),
    );
  });

  const combinedPatchText = patchTexts.join("\n");

  const response = await fetch("http://localhost:5000/api/patch_summary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      className: docId.split("_")[0],
      classCount: docId.split("_")[1],
      additionalText: combinedPatchText,
    }),
  });

  const data = await response.json();

  if (data.status === "success") {
    await Promise.all(deletePromises);
    return true;
  }

  return false;
}
