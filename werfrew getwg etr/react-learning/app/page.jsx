"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { MoveRight, Star, Orbit, ShieldCheck } from 'lucide-react';
import { SplineSceneBasic } from "@/components/ui/demo";

/**
 * SPACE LANDING PAGE
 * Inspired by Floema's "Organic Precision" standards.
 */

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const Section = ({ children, className = "" }) => (
  <motion.section 
    initial="initial"
    whileInView="animate"
    viewport={{ once: true, amount: 0.3 }}
    variants={fadeIn}
    className={`py-32 px-6 md:px-12 max-w-7xl mx-auto ${className}`}
  >
    {children}
  </motion.section>
);

const LandingPage = () => {
  return (
    <div className="bg-[#050505] text-white font-sans selection:bg-white selection:text-black overflow-x-hidden">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed top-0 w-full z-50 flex justify-between items-center px-12 py-8 bg-black/20 backdrop-blur-md"
      >
        <div className="text-xl font-bold tracking-tighter uppercase">Beyond.</div>
        <div className="hidden md:flex gap-12 text-sm uppercase tracking-widest text-gray-400">
          <a href="#" className="hover:text-white transition-colors">Fleet</a>
          <a href="#" className="hover:text-white transition-colors">Mission</a>
          <a href="#" className="hover:text-white transition-colors">Sustainability</a>
        </div>
        <button className="px-6 py-2 border border-white/20 hover:bg-white hover:text-black transition-all text-xs uppercase tracking-widest">
          Enquiry
        </button>
      </motion.nav>

      {/* Hero Section */}
      <section className="h-screen relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2] 
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.2, 0.1] 
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px]" 
          />
        </div>

        <motion.div 
          variants={stagger}
          initial="initial"
          animate="animate"
          className="relative z-10 text-center px-6"
        >
          <motion.p variants={fadeIn} className="text-xs uppercase tracking-[0.4em] text-gray-400 mb-8">
            Sustainable Exploration
          </motion.p>
          <motion.h1 variants={fadeIn} className="text-7xl md:text-9xl font-bold tracking-tighter mb-12 uppercase leading-none">
            The <br /> <span className="text-gray-500">Beyond</span>
          </motion.h1>
          <motion.div variants={fadeIn} className="flex justify-center gap-6">
            <button className="group flex items-center gap-3 text-sm uppercase tracking-widest border-b border-white/20 pb-2 hover:border-white transition-all">
              Explore Mission <MoveRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </button>
          </motion.div>
        </motion.div>

        {/* Hero Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-12 left-12 right-12 flex justify-between items-end"
        >
          <div className="text-[10px] uppercase tracking-widest text-gray-500 leading-relaxed max-w-[200px]">
            ©2024 Beyond Exploration Corp. <br /> All Rights Reserved.
          </div>
          <div className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-4">
            <span>Coordinates: 41.8781° N, 87.6298° W</span>
            <div className="w-px h-8 bg-white/20" />
            <span>01 / 04</span>
          </div>
        </motion.div>
      </section>

      {/* 3D Interactive Section */}
      <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <SplineSceneBasic />
      </section>

      {/* Philosophy Section */}
      <Section className="border-t border-white/10">
        <div className="grid md:grid-cols-2 gap-24 items-start">
          <motion.div variants={fadeIn}>
            <h2 className="text-4xl font-bold tracking-tighter uppercase mb-12">
              Our <span className="text-gray-500">Philosophy</span>
            </h2>
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-px bg-white/40 mb-12" 
            />
          </motion.div>
          <div className="space-y-8">
            <motion.p variants={fadeIn} className="text-xl text-gray-300 leading-relaxed">
              We believe in the bridge between industrial precision and the organic vastness of space. Our vessels are not just machines; they are manifestations of sustainable craftsmanship.
            </motion.p>
            <motion.p variants={fadeIn} className="text-sm text-gray-500 leading-loose max-w-md">
              Every curve, every alloy, and every line of code is optimized to minimize our cosmic footprint while maximizing the potential for discovery. We call this Organic Precision.
            </motion.p>
          </div>
        </div>
      </Section>

      {/* Fleet Section */}
      <Section>
        <div className="flex justify-between items-end mb-24">
          <h2 className="text-5xl font-bold tracking-tighter uppercase">The Fleet</h2>
          <p className="text-xs uppercase tracking-widest text-gray-500">Collection 2024</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <motion.div 
            variants={fadeIn}
            whileHover={{ y: -10 }}
            className="md:col-span-7 group cursor-pointer"
          >
            <div className="aspect-[4/5] bg-gray-900 overflow-hidden relative border border-white/5">
              <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-50 transition-all duration-700">
                <Orbit className="w-64 h-64 text-white stroke-[0.5] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000" />
              </div>
              <div className="absolute bottom-12 left-12">
                <p className="text-[10px] uppercase tracking-[0.3em] mb-2 text-gray-500 group-hover:text-white transition-colors">Class Alpha</p>
                <h3 className="text-3xl font-bold tracking-tighter uppercase">Vanguard I</h3>
              </div>
            </div>
          </motion.div>

          <motion.div 
            variants={fadeIn}
            whileHover={{ y: -10 }}
            className="md:col-span-5 md:mt-24 group cursor-pointer"
          >
            <div className="aspect-[4/5] bg-gray-900 overflow-hidden relative border border-white/5">
               <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-50 transition-all duration-700">
                <Star className="w-48 h-48 text-white stroke-[0.5] group-hover:scale-110 transition-transform duration-1000" />
              </div>
              <div className="absolute bottom-12 left-12">
                <p className="text-[10px] uppercase tracking-[0.3em] mb-2 text-gray-500 group-hover:text-white transition-colors">Class Beta</p>
                <h3 className="text-3xl font-bold tracking-tighter uppercase">Stellar Drift</h3>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Technical Precision Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="bg-white text-black py-40 px-6 md:px-12"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-24">
          <div className="max-w-xl">
            <motion.h2 
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-6xl font-bold tracking-tighter uppercase mb-12"
            >
              Cosmic <br /> Responsibility
            </motion.h2>
            <p className="text-lg leading-relaxed mb-8">
              Space is the final sanctuary. We apply the same circular economy principles to our orbital stations as we do to our production labs on Earth.
            </p>
            <div className="flex gap-12 mt-16">
              <motion.div whileHover={{ scale: 1.05 }} className="cursor-default">
                <ShieldCheck className="w-8 h-8 mb-4 opacity-40" />
                <h4 className="font-bold uppercase text-xs tracking-widest mb-2">Zero Waste</h4>
                <p className="text-xs text-gray-500">Orbital debris recovery systems standard in all craft.</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="cursor-default">
                <Orbit className="w-8 h-8 mb-4 opacity-40" />
                <h4 className="font-bold uppercase text-xs tracking-widest mb-2">Clean Energy</h4>
                <p className="text-xs text-gray-500">100% solar and fusion-derived propulsion modules.</p>
              </motion.div>
            </div>
          </div>
          <div className="w-full md:w-1/3 aspect-square bg-gray-100 flex items-center justify-center border border-black/5 relative overflow-hidden group">
             <div className="absolute inset-0 opacity-10">
                <motion.div 
                  animate={{ y: [0, 400] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-full h-px bg-black absolute top-0" 
                />
                <div className="absolute top-0 left-0 w-full h-px bg-black" style={{ top: '25%' }} />
                <div className="absolute top-0 left-0 w-full h-px bg-black" style={{ top: '50%' }} />
                <div className="absolute top-0 left-0 w-full h-px bg-black" style={{ top: '75%' }} />
                <div className="absolute top-0 left-0 h-full w-px bg-black" style={{ left: '25%' }} />
                <div className="absolute top-0 left-0 h-full w-px bg-black" style={{ left: '50%' }} />
                <div className="absolute top-0 left-0 h-full w-px bg-black" style={{ left: '75%' }} />
             </div>
             <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="text-[10px] uppercase font-mono tracking-tighter z-10"
             >
                Precision_Milling_v4.02
             </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="py-24 px-12 border-t border-white/10 text-center">
        <div className="text-sm uppercase tracking-[0.5em] text-gray-500 mb-8">Beyond the Horizon</div>
        <motion.div 
          whileHover={{ scale: 1.05, skewX: -5 }}
          className="text-5xl font-bold tracking-tighter uppercase mb-12 italic cursor-pointer"
        >
          Join the Odyssey.
        </motion.div>
        <div className="flex justify-center gap-12 text-[10px] uppercase tracking-[0.2em] text-gray-500">
          <a href="#" className="hover:text-white transition-colors">Instagram</a>
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
          <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
