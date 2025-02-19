// Application State
let extractedTexts = [];
let imageDataUrls = [];

// DOM Elements
const dom = {
  pdfInput: document.getElementById('pdfInput'),
  processBtn: document.getElementById('processBtn'),
  outputSection: document.getElementById('outputSection'),
  imageGallery: document.getElementById('imageGallery'),
  imageOutputs: document.getElementById('imageOutputs'),
  downloadBtn: document.getElementById('downloadBtn'),
  modal: document.getElementById('imageModal'),
  modalImage: document.getElementById('modalImage'),
  btnText: document.getElementById('btnText'),
  btnLoader: document.getElementById('btnLoader')
};

// Event Listeners
function initializeEventListeners() {
  dom.processBtn.addEventListener('click', processPDF);
  dom.downloadBtn.addEventListener('click', generateDocx);
  dom.modal.querySelector('.modal-close').addEventListener('click', closeModal);
  document.addEventListener('keydown', handleKeyPress);
}

// Application Logic
async function callGeminiAPI(imageData) {
  const payload = {
    contents: [{
      parts: [
        { 
          text: "Extract text from this handwritten note. Convert to English. Format with proper headings (H1 for questions, H2 for answers, H3 for subheadings). Preserve lists, tables, and provide alt text for graphics."
        },
        { 
          inline_data: { 
            mime_type: "image/png", 
            data: imageData 
          }
        }
      ]
    }]
  };

  const response = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${CONFIG.API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Add all other functions from original script here (convertPdfToImages, showImageGallery, etc.)

async function convertPdfToImages(pdfFile) {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const dataUrl = canvas.toDataURL('image/png');
      imageDataUrls.push(dataUrl);
      images.push(dataUrl.split(',')[1]); // Base64 string without the header
    }
    return images;
  }

  function showImageGallery() {
    const gallery = document.getElementById('imageGallery');
    gallery.innerHTML = imageDataUrls.map((url, index) => `
      <div class="thumbnail" tabindex="0" role="button" aria-label="View page ${index + 1}" onclick="showModal('${url}')">
        <img src="${url}" alt="Page ${index + 1} thumbnail" />
      </div>
    `).join('');
  }

  function showModal(url) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    modalImg.src = url;
    modal.style.display = 'flex';
    // Set focus to the modal for improved accessibility
    modal.setAttribute('tabindex', '-1');
    modal.focus();
  }

  function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
  }

  // Allow closing the modal via the Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
      closeModal();
    }
  });

  async function processPDF() {
    const pdfFile = document.getElementById('pdfInput').files[0];
    if (!pdfFile) return alert('Please select a PDF file');

    const processBtn = document.getElementById('processBtn');
    processBtn.disabled = true;
    document.getElementById('btnText').style.display = 'none';
    document.getElementById('btnLoader').style.display = 'inline-block';

    try {
      const images = await convertPdfToImages(pdfFile);
      showImageGallery();
      
      const outputSection = document.getElementById('outputSection');
      outputSection.style.display = 'block';
      const imageOutputs = document.getElementById('imageOutputs');
      imageOutputs.innerHTML = '';
      extractedTexts = [];

      for (let i = 0; i < images.length; i++) {
        const container = document.createElement('div');
        container.className = 'image-output';
        container.innerHTML = `
          <h3>Page ${i + 1}</h3>
          <div class="extracted-output">Processing... <span class="loading"></span></div>
        `;
        imageOutputs.appendChild(container);

        try {
          const text = await callGeminiAPI(images[i]);
          extractedTexts.push(text);
          container.querySelector('.extracted-output').innerHTML = text;
        } catch (error) {
          container.querySelector('.extracted-output').innerHTML = 
            `Error: ${error.message}`;
        }
      }

      document.getElementById('downloadBtn').style.display = 'block';
    } catch (error) {
      alert('Processing failed: ' + error.message);
    } finally {
      processBtn.disabled = false;
      document.getElementById('btnText').style.display = 'inline';
      document.getElementById('btnLoader').style.display = 'none';
    }
  }

  function generateDocx() {
    const doc = new docx.Document({
      sections: [{
        properties: {},
        children: extractedTexts.map((text, index) => new docx.Paragraph({
          heading: docx.HeadingLevel.HEADING_2,
          children: [new docx.TextRun({
            text: `Page ${index + 1}\n${text}`,
            font: "Calibri",
            size: 24
          })],
          spacing: { after: 400 },
          border: { bottom: { color: "AAAAAA", space: 1, style: "single" } }
        }))
      }]
    });

    docx.Packer.toBlob(doc).then(blob => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `converted-notes-${new Date().toISOString().slice(0,10)}.docx`;
      link.click();
    });
  }

  window.processPDF = processPDF;
  window.generateDocx = generateDocx;
  window.showModal = showModal;
  window.closeModal = closeModal;
// Initialize Application
function init() {
  initializeEventListeners();
}

// Start the application
document.addEventListener('DOMContentLoaded', init);