/** Units of measure shared between the catalog action and the UI modal */
export const UNITS = [
  'g', 'kg', 'pcs', 'bunch', 'tray', 'box', 'bag',
  'packet', 'roll', 'ml', 'litre', 'hr', 'service',
] as const

export type UOM = (typeof UNITS)[number]
