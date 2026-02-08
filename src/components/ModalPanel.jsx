export default function ModalPanel({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-2xl shadow w-[40%] h-auto">
        <div className="flex items-center justify-between mb-4"> 
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">{title}</h2>
          <button
            className="text-sm text-gray-600 hover:text-gray-900"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="flex items-start justify-center flex-col p-2 border-t-2 border-gray-300">{children}</div>
      </div>
    </div>
  );
}


//  import React from "react";
 
// export default function ModalPanel({ title, onClose, children }) {
//   return (
//     <div className="bg-white p-6 rounded-2xl shadow w-full">
//       <div className="flex items-center justify-between mb-4">
//         <h2 className="text-xl font-semibold">{title}</h2>
//         <button
//           className="text-sm text-gray-600 hover:text-gray-900"
//           onClick={onClose}
//         >
//           Close
//         </button>
//       </div>
//       <div>{children}</div>
//     </div>
//   );
// }

