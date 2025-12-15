import React, { useState, useRef, useEffect } from 'react';
import { Home, Zap, Cpu, Code2, Eye, Settings } from 'lucide-react';
import { AppRoute } from './types';
import { Electricity } from './pages/Electricity';
import { Mitoog } from './pages/Mitoog';
import { CSharp } from './pages/CSharp';
import { AIAssistant } from './components/AIAssistant';
import { ResizablePanel } from './components/ResizablePanel';
import { ViewMenu, ViewSettingsState } from './components/ViewMenu';

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.HOME);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // View Settings State
  const [viewSettings, setViewSettings] = useState<ViewSettingsState>({
    zoom: 1,
    brightness: 100,
    language: 'ar',
    theme: 'dark'
  });

  const mainContentRef = useRef<HTMLElement>(null);

  // Apply Direction based on Language
  useEffect(() => {
    const dir = viewSettings.language === 'en' ? 'ltr' : 'rtl';
    document.documentElement.dir = dir;
    document.documentElement.lang = viewSettings.language;
  }, [viewSettings.language]);

  const handleUpdateSettings = (newSettings: Partial<ViewSettingsState>) => {
    setViewSettings(prev => ({ ...prev, ...newSettings }));
  };

  const renderContent = () => {
    switch (currentRoute) {
      case AppRoute.ELECTRICITY:
        return <Electricity />;
      case AppRoute.MITOOG:
        return <Mitoog />;
      case AppRoute.CSHARP:
        return <CSharp />;
      default:
        return <HomePage onNavigate={setCurrentRoute} />;
    }
  };

  // Determine styles based on theme
  const isLight = viewSettings.theme === 'light';
  const bgClass = isLight ? 'bg-gray-100 text-gray-900' : 'bg-electro-dark text-electro-text';
  const sidebarClass = isLight ? 'bg-white/80 border-gray-300 text-gray-800' : 'bg-black/40 border-electro-primary/20 backdrop-blur-md';

  return (
    <div 
        className={`min-h-screen flex overflow-hidden transition-colors duration-300 ${bgClass}`}
        style={{ 
            filter: `brightness(${viewSettings.brightness}%)`,
            // @ts-ignore - zoom is non-standard but effective for this request
            zoom: viewSettings.zoom 
        }}
    >
      {/* View Settings Menu Modal */}
      <ViewMenu 
        settings={viewSettings} 
        onUpdate={handleUpdateSettings} 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {/* Sidebar Navigation */}
      <ResizablePanel 
        initialSize={256} 
        minSize={80} 
        maxSize={400} 
        direction={viewSettings.language === 'en' ? 'right' : 'left'}
        className={`z-50 ${sidebarClass} border-l`}
      >
        <aside className="w-full h-full flex flex-col items-stretch py-6">
            <div className="px-4 mb-6 flex items-center justify-between">
                <div 
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setCurrentRoute(AppRoute.HOME)}
                >
                    <div className="min-w-[40px] w-10 h-10 rounded-xl bg-gradient-to-br from-electro-primary to-electro-secondary flex items-center justify-center shadow-lg shadow-electro-primary/30">
                        <Zap className="text-white w-6 h-6" />
                    </div>
                    <div className="flex flex-col opacity-0 lg:opacity-100 transition-opacity duration-300">
                        <span className={`font-black text-xl tracking-tighter truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>ElectroLearn</span>
                        <span className={`text-xs tracking-wide ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>موئمن مصري</span>
                    </div>
                </div>
            </div>

            {/* Top Bar Action - View Settings */}
            <div className="px-4 mb-4">
                 <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed transition-all ${isLight ? 'border-gray-300 hover:bg-black/5' : 'border-gray-700 hover:bg-white/5'}`}
                 >
                     <Settings className={`w-5 h-5 ${isLight ? 'text-gray-500' : 'text-gray-400'}`} />
                     <span className={`text-sm font-bold ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>
                         {viewSettings.language === 'en' ? 'View Settings' : 'إعدادات العرض'}
                     </span>
                 </button>
            </div>

            <nav className="flex-1 space-y-2 px-2 overflow-y-auto overflow-x-hidden">
                <NavItem 
                    icon={<Home />} 
                    label={viewSettings.language === 'en' ? 'Home' : (viewSettings.language === 'he' ? 'בית' : 'الرئيسية')}
                    isActive={currentRoute === AppRoute.HOME} 
                    onClick={() => setCurrentRoute(AppRoute.HOME)} 
                    isLight={isLight}
                />
                <div className="px-4 py-2 text-xs font-bold text-gray-500 mt-6 mb-2 truncate">
                    {viewSettings.language === 'en' ? 'Subjects' : (viewSettings.language === 'he' ? 'נושאים' : 'المواضيع')}
                </div>
                <NavItem 
                    icon={<Zap />} 
                    label={viewSettings.language === 'en' ? 'Electricity' : (viewSettings.language === 'he' ? 'חשמל' : 'الكهرباء (محاكاة)')} 
                    isActive={currentRoute === AppRoute.ELECTRICITY} 
                    onClick={() => setCurrentRoute(AppRoute.ELECTRICITY)} 
                    isLight={isLight}
                />
                <NavItem 
                    icon={<Cpu />} 
                    label={viewSettings.language === 'en' ? 'Digital Logic' : (viewSettings.language === 'he' ? 'לוגיקה' : 'المنطق الرقمي')} 
                    isActive={currentRoute === AppRoute.MITOOG} 
                    onClick={() => setCurrentRoute(AppRoute.MITOOG)} 
                    isLight={isLight}
                />
                <NavItem 
                    icon={<Code2 />} 
                    label={viewSettings.language === 'en' ? 'C# Programming' : (viewSettings.language === 'he' ? 'תכנות C#' : 'لغة C#')} 
                    isActive={currentRoute === AppRoute.CSHARP} 
                    onClick={() => setCurrentRoute(AppRoute.CSHARP)} 
                    isLight={isLight}
                />
            </nav>
        </aside>
      </ResizablePanel>

      {/* Main Content Area */}
      <main 
        ref={mainContentRef}
        className={`flex-1 overflow-auto relative ${isLight ? 'bg-gray-50' : 'bg-[#050508]'}`}
      >
        {renderContent()}
      </main>

      {/* AI Assistant Always Present */}
      <AIAssistant />
    </div>
  );
};

const HomePage: React.FC<{ onNavigate: (route: AppRoute) => void }> = ({ onNavigate }) => (
    <div className="h-full flex flex-col items-center justify-center p-8 relative overflow-hidden text-center">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 w-64 h-64 bg-electro-primary/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-electro-secondary/20 rounded-full blur-[120px]"></div>
        </div>

        <div className="z-10 text-center max-w-4xl w-full">
            <h1 className="text-6xl lg:text-8xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-electro-primary via-electro-glow to-electro-accent animate-in fade-in slide-in-from-bottom-5 duration-1000">
                ElectroLearn
            </h1>
            <p className="text-xl text-gray-500 mb-16 max-w-2xl mx-auto leading-relaxed">
                Interactive platform for Electronics, Digital Logic, and Programming.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                <SubjectCard 
                    title="Electricity" 
                    subtitle="Interactive Circuit Sim" 
                    icon={<Zap className="w-12 h-12" />} 
                    color="from-yellow-400 to-orange-500"
                    onClick={() => onNavigate(AppRoute.ELECTRICITY)}
                />
                <SubjectCard 
                    title="Digital Logic" 
                    subtitle="Gates & Number Systems" 
                    icon={<Cpu className="w-12 h-12" />} 
                    color="from-cyan-400 to-blue-500"
                    onClick={() => onNavigate(AppRoute.MITOOG)}
                />
                <SubjectCard 
                    title="C# Sharp" 
                    subtitle="Programming Basics" 
                    icon={<Code2 className="w-12 h-12" />} 
                    color="from-emerald-400 to-green-600"
                    onClick={() => onNavigate(AppRoute.CSHARP)}
                />
            </div>
        </div>
    </div>
);

const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; isLight: boolean }> = ({ icon, label, isActive, onClick, isLight }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
            isActive 
            ? 'bg-electro-primary text-white shadow-lg shadow-electro-primary/25' 
            : `${isLight ? 'text-gray-600 hover:bg-black/5' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`
        }`}
    >
        <div className={`transition-transform min-w-[24px] group-hover:scale-110 ${isActive ? 'text-white' : `${isLight ? 'text-gray-500' : 'text-gray-500 group-hover:text-electro-glow'}`}`}>
            {icon}
        </div>
        <span className="truncate font-medium">{label}</span>
    </button>
);

const SubjectCard: React.FC<{ title: string; subtitle: string; icon: React.ReactNode; color: string; onClick: () => void }> = ({ title, subtitle, icon, color, onClick }) => (
    <button 
        onClick={onClick}
        className="relative group h-64 rounded-3xl bg-opacity-10 bg-black border border-gray-500/30 p-8 flex flex-col items-center justify-center gap-6 overflow-hidden hover:border-gray-400 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
    >
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
        
        <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
            {icon}
        </div>
        
        <div className="text-center z-10">
            <h2 className="text-2xl font-bold dark:text-white text-gray-800 mb-2">{title}</h2>
            <p className="text-gray-500 text-sm group-hover:text-gray-400">{subtitle}</p>
        </div>
    </button>
);

export default App;