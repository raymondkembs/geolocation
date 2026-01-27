import React from "react";
import { useNavigate } from "react-router-dom";

export default function LandingAuth() {
  const navigate = useNavigate();

  return (
    // <div className="relative min-h-screen flex items-center justify-center bg-stone-100 overflow-hidden">

    //   {/* Background triangles */}
    //   <div className="absolute inset-0">
    //     <div
    //       className="absolute top-0 left-0 w-full h-1/2 bg-stone-700"
    //       style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
    //     />
    //     <div
    //       className="absolute bottom-0 right-0 w-full h-1/2 bg-red-400"
    //       style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
    //     />
    //     <div
    //       className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-emerald-700"
    //       style={{ clipPath: "polygon(0 30%, 100% 100%, 0 100%)" }}
    //     />
    //   </div>

    //   {/* Dark overlay to dim background */}
    //   <div className="absolute inset-0 bg-black/10"></div>

    //   {/* Card */}
    //   <div className="relative z-10 w-full max-w-sm mx-4 bg-white shadow-xl rounded-2xl p-8 text-center">
        
    //   <h2 className="text-2xl font-bold text-gray-800 mb-2">
    //         Welcome
    //       </h2>

    //       <p className="text-gray-600 mb-8">
    //         Choose how you want to continue
    //       </p>

    //       <button
    //         onClick={() => navigate("/app")}
    //       className="w-full py-3 mb-4 rounded-lg font-semibold text-white 
    //                  bg-emerald-700 hover:bg-emerald-800
    //                  transition-colors duration-200"
    //     >
    //       Proceed (Customer / Cleaner)
    //     </button>

    //     <button
    //       onClick={() => navigate("/admin-login")}
    //       className="w-full py-3 rounded-lg font-semibold text-white 
    //                  bg-red-600 hover:bg-red-700
    //                  transition-colors duration-200"
    //     >
    //       Admin Login
    //     </button>
    //   </div>
    // </div>

    <div className="relative min-h-screen flex items-center justify-center bg-stone-100 overflow-hidden">

  {/* Afrofuturist circles */}
  <div className="absolute inset-0 pointer-events-none">

    {/* Orbit ring (black) */}
    <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px]
                    -translate-x-1/2 -translate-y-1/2
                    border border-black rounded-full opacity-20" />

    {/* Large green planet */}
    <div className="absolute top-12 left-16 w-[320px] h-[320px]
                    bg-emerald-700 rounded-full
                    border-4 border-black opacity-90" />

    {/* Red orbiting body */}
    <div className="absolute top-1/3 right-24 w-[180px] h-[180px]
                    bg-red-600 rounded-full
                    border-4 border-black opacity-85" />

    {/* Black gravity well */}
    <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px]
                    bg-black rounded-full opacity-85" />

    {/* White signal node */}
    <div className="absolute bottom-32 right-32 w-[140px] h-[140px]
                    bg-white rounded-full
                    border-4 border-red-500 opacity-95" />

    {/* Small green satellites */}
    <div className="absolute top-1/4 left-1/2 w-[60px] h-[60px]
                    bg-emerald-600 rounded-full opacity-80" />
    <div className="absolute bottom-1/4 right-1/3 w-[40px] h-[40px]
                    bg-emerald-600 rounded-full opacity-70" />
  </div>

  {/* Soft dim overlay */}
  <div className="absolute inset-0 bg-black/10" />

  {/* Login Card */}
  <div className="relative z-10 w-full max-w-sm mx-4 bg-white
                  shadow-xl rounded-2xl p-8 text-center">

    <h2 className="text-2xl font-bold text-gray-800 mb-2">
      Welcome
    </h2>

    <p className="text-gray-600 mb-8">
      Choose how you want to continue
    </p>

    <button
      onClick={() => navigate("/app")}
      className="w-full py-3 mb-4 rounded-lg font-semibold text-white
                 bg-emerald-700 hover:bg-emerald-800
                 transition-colors duration-200"
    >
      Proceed (Customer / Cleaner)
    </button>

    <button
      onClick={() => navigate("/admin-login")}
      className="w-full py-3 rounded-lg font-semibold text-white
                 bg-red-600 hover:bg-red-700
                 transition-colors duration-200"
    >
      Admin Login
    </button>
  </div>
</div>

  );
}





