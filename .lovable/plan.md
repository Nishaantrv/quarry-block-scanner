

# Changes: Remove Stone Descriptions, Rename Dimensions, Add Isometric Block Preview

## 1. Remove Stone Description Section

**NewMarking.tsx (New Marking form)**: Remove the entire "Stone Description" section containing Marks & Nos, Stone Type / Color, and Quarry Code fields.

**EditPage.tsx**: Remove the "Stone Type" field from the HeaderEditor.

**MarkingPage.tsx header**: Remove the `stoneType` display line from the marking page header.

**ExportPage.tsx**: The export documents still reference `stoneType`, `marksAndNos`, and `quarryCode` from the header data -- these fields will remain in the type definition (with empty defaults) so exports don't break, but they won't be shown in any input forms.

**types/inspection.ts**: Keep the fields in `InspectionHeader` for backward compatibility with saved data, but they will simply remain empty for new inspections.

---

## 2. Rename L1/L2/L3 to Length/Height/Width

Update labels across all pages:

- **MarkingPage.tsx**: Change DimensionInput labels from "L1", "L2", "L3" to "Length", "Height", "Width". Update the label width styling to accommodate longer text. Update the confirmation toast to show "L x H x W" format.
- **EditPage.tsx**: Update column headers and edit inputs from L1/L2/L3 to Length/Height/Width (or abbreviated L/H/W in the compact block list).
- **ExportPage.tsx**: Update packing list table headers from L1/L2/L3 to Length/Height/Width.

Note: The underlying data model (`Block.l1`, `Block.l2`, `Block.l3`) stays unchanged to avoid breaking saved data. Only the display labels change.

---

## 3. Add Isometric Block Preview Component

Create a new component: **`src/components/IsometricBlockPreview.tsx`**

### How it works:
- Takes `length`, `height`, `width` as numbers (in cm) plus a `color` prop
- Pure SVG rendering -- no external libraries, no 3D engine
- Uses isometric projection math: x-axis at 30 degrees right, y-axis at 30 degrees left, z-axis vertical
- Normalizes the largest dimension to fit within 220px while preserving proportions
- Draws three visible faces of the cuboid (front, top, right side)
- Applies lighter shade to top face, darker shade to side face using HSL color manipulation
- Shows dimension labels on edges with values in cm
- If any dimension is zero, negative, or empty: shows "Invalid dimensions" text instead
- Wrapped in `React.memo` so it only re-renders when dimensions or color change

### Isometric projection math:
- Project 3D coordinates to 2D using standard isometric angles (30 degrees)
- Front face: rectangle defined by height (vertical) and width (along 30-degree right axis)
- Top face: parallelogram defined by length and width
- Side face: parallelogram defined by length and height

### Color picker:
- Add a small color input (`<input type="color">`) next to the preview
- Default color: `#8B8680` (stone gray)
- Store selected color in component local state (does not affect calculations or data model)
- Derive top face color (20% lighter) and side face color (20% darker) from the chosen color

### Integration into MarkingPage.tsx:
- Place the preview between the dimension inputs and the ADD BLOCK button
- Pass the current `l1`/`l2`/`l3` input values as length/height/width
- Preview updates instantly as the user types

---

## Technical Details

### Files modified:
1. **src/pages/NewMarking.tsx** -- Remove Stone Description section
2. **src/pages/MarkingPage.tsx** -- Rename labels, integrate IsometricBlockPreview
3. **src/pages/EditPage.tsx** -- Rename labels, remove Stone Type from header editor
4. **src/pages/ExportPage.tsx** -- Rename table headers
5. **src/components/IsometricBlockPreview.tsx** -- New component (pure SVG isometric cuboid)

### Files NOT modified:
- `types/inspection.ts` -- Fields kept for backward compatibility
- `store/inspectionStore.ts` -- No changes needed
- `lib/calculations.ts` -- No changes needed

