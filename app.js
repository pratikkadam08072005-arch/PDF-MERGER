const fileInput = document.querySelector('#file-input');
const browseButton = document.querySelector('#browse-button');
const dropZone = document.querySelector('#drop-zone');
const queue = document.querySelector('#queue');
const actionButton = document.querySelector('#action-button');
const clearButton = document.querySelector('#clear-all');
const fileCount = document.querySelector('#file-count');
const message = document.querySelector('#message');
const operationTitle = document.querySelector('#operation-title');
const operationKicker = document.querySelector('#operation-kicker');
const operationDescription = document.querySelector('#operation-description');
const dropTitle = document.querySelector('#drop-title');
const dropHelp = document.querySelector('#drop-help');
const toolTabs = document.querySelectorAll('.tool-tab');
const editorControls = document.querySelector('#editor-controls');

let files = [];
let draggedIndex = null;
let activeOperation = 'merge';
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const operations = {
  merge: {
    title: 'Merge PDFs', kicker: 'PDF workflow / 01', description: 'Combine multiple PDFs in the order you choose.', accept: '.pdf,application/pdf', extensions: ['pdf'], multiple: true, minimum: 2, action: 'Merge PDFs', drop: 'Drop PDFs here', help: 'PDF only · up to 50 MB per file', endpoint: '/merge'
  },
  'pdf-to-word': {
    title: 'PDF to Word', kicker: 'PDF workflow / 02', description: 'Turn one PDF into an editable Word document.', accept: '.pdf,application/pdf', extensions: ['pdf'], multiple: false, minimum: 1, action: 'Convert to Word', drop: 'Drop a PDF here', help: 'One PDF · up to 50 MB', endpoint: '/pdf-to-word'
  },
  'word-to-pdf': {
    title: 'Word to PDF', kicker: 'Word workflow / 03', description: 'Create a shareable PDF from a Word document.', accept: '.docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document', extensions: ['docx', 'doc'], multiple: false, minimum: 1, action: 'Convert to PDF', drop: 'Drop a Word file here', help: 'DOCX or DOC · up to 50 MB', endpoint: '/word-to-pdf'
  },
  'image-to-pdf': {
    title: 'Image to PDF', kicker: 'Image workflow / 04', description: 'Turn one or many images into a single PDF.', accept: '.jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff,image/*', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tif', 'tiff'], multiple: true, minimum: 1, action: 'Create PDF', drop: 'Drop images here', help: 'JPG, PNG, WEBP or TIFF · up to 50 MB each', endpoint: '/image-to-pdf'
  },
  'image-to-word': {
    title: 'Image to Word', kicker: 'Image workflow / 05', description: 'Place images into an editable Word document.', accept: '.jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff,image/*', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tif', 'tiff'], multiple: true, minimum: 1, action: 'Create Word file', drop: 'Drop images here', help: 'JPG, PNG, WEBP or TIFF · up to 50 MB each', endpoint: '/image-to-word'
  },
  'pdf-editor': {
    title: 'PDF editor', kicker: 'Edit workflow / 06', description: 'Rotate pages or remove selected pages from a PDF.', accept: '.pdf,application/pdf', extensions: ['pdf'], multiple: false, minimum: 1, action: 'Save edited PDF', drop: 'Drop a PDF here', help: 'One PDF · up to 50 MB', endpoint: '/pdf-editor', editor: 'pdf'
  },
  'word-editor': {
    title: 'Word editor', kicker: 'Edit workflow / 07', description: 'Replace the document text and download a fresh DOCX.', accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document', extensions: ['docx'], multiple: false, minimum: 1, action: 'Save edited Word file', drop: 'Drop a DOCX here', help: 'One DOCX · up to 50 MB', endpoint: '/word-editor', editor: 'word'
  },
  'image-editor': {
    title: 'Image editor', kicker: 'Edit workflow / 08', description: 'Adjust rotation, brightness, and contrast on an image.', accept: '.jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff,image/*', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tif', 'tiff'], multiple: false, minimum: 1, action: 'Save edited image', drop: 'Drop an image here', help: 'One image · up to 50 MB', endpoint: '/image-editor', editor: 'image'
  }
};

function currentOperation() {
  return operations[activeOperation];
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function setMessage(text, type = '') {
  message.textContent = text;
  message.className = `message ${type}`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]);
}

function extensionOf(file) {
  return file.name.toLowerCase().split('.').pop();
}

function acceptsFile(file) {
  return currentOperation().extensions.includes(extensionOf(file));
}

function addFiles(incoming) {
  const rejected = [];
  const accepted = Array.from(incoming).filter((file) => {
    if (!acceptsFile(file)) {
      rejected.push(`${file.name}: unsupported file type`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      rejected.push(`${file.name}: over 50 MB`);
      return false;
    }
    return true;
  });

  files = currentOperation().multiple ? [...files, ...accepted] : accepted.slice(-1);
  renderQueue();
  setMessage(rejected.length ? rejected.join(' · ') : '');
}

function renderQueue() {
  queue.innerHTML = '';
  files.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.draggable = currentOperation().multiple;
    item.dataset.index = index;
    item.style.animationDelay = `${index * 35}ms`;
    const safeName = escapeHtml(file.name);
    item.innerHTML = `
      <span class="file-index">${String(index + 1).padStart(2, '0')}</span>
      <span class="file-info"><span class="file-name" title="${safeName}">${safeName}</span><span class="file-meta">${extensionOf(file).toUpperCase()} · ${formatSize(file.size)}</span></span>
      <span class="drag-handle" aria-hidden="true">⋮⋮</span>
      <button class="remove-file" type="button" aria-label="Remove ${file.name}">×</button>
    `;
    item.querySelector('.remove-file').addEventListener('click', () => {
      files.splice(index, 1);
      renderQueue();
      setMessage('');
    });
    if (currentOperation().multiple) {
      item.addEventListener('dragstart', () => { draggedIndex = index; item.classList.add('dragging'); });
      item.addEventListener('dragend', () => {
        draggedIndex = null;
        item.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach((element) => element.classList.remove('drag-over'));
      });
      item.addEventListener('dragover', (event) => { event.preventDefault(); item.classList.add('drag-over'); });
      item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
      item.addEventListener('drop', (event) => {
        event.preventDefault();
        item.classList.remove('drag-over');
        if (draggedIndex === null || draggedIndex === index) return;
        const [movedFile] = files.splice(draggedIndex, 1);
        files.splice(index, 0, movedFile);
        renderQueue();
      });
    }
    queue.appendChild(item);
  });

  const config = currentOperation();
  fileCount.textContent = files.length ? `${files.length} file${files.length === 1 ? '' : 's'} ready` : 'No files added';
  clearButton.disabled = files.length === 0;
  actionButton.disabled = files.length < config.minimum;
}

function setOperation(operation) {
  activeOperation = operation;
  files = [];
  const config = currentOperation();
  toolTabs.forEach((tab) => tab.classList.toggle('is-active', tab.dataset.operation === operation));
  fileInput.accept = config.accept;
  fileInput.multiple = config.multiple;
  operationTitle.textContent = config.title;
  operationKicker.textContent = config.kicker;
  operationDescription.textContent = config.description;
  dropTitle.textContent = config.drop;
  dropHelp.textContent = config.help;
  actionButton.querySelector('span').textContent = config.action;
  renderEditorControls(config.editor);
  setMessage('');
  renderQueue();
}

function renderEditorControls(editor) {
  editorControls.hidden = !editor;
  if (!editor) {
    editorControls.innerHTML = '';
    return;
  }
  if (editor === 'pdf') {
    editorControls.innerHTML = '<label>Remove pages <input id="remove-pages" type="text" placeholder="e.g. 2, 5"></label><label>Rotate all <select id="rotation"><option value="0">0°</option><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></label><label class="wide-control">Add text <input id="editor-text" type="text" placeholder="Type text to place on the PDF"></label><label>Page <input id="text-page" type="number" min="1" value="1"></label><label>X <input id="text-x" type="number" min="0" value="72"></label><label>Y <input id="text-y" type="number" min="0" value="72"></label><label>Size <input id="text-size" type="number" min="6" max="72" value="16"></label><small>Page numbers start at 1. Coordinates are measured from the bottom-left.</small>';
  } else if (editor === 'word') {
    editorControls.innerHTML = '<label class="wide-control">Replacement text <textarea id="word-text" rows="7" placeholder="Type the text for your edited document..."></textarea></label><small>This creates a clean DOCX from the text you enter.</small>';
  } else {
    editorControls.innerHTML = '<label>Rotate <select id="rotation"><option value="0">0°</option><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></label><label>Brightness <input id="brightness" type="range" min="-100" max="100" value="0"><output id="brightness-value">0</output></label><label>Contrast <input id="contrast" type="range" min="-100" max="100" value="0"><output id="contrast-value">0</output></label><label class="wide-control">Add text <input id="editor-text" type="text" placeholder="Type text to place on the image"></label><label>X <input id="text-x" type="number" min="0" value="24"></label><label>Y <input id="text-y" type="number" min="0" value="24"></label><label>Size <input id="text-size" type="number" min="8" max="160" value="32"></label>';
    ['brightness', 'contrast'].forEach((id) => document.querySelector(`#${id}`).addEventListener('input', (event) => { document.querySelector(`#${id}-value`).value = event.target.value; }));
  }
}

async function processFiles() {
  const config = currentOperation();
  if (files.length < config.minimum) return;
  actionButton.disabled = true;
  actionButton.querySelector('span').textContent = 'Working...';
  setMessage(`Running ${config.title.toLowerCase()} with Python...`);
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (config.editor === 'pdf' || config.editor === 'image') {
      formData.append('rotation', document.querySelector('#rotation').value);
    }
    if (config.editor === 'pdf') formData.append('remove_pages', document.querySelector('#remove-pages').value);
    if (config.editor === 'word') formData.append('text', document.querySelector('#word-text').value);
    if (config.editor === 'image') {
      formData.append('text', document.querySelector('#editor-text').value);
      formData.append('brightness', document.querySelector('#brightness').value);
      formData.append('contrast', document.querySelector('#contrast').value);
    }
    if (config.editor === 'pdf') {
      formData.append('text', document.querySelector('#editor-text').value);
      formData.append('text_page', document.querySelector('#text-page').value);
    }
    if (config.editor === 'pdf' || config.editor === 'image') {
      formData.append('text_x', document.querySelector('#text-x').value);
      formData.append('text_y', document.querySelector('#text-y').value);
      formData.append('text_size', document.querySelector('#text-size').value);
    }
    const response = await fetch(config.endpoint, { method: 'POST', body: formData });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || 'The server could not complete this operation.');
    }
    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') || '';
    const filename = disposition.match(/filename="?([^";]+)"?/)?.[1] || 'paperfold-result';
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    setMessage(`${config.title} complete. Download started.`, 'success');
  } catch (error) {
    console.error(error);
    setMessage(error.message || 'This operation could not be completed.');
  } finally {
    actionButton.disabled = files.length < config.minimum;
    actionButton.querySelector('span').textContent = config.action;
  }
}

toolTabs.forEach((tab) => tab.addEventListener('click', () => setOperation(tab.dataset.operation)));
browseButton.addEventListener('click', (event) => { event.stopPropagation(); fileInput.click(); });
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') fileInput.click(); });
fileInput.addEventListener('change', () => { addFiles(fileInput.files); fileInput.value = ''; });
['dragenter', 'dragover'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.add('is-dragging'); }));
['dragleave', 'drop'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.remove('is-dragging'); }));
dropZone.addEventListener('drop', (event) => addFiles(event.dataTransfer.files));
clearButton.addEventListener('click', () => { files = []; renderQueue(); setMessage(''); });
actionButton.addEventListener('click', processFiles);

setOperation(activeOperation);
