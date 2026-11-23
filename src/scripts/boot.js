// Runs first thing in <body>, before anything is painted: marks that JavaScript works and applies the reader's saved
// theme and reading depth. It is inlined into every page (Base.astro reads this file as text), and astro.config.mjs
// puts the hash of exactly this code into the Content-Security-Policy. Keep it small and self-contained.
document.documentElement.classList.add('js');try{var d=JSON.parse(localStorage.getItem('lfg-depth')||'"beginner"');document.documentElement.dataset.depth=d;var t=JSON.parse(localStorage.getItem('lfg-theme')||'"auto"');if(t!=="auto")document.documentElement.dataset.theme=t;var z=JSON.parse(localStorage.getItem('lfg-size')||'"m"');if(z!=="m")document.documentElement.dataset.size=z}catch(e){}
