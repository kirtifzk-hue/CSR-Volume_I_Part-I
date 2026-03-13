import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Trash2, UserPlus, X } from "lucide-react";

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "allowedUsers"));
      const users = querySnapshot.docs.map(doc => doc.id);
      setAllowedUsers(users);
    } catch (error) {
      console.error("Error fetching users", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes("@")) return;

    try {
      await setDoc(doc(db, "allowedUsers", newEmail.toLowerCase()), {
        email: newEmail.toLowerCase(),
        addedAt: new Date()
      });
      setNewEmail("");
      fetchUsers();
    } catch (error) {
      console.error("Error adding user", error);
      alert("Failed to add user. Are you sure you are an admin?");
    }
  };

  const handleRemoveUser = async (email: string) => {
    if (!confirm(`Are you sure you want to remove ${email}?`)) return;
    
    try {
      await deleteDoc(doc(db, "allowedUsers", email));
      fetchUsers();
    } catch (error) {
      console.error("Error removing user", error);
      alert("Failed to remove user.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manage Access</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <form onSubmit={handleAddUser} className="mb-6 flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter email address"
              className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-700 dark:text-white"
              required
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add
            </button>
          </form>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Allowed Users</h3>
            {loading ? (
              <p className="text-gray-500 dark:text-gray-400">Loading...</p>
            ) : allowedUsers.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No users added yet.</p>
            ) : (
              <ul className="divide-y dark:divide-gray-700 border dark:border-gray-700 rounded-xl overflow-hidden">
                {allowedUsers.map((email) => (
                  <li key={email} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800">
                    <span className="text-gray-800 dark:text-gray-200 truncate pr-4">{email}</span>
                    <button
                      onClick={() => handleRemoveUser(email)}
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                      title="Remove access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
