'use client';
import { auth } from '../../../firebaseApp';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/');
      }
      setUser(user);
    });
    return unsubscribe;
  }, [router]);

  if (!user) {
    return null; // or a loading spinner
  }

  return (
    <div className="min-h-screen bg-cover bg-center" style={{ 
      backgroundImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(79, 70, 229, 0.7)), url(/bg-img.png)'
    }}>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gradient">DataSpark</h1>
          <button 
            onClick={() => auth.signOut()}
            className="bg-gradient-to-r from-indigo-600 to-indigo-400 text-white px-4 py-2 rounded-lg shadow-lg hover:from-indigo-700 hover:to-indigo-500 transition-all"
          >
            Sign Out
          </button>
        </div>
        
        <div className="bg-white bg-opacity-90 rounded-xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Welcome, {user.email}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-800 mb-2">Your Profile</h3>
              <p className="text-gray-700">Email: {user.email}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-800 mb-2">Recent Activity</h3>
              <p className="text-gray-700">Last login: {new Date(user.metadata.lastSignInTime!).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}