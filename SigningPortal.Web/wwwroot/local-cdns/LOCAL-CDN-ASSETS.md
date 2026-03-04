# Local CDN Assets Documentation

> **Generated:** February 1, 2026  
> **Total Size:** ~9.59 MB  
> **Base Path:** `~/local-cdns/Shared/`

---

## 📦 Library Index

| Library | Version(s) | Type | Usage |
|---------|------------|------|-------|
| jQuery | 3.5.1, 3.6.0, 3.6.4 | JS | Core dependency |
| Bootstrap | 4.3.1, 4.5.2, 5.3.3 | CSS/JS | UI Framework |
| Bootstrap Icons | 1.11.3 | CSS/Fonts | Icon library |
| FontAwesome | 6.0.0-beta3, 6.4.0, 6.5.0, 6.5.1 | CSS/Fonts | Icon library |
| Popper.js | 1.14.7, 1.16.0 | JS | Tooltip/Popover positioning |
| DataTables | 1.11.5 | CSS/JS | Table functionality |
| DataTables Responsive | 2.2.9 | CSS/JS | Responsive tables |
| Chart.js | 2.9.4, latest | JS | Charts/Graphs |
| ChartJS Datalabels | 2.0.0 | JS | Chart labels plugin |
| PDF.js | 2.10.377, 3.11.174 | JS | PDF viewing |
| PDF-lib | 1.16.0 | JS | PDF manipulation |
| html2canvas | 1.4.1 | JS | Screenshot capture |
| html2pdf | latest | JS | HTML to PDF conversion |
| Editor.js | latest | JS | Block editor |
| SweetAlert | 1.1.3 | CSS | Alert dialogs (legacy) |
| SweetAlert2 | 11 | JS | Alert dialogs |
| Toastr | latest | CSS/JS | Toast notifications |
| SignalR | 5.0.8 | JS | Real-time communication |
| Lucide | latest | JS | Icon library |
| Animate.css | 4.1.1 | CSS | CSS animations |
| DateTimePicker | 2.5.20 | CSS/JS | Date/time picker |

---

## 🔗 Asset Paths Reference

### Core Libraries

```html
<!-- jQuery -->
<script src="~/local-cdns/Shared/jquery/3.5.1/jquery.min.js"></script>
<script src="~/local-cdns/Shared/jquery/3.6.0/jquery.min.js"></script>
<script src="~/local-cdns/Shared/jquery/3.6.4/jquery.min.js"></script>

<!-- Popper.js (required for Bootstrap 4 tooltips/popovers) -->
<script src="~/local-cdns/Shared/popper/1.14.7/popper.min.js"></script>
<script src="~/local-cdns/Shared/popper/1.16.0/popper.min.js"></script>
```

### Bootstrap

```html
<!-- Bootstrap 4.3.1 -->
<link href="~/local-cdns/Shared/bootstrap/4.3.1/css/bootstrap.min.css" rel="stylesheet">
<script src="~/local-cdns/Shared/bootstrap/4.3.1/js/bootstrap.min.js"></script>

<!-- Bootstrap 4.5.2 -->
<link href="~/local-cdns/Shared/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
<script src="~/local-cdns/Shared/bootstrap/4.5.2/js/bootstrap.min.js"></script>

<!-- Bootstrap 5.3.3 (includes Popper) -->
<link href="~/local-cdns/Shared/bootstrap/5.3.3/css/bootstrap.min.css" rel="stylesheet">
<script src="~/local-cdns/Shared/bootstrap/5.3.3/js/bootstrap.bundle.min.js"></script>
```

### Icon Libraries

```html
<!-- Bootstrap Icons -->
<link href="~/local-cdns/Shared/bootstrap-icons/1.11.3/bootstrap-icons.min.css" rel="stylesheet">

<!-- FontAwesome -->
<link href="~/local-cdns/Shared/fontawesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
<link href="~/local-cdns/Shared/fontawesome/6.4.0/css/all.min.css" rel="stylesheet">
<link href="~/local-cdns/Shared/fontawesome/6.5.0/css/all.min.css" rel="stylesheet">
<link href="~/local-cdns/Shared/fontawesome/6.5.1/css/all.min.css" rel="stylesheet">

<!-- Lucide Icons -->
<script src="~/local-cdns/Shared/lucide/latest/lucide.min.js"></script>
```

### Fonts

```html
<!-- Inter Font -->
<link href="~/local-cdns/Shared/fonts/inter/inter.css" rel="stylesheet">

<!-- Inter + Poppins Combined -->
<link href="~/local-cdns/Shared/fonts/inter-poppins.css" rel="stylesheet">

<!-- Manrope Font -->
<link href="~/local-cdns/Shared/fonts/manrope/manrope.css" rel="stylesheet">

<!-- Roboto Font -->
<link href="~/local-cdns/Shared/fonts/roboto/roboto.css" rel="stylesheet">
```

### DataTables

```html
<!-- DataTables Core -->
<link href="~/local-cdns/Shared/datatables/1.11.5/jquery.dataTables.css" rel="stylesheet">
<script src="~/local-cdns/Shared/datatables/1.11.5/jquery.dataTables.js"></script>

<!-- DataTables Responsive Extension -->
<link href="~/local-cdns/Shared/datatables-responsive/2.2.9/responsive.dataTables.min.css" rel="stylesheet">
<script src="~/local-cdns/Shared/datatables-responsive/2.2.9/dataTables.responsive.min.js"></script>
```

### Charts

```html
<!-- Chart.js 2.x (legacy) -->
<script src="~/local-cdns/Shared/chartjs/2.9.4/Chart.js"></script>
<script src="~/local-cdns/Shared/chartjs/2.9.4/Chart.min.js"></script>

<!-- Chart.js 4.x (latest) -->
<script src="~/local-cdns/Shared/chartjs/latest/chart.umd.min.js"></script>

<!-- ChartJS Datalabels Plugin -->
<script src="~/local-cdns/Shared/chartjs-datalabels/2.0.0/chartjs-plugin-datalabels.min.js"></script>
```

### PDF Libraries

```html
<!-- PDF.js 2.x -->
<script src="~/local-cdns/Shared/pdfjs/2.10.377/pdf.min.js"></script>
<script src="~/local-cdns/Shared/pdfjs/2.10.377/pdf.worker.min.js"></script>

<!-- PDF.js 3.x -->
<script src="~/local-cdns/Shared/pdfjs/3.11.174/pdf.min.js"></script>

<!-- PDF-lib (manipulation) -->
<script src="~/local-cdns/Shared/pdf-lib/1.16.0/pdf-lib.min.js"></script>

<!-- html2canvas + html2pdf -->
<script src="~/local-cdns/Shared/html2canvas/1.4.1/html2canvas.min.js"></script>
<script src="~/local-cdns/Shared/html2pdf/latest/html2pdf.bundle.min.js"></script>
```

### Editor.js & Plugins

```html
<!-- Editor.js Core -->
<script src="~/local-cdns/Shared/editorjs/latest/editorjs.umd.min.js"></script>

<!-- Editor.js Plugins -->
<script src="~/local-cdns/Shared/editorjs-header/latest/header.umd.min.js"></script>
<script src="~/local-cdns/Shared/editorjs-paragraph/latest/paragraph.umd.min.js"></script>
<script src="~/local-cdns/Shared/editorjs-list/latest/list.umd.min.js"></script>
<script src="~/local-cdns/Shared/editorjs-checklist/latest/checklist.umd.min.js"></script>
<script src="~/local-cdns/Shared/editorjs-image/latest/image.umd.min.js"></script>
<script src="~/local-cdns/Shared/editorjs-html/3.4.0/edjsHTML.js"></script>
<script src="~/local-cdns/Shared/editorjs-drag-drop/latest/bundle.js"></script>
```

### UI Components

```html
<!-- SweetAlert (legacy) -->
<link href="~/local-cdns/Shared/sweetalert/1.1.3/sweetalert.css" rel="stylesheet">

<!-- SweetAlert2 -->
<script src="~/local-cdns/Shared/sweetalert2/11/sweetalert2.min.js"></script>

<!-- Toastr Notifications -->
<link href="~/local-cdns/Shared/toastr/latest/toastr.min.css" rel="stylesheet">
<script src="~/local-cdns/Shared/toastr/latest/toastr.min.js"></script>

<!-- DateTimePicker -->
<link href="~/local-cdns/Shared/datetimepicker/2.5.20/jquery.datetimepicker.min.css" rel="stylesheet">
<script src="~/local-cdns/Shared/datetimepicker/2.5.20/jquery.datetimepicker.full.min.js"></script>

<!-- Animate.css -->
<link href="~/local-cdns/Shared/animate-css/4.1.1/animate.min.css" rel="stylesheet">
```

### Real-time Communication

```html
<!-- SignalR -->
<script src="~/local-cdns/Shared/signalr/5.0.8/signalr.min.js"></script>
```

---

## 📁 Directory Structure

```
wwwroot/local-cdns/Shared/
├── animate-css/
│   └── 4.1.1/
│       └── animate.min.css
├── bootstrap/
│   ├── 4.3.1/
│   │   ├── css/bootstrap.min.css
│   │   └── js/bootstrap.min.js
│   ├── 4.5.2/
│   │   ├── css/bootstrap.min.css
│   │   └── js/bootstrap.min.js
│   └── 5.3.3/
│       ├── css/bootstrap.min.css
│       └── js/bootstrap.bundle.min.js
├── bootstrap-icons/
│   └── 1.11.3/
│       ├── bootstrap-icons.min.css
│       └── fonts/
│           ├── bootstrap-icons.woff
│           └── bootstrap-icons.woff2
├── chartjs/
│   ├── 2.9.4/
│   │   ├── Chart.js
│   │   └── Chart.min.js
│   └── latest/
│       └── chart.umd.min.js
├── chartjs-datalabels/
│   └── 2.0.0/
│       └── chartjs-plugin-datalabels.min.js
├── datatables/
│   └── 1.11.5/
│       ├── jquery.dataTables.css
│       └── jquery.dataTables.js
├── datatables-responsive/
│   └── 2.2.9/
│       ├── dataTables.responsive.min.js
│       └── responsive.dataTables.min.css
├── datetimepicker/
│   └── 2.5.20/
│       ├── jquery.datetimepicker.full.min.js
│       └── jquery.datetimepicker.min.css
├── editorjs/
│   └── latest/
│       └── editorjs.umd.min.js
├── editorjs-checklist/
│   └── latest/
│       └── checklist.umd.min.js
├── editorjs-drag-drop/
│   └── latest/
│       └── bundle.js
├── editorjs-header/
│   └── latest/
│       └── header.umd.min.js
├── editorjs-html/
│   └── 3.4.0/
│       └── edjsHTML.js
├── editorjs-image/
│   └── latest/
│       └── image.umd.min.js
├── editorjs-list/
│   └── latest/
│       └── list.umd.min.js
├── editorjs-paragraph/
│   └── latest/
│       └── paragraph.umd.min.js
├── fontawesome/
│   ├── 6.0.0-beta3/
│   │   ├── css/all.min.css
│   │   └── webfonts/
│   │       ├── fa-brands-400.woff2
│   │       ├── fa-regular-400.woff2
│   │       └── fa-solid-900.woff2
│   ├── 6.4.0/
│   │   ├── css/all.min.css
│   │   └── webfonts/...
│   ├── 6.5.0/
│   │   ├── css/all.min.css
│   │   └── webfonts/...
│   └── 6.5.1/
│       ├── css/all.min.css
│       └── webfonts/...
├── fonts/
│   ├── inter/
│   │   ├── inter.css
│   │   ├── inter-700.woff2
│   │   └── inter-regular.woff2
│   ├── inter-poppins.css
│   ├── manrope/
│   │   ├── manrope.css
│   │   └── manrope-regular.woff2
│   ├── poppins/
│   │   ├── poppins-700.woff2
│   │   └── poppins-regular.woff2
│   └── roboto/
│       ├── roboto.css
│       ├── roboto-300.woff2
│       ├── roboto-700.woff2
│       └── roboto-regular.woff2
├── html2canvas/
│   └── 1.4.1/
│       └── html2canvas.min.js
├── html2pdf/
│   └── latest/
│       └── html2pdf.bundle.min.js
├── jquery/
│   ├── 3.5.1/
│   │   └── jquery.min.js
│   ├── 3.6.0/
│   │   └── jquery.min.js
│   └── 3.6.4/
│       └── jquery.min.js
├── lucide/
│   └── latest/
│       └── lucide.min.js
├── pdf-lib/
│   └── 1.16.0/
│       └── pdf-lib.min.js
├── pdfjs/
│   ├── 2.10.377/
│   │   ├── pdf.min.js
│   │   └── pdf.worker.min.js
│   └── 3.11.174/
│       └── pdf.min.js
├── popper/
│   ├── 1.14.7/
│   │   └── popper.min.js
│   └── 1.16.0/
│       └── popper.min.js
├── signalr/
│   └── 5.0.8/
│       └── signalr.min.js
├── sweetalert/
│   └── 1.1.3/
│       └── sweetalert.css
├── sweetalert2/
│   └── 11/
│       └── sweetalert2.min.js
└── toastr/
    └── latest/
        ├── toastr.min.css
        └── toastr.min.js
```

---

## ⚠️ External Dependencies (Not Migrated)

These external resources are intentionally kept as CDN references:

| Resource | Reason |
|----------|--------|
| `apis.google.com/js/api.js` | Google Drive integration API |
| `js.live.net/v7.2/OneDrive.js` | OneDrive integration API |
| `cdn.tailwindcss.com` | Login/CallBack.cshtml only (JIT compilation required) |
| `fonts.googleapis.com/Material+Symbols` | Login/CallBack.cshtml only |

---

## 📋 Recommended Load Order

For optimal performance and dependency resolution:

```html
<!-- 1. CSS First -->
<link href="~/local-cdns/Shared/bootstrap/5.3.3/css/bootstrap.min.css" rel="stylesheet">
<link href="~/local-cdns/Shared/fontawesome/6.5.1/css/all.min.css" rel="stylesheet">
<link href="~/local-cdns/Shared/fonts/inter-poppins.css" rel="stylesheet">

<!-- 2. jQuery (required by many plugins) -->
<script src="~/local-cdns/Shared/jquery/3.6.0/jquery.min.js"></script>

<!-- 3. Bootstrap JS -->
<script src="~/local-cdns/Shared/bootstrap/5.3.3/js/bootstrap.bundle.min.js"></script>

<!-- 4. Other plugins (after jQuery) -->
<script src="~/local-cdns/Shared/datatables/1.11.5/jquery.dataTables.js" defer></script>
<script src="~/local-cdns/Shared/toastr/latest/toastr.min.js" defer></script>
```

---

## 🔄 Migration Notes

- All assets are self-hosted for offline capability
- Version-specific folders ensure multiple versions can coexist
- Font files are included alongside CSS for proper path resolution
- Original CDN references in views are commented out for reference
