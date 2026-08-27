web application/stitch/projects/18321838377741772890/screens/2d7875ef58d148f2a81302292009aaab
# VocaTarget Design System: Terra

## 1. Design Identity & Principles
VocaTarget is an AI-powered TOEIC Part 5 problem generator focused on efficiency and reliability. The design reflects a professional, calm, and focused learning environment.

*   **Concise**: Remove distractions. Focus purely on the vocabulary and the problem.
*   **Reliable**: Use deep greens and structured layouts to build trust in AI-generated content.
*   **Intuitive**: A single-screen flow (State Transition) that guides the user from input to result without interruption.

## 2. Color Palette
The "Terra" palette uses nature-inspired greens and soft surfaces to reduce eye strain during study.

*   **Primary (Terra Green)**: `#4A7C59` - Used for primary actions, progress indicators, and branding.
*   **Surface**: `#FAF6F0` - Warm off-white for the main background to reduce contrast glare.
*   **Surface Container**: `#F5F1EA` - Used for grouping input areas and problem cards.
*   **Text (On Surface)**: `#1C1C1C` - High legibility for problem stems and choices.
*   **Text Muted**: `#6B6B6B` - For secondary labels and informational footers.
*   **Error/Alert**: `#BA1A1A` - For inline error messages (EX-3, etc.).

## 3. Typography
*   **Primary Font**: `Literata` (Serif)
    *   Used for problem stems, choices, and explanations to mimic official TOEIC materials and improve long-form reading comfort.
*   **Secondary Font**: `Inter` or `Sans-serif`
    *   Used for UI elements, buttons, and labels for modern clarity.
*   **Scale**:
    *   **Headline**: 24px - 32px (Bold)
    *   **Body (Problem Stem)**: 18px (Regular, Line-height 1.6)
    *   **Labels/Buttons**: 14px - 16px (Medium)

## 4. Components & Shapes
*   **Roundness**: `12px` (Round-Twelve) applied to all containers, buttons, and inputs for a soft, modern feel.
*   **Elevation**: Flat or very low shadows. Depth is created through surface color shifts rather than heavy shadows.
*   **Buttons**:
    *   **Primary**: Filled Terra Green, white text. Disabled state: Greyed out with descriptive tooltip/inline text.
    *   **Segmented/Toggle**: For difficulty selection, showing clear active/inactive states through color fills.

## 5. Interaction Guidelines (PRD Alignment)
*   **Single-Screen Transition**: Page-level routing is forbidden. Transitions between Input → Loading → Solving → Result must be smooth state changes.
*   **Immediate Feedback**: Explanations must render within 200ms of a choice selection.
*   **Exception UI**: 
    *   **EX-2 (Difficulty)**: Button remains disabled until a choice is made.
    *   **EX-3 (Non-English)**: Inline red text warning below input.
*   **Loading State**: A calm, centered spinner with text that updates based on time elapsed (EX-10).

## 6. Layout Specs
*   **Max Width**: 800px (Desktop) to keep line lengths readable for English passages.
*   **Padding**: Generous whitespace (`32px` - `48px` between sections) to avoid a cluttered "exam" feel.
