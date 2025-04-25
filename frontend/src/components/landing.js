// src/components/landing.js
import { useEffect, useRef, useState } from 'react';

import { FaDiscord, FaXTwitter, FaMedium } from "react-icons/fa6";

// --- Icons (Minimalist) ---
const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 8h14M8 1l7 7-7 7" />
  </svg>
);
const UpRightArrow = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 14L14 2M2 2h12v12" />
  </svg>
);
const TechIcon = () => ( // Simplified geometric icon
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="16" height="16" />
    <line x1="2" y1="10" x2="18" y2="10" />
    <line x1="10" y1="2" x2="10" y2="18" />
    <circle cx="10" cy="10" r="3" />
  </svg>
);

// --- Main Component ---
export default function Landing() {
  const canvasRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setIsMounted(true);
    document.body.classList.add('no-scroll', 'crt-effect');

    // --- Enhanced Canvas Background ---
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrame;
    let gridPoints = [];
    const gridSize = 30; // Size of grid cells
    let cols, rows;
    let time = 0;

    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const initializeGrid = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.ceil(canvas.width / gridSize);
      rows = Math.ceil(canvas.height / gridSize);
      gridPoints = [];
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          gridPoints.push({
            x: j * gridSize,
            y: i * gridSize,
            baseOpacity: Math.random() * 0.1 + 0.02, // Base faintness
            pulseSpeed: Math.random() * 0.01 + 0.005,
            pulseOffset: Math.random() * Math.PI * 2,
          });
        }
      }
      // Initial clear
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const draw = () => {
      time += 0.01;
      // Slightly less aggressive clear for persistence
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      gridPoints.forEach(p => {
        // Pulsing effect
        const pulse = (Math.sin(time * 5 + p.pulseOffset) + 1) / 2; // 0 to 1 value
        const pulseOpacity = p.baseOpacity + pulse * 0.1; // Make pulse noticeable

        // Mouse interaction - increase opacity near cursor
        const dist = Math.hypot(p.x - mousePos.current.x, p.y - mousePos.current.y);
        const mouseFactor = Math.max(0, 1 - dist / 200); // Effect radius
        const finalOpacity = Math.min(0.8, pulseOpacity + mouseFactor * 0.4); // Cap opacity

        // Draw grid point (e.g., small square or cross)
        ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`;
        // Simple square:
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2);

        // Optional: Draw connecting lines (can be performance heavy)
        // if (Math.random() < 0.01) { // Draw sparse lines
        //   const neighborIndex = Math.floor(Math.random() * gridPoints.length);
        //   const n = gridPoints[neighborIndex];
        //   ctx.strokeStyle = `rgba(255, 255, 255, ${finalOpacity * 0.3})`;
        //   ctx.lineWidth = 0.5;
        //   ctx.beginPath();
        //   ctx.moveTo(p.x, p.y);
        //   ctx.lineTo(n.x, n.y);
        //   ctx.stroke();
        // }
      });

      animationFrame = requestAnimationFrame(draw);
    };

    initializeGrid();
    draw();
    window.addEventListener('resize', initializeGrid);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', initializeGrid);
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.classList.remove('no-scroll', 'crt-effect');
    };
  }, []);

  return (
    <div className={`relative h-screen w-screen overflow-hidden bg-black text-white font-mono antialiased selection:bg-white selection:text-black transition-opacity duration-500 ${isMounted ? 'opacity-100' : 'opacity-0'} crt-effect-container`}>
      {/* Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 opacity-50" // Adjust opacity
      />
      {/* CSS Overlays */}
      <div className="absolute inset-0 z-1 pointer-events-none opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:25px_25px]" />
      <div className="absolute inset-0 z-2 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0.1)_50%,transparent_50%)] bg-[size:100%_3px] animate-scanline" />
      <div className="absolute inset-0 z-3 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.6)]" />

      {/* Main Layout Grid */}
      <div className="relative z-10 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr_auto] h-full border-4 border-white">
        <Header />
        <MainArea />
        <Sidebar />
        <Footer />
      </div>
    </div>
  );
}

// --- Components ---
const Header = () => (
  // Positioned within the main grid
  <header className="col-span-2 row-start-1 row-end-2 border-b-4 border-white">
    <div className="flex justify-between items-stretch h-full">
      <Logo />
      <NavMenu />
    </div>
  </header>
);

const Logo = () => (
  <a href="/" className="group flex items-center px-6 border-r-4 border-white hover:bg-white hover:text-black transition-none duration-0">
    <span className="text-3xl font-bold tracking-tighter">INITIA</span>
  </a>
);

const NavMenu = () => (
  <div className="flex items-stretch">
    {['DEVELOPERS', 'USERS', 'APP'].map(item => (
      <a
        key={item}
        href="#"
        className="flex items-center px-8 border-l-4 border-white text-xs tracking-[0.15em] font-semibold hover:bg-white hover:text-black transition-none duration-0"
      >
        {item}
      </a>
    ))}
  </div>
);

// Modified Main Area to include Ticker
const MainArea = () => (
  <main className="col-start-1 col-end-2 row-start-2 row-end-3 p-10 flex justify-between overflow-hidden">
      {/* Hero Text and its associated elements */}
      <div className="flex flex-col justify-between h-full max-w-[calc(100%-12rem)]"> {/* Limit width */}
        <HeroText />
        <StatusDisplay />
        <Partners />
      </div>
      {/* Vertical Ticker aligned to the right of the main content */}
      <VerticalTicker />
  </main>
);

const HeroText = () => (
  <div className="space-y-4">
    <h1 className="text-[6.5rem] font-bold uppercase tracking-tight leading-none">
      Enter the<br />Multichain<br />Garden of Eden
    </h1>
    <p className="text-sm max-w-md leading-normal text-white/80 font-medium pt-2">
      Initia unites full-stack apps and unlocks value through interwoven infrastructure
      and aligned economics.
    </p>
    <div className="flex items-center space-x-4 pt-6">
      <ActionButton text="BUILD" primary />
      <ActionButton text="START" />
    </div>
  </div>
);

const StatusDisplay = () => (
  <div className="border-2 border-white/50 p-3 mt-6 max-w-md">
    <div className="flex justify-between items-center mb-2">
      <span className="text-xs tracking-widest font-semibold text-white/80">SYSTEM STATUS</span>
      <span className="w-3 h-3 bg-green-500 animate-pulse"></span>
    </div>
    <div className="h-16 bg-black/50 p-2 overflow-hidden relative">
       <p className="text-[10px] text-green-400 whitespace-nowrap"> INITIA CORE_v1.0 ONLINE</p>
       <p className="text-[10px] text-green-400 whitespace-nowrap"> INTERWOVEN_STACK: STABLE</p>
       <p className="text-[10px] text-green-400 whitespace-nowrap"> ECONOMY_MODULE: ACTIVE</p>
       <p className="text-[10px] text-green-400 whitespace-nowrap"> LISTENING FOR CONNECTIONS...</p>
       <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black/50 to-transparent"></div>
    </div>
  </div>
);

const Partners = () => (
  <div className="border-t-2 border-white/50 mt-6 pt-4">
     <p className="text-[10px] text-white/50 tracking-widest mb-3">PARTNERS & BACKERS:</p>
     <div className="flex items-center space-x-6">
        {['BINANCE', 'DELPHI', 'HACK VC', 'NASCENT', 'FIGMENT'].map((partner, i) => (
          <span key={i} className="text-xs font-bold tracking-widest text-white/60 cursor-default hover:text-white transition-none">
            {partner}
          </span>
        ))}
     </div>
  </div>
);

const ActionButton = ({ text, primary }) => (
  <button
    className={`
      group relative px-6 py-3 border-2 border-white bg-black
      text-sm font-bold tracking-widest
      hover:bg-white hover:text-black transition-none duration-0
      active:translate-y-px active:translate-x-px /* Subtle press effect */
      ${primary ? 'shadow-[4px_4px_0px_#FFF]' : 'hover:shadow-[4px_4px_0px_#FFF]'}
    `}
  >
    <span className="flex items-center gap-3">
      <span>{text}</span>
      <ArrowRight />
    </span>
  </button>
);

// New Vertical Ticker Component
const VerticalTicker = () => {
  // Example data structure for cards
  const tickerData = [
    { type: 'BLOCK', id: 847592, hash: '0x4a...f3', status: 'CONFIRMED' },
    { type: 'SYNC', value: '99.98%', status: 'OK' },
    { type: 'PEERS', value: '12/16', status: 'CONNECTED' },
    { type: 'MODULE', id: 'INTERWOVEN_X', status: 'LOADED' },
    { type: 'TXPOOL', value: '45 PENDING', status: 'NORMAL' },
    { type: 'ALERT', code: 'LOW_ORBIT', severity: 'WARN', status: 'ACTIVE' },
    { type: 'NODE', id: 'VALIDATOR-01', status: 'OPTIMAL' },
    { type: 'BLOCK', id: 847591, hash: '0xe1...a9', status: 'CONFIRMED' },
    { type: 'SECURITY', id: 'SCAN_#33a', status: 'PASSED' },
    { type: 'SIG', source: 'LAYER_Z', status: 'VALID' },
    // Duplicate data for seamless loop
    { type: 'BLOCK', id: 847592, hash: '0x4a...f3', status: 'CONFIRMED' },
    { type: 'SYNC', value: '99.98%', status: 'OK' },
    { type: 'PEERS', value: '12/16', status: 'CONNECTED' },
    { type: 'MODULE', id: 'INTERWOVEN_X', status: 'LOADED' },
    { type: 'TXPOOL', value: '45 PENDING', status: 'NORMAL' },
    { type: 'ALERT', code: 'LOW_ORBIT', severity: 'WARN', status: 'ACTIVE' },
    { type: 'NODE', id: 'VALIDATOR-01', status: 'OPTIMAL' },
    { type: 'BLOCK', id: 847591, hash: '0xe1...a9', status: 'CONFIRMED' },
    { type: 'SECURITY', id: 'SCAN_#33a', status: 'PASSED' },
    { type: 'SIG', source: 'LAYER_Z', status: 'VALID' },
  ];

  const getStatusColor = (status, type) => {
    if (type === 'ALERT') return 'text-red-500';
    switch (status) {
      case 'CONFIRMED':
      case 'OK':
      case 'CONNECTED':
      case 'LOADED':
      case 'OPTIMAL':
      case 'PASSED':
      case 'VALID':
      case 'ACTIVE': // Keep ALERT status text red via specific class
        return 'text-green-400';
      case 'PENDING':
        return 'text-yellow-400';
      default:
        return 'text-white/60';
    }
  };

  return (
    <div className="w-44 h-full border-l-2 border-white/50 overflow-hidden relative ml-6">
       <div className="absolute inset-0 animate-vertical-ticker">
         {tickerData.map((item, index) => (
           <div
             key={index}
             className="border border-white/20 bg-black/30 m-2 p-2 space-y-1"
           >
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-white/80">{item.type}</span>
                <span className={`text-[9px] font-semibold ${getStatusColor(item.status, item.type)}`}>{item.status}</span>
             </div>
             {item.id && <p className="text-[9px] text-white/60">ID: {item.id}</p>}
             {item.hash && <p className="text-[9px] text-white/60">HASH: {item.hash}</p>}
             {item.value && <p className="text-[9px] text-white/60">VAL: {item.value}</p>}
             {item.code && <p className="text-[9px] text-red-500">CODE: {item.code}</p>}
             {item.severity && <p className="text-[9px] text-red-500">SEV: {item.severity}</p>}
             {item.source && <p className="text-[9px] text-white/60">SRC: {item.source}</p>}
           </div>
         ))}
       </div>
       <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black to-transparent pointer-events-none z-10" />
       <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />
    </div>
  );
};

const Sidebar = () => (
  // Explicitly positioned in grid
  <aside className="col-start-2 col-end-3 row-start-2 row-end-3 border-l-4 border-white p-8 flex flex-col justify-between">
     <div className="space-y-12">
      {[
        { title: 'Interwoven Stack', icon: <TechIcon /> },
        { title: 'Interwoven Economy', icon: <TechIcon /> }
      ].map((item, i) => (
        <div key={i} className="group space-y-2 cursor-default">
          <div className="text-white opacity-80 group-hover:opacity-100">{item.icon}</div>
          <span className="block text-base font-semibold text-white tracking-normal group-hover:underline">
            {item.title}
          </span>
        </div>
      ))}
     </div>

     <div className="space-y-4">
       <SocialLink Icon={FaDiscord} text="Discord" href="#" />
       <SocialLink Icon={FaXTwitter} text="X (Twitter)" href="#" />
       <SocialLink Icon={FaMedium} text="Medium" href="#" />
     </div>
  </aside>
);

const SocialLink = ({ Icon, text, href }) => (
   <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 group text-white/70 hover:text-white transition-none duration-0">
      <Icon className="w-4 h-4 flex-shrink-0 opacity-70 group-hover:opacity-100" />
      <span className="text-[11px] font-medium tracking-wider group-hover:underline">{text}</span>
   </a>
);

const Footer = () => (
  <footer className="col-span-2 row-start-3 row-end-4 border-t-4 border-white">
    <div className="flex justify-end items-center h-full">
      <div className="flex items-stretch h-full">
        <span className="flex items-center px-6 border-l-4 border-white text-[10px] text-white/60 tracking-widest">© INITIA 2024</span>
        <span className="flex items-center px-6 border-l-4 border-white text-[10px] text-white/60 hover:text-white hover:bg-white/10 cursor-pointer transition-none duration-0">Privacy</span>
        <span className="flex items-center px-6 border-l-4 border-white text-[10px] text-white/60 hover:text-white hover:bg-white/10 cursor-pointer transition-none duration-0">Terms</span>
        <AirdropButton />
      </div>
    </div>
  </footer>
);

const AirdropButton = () => (
  <button className="group flex items-center space-x-2 border-l-4 border-white px-6 h-full hover:bg-white hover:text-black transition-none duration-0">
    <span className="text-[10px] font-bold tracking-widest">CLAIM AIRDROP</span>
    <UpRightArrow />
  </button>
);

/* Add these styles to your global CSS (e.g., index.css) */
/*
body.no-scroll {
  overflow: hidden;
}

body.crt-effect .crt-effect-container {
  // Optional: Add subtle curvature if desired
  // perspective: 1000px;
  // transform: perspective(1000px) rotateX(0.5deg);
}

@keyframes scanline {
  0% { background-position: 0 0; }
  100% { background-position: 0 100%; } // Speed depends on bg-size height
}

.animate-scanline {
  animation: scanline 10s linear infinite; // Adjust duration for speed
}

@keyframes vertical-ticker {
  0% { transform: translateY(0); }
  100% { transform: translateY(-50%); } // Scrolls exactly half the height (since content is duplicated)
}

.animate-vertical-ticker {
  animation: vertical-ticker 40s linear infinite; // Adjust duration for speed
}
*/