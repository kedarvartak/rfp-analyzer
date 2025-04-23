// src/components/landing.js
import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { FileText, Brain, Sparkles } from 'lucide-react';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Refs for GSAP animations
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const ctaRef = useRef(null);
  const featuresRef = useRef(null);
  const bgAnimationRef = useRef(null);

  useEffect(() => {
    // Hero section animations
    const heroTl = gsap.timeline({
      defaults: { ease: "power3.out" }
    });

    heroTl.from(titleRef.current, {
      y: 100,
      opacity: 0,
      duration: 1.2
    })
    .from(subtitleRef.current, {
      y: 50,
      opacity: 0,
      duration: 1
    }, "-=0.8")
    .from(ctaRef.current, {
      scale: 0.8,
      opacity: 0,
      duration: 0.6
    }, "-=0.4");

    // Animated background pattern
    gsap.to(".floating-square", {
      y: "random(-100, 100)",
      x: "random(-100, 100)",
      rotation: "random(-360, 360)",
      duration: "random(10, 20)",
      repeat: -1,
      yoyo: true,
      ease: "none",
      stagger: {
        amount: 4,
        grid: "auto",
      }
    });

    // Features section scroll animation
    gsap.from(".feature-card", {
      scrollTrigger: {
        trigger: featuresRef.current,
        start: "top center",
        end: "bottom center",
        toggleActions: "play none none reverse"
      },
      y: 100,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2
    });

    // Background animations with GSAP
    const particles = gsap.utils.toArray('.bg-particle');
    
    particles.forEach((particle) => {
      gsap.to(particle, {
        x: 'random(-300, 300, 5)',
        y: 'random(-300, 300, 5)',
        rotation: 'random(-720, 720)',
        duration: 'random(20, 30)',
        repeat: -1,
        yoyo: true,
        ease: 'none',
      });
    });

    // Rotating circles animation
    gsap.to('.rotating-circle', {
      rotation: 360,
      duration: 30,
      repeat: -1,
      ease: 'none',
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
      gsap.killTweensOf(particles);
      gsap.killTweensOf('.rotating-circle');
    };
  }, []);

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
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-50">
        <div className="bg-pattern absolute inset-0 w-full h-full">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-[#e0e0e0] rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#eaeaea]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="text-2xl font-bold text-[#1a1a1a]">
              DocAI
            </a>
            <div className="hidden md:flex items-center space-x-8">
              {['Product', 'Solutions', 'Pricing'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-[#1a1a1a] hover:text-[#000] text-sm font-medium"
                >
                  {item}
                </a>
              ))}
              <button className="bg-[#1a1a1a] text-white px-5 py-2 rounded-md text-sm font-medium
                               hover:bg-black transition-colors">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            {/* Floating Elements */}
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="floating-element absolute hidden md:block"
                style={{
                  left: `${20 + i * 20}%`,
                  top: `${Math.random() * 100}px`,
                }}
              >
                <div className="w-12 h-12 border border-[#e0e0e0] rounded-lg bg-white/50 backdrop-blur-sm" />
              </div>
            ))}

            {/* Hero Content */}
            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-7xl font-bold text-[#1a1a1a] mb-6 leading-tight">
                Document Intelligence for the Modern Era
              </h1>
              <p className="text-lg md:text-xl text-[#666] mb-12 leading-relaxed">
                Transform your documents into intelligent conversations. Experience the future 
                of document processing with our advanced AI technology.
              </p>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                <button className="w-full md:w-auto bg-[#1a1a1a] text-white px-8 py-4 rounded-md
                                 hover:bg-black transition-colors text-sm font-medium">
                  Start Free Trial
                </button>
                <button className="w-full md:w-auto border border-[#e0e0e0] px-8 py-4 rounded-md
                                 hover:border-[#1a1a1a] transition-colors text-sm font-medium text-[#1a1a1a]">
                  View Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mb-4">
              Powerful Features
            </h2>
            <p className="text-[#666] text-lg">
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
                className="group p-8 rounded-lg border border-[#eaeaea] hover:border-[#1a1a1a] 
                         transition-all duration-300 bg-white"
              >
                <div className="w-12 h-12 mb-6 rounded-lg bg-[#f8f8f8] flex items-center justify-center
                              group-hover:bg-[#1a1a1a] transition-colors">
                  <span className="text-lg font-medium text-[#1a1a1a] group-hover:text-white">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">{feature.title}</h3>
                <p className="text-[#666] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-[#1a1a1a] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-lg text-[#999] mb-8 max-w-2xl mx-auto">
            Join thousands of teams who have already revolutionized their document processing.
          </p>
          <button className="bg-white text-[#1a1a1a] px-8 py-4 rounded-md hover:bg-[#f8f8f8]
                           transition-colors text-sm font-medium">
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 bg-[#f8f8f8] border-t border-[#eaeaea]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <div>
              <h3 className="font-semibold text-[#1a1a1a] mb-4">Product</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-[#666] hover:text-[#1a1a1a] text-sm">Features</a></li>
                <li><a href="#" className="text-[#666] hover:text-[#1a1a1a] text-sm">Solutions</a></li>
                <li><a href="#" className="text-[#666] hover:text-[#1a1a1a] text-sm">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[#1a1a1a] mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-[#666] hover:text-[#1a1a1a] text-sm">About</a></li>
                <li><a href="#" className="text-[#666] hover:text-[#1a1a1a] text-sm">Blog</a></li>
                <li><a href="#" className="text-[#666] hover:text-[#1a1a1a] text-sm">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[#1a1a1a] mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-[#666] hover:text-[#1a1a1a] text-sm">Documentation</a></li>
                <li><a href="#" className="text-[#666] hover:text-[#1a1a1a] text-sm">Help Center</a></li>
                <li><a href="#" className="text-[#666] hover:text-[#1a1a1a] text-sm">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[#1a1a1a] mb-4">Legal</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-[#666] hover:text-[#1a1a1a] text-sm">Privacy</a></li>
                <li><a href="#" className="text-[#666] hover:text-[#1a1a1a] text-sm">Terms</a></li>
                <li><a href="#" className="text-[#666] hover:text-[#1a1a1a] text-sm">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#eaeaea] mt-16 pt-8 text-center text-[#666] text-sm">
            <p>&copy; {new Date().getFullYear()} DocAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}