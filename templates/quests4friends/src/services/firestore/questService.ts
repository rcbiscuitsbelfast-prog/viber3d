import { db, auth } from "../../firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { Quest } from "../../types/firestore.types";

export async function createQuest(
  quest: Omit<Quest, "id" | "createdAt">
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("[Quest] Not authenticated");
  
  console.log('[Quest] Creating quest:', quest.title);
  
  const questRef = doc(collection(db, "quests"));
  const questData = {
    ...quest,
    ownerId: user.uid,
    createdAt: serverTimestamp(),
  };
  
  await setDoc(questRef, questData);
  console.log('[Quest] Quest created:', questRef.id);
  return questRef.id;
}

export async function getQuestById(questId: string): Promise<Quest | null> {
  console.log('[Quest] Fetching quest:', questId);
  const docRef = doc(db, "quests", questId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    console.log('[Quest] Quest not found:', questId);
    return null;
  }
  
  const data = docSnap.data();
  console.log('[Quest] Quest fetched:', questId);
  
  return {
    ...data,
    id: questId,
    createdAt: data.createdAt?.toDate() || new Date(),
    expiresAt: data.expiresAt?.toDate() || null,
  } as Quest;
}

export async function updateQuest(
  questId: string,
  updates: Partial<Quest>
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("[Quest] Not authenticated");
  
  console.log('[Quest] Updating quest:', questId);
  
  // Check ownership
  const docRef = doc(db, "quests", questId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error("[Quest] Quest not found");
  
  const quest = docSnap.data();
  if (quest.ownerId !== user.uid) throw new Error("[Quest] Not quest owner");
  
  // Remove id and createdAt from updates if present
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, ...updateData } = updates;
  
  await updateDoc(docRef, updateData);
  console.log('[Quest] Quest updated:', questId);
}

export async function deleteQuest(questId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("[Quest] Not authenticated");
  
  console.log('[Quest] Deleting quest:', questId);
  
  // Check ownership
  const docRef = doc(db, "quests", questId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error("[Quest] Quest not found");
  
  const quest = docSnap.data();
  if (quest.ownerId !== user.uid) throw new Error("[Quest] Not quest owner");
  
  await deleteDoc(docRef);
  console.log('[Quest] Quest deleted:', questId);
}

export async function listUserQuests(userId: string): Promise<Quest[]> {
  console.log('[Quest] Listing quests for user:', userId);
  
  const q = query(
    collection(db, "quests"),
    where("ownerId", "==", userId),
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  const quests: Quest[] = [];
  
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    quests.push({
      ...data,
      id: docSnap.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || null,
    } as Quest);
  });
  
  console.log('[Quest] Found quests:', quests.length);
  return quests;
}
