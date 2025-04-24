// src/components/landing.js
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FileText, Brain, Sparkles, Moon, Sun } from 'lucide-react';
import { useTheme } from '../components/theme';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
  const particlesRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Create particles
    const particles = [];
    const particleCount = 150;
    const lightColors = ['#E5E7EB', '#D1D5DB', '#9CA3AF', '#F3F4F6'];
    const darkColors = ['#374151', '#4B5563', '#6B7280', '#9CA3AF'];
    const colors = theme === 'dark' ? darkColors : lightColors;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * 1.5 + 0.5;
      particle.className = 'absolute rounded-full';
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.opacity = '0';
      particlesRef.current.appendChild(particle);
      particles.push(particle);

      gsap.set(particle, {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        opacity: 0
      });

      gsap.to(particle, {
        x: `random(${-50}, ${50})`,
        y: `random(${-30}, ${30})`,
        opacity: theme === 'dark' ? `random(0.1, 0.3)` : `random(0.05, 0.15)`,
        duration: 'random(10, 20)',
        repeat: -1,
        yoyo: true,
        ease: 'none',
        delay: i * 0.02
      });
    }

    const drawConnections = () => {
      const canvas = document.createElement('canvas');
      canvas.className = 'absolute inset-0 w-full h-full';
      canvas.style.opacity = theme === 'dark' ? '0.1' : '0.05';
      particlesRef.current.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      const maxDistance = 50;

      const updateCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = theme === 'dark' ? '#4B5563' : '#D1D5DB';

        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const p1 = particles[i].getBoundingClientRect();
            const p2 = particles[j].getBoundingClientRect();
            
            const distance = Math.sqrt(
              Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
            );

            if (distance < maxDistance) {
              ctx.beginPath();
              ctx.moveTo(p1.x + p1.width/2, p1.y + p1.height/2);
              ctx.lineTo(p2.x + p2.width/2, p2.y + p2.height/2);
              ctx.lineWidth = 0.2;
              ctx.globalAlpha = (1 - (distance / maxDistance)) * 0.15;
              ctx.stroke();
            }
          }
        }
        requestAnimationFrame(updateCanvas);
      };

      updateCanvas();
    };

    drawConnections();

    return () => {
      particles.forEach(particle => particle.remove());
      particlesRef.current?.querySelector('canvas')?.remove();
    };
  }, [theme]);

  const features = [
    {
      icon: FileText,
      title: "Document Processing",
      description: "Upload any document and get instant insights"
    },
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced algorithms understand your content deeply"
    },
    {
      icon: Sparkles,
      title: "Smart Responses",
      description: "Get accurate and contextual answers instantly"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f8f8] to-[#e5e7eb] dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Theme Toggle Button */}
      

      {/* Particle Background */}
      <div 
        ref={particlesRef}
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ perspective: '1000px' }}
      />

      {/* Hero Section */}
      <section className="pt-20 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            {/* Hero Content */}
            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <h1 
                className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight transition-colors duration-300"
              >
                Document Intelligence for the Modern Era
              </h1>
              <p 
                className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-12 leading-relaxed transition-colors duration-300"
              >
                Transform your documents into intelligent conversations. Experience the future 
                of document processing with our advanced AI technology.
              </p>
              <div 
                className="flex flex-col md:flex-row items-center justify-center gap-4"
              >
                <button className="w-full md:w-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-md
                                 hover:bg-black dark:hover:bg-gray-100 transition-colors text-sm font-medium">
                  Start Free Trial
                </button>
                <button className="w-full md:w-auto border border-gray-200 dark:border-gray-700 px-8 py-4 rounded-md
                                 hover:border-gray-900 dark:hover:border-white transition-colors text-sm font-medium 
                                 text-gray-900 dark:text-white">
                  View Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white dark:bg-gray-800 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
              Powerful Features
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg transition-colors duration-300">
              Everything you need to process documents intelligently
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Smart Processing",
                description: "Process documents with unprecedented accuracy using advanced AI"
              },
              {
                title: "Real-time Analysis",
                description: "Get instant insights as you upload your documents"
              },
              {
                title: "Secure Storage",
                description: "Enterprise-grade security for all your documents"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-8 rounded-lg border border-gray-200 dark:border-gray-700 
                         hover:border-gray-900 dark:hover:border-white transition-all duration-300 
                         bg-white dark:bg-gray-800"
              >
                <div className="w-12 h-12 mb-6 rounded-lg bg-gray-100 dark:bg-gray-700 
                              flex items-center justify-center group-hover:bg-gray-900 
                              dark:group-hover:bg-white transition-colors">
                  <span className="text-lg font-medium text-gray-900 dark:text-white 
                                 group-hover:text-white dark:group-hover:text-gray-900">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 
                             transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed 
                             transition-colors duration-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gray-900 dark:bg-gray-950 text-white transition-colors duration-300">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of teams who have already revolutionized their document processing.
          </p>
          <button className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
                           px-8 py-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700
                           transition-colors text-sm font-medium">
            Get Started Now
          </button>
        </div>
      </section>
    </div>
  );
}