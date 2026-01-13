# Gemini 3 AI Editor

A modular, AI-first image editor leveraging Gemini 3 for object detachment and inpainting.

## Project Structure

- **/app**
  - Route-level page containers (e.g., `/editor`).
- **/modules**
  - Feature-specific domains.
  - **/editor/core**: Central orchestrator, global state (Nodes), types, and constants.
  - **/editor/central**: The main workspace containing the Canvas and Dock.
  - **/editor/left-panel**: Media library and layer (Node) management.
  - **/editor/right-panel**: Contextual node property controls.
  - **/editor/services**: Gemini API integrations and AI pipelines.
  - **/editor/common**: Domain-specific shared components.
- **/components**
  - Global, atomic UI primitives (e.g., `Button`, `Spinner`).

## Core Concepts

- **Nodes**: Logical items placed on the canvas (images, extracted objects).
- **Layers**: The high-level UI representation of nodes in the Left Panel for user visibility and ordering.

## Theme System

Powered by custom CSS variables for seamless light/dark mode support.

- **Backgrounds (`bg-bk-[level]`)**
  - `bk-70`: Deepest layer (Body).
  - `bk-60`: Panel backgrounds.
  - `bk-50`: Workspace/Canvas area.
  - `bk-40`: Elevated elements (Dock/Modals).
- **Borders (`border-bd-[level]`)**
  - `bd-50`: Standard separators.
  - `bd-60`: High-contrast borders.
- **Text (`text-fg-[level]`)**
  - `fg-30`: Primary text / High contrast.
  - `fg-50`: Standard body text.
  - `fg-70`: Muted/Secondary labels.
- **Accents (`ac-[id]`)**
  - `ac-01`: Main interaction color (Blue).
  - `ac-02`: Hover/Active states.