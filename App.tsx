
import React, { useState, useEffect, useRef } from 'react';
import { GEMINI_API_KEY } from './config';
import { AppView, VoiceCommand } from './types';
import LiveAssistant from './components/LiveAssistant';
import SchematicLab from './components/SchematicLab';
import HardwareLab from './components/HardwareLab';
import FirmwareFinder from './components/FirmwareFinder';
import ChatAssistant from './components/ChatAssistant';
import JobSheet from './components/JobSheet';
import ChipsetIntelligence from './components/ChipsetIntelligence';
import LogAnalyzer from './components/LogAnalyzer';
import RepairFlow from './components/RepairFlow';
import FeedbackModal from './components/FeedbackModal';
import MaxcoLogo from './components/MaxcoLogo';
import { 
  WrenchScrewdriverIcon, 
  MicrophoneIcon, 
  ChatBubbleLeftRightIcon, 
  CpuChipIcon,
  Squares2X2Icon,
  ClipboardDocumentCheckIcon,
  BeakerIcon,
  BugAntIcon,
  ChatBubbleBottomCenterTextIcon,
  PresentationChartLineIcon,
  BoltIcon,
  StopIcon,
  SignalIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [showFeedback, setShowFeedback] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  
  // Voice Control State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceCommand, setVoiceCommand] = useState<VoiceCommand | null>(null);
  
  // Shared Data State (For AI integration)
  const [aiJobNotes, setAiJobNotes] = useState<string[]>([]);
  
  // HUD State
  const [showVoiceHud, setShowVoiceHud] = useState(true);
  const [hudPosition, setHudPosition] = useState({ x: window.innerWidth - 90, y: window.innerHeight - 150 });
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const recognitionRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Deep Linking Handler
  useEffect(() => {
    if (!GEMINI_API_KEY) {
      console.error("Gemini API key is not set. Please create a .env.local file and add VITE_GEMINI_API_KEY.");
      alert("AI features are disabled. Gemini API key is missing.");
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('mode') || params.has('analysis') || params.has('prompt')) {
        setActiveView(AppView.SCHEMATIC_LAB);
    }
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
              e.preventDefault();
              searchInputRef.current?.focus();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Unified Command Handler (Text + Voice)
  const handleGlobalInput = (text: string) => {
      const lower = text.toLowerCase();
      let targetView = activeView;

      // Intent Detection & Navigation Logic
      if (lower.includes('dashboard') || lower.includes('home')) targetView = AppView.DASHBOARD;
      else if (lower.includes('schematic') || lower.includes('board lab')) targetView = AppView.SCHEMATIC_LAB;
      else if (lower.includes('hardware') || lower.includes('engineering')) targetView = AppView.HARDWARE_LAB;
      else if (lower.includes('firmware') || lower.includes('flash')) targetView = AppView.FIRMWARE_FINDER;
      else if (lower.includes('chat') || lower.includes('ai help')) targetView = AppView.CHAT_DIAGNOSTIC;
      else if (lower.includes('job') || lower.includes('sheet') || lower.includes('estimate')) targetView = AppView.JOB_SHEET;
      else if (lower.includes('log') || lower.includes('panic') || lower.includes('error')) targetView = AppView.LOG_ANALYZER;
      else if (lower.includes('chipset') || lower.includes('ic') || lower.includes('donor')) targetView = AppView.CHIPSET_INTEL;
      else if (lower.includes('repair flow') || lower.includes('guide')) targetView = AppView.REPAIR_FLOW;
      else if (lower.includes('live') || lower.includes('agent')) targetView = AppView.LIVE_ASSISTANT;
      
      // Smart Redirect for Search Queries from Dashboard
      if (targetView === AppView.DASHBOARD && activeView === AppView.DASHBOARD && text.trim().length > 0) {
          // If user types a query but no navigation keyword, default to AI Chat for assistance
          if (!lower.includes('dashboard')) {
              targetView = AppView.CHAT_DIAGNOSTIC;
          }
      }

      if (targetView !== activeView) {
          setActiveView(targetView);
      }
      
      // Broadcast command to active view
      setVoiceCommand({ text, timestamp: Date.now() });
  };

  // AI Navigation Handler (Passed to LiveAssistant)
  const handleAiNavigation = (viewName: string, query?: string) => {
      let target: AppView | null = null;
      switch(viewName) {
          case 'firmware': target = AppView.FIRMWARE_FINDER; break;
          case 'schematic': target = AppView.SCHEMATIC_LAB; break;
          case 'hardware': target = AppView.HARDWARE_LAB; break;
          case 'jobsheet': target = AppView.JOB_SHEET; break;
          case 'chipset': target = AppView.CHIPSET_INTEL; break;
      }
      
      if (target) {
          setActiveView(target);
          if (query) {
              // Delay slightly to allow component to mount
              setTimeout(() => setVoiceCommand({ text: query, timestamp: Date.now() }), 500);
          }
      }
  };

  const handleAiLogNote = (note: string) => {
      setAiJobNotes(prev => [...prev, note]);
  };

  // Voice Control Logic
  const toggleVoiceControl = () => {
    if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
        setTranscript('');
        return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Voice control is not supported in this browser.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
        setIsListening(true);
        setTranscript('Listening...');
    };

    recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
        
        if (event.results[current].isFinal) {
            handleGlobalInput(text);
            setIsListening(false);
        }
    };

    recognition.onerror = (event: any) => {
        console.error("Speech error", event.error);
        setTranscript('Error listening.');
        setIsListening(false);
    };

    recognition.onend = () => {
        setIsListening(false);
        setTimeout(() => setTranscript(''), 2000);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // HUD Drag Logic
  const handleHudDragStart = (e: React.MouseEvent | React.TouchEvent) => {
      if ((e.target as HTMLElement).closest('.close-btn')) return;
      
      isDraggingRef.current = false;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      dragOffsetRef.current = {
          x: clientX - hudPosition.x,
          y: clientY - hudPosition.y
      };

      const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
          isDraggingRef.current = true;
          moveEvent.preventDefault(); // Prevent scrolling while dragging
          const moveX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
          const moveY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : (moveEvent as MouseEvent).clientY;

          // Boundary checks can be added here if needed
          setHudPosition({
              x: moveX - dragOffsetRef.current.x,
              y: moveY - dragOffsetRef.current.y
          });
      };

      const handleUp = () => {
          document.removeEventListener('mousemove', handleMove);
          document.removeEventListener('mouseup', handleUp);
          document.removeEventListener('touchmove', handleMove);
          document.removeEventListener('touchend', handleUp);
          // Small delay to prevent click trigger
          setTimeout(() => isDraggingRef.current = false, 50);
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleUp);
  };

  const renderContent = () => {
    const commonProps = { voiceCommand };

    switch (activeView) {
      case AppView.LIVE_ASSISTANT:
        return <LiveAssistant onNavigate={handleAiNavigation} onLogNote={handleAiLogNote} apiKey={GEMINI_API_KEY} />;
      case AppView.SCHEMATIC_LAB:
        return <SchematicLab {...commonProps} apiKey={GEMINI_API_KEY} />;
      case AppView.HARDWARE_LAB:
        return <HardwareLab {...commonProps} apiKey={GEMINI_API_KEY} />;
      case AppView.FIRMWARE_FINDER:
        return <FirmwareFinder {...commonProps} />;
      case AppView.CHAT_DIAGNOSTIC:
        return <ChatAssistant {...commonProps} apiKey={GEMINI_API_KEY} />;
      case AppView.JOB_SHEET:
        return <JobSheet {...commonProps} aiNotes={aiJobNotes} />; // Pass notes here
      case AppView.CHIPSET_INTEL:
        return <ChipsetIntelligence {...commonProps} apiKey={GEMINI_API_KEY} />;
      case AppView.LOG_ANALYZER:
        return <LogAnalyzer {...commonProps} apiKey={GEMINI_API_KEY} />;
      case AppView.REPAIR_FLOW:
        return <RepairFlow {...commonProps} apiKey={GEMINI_API_KEY} />;
      default:
        return <Dashboard onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans relative">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-gray-800 border-r border-gray-700 flex flex-col flex-shrink-0 transition-all duration-300 z-20">
        <div className="p-6 flex items-center justify-center lg:justify-start gap-3 border-b border-gray-700">
          <div className="p-1 rounded-lg">
            <MaxcoLogo className="h-10 w-10 drop-shadow-lg" />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-xl font-black tracking-wider text-white">MAXCO</h1>
            <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">Repair AI</p>
          </div>
        </div>
        
        {/* Global Search Bar (Desktop) */}
        <div className="px-4 mt-4 hidden lg:block">
            <div className="relative group">
                <input 
                    ref={searchInputRef}
                    type="text" 
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    onKeyDown={(e) => {
                        if(e.key === 'Enter') {
                            handleGlobalInput(globalSearch);
                            setGlobalSearch('');
                        }
                    }}
                    placeholder="Search (Ctrl+K)"
                    className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-xs rounded-lg py-2.5 pl-9 pr-2 focus:border-blue-500 focus:bg-gray-900 outline-none transition-all shadow-inner"
                />
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-500 absolute left-3 top-2.5 group-focus-within:text-blue-400 transition-colors" />
            </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem 
            active={activeView === AppView.DASHBOARD} 
            onClick={() => setActiveView(AppView.DASHBOARD)} 
            icon={<Squares2X2Icon className="h-6 w-6" />} 
            label="Dashboard" 
          />
          <NavItem 
            active={activeView === AppView.SCHEMATIC_LAB} 
            onClick={() => setActiveView(AppView.SCHEMATIC_LAB)} 
            icon={<WrenchScrewdriverIcon className="h-6 w-6" />} 
            label="Schematic Lab" 
          />
           <NavItem 
            active={activeView === AppView.HARDWARE_LAB} 
            onClick={() => setActiveView(AppView.HARDWARE_LAB)} 
            icon={<BoltIcon className="h-6 w-6 text-cyan-400" />} 
            label="Hardware Lab" 
          />
          <NavItem 
            active={activeView === AppView.REPAIR_FLOW} 
            onClick={() => setActiveView(AppView.REPAIR_FLOW)} 
            icon={<PresentationChartLineIcon className="h-6 w-6 text-yellow-400" />} 
            label="Smart Repair Flow" 
          />
          <NavItem 
            active={activeView === AppView.LOG_ANALYZER} 
            onClick={() => setActiveView(AppView.LOG_ANALYZER)} 
            icon={<BugAntIcon className="h-6 w-6 text-green-400" />} 
            label="Log & Error Decoder" 
          />
          <NavItem 
            active={activeView === AppView.CHIPSET_INTEL} 
            onClick={() => setActiveView(AppView.CHIPSET_INTEL)} 
            icon={<CpuChipIcon className="h-6 w-6 text-purple-400" />} 
            label="IC DNA & Donors" 
          />
          <NavItem 
            active={activeView === AppView.FIRMWARE_FINDER} 
            onClick={() => setActiveView(AppView.FIRMWARE_FINDER)} 
            icon={<BeakerIcon className="h-6 w-6" />} 
            label="Firmware Hub" 
          />
          <NavItem 
            active={activeView === AppView.CHAT_DIAGNOSTIC} 
            onClick={() => setActiveView(AppView.CHAT_DIAGNOSTIC)} 
            icon={<ChatBubbleLeftRightIcon className="h-6 w-6" />} 
            label="AI Chat" 
          />
          <NavItem 
            active={activeView === AppView.JOB_SHEET} 
            onClick={() => setActiveView(AppView.JOB_SHEET)} 
            icon={<ClipboardDocumentCheckIcon className="h-6 w-6" />} 
            label="Job Sheet & Estimate" 
          />
          <div className="pt-4 border-t border-gray-700 mt-4">
             <NavItem 
                active={activeView === AppView.LIVE_ASSISTANT} 
                onClick={() => setActiveView(AppView.LIVE_ASSISTANT)} 
                icon={<MicrophoneIcon className="h-6 w-6 text-red-400" />} 
                label="Live Voice Agent" 
                highlight
             />
          </div>
        </nav>

        <div className="p-4 border-t border-gray-700">
          {/* Restore Button for Voice HUD */}
          {!showVoiceHud && (
              <button 
                onClick={() => setShowVoiceHud(true)}
                className="w-full mb-3 flex items-center justify-center lg:justify-start gap-2 bg-blue-900/20 hover:bg-blue-900/40 text-blue-300 text-sm py-2 rounded-lg transition-colors border border-blue-900/50"
              >
                 <SpeakerWaveIcon className="h-4 w-4" />
                 <span className="hidden lg:inline">Enable Voice Control</span>
              </button>
          )}

          <button 
            onClick={() => setShowFeedback(true)}
            className="w-full mb-4 flex items-center justify-center lg:justify-start gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
             <ChatBubbleBottomCenterTextIcon className="h-5 w-5" />
             <span className="hidden lg:inline">Feedback & Bugs</span>
          </button>

          <div className="flex items-center gap-3 p-2 rounded bg-gray-900/50">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-xs">T</div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium">Technician Pro</p>
              <p className="text-xs text-green-400">Online</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Mobile Header with Search */}
        <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 lg:hidden shrink-0 gap-3">
            <div className="flex items-center gap-2 shrink-0">
                <MaxcoLogo className="h-8 w-8" />
            </div>
            
            {/* Global Search Bar (Mobile) */}
            <div className="flex-1 max-w-md relative">
                 <input 
                    type="text" 
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    onKeyDown={(e) => {
                        if(e.key === 'Enter') {
                            handleGlobalInput(globalSearch);
                            setGlobalSearch('');
                            (document.activeElement as HTMLElement)?.blur();
                        }
                    }}
                    placeholder="Search..."
                    className="w-full bg-gray-900 border border-gray-600 text-gray-300 text-xs rounded-full py-2 pl-8 pr-2 focus:border-blue-500 outline-none"
                />
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-500 absolute left-2.5 top-2" />
            </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-6">
          {renderContent()}
        </div>
      </main>

      {/* Global Voice Control HUD (Draggable & Closable) */}
      {activeView !== AppView.LIVE_ASSISTANT && showVoiceHud && (
          <div 
            className="fixed z-50 flex flex-col items-end gap-2 touch-none select-none cursor-move group"
            style={{ left: hudPosition.x, top: hudPosition.y }}
            onMouseDown={handleHudDragStart}
            onTouchStart={handleHudDragStart}
          >
              {/* Close Button (Visible on hover/active) */}
              <button 
                onClick={(e) => { e.stopPropagation(); setShowVoiceHud(false); }}
                className="close-btn absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-900/90 text-white hover:bg-red-600 rounded-full p-1.5 border border-red-500 shadow-lg z-10"
                title="Close Voice Control"
              >
                  <XMarkIcon className="h-3 w-3" />
              </button>

              {/* Transcript Bubble */}
              {transcript && (
                  <div className="bg-black/80 backdrop-blur text-white px-4 py-2 rounded-lg border border-gray-700 shadow-2xl mb-2 max-w-xs animate-fade-in pointer-events-none">
                      <p className="text-sm font-mono">{transcript}</p>
                  </div>
              )}
              
              {/* Voice Button */}
              <button 
                onClick={() => { if(!isDraggingRef.current) toggleVoiceControl(); }}
                className={`h-16 w-16 rounded-full shadow-2xl flex items-center justify-center transition-all transform active:scale-95 ${
                    isListening 
                    ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-900/50' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white ring-4 ring-blue-900/50'
                }`}
                title="Voice Control (Drag to move)"
              >
                {isListening ? <SignalIcon className="h-8 w-8" /> : <MicrophoneIcon className="h-8 w-8" />}
              </button>
          </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </div>
  );
};

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; highlight?: boolean }> = ({ active, onClick, icon, label, highlight }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group
      ${active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      }
      ${highlight && !active ? 'bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/40' : ''}
    `}
  >
    <div className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
        {icon}
    </div>
    <span className="font-medium hidden lg:block">{label}</span>
  </button>
);

const Dashboard: React.FC<{ onNavigate: (view: AppView) => void }> = ({ onNavigate }) => (
  <div className="max-w-5xl mx-auto">
    <div className="mb-8 flex items-end gap-4">
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Welcome back, Technician</h1>
        <p className="text-gray-400 text-sm lg:text-base">Select a tool or use the Global Search (Ctrl+K) to begin.</p>
      </div>
      <MaxcoLogo className="h-20 w-20 lg:h-24 lg:w-24 ml-auto opacity-10 hidden md:block" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
      <DashboardCard 
        title="Schematic & Board Lab" 
        desc="Analyze circuit boards, clean up schematics, map screw risks, or animate flows."
        icon={<WrenchScrewdriverIcon className="h-8 w-8 text-purple-400" />}
        onClick={() => onNavigate(AppView.SCHEMATIC_LAB)}
        gradient="from-purple-900/50 to-blue-900/50"
      />
       <DashboardCard 
        title="Hardware Engineering Lab" 
        desc="Jumper Finder, Diode Values, and ISP/Test Point Locator."
        icon={<BoltIcon className="h-8 w-8 text-cyan-400" />}
        onClick={() => onNavigate(AppView.HARDWARE_LAB)}
        gradient="from-cyan-900/50 to-blue-900/50"
      />
      <DashboardCard 
        title="Smart Repair Flow" 
        desc="Step-by-step voice guided repair roadmaps for any device."
        icon={<PresentationChartLineIcon className="h-8 w-8 text-yellow-400" />}
        onClick={() => onNavigate(AppView.REPAIR_FLOW)}
        gradient="from-yellow-900/50 to-orange-900/50"
      />
      <DashboardCard 
        title="Log & Error Decoder" 
        desc="Decode 'Panic Full' logs, iTunes errors, and Android CrashDumps instantly."
        icon={<BugAntIcon className="h-8 w-8 text-green-400" />}
        onClick={() => onNavigate(AppView.LOG_ANALYZER)}
        gradient="from-green-900/50 to-teal-900/50"
      />
      <DashboardCard 
        title="IC DNA & Donor Finder" 
        desc="Find compatible donor boards for ICs and view chipset datasheets."
        icon={<CpuChipIcon className="h-8 w-8 text-purple-400" />}
        onClick={() => onNavigate(AppView.CHIPSET_INTEL)}
        gradient="from-indigo-900/50 to-purple-900/50"
      />
      <DashboardCard 
        title="Firmware Finder" 
        desc="Locate Flash Files, FRP Tools, and Unlockers for Oppo, Vivo, Xiaomi, Samsung."
        icon={<BeakerIcon className="h-8 w-8 text-blue-400" />}
        onClick={() => onNavigate(AppView.FIRMWARE_FINDER)}
        gradient="from-blue-900/50 to-cyan-900/50"
      />
      <DashboardCard 
        title="AI Diagnostic Chat" 
        desc="Deep reasoning mode (Gemini 3 Pro) to solve complex hardware faults."
        icon={<ChatBubbleLeftRightIcon className="h-8 w-8 text-green-400" />}
        onClick={() => onNavigate(AppView.CHAT_DIAGNOSTIC)}
        gradient="from-green-900/50 to-emerald-900/50"
      />
      <DashboardCard 
        title="Live Voice Agent" 
        desc="Hands-free real-time voice assistance while you solder."
        icon={<MicrophoneIcon className="h-8 w-8 text-red-400" />}
        onClick={() => onNavigate(AppView.LIVE_ASSISTANT)}
        gradient="from-red-900/50 to-orange-900/50"
      />
    </div>
  </div>
);

const DashboardCard: React.FC<{ title: string; desc: string; icon: React.ReactNode; onClick: () => void; gradient: string }> = ({ title, desc, icon, onClick, gradient }) => (
  <button 
    onClick={onClick}
    className={`p-6 rounded-2xl border border-gray-700 bg-gradient-to-br ${gradient} hover:scale-[1.02] transition-all duration-200 text-left group relative overflow-hidden h-full`}
  >
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        {icon}
    </div>
    <div className="mb-4 bg-gray-900/50 w-14 h-14 rounded-xl flex items-center justify-center backdrop-blur-sm">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-400 text-sm">{desc}</p>
  </button>
);

export default App;
