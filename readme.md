# pdf-cheerio

A simple library that combines PDF.js and Cheerio to parse PDF files using jQuery-like selectors.

## Installation

```bash
npm install pdf-cheerio
```

## Usage

```javascript
const fs = require('fs');
const pdfCheerio = require('pdf-cheerio');

// Load a PDF file
const pdfBuffer = fs.readFileSync('document.pdf');

// Parse the PDF
pdfCheerio.load(pdfBuffer).then($ => {
  // Use jQuery-like selectors to find content
  const text = $('text').text();
  console.log('PDF text:', text);
  
  // Get text from a specific page
  const pageOneText = $('page[number="1"] text').text();
  console.log('Page 1 text:', pageOneText);
});
```

## Features

- Parse PDF files into a DOM-like structure
- Query PDF content using familiar Cheerio/jQuery selectors
- Extract text, images, and other content from PDFs
- Works in Node.js environments