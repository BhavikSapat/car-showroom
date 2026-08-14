import React, { useState } from "react";
import {
  Download,
  Monitor,
  X,
  CheckCircle2,
  ArrowRight,
  ArrowUp,
} from "lucide-react";

// 5 car images with transparent/white backgrounds
const carImages = [
  { id: 1, src: "/black.webp", alt: "Black Car" },
  { id: 7, src: "/orange.webp", alt: "Orange Car" },
  { id: 2, src: "/blue.webp", alt: "Blue Car" },
  { id: 10, src: "/rolls.webp", alt: "Rolls Royce" },
  { id: 4, src: "/gray.webp", alt: "Gray Car" },
  { id: 5, src: "/mclaren.webp", alt: "McLaren" },
  { id: 8, src: "/porche.webp", alt: "Porsche" },
  { id: 12, src: "/yellow.webp", alt: "Yellow Car" },
];

interface LandingPageProps {
  onLaunchWebApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchWebApp }) => {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Duplicated array to create a seamless infinite marquee effect
  const marqueeCars = [...carImages, ...carImages, ...carImages];

  const triggerDownloadAction = () => {
    const link = document.createElement("a");

    link.href =
      "https://github.com/BhavikSapat/car-showroom/releases/download/v1.0.3/GTAutos-Setup.exe";

    link.target = "_blank";
    link.rel = "noopener noreferrer";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);

    setTimeout(() => {
      setDownloadSuccess(false);
      setShowDownloadModal(false);
    }, 2200);
  };

  return (
    <div
      className="max-h-screen bg-white text-[#111111] relative overflow-x-hidden select-none flex flex-col items-center"
      style={{
        fontFamily: '"Bricolage Grotesque", "Inter", sans-serif',
        fontWeight: 400,
      }}
    >
      {/* Import Lexend Tera, Bricolage Grotesque & Inter Fonts & Marquee Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500&family=Inter:wght@400;500;600;700&family=Lexend+Tera:wght@500;600;700;800;900&display=swap');
        
        @keyframes marqueeLeftToRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
        
        .animate-marquee-ltr {
          display: flex;
          width: max-content;
          animation: marqueeLeftToRight 100s linear infinite;
        }
        
        .marquee-container:hover .animate-marquee-ltr {
          // animation-play-state: paused;
        }
      `}</style>

      {/* Subtle Top Background Glow (Matches original subtle lighting) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-b from-yellow-50/50 to-transparent blur-3xl pointer-events-none" />

      {/* Navigation Bar */}
      <header className="relative z-10  max-w-full mx-auto px-6 py-4 w-full flex items-center justify-center md:justify-between border-b md:border-0">
        {/* Left: Brand Name */}
        <div
          className="flex items-center cursor-pointer group"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <span className="font-heading uppercase text-[15px] md:text-[20px] font-bold tracking-tight text-[#111111]">
            Grand Theft Autos
          </span>
        </div>

        {/* Right: Download Desktop App Button (Hidden on Mobile view) */}
        <div className="hidden md:flex md:gap-2">
          <div>
            <button
              onClick={onLaunchWebApp}
              className="bg-white hover:bg-[#e04b2b]/20 text-[#FF5A36]  font-medium px-2 py-1 md:px-7 md:py-3 rounded-full md:text-[14px] transition-all duration-200 cursor-pointer active:scale-98 shadow-sm border border-[#FF5A36] flex items-center gap-1 md:gap-2 group"
            >
              <ArrowUp className="w-3 h-3 md:w-4 md:h-4 text-[#FF5A36] group-hover:-rotate-12 group-hover:scale-110 transition-transform " />
              <span className="font-heading uppercase text-[10px] md:text-xs tracking-wider">
                Open Web App
              </span>
            </button>
          </div>
          <div className="hidden md:block">
            <button
              onClick={() => setShowDownloadModal(true)}
              className="bg-[#FF5A36] hover:bg-[#e04b2b] text-white font-medium px-7 py-3 rounded-full text-[14px] transition-all duration-200 cursor-pointer active:scale-98 shadow-sm flex items-center gap-2 group"
            >
              <Download className="w-4 h-4 text-white group-hover:-rotate-12 group-hover:scale-110 " />
              <span className="font-heading uppercase text-xs tracking-wider">
                Download Desktop App
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 pt-8 pb-6 max-w-5xl mx-auto text-center px-4 flex flex-col items-center ">
        {/* <main className="relative z-10 pt-8  max-w-5xl mx-auto text-center px-4 flex-1 flex flex-col justify-center items-center"> */}
        {/* Main Headline with Lexend Tera font & uppercase */}
        <h1 className="font-heading uppercase text-[32px] sm:text-[44px] md:text-[56px] font-extrabold tracking-tight leading-[1.12] text-[#111111] mb-6">
          Run Your{" "}
          <span className="text-[#FF5A36] font-heading uppercase text-[32px] sm:text-[44px] md:text-[56px] font-extrabold tracking-tight leading-[1.12] text-[#111111] mb-6">
            Showroom
          </span>{" "}
          All in One Place.
        </h1>

        {/* Subtitle / Description */}
        <p className="text-[#666666] text-[15px] md:text-[18px] max-w-[540px] mx-auto leading-[1.6] mb-10 font-normal">
          A smarter way to manage vehicles, customers and everyday showroom
          operations.{" "}
        </p>
        <button
          onClick={onLaunchWebApp}
          className="md:hidden bg-white hover:bg-[#e04b2b]/20 text-[#FF5A36] font-medium px-6 py-3 rounded-full text-xs transition-all duration-200 cursor-pointer active:scale-95 shadow-sm border border-[#FF5A36] flex items-center gap-2 group mb-8"
        >
          <ArrowUp className="w-4 h-4 text-[#FF5A36] group-hover:-rotate-12 group-hover:scale-110 transition-transform" />

          <span className="font-heading uppercase tracking-wider">
            Open Web App
          </span>
        </button>
        {/* Renamed Web App Button */}
      </main>

      {/* Marquee Carousel Section (Left to Right, Pause on Hover) */}
      <section className="relative w-full mt-6 md:-mt-25 pt-0 pb-8 overflow-hidden marquee-container">
        {/* <section className="relative w-full pt-0 pb-20 overflow-hidden marquee-container"> */}
        {/* Left White Gradient Fade */}
        <div className="absolute left-0 top-0 bottom-0 w-5 md:w-15 bg-gradient-to-r from-white via-white/50 to-transparent z-20 pointer-events-none" />

        {/* Moving Track */}
        <div className="animate-marquee-ltr items-center">
          {marqueeCars.map((car, index) => (
            <div
              key={`${car.id}-${index}`}
              className="flex-shrink-0 px-3 sm:px-6 md:px-22 w-[350px] md:w-[1000px]"
            >
              <img
                src={car.src}
                alt={car.alt}
                className="w-full h-auto object-contain mix-blend-multiply"
                style={{ WebkitUserDrag: "none" }}
              />
            </div>
          ))}
        </div>

        {/* Right White Gradient Fade */}
        <div className="absolute right-0 top-0 bottom-0 w-5 md:w-15 bg-gradient-to-l from-white via-white/50 to-transparent z-20 pointer-events-none" />
      </section>

      {/* Desktop App Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAEAEA] rounded-3xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left">
            <button
              onClick={() => setShowDownloadModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#888888] hover:text-[#111111] hover:bg-[#F7F7F5]"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex gap-2 items-center mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#FF5A36]/10 text-[#FF5A36] flex items-center justify-center">
                <Monitor className="w-5 h-5" />
              </div>

              <h3 className="text-lg font-bold text-[#111111]">
                Grand Theft Autos Desktop Application
              </h3>
            </div>
            <p className="text-xs text-[#666666] mt-1 leading-relaxed">
              Standalone Desktop Edition for Windows. <br />
              Enjoy offline access and direct hardware scanner synchronization.
            </p>
            <p className="text-xs text-[#666666]-80 mt-1 leading-relaxed">
              Developed from Electron.
            </p>
            {downloadSuccess ? (
              <div className="mt-2 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Desktop installer link configured. Direct download starting...
                </span>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <button
                  onClick={triggerDownloadAction}
                  className="w-full py-3 px-4 text-xs font-semibold text-white bg-[#FF5A36] rounded-xl hover:bg-[#E04B2B] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Grand Theft Autos Desktop Setup ( .exe )</span>
                </button>

                {/* <button
                  onClick={() => {
                    setShowDownloadModal(false);
                    onLaunchWebApp();
                  }}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-[#111111] bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl hover:bg-[#EAEAEA] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Launch Web Application Instead</span>
                </button> */}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;

// import React, { useState } from "react";
// import {
//   Download,
//   Monitor,
//   X,
//   CheckCircle2,
//   ArrowRight,
//   ArrowUp,
// } from "lucide-react";

// // 5 car images with transparent/white backgrounds
// const carImages = [
//   // { id: 1, src: "/omin.webp", alt: "Omni" },
//   { id: 5, src: "/ferrari.webp", alt: "Ferrari" },
//   { id: 3, src: "/rolls.webp", alt: "Rolls Royce" },
//   // { id: 6, src: "/lambo.webp", alt: "Lamborghini" },
//   { id: 2, src: "/mercedes.webp", alt: "Mercedes" },
//   { id: 4, src: "/porche.webp", alt: "Porsche" },
//   { id: 7, src: "/mclaren.webp", alt: "McLaren" },
// ];

// interface LandingPageProps {
//   onLaunchWebApp: () => void;
// }

// export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchWebApp }) => {
//   const [showDownloadModal, setShowDownloadModal] = useState(false);
//   const [downloadSuccess, setDownloadSuccess] = useState(false);

//   // Duplicated array to create a seamless infinite marquee effect
//   const marqueeCars = [...carImages, ...carImages, ...carImages];

//   const triggerDownloadAction = () => {
//     const link = document.createElement("a");

//     link.href =
//       "https://github.com/BhavikSapat/car-showroom/releases/download/v1.0.3/GTAutos-Setup.exe";

//     link.target = "_blank";
//     link.rel = "noopener noreferrer";

//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);

//     setDownloadSuccess(true);

//     setTimeout(() => {
//       setDownloadSuccess(false);
//       setShowDownloadModal(false);
//     }, 2200);
//   };

//   return (
//     <div
//       className="min-h-screen bg-white text-[#111111] relative overflow-x-hidden select-none flex flex-col items-center"
//       style={{
//         fontFamily: '"Bricolage Grotesque", "Inter", sans-serif',
//         fontWeight: 400,
//       }}
//     >
//       {/* Import Lexend Tera, Bricolage Grotesque & Inter Fonts & Marquee Animations */}
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500&family=Inter:wght@400;500;600;700&family=Lexend+Tera:wght@500;600;700;800;900&display=swap');

//         @keyframes marqueeLeftToRight {
//           0% { transform: translateX(-50%); }
//           100% { transform: translateX(0%); }
//         }

//         .animate-marquee-ltr {
//           display: flex;
//           width: max-content;
//           animation: marqueeLeftToRight 70s linear infinite;
//         }

//         .marquee-container:hover .animate-marquee-ltr {
//           // animation-play-state: paused;
//         }
//       `}</style>

//       {/* Subtle Top Background Glow (Matches original subtle lighting) */}
//       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-b from-yellow-50/50 to-transparent blur-3xl pointer-events-none" />

//       {/* Navigation Bar */}
//       <header className="relative z-10  max-w-full mx-auto px-6 py-4 w-full flex items-center justify-center md:justify-between border-b md:border-0">
//         {/* Left: Brand Name */}
//         <div
//           className="flex items-center cursor-pointer group"
//           onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
//         >
//           <span className="font-heading uppercase text-[15px] md:text-[20px] font-bold tracking-tight text-[#111111]">
//             Grand Theft Autos
//           </span>
//         </div>

//         {/* Right: Download Desktop App Button (Hidden on Mobile view) */}
//         <div className="hidden md:flex md:gap-2">
//           <div>
//             <button
//               onClick={onLaunchWebApp}
//               className="bg-white hover:bg-[#e04b2b]/20 text-[#FF5A36]  font-medium px-2 py-1 md:px-7 md:py-3 rounded-full md:text-[14px] transition-all duration-200 cursor-pointer active:scale-98 shadow-sm border border-[#FF5A36] flex items-center gap-1 md:gap-2 group"
//             >
//               <ArrowUp className="w-3 h-3 md:w-4 md:h-4 text-[#FF5A36] group-hover:-rotate-12 group-hover:scale-110 transition-transform " />
//               <span className="font-heading uppercase text-[10px] md:text-xs tracking-wider">
//                 Open Web App
//               </span>
//             </button>
//           </div>
//           <div className="hidden md:block">
//             <button
//               onClick={() => setShowDownloadModal(true)}
//               className="bg-[#FF5A36] hover:bg-[#e04b2b] text-white font-medium px-7 py-3 rounded-full text-[14px] transition-all duration-200 cursor-pointer active:scale-98 shadow-sm flex items-center gap-2 group"
//             >
//               <Download className="w-4 h-4 text-white group-hover:-rotate-12 group-hover:scale-110 " />
//               <span className="font-heading uppercase text-xs tracking-wider">
//                 Download Desktop App
//               </span>
//             </button>
//           </div>
//         </div>
//       </header>

//       {/* Hero Section */}
//       <main className="relative z-10 pt-8 pb-6 max-w-5xl mx-auto text-center px-4 flex flex-col items-center ">
//         {/* <main className="relative z-10 pt-8  max-w-5xl mx-auto text-center px-4 flex-1 flex flex-col justify-center items-center"> */}
//         {/* Main Headline with Lexend Tera font & uppercase */}
//         <h1 className="font-heading uppercase text-[32px] sm:text-[44px] md:text-[56px] font-extrabold tracking-tight leading-[1.12] text-[#111111] mb-6">
//           Run Your{" "}
//           <span className="text-[#FF5A36] font-heading uppercase text-[32px] sm:text-[44px] md:text-[56px] font-extrabold tracking-tight leading-[1.12] text-[#111111] mb-6">
//             Showroom
//           </span>{" "}
//           All in One Place.
//         </h1>

//         {/* Subtitle / Description */}
//         <p className="text-[#666666] text-[15px] md:text-[18px] max-w-[540px] mx-auto leading-[1.6] mb-10 font-normal">
//           A smarter way to manage vehicles, customers and everyday showroom
//           operations.{" "}
//         </p>
//         <button
//           onClick={onLaunchWebApp}
//           className="md:hidden bg-white hover:bg-[#e04b2b]/20 text-[#FF5A36] font-medium px-6 py-3 rounded-full text-xs transition-all duration-200 cursor-pointer active:scale-95 shadow-sm border border-[#FF5A36] flex items-center gap-2 group mb-8"
//         >
//           <ArrowUp className="w-4 h-4 text-[#FF5A36] group-hover:-rotate-12 group-hover:scale-110 transition-transform" />

//           <span className="font-heading uppercase tracking-wider">
//             Open Web App
//           </span>
//         </button>
//         {/* Renamed Web App Button */}
//       </main>

//       {/* Marquee Carousel Section (Left to Right, Pause on Hover) */}
//       <section className="relative w-full mt-6 md:-mt-25 pt-0 pb-8 overflow-hidden marquee-container">
//         {/* <section className="relative w-full pt-0 pb-20 overflow-hidden marquee-container"> */}
//         {/* Left White Gradient Fade */}
//         <div className="absolute left-0 top-0 bottom-0 w-5 md:w-15 bg-gradient-to-r from-white via-white/50 to-transparent z-20 pointer-events-none" />

//         {/* Moving Track */}
//         <div className="animate-marquee-ltr items-center">
//           {marqueeCars.map((car, index) => (
//             <div
//               key={`${car.id}-${index}`}
//               className="flex-shrink-0 px-3 sm:px-6 md:px-22 w-[350px] md:w-[1000px]"
//             >
//               <img
//                 src={car.src}
//                 alt={car.alt}
//                 className="w-full h-auto object-contain mix-blend-multiply"
//                 style={{ WebkitUserDrag: "none" }}
//               />
//             </div>
//           ))}
//         </div>

//         {/* Right White Gradient Fade */}
//         <div className="absolute right-0 top-0 bottom-0 w-5 md:w-15 bg-gradient-to-l from-white via-white/50 to-transparent z-20 pointer-events-none" />
//       </section>

//       {/* Desktop App Download Modal */}
//       {showDownloadModal && (
//         <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
//           <div className="bg-white border border-[#EAEAEA] rounded-3xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left">
//             <button
//               onClick={() => setShowDownloadModal(false)}
//               className="absolute top-4 right-4 p-1.5 rounded-full text-[#888888] hover:text-[#111111] hover:bg-[#F7F7F5]"
//             >
//               <X className="w-4 h-4" />
//             </button>
//             <div className="flex gap-2 items-center mb-4">
//               <div className="w-10 h-10 rounded-xl bg-[#FF5A36]/10 text-[#FF5A36] flex items-center justify-center">
//                 <Monitor className="w-5 h-5" />
//               </div>

//               <h3 className="text-lg font-bold text-[#111111]">
//                 Grand Theft Autos Desktop Application
//               </h3>
//             </div>
//             <p className="text-xs text-[#666666] mt-1 leading-relaxed">
//               Standalone Desktop Edition for Windows. <br />
//               Enjoy offline access and direct hardware scanner synchronization.
//             </p>
//             <p className="text-xs text-[#666666]-80 mt-1 leading-relaxed">
//               Developed from Electron.
//             </p>
//             {downloadSuccess ? (
//               <div className="mt-2 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
//                 <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
//                 <span>
//                   Desktop installer link configured. Direct download starting...
//                 </span>
//               </div>
//             ) : (
//               <div className="mt-5 space-y-3">
//                 <button
//                   onClick={triggerDownloadAction}
//                   className="w-full py-3 px-4 text-xs font-semibold text-white bg-[#FF5A36] rounded-xl hover:bg-[#E04B2B] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
//                 >
//                   <Download className="w-4 h-4" />
//                   <span>Download Grand Theft Autos Desktop Setup ( .exe )</span>
//                 </button>

//                 {/* <button
//                   onClick={() => {
//                     setShowDownloadModal(false);
//                     onLaunchWebApp();
//                   }}
//                   className="w-full py-2.5 px-4 text-xs font-semibold text-[#111111] bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl hover:bg-[#EAEAEA] transition-all flex items-center justify-center gap-2 cursor-pointer"
//                 >
//                   <span>Launch Web Application Instead</span>
//                 </button> */}
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default LandingPage;
