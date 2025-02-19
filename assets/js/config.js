// Configuration constants
const CONFIG = {
    API_KEY: 'AIzaSyAhNUlllpM8B3qe-QEcqvEZg1HnawNHEps',
    GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
    PDFJS: {
      workerSrc: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
    }
  };
  
  // Initialize PDF.js worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = CONFIG.PDFJS.workerSrc;