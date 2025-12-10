import React, { useRef } from 'react';
import { HandState, useStore } from '../store';

const Overlay: React.FC = () => {
  const handState = useStore((state) => state.handState);
  const addPhotos = useStore((state) => state.addPhotos);
  const photos = useStore((state) => state.photos);
  const toggleDebug = useStore((state) => state.toggleDebug);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const urls = Array.from(e.target.files).map((file) => URL.createObjectURL(file as File));
      addPhotos(urls);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const getGestureIcon = () => {
      switch(handState) {
          case HandState.CLOSED: return <div className="text-2xl">✊</div>;
          case HandState.OPEN: return <div className="text-2xl">✋</div>;
          case HandState.PINCH: return <div className="text-2xl">👌</div>;
          default: return <div className="text-sm">...</div>;
      }
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="flex flex-col gap-2">
            {/* Title Block */}
            <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-red-500">
                Magic Christmas
              </h1>
              <p className="text-xs text-gray-300 mt-1">
                Fist: Build Tree • Open: Photo Wall • Pinch: View Memory
              </p>
            </div>

            {/* Gesture Status - Moved to top left, smaller */}
            <div className={`transition-all duration-300 transform origin-top-left ${handState !== HandState.UNKNOWN ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                 <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3 w-fit shadow-lg">
                    {getGestureIcon()}
                    <span className="text-white text-xs font-bold tracking-widest uppercase">{handState}</span>
                 </div>
            </div>
        </div>

        <div className="flex gap-2">
            <button 
                onClick={toggleDebug}
                className="bg-gray-800/60 backdrop-blur hover:bg-gray-700 text-white p-3 rounded-full transition-all flex items-center justify-center w-12 h-12"
                title="Toggle Debug Camera"
            >
                📷
            </button>
            <button 
                onClick={toggleFullscreen}
                className="bg-gray-800/60 backdrop-blur hover:bg-gray-700 text-white p-3 rounded-full transition-all flex items-center justify-center w-12 h-12"
                title="Fullscreen"
            >
                <span className="text-xl">⛶</span>
            </button>
        </div>
      </div>

      {/* Bottom Control */}
      <div className="flex items-end justify-between pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 max-w-sm">
            <div className="flex items-center gap-3 mb-3">
                <span className="text-white font-bold text-sm">Memories ({photos.length})</span>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-all shadow-lg hover:shadow-red-500/30"
                >
                    <span className="text-lg">📂</span>
                    Add Photos
                </button>
                <input 
                    type="file" 
                    multiple
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                />
            </div>
            
            {/* Mini Gallery */}
            <div className="flex gap-2 overflow-x-auto pb-1 max-w-[300px]">
                {photos.length === 0 && <span className="text-xs text-gray-400 italic">No photos added yet...</span>}
                {photos.map(p => (
                    <img key={p.id} src={p.url} className="w-10 h-10 rounded border border-white/30 object-cover" alt="Memory" />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Overlay;