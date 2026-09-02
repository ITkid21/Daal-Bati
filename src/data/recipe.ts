export interface RecipeStep {
  id: string
  ingredient: string
  label: string
  hindiLabel: string
  order: number
  target: string
  position: {
    left: string
    top: string
    width: string
    height: string
  }
  color: string
  icon: string
  description: string
}

// ─── Positions measured from frame3.jfif (1280×720 reference) ───────────────
// The progress bar + guidance bar sit at the very top inside the stage canvas,
// so ingredient top% values account for the ~10% header offset.
// Each rect covers the exact painted item in the artwork.
export const DAAL_PREPARATION_RECIPE: RecipeStep[] = [
  {
    id: 'dal',
    ingredient: 'dal',
    label: 'Dal (Pulses)',
    hindiLabel: 'दाल',
    order: 1,
    target: 'daal-pot',
    // Large round clay bowl — bottom-left corner
    position: { left: '1%', top: '68%', width: '16%', height: '24%' },
    color: '#D4AF37',
    icon: '🥣',
    description: 'Fresh washed yellow lentils'
  },
  {
    id: 'water',
    ingredient: 'water',
    label: 'Water',
    hindiLabel: 'पानी',
    order: 2,
    target: 'daal-pot',
    // Tall clay matka — left-centre, above small cup
    position: { left: '25%', top: '72%', width: '11%', height: '23%' },
    color: '#4A90E2',
    icon: '🏺',
    description: 'Pure water for simmering'
  },
  {
    id: 'turmeric',
    ingredient: 'turmeric',
    label: 'Turmeric',
    hindiLabel: 'हल्दी',
    order: 3,
    target: 'daal-pot',
    // Yellow jar on wooden shelf (leftmost)
    position: { left: '3%', top: '60%', width: '3%', height: '15%' },
    color: '#F4A460',
    icon: '🫙',
    description: 'Golden ground turmeric'
  },
  {
    id: 'salt',
    ingredient: 'salt',
    label: 'Rock Salt',
    hindiLabel: 'नमक',
    order: 4,
    target: 'daal-pot',
    // White/pale jar on wooden shelf (2nd from left)
    position: { left: '13%', top: '60%', width: '6%', height: '15%' },
    color: '#F5F5F5',
    icon: '🧂',
    description: 'Pure rock salt'
  },
  {
    id: 'tomato',
    ingredient: 'tomato',
    label: 'Tomato',
    hindiLabel: 'टमाटर',
    order: 5,
    target: 'daal-pot',
    // Red bowl — right counter, upper row
    position: { left: '74%', top: '73%', width: '11%', height: '16%' },
    color: '#E63946',
    icon: '🍅',
    description: 'Diced ripe tomatoes'
  },
  {
    id: 'ginger',
    ingredient: 'ginger',
    label: 'Ginger',
    hindiLabel: 'अदरक',
    order: 6,
    target: 'daal-pot',
    // Yellowish ginger bowl — right counter, lower-left of group
    position: { left: '71%', top: '83%', width: '13%', height: '18%' },
    color: '#CD853F',
    icon: '🧄',
    description: 'Freshly grated ginger'
  },
  {
    id: 'green-chilli',
    ingredient: 'green-chilli',
    label: 'Green Chilli',
    hindiLabel: 'हरी मिर्च',
    order: 7,
    target: 'daal-pot',
    // Green bowl — right counter, rightmost
    position: { left: '84%', top: '73%', width: '13%', height: '18%' },
    color: '#228B22',
    icon: '🌶️',
    description: 'Spicy green chillies'
  }
]

export const INGREDIENT_COLORS: Record<string, string> = {
  'dal': '#D4AF37',
  'water': '#4A90E2',
  'turmeric': '#FFB300',
  'salt': '#FFFFFF',
  'tomato': '#E63946',
  'ginger': '#D2B48C',
  'green-chilli': '#4CAF50',
  'flour': '#E8D3A2',
  'sooji': '#F7E7CE',
  'ajwain': '#8B5A2B',
  'ghee': '#FFD700',
  'water-baati': '#5DADE2',
  'baati-raw': '#D4AF37'
}

export const BAATI_PREPARATION_RECIPE: RecipeStep[] = [
  {
    id: 'flour',
    ingredient: 'flour',
    label: 'Coarse Wheat Flour',
    hindiLabel: 'गेहूं का आटा',
    order: 1,
    target: 'central-plate',
    // White flour mound with scoop on left table
    position: { left: '26%', top: '78%', width: '12%', height: '14%' },
    color: '#E8D3A2',
    icon: '🌾',
    description: 'Coarse whole wheat flour (Gehu Aata)'
  },
  {
    id: 'sooji',
    ingredient: 'sooji',
    label: 'Sooji (Rava)',
    hindiLabel: 'सूजी',
    order: 2,
    target: 'central-plate',
    // Small clay bowl with white grain at bottom right
    position: { left: '65%', top: '84%', width: '10%', height: '12%' },
    color: '#F7E7CE',
    icon: '🥣',
    description: 'Semolina for signature crispness'
  },
  {
    id: 'ajwain',
    ingredient: 'ajwain',
    label: 'Ajwain (Carom Seeds)',
    hindiLabel: 'अजवाइन',
    order: 3,
    target: 'central-plate',
    // Glass spice jar on the wooden shelf
    position: { left: '72%', top: '50%', width: '10%', height: '14%' },
    color: '#8B5A2B',
    icon: '🌿',
    description: 'Aromatic crushed carom seeds'
  },
  {
    id: 'ghee',
    ingredient: 'ghee',
    label: 'Desi Ghee (Moyen)',
    hindiLabel: 'शुद्ध देसी घी',
    order: 4,
    target: 'central-plate',
    // Brass pot with golden ghee and spoon on bottom right
    position: { left: '77%', top: '78%', width: '12%', height: '14%' },
    color: '#FFD700',
    icon: '🧈',
    description: 'Pure melted desi ghee for shortening'
  },
  {
    id: 'water-baati',
    ingredient: 'water-baati',
    label: 'Lukewarm Water',
    hindiLabel: 'गुनगुना पानी',
    order: 5,
    target: 'central-plate',
    // Copper lota with water next to the center dish
    position: { left: '68%', top: '64%', width: '11%', height: '14%' },
    color: '#5DADE2',
    icon: '🏺',
    description: 'Water to knead firm Baati dough'
  },
  {
    id: 'baati-raw',
    ingredient: 'baati-raw',
    label: 'Form & Plate Baati',
    hindiLabel: 'तैयार बाटी',
    order: 6,
    target: 'central-plate',
    // Ready dough ball next to plate
    position: { left: '26%', top: '68%', width: '14%', height: '14%' },
    color: '#E0A93B',
    icon: '🧆',
    description: 'Traditional round Baati ready for the thali'
  }
]

