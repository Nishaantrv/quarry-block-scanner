# Quarry Block Scanner

A comprehensive tool designed for granite quarry operations to manage block markings, calculate CBM (Net/Gross), and generate shipping documentation efficiently.

## Features

### 🪨 Block Marking Management
- **Detailed Recording**: Capture block numbers, dimensions (L x W x H), and allowances.
- **Smart Calculations**: Automatically calculates Net CBM (with allowance) and Gross CBM (without allowance).
- **Flexible Modes**:
    - **Net Mode**: Applies standard allowance logic for net volume.
    - **Gross Mode**: Rounds up dimensions for gross volume calculations.

### 📄 Documentation & Export
- **Dynamic Generation**: Instantly create Packing Lists and Proforma Invoices.
- **Support for Multiple Formats**:
    - Gross Packing List / Invoice
    - Net Packing List / Invoice
- **Customizable Headers**: Edit company profiles, consignee details, vessel info, and more directly before printing.

### 🛠️ Technical Stack
- **Framework**: React with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS & shadcn/ui
- **State Management**: Zustand
- **Backend/Auth**: Supabase

## Getting Started

To run this project locally:

1.  **Clone the repository**
    ```sh
    git clone <YOUR_GIT_URL>
    ```

2.  **Install dependencies**
    ```sh
    npm install
    ```

3.  **Start the development server**
    ```sh
    npm run dev
    ```

4.  **Open in Browser**
    Visit `http://localhost:8080` (or the port shown in your terminal).

## Usage Guide

1.  **New Marking**: Start a new session, enter customer and vessel details.
2.  **Add Blocks**: Input dimensions for each granite block.
3.  **Review**: Check the calculated CBM and total weights.
4.  **Export**: Go to the Export page to generate and print your Packing List or Invoice.

## Recent Updates
- **PWA Enhancements**: Improved caching strategy for faster updates.
- **Auth Flow**: Better handling of sign-up redirects and email confirmation messaging.
