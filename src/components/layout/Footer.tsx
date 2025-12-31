export function Footer(){
    return (
        <footer className="py-12 px-6 border-t border-slate-100 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xl italic">Z</span>
            </div>
            <span className="font-black text-2xl tracking-tighter text-slate-900 italic uppercase">Lucky</span>
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
          Secure. Transparent. Fun. <br />
          © 2025 Zlucky • Created by <a href="https://github.com/natthyx" target="_blank">Nate</a>.
        </p>
      </footer>
    )
}