import { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { onAuthChange, auth } from "@/lib/firebase";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Create user in backend when Firebase user is authenticated
  const createUserMutation = useMutation({
    mutationFn: async (userData: { email: string; name: string; firebaseUid: string }) => {
      return apiRequest("POST", "/api/users", userData);
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      // If user is authenticated, ensure they exist in our backend
      if (firebaseUser) {
        // Set auth header for all future requests
        const originalFetch = window.fetch;
        window.fetch = (input, init = {}) => {
          return originalFetch(input, {
            ...init,
            headers: {
              ...init.headers,
              'x-firebase-uid': firebaseUser.uid,
            },
          });
        };

        // Create user in backend if needed
        createUserMutation.mutate({
          email: firebaseUser.email!,
          name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
          firebaseUid: firebaseUser.uid,
        });
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
