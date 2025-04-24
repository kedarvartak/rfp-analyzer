// src/components/Navbar.js
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiDollarSign, FiMenu, FiX } from "react-icons/fi";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './theme';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navItems = [
    { name: 'Product', path: '/product' },
    { name: 'Solutions', path: '/solutions' },
    { name: 'Pricing', path: '/pricing' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
                    ${scrolled 
                      ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg' 
                      : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="relative z-50">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2"
            >
              <FiDollarSign className="w-8 h-8 text-gray-900 dark:text-white" />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`relative text-gray-900 dark:text-white text-sm font-medium
                          hover:text-black dark:hover:text-gray-200 transition-colors group`}
              >
                {item.name}
                <motion.div
                  className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-900 dark:bg-white 
                           group-hover:w-full transition-all duration-300"
                  whileHover={{ width: '100%' }}
                />
              </Link>
            ))}

            {/* Theme Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 
                       transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </motion.button>

            <Link
              to="/app"
              className="relative overflow-hidden group bg-gray-900 dark:bg-white 
                       text-white dark:text-gray-900 px-5 py-2 rounded-md text-sm 
                       font-medium transition-all duration-300 hover:shadow-xl 
                       hover:shadow-black/10"
            >
              <span className="relative z-10">Get Started</span>
              <motion.div
                className="absolute inset-0 bg-black dark:bg-gray-200"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-4 md:hidden">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 
                       transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(!isOpen)}
              className="relative z-50 text-gray-900 dark:text-white p-2 rounded-md"
            >
              {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 left-0 right-0 min-h-screen bg-white dark:bg-gray-900 
                     z-40 md:hidden"
          >
            <div className="pt-24 px-6 pb-8 space-y-6">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={item.path}
                    className="block text-lg font-medium text-gray-900 dark:text-white 
                             hover:text-black dark:hover:text-gray-200 transition-colors py-2"
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="pt-6"
              >
                <Link
                  to="/app"
                  className="block w-full bg-gray-900 dark:bg-white text-white 
                           dark:text-gray-900 text-center px-5 py-3 rounded-md text-sm 
                           font-medium hover:bg-black dark:hover:bg-gray-200 transition-colors"
                >
                  Get Started
                </Link>
              </motion.div>
            </div>

            {/* Mobile Menu Footer */}
            <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 
                          bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between text-sm text-gray-600 
                            dark:text-gray-400">
                <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                  Privacy
                </a>
                <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                  Terms
                </a>
                <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}