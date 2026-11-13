# Garment Quality Analytics (QMS) - Northern Fashions Ltd.

A Digital Quality Intelligence System tailored for **Northern Fashions Ltd. (NFL)** to process, analyze, and monitor **BESTSELLER** buyer garment quality inspection reports (OQL/AQL), automated defect classifications, Root Cause Analysis (5-Why), and Corrective & Preventive Action (CAPA) tracking.

---

## 🚀 Key Features

- **Automated Report Extraction:** Parse and extract inspection data from BESTSELLER inspection report PDFs.
- **Brand Auto-Resolution:** Automatically maps styles to buyer brands:
  - `13xxxxxx` → **NAME IT**
  - `15xxxxxx` → **ONLY**
  - `22xxxxxx` → **ONLY&SONS**
- **23 Standard Defect Categories:** Automated categorization matching the BESTSELLER apparel quality dictionary (Fabric, Pockets, Neck/Collar, Plackets, Hem, Seams, Cleanliness, Pressing, etc.).
- **Observed Quality Level (OQL) Engine:**
  $$\text{OQL} = \left(\frac{\text{Total Defects Found}}{\text{Sample Quantity Inspected}}\right) \times 100\%$$
- **Fiscal Calendar Alignment:** Aligned to garment industry manufacturing cycle (August through July fiscal year).
- **CAPA & 5-Why RCA:** Dedicated corrective action tracking workflow with root cause analysis and post-implementation effectiveness monitoring.
- **Export Center:** One-click export to Excel (`.xlsx`) inspection registers and executive PowerPoint (`.pptx`) slides.
- **Offline PWA Support:** Installable Progressive Web App (PWA) with offline demo mode and Cloud Firestore live sync.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Motion
- **Data & Charts:** Recharts, Lucide React
- **Document Processing:** PDF.js (`pdfjs-dist`), SheetJS (`xlsx`), PptxGenJS
- **Backend / Persistence:** Firebase (Cloud Firestore & Auth), Google GenAI SDK
- **Testing:** Node.js Native Test Runner with TSX

---

## 📦 Getting Started

### 1. Prerequisites
- **Node.js**: v20 or later
- **npm** or **bun**

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Copy the environment template and provide your API keys if using server-side Gemini AI assistance:
```bash
cp .env.example .env
```

### 4. Development Server
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

### 5. Build for Production
```bash
npm run build
```

### 6. Run Tests
```bash
npm test
```

---

## 📂 Project Architecture

```text
├── public/                 # Static assets, web manifest, and PWA icons
├── src/
│   ├── components/         # Modular views (Dashboard, Ingestion, CAPA, Analytics, Reports)
│   ├── context/            # Global AppContext (hybrid offline demo + Firestore sync)
│   ├── data/               # 23 Defect categories master data & factory demo datasets
│   ├── lib/                # Firebase client and connection management
│   ├── services/           # Firestore service endpoints
│   ├── types/              # Comprehensive TypeScript interfaces
│   └── utils/              # OQL calculator, PDF parser, and export helpers
└── tests/                  # Unit test suite for OQL formulas and brand classification
```

---

## 📄 License
SPDX-License-Identifier: Apache-2.0
