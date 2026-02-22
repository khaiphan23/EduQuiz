import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "./firebase";
import { User } from "../types";

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Fetch latest user data from Firestore to get custom fields
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
    const userData = userDoc.data();

    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: userData?.name || firebaseUser.displayName || 'User',
      photoURL: userData?.photoURL || firebaseUser.photoURL || undefined,
      bio: userData?.bio || undefined,
      notifications: userData?.notifications || { email: true, push: true, activitySummary: true },
      preferences: userData?.preferences || { theme: 'light', language: 'vi' },
    };
  },

  register: async (name: string, email: string, password: string): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    await updateProfile(firebaseUser, {
      displayName: name
    });

    // Save user to Firestore 'users' collection
    await setDoc(doc(db, "users", firebaseUser.uid), {
      id: firebaseUser.uid,
      name: name,
      email: email,
      createdAt: Date.now()
    });

    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: name,
    };
  },

  logout: async () => {
    await signOut(auth);
  },

  deleteAccount: async () => {
    const user = auth.currentUser;
    if (user) {
      await user.delete();
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;
    
    try {
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: data.name || firebaseUser.displayName || 'User',
          photoURL: data.photoURL || firebaseUser.photoURL || undefined,
          bio: data.bio || undefined,
          notifications: data.notifications || { email: true, push: true, activitySummary: true },
          preferences: data.preferences || { theme: 'light', language: 'vi' },
        };
      }
    } catch (e) {
      console.error("Error fetching user profile:", e);
    }

    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || 'User',
      photoURL: firebaseUser.photoURL || undefined,
    };
  },

  updateUserProfile: async (userId: string, updates: { 
    name?: string; 
    photoURL?: string; 
    bio?: string; 
    notifications?: { email: boolean; push: boolean; activitySummary: boolean };
    preferences?: { theme: 'light' | 'dark' | 'system'; language: 'vi' | 'en' };
  }) => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user logged in");

    // Update Firebase Auth profile
    if (updates.name || updates.photoURL) {
      await updateProfile(user, {
        displayName: updates.name || user.displayName,
        photoURL: updates.photoURL || user.photoURL
      });
    }

    // Update Firestore user document
    await updateDoc(doc(db, "users", userId), {
      ...updates,
      updatedAt: Date.now()
    });
  },

  updateUserPassword: async (currentPassword: string, newPassword: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user logged in");
    
    const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import("firebase/auth");
    
    // Re-authenticate user
    if (user.email) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
    } else {
        throw new Error("User email not found");
    }

    // Update password
    await updatePassword(user, newPassword);
  },

  uploadAvatar: async (userId: string, file: File): Promise<string> => {
    const storageRef = ref(storage, `avatars/${userId}/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }
};
