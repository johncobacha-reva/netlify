import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  Timestamp,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

export async function addDeal(deal: any) {
  const path = 'deals';
  try {
    if (!auth.currentUser) throw new Error("Auth required");
    return await addDoc(collection(db, path), {
      ...deal,
      userId: auth.currentUser.uid,
      createdAt: Timestamp.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getDeals() {
  const path = 'deals';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getMarketTrends() {
  const path = 'marketTrends';
  try {
    const q = query(collection(db, path), orderBy('month', 'asc'));
    const querySnapshot = await getDocs(q);
    const trends = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Fallback Mock Data if Firestore is empty (for demo purposes)
    if (trends.length === 0) {
      return [
        { month: '2023-10', avgPricePerSqFt: 185, avgCapRate: 5.2, vacancyRate: 4.5 },
        { month: '2023-11', avgPricePerSqFt: 188, avgCapRate: 5.1, vacancyRate: 4.4 },
        { month: '2023-12', avgPricePerSqFt: 192, avgCapRate: 5.3, vacancyRate: 4.6 },
        { month: '2024-01', avgPricePerSqFt: 195, avgCapRate: 5.4, vacancyRate: 4.8 },
        { month: '2024-02', avgPricePerSqFt: 202, avgCapRate: 5.5, vacancyRate: 4.7 },
        { month: '2024-03', avgPricePerSqFt: 208, avgCapRate: 5.2, vacancyRate: 4.2 },
      ];
    }
    return trends;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
