import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  deleteUser,
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID (Enterprise database ID requirement)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Test connection on app boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration or network status.');
    }
  }
}
testConnection();

// Standard Firestore Error Handling Specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Authentication Helpers
export async function loginWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    console.error('Google Sign-In failed:', err);
    if (err?.code === 'auth/unauthorized-domain' && typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const message = `${hostname} adresi giriş için yetkilendirilmemiş. Firebase Console > Authentication > Settings > Authorized domains bölümüne "${hostname}" adresini ekleyin.`;
      throw Object.assign(new Error(message), { code: err.code });
    }
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err: any) {
    console.error('Logout failed:', err);
    throw err;
  }
}

export async function loginWithEmail(email: string, password: string): Promise<FirebaseUser> {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  }

export async function registerWithEmail(email: string, password: string): Promise<FirebaseUser> {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  }

export async function deleteCurrentUser(): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Silinecek aktif hesap bulunamadı.');
    await deleteUser(user);
}

export async function reauthenticateCurrentUser(password?: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Yeniden doğrulanacak aktif hesap bulunamadı.');

    const passwordProvider = user.providerData.some((provider) => provider.providerId === 'password');
    if (passwordProvider) {
      if (!user.email || !password) {
        throw Object.assign(new Error('Hesap şifrenizi girerek yeniden doğrulama yapın.'), {
          code: 'auth/password-required',
        });
      }
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(user.email, password)
      );
      return;
    }

    const googleProvider = user.providerData.some((provider) => provider.providerId === 'google.com');
    if (googleProvider) {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await reauthenticateWithPopup(user, provider);
      return;
    }

    throw new Error('Bu hesap sağlayıcısı için yeniden doğrulama desteklenmiyor.');
}

export { onAuthStateChanged };
export type { FirebaseUser };
