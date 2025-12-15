import React, { useState } from 'react';
import { Cpu, Hash, ArrowRightLeft, Lightbulb, ToggleLeft, ToggleRight, Table } from 'lucide-react';

export const Mitoog: React.FC = () => {
  const [inputValue, setInputValue] = useState('10');
  const [inputBase, setInputBase] = useState(10);

  const parseInput = (val: string, base: number) => {
    try {
      const parsed = parseInt(val, base);
      return isNaN(parsed) ? null : parsed;
    } catch {
      return null;
    }
  };

  const decimalValue = parseInput(inputValue, inputBase);

  return (
    <div className="p-8 max-w-6xl mx-auto text-right font-sans space-y-12" dir="rtl">
      
      {/* Header */}
      <div className="border-b border-electro-primary/30 pb-4">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-electro-glow to-electro-accent mb-2">
          نظم العد والبوابات المنطقية
        </h1>
        <p className="text-electro-text/70">تحويل بين الأنظمة وفهم المنطق الرقمي (Logic Relations).</p>
      </div>

      {/* Logic Gates Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-white">
            <Cpu className="w-8 h-8 text-pink-500" />
            <h2 className="text-3xl font-bold">البوابات المنطقية (Logic Gates)</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AND Gate */}
            <GateSimulator 
                name="بوابة و (AND)" 
                symbol="&" 
                color="border-blue-500"
                logic={(a, b) => a && b}
                desc="المصباح يضيء فقط إذا كان المفتاحين (1)."
            />
            {/* OR Gate */}
            <GateSimulator 
                name="بوابة أو (OR)" 
                symbol="≥1" 
                color="border-green-500"
                logic={(a, b) => a || b}
                desc="المصباح يضيء إذا كان أحد المفاتيح على الأقل (1)."
            />
            {/* XOR Gate */}
            <GateSimulator 
                name="بوابة الحصري (XOR)" 
                symbol="=1" 
                color="border-purple-500"
                logic={(a, b) => (a || b) && !(a && b)}
                desc="المصباح يضيء إذا كانت المفاتيح مختلفة فقط."
            />
             {/* NOT Gate */}
             <NotGateSimulator />
        </div>
      </section>

      {/* Number Systems Section */}
      <section className="space-y-6 pt-10 border-t border-electro-primary/20">
        <div className="flex items-center gap-3 text-white">
            <Hash className="w-8 h-8 text-electro-glow" />
            <h2 className="text-3xl font-bold">أنظمة العد</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-electro-dark/50 p-8 rounded-3xl border border-electro-primary/20 shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6 text-electro-accent">
                <ArrowRightLeft className="w-6 h-6" />
                <h2 className="text-2xl font-bold">المحول الذكي</h2>
            </div>
            
            <div className="space-y-6">
                <div>
                <label className="block text-sm text-gray-400 mb-2">القيمة المدخلة</label>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full bg-black/40 border border-electro-primary/40 rounded-xl px-4 py-3 text-2xl font-mono text-electro-glow focus:outline-none focus:border-electro-glow transition-all text-left"
                />
                </div>
                
                <div>
                <label className="block text-sm text-gray-400 mb-2">نظام العد الأساسي</label>
                <div className="grid grid-cols-4 gap-2">
                    {[2, 8, 10, 16].map((base) => (
                    <button
                        key={base}
                        onClick={() => setInputBase(base)}
                        className={`py-2 rounded-lg font-bold transition-all ${
                        inputBase === base
                            ? 'bg-electro-primary text-white shadow-lg shadow-electro-primary/30'
                            : 'bg-electro-secondary/20 text-gray-400 hover:bg-electro-secondary/40'
                        }`}
                    >
                        Base {base}
                    </button>
                    ))}
                </div>
                </div>
            </div>
            </div>

            <div className="space-y-4">
                <ConversionCard 
                    label="النظام العشري (Decimal)" 
                    value={decimalValue !== null ? decimalValue.toString(10) : '---'} 
                    base={10}
                    active={inputBase === 10}
                />
                <ConversionCard 
                    label="النظام الثنائي (Binary)" 
                    value={decimalValue !== null ? decimalValue.toString(2) : '---'} 
                    base={2}
                    active={inputBase === 2}
                />
                <ConversionCard 
                    label="النظام الثماني (Octal)" 
                    value={decimalValue !== null ? decimalValue.toString(8) : '---'} 
                    base={8}
                    active={inputBase === 8}
                />
                <ConversionCard 
                    label="النظام السداسي عشر (Hex)" 
                    value={decimalValue !== null ? decimalValue.toString(16).toUpperCase() : '---'} 
                    base={16}
                    active={inputBase === 16}
                />
            </div>
        </div>
      </section>
    </div>
  );
};

// --- Sub Components ---

const GateSimulator: React.FC<{ 
    name: string; 
    symbol: string; 
    color: string;
    logic: (a: boolean, b: boolean) => boolean;
    desc: string;
}> = ({ name, symbol, color, logic, desc }) => {
    const [a, setA] = useState(false);
    const [b, setB] = useState(false);
    const [showTable, setShowTable] = useState(false);
    const output = logic(a, b);

    return (
        <div className={`bg-[#0f0f16] rounded-2xl p-6 border-r-4 ${color} shadow-lg relative overflow-hidden group hover:bg-[#1a1a24] transition-colors`}>
            <div className="absolute top-0 left-0 p-4 opacity-10 font-black text-9xl font-mono select-none pointer-events-none">
                {symbol}
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">{name}</h3>
                        <p className="text-gray-400 text-xs">{desc}</p>
                    </div>
                    <button 
                        onClick={() => setShowTable(!showTable)}
                        className={`p-2 rounded-lg transition-colors ${showTable ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                        title="جدول الحقيقة"
                    >
                        <Table className="w-5 h-5" />
                    </button>
                </div>

                {showTable ? (
                    <div className="bg-black/40 rounded-lg p-3 text-xs font-mono animate-in fade-in slide-in-from-top-2">
                        <table className="w-full text-center">
                            <thead>
                                <tr className="text-gray-400 border-b border-gray-700">
                                    <th className="pb-1">A</th>
                                    <th className="pb-1">B</th>
                                    <th className="pb-1 text-yellow-400">Out</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-300">
                                {[
                                    [false, false],
                                    [false, true],
                                    [true, false],
                                    [true, true]
                                ].map(([valA, valB], idx) => {
                                    const res = logic(valA, valB);
                                    const isActiveRow = a === valA && b === valB;
                                    return (
                                        <tr key={idx} className={isActiveRow ? 'bg-white/10 text-white font-bold' : ''}>
                                            <td className="py-1">{valA ? 1 : 0}</td>
                                            <td className="py-1">{valB ? 1 : 0}</td>
                                            <td className={`py-1 ${res ? 'text-yellow-400' : 'text-gray-500'}`}>{res ? 1 : 0}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex items-center justify-between mt-auto pt-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setA(!a)} className="text-gray-300 hover:text-white transition-colors">
                                    {a ? <ToggleRight className="w-10 h-10 text-green-400" /> : <ToggleLeft className="w-10 h-10 text-gray-600" />}
                                </button>
                                <span className="font-mono text-sm">Input A ({a ? 1 : 0})</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setB(!b)} className="text-gray-300 hover:text-white transition-colors">
                                    {b ? <ToggleRight className="w-10 h-10 text-green-400" /> : <ToggleLeft className="w-10 h-10 text-gray-600" />}
                                </button>
                                <span className="font-mono text-sm">Input B ({b ? 1 : 0})</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="h-0.5 w-12 bg-gray-600"></div>
                            <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center shadow-2xl transition-all duration-300 ${
                                output 
                                ? 'bg-yellow-400 border-yellow-200 shadow-yellow-500/50 scale-110' 
                                : 'bg-gray-800 border-gray-700 opacity-50'
                            }`}>
                                <Lightbulb className={`w-8 h-8 ${output ? 'text-white fill-white' : 'text-gray-500'}`} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const NotGateSimulator: React.FC = () => {
    const [a, setA] = useState(false);
    const output = !a;

    return (
        <div className="bg-[#0f0f16] rounded-2xl p-6 border-r-4 border-red-500 shadow-lg relative overflow-hidden group hover:bg-[#1a1a24] transition-colors">
            <div className="absolute top-0 left-0 p-4 opacity-10 font-black text-9xl font-mono select-none pointer-events-none">!</div>
            
            <div className="relative z-10 flex flex-col h-full">
                <h3 className="text-xl font-bold text-white mb-2">بوابة النفي (NOT)</h3>
                <p className="text-gray-400 text-xs mb-6">المصباح يعكس حالة المفتاح.</p>
                
                <div className="flex items-center justify-between mt-auto">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setA(!a)} className="text-gray-300 hover:text-white transition-colors">
                                {a ? <ToggleRight className="w-10 h-10 text-green-400" /> : <ToggleLeft className="w-10 h-10 text-gray-600" />}
                            </button>
                            <span className="font-mono text-sm">Input ({a ? 1 : 0})</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="h-0.5 w-12 bg-gray-600"></div>
                        <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center shadow-2xl transition-all duration-300 ${
                            output 
                            ? 'bg-yellow-400 border-yellow-200 shadow-yellow-500/50 scale-110' 
                            : 'bg-gray-800 border-gray-700 opacity-50'
                        }`}>
                            <Lightbulb className={`w-8 h-8 ${output ? 'text-white fill-white' : 'text-gray-500'}`} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ConversionCard: React.FC<{ label: string; value: string; base: number; active: boolean }> = ({ label, value, base, active }) => (
  <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
    active 
    ? 'bg-electro-primary/20 border-electro-primary shadow-inner' 
    : 'bg-electro-dark border-gray-800'
  }`}>
    <div className="flex flex-col">
        <span className="text-gray-400 text-sm">{label}</span>
        <span className="text-xs text-gray-600 font-mono">Base {base}</span>
    </div>
    <div className="text-2xl font-mono text-white tracking-wider">
        {value}
    </div>
  </div>
);