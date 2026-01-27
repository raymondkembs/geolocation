import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, firestore } from "../firebaseConfig";
import { signInAnonymously } from "firebase/auth";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { createAdminProfile, getAdminProfile } from "../services/adminService";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const uid = "superAdmin"; // fixed UID for your admin
      let profile = await getAdminProfile(uid);

      // Create superAdmin if missing
      if (!profile) {
        await createAdminProfile({ uid, username: "superadmin", password: "super123456" });
        alert("SuperAdmin profile created! Please log in again.");
        return;
      }

      // Validate credentials
      if (username !== profile.username || password !== profile.password) {
        alert("Incorrect username or password");
        return;
      }

      // Anonymous login just for session tracking
      const userCredential = await signInAnonymously(auth);
      const sessionUid = userCredential.user.uid;

      // Create session in adminSessions
      await setDoc(doc(firestore, "adminSessions", sessionUid), {
        uid: sessionUid,
        isAdmin: true,
        loggedInAt: new Date()
      });

      localStorage.setItem("isAdmin", "true");

      navigate("/admin_dashboard");

    } catch (err) {
      console.error("Admin login error:", err);
      alert("Login failed");
    }
  };

  return ( 
 
     <div className="relative min-h-screen flex items-center justify-center bg-stone-100 overflow-hidden">

        {/* Background circles */}
        <div className="absolute inset-0">

          {/* Big green circle (top-left) */}
          <div className="absolute -top-32 -left-32 w-[420px] h-[420px]
                          bg-emerald-700 rounded-full
                          border-4 border-black opacity-90" />

          {/* Medium red circle (top-right) */}
          <div className="absolute top-20 -right-24 w-[280px] h-[280px]
                          bg-red-600 rounded-full
                          border-4 border-black opacity-85" />

          {/* Large black circle (bottom-right) */}
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px]
                          bg-black rounded-full opacity-80" />

          {/* White accent circle (bottom-left) */}
          <div className="absolute bottom-24 left-20 w-[180px] h-[180px]
                          bg-white rounded-full
                          border-4 border-red-500 opacity-90" />

          {/* Small floating green */}
          <div className="absolute top-1/2 left-10 w-[90px] h-[90px]
                          bg-emerald-600 rounded-full
                          border-2 border-black opacity-80" />

          {/* Small floating red */}
          <div className="absolute bottom-1/3 right-24 w-[70px] h-[70px]
                          bg-red-500 rounded-full
                          border-2 border-black opacity-80" />
        </div>

        {/* Dim overlay */}
        <div className="absolute inset-0 bg-black/10" />

        {/* Login Card */}
        <div className="relative z-10 w-full max-w-sm mx-4 bg-white
                        shadow-xl rounded-2xl p-8">

          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Admin Login
          </h2>

          <input
            className="w-full border border-gray-300 p-3 rounded-lg mb-4
                      focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Admin Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="w-full border border-gray-300 p-3 rounded-lg mb-6
                      focus:outline-none focus:ring-2 focus:ring-red-500"
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-lg font-semibold text-white
                      bg-red-600 hover:bg-red-700
                      transition-colors duration-200"
          >
            Login
          </button>
        </div>
      </div>

  );
}
