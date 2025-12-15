import React from 'react';
import { Terminal, Code, Play } from 'lucide-react';

export const CSharp: React.FC = () => {
  return (
    <div className="p-8 max-w-5xl mx-auto text-right font-sans" dir="rtl">
        <div className="mb-8 border-b border-electro-primary/30 pb-4">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-2">
          تعلم البرمجة بلغة #C
        </h1>
        <p className="text-electro-text/70">الخطوات الأولى في عالم البرمجة.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <CodeCard 
            title="المتغيرات (Variables)"
            desc="المتغير هو صندوق نحفظ فيه المعلومات. لكل صندوق نوع محدد!"
            code={`int age = 16;           // رقم صحيح
string name = "Ahmad";  // نص
double grade = 95.5;    // رقم عشري
bool isStudent = true;  // صح أو خطأ`}
        />

        <CodeCard 
            title="الطباعة والقراءة (I/O)"
            desc="كيف تتحدث مع الكمبيوتر وكيف يرد عليك."
            code={`Console.WriteLine("شو اسمك؟"); // الكمبيوتر يكتب
string name = Console.ReadLine(); // أنت تكتب
Console.WriteLine("أهلاً " + name);`}
        />

        <CodeCard 
            title="الجمل الشرطية (If Statements)"
            desc="اتخاذ القرارات بناءً على شروط."
            code={`if (grade > 90) 
{
    Console.WriteLine("ممتاز يا بطل! 🌟");
} 
else 
{
    Console.WriteLine("حاول مرة أخرى 💪");
}`}
        />
      </div>
    </div>
  );
};

const CodeCard: React.FC<{ title: string; desc: string; code: string }> = ({ title, desc, code }) => (
    <div className="bg-[#1e1e1e] rounded-2xl overflow-hidden border border-gray-700 shadow-xl group hover:border-electro-accent/50 transition-colors">
        <div className="bg-[#2d2d2d] px-4 py-2 flex items-center justify-between border-b border-gray-700">
            <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-gray-400 text-xs font-mono">Program.cs</span>
        </div>
        <div className="p-6">
            <div className="flex items-start gap-4 mb-4">
                <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                    <Terminal className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-100">{title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{desc}</p>
                </div>
            </div>
            <div className="bg-black/50 p-4 rounded-lg font-mono text-sm text-left relative group-hover:bg-black/70 transition-colors" dir="ltr">
                <pre className="text-gray-300 whitespace-pre-wrap">
                    {code}
                </pre>
            </div>
        </div>
    </div>
);
