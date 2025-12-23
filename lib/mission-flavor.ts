export interface MissionFlavor {
  titleKey: string;
  descriptionKey: string;
}

export const getMissionFlavor = (category: string): MissionFlavor => {
  // Normalize category to lowercase for simpler key matching if needed,
  // but we'll use the capitalized category from DB as the base for keys.
  // Categories: 'Creative', 'Active', 'Relaxing', 'Skill', 'Entertainment', 'Other'

  // We will define multiple variants per category in translation files
  // e.g., missions.creative.title_1, missions.creative.desc_1

  const variant = Math.floor(Math.random() * 15) + 1; // 1 to 15

  // Fallback for unknown categories
  // Fallback for unknown categories
  if (category === "Custom") {
    const customVariant = Math.floor(Math.random() * 5) + 1; // 1 to 5
    return {
      titleKey: `missions.custom.title_${customVariant}`,
      descriptionKey: `missions.custom.desc_${customVariant}`,
    };
  }

  const safeCategory = [
    "Creative",
    "Active",
    "Relaxing",
    "Skill",
    "Entertainment",
    "Social",
    "Messaging",
    "Forums",
    "Lifestyle",
    "Other",
  ].includes(category)
    ? category.toLowerCase()
    : "other";

  return {
    titleKey: `missions.${safeCategory}.title_${variant}`,
    descriptionKey: `missions.${safeCategory}.desc_${variant}`,
  };
};
