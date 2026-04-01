const { jsPDF } = require("jspdf");

function initDoc() {
  const doc = new jsPDF();
  const originalText = doc.text.bind(doc);
  doc.text = function(text, x, y, options) {
    const sanitize = (s) => s.replace(/₂/g, '2').replace(/₃/g, '3');
    if (typeof text === 'string') {
      text = sanitize(text);
    } else if (Array.isArray(text)) {
      text = text.map(t => typeof t === 'string' ? sanitize(t) : t);
    }
    return originalText(text, x, y, options);
  };
  return doc;
}

const doc = initDoc();
doc.text("Hello tCO₂e", 10, 10);
console.log("Success! No errors.")
