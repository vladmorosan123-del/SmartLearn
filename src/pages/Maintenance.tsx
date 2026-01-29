import { Construction} from 'lucide-react';

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="p-6 bg-amber-500/20 rounded-full">
            <Construction className="w-16 h-16 text-amber-400" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-4">
          În construcție
        </h1>
        
        <p className="text-slate-400 text-lg mb-8">
          Site-ul este momentan în dezvoltare. Revino în curând!
        </p>
        
        <div className="flex justify-center gap-2">
          <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
