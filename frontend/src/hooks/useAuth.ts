// frontend/src/hooks/useAuth.ts

import { useState, useEffect } from 'react';
import { authService, User } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      loadUser();
    }
  }, []);

  async function loadUser() {
    try {
      if (authService.isAuthenticated()) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      setUser(null);
      // Clear invalid tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    await authService.login({ email, password });
    await loadUser();
  }

  async function logout() {
    await authService.logout();
    setUser(null);
  }

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    isSuperAdmin: user?.role === 'super_admin',
    login,
    logout,
    reload: loadUser,
  };
}




// frontend/src/hooks/useAuth.ts



// import { useState, useEffect } from 'react';
// import { authService, User } from '@/lib/auth';

// export function useAuth() {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadUser();
//   }, []);

//   async function loadUser() {
//     try {
//       if (authService.isAuthenticated()) {
//         const userData = await authService.getCurrentUser();
//         setUser(userData);
//       }
//     } catch (error) {
//       console.error('Failed to load user:', error);
//       setUser(null);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function login(email: string, password: string) {
//     await authService.login({ email, password });
//     await loadUser();
//   }

//   async function logout() {
//     await authService.logout();
//     setUser(null);
//   }

//   return {
//     user,
//     loading,
//     isAuthenticated: !!user,
//     isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
//     isSuperAdmin: user?.role === 'super_admin',
//     login,
//     logout,
//     reload: loadUser,
//   };
// }

