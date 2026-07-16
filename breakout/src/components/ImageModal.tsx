"use client";

import { useState } from "react";
import { Download, X, MoreVertical } from "lucide-react";

export function ImageModal({ src, alt }: { src: string; alt: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      <div 
        className="relative w-12 h-12 rounded-lg overflow-hidden group/image block flex-shrink-0 cursor-pointer shadow-sm"
        onClick={() => setIsOpen(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/image:opacity-100 transition flex items-center justify-center">
          <span className="text-white text-xs font-medium">View</span>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div 
            className="absolute inset-0" 
            onClick={() => setIsOpen(false)} 
          />
          
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center pointer-events-none">
            <div className="relative pointer-events-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={src} 
                alt={alt} 
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" 
              />
              
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="relative">
                  <button 
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl py-1 overflow-hidden">
                      <a 
                        href={src} 
                        download 
                        target="_blank"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                        onClick={() => setShowMenu(false)}
                      >
                        <Download className="w-4 h-4" /> Download
                      </a>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
